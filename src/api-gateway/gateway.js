#!/usr/bin/env node

/**
 * 🌐 NEXUS IDE - API Gateway
 * เชื่อมต่อและจัดการการสื่อสารระหว่าง AI Memory Proxy และ Git Memory Sharing
 * รองรับ REST API, WebSocket, และ GraphQL
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { AIMemoryProxy } = require('../ai/memory-proxy');
const { GitMemorySharing } = require('../services/git-memory-sharing');

class NexusAPIGateway {
    constructor(options = {}) {
        this.port = options.port || 3000;
        this.host = options.host || 'localhost';
        
        // Initialize Express app
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST", "PUT", "DELETE"]
            }
        });
        
        // Initialize services
        this.memoryProxy = null;
        this.gitSharing = null;
        
        // Connected clients
        this.clients = new Map();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }
    
    setupMiddleware() {
        // CORS
        this.app.use(cors());
        
        // JSON parsing
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
        // Static files
        this.app.use('/static', express.static(path.join(__dirname, '../../public')));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: {
                    memoryProxy: !!this.memoryProxy,
                    gitSharing: !!this.gitSharing
                }
            });
        });
        
        // API Info
        this.app.get('/api', (req, res) => {
            res.json({
                name: 'NEXUS IDE API Gateway',
                version: '1.0.0',
                description: 'Universal API Gateway for NEXUS IDE',
                endpoints: {
                    memory: '/api/memory/*',
                    sharing: '/api/sharing/*',
                    websocket: '/socket.io/',
                    health: '/health'
                },
                timestamp: new Date().toISOString()
            });
        });
        
        // Memory Proxy Routes
        this.setupMemoryRoutes();
        
        // Git Sharing Routes
        this.setupSharingRoutes();
        
        // Catch all
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.originalUrl,
                method: req.method,
                timestamp: new Date().toISOString()
            });
        });
    }
    
    setupMemoryRoutes() {
        const router = express.Router();
        
        // Store memory
        router.post('/store', async (req, res) => {
            try {
                const { key, data, metadata } = req.body;
                if (!this.memoryProxy) {
                    return res.status(503).json({ error: 'Memory proxy not available' });
                }
                
                const result = await this.memoryProxy.storeMemory(key, data, metadata);
                
                // Broadcast to WebSocket clients
                this.io.emit('memory:stored', { key, id: result, timestamp: new Date().toISOString() });
                
                res.json({ success: true, id: result, key });
            } catch (error) {
                console.error('❌ Memory store error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Retrieve memory
        router.get('/retrieve/:id', async (req, res) => {
            try {
                const { id } = req.params;
                if (!this.memoryProxy) {
                    return res.status(503).json({ error: 'Memory proxy not available' });
                }
                
                const result = await this.memoryProxy.retrieveMemory(id);
                if (!result) {
                    return res.status(404).json({ error: 'Memory not found' });
                }
                
                res.json({ success: true, data: result });
            } catch (error) {
                console.error('❌ Memory retrieve error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Search memory
        router.post('/search', async (req, res) => {
            try {
                const { query, limit } = req.body;
                if (!this.memoryProxy) {
                    return res.status(503).json({ error: 'Memory proxy not available' });
                }
                
                const results = await this.memoryProxy.searchMemory(query, limit);
                res.json({ success: true, results, count: results.length });
            } catch (error) {
                console.error('❌ Memory search error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get memory stats
        router.get('/stats', async (req, res) => {
            try {
                if (!this.memoryProxy) {
                    return res.status(503).json({ error: 'Memory proxy not available' });
                }
                
                const stats = await this.memoryProxy.getStats();
                res.json({ success: true, stats });
            } catch (error) {
                console.error('❌ Memory stats error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.use('/api/memory', router);
    }
    
    setupSharingRoutes() {
        const router = express.Router();
        
        // Share file
        router.post('/file', async (req, res) => {
            try {
                const { filePath, permissions, expiresIn } = req.body;
                if (!this.gitSharing) {
                    return res.status(503).json({ error: 'Git sharing not available' });
                }
                
                const result = await this.gitSharing.shareFile(filePath, permissions, expiresIn);
                
                // Broadcast to WebSocket clients
                this.io.emit('sharing:file-shared', { 
                    shareId: result, 
                    filePath, 
                    timestamp: new Date().toISOString() 
                });
                
                res.json({ success: true, shareId: result, filePath });
            } catch (error) {
                console.error('❌ File sharing error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Share directory
        router.post('/directory', async (req, res) => {
            try {
                const { dirPath, permissions, expiresIn } = req.body;
                if (!this.gitSharing) {
                    return res.status(503).json({ error: 'Git sharing not available' });
                }
                
                const result = await this.gitSharing.shareDirectory(dirPath, permissions, expiresIn);
                
                // Broadcast to WebSocket clients
                this.io.emit('sharing:directory-shared', { 
                    shareId: result, 
                    dirPath, 
                    timestamp: new Date().toISOString() 
                });
                
                res.json({ success: true, shareId: result, dirPath });
            } catch (error) {
                console.error('❌ Directory sharing error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Access shared content
        router.get('/access/:shareId', async (req, res) => {
            try {
                const { shareId } = req.params;
                const { userId } = req.query;
                
                if (!this.gitSharing) {
                    return res.status(503).json({ error: 'Git sharing not available' });
                }
                
                const result = await this.gitSharing.accessSharedContent(shareId, userId);
                if (!result) {
                    return res.status(404).json({ error: 'Shared content not found' });
                }
                
                res.json({ success: true, data: result });
            } catch (error) {
                console.error('❌ Access sharing error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Download shared content
        router.post('/download/:shareId', async (req, res) => {
            try {
                const { shareId } = req.params;
                const { userId, downloadPath } = req.body;
                
                if (!this.gitSharing) {
                    return res.status(503).json({ error: 'Git sharing not available' });
                }
                
                const result = await this.gitSharing.downloadSharedContent(shareId, userId, downloadPath);
                
                // Broadcast to WebSocket clients
                this.io.emit('sharing:downloaded', { 
                    shareId, 
                    userId, 
                    downloadPath: result, 
                    timestamp: new Date().toISOString() 
                });
                
                res.json({ success: true, downloadPath: result });
            } catch (error) {
                console.error('❌ Download sharing error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get sharing stats
        router.get('/stats', async (req, res) => {
            try {
                if (!this.gitSharing) {
                    return res.status(503).json({ error: 'Git sharing not available' });
                }
                
                const stats = await this.gitSharing.getStats();
                res.json({ success: true, stats });
            } catch (error) {
                console.error('❌ Sharing stats error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.use('/api/sharing', router);
    }
    
    setupWebSocket() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);
            
            // Store client info
            this.clients.set(socket.id, {
                id: socket.id,
                connectedAt: new Date(),
                subscriptions: new Set()
            });
            
            // Send welcome message
            socket.emit('welcome', {
                message: 'Connected to NEXUS IDE API Gateway',
                clientId: socket.id,
                timestamp: new Date().toISOString()
            });
            
            // Handle memory subscriptions
            socket.on('memory:subscribe', (data) => {
                const client = this.clients.get(socket.id);
                if (client) {
                    client.subscriptions.add(`memory:${data.key || '*'}`);
                    socket.emit('memory:subscribed', { key: data.key });
                }
            });
            
            // Handle sharing subscriptions
            socket.on('sharing:subscribe', (data) => {
                const client = this.clients.get(socket.id);
                if (client) {
                    client.subscriptions.add(`sharing:${data.shareId || '*'}`);
                    socket.emit('sharing:subscribed', { shareId: data.shareId });
                }
            });
            
            // Handle disconnect
            socket.on('disconnect', () => {
                console.log(`🔌 Client disconnected: ${socket.id}`);
                this.clients.delete(socket.id);
            });
        });
    }
    
    async initializeServices() {
        try {
            console.log('🔄 Initializing services...');
            
            // Initialize AI Memory Proxy
            this.memoryProxy = new AIMemoryProxy();
            console.log('🧠 AI Memory Proxy initialized');
            
            // Initialize Git Memory Sharing
            this.gitSharing = new GitMemorySharing();
            console.log('🤝 Git Memory Sharing initialized');
            
            console.log('✅ All services initialized successfully');
        } catch (error) {
            console.error('❌ Service initialization failed:', error);
            throw error;
        }
    }
    
    async start() {
        try {
            // Initialize services first
            await this.initializeServices();
            
            // Start server
            this.server.listen(this.port, this.host, () => {
                console.log(`\n🌐 NEXUS IDE API Gateway started!`);
                console.log(`📡 HTTP Server: http://${this.host}:${this.port}`);
                console.log(`🔌 WebSocket Server: ws://${this.host}:${this.port}`);
                console.log(`📊 Health Check: http://${this.host}:${this.port}/health`);
                console.log(`📚 API Info: http://${this.host}:${this.port}/api`);
                console.log(`👥 Connected Clients: ${this.clients.size}`);
                console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
            });
            
        } catch (error) {
            console.error('❌ Failed to start API Gateway:', error);
            process.exit(1);
        }
    }
    
    async stop() {
        console.log('🛑 Stopping API Gateway...');
        
        // Close WebSocket connections
        this.io.close();
        
        // Close HTTP server
        this.server.close();
        
        console.log('✅ API Gateway stopped');
    }
    
    getStats() {
        return {
            server: {
                host: this.host,
                port: this.port,
                uptime: process.uptime(),
                memory: process.memoryUsage()
            },
            clients: {
                total: this.clients.size,
                connected: Array.from(this.clients.values()).map(client => ({
                    id: client.id,
                    connectedAt: client.connectedAt,
                    subscriptions: Array.from(client.subscriptions)
                }))
            },
            services: {
                memoryProxy: !!this.memoryProxy,
                gitSharing: !!this.gitSharing
            },
            timestamp: new Date().toISOString()
        };
    }
}

// Demo usage
if (require.main === module) {
    console.log('🚀 Starting NEXUS IDE API Gateway Demo...');
    
    const gateway = new NexusAPIGateway({
        port: 3000,
        host: 'localhost'
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await gateway.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        await gateway.stop();
        process.exit(0);
    });
    
    // Start the gateway
    gateway.start().catch(error => {
        console.error('❌ Failed to start gateway:', error);
        process.exit(1);
    });
}

module.exports = { NexusAPIGateway };