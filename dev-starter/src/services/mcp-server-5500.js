/**
 * MCP Server for Port 5500 - Trae Agent Integration
 * Advanced Git Memory MCP Server with semantic memory and AI-powered operations
 * 
 * This server implements the Model Context Protocol (MCP) for integration with trae-agent
 * Provides Git operations, semantic memory, and AI assistance capabilities
 * 
 * @version 1.0.0
 * @author NEXUS Development Team
 * @license MIT
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const yaml = require('js-yaml');

// Import services
const GitOperationsService = require('./GitOperationsService');
const MemoryOperationsService = require('./MemoryOperationsService');
const SemanticMemoryService = require('./SemanticMemoryService');
const AuthService = require('../auth/AuthService');
const logger = require('../utils/logger');
const { validateRequest } = require('../middleware/validation');
const { errorHandler } = require('../middleware/errorHandler');
const { requestLogger } = require('../middleware/requestLogger');

class MCPServer5500 {
  constructor() {
    this.app = express();
    this.port = 5500;
    this.server = null;
    this.config = null;
    
    // Service instances
    this.gitService = new GitOperationsService();
    this.memoryService = new MemoryOperationsService();
    this.semanticService = new SemanticMemoryService();
    this.authService = new AuthService();
    
    // Server statistics
    this.stats = {
      startTime: new Date(),
      requestCount: 0,
      errorCount: 0,
      activeConnections: 0,
      lastRequestTime: null,
      uptime: 0
    };
    
    // Note: init() will be called separately after construction
  }
  
  /**
   * Initialize the MCP server
   */
  async init() {
    try {
      // Load configuration
      await this.loadConfig();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      logger.info('MCP Server 5500 initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize MCP Server 5500:', error);
      throw error;
    }
  }
  
  /**
   * Load configuration from trae-mcp-config.yaml
   */
  async loadConfig() {
    try {
      const configPath = path.join(__dirname, '../../trae-mcp-config.yaml');
      const configFile = await fs.readFile(configPath, 'utf8');
      this.config = yaml.load(configFile);
      
      // Override with environment-specific config
      const env = process.env.NODE_ENV || 'development';
      if (this.config.environments && this.config.environments[env]) {
        this.config = { ...this.config, ...this.config.environments[env] };
      }
      
      logger.info(`Configuration loaded for environment: ${env}`);
    } catch (error) {
      logger.error('Failed to load configuration:', error);
      // Use default configuration
      this.config = this.getDefaultConfig();
    }
  }
  
  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      server: {
        host: 'localhost',
        port: 5500,
        protocol: 'http',
        base_path: '/api/v1',
        timeout: 30000,
        max_retries: 3
      },
      auth: {
        type: 'bearer',
        required: true
      },
      rate_limiting: {
        enabled: true,
        requests_per_minute: 100,
        burst_limit: 20
      },
      logging: {
        level: 'info',
        format: 'json'
      },
      features: {
        git_operations: true,
        semantic_memory: true,
        vector_search: true,
        compression: true,
        encryption: false
      }
    };
  }
  
  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));
    
    // CORS configuration
    const corsOptions = {
      origin: this.config.security?.cors?.origins || ['*'],
      methods: this.config.security?.cors?.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      credentials: true
    };
    this.app.use(cors(corsOptions));
    
    // Compression
    this.app.use(compression());
    
    // Rate limiting
    if (this.config.rate_limiting?.enabled) {
      const limiter = rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: this.config.rate_limiting.requests_per_minute || 100,
        message: {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: 60
        },
        standardHeaders: true,
        legacyHeaders: false
      });
      this.app.use(limiter);
    }
    
    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging and tracking
    this.app.use(requestLogger());
    this.app.use(this.trackRequests.bind(this));
  }
  
  /**
   * Track request statistics
   */
  trackRequests(req, res, next) {
    this.stats.requestCount++;
    this.stats.lastRequestTime = new Date();
    this.stats.activeConnections++;
    
    // Add request ID
    req.requestId = uuidv4();
    res.setHeader('X-Request-ID', req.requestId);
    
    // Track response
    res.on('finish', () => {
      this.stats.activeConnections--;
      if (res.statusCode >= 400) {
        this.stats.errorCount++;
      }
    });
    
    next();
  }
  
  /**
   * Setup API routes
   */
  setupRoutes() {
    const basePath = this.config.server?.base_path || '/api/v1';
    
    // Health check endpoint
    this.app.get('/health', this.handleHealthCheck.bind(this));
    this.app.get(`${basePath}/health`, this.handleHealthCheck.bind(this));
    
    // Server statistics
    this.app.get('/stats', this.handleServerStats.bind(this));
    this.app.get(`${basePath}/stats`, this.handleServerStats.bind(this));
    
    // MCP Protocol endpoints
    this.app.get(`${basePath}/capabilities`, this.handleCapabilities.bind(this));
    this.app.post(`${basePath}/tools/list`, this.handleToolsList.bind(this));
    this.app.post(`${basePath}/tools/call`, this.handleToolCall.bind(this));
    
    // Git operations
    this.app.post(`${basePath}/git/status`, this.authMiddleware.bind(this), this.handleGitStatus.bind(this));
    this.app.post(`${basePath}/git/log`, this.authMiddleware.bind(this), this.handleGitLog.bind(this));
    this.app.post(`${basePath}/git/diff`, this.authMiddleware.bind(this), this.handleGitDiff.bind(this));
    this.app.post(`${basePath}/git/clone`, this.authMiddleware.bind(this), this.handleGitClone.bind(this));
    this.app.post(`${basePath}/git/commit`, this.authMiddleware.bind(this), this.handleGitCommit.bind(this));
    this.app.post(`${basePath}/git/branch`, this.authMiddleware.bind(this), this.handleGitBranch.bind(this));
    
    // Memory operations
    this.app.post(`${basePath}/memory/store`, this.authMiddleware.bind(this), this.handleMemoryStore.bind(this));
    this.app.post(`${basePath}/memory/retrieve`, this.authMiddleware.bind(this), this.handleMemoryRetrieve.bind(this));
    this.app.post(`${basePath}/memory/list`, this.authMiddleware.bind(this), this.handleMemoryList.bind(this));
    this.app.post(`${basePath}/memory/delete`, this.authMiddleware.bind(this), this.handleMemoryDelete.bind(this));
    
    // Semantic search operations
    this.app.post(`${basePath}/semantic/search`, this.authMiddleware.bind(this), this.handleSemanticSearch.bind(this));
    this.app.post(`${basePath}/semantic/index`, this.authMiddleware.bind(this), this.handleSemanticIndex.bind(this));
    
    // Authentication endpoints
    this.app.post(`${basePath}/auth/token`, this.handleAuthToken.bind(this));
    this.app.post(`${basePath}/auth/refresh`, this.handleAuthRefresh.bind(this));
    
    // Catch-all for undefined routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    });
  }
  
  /**
   * Authentication middleware
   */
  async authMiddleware(req, res, next) {
    try {
      if (!this.config.auth?.required) {
        return next();
      }
      
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Bearer token required',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
      }
      
      const token = authHeader.substring(7);
      const user = await this.authService.verifyToken(token);
      
      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
      }
      
      req.user = user;
      next();
    } catch (error) {
      logger.error('Authentication error:', error);
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication failed',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }
  
  /**
   * Handle health check requests
   */
  async handleHealthCheck(req, res) {
    try {
      const uptime = Date.now() - this.stats.startTime.getTime();
      const memoryUsage = process.memoryUsage();
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: uptime,
        version: this.config.version || '1.0.0',
        server: {
          port: this.port,
          environment: process.env.NODE_ENV || 'development'
        },
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
          external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
        },
        stats: {
          requestCount: this.stats.requestCount,
          errorCount: this.stats.errorCount,
          activeConnections: this.stats.activeConnections,
          lastRequestTime: this.stats.lastRequestTime
        },
        services: {
          git: await this.gitService.isHealthy(),
          memory: await this.memoryService.isHealthy(),
          semantic: await this.semanticService.isHealthy()
        }
      };
      
      res.json(health);
    } catch (error) {
      logger.error('Health check error:', error);
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }
  
  /**
   * Handle server statistics requests
   */
  async handleServerStats(req, res) {
    try {
      const includeMemory = req.query.include_memory !== 'false';
      const includeGit = req.query.include_git !== 'false';
      
      const stats = {
        server: {
          uptime: Date.now() - this.stats.startTime.getTime(),
          requestCount: this.stats.requestCount,
          errorCount: this.stats.errorCount,
          activeConnections: this.stats.activeConnections,
          lastRequestTime: this.stats.lastRequestTime,
          errorRate: this.stats.requestCount > 0 ? (this.stats.errorCount / this.stats.requestCount) * 100 : 0
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      };
      
      if (includeMemory) {
        stats.memory = await this.memoryService.getStats();
      }
      
      if (includeGit) {
        stats.git = await this.gitService.getStats();
      }
      
      res.json(stats);
    } catch (error) {
      logger.error('Server stats error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve server statistics',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }
  
  /**
   * Handle MCP capabilities request
   */
  async handleCapabilities(req, res) {
    try {
      const capabilities = {
        protocol_version: '1.0.0',
        server_info: {
          name: this.config.name || 'Git Memory MCP Server',
          version: this.config.version || '1.0.0',
          description: this.config.description || 'Advanced MCP server with Git-based memory persistence'
        },
        capabilities: this.config.capabilities || {
          tools: true,
          resources: true,
          prompts: true,
          logging: true,
          streaming: false,
          notifications: false
        },
        features: this.config.features || {
          git_operations: true,
          semantic_memory: true,
          vector_search: true
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      };
      
      res.json(capabilities);
    } catch (error) {
      logger.error('Capabilities error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve capabilities',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }
  
  /**
   * Handle tools list request
   */
  async handleToolsList(req, res) {
    try {
      const tools = this.config.tools || [];
      
      res.json({
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters || [],
          category: tool.category || 'general'
        })),
        count: tools.length,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      logger.error('Tools list error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve tools list',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }
  
  /**
   * Handle tool call request
   */
  async handleToolCall(req, res) {
    try {
      const { tool_name, parameters } = req.body;
      
      if (!tool_name) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'tool_name is required',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
      }
      
      // Route to appropriate handler based on tool name
      let result;
      
      if (tool_name.startsWith('git_')) {
        result = await this.handleGitToolCall(tool_name, parameters, req);
      } else if (tool_name.startsWith('memory_')) {
        result = await this.handleMemoryToolCall(tool_name, parameters, req);
      } else if (tool_name.startsWith('semantic_')) {
        result = await this.handleSemanticToolCall(tool_name, parameters, req);
      } else {
        return res.status(404).json({
          error: 'Tool Not Found',
          message: `Tool '${tool_name}' is not available`,
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
      }
      
      res.json({
        tool_name,
        result,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      logger.error('Tool call error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Tool execution failed',
        details: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }
  
  // Git operation handlers
  async handleGitStatus(req, res, next) {
    try {
      const { repoPath } = req.body;
      if (!repoPath) {
        return res.status(400).json({ error: 'repoPath is required' });
      }
      const status = await this.gitService.getStatus(repoPath);
      res.json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Handle Git Log operation
   */
  async handleGitLog(req, res, next) {
    try {
      const { repoPath, options } = req.body;
      if (!repoPath) {
        return res.status(400).json({ error: 'repoPath is required' });
      }
      const log = await this.gitService.getLog(repoPath, options);
      res.json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  }
  
    /**
   * Handle Git Diff operation
   */
  async handleGitDiff(req, res, next) {
    try {
      const { repoPath, options } = req.body;
      if (!repoPath) {
        return res.status(400).json({ error: 'repoPath is required' });
      }
      const diff = await this.gitService.getDiff(repoPath, options);
      res.json({ success: true, data: diff });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Handle Git Clone operation
   */
  async handleGitClone(req, res, next) {
    try {
      const { repoUrl, clonePath } = req.body;
      if (!repoUrl || !clonePath) {
        return res.status(400).json({ error: 'repoUrl and clonePath are required' });
      }
      const result = await this.gitService.clone(repoUrl, clonePath);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Handle Git Commit operation
   */
  async handleGitCommit(req, res, next) {
    try {
      const { repoPath, message } = req.body;
      if (!repoPath || !message) {
        return res.status(400).json({ error: 'repoPath and message are required' });
      }
      // For simplicity, we'll add all changes. A real implementation might need more specific file handling.
      await this.gitService.add(repoPath, '.');
      const commitSha = await this.gitService.commit(repoPath, message);
      res.json({ success: true, data: { commitSha } });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Handle Git Branch operation
   */
  async handleGitBranch(req, res, next) {
    try {
      const { repoPath, branchName, create } = req.body;
      if (!repoPath) {
        return res.status(400).json({ error: 'repoPath is required' });
      }

      if (create && branchName) {
        const result = await this.gitService.createBranch(repoPath, branchName);
        return res.json({ success: true, data: result });
      } else if (branchName) {
        const result = await this.gitService.checkout(repoPath, branchName);
        return res.json({ success: true, data: result });
      } else {
        const branches = await this.gitService.listBranches(repoPath);
        return res.json({ success: true, data: branches });
      }
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Handle list available tools
   */
  async handleToolsList(req, res, next) {
    try {
      const tools = this.config.tools || [];
      
      res.json({
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters || [],
          category: tool.category || 'general'
        })),
        count: tools.length,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      logger.error('Tools list error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve tools list',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }
  
  /**
   * Handle tool call request
   */
  async handleToolCall(req, res) {
    try {
      const { tool_name, parameters } = req.body;
      
      if (!tool_name) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'tool_name is required',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
      }
      
      // Route to appropriate handler based on tool name
      let result;
      
      if (tool_name.startsWith('git_')) {
        result = await this.handleGitToolCall(tool_name, parameters, req);
      } else if (tool_name.startsWith('memory_')) {
        result = await this.handleMemoryToolCall(tool_name, parameters, req);
      } else if (tool_name.startsWith('semantic_')) {
        result = await this.handleSemanticToolCall(tool_name, parameters, req);
      } else {
        return res.status(404).json({
          error: 'Tool Not Found',
          message: `Tool '${tool_name}' is not available`,
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
      }
      
      res.json({
        tool_name,
        result,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    } catch (error) {
      logger.error('Tool call error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Tool execution failed',
        details: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }
  
  // Git operation handlers
  async handleGitStatus(req, res) {
    try {
      const { repository_path, include_untracked = true } = req.body;
      const result = await this.gitService.getStatus(repository_path, { include_untracked });
      res.json({ result, timestamp: new Date().toISOString(), requestId: req.requestId });
    } catch (error) {
      logger.error('Git status error:', error);
      res.status(500).json({ error: error.message, timestamp: new Date().toISOString(), requestId: req.requestId });
    }
  }
  
  async handleGitLog(req, res) {
    try {
      const { repository_path, limit = 10, branch } = req.body;
      const result = await this.gitService.getLog(repository_path, { limit, branch });
      res.json({ result, timestamp: new Date().toISOString(), requestId: req.requestId });
    } catch (error) {
      logger.error('Git log error:', error);
      res.status(500).json({ error: error.message, timestamp: new Date().toISOString(), requestId: req.requestId });
    }
  }
  
  async handleGitDiff(req, res) {
    try {
      const { repository_path, from_commit, to_commit, file_path } = req.body;
      const result = await this.gitService.getDiff(repository_path, { from_commit, to_commit, file_path });
      res.json({ result, timestamp: new Date().toISOString(), requestId: req.requestId });
    } catch (error) {
      logger.error('Git diff error:', error);
      res.status(500).json({ error: error.message, timestamp: new Date().toISOString(), requestId: req.requestId });
    }
  }
  
  async handleGitClone(req, res) {
    try {
      const { repository_url, destination_path, branch, depth } = req.body;
      const result = await this.gitService.clone(repository_url, destination_path, { branch, depth });
      res.json({ result, timestamp: new Date().toISOString(), requestId: req.requestId });
    } catch (error) {
      logger.error('Git clone error:', error);
      res.status(500).json({ error: error.message, timestamp: new Date().toISOString(), requestId: req.requestId });
    }
  }
  
  async handleGitCommit(req, res) {
    try {
      const { repository_path, message, files, author_name, author_email } = req.body;
      const result = await this.gitService.commit(repository_path, message, { files, author_name, author_email });
      res.json({ result, timestamp: new Date().toISOString(), requestId: req.requestId });
    } catch (error) {
      logger.error('Git commit error:', error);
      res.status(500).json({ error: error.message, timestamp: new Date().toISOString(), requestId: req.requestId });
    }
  }
  
  async handleGitBranch(req, res) {
    try {
      const { repository_path, action, branch_name, from_branch } = req.body;
      const result = await this.gitService.manageBranch(repository_path, action, { branch_name, from_branch });
      res.json({ result, timestamp: new Date().toISOString(), requestId: req.requestId });
    } catch (error) {
      logger.error('Git branch error:', error);
      res.status(500).json({ error: error.message, timestamp: new Date().toISOString(), requestId: req.requestId });
    }
  }
  
  // Memory operation handlers
  async handleMemoryStore(req, res) {
    try {
      const { key, data, metadata, tags, ttl } = req.body;
      const result = await this.memoryService.store(key, data, { metadata, tags, ttl });
      res.json({ result, timestamp: new Date().toISOString(), requestId: req.requestId });
    } catch (error) {
      logger.error('Memory store error:', error);
      res.status(500).json({ error: error.message, timestamp: new Date().toISOString(), requestId: req.requestId });
    }
  }
  
  async handleMemoryRetrieve(req, res) {
    try {
      const { key, query, tags, limit, similarity_threshold } = req.body;
      const result = await this.memoryService.retrieve({ key, query, tags, limit, similarity_threshold });
      res.json({ result, timestamp: new Date().toISOString(), requestId: req.requestId });
    } catch (error) {
      logger.error('Memory retrieve error:', error);
      res.status(500).json({ error: error.message, timestamp: new Date().toISOString(), requestId: req.requestId });
    }
  }
  
  async handleMemoryList(req, res) {
    try {
      const { tags, limit, offset, sort_by, sort_order } = req.body;
      const result = await this.memoryService.list({ tags, limit, offset, sort_by, sort_order });
      res.json({ result, timestamp: new Date().toISOString(), requestId: req.requestId });
    } catch (error) {
      logger.error('Memory list error:', error);
      res.status(500).json({ error: error.message, timestamp: new Date().toISOString(), requestId: req.requestId });
    }
  }
  
  async handleMemoryDelete(req, res) {
    try {
      const { key, keys, tags, confirm } = req.body;
      if (!confirm) {
        return res.status(400).json({
          error: 'Confirmation Required',
          message: 'confirm parameter must be true to delete memory entries',
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
      }
      const result = await this.memoryService.delete({ key, keys, tags });
      res.json({ result, timestamp: new Date().toISOString(), requestId: req.requestId });
    } catch (error) {
      logger.error('Memory delete error:', error);
      res.status(500).json({ error: error.message, timestamp: new Date().toISOString(), requestId: req.requestId });
    }
  }
  
  // Semantic search handlers
  async handleSemanticSearch(req, res) {
    try {
      const { query, limit, threshold, include_metadata } = req.body;
      const result = await this.semanticService.search(query, { limit, threshold, include_metadata });
      res.json({ result, timestamp: new Date().toISOString(), requestId: req.requestId });
    } catch (error) {
      logger.error('Semantic search error:', error);
      res.status(500).json({ error: error.message, timestamp: new Date().toISOString(), requestId: req.requestId });
    }
  }
  
  async handleSemanticIndex(req, res) {
    try {
      const { force_rebuild, batch_size } = req.body;
      const result = await this.semanticService.rebuildIndex({ force_rebuild, batch_size });
      res.json({ result, timestamp: new Date().toISOString(), requestId: req.requestId });
    } catch (error) {
      logger.error('Semantic index error:', error);
      res.status(500).json({ error: error.message, timestamp: new Date().toISOString(), requestId: req.requestId });
    }
  }
  
  // Authentication handlers
  async handleAuthToken(req, res) {
    try {
      const { username, password, api_key } = req.body;
      const result = await this.authService.generateToken({ username, password, api_key });
      res.json({ result, timestamp: new Date().toISOString(), requestId: req.requestId });
    } catch (error) {
      logger.error('Auth token error:', error);
      res.status(401).json({ error: error.message, timestamp: new Date().toISOString(), requestId: req.requestId });
    }
  }
  
  async handleAuthRefresh(req, res) {
    try {
      const { refresh_token } = req.body;
      const result = await this.authService.refreshToken(refresh_token);
      res.json({ result, timestamp: new Date().toISOString(), requestId: req.requestId });
    } catch (error) {
      logger.error('Auth refresh error:', error);
      res.status(401).json({ error: error.message, timestamp: new Date().toISOString(), requestId: req.requestId });
    }
  }
  
  // Tool call routing helpers
  async handleGitToolCall(toolName, parameters, req) {
    switch (toolName) {
      case 'git_status':
        return await this.gitService.getStatus(parameters.repository_path, parameters);
      case 'git_log':
        return await this.gitService.getLog(parameters.repository_path, parameters);
      case 'git_diff':
        return await this.gitService.getDiff(parameters.repository_path, parameters);
      case 'git_clone':
        return await this.gitService.clone(parameters.repository_url, parameters.destination_path, parameters);
      case 'git_commit':
        return await this.gitService.commit(parameters.repository_path, parameters.message, parameters);
      case 'git_branch':
        return await this.gitService.manageBranch(parameters.repository_path, parameters.action, parameters);
      default:
        throw new Error(`Unknown Git tool: ${toolName}`);
    }
  }
  
  async handleMemoryToolCall(toolName, parameters, req) {
    switch (toolName) {
      case 'memory_store':
        return await this.memoryService.store(parameters.key, parameters.data, parameters);
      case 'memory_retrieve':
        return await this.memoryService.retrieve(parameters);
      case 'memory_list':
        return await this.memoryService.list(parameters);
      case 'memory_delete':
        if (!parameters.confirm) {
          throw new Error('Confirmation required for delete operation');
        }
        return await this.memoryService.delete(parameters);
      default:
        throw new Error(`Unknown Memory tool: ${toolName}`);
    }
  }
  
  async handleSemanticToolCall(toolName, parameters, req) {
    switch (toolName) {
      case 'semantic_search':
        return await this.semanticService.search(parameters.query, parameters);
      case 'semantic_index':
        return await this.semanticService.rebuildIndex(parameters);
      default:
        throw new Error(`Unknown Semantic tool: ${toolName}`);
    }
  }
  
  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Global error handler
    this.app.use(errorHandler);
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown('SIGTERM');
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    // Handle process signals
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
  }
  
  /**
   * Start the server
   */
  async start() {
    try {
      const host = this.config.server?.host || 'localhost';
      const port = this.config.server?.port || this.port;
      
      logger.info(`Attempting to start server on ${host}:${port}...`);
      
      return new Promise((resolve, reject) => {
        // Handle server errors before starting
        const errorHandler = (error) => {
          logger.error('Server error:', error);
          if (error.code === 'EADDRINUSE') {
            logger.error(`Port ${port} is already in use`);
          }
          reject(error);
        };
        
        this.server = this.app.listen(port, host, () => {
          logger.info(`MCP Server 5500 started successfully`);
          logger.info(`Server running on ${this.config.server?.protocol || 'http'}://${host}:${port}`);
          logger.info(`Health check available at: http://${host}:${port}/health`);
          logger.info(`API base path: ${this.config.server?.base_path || '/api/v1'}`);
          
          // Set server timeout
          this.server.timeout = this.config.server?.timeout || 30000;
          
          // Remove error handler after successful start
          this.server.removeListener('error', errorHandler);
          
          // Add permanent error handler
          this.server.on('error', (error) => {
            logger.error('Runtime server error:', error);
          });
          
          resolve(this.server);
        });
        
        // Add temporary error handler for startup
        this.server.on('error', errorHandler);
      });
    } catch (error) {
      logger.error('Failed to start MCP Server 5500:', error);
      throw error;
    }
  }
  
  /**
   * Stop the server
   */
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          logger.info('MCP Server 5500 stopped');
          resolve();
        });
      });
    }
  }
  
  /**
   * Graceful shutdown
   */
  async gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    try {
      // Stop accepting new connections
      await this.stop();
      
      // Close database connections
      await this.memoryService.close();
      await this.semanticService.close();
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }
}

// Export the class
module.exports = MCPServer5500;

// If this file is run directly, start the server
if (require.main === module) {
  const server = new MCPServer5500();
  server.start().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}