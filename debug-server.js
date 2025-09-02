// Debug script to test multi-system server
try {
  console.log('Starting debug test...');
  
  // Test basic requires
  console.log('Testing basic requires...');
  const express = require('express');
  console.log('✓ Express loaded');
  
  const cors = require('cors');
  console.log('✓ CORS loaded');
  
  const helmet = require('helmet');
  console.log('✓ Helmet loaded');
  
  const yaml = require('js-yaml');
  console.log('✓ js-yaml loaded');
  
  const logger = require('./src/utils/logger');
  console.log('✓ Logger loaded');
  
  // Test service requires
  console.log('Testing service requires...');
  const MCPMultiSystemIntegration = require('./src/integration/MCPMultiSystemIntegration');
  console.log('✓ MCPMultiSystemIntegration loaded');
  
  const MultiSystemMiddleware = require('./src/middleware/multiSystemMiddleware');
  console.log('✓ MultiSystemMiddleware loaded');
  
  const MultiSystemRoutes = require('./src/routes/multiSystemRoutes');
  console.log('✓ MultiSystemRoutes loaded');
  
  const GitOperationsService = require('./src/services/GitOperationsService');
  console.log('✓ GitOperationsService loaded');
  
  const MemoryOperationsService = require('./src/services/MemoryOperationsService');
  console.log('✓ MemoryOperationsService loaded');
  
  const SemanticMemoryService = require('./src/services/SemanticMemoryService');
  console.log('✓ SemanticMemoryService loaded');
  
  const AuthService = require('./src/auth/AuthService');
  console.log('✓ AuthService loaded');
  
  console.log('All modules loaded successfully!');
  
} catch (error) {
  console.error('Error occurred:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}