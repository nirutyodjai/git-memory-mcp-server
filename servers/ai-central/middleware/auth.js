/**
 * =============================================================================
 * NEXUS IDE - Authentication & Authorization Middleware
 * =============================================================================
 * 
 * Comprehensive authentication and authorization middleware for AI Central Server
 * 
 * Features:
 * - JWT token validation
 * - API key authentication
 * - Role-based access control (RBAC)
 * - Permission-based authorization
 * - Session management
 * - Rate limiting per user
 * - Security headers
 * - Request sanitization
 * 
 * Author: NEXUS IDE Team
 * Version: 1.0.0
 * License: MIT
 * 
 * =============================================================================
 */

'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const xss = require('xss');
const validator = require('validator');
const config = require('../config/config');
const logger = require('../utils/logger');
const { promisify } = require('util');
const crypto = require('crypto');

// =============================================================================
// Constants
// =============================================================================
const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  API_KEY: 'api_key'
};

const USER_ROLES = {
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  VIEWER: 'viewer',
  GUEST: 'guest'
};

const PERMISSIONS = {
  // AI Permissions
  AI_CODE_COMPLETION: 'ai:code:completion',
  AI_CODE_GENERATION: 'ai:code:generation',
  AI_CODE_REVIEW: 'ai:code:review',
  AI_CONVERSATION: 'ai:conversation',
  AI_DEBUGGING: 'ai:debugging',
  AI_OPTIMIZATION: 'ai:optimization',
  
  // Project Permissions
  PROJECT_READ: 'project:read',
  PROJECT_WRITE: 'project:write',
  PROJECT_DELETE: 'project:delete',
  PROJECT_ADMIN: 'project:admin',
  
  // System Permissions
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_MONITOR: 'system:monitor',
  SYSTEM_CONFIG: 'system:config',
  
  // Collaboration Permissions
  COLLAB_JOIN: 'collab:join',
  COLLAB_CREATE: 'collab:create',
  COLLAB_MODERATE: 'collab:moderate'
};

// Role-Permission Mapping
const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS),
  [USER_ROLES.DEVELOPER]: [
    PERMISSIONS.AI_CODE_COMPLETION,
    PERMISSIONS.AI_CODE_GENERATION,
    PERMISSIONS.AI_CODE_REVIEW,
    PERMISSIONS.AI_CONVERSATION,
    PERMISSIONS.AI_DEBUGGING,
    PERMISSIONS.AI_OPTIMIZATION,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_WRITE,
    PERMISSIONS.PROJECT_DELETE,
    PERMISSIONS.COLLAB_JOIN,
    PERMISSIONS.COLLAB_CREATE
  ],
  [USER_ROLES.VIEWER]: [
    PERMISSIONS.AI_CONVERSATION,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.COLLAB_JOIN
  ],
  [USER_ROLES.GUEST]: [
    PERMISSIONS.PROJECT_READ
  ]
};

// =============================================================================
// Authentication Middleware
// =============================================================================

/**
 * JWT Token Validation Middleware
 */
