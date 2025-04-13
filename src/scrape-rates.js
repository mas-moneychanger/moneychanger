const puppeteer = require('puppeteer');
const fs = require('fs').promises;

async function scrapeRates(currency = 'AUD') {
    const url = `https://www.klmoneychanger.com/compare-rates?n=${currency.toUpperCase()}`;
    let browser;
    try {
        // Launch a headless browser
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Check HTTP status code
        const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const status = response.status();
        if (status !== 200) {
            console.error(`Failed to load ${url}: HTTP status ${status}`);
            return [];
        }

        // Wait for the table to load
        const tableLoaded = await page.waitForSelector('#showrate', { timeout: 10000 }).catch(() => null);
        if (!tableLoaded) {
            console.error(`Table #showrate not found on ${url}`);
            // Log the page content for debugging
            const pageContent = await page.content();
            await fs.writeFile(`error-${currency}.html`, pageContent);
            console.error(`Page content saved to error-${currency}.html for debugging`);
            return [];
        }

        // Extract the currency from the page title (with fallback)
        const pageCurrency = await page.evaluate(() => {
            const titleElement = document.querySelector('title');
            if (!titleElement) return null;
            const title = titleElement.innerText;
            return title.split(' ').pop() || 'Unknown';
        });

        // If title is missing or doesn't match, use the input currency
        if (!pageCurrency || pageCurrency.toUpperCase() !== currency.toUpperCase()) {
            console.warn(`Currency mismatch or title missing for ${url}. Using input currency: ${currency}`);
        }

        // Extract rates from the table
        const rates = await page.evaluate(() => {
            const data = [];
            const rows = document.querySelectorAll('#showrate tbody tr');
            let currentMoneyChanger = '';
            let currentLocation = '';
            let currentUpdateTime = '';

            rows.forEach(row => {
                const moneyChangerCell = row.querySelector('td.accordion-toggle');
                if (moneyChangerCell) {
                    const text = moneyChangerCell.innerText.split(' - ');
                    currentMoneyChanger = text[0].trim();
                    currentLocation = text[1] ? text[1].replace('LOT10 BUKIT BINTANG', 'Lot 10 Bukit Bintang').trim() : 'Unknown';
                }

                const updateTimeCell = row.querySelector('td[colspan="3"]');
                if (updateTimeCell && updateTimeCell.innerText.includes('Last updated on')) {
                    currentUpdateTime = updateTimeCell.innerText.replace('Last updated on ', '').trim();
                }

                const unitCell = row.querySelector('td:nth-child(2)');
                if (unitCell && (unitCell.innerText.includes('1') || unitCell.innerText.includes('100'))) {
                    const buyCell = row.querySelector('td:nth-child(3)');
                    const sellCell = row.querySelector('td:nth-child(4)');
                    const updateTimeCellDesktop = row.querySelector('td:nth-child(5)');

                    const unit = unitCell.innerText.trim();
                    const buy = parseFloat(buyCell.innerText.trim());
                    const sell = parseFloat(sellCell.innerText.trim());
                    const updateTime = updateTimeCellDesktop ? updateTimeCellDesktop.innerText.trim() : currentUpdateTime;

                    if (!isNaN(buy) && !isNaN(sell)) {
                        data.push({
                            money_changer: currentMoneyChanger,
                            location: currentLocation,
                            buy,
                            sell,
                            updated_at: updateTime,
                            unit
                        });
                    }
                }
            });
            return data;
        });

        const ratesWithDetails = rates.map(rate => ({
            ...rate,
            currency: currency.toUpperCase(),
            region: rate.location.includes('Kuala Lumpur') || rate.location.includes('Bukit Bintang') || rate.location.includes('MidValley') || rate.location.includes('NU Sentral') || rate.location.includes('Avenue K') || rate.location.includes('Chow Kit') ? 'KL' :
                   rate.location.includes('Shah Alam') || rate.location.includes('Seri Kembangan') || rate.location.includes('Puchong') || rate.location.includes('Balakong') ? 'Selangor' :
                   rate.location.includes('Ipoh') ? 'Ipoh' :
                   rate.location.includes('Johor') || rate.location.includes('Johor Bahru') ? 'Johor' :
                   rate.location.includes('Penang') || rate.location.includes('George Town') ? 'Penang' :
                   'Unknown'
        }));

        return ratesWithDetails;
    } catch (error) {
        console.error(`Error scraping ${currency} rates from ${url}:`, error);
        return [];
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = scrapeRates;

if (require.main === module) {
    scrapeRates('CNY').then(rates => {
        console.log('Scraped Rates for CNY:', rates);
    });
}