#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

/**
 * MCP Existing Server Starter
 * เริ่มต้น MCP servers ที่มีอยู่แล้วและสร้างเพิ่มเติมให้ครบ 500 ตัว
 */
class MCPExistingServerStarter {
    constructor() {
        this.baseDir = __dirname;
        this.runningServers = new Map();
        this.targetServerCount = parseInt(process.env.STARTER_TARGET_COUNT || '500', 10);
        // Configure starting port and max attempts via env
        this.startPort = parseInt(process.env.STARTER_PORT_START || '3300', 10);
        this.maxAttemptsPerServer = parseInt(process.env.STARTER_PORT_MAX_ATTEMPTS || process.env.PORT_MAX_ATTEMPTS || '10', 10);
        this.serverCategories = [
            'web', 'api', 'database', 'filesystem', 'monitoring',
            'analytics', 'ai-ml', 'security', 'cache', 'queue',
            'notification', 'auth', 'logging', 'config', 'backup',
            'search', 'media', 'email', 'chat', 'payment'
        ];
        // Reserve ports to prevent concurrent batches from colliding
        this.reservedPorts = new Set();
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
     * เริ่มต้น server (with automatic port increment and retry)
     */
    async startServer(serverInfo) {
        const basePort = Number.isFinite(serverInfo.port) ? serverInfo.port : this.startPort;
        let attempt = 0;
        let currentPort = this.getNextAvailablePort(basePort);

        const tryOnce = (port) => new Promise((resolve) => {
            console.log(`🚀 Starting server: ${serverInfo.file} on port ${port}`);

            const env = {
                ...process.env,
                PORT: String(port),
                MCP_PORT: String(port),
                SERVER_PORT: String(port),
                // Turn off strict port bindings if present in target servers
                PORT_STRICT: '0',
                MCP_PORT_STRICT: '0',
                MCP_SERVER_PORT_STRICT: '0',
                SERVER_PORT_STRICT: '0',
            };

            const serverProcess = spawn('node', [serverInfo.path], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: this.baseDir,
                env
            });

            let started = false;
            const timeoutMs = parseInt(process.env.STARTER_STARTUP_TIMEOUT_MS || '8000', 10);
            const probeIntervalMs = parseInt(process.env.STARTER_PROBE_INTERVAL_MS || '600', 10);
            const probePaths = ['/health', '/'];

            const timeout = setTimeout(() => {
                if (!started) {
                    console.log(`⚠️  Server ${serverInfo.file} startup timeout on port ${port}`);
                    try { serverProcess.kill('SIGTERM'); } catch {}
                    resolve({ ok: false, reason: 'timeout' });
                }
            }, timeoutMs);

            let probeTimer = setInterval(() => {
                if (started) return;
                // probe sequentially two paths
                const tryPath = (idx) => {
                    if (idx >= probePaths.length) return;
                    const req = http.get({ hostname: '127.0.0.1', port, path: probePaths[idx], timeout: 1000 }, (res) => {
                        if (!started && res && res.statusCode) {
                            started = true;
                            clearTimeout(timeout);
                            clearInterval(probeTimer);
                            this.runningServers.set(port, {
                                process: serverProcess,
                                info: { ...serverInfo, port },
                                startTime: Date.now()
                            });
                            console.log(`✅ Server ${serverInfo.file} responded on port ${port} (status ${res.statusCode})`);
                            resolve({ ok: true });
                            res.resume();
                            return;
                        }
                    });
                    req.on('error', () => {
                        // try next path if this one fails
                        tryPath(idx + 1);
                    });
                };
                tryPath(0);
            }, probeIntervalMs);

            serverProcess.stdout.on('data', (data) => {
                if (started) return;
                const output = data.toString();
                // Heuristic signals that server is up
                if (output.includes('Server running') || output.includes('listening') || output.includes('started')) {
                    started = true;
                    clearTimeout(timeout);
                    clearInterval(probeTimer);
                    this.runningServers.set(port, {
                        process: serverProcess,
                        info: { ...serverInfo, port },
                        startTime: Date.now()
                    });
                    console.log(`✅ Server ${serverInfo.file} started successfully on port ${port}`);
                    resolve({ ok: true });
                }
            });

            serverProcess.stderr.on('data', (data) => {
                if (started) return;
                const error = data.toString();
                if (error.includes('EADDRINUSE') || error.includes('address already in use')) {
                    console.log(`⚠️  Port ${port} already in use for ${serverInfo.file}`);
                    try { serverProcess.kill('SIGTERM'); } catch {}
                    clearTimeout(timeout);
                    clearInterval(probeTimer);
                    resolve({ ok: false, reason: 'EADDRINUSE' });
                }
            });

            serverProcess.on('error', (error) => {
                if (started) return;
                console.log(`❌ Error starting ${serverInfo.file} on port ${port}:`, error.message);
                clearTimeout(timeout);
                clearInterval(probeTimer);
                resolve({ ok: false, reason: 'spawn_error', error });
            });

            serverProcess.on('exit', (code) => {
                if (!started) {
                    clearTimeout(timeout);
                    clearInterval(probeTimer);
                    resolve({ ok: false, reason: 'exit', code });
                } else {
                    if (this.runningServers.has(port)) {
                        this.runningServers.delete(port);
                        console.log(`🔄 Server ${serverInfo.file} exited with code ${code}`);
                    }
                }
            });
        });

        while (attempt < this.maxAttemptsPerServer) {
            const result = await tryOnce(currentPort);
            if (result.ok) {
                // keep port reserved while running
                return true;
            }

            // Release the reserved port if not used successfully
            this.releaseReservedPort(currentPort);

            if (result.reason === 'EADDRINUSE' || result.reason === 'timeout') {
                attempt++;
                // exponential backoff (capped)
                const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
                if (backoff > 0) {
                    await new Promise((r) => setTimeout(r, backoff));
                }
                currentPort = this.getNextAvailablePort(currentPort + 1);
                console.log(`↪️  Retrying ${serverInfo.file} on port ${currentPort} (attempt ${attempt}/${this.maxAttemptsPerServer})`);
                continue;
            }

            // For other failures, don't keep retrying endlessly
            console.log(`⏭️  Skipping ${serverInfo.file} due to failure: ${result.reason || 'unknown'}`);
            return false;
        }

        console.log(`⏭️  Skipping ${serverInfo.file} after ${this.maxAttemptsPerServer} attempts`);
        return false;
    }

