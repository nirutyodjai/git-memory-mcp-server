/**
 * NEXUS IDE Security Dashboard - Security Middleware
 * Enterprise-grade security middleware for request validation and protection
 */

const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const validator = require('validator');
const xss = require('xss');
const rateLimit = require('express-rate-limit');
const { SECURITY, SERVER } = require('../config/dashboard-config');
const logger = require('../utils/logger');
const { SecurityUtils } = require('../utils/security-utils');

/**
 * Security Middleware Manager
 */
class SecurityMiddleware {
    constructor() {
        this.suspiciousIPs = new Map();
        this.blockedIPs = new Set();
        this.requestPatterns = new Map();
        
        // Initialize security monitoring
        this.initializeMonitoring();
    }
    
    /**
     * Initialize security monitoring
     */
    initializeMonitoring() {
        // Clean up suspicious IPs every hour
        setInterval(() => {
            this.cleanupSuspiciousIPs();
        }, 60 * 60 * 1000);
        
        // Analyze request patterns every 5 minutes
        setInterval(() => {
            this.analyzeRequestPatterns();
        }, 5 * 60 * 1000);
    }
    
    /**
     * Helmet security headers configuration
     */
    getHelmetConfig() {
        return helmet({
            contentSecurityPolicy: {
                directives: SECURITY.csp.directives,
                reportOnly: false
            },
            crossOriginEmbedderPolicy: false,
            crossOriginOpenerPolicy: { policy: 'cross-origin' },
            crossOriginResourcePolicy: { policy: 'cross-origin' },
            dnsPrefetchControl: { allow: false },
            frameguard: { action: 'deny' },
            hidePoweredBy: true,
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            },
            ieNoOpen: true,
            noSniff: true,
            originAgentCluster: true,
            permittedCrossDomainPolicies: false,
            referrerPolicy: { policy: 'no-referrer' },
            xssFilter: true
        });
    }
    
    /**
     * CORS configuration
     */
    getCorsConfig() {
        return cors({
            origin: (origin, callback) => {
                // Allow requests with no origin (mobile apps, etc.)
                if (!origin) return callback(null, true);
                
                // Check if origin is allowed
                if (SERVER.cors.origin.includes(origin) || 
                    SERVER.cors.origin.includes('*')) {
                    return callback(null, true);
                }
                
                // Log suspicious origin
                logger.warn('CORS: Origin not allowed', { origin });
                callback(new Error('Not allowed by CORS'));
            },
            credentials: SERVER.cors.credentials,
            methods: SERVER.cors.methods,
            allowedHeaders: SERVER.cors.allowedHeaders,
            exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
            maxAge: 86400 // 24 hours
        });
    }
    
    /**
     * Compression middleware
     */
    getCompressionConfig() {
        return compression({
            filter: (req, res) => {
                // Don't compress if the request includes a cache-control no-transform directive
                if (req.headers['cache-control'] && 
                    req.headers['cache-control'].includes('no-transform')) {
                    return false;
                }
                
                // Use compression filter function
                return compression.filter(req, res);
            },
            level: 6,
            threshold: 1024,
            windowBits: 15,
            memLevel: 8
        });
    }
    
    /**
     * IP filtering middleware
     */
    ipFilter() {
        return (req, res, next) => {
            const clientIP = this.getClientIP(req);
            
            // Check if IP is blocked
            if (this.blockedIPs.has(clientIP)) {
                logger.warn('Blocked IP attempted access', { ip: clientIP });
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Your IP address has been blocked'
                });
            }
            
            // Check whitelist (if enabled)
            if (SECURITY.ipFilter.enabled && SECURITY.ipFilter.whitelist.length > 0) {
                if (!SECURITY.ipFilter.whitelist.includes(clientIP)) {
                    logger.warn('IP not in whitelist', { ip: clientIP });
                    return res.status(403).json({
                        error: 'Access denied',
                        message: 'Your IP address is not authorized'
                    });
                }
            }
            
            // Check blacklist
            if (SECURITY.ipFilter.blacklist.includes(clientIP)) {
                logger.warn('Blacklisted IP attempted access', { ip: clientIP });
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Your IP address has been blacklisted'
                });
            }
            
            next();
        };
    }
    
    /**
     * Request validation middleware
     */
    validateRequest() {
        return (req, res, next) => {
            try {
                // Validate and sanitize query parameters
                if (req.query) {
                    req.query = this.sanitizeObject(req.query);
                }
                
                // Validate and sanitize request body
                if (req.body) {
                    req.body = this.sanitizeObject(req.body);
                }
                
                // Validate headers
                this.validateHeaders(req);
                
                // Check for suspicious patterns
                this.checkSuspiciousPatterns(req);
                
                next();
            } catch (error) {
                logger.warn('Request validation failed', {
                    error: error.message,
                    ip: this.getClientIP(req),
                    path: req.path,
                    method: req.method
                });
                
                res.status(400).json({
                    error: 'Invalid request',
                    message: 'Request validation failed'
                });
            }
        };
    }
    
    /**
     * SQL injection protection
     */
    sqlInjectionProtection() {
        return (req, res, next) => {
            const sqlPatterns = [
                /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
                /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
                /(script|javascript|vbscript|onload|onerror|onclick)/i
            ];
            
            const checkForSQLInjection = (obj) => {
                for (const key in obj) {
                    if (typeof obj[key] === 'string') {
                        for (const pattern of sqlPatterns) {
                            if (pattern.test(obj[key])) {
                                throw new Error(`Potential SQL injection detected in ${key}`);
                            }
                        }
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        checkForSQLInjection(obj[key]);
                    }
                }
            };
            
            try {
                if (req.query) checkForSQLInjection(req.query);
                if (req.body) checkForSQLInjection(req.body);
                if (req.params) checkForSQLInjection(req.params);
                
                next();
            } catch (error) {
                logger.error('SQL injection attempt detected', {
                    error: error.message,
                    ip: this.getClientIP(req),
                    path: req.path,
                    method: req.method,
                    query: req.query,
                    body: req.body
                });
                
                // Block IP temporarily
                this.addSuspiciousActivity(this.getClientIP(req), 'sql_injection');
                
                res.status(400).json({
                    error: 'Invalid request',
                    message: 'Request contains invalid characters'
                });
            }
        };
    }
    
    /**
     * XSS protection
     */
    xssProtection() {
        return (req, res, next) => {
            const sanitizeValue = (value) => {
                if (typeof value === 'string') {
                    return xss(value, {
                        whiteList: {}, // No HTML tags allowed
                        stripIgnoreTag: true,
                        stripIgnoreTagBody: ['script']
                    });
                }
                return value;
            };
            
            const sanitizeObject = (obj) => {
                for (const key in obj) {
                    if (typeof obj[key] === 'string') {
                        obj[key] = sanitizeValue(obj[key]);
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        sanitizeObject(obj[key]);
                    }
                }
            };
            
            if (req.query) sanitizeObject(req.query);
            if (req.body) sanitizeObject(req.body);
            if (req.params) sanitizeObject(req.params);
            
            next();
        };
    }
    
    /**
     * Request size limiting
     */
    requestSizeLimit() {
        return (req, res, next) => {
            const maxSize = 10 * 1024 * 1024; // 10MB
            
            if (req.headers['content-length'] && 
                parseInt(req.headers['content-length']) > maxSize) {
                logger.warn('Request size limit exceeded', {
                    ip: this.getClientIP(req),
                    size: req.headers['content-length'],
                    maxSize
                });
                
                return res.status(413).json({
                    error: 'Request too large',
                    message: 'Request size exceeds maximum allowed limit'
                });
            }
            
            next();
        };
    }
    
    /**
     * Brute force protection
     */
    bruteForceProtection() {
        const attempts = new Map();
        
        return (req, res, next) => {
            const clientIP = this.getClientIP(req);
            const key = `${clientIP}:${req.path}`;
            
            const now = Date.now();
            const windowMs = 15 * 60 * 1000; // 15 minutes
            const maxAttempts = 10;
            
            // Clean old attempts
            const clientAttempts = attempts.get(key) || [];
            const recentAttempts = clientAttempts.filter(
                attempt => now - attempt < windowMs
            );
            
            if (recentAttempts.length >= maxAttempts) {
                logger.warn('Brute force attempt detected', {
                    ip: clientIP,
                    path: req.path,
                    attempts: recentAttempts.length
                });
                
                this.addSuspiciousActivity(clientIP, 'brute_force');
                
                return res.status(429).json({
                    error: 'Too many attempts',
                    message: 'Too many requests. Please try again later.',
                    retryAfter: Math.round(windowMs / 1000)
                });
            }
            
            // Record this attempt
            recentAttempts.push(now);
            attempts.set(key, recentAttempts);
            
            next();
        };
    }
    
    /**
     * Request logging middleware
     */
    requestLogger() {
        return (req, res, next) => {
            const startTime = Date.now();
            const clientIP = this.getClientIP(req);
            
            // Log request
            logger.info('Incoming request', {
                method: req.method,
                path: req.path,
                ip: clientIP,
                userAgent: req.get('User-Agent'),
                referer: req.get('Referer'),
                timestamp: new Date().toISOString()
            });
            
            // Override res.end to log response
            const originalEnd = res.end;
            res.end = function(chunk, encoding) {
                const duration = Date.now() - startTime;
                
                logger.info('Request completed', {
                    method: req.method,
                    path: req.path,
                    ip: clientIP,
                    statusCode: res.statusCode,
                    duration,
                    contentLength: res.get('Content-Length') || 0
                });
                
                originalEnd.call(this, chunk, encoding);
            };
            
            next();
        };
    }
    
    /**
     * Error handling middleware
     */
    errorHandler() {
        return (error, req, res, next) => {
            const clientIP = this.getClientIP(req);
            
            // Log error
            logger.error('Request error', {
                error: error.message,
                stack: error.stack,
                method: req.method,
                path: req.path,
                ip: clientIP,
                userAgent: req.get('User-Agent')
            });
            
            // Don't leak error details in production
            const isDevelopment = process.env.NODE_ENV === 'development';
            
            res.status(error.status || 500).json({
                error: 'Internal server error',
                message: isDevelopment ? error.message : 'An error occurred',
                ...(isDevelopment && { stack: error.stack })
            });
        };
    }
    
    /**
     * Get client IP address
     */
    getClientIP(req) {
        return req.ip ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               req.headers['x-forwarded-for']?.split(',')[0] ||
               req.headers['x-real-ip'] ||
               '127.0.0.1';
    }
    
    /**
     * Sanitize object recursively
     */
    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        
        const sanitized = Array.isArray(obj) ? [] : {};
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                
                if (typeof value === 'string') {
                    // Sanitize string values
                    sanitized[key] = validator.escape(value.trim());
                } else if (typeof value === 'object' && value !== null) {
                    // Recursively sanitize objects
                    sanitized[key] = this.sanitizeObject(value);
                } else {
                    sanitized[key] = value;
                }
            }
        }
        
        return sanitized;
    }
    
    /**
     * Validate request headers
     */
    validateHeaders(req) {
        const suspiciousHeaders = [
            'x-forwarded-host',
            'x-original-url',
            'x-rewrite-url'
        ];
        
        for (const header of suspiciousHeaders) {
            if (req.headers[header]) {
                logger.warn('Suspicious header detected', {
                    header,
                    value: req.headers[header],
                    ip: this.getClientIP(req)
                });
            }
        }
        
        // Validate User-Agent
        const userAgent = req.get('User-Agent');
        if (!userAgent || userAgent.length < 10 || userAgent.length > 500) {
            this.addSuspiciousActivity(this.getClientIP(req), 'invalid_user_agent');
        }
    }
    
    /**
     * Check for suspicious request patterns
     */
    checkSuspiciousPatterns(req) {
        const clientIP = this.getClientIP(req);
        const path = req.path.toLowerCase();
        
        // Check for common attack patterns
        const attackPatterns = [
            /\.\.\//,  // Directory traversal
            /\/etc\/passwd/,  // System file access
            /\/proc\//,  // Process information
            /\beval\(/,  // Code injection
            /\bexec\(/,  // Command execution
            /\bsystem\(/,  // System commands
            /<script/i,  // XSS attempts
            /javascript:/i,  // JavaScript injection
            /vbscript:/i,  // VBScript injection
            /onload=/i,  // Event handler injection
            /onerror=/i  // Error handler injection
        ];
        
        const fullUrl = req.originalUrl || req.url;
        
        for (const pattern of attackPatterns) {
            if (pattern.test(fullUrl) || pattern.test(JSON.stringify(req.body))) {
                logger.warn('Suspicious request pattern detected', {
                    pattern: pattern.toString(),
                    ip: clientIP,
                    path: req.path,
                    method: req.method,
                    userAgent: req.get('User-Agent')
                });
                
                this.addSuspiciousActivity(clientIP, 'suspicious_pattern');
                break;
            }
        }
    }
    
    /**
     * Add suspicious activity for an IP
     */
    addSuspiciousActivity(ip, type) {
        const activities = this.suspiciousIPs.get(ip) || [];
        activities.push({
            type,
            timestamp: Date.now()
        });
        
        this.suspiciousIPs.set(ip, activities);
        
        // Block IP if too many suspicious activities
        const recentActivities = activities.filter(
            activity => Date.now() - activity.timestamp < 60 * 60 * 1000 // 1 hour
        );
        
        if (recentActivities.length >= 5) {
            this.blockedIPs.add(ip);
            logger.error('IP blocked due to suspicious activity', {
                ip,
                activities: recentActivities
            });
            
            // Auto-unblock after 24 hours
            setTimeout(() => {
                this.blockedIPs.delete(ip);
                logger.info('IP automatically unblocked', { ip });
            }, 24 * 60 * 60 * 1000);
        }
    }
    
    /**
     * Clean up old suspicious IP records
     */
    cleanupSuspiciousIPs() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        for (const [ip, activities] of this.suspiciousIPs.entries()) {
            const recentActivities = activities.filter(
                activity => now - activity.timestamp < maxAge
            );
            
            if (recentActivities.length === 0) {
                this.suspiciousIPs.delete(ip);
            } else {
                this.suspiciousIPs.set(ip, recentActivities);
            }
        }
    }
    
    /**
     * Analyze request patterns for anomalies
     */
    analyzeRequestPatterns() {
        // This would typically involve more sophisticated analysis
        // For now, just log the current state
        logger.debug('Security analysis', {
            suspiciousIPs: this.suspiciousIPs.size,
            blockedIPs: this.blockedIPs.size,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Get security status
     */
    getSecurityStatus() {
        return {
            suspiciousIPs: this.suspiciousIPs.size,
            blockedIPs: this.blockedIPs.size,
            lastAnalysis: new Date().toISOString()
        };
    }
    
    /**
     * Manually block IP
     */
    blockIP(ip, reason = 'Manual block') {
        this.blockedIPs.add(ip);
        logger.warn('IP manually blocked', { ip, reason });
    }
    
    /**
     * Manually unblock IP
     */
    unblockIP(ip) {
        const wasBlocked = this.blockedIPs.delete(ip);
        if (wasBlocked) {
            this.suspiciousIPs.delete(ip);
            logger.info('IP manually unblocked', { ip });
        }
        return wasBlocked;
    }
    
    /**
     * Get blocked IPs list
     */
    getBlockedIPs() {
        return Array.from(this.blockedIPs);
    }
    
    /**
     * Get suspicious IPs list
     */
    getSuspiciousIPs() {
        const result = [];
        for (const [ip, activities] of this.suspiciousIPs.entries()) {
            result.push({
                ip,
                activities: activities.length,
                lastActivity: Math.max(...activities.map(a => a.timestamp)),
                types: [...new Set(activities.map(a => a.type))]
            });
        }
        return result;
    }
}

// Create singleton instance
const securityMiddleware = new SecurityMiddleware();

module.exports = {
    SecurityMiddleware,
    securityMiddleware
};