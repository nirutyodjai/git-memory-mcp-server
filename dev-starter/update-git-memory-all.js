#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

class GitMemoryUpdater {
    constructor() {
        this.gitMemoryPath = path.join(__dirname, '.git-memory');
        this.bridgeUrl = 'http://localhost:3100';
        this.servers = [];
        this.updateResults = {
            total: 0,
            updated: 0,
            failed: 0,
            errors: []
        };
        
        this.loadServerList();
    }

    loadServerList() {
        try {
            // โหลดรายการ servers จากไฟล์ status
            const communityStatus = this.loadJsonFile('real-community-deployment-status.json');
            const securityStatus = this.loadJsonFile('security-deployment-status.json');
            
            if (communityStatus && communityStatus.runningServers) {
                communityStatus.runningServers.forEach((server, index) => {
                    this.servers.push({
                        name: server,
                        port: 9000 + index,
                        category: 'community',
                        url: `http://localhost:${9000 + index}`
                    });
                });
            }
            
            if (securityStatus && securityStatus.runningServers) {
                securityStatus.runningServers.forEach((server, index) => {
                    this.servers.push({
                        name: server,
                        port: 9346 + index,
                        category: 'security',
                        url: `http://localhost:${9346 + index}`
                    });
                });
            }
            
            this.updateResults.total = this.servers.length;
            console.log(`📊 Loaded ${this.servers.length} servers for memory update`);
        } catch (error) {
            console.error('❌ Error loading server list:', error);
        }
    }

    loadJsonFile(filename) {
        try {
            const filePath = path.join(__dirname, filename);
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (error) {
            console.error(`❌ Error loading ${filename}:`, error);
        }
        return null;
    }

    async updateGitMemoryStructure() {
        console.log('🔄 Updating Git Memory structure...');
        
        try {
            // สร้าง directories สำหรับ memory sharing
            const directories = [
                '.git-memory/shared/memory',
                '.git-memory/shared/cache',
                '.git-memory/shared/logs',
                '.git-memory/servers',
                '.git-memory/categories/mcp-tools',
                '.git-memory/categories/server-data',
                '.git-memory/categories/shared-resources',
                '.git-memory/categories/performance-metrics',
                '.git-memory/categories/security-data',
                '.git-memory/coordinator',
                '.git-memory/config'
            ];

            for (const dir of directories) {
                const dirPath = path.join(__dirname, dir);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                    console.log(`📁 Created directory: ${dir}`);
                }
            }

            // สร้าง shared memory configuration
            const sharedConfig = {
                version: '2.0',
                updated: new Date().toISOString(),
                servers: this.servers.length,
                sharing: {
                    enabled: true,
                    syncInterval: 30000,
                    categories: [
                        'mcp-tools',
                        'server-data',
                        'shared-resources',
                        'performance-metrics',
                        'security-data'
                    ]
                },
                bridge: {
                    url: this.bridgeUrl,
                    enabled: true
                }
            };

            fs.writeFileSync(
                path.join(__dirname, '.git-memory/config/shared-config.json'),
                JSON.stringify(sharedConfig, null, 2)
            );

            console.log('✅ Git Memory structure updated successfully');
            return true;
        } catch (error) {
            console.error('❌ Error updating Git Memory structure:', error);
            return false;
        }
    }

    async createServerMemoryEntries() {
        console.log('📝 Creating server memory entries...');
        
        try {
            for (const server of this.servers) {
                const serverMemory = {
                    id: server.name,
                    name: server.name,
                    port: server.port,
                    category: server.category,
                    url: server.url,
                    status: 'active',
                    capabilities: this.getServerCapabilities(server),
                    memory_sharing: {
                        enabled: true,
                        last_sync: null,
                        shared_categories: ['mcp-tools', 'server-data']
                    },
                    created: new Date().toISOString(),
                    updated: new Date().toISOString()
                };

                const serverPath = path.join(__dirname, '.git-memory/servers', `${server.name}.json`);
                fs.writeFileSync(serverPath, JSON.stringify(serverMemory, null, 2));
            }

            console.log(`✅ Created memory entries for ${this.servers.length} servers`);
            return true;
        } catch (error) {
            console.error('❌ Error creating server memory entries:', error);
            return false;
        }
    }

