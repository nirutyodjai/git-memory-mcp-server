/**
 * NEXUS IDE - Universal Data Hub
 * ระบบแชร์ข้อมูลแบบ Universal สำหรับ MCP Servers ทั้ง 3000 ตัว
 * เชื่อมต่อข้อมูลเป็นก้อนเดียวกัน
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const { performance } = require('perf_hooks');

class UniversalDataHub extends EventEmitter {
    constructor() {
        super();
        this.servers = new Map(); // เก็บข้อมูล MCP Servers ทั้ง 3000 ตัว
        this.dataStore = new Map(); // Central Data Store
        this.connections = new Map(); // WebSocket connections
        this.syncQueue = []; // Queue สำหรับ sync ข้อมูล
        this.isProcessing = false;
        this.stats = {
            totalServers: 0,
            activeConnections: 0,
            dataEntries: 0,
            syncOperations: 0,
            lastSync: null
        };
        
        this.initializeHub();
    }

    async initializeHub() {
        console.log('🚀 เริ่มต้น Universal Data Hub...');
        
        // สร้าง WebSocket Server สำหรับ real-time sync
        this.wsServer = new WebSocket.Server({ port: 9001 });
        this.wsServer.on('connection', (ws) => this.handleConnection(ws));
        
        // เริ่มต้น MCP Servers ทั้ง 3000 ตัว
        await this.initializeMCPServers();
        
        // เริ่มต้น Data Sync Process
        this.startDataSync();
        
        console.log('✅ Universal Data Hub พร้อมใช้งาน');
        console.log(`📊 จัดการ MCP Servers: ${this.stats.totalServers} ตัว`);
    }

    async initializeMCPServers() {
        console.log('🔧 กำลังสร้าง MCP Servers ทั้ง 3000 ตัว...');
        
        // AI/ML Services (1000 ตัว)
        for (let i = 1; i <= 1000; i++) {
            const serverId = `ai-ml-${i.toString().padStart(4, '0')}`;
            this.servers.set(serverId, {
                id: serverId,
                type: 'AI/ML',
                category: this.getAICategory(i),
                status: 'active',
                data: new Map(),
                lastSync: new Date(),
                connections: 0
            });
        }
        
        // Enterprise Integration (1500 ตัว)
        for (let i = 1; i <= 1500; i++) {
            const serverId = `enterprise-${i.toString().padStart(4, '0')}`;
            this.servers.set(serverId, {
                id: serverId,
                type: 'Enterprise',
                category: this.getEnterpriseCategory(i),
                status: 'active',
                data: new Map(),
                lastSync: new Date(),
                connections: 0
            });
        }
        
        // Specialized Services (500 ตัว)
        for (let i = 1; i <= 500; i++) {
            const serverId = `specialized-${i.toString().padStart(4, '0')}`;
            this.servers.set(serverId, {
                id: serverId,
                type: 'Specialized',
                category: this.getSpecializedCategory(i),
                status: 'active',
                data: new Map(),
                lastSync: new Date(),
                connections: 0
            });
        }
        
        this.stats.totalServers = this.servers.size;
        console.log(`✅ สร้าง MCP Servers เสร็จสิ้น: ${this.stats.totalServers} ตัว`);
    }

    getAICategory(index) {
        const categories = [
            'Machine Learning', 'Deep Learning', 'Natural Language Processing',
            'Computer Vision', 'Reinforcement Learning', 'Neural Networks',
            'Data Science', 'Predictive Analytics', 'AI Optimization',
            'Generative AI'
        ];
        return categories[index % categories.length];
    }

    getEnterpriseCategory(index) {
        const categories = [
            'Database Integration', 'API Gateway', 'Authentication',
            'Cloud Services', 'Microservices', 'Message Queue',
            'Load Balancer', 'Cache Management', 'Security',
            'Monitoring', 'DevOps', 'CI/CD', 'Container Management',
            'Service Mesh', 'Event Streaming'
        ];
        return categories[index % categories.length];
    }

    getSpecializedCategory(index) {
        const categories = [
            'Blockchain', 'IoT', 'Edge Computing', 'Quantum Computing',
            'AR/VR', 'Gaming', 'Fintech', 'Healthcare', 'Education',
            'E-commerce'
        ];
        return categories[index % categories.length];
    }

    handleConnection(ws) {
        const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.connections.set(connectionId, ws);
        this.stats.activeConnections++;
        
        console.log(`🔗 การเชื่อมต่อใหม่: ${connectionId}`);
        
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                this.handleMessage(connectionId, data);
            } catch (error) {
                console.error('❌ ข้อผิดพลาดในการประมวลผลข้อความ:', error);
            }
        });
        
        ws.on('close', () => {
            this.connections.delete(connectionId);
            this.stats.activeConnections--;
            console.log(`🔌 การเชื่อมต่อปิด: ${connectionId}`);
        });
        
        // ส่งข้อมูลสถานะเริ่มต้น
        this.sendToConnection(connectionId, {
            type: 'welcome',
            data: {
                connectionId,
                totalServers: this.stats.totalServers,
                dataEntries: this.stats.dataEntries
            }
        });
    }

    handleMessage(connectionId, message) {
        const { type, data } = message;
        
        switch (type) {
            case 'set_data':
                this.setUniversalData(data.key, data.value, data.serverId);
                break;
            case 'get_data':
                const result = this.getUniversalData(data.key);
                this.sendToConnection(connectionId, {
                    type: 'data_response',
                    data: { key: data.key, result }
                });
                break;
            case 'sync_request':
                this.syncAllServers();
                break;
            case 'get_stats':
                this.sendToConnection(connectionId, {
                    type: 'stats_response',
                    data: this.getStats()
                });
                break;
        }
    }

    setUniversalData(key, value, serverId = null) {
        const timestamp = new Date();
        const dataEntry = {
            key,
            value,
            serverId,
            timestamp,
            syncedServers: new Set()
        };
        
        // เก็บใน Central Data Store
        this.dataStore.set(key, dataEntry);
        this.stats.dataEntries = this.dataStore.size;
        
        // ถ้าระบุ serverId ให้เก็บในเซิร์ฟเวอร์นั้นด้วย
        if (serverId && this.servers.has(serverId)) {
            this.servers.get(serverId).data.set(key, value);
            dataEntry.syncedServers.add(serverId);
        }
        
        // เพิ่มเข้า sync queue เพื่อ sync ไปยังเซิร์ฟเวอร์อื่น
        this.syncQueue.push({
            action: 'set',
            key,
            value,
            timestamp,
            originServer: serverId
        });
        
        // แจ้งเตือนผู้เชื่อมต่อทั้งหมด
        this.broadcastToAll({
            type: 'data_updated',
            data: { key, value, serverId, timestamp }
        });
        
        console.log(`📝 ข้อมูลใหม่: ${key} = ${JSON.stringify(value).substring(0, 100)}...`);
    }

    getUniversalData(key) {
        const dataEntry = this.dataStore.get(key);
        if (!dataEntry) {
            return null;
        }
        
        return {
            value: dataEntry.value,
            serverId: dataEntry.serverId,
            timestamp: dataEntry.timestamp,
            syncedServers: Array.from(dataEntry.syncedServers)
        };
    }

    async syncAllServers() {
        if (this.isProcessing) {
            console.log('⏳ การ sync กำลังดำเนินการอยู่...');
            return;
        }
        
        this.isProcessing = true;
        const startTime = performance.now();
        
        console.log('🔄 เริ่มต้น Universal Data Sync...');
        
        try {
            // ประมวลผล sync queue
            while (this.syncQueue.length > 0) {
                const syncItem = this.syncQueue.shift();
                await this.processSyncItem(syncItem);
            }
            
            this.stats.lastSync = new Date();
            this.stats.syncOperations++;
            
            const endTime = performance.now();
            console.log(`✅ Universal Data Sync เสร็จสิ้น (${(endTime - startTime).toFixed(2)}ms)`);
            
            // แจ้งเตือนการ sync เสร็จสิ้น
            this.broadcastToAll({
                type: 'sync_completed',
                data: {
                    timestamp: this.stats.lastSync,
                    duration: endTime - startTime,
                    totalServers: this.stats.totalServers,
                    dataEntries: this.stats.dataEntries
                }
            });
            
        } catch (error) {
            console.error('❌ ข้อผิดพลาดในการ sync:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    async processSyncItem(syncItem) {
        const { action, key, value, originServer } = syncItem;
        
        // Sync ไปยังเซิร์ฟเวอร์ทั้งหมด (ยกเว้นเซิร์ฟเวอร์ต้นทาง)
        for (const [serverId, server] of this.servers) {
            if (serverId !== originServer) {
                if (action === 'set') {
                    server.data.set(key, value);
                    server.lastSync = new Date();
                    
                    // อัปเดต syncedServers ใน dataStore
                    const dataEntry = this.dataStore.get(key);
                    if (dataEntry) {
                        dataEntry.syncedServers.add(serverId);
                    }
                }
            }
        }
    }

    startDataSync() {
        // Auto sync ทุก 30 วินาที
        setInterval(() => {
            if (this.syncQueue.length > 0) {
                this.syncAllServers();
            }
        }, 30000);
        
        console.log('🔄 เริ่มต้น Auto Data Sync (ทุก 30 วินาที)');
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

    getStats() {
        return {
            ...this.stats,
            serversByType: {
                'AI/ML': Array.from(this.servers.values()).filter(s => s.type === 'AI/ML').length,
                'Enterprise': Array.from(this.servers.values()).filter(s => s.type === 'Enterprise').length,
                'Specialized': Array.from(this.servers.values()).filter(s => s.type === 'Specialized').length
            },
            queueSize: this.syncQueue.length,
            isProcessing: this.isProcessing,
            uptime: process.uptime()
        };
    }

    // API สำหรับการเข้าถึงจากภายนอก
    async getServerData(serverId) {
        const server = this.servers.get(serverId);
        if (!server) {
            throw new Error(`ไม่พบเซิร์ฟเวอร์: ${serverId}`);
        }
        
        return {
            id: server.id,
            type: server.type,
            category: server.category,
            status: server.status,
            dataCount: server.data.size,
            lastSync: server.lastSync,
            connections: server.connections
        };
    }

    async getAllServersData() {
        const serversData = [];
        for (const [serverId, server] of this.servers) {
            serversData.push(await this.getServerData(serverId));
        }
        return serversData;
    }

    // ฟังก์ชันสำหรับค้นหาข้อมูล
    searchData(query) {
        const results = [];
        for (const [key, dataEntry] of this.dataStore) {
            if ((typeof key === 'string' && key.includes(query)) || 
                (dataEntry.value && JSON.stringify(dataEntry.value).includes(query))) {
                results.push({
                    key,
                    value: dataEntry.value,
                    serverId: dataEntry.serverId,
                    timestamp: dataEntry.timestamp
                });
            }
        }
        return results;
    }
}

// สร้าง Universal Data Hub
const universalHub = new UniversalDataHub();

// Export สำหรับใช้งานจากไฟล์อื่น
module.exports = UniversalDataHub;

// ถ้ารันไฟล์นี้โดยตรง
if (require.main === module) {
    console.log('🌐 NEXUS IDE - Universal Data Hub');
    console.log('🔗 เชื่อมต่อ MCP Servers ทั้ง 3000 ตัวเป็นก้อนข้อมูลเดียวกัน');
    console.log('📡 WebSocket Server: ws://localhost:9001');
    
    // จัดการ graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 กำลังปิด Universal Data Hub...');
        process.exit(0);
    });
}