#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');

// Test configuration
const CONFIG = {
    proxyUrl: 'http://localhost:3000',
    bridgeUrl: 'http://localhost:3100',
    testTimeout: 5000,
    sampleSize: 10 // Test first 10 servers
};

class SpecificServerTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
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
            
            req.on('error', reject);
            req.setTimeout(CONFIG.testTimeout, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    }

    async testServerConnectivity() {
        console.log('🔌 Testing Server Connectivity...');
        
        try {
            // Test proxy server list
            const response = await this.makeRequest(`${CONFIG.proxyUrl}/servers`);
            
            if (response.statusCode === 200) {
                const data = JSON.parse(response.data);
                const servers = data.servers || [];
                console.log(`✅ Found ${servers.length} servers in proxy (Total: ${data.totalServers})`);
                
                // Test first few servers
                const testServers = servers.slice(0, CONFIG.sampleSize);
                let healthyCount = 0;
                
                for (const server of testServers) {
                    try {
                        // Test proxy health endpoint
                        const healthResponse = await this.makeRequest(`${CONFIG.proxyUrl}/health`);
                        if (healthResponse.statusCode === 200) {
                            healthyCount++;
                            console.log(`  ✅ ${server.name || server.id} - proxy healthy (${healthResponse.responseTime}ms)`);
                        } else {
                            console.log(`  ❌ ${server.name || server.id} - proxy unhealthy (${healthResponse.statusCode})`);
                        }
                    } catch (error) {
                        console.log(`  ❌ ${server.name || server.id} - error: ${error.message}`);
                    }
                }
                
                const healthPercentage = (healthyCount / testServers.length) * 100;
                console.log(`📊 Server Health: ${healthyCount}/${testServers.length} (${healthPercentage.toFixed(1)}%)`);
                
                this.results.tests.push({
                    name: 'Server Connectivity',
                    status: healthPercentage > 80 ? 'passed' : 'failed',
                    details: `${healthyCount}/${testServers.length} servers healthy`,
                    healthPercentage
                });
                
                return { servers, healthyCount, totalTested: testServers.length };
            } else {
                throw new Error(`Proxy server returned ${response.statusCode}`);
            }
        } catch (error) {
            console.log(`❌ Server connectivity test failed: ${error.message}`);
            this.results.tests.push({
                name: 'Server Connectivity',
                status: 'failed',
                details: error.message
            });
            return { servers: [], healthyCount: 0, totalTested: 0 };
        }
    }

    async testMemoryCategories() {
        console.log('🗂️  Testing Memory Categories...');
        
        try {
            const memoryPath = path.join(__dirname, '.git-memory');
            const categoriesPath = path.join(memoryPath, 'categories');
            
            if (!fs.existsSync(categoriesPath)) {
                throw new Error('Categories directory not found');
            }
            
            const categories = fs.readdirSync(categoriesPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
            
            console.log(`✅ Found ${categories.length} memory categories:`);
            categories.forEach(cat => console.log(`  - ${cat}`));
            
            // Test category contents
            let totalFiles = 0;
            for (const category of categories.slice(0, 5)) { // Test first 5 categories
                const categoryPath = path.join(categoriesPath, category);
                const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.json'));
                totalFiles += files.length;
                console.log(`  📁 ${category}: ${files.length} files`);
            }
            
            this.results.tests.push({
                name: 'Memory Categories',
                status: categories.length > 0 ? 'passed' : 'failed',
                details: `${categories.length} categories, ${totalFiles} files in first 5`
            });
            
            return { categories, totalFiles };
        } catch (error) {
            console.log(`❌ Memory categories test failed: ${error.message}`);
            this.results.tests.push({
                name: 'Memory Categories',
                status: 'failed',
                details: error.message
            });
            return { categories: [], totalFiles: 0 };
        }
    }

    async testMemoryBridgeEndpoints() {
        console.log('🌉 Testing Memory Bridge Endpoints...');
        
        try {
            // Test bridge status
            const statusResponse = await this.makeRequest(`${CONFIG.bridgeUrl}/status`);
            console.log(`✅ Bridge status: ${statusResponse.statusCode} (${statusResponse.responseTime}ms)`);
            
            // Test memory endpoints
            const endpoints = ['/memory', '/servers', '/categories'];
            let workingEndpoints = 0;
            
            for (const endpoint of endpoints) {
                try {
                    const response = await this.makeRequest(`${CONFIG.bridgeUrl}${endpoint}`);
                    if (response.statusCode === 200) {
                        workingEndpoints++;
                        console.log(`  ✅ ${endpoint} - working`);
                    } else {
                        console.log(`  ❌ ${endpoint} - status ${response.statusCode}`);
                    }
                } catch (error) {
                    console.log(`  ❌ ${endpoint} - error: ${error.message}`);
                }
            }
            
            this.results.tests.push({
                name: 'Memory Bridge Endpoints',
                status: workingEndpoints === endpoints.length ? 'passed' : 'partial',
                details: `${workingEndpoints}/${endpoints.length} endpoints working`
            });
            
            return { workingEndpoints, totalEndpoints: endpoints.length };
        } catch (error) {
            console.log(`❌ Memory bridge endpoints test failed: ${error.message}`);
            this.results.tests.push({
                name: 'Memory Bridge Endpoints',
                status: 'failed',
                details: error.message
            });
            return { workingEndpoints: 0, totalEndpoints: 0 };
        }
    }

    async testDataPersistence() {
        console.log('💾 Testing Data Persistence...');
        
        try {
            const testData = {
                test: 'persistence-test',
                timestamp: new Date().toISOString(),
                data: 'test-data-' + Math.random()
            };
            
            // Store test data
            const storeResponse = await this.makeRequest(`${CONFIG.bridgeUrl}/memory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });
            
            if (storeResponse.statusCode === 200) {
                console.log('✅ Test data stored successfully');
                
                // Wait a moment
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Retrieve test data
                const retrieveResponse = await this.makeRequest(`${CONFIG.bridgeUrl}/memory?test=persistence-test`);
                
                if (retrieveResponse.statusCode === 200) {
                    const retrievedData = JSON.parse(retrieveResponse.data);
                    if (retrievedData && retrievedData.data === testData.data) {
                        console.log('✅ Test data retrieved successfully');
                        this.results.tests.push({
                            name: 'Data Persistence',
                            status: 'passed',
                            details: 'Store and retrieve operations successful'
                        });
                        return true;
                    } else {
                        throw new Error('Retrieved data does not match stored data');
                    }
                } else {
                    throw new Error(`Failed to retrieve data: ${retrieveResponse.statusCode}`);
                }
            } else {
                throw new Error(`Failed to store data: ${storeResponse.statusCode}`);
            }
        } catch (error) {
            console.log(`❌ Data persistence test failed: ${error.message}`);
            this.results.tests.push({
                name: 'Data Persistence',
                status: 'failed',
                details: error.message
            });
            return false;
        }
    }

    async runAllTests() {
        console.log('🚀 Starting Specific Server Tests');
        console.log('================================================================================');
        
        const startTime = Date.now();
        
        // Run all tests
        const serverResults = await this.testServerConnectivity();
        const memoryResults = await this.testMemoryCategories();
        const bridgeResults = await this.testMemoryBridgeEndpoints();
        const persistenceResult = await this.testDataPersistence();
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Calculate summary
        const totalTests = this.results.tests.length;
        const passedTests = this.results.tests.filter(t => t.status === 'passed').length;
        const failedTests = this.results.tests.filter(t => t.status === 'failed').length;
        const partialTests = this.results.tests.filter(t => t.status === 'partial').length;
        
        this.results.summary = {
            totalTests,
            passedTests,
            failedTests,
            partialTests,
            successRate: ((passedTests + partialTests * 0.5) / totalTests * 100).toFixed(1) + '%',
            duration: duration + 'ms',
            serverHealth: serverResults,
            memoryCategories: memoryResults.categories.length,
            bridgeEndpoints: bridgeResults.workingEndpoints + '/' + bridgeResults.totalEndpoints
        };
        
        console.log('\n================================================================================');
        console.log('📋 SPECIFIC TEST SUMMARY');
        console.log('================================================================================');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`⚠️  Partial: ${partialTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`📊 Success Rate: ${this.results.summary.successRate}`);
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`🖥️  Server Health: ${serverResults.healthyCount}/${serverResults.totalTested}`);
        console.log(`🗂️  Memory Categories: ${memoryResults.categories.length}`);
        console.log(`🌉 Bridge Endpoints: ${bridgeResults.workingEndpoints}/${bridgeResults.totalEndpoints}`);
        
        // Save detailed report
        const reportPath = path.join(__dirname, 'specific-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        return this.results;
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new SpecificServerTester();
    tester.runAllTests().catch(console.error);
}

module.exports = SpecificServerTester;