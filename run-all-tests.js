#!/usr/bin/env node
/**
 * NEXUS IDE - Automated Test Runner
 * สคริปต์รันเทสอัตโนมัติสำหรับ NEXUS IDE ทั้งระบบ
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Test Configuration
const TEST_CONFIG = {
    baseDir: __dirname,
    testSuiteDir: path.join(__dirname, 'test-suite'),
    reportsDir: path.join(__dirname, 'test-suite', 'reports'),
    timeout: 300000, // 5 minutes per test suite
    parallel: true,
    maxConcurrency: 4,
    retryAttempts: 2,
    services: {
        nexusServer: {
            command: 'node nexus-web-server.js',
            port: 8081,
            healthCheck: 'http://localhost:8081/api/status'
        },
        dashboard: {
            command: 'node test-suite/reports/test-dashboard.js',
            port: 3001,
            healthCheck: 'http://localhost:3001/health'
        }
    }
};

// Test Suites Configuration
const TEST_SUITES = [
    {
        name: 'Unit Tests',
        type: 'unit',
        command: 'node test-suite/nexus-test-runner.js --type=unit',
        priority: 1,
        timeout: 60000,
        required: true
    },
    {
        name: 'Integration Tests',
        type: 'integration',
        command: 'node test-suite/integration/integration-tests.js',
        priority: 2,
        timeout: 120000,
        required: true
    },
    {
        name: 'API Tests',
        type: 'api',
        command: 'node test-suite/api/api-tests.js',
        priority: 2,
        timeout: 90000,
        required: true
    },
    {
        name: 'Security Tests',
        type: 'security',
        command: 'node test-suite/security/security-tests.js',
        priority: 3,
        timeout: 120000,
        required: false
    },
    {
        name: 'Performance Tests',
        type: 'performance',
        command: 'node test-suite/performance/performance-tests.js',
        priority: 3,
        timeout: 180000,
        required: false
    },
    {
        name: 'E2E Tests',
        type: 'e2e',
        command: 'node test-suite/e2e/nexus-ide.e2e.test.js',
        priority: 4,
        timeout: 240000,
        required: false
    },
    {
        name: 'Performance Benchmark',
        type: 'benchmark',
        command: 'node test-suite/performance/performance-benchmark.js',
        priority: 5,
        timeout: 300000,
        required: false
    }
];

// Test Results Aggregator
class TestResultsAggregator {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                duration: 0,
                successRate: 0
            },
            suites: [],
            services: {},
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                memory: process.memoryUsage(),
                cwd: process.cwd()
            },
            errors: [],
            warnings: []
        };
    }

    addSuiteResult(suite, result) {
        this.results.suites.push({
            name: suite.name,
            type: suite.type,
            priority: suite.priority,
            required: suite.required,
            ...result
        });
        
        // Update summary
        if (result.summary) {
            this.results.summary.total += result.summary.total || 0;
            this.results.summary.passed += result.summary.passed || 0;
            this.results.summary.failed += result.summary.failed || 0;
            this.results.summary.skipped += result.summary.skipped || 0;
            this.results.summary.duration += result.summary.duration || 0;
        }
        
        if (result.errors) {
            this.results.errors.push(...result.errors);
        }
        
        if (result.warnings) {
            this.results.warnings.push(...result.warnings);
        }
    }

    finalize() {
        // Calculate success rate
        if (this.results.summary.total > 0) {
            this.results.summary.successRate = 
                (this.results.summary.passed / this.results.summary.total) * 100;
        }
        
        // Add final memory usage
        this.results.environment.finalMemory = process.memoryUsage();
        
        return this.results;
    }
}

// Service Manager
class ServiceManager {
    constructor() {
        this.services = new Map();
        this.healthChecks = new Map();
    }

    async startService(name, config) {
        console.log(`🚀 Starting ${name}...`);
        
        return new Promise((resolve, reject) => {
            const child = spawn('node', config.command.split(' ').slice(1), {
                cwd: TEST_CONFIG.baseDir,
                stdio: ['pipe', 'pipe', 'pipe'],
                detached: false
            });
            
            let output = '';
            let errorOutput = '';
            
            child.stdout.on('data', (data) => {
                output += data.toString();
                if (output.includes('started') || output.includes('listening')) {
                    this.services.set(name, child);
                    resolve({ pid: child.pid, output });
                }
            });
            
            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            
            child.on('error', (error) => {
                reject(new Error(`Failed to start ${name}: ${error.message}`));
            });
            
            child.on('exit', (code) => {
                if (code !== 0 && !this.services.has(name)) {
                    reject(new Error(`${name} exited with code ${code}: ${errorOutput}`));
                }
            });
            
            // Timeout for service startup
            setTimeout(() => {
                if (!this.services.has(name)) {
                    child.kill();
                    reject(new Error(`${name} startup timeout`));
                }
            }, 45000);
        });
    }

    async stopService(name) {
        const service = this.services.get(name);
        if (service) {
            console.log(`🛑 Stopping ${name}...`);
            service.kill('SIGTERM');
            
            // Wait for graceful shutdown
            await new Promise((resolve) => {
                service.on('exit', resolve);
                setTimeout(() => {
                    service.kill('SIGKILL');
                    resolve();
                }, 5000);
            });
            
            this.services.delete(name);
        }
    }

    async stopAllServices() {
        const promises = Array.from(this.services.keys()).map(name => 
            this.stopService(name)
        );
        await Promise.all(promises);
    }

    async healthCheck(name, url) {
        const axios = require('axios');
        
        // First check if service is already running (single attempt)
        try {
            const response = await axios.get(url, { timeout: 2000 });
            if (response.status === 200) {
                return true;
            }
        } catch (error) {
            // Service not running, continue with startup health check
        }
        
        // If not running, wait for service to start up
        for (let i = 0; i < 30; i++) {
            try {
                const response = await axios.get(url, { timeout: 5000 });
                if (response.status === 200) {
                    console.log(`✅ ${name} health check passed`);
                    return true;
                }
            } catch (error) {
                // Service not ready yet
            }
            
            await this.sleep(1000);
        }
        
        console.log(`❌ ${name} health check failed`);
        return false;
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main Test Runner
class AutomatedTestRunner {
    constructor() {
        this.serviceManager = new ServiceManager();
        this.aggregator = new TestResultsAggregator();
        this.startTime = null;
        this.options = {
            skipE2E: false,
            skipPerformance: false,
            skipSecurity: false,
            parallel: TEST_CONFIG.parallel,
            verbose: false,
            generateReport: true
        };
    }

    parseArguments() {
        const args = process.argv.slice(2);
        
        args.forEach(arg => {
            switch (arg) {
                case '--skip-e2e':
                    this.options.skipE2E = true;
                    break;
                case '--skip-performance':
                    this.options.skipPerformance = true;
                    break;
                case '--skip-security':
                    this.options.skipSecurity = true;
                    break;
                case '--sequential':
                    this.options.parallel = false;
                    break;
                case '--verbose':
                    this.options.verbose = true;
                    break;
                case '--no-report':
                    this.options.generateReport = false;
                    break;
                case '--help':
                    this.showHelp();
                    process.exit(0);
                    break;
            }
        });
    }

    showHelp() {
        console.log(`
🧪 NEXUS IDE Automated Test Runner

Usage: node run-all-tests.js [options]

Options:
  --skip-e2e          Skip End-to-End tests
  --skip-performance  Skip Performance tests
  --skip-security     Skip Security tests
  --sequential        Run tests sequentially instead of parallel
  --verbose           Enable verbose output
  --no-report         Skip report generation
  --help              Show this help message

Examples:
  node run-all-tests.js                    # Run all tests
  node run-all-tests.js --skip-e2e         # Skip E2E tests
  node run-all-tests.js --sequential       # Run tests one by one
  node run-all-tests.js --verbose          # Verbose output
`);
    }

    async runAllTests() {
        this.parseArguments();
        this.startTime = performance.now();
        
        console.log('🧪 NEXUS IDE - Automated Test Runner');
        console.log('=' .repeat(60));
        console.log(`📅 Started: ${new Date().toLocaleString()}`);
        console.log(`🔧 Mode: ${this.options.parallel ? 'Parallel' : 'Sequential'}`);
        console.log(`📊 Options:`, this.options);
        console.log('');
        
        try {
            // Setup environment
            await this.setupEnvironment();
            
            // Start required services
            await this.startServices();
            
            // Run test suites
            await this.runTestSuites();
            
            // Generate reports
            if (this.options.generateReport) {
                await this.generateReports();
            }
            
            // Display results
            this.displayResults();
            
            return this.aggregator.finalize();
            
        } catch (error) {
            console.error('💥 Test execution failed:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }

    async setupEnvironment() {
        console.log('🔧 Setting up test environment...');
        
        // Create reports directory
        if (!fs.existsSync(TEST_CONFIG.reportsDir)) {
            fs.mkdirSync(TEST_CONFIG.reportsDir, { recursive: true });
            console.log(`📁 Created reports directory: ${TEST_CONFIG.reportsDir}`);
        }
        
        // Check Node.js version
        const nodeVersion = process.version;
        console.log(`📦 Node.js version: ${nodeVersion}`);
        
        // Check available memory
        const memory = process.memoryUsage();
        console.log(`💾 Available memory: ${Math.round(memory.heapTotal / 1024 / 1024)}MB`);
        
        console.log('✅ Environment setup completed\n');
    }

    async startServices() {
        console.log('🚀 Starting required services...');
        
        for (const [name, config] of Object.entries(TEST_CONFIG.services)) {
            try {
                // Check if service is already running
                if (config.healthCheck) {
                    const isRunning = await this.serviceManager.healthCheck(name, config.healthCheck);
                    if (isRunning) {
                        console.log(`✅ ${name} is already running`);
                        continue;
                    }
                }
                
                await this.serviceManager.startService(name, config);
                
                // Health check
                if (config.healthCheck) {
                    const healthy = await this.serviceManager.healthCheck(name, config.healthCheck);
                    if (!healthy) {
                        throw new Error(`${name} health check failed`);
                    }
                }
                
                console.log(`✅ ${name} started successfully`);
                
            } catch (error) {
                console.error(`❌ Failed to start ${name}:`, error.message);
                throw error;
            }
        }
        
        console.log('✅ All services started\n');
    }

    async runTestSuites() {
        console.log('🧪 Running test suites...');
        
        // Filter test suites based on options
        let suitesToRun = TEST_SUITES.filter(suite => {
            if (this.options.skipE2E && suite.type === 'e2e') return false;
            if (this.options.skipPerformance && (suite.type === 'performance' || suite.type === 'benchmark')) return false;
            if (this.options.skipSecurity && suite.type === 'security') return false;
            return true;
        });
        
        // Sort by priority
        suitesToRun.sort((a, b) => a.priority - b.priority);
        
        console.log(`📋 Test suites to run: ${suitesToRun.length}`);
        suitesToRun.forEach(suite => {
            console.log(`  • ${suite.name} (${suite.type}) - Priority ${suite.priority}`);
        });
        console.log('');
        
        if (this.options.parallel) {
            await this.runSuitesParallel(suitesToRun);
        } else {
            await this.runSuitesSequential(suitesToRun);
        }
    }

    async runSuitesSequential(suites) {
        for (const suite of suites) {
            await this.runSingleSuite(suite);
        }
    }

    async runSuitesParallel(suites) {
        // Group by priority for parallel execution
        const priorityGroups = new Map();
        
        suites.forEach(suite => {
            if (!priorityGroups.has(suite.priority)) {
                priorityGroups.set(suite.priority, []);
            }
            priorityGroups.get(suite.priority).push(suite);
        });
        
        // Run each priority group in sequence, but suites within group in parallel
        for (const [priority, groupSuites] of priorityGroups) {
            console.log(`🔄 Running Priority ${priority} tests (${groupSuites.length} suites)...`);
            
            const promises = groupSuites.map(suite => this.runSingleSuite(suite));
            await Promise.allSettled(promises);
        }
    }

    async runSingleSuite(suite) {
        const startTime = performance.now();
        console.log(`\n🧪 Running ${suite.name}...`);
        
        try {
            const result = await this.executeSuite(suite);
            const duration = performance.now() - startTime;
            
            result.duration = duration;
            result.status = 'completed';
            
            this.aggregator.addSuiteResult(suite, result);
            
            const successRate = result.summary && result.summary.total > 0 ? 
                (result.summary.passed / result.summary.total) * 100 : 0;
            
            console.log(`✅ ${suite.name} completed: ${successRate.toFixed(1)}% success rate (${(duration / 1000).toFixed(1)}s)`);
            
        } catch (error) {
            const duration = performance.now() - startTime;
            
            const result = {
                status: 'failed',
                duration,
                error: error.message,
                summary: { total: 0, passed: 0, failed: 1, skipped: 0 }
            };
            
            this.aggregator.addSuiteResult(suite, result);
            
            console.error(`❌ ${suite.name} failed: ${error.message} (${(duration / 1000).toFixed(1)}s)`);
            
            if (suite.required) {
                throw new Error(`Required test suite '${suite.name}' failed: ${error.message}`);
            }
        }
    }

    async executeSuite(suite) {
        return new Promise((resolve, reject) => {
            const child = spawn('node', suite.command.split(' ').slice(1), {
                cwd: TEST_CONFIG.baseDir,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let output = '';
            let errorOutput = '';
            
            child.stdout.on('data', (data) => {
                output += data.toString();
                if (this.options.verbose) {
                    process.stdout.write(data);
                }
            });
            
            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
                if (this.options.verbose) {
                    process.stderr.write(data);
                }
            });
            
            child.on('exit', (code) => {
                if (code === 0) {
                    // Try to parse test results from output
                    const result = this.parseTestOutput(output);
                    resolve(result);
                } else {
                    reject(new Error(`Test suite exited with code ${code}: ${errorOutput}`));
                }
            });
            
            child.on('error', (error) => {
                reject(new Error(`Failed to execute test suite: ${error.message}`));
            });
            
            // Timeout handling
            const timeout = setTimeout(() => {
                child.kill('SIGTERM');
                reject(new Error(`Test suite timeout after ${suite.timeout}ms`));
            }, suite.timeout);
            
            child.on('exit', () => clearTimeout(timeout));
        });
    }

    parseTestOutput(output) {
        // Try to extract JSON results from output
        const jsonMatch = output.match(/\{[\s\S]*"summary"[\s\S]*\}/g);
        
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[jsonMatch.length - 1]);
            } catch (error) {
                // Fallback to basic parsing
            }
        }
        
        // Fallback: parse basic test results
        const passedMatch = output.match(/(\d+)\s+passed/i);
        const failedMatch = output.match(/(\d+)\s+failed/i);
        const skippedMatch = output.match(/(\d+)\s+skipped/i);
        
        const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
        const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
        const skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;
        const total = passed + failed + skipped;
        
        return {
            summary: { total, passed, failed, skipped },
            output,
            parsed: 'fallback'
        };
    }

    async generateReports() {
        console.log('\n📄 Generating test reports...');
        
        const results = this.aggregator.finalize();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // JSON Report
        const jsonPath = path.join(TEST_CONFIG.reportsDir, `automated-test-report-${timestamp}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
        console.log(`📋 JSON Report: ${jsonPath}`);
        
        // HTML Report
        const htmlPath = path.join(TEST_CONFIG.reportsDir, `automated-test-report-${timestamp}.html`);
        const htmlContent = this.generateHTMLReport(results);
        fs.writeFileSync(htmlPath, htmlContent);
        console.log(`🌐 HTML Report: ${htmlPath}`);
        
        // Summary Report
        const summaryPath = path.join(TEST_CONFIG.reportsDir, 'latest-summary.json');
        const summary = {
            timestamp: results.timestamp,
            summary: results.summary,
            suites: results.suites.map(s => ({
                name: s.name,
                type: s.type,
                status: s.status,
                successRate: s.summary && s.summary.total > 0 ? 
                    (s.summary.passed / s.summary.total) * 100 : 0
            })),
            status: results.summary.successRate >= 90 ? 'excellent' : 
                   results.summary.successRate >= 70 ? 'good' : 'needs-improvement'
        };
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
        console.log(`📊 Summary Report: ${summaryPath}`);
    }

    generateHTMLReport(results) {
        const successRate = results.summary.successRate;
        const statusColor = successRate >= 90 ? '#28a745' : 
                           successRate >= 70 ? '#ffc107' : '#dc3545';
        
        return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS IDE Automated Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .success-rate { font-size: 64px; font-weight: bold; color: ${statusColor}; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-number { font-size: 36px; font-weight: bold; color: #007bff; }
        .summary-label { font-size: 14px; color: #6c757d; margin-top: 5px; }
        .suite-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin: 20px 0; }
        .suite-card { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .suite-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .suite-name { font-size: 18px; font-weight: bold; }
        .suite-status { padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; }
        .status-completed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .suite-stats { display: flex; gap: 15px; font-size: 14px; }
        .error-section { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 NEXUS IDE Automated Test Report</h1>
            <div class="success-rate">${successRate.toFixed(1)}%</div>
            <p><strong>Overall Success Rate</strong></p>
            <p><strong>Generated:</strong> ${results.timestamp}</p>
            <p><strong>Duration:</strong> ${(results.summary.duration / 1000).toFixed(1)} seconds</p>
        </div>
        
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-number">${results.summary.total}</div>
                <div class="summary-label">Total Tests</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${results.summary.passed}</div>
                <div class="summary-label">Passed</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${results.summary.failed}</div>
                <div class="summary-label">Failed</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${results.summary.skipped}</div>
                <div class="summary-label">Skipped</div>
            </div>
        </div>
        
        <h2>📋 Test Suites Results</h2>
        <div class="suite-grid">
            ${results.suites.map(suite => {
                const suiteSuccessRate = suite.summary && suite.summary.total > 0 ? 
                    (suite.summary.passed / suite.summary.total) * 100 : 0;
                return `
                <div class="suite-card">
                    <div class="suite-header">
                        <div class="suite-name">${suite.name}</div>
                        <div class="suite-status status-${suite.status}">${suite.status}</div>
                    </div>
                    <div class="suite-stats">
                        <span><strong>Success Rate:</strong> ${suiteSuccessRate.toFixed(1)}%</span>
                        <span><strong>Duration:</strong> ${(suite.duration / 1000).toFixed(1)}s</span>
                        <span><strong>Type:</strong> ${suite.type}</span>
                    </div>
                    ${suite.summary ? `
                    <div class="suite-stats">
                        <span>Total: ${suite.summary.total}</span>
                        <span>Passed: ${suite.summary.passed}</span>
                        <span>Failed: ${suite.summary.failed}</span>
                        <span>Skipped: ${suite.summary.skipped}</span>
                    </div>
                    ` : ''}
                    ${suite.error ? `<div class="error-section"><strong>Error:</strong> ${suite.error}</div>` : ''}
                </div>
                `;
            }).join('')}
        </div>
        
        ${results.errors.length > 0 ? `
        <h2>❌ Errors</h2>
        <div class="error-section">
            ${results.errors.map(error => `<p>${error}</p>`).join('')}
        </div>
        ` : ''}
        
        <h2>🔧 Environment Information</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-number">${results.environment.nodeVersion}</div>
                <div class="summary-label">Node.js Version</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${results.environment.platform}</div>
                <div class="summary-label">Platform</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${Math.round(results.environment.memory.heapUsed / 1024 / 1024)}MB</div>
                <div class="summary-label">Memory Used</div>
            </div>
        </div>
    </div>
</body>
</html>
        `;
    }

    displayResults() {
        const results = this.aggregator.finalize();
        const duration = performance.now() - this.startTime;
        
        console.log('\n' + '='.repeat(60));
        console.log('🎯 TEST EXECUTION SUMMARY');
        console.log('='.repeat(60));
        console.log(`📊 Overall Success Rate: ${results.summary.successRate.toFixed(1)}%`);
        console.log(`⏱️  Total Duration: ${(duration / 1000).toFixed(1)} seconds`);
        console.log(`🧪 Total Tests: ${results.summary.total}`);
        console.log(`✅ Passed: ${results.summary.passed}`);
        console.log(`❌ Failed: ${results.summary.failed}`);
        console.log(`⏭️  Skipped: ${results.summary.skipped}`);
        console.log('');
        
        // Suite breakdown
        console.log('📋 Test Suites Breakdown:');
        results.suites.forEach(suite => {
            const successRate = suite.summary && suite.summary.total > 0 ? 
                (suite.summary.passed / suite.summary.total) * 100 : 0;
            const status = suite.status === 'completed' ? '✅' : '❌';
            console.log(`  ${status} ${suite.name}: ${successRate.toFixed(1)}% (${(suite.duration / 1000).toFixed(1)}s)`);
        });
        
        console.log('');
        
        // Status assessment
        if (results.summary.successRate >= 95) {
            console.log('🎉 EXCELLENT! All tests are performing exceptionally well.');
        } else if (results.summary.successRate >= 80) {
            console.log('👍 GOOD! Most tests are passing, minor issues to address.');
        } else if (results.summary.successRate >= 60) {
            console.log('⚠️  WARNING! Several tests are failing, attention needed.');
        } else {
            console.log('🚨 CRITICAL! Many tests are failing, immediate action required.');
        }
        
        console.log('='.repeat(60));
    }

    async cleanup() {
        console.log('\n🧹 Cleaning up...');
        
        try {
            await this.serviceManager.stopAllServices();
            console.log('✅ All services stopped');
        } catch (error) {
            console.error('❌ Error during cleanup:', error.message);
        }
        
        console.log('✅ Cleanup completed');
    }
}

// Main execution
if (require.main === module) {
    const runner = new AutomatedTestRunner();
    
    runner.runAllTests()
        .then(results => {
            const exitCode = results.summary.successRate >= 80 ? 0 : 1;
            console.log(`\n🏁 Test execution completed with exit code: ${exitCode}`);
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = AutomatedTestRunner;