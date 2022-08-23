import { startStream, types } from 'near-lake-framework';
import { Logger } from "tslog";
import {DeleteAccountAction} from "near-lake-framework/dist/types";
const log: Logger = new Logger();

const lakeConfigTestnet: types.LakeConfig = {
    s3BucketName: "near-lake-data-testnet",
    s3RegionName: "eu-central-1",
    startBlockHeight: 42488000,
};

const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'near_data',
});

log.info(" MySQL Connection Established For Testnet Inserting >>>>>>>>>>>>>>>>>>>>");
connection.connect();

// setting for testnet
connection.query(
    "DROP TABLE IF EXISTS `ACCOUNT_IDS_TESTNET`"
)

connection.query(
    "DROP TABLE IF EXISTS `PUBLIC_KEY_TESTNET`"
)

connection.query(
    "CREATE TABLE IF NOT EXISTS PUBLIC_KEY_TESTNET (\n" +
    "         id    INT PRIMARY KEY AUTO_INCREMENT,\n" +
    "         public_key_string  VARCHAR(100)       NOT NULL DEFAULT ''\n" +
    "       );"
)

connection.query(
    "CREATE TABLE IF NOT EXISTS ACCOUNT_IDS_TESTNET (\n" +
    "          id    INT PRIMARY KEY AUTO_INCREMENT,\n" +
    "          address_id VARCHAR(100) NOT NULL DEFAULT '',\n" +
    "          FK_PUBLIC_KEY_ID INT,\n" +
    "          block_height BIGINT NOT NULL,\n" +
    "          receipt_hash VARCHAR(100),\n" +
    "          delete_receipt_hash VARCHAR(100),\n" +
    "          save_type VARCHAR(100) NOT NULL,\n" +
    "          is_deleted BOOLEAN NOT NULL DEFAULT 0," +
    "          FOREIGN KEY (FK_PUBLIC_KEY_ID)\n" +
    "          REFERENCES PUBLIC_KEY_TESTNET(id)\n" +
    ");"
)

connection.query(
    "CREATE UNIQUE INDEX UNIQUE_PUBLIC_KEY ON PUBLIC_KEY_TESTNET (public_key_string)"
)

connection.query(
    "CREATE UNIQUE INDEX UNIQUE_ADDRESS_ID_FK_PUBLIC_KEY_ID ON ACCOUNT_IDS_TESTNET (address_id, FK_PUBLIC_KEY_ID, is_deleted);"
)

async function getPublicKeyId(signerId){
    let sql = "SELECT * FROM PUBLIC_KEY_TESTNET WHERE public_key_string = " + "'" + signerId + "'" + ";";
    const results = await connection.promise().query(sql);
    log.debug(" SIGNER ID ", signerId);
    log.debug(" RESULTS ", results[0]);

    return results[0][0].id;
}

async function removeAllAddressIdsAfterJoiningPublicKey(public_key_string, addressId) {
    let sql = "DELETE FROM ACCOUNT_IDS_TESTNET WHERE FK_PUBLIC_KEY_ID = " + "(SELECT id FROM PUBLIC_KEY_TESTNET WHERE public_key_string = " + "'" + public_key_string + "'" + ")" + "AND address_id = " + "'" + addressId + "'" + ";";
    const results = await connection.promise().execute(sql);
    log.debug("REMOVE RESULTS ", results);
    return results[0];
}

async function softDeleteAllAddressIdsAfterJoiningPublicKey(public_key_string, addressId, deleteReceiptHash) {
    let sql = "UPDATE ACCOUNT_IDS_TESTNET SET is_deleted = 1, delete_receipt_hash = " + "'" + deleteReceiptHash + "'" + " WHERE FK_PUBLIC_KEY_ID = " + "(SELECT id FROM PUBLIC_KEY_TESTNET WHERE public_key_string = " + "'" + public_key_string + "'" + ")" + "AND address_id = " + "'" + addressId + "'" + ";";
    const results = await connection.promise().execute(sql);
    log.debug("SOFT DELETE RESULTS", results);
    return results[0];
}

async function insertPublicKeySignerId(signerId, blockHeight) {
    let sql = "INSERT INTO PUBLIC_KEY_TESTNET (public_key_string) VALUES "+ "('" + signerId + "')" + ";";
    const results = await connection.promise().execute(sql);
    log.debug("INSERT PUBLIC KEY RESULTS", signerId, blockHeight);
    return results[0];
}

async function insertAddressIds(publicKeyId, addressId, blockHeight, receiptHash, saveType) {
    const NOT_DELETED = 0;
    let sql = "INSERT INTO ACCOUNT_IDS_TESTNET (FK_PUBLIC_KEY_ID, address_id, block_height, receipt_hash, save_type, is_deleted) VALUES " + "(" + publicKeyId + ", " + "'" + addressId + "', " + blockHeight + ", " + "'" + receiptHash + "', " + "'" + saveType + "', " + NOT_DELETED + ")" + ";";
    const results = await connection.promise().execute(sql);
    log.debug("INSERT ADDRESS IDS RESULTS", results);
    return results[0];
}

