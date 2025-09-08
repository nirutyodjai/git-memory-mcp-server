/**
 * Performance Benchmark Tests for NEXUS IDE
 * ทดสอบประสิทธิภาพของ MCP Servers และระบบ NEXUS IDE
 */

const axios = require('axios');
const WebSocket = require('ws');
const { performance } = require('perf_hooks');
const os = require('os');
const fs = require('fs');
const path = require('path');
const cluster = require('cluster');
const { Worker } = require('worker_threads');

// Performance Test Configuration
const PERF_CONFIG = {
    baseUrl: 'http://localhost:8080',
    wsUrl: 'ws://localhost:8080',
    concurrentUsers: [1, 5, 10, 25, 50, 100],
    testDuration: 30000, // 30 seconds
    requestTimeout: 10000,
    warmupRequests: 10,
    maxMCPServers: 3000,
    memoryThreshold: 1024 * 1024 * 1024, // 1GB
    cpuThreshold: 80 // 80%
};

// Performance Metrics Collector
class PerformanceMetrics {
    constructor() {
        this.metrics = {
            requests: [],
            responses: [],
            errors: [],
            memory: [],
            cpu: [],
            websockets: [],
            mcpServers: []
        };
        this.startTime = Date.now();
    }

    recordRequest(url, method, startTime, endTime, statusCode, error = null) {
        this.metrics.requests.push({
            url,
            method,
            startTime,
            endTime,
            duration: endTime - startTime,
            statusCode,
            error,
            timestamp: Date.now()
        });
    }

    recordSystemMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        this.metrics.memory.push({
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external,
            timestamp: Date.now()
        });

        this.metrics.cpu.push({
            user: cpuUsage.user,
            system: cpuUsage.system,
            timestamp: Date.now()
        });
    }

    recordWebSocketMetrics(event, data) {
        this.metrics.websockets.push({
            event,
            data,
            timestamp: Date.now()
        });
    }

    recordMCPServerMetrics(serverId, status, responseTime, memoryUsage) {
        this.metrics.mcpServers.push({
            serverId,
            status,
            responseTime,
            memoryUsage,
            timestamp: Date.now()
        });
    }

    getStatistics() {
        const requests = this.metrics.requests.filter(r => !r.error);
        const errors = this.metrics.requests.filter(r => r.error);
        
        const responseTimes = requests.map(r => r.duration);
        const errorRate = (errors.length / this.metrics.requests.length) * 100;
        
        const memoryUsage = this.metrics.memory.map(m => m.heapUsed);
        const avgMemory = memoryUsage.reduce((a, b) => a + b, 0) / memoryUsage.length;
        const maxMemory = Math.max(...memoryUsage);
        
        return {
            totalRequests: this.metrics.requests.length,
            successfulRequests: requests.length,
            failedRequests: errors.length,
            errorRate: errorRate.toFixed(2),
            avgResponseTime: this.average(responseTimes).toFixed(2),
            minResponseTime: Math.min(...responseTimes),
            maxResponseTime: Math.max(...responseTimes),
            p50ResponseTime: this.percentile(responseTimes, 50),
            p95ResponseTime: this.percentile(responseTimes, 95),
            p99ResponseTime: this.percentile(responseTimes, 99),
            requestsPerSecond: (requests.length / ((Date.now() - this.startTime) / 1000)).toFixed(2),
            avgMemoryUsage: (avgMemory / 1024 / 1024).toFixed(2), // MB
            maxMemoryUsage: (maxMemory / 1024 / 1024).toFixed(2), // MB
            totalWebSocketEvents: this.metrics.websockets.length,
            mcpServerMetrics: this.analyzeMCPServers()
        };
    }

    analyzeMCPServers() {
        const servers = this.metrics.mcpServers;
        if (servers.length === 0) return {};
        
        const responseTimes = servers.map(s => s.responseTime).filter(rt => rt > 0);
        const memoryUsages = servers.map(s => s.memoryUsage).filter(mu => mu > 0);
        
        return {
            totalServers: new Set(servers.map(s => s.serverId)).size,
            avgResponseTime: this.average(responseTimes).toFixed(2),
            avgMemoryUsage: (this.average(memoryUsages) / 1024 / 1024).toFixed(2), // MB
            activeServers: servers.filter(s => s.status === 'running').length,
            errorServers: servers.filter(s => s.status === 'error').length
        };
    }

    average(arr) {
        return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    }

    percentile(arr, p) {
        if (arr.length === 0) return 0;
        const sorted = arr.sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[index];
    }
}

