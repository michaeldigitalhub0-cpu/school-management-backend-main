require('dotenv').config();

const app = require('./src/app');
const { server_port, server_host } = require('./src/config/constants');

const PORT = server_port;

const HOST = server_host;

const server = app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
});

server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
});