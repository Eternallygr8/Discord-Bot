const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./oil_empire.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      userId TEXT PRIMARY KEY,
      money REAL,
      gasps REAL,
      boostedGasps REAL,
      cashBoost REAL,
      offlineGasBoost REAL,
      price REAL
    )
  `);
});

module.exports = db;
