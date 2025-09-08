/**
 * =============================================================================
 * NEXUS IDE - Code Routes
 * =============================================================================
 * 
 * Code-related API endpoints for NEXUS IDE
 * 
 * Features:
 * - Code analysis and parsing
 * - Syntax validation
 * - Code formatting
 * - Refactoring suggestions
 * - Dependency analysis
 * - Code metrics
 * - Language server integration
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
const fs = require('fs').promises;

const config = require('../config/config');
const logger = require('../utils/logger');
const { authorize } = require('../middleware/auth');
const { monitor } = require('../utils/performance');
const AICodeFeatures = require('../ai-code-features');
const AIModelsIntegration = require('../ai-models-integration');

// =============================================================================
// Router Setup
// =============================================================================

const router = express.Router();

// Initialize services
let aiModels, aiCodeFeatures;

async function initializeServices() {
  try {
    aiModels = new AIModelsIntegration(config.ai);
    aiCodeFeatures = new AICodeFeatures(aiModels, config.ai.codeFeatures);
    
    await aiModels.initialize();
    await aiCodeFeatures.initialize();
    
    logger.info('Code services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize code services', { error: error.message });
    throw error;
  }
}

initializeServices().catch(error => {
  logger.error('Code services initialization failed', { error: error.message });
});

// =============================================================================
// File Upload Configuration
// =============================================================================

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Allow common code file extensions
    const allowedExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h',
      '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
      '.html', '.css', '.scss', '.less', '.json', '.xml', '.yaml', '.yml',
      '.md', '.txt', '.sql', '.sh', '.bat', '.ps1'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported`), false);
    }
  }
});

// =============================================================================
// Rate Limiting
// =============================================================================

const codeAnalysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    error: 'Code analysis rate limit exceeded',
    message: 'Too many code analysis requests. Please try again later.'
  }
});

const fileUploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 file uploads per minute
  message: {
    error: 'File upload rate limit exceeded',
    message: 'Too many file uploads. Please try again later.'
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
 * /code/analyze:
 *   post:
 *     summary: Analyze code
 *     description: Perform comprehensive code analysis
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
 *                 description: Code to analyze
 *               language:
 *                 type: string
 *                 description: Programming language
 *               analysis_types:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [syntax, complexity, security, performance, style, dependencies]
 *                 description: Types of analysis to perform
 *               options:
 *                 type: object
 *                 description: Analysis options
 *     responses:
 *       200:
 *         description: Code analysis results
 */
