/**
 * =============================================================================
 * NEXUS IDE - AI Central Server API Routes
 * =============================================================================
 * 
 * Main routing configuration for AI Central Server
 * 
 * Features:
 * - RESTful API endpoints
 * - GraphQL integration
 * - WebSocket routing
 * - Authentication and authorization
 * - Rate limiting
 * - Request validation
 * - Error handling
 * - API documentation
 * 
 * Author: NEXUS IDE Team
 * Version: 1.0.0
 * License: MIT
 * 
 * =============================================================================
 */

'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, query, param, validationResult } = require('express-validator');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const config = require('../config/config');
const logger = require('../utils/logger');
const { authenticate, authorize } = require('../middleware/auth');
const { monitor } = require('../utils/performance');

// Import route modules
const aiRoutes = require('./ai');
const codeRoutes = require('./code');
const conversationRoutes = require('./conversation');
const debugRoutes = require('./debug');
const optimizationRoutes = require('./optimization');
const projectRoutes = require('./project');
const userRoutes = require('./user');
const adminRoutes = require('./admin');
const healthRoutes = require('./health');
const metricsRoutes = require('./metrics');

// =============================================================================
// Router Setup
// =============================================================================

const router = express.Router();

// =============================================================================
// Middleware
// =============================================================================

// Security middleware
router.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
router.use(cors({
  origin: config.cors.origins,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Request-ID',
    'X-Client-Version',
    'X-User-Agent'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ]
}));

// Compression
router.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024
}));

