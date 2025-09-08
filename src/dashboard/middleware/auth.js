/**
 * NEXUS IDE Security Dashboard - Authentication & Authorization Middleware
 * Enterprise-grade authentication and authorization system
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { AUTH, SECURITY } = require('../config/dashboard-config');
const logger = require('../utils/logger');
const { SecurityUtils } = require('../utils/security-utils');

/**
 * Authentication Manager Class
 */
class AuthenticationManager {
    constructor() {
        this.failedAttempts = new Map();
        this.lockedAccounts = new Map();
        this.activeSessions = new Map();
        this.mfaSecrets = new Map();
        
        // Initialize cleanup intervals
        this.startCleanupIntervals();
    }
    
    /**
     * Start cleanup intervals for expired data
     */
    startCleanupIntervals() {
        // Clean up failed attempts every 5 minutes
        setInterval(() => {
            this.cleanupFailedAttempts();
        }, 5 * 60 * 1000);
        
        // Clean up expired sessions every 10 minutes
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 10 * 60 * 1000);
    }
    
    /**
     * Generate JWT token
     */
    generateToken(user, options = {}) {
        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            permissions: user.permissions || [],
            sessionId: SecurityUtils.generateSecureId(),
            iat: Math.floor(Date.now() / 1000)
        };
        
        const tokenOptions = {
            expiresIn: options.expiresIn || AUTH.jwt.expiresIn,
            issuer: AUTH.jwt.issuer,
            audience: AUTH.jwt.audience,
            algorithm: 'HS256'
        };
        
        const token = jwt.sign(payload, AUTH.jwt.secret, tokenOptions);
        
        // Store active session
        this.activeSessions.set(payload.sessionId, {
            userId: user.id,
            token,
            createdAt: new Date(),
            lastActivity: new Date(),
            ipAddress: options.ipAddress,
            userAgent: options.userAgent
        });
        
        return { token, sessionId: payload.sessionId };
    }
    
    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, AUTH.jwt.secret, {
                issuer: AUTH.jwt.issuer,
                audience: AUTH.jwt.audience
            });
            
            // Check if session is still active
            const session = this.activeSessions.get(decoded.sessionId);
            if (!session) {
                throw new Error('Session not found or expired');
            }
            
            // Update last activity
            session.lastActivity = new Date();
            
            return decoded;
        } catch (error) {
            logger.warn('Token verification failed', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Hash password with salt
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
     * Check if account is locked
     */
    isAccountLocked(identifier) {
        const lockInfo = this.lockedAccounts.get(identifier);
        if (!lockInfo) return false;
        
        // Check if lock has expired
        if (Date.now() > lockInfo.expiresAt) {
            this.lockedAccounts.delete(identifier);
            this.failedAttempts.delete(identifier);
            return false;
        }
        
        return true;
    }
    
    /**
     * Record failed login attempt
     */
    recordFailedAttempt(identifier, ipAddress) {
        const attempts = this.failedAttempts.get(identifier) || [];
        attempts.push({
            timestamp: Date.now(),
            ipAddress
        });
        
        // Keep only recent attempts (within reset time)
        const recentAttempts = attempts.filter(
            attempt => Date.now() - attempt.timestamp < SECURITY.lockout.resetTime
        );
        
        this.failedAttempts.set(identifier, recentAttempts);
        
        // Lock account if too many attempts
        if (recentAttempts.length >= SECURITY.lockout.maxAttempts) {
            this.lockAccount(identifier);
            logger.warn('Account locked due to failed attempts', {
                identifier,
                attempts: recentAttempts.length,
                ipAddress
            });
        }
    }
    
    /**
     * Lock account
     */
    lockAccount(identifier) {
        this.lockedAccounts.set(identifier, {
            lockedAt: Date.now(),
            expiresAt: Date.now() + SECURITY.lockout.lockoutDuration
        });
    }
    
    /**
     * Clear failed attempts on successful login
     */
    clearFailedAttempts(identifier) {
        this.failedAttempts.delete(identifier);
    }
    
    /**
     * Generate MFA secret
     */
    generateMFASecret(user) {
        const secret = speakeasy.generateSecret({
            name: `${AUTH.mfa.issuer} (${user.email})`,
            issuer: AUTH.mfa.issuer,
            length: 32
        });
        
        this.mfaSecrets.set(user.id, {
            secret: secret.base32,
            tempSecret: secret.base32,
            verified: false,
            createdAt: Date.now()
        });
        
        return secret;
    }
    
    /**
     * Verify MFA token
     */
    verifyMFAToken(userId, token) {
        const mfaData = this.mfaSecrets.get(userId);
        if (!mfaData) {
            throw new Error('MFA not set up for this user');
        }
        
        const verified = speakeasy.totp.verify({
            secret: mfaData.secret,
            encoding: 'base32',
            token,
            window: AUTH.mfa.window
        });
        
        if (verified && !mfaData.verified) {
            mfaData.verified = true;
            mfaData.verifiedAt = Date.now();
        }
        
        return verified;
    }
    
    /**
     * Generate QR code for MFA setup
     */
    async generateMFAQRCode(secret) {
        try {
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url, AUTH.mfa.qrCodeOptions);
            return qrCodeUrl;
        } catch (error) {
            logger.error('Failed to generate MFA QR code', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Revoke session
     */
    revokeSession(sessionId) {
        return this.activeSessions.delete(sessionId);
    }
    
    /**
     * Revoke all user sessions
     */
    revokeAllUserSessions(userId) {
        let revokedCount = 0;
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (session.userId === userId) {
                this.activeSessions.delete(sessionId);
                revokedCount++;
            }
        }
        return revokedCount;
    }
    
    /**
     * Get active sessions for user
     */
    getUserSessions(userId) {
        const sessions = [];
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (session.userId === userId) {
                sessions.push({
                    sessionId,
                    createdAt: session.createdAt,
                    lastActivity: session.lastActivity,
                    ipAddress: session.ipAddress,
                    userAgent: session.userAgent
                });
            }
        }
        return sessions;
    }
    
    /**
     * Cleanup expired sessions
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
        
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (now - session.lastActivity.getTime() > sessionTimeout) {
                this.activeSessions.delete(sessionId);
            }
        }
    }
    
    /**
     * Cleanup old failed attempts
     */
    cleanupFailedAttempts() {
        const now = Date.now();
        
        for (const [identifier, attempts] of this.failedAttempts.entries()) {
            const recentAttempts = attempts.filter(
                attempt => now - attempt.timestamp < SECURITY.lockout.resetTime
            );
            
            if (recentAttempts.length === 0) {
                this.failedAttempts.delete(identifier);
            } else {
                this.failedAttempts.set(identifier, recentAttempts);
            }
        }
    }
}

/**
 * Authorization Manager Class
 */
class AuthorizationManager {
    constructor() {
        this.permissions = new Map();
        this.roles = new Map();
        
        // Initialize default roles and permissions
        this.initializeDefaultRoles();
    }
    
    /**
     * Initialize default roles and permissions
     */
    initializeDefaultRoles() {
        // Define permissions
        const permissions = {
            // Dashboard permissions
            'dashboard.view': 'View dashboard',
            'dashboard.manage': 'Manage dashboard settings',
            
            // Security permissions
            'security.view': 'View security data',
            'security.manage': 'Manage security settings',
            'security.audit': 'Perform security audits',
            
            // User permissions
            'users.view': 'View users',
            'users.create': 'Create users',
            'users.update': 'Update users',
            'users.delete': 'Delete users',
            
            // System permissions
            'system.view': 'View system information',
            'system.manage': 'Manage system settings',
            'system.admin': 'Full system administration',
            
            // API permissions
            'api.read': 'Read API access',
            'api.write': 'Write API access',
            'api.admin': 'Admin API access'
        };
        
        // Store permissions
        for (const [key, description] of Object.entries(permissions)) {
            this.permissions.set(key, { key, description });
        }
        
        // Define roles
        const roles = {
            'viewer': {
                name: 'Viewer',
                description: 'Read-only access to dashboard',
                permissions: [
                    'dashboard.view',
                    'security.view',
                    'api.read'
                ]
            },
            'analyst': {
                name: 'Security Analyst',
                description: 'Security analysis and monitoring',
                permissions: [
                    'dashboard.view',
                    'security.view',
                    'security.audit',
                    'system.view',
                    'api.read'
                ]
            },
            'admin': {
                name: 'Administrator',
                description: 'Full administrative access',
                permissions: [
                    'dashboard.view',
                    'dashboard.manage',
                    'security.view',
                    'security.manage',
                    'security.audit',
                    'users.view',
                    'users.create',
                    'users.update',
                    'users.delete',
                    'system.view',
                    'system.manage',
                    'api.read',
                    'api.write'
                ]
            },
            'superadmin': {
                name: 'Super Administrator',
                description: 'Full system access',
                permissions: Object.keys(permissions)
            }
        };
        
        // Store roles
        for (const [key, role] of Object.entries(roles)) {
            this.roles.set(key, { ...role, key });
        }
    }
    
    /**
     * Check if user has permission
     */
    hasPermission(user, permission) {
        if (!user || !user.permissions) return false;
        
        // Super admin has all permissions
        if (user.role === 'superadmin') return true;
        
        // Check direct permissions
        if (user.permissions.includes(permission)) return true;
        
        // Check role-based permissions
        const role = this.roles.get(user.role);
        if (role && role.permissions.includes(permission)) return true;
        
        return false;
    }
    
    /**
     * Check if user has any of the specified permissions
     */
    hasAnyPermission(user, permissions) {
        return permissions.some(permission => this.hasPermission(user, permission));
    }
    
    /**
     * Check if user has all specified permissions
     */
    hasAllPermissions(user, permissions) {
        return permissions.every(permission => this.hasPermission(user, permission));
    }
    
    /**
     * Get user permissions
     */
    getUserPermissions(user) {
        if (!user) return [];
        
        const permissions = new Set();
        
        // Add direct permissions
        if (user.permissions) {
            user.permissions.forEach(permission => permissions.add(permission));
        }
        
        // Add role-based permissions
        const role = this.roles.get(user.role);
        if (role) {
            role.permissions.forEach(permission => permissions.add(permission));
        }
        
        return Array.from(permissions);
    }
    
    /**
     * Get all roles
     */
    getAllRoles() {
        return Array.from(this.roles.values());
    }
    
    /**
     * Get all permissions
     */
    getAllPermissions() {
        return Array.from(this.permissions.values());
    }
}

// Create singleton instances
const authManager = new AuthenticationManager();
const authzManager = new AuthorizationManager();

/**
 * Rate limiting middleware
 */
const createRateLimit = (options = {}) => {
    return rateLimit({
        windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
        max: options.max || 100,
        message: options.message || 'Too many requests from this IP',
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn('Rate limit exceeded', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path
            });
            res.status(429).json({
                error: 'Too many requests',
                message: 'Rate limit exceeded. Please try again later.',
                retryAfter: Math.round(options.windowMs / 1000)
            });
        }
    });
};

