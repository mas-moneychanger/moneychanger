$(document).ready(function() {
    // Handle Add New Rate Form Submission
    $('#add-rate-form').on('submit', function(e) {
        e.preventDefault();

        const newRate = {
            currency: $('#add-currency').val().toUpperCase(),
            region: $('#add-region').val(),
            money_changer: $('#add-money-changer').val(),
            buy_rate: parseFloat($('#add-buy-rate').val()),
            sell_rate: parseFloat($('#add-sell-rate').val()),
            location: $('#add-location').val(),
            unit: $('#add-unit').val()
        };

        $.ajax({
            url: '/api/rates/add',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(newRate),
            success: function(response) {
                $('#add-message').text('Rate added successfully!').css('color', 'green');
                $('#add-rate-form')[0].reset();
            },
            error: function(err) {
                $('#add-message').text('Error adding rate. Please try again.').css('color', 'red');
                console.error('Error adding rate:', err);
            }
        });
    });

    // Handle Search by Currency
    $('#search-button').on('click', function() {
        const currency = $('#search-currency').val().toUpperCase();
        if (!currency) {
            alert('Please enter a currency to search.');
            return;
        }

        $.ajax({
            url: `/api/rates?currency=${currency}`,
            method: 'GET',
            success: function(rates) {
                const tbody = $('#existing-rates-body');
                tbody.empty();

                if (!rates || rates.length === 0) {
                    tbody.html('<tr><td colspan="10">No rates found for this currency.</td></tr>');
                    return;
                }

                rates.forEach(rate => {
                    const row = $('<tr></tr>');
                    row.html(`
                        <td>${rate.id}</td>
                        <td>${rate.currency}</td>
                        <td>${rate.region}</td>
                        <td>${rate.money_changer}</td>
                        <td><input type="number" class="buy-rate-input" value="${rate.buy_rate}" step="0.0001"></td>
                        <td><input type="number" class="sell-rate-input" value="${rate.sell_rate}" step="0.0001"></td>
                        <td>${rate.location}</td>
                        <td>${rate.updated_at}</td>
                        <td>${rate.unit}</td>
                        <td><button class="update-button" data-id="${rate.id}">Update</button></td>
                    `);
                    tbody.append(row);
                });
            },
            error: function(err) {
                $('#existing-rates-body').html('<tr><td colspan="10" class="error-message">Error loading rates. Please try again.</td></tr>');
                console.error('Error loading rates:', err);
            }
        });
    });

    // Handle Update Button Click
    $('#existing-rates-body').on('click', '.update-button', function() {
        const id = $(this).data('id');
        const row = $(this).closest('tr');
        const updatedRate = {
            buy_rate: parseFloat(row.find('.buy-rate-input').val()),
            sell_rate: parseFloat(row.find('.sell-rate-input').val())
        };

        if (isNaN(updatedRate.buy_rate) || isNaN(updatedRate.sell_rate)) {
            alert('Please enter valid numbers for buy and sell rates.');
            return;
        }

        $.ajax({
            url: `/api/rates/update/${id}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updatedRate),
            success: function(response) {
                alert('Rate updated successfully!');
                $('#search-button').click(); // Refresh the table
            },
            error: function(err) {
                alert('Error updating rate. Please try again.');
                console.error('Error updating rate:', err);
            }
        });
    });
});