const { exec } = require('child_process');

console.log('Running rate update at', new Date().toISOString());
exec('node src/update-rates.js', (err, stdout, stderr) => {
    if (err) {
        console.error('Error running update-rates.js:', err.message);
        console.error('stderr:', stderr);
        process.exit(1);
    }
    console.log('Rate update output:', stdout);
    if (stderr) {
        console.error('Rate update stderr:', stderr);
    }
    process.exit(0);
});