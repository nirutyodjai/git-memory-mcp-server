#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Configuration for scaling to 500 servers
class ScaleTo500Manager {
  constructor() {
    this.runningServers = new Map();
    this.serverStats = {
      total: 0,
      running: 0,
      failed: 0,
      target: 500
    };
    this.categories = ['ai-ml', 'api', 'database', 'filesystem', 'web', 'security', 'monitoring', 'analytics'];
    this.basePort = 3300;
  }

  generateServerConfig(index) {
    const category = this.categories[index % this.categories.length];
    const port = this.basePort + index;
    
    return {
      name: `mcp-server-${category}-${port}`,
      category: category,
      port: port,
      type: 'generated',
      config: {
        name: `MCP Server ${category.toUpperCase()} ${port}`,
        description: `Auto-generated ${category} MCP server on port ${port}`,
        capabilities: this.getCapabilitiesByCategory(category)
      }
    };
  }

  getCapabilitiesByCategory(category) {
    const capabilities = {
      'ai-ml': ['model_inference', 'data_processing', 'ml_pipeline'],
      'api': ['rest_api', 'graphql', 'webhook_handling'],
      'database': ['sql_queries', 'data_migration', 'backup_restore'],
      'filesystem': ['file_operations', 'directory_management', 'file_watching'],
      'web': ['http_server', 'static_files', 'web_scraping'],
      'security': ['authentication', 'encryption', 'access_control'],
      'monitoring': ['health_checks', 'metrics_collection', 'alerting'],
      'analytics': ['data_analysis', 'reporting', 'visualization']
    };
    return capabilities[category] || ['general_purpose'];
  }

  async createServerFile(serverConfig) {
    const serverContent = `#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

class ${serverConfig.name.replace(/-/g, '_').toUpperCase()}Server {
  constructor() {
    this.server = new Server(
      {
        name: '${serverConfig.config.name}',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: '${serverConfig.category}_operation',
            description: '${serverConfig.config.description}',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  description: 'Action to perform'
                },
                data: {
                  type: 'object',
                  description: 'Data for the operation'
                }
              },
              required: ['action']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      if (name === '${serverConfig.category}_operation') {
        return {
          content: [
            {
              type: 'text',
              text: \`Executed \${args.action} operation on ${serverConfig.config.name} (Port: ${serverConfig.port})\`
            }
          ]
        };
      }
      
      throw new Error(\`Unknown tool: \${name}\`);
    });
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[${serverConfig.name}] Server error:', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('${serverConfig.config.name} running on port ${serverConfig.port}');
  }
}

const server = new ${serverConfig.name.replace(/-/g, '_').toUpperCase()}Server();
server.run().catch(console.error);
`;

    const fileName = `${serverConfig.name}.js`;
    const filePath = path.join(__dirname, fileName);
    
    fs.writeFileSync(filePath, serverContent);
    return filePath;
  }

  async startServer(serverConfig) {
    return new Promise(async (resolve, reject) => {
      try {
        // Create server file
        const serverFile = await this.createServerFile(serverConfig);
        
        console.log(`Starting ${serverConfig.name} on port ${serverConfig.port}...`);
        
        const process = spawn('node', [serverFile], {
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: __dirname
        });

        let output = '';
        let errorOutput = '';

        process.stdout.on('data', (data) => {
          output += data.toString();
          if (data.toString().includes('running on port')) {
            console.log(`✅ [${serverConfig.name}] Started successfully`);
          }
        });

        process.stderr.on('data', (data) => {
          errorOutput += data.toString();
          console.error(`❌ [${serverConfig.name}] ERROR: ${data.toString().trim()}`);
        });

        process.on('close', (code) => {
          if (code === 0) {
            this.serverStats.running++;
            resolve({ success: true, output });
          } else {
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
          startTime: new Date(),
          filePath: serverFile
        });

        this.serverStats.total++;

        // Give server time to initialize
        setTimeout(() => {
          if (!process.killed) {
            resolve({ success: true, output: 'Server started' });
          }
        }, 1000);
      } catch (error) {
        reject({ success: false, error: error.message });
      }
    });
  }

  async scaleTo500Servers() {
    console.log('🚀 Scaling MCP system to 500 servers...');
    console.log(`📊 Target: ${this.serverStats.target} servers`);
    
    const batchSize = 10; // Start servers in batches
    const totalBatches = Math.ceil(this.serverStats.target / batchSize);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, this.serverStats.target);
      
      console.log(`\n📦 Starting batch ${batch + 1}/${totalBatches} (servers ${batchStart + 1}-${batchEnd})`);
      
      const batchPromises = [];
      
      for (let i = batchStart; i < batchEnd; i++) {
        const serverConfig = this.generateServerConfig(i);
        batchPromises.push(
          this.startServer(serverConfig).catch(error => {
            console.error(`Failed to start server ${i + 1}:`, error);
            return { success: false, error };
          })
        );
      }
      
      // Wait for batch to complete
      await Promise.allSettled(batchPromises);
      
      // Progress update
      console.log(`📈 Progress: ${this.serverStats.running}/${this.serverStats.target} servers running`);
      
      // Wait between batches to avoid overwhelming the system
      if (batch < totalBatches - 1) {
        console.log('⏳ Waiting 5 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    this.printFinalStats();
  }

  printFinalStats() {
    console.log('\n🎯 === Final MCP System Status ===');
    console.log(`📊 Total servers created: ${this.serverStats.total}`);
    console.log(`✅ Successfully running: ${this.serverStats.running}`);
    console.log(`❌ Failed to start: ${this.serverStats.failed}`);
    console.log(`📈 Success rate: ${((this.serverStats.running / this.serverStats.total) * 100).toFixed(2)}%`);
    
    console.log('\n📋 Server distribution by category:');
    const categoryStats = {};
    
    for (const [name, info] of this.runningServers) {
      if (!info.process.killed) {
        const category = info.config.category;
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      }
    }
    
    for (const [category, count] of Object.entries(categoryStats)) {
      console.log(`  ${category}: ${count} servers`);
    }
    
    console.log('\n🔗 System endpoints:');
    console.log('  MCP Coordinator: http://localhost:3000');
    console.log('  Shared Data Coordinator: http://localhost:3500');
    console.log(`  MCP Servers: ports ${this.basePort}-${this.basePort + this.serverStats.target - 1}`);
  }

  stopAllServers() {
    console.log('🛑 Stopping all MCP servers...');
    for (const [name, info] of this.runningServers) {
      if (!info.process.killed) {
        console.log(`Stopping ${name}...`);
        info.process.kill('SIGTERM');
        
        // Clean up server file
        if (info.filePath && fs.existsSync(info.filePath)) {
          try {
            fs.unlinkSync(info.filePath);
          } catch (error) {
            console.error(`Failed to clean up ${info.filePath}:`, error.message);
          }
        }
      }
    }
  }

  async getSystemStatus() {
    return {
      total: this.serverStats.total,
      running: this.serverStats.running,
      failed: this.serverStats.failed,
      target: this.serverStats.target,
      successRate: (this.serverStats.running / this.serverStats.total) * 100,
      categories: this.categories,
      runningServers: Array.from(this.runningServers.entries()).map(([name, info]) => ({
        name,
        category: info.config.category,
        port: info.config.port,
        startTime: info.startTime,
        running: !info.process.killed
      }))
    };
  }
}

// Main execution
if (require.main === module) {
  const manager = new ScaleTo500Manager();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    manager.stopAllServers();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    manager.stopAllServers();
    process.exit(0);
  });

  // Start scaling process
  manager.scaleTo500Servers().catch(console.error);
}

module.exports = ScaleTo500Manager;