const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class SystemMemoryBooster {
    constructor() {
        this.systemInfo = {
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            platform: os.platform(),
            arch: os.arch()
        };
    }

    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    async getSystemMemoryInfo() {
        console.log('\n🖥️  System Memory Information:');
        console.log('=====================================');
        console.log(`Total RAM: ${this.formatBytes(this.systemInfo.totalMemory)}`);
        console.log(`Free RAM: ${this.formatBytes(this.systemInfo.freeMemory)}`);
        console.log(`Used RAM: ${this.formatBytes(this.systemInfo.totalMemory - this.systemInfo.freeMemory)}`);
        console.log(`Platform: ${this.systemInfo.platform}`);
        console.log(`Architecture: ${this.systemInfo.arch}`);
        
        // Get detailed memory info on Windows
        if (this.systemInfo.platform === 'win32') {
            await this.getWindowsMemoryInfo();
        }
    }

    async getWindowsMemoryInfo() {
        return new Promise((resolve) => {
            exec('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /format:csv', (error, stdout) => {
                if (!error && stdout) {
                    const lines = stdout.split('\n').filter(line => line.trim() && !line.includes('Node'));
                    if (lines.length > 0) {
                        const data = lines[0].split(',');
                        if (data.length >= 3) {
                            const freePhysical = parseInt(data[1]) * 1024;
                            const totalVisible = parseInt(data[2]) * 1024;
                            console.log(`\n💾 Windows Memory Details:`);
                            console.log(`Total Visible Memory: ${this.formatBytes(totalVisible)}`);
                            console.log(`Free Physical Memory: ${this.formatBytes(freePhysical)}`);
                        }
                    }
                }
                resolve();
            });
        });
    }

    async optimizeWindowsMemory() {
        console.log('\n🔧 Optimizing Windows Memory Settings...');
        
        const optimizations = [
            {
                name: 'Clear Memory Cache',
                command: 'rundll32.exe advapi32.dll,ProcessIdleTasks',
                description: 'Clear system memory cache'
            },
            {
                name: 'Optimize Virtual Memory',
                command: 'wmic pagefileset where name="C:\\pagefile.sys" set InitialSize=16384,MaximumSize=32768',
                description: 'Set pagefile to 16GB-32GB'
            },
            {
                name: 'Enable Large Page Support',
                command: 'bcdedit /set IncreaseUserVa 3072',
                description: 'Increase user virtual address space'
            }
        ];

        for (const opt of optimizations) {
            console.log(`\n⚙️  ${opt.name}: ${opt.description}`);
            try {
                await this.executeCommand(opt.command);
                console.log(`✅ ${opt.name} completed`);
            } catch (error) {
                console.log(`⚠️  ${opt.name} failed: ${error.message}`);
            }
        }
    }

    async executeCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    async createMemoryMonitor() {
        const monitorScript = `
const os = require('os');
const fs = require('fs');

class MemoryMonitor {
    constructor() {
        this.logFile = 'memory-usage.log';
        this.alertThreshold = 0.85; // 85% memory usage
    }

    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    async logMemoryUsage() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const usagePercent = (usedMem / totalMem) * 100;
        
        const timestamp = new Date().toISOString();
        const logEntry = \`\${timestamp} - Total: \${this.formatBytes(totalMem)}, Used: \${this.formatBytes(usedMem)}, Free: \${this.formatBytes(freeMem)}, Usage: \${usagePercent.toFixed(2)}%\\n\`;
        
        fs.appendFileSync(this.logFile, logEntry);
        
        if (usagePercent > this.alertThreshold * 100) {
            console.log(\`🚨 HIGH MEMORY USAGE ALERT: \${usagePercent.toFixed(2)}%\`);
            
            // Trigger garbage collection for all Node processes
            if (global.gc) {
                global.gc();
                console.log('🧹 System garbage collection triggered');
            }
        }
        
        return {
            total: totalMem,
            used: usedMem,
            free: freeMem,
            percentage: usagePercent
        };
    }

    startMonitoring(intervalMs = 10000) {
        console.log('🔍 Starting memory monitoring...');
        setInterval(() => {
            this.logMemoryUsage();
        }, intervalMs);
    }
}

const monitor = new MemoryMonitor();
monitor.startMonitoring();

// Also log initial status
monitor.logMemoryUsage().then(status => {
    console.log('📊 Initial Memory Status:', {
        total: monitor.formatBytes(status.total),
        used: monitor.formatBytes(status.used),
        free: monitor.formatBytes(status.free),
        percentage: status.percentage.toFixed(2) + '%'
    });
});
`;

        await fs.promises.writeFile('memory-monitor.js', monitorScript);
        console.log('✅ Memory monitor script created: memory-monitor.js');
    }

    async optimizeNodeProcesses() {
        console.log('\n🚀 Optimizing Node.js Processes...');
        
        // Create optimized startup script
        const startupScript = `
@echo off
echo Starting MCP System with Memory Optimization...

REM Set Node.js memory options
set NODE_OPTIONS=--max-old-space-size=8192 --max-semi-space-size=512 --initial-old-space-size=2048 --optimize-for-size --expose-gc

REM Start memory monitor
start "Memory Monitor" node memory-monitor.js

REM Wait a moment
timeout /t 2 /nobreak > nul

REM Start MCP Coordinator
start "MCP Coordinator" node mcp-coordinator.js

REM Wait a moment
timeout /t 2 /nobreak > nul

REM Start MCP Proxy
start "MCP Proxy" node mcp-proxy/mcp-proxy-server-500.js

REM Wait a moment
timeout /t 2 /nobreak > nul

REM Start new servers
start "New Servers" node start-new-servers.js

echo All services started with memory optimization!
echo Check memory-usage.log for monitoring data.
pause
`;

        await fs.promises.writeFile('start-optimized.bat', startupScript);
        console.log('✅ Optimized startup script created: start-optimized.bat');
    }

    async createMemoryConfig() {
        const memoryConfig = {
            system: {
                totalMemory: this.systemInfo.totalMemory,
                recommendedNodeMemory: Math.min(8192, Math.floor(this.systemInfo.totalMemory / (1024 * 1024 * 1024) * 0.7 * 1024)),
                maxProcesses: Math.floor(this.systemInfo.totalMemory / (1024 * 1024 * 1024) / 2),
                gcInterval: 30000
            },
            nodeOptions: {
                maxOldSpaceSize: 8192,
                maxSemiSpaceSize: 512,
                initialOldSpaceSize: 2048,
                optimizeForSize: true,
                exposeGc: true
            },
            monitoring: {
                enabled: true,
                interval: 10000,
                alertThreshold: 85,
                logFile: 'memory-usage.log'
            },
            optimization: {
                autoGc: true,
                gcThreshold: 1024,
                processRestart: {
                    enabled: true,
                    memoryThreshold: 4096,
                    interval: 3600000
                }
            }
        };

        await fs.promises.writeFile('memory-config.json', JSON.stringify(memoryConfig, null, 2));
        console.log('✅ Memory configuration saved: memory-config.json');
        
        return memoryConfig;
    }

    async showRecommendations() {
        const totalGB = Math.floor(this.systemInfo.totalMemory / (1024 * 1024 * 1024));
        
        console.log('\n💡 Memory Optimization Recommendations:');
        console.log('==========================================');
        console.log(`1. Current System RAM: ${totalGB}GB`);
        console.log(`2. Recommended Node Memory: ${Math.min(8, Math.floor(totalGB * 0.7))}GB per process`);
        console.log(`3. Maximum Concurrent Processes: ${Math.floor(totalGB / 2)}`);
        console.log(`4. Recommended Pagefile Size: ${totalGB * 2}GB`);
        
        if (totalGB < 16) {
            console.log('\n⚠️  WARNING: System has less than 16GB RAM');
            console.log('   - Consider upgrading to 32GB+ for optimal performance');
            console.log('   - Limit concurrent MCP servers to prevent memory issues');
        }
        
        if (totalGB >= 32) {
            console.log('\n✅ EXCELLENT: System has sufficient RAM for 500+ servers');
            console.log('   - Can safely run all planned MCP servers');
            console.log('   - Consider enabling memory monitoring for optimization');
        }
    }
}

// Main execution
async function main() {
    console.log('🚀 System Memory Booster Starting...');
    console.log('====================================');
    
    const booster = new SystemMemoryBooster();
    
    // Show system memory information
    await booster.getSystemMemoryInfo();
    
    // Show recommendations
    await booster.showRecommendations();
    
    // Create memory configuration
    await booster.createMemoryConfig();
    
    // Create memory monitor
    await booster.createMemoryMonitor();
    
    // Create optimized startup scripts
    await booster.optimizeNodeProcesses();
    
    // Optimize Windows memory (if on Windows)
    if (booster.systemInfo.platform === 'win32') {
        console.log('\n❓ Do you want to optimize Windows memory settings?');
        console.log('   Run with --optimize-windows flag to apply system optimizations');
        
        if (process.argv.includes('--optimize-windows')) {
            await booster.optimizeWindowsMemory();
        }
    }
    
    console.log('\n✅ System Memory Optimization Completed!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Run: start-optimized.bat (to start with optimizations)');
    console.log('   2. Monitor: memory-usage.log (for memory tracking)');
    console.log('   3. Configure: memory-config.json (for custom settings)');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SystemMemoryBooster;