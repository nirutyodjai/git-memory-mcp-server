/**
 * Integration Tests for MCP Communication Layer
 * ทดสอบการเชื่อมต่อและสื่อสารระหว่าง MCP Servers
 */

const assert = require('assert');
const WebSocket = require('ws');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Mock MCP Server for testing
class MockMCPServer {
    constructor(id, port) {
        this.id = id;
        this.port = port;
        this.server = null;
        this.wsServer = null;
        this.isRunning = false;
        this.connections = new Set();
        this.messageQueue = [];
        this.handlers = new Map();
        this.metrics = {
            messagesReceived: 0,
            messagesSent: 0,
            connectionsTotal: 0,
            errors: 0,
            uptime: 0
        };
        this.startTime = null;
    }

    async start() {
        if (this.isRunning) {
            throw new Error(`MCP Server ${this.id} is already running`);
        }

        const http = require('http');
        this.server = http.createServer((req, res) => {
            this.handleHttpRequest(req, res);
        });

        return new Promise((resolve, reject) => {
            this.server.listen(this.port, (error) => {
                if (error) {
                    reject(error);
                } else {
                    this.isRunning = true;
                    this.startTime = Date.now();
                    this.setupWebSocket();
                    this.setupDefaultHandlers();
                    resolve({
                        success: true,
                        id: this.id,
                        port: this.port,
                        url: `http://localhost:${this.port}`
                    });
                }
            });
        });
    }

    async stop() {
        if (!this.isRunning) {
            return { success: true, message: `MCP Server ${this.id} is not running` };
        }

        return new Promise((resolve) => {
            if (this.wsServer) {
                this.wsServer.close();
            }
            
            this.server.close(() => {
                this.isRunning = false;
                this.startTime = null;
                resolve({ success: true, message: `MCP Server ${this.id} stopped` });
            });
        });
    }

    setupWebSocket() {
        this.wsServer = new WebSocket.Server({ server: this.server });
        
        this.wsServer.on('connection', (ws, req) => {
            this.connections.add(ws);
            this.metrics.connectionsTotal++;
            
            ws.on('message', (message) => {
                this.handleMessage(ws, message);
            });
            
            ws.on('close', () => {
                this.connections.delete(ws);
            });
            
            ws.on('error', (error) => {
                this.metrics.errors++;
                console.error(`WebSocket error in ${this.id}:`, error);
            });
            
            // Send welcome message
            this.sendMessage(ws, {
                type: 'welcome',
                serverId: this.id,
                timestamp: Date.now()
            });
        });
    }

    setupDefaultHandlers() {
        this.addHandler('ping', (ws, data) => {
            this.sendMessage(ws, {
                type: 'pong',
                serverId: this.id,
                timestamp: Date.now(),
                originalTimestamp: data.timestamp
            });
        });

        this.addHandler('status', (ws, data) => {
            this.sendMessage(ws, {
                type: 'status_response',
                serverId: this.id,
                status: 'running',
                metrics: this.getMetrics(),
                timestamp: Date.now()
            });
        });

        this.addHandler('broadcast', (ws, data) => {
            this.broadcast(data.message, ws);
        });

        this.addHandler('echo', (ws, data) => {
            this.sendMessage(ws, {
                type: 'echo_response',
                serverId: this.id,
                originalMessage: data.message,
                timestamp: Date.now()
            });
        });
    }

    handleHttpRequest(req, res) {
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
        
        if (url.pathname === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'healthy',
                serverId: this.id,
                uptime: this.getUptime(),
                metrics: this.getMetrics()
            }));
        } else if (url.pathname === '/metrics') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(this.getMetrics()));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not Found', serverId: this.id }));
        }
    }

    handleMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            this.metrics.messagesReceived++;
            
            const handler = this.handlers.get(data.type);
            if (handler) {
                handler(ws, data);
            } else {
                this.sendMessage(ws, {
                    type: 'error',
                    serverId: this.id,
                    message: `Unknown message type: ${data.type}`,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            this.metrics.errors++;
            this.sendMessage(ws, {
                type: 'error',
                serverId: this.id,
                message: 'Invalid JSON message',
                timestamp: Date.now()
            });
        }
    }

    sendMessage(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
            this.metrics.messagesSent++;
        }
    }

    broadcast(message, sender) {
        this.connections.forEach(ws => {
            if (ws !== sender && ws.readyState === WebSocket.OPEN) {
                this.sendMessage(ws, {
                    type: 'broadcast',
                    serverId: this.id,
                    message,
                    timestamp: Date.now()
                });
            }
        });
    }

    addHandler(type, handler) {
        this.handlers.set(type, handler);
    }

    getMetrics() {
        return {
            ...this.metrics,
            uptime: this.getUptime(),
            activeConnections: this.connections.size,
            timestamp: Date.now()
        };
    }

    getUptime() {
        return this.startTime ? Date.now() - this.startTime : 0;
    }

    getServerInfo() {
        return {
            id: this.id,
            port: this.port,
            isRunning: this.isRunning,
            connections: this.connections.size,
            metrics: this.getMetrics()
        };
    }
}

