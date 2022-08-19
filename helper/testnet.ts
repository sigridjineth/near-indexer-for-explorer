import { startStream, types } from 'near-lake-framework';
import { Logger } from "tslog";
const log: Logger = new Logger();

const lakeConfigTestnet: types.LakeConfig = {
    s3BucketName: "near-lake-data-testnet",
    s3RegionName: "eu-central-1",
    startBlockHeight: 42376888,
};

const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'test',
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
    "          FOREIGN KEY (FK_PUBLIC_KEY_ID)\n" +
    "          REFERENCES PUBLIC_KEY_TESTNET(id)\n" +
    ");"
)

connection.query(
    "CREATE UNIQUE INDEX UNIQUE_PUBLIC_KEY ON PUBLIC_KEY_TESTNET (public_key_string)"
)

async function getPublicKeyId(signerId){
    let sql = "SELECT * FROM PUBLIC_KEY_TESTNET WHERE public_key_string = " + "'" + signerId + "'" + ";";
    const results = await connection.promise().query(sql);
    console.log(" SIGNER ID ", signerId);
    console.log(" RESULTS ", results[0]);

    return results[0][0].id;
}

async function insertPublicKeySignerId(signerId) {
    let sql = "INSERT INTO PUBLIC_KEY_TESTNET (public_key_string) VALUES "+ "('" + signerId + "')" + ";";
    const results = await connection.promise().execute(sql);
    return results[0];
}

async function insertAddressIds(publicKeyId, signer) {
    let sql = "INSERT INTO ACCOUNT_IDS_TESTNET (FK_PUBLIC_KEY_ID, address_id) VALUES "+ "(" + publicKeyId + "," + "'" + signer + "'" + ")";
    const results = await connection.promise().execute(sql);
    return results[0];
}

async function handleStreamerMessage(streamerMessage: types.StreamerMessage): Promise<void> {
    try {
        log.info("Block Height >>>>>>>>>", streamerMessage.block.header.height);

        for (const shard of streamerMessage.shards) {
            log.info(" shardId: ", shard.shardId);

            for (const receiptExecutionOutcome of shard.receiptExecutionOutcomes) {
                const action = receiptExecutionOutcome.receipt.receipt['Action'];

                // if isAddKey
                if (action.actions[0].AddKey) {
                    const signer = receiptExecutionOutcome.receipt.receipt['Action'].signerId;
                    const signerPublicKey = receiptExecutionOutcome.receipt.receipt['Action'].signerPublicKey;

                    log.debug(" signerId: ", signer);
                    log.debug(" signerPublicKey ", signerPublicKey);

                    // insert public key signer id
                    // TODO: check already exist so that skipping auto increment primary key not happened
                    await insertPublicKeySignerId(signerPublicKey);

                    // insert address ids
                    const publicKeyId = await getPublicKeyId(signerPublicKey);
                    await insertAddressIds(publicKeyId, signer);
                }
            }
        }
    } catch (e) {
        log.warn(e);
    }
}

(async () => {
    log.info(" NEAR LAKE TESTNET STARTING >>>>>>>>>>>>>>>> PROOF OF CONCEPT FOR WELLDONE CODE")
    await startStream(lakeConfigTestnet, handleStreamerMessage);
})();
