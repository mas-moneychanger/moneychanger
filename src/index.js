const { createClient } = require('@libsql/client');
const express = require('express');
const basicAuth = require('express-basic-auth');
const app = express();

app.use(express.json());

const db = createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_DB_TOKEN
});

app.use('/admin', basicAuth({
    users: { [process.env.BASIC_AUTH_USER]: process.env.BASIC_AUTH_PASSWORD },
    challenge: true,
    unauthorizedResponse: 'Unauthorized'
}));

app.post('/admin/add-rate', async (req, res) => {
    const { currency, region, money_changer, buy_rate, sell_rate, location, unit, updated_at } = req.body;
    console.log('Adding rate:', { currency, region, money_changer, buy_rate, sell_rate, location, unit, updated_at });
    try {
        await db.execute({
            sql: `INSERT INTO rates (currency, region, money_changer, buy_rate, sell_rate, location, unit, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [currency, region, money_changer, buy_rate, sell_rate, location, unit, updated_at]
        });
        res.json({ message: 'Rate added successfully' });
    } catch (err) {
        console.error('Error adding rate to database:', err.message, err.stack);
        res.status(500).json({ error: 'Failed to add rate to database', details: err.message });
    }
});

app.get('/api/rates', async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    const currency = req.query.currency || 'AUD';
    try {
        const { rows } = await db.execute({
            sql: 'SELECT * FROM rates WHERE currency = ?',
            args: [currency]
        });
        res.json(rows);
    } catch (err) {
        console.error('Error fetching rates:', err);
        res.status(500).json({ error: 'Error fetching rates' });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));