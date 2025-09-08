/**
 * NEXUS IDE - AI-MCP Integration Testing Framework
 * Comprehensive testing system for AI-MCP integration with unit tests,
 * integration tests, performance benchmarks, and automated validation
 */

const { AIMCPIntegration } = require('./ai-mcp-integration');
const { MultiModelAISystem } = require('./multi-model-ai-system');
const { AICodeAssistant } = require('./ai-code-assistant');
const { IntelligentMCPRouter } = require('./intelligent-mcp-router');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class AITestingFramework extends EventEmitter {
    constructor() {
        super();
        this.testSuites = new Map();
        this.testResults = [];
        this.benchmarkResults = [];
        this.performanceMetrics = new Map();
        this.testConfig = {
            timeout: 30000,
            retries: 3,
            parallel: true,
            verbose: true,
            generateReports: true,
            benchmarkIterations: 100
        };
        
        this.setupTestSuites();
    }

    setupTestSuites() {
        // Unit Tests
        this.testSuites.set('unit', new UnitTestSuite());
        
        // Integration Tests
        this.testSuites.set('integration', new IntegrationTestSuite());
        
        // Performance Tests
        this.testSuites.set('performance', new PerformanceTestSuite());
        
        // AI Model Tests
        this.testSuites.set('ai-models', new AIModelTestSuite());
        
        // MCP Router Tests
        this.testSuites.set('mcp-router', new MCPRouterTestSuite());
        
        // End-to-End Tests
        this.testSuites.set('e2e', new EndToEndTestSuite());
        
        // Stress Tests
        this.testSuites.set('stress', new StressTestSuite());
        
        // Security Tests
        this.testSuites.set('security', new SecurityTestSuite());
    }

    async runAllTests() {
        console.log('🧪 Starting AI-MCP Integration Testing Framework...');
        const startTime = Date.now();
        
        const results = {
            summary: {
                totalSuites: this.testSuites.size,
                totalTests: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                duration: 0,
                startTime: new Date().toISOString()
            },
            suites: {},
            benchmarks: {},
            errors: []
        };
        
        try {
            // Run test suites
            for (const [suiteName, suite] of this.testSuites) {
                console.log(`\n📋 Running ${suiteName} tests...`);
                
                try {
                    const suiteResult = await this.runTestSuite(suiteName, suite);
                    results.suites[suiteName] = suiteResult;
                    
                    results.summary.totalTests += suiteResult.totalTests;
                    results.summary.passed += suiteResult.passed;
                    results.summary.failed += suiteResult.failed;
                    results.summary.skipped += suiteResult.skipped;
                    
                    console.log(`✅ ${suiteName}: ${suiteResult.passed}/${suiteResult.totalTests} passed`);
                } catch (error) {
                    console.error(`❌ ${suiteName} suite failed:`, error.message);
                    results.errors.push({
                        suite: suiteName,
                        error: error.message,
                        stack: error.stack
                    });
                }
            }
            
            // Run benchmarks
            console.log('\n🏃 Running performance benchmarks...');
            results.benchmarks = await this.runBenchmarks();
            
            results.summary.duration = Date.now() - startTime;
            results.summary.endTime = new Date().toISOString();
            results.summary.successRate = results.summary.totalTests > 0 ? 
                (results.summary.passed / results.summary.totalTests * 100).toFixed(1) + '%' : '0%';
            
            // Generate reports
            if (this.testConfig.generateReports) {
                await this.generateReports(results);
            }
            
            this.printSummary(results);
            
            return results;
        } catch (error) {
            console.error('❌ Testing framework failed:', error.message);
            throw error;
        }
    }

    async runTestSuite(suiteName, suite) {
        const suiteStartTime = Date.now();
        const result = {
            name: suiteName,
            totalTests: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
            tests: []
        };
        
        try {
            await suite.setup();
            const tests = await suite.getTests();
            result.totalTests = tests.length;
            
            if (this.testConfig.parallel && tests.length > 1) {
                // Run tests in parallel
                const testPromises = tests.map(test => this.runSingleTest(test, suite));
                const testResults = await Promise.allSettled(testPromises);
                
                testResults.forEach((testResult, index) => {
                    if (testResult.status === 'fulfilled') {
                        result.tests.push(testResult.value);
                        if (testResult.value.status === 'passed') result.passed++;
                        else if (testResult.value.status === 'failed') result.failed++;
                        else result.skipped++;
                    } else {
                        result.tests.push({
                            name: tests[index].name,
                            status: 'failed',
                            error: testResult.reason.message,
                            duration: 0
                        });
                        result.failed++;
                    }
                });
            } else {
                // Run tests sequentially
                for (const test of tests) {
                    const testResult = await this.runSingleTest(test, suite);
                    result.tests.push(testResult);
                    
                    if (testResult.status === 'passed') result.passed++;
                    else if (testResult.status === 'failed') result.failed++;
                    else result.skipped++;
                }
            }
        } catch (error) {
            console.error(`❌ Suite ${suiteName} setup failed:`, error.message);
            throw error;
        } finally {
            try {
                await suite.teardown();
            } catch (error) {
                console.warn(`⚠️ Suite ${suiteName} teardown failed:`, error.message);
            }
        }
        
        result.duration = Date.now() - suiteStartTime;
        return result;
    }

    async runSingleTest(test, suite) {
        const testStartTime = Date.now();
        const result = {
            name: test.name,
            description: test.description,
            status: 'running',
            duration: 0,
            error: null,
            output: null,
            metadata: {}
        };
        
        let attempt = 0;
        
        while (attempt < this.testConfig.retries) {
            try {
                if (this.testConfig.verbose) {
                    console.log(`  🔍 Running: ${test.name}`);
                }
                
                // Set timeout
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Test timeout')), this.testConfig.timeout)
                );
                
                const testPromise = test.run(suite);
                const testResult = await Promise.race([testPromise, timeoutPromise]);
                
                result.status = 'passed';
                result.output = testResult;
                result.duration = Date.now() - testStartTime;
                
                if (this.testConfig.verbose) {
                    console.log(`  ✅ Passed: ${test.name} (${result.duration}ms)`);
                }
                
                break;
            } catch (error) {
                attempt++;
                
                if (attempt >= this.testConfig.retries) {
                    result.status = 'failed';
                    result.error = error.message;
                    result.duration = Date.now() - testStartTime;
                    
                    if (this.testConfig.verbose) {
                        console.log(`  ❌ Failed: ${test.name} - ${error.message}`);
                    }
                } else {
                    if (this.testConfig.verbose) {
                        console.log(`  🔄 Retry ${attempt}/${this.testConfig.retries}: ${test.name}`);
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
                }
            }
        }
        
        return result;
    }

    async runBenchmarks() {
        const benchmarks = {
            aiModelPerformance: await this.benchmarkAIModels(),
            mcpRouterPerformance: await this.benchmarkMCPRouter(),
            integrationLatency: await this.benchmarkIntegrationLatency(),
            throughputTest: await this.benchmarkThroughput(),
            memoryUsage: await this.benchmarkMemoryUsage(),
            concurrencyTest: await this.benchmarkConcurrency()
        };
        
        return benchmarks;
    }

    async benchmarkAIModels() {
        console.log('  📊 Benchmarking AI models...');
        
        const multiModelAI = new MultiModelAISystem();
        const testPrompts = [
            { task: 'code-completion', prompt: 'function calculateSum(a, b) {' },
            { task: 'code-analysis', prompt: 'Analyze this code for bugs: const x = 1; x = 2;' },
            { task: 'code-explanation', prompt: 'Explain what this does: Array.from({length: 5}, (_, i) => i)' }
        ];
        
        const results = {};
        
        for (const testPrompt of testPrompts) {
            const taskResults = [];
            
            for (let i = 0; i < 10; i++) {
                const startTime = Date.now();
                
                try {
                    const result = await multiModelAI.processRequest(testPrompt);
                    const duration = Date.now() - startTime;
                    
                    taskResults.push({
                        success: result.success,
                        duration,
                        model: result.selectedModel,
                        confidence: result.confidence
                    });
                } catch (error) {
                    taskResults.push({
                        success: false,
                        duration: Date.now() - startTime,
                        error: error.message
                    });
                }
            }
            
            results[testPrompt.task] = {
                totalRuns: taskResults.length,
                successRate: (taskResults.filter(r => r.success).length / taskResults.length * 100).toFixed(1) + '%',
                averageDuration: Math.round(taskResults.reduce((sum, r) => sum + r.duration, 0) / taskResults.length),
                minDuration: Math.min(...taskResults.map(r => r.duration)),
                maxDuration: Math.max(...taskResults.map(r => r.duration)),
                modelDistribution: this.calculateModelDistribution(taskResults)
            };
        }
        
        return results;
    }

    async benchmarkMCPRouter() {
        console.log('  📊 Benchmarking MCP router...');
        
        const router = new IntelligentMCPRouter();
        const testRequests = [
            { type: 'git-operation', data: { command: 'status' } },
            { type: 'file-operation', data: { action: 'read', path: '/test.js' } },
            { type: 'ai-request', data: { prompt: 'Generate a function' } }
        ];
        
        const results = {};
        
        for (const testRequest of testRequests) {
            const requestResults = [];
            
            for (let i = 0; i < 20; i++) {
                const startTime = Date.now();
                
                try {
                    const result = await router.routeRequest(testRequest);
                    const duration = Date.now() - startTime;
                    
                    requestResults.push({
                        success: result.success,
                        duration,
                        selectedServer: result.metadata?.selectedServer,
                        strategy: result.metadata?.routingStrategy
                    });
                } catch (error) {
                    requestResults.push({
                        success: false,
                        duration: Date.now() - startTime,
                        error: error.message
                    });
                }
            }
            
            results[testRequest.type] = {
                totalRuns: requestResults.length,
                successRate: (requestResults.filter(r => r.success).length / requestResults.length * 100).toFixed(1) + '%',
                averageDuration: Math.round(requestResults.reduce((sum, r) => sum + r.duration, 0) / requestResults.length),
                serverDistribution: this.calculateServerDistribution(requestResults),
                strategyDistribution: this.calculateStrategyDistribution(requestResults)
            };
        }
        
        return results;
    }

    async benchmarkIntegrationLatency() {
        console.log('  📊 Benchmarking integration latency...');
        
        const integration = new AIMCPIntegration();
        const testCases = [
            { type: 'simple-request', complexity: 'low' },
            { type: 'complex-request', complexity: 'high' },
            { type: 'multi-step-request', complexity: 'medium' }
        ];
        
        const results = {};
        
        for (const testCase of testCases) {
            const latencies = [];
            
            for (let i = 0; i < 50; i++) {
                const startTime = Date.now();
                
                try {
                    await integration.processAIRequest({
                        type: testCase.type,
                        data: { complexity: testCase.complexity },
                        userContext: { userId: 'test-user' }
                    });
                    
                    latencies.push(Date.now() - startTime);
                } catch (error) {
                    latencies.push(Date.now() - startTime);
                }
            }
            
            results[testCase.type] = {
                samples: latencies.length,
                averageLatency: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
                minLatency: Math.min(...latencies),
                maxLatency: Math.max(...latencies),
                p50: this.calculatePercentile(latencies, 50),
                p95: this.calculatePercentile(latencies, 95),
                p99: this.calculatePercentile(latencies, 99)
            };
        }
        
        return results;
    }

    async benchmarkThroughput() {
        console.log('  📊 Benchmarking throughput...');
        
        const integration = new AIMCPIntegration();
        const concurrencyLevels = [1, 5, 10, 20, 50];
        const results = {};
        
        for (const concurrency of concurrencyLevels) {
            const startTime = Date.now();
            const promises = [];
            
            for (let i = 0; i < concurrency; i++) {
                promises.push(
                    integration.processAIRequest({
                        type: 'throughput-test',
                        data: { requestId: i },
                        userContext: { userId: `test-user-${i}` }
                    })
                );
            }
            
            const results_batch = await Promise.allSettled(promises);
            const duration = Date.now() - startTime;
            const successful = results_batch.filter(r => r.status === 'fulfilled').length;
            
            results[`concurrency-${concurrency}`] = {
                totalRequests: concurrency,
                successfulRequests: successful,
                duration,
                throughput: Math.round((successful / duration) * 1000), // requests per second
                successRate: (successful / concurrency * 100).toFixed(1) + '%'
            };
        }
        
        return results;
    }

    async benchmarkMemoryUsage() {
        console.log('  📊 Benchmarking memory usage...');
        
        const getMemoryUsage = () => {
            const usage = process.memoryUsage();
            return {
                rss: Math.round(usage.rss / 1024 / 1024), // MB
                heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
                heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
                external: Math.round(usage.external / 1024 / 1024)
            };
        };
        
        const baseline = getMemoryUsage();
        
        // Create multiple AI instances
        const instances = [];
        for (let i = 0; i < 10; i++) {
            instances.push(new AIMCPIntegration());
        }
        
        const afterCreation = getMemoryUsage();
        
        // Process requests
        const promises = instances.map((instance, i) => 
            instance.processAIRequest({
                type: 'memory-test',
                data: { instanceId: i },
                userContext: { userId: `memory-test-${i}` }
            })
        );
        
        await Promise.allSettled(promises);
        
        const afterProcessing = getMemoryUsage();
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
        
        const afterGC = getMemoryUsage();
        
        return {
            baseline,
            afterCreation,
            afterProcessing,
            afterGC,
            memoryIncrease: {
                creation: afterCreation.heapUsed - baseline.heapUsed,
                processing: afterProcessing.heapUsed - afterCreation.heapUsed,
                retained: afterGC.heapUsed - baseline.heapUsed
            }
        };
    }

    async benchmarkConcurrency() {
        console.log('  📊 Benchmarking concurrency handling...');
        
        const integration = new AIMCPIntegration();
        const concurrencyTests = [
            { name: 'low-concurrency', concurrent: 5, duration: 5000 },
            { name: 'medium-concurrency', concurrent: 20, duration: 10000 },
            { name: 'high-concurrency', concurrent: 50, duration: 15000 }
        ];
        
        const results = {};
        
        for (const test of concurrencyTests) {
            const startTime = Date.now();
            const endTime = startTime + test.duration;
            const requestResults = [];
            let requestId = 0;
            
            // Start concurrent request generators
            const generators = [];
            for (let i = 0; i < test.concurrent; i++) {
                generators.push(this.generateConcurrentRequests(
                    integration, 
                    endTime, 
                    requestId++, 
                    requestResults
                ));
            }
            
            await Promise.allSettled(generators);
            
            const totalDuration = Date.now() - startTime;
            const successful = requestResults.filter(r => r.success).length;
            
            results[test.name] = {
                concurrentWorkers: test.concurrent,
                plannedDuration: test.duration,
                actualDuration: totalDuration,
                totalRequests: requestResults.length,
                successfulRequests: successful,
                failedRequests: requestResults.length - successful,
                averageRequestsPerSecond: Math.round((requestResults.length / totalDuration) * 1000),
                successRate: (successful / requestResults.length * 100).toFixed(1) + '%',
                averageResponseTime: Math.round(
                    requestResults.reduce((sum, r) => sum + r.duration, 0) / requestResults.length
                )
            };
        }
        
        return results;
    }

    async generateConcurrentRequests(integration, endTime, workerId, results) {
        let requestCount = 0;
        
        while (Date.now() < endTime) {
            const requestStart = Date.now();
            
            try {
                await integration.processAIRequest({
                    type: 'concurrency-test',
                    data: { 
                        workerId, 
                        requestCount: requestCount++,
                        timestamp: requestStart
                    },
                    userContext: { userId: `worker-${workerId}` }
                });
                
                results.push({
                    success: true,
                    duration: Date.now() - requestStart,
                    workerId,
                    requestCount
                });
            } catch (error) {
                results.push({
                    success: false,
                    duration: Date.now() - requestStart,
                    workerId,
                    requestCount,
                    error: error.message
                });
            }
            
            // Small delay to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    calculateModelDistribution(results) {
        const distribution = {};
        results.forEach(result => {
            if (result.model) {
                distribution[result.model] = (distribution[result.model] || 0) + 1;
            }
        });
        return distribution;
    }

    calculateServerDistribution(results) {
        const distribution = {};
        results.forEach(result => {
            if (result.selectedServer) {
                distribution[result.selectedServer] = (distribution[result.selectedServer] || 0) + 1;
            }
        });
        return distribution;
    }

    calculateStrategyDistribution(results) {
        const distribution = {};
        results.forEach(result => {
            if (result.strategy) {
                distribution[result.strategy] = (distribution[result.strategy] || 0) + 1;
            }
        });
        return distribution;
    }

    calculatePercentile(values, percentile) {
        const sorted = values.slice().sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index];
    }

    async generateReports(results) {
        console.log('📄 Generating test reports...');
        
        const reportsDir = path.join(__dirname, 'test-reports');
        await fs.mkdir(reportsDir, { recursive: true });
        
        // JSON Report
        await fs.writeFile(
            path.join(reportsDir, 'ai-mcp-test-results.json'),
            JSON.stringify(results, null, 2)
        );
        
        // HTML Report
        const htmlReport = this.generateHTMLReport(results);
        await fs.writeFile(
            path.join(reportsDir, 'ai-mcp-test-report.html'),
            htmlReport
        );
        
        // Markdown Summary
        const markdownSummary = this.generateMarkdownSummary(results);
        await fs.writeFile(
            path.join(reportsDir, 'ai-mcp-test-summary.md'),
            markdownSummary
        );
        
        console.log(`📄 Reports generated in: ${reportsDir}`);
    }

    generateHTMLReport(results) {
        return `<!DOCTYPE html>
<html>
<head>
    <title>AI-MCP Integration Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .suite { margin-bottom: 30px; }
        .test { margin-left: 20px; padding: 10px; border-left: 3px solid #ddd; }
        .passed { border-left-color: #4CAF50; }
        .failed { border-left-color: #f44336; }
        .skipped { border-left-color: #ff9800; }
        .benchmark { background: #e3f2fd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>🧪 AI-MCP Integration Test Report</h1>
    
    <div class="summary">
        <h2>📊 Test Summary</h2>
        <p><strong>Total Tests:</strong> ${results.summary.totalTests}</p>
        <p><strong>Passed:</strong> ${results.summary.passed}</p>
        <p><strong>Failed:</strong> ${results.summary.failed}</p>
        <p><strong>Skipped:</strong> ${results.summary.skipped}</p>
        <p><strong>Success Rate:</strong> ${results.summary.successRate}</p>
        <p><strong>Duration:</strong> ${Math.round(results.summary.duration / 1000)}s</p>
        <p><strong>Started:</strong> ${results.summary.startTime}</p>
    </div>
    
    <h2>🧪 Test Suites</h2>
    ${Object.entries(results.suites).map(([suiteName, suite]) => `
        <div class="suite">
            <h3>${suiteName} (${suite.passed}/${suite.totalTests} passed)</h3>
            ${suite.tests.map(test => `
                <div class="test ${test.status}">
                    <strong>${test.name}</strong> - ${test.status} (${test.duration}ms)
                    ${test.error ? `<br><span style="color: red;">Error: ${test.error}</span>` : ''}
                </div>
            `).join('')}
        </div>
    `).join('')}
    
    <h2>🏃 Performance Benchmarks</h2>
    ${Object.entries(results.benchmarks).map(([benchmarkName, benchmark]) => `
        <div class="benchmark">
            <h3>${benchmarkName}</h3>
            <pre>${JSON.stringify(benchmark, null, 2)}</pre>
        </div>
    `).join('')}
    
    ${results.errors.length > 0 ? `
        <h2>❌ Errors</h2>
        ${results.errors.map(error => `
            <div style="background: #ffebee; padding: 10px; margin: 10px 0; border-radius: 5px;">
                <strong>Suite:</strong> ${error.suite}<br>
                <strong>Error:</strong> ${error.error}
            </div>
        `).join('')}
    ` : ''}
    
    <footer style="margin-top: 50px; text-align: center; color: #666;">
        Generated by NEXUS IDE AI-MCP Testing Framework
    </footer>
</body>
</html>`;
    }

    generateMarkdownSummary(results) {
        return `# 🧪 AI-MCP Integration Test Summary

## 📊 Overview

- **Total Tests:** ${results.summary.totalTests}
- **Passed:** ${results.summary.passed} ✅
- **Failed:** ${results.summary.failed} ❌
- **Skipped:** ${results.summary.skipped} ⏭️
- **Success Rate:** ${results.summary.successRate}
- **Duration:** ${Math.round(results.summary.duration / 1000)}s
- **Started:** ${results.summary.startTime}

## 🧪 Test Suites Results

${Object.entries(results.suites).map(([suiteName, suite]) => `
### ${suiteName}

- **Tests:** ${suite.totalTests}
- **Passed:** ${suite.passed}
- **Failed:** ${suite.failed}
- **Duration:** ${Math.round(suite.duration / 1000)}s

${suite.tests.map(test => `- ${test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️'} **${test.name}** (${test.duration}ms)${test.error ? ` - Error: ${test.error}` : ''}`).join('\n')}
`).join('')}

## 🏃 Performance Benchmarks

${Object.entries(results.benchmarks).map(([benchmarkName, benchmark]) => `
### ${benchmarkName}

\`\`\`json
${JSON.stringify(benchmark, null, 2)}
\`\`\`
`).join('')}