async function handleStreamerMessage(streamerMessage: types.StreamerMessage): Promise<void> {
    try {
        const blockHeight = streamerMessage.block.header.height;
        log.info("Block Height >>>>>>>>>", blockHeight);

        for (const shard of streamerMessage.shards) {
            log.info(" shardId: ", shard.shardId);

            for (const receiptExecutionOutcome of shard.receiptExecutionOutcomes) {
                const actionList = receiptExecutionOutcome.receipt.receipt['Action'];

                log.info(" actionList: ", actionList, streamerMessage.block.header.height, shard.shardId);

                // if there is some actions
                if (actionList.actions !== []) {

                    for (const action of actionList.actions) {
                        log.debug(" receiptExecutionOutcome ACTION NOW >>>>>>>>>>>>>>>>>>>>>>>>>>>> ", action);

                        // if create account
                        if (action === 'CreateAccount') {
                            log.debug(" >>>>>>>>>>>>>>>>>>>>>>>>>>>>>> CREATE ACCOUNT >>>>>>>>>>>>>>>>>>>>>>>>>>>> ")
                            for (const state of shard.stateChanges) {
                                const receiptHash = receiptExecutionOutcome.receipt.receiptId;

                                log.info(" STATE ", state, " BLOCK HEIGHT ", blockHeight, " RECEIPT HASH ", receiptHash);

                                if (state['type'] === 'access_key_update') {
                                    log.info("ACCESS_KEY_UPDATE");

                                    const saveType = state['change']['accessKey']['permission']['FunctionCall'] ? 'FunctionCall' :
                                        state['change']['accessKey']['permission'] === 'FullAccess' ? 'FullAccess' : 'ERROR';
                                    const addressId = state['change']['accountId'];
                                    const signerPublicKey = state['change']['publicKey'];

                                    log.info(" ACCOUNT ID ", addressId, " PUBLIC KEY ", signerPublicKey, " BLOCK HEIGHT ", blockHeight);

                                    try {
                                        await insertPublicKeySignerId(signerPublicKey, blockHeight);
                                    } catch (e) {
                                        log.error("Duplicate Entry", streamerMessage.block.header.height, shard.shardId);
                                    }
                                    const publicKeyId = await getPublicKeyId(signerPublicKey);
                                    await insertAddressIds(publicKeyId, addressId, blockHeight, receiptHash, saveType);
                                }
                            }
                            break;
                        }

                        // if that is AddKey action, not creating new account
                        if (action.AddKey) {
                            log.debug("receiptExecutionOutcome ADD KEY >>>>>>>>>>>>>>>>>>>>")

                            const addressId = receiptExecutionOutcome.receipt.receipt['Action'].signerId;
                            const signerPublicKey = action.AddKey.publicKey;

                            log.info(" receiptExecutionOutcome addressId: ", addressId, streamerMessage.block.header.height, shard.shardId);
                            log.info(" receiptExecutionOutcome signerPublicKey ", signerPublicKey, streamerMessage.block.header.height, shard.shardId);

                            try {
                                await insertPublicKeySignerId(signerPublicKey, blockHeight);
                            } catch (e) {
                                log.error("Duplicate Entry", streamerMessage.block.header.height, shard.shardId);
                            }

                            const publicKeyId = await getPublicKeyId(signerPublicKey);
                            const receiptHash = receiptExecutionOutcome.receipt.receiptId;
                            const saveType = action.AddKey.accessKey.permission.toString() === 'FullAccess' ? 'FullAccess' : 'FunctionCall';

                            await insertAddressIds(publicKeyId, addressId, blockHeight, receiptHash, saveType);
                        }

                        // if that is DeleteKey action
                        if (action.DeleteKey) {
                            log.debug("DELETE KEY >>>>>>>>>>>>>>>>>>>>")

                            const addressId = receiptExecutionOutcome.receipt.receipt['Action'].signerId;
                            const signerPublicKey = action.DeleteKey.publicKey;
                            const deleteReceiptHash = receiptExecutionOutcome.receipt.receiptId;

                            log.info(" signerId: ", addressId, streamerMessage.block.header.height, shard.shardId);
                            log.info(" signerPublicKey ", signerPublicKey, streamerMessage.block.header.height, shard.shardId);

                            await softDeleteAllAddressIdsAfterJoiningPublicKey(signerPublicKey, addressId, deleteReceiptHash);
                        }
                    }
                }
            }
        }
    } catch (e) {
        log.info(" SOME THING ERROR", e);
        log.info("FAILED Block Height >>>>>>>>>", streamerMessage.block.header.height);
    }
}

(async () => {
    log.info(" NEAR LAKE TESTNET STARTING >>>>>>>>>>>>>>>> PROOF OF CONCEPT FOR WELLDONE CODE")
    await startStream(lakeConfigTestnet, handleStreamerMessage);
})();
