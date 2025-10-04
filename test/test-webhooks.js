#!/usr/bin/env node

/**
 * Comprehensive Webhook Testing Suite
 * Tests GitHub/GitLab webhook integrations with security validation
 */

import http from 'http';
import crypto from 'crypto';
import { EventEmitter } from 'events';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'test-webhook-secret';

// Test scenarios for different Git events
const WEBHOOK_SCENARIOS = [
  {
    name: 'Push Event',
    event: 'push',
    payload: {
      ref: 'refs/heads/main',
      before: '0000000000000000000000000000000000000000',
      after: '1234567890123456789012345678901234567890',
      repository: {
        name: 'test-repo',
        full_name: 'test-owner/test-repo',
        clone_url: 'https://github.com/test-owner/test-repo.git'
      },
      commits: [
        {
          id: '1234567890123456789012345678901234567890',
          message: 'Test commit message',
          author: { name: 'Test Author', email: 'test@example.com' }
        }
      ],
      sender: { login: 'test-user' }
    }
  },
  {
    name: 'Pull Request Event',
    event: 'pull_request',
    payload: {
      action: 'opened',
      number: 1,
      repository: {
        name: 'test-repo',
        full_name: 'test-owner/test-repo'
      },
      pull_request: {
        title: 'Test PR',
        body: 'This is a test pull request',
        head: { ref: 'feature-branch' },
        base: { ref: 'main' }
      },
      sender: { login: 'test-user' }
    }
  },
  {
    name: 'Issue Event',
    event: 'issues',
    payload: {
      action: 'opened',
      issue: {
        number: 1,
        title: 'Test Issue',
        body: 'This is a test issue'
      },
      repository: {
        name: 'test-repo',
        full_name: 'test-owner/test-repo'
      },
      sender: { login: 'test-user' }
    }
  },
  {
    name: 'Release Event',
    event: 'release',
    payload: {
      action: 'published',
      release: {
        tag_name: 'v1.0.0',
        name: 'Release v1.0.0',
        body: 'Release notes for v1.0.0'
      },
      repository: {
        name: 'test-repo',
        full_name: 'test-owner/test-repo'
      },
      sender: { login: 'test-user' }
    }
  }
];

export class WebhookTester extends EventEmitter {
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
   * Generate GitHub webhook signature
   */
  generateGitHubSignature(payload) {
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Generate GitLab webhook token
   */
  generateGitLabToken(payload) {
    return crypto.createHash('sha256').update(JSON.stringify(payload) + WEBHOOK_SECRET).digest('hex');
  }

  /**
   * Make HTTP request to webhook endpoint
   */
  makeRequest(eventType, payload, platform = 'github') {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);

      const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Git-Memory-Webhook-Test/1.0'
      };

      // Add platform-specific headers
      if (platform === 'github') {
        headers['X-GitHub-Event'] = eventType;
        headers['X-Hub-Signature-256'] = this.generateGitHubSignature(payload);
      } else if (platform === 'gitlab') {
        headers['X-Gitlab-Event'] = eventType;
        headers['X-Gitlab-Token'] = this.generateGitLabToken(payload);
      }

      const options = {
        hostname: new URL(BASE_URL).hostname,
        port: new URL(BASE_URL).port || 3000,
        path: '/webhooks/git',
        method: 'POST',
        headers
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const response = body ? JSON.parse(body) : {};
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: response,
              success: res.statusCode >= 200 && res.statusCode < 300
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: body,
              success: false,
              error: e.message
            });
          }
        });
      });

      req.on('error', (err) => {
        resolve({
          status: 0,
          success: false,
          error: err.message
        });
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Test single webhook scenario
   */
  async testScenario(scenario, platform = 'github') {
    const startTime = Date.now();

    try {
      console.log(`🧪 Testing ${scenario.name} (${platform})...`);

      const response = await this.makeRequest(scenario.event, scenario.payload, platform);
      const duration = Date.now() - startTime;

      const result = {
        scenario: scenario.name,
        platform,
        duration,
        response,
        success: response.success,
        timestamp: new Date().toISOString()
      };

      this.results.push(result);

      if (response.success) {
        console.log(`✅ ${scenario.name}: ${response.status} (${duration}ms)`);
        this.stats.passed++;
      } else {
        console.log(`❌ ${scenario.name}: ${response.status || response.error} (${duration}ms)`);
        this.stats.failed++;
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`💥 ${scenario.name}: ${error.message} (${duration}ms)`);

      this.results.push({
        scenario: scenario.name,
        platform,
        duration,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      this.stats.failed++;
      throw error;
    }
  }

  /**
   * Test all webhook scenarios
   */
  async testAllScenarios(platforms = ['github', 'gitlab']) {
    console.log('🚀 Starting Webhook Tests...\n');

    this.stats.total = WEBHOOK_SCENARIOS.length * platforms.length;

    for (const platform of platforms) {
      console.log(`\n🌐 Testing ${platform.toUpperCase()} Webhooks:`);

      for (const scenario of WEBHOOK_SCENARIOS) {
        await this.testScenario(scenario, platform);
        await this.delay(500); // Rate limiting between tests
      }
    }

    this.printSummary();
    return this.results;
  }

  /**
   * Test security validation
   */
  async testSecurity() {
    console.log('\n🔒 Testing Security Features...');

    const scenarios = [
      {
        name: 'Invalid Signature',
        payload: { test: 'data' },
        headers: {
          'X-GitHub-Event': 'push',
          'X-Hub-Signature-256': 'invalid-signature'
        },
        expectedStatus: 401
      },
      {
        name: 'Missing Event Header',
        payload: { test: 'data' },
        headers: {
          'X-Hub-Signature-256': this.generateGitHubSignature({ test: 'data' })
        },
        expectedStatus: 400
      },
      {
        name: 'Invalid JSON Payload',
        payload: 'invalid-json',
        headers: {
          'X-GitHub-Event': 'push',
          'X-Hub-Signature-256': this.generateGitHubSignature({ test: 'data' })
        },
        expectedStatus: 400
      }
    ];

    for (const scenario of scenarios) {
      const response = await this.makeRequest('push', scenario.payload, 'github');
      const success = response.status === scenario.expectedStatus;

      console.log(`${success ? '✅' : '❌'} Security: ${scenario.name} - ${response.status}`);

      if (success) {
        this.stats.passed++;
      } else {
        this.stats.failed++;
      }
    }
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('\n📊 Webhook Test Summary:');
    console.log(`Total: ${this.stats.total}`);
    console.log(`Passed: ${this.stats.passed}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Skipped: ${this.stats.skipped}`);

    const successRate = ((this.stats.passed / this.stats.total) * 100).toFixed(1);
    console.log(`Success Rate: ${successRate}%`);

    if (this.stats.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.scenario}: ${r.response?.status || r.error}`);
      });
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
        webhookSecret: WEBHOOK_SECRET ? '[REDACTED]' : 'not-set'
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
  const tester = new WebhookTester();

  try {
    // Test all scenarios for both platforms
    await tester.testAllScenarios();

    // Test security features
    await tester.testSecurity();

    // Generate and save report
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
    console.log('\n✨ Webhook tests completed!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { WebhookTester };
