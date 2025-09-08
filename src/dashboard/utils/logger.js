/**
 * NEXUS IDE Security Dashboard - Advanced Logging System
 * Enterprise-grade logging with multiple transports and security features
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { LOGGING } = require('../config/dashboard-config');

/**
 * Custom log formatter
 */
class CustomFormatter {
    constructor(options = {}) {
        this.includeStack = options.includeStack || false;
        this.maskSensitive = options.maskSensitive !== false;
        this.sensitiveFields = options.sensitiveFields || [
            'password', 'token', 'secret', 'key', 'authorization',
            'cookie', 'session', 'credential', 'auth'
        ];
    }
    
    format(info) {
        const timestamp = new Date().toISOString();
        const level = info.level.toUpperCase();
        const message = info.message;
        
        // Create base log object
        const logEntry = {
            timestamp,
            level,
            message,
            service: 'nexus-security-dashboard',
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            pid: process.pid,
            hostname: require('os').hostname()
        };
        
        // Add metadata
        const metadata = { ...info };
        delete metadata.level;
        delete metadata.message;
        delete metadata.timestamp;
        delete metadata.service;
        
        if (Object.keys(metadata).length > 0) {
            logEntry.metadata = this.maskSensitive ? this.maskSensitiveData(metadata) : metadata;
        }
        
        // Add stack trace for errors
        if (info.stack && this.includeStack) {
            logEntry.stack = info.stack;
        }
        
        // Add correlation ID if available
        if (info.correlationId) {
            logEntry.correlationId = info.correlationId;
        }
        
        return logEntry;
    }
    
    maskSensitiveData(obj, depth = 0) {
        if (depth > 10) return '[Max Depth Reached]'; // Prevent infinite recursion
        
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.maskSensitiveData(item, depth + 1));
        }
        
        const masked = {};
        for (const [key, value] of Object.entries(obj)) {
            const lowerKey = key.toLowerCase();
            
            if (this.sensitiveFields.some(field => lowerKey.includes(field))) {
                masked[key] = this.maskValue(value);
            } else if (typeof value === 'object' && value !== null) {
                masked[key] = this.maskSensitiveData(value, depth + 1);
            } else {
                masked[key] = value;
            }
        }
        
        return masked;
    }
    
    maskValue(value) {
        if (typeof value !== 'string') {
            return '[MASKED]';
        }
        
        if (value.length <= 4) {
            return '*'.repeat(value.length);
        }
        
        return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
    }
}

/**
 * Security Event Logger
 */
class SecurityEventLogger {
    constructor(logger) {
        this.logger = logger;
        this.eventTypes = {
            AUTHENTICATION: 'authentication',
            AUTHORIZATION: 'authorization',
            DATA_ACCESS: 'data_access',
            CONFIGURATION_CHANGE: 'configuration_change',
            SECURITY_VIOLATION: 'security_violation',
            SYSTEM_EVENT: 'system_event'
        };
    }
    
    logSecurityEvent(type, event, metadata = {}) {
        const securityEvent = {
            eventType: type,
            eventId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            severity: this.getSeverity(type, event),
            event,
            ...metadata
        };
        
        this.logger.info('Security Event', securityEvent);
        
        // Also log to security-specific file if configured
        if (this.securityLogger) {
            this.securityLogger.info('Security Event', securityEvent);
        }
    }
    
    getSeverity(type, event) {
        const severityMap = {
            [this.eventTypes.AUTHENTICATION]: {
                'login_success': 'info',
                'login_failure': 'warning',
                'logout': 'info',
                'password_change': 'info',
                'mfa_enabled': 'info',
                'mfa_disabled': 'warning'
            },
            [this.eventTypes.AUTHORIZATION]: {
                'access_granted': 'info',
                'access_denied': 'warning',
                'privilege_escalation': 'error',
                'role_change': 'warning'
            },
            [this.eventTypes.SECURITY_VIOLATION]: {
                'brute_force_attempt': 'error',
                'sql_injection_attempt': 'critical',
                'xss_attempt': 'error',
                'suspicious_activity': 'warning',
                'ip_blocked': 'warning'
            }
        };
        
        return severityMap[type]?.[event] || 'info';
    }
    
