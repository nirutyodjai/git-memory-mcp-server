#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');
const { v4: uuidv4 } = require('uuid');

class BatchDeployer {
  constructor() {
    this.configPath = path.join(process.cwd(), 'mcp-coordinator-config.json');
    this.processes = new Map();
    this.deploymentLog = [];
  }

  async loadConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error(chalk.red('❌ Failed to load configuration:'), error.message);
      throw error;
    }
  }

  async saveConfig(config) {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error(chalk.red('❌ Failed to save configuration:'), error.message);
      throw error;
    }
  }

  generateMCPServer(category, index, categoryConfig) {
    const serverId = `${category}-server-${String(index).padStart(3, '0')}`;
    const port = categoryConfig.portStart + index - 1;
    
    return {
      id: serverId,
      name: `${categoryConfig.name} Server ${index}`,
      category: category,
      port: port,
      status: 'pending',
      created: new Date().toISOString(),
      config: {
        type: 'mcp-server',
        version: '1.0.0',
        capabilities: this.generateCapabilities(category),
        memory: {
          enabled: true,
          category: category,
          syncInterval: 60000
        },
        health: {
          endpoint: `/health`,
          interval: 30000,
          timeout: 5000
        }
      },
      script: this.generateServerScript(serverId, port, category)
    };
  }

  generateCapabilities(category) {
    const baseCapabilities = [
      'memory_store',
      'memory_retrieve',
      'health_check',
      'status_report'
    ];

    const categoryCapabilities = {
      'database': ['query_execute', 'schema_manage', 'backup_create', 'index_optimize'],
      'filesystem': ['file_read', 'file_write', 'directory_list', 'file_watch'],
      'api': ['http_request', 'webhook_handle', 'rate_limit', 'auth_validate'],
      'ai-ml': ['model_inference', 'data_preprocess', 'training_manage', 'pipeline_execute'],
      'version-control': ['git_operations', 'branch_manage', 'commit_history', 'merge_conflict'],
      'dev-tools': ['build_execute', 'test_run', 'deploy_manage', 'code_analyze'],
      'system-ops': ['process_monitor', 'log_analyze', 'alert_manage', 'resource_track'],
      'communication': ['message_send', 'notification_push', 'channel_manage', 'user_presence'],
      'business': ['workflow_execute', 'report_generate', 'data_analyze', 'rule_engine'],
      'iot-hardware': ['sensor_read', 'device_control', 'data_collect', 'protocol_handle']
    };

    return [...baseCapabilities, ...(categoryCapabilities[category] || [])];
  }

  generateServerScript(serverId, port, category) {
    return `#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');

class ${this.toPascalCase(category)}MCPServer {
  constructor() {
    this.serverId = '${serverId}';
    this.category = '${category}';
    this.port = ${port};
    this.memoryFile = path.join(process.cwd(), '.git-memory.json');
    this.server = new Server(
      {
        name: '${serverId}',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.setupTools();
  }

  async setupTools() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'memory_store',
            description: 'Store data in memory',
            inputSchema: {
              type: 'object',
              properties: {
                key: { type: 'string' },
                content: { type: 'string' },
                metadata: { type: 'object' }
              },
              required: ['key', 'content']
            }
          },
          {
            name: 'memory_retrieve',
            description: 'Retrieve data from memory',
            inputSchema: {
              type: 'object',
              properties: {
                key: { type: 'string' }
              },
              required: ['key']
            }
          },
          {
            name: 'health_check',
            description: 'Check server health',
            inputSchema: { type: 'object', properties: {} }
          },
          {
            name: 'status_report',
            description: 'Get server status report',
            inputSchema: { type: 'object', properties: {} }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      switch (name) {
        case 'memory_store':
          return { content: [{ type: 'text', text: JSON.stringify(await this.storeMemory(args.key, args.content, args.metadata)) }] };
        case 'memory_retrieve':
          return { content: [{ type: 'text', text: JSON.stringify(await this.retrieveMemory(args.key)) }] };
        case 'health_check':
          return { content: [{ type: 'text', text: JSON.stringify(await this.healthCheck()) }] };
        case 'status_report':
          return { content: [{ type: 'text', text: JSON.stringify(await this.statusReport()) }] };
        default:
          throw new Error(\`Unknown tool: \${name}\`);
      }
    });
  }

  async storeMemory(key, content, metadata = {}) {
    try {
      let memory = {};
      try {
        const data = await fs.readFile(this.memoryFile, 'utf8');
        memory = JSON.parse(data);
      } catch (error) {
        // File doesn't exist, start with empty memory
      }

      const fullKey = \`\${this.category}:\${key}\`;
      memory[fullKey] = {
        content,
        metadata: {
          ...metadata,
          serverId: this.serverId,
          category: this.category,
          timestamp: new Date().toISOString()
        }
      };

      await fs.writeFile(this.memoryFile, JSON.stringify(memory, null, 2));
      
      return {
        success: true,
        message: \`Memory stored with key: \${fullKey}\`,
        key: fullKey
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async retrieveMemory(key) {
    try {
      const data = await fs.readFile(this.memoryFile, 'utf8');
      const memory = JSON.parse(data);
      const fullKey = \`\${this.category}:\${key}\`;
      
      if (memory[fullKey]) {
        return {
          success: true,
          data: memory[fullKey]
        };
      } else {
        return {
          success: false,
          error: \`Key not found: \${fullKey}\`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async healthCheck() {
    return {
      success: true,
      status: 'healthy',
      serverId: this.serverId,
      category: this.category,
      port: this.port,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }

  async statusReport() {
    return {
      serverId: this.serverId,
      category: this.category,
      port: this.port,
      status: 'running',
      capabilities: ${JSON.stringify(this.generateCapabilities(category))},
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      lastActivity: new Date().toISOString()
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(\`${serverId} started on port ${port}\`);
  }
}

if (require.main === module) {
  const server = new ${this.toPascalCase(category)}MCPServer();
  server.start().catch(console.error);
}

module.exports = ${this.toPascalCase(category)}MCPServer;
`;
  }

  toPascalCase(str) {
    return str.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
  }

  async deployBatch(category, count = 50) {
    console.log(chalk.blue(`🚀 Starting batch deployment for category: ${category}`));
    console.log(chalk.gray(`📦 Deploying ${count} servers...`));

    const config = await this.loadConfig();
    const categoryConfig = config.categories[category];
    
    if (!categoryConfig) {
      throw new Error(`Category '${category}' not found in configuration`);
    }

    if (!config.mcpServers) {
      config.mcpServers = [];
    }

    const existingServers = config.mcpServers.filter(s => s.category === category).length;
    const maxServers = categoryConfig.maxServers;
    
    if (existingServers + count > maxServers) {
      console.log(chalk.yellow(`⚠️  Adjusting count from ${count} to ${maxServers - existingServers} (category limit reached)`));
      count = maxServers - existingServers;
    }

    if (count <= 0) {
      console.log(chalk.yellow(`⚠️  No servers to deploy for category '${category}' (limit reached)`));
      return { deployed: 0, skipped: 0, failed: 0 };
    }

    const results = { deployed: 0, skipped: 0, failed: 0 };
    const deploymentBatch = [];

    // Generate server configurations
    for (let i = 0; i < count; i++) {
      const serverIndex = existingServers + i + 1;
      const server = this.generateMCPServer(category, serverIndex, categoryConfig);
      deploymentBatch.push(server);
    }

    // Create server files
    const serversDir = path.join(process.cwd(), 'generated-servers', category);
    await fs.mkdir(serversDir, { recursive: true });

    for (const server of deploymentBatch) {
      try {
        const serverFile = path.join(serversDir, `${server.id}.js`);
        await fs.writeFile(serverFile, server.script);
        
        // Update server config with file path
        server.scriptPath = serverFile;
        server.status = 'deployed';
        
        config.mcpServers.push(server);
        results.deployed++;
        
        console.log(chalk.green(`✅ Deployed: ${server.id} on port ${server.port}`));
      } catch (error) {
        console.error(chalk.red(`❌ Failed to deploy ${server.id}:`, error.message));
        results.failed++;
      }
    }

    // Update statistics
    config.statistics.totalDeployed += results.deployed;
    config.statistics.totalActive += results.deployed;
    config.statistics.lastHealthCheck = new Date().toISOString();

    await this.saveConfig(config);

    console.log(chalk.green(`\n🎉 Batch deployment completed!`));
    console.log(chalk.gray(`📊 Results: ${results.deployed} deployed, ${results.failed} failed`));
    
    return results;
  }

  async deployAllCategories() {
    const config = await this.loadConfig();
    const totalResults = { deployed: 0, skipped: 0, failed: 0 };

    console.log(chalk.blue('🚀 Starting full system deployment...'));
    
    for (const [category, categoryConfig] of Object.entries(config.categories)) {
      console.log(chalk.cyan(`\n📂 Processing category: ${category}`));
      
      try {
        const results = await this.deployBatch(category, 50);
        totalResults.deployed += results.deployed;
        totalResults.skipped += results.skipped;
        totalResults.failed += results.failed;
        
        // Small delay between categories
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(chalk.red(`❌ Failed to deploy category ${category}:`, error.message));
        totalResults.failed += 50; // Assume all failed
      }
    }

    console.log(chalk.green(`\n🎉 Full deployment completed!`));
    console.log(chalk.gray(`📊 Total Results: ${totalResults.deployed} deployed, ${totalResults.failed} failed`));
    
    return totalResults;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const deployer = new BatchDeployer();

  if (args.length === 0) {
    console.log(chalk.yellow('Usage: node deploy-batch.js <category> [count]'));
    console.log(chalk.yellow('   or: node deploy-batch.js --all'));
    console.log(chalk.gray('\nAvailable categories:'));
    console.log(chalk.gray('  database, filesystem, api, ai-ml, version-control'));
    console.log(chalk.gray('  dev-tools, system-ops, communication, business, iot-hardware'));
    process.exit(1);
  }

  const command = args[0];
  
  if (command === '--all') {
    deployer.deployAllCategories()
      .then(results => {
        console.log(chalk.green(`\n✅ Deployment completed: ${results.deployed} servers deployed`));
        process.exit(0);
      })
      .catch(error => {
        console.error(chalk.red('❌ Deployment failed:'), error.message);
        process.exit(1);
      });
  } else {
    const category = command;
    const count = parseInt(args[1]) || 50;
    
    deployer.deployBatch(category, count)
      .then(results => {
        console.log(chalk.green(`\n✅ Batch deployment completed: ${results.deployed} servers deployed`));
        process.exit(0);
      })
      .catch(error => {
        console.error(chalk.red('❌ Batch deployment failed:'), error.message);
        process.exit(1);
      });
  }
}

module.exports = BatchDeployer;