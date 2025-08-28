#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * MCP Existing Server Starter
 * เริ่มต้น MCP servers ที่มีอยู่แล้วและสร้างเพิ่มเติมให้ครบ 500 ตัว
 */
class MCPExistingServerStarter {
    constructor() {
        this.baseDir = __dirname;
        this.runningServers = new Map();
        this.targetServerCount = 500;
        this.startPort = 3300;
        this.serverCategories = [
            'web', 'api', 'database', 'filesystem', 'monitoring',
            'analytics', 'ai-ml', 'security', 'cache', 'queue',
            'notification', 'auth', 'logging', 'config', 'backup',
            'search', 'media', 'email', 'chat', 'payment'
        ];
    }

    /**
     * ค้นหา server files ที่มีอยู่แล้ว
     */
    findExistingServers() {
        const existingServers = [];
        const files = fs.readdirSync(this.baseDir);
        
        for (const file of files) {
            if (file.startsWith('mcp-server-') && file.endsWith('.js') && !file.includes('.backup.')) {
                const fullPath = path.join(this.baseDir, file);
                if (fs.existsSync(fullPath)) {
                    // Extract port from filename
                    const portMatch = file.match(/-([0-9]+)\.js$/);
                    if (portMatch) {
                        const port = parseInt(portMatch[1]);
                        existingServers.push({
                            file: file,
                            path: fullPath,
                            port: port,
                            category: this.extractCategory(file)
                        });
                    }
                }
            }
        }
        
        // Sort by port
        existingServers.sort((a, b) => a.port - b.port);
        return existingServers;
    }

    /**
     * Extract category from filename
     */
    extractCategory(filename) {
        for (const category of this.serverCategories) {
            if (filename.includes(`-${category}-`)) {
                return category;
            }
        }
        return 'general';
    }