    // Convenience methods
    logAuthentication(event, metadata) {
        this.logSecurityEvent(this.eventTypes.AUTHENTICATION, event, metadata);
    }
    
    logAuthorization(event, metadata) {
        this.logSecurityEvent(this.eventTypes.AUTHORIZATION, event, metadata);
    }
    
    logDataAccess(event, metadata) {
        this.logSecurityEvent(this.eventTypes.DATA_ACCESS, event, metadata);
    }
    
    logConfigurationChange(event, metadata) {
        this.logSecurityEvent(this.eventTypes.CONFIGURATION_CHANGE, event, metadata);
    }
    
    logSecurityViolation(event, metadata) {
        this.logSecurityEvent(this.eventTypes.SECURITY_VIOLATION, event, metadata);
    }
    
    logSystemEvent(event, metadata) {
        this.logSecurityEvent(this.eventTypes.SYSTEM_EVENT, event, metadata);
    }
}

/**
 * Performance Logger
 */
class PerformanceLogger {
    constructor(logger) {
        this.logger = logger;
        this.timers = new Map();
    }
    
    startTimer(id, metadata = {}) {
        this.timers.set(id, {
            startTime: process.hrtime.bigint(),
            metadata
        });
    }
    
    endTimer(id, additionalMetadata = {}) {
        const timer = this.timers.get(id);
        if (!timer) {
            this.logger.warn('Timer not found', { timerId: id });
            return;
        }
        
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - timer.startTime) / 1000000; // Convert to milliseconds
        
        this.logger.info('Performance Metric', {
            timerId: id,
            duration,
            unit: 'ms',
            ...timer.metadata,
            ...additionalMetadata
        });
        
        this.timers.delete(id);
        return duration;
    }
    
    logMetric(name, value, unit = 'count', metadata = {}) {
        this.logger.info('Performance Metric', {
            metric: name,
            value,
            unit,
            timestamp: new Date().toISOString(),
            ...metadata
        });
    }
    
    middleware() {
        return (req, res, next) => {
            const requestId = crypto.randomUUID();
            const startTime = process.hrtime.bigint();
            
            req.requestId = requestId;
            req.startTime = startTime;
            
            // Override res.end to capture response time
            const originalEnd = res.end;
            res.end = (...args) => {
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000;
                
                this.logger.info('HTTP Request', {
                    requestId,
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode,
                    duration,
                    unit: 'ms',
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    contentLength: res.get('Content-Length') || 0
                });
                
                originalEnd.apply(res, args);
            };
            
            next();
        };
    }
}

/**
 * Logger Factory
 */
class LoggerFactory {
    constructor() {
        this.loggers = new Map();
        this.defaultLogger = this.createLogger('default');
        this.securityLogger = new SecurityEventLogger(this.defaultLogger);
        this.performanceLogger = new PerformanceLogger(this.defaultLogger);
    }
    
    createLogger(name, options = {}) {
        if (this.loggers.has(name)) {
            return this.loggers.get(name);
        }
        
        const logDir = options.logDir || LOGGING.logDir || './logs';
        
        // Ensure log directory exists
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const formatter = new CustomFormatter({
            includeStack: options.includeStack !== false,
            maskSensitive: options.maskSensitive !== false
        });
        
        const transports = [];
        
        // Console transport
        if (LOGGING.console.enabled) {
            transports.push(new winston.transports.Console({
                level: LOGGING.console.level,
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.timestamp(),
                    winston.format.printf(info => {
                        const formatted = formatter.format(info);
                        return `${formatted.timestamp} [${formatted.level}] ${formatted.message} ${JSON.stringify(formatted.metadata || {})}`;
                    })
                )
            }));
        }
        
