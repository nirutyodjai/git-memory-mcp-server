/**
 * NEXUS IDE Integration Test Suite
 * Comprehensive tests for Git Memory MCP Server integration with NEXUS IDE
 */

const { describe, it, before, after, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const WebSocket = require('ws');

const NexusDeployment = require('../scripts/deploy-to-nexus');
const NexusIntegrationMonitor = require('../scripts/monitor-nexus-integration');

class NexusIntegrationTestSuite {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.configPath = path.join(this.projectRoot, 'nexus-integration.config.json');
    this.testServerProcess = null;
    this.testPort = 0;
    this.config = null;
    
    this.loadConfiguration();
  }

  loadConfiguration() {
    try {
      this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  async startTestServer() {
    return new Promise((resolve, reject) => {
      this.testServerProcess = spawn('node', ['test-server.js'], {
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let serverStarted = false;
      let output = '';

      this.testServerProcess.stdout.on('data', (data) => {
        output += data.toString();
        
        // Look for server started message
        if (typeof output === 'string' && output.includes('Server listening on port') && !serverStarted) {
          serverStarted = true;
          
          // Extract port number
          const portMatch = output.match(/Server listening on port (\d+)/);
          if (portMatch) {
            this.testPort = parseInt(portMatch[1]);
            resolve(this.testPort);
          } else {
            reject(new Error('Could not extract server port'));
          }
        }
      });

      this.testServerProcess.stderr.on('data', (data) => {
        console.error('Test server error:', data.toString());
      });

      this.testServerProcess.on('error', (error) => {
        reject(new Error(`Failed to start test server: ${error.message}`));
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!serverStarted) {
          reject(new Error('Test server startup timeout'));
        }
      }, 30000);
    });
  }

  async stopTestServer() {
    if (this.testServerProcess) {
      this.testServerProcess.kill('SIGTERM');
      
      return new Promise((resolve) => {
        this.testServerProcess.on('exit', () => {
          this.testServerProcess = null;
          resolve();
        });
        
        // Force kill after 5 seconds
        setTimeout(() => {
          if (this.testServerProcess) {
            this.testServerProcess.kill('SIGKILL');
            this.testServerProcess = null;
          }
          resolve();
        }, 5000);
      });
    }
  }

  async makeHttpRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: this.testPort,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NEXUS-Integration-Test/1.0'
        },
        timeout: 10000
      };

      if (data) {
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const parsedData = responseData ? JSON.parse(responseData) : {};
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: parsedData,
              raw: responseData
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: null,
              raw: responseData
            });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      req.setTimeout(10000);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async testWebSocketConnection() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${this.testPort}/ws`);
      
      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'pong') {
            ws.close();
            resolve(message);
          }
        } catch (error) {
          reject(new Error('Invalid WebSocket message format'));
        }
      });
      
      ws.on('error', reject);
      
      setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 10000);
    });
  }
}

// Test Suite
describe('NEXUS IDE Integration Tests', function() {
  this.timeout(60000); // 60 second timeout for all tests
  
  let testSuite;
  
  before(async function() {
    console.log('🚀 Setting up NEXUS IDE integration test suite...');
    testSuite = new NexusIntegrationTestSuite();
    
    // Start test server
    const port = await testSuite.startTestServer();
    console.log(`✅ Test server started on port ${port}`);
    
    // Wait for server to be fully ready
    await new Promise(resolve => setTimeout(resolve, 3000));
  });
  
  after(async function() {
    console.log('🧹 Cleaning up test environment...');
    if (testSuite) {
      await testSuite.stopTestServer();
    }
    console.log('✅ Test cleanup completed');
  });

  describe('Server Health and Connectivity', function() {
    it('should respond to health check endpoint', async function() {
      const response = await testSuite.makeHttpRequest('/health');
      
      expect(response.statusCode).to.equal(200);
      expect(response.data).to.have.property('status', 'ok');
      expect(response.data).to.have.property('timestamp');
      expect(response.data).to.have.property('uptime');
    });
    
    it('should provide server information', async function() {
      const response = await testSuite.makeHttpRequest('/info');
      
      expect(response.statusCode).to.equal(200);
      expect(response.data).to.have.property('name');
      expect(response.data).to.have.property('version');
      expect(response.data).to.have.property('capabilities');
    });
    
    it('should handle CORS preflight requests', async function() {
      const response = await testSuite.makeHttpRequest('/health', 'OPTIONS');
      
      expect(response.statusCode).to.equal(200);
      expect(response.headers).to.have.property('access-control-allow-origin');
      expect(response.headers).to.have.property('access-control-allow-methods');
    });
  });

  describe('MCP Protocol Compliance', function() {
    it('should handle MCP initialization', async function() {
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            roots: { listChanged: true },
            sampling: {}
          },
          clientInfo: {
            name: 'NEXUS-IDE-Test',
            version: '1.0.0'
          }
        }
      };
      
      const response = await testSuite.makeHttpRequest('/mcp', 'POST', initRequest);
      
      expect(response.statusCode).to.equal(200);
      expect(response.data).to.have.property('jsonrpc', '2.0');
      expect(response.data).to.have.property('id', 1);
      expect(response.data).to.have.property('result');
      expect(response.data.result).to.have.property('protocolVersion');
      expect(response.data.result).to.have.property('capabilities');
    });
    
    it('should list available tools', async function() {
      const toolsRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      };
      
      const response = await testSuite.makeHttpRequest('/mcp', 'POST', toolsRequest);
      
      expect(response.statusCode).to.equal(200);
      expect(response.data).to.have.property('result');
      expect(response.data.result).to.have.property('tools');
      expect(response.data.result.tools).to.be.an('array');
      expect(response.data.result.tools.length).to.be.greaterThan(0);
    });
    
    it('should handle tool execution', async function() {
      const toolRequest = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'git_status',
          arguments: {}
        }
      };
      
      const response = await testSuite.makeHttpRequest('/mcp', 'POST', toolRequest);
      
      expect(response.statusCode).to.equal(200);
      expect(response.data).to.have.property('result');
      expect(response.data.result).to.have.property('content');
    });
  });

  describe('Git Operations', function() {
    it('should get git status', async function() {
      const response = await testSuite.makeHttpRequest('/git/status');
      
      expect(response.statusCode).to.equal(200);
      expect(response.data).to.have.property('status');
      expect(response.data).to.have.property('branch');
      expect(response.data).to.have.property('files');
    });
    
    it('should get git log', async function() {
      const response = await testSuite.makeHttpRequest('/git/log?limit=5');
      
      expect(response.statusCode).to.equal(200);
      expect(response.data).to.have.property('commits');
      expect(response.data.commits).to.be.an('array');
    });
    
    it('should get git branches', async function() {
      const response = await testSuite.makeHttpRequest('/git/branches');
      
      expect(response.statusCode).to.equal(200);
      expect(response.data).to.have.property('branches');
      expect(response.data.branches).to.be.an('array');
      expect(response.data).to.have.property('current');
    });
  });

  describe('Memory Management', function() {
    it('should load and access memory', async function() {
      const response = await testSuite.makeHttpRequest('/memory/status');
      
      expect(response.statusCode).to.equal(200);
      expect(response.data).to.have.property('loaded');
      expect(response.data).to.have.property('entries');
      expect(response.data).to.have.property('size');
    });
    
    it('should search memory', async function() {
      const searchRequest = {
        query: 'test',
        limit: 10
      };
      
      const response = await testSuite.makeHttpRequest('/memory/search', 'POST', searchRequest);
      
      expect(response.statusCode).to.equal(200);
      expect(response.data).to.have.property('results');
      expect(response.data.results).to.be.an('array');
      expect(response.data).to.have.property('total');
    });
    
    it('should add memory entry', async function() {
      const memoryEntry = {
        type: 'test',
        content: 'This is a test memory entry',
        metadata: {
          source: 'integration-test',
          timestamp: new Date().toISOString()
        }
      };
      
      const response = await testSuite.makeHttpRequest('/memory/add', 'POST', memoryEntry);
      
      expect(response.statusCode).to.equal(201);
      expect(response.data).to.have.property('id');
      expect(response.data).to.have.property('success', true);
    });
  });

  describe('WebSocket Communication', function() {
    it('should establish WebSocket connection', async function() {
      const response = await testSuite.testWebSocketConnection();
      
      expect(response).to.have.property('type', 'pong');
      expect(response).to.have.property('timestamp');
    });
  });

  describe('Performance and Load Testing', function() {
    it('should handle multiple concurrent requests', async function() {
      const requests = [];
      const numRequests = 10;
      
      for (let i = 0; i < numRequests; i++) {
        requests.push(testSuite.makeHttpRequest('/health'));
      }
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.statusCode).to.equal(200);
        expect(response.data).to.have.property('status', 'ok');
      });
    });
    
    it('should respond within acceptable time limits', async function() {
      const startTime = Date.now();
      const response = await testSuite.makeHttpRequest('/health');
      const responseTime = Date.now() - startTime;
      
      expect(response.statusCode).to.equal(200);
      expect(responseTime).to.be.lessThan(1000); // Should respond within 1 second
    });
    
    it('should handle large memory searches efficiently', async function() {
      const searchRequest = {
        query: 'function',
        limit: 100
      };
      
      const startTime = Date.now();
      const response = await testSuite.makeHttpRequest('/memory/search', 'POST', searchRequest);
      const responseTime = Date.now() - startTime;
      
      expect(response.statusCode).to.equal(200);
      expect(responseTime).to.be.lessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Error Handling', function() {
    it('should handle invalid endpoints gracefully', async function() {
      const response = await testSuite.makeHttpRequest('/invalid/endpoint');
      
      expect(response.statusCode).to.equal(404);
      expect(response.data).to.have.property('error');
    });
    
    it('should handle malformed JSON requests', async function() {
      const response = await testSuite.makeHttpRequest('/mcp', 'POST', 'invalid json');
      
      expect(response.statusCode).to.equal(400);
      expect(response.data).to.have.property('error');
    });
    
    it('should handle missing required parameters', async function() {
      const invalidRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call'
        // Missing params
      };
      
      const response = await testSuite.makeHttpRequest('/mcp', 'POST', invalidRequest);
      
      expect(response.statusCode).to.equal(400);
      expect(response.data).to.have.property('error');
    });
  });

  describe('Security', function() {
    it('should include security headers', async function() {
      const response = await testSuite.makeHttpRequest('/health');
      
      expect(response.headers).to.have.property('x-content-type-options');
      expect(response.headers).to.have.property('x-frame-options');
      expect(response.headers).to.have.property('x-xss-protection');
    });
    
    it('should handle authentication if configured', async function() {
      // This test would check authentication if it's enabled
      // For now, we just verify the endpoint is accessible
      const response = await testSuite.makeHttpRequest('/health');
      expect(response.statusCode).to.equal(200);
    });
  });

  describe('NEXUS IDE Specific Features', function() {
    it('should provide NEXUS IDE configuration', async function() {
      const response = await testSuite.makeHttpRequest('/nexus/config');
      
      expect(response.statusCode).to.equal(200);
      expect(response.data).to.have.property('nexusIDE');
      expect(response.data).to.have.property('integration');
    });
    
    it('should support NEXUS IDE capabilities query', async function() {
      const response = await testSuite.makeHttpRequest('/nexus/capabilities');
      
      expect(response.statusCode).to.equal(200);
      expect(response.data).to.have.property('capabilities');
      expect(response.data.capabilities).to.be.an('array');
    });
    
    it('should provide deployment information', async function() {
      const response = await testSuite.makeHttpRequest('/nexus/deployment');
      
      expect(response.statusCode).to.equal(200);
      expect(response.data).to.have.property('version');
      expect(response.data).to.have.property('environment');
      expect(response.data).to.have.property('status');
    });
  });
});

// Integration Test Runner
class IntegrationTestRunner {
  static async runTests() {
    console.log('🧪 Starting NEXUS IDE Integration Tests...');
    
    try {
      // Run the test suite
      const Mocha = require('mocha');
      const mocha = new Mocha({
        timeout: 60000,
        reporter: 'spec',
        color: true
      });
      
      mocha.addFile(__filename);
      
      return new Promise((resolve, reject) => {
        mocha.run((failures) => {
          if (failures) {
            reject(new Error(`${failures} test(s) failed`));
          } else {
            resolve();
          }
        });
      });
      
    } catch (error) {
      console.error('❌ Integration test error:', error.message);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  IntegrationTestRunner.runTests()
    .then(() => {
      console.log('✅ All integration tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Integration tests failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  NexusIntegrationTestSuite,
  IntegrationTestRunner
};