
const connectionPool = require('../config/database');

const getExistingUsers = async (role) => {

    const [users] = await connectionPool.execute(`
        SELECT user_id FROM users WHERE user_role = ?
    `, [role]);

    return users;
}

module.exports = getExistingUsers;