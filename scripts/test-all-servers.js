#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

class ServerTester {
    constructor() {
        this.config = {
            startPort: 9000,
            endPort: 9499,
            proxyUrl: 'http://localhost:3000',
            timeout: 5000
        };
        
        this.results = {
            timestamp: new Date().toISOString(),
            totalServers: 500,
            testedServers: 0,
            runningServers: 0,
            failedServers: 0,
            serverDetails: [],
            summary: {}
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
            
            req.on('error', (error) => {
                reject({
                    error: error.message,
                    code: error.code,
                    responseTime: Date.now() - startTime
                });
            });
            
            req.setTimeout(this.config.timeout, () => {
                req.destroy();
                reject({
                    error: 'Request timeout',
                    code: 'TIMEOUT',
                    responseTime: this.config.timeout
                });
            });
            
            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    }

    async testServer(port) {
        const url = `http://localhost:${port}/health`;
        
        try {
            const response = await this.makeRequest(url);
            return {
                port,
                status: 'running',
                statusCode: response.statusCode,
                responseTime: response.responseTime,
                healthy: response.statusCode === 200
            };
        } catch (error) {
            return {
                port,
                status: 'failed',
                error: error.error || error.message,
                code: error.code,
                responseTime: error.responseTime || 0,
                healthy: false
            };
        }
    }

    async testAllServers() {
        console.log('🚀 Testing All 500 MCP Servers');
        console.log('================================================================================');
        console.log(`Testing ports ${this.config.startPort} to ${this.config.endPort}...`);
        
        const startTime = Date.now();
        const batchSize = 50;
        const totalPorts = this.config.endPort - this.config.startPort + 1;
        
        for (let i = 0; i < totalPorts; i += batchSize) {
            const batchStart = this.config.startPort + i;
            const batchEnd = Math.min(batchStart + batchSize - 1, this.config.endPort);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(totalPorts / batchSize);
            
            console.log(`\n📦 Testing batch ${batchNumber}/${totalBatches} (ports ${batchStart}-${batchEnd})...`);
            
            const promises = [];
            for (let port = batchStart; port <= batchEnd; port++) {
                promises.push(this.testServer(port));
            }
            
            const batchResults = await Promise.all(promises);
            
            // Process batch results
            let batchRunning = 0;
            let batchFailed = 0;
            
            batchResults.forEach(result => {
                this.results.serverDetails.push(result);
                this.results.testedServers++;
                
                if (result.status === 'running' && result.healthy) {
                    this.results.runningServers++;
                    batchRunning++;
                } else {
                    this.results.failedServers++;
                    batchFailed++;
                }
            });
            
            console.log(`   ✅ Running: ${batchRunning}/${batchSize}`);
            console.log(`   ❌ Failed: ${batchFailed}/${batchSize}`);
            
            // Small delay between batches
            if (i + batchSize < totalPorts) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        
        // Calculate statistics
        const runningServers = this.results.serverDetails.filter(s => s.status === 'running' && s.healthy);
        const failedServers = this.results.serverDetails.filter(s => s.status === 'failed' || !s.healthy);
        
        const avgResponseTime = runningServers.length > 0 ? 
            runningServers.reduce((sum, s) => sum + s.responseTime, 0) / runningServers.length : 0;
        
        const minResponseTime = runningServers.length > 0 ? 
            Math.min(...runningServers.map(s => s.responseTime)) : 0;
        
        const maxResponseTime = runningServers.length > 0 ? 
            Math.max(...runningServers.map(s => s.responseTime)) : 0;
        
        // Group failed servers by error type
        const errorTypes = {};
        failedServers.forEach(server => {
            const errorKey = server.code || server.error || 'unknown';
            if (!errorTypes[errorKey]) {
                errorTypes[errorKey] = [];
            }
            errorTypes[errorKey].push(server.port);
        });
        
        this.results.summary = {
            totalDuration,
            avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
            minResponseTime,
            maxResponseTime,
            errorTypes,
            successRate: parseFloat((this.results.runningServers / this.results.totalServers * 100).toFixed(2))
        };
        
        console.log('\n================================================================================');
        console.log('📊 SERVER TEST SUMMARY');
        console.log('================================================================================');
        console.log(`Total Servers: ${this.results.totalServers}`);
        console.log(`✅ Running: ${this.results.runningServers}`);
        console.log(`❌ Failed: ${this.results.failedServers}`);
        console.log(`📊 Success Rate: ${this.results.summary.successRate}%`);
        console.log(`⏱️  Total Duration: ${totalDuration}ms`);
        console.log(`🚀 Avg Response Time: ${this.results.summary.avgResponseTime}ms`);
        console.log(`📈 Min Response Time: ${minResponseTime}ms`);
        console.log(`📉 Max Response Time: ${maxResponseTime}ms`);
        
        if (Object.keys(errorTypes).length > 0) {
            console.log('\n❌ Error Types:');
            Object.entries(errorTypes).forEach(([error, ports]) => {
                console.log(`   ${error}: ${ports.length} servers (ports: ${ports.slice(0, 5).join(', ')}${ports.length > 5 ? '...' : ''})`);
            });
        }
        
        // Show sample of running servers
        if (runningServers.length > 0) {
            console.log('\n✅ Sample Running Servers:');
            runningServers.slice(0, 10).forEach(server => {
                console.log(`   Port ${server.port}: ${server.responseTime}ms`);
            });
            if (runningServers.length > 10) {
                console.log(`   ... and ${runningServers.length - 10} more`);
            }
        }
        
        // Save detailed report
        const reportPath = path.join(__dirname, 'all-servers-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        return this.results;
    }

    async testProxyServerList() {
        console.log('\n🔍 Testing Proxy Server List...');
        
        try {
            const response = await this.makeRequest(`${this.config.proxyUrl}/servers`);
            if (response.statusCode === 200) {
                const data = JSON.parse(response.data);
                console.log(`📊 Proxy reports ${data.length || 0} servers`);
                return data;
            } else {
                console.log(`❌ Proxy server list failed: ${response.statusCode}`);
                return null;
            }
        } catch (error) {
            console.log(`❌ Proxy server list error: ${error.error || error.message}`);
            return null;
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new ServerTester();
    
    async function runTests() {
        try {
            // Test proxy server list first
            await tester.testProxyServerList();
            
            // Test all individual servers
            await tester.testAllServers();
        } catch (error) {
            console.error('Test failed:', error);
        }
    }
    
    runTests();
}

module.exports = ServerTester;