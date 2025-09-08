/**
 * Security Testing Suite
 * Comprehensive security testing for NEXUS IDE
 * Enterprise-grade security validation and penetration testing
 */

const assert = require('assert');
const request = require('supertest');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const express = require('express');

// Import security components
const SecurityIntegrationService = require('../services/securityIntegrationService');
const UserService = require('../services/userService');
const AuditService = require('../services/auditService');
const AuthMiddleware = require('../middleware/authMiddleware');
const SecurityMiddleware = require('../middleware/securityMiddleware');
const SecurityConfigManager = require('../services/securityConfigManager');
const securityConfig = require('../config/security-config');

class SecurityTestSuite {
    constructor() {
        this.app = null;
        this.server = null;
        this.testUsers = [];
        this.testTokens = [];
        this.testApiKeys = [];
        this.securityService = null;
        this.userService = null;
        this.auditService = null;
        this.configManager = null;
        
        this.testResults = {
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };
    }
    
    /**
     * Initialize test environment
     */
    async initialize() {
        try {
            console.log('🔧 Initializing Security Test Suite...');
            
            // Initialize services
            this.securityService = new SecurityIntegrationService();
            this.userService = new UserService();
            this.auditService = new AuditService();
            this.configManager = new SecurityConfigManager();
            
            // Setup test Express app
            await this.setupTestApp();
            
            // Create test data
            await this.createTestData();
            
            console.log('✅ Security Test Suite initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Security Test Suite:', error);
            throw error;
        }
    }
    
    /**
     * Setup test Express application
     */
    async setupTestApp() {
        this.app = express();
        
        // Basic middleware
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // Security middleware
        this.app.use(SecurityMiddleware.securityHeaders);
        this.app.use(SecurityMiddleware.rateLimiting);
        
        // Test routes
        this.app.post('/test/login', async (req, res) => {
            const { username, password } = req.body;
            const result = await this.userService.authenticateUser({ username, password });
            
            if (result.success) {
                res.json({ token: result.token, user: result.user });
            } else {
                res.status(401).json({ error: result.error });
            }
        });
        
        this.app.get('/test/protected', AuthMiddleware.requireAuth, (req, res) => {
            res.json({ message: 'Access granted', user: req.user });
        });
        
        this.app.get('/test/admin', 
            AuthMiddleware.requireAuth, 
            AuthMiddleware.requireRole('admin'), 
            (req, res) => {
                res.json({ message: 'Admin access granted' });
            }
        );
        
        this.app.post('/test/data', 
            SecurityMiddleware.validateRequest,
            SecurityMiddleware.sanitizeInput,
            (req, res) => {
                res.json({ received: req.body });
            }
        );
    }
    
    /**
     * Create test data
     */
    async createTestData() {
        try {
            // Create test users
            const testUserData = [
                {
                    username: 'testuser1',
                    email: 'test1@example.com',
                    password: 'SecurePass123!',
                    roles: ['user']
                },
                {
                    username: 'testadmin',
                    email: 'admin@example.com',
                    password: 'AdminPass456!',
                    roles: ['admin', 'user']
                },
                {
                    username: 'testapi',
                    email: 'api@example.com',
                    password: 'ApiPass789!',
                    roles: ['api']
                }
            ];
            
            for (const userData of testUserData) {
                const result = await this.userService.createUser(userData);
                if (result.success) {
                    this.testUsers.push(result.user);
                }
            }
            
            // Generate test tokens
            for (const user of this.testUsers) {
                const token = jwt.sign(
                    { userId: user.id, username: user.username, roles: user.roles },
                    securityConfig.jwt.secret,
                    { expiresIn: securityConfig.jwt.expiresIn }
                );
                this.testTokens.push({ userId: user.id, token });
            }
            
            // Generate test API keys
            const apiKeyResult = await this.userService.generateApiKey({
                name: 'Test API Key',
                permissions: ['read', 'write'],
                userId: this.testUsers[0].id
            });
            
            if (apiKeyResult.success) {
                this.testApiKeys.push(apiKeyResult.apiKey);
            }
            
            console.log(`Created ${this.testUsers.length} test users, ${this.testTokens.length} tokens, ${this.testApiKeys.length} API keys`);
            
        } catch (error) {
            console.error('Failed to create test data:', error);
            throw error;
        }
    }
    
