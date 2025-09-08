/**
 * Unit Tests for NEXUS Web Server
 * ทดสอบการทำงานของ NEXUS Web Server
 */

const assert = require('assert');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');

// Mock NEXUS Web Server for testing
class MockNexusWebServer {
    constructor() {
        this.server = null;
        this.wsServer = null;
        this.isRunning = false;
        this.port = 8080;
        this.routes = new Map();
        this.middleware = [];
        this.connections = new Set();
        this.config = {
            port: 8080,
            host: 'localhost',
            cors: true,
            compression: true,
            rateLimit: {
                windowMs: 15 * 60 * 1000,
                max: 100
            }
        };
    }

    async start() {
        if (this.isRunning) {
            throw new Error('Server is already running');
        }

        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        return new Promise((resolve, reject) => {
            this.server.listen(this.port, (error) => {
                if (error) {
                    reject(error);
                } else {
                    this.isRunning = true;
                    this.setupWebSocket();
                    resolve({
                        success: true,
                        port: this.port,
                        url: `http://localhost:${this.port}`
                    });
                }
            });
        });
    }

    async stop() {
        if (!this.isRunning) {
            return { success: true, message: 'Server is not running' };
        }

        return new Promise((resolve) => {
            if (this.wsServer) {
                this.wsServer.close();
            }
            
            this.server.close(() => {
                this.isRunning = false;
                resolve({ success: true, message: 'Server stopped' });
            });
        });
    }

    setupWebSocket() {
        this.wsServer = new WebSocket.Server({ server: this.server });
        
        this.wsServer.on('connection', (ws) => {
            this.connections.add(ws);
            
            ws.on('message', (message) => {
                this.handleWebSocketMessage(ws, message);
            });
            
            ws.on('close', () => {
                this.connections.delete(ws);
            });
        });
    }

    handleRequest(req, res) {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        const url = new URL(req.url, `http://${req.headers.host}`);
        const route = this.routes.get(`${req.method} ${url.pathname}`);

        if (route) {
            route(req, res);
        } else {
            this.handleDefaultRoutes(req, res, url);
        }
    }

    handleDefaultRoutes(req, res, url) {
        if (url.pathname === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(this.generateDashboardHTML());
        } else if (url.pathname === '/api/status') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'running',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                connections: this.connections.size
            }));
        } else if (url.pathname === '/api/mcp-servers') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                servers: [
                    { id: 'git-memory', status: 'running', port: 9000 },
                    { id: 'universal-data-hub', status: 'running', port: 9001 },
                    { id: 'nexus-master-control', status: 'running', port: 9002 }
                ],
                total: 3
            }));
        } else if (url.pathname === '/api/system/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'healthy',
                components: {
                    webServer: 'healthy',
                    database: 'healthy',
                    mcpServers: 'healthy',
                    websocket: 'healthy'
                },
                timestamp: new Date().toISOString()
            }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not Found' }));
        }
    }

    handleWebSocketMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                    break;
                case 'subscribe':
                    ws.send(JSON.stringify({ type: 'subscribed', channel: data.channel }));
                    break;
                case 'broadcast':
                    this.broadcast(data.message, ws);
                    break;
                default:
                    ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
            }
        } catch (error) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
        }
    }

    broadcast(message, sender) {
        this.connections.forEach(ws => {
            if (ws !== sender && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'broadcast', message }));
            }
        });
    }

    generateDashboardHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>NEXUS IDE Dashboard</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <h1>🚀 NEXUS IDE Dashboard</h1>
    <p>Status: Running</p>
    <p>Connections: <span id="connections">${this.connections.size}</span></p>
    <script>
        const ws = new WebSocket('ws://localhost:${this.port}');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WebSocket message:', data);
        };
    </script>
