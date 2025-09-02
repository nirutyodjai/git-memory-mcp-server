/**
 * Logger Utility for Git Memory MCP Server
 * Provides structured logging with different levels and formats
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ` ${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: {
    service: 'git-memory-mcp-server',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    
    // Debug log file (only in development)
    ...(process.env.NODE_ENV === 'development' ? [
      new winston.transports.File({
        filename: path.join(logsDir, 'debug.log'),
        level: 'debug',
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 3,
        tailable: true
      })
    ] : [])
  ],
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 3
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 3
    })
  ]
});

// Add console transport in development or when explicitly enabled
if (process.env.NODE_ENV === 'development' || process.env.CONSOLE_LOGGING === 'true') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: process.env.CONSOLE_LOG_LEVEL || 'debug'
  }));
}

// Add production-specific transports
if (process.env.NODE_ENV === 'production') {
  // Add Loki transport if configured
  if (process.env.LOKI_URL) {
    try {
      const LokiTransport = require('winston-loki');
      logger.add(new LokiTransport({
        host: process.env.LOKI_URL,
        labels: {
          app: 'git-memory-mcp-server',
          environment: process.env.NODE_ENV || 'production'
        },
        json: true,
        format: winston.format.json(),
        replaceTimestamp: true,
        onConnectionError: (err) => {
          console.error('Loki connection error:', err);
        }
      }));
    } catch (error) {
      console.warn('Winston-loki not available, skipping Loki transport');
    }
  }
}

// Helper functions for structured logging
const createStructuredLog = (level, message, meta = {}) => {
  const logData = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  };
  
  logger[level](message, meta);
  return logData;
};

// Enhanced logging methods
const enhancedLogger = {
  // Standard logging methods
  error: (message, meta = {}) => createStructuredLog('error', message, meta),
  warn: (message, meta = {}) => createStructuredLog('warn', message, meta),
  info: (message, meta = {}) => createStructuredLog('info', message, meta),
  debug: (message, meta = {}) => createStructuredLog('debug', message, meta),
  verbose: (message, meta = {}) => createStructuredLog('verbose', message, meta),
  
  // Specialized logging methods
  request: (method, url, meta = {}) => {
    return createStructuredLog('info', `${method} ${url}`, {
      type: 'request',
      method,
      url,
      ...meta
    });
  },
  
  response: (method, url, statusCode, responseTime, meta = {}) => {
    return createStructuredLog('info', `${method} ${url} ${statusCode} ${responseTime}ms`, {
      type: 'response',
      method,
      url,
      statusCode,
      responseTime,
      ...meta
    });
  },
  
  git: (operation, repository, meta = {}) => {
    return createStructuredLog('info', `Git ${operation} on ${repository}`, {
      type: 'git_operation',
      operation,
      repository,
      ...meta
    });
  },
  
  memory: (operation, key, meta = {}) => {
    return createStructuredLog('debug', `Memory ${operation}: ${key}`, {
      type: 'memory_operation',
      operation,
      key,
      ...meta
    });
  },
  
  semantic: (operation, query, results, meta = {}) => {
    return createStructuredLog('debug', `Semantic ${operation}: ${query}`, {
      type: 'semantic_operation',
      operation,
      query,
      results: results?.length || 0,
      ...meta
    });
  },
  
  performance: (operation, duration, meta = {}) => {
    const level = duration > 1000 ? 'warn' : 'debug';
    return createStructuredLog(level, `Performance: ${operation} took ${duration}ms`, {
      type: 'performance',
      operation,
      duration,
      ...meta
    });
  },
  
  security: (event, details, meta = {}) => {
    return createStructuredLog('warn', `Security event: ${event}`, {
      type: 'security',
      event,
      details,
      ...meta
    });
  },
  
  // Utility methods
  child: (defaultMeta) => {
    return {
      ...enhancedLogger,
      error: (message, meta = {}) => enhancedLogger.error(message, { ...defaultMeta, ...meta }),
      warn: (message, meta = {}) => enhancedLogger.warn(message, { ...defaultMeta, ...meta }),
      info: (message, meta = {}) => enhancedLogger.info(message, { ...defaultMeta, ...meta }),
      debug: (message, meta = {}) => enhancedLogger.debug(message, { ...defaultMeta, ...meta }),
      verbose: (message, meta = {}) => enhancedLogger.verbose(message, { ...defaultMeta, ...meta })
    };
  },
  
  // Get current log level
  getLevel: () => logger.level,
  
  // Set log level
  setLevel: (level) => {
    logger.level = level;
    logger.transports.forEach(transport => {
      if (transport.level !== 'error') {
        transport.level = level;
      }
    });
  },
  
  // Flush logs (useful for testing)
  flush: () => {
    return new Promise((resolve) => {
      logger.on('finish', resolve);
      logger.end();
    });
  }
};

// Export the enhanced logger
module.exports = enhancedLogger;

// Also export the raw winston logger for advanced use cases
module.exports.winston = logger;