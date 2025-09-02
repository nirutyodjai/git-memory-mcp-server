/**
 * Multi-System Middleware
 * จัดการ middleware สำหรับ MCP Multi-System requests
 */

const logger = require('../../utils/logger');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const helmet = require('helmet');

class MultiSystemMiddleware {
  constructor(config = {}) {
    this.config = {
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // limit each IP to 1000 requests per windowMs
        message: 'Too many requests from this IP',
        standardHeaders: true,
        legacyHeaders: false,
        ...config.rateLimit
      },
      compression: {
        level: 6,
        threshold: 1024,
        filter: (req, res) => {
          if (req.headers['x-no-compression']) {
            return false;
          }
          return compression.filter(req, res);
        },
        ...config.compression
      },
      security: {
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        ...config.security
      },
      ...config
    };
    
    this.requestMetrics = {
      totalRequests: 0,
      systemRequests: new Map(),
      errorRequests: 0,
      averageResponseTime: 0
    };
    
    this.systemRoutes = new Map();
    this.loadBalancingState = new Map();
  }

  /**
   * Initialize middleware stack
   * @returns {Array} Array of middleware functions
   */
  initializeMiddleware() {
    const middlewareStack = [];
    
    // Security middleware
    middlewareStack.push(helmet(this.config.security));
    
    // Compression middleware
    middlewareStack.push(compression(this.config.compression));
    
    // Rate limiting middleware
    middlewareStack.push(this.createRateLimiter());
    
    // Request logging middleware
    middlewareStack.push(this.requestLogger());
    
    // System identification middleware
    middlewareStack.push(this.systemIdentifier());
    
    // Load balancing middleware
    middlewareStack.push(this.loadBalancer());
    
    // Request validation middleware
    middlewareStack.push(this.requestValidator());
    
    // Performance monitoring middleware
    middlewareStack.push(this.performanceMonitor());
    
    return middlewareStack;
  }

  /**
   * Create rate limiter middleware
   * @returns {Function} Rate limiter middleware
   */
  createRateLimiter() {
    return rateLimit({
      ...this.config.rateLimit,
      keyGenerator: (req) => {
        // Use system ID + IP for more granular rate limiting
        const systemId = req.headers['x-mcp-system-id'] || 'default';
        return `${req.ip}-${systemId}`;
      },
      handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          systemId: req.headers['x-mcp-system-id'],
          userAgent: req.get('User-Agent')
        });
        
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.round(this.config.rateLimit.windowMs / 1000)
        });
      }
    });
  }

  /**
   * Request logging middleware
   * @returns {Function} Logging middleware
   */
  requestLogger() {
    return (req, res, next) => {
      const startTime = Date.now();
      const requestId = req.headers['x-request-id'] || this.generateRequestId();
      
      // Add request ID to headers
      req.requestId = requestId;
      res.setHeader('X-Request-ID', requestId);
      
      // Log request start
      logger.info('Multi-system request started', {
        requestId,
        method: req.method,
        url: req.url,
        systemId: req.headers['x-mcp-system-id'],
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
      
      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(chunk, encoding) {
        const responseTime = Date.now() - startTime;
        
        logger.info('Multi-system request completed', {
          requestId,
          statusCode: res.statusCode,
          responseTime,
          contentLength: res.get('Content-Length')
        });
        
        originalEnd.call(this, chunk, encoding);
      };
      
      next();
    };
  }

  /**
   * System identification middleware
   * @returns {Function} System identifier middleware
   */
  systemIdentifier() {
    return (req, res, next) => {
      try {
        // Extract system information from request
        const systemId = req.headers['x-mcp-system-id'] || this.detectSystemFromRequest(req);
        const systemType = req.headers['x-mcp-system-type'];
        const systemVersion = req.headers['x-mcp-system-version'];
        
        // Add system information to request
        req.mcpSystem = {
          id: systemId,
          type: systemType,
          version: systemVersion,
          detectedAt: Date.now()
        };
        
        // Update system metrics
        this.updateSystemMetrics(systemId);
        
        logger.debug('System identified', {
          requestId: req.requestId,
          systemId,
          systemType,
          systemVersion
        });
        
        next();
        
      } catch (error) {
        logger.error('System identification failed', {
          requestId: req.requestId,
          error: error.message
        });
        
        // Continue with default system
        req.mcpSystem = {
          id: 'default',
          type: 'unknown',
          version: '1.0.0',
          detectedAt: Date.now()
        };
        
        next();
      }
    };
  }

  /**
   * Load balancing middleware
   * @returns {Function} Load balancer middleware
   */
  loadBalancer() {
    return (req, res, next) => {
      try {
        const systemId = req.mcpSystem?.id || 'default';
        
        // Get or create load balancing state for system
        if (!this.loadBalancingState.has(systemId)) {
          this.loadBalancingState.set(systemId, {
            currentIndex: 0,
            requestCount: 0,
            lastUsed: Date.now()
          });
        }
        
        const state = this.loadBalancingState.get(systemId);
        
        // Update load balancing information
        state.requestCount++;
        state.lastUsed = Date.now();
        
        // Add load balancing info to request
        req.loadBalancing = {
          systemId,
          requestCount: state.requestCount,
          currentIndex: state.currentIndex
        };
        
        logger.debug('Load balancing applied', {
          requestId: req.requestId,
          systemId,
          requestCount: state.requestCount
        });
        
        next();
        
      } catch (error) {
        logger.error('Load balancing failed', {
          requestId: req.requestId,
          error: error.message
        });
        
        next();
      }
    };
  }

  /**
   * Request validation middleware
   * @returns {Function} Validation middleware
   */
  requestValidator() {
    return (req, res, next) => {
      try {
        // Validate MCP request structure
        if (req.method === 'POST' && req.body) {
          const validation = this.validateMCPRequest(req.body);
          
          if (!validation.valid) {
            logger.warn('Invalid MCP request', {
              requestId: req.requestId,
              errors: validation.errors
            });
            
            return res.status(400).json({
              error: 'Invalid Request',
              message: 'MCP request validation failed',
              details: validation.errors
            });
          }
        }
        
        // Validate system compatibility
        const compatibility = this.checkSystemCompatibility(req.mcpSystem);
        if (!compatibility.compatible) {
          logger.warn('System compatibility check failed', {
            requestId: req.requestId,
            systemId: req.mcpSystem?.id,
            reason: compatibility.reason
          });
          
          return res.status(400).json({
            error: 'System Incompatible',
            message: compatibility.reason
          });
        }
        
        next();
        
      } catch (error) {
        logger.error('Request validation failed', {
          requestId: req.requestId,
          error: error.message
        });
        
        res.status(500).json({
          error: 'Validation Error',
          message: 'Request validation failed'
        });
      }
    };
  }

  /**
   * Performance monitoring middleware
   * @returns {Function} Performance monitor middleware
   */
  performanceMonitor() {
    return (req, res, next) => {
      const startTime = process.hrtime.bigint();
      const startMemory = process.memoryUsage();
      
      // Override res.end to capture performance metrics
      const originalEnd = res.end;
      res.end = (chunk, encoding) => {
        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();
        
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
        
        // Update metrics
        this.updatePerformanceMetrics({
          requestId: req.requestId,
          systemId: req.mcpSystem?.id,
          responseTime,
          memoryDelta,
          statusCode: res.statusCode
        });
        
        // Add performance headers
        res.setHeader('X-Response-Time', `${responseTime.toFixed(2)}ms`);
        res.setHeader('X-Memory-Delta', `${Math.round(memoryDelta / 1024)}KB`);
        
        originalEnd.call(this, chunk, encoding);
      };
      
      next();
    };
  }

  /**
   * Error handling middleware
   * @returns {Function} Error handler middleware
   */
  errorHandler() {
    return (error, req, res, next) => {
      logger.error('Multi-system middleware error', {
        requestId: req.requestId,
        systemId: req.mcpSystem?.id,
        error: error.message,
        stack: error.stack
      });
      
      this.requestMetrics.errorRequests++;
      
      // Determine error type and response
      let statusCode = 500;
      let errorType = 'Internal Server Error';
      
      if (error.name === 'ValidationError') {
        statusCode = 400;
        errorType = 'Validation Error';
      } else if (error.name === 'AuthenticationError') {
        statusCode = 401;
        errorType = 'Authentication Error';
      } else if (error.name === 'AuthorizationError') {
        statusCode = 403;
        errorType = 'Authorization Error';
      } else if (error.name === 'NotFoundError') {
        statusCode = 404;
        errorType = 'Not Found';
      }
      
      res.status(statusCode).json({
        error: errorType,
        message: error.message,
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    };
  }

  /**
   * Detect system from request
   * @param {Object} req - Express request object
   * @returns {string} System ID
   */
  detectSystemFromRequest(req) {
    // Try to detect system from URL path
    const pathSegments = req.path.split('/');
    if (pathSegments.length > 2 && pathSegments[1] === 'mcp') {
      return pathSegments[2];
    }
    
    // Try to detect from User-Agent
    const userAgent = req.get('User-Agent') || '';
    if (userAgent.includes('git-memory')) {
      return 'git-memory';
    } else if (userAgent.includes('semantic-memory')) {
      return 'semantic-memory';
    }
    
    return 'default';
  }

  /**
   * Validate MCP request
   * @param {Object} body - Request body
   * @returns {Object} Validation result
   */
  validateMCPRequest(body) {
    const errors = [];
    
    if (!body.jsonrpc) {
      errors.push('Missing jsonrpc field');
    } else if (body.jsonrpc !== '2.0') {
      errors.push('Invalid jsonrpc version');
    }
    
    if (!body.method) {
      errors.push('Missing method field');
    }
    
    if (body.id === undefined) {
      errors.push('Missing id field');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check system compatibility
   * @param {Object} system - System information
   * @returns {Object} Compatibility result
   */
  checkSystemCompatibility(system) {
    if (!system || !system.id) {
      return {
        compatible: false,
        reason: 'System identification required'
      };
    }
    
    // Check if system is registered
    if (!this.systemRoutes.has(system.id) && system.id !== 'default') {
      return {
        compatible: false,
        reason: `System '${system.id}' is not registered`
      };
    }
    
    return {
      compatible: true
    };
  }

  /**
   * Update system metrics
   * @param {string} systemId - System ID
   */
  updateSystemMetrics(systemId) {
    this.requestMetrics.totalRequests++;
    
    if (!this.requestMetrics.systemRequests.has(systemId)) {
      this.requestMetrics.systemRequests.set(systemId, 0);
    }
    
    this.requestMetrics.systemRequests.set(
      systemId,
      this.requestMetrics.systemRequests.get(systemId) + 1
    );
  }

  /**
   * Update performance metrics
   * @param {Object} metrics - Performance metrics
   */
  updatePerformanceMetrics(metrics) {
    const currentAvg = this.requestMetrics.averageResponseTime;
    const count = this.requestMetrics.totalRequests;
    
    this.requestMetrics.averageResponseTime = 
      (currentAvg * (count - 1) + metrics.responseTime) / count;
    
    logger.debug('Performance metrics updated', {
      requestId: metrics.requestId,
      systemId: metrics.systemId,
      responseTime: metrics.responseTime,
      memoryDelta: metrics.memoryDelta,
      averageResponseTime: this.requestMetrics.averageResponseTime
    });
  }

  /**
   * Register system route
   * @param {string} systemId - System ID
   * @param {Object} routeConfig - Route configuration
   */
  registerSystemRoute(systemId, routeConfig) {
    this.systemRoutes.set(systemId, {
      ...routeConfig,
      registeredAt: Date.now()
    });
    
    logger.info('System route registered', {
      systemId,
      routeConfig
    });
  }

  /**
   * Unregister system route
   * @param {string} systemId - System ID
   */
  unregisterSystemRoute(systemId) {
    this.systemRoutes.delete(systemId);
    this.loadBalancingState.delete(systemId);
    
    logger.info('System route unregistered', {
      systemId
    });
  }

  /**
   * Get middleware metrics
   * @returns {Object} Metrics data
   */
  getMetrics() {
    return {
      requests: {
        total: this.requestMetrics.totalRequests,
        errors: this.requestMetrics.errorRequests,
        averageResponseTime: this.requestMetrics.averageResponseTime,
        systemBreakdown: Object.fromEntries(this.requestMetrics.systemRequests)
      },
      systems: {
        registered: this.systemRoutes.size,
        routes: Array.from(this.systemRoutes.keys())
      },
      loadBalancing: {
        activeSystems: this.loadBalancingState.size,
        states: Object.fromEntries(
          Array.from(this.loadBalancingState.entries()).map(([id, state]) => [
            id,
            {
              requestCount: state.requestCount,
              lastUsed: state.lastUsed
            }
          ])
        )
      }
    };
  }

  /**
   * Generate request ID
   * @returns {string} Request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.requestMetrics = {
      totalRequests: 0,
      systemRequests: new Map(),
      errorRequests: 0,
      averageResponseTime: 0
    };
    
    logger.info('Middleware metrics reset');
  }

  /**
   * Return the middleware stack in a format Express can consume.
   * Express supports an array of middleware functions for app.use(),
   * so we return an array to be mounted directly.
   * @returns {Function[]} Array of middleware functions
   */
  getMiddleware() {
    try {
      const stack = this.initializeMiddleware();
      if (Array.isArray(stack) && stack.length > 0) {
        return stack;
      }
      // Fallback to a no-op middleware array if initialization produced nothing
      return [(_req, _res, next) => next()];
    } catch (error) {
      logger.error('Failed to build multi-system middleware stack', {
        error: error.message,
        stack: error.stack,
      });
      // Ensure server continues to run even if middleware building fails
      return [(_req, _res, next) => next()];
    }
  }
}

module.exports = MultiSystemMiddleware;