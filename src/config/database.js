const mysql = require('mysql2/promise');
const fs = require('fs');
const { database_user, database_host, database_port, database_password } = require('./constants');

const sslConfig = { minVersion: 'TLSv1.2', rejectUnauthorized: true };

if (process.env.CA_PATH) {
    sslConfig.ca = fs.readFileSync(process.env.CA_PATH);
}

if(process.env.NODE_ENV === 'production'){
    
    const connectionPool = mysql.createPool({
        database: process.env.DB_NAME || 'school_management_system',
        user: database_user,
        host: database_host,
        port: Number(database_port) || 4000,
        password: database_password,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        idleTimeout: 300_000,
        enableKeepAlive: true,
        dateStrings: true,
        ssl: sslConfig,
    });
    module.exports = connectionPool;

}else{

    const connectionPool = mysql.createPool({
        database: process.env.DB_NAME || 'school_management_system',
        user: database_user,
        host: database_host,
        port: Number(database_port) || 4000,
        password: database_password,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        idleTimeout: 300_000,
        enableKeepAlive: true,
        dateStrings: true,
    });

    module.exports = connectionPool
}
