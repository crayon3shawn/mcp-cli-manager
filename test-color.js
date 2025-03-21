const chalk = require('chalk');

console.log('Basic colors:');
console.log(chalk.red('Red'));
console.log(chalk.green('Green'));
console.log(chalk.blue('Blue'));

console.log('\nANSI colors:');
console.log('\x1b[31mRed\x1b[0m');
console.log('\x1b[32mGreen\x1b[0m');
console.log('\x1b[34mBlue\x1b[0m'); 