/**
 * Slow down middleware for login attempts
 */
const loginSlowDown = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 2, // Allow 2 requests per windowMs without delay
    delayMs: 500, // Add 500ms delay per request after delayAfter
    maxDelayMs: 20000, // Maximum delay of 20 seconds
    skipSuccessfulRequests: true
});

/**
 * Authentication middleware
 */
const authenticate = async (req, res, next) => {
    try {
        const token = extractToken(req);
        
        if (!token) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'No authentication token provided'
            });
        }
        
        const decoded = authManager.verifyToken(token);
        
        // TODO: Fetch user from database
        const user = {
            id: decoded.id,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role,
            permissions: decoded.permissions
        };
        
        req.user = user;
        req.sessionId = decoded.sessionId;
        
        next();
    } catch (error) {
        logger.warn('Authentication failed', {
            error: error.message,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        res.status(401).json({
            error: 'Authentication failed',
            message: 'Invalid or expired token'
        });
    }
};

/**
 * Authorization middleware factory
 */
const authorize = (permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'User not authenticated'
            });
        }
        
        const hasPermission = Array.isArray(permissions)
            ? authzManager.hasAnyPermission(req.user, permissions)
            : authzManager.hasPermission(req.user, permissions);
        
        if (!hasPermission) {
            logger.warn('Authorization failed', {
                userId: req.user.id,
                username: req.user.username,
                requiredPermissions: permissions,
                userPermissions: authzManager.getUserPermissions(req.user)
            });
            
            return res.status(403).json({
                error: 'Access denied',
                message: 'Insufficient permissions'
            });
        }
        
        next();
    };
};

/**
 * Extract token from request
 */
const extractToken = (req) => {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    
    // Check cookie
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    
    // Check query parameter (not recommended for production)
    if (req.query.token) {
        return req.query.token;
    }
    
    return null;
};

/**
 * Optional authentication middleware
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = extractToken(req);
        
        if (token) {
            const decoded = authManager.verifyToken(token);
            
            // TODO: Fetch user from database
            const user = {
                id: decoded.id,
                username: decoded.username,
                email: decoded.email,
                role: decoded.role,
                permissions: decoded.permissions
            };
            
            req.user = user;
            req.sessionId = decoded.sessionId;
        }
        
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

/**
 * MFA verification middleware
 */
const requireMFA = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'User not authenticated'
        });
    }
    
    // Check if MFA is required and verified
    if (AUTH.mfa.enabled && !req.user.mfaVerified) {
        return res.status(403).json({
            error: 'MFA required',
            message: 'Multi-factor authentication required'
        });
    }
    
    next();
};

module.exports = {
    AuthenticationManager,
    AuthorizationManager,
    authManager,
    authzManager,
    authenticate,
    authorize,
    optionalAuth,
    requireMFA,
    createRateLimit,
    loginSlowDown,
    extractToken
};