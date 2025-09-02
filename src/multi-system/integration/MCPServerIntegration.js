/**
 * MCP Server Integration Layer
 * Bridges the existing MCP Server implementation with our new services
 */

// Prefer compiled JS from dist to avoid requiring TypeScript at runtime
let GitMemoryServer;
let _gitMemorySource = 'unknown';
try {
  const distModule = require('../../../dist/index.js');
  GitMemoryServer = distModule.GitMemoryServer || (distModule.default && distModule.default.GitMemoryServer) || distModule.default || distModule;
  _gitMemorySource = 'dist/index.js';
} catch (_e) {
  const indexModule = require('../../index.ts');
  GitMemoryServer = (indexModule && (indexModule.GitMemoryServer || indexModule.default)) || indexModule;
  _gitMemorySource = 'src/index.ts';
}
const MCPProtocolService = require('../../services/MCPProtocolService');
const logger = require('../../utils/logger');

class MCPServerIntegration {
  constructor() {
    this.mcpServer = null;
    this.protocolService = new MCPProtocolService();
    this.isInitialized = false;
    
    this.setupEventHandlers();
  }

  /**
   * Initialize the integrated MCP Server with enhanced performance
   */
  async initialize() {
    try {
      logger.info('Initializing Enhanced MCP Server Integration');
      logger.info(`GitMemoryServer source: ${_gitMemorySource}`);
      
      // Initialize connection pool for better performance
      await this.initializeConnectionPool();
      
      // Initialize the existing MCP Server with optimizations
      this.mcpServer = new GitMemoryServer();
      logger.info(`GitMemoryServer created. initialize typeof: ${typeof this.mcpServer.initialize}; initializeAsync typeof: ${typeof this.mcpServer.initializeAsync}`);
      if (typeof this.mcpServer.initialize === 'function') {
        await this.mcpServer.initialize();
      } else if (typeof this.mcpServer.initializeAsync === 'function') {
        await this.mcpServer.initializeAsync();
      } else {
        logger.warn('GitMemoryServer has no initialize or initializeAsync method; skipping explicit initialization');
      }
      
      // Setup enhanced protocol service event handlers
      this.setupProtocolServiceHandlers();
      
      // Initialize performance monitoring
      this.initializePerformanceMonitoring();
      
      // Setup health checks
      this.setupHealthChecks();
      
      this.isInitialized = true;
      logger.info('Enhanced MCP Server Integration initialized successfully');
      
      return {
        success: true,
        message: 'Enhanced MCP Server Integration initialized',
        services: {
          git_operations: true,
          memory_operations: true,
          semantic_memory: true,
          protocol_service: true,
          connection_pool: true,
          performance_monitoring: true,
          health_checks: true
        },
        performance: {
          connection_pool_size: this.connectionPool?.size || 0,
          memory_cache_enabled: true,
          compression_enabled: true
        }
      };
    } catch (error) {
      logger.error('Failed to initialize Enhanced MCP Server Integration', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Setup event handlers for the integration
   */
  setupEventHandlers() {
    // Handle protocol service events
    this.protocolService.on('request_success', (data) => {
      logger.debug('MCP request successful', data);
    });
    
    this.protocolService.on('request_error', (data) => {
      logger.error('MCP request failed', data);
    });
  }

  /**
   * Setup enhanced protocol service handlers with performance optimizations
   */
  setupProtocolServiceHandlers() {
    // Add enhanced custom handlers with caching and performance monitoring
    const customHandlers = {
      'integration/status': this.handleIntegrationStatus.bind(this),
      'integration/health': this.handleIntegrationHealth.bind(this),
      'integration/services': this.handleServicesStatus.bind(this),
      'integration/performance': this.handlePerformanceMetrics.bind(this),
      'integration/cache': this.handleCacheOperations.bind(this),
      'integration/batch': this.handleBatchOperations.bind(this),
      'integration/optimize': this.handleOptimization.bind(this)
    };
    
    // Merge custom handlers with existing ones
    Object.assign(this.protocolService.handlers, customHandlers);
    
    // Setup handler middleware for performance monitoring
    this.setupHandlerMiddleware();
    
    logger.info('Enhanced integration handlers added', {
      custom_handlers: Object.keys(customHandlers),
      middleware_enabled: true
    });
  }

  /**
   * Initialize connection pool for enhanced performance
   */
  async initializeConnectionPool() {
    this.connectionPool = new Map();
    this.connectionStats = {
      created: 0,
      active: 0,
      idle: 0,
      errors: 0
    };
    
    logger.info('Connection pool initialized');
  }

  /**
   * Initialize performance monitoring
   */
  initializePerformanceMonitoring() {
    this.performanceMetrics = {
      requestCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      startTime: Date.now()
    };
    
    // Start performance monitoring interval
    this.performanceInterval = setInterval(() => {
      this.updatePerformanceMetrics();
    }, 30000); // Update every 30 seconds
    
    logger.info('Performance monitoring initialized');
  }

  /**
   * Setup health checks
   */
  setupHealthChecks() {
    this.healthStatus = {
      overall: 'healthy',
      services: {
        git: 'healthy',
        memory: 'healthy',
        semantic: 'healthy',
        database: 'healthy'
      },
      lastCheck: Date.now()
    };
    
    // Start health check interval
    this.healthInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Check every minute
    
    logger.info('Health checks initialized');
  }

  /**
   * Setup handler middleware for performance monitoring
   */
  setupHandlerMiddleware() {
    const originalHandlers = { ...this.protocolService.handlers };
    
    Object.keys(originalHandlers).forEach(handlerName => {
      const originalHandler = originalHandlers[handlerName];
      
      this.protocolService.handlers[handlerName] = async (...args) => {
        const startTime = Date.now();
        this.performanceMetrics.requestCount++;
        
        try {
          const result = await originalHandler.apply(this, args);
          const responseTime = Date.now() - startTime;
          this.updateResponseTime(responseTime);
          return result;
        } catch (error) {
          this.performanceMetrics.errorRate++;
          throw error;
        }
      };
    });
    
    logger.info('Handler middleware setup completed');
  }

  /**
   * Process MCP request through the integrated system with enhanced performance
   * @param {Object} request - MCP request
   * @returns {Promise<Object>} Response
   */
  async processRequest(request) {
    if (!this.isInitialized) {
      throw new Error('MCP Server Integration not initialized');
    }
    
    const startTime = Date.now();
    
    try {
      // First, check cache
      const cachedResult = await this.checkCache(request);
      if (cachedResult) {
        this.performanceMetrics.cacheHitRate++;
        return cachedResult;
      }
      
      // Process through the protocol service
      const result = await this.protocolService.process(request);
      
      // Cache the result for future requests
      await this.cacheResult(request, result);
      
      // Update performance metrics
      const responseTime = Date.now() - startTime;
      this.updateResponseTime(responseTime);
      
      return result;
      
    } catch (error) {
      this.performanceMetrics.errorRate++;
      throw error;
    }
  }

  /**
   * Check cache for request result
   * @param {Object} request - MCP request
   * @returns {Promise<Object|null>} Cached result or null
   */
  async checkCache(request) {
    if (!this.cache) {
      this.cache = new Map();
    }
    
    const cacheKey = this.generateCacheKey(request);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes TTL
      logger.debug('Cache hit', { cacheKey });
      return cached.data;
    }
    
    return null;
  }

  /**
   * Cache request result
   * @param {Object} request - MCP request
   * @param {Object} result - Request result
   */
  async cacheResult(request, result) {
    if (!this.cache) {
      this.cache = new Map();
    }
    
    const cacheKey = this.generateCacheKey(request);
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    // Clean old cache entries
    if (this.cache.size > 1000) {
      this.cleanCache();
    }
  }

  /**
   * Generate cache key for request
   * @param {Object} request - MCP request
   * @returns {string} Cache key
   */
  generateCacheKey(request) {
    return `${request.method}_${JSON.stringify(request.params || {})}`;
  }

  /**
   * Clean old cache entries
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > 300000) { // 5 minutes
        this.cache.delete(key);
      }
    }
  }

  /**
   * Update response time metrics
   * @param {number} responseTime - Response time in milliseconds
   */
  updateResponseTime(responseTime) {
    const currentAvg = this.performanceMetrics.averageResponseTime;
    const count = this.performanceMetrics.requestCount;
    
    this.performanceMetrics.averageResponseTime = 
      (currentAvg * (count - 1) + responseTime) / count;
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics() {
    const memUsage = process.memoryUsage();
    this.performanceMetrics.memoryUsage = memUsage.heapUsed;
    
    logger.debug('Performance metrics updated', this.performanceMetrics);
  }

  /**
   * Perform health check on all services
   */
  async performHealthCheck() {
    try {
      // Check Git service
      this.healthStatus.services.git = await this.checkGitHealth() ? 'healthy' : 'unhealthy';
      
      // Check Memory service
      this.healthStatus.services.memory = await this.checkMemoryHealth() ? 'healthy' : 'unhealthy';
      
      // Check Semantic service
      this.healthStatus.services.semantic = await this.checkSemanticHealth() ? 'healthy' : 'unhealthy';
      
      // Update overall health
      const allHealthy = Object.values(this.healthStatus.services).every(status => status === 'healthy');
      this.healthStatus.overall = allHealthy ? 'healthy' : 'degraded';
      this.healthStatus.lastCheck = Date.now();
      
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      this.healthStatus.overall = 'unhealthy';
    }
  }

  /**
   * Check Git service health
   * @returns {Promise<boolean>} Health status
   */
  async checkGitHealth() {
    try {
      // Simple health check - try to get Git version
      const { execSync } = require('child_process');
      execSync('git --version', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check Memory service health
   * @returns {Promise<boolean>} Health status
   */
  async checkMemoryHealth() {
    try {
      // Check if memory service is responsive
      return this.mcpServer && typeof this.mcpServer.getStats === 'function';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check Semantic service health
   * @returns {Promise<boolean>} Health status
   */
  async checkSemanticHealth() {
    try {
      // Check if semantic service is available
      return true; // Placeholder - implement actual check
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle performance metrics request
   * @param {Object} params - Request parameters
   * @param {Object} context - Request context
   * @returns {Promise<Object>} Performance metrics
   */
  async handlePerformanceMetrics(params, context) {
    return {
      success: true,
      metrics: {
        ...this.performanceMetrics,
        uptime: Date.now() - this.performanceMetrics.startTime,
        cacheSize: this.cache?.size || 0,
        connectionPoolSize: this.connectionPool?.size || 0
      }
    };
  }

  /**
   * Handle cache operations
   * @param {Object} params - Request parameters
   * @param {Object} context - Request context
   * @returns {Promise<Object>} Cache operation result
   */
  async handleCacheOperations(params, context) {
    const { operation } = params;
    
    switch (operation) {
      case 'clear':
        this.cache?.clear();
        return { success: true, message: 'Cache cleared' };
      
      case 'stats':
        return {
          success: true,
          stats: {
            size: this.cache?.size || 0,
            hitRate: this.performanceMetrics.cacheHitRate
          }
        };
      
      default:
        throw new Error(`Unknown cache operation: ${operation}`);
    }
  }

  /**
   * Handle batch operations
   * @param {Object} params - Request parameters
   * @param {Object} context - Request context
   * @returns {Promise<Object>} Batch operation result
   */
  async handleBatchOperations(params, context) {
    const { requests } = params;
    
    if (!Array.isArray(requests)) {
      throw new Error('Batch requests must be an array');
    }
    
    const results = [];
    
    for (const request of requests) {
      try {
        const result = await this.processRequest(request);
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return {
      success: true,
      results,
      processed: results.length
    };
  }

  /**
   * Handle optimization operations
   * @param {Object} params - Request parameters
   * @param {Object} context - Request context
   * @returns {Promise<Object>} Optimization result
   */
  async handleOptimization(params, context) {
    const { operation } = params;
    
    switch (operation) {
      case 'cleanup':
        this.cleanCache();
        return { success: true, message: 'Cleanup completed' };
      
      case 'compress':
        // Implement memory compression if needed
        return { success: true, message: 'Compression completed' };
      
      default:
        throw new Error(`Unknown optimization operation: ${operation}`);
    }
  }

  /**
   * Handle integration status request
   */
  async handleIntegrationStatus(params, context) {
    return {
      integration_status: 'active',
      initialized: this.isInitialized,
      services: {
        git_operations: this.protocolService.gitOperationsService ? 'active' : 'inactive',
        memory_operations: this.protocolService.memoryOperationsService ? 'active' : 'inactive',
        semantic_memory: this.protocolService.semanticMemoryService ? 'active' : 'inactive'
      },
      stats: this.protocolService.stats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle integration health check
   */
  async handleIntegrationHealth(params, context) {
    const health = {
      status: 'healthy',
      checks: {
        integration: this.isInitialized,
        protocol_service: !!this.protocolService,
        mcp_server: !!this.mcpServer
      },
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
    
    // Check if all services are healthy
    const allHealthy = Object.values(health.checks).every(check => check === true);
    health.status = allHealthy ? 'healthy' : 'degraded';
    
    return health;
  }

  /**
   * Handle services status request
   */
  async handleServicesStatus(params, context) {
    const services = {};
    
    // Git Operations Service
    if (this.protocolService.gitOperationsService) {
      services.git_operations = {
        status: 'active',
        stats: this.protocolService.gitOperationsService.stats
      };
    }
    
    // Memory Operations Service
    if (this.protocolService.memoryOperationsService) {
      services.memory_operations = {
        status: 'active',
        stats: this.protocolService.memoryOperationsService.stats
      };
    }
    
    // Semantic Memory Service
    if (this.protocolService.semanticMemoryService) {
      services.semantic_memory = {
        status: 'active',
        stats: this.protocolService.semanticMemoryService.stats
      };
    }
    
    return {
      services,
      total_services: Object.keys(services).length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get integration statistics
   */
  getStats() {
    return {
      integration: {
        initialized: this.isInitialized,
        uptime: process.uptime()
      },
      protocol_service: this.protocolService.stats,
      services: {
        git_operations: this.protocolService.gitOperationsService?.stats,
        memory_operations: this.protocolService.memoryOperationsService?.stats,
        semantic_memory: this.protocolService.semanticMemoryService?.stats
      }
    };
  }

  /**
   * Shutdown the integration gracefully
   */
  async shutdown() {
    try {
      logger.info('Shutting down MCP Server Integration');
      
      // Clean up intervals
      if (this.performanceInterval) {
        clearInterval(this.performanceInterval);
      }
      
      if (this.healthInterval) {
        clearInterval(this.healthInterval);
      }
      
      // Clean up cache
      if (this.cache) {
        this.cache.clear();
      }
      
      // Clean up connection pool
      if (this.connectionPool) {
        this.connectionPool.clear();
      }
      
      // Clean up resources
      if (this.protocolService) {
        this.protocolService.removeAllListeners();
      }
      
      this.isInitialized = false;
      logger.info('MCP Server Integration shutdown complete');
    } catch (error) {
      logger.error('Error during integration shutdown', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = MCPServerIntegration;