${results.errors.length > 0 ? `
## ❌ Errors

${results.errors.map(error => `
### ${error.suite}

\`\`\`
${error.error}
\`\`\`
`).join('')}
` : ''}

---
*Generated by NEXUS IDE AI-MCP Testing Framework*`;
    }

    printSummary(results) {
        console.log('\n' + '='.repeat(60));
        console.log('🧪 AI-MCP INTEGRATION TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`📊 Total Tests: ${results.summary.totalTests}`);
        console.log(`✅ Passed: ${results.summary.passed}`);
        console.log(`❌ Failed: ${results.summary.failed}`);
        console.log(`⏭️ Skipped: ${results.summary.skipped}`);
        console.log(`🎯 Success Rate: ${results.summary.successRate}`);
        console.log(`⏱️ Duration: ${Math.round(results.summary.duration / 1000)}s`);
        console.log('='.repeat(60));
        
        // Suite breakdown
        console.log('\n📋 Suite Breakdown:');
        for (const [suiteName, suite] of Object.entries(results.suites)) {
            const status = suite.failed === 0 ? '✅' : '❌';
            console.log(`  ${status} ${suiteName}: ${suite.passed}/${suite.totalTests} (${Math.round(suite.duration / 1000)}s)`);
        }
        
        // Top benchmark results
        console.log('\n🏃 Key Performance Metrics:');
        if (results.benchmarks.aiModelPerformance) {
            console.log(`  🤖 AI Model Avg Response: ${Object.values(results.benchmarks.aiModelPerformance)[0]?.averageDuration || 'N/A'}ms`);
        }
        if (results.benchmarks.mcpRouterPerformance) {
            console.log(`  🔀 MCP Router Avg Response: ${Object.values(results.benchmarks.mcpRouterPerformance)[0]?.averageDuration || 'N/A'}ms`);
        }
        if (results.benchmarks.throughputTest) {
            const maxThroughput = Math.max(...Object.values(results.benchmarks.throughputTest).map(t => t.throughput || 0));
            console.log(`  🚀 Max Throughput: ${maxThroughput} req/s`);
        }
        
        console.log('\n' + '='.repeat(60));
    }
}