    /**
     * Get next available port (reserving it immediately)
     */
    getNextAvailablePort(fromPort) {
        let p = typeof fromPort === 'number' ? fromPort : this.startPort;
        while (this.runningServers.has(p) || this.reservedPorts.has(p)) {
            p++;
        }
        this.reservedPorts.add(p);
        return p;
    }

    /**
     * Release a reserved port when not used
     */
    releaseReservedPort(port) {
        this.reservedPorts.delete(port);
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
            const remainingNeeded = this.targetServerCount - successCount;
            if (remainingNeeded <= 0) {
                console.log('✅ Reached target server count. Skipping remaining existing servers.');
                break;
            }

            const batch = existingServers.slice(i, i + Math.min(batchSize, remainingNeeded));
            console.log(`\n🚀 Starting batch ${Math.floor(i/batchSize) + 1} (${batch.length} servers, target remaining: ${remainingNeeded})...`);
            
            const promises = batch.map(server => this.startServer(server));
            const results = await Promise.all(promises);
            
            const batchSuccess = results.filter(r => r).length;
            successCount += batchSuccess;
            
            console.log(`✅ Batch completed: ${batchSuccess}/${batch.length} servers started`);
            console.log(`📈 Total progress: ${successCount}/${existingServers.length} existing servers running`);
            
            // Wait between batches if still need more
            if (i + batchSize < existingServers.length && (this.targetServerCount - successCount) > 0) {
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

    /**
     * Generate minimal server script content
     */
    generateServerScript(category, port) {
        const safePort = Number.isFinite(port) ? port : this.startPort;
        const lines = [
            "#!/usr/bin/env node",
            "const http = require('http');",
            "const DEFAULT_PORT = '" + String(safePort) + "';",
            "const port = parseInt(process.env.PORT || process.env.MCP_PORT || process.env.SERVER_PORT || DEFAULT_PORT, 10);",
            "const server = http.createServer((req, res) => {",
            "  if (req.url === '/health') {",
            "    res.writeHead(200, { 'content-type': 'application/json' });",
            "    res.end(JSON.stringify({ ok: true, category: '" + category + "', port }));",
            "    return;",
            "  }",
            "  res.writeHead(200, { 'content-type': 'text/plain' });",
            "  res.end('OK');",
            "});",
            "server.listen(port, () => {",
            "  console.log('Server running on port ' + port);",
            "});",
            "server.on('error', (err) => {",
            "  if (err && err.code === 'EADDRINUSE') {",
            "    console.error('EADDRINUSE: address already in use for port ' + port);",
            "  } else {",
            "    console.error(err && (err.stack || err.message) || String(err));",
            "  }",
            "  process.exit(1);",
            "});",
        ];
        return lines.join('\n');
    }
}

// Start the system
const starter = new MCPExistingServerStarter();
starter.setupCleanup();
starter.startAllServers().catch(console.error);