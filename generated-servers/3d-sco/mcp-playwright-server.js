#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

class PlaywrightMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: '3d-sco-playwright',
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
            name: 'init_browser',
            description: 'Initialize a new browser session',
            inputSchema: {
              type: 'object',
              properties: {
                browserType: {
                  type: 'string',
                  enum: ['chromium', 'firefox', 'webkit'],
                  default: 'chromium'
                },
                options: {
                  type: 'object',
                  properties: {
                    headless: { type: 'boolean', default: true },
                    viewport: {
                      type: 'object',
                      properties: {
                        width: { type: 'number', default: 1280 },
                        height: { type: 'number', default: 720 }
                      }
                    }
                  }
                }
              }
            }
          },
          {
            name: 'navigate_to_url',
            description: 'Navigate to a specific URL',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string' },
                url: { type: 'string' },
                waitUntil: {
                  type: 'string',
                  enum: ['load', 'domcontentloaded', 'networkidle'],
                  default: 'load'
                }
              },
              required: ['sessionId', 'url']
            }
          },
          {
            name: 'get_screenshot',
            description: 'Take a screenshot of the current page',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string' },
                options: {
                  type: 'object',
                  properties: {
                    fullPage: { type: 'boolean', default: false },
                    quality: { type: 'number', minimum: 0, maximum: 100, default: 80 }
                  }
                }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'click_element',
            description: 'Click on a page element',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string' },
                selector: { type: 'string' },
                options: {
                  type: 'object',
                  properties: {
                    timeout: { type: 'number', default: 30000 },
                    force: { type: 'boolean', default: false }
                  }
                }
              },
              required: ['sessionId', 'selector']
            }
          },
          {
            name: 'get_full_dom',
            description: 'Get the full DOM structure of the current page',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string' },
                options: {
                  type: 'object',
                  properties: {
                    includeStyles: { type: 'boolean', default: false },
                    includeScripts: { type: 'boolean', default: false }
                  }
                }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'execute_code',
            description: 'Execute JavaScript code in the browser',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string' },
                code: { type: 'string' },
                args: { type: 'array', default: [] }
              },
              required: ['sessionId', 'code']
            }
          },
          {
            name: 'get_sessions',
            description: 'Get list of active browser sessions',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'cleanup',
            description: 'Clean up all browser sessions',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const response = await axios.post(`${this.baseUrl}/api/mcp/playwright`, {
          action: name,
          ...args
        }, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Trae-MCP-Playwright/1.0.0'
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
    console.error('3D-SCO Playwright MCP server running on stdio');
  }
}

const server = new PlaywrightMCPServer();
server.run().catch(console.error);