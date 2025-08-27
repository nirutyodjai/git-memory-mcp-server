
// Memory Optimization Settings
process.env.NODE_OPTIONS = '--max-old-space-size=8192 --max-semi-space-size=512 --initial-old-space-size=2048 --optimize-for-size --gc-interval=100 --expose-gc';

// Memory monitoring
setInterval(() => {
const MCPServerSharedIntegration = require('./mcp-server-shared-integration');
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 1024 * 1024 * 1024) { // 1GB threshold
        if (global.gc) {
            global.gc();
            console.log('🧹 Garbage collection triggered for', process.pid);
        }
    }
}, 30000); // Check every 30 seconds

// Original server code starts here
#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');

class MCP_FILESYSTEM_Server {
  constructor() {
    this.server = new Server(
      {
        name: 'filesystem-3153',
        version: '1.0.0',

        // Shared Data Integration
        this.sharedIntegration = new MCPServerSharedIntegration(
            'filesystem-3153',
            'filesystem',
            3153
        );

        // Setup shared integration callbacks
        this.setupSharedIntegration();

      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.serverId = 'filesystem-3153';
    this.category = 'filesystem';
    this.port = 3153;
    this.memoryPath = 'D:\Ai Server\git-memory-mcp-server\.git-memory\servers\filesystem-3153';
    
    this.setupTools();
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'server_info',
            description: 'Get server information',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'memory_operation',
            description: 'Perform memory operations',
            inputSchema: {
              type: 'object',
              properties: {
                operation: {
                  type: 'string',
                  enum: ['store', 'retrieve', 'list', 'delete']
                },
                key: { type: 'string' },
                content: { type: 'string' },
                metadata: { type: 'object' }
              },
              required: ['operation']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'server_info':
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                id: this.serverId,
                category: this.category,
                port: this.port,
                status: 'running',
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage()
              }, null, 2)
            }]
          };
        
        case 'memory_operation':
          return await this.handleMemoryOperation(args);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async handleMemoryOperation(args) {
    const { operation, key, content, metadata } = args;
    const memoryFile = path.join(this.memoryPath, 'memory.json');
    
    let memory = {};
    try {
      const data = await fs.readFile(memoryFile, 'utf8');
      memory = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty memory
    }
    
    switch (operation) {
      case 'store':
        memory[key] = {
          content,
          metadata: metadata || {},
          timestamp: new Date().toISOString(),
          serverId: this.serverId
        };
        await fs.writeFile(memoryFile, JSON.stringify(memory, null, 2));
        return {
          content: [{
            type: 'text',
            text: `Stored data with key: ${key}`
          }]
        };
      
      case 'retrieve':
        if (memory[key]) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(memory[key], null, 2)
            }]
          };
        } else {
          throw new Error(`Key not found: ${key}`);
        }
      
      case 'list':
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(Object.keys(memory), null, 2)
          }]
        };
      
      case 'delete':
        if (memory[key]) {
          delete memory[key];
          await fs.writeFile(memoryFile, JSON.stringify(memory, null, 2));
          return {
            content: [{
              type: 'text',
              text: `Deleted key: ${key}`
            }]
          };
        } else {
          throw new Error(`Key not found: ${key}`);
        }
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`MCP Server ${this.serverId} running on port ${this.port}`);
  }
}

const server = new MCP_FILESYSTEM_Server();
server.run().catch(console.error);


    // === Shared Data Integration Methods ===

    // Setup shared integration
    async setupSharedIntegration() {
        try {
            // Register with shared data coordinator
            const registered = await this.sharedIntegration.register();
            if (registered) {
                console.log('✅ Shared integration registered successfully');
                
                // Setup callbacks
                this.sharedIntegration.onDataReceived = this.onSharedDataReceived.bind(this);
                this.sharedIntegration.onChannelMessage = this.onSharedChannelMessage.bind(this);
                
                // Share initial data
                await this.shareInitialData();
            }
        } catch (error) {
            console.error('❌ Shared integration setup failed:', error.message);
        }
    }

    // Handle received shared data
    onSharedDataReceived(dataType, serverId, data, metadata) {
        console.log(`📥 [filesystem-3153] Received ${dataType} from ${serverId}`);
        
        switch (dataType) {
            case 'memory':
                this.handleSharedMemory(serverId, data, metadata);
                break;
            case 'session':
                this.handleSharedSession(serverId, data, metadata);
                break;
            case 'config':
                this.handleSharedConfig(serverId, data, metadata);
                break;
            case 'logs':
                this.handleSharedLogs(serverId, data, metadata);
                break;
        }
    }

    // Handle channel messages
    onSharedChannelMessage(channel, data) {
        console.log(`📢 [filesystem-3153] Channel message on ${channel}:`, data);
        
        // Handle different channel types
        switch (channel) {
            case 'global':
                this.handleGlobalMessage(data);
                break;
            case 'filesystem':
                this.handleCategoryMessage(data);
                break;
            case 'filesystem-3153':
                this.handleDirectMessage(data);
                break;
        }
    }

    // Share initial data
    async shareInitialData() {
        try {
            // Share server status
            await this.sharedIntegration.shareData('status', {
                serverId: 'filesystem-3153',
                status: 'online',
                category: 'filesystem',
                port: 3153,
                startTime: new Date().toISOString()
            });
            
            // Share memory data if available
            if (this.memoryPath && fs.existsSync(this.memoryPath)) {
                const memoryData = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
                await this.sharedIntegration.shareMemory(memoryData);
            }
            
        } catch (error) {
            console.error('❌ Failed to share initial data:', error.message);
        }
    }

    // Handle shared memory
    handleSharedMemory(serverId, data, metadata) {
        // Implement memory handling logic
        console.log(`🧠 Processing shared memory from ${serverId}`);
    }

    // Handle shared session
    handleSharedSession(serverId, data, metadata) {
        // Implement session handling logic
        console.log(`📋 Processing shared session from ${serverId}`);
    }

    // Handle shared config
    handleSharedConfig(serverId, data, metadata) {
        // Implement config handling logic
        console.log(`⚙️ Processing shared config from ${serverId}`);
    }

    // Handle shared logs
    handleSharedLogs(serverId, data, metadata) {
        // Implement log handling logic
        console.log(`📝 Processing shared logs from ${serverId}`);
    }

    // Handle global messages
    handleGlobalMessage(data) {
        console.log('🌐 Global message:', data);
    }

    // Handle category messages
    handleCategoryMessage(data) {
        console.log('📂 Category message:', data);
    }

    // Handle direct messages
    handleDirectMessage(data) {
        console.log('💬 Direct message:', data);
    }

    // Share current memory state
    async shareCurrentMemory() {
        if (this.memoryPath && fs.existsSync(this.memoryPath)) {
            try {
                const memoryData = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
                await this.sharedIntegration.shareMemory(memoryData);
                return true;
            } catch (error) {
                console.error('❌ Failed to share memory:', error.message);
                return false;
            }
        }
        return false;
    }

    // Get shared data from other servers
    async getSharedDataFromServers(dataType) {
        try {
            return await this.sharedIntegration.getSharedData(dataType);
        } catch (error) {
            console.error(`❌ Failed to get shared ${dataType}:`, error.message);
            return [];
        }
    }

    // Broadcast to category channel
    broadcastToCategory(data) {
        this.sharedIntegration.broadcastToChannel('filesystem', data);
    }

    // Broadcast to global channel
    broadcastGlobal(data) {
        this.sharedIntegration.broadcastToChannel('global', data);
    }

    // Commit changes to Git Memory
    async commitToGitMemory(message) {
        return await this.sharedIntegration.commitToGitMemory(message);
    }