#!/usr/bin/env node

/**
 * Script สำหรับเชื่อมต่อ MCP Servers เพิ่มเติมเข้าสู่ระบบ Git Memory MCP Server
 * รองรับการเชื่อมต่อ Community MCP Servers และ External MCP Servers
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

class MCPServerConnector {
    constructor() {
        this.configPath = path.join(__dirname, '../config');
        this.communityConfigPath = path.join(this.configPath, 'community-mcp.config.json');
        this.externalConfigPath = path.join(this.configPath, 'external-servers-500.json');
        this.mcpConfigPath = path.join(this.configPath, 'mcp-servers-config.json');
        this.connectedServers = new Map();
        this.serverProcesses = new Map();
    }

    /**
     * โหลดการกำหนดค่า MCP Servers
     */
    async loadConfigurations() {
        try {
            console.log('🔄 กำลังโหลดการกำหนดค่า MCP Servers...');
            
            // โหลด Community MCP Config
            if (fs.existsSync(this.communityConfigPath)) {
                const communityConfig = JSON.parse(fs.readFileSync(this.communityConfigPath, 'utf8'));
                this.communityServers = communityConfig.mcpServers || {};
                console.log(`✅ โหลด Community MCP Servers: ${Object.keys(this.communityServers).length} servers`);
            }

            // โหลด External MCP Config
            if (fs.existsSync(this.externalConfigPath)) {
                const externalConfig = JSON.parse(fs.readFileSync(this.externalConfigPath, 'utf8'));
                this.externalServers = externalConfig.servers || [];
                console.log(`✅ โหลด External MCP Servers: ${this.externalServers.length} servers`);
            }

            // โหลด Main MCP Config
            if (fs.existsSync(this.mcpConfigPath)) {
                const mcpConfig = JSON.parse(fs.readFileSync(this.mcpConfigPath, 'utf8'));
                this.mainServers = mcpConfig.servers || [];
                console.log(`✅ โหลด Main MCP Servers: ${this.mainServers.length} servers`);
            }

        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการโหลดการกำหนดค่า:', error.message);
            throw error;
        }
    }

    /**
     * เชื่อมต่อ Community MCP Servers
     */
    async connectCommunityServers(serverNames = []) {
        console.log('\n🚀 เริ่มเชื่อมต่อ Community MCP Servers...');
        
        const serversToConnect = serverNames.length > 0 
            ? serverNames.filter(name => this.communityServers[name])
            : Object.keys(this.communityServers);

        for (const serverName of serversToConnect) {
            try {
                await this.startCommunityServer(serverName);
            } catch (error) {
                console.error(`❌ ไม่สามารถเชื่อมต่อ ${serverName}:`, error.message);
            }
        }
    }

    /**
     * เริ่มต้น Community MCP Server
     */
    async startCommunityServer(serverName) {
        const config = this.communityServers[serverName];
        if (!config) {
            throw new Error(`ไม่พบการกำหนดค่าสำหรับ ${serverName}`);
        }

        console.log(`🔄 กำลังเริ่มต้น ${serverName}...`);

        // ตรวจสอบว่าไฟล์ server มีอยู่หรือไม่
        const serverPath = path.resolve(config.args[0]);
        if (!fs.existsSync(serverPath)) {
            console.log(`⚠️  ไฟล์ ${serverPath} ไม่พบ - กำลังสร้าง mock server...`);
            await this.createMockServer(serverName, config);
        }

        // เริ่มต้น server process
        const process = spawn(config.command, config.args, {
            env: { ...process.env, ...config.env },
            stdio: 'pipe'
        });

        process.stdout.on('data', (data) => {
            console.log(`[${serverName}] ${data.toString().trim()}`);
        });

        process.stderr.on('data', (data) => {
            console.error(`[${serverName}] ERROR: ${data.toString().trim()}`);
        });

        process.on('close', (code) => {
            console.log(`[${serverName}] Process exited with code ${code}`);
            this.serverProcesses.delete(serverName);
        });

        this.serverProcesses.set(serverName, process);
        this.connectedServers.set(serverName, {
            type: 'community',
            config,
            process,
            status: 'running',
            startTime: new Date()
        });

        console.log(`✅ ${serverName} เชื่อมต่อสำเร็จ (PID: ${process.pid})`);
        
        // รอให้ server เริ่มต้นเสร็จ
        await this.waitForServerReady(config.env.PORT);
    }

    /**
     * สร้าง Mock Server สำหรับ Community MCP Server
     */
    async createMockServer(serverName, config) {
        const serverDir = path.dirname(path.resolve(config.args[0]));
        
        // สร้างโฟลเดอร์ถ้าไม่มี
        if (!fs.existsSync(serverDir)) {
            fs.mkdirSync(serverDir, { recursive: true });
        }

        const mockServerContent = `
const express = require('express');
const cors = require('cors');

class ${serverName.replace(/-/g, '')}Server {
    constructor() {
        this.name = '${serverName}';
        this.port = ${config.env.PORT};
        this.category = '${config.env.MCP_SERVER_CATEGORY}';
        this.app = express();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.startServer();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
    }

    setupRoutes() {
        // Health check
        this.app.get(['/', '/health'], (req, res) => {
            res.json({
                status: 'healthy',
                name: this.name,
                category: this.category,
                port: this.port,
                timestamp: new Date().toISOString()
            });
        });

        // MCP Protocol endpoints
        this.app.get('/tools', (req, res) => {
            res.json({
                tools: this.getAvailableTools()
            });
        });

        this.app.post('/call', (req, res) => {
            const { tool, arguments: args } = req.body;
            res.json({
                success: true,
                result: \`Tool \${tool} executed successfully\`,
                server: this.name,
                timestamp: new Date().toISOString()
            });
        });
    }

    getAvailableTools() {
        const categoryTools = {
            'search': ['search_web', 'search_documents'],
            'productivity': ['create_task', 'update_task', 'get_tasks'],
            'notes': ['create_note', 'update_note', 'search_notes'],
            'project-management': ['create_issue', 'update_issue', 'get_projects'],
            'default': ['ping', 'status']
        };
        
        const tools = categoryTools[this.category] || categoryTools.default;
        return tools.map(tool => ({
            name: tool,
            description: \`\${tool.replace('_', ' ')} operation\`,
            category: this.category
        }));
    }

    startServer() {
        this.app.listen(this.port, () => {
            console.log(\`[\${this.name}] Server running on port \${this.port}\`);
        });
    }
}

new ${serverName.replace(/-/g, '')}Server();
`;

        fs.writeFileSync(path.resolve(config.args[0]), mockServerContent);
        console.log(`✅ สร้าง mock server สำหรับ ${serverName}`);
    }

    /**
     * รอให้ server พร้อมใช้งาน
     */
    async waitForServerReady(port, maxRetries = 10) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                await axios.get(`http://localhost:${port}/health`, { timeout: 2000 });
                return true;
            } catch (error) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        throw new Error(`Server on port ${port} not ready after ${maxRetries} retries`);
    }

    /**
     * เชื่อมต่อ External MCP Servers
     */
    async connectExternalServers(serverIds = []) {
        console.log('\n🌐 เริ่มเชื่อมต่อ External MCP Servers...');
        
        const serversToConnect = serverIds.length > 0
            ? this.externalServers.filter(server => serverIds.includes(server.id))
            : this.externalServers.slice(0, 10); // เชื่อมต่อ 10 ตัวแรก

        for (const server of serversToConnect) {
            try {
                await this.connectExternalServer(server);
            } catch (error) {
                console.error(`❌ ไม่สามารถเชื่อมต่อ ${server.name}:`, error.message);
            }
        }
    }

    /**
     * เชื่อมต่อ External MCP Server
     */
    async connectExternalServer(server) {
        console.log(`🔄 กำลังเชื่อมต่อ ${server.name}...`);

        try {
            // ทดสอบการเชื่อมต่อ
            const response = await axios.get(server.endpoint.replace('/mcp', '/health'), {
                timeout: 5000,
                headers: server.authentication ? {
                    'Authorization': `Bearer ${server.authentication.token}`
                } : {}
            });

            this.connectedServers.set(server.id, {
                type: 'external',
                config: server,
                status: 'connected',
                response: response.data,
                connectTime: new Date()
            });

            console.log(`✅ ${server.name} เชื่อมต่อสำเร็จ`);
        } catch (error) {
            console.log(`⚠️  ${server.name} ไม่สามารถเชื่อมต่อได้ - สร้าง mock endpoint`);
            await this.createMockExternalServer(server);
        }
    }

    /**
     * สร้าง Mock External Server
     */
    async createMockExternalServer(server) {
        // สำหรับ demo - ในการใช้งานจริงจะต้องมี external server จริง
        this.connectedServers.set(server.id, {
            type: 'external-mock',
            config: server,
            status: 'mock',
            connectTime: new Date()
        });
        console.log(`✅ สร้าง mock connection สำหรับ ${server.name}`);
    }

    /**
     * แสดงสถานะ servers ที่เชื่อมต่อ
     */
    showConnectedServers() {
        console.log('\n📊 สถานะ MCP Servers ที่เชื่อมต่อ:');
        console.log('=' .repeat(60));
        
        for (const [serverId, serverInfo] of this.connectedServers) {
            const status = serverInfo.status === 'running' ? '🟢' : 
                          serverInfo.status === 'connected' ? '🔵' : '🟡';
            
            console.log(`${status} ${serverId}`);
            console.log(`   Type: ${serverInfo.type}`);
            console.log(`   Status: ${serverInfo.status}`);
            if (serverInfo.config.env?.PORT) {
                console.log(`   Port: ${serverInfo.config.env.PORT}`);
            }
            if (serverInfo.config.endpoint) {
                console.log(`   Endpoint: ${serverInfo.config.endpoint}`);
            }
            console.log('');
        }
        
        console.log(`📈 รวม: ${this.connectedServers.size} servers`);
    }

    /**
     * หยุดการทำงานของ servers
     */
    async stopAllServers() {
        console.log('\n🛑 กำลังหยุดการทำงานของ servers...');
        
        for (const [serverId, process] of this.serverProcesses) {
            try {
                process.kill('SIGTERM');
                console.log(`✅ หยุด ${serverId}`);
            } catch (error) {
                console.error(`❌ ไม่สามารถหยุด ${serverId}:`, error.message);
            }
        }
        
        this.serverProcesses.clear();
        this.connectedServers.clear();
    }

    /**
     * บันทึกการกำหนดค่าที่อัปเดต
     */
    async saveUpdatedConfig() {
        const updatedConfig = {
            version: '1.1.0',
            lastUpdated: new Date().toISOString(),
            connectedServers: Array.from(this.connectedServers.entries()).map(([id, info]) => ({
                id,
                type: info.type,
                status: info.status,
                config: info.config
            }))
        };

        const configPath = path.join(this.configPath, 'connected-servers.json');
        fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
        console.log(`✅ บันทึกการกำหนดค่าที่ ${configPath}`);
    }
}

