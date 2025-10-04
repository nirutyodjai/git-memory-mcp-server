/**
 * @typedef {import('../types/index.js').ServerConfig} ServerConfig
 * @typedef {import('../types/index.js').GitConfig} GitConfig
 * @typedef {import('../types/index.js').MetricsCollector} MetricsCollector
 * @typedef {import('../types/index.js').ConnectionManager} ConnectionManager
 * @typedef {import('../types/index.js').CacheInterface} CacheInterface
 * @typedef {import('../types/index.js').TracingService} TracingService
 * @typedef {import('../types/index.js').PerformanceProfiler} PerformanceProfiler
 * @typedef {import('../types/index.js').GitWebhooksService} GitWebhooksService
 */

/**
 * High Performance MCP Server for Git Memory with TypeScript support
 *
 * This is a JSDoc-annotated version that provides type information
 * while maintaining JavaScript compatibility for gradual TypeScript migration.
 */
export class HighPerformanceMCPServer {
  /**
   * @param {Object} options - Server configuration options
   * @param {ServerConfig} options.config - Server configuration
   */
  constructor(options = {}) {
    /** @type {ServerConfig} */
    this.config = options.config || {
      port: 3000,
      host: '0.0.0.0',
      maxConnections: 3000,
      enableMetrics: true,
      enableTracing: false,
      logLevel: 'info',
      cors: {
        enabled: true,
        origins: ['*']
      }
    };

    /** @type {import('express').Application} */
    this.app = null;

    /** @type {import('http').Server} */
    this.httpServer = null;

    /** @type {import('ws').Server} */
    this.wss = null;

    /** @type {import('@modelcontextprotocol/sdk').Server} */
    this.server = null;

    /** @type {MetricsCollector} */
    this.metrics = null;

    /** @type {ConnectionManager} */
    this.connectionManager = null;

    /** @type {CacheInterface} */
    this.cache = null;

    /** @type {TracingService} */
    this.tracingService = null;

    /** @type {PerformanceProfiler} */
    this.performanceProfiler = null;

    /** @type {GitWebhooksService} */
    this.webhooksService = null;

    // Git-specific properties
    /** @type {string[]} */
    this.allowedRepos = [];

    /** @type {string} */
    this.apiKey = '';

    // Services
    /** @type {import('./services/git-memory.js').GitMemoryService} */
    this.gitMemoryService = null;

    /** @type {import('./services/git-memory-cli.js').GitMemoryCLIService} */
    this.gitMemoryCLI = null;

    // WebSocket subscriptions
    /** @type {Map<string, Set<string>>} */
    this.repoSubscriptions = new Map();

    /** @type {Map<string, Set<string>>} */
    this.toolExecutionSubscriptions = new Map();

    this.initialize();
  }

  /**
   * Initialize the server and all services
   */
  async initialize() {
    try {
      // Initialize services in order
      await this.initializeCoreServices();
      await this.initializeGitServices();
      await this.initializeMonitoringServices();
      await this.initializeWebhookServices();

      // Setup Express routes and middleware
      this.setupExpress();

      // Setup WebSocket handlers
      this.setupWebSocket();

      // Setup MCP protocol handlers
      this.setupMCPHandlers();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      console.log('✅ High Performance MCP Server initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize server:', error);
      throw error;
    }
  }

