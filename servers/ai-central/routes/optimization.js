/**
 * =============================================================================
 * NEXUS IDE - Optimization Routes
 * =============================================================================
 * 
 * Performance optimization API endpoints for NEXUS IDE
 * 
 * Features:
 * - Code performance analysis
 * - Optimization suggestions
 * - Benchmarking and profiling
 * - Resource usage optimization
 * - AI-powered performance insights
 * - Automated optimization application
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
const multer = require('multer');
const path = require('path');

const config = require('../config/config');
const logger = require('../utils/logger');
const { authorize } = require('../middleware/auth');
const { monitor } = require('../utils/performance');
const AIOptimization = require('../ai-optimization');
const AIModelsIntegration = require('../ai-models-integration');
const AICodeFeatures = require('../ai-code-features');

// =============================================================================
// Router Setup
// =============================================================================

const router = express.Router();

// Initialize services
let aiModels, aiOptimization, aiCodeFeatures;

async function initializeServices() {
  try {
    aiModels = new AIModelsIntegration(config.ai);
    aiCodeFeatures = new AICodeFeatures(aiModels, config.ai.codeFeatures);
    aiOptimization = new AIOptimization(aiModels, aiCodeFeatures, config.ai.optimization);
    
    await aiModels.initialize();
    await aiCodeFeatures.initialize();
    await aiOptimization.initialize();
    
    logger.info('Optimization services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize optimization services', { error: error.message });
    throw error;
  }
}

initializeServices().catch(error => {
  logger.error('Optimization services initialization failed', { error: error.message });
});

// =============================================================================
// File Upload Configuration
// =============================================================================

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.php', '.rb', '.swift', '.kt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported for optimization`), false);
    }
  }
});

// =============================================================================
// Rate Limiting
// =============================================================================

const optimizationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 optimization requests per minute
  message: {
    error: 'Optimization rate limit exceeded',
    message: 'Too many optimization requests. Please try again later.'
  }
});

const analysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 analysis requests per minute
  message: {
    error: 'Analysis rate limit exceeded',
    message: 'Too many analysis requests. Please try again later.'
  }
});

const benchmarkLimiter = rateLimit({
  windowMs: 300 * 1000, // 5 minutes
  max: 5, // 5 benchmark requests per 5 minutes
  message: {
    error: 'Benchmark rate limit exceeded',
    message: 'Too many benchmark requests. Please try again later.'
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
// Code Analysis
// =============================================================================

/**
 * @swagger
 * /optimization/analyze:
 *   post:
 *     summary: Analyze code performance
 *     description: Analyze code for performance bottlenecks and optimization opportunities
 *     tags: [Code Analysis]
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
 *                 description: Source code to analyze
 *               language:
 *                 type: string
 *                 description: Programming language
 *               file_path:
 *                 type: string
 *                 description: File path for context
 *               project_context:
 *                 type: object
 *                 description: Project context information
 *               analysis_depth:
 *                 type: string
 *                 enum: [basic, detailed, comprehensive]
 *                 default: detailed
 *                 description: Analysis depth level
 *     responses:
 *       200:
 *         description: Performance analysis results
 */
