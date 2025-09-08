#!/usr/bin/env node

/**
 * MCP Connection Manager - Interactive Tool สำหรับจัดการการเชื่อมต่อ MCP Servers
 * รองรับการเชื่อมต่อ, ตรวจสอบสถานะ, และจัดการ MCP Servers แบบ Interactive
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { spawn } = require('child_process');
const colors = require('colors');

class MCPConnectionManager {
    constructor() {
        this.configPath = path.join(__dirname, '../config');
        this.connectedServers = new Map();
        this.serverProcesses = new Map();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.loadConfigurations();
    }

    /**
     * โหลดการกำหนดค่าทั้งหมด
     */
    loadConfigurations() {
        try {
            // โหลด Community MCP Config
            const communityConfigPath = path.join(this.configPath, 'community-mcp.config.json');
            if (fs.existsSync(communityConfigPath)) {
                const communityConfig = JSON.parse(fs.readFileSync(communityConfigPath, 'utf8'));
                this.communityServers = communityConfig.mcpServers || {};
            }

            // โหลด External Servers Config
            const externalConfigPath = path.join(this.configPath, 'external-servers-500.json');
            if (fs.existsSync(externalConfigPath)) {
                const externalConfig = JSON.parse(fs.readFileSync(externalConfigPath, 'utf8'));
                this.externalServers = externalConfig.servers || [];
            }

            // โหลด Main MCP Config
            const mcpConfigPath = path.join(this.configPath, 'mcp-servers-config.json');
            if (fs.existsSync(mcpConfigPath)) {
                const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
                this.mainServers = mcpConfig.servers || [];
            }

            // โหลด Working Servers
            const workingServersPath = path.join(__dirname, '../working-servers');
            if (fs.existsSync(workingServersPath)) {
                this.workingServers = fs.readdirSync(workingServersPath)
                    .filter(file => file.endsWith('.js'))
                    .map(file => ({
                        name: file.replace('.js', ''),
                        path: path.join(workingServersPath, file),
                        category: this.extractCategory(file)
                    }));
            }

        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการโหลดการกำหนดค่า:'.red, error.message);
        }
    }

    /**
     * แยกหมวดหมู่จากชื่อไฟล์
     */
    extractCategory(filename) {
        const match = filename.match(/working-mcp-([^-]+)-/);
        return match ? match[1] : 'unknown';
    }

    /**
     * แสดงเมนูหลัก
     */
    showMainMenu() {
        console.clear();
        console.log('\n' + '='.repeat(60).cyan);
        console.log('🚀 MCP Connection Manager'.bold.green);
        console.log('Git Memory MCP Server - Advanced Connection Tool'.gray);
        console.log('='.repeat(60).cyan);
        
        console.log('\n📋 เมนูหลัก:'.bold.yellow);
        console.log('1. 📊 แสดงสถานะ MCP Servers ทั้งหมด');
        console.log('2. 🔗 เชื่อมต่อ Community MCP Servers');
        console.log('3. 🌐 เชื่อมต่อ External MCP Servers');
        console.log('4. ⚡ เริ่มต้น Working MCP Servers');
        console.log('5. 🔍 ค้นหาและเชื่อมต่อ MCP Server');
        console.log('6. 📈 ตรวจสอบประสิทธิภาพ Servers');
        console.log('7. 🛠️  จัดการ Server Configurations');
        console.log('8. 🔄 รีสตาร์ท Servers');
        console.log('9. 🛑 หยุดการทำงาน Servers ทั้งหมด');
        console.log('0. 🚪 ออกจากโปรแกรม');
        
        console.log('\n📊 สถานะปัจจุบัน:'.bold.blue);
        console.log(`   🟢 Connected: ${this.connectedServers.size} servers`);
        console.log(`   📦 Available Community: ${Object.keys(this.communityServers || {}).length} servers`);
        console.log(`   🌐 Available External: ${(this.externalServers || []).length} servers`);
        console.log(`   ⚡ Available Working: ${(this.workingServers || []).length} servers`);
    }

    /**
     * รอรับ input จากผู้ใช้
     */
    async getUserInput(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    /**
     * แสดงสถานะ MCP Servers ทั้งหมด
     */
    async showAllServersStatus() {
        console.clear();
        console.log('\n📊 สถานะ MCP Servers ทั้งหมด'.bold.green);
        console.log('='.repeat(60).cyan);
        
        if (this.connectedServers.size === 0) {
            console.log('\n⚠️  ไม่มี MCP Servers ที่เชื่อมต่ออยู่'.yellow);
        } else {
            console.log('\n🟢 Connected Servers:'.bold.green);
            for (const [serverId, serverInfo] of this.connectedServers) {
                const statusIcon = this.getStatusIcon(serverInfo.status);
                const uptime = this.calculateUptime(serverInfo.startTime || serverInfo.connectTime);
                
                console.log(`\n${statusIcon} ${serverId}`.bold);
                console.log(`   📝 Type: ${serverInfo.type}`);
                console.log(`   🔄 Status: ${serverInfo.status}`);
                console.log(`   ⏱️  Uptime: ${uptime}`);
                
                if (serverInfo.config?.env?.PORT) {
                    console.log(`   🔌 Port: ${serverInfo.config.env.PORT}`);
                }
                if (serverInfo.config?.endpoint) {
                    console.log(`   🌐 Endpoint: ${serverInfo.config.endpoint}`);
                }
                if (serverInfo.config?.category) {
                    console.log(`   📂 Category: ${serverInfo.config.category}`);
                }
            }
        }
        
        console.log('\n📈 สถิติ:'.bold.blue);
        console.log(`   🔗 Total Connected: ${this.connectedServers.size}`);
        console.log(`   🟢 Running: ${Array.from(this.connectedServers.values()).filter(s => s.status === 'running').length}`);
        console.log(`   🔵 Connected: ${Array.from(this.connectedServers.values()).filter(s => s.status === 'connected').length}`);
        console.log(`   🟡 Mock: ${Array.from(this.connectedServers.values()).filter(s => s.status === 'mock').length}`);
        
        await this.getUserInput('\n📱 กด Enter เพื่อกลับไปเมนูหลัก...');
    }

    /**
     * คำนวณ uptime
     */
    calculateUptime(startTime) {
        if (!startTime) return 'Unknown';
        
        const now = new Date();
        const diff = now - new Date(startTime);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    /**
     * รับไอคอนสถานะ
     */
    getStatusIcon(status) {
        const icons = {
            'running': '🟢',
            'connected': '🔵', 
            'mock': '🟡',
            'error': '🔴',
            'stopped': '⚫'
        };
        return icons[status] || '❓';
    }

    /**
     * เชื่อมต่อ Community MCP Servers
     */
    async connectCommunityServers() {
        console.clear();
        console.log('\n🔗 เชื่อมต่อ Community MCP Servers'.bold.green);
        console.log('='.repeat(60).cyan);
        
        const serverNames = Object.keys(this.communityServers || {});
        if (serverNames.length === 0) {
            console.log('\n⚠️  ไม่พบ Community MCP Servers'.yellow);
            await this.getUserInput('\n📱 กด Enter เพื่อกลับไปเมนูหลัก...');
            return;
        }
        
        console.log('\n📋 Community MCP Servers ที่มีอยู่:'.bold.blue);
        serverNames.forEach((name, index) => {
            const config = this.communityServers[name];
            const isConnected = this.connectedServers.has(name);
            const status = isConnected ? '🟢 Connected' : '⚫ Not Connected';
            
            console.log(`${index + 1}. ${name} - ${status}`);
            console.log(`   📂 Category: ${config.env?.MCP_SERVER_CATEGORY || 'Unknown'}`);
            console.log(`   🔌 Port: ${config.env?.PORT || 'Unknown'}`);
        });
        
        console.log('\n🎯 ตัวเลือก:'.bold.yellow);
        console.log('a. เชื่อมต่อทั้งหมด');
        console.log('s. เลือกเชื่อมต่อเฉพาะบางตัว');
        console.log('r. แนะนำ (เชื่อมต่อตัวที่มีประโยชน์)');
        console.log('b. กลับไปเมนูหลัก');
        
        const choice = await this.getUserInput('\n🔤 เลือกตัวเลือก (a/s/r/b): ');
        
        switch (choice.toLowerCase()) {
            case 'a':
                await this.connectMultipleCommunityServers(serverNames);
                break;
            case 's':
                await this.selectCommunityServers(serverNames);
                break;
            case 'r':
                await this.connectRecommendedCommunityServers();
                break;
            case 'b':
                return;
            default:
                console.log('\n❌ ตัวเลือกไม่ถูกต้อง'.red);
                await this.getUserInput('\n📱 กด Enter เพื่อลองใหม่...');
                await this.connectCommunityServers();
        }
    }

    /**
     * เชื่อมต่อ Community Servers ที่แนะนำ
     */
    async connectRecommendedCommunityServers() {
        const recommended = [
            'mcp-servers-kagi',
            'mcp-server-notion',
            'mcp-server-todoist', 
            'mcp-server-linear',
            'mcp-server-obsidian'
        ].filter(name => this.communityServers[name]);
        
        console.log('\n🎯 กำลังเชื่อมต่อ Community Servers ที่แนะนำ...'.bold.green);
        await this.connectMultipleCommunityServers(recommended);
    }

    /**
     * เชื่อมต่อ Community Servers หลายตัว
     */
    async connectMultipleCommunityServers(serverNames) {
        console.log('\n🚀 เริ่มเชื่อมต่อ Community Servers...'.bold.green);
        
        for (const serverName of serverNames) {
            if (this.connectedServers.has(serverName)) {
                console.log(`⚠️  ${serverName} เชื่อมต่ออยู่แล้ว`.yellow);
                continue;
            }
            
            try {
                console.log(`\n🔄 กำลังเชื่อมต่อ ${serverName}...`.blue);
                await this.startCommunityServer(serverName);
                console.log(`✅ ${serverName} เชื่อมต่อสำเร็จ`.green);
            } catch (error) {
                console.log(`❌ ${serverName} เชื่อมต่อไม่สำเร็จ: ${error.message}`.red);
            }
        }
        
        console.log('\n🎉 เชื่อมต่อ Community Servers เสร็จสิ้น!'.bold.green);
        await this.getUserInput('\n📱 กด Enter เพื่อกลับไปเมนูหลัก...');
    }

    /**
     * เริ่มต้น Community Server
     */
    async startCommunityServer(serverName) {
        const config = this.communityServers[serverName];
        if (!config) {
            throw new Error(`ไม่พบการกำหนดค่าสำหรับ ${serverName}`);
        }

        // ตรวจสอบและสร้าง mock server ถ้าจำเป็น
        const serverPath = path.resolve(config.args[0]);
        if (!fs.existsSync(serverPath)) {
            await this.createMockCommunityServer(serverName, config);
        }

        // เริ่มต้น server process
        const process = spawn(config.command, config.args, {
            env: { ...process.env, ...config.env },
            stdio: 'pipe'
        });

        // จัดการ output
        process.stdout.on('data', (data) => {
            console.log(`[${serverName}] ${data.toString().trim()}`.gray);
        });

        process.stderr.on('data', (data) => {
            console.log(`[${serverName}] ERROR: ${data.toString().trim()}`.red);
        });

        process.on('close', (code) => {
            console.log(`[${serverName}] Process exited with code ${code}`.yellow);
            this.serverProcesses.delete(serverName);
            if (this.connectedServers.has(serverName)) {
                this.connectedServers.get(serverName).status = 'stopped';
            }
        });

        this.serverProcesses.set(serverName, process);
        this.connectedServers.set(serverName, {
            type: 'community',
            config,
            process,
            status: 'running',
            startTime: new Date()
        });

        // รอให้ server เริ่มต้นเสร็จ
        await this.waitForServerReady(config.env.PORT);
    }

    /**
     * สร้าง Mock Community Server
     */
    async createMockCommunityServer(serverName, config) {
        const serverDir = path.dirname(path.resolve(config.args[0]));
        
        if (!fs.existsSync(serverDir)) {
            fs.mkdirSync(serverDir, { recursive: true });
        }

        const mockServerContent = this.generateMockServerCode(serverName, config);
        fs.writeFileSync(path.resolve(config.args[0]), mockServerContent);
    }

    /**
     * สร้างโค้ด Mock Server
     */
    generateMockServerCode(serverName, config) {
        return `
const express = require('express');
const cors = require('cors');

class ${serverName.replace(/-/g, '')}MockServer {
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
        this.app.use((req, res, next) => {
            console.log(\`[\${this.name}] \${req.method} \${req.path}\`);
            next();
        });
    }

    setupRoutes() {
        this.app.get(['/', '/health'], (req, res) => {
            res.json({
                status: 'healthy',
                name: this.name,
                category: this.category,
                port: this.port,
                type: 'mock-community-server',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        this.app.get('/tools', (req, res) => {
            res.json({
                tools: this.getAvailableTools()
            });
        });

        this.app.post('/call', (req, res) => {
            const { tool, arguments: args } = req.body;
            res.json({
                success: true,
                result: \`Mock execution of \${tool} with args: \${JSON.stringify(args)}\`,
                server: this.name,
                timestamp: new Date().toISOString()
            });
        });

        this.app.get('/status', (req, res) => {
            res.json({
                server: this.name,
                status: 'running',
                category: this.category,
                tools: this.getAvailableTools().length,
                uptime: process.uptime(),
                memory: process.memoryUsage()
            });
        });
    }

    getAvailableTools() {
        const categoryTools = {
            'search': [
                { name: 'search_web', description: 'Search the web for information' },
                { name: 'search_documents', description: 'Search through documents' }
            ],
            'productivity': [
                { name: 'create_task', description: 'Create a new task' },
                { name: 'update_task', description: 'Update existing task' },
                { name: 'get_tasks', description: 'Get list of tasks' }
            ],
            'notes': [
                { name: 'create_note', description: 'Create a new note' },
                { name: 'update_note', description: 'Update existing note' },
                { name: 'search_notes', description: 'Search through notes' }
            ],
            'project-management': [
                { name: 'create_issue', description: 'Create a new issue' },
                { name: 'update_issue', description: 'Update existing issue' },
                { name: 'get_projects', description: 'Get list of projects' }
            ],
            'default': [
                { name: 'ping', description: 'Test connectivity' },
                { name: 'status', description: 'Get server status' }
            ]
        };
        
        return categoryTools[this.category] || categoryTools.default;
    }

    startServer() {
        this.app.listen(this.port, () => {
            console.log(\`[\${this.name}] Mock server running on port \${this.port}\`);
        });
    }
}

new ${serverName.replace(/-/g, '')}MockServer();
`;
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
     * หยุดการทำงานของ servers ทั้งหมด
     */
    async stopAllServers() {
        console.clear();
        console.log('\n🛑 หยุดการทำงานของ MCP Servers'.bold.red);
        console.log('='.repeat(60).cyan);
        
        if (this.serverProcesses.size === 0) {
            console.log('\n⚠️  ไม่มี servers ที่กำลังทำงานอยู่'.yellow);
        } else {
            console.log('\n🔄 กำลังหยุดการทำงาน...'.blue);
            
            for (const [serverId, process] of this.serverProcesses) {
                try {
                    process.kill('SIGTERM');
                    console.log(`✅ หยุด ${serverId}`.green);
                } catch (error) {
                    console.log(`❌ ไม่สามารถหยุด ${serverId}: ${error.message}`.red);
                }
            }
            
            this.serverProcesses.clear();
            
            // อัปเดตสถานะ
            for (const [serverId, serverInfo] of this.connectedServers) {
                if (serverInfo.type === 'community' || serverInfo.type === 'working') {
                    serverInfo.status = 'stopped';
                }
            }
            
            console.log('\n🎉 หยุดการทำงานเสร็จสิ้น!'.bold.green);
        }
        
        await this.getUserInput('\n📱 กด Enter เพื่อกลับไปเมนูหลัก...');
    }

    /**
     * เรียกใช้เมนูหลัก
     */
    async run() {
        while (true) {
            this.showMainMenu();
            const choice = await this.getUserInput('\n🔤 เลือกตัวเลือก (0-9): ');
            
            switch (choice) {
                case '1':
                    await this.showAllServersStatus();
                    break;
                case '2':
                    await this.connectCommunityServers();
                    break;
                case '3':
                    console.log('\n🚧 External Servers - Coming Soon!'.yellow);
                    await this.getUserInput('\n📱 กด Enter เพื่อกลับไปเมนูหลัก...');
                    break;
                case '4':
                    console.log('\n🚧 Working Servers - Coming Soon!'.yellow);
                    await this.getUserInput('\n📱 กด Enter เพื่อกลับไปเมนูหลัก...');
                    break;
                case '5':
                    console.log('\n🚧 Search & Connect - Coming Soon!'.yellow);
                    await this.getUserInput('\n📱 กด Enter เพื่อกลับไปเมนูหลัก...');
                    break;
                case '6':
                    console.log('\n🚧 Performance Monitor - Coming Soon!'.yellow);
                    await this.getUserInput('\n📱 กด Enter เพื่อกลับไปเมนูหลัก...');
                    break;
                case '7':
                    console.log('\n🚧 Configuration Manager - Coming Soon!'.yellow);
                    await this.getUserInput('\n📱 กด Enter เพื่อกลับไปเมนูหลัก...');
                    break;
                case '8':
                    console.log('\n🚧 Restart Servers - Coming Soon!'.yellow);
                    await this.getUserInput('\n📱 กด Enter เพื่อกลับไปเมนูหลัก...');
                    break;
                case '9':
                    await this.stopAllServers();
                    break;
                case '0':
                    console.log('\n👋 ขอบคุณที่ใช้ MCP Connection Manager!'.bold.green);
                    this.rl.close();
                    process.exit(0);
                    break;
                default:
                    console.log('\n❌ ตัวเลือกไม่ถูกต้อง กรุณาเลือก 0-9'.red);
                    await this.getUserInput('\n📱 กด Enter เพื่อลองใหม่...');
            }
        }
    }
}

// เริ่มต้นโปรแกรม
if (require.main === module) {
    const manager = new MCPConnectionManager();
    manager.run().catch(error => {
        console.error('❌ เกิดข้อผิดพลาด:'.red, error.message);
        process.exit(1);
    });
}

module.exports = MCPConnectionManager;