// MCP Communication Test Suite
class MCPCommunicationTests {
    constructor() {
        this.servers = [];
        this.testResults = [];
        this.basePort = 9000;
    }

    async runAllTests() {
        console.log('🧪 เริ่มต้น Integration Tests สำหรับ MCP Communication Layer');
        
        const tests = [
            'testServerStartup',
            'testBasicCommunication',
            'testMultiServerCommunication',
            'testMessageBroadcasting',
            'testErrorHandling',
            'testConnectionResilience',
            'testPerformanceMetrics',
            'testHealthChecks',
            'testConcurrentConnections',
            'testMessageQueuing'
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

        // Clean up all servers
        await this.cleanupServers();
        this.displayResults();
    }

    async setupServers(count = 3) {
        this.servers = [];
        for (let i = 0; i < count; i++) {
            const server = new MockMCPServer(`mcp-server-${i}`, this.basePort + i);
            this.servers.push(server);
            await server.start();
        }
    }

    async cleanupServers() {
        for (const server of this.servers) {
            if (server.isRunning) {
                await server.stop();
            }
        }
        this.servers = [];
    }

    async testServerStartup() {
        await this.setupServers(2);
        
        // Verify all servers are running
        for (const server of this.servers) {
            assert.strictEqual(server.isRunning, true);
            assert(server.port >= this.basePort);
            
            // Test HTTP health endpoint
            const response = await axios.get(`http://localhost:${server.port}/health`);
            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.data.status, 'healthy');
            assert.strictEqual(response.data.serverId, server.id);
        }
        
        await this.cleanupServers();
    }