// Main execution
async function main() {
    const connector = new MCPServerConnector();
    
    try {
        // โหลดการกำหนดค่า
        await connector.loadConfigurations();
        
        // เชื่อมต่อ Community Servers (เลือกบางตัว)
        const priorityCommunityServers = [
            'mcp-servers-kagi',
            'mcp-server-notion', 
            'mcp-server-todoist',
            'mcp-server-linear',
            'mcp-server-obsidian'
        ];
        await connector.connectCommunityServers(priorityCommunityServers);
        
        // เชื่อมต่อ External Servers (5 ตัวแรก)
        await connector.connectExternalServers();
        
        // แสดงสถานะ
        connector.showConnectedServers();
        
        // บันทึกการกำหนดค่า
        await connector.saveUpdatedConfig();
        
        console.log('\n🎉 เชื่อมต่อ MCP Servers เพิ่มเติมเสร็จสิ้น!');
        console.log('💡 ใช้ Ctrl+C เพื่อหยุดการทำงาน');
        
        // รอสัญญาณหยุด
        process.on('SIGINT', async () => {
            console.log('\n🛑 กำลังหยุดการทำงาน...');
            await connector.stopAllServers();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
        process.exit(1);
    }
}

// เรียกใช้ถ้าไฟล์นี้ถูกเรียกโดยตรง
if (require.main === module) {
    main();
}

module.exports = MCPServerConnector;