const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, config.security.jwt.secret, {
      algorithms: [config.security.jwt.algorithm],
      issuer: config.security.jwt.issuer,
      audience: config.security.jwt.audience
    });
    
    // Check token type
    if (decoded.type !== TOKEN_TYPES.ACCESS) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }
    
    // Add user info to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      permissions: ROLE_PERMISSIONS[decoded.role] || [],
      sessionId: decoded.sessionId,
      tokenId: decoded.jti
    };
    
    // Log authentication
    logger.debug('User authenticated', {
      userId: req.user.id,
      role: req.user.role,
      sessionId: req.user.sessionId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    next();
  } catch (error) {
    logger.warn('JWT authentication failed', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    let errorCode = 'TOKEN_INVALID';
    let errorMessage = 'Invalid access token';
    
    if (error.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED';
      errorMessage = 'Access token expired';
    } else if (error.name === 'JsonWebTokenError') {
      errorCode = 'TOKEN_MALFORMED';
      errorMessage = 'Malformed access token';
    }
    
    return res.status(401).json({
      success: false,
      error: errorMessage,
      code: errorCode
    });
  }
};

/**
 * API Key Authentication Middleware
 */
const authenticateAPIKey = async (req, res, next) => {
  try {
    if (!config.security.apiKeys.enabled) {
      return next();
    }
    
    const apiKey = req.headers[config.security.apiKeys.header.toLowerCase()];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required',
        code: 'API_KEY_MISSING'
      });
    }
    
    // Validate API key
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    const validKeys = config.security.apiKeys.keys.map(key => 
      crypto.createHash('sha256').update(key).digest('hex')
    );
    
    if (!validKeys.includes(hashedKey)) {
      logger.warn('Invalid API key attempt', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        apiKeyPrefix: apiKey.substring(0, 8) + '...'
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
        code: 'API_KEY_INVALID'
      });
    }
    
    // Add API key info to request
    req.apiKey = {
      key: hashedKey,
      type: TOKEN_TYPES.API_KEY
    };
    
    // Set default user for API key
    req.user = {
      id: 'api-key-user',
      role: USER_ROLES.DEVELOPER,
      permissions: ROLE_PERMISSIONS[USER_ROLES.DEVELOPER],
      type: 'api_key'
    };
    
    logger.debug('API key authenticated', {
      keyPrefix: apiKey.substring(0, 8) + '...',
      ip: req.ip
    });
    
    next();
  } catch (error) {
    logger.error('API key authentication error', {
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Optional Authentication Middleware
 * Allows both authenticated and anonymous access
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers[config.security.apiKeys.header?.toLowerCase()];
  
  if (authHeader || apiKey) {
    // Try to authenticate if credentials are provided
    if (authHeader) {
      return authenticateJWT(req, res, next);
    } else if (apiKey && config.security.apiKeys.enabled) {
      return authenticateAPIKey(req, res, next);
    }
  }
  
  // Set anonymous user
  req.user = {
    id: 'anonymous',
    role: USER_ROLES.GUEST,
    permissions: ROLE_PERMISSIONS[USER_ROLES.GUEST],
    type: 'anonymous'
  };
  
  next();
};

// =============================================================================
// Authorization Middleware
// =============================================================================

/**
 * Role-based Authorization Middleware
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn('Access denied - insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        endpoint: req.path,
        method: req.method
      });
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_ROLE',
        required: roles,
        current: req.user.role
      });
    }
    
    next();
  };
};

/**
 * Permission-based Authorization Middleware
 */
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasPermission) {
      logger.warn('Access denied - insufficient permissions', {
        userId: req.user.id,
        userPermissions,
        requiredPermissions: permissions,
        endpoint: req.path,
        method: req.method
      });
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permissions,
        current: userPermissions
      });
    }
    
    next();
  };
};

/**
 * Admin Only Middleware
 */
const requireAdmin = requireRole(USER_ROLES.ADMIN);

/**
 * Developer or Admin Middleware
 */
const requireDeveloper = requireRole(USER_ROLES.ADMIN, USER_ROLES.DEVELOPER);

// =============================================================================
// Rate Limiting Middleware
// =============================================================================

/**
 * General Rate Limiting
 */
const generalRateLimit = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max,
  message: config.security.rateLimit.message,
  standardHeaders: config.security.rateLimit.standardHeaders,
  legacyHeaders: config.security.rateLimit.legacyHeaders,
  skipSuccessfulRequests: config.security.rateLimit.skipSuccessfulRequests,
  skipFailedRequests: config.security.rateLimit.skipFailedRequests,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      userId: req.user?.id,
      ip: req.ip,
      endpoint: req.path,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(config.security.rateLimit.windowMs / 1000)
    });
  }
});

/**
 * AI Request Rate Limiting
 */
