if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const { createClient } = require('@libsql/client');
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const db = createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_DB_TOKEN
});

db.execute(`
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
`).then(() => {
    console.log('Connected to Turso database.');
}).catch(err => {
    console.error('Error connecting to Turso database:', err.message);
    process.exit(1);
});

const adminAuth = basicAuth({
    users: { [process.env.ADMIN_USERNAME]: process.env.ADMIN_PASSWORD },
    challenge: true,
    realm: 'Admin Area'
});

app.use('/admin.html', adminAuth);
app.use('/api/rates/add', adminAuth);
app.use('/api/rates/update', adminAuth);

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

app.get('/api/rates', async (req, res) => {
    const currency = req.query.currency || 'AUD';
    try {
        const result = await db.execute({
            sql: `
                SELECT * FROM rates
                WHERE currency = ?
                ORDER BY updated_at DESC
            `,
            args: [currency.toUpperCase()]
        });
        res.set('Cache-Control', 'no-store'); // Prevent caching
        res.json(result.rows);
    } catch (err) {
        console.error('Error querying database:', err.message);
        res.status(500).json({ error: 'Error fetching rates' });
    }
});

app.post('/api/rates/add', async (req, res) => {
    const { currency, region, money_changer, buy_rate, sell_rate, location, unit } = req.body;

    if (!currency || !region || !money_changer || !buy_rate || !sell_rate || !location || !unit) {
        console.log('Validation failed. Request body:', req.body);
        return res.status(400).json({ error: 'All fields are required' });
    }

    const updatedAt = getCurrentTimestamp();

    try {
        const args = [currency.toUpperCase(), region, money_changer, buy_rate, sell_rate, location, updatedAt, unit];
        console.log('Insert args:', args);
        await db.execute({
            sql: `
                INSERT INTO rates (currency, region, money_changer, buy_rate, sell_rate, location, updated_at, unit)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            args
        });
        res.json({ message: 'Rate added successfully' });
    } catch (err) {
        console.error('Error inserting rate:', err.message, 'Request body:', req.body);
        res.status(500).json({ error: 'Error adding rate: ' + err.message });
    }
});

app.put('/api/rates/update/:id', async (req, res) => {
    const id = req.params.id;
    const { buy_rate, sell_rate } = req.body;

    if (!buy_rate || !sell_rate) {
        return res.status(400).json({ error: 'Buy and sell rates are required' });
    }

    const updatedAt = getCurrentTimestamp();

    try {
        await db.execute({
            sql: `
                UPDATE rates
                SET buy_rate = ?, sell_rate = ?, updated_at = ?
                WHERE id = ?
            `,
            args: [buy_rate, sell_rate, updatedAt, id]
        });
        res.json({ message: 'Rate updated successfully' });
    } catch (err) {
        console.error('Error updating rate:', err.message);
        res.status(500).json({ error: 'Error updating rate' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'money-changers.html'));
});

app.get('/money-changers.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'money-changers.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});