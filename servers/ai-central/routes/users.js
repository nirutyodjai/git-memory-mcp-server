/**
 * =============================================================================
 * NEXUS IDE - User Management Routes
 * =============================================================================
 * 
 * User management API endpoints for NEXUS IDE
 * 
 * Features:
 * - User registration and authentication
 * - Profile management
 * - Preferences and settings
 * - Team and collaboration management
 * - API key management
 * - Usage analytics and quotas
 * 
 * Author: NEXUS IDE Team
 * Version: 1.0.0
 * License: MIT
 * 
 * =============================================================================
 */

'use strict';

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');

const config = require('../config/config');
const logger = require('../utils/logger');
const { authenticate, authorize, generateToken, generateApiKey } = require('../middleware/auth');
const { monitor } = require('../utils/performance');
const DatabaseManager = require('../utils/database');
const CacheManager = require('../utils/cache');

// =============================================================================
// Router Setup
// =============================================================================

const router = express.Router();

// Initialize services
let db, cache;

async function initializeServices() {
  try {
    db = new DatabaseManager(config.database);
    cache = new CacheManager(config.cache);
    
    await db.connect();
    await cache.initialize();
    
    logger.info('User management services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize user management services', { error: error.message });
    throw error;
  }
}

initializeServices().catch(error => {
  logger.error('User management services initialization failed', { error: error.message });
});

// =============================================================================
// File Upload Configuration
// =============================================================================

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for profile images
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'), false);
    }
  }
});

// =============================================================================
// Rate Limiting
// =============================================================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    error: 'Authentication rate limit exceeded',
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    error: 'Registration rate limit exceeded',
    message: 'Too many registration attempts. Please try again later.'
  }
});

const profileLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 profile updates per minute
  message: {
    error: 'Profile update rate limit exceeded',
    message: 'Too many profile updates. Please try again later.'
  }
});

// =============================================================================
// Validation Middleware
// =============================================================================

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Request validation failed',
      details: errors.array(),
      requestId: req.id
    });
  }
  next();
};

