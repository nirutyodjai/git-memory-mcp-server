// Test require functionality
try {
  console.log('Testing require...');
  const { logger } = require('./src/utils/logger');
  console.log('Logger loaded successfully');
  
  const MCPServer5500 = require('./src/services/mcp-server-5500');
  console.log('MCPServer5500 loaded successfully');
  
  console.log('All requires working!');
  process.exit(0);
} catch (error) {
  console.error('Require failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}