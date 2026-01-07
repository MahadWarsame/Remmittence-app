const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./remittance.db');

// Initialize tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    createdAt TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    userId TEXT,
    fromCurrency TEXT,
    toCurrency TEXT,
    amount REAL,
    fee REAL,
    finalAmount REAL,
    recipient TEXT,
    status TEXT,
    createdAt TEXT
  )`);
});

db.run(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    passwordHash TEXT
  )
`);


module.exports = db;
