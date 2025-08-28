#!/usr/bin/env node

const http = require('http');

class QuickSecurityTest {
    constructor() {
        this.config = {
            startPort: 9346,
            endPort: 9499,
            timeout: 2000
        };
    }

    async testServer(port) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            const req = http.request(`http://localhost:${port}/health`, {
                timeout: this.config.timeout
            }, (res) => {
                const responseTime = Date.now() - startTime;
                
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve({
                            port,
                            status: 'healthy',
                            responseTime,
                            data: parsed
                        });
                    } catch (error) {
                        resolve({
                            port,
                            status: 'error',
                            error: 'Invalid JSON response',
                            responseTime
                        });
                    }
                });
            });
            
            req.on('error', (error) => {
                resolve({
                    port,
                    status: 'failed',
                    error: error.code || error.message,
                    responseTime: Date.now() - startTime
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({
                    port,
                    status: 'timeout',
                    error: 'Request timeout',
                    responseTime: this.config.timeout
                });
            });
            
            req.end();
        });
    }

    async testAllSecurityServers() {
        console.log('🔒 Quick Security Servers Test');
        console.log('================================================================================');
        console.log(`Testing ports ${this.config.startPort}-${this.config.endPort}...\n`);
        
        const results = {
            healthy: 0,
            failed: 0,
            timeout: 0,
            error: 0,
            totalResponseTime: 0,
            details: []
        };
        
        // Test in batches for better performance
        const batchSize = 50;
        const totalServers = this.config.endPort - this.config.startPort + 1;
        const totalBatches = Math.ceil(totalServers / batchSize);
        
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const startPort = this.config.startPort + (batchIndex * batchSize);
            const endPort = Math.min(startPort + batchSize - 1, this.config.endPort);
            
            console.log(`Testing batch ${batchIndex + 1}/${totalBatches} (ports ${startPort}-${endPort})...`);
            
            const batchPromises = [];
            for (let port = startPort; port <= endPort; port++) {
                batchPromises.push(this.testServer(port));
            }
            
            const batchResults = await Promise.all(batchPromises);
            
            // Process batch results
            batchResults.forEach(result => {
                results.details.push(result);
                results.totalResponseTime += result.responseTime || 0;
                
                switch (result.status) {
                    case 'healthy':
                        results.healthy++;
                        process.stdout.write('✅');
                        break;
                    case 'failed':
                        results.failed++;
                        process.stdout.write('❌');
                        break;
                    case 'timeout':
                        results.timeout++;
                        process.stdout.write('⏰');
                        break;
                    case 'error':
                        results.error++;
                        process.stdout.write('🔥');
                        break;
                }
            });
            
            console.log(` (${endPort - startPort + 1} servers)`);
        }
        
        console.log('\n================================================================================');
        console.log('📊 QUICK SECURITY TEST RESULTS');
        console.log('================================================================================');
        
        const total = results.healthy + results.failed + results.timeout + results.error;
        const successRate = ((results.healthy / total) * 100).toFixed(1);
        const avgResponseTime = (results.totalResponseTime / total).toFixed(0);
        
        console.log(`✅ Healthy: ${results.healthy}`);
        console.log(`❌ Failed: ${results.failed}`);
        console.log(`⏰ Timeout: ${results.timeout}`);
        console.log(`🔥 Error: ${results.error}`);
        console.log(`📊 Total: ${total}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        console.log(`⚡ Average Response Time: ${avgResponseTime}ms`);
        
        // Show failed servers if any
        if (results.failed > 0 || results.timeout > 0 || results.error > 0) {
            console.log('\n❌ Failed Servers:');
            results.details
                .filter(r => r.status !== 'healthy')
                .forEach(r => {
                    console.log(`   Port ${r.port}: ${r.status} - ${r.error || 'Unknown error'}`);
                });
        }
        
        return results;
    }
}

// Run if called directly
if (require.main === module) {
    const tester = new QuickSecurityTest();
    
    async function run() {
        try {
            const results = await tester.testAllSecurityServers();
            
            if (results.healthy === 154) {
                console.log('\n🎉 All security servers are healthy!');
                process.exit(0);
            } else {
                console.log('\n⚠️  Some security servers have issues.');
                process.exit(1);
            }
            
        } catch (error) {
            console.error('❌ Quick security test failed:', error);
            process.exit(1);
        }
    }
    
    run();
}

module.exports = QuickSecurityTest;