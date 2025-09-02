#!/usr/bin/env node
/**
 * MCP Server 5500 Starter
 * Starts the MCP Server on port 5500 with proper configuration
 */

const MCPServer5500 = require('./mcp-server-5500');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * Configuration for MCP Server 5500
 */
const config = {
  port: 5500,
  host: 'localhost',
  name: 'Git Memory MCP Server',
  version: '1.2.1',
  description: 'Advanced MCP Server with Git-based memory and enterprise features',
  
  // Server capabilities
  capabilities: {
    memory: {
      persistent: true,
      gitBased: true,
      semantic: true,
      versioned: true
    },
    git: {
      operations: true,
      branches: true,
      commits: true,
      history: true
    },
    enterprise: {
      authentication: true,
      authorization: true,
      monitoring: true,
      scaling: true
    }
  },
  
  // Environment settings
  environment: process.env.NODE_ENV || 'development',
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    timestamp: true
  },
  
  // Security settings
  security: {
    cors: {
      enabled: true,
      origins: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081']
    },
    rateLimit: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000 // requests per window
    }
  },
  
  // Memory settings
  memory: {
    maxSize: '1GB',
    persistInterval: 30000, // 30 seconds
    gitRepo: path.join(process.cwd(), 'data', 'memory-repo')
  }
};

/**
 * Validate environment and dependencies
 */
function validateEnvironment() {
  try {
    console.log('Step 1.1: Starting environment validation...');
    logger.info('Validating environment...');
    
    console.log('Step 1.2: Checking Node.js version...');
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required, current version: ${nodeVersion}`);
    }
    console.log(`Node.js version ${nodeVersion} is compatible`);
    
    console.log('Step 1.3: Checking required directories...');
    // Check required directories
    const requiredDirs = [
      path.join(process.cwd(), 'data'),
      path.join(process.cwd(), 'logs'),
      config.memory.gitRepo
    ];
    
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        logger.info(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      } else {
        console.log(`Directory exists: ${dir}`);
      }
    }
    
    console.log('Step 1.4: Environment validation completed successfully');
    logger.info('Environment validation completed');
  } catch (error) {
    console.error('Environment validation failed:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

/**
 * Initialize Git repository for memory storage
 */
function initializeGitRepo() {
  const { execSync } = require('child_process');
  const gitRepoPath = config.memory.gitRepo;
  
  try {
    if (!fs.existsSync(path.join(gitRepoPath, '.git'))) {
      logger.info('Initializing Git repository for memory storage...');
      
      execSync('git init', { cwd: gitRepoPath, stdio: 'pipe' });
      execSync('git config user.name "MCP Server"', { cwd: gitRepoPath, stdio: 'pipe' });
      execSync('git config user.email "mcp@gitmemory.local"', { cwd: gitRepoPath, stdio: 'pipe' });
      
      // Create initial commit
      const readmePath = path.join(gitRepoPath, 'README.md');
      fs.writeFileSync(readmePath, '# Git Memory MCP Server\n\nThis repository stores persistent memory data for the MCP server.\n');
      
      execSync('git add README.md', { cwd: gitRepoPath, stdio: 'pipe' });
      execSync('git commit -m "Initial commit: MCP Server memory repository"', { cwd: gitRepoPath, stdio: 'pipe' });
      
      logger.info('Git repository initialized successfully');
    } else {
      logger.info('Git repository already exists');
    }
  } catch (error) {
    logger.warn('Git repository initialization failed:', error.message);
    logger.info('Continuing without Git-based memory persistence');
  }
}

/**
 * Setup graceful shutdown
 */
function setupGracefulShutdown(server) {
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    
    try {
      // Stop accepting new connections
      await server.stop();
      logger.info('MCP Server stopped successfully');
      
      // Exit process
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };
  
  // Handle various shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    shutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
  });
}

/**
 * Display startup banner
 */
function displayBanner() {
  const banner = `
╔══════════════════════════════════════════════════════════════╗
║                    Git Memory MCP Server                    ║
║                        Version ${config.version}                        ║
╠══════════════════════════════════════════════════════════════╣
║  🚀 Advanced MCP Server with Git-based Memory               ║
║  🔒 Enterprise Security & Authentication                     ║
║  📊 Real-time Monitoring & Analytics                        ║
║  🌐 Multi-protocol Support (HTTP/WebSocket/MCP)             ║
╠══════════════════════════════════════════════════════════════╣
║  Port: ${config.port.toString().padEnd(53)} ║
║  Host: ${config.host.padEnd(53)} ║
║  Environment: ${config.environment.padEnd(46)} ║
║  Log Level: ${config.logging.level.padEnd(48)} ║
╚══════════════════════════════════════════════════════════════╝
`;
  
  console.log(banner);
}

/**
 * Main startup function
 */
async function startServer() {
  try {
    // Display startup banner
    displayBanner();
    
    console.log('Step 1: Validating environment...');
    // Validate environment
    validateEnvironment();
    
    console.log('Step 2: Initializing Git repository...');
    // Initialize Git repository
    initializeGitRepo();
    
    console.log('Step 3: Creating MCP Server instance...');
    // Create and configure MCP server
    logger.info('Creating MCP Server instance...');
    let server;
    try {
      server = new MCPServer5500();
      console.log('Step 3.1: MCP Server instance created successfully');
      
      console.log('Step 3.2: Initializing MCP Server...');
      await server.init();
      console.log('Step 3.3: MCP Server initialized successfully');
    } catch (error) {
      console.error('Error creating/initializing MCP Server:', error.message);
      console.error('Stack trace:', error.stack);
      throw error;
    }
    
    console.log('Step 4: Setting up graceful shutdown...');
    // Setup graceful shutdown
    setupGracefulShutdown(server);
    
    console.log('Step 5: Starting the server...');
    // Start the server
    logger.info(`Starting MCP Server on ${config.host}:${config.port}...`);
    await server.start();
    
    // Server started successfully
    logger.info('🎉 MCP Server started successfully!');
    logger.info(`📡 Server listening on http://${config.host}:${config.port}`);
    logger.info(`📚 API Documentation: http://${config.host}:${config.port}/docs`);
    logger.info(`💾 Memory Repository: ${config.memory.gitRepo}`);
    logger.info(`🔧 Environment: ${config.environment}`);
    
    // Log server capabilities
    logger.info('Server Capabilities:', {
      memory: config.capabilities.memory,
      git: config.capabilities.git,
      enterprise: config.capabilities.enterprise
    });
    
    // Performance monitoring
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      logger.debug('Performance Metrics:', {
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
        },
        cpu: {
          user: Math.round(cpuUsage.user / 1000) + 'ms',
          system: Math.round(cpuUsage.system / 1000) + 'ms'
        },
        uptime: Math.round(process.uptime()) + 's'
      });
    }, 60000); // Every minute
    
  } catch (error) {
    logger.error('Failed to start MCP Server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Startup error:', error);
    process.exit(1);
  });
}

module.exports = {
  startServer,
  config
};