/**
 * =============================================================================
 * NEXUS IDE - Project Management Routes
 * =============================================================================
 * 
 * Project management API endpoints for NEXUS IDE
 * 
 * Features:
 * - Project creation and management
 * - Workspace organization
 * - File and folder operations
 * - Git integration
 * - Collaboration and sharing
 * - Project templates
 * - Build and deployment
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
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');

const config = require('../config/config');
const logger = require('../utils/logger');
const { authenticate, authorize } = require('../middleware/auth');
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
    
    logger.info('Project management services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize project management services', { error: error.message });
    throw error;
  }
}

initializeServices().catch(error => {
  logger.error('Project management services initialization failed', { error: error.message });
});

// =============================================================================
// File Upload Configuration
// =============================================================================

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB for project files
    files: 50
  },
  fileFilter: (req, file, cb) => {
    // Allow most file types for project uploads
    const allowedTypes = [
      'text/plain', 'application/json', 'application/javascript',
      'text/html', 'text/css', 'application/xml', 'text/xml',
      'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml',
      'application/pdf', 'application/zip'
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed for project upload'), false);
    }
  }
});

// =============================================================================
// Rate Limiting
// =============================================================================

const projectLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    error: 'Project operation rate limit exceeded',
    message: 'Too many project operations. Please try again later.'
  }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  message: {
    error: 'Upload rate limit exceeded',
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
// Project Management Routes
// =============================================================================

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get user projects
 *     description: Get list of projects for the authenticated user
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, archived, template]
 *         description: Project status filter
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, created_at, updated_at, last_accessed]
 *           default: updated_at
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get('/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('status').optional().isIn(['active', 'archived', 'template']),
    query('sort').optional().isIn(['name', 'created_at', 'updated_at', 'last_accessed']),
    query('order').optional().isIn(['asc', 'desc'])
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 20,
        search,
        status = 'active',
        sort = 'updated_at',
        order = 'desc'
      } = req.query;
      
      // Build query
      const query = {
        $or: [
          { ownerId: userId },
          { 'collaborators.userId': userId }
        ],
        status
      };
      
      if (search) {
        query.$and = [
          {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
              { tags: { $in: [new RegExp(search, 'i')] } }
            ]
          }
        ];
      }
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortOrder = order === 'desc' ? -1 : 1;
      
      // Get projects
      const [projects, total] = await Promise.all([
        db.find('projects', query, {
          sort: { [sort]: sortOrder },
          skip,
          limit: parseInt(limit),
          projection: {
            name: 1,
            description: 1,
            status: 1,
            visibility: 1,
            tags: 1,
            language: 1,
            framework: 1,
            ownerId: 1,
            collaborators: 1,
            stats: 1,
            createdAt: 1,
            updatedAt: 1,
            lastAccessedAt: 1
          }
        }),
        db.countDocuments('projects', query)
      ]);
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;
      
      res.json({
        success: true,
        projects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext,
          hasPrev
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
 * /projects:
 *   post:
 *     summary: Create new project
 *     description: Create a new project
 *     tags: [Projects]
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
 *                 description: Project name
 *               description:
 *                 type: string
 *                 description: Project description
 *               template:
 *                 type: string
 *                 description: Project template ID
 *               language:
 *                 type: string
 *                 description: Primary programming language
 *               framework:
 *                 type: string
 *                 description: Framework or library
 *               visibility:
 *                 type: string
 *                 enum: [private, public, team]
 *                 default: private
 *                 description: Project visibility
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Project tags
 *               settings:
 *                 type: object
 *                 description: Project settings
 *     responses:
 *       201:
 *         description: Project created successfully
 */
