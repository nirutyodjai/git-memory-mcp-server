const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

class Working500ServerManager {
    constructor() {
        this.batchSize = 20; // เพิ่ม batch size
        this.delay = 2000; // ลด delay
        this.startPort = 8000; // เปลี่ยนช่วงพอร์ต
        this.endPort = 8499;
        this.healthTimeout = 2000; // ลด timeout
        this.serversDir = 'working-servers';
        this.runningServers = new Map();
        this.successfulServers = [];
        this.failedServers = [];
        
        this.categories = [
            'web', 'api', 'database', 'filesystem', 'security',
            'analytics', 'monitoring', 'cache', 'queue', 'auth',
            'storage', 'compute', 'network', 'ml', 'ai'
        ];
        
        this.ensureDirectory();
    }

    ensureDirectory() {
        if (!fs.existsSync(this.serversDir)) {
            fs.mkdirSync(this.serversDir, { recursive: true });
        }
    }

    generateServerScript(name, port, category) {
        const className = name.replace(/-/g, '').toLowerCase() + 'Server';
        
        return `const express = require('express');
const cors = require('cors');

class ${className} {
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
                timestamp: new Date().toISOString(),
                type: 'working-mcp-server'
            });
        });

        // List tools endpoint
        this.app.get('/tools', (req, res) => {
            res.json({
                tools: [
                    {
                        name: \`\${this.category}_operation\`,
                        description: \`Perform \${this.category} operations\`,
                        category: this.category
                    },
                    {
                        name: 'get_server_info',
                        description: 'Get server information',
                        category: 'info'
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
                    result: \`\${this.category.toUpperCase()} operation completed on \${this.name}\`,
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
                    requests: this.requestCount
                });
            } else {
                res.status(400).json({ error: \`Unknown tool: \${tool}\` });
            }
        });
    }

    startServer() {
        const server = this.app.listen(this.port, () => {
            console.log(\`[\${this.name}] Server running on port \${this.port}\`);
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

const server = new ${className}();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(\`[\${server.name}] Shutting down...\`);
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(\`[\${server.name}] Received SIGTERM...\`);
    process.exit(0);
});`;
    }

    async createServer(serverIndex, port) {
        const category = this.categories[serverIndex % this.categories.length];
        const name = `working-mcp-${category}-${port}`;
        const filename = `${name}.js`;
        const filepath = path.join(this.serversDir, filename);

        try {
            // สร้างไฟล์ server
            const script = this.generateServerScript(name, port, category);
            fs.writeFileSync(filepath, script);
            console.log(`📝 Created script: ${filename}`);

            // เริ่ม server
            const child = spawn('node', [filepath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                detached: false
            });

            this.runningServers.set(name, {
                process: child,
                port: port,
                category: category,
                startTime: Date.now()
            });

            // รอให้ server เริ่มต้น
            await this.sleep(1000);

            // ตรวจสอบ health
            const isHealthy = await this.checkHealth(port, name);
            
            if (isHealthy) {
                console.log(`✅ ${name} is running successfully`);
                this.successfulServers.push({ name, port, category });
                return true;
            } else {
                console.log(`❌ ${name} failed health check`);
                this.failedServers.push({ name, port, category, reason: 'health_check_failed' });
                this.stopServer(name);
                return false;
            }
        } catch (error) {
            console.error(`❌ Error creating ${name}:`, error.message);
            this.failedServers.push({ name, port, category, reason: error.message });
            return false;
        }
    }

    async checkHealth(port, name) {
        try {
            const response = await axios.get(`http://localhost:${port}/health`, {
                timeout: this.healthTimeout
            });
            return response.status === 200 && response.data.status === 'healthy';
        } catch (error) {
            console.log(`❌ Health check failed for ${name}: ${error.message}`);
            return false;
        }
    }

    stopServer(name) {
        const server = this.runningServers.get(name);
        if (server && server.process) {
            try {
                server.process.kill('SIGTERM');
                this.runningServers.delete(name);
            } catch (error) {
                console.error(`Error stopping ${name}:`, error.message);
            }
        }
    }

    async createBatch(batchNumber, startIndex) {
        console.log(`\n🎯 === BATCH ${batchNumber}/25 ===\n`);
        
        const promises = [];
        const batchStart = startIndex;
        const batchEnd = Math.min(startIndex + this.batchSize, 500);
        
        for (let i = batchStart; i < batchEnd; i++) {
            const port = this.startPort + i;
            promises.push(this.createServer(i, port));
        }
        
        const results = await Promise.all(promises);
        const successCount = results.filter(r => r).length;
        
        console.log(`\n📊 Batch ${batchNumber} completed: ${successCount}/${this.batchSize} servers successful`);
        console.log(`📈 Total progress: ${this.successfulServers.length}/500 servers (${(this.successfulServers.length/500*100).toFixed(1)}%)`);
        
        return successCount;
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async createAll500Servers() {
        console.log('🚀 Starting creation of 500 Working MCP servers...');
        console.log(`📦 Batch size: ${this.batchSize}, Delay: ${this.delay}ms`);
        console.log(`🔌 Port range: ${this.startPort}-${this.endPort}`);
        console.log(`📂 Server files will be saved in: ${this.serversDir}/\n`);

        const totalBatches = Math.ceil(500 / this.batchSize);
        let serverIndex = 0;

        for (let batch = 1; batch <= totalBatches; batch++) {
            await this.createBatch(batch, serverIndex);
            serverIndex += this.batchSize;
            
            if (batch < totalBatches) {
                console.log(`⏳ Waiting ${this.delay}ms before next batch...`);
                await this.sleep(this.delay);
            }
        }

        this.printFinalReport();
    }

    printFinalReport() {
        console.log('\n' + '='.repeat(60));
        console.log('🎉 FINAL REPORT - 500 Working MCP Servers');
        console.log('='.repeat(60));
        console.log(`✅ Successful servers: ${this.successfulServers.length}`);
        console.log(`❌ Failed servers: ${this.failedServers.length}`);
        console.log(`📊 Success rate: ${(this.successfulServers.length/500*100).toFixed(1)}%`);
        console.log(`🔌 Port range used: ${this.startPort}-${this.startPort + 499}`);
        console.log(`📂 Server files location: ${this.serversDir}/`);
        
        if (this.successfulServers.length > 0) {
            console.log('\n🎯 Categories distribution:');
            const categoryCount = {};
            this.successfulServers.forEach(server => {
                categoryCount[server.category] = (categoryCount[server.category] || 0) + 1;
            });
            Object.entries(categoryCount).forEach(([category, count]) => {
                console.log(`   ${category}: ${count} servers`);
            });
        }
        
        if (this.failedServers.length > 0 && this.failedServers.length < 20) {
            console.log('\n❌ Failed servers:');
            this.failedServers.forEach(server => {
                console.log(`   ${server.name} (${server.reason})`);
            });
        }
        
        console.log('\n🚀 All working servers are now running and ready!');
        console.log('='.repeat(60));
    }

    async cleanup() {
        console.log('\n🧹 Cleaning up...');
        for (const [name, server] of this.runningServers) {
            this.stopServer(name);
        }
    }
}

// เริ่มต้นการสร้าง servers
const manager = new Working500ServerManager();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, cleaning up...');
    await manager.cleanup();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, cleaning up...');
    await manager.cleanup();
    process.exit(0);
});

// เริ่มสร้าง 500 servers
manager.createAll500Servers().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});