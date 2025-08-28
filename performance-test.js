#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

class PerformanceTester {
    constructor() {
        this.config = {
            proxyUrl: 'http://localhost:3000',
            bridgeUrl: 'http://localhost:3100',
            testTimeout: 10000,
            concurrentRequests: 50,
            loadTestDuration: 30000 // 30 seconds
        };
        
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            metrics: {}
        };
    }

    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const req = http.request(url, options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    resolve({
                        statusCode: res.statusCode,
                        data: data,
                        responseTime,
                        headers: res.headers
                    });
                });
            });
            
            req.on('error', reject);
            req.setTimeout(this.config.testTimeout, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    }

    async testConcurrentRequests() {
        console.log(`🚀 Testing ${this.config.concurrentRequests} Concurrent Requests...`);
        
        const startTime = Date.now();
        const promises = [];
        const results = [];
        
        for (let i = 0; i < this.config.concurrentRequests; i++) {
            const promise = this.makeRequest(`${this.config.proxyUrl}/health`)
                .then(result => {
                    results.push({
                        success: result.statusCode === 200,
                        responseTime: result.responseTime,
                        statusCode: result.statusCode
                    });
                })
                .catch(error => {
                    results.push({
                        success: false,
                        error: error.message,
                        responseTime: null
                    });
                });
            promises.push(promise);
        }
        
        await Promise.all(promises);
        const totalTime = Date.now() - startTime;
        
        const successful = results.filter(r => r.success).length;
        const failed = results.length - successful;
        const responseTimes = results.filter(r => r.responseTime).map(r => r.responseTime);
        const avgResponseTime = responseTimes.length > 0 ? 
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
        const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
        const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
        
        console.log(`✅ Concurrent Test Results:`);
        console.log(`   Successful: ${successful}/${this.config.concurrentRequests}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Total Time: ${totalTime}ms`);
        console.log(`   Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
        console.log(`   Min Response Time: ${minResponseTime}ms`);
        console.log(`   Max Response Time: ${maxResponseTime}ms`);
        
        this.results.tests.push({
            name: 'Concurrent Requests',
            status: successful > this.config.concurrentRequests * 0.8 ? 'passed' : 'failed',
            details: {
                successful,
                failed,
                totalTime,
                avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
                minResponseTime,
                maxResponseTime
            }
        });
        
        return { successful, failed, avgResponseTime, totalTime };
    }

    async testLoadBalancing() {
        console.log('⚖️  Testing Load Balancing...');
        
        const requests = 100;
        const serverResponses = new Map();
        const startTime = Date.now();
        
        for (let i = 0; i < requests; i++) {
            try {
                const response = await this.makeRequest(`${this.config.proxyUrl}/servers`);
                if (response.statusCode === 200) {
                    const serverId = response.headers['x-server-id'] || 'proxy';
                    serverResponses.set(serverId, (serverResponses.get(serverId) || 0) + 1);
                }
            } catch (error) {
                console.log(`Request ${i} failed: ${error.message}`);
            }
        }
        
        const totalTime = Date.now() - startTime;
        const distribution = Array.from(serverResponses.entries());
        
        console.log(`✅ Load Balancing Results:`);
        console.log(`   Total Requests: ${requests}`);
        console.log(`   Total Time: ${totalTime}ms`);
        console.log(`   Server Distribution:`);
        distribution.forEach(([server, count]) => {
            console.log(`     ${server}: ${count} requests (${(count/requests*100).toFixed(1)}%)`);
        });
        
        this.results.tests.push({
            name: 'Load Balancing',
            status: distribution.length > 0 ? 'passed' : 'failed',
            details: {
                totalRequests: requests,
                totalTime,
                serverDistribution: Object.fromEntries(distribution)
            }
        });
        
        return { distribution, totalTime };
    }

    async testMemoryOperations() {
        console.log('💾 Testing Memory Operations Performance...');
        
        const operations = 50;
        const results = [];
        
        for (let i = 0; i < operations; i++) {
            const testData = {
                test: `performance-test-${i}`,
                timestamp: new Date().toISOString(),
                data: `test-data-${Math.random()}`
            };
            
            const startTime = Date.now();
            
            try {
                // Store operation
                const storeResponse = await this.makeRequest(`${this.config.bridgeUrl}/memory`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testData)
                });
                
                const storeTime = Date.now() - startTime;
                
                if (storeResponse.statusCode === 200) {
                    results.push({
                        operation: 'store',
                        success: true,
                        responseTime: storeTime
                    });
                } else {
                    results.push({
                        operation: 'store',
                        success: false,
                        responseTime: storeTime,
                        statusCode: storeResponse.statusCode
                    });
                }
            } catch (error) {
                results.push({
                    operation: 'store',
                    success: false,
                    error: error.message
                });
            }
        }
        
        const successful = results.filter(r => r.success).length;
        const failed = results.length - successful;
        const responseTimes = results.filter(r => r.responseTime).map(r => r.responseTime);
        const avgResponseTime = responseTimes.length > 0 ? 
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
        
        console.log(`✅ Memory Operations Results:`);
        console.log(`   Successful: ${successful}/${operations}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
        
        this.results.tests.push({
            name: 'Memory Operations',
            status: successful > operations * 0.8 ? 'passed' : 'failed',
            details: {
                successful,
                failed,
                avgResponseTime: parseFloat(avgResponseTime.toFixed(2))
            }
        });
        
        return { successful, failed, avgResponseTime };
    }

    async testSystemStability() {
        console.log('🔄 Testing System Stability...');
        
        const testDuration = 10000; // 10 seconds
        const interval = 1000; // 1 second
        const startTime = Date.now();
        const healthChecks = [];
        
        while (Date.now() - startTime < testDuration) {
            try {
                const proxyHealth = await this.makeRequest(`${this.config.proxyUrl}/health`);
                const bridgeHealth = await this.makeRequest(`${this.config.bridgeUrl}/status`);
                
                healthChecks.push({
                    timestamp: new Date().toISOString(),
                    proxy: proxyHealth.statusCode === 200,
                    bridge: bridgeHealth.statusCode === 200 || bridgeHealth.statusCode === 404,
                    proxyResponseTime: proxyHealth.responseTime,
                    bridgeResponseTime: bridgeHealth.responseTime
                });
            } catch (error) {
                healthChecks.push({
                    timestamp: new Date().toISOString(),
                    proxy: false,
                    bridge: false,
                    error: error.message
                });
            }
            
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        const proxyUptime = healthChecks.filter(h => h.proxy).length / healthChecks.length * 100;
        const bridgeUptime = healthChecks.filter(h => h.bridge).length / healthChecks.length * 100;
        
        console.log(`✅ Stability Test Results:`);
        console.log(`   Test Duration: ${testDuration}ms`);
        console.log(`   Health Checks: ${healthChecks.length}`);
        console.log(`   Proxy Uptime: ${proxyUptime.toFixed(1)}%`);
        console.log(`   Bridge Uptime: ${bridgeUptime.toFixed(1)}%`);
        
        this.results.tests.push({
            name: 'System Stability',
            status: proxyUptime > 95 && bridgeUptime > 95 ? 'passed' : 'failed',
            details: {
                testDuration,
                healthChecks: healthChecks.length,
                proxyUptime: parseFloat(proxyUptime.toFixed(1)),
                bridgeUptime: parseFloat(bridgeUptime.toFixed(1))
            }
        });
        
        return { proxyUptime, bridgeUptime, healthChecks: healthChecks.length };
    }

    async runAllTests() {
        console.log('🚀 Starting Performance Tests');
        console.log('================================================================================');
        
        const startTime = Date.now();
        
        // Run all performance tests
        const concurrentResults = await this.testConcurrentRequests();
        const loadBalancingResults = await this.testLoadBalancing();
        const memoryResults = await this.testMemoryOperations();
        const stabilityResults = await this.testSystemStability();
        
        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        
        // Calculate summary
        const totalTests = this.results.tests.length;
        const passedTests = this.results.tests.filter(t => t.status === 'passed').length;
        const failedTests = this.results.tests.filter(t => t.status === 'failed').length;
        
        this.results.metrics = {
            totalDuration,
            concurrentPerformance: concurrentResults,
            loadBalancing: loadBalancingResults,
            memoryPerformance: memoryResults,
            systemStability: stabilityResults
        };
        
        console.log('\n================================================================================');
        console.log('📊 PERFORMANCE TEST SUMMARY');
        console.log('================================================================================');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`📊 Success Rate: ${(passedTests / totalTests * 100).toFixed(1)}%`);
        console.log(`⏱️  Total Duration: ${totalDuration}ms`);
        console.log(`🚀 Concurrent Performance: ${concurrentResults.successful}/${this.config.concurrentRequests} (${concurrentResults.avgResponseTime.toFixed(2)}ms avg)`);
        console.log(`💾 Memory Performance: ${memoryResults.successful}/50 operations (${memoryResults.avgResponseTime.toFixed(2)}ms avg)`);
        console.log(`🔄 System Stability: Proxy ${stabilityResults.proxyUptime}%, Bridge ${stabilityResults.bridgeUptime}%`);
        
        // Save detailed report
        const reportPath = path.join(__dirname, 'performance-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        return this.results;
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new PerformanceTester();
    tester.runAllTests().catch(console.error);
}

module.exports = PerformanceTester;