#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

class MemoryMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: '3d-sco-memory',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'set',
            description: 'Store a value in memory with optional expiration',
            inputSchema: {
              type: 'object',
              properties: {
                key: { type: 'string' },
                value: {},
                ttl: { type: 'number' },
                tags: {
                  type: 'array',
                  items: { type: 'string' }
                },
                metadata: { type: 'object' }
              },
              required: ['key', 'value']
            }
          },
          {
            name: 'get',
            description: 'Retrieve a value from memory',
            inputSchema: {
              type: 'object',
              properties: {
                key: { type: 'string' },
                defaultValue: {}
              },
              required: ['key']
            }
          },
          {
            name: 'delete',
            description: 'Delete a value from memory',
            inputSchema: {
              type: 'object',
              properties: {
                key: { type: 'string' }
              },
              required: ['key']
            }
          },
          {
            name: 'query',
            description: 'Query memory entries with filters',
            inputSchema: {
              type: 'object',
              properties: {
                pattern: { type: 'string' },
                tags: {
                  type: 'array',
                  items: { type: 'string' }
                },
                limit: { type: 'number', default: 100 },
                offset: { type: 'number', default: 0 },
                sortBy: {
                  type: 'string',
                  enum: ['key', 'createdAt', 'updatedAt', 'accessCount'],
                  default: 'updatedAt'
                },
                sortOrder: {
                  type: 'string',
                  enum: ['asc', 'desc'],
                  default: 'desc'
                }
              }
            }
          },
          {
            name: 'search',
            description: 'Search memory entries by content',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                fuzzy: { type: 'boolean', default: false },
                limit: { type: 'number', default: 50 }
              },
              required: ['query']
            }
          },
          {
            name: 'bulk_set',
            description: 'Set multiple key-value pairs at once',
            inputSchema: {
              type: 'object',
              properties: {
                entries: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      key: { type: 'string' },
                      value: {},
                      ttl: { type: 'number' },
                      tags: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      metadata: { type: 'object' }
                    },
                    required: ['key', 'value']
                  },
                  maxItems: 100
                }
              },
              required: ['entries']
            }
          },
          {
            name: 'bulk_get',
            description: 'Get multiple values by keys',
            inputSchema: {
              type: 'object',
              properties: {
                keys: {
                  type: 'array',
                  items: { type: 'string' },
                  maxItems: 100
                }
              },
              required: ['keys']
            }
          },
          {
            name: 'bulk_delete',
            description: 'Delete multiple keys at once',
            inputSchema: {
              type: 'object',
              properties: {
                keys: {
                  type: 'array',
                  items: { type: 'string' },
                  maxItems: 100
                },
                pattern: { type: 'string' }
              }
            }
          },
          {
            name: 'expire',
            description: 'Set expiration time for a key',
            inputSchema: {
              type: 'object',
              properties: {
                key: { type: 'string' },
                ttl: { type: 'number' }
              },
              required: ['key', 'ttl']
            }
          },
          {
            name: 'backup',
            description: 'Create a backup of memory data',
            inputSchema: {
              type: 'object',
              properties: {
                includeExpired: { type: 'boolean', default: false },
                tags: {
                  type: 'array',
                  items: { type: 'string' }
                },
                format: {
                  type: 'string',
                  enum: ['json', 'binary'],
                  default: 'json'
                }
              }
            }
          },
          {
            name: 'restore',
            description: 'Restore memory data from backup',
            inputSchema: {
              type: 'object',
              properties: {
                data: {},
                overwrite: { type: 'boolean', default: false },
                format: {
                  type: 'string',
                  enum: ['json', 'binary'],
                  default: 'json'
                }
              },
              required: ['data']
            }
          },
          {
            name: 'configure',
            description: 'Configure memory settings',
            inputSchema: {
              type: 'object',
              properties: {
                maxSize: { type: 'number' },
                defaultTtl: { type: 'number' },
                cleanupInterval: { type: 'number' },
                compressionEnabled: { type: 'boolean' }
              }
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const response = await axios.post(`${this.baseUrl}/api/mcp/memory`, {
          action: name,
          ...args
        }, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Trae-MCP-Memory/1.0.0'
          }
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2)
            }
          ]
        };
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: true,
                message: errorMessage,
                action: name,
                timestamp: new Date().toISOString()
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('3D-SCO Memory MCP server running on stdio');
  }
}

const server = new MemoryMCPServer();
server.run().catch(console.error);