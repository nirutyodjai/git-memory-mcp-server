/**
 * Performance Tests for NEXUS IDE
 * ทดสอบประสิทธิภาพและการรองรับ load ของระบบ
 */

const { performance } = require('perf_hooks');
const axios = require('axios');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cluster = require('cluster');
const { Worker } = require('worker_threads');

// Performance Test Configuration
const PERF_CONFIG = {
    baseUrl: 'http://localhost:8080',
    wsUrl: 'ws://localhost:8080',
    testDuration: 60000, // 1 minute
    warmupDuration: 10000, // 10 seconds
    cooldownDuration: 5000, // 5 seconds
    maxConcurrentUsers: 1000,
    stepSize: 50,
    thresholds: {
        responseTime: {
            p50: 100, // 50th percentile < 100ms
            p95: 500, // 95th percentile < 500ms
            p99: 1000 // 99th percentile < 1000ms
        },
        throughput: {
            minimum: 1000, // requests per second
            target: 5000
        },
        errorRate: {
            maximum: 1 // 1% error rate
        },
        cpu: {
            maximum: 80 // 80% CPU usage
        },
        memory: {
            maximum: 2048 // 2GB memory usage
        }
    }
};

// Performance Metrics Collector
class PerformanceMetrics {
    constructor() {
        this.metrics = {
            timestamp: new Date().toISOString(),
            testConfig: PERF_CONFIG,
            system: {
                platform: os.platform(),
                arch: os.arch(),
                cpus: os.cpus().length,
                totalMemory: os.totalmem(),
                freeMemory: os.freemem(),
                nodeVersion: process.version
            },
            results: {
                responseTime: {
                    samples: [],
                    p50: 0,
                    p95: 0,
                    p99: 0,
                    min: 0,
                    max: 0,
                    avg: 0
                },
                throughput: {
                    rps: 0,
                    totalRequests: 0,
                    successfulRequests: 0,
                    failedRequests: 0,
                    duration: 0
                },
                errors: {
                    rate: 0,
                    types: {},
                    details: []
                },
                resources: {
                    cpu: {
                        samples: [],
                        avg: 0,
                        max: 0
                    },
                    memory: {
                        samples: [],
                        avg: 0,
                        max: 0
                    },
                    network: {
                        bytesIn: 0,
                        bytesOut: 0
                    }
                },
                websocket: {
                    connections: 0,
                    messages: 0,
                    latency: [],
                    errors: 0
                },
                loadTest: {
                    scenarios: [],
                    breakdown: {}
                }
            },
            analysis: {
                passed: false,
                score: 0,
                bottlenecks: [],
                recommendations: []
            }
        };
    }

    addResponseTime(time) {
        this.metrics.results.responseTime.samples.push(time);
    }

    addError(type, message, endpoint = null) {
        if (!this.metrics.results.errors.types[type]) {
            this.metrics.results.errors.types[type] = 0;
        }
        this.metrics.results.errors.types[type]++;
        
        this.metrics.results.errors.details.push({
            type,
            message,
            endpoint,
            timestamp: new Date().toISOString()
        });
    }

    addResourceSample(cpu, memory) {
        this.metrics.results.resources.cpu.samples.push(cpu);
        this.metrics.results.resources.memory.samples.push(memory);
    }

    calculateStatistics() {
        const responseTimes = this.metrics.results.responseTime.samples;
        
        if (responseTimes.length > 0) {
            responseTimes.sort((a, b) => a - b);
            
            this.metrics.results.responseTime.min = responseTimes[0];
            this.metrics.results.responseTime.max = responseTimes[responseTimes.length - 1];
            this.metrics.results.responseTime.avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            
            this.metrics.results.responseTime.p50 = this.percentile(responseTimes, 50);
            this.metrics.results.responseTime.p95 = this.percentile(responseTimes, 95);
            this.metrics.results.responseTime.p99 = this.percentile(responseTimes, 99);
        }

        // Calculate error rate
        const totalRequests = this.metrics.results.throughput.totalRequests;
        const failedRequests = this.metrics.results.throughput.failedRequests;
        this.metrics.results.errors.rate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

        // Calculate resource averages
        const cpuSamples = this.metrics.results.resources.cpu.samples;
        const memorySamples = this.metrics.results.resources.memory.samples;
        
        if (cpuSamples.length > 0) {
            this.metrics.results.resources.cpu.avg = cpuSamples.reduce((a, b) => a + b, 0) / cpuSamples.length;
            this.metrics.results.resources.cpu.max = Math.max(...cpuSamples);
        }
        
        if (memorySamples.length > 0) {
            this.metrics.results.resources.memory.avg = memorySamples.reduce((a, b) => a + b, 0) / memorySamples.length;
            this.metrics.results.resources.memory.max = Math.max(...memorySamples);
        }

        // Calculate throughput
        if (this.metrics.results.throughput.duration > 0) {
            this.metrics.results.throughput.rps = 
                (this.metrics.results.throughput.totalRequests / this.metrics.results.throughput.duration) * 1000;
        }
    }

