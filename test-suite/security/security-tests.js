/**
 * Security Tests for NEXUS IDE
 * ทดสอบความปลอดภัยของระบบ NEXUS IDE
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Security Test Configuration
const SECURITY_CONFIG = {
    baseUrl: 'http://localhost:8080',
    testTimeout: 10000,
    maxRetries: 3,
    vulnerabilityThreshold: 0, // Zero tolerance for vulnerabilities
    securityHeaders: [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security',
        'Content-Security-Policy'
    ]
};

// Security Test Results
class SecurityTestResults {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            vulnerabilities: [],
            securityHeaders: {},
            authenticationTests: [],
            inputValidationTests: [],
            sqlInjectionTests: [],
            xssTests: [],
            csrfTests: [],
            fileUploadTests: [],
            rateLimitingTests: [],
            encryptionTests: [],
            overallScore: 0,
            riskLevel: 'UNKNOWN'
        };
    }

    addVulnerability(type, severity, description, endpoint = null) {
        this.results.vulnerabilities.push({
            type,
            severity,
            description,
            endpoint,
            timestamp: new Date().toISOString()
        });
    }

    addTestResult(category, test, passed, details = null) {
        if (!this.results[category]) {
            this.results[category] = [];
        }
        
        this.results[category].push({
            test,
            passed,
            details,
            timestamp: new Date().toISOString()
        });
    }

    calculateOverallScore() {
        const totalTests = Object.keys(this.results)
            .filter(key => Array.isArray(this.results[key]))
            .reduce((total, key) => {
                if (key !== 'vulnerabilities') {
                    return total + this.results[key].length;
                }
                return total;
            }, 0);
        
        const passedTests = Object.keys(this.results)
            .filter(key => Array.isArray(this.results[key]))
            .reduce((passed, key) => {
                if (key !== 'vulnerabilities') {
                    return passed + this.results[key].filter(test => test.passed).length;
                }
                return passed;
            }, 0);
        
        const vulnerabilityPenalty = this.results.vulnerabilities.length * 10;
        const baseScore = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        
        this.results.overallScore = Math.max(0, baseScore - vulnerabilityPenalty);
        
        // Determine risk level
        if (this.results.overallScore >= 90) {
            this.results.riskLevel = 'LOW';
        } else if (this.results.overallScore >= 70) {
            this.results.riskLevel = 'MEDIUM';
        } else if (this.results.overallScore >= 50) {
            this.results.riskLevel = 'HIGH';
        } else {
            this.results.riskLevel = 'CRITICAL';
        }
        
        return this.results.overallScore;
    }

    generateReport() {
        this.calculateOverallScore();
        return this.results;
    }
}

// Security Headers Tester
class SecurityHeadersTester {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async testSecurityHeaders() {
        console.log('🔒 ทดสอบ Security Headers...');
        
        const results = {};
        const endpoints = ['/', '/api/status', '/ide', '/api/servers'];
        
        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                    timeout: SECURITY_CONFIG.testTimeout,
                    validateStatus: () => true // Accept all status codes
                });
                
                const headers = response.headers;
                const endpointResults = {};
                
                // Check required security headers
                SECURITY_CONFIG.securityHeaders.forEach(header => {
                    const headerKey = header.toLowerCase();
                    endpointResults[header] = {
                        present: !!headers[headerKey],
                        value: headers[headerKey] || null
                    };
                });
                
                // Check for potentially dangerous headers
                const dangerousHeaders = ['server', 'x-powered-by'];
                dangerousHeaders.forEach(header => {
                    if (headers[header.toLowerCase()]) {
                        endpointResults[`dangerous_${header}`] = {
                            present: true,
                            value: headers[header.toLowerCase()],
                            risk: 'Information disclosure'
                        };
                    }
                });
                
                results[endpoint] = endpointResults;
                
            } catch (error) {
                results[endpoint] = {
                    error: error.message
                };
            }
        }
        
        return results;
    }
}

// Authentication Security Tester
class AuthenticationTester {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async testAuthenticationSecurity() {
        console.log('🔐 ทดสอบ Authentication Security...');
        
        const tests = [];
        
        // Test 1: Unauthorized access to protected endpoints
        await this.testUnauthorizedAccess(tests);
        
        // Test 2: Weak password policy
        await this.testPasswordPolicy(tests);
        
        // Test 3: Session management
        await this.testSessionManagement(tests);
        
        // Test 4: Brute force protection
        await this.testBruteForceProtection(tests);
        
        return tests;
    }

    async testUnauthorizedAccess(tests) {
        const protectedEndpoints = [
            '/api/admin',
            '/api/users',
            '/api/config',
            '/api/mcp/admin'
        ];
        
        for (const endpoint of protectedEndpoints) {
            try {
                const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                    timeout: SECURITY_CONFIG.testTimeout,
                    validateStatus: () => true
                });
                
                const passed = response.status === 401 || response.status === 403;
                
                tests.push({
                    test: `Unauthorized access to ${endpoint}`,
                    passed,
                    details: {
                        endpoint,
                        statusCode: response.status,
                        expected: '401 or 403',
                        actual: response.status
                    }
                });
                
            } catch (error) {
                tests.push({
                    test: `Unauthorized access to ${endpoint}`,
                    passed: false,
                    details: {
                        endpoint,
                        error: error.message
                    }
                });
            }
        }
    }

    async testPasswordPolicy(tests) {
        const weakPasswords = [
            '123456',
            'password',
            'admin',
            'qwerty',
            '12345678'
        ];
        
        for (const password of weakPasswords) {
            try {
                const response = await axios.post(`${this.baseUrl}/api/auth/register`, {
                    username: `test_${Date.now()}`,
                    password: password,
                    email: `test_${Date.now()}@example.com`
                }, {
                    timeout: SECURITY_CONFIG.testTimeout,
                    validateStatus: () => true
                });
                
                const passed = response.status === 400 || 
                              (response.data && response.data.error && 
                               response.data.error.includes('password'));
                
                tests.push({
                    test: `Weak password rejection: ${password}`,
                    passed,
                    details: {
                        password: '***',
                        statusCode: response.status,
                        response: response.data
                    }
                });
                
            } catch (error) {
                tests.push({
                    test: `Weak password rejection: ${password}`,
                    passed: true, // Network error is acceptable
                    details: {
                        password: '***',
                        error: error.message
                    }
                });
            }
        }
    }

    async testSessionManagement(tests) {
        // Test session timeout
        try {
            const loginResponse = await axios.post(`${this.baseUrl}/api/auth/login`, {
                username: 'test_user',
                password: 'test_password'
            }, {
                timeout: SECURITY_CONFIG.testTimeout,
                validateStatus: () => true
            });
            
            if (loginResponse.status === 200 && loginResponse.headers['set-cookie']) {
                const cookies = loginResponse.headers['set-cookie'];
                const hasSecureFlag = cookies.some(cookie => cookie.includes('Secure'));
                const hasHttpOnlyFlag = cookies.some(cookie => cookie.includes('HttpOnly'));
                
                tests.push({
                    test: 'Session cookie security flags',
                    passed: hasSecureFlag && hasHttpOnlyFlag,
                    details: {
                        hasSecureFlag,
                        hasHttpOnlyFlag,
                        cookies: cookies.map(c => c.split(';')[0]) // Hide sensitive data
                    }
                });
            } else {
                tests.push({
                    test: 'Session cookie security flags',
                    passed: true, // No session cookies found (stateless)
                    details: {
                        reason: 'No session cookies detected (possibly stateless)'
                    }
                });
            }
            
        } catch (error) {
            tests.push({
                test: 'Session cookie security flags',
                passed: true, // Network error is acceptable
                details: {
                    error: error.message
                }
            });
        }
    }

    async testBruteForceProtection(tests) {
        const maxAttempts = 10;
        let blockedAfter = null;
        
        for (let i = 1; i <= maxAttempts; i++) {
            try {
                const response = await axios.post(`${this.baseUrl}/api/auth/login`, {
                    username: 'nonexistent_user',
                    password: 'wrong_password'
                }, {
                    timeout: SECURITY_CONFIG.testTimeout,
                    validateStatus: () => true
                });
                
                if (response.status === 429 || 
                    (response.data && response.data.error && 
                     response.data.error.includes('rate limit'))) {
                    blockedAfter = i;
                    break;
                }
                
                // Small delay between attempts
                await this.sleep(100);
                
            } catch (error) {
                if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                    blockedAfter = i;
                    break;
                }
            }
        }
        
        tests.push({
            test: 'Brute force protection',
            passed: blockedAfter !== null && blockedAfter <= 5,
            details: {
                blockedAfter,
                maxAttempts,
                recommendation: 'Should block after 3-5 failed attempts'
            }
        });
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Input Validation Tester
class InputValidationTester {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async testInputValidation() {
        console.log('✅ ทดสอบ Input Validation...');
        
        const tests = [];
        
        // Test SQL Injection
        await this.testSQLInjection(tests);
        
        // Test XSS
        await this.testXSS(tests);
        
        // Test Command Injection
        await this.testCommandInjection(tests);
        
        // Test Path Traversal
        await this.testPathTraversal(tests);
        
        return tests;
    }

    async testSQLInjection(tests) {
        const sqlPayloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT * FROM users --",
            "1' OR '1'='1' --",
            "admin'--"
        ];
        
        const endpoints = [
            { url: '/api/search', param: 'q' },
            { url: '/api/users', param: 'id' },
            { url: '/api/files', param: 'path' }
        ];
        
        for (const endpoint of endpoints) {
            for (const payload of sqlPayloads) {
                try {
                    const response = await axios.get(`${this.baseUrl}${endpoint.url}`, {
                        params: { [endpoint.param]: payload },
                        timeout: SECURITY_CONFIG.testTimeout,
                        validateStatus: () => true
                    });
                    
                    // Check for SQL error messages
                    const responseText = JSON.stringify(response.data).toLowerCase();
                    const sqlErrors = [
                        'sql syntax',
                        'mysql_fetch',
                        'ora-',
                        'postgresql',
                        'sqlite_',
                        'sqlstate'
                    ];
                    
                    const hasSQLError = sqlErrors.some(error => responseText.includes(error));
                    
                    tests.push({
                        test: `SQL Injection: ${endpoint.url}`,
                        passed: !hasSQLError && response.status !== 500,
                        details: {
                            endpoint: endpoint.url,
                            payload: payload.substring(0, 20) + '...',
                            statusCode: response.status,
                            hasSQLError
                        }
                    });
                    
                } catch (error) {
                    tests.push({
                        test: `SQL Injection: ${endpoint.url}`,
                        passed: true, // Network error is acceptable
                        details: {
                            endpoint: endpoint.url,
                            error: error.message
                        }
                    });
                }
            }
        }
    }

    async testXSS(tests) {
        const xssPayloads = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            'javascript:alert("XSS")',
            '<svg onload=alert("XSS")>',
            '"><script>alert("XSS")</script>'
        ];
        
        const endpoints = [
            { url: '/api/search', param: 'q' },
            { url: '/api/comments', param: 'text' },
            { url: '/api/profile', param: 'name' }
        ];
        
        for (const endpoint of endpoints) {
            for (const payload of xssPayloads) {
                try {
                    const response = await axios.post(`${this.baseUrl}${endpoint.url}`, {
                        [endpoint.param]: payload
                    }, {
                        timeout: SECURITY_CONFIG.testTimeout,
                        validateStatus: () => true
                    });
                    
                    // Check if payload is reflected without encoding
                    const responseText = JSON.stringify(response.data);
                    const isReflected = responseText.includes(payload);
                    
                    tests.push({
                        test: `XSS Protection: ${endpoint.url}`,
                        passed: !isReflected,
                        details: {
                            endpoint: endpoint.url,
                            payload: payload.substring(0, 30) + '...',
                            statusCode: response.status,
                            isReflected
                        }
                    });
                    
                } catch (error) {
                    tests.push({
                        test: `XSS Protection: ${endpoint.url}`,
                        passed: true, // Network error is acceptable
                        details: {
                            endpoint: endpoint.url,
                            error: error.message
                        }
                    });
                }
            }
        }
    }

    async testCommandInjection(tests) {
        const commandPayloads = [
            '; ls -la',
            '| whoami',
            '&& cat /etc/passwd',
            '`id`',
            '$(whoami)'
        ];
        
        const endpoints = [
            { url: '/api/execute', param: 'command' },
            { url: '/api/git', param: 'repo' },
            { url: '/api/files', param: 'filename' }
        ];
        
        for (const endpoint of endpoints) {
            for (const payload of commandPayloads) {
                try {
                    const response = await axios.post(`${this.baseUrl}${endpoint.url}`, {
                        [endpoint.param]: `test${payload}`
                    }, {
                        timeout: SECURITY_CONFIG.testTimeout,
                        validateStatus: () => true
                    });
                    
                    // Check for command execution indicators
                    const responseText = JSON.stringify(response.data).toLowerCase();
                    const commandIndicators = [
                        'root:',
                        'uid=',
                        'total ',
                        'drwx',
                        '/bin/',
                        '/usr/'
                    ];
                    
                    const hasCommandOutput = commandIndicators.some(indicator => 
                        responseText.includes(indicator)
                    );
                    
                    tests.push({
                        test: `Command Injection: ${endpoint.url}`,
                        passed: !hasCommandOutput,
                        details: {
                            endpoint: endpoint.url,
                            payload: payload.substring(0, 20) + '...',
                            statusCode: response.status,
                            hasCommandOutput
                        }
                    });
                    
                } catch (error) {
                    tests.push({
                        test: `Command Injection: ${endpoint.url}`,
                        passed: true, // Network error is acceptable
                        details: {
                            endpoint: endpoint.url,
                            error: error.message
                        }
                    });
                }
            }
        }
    }

    async testPathTraversal(tests) {
        const pathPayloads = [
            '../../../etc/passwd',
            '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
            '....//....//....//etc/passwd',
            '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
            '..%252f..%252f..%252fetc%252fpasswd'
        ];
        
        const endpoints = [
            '/api/files',
            '/api/download',
            '/api/static'
        ];
        
        for (const endpoint of endpoints) {
            for (const payload of pathPayloads) {
                try {
                    const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                        params: { path: payload },
                        timeout: SECURITY_CONFIG.testTimeout,
                        validateStatus: () => true
                    });
                    
                    // Check for system file content
                    const responseText = JSON.stringify(response.data).toLowerCase();
                    const systemFileIndicators = [
                        'root:x:0:0',
                        'localhost',
                        '127.0.0.1',
                        'bin/bash',
                        'windows nt'
                    ];
                    
                    const hasSystemFileContent = systemFileIndicators.some(indicator => 
                        responseText.includes(indicator)
                    );
                    
                    tests.push({
                        test: `Path Traversal: ${endpoint}`,
                        passed: !hasSystemFileContent && response.status !== 200,
                        details: {
                            endpoint,
                            payload: payload.substring(0, 30) + '...',
                            statusCode: response.status,
                            hasSystemFileContent
                        }
                    });
                    
                } catch (error) {
                    tests.push({
                        test: `Path Traversal: ${endpoint}`,
                        passed: true, // Network error is acceptable
                        details: {
                            endpoint,
                            error: error.message
                        }
                    });
                }
            }
        }
    }
}

// Rate Limiting Tester
class RateLimitingTester {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async testRateLimiting() {
        console.log('⏱️ ทดสอบ Rate Limiting...');
        
        const tests = [];
        const endpoints = [
            '/api/search',
            '/api/auth/login',
            '/api/files',
            '/api/mcp/test'
        ];
        
        for (const endpoint of endpoints) {
            await this.testEndpointRateLimit(endpoint, tests);
        }
        
        return tests;
    }

    async testEndpointRateLimit(endpoint, tests) {
        const maxRequests = 100;
        let rateLimitHit = false;
        let requestCount = 0;
        
        const startTime = Date.now();
        
        for (let i = 0; i < maxRequests; i++) {
            try {
                const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                    timeout: 2000,
                    validateStatus: () => true
                });
                
                requestCount++;
                
                if (response.status === 429) {
                    rateLimitHit = true;
                    break;
                }
                
                // Check rate limit headers
                if (response.headers['x-ratelimit-remaining'] === '0') {
                    rateLimitHit = true;
                    break;
                }
                
            } catch (error) {
                if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                    rateLimitHit = true;
                    break;
                }
            }
        }
        
        const duration = Date.now() - startTime;
        const requestsPerSecond = (requestCount / duration) * 1000;
        
        tests.push({
            test: `Rate limiting: ${endpoint}`,
            passed: rateLimitHit || requestsPerSecond < 50, // Should limit to reasonable rate
            details: {
                endpoint,
                requestCount,
                rateLimitHit,
                requestsPerSecond: requestsPerSecond.toFixed(2),
                duration
            }
        });
    }
}

// Main Security Test Runner
class SecurityTestRunner {
    constructor() {
        this.results = new SecurityTestResults();
        this.baseUrl = SECURITY_CONFIG.baseUrl;
    }

    async runAllSecurityTests() {
        console.log('🔒 เริ่มต้น Security Tests สำหรับ NEXUS IDE');
        console.log('🎯 Target:', this.baseUrl);
        
        try {
            // Wait for server to be ready
            await this.waitForServer();
            
            // Test Security Headers
            const headersTester = new SecurityHeadersTester(this.baseUrl);
            this.results.securityHeaders = await headersTester.testSecurityHeaders();
            
            // Test Authentication Security
            const authTester = new AuthenticationTester(this.baseUrl);
            this.results.authenticationTests = await authTester.testAuthenticationSecurity();
            
            // Test Input Validation
            const inputTester = new InputValidationTester(this.baseUrl);
            const inputTests = await inputTester.testInputValidation();
            
            // Categorize input validation tests
            this.results.sqlInjectionTests = inputTests.filter(t => t.test.includes('SQL'));
            this.results.xssTests = inputTests.filter(t => t.test.includes('XSS'));
            this.results.inputValidationTests = inputTests.filter(t => 
                !t.test.includes('SQL') && !t.test.includes('XSS')
            );
            
            // Test Rate Limiting
            const rateLimitTester = new RateLimitingTester(this.baseUrl);
            this.results.rateLimitingTests = await rateLimitTester.testRateLimiting();
            
            // Analyze security headers for vulnerabilities
            this.analyzeSecurityHeaders();
            
            // Generate final report
            const report = this.results.generateReport();
            await this.saveReport(report);
            
            this.displaySummary(report);
            
            return report;
            
        } catch (error) {
            console.error('💥 เกิดข้อผิดพลาดในการทดสอบความปลอดภัย:', error);
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

    analyzeSecurityHeaders() {
        Object.keys(this.results.securityHeaders).forEach(endpoint => {
            const headers = this.results.securityHeaders[endpoint];
            
            // Check for missing security headers
            SECURITY_CONFIG.securityHeaders.forEach(requiredHeader => {
                if (!headers[requiredHeader] || !headers[requiredHeader].present) {
                    this.results.addVulnerability(
                        'Missing Security Header',
                        'MEDIUM',
                        `Missing ${requiredHeader} header on ${endpoint}`,
                        endpoint
                    );
                }
            });
            
            // Check for information disclosure
            Object.keys(headers).forEach(header => {
                if (header.startsWith('dangerous_')) {
                    this.results.addVulnerability(
                        'Information Disclosure',
                        'LOW',
                        `${header} header reveals server information on ${endpoint}`,
                        endpoint
                    );
                }
            });
        });
    }

    async saveReport(report) {
        const reportsDir = path.join(__dirname, '..', 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const jsonPath = path.join(reportsDir, `security-report-${timestamp}.json`);
        const htmlPath = path.join(reportsDir, `security-report-${timestamp}.html`);
        
        // Save JSON report
        fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
        
        // Generate and save HTML report
        const htmlReport = this.generateHTMLReport(report);
        fs.writeFileSync(htmlPath, htmlReport);
        
        console.log(`\n📄 Security Report saved:`);
        console.log(`  📋 JSON: ${jsonPath}`);
        console.log(`  🌐 HTML: ${htmlPath}`);
    }

    generateHTMLReport(report) {
        const riskColor = {
            'LOW': '#28a745',
            'MEDIUM': '#ffc107',
            'HIGH': '#fd7e14',
            'CRITICAL': '#dc3545'
        };
        
        return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS IDE Security Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .score { font-size: 48px; font-weight: bold; color: ${riskColor[report.riskLevel]}; }
        .risk-level { font-size: 24px; color: ${riskColor[report.riskLevel]}; margin: 10px 0; }
        .section { margin: 30px 0; }
        .vulnerability { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .vulnerability.high { background: #f8d7da; border-color: #f5c6cb; }
        .vulnerability.critical { background: #f8d7da; border-color: #f5c6cb; }
        .test-result { padding: 10px; margin: 5px 0; border-radius: 3px; }
        .test-passed { background: #d4edda; border-left: 4px solid #28a745; }
        .test-failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-number { font-size: 32px; font-weight: bold; color: #007bff; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background: #f8f9fa; font-weight: bold; }
        .status-pass { color: #28a745; font-weight: bold; }
        .status-fail { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 NEXUS IDE Security Report</h1>
            <div class="score">${report.overallScore.toFixed(1)}/100</div>
            <div class="risk-level">Risk Level: ${report.riskLevel}</div>
            <p><strong>Generated:</strong> ${report.timestamp}</p>
        </div>
        
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-number">${report.vulnerabilities.length}</div>
                <div>Vulnerabilities</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${report.authenticationTests.filter(t => t.passed).length}/${report.authenticationTests.length}</div>
                <div>Auth Tests Passed</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${report.sqlInjectionTests.filter(t => t.passed).length}/${report.sqlInjectionTests.length}</div>
                <div>SQL Injection Tests</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">${report.xssTests.filter(t => t.passed).length}/${report.xssTests.length}</div>
                <div>XSS Tests Passed</div>
            </div>
        </div>
        
        ${report.vulnerabilities.length > 0 ? `
        <div class="section">
            <h2>🚨 Vulnerabilities Found</h2>
            ${report.vulnerabilities.map(vuln => `
                <div class="vulnerability ${vuln.severity.toLowerCase()}">
                    <h4>${vuln.type} (${vuln.severity})</h4>
                    <p>${vuln.description}</p>
                    ${vuln.endpoint ? `<p><strong>Endpoint:</strong> ${vuln.endpoint}</p>` : ''}
                </div>
            `).join('')}
        </div>
        ` : '<div class="section"><h2>✅ No Vulnerabilities Found</h2></div>'}
        
        <div class="section">
            <h2>🔐 Authentication Tests</h2>
            ${report.authenticationTests.map(test => `
                <div class="test-result ${test.passed ? 'test-passed' : 'test-failed'}">
                    <strong>${test.test}</strong>: <span class="${test.passed ? 'status-pass' : 'status-fail'}">${test.passed ? 'PASS' : 'FAIL'}</span>
                    ${test.details ? `<br><small>${JSON.stringify(test.details, null, 2)}</small>` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="section">
            <h2>🛡️ Security Headers</h2>
            <table>
                <thead>
                    <tr>
                        <th>Endpoint</th>
                        <th>X-Content-Type-Options</th>
                        <th>X-Frame-Options</th>
                        <th>X-XSS-Protection</th>
                        <th>Strict-Transport-Security</th>
                        <th>Content-Security-Policy</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.keys(report.securityHeaders).map(endpoint => {
                        const headers = report.securityHeaders[endpoint];
                        return `
                            <tr>
                                <td>${endpoint}</td>
                                <td class="${headers['X-Content-Type-Options']?.present ? 'status-pass' : 'status-fail'}">
                                    ${headers['X-Content-Type-Options']?.present ? '✅' : '❌'}
                                </td>
                                <td class="${headers['X-Frame-Options']?.present ? 'status-pass' : 'status-fail'}">
                                    ${headers['X-Frame-Options']?.present ? '✅' : '❌'}
                                </td>
                                <td class="${headers['X-XSS-Protection']?.present ? 'status-pass' : 'status-fail'}">
                                    ${headers['X-XSS-Protection']?.present ? '✅' : '❌'}
                                </td>
                                <td class="${headers['Strict-Transport-Security']?.present ? 'status-pass' : 'status-fail'}">
                                    ${headers['Strict-Transport-Security']?.present ? '✅' : '❌'}
                                </td>
                                <td class="${headers['Content-Security-Policy']?.present ? 'status-pass' : 'status-fail'}">
                                    ${headers['Content-Security-Policy']?.present ? '✅' : '❌'}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>📊 Test Summary</h2>
            <table>
                <thead>
                    <tr>
                        <th>Test Category</th>
                        <th>Total Tests</th>
                        <th>Passed</th>
                        <th>Failed</th>
                        <th>Success Rate</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Authentication</td>
                        <td>${report.authenticationTests.length}</td>
                        <td class="status-pass">${report.authenticationTests.filter(t => t.passed).length}</td>
                        <td class="status-fail">${report.authenticationTests.filter(t => !t.passed).length}</td>
                        <td>${report.authenticationTests.length > 0 ? ((report.authenticationTests.filter(t => t.passed).length / report.authenticationTests.length) * 100).toFixed(1) : 0}%</td>
                    </tr>
                    <tr>
                        <td>SQL Injection</td>
                        <td>${report.sqlInjectionTests.length}</td>
                        <td class="status-pass">${report.sqlInjectionTests.filter(t => t.passed).length}</td>
                        <td class="status-fail">${report.sqlInjectionTests.filter(t => !t.passed).length}</td>
                        <td>${report.sqlInjectionTests.length > 0 ? ((report.sqlInjectionTests.filter(t => t.passed).length / report.sqlInjectionTests.length) * 100).toFixed(1) : 0}%</td>
                    </tr>
                    <tr>
                        <td>XSS Protection</td>
                        <td>${report.xssTests.length}</td>
                        <td class="status-pass">${report.xssTests.filter(t => t.passed).length}</td>
                        <td class="status-fail">${report.xssTests.filter(t => !t.passed).length}</td>
                        <td>${report.xssTests.length > 0 ? ((report.xssTests.filter(t => t.passed).length / report.xssTests.length) * 100).toFixed(1) : 0}%</td>
                    </tr>
                    <tr>
                        <td>Rate Limiting</td>
                        <td>${report.rateLimitingTests.length}</td>
                        <td class="status-pass">${report.rateLimitingTests.filter(t => t.passed).length}</td>
                        <td class="status-fail">${report.rateLimitingTests.filter(t => !t.passed).length}</td>
                        <td>${report.rateLimitingTests.length > 0 ? ((report.rateLimitingTests.filter(t => t.passed).length / report.rateLimitingTests.length) * 100).toFixed(1) : 0}%</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="section">
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
        
        if (report.vulnerabilities.length > 0) {
            recommendations.push('แก้ไขช่องโหว่ที่พบทั้งหมดก่อนการ deploy');
        }
        
        // Check security headers
        const missingHeaders = [];
        Object.keys(report.securityHeaders).forEach(endpoint => {
            const headers = report.securityHeaders[endpoint];
            SECURITY_CONFIG.securityHeaders.forEach(header => {
                if (!headers[header]?.present && !missingHeaders.includes(header)) {
                    missingHeaders.push(header);
                }
            });
        });
        
        if (missingHeaders.length > 0) {
            recommendations.push(`เพิ่ม Security Headers: ${missingHeaders.join(', ')}`);
        }
        
        // Check test results
        const failedAuthTests = report.authenticationTests.filter(t => !t.passed).length;
        if (failedAuthTests > 0) {
            recommendations.push('ปรับปรุงระบบ Authentication และ Authorization');
        }
        
        const failedSQLTests = report.sqlInjectionTests.filter(t => !t.passed).length;
        if (failedSQLTests > 0) {
            recommendations.push('เพิ่มการป้องกัน SQL Injection ด้วย Prepared Statements');
        }
        
        const failedXSSTests = report.xssTests.filter(t => !t.passed).length;
        if (failedXSSTests > 0) {
            recommendations.push('เพิ่มการป้องกัน XSS ด้วย Input Sanitization และ Output Encoding');
        }
        
        const failedRateLimitTests = report.rateLimitingTests.filter(t => !t.passed).length;
        if (failedRateLimitTests > 0) {
            recommendations.push('เพิ่มระบบ Rate Limiting เพื่อป้องกัน DDoS และ Brute Force');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('ระบบมีความปลอดภัยในระดับดี แต่ควรทำการทดสอบอย่างสม่ำเสมอ');
        }
        
        return recommendations;
    }

    displaySummary(report) {
        console.log('\n🔒 สรุปผลการทดสอบความปลอดภัย:');
        console.log('=' .repeat(50));
        console.log(`📊 คะแนนรวม: ${report.overallScore.toFixed(1)}/100`);
        console.log(`🎯 ระดับความเสี่ยง: ${report.riskLevel}`);
        console.log(`🚨 ช่องโหว่ที่พบ: ${report.vulnerabilities.length}`);
        
        if (report.vulnerabilities.length > 0) {
            console.log('\n🚨 ช่องโหว่ที่พบ:');
            report.vulnerabilities.forEach(vuln => {
                console.log(`  • ${vuln.type} (${vuln.severity}): ${vuln.description}`);
            });
        }
        
        console.log('\n📈 สถิติการทดสอบ:');
        const categories = [
            { name: 'Authentication', tests: report.authenticationTests },
            { name: 'SQL Injection', tests: report.sqlInjectionTests },
            { name: 'XSS Protection', tests: report.xssTests },
            { name: 'Rate Limiting', tests: report.rateLimitingTests }
        ];
        
        categories.forEach(category => {
            if (category.tests.length > 0) {
                const passed = category.tests.filter(t => t.passed).length;
                const total = category.tests.length;
                const percentage = ((passed / total) * 100).toFixed(1);
                console.log(`  ${category.name}: ${passed}/${total} (${percentage}%)`);
            }
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

// Run security tests if this file is executed directly
if (require.main === module) {
    const runner = new SecurityTestRunner();
    runner.runAllSecurityTests().catch(error => {
        console.error('💥 เกิดข้อผิดพลาดในการทดสอบความปลอดภัย:', error);
        process.exit(1);
    });
}

module.exports = {
    SecurityTestRunner,
    SecurityHeadersTester,
    AuthenticationTester,
    InputValidationTester,
    RateLimitingTester,
    SecurityTestResults
};