/**
 * =============================================================================
 * NEXUS IDE - Debug Routes
 * =============================================================================
 * 
 * Debugging-related API endpoints for NEXUS IDE
 * 
 * Features:
 * - Debug session management
 * - Breakpoint operations
 * - Variable inspection
 * - Call stack analysis
 * - Error analysis and suggestions
 * - Performance profiling
 * - AI-powered debugging assistance
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
const WebSocket = require('ws');

const config = require('../config/config');
const logger = require('../utils/logger');
const { authorize } = require('../middleware/auth');
const { monitor } = require('../utils/performance');
const AIDebugging = require('../ai-debugging');
const AIModelsIntegration = require('../ai-models-integration');

// =============================================================================
// Router Setup
// =============================================================================

const router = express.Router();

// Initialize services
let aiModels, aiDebugging;

async function initializeServices() {
  try {
    aiModels = new AIModelsIntegration(config.ai);
    aiDebugging = new AIDebugging(aiModels, config.ai.debugging);
    
    await aiModels.initialize();
    await aiDebugging.initialize();
    
    logger.info('Debug services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize debug services', { error: error.message });
    throw error;
  }
}

initializeServices().catch(error => {
  logger.error('Debug services initialization failed', { error: error.message });
});

// =============================================================================
// Rate Limiting
// =============================================================================

const debugSessionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 debug operations per minute
  message: {
    error: 'Debug session rate limit exceeded',
    message: 'Too many debug operations. Please try again later.'
  }
});

const errorAnalysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 error analyses per minute
  message: {
    error: 'Error analysis rate limit exceeded',
    message: 'Too many error analysis requests. Please try again later.'
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
// Debug Session Management
// =============================================================================

/**
 * @swagger
 * /debug/session/start:
 *   post:
 *     summary: Start debug session
 *     description: Initialize a new debugging session
 *     tags: [Debug Session]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - language
 *             properties:
 *               project_id:
 *                 type: string
 *                 description: Project identifier
 *               language:
 *                 type: string
 *                 description: Programming language
 *               entry_point:
 *                 type: string
 *                 description: Main file or entry point
 *               debug_config:
 *                 type: object
 *                 description: Debug configuration
 *               environment:
 *                 type: object
 *                 description: Environment variables
 *     responses:
 *       200:
 *         description: Debug session started
 */
