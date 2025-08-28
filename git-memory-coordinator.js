#!/usr/bin/env node
/**
 * Git Memory Coordinator - ตัวประมวลแชร์ข้อมูลสำหรับระบบ 1000 MCP Servers
 * รองรับการแชร์ข้อมูลแบบ real-time ผ่าน Git-based memory system
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const http = require('http');

class GitMemoryCoordinator {
    constructor() {
        this.servers = [];
        this.memoryStore = new Map();
        this.gitMemoryPath = path.join(__dirname, '.git-memory');
        this.coordinatorPort = 9000;
        this.healthCheckInterval = 30000; // 30 seconds
        this.webhookSubscriptions = new Map(); // key -> Set of webhook URLs
        
        // สร้างโฟลเดอร์ git-memory หากไม่มี
        if (!fs.existsSync(this.gitMemoryPath)) {
            fs.mkdirSync(this.gitMemoryPath, { recursive: true });
        }
        
        this.initializeGitMemory();
        this.startCoordinatorServer();
        this.discoverServers();
        this.startHealthCheck();
    }
    
    /**
     * เข้ารหัสข้อมูลสำหรับข้อมูลส่วนตัว
     */
    encryptData(data, password) {
        const crypto = require('crypto');
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(password, 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipher(algorithm, key);
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            algorithm
        };
    }
    
    /**
     * ถอดรหัสข้อมูลส่วนตัว
     */
    decryptData(encryptedData, password) {
        const crypto = require('crypto');
        const key = crypto.scryptSync(password, 'salt', 32);
        
        const decipher = crypto.createDecipher(encryptedData.algorithm, key);
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }
    
    /**
     * ส่ง webhook notifications
     */
    async sendWebhookNotifications(key, data) {
        try {
            // ตรวจสอบ direct subscriptions
            if (this.webhookSubscriptions.has(key)) {
                const webhooks = this.webhookSubscriptions.get(key);
                
                for (const webhookUrl of webhooks) {
                    try {
                        const http = require('http');
                        const url = new URL(webhookUrl);
                        const postData = JSON.stringify({
                            event: 'data_update',
                            key,
                            value: data.private ? '[ENCRYPTED]' : data.value,
                            timestamp: data.timestamp,
                            persist: data.persist,
                            private: data.private
                        });
                        
                        const options = {
                            hostname: url.hostname,
                            port: url.port || 80,
                            path: url.pathname,
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Git-Memory-Event': 'data_update',
                                'Content-Length': Buffer.byteLength(postData)
                            }
                        };
                        
                        const req = http.request(options);
                        req.write(postData);
                        req.end();
                    } catch (webhookError) {
                        console.log(`⚠️ Webhook error for ${webhookUrl}: ${webhookError.message}`);
                    }
                }
            }
        } catch (error) {
            console.log(`⚠️ Error sending webhook notifications: ${error.message}`);
        }
    }
    
    /**
     * เริ่มต้น Git Memory Repository
     */
    async initializeGitMemory() {
        try {
            const gitDir = path.join(this.gitMemoryPath, '.git');
            if (!fs.existsSync(gitDir)) {
                console.log('🔧 กำลังเริ่มต้น Git Memory Repository...');
                await this.execCommand('git init', this.gitMemoryPath);
                await this.execCommand('git config user.name "Git Memory Coordinator"', this.gitMemoryPath);
                await this.execCommand('git config user.email "coordinator@git-memory.local"', this.gitMemoryPath);
                
                // สร้างไฟล์ README
                const readmePath = path.join(this.gitMemoryPath, 'README.md');
                fs.writeFileSync(readmePath, '# Git Memory Shared Storage\n\nระบบแชร์ข้อมูลสำหรับ 1000 MCP Servers\n');
                
                await this.execCommand('git add .', this.gitMemoryPath);
                await this.execCommand('git commit -m "Initial commit: Git Memory System"', this.gitMemoryPath);
                
                console.log('✅ Git Memory Repository เริ่มต้นเสร็จสิ้น');
            }
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการเริ่มต้น Git Memory:', error.message);
        }
    }
    
    /**
     * เริ่มต้น Coordinator Server
     */
    startCoordinatorServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const url = new URL(req.url, `http://localhost:${this.coordinatorPort}`);
            const pathname = url.pathname;
            
            if (pathname === '/status') {
                this.handleStatusRequest(req, res);
            } else if (pathname === '/memory/set') {
                this.handleMemorySet(req, res);
            } else if (pathname === '/memory/get') {
                this.handleMemoryGet(req, res);
            } else if (pathname === '/memory/sync') {
                this.handleMemorySync(req, res);
            } else if (pathname === '/memory/webhook') {
                this.handleWebhookRequest(req, res);
            } else if (pathname === '/memory/broadcast') {
                this.handleBroadcastRequest(req, res);
            } else if (pathname === '/memory/notifications') {
                this.handleNotificationsRequest(req, res);
            } else if (pathname === '/servers') {
                this.handleServersRequest(req, res);
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });
        
        server.listen(this.coordinatorPort, () => {
            console.log(`🚀 Git Memory Coordinator เริ่มทำงานที่พอร์ต ${this.coordinatorPort}`);
            console.log(`📊 Dashboard: http://localhost:${this.coordinatorPort}/status`);
        });
    }
    
    /**
     * ค้นหา MCP Servers ที่กำลังทำงาน
     */
    async discoverServers() {
        console.log('🔍 กำลังค้นหา MCP Servers...');
        
        // ค้นหาจากโฟลเดอร์ servers
        const serversDir = path.join(__dirname, 'servers');
        if (fs.existsSync(serversDir)) {
            const serverFolders = fs.readdirSync(serversDir)
                .filter(folder => folder.startsWith('gen-'))
                .sort();
            
            let activeServers = 0;
            for (const folder of serverFolders) {
                const serverPath = path.join(serversDir, folder);
                const serverNumber = parseInt(folder.replace('gen-', ''));
                const healthPort = 4000 + serverNumber;
                const mcpPort = 3000 + serverNumber;
                
                const serverInfo = {
                    id: folder,
                    name: folder,
                    healthPort,
                    mcpPort,
                    path: serverPath,
                    status: 'unknown',
                    lastSeen: null
                };
                
                this.servers.push(serverInfo);
                
                // ตรวจสอบสถานะ server
                try {
                    await this.checkServerHealth(serverInfo);
                    if (serverInfo.status === 'active') {
                        activeServers++;
                    }
                } catch (error) {
                    serverInfo.status = 'inactive';
                }
            }
            
            console.log(`✅ พบ ${this.servers.length} servers, ${activeServers} servers กำลังทำงาน`);
        }
    }
    
    /**
     * ตรวจสอบสุขภาพของ server
     */
    async checkServerHealth(serverInfo) {
        return new Promise((resolve, reject) => {
            const req = http.get(`http://localhost:${serverInfo.healthPort}/health`, (res) => {
                if (res.statusCode === 200) {
                    serverInfo.status = 'active';
                    serverInfo.lastSeen = new Date();
                    resolve(true);
                } else {
                    serverInfo.status = 'inactive';
                    reject(new Error(`Health check failed: ${res.statusCode}`));
                }
            });
            
            req.on('error', (error) => {
                serverInfo.status = 'inactive';
                reject(error);
            });
            
            req.setTimeout(5000, () => {
                req.destroy();
                serverInfo.status = 'inactive';
                reject(new Error('Health check timeout'));
            });
        });
    }
    
    /**
     * เริ่มต้นการตรวจสอบสุขภาพแบบ periodic
     */
    startHealthCheck() {
        setInterval(async () => {
            console.log('🔍 กำลังตรวจสอบสุขภาพ servers...');
            let activeCount = 0;
            
            for (const server of this.servers) {
                try {
                    await this.checkServerHealth(server);
                    if (server.status === 'active') {
                        activeCount++;
                    }
                } catch (error) {
                    // Server is inactive
                }
            }
            
            console.log(`📊 Servers สถานะ: ${activeCount}/${this.servers.length} กำลังทำงาน`);
        }, this.healthCheckInterval);
    }
    
    /**
     * จัดการคำขอสถานะ
     */
    handleStatusRequest(req, res) {
        const activeServers = this.servers.filter(s => s.status === 'active');
        const inactiveServers = this.servers.filter(s => s.status === 'inactive');
        
        const status = {
            coordinator: {
                status: 'running',
                port: this.coordinatorPort,
                uptime: process.uptime(),
                memory: process.memoryUsage()
            },
            servers: {
                total: this.servers.length,
                active: activeServers.length,
                inactive: inactiveServers.length,
                list: this.servers.map(s => ({
                    id: s.id,
                    name: s.name,
                    status: s.status,
                    healthPort: s.healthPort,
                    mcpPort: s.mcpPort,
                    lastSeen: s.lastSeen
                }))
            },
            memory: {
                storeSize: this.memoryStore.size,
                gitPath: this.gitMemoryPath
            }
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(status, null, 2));
    }
    
    /**
     * จัดการการตั้งค่าข้อมูลในหน่วยความจำ
     */
    async handleMemorySet(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { key, value, persist = false, private: isPrivate = false, password } = JSON.parse(body);
                
                if (!key) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Key is required' }));
                    return;
                }
                
                if (isPrivate && !password) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Password is required for private data' }));
                    return;
                }
                
                const dataToStore = {
                    value: isPrivate ? this.encryptData(value, password) : value,
                    timestamp: new Date(),
                    persist,
                    private: isPrivate,
                    encrypted: isPrivate
                };
                
                // เก็บในหน่วยความจำ
                this.memoryStore.set(key, dataToStore);
                
                // บันทึกลง Git หากต้องการ persist
                if (persist) {
                    await this.persistToGit(key, dataToStore.value, isPrivate);
                }
                
                // ส่ง webhook notifications ถ้ามี subscribers
                await this.sendWebhookNotifications(key, dataToStore);
                
                res.writeHead(200);
                res.end(JSON.stringify({ 
                    success: true, 
                    key, 
                    persisted: persist,
                    private: isPrivate
                }));
                
                console.log(`💾 บันทึกข้อมูล: ${key} ${persist ? '(persistent)' : '(memory only)'} ${isPrivate ? '(private)' : ''}`);
                
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    /**
     * จัดการการดึงข้อมูลจากหน่วยความจำ
     */
    handleMemoryGet(req, res) {
        const url = new URL(req.url, `http://localhost:${this.coordinatorPort}`);
        const key = url.searchParams.get('key');
        const password = url.searchParams.get('password');
        
        if (!key) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Key parameter is required' }));
            return;
        }
        
        const data = this.memoryStore.get(key);
        
        if (data) {
            if (data.private && data.encrypted) {
                if (!password) {
                    res.writeHead(401);
                    res.end(JSON.stringify({ error: 'Password required for private data' }));
                    return;
                }
                
                try {
                    const decryptedValue = this.decryptData(data.value, password);
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        success: true,
                        key,
                        value: decryptedValue,
                        timestamp: data.timestamp,
                        persist: data.persist,
                        private: true
                    }));
                    return;
                } catch (error) {
                    res.writeHead(401);
                    res.end(JSON.stringify({ error: 'Invalid password' }));
                    return;
                }
            }
            
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                key,
                value: data.value,
                timestamp: data.timestamp,
                persist: data.persist,
                private: data.private || false
            }));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ 
                success: false, 
                error: 'Key not found' 
            }));
        }
    }
    
    /**
     * จัดการการซิงค์ข้อมูลจาก Git
     */
    async handleMemorySync(req, res) {
        try {
            await this.syncFromGit();
            res.writeHead(200);
            res.end(JSON.stringify({ 
                success: true, 
                message: 'Memory synced from Git',
                storeSize: this.memoryStore.size
            }));
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    
    /**
     * จัดการคำขอรายการ servers
     */
    handleServersRequest(req, res) {
        res.writeHead(200);
        res.end(JSON.stringify({
            servers: this.servers,
            summary: {
                total: this.servers.length,
                active: this.servers.filter(s => s.status === 'active').length,
                inactive: this.servers.filter(s => s.status === 'inactive').length
            }
        }, null, 2));
    }
    
    /**
     * จัดการ webhook subscriptions
     */
    handleWebhookRequest(req, res) {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const { key, webhookUrl, action = 'subscribe' } = JSON.parse(body);
                    
                    if (action === 'subscribe') {
                        if (!this.webhookSubscriptions.has(key)) {
                            this.webhookSubscriptions.set(key, new Set());
                        }
                        this.webhookSubscriptions.get(key).add(webhookUrl);
                        
                        res.writeHead(200);
                        res.end(JSON.stringify({ 
                            success: true, 
                            message: `Subscribed to ${key}`,
                            webhookUrl 
                        }));
                    } else if (action === 'unsubscribe') {
                        if (this.webhookSubscriptions.has(key)) {
                            this.webhookSubscriptions.get(key).delete(webhookUrl);
                            if (this.webhookSubscriptions.get(key).size === 0) {
                                this.webhookSubscriptions.delete(key);
                            }
                        }
                        
                        res.writeHead(200);
                        res.end(JSON.stringify({ 
                            success: true, 
                            message: `Unsubscribed from ${key}`,
                            webhookUrl 
                        }));
                    }
                } catch (error) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: error.message }));
                }
            });
        } else {
            res.writeHead(405);
            res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
    }
    
    /**
     * จัดการ broadcast messages
     */
    handleBroadcastRequest(req, res) {
        if (req.method === 'GET') {
            const url = new URL(req.url, `http://localhost:${this.coordinatorPort}`);
            const since = url.searchParams.get('since');
            const limit = parseInt(url.searchParams.get('limit') || '50');
            
            const broadcasts = [];
            
            for (const [key, data] of this.memoryStore.entries()) {
                if (key.startsWith('broadcast_') && data.value && data.value.type === 'broadcast') {
                    if (!since || new Date(data.timestamp) > new Date(since)) {
                        broadcasts.push({
                            key,
                            ...data.value,
                            timestamp: data.timestamp
                        });
                    }
                }
            }
            
            broadcasts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            res.writeHead(200);
            res.end(JSON.stringify({ 
                success: true, 
                broadcasts: broadcasts.slice(0, limit),
                count: broadcasts.length
            }));
        } else {
            res.writeHead(405);
            res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
    }
    
    /**
     * จัดการ notifications
     */
    handleNotificationsRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.coordinatorPort}`);
        const target = url.searchParams.get('target');
        const since = url.searchParams.get('since');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        
        const notifications = [];
        
        for (const [key, data] of this.memoryStore.entries()) {
            if (key.startsWith('notification_') && data.value && data.value.type === 'notification') {
                const notification = data.value;
                
                if (!target || notification.targets.includes('all') || notification.targets.includes(target)) {
                    if (!since || new Date(data.timestamp) > new Date(since)) {
                        notifications.push({
                            key,
                            ...notification,
                            timestamp: data.timestamp
                        });
                    }
                }
            }
        }
        
        notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.writeHead(200);
        res.end(JSON.stringify({ 
            success: true, 
            notifications: notifications.slice(0, limit),
            count: notifications.length
        }));
    }
    
    /**
     * บันทึกข้อมูลลง Git
     */
    async persistToGit(key, value, isPrivate = false) {
        try {
            const dataPath = path.join(this.gitMemoryPath, 'data');
            if (!fs.existsSync(dataPath)) {
                fs.mkdirSync(dataPath, { recursive: true });
            }
            
            const filePath = path.join(dataPath, `${key}.json`);
            const data = {
                key,
                value,
                timestamp: new Date().toISOString(),
                coordinator: 'git-memory-coordinator',
                private: isPrivate,
                encrypted: isPrivate
            };
            
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            
            await this.execCommand('git add .', this.gitMemoryPath);
            await this.execCommand(`git commit -m "Update: ${key}${isPrivate ? ' (private)' : ''}"`, this.gitMemoryPath);
            
            console.log(`📝 บันทึกข้อมูล ${key} ลง Git เรียบร้อย${isPrivate ? ' (private)' : ''}`);
        } catch (error) {
            console.error(`❌ เกิดข้อผิดพลาดในการบันทึก ${key}:`, error.message);
            throw error;
        }
    }
    
    /**
     * ซิงค์ข้อมูลจาก Git
     */
    async syncFromGit() {
        try {
            const dataPath = path.join(this.gitMemoryPath, 'data');
            if (!fs.existsSync(dataPath)) {
                return;
            }
            
            const files = fs.readdirSync(dataPath)
                .filter(file => file.endsWith('.json'));
            
            let syncedCount = 0;
            for (const file of files) {
                const filePath = path.join(dataPath, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);
                
                this.memoryStore.set(data.key, {
                    value: data.value,
                    timestamp: new Date(data.timestamp),
                    persist: true,
                    private: data.private || false,
                    encrypted: data.encrypted || false
                });
                
                syncedCount++;
            }
            
            console.log(`🔄 ซิงค์ข้อมูล ${syncedCount} รายการจาก Git เรียบร้อย`);
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการซิงค์จาก Git:', error.message);
            throw error;
        }
    }
    
    /**
     * รันคำสั่ง shell
     */
    execCommand(command, cwd = process.cwd()) {
        return new Promise((resolve, reject) => {
            exec(command, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }
}

// เริ่มต้น Git Memory Coordinator
if (require.main === module) {
    console.log('🚀 เริ่มต้น Git Memory Coordinator...');
    console.log('📊 ระบบแชร์ข้อมูลสำหรับ 1000 MCP Servers');
    console.log('=' .repeat(50));
    
    const coordinator = new GitMemoryCoordinator();
    
    // จัดการการปิดโปรแกรม
    process.on('SIGINT', () => {
        console.log('\n🛑 กำลังปิด Git Memory Coordinator...');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n🛑 กำลังปิด Git Memory Coordinator...');
        process.exit(0);
    });
}

module.exports = GitMemoryCoordinator;