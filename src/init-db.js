require('dotenv').config();
const { createClient } = require('@libsql/client');

const db = createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_DB_TOKEN
});

async function initDb() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS rates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                currency TEXT NOT NULL,
                region TEXT NOT NULL,
                money_changer TEXT NOT NULL,
                buy_rate REAL NOT NULL,
                sell_rate REAL NOT NULL,
                location TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                unit TEXT NOT NULL
            )
        `);
        console.log('Rates table created or already exists.');
    } catch (err) {
        console.error('Error creating table:', err.message);
        process.exit(1);
    }
}

initDb().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});