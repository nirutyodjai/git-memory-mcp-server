#!/usr/bin/env node

/**
 * Test Data Sharing Between MCP Servers
 * สคริปต์ทดสอบการแชร์ข้อมูลระหว่าง MCP servers ผ่าน Git Memory
 */

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

class DataSharingTester {
    constructor() {
        this.coordinatorUrl = 'http://localhost:3500';
        this.wsUrl = 'ws://localhost:3500';
        this.mcpCoordinatorUrl = 'http://localhost:3000';
        this.testResults = [];
        this.connectedServers = [];
    }

    // เริ่มการทดสอบ
    async runTests() {
        console.log('🧪 === MCP Data Sharing Test Suite ===\n');
        
        try {
            // Test 1: ตรวจสอบ Shared Data Coordinator
            await this.testSharedDataCoordinator();
            
            // Test 2: ตรวจสอบ MCP Coordinator
            await this.testMCPCoordinator();
            
            // Test 3: ทดสอบการลงทะเบียน server
            await this.testServerRegistration();
            
            // Test 4: ทดสอบการแชร์ข้อมูล
            await this.testDataSharing();
            
            // Test 5: ทดสอบ WebSocket connection
            await this.testWebSocketConnection();
            
            // Test 6: ทดสอบ Git Memory operations
            await this.testGitMemoryOperations();
            
            // Test 7: ทดสอบการดึงข้อมูลแชร์
            await this.testDataRetrieval();
            
            // สร้างรายงาน
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        }
    }

    // ทดสอบ Shared Data Coordinator
    async testSharedDataCoordinator() {
        console.log('🔍 Test 1: Shared Data Coordinator Connection');
        
        try {
            const response = await this.makeRequest('GET', '/servers', null, 3500);
            
            if (response) {
                console.log('✅ Shared Data Coordinator is running');
                console.log(`📊 Connected servers: ${response.servers ? response.servers.length : 0}`);
                this.testResults.push({ test: 'Shared Data Coordinator', status: 'PASS', details: response });
            } else {
                throw new Error('No response from coordinator');
            }
        } catch (error) {
            console.error('❌ Shared Data Coordinator test failed:', error.message);
            this.testResults.push({ test: 'Shared Data Coordinator', status: 'FAIL', error: error.message });
        }
        
        console.log('');
    }

    // ทดสอบ MCP Coordinator
    async testMCPCoordinator() {
        console.log('🔍 Test 2: MCP Coordinator Connection');
        
        try {
            const response = await this.makeRequest('GET', '/stats', null, 3000);
            
            if (response) {
                console.log('✅ MCP Coordinator is running');
                console.log(`📊 Total servers: ${response.totalServers || 0}`);
                console.log(`📂 Categories: ${Object.keys(response.categories || {}).join(', ')}`);
                this.testResults.push({ test: 'MCP Coordinator', status: 'PASS', details: response });
            } else {
                throw new Error('No response from MCP coordinator');
            }
        } catch (error) {
            console.error('❌ MCP Coordinator test failed:', error.message);
            this.testResults.push({ test: 'MCP Coordinator', status: 'FAIL', error: error.message });
        }
        
        console.log('');
    }

    // ทดสอบการลงทะเบียน server
    async testServerRegistration() {
        console.log('🔍 Test 3: Server Registration');
        
        try {
            const testServer = {
                serverId: 'test-server-001',
                serverType: 'test',
                port: 9999,
                capabilities: ['data-sharing', 'test-mode']
            };
            
            const response = await this.makeRequest('POST', '/register', testServer, 3500);
            
            if (response && response.success) {
                console.log('✅ Server registration successful');
                console.log(`📝 Registered: ${testServer.serverId}`);
                this.testResults.push({ test: 'Server Registration', status: 'PASS', details: response });
            } else {
                throw new Error(response ? response.error : 'Registration failed');
            }
        } catch (error) {
            console.error('❌ Server registration test failed:', error.message);
            this.testResults.push({ test: 'Server Registration', status: 'FAIL', error: error.message });
        }
        
        console.log('');
    }

    // ทดสอบการแชร์ข้อมูล
    async testDataSharing() {
        console.log('🔍 Test 4: Data Sharing');
        
        try {
            const testData = {
                serverId: 'test-server-001',
                data: {
                    message: 'Hello from test server!',
                    timestamp: new Date().toISOString(),
                    testValue: Math.random()
                },
                metadata: {
                    type: 'test-message',
                    priority: 'high'
                }
            };
            
            const response = await this.makeRequest('POST', '/share/test-data', testData, 3500);
            
            if (response && response.success) {
                console.log('✅ Data sharing successful');
                console.log(`📤 Shared test data from ${testData.serverId}`);
                this.testResults.push({ test: 'Data Sharing', status: 'PASS', details: response });
            } else {
                throw new Error(response ? response.error : 'Data sharing failed');
            }
        } catch (error) {
            console.error('❌ Data sharing test failed:', error.message);
            this.testResults.push({ test: 'Data Sharing', status: 'FAIL', error: error.message });
        }
        
        console.log('');
    }