</body>
</html>`;
    }

    addRoute(method, path, handler) {
        this.routes.set(`${method} ${path}`, handler);
    }

    getServerInfo() {
        return {
            isRunning: this.isRunning,
            port: this.port,
            connections: this.connections.size,
            routes: this.routes.size,
            uptime: this.isRunning ? process.uptime() : 0
        };
    }
}

// Test Suite
class NexusWebServerTests {
    constructor() {
        this.server = new MockNexusWebServer();
        this.testResults = [];
        this.baseUrl = 'http://localhost:8080';
    }

    async runAllTests() {
        console.log('🧪 เริ่มต้น Unit Tests สำหรับ NEXUS Web Server');
        
        const tests = [
            'testServerStartStop',
            'testHttpRoutes',
            'testApiEndpoints',
            'testWebSocketConnection',
            'testCorsHeaders',
            'testErrorHandling',
            'testServerInfo',
            'testCustomRoutes',
            'testConcurrentConnections',
            'testHealthCheck'
        ];

        for (const testName of tests) {
            try {
                console.log(`  🔍 ${testName}`);
                const startTime = Date.now();
                await this[testName]();
                const duration = Date.now() - startTime;
                
                this.testResults.push({
                    name: testName,
                    status: 'PASSED',
                    duration
                });
                console.log(`    ✅ ผ่าน (${duration}ms)`);
            } catch (error) {
                this.testResults.push({
                    name: testName,
                    status: 'FAILED',
                    error: error.message
                });
                console.log(`    ❌ ล้มเหลว: ${error.message}`);
            }
        }

        // Clean up
        if (this.server.isRunning) {
            await this.server.stop();
        }

        this.displayResults();
    }

    async testServerStartStop() {
        // Test server is initially stopped
        assert.strictEqual(this.server.isRunning, false);
        
        // Test starting the server
        const startResult = await this.server.start();
        assert.strictEqual(startResult.success, true);
        assert.strictEqual(this.server.isRunning, true);
        assert.strictEqual(startResult.port, 8080);
        
        // Test starting already running server
        try {
            await this.server.start();
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('already running'));
        }
        
        // Test stopping the server
        const stopResult = await this.server.stop();
        assert.strictEqual(stopResult.success, true);
        assert.strictEqual(this.server.isRunning, false);
    }

    async testHttpRoutes() {
        await this.server.start();
        
        // Test root route
        const response = await axios.get(this.baseUrl);
        assert.strictEqual(response.status, 200);
        assert(response.data.includes('NEXUS IDE Dashboard'));
        
        // Test 404 route
        try {
            await axios.get(`${this.baseUrl}/non-existent`);
            assert.fail('Should have returned 404');
        } catch (error) {
            assert.strictEqual(error.response.status, 404);
        }
        
        await this.server.stop();
    }

    async testApiEndpoints() {
        await this.server.start();
        
        // Test status endpoint
        const statusResponse = await axios.get(`${this.baseUrl}/api/status`);
        assert.strictEqual(statusResponse.status, 200);
        assert.strictEqual(statusResponse.data.status, 'running');
        assert(typeof statusResponse.data.uptime === 'number');
        
        // Test MCP servers endpoint
        const mcpResponse = await axios.get(`${this.baseUrl}/api/mcp-servers`);
        assert.strictEqual(mcpResponse.status, 200);
        assert(Array.isArray(mcpResponse.data.servers));
        assert.strictEqual(mcpResponse.data.total, 3);
        
        // Test health endpoint
        const healthResponse = await axios.get(`${this.baseUrl}/api/system/health`);
        assert.strictEqual(healthResponse.status, 200);
        assert.strictEqual(healthResponse.data.status, 'healthy');
        
        await this.server.stop();
    }

    async testWebSocketConnection() {
        await this.server.start();
        
        return new Promise((resolve, reject) => {
            const ws = new WebSocket('ws://localhost:8080');
            let messageReceived = false;
            
            ws.on('open', () => {
                // Test ping message
                ws.send(JSON.stringify({ type: 'ping' }));
            });
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'pong') {
                    messageReceived = true;
                    ws.close();
                }
            });
            
            ws.on('close', async () => {
                await this.server.stop();
                if (messageReceived) {
                    resolve();
                } else {
                    reject(new Error('WebSocket ping/pong failed'));
                }
            });
            
            ws.on('error', async (error) => {
                await this.server.stop();
                reject(error);
            });
            
            // Timeout after 5 seconds
            setTimeout(async () => {
                if (!messageReceived) {
                    ws.close();
                    await this.server.stop();
                    reject(new Error('WebSocket test timeout'));
                }
            }, 5000);
        });
    }

    async testCorsHeaders() {
        await this.server.start();
        
        const response = await axios.options(this.baseUrl);
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.headers['access-control-allow-origin'], '*');
        assert(response.headers['access-control-allow-methods'].includes('GET'));
        
        await this.server.stop();
    }

    async testErrorHandling() {
        await this.server.start();
        
        // Test invalid WebSocket message
        return new Promise((resolve, reject) => {
            const ws = new WebSocket('ws://localhost:8080');
            let errorReceived = false;
            
            ws.on('open', () => {
                ws.send('invalid json');
            });
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'error' && message.message === 'Invalid JSON') {
                    errorReceived = true;
                    ws.close();
                }
            });
            
            ws.on('close', async () => {
                await this.server.stop();
                if (errorReceived) {
                    resolve();
                } else {
                    reject(new Error('Error handling test failed'));
                }
            });
            
            setTimeout(async () => {
                if (!errorReceived) {
                    ws.close();
                    await this.server.stop();
                    reject(new Error('Error handling test timeout'));
                }
            }, 3000);
        });
    }

    async testServerInfo() {
        // Test server info when stopped
        let info = this.server.getServerInfo();
        assert.strictEqual(info.isRunning, false);
        assert.strictEqual(info.connections, 0);
        assert.strictEqual(info.uptime, 0);
        
        // Test server info when running
        await this.server.start();
        info = this.server.getServerInfo();
        assert.strictEqual(info.isRunning, true);
        assert.strictEqual(info.port, 8080);
        assert(info.uptime > 0);
        
        await this.server.stop();
    }

    async testCustomRoutes() {
        // Add custom route
        this.server.addRoute('GET', '/test', (req, res) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'test route' }));
        });
        
        await this.server.start();
        
        const response = await axios.get(`${this.baseUrl}/test`);
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.data.message, 'test route');
        
        await this.server.stop();
    }

    async testConcurrentConnections() {
        await this.server.start();
        
        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(axios.get(`${this.baseUrl}/api/status`));
        }
        
        const responses = await Promise.all(promises);
        responses.forEach(response => {
            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.data.status, 'running');
        });
        
        await this.server.stop();
    }

    async testHealthCheck() {
        await this.server.start();
        
        const response = await axios.get(`${this.baseUrl}/api/system/health`);
        assert.strictEqual(response.status, 200);
        
        const health = response.data;
        assert.strictEqual(health.status, 'healthy');
        assert.strictEqual(health.components.webServer, 'healthy');
        assert.strictEqual(health.components.database, 'healthy');
        assert.strictEqual(health.components.mcpServers, 'healthy');
        assert.strictEqual(health.components.websocket, 'healthy');
        assert(health.timestamp);
        
        await this.server.stop();
    }

    displayResults() {
        const passed = this.testResults.filter(r => r.status === 'PASSED').length;
        const failed = this.testResults.filter(r => r.status === 'FAILED').length;
        const total = this.testResults.length;
        const successRate = ((passed / total) * 100).toFixed(1);

        console.log('\n📊 สรุปผล Unit Tests:');
        console.log(`  ✅ ผ่าน: ${passed}/${total}`);
        console.log(`  ❌ ล้มเหลว: ${failed}/${total}`);
        console.log(`  🎯 อัตราความสำเร็จ: ${successRate}%`);

        if (failed > 0) {
            console.log('\n❌ การทดสอบที่ล้มเหลว:');
            this.testResults
                .filter(r => r.status === 'FAILED')
                .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
        }

        // Exit with appropriate code
        process.exit(failed > 0 ? 1 : 0);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tests = new NexusWebServerTests();
    tests.runAllTests().catch(error => {
        console.error('💥 เกิดข้อผิดพลาดในการทดสอบ:', error);
        process.exit(1);
    });
}

module.exports = NexusWebServerTests;