/**
 * Security Middleware
 * Enterprise-grade security middleware for comprehensive protection
 * รองรับการป้องกันแบบ multi-layer และ enterprise security standards
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const UserService = require('../services/userService');
const AuditService = require('../services/auditService');
const securityConfig = require('../config/security-config');

class SecurityMiddleware {
    constructor(options = {}) {
        this.options = {
            enableRateLimit: options.enableRateLimit !== false,
            enableHelmet: options.enableHelmet !== false,
            enableCors: options.enableCors !== false,
            enableJwtAuth: options.enableJwtAuth !== false,
            enableApiKeyAuth: options.enableApiKeyAuth !== false,
            enableAuditLogging: options.enableAuditLogging !== false,
            enableInputValidation: options.enableInputValidation !== false,
            enableCSRFProtection: options.enableCSRFProtection !== false,
            enableSessionSecurity: options.enableSessionSecurity !== false,
            ...options
        };
        
        this.userService = new UserService();
        this.auditService = new AuditService();
        this.securityConfig = securityConfig;
        
        // Initialize security components
        this.initializeSecurity();
    }
    
    /**
     * Initialize security components
     */
    initializeSecurity() {
        // Setup rate limiting
        this.setupRateLimiting();
        
        // Setup security headers
        this.setupSecurityHeaders();
        
        // Setup CORS
        this.setupCORS();
        
        // Setup CSRF protection
        this.setupCSRFProtection();
        
        console.log('✅ Security Middleware initialized successfully');
    }
    
    /**
     * Setup rate limiting
     */
    setupRateLimiting() {
        // General rate limiting
        this.generalRateLimit = rateLimit({
            windowMs: this.securityConfig.rateLimiting.general.windowMs,
            max: this.securityConfig.rateLimiting.general.max,
            message: {
                error: 'Too many requests',
                message: 'Rate limit exceeded. Please try again later.',
                retryAfter: Math.ceil(this.securityConfig.rateLimiting.general.windowMs / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res) => {
                this.auditService.logSecurityEvent({
                    type: 'RATE_LIMIT_EXCEEDED',
                    severity: 'medium',
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    endpoint: req.path,
                    method: req.method
                });
                
                res.status(429).json({
                    error: 'Too many requests',
                    message: 'Rate limit exceeded. Please try again later.',
                    retryAfter: Math.ceil(this.securityConfig.rateLimiting.general.windowMs / 1000)
                });
            }
        });
        
        // API rate limiting
        this.apiRateLimit = rateLimit({
            windowMs: this.securityConfig.rateLimiting.api.windowMs,
            max: this.securityConfig.rateLimiting.api.max,
            keyGenerator: (req) => {
                return req.user?.id || req.apiKey || req.ip;
            },
            message: {
                error: 'API rate limit exceeded',
                message: 'Too many API requests. Please upgrade your plan or try again later.'
            }
        });
        
        // Authentication rate limiting
        this.authRateLimit = rateLimit({
            windowMs: this.securityConfig.rateLimiting.auth.windowMs,
            max: this.securityConfig.rateLimiting.auth.max,
            skipSuccessfulRequests: true,
            message: {
                error: 'Authentication rate limit exceeded',
                message: 'Too many authentication attempts. Please try again later.'
            }
        });
    }
    
    /**
     * Setup security headers
     */
    setupSecurityHeaders() {
        this.helmetConfig = helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    connectSrc: ["'self'"],
                    frameSrc: ["'none'"],
                    objectSrc: ["'none'"],
                    upgradeInsecureRequests: []
                }
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            },
            noSniff: true,
            xssFilter: true,
            referrerPolicy: { policy: 'same-origin' },
            frameguard: { action: 'deny' }
        });
    }
    
    /**
     * Setup CORS
     */
    setupCORS() {
        this.corsConfig = cors({
            origin: (origin, callback) => {
                // Allow requests with no origin (mobile apps, etc.)
                if (!origin) return callback(null, true);
                
                // Check if origin is in allowed list
                if (this.securityConfig.cors.allowedOrigins.includes(origin) ||
                    this.securityConfig.cors.allowedOrigins.includes('*')) {
                    return callback(null, true);
                }
                
                // Check wildcard patterns
                const isAllowed = this.securityConfig.cors.allowedOrigins.some(allowedOrigin => {
                    if (allowedOrigin.includes('*')) {
                        const pattern = allowedOrigin.replace(/\*/g, '.*');
                        return new RegExp(`^${pattern}$`).test(origin);
                    }
                    return false;
                });
                
                if (isAllowed) {
                    return callback(null, true);
                }
                
                // Log unauthorized CORS attempt
                this.auditService.logSecurityEvent({
                    type: 'UNAUTHORIZED_CORS_ATTEMPT',
                    severity: 'medium',
                    origin,
                    timestamp: new Date()
                });
                
                callback(new Error('Not allowed by CORS'));
            },
            credentials: this.securityConfig.cors.credentials,
            methods: this.securityConfig.cors.methods,
            allowedHeaders: this.securityConfig.cors.allowedHeaders,
            exposedHeaders: this.securityConfig.cors.exposedHeaders,
            maxAge: this.securityConfig.cors.maxAge
        });
    }
    
    /**
     * Setup CSRF protection
     */
    setupCSRFProtection() {
        this.csrfProtection = (req, res, next) => {
            if (!this.options.enableCSRFProtection) {
                return next();
            }
            
            // Skip CSRF for API requests with valid API key
            if (req.headers['x-api-key'] && this.isValidApiKey(req.headers['x-api-key'])) {
                return next();
            }
            
            // Skip CSRF for safe methods
            if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
                return next();
            }
            
            const token = req.headers['x-csrf-token'] || req.body._csrf;
            const sessionToken = req.session?.csrfToken;
            
            if (!token || !sessionToken || token !== sessionToken) {
                this.auditService.logSecurityEvent({
                    type: 'CSRF_TOKEN_MISMATCH',
                    severity: 'high',
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    endpoint: req.path,
                    method: req.method
                });
                
                return res.status(403).json({
                    error: 'CSRF token mismatch',
                    message: 'Invalid or missing CSRF token'
                });
            }
            
            next();
        };
    }
    
    /**
     * JWT Authentication middleware
     */
    authenticateJWT() {
        return async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).json({
                        error: 'Authentication required',
                        message: 'Missing or invalid authorization header'
                    });
                }
                
                const token = authHeader.substring(7);
                
                // Verify JWT token
                const decoded = jwt.verify(token, this.securityConfig.jwt.secret);
                
                // Check if token is blacklisted
                if (await this.isTokenBlacklisted(token)) {
                    return res.status(401).json({
                        error: 'Token revoked',
                        message: 'This token has been revoked'
                    });
                }
                
                // Get user information
                const user = await this.userService.getUserById(decoded.userId);
                if (!user) {
                    return res.status(401).json({
                        error: 'User not found',
                        message: 'Invalid token: user does not exist'
                    });
                }
                
                // Check if user is active
                if (!user.isActive) {
                    return res.status(401).json({
                        error: 'Account disabled',
                        message: 'Your account has been disabled'
                    });
                }
                
                // Attach user to request
                req.user = user;
                req.token = token;
                
                // Log successful authentication
                this.auditService.logEvent({
                    type: 'USER_AUTHENTICATED',
                    userId: user.id,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    endpoint: req.path,
                    method: req.method
                });
                
                next();
                
            } catch (error) {
                this.auditService.logSecurityEvent({
                    type: 'JWT_AUTHENTICATION_FAILED',
                    severity: 'medium',
                    error: error.message,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    endpoint: req.path,
                    method: req.method
                });
                
                return res.status(401).json({
                    error: 'Authentication failed',
                    message: 'Invalid or expired token'
                });
            }
        };
    }
    
    /**
     * API Key Authentication middleware
     */
    authenticateApiKey() {
        return async (req, res, next) => {
            try {
                const apiKey = req.headers['x-api-key'];
                
                if (!apiKey) {
                    return res.status(401).json({
                        error: 'API key required',
                        message: 'Missing X-API-Key header'
                    });
                }
                
                // Validate API key
                const keyInfo = await this.validateApiKey(apiKey);
                if (!keyInfo) {
                    return res.status(401).json({
                        error: 'Invalid API key',
                        message: 'The provided API key is invalid or expired'
                    });
                }
                
                // Check rate limits for this API key
                if (keyInfo.rateLimitExceeded) {
                    return res.status(429).json({
                        error: 'Rate limit exceeded',
                        message: 'API key rate limit exceeded'
                    });
                }
                
                // Attach API key info to request
                req.apiKey = apiKey;
                req.apiKeyInfo = keyInfo;
                
                // Log API key usage
                this.auditService.logEvent({
                    type: 'API_KEY_USED',
                    apiKeyId: keyInfo.id,
                    userId: keyInfo.userId,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    endpoint: req.path,
                    method: req.method
                });
                
                next();
                
            } catch (error) {
                this.auditService.logSecurityEvent({
                    type: 'API_KEY_AUTHENTICATION_FAILED',
                    severity: 'medium',
                    error: error.message,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    endpoint: req.path,
                    method: req.method
                });
                
                return res.status(401).json({
                    error: 'Authentication failed',
                    message: 'Invalid API key'
                });
            }
        };
    }
    
    /**
     * Role-based authorization middleware
     */
    authorize(requiredRoles = []) {
        return (req, res, next) => {
            try {
                const user = req.user;
                
                if (!user) {
                    return res.status(401).json({
                        error: 'Authentication required',
                        message: 'Please authenticate first'
                    });
                }
                
                // Check if user has required roles
                const hasRequiredRole = requiredRoles.length === 0 || 
                    requiredRoles.some(role => user.roles.includes(role));
                
                if (!hasRequiredRole) {
                    this.auditService.logSecurityEvent({
                        type: 'AUTHORIZATION_FAILED',
                        severity: 'medium',
                        userId: user.id,
                        requiredRoles,
                        userRoles: user.roles,
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        endpoint: req.path,
                        method: req.method
                    });
                    
                    return res.status(403).json({
                        error: 'Insufficient permissions',
                        message: 'You do not have permission to access this resource'
                    });
                }
                
                next();
                
            } catch (error) {
                console.error('Authorization error:', error);
                return res.status(500).json({
                    error: 'Authorization error',
                    message: 'An error occurred during authorization'
                });
            }
        };
    }
    
    /**
     * Permission-based authorization middleware
     */
    requirePermission(permission) {
        return async (req, res, next) => {
            try {
                const user = req.user;
                
                if (!user) {
                    return res.status(401).json({
                        error: 'Authentication required',
                        message: 'Please authenticate first'
                    });
                }
                
                // Check if user has required permission
                const hasPermission = await this.userService.hasPermission(user.id, permission);
                
                if (!hasPermission) {
                    this.auditService.logSecurityEvent({
                        type: 'PERMISSION_DENIED',
                        severity: 'medium',
                        userId: user.id,
                        permission,
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        endpoint: req.path,
                        method: req.method
                    });
                    
                    return res.status(403).json({
                        error: 'Permission denied',
                        message: `You do not have the '${permission}' permission`
                    });
                }
                
                next();
                
            } catch (error) {
                console.error('Permission check error:', error);
                return res.status(500).json({
                    error: 'Permission check error',
                    message: 'An error occurred during permission check'
                });
            }
        };
    }
    
    /**
     * Multi-tenant authorization middleware
     */
    requireTenant() {
        return (req, res, next) => {
            try {
                const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
                
                if (!tenantId) {
                    return res.status(400).json({
                        error: 'Tenant required',
                        message: 'Tenant ID is required for this operation'
                    });
                }
                
                // Validate tenant access
                if (req.user && req.user.tenantId !== tenantId) {
                    this.auditService.logSecurityEvent({
                        type: 'UNAUTHORIZED_TENANT_ACCESS',
                        severity: 'high',
                        userId: req.user.id,
                        userTenantId: req.user.tenantId,
                        requestedTenantId: tenantId,
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        endpoint: req.path,
                        method: req.method
                    });
                    
                    return res.status(403).json({
                        error: 'Unauthorized tenant access',
                        message: 'You do not have access to this tenant'
                    });
                }
                
                req.tenantId = tenantId;
                next();
                
            } catch (error) {
                console.error('Tenant authorization error:', error);
                return res.status(500).json({
                    error: 'Tenant authorization error',
                    message: 'An error occurred during tenant authorization'
                });
            }
        };
    }
    
    /**
     * Input validation middleware
     */
    validateInput(validationRules) {
        return [
            ...validationRules,
            (req, res, next) => {
                const errors = validationResult(req);
                
                if (!errors.isEmpty()) {
                    this.auditService.logSecurityEvent({
                        type: 'INPUT_VALIDATION_FAILED',
                        severity: 'low',
                        errors: errors.array(),
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        endpoint: req.path,
                        method: req.method,
                        body: this.sanitizeLogData(req.body)
                    });
                    
                    return res.status(400).json({
                        error: 'Validation failed',
                        message: 'Invalid input data',
                        details: errors.array()
                    });
                }
                
                next();
            }
        ];
    }
    
    /**
     * Security headers middleware
     */
    securityHeaders() {
        return (req, res, next) => {
            // Add custom security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
            
            // Remove server information
            res.removeHeader('X-Powered-By');
            res.removeHeader('Server');
            
            next();
        };
    }
    
    /**
     * Request sanitization middleware
     */
    sanitizeRequest() {
        return (req, res, next) => {
            // Sanitize request body
            if (req.body) {
                req.body = this.sanitizeObject(req.body);
            }
            
            // Sanitize query parameters
            if (req.query) {
                req.query = this.sanitizeObject(req.query);
            }
            
            // Sanitize URL parameters
            if (req.params) {
                req.params = this.sanitizeObject(req.params);
            }
            
            next();
        };
    }
    
    /**
     * Audit logging middleware
     */
    auditLogger() {
        return (req, res, next) => {
            if (!this.options.enableAuditLogging) {
                return next();
            }
            
            const startTime = Date.now();
            
            // Log request
            this.auditService.logEvent({
                type: 'HTTP_REQUEST',
                method: req.method,
                url: req.url,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                userId: req.user?.id,
                tenantId: req.tenantId,
                timestamp: new Date()
            });
            
            // Override res.end to log response
            const originalEnd = res.end;
            res.end = function(chunk, encoding) {
                const responseTime = Date.now() - startTime;
                
                // Log response
                this.auditService.logEvent({
                    type: 'HTTP_RESPONSE',
                    method: req.method,
                    url: req.url,
                    statusCode: res.statusCode,
                    responseTime,
                    ip: req.ip,
                    userId: req.user?.id,
                    tenantId: req.tenantId,
                    timestamp: new Date()
                });
                
                originalEnd.call(this, chunk, encoding);
            }.bind(this);
            
            next();
        };
    }
    
    /**
     * Validate API key
     */
    async validateApiKey(apiKey) {
        try {
            // Hash the API key for lookup
            const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
            
            // In a real implementation, this would query a database
            // For now, we'll use a simple validation
            const validKeys = this.securityConfig.apiKeys || [];
            const keyInfo = validKeys.find(key => key.hash === hashedKey);
            
            if (!keyInfo) {
                return null;
            }
            
            // Check if key is expired
            if (keyInfo.expiresAt && new Date() > new Date(keyInfo.expiresAt)) {
                return null;
            }
            
            // Check if key is active
            if (!keyInfo.isActive) {
                return null;
            }
            
            return keyInfo;
            
        } catch (error) {
            console.error('API key validation error:', error);
            return null;
        }
    }
    
    /**
     * Check if API key is valid (simple check)
     */
    isValidApiKey(apiKey) {
        return apiKey && apiKey.length >= 32; // Simple validation
    }
    
    /**
     * Check if JWT token is blacklisted
     */
    async isTokenBlacklisted(token) {
        // In a real implementation, this would check a blacklist in database/cache
        // For now, return false (no blacklisting)
        return false;
    }
    
    /**
     * Sanitize object recursively
     */
    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return this.sanitizeString(obj);
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            const sanitizedKey = this.sanitizeString(key);
            sanitized[sanitizedKey] = this.sanitizeObject(value);
        }
        
        return sanitized;
    }
    
    /**
     * Sanitize string
     */
    sanitizeString(str) {
        if (typeof str !== 'string') {
            return str;
        }
        
        // Remove potentially dangerous characters
        return str
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim();
    }
    
    /**
     * Sanitize data for logging (remove sensitive information)
     */
    sanitizeLogData(data) {
        if (!data || typeof data !== 'object') {
            return data;
        }
        
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
        const sanitized = { ...data };
        
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }
        
        return sanitized;
    }
    
    /**
     * Generate CSRF token
     */
    generateCSRFToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    /**
     * Get all middleware stack
     */
    getMiddlewareStack() {
        const middleware = [];
        
        // Security headers
        if (this.options.enableHelmet) {
            middleware.push(this.helmetConfig);
        }
        middleware.push(this.securityHeaders());
        
        // CORS
        if (this.options.enableCors) {
            middleware.push(this.corsConfig);
        }
        
        // Rate limiting
        if (this.options.enableRateLimit) {
            middleware.push(this.generalRateLimit);
        }
        
        // Request sanitization
        if (this.options.enableInputValidation) {
            middleware.push(this.sanitizeRequest());
        }
        
        // Audit logging
        if (this.options.enableAuditLogging) {
            middleware.push(this.auditLogger());
        }
        
        return middleware;
    }
    
    /**
     * Get authentication middleware
     */
    getAuthMiddleware(type = 'jwt') {
        switch (type) {
            case 'jwt':
                return this.authenticateJWT();
            case 'apikey':
                return this.authenticateApiKey();
            case 'both':
                return (req, res, next) => {
                    // Try JWT first, then API key
                    const authHeader = req.headers.authorization;
                    const apiKey = req.headers['x-api-key'];
                    
                    if (authHeader && authHeader.startsWith('Bearer ')) {
                        return this.authenticateJWT()(req, res, next);
                    } else if (apiKey) {
                        return this.authenticateApiKey()(req, res, next);
                    } else {
                        return res.status(401).json({
                            error: 'Authentication required',
                            message: 'Please provide either JWT token or API key'
                        });
                    }
                };
            default:
                throw new Error(`Unknown authentication type: ${type}`);
        }
    }
    
    /**
     * Get rate limiting middleware
     */
    getRateLimitMiddleware(type = 'general') {
        switch (type) {
            case 'general':
                return this.generalRateLimit;
            case 'api':
                return this.apiRateLimit;
            case 'auth':
                return this.authRateLimit;
            default:
                return this.generalRateLimit;
        }
    }
}

module.exports = SecurityMiddleware;