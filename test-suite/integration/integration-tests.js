/**
 * Integration Tests for NEXUS IDE
 * ทดสอบการทำงานร่วมกันของระบบทั้งหมด
 */

const axios = require('axios');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { performance } = require('perf_hooks');

// Integration Test Configuration
const INTEGRATION_CONFIG = {
    baseUrl: 'http://localhost:8080',
    wsUrl: 'ws://localhost:8080',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    testData: {
        sampleRepo: 'https://github.com/microsoft/vscode.git',
        testFiles: [
            'package.json',
            'README.md',
            'src/main.js'
        ],
        mcpServers: [
            'git-memory-server',
            'file-system-server',
            'ai-assistant-server'
        ]
    }
};

// Integration Test Results
class IntegrationTestResults {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                duration: 0
            },
            testSuites: [],
            errors: [],
            warnings: [],
            coverage: {
                endpoints: {},
                features: {},
                integrations: {}
            },
            performance: {
                averageResponseTime: 0,
                slowestEndpoint: null,
                fastestEndpoint: null
            }
        };
    }

    addTestSuite(suiteName) {
        const suite = {
            name: suiteName,
            startTime: performance.now(),
            endTime: null,
            duration: 0,
            tests: [],
            passed: 0,
            failed: 0,
            skipped: 0
        };
        
        this.results.testSuites.push(suite);
        return suite;
    }

    addTest(suite, testName, status, duration, error = null, details = null) {
        const test = {
            name: testName,
            status, // 'passed', 'failed', 'skipped'
            duration,
            error,
            details,
            timestamp: new Date().toISOString()
        };
        
        suite.tests.push(test);
        suite[status]++;
        this.results.summary[status]++;
        this.results.summary.total++;
        
        if (error) {
            this.results.errors.push({
                suite: suite.name,
                test: testName,
                error: error.message || error,
                stack: error.stack,
                timestamp: test.timestamp
            });
        }
    }

    finalizeSuite(suite) {
        suite.endTime = performance.now();
        suite.duration = suite.endTime - suite.startTime;
    }

    finalize() {
        this.results.summary.duration = this.results.testSuites.reduce(
            (total, suite) => total + suite.duration, 0
        );
        
        // Calculate performance metrics
        const responseTimes = [];
        this.results.testSuites.forEach(suite => {
            suite.tests.forEach(test => {
                if (test.details && test.details.responseTime) {
                    responseTimes.push({
                        endpoint: test.name,
                        time: test.details.responseTime
                    });
                }
            });
        });
        
        if (responseTimes.length > 0) {
            this.results.performance.averageResponseTime = 
                responseTimes.reduce((sum, rt) => sum + rt.time, 0) / responseTimes.length;
            
            responseTimes.sort((a, b) => a.time - b.time);
            this.results.performance.fastestEndpoint = responseTimes[0];
            this.results.performance.slowestEndpoint = responseTimes[responseTimes.length - 1];
        }
    }
}

