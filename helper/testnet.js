"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var near_lake_framework_1 = require("near-lake-framework");
var lakeConfigTestnet = {
    s3BucketName: "near-lake-data-testnet",
    s3RegionName: "eu-central-1",
    startBlockHeight: 72110721
};
var mysql = require('mysql2');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'near_data'
});
connection.connect();
// setting for testnet
connection.query("DROP TABLE IF EXISTS `ACCOUNT_IDS_TESTNET`");
connection.query("DROP TABLE IF EXISTS `PUBLIC_KEY_TESTNET`");
connection.query("CREATE TABLE IF NOT EXISTS PUBLIC_KEY_TESTNET (\n" +
    "         id    INT PRIMARY KEY AUTO_INCREMENT,\n" +
    "         public_key_string  VARCHAR(100)       NOT NULL DEFAULT ''\n" +
    "       );");
connection.query("CREATE TABLE IF NOT EXISTS ACCOUNT_IDS_TESTNET (\n" +
    "          id    INT PRIMARY KEY AUTO_INCREMENT,\n" +
    "          address_id VARCHAR(100) NOT NULL DEFAULT '',\n" +
    "          FK_PUBLIC_KEY_ID INT,\n" +
    "          FOREIGN KEY (FK_PUBLIC_KEY_ID)\n" +
    "          REFERENCES PUBLIC_KEY(id)\n" +
    ");");
connection.query("CREATE UNIQUE INDEX UNIQUE_PUBLIC_KEY ON PUBLIC_KEY_TESTNET (public_key_string)");
function getPublicKeyId(signerId) {
    return __awaiter(this, void 0, void 0, function () {
        var sql, results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sql = "SELECT * FROM PUBLIC_KEY_TESTNET WHERE public_key_string = " + "'" + signerId + "'" + ";";
                    return [4 /*yield*/, connection.promise().query(sql)];
                case 1:
                    results = _a.sent();
                    console.log(" SIGNER ID ", signerId);
                    console.log(" RESULTS ", results[0]);
                    return [2 /*return*/, results[0][0].id];
            }
        });
    });
}
function insertPublicKeySignerId(signerId) {
    return __awaiter(this, void 0, void 0, function () {
        var sql, results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sql = "INSERT INTO PUBLIC_KEY_TESTNET (public_key_string) VALUES " + "('" + signerId + "')" + ";";
                    return [4 /*yield*/, connection.promise().execute(sql)];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, results[0]];
            }
        });
    });
}
function insertAddressIds(publicKeyId, signer) {
    return __awaiter(this, void 0, void 0, function () {
        var sql, results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sql = "INSERT INTO ACCOUNT_IDS_TESTNET (FK_PUBLIC_KEY_ID, address_id) VALUES " + "(" + publicKeyId + "," + "'" + signer + "'" + ")";
                    return [4 /*yield*/, connection.promise().execute(sql)];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, results[0]];
            }
        });
    });
}
function handleStreamerMessage(streamerMessage) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, _a, shard, _b, _c, receiptExecutionOutcome, action, signer, signerPublicKey, receiptAfterPublicKeyInsert, publicKeyId, receiptAfterAddressIdsInsert, e_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 9, , 10]);
                    console.log("Block Height >>>>>>>>>", streamerMessage.block.header.height);
                    _i = 0, _a = streamerMessage.shards;
                    _d.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 8];
                    shard = _a[_i];
                    console.log(" shardId: ", shard.shardId);
                    _b = 0, _c = shard.receiptExecutionOutcomes;
                    _d.label = 2;
                case 2:
                    if (!(_b < _c.length)) return [3 /*break*/, 7];
                    receiptExecutionOutcome = _c[_b];
                    action = receiptExecutionOutcome.receipt.receipt['Action'];
                    if (!action.actions[0].AddKey) return [3 /*break*/, 6];
                    signer = receiptExecutionOutcome.receipt.receipt['Action'].signerId;
                    signerPublicKey = receiptExecutionOutcome.receipt.receipt['Action'].signerPublicKey;
                    console.log(" signerId: ", signer);
                    console.log(" signerPublicKey ", signerPublicKey);
                    return [4 /*yield*/, insertPublicKeySignerId(signerPublicKey)];
                case 3:
                    receiptAfterPublicKeyInsert = _d.sent();
                    console.log(" receiptAfterInsert ", receiptAfterPublicKeyInsert);
                    return [4 /*yield*/, getPublicKeyId(signerPublicKey)];
                case 4:
                    publicKeyId = _d.sent();
                    return [4 /*yield*/, insertAddressIds(publicKeyId, signer)];
                case 5:
                    receiptAfterAddressIdsInsert = _d.sent();
                    console.log(" receiptAfterAddressIdsInsert ", receiptAfterAddressIdsInsert);
                    _d.label = 6;
                case 6:
                    _b++;
                    return [3 /*break*/, 2];
                case 7:
                    _i++;
                    return [3 /*break*/, 1];
                case 8: return [3 /*break*/, 10];
                case 9:
                    e_1 = _d.sent();
                    console.log(e_1);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, near_lake_framework_1.startStream)(lakeConfigTestnet, handleStreamerMessage)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })();
