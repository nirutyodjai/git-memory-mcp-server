#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

class Comprehensive500Test {
    constructor() {
        this.config = {
            // Community servers (346 servers)
            communityStartPort: 8000,
            communityEndPort: 9345,
            
            // Security servers (154 servers)
            securityStartPort: 9346,
            securityEndPort: 9499,
            
            timeout: 3000,
            concurrency: 50
        };
        
        this.results = {
            community: { healthy: 0, failed: 0, timeout: 0, error: 0, details: [] },
            security: { healthy: 0, failed: 0, timeout: 0, error: 0, details: [] },
            overall: { total: 500, healthy: 0, failed: 0, responseTime: [] }
        };
    }

    async testServer(port, type) {
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
                            type,
                            status: 'healthy',
                            responseTime,
                            data: parsed
                        });
                    } catch (error) {
                        resolve({
                            port,
                            type,
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
                    type,
                    status: 'failed',
                    error: error.code || error.message,
                    responseTime: Date.now() - startTime
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({
                    port,
                    type,
                    status: 'timeout',
                    error: 'Request timeout',
                    responseTime: this.config.timeout
                });
            });
            
            req.end();
        });
    }

    async testServerBatch(ports, type, batchName) {
        console.log(`\n🔍 Testing ${batchName} (${ports.length} servers)...`);
        
        const batchSize = this.config.concurrency;
        const totalBatches = Math.ceil(ports.length / batchSize);
        
        for (let i = 0; i < totalBatches; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, ports.length);
            const batchPorts = ports.slice(start, end);
            
            console.log(`   Batch ${i + 1}/${totalBatches} (ports ${batchPorts[0]}-${batchPorts[batchPorts.length - 1]})...`);
            
            const promises = batchPorts.map(port => this.testServer(port, type));
            const batchResults = await Promise.all(promises);
            
            // Process results
            batchResults.forEach(result => {
                this.results[type].details.push(result);
                this.results.overall.responseTime.push(result.responseTime || 0);
                
                switch (result.status) {
                    case 'healthy':
                        this.results[type].healthy++;
                        this.results.overall.healthy++;
                        process.stdout.write('✅');
                        break;
                    case 'failed':
                        this.results[type].failed++;
                        this.results.overall.failed++;
                        process.stdout.write('❌');
                        break;
                    case 'timeout':
                        this.results[type].timeout++;
                        this.results.overall.failed++;
                        process.stdout.write('⏰');
                        break;
                    case 'error':
                        this.results[type].error++;
                        this.results.overall.failed++;
                        process.stdout.write('🔥');
                        break;
                }
            });
            
            console.log(` (${batchPorts.length} servers)`);
            
            // Small delay between batches
            if (i < totalBatches - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }

    async testAll500Servers() {
        console.log('🚀 COMPREHENSIVE 500 MCP SERVERS TEST');
        console.log('================================================================================');
        console.log(`Testing all 500 MCP servers simultaneously...`);
        console.log(`Concurrency: ${this.config.concurrency} servers per batch`);
        console.log(`Timeout: ${this.config.timeout}ms per server`);
        
        const startTime = Date.now();
        
        // Generate port arrays
        const communityPorts = [];
        for (let port = this.config.communityStartPort; port <= this.config.communityEndPort; port++) {
            communityPorts.push(port);
        }
        
        const securityPorts = [];
        for (let port = this.config.securityStartPort; port <= this.config.securityEndPort; port++) {
            securityPorts.push(port);
        }
        
        // Test community servers
        await this.testServerBatch(communityPorts, 'community', 'Community Servers');
        
        // Test security servers
        await this.testServerBatch(securityPorts, 'security', 'Security Servers');
        
        const totalTime = Date.now() - startTime;
        
        // Generate comprehensive report
        this.generateReport(totalTime);
        
        return this.results;
    }

    generateReport(totalTime) {
        console.log('\n\n================================================================================');
        console.log('📊 COMPREHENSIVE 500 SERVERS TEST RESULTS');
        console.log('================================================================================');
        
        // Overall statistics
        const overallSuccessRate = ((this.results.overall.healthy / 500) * 100).toFixed(1);
        const avgResponseTime = this.results.overall.responseTime.length > 0 
            ? (this.results.overall.responseTime.reduce((a, b) => a + b, 0) / this.results.overall.responseTime.length).toFixed(0)
            : 0;
        
        console.log('\n🎯 OVERALL SYSTEM STATUS:');
        console.log(`   📊 Total Servers: 500`);
        console.log(`   ✅ Healthy: ${this.results.overall.healthy}`);
        console.log(`   ❌ Failed: ${this.results.overall.failed}`);
        console.log(`   📈 Success Rate: ${overallSuccessRate}%`);
        console.log(`   ⚡ Average Response Time: ${avgResponseTime}ms`);
        console.log(`   ⏱️  Total Test Time: ${(totalTime / 1000).toFixed(1)}s`);
        
        // Community servers breakdown
        const communityTotal = this.results.community.healthy + this.results.community.failed + this.results.community.timeout + this.results.community.error;
        const communitySuccessRate = communityTotal > 0 ? ((this.results.community.healthy / communityTotal) * 100).toFixed(1) : 0;
        
        console.log('\n🌐 COMMUNITY SERVERS (346 servers):');
        console.log(`   ✅ Healthy: ${this.results.community.healthy}`);
        console.log(`   ❌ Failed: ${this.results.community.failed}`);
        console.log(`   ⏰ Timeout: ${this.results.community.timeout}`);
        console.log(`   🔥 Error: ${this.results.community.error}`);
        console.log(`   📈 Success Rate: ${communitySuccessRate}%`);
        
        // Security servers breakdown
        const securityTotal = this.results.security.healthy + this.results.security.failed + this.results.security.timeout + this.results.security.error;
        const securitySuccessRate = securityTotal > 0 ? ((this.results.security.healthy / securityTotal) * 100).toFixed(1) : 0;
        
        console.log('\n🔒 SECURITY SERVERS (154 servers):');
        console.log(`   ✅ Healthy: ${this.results.security.healthy}`);
        console.log(`   ❌ Failed: ${this.results.security.failed}`);
        console.log(`   ⏰ Timeout: ${this.results.security.timeout}`);
        console.log(`   🔥 Error: ${this.results.security.error}`);
        console.log(`   📈 Success Rate: ${securitySuccessRate}%`);
        
        // Performance metrics
        if (this.results.overall.responseTime.length > 0) {
            const sortedTimes = this.results.overall.responseTime.sort((a, b) => a - b);
            const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
            const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
            const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
            
            console.log('\n⚡ PERFORMANCE METRICS:');
            console.log(`   📊 P50 Response Time: ${p50}ms`);
            console.log(`   📊 P95 Response Time: ${p95}ms`);
            console.log(`   📊 P99 Response Time: ${p99}ms`);
            console.log(`   📊 Min Response Time: ${Math.min(...sortedTimes)}ms`);
            console.log(`   📊 Max Response Time: ${Math.max(...sortedTimes)}ms`);
        }
        
        // System health assessment
        console.log('\n🏥 SYSTEM HEALTH ASSESSMENT:');
        if (overallSuccessRate >= 95) {
            console.log('   🟢 EXCELLENT - System is performing optimally');
        } else if (overallSuccessRate >= 85) {
            console.log('   🟡 GOOD - System is performing well with minor issues');
        } else if (overallSuccessRate >= 70) {
            console.log('   🟠 FAIR - System has moderate issues that need attention');
        } else {
            console.log('   🔴 POOR - System has significant issues requiring immediate attention');
        }
        
        // Save detailed report
        this.saveDetailedReport(totalTime, overallSuccessRate, avgResponseTime);
    }

    saveDetailedReport(totalTime, successRate, avgResponseTime) {
        const report = {
            timestamp: new Date().toISOString(),
            test_duration_ms: totalTime,
            test_duration_seconds: (totalTime / 1000).toFixed(1),
            overall: {
                total_servers: 500,
                healthy: this.results.overall.healthy,
                failed: this.results.overall.failed,
                success_rate: parseFloat(successRate),
                average_response_time_ms: parseFloat(avgResponseTime)
            },
            community_servers: {
                total: 346,
                port_range: `${this.config.communityStartPort}-${this.config.communityEndPort}`,
                healthy: this.results.community.healthy,
                failed: this.results.community.failed,
                timeout: this.results.community.timeout,
                error: this.results.community.error,
                success_rate: this.results.community.healthy > 0 
                    ? ((this.results.community.healthy / 346) * 100).toFixed(1)
                    : 0
            },
            security_servers: {
                total: 154,
                port_range: `${this.config.securityStartPort}-${this.config.securityEndPort}`,
                healthy: this.results.security.healthy,
                failed: this.results.security.failed,
                timeout: this.results.security.timeout,
                error: this.results.security.error,
                success_rate: this.results.security.healthy > 0 
                    ? ((this.results.security.healthy / 154) * 100).toFixed(1)
                    : 0
            },
            failed_servers: [
                ...this.results.community.details.filter(r => r.status !== 'healthy'),
                ...this.results.security.details.filter(r => r.status !== 'healthy')
            ],
            performance_metrics: this.calculatePerformanceMetrics()
        };
        
        const reportPath = path.join(__dirname, 'comprehensive-500-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    }

    calculatePerformanceMetrics() {
        if (this.results.overall.responseTime.length === 0) {
            return null;
        }
        
        const sortedTimes = this.results.overall.responseTime.sort((a, b) => a - b);
        
        return {
            min_ms: Math.min(...sortedTimes),
            max_ms: Math.max(...sortedTimes),
            average_ms: parseFloat((sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length).toFixed(2)),
            p50_ms: sortedTimes[Math.floor(sortedTimes.length * 0.5)],
            p95_ms: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
            p99_ms: sortedTimes[Math.floor(sortedTimes.length * 0.99)],
            total_requests: sortedTimes.length
        };
    }
}

// Run if called directly
if (require.main === module) {
    const tester = new Comprehensive500Test();
    
    async function run() {
        try {
            console.log('🚀 Starting comprehensive test of all 500 MCP servers...');
            console.log('⏳ This may take several minutes depending on server response times...');
            
            const results = await tester.testAll500Servers();
            
            console.log('\n✅ Comprehensive 500 servers test completed!');
            console.log('📊 Check comprehensive-500-test-report.json for detailed results');
            
            // Exit with appropriate code
            if (results.overall.healthy === 500) {
                console.log('\n🎉 All 500 servers are healthy!');
                process.exit(0);
            } else {
                console.log(`\n⚠️  ${results.overall.failed} servers have issues.`);
                process.exit(1);
            }
            
        } catch (error) {
            console.error('❌ Comprehensive test failed:', error);
            process.exit(1);
        }
    }
    
    run();
}

module.exports = Comprehensive500Test;