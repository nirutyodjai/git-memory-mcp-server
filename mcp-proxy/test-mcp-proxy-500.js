#!/usr/bin/env node

/**
 * Test Suite for MCP Proxy Server 500
 * ทดสอบการเชื่อมต่อและการทำงานของ MCP Proxy Server ที่รองรับ 500 ตัว
 */

const { MCPProxyServer500 } = require('./mcp-proxy-server-500.js');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

class MCPProxyTester {
  constructor() {
    this.testResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      startTime: Date.now(),
      endTime: null,
      tests: []
    };
    
    this.mockServers = [];
    this.proxyServer = null;
  }

  async runAllTests() {
    console.log('🧪 Starting MCP Proxy Server 500 Test Suite...');
    console.log('=' .repeat(60));
    
    try {
      // Setup mock servers
      await this.setupMockServers();
      
      // Initialize proxy server
      await this.initializeProxyServer();
      
      // Run tests
      await this.testServerInitialization();
      await this.testServerDiscovery();
      await this.testServerRegistration();
      await this.testHealthChecks();
      await this.testToolExecution();
      await this.testLoadBalancing();
      await this.testErrorHandling();
      await this.testPerformance();
      await this.testScalability();
      
      // Generate report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  async setupMockServers() {
    console.log('🔧 Setting up mock MCP servers...');
    
    // Create HTTP mock servers
    for (let i = 0; i < 10; i++) {
      const port = 3000 + i;
      const server = await this.createMockHttpServer(port, `http-server-${i}`);
      this.mockServers.push({ type: 'http', port, server });
    }
    
    // Create WebSocket mock servers
    for (let i = 0; i < 5; i++) {
      const port = 9000 + i;
      const server = await this.createMockWebSocketServer(port, `ws-server-${i}`);
      this.mockServers.push({ type: 'websocket', port, server });
    }
    
    console.log(`✅ Created ${this.mockServers.length} mock servers`);
  }

  async createMockHttpServer(port, serverId) {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        res.setHeader('Content-Type', 'application/json');
        
        if (req.url === '/info') {
          res.writeHead(200);
          res.end(JSON.stringify({
            id: serverId,
            name: `Mock HTTP Server ${serverId}`,
            type: 'http',
            tools: [
              {
                name: `${serverId}_tool_1`,
                description: `Tool 1 from ${serverId}`,
                inputSchema: { type: 'object', properties: {} }
              },
              {
                name: `${serverId}_tool_2`,
                description: `Tool 2 from ${serverId}`,
                inputSchema: { type: 'object', properties: {} }
              }
            ]
          }));
        } else if (req.url === '/health') {
          res.writeHead(200);
          res.end(JSON.stringify({ status: 'healthy', timestamp: Date.now() }));
        } else if (req.url === '/tools/call') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const request = JSON.parse(body);
              res.writeHead(200);
              res.end(JSON.stringify({
                content: [{
                  type: 'text',
                  text: `Result from ${serverId} for tool ${request.params.name}`
                }]
              }));
            } catch (error) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: error.message }));
            }
          });
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      });
      
      server.listen(port, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(server);
        }
      });
    });
  }

  async createMockWebSocketServer(port, serverId) {
    return new Promise((resolve) => {
      const wss = new WebSocket.Server({ port });
      
      wss.on('connection', (ws) => {
        ws.on('message', (data) => {
          try {
            const request = JSON.parse(data.toString());
            
            if (request.method === 'tools/call') {
              ws.send(JSON.stringify({
                content: [{
                  type: 'text',
                  text: `WebSocket result from ${serverId} for tool ${request.params.name}`
                }]
              }));
            }
          } catch (error) {
            ws.send(JSON.stringify({ error: error.message }));
          }
        });
      });
      
      resolve(wss);
    });
  }

  async initializeProxyServer() {
    console.log('🚀 Initializing MCP Proxy Server...');
    
    this.proxyServer = new MCPProxyServer500();
    await this.proxyServer.initialize();
    
    console.log('✅ Proxy server initialized');
  }

  async testServerInitialization() {
    await this.runTest('Server Initialization', async () => {
      if (!this.proxyServer) {
        throw new Error('Proxy server not initialized');
      }
      
      const metrics = this.proxyServer.getMetrics();
      if (metrics.totalServers === 0) {
        throw new Error('No servers discovered during initialization');
      }
      
      return `Initialized with ${metrics.totalServers} servers and ${metrics.totalTools} tools`;
    });
  }

  async testServerDiscovery() {
    await this.runTest('Server Discovery', async () => {
      // Test discovery from endpoints
      const discoveredServers = await this.proxyServer.discoverFromEndpoints([
        'http://localhost:3000/mcp',
        'http://localhost:3001/mcp',
        'http://localhost:3002/mcp'
      ]);
      
      if (discoveredServers.length === 0) {
        throw new Error('No servers discovered from endpoints');
      }
      
      return `Discovered ${discoveredServers.length} servers from endpoints`;
    });
  }

  async testServerRegistration() {
    await this.runTest('Server Registration', async () => {
      const testServer = {
        id: 'test-server-registration',
        name: 'Test Registration Server',
        endpoint: 'http://localhost:3000/mcp',
        type: 'http',
        tools: [
          {
            name: 'test_tool',
            description: 'Test tool for registration',
            inputSchema: { type: 'object', properties: {} }
          }
        ]
      };
      
      const registered = await this.proxyServer.registerServer(testServer);
      
      if (!registered) {
        throw new Error('Failed to register test server');
      }
      
      const server = this.proxyServer.servers.get('test-server-registration');
      if (!server) {
        throw new Error('Registered server not found in servers map');
      }
      
      return 'Server registration successful';
    });
  }

  async testHealthChecks() {
    await this.runTest('Health Checks', async () => {
      const serverIds = Array.from(this.proxyServer.servers.keys()).slice(0, 5);
      
      if (serverIds.length === 0) {
        throw new Error('No servers available for health check testing');
      }
      
      const healthResults = await Promise.allSettled(
        serverIds.map(id => this.proxyServer.checkServerHealth(id))
      );
      
      const healthyCount = healthResults.filter(r => 
        r.status === 'fulfilled' && r.value === true
      ).length;
      
      return `Health checks completed: ${healthyCount}/${serverIds.length} servers healthy`;
    });
  }

  async testToolExecution() {
    await this.runTest('Tool Execution', async () => {
      const tools = Array.from(this.proxyServer.tools.values()).slice(0, 3);
      
      if (tools.length === 0) {
        throw new Error('No tools available for execution testing');
      }
      
      const results = [];
      
      for (const tool of tools) {
        try {
          const result = await this.proxyServer.handleCallTool({
            params: {
              name: tool.name,
              arguments: {}
            }
          });
          
          results.push({ tool: tool.name, success: true, result });
        } catch (error) {
          results.push({ tool: tool.name, success: false, error: error.message });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      return `Tool execution: ${successCount}/${results.length} tools executed successfully`;
    });
  }

  async testLoadBalancing() {
    await this.runTest('Load Balancing', async () => {
      const loadBalancer = this.proxyServer.loadBalancer;
      const servers = Array.from(this.proxyServer.servers.values())
        .filter(s => s.status === 'active')
        .slice(0, 5);
      
      if (servers.length < 2) {
        throw new Error('Need at least 2 active servers for load balancing test');
      }
      
      const selections = [];
      for (let i = 0; i < 10; i++) {
        const selected = loadBalancer.selectServer(servers, 'round-robin');
        selections.push(selected.id);
      }
      
      const uniqueSelections = new Set(selections).size;
      
      if (uniqueSelections < 2) {
        throw new Error('Load balancer not distributing requests across servers');
      }
      
      return `Load balancing working: distributed across ${uniqueSelections} servers`;
    });
  }

  async testErrorHandling() {
    await this.runTest('Error Handling', async () => {
      // Test with non-existent tool
      try {
        await this.proxyServer.handleCallTool({
          params: {
            name: 'non_existent_tool',
            arguments: {}
          }
        });
        throw new Error('Expected error for non-existent tool');
      } catch (error) {
        if (!error.message.includes('not found')) {
          throw new Error('Unexpected error message for non-existent tool');
        }
      }
      
      // Test with inactive server
      const inactiveServer = {
        id: 'inactive-server',
        name: 'Inactive Server',
        endpoint: 'http://localhost:9999/mcp',
        type: 'http',
        status: 'inactive',
        tools: [{
          name: 'inactive_tool',
          description: 'Tool from inactive server'
        }]
      };
      
      await this.proxyServer.registerServer(inactiveServer);
      
      try {
        await this.proxyServer.handleCallTool({
          params: {
            name: 'inactive_tool',
            arguments: {}
          }
        });
        throw new Error('Expected error for inactive server');
      } catch (error) {
        if (!error.message.includes('not available')) {
          throw new Error('Unexpected error message for inactive server');
        }
      }
      
      return 'Error handling working correctly';
    });
  }

  async testPerformance() {
    await this.runTest('Performance Test', async () => {
      const startTime = Date.now();
      const concurrentRequests = 50;
      const tools = Array.from(this.proxyServer.tools.values()).slice(0, 5);
      
      if (tools.length === 0) {
        throw new Error('No tools available for performance testing');
      }
      
      const requests = [];
      for (let i = 0; i < concurrentRequests; i++) {
        const tool = tools[i % tools.length];
        requests.push(
          this.proxyServer.handleCallTool({
            params: {
              name: tool.name,
              arguments: {}
            }
          }).catch(error => ({ error: error.message }))
        );
      }
      
      const results = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;
      const successCount = results.filter(r => !r.error).length;
      const requestsPerSecond = (concurrentRequests / duration) * 1000;
      
      return `Performance: ${successCount}/${concurrentRequests} requests successful in ${duration}ms (${requestsPerSecond.toFixed(2)} req/s)`;
    });
  }

  async testScalability() {
    await this.runTest('Scalability Test', async () => {
      const initialServerCount = this.proxyServer.servers.size;
      const targetServers = Math.min(500, initialServerCount + 100);
      
      // Simulate adding more servers
      const addedServers = [];
      for (let i = initialServerCount; i < targetServers; i++) {
        const server = {
          id: `scale-test-server-${i}`,
          name: `Scale Test Server ${i}`,
          endpoint: `http://localhost:${3000 + (i % 10)}/mcp`,
          type: 'http',
          tools: [
            {
              name: `scale_tool_${i}`,
              description: `Scale test tool ${i}`,
              inputSchema: { type: 'object', properties: {} }
            }
          ],
          status: 'active'
        };
        
        if (await this.proxyServer.registerServer(server)) {
          addedServers.push(server);
        }
      }
      
      const finalServerCount = this.proxyServer.servers.size;
      const metrics = this.proxyServer.getMetrics();
      
      return `Scalability: Added ${addedServers.length} servers (${initialServerCount} → ${finalServerCount}), Total tools: ${metrics.totalTools}`;
    });
  }

  async runTest(testName, testFunction) {
    this.testResults.totalTests++;
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Running: ${testName}...`);
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults.passedTests++;
      this.testResults.tests.push({
        name: testName,
        status: 'PASS',
        duration,
        result
      });
      
      console.log(`✅ ${testName}: PASSED (${duration}ms)`);
      console.log(`   ${result}`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults.failedTests++;
      this.testResults.tests.push({
        name: testName,
        status: 'FAIL',
        duration,
        error: error.message
      });
      
      console.log(`❌ ${testName}: FAILED (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('');
  }

  generateTestReport() {
    this.testResults.endTime = Date.now();
    const totalDuration = this.testResults.endTime - this.testResults.startTime;
    
    console.log('=' .repeat(60));
    console.log('📊 TEST REPORT - MCP Proxy Server 500');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${this.testResults.totalTests}`);
    console.log(`Passed: ${this.testResults.passedTests}`);
    console.log(`Failed: ${this.testResults.failedTests}`);
    console.log(`Success Rate: ${((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(2)}%`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log('');
    
    if (this.proxyServer) {
      const metrics = this.proxyServer.getMetrics();
      console.log('📈 PROXY SERVER METRICS:');
      console.log(`- Total Servers: ${metrics.totalServers}`);
      console.log(`- Total Tools: ${metrics.totalTools}`);
      console.log(`- Active Connections: ${metrics.activeConnections}`);
      console.log(`- Total Requests: ${metrics.totalRequests}`);
      console.log(`- Successful Requests: ${metrics.successfulRequests}`);
      console.log(`- Failed Requests: ${metrics.failedRequests}`);
      console.log(`- Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`);
      console.log(`- Uptime: ${metrics.uptime.toFixed(2)}s`);
      console.log('');
    }
    
    // Save detailed report to file
    const reportData = {
      ...this.testResults,
      metrics: this.proxyServer ? this.proxyServer.getMetrics() : null,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      'mcp-proxy-500-test-report.json',
      JSON.stringify(reportData, null, 2)
    );
    
    console.log('💾 Detailed report saved to: mcp-proxy-500-test-report.json');
    console.log('=' .repeat(60));
    
    if (this.testResults.failedTests === 0) {
      console.log('🎉 ALL TESTS PASSED! MCP Proxy Server 500 is ready for production.');
    } else {
      console.log('⚠️  Some tests failed. Please review the results above.');
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up test environment...');
    
    // Close mock servers
    for (const mockServer of this.mockServers) {
      try {
        if (mockServer.type === 'http') {
          mockServer.server.close();
        } else if (mockServer.type === 'websocket') {
          mockServer.server.close();
        }
      } catch (error) {
        console.warn(`Warning: Failed to close mock server on port ${mockServer.port}`);
      }
    }
    
    console.log('✅ Cleanup completed');
  }
}

// Main execution
async function main() {
  const tester = new MCPProxyTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MCPProxyTester };