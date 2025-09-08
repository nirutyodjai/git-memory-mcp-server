/**
 * Error Handler Middleware
 * Centralized error handling for MCP server
 */

const logger = require('../utils/logger');

/**
 * Custom error classes
 */
class MCPError extends Error {
  constructor(message, code = 'MCP_ERROR', statusCode = 500, details = null) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

class ValidationError extends MCPError {
  constructor(message, details = null) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends MCPError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends MCPError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends MCPError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends MCPError {
  constructor(message = 'Resource conflict') {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends MCPError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
  }
}

class ServiceUnavailableError extends MCPError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 'SERVICE_UNAVAILABLE', 503);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Error response formatter
 */
class ErrorFormatter {
  /**
   * Format error for HTTP response
   * @param {Error} error - Error to format
   * @param {boolean} includeStack - Include stack trace
   * @returns {Object} Formatted error response
   */
  static formatHttpError(error, includeStack = false) {
    const response = {
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
        timestamp: error.timestamp || new Date().toISOString()
      }
    };

    // Add details if available
    if (error.details) {
      response.error.details = error.details;
    }

    // Add stack trace in development
    if (includeStack && error.stack) {
      response.error.stack = error.stack;
    }

    return response;
  }

  /**
   * Format error for MCP protocol response
   * @param {Error} error - Error to format
   * @param {string} id - Request ID
   * @returns {Object} MCP error response
   */
  static formatMCPError(error, id = null) {
    return {
      jsonrpc: '2.0',
      error: {
        code: this.getMCPErrorCode(error),
        message: error.message || 'An unexpected error occurred',
        data: {
          type: error.name || 'Error',
          details: error.details || null,
          timestamp: error.timestamp || new Date().toISOString()
        }
      },
      id
    };
  }

  /**
   * Get MCP protocol error code
   * @param {Error} error - Error object
   * @returns {number} MCP error code
   */
  static getMCPErrorCode(error) {
    const errorCodeMap = {
      'ValidationError': -32602, // Invalid params
      'AuthenticationError': -32001, // Authentication required
      'AuthorizationError': -32002, // Insufficient permissions
      'NotFoundError': -32601, // Method not found
      'RateLimitError': -32003, // Rate limit exceeded
      'ServiceUnavailableError': -32004, // Service unavailable
      'MCPError': -32000, // Server error
    };

    return errorCodeMap[error.name] || -32603; // Internal error
  }
}

/**
 * Error statistics collector
 */
class ErrorStats {
  constructor() {
    this.stats = {
      total: 0,
      byType: {},
      byCode: {},
      byHour: {},
      recent: []
    };
  }

  /**
   * Record error occurrence
   * @param {Error} error - Error to record
   * @param {Object} context - Additional context
   */
  recordError(error, context = {}) {
    const now = new Date();
    const hour = now.getHours();
    const errorType = error.name || 'Unknown';
    const errorCode = error.code || 'UNKNOWN';

    // Update counters
    this.stats.total++;
    this.stats.byType[errorType] = (this.stats.byType[errorType] || 0) + 1;
    this.stats.byCode[errorCode] = (this.stats.byCode[errorCode] || 0) + 1;
    this.stats.byHour[hour] = (this.stats.byHour[hour] || 0) + 1;

    // Add to recent errors (keep last 100)
    this.stats.recent.unshift({
      timestamp: now.toISOString(),
      type: errorType,
      code: errorCode,
      message: error.message,
      context
    });

    if (this.stats.recent.length > 100) {
      this.stats.recent = this.stats.recent.slice(0, 100);
    }
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getStats() {
    return {
      ...this.stats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset statistics
   */
  reset() {
    this.stats = {
      total: 0,
      byType: {},
      byCode: {},
      byHour: {},
      recent: []
    };
  }
}

// Global error stats instance
const errorStats = new ErrorStats();

/**
 * Express error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function errorHandler(err, req, res, next) {
  // Record error statistics
  errorStats.recordError(err, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Log error
  const logLevel = err.statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel]('Request error', {
    error: err.message,
    code: err.code,
    statusCode: err.statusCode,
    method: req.method,
    url: req.url,
    stack: err.stack
  });

  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Include stack trace in development
  const includeStack = process.env.NODE_ENV === 'development';
  
  // Format and send error response
  const errorResponse = ErrorFormatter.formatHttpError(err, includeStack);
  res.status(statusCode).json(errorResponse);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`Route ${req.method} ${req.url} not found`);
  next(error);
}

/**
 * Unhandled rejection handler
 * @param {Error} reason - Rejection reason
 * @param {Promise} promise - Rejected promise
 */
function unhandledRejectionHandler(reason, promise) {
  logger.error('Unhandled Promise Rejection', {
    reason: reason.message || reason,
    stack: reason.stack,
    promise: promise.toString()
  });

  errorStats.recordError(reason, {
    type: 'unhandledRejection',
    promise: promise.toString()
  });

  // Don't exit the process in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
}

/**
 * Uncaught exception handler
 * @param {Error} error - Uncaught exception
 */
function uncaughtExceptionHandler(error) {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });

  errorStats.recordError(error, {
    type: 'uncaughtException'
  });

  // Graceful shutdown
  process.exit(1);
}

/**
 * Setup global error handlers
 */
function setupGlobalErrorHandlers() {
  process.on('unhandledRejection', unhandledRejectionHandler);
  process.on('uncaughtException', uncaughtExceptionHandler);

  logger.info('Global error handlers registered');
}

/**
 * MCP protocol error handler
 * @param {Error} error - Error object
 * @param {string} id - Request ID
 * @returns {Object} MCP error response
 */
function handleMCPError(error, id = null) {
  // Record error statistics
  errorStats.recordError(error, {
    protocol: 'MCP',
    id
  });

  // Log error
  logger.error('MCP protocol error', {
    error: error.message,
    code: error.code,
    id,
    stack: error.stack
  });

  return ErrorFormatter.formatMCPError(error, id);
}

/**
 * Health check for error handler
 * @returns {Object} Health status
 */
function getHealthStatus() {
  const stats = errorStats.getStats();
  const recentErrors = stats.recent.slice(0, 10);
  
  return {
    status: 'healthy',
    errorHandler: {
      totalErrors: stats.total,
      recentErrorCount: recentErrors.length,
      errorTypes: Object.keys(stats.byType),
      lastError: recentErrors[0] || null
    },
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  // Error classes
  MCPError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  
  // Error handling
  errorHandler,
  asyncHandler,
  notFoundHandler,
  handleMCPError,
  
  // Setup
  setupGlobalErrorHandlers,
  
  // Utilities
  ErrorFormatter,
  errorStats,
  getHealthStatus
};