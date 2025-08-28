#!/usr/bin/env node

// Mock Community MCP Servers Deployment Script
// Deploy 346 mock MCP servers for testing

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

class MockCommunityServerDeployer {
  constructor() {
    this.runningServers = new Map();
    this.deploymentStatus = {
      total: 346,
      deployed: 0,
      failed: 0,
      running: 0
    };
    this.startPort = 9000;
    this.endPort = 9345;
  }

  createMockServer(port, name, category) {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        
        if (req.url === '/health') {
          res.end(JSON.stringify({ 
            status: 'healthy', 
            server: name, 
            category: category,
            port: port,
            timestamp: new Date().toISOString()
          }));
        } else if (req.url === '/tools') {
          res.end(JSON.stringify({
            tools: [
              { name: `${category}_list`, description: `List ${category} resources` },
              { name: `${category}_get`, description: `Get specific ${category} resource` },
              { name: `${category}_create`, description: `Create new ${category} resource` },
              { name: `${category}_update`, description: `Update ${category} resource` },
              { name: `${category}_delete`, description: `Delete ${category} resource` }
            ]
          }));
        } else {
          res.end(JSON.stringify({ 
            message: `Mock MCP Server: ${name}`,
            category: category,
            port: port,
            endpoints: ['/health', '/tools'],
            timestamp: new Date().toISOString()
          }));
        }
      });

      server.listen(port, (err) => {
        if (err) {
          console.error(`❌ Failed to start ${name} on port ${port}: ${err.message}`);
          this.deploymentStatus.failed++;
          reject(err);
        } else {
          console.log(`✅ ${name} started successfully on port ${port}`);
          this.runningServers.set(name, server);
          this.deploymentStatus.deployed++;
          this.deploymentStatus.running++;
          resolve(server);
        }
      });

      server.on('error', (error) => {
        console.error(`❌ ${name} error: ${error.message}`);
        this.deploymentStatus.failed++;
        reject(error);
      });
    });
  }

  generateServerConfig(index) {
    const categories = [
      'aggregator', 'search', 'productivity', 'notes', 'database', 'api', 'web', 'auth',
      'communication', 'development', 'cloud', 'filesystem', 'analytics', 'monitoring',
      'ecommerce', 'social', 'ai-ml', 'email', 'crm', 'content', 'security', 'finance',
      'design', 'time-tracking', 'calendar', 'weather', 'news', 'translation', 'utilities',
      'blockchain', 'iot', 'gaming', 'health', 'education', 'travel', 'food', 'music',
      'real-estate', 'legal', 'hr', 'logistics', 'agriculture', 'energy', 'manufacturing',
      'automotive', 'insurance', 'government', 'nonprofit', 'sports', 'science', 'retail'
    ];
    
    const category = categories[index % categories.length];
    const port = this.startPort + index;
    const name = `mcp-server-${category}-${port}`;
    
    return { name, port, category };
  }

  async deployBatch(batchServers, batchSize = 10) {
    const batches = [];
    for (let i = 0; i < batchServers.length; i += batchSize) {
      batches.push(batchServers.slice(i, i + batchSize));
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n📦 Deploying batch ${i + 1}/${batches.length} (${batch.length} servers)...`);
      
      const deployPromises = batch.map(serverConfig => 
        this.createMockServer(serverConfig.port, serverConfig.name, serverConfig.category)
          .catch(error => {
            console.error(`Failed to deploy ${serverConfig.name}: ${error.message}`);
            return null;
          })
      );

      await Promise.allSettled(deployPromises);
      
      // Wait between batches
      if (i < batches.length - 1) {
        console.log('⏳ Waiting 1 second before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async deployAll() {
    console.log(`🎯 Starting deployment of ${this.deploymentStatus.total} mock community MCP servers...`);
    console.log(`📊 Port range: ${this.startPort} - ${this.endPort}`);
    
    const startTime = Date.now();
    
    try {
      // Generate server configurations
      const serverConfigs = [];
      for (let i = 0; i < this.deploymentStatus.total; i++) {
        serverConfigs.push(this.generateServerConfig(i));
      }
      
      await this.deployBatch(serverConfigs, 15);
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log(`\n🎉 Deployment completed in ${duration.toFixed(2)} seconds`);
      console.log(`📈 Status: ${this.deploymentStatus.deployed}/${this.deploymentStatus.total} deployed, ${this.deploymentStatus.failed} failed`);
      console.log(`🟢 Running servers: ${this.deploymentStatus.running}`);
      
      // Save deployment status
      const statusPath = path.join(__dirname, 'mock-community-deployment-status.json');
      fs.writeFileSync(statusPath, JSON.stringify({
        ...this.deploymentStatus,
        deploymentTime: new Date().toISOString(),
        duration: duration,
        runningServers: Array.from(this.runningServers.keys()),
        portRange: { start: this.startPort, end: this.endPort }
      }, null, 2));
      
      console.log(`\n📊 Deployment status saved to: ${statusPath}`);
      console.log(`\n🌐 Test endpoints:`);
      console.log(`  - Health check: http://localhost:9000/health`);
      console.log(`  - Tools list: http://localhost:9000/tools`);
      console.log(`  - Server info: http://localhost:9000/`);
      
    } catch (error) {
      console.error(`💥 Deployment failed: ${error.message}`);
    }
  }

  stopAll() {
    console.log('🛑 Stopping all mock community servers...');
    this.runningServers.forEach((server, name) => {
      console.log(`Stopping ${name}...`);
      server.close();
    });
    this.runningServers.clear();
    this.deploymentStatus.running = 0;
  }

  getStatus() {
    return {
      ...this.deploymentStatus,
      runningServers: Array.from(this.runningServers.keys())
    };
  }

  async healthCheck() {
    console.log('\n🔍 Performing health check on all servers...');
    const healthResults = [];
    
    for (let i = 0; i < 10; i++) { // Check first 10 servers
      const port = this.startPort + i;
      try {
        const response = await fetch(`http://localhost:${port}/health`);
        const data = await response.json();
        healthResults.push({ port, status: 'healthy', data });
        console.log(`✅ Port ${port}: ${data.server} - ${data.status}`);
      } catch (error) {
        healthResults.push({ port, status: 'unhealthy', error: error.message });
        console.log(`❌ Port ${port}: ${error.message}`);
      }
    }
    
    return healthResults;
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, stopping all servers...');
  if (global.deployer) {
    global.deployer.stopAll();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, stopping all servers...');
  if (global.deployer) {
    global.deployer.stopAll();
  }
  process.exit(0);
});

// Main execution
if (require.main === module) {
  const deployer = new MockCommunityServerDeployer();
  global.deployer = deployer;
  deployer.deployAll();
}

module.exports = MockCommunityServerDeployer;