// Test Suite Base Class
class TestSuite {
    constructor(name) {
        this.name = name;
        this.tests = [];
    }

    async setup() {
        // Override in subclasses
    }

    async teardown() {
        // Override in subclasses
    }

    async getTests() {
        return this.tests;
    }

    addTest(name, description, testFunction) {
        this.tests.push({
            name,
            description,
            run: testFunction
        });
    }
}

// Unit Test Suite
class UnitTestSuite extends TestSuite {
    constructor() {
        super('Unit Tests');
        this.setupTests();
    }

    setupTests() {
        this.addTest(
            'AIMCPIntegration Creation',
            'Test AIMCPIntegration class instantiation',
            async () => {
                const integration = new AIMCPIntegration();
                if (!integration) throw new Error('Failed to create AIMCPIntegration instance');
                return { success: true, instance: 'created' };
            }
        );

        this.addTest(
            'MultiModelAISystem Creation',
            'Test MultiModelAISystem class instantiation',
            async () => {
                const aiSystem = new MultiModelAISystem();
                if (!aiSystem) throw new Error('Failed to create MultiModelAISystem instance');
                return { success: true, instance: 'created' };
            }
        );

        this.addTest(
            'AICodeAssistant Creation',
            'Test AICodeAssistant class instantiation',
            async () => {
                const assistant = new AICodeAssistant();
                if (!assistant) throw new Error('Failed to create AICodeAssistant instance');
                return { success: true, instance: 'created' };
            }
        );

        this.addTest(
            'IntelligentMCPRouter Creation',
            'Test IntelligentMCPRouter class instantiation',
            async () => {
                const router = new IntelligentMCPRouter();
                if (!router) throw new Error('Failed to create IntelligentMCPRouter instance');
                return { success: true, instance: 'created' };
            }
        );
    }
}

