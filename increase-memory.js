const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class MemoryManager {
    constructor() {
        this.configPath = path.join(__dirname, 'mcp-coordinator-config.json');
        this.memoryOptions = {
            maxOldSpace: 8192,  // 8GB
            maxSemiSpace: 512,  // 512MB
            initialOldSpace: 2048, // 2GB
            gcInterval: 100
        };
    }

    async loadConfig() {
        try {
            const data = await fs.promises.readFile(this.configPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading config:', error);
            return null;
        }
    }

    async saveConfig(config) {
        try {
            await fs.promises.writeFile(this.configPath, JSON.stringify(config, null, 2));
            console.log('✅ Configuration saved successfully');
        } catch (error) {
            console.error('❌ Error saving config:', error);
        }
    }

    generateNodeOptions() {
        return [
            `--max-old-space-size=${this.memoryOptions.maxOldSpace}`,
            `--max-semi-space-size=${this.memoryOptions.maxSemiSpace}`,
            `--initial-old-space-size=${this.memoryOptions.initialOldSpace}`,
            '--optimize-for-size',
            '--gc-interval=' + this.memoryOptions.gcInterval,
            '--expose-gc'
        ];
    }

    async updateServerScripts() {
        const config = await this.loadConfig();
        if (!config) return;

        let updatedCount = 0;
        const nodeOptions = this.generateNodeOptions();

        // Update all MCP servers with memory optimization
        for (const [serverId, serverConfig] of config.mcpServers) {
            if (serverConfig.scriptPath && fs.existsSync(serverConfig.scriptPath)) {
                try {
                    let content = await fs.promises.readFile(serverConfig.scriptPath, 'utf8');
                    
                    // Add memory monitoring and optimization
                    const memoryOptimization = `
// Memory Optimization Settings
process.env.NODE_OPTIONS = '${nodeOptions.join(' ')}';

// Memory monitoring
setInterval(() => {
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 1024 * 1024 * 1024) { // 1GB threshold
        if (global.gc) {
            global.gc();
            console.log('🧹 Garbage collection triggered for', process.pid);
        }
    }
}, 30000); // Check every 30 seconds

// Original server code starts here
`;

                    // Only add if not already present
                    if (!content.includes('Memory Optimization Settings')) {
                        content = memoryOptimization + content;
                        await fs.promises.writeFile(serverConfig.scriptPath, content);
                        updatedCount++;
                        console.log(`✅ Updated memory settings for ${serverId}`);
                    }
                } catch (error) {
                    console.error(`❌ Error updating ${serverId}:`, error.message);
                }
            }
        }

        console.log(`\n📊 Memory optimization completed:`);
        console.log(`   - Updated ${updatedCount} server scripts`);
        console.log(`   - Max Old Space: ${this.memoryOptions.maxOldSpace}MB`);
        console.log(`   - Max Semi Space: ${this.memoryOptions.maxSemiSpace}MB`);
        console.log(`   - Initial Old Space: ${this.memoryOptions.initialOldSpace}MB`);
    }

    async restartServers() {
        console.log('\n🔄 Restarting servers with new memory settings...');
        
        // Stop current processes
        const processes = await this.getNodeProcesses();
        for (const proc of processes) {
            try {
                process.kill(proc.pid, 'SIGTERM');
                console.log(`🛑 Stopped process ${proc.pid}`);
            } catch (error) {
                console.log(`⚠️  Process ${proc.pid} already stopped`);
            }
        }

        // Wait for processes to stop
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Restart coordinator with new memory settings
        const nodeOptions = this.generateNodeOptions();
        const coordinator = spawn('node', [...nodeOptions, 'mcp-coordinator.js'], {
            stdio: 'inherit',
            env: { ...process.env, NODE_OPTIONS: nodeOptions.join(' ') }
        });

        console.log(`🚀 Restarted MCP Coordinator with PID: ${coordinator.pid}`);
        
        // Restart proxy server
        const proxy = spawn('node', [...nodeOptions, 'mcp-proxy/mcp-proxy-server-500.js'], {
            stdio: 'inherit',
            env: { ...process.env, NODE_OPTIONS: nodeOptions.join(' ') }
        });

        console.log(`🚀 Restarted MCP Proxy with PID: ${proxy.pid}`);
    }

    async getNodeProcesses() {
        return new Promise((resolve) => {
            const { exec } = require('child_process');
            exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', (error, stdout) => {
                if (error) {
                    resolve([]);
                    return;
                }
                
                const lines = stdout.split('\n').slice(1);
                const processes = lines
                    .filter(line => line.trim())
                    .map(line => {
                        const parts = line.split(',');
                        return {
                            name: parts[0]?.replace(/"/g, ''),
                            pid: parseInt(parts[1]?.replace(/"/g, ''))
                        };
                    })
                    .filter(proc => proc.pid && !isNaN(proc.pid));
                
                resolve(processes);
            });
        });
    }

    async showMemoryStatus() {
        console.log('\n📊 Current Memory Status:');
        const processes = await this.getNodeProcesses();
        
        for (const proc of processes) {
            try {
                const { exec } = require('child_process');
                exec(`tasklist /FI "PID eq ${proc.pid}" /FO CSV`, (error, stdout) => {
                    if (!error && stdout) {
                        const lines = stdout.split('\n');
                        if (lines[1]) {
                            const parts = lines[1].split(',');
                            const memory = parts[4]?.replace(/"/g, '').replace(/,/g, '');
                            console.log(`   PID ${proc.pid}: ${memory} KB`);
                        }
                    }
                });
            } catch (error) {
                console.log(`   PID ${proc.pid}: Unable to get memory info`);
            }
        }
    }
}

// Main execution
async function main() {
    console.log('🚀 MCP Memory Manager Starting...');
    console.log('=====================================');
    
    const memoryManager = new MemoryManager();
    
    // Show current memory status
    await memoryManager.showMemoryStatus();
    
    // Update server scripts with memory optimization
    await memoryManager.updateServerScripts();
    
    // Ask user if they want to restart servers
    console.log('\n⚠️  To apply memory changes, servers need to be restarted.');
    console.log('   Run this script with --restart flag to restart servers automatically.');
    
    if (process.argv.includes('--restart')) {
        await memoryManager.restartServers();
    }
    
    console.log('\n✅ Memory optimization completed!');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = MemoryManager;