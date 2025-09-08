/**
 * =============================================================================
 * NEXUS IDE - Advanced Performance Monitoring System
 * =============================================================================
 * 
 * Comprehensive performance monitoring and optimization utilities
 * 
 * Features:
 * - Real-time performance metrics collection
 * - Resource usage monitoring (CPU, Memory, Network, Disk)
 * - Application performance monitoring (APM)
 * - Custom metrics and alerts
 * - Performance profiling and analysis
 * - Bottleneck detection and optimization suggestions
 * - Historical performance data
 * - Performance benchmarking
 * 
 * Author: NEXUS IDE Team
 * Version: 1.0.0
 * License: MIT
 * 
 * =============================================================================
 */

'use strict';

const EventEmitter = require('events');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { performance, PerformanceObserver } = require('perf_hooks');
const cluster = require('cluster');
const config = require('../config/config');
const logger = require('./logger');
const { db } = require('./database');

// =============================================================================
// Performance Monitor Class
// =============================================================================

class PerformanceMonitor extends EventEmitter {
  constructor() {
    super();
    
    // Metrics storage
    this.metrics = {
      system: {
        cpu: { usage: 0, load: [0, 0, 0] },
        memory: { used: 0, free: 0, total: 0, percentage: 0 },
        disk: { read: 0, write: 0, usage: 0 },
        network: { rx: 0, tx: 0 }
      },
      application: {
        requests: { total: 0, success: 0, error: 0, rate: 0 },
        response: { avg: 0, min: 0, max: 0, p95: 0, p99: 0 },
        database: { queries: 0, connections: 0, avgTime: 0 },
        cache: { hits: 0, misses: 0, hitRate: 0 },
        ai: { requests: 0, tokens: 0, avgTime: 0, errors: 0 }
      },
      custom: new Map()
    };
    
    // Performance history
    this.history = {
      system: [],
      application: [],
      custom: new Map()
    };
    
    // Timers and intervals
    this.timers = new Map();
    this.intervals = new Map();
    
    // Performance observers
    this.observers = new Map();
    
    // Alerts and thresholds
    this.alerts = new Map();
    this.thresholds = config.monitoring.thresholds;
    
    // Profiling data
    this.profiles = new Map();
    
    // Benchmarks
    this.benchmarks = new Map();
    
    this.isInitialized = false;
    this.initPromise = null;
  }
  