const aiRateLimit = rateLimit({
  windowMs: config.ai.rateLimiting.window,
  max: config.ai.rateLimiting.requests,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.warn('AI rate limit exceeded', {
      userId: req.user?.id,
      ip: req.ip,
      endpoint: req.path
    });
    
    res.status(429).json({
      success: false,
      error: 'AI request rate limit exceeded',
      code: 'AI_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(config.ai.rateLimiting.window / 1000)
    });
  }
});

/**
 * Speed Limiting (Slow Down)
 */
const speedLimit = slowDown({
  windowMs: config.security.speedLimit.windowMs,
  delayAfter: config.security.speedLimit.delayAfter,
  delayMs: config.security.speedLimit.delayMs,
  maxDelayMs: config.security.speedLimit.maxDelayMs,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// =============================================================================
// Security Middleware
// =============================================================================

/**
 * Security Headers Middleware
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: config.security.csp.directives,
    reportOnly: config.security.csp.reportOnly
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'same-origin' },
  frameguard: { action: 'deny' }
});

/**
 * Input Sanitization Middleware
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    logger.error('Input sanitization error', {
      error: error.message,
      stack: error.stack
    });
    
    return res.status(400).json({
      success: false,
      error: 'Invalid input data',
      code: 'INVALID_INPUT'
    });
  }
};

/**
 * Sanitize Object Recursively
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = validator.escape(key);
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  if (typeof obj === 'string') {
    // XSS protection
    return xss(obj, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    });
  }
  
  return obj;
};

// =============================================================================
// Session Management
// =============================================================================

/**
 * Session Validation Middleware
 */
const validateSession = async (req, res, next) => {
  try {
    if (!req.user || !req.user.sessionId) {
      return next();
    }
    
    // TODO: Implement session validation with Redis
    // Check if session exists and is valid
    // const session = await redisClient.get(`session:${req.user.sessionId}`);
    // if (!session) {
    //   return res.status(401).json({
    //     success: false,
    //     error: 'Session expired',
    //     code: 'SESSION_EXPIRED'
    //   });
    // }
    
    next();
  } catch (error) {
    logger.error('Session validation error', {
      error: error.message,
      userId: req.user?.id,
      sessionId: req.user?.sessionId
    });
    
    return res.status(500).json({
      success: false,
      error: 'Session validation failed',
      code: 'SESSION_VALIDATION_ERROR'
    });
  }
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate JWT Token
 */
const generateToken = (payload, options = {}) => {
  const defaultOptions = {
    algorithm: config.security.jwt.algorithm,
    expiresIn: config.security.jwt.expiresIn,
    issuer: config.security.jwt.issuer,
    audience: config.security.jwt.audience,
    jwtid: crypto.randomUUID()
  };
  
  return jwt.sign(payload, config.security.jwt.secret, {
    ...defaultOptions,
    ...options
  });
};

/**
 * Generate Refresh Token
 */
const generateRefreshToken = (userId, sessionId) => {
  return generateToken({
    sub: userId,
    type: TOKEN_TYPES.REFRESH,
    sessionId
  }, {
    expiresIn: '7d' // Refresh tokens last 7 days
  });
};

/**
 * Hash Password
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, config.security.bcrypt.rounds);
};

/**
 * Verify Password
 */
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate API Key
 */
const generateAPIKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// =============================================================================
// Export Middleware
// =============================================================================
module.exports = {
  // Authentication
  authenticateJWT,
  authenticateAPIKey,
  optionalAuth,
  
  // Authorization
  requireRole,
  requirePermission,
  requireAdmin,
  requireDeveloper,
  
  // Rate Limiting
  generalRateLimit,
  aiRateLimit,
  speedLimit,
  
  // Security
  securityHeaders,
  sanitizeInput,
  validateSession,
  
  // Utilities
  generateToken,
  generateRefreshToken,
  hashPassword,
  verifyPassword,
  generateAPIKey,
  
  // Constants
  TOKEN_TYPES,
  USER_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS
};

// =============================================================================
// End of File
// =============================================================================