const express = require('express');
const cors = require('cors');

class workingmcpweb8045Server {
    constructor() {
        this.name = 'working-mcp-web-8045';
        this.port = 8045;
        this.category = 'web';
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
                timestamp: new Date().toISOString(),
                type: 'working-mcp-server'
            });
        });

        // List tools endpoint
        this.app.get('/tools', (req, res) => {
            res.json({
                tools: [
                    {
                        name: `${this.category}_operation`,
                        description: `Perform ${this.category} operations`,
                        category: this.category
                    },
                    {
                        name: 'get_server_info',
                        description: 'Get server information',
                        category: 'info'
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
                    result: `${this.category.toUpperCase()} operation completed on ${this.name}`,
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
                    requests: this.requestCount
                });
            } else {
                res.status(400).json({ error: `Unknown tool: ${tool}` });
            }
        });
    }

    startServer() {
        const server = this.app.listen(this.port, () => {
            console.log(`[${this.name}] Server running on port ${this.port}`);
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

const server = new workingmcpweb8045Server();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(`[${server.name}] Shutting down...`);
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(`[${server.name}] Received SIGTERM...`);
    process.exit(0);
});