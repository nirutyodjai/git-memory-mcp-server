/**
 * Multi-System MCP Server
 * Advanced Git Memory MCP Server with Multi-System Integration
 * Port: 5501 (Multi-System)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

// Import services and integrations
const logger = require('./utils/logger');
const MCPMultiSystemIntegration = require('./multi-system/integration/MCPMultiSystemIntegration');
const MultiSystemMiddleware = require('./multi-system/middleware/multiSystemMiddleware');
const MultiSystemRoutes = require('./multi-system/routes/multiSystemRoutes');

// Import existing services for backward compatibility
const GitOperationsService = require('./services/GitOperationsService');
const MemoryOperationsService = require('./services/MemoryOperationsService');
const SemanticMemoryService = require('./services/SemanticMemoryService');
const AuthService = require('./auth/AuthService');

class MultiSystemMCPServer {
  constructor() {
    this.app = express();
    this.server = null;
    // Support multiple env vars with sane defaults
    this.port = parseInt(process.env.MCP_MULTI_PORT || process.env.PORT || '5501', 10);
    this.host = process.env.MCP_MULTI_HOST || 'localhost';
    // Strict port binding and attempt limits via env
    this.strictPort = ['1','true','yes','on'].includes(String(process.env.MCP_MULTI_PORT_STRICT || process.env.PORT_STRICT || '').toLowerCase());
    this.maxPortAttempts = parseInt(process.env.MCP_MULTI_PORT_MAX_ATTEMPTS || process.env.PORT_MAX_ATTEMPTS || '50', 10);
    
    // Configuration
    this.config = null;
    this.configPath = path.join(__dirname, 'config', 'mcp-systems-config.yaml');
    
    // Services
    this.services = {};
    this.integration = null;
    this.middleware = null;
    this.routes = null;
    
    // Server state
    this.isInitialized = false;
    this.isRunning = false;
    this.startTime = null;
    
    // Graceful shutdown
    this.shutdownHandlers = [];
    
    this.setupGracefulShutdown();
  }

  /**
   * Initialize the multi-system server
   */
  async initialize() {
    try {
      logger.info('Initializing Multi-System MCP Server...');
      
      // Load configuration
      await this.loadConfiguration();
      
      // Validate environment
      this.validateEnvironment();
      
      // Initialize services
      await this.initializeServices();
      
      // Initialize integration
      await this.initializeIntegration();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      this.isInitialized = true;
      logger.info('Multi-System MCP Server initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize Multi-System MCP Server', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Load configuration from YAML file
   */
  async loadConfiguration() {
    try {
      if (!fs.existsSync(this.configPath)) {
        logger.warn('Configuration file not found, using defaults', {
          configPath: this.configPath
        });
        this.config = this.getDefaultConfiguration();
        return;
      }
      
      const configContent = fs.readFileSync(this.configPath, 'utf8');
      this.config = yaml.load(configContent);
      
      // Apply environment-specific overrides
      const environment = process.env.NODE_ENV || 'development';
      if (this.config.environments && this.config.environments[environment]) {
        this.config = {
          ...this.config,
          ...this.config.environments[environment]
        };
      }
      
      logger.info('Configuration loaded successfully', {
        configPath: this.configPath,
        environment,
        systemsCount: Object.keys(this.config.systems || {}).length
      });
      
    } catch (error) {
      logger.error('Failed to load configuration', {
        configPath: this.configPath,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get default configuration
   */
  getDefaultConfiguration() {
    return {
      global: {
        timeout: 30000,
        retries: 3,
        concurrency: 10,
        caching: {
          enabled: true,
          ttl: 300000,
          maxSize: 1000
        }
      },
      systems: {
        'git-memory': {
          type: 'git-memory',
          enabled: true,
          endpoint: 'http://localhost:5500',
          priority: 1,
          healthCheck: {
            enabled: true,
            interval: 30000,
            timeout: 5000,
            endpoint: '/health'
          }
        }
      },
      loadBalancing: {
        strategy: 'round-robin',
        healthCheckRequired: true
      },
      monitoring: {
        enabled: true,
        metricsInterval: 60000
      }
    };
  }

  /**
   * Validate environment
   */
  validateEnvironment() {
    const requiredEnvVars = [];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    // Validate Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 14) {
      throw new Error(`Node.js version ${nodeVersion} is not supported. Please use Node.js 14 or higher.`);
    }
    
    logger.info('Environment validation passed', {
      nodeVersion,
      platform: process.platform,
      arch: process.arch
    });
  }

  /**
   * Initialize services
   */
  async initializeServices() {
    try {
      logger.info('Initializing services...');
      
      // Initialize core services for backward compatibility
      this.services.git = new GitOperationsService();
      this.services.memory = new MemoryOperationsService();
      this.services.semantic = new SemanticMemoryService();
      this.services.auth = new AuthService();
      
      // Initialize services
      await Promise.all([
        this.services.git.initialize(),
        this.services.memory.initialize(),
        this.services.semantic.initialize(),
        this.services.auth.initialize()
      ]);
      
      logger.info('Services initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize services', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Initialize multi-system integration
   */
  async initializeIntegration() {
    try {
      logger.info('Initializing multi-system integration...');
      
      this.integration = new MCPMultiSystemIntegration(this.configPath);
      await this.integration.initialize();
      
      logger.info('Multi-system integration initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize multi-system integration', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Setup middleware
   */
  setupMiddleware() {
    logger.info('Setting up middleware...');
    
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
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));
    
    // CORS middleware
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-System-ID'],
      credentials: true
    }));
    
    // Compression middleware
    this.app.use(compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024
    }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: this.config?.global?.rateLimit?.max || 1000,
      message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/status';
      }
    });
    this.app.use(limiter);
    
    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request ID middleware
    this.app.use((req, res, next) => {
      req.requestId = req.headers['x-request-id'] || uuidv4();
      res.setHeader('X-Request-ID', req.requestId);
      next();
    });
    
    // Multi-system middleware
    this.middleware = new MultiSystemMiddleware(this.integration);
    this.app.use('/api/multi-system', this.middleware.getMiddleware());
    
    // Request logging middleware
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        logger.info('Request completed', {
          requestId: req.requestId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });
      
      next();
    });
    
    logger.info('Middleware setup completed');
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    logger.info('Setting up routes...');
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const status = this.integration.getIntegrationStatus();
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        integration: {
          initialized: status.integration.initialized,
          running: status.integration.running,
          systemsCount: status.systems.totalSystems,
          healthySystems: status.systems.healthySystems
        },
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      };
      
      const httpStatus = status.systems.healthySystems === status.systems.totalSystems ? 200 : 503;
      res.status(httpStatus).json(health);
    });
    
    // Status endpoint
    this.app.get('/status', (req, res) => {
      const status = this.integration.getIntegrationStatus();
      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });
    });
    
    // Multi-system routes
    this.routes = new MultiSystemRoutes(this.integration, this.middleware);
    this.app.use('/api/multi-system', this.routes.getRouter());
    
    // Backward compatibility routes for existing MCP server
    this.setupBackwardCompatibilityRoutes();
    
    // API documentation endpoint
    this.app.get('/api/docs', (req, res) => {
      res.json({
        name: 'Multi-System MCP Server',
        version: '1.0.0',
        description: 'Advanced Git Memory MCP Server with Multi-System Integration',
        endpoints: {
          health: 'GET /health',
          status: 'GET /status',
          multiSystem: {
            systems: 'GET /api/multi-system/systems',
            health: 'GET /api/multi-system/health',
            route: 'POST /api/multi-system/route',
            broadcast: 'POST /api/multi-system/broadcast',
            batch: 'POST /api/multi-system/batch',
            metrics: 'GET /api/multi-system/metrics'
          }
        },
        timestamp: new Date().toISOString()
      });
    });
    
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Multi-System MCP Server',
        version: '1.0.0',
        status: 'running',
        port: this.port,
        endpoints: {
          health: '/health',
          status: '/status',
          docs: '/api/docs',
          multiSystem: '/api/multi-system'
        },
        timestamp: new Date().toISOString()
      });
    });
    
    logger.info('Routes setup completed');
  }

  /**
   * Setup backward compatibility routes
   */
  setupBackwardCompatibilityRoutes() {
    // Git operations routes
    this.app.post('/api/git/:operation', async (req, res) => {
      try {
        const { operation } = req.params;
        const result = await this.services.git.executeOperation(operation, req.body);
        
        res.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        logger.error('Git operation failed', {
          requestId: req.requestId,
          operation: req.params.operation,
          error: error.message
        });
        
        res.status(500).json({
          success: false,
          error: 'Git operation failed',
          message: error.message
        });
      }
    });
    
    // Memory operations routes
    this.app.post('/api/memory/:operation', async (req, res) => {
      try {
        const { operation } = req.params;
        const result = await this.services.memory.executeOperation(operation, req.body);
        
        res.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        logger.error('Memory operation failed', {
          requestId: req.requestId,
          operation: req.params.operation,
          error: error.message
        });
        
        res.status(500).json({
          success: false,
          error: 'Memory operation failed',
          message: error.message
        });
      }
    });
    
    // Semantic search routes
    this.app.post('/api/semantic/:operation', async (req, res) => {
      try {
        const { operation } = req.params;
        const result = await this.services.semantic.executeOperation(operation, req.body);
        
        res.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        logger.error('Semantic operation failed', {
          requestId: req.requestId,
          operation: req.params.operation,
          error: error.message
        });
        
        res.status(500).json({
          success: false,
          error: 'Semantic operation failed',
          message: error.message
        });
      }
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });
    
    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error', {
        requestId: req.requestId,
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
      });
      
      res.status(error.status || 500).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    });
    
    logger.info('Error handling setup completed');
  }

  /**
   * Start the server
   */
  async start() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      return new Promise((resolve, reject) => {
        let attempt = 0;
        const tryListen = () => {
          const currentPort = this.port;
          const server = this.app.listen(this.port, this.host, () => {
            // Successful start
            this.server = server;
            this.isRunning = true;
            this.startTime = new Date();
            
            logger.info('Multi-System MCP Server started successfully', {
              port: this.port,
              host: this.host,
              environment: process.env.NODE_ENV || 'development',
              pid: process.pid,
              startTime: this.startTime.toISOString()
            });
            
            resolve({
              port: this.port,
              host: this.host,
              url: `http://${this.host}:${this.port}`,
              startTime: this.startTime
            });
          });
          
          // Handle listen errors for this attempt only
          server.once('error', (error) => {
            if (error && error.code === 'EADDRINUSE' && !this.strictPort && attempt < this.maxPortAttempts) {
              attempt++;
              const backoff = Math.min(1000, 100 + attempt * 50);
              logger.warn('Port in use, retrying on next port', {
                previousPort: currentPort,
                nextPort: currentPort + 1,
                attempt,
                maxAttempts: this.maxPortAttempts
              });
              this.port = currentPort + 1;
              setTimeout(tryListen, backoff);
            } else {
              logger.error('Failed to start server', {
                port: currentPort,
                host: this.host,
                code: error?.code,
                error: error?.message || String(error)
              });
              reject(error);
            }
          });
        };
        
        tryListen();
      });
      
    } catch (error) {
      logger.error('Failed to start Multi-System MCP Server', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Stop the server
   */
  async stop() {
    try {
      logger.info('Stopping Multi-System MCP Server...');
      
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
      }
      
      // Stop integration
      if (this.integration) {
        await this.integration.shutdown();
      }
      
      // Stop services
      await Promise.all([
        this.services.git?.shutdown(),
        this.services.memory?.shutdown(),
        this.services.semantic?.shutdown(),
        this.services.auth?.shutdown()
      ].filter(Boolean));
      
      this.isRunning = false;
      
      logger.info('Multi-System MCP Server stopped successfully');
      
    } catch (error) {
      logger.error('Error stopping server', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      try {
        // Run shutdown handlers
        await Promise.all(this.shutdownHandlers.map(handler => handler()));
        
        // Stop the server
        await this.stop();
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
        
      } catch (error) {
        logger.error('Error during graceful shutdown', {
          error: error.message
        });
        process.exit(1);
      }
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', {
        reason: reason?.message || reason,
        promise: promise.toString()
      });
      process.exit(1);
    });
  }

  /**
   * Add shutdown handler
   */
  addShutdownHandler(handler) {
    this.shutdownHandlers.push(handler);
  }

  /**
   * Get server status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      running: this.isRunning,
      port: this.port,
      host: this.host,
      startTime: this.startTime,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      integration: this.integration ? this.integration.getIntegrationStatus() : null
    };
  }
}

// Export the class
module.exports = MultiSystemMCPServer;

// Start server if this file is run directly
if (require.main === module) {
  const server = new MultiSystemMCPServer();
  
  server.start()
    .then((info) => {
      console.log(`🚀 Multi-System MCP Server running at ${info.url}`);
      console.log(`📊 Health check: ${info.url}/health`);
      console.log(`📈 Status: ${info.url}/status`);
      console.log(`📚 API docs: ${info.url}/api/docs`);
    })
    .catch((error) => {
      console.error('❌ Failed to start server:', error.message);
      process.exit(1);
    });
}