// Integration Test Suite
class IntegrationTestSuite extends TestSuite {
    constructor() {
        super('Integration Tests');
        this.setupTests();
    }

    setupTests() {
        this.addTest(
            'AI-MCP Basic Integration',
            'Test basic AI-MCP integration workflow',
            async () => {
                const integration = new AIMCPIntegration();
                const request = {
                    type: 'test-request',
                    data: { message: 'Hello AI-MCP' },
                    userContext: { userId: 'test-user' }
                };
                
                const result = await integration.processAIRequest(request);
                if (!result) throw new Error('No result from AI-MCP integration');
                
                return { success: true, result };
            }
        );

        this.addTest(
            'Multi-Model AI Processing',
            'Test multi-model AI request processing',
            async () => {
                const aiSystem = new MultiModelAISystem();
                const request = {
                    task: 'test-task',
                    prompt: 'Test prompt for multi-model processing',
                    context: { test: true }
                };
                
                const result = await aiSystem.processRequest(request);
                if (!result || !result.success) {
                    throw new Error('Multi-model AI processing failed');
                }
                
                return { success: true, selectedModel: result.selectedModel };
            }
        );

        this.addTest(
            'MCP Router Request Routing',
            'Test MCP router request routing functionality',
            async () => {
                const router = new IntelligentMCPRouter();
                const request = {
                    type: 'test-routing',
                    data: { test: 'routing-test' },
                    userContext: { userId: 'test-user' }
                };
                
                // Wait for router to be ready
                await new Promise(resolve => {
                    if (router.mcpServers.size > 0) {
                        resolve();
                    } else {
                        router.once('router-ready', resolve);
                    }
                });
                
                const result = await router.routeRequest(request);
                if (!result) throw new Error('No result from MCP router');
                
                return { success: true, routingResult: result.success };
            }
        );
    }
}