  /**
   * Initialize core services
   */
  async initializeCoreServices() {
    // Import required modules
    const express = await import('express');
    const { createServer } = await import('http');
    const { WebSocketServer } = await import('ws');
    const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
    const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');

    // Initialize Express app
    this.app = express();
    this.httpServer = createServer(this.app);

    // Initialize WebSocket server
    this.wss = new WebSocketServer({
      server: this.httpServer,
      maxPayload: 1024 * 1024, // 1MB
      perMessageDeflate: true
    });

    // Initialize MCP server
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

    // Initialize cache (simple Map for now)
    this.cache = {
      data: new Map(),
      get: (key) => {
        const entry = this.cache.data.get(key);
        if (entry && entry.expiresAt > Date.now()) {
          return entry.value;
        }
        if (entry) {
          this.cache.data.delete(key);
        }
        return null;
      },
      set: (key, value, ttl = 300000) => { // 5 minutes default
        this.cache.data.set(key, {
          value,
          expiresAt: Date.now() + ttl,
          createdAt: Date.now()
        });
      },
      delete: (key) => this.cache.data.delete(key),
      clear: () => this.cache.data.clear(),
      size: () => this.cache.data.size
    };

    // Add basic middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Add CORS middleware
    if (this.config.cors.enabled) {
      this.app.use((req, res, next) => {
        const origin = req.get('origin');
        const allowedOrigins = this.config.cors.origins.includes('*') ? ['*'] : this.config.cors.origins;

        if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
          res.setHeader('Access-Control-Allow-Origin', origin || '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
          res.setHeader('Access-Control-Allow-Credentials', 'true');
        }

        if (req.method === 'OPTIONS') {
          return res.status(200).end();
        }

        next();
      });
    }
  }

  /**
   * Initialize Git-specific services
   */
  async initializeGitServices() {
    // Load Git services
    const { GitMemoryService } = await import('./services/git-memory.js');
    const { GitMemoryCLIService } = await import('./services/git-memory-cli.js');

    // Initialize allowed repositories
    this.allowedRepos = (process.env.GIT_MEMORY_ALLOWED_REPOS || '')
      .split(path.delimiter)
      .map(entry => entry.trim())
      .filter(Boolean)
      .map(entry => path.resolve(entry));

    // Initialize Git services
    this.gitMemoryService = new GitMemoryService();
    this.apiKey = process.env.GIT_MEMORY_API_KEY || '';
    this.gitMemoryCLI = new GitMemoryCLIService({
      allowedRepos: this.allowedRepos,
      metrics: this.metrics
    });
  }

  /**
   * Initialize monitoring services
   */
  async initializeMonitoringServices() {
    // Initialize tracing service
    if (this.config.enableTracing) {
      const { TracingService } = await import('./monitoring/tracing.js');
      this.tracingService = new TracingService({
        serviceName: 'git-memory-mcp-server',
        serviceVersion: '2.0.0',
        jaegerEndpoint: process.env.JAEGER_ENDPOINT,
        enableConsoleExporter: true
      });
      await this.tracingService.initialize();

      // Add tracing middleware
      this.app.use((req, res, next) => {
        if (this.tracingService) {
          const span = this.tracingService.startSpan(`HTTP ${req.method} ${req.path}`);
          req.traceSpan = span;

          const originalEnd = res.end;
          res.end = function(chunk, encoding) {
            span.end();
            originalEnd.call(this, chunk, encoding);
          };
        }
        next();
      });
    }

    // Initialize performance profiler
    const { PerformanceProfiler } = await import('./monitoring/performance.js');
    this.performanceProfiler = new PerformanceProfiler({
      enabled: process.env.NODE_ENV === 'development',
      outputDir: './profiles'
    });
    await this.performanceProfiler.initialize();

    // Add performance middleware
    this.app.use((req, res, next) => {
      if (this.performanceProfiler) {
        this.performanceProfiler.startProfile(`http_${req.method}_${req.path}`);
      }
      next();
    });
  }

  /**
   * Initialize webhook services
   */
  async initializeWebhookServices() {
    const { GitWebhooksService } = await import('./services/git-webhooks.js');
    this.webhooksService = new GitWebhooksService(this, {
      webhookSecret: process.env.GIT_WEBHOOK_SECRET,
      allowedOrigins: ['github.com', 'gitlab.com']
    });
  }

  /**
   * Setup Express application routes and middleware
   */
  setupExpress() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '2.0.0',
        services: {
          redis: true, // Will be updated when Redis integration is added
          database: false
        },
        metrics: {
          connections: this.connectionManager?.getStats().total || 0,
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      };

