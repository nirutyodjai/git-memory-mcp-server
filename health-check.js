#!/usr/bin/env node
/**
 * NEXUS IDE - Health Check System
 * ระบบตรวจสอบสุขภาพของ NEXUS IDE และ MCP Servers
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const os = require('os');

// Health Check Configuration
const HEALTH_CONFIG = {
    name: 'NEXUS IDE Health Monitor',
    version: '1.0.0',
    
    // Services to monitor
    services: {
        webServer: {
            name: 'NEXUS Web Server',
            url: 'http://localhost:8080/health',
            timeout: 5000,
            critical: true
        },
        dashboard: {
            name: 'System Dashboard',
            url: 'http://localhost:3000/health',
            timeout: 5000,
            critical: false
        },
        testDashboard: {
            name: 'Test Dashboard',
            url: 'http://localhost:3001/health',
            timeout: 5000,
            critical: false
        }
    },
    
    // System checks
    systemChecks: {
        memory: {
            name: 'Memory Usage',
            threshold: 90, // percentage
            critical: true
        },
        disk: {
            name: 'Disk Space',
            threshold: 90, // percentage
            critical: true
        },
        cpu: {
            name: 'CPU Usage',
            threshold: 95, // percentage
            critical: false
        },
        processes: {
            name: 'Process Count',
            threshold: 1000,
            critical: false
        }
    },
    
    // File checks
    fileChecks: {
        'nexus-web-server.js': { critical: true },
        'git-memory-coordinator.js': { critical: true },
        'nexus-system-dashboard.js': { critical: false },
        'package.json': { critical: true },
        '.env': { critical: false },
        'data/': { critical: true, type: 'directory' },
        'logs/': { critical: true, type: 'directory' }
    },
    
    // Thresholds
    thresholds: {
        responseTime: 2000, // ms
        errorRate: 5, // percentage
        uptime: 99.9 // percentage
    }
};

class HealthChecker {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            overall: 'unknown',
            services: {},
            system: {},
            files: {},
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            },
            recommendations: []
        };
        
        this.startTime = Date.now();
    }

    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            warning: '\x1b[33m',
            error: '\x1b[31m',
            reset: '\x1b[0m'
        };
        
        console.log(`${colors[type]}${message}${colors.reset}`);
    }

    async checkServices() {
        this.log('🔍 Checking services health...', 'info');
        
        for (const [key, service] of Object.entries(HEALTH_CONFIG.services)) {
            try {
                const result = await this.checkService(service);
                this.results.services[key] = result;
                
                if (result.status === 'healthy') {
                    this.log(`✅ ${service.name}: ${result.status} (${result.responseTime}ms)`, 'success');
                    this.results.summary.passed++;
                } else if (result.status === 'warning') {
                    this.log(`⚠️  ${service.name}: ${result.message}`, 'warning');
                    this.results.summary.warnings++;
                } else {
                    this.log(`❌ ${service.name}: ${result.message}`, 'error');
                    this.results.summary.failed++;
                    
                    if (service.critical) {
                        this.results.recommendations.push(`Critical service ${service.name} is down - immediate attention required`);
                    }
                }
                
            } catch (error) {
                this.results.services[key] = {
                    status: 'error',
                    message: error.message,
                    timestamp: new Date().toISOString()
                };
                
                this.log(`❌ ${service.name}: ${error.message}`, 'error');
                this.results.summary.failed++;
            }
            
            this.results.summary.total++;
        }
    }

    async checkService(service) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const url = new URL(service.url);
            const client = url.protocol === 'https:' ? https : http;
            
            const req = client.get(service.url, {
                timeout: service.timeout
            }, (res) => {
                const responseTime = Date.now() - startTime;
                let data = '';
                
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve({
                            status: responseTime > HEALTH_CONFIG.thresholds.responseTime ? 'warning' : 'healthy',
                            responseTime,
                            statusCode: res.statusCode,
                            message: responseTime > HEALTH_CONFIG.thresholds.responseTime ? 'Slow response time' : 'OK',
                            timestamp: new Date().toISOString()
                        });
                    } else {
                        resolve({
                            status: 'unhealthy',
                            responseTime,
                            statusCode: res.statusCode,
                            message: `HTTP ${res.statusCode}`,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({
                    status: 'unhealthy',
                    message: 'Timeout',
                    timeout: service.timeout,
                    timestamp: new Date().toISOString()
                });
            });
            
            req.on('error', (error) => {
                resolve({
                    status: 'unhealthy',
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            });
        });
    }

    async checkSystemHealth() {
        this.log('🖥️  Checking system health...', 'info');
        
        // Memory check
        const memoryUsage = this.getMemoryUsage();
        this.results.system.memory = {
            usage: memoryUsage,
            threshold: HEALTH_CONFIG.systemChecks.memory.threshold,
            status: memoryUsage > HEALTH_CONFIG.systemChecks.memory.threshold ? 'warning' : 'healthy',
            message: `Memory usage: ${memoryUsage.toFixed(1)}%`
        };
        
        if (memoryUsage > HEALTH_CONFIG.systemChecks.memory.threshold) {
            this.log(`⚠️  High memory usage: ${memoryUsage.toFixed(1)}%`, 'warning');
            this.results.summary.warnings++;
            this.results.recommendations.push('Consider restarting services or adding more memory');
        } else {
            this.log(`✅ Memory usage: ${memoryUsage.toFixed(1)}%`, 'success');
            this.results.summary.passed++;
        }
        
        // Disk space check
        const diskUsage = await this.getDiskUsage();
        this.results.system.disk = {
            usage: diskUsage,
            threshold: HEALTH_CONFIG.systemChecks.disk.threshold,
            status: diskUsage > HEALTH_CONFIG.systemChecks.disk.threshold ? 'warning' : 'healthy',
            message: `Disk usage: ${diskUsage.toFixed(1)}%`
        };
        
        if (diskUsage > HEALTH_CONFIG.systemChecks.disk.threshold) {
            this.log(`⚠️  High disk usage: ${diskUsage.toFixed(1)}%`, 'warning');
            this.results.summary.warnings++;
            this.results.recommendations.push('Clean up old files or add more disk space');
        } else {
            this.log(`✅ Disk usage: ${diskUsage.toFixed(1)}%`, 'success');
            this.results.summary.passed++;
        }
        
        // CPU check
        const cpuUsage = await this.getCPUUsage();
        this.results.system.cpu = {
            usage: cpuUsage,
            threshold: HEALTH_CONFIG.systemChecks.cpu.threshold,
            status: cpuUsage > HEALTH_CONFIG.systemChecks.cpu.threshold ? 'warning' : 'healthy',
            message: `CPU usage: ${cpuUsage.toFixed(1)}%`
        };
        
        if (cpuUsage > HEALTH_CONFIG.systemChecks.cpu.threshold) {
            this.log(`⚠️  High CPU usage: ${cpuUsage.toFixed(1)}%`, 'warning');
            this.results.summary.warnings++;
            this.results.recommendations.push('Check for resource-intensive processes');
        } else {
            this.log(`✅ CPU usage: ${cpuUsage.toFixed(1)}%`, 'success');
            this.results.summary.passed++;
        }
        
        // Process count
        const processCount = this.getProcessCount();
        this.results.system.processes = {
            count: processCount,
            threshold: HEALTH_CONFIG.systemChecks.processes.threshold,
            status: processCount > HEALTH_CONFIG.systemChecks.processes.threshold ? 'warning' : 'healthy',
            message: `Active processes: ${processCount}`
        };
        
        if (processCount > HEALTH_CONFIG.systemChecks.processes.threshold) {
            this.log(`⚠️  High process count: ${processCount}`, 'warning');
            this.results.summary.warnings++;
        } else {
            this.log(`✅ Process count: ${processCount}`, 'success');
            this.results.summary.passed++;
        }
        
        this.results.summary.total += 4;
    }

    getMemoryUsage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        return (usedMemory / totalMemory) * 100;
    }

    async getDiskUsage() {
        try {
            if (os.platform() === 'win32') {
                // Windows
                const output = execSync('wmic logicaldisk get size,freespace,caption', { encoding: 'utf8' });
                const lines = output.split('\n').filter(line => line.trim() && !line.includes('Caption'));
                
                let totalSize = 0;
                let totalFree = 0;
                
                lines.forEach(line => {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 3) {
                        const free = parseInt(parts[1]) || 0;
                        const size = parseInt(parts[2]) || 0;
                        totalFree += free;
                        totalSize += size;
                    }
                });
                
                return totalSize > 0 ? ((totalSize - totalFree) / totalSize) * 100 : 0;
            } else {
                // Unix-like systems
                const output = execSync('df -h /', { encoding: 'utf8' });
                const lines = output.split('\n');
                if (lines.length > 1) {
                    const parts = lines[1].split(/\s+/);
                    const usage = parts[4];
                    return parseFloat(usage.replace('%', ''));
                }
            }
        } catch (error) {
            return 0;
        }
        return 0;
    }

    async getCPUUsage() {
        return new Promise((resolve) => {
            const startUsage = process.cpuUsage();
            const startTime = Date.now();
            
            setTimeout(() => {
                const currentUsage = process.cpuUsage(startUsage);
                const elapsedTime = Date.now() - startTime;
                
                const cpuPercent = ((currentUsage.user + currentUsage.system) / 1000 / elapsedTime) * 100;
                resolve(Math.min(cpuPercent, 100));
            }, 1000);
        });
    }

    getProcessCount() {
        try {
            if (os.platform() === 'win32') {
                const output = execSync('tasklist /fo csv | find /c /v ""', { encoding: 'utf8' });
                return parseInt(output.trim()) - 1; // Subtract header
            } else {
                const output = execSync('ps aux | wc -l', { encoding: 'utf8' });
                return parseInt(output.trim()) - 1; // Subtract header
            }
        } catch (error) {
            return 0;
        }
    }

    async checkFiles() {
        this.log('📁 Checking critical files...', 'info');
        
        for (const [filePath, config] of Object.entries(HEALTH_CONFIG.fileChecks)) {
            const fullPath = path.resolve(filePath);
            const exists = fs.existsSync(fullPath);
            
            let status = 'healthy';
            let message = 'OK';
            
            if (!exists) {
                status = config.critical ? 'error' : 'warning';
                message = 'File not found';
            } else if (config.type === 'directory') {
                const stats = fs.statSync(fullPath);
                if (!stats.isDirectory()) {
                    status = 'error';
                    message = 'Expected directory, found file';
                }
            }
            
            this.results.files[filePath] = {
                exists,
                status,
                message,
                critical: config.critical,
                path: fullPath,
                timestamp: new Date().toISOString()
            };
            
            if (status === 'healthy') {
                this.log(`✅ ${filePath}: ${message}`, 'success');
                this.results.summary.passed++;
            } else if (status === 'warning') {
                this.log(`⚠️  ${filePath}: ${message}`, 'warning');
                this.results.summary.warnings++;
            } else {
                this.log(`❌ ${filePath}: ${message}`, 'error');
                this.results.summary.failed++;
                
                if (config.critical) {
                    this.results.recommendations.push(`Critical file missing: ${filePath}`);
                }
            }
            
            this.results.summary.total++;
        }
    }

    calculateOverallHealth() {
        const { total, passed, failed, warnings } = this.results.summary;
        
        if (failed > 0) {
            // Check if any critical services/files failed
            const criticalFailures = [
                ...Object.values(this.results.services).filter(s => s.status === 'unhealthy'),
                ...Object.values(this.results.files).filter(f => f.critical && f.status === 'error')
            ];
            
            if (criticalFailures.length > 0) {
                this.results.overall = 'critical';
            } else {
                this.results.overall = 'unhealthy';
            }
        } else if (warnings > 0) {
            this.results.overall = 'warning';
        } else {
            this.results.overall = 'healthy';
        }
        
        this.results.healthScore = Math.round((passed / total) * 100);
    }

    async generateReport() {
        const duration = Date.now() - this.startTime;
        
        console.log('\n' + '='.repeat(70));
        console.log('🏥 NEXUS IDE Health Check Report');
        console.log('='.repeat(70));
        
        console.log(`\n📊 Overall Health: ${this.getStatusIcon(this.results.overall)} ${this.results.overall.toUpperCase()}`);
        console.log(`📈 Health Score: ${this.results.healthScore}%`);
        console.log(`⏱️  Check Duration: ${duration}ms`);
        console.log(`📅 Timestamp: ${this.results.timestamp}`);
        
        console.log('\n📋 Summary:');
        console.log(`   Total Checks: ${this.results.summary.total}`);
        console.log(`   ✅ Passed: ${this.results.summary.passed}`);
        console.log(`   ⚠️  Warnings: ${this.results.summary.warnings}`);
        console.log(`   ❌ Failed: ${this.results.summary.failed}`);
        
        if (this.results.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            this.results.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }
        
        console.log('\n' + '='.repeat(70));
        
        // Save report to file
        const reportPath = path.join('logs', 'health-check.json');
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs', { recursive: true });
        }
        
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`📄 Detailed report saved to: ${reportPath}`);
        
        return this.results;
    }

    getStatusIcon(status) {
        const icons = {
            healthy: '✅',
            warning: '⚠️ ',
            unhealthy: '❌',
            critical: '🚨',
            error: '❌'
        };
        return icons[status] || '❓';
    }

    async run() {
        try {
            console.log('🏥 Starting NEXUS IDE Health Check...');
            console.log('='.repeat(50));
            
            await this.checkServices();
            await this.checkSystemHealth();
            await this.checkFiles();
            
            this.calculateOverallHealth();
            await this.generateReport();
            
            // Exit with appropriate code
            if (this.results.overall === 'critical') {
                process.exit(2);
            } else if (this.results.overall === 'unhealthy') {
                process.exit(1);
            } else {
                process.exit(0);
            }
            
        } catch (error) {
            console.error('💥 Health check failed:', error);
            process.exit(3);
        }
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        verbose: args.includes('--verbose') || args.includes('-v'),
        json: args.includes('--json'),
        continuous: args.includes('--continuous'),
        interval: 30000 // 30 seconds
    };
    
    const healthChecker = new HealthChecker();
    
    if (options.continuous) {
        console.log(`🔄 Running continuous health checks every ${options.interval / 1000} seconds...`);
        console.log('Press Ctrl+C to stop\n');
        
        const runCheck = async () => {
            try {
                await healthChecker.run();
            } catch (error) {
                console.error('Health check error:', error.message);
            }
            
            setTimeout(runCheck, options.interval);
        };
        
        runCheck();
    } else {
        healthChecker.run();
    }
}

module.exports = HealthChecker;