// Request parsing
router.use(express.json({ 
  limit: config.api.maxRequestSize,
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
router.use(express.urlencoded({ 
  extended: true, 
  limit: config.api.maxRequestSize 
}));

// Performance monitoring
router.use(monitor.requestTrackingMiddleware());

// Request ID middleware
router.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || 
           `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Request logging
router.use((req, res, next) => {
  logger.info('API Request', {
    requestId: req.id,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
});

// =============================================================================
// Rate Limiting
// =============================================================================

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.general.windowMs,
  max: config.rateLimit.general.max,
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(config.rateLimit.general.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip + ':' + (req.user?.id || 'anonymous');
  }
});

// AI-specific rate limiting
const aiLimiter = rateLimit({
  windowMs: config.rateLimit.ai.windowMs,
  max: config.rateLimit.ai.max,
  message: {
    error: 'AI rate limit exceeded',
    message: 'Too many AI requests. Please try again later.',
    retryAfter: Math.ceil(config.rateLimit.ai.windowMs / 1000)
  },
  keyGenerator: (req) => {
    return req.ip + ':ai:' + (req.user?.id || 'anonymous');
  }
});

// Authentication rate limiting
const authLimiter = rateLimit({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.max,
  message: {
    error: 'Authentication rate limit exceeded',
    message: 'Too many authentication attempts. Please try again later.',
    retryAfter: Math.ceil(config.rateLimit.auth.windowMs / 1000)
  },
  skipSuccessfulRequests: true
});

// Apply general rate limiting
router.use(generalLimiter);

// =============================================================================
// Validation Middleware
// =============================================================================

/**
 * Validation error handler
 */
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
// API Documentation
// =============================================================================

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NEXUS IDE AI Central Server API',
      version: '1.0.0',
      description: 'Comprehensive AI-powered development server for NEXUS IDE',
      contact: {
        name: 'NEXUS IDE Team',
        email: 'support@nexuside.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: config.server.baseUrl,
        description: 'Production server'
      },
      {
        url: 'http://localhost:' + config.server.port,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'object' },
            requestId: { type: 'string' },
            timestamp: { type: 'string' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
            requestId: { type: 'string' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    security: [
      { bearerAuth: [] },
      { apiKeyAuth: [] }
    ]
  },
  apis: ['./routes/*.js', './routes/**/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve API documentation
if (config.api.documentation.enabled) {
  router.use('/docs', swaggerUi.serve);
  router.get('/docs', swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'NEXUS IDE API Documentation'
  }));
  
  // Serve OpenAPI spec
  router.get('/docs/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// =============================================================================
// Root Routes
// =============================================================================

/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     description: Returns basic API information and status
 *     tags: [General]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: NEXUS IDE AI Central Server
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 status:
 *                   type: string
 *                   example: operational
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/', (req, res) => {
  res.json({
    name: 'NEXUS IDE AI Central Server',
    version: '1.0.0',
    status: 'operational',
    description: 'AI-powered development server for NEXUS IDE',
    endpoints: {
      documentation: '/api/docs',
      health: '/api/health',
      metrics: '/api/metrics',
      ai: '/api/ai',
      code: '/api/code',
      conversation: '/api/conversation',
      debug: '/api/debug',
      optimization: '/api/optimization'
    },
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

// =============================================================================
// Health Check Routes
// =============================================================================

router.use('/health', healthRoutes);

// =============================================================================
// Metrics Routes
// =============================================================================

router.use('/metrics', authenticate, metricsRoutes);

// =============================================================================
// Authentication Routes
// =============================================================================

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return JWT token
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
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/auth/login', 
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 })
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      // Login logic would be implemented here
      res.json({
        success: true,
        message: 'Login successful',
        token: 'jwt-token-here',
        user: {
          id: 'user-id',
          email: req.body.email,
          name: 'User Name'
        },
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Invalidate user session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/auth/logout', authenticate, async (req, res, next) => {
  try {
    // Logout logic would be implemented here
    res.json({
      success: true,
      message: 'Logout successful',
      requestId: req.id
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// User Routes
// =============================================================================

router.use('/users', authenticate, userRoutes);

// =============================================================================
// AI Routes
// =============================================================================

router.use('/ai', authenticate, aiLimiter, aiRoutes);

// =============================================================================
// Code Routes
// =============================================================================

router.use('/code', authenticate, codeRoutes);

// =============================================================================
// Conversation Routes
// =============================================================================

router.use('/conversation', authenticate, conversationRoutes);

// =============================================================================
// Debug Routes
// =============================================================================

router.use('/debug', authenticate, debugRoutes);

// =============================================================================
// Optimization Routes
// =============================================================================

router.use('/optimization', authenticate, optimizationRoutes);

// =============================================================================
// Project Routes
// =============================================================================

router.use('/projects', authenticate, projectRoutes);

// =============================================================================
// Admin Routes
// =============================================================================

router.use('/admin', authenticate, authorize(['admin']), adminRoutes);

// =============================================================================
// WebSocket Routes
// =============================================================================

/**
 * WebSocket connection handler
 */
function setupWebSocketRoutes(io) {
  // AI namespace
  const aiNamespace = io.of('/ai');
  aiNamespace.use(async (socket, next) => {
    try {
      // WebSocket authentication
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      // Verify token and attach user
      // socket.user = await verifyToken(token);
      next();
    } catch (error) {
      next(error);
    }
  });
  
  aiNamespace.on('connection', (socket) => {
    logger.info('AI WebSocket connection established', {
      socketId: socket.id,
      userId: socket.user?.id
    });
    
    // AI chat events
    socket.on('ai:chat', async (data) => {
      try {
        // Handle AI chat message
        const response = await handleAIChat(data, socket.user);
        socket.emit('ai:response', response);
      } catch (error) {
        socket.emit('ai:error', {
          error: error.message,
          requestId: data.requestId
        });
      }
    });
    
    // Code completion events
    socket.on('code:complete', async (data) => {
      try {
        const completion = await handleCodeCompletion(data, socket.user);
        socket.emit('code:completion', completion);
      } catch (error) {
        socket.emit('code:error', {
          error: error.message,
          requestId: data.requestId
        });
      }
    });
    
    socket.on('disconnect', () => {
      logger.info('AI WebSocket connection closed', {
        socketId: socket.id,
        userId: socket.user?.id
      });
    });
  });
  
  // Collaboration namespace
  const collabNamespace = io.of('/collaboration');
  collabNamespace.use(async (socket, next) => {
    // Authentication middleware
    next();
  });
  
  collabNamespace.on('connection', (socket) => {
    logger.info('Collaboration WebSocket connection established', {
      socketId: socket.id,
      userId: socket.user?.id
    });
    
    // Join project room
    socket.on('project:join', (projectId) => {
      socket.join(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('user:joined', {
        userId: socket.user.id,
        userName: socket.user.name
      });
    });
    
    // Leave project room
    socket.on('project:leave', (projectId) => {
      socket.leave(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('user:left', {
        userId: socket.user.id
      });
    });
    
    // Code changes
    socket.on('code:change', (data) => {
      socket.to(`project:${data.projectId}`).emit('code:change', {
        ...data,
        userId: socket.user.id,
        timestamp: Date.now()
      });
    });
    
    // Cursor position
    socket.on('cursor:position', (data) => {
      socket.to(`project:${data.projectId}`).emit('cursor:position', {
        ...data,
        userId: socket.user.id,
        timestamp: Date.now()
      });
    });
    
    socket.on('disconnect', () => {
      logger.info('Collaboration WebSocket connection closed', {
        socketId: socket.id,
        userId: socket.user?.id
      });
    });
  });
}

// =============================================================================
// Error Handling
// =============================================================================

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
router.use((error, req, res, next) => {
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    requestId: req.id,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    error: error.name || 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
    ...(isDevelopment && { stack: error.stack }),
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Handle AI chat message
 */
async function handleAIChat(data, user) {
  // This would integrate with the AI conversation system
  return {
    id: Date.now().toString(),
    message: 'AI response to: ' + data.message,
    timestamp: Date.now(),
    requestId: data.requestId
  };
}

/**
 * Handle code completion
 */
async function handleCodeCompletion(data, user) {
  // This would integrate with the AI code features
  return {
    completions: [
      {
        text: 'console.log(',
        kind: 'function',
        detail: 'Log to console'
      }
    ],
    requestId: data.requestId
  };
}

// =============================================================================
// Export
// =============================================================================

module.exports = {
  router,
  setupWebSocketRoutes
};

// =============================================================================
// End of File
// =============================================================================