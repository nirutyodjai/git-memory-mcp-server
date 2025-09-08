const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    model: 'Playwright-MCP-Server',
    status: 'active',
    message: 'Playwright-MCP-Server is active.'
  }));
});

const PORT = process.env.PORT || 4002;
server.listen(PORT, () => {
  console.log(`Playwright-MCP-Server running on port ${PORT}`);
});