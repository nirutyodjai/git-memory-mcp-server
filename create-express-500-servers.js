#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

class Express500ServerManager {
    constructor() {
        this.servers = new Map();
        this.targetCount = 500;
        this.batchSize = 10;
        this.delay = 3000;
        this.startPort = 7000;
        this.healthTimeout = 5000;
        this.categories = [
            'web', 'api', 'database', 'filesystem', 'security',
            'monitoring', 'analytics', 'ai-ml', 'cache', 'queue',
            'notification', 'auth', 'logging', 'config', 'backup',
            'search', 'media', 'email', 'chat', 'payment'
        ];
    }

    generateExpressServerScript(name, port, category) {
        return `const express = require('express');
const cors = require('cors');

class ${name.replace(/-/g, '')}ExpressServer {
    constructor() {
        this.name = '${name}';
        this.port = ${port};
        this.category = '${category}';
        this.startTime = Date.now();
        this.requestCount = 0;
        this.app = express();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.startServer();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use((req, res, next) => {
            this.requestCount++;
            next();
        });
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get(['/', '/health'], (req, res) => {
            res.json({
                status: 'healthy',
                name: this.name,
                port: this.port,
                category: this.category,
                uptime: Math.floor((Date.now() - this.startTime) / 1000),
                requests: this.requestCount,
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString(),
                type: 'express-mcp-server'
            });
        });

        // List tools endpoint
        this.app.get('/tools', (req, res) => {
            res.json({
                tools: [
                    {
                        name: \`\${this.category}_operation\`,
                        description: \`Perform \${this.category} operations\`,
                        category: this.category,
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
                        category: 'info',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    }
                ]
            });
        });

        // Call tool endpoint
        this.app.post('/call', (req, res) => {
            const { tool, arguments: args } = req.body;
            
            if (tool === \`\${this.category}_operation\`) {
                res.json({
                    success: true,
                    result: \`\${this.category.toUpperCase()} operation '\${args?.action || 'default'}' completed successfully on \${this.name}\`,
                    server: this.name,
                    category: this.category,
                    timestamp: new Date().toISOString()
                });
            } else if (tool === 'get_server_info') {
                res.json({
                    name: this.name,
                    port: this.port,
                    category: this.category,
                    uptime: Date.now() - this.startTime,
                    requests: this.requestCount,
                    tools: 2,
                    memory: process.memoryUsage()
                });
            } else {
                res.status(400).json({ error: \`Unknown tool: \${tool}\` });
            }
        });

        // Server info endpoint
        this.app.get('/info', (req, res) => {
            res.json({
                server: {
                    name: this.name,
                    port: this.port,
                    category: this.category,
                    type: 'express-mcp-server',
                    version: '1.0.0'
                },
                stats: {
                    uptime: Math.floor((Date.now() - this.startTime) / 1000),
                    requests: this.requestCount,
                    startTime: new Date(this.startTime).toISOString(),
                    memory: process.memoryUsage()
                },
                endpoints: [
                    { path: '/', method: 'GET', description: 'Health check' },
                    { path: '/health', method: 'GET', description: 'Health status' },
                    { path: '/tools', method: 'GET', description: 'List available tools' },
                    { path: '/call', method: 'POST', description: 'Call a tool' },
                    { path: '/info', method: 'GET', description: 'Server information' }
                ]
            });
        });

        // Error handling
        this.app.use((err, req, res, next) => {
            console.error(\`[\${this.name}] Error:\`, err.message);
            res.status(500).json({ error: 'Internal server error' });
        });
    }

    startServer() {
        const server = this.app.listen(this.port, () => {
            console.log(\`[\${this.name}] Express server running on port \${this.port}\`);
        });
        
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(\`[\${this.name}] Port \${this.port} is already in use\`);
                process.exit(1);
            } else {
                console.error(\`[\${this.name}] Server error:\`, err.message);
            }
        });
    }
}

const server = new ${name.replace(/-/g, '')}ExpressServer();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(\`[\${server.name}] Shutting down gracefully...\`);
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(\`[\${server.name}] Received SIGTERM, shutting down...\`);
    process.exit(0);
});
`;
    }

