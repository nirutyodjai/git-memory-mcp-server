#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const express = require('express');

class GitMemoryBridge {
    constructor() {
        this.app = express();
        this.port = 3100;
        this.gitMemoryPath = path.join(__dirname, '.git-memory');
        this.coordinatorUrl = 'http://localhost:3000';
        this.servers = new Map();
        this.memoryCache = new Map();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.initializeGitMemory();
    }

    setupMiddleware() {
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
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
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'Git Memory Bridge',
                port: this.port,
                servers: this.servers.size,
                memory_entries: this.memoryCache.size,
                uptime: process.uptime()
            });
        });

        // Get all memory entries
        this.app.get('/memory', async (req, res) => {
            try {
                const memories = await this.getAllMemories();
                res.json({
                    success: true,
                    count: memories.length,
                    memories: memories
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Store memory entry
        this.app.post('/memory', async (req, res) => {
            try {
                const { category, key, data, metadata } = req.body;
                const result = await this.storeMemory(category, key, data, metadata);
                res.json({
                    success: true,
                    result: result
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get memory by category
        this.app.get('/memory/:category', async (req, res) => {
            try {
                const { category } = req.params;
                const memories = await this.getMemoryByCategory(category);
                res.json({
                    success: true,
                    category: category,
                    count: memories.length,
                    memories: memories
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Connect to MCP server
        this.app.post('/connect/:serverId', async (req, res) => {
            try {
                const { serverId } = req.params;
                const { serverUrl, serverType } = req.body;
                const result = await this.connectToServer(serverId, serverUrl, serverType);
                res.json({
                    success: true,
                    serverId: serverId,
                    result: result
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Sync memory with servers
        this.app.post('/sync', async (req, res) => {
            try {
                const result = await this.syncWithServers();
                res.json({
                    success: true,
                    synced_servers: result.syncedServers,
                    synced_memories: result.syncedMemories
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get bridge statistics
        this.app.get('/stats', (req, res) => {
            res.json({
                bridge_info: {
                    port: this.port,
                    uptime: process.uptime(),
                    memory_usage: process.memoryUsage()
                },
                connected_servers: Array.from(this.servers.entries()).map(([id, server]) => ({
                    id: id,
                    url: server.url,
                    type: server.type,
                    status: server.status,
                    last_sync: server.lastSync
                })),
                memory_cache: {
                    total_entries: this.memoryCache.size,
                    categories: this.getCacheCategories()
                }
            });
        });
    }

    async initializeGitMemory() {
        try {
            // สร้าง .git-memory directory ถ้ายังไม่มี
            if (!fs.existsSync(this.gitMemoryPath)) {
                fs.mkdirSync(this.gitMemoryPath, { recursive: true });
                console.log('📁 Created .git-memory directory');
            }

            // สร้าง subdirectories
            const subdirs = ['categories', 'servers', 'logs', 'shared/logs'];
            for (const subdir of subdirs) {
                const dirPath = path.join(this.gitMemoryPath, subdir);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                    console.log(`📁 Created ${subdir} directory`);
                }
            }

            // โหลด memory cache
            await this.loadMemoryCache();
            console.log('🧠 Git Memory initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Git Memory:', error);
        }
    }

    async loadMemoryCache() {
        try {
            const categoriesPath = path.join(this.gitMemoryPath, 'categories');
            if (fs.existsSync(categoriesPath)) {
                const categories = fs.readdirSync(categoriesPath);
                for (const category of categories) {
                    const categoryPath = path.join(categoriesPath, category);
                    if (fs.statSync(categoryPath).isDirectory()) {
                        const files = fs.readdirSync(categoryPath);
                        for (const file of files) {
                            if (file.endsWith('.json')) {
                                const filePath = path.join(categoryPath, file);
                                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                                const key = `${category}:${file.replace('.json', '')}`;
                                this.memoryCache.set(key, data);
                            }
                        }
                    }
                }
            }
            console.log(`🧠 Loaded ${this.memoryCache.size} memory entries`);
        } catch (error) {
            console.error('❌ Error loading memory cache:', error);
        }
    }

    async storeMemory(category, key, data, metadata = {}) {
        try {
            const categoryPath = path.join(this.gitMemoryPath, 'categories', category);
            if (!fs.existsSync(categoryPath)) {
                fs.mkdirSync(categoryPath, { recursive: true });
            }

            const memoryEntry = {
                key: key,
                data: data,
                metadata: {
                    ...metadata,
                    created_at: new Date().toISOString(),
                    category: category
                }
            };

            const filePath = path.join(categoryPath, `${key}.json`);
            fs.writeFileSync(filePath, JSON.stringify(memoryEntry, null, 2));

            // Update cache
            const cacheKey = `${category}:${key}`;
            this.memoryCache.set(cacheKey, memoryEntry);

            console.log(`💾 Stored memory: ${category}/${key}`);
            return memoryEntry;
        } catch (error) {
            console.error('❌ Error storing memory:', error);
            throw error;
        }
    }

    async getAllMemories() {
        return Array.from(this.memoryCache.values());
    }

    async getMemoryByCategory(category) {
        const memories = [];
        for (const [key, value] of this.memoryCache.entries()) {
            if (key.startsWith(`${category}:`)) {
                memories.push(value);
            }
        }
        return memories;
    }

    async connectToServer(serverId, serverUrl, serverType) {
        try {
            // Test connection to server
            const response = await this.testServerConnection(serverUrl);
            
            this.servers.set(serverId, {
                id: serverId,
                url: serverUrl,
                type: serverType,
                status: 'connected',
                lastSync: new Date().toISOString(),
                connectionTest: response
            });

            console.log(`🔗 Connected to server: ${serverId} (${serverType})`);
            return { connected: true, serverId, serverUrl, serverType };
        } catch (error) {
            console.error(`❌ Failed to connect to server ${serverId}:`, error);
            throw error;
        }
    }

    async testServerConnection(serverUrl) {
        return new Promise((resolve, reject) => {
            const url = new URL(serverUrl);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: '/health',
                method: 'GET',
                timeout: 5000
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch (e) {
                        resolve({ status: 'unknown', raw: data });
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Connection timeout')));
            req.end();
        });
    }

    async syncWithServers() {
        let syncedServers = 0;
        let syncedMemories = 0;

        for (const [serverId, server] of this.servers.entries()) {
            try {
                // Sync memory data with each server
                const memories = await this.getAllMemories();
                
                // Send memory data to server (if server supports it)
                // This is a placeholder - actual implementation depends on server API
                console.log(`🔄 Syncing ${memories.length} memories with ${serverId}`);
                
                server.lastSync = new Date().toISOString();
                server.status = 'synced';
                syncedServers++;
                syncedMemories += memories.length;
            } catch (error) {
                console.error(`❌ Failed to sync with ${serverId}:`, error);
                server.status = 'sync_failed';
            }
        }

        return { syncedServers, syncedMemories };
    }

    getCacheCategories() {
        const categories = new Set();
        for (const key of this.memoryCache.keys()) {
            const category = key.split(':')[0];
            categories.add(category);
        }
        return Array.from(categories);
    }

    async start() {
        return new Promise((resolve) => {
            this.server = this.app.listen(this.port, () => {
                console.log('🌉 Git Memory Bridge Started');
                console.log('================================');
                console.log(`🚀 Server running on port ${this.port}`);
                console.log(`📁 Git Memory path: ${this.gitMemoryPath}`);
                console.log(`🔗 Coordinator URL: ${this.coordinatorUrl}`);
                console.log(`🧠 Memory entries loaded: ${this.memoryCache.size}`);
                console.log('================================');
                resolve();
            });
        });
    }

    async stop() {
        if (this.server) {
            this.server.close();
            console.log('🛑 Git Memory Bridge stopped');
        }
    }
}

// Main execution
async function main() {
    const bridge = new GitMemoryBridge();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down Git Memory Bridge...');
        await bridge.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Shutting down Git Memory Bridge...');
        await bridge.stop();
        process.exit(0);
    });

    await bridge.start();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = GitMemoryBridge;