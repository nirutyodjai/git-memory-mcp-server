/**
 * Authentication Service
 * Handles user authentication, authorization, and session management
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../utils/logger');
const UserService = require('./user-service');

class AuthService {
  constructor(options = {}) {
    this.jwtSecret = options.jwtSecret || process.env.JWT_SECRET || this.generateSecret();
    this.jwtExpiresIn = options.jwtExpiresIn || process.env.JWT_EXPIRES_IN || '24h';
    this.refreshTokenExpiresIn = options.refreshTokenExpiresIn || '7d';
    this.saltRounds = options.saltRounds || 12;
    this.userService = new UserService();
    
    // Session storage (in production, use Redis or database)
    this.sessions = new Map();
    this.refreshTokens = new Map();
    
    this.isInitialized = false;
    
    logger.info('AuthService initialized', {
      jwtExpiresIn: this.jwtExpiresIn,
      refreshTokenExpiresIn: this.refreshTokenExpiresIn
    });
  }

  /**
   * Initialize the Authentication Service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Initialize user service if it has initialize method
      if (this.userService.initialize) {
        await this.userService.initialize();
      }
      this.isInitialized = true;
      logger.info('Authentication Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Authentication Service', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate a secure secret key
   * @returns {string} Generated secret
   */
  generateSecret() {
    const secret = crypto.randomBytes(64).toString('hex');
    logger.warn('Generated JWT secret. In production, set JWT_SECRET environment variable');
    return secret;
  }

  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    try {
      const hash = await bcrypt.hash(password, this.saltRounds);
      logger.debug('Password hashed successfully');
      return hash;
    } catch (error) {
      logger.error('Failed to hash password', { error: error.message });
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Verification result
   */
  async verifyPassword(password, hash) {
    try {
      const isValid = await bcrypt.compare(password, hash);
      logger.debug('Password verification completed', { isValid });
      return isValid;
    } catch (error) {
      logger.error('Failed to verify password', { error: error.message });
      throw new Error('Password verification failed');
    }
  }

  /**
   * Generate JWT token
   * @param {Object} payload - Token payload
   * @param {Object} options - Token options
   * @returns {string} JWT token
   */
  generateToken(payload, options = {}) {
    try {
      const tokenOptions = {
        expiresIn: options.expiresIn || this.jwtExpiresIn,
        issuer: options.issuer || 'git-memory-mcp-server',
        audience: options.audience || 'mcp-client'
      };
      
      const token = jwt.sign(payload, this.jwtSecret, tokenOptions);
      
      logger.debug('JWT token generated', {
        userId: payload.userId,
        expiresIn: tokenOptions.expiresIn
      });
      
      return token;
    } catch (error) {
      logger.error('Failed to generate JWT token', { error: error.message });
      throw new Error('Token generation failed');
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      
      logger.debug('JWT token verified', {
        userId: decoded.userId,
        exp: new Date(decoded.exp * 1000)
      });
      
      return decoded;
    } catch (error) {
      logger.warn('JWT token verification failed', {
        error: error.message,
        token: token.substring(0, 20) + '...'
      });
      
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Generate refresh token
   * @param {string} userId - User ID
   * @returns {string} Refresh token
   */
  generateRefreshToken(userId) {
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + this.parseTimeToMs(this.refreshTokenExpiresIn));
    
    this.refreshTokens.set(refreshToken, {
      userId,
      expiresAt,
      createdAt: new Date()
    });
    
    logger.debug('Refresh token generated', {
      userId,
      expiresAt
    });
    
    return refreshToken;
  }

  /**
   * Verify refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Object|null} Token data or null if invalid
   */
  verifyRefreshToken(refreshToken) {
    const tokenData = this.refreshTokens.get(refreshToken);
    
    if (!tokenData) {
      logger.warn('Refresh token not found', { refreshToken: refreshToken.substring(0, 20) + '...' });
      return null;
    }
    
    if (tokenData.expiresAt < new Date()) {
      logger.warn('Refresh token expired', {
        userId: tokenData.userId,
        expiresAt: tokenData.expiresAt
      });
      this.refreshTokens.delete(refreshToken);
      return null;
    }
    
    logger.debug('Refresh token verified', {
      userId: tokenData.userId
    });
    
    return tokenData;
  }

  /**
   * Revoke refresh token
   * @param {string} refreshToken - Refresh token to revoke
   * @returns {boolean} Success status
   */
  revokeRefreshToken(refreshToken) {
    const success = this.refreshTokens.delete(refreshToken);
    
    logger.debug('Refresh token revoked', {
      refreshToken: refreshToken.substring(0, 20) + '...',
      success
    });
    
    return success;
  }

  /**
   * Authenticate user with credentials
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Authentication result
   */
  async authenticate(email, password) {
    try {
      logger.info('Authentication attempt', { email });
      
      // Get user by email
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        logger.warn('Authentication failed: user not found', { email });
        throw new Error('Invalid credentials');
      }
      
      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.password);
      if (!isValidPassword) {
        logger.warn('Authentication failed: invalid password', { email, userId: user.id });
        throw new Error('Invalid credentials');
      }
      
      // Check if user is active
      if (!user.isActive) {
        logger.warn('Authentication failed: user inactive', { email, userId: user.id });
        throw new Error('Account is inactive');
      }
      
      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };
      
      const accessToken = this.generateToken(tokenPayload);
      const refreshToken = this.generateRefreshToken(user.id);
      
      // Create session
      const sessionId = this.createSession(user.id, {
        email: user.email,
        role: user.role,
        loginTime: new Date()
      });
      
      logger.info('Authentication successful', {
        userId: user.id,
        email: user.email,
        sessionId
      });
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: this.jwtExpiresIn
        },
        sessionId
      };
    } catch (error) {
      logger.error('Authentication error', {
        email,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshAccessToken(refreshToken) {
    try {
      const tokenData = this.verifyRefreshToken(refreshToken);
      if (!tokenData) {
        throw new Error('Invalid refresh token');
      }
      
      // Get user data
      const user = await this.userService.getUserById(tokenData.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }
      
      // Generate new access token
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };
      
      const newAccessToken = this.generateToken(tokenPayload);
      
      logger.info('Access token refreshed', {
        userId: user.id,
        email: user.email
      });
      
      return {
        success: true,
        accessToken: newAccessToken,
        expiresIn: this.jwtExpiresIn
      };
    } catch (error) {
      logger.error('Token refresh error', { error: error.message });
      throw error;
    }
  }

  /**
   * Create user session
   * @param {string} userId - User ID
   * @param {Object} sessionData - Session data
   * @returns {string} Session ID
   */
  createSession(userId, sessionData) {
    const sessionId = crypto.randomUUID();
    
    this.sessions.set(sessionId, {
      userId,
      ...sessionData,
      createdAt: new Date(),
      lastActivity: new Date()
    });
    
    logger.debug('Session created', { userId, sessionId });
    
    return sessionId;
  }

  /**
   * Get session data
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session data or null if not found
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      // Update last activity
      session.lastActivity = new Date();
      logger.debug('Session accessed', {
        sessionId,
        userId: session.userId
      });
    }
    
    return session;
  }

  /**
   * Destroy session
   * @param {string} sessionId - Session ID
   * @returns {boolean} Success status
   */
  destroySession(sessionId) {
    const success = this.sessions.delete(sessionId);
    
    logger.debug('Session destroyed', {
      sessionId,
      success
    });
    
    return success;
  }

  /**
   * Logout user
   * @param {string} sessionId - Session ID
   * @param {string} refreshToken - Refresh token
   * @returns {Object} Logout result
   */
  async logout(sessionId, refreshToken) {
    try {
      const session = this.getSession(sessionId);
      
      // Destroy session
      this.destroySession(sessionId);
      
      // Revoke refresh token
      if (refreshToken) {
        this.revokeRefreshToken(refreshToken);
      }
      
      logger.info('User logged out', {
        sessionId,
        userId: session?.userId
      });
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      logger.error('Logout error', { error: error.message });
      throw error;
    }
  }

  /**
   * Parse time string to milliseconds
   * @param {string} timeStr - Time string (e.g., '24h', '7d')
   * @returns {number} Milliseconds
   */
  parseTimeToMs(timeStr) {
    const units = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    };
    
    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }
    
    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  /**
   * Clean up expired tokens and sessions
   */
  cleanup() {
    const now = new Date();
    let cleanedTokens = 0;
    let cleanedSessions = 0;
    
    // Clean expired refresh tokens
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.expiresAt < now) {
        this.refreshTokens.delete(token);
        cleanedTokens++;
      }
    }
    
    // Clean old sessions (older than 24 hours of inactivity)
    const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > sessionTimeout) {
        this.sessions.delete(sessionId);
        cleanedSessions++;
      }
    }
    
    if (cleanedTokens > 0 || cleanedSessions > 0) {
      logger.info('Cleanup completed', {
        cleanedTokens,
        cleanedSessions
      });
    }
  }

  /**
   * Get authentication statistics
   * @returns {Object} Auth statistics
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      activeRefreshTokens: this.refreshTokens.size,
      jwtExpiresIn: this.jwtExpiresIn,
      refreshTokenExpiresIn: this.refreshTokenExpiresIn
    };
  }
}

module.exports = AuthService;