    percentile(sortedArray, percentile) {
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
    }

    analyzeResults() {
        this.calculateStatistics();
        
        const results = this.metrics.results;
        const thresholds = PERF_CONFIG.thresholds;
        let score = 100;
        const bottlenecks = [];
        const recommendations = [];

        // Analyze response time
        if (results.responseTime.p95 > thresholds.responseTime.p95) {
            score -= 20;
            bottlenecks.push('High response time (P95)');
            recommendations.push('ปรับปรุงประสิทธิภาพการตอบสนองของ API');
        }
        
        if (results.responseTime.p99 > thresholds.responseTime.p99) {
            score -= 15;
            bottlenecks.push('Very high response time (P99)');
            recommendations.push('ตรวจสอบและแก้ไข slow queries หรือ operations');
        }

        // Analyze throughput
        if (results.throughput.rps < thresholds.throughput.minimum) {
            score -= 25;
            bottlenecks.push('Low throughput');
            recommendations.push('เพิ่มความสามารถในการรองรับ concurrent requests');
        }

        // Analyze error rate
        if (results.errors.rate > thresholds.errorRate.maximum) {
            score -= 30;
            bottlenecks.push('High error rate');
            recommendations.push('แก้ไขปัญหาที่ทำให้เกิด errors ในระบบ');
        }

        // Analyze resource usage
        if (results.resources.cpu.max > thresholds.cpu.maximum) {
            score -= 10;
            bottlenecks.push('High CPU usage');
            recommendations.push('ปรับปรุงประสิทธิภาพการใช้ CPU');
        }
        
        if (results.resources.memory.max > thresholds.memory.maximum * 1024 * 1024) {
            score -= 10;
            bottlenecks.push('High memory usage');
            recommendations.push('ปรับปรุงการจัดการ memory');
        }

        // WebSocket performance
        if (results.websocket.errors > results.websocket.connections * 0.05) {
            score -= 15;
            bottlenecks.push('WebSocket connection issues');
            recommendations.push('แก้ไขปัญหาการเชื่อมต่อ WebSocket');
        }

        this.metrics.analysis.score = Math.max(0, score);
        this.metrics.analysis.passed = score >= 70;
        this.metrics.analysis.bottlenecks = bottlenecks;
        this.metrics.analysis.recommendations = recommendations;

        if (recommendations.length === 0) {
            recommendations.push('ระบบมีประสิทธิภาพดี ควรติดตามอย่างสม่ำเสมอ');
        }
    }
}

