const { createServer } = require('http');

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    model: 'Code-Llama-70B',
    status: 'running',
    message: 'Code-Llama-70B MCP Server is active.'
  }));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Code-Llama-70B MCP Server running on port ${PORT}`);
});