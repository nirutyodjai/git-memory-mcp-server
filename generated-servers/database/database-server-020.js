#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');

class DatabaseMCPServer {
  constructor() {
    this.serverId = 'database-server-020';
    this.category = 'database';
    this.port = 3119;
    this.memoryFile = path.join(process.cwd(), '.git-memory.json');
    this.server = new Server(
      {
        name: 'database-server-020',
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
          throw new Error(`Unknown tool: ${name}`);
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

      const fullKey = `${this.category}:${key}`;
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
        message: `Memory stored with key: ${fullKey}`,
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
      const fullKey = `${this.category}:${key}`;
      
      if (memory[fullKey]) {
        return {
          success: true,
          data: memory[fullKey]
        };
      } else {
        return {
          success: false,
          error: `Key not found: ${fullKey}`
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
      capabilities: ["memory_store","memory_retrieve","health_check","status_report","query_execute","schema_manage","backup_create","index_optimize"],
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      lastActivity: new Date().toISOString()
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`database-server-020 started on port 3119`);
  }
}

if (require.main === module) {
  const server = new DatabaseMCPServer();
  server.start().catch(console.error);
}

module.exports = DatabaseMCPServer;
