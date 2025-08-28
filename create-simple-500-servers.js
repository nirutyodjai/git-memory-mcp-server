#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

class Simple500ServerManager {
    constructor() {
        this.servers = new Map();
        this.targetCount = 500;
        this.batchSize = 15; // เพิ่ม batch size
        this.delay = 2000; // ลดเวลารอ
        this.startPort = 6000; // เปลี่ยน port range ใหม่
        this.healthTimeout = 3000;
        this.categories = [
            'web', 'api', 'database', 'filesystem', 'security',
            'monitoring', 'analytics', 'ai-ml', 'cache', 'queue',
            'notification', 'auth', 'logging', 'config', 'backup',
            'search', 'media', 'email', 'chat', 'payment'
        ];
    }

    generateSimpleServerScript(name, port, category) {
        return `#!/usr/bin/env node

const http = require('http');
const url = require('url');

class ${name.replace(/-/g, '')}SimpleServer {
    constructor() {
        this.name = '${name}';
        this.port = ${port};
        this.category = '${category}';
        this.startTime = Date.now();
        this.requestCount = 0;
        this.tools = [
            {
                name: '${category}_operation',
                description: 'Perform ${category} operations',
                category: '${category}'
            },
            {
                name: 'get_server_info',
                description: 'Get server information',
                category: 'info'
            }
        ];
        
        this.startServer();
    }

    startServer() {
        const server = http.createServer((req, res) => {
            this.requestCount++;
            
            // CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.setHeader('Content-Type', 'application/json');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;
            
            try {
                if (pathname === '/' || pathname === '/health') {
                    this.handleHealth(req, res);
                } else if (pathname === '/tools') {
                    this.handleListTools(req, res);
                } else if (pathname === '/call') {
                    this.handleCallTool(req, res);
                } else if (pathname === '/info') {
                    this.handleServerInfo(req, res);
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Not found' }));
                }
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(\`[\${this.name}] Port \${this.port} is already in use\`);
                process.exit(1);
            } else {
                console.error(\`[\${this.name}] Server error:\`, err.message);
            }
        });
        
        server.listen(this.port, () => {
            console.log(\`[\${this.name}] Simple HTTP server running on port \${this.port}\`);
        });
    }

    handleHealth(req, res) {
        const healthData = {
            status: 'healthy',
            name: this.name,
            port: this.port,
            category: this.category,
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            requests: this.requestCount,
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
            type: 'simple-mcp-server'
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(healthData, null, 2));
    }

    handleListTools(req, res) {
        const response = {
            tools: this.tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                category: tool.category,
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: { type: 'string', description: 'Action to perform' },
                        data: { type: 'object', description: 'Data for the action' }
                    },
                    required: ['action']
                }
            }))
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(response, null, 2));
    }

    handleCallTool(req, res) {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const { tool, arguments: args } = JSON.parse(body || '{}');
                
                if (tool === '${category}_operation') {
                    const result = {
                        success: true,
                        result: \`${category.toUpperCase()} operation '\${args?.action || 'default'}' completed successfully on \${this.name}\`,
                        server: this.name,
                        category: this.category,
                        timestamp: new Date().toISOString()
                    };
                    
                    res.writeHead(200);
                    res.end(JSON.stringify(result, null, 2));
                } else if (tool === 'get_server_info') {
                    const info = {
                        name: this.name,
                        port: this.port,
                        category: this.category,
                        uptime: Date.now() - this.startTime,
                        requests: this.requestCount,
                        tools: this.tools.length,
                        memory: process.memoryUsage()
                    };
                    
                    res.writeHead(200);
                    res.end(JSON.stringify(info, null, 2));
                } else {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: \`Unknown tool: \${tool}\` }));
                }
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            }
        });
    }

    handleServerInfo(req, res) {
        const info = {
            server: {
                name: this.name,
                port: this.port,
                category: this.category,
                type: 'simple-mcp-server',
                version: '1.0.0'
            },
            stats: {
                uptime: Math.floor((Date.now() - this.startTime) / 1000),
                requests: this.requestCount,
                startTime: new Date(this.startTime).toISOString(),
                memory: process.memoryUsage()
            },
            tools: this.tools,
            endpoints: [
                { path: '/', method: 'GET', description: 'Health check' },
                { path: '/health', method: 'GET', description: 'Health status' },
                { path: '/tools', method: 'GET', description: 'List available tools' },
                { path: '/call', method: 'POST', description: 'Call a tool' },
                { path: '/info', method: 'GET', description: 'Server information' }
            ]
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(info, null, 2));
    }
}

const server = new ${name.replace(/-/g, '')}SimpleServer();

// Keep process alive
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
        const serverPath = path.join(__dirname, `simple-servers`, `${name}.js`);
        
        // สร้าง directory ถ้าไม่มี
        const serverDir = path.dirname(serverPath);
        if (!fs.existsSync(serverDir)) {
            fs.mkdirSync(serverDir, { recursive: true });
        }
        
        try {
            const script = this.generateSimpleServerScript(name, port, category);
            fs.writeFileSync(serverPath, script);
            
            // เริ่ม server process
            const serverProcess = spawn('node', [serverPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                detached: false,
                cwd: __dirname
            });
            
            let serverStarted = false;
            
            serverProcess.stdout.on('data', (data) => {
                const message = data.toString().trim();
                if (message.includes('Simple HTTP server running')) {
                    serverStarted = true;
                }
                // ลด log output
                if (this.servers.size < 10) {
                    console.log(`[${name}] ${message}`);
                }
            });
            
            serverProcess.stderr.on('data', (data) => {
                const message = data.toString().trim();
                if (!message.includes('Debugger') && !message.includes('ExperimentalWarning')) {
                    console.log(`[${name}] ERROR: ${message}`);
                }
            });
            
            serverProcess.on('exit', (code) => {
                if (code !== 0 && this.servers.size < 10) {
                    console.log(`[${name}] Process exited with code ${code}`);
                }
            });
            
            // รอให้ server เริ่มทำงาน
            await new Promise(resolve => setTimeout(resolve, 1500));
            
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
        const promises = [];
        
        // สร้าง servers พร้อมกันใน batch
        for (let i = 0; i < batchSize && (startIndex + i) < this.targetCount; i++) {
            const serverIndex = startIndex + i;
            const category = this.categories[serverIndex % this.categories.length];
            const name = `simple-mcp-${category}-${this.startPort + serverIndex}`;
            const port = this.startPort + serverIndex;
            
            promises.push(this.createServer(name, port, category));
        }
        
        const results = await Promise.all(promises);
        const successCount = results.filter(r => r).length;
        
        return successCount;
    }

    async createAllServers() {
        console.log(`🚀 Starting creation of ${this.targetCount} Simple MCP servers...`);
        console.log(`📦 Batch size: ${this.batchSize}, Delay: ${this.delay}ms`);
        console.log(`🔌 Port range: ${this.startPort}-${this.startPort + this.targetCount - 1}`);
        console.log(`📂 Server files will be saved in: simple-servers/`);
        
        let totalCreated = 0;
        const startTime = Date.now();
        
        for (let i = 0; i < this.targetCount; i += this.batchSize) {
            const batchNumber = Math.floor(i / this.batchSize) + 1;
            const totalBatches = Math.ceil(this.targetCount / this.batchSize);
            
            console.log(`\n🎯 === BATCH ${batchNumber}/${totalBatches} ===`);
            console.log(`📦 Creating servers ${i + 1}-${Math.min(i + this.batchSize, this.targetCount)}...`);
            
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

    async getSystemStats() {
        const stats = {
            total: this.servers.size,
            running: 0,
            healthy: 0,
            categories: {},
            ports: []
        };
        
        // ทดสอบ sample ของ servers
        const sampleSize = Math.min(20, this.servers.size);
        const serverList = Array.from(this.servers.values());
        const sampleServers = serverList.slice(0, sampleSize);
        
        for (const server of sampleServers) {
            if (server.status === 'running') {
                stats.running++;
                stats.ports.push(server.port);
                
                // ตรวจสอบ health
                const isHealthy = await this.checkServerHealth(server.port, `stats-${server.port}`);
                if (isHealthy) {
                    stats.healthy++;
                }
            }
            
            if (!stats.categories[server.category]) {
                stats.categories[server.category] = 0;
            }
            stats.categories[server.category]++;
        }
        
        // คำนวณ estimated stats สำหรับ servers ทั้งหมด
        if (sampleSize > 0) {
            const healthRatio = stats.healthy / sampleSize;
            stats.estimatedHealthy = Math.floor(this.servers.size * healthRatio);
        }
        
        return stats;
    }

    async shutdown() {
        console.log('\n🛑 Shutting down all servers...');
        let shutdownCount = 0;
        
        for (const [name, server] of this.servers) {
            if (server.process && !server.process.killed) {
                server.process.kill('SIGTERM');
                if (shutdownCount < 10) {
                    console.log(`🔴 Stopped ${name}`);
                }
                shutdownCount++;
            }
        }
        
        console.log(`🔴 Shutdown completed: ${shutdownCount} servers stopped`);
    }
}

// เริ่มการทำงาน
const manager = new Simple500ServerManager();

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
    console.log(`   Sample Healthy: ${stats.healthy}/${Math.min(20, stats.total)}`);
    console.log(`   Estimated Healthy: ${stats.estimatedHealthy || 'N/A'}`);
    console.log(`   Categories:`, stats.categories);
    
    if (stats.ports.length > 0) {
        console.log(`   Port range: ${Math.min(...stats.ports)}-${Math.max(...stats.ports)}`);
    }
    
    console.log(`\n🎯 Target achieved: ${created >= 500 ? '✅' : '❌'} (${created}/500)`);
    
    if (created >= 100) {
        console.log(`\n🎊 Congratulations! Successfully created ${created} Simple MCP servers!`);
        
        // ทดสอบ servers แบบสุ่ม
        await manager.testRandomServers(15);
    }
    
}).catch(async (error) => {
    console.error('❌ Error during server creation:', error);
    await manager.shutdown();
});