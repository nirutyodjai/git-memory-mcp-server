#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';
import { createLogger, format, transports } from 'winston';
import path from 'path';
import { GitMemoryService } from './services/git-memory.js';
import { GitMemoryCLIService } from './services/git-memory-cli.js';
import { ConnectionManager } from './services/connection-manager.js';
import { MetricsCollector } from './monitoring/metrics.js';
import { HealthCheck } from './monitoring/health-check.js';
import { ConfigManager } from './config/config.js';
import { RateLimiter } from './middleware/rate-limiter.js';

// Logger configuration
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

class HighPerformanceMCPServer {
  constructor() {
    this.config = new ConfigManager();
    this.server = new Server(
      {
        name: 'git-memory-mcp-server-3000',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    // Initialize cache
    this.cache = new Map();

    // Services
    this.allowedRepos = (process.env.GIT_MEMORY_ALLOWED_REPOS || '')
      .split(path.delimiter)
      .map(entry => entry.trim())
      .filter(Boolean)
      .map(entry => path.resolve(entry));

    this.gitMemoryService = new GitMemoryService();
    this.apiKey = process.env.GIT_MEMORY_API_KEY || '';
    this.gitMemoryCLI = new GitMemoryCLIService({
      allowedRepos: this.allowedRepos,
      metrics: this.metrics
    });

    // WebSocket subscriptions for real-time updates
    this.repoSubscriptions = new Map(); // Map<connectionId, Set<repoPath>>
    this.toolExecutionSubscriptions = new Map(); // Map<toolName, Set<connectionId>>

    // Express app for HTTP endpoints
    this.app = express();
    this.httpServer = createServer(this.app);
    
    // WebSocket server
    this.wss = new WebSocketServer({ 
      server: this.httpServer,
      maxPayload: 1024 * 1024, // 1MB
      perMessageDeflate: true
    });

    this.setupExpress();
    this.setupWebSocket();
    this.setupMCPHandlers();
    this.setupGracefulShutdown();
  }

  setupExpress() {
    const sanitizeRepoPath = (repoPath) => {
      if (!repoPath || typeof repoPath !== 'string') {
        throw new Error('Invalid repoPath');
      }
      const resolved = path.resolve(repoPath);
      if (this.allowedRepos.length > 0) {
        const isAllowed = this.allowedRepos.some(base => resolved === base || resolved.startsWith(`${base}${path.sep}`));
        if (!isAllowed) {
          throw new Error(`Repository path not permitted: ${resolved}`);
        }
      }
      return resolved;
    };

    const sanitizeFlags = (value) => Boolean(value);

    const enforceApiKey = (req) => {
      if (!this.apiKey) {
        return;
      }
      const rawHeader = req.headers['x-api-key'] || req.headers['authorization'] || '';
      const value = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
      if (!value) {
        throw new Error('Missing API key');
      }
      const token = value.startsWith('Bearer ') ? value.slice(7) : value;
      if (token !== this.apiKey) {
        throw new Error('Invalid API key');
      }
    };

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));
    
    // Performance middleware
    this.app.use(compression());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true
    }));

    // Body parsing with limits
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting middleware
    this.app.use(this.rateLimiter.middleware());

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const health = this.healthCheck.getStatus();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });

    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      res.set('Content-Type', 'text/plain');
      res.send(this.metrics.getPrometheusMetrics());
    });

    // MCP tools endpoint
    this.app.get('/tools', async (req, res) => {
      try {
        enforceApiKey(req);
        const tools = await this.listTools();
        res.json(tools);
      } catch (error) {
        const statusCode = error.message.includes('API key') ? 401 : 500;
        logger.error('Error listing tools:', error);
        res.status(statusCode).json({ error: error.message });
      }
    });

    // Execute tool endpoint
    this.app.post('/tools/:toolName', async (req, res) => {
      try {
        enforceApiKey(req);
        const { toolName } = req.params;
        const { arguments: args } = req.body || {};

        const start = Date.now();
        const result = await this.executeTool(toolName, args);
        this.metrics.recordToolDuration(`http_${toolName}`, Date.now() - start);
        res.json(result);
      } catch (error) {
        const statusCode = error.message.includes('API key') ? 401 : 500;
        logger.error('Error executing tool:', error);
        this.metrics.incrementToolErrors('http_tool_execution');
        res.status(statusCode).json({ error: error.message });
      }
    });

    // Git Memory CLI endpoints
    const handleGitRequest = async (metricName, req, res, runner) => {
      try {
        enforceApiKey(req);
        const start = Date.now();
        const payload = await runner();
        this.metrics.recordToolDuration(metricName, Date.now() - start);
        res.json({ success: true, ...payload });
      } catch (error) {
        logger.error(`${metricName} error:`, error);
        this.metrics.incrementToolErrors(metricName);
        const statusCode = error.message.includes('API key') ? 401 : 500;
        res.status(statusCode).json({ error: error.message });
      }
    };

    this.app.post('/git/status', async (req, res) => {
      const { repoPath, json = true } = req.body || {};
      if (!repoPath) {
        return res.status(400).json({ error: 'repoPath is required' });
      }

      await handleGitRequest('http_git_status_cli', req, res, async () => {
        const resolvedRepo = sanitizeRepoPath(repoPath);
        const data = await this.gitMemoryCLI.status(resolvedRepo, { json: sanitizeFlags(json) });
        return { data };
      });
    });

    this.app.post('/git/fetch', async (req, res) => {
      const {
        repoPath,
        remote = 'origin',
        prune = false,
        tags = false,
        all = false
      } = req.body || {};

      if (!repoPath) {
        return res.status(400).json({ error: 'repoPath is required' });
      }

      await handleGitRequest('http_git_fetch_cli', req, res, async () => {
        const resolvedRepo = sanitizeRepoPath(repoPath);
        const result = await this.gitMemoryCLI.fetch(resolvedRepo, {
          remote: all ? undefined : remote,
          prune: sanitizeFlags(prune),
          tags: sanitizeFlags(tags),
          all: sanitizeFlags(all)
        });
        return { stdout: result.stdout, stderr: result.stderr };
      });
    });

    this.app.post('/git/rebase', async (req, res) => {
      const {
        repoPath,
        upstream,
        branch,
        continueRebase = false,
        abort = false,
        skip = false,
        autostash = false
      } = req.body || {};

      if (!repoPath) {
        return res.status(400).json({ error: 'repoPath is required' });
      }

      await handleGitRequest('http_git_rebase_cli', req, res, async () => {
        const resolvedRepo = sanitizeRepoPath(repoPath);
        const result = await this.gitMemoryCLI.rebase(resolvedRepo, {
          upstream,
          branch,
          continueRebase: sanitizeFlags(continueRebase),
          abort: sanitizeFlags(abort),
          skip: sanitizeFlags(skip),
          autostash: sanitizeFlags(autostash)
        });
        return { stdout: result.stdout, stderr: result.stderr };
      });
    });

    // Connection info endpoint
    this.app.get('/connections', (req, res) => {
      if (!this.connectionManager) {
        return res.status(503).json({ error: 'Connection manager not available' });
      }

      res.json(this.connectionManager.getStats());
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const connectionId = this.connectionManager.addConnection(ws, req);
      
      if (!connectionId) {
        ws.close(1013, 'Server overloaded');
        return;
      }

      logger.info(`New WebSocket connection: ${connectionId}`);
      this.metrics.incrementConnections();

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          const response = await this.handleWebSocketMessage(message, connectionId);
          ws.send(JSON.stringify(response));
        } catch (error) {
          logger.error('WebSocket message error:', error);
          ws.send(JSON.stringify({
            error: 'Invalid message format',
            details: error.message
          }));
        }
      });

      ws.on('close', () => {
        this.connectionManager.removeConnection(connectionId);
        this.metrics.decrementConnections();
        logger.info(`WebSocket connection closed: ${connectionId}`);
      });

      ws.on('error', (error) => {
        logger.error(`WebSocket error for ${connectionId}:`, error);
        this.connectionManager.removeConnection(connectionId);
        this.metrics.decrementConnections();
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        connectionId,
        serverInfo: {
          name: 'git-memory-mcp-server-3000',
          version: '2.0.0',
          maxConnections: this.config.maxConnections
        }
      }));
    });
  }

  setupMCPHandlers() {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return await this.listTools();
    });

    // Call tool handler with enhanced real-time updates
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this.executeToolWithUpdates(name, args);
    });
  }

  async listTools() {
    const cacheKey = 'tools_list';
    let tools = this.cache.get(cacheKey);
    
    if (!tools) {
      tools = {
        tools: [
          {
            name: 'get_current_branch',
            description: 'Get the current Git branch',
            inputSchema: {
              type: 'object',
              properties: {
                repoPath: { type: 'string', description: 'Repository path' }
              },
              required: ['repoPath']
            }
          },
          {
            name: 'get_recent_commits',
            description: 'Get recent commits from the repository',
            inputSchema: {
              type: 'object',
              properties: {
                repoPath: { type: 'string', description: 'Repository path' },
                limit: { type: 'number', description: 'Number of commits to retrieve', default: 10 }
              },
              required: ['repoPath']
            }
          },
          {
            name: 'get_repo_status',
            description: 'Get the current repository status',
            inputSchema: {
              type: 'object',
              properties: {
                repoPath: { type: 'string', description: 'Repository path' }
              },
              required: ['repoPath']
            }
          },
          {
            name: 'list_branches',
            description: 'List all branches in the repository',
            inputSchema: {
              type: 'object',
              properties: {
                repoPath: { type: 'string', description: 'Repository path' }
              },
              required: ['repoPath']
            }
          },
          {
            name: 'search_commits',
            description: 'Search commits by message or author',
            inputSchema: {
              type: 'object',
              properties: {
                repoPath: { type: 'string', description: 'Repository path' },
                query: { type: 'string', description: 'Search query' },
                limit: { type: 'number', description: 'Number of results', default: 20 }
              },
              required: ['repoPath', 'query']
            }
          },
          {
            name: 'get_file_history',
            description: 'Get commit history for a specific file',
            inputSchema: {
              type: 'object',
              properties: {
                repoPath: { type: 'string', description: 'Repository path' },
                filePath: { type: 'string', description: 'File path' },
                limit: { type: 'number', description: 'Number of commits', default: 10 }
              },
              required: ['repoPath', 'filePath']
            }
          }
          ,
          {
            name: 'git_status_cli',
            description: 'Run git-memory CLI status command and return JSON',
            inputSchema: {
              type: 'object',
              properties: {
                repoPath: { type: 'string', description: 'Repository path' },
                json: { type: 'boolean', description: 'Return JSON output', default: true }
              },
              required: ['repoPath']
            }
          },
          {
            name: 'git_fetch_cli',
            description: 'Run git-memory CLI fetch command for the repository',
            inputSchema: {
              type: 'object',
              properties: {
                repoPath: { type: 'string', description: 'Repository path' },
                remote: { type: 'string', description: 'Remote name', default: 'origin' },
                prune: { type: 'boolean', description: 'Use --prune flag', default: false },
                tags: { type: 'boolean', description: 'Fetch tags as well', default: false },
                all: { type: 'boolean', description: 'Fetch all remotes', default: false }
              },
              required: ['repoPath']
            }
          },
          {
            name: 'git_rebase_cli',
            description: 'Run git-memory CLI rebase command for the repository',
            inputSchema: {
              type: 'object',
              properties: {
                repoPath: { type: 'string', description: 'Repository path' },
                upstream: { type: 'string', description: 'Upstream branch to rebase onto' },
                branch: { type: 'string', description: 'Branch to rebase' },
                continueRebase: { type: 'boolean', description: 'Continue existing rebase', default: false },
                abort: { type: 'boolean', description: 'Abort existing rebase', default: false },
                skip: { type: 'boolean', description: 'Skip current patch', default: false },
                autostash: { type: 'boolean', description: 'Use --autostash during rebase', default: false }
              },
              required: ['repoPath']
            }
          }
        ]
      };
      this.cache.set(cacheKey, tools);
    }
    
    return tools;
  }

  async executeTool(name, args) {
    const startTime = Date.now();
    this.metrics.incrementToolCalls(name);
    
    try {
      let result;
      
      switch (name) {
        case 'get_current_branch':
          result = await this.gitMemoryService.getCurrentBranch(args.repoPath);
          break;
        case 'get_recent_commits':
          result = await this.gitMemoryService.getRecentCommits(args.repoPath, args.limit);
          break;
        case 'get_repo_status':
          result = await this.gitMemoryService.getRepoStatus(args.repoPath);
          break;
        case 'list_branches':
          result = await this.gitMemoryService.listBranches(args.repoPath);
          break;
        case 'search_commits':
          result = await this.gitMemoryService.searchCommits(args.repoPath, args.query, args.limit);
          break;
        case 'get_file_history':
          result = await this.gitMemoryService.getFileHistory(args.repoPath, args.filePath, args.limit);
          break;
        case 'git_status_cli':
          result = await this.gitMemoryCLI.status(args.repoPath, { json: args.json ?? true });
          break;
        case 'git_fetch_cli':
          result = await this.gitMemoryCLI.fetch(args.repoPath, {
            remote: args.all ? undefined : args.remote,
            prune: args.prune,
            tags: args.tags,
            all: args.all
          });
          break;
        case 'git_rebase_cli':
          result = await this.gitMemoryCLI.rebase(args.repoPath, {
            upstream: args.upstream,
            branch: args.branch,
            continueRebase: args.continueRebase,
            abort: args.abort,
            skip: args.skip,
            autostash: args.autostash
          });
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      const duration = Date.now() - startTime;
      this.metrics.recordToolDuration(name, duration);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      this.metrics.incrementToolErrors(name);
      logger.error(`Tool execution error for ${name}:`, error);
      throw error;
    }
  }

  // WebSocket subscription management methods
  subscribeToRepoEvents(connectionId, repoPath) {
    try {
      // Validate repository path
      const resolved = path.resolve(repoPath);
      if (this.allowedRepos.length > 0) {
        const isAllowed = this.allowedRepos.some(base => resolved === base || resolved.startsWith(`${base}${path.sep}`));
        if (!isAllowed) {
          return { type: 'error', message: `Repository path not permitted: ${resolved}` };
        }
      }

      // Initialize subscriptions for this connection if not exists
      if (!this.repoSubscriptions.has(connectionId)) {
        this.repoSubscriptions.set(connectionId, new Set());
      }

      // Add repository subscription
      this.repoSubscriptions.get(connectionId).add(resolved);

      logger.info(`Connection ${connectionId} subscribed to repo events for: ${resolved}`);

      return {
        type: 'subscription_confirmed',
        repoPath: resolved,
        message: `Subscribed to events for repository: ${resolved}`
      };
    } catch (error) {
      logger.error(`Error subscribing to repo events:`, error);
      return { type: 'error', message: error.message };
    }
  }

  unsubscribeFromRepoEvents(connectionId, repoPath) {
    try {
      const resolved = path.resolve(repoPath);

      if (this.repoSubscriptions.has(connectionId)) {
        this.repoSubscriptions.get(connectionId).delete(resolved);

        // Clean up empty subscription sets
        if (this.repoSubscriptions.get(connectionId).size === 0) {
          this.repoSubscriptions.delete(connectionId);
        }
      }

      logger.info(`Connection ${connectionId} unsubscribed from repo events for: ${resolved}`);

      return {
        type: 'unsubscription_confirmed',
        repoPath: resolved,
        message: `Unsubscribed from events for repository: ${resolved}`
      };
    } catch (error) {
      logger.error(`Error unsubscribing from repo events:`, error);
      return { type: 'error', message: error.message };
    }
  }

  getActiveSubscriptions(connectionId) {
    const repos = this.repoSubscriptions.get(connectionId) || new Set();
    const tools = this.toolExecutionSubscriptions.get(connectionId) || new Set();

    return {
      type: 'active_subscriptions',
      repositories: Array.from(repos),
      toolExecutions: Array.from(tools)
    };
  }

  // Broadcast events to subscribed clients
  broadcastRepoEvent(repoPath, eventType, eventData) {
    const resolved = path.resolve(repoPath);

    // Find all connections subscribed to this repository
    for (const [connectionId, subscribedRepos] of this.repoSubscriptions.entries()) {
      if (subscribedRepos.has(resolved)) {
        // Find the WebSocket connection
        const ws = this.connectionManager.getConnection(connectionId);
        if (ws && ws.readyState === ws.OPEN) {
          const event = {
            type: 'repo_event',
            repoPath: resolved,
            eventType,
            data: eventData,
            timestamp: new Date().toISOString()
          };

          ws.send(JSON.stringify(event));
          this.metrics.incrementWebSocketEvents();
        }
      }
    }
  }

  broadcastToolExecutionEvent(toolName, executionData) {
    // Find all connections subscribed to this tool execution
    const subscribedConnections = this.toolExecutionSubscriptions.get(toolName) || new Set();

    for (const connectionId of subscribedConnections) {
      const ws = this.connectionManager.getConnection(connectionId);
      if (ws && ws.readyState === ws.OPEN) {
        const event = {
          type: 'tool_execution_event',
          toolName,
          data: executionData,
          timestamp: new Date().toISOString()
        };

        ws.send(JSON.stringify(event));
        this.metrics.incrementWebSocketEvents();
      }
    }
  }

  subscribeToToolExecutions(connectionId, toolName) {
    try {
      // Initialize tool execution subscriptions for this connection if not exists
      if (!this.toolExecutionSubscriptions.has(toolName)) {
        this.toolExecutionSubscriptions.set(toolName, new Set());
      }

      // Add connection to tool execution subscription
      this.toolExecutionSubscriptions.get(toolName).add(connectionId);

      logger.info(`Connection ${connectionId} subscribed to tool execution events for: ${toolName}`);

      return {
        type: 'tool_subscription_confirmed',
        toolName,
        message: `Subscribed to execution events for tool: ${toolName}`
      };
    } catch (error) {
      logger.error(`Error subscribing to tool executions:`, error);
      return { type: 'error', message: error.message };
    }
  }

  unsubscribeFromToolExecutions(connectionId, toolName) {
    try {
      if (this.toolExecutionSubscriptions.has(toolName)) {
        this.toolExecutionSubscriptions.get(toolName).delete(connectionId);

        // Clean up empty subscription sets
        if (this.toolExecutionSubscriptions.get(toolName).size === 0) {
          this.toolExecutionSubscriptions.delete(toolName);
        }
      }

      logger.info(`Connection ${connectionId} unsubscribed from tool execution events for: ${toolName}`);

      return {
        type: 'tool_unsubscription_confirmed',
        toolName,
        message: `Unsubscribed from execution events for tool: ${toolName}`
      };
    } catch (error) {
      logger.error(`Error unsubscribing from tool executions:`, error);
      return { type: 'error', message: error.message };
    }
  }

  // Enhanced tool execution with real-time updates
  async executeToolWithUpdates(name, args) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Broadcast execution start
    this.broadcastToolExecutionEvent(name, {
      executionId,
      status: 'started',
      toolName: name,
      args
    });

    const startTime = Date.now();
    this.metrics.incrementToolCalls(name);

    try {
      let result;

      switch (name) {
        case 'get_current_branch':
          result = await this.gitMemoryService.getCurrentBranch(args.repoPath);
          break;
        case 'get_recent_commits':
          result = await this.gitMemoryService.getRecentCommits(args.repoPath, args.limit);
          break;
        case 'get_repo_status':
          result = await this.gitMemoryService.getRepoStatus(args.repoPath);
          break;
        case 'list_branches':
          result = await this.gitMemoryService.listBranches(args.repoPath);
          break;
        case 'search_commits':
          result = await this.gitMemoryService.searchCommits(args.repoPath, args.query, args.limit);
          break;
        case 'get_file_history':
          result = await this.gitMemoryService.getFileHistory(args.repoPath, args.filePath, args.limit);
          break;
        case 'git_status_cli':
          result = await this.gitMemoryCLI.status(args.repoPath, { json: args.json ?? true });
          break;
        case 'git_fetch_cli':
          result = await this.gitMemoryCLI.fetch(args.repoPath, {
            remote: args.all ? undefined : args.remote,
            prune: args.prune,
            tags: args.tags,
            all: args.all
          });
          break;
        case 'git_rebase_cli':
          result = await this.gitMemoryCLI.rebase(args.repoPath, {
            upstream: args.upstream,
            branch: args.branch,
            continueRebase: args.continueRebase,
            abort: args.abort,
            skip: args.skip,
            autostash: args.autostash
          });
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      const duration = Date.now() - startTime;
      this.metrics.recordToolDuration(name, duration);

      // Broadcast execution success
      this.broadcastToolExecutionEvent(name, {
        executionId,
        status: 'completed',
        duration,
        result
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      this.metrics.incrementToolErrors(name);

      // Broadcast execution failure
      this.broadcastToolExecutionEvent(name, {
        executionId,
        status: 'failed',
        error: error.message
      });

      logger.error(`Tool execution error for ${name}:`, error);
      throw error;
    }
  }

  async handleWebSocketMessage(message, connectionId) {
    const { type, data } = message;

    switch (type) {
      case 'list_tools':
        return { type: 'tools_response', data: await this.listTools() };
      case 'execute_tool':
        // Use enhanced tool execution with real-time updates
        const result = await this.executeToolWithUpdates(data.name, data.arguments);
        return { type: 'tool_response', data: result };
      case 'ping':
        return { type: 'pong', timestamp: Date.now() };
      case 'subscribe_repo_events':
        // Subscribe to real-time Git events for a specific repository
        return this.subscribeToRepoEvents(connectionId, data.repoPath);
      case 'unsubscribe_repo_events':
        // Unsubscribe from repository events
        return this.unsubscribeFromRepoEvents(connectionId, data.repoPath);
      case 'get_active_subscriptions':
        // Get current active subscriptions for this connection
        return this.getActiveSubscriptions(connectionId);
      case 'subscribe_tool_executions':
        // Subscribe to tool execution events for a specific tool
        return this.subscribeToToolExecutions(connectionId, data.toolName);
      case 'unsubscribe_tool_executions':
        // Unsubscribe from tool execution events
        return this.unsubscribeFromToolExecutions(connectionId, data.toolName);
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      // Stop accepting new connections
      this.httpServer.close(() => {
        logger.info('HTTP server closed');
      });
      
      // Close all WebSocket connections
      this.wss.clients.forEach((ws) => {
        ws.close(1001, 'Server shutting down');
      });
      
      // Wait for existing operations to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  async start() {
    const port = this.config.port;
    
    try {
      // Start HTTP server
      // Debug: Starting listen
      console.log('Starting HTTP server listen on port ' + port);
      this.httpServer.on('error', (err) => {
        console.error('HTTP server error:', err);
      });
      this.httpServer.listen(port, () => {
        console.log('HTTP server listening successfully');
        logger.info(`High-Performance MCP Server running on port ${port}`);
        logger.info(`Max connections: ${this.config.maxConnections}`);
        logger.info(`Worker PID: ${process.pid}`);
      });

      // Start MCP server for stdio transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      logger.info('MCP Server connected via stdio transport');
    } catch (error) {
      logger.error('Failed to start server:', error);
      throw error;
    }
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new HighPerformanceMCPServer();
  server.start().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { HighPerformanceMCPServer };