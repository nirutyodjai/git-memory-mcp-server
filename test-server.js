const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        status: 'healthy',
        name: 'test-server',
        port: 3507,
        uptime: process.uptime(),
        memory: process.memoryUsage()
    }));
});

server.listen(3507, () => {
    console.log('Test server running on port 3507');
});

process.on('SIGINT', () => {
    console.log('Shutting down test server...');
    server.close();
    process.exit(0);
});