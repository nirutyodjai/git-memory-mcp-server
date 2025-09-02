#!/usr/bin/env node
/**
 * Create Additional Servers Script
 * สคริปต์สำหรับสร้าง MCP Servers เพิ่มเติมเมื่อระบบต้องการ scale up
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class AdditionalServerCreator {
    constructor() {
        this.basePort = 3000;
        this.serverProcesses = new Map();
        this.createdServers = [];
    }
    
    /**
     * สร้าง servers เพิ่มเติม
     */
    async createServers(count) {
        console.log(`🚀 กำลังสร้าง ${count} MCP Servers เพิ่มเติม...`);
        
        try {
            // อ่านข้อมูล servers ที่มีอยู่
            const existingServers = await this.getExistingServers();
            const startPort = this.findNextAvailablePort(existingServers);
            
            console.log(`📡 เริ่มต้นที่ port ${startPort}`);
            
            const promises = [];
            
            for (let i = 0; i < count; i++) {
                const port = startPort + i;
                const serverId = `mcp-server-${Date.now()}-${i}`;
                
                promises.push(this.createSingleServer(serverId, port, i));
                
                // สร้างทีละ 10 servers เพื่อไม่ให้ระบบล้น
                if ((i + 1) % 10 === 0) {
                    await Promise.all(promises.splice(0, 10));
                    console.log(`✅ สร้างแล้ว ${i + 1}/${count} servers`);
                    
                    // รอ 1 วินาทีก่อนสร้างชุดต่อไป
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            // สร้าง servers ที่เหลือ
            if (promises.length > 0) {
                await Promise.all(promises);
            }
            
            console.log(`✅ สร้าง ${count} servers เสร็จสมบูรณ์`);
            
            // บันทึกข้อมูล servers ใหม่
            await this.saveServerInfo();
            
            // รอให้ servers เริ่มต้นเสร็จ
            await this.waitForServersReady();
            
            return {
                success: true,
                created: this.createdServers.length,
                servers: this.createdServers
            };
            
        } catch (error) {
            console.error('❌ Error creating servers:', error.message);
            return {
                success: false,
                error: error.message,
                created: this.createdServers.length
            };
        }
    }
    
    /**
     * สร้าง server เดียว
     */
    async createSingleServer(serverId, port, index) {
        return new Promise((resolve, reject) => {
            try {
                // สร้างไฟล์ config สำหรับ server
                const serverConfig = this.generateServerConfig(serverId, port, index);
                
                // เริ่มต้น server process
                const serverProcess = spawn('node', ['-e', serverConfig], {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    cwd: __dirname,
                    env: {
                        ...process.env,
                        MCP_SERVER_ID: serverId,
                        MCP_SERVER_PORT: port.toString(),
                        MCP_SERVER_INDEX: index.toString()
                    }
                });
                
                let output = '';
                let errorOutput = '';
                
                serverProcess.stdout.on('data', (data) => {
                    output += data.toString();
                });
                
                serverProcess.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });
                
                serverProcess.on('spawn', () => {
                    console.log(`🟢 Server ${serverId} started on port ${port}`);
                    
                    this.serverProcesses.set(serverId, {
                        process: serverProcess,
                        port,
                        startTime: new Date(),
                        output,
                        errorOutput
                    });
                    
                    this.createdServers.push({
                        id: serverId,
                        port,
                        pid: serverProcess.pid,
                        startTime: new Date(),
                        status: 'starting'
                    });
                    
                    resolve({ serverId, port, pid: serverProcess.pid });
                });
                
                serverProcess.on('error', (error) => {
                    console.error(`❌ Failed to start server ${serverId}:`, error.message);
                    reject(error);
                });
                
                // Timeout after 30 seconds
                setTimeout(() => {
                    if (!this.serverProcesses.has(serverId)) {
                        serverProcess.kill();
                        reject(new Error(`Timeout starting server ${serverId}`));
                    }
                }, 30000);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * สร้าง config สำหรับ server
     */
    generateServerConfig(serverId, port, index) {
        // สร้างหมวดหมู่ตาม index
        const categories = [
            'ai-ml', 'data-analysis', 'web-dev', 'general', 'code-management',
            'design-tools', 'browser-automation', 'version-control'
        ];
        const category = categories[index % categories.length];
        
        return `
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const http = require('http');
const crypto = require('crypto');

class MCPServer {
    constructor(serverId, port, category) {
        this.serverId = serverId;
        this.port = port;
        this.category = category;
        this.server = new Server({
            name: serverId,
            version: '1.0.0'
        }, {
            capabilities: {
                resources: {},
                tools: {},
                prompts: {}
            }
        });
        
        this.setupHandlers();
        this.startHttpServer();
    }
    
    setupHandlers() {
        // Resource handlers
        this.server.setRequestHandler('resources/list', async () => {
            return {
                resources: [
                    {
                        uri: \`\${this.category}://\${this.serverId}/status\`,
                        name: 'Server Status',
                        mimeType: 'application/json'
                    }
                ]
            };
        });
        
        this.server.setRequestHandler('resources/read', async (request) => {
            const { uri } = request.params;
            
            if (uri === \`\${this.category}://\${this.serverId}/status\`) {
                return {
                    contents: [{
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify({
                            serverId: this.serverId,
                            port: this.port,
                            category: this.category,
                            status: 'running',
                            uptime: process.uptime(),
                            memory: process.memoryUsage(),
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }]
                };
            }
            
            throw new Error('Resource not found');
        });
        
        // Tool handlers
        this.server.setRequestHandler('tools/list', async () => {
            return {
                tools: [
                    {
                        name: 'get_server_info',
                        description: \`Get information about \${this.category} server\`,
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: []
                        }
                    },
                    {
                        name: 'health_check',
                        description: 'Perform server health check',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: []
                        }
                    }
                ]
            };
        });
        
        this.server.setRequestHandler('tools/call', async (request) => {
            const { name, arguments: args } = request.params;
            
            switch (name) {
                case 'get_server_info':
                    return {
                        content: [{
                            type: 'text',
                            text: JSON.stringify({
                                serverId: this.serverId,
                                port: this.port,
                                category: this.category,
                                pid: process.pid,
                                uptime: process.uptime(),
                                memory: process.memoryUsage(),
                                cpuUsage: process.cpuUsage(),
                                version: process.version,
                                platform: process.platform
                            }, null, 2)
                        }]
                    };
                    
                case 'health_check':
                    const health = {
                        status: 'healthy',
                        timestamp: new Date().toISOString(),
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        loadAverage: require('os').loadavg(),
                        freeMemory: require('os').freemem(),
                        totalMemory: require('os').totalmem()
                    };
                    
                    return {
                        content: [{
                            type: 'text',
                            text: JSON.stringify(health, null, 2)
                        }]
                    };
                    
                default:
                    throw new Error(\`Unknown tool: \${name}\`);
            }
        });
    }
    
    startHttpServer() {
        const httpServer = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');
            
            if (req.url === '/health') {
                res.writeHead(200);
                res.end(JSON.stringify({
                    serverId: this.serverId,
                    status: 'running',
                    port: this.port,
                    category: this.category,
                    uptime: process.uptime(),
                    timestamp: new Date().toISOString()
                }));
            } else if (req.url === '/info') {
                res.writeHead(200);
                res.end(JSON.stringify({
                    serverId: this.serverId,
                    port: this.port,
                    category: this.category,
                    pid: process.pid,
                    memory: process.memoryUsage(),
                    uptime: process.uptime(),
                    version: '1.0.0',
                    timestamp: new Date().toISOString()
                }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not Found' }));
            }
        });
        
        httpServer.listen(this.port, () => {
            console.log(\`🚀 MCP Server \${this.serverId} (\${this.category}) running on port \${this.port}\`);
        });
        
        httpServer.on('error', (error) => {
            console.error(\`❌ HTTP Server error for \${this.serverId}:\`, error.message);
        });
    }
    
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log(\`✅ MCP Server \${this.serverId} connected via stdio\`);
    }
}

// เริ่มต้น server
const serverId = process.env.MCP_SERVER_ID || 'mcp-server-' + Date.now();
const port = parseInt(process.env.MCP_SERVER_PORT) || 3000;
const index = parseInt(process.env.MCP_SERVER_INDEX) || 0;
const categories = ['ai-ml', 'data-analysis', 'web-dev', 'general', 'code-management', 'design-tools', 'browser-automation', 'version-control'];
const category = categories[index % categories.length];

const mcpServer = new MCPServer(serverId, port, category);
mcpServer.run().catch(console.error);

// จัดการการปิดโปรแกรม
process.on('SIGINT', () => {
    console.log(\`\\n🛑 Shutting down MCP Server \${serverId}...\`);
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(\`\\n🛑 Shutting down MCP Server \${serverId}...\`);
    process.exit(0);
});
        `;
    }
    
    /**
     * ดึงข้อมูล servers ที่มีอยู่
     */
    async getExistingServers() {
        try {
            const serversFile = path.join(__dirname, 'servers.json');
            const data = await fs.readFile(serversFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // ถ้าไม่มีไฟล์ ให้เริ่มต้นด้วย array ว่าง
            return [];
        }
    }
    
    /**
     * หา port ที่ว่างถัดไป
     */
    findNextAvailablePort(existingServers) {
        const usedPorts = existingServers.map(s => s.port).sort((a, b) => a - b);
        let nextPort = this.basePort;
        
        for (const port of usedPorts) {
            if (nextPort < port) {
                break;
            }
            nextPort = port + 1;
        }
        
        return nextPort;
    }
    
    /**
     * บันทึกข้อมูล servers
     */
    async saveServerInfo() {
        try {
            const existingServers = await this.getExistingServers();
            const allServers = [...existingServers, ...this.createdServers];
            
            const serversFile = path.join(__dirname, 'servers.json');
            await fs.writeFile(serversFile, JSON.stringify(allServers, null, 2));
            
            console.log(`💾 บันทึกข้อมูล ${allServers.length} servers`);
        } catch (error) {
            console.error('❌ Error saving server info:', error.message);
        }
    }
    
    /**
     * รอให้ servers พร้อมใช้งาน
     */
    async waitForServersReady() {
        console.log('⏳ รอให้ servers พร้อมใช้งาน...');
        
        const maxWaitTime = 60000; // 1 minute
        const checkInterval = 2000; // 2 seconds
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            let readyCount = 0;
            
            for (const server of this.createdServers) {
                try {
                    const response = await this.checkServerHealth(server.port);
                    if (response.status === 'running') {
                        readyCount++;
                        server.status = 'running';
                    }
                } catch (error) {
                    // Server ยังไม่พร้อม
                }
            }
            
            console.log(`📊 Servers ready: ${readyCount}/${this.createdServers.length}`);
            
            if (readyCount === this.createdServers.length) {
                console.log('✅ ทุก servers พร้อมใช้งานแล้ว');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
        
        console.log('⚠️  บาง servers อาจยังไม่พร้อมใช้งาน');
    }
    
    /**
     * ตรวจสอบสุขภาพของ server
     */
    async checkServerHealth(port) {
        return new Promise((resolve, reject) => {
            const req = require('http').get(`http://localhost:${port}/health`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            req.on('error', reject);
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Health check timeout'));
            });
        });
    }
}

// เรียกใช้งานจาก command line
if (require.main === module) {
    const count = parseInt(process.argv[2]) || 10;
    
    console.log('🚀 Additional Server Creator');
    console.log('=' .repeat(50));
    console.log(`📊 จำนวน servers ที่จะสร้าง: ${count}`);
    
    const creator = new AdditionalServerCreator();
    
    creator.createServers(count)
        .then(result => {
            if (result.success) {
                console.log(`\n✅ สร้าง servers สำเร็จ: ${result.created}/${count}`);
                console.log('📋 รายการ servers ที่สร้าง:');
                result.servers.forEach(server => {
                    console.log(`   - ${server.id} (port: ${server.port}, pid: ${server.pid})`);
                });
                process.exit(0);
            } else {
                console.error(`\n❌ สร้าง servers ล้มเหลว: ${result.error}`);
                console.log(`📊 สร้างได้: ${result.created}/${count}`);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Unexpected error:', error.message);
            process.exit(1);
        });
}

module.exports = AdditionalServerCreator;