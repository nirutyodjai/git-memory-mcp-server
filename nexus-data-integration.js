/**
 * NEXUS IDE - Data Integration Layer
 * เชื่อมต่อ Universal Data Hub กับ Git Memory Coordinator
 * รวมข้อมูลจาก MCP Servers ทั้ง 3000 ตัวเป็นก้อนเดียวกัน
 */

const { UniversalDataClient } = require('./universal-data-client');
const WebSocket = require('ws');
const http = require('http');
const { performance } = require('perf_hooks');

class NexusDataIntegration {
    constructor() {
        this.universalClient = new UniversalDataClient();
        this.gitMemoryUrl = 'http://localhost:9000';
        this.integrationPort = 9002;
        this.server = null;
        this.wsServer = null;
        this.connections = new Map();
        
        this.stats = {
            totalIntegrations: 0,
            activeConnections: 0,
            dataTransfers: 0,
            lastSync: null,
            errors: 0
        };
        
        this.dataCache = new Map();
        this.syncInterval = null;
    }

    async initialize() {
        console.log('🔗 เริ่มต้น NEXUS Data Integration Layer...');
        
        try {
            // เชื่อมต่อกับ Universal Data Hub
            await this.universalClient.connect();
            console.log('✅ เชื่อมต่อ Universal Data Hub สำเร็จ');
            
            // สร้าง HTTP Server สำหรับ REST API
            this.createHTTPServer();
            
            // สร้าง WebSocket Server สำหรับ real-time communication
            this.createWebSocketServer();
            
            // เริ่มต้น Auto Sync
            this.startAutoSync();
            
            console.log('🚀 NEXUS Data Integration พร้อมใช้งาน');
            console.log(`📡 HTTP API: http://localhost:${this.integrationPort}`);
            console.log(`🔌 WebSocket: ws://localhost:${this.integrationPort}`);
            
        } catch (error) {
            console.error('❌ ข้อผิดพลาดในการเริ่มต้น:', error);
            throw error;
        }
    }

    createHTTPServer() {
        this.server = http.createServer((req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            this.handleHTTPRequest(req, res);
        });
        
        this.server.listen(this.integrationPort, () => {
            console.log(`🌐 HTTP Server เริ่มทำงานที่ port ${this.integrationPort}`);
        });
    }

