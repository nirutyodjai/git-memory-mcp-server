#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

class ThinkingMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: '3d-sco-thinking',
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
            name: 'get_templates',
            description: 'Get available thinking process templates',
            inputSchema: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                tags: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          },
          {
            name: 'add_template',
            description: 'Add a new thinking process template',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string' },
                steps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      type: {
                        type: 'string',
                        enum: ['analysis', 'synthesis', 'evaluation', 'decision']
                      },
                      required: { type: 'boolean', default: true }
                    },
                    required: ['id', 'title', 'type']
                  }
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' }
                }
              },
              required: ['name', 'steps']
            }
          },
          {
            name: 'create_process',
            description: 'Create a new thinking process from template',
            inputSchema: {
              type: 'object',
              properties: {
                templateId: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                context: { type: 'object' },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'urgent'],
                  default: 'medium'
                }
              },
              required: ['templateId', 'title']
            }
          },
          {
            name: 'get_process',
            description: 'Get details of a thinking process',
            inputSchema: {
              type: 'object',
              properties: {
                processId: { type: 'string' }
              },
              required: ['processId']
            }
          },
          {
            name: 'start_process',
            description: 'Start executing a thinking process',
            inputSchema: {
              type: 'object',
              properties: {
                processId: { type: 'string' }
              },
              required: ['processId']
            }
          },
          {
            name: 'complete_step',
            description: 'Complete a step in the thinking process',
            inputSchema: {
              type: 'object',
              properties: {
                processId: { type: 'string' },
                stepId: { type: 'string' },
                result: { type: 'object' },
                notes: { type: 'string' },
                confidence: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1,
                  default: 0.8
                }
              },
              required: ['processId', 'stepId', 'result']
            }
          },
          {
            name: 'fail_step',
            description: 'Mark a step as failed with reason',
            inputSchema: {
              type: 'object',
              properties: {
                processId: { type: 'string' },
                stepId: { type: 'string' },
                reason: { type: 'string' },
                retry: { type: 'boolean', default: false }
              },
              required: ['processId', 'stepId', 'reason']
            }
          },
          {
            name: 'get_progress',
            description: 'Get progress of a thinking process',
            inputSchema: {
              type: 'object',
              properties: {
                processId: { type: 'string' }
              },
              required: ['processId']
            }
          },
          {
            name: 'export_process',
            description: 'Export thinking process results',
            inputSchema: {
              type: 'object',
              properties: {
                processId: { type: 'string' },
                format: {
                  type: 'string',
                  enum: ['json', 'markdown', 'pdf'],
                  default: 'json'
                },
                includeSteps: { type: 'boolean', default: true },
                includeNotes: { type: 'boolean', default: true }
              },
              required: ['processId']
            }
          },
          {
            name: 'import_process',
            description: 'Import a thinking process from file',
            inputSchema: {
              type: 'object',
              properties: {
                data: { type: 'object' },
                format: {
                  type: 'string',
                  enum: ['json', 'yaml'],
                  default: 'json'
                },
                overwrite: { type: 'boolean', default: false }
              },
              required: ['data']
            }
          },
          {
            name: 'delete_process',
            description: 'Delete a thinking process',
            inputSchema: {
              type: 'object',
              properties: {
                processId: { type: 'string' },
                force: { type: 'boolean', default: false }
              },
              required: ['processId']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const response = await axios.post(`${this.baseUrl}/api/mcp/thinking`, {
          action: name,
          ...args
        }, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Trae-MCP-Thinking/1.0.0'
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
    console.error('3D-SCO Sequential Thinking MCP server running on stdio');
  }
}

const server = new ThinkingMCPServer();
server.run().catch(console.error);