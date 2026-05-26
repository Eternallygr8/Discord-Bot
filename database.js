const Database = require('better-sqlite3');

const db = new Database('oil_empire.db');

//
// Profiles
//

db.prepare(`
CREATE TABLE IF NOT EXISTS profiles (
  userId TEXT PRIMARY KEY,
  money REAL,
  gasps REAL,
  boostedGasps REAL,
  cashBoost REAL,
  offlineGasBoost REAL,
  price REAL
)
`).run();

//
// Inventory
//

db.prepare(`
CREATE TABLE IF NOT EXISTS inventory (
  userId TEXT,
  drillId TEXT,
  amount INTEGER,
  PRIMARY KEY (userId, drillId)
)
`).run();

module.exports = db;
