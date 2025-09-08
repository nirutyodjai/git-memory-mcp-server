#!/usr/bin/env node

/**
 * Startup Script for MCP Server 5500
 * Git Memory MCP Server - Trae Agent Integration
 * 
 * This script initializes and starts the MCP server on port 5500
 * for integration with trae-agent and other MCP-compatible clients
 * 
 * @version 1.0.0
 * @author NEXUS Development Team
 * @license MIT
 */

const path = require('path');
const logger = require('./src/utils/logger');
const MCPServer5500 = require('./src/services/mcp-server-5500');

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.MCP_PORT || 5500;
const HOST = process.env.MCP_HOST || 'localhost';

/**
 * Initialize and start the MCP server
 */
async function startServer() {
  try {
    logger.info('='.repeat(60));
    logger.info('🚀 Starting Git Memory MCP Server 5500');
    logger.info('='.repeat(60));
    logger.info(`Environment: ${NODE_ENV}`);
    logger.info(`Host: ${HOST}`);
    logger.info(`Port: ${PORT}`);
    logger.info(`Process ID: ${process.pid}`);
    logger.info(`Node Version: ${process.version}`);
    logger.info(`Working Directory: ${process.cwd()}`);
    logger.info('='.repeat(60));
    
    // Create and start the server
    const server = new MCPServer5500();
    await server.start();
    
    logger.info('✅ MCP Server 5500 started successfully!');
    logger.info('📡 Ready to accept MCP protocol connections');
    logger.info('🔗 Trae Agent integration enabled');
    logger.info('='.repeat(60));
    
    // Log available endpoints
    const basePath = '/api/v1';
    logger.info('📋 Available Endpoints:');
    logger.info(`   Health Check: http://${HOST}:${PORT}/health`);
    logger.info(`   Server Stats: http://${HOST}:${PORT}/stats`);
    logger.info(`   Capabilities: http://${HOST}:${PORT}${basePath}/capabilities`);
    logger.info(`   Tools List:   http://${HOST}:${PORT}${basePath}/tools/list`);
    logger.info(`   Tool Call:    http://${HOST}:${PORT}${basePath}/tools/call`);
    logger.info('='.repeat(60));
    
    // Log Git operations endpoints
    logger.info('🔧 Git Operations:');
    logger.info(`   Status:  POST http://${HOST}:${PORT}${basePath}/git/status`);
    logger.info(`   Log:     POST http://${HOST}:${PORT}${basePath}/git/log`);
    logger.info(`   Diff:    POST http://${HOST}:${PORT}${basePath}/git/diff`);
    logger.info(`   Clone:   POST http://${HOST}:${PORT}${basePath}/git/clone`);
    logger.info(`   Commit:  POST http://${HOST}:${PORT}${basePath}/git/commit`);
    logger.info(`   Branch:  POST http://${HOST}:${PORT}${basePath}/git/branch`);
    logger.info('='.repeat(60));
    
    // Log Memory operations endpoints
    logger.info('🧠 Memory Operations:');
    logger.info(`   Store:    POST http://${HOST}:${PORT}${basePath}/memory/store`);
    logger.info(`   Retrieve: POST http://${HOST}:${PORT}${basePath}/memory/retrieve`);
    logger.info(`   List:     POST http://${HOST}:${PORT}${basePath}/memory/list`);
    logger.info(`   Delete:   POST http://${HOST}:${PORT}${basePath}/memory/delete`);
    logger.info('='.repeat(60));
    
    // Log Semantic search endpoints
    logger.info('🔍 Semantic Search:');
    logger.info(`   Search: POST http://${HOST}:${PORT}${basePath}/semantic/search`);
    logger.info(`   Index:  POST http://${HOST}:${PORT}${basePath}/semantic/index`);
    logger.info('='.repeat(60));
    
    // Performance monitoring
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      logger.debug('📊 Performance Metrics:', {
        uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
        },
        pid: process.pid
      });
    }, 300000); // Log every 5 minutes
    
    return server;
    
  } catch (error) {
    logger.error('❌ Failed to start MCP Server 5500:', error);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

/**
 * Handle process signals for graceful shutdown
 */
function setupSignalHandlers() {
  const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
  
  signals.forEach(signal => {
    process.on(signal, () => {
      logger.info(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);
      
      // Give the server time to finish current requests
      setTimeout(() => {
        logger.info('👋 MCP Server 5500 shutdown complete');
        process.exit(0);
      }, 5000);
    });
  });
}

/**
 * Handle uncaught exceptions and rejections
 */
function setupErrorHandlers() {
  process.on('uncaughtException', (error) => {
    logger.error('💥 Uncaught Exception:', error);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('💥 Unhandled Promise Rejection:', reason);
    logger.error('Promise:', promise);
    // Don't exit on unhandled rejections in development
    if (NODE_ENV === 'production') {
      process.exit(1);
    }
  });
}

/**
 * Display startup banner
 */
function displayBanner() {
  const banner = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🚀 Git Memory MCP Server 5500                            ║
║    📡 Model Context Protocol Integration                     ║
║    🔗 Trae Agent Compatible                                  ║
║                                                              ║
║    🏗️  Advanced Git Operations                              ║
║    🧠 Semantic Memory System                                ║
║    🔍 Vector-based Search                                   ║
║    🔐 Enterprise Security                                   ║
║                                                              ║
║    Environment: ${NODE_ENV.padEnd(12)} Port: ${PORT.toString().padEnd(12)}        ║
║    Host: ${HOST.padEnd(19)} PID: ${process.pid.toString().padEnd(12)}         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;
  
  console.log(banner);
}

/**
 * Main execution
 */
async function main() {
  try {
    // Display banner
    displayBanner();
    
    // Setup error handlers
    setupErrorHandlers();
    
    // Setup signal handlers
    setupSignalHandlers();
    
    // Start the server
    const server = await startServer();
    
    // Keep the process alive
    process.stdin.resume();
    
  } catch (error) {
    logger.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main();
}

module.exports = { startServer, setupSignalHandlers, setupErrorHandlers };