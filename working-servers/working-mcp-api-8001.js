const express = require('express');
const cors = require('cors');

class workingmcpapi8001Server {
    constructor() {
        this.name = 'working-mcp-api-8001';
        this.port = parseInt(process.env.PORT || process.env.SERVER_PORT || process.env.MCP_PORT || 8001, 10);
        this.strictPort = process.env.PORT_STRICT === '1' || process.env.MCP_SERVER_PORT_STRICT === '1';
        this.category = 'api';
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
        const maxAttempts = parseInt(process.env.PORT_MAX_ATTEMPTS || '50', 10);
        let attempt = 0;
        const listenOnce = () => {
            const server = this.app.listen(this.port, () => {
                console.log(`[${this.name}] Server running on port ${this.port}`);
            });
            
            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE' && !this.strictPort && attempt < maxAttempts) {
                    console.warn(`[${this.name}] Port ${this.port} in use. Trying next port...`);
                    attempt++;
                    this.port++;
                    const backoff = Math.min(1000, 100 + attempt * 50);
                    setTimeout(listenOnce, backoff);
                } else if (err.code === 'EADDRINUSE') {
                    console.error(`[${this.name}] Port ${this.port} is already in use and strict mode is enabled or attempts exceeded.`);
                    process.exit(1);
                } else {
                    console.error(`[${this.name}] Server error:`, err.message);
                    process.exit(1);
                }
            });
        };
        listenOnce();
    }
}

const server = new workingmcpapi8001Server();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(`[${server.name}] Shutting down...`);
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(`[${server.name}] Received SIGTERM...`);
    process.exit(0);
});