const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Connect to SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'rates.db'));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, '../public')));

// API endpoint to get rates for a currency
app.get('/api/rates', (req, res) => {
    const currency = req.query.currency || 'AUD';
    db.all(
        'SELECT * FROM exchange_rates WHERE currency = ? ORDER BY updated_at DESC',
        [currency],
        (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json([]);
            } else {
                res.json(rows);
            }
        }
    );
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
