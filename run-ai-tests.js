#!/usr/bin/env node
/**
 * NEXUS IDE - AI-MCP Integration Test Runner
 * Main test runner script for comprehensive AI-MCP testing
 */

const { AITestingFramework } = require('./ai-testing-framework');
const path = require('path');
const fs = require('fs').promises;

class TestRunner {
    constructor() {
        this.framework = new AITestingFramework();
        this.config = {
            outputFormat: 'all', // console, json, html, markdown, all
            saveResults: true,
            exitOnFailure: true,
            verbose: true,
            runBenchmarks: true,
            generateReports: true,
            testSuites: {
                unit: true,
                integration: true,
                performance: true,
                'ai-models': true,
                'mcp-router': true,
                e2e: true,
                stress: false, // Disabled by default (resource intensive)
                security: true
            }
        };
        
        this.parseCommandLineArgs();
    }

    parseCommandLineArgs() {
        const args = process.argv.slice(2);
        
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            
            switch (arg) {
                case '--help':
                case '-h':
                    this.showHelp();
                    process.exit(0);
                    break;
                    
                case '--verbose':
                case '-v':
                    this.config.verbose = true;
                    break;
                    
                case '--quiet':
                case '-q':
                    this.config.verbose = false;
                    break;
                    
                case '--no-benchmarks':
                    this.config.runBenchmarks = false;
                    break;
                    
                case '--no-reports':
                    this.config.generateReports = false;
                    break;
                    
                case '--include-stress':
                    this.config.testSuites.stress = true;
                    break;
                    
                case '--suite':
                case '-s':
                    if (i + 1 < args.length) {
                        const suites = args[++i].split(',');
                        // Disable all suites first
                        Object.keys(this.config.testSuites).forEach(suite => {
                            this.config.testSuites[suite] = false;
                        });
                        // Enable specified suites
                        suites.forEach(suite => {
                            if (this.config.testSuites.hasOwnProperty(suite.trim())) {
                                this.config.testSuites[suite.trim()] = true;
                            }
                        });
                    }
                    break;
                    
                case '--format':
                case '-f':
                    if (i + 1 < args.length) {
                        this.config.outputFormat = args[++i];
                    }
                    break;
                    
                case '--no-exit':
                    this.config.exitOnFailure = false;
                    break;
                    
                default:
                    if (arg.startsWith('--')) {
                        console.warn(`⚠️ Unknown option: ${arg}`);
                    }
                    break;
            }
        }
    }

    showHelp() {
        console.log(`
🧪 NEXUS IDE AI-MCP Integration Test Runner

Usage: node run-ai-tests.js [options]

Options:
  -h, --help              Show this help message
  -v, --verbose           Enable verbose output (default)
  -q, --quiet             Disable verbose output
  -s, --suite <suites>    Run specific test suites (comma-separated)
                          Available: unit,integration,performance,ai-models,mcp-router,e2e,stress,security
  -f, --format <format>   Output format: console,json,html,markdown,all (default: all)
  --no-benchmarks         Skip performance benchmarks
  --no-reports            Skip report generation
  --include-stress        Include stress tests (resource intensive)
  --no-exit               Don't exit with error code on test failures

Examples:
  node run-ai-tests.js                           # Run all tests (except stress)
  node run-ai-tests.js -s unit,integration       # Run only unit and integration tests
  node run-ai-tests.js --include-stress          # Run all tests including stress tests
  node run-ai-tests.js -f console --no-reports   # Console output only, no reports
  node run-ai-tests.js -q --no-benchmarks        # Quiet mode, skip benchmarks

`);
    }

    async run() {
        console.log('🚀 Starting NEXUS IDE AI-MCP Integration Tests...');
        console.log('=' .repeat(60));
        
        // Show configuration
        if (this.config.verbose) {
            console.log('📋 Test Configuration:');
            console.log(`  • Verbose: ${this.config.verbose}`);
            console.log(`  • Benchmarks: ${this.config.runBenchmarks}`);
            console.log(`  • Reports: ${this.config.generateReports}`);
            console.log(`  • Output Format: ${this.config.outputFormat}`);
            console.log(`  • Test Suites: ${Object.entries(this.config.testSuites).filter(([_, enabled]) => enabled).map(([name]) => name).join(', ')}`);
            console.log('');
        }
        
        try {
            // Configure framework
            this.framework.testConfig.verbose = this.config.verbose;
            this.framework.testConfig.generateReports = this.config.generateReports;
            
            // Disable test suites based on configuration
            for (const [suiteName, enabled] of Object.entries(this.config.testSuites)) {
                if (!enabled && this.framework.testSuites.has(suiteName)) {
                    this.framework.testSuites.delete(suiteName);
                }
            }
            
            // Run tests
            const results = await this.framework.runAllTests();
            
            // Output results based on format
            await this.outputResults(results);
            
            // Exit with appropriate code
            if (this.config.exitOnFailure && results.summary.failed > 0) {
                console.log('\n❌ Tests failed. Exiting with error code 1.');
                process.exit(1);
            } else {
                console.log('\n✅ All tests completed successfully!');
                process.exit(0);
            }
            
        } catch (error) {
            console.error('❌ Test runner failed:', error.message);
            if (this.config.verbose) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }

    async outputResults(results) {
        const formats = this.config.outputFormat === 'all' 
            ? ['console', 'json', 'html', 'markdown']
            : [this.config.outputFormat];
        
        for (const format of formats) {
            switch (format) {
                case 'console':
                    // Already printed by framework
                    break;
                    
                case 'json':
                    await this.outputJSON(results);
                    break;
                    
                case 'html':
                    await this.outputHTML(results);
                    break;
                    
                case 'markdown':
                    await this.outputMarkdown(results);
                    break;
                    
                default:
                    console.warn(`⚠️ Unknown output format: ${format}`);
                    break;
            }
        }
    }

    async outputJSON(results) {
        if (!this.config.saveResults) return;
        
        const outputPath = path.join(__dirname, 'test-results.json');
        await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
        
        if (this.config.verbose) {
            console.log(`📄 JSON results saved to: ${outputPath}`);
        }
    }

    async outputHTML(results) {
        if (!this.config.saveResults) return;
        
        const htmlContent = this.generateEnhancedHTMLReport(results);
        const outputPath = path.join(__dirname, 'test-report.html');
        await fs.writeFile(outputPath, htmlContent);
        
        if (this.config.verbose) {
            console.log(`📄 HTML report saved to: ${outputPath}`);
        }
    }

    async outputMarkdown(results) {
        if (!this.config.saveResults) return;
        
        const markdownContent = this.generateEnhancedMarkdownReport(results);
        const outputPath = path.join(__dirname, 'test-summary.md');
        await fs.writeFile(outputPath, markdownContent);
        
        if (this.config.verbose) {
            console.log(`📄 Markdown summary saved to: ${outputPath}`);
        }
    }

    generateEnhancedHTMLReport(results) {
        const successRate = parseFloat(results.summary.successRate);
        const statusColor = successRate >= 90 ? '#4CAF50' : successRate >= 70 ? '#ff9800' : '#f44336';
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS IDE AI-MCP Integration Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .header h1 {
            color: #2c3e50;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .header .subtitle {
            color: #7f8c8d;
            font-size: 1.2em;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        }
        .summary-card:hover {
            transform: translateY(-5px);
        }
        .summary-card .number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .summary-card .label {
            color: #7f8c8d;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .success-rate {
            background: linear-gradient(135deg, ${statusColor}, ${statusColor}dd);
            color: white;
        }
        .content-section {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        .section-title {
            color: #2c3e50;
            font-size: 1.8em;
            margin-bottom: 20px;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        .test-suite {
            margin-bottom: 25px;
            border: 1px solid #ecf0f1;
            border-radius: 10px;
            overflow: hidden;
        }
        .suite-header {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #ecf0f1;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .suite-name {
            font-weight: bold;
            font-size: 1.1em;
        }
        .suite-stats {
            display: flex;
            gap: 15px;
        }
        .stat {
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
        }
        .stat.passed { background: #d4edda; color: #155724; }
        .stat.failed { background: #f8d7da; color: #721c24; }
        .stat.skipped { background: #fff3cd; color: #856404; }
        .test-list {
            padding: 0;
        }
        .test-item {
            padding: 12px 20px;
            border-bottom: 1px solid #f1f3f4;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .test-item:last-child {
            border-bottom: none;
        }
        .test-name {
            flex: 1;
        }
        .test-status {
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .test-status.passed {
            background: #d4edda;
            color: #155724;
        }
        .test-status.failed {
            background: #f8d7da;
            color: #721c24;
        }
        .test-status.skipped {
            background: #fff3cd;
            color: #856404;
        }
        .test-duration {
            color: #6c757d;
            font-size: 0.9em;
            margin-left: 10px;
        }
        .benchmark-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .benchmark-card {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            border-left: 4px solid #3498db;
        }
        .benchmark-title {
            font-weight: bold;
            margin-bottom: 15px;
            color: #2c3e50;
        }
        .benchmark-data {
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            background: white;
            padding: 15px;
            border-radius: 5px;
            white-space: pre-wrap;
            max-height: 300px;
            overflow-y: auto;
        }
        .footer {
            text-align: center;
            color: rgba(255, 255, 255, 0.8);
            margin-top: 50px;
            padding: 20px;
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #ecf0f1;
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: ${statusColor};
            width: ${successRate}%;
            transition: width 0.3s ease;
        }
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .summary-grid { grid-template-columns: repeat(2, 1fr); }
            .benchmark-grid { grid-template-columns: 1fr; }
            .suite-header { flex-direction: column; gap: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 NEXUS IDE AI-MCP Integration Test Report</h1>
            <div class="subtitle">Comprehensive Testing Results</div>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
        </div>
        
        <div class="summary-grid">
            <div class="summary-card">
                <div class="number">${results.summary.totalTests}</div>
                <div class="label">Total Tests</div>
            </div>
            <div class="summary-card">
                <div class="number" style="color: #27ae60;">${results.summary.passed}</div>
                <div class="label">Passed</div>
            </div>
            <div class="summary-card">
                <div class="number" style="color: #e74c3c;">${results.summary.failed}</div>
                <div class="label">Failed</div>
            </div>
            <div class="summary-card">
                <div class="number" style="color: #f39c12;">${results.summary.skipped}</div>
                <div class="label">Skipped</div>
            </div>
            <div class="summary-card success-rate">
                <div class="number">${results.summary.successRate}</div>
                <div class="label">Success Rate</div>
            </div>
            <div class="summary-card">
                <div class="number">${Math.round(results.summary.duration / 1000)}s</div>
                <div class="label">Duration</div>
            </div>
        </div>
        
        <div class="content-section">
            <h2 class="section-title">🧪 Test Suites Results</h2>
            ${Object.entries(results.suites).map(([suiteName, suite]) => `
                <div class="test-suite">
                    <div class="suite-header">
                        <div class="suite-name">${suiteName}</div>
                        <div class="suite-stats">
                            <span class="stat passed">${suite.passed} passed</span>
                            <span class="stat failed">${suite.failed} failed</span>
                            <span class="stat skipped">${suite.skipped} skipped</span>
                        </div>
                    </div>
                    <div class="test-list">
                        ${suite.tests.map(test => `
                            <div class="test-item">
                                <div class="test-name">${test.name}</div>
                                <div>
                                    <span class="test-status ${test.status}">${test.status}</span>
                                    <span class="test-duration">${test.duration}ms</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${Object.keys(results.benchmarks).length > 0 ? `
            <div class="content-section">
                <h2 class="section-title">🏃 Performance Benchmarks</h2>
                <div class="benchmark-grid">
                    ${Object.entries(results.benchmarks).map(([benchmarkName, benchmark]) => `
                        <div class="benchmark-card">
                            <div class="benchmark-title">${benchmarkName}</div>
                            <div class="benchmark-data">${JSON.stringify(benchmark, null, 2)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${results.errors.length > 0 ? `
            <div class="content-section">
                <h2 class="section-title">❌ Errors</h2>
                ${results.errors.map(error => `
                    <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 10px 0;">
                        <strong>Suite:</strong> ${error.suite}<br>
                        <strong>Error:</strong> ${error.error}
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        <div class="footer">
            <p>Generated by NEXUS IDE AI-MCP Testing Framework</p>
            <p>Report generated at: ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;
    }

    generateEnhancedMarkdownReport(results) {
        const successRate = parseFloat(results.summary.successRate);
        const statusEmoji = successRate >= 90 ? '🟢' : successRate >= 70 ? '🟡' : '🔴';
        
        return `# 🧪 NEXUS IDE AI-MCP Integration Test Report

${statusEmoji} **Overall Status:** ${results.summary.successRate} Success Rate

## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | ${results.summary.totalTests} |
| **Passed** | ${results.summary.passed} ✅ |
| **Failed** | ${results.summary.failed} ❌ |
| **Skipped** | ${results.summary.skipped} ⏭️ |
| **Success Rate** | ${results.summary.successRate} |
| **Duration** | ${Math.round(results.summary.duration / 1000)}s |
| **Started** | ${results.summary.startTime} |
| **Completed** | ${results.summary.endTime} |

## 🧪 Test Suites Breakdown

${Object.entries(results.suites).map(([suiteName, suite]) => {
    const suiteStatus = suite.failed === 0 ? '✅' : '❌';
    return `### ${suiteStatus} ${suiteName}

**Summary:** ${suite.passed}/${suite.totalTests} tests passed (${Math.round(suite.duration / 1000)}s)

| Test | Status | Duration |
|------|--------|----------|
${suite.tests.map(test => {
    const testStatus = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
    return `| ${test.name} | ${testStatus} ${test.status} | ${test.duration}ms |`;
}).join('\n')}

${suite.tests.filter(test => test.error).length > 0 ? `
**Errors:**
${suite.tests.filter(test => test.error).map(test => `- **${test.name}:** ${test.error}`).join('\n')}
` : ''}`;
}).join('\n')}

${Object.keys(results.benchmarks).length > 0 ? `
## 🏃 Performance Benchmarks

${Object.entries(results.benchmarks).map(([benchmarkName, benchmark]) => `
### ${benchmarkName}

\`\`\`json
${JSON.stringify(benchmark, null, 2)}
\`\`\`
`).join('')}
` : ''}

${results.errors.length > 0 ? `
## ❌ Critical Errors

${results.errors.map(error => `
### ${error.suite}

\`\`\`
${error.error}
\`\`\`
`).join('')}
` : ''}

## 📈 Key Insights

### Test Coverage
- **Unit Tests:** ${results.suites.unit ? `${results.suites.unit.passed}/${results.suites.unit.totalTests}` : 'Not run'}
- **Integration Tests:** ${results.suites.integration ? `${results.suites.integration.passed}/${results.suites.integration.totalTests}` : 'Not run'}
- **Performance Tests:** ${results.suites.performance ? `${results.suites.performance.passed}/${results.suites.performance.totalTests}` : 'Not run'}
- **End-to-End Tests:** ${results.suites.e2e ? `${results.suites.e2e.passed}/${results.suites.e2e.totalTests}` : 'Not run'}

### Performance Highlights
${results.benchmarks.aiModelPerformance ? `- **AI Model Response Time:** ${Object.values(results.benchmarks.aiModelPerformance)[0]?.averageDuration || 'N/A'}ms average` : ''}
${results.benchmarks.mcpRouterPerformance ? `- **MCP Router Response Time:** ${Object.values(results.benchmarks.mcpRouterPerformance)[0]?.averageDuration || 'N/A'}ms average` : ''}
${results.benchmarks.throughputTest ? `- **Maximum Throughput:** ${Math.max(...Object.values(results.benchmarks.throughputTest).map(t => t.throughput || 0))} req/s` : ''}

### Recommendations

${results.summary.failed > 0 ? `
#### 🔧 Issues to Address
- ${results.summary.failed} test(s) are failing and need immediate attention
- Review failed tests and fix underlying issues
- Consider increasing test coverage in failing areas
` : ''}

${successRate < 90 ? `
#### 📊 Quality Improvements
- Current success rate (${results.summary.successRate}) is below target (90%)
- Focus on improving test reliability and fixing flaky tests
- Consider adding more comprehensive error handling
` : ''}

#### 🚀 Performance Optimizations
- Monitor AI model response times and optimize slow operations
- Implement caching strategies for frequently accessed data
- Consider load balancing for high-throughput scenarios

---

**Report Generated:** ${new Date().toLocaleString()}  
**Framework:** NEXUS IDE AI-MCP Testing Framework  
**Version:** 1.0.0`;
    }
}

// Run the test runner if this file is executed directly
if (require.main === module) {
    const runner = new TestRunner();
    runner.run().catch(error => {
        console.error('❌ Test runner crashed:', error.message);
        process.exit(1);
    });
}

module.exports = { TestRunner };