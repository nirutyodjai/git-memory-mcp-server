#!/usr/bin/env node

/**
 * MCP Load Balancer Server
 * กระจายโหลดให้กับ MCP servers ทั้งหมด
 * Port: 8080
 */

const http = require('http');
const httpProxy = require('http-proxy-middleware');
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class MCPLoadBalancer {
    constructor() {
        this.port = 8080;
        this.coordinatorUrl = 'http://localhost:9000';
        this.app = express();
        this.servers = [];
        this.currentIndex = 0;
        this.healthCheckInterval = 30000; // 30 seconds
        this.requestCount = 0;
        this.errorCount = 0;
        this.startTime = Date.now();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.startHealthCheck();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // CORS middleware
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });
        
        // Request logging
        this.app.use((req, res, next) => {
            this.requestCount++;
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Request #${this.requestCount}`);
            next();
        });
    }
    
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                uptime: Date.now() - this.startTime,
                totalRequests: this.requestCount,
                errorCount: this.errorCount,
                activeServers: this.servers.filter(s => s.healthy).length,
                totalServers: this.servers.length
            });
        });
        
        // Load balancer stats
        this.app.get('/stats', (req, res) => {
            const healthyServers = this.servers.filter(s => s.healthy);
            const unhealthyServers = this.servers.filter(s => !s.healthy);
            
            res.json({
                loadBalancer: {
                    port: this.port,
                    uptime: Date.now() - this.startTime,
                    totalRequests: this.requestCount,
                    errorCount: this.errorCount,
                    errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) + '%' : '0%'
                },
                servers: {
                    total: this.servers.length,
                    healthy: healthyServers.length,
                    unhealthy: unhealthyServers.length,
                    healthyList: healthyServers.map(s => ({ name: s.name, port: s.port, type: s.type })),
                    unhealthyList: unhealthyServers.map(s => ({ name: s.name, port: s.port, type: s.type, lastError: s.lastError }))
                }
            });
        });
        
        // Refresh servers list
        this.app.post('/refresh', async (req, res) => {
            try {
                await this.loadServers();
                res.json({ message: 'Servers list refreshed', count: this.servers.length });
            } catch (error) {
                res.status(500).json({ error: 'Failed to refresh servers', message: error.message });
            }
        });
        
        // Proxy all other requests to MCP servers
        this.app.use('*', async (req, res) => {
            try {
                const targetServer = this.getNextHealthyServer();
                
                if (!targetServer) {
                    this.errorCount++;
                    return res.status(503).json({ 
                        error: 'No healthy servers available',
                        totalServers: this.servers.length,
                        healthyServers: this.servers.filter(s => s.healthy).length
                    });
                }
                
                const targetUrl = `http://localhost:${targetServer.port}${req.originalUrl}`;
                console.log(`Proxying request to: ${targetServer.name} (${targetUrl})`);
                
                // Forward the request
                const response = await axios({
                    method: req.method,
                    url: targetUrl,
                    data: req.body,
                    headers: {
                        ...req.headers,
                        host: `localhost:${targetServer.port}`
                    },
                    timeout: 30000
                });
                
                // Forward the response
                res.status(response.status);
                Object.keys(response.headers).forEach(key => {
                    res.set(key, response.headers[key]);
                });
                res.send(response.data);
                
            } catch (error) {
                this.errorCount++;
                console.error('Proxy error:', error.message);
                
                if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                    // Mark server as unhealthy
                    const server = this.servers.find(s => s.port === parseInt(error.config?.url?.match(/:([0-9]+)/)?.[1]));
                    if (server) {
                        server.healthy = false;
                        server.lastError = error.message;
                    }
                }
                
                res.status(502).json({ 
                    error: 'Bad Gateway', 
                    message: 'Failed to proxy request to backend server',
                    details: error.message
                });
            }
        });
    }
    
    getNextHealthyServer() {
        const healthyServers = this.servers.filter(s => s.healthy);
        
        if (healthyServers.length === 0) {
            return null;
        }
        
        // Round-robin load balancing
        const server = healthyServers[this.currentIndex % healthyServers.length];
        this.currentIndex++;
        
        return server;
    }
    
    async loadServers() {
        try {
            console.log('Loading servers from coordinator...');
            const response = await axios.get(`${this.coordinatorUrl}/servers`);
            console.log(`[${new Date().toISOString()}] Fetched servers from coordinator`);
            console.log(`[${new Date().toISOString()}] Response structure:`, JSON.stringify(response.data, null, 2));
            
            // Handle different response formats
            let serversList = [];
            if (Array.isArray(response.data)) {
                serversList = response.data;
            } else if (response.data && response.data.success && response.data.data) {
                // Handle coordinator API format: { success: true, data: { content: [...] } }
                if (response.data.data.content && Array.isArray(response.data.data.content)) {
                    const textContent = response.data.data.content.find(c => c.type === 'text');
                    if (textContent && textContent.text) {
                        // Parse text format from coordinator
                        const text = textContent.text;
                        if (text.includes('servers registered') || text.includes('MCP Servers:') || text.includes('- ')) {
                            const lines = text.split('\n').filter(line => line.trim().startsWith('- '));
                            console.log(`[${new Date().toISOString()}] Found ${lines.length} server lines`);
                            serversList = lines.map(line => {
                                // Pattern: - servername-port (type:port) - status
                                let match = line.match(/- ([^\s]+) \(([^:]+):(\d+)\) - (\w+)/);
                                if (match) {
                                    console.log(`[${new Date().toISOString()}] Matched server:`, match[1], match[2], match[3], match[4]);
                                    return {
                                        name: match[1],
                                        type: match[2],
                                        port: parseInt(match[3]),
                                        status: match[4]
                                    };
                                }
                                console.log(`[${new Date().toISOString()}] Failed to match line:`, line);
                                return null;
                            }).filter(Boolean);
                            console.log(`[${new Date().toISOString()}] Parsed ${serversList.length} servers`);
                        }
                    }
                } else if (Array.isArray(response.data.data)) {
                    serversList = response.data.data;
                }
            } else if (response.data && response.data.servers && Array.isArray(response.data.servers)) {
                serversList = response.data.servers;
            } else if (response.data && typeof response.data === 'object') {
                // Parse text format if needed
                const text = response.data.message || response.data.status || '';
                if (text.includes('servers registered')) {
                    // Extract server info from text format
                    const lines = text.split('\n').filter(line => line.includes(' - '));
                    serversList = lines.map(line => {
                        const match = line.match(/- ([^\s]+) \(([^:]+):(\d+)\) - (\w+)/);
                        if (match) {
                            return {
                                name: match[1],
                                type: match[2],
                                port: parseInt(match[3]),
                                status: match[4]
                            };
                        }
                        return null;
                    }).filter(Boolean);
                }
            }
            
            // Filter servers that are available (running, active, or deploying)
            const runningServers = serversList.filter(server => 
                server.status === 'running' || server.status === 'active' || server.status === 'deploying'
            );
            
            this.servers = runningServers.map(server => ({
                ...server,
                healthy: true,
                lastCheck: Date.now(),
                lastError: null
            }));
            
            console.log(`Loaded ${this.servers.length} servers for load balancing`);
            
        } catch (error) {
            console.error('Failed to load servers from coordinator:', error.message);
            throw error;
        }
    }
    
    async checkServerHealth(server) {
        try {
            const response = await axios.get(`http://localhost:${server.port}/health`, {
                timeout: 5000
            });
            
            server.healthy = response.status === 200;
            server.lastCheck = Date.now();
            server.lastError = null;
            
        } catch (error) {
            server.healthy = false;
            server.lastCheck = Date.now();
            server.lastError = error.message;
        }
    }
    
    async startHealthCheck() {
        console.log('Starting health check routine...');
        
        setInterval(async () => {
            if (this.servers.length === 0) {
                try {
                    await this.loadServers();
                } catch (error) {
                    console.error('Failed to load servers during health check:', error.message);
                }
                return;
            }
            
            console.log(`Checking health of ${this.servers.length} servers...`);
            
            const healthCheckPromises = this.servers.map(server => this.checkServerHealth(server));
            await Promise.all(healthCheckPromises);
            
            const healthyCount = this.servers.filter(s => s.healthy).length;
            const unhealthyCount = this.servers.length - healthyCount;
            
            console.log(`Health check complete: ${healthyCount} healthy, ${unhealthyCount} unhealthy`);
            
            if (unhealthyCount > 0) {
                console.log('Unhealthy servers:', 
                    this.servers.filter(s => !s.healthy).map(s => `${s.name}:${s.port} (${s.lastError})`)
                );
            }
            
        }, this.healthCheckInterval);
    }
    
    async start() {
        try {
            // Load initial servers
            await this.loadServers();
            
            // Start the server
            this.app.listen(this.port, () => {
                console.log('🚀 MCP Load Balancer Server started successfully!');
                console.log(`📊 Port: ${this.port}`);
                console.log(`🔗 Health Check: http://localhost:${this.port}/health`);
                console.log(`📈 Statistics: http://localhost:${this.port}/stats`);
                console.log(`🔄 Refresh Servers: POST http://localhost:${this.port}/refresh`);
                console.log(`⚖️  Load balancing ${this.servers.length} servers`);
                console.log('✅ Ready to handle requests!');
            });
            
        } catch (error) {
            console.error('❌ Failed to start load balancer:', error.message);
            process.exit(1);
        }
    }
    
    async stop() {
        console.log('🛑 Stopping MCP Load Balancer...');
        process.exit(0);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

if (require.main === module) {
    const loadBalancer = new MCPLoadBalancer();
    loadBalancer.start().catch(console.error);
}

module.exports = MCPLoadBalancer;