router.post('/analyze',
  analysisLimiter,
  [
    body('code').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('file_path').optional().isString(),
    body('project_context').optional().isObject(),
    body('analysis_depth').optional().isIn(['basic', 'detailed', 'comprehensive'])
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const {
        code,
        language,
        file_path,
        project_context = {},
        analysis_depth = 'detailed'
      } = req.body;
      
      const analysis = await aiOptimization.analyzePerformance({
        code,
        language,
        filePath: file_path,
        projectContext: project_context,
        analysisDepth: analysis_depth,
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
 * /optimization/analyze/batch:
 *   post:
 *     summary: Batch analyze multiple files
 *     description: Analyze multiple files for performance optimization
 *     tags: [Code Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Source code files to analyze
 *               project_context:
 *                 type: string
 *                 description: JSON string of project context
 *               analysis_depth:
 *                 type: string
 *                 enum: [basic, detailed, comprehensive]
 *                 default: detailed
 *     responses:
 *       200:
 *         description: Batch analysis results
 */
router.post('/analyze/batch',
  analysisLimiter,
  upload.array('files', 10),
  [
    body('project_context').optional().isJSON(),
    body('analysis_depth').optional().isIn(['basic', 'detailed', 'comprehensive'])
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'No files provided',
          message: 'At least one file is required for batch analysis',
          requestId: req.id
        });
      }
      
      const {
        project_context = '{}',
        analysis_depth = 'detailed'
      } = req.body;
      
      const files = req.files.map(file => ({
        name: file.originalname,
        content: file.buffer.toString('utf8'),
        language: path.extname(file.originalname).substring(1)
      }));
      
      const analysis = await aiOptimization.analyzeBatch({
        files,
        projectContext: JSON.parse(project_context),
        analysisDepth: analysis_depth,
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
// Optimization Suggestions
// =============================================================================

/**
 * @swagger
 * /optimization/suggest:
 *   post:
 *     summary: Get optimization suggestions
 *     description: Get AI-powered optimization suggestions for code
 *     tags: [Optimization Suggestions]
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
 *                 description: Source code to optimize
 *               language:
 *                 type: string
 *                 description: Programming language
 *               optimization_goals:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [speed, memory, readability, maintainability, security]
 *                 description: Optimization goals
 *               constraints:
 *                 type: object
 *                 description: Optimization constraints
 *               context:
 *                 type: object
 *                 description: Code context information
 *     responses:
 *       200:
 *         description: Optimization suggestions
 */
router.post('/suggest',
  optimizationLimiter,
  [
    body('code').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('optimization_goals').optional().isArray(),
    body('constraints').optional().isObject(),
    body('context').optional().isObject()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const {
        code,
        language,
        optimization_goals = ['speed', 'memory'],
        constraints = {},
        context: codeContext = {}
      } = req.body;
      
      const suggestions = await aiOptimization.generateSuggestions({
        code,
        language,
        optimizationGoals: optimization_goals,
        constraints,
        codeContext,
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

/**
 * @swagger
 * /optimization/apply:
 *   post:
 *     summary: Apply optimization
 *     description: Apply specific optimization to code
 *     tags: [Optimization Suggestions]
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
 *               - optimization_id
 *             properties:
 *               code:
 *                 type: string
 *                 description: Original source code
 *               optimization_id:
 *                 type: string
 *                 description: ID of optimization to apply
 *               optimization_params:
 *                 type: object
 *                 description: Parameters for optimization
 *               validate:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to validate optimized code
 *     responses:
 *       200:
 *         description: Optimized code
 */
router.post('/apply',
  optimizationLimiter,
  [
    body('code').isString().notEmpty(),
    body('optimization_id').isString().notEmpty(),
    body('optimization_params').optional().isObject(),
    body('validate').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const {
        code,
        optimization_id,
        optimization_params = {},
        validate = true
      } = req.body;
      
      const result = await aiOptimization.applyOptimization({
        code,
        optimizationId: optimization_id,
        optimizationParams: optimization_params,
        validate,
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
// Benchmarking
// =============================================================================

/**
 * @swagger
 * /optimization/benchmark:
 *   post:
 *     summary: Benchmark code performance
 *     description: Run performance benchmarks on code
 *     tags: [Benchmarking]
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
 *                 description: Code to benchmark
 *               language:
 *                 type: string
 *                 description: Programming language
 *               test_cases:
 *                 type: array
 *                 description: Test cases for benchmarking
 *               benchmark_config:
 *                 type: object
 *                 description: Benchmark configuration
 *               iterations:
 *                 type: integer
 *                 default: 1000
 *                 description: Number of iterations
 *     responses:
 *       200:
 *         description: Benchmark results
 */
router.post('/benchmark',
  benchmarkLimiter,
  [
    body('code').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('test_cases').optional().isArray(),
    body('benchmark_config').optional().isObject(),
    body('iterations').optional().isInt({ min: 1, max: 10000 })
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const {
        code,
        language,
        test_cases = [],
        benchmark_config = {},
        iterations = 1000
      } = req.body;
      
      const results = await aiOptimization.runBenchmark({
        code,
        language,
        testCases: test_cases,
        benchmarkConfig: benchmark_config,
        iterations,
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

/**
 * @swagger
 * /optimization/benchmark/compare:
 *   post:
 *     summary: Compare code performance
 *     description: Compare performance between original and optimized code
 *     tags: [Benchmarking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - original_code
 *               - optimized_code
 *               - language
 *             properties:
 *               original_code:
 *                 type: string
 *                 description: Original code
 *               optimized_code:
 *                 type: string
 *                 description: Optimized code
 *               language:
 *                 type: string
 *                 description: Programming language
 *               test_cases:
 *                 type: array
 *                 description: Test cases for comparison
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [execution_time, memory_usage, cpu_usage, throughput]
 *                 description: Metrics to compare
 *     responses:
 *       200:
 *         description: Performance comparison results
 */
router.post('/benchmark/compare',
  benchmarkLimiter,
  [
    body('original_code').isString().notEmpty(),
    body('optimized_code').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('test_cases').optional().isArray(),
    body('metrics').optional().isArray()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const {
        original_code,
        optimized_code,
        language,
        test_cases = [],
        metrics = ['execution_time', 'memory_usage']
      } = req.body;
      
      const comparison = await aiOptimization.comparePerformance({
        originalCode: original_code,
        optimizedCode: optimized_code,
        language,
        testCases: test_cases,
        metrics,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        comparison,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Optimization Sessions
// =============================================================================

/**
 * @swagger
 * /optimization/session/start:
 *   post:
 *     summary: Start optimization session
 *     description: Start a new optimization session for a project
 *     tags: [Optimization Sessions]
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
 *             properties:
 *               project_id:
 *                 type: string
 *                 description: Project identifier
 *               session_name:
 *                 type: string
 *                 description: Session name
 *               optimization_goals:
 *                 type: array
 *                 description: Optimization goals for the session
 *               target_files:
 *                 type: array
 *                 description: Files to optimize in this session
 *     responses:
 *       200:
 *         description: Optimization session started
 */
router.post('/session/start',
  [
    body('project_id').isString().notEmpty(),
    body('session_name').optional().isString(),
    body('optimization_goals').optional().isArray(),
    body('target_files').optional().isArray()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const {
        project_id,
        session_name,
        optimization_goals = [],
        target_files = []
      } = req.body;
      
      const session = await aiOptimization.startSession({
        projectId: project_id,
        sessionName: session_name,
        optimizationGoals: optimization_goals,
        targetFiles: target_files,
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
 * /optimization/session/{sessionId}/status:
 *   get:
 *     summary: Get optimization session status
 *     description: Get current status of an optimization session
 *     tags: [Optimization Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Optimization session ID
 *     responses:
 *       200:
 *         description: Session status
 */
router.get('/session/:sessionId/status',
  [
    param('sessionId').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      
      const status = await aiOptimization.getSessionStatus({
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

/**
 * @swagger
 * /optimization/session/{sessionId}/results:
 *   get:
 *     summary: Get optimization session results
 *     description: Get results from an optimization session
 *     tags: [Optimization Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Optimization session ID
 *     responses:
 *       200:
 *         description: Session results
 */
router.get('/session/:sessionId/results',
  [
    param('sessionId').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      
      const results = await aiOptimization.getSessionResults({
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
// Performance Patterns
// =============================================================================

/**
 * @swagger
 * /optimization/patterns/detect:
 *   post:
 *     summary: Detect performance patterns
 *     description: Detect common performance patterns in code
 *     tags: [Performance Patterns]
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
 *                 description: Source code to analyze
 *               language:
 *                 type: string
 *                 description: Programming language
 *               pattern_types:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [antipatterns, bottlenecks, inefficiencies, best_practices]
 *                 description: Types of patterns to detect
 *     responses:
 *       200:
 *         description: Detected patterns
 */
router.post('/patterns/detect',
  analysisLimiter,
  [
    body('code').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('pattern_types').optional().isArray()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const {
        code,
        language,
        pattern_types = ['antipatterns', 'bottlenecks', 'inefficiencies']
      } = req.body;
      
      const patterns = await aiOptimization.detectPatterns({
        code,
        language,
        patternTypes: pattern_types,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        patterns,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Optimization Analytics
// =============================================================================

/**
 * @swagger
 * /optimization/analytics/performance:
 *   get:
 *     summary: Get performance analytics
 *     description: Get performance analytics for optimizations
 *     tags: [Optimization Analytics]
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
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [speed_improvement, memory_reduction, code_quality]
 *         description: Specific metric to analyze
 *     responses:
 *       200:
 *         description: Performance analytics
 */
router.get('/analytics/performance',
  [
    query('timeframe').optional().isIn(['hour', 'day', 'week', 'month']),
    query('project_id').optional().isString(),
    query('metric').optional().isIn(['speed_improvement', 'memory_reduction', 'code_quality'])
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const {
        timeframe = 'day',
        project_id,
        metric
      } = req.query;
      
      const analytics = await aiOptimization.getPerformanceAnalytics({
        timeframe,
        projectId: project_id,
        metric,
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
  logger.error('Optimization Route Error', {
    error: error.message,
    stack: error.stack,
    requestId: req.id,
    userId: req.user?.id,
    endpoint: req.originalUrl
  });
  
  // Handle specific optimization errors
  if (error.name === 'OptimizationError') {
    return res.status(422).json({
      error: 'Optimization Error',
      message: error.message,
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.name === 'BenchmarkError') {
    return res.status(400).json({
      error: 'Benchmark Error',
      message: error.message,
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.name === 'AnalysisError') {
    return res.status(422).json({
      error: 'Analysis Error',
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