const Database = require('better-sqlite3');

const db = new Database('oil_empire.db');

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

module.exports = db;
