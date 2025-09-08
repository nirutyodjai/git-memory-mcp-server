const { createServer } = require('http');

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    model: 'Test-AI-Server',
    status: 'running',
    message: 'Test-AI-Server MCP Server is active.'
  }));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Test-AI-Server MCP Server running on port ${PORT}`);
});