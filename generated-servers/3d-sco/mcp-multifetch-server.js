#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

class MultiFetchMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: '3d-sco-multifetch',
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
            name: 'fetch_html',
            description: 'Fetch and parse HTML content from a URL',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                selector: { type: 'string' },
                options: {
                  type: 'object',
                  properties: {
                    timeout: { type: 'number', default: 10000 },
                    userAgent: { type: 'string' },
                    headers: { type: 'object' }
                  }
                }
              },
              required: ['url']
            }
          },
          {
            name: 'fetch_json',
            description: 'Fetch JSON data from an API endpoint',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                method: {
                  type: 'string',
                  enum: ['GET', 'POST', 'PUT', 'DELETE'],
                  default: 'GET'
                },
                headers: { type: 'object' },
                body: { type: 'object' },
                options: {
                  type: 'object',
                  properties: {
                    timeout: { type: 'number', default: 10000 }
                  }
                }
              },
              required: ['url']
            }
          },
          {
            name: 'fetch_text',
            description: 'Fetch plain text content from a URL',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                options: {
                  type: 'object',
                  properties: {
                    timeout: { type: 'number', default: 10000 },
                    encoding: { type: 'string', default: 'utf8' }
                  }
                }
              },
              required: ['url']
            }
          },
          {
            name: 'fetch_image',
            description: 'Fetch and process image from a URL',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                options: {
                  type: 'object',
                  properties: {
                    format: {
                      type: 'string',
                      enum: ['jpeg', 'png', 'webp'],
                      default: 'jpeg'
                    },
                    quality: { type: 'number', minimum: 1, maximum: 100, default: 80 },
                    resize: {
                      type: 'object',
                      properties: {
                        width: { type: 'number' },
                        height: { type: 'number' }
                      }
                    }
                  }
                }
              },
              required: ['url']
            }
          },
          {
            name: 'batch_fetch',
            description: 'Fetch multiple URLs concurrently',
            inputSchema: {
              type: 'object',
              properties: {
                urls: {
                  type: 'array',
                  items: { type: 'string' },
                  maxItems: 10
                },
                type: {
                  type: 'string',
                  enum: ['html', 'json', 'text'],
                  default: 'html'
                },
                options: {
                  type: 'object',
                  properties: {
                    timeout: { type: 'number', default: 10000 },
                    concurrent: { type: 'number', default: 3 }
                  }
                }
              },
              required: ['urls']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const response = await axios.post(`${this.baseUrl}/api/mcp/fetch`, {
          action: name,
          ...args
        }, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Trae-MCP-MultiFetch/1.0.0'
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
    console.error('3D-SCO Multi Fetch MCP server running on stdio');
  }
}

const server = new MultiFetchMCPServer();
server.run().catch(console.error);