// HTTP Load Tester
class HTTPLoadTester {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.activeRequests = 0;
        this.maxConcurrent = 0;
    }

    async runLoadTest(metrics, scenario) {
        console.log(`🚀 เริ่มต้น Load Test: ${scenario.name}`);
        console.log(`   👥 Users: ${scenario.users}`);
        console.log(`   ⏱️ Duration: ${scenario.duration / 1000}s`);
        console.log(`   🎯 Target: ${scenario.endpoint}`);

        const startTime = Date.now();
        const endTime = startTime + scenario.duration;
        const promises = [];
        let requestCount = 0;
        let successCount = 0;
        let errorCount = 0;

        // Warmup phase
        console.log('   🔥 Warmup phase...');
        await this.warmup(scenario.endpoint);

        // Main load test
        console.log('   💪 Load test phase...');
        
        for (let user = 0; user < scenario.users; user++) {
            const userPromise = this.simulateUser(scenario, metrics, startTime, endTime)
                .then(userStats => {
                    requestCount += userStats.requests;
                    successCount += userStats.success;
                    errorCount += userStats.errors;
                })
                .catch(error => {
                    console.error(`   ❌ User ${user} error:`, error.message);
                    errorCount++;
                });
            
            promises.push(userPromise);
            
            // Gradual ramp-up
            if (scenario.rampUp && user % 10 === 0) {
                await this.sleep(scenario.rampUp / (scenario.users / 10));
            }
        }

        // Wait for all users to complete
        await Promise.allSettled(promises);
        
        const actualDuration = Date.now() - startTime;
        
        // Update metrics
        metrics.metrics.results.throughput.totalRequests += requestCount;
        metrics.metrics.results.throughput.successfulRequests += successCount;
        metrics.metrics.results.throughput.failedRequests += errorCount;
        metrics.metrics.results.throughput.duration = actualDuration;

        const scenarioResult = {
            name: scenario.name,
            users: scenario.users,
            duration: actualDuration,
            requests: requestCount,
            success: successCount,
            errors: errorCount,
            rps: (requestCount / actualDuration) * 1000,
            errorRate: requestCount > 0 ? (errorCount / requestCount) * 100 : 0
        };

        metrics.metrics.results.loadTest.scenarios.push(scenarioResult);
        
        console.log(`   📊 Results:`);
        console.log(`      Requests: ${requestCount}`);
        console.log(`      Success: ${successCount}`);
        console.log(`      Errors: ${errorCount}`);
        console.log(`      RPS: ${scenarioResult.rps.toFixed(1)}`);
        console.log(`      Error Rate: ${scenarioResult.errorRate.toFixed(2)}%`);
        
        return scenarioResult;
    }

    async simulateUser(scenario, metrics, startTime, endTime) {
        let requests = 0;
        let success = 0;
        let errors = 0;

        while (Date.now() < endTime) {
            const requestStart = performance.now();
            
            try {
                this.activeRequests++;
                this.maxConcurrent = Math.max(this.maxConcurrent, this.activeRequests);
                
                const response = await axios.get(`${this.baseUrl}${scenario.endpoint}`, {
                    timeout: 10000,
                    validateStatus: () => true
                });
                
                const responseTime = performance.now() - requestStart;
                metrics.addResponseTime(responseTime);
                
                requests++;
                
                if (response.status >= 200 && response.status < 400) {
                    success++;
                } else {
                    errors++;
                    metrics.addError('HTTP_ERROR', `Status ${response.status}`, scenario.endpoint);
                }
                
            } catch (error) {
                const responseTime = performance.now() - requestStart;
                metrics.addResponseTime(responseTime);
                
                requests++;
                errors++;
                metrics.addError('REQUEST_ERROR', error.message, scenario.endpoint);
            } finally {
                this.activeRequests--;
            }
            
            // Think time between requests
            if (scenario.thinkTime) {
                await this.sleep(scenario.thinkTime);
            }
        }

        return { requests, success, errors };
    }

    async warmup(endpoint) {
        const warmupRequests = 10;
        const promises = [];
        
        for (let i = 0; i < warmupRequests; i++) {
            const promise = axios.get(`${this.baseUrl}${endpoint}`, {
                timeout: 5000
            }).catch(() => {});
            
            promises.push(promise);
        }
        
        await Promise.allSettled(promises);
        await this.sleep(1000); // Cool down
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// WebSocket Load Tester
class WebSocketLoadTester {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.connections = [];
    }

    async runWebSocketLoadTest(metrics, scenario) {
        console.log(`🔌 เริ่มต้น WebSocket Load Test: ${scenario.name}`);
        console.log(`   👥 Connections: ${scenario.connections}`);
        console.log(`   📨 Messages per connection: ${scenario.messagesPerConnection}`);
        console.log(`   ⏱️ Duration: ${scenario.duration / 1000}s`);

        const startTime = Date.now();
        const promises = [];
        let totalMessages = 0;
        let totalErrors = 0;
        const latencies = [];

        // Create WebSocket connections
        for (let i = 0; i < scenario.connections; i++) {
            const connectionPromise = this.simulateWebSocketUser(
                scenario, 
                metrics, 
                startTime, 
                i
            ).then(result => {
                totalMessages += result.messages;
                totalErrors += result.errors;
                latencies.push(...result.latencies);
            }).catch(error => {
                console.error(`   ❌ WebSocket connection ${i} error:`, error.message);
                totalErrors++;
            });
            
            promises.push(connectionPromise);
            
            // Gradual connection establishment
            if (i % 10 === 0 && i > 0) {
                await this.sleep(100);
            }
        }

        // Wait for all connections to complete
        await Promise.allSettled(promises);
        
        const duration = Date.now() - startTime;
        
        // Update metrics
        metrics.metrics.results.websocket.connections += scenario.connections;
        metrics.metrics.results.websocket.messages += totalMessages;
        metrics.metrics.results.websocket.errors += totalErrors;
        metrics.metrics.results.websocket.latency.push(...latencies);

        const result = {
            name: scenario.name,
            connections: scenario.connections,
            duration,
            messages: totalMessages,
            errors: totalErrors,
            avgLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
            messagesPerSecond: (totalMessages / duration) * 1000
        };

        console.log(`   📊 WebSocket Results:`);
        console.log(`      Connections: ${result.connections}`);
        console.log(`      Messages: ${result.messages}`);
        console.log(`      Errors: ${result.errors}`);
        console.log(`      Avg Latency: ${result.avgLatency.toFixed(1)}ms`);
        console.log(`      Messages/sec: ${result.messagesPerSecond.toFixed(1)}`);
        
        return result;
    }

    async simulateWebSocketUser(scenario, metrics, startTime, userId) {
        return new Promise((resolve, reject) => {
            let messages = 0;
            let errors = 0;
            const latencies = [];
            const messageTimestamps = new Map();
            
            const ws = new WebSocket(this.wsUrl);
            let connected = false;
            let messageInterval;
            
            const timeout = setTimeout(() => {
                if (!connected) {
                    ws.close();
                    reject(new Error('Connection timeout'));
                }
            }, 10000);
            
            ws.on('open', () => {
                connected = true;
                clearTimeout(timeout);
                
                // Start sending messages
                messageInterval = setInterval(() => {
                    if (Date.now() - startTime > scenario.duration) {
                        clearInterval(messageInterval);
                        ws.close();
                        return;
                    }
                    
                    const messageId = `${userId}-${Date.now()}-${Math.random()}`;
                    const timestamp = performance.now();
                    
                    messageTimestamps.set(messageId, timestamp);
                    
                    const message = {
                        id: messageId,
                        type: 'performance_test',
                        userId,
                        timestamp,
                        data: { test: 'load_test', size: 'small' }
                    };
                    
                    try {
                        ws.send(JSON.stringify(message));
                        messages++;
                    } catch (error) {
                        errors++;
                        metrics.addError('WEBSOCKET_SEND', error.message);
                    }
                }, scenario.messageInterval || 1000);
            });
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    
                    if (message.id && messageTimestamps.has(message.id)) {
                        const latency = performance.now() - messageTimestamps.get(message.id);
                        latencies.push(latency);
                        messageTimestamps.delete(message.id);
                    }
                } catch (error) {
                    // Ignore parsing errors for non-test messages
                }
            });
            
            ws.on('error', (error) => {
                errors++;
                metrics.addError('WEBSOCKET_ERROR', error.message);
            });
            
            ws.on('close', () => {
                clearInterval(messageInterval);
                clearTimeout(timeout);
                resolve({ messages, errors, latencies });
            });
        });
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// System Resource Monitor
class SystemResourceMonitor {
    constructor() {
        this.monitoring = false;
        this.interval = null;
    }