    async createServer(name, port, category) {
        const serverPath = path.join(__dirname, `express-servers`, `${name}.js`);
        
        // สร้าง directory ถ้าไม่มี
        const serverDir = path.dirname(serverPath);
        if (!fs.existsSync(serverDir)) {
            fs.mkdirSync(serverDir, { recursive: true });
        }
        
        try {
            const script = this.generateExpressServerScript(name, port, category);
            fs.writeFileSync(serverPath, script);
            
            console.log(`📝 Created script: ${name}.js`);
            
            // เริ่ม server process
            const serverProcess = spawn('node', [serverPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                detached: false,
                cwd: __dirname
            });
            
            let serverStarted = false;
            let errorOccurred = false;
            
            serverProcess.stdout.on('data', (data) => {
                const message = data.toString().trim();
                if (message.includes('Express server running')) {
                    serverStarted = true;
                    console.log(`✅ ${name} started successfully on port ${port}`);
                }
            });
            
            serverProcess.stderr.on('data', (data) => {
                const message = data.toString().trim();
                if (!message.includes('Debugger') && !message.includes('ExperimentalWarning')) {
                    console.log(`❌ ${name} ERROR: ${message}`);
                    errorOccurred = true;
                }
            });
            
            serverProcess.on('exit', (code) => {
                if (code !== 0) {
                    console.log(`❌ ${name} exited with code ${code}`);
                    errorOccurred = true;
                }
            });
            
            // รอให้ server เริ่มทำงาน
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (errorOccurred) {
                return false;
            }
            
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
            
            const req = http.get(`http://localhost:${port}/health`, (res) => {
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
        console.log(`\n🎯 Creating batch starting from server ${startIndex + 1}...`);
        
        const results = [];
        
        // สร้าง servers ทีละตัวเพื่อความเสถียร
        for (let i = 0; i < batchSize && (startIndex + i) < this.targetCount; i++) {
            const serverIndex = startIndex + i;
            const category = this.categories[serverIndex % this.categories.length];
            const name = `express-mcp-${category}-${this.startPort + serverIndex}`;
            const port = this.startPort + serverIndex;
            
            console.log(`📦 Creating ${name} on port ${port}...`);
            const success = await this.createServer(name, port, category);
            results.push(success);
            
            // หน่วงเวลาเล็กน้อยระหว่างการสร้าง server แต่ละตัว
            if (i < batchSize - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        const successCount = results.filter(r => r).length;
        return successCount;
    }

    async createAllServers() {
        console.log(`🚀 Starting creation of ${this.targetCount} Express MCP servers...`);
        console.log(`📦 Batch size: ${this.batchSize}, Delay: ${this.delay}ms`);
        console.log(`🔌 Port range: ${this.startPort}-${this.startPort + this.targetCount - 1}`);
        console.log(`📂 Server files will be saved in: express-servers/`);
        
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
            
            console.log(`✅ Batch ${batchNumber} completed: ${created}/${Math.min(this.batchSize, this.targetCount - i)} servers started`);
            console.log(`📈 Total progress: ${totalCreated}/${this.targetCount} servers (${progress}%)`);
            console.log(`⏱️  Elapsed time: ${elapsed}s`);
            
            if (totalCreated > 0) {
                const avgTimePerServer = elapsed / totalCreated;
                const estimatedRemaining = Math.floor((this.targetCount - totalCreated) * avgTimePerServer);
                console.log(`🔮 Estimated time remaining: ${estimatedRemaining}s`);
            }
            
            // หยุดถ้าไม่มี server ใดสำเร็จใน 3 batch แรก
            if (batchNumber >= 3 && totalCreated === 0) {
                console.log(`\n❌ No servers created after 3 batches. Stopping...`);
                break;
            }
            
            if (i + this.batchSize < this.targetCount) {
                console.log(`⏳ Waiting ${this.delay}ms before next batch...`);
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

    async testRandomServers(count = 10) {
        console.log(`\n🧪 Testing ${count} random servers...`);
        const serverList = Array.from(this.servers.values());
        const testServers = serverList.slice(0, Math.min(count, serverList.length));
        
        let healthyCount = 0;
        
        for (const server of testServers) {
            const isHealthy = await this.checkServerHealth(server.port, `test-${server.port}`);
            if (isHealthy) {
                healthyCount++;
                console.log(`✅ Port ${server.port} (${server.category}) - Healthy`);
            } else {
                console.log(`❌ Port ${server.port} (${server.category}) - Not responding`);
            }
        }
        
        console.log(`\n📊 Test results: ${healthyCount}/${testServers.length} servers healthy (${((healthyCount / testServers.length) * 100).toFixed(1)}%)`);
        return healthyCount;
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
const manager = new Express500ServerManager();

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
    console.log(`   Total servers created: ${created}`);
    console.log(`   Running servers: ${manager.servers.size}`);
    
    const categories = {};
    const ports = [];
    
    for (const server of manager.servers.values()) {
        if (!categories[server.category]) {
            categories[server.category] = 0;
        }
        categories[server.category]++;
        ports.push(server.port);
    }
    
    console.log(`   Categories:`, categories);
    
    if (ports.length > 0) {
        console.log(`   Port range: ${Math.min(...ports)}-${Math.max(...ports)}`);
    }
    
    console.log(`\n🎯 Target achieved: ${created >= 500 ? '✅' : '❌'} (${created}/500)`);
    
    if (created >= 50) {
        console.log(`\n🎊 Great progress! Successfully created ${created} Express MCP servers!`);
        
        // ทดสอบ servers แบบสุ่ม
        await manager.testRandomServers(Math.min(10, created));
    }
    
}).catch(async (error) => {
    console.error('❌ Error during server creation:', error);
    await manager.shutdown();
});