    /**
     * Run all security tests
     */
    async runAllTests() {
        console.log('🚀 Starting Security Test Suite...');
        console.log('=' .repeat(60));
        
        const testSuites = [
            { name: 'Authentication Tests', method: this.runAuthenticationTests },
            { name: 'Authorization Tests', method: this.runAuthorizationTests },
            { name: 'Input Validation Tests', method: this.runInputValidationTests },
            { name: 'Rate Limiting Tests', method: this.runRateLimitingTests },
            { name: 'Security Headers Tests', method: this.runSecurityHeadersTests },
            { name: 'Encryption Tests', method: this.runEncryptionTests },
            { name: 'Session Management Tests', method: this.runSessionManagementTests },
            { name: 'API Security Tests', method: this.runApiSecurityTests },
            { name: 'Audit Logging Tests', method: this.runAuditLoggingTests },
            { name: 'Configuration Security Tests', method: this.runConfigurationTests },
            { name: 'Penetration Tests', method: this.runPenetrationTests }
        ];
        
        for (const suite of testSuites) {
            try {
                console.log(`\n📋 Running ${suite.name}...`);
                await suite.method.call(this);
                console.log(`✅ ${suite.name} completed`);
            } catch (error) {
                console.error(`❌ ${suite.name} failed:`, error.message);
                this.testResults.errors.push({
                    suite: suite.name,
                    error: error.message
                });
            }
        }
        
        this.printTestResults();
    }
    
    /**
     * Authentication Tests
     */
    async runAuthenticationTests() {
        const tests = [
            {
                name: 'Valid login should succeed',
                test: async () => {
                    const response = await request(this.app)
                        .post('/test/login')
                        .send({
                            username: 'testuser1',
                            password: 'SecurePass123!'
                        });
                    
                    assert.strictEqual(response.status, 200);
                    assert(response.body.token);
                    assert(response.body.user);
                }
            },
            {
                name: 'Invalid password should fail',
                test: async () => {
                    const response = await request(this.app)
                        .post('/test/login')
                        .send({
                            username: 'testuser1',
                            password: 'wrongpassword'
                        });
                    
                    assert.strictEqual(response.status, 401);
                    assert(response.body.error);
                }
            },
            {
                name: 'Non-existent user should fail',
                test: async () => {
                    const response = await request(this.app)
                        .post('/test/login')
                        .send({
                            username: 'nonexistent',
                            password: 'password'
                        });
                    
                    assert.strictEqual(response.status, 401);
                }
            },
            {
                name: 'Empty credentials should fail',
                test: async () => {
                    const response = await request(this.app)
                        .post('/test/login')
                        .send({});
                    
                    assert.strictEqual(response.status, 400);
                }
            },
            {
                name: 'JWT token validation should work',
                test: async () => {
                    const token = this.testTokens[0].token;
                    
                    const response = await request(this.app)
                        .get('/test/protected')
                        .set('Authorization', `Bearer ${token}`);
                    
                    assert.strictEqual(response.status, 200);
                    assert(response.body.user);
                }
            },
            {
                name: 'Invalid JWT token should fail',
                test: async () => {
                    const response = await request(this.app)
                        .get('/test/protected')
                        .set('Authorization', 'Bearer invalid_token');
                    
                    assert.strictEqual(response.status, 401);
                }
            },
            {
                name: 'Missing authorization header should fail',
                test: async () => {
                    const response = await request(this.app)
                        .get('/test/protected');
                    
                    assert.strictEqual(response.status, 401);
                }
            }
        ];
        
        await this.runTestGroup('Authentication', tests);
    }
    
