#!/usr/bin/env node

const http = require('http');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

class mcpserverweb5000Server {
    constructor() {
        this.name = 'mcp-server-web-5000';
        this.port = 5000;
        this.category = 'web';
        this.startTime = Date.now();
        this.requestCount = 0;
        
        this.server = new Server({
            name: this.name,
            version: '1.0.0'
        }, {
            capabilities: {
                tools: {},
                resources: {}
            }
        });
        
        this.setupHandlers();
        this.startHealthServer();
    }

    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'web_operation',
                    description: 'Perform web operations for mcp-server-web-5000',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            action: { type: 'string', description: 'Action to perform' },
                            data: { type: 'object', description: 'Data for the action' }
                        },
                        required: ['action']
                    }
                },
                {
                    name: 'get_server_info',
                    description: 'Get server information',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                        required: []
                    }
                }
            ]
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            this.requestCount++;
            
            if (name === 'web_operation') {
                return {
                    content: [{
                        type: 'text',
                        text: `WEB operation '${args.action}' completed successfully on ${this.name}`
                    }]
                };
            }
            
            if (name === 'get_server_info') {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            name: this.name,
                            port: this.port,
                            category: this.category,
                            uptime: Date.now() - this.startTime,
                            requests: this.requestCount
                        }, null, 2)
                    }]
                };
            }
            
            throw new Error(`Unknown tool: ${name}`);
        });
    }

    startHealthServer() {
        const healthServer = http.createServer((req, res) => {
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            
            const healthData = {
                status: 'healthy',
                name: this.name,
                port: this.port,
                category: this.category,
                uptime: Math.floor((Date.now() - this.startTime) / 1000),
                requests: this.requestCount,
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            };
            
            res.end(JSON.stringify(healthData, null, 2));
        });
        
        healthServer.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`[${this.name}] Port ${this.port} is already in use`);
                process.exit(1);
            }
        });
        
        healthServer.listen(this.port, () => {
            console.log(`[${this.name}] Health server running on port ${this.port}`);
        });
    }

    async run() {
        try {
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            console.log(`[${this.name}] MCP Server connected via stdio`);
        } catch (error) {
            console.error(`[${this.name}] Failed to start MCP server:`, error.message);
        }
    }
}

const server = new mcpserverweb5000Server();
server.run().catch(console.error);

// Keep process alive
process.on('SIGINT', () => {
    console.log(`[${server.name}] Shutting down gracefully...`);
    process.exit(0);
});
