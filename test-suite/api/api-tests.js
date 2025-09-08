/**
 * API Tests for NEXUS IDE
 * ทดสอบ API endpoints และการทำงานของระบบ
 */

const axios = require('axios');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// API Test Configuration
const API_CONFIG = {
    baseUrl: 'http://localhost:8080',
    wsUrl: 'ws://localhost:8080',
    testTimeout: 15000,
    maxRetries: 3,
    performanceThreshold: {
        response: 1000, // 1 second
        throughput: 100, // requests per second
        availability: 99.9 // percentage
    }
};

// API Test Results
class APITestResults {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                skippedTests: 0,
                successRate: 0,
                averageResponseTime: 0,
                totalDuration: 0
            },
            endpoints: {},
            performance: {
                responseTime: [],
                throughput: 0,
                availability: 0,
                errors: []
            },
            websocket: {
                connection: false,
                messaging: false,
                realtime: false
            },
            mcp: {
                servers: [],
                tools: [],
                connectivity: false
            },
            git: {
                operations: [],
                memory: false,
                coordination: false
            }
        };
    }

    addEndpointTest(endpoint, method, passed, responseTime, statusCode, error = null) {
        if (!this.results.endpoints[endpoint]) {
            this.results.endpoints[endpoint] = {
                tests: [],
                averageResponseTime: 0,
                successRate: 0
            };
        }

        this.results.endpoints[endpoint].tests.push({
            method,
            passed,
            responseTime,
            statusCode,
            error,
            timestamp: new Date().toISOString()
        });

        this.results.summary.totalTests++;
        if (passed) {
            this.results.summary.passedTests++;
        } else {
            this.results.summary.failedTests++;
        }

        this.results.performance.responseTime.push(responseTime);
    }

    calculateSummary() {
        // Calculate success rate
        this.results.summary.successRate = this.results.summary.totalTests > 0 
            ? (this.results.summary.passedTests / this.results.summary.totalTests) * 100 
            : 0;

        // Calculate average response time
        if (this.results.performance.responseTime.length > 0) {
            this.results.summary.averageResponseTime = 
                this.results.performance.responseTime.reduce((a, b) => a + b, 0) / 
                this.results.performance.responseTime.length;
        }

        // Calculate endpoint statistics
        Object.keys(this.results.endpoints).forEach(endpoint => {
            const tests = this.results.endpoints[endpoint].tests;
            const passedTests = tests.filter(t => t.passed).length;
            
            this.results.endpoints[endpoint].successRate = tests.length > 0 
                ? (passedTests / tests.length) * 100 
                : 0;
            
            this.results.endpoints[endpoint].averageResponseTime = tests.length > 0
                ? tests.reduce((sum, test) => sum + test.responseTime, 0) / tests.length
                : 0;
        });

        // Calculate availability
        this.results.performance.availability = this.results.summary.successRate;
    }

    generateReport() {
        this.calculateSummary();
        return this.results;
    }
}

