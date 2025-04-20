require('dotenv').config();
const { createClient } = require('@libsql/client');

const db = createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_DB_TOKEN
});

async function checkDb() {
    try {
        const result = await db.execute('SELECT * FROM rates');
        console.table(result.rows);
    } catch (err) {
        console.error('Error querying database:', err.message);
        process.exit(1);
    }
}

checkDb().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});