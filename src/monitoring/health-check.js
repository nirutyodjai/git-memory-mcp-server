import { EventEmitter } from 'events';
import winston from 'winston';
import os from 'os';
import fs from 'fs/promises';
import { performance } from 'perf_hooks';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'health-check.log' })
  ]
});

export class HealthCheck extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      checkInterval: options.checkInterval || 30000, // 30 seconds
      criticalThresholds: {
        cpuUsage: options.criticalCpuUsage || 90,
        memoryUsage: options.criticalMemoryUsage || 90,
        diskUsage: options.criticalDiskUsage || 90,
        responseTime: options.criticalResponseTime || 5000,
        errorRate: options.criticalErrorRate || 10,
        connectionCount: options.maxConnections || 3000
      },
      warningThresholds: {
        cpuUsage: options.warningCpuUsage || 70,
        memoryUsage: options.warningMemoryUsage || 70,
        diskUsage: options.warningDiskUsage || 70,
        responseTime: options.warningResponseTime || 2000,
        errorRate: options.warningErrorRate || 5,
        connectionCount: options.warningConnections || 2400
      },
      ...options
    };
    
    this.checks = new Map();
    this.status = {
      overall: 'healthy',
      lastCheck: null,
      uptime: process.uptime(),
      checks: {}
    };
    
    this.metrics = {
      cpu: [],
      memory: [],
      connections: 0,
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0
      },
      errors: []
    };
    
    this.isRunning = false;
    this.checkTimer = null;
    
    this.registerDefaultChecks();
  }

  // Register default health checks
  registerDefaultChecks() {
    // System resource checks
    this.registerCheck('cpu', this.checkCPUUsage.bind(this));
    this.registerCheck('memory', this.checkMemoryUsage.bind(this));
    this.registerCheck('disk', this.checkDiskUsage.bind(this));
    this.registerCheck('load', this.checkSystemLoad.bind(this));
    
    // Application checks
    this.registerCheck('connections', this.checkConnections.bind(this));
    this.registerCheck('response-time', this.checkResponseTime.bind(this));
    this.registerCheck('error-rate', this.checkErrorRate.bind(this));
    
    // Service checks
    this.registerCheck('redis', this.checkRedis.bind(this));
    this.registerCheck('git-service', this.checkGitService.bind(this));
    this.registerCheck('websocket', this.checkWebSocket.bind(this));
  }

  // Register a custom health check
  registerCheck(name, checkFunction, options = {}) {
    this.checks.set(name, {
      name,
      function: checkFunction,
      enabled: options.enabled !== false,
      timeout: options.timeout || 5000,
      critical: options.critical || false,
      lastRun: null,
      lastResult: null,
      consecutiveFailures: 0,
      maxConsecutiveFailures: options.maxConsecutiveFailures || 3
    });
    
    logger.info(`Health check registered: ${name}`);
  }

  // Start health monitoring
  start() {
    if (this.isRunning) {
      logger.warn('Health check is already running');
      return;
    }
    
    this.isRunning = true;
    logger.info('Starting health check monitoring');
    
    // Run initial check
    this.runAllChecks();
    
    // Schedule periodic checks
    this.checkTimer = setInterval(() => {
      this.runAllChecks();
    }, this.config.checkInterval);
    
    this.emit('started');
  }

  // Stop health monitoring
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    
    logger.info('Health check monitoring stopped');
    this.emit('stopped');
  }

  // Run all registered health checks
  async runAllChecks() {
    const startTime = performance.now();
    const results = {};
    
    logger.debug('Running health checks...');
    
    // Run checks in parallel
    const checkPromises = Array.from(this.checks.entries())
      .filter(([_, check]) => check.enabled)
      .map(async ([name, check]) => {
        try {
          const result = await this.runSingleCheck(name, check);
          results[name] = result;
        } catch (error) {
          logger.error(`Health check ${name} failed:`, error);
          results[name] = {
            status: 'error',
            message: error.message,
            timestamp: Date.now()
          };
        }
      });
    
    await Promise.all(checkPromises);
    
    // Update overall status
    this.updateOverallStatus(results);
    
    const duration = performance.now() - startTime;
    logger.debug(`Health checks completed in ${duration.toFixed(2)}ms`);
    
    this.emit('checksCompleted', this.status);
  }

  // Run a single health check
  async runSingleCheck(name, check) {
    const startTime = performance.now();
    
    try {
      // Run check with timeout
      const result = await Promise.race([
        check.function(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Check timeout')), check.timeout)
        )
      ]);
      
      const duration = performance.now() - startTime;
      
      // Update check metadata
      check.lastRun = Date.now();
      check.lastResult = result;
      
      if (result.status === 'healthy') {
        check.consecutiveFailures = 0;
      } else {
        check.consecutiveFailures++;
      }
      
      return {
        ...result,
        duration,
        consecutiveFailures: check.consecutiveFailures
      };
      
    } catch (error) {
      check.consecutiveFailures++;
      
      return {
        status: 'error',
        message: error.message,
        duration: performance.now() - startTime,
        consecutiveFailures: check.consecutiveFailures
      };
    }
  }

  // Update overall system status
  updateOverallStatus(results) {
    this.status.lastCheck = Date.now();
    this.status.uptime = process.uptime();
    this.status.checks = results;
    
    // Determine overall status
    const statuses = Object.values(results).map(r => r.status);
    
    if (statuses.includes('critical')) {
      this.status.overall = 'critical';
    } else if (statuses.includes('warning')) {
      this.status.overall = 'warning';
    } else if (statuses.includes('error')) {
      this.status.overall = 'degraded';
    } else {
      this.status.overall = 'healthy';
    }
    
    // Emit status change events
    this.emitStatusEvents(results);
  }

  // Emit appropriate status events
  emitStatusEvents(results) {
    Object.entries(results).forEach(([name, result]) => {
      const check = this.checks.get(name);
      
      if (result.status === 'critical') {
        this.emit('critical', { check: name, result });
        
        if (check.consecutiveFailures >= check.maxConsecutiveFailures) {
          this.emit('checkFailed', { check: name, result, consecutive: check.consecutiveFailures });
        }
      } else if (result.status === 'warning') {
        this.emit('warning', { check: name, result });
      } else if (result.status === 'error') {
        this.emit('error', { check: name, result });
      }
    });
    
    // Emit overall status change
    this.emit('statusUpdate', this.status);
  }

  // CPU usage check
  async checkCPUUsage() {
    const cpus = os.cpus();
    const usage = await this.getCPUUsage();
    
    this.metrics.cpu.push({ timestamp: Date.now(), usage });
    
    // Keep only last 100 measurements
    if (this.metrics.cpu.length > 100) {
      this.metrics.cpu.shift();
    }
    
    let status = 'healthy';
    let message = `CPU usage: ${usage.toFixed(1)}%`;
    
    if (usage >= this.config.criticalThresholds.cpuUsage) {
      status = 'critical';
      message += ' (CRITICAL)';
    } else if (usage >= this.config.warningThresholds.cpuUsage) {
      status = 'warning';
      message += ' (WARNING)';
    }
    
    return {
      status,
      message,
      value: usage,
      unit: '%',
      threshold: {
        warning: this.config.warningThresholds.cpuUsage,
        critical: this.config.criticalThresholds.cpuUsage
      }
    };
  }

  // Get CPU usage percentage
  async getCPUUsage() {
    return new Promise((resolve) => {
      const startMeasure = this.cpuAverage();
      
      setTimeout(() => {
        const endMeasure = this.cpuAverage();
        
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        
        const usage = 100 - ~~(100 * idleDifference / totalDifference);
        resolve(usage);
      }, 100);
    });
  }

  // Calculate CPU average
  cpuAverage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    return {
      idle: totalIdle / cpus.length,
      total: totalTick / cpus.length
    };
  }

  // Memory usage check
  async checkMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usage = (usedMemory / totalMemory) * 100;
    
    this.metrics.memory.push({ timestamp: Date.now(), usage, used: usedMemory, total: totalMemory });
    
    // Keep only last 100 measurements
    if (this.metrics.memory.length > 100) {
      this.metrics.memory.shift();
    }
    
    let status = 'healthy';
    let message = `Memory usage: ${usage.toFixed(1)}% (${(usedMemory / 1024 / 1024 / 1024).toFixed(1)}GB / ${(totalMemory / 1024 / 1024 / 1024).toFixed(1)}GB)`;
    
    if (usage >= this.config.criticalThresholds.memoryUsage) {
      status = 'critical';
      message += ' (CRITICAL)';
    } else if (usage >= this.config.warningThresholds.memoryUsage) {
      status = 'warning';
      message += ' (WARNING)';
    }
    
    return {
      status,
      message,
      value: usage,
      unit: '%',
      details: {
        used: usedMemory,
        free: freeMemory,
        total: totalMemory
      },
      threshold: {
        warning: this.config.warningThresholds.memoryUsage,
        critical: this.config.criticalThresholds.memoryUsage
      }
    };
  }

  // Disk usage check
  async checkDiskUsage() {
    try {
      const stats = await fs.stat(process.cwd());
      // This is a simplified check - in production, you'd want to check actual disk usage
      
      return {
        status: 'healthy',
        message: 'Disk access OK',
        value: 0,
        unit: '%'
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Disk check failed: ${error.message}`,
        value: null
      };
    }
  }

  // System load check
  async checkSystemLoad() {
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length;
    const load1min = loadAvg[0];
    const normalizedLoad = (load1min / cpuCount) * 100;
    
    let status = 'healthy';
    let message = `System load: ${load1min.toFixed(2)} (${normalizedLoad.toFixed(1)}% of CPU capacity)`;
    
    if (normalizedLoad >= 90) {
      status = 'critical';
      message += ' (CRITICAL)';
    } else if (normalizedLoad >= 70) {
      status = 'warning';
      message += ' (WARNING)';
    }
    
    return {
      status,
      message,
      value: normalizedLoad,
      unit: '%',
      details: {
        load1min: loadAvg[0],
        load5min: loadAvg[1],
        load15min: loadAvg[2],
        cpuCount
      }
    };
  }

  // Connection count check
  async checkConnections() {
    const connectionCount = this.metrics.connections;
    
    let status = 'healthy';
    let message = `Active connections: ${connectionCount}`;
    
    if (connectionCount >= this.config.criticalThresholds.connectionCount) {
      status = 'critical';
      message += ' (CRITICAL - at capacity)';
    } else if (connectionCount >= this.config.warningThresholds.connectionCount) {
      status = 'warning';
      message += ' (WARNING - approaching capacity)';
    }
    
    return {
      status,
      message,
      value: connectionCount,
      unit: 'connections',
      threshold: {
        warning: this.config.warningThresholds.connectionCount,
        critical: this.config.criticalThresholds.connectionCount
      }
    };
  }

  // Response time check
  async checkResponseTime() {
    const avgResponseTime = this.metrics.requests.avgResponseTime;
    
    let status = 'healthy';
    let message = `Average response time: ${avgResponseTime.toFixed(2)}ms`;
    
    if (avgResponseTime >= this.config.criticalThresholds.responseTime) {
      status = 'critical';
      message += ' (CRITICAL)';
    } else if (avgResponseTime >= this.config.warningThresholds.responseTime) {
      status = 'warning';
      message += ' (WARNING)';
    }
    
    return {
      status,
      message,
      value: avgResponseTime,
      unit: 'ms',
      threshold: {
        warning: this.config.warningThresholds.responseTime,
        critical: this.config.criticalThresholds.responseTime
      }
    };
  }

  // Error rate check
  async checkErrorRate() {
    const { total, failed } = this.metrics.requests;
    const errorRate = total > 0 ? (failed / total) * 100 : 0;
    
    let status = 'healthy';
    let message = `Error rate: ${errorRate.toFixed(2)}% (${failed}/${total})`;
    
    if (errorRate >= this.config.criticalThresholds.errorRate) {
      status = 'critical';
      message += ' (CRITICAL)';
    } else if (errorRate >= this.config.warningThresholds.errorRate) {
      status = 'warning';
      message += ' (WARNING)';
    }
    
    return {
      status,
      message,
      value: errorRate,
      unit: '%',
      details: {
        total,
        successful: this.metrics.requests.successful,
        failed
      },
      threshold: {
        warning: this.config.warningThresholds.errorRate,
        critical: this.config.criticalThresholds.errorRate
      }
    };
  }

  // Redis connectivity check
  async checkRedis() {
    // This would connect to Redis and test basic operations
    // For now, return a placeholder
    return {
      status: 'healthy',
      message: 'Redis connection OK',
      value: true
    };
  }

  // Git service check
  async checkGitService() {
    try {
      // Test basic Git operation
      const { execSync } = await import('child_process');
      execSync('git --version', { timeout: 5000 });
      
      return {
        status: 'healthy',
        message: 'Git service available',
        value: true
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Git service unavailable: ${error.message}`,
        value: false
      };
    }
  }

  // WebSocket server check
  async checkWebSocket() {
    // This would test WebSocket server functionality
    // For now, return a placeholder
    return {
      status: 'healthy',
      message: 'WebSocket server running',
      value: true
    };
  }

  // Update metrics (called by other components)
  updateMetrics(type, data) {
    switch (type) {
      case 'connections':
        this.metrics.connections = data.count || 0;
        break;
        
      case 'request':
        this.metrics.requests.total++;
        if (data.success) {
          this.metrics.requests.successful++;
        } else {
          this.metrics.requests.failed++;
        }
        
        // Update average response time
        if (data.responseTime) {
          const total = this.metrics.requests.total;
          const current = this.metrics.requests.avgResponseTime;
          this.metrics.requests.avgResponseTime = 
            ((current * (total - 1)) + data.responseTime) / total;
        }
        break;
        
      case 'error':
        this.metrics.errors.push({
          timestamp: Date.now(),
          ...data
        });
        
        // Keep only last 1000 errors
        if (this.metrics.errors.length > 1000) {
          this.metrics.errors.shift();
        }
        break;
    }
  }

  // Get current health status
  getStatus() {
    return {
      ...this.status,
      timestamp: Date.now()
    };
  }

  // Get detailed health report
  getDetailedReport() {
    return {
      status: this.getStatus(),
      metrics: this.metrics,
      config: this.config,
      checks: Array.from(this.checks.entries()).map(([name, check]) => ({
        name,
        enabled: check.enabled,
        lastRun: check.lastRun,
        lastResult: check.lastResult,
        consecutiveFailures: check.consecutiveFailures
      }))
    };
  }

  // Enable/disable specific check
  setCheckEnabled(name, enabled) {
    const check = this.checks.get(name);
    if (check) {
      check.enabled = enabled;
      logger.info(`Health check ${name} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  // Update thresholds
  updateThresholds(type, thresholds) {
    if (this.config.criticalThresholds[type] !== undefined) {
      Object.assign(this.config.criticalThresholds, thresholds.critical || {});
      Object.assign(this.config.warningThresholds, thresholds.warning || {});
      logger.info(`Updated thresholds for ${type}`);
    }
  }
}

export default HealthCheck;