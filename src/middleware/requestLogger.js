/**
 * Request Logger Middleware
 * Comprehensive request logging for MCP server
 */

const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Request statistics collector
 */
class RequestStats {
  constructor() {
    this.stats = {
      total: 0,
      byMethod: {},
      byStatus: {},
      byPath: {},
      responseTimeStats: {
        min: Infinity,
        max: 0,
        avg: 0,
        total: 0
      },
      recent: []
    };
  }

  /**
   * Record request statistics
   * @param {Object} requestData - Request data to record
   */
  recordRequest(requestData) {
    const { method, path, statusCode, responseTime } = requestData;

    // Update counters
    this.stats.total++;
    this.stats.byMethod[method] = (this.stats.byMethod[method] || 0) + 1;
    this.stats.byStatus[statusCode] = (this.stats.byStatus[statusCode] || 0) + 1;
    this.stats.byPath[path] = (this.stats.byPath[path] || 0) + 1;

    // Update response time statistics
    if (responseTime !== undefined) {
      this.stats.responseTimeStats.min = Math.min(this.stats.responseTimeStats.min, responseTime);
      this.stats.responseTimeStats.max = Math.max(this.stats.responseTimeStats.max, responseTime);
      this.stats.responseTimeStats.total += responseTime;
      this.stats.responseTimeStats.avg = this.stats.responseTimeStats.total / this.stats.total;
    }

    // Add to recent requests (keep last 100)
    this.stats.recent.unshift({
      ...requestData,
      timestamp: new Date().toISOString()
    });

    if (this.stats.recent.length > 100) {
      this.stats.recent = this.stats.recent.slice(0, 100);
    }
  }

