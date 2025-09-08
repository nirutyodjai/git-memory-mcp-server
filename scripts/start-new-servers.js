#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Get global npm modules path
const globalModulesPath = path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'node_modules');

// Configuration for new MCP servers
const servers = [
  {
    name: 'memory-server',
    modulePath: path.join(globalModulesPath, '@modelcontextprotocol', 'server-memory', 'dist', 'index.js'),
    port: 3301,
    category: 'ai-ml'
  },
  {
    name: 'filesystem-server', 
    modulePath: path.join(globalModulesPath, '@modelcontextprotocol', 'server-filesystem', 'dist', 'index.js'),
    port: 3302,
    category: 'filesystem'
  },
  {
    name: 'sequential-thinking-server',
    modulePath: path.join(globalModulesPath, '@modelcontextprotocol', 'server-sequential-thinking', 'dist', 'index.js'),
    port: 3303,
    category: 'ai-ml'
  }
];

class NewMCPServerManager {
  constructor() {
    this.runningServers = new Map();
    this.serverStats = {
      total: 0,
      running: 0,
      failed: 0
    };
  }

  checkServerExists(serverConfig) {
    return fs.existsSync(serverConfig.modulePath);
  }

  async startServer(serverConfig) {
    return new Promise((resolve, reject) => {
      console.log(`Starting ${serverConfig.name}...`);
      
      if (!this.checkServerExists(serverConfig)) {
        console.error(`Module not found: ${serverConfig.modulePath}`);
        this.serverStats.failed++;
        reject({ success: false, error: 'Module not found' });
        return;
      }

      const process = spawn('node', [serverConfig.modulePath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: __dirname
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`[${serverConfig.name}] ${data.toString().trim()}`);
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`[${serverConfig.name}] ERROR: ${data.toString().trim()}`);
      });

      process.on('close', (code) => {
        if (code === 0) {
          console.log(`${serverConfig.name} started successfully`);
          this.serverStats.running++;
          resolve({ success: true, output });
        } else {
          console.error(`${serverConfig.name} failed with code ${code}`);
          this.serverStats.failed++;
          reject({ success: false, error: errorOutput, code });
        }
      });

      process.on('error', (error) => {
        console.error(`Failed to start ${serverConfig.name}:`, error);
        this.serverStats.failed++;
        reject({ success: false, error: error.message });
      });

      // Store process reference
      this.runningServers.set(serverConfig.name, {
        process,
        config: serverConfig,
        startTime: new Date()
      });

      this.serverStats.total++;

      // Give server time to initialize
      setTimeout(() => {
        if (!process.killed) {
          resolve({ success: true, output: 'Server started' });
        }
      }, 2000);
    });
  }

  async startAllServers() {
    console.log('Starting new MCP servers...');
    console.log(`Global modules path: ${globalModulesPath}`);
    
    for (const serverConfig of servers) {
      try {
        console.log(`Checking ${serverConfig.name} at ${serverConfig.modulePath}`);
        await this.startServer(serverConfig);
        // Wait between server starts
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to start ${serverConfig.name}:`, error);
      }
    }

    this.printStats();
  }

  printStats() {
    console.log('\n=== New MCP Servers Status ===');
    console.log(`Total servers: ${this.serverStats.total}`);
    console.log(`Running: ${this.serverStats.running}`);
    console.log(`Failed: ${this.serverStats.failed}`);
    console.log('\nRunning servers:');
    
    for (const [name, info] of this.runningServers) {
      if (!info.process.killed) {
        console.log(`- ${name} (PID: ${info.process.pid}, Port: ${info.config.port})`);
      }
    }
  }

  stopAllServers() {
    console.log('Stopping all new MCP servers...');
    for (const [name, info] of this.runningServers) {
      if (!info.process.killed) {
        console.log(`Stopping ${name}...`);
        info.process.kill('SIGTERM');
      }
    }
  }
}

// Main execution
if (require.main === module) {
  const manager = new NewMCPServerManager();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    manager.stopAllServers();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    manager.stopAllServers();
    process.exit(0);
  });

  manager.startAllServers().catch(console.error);
}

module.exports = NewMCPServerManager;