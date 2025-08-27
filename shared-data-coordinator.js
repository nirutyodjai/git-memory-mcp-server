#!/usr/bin/env node

/**
 * Shared Data Coordinator for MCP Servers
 * ใช้ Git Memory เป็นตัวประสานการแชร์ข้อมูลระหว่าง MCP Servers
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const express = require('express');
const WebSocket = require('ws');

class SharedDataCoordinator {
    constructor() {
        this.app = express();
        this.server = null;
        this.wss = null;
        this.port = 3500;
        this.gitMemoryPath = '.git-memory';
        this.sharedDataPath = path.join(this.gitMemoryPath, 'shared');
        this.connectedServers = new Map();
        this.dataChannels = new Map();
        
        this.setupDirectories();
        this.setupExpress();
        this.setupWebSocket();
    }

    setupDirectories() {
        // สร้างโฟลเดอร์สำหรับข้อมูลแชร์
        if (!fs.existsSync(this.gitMemoryPath)) {
            fs.mkdirSync(this.gitMemoryPath, { recursive: true });
        }
        
        if (!fs.existsSync(this.sharedDataPath)) {
            fs.mkdirSync(this.sharedDataPath, { recursive: true });
        }

        // สร้างโฟลเดอร์ย่อยสำหรับแต่ละประเภทข้อมูล
        const subDirs = ['memory', 'cache', 'sessions', 'logs', 'configs'];
        subDirs.forEach(dir => {
            const dirPath = path.join(this.sharedDataPath, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        });
    }

    setupExpress() {
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // CORS headers
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            next();
        });

        // API Routes
        this.setupRoutes();
    }

    setupRoutes() {
        // ลงทะเบียน MCP Server
        this.app.post('/register', (req, res) => {
            const { serverId, serverType, port, capabilities } = req.body;
            
            this.connectedServers.set(serverId, {
                id: serverId,
                type: serverType,
                port: port,
                capabilities: capabilities || [],
                registeredAt: new Date(),
                lastHeartbeat: new Date()
            });

            console.log(`📡 Server registered: ${serverId} (${serverType}) on port ${port}`);
            
            res.json({
                success: true,
                message: 'Server registered successfully',
                serverId: serverId
            });
        });

        // แชร์ข้อมูล
        this.app.post('/share/:dataType', (req, res) => {
            const { dataType } = req.params;
            const { serverId, data, metadata } = req.body;
            
            console.log(`📤 Sharing data - Type: ${dataType}, Server: ${serverId}`);
            
            try {
                this.storeSharedData(dataType, serverId, data, metadata);
                this.broadcastDataUpdate(dataType, serverId, data, metadata);
                
                console.log(`✅ Data shared successfully - ${dataType}/${serverId}`);
                
                res.json({
                    success: true,
                    message: 'Data shared successfully',
                    dataType: dataType,
                    timestamp: new Date()
                });
            } catch (error) {
                console.error(`❌ Data sharing failed - ${dataType}/${serverId}:`, error.message);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // ดึงข้อมูลแชร์
        this.app.get('/share/:dataType', (req, res) => {
            const { dataType } = req.params;
            const { serverId } = req.query;
            
            try {
                const data = this.getSharedData(dataType, serverId);
                res.json({
                    success: true,
                    data: data,
                    dataType: dataType
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // ดูสถานะ servers ที่เชื่อมต่อ
        this.app.get('/servers', (req, res) => {
            const servers = Array.from(this.connectedServers.values());
            res.json({
                success: true,
                totalServers: servers.length,
                servers: servers
            });
        });

        // Git Memory operations
        this.app.post('/git-memory/:operation', (req, res) => {
            const { operation } = req.params;
            const { data } = req.body;
            
            this.executeGitMemoryOperation(operation, data)
                .then(result => {
                    res.json({
                        success: true,
                        operation: operation,
                        result: result
                    });
                })
                .catch(error => {
                    res.status(500).json({
                        success: false,
                        error: error.message
                    });
                });
        });

        // Heartbeat endpoint
        this.app.post('/heartbeat', (req, res) => {
            const { serverId } = req.body;
            
            if (this.connectedServers.has(serverId)) {
                const server = this.connectedServers.get(serverId);
                server.lastHeartbeat = new Date();
                this.connectedServers.set(serverId, server);
            }
            
            res.json({ success: true, timestamp: new Date() });
        });
    }

    setupWebSocket() {
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.wss.on('connection', (ws, req) => {
            console.log('🔌 WebSocket connection established');
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 WebSocket connection closed');
            });
        });
    }

    handleWebSocketMessage(ws, data) {
        const { type, serverId, payload } = data;
        
        switch (type) {
            case 'subscribe':
                this.subscribeToDataChannel(ws, serverId, payload.channel);
                break;
            case 'broadcast':
                this.broadcastToChannel(payload.channel, payload.data);
                break;
            case 'sync-request':
                this.handleSyncRequest(ws, serverId, payload);
                break;
        }
    }

    storeSharedData(dataType, serverId, data, metadata = {}) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const dataDir = path.resolve(this.sharedDataPath, dataType);
        const dataFile = path.resolve(dataDir, `${serverId}-${timestamp}.json`);
        
        console.log(`📁 Data directory: ${dataDir}`);
        console.log(`📄 Data file: ${dataFile}`);
        
        // สร้างโฟลเดอร์ถ้ายังไม่มี
        if (!fs.existsSync(dataDir)) {
            console.log(`🔨 Creating directory: ${dataDir}`);
            fs.mkdirSync(dataDir, { recursive: true });
        } else {
            console.log(`✅ Directory exists: ${dataDir}`);
        }
        
        const dataPackage = {
            serverId: serverId,
            dataType: dataType,
            data: data,
            metadata: metadata,
            timestamp: timestamp
        };
        
        console.log(`💾 Writing file: ${dataFile}`);
        
        try {
            fs.writeFileSync(dataFile, JSON.stringify(dataPackage, null, 2), 'utf8');
            console.log(`✅ File written successfully: ${dataFile}`);
        } catch (writeError) {
            console.error(`❌ File write error: ${writeError.message}`);
            throw writeError;
        }
        
        // อัปเดต index file
        this.updateDataIndex(dataType, serverId, dataFile);
        
        // บันทึกใน Git Memory
        this.commitToGitMemory(`Shared data from ${serverId}: ${dataType}`);
    }

    getSharedData(dataType, serverId = null) {
        const dataDir = path.join(this.sharedDataPath, dataType);
        
        if (!fs.existsSync(dataDir)) {
            return [];
        }
        
        const files = fs.readdirSync(dataDir)
            .filter(file => file.endsWith('.json'))
            .filter(file => !serverId || file.startsWith(serverId))
            .sort((a, b) => {
                const timeA = a.split('-').slice(-1)[0].replace('.json', '');
                const timeB = b.split('-').slice(-1)[0].replace('.json', '');
                return new Date(timeB) - new Date(timeA);
            });
        
        return files.map(file => {
            const filePath = path.join(dataDir, file);
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        });
    }

    updateDataIndex(dataType, serverId, dataFile) {
        const indexFile = path.join(this.sharedDataPath, `${dataType}-index.json`);
        let index = {};
        
        if (fs.existsSync(indexFile)) {
            index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
        }
        
        if (!index[serverId]) {
            index[serverId] = [];
        }
        
        index[serverId].push({
            file: dataFile,
            timestamp: new Date().toISOString()
        });
        
        // เก็บเฉพาะ 100 รายการล่าสุด
        if (index[serverId].length > 100) {
            index[serverId] = index[serverId].slice(-100);
        }
        
        fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
    }

    broadcastDataUpdate(dataType, serverId, data, metadata) {
        const message = {
            type: 'data-update',
            dataType: dataType,
            serverId: serverId,
            data: data,
            metadata: metadata,
            timestamp: new Date().toISOString()
        };
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }

    subscribeToDataChannel(ws, serverId, channel) {
        if (!this.dataChannels.has(channel)) {
            this.dataChannels.set(channel, new Set());
        }
        
        this.dataChannels.get(channel).add(ws);
        
        ws.send(JSON.stringify({
            type: 'subscription-confirmed',
            channel: channel,
            serverId: serverId
        }));
    }

    broadcastToChannel(channel, data) {
        if (this.dataChannels.has(channel)) {
            const subscribers = this.dataChannels.get(channel);
            const message = JSON.stringify({
                type: 'channel-broadcast',
                channel: channel,
                data: data,
                timestamp: new Date().toISOString()
            });
            
            subscribers.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(message);
                }
            });
        }
    }

    async executeGitMemoryOperation(operation, data = {}) {
        return new Promise((resolve, reject) => {
            let command, args;
            
            switch (operation) {
                case 'commit':
                    command = 'git';
                    args = ['add', '.', '&&', 'git', 'commit', '-m', '"' + ((data && data.message) || 'Shared data update') + '"'];
                    break;
                case 'push':
                    command = 'git';
                    args = ['push'];
                    break;
                case 'pull':
                    command = 'git';
                    args = ['pull'];
                    break;
                case 'status':
                    command = 'git';
                    args = ['status', '--porcelain'];
                    break;
                default:
                    reject(new Error(`Unknown git operation: ${operation}`));
                    return;
            }
            
            const process = spawn(command, args, {
                cwd: this.gitMemoryPath,
                shell: true
            });
            
            let output = '';
            let error = '';
            
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                error += data.toString();
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(error || `Process exited with code ${code}`));
                }
            });
        });
    }

    commitToGitMemory(message) {
        this.executeGitMemoryOperation('commit', { message })
            .then(() => {
                console.log(`📝 Git commit: ${message}`);
            })
            .catch(error => {
                console.error('Git commit error:', error.message);
            });
    }

    startHealthCheck() {
        setInterval(() => {
            const now = new Date();
            const timeout = 5 * 60 * 1000; // 5 minutes
            
            for (const [serverId, server] of this.connectedServers) {
                if (now - server.lastHeartbeat > timeout) {
                    console.log(`⚠️ Server ${serverId} appears to be offline`);
                    this.connectedServers.delete(serverId);
                }
            }
        }, 60000); // Check every minute
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🚀 Shared Data Coordinator running on port ${this.port}`);
            console.log(`📁 Git Memory path: ${this.gitMemoryPath}`);
            console.log(`📊 Shared data path: ${this.sharedDataPath}`);
            console.log('\n🔗 Available endpoints:');
            console.log(`   POST /register - Register MCP server`);
            console.log(`   POST /share/:dataType - Share data`);
            console.log(`   GET /share/:dataType - Get shared data`);
            console.log(`   GET /servers - List connected servers`);
            console.log(`   POST /git-memory/:operation - Git operations`);
            console.log(`   POST /heartbeat - Server heartbeat`);
            console.log(`   WebSocket: ws://localhost:${this.port}`);
        });
        
        this.startHealthCheck();
    }
}

// เริ่มต้น Shared Data Coordinator
if (require.main === module) {
    const coordinator = new SharedDataCoordinator();
    coordinator.start();
}

module.exports = SharedDataCoordinator;