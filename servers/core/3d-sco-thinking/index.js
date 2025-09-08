const http = require('http');

const hostname = '127.0.0.1';
const port = 4007;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('OK');
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('3D SCO Thinking Server is active.');
  }
});

server.listen(port, hostname, () => {
  console.log(`3D SCO Thinking Server running on port ${port}`);
});