      res.json(health);
    });

    // Metrics endpoint (Prometheus format)
    this.app.get('/metrics', async (req, res) => {
      if (!this.metrics) {
        return res.status(503).json({ error: 'Metrics not available' });
      }

      const metrics = await this.metrics.getMetrics();
      const prometheusFormat = this.formatMetricsForPrometheus(metrics);

      res.set('Content-Type', 'text/plain');
      res.send(prometheusFormat);
    });

    // Webhook endpoint
    this.app.all('/webhooks/git', async (req, res) => {
      return await this.webhooksService.processWebhook(req, res);
    });

    // Connection info endpoint
    this.app.get('/connections', (req, res) => {
      if (!this.connectionManager) {
        return res.status(503).json({ error: 'Connection manager not available' });
      }

      res.json(this.connectionManager.getStats());
    });

    // Git status endpoint
    this.app.post('/git/status', async (req, res) => {
      await this.handleGitRequest(req, res, async () => {
        const { repoPath, json = true } = req.body || {};
        if (!repoPath) {
          throw new Error('repoPath is required');
        }

        const resolvedRepo = this.sanitizeRepoPath(repoPath);
        const data = await this.gitMemoryCLI.status(resolvedRepo, { json });

        // Broadcast event if WebSocket subscribers exist
        if (this.broadcastRepoEvent) {
          this.broadcastRepoEvent(resolvedRepo, 'status_checked', {
            timestamp: new Date().toISOString()
          });
        }

        return { data };
      });
    });

    // Git fetch endpoint
    this.app.post('/git/fetch', async (req, res) => {
      await this.handleGitRequest(req, res, async () => {
        const {
          repoPath,
          remote = 'origin',
          prune = false,
          tags = false,
          all = false
        } = req.body || {};

        if (!repoPath) {
          throw new Error('repoPath is required');
        }

        const resolvedRepo = this.sanitizeRepoPath(repoPath);
        const result = await this.gitMemoryCLI.fetch(resolvedRepo, {
          remote: all ? undefined : remote,
          prune,
          tags,
          all
        });

        // Broadcast event if WebSocket subscribers exist
        if (this.broadcastRepoEvent) {
          this.broadcastRepoEvent(resolvedRepo, 'fetch_completed', {
            remote: all ? 'all' : remote,
            timestamp: new Date().toISOString()
          });
        }

        return { stdout: result.stdout, stderr: result.stderr };
      });
    });

    // Git rebase endpoint
    this.app.post('/git/rebase', async (req, res) => {
      await this.handleGitRequest(req, res, async () => {
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
          throw new Error('repoPath is required');
        }

        const resolvedRepo = this.sanitizeRepoPath(repoPath);
        const result = await this.gitMemoryCLI.rebase(resolvedRepo, {
          upstream,
          branch,
          continueRebase,
          abort,
          skip,
          autostash
        });

        // Broadcast event if WebSocket subscribers exist
        if (this.broadcastRepoEvent) {
          this.broadcastRepoEvent(resolvedRepo, 'rebase_completed', {
            operation: continueRebase ? 'continue' : abort ? 'abort' : skip ? 'skip' : 'rebase',
            upstream,
            branch,
            timestamp: new Date().toISOString()
          });
        }

        return { stdout: result.stdout, stderr: result.stderr };
      });
    });

    // Performance profiling endpoint
    this.app.get('/profiles', async (req, res) => {
      if (!this.performanceProfiler) {
        return res.status(503).json({ error: 'Performance profiler not available' });
      }

      const report = await this.performanceProfiler.generateReport();
      res.json({ success: true, report });
    });

    // System metrics endpoint
    this.app.get('/system/metrics', (req, res) => {
      if (!this.performanceProfiler) {
        return res.status(503).json({ error: 'Performance profiler not available' });
      }

      const metrics = this.performanceProfiler.getSystemMetrics();
      res.json({ success: true, metrics });
    });
  }

  /**
   * Setup WebSocket server handlers
   */
  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const connectionId = this.connectionManager.addConnection(ws, req);

      if (!connectionId) {
        ws.close(1013, 'Server overloaded');
        return;
      }

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          const response = await this.handleWebSocketMessage(message, connectionId);
          ws.send(JSON.stringify(response));
        } catch (error) {
          ws.send(JSON.stringify({
            error: 'Invalid message format',
            details: error.message
          }));
        }
      });

      ws.on('close', () => {
        this.connectionManager.removeConnection(connectionId);
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

  /**
   * Setup MCP protocol handlers
   */
  setupMCPHandlers() {
    // This would be implemented with proper MCP SDK integration
    // For now, we'll use a placeholder
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`Received ${signal}, starting graceful shutdown...`);

      // Close HTTP server
      this.httpServer.close(() => {
        console.log('HTTP server closed');
      });

      // Close all WebSocket connections
      this.wss.clients.forEach((ws) => {
        ws.close(1001, 'Server shutting down');
      });

      // Shutdown monitoring services
      if (this.tracingService) {
        await this.tracingService.shutdown();
      }

      // Wait for existing operations to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log('Graceful shutdown completed');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Handle WebSocket messages
   * @param {WebSocketMessage} message
   * @param {string} connectionId
   */
  async handleWebSocketMessage(message, connectionId) {
    // Implementation would go here with proper message handling
    return { type: 'response', data: 'Message received' };
  }

  /**
   * Handle Git requests with common logic
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {Function} handler
   */
  async handleGitRequest(req, res, handler) {
    try {
      // API key validation
      if (this.apiKey) {
        const authHeader = req.headers['x-api-key'] || req.headers['authorization'] || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

        if (token !== this.apiKey) {
          return res.status(401).json({ error: 'Invalid API key' });
        }
      }

      const result = await handler();
      res.json({ success: true, ...result });

    } catch (error) {
      const statusCode = error.message.includes('API key') ? 401 : 500;
      res.status(statusCode).json({ error: error.message });
    }
  }

  /**
   * Sanitize repository path
   * @param {string} repoPath
   */
  sanitizeRepoPath(repoPath) {
    if (!repoPath) {
      throw new Error('Repository path is required');
    }

    const resolved = path.resolve(repoPath);

    if (this.allowedRepos.length > 0) {
      const isAllowed = this.allowedRepos.some(base =>
        resolved === base || resolved.startsWith(`${base}${path.sep}`)
      );

      if (!isAllowed) {
        throw new Error(`Repository path not permitted: ${resolved}`);
      }
    }

    return resolved;
  }

  /**
   * Format metrics for Prometheus
   * @param {Record<string, any>} metrics
   */
  formatMetricsForPrometheus(metrics) {
    const lines = [];

    for (const [key, value] of Object.entries(metrics)) {
      if (typeof value === 'number') {
        lines.push(`# HELP ${key} ${key.replace(/_/g, ' ')}`);
        lines.push(`# TYPE ${key} gauge`);
        lines.push(`${key} ${value}`);
      }
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Broadcast repository event to WebSocket subscribers
   * @param {string} repoPath
   * @param {string} eventType
   * @param {any} eventData
   */
  broadcastRepoEvent(repoPath, eventType, eventData) {
    // Implementation would go here
  }

  /**
   * Start the server
   */
  async start() {
    const port = this.config.port;

    try {
      this.httpServer.listen(port, () => {
        console.log(`🚀 High-Performance MCP Server running on port ${port}`);
        console.log(`📊 Max connections: ${this.config.maxConnections}`);
        console.log(`🔧 Worker PID: ${process.pid}`);

        if (this.config.enableTracing) {
          console.log('📈 Distributed tracing enabled');
        }

        if (this.performanceProfiler.enabled) {
          console.log('📊 Performance profiling enabled');
        }
      });

      // Start MCP server for stdio transport
      const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      console.log('🔗 MCP Server connected via stdio transport');

    } catch (error) {
      console.error('Failed to start server:', error);
      throw error;
    }
  }
}

// Export for use in other modules
export { HighPerformanceMCPServer };
