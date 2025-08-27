#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const chalk = require('chalk');
const { spawn } = require('child_process');

class HealthChecker {
  constructor() {
    this.configPath = path.join(process.cwd(), 'mcp-coordinator-config.json');
    this.results = {
      healthy: [],
      unhealthy: [],
      unreachable: [],
      total: 0
    };
  }

  async loadConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error(chalk.red('❌ Failed to load configuration:'), error.message);
      throw error;
    }
  }

  async saveConfig(config) {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error(chalk.red('❌ Failed to save configuration:'), error.message);
      throw error;
    }
  }

  async checkServerHealth(server, timeout = 5000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // For MCP servers, we'll try to execute a health check command
      const healthCheck = spawn('node', ['-e', `
        const { spawn } = require('child_process');
        const server = spawn('node', ['${server.scriptPath}']);
        
        const request = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'health_check',
            arguments: {}
          }
        };
        
        server.stdin.write(JSON.stringify(request) + '\\n');
        
        let responseReceived = false;
        const timer = setTimeout(() => {
          if (!responseReceived) {
            server.kill();
            process.exit(1);
          }
        }, ${timeout});
        
        server.stdout.on('data', (data) => {
          try {
            const response = JSON.parse(data.toString());
            if (response.result && response.result.success) {
              responseReceived = true;
              clearTimeout(timer);
              server.kill();
              process.exit(0);
            }
          } catch (error) {
            // Continue listening
          }
        });
        
        server.stderr.on('data', (data) => {
          // Server started successfully if we see startup message
          if (data.toString().includes('started on port')) {
            responseReceived = true;
            clearTimeout(timer);
            server.kill();
            process.exit(0);
          }
        });
        
        server.on('close', (code) => {
          clearTimeout(timer);
          process.exit(code);
        });
      `], { timeout });
      
      healthCheck.on('close', (code) => {
        const responseTime = Date.now() - startTime;
        
        if (code === 0) {
          resolve({
            status: 'healthy',
            responseTime,
            server: server.id
          });
        } else {
          resolve({
            status: 'unhealthy',
            responseTime,
            server: server.id,
            error: `Process exited with code ${code}`
          });
        }
      });
      
      healthCheck.on('error', (error) => {
        resolve({
          status: 'unreachable',
          responseTime: Date.now() - startTime,
          server: server.id,
          error: error.message
        });
      });
    });
  }

  async checkCategoryHealth(category, servers) {
    console.log(chalk.cyan(`\n🔍 Checking health for category: ${category}`));
    
    const categoryResults = {
      healthy: 0,
      unhealthy: 0,
      unreachable: 0,
      total: servers.length,
      servers: []
    };

    const promises = servers.map(async (server) => {
      const result = await this.checkServerHealth(server);
      categoryResults.servers.push(result);
      
      switch (result.status) {
        case 'healthy':
          categoryResults.healthy++;
          this.results.healthy.push(result);
          console.log(chalk.green(`  ✅ ${server.id} - Healthy (${result.responseTime}ms)`));
          break;
        case 'unhealthy':
          categoryResults.unhealthy++;
          this.results.unhealthy.push(result);
          console.log(chalk.yellow(`  ⚠️  ${server.id} - Unhealthy: ${result.error}`));
          break;
        case 'unreachable':
          categoryResults.unreachable++;
          this.results.unreachable.push(result);
          console.log(chalk.red(`  ❌ ${server.id} - Unreachable: ${result.error}`));
          break;
      }
      
      return result;
    });

    await Promise.all(promises);
    
    const healthPercentage = ((categoryResults.healthy / categoryResults.total) * 100).toFixed(1);
    console.log(chalk.gray(`  📊 Category Health: ${healthPercentage}% (${categoryResults.healthy}/${categoryResults.total})`));
    
    return categoryResults;
  }

  async checkAllServers(category = null, detailed = false) {
    console.log(chalk.blue('🏥 Starting health check...'));
    
    const config = await this.loadConfig();
    
    if (!config.mcpServers || config.mcpServers.length === 0) {
      console.log(chalk.yellow('⚠️  No servers found to check'));
      return this.results;
    }

    let serversToCheck = config.mcpServers;
    
    if (category) {
      serversToCheck = config.mcpServers.filter(s => s.category === category);
      if (serversToCheck.length === 0) {
        console.log(chalk.yellow(`⚠️  No servers found for category: ${category}`));
        return this.results;
      }
    }

    // Group servers by category
    const serversByCategory = {};
    serversToCheck.forEach(server => {
      if (!serversByCategory[server.category]) {
        serversByCategory[server.category] = [];
      }
      serversByCategory[server.category].push(server);
    });

    const categoryResults = {};
    
    // Check each category
    for (const [cat, servers] of Object.entries(serversByCategory)) {
      categoryResults[cat] = await this.checkCategoryHealth(cat, servers);
    }

    this.results.total = serversToCheck.length;
    
    // Update server statuses in config
    for (const server of config.mcpServers) {
      const healthResult = [...this.results.healthy, ...this.results.unhealthy, ...this.results.unreachable]
        .find(r => r.server === server.id);
      
      if (healthResult) {
        server.lastHealthCheck = new Date().toISOString();
        server.healthStatus = healthResult.status;
        server.lastResponseTime = healthResult.responseTime;
        
        if (healthResult.error) {
          server.lastError = healthResult.error;
        }
      }
    }

    // Update config statistics
    config.statistics.totalActive = this.results.healthy.length;
    config.statistics.totalFailed = this.results.unhealthy.length + this.results.unreachable.length;
    config.statistics.lastHealthCheck = new Date().toISOString();
    
    if (this.results.healthy.length > 0) {
      config.statistics.averageResponseTime = 
        this.results.healthy.reduce((sum, r) => sum + r.responseTime, 0) / this.results.healthy.length;
    }

    await this.saveConfig(config);

    // Print summary
    this.printSummary(categoryResults, detailed);
    
    return {
      results: this.results,
      categoryResults,
      summary: {
        totalServers: this.results.total,
        healthyServers: this.results.healthy.length,
        unhealthyServers: this.results.unhealthy.length,
        unreachableServers: this.results.unreachable.length,
        healthPercentage: ((this.results.healthy.length / this.results.total) * 100).toFixed(1)
      }
    };
  }

  printSummary(categoryResults, detailed = false) {
    console.log(chalk.blue('\n📋 Health Check Summary'));
    console.log(chalk.gray('=' .repeat(50)));
    
    // Overall statistics
    const totalHealthy = this.results.healthy.length;
    const totalUnhealthy = this.results.unhealthy.length;
    const totalUnreachable = this.results.unreachable.length;
    const overallHealth = ((totalHealthy / this.results.total) * 100).toFixed(1);
    
    console.log(chalk.green(`✅ Healthy: ${totalHealthy}`));
    console.log(chalk.yellow(`⚠️  Unhealthy: ${totalUnhealthy}`));
    console.log(chalk.red(`❌ Unreachable: ${totalUnreachable}`));
    console.log(chalk.blue(`📊 Overall Health: ${overallHealth}%`));
    
    // Category breakdown
    if (Object.keys(categoryResults).length > 1) {
      console.log(chalk.cyan('\n📂 Category Breakdown:'));
      
      for (const [category, results] of Object.entries(categoryResults)) {
        const categoryHealth = ((results.healthy / results.total) * 100).toFixed(1);
        const statusIcon = categoryHealth >= 80 ? '🟢' : categoryHealth >= 60 ? '🟡' : '🔴';
        
        console.log(`  ${statusIcon} ${category}: ${categoryHealth}% (${results.healthy}/${results.total})`);
        
        if (detailed && results.servers.length > 0) {
          results.servers.forEach(server => {
            const icon = server.status === 'healthy' ? '✅' : 
                        server.status === 'unhealthy' ? '⚠️' : '❌';
            console.log(`    ${icon} ${server.server} (${server.responseTime}ms)`);
          });
        }
      }
    }
    
    // Recommendations
    console.log(chalk.cyan('\n💡 Recommendations:'));
    
    if (totalUnreachable > 0) {
      console.log(chalk.red(`  • ${totalUnreachable} servers are unreachable - check network connectivity`));
    }
    
    if (totalUnhealthy > 0) {
      console.log(chalk.yellow(`  • ${totalUnhealthy} servers are unhealthy - review server logs`));
    }
    
    if (overallHealth < 80) {
      console.log(chalk.red('  • System health is below 80% - immediate attention required'));
    } else if (overallHealth < 95) {
      console.log(chalk.yellow('  • System health is good but could be improved'));
    } else {
      console.log(chalk.green('  • System health is excellent!'));
    }
    
    console.log(chalk.gray('\n' + '=' .repeat(50)));
  }

  async generateHealthReport() {
    const timestamp = new Date().toISOString();
    const reportPath = path.join(process.cwd(), 'logs', `health-report-${timestamp.split('T')[0]}.json`);
    
    // Ensure logs directory exists
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    
    const report = {
      timestamp,
      summary: {
        totalServers: this.results.total,
        healthyServers: this.results.healthy.length,
        unhealthyServers: this.results.unhealthy.length,
        unreachableServers: this.results.unreachable.length,
        healthPercentage: ((this.results.healthy.length / this.results.total) * 100).toFixed(1)
      },
      details: {
        healthy: this.results.healthy,
        unhealthy: this.results.unhealthy,
        unreachable: this.results.unreachable
      }
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(chalk.blue(`📄 Health report saved to: ${reportPath}`));
    
    return reportPath;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const checker = new HealthChecker();
  
  let category = null;
  let detailed = false;
  let generateReport = false;
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--detailed' || arg === '-d') {
      detailed = true;
    } else if (arg === '--report' || arg === '-r') {
      generateReport = true;
    } else if (arg === '--category' || arg === '-c') {
      category = args[i + 1];
      i++; // Skip next argument
    } else if (arg === '--help' || arg === '-h') {
      console.log(chalk.yellow('Usage: node health-check.js [options]'));
      console.log(chalk.gray('\nOptions:'));
      console.log(chalk.gray('  -c, --category <name>  Check specific category only'));
      console.log(chalk.gray('  -d, --detailed         Show detailed server information'));
      console.log(chalk.gray('  -r, --report           Generate JSON report file'));
      console.log(chalk.gray('  -h, --help             Show this help message'));
      console.log(chalk.gray('\nAvailable categories:'));
      console.log(chalk.gray('  database, filesystem, api, ai-ml, version-control'));
      console.log(chalk.gray('  dev-tools, system-ops, communication, business, iot-hardware'));
      process.exit(0);
    }
  }
  
  checker.checkAllServers(category, detailed)
    .then(async (results) => {
      if (generateReport) {
        await checker.generateHealthReport();
      }
      
      const exitCode = results.summary.healthPercentage >= 80 ? 0 : 1;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error(chalk.red('❌ Health check failed:'), error.message);
      process.exit(1);
    });
}

module.exports = HealthChecker;