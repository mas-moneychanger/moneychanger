$(document).ready(function() {
    // Parse the currency from the URL
    const urlParams = new URLSearchParams(window.location.search);
    let selectedCurrency = urlParams.get('currency') || 'AUD';

    // Set the currency dropdown value and title
    $('#currency-select').val(selectedCurrency);
    $('#currency-title').text(`${selectedCurrency.toUpperCase()} Rates`);

    // Function to parse dates in the format "2025-04-11 10:52 AM"
    function parseDate(dateStr) {
        if (!dateStr || dateStr === 'N/A') return new Date(0);
        const [datePart, timePart] = dateStr.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hourMin, period] = timePart.split(' ');
        const [hour, minute] = hourMin.split(':').map(Number);
        const adjustedHour = period === 'PM' && hour !== 12 ? hour + 12 : (period === 'AM' && hour === 12 ? 0 : hour);
        return new Date(year, month - 1, day, adjustedHour, minute);
    }

    // Function to load rates
    function loadRates(currency, regionFilter = 'all') {
        $('#rates-body').html('<tr><td colspan="6">Loading rates...</td></tr>');

        const timestamp = new Date().getTime(); // Cache-busting parameter
        $.ajax({
            url: `/api/rates?currency=${currency}&t=${timestamp}`,
            method: 'GET',
            cache: false,
            success: function(rates) {
                console.log('Fetched rates:', rates);
                const tbody = $('#rates-body');
                tbody.empty();

                if (!rates || rates.length === 0) {
                    tbody.html('<tr><td colspan="6">No rates available for this currency.</td></tr>');
                    return;
                }

                let latestUpdate = '';
                const filteredRates = regionFilter === 'all' ? rates : rates.filter(rate => rate.region === regionFilter);

                if (filteredRates.length === 0) {
                    tbody.html('<tr><td colspan="6">No rates available for this region.</td></tr>');
                    return;
                }

                filteredRates.forEach(rate => {
                    console.log('Adding row:', rate);
                    const row = $('<tr></tr>');
                    row.html(`
                        <td>${rate.money_changer || 'N/A'}</td>
                        <td>${rate.location || 'N/A'}</td>
                        <td>${rate.unit || 'N/A'}</td>
                        <td>${rate.buy_rate ?? 'N/A'}</td>
                        <td>${rate.sell_rate ?? 'N/A'}</td>
                        <td>${rate.updated_at || 'N/A'}</td>
                    `);
                    tbody.append(row);

                    const updateTime = parseDate(rate.updated_at);
                    if (!latestUpdate || updateTime > parseDate(latestUpdate)) {
                        latestUpdate = rate.updated_at;
                    }
                });

                if (latestUpdate) {
                    $('#last-updated').text(`Last Updated: ${latestUpdate}`);
                } else {
                    $('#last-updated').text('Last Updated: Not available');
                }
            },
            error: function(err) {
                console.error('Error loading rates:', err);
                $('#rates-body').html('<tr><td colspan="6" class="error-message">Error loading rates. Please try again later.</td></tr>');
            }
        });
    }

    // Load rates on page load
    loadRates(selectedCurrency);

    // Currency change event
    $('#currency-select').on('change', function() {
        selectedCurrency = $(this).val();
        $('#currency-title').text(`${selectedCurrency.toUpperCase()} Rates`);
        window.history.pushState({}, '', `?currency=${selectedCurrency}`);
        loadRates(selectedCurrency, $('#region-select').val());
    });

    // Region filter change event
    $('#region-select').on('change', function() {
        const region = $(this).val();
        loadRates(selectedCurrency, region);
    });
});