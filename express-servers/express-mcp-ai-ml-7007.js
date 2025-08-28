const express = require('express');
const cors = require('cors');

class expressmcpaiml7007ExpressServer {
    constructor() {
        this.name = 'express-mcp-ai-ml-7007';
        this.port = 7007;
        this.category = 'ai-ml';
        this.startTime = Date.now();
        this.requestCount = 0;
        this.app = express();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.startServer();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use((req, res, next) => {
            this.requestCount++;
            next();
        });
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get(['/', '/health'], (req, res) => {
            res.json({
                status: 'healthy',
                name: this.name,
                port: this.port,
                category: this.category,
                uptime: Math.floor((Date.now() - this.startTime) / 1000),
                requests: this.requestCount,
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString(),
                type: 'express-mcp-server'
            });
        });

        // List tools endpoint
        this.app.get('/tools', (req, res) => {
            res.json({
                tools: [
                    {
                        name: `${this.category}_operation`,
                        description: `Perform ${this.category} operations`,
                        category: this.category,
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
                        category: 'info',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    }
                ]
            });
        });

        // Call tool endpoint
        this.app.post('/call', (req, res) => {
            const { tool, arguments: args } = req.body;
            
            if (tool === `${this.category}_operation`) {
                res.json({
                    success: true,
                    result: `${this.category.toUpperCase()} operation '${args?.action || 'default'}' completed successfully on ${this.name}`,
                    server: this.name,
                    category: this.category,
                    timestamp: new Date().toISOString()
                });
            } else if (tool === 'get_server_info') {
                res.json({
                    name: this.name,
                    port: this.port,
                    category: this.category,
                    uptime: Date.now() - this.startTime,
                    requests: this.requestCount,
                    tools: 2,
                    memory: process.memoryUsage()
                });
            } else {
                res.status(400).json({ error: `Unknown tool: ${tool}` });
            }
        });

        // Server info endpoint
        this.app.get('/info', (req, res) => {
            res.json({
                server: {
                    name: this.name,
                    port: this.port,
                    category: this.category,
                    type: 'express-mcp-server',
                    version: '1.0.0'
                },
                stats: {
                    uptime: Math.floor((Date.now() - this.startTime) / 1000),
                    requests: this.requestCount,
                    startTime: new Date(this.startTime).toISOString(),
                    memory: process.memoryUsage()
                },
                endpoints: [
                    { path: '/', method: 'GET', description: 'Health check' },
                    { path: '/health', method: 'GET', description: 'Health status' },
                    { path: '/tools', method: 'GET', description: 'List available tools' },
                    { path: '/call', method: 'POST', description: 'Call a tool' },
                    { path: '/info', method: 'GET', description: 'Server information' }
                ]
            });
        });

        // Error handling
        this.app.use((err, req, res, next) => {
            console.error(`[${this.name}] Error:`, err.message);
            res.status(500).json({ error: 'Internal server error' });
        });
    }

    startServer() {
        const server = this.app.listen(this.port, () => {
            console.log(`[${this.name}] Express server running on port ${this.port}`);
        });
        
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`[${this.name}] Port ${this.port} is already in use`);
                process.exit(1);
            } else {
                console.error(`[${this.name}] Server error:`, err.message);
            }
        });
    }
}

const server = new expressmcpaiml7007ExpressServer();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(`[${server.name}] Shutting down gracefully...`);
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(`[${server.name}] Received SIGTERM, shutting down...`);
    process.exit(0);
});