    createWebSocketServer() {
        this.wsServer = new WebSocket.Server({ server: this.server });
        
        this.wsServer.on('connection', (ws, req) => {
            const connectionId = `integration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            this.connections.set(connectionId, ws);
            this.stats.activeConnections++;
            
            console.log(`🔗 การเชื่อมต่อใหม่: ${connectionId}`);
            
            ws.send(JSON.stringify({
                type: 'welcome',
                data: {
                    connectionId,
                    message: 'เชื่อมต่อ NEXUS Data Integration สำเร็จ',
                    stats: this.stats
                }
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(connectionId, data);
                } catch (error) {
                    console.error('❌ ข้อผิดพลาดในการประมวลผลข้อความ:', error);
                    this.stats.errors++;
                }
            });
            
            ws.on('close', () => {
                this.connections.delete(connectionId);
                this.stats.activeConnections--;
                console.log(`🔌 การเชื่อมต่อปิด: ${connectionId}`);
            });
        });
    }

    async handleHTTPRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.integrationPort}`);
        const path = url.pathname;
        const method = req.method;
        
        try {
            let response = {};
            
            switch (path) {
                case '/api/stats':
                    response = await this.getIntegrationStats();
                    break;
                    
                case '/api/data':
                    if (method === 'GET') {
                        const key = url.searchParams.get('key');
                        response = await this.getUnifiedData(key);
                    } else if (method === 'POST') {
                        const body = await this.getRequestBody(req);
                        response = await this.setUnifiedData(body.key, body.value, body.serverId);
                    }
                    break;
                    
                case '/api/sync':
                    response = await this.syncAllData();
                    break;
                    
                case '/api/servers':
                    response = await this.getAllServersStatus();
                    break;
                    
                case '/api/search':
                    const query = url.searchParams.get('q');
                    response = await this.searchUnifiedData(query);
                    break;
                    
                default:
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'ไม่พบ endpoint' }));
                    return;
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
            
        } catch (error) {
            console.error('❌ ข้อผิดพลาด HTTP:', error);
            this.stats.errors++;
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    async handleWebSocketMessage(connectionId, message) {
        const { type, data } = message;
        let response = {};
        
        try {
            switch (type) {
                case 'get_data':
                    response = await this.getUnifiedData(data.key);
                    break;
                    
                case 'set_data':
                    response = await this.setUnifiedData(data.key, data.value, data.serverId);
                    break;
                    
                case 'sync_all':
                    response = await this.syncAllData();
                    break;
                    
                case 'get_stats':
                    response = await this.getIntegrationStats();
                    break;
                    
                case 'search':
                    response = await this.searchUnifiedData(data.query);
                    break;
            }
            
            this.sendToConnection(connectionId, {
                type: `${type}_response`,
                data: response
            });
            
        } catch (error) {
            console.error('❌ ข้อผิดพลาด WebSocket:', error);
            this.stats.errors++;
            this.sendToConnection(connectionId, {
                type: 'error',
                data: { message: error.message }
            });
        }
    }

    async getUnifiedData(key) {
        const startTime = performance.now();
        
        try {
            // ตรวจสอบ cache ก่อน
            if (this.dataCache.has(key)) {
                const cached = this.dataCache.get(key);
                if (Date.now() - cached.timestamp < 30000) { // Cache 30 วินาที
                    return {
                        success: true,
                        data: cached.data,
                        source: 'cache',
                        responseTime: performance.now() - startTime
                    };
                }
            }
            
            // ดึงข้อมูลจาก Universal Data Hub
            const universalData = await this.getDataFromUniversalHub(key);
            
            // ดึงข้อมูลจาก Git Memory (ถ้ามี)
            const gitMemoryData = await this.getDataFromGitMemory(key);
            
            // รวมข้อมูล
            const unifiedData = {
                key,
                universalHub: universalData,
                gitMemory: gitMemoryData,
                timestamp: new Date(),
                sources: []
            };
            
            if (universalData) unifiedData.sources.push('universal-hub');
            if (gitMemoryData) unifiedData.sources.push('git-memory');
            
            // เก็บใน cache
            this.dataCache.set(key, {
                data: unifiedData,
                timestamp: Date.now()
            });
            
            this.stats.dataTransfers++;
            
            return {
                success: true,
                data: unifiedData,
                source: 'unified',
                responseTime: performance.now() - startTime
            };
            
        } catch (error) {
            console.error(`❌ ข้อผิดพลาดในการดึงข้อมูล ${key}:`, error);
            this.stats.errors++;
            throw error;
        }
    }

    async setUnifiedData(key, value, serverId = null) {
        const startTime = performance.now();
        
        try {
            // บันทึกไปยัง Universal Data Hub
            this.universalClient.setData(key, value, serverId);
            
            // บันทึกไปยัง Git Memory
            await this.setDataToGitMemory(key, value);
            
            // อัปเดต cache
            this.dataCache.delete(key);
            
            // แจ้งเตือนผู้เชื่อมต่อทั้งหมด
            this.broadcastToAll({
                type: 'data_updated',
                data: {
                    key,
                    value,
                    serverId,
                    timestamp: new Date()
                }
            });
            
            this.stats.dataTransfers++;
            
            return {
                success: true,
                message: 'บันทึกข้อมูลสำเร็จ',
                key,
                serverId,
                responseTime: performance.now() - startTime
            };
            
        } catch (error) {
            console.error(`❌ ข้อผิดพลาดในการบันทึกข้อมูล ${key}:`, error);
            this.stats.errors++;
            throw error;
        }
    }

    async syncAllData() {
        const startTime = performance.now();
        
        try {
            console.log('🔄 เริ่มต้น Unified Data Sync...');
            
            // Sync Universal Data Hub
            this.universalClient.syncAll();
            
            // ล้าง cache
            this.dataCache.clear();
            
            this.stats.lastSync = new Date();
            this.stats.totalIntegrations++;
            
            const responseTime = performance.now() - startTime;
            
            // แจ้งเตือนผู้เชื่อมต่อทั้งหมด
            this.broadcastToAll({
                type: 'sync_completed',
                data: {
                    timestamp: this.stats.lastSync,
                    responseTime
                }
            });
            
            console.log(`✅ Unified Data Sync เสร็จสิ้น (${responseTime.toFixed(2)}ms)`);
            
            return {
                success: true,
                message: 'Sync ข้อมูลทั้งหมดสำเร็จ',
                responseTime
            };
            
        } catch (error) {
            console.error('❌ ข้อผิดพลาดในการ sync:', error);
            this.stats.errors++;
            throw error;
        }
    }

    async getDataFromUniversalHub(key) {
        // ใช้ Promise เพื่อรอผลลัพธ์จาก Universal Hub
        return new Promise((resolve) => {
            const originalHandler = this.universalClient.messageHandlers.get('data_response');
            
            this.universalClient.messageHandlers.set('data_response', (data) => {
                if (data.key === key) {
                    resolve(data.result);
                    this.universalClient.messageHandlers.set('data_response', originalHandler);
                }
            });
            
            this.universalClient.getData(key);
            
            // Timeout หลัง 5 วินาที
            setTimeout(() => {
                resolve(null);
                this.universalClient.messageHandlers.set('data_response', originalHandler);
            }, 5000);
        });
    }

    async getDataFromGitMemory(key) {
        try {
            const response = await fetch(`${this.gitMemoryUrl}/api/get/${key}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            // Git Memory อาจไม่พร้อมใช้งาน
        }
        return null;
    }

    async setDataToGitMemory(key, value) {
        try {
            const response = await fetch(`${this.gitMemoryUrl}/api/set`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });
            return response.ok;
        } catch (error) {
            // Git Memory อาจไม่พร้อมใช้งาน
            return false;
        }
    }

    async searchUnifiedData(query) {
        // ค้นหาใน cache ก่อน
        const cacheResults = [];
        for (const [key, cached] of this.dataCache) {
            if ((typeof key === 'string' && key.includes(query)) || 
                (cached.data && JSON.stringify(cached.data).includes(query))) {
                cacheResults.push({ key, data: cached.data, source: 'cache' });
            }
        }
        
        return {
            success: true,
            query,
            results: cacheResults,
            count: cacheResults.length
        };
    }

    async getAllServersStatus() {
        return {
            success: true,
            universalHub: {
                connected: this.universalClient.isConnected,
                connectionId: this.universalClient.connectionId
            },
            gitMemory: {
                url: this.gitMemoryUrl,
                available: await this.checkGitMemoryAvailability()
            },
            integration: this.stats
        };
    }

    async checkGitMemoryAvailability() {
        try {
            const response = await fetch(`${this.gitMemoryUrl}/status`, { timeout: 3000 });
            return response.ok;
        } catch {
            return false;
        }
    }

    async getIntegrationStats() {
        return {
            success: true,
            stats: {
                ...this.stats,
                cacheSize: this.dataCache.size,
                uptime: process.uptime()
            }
        };
    }

    startAutoSync() {
        // Auto sync ทุก 2 นาที
        this.syncInterval = setInterval(() => {
            this.syncAllData().catch(error => {
                console.error('❌ Auto sync ล้มเหลว:', error);
            });
        }, 120000);
        
        console.log('🔄 เริ่มต้น Auto Sync (ทุก 2 นาที)');
    }

    sendToConnection(connectionId, message) {
        const ws = this.connections.get(connectionId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    broadcastToAll(message) {
        for (const [connectionId, ws] of this.connections) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        }
    }

    async getRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async shutdown() {
        console.log('🛑 กำลังปิด NEXUS Data Integration...');
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        if (this.universalClient) {
            this.universalClient.disconnect();
        }
        
        if (this.server) {
            this.server.close();
        }
        
        console.log('✅ NEXUS Data Integration ปิดเรียบร้อย');
    }
}

// Export สำหรับใช้งานจากไฟล์อื่น
module.exports = NexusDataIntegration;

// ถ้ารันไฟล์นี้โดยตรง
if (require.main === module) {
    const integration = new NexusDataIntegration();
    
    integration.initialize().catch(error => {
        console.error('❌ ไม่สามารถเริ่มต้น NEXUS Data Integration:', error);
        process.exit(1);
    });
    
    // จัดการ graceful shutdown
    process.on('SIGINT', async () => {
        await integration.shutdown();
        process.exit(0);
    });
}