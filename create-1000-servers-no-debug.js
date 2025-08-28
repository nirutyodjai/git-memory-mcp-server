#!/usr/bin/env node

/**
 * Git Memory MCP Server Creator - 1000 Servers (No Debug)
 * สร้าง MCP servers จำนวน 1000 ตัวโดยไม่เปิด debugger
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// กำหนดค่าพื้นฐาน
const BASE_PORT = 3500;
const TOTAL_SERVERS = 1000;
const SERVERS_DIR = path.join(__dirname, 'servers');
const BATCH_SIZE = 50; // สร้างทีละ 50 servers

// หมวดหมู่ servers
const SERVER_CATEGORIES = {
    'ai-ml': { count: 200, prefix: 'ai-ml' },
    'data-analysis': { count: 200, prefix: 'data' },
    'web-dev': { count: 200, prefix: 'web' },
    'general': { count: 200, prefix: 'gen' },
    'code-management': { count: 50, prefix: 'code' },
    'design-tools': { count: 50, prefix: 'design' },
    'browser-automation': { count: 50, prefix: 'browser' },
    'version-control': { count: 50, prefix: 'git' }
};

class ServerCreator {
    constructor() {
        this.createdServers = [];
        this.runningProcesses = new Map();
        this.currentBatch = 0;
    }

    async init() {
        console.log('🚀 เริ่มสร้าง 1000 MCP Servers (No Debug Mode)');
        console.log('=' .repeat(60));
        
        // สร้างโฟลเดอร์ servers
        if (!fs.existsSync(SERVERS_DIR)) {
            fs.mkdirSync(SERVERS_DIR, { recursive: true });
        }

        await this.createAllServers();
    }

    async createAllServers() {
        let serverIndex = 0;
        
        for (const [category, config] of Object.entries(SERVER_CATEGORIES)) {
            console.log(`\n📂 สร้าง ${category} servers (${config.count} ตัว)`);
            
            for (let i = 0; i < config.count; i++) {
                const port = BASE_PORT + serverIndex;
                const name = `${config.prefix}-${String(i + 1).padStart(3, '0')}`;
                
                await this.createServer(name, port, category);
                serverIndex++;
                
                // สร้างทีละ batch
                if (serverIndex % BATCH_SIZE === 0) {
                    this.currentBatch++;
                    console.log(`✅ Batch ${this.currentBatch} เสร็จสิ้น (${serverIndex}/${TOTAL_SERVERS})`);
                    await this.delay(2000); // หน่วงเวลา 2 วินาที
                }
            }
        }
        
        console.log('\n🎉 สร้าง servers ทั้งหมดเสร็จสิ้น!');
        console.log(`📊 สรุป: สร้าง ${this.createdServers.length} servers`);
        
        // แสดงสถิติ
        this.showStatistics();
    }

    async createServer(name, port, category) {
        try {
            // สร้างโฟลเดอร์สำหรับ server
            const serverDir = path.join(SERVERS_DIR, name);
            if (!fs.existsSync(serverDir)) {
                fs.mkdirSync(serverDir, { recursive: true });
            }

            // สร้างไฟล์ server
            const serverPath = path.join(serverDir, `${name}.js`);
            const serverContent = this.generateServerContent(name, port, category);
            
            fs.writeFileSync(serverPath, serverContent);
            console.log(`📝 Created ${name} script`);
            
            // เริ่ม server โดยไม่เปิด debugger
            const serverProcess = spawn('node', [serverPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                detached: false,
                env: { 
                    ...process.env, 
                    NODE_OPTIONS: '--max-old-space-size=512 --no-deprecation --disable-proto=delete',
                    NODE_NO_WARNINGS: '1'
                }
            });

            // จัดการ output
            serverProcess.stdout.on('data', (data) => {
                const output = data.toString().trim();
                if (output && !output.includes('Debugger')) {
                    console.log(`[${name}] ${output}`);
                }
            });

            serverProcess.stderr.on('data', (data) => {
                const error = data.toString().trim();
                if (error && !error.includes('Debugger') && !error.includes('inspector')) {
                    console.error(`[${name}] ERROR: ${error}`);
                }
            });

            serverProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error(`[${name}] Process exited with code ${code}`);
                }
                this.runningProcesses.delete(name);
            });

            // เก็บข้อมูล process
            this.runningProcesses.set(name, {
                process: serverProcess,
                port,
                category,
                startTime: new Date()
            });

            this.createdServers.push({ name, port, category });
            
        } catch (error) {
            console.error(`❌ Error creating server ${name}:`, error.message);
        }
    }

    generateServerContent(name, port, category) {
        return `#!/usr/bin/env node

/**
 * ${name} - MCP Server (${category})
 * Port: ${port}
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

class ${name.replace(/-/g, '_').toUpperCase()}Server {
    constructor() {
        this.server = new Server(
            {
                name: '${name}',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );
        
        this.setupToolHandlers();
        this.startHealthServer();
    }

    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: '${category}_tool',
                        description: 'Tool for ${category} operations',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                action: {
                                    type: 'string',
                                    description: 'Action to perform'
                                }
                            },
                            required: ['action']
                        }
                    }
                ]
            };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name: toolName, arguments: args } = request.params;
            
            if (toolName === '${category}_tool') {
                return {
                    content: [
                        {
                            type: 'text',
                            text: \`${name} executed action: \${args.action}\`
                        }
                    ]
                };
            }
            
            throw new Error(\`Unknown tool: \${toolName}\`);
        });
    }

    startHealthServer() {
        const healthServer = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                status: 'healthy', 
                server: '${name}',
                port: ${port},
                category: '${category}',
                timestamp: new Date().toISOString()
            }));
        });

        healthServer.listen(${port}, () => {
            console.log(\`${name} health server running on port ${port}\`);
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log(\`${name} MCP server running\`);
    }
}

const server = new ${name.replace(/-/g, '_').toUpperCase()}Server();
server.run().catch(console.error);
`;
    }

    showStatistics() {
        console.log('\n📊 สถิติการสร้าง servers:');
        console.log('=' .repeat(40));
        
        const stats = {};
        this.createdServers.forEach(server => {
            stats[server.category] = (stats[server.category] || 0) + 1;
        });
        
        Object.entries(stats).forEach(([category, count]) => {
            console.log(`${category}: ${count} servers`);
        });
        
        console.log(`\n🔥 Total: ${this.createdServers.length} servers`);
        console.log(`🏃‍♂️ Running processes: ${this.runningProcesses.size}`);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// เริ่มการทำงาน
const creator = new ServerCreator();
creator.init().catch(console.error);

// จัดการการปิดโปรแกรม
process.on('SIGINT', () => {
    console.log('\n🛑 กำลังปิด servers...');
    creator.runningProcesses.forEach((serverInfo, name) => {
        serverInfo.process.kill();
    });
    process.exit(0);
});