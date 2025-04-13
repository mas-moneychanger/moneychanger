const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'rates.db'));

db.run("ALTER TABLE exchange_rates ADD COLUMN unit TEXT", (err) => {
    if (err) console.error('Error adding column:', err);
    else console.log('Unit column added successfully.');
});

db.close();