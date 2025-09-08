/**
 * =============================================================================
 * NEXUS IDE - AI Routes
 * =============================================================================
 * 
 * AI-related API endpoints for NEXUS IDE
 * 
 * Features:
 * - Multi-model AI integration
 * - Chat completions
 * - Code generation
 * - Text analysis
 * - Model management
 * - Streaming responses
 * - Context management
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

const config = require('../config/config');
const logger = require('../utils/logger');
const { authorize } = require('../middleware/auth');
const { monitor } = require('../utils/performance');
const AIModelsIntegration = require('../ai-models-integration');
const AICodeFeatures = require('../ai-code-features');
const AIConversation = require('../ai-conversation');

// =============================================================================
// Router Setup
// =============================================================================

const router = express.Router();

// Initialize AI services
let aiModels, aiCodeFeatures, aiConversation;

// Initialize services
async function initializeServices() {
  try {
    aiModels = new AIModelsIntegration(config.ai);
    aiCodeFeatures = new AICodeFeatures(aiModels, config.ai.codeFeatures);
    aiConversation = new AIConversation(aiModels, aiCodeFeatures, config.ai.conversation);
    
    await aiModels.initialize();
    await aiCodeFeatures.initialize();
    await aiConversation.initialize();
    
    logger.info('AI services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize AI services', { error: error.message });
    throw error;
  }
}

// Initialize on module load
initializeServices().catch(error => {
  logger.error('AI services initialization failed', { error: error.message });
});

// =============================================================================
// Rate Limiting
// =============================================================================

// Heavy AI operations rate limiting
const heavyAILimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    error: 'Heavy AI rate limit exceeded',
    message: 'Too many heavy AI requests. Please try again later.'
  },
  keyGenerator: (req) => {
    return req.ip + ':heavy-ai:' + (req.user?.id || 'anonymous');
  }
});

// Streaming rate limiting
const streamingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 streaming requests per minute
  message: {
    error: 'Streaming rate limit exceeded',
    message: 'Too many streaming requests. Please try again later.'
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
// AI Models Management
// =============================================================================

/**
 * @swagger
 * /ai/models:
 *   get:
 *     summary: Get available AI models
 *     description: Returns list of available AI models and their capabilities
 *     tags: [AI Models]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available models
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 models:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       provider:
 *                         type: string
 *                       capabilities:
 *                         type: array
 *                         items:
 *                           type: string
 *                       status:
 *                         type: string
 */