    startMonitoring(metrics, intervalMs = 1000) {
        if (this.monitoring) return;
        
        this.monitoring = true;
        console.log('📊 เริ่มต้นการติดตาม System Resources...');
        
        this.interval = setInterval(() => {
            const cpuUsage = this.getCPUUsage();
            const memoryUsage = this.getMemoryUsage();
            
            metrics.addResourceSample(cpuUsage, memoryUsage);
        }, intervalMs);
    }

    stopMonitoring() {
        if (!this.monitoring) return;
        
        this.monitoring = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        console.log('📊 หยุดการติดตาม System Resources');
    }

    getCPUUsage() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        
        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });
        
        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        
        return 100 - ~~(100 * idle / total);
    }

    getMemoryUsage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        
        return usedMemory; // bytes
    }
}

// Stress Test Scenarios
class StressTestScenarios {
    static getHTTPScenarios() {
        return [
            {
                name: 'Light Load',
                users: 10,
                duration: 30000,
                endpoint: '/api/status',
                thinkTime: 1000,
                rampUp: 5000
            },
            {
                name: 'Medium Load',
                users: 50,
                duration: 60000,
                endpoint: '/api/status',
                thinkTime: 500,
                rampUp: 10000
            },
            {
                name: 'Heavy Load',
                users: 100,
                duration: 60000,
                endpoint: '/api/status',
                thinkTime: 200,
                rampUp: 15000
            },
            {
                name: 'API Endpoints Mix',
                users: 75,
                duration: 45000,
                endpoint: '/api/mcp/servers',
                thinkTime: 300,
                rampUp: 12000
            },
            {
                name: 'Stress Test',
                users: 200,
                duration: 30000,
                endpoint: '/api/status',
                thinkTime: 100,
                rampUp: 5000
            }
        ];
    }

