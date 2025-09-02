#!/usr/bin/env node
/**
 * Security Middleware
 * Middleware สำหรับการตรวจสอบความปลอดภัยในระบบ MCP Server
 * รองรับ Authentication, Authorization, Rate Limiting และ Request Validation
 */

const SecurityManager = require('./security-manager');
const crypto = require('crypto');
const { URL } = require('url');

class SecurityMiddleware {
    constructor(securityManager, options = {}) {
        this.securityManager = securityManager;
        this.config = {
            // CORS Configuration
            corsEnabled: options.corsEnabled !== false,
            allowedOrigins: options.allowedOrigins || ['http://localhost:*', 'https://localhost:*'],
            allowedMethods: options.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: options.allowedHeaders || ['Content-Type', 'Authorization', 'X-Requested-With'],
            
            // Request Validation
            maxRequestSize: options.maxRequestSize || 10 * 1024 * 1024, // 10MB
            maxHeaderSize: options.maxHeaderSize || 8192, // 8KB
            
            // Security Headers
            enableSecurityHeaders: options.enableSecurityHeaders !== false,
            
            // Request Logging
            enableRequestLogging: options.enableRequestLogging !== false,
            
            // Protected Endpoints
            protectedEndpoints: options.protectedEndpoints || [
                '/admin/*',
                '/api/users/*',
                '/api/security/*',
                '/memory/set',
                '/memory/delete'
            ],
            
            // Public Endpoints (ไม่ต้องการ authentication)
            publicEndpoints: options.publicEndpoints || [
                '/health',
                '/status',
                '/login',
                '/register',
                '/memory/get'
            ],
            
            ...options
        };
        
        // Request tracking
        this.requestStats = {
            total: 0,
            successful: 0,
            failed: 0,
            blocked: 0
        };
    }
    
    /**
     * Main middleware function
     */
    middleware() {
        return async (req, res, next) => {
            try {
                // เพิ่มข้อมูล security context
                req.security = {
                    startTime: Date.now(),
                    requestId: this.generateRequestId(),
                    clientInfo: this.extractClientInfo(req)
                };
                
                // Log request
                if (this.config.enableRequestLogging) {
                    this.logRequest(req);
                }
                
                // เพิ่ม security headers
                if (this.config.enableSecurityHeaders) {
                    this.addSecurityHeaders(res);
                }
                
                // ตรวจสอบ CORS
                if (this.config.corsEnabled) {
                    const corsResult = this.handleCORS(req, res);
                    if (corsResult.handled) {
                        return;
                    }
                }
                
                // ตรวจสอบขนาด request
                if (!this.validateRequestSize(req)) {
                    return this.sendError(res, 413, 'Request too large');
                }
                
                // ตรวจสอบ Rate Limiting
                if (!this.securityManager.checkRateLimit(req.security.clientInfo.ip)) {
                    this.requestStats.blocked++;
                    return this.sendError(res, 429, 'Too many requests');
                }
                
                // ตรวจสอบ malicious patterns
                if (this.detectMaliciousRequest(req)) {
                    this.requestStats.blocked++;
                    await this.securityManager.logSecurityEvent('MALICIOUS_REQUEST_BLOCKED', {
                        url: req.url,
                        method: req.method,
                        clientInfo: req.security.clientInfo,
                        reason: 'Malicious pattern detected'
                    });
                    return this.sendError(res, 400, 'Bad request');
                }
                
                // ตรวจสอบว่าเป็น protected endpoint หรือไม่
                const isProtected = this.isProtectedEndpoint(req.url);
                const isPublic = this.isPublicEndpoint(req.url);
                
                if (isProtected && !isPublic) {
                    // ต้องการ authentication
                    const authResult = await this.authenticateRequest(req);
                    if (!authResult.success) {
                        this.requestStats.failed++;
                        return this.sendError(res, 401, authResult.error);
                    }
                    
                    req.user = authResult.user;
                    
                    // ตรวจสอบ authorization
                    const authzResult = await this.authorizeRequest(req);
                    if (!authzResult.success) {
                        this.requestStats.failed++;
                        return this.sendError(res, 403, authzResult.error);
                    }
                }
                
                // เพิ่ม response handler
                this.addResponseHandler(req, res);
                
                this.requestStats.total++;
                next();
                
            } catch (error) {
                console.error('Security middleware error:', error.message);
                this.requestStats.failed++;
                return this.sendError(res, 500, 'Internal server error');
            }
        };
    }
    
