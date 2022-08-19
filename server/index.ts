import express, { Request, Response, NextFunction } from 'express';
const app = express();
const cors = require('cors')

import { Logger } from "tslog";
const log: Logger = new Logger({ name: " NEAR LAKE SERVER IS NOW RUNNING >>>>>>>>>>>>>> WELLDONE CODE" });

app.use(express.json());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'test',
    password: 'password',
    database: 'near_data',
});

log.info(" MySQL Connection Established For Mainnet Inserting >>>>>>>>>>>>>>>>>>>>>>>>>> ");
connection.connect();

async function findMainnetAccountIds(publicKeyString: string) {
    let sql = "SELECT address_id FROM ACCOUNT_IDS_MAINNET WHERE FK_PUBLIC_KEY_ID = (SELECT id FROM PUBLIC_KEY_MAINNET WHERE public_key_string = " + "'" + publicKeyString + "'" + ");";
    const results = await connection.promise().query(sql);
    return results[0];
}

async function findTestnetAccountIds(publicKeyString: string) {
    let sql = "SELECT address_id FROM ACCOUNT_IDS_TESTNET WHERE FK_PUBLIC_KEY_ID = (SELECT id FROM PUBLIC_KEY_TESTNET WHERE public_key_string = " + "'" + publicKeyString + "'" + ");";
    const results = await connection.promise().query(sql);
    return results[0];
}

app.get('/find/mainnet', async (req: Request, res: Response) => {
    log.debug(" >>>>>>>>> PUBLIC KEY", req.query.public_key);
    try {
        const results = await findMainnetAccountIds(req.query.public_key);
        log.debug(" >>>>>>>>> RESULTS", results);
        res.send({
            status: 200,
            network: "mainnet",
            results
        });
    } catch (error) {
        log.error(" >>>>>>>>> ERROR", error);
        res.send({
            status: 500,
            network: "mainnet",
            error
        });
    }
});

app.get('/find/testnet', async (req: Request, res: Response) => {
    log.debug(" >>>>>>>>> PUBLIC KEY", req.query.public_key);
    try {
        const results = await findTestnetAccountIds(req.query.public_key);
        log.debug(" >>>>>>>>> RESULTS", results);
        res.send({
            status: 200,
            network: "testnet",
            results
        });
    } catch (error) {
        log.error(" >>>>>>>>> ERROR", error);
        res.send({
            status: 500,
            network: "testnet",
            error
        });
    }
});

app.listen(8080, () => {
    log.info('Server is running on port 8080');
});