    static getWebSocketScenarios() {
        return [
            {
                name: 'WebSocket Light',
                connections: 10,
                duration: 30000,
                messagesPerConnection: 30,
                messageInterval: 1000
            },
            {
                name: 'WebSocket Medium',
                connections: 50,
                duration: 45000,
                messagesPerConnection: 45,
                messageInterval: 1000
            },
            {
                name: 'WebSocket Heavy',
                connections: 100,
                duration: 60000,
                messagesPerConnection: 60,
                messageInterval: 1000
            },
            {
                name: 'WebSocket Burst',
                connections: 25,
                duration: 20000,
                messagesPerConnection: 100,
                messageInterval: 200
            }
        ];
    }
}

// Main Performance Test Runner
class PerformanceTestRunner {
    constructor() {
        this.metrics = new PerformanceMetrics();
        this.httpTester = new HTTPLoadTester(PERF_CONFIG.baseUrl);
        this.wsTester = new WebSocketLoadTester(PERF_CONFIG.wsUrl);
        this.resourceMonitor = new SystemResourceMonitor();
    }

    async runAllPerformanceTests() {
        console.log('🚀 เริ่มต้น Performance Tests สำหรับ NEXUS IDE');
        console.log('🎯 Target:', PERF_CONFIG.baseUrl);
        console.log('⏱️ Test Duration:', PERF_CONFIG.testDuration / 1000, 'seconds');
        
        const startTime = performance.now();
        
        try {
            // Wait for server to be ready
            await this.waitForServer();
            
            // Start system monitoring
            this.resourceMonitor.startMonitoring(this.metrics);
            
            // Run HTTP load tests
            console.log('\n🌐 HTTP Load Tests:');
            const httpScenarios = StressTestScenarios.getHTTPScenarios();
            
            for (const scenario of httpScenarios) {
                await this.httpTester.runLoadTest(this.metrics, scenario);
                await this.sleep(2000); // Cool down between tests
            }
            
            // Run WebSocket load tests
            console.log('\n🔌 WebSocket Load Tests:');
            const wsScenarios = StressTestScenarios.getWebSocketScenarios();
            
            for (const scenario of wsScenarios) {
                await this.wsTester.runWebSocketLoadTest(this.metrics, scenario);
                await this.sleep(2000); // Cool down between tests
            }
            
            // Run spike tests
            console.log('\n⚡ Spike Tests:');
            await this.runSpikeTests();
            
            // Run endurance tests
            console.log('\n💪 Endurance Tests:');
            await this.runEnduranceTests();
            
            // Stop monitoring
            this.resourceMonitor.stopMonitoring();
            
            // Analyze results
            this.metrics.analyzeResults();
            
            // Calculate total duration
            const totalDuration = performance.now() - startTime;
            this.metrics.metrics.results.throughput.duration = totalDuration;
            
            // Save and display results
            await this.saveResults();
            this.displayResults();
            
            return this.metrics.metrics;
            
        } catch (error) {
            console.error('💥 เกิดข้อผิดพลาดในการทดสอบ Performance:', error);
            this.resourceMonitor.stopMonitoring();
            throw error;
        }
    }