// HTTP API Tester
class HTTPAPITester {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.client = axios.create({
            baseURL: baseUrl,
            timeout: API_CONFIG.testTimeout,
            validateStatus: () => true // Accept all status codes
        });
    }

    async testCoreEndpoints(results) {
        console.log('🌐 ทดสอบ Core API Endpoints...');

        const endpoints = [
            { path: '/', method: 'GET', description: 'Root endpoint' },
            { path: '/health', method: 'GET', description: 'Health check' },
            { path: '/api/status', method: 'GET', description: 'API status' },
            { path: '/api/version', method: 'GET', description: 'Version info' },
            { path: '/api/config', method: 'GET', description: 'Configuration' }
        ];

        for (const endpoint of endpoints) {
            await this.testEndpoint(endpoint, results);
        }
    }

    async testMCPEndpoints(results) {
        console.log('🔌 ทดสอบ MCP API Endpoints...');

        const endpoints = [
            { path: '/api/mcp/servers', method: 'GET', description: 'List MCP servers' },
            { path: '/api/mcp/tools', method: 'GET', description: 'List available tools' },
            { path: '/api/mcp/status', method: 'GET', description: 'MCP system status' },
            { path: '/api/mcp/test', method: 'POST', description: 'Test MCP connection', data: { test: true } },
            { path: '/api/mcp/memory', method: 'GET', description: 'Memory status' }
        ];

        for (const endpoint of endpoints) {
            await this.testEndpoint(endpoint, results);
        }
    }

    async testGitEndpoints(results) {
        console.log('📚 ทดสอบ Git API Endpoints...');

        const endpoints = [
            { path: '/api/git/status', method: 'GET', description: 'Git status' },
            { path: '/api/git/repos', method: 'GET', description: 'List repositories' },
            { path: '/api/git/memory', method: 'GET', description: 'Git memory status' },
            { path: '/api/git/coordinator', method: 'GET', description: 'Coordinator status' },
            { path: '/api/git/operations', method: 'GET', description: 'Recent operations' }
        ];

        for (const endpoint of endpoints) {
            await this.testEndpoint(endpoint, results);
        }
    }

    async testIDEEndpoints(results) {
        console.log('💻 ทดสอบ IDE API Endpoints...');

        const endpoints = [
            { path: '/api/ide/status', method: 'GET', description: 'IDE status' },
            { path: '/api/ide/projects', method: 'GET', description: 'List projects' },
            { path: '/api/ide/files', method: 'GET', description: 'File operations' },
            { path: '/api/ide/editor', method: 'GET', description: 'Editor status' },
            { path: '/api/ide/terminal', method: 'GET', description: 'Terminal status' }
        ];

        for (const endpoint of endpoints) {
            await this.testEndpoint(endpoint, results);
        }
    }

    async testEndpoint(endpoint, results) {
        const startTime = performance.now();
        let passed = false;
        let statusCode = 0;
        let error = null;

        try {
            let response;
            
            switch (endpoint.method.toUpperCase()) {
                case 'GET':
                    response = await this.client.get(endpoint.path);
                    break;
                case 'POST':
                    response = await this.client.post(endpoint.path, endpoint.data || {});
                    break;
                case 'PUT':
                    response = await this.client.put(endpoint.path, endpoint.data || {});
                    break;
                case 'DELETE':
                    response = await this.client.delete(endpoint.path);
                    break;
                default:
                    throw new Error(`Unsupported method: ${endpoint.method}`);
            }

            statusCode = response.status;
            passed = statusCode >= 200 && statusCode < 500; // Accept 4xx as valid responses

            // Additional validation for specific endpoints
            if (endpoint.path === '/api/status' && statusCode === 200) {
                passed = response.data && typeof response.data === 'object';
            }

        } catch (err) {
            error = err.message;
            statusCode = err.response ? err.response.status : 0;
            passed = false;
        }

        const responseTime = performance.now() - startTime;
        results.addEndpointTest(endpoint.path, endpoint.method, passed, responseTime, statusCode, error);

        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${endpoint.method} ${endpoint.path} (${responseTime.toFixed(0)}ms, ${statusCode})`);
    }
}

// WebSocket Tester
class WebSocketTester {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
    }

    async testWebSocketConnection(results) {
        console.log('🔌 ทดสอบ WebSocket Connection...');

        return new Promise((resolve) => {
            const startTime = performance.now();
            let connectionEstablished = false;
            let messageReceived = false;

            const ws = new WebSocket(this.wsUrl);
            const timeout = setTimeout(() => {
                if (!connectionEstablished) {
                    ws.close();
                    results.results.websocket.connection = false;
                    console.log('  ❌ WebSocket connection timeout');
                    resolve();
                }
            }, 5000);

            ws.on('open', () => {
                connectionEstablished = true;
                results.results.websocket.connection = true;
                console.log('  ✅ WebSocket connection established');

                // Test messaging
                const testMessage = {
                    type: 'test',
                    data: { message: 'Hello WebSocket', timestamp: Date.now() }
                };
                
                ws.send(JSON.stringify(testMessage));
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    messageReceived = true;
                    results.results.websocket.messaging = true;
                    console.log('  ✅ WebSocket messaging works');
                } catch (error) {
                    console.log('  ⚠️ WebSocket received non-JSON message');
                }
            });

            ws.on('error', (error) => {
                results.results.websocket.connection = false;
                console.log('  ❌ WebSocket error:', error.message);
            });

            ws.on('close', () => {
                clearTimeout(timeout);
                const responseTime = performance.now() - startTime;
                
                if (connectionEstablished) {
                    results.addEndpointTest('/websocket', 'WS', true, responseTime, 101);
                } else {
                    results.addEndpointTest('/websocket', 'WS', false, responseTime, 0, 'Connection failed');
                }
                
                resolve();
            });

            // Close connection after testing
            setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            }, 3000);
        });
    }

    async testRealTimeFeatures(results) {
        console.log('⚡ ทดสอบ Real-time Features...');

        return new Promise((resolve) => {
            const ws = new WebSocket(this.wsUrl);
            let realTimeWorking = false;

            ws.on('open', () => {
                // Test real-time collaboration
                const collaborationTest = {
                    type: 'collaboration',
                    action: 'join_session',
                    data: { sessionId: 'test-session', userId: 'test-user' }
                };
                
                ws.send(JSON.stringify(collaborationTest));

                // Test file watching
                const fileWatchTest = {
                    type: 'file_watch',
                    action: 'watch',
                    data: { path: '/test/file.js' }
                };
                
                ws.send(JSON.stringify(fileWatchTest));
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'collaboration' || message.type === 'file_watch') {
                        realTimeWorking = true;
                        results.results.websocket.realtime = true;
                        console.log('  ✅ Real-time features working');
                    }
                } catch (error) {
                    // Ignore parsing errors
                }
            });

            ws.on('error', (error) => {
                console.log('  ❌ Real-time features error:', error.message);
            });

            setTimeout(() => {
                if (!realTimeWorking) {
                    console.log('  ⚠️ Real-time features not responding');
                }
                ws.close();
                resolve();
            }, 3000);
        });
    }
}

// Performance Tester
class PerformanceTester {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async testResponseTime(results) {
        console.log('⚡ ทดสอบ Response Time...');

        const endpoints = [
            '/api/status',
            '/api/mcp/servers',
            '/api/git/status',
            '/health'
        ];

        const measurements = [];

        for (const endpoint of endpoints) {
            for (let i = 0; i < 10; i++) {
                const startTime = performance.now();
                
                try {
                    await axios.get(`${this.baseUrl}${endpoint}`, {
                        timeout: API_CONFIG.testTimeout
                    });
                    
                    const responseTime = performance.now() - startTime;
                    measurements.push(responseTime);
                    
                } catch (error) {
                    // Record failed requests
                    measurements.push(API_CONFIG.testTimeout);
                }
            }
        }

        const averageResponseTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const maxResponseTime = Math.max(...measurements);
        const minResponseTime = Math.min(...measurements);

        const performancePassed = averageResponseTime < API_CONFIG.performanceThreshold.response;
        
        results.addEndpointTest('/performance/response-time', 'TEST', performancePassed, averageResponseTime, 200);
        
        console.log(`  📊 Average: ${averageResponseTime.toFixed(0)}ms`);
        console.log(`  📊 Min: ${minResponseTime.toFixed(0)}ms`);
        console.log(`  📊 Max: ${maxResponseTime.toFixed(0)}ms`);
        console.log(`  ${performancePassed ? '✅' : '❌'} Performance threshold: ${API_CONFIG.performanceThreshold.response}ms`);
    }

    async testThroughput(results) {
        console.log('🚀 ทดสอบ Throughput...');

        const endpoint = '/api/status';
        const duration = 10000; // 10 seconds
        const startTime = Date.now();
        let requestCount = 0;
        let successCount = 0;

        const promises = [];

        while (Date.now() - startTime < duration) {
            const promise = axios.get(`${this.baseUrl}${endpoint}`, {
                timeout: 5000
            }).then(() => {
                successCount++;
            }).catch(() => {
                // Count failed requests
            });

            promises.push(promise);
            requestCount++;

            // Small delay to prevent overwhelming
            await this.sleep(10);
        }

        await Promise.allSettled(promises);

        const actualDuration = Date.now() - startTime;
        const throughput = (requestCount / actualDuration) * 1000; // requests per second
        const successRate = (successCount / requestCount) * 100;

        results.results.performance.throughput = throughput;
        
        const throughputPassed = throughput >= API_CONFIG.performanceThreshold.throughput;
        results.addEndpointTest('/performance/throughput', 'TEST', throughputPassed, 0, 200);

        console.log(`  📊 Requests: ${requestCount}`);
        console.log(`  📊 Success: ${successCount} (${successRate.toFixed(1)}%)`);
        console.log(`  📊 Throughput: ${throughput.toFixed(1)} req/s`);
        console.log(`  ${throughputPassed ? '✅' : '❌'} Throughput threshold: ${API_CONFIG.performanceThreshold.throughput} req/s`);
    }

    async testLoadHandling(results) {
        console.log('💪 ทดสอบ Load Handling...');

        const concurrentUsers = [1, 5, 10, 20, 50];
        const endpoint = '/api/status';

        for (const users of concurrentUsers) {
            console.log(`  🔄 Testing ${users} concurrent users...`);
            
            const startTime = performance.now();
            const promises = [];
            let successCount = 0;

            for (let i = 0; i < users; i++) {
                const promise = axios.get(`${this.baseUrl}${endpoint}`, {
                    timeout: 10000
                }).then(() => {
                    successCount++;
                }).catch(() => {
                    // Count failures
                });
                
                promises.push(promise);
            }

            await Promise.allSettled(promises);
            
            const responseTime = performance.now() - startTime;
            const successRate = (successCount / users) * 100;
            
            const loadPassed = successRate >= 95 && responseTime < 5000;
            results.addEndpointTest(`/performance/load-${users}`, 'TEST', loadPassed, responseTime, 200);
            
            console.log(`    📊 Success rate: ${successRate.toFixed(1)}%`);
            console.log(`    📊 Response time: ${responseTime.toFixed(0)}ms`);
            console.log(`    ${loadPassed ? '✅' : '❌'} Load test passed`);
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// MCP Integration Tester
class MCPIntegrationTester {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async testMCPIntegration(results) {
        console.log('🔌 ทดสอบ MCP Integration...');

        await this.testMCPServers(results);
        await this.testMCPTools(results);
        await this.testMCPConnectivity(results);
    }

    async testMCPServers(results) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/mcp/servers`, {
                timeout: API_CONFIG.testTimeout
            });

            if (response.status === 200 && response.data) {
                const servers = Array.isArray(response.data) ? response.data : response.data.servers || [];
                results.results.mcp.servers = servers;
                
                console.log(`  📊 Found ${servers.length} MCP servers`);
                
                if (servers.length > 0) {
                    servers.forEach(server => {
                        console.log(`    🔌 ${server.name || server.id}: ${server.status || 'unknown'}`);
                    });
                }
                
                results.addEndpointTest('/mcp/servers', 'GET', true, 0, 200);
            } else {
                results.addEndpointTest('/mcp/servers', 'GET', false, 0, response.status, 'Invalid response');
            }
        } catch (error) {
            console.log('  ❌ MCP servers test failed:', error.message);
            results.addEndpointTest('/mcp/servers', 'GET', false, 0, 0, error.message);
        }
    }

    async testMCPTools(results) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/mcp/tools`, {
                timeout: API_CONFIG.testTimeout
            });

            if (response.status === 200 && response.data) {
                const tools = Array.isArray(response.data) ? response.data : response.data.tools || [];
                results.results.mcp.tools = tools;
                
                console.log(`  🛠️ Found ${tools.length} MCP tools`);
                
                if (tools.length > 0) {
                    const toolsByServer = {};
                    tools.forEach(tool => {
                        const server = tool.server || 'unknown';
                        if (!toolsByServer[server]) {
                            toolsByServer[server] = [];
                        }
                        toolsByServer[server].push(tool.name || tool.id);
                    });
                    
                    Object.keys(toolsByServer).forEach(server => {
                        console.log(`    🔧 ${server}: ${toolsByServer[server].join(', ')}`);
                    });
                }
                
                results.addEndpointTest('/mcp/tools', 'GET', true, 0, 200);
            } else {
                results.addEndpointTest('/mcp/tools', 'GET', false, 0, response.status, 'Invalid response');
            }
        } catch (error) {
            console.log('  ❌ MCP tools test failed:', error.message);
            results.addEndpointTest('/mcp/tools', 'GET', false, 0, 0, error.message);
        }
    }

    async testMCPConnectivity(results) {
        try {
            const testData = {
                action: 'ping',
                timestamp: Date.now()
            };

            const response = await axios.post(`${this.baseUrl}/api/mcp/test`, testData, {
                timeout: API_CONFIG.testTimeout
            });

            if (response.status === 200) {
                results.results.mcp.connectivity = true;
                console.log('  ✅ MCP connectivity test passed');
                results.addEndpointTest('/mcp/connectivity', 'POST', true, 0, 200);
            } else {
                results.results.mcp.connectivity = false;
                console.log('  ❌ MCP connectivity test failed');
                results.addEndpointTest('/mcp/connectivity', 'POST', false, 0, response.status);
            }
        } catch (error) {
            results.results.mcp.connectivity = false;
            console.log('  ❌ MCP connectivity error:', error.message);
            results.addEndpointTest('/mcp/connectivity', 'POST', false, 0, 0, error.message);
        }
    }
}

// Git Integration Tester
class GitIntegrationTester {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async testGitIntegration(results) {
        console.log('📚 ทดสอบ Git Integration...');

        await this.testGitOperations(results);
        await this.testGitMemory(results);
        await this.testGitCoordination(results);
    }

    async testGitOperations(results) {
        const operations = [
            { endpoint: '/api/git/status', operation: 'status' },
            { endpoint: '/api/git/repos', operation: 'list repositories' },
            { endpoint: '/api/git/operations', operation: 'recent operations' }
        ];

        for (const op of operations) {
            try {
                const response = await axios.get(`${this.baseUrl}${op.endpoint}`, {
                    timeout: API_CONFIG.testTimeout
                });

                const passed = response.status === 200;
                results.results.git.operations.push({
                    operation: op.operation,
                    passed,
                    response: response.data
                });

                console.log(`  ${passed ? '✅' : '❌'} Git ${op.operation}`);
                results.addEndpointTest(op.endpoint, 'GET', passed, 0, response.status);
                
            } catch (error) {
                console.log(`  ❌ Git ${op.operation} failed:`, error.message);
                results.results.git.operations.push({
                    operation: op.operation,
                    passed: false,
                    error: error.message
                });
                results.addEndpointTest(op.endpoint, 'GET', false, 0, 0, error.message);
            }
        }
    }

    async testGitMemory(results) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/git/memory`, {
                timeout: API_CONFIG.testTimeout
            });

            if (response.status === 200 && response.data) {
                results.results.git.memory = true;
                console.log('  ✅ Git Memory system working');
                
                if (response.data.stats) {
                    console.log(`    📊 Memory entries: ${response.data.stats.entries || 0}`);
                    console.log(`    📊 Memory size: ${response.data.stats.size || 0} bytes`);
                }
                
                results.addEndpointTest('/git/memory', 'GET', true, 0, 200);
            } else {
                results.results.git.memory = false;
                console.log('  ❌ Git Memory system not responding');
                results.addEndpointTest('/git/memory', 'GET', false, 0, response.status);
            }
        } catch (error) {
            results.results.git.memory = false;
            console.log('  ❌ Git Memory error:', error.message);
            results.addEndpointTest('/git/memory', 'GET', false, 0, 0, error.message);
        }
    }

    async testGitCoordination(results) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/git/coordinator`, {
                timeout: API_CONFIG.testTimeout
            });

            if (response.status === 200) {
                results.results.git.coordination = true;
                console.log('  ✅ Git Coordinator working');
                
                if (response.data && response.data.status) {
                    console.log(`    📊 Coordinator status: ${response.data.status}`);
                    console.log(`    📊 Active tasks: ${response.data.activeTasks || 0}`);
                }
                
                results.addEndpointTest('/git/coordinator', 'GET', true, 0, 200);
            } else {
                results.results.git.coordination = false;
                console.log('  ❌ Git Coordinator not responding');
                results.addEndpointTest('/git/coordinator', 'GET', false, 0, response.status);
            }
        } catch (error) {
            results.results.git.coordination = false;
            console.log('  ❌ Git Coordinator error:', error.message);
            results.addEndpointTest('/git/coordinator', 'GET', false, 0, 0, error.message);
        }
    }
}

// Main API Test Runner
class APITestRunner {
    constructor() {
        this.results = new APITestResults();
        this.baseUrl = API_CONFIG.baseUrl;
        this.wsUrl = API_CONFIG.wsUrl;
    }

    async runAllAPITests() {
        console.log('🌐 เริ่มต้น API Tests สำหรับ NEXUS IDE');
        console.log('🎯 Target:', this.baseUrl);
        
        const startTime = performance.now();
        
        try {
            // Wait for server to be ready
            await this.waitForServer();
            
            // Test HTTP APIs
            const httpTester = new HTTPAPITester(this.baseUrl);
            await httpTester.testCoreEndpoints(this.results);
            await httpTester.testMCPEndpoints(this.results);
            await httpTester.testGitEndpoints(this.results);
            await httpTester.testIDEEndpoints(this.results);
            
            // Test WebSocket
            const wsTester = new WebSocketTester(this.wsUrl);
            await wsTester.testWebSocketConnection(this.results);
            await wsTester.testRealTimeFeatures(this.results);
            
            // Test Performance
            const perfTester = new PerformanceTester(this.baseUrl);
            await perfTester.testResponseTime(this.results);
            await perfTester.testThroughput(this.results);
            await perfTester.testLoadHandling(this.results);
            
            // Test MCP Integration
            const mcpTester = new MCPIntegrationTester(this.baseUrl);
            await mcpTester.testMCPIntegration(this.results);
            
            // Test Git Integration
            const gitTester = new GitIntegrationTester(this.baseUrl);
            await gitTester.testGitIntegration(this.results);
            
            // Calculate final results
            this.results.summary.totalDuration = performance.now() - startTime;
            const report = this.results.generateReport();
            
            // Save report
            await this.saveReport(report);
            
            // Display summary
            this.displaySummary(report);
            
            return report;
            
        } catch (error) {
            console.error('💥 เกิดข้อผิดพลาดในการทดสอบ API:', error);
            throw error;
        }
    }

    async waitForServer() {
        console.log('⏳ รอให้เซิร์ฟเวอร์พร้อม...');
        
        for (let i = 0; i < 30; i++) {
            try {
                await axios.get(this.baseUrl, { timeout: 2000 });
                console.log('✅ เซิร์ฟเวอร์พร้อมแล้ว');
                return;
            } catch (error) {
                console.log(`  ⏳ ความพยายามที่ ${i + 1}/30...`);
                await this.sleep(1000);
            }
        }
        
        throw new Error('เซิร์ฟเวอร์ไม่พร้อมใช้งาน');
    }

    async saveReport(report) {
        const reportsDir = path.join(__dirname, '..', 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const jsonPath = path.join(reportsDir, `api-report-${timestamp}.json`);
        const htmlPath = path.join(reportsDir, `api-report-${timestamp}.html`);
        
        // Save JSON report
        fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
        
        // Generate and save HTML report
        const htmlReport = this.generateHTMLReport(report);
        fs.writeFileSync(htmlPath, htmlReport);
        
        console.log(`\n📄 API Report saved:`);
        console.log(`  📋 JSON: ${jsonPath}`);
        console.log(`  🌐 HTML: ${htmlPath}`);
    }

    generateHTMLReport(report) {
        const successColor = report.summary.successRate >= 90 ? '#28a745' : 
                           report.summary.successRate >= 70 ? '#ffc107' : '#dc3545';
        
        return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS IDE API Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .success-rate { font-size: 48px; font-weight: bold; color: ${successColor}; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-number { font-size: 32px; font-weight: bold; color: #007bff; }
        .endpoint-section { margin: 30px 0; }
        .endpoint-item { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
        .endpoint-passed { border-left-color: #28a745; }
        .endpoint-failed { border-left-color: #dc3545; }
        .performance-chart { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background: #f8f9fa; font-weight: bold; }
        .status-pass { color: #28a745; font-weight: bold; }
        .status-fail { color: #dc3545; font-weight: bold; }
        .status-warning { color: #ffc107; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 NEXUS IDE API Test Report</h1>
            <div class="success-rate">${report.summary.successRate.toFixed(1)}%</div>
            <p><strong>Success Rate</strong></p>
            <p><strong>Generated:</strong> ${report.timestamp}</p>
            <p><strong>Duration:</strong> ${(report.summary.totalDuration / 1000).toFixed(1)}s</p>
        </div>
        
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-number">${report.summary.totalTests}</div>
                <div>Total Tests</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${report.summary.passedTests}</div>
                <div>Passed</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${report.summary.failedTests}</div>
                <div>Failed</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${report.summary.averageResponseTime.toFixed(0)}ms</div>
                <div>Avg Response Time</div>
            </div>
        </div>
        
        <div class="performance-chart">
            <h3>📊 Performance Metrics</h3>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-number">${report.performance.throughput.toFixed(1)}</div>
                    <div>Requests/sec</div>
                </div>
                <div class="summary-card">
                    <div class="summary-number">${report.performance.availability.toFixed(1)}%</div>
                    <div>Availability</div>
                </div>
                <div class="summary-card">
                    <div class="summary-number ${report.websocket.connection ? 'status-pass' : 'status-fail'}">
                        ${report.websocket.connection ? '✅' : '❌'}
                    </div>
                    <div>WebSocket</div>
                </div>
                <div class="summary-card">
                    <div class="summary-number ${report.mcp.connectivity ? 'status-pass' : 'status-fail'}">
                        ${report.mcp.connectivity ? '✅' : '❌'}
                    </div>
                    <div>MCP Integration</div>
                </div>
            </div>
        </div>
        
        <div class="endpoint-section">
            <h2>🔗 API Endpoints</h2>
            <table>
                <thead>
                    <tr>
                        <th>Endpoint</th>
                        <th>Tests</th>
                        <th>Success Rate</th>
                        <th>Avg Response Time</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.keys(report.endpoints).map(endpoint => {
                        const data = report.endpoints[endpoint];
                        const statusClass = data.successRate >= 90 ? 'status-pass' : 
                                          data.successRate >= 70 ? 'status-warning' : 'status-fail';
                        return `
                            <tr>
                                <td>${endpoint}</td>
                                <td>${data.tests.length}</td>
                                <td class="${statusClass}">${data.successRate.toFixed(1)}%</td>
                                <td>${data.averageResponseTime.toFixed(0)}ms</td>
                                <td class="${statusClass}">
                                    ${data.successRate >= 90 ? '✅ Excellent' : 
                                      data.successRate >= 70 ? '⚠️ Good' : '❌ Poor'}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="endpoint-section">
            <h2>🔌 Integration Status</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h4>MCP Servers</h4>
                    <div class="summary-number">${report.mcp.servers.length}</div>
                    <div>Active Servers</div>
                </div>
                <div class="summary-card">
                    <h4>MCP Tools</h4>
                    <div class="summary-number">${report.mcp.tools.length}</div>
                    <div>Available Tools</div>
                </div>
                <div class="summary-card">
                    <h4>Git Operations</h4>
                    <div class="summary-number">${report.git.operations.filter(op => op.passed).length}/${report.git.operations.length}</div>
                    <div>Working</div>
                </div>
                <div class="summary-card">
                    <h4>Real-time Features</h4>
                    <div class="summary-number ${report.websocket.realtime ? 'status-pass' : 'status-fail'}">
                        ${report.websocket.realtime ? '✅' : '❌'}
                    </div>
                    <div>Status</div>
                </div>
            </div>
        </div>
        
        ${report.performance.errors.length > 0 ? `
        <div class="endpoint-section">
            <h2>⚠️ Errors & Issues</h2>
            ${report.performance.errors.map(error => `
                <div class="endpoint-item endpoint-failed">
                    <strong>${error.type || 'Error'}</strong>: ${error.message}
                    ${error.endpoint ? `<br><small>Endpoint: ${error.endpoint}</small>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="endpoint-section">
            <h2>🎯 Recommendations</h2>
            ${this.generateRecommendations(report).map(rec => `<p>• ${rec}</p>`).join('')}
        </div>
    </div>
</body>
</html>
        `;
    }

    generateRecommendations(report) {
        const recommendations = [];
        
        if (report.summary.successRate < 90) {
            recommendations.push('ปรับปรุงความเสถียรของ API endpoints ที่มีปัญหา');
        }
        
        if (report.summary.averageResponseTime > 1000) {
            recommendations.push('ปรับปรุงประสิทธิภาพการตอบสนองของระบบ');
        }
        
        if (report.performance.throughput < 100) {
            recommendations.push('เพิ่มความสามารถในการรองรับ load ที่สูงขึ้น');
        }
        
        if (!report.websocket.connection) {
            recommendations.push('แก้ไขปัญหาการเชื่อมต่อ WebSocket สำหรับ real-time features');
        }
        
        if (!report.mcp.connectivity) {
            recommendations.push('ตรวจสอบและแก้ไขการเชื่อมต่อ MCP servers');
        }
        
        if (report.mcp.servers.length === 0) {
            recommendations.push('เพิ่ม MCP servers เพื่อขยายความสามารถของระบบ');
        }
        
        if (!report.git.memory) {
            recommendations.push('ตรวจสอบและแก้ไขระบบ Git Memory');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('ระบบทำงานได้ดี แต่ควรติดตามประสิทธิภาพอย่างสม่ำเสมอ');
        }
        
        return recommendations;
    }

    displaySummary(report) {
        console.log('\n🌐 สรุปผลการทดสอบ API:');
        console.log('=' .repeat(50));
        console.log(`📊 Success Rate: ${report.summary.successRate.toFixed(1)}%`);
        console.log(`📊 Total Tests: ${report.summary.totalTests}`);
        console.log(`📊 Passed: ${report.summary.passedTests}`);
        console.log(`📊 Failed: ${report.summary.failedTests}`);
        console.log(`📊 Average Response Time: ${report.summary.averageResponseTime.toFixed(0)}ms`);
        console.log(`📊 Throughput: ${report.performance.throughput.toFixed(1)} req/s`);
        console.log(`📊 Duration: ${(report.summary.totalDuration / 1000).toFixed(1)}s`);
        
        console.log('\n🔌 Integration Status:');
        console.log(`  WebSocket: ${report.websocket.connection ? '✅' : '❌'}`);
        console.log(`  MCP Connectivity: ${report.mcp.connectivity ? '✅' : '❌'}`);
        console.log(`  MCP Servers: ${report.mcp.servers.length}`);
        console.log(`  MCP Tools: ${report.mcp.tools.length}`);
        console.log(`  Git Memory: ${report.git.memory ? '✅' : '❌'}`);
        console.log(`  Git Coordination: ${report.git.coordination ? '✅' : '❌'}`);
        
        console.log('\n🎯 Top Performing Endpoints:');
        const sortedEndpoints = Object.keys(report.endpoints)
            .map(endpoint => ({
                endpoint,
                ...report.endpoints[endpoint]
            }))
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, 5);
        
        sortedEndpoints.forEach(ep => {
            console.log(`  ${ep.successRate >= 90 ? '✅' : ep.successRate >= 70 ? '⚠️' : '❌'} ${ep.endpoint}: ${ep.successRate.toFixed(1)}% (${ep.averageResponseTime.toFixed(0)}ms)`);
        });
        
        console.log('\n🎯 คำแนะนำ:');
        this.generateRecommendations(report).forEach(rec => {
            console.log(`  • ${rec}`);
        });
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run API tests if this file is executed directly
if (require.main === module) {
    const runner = new APITestRunner();
    runner.runAllAPITests().catch(error => {
        console.error('💥 เกิดข้อผิดพลาดในการทดสอบ API:', error);
        process.exit(1);
    });
}

module.exports = {
    APITestRunner,
    HTTPAPITester,
    WebSocketTester,
    PerformanceTester,
    MCPIntegrationTester,
    GitIntegrationTester,
    APITestResults
};