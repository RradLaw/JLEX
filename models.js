const Bluebird    = require('bluebird');
const mysql       = require('mysql');

const config = require("./config2.json");

let rmconnection = mysql.createPool({
    connectionLimit : config.db.connections,
    host            : config.db.host,
    user            : config.db.user,
    password        : config.db.password,
    database        : config.db.database,
    timezone        : 'utc',
    supportBigNumbers: true, 
    bigNumberStrings: true
  });

let rmdb = Bluebird.promisifyAll(rmconnection);

rmdb.query('CREATE TABLE IF NOT EXISTS `exraids` (`guid` VARCHAR(50) NOT NULL COLLATE \'utf8mb4_unicode_ci\',`starttime` DATETIME NOT NULL, PRIMARY KEY (`guid`,`starttime`)) COLLATE=\'utf8_general_ci\'ENGINE=InnoDB;');

module.exports = {
    addRaid: async function(guid, dt) {
        try{
            await rmdb.queryAsync(`INSERT IGNORE INTO exraids VALUES (?,?);`,[guid,dt]);
        } catch (e) {
            console.error(`models.addRaid error: ${e}`);
        }
    },
    findGym: async function (gymName) {
        try {
            let jim = await rmdb.queryAsync(`SELECT guid, latitude, longitude FROM portal WHERE name = ${rmconnection.escape(gymName)} AND is_gym=1;`);
            return jim;
        } catch (e) {
            console.error(`models.findGym error: ${e}`);
        }
    },
    findGymName: async function (gymGuid) {
        try {
            let jim = await rmdb.queryAsync(`SELECT name FROM portal WHERE guid = ${rmconnection.escape(gymGuid)} AND is_gym=1;`);
            return jim;
        } catch (e) {
            console.error(`models.findGymName error: ${e}`);
        }
    },
    getGym: async function (g) {
        try {
            let pam = await rmdb.queryAsync(`SELECT name, url, latitude, longitude, suburb, guid FROM portal WHERE guid = ${rmconnection.escape(g)};`);
            return pam;
        } catch (e) {
            console.error(`models.findGymName error: ${e}`);
        }
    },
}
