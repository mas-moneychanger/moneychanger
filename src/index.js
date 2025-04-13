const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database(path.join(__dirname, 'src/rates.db'));
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.get('/privacy.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/privacy.html'));
});