router.post('/session/start',
  debugSessionLimiter,
  [
    body('project_id').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('entry_point').optional().isString(),
    body('debug_config').optional().isObject(),
    body('environment').optional().isObject()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const {
        project_id,
        language,
        entry_point,
        debug_config = {},
        environment = {}
      } = req.body;
      
      const session = await aiDebugging.startSession({
        projectId: project_id,
        language,
        entryPoint: entry_point,
        debugConfig: debug_config,
        environment,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        session,
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
 * /debug/session/{sessionId}/stop:
 *   post:
 *     summary: Stop debug session
 *     description: Terminate an active debugging session
 *     tags: [Debug Session]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debug session ID
 *     responses:
 *       200:
 *         description: Debug session stopped
 */
router.post('/session/:sessionId/stop',
  [
    param('sessionId').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      
      const result = await aiDebugging.stopSession({
        sessionId,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        result,
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
 * /debug/session/{sessionId}/status:
 *   get:
 *     summary: Get debug session status
 *     description: Get current status of a debugging session
 *     tags: [Debug Session]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debug session ID
 *     responses:
 *       200:
 *         description: Debug session status
 */
router.get('/session/:sessionId/status',
  [
    param('sessionId').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      
      const status = await aiDebugging.getSessionStatus({
        sessionId,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        status,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Breakpoint Management
// =============================================================================

/**
 * @swagger
 * /debug/breakpoints:
 *   post:
 *     summary: Set breakpoint
 *     description: Set a breakpoint at specific location
 *     tags: [Breakpoints]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - session_id
 *               - file_path
 *               - line_number
 *             properties:
 *               session_id:
 *                 type: string
 *                 description: Debug session ID
 *               file_path:
 *                 type: string
 *                 description: File path
 *               line_number:
 *                 type: integer
 *                 description: Line number
 *               condition:
 *                 type: string
 *                 description: Conditional breakpoint expression
 *               hit_count:
 *                 type: integer
 *                 description: Hit count condition
 *               enabled:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Breakpoint set
 */
router.post('/breakpoints',
  [
    body('session_id').isString().notEmpty(),
    body('file_path').isString().notEmpty(),
    body('line_number').isInt({ min: 1 }),
    body('condition').optional().isString(),
    body('hit_count').optional().isInt({ min: 1 }),
    body('enabled').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const {
        session_id,
        file_path,
        line_number,
        condition,
        hit_count,
        enabled = true
      } = req.body;
      
      const breakpoint = await aiDebugging.setBreakpoint({
        sessionId: session_id,
        filePath: file_path,
        lineNumber: line_number,
        condition,
        hitCount: hit_count,
        enabled,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        breakpoint,
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
 * /debug/breakpoints/{breakpointId}:
 *   delete:
 *     summary: Remove breakpoint
 *     description: Remove a specific breakpoint
 *     tags: [Breakpoints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: breakpointId
 *         required: true
 *         schema:
 *           type: string
 *         description: Breakpoint ID
 *     responses:
 *       200:
 *         description: Breakpoint removed
 */
router.delete('/breakpoints/:breakpointId',
  [
    param('breakpointId').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { breakpointId } = req.params;
      
      const result = await aiDebugging.removeBreakpoint({
        breakpointId,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        result,
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
 * /debug/session/{sessionId}/breakpoints:
 *   get:
 *     summary: List breakpoints
 *     description: Get all breakpoints for a debug session
 *     tags: [Breakpoints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debug session ID
 *     responses:
 *       200:
 *         description: List of breakpoints
 */
router.get('/session/:sessionId/breakpoints',
  [
    param('sessionId').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      
      const breakpoints = await aiDebugging.getBreakpoints({
        sessionId,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        breakpoints,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Debug Control
// =============================================================================

/**
 * @swagger
 * /debug/session/{sessionId}/continue:
 *   post:
 *     summary: Continue execution
 *     description: Continue program execution
 *     tags: [Debug Control]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debug session ID
 *     responses:
 *       200:
 *         description: Execution continued
 */
router.post('/session/:sessionId/continue',
  [
    param('sessionId').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      
      const result = await aiDebugging.continue({
        sessionId,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        result,
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
 * /debug/session/{sessionId}/step:
 *   post:
 *     summary: Step execution
 *     description: Step through code execution
 *     tags: [Debug Control]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debug session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - step_type
 *             properties:
 *               step_type:
 *                 type: string
 *                 enum: [over, into, out]
 *                 description: Type of step operation
 *     responses:
 *       200:
 *         description: Step executed
 */
router.post('/session/:sessionId/step',
  [
    param('sessionId').isString().notEmpty(),
    body('step_type').isIn(['over', 'into', 'out'])
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { step_type } = req.body;
      
      const result = await aiDebugging.step({
        sessionId,
        stepType: step_type,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        result,
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
 * /debug/session/{sessionId}/pause:
 *   post:
 *     summary: Pause execution
 *     description: Pause program execution
 *     tags: [Debug Control]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debug session ID
 *     responses:
 *       200:
 *         description: Execution paused
 */
router.post('/session/:sessionId/pause',
  [
    param('sessionId').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      
      const result = await aiDebugging.pause({
        sessionId,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        result,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Variable Inspection
// =============================================================================

/**
 * @swagger
 * /debug/session/{sessionId}/variables:
 *   get:
 *     summary: Get variables
 *     description: Get current variables in scope
 *     tags: [Variable Inspection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debug session ID
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *           enum: [local, global, closure]
 *         description: Variable scope
 *     responses:
 *       200:
 *         description: Variables list
 */
router.get('/session/:sessionId/variables',
  [
    param('sessionId').isString().notEmpty(),
    query('scope').optional().isIn(['local', 'global', 'closure'])
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { scope = 'local' } = req.query;
      
      const variables = await aiDebugging.getVariables({
        sessionId,
        scope,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        variables,
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
 * /debug/session/{sessionId}/evaluate:
 *   post:
 *     summary: Evaluate expression
 *     description: Evaluate an expression in current debug context
 *     tags: [Variable Inspection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debug session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expression
 *             properties:
 *               expression:
 *                 type: string
 *                 description: Expression to evaluate
 *               context:
 *                 type: string
 *                 enum: [watch, repl, hover]
 *                 default: repl
 *                 description: Evaluation context
 *     responses:
 *       200:
 *         description: Evaluation result
 */
router.post('/session/:sessionId/evaluate',
  [
    param('sessionId').isString().notEmpty(),
    body('expression').isString().notEmpty(),
    body('context').optional().isIn(['watch', 'repl', 'hover'])
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { expression, context: evalContext = 'repl' } = req.body;
      
      const result = await aiDebugging.evaluateExpression({
        sessionId,
        expression,
        evalContext,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        result,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Call Stack
// =============================================================================

/**
 * @swagger
 * /debug/session/{sessionId}/stack:
 *   get:
 *     summary: Get call stack
 *     description: Get current call stack
 *     tags: [Call Stack]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debug session ID
 *     responses:
 *       200:
 *         description: Call stack
 */
router.get('/session/:sessionId/stack',
  [
    param('sessionId').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      
      const stack = await aiDebugging.getCallStack({
        sessionId,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        stack,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Error Analysis
// =============================================================================

/**
 * @swagger
 * /debug/analyze-error:
 *   post:
 *     summary: Analyze error
 *     description: Analyze error and get AI-powered suggestions
 *     tags: [Error Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - error_message
 *               - stack_trace
 *             properties:
 *               error_message:
 *                 type: string
 *                 description: Error message
 *               stack_trace:
 *                 type: string
 *                 description: Stack trace
 *               code_context:
 *                 type: string
 *                 description: Relevant code context
 *               language:
 *                 type: string
 *                 description: Programming language
 *               project_context:
 *                 type: object
 *                 description: Project context information
 *     responses:
 *       200:
 *         description: Error analysis and suggestions
 */
router.post('/analyze-error',
  errorAnalysisLimiter,
  [
    body('error_message').isString().notEmpty(),
    body('stack_trace').isString().notEmpty(),
    body('code_context').optional().isString(),
    body('language').optional().isString(),
    body('project_context').optional().isObject()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const {
        error_message,
        stack_trace,
        code_context,
        language,
        project_context = {}
      } = req.body;
      
      const analysis = await aiDebugging.analyzeError({
        errorMessage: error_message,
        stackTrace: stack_trace,
        codeContext: code_context,
        language,
        projectContext: project_context,
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

/**
 * @swagger
 * /debug/suggest-fix:
 *   post:
 *     summary: Suggest fix
 *     description: Get AI-powered fix suggestions for code issues
 *     tags: [Error Analysis]
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
 *               - issue_description
 *             properties:
 *               code:
 *                 type: string
 *                 description: Problematic code
 *               issue_description:
 *                 type: string
 *                 description: Description of the issue
 *               language:
 *                 type: string
 *                 description: Programming language
 *               error_context:
 *                 type: object
 *                 description: Error context information
 *     responses:
 *       200:
 *         description: Fix suggestions
 */
router.post('/suggest-fix',
  errorAnalysisLimiter,
  [
    body('code').isString().notEmpty(),
    body('issue_description').isString().notEmpty(),
    body('language').optional().isString(),
    body('error_context').optional().isObject()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const {
        code,
        issue_description,
        language,
        error_context = {}
      } = req.body;
      
      const suggestions = await aiDebugging.suggestFix({
        code,
        issueDescription: issue_description,
        language,
        errorContext: error_context,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        suggestions,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Performance Profiling
// =============================================================================

/**
 * @swagger
 * /debug/session/{sessionId}/profile/start:
 *   post:
 *     summary: Start profiling
 *     description: Start performance profiling
 *     tags: [Performance Profiling]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debug session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile_type:
 *                 type: string
 *                 enum: [cpu, memory, heap, network]
 *                 default: cpu
 *                 description: Type of profiling
 *               duration:
 *                 type: integer
 *                 description: Profiling duration in seconds
 *               sample_rate:
 *                 type: integer
 *                 description: Sample rate in Hz
 *     responses:
 *       200:
 *         description: Profiling started
 */
router.post('/session/:sessionId/profile/start',
  [
    param('sessionId').isString().notEmpty(),
    body('profile_type').optional().isIn(['cpu', 'memory', 'heap', 'network']),
    body('duration').optional().isInt({ min: 1, max: 300 }),
    body('sample_rate').optional().isInt({ min: 1, max: 1000 })
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const {
        profile_type = 'cpu',
        duration = 30,
        sample_rate = 100
      } = req.body;
      
      const profile = await aiDebugging.startProfiling({
        sessionId,
        profileType: profile_type,
        duration,
        sampleRate: sample_rate,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        profile,
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
 * /debug/session/{sessionId}/profile/stop:
 *   post:
 *     summary: Stop profiling
 *     description: Stop performance profiling and get results
 *     tags: [Performance Profiling]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debug session ID
 *     responses:
 *       200:
 *         description: Profiling results
 */
router.post('/session/:sessionId/profile/stop',
  [
    param('sessionId').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      
      const results = await aiDebugging.stopProfiling({
        sessionId,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        results,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Debug Analytics
// =============================================================================

/**
 * @swagger
 * /debug/analytics/sessions:
 *   get:
 *     summary: Get debug session analytics
 *     description: Get analytics for debug sessions
 *     tags: [Debug Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *         description: Analytics timeframe
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *     responses:
 *       200:
 *         description: Debug session analytics
 */
router.get('/analytics/sessions',
  [
    query('timeframe').optional().isIn(['hour', 'day', 'week', 'month']),
    query('project_id').optional().isString()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { timeframe = 'day', project_id } = req.query;
      
      const analytics = await aiDebugging.getSessionAnalytics({
        timeframe,
        projectId: project_id,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
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
// Error Handling
// =============================================================================

router.use((error, req, res, next) => {
  logger.error('Debug Route Error', {
    error: error.message,
    stack: error.stack,
    requestId: req.id,
    userId: req.user?.id,
    endpoint: req.originalUrl
  });
  
  // Handle specific debug errors
  if (error.name === 'DebugSessionError') {
    return res.status(422).json({
      error: 'Debug Session Error',
      message: error.message,
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.name === 'BreakpointError') {
    return res.status(400).json({
      error: 'Breakpoint Error',
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