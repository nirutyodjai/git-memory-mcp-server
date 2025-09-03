#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');

class MCP_MEDIA_Server {
  constructor() {
    this.server = new Server(
      {
        name: 'media-4348',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.serverId = 'media-4348';
    this.category = 'media';
    this.port = 4348;
    this.memoryPath = 'D:\Ai Server\git-memory-mcp-server\.git-memory\servers\media-4348';
    
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

const server = new MCP_MEDIA_Server();
server.run().catch(console.error);
