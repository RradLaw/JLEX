const Bluebird    = require('bluebird');
const mysql       = require('mysql');

const config = require("./config2.json");

let rmconnection = mysql.createPool({
    connectionLimit : config.sql.connections,
    host            : config.sql.rmhost,
    user            : config.sql.rmuser,
    password        : config.sql.rmpass,
    database        : config.sql.rmdb,
    timezone        : 'utc',
    supportBigNumbers: true, 
    bigNumberStrings: true
  });

  
let rmdb = Bluebird.promisifyAll(rmconnection);

rmdb.query('CREATE TABLE IF NOT EXISTS `exraids` (`guid` VARCHAR(50) NOT NULL COLLATE \'utf8mb4_unicode_ci\',`starttime` DATETIME NOT NULL, PRIMARY KEY (`guid`,`starttime`)) COLLATE=\'utf8_general_ci\'ENGINE=InnoDB;');

module.exports = {
    addRaid: async function(name, dt) {

    },
    findGym: async function (gymName) {
        let jim = await rmdb.queryAsync(`SELECT guid FROM portal WHERE portal.name = ${rmconnection.escape(gymName)} AND is_gym=1;`);
        return jim;
    },
    getGym: async function (g) {
        let pam = await rmdb.queryAsync(`SELECT name, url, latitude, longitude, suburb, guid FROM portal WHERE guid = ${rmconnection.escape(g)};`);
        return pam;
    },
}
