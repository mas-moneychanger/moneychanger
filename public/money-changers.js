$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    let selectedCurrency = urlParams.get('currency') || 'AUD';

    $('#currency-select').val(selectedCurrency);

    function fetchRates(currency) {
        $.ajax({
            url: `/api/rates?currency=${currency}`,
            method: 'GET',
            cache: false, // Prevent caching
            success: function(rates) {
                console.log('Fetched rates:', rates); // Log the fetched data
                const tbody = $('#rates-table-body');
                tbody.empty();

                if (rates.length === 0) {
                    tbody.append('<tr><td colspan="7">No rates available for this currency.</td></tr>');
                    return;
                }

                rates.forEach(rate => {
                    const row = `
                        <tr>
                            <td>${rate.currency}</td>
                            <td>${rate.region}</td>
                            <td>${rate.money_changer}</td>
                            <td>${rate.buy_rate}</td>
                            <td>${rate.sell_rate}</td>
                            <td>${rate.location}</td>
                            <td>${rate.updated_at}</td>
                        </tr>
                    `;
                    tbody.append(row);
                });
            },
            error: function(err) {
                console.error('Error fetching rates:', err);
                $('#rates-table-body').empty().append('<tr><td colspan="7">Error loading rates.</td></tr>');
            }
        });
    }

    fetchRates(selectedCurrency);

    $('#currency-select').on('change', function() {
        selectedCurrency = $(this).val();
        window.history.pushState({}, '', `?currency=${selectedCurrency}`);
        fetchRates(selectedCurrency);
    });
});