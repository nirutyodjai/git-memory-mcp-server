/**
 * MCP Protocol Routes for Git Memory MCP Server
 * Provides standardized endpoints for trae-agent integration
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const GitMemoryService = require('../services/GitMemoryService');
const SemanticMemoryService = require('../services/SemanticMemoryService');
const GitOperationsService = require('../services/GitOperationsService');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimitMiddleware = require('../middleware/rateLimitMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Apply authentication and rate limiting to all MCP routes
router.use(authMiddleware);
router.use(rateLimitMiddleware);

// Error handler for validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// MCP Protocol Response Wrapper
const mcpResponse = (data, metadata = {}) => {
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      server: 'git-memory-mcp-server',
      version: '1.2.1',
      ...metadata
    }
  };
};

// MCP Protocol Error Response
const mcpError = (message, code = 'INTERNAL_ERROR', details = null) => {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  };
};

// =============================================================================
// GIT OPERATIONS ENDPOINTS
// =============================================================================

/**
 * GET /api/v1/git/status
 * Get the current status of a Git repository
 */
router.post('/git/status', [
  body('repository_path').isString().notEmpty().withMessage('Repository path is required'),
  body('include_untracked').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const { repository_path, include_untracked = true } = req.body;
    
    logger.info('MCP Git Status Request', {
      repository_path,
      include_untracked,
      user_id: req.user?.id
    });
    
    const gitService = new GitOperationsService();
    const status = await gitService.getStatus(repository_path, { includeUntracked: include_untracked });
    
    res.json(mcpResponse(status, {
      operation: 'git_status',
      repository_path
    }));
    
  } catch (error) {
    logger.error('MCP Git Status Error', { error: error.message, stack: error.stack });
    res.status(500).json(mcpError(error.message, 'GIT_STATUS_ERROR'));
  }
});

/**
 * POST /api/v1/git/log
 * Get commit history from a Git repository
 */
router.post('/git/log', [
  body('repository_path').isString().notEmpty().withMessage('Repository path is required'),
  body('limit').optional().isInt({ min: 1, max: 1000 }),
  body('branch').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { repository_path, limit = 10, branch } = req.body;
    
    logger.info('MCP Git Log Request', {
      repository_path,
      limit,
      branch,
      user_id: req.user?.id
    });
    
    const gitService = new GitOperationsService();
    const log = await gitService.getLog(repository_path, { limit, branch });
    
    res.json(mcpResponse(log, {
      operation: 'git_log',
      repository_path,
      commit_count: log.length
    }));
    
  } catch (error) {
    logger.error('MCP Git Log Error', { error: error.message, stack: error.stack });
    res.status(500).json(mcpError(error.message, 'GIT_LOG_ERROR'));
  }
});

/**
 * POST /api/v1/git/diff
 * Get differences between commits or working directory
 */
router.post('/git/diff', [
  body('repository_path').isString().notEmpty().withMessage('Repository path is required'),
  body('from_commit').optional().isString(),
  body('to_commit').optional().isString(),
  body('file_path').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { repository_path, from_commit, to_commit, file_path } = req.body;
    
    logger.info('MCP Git Diff Request', {
      repository_path,
      from_commit,
      to_commit,
      file_path,
      user_id: req.user?.id
    });
    
    const gitService = new GitOperationsService();
    const diff = await gitService.getDiff(repository_path, {
      fromCommit: from_commit,
      toCommit: to_commit,
      filePath: file_path
    });
    
    res.json(mcpResponse(diff, {
      operation: 'git_diff',
      repository_path
    }));
    
  } catch (error) {
    logger.error('MCP Git Diff Error', { error: error.message, stack: error.stack });
    res.status(500).json(mcpError(error.message, 'GIT_DIFF_ERROR'));
  }
});

/**
 * POST /api/v1/git/clone
 * Clone a Git repository
 */
