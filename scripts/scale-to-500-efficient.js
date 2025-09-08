const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

class EfficientServerScaler {
    constructor() {
        this.runningServers = new Map();
        this.targetServers = 500;
        this.currentPort = 4000; // เริ่มจาก port ใหม่
        this.batchSize = 5; // ลดขนาด batch
        this.delay = 1000; // ลด delay
        this.serverTypes = [
            'api', 'database', 'filesystem', 'monitoring', 'analytics',
            'security', 'cache', 'queue', 'notification', 'auth',
            'logging', 'config', 'backup', 'search', 'media',
            'email', 'chat', 'payment', 'ai-ml', 'web'
        ];
    }

    async checkCurrentServers() {
        try {
            console.log('🔍 Checking current server status...');
            const response = await this.makeRequest('http://localhost:8080/health');
            const data = JSON.parse(response);
            console.log(`📊 Current status: ${data.servers.healthy}/${data.servers.total} servers healthy`);
            return data.servers.healthy;
        } catch (error) {
            console.log('⚠️  Could not check load balancer status');
            return 0;
        }
    }

    makeRequest(url) {
        return new Promise((resolve, reject) => {
            const req = http.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(data));
            });
            req.on('error', reject);
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    generateServerScript(type, port) {
        const serverScript = `const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const express = require('express');

class ${type.charAt(0).toUpperCase() + type.slice(1)}MCPServer {
    constructor() {
        this.server = new Server({
            name: '${type}-mcp-server',
            version: '1.0.0'
        }, {
            capabilities: {
                tools: {}
            }
        });
        this.setupHandlers();
        this.startHealthServer(${port});
    }

    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [{
                name: '${type}_operation',
                description: 'Perform ${type} operations',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: { type: 'string' },
                        data: { type: 'object' }
                    }
                }
            }]
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            if (request.params.name === '${type}_operation') {
                return {
                    content: [{
                        type: 'text',
                        text: \`${type.toUpperCase()} operation completed: \${JSON.stringify(request.params.arguments)}\`
                    }]
                };
            }
            throw new Error(\`Unknown tool: \${request.params.name}\`);
        });
    }

    startHealthServer(port) {
        const app = express();
        app.get('/health', (req, res) => {
            res.json({ status: 'healthy', type: '${type}', port: ${port} });
        });
        app.listen(${port}, () => {
            console.log(\`${type.toUpperCase()} MCP Server health endpoint running on port ${port}\`);
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log('${type.toUpperCase()} MCP Server running on stdio');
    }
}

const server = new ${type.charAt(0).toUpperCase() + type.slice(1)}MCPServer();
server.run().catch(console.error);`;

        return serverScript;
    }

    async createServerFile(type, port) {
        const fileName = `mcp-server-${type}-${port}.js`;
        const filePath = path.join(__dirname, fileName);
        const script = this.generateServerScript(type, port);
        
        try {
            fs.writeFileSync(filePath, script);
            return fileName;
        } catch (error) {
            console.error(`❌ Failed to create ${fileName}:`, error.message);
            return null;
        }
    }

    async startServer(fileName, port) {
        return new Promise((resolve) => {
            const serverProcess = spawn('node', [fileName], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: __dirname
            });

            const timeout = setTimeout(() => {
                serverProcess.kill();
                resolve(false);
            }, 3000); // ลด timeout

            serverProcess.stdout.on('data', (data) => {
                if (data.toString().includes('running on port')) {
                    clearTimeout(timeout);
                    this.runningServers.set(port, { process: serverProcess, fileName });
                    resolve(true);
                }
            });

            serverProcess.on('error', () => {
                clearTimeout(timeout);
                resolve(false);
            });

            serverProcess.on('exit', () => {
                clearTimeout(timeout);
                this.runningServers.delete(port);
                resolve(false);
            });
        });
    }

    async createAndStartBatch(batchNumber, serversNeeded) {
        console.log(`\n🚀 Creating batch ${batchNumber} (${Math.min(this.batchSize, serversNeeded)} servers)...`);
        const promises = [];
        const batchSize = Math.min(this.batchSize, serversNeeded);

        for (let i = 0; i < batchSize; i++) {
            const type = this.serverTypes[Math.floor(Math.random() * this.serverTypes.length)];
            const port = this.currentPort++;
            
            promises.push(this.createAndStartServer(type, port));
        }

        const results = await Promise.all(promises);
        const successful = results.filter(r => r).length;
        
        console.log(`✅ Batch ${batchNumber} completed: ${successful}/${batchSize} servers started`);
        return successful;
    }

    async createAndStartServer(type, port) {
        const fileName = await this.createServerFile(type, port);
        if (!fileName) return false;

        const started = await this.startServer(fileName, port);
        if (started) {
            console.log(`✅ Server ${fileName} started successfully on port ${port}`);
        } else {
            console.log(`❌ Server ${fileName} failed to start`);
            // ลบไฟล์ที่ไม่สำเร็จ
            try {
                fs.unlinkSync(path.join(__dirname, fileName));
            } catch (e) {}
        }
        return started;
    }

    async scaleToTarget() {
        console.log('🎯 Starting efficient scaling to 500 servers...');
        
        const currentServers = await this.checkCurrentServers();
        const serversNeeded = this.targetServers - currentServers;
        
        console.log(`📊 Current servers: ${currentServers}`);
        console.log(`🎯 Target servers: ${this.targetServers}`);
        console.log(`➕ Servers needed: ${serversNeeded}`);

        if (serversNeeded <= 0) {
            console.log('🎉 Target already reached!');
            return;
        }

        let totalCreated = 0;
        let batchNumber = 1;

        while (totalCreated < serversNeeded) {
            const remaining = serversNeeded - totalCreated;
            const created = await this.createAndStartBatch(batchNumber, remaining);
            totalCreated += created;
            
            console.log(`📈 Progress: ${totalCreated}/${serversNeeded} new servers created`);
            console.log(`📊 Total estimated servers: ${currentServers + totalCreated}/${this.targetServers}`);
            
            if (totalCreated < serversNeeded) {
                console.log(`⏳ Waiting ${this.delay}ms before next batch...`);
                await new Promise(resolve => setTimeout(resolve, this.delay));
            }
            
            batchNumber++;
        }

        console.log('\n🎉 Scaling completed!');
        console.log(`📊 Total new servers created: ${totalCreated}`);
        console.log(`🎯 Estimated total servers: ${currentServers + totalCreated}/${this.targetServers}`);
        
        // ตรวจสอบสถานะสุดท้าย
        setTimeout(async () => {
            const finalCount = await this.checkCurrentServers();
            console.log(`\n📊 Final server count: ${finalCount}/${this.targetServers}`);
            if (finalCount >= this.targetServers) {
                console.log('🎉 SUCCESS: Target of 500 servers reached!');
            } else {
                console.log(`⚠️  Still need ${this.targetServers - finalCount} more servers`);
            }
        }, 5000);
    }
}

const scaler = new EfficientServerScaler();
scaler.scaleToTarget().catch(console.error);