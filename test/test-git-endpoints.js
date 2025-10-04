#!/usr/bin/env node

/**
 * Test script for Git Memory CLI endpoints
 * Tests /git/status, /git/fetch, and /git/rebase endpoints with API key authentication
 */

import http from 'http';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.GIT_MEMORY_API_KEY || 'test-api-key';
const TEST_REPO = process.env.TEST_REPO_PATH || process.cwd();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testHealthEndpoint() {
  log('\n📊 Testing Health Endpoint...', 'cyan');
  try {
    const response = await makeRequest('GET', '/health');
    if (response.status === 200) {
      log('✓ Health check passed', 'green');
      log(`  Status: ${response.body.status}`, 'blue');
      return true;
    } else {
      log(`✗ Health check failed with status ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Health check error: ${error.message}`, 'red');
    return false;
  }
}

async function testGitStatusEndpoint() {
  log('\n📊 Testing /git/status endpoint...', 'cyan');
  
  // Test 1: Valid request with API key
  try {
    log('  Test 1: Valid request with API key', 'yellow');
    const response = await makeRequest('POST', '/git/status', {
      repoPath: TEST_REPO,
      json: true
    });
    
    if (response.status === 200 && response.body.success) {
      log('  ✓ Status endpoint works correctly', 'green');
      log(`    Data keys: ${Object.keys(response.body.data || {}).join(', ')}`, 'blue');
    } else {
      log(`  ✗ Unexpected response: ${response.status}`, 'red');
      log(`    Body: ${JSON.stringify(response.body)}`, 'red');
    }
  } catch (error) {
    log(`  ✗ Error: ${error.message}`, 'red');
  }

  // Test 2: Request without API key
  try {
    log('  Test 2: Request without API key (should fail)', 'yellow');
    const response = await makeRequest('POST', '/git/status', {
      repoPath: TEST_REPO,
      json: true
    }, { 'x-api-key': '' });
    
    if (response.status === 401) {
      log('  ✓ Correctly rejected request without API key', 'green');
    } else {
      log(`  ✗ Expected 401, got ${response.status}`, 'red');
    }
  } catch (error) {
    log(`  ✗ Error: ${error.message}`, 'red');
  }

  // Test 3: Request with invalid repo path
  try {
    log('  Test 3: Request with invalid repo path', 'yellow');
    const response = await makeRequest('POST', '/git/status', {
      repoPath: '/nonexistent/path/to/repo',
      json: true
    });
    
    if (response.status >= 400) {
      log('  ✓ Correctly rejected invalid repo path', 'green');
    } else {
      log(`  ✗ Expected error status, got ${response.status}`, 'red');
    }
  } catch (error) {
    log(`  ✗ Error: ${error.message}`, 'red');
  }

  // Test 4: Request without repoPath
  try {
    log('  Test 4: Request without repoPath (should fail)', 'yellow');
    const response = await makeRequest('POST', '/git/status', {
      json: true
    });
    
    if (response.status === 400) {
      log('  ✓ Correctly rejected request without repoPath', 'green');
    } else {
      log(`  ✗ Expected 400, got ${response.status}`, 'red');
    }
  } catch (error) {
    log(`  ✗ Error: ${error.message}`, 'red');
  }
}

async function testGitFetchEndpoint() {
  log('\n📊 Testing /git/fetch endpoint...', 'cyan');
  
  try {
    log('  Test: Fetch with default options', 'yellow');
    const response = await makeRequest('POST', '/git/fetch', {
      repoPath: TEST_REPO,
      remote: 'origin',
      prune: false,
      tags: false,
      all: false
    });
    
    if (response.status === 200 && response.body.success) {
      log('  ✓ Fetch endpoint works correctly', 'green');
      log(`    stdout length: ${response.body.stdout?.length || 0} chars`, 'blue');
    } else {
      log(`  ✗ Unexpected response: ${response.status}`, 'red');
      log(`    Body: ${JSON.stringify(response.body)}`, 'red');
    }
  } catch (error) {
    log(`  ✗ Error: ${error.message}`, 'red');
  }
}

async function testGitRebaseEndpoint() {
  log('\n📊 Testing /git/rebase endpoint...', 'cyan');
  
  try {
    log('  Test: Rebase status check (abort if in progress)', 'yellow');
    const response = await makeRequest('POST', '/git/rebase', {
      repoPath: TEST_REPO,
      abort: true
    });
    
    // This might fail if no rebase is in progress, which is expected
    if (response.status === 200 || (response.status >= 400 && response.body.error)) {
      log('  ✓ Rebase endpoint is accessible', 'green');
      if (response.body.error) {
        log(`    Note: ${response.body.error}`, 'yellow');
      }
    } else {
      log(`  ✗ Unexpected response: ${response.status}`, 'red');
    }
  } catch (error) {
    log(`  ✗ Error: ${error.message}`, 'red');
  }
}

async function testMetricsEndpoint() {
  log('\n📊 Testing /metrics endpoint...', 'cyan');
  
  try {
    const response = await makeRequest('GET', '/metrics');
    if (response.status === 200) {
      log('✓ Metrics endpoint accessible', 'green');
      const metricsText = typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
      const lineCount = metricsText.split('\n').length;
      log(`  Metrics lines: ${lineCount}`, 'blue');
    } else {
      log(`✗ Metrics endpoint failed with status ${response.status}`, 'red');
    }
  } catch (error) {
    log(`✗ Metrics endpoint error: ${error.message}`, 'red');
  }
}

async function runAllTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('Git Memory MCP Server - Endpoint Tests', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\nBase URL: ${BASE_URL}`, 'blue');
  log(`Test Repo: ${TEST_REPO}`, 'blue');
  log(`API Key: ${API_KEY ? '***' + API_KEY.slice(-4) : 'Not set'}`, 'blue');

  const healthOk = await testHealthEndpoint();
  
  if (!healthOk) {
    log('\n⚠️  Server health check failed. Skipping endpoint tests.', 'yellow');
    log('Make sure the server is running: npm start', 'yellow');
    process.exit(1);
  }

  await testGitStatusEndpoint();
  await testGitFetchEndpoint();
  await testGitRebaseEndpoint();
  await testMetricsEndpoint();

  log('\n' + '='.repeat(60), 'cyan');
  log('Tests completed!', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
}

// Run tests
runAllTests().catch(error => {
  log(`\n✗ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
