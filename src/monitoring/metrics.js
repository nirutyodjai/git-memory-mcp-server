import { EventEmitter } from 'events';
import winston from 'winston';
import os from 'os';
import process from 'process';
import { performance } from 'perf_hooks';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export class MetricsCollector extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      collectInterval: options.collectInterval || 5000, // 5 seconds
      retentionPeriod: options.retentionPeriod || 3600000, // 1 hour
      maxDataPoints: options.maxDataPoints || 720, // 1 hour at 5s intervals
      enableDetailedMetrics: options.enableDetailedMetrics || true,
      ...options
    };
    
    this.metrics = {
      // System metrics
      system: {
        cpu: [],
        memory: [],
        load: [],
        uptime: []
      },
      
      // Application metrics
      application: {
        connections: [],
        requests: [],
        responses: [],
        errors: [],
        latency: []
      },
      
      // Custom metrics
      custom: new Map()
    };
    
    this.counters = {
      totalRequests: 0,
      totalErrors: 0,
      totalConnections: 0,
      activeConnections: 0
    };
    
    this.gauges = {
      cpuUsage: 0,
      memoryUsage: 0,
      heapUsed: 0,
      heapTotal: 0,
      loadAverage: 0
    };
    
    this.histograms = {
      requestDuration: [],
      responseTimes: [],
      connectionDuration: []
    };
    
    this.startTime = Date.now();
    this.lastCpuUsage = process.cpuUsage();
    
    this.setupCollection();
  }

  // Setup automatic metrics collection
  setupCollection() {
    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.collectApplicationMetrics();
      this.cleanupOldData();
    }, this.config.collectInterval);
    
    logger.info('Metrics collection started', {
      interval: this.config.collectInterval,
      retention: this.config.retentionPeriod
    });
  }

  // Collect system metrics
  collectSystemMetrics() {
    const timestamp = Date.now();
    
    // CPU usage
    const cpuUsage = this.calculateCpuUsage();
    this.gauges.cpuUsage = cpuUsage;
    this.addDataPoint('system.cpu', { timestamp, value: cpuUsage });
    
    // Memory usage
    const memInfo = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;
    
    this.gauges.memoryUsage = memoryUsagePercent;
    this.gauges.heapUsed = memInfo.heapUsed;
    this.gauges.heapTotal = memInfo.heapTotal;
    
    this.addDataPoint('system.memory', {
      timestamp,
      value: memoryUsagePercent,
      details: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        heap: memInfo
      }
    });
    
    // Load average
    const loadAvg = os.loadavg();
    this.gauges.loadAverage = loadAvg[0];
    this.addDataPoint('system.load', {
      timestamp,
      value: loadAvg[0],
      details: {
        '1min': loadAvg[0],
        '5min': loadAvg[1],
        '15min': loadAvg[2]
      }
    });
    
    // Uptime
    const uptime = Date.now() - this.startTime;
    this.addDataPoint('system.uptime', { timestamp, value: uptime });
  }

  // Calculate CPU usage percentage
  calculateCpuUsage() {
    const currentUsage = process.cpuUsage();
    const userDiff = currentUsage.user - this.lastCpuUsage.user;
    const systemDiff = currentUsage.system - this.lastCpuUsage.system;
    const totalDiff = userDiff + systemDiff;
    
    // Convert microseconds to percentage
    const cpuPercent = (totalDiff / (this.config.collectInterval * 1000)) * 100;
    
    this.lastCpuUsage = currentUsage;
    return Math.min(100, Math.max(0, cpuPercent));
  }

  // Collect application metrics
  collectApplicationMetrics() {
    const timestamp = Date.now();
    
    // Connection metrics
    this.addDataPoint('application.connections', {
      timestamp,
      value: this.counters.activeConnections,
      details: {
        active: this.counters.activeConnections,
        total: this.counters.totalConnections
      }
    });
    
    // Request metrics
    this.addDataPoint('application.requests', {
      timestamp,
      value: this.counters.totalRequests
    });
    
    // Error metrics
    this.addDataPoint('application.errors', {
      timestamp,
      value: this.counters.totalErrors
    });
    
    // Calculate average response time
    const avgResponseTime = this.calculateAverageResponseTime();
    if (avgResponseTime > 0) {
      this.addDataPoint('application.latency', {
        timestamp,
        value: avgResponseTime
      });
    }
  }

  // Add data point to metrics
  addDataPoint(metricPath, dataPoint) {
    const pathParts = metricPath.split('.');
    let current = this.metrics;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    
    const finalKey = pathParts[pathParts.length - 1];
    if (!current[finalKey]) {
      current[finalKey] = [];
    }
    
    current[finalKey].push(dataPoint);
    
    // Limit data points
    if (current[finalKey].length > this.config.maxDataPoints) {
      current[finalKey] = current[finalKey].slice(-this.config.maxDataPoints);
    }
  }

  // Record request start
  recordRequestStart(requestId, metadata = {}) {
    const startTime = performance.now();
    
    this.counters.totalRequests++;
    
    return {
      requestId,
      startTime,
      metadata,
      end: (statusCode, error = null) => {
        this.recordRequestEnd(requestId, startTime, statusCode, error, metadata);
      }
    };
  }

  // Record request end
  recordRequestEnd(requestId, startTime, statusCode, error, metadata) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Add to response times histogram
    this.histograms.responseTimes.push({
      timestamp: Date.now(),
      duration,
      statusCode,
      error: !!error,
      metadata
    });
    
    // Limit histogram size
    if (this.histograms.responseTimes.length > 1000) {
      this.histograms.responseTimes = this.histograms.responseTimes.slice(-1000);
    }
    
    // Count errors
    if (error || statusCode >= 400) {
      this.counters.totalErrors++;
    }
    
    this.emit('requestCompleted', {
      requestId,
      duration,
      statusCode,
      error,
      metadata
    });
  }

  // Record connection start
  recordConnectionStart(connectionId, clientInfo = {}) {
    this.counters.totalConnections++;
    this.counters.activeConnections++;
    
    const startTime = Date.now();
    
    this.emit('connectionStarted', {
      connectionId,
      clientInfo,
      timestamp: startTime
    });
    
    return {
      connectionId,
      startTime,
      end: () => {
        this.recordConnectionEnd(connectionId, startTime, clientInfo);
      }
    };
  }

  // Record connection end
  recordConnectionEnd(connectionId, startTime, clientInfo) {
    this.counters.activeConnections = Math.max(0, this.counters.activeConnections - 1);
    
    const duration = Date.now() - startTime;
    
    this.histograms.connectionDuration.push({
      timestamp: Date.now(),
      duration,
      clientInfo
    });
    
    // Limit histogram size
    if (this.histograms.connectionDuration.length > 1000) {
      this.histograms.connectionDuration = this.histograms.connectionDuration.slice(-1000);
    }
    
    this.emit('connectionEnded', {
      connectionId,
      duration,
      clientInfo
    });
  }

  // Record custom metric
  recordCustomMetric(name, value, metadata = {}) {
    const timestamp = Date.now();
    
    if (!this.metrics.custom.has(name)) {
      this.metrics.custom.set(name, []);
    }
    
    const metricData = this.metrics.custom.get(name);
    metricData.push({
      timestamp,
      value,
      metadata
    });
    
    // Limit data points
    if (metricData.length > this.config.maxDataPoints) {
      this.metrics.custom.set(name, metricData.slice(-this.config.maxDataPoints));
    }
    
    this.emit('customMetric', { name, value, metadata, timestamp });
  }

  // Increment counter
  incrementCounter(name, value = 1) {
    if (!this.counters[name]) {
      this.counters[name] = 0;
    }
    this.counters[name] += value;
  }

  // Set gauge value
  setGauge(name, value) {
    this.gauges[name] = value;
  }

  // Calculate average response time
  calculateAverageResponseTime() {
    const recentResponses = this.histograms.responseTimes
      .filter(r => Date.now() - r.timestamp < 60000) // Last minute
      .map(r => r.duration);
    
    if (recentResponses.length === 0) return 0;
    
    return recentResponses.reduce((sum, duration) => sum + duration, 0) / recentResponses.length;
  }

  // Get metrics summary
  getMetricsSummary() {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    return {
      timestamp: now,
      uptime,
      counters: { ...this.counters },
      gauges: { ...this.gauges },
      system: {
        cpu: this.gauges.cpuUsage,
        memory: this.gauges.memoryUsage,
        load: this.gauges.loadAverage,
        uptime
      },
      application: {
        totalRequests: this.counters.totalRequests,
        totalErrors: this.counters.totalErrors,
        activeConnections: this.counters.activeConnections,
        averageResponseTime: this.calculateAverageResponseTime(),
        errorRate: this.counters.totalRequests > 0 ? 
          (this.counters.totalErrors / this.counters.totalRequests) * 100 : 0
      }
    };
  }

  // Get detailed metrics
  getDetailedMetrics(timeRange = 3600000) { // Default 1 hour
    const cutoffTime = Date.now() - timeRange;
    
    const filterByTime = (dataPoints) => 
      dataPoints.filter(point => point.timestamp >= cutoffTime);
    
    return {
      system: {
        cpu: filterByTime(this.metrics.system.cpu || []),
        memory: filterByTime(this.metrics.system.memory || []),
        load: filterByTime(this.metrics.system.load || []),
        uptime: filterByTime(this.metrics.system.uptime || [])
      },
      application: {
        connections: filterByTime(this.metrics.application.connections || []),
        requests: filterByTime(this.metrics.application.requests || []),
        responses: filterByTime(this.metrics.application.responses || []),
        errors: filterByTime(this.metrics.application.errors || []),
        latency: filterByTime(this.metrics.application.latency || [])
      },
      custom: Object.fromEntries(
        Array.from(this.metrics.custom.entries()).map(([name, data]) => [
          name,
          filterByTime(data)
        ])
      ),
      histograms: {
        responseTimes: this.histograms.responseTimes.filter(r => r.timestamp >= cutoffTime),
        connectionDuration: this.histograms.connectionDuration.filter(c => c.timestamp >= cutoffTime)
      }
    };
  }

  // Get performance statistics
  getPerformanceStats() {
    const responseTimes = this.histograms.responseTimes
      .filter(r => Date.now() - r.timestamp < 300000) // Last 5 minutes
      .map(r => r.duration)
      .sort((a, b) => a - b);
    
    if (responseTimes.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        p95: 0,
        p99: 0
      };
    }
    
    const count = responseTimes.length;
    const min = responseTimes[0];
    const max = responseTimes[count - 1];
    const mean = responseTimes.reduce((sum, time) => sum + time, 0) / count;
    const median = responseTimes[Math.floor(count / 2)];
    const p95 = responseTimes[Math.floor(count * 0.95)];
    const p99 = responseTimes[Math.floor(count * 0.99)];
    
    return {
      count,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      p95: Math.round(p95 * 100) / 100,
      p99: Math.round(p99 * 100) / 100
    };
  }

  // Clean up old data
  cleanupOldData() {
    const cutoffTime = Date.now() - this.config.retentionPeriod;
    
    // Clean system metrics
    Object.keys(this.metrics.system).forEach(key => {
      this.metrics.system[key] = this.metrics.system[key]
        .filter(point => point.timestamp >= cutoffTime);
    });
    
    // Clean application metrics
    Object.keys(this.metrics.application).forEach(key => {
      this.metrics.application[key] = this.metrics.application[key]
        .filter(point => point.timestamp >= cutoffTime);
    });
    
    // Clean custom metrics
    for (const [name, data] of this.metrics.custom.entries()) {
      const filteredData = data.filter(point => point.timestamp >= cutoffTime);
      this.metrics.custom.set(name, filteredData);
    }
    
    // Clean histograms
    this.histograms.responseTimes = this.histograms.responseTimes
      .filter(r => r.timestamp >= cutoffTime);
    this.histograms.connectionDuration = this.histograms.connectionDuration
      .filter(c => c.timestamp >= cutoffTime);
  }

  // Export metrics in Prometheus format
  exportPrometheusMetrics() {
    const metrics = [];
    const timestamp = Date.now();
    
    // Counters
    Object.entries(this.counters).forEach(([name, value]) => {
      metrics.push(`# TYPE ${name} counter`);
      metrics.push(`${name} ${value} ${timestamp}`);
    });
    
    // Gauges
    Object.entries(this.gauges).forEach(([name, value]) => {
      metrics.push(`# TYPE ${name} gauge`);
      metrics.push(`${name} ${value} ${timestamp}`);
    });
    
    return metrics.join('\n');
  }

  // Stop metrics collection
  stop() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    
    logger.info('Metrics collection stopped');
  }

  // Cleanup resources
  cleanup() {
    this.stop();
    
    // Clear all metrics data
    this.metrics.system = { cpu: [], memory: [], load: [], uptime: [] };
    this.metrics.application = { connections: [], requests: [], responses: [], errors: [], latency: [] };
    this.metrics.custom.clear();
    
    // Reset counters and gauges
    Object.keys(this.counters).forEach(key => this.counters[key] = 0);
    Object.keys(this.gauges).forEach(key => this.gauges[key] = 0);
    
    // Clear histograms
    this.histograms.responseTimes = [];
    this.histograms.connectionDuration = [];
    
    logger.info('Metrics collector cleaned up');
  }
}

// Export singleton instance
export const metricsCollector = new MetricsCollector();