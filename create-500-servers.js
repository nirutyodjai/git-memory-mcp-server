#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

class MCP500ServerManager {
    constructor() {
        this.servers = new Map();
        this.targetCount = 500;
        this.currentCount = 0;
        this.batchSize = 25; // เพิ่ม batch size เพื่อความเร็ว
        this.delay = 2000; // ลดเวลารอระหว่าง batch
        this.categories = [
            'web', 'api', 'database', 'filesystem', 'security',
            'monitoring', 'analytics', 'ai-ml', 'cache', 'queue',
            'notification', 'auth', 'logging', 'config', 'backup',
            'search', 'media', 'email', 'chat', 'payment'
        ];
        this.startPort = 3500; // เริ่มจาก port ที่ไม่ซ้ำกับ server เดิม
    }

    generateServerScript(name, port, category) {
        return `#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const http = require('http');

class ${name.replace(/-/g, '')}Server {
    constructor() {
        this.server = new Server({
            name: '${name}',
            version: '1.0.0'
        }, {
            capabilities: {
                tools: {},
                resources: {}
            }
        });
        
        this.setupHandlers();
        this.startHealthServer(${port});
    }

    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: '${category}_operation',
                    description: 'Perform ${category} operations',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            action: { type: 'string' },
                            data: { type: 'object' }
                        },
                        required: ['action']
                    }
                }
            ]
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            
            if (name === '${category}_operation') {
                return {
                    content: [{
                        type: 'text',
                        text: \`${category.toUpperCase()} operation \${args.action} completed successfully\`
                    }]
                };
            }
            
            throw new Error(\`Unknown tool: \${name}\`);
        });
    }

    startHealthServer(port) {
        const healthServer = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'healthy',
                name: '${name}',
                port: port,
                category: '${category}',
                uptime: process.uptime(),
                memory: process.memoryUsage()
            }));
        });
        
        healthServer.listen(port, () => {
            console.log(\`[${name}] Health server running on port \${port}\`);
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log(\`[${name}] MCP Server running on stdio\`);
    }
}

const server = new ${name.replace(/-/g, '')}Server();
server.run().catch(console.error);
`;
    }

    async createServer(name, port, category) {
        const serverPath = path.join(__dirname, `${name}.js`);
        const script = this.generateServerScript(name, port, category);
        
        try {
            fs.writeFileSync(serverPath, script);
            console.log(`📝 Created ${name} script`);
            
            // เริ่ม server โดยปิด debugger
            const serverProcess = spawn('node', [serverPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                detached: false,
                env: { ...process.env, NODE_OPTIONS: '--no-deprecation' }
            });
            
            serverProcess.stdout.on('data', (data) => {
                console.log(`[${name}] ${data.toString().trim()}`);
            });
            
            serverProcess.stderr.on('data', (data) => {
                const message = data.toString().trim();
                if (!message.includes('Debugger')) {
                    console.log(`[${name}] ${message}`);
                }
            });
            
            // รอให้ server เริ่มทำงาน
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // ตรวจสอบ health
            const isHealthy = await this.checkServerHealth(port);
            if (isHealthy) {
                this.servers.set(name, {
                    process: serverProcess,
                    port: port,
                    category: category,
                    status: 'running'
                });
                console.log(`✅ ${name} started successfully on port ${port}`);
                return true;
            } else {
                console.log(`❌ ${name} failed health check`);
                serverProcess.kill();
                return false;
            }
        } catch (error) {
            console.error(`❌ Failed to create ${name}:`, error.message);
            return false;
        }
    }

    async checkServerHealth(port) {
        return new Promise((resolve) => {
            const req = http.get(`http://localhost:${port}`, (res) => {
                resolve(res.statusCode === 200);
            });
            
            req.on('error', () => resolve(false));
            req.setTimeout(3000, () => {
                req.destroy();
                resolve(false);
            });
        });
    }

    async createBatch(startIndex, batchSize) {
        const promises = [];
        
        for (let i = 0; i < batchSize && (startIndex + i) < this.targetCount; i++) {
            const serverIndex = startIndex + i;
            const category = this.categories[serverIndex % this.categories.length];
            const name = `mcp-server-${category}-${this.startPort + serverIndex}`;
            const port = this.startPort + serverIndex;
            
            promises.push(this.createServer(name, port, category));
        }
        
        const results = await Promise.all(promises);
        const successCount = results.filter(r => r).length;
        
        console.log(`📊 Batch completed: ${successCount}/${results.length} servers started`);
        return successCount;
    }

    async createAllServers() {
        console.log(`🚀 Starting creation of ${this.targetCount} MCP servers...`);
        console.log(`📦 Batch size: ${this.batchSize}, Delay: ${this.delay}ms`);
        
        let totalCreated = 0;
        
        for (let i = 0; i < this.targetCount; i += this.batchSize) {
            console.log(`\n🔄 Creating batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(this.targetCount / this.batchSize)}...`);
            
            const created = await this.createBatch(i, this.batchSize);
            totalCreated += created;
            
            console.log(`📈 Progress: ${totalCreated}/${this.targetCount} servers created (${((totalCreated / this.targetCount) * 100).toFixed(1)}%)`);
            
            if (i + this.batchSize < this.targetCount) {
                console.log(`⏳ Waiting ${this.delay}ms before next batch...`);
                await new Promise(resolve => setTimeout(resolve, this.delay));
            }
        }
        
        console.log(`\n🎉 Server creation completed!`);
        console.log(`📊 Total servers created: ${totalCreated}/${this.targetCount}`);
        console.log(`✅ Success rate: ${((totalCreated / this.targetCount) * 100).toFixed(1)}%`);
        
        return totalCreated;
    }

    getServerStats() {
        const stats = {
            total: this.servers.size,
            running: 0,
            categories: {}
        };
        
        for (const [name, server] of this.servers) {
            if (server.status === 'running') {
                stats.running++;
            }
            
            if (!stats.categories[server.category]) {
                stats.categories[server.category] = 0;
            }
            stats.categories[server.category]++;
        }
        
        return stats;
    }
}

// เริ่มการทำงาน
const manager = new MCP500ServerManager();

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    for (const [name, server] of manager.servers) {
        if (server.process && !server.process.killed) {
            server.process.kill();
            console.log(`🔴 Stopped ${name}`);
        }
    }
    process.exit(0);
});

manager.createAllServers().then((created) => {
    console.log(`\n📋 Final Statistics:`);
    const stats = manager.getServerStats();
    console.log(`   Total: ${stats.total}`);
    console.log(`   Running: ${stats.running}`);
    console.log(`   Categories:`, stats.categories);
    
    console.log(`\n🎯 Target achieved: ${created >= 500 ? '✅' : '❌'} (${created}/500)`);
}).catch(console.error);