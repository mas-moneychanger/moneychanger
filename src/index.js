const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set up basic authentication for admin routes
const adminAuth = basicAuth({
    users: { 'admin': 'supersecretpassword' }, // Replace with your username and password
    challenge: true,
    realm: 'Admin Area'
});

// Apply authentication to admin routes
app.use('/admin.html', adminAuth);
app.use('/api/rates/add', adminAuth);
app.use('/api/rates/update', adminAuth);

// Initialize SQLite database
const dbPath = path.join(__dirname, 'src', 'rates.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database.');
});

// Function to get current timestamp
function getCurrentTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`;
}

// Existing endpoint to get rates
app.get('/api/rates', (req, res) => {
    const currency = req.query.currency || 'AUD';
    db.all('SELECT * FROM rates WHERE currency = ?', [currency.toUpperCase()], (err, rows) => {
        if (err) {
            console.error('Error querying database:', err.message);
            res.status(500).json({ error: 'Error fetching rates' });
            return;
        }
        res.json(rows);
    });
});

// New endpoint to add a rate
app.post('/api/rates/add', (req, res) => {
    const { currency, region, money_changer, buy_rate, sell_rate, location, unit } = req.body;

    if (!currency || !region || !money_changer || !buy_rate || !sell_rate || !location || !unit) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const updatedAt = getCurrentTimestamp();

    const insertStmt = db.prepare(`
        INSERT INTO rates (currency, region, money_changer, buy_rate, sell_rate, location, updated_at, unit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
        currency.toUpperCase(),
        region,
        money_changer,
        buy_rate,
        sell_rate,
        location,
        updatedAt,
        unit,
        (err) => {
            if (err) {
                console.error('Error inserting rate:', err.message);
                res.status(500).json({ error: 'Error adding rate' });
            } else {
                res.json({ message: 'Rate added successfully' });
            }
        }
    );

    insertStmt.finalize();
});

// New endpoint to update a rate
app.put('/api/rates/update/:id', (req, res) => {
    const id = req.params.id;
    const { buy_rate, sell_rate } = req.body;

    if (!buy_rate || !sell_rate) {
        return res.status(400).json({ error: 'Buy and sell rates are required' });
    }

    const updatedAt = getCurrentTimestamp();

    const updateStmt = db.prepare(`
        UPDATE rates
        SET buy_rate = ?, sell_rate = ?, updated_at = ?
        WHERE id = ?
    `);

    updateStmt.run(
        buy_rate,
        sell_rate,
        updatedAt,
        id,
        (err) => {
            if (err) {
                console.error('Error updating rate:', err.message);
                res.status(500).json({ error: 'Error updating rate' });
            } else {
                res.json({ message: 'Rate updated successfully' });
            }
        }
    );

    updateStmt.finalize();
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'money-changers.html'));
});

app.get('/money-changers.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'money-changers.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});