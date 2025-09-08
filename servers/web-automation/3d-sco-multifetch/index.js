const http = require('http');

const hostname = '127.0.0.1';
const port = 4009;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('3D SCO Multi-Fetch Server is active.');
});

server.listen(port, hostname, () => {
  console.log(`3D SCO Multi-Fetch Server running on port ${port}`);
});