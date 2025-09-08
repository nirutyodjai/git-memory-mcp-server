const http = require('http');

const hostname = '127.0.0.1';
const port = 4010;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Puppeteer Server is active.');
});

server.listen(port, hostname, () => {
  console.log(`Puppeteer Server running on port ${port}`);
});