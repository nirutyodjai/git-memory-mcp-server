/**
 * Authentication Middleware
 * Handles JWT token verification and user authorization
 */

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../generated/prisma');

class AuthMiddleware {
  constructor() {
    this.prisma = new PrismaClient();
    this.jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_key_for_development_only_change_in_production';
    this.requireAdmin = this.requireRole(['ADMIN']);
    this.requireModerator = this.requireRole(['ADMIN', 'MODERATOR']);
  }

  /**
   * Verify JWT token middleware
   */
  verifyToken = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          error: 'No authorization header provided'
        });
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'No token provided'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, this.jwtSecret);
      
      // Get user from database
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      // Add user to request object
      req.user = user;
      req.token = token;
      
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }
  };

  /**
   * Optional authentication - doesn't fail if no token
   */
  optionalAuth = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        req.user = null;
        return next();
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      if (!token) {
        req.user = null;
        return next();
      }

      // Verify token
      const decoded = jwt.verify(token, this.jwtSecret);
      
      // Get user from database
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true
        }
      });

      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      } else {
        req.user = null;
      }
      
      next();
    } catch (error) {
      // If token is invalid, just continue without user
      req.user = null;
      next();
    }
  };

  /**
   * Require specific role
   */
  requireRole = (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const userRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!Array.isArray(userRoles) || !userRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      next();
    };
  };



  /**
   * Check if user owns resource or is admin
   */
  requireOwnershipOrAdmin = (getResourceUserId) => {
    return async (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Admin can access everything
      if (req.user.role === 'ADMIN') {
        return next();
      }

      try {
        const resourceUserId = await getResourceUserId(req);
        
        if (req.user.id !== resourceUserId) {
          return res.status(403).json({
            success: false,
            error: 'Access denied - not resource owner'
          });
        }

        next();
      } catch (error) {
        console.error('Ownership check error:', error);
        return res.status(500).json({
          success: false,
          error: 'Authorization error'
        });
      }
    };
  };

  /**
   * Rate limiting middleware
   */
  rateLimit = (options = {}) => {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      maxRequests = 100,
      message = 'Too many requests'
    } = options;

    const requests = new Map();

    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      
      // Clean old entries
      for (const [ip, data] of requests.entries()) {
        if (now - data.resetTime > windowMs) {
          requests.delete(ip);
        }
      }

      // Get or create request data
      let requestData = requests.get(key);
      if (!requestData) {
        requestData = {
          count: 0,
          resetTime: now
        };
        requests.set(key, requestData);
      }

      // Reset if window expired
      if (now - requestData.resetTime > windowMs) {
        requestData.count = 0;
        requestData.resetTime = now;
      }

      // Check limit
      if (requestData.count >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: message,
          retryAfter: Math.ceil((requestData.resetTime + windowMs - now) / 1000)
        });
      }

      requestData.count++;
      next();
    };
  };

  /**
   * API key authentication
   */
  verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required'
      });
    }

    // In production, validate against database
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    
    if (!validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    next();
  };

  /**
   * CORS middleware
   */
  cors = (options = {}) => {
    const {
      origin = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders = ['Content-Type', 'Authorization', 'X-API-Key'],
      credentials = true
    } = options;

    return (req, res, next) => {
      const requestOrigin = req.headers.origin;
      
      if (origin.includes('*') || origin.includes(requestOrigin)) {
        res.header('Access-Control-Allow-Origin', requestOrigin || '*');
      }
      
      res.header('Access-Control-Allow-Methods', methods.join(', '));
      res.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      
      if (credentials) {
        res.header('Access-Control-Allow-Credentials', 'true');
      }

      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      next();
    };
  };

  /**
   * Request logging middleware
   */
  requestLogger = (req, res, next) => {
    const start = Date.now();
    const { method, url, ip } = req;
    const userAgent = req.headers['user-agent'];
    
    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${ip} - ${userAgent}`);
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${method} ${url} - ${res.statusCode} - ${duration}ms`);
    });

    next();
  };

  /**
   * Error handling middleware
   */
  errorHandler = (error, req, res, next) => {
    console.error('API Error:', error);

    // Prisma errors
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Resource already exists'
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    // Validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.message
      });
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    // Default error
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  };

  /**
   * Close database connection
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

module.exports = AuthMiddleware;