router.post('/git/clone', [
  body('repository_url').isURL().withMessage('Valid repository URL is required'),
  body('destination_path').isString().notEmpty().withMessage('Destination path is required'),
  body('branch').optional().isString(),
  body('depth').optional().isInt({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const { repository_url, destination_path, branch, depth } = req.body;
    
    logger.info('MCP Git Clone Request', {
      repository_url,
      destination_path,
      branch,
      depth,
      user_id: req.user?.id
    });
    
    const gitService = new GitOperationsService();
    const result = await gitService.cloneRepository(repository_url, destination_path, {
      branch,
      depth
    });
    
    res.json(mcpResponse(result, {
      operation: 'git_clone',
      repository_url,
      destination_path
    }));
    
  } catch (error) {
    logger.error('MCP Git Clone Error', { error: error.message, stack: error.stack });
    res.status(500).json(mcpError(error.message, 'GIT_CLONE_ERROR'));
  }
});

/**
 * POST /api/v1/git/commit
 * Create a new commit in the repository
 */
router.post('/git/commit', [
  body('repository_path').isString().notEmpty().withMessage('Repository path is required'),
  body('message').isString().notEmpty().withMessage('Commit message is required'),
  body('files').optional().isArray(),
  body('author_name').optional().isString(),
  body('author_email').optional().isEmail()
], handleValidationErrors, async (req, res) => {
  try {
    const { repository_path, message, files, author_name, author_email } = req.body;
    
    logger.info('MCP Git Commit Request', {
      repository_path,
      message,
      files: files?.length || 'all',
      author_name,
      user_id: req.user?.id
    });
    
    const gitService = new GitOperationsService();
    const result = await gitService.createCommit(repository_path, message, {
      files,
      authorName: author_name,
      authorEmail: author_email
    });
    
    res.json(mcpResponse(result, {
      operation: 'git_commit',
      repository_path,
      commit_hash: result.hash
    }));
    
  } catch (error) {
    logger.error('MCP Git Commit Error', { error: error.message, stack: error.stack });
    res.status(500).json(mcpError(error.message, 'GIT_COMMIT_ERROR'));
  }
});

/**
 * POST /api/v1/git/branch
 * Manage Git branches (list, create, switch, delete)
 */
router.post('/git/branch', [
  body('repository_path').isString().notEmpty().withMessage('Repository path is required'),
  body('action').isIn(['list', 'create', 'switch', 'delete']).withMessage('Invalid action'),
  body('branch_name').optional().isString(),
  body('from_branch').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { repository_path, action, branch_name, from_branch } = req.body;
    
    logger.info('MCP Git Branch Request', {
      repository_path,
      action,
      branch_name,
      from_branch,
      user_id: req.user?.id
    });
    
    const gitService = new GitOperationsService();
    let result;
    
    switch (action) {
      case 'list':
        result = await gitService.listBranches(repository_path);
        break;
      case 'create':
        if (!branch_name) {
          throw new Error('Branch name is required for create action');
        }
        result = await gitService.createBranch(repository_path, branch_name, from_branch);
        break;
      case 'switch':
        if (!branch_name) {
          throw new Error('Branch name is required for switch action');
        }
        result = await gitService.switchBranch(repository_path, branch_name);
        break;
      case 'delete':
        if (!branch_name) {
          throw new Error('Branch name is required for delete action');
        }
        result = await gitService.deleteBranch(repository_path, branch_name);
        break;
    }
    
    res.json(mcpResponse(result, {
      operation: 'git_branch',
      action,
      repository_path
    }));
    
  } catch (error) {
    logger.error('MCP Git Branch Error', { error: error.message, stack: error.stack });
    res.status(500).json(mcpError(error.message, 'GIT_BRANCH_ERROR'));
  }
});

// =============================================================================
// MEMORY OPERATIONS ENDPOINTS
// =============================================================================

/**
 * POST /api/v1/memory/store
 * Store data in Git-based memory with semantic indexing
 */
router.post('/memory/store', [
  body('key').isString().notEmpty().withMessage('Key is required'),
  body('data').notEmpty().withMessage('Data is required'),
  body('metadata').optional().isObject(),
  body('tags').optional().isArray(),
  body('ttl').optional().isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const { key, data, metadata = {}, tags = [], ttl = 0 } = req.body;
    
    logger.info('MCP Memory Store Request', {
      key,
      data_size: JSON.stringify(data).length,
      tags,
      ttl,
      user_id: req.user?.id
    });
    
    const memoryService = new GitMemoryService();
    const result = await memoryService.store(key, data, {
      metadata: {
        ...metadata,
        user_id: req.user?.id,
        created_via: 'mcp_api'
      },
      tags,
      ttl
    });
    
    res.json(mcpResponse(result, {
      operation: 'memory_store',
      key,
      stored_at: result.timestamp
    }));
    
  } catch (error) {
    logger.error('MCP Memory Store Error', { error: error.message, stack: error.stack });
    res.status(500).json(mcpError(error.message, 'MEMORY_STORE_ERROR'));
  }
});