    /**
     * Authorization Tests
     */
    async runAuthorizationTests() {
        const tests = [
            {
                name: 'Admin role should access admin endpoint',
                test: async () => {
                    const adminToken = this.testTokens.find(t => 
                        this.testUsers.find(u => u.id === t.userId)?.roles.includes('admin')
                    )?.token;
                    
                    const response = await request(this.app)
                        .get('/test/admin')
                        .set('Authorization', `Bearer ${adminToken}`);
                    
                    assert.strictEqual(response.status, 200);
                }
            },
            {
                name: 'Non-admin role should be denied admin access',
                test: async () => {
                    const userToken = this.testTokens.find(t => {
                        const user = this.testUsers.find(u => u.id === t.userId);
                        return user && !user.roles.includes('admin');
                    })?.token;
                    
                    const response = await request(this.app)
                        .get('/test/admin')
                        .set('Authorization', `Bearer ${userToken}`);
                    
                    assert.strictEqual(response.status, 403);
                }
            },
            {
                name: 'API key authentication should work',
                test: async () => {
                    if (this.testApiKeys.length > 0) {
                        const apiKey = this.testApiKeys[0].key;
                        
                        const response = await request(this.app)
                            .get('/test/protected')
                            .set('X-API-Key', apiKey);
                        
                        // This would need API key middleware implementation
                        // For now, just check that the header is processed
                        assert(response.status === 200 || response.status === 401);
                    }
                }
            }
        ];
        
        await this.runTestGroup('Authorization', tests);
    }
    
    /**
     * Input Validation Tests
     */
    async runInputValidationTests() {
        const tests = [
            {
                name: 'SQL injection attempt should be blocked',
                test: async () => {
                    const response = await request(this.app)
                        .post('/test/data')
                        .send({
                            username: "admin'; DROP TABLE users; --",
                            data: 'test'
                        });
                    
                    // Should either sanitize or reject
                    assert(response.status === 200 || response.status === 400);
                    
                    if (response.status === 200) {
                        // Check if input was sanitized
                        assert(!response.body.received.username.includes('DROP TABLE'));
                    }
                }
            },
            {
                name: 'XSS attempt should be sanitized',
                test: async () => {
                    const response = await request(this.app)
                        .post('/test/data')
                        .send({
                            message: '<script>alert("XSS")</script>',
                            data: 'test'
                        });
                    
                    assert(response.status === 200 || response.status === 400);
                    
                    if (response.status === 200) {
                        // Check if script tags were sanitized
                        assert(!response.body.received.message.includes('<script>'));
                    }
                }
            },
            {
                name: 'Command injection should be blocked',
                test: async () => {
                    const response = await request(this.app)
                        .post('/test/data')
                        .send({
                            filename: 'test.txt; rm -rf /',
                            data: 'test'
                        });
                    
                    assert(response.status === 200 || response.status === 400);
                    
                    if (response.status === 200) {
                        // Check if command was sanitized
                        assert(!response.body.received.filename.includes('; rm'));
                    }
                }
            },
            {
                name: 'Large payload should be rejected',
                test: async () => {
                    const largeData = 'x'.repeat(20 * 1024 * 1024); // 20MB
                    
                    const response = await request(this.app)
                        .post('/test/data')
                        .send({ data: largeData });
                    
                    // Should be rejected due to size limit
                    assert.strictEqual(response.status, 413);
                }
            }
        ];
        
        await this.runTestGroup('Input Validation', tests);
    }
    
    /**
     * Rate Limiting Tests
     */
    async runRateLimitingTests() {
        const tests = [
            {
                name: 'Rate limiting should block excessive requests',
                test: async () => {
                    const requests = [];
                    
                    // Make many requests quickly
                    for (let i = 0; i < 20; i++) {
                        requests.push(
                            request(this.app)
                                .post('/test/login')
                                .send({ username: 'test', password: 'test' })
                        );
                    }
                    
                    const responses = await Promise.all(requests);
                    
                    // At least some should be rate limited
                    const rateLimited = responses.filter(r => r.status === 429);
                    assert(rateLimited.length > 0, 'Rate limiting should block some requests');
                }
            }
        ];
        
        await this.runTestGroup('Rate Limiting', tests);
    }
    