  /**
   * Initialize performance monitor
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }
    
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = this._performInitialization();
    return this.initPromise;
  }
  
  async _performInitialization() {
    try {
      logger.info('Initializing performance monitor...');
      
      // Setup performance observers
      this.setupPerformanceObservers();
      
      // Start system monitoring
      this.startSystemMonitoring();
      
      // Start application monitoring
      this.startApplicationMonitoring();
      
      // Setup alerts
      this.setupAlerts();
      
      // Start data collection
      this.startDataCollection();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      logger.info('Performance monitor initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize performance monitor', {
        error: error.message
      });
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Setup performance observers
   */
  setupPerformanceObservers() {
    // HTTP requests observer
    const httpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordHttpMetric(entry);
      }
    });
    httpObserver.observe({ entryTypes: ['measure'] });
    this.observers.set('http', httpObserver);
    
    // Function calls observer
    const functionObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordFunctionMetric(entry);
      }
    });
    functionObserver.observe({ entryTypes: ['function'] });
    this.observers.set('function', functionObserver);
    
    // GC observer
    const gcObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordGCMetric(entry);
      }
    });
    gcObserver.observe({ entryTypes: ['gc'] });
    this.observers.set('gc', gcObserver);
    
    logger.info('Performance observers setup completed');
  }
  
  /**
   * Start system monitoring
   */
  startSystemMonitoring() {
    const interval = config.monitoring.system.interval;
    
    const systemInterval = setInterval(async () => {
      await this.collectSystemMetrics();
    }, interval);
    
    this.intervals.set('system', systemInterval);
    
    logger.info('System monitoring started', { interval });
  }
  
  /**
   * Start application monitoring
   */
  startApplicationMonitoring() {
    const interval = config.monitoring.application.interval;
    
    const appInterval = setInterval(async () => {
      await this.collectApplicationMetrics();
    }, interval);
    
    this.intervals.set('application', appInterval);
    
    logger.info('Application monitoring started', { interval });
  }
  
  /**
   * Collect system metrics
   */
  async collectSystemMetrics() {
    try {
      const timestamp = Date.now();
      
      // CPU metrics
      const cpuUsage = await this.getCPUUsage();
      const loadAvg = os.loadavg();
      
      // Memory metrics
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      
      // Disk metrics
      const diskUsage = await this.getDiskUsage();
      
      // Network metrics
      const networkUsage = await this.getNetworkUsage();
      
      // Update metrics
      this.metrics.system = {
        cpu: {
          usage: cpuUsage,
          load: loadAvg,
          cores: os.cpus().length
        },
        memory: {
          used: usedMemory,
          free: freeMemory,
          total: totalMemory,
          percentage: (usedMemory / totalMemory) * 100,
          process: memoryUsage
        },
        disk: diskUsage,
        network: networkUsage,
        uptime: os.uptime(),
        timestamp
      };
      
      // Store in history
      this.history.system.push({ ...this.metrics.system });
      this.trimHistory('system');
      
      // Check thresholds
      this.checkSystemThresholds();
      
      this.emit('systemMetrics', this.metrics.system);
      
    } catch (error) {
      logger.error('Failed to collect system metrics', {
        error: error.message
      });
    }
  }
  
  /**
   * Collect application metrics
   */
  async collectApplicationMetrics() {
    try {
      const timestamp = Date.now();
      
      // Request metrics
      const requestMetrics = this.calculateRequestMetrics();
      
      // Response time metrics
      const responseMetrics = this.calculateResponseMetrics();
      
      // Database metrics
      const dbMetrics = await this.getDatabaseMetrics();
      
      // Cache metrics
      const cacheMetrics = await this.getCacheMetrics();
      
      // AI metrics
      const aiMetrics = await this.getAIMetrics();
      
      // Update metrics
      this.metrics.application = {
        requests: requestMetrics,
        response: responseMetrics,
        database: dbMetrics,
        cache: cacheMetrics,
        ai: aiMetrics,
        timestamp
      };
      
      // Store in history
      this.history.application.push({ ...this.metrics.application });
      this.trimHistory('application');
      
      // Check thresholds
      this.checkApplicationThresholds();
      
      this.emit('applicationMetrics', this.metrics.application);
      
    } catch (error) {
      logger.error('Failed to collect application metrics', {
        error: error.message
      });
    }
  }
  
  /**
   * Get CPU usage
   */
  async getCPUUsage() {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime.bigint();
      
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = process.hrtime.bigint();
        
        const elapsedTime = Number(endTime - startTime) / 1000000; // Convert to ms
        const cpuPercent = ((endUsage.user + endUsage.system) / elapsedTime) * 100;
        
        resolve(Math.min(cpuPercent, 100));
      }, 100);
    });
  }
  
  /**
   * Get disk usage
   */
  async getDiskUsage() {
    try {
      const stats = await fs.stat(process.cwd());
      
      // This is a simplified version - in production, you'd want to use
      // platform-specific tools to get actual disk I/O metrics
      return {
        read: 0,
        write: 0,
        usage: 0,
        available: 0
      };
    } catch (error) {
      return {
        read: 0,
        write: 0,
        usage: 0,
        available: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Get network usage
   */
  async getNetworkUsage() {
    const interfaces = os.networkInterfaces();
    let totalRx = 0;
    let totalTx = 0;
    
    // This is a simplified version - in production, you'd want to track
    // actual network I/O over time
    for (const [name, addrs] of Object.entries(interfaces)) {
      if (addrs) {
        for (const addr of addrs) {
          if (!addr.internal) {
            // Placeholder for actual network metrics
            totalRx += 0;
            totalTx += 0;
          }
        }
      }
    }
    
    return {
      rx: totalRx,
      tx: totalTx,
      interfaces: Object.keys(interfaces).length
    };
  }
  
  /**
   * Calculate request metrics
   */
  calculateRequestMetrics() {
    // This would be populated by middleware tracking requests
    const requests = this.getCustomMetric('requests') || {
      total: 0,
      success: 0,
      error: 0
    };
    
    const rate = this.calculateRate('requests', requests.total);
    
    return {
      ...requests,
      rate,
      errorRate: requests.total > 0 ? (requests.error / requests.total) * 100 : 0,
      successRate: requests.total > 0 ? (requests.success / requests.total) * 100 : 0
    };
  }
  
  /**
   * Calculate response metrics
   */
  calculateResponseMetrics() {
    const responseTimes = this.getCustomMetric('responseTimes') || [];
    
    if (responseTimes.length === 0) {
      return {
        avg: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0
      };
    }
    
    const sorted = [...responseTimes].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    return {
      avg: sum / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99)
    };
  }
  
  /**
   * Get database metrics
   */
  async getDatabaseMetrics() {
    try {
      // Get metrics from database manager
      const dbStats = await db.getStats();
      
      return {
        queries: dbStats.queries || 0,
        connections: dbStats.connections || 0,
        avgTime: dbStats.avgQueryTime || 0,
        errors: dbStats.errors || 0,
        poolSize: dbStats.poolSize || 0
      };
    } catch (error) {
      return {
        queries: 0,
        connections: 0,
        avgTime: 0,
        errors: 1,
        poolSize: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Get cache metrics
   */
  async getCacheMetrics() {
    try {
      // This would be populated by cache manager
      const cacheStats = this.getCustomMetric('cache') || {
        hits: 0,
        misses: 0
      };
      
      const total = cacheStats.hits + cacheStats.misses;
      const hitRate = total > 0 ? (cacheStats.hits / total) * 100 : 0;
      
      return {
        ...cacheStats,
        hitRate,
        total
      };
    } catch (error) {
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        total: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Get AI metrics
   */
  async getAIMetrics() {
    try {
      const aiStats = this.getCustomMetric('ai') || {
        requests: 0,
        tokens: 0,
        errors: 0,
        totalTime: 0
      };
      
      const avgTime = aiStats.requests > 0 ? aiStats.totalTime / aiStats.requests : 0;
      
      return {
        ...aiStats,
        avgTime,
        tokensPerSecond: avgTime > 0 ? aiStats.tokens / (avgTime / 1000) : 0
      };
    } catch (error) {
      return {
        requests: 0,
        tokens: 0,
        errors: 1,
        avgTime: 0,
        tokensPerSecond: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Record HTTP metric
   */
  recordHttpMetric(entry) {
    const requests = this.getCustomMetric('requests') || {
      total: 0,
      success: 0,
      error: 0
    };
    
    requests.total++;
    
    if (entry.name.includes('success')) {
      requests.success++;
    } else if (entry.name.includes('error')) {
      requests.error++;
    }
    
    this.setCustomMetric('requests', requests);
    
    // Record response time
    const responseTimes = this.getCustomMetric('responseTimes') || [];
    responseTimes.push(entry.duration);
    
    // Keep only recent response times
    if (responseTimes.length > 1000) {
      responseTimes.shift();
    }
    
    this.setCustomMetric('responseTimes', responseTimes);
  }
  
  /**
   * Record function metric
   */
  recordFunctionMetric(entry) {
    const functions = this.getCustomMetric('functions') || new Map();
    
    if (!functions.has(entry.name)) {
      functions.set(entry.name, {
        calls: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0
      });
    }
    
    const func = functions.get(entry.name);
    func.calls++;
    func.totalTime += entry.duration;
    func.avgTime = func.totalTime / func.calls;
    func.minTime = Math.min(func.minTime, entry.duration);
    func.maxTime = Math.max(func.maxTime, entry.duration);
    
    this.setCustomMetric('functions', functions);
  }
  
  /**
   * Record GC metric
   */
  recordGCMetric(entry) {
    const gc = this.getCustomMetric('gc') || {
      collections: 0,
      totalTime: 0,
      avgTime: 0
    };
    
    gc.collections++;
    gc.totalTime += entry.duration;
    gc.avgTime = gc.totalTime / gc.collections;
    
    this.setCustomMetric('gc', gc);
  }
  
  /**
   * Start timer
   */
  startTimer(name, labels = {}) {
    const timer = {
      name,
      labels,
      startTime: performance.now(),
      startMark: `${name}-start-${Date.now()}`
    };
    
    performance.mark(timer.startMark);
    this.timers.set(name, timer);
    
    return timer;
  }
  
  /**
   * End timer
   */
  endTimer(name, additionalLabels = {}) {
    const timer = this.timers.get(name);
    if (!timer) {
      logger.warn('Timer not found', { name });
      return null;
    }
    
    const endTime = performance.now();
    const duration = endTime - timer.startTime;
    const endMark = `${name}-end-${Date.now()}`;
    
    performance.mark(endMark);
    performance.measure(name, timer.startMark, endMark);
    
    this.timers.delete(name);
    
    const result = {
      name,
      duration,
      labels: { ...timer.labels, ...additionalLabels },
      timestamp: Date.now()
    };
    
    this.emit('timerEnd', result);
    
    return result;
  }
  
  /**
   * Create performance profile
   */
  startProfile(name, options = {}) {
    const profile = {
      name,
      startTime: performance.now(),
      samples: [],
      options
    };
    
    this.profiles.set(name, profile);
    
    // Start sampling if enabled
    if (options.sampling) {
      profile.samplingInterval = setInterval(() => {
        profile.samples.push({
          timestamp: Date.now(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        });
      }, options.samplingInterval || 100);
    }
    
    return profile;
  }
  
  /**
   * End performance profile
   */
  endProfile(name) {
    const profile = this.profiles.get(name);
    if (!profile) {
      logger.warn('Profile not found', { name });
      return null;
    }
    
    profile.endTime = performance.now();
    profile.duration = profile.endTime - profile.startTime;
    
    if (profile.samplingInterval) {
      clearInterval(profile.samplingInterval);
    }
    
    this.profiles.delete(name);
    
    const result = {
      ...profile,
      analysis: this.analyzeProfile(profile)
    };
    
    this.emit('profileEnd', result);
    
    return result;
  }
  
  /**
   * Analyze profile
   */
  analyzeProfile(profile) {
    const analysis = {
      duration: profile.duration,
      samples: profile.samples.length,
      memory: {
        peak: 0,
        average: 0,
        growth: 0
      },
      cpu: {
        total: 0,
        average: 0
      }
    };
    
    if (profile.samples.length > 0) {
      let totalMemory = 0;
      let totalCpu = 0;
      let peakMemory = 0;
      
      for (const sample of profile.samples) {
        const memUsage = sample.memory.heapUsed;
        totalMemory += memUsage;
        peakMemory = Math.max(peakMemory, memUsage);
        
        const cpuUsage = sample.cpu.user + sample.cpu.system;
        totalCpu += cpuUsage;
      }
      
      analysis.memory.peak = peakMemory;
      analysis.memory.average = totalMemory / profile.samples.length;
      analysis.memory.growth = profile.samples[profile.samples.length - 1].memory.heapUsed - profile.samples[0].memory.heapUsed;
      
      analysis.cpu.total = totalCpu;
      analysis.cpu.average = totalCpu / profile.samples.length;
    }
    
    return analysis;
  }
  
  /**
   * Run benchmark
   */
  async runBenchmark(name, fn, options = {}) {
    const iterations = options.iterations || 1000;
    const warmup = options.warmup || 100;
    
    logger.info('Starting benchmark', { name, iterations, warmup });
    
    // Warmup
    for (let i = 0; i < warmup; i++) {
      await fn();
    }
    
    // Collect garbage before benchmark
    if (global.gc) {
      global.gc();
    }
    
    const results = [];
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const iterStart = performance.now();
      await fn();
      const iterEnd = performance.now();
      
      results.push(iterEnd - iterStart);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    const benchmark = {
      name,
      iterations,
      totalTime,
      results,
      stats: this.calculateBenchmarkStats(results),
      timestamp: Date.now()
    };
    
    this.benchmarks.set(name, benchmark);
    this.emit('benchmarkComplete', benchmark);
    
    logger.info('Benchmark completed', {
      name,
      totalTime,
      avgTime: benchmark.stats.avg,
      opsPerSec: benchmark.stats.opsPerSec
    });
    
    return benchmark;
  }
  
  /**
   * Calculate benchmark statistics
   */
  calculateBenchmarkStats(results) {
    const sorted = [...results].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / sorted.length;
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg,
      median: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
      stdDev: this.calculateStdDev(results, avg),
      opsPerSec: 1000 / avg
    };
  }
  
  /**
   * Calculate standard deviation
   */
  calculateStdDev(values, mean) {
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }
  
  /**
   * Calculate percentile
   */
  percentile(sortedArray, percentile) {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (upper >= sortedArray.length) {
      return sortedArray[sortedArray.length - 1];
    }
    
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }
  
  /**
   * Calculate rate
   */
  calculateRate(metricName, currentValue) {
    const history = this.history.application;
    if (history.length < 2) {
      return 0;
    }
    
    const previous = history[history.length - 2];
    const current = history[history.length - 1];
    
    if (!previous || !current) {
      return 0;
    }
    
    const timeDiff = (current.timestamp - previous.timestamp) / 1000; // seconds
    const valueDiff = currentValue - (previous[metricName] || 0);
    
    return timeDiff > 0 ? valueDiff / timeDiff : 0;
  }
  
  /**
   * Setup alerts
   */
  setupAlerts() {
    // CPU alert
    this.alerts.set('cpu', {
      threshold: this.thresholds.cpu.warning,
      condition: (metrics) => metrics.system.cpu.usage > this.thresholds.cpu.warning,
      message: 'High CPU usage detected'
    });
    
    // Memory alert
    this.alerts.set('memory', {
      threshold: this.thresholds.memory.warning,
      condition: (metrics) => metrics.system.memory.percentage > this.thresholds.memory.warning,
      message: 'High memory usage detected'
    });
    
    // Response time alert
    this.alerts.set('responseTime', {
      threshold: this.thresholds.responseTime.warning,
      condition: (metrics) => metrics.application.response.avg > this.thresholds.responseTime.warning,
      message: 'High response time detected'
    });
    
    // Error rate alert
    this.alerts.set('errorRate', {
      threshold: this.thresholds.errorRate.warning,
      condition: (metrics) => metrics.application.requests.errorRate > this.thresholds.errorRate.warning,
      message: 'High error rate detected'
    });
    
    logger.info('Performance alerts setup completed');
  }
  
  /**
   * Check system thresholds
   */
  checkSystemThresholds() {
    for (const [name, alert] of this.alerts) {
      if (name.startsWith('system') || ['cpu', 'memory'].includes(name)) {
        if (alert.condition(this.metrics)) {
          this.triggerAlert(name, alert, this.metrics.system);
        }
      }
    }
  }
  
  /**
   * Check application thresholds
   */
  checkApplicationThresholds() {
    for (const [name, alert] of this.alerts) {
      if (name.startsWith('application') || ['responseTime', 'errorRate'].includes(name)) {
        if (alert.condition(this.metrics)) {
          this.triggerAlert(name, alert, this.metrics.application);
        }
      }
    }
  }
  
  /**
   * Trigger alert
   */
  triggerAlert(name, alert, metrics) {
    const alertData = {
      name,
      message: alert.message,
      threshold: alert.threshold,
      metrics,
      timestamp: Date.now()
    };
    
    logger.warn('Performance alert triggered', alertData);
    this.emit('alert', alertData);
  }
  
  /**
   * Start data collection
   */
  startDataCollection() {
    const interval = config.monitoring.dataCollection.interval;
    
    const collectionInterval = setInterval(async () => {
      await this.persistMetrics();
    }, interval);
    
    this.intervals.set('dataCollection', collectionInterval);
    
    logger.info('Data collection started', { interval });
  }
  
  /**
   * Persist metrics to database
   */
  async persistMetrics() {
    try {
      if (!config.monitoring.dataCollection.enabled) {
        return;
      }
      
      const data = {
        timestamp: Date.now(),
        system: this.metrics.system,
        application: this.metrics.application,
        custom: Object.fromEntries(this.metrics.custom)
      };
      
      // Store in database
      await db.collection('performance_metrics').insertOne(data);
      
      logger.debug('Metrics persisted to database');
      
    } catch (error) {
      logger.error('Failed to persist metrics', {
        error: error.message
      });
    }
  }
  
  /**
   * Trim history to keep memory usage manageable
   */
  trimHistory(type) {
    const maxSize = config.monitoring.history.maxSize;
    
    if (this.history[type].length > maxSize) {
      this.history[type] = this.history[type].slice(-maxSize);
    }
  }
  
  /**
   * Get custom metric
   */
  getCustomMetric(name) {
    return this.metrics.custom.get(name);
  }
  
  /**
   * Set custom metric
   */
  setCustomMetric(name, value) {
    this.metrics.custom.set(name, value);
    this.emit('customMetric', { name, value });
  }
  
  /**
   * Increment custom metric
   */
  incrementCustomMetric(name, value = 1) {
    const current = this.getCustomMetric(name) || 0;
    this.setCustomMetric(name, current + value);
  }
  
  /**
   * Get all metrics
   */
  getAllMetrics() {
    return {
      system: this.metrics.system,
      application: this.metrics.application,
      custom: Object.fromEntries(this.metrics.custom),
      timestamp: Date.now()
    };
  }
  
  /**
   * Get performance report
   */
  getPerformanceReport(options = {}) {
    const timeRange = options.timeRange || 3600000; // 1 hour
    const now = Date.now();
    const startTime = now - timeRange;
    
    // Filter history by time range
    const systemHistory = this.history.system.filter(m => m.timestamp >= startTime);
    const applicationHistory = this.history.application.filter(m => m.timestamp >= startTime);
    
    return {
      summary: {
        timeRange,
        dataPoints: {
          system: systemHistory.length,
          application: applicationHistory.length
        },
        current: this.getAllMetrics()
      },
      trends: {
        system: this.calculateTrends(systemHistory),
        application: this.calculateTrends(applicationHistory)
      },
      benchmarks: Object.fromEntries(this.benchmarks),
      alerts: this.getRecentAlerts(timeRange),
      recommendations: this.generateRecommendations()
    };
  }
  
  /**
   * Calculate trends
   */
  calculateTrends(history) {
    if (history.length < 2) {
      return {};
    }
    
    const first = history[0];
    const last = history[history.length - 1];
    
    return {
      duration: last.timestamp - first.timestamp,
      dataPoints: history.length,
      // Add specific trend calculations based on metric type
    };
  }
  
  /**
   * Get recent alerts
   */
  getRecentAlerts(timeRange) {
    // This would be implemented to return recent alerts from storage
    return [];
  }
  
  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // CPU recommendations
    if (this.metrics.system.cpu.usage > 80) {
      recommendations.push({
        type: 'cpu',
        severity: 'high',
        message: 'High CPU usage detected. Consider scaling horizontally or optimizing CPU-intensive operations.',
        actions: ['Scale horizontally', 'Optimize algorithms', 'Enable CPU profiling']
      });
    }
    
    // Memory recommendations
    if (this.metrics.system.memory.percentage > 85) {
      recommendations.push({
        type: 'memory',
        severity: 'high',
        message: 'High memory usage detected. Consider optimizing memory usage or increasing available memory.',
        actions: ['Optimize memory usage', 'Increase memory', 'Enable memory profiling']
      });
    }
    
    // Response time recommendations
    if (this.metrics.application.response.avg > 1000) {
      recommendations.push({
        type: 'responseTime',
        severity: 'medium',
        message: 'High response times detected. Consider optimizing database queries or enabling caching.',
        actions: ['Optimize database queries', 'Enable caching', 'Add CDN']
      });
    }
    
    return recommendations;
  }
  
  /**
   * Close performance monitor
   */
  async close() {
    logger.info('Closing performance monitor...');
    
    // Clear all intervals
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      logger.info(`Interval ${name} cleared`);
    }
    
    // Disconnect observers
    for (const [name, observer] of this.observers) {
      observer.disconnect();
      logger.info(`Observer ${name} disconnected`);
    }
    
    // Clear all timers
    this.timers.clear();
    
    // Persist final metrics
    await this.persistMetrics();
    
    this.isInitialized = false;
    
    logger.info('Performance monitor closed');
  }
}

// =============================================================================
// Middleware Functions
// =============================================================================

/**
 * Express middleware for request tracking
 */
function requestTrackingMiddleware(performanceMonitor) {
  return (req, res, next) => {
    const startTime = performance.now();
    const timer = performanceMonitor.startTimer(`request-${req.method}-${req.path}`, {
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    
    // Track request
    performanceMonitor.incrementCustomMetric('requests.total');
    
    res.on('finish', () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // End timer
      performanceMonitor.endTimer(timer.name, {
        statusCode: res.statusCode,
        contentLength: res.get('Content-Length')
      });
      
      // Track response
      if (res.statusCode >= 200 && res.statusCode < 400) {
        performanceMonitor.incrementCustomMetric('requests.success');
        performance.mark(`request-success-${Date.now()}`);
      } else {
        performanceMonitor.incrementCustomMetric('requests.error');
        performance.mark(`request-error-${Date.now()}`);
      }
      
      // Record response time
      const responseTimes = performanceMonitor.getCustomMetric('responseTimes') || [];
      responseTimes.push(duration);
      
      if (responseTimes.length > 1000) {
        responseTimes.shift();
      }
      
      performanceMonitor.setCustomMetric('responseTimes', responseTimes);
    });
    
    next();
  };
}

/**
 * Function wrapper for performance tracking
 */
function trackFunction(performanceMonitor, name, fn) {
  return async function(...args) {
    const timer = performanceMonitor.startTimer(`function-${name}`);
    
    try {
      const result = await fn.apply(this, args);
      performanceMonitor.endTimer(timer.name, { success: true });
      return result;
    } catch (error) {
      performanceMonitor.endTimer(timer.name, { success: false, error: error.message });
      throw error;
    }
  };
}

// =============================================================================
// Export
// =============================================================================

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = {
  // Performance monitor instance
  monitor: performanceMonitor,
  
  // Utility functions
  initialize: () => performanceMonitor.initialize(),
  startTimer: (name, labels) => performanceMonitor.startTimer(name, labels),
  endTimer: (name, labels) => performanceMonitor.endTimer(name, labels),
  startProfile: (name, options) => performanceMonitor.startProfile(name, options),
  endProfile: (name) => performanceMonitor.endProfile(name),
  runBenchmark: (name, fn, options) => performanceMonitor.runBenchmark(name, fn, options),
  getMetrics: () => performanceMonitor.getAllMetrics(),
  getReport: (options) => performanceMonitor.getPerformanceReport(options),
  setCustomMetric: (name, value) => performanceMonitor.setCustomMetric(name, value),
  incrementCustomMetric: (name, value) => performanceMonitor.incrementCustomMetric(name, value),
  close: () => performanceMonitor.close(),
  
  // Middleware
  requestTrackingMiddleware: () => requestTrackingMiddleware(performanceMonitor),
  trackFunction: (name, fn) => trackFunction(performanceMonitor, name, fn)
};

// =============================================================================
// End of File
// =============================================================================