    /**
     * ดึงข้อมูล client
     */
    extractClientInfo(req) {
        return {
            ip: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
            userAgent: req.get('User-Agent') || 'Unknown',
            referer: req.get('Referer') || null,
            origin: req.get('Origin') || null,
            forwarded: req.get('X-Forwarded-For') || null
        };
    }
    
    /**
     * เพิ่ม Security Headers
     */
    addSecurityHeaders(res) {
        // Prevent XSS
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        
        // HTTPS enforcement
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        
        // Content Security Policy
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
        
        // Referrer Policy
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // Permissions Policy
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    }
    
    /**
     * จัดการ CORS
     */
    handleCORS(req, res) {
        const origin = req.get('Origin');
        
        if (origin && this.isAllowedOrigin(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        } else if (!origin) {
            // Same-origin request
            res.setHeader('Access-Control-Allow-Origin', '*');
        }
        
        res.setHeader('Access-Control-Allow-Methods', this.config.allowedMethods.join(', '));
        res.setHeader('Access-Control-Allow-Headers', this.config.allowedHeaders.join(', '));
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
        
        // Handle preflight request
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return { handled: true };
        }
        
        return { handled: false };
    }
    
    /**
     * ตรวจสอบว่า origin ได้รับอนุญาตหรือไม่
     */
    isAllowedOrigin(origin) {
        return this.config.allowedOrigins.some(allowed => {
            if (allowed.includes('*')) {
                // Wildcard matching
                const pattern = allowed.replace(/\*/g, '.*');
                return new RegExp(`^${pattern}$`).test(origin);
            }
            return allowed === origin;
        });
    }
    
    /**
     * ตรวจสอบขนาด request
     */
    validateRequestSize(req) {
        const contentLength = parseInt(req.get('Content-Length') || '0');
        
        if (contentLength > this.config.maxRequestSize) {
            return false;
        }
        
        // ตรวจสอบขนาด headers
        const headerSize = JSON.stringify(req.headers).length;
        if (headerSize > this.config.maxHeaderSize) {
            return false;
        }
        
        return true;
    }
    
