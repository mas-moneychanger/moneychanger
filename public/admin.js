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

    // Validate inputs
    if (!newRate.currency || !newRate.region || !newRate.money_changer || !newRate.location || !newRate.unit) {
        $('#add-message').text('All fields are required.').css('color', 'red');
        return;
    }
    if (isNaN(newRate.buy_rate) || isNaN(newRate.sell_rate)) {
        $('#add-message').text('Buy and sell rates must be valid numbers.').css('color', 'red');
        return;
    }

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