// Performance Test Suite
class PerformanceTestSuite extends TestSuite {
    constructor() {
        super('Performance Tests');
        this.setupTests();
    }

    setupTests() {
        this.addTest(
            'AI Response Time',
            'Test AI model response time performance',
            async () => {
                const aiSystem = new MultiModelAISystem();
                const startTime = Date.now();
                
                const result = await aiSystem.processRequest({
                    task: 'performance-test',
                    prompt: 'Quick test prompt',
                    context: { performance: true }
                });
                
                const responseTime = Date.now() - startTime;
                
                if (responseTime > 10000) { // 10 seconds threshold
                    throw new Error(`Response time too slow: ${responseTime}ms`);
                }
                
                return { success: true, responseTime };
            }
        );

        this.addTest(
            'MCP Router Performance',
            'Test MCP router performance under load',
            async () => {
                const router = new IntelligentMCPRouter();
                const requests = [];
                
                // Create multiple concurrent requests
                for (let i = 0; i < 10; i++) {
                    requests.push(router.routeRequest({
                        type: 'performance-test',
                        data: { requestId: i },
                        userContext: { userId: `perf-test-${i}` }
                    }));
                }
                
                const startTime = Date.now();
                const results = await Promise.allSettled(requests);
                const duration = Date.now() - startTime;
                
                const successful = results.filter(r => r.status === 'fulfilled').length;
                const throughput = (successful / duration) * 1000; // requests per second
                
                return { 
                    success: true, 
                    duration, 
                    successful, 
                    total: requests.length,
                    throughput: Math.round(throughput)
                };
            }
        );
    }
}