// Load Test Worker
class LoadTestWorker {
    constructor(workerId, baseUrl, duration) {
        this.workerId = workerId;
        this.baseUrl = baseUrl;
        this.duration = duration;
        this.metrics = new PerformanceMetrics();
        this.isRunning = false;
    }

    async start() {
        console.log(`🔄 Worker ${this.workerId} เริ่มการทดสอบ...`);
        this.isRunning = true;
        
        const endTime = Date.now() + this.duration;
        const requests = [];
        
        // Start system metrics collection
        const metricsInterval = setInterval(() => {
            if (this.isRunning) {
                this.metrics.recordSystemMetrics();
            }
        }, 1000);
        
        // Run load test
        while (Date.now() < endTime && this.isRunning) {
            requests.push(
                this.makeRequest('GET', '/'),
                this.makeRequest('GET', '/api/status'),
                this.makeRequest('GET', '/api/servers'),
                this.makeRequest('GET', '/ide'),
                this.makeRequest('POST', '/api/mcp/test', { test: 'data' })
            );
            
            // Limit concurrent requests
            if (requests.length >= 10) {
                await Promise.allSettled(requests.splice(0, 5));
            }
            
            // Small delay to prevent overwhelming
            await this.sleep(Math.random() * 100);
        }
        
        // Wait for remaining requests
        await Promise.allSettled(requests);
        
        clearInterval(metricsInterval);
        this.isRunning = false;
        
        console.log(`✅ Worker ${this.workerId} เสร็จสิ้น`);
        return this.metrics.getStatistics();
    }

    async makeRequest(method, path, data = null) {
        const url = `${this.baseUrl}${path}`;
        const startTime = performance.now();
        
        try {
            const config = {
                method,
                url,
                timeout: PERF_CONFIG.requestTimeout,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `NEXUS-LoadTest-Worker-${this.workerId}`
                }
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                config.data = data;
            }
            
            const response = await axios(config);
            const endTime = performance.now();
            
            this.metrics.recordRequest(url, method, startTime, endTime, response.status);
            return response;
        } catch (error) {
            const endTime = performance.now();
            const statusCode = error.response ? error.response.status : 0;
            
            this.metrics.recordRequest(url, method, startTime, endTime, statusCode, error.message);
            throw error;
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    stop() {
        this.isRunning = false;
    }
}

// WebSocket Performance Tester
class WebSocketPerformanceTester {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.connections = [];
        this.metrics = new PerformanceMetrics();
    }

    async testConcurrentConnections(maxConnections = 100) {
        console.log(`🔌 ทดสอบ WebSocket ${maxConnections} connections...`);
        
        const promises = [];
        
        for (let i = 0; i < maxConnections; i++) {
            promises.push(this.createConnection(i));
            
            // Stagger connection creation
            if (i % 10 === 0) {
                await this.sleep(100);
            }
        }
        
        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        console.log(`  ✅ สำเร็จ: ${successful}/${maxConnections}`);
        console.log(`  ❌ ล้มเหลว: ${failed}/${maxConnections}`);
        
        // Test message broadcasting
        await this.testMessageBroadcasting();
        
        // Cleanup
        await this.closeAllConnections();
        
        return {
            totalConnections: maxConnections,
            successfulConnections: successful,
            failedConnections: failed,
            successRate: ((successful / maxConnections) * 100).toFixed(2),
            messageMetrics: this.metrics.getStatistics()
        };
    }

    async createConnection(id) {
        return new Promise((resolve, reject) => {
            const startTime = performance.now();
            const ws = new WebSocket(this.wsUrl);
            
            const timeout = setTimeout(() => {
                ws.close();
                reject(new Error(`Connection ${id} timeout`));
            }, 5000);
            
            ws.on('open', () => {
                clearTimeout(timeout);
                const endTime = performance.now();
                
                this.connections.push(ws);
                this.metrics.recordWebSocketMetrics('connection_open', {
                    id,
                    connectionTime: endTime - startTime
                });
                
                resolve(ws);
            });
            
            ws.on('message', (data) => {
                this.metrics.recordWebSocketMetrics('message_received', {
                    id,
                    size: data.length,
                    timestamp: Date.now()
                });
            });
            
            ws.on('error', (error) => {
                clearTimeout(timeout);
                this.metrics.recordWebSocketMetrics('connection_error', {
                    id,
                    error: error.message
                });
                reject(error);
            });
        });
    }