    async runSpikeTests() {
        const spikeScenario = {
            name: 'Spike Test',
            users: 500,
            duration: 10000, // 10 seconds spike
            endpoint: '/api/status',
            thinkTime: 50,
            rampUp: 1000 // Very fast ramp up
        };
        
        console.log('   ⚡ Running spike test...');
        await this.httpTester.runLoadTest(this.metrics, spikeScenario);
    }

    async runEnduranceTests() {
        const enduranceScenario = {
            name: 'Endurance Test',
            users: 25,
            duration: 300000, // 5 minutes
            endpoint: '/api/status',
            thinkTime: 2000,
            rampUp: 30000
        };
        
        console.log('   💪 Running endurance test (5 minutes)...');
        await this.httpTester.runLoadTest(this.metrics, enduranceScenario);
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

    async saveResults() {
        const reportsDir = path.join(__dirname, '..', 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const jsonPath = path.join(reportsDir, `performance-report-${timestamp}.json`);
        const htmlPath = path.join(reportsDir, `performance-report-${timestamp}.html`);
        
        // Save JSON report
        fs.writeFileSync(jsonPath, JSON.stringify(this.metrics.metrics, null, 2));
        
        // Generate and save HTML report
        const htmlReport = this.generateHTMLReport();
        fs.writeFileSync(htmlPath, htmlReport);
        
        console.log(`\n📄 Performance Report saved:`);
        console.log(`  📋 JSON: ${jsonPath}`);
        console.log(`  🌐 HTML: ${htmlPath}`);
    }

    generateHTMLReport() {
        const metrics = this.metrics.metrics;
        const analysis = metrics.analysis;
        
        const scoreColor = analysis.score >= 80 ? '#28a745' : 
                          analysis.score >= 60 ? '#ffc107' : '#dc3545';
        
        return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS IDE Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .score { font-size: 64px; font-weight: bold; color: ${scoreColor}; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-number { font-size: 36px; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 14px; color: #6c757d; margin-top: 5px; }
        .chart-section { margin: 30px 0; background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .scenario-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
        .scenario-card { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; }
        .bottleneck { background: #fff3cd; border-left-color: #ffc107; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .recommendation { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 10px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background: #f8f9fa; font-weight: bold; }
        .status-excellent { color: #28a745; font-weight: bold; }
        .status-good { color: #17a2b8; font-weight: bold; }
        .status-warning { color: #ffc107; font-weight: bold; }
        .status-poor { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 NEXUS IDE Performance Test Report</h1>
            <div class="score">${analysis.score}</div>
            <p><strong>Performance Score</strong></p>
            <p><strong>Generated:</strong> ${metrics.timestamp}</p>
            <p><strong>Status:</strong> ${analysis.passed ? '✅ PASSED' : '❌ FAILED'}</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-number">${metrics.results.responseTime.p95.toFixed(0)}ms</div>
                <div class="metric-label">Response Time P95</div>
            </div>
            <div class="metric-card">
                <div class="metric-number">${metrics.results.throughput.rps.toFixed(0)}</div>
                <div class="metric-label">Requests/sec</div>
            </div>
            <div class="metric-card">
                <div class="metric-number">${metrics.results.errors.rate.toFixed(2)}%</div>
                <div class="metric-label">Error Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-number">${metrics.results.resources.cpu.max.toFixed(1)}%</div>
                <div class="metric-label">Peak CPU Usage</div>
            </div>
            <div class="metric-card">
                <div class="metric-number">${(metrics.results.resources.memory.max / 1024 / 1024).toFixed(0)}MB</div>
                <div class="metric-label">Peak Memory Usage</div>
            </div>
            <div class="metric-card">
                <div class="metric-number">${metrics.results.websocket.connections}</div>
                <div class="metric-label">WebSocket Connections</div>
            </div>
        </div>
        
        <div class="chart-section">
            <h2>📊 Response Time Distribution</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-number">${metrics.results.responseTime.min.toFixed(0)}ms</div>
                    <div class="metric-label">Minimum</div>
                </div>
                <div class="metric-card">
                    <div class="metric-number">${metrics.results.responseTime.p50.toFixed(0)}ms</div>
                    <div class="metric-label">P50 (Median)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-number">${metrics.results.responseTime.p95.toFixed(0)}ms</div>
                    <div class="metric-label">P95</div>
                </div>
                <div class="metric-card">
                    <div class="metric-number">${metrics.results.responseTime.p99.toFixed(0)}ms</div>
                    <div class="metric-label">P99</div>
                </div>
                <div class="metric-card">
                    <div class="metric-number">${metrics.results.responseTime.max.toFixed(0)}ms</div>
                    <div class="metric-label">Maximum</div>
                </div>
                <div class="metric-card">
                    <div class="metric-number">${metrics.results.responseTime.avg.toFixed(0)}ms</div>
                    <div class="metric-label">Average</div>
                </div>
            </div>
        </div>
        
        <div class="chart-section">
            <h2>🎯 Load Test Scenarios</h2>
            <div class="scenario-grid">
                ${metrics.results.loadTest.scenarios.map(scenario => `
                    <div class="scenario-card">
                        <h4>${scenario.name}</h4>
                        <p><strong>Users:</strong> ${scenario.users}</p>
                        <p><strong>Duration:</strong> ${(scenario.duration / 1000).toFixed(1)}s</p>
                        <p><strong>Requests:</strong> ${scenario.requests}</p>
                        <p><strong>RPS:</strong> ${scenario.rps.toFixed(1)}</p>
                        <p><strong>Success:</strong> ${scenario.success}</p>
                        <p><strong>Errors:</strong> ${scenario.errors}</p>
                        <p><strong>Error Rate:</strong> ${scenario.errorRate.toFixed(2)}%</p>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="chart-section">
            <h2>🔌 WebSocket Performance</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-number">${metrics.results.websocket.connections}</div>
                    <div class="metric-label">Total Connections</div>
                </div>
                <div class="metric-card">
                    <div class="metric-number">${metrics.results.websocket.messages}</div>
                    <div class="metric-label">Messages Sent</div>
                </div>
                <div class="metric-card">
                    <div class="metric-number">${metrics.results.websocket.errors}</div>
                    <div class="metric-label">Connection Errors</div>
                </div>
                <div class="metric-card">
                    <div class="metric-number">${metrics.results.websocket.latency.length > 0 ? (metrics.results.websocket.latency.reduce((a, b) => a + b, 0) / metrics.results.websocket.latency.length).toFixed(1) : 0}ms</div>
                    <div class="metric-label">Average Latency</div>
                </div>
            </div>
        </div>
        
        ${analysis.bottlenecks.length > 0 ? `
        <div class="chart-section">
            <h2>⚠️ Performance Bottlenecks</h2>
            ${analysis.bottlenecks.map(bottleneck => `
                <div class="bottleneck">
                    <strong>⚠️ ${bottleneck}</strong>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="chart-section">
            <h2>💡 Recommendations</h2>
            ${analysis.recommendations.map(rec => `
                <div class="recommendation">
                    <strong>💡</strong> ${rec}
                </div>
            `).join('')}
        </div>
        
        <div class="chart-section">
            <h2>🖥️ System Information</h2>
            <table>
                <tr><th>Platform</th><td>${metrics.system.platform}</td></tr>
                <tr><th>Architecture</th><td>${metrics.system.arch}</td></tr>
                <tr><th>CPU Cores</th><td>${metrics.system.cpus}</td></tr>
                <tr><th>Total Memory</th><td>${(metrics.system.totalMemory / 1024 / 1024 / 1024).toFixed(1)} GB</td></tr>
                <tr><th>Node.js Version</th><td>${metrics.system.nodeVersion}</td></tr>
                <tr><th>Test Duration</th><td>${(metrics.results.throughput.duration / 1000).toFixed(1)} seconds</td></tr>
            </table>
        </div>
        
        <div class="chart-section">
            <h2>📈 Performance Thresholds</h2>
            <table>
                <thead>
                    <tr><th>Metric</th><th>Threshold</th><th>Actual</th><th>Status</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Response Time P95</td>
                        <td>&lt; ${PERF_CONFIG.thresholds.responseTime.p95}ms</td>
                        <td>${metrics.results.responseTime.p95.toFixed(0)}ms</td>
                        <td class="${metrics.results.responseTime.p95 < PERF_CONFIG.thresholds.responseTime.p95 ? 'status-excellent' : 'status-poor'}">
                            ${metrics.results.responseTime.p95 < PERF_CONFIG.thresholds.responseTime.p95 ? '✅ PASS' : '❌ FAIL'}
                        </td>
                    </tr>
                    <tr>
                        <td>Throughput</td>
                        <td>&gt; ${PERF_CONFIG.thresholds.throughput.minimum} req/s</td>
                        <td>${metrics.results.throughput.rps.toFixed(1)} req/s</td>
                        <td class="${metrics.results.throughput.rps > PERF_CONFIG.thresholds.throughput.minimum ? 'status-excellent' : 'status-poor'}">
                            ${metrics.results.throughput.rps > PERF_CONFIG.thresholds.throughput.minimum ? '✅ PASS' : '❌ FAIL'}
                        </td>
                    </tr>
                    <tr>
                        <td>Error Rate</td>
                        <td>&lt; ${PERF_CONFIG.thresholds.errorRate.maximum}%</td>
                        <td>${metrics.results.errors.rate.toFixed(2)}%</td>
                        <td class="${metrics.results.errors.rate < PERF_CONFIG.thresholds.errorRate.maximum ? 'status-excellent' : 'status-poor'}">
                            ${metrics.results.errors.rate < PERF_CONFIG.thresholds.errorRate.maximum ? '✅ PASS' : '❌ FAIL'}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
        `;
    }

    displayResults() {
        const metrics = this.metrics.metrics;
        const analysis = metrics.analysis;
        
        console.log('\n🚀 สรุปผลการทดสอบ Performance:');
        console.log('=' .repeat(60));
        console.log(`📊 Performance Score: ${analysis.score}/100`);
        console.log(`📊 Status: ${analysis.passed ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`📊 Total Requests: ${metrics.results.throughput.totalRequests}`);
        console.log(`📊 Successful Requests: ${metrics.results.throughput.successfulRequests}`);
        console.log(`📊 Failed Requests: ${metrics.results.throughput.failedRequests}`);
        console.log(`📊 Error Rate: ${metrics.results.errors.rate.toFixed(2)}%`);
        console.log(`📊 Throughput: ${metrics.results.throughput.rps.toFixed(1)} req/s`);
        
        console.log('\n⚡ Response Time:');
        console.log(`  Min: ${metrics.results.responseTime.min.toFixed(0)}ms`);
        console.log(`  P50: ${metrics.results.responseTime.p50.toFixed(0)}ms`);
        console.log(`  P95: ${metrics.results.responseTime.p95.toFixed(0)}ms`);
        console.log(`  P99: ${metrics.results.responseTime.p99.toFixed(0)}ms`);
        console.log(`  Max: ${metrics.results.responseTime.max.toFixed(0)}ms`);
        console.log(`  Avg: ${metrics.results.responseTime.avg.toFixed(0)}ms`);
        
        console.log('\n🖥️ Resource Usage:');
        console.log(`  CPU Average: ${metrics.results.resources.cpu.avg.toFixed(1)}%`);
        console.log(`  CPU Peak: ${metrics.results.resources.cpu.max.toFixed(1)}%`);
        console.log(`  Memory Average: ${(metrics.results.resources.memory.avg / 1024 / 1024).toFixed(0)}MB`);
        console.log(`  Memory Peak: ${(metrics.results.resources.memory.max / 1024 / 1024).toFixed(0)}MB`);
        
        console.log('\n🔌 WebSocket Performance:');
        console.log(`  Connections: ${metrics.results.websocket.connections}`);
        console.log(`  Messages: ${metrics.results.websocket.messages}`);
        console.log(`  Errors: ${metrics.results.websocket.errors}`);
        
        if (analysis.bottlenecks.length > 0) {
            console.log('\n⚠️ Performance Bottlenecks:');
            analysis.bottlenecks.forEach(bottleneck => {
                console.log(`  • ${bottleneck}`);
            });
        }
        
        console.log('\n💡 Recommendations:');
        analysis.recommendations.forEach(rec => {
            console.log(`  • ${rec}`);
        });
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run performance tests if this file is executed directly
if (require.main === module) {
    const runner = new PerformanceTestRunner();
    runner.runAllPerformanceTests().catch(error => {
        console.error('💥 เกิดข้อผิดพลาดในการทดสอบ Performance:', error);
        process.exit(1);
    });
}

module.exports = {
    PerformanceTestRunner,
    PerformanceMetrics,
    HTTPLoadTester,
    WebSocketLoadTester,
    SystemResourceMonitor,
    StressTestScenarios
};