    getServerCapabilities(server) {
        const baseCapabilities = ['health_check', 'mcp_protocol'];
        
        if (server.category === 'security') {
            return [...baseCapabilities, 'security_scan', 'threat_detection', 'vulnerability_assessment'];
        } else if (server.category === 'community') {
            return [...baseCapabilities, 'data_processing', 'api_integration', 'content_management'];
        }
        
        return baseCapabilities;
    }

    async updateServerMemorySharing() {
        console.log('🔄 Updating server memory sharing...');
        
        let updated = 0;
        let failed = 0;
        
        for (const server of this.servers) {
            try {
                // ทดสอบการเชื่อมต่อกับ server
                const isHealthy = await this.checkServerHealth(server.url);
                
                if (isHealthy) {
                    // อัปเดต memory sharing configuration
                    await this.updateServerMemoryConfig(server);
                    updated++;
                    console.log(`✅ Updated memory sharing for ${server.name}`);
                } else {
                    failed++;
                    this.updateResults.errors.push(`Server ${server.name} is not healthy`);
                    console.log(`⚠️  Server ${server.name} is not responding`);
                }
            } catch (error) {
                failed++;
                this.updateResults.errors.push(`Failed to update ${server.name}: ${error.message}`);
                console.error(`❌ Failed to update ${server.name}:`, error.message);
            }
        }
        
        this.updateResults.updated = updated;
        this.updateResults.failed = failed;
        
        console.log(`📊 Memory sharing update completed: ${updated} updated, ${failed} failed`);
        return { updated, failed };
    }

