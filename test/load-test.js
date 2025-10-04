import { PerformanceTest } from './performance-test.js';
import { createLogger } from 'winston';
import fs from 'fs/promises';
import path from 'path';

const logger = createLogger({
  level: 'info',
  format: logger.format.combine(
    logger.format.timestamp(),
    logger.format.colorize(),
    logger.format.simple()
  ),
  transports: [
    new logger.transports.Console()
  ]
});

export class LoadTest {
  constructor() {
    this.scenarios = [
      {
        name: 'Light Load',
        maxConnections: 500,
        requestsPerSecond: 50,
        testDuration: 120000, // 2 minutes
        rampUpTime: 30000 // 30 seconds
      },
      {
        name: 'Medium Load',
        maxConnections: 1500,
        requestsPerSecond: 100,
        testDuration: 180000, // 3 minutes
        rampUpTime: 45000 // 45 seconds
      },
      {
        name: 'Heavy Load',
        maxConnections: 3000,
        requestsPerSecond: 200,
        testDuration: 300000, // 5 minutes
        rampUpTime: 60000 // 1 minute
      },
      {
        name: 'Stress Test',
        maxConnections: 4000,
        requestsPerSecond: 300,
        testDuration: 180000, // 3 minutes
        rampUpTime: 30000 // 30 seconds
      },
      {
        name: 'Spike Test',
        maxConnections: 5000,
        requestsPerSecond: 500,
        testDuration: 60000, // 1 minute
        rampUpTime: 10000 // 10 seconds
      }
    ];
    
    this.results = [];
  }

  // Run all load test scenarios
  async runAllScenarios(serverUrl = 'ws://localhost:3000') {
    logger.info('Starting comprehensive load test suite');
    logger.info(`Target server: ${serverUrl}`);
    
    const overallStartTime = Date.now();
    
    for (let i = 0; i < this.scenarios.length; i++) {
      const scenario = this.scenarios[i];
      logger.info(`\n=== Running Scenario ${i + 1}/${this.scenarios.length}: ${scenario.name} ===`);
      
      try {
        const result = await this.runScenario(scenario, serverUrl);
        this.results.push({
          scenario: scenario.name,
          ...result
        });
        
        logger.info(`Scenario "${scenario.name}" completed successfully`);
        
        // Wait between scenarios to let server recover
        if (i < this.scenarios.length - 1) {
          logger.info('Waiting 30 seconds before next scenario...');
          await this.sleep(30000);
        }
        
      } catch (error) {
        logger.error(`Scenario "${scenario.name}" failed:`, error);
        this.results.push({
          scenario: scenario.name,
          error: error.message,
          failed: true
        });
      }
    }
    
    const overallDuration = Date.now() - overallStartTime;
    
    // Generate comprehensive report
    const report = this.generateComprehensiveReport(overallDuration);
    await this.saveComprehensiveReport(report);
    
    logger.info('\n=== Load Test Suite Completed ===');
    this.printSummary(report);
    
    return report;
  }

  // Run a single scenario
  async runScenario(scenario, serverUrl) {
    const config = {
      serverUrl,
      maxConnections: scenario.maxConnections,
      requestsPerSecond: scenario.requestsPerSecond,
      testDuration: scenario.testDuration,
      rampUpTime: scenario.rampUpTime,
      connectionBatchSize: Math.min(50, Math.ceil(scenario.maxConnections / 20)),
      batchDelay: 1000
    };
    
    const test = new PerformanceTest(config);
    
    return new Promise((resolve, reject) => {
      test.on('testCompleted', (result) => {
        resolve(result);
      });
      
      test.startTest().catch(reject);
      
      // Timeout protection
      setTimeout(() => {
        test.stop();
        reject(new Error(`Scenario timeout after ${scenario.testDuration + 60000}ms`));
      }, scenario.testDuration + 60000);
    });
  }