// =============================================================================
// Authentication Routes
// =============================================================================

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register new user
 *     description: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: User password
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 description: Unique username
 *               full_name:
 *                 type: string
 *                 description: User's full name
 *               organization:
 *                 type: string
 *                 description: User's organization
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post('/register',
  registrationLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    body('username').isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_-]+$/),
    body('full_name').optional().isLength({ min: 1, max: 100 }),
    body('organization').optional().isLength({ min: 1, max: 100 })
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password, username, full_name, organization } = req.body;
      
      // Check if user already exists
      const existingUser = await db.findOne('users', {
        $or: [{ email }, { username }]
      });
      
      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          message: existingUser.email === email ? 'Email already registered' : 'Username already taken',
          requestId: req.id
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const user = {
        email,
        username,
        password: hashedPassword,
        fullName: full_name,
        organization,
        role: 'user',
        permissions: ['read', 'write'],
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            desktop: true
          },
          editor: {
            fontSize: 14,
            tabSize: 2,
            wordWrap: true,
            minimap: true
          }
        },
        usage: {
          apiCalls: 0,
          storageUsed: 0,
          lastActive: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        emailVerified: false
      };
      
      const result = await db.create('users', user);
      
      // Generate tokens
      const accessToken = generateToken({
        userId: result.insertedId,
        email,
        username,
        role: 'user'
      });
      
      const refreshToken = crypto.randomBytes(64).toString('hex');
      
      // Store refresh token
      await cache.set(`refresh_token:${result.insertedId}`, refreshToken, 7 * 24 * 60 * 60); // 7 days
      
      // Remove password from response
      delete user.password;
      user._id = result.insertedId;
      
      logger.info('User registered successfully', {
        userId: result.insertedId,
        email,
        username,
        requestId: req.id
      });
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: config.auth.jwt.expiresIn
        },
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 description: Email or username
 *               password:
 *                 type: string
 *                 description: User password
 *               remember_me:
 *                 type: boolean
 *                 default: false
 *                 description: Extended session duration
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login',
  authLimiter,
  [
    body('login').isLength({ min: 1 }),
    body('password').isLength({ min: 1 }),
    body('remember_me').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { login, password, remember_me = false } = req.body;
      
      // Find user by email or username
      const user = await db.findOne('users', {
        $or: [
          { email: login },
          { username: login }
        ],
        isActive: true
      });
      
      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email/username or password is incorrect',
          requestId: req.id
        });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email/username or password is incorrect',
          requestId: req.id
        });
      }
      
      // Generate tokens
      const tokenPayload = {
        userId: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      };
      
      const accessToken = generateToken(tokenPayload, remember_me ? '30d' : undefined);
      const refreshToken = crypto.randomBytes(64).toString('hex');
      
      // Store refresh token
      const refreshExpiry = remember_me ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days
      await cache.set(`refresh_token:${user._id}`, refreshToken, refreshExpiry);
      
      // Update last active
      await db.updateOne('users', 
        { _id: user._id },
        { 
          $set: { 
            'usage.lastActive': new Date(),
            updatedAt: new Date()
          },
          $inc: { 'usage.apiCalls': 1 }
        }
      );
      
      // Remove password from response
      delete user.password;
      
      logger.info('User logged in successfully', {
        userId: user._id,
        email: user.email,
        username: user.username,
        requestId: req.id
      });
      
      res.json({
        success: true,
        message: 'Login successful',
        user,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: remember_me ? '30d' : config.auth.jwt.expiresIn
        },
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /users/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Refresh access token using refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh',
  [
    body('refresh_token').isLength({ min: 1 })
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { refresh_token } = req.body;
      
      // Find user by refresh token
      const userIds = await cache.keys('refresh_token:*');
      let userId = null;
      
      for (const key of userIds) {
        const storedToken = await cache.get(key);
        if (storedToken === refresh_token) {
          userId = key.split(':')[1];
          break;
        }
      }
      
      if (!userId) {
        return res.status(401).json({
          error: 'Invalid refresh token',
          message: 'Refresh token is invalid or expired',
          requestId: req.id
        });
      }
      
      // Get user
      const user = await db.findOne('users', { _id: userId, isActive: true });
      
      if (!user) {
        return res.status(401).json({
          error: 'User not found',
          message: 'User associated with refresh token not found',
          requestId: req.id
        });
      }
      
      // Generate new access token
      const accessToken = generateToken({
        userId: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      });
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        tokens: {
          accessToken,
          expiresIn: config.auth.jwt.expiresIn
        },
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: User logout
 *     description: Logout user and invalidate tokens
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Refresh token to invalidate
 *               logout_all:
 *                 type: boolean
 *                 default: false
 *                 description: Logout from all devices
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout',
  authenticate,
  [
    body('refresh_token').optional().isString(),
    body('logout_all').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { refresh_token, logout_all = false } = req.body;
      const userId = req.user.id;
      
      if (logout_all) {
        // Remove all refresh tokens for user
        const keys = await cache.keys(`refresh_token:${userId}*`);
        for (const key of keys) {
          await cache.delete(key);
        }
      } else if (refresh_token) {
        // Remove specific refresh token
        await cache.delete(`refresh_token:${userId}`);
      }
      
      logger.info('User logged out', {
        userId,
        logoutAll: logout_all,
        requestId: req.id
      });
      
      res.json({
        success: true,
        message: 'Logout successful',
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Profile Management
// =============================================================================

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Get current user's profile information
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/profile',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const user = await db.findOne('users', 
        { _id: userId },
        { projection: { password: 0 } }
      );
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found',
          requestId: req.id
        });
      }
      
      res.json({
        success: true,
        user,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update current user's profile information
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: User's full name
 *               organization:
 *                 type: string
 *                 description: User's organization
 *               bio:
 *                 type: string
 *                 description: User biography
 *               location:
 *                 type: string
 *                 description: User location
 *               website:
 *                 type: string
 *                 format: uri
 *                 description: User website
 *               social_links:
 *                 type: object
 *                 description: Social media links
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile',
  authenticate,
  profileLimiter,
  [
    body('full_name').optional().isLength({ min: 1, max: 100 }),
    body('organization').optional().isLength({ min: 1, max: 100 }),
    body('bio').optional().isLength({ max: 500 }),
    body('location').optional().isLength({ max: 100 }),
    body('website').optional().isURL(),
    body('social_links').optional().isObject()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      // Remove undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      updateData.updatedAt = new Date();
      
      const result = await db.updateOne('users',
        { _id: userId },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found',
          requestId: req.id
        });
      }
      
      // Get updated user
      const user = await db.findOne('users',
        { _id: userId },
        { projection: { password: 0 } }
      );
      
      logger.info('User profile updated', {
        userId,
        updatedFields: Object.keys(updateData),
        requestId: req.id
      });
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        user,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /users/profile/avatar:
 *   post:
 *     summary: Upload profile avatar
 *     description: Upload or update user's profile avatar
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 */
router.post('/profile/avatar',
  authenticate,
  profileLimiter,
  upload.single('avatar'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file provided',
          message: 'Avatar image file is required',
          requestId: req.id
        });
      }
      
      const userId = req.user.id;
      
      // In a real implementation, you would upload to cloud storage
      // For now, we'll just store the file info
      const avatarData = {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date()
      };
      
      const result = await db.updateOne('users',
        { _id: userId },
        { 
          $set: { 
            avatar: avatarData,
            updatedAt: new Date()
          }
        }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found',
          requestId: req.id
        });
      }
      
      logger.info('User avatar updated', {
        userId,
        filename: req.file.originalname,
        size: req.file.size,
        requestId: req.id
      });
      
      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        avatar: avatarData,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// User Preferences