    async testBasicCommunication() {
        await this.setupServers(1);
        const server = this.servers[0];
        
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://localhost:${server.port}`);
            let welcomeReceived = false;
            let pongReceived = false;
            
            ws.on('open', () => {
                // Send ping message
                ws.send(JSON.stringify({
                    type: 'ping',
                    timestamp: Date.now()
                }));
            });
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                
                if (message.type === 'welcome') {
                    welcomeReceived = true;
                    assert.strictEqual(message.serverId, server.id);
                } else if (message.type === 'pong') {
                    pongReceived = true;
                    assert.strictEqual(message.serverId, server.id);
                    assert(message.originalTimestamp);
                    ws.close();
                }
            });
            
            ws.on('close', async () => {
                await this.cleanupServers();
                if (welcomeReceived && pongReceived) {
                    resolve();
                } else {
                    reject(new Error('Basic communication test failed'));
                }
            });
            
            ws.on('error', async (error) => {
                await this.cleanupServers();
                reject(error);
            });
            
            setTimeout(async () => {
                ws.close();
                await this.cleanupServers();
                reject(new Error('Basic communication test timeout'));
            }, 5000);
        });
    }

    async testMultiServerCommunication() {
        await this.setupServers(3);
        
        const connections = [];
        const promises = [];
        
        for (const server of this.servers) {
            const promise = new Promise((resolve, reject) => {
                const ws = new WebSocket(`ws://localhost:${server.port}`);
                connections.push(ws);
                
                let statusReceived = false;
                
                ws.on('open', () => {
                    ws.send(JSON.stringify({
                        type: 'status',
                        timestamp: Date.now()
                    }));
                });
                
                ws.on('message', (data) => {
                    const message = JSON.parse(data);
                    
                    if (message.type === 'status_response') {
                        statusReceived = true;
                        assert.strictEqual(message.serverId, server.id);
                        assert.strictEqual(message.status, 'running');
                        assert(message.metrics);
                        resolve();
                    }
                });
                
                ws.on('error', reject);
                
                setTimeout(() => {
                    if (!statusReceived) {
                        reject(new Error(`Status not received from ${server.id}`));
                    }
                }, 3000);
            });
            
            promises.push(promise);
        }
        
        await Promise.all(promises);
        
        // Close all connections
        connections.forEach(ws => ws.close());
        await this.cleanupServers();
    }

    async testMessageBroadcasting() {
        await this.setupServers(1);
        const server = this.servers[0];
        
        return new Promise((resolve, reject) => {
            const ws1 = new WebSocket(`ws://localhost:${server.port}`);
            const ws2 = new WebSocket(`ws://localhost:${server.port}`);
            
            let ws1Ready = false;
            let ws2Ready = false;
            let broadcastReceived = false;
            
            const checkReady = () => {
                if (ws1Ready && ws2Ready) {
                    // Send broadcast from ws1
                    ws1.send(JSON.stringify({
                        type: 'broadcast',
                        message: 'Hello from ws1'
                    }));
                }
            };
            
            ws1.on('open', () => {
                ws1Ready = true;
                checkReady();
            });
            
            ws2.on('open', () => {
                ws2Ready = true;
                checkReady();
            });
            
            ws1.on('message', (data) => {
                const message = JSON.parse(data);
                // ws1 should not receive its own broadcast
                if (message.type === 'broadcast') {
                    reject(new Error('Sender received its own broadcast'));
                }
            });
            
            ws2.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'broadcast') {
                    broadcastReceived = true;
                    assert.strictEqual(message.serverId, server.id);
                    assert.strictEqual(message.message, 'Hello from ws1');
                    ws1.close();
                    ws2.close();
                }
            });
            
            ws1.on('close', () => {
                if (broadcastReceived) {
                    resolve();
                }
            });
            
            ws2.on('close', async () => {
                await this.cleanupServers();
                if (!broadcastReceived) {
                    reject(new Error('Broadcast not received'));
                }
            });
            
            setTimeout(async () => {
                ws1.close();
                ws2.close();
                await this.cleanupServers();
                reject(new Error('Broadcast test timeout'));
            }, 5000);
        });
    }

    async testErrorHandling() {
        await this.setupServers(1);
        const server = this.servers[0];
        
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://localhost:${server.port}`);
            let errorReceived = false;
            
            ws.on('open', () => {
                // Send invalid JSON
                ws.send('invalid json');
                
                // Send unknown message type
                setTimeout(() => {
                    ws.send(JSON.stringify({
                        type: 'unknown_type',
                        data: 'test'
                    }));
                }, 100);
            });
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'error') {
                    errorReceived = true;
                    assert.strictEqual(message.serverId, server.id);
                    assert(message.message);
                    ws.close();
                }
            });
            
            ws.on('close', async () => {
                await this.cleanupServers();
                if (errorReceived) {
                    resolve();
                } else {
                    reject(new Error('Error handling test failed'));
                }
            });
            
            setTimeout(async () => {
                ws.close();
                await this.cleanupServers();
                reject(new Error('Error handling test timeout'));
            }, 3000);
        });
    }

    async testConnectionResilience() {
        await this.setupServers(1);
        const server = this.servers[0];
        
        // Test multiple rapid connections
        const connections = [];
        const promises = [];
        
        for (let i = 0; i < 5; i++) {
            const promise = new Promise((resolve, reject) => {
                const ws = new WebSocket(`ws://localhost:${server.port}`);
                connections.push(ws);
                
                ws.on('open', () => {
                    ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                });
                
                ws.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'pong') {
                        ws.close();
                        resolve();
                    }
                });
                
                ws.on('error', reject);
            });
            
            promises.push(promise);
        }
        
        await Promise.all(promises);
        await this.cleanupServers();
    }

    async testPerformanceMetrics() {
        await this.setupServers(1);
        const server = this.servers[0];
        
        // Get initial metrics
        const initialResponse = await axios.get(`http://localhost:${server.port}/metrics`);
        const initialMetrics = initialResponse.data;
        
        // Send some messages
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://localhost:${server.port}`);
            let messageCount = 0;
            
            ws.on('open', () => {
                // Send multiple ping messages
                for (let i = 0; i < 5; i++) {
                    ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                }
            });
            
            ws.on('message', async (data) => {
                const message = JSON.parse(data);
                if (message.type === 'pong') {
                    messageCount++;
                    
                    if (messageCount === 5) {
                        // Check final metrics
                        const finalResponse = await axios.get(`http://localhost:${server.port}/metrics`);
                        const finalMetrics = finalResponse.data;
                        
                        assert(finalMetrics.messagesReceived > initialMetrics.messagesReceived);
                        assert(finalMetrics.messagesSent > initialMetrics.messagesSent);
                        assert(finalMetrics.uptime > 0);
                        
                        ws.close();
                        await this.cleanupServers();
                        resolve();
                    }
                }
            });
            
            ws.on('error', async (error) => {
                await this.cleanupServers();
                reject(error);
            });
        });
    }

    async testHealthChecks() {
        await this.setupServers(2);
        
        for (const server of this.servers) {
            const response = await axios.get(`http://localhost:${server.port}/health`);
            
            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.data.status, 'healthy');
            assert.strictEqual(response.data.serverId, server.id);
            assert(response.data.uptime >= 0);
            assert(response.data.metrics);
        }
        
        await this.cleanupServers();
    }

    async testConcurrentConnections() {
        await this.setupServers(1);
        const server = this.servers[0];
        
        const connectionCount = 10;
        const promises = [];
        
        for (let i = 0; i < connectionCount; i++) {
            const promise = new Promise((resolve, reject) => {
                const ws = new WebSocket(`ws://localhost:${server.port}`);
                
                ws.on('open', () => {
                    ws.send(JSON.stringify({
                        type: 'echo',
                        message: `Message from connection ${i}`
                    }));
                });
                
                ws.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'echo_response') {
                        assert.strictEqual(message.originalMessage, `Message from connection ${i}`);
                        ws.close();
                        resolve();
                    }
                });
                
                ws.on('error', reject);
            });
            
            promises.push(promise);
        }
        
        await Promise.all(promises);
        
        // Verify server handled all connections
        const metrics = server.getMetrics();
        assert(metrics.connectionsTotal >= connectionCount);
        
        await this.cleanupServers();
    }

    async testMessageQueuing() {
        await this.setupServers(1);
        const server = this.servers[0];
        
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://localhost:${server.port}`);
            const messages = [];
            let expectedMessages = 3;
            
            ws.on('open', () => {
                // Send multiple messages rapidly
                ws.send(JSON.stringify({ type: 'echo', message: 'Message 1' }));
                ws.send(JSON.stringify({ type: 'echo', message: 'Message 2' }));
                ws.send(JSON.stringify({ type: 'echo', message: 'Message 3' }));
            });
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'echo_response') {
                    messages.push(message.originalMessage);
                    
                    if (messages.length === expectedMessages) {
                        // Verify all messages were received
                        assert(messages.includes('Message 1'));
                        assert(messages.includes('Message 2'));
                        assert(messages.includes('Message 3'));
                        
                        ws.close();
                    }
                }
            });
            
            ws.on('close', async () => {
                await this.cleanupServers();
                if (messages.length === expectedMessages) {
                    resolve();
                } else {
                    reject(new Error(`Expected ${expectedMessages} messages, got ${messages.length}`));
                }
            });
            
            ws.on('error', async (error) => {
                await this.cleanupServers();
                reject(error);
            });
        });
    }

    displayResults() {
        const passed = this.testResults.filter(r => r.status === 'PASSED').length;
        const failed = this.testResults.filter(r => r.status === 'FAILED').length;
        const total = this.testResults.length;
        const successRate = ((passed / total) * 100).toFixed(1);
        const totalDuration = this.testResults.reduce((sum, r) => sum + (r.duration || 0), 0);

        console.log('\n📊 สรุปผล Integration Tests:');
        console.log(`  ✅ ผ่าน: ${passed}/${total}`);
        console.log(`  ❌ ล้มเหลว: ${failed}/${total}`);
        console.log(`  🎯 อัตราความสำเร็จ: ${successRate}%`);
        console.log(`  ⏱️ เวลารวม: ${totalDuration}ms`);

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
    const tests = new MCPCommunicationTests();
    tests.runAllTests().catch(error => {
        console.error('💥 เกิดข้อผิดพลาดในการทดสอบ:', error);
        process.exit(1);
    });
}

module.exports = MCPCommunicationTests;