  // Generate comprehensive report
  generateComprehensiveReport(overallDuration) {
    const successfulResults = this.results.filter(r => !r.failed);
    const failedResults = this.results.filter(r => r.failed);
    
    const report = {
      timestamp: new Date().toISOString(),
      overallDuration,
      totalScenarios: this.scenarios.length,
      successfulScenarios: successfulResults.length,
      failedScenarios: failedResults.length,
      scenarios: this.results,
      summary: {
        maxConnectionsAchieved: Math.max(...successfulResults.map(r => r.summary?.totalConnections || 0)),
        maxRequestsPerSecond: Math.max(...successfulResults.map(r => r.summary?.requestsPerSecond || 0)),
        bestConnectionSuccessRate: Math.max(...successfulResults.map(r => r.summary?.connectionSuccessRate || 0)),
        bestRequestSuccessRate: Math.max(...successfulResults.map(r => r.summary?.requestSuccessRate || 0)),
        averageResponseTime: this.calculateAverageResponseTime(successfulResults),
        p95ResponseTime: this.calculateP95ResponseTime(successfulResults),
        totalErrors: successfulResults.reduce((sum, r) => sum + (r.summary?.totalErrors || 0), 0)
      },
      recommendations: this.generateRecommendations(successfulResults, failedResults)
    };
    
    return report;
  }

  // Calculate average response time across all scenarios
  calculateAverageResponseTime(results) {
    const allResponseTimes = results
      .filter(r => r.responseMetrics?.mean)
      .map(r => r.responseMetrics.mean);
    
    if (allResponseTimes.length === 0) return 0;
    
    return allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length;
  }

  // Calculate P95 response time across all scenarios
  calculateP95ResponseTime(results) {
    const allP95Times = results
      .filter(r => r.responseMetrics?.p95)
      .map(r => r.responseMetrics.p95);
    
    if (allP95Times.length === 0) return 0;
    
    return Math.max(...allP95Times);
  }

