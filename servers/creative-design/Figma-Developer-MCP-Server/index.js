const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    model: 'Figma-Developer-MCP-Server',
    status: 'active',
    message: 'Figma-Developer-MCP-Server is active.'
  }));
});

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
  console.log(`Figma-Developer-MCP-Server running on port ${PORT}`);
});