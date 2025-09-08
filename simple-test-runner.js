#!/usr/bin/env node

/**
 * 🧪 NEXUS IDE - Simple Test Runner
 * ระบบทดสอบแบบง่ายที่ทำงานกับเซิร์ฟเวอร์ที่มีอยู่แล้ว
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class SimpleTestRunner {
    constructor() {
        this.config = {
            baseUrl: 'http://localhost:8081',
            timeout: 10000,
            retries: 3
        };
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    async runTest(name, testFn) {
        console.log(`🧪 Running: ${name}`);
        this.results.total++;
        
        try {
            await testFn();
            console.log(`✅ ${name}`);
            this.results.passed++;
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
            this.results.failed++;
            this.results.errors.push({ test: name, error: error.message });
        }
    }

    async testServerHealth() {
        const response = await axios.get(`${this.config.baseUrl}/api/status`, {
            timeout: this.config.timeout
        });
        
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
        
        if (!response.data || typeof response.data !== 'object') {
            throw new Error('Invalid response format');
        }
    }

    async testDashboard() {
        const response = await axios.get(`${this.config.baseUrl}/`, {
            timeout: this.config.timeout
        });
        
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
        
        if (!response.data.includes('NEXUS IDE')) {
            throw new Error('Dashboard does not contain expected content');
        }
    }

    async testIDE() {
        const response = await axios.get(`${this.config.baseUrl}/ide`, {
            timeout: this.config.timeout
        });
        
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
    }

    async testAPI() {
        const endpoints = [
            '/api/system-health',
            '/api/mcp-servers'
        ];

        for (const endpoint of endpoints) {
            const response = await axios.get(`${this.config.baseUrl}${endpoint}`, {
                timeout: this.config.timeout
            });
            
            if (response.status !== 200) {
                throw new Error(`${endpoint}: Expected status 200, got ${response.status}`);
            }
        }
    }

    async testFileOperations() {
        // Test IDE file listing
        const response = await axios.get(`${this.config.baseUrl}/api/ide/files`, {
            timeout: this.config.timeout
        });
        
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
        
        if (!response.data || !response.data.files) {
            throw new Error('Invalid file listing response format');
        }
    }

    async testPerformance() {
        const start = Date.now();
        
        await axios.get(`${this.config.baseUrl}/api/status`, {
            timeout: this.config.timeout
        });
        
        const duration = Date.now() - start;
        
        if (duration > 5000) {
            throw new Error(`Response too slow: ${duration}ms`);
        }
    }

    async runAllTests() {
        console.log('🚀 NEXUS IDE - Simple Test Runner');
        console.log('============================================================');
        console.log(`📅 Started: ${new Date().toLocaleString()}`);
        console.log(`🌐 Testing: ${this.config.baseUrl}`);
        console.log('');

        // Basic connectivity tests
        await this.runTest('Server Health Check', () => this.testServerHealth());
        await this.runTest('Dashboard Access', () => this.testDashboard());
        await this.runTest('IDE Interface', () => this.testIDE());
        
        // API tests
        await this.runTest('API Endpoints', () => this.testAPI());
        await this.runTest('File Operations', () => this.testFileOperations());
        
        // Performance test
        await this.runTest('Response Performance', () => this.testPerformance());

        // Generate report
        await this.generateReport();
        
        console.log('');
        console.log('============================================================');
        console.log('🎯 TEST EXECUTION SUMMARY');
        console.log('============================================================');
        console.log(`📊 Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        console.log(`🧪 Total Tests: ${this.results.total}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        
        if (this.results.errors.length > 0) {
            console.log('');
            console.log('🚨 FAILED TESTS:');
            this.results.errors.forEach(error => {
                console.log(`   ❌ ${error.test}: ${error.error}`);
            });
        }
        
        console.log('============================================================');
        
        return this.results.failed === 0 ? 0 : 1;
    }

    async generateReport() {
        const reportDir = path.join(__dirname, 'test-suite', 'reports');
        await fs.mkdir(reportDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportFile = path.join(reportDir, `simple-test-report-${timestamp}.json`);
        
        const report = {
            timestamp: new Date().toISOString(),
            config: this.config,
            results: this.results,
            summary: {
                successRate: (this.results.passed / this.results.total) * 100,
                duration: Date.now()
            }
        };
        
        await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
        console.log(`📋 Report saved: ${reportFile}`);
    }
}

// Run tests if called directly
if (require.main === module) {
    const runner = new SimpleTestRunner();
    runner.runAllTests()
        .then(exitCode => {
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('💥 Fatal error:', error.message);
            process.exit(1);
        });
}

module.exports = SimpleTestRunner;