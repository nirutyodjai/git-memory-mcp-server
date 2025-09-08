#!/usr/bin/env node

/**
 * 🚀 NEXUS IDE Startup Script
 * 
 * This script initializes and starts the complete NEXUS IDE system:
 * - AI Memory Proxy
 * - Git Memory Sharing
 * - API Gateway
 * - MCP Server Integration
 * - Health Monitoring
 * 
 * Usage:
 *   node start-nexus-ide.js [options]
 * 
 * Options:
 *   --port <port>     API Gateway port (default: 3000)
 *   --ws-port <port>  WebSocket port (default: 3001)
 *   --debug           Enable debug mode
 *   --production      Run in production mode
 *   --cluster         Enable cluster mode
 *   --help            Show help
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Configuration
const config = {
  port: 3000,
  wsPort: 3001,
  debug: false,
  production: false,
  cluster: false,
  maxRetries: 3,
  retryDelay: 5000,
  healthCheckInterval: 30000
};

// Process arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--port':
      config.port = parseInt(args[++i]) || 3000;
      break;
    case '--ws-port':
      config.wsPort = parseInt(args[++i]) || 3001;
      break;
    case '--debug':
      config.debug = true;
      break;
    case '--production':
      config.production = true;
      break;
    case '--cluster':
      config.cluster = true;
      break;
    case '--help':
      showHelp();
      process.exit(0);
      break;
  }
}

// Global state
const processes = new Map();
const startTime = Date.now();
let isShuttingDown = false;

/**
 * 🎯 Main startup function
 */
async function startNexusIDE() {
  try {
    console.log('🚀 Starting NEXUS IDE System...');
    console.log(`📊 Configuration:`);
    console.log(`   - API Port: ${config.port}`);
    console.log(`   - WebSocket Port: ${config.wsPort}`);
    console.log(`   - Debug Mode: ${config.debug}`);
    console.log(`   - Production Mode: ${config.production}`);
    console.log(`   - Cluster Mode: ${config.cluster}`);
    console.log('');

    // Check prerequisites
    await checkPrerequisites();

    // Create necessary directories
    await createDirectories();

    // Load configuration
    const nexusConfig = await loadConfiguration();

    // Start services in order
    await startServices(nexusConfig);

    // Setup health monitoring
    setupHealthMonitoring();

    // Setup graceful shutdown
    setupGracefulShutdown();

    console.log('✅ NEXUS IDE System started successfully!');
    console.log(`🌐 API Gateway: http://localhost:${config.port}`);
    console.log(`🔌 WebSocket: ws://localhost:${config.wsPort}`);
    console.log(`📊 Health Check: http://localhost:${config.port}/health`);
    console.log('');
    console.log('Press Ctrl+C to stop the system');

  } catch (error) {
    console.error('❌ Failed to start NEXUS IDE:', error.message);
    if (config.debug) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * 🔍 Check prerequisites
 */
async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 16) {
    throw new Error(`Node.js 16+ required, found ${nodeVersion}`);
  }

  // Check required files
  const requiredFiles = [
    'src/ai/memory-proxy.js',
    'src/services/git-memory-sharing.js',
    'src/api-gateway/gateway.js',
    'nexus-ide-integration.js',
    'nexus-mcp-server.js',
    'nexus-config.json'
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Required file not found: ${file}`);
    }
  }

  // Check available ports
  await checkPort(config.port, 'API Gateway');
  await checkPort(config.wsPort, 'WebSocket');

  console.log('✅ Prerequisites check passed');
}

/**
 * 🏗️ Create necessary directories
 */
async function createDirectories() {
  const dirs = [
    'memory',
    'shares',
    'logs',
    'temp',
    'cache',
    'data',
    'backups'
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  }
}

/**
 * ⚙️ Load configuration
 */
async function loadConfiguration() {
  console.log('⚙️ Loading configuration...');
  
  try {
    const configPath = path.resolve('nexus-config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const nexusConfig = JSON.parse(configData);
    
    // Override with command line arguments
    nexusConfig.nexus.api.port = config.port;
    nexusConfig.nexus.websocket.port = config.wsPort;
    
    if (config.production) {
      nexusConfig.nexus.ide.mode = 'production';
      nexusConfig.nexus.logging.level = 'warn';
    }
    
    if (config.debug) {
      nexusConfig.nexus.logging.level = 'debug';
      nexusConfig.nexus.development.debugging.verboseLogging = true;
    }
    
    console.log('✅ Configuration loaded successfully');
    return nexusConfig;
    
  } catch (error) {
    console.warn('⚠️ Failed to load nexus-config.json, using defaults');
    return getDefaultConfig();
  }
}

/**
 * 🚀 Start all services
 */
async function startServices(nexusConfig) {
  console.log('🚀 Starting services...');

  const services = [
    {
      name: 'AI Memory Proxy',
      script: 'src/ai/memory-proxy.js',
      args: [],
      env: { NEXUS_MODE: 'true', DEBUG: config.debug ? 'nexus:*' : '' }
    },
    {
      name: 'Git Memory Sharing',
      script: 'src/services/git-memory-sharing.js',
      args: [],
      env: { NEXUS_MODE: 'true', DEBUG: config.debug ? 'nexus:*' : '' }
    },
    {
      name: 'API Gateway',
      script: 'src/api-gateway/gateway.js',
      args: [],
      env: { 
        NEXUS_MODE: 'true', 
        PORT: config.port.toString(),
        WS_PORT: config.wsPort.toString(),
        DEBUG: config.debug ? 'nexus:*' : '' 
      }
    },
    {
      name: 'MCP Server',
      script: 'nexus-mcp-server.js',
      args: [],
      env: { NEXUS_MODE: 'true', DEBUG: config.debug ? 'nexus:*' : '' }
    }
  ];

  for (const service of services) {
    await startService(service);
    // Wait a bit between service starts
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('✅ All services started successfully');
}

/**
 * 🔧 Start individual service
 */
async function startService(service) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Starting ${service.name}...`);

    const env = { ...process.env, ...service.env };
    const child = spawn('node', [service.script, ...service.args], {
      env,
      stdio: config.debug ? 'inherit' : 'pipe',
      cwd: process.cwd()
    });

    processes.set(service.name, {
      process: child,
      startTime: Date.now(),
      restarts: 0
    });

    child.on('error', (error) => {
      console.error(`❌ ${service.name} failed to start:`, error.message);
      reject(error);
    });

    child.on('exit', (code, signal) => {
      if (!isShuttingDown) {
        console.warn(`⚠️ ${service.name} exited with code ${code}, signal ${signal}`);
        // Auto-restart logic could be added here
      }
    });

    // Give the service time to start
    setTimeout(() => {
      if (child.pid) {
        console.log(`✅ ${service.name} started (PID: ${child.pid})`);
        resolve();
      } else {
        reject(new Error(`${service.name} failed to start`));
      }
    }, 1000);
  });
}

