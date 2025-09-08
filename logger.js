/**
 * =============================================================================
 * NEXUS IDE - Logger Module
 * =============================================================================
 * 
 * Centralized logging system for NEXUS IDE
 * 
 * Features:
 * - Multiple log levels (error, warn, info, debug)
 * - File and console output
 * - Structured logging with timestamps
 * - Performance monitoring
 * - Error tracking
 * 
 * Author: NEXUS IDE Team
 * Version: 1.0.0
 * License: MIT
 * 
 * =============================================================================
 */

'use strict';

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for logs
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

// Console format
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'nexus-ide' },
    transports: [
        // Error log file
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Combined log file
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Console output
        new winston.transports.Console({
            format: consoleFormat
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log')
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log')
        })
    ]
});

// Performance monitoring
class PerformanceMonitor {
    constructor() {
        this.timers = new Map();
    }

    start(label) {
        this.timers.set(label, process.hrtime.bigint());
        logger.debug(`Performance timer started: ${label}`);
    }

    end(label) {
        const startTime = this.timers.get(label);
        if (startTime) {
            const duration = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to milliseconds
            this.timers.delete(label);
            logger.info(`Performance: ${label} completed in ${duration.toFixed(2)}ms`);
            return duration;
        }
        logger.warn(`Performance timer not found: ${label}`);
        return null;
    }

    measure(label, fn) {
        this.start(label);
        try {
            const result = fn();
            if (result && typeof result.then === 'function') {
                return result.finally(() => this.end(label));
            }
            this.end(label);
            return result;
        } catch (error) {
            this.end(label);
            throw error;
        }
    }
}

// Create performance monitor instance
const perf = new PerformanceMonitor();

// Enhanced logger with additional methods
const enhancedLogger = {
    ...logger,
    perf,
    
    // API request logging
    request(req, res, duration) {
        logger.info('API Request', {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode,
            duration: `${duration}ms`
        });
    },

    // Database operation logging
    db(operation, collection, duration, error = null) {
        if (error) {
            logger.error('Database Error', {
                operation,
                collection,
                duration: `${duration}ms`,
                error: error.message
            });
        } else {
            logger.info('Database Operation', {
                operation,
                collection,
                duration: `${duration}ms`
            });
        }
    },

    // AI operation logging
    ai(model, operation, tokens, duration, error = null) {
        if (error) {
            logger.error('AI Operation Error', {
                model,
                operation,
                tokens,
                duration: `${duration}ms`,
                error: error.message
            });
        } else {
            logger.info('AI Operation', {
                model,
                operation,
                tokens,
                duration: `${duration}ms`
            });
        }
    },

    // Security event logging
    security(event, details) {
        logger.warn('Security Event', {
            event,
            ...details,
            timestamp: new Date().toISOString()
        });
    },

    // System health logging
    health(component, status, metrics = {}) {
        logger.info('System Health', {
            component,
            status,
            ...metrics
        });
    }
};

// Export logger
module.exports = enhancedLogger;

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
});

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully');
    logger.end();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    logger.end();
    process.exit(0);
});