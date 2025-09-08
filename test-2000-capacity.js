/**
 * NEXUS IDE - 2000 Capacity Test Script
 * ทดสอบความสามารถของระบบในการจัดการ 2000 MCP Servers/Agents
 */

const axios = require('axios');
const WebSocket = require('ws');
const { performance } = require('perf_hooks');

class CapacityTester {
  constructor() {
    this.apiGatewayUrl = 'http://localhost:8080';
    this.wsUrl = 'ws://localhost:8081';
    this.results = {
      httpTests: [],
      wsTests: [],
      loadTests: [],
      performanceMetrics: {}
    };
  }

  async testAPIGatewayHealth() {
    console.log('🔍 Testing API Gateway Health...');
    try {
      const start = performance.now();
      const response = await axios.get(`${this.apiGatewayUrl}/health`);
      const end = performance.now();
      
      console.log('✅ API Gateway Health Check:', {
        status: response.status,
        responseTime: `${(end - start).toFixed(2)}ms`,
        data: response.data
      });
      
      return { success: true, responseTime: end - start, data: response.data };
    } catch (error) {
      console.error('❌ API Gateway Health Check Failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testMCPServerCapacity() {
    console.log('🚀 Testing MCP Server Capacity (2000 servers)...');
    const results = [];
    
    // Test different batch sizes up to 2000
    const batchSizes = [10, 50, 100, 250, 500, 1000, 1500, 2000];
    
    for (const batchSize of batchSizes) {
      console.log(`📊 Testing batch size: ${batchSize}`);
      
      const start = performance.now();
      let successful = 0;
      let failed = 0;
      
      const promises = [];
      for (let i = 0; i < batchSize; i++) {
        const promise = this.testSingleMCPServer(i)
          .then(() => successful++)
          .catch(() => failed++);
        promises.push(promise);
      }
      
      await Promise.allSettled(promises);
      const end = performance.now();
      
      const result = {
        batchSize,
        successful,
        failed,
        duration: end - start,
        throughput: (successful / ((end - start) / 1000)).toFixed(2) + ' req/s'
      };
      
      results.push(result);
      console.log(`  Result:`, result);
      
      // Wait between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  async testSingleMCPServer(index) {
    try {
      const serverId = `test-server-${index}`;
      const response = await axios.post(`${this.apiGatewayUrl}/mcp/execute`, {
        serverId,
        method: 'ping',
        params: { timestamp: Date.now() }
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Server ${index} failed: ${error.message}`);
    }
  }

  async testWebSocketConnections() {
    console.log('🔌 Testing WebSocket Connections (2000 concurrent)...');
    const connections = [];
    const maxConnections = 2000;
    
    return new Promise((resolve) => {
      let connected = 0;
      let failed = 0;
      
      for (let i = 0; i < maxConnections; i++) {
        try {
          const ws = new WebSocket(this.wsUrl);
          
          ws.on('open', () => {
            connected++;
            if (connected + failed === maxConnections) {
              resolve({ connected, failed, total: maxConnections });
            }
          });
          
          ws.on('error', () => {
            failed++;
            if (connected + failed === maxConnections) {
              resolve({ connected, failed, total: maxConnections });
            }
          });
          
          connections.push(ws);
        } catch (error) {
          failed++;
        }
      }
      
      // Cleanup after test
      setTimeout(() => {
        connections.forEach(ws => {
          try {
            ws.close();
          } catch (e) {}
        });
      }, 10000);
    });
  }

  async testLoadBalancerDistribution() {
    console.log('⚖️ Testing Load Balancer Distribution (2000 requests)...');
    const requests = 2000;
    const results = [];
    
    for (let i = 0; i < requests; i++) {
      try {
        const start = performance.now();
        const response = await axios.get(`${this.apiGatewayUrl}/status`);
        const end = performance.now();
        
        results.push({
          requestId: i,
          responseTime: end - start,
          serverId: response.headers['x-server-id'] || 'unknown',
          success: true
        });
      } catch (error) {
        results.push({
          requestId: i,
          error: error.message,
          success: false
        });
      }
      
      // Small delay to prevent overwhelming
      if (i % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    return results;
  }

  async runFullCapacityTest() {
    console.log('\n🚀 NEXUS IDE - 2000 Capacity Test Starting...');
    const startTime = performance.now();
    
    try {
      // 1. API Gateway Health
      this.results.apiHealth = await this.testAPIGatewayHealth();
      
      // 2. MCP Server Capacity
      this.results.mcpCapacity = await this.testMCPServerCapacity();
      
      // 3. WebSocket Connections
      this.results.wsConnections = await this.testWebSocketConnections();
      
      // 4. Load Balancer Distribution
      this.results.loadBalancer = await this.testLoadBalancerDistribution();
      
      const endTime = performance.now();
      this.results.totalTestTime = endTime - startTime;
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Capacity test failed:', error);
    }
  }

  generateReport() {
    console.log('\n📊 NEXUS IDE - 2000 Capacity Test Report');
    console.log('=' .repeat(60));
    
    // API Gateway Health
    console.log('\n🔍 API Gateway Health:');
    console.log(`  Status: ${this.results.apiHealth?.success ? '✅ Healthy' : '❌ Failed'}`);
    if (this.results.apiHealth?.responseTime) {
      console.log(`  Response Time: ${this.results.apiHealth.responseTime.toFixed(2)}ms`);
    }
    
    // MCP Server Capacity
    console.log('\n🚀 MCP Server Capacity:');
    if (this.results.mcpCapacity) {
      this.results.mcpCapacity.forEach(result => {
        console.log(`  Batch ${result.batchSize}: ${result.successful}/${result.batchSize} (${result.throughput})`);
      });
    }
    
    // WebSocket Connections
    console.log('\n🔌 WebSocket Connections:');
    if (this.results.wsConnections) {
      const ws = this.results.wsConnections;
      console.log(`  Connected: ${ws.connected}/${ws.total} (${((ws.connected/ws.total)*100).toFixed(1)}%)`);
    }
    
    // Load Balancer
    console.log('\n⚖️ Load Balancer Distribution:');
    if (this.results.loadBalancer) {
      const successful = this.results.loadBalancer.filter(r => r.success).length;
      const total = this.results.loadBalancer.length;
      console.log(`  Success Rate: ${successful}/${total} (${((successful/total)*100).toFixed(1)}%)`);
    }
    
    console.log('\n⏱️  Total Test Time:', `${(this.results.totalTestTime / 1000).toFixed(2)}s`);
    
    // Overall Status
    const overallStatus = this.calculateOverallStatus();
    console.log(`  Overall: ${overallStatus ? '✅ READY FOR 2000+ AGENTS' : '⚠️  NEEDS ATTENTION'}`);
  }

  calculateOverallStatus() {
    const apiHealthy = this.results.apiHealth?.success;
    const mcpCapacityGood = this.results.mcpCapacity?.every(r => r.successful > r.batchSize * 0.8);
    const wsConnectionsGood = this.results.wsConnections?.connected > this.results.wsConnections?.total * 0.8;
    const loadBalancerGood = this.results.loadBalancer?.filter(r => r.success).length > this.results.loadBalancer?.length * 0.8;
    
    return apiHealthy && mcpCapacityGood && wsConnectionsGood && loadBalancerGood;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const tester = new CapacityTester();
  tester.runFullCapacityTest().catch(console.error);
}

module.exports = CapacityTester;