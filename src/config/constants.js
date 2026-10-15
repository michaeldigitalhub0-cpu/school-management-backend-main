
// ============= SERVER CONSTANTS ============
const server_port =  process.env.NODE_ENV === 'production' ? process.env.SERVER_PORT : 5000;
const server_host =  process.env.NODE_ENV === 'production' ? process.env.SERVER_HOST : '127.0.0.1';
const client_url = process.env.REQUEST_URL;

// ============= AUTHENTICATION ==============
const jwtAccessToken = process.env.ACCESS_KEY;
const jwtRefreshToken = process.env.REFRESH_KEY;
const jwtTimeLimit = process.env.TOKEN_EXPIRES_IN;

// ============= DATABASE CONSTANTS ==========
const database_user = process.env.NODE_ENV === 'production' ? process.env.DB_USER : 'root';
const database_password = process.env.NODE_ENV === 'production' ? process.env.DB_PASSWORD : 'Mike4lyf.,';
const database_host = process.env.NODE_ENV === 'production' ? process.env.DB_HOST : '127.0.0.1';
const database_port = process.env.NODE_ENV === 'production' ? process.env.DB_PORT : 3306;

module.exports = {
    server_port,
    server_host,
    client_url,
    jwtAccessToken,
    jwtRefreshToken,
    jwtTimeLimit,
    database_host,
    database_password,
    database_port,
    database_user
}