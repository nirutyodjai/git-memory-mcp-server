/**
 * MCP Multi-System Manager
 * จัดการการเชื่อมต่อและประสานงานระหว่าง MCP หลายระบบ
 */

const EventEmitter = require('events');
const logger = require('../../utils/logger');
const MCPProtocolService = require('../../services/MCPProtocolService');
const GitMemoryService = require('../../services/GitMemoryService');
const SemanticMemoryService = require('../../services/SemanticMemoryService');
const MonitoringService = require('../../services/MonitoringService');

class MCPMultiSystemManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxConcurrentSystems: 10,
      healthCheckInterval: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000,
      loadBalancing: true,
      ...config
    };
    
    // System registry
    this.systems = new Map();
    this.systemHealth = new Map();
    this.systemMetrics = new Map();
    
    // Load balancing
    this.roundRobinIndex = 0;
    this.systemLoad = new Map();
    
    // Connection pooling
    this.connectionPools = new Map();
    
    // Event handlers
    this.setupEventHandlers();
    
    // Health check interval
    this.healthCheckTimer = null;
    
    // Initialize MonitoringService
    this.monitoringService = new MonitoringService({
      checkInterval: this.config.healthCheckInterval,
      alertThresholds: {
        responseTime: 5000,
        errorRate: 0.1,
        downtime: 30000
      },
      enablePrometheus: true,
      retentionPeriod: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    logger.info('MCP Multi-System Manager initialized', {
      maxSystems: this.config.maxConcurrentSystems,
      loadBalancing: this.config.loadBalancing,
      monitoring: true
    });
  }

  /**
   * Register a new MCP system
   * @param {string} systemId - Unique system identifier
   * @param {Object} systemConfig - System configuration
   * @returns {Promise<boolean>} Registration success
   */
  async registerSystem(systemId, systemConfig) {
    try {
      if (this.systems.has(systemId)) {
        throw new Error(`System ${systemId} already registered`);
      }
      
      if (this.systems.size >= this.config.maxConcurrentSystems) {
        throw new Error('Maximum number of systems reached');
      }
      
      // Validate system configuration
      this.validateSystemConfig(systemConfig);
      
      // Create system instance
      const system = await this.createSystemInstance(systemId, systemConfig);
      
      // Initialize system
      await system.initialize();
      
      // Register system
      this.systems.set(systemId, system);
      this.systemHealth.set(systemId, { status: 'healthy', lastCheck: Date.now() });
      this.systemMetrics.set(systemId, {
        requests: 0,
        errors: 0,
        averageResponseTime: 0,
        lastActivity: Date.now()
      });
      this.systemLoad.set(systemId, 0);
      
      // Create connection pool
      this.connectionPools.set(systemId, new Map());
      
      // Register system with MonitoringService
      await this.monitoringService.registerServer(systemId, {
        name: systemId,
        type: systemConfig.type,
        endpoint: systemConfig.endpoint || 'local',
        healthCheckUrl: systemConfig.healthCheckUrl,
        tags: systemConfig.tags || [],
        metadata: {
          ...systemConfig,
          registeredAt: new Date().toISOString()
        }
      });
      
      logger.info('MCP system registered successfully', {
        systemId,
        type: systemConfig.type,
        totalSystems: this.systems.size,
        monitoring: true
      });
      
      this.emit('systemRegistered', { systemId, system });
      
      return true;
      
    } catch (error) {
      logger.error('Failed to register MCP system', {
        systemId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Unregister an MCP system
   * @param {string} systemId - System identifier
   * @returns {Promise<boolean>} Unregistration success
   */
  async unregisterSystem(systemId) {
    try {
      const system = this.systems.get(systemId);
      if (!system) {
        throw new Error(`System ${systemId} not found`);
      }
      
      // Shutdown system
      await system.shutdown();
      
      // Clean up
      this.systems.delete(systemId);
      this.systemHealth.delete(systemId);
      this.systemMetrics.delete(systemId);
      this.systemLoad.delete(systemId);
      
      // Clean up connection pool
      const pool = this.connectionPools.get(systemId);
      if (pool) {
        pool.clear();
        this.connectionPools.delete(systemId);
      }
      
      // Unregister from MonitoringService
      try {
        await this.monitoringService.unregisterServer(systemId);
      } catch (monitoringError) {
        logger.warn('Failed to unregister from monitoring service', {
          systemId,
          error: monitoringError.message
        });
      }
      
      logger.info('MCP system unregistered successfully', {
        systemId,
        remainingSystems: this.systems.size,
        monitoring: true
      });
      
      this.emit('systemUnregistered', { systemId });
      
      return true;
      
    } catch (error) {
      logger.error('Failed to unregister MCP system', {
        systemId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Route request to appropriate system(s)
   * @param {Object} request - MCP request
   * @param {Object} options - Routing options
   * @returns {Promise<Object>} Response
   */
  async routeRequest(request, options = {}) {
    try {
      const {
        targetSystem,
        broadcast = false,
        loadBalance = this.config.loadBalancing,
        timeout = 30000
      } = options;
      
      if (broadcast) {
        return await this.broadcastRequest(request, timeout);
      }
      
      if (targetSystem) {
        return await this.routeToSpecificSystem(targetSystem, request, timeout);
      }
      
      if (loadBalance) {
        return await this.routeWithLoadBalancing(request, timeout);
      }
      
      // Default: route to first available system
      const systemId = this.getFirstHealthySystem();
      return await this.routeToSpecificSystem(systemId, request, timeout);
      
    } catch (error) {
      logger.error('Request routing failed', {
        request: request.method,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Broadcast request to all systems
   * @param {Object} request - MCP request
   * @param {number} timeout - Request timeout
   * @returns {Promise<Object>} Aggregated responses
   */
  async broadcastRequest(request, timeout) {
    const promises = [];
    const results = {};
    
    for (const [systemId, system] of this.systems) {
      if (this.isSystemHealthy(systemId)) {
        promises.push(
          this.executeWithTimeout(
            system.processRequest(request),
            timeout
          ).then(result => ({ systemId, result }))
          .catch(error => ({ systemId, error: error.message }))
        );
      }
    }
    
    const responses = await Promise.allSettled(promises);
    
    for (const response of responses) {
      if (response.status === 'fulfilled') {
        const { systemId, result, error } = response.value;
        results[systemId] = error ? { error } : { result };
      }
    }
    
    return {
      success: true,
      broadcast: true,
      results,
      timestamp: Date.now()
    };
  }

  /**
   * Route request to specific system
   * @param {string} systemId - Target system ID
   * @param {Object} request - MCP request
   * @param {number} timeout - Request timeout
   * @returns {Promise<Object>} Response
   */
  async routeToSpecificSystem(systemId, request, timeout) {
    const system = this.systems.get(systemId);
    if (!system) {
      throw new Error(`System ${systemId} not found`);
    }
    
    if (!this.isSystemHealthy(systemId)) {
      throw new Error(`System ${systemId} is not healthy`);
    }
    
    const startTime = Date.now();
    
    try {
      // Update load
      this.incrementSystemLoad(systemId);
      
      // Execute request
      const result = await this.executeWithTimeout(
        system.processRequest(request),
        timeout
      );
      
      // Update metrics
      this.updateSystemMetrics(systemId, Date.now() - startTime, false);
      
      return result;
      
    } catch (error) {
      // Update error metrics
      this.updateSystemMetrics(systemId, Date.now() - startTime, true);
      throw error;
      
    } finally {
      // Decrement load
      this.decrementSystemLoad(systemId);
    }
  }

  /**
   * Route request with load balancing
   * @param {Object} request - MCP request
   * @param {number} timeout - Request timeout
   * @returns {Promise<Object>} Response
   */
  async routeWithLoadBalancing(request, timeout) {
    const systemId = this.selectSystemForLoadBalancing();
    if (!systemId) {
      throw new Error('No healthy systems available');
    }
    
    return await this.routeToSpecificSystem(systemId, request, timeout);
  }

  /**
   * Select system for load balancing
   * @returns {string|null} Selected system ID
   */
  selectSystemForLoadBalancing() {
    const healthySystems = Array.from(this.systems.keys())
      .filter(systemId => this.isSystemHealthy(systemId));
    
    if (healthySystems.length === 0) {
      return null;
    }
    
    // Round-robin with load consideration
    let selectedSystem = null;
    let minLoad = Infinity;
    
    for (const systemId of healthySystems) {
      const load = this.systemLoad.get(systemId) || 0;
      if (load < minLoad) {
        minLoad = load;
        selectedSystem = systemId;
      }
    }
    
    return selectedSystem;
  }

  /**
   * Get system status and metrics
   * @returns {Object} System status information
   */
  getSystemStatus() {
    const status = {
      totalSystems: this.systems.size,
      healthySystems: 0,
      unhealthySystems: 0,
      systems: {},
      aggregateMetrics: {
        totalRequests: 0,
        totalErrors: 0,
        averageResponseTime: 0
      }
    };
    
    let totalRequests = 0;
    let totalErrors = 0;
    let totalResponseTime = 0;
    let systemCount = 0;
    
    for (const [systemId, system] of this.systems) {
      const health = this.systemHealth.get(systemId);
      const metrics = this.systemMetrics.get(systemId);
      const load = this.systemLoad.get(systemId);
      
      const isHealthy = this.isSystemHealthy(systemId);
      if (isHealthy) {
        status.healthySystems++;
      } else {
        status.unhealthySystems++;
      }
      
      status.systems[systemId] = {
        health: health?.status || 'unknown',
        lastCheck: health?.lastCheck,
        metrics: metrics || {},
        currentLoad: load || 0,
        type: system.type || 'unknown'
      };
      
      if (metrics) {
        totalRequests += metrics.requests;
        totalErrors += metrics.errors;
        totalResponseTime += metrics.averageResponseTime;
        systemCount++;
      }
    }
    
    status.aggregateMetrics.totalRequests = totalRequests;
    status.aggregateMetrics.totalErrors = totalErrors;
    status.aggregateMetrics.averageResponseTime = systemCount > 0 
      ? totalResponseTime / systemCount 
      : 0;
    
    return status;
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    if (this.healthCheckTimer) {
      return;
    }
    
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
    
    logger.info('Health monitoring started', {
      interval: this.config.healthCheckInterval
    });
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      logger.info('Health monitoring stopped');
    }
  }

  /**
   * Perform health checks on all systems
   */
  async performHealthChecks() {
    const promises = [];
    
    for (const [systemId, system] of this.systems) {
      promises.push(
        this.checkSystemHealth(systemId, system)
          .catch(error => {
            logger.error('Health check failed', {
              systemId,
              error: error.message
            });
          })
      );
    }
    
    await Promise.allSettled(promises);
  }

  /**
   * Check individual system health
   * @param {string} systemId - System ID
   * @param {Object} system - System instance
   */
  async checkSystemHealth(systemId, system) {
    try {
      const startTime = Date.now();
      
      // Perform health check
      const healthResult = await this.executeWithTimeout(
        system.healthCheck ? system.healthCheck() : Promise.resolve(true),
        5000
      );
      
      const responseTime = Date.now() - startTime;
      
      this.systemHealth.set(systemId, {
        status: healthResult ? 'healthy' : 'unhealthy',
        lastCheck: Date.now(),
        responseTime
      });
      
    } catch (error) {
      this.systemHealth.set(systemId, {
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: error.message
      });
    }
  }

  // Helper methods
  
  validateSystemConfig(config) {
    if (!config.type) {
      throw new Error('System type is required');
    }
    
    if (!config.endpoint && !config.instance) {
      throw new Error('System endpoint or instance is required');
    }
  }

  async createSystemInstance(systemId, config) {
    try {
      const { type } = config;
      
      switch (type) {
        case 'git-memory':
          const GitMemoryService = require('./GitMemoryService');
          return new GitMemoryService(config);
          
        case 'semantic-memory':
          const SemanticMemoryService = require('./SemanticMemoryService');
          return new SemanticMemoryService(config);
          
        case 'mcp-protocol':
          const MCPProtocolService = require('./MCPProtocolService');
          return new MCPProtocolService(config);
          
        case 'distributed-memory':
          const DistributedMemoryService = require('./DistributedMemoryService');
          return new DistributedMemoryService(config);
          
        case 'external-mcp':
          const ExternalMCPService = require('./ExternalMCPService');
          return new ExternalMCPService(config);
          
        default:
          throw new Error(`Unknown system type: ${type}`);
      }
      
    } catch (error) {
      logger.error(`Error creating system instance:`, error);
      throw error;
    }
  }

  isSystemHealthy(systemId) {
    const health = this.systemHealth.get(systemId);
    return health && health.status === 'healthy';
  }

  getFirstHealthySystem() {
    for (const systemId of this.systems.keys()) {
      if (this.isSystemHealthy(systemId)) {
        return systemId;
      }
    }
    throw new Error('No healthy systems available');
  }

  incrementSystemLoad(systemId) {
    const currentLoad = this.systemLoad.get(systemId) || 0;
    this.systemLoad.set(systemId, currentLoad + 1);
  }

  decrementSystemLoad(systemId) {
    const currentLoad = this.systemLoad.get(systemId) || 0;
    this.systemLoad.set(systemId, Math.max(0, currentLoad - 1));
  }

  updateSystemMetrics(systemId, responseTime, isError) {
    const metrics = this.systemMetrics.get(systemId) || {
      requests: 0,
      errors: 0,
      averageResponseTime: 0,
      lastActivity: Date.now()
    };
    
    metrics.requests++;
    if (isError) {
      metrics.errors++;
    }
    
    // Update average response time
    metrics.averageResponseTime = 
      (metrics.averageResponseTime * (metrics.requests - 1) + responseTime) / metrics.requests;
    
    metrics.lastActivity = Date.now();
    
    this.systemMetrics.set(systemId, metrics);
  }

  async executeWithTimeout(promise, timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ]);
  }

  setupEventHandlers() {
    this.on('systemRegistered', (data) => {
      logger.info('System registered event', data);
    });
    
    this.on('systemUnregistered', (data) => {
      logger.info('System unregistered event', data);
    });
    
    this.on('systemHealthChanged', (data) => {
      logger.info('System health changed', data);
    });
  }

  /**
   * Shutdown all systems and cleanup
   */
  async shutdown() {
    try {
      logger.info('Shutting down MCP Multi-System Manager');
      
      // Stop health monitoring
      this.stopHealthMonitoring();
      
      // Stop MonitoringService
      try {
        await this.monitoringService.stop();
      } catch (monitoringError) {
        logger.warn('Failed to stop monitoring service', {
          error: monitoringError.message
        });
      }
      
      // Shutdown all systems
      const shutdownPromises = [];
      for (const [systemId, system] of this.systems) {
        shutdownPromises.push(
          system.shutdown().catch(error => {
            logger.error('System shutdown failed', {
              systemId,
              error: error.message
            });
          })
        );
      }
      
      await Promise.allSettled(shutdownPromises);
      
      // Clear all data
      this.systems.clear();
      this.systemHealth.clear();
      this.systemMetrics.clear();
      this.systemLoad.clear();
      this.connectionPools.clear();
      
      logger.info('MCP Multi-System Manager shutdown complete');
      
    } catch (error) {
      logger.error('Error during multi-system manager shutdown', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = MCPMultiSystemManager;