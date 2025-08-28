#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

class EfficientMCP500Manager {
    constructor() {
        this.servers = new Map();
        this.targetCount = 500;
        this.batchSize = 10; // ลด batch size เพื่อความเสถียร
        this.delay = 3000; // เพิ่มเวลารอ
        this.startPort = 5000; // เปลี่ยน port range
        this.healthTimeout = 5000; // เพิ่มเวลา timeout
        this.categories = [
            'web', 'api', 'database', 'filesystem', 'security',
            'monitoring', 'analytics', 'ai-ml', 'cache', 'queue',
            'notification', 'auth', 'logging', 'config', 'backup',
            'search', 'media', 'email', 'chat', 'payment'
        ];
    }

    generateServerScript(name, port, category) {
        return `#!/usr/bin/env node

const http = require('http');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

class ${name.replace(/-/g, '')}Server {
    constructor() {
        this.name = '${name}';
        this.port = ${port};
        this.category = '${category}';
        this.startTime = Date.now();
        this.requestCount = 0;
        
        this.server = new Server({
            name: this.name,
            version: '1.0.0'
        }, {
            capabilities: {
                tools: {},
                resources: {}
            }
        });
        
        this.setupHandlers();
        this.startHealthServer();
    }

    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: '${category}_operation',
                    description: 'Perform ${category} operations for ${name}',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            action: { type: 'string', description: 'Action to perform' },
                            data: { type: 'object', description: 'Data for the action' }
                        },
                        required: ['action']
                    }
                },
                {
                    name: 'get_server_info',
                    description: 'Get server information',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                        required: []
                    }
                }
            ]
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            this.requestCount++;
            
            if (name === '${category}_operation') {
                return {
                    content: [{
                        type: 'text',
                        text: \`${category.toUpperCase()} operation '\${args.action}' completed successfully on \${this.name}\`
                    }]
                };
            }
            
            if (name === 'get_server_info') {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            name: this.name,
                            port: this.port,
                            category: this.category,
                            uptime: Date.now() - this.startTime,
                            requests: this.requestCount
                        }, null, 2)
                    }]
                };
            }
            
            throw new Error(\`Unknown tool: \${name}\`);
        });
    }

    startHealthServer() {
        const healthServer = http.createServer((req, res) => {
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            
            const healthData = {
                status: 'healthy',
                name: this.name,
                port: this.port,
                category: this.category,
                uptime: Math.floor((Date.now() - this.startTime) / 1000),
                requests: this.requestCount,
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            };
            
            res.end(JSON.stringify(healthData, null, 2));
        });
        
        healthServer.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(\`[\${this.name}] Port \${this.port} is already in use\`);
                process.exit(1);
            }
        });
        
        healthServer.listen(this.port, () => {
            console.log(\`[\${this.name}] Health server running on port \${this.port}\`);
        });
    }

    async run() {
        try {
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            console.log(\`[\${this.name}] MCP Server connected via stdio\`);
        } catch (error) {
            console.error(\`[\${this.name}] Failed to start MCP server:\`, error.message);
        }
    }
}

const server = new ${name.replace(/-/g, '')}Server();
server.run().catch(console.error);

// Keep process alive
process.on('SIGINT', () => {
    console.log(\`[\${server.name}] Shutting down gracefully...\`);
    process.exit(0);
});
`;
    }

    async createServer(name, port, category) {
        const serverPath = path.join(__dirname, `servers`, `${name}.js`);
        
        // สร้าง directory ถ้าไม่มี
        const serverDir = path.dirname(serverPath);
        if (!fs.existsSync(serverDir)) {
            fs.mkdirSync(serverDir, { recursive: true });
        }
        
        try {
            const script = this.generateServerScript(name, port, category);
            fs.writeFileSync(serverPath, script);
            console.log(`📝 Created ${name} script`);
            
            // เริ่ม server process
            const serverProcess = spawn('node', [serverPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                detached: false,
                cwd: __dirname
            });
            
            let serverStarted = false;
            
            serverProcess.stdout.on('data', (data) => {
                const message = data.toString().trim();
                if (message.includes('Health server running')) {
                    serverStarted = true;
                }
                console.log(`[${name}] ${message}`);
            });
            
            serverProcess.stderr.on('data', (data) => {
                const message = data.toString().trim();
                if (!message.includes('Debugger') && !message.includes('ExperimentalWarning')) {
                    console.log(`[${name}] ERROR: ${message}`);
                }
            });
            
            serverProcess.on('exit', (code) => {
                if (code !== 0) {
                    console.log(`[${name}] Process exited with code ${code}`);
                }
            });
            
            // รอให้ server เริ่มทำงาน
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // ตรวจสอบ health
            const isHealthy = await this.checkServerHealth(port, name);
            if (isHealthy) {
                this.servers.set(name, {
                    process: serverProcess,
                    port: port,
                    category: category,
                    status: 'running',
                    startTime: Date.now()
                });
                console.log(`✅ ${name} started successfully on port ${port}`);
                return true;
            } else {
                console.log(`❌ ${name} failed health check`);
                if (!serverProcess.killed) {
                    serverProcess.kill('SIGTERM');
                }
                return false;
            }
        } catch (error) {
            console.error(`❌ Failed to create ${name}:`, error.message);
            return false;
        }
    }

