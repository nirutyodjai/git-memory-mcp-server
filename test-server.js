#!/usr/bin/env node

// Simple test to check if server can start
console.log('Testing server startup...');

try {
  // Test imports
  console.log('Testing imports...');
  const { ConfigManager } = await import('./src/config/config.js');
  const { GitMemoryService } = await import('./src/services/git-memory.js');
  const { ConnectionManager } = await import('./src/services/connection-manager.js');
  const { MetricsCollector } = await import('./src/monitoring/metrics.js');
  const { HealthCheck } = await import('./src/monitoring/health-check.js');
  const { RateLimiter } = await import('./src/middleware/rate-limiter.js');

  console.log('✓ All imports successful');

  // Test configuration
  console.log('Testing configuration...');
  const config = new ConfigManager();
  console.log('✓ Config loaded:', config.port);

  // Test services
  console.log('Testing services...');
  const gitService = new GitMemoryService();
  const connectionManager = new ConnectionManager();
  const metrics = new MetricsCollector();
  const healthCheck = new HealthCheck();
  const rateLimiter = new RateLimiter();

  console.log('✓ All services initialized');

  console.log('Server components test completed successfully!');
  console.log('The server should be able to start properly.');

} catch (error) {
  console.error('❌ Error during server test:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}