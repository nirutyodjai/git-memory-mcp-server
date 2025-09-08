/**
 * =============================================================================
 * NEXUS IDE - Advanced Logging System
 * =============================================================================
 * 
 * Comprehensive logging system for AI Central Server
 * 
 * Features:
 * - Multiple log levels (error, warn, info, debug, trace)
 * - Multiple transports (console, file, external services)
 * - Structured logging with metadata
 * - Performance monitoring
 * - Error tracking and alerting
 * - Log rotation and archiving
 * - Real-time log streaming
 * - Custom formatters
 * 
 * Author: NEXUS IDE Team
 * Version: 1.0.0
 * License: MIT
 * 
 * =============================================================================
 */

'use strict';

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const os = require('os');
const util = require('util');
const config = require('../config/config');

// =============================================================================
// Constants
// =============================================================================
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5
};

const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  trace: 'cyan'
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Ensure log directory exists
 */
const ensureLogDirectory = (logDir) => {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
};

/**
 * Get caller information
 */
const getCallerInfo = () => {
  const originalFunc = Error.prepareStackTrace;
  let callerfile;
  let callerline;
  let callerfunc;
  
  try {
    const err = new Error();
    let currentfile;
    
    Error.prepareStackTrace = (err, stack) => stack;
    
    currentfile = err.stack.shift().getFileName();
    
    while (err.stack.length) {
      const caller = err.stack.shift();
      callerfile = caller.getFileName();
      callerline = caller.getLineNumber();
      callerfunc = caller.getFunctionName();
      
      if (currentfile !== callerfile) break;
    }
  } catch (e) {
    // Ignore errors
  }
  
  Error.prepareStackTrace = originalFunc;
  
  return {
    file: callerfile ? path.basename(callerfile) : 'unknown',
    line: callerline || 0,
    function: callerfunc || 'anonymous'
  };
};

/**
 * Custom formatter for structured logging
 */
const customFormatter = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const {
      timestamp,
      level,
      message,
      stack,
      ...meta
    } = info;
    
    const logObject = {
      timestamp,
      level: level.toUpperCase(),
      message,
      pid: process.pid,
      hostname: os.hostname(),
      service: 'ai-central-server',
      version: config.server.version,
      environment: config.env.NODE_ENV
    };
    
    // Add stack trace for errors
    if (stack) {
      logObject.stack = stack;
    }
    
    // Add metadata
    if (Object.keys(meta).length > 0) {
      logObject.meta = meta;
    }
    
    return JSON.stringify(logObject);
  })
);

/**
 * Console formatter for development
 */
const consoleFormatter = winston.format.combine(
  winston.format.timestamp({
    format: 'HH:mm:ss.SSS'
  }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const {
      timestamp,
      level,
      message,
      stack,
      ...meta
    } = info;
    
    let logMessage = `${timestamp} [${level}] ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    // Add stack trace for errors
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    return logMessage;
  })
);

// =============================================================================
// Transport Configuration
// =============================================================================

/**
 * Create file transport with rotation
 */
const createFileTransport = (filename, level = 'info') => {
  return new DailyRotateFile({
    filename: path.join(config.logging.files.directory, filename),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level,
    format: customFormatter,
    handleExceptions: level === 'error',
    handleRejections: level === 'error'
  });
};

/**
 * Create console transport
 */
const createConsoleTransport = () => {
  return new winston.transports.Console({
    level: config.logging.level,
    format: config.env.isDevelopment ? consoleFormatter : customFormatter,
    handleExceptions: true,
    handleRejections: true
  });
};

/**
 * Create HTTP transport for external logging services
 */
const createHttpTransport = (options) => {
  return new winston.transports.Http({
    host: options.host,
    port: options.port,
    path: options.path,
    ssl: options.ssl || false,
    level: 'info',
    format: customFormatter
  });
};

// =============================================================================
// Logger Configuration
// =============================================================================

// Ensure log directory exists
if (config.logging.files.enabled) {
  ensureLogDirectory(config.logging.files.directory);
}

// Configure winston
winston.addColors(LOG_COLORS);

// Create transports array
const transports = [];

// Console transport
if (config.logging.console.enabled) {
  transports.push(createConsoleTransport());
}

// File transports
if (config.logging.files.enabled) {
  // Error log
  transports.push(createFileTransport(
    config.logging.files.error.filename,
    'error'
  ));
  
  // Combined log
  transports.push(createFileTransport(
    config.logging.files.combined.filename,
    'debug'
  ));
  
  // Access log (for HTTP requests)
  if (config.logging.files.access.enabled) {
    transports.push(createFileTransport(
      config.logging.files.access.filename,
      'http'
    ));
  }
}

// External service transports
if (config.logging.external.elasticsearch.enabled) {
  const { ElasticsearchTransport } = require('winston-elasticsearch');
  
  transports.push(new ElasticsearchTransport({
    level: 'info',
    clientOpts: {
      node: `http://${config.logging.external.elasticsearch.host}`,
      log: 'error'
    },
    index: config.logging.external.elasticsearch.index,
    type: config.logging.external.elasticsearch.type,
    format: customFormatter
  }));
}

if (config.logging.external.syslog.enabled) {
  require('winston-syslog');
  
  transports.push(new winston.transports.Syslog({
    host: config.logging.external.syslog.host,
    port: config.logging.external.syslog.port,
    facility: config.logging.external.syslog.facility,
    level: 'info',
    format: customFormatter
  }));
}