// HTTP Client with retry logic
class HTTPClient {
    constructor(baseUrl, timeout = 10000) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }

    async request(method, endpoint, data = null, headers = {}) {
        const startTime = performance.now();
        
        for (let attempt = 1; attempt <= INTEGRATION_CONFIG.retryAttempts; attempt++) {
            try {
                const config = {
                    method,
                    url: `${this.baseUrl}${endpoint}`,
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers
                    },
                    validateStatus: () => true // Don't throw on HTTP errors
                };
                
                if (data) {
                    config.data = data;
                }
                
                const response = await axios(config);
                const responseTime = performance.now() - startTime;
                
                return {
                    status: response.status,
                    data: response.data,
                    headers: response.headers,
                    responseTime
                };
                
            } catch (error) {
                if (attempt === INTEGRATION_CONFIG.retryAttempts) {
                    const responseTime = performance.now() - startTime;
                    throw {
                        message: error.message,
                        code: error.code,
                        responseTime
                    };
                }
                
                await this.sleep(INTEGRATION_CONFIG.retryDelay * attempt);
            }
        }
    }

    async get(endpoint, headers = {}) {
        return this.request('GET', endpoint, null, headers);
    }

    async post(endpoint, data, headers = {}) {
        return this.request('POST', endpoint, data, headers);
    }

    async put(endpoint, data, headers = {}) {
        return this.request('PUT', endpoint, data, headers);
    }

    async delete(endpoint, headers = {}) {
        return this.request('DELETE', endpoint, null, headers);
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// WebSocket Client for testing
class WebSocketClient {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.connected = false;
        this.messageHandlers = new Map();
        this.responsePromises = new Map();
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.url);
            
            const timeout = setTimeout(() => {
                reject(new Error('WebSocket connection timeout'));
            }, 10000);
            
            this.ws.on('open', () => {
                clearTimeout(timeout);
                this.connected = true;
                resolve();
            });
            
            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(message);
                } catch (error) {
                    console.warn('Failed to parse WebSocket message:', error);
                }
            });
            
            this.ws.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
            
            this.ws.on('close', () => {
                this.connected = false;
            });
        });
    }

    async sendMessage(message, expectResponse = false) {
        if (!this.connected) {
            throw new Error('WebSocket not connected');
        }
        
        const messageId = message.id || `msg_${Date.now()}_${Math.random()}`;
        message.id = messageId;
        
        if (expectResponse) {
            const responsePromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.responsePromises.delete(messageId);
                    reject(new Error('Response timeout'));
                }, 10000);
                
                this.responsePromises.set(messageId, { resolve, reject, timeout });
            });
            
            this.ws.send(JSON.stringify(message));
            return responsePromise;
        } else {
            this.ws.send(JSON.stringify(message));
        }
    }

    handleMessage(message) {
        // Handle response to a request
        if (message.id && this.responsePromises.has(message.id)) {
            const { resolve, timeout } = this.responsePromises.get(message.id);
            clearTimeout(timeout);
            this.responsePromises.delete(message.id);
            resolve(message);
            return;
        }
        
        // Handle other message types
        if (message.type && this.messageHandlers.has(message.type)) {
            const handler = this.messageHandlers.get(message.type);
            handler(message);
        }
    }

    onMessage(type, handler) {
        this.messageHandlers.set(type, handler);
    }

    async disconnect() {
        if (this.ws && this.connected) {
            this.ws.close();
            this.connected = false;
        }
    }
}

// Main Integration Test Runner
class IntegrationTestRunner {
    constructor() {
        this.results = new IntegrationTestResults();
        this.httpClient = new HTTPClient(INTEGRATION_CONFIG.baseUrl);
        this.wsClient = new WebSocketClient(INTEGRATION_CONFIG.wsUrl);
    }