router.get('/models', async (req, res, next) => {
  try {
    const models = await aiModels.getAvailableModels();
    
    res.json({
      success: true,
      models: models,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /ai/models/{modelId}/status:
 *   get:
 *     summary: Get model status
 *     description: Returns the current status and health of a specific AI model
 *     tags: [AI Models]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *         description: The model ID
 *     responses:
 *       200:
 *         description: Model status information
 */
router.get('/models/:modelId/status',
  [
    param('modelId').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { modelId } = req.params;
      const status = await aiModels.getModelStatus(modelId);
      
      res.json({
        success: true,
        model: modelId,
        status: status,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Chat Completions
// =============================================================================

/**
 * @swagger
 * /ai/chat/completions:
 *   post:
 *     summary: Create chat completion
 *     description: Generate AI chat completion using specified model
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               model:
 *                 type: string
 *                 description: AI model to use
 *                 default: gpt-4
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [system, user, assistant]
 *                     content:
 *                       type: string
 *               temperature:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 2
 *                 default: 0.7
 *               max_tokens:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 4096
 *               stream:
 *                 type: boolean
 *                 default: false
 *               context:
 *                 type: object
 *                 description: Additional context information
 *     responses:
 *       200:
 *         description: Chat completion response
 */
router.post('/chat/completions',
  heavyAILimiter,
  [
    body('messages').isArray().notEmpty(),
    body('messages.*.role').isIn(['system', 'user', 'assistant']),
    body('messages.*.content').isString().notEmpty(),
    body('model').optional().isString(),
    body('temperature').optional().isFloat({ min: 0, max: 2 }),
    body('max_tokens').optional().isInt({ min: 1, max: 4096 }),
    body('stream').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const {
        model = 'gpt-4',
        messages,
        temperature = 0.7,
        max_tokens = 1000,
        stream = false,
        context = {}
      } = req.body;
      
      const requestData = {
        model,
        messages,
        temperature,
        max_tokens,
        stream,
        context: {
          ...context,
          userId: req.user.id,
          requestId: req.id,
          timestamp: Date.now()
        }
      };
      
      if (stream) {
        // Handle streaming response
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });
        
        const streamHandler = (chunk) => {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        };
        
        const endHandler = () => {
          res.write('data: [DONE]\n\n');
          res.end();
        };
        
        const errorHandler = (error) => {
          res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          res.end();
        };
        
        await aiModels.streamChatCompletion(requestData, streamHandler, endHandler, errorHandler);
      } else {
        // Handle regular response
        const response = await aiModels.createChatCompletion(requestData);
        
        res.json({
          success: true,
          ...response,
          requestId: req.id,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Code Features
// =============================================================================

/**
 * @swagger
 * /ai/code/complete:
 *   post:
 *     summary: Code completion
 *     description: Generate code completions based on context
 *     tags: [AI Code]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - language
 *               - position
 *             properties:
 *               code:
 *                 type: string
 *                 description: Current code content
 *               language:
 *                 type: string
 *                 description: Programming language
 *               position:
 *                 type: object
 *                 properties:
 *                   line:
 *                     type: integer
 *                   column:
 *                     type: integer
 *               context:
 *                 type: object
 *                 description: Additional context
 *     responses:
 *       200:
 *         description: Code completion suggestions
 */
router.post('/code/complete',
  [
    body('code').isString(),
    body('language').isString().notEmpty(),
    body('position').isObject(),
    body('position.line').isInt({ min: 0 }),
    body('position.column').isInt({ min: 0 })
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { code, language, position, context = {} } = req.body;
      
      const completions = await aiCodeFeatures.generateCompletion({
        code,
        language,
        position,
        context: {
          ...context,
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        completions,
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
 * /ai/code/generate:
 *   post:
 *     summary: Generate code
 *     description: Generate code from natural language description
 *     tags: [AI Code]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - language
 *             properties:
 *               description:
 *                 type: string
 *                 description: Natural language description of desired code
 *               language:
 *                 type: string
 *                 description: Target programming language
 *               style:
 *                 type: string
 *                 description: Code style preferences
 *               context:
 *                 type: object
 *                 description: Additional context
 *     responses:
 *       200:
 *         description: Generated code
 */
router.post('/code/generate',
  heavyAILimiter,
  [
    body('description').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('style').optional().isString()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { description, language, style, context = {} } = req.body;
      
      const generatedCode = await aiCodeFeatures.generateCode({
        description,
        language,
        style,
        context: {
          ...context,
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        code: generatedCode,
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
 * /ai/code/explain:
 *   post:
 *     summary: Explain code
 *     description: Generate explanation for provided code
 *     tags: [AI Code]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - language
 *             properties:
 *               code:
 *                 type: string
 *                 description: Code to explain
 *               language:
 *                 type: string
 *                 description: Programming language
 *               detail_level:
 *                 type: string
 *                 enum: [basic, detailed, expert]
 *                 default: detailed
 *     responses:
 *       200:
 *         description: Code explanation
 */
router.post('/code/explain',
  [
    body('code').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('detail_level').optional().isIn(['basic', 'detailed', 'expert'])
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { code, language, detail_level = 'detailed' } = req.body;
      
      const explanation = await aiCodeFeatures.explainCode({
        code,
        language,
        detailLevel: detail_level,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        explanation,
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
 * /ai/code/review:
 *   post:
 *     summary: Review code
 *     description: Perform AI-powered code review
 *     tags: [AI Code]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - language
 *             properties:
 *               code:
 *                 type: string
 *                 description: Code to review
 *               language:
 *                 type: string
 *                 description: Programming language
 *               focus_areas:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [performance, security, maintainability, style, bugs]
 *                 description: Areas to focus on during review
 *     responses:
 *       200:
 *         description: Code review results
 */
router.post('/code/review',
  heavyAILimiter,
  [
    body('code').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('focus_areas').optional().isArray(),
    body('focus_areas.*').optional().isIn(['performance', 'security', 'maintainability', 'style', 'bugs'])
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { code, language, focus_areas = ['bugs', 'performance', 'security'] } = req.body;
      
      const review = await aiCodeFeatures.reviewCode({
        code,
        language,
        focusAreas: focus_areas,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        review,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Conversation Management
// =============================================================================

/**
 * @swagger
 * /ai/conversations:
 *   get:
 *     summary: Get user conversations
 *     description: Retrieve user's AI conversation history
 *     tags: [AI Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/conversations',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { limit = 20, offset = 0 } = req.query;
      
      const conversations = await aiConversation.getUserConversations(req.user.id, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      res.json({
        success: true,
        conversations,
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
 * /ai/conversations:
 *   post:
 *     summary: Create new conversation
 *     description: Start a new AI conversation
 *     tags: [AI Conversation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Conversation title
 *               context:
 *                 type: object
 *                 description: Initial context
 *               model:
 *                 type: string
 *                 description: Preferred AI model
 *     responses:
 *       201:
 *         description: Conversation created
 */
router.post('/conversations',
  [
    body('title').optional().isString(),
    body('model').optional().isString()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { title, context = {}, model } = req.body;
      
      const conversation = await aiConversation.createConversation({
        userId: req.user.id,
        title,
        context,
        model,
        requestId: req.id
      });
      
      res.status(201).json({
        success: true,
        conversation,
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
 * /ai/conversations/{conversationId}/messages:
 *   post:
 *     summary: Send message to conversation
 *     description: Send a message to an existing conversation
 *     tags: [AI Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User message
 *               stream:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: AI response
 */
router.post('/conversations/:conversationId/messages',
  streamingLimiter,
  [
    param('conversationId').isString().notEmpty(),
    body('message').isString().notEmpty(),
    body('stream').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { conversationId } = req.params;
      const { message, stream = false } = req.body;
      
      if (stream) {
        // Handle streaming response
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });
        
        const streamHandler = (chunk) => {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        };
        
        const endHandler = (response) => {
          res.write(`data: ${JSON.stringify({ ...response, done: true })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        };
        
        await aiConversation.sendMessageStream(conversationId, {
          message,
          userId: req.user.id,
          requestId: req.id
        }, streamHandler, endHandler);
      } else {
        const response = await aiConversation.sendMessage(conversationId, {
          message,
          userId: req.user.id,
          requestId: req.id
        });
        
        res.json({
          success: true,
          response,
          requestId: req.id,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Text Analysis
// =============================================================================

/**
 * @swagger
 * /ai/analyze/text:
 *   post:
 *     summary: Analyze text
 *     description: Perform various text analysis operations
 *     tags: [AI Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - analysis_type
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text to analyze
 *               analysis_type:
 *                 type: string
 *                 enum: [sentiment, summary, keywords, language, readability]
 *                 description: Type of analysis to perform
 *     responses:
 *       200:
 *         description: Analysis results
 */
router.post('/analyze/text',
  [
    body('text').isString().notEmpty(),
    body('analysis_type').isIn(['sentiment', 'summary', 'keywords', 'language', 'readability'])
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { text, analysis_type } = req.body;
      
      const analysis = await aiModels.analyzeText({
        text,
        analysisType: analysis_type,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        analysis,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Performance Metrics
// =============================================================================

/**
 * @swagger
 * /ai/metrics:
 *   get:
 *     summary: Get AI performance metrics
 *     description: Retrieve AI service performance metrics
 *     tags: [AI Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *     responses:
 *       200:
 *         description: Performance metrics
 */
router.get('/metrics',
  authorize(['admin', 'developer']),
  [
    query('timeframe').optional().isIn(['1h', '24h', '7d', '30d'])
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { timeframe = '24h' } = req.query;
      
      const metrics = await aiModels.getMetrics(timeframe);
      
      res.json({
        success: true,
        metrics,
        timeframe,
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
  logger.error('AI Route Error', {
    error: error.message,
    stack: error.stack,
    requestId: req.id,
    userId: req.user?.id,
    endpoint: req.originalUrl
  });
  
  // Handle specific AI errors
  if (error.name === 'AIModelError') {
    return res.status(503).json({
      error: 'AI Service Unavailable',
      message: 'AI model is currently unavailable. Please try again later.',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.name === 'RateLimitError') {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
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