const crypto = require('crypto');

const chars = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPp0123456789?!&@#.,';

exports.generateUserPassword = () => {
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars[crypto.randomInt(0, chars.length)];
    }
    return password;
};