    async runAllIntegrationTests() {
        console.log('🧪 เริ่มต้น Integration Tests สำหรับ NEXUS IDE');
        console.log('🎯 Target:', INTEGRATION_CONFIG.baseUrl);
        
        const startTime = performance.now();
        
        try {
            // Wait for services to be ready
            await this.waitForServices();
            
            // Run test suites
            await this.runAPIIntegrationTests();
            await this.runWebSocketIntegrationTests();
            await this.runMCPIntegrationTests();
            await this.runFileSystemIntegrationTests();
            await this.runGitIntegrationTests();
            await this.runAIIntegrationTests();
            await this.runEndToEndTests();
            
            // Finalize results
            this.results.finalize();
            
            // Save and display results
            await this.saveResults();
            this.displayResults();
            
            return this.results.results;
            
        } catch (error) {
            console.error('💥 เกิดข้อผิดพลาดในการทดสอบ Integration:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }

    async waitForServices() {
        console.log('⏳ รอให้บริการทั้งหมดพร้อม...');
        
        const services = [
            { name: 'Main Server', url: INTEGRATION_CONFIG.baseUrl },
            { name: 'WebSocket', url: INTEGRATION_CONFIG.wsUrl }
        ];
        
        for (const service of services) {
            console.log(`  ⏳ ตรวจสอบ ${service.name}...`);
            
            for (let i = 0; i < 30; i++) {
                try {
                    if (service.name === 'WebSocket') {
                        const wsTest = new WebSocketClient(service.url);
                        await wsTest.connect();
                        await wsTest.disconnect();
                    } else {
                        await this.httpClient.get('/api/status');
                    }
                    
                    console.log(`  ✅ ${service.name} พร้อมแล้ว`);
                    break;
                } catch (error) {
                    if (i === 29) {
                        throw new Error(`${service.name} ไม่พร้อมใช้งาน: ${error.message}`);
                    }
                    await this.sleep(1000);
                }
            }
        }
    }

    async runAPIIntegrationTests() {
        const suite = this.results.addTestSuite('API Integration Tests');
        console.log('\n🌐 API Integration Tests:');
        
        // Test basic API endpoints
        await this.testEndpoint(suite, 'GET /api/status', async () => {
            const response = await this.httpClient.get('/api/status');
            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }
            return { responseTime: response.responseTime };
        });
        
        await this.testEndpoint(suite, 'GET /api/health', async () => {
            const response = await this.httpClient.get('/api/health');
            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }
            if (!response.data.status || response.data.status !== 'healthy') {
                throw new Error('Health check failed');
            }
            return { responseTime: response.responseTime };
        });
        
        await this.testEndpoint(suite, 'GET /api/mcp/servers', async () => {
            const response = await this.httpClient.get('/api/mcp/servers');
            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }
            if (!Array.isArray(response.data)) {
                throw new Error('Expected array of MCP servers');
            }
            return { responseTime: response.responseTime, serverCount: response.data.length };
        });
        
        await this.testEndpoint(suite, 'POST /api/mcp/call', async () => {
            const testCall = {
                server: 'git-memory-server',
                method: 'get_status',
                params: {}
            };
            
            const response = await this.httpClient.post('/api/mcp/call', testCall);
            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }
            return { responseTime: response.responseTime };
        });
        