// =============================================================================

/**
 * @swagger
 * /users/preferences:
 *   get:
 *     summary: Get user preferences
 *     description: Get current user's preferences and settings
 *     tags: [Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preferences
 */
router.get('/preferences',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const user = await db.findOne('users',
        { _id: userId },
        { projection: { preferences: 1 } }
      );
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User preferences not found',
          requestId: req.id
        });
      }
      
      res.json({
        success: true,
        preferences: user.preferences || {},
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /users/preferences:
 *   put:
 *     summary: Update user preferences
 *     description: Update current user's preferences and settings
 *     tags: [Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [light, dark, auto]
 *                 description: UI theme preference
 *               language:
 *                 type: string
 *                 description: Language preference
 *               notifications:
 *                 type: object
 *                 description: Notification preferences
 *               editor:
 *                 type: object
 *                 description: Editor preferences
 *               ai:
 *                 type: object
 *                 description: AI assistant preferences
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 */
router.put('/preferences',
  authenticate,
  profileLimiter,
  [
    body('theme').optional().isIn(['light', 'dark', 'auto']),
    body('language').optional().isString(),
    body('notifications').optional().isObject(),
    body('editor').optional().isObject(),
    body('ai').optional().isObject()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const preferences = req.body;
      
      const result = await db.updateOne('users',
        { _id: userId },
        { 
          $set: { 
            preferences: {
              ...preferences
            },
            updatedAt: new Date()
          }
        }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User preferences not found',
          requestId: req.id
        });
      }
      
      logger.info('User preferences updated', {
        userId,
        updatedPreferences: Object.keys(preferences),
        requestId: req.id
      });
      
      res.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// API Key Management
// =============================================================================

/**
 * @swagger
 * /users/api-keys:
 *   get:
 *     summary: Get user API keys
 *     description: Get list of user's API keys
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 */
router.get('/api-keys',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const apiKeys = await db.find('api_keys',
        { userId, isActive: true },
        { 
          projection: { 
            key: 0 // Don't return the actual key
          },
          sort: { createdAt: -1 }
        }
      );
      
      res.json({
        success: true,
        apiKeys,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /users/api-keys:
 *   post:
 *     summary: Create API key
 *     description: Create a new API key for the user
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: API key name
 *               description:
 *                 type: string
 *                 description: API key description
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: API key permissions
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *                 description: API key expiration date
 *     responses:
 *       201:
 *         description: API key created successfully
 */
router.post('/api-keys',
  authenticate,
  [
    body('name').isLength({ min: 1, max: 100 }),
    body('description').optional().isLength({ max: 500 }),
    body('permissions').optional().isArray(),
    body('expires_at').optional().isISO8601()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { name, description, permissions = ['read'], expires_at } = req.body;
      
      // Generate API key
      const apiKey = generateApiKey();
      
      const keyData = {
        userId,
        name,
        description,
        key: apiKey,
        permissions,
        expiresAt: expires_at ? new Date(expires_at) : null,
        usage: {
          calls: 0,
          lastUsed: null
        },
        createdAt: new Date(),
        isActive: true
      };
      
      const result = await db.create('api_keys', keyData);
      
      // Remove the actual key from the response data
      delete keyData.key;
      keyData._id = result.insertedId;
      
      logger.info('API key created', {
        userId,
        keyId: result.insertedId,
        name,
        requestId: req.id
      });
      
      res.status(201).json({
        success: true,
        message: 'API key created successfully',
        apiKey: {
          ...keyData,
          key: apiKey // Only show the key once during creation
        },
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /users/api-keys/{keyId}:
 *   delete:
 *     summary: Delete API key
 *     description: Delete an API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: API key ID
 *     responses:
 *       200:
 *         description: API key deleted successfully
 */
router.delete('/api-keys/:keyId',
  authenticate,
  [
    param('keyId').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { keyId } = req.params;
      
      const result = await db.updateOne('api_keys',
        { _id: keyId, userId },
        { 
          $set: { 
            isActive: false,
            deletedAt: new Date()
          }
        }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({
          error: 'API key not found',
          message: 'API key not found or access denied',
          requestId: req.id
        });
      }
      
      logger.info('API key deleted', {
        userId,
        keyId,
        requestId: req.id
      });
      
      res.json({
        success: true,
        message: 'API key deleted successfully',
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Usage Analytics
// =============================================================================

/**
 * @swagger
 * /users/usage:
 *   get:
 *     summary: Get usage analytics
 *     description: Get current user's usage analytics and quotas
 *     tags: [Usage Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Analytics timeframe
 *     responses:
 *       200:
 *         description: Usage analytics
 */
router.get('/usage',
  authenticate,
  [
    query('timeframe').optional().isIn(['day', 'week', 'month', 'year'])
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { timeframe = 'month' } = req.query;
      
      // Get user usage data
      const user = await db.findOne('users',
        { _id: userId },
        { projection: { usage: 1, role: 1 } }
      );
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User usage data not found',
          requestId: req.id
        });
      }
      
      // Calculate timeframe dates
      const now = new Date();
      let startDate;
      
      switch (timeframe) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      // Get detailed usage analytics (this would be more complex in a real implementation)
      const analytics = {
        current: user.usage,
        timeframe: {
          period: timeframe,
          startDate,
          endDate: now
        },
        quotas: {
          apiCalls: {
            limit: user.role === 'premium' ? 100000 : 10000,
            used: user.usage.apiCalls || 0
          },
          storage: {
            limit: user.role === 'premium' ? 10 * 1024 * 1024 * 1024 : 1024 * 1024 * 1024, // 10GB or 1GB
            used: user.usage.storageUsed || 0
          }
        }
      };
      
      res.json({
        success: true,
        analytics,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Password Management
// =============================================================================

/**
 * @swagger
 * /users/change-password:
 *   post:
 *     summary: Change password
 *     description: Change user's password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 description: Current password
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post('/change-password',
  authenticate,
  authLimiter,
  [
    body('current_password').isLength({ min: 1 }),
    body('new_password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { current_password, new_password } = req.body;
      
      // Get user with password
      const user = await db.findOne('users', { _id: userId });
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User not found',
          requestId: req.id
        });
      }
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(current_password, user.password);
      
      if (!isValidPassword) {
        return res.status(400).json({
          error: 'Invalid current password',
          message: 'Current password is incorrect',
          requestId: req.id
        });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 12);
      
      // Update password
      await db.updateOne('users',
        { _id: userId },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          }
        }
      );
      
      // Invalidate all refresh tokens
      const keys = await cache.keys(`refresh_token:${userId}*`);
      for (const key of keys) {
        await cache.delete(key);
      }
      
      logger.info('User password changed', {
        userId,
        requestId: req.id
      });
      
      res.json({
        success: true,
        message: 'Password changed successfully',
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Error Handling
// =============================================================================

router.use((error, req, res, next) => {
  logger.error('User Management Route Error', {
    error: error.message,
    stack: error.stack,
    requestId: req.id,
    userId: req.user?.id,
    endpoint: req.originalUrl
  });
  
  // Handle specific user management errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.name === 'AuthenticationError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: error.message,
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.name === 'AuthorizationError') {
    return res.status(403).json({
      error: 'Authorization Error',
      message: error.message,
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }
  
  next(error);
});

// =============================================================================
// Export
// =============================================================================

module.exports = router;

// =============================================================================
// End of File
// =============================================================================