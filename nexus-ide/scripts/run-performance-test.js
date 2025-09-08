#!/usr/bin/env node
/**
 * Performance Test Runner for MCP Server Registry
 * สคริปต์สำหรับรันการทดสอบประสิทธิภาพระบบ 2500 MCP Servers
 * 
 * Usage:
 *   node scripts/run-performance-test.js
 *   npm run test:performance
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class PerformanceTestRunner {
  constructor() {
    this.testFile = path.join(__dirname, '../src/tests/MCPServerRegistry.performance.test.ts');
    this.resultsDir = path.join(__dirname, '../test-results');
    this.logFile = path.join(this.resultsDir, `performance-test-${Date.now()}.log`);
  }

  /**
   * Run performance tests
   */
  async run() {
    console.log(`${colors.cyan}${colors.bright}🚀 MCP Server Registry Performance Test Runner${colors.reset}`);
    console.log(`${colors.blue}Testing 2500 MCP Servers Performance${colors.reset}\n`);

    try {
      // Check system requirements
      await this.checkSystemRequirements();
      
      // Prepare test environment
      await this.prepareTestEnvironment();
      
      // Run the performance tests
      await this.runPerformanceTests();
      
      // Generate report
      await this.generateReport();
      
      console.log(`\n${colors.green}✅ Performance testing completed successfully!${colors.reset}`);
      
    } catch (error) {
      console.error(`\n${colors.red}❌ Performance testing failed:${colors.reset}`, error.message);
      process.exit(1);
    }
  }

  /**
   * Check system requirements
   */
  async checkSystemRequirements() {
    console.log(`${colors.yellow}📋 Checking system requirements...${colors.reset}`);
    
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`   Node.js version: ${nodeVersion}`);
    
    if (parseInt(nodeVersion.slice(1)) < 16) {
      throw new Error('Node.js 16+ is required for performance testing');
    }
    
    // Check available memory
    const totalMemory = os.totalmem() / 1024 / 1024 / 1024; // GB
    const freeMemory = os.freemem() / 1024 / 1024 / 1024; // GB
    
    console.log(`   Total memory: ${totalMemory.toFixed(2)} GB`);
    console.log(`   Free memory: ${freeMemory.toFixed(2)} GB`);
    
    if (freeMemory < 2) {
      console.warn(`   ${colors.yellow}⚠️  Warning: Low free memory (${freeMemory.toFixed(2)} GB). Performance tests may be affected.${colors.reset}`);
    }
    
    // Check CPU cores
    const cpuCores = os.cpus().length;
    console.log(`   CPU cores: ${cpuCores}`);
    
    if (cpuCores < 4) {
      console.warn(`   ${colors.yellow}⚠️  Warning: Limited CPU cores (${cpuCores}). Consider running tests on a more powerful machine.${colors.reset}`);
    }
    
    // Check if test file exists
    if (!fs.existsSync(this.testFile)) {
      throw new Error(`Performance test file not found: ${this.testFile}`);
    }
    
    console.log(`   ${colors.green}✅ System requirements check passed${colors.reset}\n`);
  }

  /**
   * Prepare test environment
   */
  async prepareTestEnvironment() {
    console.log(`${colors.yellow}🔧 Preparing test environment...${colors.reset}`);
    
    // Create results directory
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
      console.log(`   Created results directory: ${this.resultsDir}`);
    }
    
    // Set environment variables for testing
    process.env.NODE_ENV = 'test';
    process.env.MCP_PERFORMANCE_TEST = 'true';
    process.env.MCP_MAX_SERVERS = '2500';
    process.env.MCP_CPU_MONITORING = 'true';
    process.env.MCP_PERFORMANCE_OPTIMIZATION = 'true';
    
    // Enable garbage collection for memory testing
    if (!process.env.NODE_OPTIONS) {
      process.env.NODE_OPTIONS = '--expose-gc';
    } else if (!process.env.NODE_OPTIONS.includes('--expose-gc')) {
      process.env.NODE_OPTIONS += ' --expose-gc';
    }
    
    console.log(`   Environment variables set`);
    console.log(`   Max servers: ${process.env.MCP_MAX_SERVERS}`);
    console.log(`   CPU monitoring: ${process.env.MCP_CPU_MONITORING}`);
    console.log(`   Performance optimization: ${process.env.MCP_PERFORMANCE_OPTIMIZATION}`);
    
    console.log(`   ${colors.green}✅ Test environment prepared${colors.reset}\n`);
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests() {
    console.log(`${colors.yellow}🧪 Running performance tests...${colors.reset}`);
    
    return new Promise((resolve, reject) => {
      // Use ts-node to run TypeScript test file directly
      const testProcess = spawn('npx', ['ts-node', this.testFile], {
        stdio: ['inherit', 'pipe', 'pipe'],
        env: process.env
      });
      
      let stdout = '';
      let stderr = '';
      
      // Capture stdout
      testProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output); // Also display in real-time
      });
      
      // Capture stderr
      testProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output); // Also display in real-time
      });
      
      // Handle process completion
      testProcess.on('close', (code) => {
        // Save logs to file
        const logContent = `Performance Test Results\n` +
          `Date: ${new Date().toISOString()}\n` +
          `Exit Code: ${code}\n` +
          `\n--- STDOUT ---\n${stdout}\n` +
          `\n--- STDERR ---\n${stderr}\n`;
        
        fs.writeFileSync(this.logFile, logContent);
        
        if (code === 0) {
          console.log(`\n   ${colors.green}✅ Performance tests completed successfully${colors.reset}`);
          resolve({ stdout, stderr, code });
        } else {
          console.error(`\n   ${colors.red}❌ Performance tests failed with exit code ${code}${colors.reset}`);
          reject(new Error(`Performance tests failed with exit code ${code}`));
        }
      });
      
      // Handle process errors
      testProcess.on('error', (error) => {
        console.error(`\n   ${colors.red}❌ Failed to start performance tests:${colors.reset}`, error.message);
        reject(error);
      });
      
      // Set timeout for long-running tests (10 minutes)
      setTimeout(() => {
        testProcess.kill('SIGTERM');
        reject(new Error('Performance tests timed out after 10 minutes'));
      }, 10 * 60 * 1000);
    });
  }

  /**
   * Generate performance report
   */
  async generateReport() {
    console.log(`\n${colors.yellow}📊 Generating performance report...${colors.reset}`);
    
    try {
      // Read the log file
      const logContent = fs.readFileSync(this.logFile, 'utf8');
      
      // Extract key metrics from log
      const metrics = this.extractMetrics(logContent);
      
      // Generate HTML report
      const htmlReport = this.generateHTMLReport(metrics);
      const htmlFile = path.join(this.resultsDir, `performance-report-${Date.now()}.html`);
      fs.writeFileSync(htmlFile, htmlReport);
      
      // Generate JSON report
      const jsonReport = JSON.stringify(metrics, null, 2);
      const jsonFile = path.join(this.resultsDir, `performance-report-${Date.now()}.json`);
      fs.writeFileSync(jsonFile, jsonReport);
      
      console.log(`   ${colors.green}✅ Reports generated:${colors.reset}`);
      console.log(`   📄 HTML Report: ${htmlFile}`);
      console.log(`   📄 JSON Report: ${jsonFile}`);
      console.log(`   📄 Log File: ${this.logFile}`);
      
      // Display summary
      this.displaySummary(metrics);
      
    } catch (error) {
      console.warn(`   ${colors.yellow}⚠️  Could not generate detailed report:${colors.reset}`, error.message);
    }
  }

  /**
   * Extract metrics from log content
   */
  extractMetrics(logContent) {
    const metrics = {
      timestamp: new Date().toISOString(),
      systemInfo: {
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch(),
        cpuCores: os.cpus().length,
        totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`
      },
      tests: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        averageCPU: 0,
        averageMemory: 0,
        averageResponseTime: 0
      }
    };
    
    // Extract test results using regex patterns
    const testPatterns = {
      testName: /📊 Running: (.+)/g,
      cpuUsage: /Current CPU usage: ([\d.]+)%/g,
      memoryUsage: /Memory usage: ([\d.]+)%/g,
      responseTime: /Avg response time: ([\d.]+)ms/g,
      throughput: /([\d.]+) req\/sec/g,
      success: /✅|❌/g
    };
    
    // Simple extraction (could be enhanced with more sophisticated parsing)
    let match;
    while ((match = testPatterns.testName.exec(logContent)) !== null) {
      metrics.tests.push({ name: match[1] });
    }
    
    metrics.summary.totalTests = metrics.tests.length;
    
    return metrics;
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(metrics) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP Server Registry Performance Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 30px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
        }
        .header h1 {
            color: #2c3e50;
            margin: 0;
        }
        .header p {
            color: #7f8c8d;
            margin: 10px 0 0 0;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #3498db;
        }
        .metric-card h3 {
            margin: 0 0 10px 0;
            color: #2c3e50;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .metric-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #3498db;
        }
        .system-info {
            background: #ecf0f1;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 30px;
        }
        .system-info h2 {
            margin: 0 0 15px 0;
            color: #2c3e50;
        }
        .system-info table {
            width: 100%;
            border-collapse: collapse;
        }
        .system-info td {
            padding: 8px 0;
            border-bottom: 1px solid #bdc3c7;
        }
        .system-info td:first-child {
            font-weight: bold;
            width: 150px;
        }
        .tests-section {
            margin-top: 30px;
        }
        .tests-section h2 {
            color: #2c3e50;
            margin-bottom: 20px;
        }
        .test-item {
            background: #f8f9fa;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 6px;
            border-left: 4px solid #27ae60;
        }
        .test-item.failed {
            border-left-color: #e74c3c;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #7f8c8d;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 MCP Server Registry Performance Report</h1>
            <p>Generated on ${new Date(metrics.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Total Tests</h3>
                <div class="value">${metrics.summary.totalTests}</div>
            </div>
            <div class="metric-card">
                <h3>Passed Tests</h3>
                <div class="value">${metrics.summary.passedTests}</div>
            </div>
            <div class="metric-card">
                <h3>Failed Tests</h3>
                <div class="value">${metrics.summary.failedTests}</div>
            </div>
            <div class="metric-card">
                <h3>Success Rate</h3>
                <div class="value">${metrics.summary.totalTests > 0 ? ((metrics.summary.passedTests / metrics.summary.totalTests) * 100).toFixed(1) : 0}%</div>
            </div>
        </div>
        
        <div class="system-info">
            <h2>🖥️ System Information</h2>
            <table>
                <tr><td>Node.js Version:</td><td>${metrics.systemInfo.nodeVersion}</td></tr>
                <tr><td>Platform:</td><td>${metrics.systemInfo.platform}</td></tr>
                <tr><td>Architecture:</td><td>${metrics.systemInfo.arch}</td></tr>
                <tr><td>CPU Cores:</td><td>${metrics.systemInfo.cpuCores}</td></tr>
                <tr><td>Total Memory:</td><td>${metrics.systemInfo.totalMemory}</td></tr>
            </table>
        </div>
        
        <div class="tests-section">
            <h2>🧪 Test Results</h2>
            ${metrics.tests.map(test => `
                <div class="test-item">
                    <strong>${test.name}</strong>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p>Generated by NEXUS IDE MCP Server Registry Performance Test Runner</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Display summary in console
   */
  displaySummary(metrics) {
    console.log(`\n${colors.cyan}${colors.bright}📋 PERFORMANCE TEST SUMMARY${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
    
    console.log(`\n${colors.yellow}🖥️  System Information:${colors.reset}`);
    console.log(`   Node.js: ${metrics.systemInfo.nodeVersion}`);
    console.log(`   Platform: ${metrics.systemInfo.platform} (${metrics.systemInfo.arch})`);
    console.log(`   CPU Cores: ${metrics.systemInfo.cpuCores}`);
    console.log(`   Memory: ${metrics.systemInfo.totalMemory}`);
    
    console.log(`\n${colors.yellow}📊 Test Results:${colors.reset}`);
    console.log(`   Total Tests: ${metrics.summary.totalTests}`);
    console.log(`   Passed: ${colors.green}${metrics.summary.passedTests}${colors.reset}`);
    console.log(`   Failed: ${metrics.summary.failedTests > 0 ? colors.red : colors.green}${metrics.summary.failedTests}${colors.reset}`);
    
    const successRate = metrics.summary.totalTests > 0 ? 
      ((metrics.summary.passedTests / metrics.summary.totalTests) * 100).toFixed(1) : 0;
    console.log(`   Success Rate: ${successRate >= 90 ? colors.green : successRate >= 70 ? colors.yellow : colors.red}${successRate}%${colors.reset}`);
    
    console.log(`\n${colors.yellow}💡 Recommendations:${colors.reset}`);
    if (successRate >= 95) {
      console.log(`   ${colors.green}✅ Excellent performance! System ready for 2500+ MCP servers.${colors.reset}`);
    } else if (successRate >= 80) {
      console.log(`   ${colors.yellow}⚠️  Good performance with minor issues. Review failed tests.${colors.reset}`);
    } else {
      console.log(`   ${colors.red}❌ Performance issues detected. System optimization required.${colors.reset}`);
    }
    
    console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}`);
  }
}

// Run the performance test runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new PerformanceTestRunner();
  runner.run().catch((error) => {
    console.error(`${colors.red}💥 Performance test runner failed:${colors.reset}`, error.message);
    process.exit(1);
  });
}

export default PerformanceTestRunner;