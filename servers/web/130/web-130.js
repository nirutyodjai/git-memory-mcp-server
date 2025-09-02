#!/usr/bin/env node

/**
 * web-130 - MCP Server (web-dev)
 * Port: 4029
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

class WEB_130Server {
    constructor() {
        this.server = new Server(
            {
                name: 'web-130',
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
                            text: `web-130 executed action: ${args.action}`
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
                server: 'web-130',
                port: 4029,
                category: 'web-dev',
                timestamp: new Date().toISOString()
            }));
        });

        healthServer.listen(4029, () => {
            console.log(`web-130 health server running on port 4029`);
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log(`web-130 MCP server running`);
    }
}

const server = new WEB_130Server();
server.run().catch(console.error);
