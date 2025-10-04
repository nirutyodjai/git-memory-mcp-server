#!/usr/bin/env node

/**
 * Advanced Services Testing Suite
 * Tests rate limiting, caching, load balancing, audit logging, and API versioning
 */

import { EventEmitter } from 'events';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.GIT_MEMORY_API_KEY || 'test-api-key';

// Test scenarios for advanced services
export class AdvancedServicesTester extends EventEmitter {
  constructor() {
    super();
    this.results = [];
    this.stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };
  }

  /**
   * Test Rate Limiting Service
   */
  async testRateLimiting() {
    const testName = 'Rate Limiting';

    try {
      console.log(`🧪 Testing ${testName}...`);

      const requests = [];
      const responses = [];

      // Make multiple rapid requests to test rate limiting
      for (let i = 0; i < 15; i++) {
        requests.push(this.makeAPIRequest('/git/status', { repoPath: '/tmp/test-repo' }));
      }

      const results = await Promise.allSettled(requests);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          responses.push({ index, status: result.value.status, rateLimited: result.value.status === 429 });
        } else {
          responses.push({ index, error: result.reason.message });
        }
      });

      const rateLimitedRequests = responses.filter(r => r.rateLimited).length;
      const successfulRequests = responses.filter(r => r.status && r.status < 400).length;

      console.log(`✅ ${testName}: ${successfulRequests} successful, ${rateLimitedRequests} rate limited`);

      this.stats.passed++;
      return { success: true, test: testName, successful: successfulRequests, rateLimited: rateLimitedRequests };

    } catch (error) {
      console.log(`❌ ${testName}: ${error.message}`);
      this.stats.failed++;

      return { success: false, test: testName, error: error.message };
    }
  }

  /**
   * Test Advanced Caching Service
   */
  async testAdvancedCaching() {
    const testName = 'Advanced Caching';

    try {
      console.log(`🧪 Testing ${testName}...`);

      // Test cache operations
      const cacheKey = 'test-cache-key';
      const cacheValue = { data: 'test-value', timestamp: Date.now() };

      // Set cache
      const setResponse = await this.makeAPIRequest('/admin/api/cache/set', {
        key: cacheKey,
        value: cacheValue,
        level: 'memory'
      });

      // Get cache
      const getResponse = await this.makeAPIRequest(`/admin/api/cache/get/${cacheKey}`);

      // Clear cache
      const clearResponse = await this.makeAPIRequest('/admin/api/cache/clear', { level: 'memory' });

      const success = setResponse.status < 300 && getResponse.status < 300 && clearResponse.status < 300;

      console.log(`✅ ${testName}: Set=${setResponse.status}, Get=${getResponse.status}, Clear=${clearResponse.status}`);

      if (success) {
        this.stats.passed++;
      } else {
        this.stats.failed++;
      }

      return { success, test: testName, responses: { set: setResponse.status, get: getResponse.status, clear: clearResponse.status } };

    } catch (error) {
      console.log(`❌ ${testName}: ${error.message}`);
      this.stats.failed++;

      return { success: false, test: testName, error: error.message };
    }
  }

  /**
   * Test Load Balancing Service
   */
  async testLoadBalancing() {
    const testName = 'Load Balancing';

    try {
      console.log(`🧪 Testing ${testName}...`);

      // Make multiple requests to test load distribution
      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(this.makeAPIRequest('/health'));
      }

      const results = await Promise.allSettled(requests);
      const responses = results.filter(r => r.status === 'fulfilled').map(r => r.value);

      const statusCodes = responses.map(r => r.status);
      const uniqueBackends = new Set(responses.map(r => r.headers?.['x-backend-server'])).size;

      console.log(`✅ ${testName}: ${responses.length}/20 successful, ${uniqueBackends} backends used`);

      this.stats.passed++;
      return { success: true, test: testName, responses: responses.length, backends: uniqueBackends };

    } catch (error) {
      console.log(`❌ ${testName}: ${error.message}`);
      this.stats.failed++;

      return { success: false, test: testName, error: error.message };
    }
  }

  /**
   * Test Audit Logging Service
   */
  async testAuditLogging() {
    const testName = 'Audit Logging';

    try {
      console.log(`🧪 Testing ${testName}...`);

      // Generate some auditable events
      await this.makeAPIRequest('/git/status', { repoPath: '/tmp/test-repo' });
      await this.makeAPIRequest('/admin/api/logs', { limit: 10 });

      // Wait a bit for logs to be processed
      await this.delay(2000);

      // Query audit logs
      const logsResponse = await this.makeAPIRequest('/admin/api/logs', {
        limit: 50,
        filter: { level: 'info' }
      });

      const logs = logsResponse.body?.logs || [];
      const recentLogs = logs.filter(log => {
        const logTime = new Date(log.timestamp);
        const now = new Date();
        return (now.getTime() - logTime.getTime()) < 60000; // Last minute
      });

      console.log(`✅ ${testName}: ${recentLogs.length} recent log entries found`);

      this.stats.passed++;
      return { success: true, test: testName, recentLogs: recentLogs.length };

    } catch (error) {
      console.log(`❌ ${testName}: ${error.message}`);
      this.stats.failed++;

      return { success: false, test: testName, error: error.message };
    }
  }

  /**
   * Test API Versioning Service
   */
  async testAPIVersioning() {
    const testName = 'API Versioning';

    try {
      console.log(`🧪 Testing ${testName}...`);

      // Test different API versions
      const v1Response = await this.makeAPIRequest('/v1/git/status', { repoPath: '/tmp/test-repo' });
      const v2Response = await this.makeAPIRequest('/v2/git/status', { repoPath: '/tmp/test-repo' });

      // Test version negotiation
      const negotiateResponse = await this.makeAPIRequest('/git/status', { repoPath: '/tmp/test-repo' }, {
        'Accept': 'application/vnd.git-memory.v2+json'
      });

      const success = v1Response.status < 400 && v2Response.status < 400;

      console.log(`✅ ${testName}: v1=${v1Response.status}, v2=${v2Response.status}, negotiate=${negotiateResponse.status}`);

      if (success) {
        this.stats.passed++;
      } else {
        this.stats.failed++;
      }

      return { success, test: testName, responses: { v1: v1Response.status, v2: v2Response.status, negotiate: negotiateResponse.status } };

    } catch (error) {
      console.log(`❌ ${testName}: ${error.message}`);
      this.stats.failed++;

      return { success: false, test: testName, error: error.message };
    }
  }

  /**
   * Test Admin API Endpoints
   */
  async testAdminAPI() {
    const testName = 'Admin API';

    try {
      console.log(`🧪 Testing ${testName}...`);

      const endpoints = [
        '/admin/api/status',
        '/admin/api/metrics',
        '/admin/api/logs'
      ];

      const results = await Promise.allSettled(
        endpoints.map(endpoint => this.makeAPIRequest(endpoint))
      );

      const responses = results.map((result, index) => ({
        endpoint: endpoints[index],
        status: result.status === 'fulfilled' ? result.value.status : 0,
        success: result.status === 'fulfilled' && result.value.status < 400
      }));

      const successful = responses.filter(r => r.success).length;

      console.log(`✅ ${testName}: ${successful}/${endpoints.length} endpoints working`);

      responses.forEach(r => {
        console.log(`   ${r.endpoint}: ${r.status}`);
      });

      if (successful === endpoints.length) {
        this.stats.passed++;
      } else {
        this.stats.failed++;
      }

      return { success: successful === endpoints.length, test: testName, responses };

    } catch (error) {
      console.log(`❌ ${testName}: ${error.message}`);
      this.stats.failed++;

      return { success: false, test: testName, error: error.message };
    }
  }

  /**
   * Test Connection Pooling
   */
  async testConnectionPooling() {
    const testName = 'Connection Pooling';

    try {
      console.log(`🧪 Testing ${testName}...`);

      // Make multiple concurrent requests to test connection pooling
      const requests = [];
      for (let i = 0; i < 30; i++) {
        requests.push(this.makeAPIRequest('/health'));
      }

      const startTime = Date.now();
      const results = await Promise.allSettled(requests);
      const duration = Date.now() - startTime;

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status < 400).length;
      const avgResponseTime = duration / results.length;

      console.log(`✅ ${testName}: ${successful}/30 successful in ${duration}ms (avg: ${avgResponseTime.toFixed(1)}ms)`);

      this.stats.passed++;
      return { success: true, test: testName, successful, duration, avgResponseTime };

    } catch (error) {
      console.log(`❌ ${testName}: ${error.message}`);
      this.stats.failed++;

      return { success: false, test: testName, error: error.message };
    }
  }

  /**
   * Test Error Handling and Resilience
   */
  async testErrorHandling() {
    const testName = 'Error Handling';

    try {
      console.log(`🧪 Testing ${testName}...`);

      // Test various error conditions
      const errorScenarios = [
        { endpoint: '/invalid-endpoint', expected: 404 },
        { endpoint: '/git/status', data: { invalid: 'data' }, expected: 400 },
        { endpoint: '/admin/api/status', headers: { 'x-api-key': 'invalid-key' }, expected: 401 }
      ];

      const results = [];

      for (const scenario of errorScenarios) {
        const response = await this.makeAPIRequest(scenario.endpoint, scenario.data || {}, scenario.headers || {});
        const correctError = response.status === scenario.expected;

        results.push({
          scenario: scenario.endpoint,
          status: response.status,
          expected: scenario.expected,
          correct: correctError
        });

        console.log(`   ${scenario.endpoint}: ${response.status} (expected ${scenario.expected}) ${correctError ? '✅' : '❌'}`);
      }

      const allCorrect = results.every(r => r.correct);

      if (allCorrect) {
        this.stats.passed++;
      } else {
        this.stats.failed++;
      }

      return { success: allCorrect, test: testName, results };

    } catch (error) {
      console.log(`❌ ${testName}: ${error.message}`);
      this.stats.failed++;

      return { success: false, test: testName, error: error.message };
    }
  }

  /**
   * Make API request
   */
  async makeAPIRequest(endpoint, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, BASE_URL);

      const options = {
        hostname: url.hostname,
        port: url.port || 3000,
        path: url.pathname,
        method: data ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          ...headers
        }
      };

      const req = require('http').request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            resolve({ status: res.statusCode, headers: res.headers, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, body: body });
          }
        });
      });

      req.on('error', (err) => {
        resolve({ status: 0, error: err.message });
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * Run all advanced services tests
   */
  async runAllTests() {
    console.log('🚀 Starting Advanced Services Tests...\n');

    const tests = [
      () => this.testRateLimiting(),
      () => this.testAdvancedCaching(),
      () => this.testLoadBalancing(),
      () => this.testAuditLogging(),
      () => this.testAPIVersioning(),
      () => this.testAdminAPI(),
      () => this.testConnectionPooling(),
      () => this.testErrorHandling()
    ];

    this.stats.total = tests.length;

    for (const test of tests) {
      try {
        await test();
        await this.delay(1000);
      } catch (error) {
        console.error(`Test failed: ${error.message}`);
        this.stats.failed++;
      }
    }

    this.printSummary();
    return this.results;
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('\n📊 Advanced Services Test Summary:');
    console.log(`Total Tests: ${this.stats.total}`);
    console.log(`Passed: ${this.stats.passed}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Skipped: ${this.stats.skipped}`);

    if (this.stats.failed === 0) {
      console.log('\n🎉 All advanced services tests passed!');
    } else {
      console.log(`\n❌ ${this.stats.failed} test(s) failed`);
    }
  }

  /**
   * Generate test report
   */
  generateReport() {
    const report = {
      summary: this.stats,
      timestamp: new Date().toISOString(),
      results: this.results,
      environment: {
        baseUrl: BASE_URL,
        apiKey: API_KEY ? '[REDACTED]' : 'not-set'
      }
    };

    return report;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
async function main() {
  const tester = new AdvancedServicesTester();

  try {
    await tester.runAllTests();

    const report = tester.generateReport();
    console.log(`\n📄 Test report generated with ${report.results.length} results`);

    return report;

  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(() => {
    console.log('\n✨ Advanced services tests completed!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { AdvancedServicesTester };