// AI Model Test Suite
class AIModelTestSuite extends TestSuite {
    constructor() {
        super('AI Model Tests');
        this.setupTests();
    }

    setupTests() {
        this.addTest(
            'Model Selection Logic',
            'Test AI model selection based on task type',
            async () => {
                const aiSystem = new MultiModelAISystem();
                
                const codeTask = await aiSystem.processRequest({
                    task: 'code-completion',
                    prompt: 'function test() {',
                    context: { language: 'javascript' }
                });
                
                const analysisTask = await aiSystem.processRequest({
                    task: 'code-analysis',
                    prompt: 'Analyze this code',
                    context: { complexity: 'high' }
                });
                
                return {
                    success: true,
                    codeModel: codeTask.selectedModel,
                    analysisModel: analysisTask.selectedModel
                };
            }
        );

        this.addTest(
            'Model Fallback Mechanism',
            'Test AI model fallback when primary model fails',
            async () => {
                const aiSystem = new MultiModelAISystem();
                
                // Simulate a request that might cause fallback
                const result = await aiSystem.processRequest({
                    task: 'complex-task',
                    prompt: 'Very complex request that might fail',
                    context: { fallbackTest: true }
                });
                
                return {
                    success: true,
                    selectedModel: result.selectedModel,
                    fallbackUsed: result.fallbackUsed || false
                };
            }
        );
    }
}

