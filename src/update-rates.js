const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const scrapeRates = require('./scrape-rates');

const db = new sqlite3.Database(path.join(__dirname, 'rates.db'));

async function updateRates() {
    try {
        const currencies = ['AUD', 'USD', 'SGD', 'EUR', 'THB', 'JPY', 'TWD', 'CNY'];

        for (const currency of currencies) {
            console.log(`Scraping rates for ${currency}...`);
            const scrapedRates = await scrapeRates(currency);

            if (!scrapedRates.length) {
                console.log(`No rates scraped for ${currency}.`);
                continue;
            }

            await new Promise((resolve, reject) => {
                db.run("DELETE FROM exchange_rates WHERE currency = ?", [currency], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            const stmt = db.prepare(`
                INSERT INTO exchange_rates (currency, region, money_changer, buy_rate, sell_rate, location, updated_at, unit)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            scrapedRates.forEach(rate => {
                stmt.run(
                    rate.currency,
                    rate.region,
                    rate.money_changer,
                    rate.buy,
                    rate.sell,
                    rate.location,
                    rate.updated_at,
                    rate.unit,
                    (err) => {
                        if (err) console.error('Insert error:', err);
                    }
                );
            });

            stmt.finalize();
            console.log(`Rates for ${currency} updated successfully.`);

            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    } catch (err) {
        console.error('Error updating rates:', err);
    } finally {
        db.close();
    }
}

updateRates();