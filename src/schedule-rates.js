const cron = require('node-cron');
const updateRates = require('./update-rates');

// Schedule the updateRates function to run daily at 8:00 AM
cron.schedule('*/5 * * * *', () => {
    console.log('Running daily update at', new Date().toISOString());
    updateRates();
}, {
    scheduled: true,
    timezone: "Asia/Kuala_Lumpur" // Adjust to your timezone
});

console.log('Cron job scheduled to run daily at 8:00 AM MYT.');