router.post('/analyze',
  codeAnalysisLimiter,
  [
    body('code').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('analysis_types').optional().isArray(),
    body('analysis_types.*').optional().isIn(['syntax', 'complexity', 'security', 'performance', 'style', 'dependencies'])
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { 
        code, 
        language, 
        analysis_types = ['syntax', 'complexity', 'style'], 
        options = {} 
      } = req.body;
      
      const analysis = await aiCodeFeatures.analyzeCode({
        code,
        language,
        analysisTypes: analysis_types,
        options,
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
 * /code/validate:
 *   post:
 *     summary: Validate code syntax
 *     description: Check code for syntax errors and warnings
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
 *                 description: Code to validate
 *               language:
 *                 type: string
 *                 description: Programming language
 *               strict:
 *                 type: boolean
 *                 default: false
 *                 description: Enable strict validation
 *     responses:
 *       200:
 *         description: Validation results
 */
router.post('/validate',
  [
    body('code').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('strict').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { code, language, strict = false } = req.body;
      
      const validation = await aiCodeFeatures.validateSyntax({
        code,
        language,
        strict,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        validation,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Code Formatting
// =============================================================================

/**
 * @swagger
 * /code/format:
 *   post:
 *     summary: Format code
 *     description: Format code according to language standards
 *     tags: [Code Formatting]
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
 *                 description: Code to format
 *               language:
 *                 type: string
 *                 description: Programming language
 *               style:
 *                 type: object
 *                 description: Formatting style options
 *               preserve_comments:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Formatted code
 */
router.post('/format',
  [
    body('code').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('preserve_comments').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { code, language, style = {}, preserve_comments = true } = req.body;
      
      const formatted = await aiCodeFeatures.formatCode({
        code,
        language,
        style,
        preserveComments: preserve_comments,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        formatted_code: formatted.code,
        changes: formatted.changes,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Code Refactoring
// =============================================================================

/**
 * @swagger
 * /code/refactor:
 *   post:
 *     summary: Get refactoring suggestions
 *     description: Analyze code and provide refactoring suggestions
 *     tags: [Code Refactoring]
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
 *                 description: Code to refactor
 *               language:
 *                 type: string
 *                 description: Programming language
 *               refactor_types:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [extract_method, rename_variable, simplify_condition, remove_duplication, optimize_performance]
 *                 description: Types of refactoring to suggest
 *               context:
 *                 type: object
 *                 description: Additional context about the codebase
 *     responses:
 *       200:
 *         description: Refactoring suggestions
 */
router.post('/refactor',
  codeAnalysisLimiter,
  [
    body('code').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('refactor_types').optional().isArray(),
    body('refactor_types.*').optional().isIn(['extract_method', 'rename_variable', 'simplify_condition', 'remove_duplication', 'optimize_performance'])
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { 
        code, 
        language, 
        refactor_types = ['extract_method', 'simplify_condition', 'remove_duplication'], 
        context = {} 
      } = req.body;
      
      const suggestions = await aiCodeFeatures.suggestRefactoring({
        code,
        language,
        refactorTypes: refactor_types,
        context: {
          ...context,
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
 * /code/refactor/apply:
 *   post:
 *     summary: Apply refactoring
 *     description: Apply a specific refactoring suggestion to code
 *     tags: [Code Refactoring]
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
 *               - refactoring_id
 *             properties:
 *               code:
 *                 type: string
 *                 description: Original code
 *               language:
 *                 type: string
 *                 description: Programming language
 *               refactoring_id:
 *                 type: string
 *                 description: ID of the refactoring to apply
 *               options:
 *                 type: object
 *                 description: Refactoring options
 *     responses:
 *       200:
 *         description: Refactored code
 */
router.post('/refactor/apply',
  [
    body('code').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('refactoring_id').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { code, language, refactoring_id, options = {} } = req.body;
      
      const refactored = await aiCodeFeatures.applyRefactoring({
        code,
        language,
        refactoringId: refactoring_id,
        options,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        refactored_code: refactored.code,
        changes: refactored.changes,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Dependency Analysis
// =============================================================================

/**
 * @swagger
 * /code/dependencies:
 *   post:
 *     summary: Analyze dependencies
 *     description: Analyze code dependencies and imports
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
 *                 description: Code to analyze
 *               language:
 *                 type: string
 *                 description: Programming language
 *               include_unused:
 *                 type: boolean
 *                 default: true
 *                 description: Include unused dependencies
 *               include_security:
 *                 type: boolean
 *                 default: true
 *                 description: Include security analysis
 *     responses:
 *       200:
 *         description: Dependency analysis results
 */
router.post('/dependencies',
  codeAnalysisLimiter,
  [
    body('code').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('include_unused').optional().isBoolean(),
    body('include_security').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { 
        code, 
        language, 
        include_unused = true, 
        include_security = true 
      } = req.body;
      
      const dependencies = await aiCodeFeatures.analyzeDependencies({
        code,
        language,
        includeUnused: include_unused,
        includeSecurity: include_security,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        dependencies,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Code Metrics
// =============================================================================

/**
 * @swagger
 * /code/metrics:
 *   post:
 *     summary: Calculate code metrics
 *     description: Calculate various code quality metrics
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
 *                 description: Code to analyze
 *               language:
 *                 type: string
 *                 description: Programming language
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [complexity, maintainability, readability, test_coverage, duplication]
 *                 description: Metrics to calculate
 *     responses:
 *       200:
 *         description: Code metrics
 */
router.post('/metrics',
  codeAnalysisLimiter,
  [
    body('code').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('metrics').optional().isArray(),
    body('metrics.*').optional().isIn(['complexity', 'maintainability', 'readability', 'test_coverage', 'duplication'])
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { 
        code, 
        language, 
        metrics = ['complexity', 'maintainability', 'readability'] 
      } = req.body;
      
      const codeMetrics = await aiCodeFeatures.calculateMetrics({
        code,
        language,
        metrics,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        metrics: codeMetrics,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// File Operations
// =============================================================================

/**
 * @swagger
 * /code/files/analyze:
 *   post:
 *     summary: Analyze uploaded files
 *     description: Upload and analyze multiple code files
 *     tags: [File Operations]
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
 *               analysis_types:
 *                 type: string
 *                 description: JSON array of analysis types
 *               options:
 *                 type: string
 *                 description: JSON object with analysis options
 *     responses:
 *       200:
 *         description: File analysis results
 */
router.post('/files/analyze',
  fileUploadLimiter,
  upload.array('files', 10),
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'No files uploaded',
          message: 'Please upload at least one file',
          requestId: req.id
        });
      }
      
      const analysisTypes = req.body.analysis_types ? 
        JSON.parse(req.body.analysis_types) : 
        ['syntax', 'complexity', 'style'];
      
      const options = req.body.options ? 
        JSON.parse(req.body.options) : 
        {};
      
      const results = [];
      
      for (const file of req.files) {
        const code = file.buffer.toString('utf8');
        const language = detectLanguage(file.originalname);
        
        if (language) {
          const analysis = await aiCodeFeatures.analyzeCode({
            code,
            language,
            analysisTypes,
            options,
            context: {
              fileName: file.originalname,
              userId: req.user.id,
              requestId: req.id
            }
          });
          
          results.push({
            filename: file.originalname,
            language,
            analysis
          });
        } else {
          results.push({
            filename: file.originalname,
            error: 'Unsupported file type or unable to detect language'
          });
        }
      }
      
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
// Language Server Integration
// =============================================================================

/**
 * @swagger
 * /code/lsp/hover:
 *   post:
 *     summary: Get hover information
 *     description: Get hover information for code at specific position
 *     tags: [Language Server]
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
 *                 description: Code content
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
 *     responses:
 *       200:
 *         description: Hover information
 */
router.post('/lsp/hover',
  [
    body('code').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('position').isObject(),
    body('position.line').isInt({ min: 0 }),
    body('position.column').isInt({ min: 0 })
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { code, language, position } = req.body;
      
      const hoverInfo = await aiCodeFeatures.getHoverInfo({
        code,
        language,
        position,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        hover: hoverInfo,
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
 * /code/lsp/definition:
 *   post:
 *     summary: Go to definition
 *     description: Find definition of symbol at specific position
 *     tags: [Language Server]
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
 *                 description: Code content
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
 *     responses:
 *       200:
 *         description: Definition location
 */
router.post('/lsp/definition',
  [
    body('code').isString().notEmpty(),
    body('language').isString().notEmpty(),
    body('position').isObject(),
    body('position.line').isInt({ min: 0 }),
    body('position.column').isInt({ min: 0 })
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { code, language, position } = req.body;
      
      const definition = await aiCodeFeatures.findDefinition({
        code,
        language,
        position,
        context: {
          userId: req.user.id,
          requestId: req.id
        }
      });
      
      res.json({
        success: true,
        definition,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Detect programming language from filename
 */
function detectLanguage(filename) {
  const ext = path.extname(filename).toLowerCase();
  const languageMap = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.cs': 'csharp',
    '.php': 'php',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
    '.sql': 'sql',
    '.sh': 'bash',
    '.bat': 'batch',
    '.ps1': 'powershell'
  };
  
  return languageMap[ext] || null;
}

// =============================================================================
// Error Handling
// =============================================================================

router.use((error, req, res, next) => {
  logger.error('Code Route Error', {
    error: error.message,
    stack: error.stack,
    requestId: req.id,
    userId: req.user?.id,
    endpoint: req.originalUrl
  });
  
  // Handle specific code analysis errors
  if (error.name === 'CodeAnalysisError') {
    return res.status(422).json({
      error: 'Code Analysis Failed',
      message: error.message,
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.name === 'UnsupportedLanguageError') {
    return res.status(400).json({
      error: 'Unsupported Language',
      message: 'The specified programming language is not supported',
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