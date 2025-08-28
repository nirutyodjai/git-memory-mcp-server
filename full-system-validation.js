#!/usr/bin/env node

const http = require('http');
const os = require('os');

class FullSystemValidator {
    constructor() {
        this.config = {
            communityStart: 9000,
            communityEnd: 9345,
            securityStart: 9346,
            securityEnd: 9499,
            timeout: 2000,
            batchSize: 50
        };
    }

    async testPort(port) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const req = http.request({
                hostname: 'localhost',
                port: port,
                path: '/health',
                method: 'GET',
                timeout: this.config.timeout
            }, (res) => {
                const responseTime = Date.now() - startTime;
                resolve({ port, status: 'healthy', responseTime });
            });

            req.on('error', () => {
                resolve({ port, status: 'failed', responseTime: 0 });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({ port, status: 'failed', responseTime: 0 });
            });

            req.end();
        });
    }

    async testPortBatch(ports) {
        const promises = ports.map(port => this.testPort(port));
        return Promise.all(promises);
    }

    createBatches(start, end, batchSize) {
        const batches = [];
        for (let i = start; i <= end; i += batchSize) {
            const batchEnd = Math.min(i + batchSize - 1, end);
            batches.push({ start: i, end: batchEnd });
        }
        return batches;
    }

    async validateServerRange(start, end, serverType, emoji) {
        const totalServers = end - start + 1;
        
        console.log(`Testing ports ${start}-${end}...`);
        console.log('');
        
        const batches = this.createBatches(start, end, this.config.batchSize);
        let totalHealthy = 0;
        let totalFailed = 0;
        let totalResponseTime = 0;
        let healthyCount = 0;
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const batchNumber = i + 1;
            const totalBatches = batches.length;
            const batchSize = batch.end - batch.start + 1;
            
            console.log(`Testing batch ${batchNumber}/${totalBatches} (ports ${batch.start}-${batch.end})...`);
            
            const ports = [];
            for (let port = batch.start; port <= batch.end; port++) {
                ports.push(port);
            }
            
            const results = await this.testPortBatch(ports);
            
            let statusLine = '';
            
            results.forEach(result => {
                if (result.status === 'healthy') {
                    totalHealthy++;
                    totalResponseTime += result.responseTime;
                    healthyCount++;
                    statusLine += '✅';
                } else {
                    totalFailed++;
                    statusLine += '❌';
                }
            });
            
            console.log(`${statusLine} (${batchSize} servers)`);
        }
        
        console.log('');
        console.log(`${emoji} ${serverType.toUpperCase()} SERVERS VALIDATION COMPLETE`);
        console.log('================================================================================');
        console.log(`📊 Total ${serverType} Servers: ${totalServers}`);
        console.log(`✅ Healthy: ${totalHealthy} (${((totalHealthy/totalServers)*100).toFixed(1)}%)`);
        console.log(`❌ Failed: ${totalFailed} (${((totalFailed/totalServers)*100).toFixed(1)}%)`);
        
        if (healthyCount > 0) {
            const avgResponseTime = Math.round(totalResponseTime / healthyCount);
            console.log(`⚡ Average Response Time: ${avgResponseTime}ms`);
        }
        
        console.log('');
        
        return {
            total: totalServers,
            healthy: totalHealthy,
            failed: totalFailed,
            successRate: (totalHealthy / totalServers) * 100,
            avgResponseTime: healthyCount > 0 ? Math.round(totalResponseTime / healthyCount) : 0
        };
    }

    async validateFullSystem() {
        console.log('🚀 FULL SYSTEM VALIDATION');
        console.log('================================================================================');
        console.log('');
        
        // Test Community Servers
        console.log('🌐 COMMUNITY SERVERS VALIDATION');
        console.log('================================================================================');
        console.log('');
        const communityResults = await this.validateServerRange(
            this.config.communityStart, 
            this.config.communityEnd, 
            'Community', 
            '🌐'
        );
        
        // Test Security Servers
        console.log('🔒 SECURITY SERVERS VALIDATION');
        console.log('================================================================================');
        console.log('');
        const securityResults = await this.validateServerRange(
            this.config.securityStart, 
            this.config.securityEnd, 
            'Security', 
            '🔒'
        );
        
        // Overall System Summary
        const totalServers = communityResults.total + securityResults.total;
        const totalHealthy = communityResults.healthy + securityResults.healthy;
        const totalFailed = communityResults.failed + securityResults.failed;
        const overallSuccessRate = (totalHealthy / totalServers) * 100;
        
        console.log('🌐 OVERALL SYSTEM STATUS');
        console.log('================================================================================');
        console.log(`📊 Total Servers: ${totalServers}`);
        console.log(`✅ Healthy: ${totalHealthy} (${overallSuccessRate.toFixed(1)}%)`);
        console.log(`❌ Failed: ${totalFailed} (${((totalFailed/totalServers)*100).toFixed(1)}%)`);
        console.log('');
        
        // Memory usage
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(1);
        
        console.log('💾 MEMORY USAGE');
        console.log('================================================================================');
        console.log(`🖥️  Total System Memory: ${(totalMemory / (1024**3)).toFixed(2)} GB`);
        console.log(`📈 Used Memory: ~${(usedMemory / (1024**3)).toFixed(1)} GB (${memoryUsagePercent}%)`);
        console.log(`💚 Available Memory: ~${(freeMemory / (1024**3)).toFixed(1)} GB`);
        
        if (totalHealthy > 0) {
            const memoryPerServer = (usedMemory / totalHealthy) / (1024**2);
            console.log(`🔄 Memory per Active Server: ~${memoryPerServer.toFixed(1)}MB`);
        }
        
        console.log('');
        
        // Overall status
        if (totalFailed === 0) {
            console.log('🎉 ALL SYSTEMS OPERATIONAL!');
        } else if (overallSuccessRate >= 80) {
            console.log('⚠️  SYSTEM WARNING: Some servers are down');
            console.log(`💡 Recommendation: Restart ${totalFailed} failed servers`);
        } else {
            console.log('🚨 SYSTEM CRITICAL: Many servers are down');
            console.log(`💡 Recommendation: Immediate restart of ${totalFailed} failed servers`);
        }
        
        console.log('');
        console.log('✅ Full system validation completed!');
        
        return {
            community: communityResults,
            security: securityResults,
            overall: {
                total: totalServers,
                healthy: totalHealthy,
                failed: totalFailed,
                successRate: overallSuccessRate
            }
        };
    }

    async run() {
        try {
            const results = await this.validateFullSystem();
            return results;
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            process.exit(1);
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new FullSystemValidator();
    validator.run().then(() => {
        console.log('Waiting for the debugger to disconnect...');
    }).catch(console.error);
}

module.exports = FullSystemValidator;