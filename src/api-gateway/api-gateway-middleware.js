/**
 * Git Memory MCP Server - API Gateway Middleware Manager
 * ระบบจัดการ middleware สำหรับ API Gateway
 * 
 * Features:
 * - Authentication middleware
 * - Authorization middleware
 * - Rate limiting middleware
 * - Request/Response transformation
 * - Logging middleware
 * - Error handling middleware
 * - CORS middleware
 * - Compression middleware
 * - Security middleware
 * - Custom middleware support
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const EventEmitter = require('events');

class APIGatewayMiddleware extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = config;
        this.middlewares = new Map();
        this.rateLimiters = new Map();
        this.customMiddlewares = new Map();
        
        // Middleware execution order
        this.executionOrder = [
            'security',
            'cors',
            'compression',
            'logging',
            'rateLimit',
            'authentication',
            'authorization',
            'requestTransform',
            'custom',
            'responseTransform',
            'errorHandler'
        ];
        
        this.init();
    }
    
    /**
     * Initialize middleware manager
     */
    init() {
        console.log('🔧 Initializing API Gateway Middleware...');
        
        // Create built-in middlewares
        this.createSecurityMiddleware();
        this.createCorsMiddleware();
        this.createCompressionMiddleware();
        this.createLoggingMiddleware();
        this.createRateLimitMiddleware();
        this.createAuthenticationMiddleware();
        this.createAuthorizationMiddleware();
        this.createRequestTransformMiddleware();
        this.createResponseTransformMiddleware();
        this.createErrorHandlerMiddleware();
        
        console.log('✅ API Gateway Middleware initialized');
        this.emit('initialized');
    }
    
    /**
     * Create security middleware
     */
    createSecurityMiddleware() {
        const securityConfig = this.config.security || {};
        
        if (!securityConfig.helmet?.enabled) {
            this.middlewares.set('security', (req, res, next) => next());
            return;
        }
        
        const helmetOptions = {
            contentSecurityPolicy: securityConfig.helmet.contentSecurityPolicy,
            hsts: securityConfig.helmet.hsts,
            noSniff: securityConfig.helmet.noSniff,
            xssFilter: securityConfig.helmet.xssFilter
        };
        
        this.middlewares.set('security', helmet(helmetOptions));
        console.log('🛡️ Security middleware created');
    }
    
    /**
     * Create CORS middleware
     */
    createCorsMiddleware() {
        const corsConfig = this.config.cors || {};
        
        if (!corsConfig.enabled) {
            this.middlewares.set('cors', (req, res, next) => next());
            return;
        }
        
        const corsOptions = {
            origin: corsConfig.origin,
            methods: corsConfig.methods,
            allowedHeaders: corsConfig.allowedHeaders,
            exposedHeaders: corsConfig.exposedHeaders,
            credentials: corsConfig.credentials,
            maxAge: corsConfig.maxAge
        };
        
        this.middlewares.set('cors', cors(corsOptions));
        console.log('🌐 CORS middleware created');
    }
    
    /**
     * Create compression middleware
     */
    createCompressionMiddleware() {
        const compressionConfig = this.config.compression || {};
        
        if (!compressionConfig.enabled) {
            this.middlewares.set('compression', (req, res, next) => next());
            return;
        }
        
        const compressionOptions = {
            threshold: compressionConfig.threshold,
            level: compressionConfig.level,
            chunkSize: compressionConfig.chunkSize,
            windowBits: compressionConfig.windowBits,
            memLevel: compressionConfig.memLevel,
            filter: (req, res) => {
                // Don't compress responses if this request has a 'x-no-compression' header
                if (req.headers['x-no-compression']) {
                    return false;
                }
                
                // Fallback to standard filter function
                return compression.filter(req, res);
            }
        };
        
        this.middlewares.set('compression', compression(compressionOptions));
        console.log('🗜️ Compression middleware created');
    }
    
    /**
     * Create logging middleware
     */
    createLoggingMiddleware() {
        const loggingConfig = this.config.logging || {};
        
        if (!loggingConfig.requestLogging) {
            this.middlewares.set('logging', (req, res, next) => next());
            return;
        }
        
        const loggingMiddleware = (req, res, next) => {
            const startTime = Date.now();
            const requestId = crypto.randomUUID();
            
            // Add request ID to request object
            req.requestId = requestId;
            
            // Log request
            console.log(`📥 [${requestId}] ${req.method} ${req.url} - ${req.ip}`);
            
            // Override res.end to log response
            const originalEnd = res.end;
            res.end = function(chunk, encoding) {
                const duration = Date.now() - startTime;
                console.log(`📤 [${requestId}] ${res.statusCode} - ${duration}ms`);
                
                originalEnd.call(this, chunk, encoding);
            };
            
            next();
        };
        
        this.middlewares.set('logging', loggingMiddleware);
        console.log('📝 Logging middleware created');
    }
    
    /**
     * Create rate limiting middleware
     */
    createRateLimitMiddleware() {
        const rateLimitConfig = this.config.rateLimit || {};
        
        if (!rateLimitConfig.enabled) {
            this.middlewares.set('rateLimit', (req, res, next) => next());
            return;
        }
        
        // Create different rate limiters for different scenarios
        const globalLimiter = rateLimit({
            windowMs: rateLimitConfig.windowMs,
            max: rateLimitConfig.max,
            skipSuccessfulRequests: rateLimitConfig.skipSuccessfulRequests,
            skipFailedRequests: rateLimitConfig.skipFailedRequests,
            keyGenerator: this.createKeyGenerator(rateLimitConfig.keyGenerator),
            message: {
                error: rateLimitConfig.message.error,
                retryAfter: rateLimitConfig.message.retryAfter
            },
            standardHeaders: true,
            legacyHeaders: false
        });
        
        // Store rate limiters
        this.rateLimiters.set('global', globalLimiter);
        
        // Create API-specific rate limiters
        const apiLimiter = rateLimit({
            windowMs: 60000, // 1 minute
            max: 100, // Limit each IP to 100 requests per windowMs
            keyGenerator: (req) => `api:${req.ip}`,
            message: {
                error: 'Too many API requests',
                retryAfter: 60
            }
        });
        
        this.rateLimiters.set('api', apiLimiter);
        
        // Main rate limit middleware
        const rateLimitMiddleware = (req, res, next) => {
            // Apply global rate limiting
            globalLimiter(req, res, (err) => {
                if (err) return next(err);
                
                // Apply API-specific rate limiting for API routes
                if (req.path.startsWith('/api/')) {
                    apiLimiter(req, res, next);
                } else {
                    next();
                }
            });
        };
        
        this.middlewares.set('rateLimit', rateLimitMiddleware);
        console.log('⏱️ Rate limiting middleware created');
    }
    
    /**
     * Create key generator for rate limiting
     */
    createKeyGenerator(type) {
        switch (type) {
            case 'ip':
                return (req) => req.ip;
            case 'user':
                return (req) => req.user?.id || req.ip;
            case 'custom':
                return (req) => {
                    // Custom logic based on headers or other factors
                    const apiKey = req.headers['x-api-key'];
                    const userId = req.user?.id;
                    return apiKey || userId || req.ip;
                };
            default:
                return (req) => req.ip;
        }
    }
    
    /**
     * Create authentication middleware
     */
    createAuthenticationMiddleware() {
        const authConfig = this.config.auth || {};
        
        if (!authConfig.enabled) {
            this.middlewares.set('authentication', (req, res, next) => next());
            return;
        }
        
        const authMiddleware = (req, res, next) => {
            // Skip authentication for health checks and public routes
            const publicRoutes = ['/health', '/status', '/metrics', '/favicon.ico'];
            if (Array.isArray(publicRoutes) && publicRoutes.includes(req.path)) {
                return next();
            }
            
            const token = this.extractToken(req);
            
            if (!token) {
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'No token provided'
                });
            }
            
            try {
                const decoded = jwt.verify(token, authConfig.jwtSecret, {
                    issuer: authConfig.issuer,
                    audience: authConfig.audience,
                    algorithms: authConfig.algorithms
                });
                
                req.user = decoded;
                next();
                
            } catch (error) {
                return res.status(401).json({
                    error: 'Authentication failed',
                    message: error.message
                });
            }
        };
        
        this.middlewares.set('authentication', authMiddleware);
        console.log('🔐 Authentication middleware created');
    }
    
    /**
     * Extract token from request
     */
    extractToken(req) {
        // Check Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        
        // Check query parameter
        if (req.query.token) {
            return req.query.token;
        }
        
        // Check cookie
        if (req.cookies && req.cookies.token) {
            return req.cookies.token;
        }
        
        return null;
    }
    
    /**
     * Create authorization middleware
     */
    createAuthorizationMiddleware() {
        const authzConfig = this.config.authorization || {};
        
        if (!authzConfig.enabled) {
            this.middlewares.set('authorization', (req, res, next) => next());
            return;
        }
        
        const authzMiddleware = (req, res, next) => {
            // Skip authorization if no user (authentication should handle this)
            if (!req.user) {
                return next();
            }
            
            const userRole = req.user.role || authzConfig.defaultRole;
            const requiredPermission = this.getRequiredPermission(req);
            
            if (!requiredPermission) {
                return next();
            }
            
            if (this.hasPermission(userRole, requiredPermission, authzConfig)) {
                next();
            } else {
                res.status(403).json({
                    error: 'Authorization failed',
                    message: `Insufficient permissions. Required: ${requiredPermission}`
                });
            }
        };
        
        this.middlewares.set('authorization', authzMiddleware);
        console.log('🔒 Authorization middleware created');
    }
    
    /**
     * Get required permission for request
     */
    getRequiredPermission(req) {
        const method = req.method.toLowerCase();
        const path = req.path;
        
        // Define permission mapping
        const permissionMap = {
            'get': 'read',
            'post': 'write',
            'put': 'write',
            'patch': 'write',
            'delete': 'delete'
        };
        
        // Admin routes require admin permission
        if (path.startsWith('/admin/')) {
            return 'admin';
        }
        
        // API routes require API permission
        if (path.startsWith('/api/')) {
            return permissionMap[method] || 'read';
        }
        
        return null; // No permission required
    }
    
    /**
     * Check if user has permission
     */
    hasPermission(userRole, requiredPermission, authzConfig) {
        // Role-based access control (RBAC)
        const rolePermissions = {
            'admin': ['read', 'write', 'delete', 'admin'],
            'user': ['read', 'write'],
            'guest': ['read']
        };
        
        const permissions = rolePermissions[userRole] || [];
        return Array.isArray(permissions) && permissions.includes(requiredPermission);
    }
    
    /**
     * Create request transformation middleware
     */
    createRequestTransformMiddleware() {
        const requestTransformMiddleware = (req, res, next) => {
            // Add request timestamp
            req.timestamp = new Date().toISOString();
            
            // Add request metadata
            req.metadata = {
                userAgent: req.headers['user-agent'],
                referer: req.headers.referer,
                acceptLanguage: req.headers['accept-language'],
                acceptEncoding: req.headers['accept-encoding']
            };
            
            // Transform request body if needed
            if (req.body && typeof req.body === 'object') {
                // Add request ID to body
                req.body._requestId = req.requestId;
                
                // Sanitize input
                this.sanitizeObject(req.body);
            }
            
            next();
        };
        
        this.middlewares.set('requestTransform', requestTransformMiddleware);
        console.log('🔄 Request transformation middleware created');
    }
    
    /**
     * Create response transformation middleware
     */
    createResponseTransformMiddleware() {
        const responseTransformMiddleware = (req, res, next) => {
            // Override res.json to add metadata
            const originalJson = res.json;
            res.json = function(data) {
                const responseData = {
                    success: res.statusCode < 400,
                    data: data,
                    metadata: {
                        requestId: req.requestId,
                        timestamp: new Date().toISOString(),
                        version: '1.0.0'
                    }
                };
                
                return originalJson.call(this, responseData);
            };
            
            next();
        };
        
        this.middlewares.set('responseTransform', responseTransformMiddleware);
        console.log('🔄 Response transformation middleware created');
    }
    
    /**
     * Create error handler middleware
     */
    createErrorHandlerMiddleware() {
        const errorHandlerMiddleware = (err, req, res, next) => {
            console.error(`❌ [${req.requestId}] Error:`, err);
            
            // Default error response
            let statusCode = 500;
            let message = 'Internal Server Error';
            let details = null;
            
            // Handle specific error types
            if (err.name === 'ValidationError') {
                statusCode = 400;
                message = 'Validation Error';
                details = err.details;
            } else if (err.name === 'UnauthorizedError') {
                statusCode = 401;
                message = 'Unauthorized';
            } else if (err.name === 'ForbiddenError') {
                statusCode = 403;
                message = 'Forbidden';
            } else if (err.name === 'NotFoundError') {
                statusCode = 404;
                message = 'Not Found';
            } else if (err.statusCode) {
                statusCode = err.statusCode;
                message = err.message;
            }
            
            const errorResponse = {
                success: false,
                error: {
                    code: statusCode,
                    message: message,
                    details: details,
                    requestId: req.requestId,
                    timestamp: new Date().toISOString()
                }
            };
            
            // Add stack trace in development
            if (process.env.NODE_ENV === 'development') {
                errorResponse.error.stack = err.stack;
            }
            
            res.status(statusCode).json(errorResponse);
        };
        
        this.middlewares.set('errorHandler', errorHandlerMiddleware);
        console.log('🚨 Error handler middleware created');
    }
    
    /**
     * Sanitize object to prevent XSS and injection attacks
     */
    sanitizeObject(obj) {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                // Basic XSS prevention
                obj[key] = obj[key]
                    .replace(/<script[^>]*>.*?<\/script>/gi, '')
                    .replace(/<[^>]+>/g, '')
                    .trim();
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                this.sanitizeObject(obj[key]);
            }
        }
    }
    
    /**
     * Add custom middleware
     */
    addCustomMiddleware(name, middleware, position = 'custom') {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function');
        }
        
        this.customMiddlewares.set(name, {
            middleware,
            position
        });
        
        console.log(`🔧 Added custom middleware: ${name}`);
        this.emit('middlewareAdded', { name, position });
    }
    
    /**
     * Remove custom middleware
     */
    removeCustomMiddleware(name) {
        if (this.customMiddlewares.has(name)) {
            this.customMiddlewares.delete(name);
            console.log(`🗑️ Removed custom middleware: ${name}`);
            this.emit('middlewareRemoved', { name });
        }
    }
    
    /**
     * Get middleware by name
     */
    getMiddleware(name) {
        if (this.middlewares.has(name)) {
            return this.middlewares.get(name);
        }
        
        const custom = this.customMiddlewares.get(name);
        return custom ? custom.middleware : null;
    }
    
    /**
     * Get all middlewares in execution order
     */
    getAllMiddlewares() {
        const middlewares = [];
        
        for (const position of this.executionOrder) {
            // Add built-in middleware
            if (this.middlewares.has(position)) {
                middlewares.push({
                    name: position,
                    middleware: this.middlewares.get(position),
                    type: 'builtin'
                });
            }
            
            // Add custom middlewares for this position
            for (const [name, config] of this.customMiddlewares) {
                if (config.position === position) {
                    middlewares.push({
                        name,
                        middleware: config.middleware,
                        type: 'custom'
                    });
                }
            }
        }
        
        return middlewares;
    }
    
    /**
     * Apply middlewares to Express app
     */
    applyToApp(app) {
        console.log('🔧 Applying middlewares to Express app...');
        
        const middlewares = this.getAllMiddlewares();
        
        for (const { name, middleware, type } of middlewares) {
            if (name === 'errorHandler') {
                // Error handler must be last
                continue;
            }
            
            app.use(middleware);
            console.log(`✅ Applied ${type} middleware: ${name}`);
        }
        
        // Apply error handler last
        const errorHandler = this.middlewares.get('errorHandler');
        if (errorHandler) {
            app.use(errorHandler);
            console.log('✅ Applied error handler middleware');
        }
        
        console.log('✅ All middlewares applied successfully');
    }
    
    /**
     * Update middleware configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Recreate middlewares with new configuration
        this.init();
        
        console.log('🔄 Middleware configuration updated');
        this.emit('configUpdated', newConfig);
    }
    
    /**
     * Get middleware statistics
     */
    getStats() {
        return {
            builtinMiddlewares: this.middlewares.size,
            customMiddlewares: this.customMiddlewares.size,
            rateLimiters: this.rateLimiters.size,
            executionOrder: this.executionOrder,
            middlewareList: {
                builtin: Array.from(this.middlewares.keys()),
                custom: Array.from(this.customMiddlewares.keys())
            }
        };
    }
    
    /**
     * Enable/disable middleware
     */
    toggleMiddleware(name, enabled) {
        const middleware = this.middlewares.get(name);
        
        if (middleware) {
            if (enabled) {
                // Re-enable middleware (recreate it)
                this.init();
            } else {
                // Disable middleware (replace with no-op)
                this.middlewares.set(name, (req, res, next) => next());
            }
            
            console.log(`🔧 ${enabled ? 'Enabled' : 'Disabled'} middleware: ${name}`);
            this.emit('middlewareToggled', { name, enabled });
        }
    }
    
    /**
     * Stop middleware manager
     */
    async stop() {
        console.log('🛑 Stopping middleware manager...');
        
        // Clear all middlewares
        this.middlewares.clear();
        this.customMiddlewares.clear();
        this.rateLimiters.clear();
        
        console.log('✅ Middleware manager stopped');
        this.emit('stopped');
    }
}

// Export class
module.exports = APIGatewayMiddleware;

// CLI interface
if (require.main === module) {
    const middlewareManager = new APIGatewayMiddleware({
        auth: {
            enabled: true,
            jwtSecret: 'test-secret'
        },
        rateLimit: {
            enabled: true,
            max: 100
        }
    });
    
    // Event listeners
    middlewareManager.on('initialized', () => {
        console.log('🎉 Middleware manager initialized');
        console.log('📊 Stats:', middlewareManager.getStats());
    });
    
    middlewareManager.on('middlewareAdded', ({ name, position }) => {
        console.log(`➕ Custom middleware added: ${name} at ${position}`);
    });
    
    middlewareManager.on('middlewareRemoved', ({ name }) => {
        console.log(`➖ Custom middleware removed: ${name}`);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down...');
        await middlewareManager.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down...');
        await middlewareManager.stop();
        process.exit(0);
    });
}