        // File transport
        if (LOGGING.file.enabled) {
            transports.push(new DailyRotateFile({
                filename: path.join(logDir, `${name}-%DATE%.log`),
                datePattern: 'YYYY-MM-DD',
                level: LOGGING.file.level,
                maxSize: LOGGING.file.maxSize,
                maxFiles: LOGGING.file.maxFiles,
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json(),
                    winston.format.printf(info => {
                        const formatted = formatter.format(info);
                        return JSON.stringify(formatted);
                    })
                )
            }));
        }
        
        // Error file transport
        if (LOGGING.errorFile.enabled) {
            transports.push(new DailyRotateFile({
                filename: path.join(logDir, `${name}-error-%DATE%.log`),
                datePattern: 'YYYY-MM-DD',
                level: 'error',
                maxSize: LOGGING.errorFile.maxSize,
                maxFiles: LOGGING.errorFile.maxFiles,
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json(),
                    winston.format.printf(info => {
                        const formatted = formatter.format(info);
                        return JSON.stringify(formatted);
                    })
                )
            }));
        }
        
        // Security file transport
        if (name === 'security' || options.security) {
            transports.push(new DailyRotateFile({
                filename: path.join(logDir, `security-%DATE%.log`),
                datePattern: 'YYYY-MM-DD',
                level: 'info',
                maxSize: '100m',
                maxFiles: '30d',
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json(),
                    winston.format.printf(info => {
                        const formatted = formatter.format(info);
                        return JSON.stringify(formatted);
                    })
                )
            }));
        }
        
        const logger = winston.createLogger({
            level: options.level || LOGGING.level,
            transports,
            exitOnError: false,
            handleExceptions: true,
            handleRejections: true
        });
        
        // Add correlation ID support
        logger.child = (metadata) => {
            return {
                info: (message, meta = {}) => logger.info(message, { ...metadata, ...meta }),
                warn: (message, meta = {}) => logger.warn(message, { ...metadata, ...meta }),
                error: (message, meta = {}) => logger.error(message, { ...metadata, ...meta }),
                debug: (message, meta = {}) => logger.debug(message, { ...metadata, ...meta })
            };
        };
        
        this.loggers.set(name, logger);
        return logger;
    }
    
    getLogger(name = 'default') {
        return this.loggers.get(name) || this.defaultLogger;
    }
    
    getSecurityLogger() {
        return this.securityLogger;
    }
    
    getPerformanceLogger() {
        return this.performanceLogger;
    }
    
    // Middleware for request correlation
    correlationMiddleware() {
        return (req, res, next) => {
            const correlationId = req.get('X-Correlation-ID') || crypto.randomUUID();
            req.correlationId = correlationId;
            res.set('X-Correlation-ID', correlationId);
            
            // Create child logger with correlation ID
            req.logger = this.defaultLogger.child({ correlationId });
            
            next();
        };
    }
    
    // Error handling middleware
    errorMiddleware() {
        return (error, req, res, next) => {
            const logger = req.logger || this.defaultLogger;
            
            logger.error('Unhandled error', {
                error: error.message,
                stack: error.stack,
                method: req.method,
                path: req.path,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                correlationId: req.correlationId
            });
            
            next(error);
        };
    }
    
    // Graceful shutdown
    shutdown() {
        return new Promise((resolve) => {
            let completed = 0;
            const total = this.loggers.size;
            
            if (total === 0) {
                resolve();
                return;
            }
            
            this.loggers.forEach((logger) => {
                logger.end(() => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                });
            });
        });
    }
}

// Create singleton instance
const loggerFactory = new LoggerFactory();

// Export default logger and factory
module.exports = loggerFactory.getLogger();
module.exports.LoggerFactory = LoggerFactory;
module.exports.SecurityEventLogger = SecurityEventLogger;
module.exports.PerformanceLogger = PerformanceLogger;
module.exports.factory = loggerFactory;
module.exports.security = loggerFactory.getSecurityLogger();
module.exports.performance = loggerFactory.getPerformanceLogger();