// Create logger instance
const logger = winston.createLogger({
  levels: LOG_LEVELS,
  level: config.logging.level,
  format: customFormatter,
  transports,
  exitOnError: false,
  
  // Exception handling
  exceptionHandlers: config.logging.files.enabled ? [
    createFileTransport('exceptions.log', 'error')
  ] : [],
  
  // Rejection handling
  rejectionHandlers: config.logging.files.enabled ? [
    createFileTransport('rejections.log', 'error')
  ] : []
});

// =============================================================================
// Enhanced Logger Methods
// =============================================================================

/**
 * Enhanced logging method with caller info
 */
const enhancedLog = (level, message, meta = {}) => {
  const caller = getCallerInfo();
  const enhancedMeta = {
    ...meta,
    caller: {
      file: caller.file,
      line: caller.line,
      function: caller.function
    },
    requestId: meta.requestId || global.requestId,
    userId: meta.userId || global.userId,
    sessionId: meta.sessionId || global.sessionId
  };
  
  logger.log(level, message, enhancedMeta);
};

// =============================================================================
// Performance Monitoring
// =============================================================================

/**
 * Performance timer
 */
class PerformanceTimer {
  constructor(name, metadata = {}) {
    this.name = name;
    this.metadata = metadata;
    this.startTime = process.hrtime.bigint();
    this.startMemory = process.memoryUsage();
  }
  
  end(additionalMetadata = {}) {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    const duration = Number(endTime - this.startTime) / 1000000; // Convert to milliseconds
    
    const performanceData = {
      name: this.name,
      duration: `${duration.toFixed(2)}ms`,
      durationMs: duration,
      memory: {
        heapUsed: endMemory.heapUsed - this.startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - this.startMemory.heapTotal,
        external: endMemory.external - this.startMemory.external,
        rss: endMemory.rss - this.startMemory.rss
      },
      ...this.metadata,
      ...additionalMetadata
    };
    
    if (duration > config.monitoring.performance.slowRequestThreshold) {
      logger.warn('Slow operation detected', performanceData);
    } else {
      logger.debug('Performance measurement', performanceData);
    }
    
    return performanceData;
  }
}

/**
 * Create performance timer
 */
const timer = (name, metadata = {}) => {
  return new PerformanceTimer(name, metadata);
};

/**
 * Measure function execution time
 */
const measure = async (name, fn, metadata = {}) => {
  const performanceTimer = timer(name, metadata);
  
  try {
    const result = await fn();
    performanceTimer.end({ success: true });
    return result;
  } catch (error) {
    performanceTimer.end({ success: false, error: error.message });
    throw error;
  }
};

// =============================================================================
// Request Logging Middleware
// =============================================================================

/**
 * Express request logging middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || 
                   req.headers['x-correlation-id'] || 
                   require('crypto').randomUUID();
  
  // Set request ID globally for this request
  req.requestId = requestId;
  global.requestId = requestId;
  
  // Set user ID if available
  if (req.user?.id) {
    global.userId = req.user.id;
    global.sessionId = req.user.sessionId;
  }
  
  // Log request start
  logger.http('Request started', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    sessionId: req.user?.sessionId
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    logger.http('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      durationMs: duration,
      contentLength: res.get('Content-Length'),
      userId: req.user?.id,
      sessionId: req.user?.sessionId
    });
    
    // Clear global variables
    delete global.requestId;
    delete global.userId;
    delete global.sessionId;
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// =============================================================================
// Error Logging
// =============================================================================

/**
 * Enhanced error logging
 */
const logError = (error, context = {}) => {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    ...context
  };
  
  logger.error('Application error', errorInfo);
  
  // Send to external error tracking service if configured
  // TODO: Integrate with Sentry, Bugsnag, etc.
};

/**
 * Unhandled error handlers
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
    pid: process.pid
  });
  
  // Give logger time to write before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: util.inspect(promise),
    pid: process.pid
  });
});

// =============================================================================
// Health Check Logging
// =============================================================================

/**
 * Log system health metrics
 */
const logHealthMetrics = () => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  logger.info('System health metrics', {
    memory: {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    uptime: `${Math.round(process.uptime())}s`,
    pid: process.pid,
    version: process.version,
    platform: process.platform,
    arch: process.arch
  });
};

// Log health metrics periodically
if (config.monitoring.enabled) {
  setInterval(logHealthMetrics, config.monitoring.health.interval);
}

// =============================================================================
// Export Logger
// =============================================================================
module.exports = {
  // Core logger methods
  error: (message, meta) => enhancedLog('error', message, meta),
  warn: (message, meta) => enhancedLog('warn', message, meta),
  info: (message, meta) => enhancedLog('info', message, meta),
  http: (message, meta) => enhancedLog('http', message, meta),
  debug: (message, meta) => enhancedLog('debug', message, meta),
  trace: (message, meta) => enhancedLog('trace', message, meta),
  
  // Enhanced methods
  logError,
  timer,
  measure,
  requestLogger,
  logHealthMetrics,
  
  // Winston logger instance (for advanced usage)
  winston: logger,
  
  // Performance timer class
  PerformanceTimer
};

// =============================================================================
// Startup Log
// =============================================================================
if (!config.env.isTesting) {
  logger.info('Logger initialized', {
    level: config.logging.level,
    transports: transports.map(t => t.constructor.name),
    environment: config.env.NODE_ENV,
    version: config.server.version
  });
}

// =============================================================================
// End of File
// =============================================================================