  // Generate performance recommendations
  generateRecommendations(successfulResults, failedResults) {
    const recommendations = [];
    
    // Check connection success rates
    const lowConnectionSuccess = successfulResults.filter(r => 
      r.summary?.connectionSuccessRate < 95
    );
    
    if (lowConnectionSuccess.length > 0) {
      recommendations.push({
        type: 'connection',
        severity: 'high',
        message: 'Connection success rate below 95% detected. Consider increasing connection timeout or optimizing connection handling.',
        affectedScenarios: lowConnectionSuccess.map(r => r.scenario)
      });
    }
    
    // Check request success rates
    const lowRequestSuccess = successfulResults.filter(r => 
      r.summary?.requestSuccessRate < 90
    );
    
    if (lowRequestSuccess.length > 0) {
      recommendations.push({
        type: 'requests',
        severity: 'high',
        message: 'Request success rate below 90% detected. Check error handling and server capacity.',
        affectedScenarios: lowRequestSuccess.map(r => r.scenario)
      });
    }
    
    // Check response times
    const highResponseTimes = successfulResults.filter(r => 
      r.responseMetrics?.p95 > 1000
    );
    
    if (highResponseTimes.length > 0) {
      recommendations.push({
        type: 'performance',
        severity: 'medium',
        message: 'P95 response time above 1000ms detected. Consider optimizing request processing.',
        affectedScenarios: highResponseTimes.map(r => r.scenario)
      });
    }
    
    // Check failed scenarios
    if (failedResults.length > 0) {
      recommendations.push({
        type: 'stability',
        severity: 'critical',
        message: 'Some test scenarios failed completely. Server may not handle high loads properly.',
        affectedScenarios: failedResults.map(r => r.scenario)
      });
    }
    
    // Check if 3000 connections target was met
    const maxConnections = Math.max(...successfulResults.map(r => r.summary?.totalConnections || 0));
    if (maxConnections < 3000) {
      recommendations.push({
        type: 'capacity',
        severity: 'high',
        message: `Maximum connections achieved: ${maxConnections}. Target of 3000 not reached.`,
        suggestion: 'Increase server resources or optimize connection handling.'
      });
    }
    
    // Positive recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        severity: 'info',
        message: 'All test scenarios passed successfully! Server meets performance requirements.',
        suggestion: 'Consider running extended duration tests for production readiness.'
      });
    }
    
    return recommendations;
  }

  // Save comprehensive report
  async saveComprehensiveReport(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `load-test-report-${timestamp}.json`;
    const filepath = path.join(process.cwd(), 'test-results', filename);
    
    try {
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
      
      // Also save a summary CSV
      const csvContent = this.generateCSVReport(report);
      const csvFilename = `load-test-summary-${timestamp}.csv`;
      const csvPath = path.join(process.cwd(), 'test-results', csvFilename);
      await fs.writeFile(csvPath, csvContent);
      
      logger.info(`Comprehensive report saved to ${filepath}`);
      logger.info(`Summary CSV saved to ${csvPath}`);
      
    } catch (error) {
      logger.error('Failed to save comprehensive report:', error);
    }
  }

  // Generate CSV report
  generateCSVReport(report) {
    const headers = [
      'Scenario',
      'Max Connections',
      'Actual Connections',
      'Connection Success Rate (%)',
      'Total Requests',
      'Request Success Rate (%)',
      'Requests/Second',
      'Avg Response Time (ms)',
      'P95 Response Time (ms)',
      'P99 Response Time (ms)',
      'Total Errors',
      'Status'
    ];
    
    const rows = report.scenarios.map(scenario => {
      if (scenario.failed) {
        return [
          scenario.scenario,
          'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A',
          'FAILED'
        ];
      }
      
      return [
        scenario.scenario,
        scenario.testConfig?.maxConnections || 'N/A',
        scenario.summary?.totalConnections || 'N/A',
        scenario.summary?.connectionSuccessRate?.toFixed(2) || 'N/A',
        scenario.summary?.totalRequests || 'N/A',
        scenario.summary?.requestSuccessRate?.toFixed(2) || 'N/A',
        scenario.summary?.requestsPerSecond?.toFixed(2) || 'N/A',
        scenario.responseMetrics?.mean?.toFixed(2) || 'N/A',
        scenario.responseMetrics?.p95?.toFixed(2) || 'N/A',
        scenario.responseMetrics?.p99?.toFixed(2) || 'N/A',
        scenario.summary?.totalErrors || 'N/A',
        'SUCCESS'
      ];
    });
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // Print summary to console
  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('LOAD TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Scenarios: ${report.totalScenarios}`);
    console.log(`Successful: ${report.successfulScenarios}`);
    console.log(`Failed: ${report.failedScenarios}`);
    console.log(`Overall Duration: ${(report.overallDuration / 1000 / 60).toFixed(1)} minutes`);
    console.log('');
    console.log('PERFORMANCE METRICS:');
    console.log(`Max Connections Achieved: ${report.summary.maxConnectionsAchieved}`);
    console.log(`Max Requests/Second: ${report.summary.maxRequestsPerSecond.toFixed(2)}`);
    console.log(`Best Connection Success Rate: ${report.summary.bestConnectionSuccessRate.toFixed(2)}%`);
    console.log(`Best Request Success Rate: ${report.summary.bestRequestSuccessRate.toFixed(2)}%`);
    console.log(`Average Response Time: ${report.summary.averageResponseTime.toFixed(2)}ms`);
    console.log(`P95 Response Time: ${report.summary.p95ResponseTime.toFixed(2)}ms`);
    console.log(`Total Errors: ${report.summary.totalErrors}`);
    console.log('');
    
    if (report.recommendations.length > 0) {
      console.log('RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.severity.toUpperCase()}] ${rec.message}`);
        if (rec.suggestion) {
          console.log(`   Suggestion: ${rec.suggestion}`);
        }
        if (rec.affectedScenarios) {
          console.log(`   Affected: ${rec.affectedScenarios.join(', ')}`);
        }
        console.log('');
      });
    }
    
    console.log('='.repeat(60));
  }

  // Utility function for sleeping
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const serverUrl = process.argv[2] || process.env.SERVER_URL || 'ws://localhost:3000';
  
  const loadTest = new LoadTest();
  
  // Handle graceful shutdown
  let isShuttingDown = false;
  
  const shutdown = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    logger.info('Received shutdown signal, stopping load test...');
    process.exit(0);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  // Start the load test
  loadTest.runAllScenarios(serverUrl)
    .then(report => {
      logger.info('Load test completed successfully');
      
      // Exit with appropriate code
      const hasFailures = report.failedScenarios > 0 || 
        report.recommendations.some(r => r.severity === 'critical');
      
      process.exit(hasFailures ? 1 : 0);
    })
    .catch(error => {
      logger.error('Load test failed:', error);
      process.exit(1);
    });
}