    // ทดสอบ WebSocket connection
    async testWebSocketConnection() {
        console.log('🔍 Test 5: WebSocket Connection');
        
        return new Promise((resolve) => {
            try {
                const ws = new WebSocket(this.wsUrl);
                let connected = false;
                
                const timeout = setTimeout(() => {
                    if (!connected) {
                        console.error('❌ WebSocket connection timeout');
                        this.testResults.push({ test: 'WebSocket Connection', status: 'FAIL', error: 'Connection timeout' });
                        ws.close();
                        resolve();
                    }
                }, 5000);
                
                ws.on('open', () => {
                    connected = true;
                    clearTimeout(timeout);
                    console.log('✅ WebSocket connection successful');
                    
                    // ทดสอบส่งข้อความ
                    ws.send(JSON.stringify({
                        type: 'subscribe',
                        serverId: 'test-server-001',
                        payload: { channel: 'test' }
                    }));
                    
                    this.testResults.push({ test: 'WebSocket Connection', status: 'PASS' });
                    
                    setTimeout(() => {
                        ws.close();
                        resolve();
                    }, 2000);
                });
                
                ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data);
                        console.log('📨 WebSocket message received:', message.type);
                    } catch (error) {
                        console.error('WebSocket message parse error:', error);
                    }
                });
                
                ws.on('error', (error) => {
                    clearTimeout(timeout);
                    console.error('❌ WebSocket connection failed:', error.message);
                    this.testResults.push({ test: 'WebSocket Connection', status: 'FAIL', error: error.message });
                    resolve();
                });
                
            } catch (error) {
                console.error('❌ WebSocket test failed:', error.message);
                this.testResults.push({ test: 'WebSocket Connection', status: 'FAIL', error: error.message });
                resolve();
            }
        }).then(() => {
            console.log('');
        });
    }

    // ทดสอบ Git Memory operations
    async testGitMemoryOperations() {
        console.log('🔍 Test 6: Git Memory Operations');
        
        try {
            const commitData = {
                message: 'Test commit from data sharing test'
            };
            
            const response = await this.makeRequest('POST', '/git-memory/commit', commitData, 3500);
            
            if (response && response.success) {
                console.log('✅ Git Memory commit successful');
                console.log(`📝 Commit message: ${commitData.message}`);
                this.testResults.push({ test: 'Git Memory Operations', status: 'PASS', details: response });
            } else {
                throw new Error(response ? response.error : 'Git commit failed');
            }
        } catch (error) {
            console.error('❌ Git Memory operations test failed:', error.message);
            this.testResults.push({ test: 'Git Memory Operations', status: 'FAIL', error: error.message });
        }
        
        console.log('');
    }

    // ทดสอบการดึงข้อมูลแชร์
    async testDataRetrieval() {
        console.log('🔍 Test 7: Data Retrieval');
        
        try {
            const response = await this.makeRequest('GET', '/share/test-data', null, 3500);
            
            if (response && response.success && response.data) {
                console.log('✅ Data retrieval successful');
                console.log(`📥 Retrieved ${response.data.length} data entries`);
                
                if (response.data.length > 0) {
                    const latestData = response.data[response.data.length - 1];
                    console.log(`📊 Latest data from: ${latestData.serverId}`);
                }
                
                this.testResults.push({ test: 'Data Retrieval', status: 'PASS', details: response });
            } else {
                throw new Error(response ? response.error : 'Data retrieval failed');
            }
        } catch (error) {
            console.error('❌ Data retrieval test failed:', error.message);
            this.testResults.push({ test: 'Data Retrieval', status: 'FAIL', error: error.message });
        }
        
        console.log('');
    }

    // ทำ HTTP request
    async makeRequest(method, path, data = null, port = 3500) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: port,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            };
            
            const req = http.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        resolve(parsed);
                    } catch (error) {
                        resolve({ success: false, error: 'Invalid JSON response', raw: responseData });
                    }
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            if (data && (method === 'POST' || method === 'PUT')) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    // สร้างรายงานการทดสอบ
    generateTestReport() {
        console.log('📊 === Test Results Summary ===\n');
        
        const passedTests = this.testResults.filter(test => test.status === 'PASS');
        const failedTests = this.testResults.filter(test => test.status === 'FAIL');
        
        console.log(`✅ Passed: ${passedTests.length}`);
        console.log(`❌ Failed: ${failedTests.length}`);
        console.log(`📈 Success Rate: ${((passedTests.length / this.testResults.length) * 100).toFixed(2)}%\n`);
        
        if (failedTests.length > 0) {
            console.log('❌ Failed Tests:');
            failedTests.forEach(test => {
                console.log(`   - ${test.test}: ${test.error}`);
            });
            console.log('');
        }
        
        // สร้างไฟล์รายงาน
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.testResults.length,
                passed: passedTests.length,
                failed: failedTests.length,
                successRate: ((passedTests.length / this.testResults.length) * 100).toFixed(2) + '%'
            },
            tests: this.testResults
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'data-sharing-test-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('📄 Test report saved to: data-sharing-test-report.json');
        
        // แสดงคำแนะนำ
        if (failedTests.length === 0) {
            console.log('\n🎉 All tests passed! Data sharing system is working correctly.');
            console.log('\n📋 Next steps:');
            console.log('1. Monitor shared data in real-time via WebSocket');
            console.log('2. Check Git Memory commits for data persistence');
            console.log('3. Test with actual MCP servers for production use');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the issues above.');
            console.log('\n🔧 Troubleshooting:');
            console.log('1. Ensure Shared Data Coordinator is running on port 3500');
            console.log('2. Ensure MCP Coordinator is running on port 3000');
            console.log('3. Check network connectivity and firewall settings');
            console.log('4. Verify Git Memory directory permissions');
        }
    }
}

// Main execution
if (require.main === module) {
    const tester = new DataSharingTester();
    
    tester.runTests().then(() => {
        console.log('\n✨ Test suite completed!');
    }).catch(error => {
        console.error('\n❌ Test suite error:', error.message);
        process.exit(1);
    });
}

module.exports = DataSharingTester;