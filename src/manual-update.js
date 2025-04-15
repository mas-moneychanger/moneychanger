const { createClient } = require('@libsql/client');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const db = createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_DB_TOKEN
});

function prompt(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

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

async function manualUpdate() {
    try {
        console.log('\n--- Manual Rate Update ---');
        console.log('You can add a new rate or update an existing one.');

        const action = await prompt('Do you want to (A)dd a new rate or (U)pdate an existing rate? (A/U): ');
        if (!['A', 'U', 'a', 'u'].includes(action)) {
            console.log('Invalid action. Please choose A or U.');
            rl.close();
            return;
        }

        if (action.toUpperCase() === 'A') {
            const currency = await prompt('Enter currency (e.g., AUD, USD): ');
            const region = await prompt('Enter region (e.g., KL, Selangor): ');
            const moneyChanger = await prompt('Enter money changer name: ');
            const buyRate = await prompt('Enter buy rate: ');
            if (!isNumeric(buyRate)) {
                console.log('Invalid buy rate. Must be a number.');
                rl.close();
                return;
            }
            const sellRate = await prompt('Enter sell rate: ');
            if (!isNumeric(sellRate)) {
                console.log('Invalid sell rate. Must be a number.');
                rl.close();
                return;
            }
            const location = await prompt('Enter location (e.g., MIDVALLEY MEGAMALL): ');
            const unit = await prompt('Enter unit (e.g., 1 AUD, 10000 IDR): ');

            const updatedAt = getCurrentTimestamp();

            await db.execute({
                sql: `
                    INSERT INTO rates (currency, region, money_changer, buy_rate, sell_rate, location, updated_at, unit)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                args: [
                    currency.toUpperCase(),
                    region,
                    moneyChanger,
                    parseFloat(buyRate),
                    parseFloat(sellRate),
                    location,
                    updatedAt,
                    unit
                ]
            });

            console.log('New rate added successfully!');
            rl.close();
        } else {
            console.log('\nFirst, let’s find the rate to update.');
            const currency = await prompt('Enter currency to search (e.g., AUD, USD): ');

            const result = await db.execute({
                sql: 'SELECT * FROM rates WHERE currency = ?',
                args: [currency.toUpperCase()]
            });

            if (result.rows.length === 0) {
                console.log(`No rates found for currency ${currency}.`);
                rl.close();
                return;
            }

            console.log('\nFound the following rates:');
            console.table(result.rows);

            const id = await prompt('Enter the ID of the rate to update: ');
            const rateToUpdate = result.rows.find(row => row.id === parseInt(id));
            if (!rateToUpdate) {
                console.log('Invalid ID. No rate found with that ID.');
                rl.close();
                return;
            }

            const newBuyRate = await prompt(`Enter new buy rate (current: ${rateToUpdate.buy_rate}): `) || rateToUpdate.buy_rate;
            if (newBuyRate !== rateToUpdate.buy_rate && !isNumeric(newBuyRate)) {
                console.log('Invalid buy rate. Must be a number.');
                rl.close();
                return;
            }
            const newSellRate = await prompt(`Enter new sell rate (current: ${rateToUpdate.sell_rate}): `) || rateToUpdate.sell_rate;
            if (newSellRate !== rateToUpdate.sell_rate && !isNumeric(newSellRate)) {
                console.log('Invalid sell rate. Must be a number.');
                rl.close();
                return;
            }

            const updatedAt = getCurrentTimestamp();

            await db.execute({
                sql: `
                    UPDATE rates
                    SET buy_rate = ?, sell_rate = ?, updated_at = ?
                    WHERE id = ?
                `,
                args: [parseFloat(newBuyRate), parseFloat(newSellRate), updatedAt, id]
            });

            console.log('Rate updated successfully!');
            rl.close();
        }
    } catch (err) {
        console.error('Error during manual update:', err.message);
        rl.close();
    }
}

manualUpdate();