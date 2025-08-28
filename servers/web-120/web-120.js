#!/usr/bin/env node

/**
 * web-120 - MCP Server (web-dev)
 * Port: 4019
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

class WEB_120Server {
    constructor() {
        this.server = new Server(
            {
                name: 'web-120',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );
        
        this.setupToolHandlers();
        this.startHealthServer();
    }

    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'web-dev_tool',
                        description: 'Tool for web-dev operations',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                action: {
                                    type: 'string',
                                    description: 'Action to perform'
                                }
                            },
                            required: ['action']
                        }
                    }
                ]
            };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name: toolName, arguments: args } = request.params;
            
            if (toolName === 'web-dev_tool') {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `web-120 executed action: ${args.action}`
                        }
                    ]
                };
            }
            
            throw new Error(`Unknown tool: ${toolName}`);
        });
    }

    startHealthServer() {
        const healthServer = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                status: 'healthy', 
                server: 'web-120',
                port: 4019,
                category: 'web-dev',
                timestamp: new Date().toISOString()
            }));
        });

        healthServer.listen(4019, () => {
            console.log(`web-120 health server running on port 4019`);
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log(`web-120 MCP server running`);
    }
}

const server = new WEB_120Server();
server.run().catch(console.error);
