#!/usr/bin/env node

const http = require('http');
const url = require('url');

class simplemcpdatabase6002SimpleServer {
    constructor() {
        this.name = 'simple-mcp-database-6002';
        this.port = 6002;
        this.category = 'database';
        this.startTime = Date.now();
        this.requestCount = 0;
        this.tools = [
            {
                name: 'database_operation',
                description: 'Perform database operations',
                category: 'database'
            },
            {
                name: 'get_server_info',
                description: 'Get server information',
                category: 'info'
            }
        ];
        
        this.startServer();
    }

    startServer() {
        const server = http.createServer((req, res) => {
            this.requestCount++;
            
            // CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.setHeader('Content-Type', 'application/json');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;
            
            try {
                if (pathname === '/' || pathname === '/health') {
                    this.handleHealth(req, res);
                } else if (pathname === '/tools') {
                    this.handleListTools(req, res);
                } else if (pathname === '/call') {
                    this.handleCallTool(req, res);
                } else if (pathname === '/info') {
                    this.handleServerInfo(req, res);
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Not found' }));
                }
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`[${this.name}] Port ${this.port} is already in use`);
                process.exit(1);
            } else {
                console.error(`[${this.name}] Server error:`, err.message);
            }
        });
        
        server.listen(this.port, () => {
            console.log(`[${this.name}] Simple HTTP server running on port ${this.port}`);
        });
    }

    handleHealth(req, res) {
        const healthData = {
            status: 'healthy',
            name: this.name,
            port: this.port,
            category: this.category,
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            requests: this.requestCount,
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
            type: 'simple-mcp-server'
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(healthData, null, 2));
    }

    handleListTools(req, res) {
        const response = {
            tools: this.tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                category: tool.category,
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: { type: 'string', description: 'Action to perform' },
                        data: { type: 'object', description: 'Data for the action' }
                    },
                    required: ['action']
                }
            }))
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(response, null, 2));
    }

    handleCallTool(req, res) {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const { tool, arguments: args } = JSON.parse(body || '{}');
                
                if (tool === 'database_operation') {
                    const result = {
                        success: true,
                        result: `DATABASE operation '${args?.action || 'default'}' completed successfully on ${this.name}`,
                        server: this.name,
                        category: this.category,
                        timestamp: new Date().toISOString()
                    };
                    
                    res.writeHead(200);
                    res.end(JSON.stringify(result, null, 2));
                } else if (tool === 'get_server_info') {
                    const info = {
                        name: this.name,
                        port: this.port,
                        category: this.category,
                        uptime: Date.now() - this.startTime,
                        requests: this.requestCount,
                        tools: this.tools.length,
                        memory: process.memoryUsage()
                    };
                    
                    res.writeHead(200);
                    res.end(JSON.stringify(info, null, 2));
                } else {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: `Unknown tool: ${tool}` }));
                }
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            }
        });
    }

    handleServerInfo(req, res) {
        const info = {
            server: {
                name: this.name,
                port: this.port,
                category: this.category,
                type: 'simple-mcp-server',
                version: '1.0.0'
            },
            stats: {
                uptime: Math.floor((Date.now() - this.startTime) / 1000),
                requests: this.requestCount,
                startTime: new Date(this.startTime).toISOString(),
                memory: process.memoryUsage()
            },
            tools: this.tools,
            endpoints: [
                { path: '/', method: 'GET', description: 'Health check' },
                { path: '/health', method: 'GET', description: 'Health status' },
                { path: '/tools', method: 'GET', description: 'List available tools' },
                { path: '/call', method: 'POST', description: 'Call a tool' },
                { path: '/info', method: 'GET', description: 'Server information' }
            ]
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(info, null, 2));
    }
}

const server = new simplemcpdatabase6002SimpleServer();

// Keep process alive
process.on('SIGINT', () => {
    console.log(`[${server.name}] Shutting down gracefully...`);
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(`[${server.name}] Received SIGTERM, shutting down...`);
    process.exit(0);
});
