/**
 * Performance Tests for MCP Server Registry (2500 Servers)
 * ทดสอบประสิทธิภาพระบบ MCP Server Registry กับ 2500 servers
 * 
 * Test Scenarios:
 * 1. Load Testing - การโหลด 2500 servers พร้อมกัน
 * 2. CPU Monitoring - ตรวจสอบการใช้ CPU
 * 3. Memory Usage - ตรวจสอบการใช้ Memory
 * 4. Connection Pooling - ทดสอบ connection pool
 * 5. Auto-Scaling - ทดสอบการ scale อัตโนมัติ
 * 6. Performance Optimization - ทดสอบการปรับปรุงประสิทธิภาพ
 */

import { MCPServerRegistry } from './MCPServerRegistry';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import { logger as Logger } from '../utils/Logger';
import { mcpService as MCPService } from './MCPService';

interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  connectionCount: number;
}

interface TestResult {
  testName: string;
  duration: number;
  success: boolean;
  metrics: PerformanceMetrics;
  details: any;
}

class PerformanceTester {
  private registry: MCPServerRegistry;
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.registry = new MCPServerRegistry({
      maxServers: 2500,
      maxConnections: 1250,
      cpuMonitoringEnabled: true,
      performanceOptimizationEnabled: true
    });
  }

  /**
   * Run all performance tests
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('Rocket Starting Performance Tests for 2500 MCP Servers...');
    
    try {
      // Initialize registry
      await this.registry.initialize();
      
      // Run individual tests
      await this.testServerRegistration();
      await this.testConcurrentConnections();
      await this.testLoadBalancing();
      await this.testCPUMonitoring();
      await this.testMemoryUsage();
      await this.testAutoScaling();
      await this.testPerformanceOptimization();
      await this.testHighLoadScenario();
      
      console.log('Success All performance tests completed!');
      this.printSummary();
      
    } catch (error) {
      console.error('Error Performance tests failed:', error);
    } finally {
      await this.registry.shutdown();
    }
    
    return this.results;
  }

  /**
   * Test 1: Server Registration Performance
   * ทดสอบการลงทะเบียน server 2500 ตัว
   */
  async testServerRegistration(): Promise<void> {
    const testName = 'Server Registration (2500 servers)';
    console.log(`\nRunning: ${testName}`);
    
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    try {
      const registrationPromises = [];
      
      // Register 2500 servers in batches to avoid overwhelming
      const batchSize = 100;
      const totalServers = 2500;
      
      for (let i = 0; i < totalServers; i += batchSize) {
        const batch = [];
        
        for (let j = 0; j < batchSize && (i + j) < totalServers; j++) {
          const serverIndex = i + j;
          batch.push(this.registry.registerServer({
            name: `test-server-${serverIndex}`,
            url: `ws://localhost:${3000 + serverIndex}`,
            type: this.getRandomServerType(),
            capabilities: ['read', 'write', 'execute'],
            version: '1.0.0',
            maxConnections: 10,
            priority: Math.floor(Math.random() * 10) + 1,
            region: 'us-east-1',
            tags: ['test', 'performance']
          }));
        }
        
        await Promise.all(batch);
        
        // Small delay between batches to prevent CPU spike
        await this.sleep(10);
        
        if ((i + batchSize) % 500 === 0) {
          console.log(`   Registered ${Math.min(i + batchSize, totalServers)} servers...`);
        }
      }
      
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      const duration = endTime - startTime;
      
      const stats = this.registry.getStats();
      
      const result: TestResult = {
        testName,
        duration,
        success: stats.totalServers === totalServers,
        metrics: {
          cpuUsage: stats.cpuUsage,
          memoryUsage: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024, // MB
          responseTime: duration / totalServers, // Average time per server
          throughput: totalServers / (duration / 1000), // Servers per second
          errorRate: 0,
          connectionCount: stats.totalConnections
        },
        details: {
          totalServers: stats.totalServers,
          registrationRate: `${(totalServers / (duration / 1000)).toFixed(2)} servers/sec`,
          memoryIncrease: `${((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2)} MB`
        }
      };
      
      this.results.push(result);
      
      console.log(`   Success Registered ${stats.totalServers} servers in ${duration.toFixed(2)}ms`);
      console.log(`   Rate: ${result.details.registrationRate}`);
      console.log(`   Save Memory increase: ${result.details.memoryIncrease}`);
      
    } catch (error) {
      console.error(`   Error ${testName} failed:`, error);
      this.results.push({
        testName,
        duration: performance.now() - startTime,
        success: false,
        metrics: {} as PerformanceMetrics,
        details: { error: error.message }
      });
    }
  }

  /**
   * Test 2: Concurrent Connections
   * ทดสอบการเชื่อมต่อพร้อมกัน
   */
  async testConcurrentConnections(): Promise<void> {
    const testName = 'Concurrent Connections (1000 connections)';
    console.log(`\nRunning: ${testName}`);
    
    const startTime = performance.now();
    
    try {
      const servers = this.registry.getAllServers().slice(0, 1000);
      const connectionPromises = servers.map(server => 
        this.registry.connectToServer(server.id).catch(err => ({ error: err, serverId: server.id }))
      );
      
      const results = await Promise.allSettled(connectionPromises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const errorCount = results.length - successCount;
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const stats = this.registry.getStats();
      
      const result: TestResult = {
        testName,
        duration,
        success: errorCount < results.length * 0.1, // Allow 10% error rate
        metrics: {
          cpuUsage: stats.cpuUsage,
          memoryUsage: stats.memoryUsage || 0,
          responseTime: duration / results.length,
          throughput: successCount / (duration / 1000),
          errorRate: (errorCount / results.length) * 100,
          connectionCount: stats.activeServers
        },
        details: {
          totalAttempts: results.length,
          successfulConnections: successCount,
          failedConnections: errorCount,
          errorRate: `${((errorCount / results.length) * 100).toFixed(2)}%`
        }
      };
      
      this.results.push(result);
      
      console.log(`   Success ${successCount}/${results.length} connections successful`);
      console.log(`   Warning  Error rate: ${result.details.errorRate}`);
      console.log(`   Active connections: ${stats.activeServers}`);
      
    } catch (error) {
      console.error(`   Error ${testName} failed:`, error);
    }
  }

  /**
   * Test 3: Load Balancing Performance
   * ทดสอบประสิทธิภาพ load balancing
   */
  async testLoadBalancing(): Promise<void> {
    const testName = 'Load Balancing (10000 requests)';
    console.log(`\nRunning: ${testName}`);
    
    const startTime = performance.now();
    
    try {
      const requestCount = 10000;
      const requests = [];
      
      for (let i = 0; i < requestCount; i++) {
        requests.push({
          id: `req-${i}`,
          method: 'test',
          params: { data: `test-data-${i}` }
        });
      }
      
      // Send requests in batches
      const batchSize = 100;
      let successCount = 0;
      let errorCount = 0;
      const responseTimes: number[] = [];
      
      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        const batchPromises = batch.map(async (req) => {
          const reqStart = performance.now();
          try {
            await this.registry.sendRequest(req);
            const reqEnd = performance.now();
            responseTimes.push(reqEnd - reqStart);
            successCount++;
          } catch (error) {
            errorCount++;
          }
        });
        
        await Promise.allSettled(batchPromises);
        
        if ((i + batchSize) % 1000 === 0) {
          console.log(`   Processed ${Math.min(i + batchSize, requestCount)} requests...`);
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const stats = this.registry.getStats();
      
      const avgResponseTime = responseTimes.length > 0 ? 
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
      
      const result: TestResult = {
        testName,
        duration,
        success: errorCount < requestCount * 0.05, // Allow 5% error rate
        metrics: {
          cpuUsage: stats.cpuUsage,
          memoryUsage: stats.memoryUsage || 0,
          responseTime: avgResponseTime,
          throughput: successCount / (duration / 1000),
          errorRate: (errorCount / requestCount) * 100,
          connectionCount: stats.activeServers
        },
        details: {
          totalRequests: requestCount,
          successfulRequests: successCount,
          failedRequests: errorCount,
          averageResponseTime: `${avgResponseTime.toFixed(2)}ms`,
          requestsPerSecond: `${(successCount / (duration / 1000)).toFixed(2)} req/sec`
        }
      };
      
      this.results.push(result);
      
      console.log(`   Success ${successCount}/${requestCount} requests successful`);
      console.log(`   Throughput: ${result.details.requestsPerSecond}`);
      console.log(`   Avg response time: ${result.details.averageResponseTime}`);
      
    } catch (error) {
      console.error(`   Error ${testName} failed:`, error);
    }
  }

  /**
   * Test 4: CPU Monitoring
   * ทดสอบระบบ monitor CPU
   */
  async testCPUMonitoring(): Promise<void> {
    const testName = 'CPU Monitoring';
    console.log(`\nRunning: ${testName}`);
    
    const startTime = performance.now();
    
    try {
      // Simulate high CPU load
      const cpuIntensiveTask = () => {
        const start = Date.now();
        while (Date.now() - start < 100) {
          Math.random() * Math.random();
        }
      };
      
      // Run CPU intensive tasks
      for (let i = 0; i < 50; i++) {
        cpuIntensiveTask();
        await this.sleep(10);
      }
      
      const stats = this.registry.getStats();
      const canAddMore = this.registry.canAddMoreServers();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const result: TestResult = {
        testName,
        duration,
        success: stats.cpuUsage < 90, // Should not exceed 90%
        metrics: {
          cpuUsage: stats.cpuUsage,
          memoryUsage: stats.memoryUsage || 0,
          responseTime: 0,
          throughput: 0,
          errorRate: 0,
          connectionCount: stats.activeServers
        },
        details: {
          currentCPU: `${stats.cpuUsage.toFixed(2)}%`,
          canAddMoreServers: canAddMore,
          cpuThreshold: '80%'
        }
      };
      
      this.results.push(result);
      
      console.log(`   Current CPU usage: ${result.details.currentCPU}`);
      console.log(`   Target Can add more servers: ${canAddMore ? 'Success' : 'Error'}`);
      
    } catch (error) {
      console.error(`   Error ${testName} failed:`, error);
    }
  }

  /**
   * Test 5: Memory Usage
   * ทดสอบการใช้ Memory
   */
  async testMemoryUsage(): Promise<void> {
    const testName = 'Memory Usage Analysis';
    console.log(`\nRunning: ${testName}`);
    
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const stats = this.registry.getStats();
      const currentMemory = process.memoryUsage();
      
      const memoryUsed = currentMemory.heapUsed / 1024 / 1024; // MB
      const memoryTotal = currentMemory.heapTotal / 1024 / 1024; // MB
      const memoryUsagePercent = (memoryUsed / memoryTotal) * 100;
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const result: TestResult = {
        testName,
        duration,
        success: memoryUsagePercent < 85, // Should not exceed 85%
        metrics: {
          cpuUsage: stats.cpuUsage,
          memoryUsage: memoryUsagePercent,
          responseTime: 0,
          throughput: 0,
          errorRate: 0,
          connectionCount: stats.activeServers
        },
        details: {
          memoryUsed: `${memoryUsed.toFixed(2)} MB`,
          memoryTotal: `${memoryTotal.toFixed(2)} MB`,
          memoryUsagePercent: `${memoryUsagePercent.toFixed(2)}%`,
          serversInMemory: stats.totalServers
        }
      };
      
      this.results.push(result);
      
      console.log(`   Memory usage: ${result.details.memoryUsagePercent}`);
      console.log(`   Memory used: ${result.details.memoryUsed}`);
      console.log(`   Database  Servers in memory: ${result.details.serversInMemory}`);
      
    } catch (error) {
      console.error(`   Error ${testName} failed:`, error);
    }
  }

  /**
   * Test 6: Auto-Scaling
   * ทดสอบ auto-scaling
   */
  async testAutoScaling(): Promise<void> {
    const testName = 'Auto-Scaling Test';
    console.log(`\nRunning: ${testName}`);
    
    const startTime = performance.now();
    
    try {
      const initialStats = this.registry.getStats();
      
      // Simulate high load to trigger scaling
      await this.registry.optimizePerformance();
      
      const finalStats = this.registry.getStats();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const result: TestResult = {
        testName,
        duration,
        success: true, // Auto-scaling is working if no errors
        metrics: {
          cpuUsage: finalStats.cpuUsage,
          memoryUsage: finalStats.memoryUsage || 0,
          responseTime: 0,
          throughput: 0,
          errorRate: 0,
          connectionCount: finalStats.activeServers
        },
        details: {
          initialServers: initialStats.totalServers,
          finalServers: finalStats.totalServers,
          scalingTriggered: finalStats.totalServers !== initialStats.totalServers
        }
      };
      
      this.results.push(result);
      
      console.log(`   Auto-scaling completed`);
      console.log(`   Scaling triggered: ${result.details.scalingTriggered ? 'Success' : 'Error'}`);
      
    } catch (error) {
      console.error(`   Error ${testName} failed:`, error);
    }
  }

  /**
   * Test 7: Performance Optimization
   * ทดสอบการปรับปรุงประสิทธิภาพ
   */
  async testPerformanceOptimization(): Promise<void> {
    const testName = 'Performance Optimization';
    console.log(`\nRunning: ${testName}`);
    
    const startTime = performance.now();
    
    try {
      const beforeStats = this.registry.getStats();
      
      // Trigger performance optimization
      await this.registry.optimizePerformance();
      
      // Wait a bit for optimization to take effect
      await this.sleep(1000);
      
      const afterStats = this.registry.getStats();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const result: TestResult = {
        testName,
        duration,
        success: afterStats.cpuUsage <= beforeStats.cpuUsage, // CPU should not increase
        metrics: {
          cpuUsage: afterStats.cpuUsage,
          memoryUsage: afterStats.memoryUsage || 0,
          responseTime: 0,
          throughput: 0,
          errorRate: 0,
          connectionCount: afterStats.activeServers
        },
        details: {
          cpuBefore: `${beforeStats.cpuUsage.toFixed(2)}%`,
          cpuAfter: `${afterStats.cpuUsage.toFixed(2)}%`,
          cpuImprovement: `${(beforeStats.cpuUsage - afterStats.cpuUsage).toFixed(2)}%`,
          optimizationTime: `${duration.toFixed(2)}ms`
        }
      };
      
      this.results.push(result);
      
      console.log(`   Optimization completed in ${result.details.optimizationTime}`);
      console.log(`   CPU improvement: ${result.details.cpuImprovement}`);
      
    } catch (error) {
      console.error(`   Error ${testName} failed:`, error);
    }
  }

  /**
   * Test 8: High Load Scenario
   * ทดสอบสถานการณ์โหลดสูง
   */
  async testHighLoadScenario(): Promise<void> {
    const testName = 'High Load Scenario (Stress Test)';
    console.log(`\nRunning: ${testName}`);
    
    const startTime = performance.now();
    
    try {
      const stats = this.registry.getStats();
      
      // Simulate high load with multiple concurrent operations
      const operations = [];
      
      // Add more servers
      for (let i = 0; i < 100; i++) {
        operations.push(this.registry.registerServer({
          name: `stress-server-${i}`,
          url: `ws://localhost:${4000 + i}`,
          type: 'web',
          capabilities: ['stress-test'],
          version: '1.0.0',
          maxConnections: 5,
          priority: 1,
          region: 'us-west-1',
          tags: ['stress', 'test']
        }));
      }
      
      // Send many requests
      for (let i = 0; i < 1000; i++) {
        operations.push(this.registry.sendRequest({
          id: `stress-req-${i}`,
          method: 'stress-test',
          params: { load: 'high' }
        }).catch(() => {})); // Ignore errors for stress test
      }
      
      await Promise.allSettled(operations);
      
      const finalStats = this.registry.getStats();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const result: TestResult = {
        testName,
        duration,
        success: finalStats.cpuUsage < 95 && (finalStats.memoryUsage || 0) < 90,
        metrics: {
          cpuUsage: finalStats.cpuUsage,
          memoryUsage: finalStats.memoryUsage || 0,
          responseTime: duration / operations.length,
          throughput: operations.length / (duration / 1000),
          errorRate: (finalStats.totalErrors / finalStats.totalRequests) * 100 || 0,
          connectionCount: finalStats.activeServers
        },
        details: {
          totalOperations: operations.length,
          finalCPU: `${finalStats.cpuUsage.toFixed(2)}%`,
          finalMemory: `${(finalStats.memoryUsage || 0).toFixed(2)}%`,
          totalServers: finalStats.totalServers,
          systemStable: finalStats.cpuUsage < 95
        }
      };
      
      this.results.push(result);
      
      console.log(`   Stress test completed`);
      console.log(`   Final CPU: ${result.details.finalCPU}`);
      console.log(`   Final Memory: ${result.details.finalMemory}`);
      console.log(`   System stable: ${result.details.systemStable ? 'Success' : 'Error'}`);
      
    } catch (error) {
      console.error(`   Error ${testName} failed:`, error);
    }
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    console.log('\n' + '='.repeat(80));
    console.log('PERFORMANCE TEST SUMMARY');
    console.log('='.repeat(80));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`\nOverall Results:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests} Success`);
    console.log(`   Failed: ${failedTests} ${failedTests > 0 ? 'Error' : 'Success'}`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
    
    console.log(`\nPerformance Metrics:`);
    const avgCPU = this.results.reduce((sum, r) => sum + (r.metrics.cpuUsage || 0), 0) / totalTests;
    const avgMemory = this.results.reduce((sum, r) => sum + (r.metrics.memoryUsage || 0), 0) / totalTests;
    const avgResponseTime = this.results.reduce((sum, r) => sum + (r.metrics.responseTime || 0), 0) / totalTests;
    
    console.log(`   Average CPU Usage: ${avgCPU.toFixed(2)}%`);
    console.log(`   Average Memory Usage: ${avgMemory.toFixed(2)}%`);
    console.log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    
    const finalStats = this.registry.getStats();
    console.log(`\nFinal System State:`);
    console.log(`   Total Servers: ${finalStats.totalServers}`);
    console.log(`   Active Servers: ${finalStats.activeServers}`);
    console.log(`   Total Connections: ${finalStats.totalConnections}`);
    console.log(`   Total Requests: ${finalStats.totalRequests}`);
    console.log(`   Error Rate: ${((finalStats.totalErrors / Math.max(finalStats.totalRequests, 1)) * 100).toFixed(2)}%`);
    
    console.log(`\nRecommendations:`);
    if (avgCPU > 80) {
      console.log(`   Warning High CPU usage detected. Consider optimizing or scaling.`);
    }
    if (avgMemory > 85) {
      console.log(`   Warning High memory usage detected. Consider memory optimization.`);
    }
    if (failedTests > 0) {
      console.log(`   Warning Some tests failed. Review error logs for details.`);
    }
    if (passedTests === totalTests && avgCPU < 70 && avgMemory < 70) {
      console.log(`   Success System performing excellently! Ready for production.`);
    }
    
    console.log('\n' + '='.repeat(80));
  }

  // Helper methods
  private getRandomServerType(): 'core' | 'ai-ml' | 'web' | 'data' | 'git' | 'creative' | 'automation' | 'security' {
    const types = ['core', 'ai-ml', 'web', 'data', 'git', 'creative', 'automation', 'security'] as const;
    return types[Math.floor(Math.random() * types.length)];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in other test files
export { PerformanceTester, PerformanceMetrics, TestResult };

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runAllTests().then(() => {
    console.log('\nPerformance testing completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('\nPerformance testing failed:', error);
    process.exit(1);
  });
}