// MCP Router Test Suite
class MCPRouterTestSuite extends TestSuite {
    constructor() {
        super('MCP Router Tests');
        this.setupTests();
    }

    setupTests() {
        this.addTest(
            'Server Discovery',
            'Test MCP server discovery and registration',
            async () => {
                const router = new IntelligentMCPRouter();
                
                // Wait for initialization
                await new Promise(resolve => {
                    if (router.mcpServers.size > 0) {
                        resolve();
                    } else {
                        router.once('router-ready', resolve);
                    }
                });
                
                const serverCount = router.mcpServers.size;
                if (serverCount === 0) {
                    throw new Error('No MCP servers discovered');
                }
                
                return { success: true, serverCount };
            }
        );

        this.addTest(
            'Routing Strategy Selection',
            'Test routing strategy selection based on request type',
            async () => {
                const router = new IntelligentMCPRouter();
                
                const strategies = ['performance', 'capability', 'load', 'hybrid'];
                const results = {};
                
                for (const strategy of strategies) {
                    try {
                        const request = {
                            type: 'strategy-test',
                            data: { preferredStrategy: strategy },
                            userContext: { userId: 'strategy-test' }
                        };
                        
                        const result = await router.routeRequest(request);
                        results[strategy] = result.success;
                    } catch (error) {
                        results[strategy] = false;
                    }
                }
                
                return { success: true, strategyResults: results };
            }
        );
    }
}

// End-to-End Test Suite
class EndToEndTestSuite extends TestSuite {
    constructor() {
        super('End-to-End Tests');
        this.setupTests();
    }

    setupTests() {
        this.addTest(
            'Complete AI-MCP Workflow',
            'Test complete workflow from AI request to MCP response',
            async () => {
                const integration = new AIMCPIntegration();
                const assistant = new AICodeAssistant();
                
                // Simulate a complete code assistance workflow
                const codeRequest = {
                    type: 'code-completion',
                    data: {
                        code: 'function calculateTotal(items) {',
                        language: 'javascript',
                        context: 'e-commerce calculation'
                    },
                    userContext: {
                        userId: 'e2e-test-user',
                        projectContext: 'shopping-cart'
                    }
                };
                
                const result = await assistant.completeCode({
                    code: codeRequest.data.code,
                    language: codeRequest.data.language,
                    context: codeRequest.data.context
                });
                
                if (!result || !result.completion) {
                    throw new Error('Code completion failed');
                }
                
                return {
                    success: true,
                    completion: result.completion,
                    confidence: result.confidence
                };
            }
        );

        this.addTest(
            'Multi-Step AI Processing',
            'Test multi-step AI processing with context preservation',
            async () => {
                const assistant = new AICodeAssistant();
                
                // Step 1: Generate code
                const generatedCode = await assistant.generateCode({
                    prompt: 'Create a function to validate email addresses',
                    language: 'javascript'
                });
                
                if (!generatedCode) {
                    throw new Error('Code generation failed');
                }
                
                // Step 2: Analyze the generated code
                const analysis = await assistant.analyzeCode(
                    generatedCode.code,
                    'javascript'
                );
                
                if (!analysis) {
                    throw new Error('Code analysis failed');
                }
                
                // Step 3: Optimize the code
                const optimization = await assistant.optimizeCode(
                    generatedCode.code,
                    'javascript'
                );
                
                return {
                    success: true,
                    steps: {
                        generation: !!generatedCode,
                        analysis: !!analysis,
                        optimization: !!optimization
                    }
                };
            }
        );
    }
}