    async checkServerHealth(port, name) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve(false);
            }, this.healthTimeout);
            
            const req = http.get(`http://localhost:${port}`, (res) => {
                clearTimeout(timeout);
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response.status === 'healthy');
                    } catch {
                        resolve(false);
                    }
                });
            });
            
            req.on('error', () => {
                clearTimeout(timeout);
                resolve(false);
            });
            
            req.setTimeout(this.healthTimeout, () => {
                req.destroy();
                clearTimeout(timeout);
                resolve(false);
            });
        });
    }

    async createBatch(startIndex, batchSize) {
        console.log(`\n🔄 Creating batch starting from server ${startIndex + 1}...`);
        const results = [];
        
        // สร้าง servers ทีละตัวเพื่อความเสถียร
        for (let i = 0; i < batchSize && (startIndex + i) < this.targetCount; i++) {
            const serverIndex = startIndex + i;
            const category = this.categories[serverIndex % this.categories.length];
            const name = `mcp-server-${category}-${this.startPort + serverIndex}`;
            const port = this.startPort + serverIndex;
            
            console.log(`\n📦 Creating server ${serverIndex + 1}/${this.targetCount}: ${name}`);
            const success = await this.createServer(name, port, category);
            results.push(success);
            
            if (success) {
                console.log(`✅ Server ${serverIndex + 1} created successfully`);
            } else {
                console.log(`❌ Server ${serverIndex + 1} failed to start`);
            }
            
            // รอระหว่างการสร้าง server แต่ละตัว
            if (i < batchSize - 1 && (startIndex + i + 1) < this.targetCount) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        const successCount = results.filter(r => r).length;
        console.log(`\n📊 Batch completed: ${successCount}/${results.length} servers started`);
        return successCount;
    }

    async createAllServers() {
        console.log(`🚀 Starting creation of ${this.targetCount} MCP servers...`);
        console.log(`📦 Batch size: ${this.batchSize}, Delay: ${this.delay}ms`);
        console.log(`🔌 Port range: ${this.startPort}-${this.startPort + this.targetCount - 1}`);
        
        let totalCreated = 0;
        const startTime = Date.now();
        
        for (let i = 0; i < this.targetCount; i += this.batchSize) {
            const batchNumber = Math.floor(i / this.batchSize) + 1;
            const totalBatches = Math.ceil(this.targetCount / this.batchSize);
            
            console.log(`\n🎯 === BATCH ${batchNumber}/${totalBatches} ===`);
            
            const created = await this.createBatch(i, this.batchSize);
            totalCreated += created;
            
            const progress = ((totalCreated / this.targetCount) * 100).toFixed(1);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            
            console.log(`\n📈 Progress: ${totalCreated}/${this.targetCount} servers created (${progress}%)`);
            console.log(`⏱️  Elapsed time: ${elapsed}s`);
            
            if (totalCreated > 0) {
                const avgTimePerServer = elapsed / totalCreated;
                const estimatedRemaining = Math.floor((this.targetCount - totalCreated) * avgTimePerServer);
                console.log(`🔮 Estimated time remaining: ${estimatedRemaining}s`);
            }
            
            if (i + this.batchSize < this.targetCount) {
                console.log(`\n⏳ Waiting ${this.delay}ms before next batch...`);
                await new Promise(resolve => setTimeout(resolve, this.delay));
            }
        }
        
        const totalTime = Math.floor((Date.now() - startTime) / 1000);
        
        console.log(`\n🎉 Server creation completed!`);
        console.log(`📊 Total servers created: ${totalCreated}/${this.targetCount}`);
        console.log(`✅ Success rate: ${((totalCreated / this.targetCount) * 100).toFixed(1)}%`);
        console.log(`⏱️  Total time: ${totalTime}s`);
        
        if (totalCreated > 0) {
            console.log(`📊 Average time per server: ${(totalTime / totalCreated).toFixed(2)}s`);
        }
        
        return totalCreated;
    }

    async getSystemStats() {
        const stats = {
            total: this.servers.size,
            running: 0,
            healthy: 0,
            categories: {},
            ports: []
        };
        
        for (const [name, server] of this.servers) {
            if (server.status === 'running') {
                stats.running++;
                stats.ports.push(server.port);
                
                // ตรวจสอบ health
                const isHealthy = await this.checkServerHealth(server.port, name);
                if (isHealthy) {
                    stats.healthy++;
                }
            }
            
            if (!stats.categories[server.category]) {
                stats.categories[server.category] = 0;
            }
            stats.categories[server.category]++;
        }
        
        return stats;
    }

    async shutdown() {
        console.log('\n🛑 Shutting down all servers...');
        let shutdownCount = 0;
        
        for (const [name, server] of this.servers) {
            if (server.process && !server.process.killed) {
                server.process.kill('SIGTERM');
                console.log(`🔴 Stopped ${name}`);
                shutdownCount++;
            }
        }
        
        console.log(`🔴 Shutdown completed: ${shutdownCount} servers stopped`);
    }
}

// เริ่มการทำงาน
const manager = new EfficientMCP500Manager();

process.on('SIGINT', async () => {
    await manager.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await manager.shutdown();
    process.exit(0);
});

manager.createAllServers().then(async (created) => {
    console.log(`\n📋 Final Statistics:`);
    const stats = await manager.getSystemStats();
    console.log(`   Total: ${stats.total}`);
    console.log(`   Running: ${stats.running}`);
    console.log(`   Healthy: ${stats.healthy}`);
    console.log(`   Categories:`, stats.categories);
    console.log(`   Port range: ${Math.min(...stats.ports)}-${Math.max(...stats.ports)}`);
    
    console.log(`\n🎯 Target achieved: ${created >= 500 ? '✅' : '❌'} (${created}/500)`);
    
    if (created >= 100) {
        console.log(`\n🎊 Congratulations! Successfully created ${created} MCP servers!`);
    }
    
}).catch(async (error) => {
    console.error('❌ Error during server creation:', error);
    await manager.shutdown();
});