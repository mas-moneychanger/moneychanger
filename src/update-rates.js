require('dotenv').config();
const { createClient } = require('@libsql/client');
const scrapeRates = require('./scrape-rates');

const currencies = ['AUD', 'USD', 'SGD', 'EUR', 'THB', 'JPY', 'TWD', 'CNY', 'IDR', 'HKD', 'PKR', 'INR', 'PHP', 'VND', 'CHF', 'GBP', 'CAD'];

// Initialize Turso client
const db = createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_DB_TOKEN
});

async function updateRates() {
    console.log('Starting rate update...');

    for (const currency of currencies) {
        console.log(`Scraping rates for ${currency}...`);
        const rates = await scrapeRates(currency);

        if (rates.length === 0) {
            console.log(`No rates found for ${currency}. Skipping...`);
            continue;
        }

        for (const rate of rates) {
            try {
                await db.execute({
                    sql: `
                        INSERT INTO rates (currency, region, money_changer, buy_rate, sell_rate, location, updated_at, unit)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    args: [
                        rate.currency,
                        rate.region,
                        rate.money_changer,
                        rate.buy,
                        rate.sell,
                        rate.location,
                        rate.updated_at,
                        rate.unit
                    ]
                });
            } catch (err) {
                console.error(`Error inserting rate for ${currency}:`, err.message);
            }
        }

        console.log(`Inserted ${rates.length} rates for ${currency}.`);
    }

    console.log('Rate update complete.');
}

updateRates().catch((err) => {
    console.error('Error updating rates:', err);
    process.exit(1);
});