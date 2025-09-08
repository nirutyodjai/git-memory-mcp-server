const EventEmitter = require('events');
const logger = require('../utils/logger');

/**
 * MonitoringService - Advanced monitoring and health checking for MCP servers
 * Provides comprehensive monitoring, alerting, and health checking capabilities
 */
class MonitoringService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      checkInterval: options.checkInterval || 30000, // 30 seconds
      alertThreshold: options.alertThreshold || 5, // 5 consecutive failures
      enablePrometheus: options.enablePrometheus || false,
      enableAlerts: options.enableAlerts || true,
      retentionPeriod: options.retentionPeriod || 24 * 60 * 60 * 1000, // 24 hours
      ...options
    };

    this.servers = new Map(); // server monitoring state
    this.metrics = new Map(); // metrics storage
    this.alerts = new Map(); // active alerts
    this.isRunning = false;
    this.intervalId = null;
    
    // Health check configurations
    this.healthChecks = {
      'git-memory': this.checkGitMemoryHealth.bind(this),
      'semantic-memory': this.checkSemanticMemoryHealth.bind(this),
      'mcp-protocol': this.checkMCPProtocolHealth.bind(this),
      'distributed-memory': this.checkDistributedMemoryHealth.bind(this),
      'external-mcp': this.checkExternalMCPHealth.bind(this)
    };
    
    // Metrics collection
    this.metricsCollectors = {
      'response_time': this.collectResponseTimeMetrics.bind(this),
      'error_rate': this.collectErrorRateMetrics.bind(this),
      'memory_usage': this.collectMemoryUsageMetrics.bind(this),
      'cache_hit_rate': this.collectCacheHitRateMetrics.bind(this),
      'throughput': this.collectThroughputMetrics.bind(this)
    };

    logger.info('MonitoringService initialized', {
      checkInterval: this.options.checkInterval,
      alertThreshold: this.options.alertThreshold,
      enablePrometheus: this.options.enablePrometheus
    });
  }

  /**
   * Start monitoring service
   */
  async start() {
    if (this.isRunning) {
      logger.warn('MonitoringService is already running');
      return;
    }

    try {
      this.isRunning = true;
      this.intervalId = setInterval(() => {
        this.performHealthChecks();
      }, this.options.checkInterval);

      // Initialize metrics cleanup
      this.startMetricsCleanup();

      logger.info('MonitoringService started successfully');
      this.emit('monitoring_started');
    } catch (error) {
      logger.error('Failed to start MonitoringService', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop monitoring service
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    try {
      this.isRunning = false;
      
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }

      if (this.cleanupIntervalId) {
        clearInterval(this.cleanupIntervalId);
        this.cleanupIntervalId = null;
      }

      logger.info('MonitoringService stopped successfully');
      this.emit('monitoring_stopped');
    } catch (error) {
      logger.error('Error stopping MonitoringService', { error: error.message });
      throw error;
    }
  }

  /**
   * Register a server for monitoring
   */
  registerServer(serverId, serverConfig) {
    const serverState = {
      id: serverId,
      type: serverConfig.type,
      endpoint: serverConfig.endpoint,
      status: 'unknown',
      lastCheck: null,
      consecutiveFailures: 0,
      uptime: 0,
      downtime: 0,
      lastUptime: Date.now(),
      metrics: {
        responseTime: [],
        errorRate: 0,
        memoryUsage: 0,
        cacheHitRate: 0,
        throughput: 0
      },
      config: serverConfig
    };

    this.servers.set(serverId, serverState);
    this.initializeServerMetrics(serverId);

    logger.info('Server registered for monitoring', { serverId, type: serverConfig.type });
    this.emit('server_registered', { serverId, serverConfig });
  }

  /**
   * Unregister a server from monitoring
   */
  unregisterServer(serverId) {
    if (this.servers.has(serverId)) {
      this.servers.delete(serverId);
      this.metrics.delete(serverId);
      
      // Clear any active alerts for this server
      for (const [alertId, alert] of this.alerts.entries()) {
        if (alert.serverId === serverId) {
          this.alerts.delete(alertId);
        }
      }

      logger.info('Server unregistered from monitoring', { serverId });
      this.emit('server_unregistered', { serverId });
    }
  }

  /**
   * Perform health checks on all registered servers
   */
  async performHealthChecks() {
    const promises = [];
    
    for (const [serverId, serverState] of this.servers.entries()) {
      promises.push(this.checkServerHealth(serverId, serverState));
    }

    try {
      await Promise.allSettled(promises);
      this.emit('health_check_completed', { timestamp: Date.now() });
    } catch (error) {
      logger.error('Error during health checks', { error: error.message });
    }
  }

  /**
   * Check health of a specific server
   */
  async checkServerHealth(serverId, serverState) {
    const startTime = Date.now();
    
    try {
      const healthChecker = this.healthChecks[serverState.type];
      if (!healthChecker) {
        throw new Error(`No health checker for server type: ${serverState.type}`);
      }

      const healthResult = await healthChecker(serverState);
      const responseTime = Date.now() - startTime;

      // Update server state
      const wasHealthy = serverState.status === 'healthy';
      serverState.status = healthResult.healthy ? 'healthy' : 'unhealthy';
      serverState.lastCheck = Date.now();
      serverState.metrics.responseTime.push(responseTime);
      
      // Keep only last 100 response times
      if (serverState.metrics.responseTime.length > 100) {
        serverState.metrics.responseTime.shift();
      }

      if (healthResult.healthy) {
        serverState.consecutiveFailures = 0;
        if (!wasHealthy) {
          this.handleServerRecovery(serverId, serverState);
        }
      } else {
        serverState.consecutiveFailures++;
        this.handleServerFailure(serverId, serverState, healthResult.error);
      }

      // Collect additional metrics
      await this.collectServerMetrics(serverId, serverState, healthResult);

      logger.debug('Server health check completed', {
        serverId,
        status: serverState.status,
        responseTime,
        consecutiveFailures: serverState.consecutiveFailures
      });

    } catch (error) {
      serverState.status = 'error';
      serverState.lastCheck = Date.now();
      serverState.consecutiveFailures++;
      
      this.handleServerFailure(serverId, serverState, error.message);
      
      logger.error('Server health check failed', {
        serverId,
        error: error.message
      });
    }
  }

  /**
   * Git Memory health checker
   */
  async checkGitMemoryHealth(serverState) {
    try {
      // Check if Git repository is accessible and writable
      const testResult = await this.testGitMemoryOperations(serverState);
      return {
        healthy: testResult.success,
        details: testResult.details,
        error: testResult.error
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Semantic Memory health checker
   */
  async checkSemanticMemoryHealth(serverState) {
    try {
      // Test semantic search capabilities
      const testResult = await this.testSemanticMemoryOperations(serverState);
      return {
        healthy: testResult.success,
        details: testResult.details,
        error: testResult.error
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * MCP Protocol health checker
   */
  async checkMCPProtocolHealth(serverState) {
    try {
      // Test MCP protocol communication
      const testResult = await this.testMCPProtocolOperations(serverState);
      return {
        healthy: testResult.success,
        details: testResult.details,
        error: testResult.error
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Distributed Memory health checker
   */
  async checkDistributedMemoryHealth(serverState) {
    try {
      // Test distributed memory operations
      const testResult = await this.testDistributedMemoryOperations(serverState);
      return {
        healthy: testResult.success,
        details: testResult.details,
        error: testResult.error
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * External MCP health checker
   */
  async checkExternalMCPHealth(serverState) {
    try {
      // Test external MCP server connectivity
      const testResult = await this.testExternalMCPOperations(serverState);
      return {
        healthy: testResult.success,
        details: testResult.details,
        error: testResult.error
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Test Git Memory operations
   */
  async testGitMemoryOperations(serverState) {
    // Simulate Git memory test
    const testKey = `health_check_${Date.now()}`;
    const testData = { test: true, timestamp: Date.now() };
    
    try {
      // This would normally call the actual Git memory service
      // For now, we'll simulate the test
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      
      return {
        success: Math.random() > 0.1, // 90% success rate for simulation
        details: {
          testKey,
          operation: 'store_retrieve_delete',
          latency: Math.floor(Math.random() * 100)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test Semantic Memory operations
   */
  async testSemanticMemoryOperations(serverState) {
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 150));
      
      return {
        success: Math.random() > 0.05, // 95% success rate
        details: {
          operation: 'semantic_search',
          vectorDimensions: 1536,
          indexSize: Math.floor(Math.random() * 10000),
          latency: Math.floor(Math.random() * 150)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test MCP Protocol operations
   */
  async testMCPProtocolOperations(serverState) {
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
      
      return {
        success: Math.random() > 0.08, // 92% success rate
        details: {
          operation: 'protocol_handshake',
          protocolVersion: '1.0.0',
          capabilities: ['memory', 'search', 'store'],
          latency: Math.floor(Math.random() * 200)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test Distributed Memory operations
   */
  async testDistributedMemoryOperations(serverState) {
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
      
      return {
        success: Math.random() > 0.12, // 88% success rate
        details: {
          operation: 'distributed_store',
          nodes: ['node1', 'node2', 'node3'],
          replicationFactor: 2,
          consistencyLevel: 'eventual',
          latency: Math.floor(Math.random() * 300)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test External MCP operations
   */
  async testExternalMCPOperations(serverState) {
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 250));
      
      return {
        success: Math.random() > 0.15, // 85% success rate
        details: {
          operation: 'external_connectivity',
          endpoint: serverState.endpoint,
          protocol: serverState.config.protocol || 'http',
          authType: serverState.config.auth?.type || 'none',
          latency: Math.floor(Math.random() * 250)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle server failure
   */
  handleServerFailure(serverId, serverState, error) {
    const alertId = `${serverId}_failure`;
    
    if (serverState.consecutiveFailures >= this.options.alertThreshold) {
      if (!this.alerts.has(alertId)) {
        const alert = {
          id: alertId,
          serverId,
          type: 'server_failure',
          severity: 'critical',
          message: `Server ${serverId} has failed ${serverState.consecutiveFailures} consecutive health checks`,
          error,
          timestamp: Date.now(),
          acknowledged: false
        };
        
        this.alerts.set(alertId, alert);
        this.emit('alert_triggered', alert);
        
        logger.error('Server failure alert triggered', {
          serverId,
          consecutiveFailures: serverState.consecutiveFailures,
          error
        });
      }
    }

    this.emit('server_failure', {
      serverId,
      consecutiveFailures: serverState.consecutiveFailures,
      error
    });
  }

  /**
   * Handle server recovery
   */
  handleServerRecovery(serverId, serverState) {
    const alertId = `${serverId}_failure`;
    
    if (this.alerts.has(alertId)) {
      this.alerts.delete(alertId);
      this.emit('alert_resolved', { alertId, serverId });
      
      logger.info('Server recovery - alert resolved', { serverId });
    }

    this.emit('server_recovery', { serverId });
  }

  /**
   * Collect server metrics
   */
  async collectServerMetrics(serverId, serverState, healthResult) {
    const timestamp = Date.now();
    
    // Collect all metrics
    for (const [metricName, collector] of Object.entries(this.metricsCollectors)) {
      try {
        const metricValue = await collector(serverState, healthResult);
        this.storeMetric(serverId, metricName, metricValue, timestamp);
      } catch (error) {
        logger.warn(`Failed to collect ${metricName} metric for ${serverId}`, {
          error: error.message
        });
      }
    }
  }

  /**
   * Collect response time metrics
   */
  async collectResponseTimeMetrics(serverState, healthResult) {
    const responseTimes = serverState.metrics.responseTime;
    if (responseTimes.length === 0) return 0;
    
    return {
      current: responseTimes[responseTimes.length - 1],
      average: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      min: Math.min(...responseTimes),
      max: Math.max(...responseTimes),
      p95: this.calculatePercentile(responseTimes, 95),
      p99: this.calculatePercentile(responseTimes, 99)
    };
  }

  /**
   * Collect error rate metrics
   */
  async collectErrorRateMetrics(serverState, healthResult) {
    // Calculate error rate based on recent health checks
    const errorRate = serverState.consecutiveFailures > 0 ? 
      (serverState.consecutiveFailures / Math.max(10, serverState.consecutiveFailures + 1)) : 0;
    
    return {
      current: errorRate,
      threshold: 0.05, // 5% error threshold
      status: errorRate > 0.05 ? 'warning' : 'ok'
    };
  }

  /**
   * Collect memory usage metrics
   */
  async collectMemoryUsageMetrics(serverState, healthResult) {
    // Simulate memory usage metrics
    const memoryUsage = {
      heap: {
        used: Math.floor(Math.random() * 1000) + 100,
        total: Math.floor(Math.random() * 500) + 1000,
        limit: 2048
      },
      external: Math.floor(Math.random() * 50) + 10,
      rss: Math.floor(Math.random() * 1500) + 500
    };
    
    return memoryUsage;
  }

  /**
   * Collect cache hit rate metrics
   */
  async collectCacheHitRateMetrics(serverState, healthResult) {
    // Simulate cache metrics
    return {
      hitRate: 0.85 + (Math.random() * 0.1), // 85-95% hit rate
      missRate: 0.05 + (Math.random() * 0.1), // 5-15% miss rate
      totalRequests: Math.floor(Math.random() * 10000) + 1000,
      cacheSize: Math.floor(Math.random() * 1000) + 100
    };
  }

  /**
   * Collect throughput metrics
   */
  async collectThroughputMetrics(serverState, healthResult) {
    // Simulate throughput metrics
    return {
      requestsPerSecond: Math.floor(Math.random() * 1000) + 100,
      bytesPerSecond: Math.floor(Math.random() * 100000) + 10000,
      connectionsActive: Math.floor(Math.random() * 100) + 10
    };
  }

  /**
   * Store metric data
   */
  storeMetric(serverId, metricName, value, timestamp) {
    if (!this.metrics.has(serverId)) {
      this.metrics.set(serverId, new Map());
    }
    
    const serverMetrics = this.metrics.get(serverId);
    if (!serverMetrics.has(metricName)) {
      serverMetrics.set(metricName, []);
    }
    
    const metricData = serverMetrics.get(metricName);
    metricData.push({ value, timestamp });
    
    // Keep only data within retention period
    const cutoff = timestamp - this.options.retentionPeriod;
    const filtered = metricData.filter(point => point.timestamp > cutoff);
    serverMetrics.set(metricName, filtered);
  }

  /**
   * Get server status
   */
  getServerStatus(serverId) {
    const server = this.servers.get(serverId);
    if (!server) {
      return null;
    }

    return {
      id: serverId,
      type: server.type,
      status: server.status,
      lastCheck: server.lastCheck,
      consecutiveFailures: server.consecutiveFailures,
      uptime: this.calculateUptime(server),
      metrics: server.metrics
    };
  }

  /**
   * Get all servers status
   */
  getAllServersStatus() {
    const status = {};
    for (const [serverId] of this.servers.entries()) {
      status[serverId] = this.getServerStatus(serverId);
    }
    return status;
  }

  /**
   * Get metrics for a server
   */
  getServerMetrics(serverId, metricName, timeRange = 3600000) { // 1 hour default
    const serverMetrics = this.metrics.get(serverId);
    if (!serverMetrics || !serverMetrics.has(metricName)) {
      return [];
    }
    
    const cutoff = Date.now() - timeRange;
    return serverMetrics.get(metricName)
      .filter(point => point.timestamp > cutoff)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return Array.from(this.alerts.values());
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId, acknowledgedBy) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = Date.now();
      
      this.emit('alert_acknowledged', { alertId, acknowledgedBy });
      logger.info('Alert acknowledged', { alertId, acknowledgedBy });
    }
  }

  /**
   * Initialize server metrics storage
   */
  initializeServerMetrics(serverId) {
    if (!this.metrics.has(serverId)) {
      this.metrics.set(serverId, new Map());
    }
  }

  /**
   * Reset all metrics data
   */
  resetMetrics() {
    const serversCount = this.servers.size;
    const metricsCount = this.metrics.size;
    
    // Clear all metrics data
    for (const [serverId, serverMetrics] of this.metrics.entries()) {
      serverMetrics.clear();
    }
    
    // Reset server states (keep basic info but reset metrics)
    for (const [serverId, server] of this.servers.entries()) {
      server.metrics = {
        responseTime: [],
        errorRate: [],
        memoryUsage: [],
        cacheHitRate: [],
        throughput: []
      };
      server.lastCheck = null;
      server.failureCount = 0;
      server.successCount = 0;
      server.downtime = 0;
      server.lastUptime = Date.now();
    }
    
    // Clear active alerts
    this.activeAlerts.clear();
    
    logger.info('All metrics reset', {
      serversAffected: serversCount,
      metricsCleared: metricsCount
    });
    
    this.emit('metricsReset', {
      timestamp: Date.now(),
      serversAffected: serversCount,
      metricsCleared: metricsCount
    });
  }

  /**
   * Start metrics cleanup process
   */
  startMetricsCleanup() {
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupOldMetrics();
    }, 60000); // Clean up every minute
  }

  /**
   * Clean up old metrics data
   */
  cleanupOldMetrics() {
    const cutoff = Date.now() - this.options.retentionPeriod;
    let cleanedCount = 0;
    
    for (const [serverId, serverMetrics] of this.metrics.entries()) {
      for (const [metricName, metricData] of serverMetrics.entries()) {
        const filtered = metricData.filter(point => point.timestamp > cutoff);
        const removedCount = metricData.length - filtered.length;
        
        if (removedCount > 0) {
          serverMetrics.set(metricName, filtered);
          cleanedCount += removedCount;
        }
      }
    }
    
    if (cleanedCount > 0) {
      logger.debug('Cleaned up old metrics', { removedDataPoints: cleanedCount });
    }
  }

  /**
   * Calculate uptime percentage
   */
  calculateUptime(serverState) {
    const totalTime = Date.now() - serverState.lastUptime;
    if (totalTime === 0) return 100;
    
    const downtime = serverState.downtime || 0;
    return Math.max(0, ((totalTime - downtime) / totalTime) * 100);
  }

  /**
   * Calculate percentile from array of numbers
   */
  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get overall system health
   */
  getSystemHealth() {
    const servers = Array.from(this.servers.values());
    const total = servers.length;
    
    if (total === 0) {
      return {
        status: 'unknown',
        healthy: 0,
        unhealthy: 0,
        total: 0,
        uptime: 0
      };
    }
    
    const healthy = servers.filter(s => s.status === 'healthy').length;
    const unhealthy = total - healthy;
    const uptime = servers.reduce((sum, s) => sum + this.calculateUptime(s), 0) / total;
    
    let status = 'healthy';
    if (unhealthy > 0) {
      status = unhealthy > total * 0.5 ? 'critical' : 'degraded';
    }
    
    return {
      status,
      healthy,
      unhealthy,
      total,
      uptime: Math.round(uptime * 100) / 100,
      alerts: this.alerts.size
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  getPrometheusMetrics() {
    if (!this.options.enablePrometheus) {
      return '';
    }
    
    let output = '';
    
    // Server status metrics
    output += '# HELP mcp_server_status Server status (1=healthy, 0=unhealthy)\n';
    output += '# TYPE mcp_server_status gauge\n';
    
    for (const [serverId, server] of this.servers.entries()) {
      const value = server.status === 'healthy' ? 1 : 0;
      output += `mcp_server_status{server_id="${serverId}",server_type="${server.type}"} ${value}\n`;
    }
    
    // Response time metrics
    output += '# HELP mcp_server_response_time_seconds Server response time in seconds\n';
    output += '# TYPE mcp_server_response_time_seconds histogram\n';
    
    for (const [serverId, server] of this.servers.entries()) {
      const responseTimes = server.metrics.responseTime;
      if (responseTimes.length > 0) {
        const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000;
        output += `mcp_server_response_time_seconds{server_id="${serverId}"} ${avg}\n`;
      }
    }
    
    return output;
  }

  /**
   * Get real-time metrics for all servers
   */
  getRealTimeMetrics() {
    const allMetrics = [];
    for (const [serverId, serverState] of this.servers.entries()) {
      allMetrics.push({
        serverId,
        status: serverState.status,
        metrics: serverState.metrics,
      });
    }
    return allMetrics;
  }

  /**
   * Check health of a git-memory server
   */
  async checkGitMemoryHealth(serverState) {
    try {
      // Check if Git repository is accessible and writable
      const testResult = await this.testGitMemoryOperations(serverState);
      return {
        healthy: testResult.success,
        details: testResult.details,
        error: testResult.error
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

module.exports = MonitoringService;