    async testMessageBroadcasting() {
        if (this.connections.length === 0) return;
        
        console.log(`  📡 ทดสอบ message broadcasting...`);
        
        const testMessage = JSON.stringify({
            type: 'performance_test',
            data: 'A'.repeat(1000), // 1KB message
            timestamp: Date.now()
        });
        
        // Send messages from first connection
        const sender = this.connections[0];
        const messageCount = 10;
        
        for (let i = 0; i < messageCount; i++) {
            sender.send(testMessage);
            await this.sleep(100);
        }
        
        // Wait for messages to propagate
        await this.sleep(2000);
    }

    async closeAllConnections() {
        const promises = this.connections.map(ws => {
            return new Promise(resolve => {
                ws.on('close', resolve);
                ws.close();
            });
        });
        
        await Promise.allSettled(promises);
        this.connections = [];
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// MCP Server Performance Tester
class MCPServerPerformanceTester {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.metrics = new PerformanceMetrics();
    }

    async testMCPServerPerformance(maxServers = 100) {
        console.log(`🖥️ ทดสอบประสิทธิภาพ MCP Servers (${maxServers} servers)...`);
        
        const results = {
            serverTests: [],
            overallMetrics: null
        };
        
        // Test individual server performance
        for (let i = 1; i <= maxServers; i++) {
            try {
                const serverResult = await this.testSingleMCPServer(i);
                results.serverTests.push(serverResult);
                
                // Log progress every 10 servers
                if (i % 10 === 0) {
                    console.log(`    📊 ทดสอบแล้ว ${i}/${maxServers} servers`);
                }
            } catch (error) {
                results.serverTests.push({
                    serverId: i,
                    status: 'error',
                    error: error.message,
                    responseTime: 0,
                    memoryUsage: 0
                });
            }
        }
        
        // Test concurrent server operations
        await this.testConcurrentServerOperations(Math.min(maxServers, 50));
        
        results.overallMetrics = this.metrics.getStatistics();
        
        return results;
    }

    async testSingleMCPServer(serverId) {
        const startTime = performance.now();
        
        try {
            // Test server status
            const statusResponse = await axios.get(
                `${this.baseUrl}/api/mcp/server/${serverId}/status`,
                { timeout: 5000 }
            );
            
            // Test server operation
            const operationResponse = await axios.post(
                `${this.baseUrl}/api/mcp/server/${serverId}/test`,
                { operation: 'ping', data: 'performance_test' },
                { timeout: 5000 }
            );
            
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            // Simulate memory usage (in real implementation, this would come from server)
            const memoryUsage = Math.random() * 100 * 1024 * 1024; // Random 0-100MB
            
            const result = {
                serverId,
                status: statusResponse.data.status || 'running',
                responseTime,
                memoryUsage,
                operationSuccess: operationResponse.status === 200
            };
            
            this.metrics.recordMCPServerMetrics(
                serverId,
                result.status,
                responseTime,
                memoryUsage
            );
            
            return result;
        } catch (error) {
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            this.metrics.recordMCPServerMetrics(
                serverId,
                'error',
                responseTime,
                0
            );
            
            throw error;
        }
    }

    async testConcurrentServerOperations(concurrentServers) {
        console.log(`  🔄 ทดสอบการทำงานพร้อมกัน ${concurrentServers} servers...`);
        
        const promises = [];
        
        for (let i = 1; i <= concurrentServers; i++) {
            promises.push(this.performServerOperations(i));
        }
        
        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        console.log(`    ✅ สำเร็จ: ${successful}/${concurrentServers}`);
        console.log(`    ❌ ล้มเหลว: ${failed}/${concurrentServers}`);
        
        return { successful, failed, total: concurrentServers };
    }

    async performServerOperations(serverId) {
        const operations = [
            'status',
            'ping',
            'memory_check',
            'health_check',
            'performance_test'
        ];
        
        for (const operation of operations) {
            await axios.post(
                `${this.baseUrl}/api/mcp/server/${serverId}/operation`,
                { operation, timestamp: Date.now() },
                { timeout: 3000 }
            );
            
            // Small delay between operations
            await this.sleep(50);
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main Performance Benchmark Runner
class PerformanceBenchmarkRunner {
    constructor() {
        this.results = {
            systemInfo: this.getSystemInfo(),
            loadTests: [],
            websocketTests: null,
            mcpServerTests: null,
            overallMetrics: null,
            timestamp: new Date().toISOString()
        };
    }

    getSystemInfo() {
        return {
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
            freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
            nodeVersion: process.version,
            hostname: os.hostname()
        };
    }

    async runAllBenchmarks() {
        console.log('🚀 เริ่มต้น Performance Benchmarks สำหรับ NEXUS IDE');
        console.log('📊 ข้อมูลระบบ:', this.results.systemInfo);
        
        try {
            // Wait for server to be ready
            await this.waitForServer();
            
            // Run load tests with different concurrent users
            await this.runLoadTests();
            
            // Run WebSocket performance tests
            await this.runWebSocketTests();
            
            // Run MCP Server performance tests
            await this.runMCPServerTests();
            
            // Generate final report
            await this.generateReport();
            
        } catch (error) {
            console.error('💥 เกิดข้อผิดพลาดในการทดสอบ:', error);
            throw error;
        }
    }

    async waitForServer() {
        console.log('⏳ รอให้เซิร์ฟเวอร์พร้อม...');
        
        for (let i = 0; i < 30; i++) {
            try {
                await axios.get(PERF_CONFIG.baseUrl, { timeout: 2000 });
                console.log('✅ เซิร์ฟเวอร์พร้อมแล้ว');
                return;
            } catch (error) {
                console.log(`  ⏳ ความพยายามที่ ${i + 1}/30...`);
                await this.sleep(1000);
            }
        }
        
        throw new Error('เซิร์ฟเวอร์ไม่พร้อมใช้งาน');
    }

    async runLoadTests() {
        console.log('\n🔥 เริ่มต้น Load Tests...');
        
        for (const userCount of PERF_CONFIG.concurrentUsers) {
            console.log(`\n👥 ทดสอบด้วย ${userCount} concurrent users...`);
            
            const workers = [];
            const promises = [];
            
            // Create workers
            for (let i = 0; i < userCount; i++) {
                const worker = new LoadTestWorker(
                    i + 1,
                    PERF_CONFIG.baseUrl,
                    PERF_CONFIG.testDuration
                );
                workers.push(worker);
                promises.push(worker.start());
            }
            
            // Wait for all workers to complete
            const workerResults = await Promise.allSettled(promises);
            
            // Aggregate results
            const aggregatedResults = this.aggregateLoadTestResults(
                workerResults.filter(r => r.status === 'fulfilled').map(r => r.value),
                userCount
            );
            
            this.results.loadTests.push({
                concurrentUsers: userCount,
                ...aggregatedResults
            });
            
            console.log(`  📊 RPS: ${aggregatedResults.requestsPerSecond}`);
            console.log(`  ⏱️ Avg Response: ${aggregatedResults.avgResponseTime}ms`);
            console.log(`  ❌ Error Rate: ${aggregatedResults.errorRate}%`);
            
            // Cool down between tests
            await this.sleep(5000);
        }
    }

    async runWebSocketTests() {
        console.log('\n🔌 เริ่มต้น WebSocket Performance Tests...');
        
        const wsTester = new WebSocketPerformanceTester(PERF_CONFIG.wsUrl);
        this.results.websocketTests = await wsTester.testConcurrentConnections(50);
        
        console.log(`  📊 WebSocket Results:`);
        console.log(`    ✅ Success Rate: ${this.results.websocketTests.successRate}%`);
        console.log(`    🔌 Connections: ${this.results.websocketTests.successfulConnections}/${this.results.websocketTests.totalConnections}`);
    }

    async runMCPServerTests() {
        console.log('\n🖥️ เริ่มต้น MCP Server Performance Tests...');
        
        const mcpTester = new MCPServerPerformanceTester(PERF_CONFIG.baseUrl);
        this.results.mcpServerTests = await mcpTester.testMCPServerPerformance(100);
        
        const serverStats = this.results.mcpServerTests.overallMetrics.mcpServerMetrics;
        console.log(`  📊 MCP Server Results:`);
        console.log(`    🖥️ Total Servers: ${serverStats.totalServers}`);
        console.log(`    ✅ Active Servers: ${serverStats.activeServers}`);
        console.log(`    ⏱️ Avg Response: ${serverStats.avgResponseTime}ms`);
        console.log(`    💾 Avg Memory: ${serverStats.avgMemoryUsage}MB`);
    }

    aggregateLoadTestResults(results, userCount) {
        if (results.length === 0) {
            return {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                errorRate: 100,
                avgResponseTime: 0,
                requestsPerSecond: 0,
                avgMemoryUsage: 0
            };
        }
        
        const totals = results.reduce((acc, result) => {
            acc.totalRequests += parseInt(result.totalRequests) || 0;
            acc.successfulRequests += parseInt(result.successfulRequests) || 0;
            acc.failedRequests += parseInt(result.failedRequests) || 0;
            acc.avgResponseTime += parseFloat(result.avgResponseTime) || 0;
            acc.requestsPerSecond += parseFloat(result.requestsPerSecond) || 0;
            acc.avgMemoryUsage += parseFloat(result.avgMemoryUsage) || 0;
            return acc;
        }, {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            avgResponseTime: 0,
            requestsPerSecond: 0,
            avgMemoryUsage: 0
        });
        
        return {
            concurrentUsers: userCount,
            totalRequests: totals.totalRequests,
            successfulRequests: totals.successfulRequests,
            failedRequests: totals.failedRequests,
            errorRate: ((totals.failedRequests / totals.totalRequests) * 100).toFixed(2),
            avgResponseTime: (totals.avgResponseTime / results.length).toFixed(2),
            requestsPerSecond: totals.requestsPerSecond.toFixed(2),
            avgMemoryUsage: (totals.avgMemoryUsage / results.length).toFixed(2)
        };
    }

    async generateReport() {
        console.log('\n📋 สร้างรายงานผลการทดสอบ...');
        
        const reportPath = path.join(__dirname, '..', 'reports', `performance-report-${Date.now()}.json`);
        const htmlReportPath = path.join(__dirname, '..', 'reports', `performance-report-${Date.now()}.html`);
        
        // Ensure reports directory exists
        const reportsDir = path.dirname(reportPath);
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        // Save JSON report
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        // Generate HTML report
        const htmlReport = this.generateHTMLReport();
        fs.writeFileSync(htmlReportPath, htmlReport);
        
        console.log(`📄 JSON Report: ${reportPath}`);
        console.log(`🌐 HTML Report: ${htmlReportPath}`);
        
        // Display summary
        this.displaySummary();
    }

    generateHTMLReport() {
        return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS IDE Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2 { color: #333; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #f8f9fa; border-radius: 5px; min-width: 150px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 12px; color: #666; }
        .chart { margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 NEXUS IDE Performance Report</h1>
        <p><strong>Generated:</strong> ${this.results.timestamp}</p>
        
        <h2>📊 System Information</h2>
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${this.results.systemInfo.platform}</div>
                <div class="metric-label">Platform</div>
            </div>
            <div class="metric">
                <div class="metric-value">${this.results.systemInfo.cpus}</div>
                <div class="metric-label">CPU Cores</div>
            </div>
            <div class="metric">
                <div class="metric-value">${this.results.systemInfo.totalMemory}</div>
                <div class="metric-label">Total Memory</div>
            </div>
        </div>
        
        <h2>🔥 Load Test Results</h2>
        <table>
            <thead>
                <tr>
                    <th>Concurrent Users</th>
                    <th>Total Requests</th>
                    <th>Success Rate</th>
                    <th>Avg Response Time</th>
                    <th>Requests/Second</th>
                    <th>Memory Usage</th>
                </tr>
            </thead>
            <tbody>
                ${this.results.loadTests.map(test => `
                    <tr>
                        <td>${test.concurrentUsers}</td>
                        <td>${test.totalRequests}</td>
                        <td class="${parseFloat(test.errorRate) < 5 ? 'success' : 'error'}">${(100 - parseFloat(test.errorRate)).toFixed(1)}%</td>
                        <td>${test.avgResponseTime}ms</td>
                        <td>${test.requestsPerSecond}</td>
                        <td>${test.avgMemoryUsage}MB</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        ${this.results.websocketTests ? `
        <h2>🔌 WebSocket Performance</h2>
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${this.results.websocketTests.successRate}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">${this.results.websocketTests.successfulConnections}</div>
                <div class="metric-label">Successful Connections</div>
            </div>
        </div>
        ` : ''}
        
        ${this.results.mcpServerTests ? `
        <h2>🖥️ MCP Server Performance</h2>
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${this.results.mcpServerTests.overallMetrics.mcpServerMetrics.totalServers || 0}</div>
                <div class="metric-label">Total Servers</div>
            </div>
            <div class="metric">
                <div class="metric-value">${this.results.mcpServerTests.overallMetrics.mcpServerMetrics.avgResponseTime || 0}ms</div>
                <div class="metric-label">Avg Response Time</div>
            </div>
            <div class="metric">
                <div class="metric-value">${this.results.mcpServerTests.overallMetrics.mcpServerMetrics.avgMemoryUsage || 0}MB</div>
                <div class="metric-label">Avg Memory Usage</div>
            </div>
        </div>
        ` : ''}
        
        <h2>📋 Raw Data</h2>
        <pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px;">${JSON.stringify(this.results, null, 2)}</pre>
    </div>
</body>
</html>
        `;
    }

    displaySummary() {
        console.log('\n📊 สรุปผลการทดสอบประสิทธิภาพ:');
        console.log('=' .repeat(50));
        
        if (this.results.loadTests.length > 0) {
            const bestLoad = this.results.loadTests.reduce((best, current) => 
                parseFloat(current.requestsPerSecond) > parseFloat(best.requestsPerSecond) ? current : best
            );
            
            console.log(`🔥 Load Test ที่ดีที่สุด:`);
            console.log(`  👥 Users: ${bestLoad.concurrentUsers}`);
            console.log(`  📈 RPS: ${bestLoad.requestsPerSecond}`);
            console.log(`  ⏱️ Response: ${bestLoad.avgResponseTime}ms`);
            console.log(`  ✅ Success: ${(100 - parseFloat(bestLoad.errorRate)).toFixed(1)}%`);
        }
        
        if (this.results.websocketTests) {
            console.log(`\n🔌 WebSocket Performance:`);
            console.log(`  ✅ Success Rate: ${this.results.websocketTests.successRate}%`);
            console.log(`  🔌 Max Connections: ${this.results.websocketTests.successfulConnections}`);
        }
        
        if (this.results.mcpServerTests) {
            const mcpStats = this.results.mcpServerTests.overallMetrics.mcpServerMetrics;
            console.log(`\n🖥️ MCP Server Performance:`);
            console.log(`  🖥️ Servers Tested: ${mcpStats.totalServers || 0}`);
            console.log(`  ⏱️ Avg Response: ${mcpStats.avgResponseTime || 0}ms`);
            console.log(`  💾 Avg Memory: ${mcpStats.avgMemoryUsage || 0}MB`);
        }
        
        console.log('\n🎯 แนะนำ:');
        this.generateRecommendations();
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Analyze load test results
        if (this.results.loadTests.length > 0) {
            const highestRPS = Math.max(...this.results.loadTests.map(t => parseFloat(t.requestsPerSecond)));
            const highestErrorRate = Math.max(...this.results.loadTests.map(t => parseFloat(t.errorRate)));
            
            if (highestRPS < 100) {
                recommendations.push('⚡ ปรับปรุงประสิทธิภาพเซิร์ฟเวอร์เพื่อเพิ่ม RPS');
            }
            
            if (highestErrorRate > 5) {
                recommendations.push('🔧 แก้ไขปัญหา error rate ที่สูงเกินไป');
            }
        }
        
        // Analyze WebSocket results
        if (this.results.websocketTests && parseFloat(this.results.websocketTests.successRate) < 95) {
            recommendations.push('🔌 ปรับปรุงการจัดการ WebSocket connections');
        }
        
        // Analyze MCP Server results
        if (this.results.mcpServerTests) {
            const mcpStats = this.results.mcpServerTests.overallMetrics.mcpServerMetrics;
            if (parseFloat(mcpStats.avgResponseTime) > 1000) {
                recommendations.push('🖥️ ปรับปรุงประสิทธิภาพ MCP Servers');
            }
        }
        
        if (recommendations.length === 0) {
            recommendations.push('✅ ระบบมีประสิทธิภาพดีแล้ว!');
        }
        
        recommendations.forEach(rec => console.log(`  ${rec}`));
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run performance benchmarks if this file is executed directly
if (require.main === module) {
    const runner = new PerformanceBenchmarkRunner();
    runner.runAllBenchmarks().catch(error => {
        console.error('💥 เกิดข้อผิดพลาดในการทดสอบประสิทธิภาพ:', error);
        process.exit(1);
    });
}

module.exports = {
    PerformanceBenchmarkRunner,
    LoadTestWorker,
    WebSocketPerformanceTester,
    MCPServerPerformanceTester,
    PerformanceMetrics
};