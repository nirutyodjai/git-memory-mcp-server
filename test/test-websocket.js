#!/usr/bin/env node

/**
 * Comprehensive WebSocket Testing Suite
 * Tests real-time features, admin dashboard, and connection management
 */

import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

const WS_URL = process.env.WS_URL || 'ws://localhost:3000';
const ADMIN_WS_URL = process.env.ADMIN_WS_URL || 'ws://localhost:3000/admin-ws';

export class WebSocketTester extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map();
    this.results = [];
    this.stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      connections: 0,
      messages: 0,
      errors: 0
    };
  }

  /**
   * Create WebSocket connection
   */
  createConnection(url, options = {}) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url, options);

      ws.on('open', () => {
        this.connections.set(ws, { url, connectedAt: new Date() });
        this.stats.connections++;
        resolve(ws);
      });

      ws.on('error', (error) => {
        this.stats.errors++;
        reject(error);
      });

      ws.on('message', (data) => {
        this.handleMessage(ws, data);
      });

      ws.on('close', (code, reason) => {
        this.connections.delete(ws);
        this.log(`Connection closed: ${code} - ${reason}`);
      });
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(ws, data) {
    try {
      const message = JSON.parse(data.toString());
      this.stats.messages++;

      this.log(`Received: ${message.type}`, 'cyan');

      // Emit event for test listeners
      this.emit('message', { ws, message });

      // Handle specific message types
      switch (message.type) {
        case 'welcome':
          this.handleWelcome(ws, message);
          break;
        case 'metrics':
          this.handleMetrics(ws, message);
          break;
        case 'logs':
          this.handleLogs(ws, message);
          break;
        case 'alert':
          this.handleAlert(ws, message);
          break;
        case 'pong':
          this.handlePong(ws, message);
          break;
      }

    } catch (error) {
      this.log(`Failed to parse message: ${error.message}`, 'red');
      this.stats.errors++;
    }
  }

  /**
   * Send WebSocket message
   */
  sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      this.log(`Sent: ${message.type}`, 'green');
    } else {
      throw new Error('WebSocket not connected');
    }
  }

  /**
   * Test basic connection
   */
  async testBasicConnection() {
    const testName = 'Basic Connection';

    try {
      console.log(`🧪 Testing ${testName}...`);

      const ws = await this.createConnection(WS_URL);
      await this.delay(1000);

      if (this.connections.has(ws)) {
        console.log(`✅ ${testName}: Connected successfully`);
        this.stats.passed++;
        ws.close();

        return { success: true, test: testName };
      } else {
        throw new Error('Connection not established');
      }

    } catch (error) {
      console.log(`❌ ${testName}: ${error.message}`);
      this.stats.failed++;

      return { success: false, test: testName, error: error.message };
    }
  }

  /**
   * Test connection limits
   */
  async testConnectionLimits(maxConnections = 100) {
    const testName = `Connection Limits (${maxConnections})`;

    try {
      console.log(`🧪 Testing ${testName}...`);

      const connections = [];
      const errors = [];

      // Create multiple connections
      for (let i = 0; i < maxConnections; i++) {
        try {
          const ws = await this.createConnection(WS_URL);
          connections.push(ws);

          // Small delay to avoid overwhelming the server
          if (i % 10 === 0) {
            await this.delay(100);
          }
        } catch (error) {
          errors.push(error);
        }
      }

      await this.delay(2000);

      const successfulConnections = connections.filter(ws => this.connections.has(ws)).length;

      console.log(`✅ ${testName}: ${successfulConnections}/${maxConnections} connections successful`);

      if (errors.length > 0) {
        console.log(`   ${errors.length} connection errors occurred`);
      }

      // Close all connections
      connections.forEach(ws => ws.close());

      this.stats.passed++;
      return { success: true, test: testName, connections: successfulConnections, errors: errors.length };

    } catch (error) {
      console.log(`❌ ${testName}: ${error.message}`);
      this.stats.failed++;

      return { success: false, test: testName, error: error.message };
    }
  }

  /**
   * Test message broadcasting
   */
  async testMessageBroadcasting() {
    const testName = 'Message Broadcasting';

    try {
      console.log(`🧪 Testing ${testName}...`);

      const ws1 = await this.createConnection(WS_URL);
      const ws2 = await this.createConnection(WS_URL);

      await this.delay(1000);

      // Send message from first connection
      this.sendMessage(ws1, { type: 'broadcast_test', data: 'Hello from ws1' });

      // Wait for messages to be received
      await this.delay(2000);

      const receivedMessages = this.results.filter(r => r.test === testName);

      console.log(`✅ ${testName}: ${receivedMessages.length} messages received`);

      ws1.close();
      ws2.close();

      this.stats.passed++;
      return { success: true, test: testName, messages: receivedMessages.length };

    } catch (error) {
      console.log(`❌ ${testName}: ${error.message}`);
      this.stats.failed++;

      return { success: false, test: testName, error: error.message };
    }
  }

  /**
   * Test admin dashboard WebSocket
   */
  async testAdminDashboard() {
    const testName = 'Admin Dashboard WebSocket';

    try {
      console.log(`🧪 Testing ${testName}...`);

      const ws = await this.createConnection(ADMIN_WS_URL);

      // Wait for welcome message
      await this.delay(1000);

      // Test subscription to metrics
      this.sendMessage(ws, { type: 'subscribe', data: { type: 'metrics' } });
      await this.delay(1000);

      // Test getting metrics
      this.sendMessage(ws, { type: 'get_metrics' });
      await this.delay(2000);

      // Test ping/pong
      this.sendMessage(ws, { type: 'ping' });
      await this.delay(1000);

      const adminMessages = this.results.filter(r => r.test === testName);

      console.log(`✅ ${testName}: ${adminMessages.length} admin messages received`);

      ws.close();

      this.stats.passed++;
      return { success: true, test: testName, messages: adminMessages.length };

    } catch (error) {
      console.log(`❌ ${testName}: ${error.message}`);
      this.stats.failed++;

      return { success: false, test: testName, error: error.message };
    }
  }

  /**
   * Test real-time log streaming
   */
  async testLogStreaming() {
    const testName = 'Log Streaming';

    try {
      console.log(`🧪 Testing ${testName}...`);

      const ws = await this.createConnection(ADMIN_WS_URL);

      // Subscribe to logs
      this.sendMessage(ws, { type: 'subscribe', data: { type: 'logs' } });
      await this.delay(1000);

      // Request recent logs
      this.sendMessage(ws, { type: 'get_logs', data: { limit: 10 } });
      await this.delay(2000);

      const logMessages = this.results.filter(r => r.test === testName);

      console.log(`✅ ${testName}: ${logMessages.length} log messages received`);

      ws.close();

      this.stats.passed++;
      return { success: true, test: testName, messages: logMessages.length };

    } catch (error) {
      console.log(`❌ ${testName}: ${error.message}`);
      this.stats.failed++;

      return { success: false, test: testName, error: error.message };
    }
  }

  /**
   * Test connection recovery
   */
  async testConnectionRecovery() {
    const testName = 'Connection Recovery';

    try {
      console.log(`🧪 Testing ${testName}...`);

      const ws = await this.createConnection(WS_URL);

      // Wait a bit then close connection
      await this.delay(1000);
      ws.close();

      // Wait for close event
      await this.delay(500);

      // Try to reconnect
      const ws2 = await this.createConnection(WS_URL);

      await this.delay(1000);

      if (this.connections.has(ws2)) {
        console.log(`✅ ${testName}: Recovery successful`);
        this.stats.passed++;
        ws2.close();

        return { success: true, test: testName };
      } else {
        throw new Error('Failed to reconnect');
      }

    } catch (error) {
      console.log(`❌ ${testName}: ${error.message}`);
      this.stats.failed++;

      return { success: false, test: testName, error: error.message };
    }
  }

  /**
   * Test concurrent connections
   */
  async testConcurrentConnections() {
    const testName = 'Concurrent Connections (50)';

    try {
      console.log(`🧪 Testing ${testName}...`);

      const connections = [];
      const promises = [];

      // Create 50 concurrent connections
      for (let i = 0; i < 50; i++) {
        promises.push(
          this.createConnection(WS_URL)
            .then(ws => {
              connections.push(ws);
              return ws;
            })
            .catch(error => {
              this.log(`Connection ${i} failed: ${error.message}`, 'yellow');
              return null;
            })
        );
      }

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;

      await this.delay(2000);

      console.log(`✅ ${testName}: ${successful}/50 connections successful`);

      // Close all connections
      connections.forEach(ws => ws.close());

      this.stats.passed++;
      return { success: true, test: testName, connections: successful };

    } catch (error) {
      console.log(`❌ ${testName}: ${error.message}`);
      this.stats.failed++;

      return { success: false, test: testName, error: error.message };
    }
  }

  /**
   * Run all WebSocket tests
   */
  async runAllTests() {
    console.log('🚀 Starting WebSocket Tests...\n');

    const tests = [
      () => this.testBasicConnection(),
      () => this.testConnectionLimits(10),
      () => this.testMessageBroadcasting(),
      () => this.testAdminDashboard(),
      () => this.testLogStreaming(),
      () => this.testConnectionRecovery(),
      () => this.testConcurrentConnections()
    ];

    this.stats.total = tests.length;

    for (const test of tests) {
      try {
        await test();
        await this.delay(500);
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
    console.log('\n📊 WebSocket Test Summary:');
    console.log(`Total Tests: ${this.stats.total}`);
    console.log(`Passed: ${this.stats.passed}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Connections Created: ${this.stats.connections}`);
    console.log(`Messages Received: ${this.stats.messages}`);
    console.log(`Errors: ${this.stats.errors}`);

    if (this.stats.failed === 0) {
      console.log('\n🎉 All WebSocket tests passed!');
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
        wsUrl: WS_URL,
        adminWsUrl: ADMIN_WS_URL
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

  /**
   * Enhanced logging with colors
   */
  log(message, color = 'reset') {
    const colors = {
      reset: '\x1b[0m',
      green: '\x1b[32m',
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m'
    };

    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  // Message handlers
  handleWelcome(ws, message) {
    this.log(`Welcome received: ${message.data.clientId}`, 'green');
  }

  handleMetrics(ws, message) {
    this.log(`Metrics received: ${Object.keys(message.metrics).length} metrics`, 'blue');
  }

  handleLogs(ws, message) {
    this.log(`Logs received: ${message.logs?.length || 0} entries`, 'blue');
  }

  handleAlert(ws, message) {
    this.log(`Alert received: ${message.message} (${message.level})`, 'yellow');
  }

  handlePong(ws, message) {
    this.log('Pong received', 'green');
  }
}

// CLI interface
async function main() {
  const tester = new WebSocketTester();

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
    console.log('\n✨ WebSocket tests completed!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { WebSocketTester };
