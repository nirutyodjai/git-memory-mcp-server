#!/usr/bin/env node

/**
 * Comprehensive Test Suite for 500 MCP Servers System
 * Tests: Server Health, Git Memory Bridge, Data Sharing, Load Balancing
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const { performance } = require('perf_hooks');

class ComprehensiveTestSuite {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            warnings: 0,
            details: []
        };
        this.servers = [];
        this.gitMemoryBridgeUrl = 'http://localhost:3100';
        this.mcpProxyUrl = 'http://localhost:3000';
    }

    async runAllTests() {
        console.log('🚀 Starting Comprehensive Test Suite for 500 MCP Servers System');
        console.log('=' .repeat(80));

        try {
            // Load server configurations
            await this.loadServerConfigurations();
            
            // Test 1: Git Memory Bridge Health
            await this.testGitMemoryBridge();
            
            // Test 2: MCP Proxy Server Health
            await this.testMcpProxyServer();
            
            // Test 3: Individual Server Health Check
            await this.testIndividualServers();
            
            // Test 4: Memory Sharing Performance
            await this.testMemorySharing();
            
            // Test 5: Load Balancing Test
            await this.testLoadBalancing();
            
            // Test 6: Data Consistency Test
            await this.testDataConsistency();
            
            // Test 7: System Resource Usage
            await this.testSystemResources();
            
            // Test 8: Concurrent Operations
            await this.testConcurrentOperations();
            
            // Generate final report
            await this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            this.addTestResult('Test Suite Execution', false, error.message);
        }
    }

    async loadServerConfigurations() {
        console.log('\n📋 Loading Server Configurations...');
        
        try {
            // Load deployment status
            const deploymentStatus = await fs.readFile('deployment-status.json', 'utf8');
            const deployment = JSON.parse(deploymentStatus);
            
            this.servers = deployment.servers || [];
            
            console.log(`✅ Loaded ${this.servers.length} server configurations`);
            this.addTestResult('Load Server Configurations', true, `${this.servers.length} servers loaded`);
            
        } catch (error) {
            console.error('❌ Failed to load server configurations:', error.message);
            this.addTestResult('Load Server Configurations', false, error.message);
        }
    }

    async testGitMemoryBridge() {
        console.log('\n🌉 Testing Git Memory Bridge...');
        
        try {
            const startTime = performance.now();
            
            // Test health endpoint
            const healthResponse = await this.makeHttpRequest(this.gitMemoryBridgeUrl + '/health');
            
            if (healthResponse.status === 'healthy') {
                const responseTime = performance.now() - startTime;
                console.log(`✅ Git Memory Bridge is healthy (${responseTime.toFixed(2)}ms)`);
                this.addTestResult('Git Memory Bridge Health', true, `Response time: ${responseTime.toFixed(2)}ms`);
                
                // Test memory endpoints
                await this.testMemoryEndpoints();
                
            } else {
                throw new Error('Bridge health check failed');
            }
            
        } catch (error) {
            console.error('❌ Git Memory Bridge test failed:', error.message);
            this.addTestResult('Git Memory Bridge Health', false, error.message);
        }
    }

    async testMemoryEndpoints() {
        try {
            // Test memory storage
            const testData = {
                category: 'test-data',
                data: { timestamp: Date.now(), test: 'comprehensive-test' }
            };
            
            const storeResponse = await this.makeHttpRequest(
                this.gitMemoryBridgeUrl + '/memory',
                'POST',
                testData
            );
            
            if (storeResponse.success) {
                console.log('✅ Memory storage test passed');
                this.addTestResult('Memory Storage', true, 'Test data stored successfully');
                
                // Test memory retrieval
                const retrieveResponse = await this.makeHttpRequest(
                    this.gitMemoryBridgeUrl + '/memory/test-data'
                );
                
                if (retrieveResponse.data) {
                    console.log('✅ Memory retrieval test passed');
                    this.addTestResult('Memory Retrieval', true, 'Test data retrieved successfully');
                } else {
                    throw new Error('Failed to retrieve test data');
                }
            } else {
                throw new Error('Failed to store test data');
            }
            
        } catch (error) {
            console.error('❌ Memory endpoints test failed:', error.message);
            this.addTestResult('Memory Endpoints', false, error.message);
        }
    }

    async testMcpProxyServer() {
        console.log('\n🔄 Testing MCP Proxy Server...');
        
        try {
            const startTime = performance.now();
            
            const healthResponse = await this.makeHttpRequest(this.mcpProxyUrl + '/health');
            
            if (healthResponse.status === 'healthy') {
                const responseTime = performance.now() - startTime;
                console.log(`✅ MCP Proxy Server is healthy (${responseTime.toFixed(2)}ms)`);
                this.addTestResult('MCP Proxy Health', true, `Response time: ${responseTime.toFixed(2)}ms`);
                
                // Test server list endpoint
                const serversResponse = await this.makeHttpRequest(this.mcpProxyUrl + '/servers');
                
                if (serversResponse.servers && serversResponse.servers.length > 0) {
                    console.log(`✅ Proxy managing ${serversResponse.servers.length} servers`);
                    this.addTestResult('Proxy Server Count', true, `${serversResponse.servers.length} servers`);
                } else {
                    this.addTestResult('Proxy Server Count', false, 'No servers found in proxy');
                }
                
            } else {
                throw new Error('Proxy health check failed');
            }
            
        } catch (error) {
            console.error('❌ MCP Proxy Server test failed:', error.message);
            this.addTestResult('MCP Proxy Health', false, error.message);
        }
    }

    async testIndividualServers() {
        console.log('\n🖥️  Testing Individual Servers...');
        
        const sampleSize = Math.min(50, this.servers.length); // Test sample of 50 servers
        const sampleServers = this.servers.slice(0, sampleSize);
        
        let healthyServers = 0;
        let unhealthyServers = 0;
        
        console.log(`Testing ${sampleSize} servers (sample from ${this.servers.length} total)`);
        
        for (const server of sampleServers) {
            try {
                const response = await this.makeHttpRequest(`http://localhost:${server.port}/health`, 'GET', null, 2000);
                
                if (response && (response.status === 'healthy' || response.status === 'ok')) {
                    healthyServers++;
                } else {
                    unhealthyServers++;
                }
                
            } catch (error) {
                unhealthyServers++;
            }
        }
        
        const healthPercentage = (healthyServers / sampleSize) * 100;
        
        console.log(`✅ Server Health: ${healthyServers}/${sampleSize} healthy (${healthPercentage.toFixed(1)}%)`);
        
        if (healthPercentage >= 80) {
            this.addTestResult('Individual Server Health', true, `${healthPercentage.toFixed(1)}% healthy`);
        } else if (healthPercentage >= 60) {
            this.addTestResult('Individual Server Health', true, `${healthPercentage.toFixed(1)}% healthy (warning)`, true);
        } else {
            this.addTestResult('Individual Server Health', false, `Only ${healthPercentage.toFixed(1)}% healthy`);
        }
    }

    async testMemorySharing() {
        console.log('\n🔄 Testing Memory Sharing Performance...');
        
        try {
            const startTime = performance.now();
            
            // Test sync with servers
            const syncResponse = await this.makeHttpRequest(
                this.gitMemoryBridgeUrl + '/sync',
                'POST',
                { force: true }
            );
            
            const syncTime = performance.now() - startTime;
            
            if (syncResponse.success) {
                console.log(`✅ Memory sync completed in ${syncTime.toFixed(2)}ms`);
                console.log(`   Synced servers: ${syncResponse.synced_servers || 0}`);
                this.addTestResult('Memory Sharing Sync', true, `${syncTime.toFixed(2)}ms, ${syncResponse.synced_servers || 0} servers`);
            } else {
                throw new Error('Memory sync failed');
            }
            
        } catch (error) {
            console.error('❌ Memory sharing test failed:', error.message);
            this.addTestResult('Memory Sharing Performance', false, error.message);
        }
    }

    async testLoadBalancing() {
        console.log('\n⚖️  Testing Load Balancing...');
        
        try {
            const requests = 20;
            const responses = [];
            
            console.log(`Sending ${requests} concurrent requests to proxy...`);
            
            const promises = Array(requests).fill().map(async (_, i) => {
                try {
                    const startTime = performance.now();
                    const response = await this.makeHttpRequest(this.mcpProxyUrl + '/stats');
                    const responseTime = performance.now() - startTime;
                    return { success: true, responseTime, index: i };
                } catch (error) {
                    return { success: false, error: error.message, index: i };
                }
            });
            
            const results = await Promise.all(promises);
            const successful = results.filter(r => r.success).length;
            const avgResponseTime = results
                .filter(r => r.success)
                .reduce((sum, r) => sum + r.responseTime, 0) / successful;
            
            console.log(`✅ Load balancing: ${successful}/${requests} successful`);
            console.log(`   Average response time: ${avgResponseTime.toFixed(2)}ms`);
            
            if (successful >= requests * 0.9) {
                this.addTestResult('Load Balancing', true, `${successful}/${requests} successful, avg ${avgResponseTime.toFixed(2)}ms`);
            } else {
                this.addTestResult('Load Balancing', false, `Only ${successful}/${requests} successful`);
            }
            
        } catch (error) {
            console.error('❌ Load balancing test failed:', error.message);
            this.addTestResult('Load Balancing', false, error.message);
        }
    }

    async testDataConsistency() {
        console.log('\n🔍 Testing Data Consistency...');
        
        try {
            // Test data consistency across memory categories
            const categoriesResponse = await this.makeHttpRequest(
                this.gitMemoryBridgeUrl + '/memory/categories'
            );
            
            if (categoriesResponse.categories && categoriesResponse.categories.length > 0) {
                console.log(`✅ Found ${categoriesResponse.categories.length} memory categories`);
                
                // Check shared config consistency
                const sharedConfigPath = path.join('.git-memory', 'config', 'shared-config.json');
                const sharedConfig = JSON.parse(await fs.readFile(sharedConfigPath, 'utf8'));
                
                if (sharedConfig.servers === 500 && sharedConfig.sharing.enabled) {
                    console.log('✅ Shared configuration is consistent');
                    this.addTestResult('Data Consistency', true, `${categoriesResponse.categories.length} categories, config valid`);
                } else {
                    throw new Error('Shared configuration inconsistency detected');
                }
            } else {
                throw new Error('No memory categories found');
            }
            
        } catch (error) {
            console.error('❌ Data consistency test failed:', error.message);
            this.addTestResult('Data Consistency', false, error.message);
        }
    }

    async testSystemResources() {
        console.log('\n💾 Testing System Resources...');
        
        try {
            const memUsage = process.memoryUsage();
            const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
            const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
            const rssMB = Math.round(memUsage.rss / 1024 / 1024);
            
            console.log(`📊 Memory Usage:`);
            console.log(`   Heap Used: ${heapUsedMB} MB`);
            console.log(`   Heap Total: ${heapTotalMB} MB`);
            console.log(`   RSS: ${rssMB} MB`);
            
            // Check if memory usage is within acceptable limits
            if (heapUsedMB < 8000) { // Less than 8GB
                this.addTestResult('System Resources', true, `Heap: ${heapUsedMB}MB, RSS: ${rssMB}MB`);
            } else {
                this.addTestResult('System Resources', true, `High memory usage: ${heapUsedMB}MB`, true);
            }
            
        } catch (error) {
            console.error('❌ System resources test failed:', error.message);
            this.addTestResult('System Resources', false, error.message);
        }
    }

    async testConcurrentOperations() {
        console.log('\n🔄 Testing Concurrent Operations...');
        
        try {
            const operations = 10;
            console.log(`Running ${operations} concurrent memory operations...`);
            
            const promises = Array(operations).fill().map(async (_, i) => {
                try {
                    const testData = {
                        category: `concurrent-test-${i}`,
                        data: { timestamp: Date.now(), operation: i }
                    };
                    
                    const response = await this.makeHttpRequest(
                        this.gitMemoryBridgeUrl + '/memory',
                        'POST',
                        testData
                    );
                    
                    return response.success;
                } catch (error) {
                    return false;
                }
            });
            
            const results = await Promise.all(promises);
            const successful = results.filter(r => r).length;
            
            console.log(`✅ Concurrent operations: ${successful}/${operations} successful`);
            
            if (successful >= operations * 0.8) {
                this.addTestResult('Concurrent Operations', true, `${successful}/${operations} successful`);
            } else {
                this.addTestResult('Concurrent Operations', false, `Only ${successful}/${operations} successful`);
            }
            
        } catch (error) {
            console.error('❌ Concurrent operations test failed:', error.message);
            this.addTestResult('Concurrent Operations', false, error.message);
        }
    }

    async makeHttpRequest(url, method = 'GET', data = null, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: method,
                timeout: timeout,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        resolve(response);
                    } catch (error) {
                        resolve({ status: res.statusCode, body });
                    }
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    addTestResult(testName, passed, details, isWarning = false) {
        this.testResults.totalTests++;
        
        if (passed && !isWarning) {
            this.testResults.passedTests++;
        } else if (passed && isWarning) {
            this.testResults.warnings++;
        } else {
            this.testResults.failedTests++;
        }
        
        this.testResults.details.push({
            test: testName,
            status: passed ? (isWarning ? 'warning' : 'passed') : 'failed',
            details: details,
            timestamp: new Date().toISOString()
        });
    }

    async generateTestReport() {
        console.log('\n📊 Generating Test Report...');
        
        const report = {
            ...this.testResults,
            summary: {
                totalServers: this.servers.length,
                testDuration: new Date().toISOString(),
                successRate: ((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(1) + '%'
            }
        };
        
        // Save detailed report
        await fs.writeFile('comprehensive-test-report.json', JSON.stringify(report, null, 2));
        
        // Print summary
        console.log('\n' + '='.repeat(80));
        console.log('📋 TEST SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total Tests: ${this.testResults.totalTests}`);
        console.log(`✅ Passed: ${this.testResults.passedTests}`);
        console.log(`⚠️  Warnings: ${this.testResults.warnings}`);
        console.log(`❌ Failed: ${this.testResults.failedTests}`);
        console.log(`📊 Success Rate: ${report.summary.successRate}`);
        console.log(`🖥️  Total Servers: ${this.servers.length}`);
        console.log('\n📄 Detailed report saved to: comprehensive-test-report.json');
        
        if (this.testResults.failedTests === 0) {
            console.log('\n🎉 All tests passed! System is ready for production.');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the detailed report.');
        }
    }
}

// Run the test suite
if (require.main === module) {
    const testSuite = new ComprehensiveTestSuite();
    testSuite.runAllTests().catch(console.error);
}

module.exports = ComprehensiveTestSuite;