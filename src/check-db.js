const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'rates.db'));
db.all("SELECT * FROM exchange_rates", [], (err, rows) => {
    if (err) {
        console.error('Error querying database:', err);
    } else {
        console.log('Current data in exchange_rates:');
        console.table(rows);
    }
    db.close();
});