/**
 * 🏥 Setup health monitoring
 */
function setupHealthMonitoring() {
  console.log('🏥 Setting up health monitoring...');

  const healthCheck = setInterval(async () => {
    try {
      // Check API Gateway health
      const response = await fetch(`http://localhost:${config.port}/health`);
      if (!response.ok) {
        console.warn('⚠️ API Gateway health check failed');
      }

      // Check process health
      for (const [name, info] of processes) {
        if (!info.process.pid) {
          console.warn(`⚠️ ${name} process is not running`);
        }
      }

      // Log system stats
      if (config.debug) {
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        const memUsage = process.memoryUsage();
        console.log(`📊 System uptime: ${uptime}s, Memory: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
      }

    } catch (error) {
      console.warn('⚠️ Health check failed:', error.message);
    }
  }, config.healthCheckInterval);

  // Store health check interval for cleanup
  processes.set('health-monitor', { interval: healthCheck });
}

/**
 * 🛑 Setup graceful shutdown
 */
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

    // Stop health monitoring
    const healthMonitor = processes.get('health-monitor');
    if (healthMonitor && healthMonitor.interval) {
      clearInterval(healthMonitor.interval);
    }

    // Stop all services
    for (const [name, info] of processes) {
      if (info.process && info.process.pid) {
        console.log(`🛑 Stopping ${name}...`);
        info.process.kill('SIGTERM');
      }
    }

    // Wait for graceful shutdown
    setTimeout(() => {
      console.log('✅ NEXUS IDE System stopped');
      process.exit(0);
    }, 5000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGQUIT', () => shutdown('SIGQUIT'));
}

/**
 * 🔌 Check if port is available
 */
function checkPort(port, serviceName) {
  return new Promise((resolve, reject) => {
    const net = require('net');
    const server = net.createServer();

    server.listen(port, () => {
      server.once('close', () => resolve());
      server.close();
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use (${serviceName})`));
      } else {
        reject(err);
      }
    });
  });
}

/**
 * 📋 Get default configuration
 */
function getDefaultConfig() {
  return {
    nexus: {
      api: { port: config.port },
      websocket: { port: config.wsPort },
      logging: { level: config.debug ? 'debug' : 'info' }
    }
  };
}

/**
 * 📖 Show help
 */
function showHelp() {
  console.log(`
🚀 NEXUS IDE Startup Script

Usage: node start-nexus-ide.js [options]

Options:
  --port <port>     API Gateway port (default: 3000)
  --ws-port <port>  WebSocket port (default: 3001)
  --debug           Enable debug mode
  --production      Run in production mode
  --cluster         Enable cluster mode
  --help            Show this help

Examples:
  node start-nexus-ide.js
  node start-nexus-ide.js --port 8080 --debug
  node start-nexus-ide.js --production
`);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  if (!isShuttingDown) {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  if (!isShuttingDown) {
    process.exit(1);
  }
});

// Start the system
if (require.main === module) {
  startNexusIDE().catch((error) => {
    console.error('💥 Failed to start NEXUS IDE:', error);
    process.exit(1);
  });
}

module.exports = {
  startNexusIDE,
  config,
  processes
};