    /**
     * ตรวจจับ malicious requests
     */
    detectMaliciousRequest(req) {
        const maliciousPatterns = [
            // SQL Injection
            /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
            /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
            
            // XSS
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/i,
            /on\w+\s*=/i,
            
            // Path Traversal
            /\.\.[\/\\]/,
            /(\.\.%2f|\.\.%5c)/i,
            
            // Command Injection
            /(;|\||&|`|\$\(|\$\{)/,
            /(nc|netcat|wget|curl|chmod|rm|mv|cp)/i,
            
            // LDAP Injection
            /(\(|\)|\*|\\|\||&)/,
            
            // NoSQL Injection
            /(\$where|\$ne|\$gt|\$lt|\$regex)/i
        ];
        
        // ตรวจสอบ URL
        const url = decodeURIComponent(req.url);
        if (maliciousPatterns.some(pattern => pattern.test(url))) {
            return true;
        }
        
        // ตรวจสอบ Headers
        for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === 'string' && maliciousPatterns.some(pattern => pattern.test(value))) {
                return true;
            }
        }
        
        // ตรวจสอบ Query Parameters
        if (req.query) {
            for (const [key, value] of Object.entries(req.query)) {
                if (typeof value === 'string' && maliciousPatterns.some(pattern => pattern.test(value))) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * ตรวจสอบว่าเป็น protected endpoint หรือไม่
     */
    isProtectedEndpoint(url) {
        return this.config.protectedEndpoints.some(pattern => {
            if (pattern.endsWith('*')) {
                return url.startsWith(pattern.slice(0, -1));
            }
            return url === pattern;
        });
    }
    
    /**
     * ตรวจสอบว่าเป็น public endpoint หรือไม่
     */
    isPublicEndpoint(url) {
        return this.config.publicEndpoints.some(pattern => {
            if (pattern.endsWith('*')) {
                return url.startsWith(pattern.slice(0, -1));
            }
            return url === pattern;
        });
    }
    
    /**
     * ตรวจสอบ authentication
     */
    async authenticateRequest(req) {
        try {
            const token = this.extractToken(req);
            if (!token) {
                return { success: false, error: 'No authentication token provided' };
            }
            
            const decoded = this.securityManager.verifyToken(token);
            
            // ค้นหาผู้ใช้
            const users = Array.from(this.securityManager.users.values());
            const user = users.find(u => u.id === decoded.userId);
            
            if (!user || !user.isActive) {
                return { success: false, error: 'Invalid or inactive user' };
            }
            
            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    roles: user.roles,
                    permissions: user.permissions
                }
            };
            
        } catch (error) {
            return { success: false, error: 'Invalid authentication token' };
        }
    }
    
    /**
     * ดึง token จาก request
     */
    extractToken(req) {
        // ตรวจสอบ Authorization header
        const authHeader = req.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        
        // ตรวจสอบ query parameter
        if (req.query && req.query.token) {
            return req.query.token;
        }
        
        // ตรวจสอบ cookie
        if (req.cookies && req.cookies.token) {
            return req.cookies.token;
        }
        
        return null;
    }
    
    /**
     * ตรวจสอบ authorization
     */
    async authorizeRequest(req) {
        try {
            const { user } = req;
            const { method, url } = req;
            
            // Admin มีสิทธิ์ทุกอย่าง
            if (user.roles.includes('admin')) {
                return { success: true };
            }
            
            // กำหนดสิทธิ์ตาม endpoint
            const requiredPermissions = this.getRequiredPermissions(method, url);
            
            if (requiredPermissions.length === 0) {
                return { success: true }; // ไม่ต้องการสิทธิ์พิเศษ
            }
            
            // ตรวจสอบสิทธิ์
            const hasPermission = requiredPermissions.every(permission => 
                user.permissions.includes(permission) || user.permissions.includes('*')
            );
            
            if (!hasPermission) {
                return { success: false, error: 'Insufficient permissions' };
            }
            
            return { success: true };
            
        } catch (error) {
            return { success: false, error: 'Authorization failed' };
        }
    }
    
    /**
     * กำหนดสิทธิ์ที่ต้องการตาม endpoint
     */
    getRequiredPermissions(method, url) {
        const permissionMap = {
            'GET /memory/*': ['read'],
            'POST /memory/set': ['write'],
            'DELETE /memory/*': ['delete'],
            'GET /admin/*': ['admin'],
            'POST /admin/*': ['admin'],
            'PUT /admin/*': ['admin'],
            'DELETE /admin/*': ['admin'],
            'GET /api/users/*': ['user_read'],
            'POST /api/users/*': ['user_write'],
            'PUT /api/users/*': ['user_write'],
            'DELETE /api/users/*': ['user_delete']
        };
        
        for (const [pattern, permissions] of Object.entries(permissionMap)) {
            const [patternMethod, patternUrl] = pattern.split(' ');
            
            if (method === patternMethod) {
                if (patternUrl.endsWith('*')) {
                    if (url.startsWith(patternUrl.slice(0, -1))) {
                        return permissions;
                    }
                } else if (url === patternUrl) {
                    return permissions;
                }
            }
        }
        
        return [];
    }
    
    /**
     * เพิ่ม response handler
     */
    addResponseHandler(req, res) {
        const originalSend = res.send;
        const originalJson = res.json;
        
        res.send = function(data) {
            req.security.endTime = Date.now();
            req.security.responseTime = req.security.endTime - req.security.startTime;
            
            // Log response
            if (this.config && this.config.enableRequestLogging) {
                this.logResponse(req, res, data);
            }
            
            return originalSend.call(this, data);
        }.bind(this);
        
        res.json = function(data) {
            req.security.endTime = Date.now();
            req.security.responseTime = req.security.endTime - req.security.startTime;
            
            // Log response
            if (this.config && this.config.enableRequestLogging) {
                this.logResponse(req, res, data);
            }
            
            return originalJson.call(this, data);
        }.bind(this);
    }
    
    /**
     * Log request
     */
    logRequest(req) {
        console.log(`🔍 ${req.method} ${req.url} - ${req.security.clientInfo.ip} - ${req.security.requestId}`);
    }
    
    /**
     * Log response
     */
    logResponse(req, res, data) {
        const { method, url, security } = req;
        const { statusCode } = res;
        const { responseTime, clientInfo, requestId } = security;
        
        console.log(`📤 ${method} ${url} - ${statusCode} - ${responseTime}ms - ${clientInfo.ip} - ${requestId}`);
        
        // Update stats
        if (statusCode >= 200 && statusCode < 400) {
            this.requestStats.successful++;
        } else {
            this.requestStats.failed++;
        }
    }
    
    /**
     * ส่ง error response
     */
    sendError(res, statusCode, message) {
        res.status(statusCode).json({
            success: false,
            error: {
                code: statusCode,
                message,
                timestamp: new Date().toISOString()
            }
        });
    }
    
    /**
     * สร้าง Request ID
     */
    generateRequestId() {
        return 'req_' + crypto.randomBytes(8).toString('hex');
    }
    
    /**
     * ดึงสถิติ
     */
    getStats() {
        return {
            ...this.requestStats,
            successRate: this.requestStats.total > 0 ? 
                (this.requestStats.successful / this.requestStats.total) * 100 : 0
        };
    }
    
    /**
     * รีเซ็ตสถิติ
     */
    resetStats() {
        this.requestStats = {
            total: 0,
            successful: 0,
            failed: 0,
            blocked: 0
        };
    }
}

/**
 * Express.js middleware factory
 */
function createSecurityMiddleware(securityManager, options = {}) {
    const middleware = new SecurityMiddleware(securityManager, options);
    return middleware.middleware();
}

/**
 * Authentication middleware
 */
function requireAuth(securityManager, options = {}) {
    return async (req, res, next) => {
        try {
            const middleware = new SecurityMiddleware(securityManager, options);
            const authResult = await middleware.authenticateRequest(req);
            
            if (!authResult.success) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 401,
                        message: authResult.error
                    }
                });
            }
            
            req.user = authResult.user;
            next();
            
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: {
                    code: 500,
                    message: 'Authentication error'
                }
            });
        }
    };
}

/**
 * Authorization middleware
 */
function requirePermissions(permissions = [], roles = []) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 401,
                        message: 'Authentication required'
                    }
                });
            }
            
            const { user } = req;
            
            // Admin มีสิทธิ์ทุกอย่าง
            if (user.roles.includes('admin')) {
                return next();
            }
            
            // ตรวจสอบ roles
            if (roles.length > 0) {
                const hasRole = roles.some(role => user.roles.includes(role));
                if (!hasRole) {
                    return res.status(403).json({
                        success: false,
                        error: {
                            code: 403,
                            message: 'Insufficient role permissions'
                        }
                    });
                }
            }
            
            // ตรวจสอบ permissions
            if (permissions.length > 0) {
                const hasPermission = permissions.every(permission => 
                    user.permissions.includes(permission) || user.permissions.includes('*')
                );
                if (!hasPermission) {
                    return res.status(403).json({
                        success: false,
                        error: {
                            code: 403,
                            message: 'Insufficient permissions'
                        }
                    });
                }
            }
            
            next();
            
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: {
                    code: 500,
                    message: 'Authorization error'
                }
            });
        }
    };
}

module.exports = {
    SecurityMiddleware,
    createSecurityMiddleware,
    requireAuth,
    requirePermissions
};