/**
 * POST /api/v1/memory/retrieve
 * Retrieve data from Git-based memory
 */
router.post('/memory/retrieve', [
  body('key').optional().isString(),
  body('query').optional().isString(),
  body('tags').optional().isArray(),
  body('limit').optional().isInt({ min: 1, max: 1000 }),
  body('similarity_threshold').optional().isFloat({ min: 0, max: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const { key, query, tags, limit = 10, similarity_threshold = 0.7 } = req.body;
    
    logger.info('MCP Memory Retrieve Request', {
      key,
      query,
      tags,
      limit,
      similarity_threshold,
      user_id: req.user?.id
    });
    
    let result;
    
    if (key) {
      // Direct key retrieval
      const memoryService = new GitMemoryService();
      result = await memoryService.retrieve(key);
      result = result ? [result] : [];
    } else if (query) {
      // Semantic search
      const semanticService = new SemanticMemoryService();
      result = await semanticService.search(query, {
        limit,
        threshold: similarity_threshold,
        tags
      });
    } else {
      // List with filters
      const memoryService = new GitMemoryService();
      result = await memoryService.list({ tags, limit });
    }
    
    res.json(mcpResponse(result, {
      operation: 'memory_retrieve',
      result_count: result.length,
      search_type: key ? 'direct' : query ? 'semantic' : 'list'
    }));
    
  } catch (error) {
    logger.error('MCP Memory Retrieve Error', { error: error.message, stack: error.stack });
    res.status(500).json(mcpError(error.message, 'MEMORY_RETRIEVE_ERROR'));
  }
});

/**
 * POST /api/v1/memory/list
 * List all memory entries with optional filtering
 */
router.post('/memory/list', [
  body('tags').optional().isArray(),
  body('limit').optional().isInt({ min: 1, max: 1000 }),
  body('offset').optional().isInt({ min: 0 }),
  body('sort_by').optional().isIn(['created_at', 'updated_at', 'key', 'size']),
  body('sort_order').optional().isIn(['asc', 'desc'])
], handleValidationErrors, async (req, res) => {
  try {
    const {
      tags,
      limit = 50,
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.body;
    
    logger.info('MCP Memory List Request', {
      tags,
      limit,
      offset,
      sort_by,
      sort_order,
      user_id: req.user?.id
    });
    
    const memoryService = new GitMemoryService();
    const result = await memoryService.list({
      tags,
      limit,
      offset,
      sortBy: sort_by,
      sortOrder: sort_order
    });
    
    res.json(mcpResponse(result, {
      operation: 'memory_list',
      total_count: result.length,
      offset,
      limit
    }));
    
  } catch (error) {
    logger.error('MCP Memory List Error', { error: error.message, stack: error.stack });
    res.status(500).json(mcpError(error.message, 'MEMORY_LIST_ERROR'));
  }
});

/**
 * POST /api/v1/memory/delete
 * Delete memory entries
 */
router.post('/memory/delete', [
  body('key').optional().isString(),
  body('keys').optional().isArray(),
  body('tags').optional().isArray(),
  body('confirm').isBoolean().withMessage('Confirmation is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { key, keys, tags, confirm } = req.body;
    
    if (!confirm) {
      return res.status(400).json(mcpError(
        'Deletion must be confirmed by setting confirm=true',
        'CONFIRMATION_REQUIRED'
      ));
    }
    
    logger.info('MCP Memory Delete Request', {
      key,
      keys: keys?.length,
      tags,
      user_id: req.user?.id
    });
    
    const memoryService = new GitMemoryService();
    let result;
    
    if (key) {
      result = await memoryService.delete(key);
    } else if (keys && keys.length > 0) {
      result = await memoryService.deleteMultiple(keys);
    } else if (tags && tags.length > 0) {
      result = await memoryService.deleteByTags(tags);
    } else {
      throw new Error('Must specify key, keys, or tags for deletion');
    }
    
    res.json(mcpResponse(result, {
      operation: 'memory_delete',
      deleted_count: result.deletedCount || 1
    }));
    
  } catch (error) {
    logger.error('MCP Memory Delete Error', { error: error.message, stack: error.stack });
    res.status(500).json(mcpError(error.message, 'MEMORY_DELETE_ERROR'));
  }
});

// =============================================================================
// SEMANTIC SEARCH ENDPOINTS
// =============================================================================

/**
 * POST /api/v1/semantic/search
 * Perform semantic search across all stored memories
 */
router.post('/semantic/search', [
  body('query').isString().notEmpty().withMessage('Search query is required'),
  body('limit').optional().isInt({ min: 1, max: 1000 }),
  body('threshold').optional().isFloat({ min: 0, max: 1 }),
  body('include_metadata').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const {
      query,
      limit = 10,
      threshold = 0.7,
      include_metadata = true
    } = req.body;
    
    logger.info('MCP Semantic Search Request', {
      query,
      limit,
      threshold,
      include_metadata,
      user_id: req.user?.id
    });
    
    const semanticService = new SemanticMemoryService();
    const results = await semanticService.search(query, {
      limit,
      threshold,
      includeMetadata: include_metadata
    });
    
    res.json(mcpResponse(results, {
      operation: 'semantic_search',
      query,
      result_count: results.length,
      threshold
    }));
    
  } catch (error) {
    logger.error('MCP Semantic Search Error', { error: error.message, stack: error.stack });
    res.status(500).json(mcpError(error.message, 'SEMANTIC_SEARCH_ERROR'));
  }
});

/**
 * POST /api/v1/semantic/index
 * Rebuild or update semantic index
 */
router.post('/semantic/index', [
  body('force_rebuild').optional().isBoolean(),
  body('batch_size').optional().isInt({ min: 1, max: 1000 })
], handleValidationErrors, async (req, res) => {
  try {
    const { force_rebuild = false, batch_size = 100 } = req.body;
    
    logger.info('MCP Semantic Index Request', {
      force_rebuild,
      batch_size,
      user_id: req.user?.id
    });
    
    const semanticService = new SemanticMemoryService();
    const result = await semanticService.rebuildIndex({
      forceRebuild: force_rebuild,
      batchSize: batch_size
    });
    
    res.json(mcpResponse(result, {
      operation: 'semantic_index',
      indexed_count: result.indexedCount,
      duration: result.duration
    }));
    
  } catch (error) {
    logger.error('MCP Semantic Index Error', { error: error.message, stack: error.stack });
    res.status(500).json(mcpError(error.message, 'SEMANTIC_INDEX_ERROR'));
  }
});

// =============================================================================
// HEALTH AND STATUS ENDPOINTS
// =============================================================================

/**
 * GET /api/v1/health
 * Check server health and status
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.2.1',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        git: 'operational',
        memory: 'operational',
        semantic: 'operational'
      }
    };
    
    res.json(mcpResponse(health, {
      operation: 'health_check'
    }));
    
  } catch (error) {
    logger.error('MCP Health Check Error', { error: error.message });
    res.status(500).json(mcpError(error.message, 'HEALTH_CHECK_ERROR'));
  }
});

/**
 * GET /api/v1/stats
 * Get detailed server statistics
 */
router.get('/stats', [
  query('include_memory').optional().isBoolean(),
  query('include_git').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const { include_memory = true, include_git = true } = req.query;
    
    const stats = {
      server: {
        version: '1.2.1',
        uptime: process.uptime(),
        node_version: process.version,
        platform: process.platform
      },
      performance: {
        memory_usage: process.memoryUsage(),
        cpu_usage: process.cpuUsage()
      }
    };
    
    if (include_memory) {
      const memoryService = new GitMemoryService();
      stats.memory = await memoryService.getStats();
    }
    
    if (include_git) {
      const gitService = new GitOperationsService();
      stats.git = await gitService.getStats();
    }
    
    res.json(mcpResponse(stats, {
      operation: 'server_stats',
      generated_at: new Date().toISOString()
    }));
    
  } catch (error) {
    logger.error('MCP Server Stats Error', { error: error.message });
    res.status(500).json(mcpError(error.message, 'SERVER_STATS_ERROR'));
  }
});

module.exports = router;