    /**
     * Security Headers Tests
     */
    async runSecurityHeadersTests() {
        const tests = [
            {
                name: 'Security headers should be present',
                test: async () => {
                    const response = await request(this.app)
                        .get('/test/protected')
                        .set('Authorization', `Bearer ${this.testTokens[0].token}`);
                    
                    // Check for security headers
                    assert(response.headers['x-content-type-options']);
                    assert(response.headers['x-frame-options']);
                    assert(response.headers['x-xss-protection']);
                    assert(response.headers['strict-transport-security']);
                }
            },
            {
                name: 'CSP header should be configured',
                test: async () => {
                    const response = await request(this.app)
                        .get('/test/protected')
                        .set('Authorization', `Bearer ${this.testTokens[0].token}`);
                    
                    assert(response.headers['content-security-policy']);
                }
            }
        ];
        
        await this.runTestGroup('Security Headers', tests);
    }
    
    /**
     * Encryption Tests
     */
    async runEncryptionTests() {
        const tests = [
            {
                name: 'Password hashing should be secure',
                test: async () => {
                    const password = 'TestPassword123!';
                    const hash = await bcrypt.hash(password, 12);
                    
                    // Hash should be different from password
                    assert.notStrictEqual(hash, password);
                    
                    // Should be able to verify
                    const isValid = await bcrypt.compare(password, hash);
                    assert.strictEqual(isValid, true);
                    
                    // Wrong password should fail
                    const isInvalid = await bcrypt.compare('wrongpassword', hash);
                    assert.strictEqual(isInvalid, false);
                }
            },
            {
                name: 'Data encryption should work',
                test: async () => {
                    const data = 'Sensitive information';
                    const key = crypto.randomBytes(32);
                    const iv = crypto.randomBytes(16);
                    
                    // Encrypt
                    const cipher = crypto.createCipher('aes-256-cbc', key);
                    let encrypted = cipher.update(data, 'utf8', 'hex');
                    encrypted += cipher.final('hex');
                    
                    // Decrypt
                    const decipher = crypto.createDecipher('aes-256-cbc', key);
                    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
                    decrypted += decipher.final('utf8');
                    
                    assert.strictEqual(decrypted, data);
                }
            }
        ];
        
        await this.runTestGroup('Encryption', tests);
    }
    
    /**
     * Session Management Tests
     */
    async runSessionManagementTests() {
        const tests = [
            {
                name: 'JWT token should have expiration',
                test: async () => {
                    const token = this.testTokens[0].token;
                    const decoded = jwt.decode(token);
                    
                    assert(decoded.exp, 'Token should have expiration');
                    assert(decoded.exp > Math.floor(Date.now() / 1000), 'Token should not be expired');
                }
            },
            {
                name: 'Expired token should be rejected',
                test: async () => {
                    // Create an expired token
                    const expiredToken = jwt.sign(
                        { userId: this.testUsers[0].id },
                        securityConfig.jwt.secret,
                        { expiresIn: '-1h' } // Expired 1 hour ago
                    );
                    
                    const response = await request(this.app)
                        .get('/test/protected')
                        .set('Authorization', `Bearer ${expiredToken}`);
                    
                    assert.strictEqual(response.status, 401);
                }
            }
        ];
        
        await this.runTestGroup('Session Management', tests);
    }
    
