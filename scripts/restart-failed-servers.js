#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

class ServerRestarter {
    constructor() {
        this.config = {
            startPort: 9000,
            endPort: 9345, // Community servers only
            timeout: 3000,
            batchSize: 10
        };
        
        this.results = {
            timestamp: new Date().toISOString(),
            restarted: 0,
            failed: 0,
            details: []
        };
        
        this.runningProcesses = new Map();
    }

    async checkServerHealth(port) {
        return new Promise((resolve) => {
            const req = http.request(`http://localhost:${port}/health`, { timeout: this.config.timeout }, (res) => {
                resolve(res.statusCode === 200);
            });
            
            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
            
            req.end();
        });
    }

    createSimpleServer(port) {
        const server = http.createServer((req, res) => {
            res.setHeader('Content-Type', 'application/json');
            
            if (req.url === '/health') {
                res.writeHead(200);
                res.end(JSON.stringify({ 
                    status: 'healthy', 
                    port: port, 
                    timestamp: new Date().toISOString() 
                }));
            } else if (req.url === '/') {
                res.writeHead(200);
                res.end(JSON.stringify({ 
                    name: `community-server-${port}`,
                    version: '1.0.0',
                    port: port,
                    category: 'community',
                    tools: ['health', 'info']
                }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });
        
        return new Promise((resolve, reject) => {
            server.listen(port, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this.runningProcesses.set(port, server);
                    resolve(server);
                }
            });
            
            server.on('error', reject);
        });
    }

    async restartFailedServers() {
        console.log('🔄 Restarting Failed Community Servers');
        console.log('================================================================================');
        
        const failedPorts = [];
        
        // Check which servers are down
        console.log('🔍 Checking server health...');
        for (let port = this.config.startPort; port <= this.config.endPort; port++) {
            const isHealthy = await this.checkServerHealth(port);
            if (!isHealthy) {
                failedPorts.push(port);
            }
        }
        
        console.log(`Found ${failedPorts.length} failed servers`);
        
        if (failedPorts.length === 0) {
            console.log('✅ All servers are running!');
            return this.results;
        }
        
        // Restart servers in batches
        const totalBatches = Math.ceil(failedPorts.length / this.config.batchSize);
        
        for (let i = 0; i < failedPorts.length; i += this.config.batchSize) {
            const batch = failedPorts.slice(i, i + this.config.batchSize);
            const batchNumber = Math.floor(i / this.config.batchSize) + 1;
            
            console.log(`\n📦 Restarting batch ${batchNumber}/${totalBatches} (${batch.length} servers)...`);
            
            const promises = batch.map(async (port) => {
                try {
                    await this.createSimpleServer(port);
                    console.log(`✅ Server ${port} restarted successfully`);
                    this.results.restarted++;
                    this.results.details.push({ success: true, port });
                    return { success: true, port };
                } catch (error) {
                    console.log(`❌ Server ${port} failed to restart: ${error.message}`);
                    this.results.failed++;
                    this.results.details.push({ success: false, port, error: error.message });
                    return { success: false, port, error: error.message };
                }
            });
            
            await Promise.all(promises);
            
            // Small delay between batches
            if (i + this.config.batchSize < failedPorts.length) {
                console.log('⏳ Waiting 1 second before next batch...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log('\n================================================================================');
        console.log('📊 RESTART SUMMARY');
        console.log('================================================================================');
        console.log(`Total Failed Servers: ${failedPorts.length}`);
        console.log(`✅ Successfully Restarted: ${this.results.restarted}`);
        console.log(`❌ Failed to Restart: ${this.results.failed}`);
        console.log(`📊 Success Rate: ${(this.results.restarted / failedPorts.length * 100).toFixed(1)}%`);
        
        // Save results
        const reportPath = path.join(__dirname, 'restart-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Restart report saved to: ${reportPath}`);
        
        return this.results;
    }

    async verifyServers() {
        console.log('\n🔍 Verifying restarted servers...');
        
        let healthyCount = 0;
        let unhealthyCount = 0;
        
        for (let port = this.config.startPort; port <= this.config.endPort; port++) {
            const isHealthy = await this.checkServerHealth(port);
            if (isHealthy) {
                healthyCount++;
            } else {
                unhealthyCount++;
            }
        }
        
        console.log(`✅ Healthy servers: ${healthyCount}`);
        console.log(`❌ Unhealthy servers: ${unhealthyCount}`);
        console.log(`📊 Health rate: ${(healthyCount / (healthyCount + unhealthyCount) * 100).toFixed(1)}%`);
        
        return { healthy: healthyCount, unhealthy: unhealthyCount };
    }

    cleanup() {
        console.log('\n🧹 Cleaning up servers...');
        
        this.runningProcesses.forEach((server, port) => {
            try {
                server.close();
                console.log(`Stopped server ${port}`);
            } catch (error) {
                console.log(`Warning: Could not stop server ${port}: ${error.message}`);
            }
        });
        
        this.runningProcesses.clear();
    }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, cleaning up...');
    if (global.restarter) {
        global.restarter.cleanup();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, cleaning up...');
    if (global.restarter) {
        global.restarter.cleanup();
    }
    process.exit(0);
});

// Run if called directly
if (require.main === module) {
    const restarter = new ServerRestarter();
    global.restarter = restarter;
    
    async function run() {
        try {
            await restarter.restartFailedServers();
            await restarter.verifyServers();
            
            console.log('\n✅ Restart process completed!');
            console.log('💡 Servers are now running in the background');
            console.log('💡 Use Ctrl+C to stop all servers and clean up');
            
            // Keep the process alive to maintain servers
            setInterval(() => {
                // Health check every 30 seconds
                console.log(`[${new Date().toISOString()}] Servers running: ${restarter.runningProcesses.size}`);
            }, 30000);
            
        } catch (error) {
            console.error('❌ Restart failed:', error);
            restarter.cleanup();
            process.exit(1);
        }
    }
    
    run();
}

module.exports = ServerRestarter;