    async checkServerHealth(serverUrl) {
        return new Promise((resolve) => {
            const url = new URL(serverUrl + '/health');
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: 'GET',
                timeout: 3000
            };

            const req = http.request(options, (res) => {
                resolve(res.statusCode === 200);
            });

            req.on('error', () => resolve(false));
            req.on('timeout', () => resolve(false));
            req.end();
        });
    }

    async updateServerMemoryConfig(server) {
        // สร้าง memory configuration สำหรับแต่ละ server
        const memoryConfig = {
            server_id: server.name,
            memory_sharing: {
                enabled: true,
                bridge_url: this.bridgeUrl,
                sync_interval: 30000,
                categories: {
                    'mcp-tools': { enabled: true, priority: 'high' },
                    'server-data': { enabled: true, priority: 'medium' },
                    'shared-resources': { enabled: true, priority: 'low' },
                    'performance-metrics': { enabled: true, priority: 'medium' }
                }
            },
            git_memory: {
                path: this.gitMemoryPath,
                auto_commit: true,
                sync_on_change: true
            },
            updated: new Date().toISOString()
        };

        // บันทึก config ลงใน shared memory
        const configPath = path.join(__dirname, '.git-memory/config', `${server.name}-memory.json`);
        fs.writeFileSync(configPath, JSON.stringify(memoryConfig, null, 2));
        
        return memoryConfig;
    }

    async startGitMemoryBridge() {
        console.log('🌉 Starting Git Memory Bridge...');
        
        try {
            // ตรวจสอบว่า bridge ทำงานอยู่หรือไม่
            const isBridgeRunning = await this.checkServerHealth(this.bridgeUrl);
            
            if (!isBridgeRunning) {
                console.log('🚀 Starting Git Memory Bridge process...');
                
                const bridgeProcess = spawn('node', ['git-memory-bridge.js'], {
                    cwd: __dirname,
                    detached: true,
                    stdio: 'ignore'
                });
                
                bridgeProcess.unref();
                
                // รอให้ bridge เริ่มทำงาน
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const isNowRunning = await this.checkServerHealth(this.bridgeUrl);
                if (isNowRunning) {
                    console.log('✅ Git Memory Bridge started successfully');
                    return true;
                } else {
                    console.log('⚠️  Git Memory Bridge may not be fully ready');
                    return false;
                }
            } else {
                console.log('✅ Git Memory Bridge is already running');
                return true;
            }
        } catch (error) {
            console.error('❌ Error starting Git Memory Bridge:', error);
            return false;
        }
    }

    async syncAllServersWithBridge() {
        console.log('🔄 Syncing all servers with Git Memory Bridge...');
        
        try {
            // เชื่อมต่อ servers ทั้งหมดกับ bridge
            for (const server of this.servers) {
                await this.connectServerToBridge(server);
            }
            
            // ทำการ sync ข้อมูล
            const syncResult = await this.triggerBridgeSync();
            console.log('✅ All servers synced with Git Memory Bridge');
            return syncResult;
        } catch (error) {
            console.error('❌ Error syncing servers with bridge:', error);
            return false;
        }
    }

    async connectServerToBridge(server) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                serverUrl: server.url,
                serverType: server.category
            });

            const options = {
                hostname: 'localhost',
                port: 3100,
                path: `/connect/${server.name}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 5000
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch (e) {
                        resolve({ success: false, error: 'Invalid response' });
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Connection timeout')));
            req.write(postData);
            req.end();
        });
    }

    async triggerBridgeSync() {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3100,
                path: '/sync',
                method: 'POST',
                timeout: 10000
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch (e) {
                        resolve({ success: false, error: 'Invalid response' });
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Sync timeout')));
            req.end();
        });
    }

    async generateUpdateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total_servers: this.updateResults.total,
                updated_servers: this.updateResults.updated,
                failed_servers: this.updateResults.failed,
                success_rate: ((this.updateResults.updated / this.updateResults.total) * 100).toFixed(2) + '%'
            },
            git_memory: {
                structure_updated: true,
                bridge_running: await this.checkServerHealth(this.bridgeUrl),
                shared_categories: ['mcp-tools', 'server-data', 'shared-resources', 'performance-metrics', 'security-data']
            },
            errors: this.updateResults.errors,
            next_steps: [
                'Monitor server memory sharing performance',
                'Check bridge sync logs regularly',
                'Verify data consistency across servers'
            ]
        };

        fs.writeFileSync(
            path.join(__dirname, 'git-memory-update-report.json'),
            JSON.stringify(report, null, 2)
        );

        return report;
    }

    async run() {
        console.log('🚀 Starting Git Memory Update for All Servers');
        console.log('='.repeat(50));
        console.log(`📊 Total servers to update: ${this.servers.length}`);
        console.log('='.repeat(50));

        try {
            // 1. อัปเดต Git Memory structure
            const structureUpdated = await this.updateGitMemoryStructure();
            if (!structureUpdated) {
                throw new Error('Failed to update Git Memory structure');
            }

            // 2. สร้าง server memory entries
            const entriesCreated = await this.createServerMemoryEntries();
            if (!entriesCreated) {
                throw new Error('Failed to create server memory entries');
            }

            // 3. เริ่ม Git Memory Bridge
            const bridgeStarted = await this.startGitMemoryBridge();
            if (!bridgeStarted) {
                console.log('⚠️  Bridge may not be fully ready, continuing...');
            }

            // 4. อัปเดต server memory sharing
            await this.updateServerMemorySharing();

            // 5. Sync ทุก servers กับ bridge
            await this.syncAllServersWithBridge();

            // 6. สร้าง report
            const report = await this.generateUpdateReport();

            console.log('\n🎉 Git Memory Update Completed!');
            console.log('='.repeat(50));
            console.log(`✅ Updated: ${report.summary.updated_servers}/${report.summary.total_servers} servers`);
            console.log(`📈 Success rate: ${report.summary.success_rate}`);
            console.log(`🌉 Bridge status: ${report.git_memory.bridge_running ? 'Running' : 'Not running'}`);
            console.log('='.repeat(50));
            console.log('📄 Full report saved to: git-memory-update-report.json');

            if (this.updateResults.errors.length > 0) {
                console.log('\n⚠️  Errors encountered:');
                this.updateResults.errors.forEach(error => console.log(`   - ${error}`));
            }

        } catch (error) {
            console.error('❌ Git Memory update failed:', error);
            process.exit(1);
        }
    }
}

// Main execution
async function main() {
    const updater = new GitMemoryUpdater();
    await updater.run();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = GitMemoryUpdater;