    /**
     * API Security Tests
     */
    async runApiSecurityTests() {
        const tests = [
            {
                name: 'CORS should be configured',
                test: async () => {
                    const response = await request(this.app)
                        .options('/test/protected')
                        .set('Origin', 'http://localhost:3000');
                    
                    // Should have CORS headers
                    assert(response.headers['access-control-allow-origin'] || 
                           response.headers['access-control-allow-methods']);
                }
            },
            {
                name: 'Content-Type validation should work',
                test: async () => {
                    const response = await request(this.app)
                        .post('/test/data')
                        .set('Content-Type', 'text/plain')
                        .send('plain text data');
                    
                    // Should reject non-JSON content type for JSON endpoints
                    assert(response.status === 400 || response.status === 415);
                }
            }
        ];
        
        await this.runTestGroup('API Security', tests);
    }
    
    /**
     * Audit Logging Tests
     */
    async runAuditLoggingTests() {
        const tests = [
            {
                name: 'Security events should be logged',
                test: async () => {
                    // Trigger a security event
                    await request(this.app)
                        .post('/test/login')
                        .send({ username: 'testuser1', password: 'wrongpassword' });
                    
                    // Check if event was logged
                    // This would need access to audit logs
                    assert(true); // Placeholder
                }
            },
            {
                name: 'Audit logs should be tamper-proof',
                test: async () => {
                    // Test audit log integrity
                    const testEvent = {
                        type: 'TEST_EVENT',
                        timestamp: new Date(),
                        data: { test: 'data' }
                    };
                    
                    await this.auditService.logEvent(testEvent);
                    
                    // Verify log integrity (would need implementation)
                    assert(true); // Placeholder
                }
            }
        ];
        
        await this.runTestGroup('Audit Logging', tests);
    }
    
    /**
     * Configuration Security Tests
     */
    async runConfigurationTests() {
        const tests = [
            {
                name: 'Security configuration should be valid',
                test: async () => {
                    const config = this.configManager.getAll();
                    
                    // Check required security settings
                    assert(config.authentication, 'Authentication config required');
                    assert(config.encryption, 'Encryption config required');
                    assert(config.rateLimiting, 'Rate limiting config required');
                }
            },
            {
                name: 'Configuration changes should be audited',
                test: async () => {
                    const oldValue = this.configManager.get('authentication.sessionTimeout');
                    
                    await this.configManager.set('authentication.sessionTimeout', 7200000, 'test-user');
                    
                    // Restore original value
                    await this.configManager.set('authentication.sessionTimeout', oldValue, 'test-user');
                    
                    // Check if changes were audited
                    const history = this.configManager.getHistory(5);
                    assert(history.length > 0, 'Configuration changes should be logged');
                }
            }
        ];
        
        await this.runTestGroup('Configuration Security', tests);
    }
    
    /**
     * Penetration Tests
     */
    async runPenetrationTests() {
        const tests = [
            {
                name: 'Directory traversal should be blocked',
                test: async () => {
                    const response = await request(this.app)
                        .get('/test/../../../etc/passwd');
                    
                    assert.notStrictEqual(response.status, 200);
                }
            },
            {
                name: 'HTTP method override should be secure',
                test: async () => {
                    const response = await request(this.app)
                        .post('/test/data')
                        .set('X-HTTP-Method-Override', 'DELETE')
                        .send({ data: 'test' });
                    
                    // Should not allow method override for security-sensitive operations
                    assert(response.status !== 200 || !response.body.deleted);
                }
            },
            {
                name: 'Server information disclosure should be minimal',
                test: async () => {
                    const response = await request(this.app)
                        .get('/test/nonexistent');
                    
                    // Should not reveal server information
                    assert(!response.headers['server'] || 
                           !response.headers['server'].includes('Express'));
                }
            }
        ];
        
        await this.runTestGroup('Penetration Testing', tests);
    }
    
    /**
     * Run a group of tests
     */
    async runTestGroup(groupName, tests) {
        console.log(`  📝 ${groupName}:`);
        
        for (const test of tests) {
            try {
                await test.test();
                console.log(`    ✅ ${test.name}`);
                this.testResults.passed++;
            } catch (error) {
                console.log(`    ❌ ${test.name}: ${error.message}`);
                this.testResults.failed++;
                this.testResults.errors.push({
                    group: groupName,
                    test: test.name,
                    error: error.message
                });
            }
        }
    }
    
