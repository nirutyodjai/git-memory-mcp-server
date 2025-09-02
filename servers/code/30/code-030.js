#!/usr/bin/env node

/**
 * code-030 - MCP Server (code-management)
 * Port: 4329
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

class CODE_030Server {
    constructor() {
        this.server = new Server(
            {
                name: 'code-030',
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
                        name: 'code-management_tool',
                        description: 'Tool for code-management operations',
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
            
            if (toolName === 'code-management_tool') {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `code-030 executed action: ${args.action}`
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
                server: 'code-030',
                port: 4329,
                category: 'code-management',
                timestamp: new Date().toISOString()
            }));
        });

        healthServer.listen(4329, () => {
            console.log(`code-030 health server running on port 4329`);
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log(`code-030 MCP server running`);
    }
}

const server = new CODE_030Server();
server.run().catch(console.error);
