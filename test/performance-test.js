import { WebSocket } from 'ws';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import { createLogger } from 'winston';
import fs from 'fs/promises';
import path from 'path';

const logger = createLogger({
  level: 'info',
  format: logger.format.combine(
    logger.format.timestamp(),
    logger.format.json()
  ),
  transports: [
    new logger.transports.Console(),
    new logger.transports.File({ filename: 'performance-test.log' })
  ]
});

export class PerformanceTest extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      serverUrl: options.serverUrl || 'ws://localhost:3000',
      maxConnections: options.maxConnections || 3000,
      rampUpTime: options.rampUpTime || 60000, // 1 minute
      testDuration: options.testDuration || 300000, // 5 minutes
      requestsPerSecond: options.requestsPerSecond || 100,
      connectionBatchSize: options.connectionBatchSize || 50,
      batchDelay: options.batchDelay || 1000,
      ...options
    };
    
    this.connections = new Map();
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      failedConnections: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      connectionTimes: [],
      errors: [],
      startTime: null,
      endTime: null
    };
    
    this.testPhase = 'idle';
    this.shouldStop = false;
  }

  // Start performance test
  async startTest() {
    logger.info('Starting performance test', this.config);
    
    this.stats.startTime = Date.now();
    this.testPhase = 'ramp-up';
    
    try {
      // Phase 1: Ramp up connections
      await this.rampUpConnections();
      
      if (this.shouldStop) return;
      
      // Phase 2: Sustained load test
      this.testPhase = 'load-test';
      await this.runLoadTest();
      
      if (this.shouldStop) return;
      
      // Phase 3: Ramp down
      this.testPhase = 'ramp-down';
      await this.rampDownConnections();
      
    } catch (error) {
      logger.error('Performance test failed:', error);
      this.stats.errors.push({
        timestamp: Date.now(),
        phase: this.testPhase,
        error: error.message
      });
    } finally {
      this.testPhase = 'cleanup';
      await this.cleanup();
      this.stats.endTime = Date.now();
      
      const results = this.generateReport();
      await this.saveResults(results);
      
      logger.info('Performance test completed');
      this.emit('testCompleted', results);
    }
  }

  // Ramp up connections gradually
  async rampUpConnections() {
    logger.info('Starting connection ramp-up phase');
    
    const connectionsPerBatch = this.config.connectionBatchSize;
    const totalBatches = Math.ceil(this.config.maxConnections / connectionsPerBatch);
    const batchInterval = this.config.rampUpTime / totalBatches;
    
    for (let batch = 0; batch < totalBatches && !this.shouldStop; batch++) {
      const batchStart = Date.now();
      const connectionsInThisBatch = Math.min(
        connectionsPerBatch,
        this.config.maxConnections - (batch * connectionsPerBatch)
      );
      
      logger.info(`Creating batch ${batch + 1}/${totalBatches} (${connectionsInThisBatch} connections)`);
      
      // Create connections in parallel for this batch
      const connectionPromises = [];
      for (let i = 0; i < connectionsInThisBatch; i++) {
        connectionPromises.push(this.createConnection(`batch-${batch}-conn-${i}`));
      }
      
      // Wait for batch to complete
      const results = await Promise.allSettled(connectionPromises);
      
      // Count successful and failed connections
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      logger.info(`Batch ${batch + 1} completed: ${successful} successful, ${failed} failed`);
      
      // Wait for next batch interval
      const batchDuration = Date.now() - batchStart;
      const waitTime = Math.max(0, batchInterval - batchDuration);
      
      if (waitTime > 0 && !this.shouldStop) {
        await this.sleep(waitTime);
      }
    }
    
    logger.info(`Ramp-up completed: ${this.stats.activeConnections} active connections`);
  }

  // Create a single WebSocket connection
  async createConnection(connectionId) {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      
      try {
        const ws = new WebSocket(this.config.serverUrl);
        const connection = {
          id: connectionId,
          ws,
          startTime: Date.now(),
          requestCount: 0,
          lastActivity: Date.now()
        };
        
        ws.on('open', () => {
          const connectionTime = performance.now() - startTime;
          this.stats.connectionTimes.push(connectionTime);
          this.stats.totalConnections++;
          this.stats.activeConnections++;
          
          this.connections.set(connectionId, connection);
          
          logger.debug(`Connection ${connectionId} established in ${connectionTime.toFixed(2)}ms`);
          resolve(connection);
        });
        
        ws.on('message', (data) => {
          this.handleMessage(connectionId, data);
        });
        
        ws.on('error', (error) => {
          logger.error(`Connection ${connectionId} error:`, error);
          this.stats.errors.push({
            timestamp: Date.now(),
            connectionId,
            error: error.message
          });
          
          if (this.connections.has(connectionId)) {
            this.removeConnection(connectionId);
          }
          
          reject(error);
        });
        
        ws.on('close', () => {
          logger.debug(`Connection ${connectionId} closed`);
          this.removeConnection(connectionId);
        });
        
        // Connection timeout
        setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            ws.terminate();
            this.stats.failedConnections++;
            reject(new Error(`Connection timeout for ${connectionId}`));
          }
        }, 10000); // 10 second timeout
        
      } catch (error) {
        this.stats.failedConnections++;
        reject(error);
      }
    });
  }

  // Remove connection
  removeConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.connections.delete(connectionId);
      this.stats.activeConnections = Math.max(0, this.stats.activeConnections - 1);
      
      if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.close();
      }
    }
  }

  // Run sustained load test
  async runLoadTest() {
    logger.info('Starting sustained load test phase');
    
    const testStartTime = Date.now();
    const requestInterval = 1000 / this.config.requestsPerSecond;
    
    // Start sending requests at specified rate
    const requestTimer = setInterval(() => {
      if (this.shouldStop || Date.now() - testStartTime > this.config.testDuration) {
        clearInterval(requestTimer);
        return;
      }
      
      this.sendRandomRequest();
    }, requestInterval);
    
    // Wait for test duration
    await this.sleep(this.config.testDuration);
    clearInterval(requestTimer);
    
    logger.info('Sustained load test completed');
  }

  // Send a random request to a random connection
  sendRandomRequest() {
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.ws.readyState === WebSocket.OPEN);
    
    if (activeConnections.length === 0) {
      return;
    }
    
    const connection = activeConnections[Math.floor(Math.random() * activeConnections.length)];
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const requests = [
      {
        jsonrpc: '2.0',
        id: requestId,
        method: 'tools/call',
        params: {
          name: 'get_current_branch',
          arguments: { repo_path: '/test/repo' }
        }
      },
      {
        jsonrpc: '2.0',
        id: requestId,
        method: 'tools/call',
        params: {
          name: 'get_recent_commits',
          arguments: { repo_path: '/test/repo', limit: 10 }
        }
      },
      {
        jsonrpc: '2.0',
        id: requestId,
        method: 'tools/call',
        params: {
          name: 'get_repo_status',
          arguments: { repo_path: '/test/repo' }
        }
      }
    ];
    
    const request = requests[Math.floor(Math.random() * requests.length)];
    const startTime = performance.now();
    
    try {
      connection.ws.send(JSON.stringify(request));
      connection.requestCount++;
      connection.lastActivity = Date.now();
      this.stats.totalRequests++;
      
      // Store request for response tracking
      connection.pendingRequests = connection.pendingRequests || new Map();
      connection.pendingRequests.set(requestId, {
        startTime,
        request
      });
      
    } catch (error) {
      this.stats.failedRequests++;
      logger.error(`Failed to send request ${requestId}:`, error);
    }
  }

  // Handle incoming message
  handleMessage(connectionId, data) {
    try {
      const message = JSON.parse(data.toString());
      const connection = this.connections.get(connectionId);
      
      if (!connection) return;
      
      connection.lastActivity = Date.now();
      
      // Handle response
      if (message.id && connection.pendingRequests?.has(message.id)) {
        const pendingRequest = connection.pendingRequests.get(message.id);
        const responseTime = performance.now() - pendingRequest.startTime;
        
        this.stats.responseTimes.push(responseTime);
        
        if (message.error) {
          this.stats.failedRequests++;
          logger.debug(`Request ${message.id} failed:`, message.error);
        } else {
          this.stats.successfulRequests++;
          logger.debug(`Request ${message.id} completed in ${responseTime.toFixed(2)}ms`);
        }
        
        connection.pendingRequests.delete(message.id);
      }
      
    } catch (error) {
      logger.error(`Failed to parse message from ${connectionId}:`, error);
    }
  }

  // Ramp down connections
  async rampDownConnections() {
    logger.info('Starting connection ramp-down phase');
    
    const connections = Array.from(this.connections.keys());
    const batchSize = Math.ceil(connections.length / 10); // Close in 10 batches
    
    for (let i = 0; i < connections.length; i += batchSize) {
      const batch = connections.slice(i, i + batchSize);
      
      batch.forEach(connectionId => {
        this.removeConnection(connectionId);
      });
      
      logger.info(`Closed ${batch.length} connections, ${this.stats.activeConnections} remaining`);
      
      // Wait between batches
      await this.sleep(1000);
    }
    
    logger.info('Connection ramp-down completed');
  }

  // Generate test report
  generateReport() {
    const duration = this.stats.endTime - this.stats.startTime;
    const responseTimes = this.stats.responseTimes.sort((a, b) => a - b);
    const connectionTimes = this.stats.connectionTimes.sort((a, b) => a - b);
    
    const calculatePercentile = (arr, percentile) => {
      if (arr.length === 0) return 0;
      const index = Math.ceil((percentile / 100) * arr.length) - 1;
      return arr[Math.max(0, index)];
    };
    
    const report = {
      testConfig: this.config,
      duration: duration,
      summary: {
        totalConnections: this.stats.totalConnections,
        failedConnections: this.stats.failedConnections,
        connectionSuccessRate: this.stats.totalConnections > 0 ? 
          ((this.stats.totalConnections - this.stats.failedConnections) / this.stats.totalConnections) * 100 : 0,
        totalRequests: this.stats.totalRequests,
        successfulRequests: this.stats.successfulRequests,
        failedRequests: this.stats.failedRequests,
        requestSuccessRate: this.stats.totalRequests > 0 ? 
          (this.stats.successfulRequests / this.stats.totalRequests) * 100 : 0,
        requestsPerSecond: this.stats.totalRequests / (duration / 1000),
        totalErrors: this.stats.errors.length
      },
      connectionMetrics: {
        count: connectionTimes.length,
        min: connectionTimes.length > 0 ? connectionTimes[0] : 0,
        max: connectionTimes.length > 0 ? connectionTimes[connectionTimes.length - 1] : 0,
        mean: connectionTimes.length > 0 ? 
          connectionTimes.reduce((sum, time) => sum + time, 0) / connectionTimes.length : 0,
        median: calculatePercentile(connectionTimes, 50),
        p95: calculatePercentile(connectionTimes, 95),
        p99: calculatePercentile(connectionTimes, 99)
      },
      responseMetrics: {
        count: responseTimes.length,
        min: responseTimes.length > 0 ? responseTimes[0] : 0,
        max: responseTimes.length > 0 ? responseTimes[responseTimes.length - 1] : 0,
        mean: responseTimes.length > 0 ? 
          responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0,
        median: calculatePercentile(responseTimes, 50),
        p95: calculatePercentile(responseTimes, 95),
        p99: calculatePercentile(responseTimes, 99)
      },
      errors: this.stats.errors,
      timestamp: new Date().toISOString()
    };
    
    return report;
  }

  // Save test results
  async saveResults(report) {
    const filename = `performance-test-${Date.now()}.json`;
    const filepath = path.join(process.cwd(), 'test-results', filename);
    
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      
      // Save detailed report
      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
      
      // Save summary CSV
      const csvFilename = `performance-summary-${Date.now()}.csv`;
      const csvPath = path.join(process.cwd(), 'test-results', csvFilename);
      const csvContent = this.generateCSVSummary(report);
      await fs.writeFile(csvPath, csvContent);
      
      logger.info(`Test results saved to ${filepath} and ${csvPath}`);
      
    } catch (error) {
      logger.error('Failed to save test results:', error);
    }
  }

  // Generate CSV summary
  generateCSVSummary(report) {
    const headers = [
      'Timestamp',
      'Duration (ms)',
      'Max Connections',
      'Total Connections',
      'Failed Connections',
      'Connection Success Rate (%)',
      'Total Requests',
      'Successful Requests',
      'Failed Requests',
      'Request Success Rate (%)',
      'Requests/Second',
      'Avg Response Time (ms)',
      'P95 Response Time (ms)',
      'P99 Response Time (ms)',
      'Total Errors'
    ];
    
    const values = [
      report.timestamp,
      report.duration,
      report.testConfig.maxConnections,
      report.summary.totalConnections,
      report.summary.failedConnections,
      report.summary.connectionSuccessRate.toFixed(2),
      report.summary.totalRequests,
      report.summary.successfulRequests,
      report.summary.failedRequests,
      report.summary.requestSuccessRate.toFixed(2),
      report.summary.requestsPerSecond.toFixed(2),
      report.responseMetrics.mean.toFixed(2),
      report.responseMetrics.p95.toFixed(2),
      report.responseMetrics.p99.toFixed(2),
      report.summary.totalErrors
    ];
    
    return headers.join(',') + '\n' + values.join(',');
  }

  // Stop the test
  stop() {
    logger.info('Stopping performance test...');
    this.shouldStop = true;
  }

  // Cleanup resources
  async cleanup() {
    logger.info('Cleaning up test resources...');
    
    // Close all remaining connections
    for (const [connectionId, connection] of this.connections) {
      try {
        if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.close();
        }
      } catch (error) {
        logger.error(`Error closing connection ${connectionId}:`, error);
      }
    }
    
    this.connections.clear();
    this.stats.activeConnections = 0;
    
    logger.info('Cleanup completed');
  }

  // Utility function for sleeping
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = {
    serverUrl: process.env.SERVER_URL || 'ws://localhost:3000',
    maxConnections: parseInt(process.env.MAX_CONNECTIONS) || 3000,
    rampUpTime: parseInt(process.env.RAMP_UP_TIME) || 60000,
    testDuration: parseInt(process.env.TEST_DURATION) || 300000,
    requestsPerSecond: parseInt(process.env.REQUESTS_PER_SECOND) || 100
  };
  
  const test = new PerformanceTest(config);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, stopping test...');
    test.stop();
  });
  
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, stopping test...');
    test.stop();
  });
  
  // Start the test
  test.startTest().catch(error => {
    logger.error('Performance test failed:', error);
    process.exit(1);
  });
}