router.post('/',
  authenticate,
  projectLimiter,
  [
    body('name').isLength({ min: 1, max: 100 }).matches(/^[a-zA-Z0-9\s\-_\.]+$/),
    body('description').optional().isLength({ max: 500 }),
    body('template').optional().isString(),
    body('language').optional().isString(),
    body('framework').optional().isString(),
    body('visibility').optional().isIn(['private', 'public', 'team']),
    body('tags').optional().isArray(),
    body('settings').optional().isObject()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const {
        name,
        description,
        template,
        language,
        framework,
        visibility = 'private',
        tags = [],
        settings = {}
      } = req.body;
      
      // Check if project name already exists for user
      const existingProject = await db.findOne('projects', {
        ownerId: userId,
        name,
        status: { $ne: 'deleted' }
      });
      
      if (existingProject) {
        return res.status(409).json({
          error: 'Project already exists',
          message: 'A project with this name already exists',
          requestId: req.id
        });
      }
      
      // Generate project ID and workspace path
      const projectId = uuidv4();
      const workspacePath = `/workspaces/${userId}/${projectId}`;
      
      // Create project data
      const project = {
        _id: projectId,
        name,
        description,
        ownerId: userId,
        language,
        framework,
        visibility,
        status: 'active',
        tags,
        settings: {
          autoSave: true,
          linting: true,
          formatting: true,
          gitIntegration: true,
          aiAssistance: true,
          ...settings
        },
        workspace: {
          path: workspacePath,
          structure: {
            files: [],
            folders: []
          }
        },
        git: {
          initialized: false,
          remoteUrl: null,
          branch: 'main',
          commits: []
        },
        collaborators: [],
        stats: {
          filesCount: 0,
          linesOfCode: 0,
          commits: 0,
          contributors: 1,
          lastCommit: null
        },
        build: {
          status: 'none',
          lastBuild: null,
          config: {}
        },
        deployment: {
          status: 'none',
          lastDeployment: null,
          config: {}
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastAccessedAt: new Date()
      };
      
      // Apply template if specified
      if (template) {
        const templateData = await db.findOne('project_templates', { _id: template });
        if (templateData) {
          project.workspace.structure = templateData.structure;
          project.settings = { ...project.settings, ...templateData.settings };
          project.language = templateData.language || project.language;
          project.framework = templateData.framework || project.framework;
        }
      }
      
      // Create project
      await db.create('projects', project);
      
      // Create workspace directory structure (in a real implementation)
      // await createWorkspaceStructure(workspacePath, project.workspace.structure);
      
      logger.info('Project created successfully', {
        projectId,
        name,
        ownerId: userId,
        template,
        requestId: req.id
      });
      
      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        project,
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
 * /projects/{projectId}:
 *   get:
 *     summary: Get project details
 *     description: Get detailed information about a specific project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *       404:
 *         description: Project not found
 */
router.get('/:projectId',
  authenticate,
  [
    param('projectId').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;
      
      // Get project with access check
      const project = await db.findOne('projects', {
        _id: projectId,
        $or: [
          { ownerId: userId },
          { 'collaborators.userId': userId },
          { visibility: 'public' }
        ],
        status: { $ne: 'deleted' }
      });
      
      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: 'Project not found or access denied',
          requestId: req.id
        });
      }
      
      // Update last accessed time if user has access
      if (project.ownerId === userId || project.collaborators.some(c => c.userId === userId)) {
        await db.updateOne('projects',
          { _id: projectId },
          { 
            $set: { 
              lastAccessedAt: new Date(),
              updatedAt: new Date()
            }
          }
        );
      }
      
      // Get recent activity
      const recentActivity = await db.find('project_activities', 
        { projectId },
        { 
          sort: { createdAt: -1 },
          limit: 10
        }
      );
      
      res.json({
        success: true,
        project: {
          ...project,
          recentActivity
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
 * /projects/{projectId}:
 *   put:
 *     summary: Update project
 *     description: Update project information
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Project name
 *               description:
 *                 type: string
 *                 description: Project description
 *               language:
 *                 type: string
 *                 description: Primary programming language
 *               framework:
 *                 type: string
 *                 description: Framework or library
 *               visibility:
 *                 type: string
 *                 enum: [private, public, team]
 *                 description: Project visibility
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Project tags
 *               settings:
 *                 type: object
 *                 description: Project settings
 *     responses:
 *       200:
 *         description: Project updated successfully
 */
router.put('/:projectId',
  authenticate,
  projectLimiter,
  [
    param('projectId').isString().notEmpty(),
    body('name').optional().isLength({ min: 1, max: 100 }).matches(/^[a-zA-Z0-9\s\-_\.]+$/),
    body('description').optional().isLength({ max: 500 }),
    body('language').optional().isString(),
    body('framework').optional().isString(),
    body('visibility').optional().isIn(['private', 'public', 'team']),
    body('tags').optional().isArray(),
    body('settings').optional().isObject()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;
      const updateData = req.body;
      
      // Check project ownership or admin access
      const project = await db.findOne('projects', {
        _id: projectId,
        $or: [
          { ownerId: userId },
          { 'collaborators.userId': userId, 'collaborators.role': 'admin' }
        ],
        status: { $ne: 'deleted' }
      });
      
      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: 'Project not found or insufficient permissions',
          requestId: req.id
        });
      }
      
      // Check if new name conflicts (if name is being changed)
      if (updateData.name && updateData.name !== project.name) {
        const existingProject = await db.findOne('projects', {
          ownerId: project.ownerId,
          name: updateData.name,
          _id: { $ne: projectId },
          status: { $ne: 'deleted' }
        });
        
        if (existingProject) {
          return res.status(409).json({
            error: 'Project name conflict',
            message: 'A project with this name already exists',
            requestId: req.id
          });
        }
      }
      
      // Remove undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      updateData.updatedAt = new Date();
      
      // Update project
      const result = await db.updateOne('projects',
        { _id: projectId },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({
          error: 'Project not found',
          message: 'Project not found',
          requestId: req.id
        });
      }
      
      // Log activity
      await db.create('project_activities', {
        projectId,
        userId,
        action: 'project_updated',
        details: {
          updatedFields: Object.keys(updateData)
        },
        createdAt: new Date()
      });
      
      // Get updated project
      const updatedProject = await db.findOne('projects', { _id: projectId });
      
      logger.info('Project updated successfully', {
        projectId,
        updatedFields: Object.keys(updateData),
        userId,
        requestId: req.id
      });
      
      res.json({
        success: true,
        message: 'Project updated successfully',
        project: updatedProject,
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
 * /projects/{projectId}:
 *   delete:
 *     summary: Delete project
 *     description: Delete a project (soft delete)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: query
 *         name: permanent
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Permanent deletion (owner only)
 *     responses:
 *       200:
 *         description: Project deleted successfully
 */
router.delete('/:projectId',
  authenticate,
  [
    param('projectId').isString().notEmpty(),
    query('permanent').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;
      const { permanent = false } = req.query;
      
      // Check project ownership
      const project = await db.findOne('projects', {
        _id: projectId,
        ownerId: userId,
        status: { $ne: 'deleted' }
      });
      
      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: 'Project not found or insufficient permissions',
          requestId: req.id
        });
      }
      
      if (permanent) {
        // Permanent deletion - remove all related data
        await Promise.all([
          db.deleteMany('projects', { _id: projectId }),
          db.deleteMany('project_activities', { projectId }),
          db.deleteMany('project_files', { projectId }),
          db.deleteMany('project_collaborations', { projectId })
        ]);
        
        // In a real implementation, also delete workspace files
        // await deleteWorkspaceFiles(project.workspace.path);
        
        logger.info('Project permanently deleted', {
          projectId,
          projectName: project.name,
          userId,
          requestId: req.id
        });
        
        res.json({
          success: true,
          message: 'Project permanently deleted',
          requestId: req.id,
          timestamp: new Date().toISOString()
        });
      } else {
        // Soft deletion
        await db.updateOne('projects',
          { _id: projectId },
          { 
            $set: { 
              status: 'deleted',
              deletedAt: new Date(),
              updatedAt: new Date()
            }
          }
        );
        
        logger.info('Project soft deleted', {
          projectId,
          projectName: project.name,
          userId,
          requestId: req.id
        });
        
        res.json({
          success: true,
          message: 'Project moved to trash',
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
// File Management Routes
// =============================================================================

/**
 * @swagger
 * /projects/{projectId}/files:
 *   get:
 *     summary: Get project files
 *     description: Get file structure of a project
 *     tags: [Project Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: query
 *         name: path
 *         schema:
 *           type: string
 *           default: /
 *         description: Directory path
 *     responses:
 *       200:
 *         description: Project file structure
 */
router.get('/:projectId/files',
  authenticate,
  [
    param('projectId').isString().notEmpty(),
    query('path').optional().isString()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;
      const { path = '/' } = req.query;
      
      // Check project access
      const project = await db.findOne('projects', {
        _id: projectId,
        $or: [
          { ownerId: userId },
          { 'collaborators.userId': userId },
          { visibility: 'public' }
        ],
        status: { $ne: 'deleted' }
      });
      
      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: 'Project not found or access denied',
          requestId: req.id
        });
      }
      
      // Get files in the specified path
      const files = await db.find('project_files', {
        projectId,
        path: { $regex: `^${path.replace(/\/$/, '')}` },
        isDeleted: { $ne: true }
      }, {
        sort: { type: 1, name: 1 } // Folders first, then files
      });
      
      res.json({
        success: true,
        files,
        path,
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
 * /projects/{projectId}/files:
 *   post:
 *     summary: Upload project files
 *     description: Upload files to a project
 *     tags: [Project Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
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
 *                 description: Files to upload
 *               path:
 *                 type: string
 *                 default: /
 *                 description: Upload path
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 */
router.post('/:projectId/files',
  authenticate,
  uploadLimiter,
  [
    param('projectId').isString().notEmpty()
  ],
  handleValidationErrors,
  upload.array('files', 50),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;
      const { path = '/' } = req.body;
      
      // Check project write access
      const project = await db.findOne('projects', {
        _id: projectId,
        $or: [
          { ownerId: userId },
          { 'collaborators.userId': userId, 'collaborators.permissions': { $in: ['write', 'admin'] } }
        ],
        status: { $ne: 'deleted' }
      });
      
      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: 'Project not found or insufficient permissions',
          requestId: req.id
        });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'No files provided',
          message: 'At least one file is required',
          requestId: req.id
        });
      }
      
      const uploadedFiles = [];
      
      for (const file of req.files) {
        const fileData = {
          projectId,
          name: file.originalname,
          path: path.endsWith('/') ? path : `${path}/`,
          fullPath: `${path.endsWith('/') ? path : `${path}/`}${file.originalname}`,
          type: file.mimetype.startsWith('text/') || file.mimetype === 'application/json' ? 'file' : 'binary',
          size: file.size,
          mimetype: file.mimetype,
          content: file.buffer.toString('utf8'), // In a real implementation, store in file system or cloud storage
          uploadedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false
        };
        
        const result = await db.create('project_files', fileData);
        uploadedFiles.push({
          ...fileData,
          _id: result.insertedId,
          content: undefined // Don't return content in response
        });
      }
      
      // Update project stats
      await db.updateOne('projects',
        { _id: projectId },
        { 
          $inc: { 'stats.filesCount': uploadedFiles.length },
          $set: { updatedAt: new Date() }
        }
      );
      
      // Log activity
      await db.create('project_activities', {
        projectId,
        userId,
        action: 'files_uploaded',
        details: {
          filesCount: uploadedFiles.length,
          path
        },
        createdAt: new Date()
      });
      
      logger.info('Files uploaded to project', {
        projectId,
        filesCount: uploadedFiles.length,
        userId,
        requestId: req.id
      });
      
      res.status(201).json({
        success: true,
        message: 'Files uploaded successfully',
        files: uploadedFiles,
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
 * /projects/{projectId}/files/{fileId}:
 *   get:
 *     summary: Get file content
 *     description: Get content of a specific file
 *     tags: [Project Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File content
 */
router.get('/:projectId/files/:fileId',
  authenticate,
  [
    param('projectId').isString().notEmpty(),
    param('fileId').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { projectId, fileId } = req.params;
      
      // Check project access
      const project = await db.findOne('projects', {
        _id: projectId,
        $or: [
          { ownerId: userId },
          { 'collaborators.userId': userId },
          { visibility: 'public' }
        ],
        status: { $ne: 'deleted' }
      });
      
      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: 'Project not found or access denied',
          requestId: req.id
        });
      }
      
      // Get file
      const file = await db.findOne('project_files', {
        _id: fileId,
        projectId,
        isDeleted: { $ne: true }
      });
      
      if (!file) {
        return res.status(404).json({
          error: 'File not found',
          message: 'File not found in project',
          requestId: req.id
        });
      }
      
      res.json({
        success: true,
        file,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Collaboration Routes
// =============================================================================

/**
 * @swagger
 * /projects/{projectId}/collaborators:
 *   get:
 *     summary: Get project collaborators
 *     description: Get list of project collaborators
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: List of collaborators
 */
router.get('/:projectId/collaborators',
  authenticate,
  [
    param('projectId').isString().notEmpty()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;
      
      // Check project access
      const project = await db.findOne('projects', {
        _id: projectId,
        $or: [
          { ownerId: userId },
          { 'collaborators.userId': userId }
        ],
        status: { $ne: 'deleted' }
      });
      
      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: 'Project not found or access denied',
          requestId: req.id
        });
      }
      
      // Get collaborator details
      const collaboratorIds = project.collaborators.map(c => c.userId);
      const users = await db.find('users', 
        { _id: { $in: collaboratorIds } },
        { projection: { password: 0 } }
      );
      
      const collaborators = project.collaborators.map(collab => {
        const user = users.find(u => u._id === collab.userId);
        return {
          ...collab,
          user
        };
      });
      
      res.json({
        success: true,
        collaborators,
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
 * /projects/{projectId}/collaborators:
 *   post:
 *     summary: Add collaborator
 *     description: Add a collaborator to the project
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Collaborator email
 *               role:
 *                 type: string
 *                 enum: [viewer, editor, admin]
 *                 default: editor
 *                 description: Collaborator role
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific permissions
 *     responses:
 *       201:
 *         description: Collaborator added successfully
 */
router.post('/:projectId/collaborators',
  authenticate,
  [
    param('projectId').isString().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('role').optional().isIn(['viewer', 'editor', 'admin']),
    body('permissions').optional().isArray()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;
      const { email, role = 'editor', permissions = [] } = req.body;
      
      // Check project ownership or admin access
      const project = await db.findOne('projects', {
        _id: projectId,
        $or: [
          { ownerId: userId },
          { 'collaborators.userId': userId, 'collaborators.role': 'admin' }
        ],
        status: { $ne: 'deleted' }
      });
      
      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: 'Project not found or insufficient permissions',
          requestId: req.id
        });
      }
      
      // Find user by email
      const collaboratorUser = await db.findOne('users', { email });
      
      if (!collaboratorUser) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User with this email not found',
          requestId: req.id
        });
      }
      
      // Check if already a collaborator
      const existingCollaborator = project.collaborators.find(c => c.userId === collaboratorUser._id);
      
      if (existingCollaborator) {
        return res.status(409).json({
          error: 'Already a collaborator',
          message: 'User is already a collaborator on this project',
          requestId: req.id
        });
      }
      
      // Add collaborator
      const collaborator = {
        userId: collaboratorUser._id,
        role,
        permissions: role === 'admin' ? ['read', 'write', 'admin'] : 
                    role === 'editor' ? ['read', 'write'] : ['read'],
        addedBy: userId,
        addedAt: new Date()
      };
      
      await db.updateOne('projects',
        { _id: projectId },
        { 
          $push: { collaborators: collaborator },
          $set: { updatedAt: new Date() }
        }
      );
      
      // Log activity
      await db.create('project_activities', {
        projectId,
        userId,
        action: 'collaborator_added',
        details: {
          collaboratorId: collaboratorUser._id,
          collaboratorEmail: email,
          role
        },
        createdAt: new Date()
      });
      
      logger.info('Collaborator added to project', {
        projectId,
        collaboratorId: collaboratorUser._id,
        role,
        addedBy: userId,
        requestId: req.id
      });
      
      res.status(201).json({
        success: true,
        message: 'Collaborator added successfully',
        collaborator: {
          ...collaborator,
          user: {
            _id: collaboratorUser._id,
            email: collaboratorUser.email,
            username: collaboratorUser.username,
            fullName: collaboratorUser.fullName
          }
        },
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Project Templates
// =============================================================================

/**
 * @swagger
 * /projects/templates:
 *   get:
 *     summary: Get project templates
 *     description: Get available project templates
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Template category
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Programming language
 *     responses:
 *       200:
 *         description: List of templates
 */
router.get('/templates',
  authenticate,
  [
    query('category').optional().isString(),
    query('language').optional().isString()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { category, language } = req.query;
      
      // Build query
      const query = { isActive: true };
      
      if (category) {
        query.category = category;
      }
      
      if (language) {
        query.language = language;
      }
      
      // Get templates
      const templates = await db.find('project_templates', query, {
        sort: { popularity: -1, name: 1 },
        projection: {
          structure: 0 // Don't return full structure in list
        }
      });
      
      res.json({
        success: true,
        templates,
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
  logger.error('Project Management Route Error', {
    error: error.message,
    stack: error.stack,
    requestId: req.id,
    userId: req.user?.id,
    endpoint: req.originalUrl
  });
  
  // Handle specific project management errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.name === 'ProjectNotFoundError') {
    return res.status(404).json({
      error: 'Project Not Found',
      message: error.message,
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.name === 'InsufficientPermissionsError') {
    return res.status(403).json({
      error: 'Insufficient Permissions',
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