        this.results.finalizeSuite(suite);
        console.log(`  ✅ API Integration Tests completed: ${suite.passed}/${suite.tests.length} passed`);
    }

    async runWebSocketIntegrationTests() {
        const suite = this.results.addTestSuite('WebSocket Integration Tests');
        console.log('\n🔌 WebSocket Integration Tests:');
        
        await this.testEndpoint(suite, 'WebSocket Connection', async () => {
            await this.wsClient.connect();
            if (!this.wsClient.connected) {
                throw new Error('Failed to connect to WebSocket');
            }
            return { connected: true };
        });
        
        await this.testEndpoint(suite, 'WebSocket Message Exchange', async () => {
            const testMessage = {
                type: 'ping',
                timestamp: Date.now()
            };
            
            const startTime = performance.now();
            const response = await this.wsClient.sendMessage(testMessage, true);
            const responseTime = performance.now() - startTime;
            
            if (!response || response.type !== 'pong') {
                throw new Error('Invalid ping-pong response');
            }
            
            return { responseTime };
        });
        
        await this.testEndpoint(suite, 'WebSocket MCP Call', async () => {
            const mcpCall = {
                type: 'mcp_call',
                server: 'git-memory-server',
                method: 'get_status',
                params: {}
            };
            
            const startTime = performance.now();
            const response = await this.wsClient.sendMessage(mcpCall, true);
            const responseTime = performance.now() - startTime;
            
            if (!response || response.type !== 'mcp_response') {
                throw new Error('Invalid MCP call response');
            }
            
            return { responseTime };
        });
        
        this.results.finalizeSuite(suite);
        console.log(`  ✅ WebSocket Integration Tests completed: ${suite.passed}/${suite.tests.length} passed`);
    }

    async runMCPIntegrationTests() {
        const suite = this.results.addTestSuite('MCP Integration Tests');
        console.log('\n🔧 MCP Integration Tests:');
        
        await this.testEndpoint(suite, 'MCP Server Discovery', async () => {
            const response = await this.httpClient.get('/api/mcp/servers');
            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }
            
            const servers = response.data;
            const requiredServers = INTEGRATION_CONFIG.testData.mcpServers;
            
            for (const required of requiredServers) {
                const found = servers.find(s => s.name.includes(required));
                if (!found) {
                    this.results.warnings.push(`MCP Server '${required}' not found`);
                }
            }
            
            return { responseTime: response.responseTime, serverCount: servers.length };
        });
        
        await this.testEndpoint(suite, 'MCP Server Health Check', async () => {
            const response = await this.httpClient.get('/api/mcp/servers');
            const servers = response.data;
            
            let healthyServers = 0;
            for (const server of servers) {
                try {
                    const healthResponse = await this.httpClient.post('/api/mcp/call', {
                        server: server.name,
                        method: 'get_status',
                        params: {}
                    });
                    
                    if (healthResponse.status === 200) {
                        healthyServers++;
                    }
                } catch (error) {
                    this.results.warnings.push(`MCP Server '${server.name}' health check failed: ${error.message}`);
                }
            }
            
            return { 
                responseTime: response.responseTime, 
                totalServers: servers.length,
                healthyServers
            };
        });
        
        this.results.finalizeSuite(suite);
        console.log(`  ✅ MCP Integration Tests completed: ${suite.passed}/${suite.tests.length} passed`);
    }

    async runFileSystemIntegrationTests() {
        const suite = this.results.addTestSuite('File System Integration Tests');
        console.log('\n📁 File System Integration Tests:');
        
        await this.testEndpoint(suite, 'File System Access', async () => {
            const testCall = {
                server: 'file-system-server',
                method: 'list_directory',
                params: { path: '.' }
            };
            
            const response = await this.httpClient.post('/api/mcp/call', testCall);
            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }
            
            return { responseTime: response.responseTime };
        });
        
        await this.testEndpoint(suite, 'File Read Operation', async () => {
            const testCall = {
                server: 'file-system-server',
                method: 'read_file',
                params: { path: 'package.json' }
            };
            
            const response = await this.httpClient.post('/api/mcp/call', testCall);
            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }
            
            const result = response.data;
            if (!result.content) {
                throw new Error('File content not returned');
            }
            
            return { responseTime: response.responseTime, fileSize: result.content.length };
        });
        
        this.results.finalizeSuite(suite);
        console.log(`  ✅ File System Integration Tests completed: ${suite.passed}/${suite.tests.length} passed`);
    }

    async runGitIntegrationTests() {
        const suite = this.results.addTestSuite('Git Integration Tests');
        console.log('\n🔀 Git Integration Tests:');
        
        await this.testEndpoint(suite, 'Git Status Check', async () => {
            const testCall = {
                server: 'git-memory-server',
                method: 'get_git_status',
                params: {}
            };
            
            const response = await this.httpClient.post('/api/mcp/call', testCall);
            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }
            
            return { responseTime: response.responseTime };
        });
        
        await this.testEndpoint(suite, 'Git Log Retrieval', async () => {
            const testCall = {
                server: 'git-memory-server',
                method: 'get_git_log',
                params: { limit: 10 }
            };
            
            const response = await this.httpClient.post('/api/mcp/call', testCall);
            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }
            
            const result = response.data;
            if (!result.commits || !Array.isArray(result.commits)) {
                throw new Error('Git log not returned properly');
            }
            
            return { responseTime: response.responseTime, commitCount: result.commits.length };
        });
        
        this.results.finalizeSuite(suite);
        console.log(`  ✅ Git Integration Tests completed: ${suite.passed}/${suite.tests.length} passed`);
    }

    async runAIIntegrationTests() {
        const suite = this.results.addTestSuite('AI Integration Tests');
        console.log('\n🤖 AI Integration Tests:');
        
        await this.testEndpoint(suite, 'AI Assistant Availability', async () => {
            const testCall = {
                server: 'ai-assistant-server',
                method: 'get_status',
                params: {}
            };
            
            const response = await this.httpClient.post('/api/mcp/call', testCall);
            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }
            
            return { responseTime: response.responseTime };
        });
        
        await this.testEndpoint(suite, 'AI Code Analysis', async () => {
            const testCall = {
                server: 'ai-assistant-server',
                method: 'analyze_code',
                params: {
                    code: 'function hello() { console.log("Hello World"); }',
                    language: 'javascript'
                }
            };
            
            const response = await this.httpClient.post('/api/mcp/call', testCall);
            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }
            
            const result = response.data;
            if (!result.analysis) {
                throw new Error('AI analysis not returned');
            }
            
            return { responseTime: response.responseTime };
        });
        
        this.results.finalizeSuite(suite);
        console.log(`  ✅ AI Integration Tests completed: ${suite.passed}/${suite.tests.length} passed`);
    }

    async runEndToEndTests() {
        const suite = this.results.addTestSuite('End-to-End Tests');
        console.log('\n🎯 End-to-End Tests:');
        
        await this.testEndpoint(suite, 'Complete Workflow Test', async () => {
            // Simulate a complete development workflow
            const startTime = performance.now();
            
            // 1. Get project status
            const statusResponse = await this.httpClient.get('/api/status');
            if (statusResponse.status !== 200) {
                throw new Error('Failed to get project status');
            }
            
            // 2. List files
            const filesResponse = await this.httpClient.post('/api/mcp/call', {
                server: 'file-system-server',
                method: 'list_directory',
                params: { path: '.' }
            });
            if (filesResponse.status !== 200) {
                throw new Error('Failed to list files');
            }
            
            // 3. Get git status
            const gitResponse = await this.httpClient.post('/api/mcp/call', {
                server: 'git-memory-server',
                method: 'get_git_status',
                params: {}
            });
            if (gitResponse.status !== 200) {
                throw new Error('Failed to get git status');
            }
            
            // 4. WebSocket real-time update
            const wsMessage = {
                type: 'project_update',
                action: 'file_changed',
                file: 'test.js'
            };
            
            await this.wsClient.sendMessage(wsMessage);
            
            const totalTime = performance.now() - startTime;
            
            return { responseTime: totalTime, steps: 4 };
        });
        
        await this.testEndpoint(suite, 'Multi-Service Integration', async () => {
            // Test integration between multiple services
            const startTime = performance.now();
            
            // Parallel calls to different services
            const promises = [
                this.httpClient.get('/api/health'),
                this.httpClient.post('/api/mcp/call', {
                    server: 'git-memory-server',
                    method: 'get_status',
                    params: {}
                }),
                this.httpClient.post('/api/mcp/call', {
                    server: 'file-system-server',
                    method: 'get_status',
                    params: {}
                })
            ];
            
            const results = await Promise.allSettled(promises);
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            
            if (successCount < 2) {
                throw new Error(`Only ${successCount}/3 services responded successfully`);
            }
            
            const totalTime = performance.now() - startTime;
            
            return { responseTime: totalTime, successfulServices: successCount };
        });
        
        this.results.finalizeSuite(suite);
        console.log(`  ✅ End-to-End Tests completed: ${suite.passed}/${suite.tests.length} passed`);
    }

    async testEndpoint(suite, testName, testFunction) {
        const startTime = performance.now();
        
        try {
            console.log(`  🧪 ${testName}...`);
            const result = await testFunction();
            const duration = performance.now() - startTime;
            
            this.results.addTest(suite, testName, 'passed', duration, null, result);
            console.log(`    ✅ Passed (${duration.toFixed(1)}ms)`);
            
        } catch (error) {
            const duration = performance.now() - startTime;
            this.results.addTest(suite, testName, 'failed', duration, error);
            console.log(`    ❌ Failed: ${error.message}`);
        }
    }

    async saveResults() {
        const reportsDir = path.join(__dirname, '..', 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const jsonPath = path.join(reportsDir, `integration-report-${timestamp}.json`);
        const htmlPath = path.join(reportsDir, `integration-report-${timestamp}.html`);
        
        // Save JSON report
        fs.writeFileSync(jsonPath, JSON.stringify(this.results.results, null, 2));
        
        // Generate and save HTML report
        const htmlReport = this.generateHTMLReport();
        fs.writeFileSync(htmlPath, htmlReport);
        
        console.log(`\n📄 Integration Report saved:`);
        console.log(`  📋 JSON: ${jsonPath}`);
        console.log(`  🌐 HTML: ${htmlPath}`);
    }

    generateHTMLReport() {
        const results = this.results.results;
        const summary = results.summary;
        
        const successRate = summary.total > 0 ? (summary.passed / summary.total) * 100 : 0;
        const statusColor = successRate >= 90 ? '#28a745' : 
                           successRate >= 70 ? '#ffc107' : '#dc3545';
        
        return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS IDE Integration Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .success-rate { font-size: 64px; font-weight: bold; color: ${statusColor}; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-number { font-size: 36px; font-weight: bold; color: #007bff; }
        .summary-label { font-size: 14px; color: #6c757d; margin-top: 5px; }
        .test-suite { margin: 20px 0; background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .test-suite h3 { margin: 0 0 15px 0; color: #333; }
        .test-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
        .test-card { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; }
        .test-passed { border-left-color: #28a745; }
        .test-failed { border-left-color: #dc3545; }
        .test-skipped { border-left-color: #ffc107; }
        .error-section { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .warning-section { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background: #f8f9fa; font-weight: bold; }
        .status-passed { color: #28a745; font-weight: bold; }
        .status-failed { color: #dc3545; font-weight: bold; }
        .status-skipped { color: #ffc107; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 NEXUS IDE Integration Test Report</h1>
            <div class="success-rate">${successRate.toFixed(1)}%</div>
            <p><strong>Success Rate</strong></p>
            <p><strong>Generated:</strong> ${results.timestamp}</p>
            <p><strong>Status:</strong> ${successRate >= 90 ? '✅ EXCELLENT' : successRate >= 70 ? '⚠️ GOOD' : '❌ NEEDS IMPROVEMENT'}</p>
        </div>
        
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-number">${summary.total}</div>
                <div class="summary-label">Total Tests</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${summary.passed}</div>
                <div class="summary-label">Passed</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${summary.failed}</div>
                <div class="summary-label">Failed</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${summary.skipped}</div>
                <div class="summary-label">Skipped</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${(summary.duration / 1000).toFixed(1)}s</div>
                <div class="summary-label">Total Duration</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${results.performance.averageResponseTime.toFixed(0)}ms</div>
                <div class="summary-label">Avg Response Time</div>
            </div>
        </div>
        
        ${results.testSuites.map(suite => `
        <div class="test-suite">
            <h3>${suite.name} (${suite.passed}/${suite.tests.length} passed, ${(suite.duration / 1000).toFixed(1)}s)</h3>
            <div class="test-grid">
                ${suite.tests.map(test => `
                <div class="test-card test-${test.status}">
                    <h4>${test.name}</h4>
                    <p><strong>Status:</strong> <span class="status-${test.status}">${test.status.toUpperCase()}</span></p>
                    <p><strong>Duration:</strong> ${test.duration.toFixed(1)}ms</p>
                    ${test.details ? `<p><strong>Response Time:</strong> ${test.details.responseTime ? test.details.responseTime.toFixed(1) + 'ms' : 'N/A'}</p>` : ''}
                    ${test.error ? `<p><strong>Error:</strong> ${test.error.message || test.error}</p>` : ''}
                </div>
                `).join('')}
            </div>
        </div>
        `).join('')}
        
        ${results.errors.length > 0 ? `
        <div class="error-section">
            <h2>❌ Errors (${results.errors.length})</h2>
            ${results.errors.map(error => `
                <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px;">
                    <strong>${error.suite} - ${error.test}</strong><br>
                    <code>${error.error}</code><br>
                    <small>${error.timestamp}</small>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${results.warnings.length > 0 ? `
        <div class="warning-section">
            <h2>⚠️ Warnings (${results.warnings.length})</h2>
            ${results.warnings.map(warning => `
                <div style="margin: 5px 0;">• ${warning}</div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="test-suite">
            <h2>📊 Performance Metrics</h2>
            <table>
                <tr><th>Metric</th><th>Value</th></tr>
                <tr><td>Average Response Time</td><td>${results.performance.averageResponseTime.toFixed(1)}ms</td></tr>
                <tr><td>Fastest Endpoint</td><td>${results.performance.fastestEndpoint ? `${results.performance.fastestEndpoint.endpoint} (${results.performance.fastestEndpoint.time.toFixed(1)}ms)` : 'N/A'}</td></tr>
                <tr><td>Slowest Endpoint</td><td>${results.performance.slowestEndpoint ? `${results.performance.slowestEndpoint.endpoint} (${results.performance.slowestEndpoint.time.toFixed(1)}ms)` : 'N/A'}</td></tr>
                <tr><td>Total Test Duration</td><td>${(summary.duration / 1000).toFixed(1)} seconds</td></tr>
                <tr><td>Tests per Second</td><td>${(summary.total / (summary.duration / 1000)).toFixed(1)}</td></tr>
            </table>
        </div>
    </div>
</body>
</html>
        `;
    }

    displayResults() {
        const results = this.results.results;
        const summary = results.summary;
        const successRate = summary.total > 0 ? (summary.passed / summary.total) * 100 : 0;
        
        console.log('\n🧪 สรุปผลการทดสอบ Integration:');
        console.log('=' .repeat(60));
        console.log(`📊 Success Rate: ${successRate.toFixed(1)}%`);
        console.log(`📊 Total Tests: ${summary.total}`);
        console.log(`📊 Passed: ${summary.passed}`);
        console.log(`📊 Failed: ${summary.failed}`);
        console.log(`📊 Skipped: ${summary.skipped}`);
        console.log(`📊 Duration: ${(summary.duration / 1000).toFixed(1)}s`);
        console.log(`📊 Average Response Time: ${results.performance.averageResponseTime.toFixed(1)}ms`);
        
        if (results.performance.fastestEndpoint) {
            console.log(`📊 Fastest: ${results.performance.fastestEndpoint.endpoint} (${results.performance.fastestEndpoint.time.toFixed(1)}ms)`);
        }
        
        if (results.performance.slowestEndpoint) {
            console.log(`📊 Slowest: ${results.performance.slowestEndpoint.endpoint} (${results.performance.slowestEndpoint.time.toFixed(1)}ms)`);
        }
        
        console.log('\n📋 Test Suites:');
        results.testSuites.forEach(suite => {
            const suiteSuccessRate = suite.tests.length > 0 ? (suite.passed / suite.tests.length) * 100 : 0;
            console.log(`  ${suite.name}: ${suite.passed}/${suite.tests.length} (${suiteSuccessRate.toFixed(1)}%)`);
        });
        
        if (results.errors.length > 0) {
            console.log('\n❌ Errors:');
            results.errors.forEach(error => {
                console.log(`  • ${error.suite} - ${error.test}: ${error.error}`);
            });
        }
        
        if (results.warnings.length > 0) {
            console.log('\n⚠️ Warnings:');
            results.warnings.forEach(warning => {
                console.log(`  • ${warning}`);
            });
        }
        
        const status = successRate >= 90 ? '✅ EXCELLENT' : 
                      successRate >= 70 ? '⚠️ GOOD' : '❌ NEEDS IMPROVEMENT';
        console.log(`\n🎯 Overall Status: ${status}`);
    }

    async cleanup() {
        try {
            if (this.wsClient && this.wsClient.connected) {
                await this.wsClient.disconnect();
            }
        } catch (error) {
            console.warn('Cleanup warning:', error.message);
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run integration tests if this file is executed directly
if (require.main === module) {
    const runner = new IntegrationTestRunner();
    runner.runAllIntegrationTests().catch(error => {
        console.error('💥 เกิดข้อผิดพลาดในการทดสอบ Integration:', error);
        process.exit(1);
    });
}

module.exports = {
    IntegrationTestRunner,
    IntegrationTestResults,
    HTTPClient,
    WebSocketClient
};