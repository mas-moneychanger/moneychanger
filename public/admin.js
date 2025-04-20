$(document).ready(function() {
    // Add Rate Form Submission
    $('#add-rate-form').on('submit', function(event) {
        event.preventDefault();
        const formData = {
            currency: $('#currency').val(),
            region: $('#region').val(),
            money_changer: $('#money-changer').val(),
            buy_rate: parseFloat($('#buy-rate').val()),
            sell_rate: parseFloat($('#sell-rate').val()),
            location: $('#location').val(),
            unit: $('#unit').val(),
            updated_at: new Date().toISOString().replace('T', ' ').split('.')[0] // e.g., "2025-04-20 01:48:00"
        };

        $.ajax({
            url: '/admin/add-rate',
            method: 'POST',
            data: JSON.stringify(formData),
            contentType: 'application/json',
            success: function(response) {
                console.log('Rate added successfully:', response);
                alert('Rate added successfully!');
                $('#add-rate-form')[0].reset();
            },
            error: function(err) {
                console.error('Error adding rate:', err);
                alert('Failed to add rate: ' + err.responseJSON?.error || 'Unknown error');
            }
        });
    });

    // Search Rates
    $('#search-rates-form').on('submit', function(event) {
        event.preventDefault();
        const currency = $('#search-currency').val();

        $.ajax({
            url: `/admin/search-rates?currency=${currency}&t=${new Date().getTime()}`,
            method: 'GET',
            cache: false,
            success: function(rates) {
                console.log('Fetched rates:', rates);
                const tbody = $('#admin-rates-body');
                tbody.empty();

                if (!rates || rates.length === 0) {
                    tbody.html('<tr><td colspan="6">No rates found.</td></tr>');
                    return;
                }

                rates.forEach(rate => {
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
                });
            },
            error: function(err) {
                console.error('Error fetching rates:', err);
                alert('Failed to fetch rates: ' + err.responseJSON?.error || 'Unknown error');
            }
        });
    });
});