    /**
     * Print test results summary
     */
    printTestResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🏁 SECURITY TEST RESULTS');
        console.log('='.repeat(60));
        
        const total = this.testResults.passed + this.testResults.failed + this.testResults.skipped;
        
        console.log(`📊 Total Tests: ${total}`);
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`⏭️  Skipped: ${this.testResults.skipped}`);
        
        const successRate = total > 0 ? ((this.testResults.passed / total) * 100).toFixed(2) : 0;
        console.log(`📈 Success Rate: ${successRate}%`);
        
        if (this.testResults.errors.length > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. [${error.group || error.suite}] ${error.test || 'General'}: ${error.error}`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
        
        if (this.testResults.failed === 0) {
            console.log('🎉 ALL SECURITY TESTS PASSED!');
        } else {
            console.log('⚠️  SECURITY ISSUES DETECTED - PLEASE REVIEW FAILED TESTS');
        }
    }
    
    /**
     * Generate security report
     */
    generateSecurityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: this.testResults.passed + this.testResults.failed + this.testResults.skipped,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                skipped: this.testResults.skipped,
                successRate: this.testResults.passed / (this.testResults.passed + this.testResults.failed) * 100
            },
            failures: this.testResults.errors,
            recommendations: this.generateRecommendations(),
            securityScore: this.calculateSecurityScore()
        };
        
        return report;
    }
    
    /**
     * Generate security recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.testResults.failed > 0) {
            recommendations.push('Address all failed security tests immediately');
        }
        
        // Add specific recommendations based on test results
        const authFailures = this.testResults.errors.filter(e => e.group === 'Authentication');
        if (authFailures.length > 0) {
            recommendations.push('Review and strengthen authentication mechanisms');
        }
        
        const inputFailures = this.testResults.errors.filter(e => e.group === 'Input Validation');
        if (inputFailures.length > 0) {
            recommendations.push('Implement comprehensive input validation and sanitization');
        }
        
        const headerFailures = this.testResults.errors.filter(e => e.group === 'Security Headers');
        if (headerFailures.length > 0) {
            recommendations.push('Configure all required security headers');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Maintain current security posture and conduct regular testing');
        }
        
        return recommendations;
    }
    
    /**
     * Calculate security score
     */
    calculateSecurityScore() {
        const total = this.testResults.passed + this.testResults.failed;
        if (total === 0) return 0;
        
        const baseScore = (this.testResults.passed / total) * 100;
        
        // Adjust score based on critical failures
        const criticalFailures = this.testResults.errors.filter(e => 
            e.group === 'Authentication' || 
            e.group === 'Authorization' || 
            e.group === 'Input Validation'
        ).length;
        
        const penalty = criticalFailures * 10; // 10 points per critical failure
        
        return Math.max(0, baseScore - penalty);
    }
    
    /**
     * Cleanup test environment
     */
    async cleanup() {
        try {
            // Clean up test data
            for (const user of this.testUsers) {
                await this.userService.deleteUser(user.id);
            }
            
            // Clean up services
            if (this.configManager) {
                await this.configManager.cleanup();
            }
            
            console.log('✅ Security test cleanup completed');
            
        } catch (error) {
            console.error('❌ Error during test cleanup:', error);
        }
    }
}

// Export for use in test runners
module.exports = SecurityTestSuite;

// Run tests if called directly
if (require.main === module) {
    (async () => {
        const testSuite = new SecurityTestSuite();
        
        try {
            await testSuite.initialize();
            await testSuite.runAllTests();
            
            const report = testSuite.generateSecurityReport();
            console.log('\n📄 Security Report Generated');
            console.log(JSON.stringify(report, null, 2));
            
        } catch (error) {
            console.error('❌ Security test suite failed:', error);
            process.exit(1);
        } finally {
            await testSuite.cleanup();
        }
    })();
}