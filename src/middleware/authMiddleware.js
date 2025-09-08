/**
 * Authentication Middleware
 * Enterprise-grade authentication and authorization system
 * รองรับ JWT, API Keys, และ Multi-tenant architecture
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');

class AuthMiddleware {
    constructor(options = {}) {
        this.jwtSecret = options.jwtSecret || process.env.JWT_SECRET || this.generateSecret();
        this.apiKeySecret = options.apiKeySecret || process.env.API_KEY_SECRET || this.generateSecret();
        this.tokenExpiry = options.tokenExpiry || '24h';
        this.refreshTokenExpiry = options.refreshTokenExpiry || '7d';
        this.enableMultiTenant = options.enableMultiTenant || true;
        this.enableRateLimit = options.enableRateLimit || true;
        
        // Security configurations
        this.securityConfig = {
            maxLoginAttempts: 5,
            lockoutDuration: 15 * 60 * 1000, // 15 minutes
            passwordMinLength: 8,
            requireSpecialChars: true,
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            enableTwoFactor: false
        };
        
        // Rate limiting configurations
        this.rateLimitConfig = {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false
        };
        
        this.setupRateLimit();
        this.setupSecurity();
    }
    
    /**
     * Generate secure random secret
     */
    generateSecret() {
        return crypto.randomBytes(64).toString('hex');
    }
    
    /**
     * Setup rate limiting
     */
    setupRateLimit() {
        if (this.enableRateLimit) {
            this.rateLimiter = rateLimit(this.rateLimitConfig);
            
            // Strict rate limit for auth endpoints
            this.authRateLimiter = rateLimit({
                windowMs: 15 * 60 * 1000,
                max: 5, // 5 attempts per 15 minutes
                message: 'Too many authentication attempts, please try again later.',
                standardHeaders: true,
                legacyHeaders: false
            });
        }
    }
    
    /**
     * Setup security middleware
     */
    setupSecurity() {
        this.securityMiddleware = helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"]
                }
            },
            crossOriginEmbedderPolicy: false,
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        });
    }
    
    /**
     * Hash password with bcrypt
     */
    async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }
    
    /**
     * Verify password
     */
    async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
    
    /**
     * Generate JWT token
     */
    generateToken(payload, options = {}) {
        const tokenOptions = {
            expiresIn: options.expiresIn || this.tokenExpiry,
            issuer: options.issuer || 'nexus-ide',
            audience: options.audience || 'nexus-users'
        };
        
        return jwt.sign(payload, this.jwtSecret, tokenOptions);
    }
    
    /**
     * Generate refresh token
     */
    generateRefreshToken(payload) {
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.refreshTokenExpiry,
            issuer: 'nexus-ide',
            audience: 'nexus-refresh'
        });
    }
    
    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }
    
    /**
     * Generate API Key
     */
    generateApiKey(userId, tenantId = null) {
        const payload = {
            userId,
            tenantId,
            type: 'api_key',
            created: Date.now()
        };
        
        const apiKey = crypto.randomBytes(32).toString('hex');
        const signature = crypto
            .createHmac('sha256', this.apiKeySecret)
            .update(JSON.stringify(payload))
            .digest('hex');
            
        return {
            key: apiKey,
            signature,
            payload: Buffer.from(JSON.stringify(payload)).toString('base64')
        };
    }
    
    /**
     * Verify API Key
     */
    verifyApiKey(apiKey, signature, payload) {
        try {
            const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
            const expectedSignature = crypto
                .createHmac('sha256', this.apiKeySecret)
                .update(JSON.stringify(decodedPayload))
                .digest('hex');
                
            if (signature !== expectedSignature) {
                throw new Error('Invalid API key signature');
            }
            
            return decodedPayload;
        } catch (error) {
            throw new Error(`API key verification failed: ${error.message}`);
        }
    }
    
    /**
     * Authentication middleware
     */
    authenticate() {
        return async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                const apiKey = req.headers['x-api-key'];
                
                let user = null;
                
                // JWT Authentication
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    const token = authHeader.substring(7);
                    const decoded = this.verifyToken(token);
                    user = decoded;
                    req.authType = 'jwt';
                }
                // API Key Authentication
                else if (apiKey) {
                    const signature = req.headers['x-api-signature'];
                    const payload = req.headers['x-api-payload'];
                    
                    if (!signature || !payload) {
                        return res.status(401).json({
                            error: 'Missing API key signature or payload'
                        });
                    }
                    
                    const apiKeyData = this.verifyApiKey(apiKey, signature, payload);
                    user = apiKeyData;
                    req.authType = 'api_key';
                }
                else {
                    return res.status(401).json({
                        error: 'Authentication required'
                    });
                }
                
                // Multi-tenant support
                if (this.enableMultiTenant && user.tenantId) {
                    req.tenantId = user.tenantId;
                }
                
                req.user = user;
                next();
                
            } catch (error) {
                return res.status(401).json({
                    error: 'Authentication failed',
                    message: error.message
                });
            }
        };
    }
    
    /**
     * Optional authentication middleware
     */
    optionalAuth() {
        return async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                const apiKey = req.headers['x-api-key'];
                
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    const token = authHeader.substring(7);
                    const decoded = this.verifyToken(token);
                    req.user = decoded;
                    req.authType = 'jwt';
                } else if (apiKey) {
                    const signature = req.headers['x-api-signature'];
                    const payload = req.headers['x-api-payload'];
                    
                    if (signature && payload) {
                        const apiKeyData = this.verifyApiKey(apiKey, signature, payload);
                        req.user = apiKeyData;
                        req.authType = 'api_key';
                    }
                }
                
                if (req.user && this.enableMultiTenant && req.user.tenantId) {
                    req.tenantId = req.user.tenantId;
                }
                
                next();
            } catch (error) {
                // Continue without authentication
                next();
            }
        };
    }
    
    /**
     * Role-based authorization middleware
     */
    requireRole(roles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required'
                });
            }
            
            const userRoles = req.user.roles || [];
            const hasRequiredRole = Array.isArray(roles) 
                ? roles.some(role => userRoles.includes(role))
                : userRoles.includes(roles);
                
            if (!hasRequiredRole) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    required: roles,
                    current: userRoles
                });
            }
            
            next();
        };
    }
    
    /**
     * Permission-based authorization middleware
     */
    requirePermission(permissions) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required'
                });
            }
            
            const userPermissions = req.user.permissions || [];
            const hasRequiredPermission = Array.isArray(permissions)
                ? permissions.some(permission => userPermissions.includes(permission))
                : userPermissions.includes(permissions);
                
            if (!hasRequiredPermission) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    required: permissions,
                    current: userPermissions
                });
            }
            
            next();
        };
    }
    
    /**
     * Tenant isolation middleware
     */
    requireTenant() {
        return (req, res, next) => {
            if (!this.enableMultiTenant) {
                return next();
            }
            
            if (!req.user || !req.user.tenantId) {
                return res.status(403).json({
                    error: 'Tenant access required'
                });
            }
            
            req.tenantId = req.user.tenantId;
            next();
        };
    }
    
    /**
     * Security headers middleware
     */
    securityHeaders() {
        return this.securityMiddleware;
    }
    
    /**
     * Rate limiting middleware
     */
    rateLimit() {
        return this.rateLimiter;
    }
    
    /**
     * Auth rate limiting middleware
     */
    authRateLimit() {
        return this.authRateLimiter;
    }
    
    /**
     * CORS middleware with security
     */
    cors(options = {}) {
        const defaultOptions = {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-API-Key',
                'X-API-Signature',
                'X-API-Payload',
                'X-Tenant-ID'
            ],
            exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
            maxAge: 86400 // 24 hours
        };
        
        const corsOptions = { ...defaultOptions, ...options };
        
        return (req, res, next) => {
            const origin = req.headers.origin;
            
            if (corsOptions.origin === '*' || 
                (Array.isArray(corsOptions.origin) && corsOptions.origin.includes(origin)) ||
                (typeof corsOptions.origin === 'string' && corsOptions.origin === origin)) {
                res.header('Access-Control-Allow-Origin', origin);
            }
            
            if (corsOptions.credentials) {
                res.header('Access-Control-Allow-Credentials', 'true');
            }
            
            res.header('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
            res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
            res.header('Access-Control-Expose-Headers', corsOptions.exposedHeaders.join(', '));
            res.header('Access-Control-Max-Age', corsOptions.maxAge.toString());
            
            if (req.method === 'OPTIONS') {
                return res.status(200).end();
            }
            
            next();
        };
    }
    
    /**
     * Audit logging middleware
     */
    auditLog() {
        return (req, res, next) => {
            const startTime = Date.now();
            const originalSend = res.send;
            
            res.send = function(data) {
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                // Log security-relevant events
                const auditData = {
                    timestamp: new Date().toISOString(),
                    method: req.method,
                    url: req.url,
                    ip: req.ip || req.connection.remoteAddress,
                    userAgent: req.headers['user-agent'],
                    userId: req.user?.userId,
                    tenantId: req.tenantId,
                    authType: req.authType,
                    statusCode: res.statusCode,
                    duration,
                    contentLength: data ? data.length : 0
                };
                
                // Log failed authentication attempts
                if (res.statusCode === 401 || res.statusCode === 403) {
                    console.warn('🚨 Security Alert:', JSON.stringify(auditData, null, 2));
                }
                
                // Log successful authentications
                if (req.user && req.method === 'POST' && req.url.includes('/auth/')) {
                    console.log('✅ Auth Success:', JSON.stringify(auditData, null, 2));
                }
                
                originalSend.call(this, data);
            };
            
            next();
        };
    }
    
    /**
     * Input validation and sanitization
     */
    validateInput() {
        return (req, res, next) => {
            // Remove potentially dangerous characters
            const sanitize = (obj) => {
                if (typeof obj === 'string') {
                    return obj.replace(/<script[^>]*>.*?<\/script>/gi, '')
                             .replace(/<[^>]*>/g, '')
                             .trim();
                }
                if (typeof obj === 'object' && obj !== null) {
                    const sanitized = {};
                    for (const [key, value] of Object.entries(obj)) {
                        sanitized[key] = sanitize(value);
                    }
                    return sanitized;
                }
                return obj;
            };
            
            if (req.body) {
                req.body = sanitize(req.body);
            }
            if (req.query) {
                req.query = sanitize(req.query);
            }
            if (req.params) {
                req.params = sanitize(req.params);
            }
            
            next();
        };
    }
    
    /**
     * Get security status
     */
    getSecurityStatus() {
        return {
            jwtEnabled: !!this.jwtSecret,
            apiKeyEnabled: !!this.apiKeySecret,
            multiTenantEnabled: this.enableMultiTenant,
            rateLimitEnabled: this.enableRateLimit,
            securityHeaders: true,
            auditLogging: true,
            inputValidation: true,
            corsEnabled: true
        };
    }
}

module.exports = AuthMiddleware;