  /**
   * Get request statistics
   * @returns {Object} Request statistics
   */
  getStats() {
    return {
      ...this.stats,
      responseTimeStats: {
        ...this.stats.responseTimeStats,
        min: this.stats.responseTimeStats.min === Infinity ? 0 : this.stats.responseTimeStats.min
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset statistics
   */
  reset() {
    this.stats = {
      total: 0,
      byMethod: {},
      byStatus: {},
      byPath: {},
      responseTimeStats: {
        min: Infinity,
        max: 0,
        avg: 0,
        total: 0
      },
      recent: []
    };
  }
}

// Global request stats instance
const requestStats = new RequestStats();

/**
 * Generate unique request ID
 * @returns {string} Unique request ID
 */
function generateRequestId() {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Get client IP address
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
function getClientIP(req) {
  return req.ip ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         'unknown';
}

/**
 * Get user agent information
 * @param {Object} req - Express request object
 * @returns {string} User agent string
 */
function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Sanitize sensitive data from request body
 * @param {Object} body - Request body
 * @returns {Object} Sanitized body
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'auth', 'authorization',
    'apiKey', 'api_key', 'accessToken', 'access_token', 'refreshToken',
    'refresh_token', 'privateKey', 'private_key'
  ];

  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Sanitize sensitive headers
 * @param {Object} headers - Request headers
 * @returns {Object} Sanitized headers
 */
function sanitizeHeaders(headers) {
  const sensitiveHeaders = [
    'authorization', 'cookie', 'x-api-key', 'x-auth-token',
    'x-access-token', 'x-refresh-token'
  ];

  const sanitized = { ...headers };
  
  for (const header of sensitiveHeaders) {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Request logger middleware
 * @param {Object} options - Logger options
 * @returns {Function} Express middleware
 */
function requestLogger(options = {}) {
  const {
    logLevel = 'info',
    logBody = false,
    logHeaders = false,
    logQuery = true,
    logResponseBody = false,
    skipPaths = ['/health', '/metrics'],
    skipMethods = [],
    maxBodySize = 1024, // 1KB
    includeUserAgent = true,
    includeIP = true
  } = options;

  return (req, res, next) => {
    // Skip logging for specified paths
    if (skipPaths.includes(req.path)) {
      return next();
    }

    // Skip logging for specified methods
    if (skipMethods.includes(req.method)) {
      return next();
    }

    // Generate request ID
    const requestId = generateRequestId();
    req.requestId = requestId;
    res.set('X-Request-ID', requestId);

    // Record start time
    const startTime = Date.now();

    // Prepare request data
    const requestData = {
      requestId,
      method: req.method,
      url: req.url,
      path: req.path,
      query: logQuery ? req.query : undefined,
      headers: logHeaders ? sanitizeHeaders(req.headers) : undefined,
      body: logBody && req.body ? sanitizeBody(req.body) : undefined,
      ip: includeIP ? getClientIP(req) : undefined,
      userAgent: includeUserAgent ? getUserAgent(req) : undefined,
      timestamp: new Date().toISOString()
    };

    // Limit body size for logging
    if (requestData.body && typeof requestData.body === 'string' && requestData.body.length > maxBodySize) {
      requestData.body = requestData.body.substring(0, maxBodySize) + '...[truncated]';
    }

    // Log incoming request
    logger[logLevel]('Incoming request', requestData);

    // Capture original res.json and res.send
    const originalJson = res.json;
    const originalSend = res.send;
    let responseBody = null;

    // Override res.json to capture response body
    res.json = function(body) {
      if (logResponseBody) {
        responseBody = body;
      }
      return originalJson.call(this, body);
    };

    // Override res.send to capture response body
    res.send = function(body) {
      if (logResponseBody && !responseBody) {
        responseBody = body;
      }
      return originalSend.call(this, body);
    };

    // Log response when finished
    res.on('finish', () => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const responseData = {
        requestId,
        method: req.method,
        url: req.url,
        path: req.path,
        statusCode: res.statusCode,
        responseTime,
        contentLength: res.get('content-length'),
        responseBody: logResponseBody ? responseBody : undefined,
        timestamp: new Date().toISOString()
      };

      // Determine log level based on status code
      let responseLogLevel = logLevel;
      if (res.statusCode >= 500) {
        responseLogLevel = 'error';
      } else if (res.statusCode >= 400) {
        responseLogLevel = 'warn';
      }

      // Log response
      logger[responseLogLevel]('Request completed', responseData);

      // Record statistics
      requestStats.recordRequest({
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime,
        ip: getClientIP(req),
        userAgent: getUserAgent(req)
      });
    });

    // Log response on error
    res.on('error', (error) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.error('Request error', {
        requestId,
        method: req.method,
        url: req.url,
        path: req.path,
        error: error.message,
        responseTime,
        timestamp: new Date().toISOString()
      });

      // Record error statistics
      requestStats.recordRequest({
        requestId,
        method: req.method,
        path: req.path,
        statusCode: 500,
        responseTime,
        error: error.message,
        ip: getClientIP(req),
        userAgent: getUserAgent(req)
      });
    });

    next();
  };
}

/**
 * MCP protocol request logger
 * @param {Object} request - MCP request
 * @param {Object} response - MCP response
 * @param {number} responseTime - Response time in ms
 */
function logMCPRequest(request, response, responseTime) {
  const requestId = generateRequestId();
  
  const logData = {
    requestId,
    protocol: 'MCP',
    method: request.method,
    params: request.params,
    id: request.id,
    responseTime,
    success: !response.error,
    error: response.error ? response.error.message : undefined,
    timestamp: new Date().toISOString()
  };

  const logLevel = response.error ? 'error' : 'info';
  logger[logLevel]('MCP request', logData);

  // Record statistics
  requestStats.recordRequest({
    requestId,
    method: `MCP:${request.method}`,
    path: `/mcp/${request.method}`,
    statusCode: response.error ? 500 : 200,
    responseTime
  });
}

/**
 * Get request statistics
 * @returns {Object} Request statistics
 */
function getRequestStats() {
  return requestStats.getStats();
}

/**
 * Reset request statistics
 */
function resetRequestStats() {
  requestStats.reset();
}

/**
 * Health check for request logger
 * @returns {Object} Health status
 */
function getHealthStatus() {
  const stats = requestStats.getStats();
  
  return {
    status: 'healthy',
    requestLogger: {
      totalRequests: stats.total,
      averageResponseTime: Math.round(stats.responseTimeStats.avg || 0),
      recentRequests: stats.recent.length,
      errorRate: stats.byStatus['500'] ? 
        ((stats.byStatus['500'] / stats.total) * 100).toFixed(2) + '%' : '0%'
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Express middleware for request ID injection
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function injectRequestId(req, res, next) {
  if (!req.requestId) {
    req.requestId = generateRequestId();
    res.set('X-Request-ID', req.requestId);
  }
  next();
}

module.exports = {
  requestLogger,
  logMCPRequest,
  injectRequestId,
  getRequestStats,
  resetRequestStats,
  getHealthStatus,
  generateRequestId,
  getClientIP,
  getUserAgent,
  sanitizeBody,
  sanitizeHeaders
};