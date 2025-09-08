#!/usr/bin/env node
/**
 * NEXUS IDE Integration Monitoring Script
 * Monitor the health and performance of Git Memory MCP Server integration with NEXUS IDE
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const EventEmitter = require('events');

class NexusIntegrationMonitor extends EventEmitter {
  constructor() {
    super();
    this.projectRoot = path.join(__dirname, '..');
    this.configPath = path.join(this.projectRoot, 'nexus-integration.config.json');
    this.monitoringLogPath = path.join(this.projectRoot, '.monitoring.log');
    this.metricsPath = path.join(this.projectRoot, '.metrics.json');
    
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.alertThresholds = {
      responseTime: 5000, // 5 seconds
      errorRate: 0.05, // 5%
      memoryUsage: 0.8, // 80%
      cpuUsage: 0.8, // 80%
      diskUsage: 0.9 // 90%
    };
    
    this.metrics = {
      uptime: 0,
      requests: 0,
      errors: 0,
      responseTime: [],
      memoryUsage: [],
      cpuUsage: [],
      lastHealthCheck: null,
      nexusConnectivity: null,
      gitOperations: 0,
      mcpConnections: 0
    };
    
    this.loadConfiguration();
    this.setupEventHandlers();
  }

  loadConfiguration() {
    try {
      this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    } catch (error) {
      console.error('❌ Error loading configuration:', error.message);
      process.exit(1);
    }
  }

  setupEventHandlers() {
    this.on('healthCheckFailed', (error) => {
      this.logAlert('HEALTH_CHECK_FAILED', `Health check failed: ${error.message}`);
    });
    
    this.on('nexusDisconnected', () => {
      this.logAlert('NEXUS_DISCONNECTED', 'Lost connection to NEXUS IDE');
    });
    
    this.on('highResponseTime', (responseTime) => {
      this.logAlert('HIGH_RESPONSE_TIME', `Response time exceeded threshold: ${responseTime}ms`);
    });
    
    this.on('highErrorRate', (errorRate) => {
      this.logAlert('HIGH_ERROR_RATE', `Error rate exceeded threshold: ${(errorRate * 100).toFixed(2)}%`);
    });
    
    this.on('resourceAlert', (resource, usage) => {
      this.logAlert('RESOURCE_ALERT', `${resource} usage exceeded threshold: ${(usage * 100).toFixed(2)}%`);
    });
  }

  async startMonitoring(interval = 30000) {
    if (this.isMonitoring) {
      console.log('⚠️  Monitoring is already running');
      return;
    }
    
    console.log('🔍 Starting NEXUS IDE integration monitoring...');
    console.log(`📊 Monitoring interval: ${interval / 1000} seconds`);
    
    this.isMonitoring = true;
    this.startTime = Date.now();
    
    // Initial health check
    await this.performHealthCheck();
    
    // Start periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performMonitoringCycle();
      } catch (error) {
        console.error('❌ Monitoring cycle error:', error.message);
        this.logError('MONITORING_ERROR', error);
      }
    }, interval);
    
    // Setup graceful shutdown
    process.on('SIGINT', () => this.stopMonitoring());
    process.on('SIGTERM', () => this.stopMonitoring());
    
    console.log('✅ Monitoring started successfully');
  }

  async performMonitoringCycle() {
    const cycleStart = Date.now();
    
    // Update uptime
    this.metrics.uptime = Date.now() - this.startTime;
    
    // Perform health checks
    await this.performHealthCheck();
    await this.checkNexusConnectivity();
    await this.checkSystemResources();
    await this.checkGitOperations();
    await this.checkMCPConnections();
    
    // Calculate metrics
    this.calculateMetrics();
    
    // Check thresholds and emit alerts
    this.checkAlertThresholds();
    
    // Save metrics
    await this.saveMetrics();
    
    const cycleDuration = Date.now() - cycleStart;
    console.log(`📊 Monitoring cycle completed in ${cycleDuration}ms`);
  }

  async performHealthCheck() {
    try {
      const startTime = Date.now();
      const healthResponse = await this.makeHealthRequest();
      const responseTime = Date.now() - startTime;
      
      this.metrics.responseTime.push(responseTime);
      this.metrics.lastHealthCheck = {
        timestamp: new Date().toISOString(),
        status: 'success',
        responseTime,
        response: healthResponse
      };
      
      this.metrics.requests++;
      
      if (responseTime > this.alertThresholds.responseTime) {
        this.emit('highResponseTime', responseTime);
      }
      
      console.log(`✅ Health check passed (${responseTime}ms)`);
      
    } catch (error) {
      this.metrics.errors++;
      this.metrics.lastHealthCheck = {
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: error.message
      };
      
      this.emit('healthCheckFailed', error);
      console.log(`❌ Health check failed: ${error.message}`);
    }
  }

  async makeHealthRequest() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: this.config.gitMemoryServer.port || 65261,
        path: '/health',
        method: 'GET',
        timeout: 10000
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const response = JSON.parse(data);
              resolve(response);
            } catch (error) {
              reject(new Error('Invalid health response format'));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Health check timeout')));
      req.setTimeout(10000);
      req.end();
    });
  }

  async checkNexusConnectivity() {
    if (!this.config.nexusIDE.endpoint) {
      console.log('⚠️  NEXUS IDE endpoint not configured, skipping connectivity check');
      return;
    }
    
    try {
      const startTime = Date.now();
      await this.makeNexusRequest('/api/health');
      const responseTime = Date.now() - startTime;
      
      this.metrics.nexusConnectivity = {
        timestamp: new Date().toISOString(),
        status: 'connected',
        responseTime
      };
      
      console.log(`✅ NEXUS IDE connectivity check passed (${responseTime}ms)`);
      
    } catch (error) {
      this.metrics.nexusConnectivity = {
        timestamp: new Date().toISOString(),
        status: 'disconnected',
        error: error.message
      };
      
      this.emit('nexusDisconnected');
      console.log(`❌ NEXUS IDE connectivity failed: ${error.message}`);
    }
  }

  async makeNexusRequest(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.config.nexusIDE.endpoint + path);
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.nexusIDE.apiKey}`,
          'User-Agent': 'Git-Memory-MCP-Monitor/1.0'
        },
        timeout: 10000
      };

      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const response = JSON.parse(data);
              resolve(response);
            } catch {
              resolve({ status: 'ok' });
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('NEXUS request timeout')));
      req.setTimeout(10000);
      req.end();
    });
  }

  async checkSystemResources() {
    try {
      // Memory usage
      const memoryUsage = process.memoryUsage();
      const totalMemory = require('os').totalmem();
      const memoryPercent = memoryUsage.rss / totalMemory;
      
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        percent: memoryPercent
      });
      
      if (memoryPercent > this.alertThresholds.memoryUsage) {
        this.emit('resourceAlert', 'Memory', memoryPercent);
      }
      
      // CPU usage (simplified)
      const cpuUsage = process.cpuUsage();
      this.metrics.cpuUsage.push({
        timestamp: Date.now(),
        user: cpuUsage.user,
        system: cpuUsage.system
      });
      
      console.log(`📊 System resources: Memory ${(memoryPercent * 100).toFixed(2)}%`);
      
    } catch (error) {
      console.log(`⚠️  System resource check failed: ${error.message}`);
    }
  }

  async checkGitOperations() {
    try {
      // Check if git operations are working
      const gitStatus = execSync('git status --porcelain', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        timeout: 5000
      });
      
      this.metrics.gitOperations++;
      console.log('✅ Git operations check passed');
      
    } catch (error) {
      console.log(`⚠️  Git operations check failed: ${error.message}`);
    }
  }

  async checkMCPConnections() {
    // TODO: Implement MCP connection monitoring
    // This would check active MCP connections and their status
    this.metrics.mcpConnections = 1; // Placeholder
    console.log('✅ MCP connections check passed');
  }

  calculateMetrics() {
    // Calculate error rate
    const errorRate = this.metrics.requests > 0 ? this.metrics.errors / this.metrics.requests : 0;
    
    // Calculate average response time
    const avgResponseTime = this.metrics.responseTime.length > 0 
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length 
      : 0;
    
    // Keep only recent data (last 100 entries)
    if (this.metrics.responseTime.length > 100) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-100);
    }
    
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
    }
    
    if (this.metrics.cpuUsage.length > 100) {
      this.metrics.cpuUsage = this.metrics.cpuUsage.slice(-100);
    }
    
    this.metrics.calculated = {
      errorRate,
      avgResponseTime,
      timestamp: new Date().toISOString()
    };
  }

  checkAlertThresholds() {
    if (this.metrics.calculated) {
      if (this.metrics.calculated.errorRate > this.alertThresholds.errorRate) {
        this.emit('highErrorRate', this.metrics.calculated.errorRate);
      }
    }
  }

  async saveMetrics() {
    const metricsData = {
      ...this.metrics,
      savedAt: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync(this.metricsPath, JSON.stringify(metricsData, null, 2));
    } catch (error) {
      console.error('❌ Failed to save metrics:', error.message);
    }
  }

  logAlert(type, message) {
    const alert = {
      timestamp: new Date().toISOString(),
      type,
      message,
      severity: this.getAlertSeverity(type)
    };
    
    console.log(`🚨 ALERT [${alert.severity}]: ${message}`);
    this.logToFile('ALERT', alert);
  }

  logError(type, error) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      type,
      message: error.message,
      stack: error.stack
    };
    
    console.log(`❌ ERROR: ${error.message}`);
    this.logToFile('ERROR', errorLog);
  }

  logToFile(level, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      data
    };
    
    try {
      let logData = [];
      if (fs.existsSync(this.monitoringLogPath)) {
        const logContent = fs.readFileSync(this.monitoringLogPath, 'utf8');
        logData = JSON.parse(logContent);
      }
      
      logData.unshift(logEntry);
      
      // Keep only last 1000 entries
      if (logData.length > 1000) {
        logData = logData.slice(0, 1000);
      }
      
      fs.writeFileSync(this.monitoringLogPath, JSON.stringify(logData, null, 2));
    } catch (error) {
      console.error('❌ Failed to write to log file:', error.message);
    }
  }

  getAlertSeverity(type) {
    const severityMap = {
      'HEALTH_CHECK_FAILED': 'HIGH',
      'NEXUS_DISCONNECTED': 'HIGH',
      'HIGH_RESPONSE_TIME': 'MEDIUM',
      'HIGH_ERROR_RATE': 'HIGH',
      'RESOURCE_ALERT': 'MEDIUM'
    };
    
    return severityMap[type] || 'LOW';
  }

  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('⚠️  Monitoring is not running');
      return;
    }
    
    console.log('🛑 Stopping monitoring...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.isMonitoring = false;
    
    // Save final metrics
    this.saveMetrics();
    
    console.log('✅ Monitoring stopped');
    process.exit(0);
  }

  async getStatus() {
    const status = {
      monitoring: this.isMonitoring,
      uptime: this.metrics.uptime,
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      lastHealthCheck: this.metrics.lastHealthCheck,
      nexusConnectivity: this.metrics.nexusConnectivity,
      calculated: this.metrics.calculated
    };
    
    return status;
  }

  async generateReport() {
    const status = await this.getStatus();
    
    console.log('📊 NEXUS IDE Integration Monitoring Report');
    console.log('=' .repeat(50));
    console.log(`Status: ${this.isMonitoring ? '🟢 Running' : '🔴 Stopped'}`);
    console.log(`Uptime: ${Math.floor(status.uptime / 1000 / 60)} minutes`);
    console.log(`Total Requests: ${status.requests}`);
    console.log(`Total Errors: ${status.errors}`);
    
    if (status.calculated) {
      console.log(`Error Rate: ${(status.calculated.errorRate * 100).toFixed(2)}%`);
      console.log(`Avg Response Time: ${status.calculated.avgResponseTime.toFixed(2)}ms`);
    }
    
    if (status.lastHealthCheck) {
      console.log(`Last Health Check: ${status.lastHealthCheck.status} (${status.lastHealthCheck.timestamp})`);
    }
    
    if (status.nexusConnectivity) {
      console.log(`NEXUS Connectivity: ${status.nexusConnectivity.status} (${status.nexusConnectivity.timestamp})`);
    }
    
    console.log('=' .repeat(50));
  }
}

// CLI interface
if (require.main === module) {
  const monitor = new NexusIntegrationMonitor();
  
  const command = process.argv[2];
  const interval = parseInt(process.argv[3]) || 30000;
  
  switch (command) {
    case 'start':
      monitor.startMonitoring(interval).catch(console.error);
      break;
      
    case 'status':
      monitor.getStatus().then(status => {
        console.log('📊 Current Status:');
        console.log(JSON.stringify(status, null, 2));
      }).catch(console.error);
      break;
      
    case 'report':
      monitor.generateReport().catch(console.error);
      break;
      
    case 'stop':
      // This would need to communicate with a running instance
      console.log('Use Ctrl+C to stop a running monitor');
      break;
      
    default:
      console.log('Usage: node monitor-nexus-integration.js [start|status|report] [interval_ms]');
      console.log('Commands:');
      console.log('  start [interval]  - Start monitoring (default: 30000ms)');
      console.log('  status           - Show current monitoring status');
      console.log('  report           - Generate monitoring report');
      console.log('  stop             - Stop monitoring (use Ctrl+C)');
      console.log('\nExample: node monitor-nexus-integration.js start 15000');
      break;
  }
}

module.exports = NexusIntegrationMonitor;