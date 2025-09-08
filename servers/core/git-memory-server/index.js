const http = require('http');

const hostname = '127.0.0.1';
const port = 4005;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('OK');
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('git-memory-server is active.');
  }
});

server.listen(port, hostname, () => {
  console.log(`git-memory-server running on port ${port}`);
});