const { GitMemoryServer } = require('./dist/index.js');
const fs = require('fs');
const path = require('path');

console.log('Starting Git Memory MCP Server...');

// Ensure memory directory exists
const memoryDir = path.join(__dirname, 'memory');
if (!fs.existsSync(memoryDir)) {
  fs.mkdirSync(memoryDir, { recursive: true });
}

// Create empty memory file if it doesn't exist
const memoryFile = path.join(memoryDir, 'memory.json');
if (!fs.existsSync(memoryFile)) {
  fs.writeFileSync(memoryFile, JSON.stringify({
    repositories: {},
    patterns: {},
    insights: {},
    metadata: {
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    }
  }, null, 2));
}

const server = new GitMemoryServer();
server.initialize()
  .then(() => {
    console.log(`✅ Git Memory MCP Server started successfully on port ${server.port}!`);
    console.log('🔗 Server is ready for NEXUS IDE connection');
    console.log(`📡 Health check: http://localhost:${server.port}/health`);
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});