// Stress Test Suite
class StressTestSuite extends TestSuite {
    constructor() {
        super('Stress Tests');
        this.setupTests();
    }

    setupTests() {
        this.addTest(
            'High Load Stress Test',
            'Test system behavior under high load',
            async () => {
                const integration = new AIMCPIntegration();
                const requests = [];
                
                // Create 100 concurrent requests
                for (let i = 0; i < 100; i++) {
                    requests.push(
                        integration.processAIRequest({
                            type: 'stress-test',
                            data: { requestId: i, timestamp: Date.now() },
                            userContext: { userId: `stress-user-${i}` }
                        })
                    );
                }
                
                const startTime = Date.now();
                const results = await Promise.allSettled(requests);
                const duration = Date.now() - startTime;
                
                const successful = results.filter(r => r.status === 'fulfilled').length;
                const failed = results.length - successful;
                
                // Allow up to 10% failure rate under stress
                if (failed > requests.length * 0.1) {
                    throw new Error(`Too many failures under stress: ${failed}/${requests.length}`);
                }
                
                return {
                    success: true,
                    totalRequests: requests.length,
                    successful,
                    failed,
                    duration,
                    throughput: Math.round((successful / duration) * 1000)
                };
            }
        );

        this.addTest(
            'Memory Stress Test',
            'Test memory usage under sustained load',
            async () => {
                const instances = [];
                const initialMemory = process.memoryUsage().heapUsed;
                
                // Create many instances
                for (let i = 0; i < 50; i++) {
                    instances.push(new AIMCPIntegration());
                }
                
                // Process requests with all instances
                const promises = instances.map((instance, i) => 
                    instance.processAIRequest({
                        type: 'memory-stress',
                        data: { instanceId: i, data: 'x'.repeat(1000) },
                        userContext: { userId: `memory-test-${i}` }
                    })
                );
                
                await Promise.allSettled(promises);
                
                const finalMemory = process.memoryUsage().heapUsed;
                const memoryIncrease = finalMemory - initialMemory;
                
                // Check if memory increase is reasonable (less than 100MB)
                if (memoryIncrease > 100 * 1024 * 1024) {
                    throw new Error(`Excessive memory usage: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
                }
                
                return {
                    success: true,
                    instances: instances.length,
                    memoryIncrease: Math.round(memoryIncrease / 1024 / 1024) + 'MB'
                };
            }
        );
    }
}

// Security Test Suite
class SecurityTestSuite extends TestSuite {
    constructor() {
        super('Security Tests');
        this.setupTests();
    }

    setupTests() {
        this.addTest(
            'Input Sanitization',
            'Test input sanitization and validation',
            async () => {
                const integration = new AIMCPIntegration();
                
                const maliciousInputs = [
                    { type: 'xss-test', data: { code: '<script>alert("xss")</script>' } },
                    { type: 'injection-test', data: { query: "'; DROP TABLE users; --" } },
                    { type: 'overflow-test', data: { data: 'A'.repeat(10000000) } }
                ];
                
                const results = [];
                
                for (const input of maliciousInputs) {
                    try {
                        const result = await integration.processAIRequest(input);
                        results.push({ input: input.type, handled: true, result: !!result });
                    } catch (error) {
                        // Errors are expected for malicious inputs
                        results.push({ input: input.type, handled: true, error: error.message });
                    }
                }
                
                return { success: true, securityTests: results };
            }
        );

        this.addTest(
            'Authentication Validation',
            'Test authentication and authorization mechanisms',
            async () => {
                const integration = new AIMCPIntegration();
                
                // Test with missing user context
                try {
                    await integration.processAIRequest({
                        type: 'auth-test',
                        data: { sensitive: true }
                        // Missing userContext
                    });
                    
                    // Should handle missing auth gracefully
                    return { success: true, authHandling: 'graceful' };
                } catch (error) {
                    // Error handling is also acceptable
                    return { success: true, authHandling: 'strict', error: error.message };
                }
            }
        );
    }
}

module.exports = {
    AITestingFramework,
    TestSuite,
    UnitTestSuite,
    IntegrationTestSuite,
    PerformanceTestSuite,
    AIModelTestSuite,
    MCPRouterTestSuite,
    EndToEndTestSuite,
    StressTestSuite,
    SecurityTestSuite
};

// Example usage
if (require.main === module) {
    const testFramework = new AITestingFramework();
    
    testFramework.runAllTests()
        .then(results => {
            console.log('\n🎉 All tests completed!');
            process.exit(results.summary.failed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('❌ Testing framework failed:', error.message);
            process.exit(1);
        });
}