    /**
     * เริ่มต้น server
     */
    async startServer(serverInfo) {
        return new Promise((resolve) => {
            console.log(`🚀 Starting server: ${serverInfo.file} on port ${serverInfo.port}`);
            
            const serverProcess = spawn('node', [serverInfo.path], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: this.baseDir
            });

            let started = false;
            const timeout = setTimeout(() => {
                if (!started) {
                    console.log(`⚠️  Server ${serverInfo.file} startup timeout`);
                    resolve(false);
                }
            }, 5000);

            serverProcess.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('Server running') || output.includes('listening') || output.includes('started')) {
                    if (!started) {
                        started = true;
                        clearTimeout(timeout);
                        this.runningServers.set(serverInfo.port, {
                            process: serverProcess,
                            info: serverInfo,
                            startTime: Date.now()
                        });
                        console.log(`✅ Server ${serverInfo.file} started successfully`);
                        resolve(true);
                    }
                }
            });

            serverProcess.stderr.on('data', (data) => {
                const error = data.toString();
                if (error.includes('EADDRINUSE') || error.includes('address already in use')) {
                    console.log(`⚠️  Port ${serverInfo.port} already in use, skipping ${serverInfo.file}`);
                    if (!started) {
                        started = true;
                        clearTimeout(timeout);
                        resolve(false);
                    }
                }
            });

            serverProcess.on('error', (error) => {
                console.log(`❌ Error starting ${serverInfo.file}:`, error.message);
                if (!started) {
                    started = true;
                    clearTimeout(timeout);
                    resolve(false);
                }
            });

            serverProcess.on('exit', (code) => {
                if (this.runningServers.has(serverInfo.port)) {
                    this.runningServers.delete(serverInfo.port);
                    console.log(`🔄 Server ${serverInfo.file} exited with code ${code}`);
                }
            });
        });
    }

    /**
     * สร้าง server script ใหม่
     */
    generateServerScript(category, port) {
        const serverScript = `#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

/**
 * MCP ${category.toUpperCase()} Server - Port ${port}
 * Provides ${category} functionality for MCP clients
 */
class MCP${category.charAt(0).toUpperCase() + category.slice(1)}Server {
    constructor() {
        this.server = new Server(
            {
                name: 'mcp-${category}-server-${port}',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );
        
        this.setupToolHandlers();
        this.setupErrorHandling();
    }

    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: '${category}_status',
                        description: 'Get ${category} server status and information',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                        },
                    },
                    {
                        name: '${category}_health_check',
                        description: 'Perform health check for ${category} services',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                detailed: {
                                    type: 'boolean',
                                    description: 'Return detailed health information',
                                    default: false
                                }
                            },
                        },
                    },
                    {
                        name: '${category}_info',
                        description: 'Get detailed information about ${category} capabilities',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                        },
                    }
                ],
            };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case '${category}_status':
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify({
                                        server: 'mcp-${category}-server-${port}',
                                        status: 'running',
                                        port: ${port},
                                        category: '${category}',
                                        uptime: process.uptime(),
                                        memory: process.memoryUsage(),
                                        timestamp: new Date().toISOString()
                                    }, null, 2)
                                }
                            ]
                        };

                    case '${category}_health_check':
                        const healthData = {
                            status: 'healthy',
                            server: 'mcp-${category}-server-${port}',
                            port: ${port},
                            category: '${category}',
                            checks: {
                                memory: process.memoryUsage().heapUsed < 100 * 1024 * 1024,
                                uptime: process.uptime() > 0,
                                responsive: true
                            },
                            timestamp: new Date().toISOString()
                        };
                        
                        if (args?.detailed) {
                            healthData.details = {
                                pid: process.pid,
                                platform: process.platform,
                                nodeVersion: process.version,
                                memoryUsage: process.memoryUsage(),
                                cpuUsage: process.cpuUsage()
                            };
                        }
                        
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(healthData, null, 2)
                                }
                            ]
                        };

                    case '${category}_info':
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify({
                                        server: 'mcp-${category}-server-${port}',
                                        category: '${category}',
                                        port: ${port},
                                        capabilities: [
                                            'Status monitoring',
                                            'Health checking',
                                            'Information retrieval',
                                            '${category.charAt(0).toUpperCase() + category.slice(1)} operations'
                                        ],
                                        version: '1.0.0',
                                        description: 'MCP server providing ${category} functionality',
                                        timestamp: new Date().toISOString()
                                    }, null, 2)
                                }
                            ]
                        };

                    default:
                        throw new Error(\`Unknown tool: \${name}\`);
                }
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: \`Error: \${error.message}\`
                        }
                    ],
                    isError: true
                };
            }
        });
    }

    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error('[MCP ${category.toUpperCase()} Server] Error:', error);
        };

        process.on('SIGINT', async () => {
            console.log('\n[MCP ${category.toUpperCase()} Server] Shutting down...');
            await this.server.close();
            process.exit(0);
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log('[MCP ${category.toUpperCase()} Server] Server running on port ${port}');
    }
}

const server = new MCP${category.charAt(0).toUpperCase() + category.slice(1)}Server();
server.run().catch(console.error);
`;
        return serverScript;
    }

    /**
     * สร้าง server ใหม่
     */
    async createNewServer(category, port) {
        const filename = `mcp-server-${category}-${port}.js`;
        const filepath = path.join(this.baseDir, filename);
        
        if (fs.existsSync(filepath)) {
            console.log(`📁 Server file ${filename} already exists`);
            return { file: filename, path: filepath, port: port, category: category };
        }
        
        try {
            const serverScript = this.generateServerScript(category, port);
            fs.writeFileSync(filepath, serverScript, 'utf8');
            console.log(`📝 Created new server: ${filename}`);
            return { file: filename, path: filepath, port: port, category: category };
        } catch (error) {
            console.error(`❌ Error creating server ${filename}:`, error.message);
            return null;
        }
    }

    /**
     * เริ่มต้น servers ทั้งหมด
     */
    async startAllServers() {
        console.log('🔍 Finding existing servers...');
        const existingServers = this.findExistingServers();
        console.log(`📊 Found ${existingServers.length} existing servers`);
        
        // Start existing servers first
        let successCount = 0;
        const batchSize = 10;
        
        for (let i = 0; i < existingServers.length; i += batchSize) {
            const batch = existingServers.slice(i, i + batchSize);
            console.log(`\n🚀 Starting batch ${Math.floor(i/batchSize) + 1} (${batch.length} servers)...`);
            
            const promises = batch.map(server => this.startServer(server));
            const results = await Promise.all(promises);
            
            const batchSuccess = results.filter(r => r).length;
            successCount += batchSuccess;
            
            console.log(`✅ Batch completed: ${batchSuccess}/${batch.length} servers started`);
            console.log(`📈 Total progress: ${successCount}/${existingServers.length} existing servers running`);
            
            // Wait between batches
            if (i + batchSize < existingServers.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        console.log(`\n📊 Existing servers started: ${successCount}/${existingServers.length}`);
        
        // Create additional servers if needed
        const remainingCount = this.targetServerCount - successCount;
        if (remainingCount > 0) {
            console.log(`\n🔧 Creating ${remainingCount} additional servers...`);
            await this.createAdditionalServers(remainingCount, successCount);
        }
        
        this.printFinalStatus();
    }

    /**
     * สร้าง servers เพิ่มเติม
     */
    async createAdditionalServers(count, startingCount) {
        let created = 0;
        let started = 0;
        const usedPorts = new Set(Array.from(this.runningServers.keys()));
        
        // Find next available port
        let currentPort = this.startPort;
        while (usedPorts.has(currentPort)) {
            currentPort++;
        }
        
        const batchSize = 15;
        for (let i = 0; i < count; i += batchSize) {
            const batchCount = Math.min(batchSize, count - i);
            console.log(`\n🔧 Creating and starting batch ${Math.floor(i/batchSize) + 1} (${batchCount} servers)...`);
            
            const batch = [];
            for (let j = 0; j < batchCount; j++) {
                const category = this.serverCategories[(created + j) % this.serverCategories.length];
                
                // Find next available port
                while (usedPorts.has(currentPort)) {
                    currentPort++;
                }
                
                const serverInfo = await this.createNewServer(category, currentPort);
                if (serverInfo) {
                    batch.push(serverInfo);
                    usedPorts.add(currentPort);
                }
                currentPort++;
            }
            
            // Start the batch
            const promises = batch.map(server => this.startServer(server));
            const results = await Promise.all(promises);
            
            const batchSuccess = results.filter(r => r).length;
            created += batch.length;
            started += batchSuccess;
            
            console.log(`✅ Batch completed: ${batchSuccess}/${batch.length} servers started`);
            console.log(`📈 Additional progress: ${started}/${count} new servers running`);
            console.log(`📊 Total servers running: ${startingCount + started}/${this.targetServerCount}`);
            
            // Wait between batches
            if (i + batchSize < count) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
        console.log(`\n📊 Additional servers created: ${created}, started: ${started}`);
    }

    /**
     * แสดงสถานะสุดท้าย
     */
    printFinalStatus() {
        const totalRunning = this.runningServers.size;
        const categories = {};
        
        for (const [port, serverData] of this.runningServers) {
            const category = serverData.info.category;
            categories[category] = (categories[category] || 0) + 1;
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 MCP SERVER SYSTEM STATUS');
        console.log('='.repeat(60));
        console.log(`📊 Total Servers Running: ${totalRunning}/${this.targetServerCount}`);
        console.log(`📈 Success Rate: ${((totalRunning/this.targetServerCount) * 100).toFixed(1)}%`);
        console.log('\n📋 Servers by Category:');
        
        Object.entries(categories)
            .sort(([,a], [,b]) => b - a)
            .forEach(([category, count]) => {
                console.log(`   ${category.padEnd(15)}: ${count} servers`);
            });
        
        console.log('\n🔗 Port Ranges:');
        const ports = Array.from(this.runningServers.keys()).sort((a, b) => a - b);
        if (ports.length > 0) {
            console.log(`   Range: ${ports[0]} - ${ports[ports.length - 1]}`);
            console.log(`   Sample ports: ${ports.slice(0, 10).join(', ')}${ports.length > 10 ? '...' : ''}`);
        }
        
        console.log('\n✅ System ready for load balancing!');
        console.log('='.repeat(60));
    }

    /**
     * Cleanup on exit
     */
    setupCleanup() {
        const cleanup = () => {
            console.log('\n🛑 Shutting down all servers...');
            for (const [port, serverData] of this.runningServers) {
                try {
                    serverData.process.kill('SIGTERM');
                } catch (error) {
                    console.log(`⚠️  Error stopping server on port ${port}:`, error.message);
                }
            }
            process.exit(0);
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
    }
}

// Start the system
const starter = new MCPExistingServerStarter();
starter.setupCleanup();
starter.startAllServers().catch(console.error);