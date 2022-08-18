import { startStream, types } from 'near-lake-framework';

const lakeConfig: types.LakeConfig = {
    s3BucketName: "near-lake-data-mainnet",
    s3RegionName: "eu-central-1",
    startBlockHeight: 72110721,
};

const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'near_data',
});

connection.connect();

connection.query(
    "DROP TABLE IF EXISTS `ACCOUNT_IDS`"
)

connection.query(
    "DROP TABLE IF EXISTS `PUBLIC_KEY`"
)

connection.query(
    "CREATE TABLE IF NOT EXISTS PUBLIC_KEY (\n" +
    "         id    INT PRIMARY KEY AUTO_INCREMENT,\n" +
    "         public_key_string  VARCHAR(100)       NOT NULL DEFAULT ''\n" +
    "       );"
)

connection.query(
    "CREATE TABLE IF NOT EXISTS ACCOUNT_IDS (\n" +
    "          id    INT PRIMARY KEY,\n" +
    "          address_id_string VARCHAR(100) NOT NULL DEFAULT '',\n" +
    "          FK_PUBLIC_KEY_ID INT,\n" +
    "          FOREIGN KEY (FK_PUBLIC_KEY_ID)\n" +
    "          REFERENCES PUBLIC_KEY(id)\n" +
    ");"
)

connection.query(
    "CREATE UNIQUE INDEX UNIQUE_PUBLIC_KEY ON PUBLIC_KEY (public_key_string)"
)

connection.query(
    "INSERT INTO PUBLIC_KEY (public_key_string) VALUES (\"007ac9d680d773d5e01ebaf418b6037409f27c132a4d5b22a48343214bc91568\") "
)

async function checkIfExists(signerId){
    let sql = "SELECT * FROM PUBLIC_KEY WHERE public_key_string = " + "'" + signerId + "'" + ";";
    const results = await connection.promise().query(sql);
    console.log(" SIGNER ID ", signerId);
    console.log(" RESULTS ", results[0]);
    return results[0] === [];
}

async function insertPublicKeySignerId(signerId) {
    let sql = "INSERT INTO PUBLIC_KEY (public_key_string) VALUES "+ "('" + signerId + "')" + ";";
    const results = await connection.promise().execute(sql);
    return results[0];
}

async function handleStreamerMessage(streamerMessage: types.StreamerMessage): Promise<void> {
    try {
        console.log("Block Height >>>>>>>>>", streamerMessage.block.header.height);
        for (const shard of streamerMessage.shards) {
            console.log(" shardId: ", shard.shardId);
            for (const receiptExecutionOutcome of shard.receiptExecutionOutcomes) {
                const action = receiptExecutionOutcome.receipt.receipt['Action'];
                // if isAddKey
                if (action.actions[0].AddKey) {
                    const signerId = receiptExecutionOutcome.receipt.receipt['Action'].signerId;
                    console.log(" signerId: ", signerId);
                    console.log(" signerPublicKey ", receiptExecutionOutcome.receipt.receipt['Action'].signerPublicKey);

                    console.log("checkIfExists ", await checkIfExists(signerId));
                    if (!await checkIfExists(signerId)) {
                        const receiptAfterInsert = await insertPublicKeySignerId(signerId);
                        console.log("receiptAfterInsert ")
                    }
                }
            }
        }
    } catch (e) {
        console.log("^^", e);
    }
}

(async () => {
    await startStream(lakeConfig, handleStreamerMessage);
})();
