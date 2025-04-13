const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'rates.db'));

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS exchange_rates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            currency TEXT NOT NULL,
            region TEXT,
            money_changer TEXT,
            buy_rate REAL,
            sell_rate REAL,
            location TEXT,
            updated_at TEXT,
            unit TEXT
        )
    `);
});

db.close();