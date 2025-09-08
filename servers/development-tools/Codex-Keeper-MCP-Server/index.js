const http = require('http');

const hostname = '127.0.0.1';
const port = 4004;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Codex-Keeper-MCP-Server is active.');
});

server.listen(port, hostname, () => {
  console.log(`Codex-Keeper-MCP-Server running on port ${port}`);
});