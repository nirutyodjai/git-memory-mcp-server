const http = require('http');

const hostname = '127.0.0.1';
const port = 4003;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('GitHub-MCP-Server is active.');
});

server.listen(port, hostname, () => {
  console.log(`GitHub-MCP-Server running on port ${port}`);
});