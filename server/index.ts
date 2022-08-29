import express, {Request, Response} from 'express';
import {Logger} from "tslog";

const app = express();
const cors = require('cors')

const log: Logger = new Logger({ name: " NEAR LAKE SERVER IS NOW RUNNING >>>>>>>>>>>>>> WELLDONE CODE" });

app.use(express.json());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: process.env.MYSQL_DID,
    password: process.env.MYSQL_PWD,
    database: 'near_data',
});

const MAINNET_SUFFIX = ".near";
const TESTNET_SUFFIX = ".testnet";

const MAINNET_PREFIX = "mainnet:";
const TESTNET_PREFIX = "testnet:";

log.info(" MySQL Connection Established For Mainnet Inserting >>>>>>>>>>>>>>>>>>>>>>>>>> ");
connection.connect();

async function findMainnetAccountIds(publicKeyString: string) {
    let sql = "SELECT address_id FROM ACCOUNT_IDS_MAINNET WHERE is_deleted = 0 AND FK_PUBLIC_KEY_ID = (SELECT id FROM PUBLIC_KEY_MAINNET WHERE public_key_string = " + "'" + publicKeyString + "'" + ");";
    const results = await connection.promise().query(sql);
    return results[0];
}

async function findTestnetAccountIds(publicKeyString: string) {
    let sql = "SELECT address_id FROM ACCOUNT_IDS_TESTNET WHERE is_deleted = 0 AND FK_PUBLIC_KEY_ID = (SELECT id FROM PUBLIC_KEY_TESTNET WHERE public_key_string = " + "'" + publicKeyString + "'" + ");";
    const results = await connection.promise().query(sql);
    return results[0];
}

const addNetworkTypePrefixToResults = (results, networkSuffix, networkPrefix) => {
    return [...new Set(results.map(result => {
        log.debug(" addNetworkTypePrefixToResults ", result);
        return result['address_id'].includes(networkSuffix) ? result.address_id : networkPrefix + result.address_id
    }))]
};

async function getLastMainnetAccountIdsBlockHeight() {
    let sql = "SELECT MAX(block_height) AS block_height FROM ACCOUNT_IDS_MAINNET;";
    const results = await connection.promise().query(sql);
    return results[0][0].block_height;
}

async function getLastTestnetAccountIdsBlockHeight() {
    let sql = "SELECT MAX(block_height) AS block_height FROM ACCOUNT_IDS_TESTNET;";
    const results = await connection.promise().query(sql);
    return results[0][0].block_height;
}

app.get('/health/mainnet', async (req: Request, res: Response) => {
   try {
       const results = await getLastMainnetAccountIdsBlockHeight();
       res.send(results);
   } catch (error) {
       log.error(" error ", error);
       res.send(error);
   }
});

app.get('/health/testnet', async(req: Request, res: Response) => {
    try {
        const results = await getLastTestnetAccountIdsBlockHeight();
        res.send(results);
    } catch (error) {
        log.error(" error ", error);
        res.send(error);
    }
});

app.get('/account_id/mainnet', async (req: Request, res: Response) => {
    log.debug("PUB KEY", req.query.public_key);
    try {
        const results = addNetworkTypePrefixToResults(
            await findMainnetAccountIds(req.query.public_key),
            MAINNET_SUFFIX,
            MAINNET_PREFIX
        );
        log.debug(" RESULTS ", results);
        res.send(results);
    } catch (error) {
        log.error(" >>>>>>>>> ERROR", error);
        res.send(error);
    }
});

app.get('/account_id/testnet', async (req: Request, res: Response) => {
    log.debug(" >>>>>>>>> PUBLIC KEY", req.query.public_key);
    try {
        const results = addNetworkTypePrefixToResults(
            await findTestnetAccountIds(req.query.public_key),
            TESTNET_SUFFIX,
            TESTNET_PREFIX
        );
        log.debug(" >>>>>>>>> RESULTS", results);
        res.send(results);
    } catch (error) {
        log.error(" >>>>>>>>> ERROR", error);
        res.send(error);
    }
});

app.listen(8080, () => {
    log.info('Server is running on port 8080');
});
