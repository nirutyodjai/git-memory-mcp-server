/**
 * NEXUS IDE Security Dashboard - Main Server
 * Enterprise-grade security monitoring and management platform
 */

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

// Import configurations
const config = require('./config/dashboard-config');

// Import middleware
const { authMiddleware } = require('./middleware/auth');
const { securityMiddleware } = require('./middleware/security');
const { validationMiddleware } = require('./middleware/validation');

// Import utilities
const logger = require('./utils/logger');
const { dbManager } = require('./utils/database');
const { encryptionUtils } = require('./utils/security');

// Import routes
const apiRoutes = require('./routes/api');
const { setupWebSocket } = require('./routes/websocket');

/**
 * Enterprise Security Dashboard Server
 */
class SecurityDashboardServer {
    constructor() {
        this.app = express();
        this.server = null;
        this.wsServer = null;
        this.isShuttingDown = false;
        this.connections = new Set();
        this.startTime = Date.now();
        
        // Bind methods
        this.gracefulShutdown = this.gracefulShutdown.bind(this);
        this.handleConnection = this.handleConnection.bind(this);
        this.handleRequest = this.handleRequest.bind(this);
    }
    
    /**
     * Initialize the server
     */
    async initialize() {
        try {
            logger.info('Initializing Security Dashboard Server...', {
                environment: config.ENVIRONMENT.nodeEnv,
                port: config.SERVER.port,
                version: config.SERVER.version
            });
            
            // Initialize database connections
            await this.initializeDatabase();
            
            // Setup Express middleware
            await this.setupMiddleware();
            
            // Setup routes
            await this.setupRoutes();
            
            // Setup error handling
            this.setupErrorHandling();
            
            // Create HTTP server
            this.server = http.createServer(this.app);
            
            // Setup WebSocket server
            this.wsServer = setupWebSocket(this.server);
            
            // Setup server event handlers
            this.setupServerHandlers();
            
            // Setup graceful shutdown
            this.setupGracefulShutdown();
            
            logger.info('Security Dashboard Server initialized successfully');
            
        } catch (error) {
            logger.error('Failed to initialize Security Dashboard Server', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
    
    /**
     * Initialize database connections
     */
    async initializeDatabase() {
        try {
            logger.info('Initializing database connections...');
            
            // Initialize PostgreSQL
            if (config.DATABASE.postgresql.enabled) {
                await dbManager.initializePostgreSQL();
                logger.info('PostgreSQL connection established');
            }
            
            // Initialize Redis
            if (config.DATABASE.redis.enabled) {
                await dbManager.initializeRedis();
                logger.info('Redis connection established');
            }
            
            // Initialize MongoDB
            if (config.DATABASE.mongodb.enabled) {
                await dbManager.initializeMongoDB();
                logger.info('MongoDB connection established');
            }
            
            // Test database health
            const healthCheck = await dbManager.healthCheck();
            logger.info('Database health check completed', healthCheck);
            
        } catch (error) {
            logger.error('Database initialization failed', {
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Setup Express middleware
     */
    async setupMiddleware() {
        logger.info('Setting up middleware...');
        
        // Trust proxy (for load balancers)
        this.app.set('trust proxy', config.SERVER.trustProxy);
        
        // Request ID middleware
        this.app.use((req, res, next) => {
            req.id = uuidv4();
            res.setHeader('X-Request-ID', req.id);
            next();
        });
        
        // Security middleware (helmet, CORS, etc.)
        this.app.use(securityMiddleware.helmet());
        this.app.use(securityMiddleware.cors());
        this.app.use(securityMiddleware.compression());
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: config.SECURITY.rateLimit.windowMs,
            max: config.SECURITY.rateLimit.max,
            message: {
                error: 'Too many requests',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil(config.SECURITY.rateLimit.windowMs / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
            keyGenerator: (req) => {
                return req.ip + ':' + (req.user?.id || 'anonymous');
            }
        });
        
        const speedLimiter = slowDown({
            windowMs: config.SECURITY.slowDown.windowMs,
            delayAfter: config.SECURITY.slowDown.delayAfter,
            delayMs: config.SECURITY.slowDown.delayMs,
            maxDelayMs: config.SECURITY.slowDown.maxDelayMs
        });
        
        this.app.use('/api', limiter);
        this.app.use('/api', speedLimiter);
        
        // Request logging
        const morganFormat = config.ENVIRONMENT.nodeEnv === 'production' ? 'combined' : 'dev';
        this.app.use(morgan(morganFormat, {
            stream: {
                write: (message) => {
                    logger.info(message.trim(), { component: 'http' });
                }
            },
            skip: (req) => {
                // Skip health check and static file requests in production
                return config.ENVIRONMENT.nodeEnv === 'production' && 
                       (req.url === '/health' || req.url.startsWith('/static'));
            }
        }));
        
        // Body parsing middleware
        this.app.use(express.json({ 
            limit: config.SERVER.bodyLimit,
            verify: (req, res, buf) => {
                // Store raw body for webhook verification
                req.rawBody = buf;
            }
        }));
        
        this.app.use(express.urlencoded({ 
            extended: true, 
            limit: config.SERVER.bodyLimit 
        }));
        
        // Request validation middleware
        this.app.use(validationMiddleware.validateContentType());
        this.app.use(validationMiddleware.sanitizeInput());
        
        // Security validation
        this.app.use(securityMiddleware.validateRequest());
        this.app.use(securityMiddleware.preventSQLInjection());
        this.app.use(securityMiddleware.preventXSS());
        
        // Request tracking
        this.app.use(this.handleRequest);
        
        logger.info('Middleware setup completed');
    }
    
    /**
     * Setup application routes
     */
    async setupRoutes() {
        logger.info('Setting up routes...');
        
        // Health check endpoint (no auth required)
        this.app.get('/health', (req, res) => {
            const uptime = Date.now() - this.startTime;
            const memoryUsage = process.memoryUsage();
            
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: uptime,
                version: config.SERVER.version,
                environment: config.ENVIRONMENT.nodeEnv,
                memory: {
                    rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
                    external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
                },
                connections: this.connections.size
            });
        });
        
        // Metrics endpoint (requires auth)
        this.app.get('/metrics', authMiddleware.authenticate(), async (req, res) => {
            try {
                const metrics = await this.getServerMetrics();
                res.json(metrics);
            } catch (error) {
                logger.error('Failed to get server metrics', { error: error.message });
                res.status(500).json({ error: 'Failed to get metrics' });
            }
        });
        
        // Static files (dashboard UI)
        this.app.use('/static', express.static(path.join(__dirname, 'public/static'), {
            maxAge: config.ENVIRONMENT.nodeEnv === 'production' ? '1d' : '0',
            etag: true,
            lastModified: true,
            setHeaders: (res, path) => {
                // Security headers for static files
                res.setHeader('X-Content-Type-Options', 'nosniff');
                res.setHeader('X-Frame-Options', 'DENY');
                
                // Cache control based on file type
                if (path.endsWith('.js') || path.endsWith('.css')) {
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                } else if (path.endsWith('.html')) {
                    res.setHeader('Cache-Control', 'no-cache');
                }
            }
        }));
        
        // API routes
        this.app.use('/api', apiRoutes);
        
        // Dashboard UI route
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'public/index.html'));
        });
        
        // Login page
        this.app.get('/login', (req, res) => {
            res.sendFile(path.join(__dirname, 'public/login.html'));
        });
        
        // Catch-all route for SPA
        this.app.get('*', (req, res) => {
            // Check if it's an API request
            if (req.path.startsWith('/api/')) {
                return res.status(404).json({
                    error: 'API endpoint not found',
                    code: 'ENDPOINT_NOT_FOUND',
                    path: req.path
                });
            }
            
            // Serve dashboard for all other routes
            res.sendFile(path.join(__dirname, 'public/index.html'));
        });
        
        logger.info('Routes setup completed');
    }
    
    /**
     * Setup error handling middleware
     */
    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res, next) => {
            const error = new Error(`Not Found - ${req.originalUrl}`);
            error.status = 404;
            next(error);
        });
        
        // Global error handler
        this.app.use((error, req, res, next) => {
            const status = error.status || 500;
            const message = error.message || 'Internal Server Error';
            
            // Log error
            logger.error('Request error', {
                requestId: req.id,
                method: req.method,
                url: req.originalUrl,
                status,
                message,
                stack: error.stack,
                userAgent: req.get('User-Agent'),
                ip: req.ip,
                userId: req.user?.id
            });
            
            // Don't leak error details in production
            const errorResponse = {
                error: message,
                code: error.code || 'INTERNAL_ERROR',
                requestId: req.id,
                timestamp: new Date().toISOString()
            };
            
            if (config.ENVIRONMENT.nodeEnv !== 'production') {
                errorResponse.stack = error.stack;
            }
            
            res.status(status).json(errorResponse);
        });
        
        logger.info('Error handling setup completed');
    }
    
    /**
     * Setup server event handlers
     */
    setupServerHandlers() {
        this.server.on('connection', this.handleConnection);
        
        this.server.on('error', (error) => {
            logger.error('Server error', {
                error: error.message,
                code: error.code,
                stack: error.stack
            });
        });
        
        this.server.on('clientError', (error, socket) => {
            logger.warn('Client error', {
                error: error.message,
                remoteAddress: socket.remoteAddress
            });
            
            if (!socket.destroyed) {
                socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            }
        });
    }
    
    /**
     * Handle new connection
     */
    handleConnection(socket) {
        this.connections.add(socket);
        
        socket.on('close', () => {
            this.connections.delete(socket);
        });
        
        socket.on('error', (error) => {
            logger.warn('Socket error', {
                error: error.message,
                remoteAddress: socket.remoteAddress
            });
            this.connections.delete(socket);
        });
    }
    
    /**
     * Handle incoming request
     */
    handleRequest(req, res, next) {
        const startTime = Date.now();
        
        // Track request
        logger.debug('Request received', {
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            contentLength: req.get('Content-Length')
        });
        
        // Track response time
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            
            logger.debug('Request completed', {
                requestId: req.id,
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration: `${duration}ms`,
                contentLength: res.get('Content-Length')
            });
        });
        
        next();
    }
    
    /**
     * Setup graceful shutdown
     */
    setupGracefulShutdown() {
        const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
        
        signals.forEach(signal => {
            process.on(signal, () => {
                logger.info(`Received ${signal}, starting graceful shutdown...`);
                this.gracefulShutdown();
            });
        });
        
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception', {
                error: error.message,
                stack: error.stack
            });
            
            this.gracefulShutdown(1);
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled rejection', {
                reason: reason?.message || reason,
                stack: reason?.stack
            });
            
            this.gracefulShutdown(1);
        });
    }
    
    /**
     * Start the server
     */
    async start() {
        try {
            await this.initialize();
            
            return new Promise((resolve, reject) => {
                this.server.listen(config.SERVER.port, config.SERVER.host, (error) => {
                    if (error) {
                        logger.error('Failed to start server', {
                            error: error.message,
                            port: config.SERVER.port,
                            host: config.SERVER.host
                        });
                        reject(error);
                        return;
                    }
                    
                    const address = this.server.address();
                    logger.info('Security Dashboard Server started successfully', {
                        host: address.address,
                        port: address.port,
                        environment: config.ENVIRONMENT.nodeEnv,
                        version: config.SERVER.version,
                        pid: process.pid,
                        nodeVersion: process.version
                    });
                    
                    resolve({
                        host: address.address,
                        port: address.port,
                        url: `http://${address.address}:${address.port}`
                    });
                });
            });
            
        } catch (error) {
            logger.error('Failed to start Security Dashboard Server', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
    
    /**
     * Graceful shutdown
     */
    async gracefulShutdown(exitCode = 0) {
        if (this.isShuttingDown) {
            logger.warn('Shutdown already in progress');
            return;
        }
        
        this.isShuttingDown = true;
        
        logger.info('Starting graceful shutdown...');
        
        const shutdownTimeout = setTimeout(() => {
            logger.error('Graceful shutdown timeout, forcing exit');
            process.exit(1);
        }, config.SERVER.shutdownTimeout);
        
        try {
            // Stop accepting new connections
            if (this.server) {
                this.server.close(() => {
                    logger.info('HTTP server closed');
                });
            }
            
            // Close WebSocket server
            if (this.wsServer) {
                await new Promise((resolve) => {
                    this.wsServer.close(resolve);
                });
                logger.info('WebSocket server closed');
            }
            
            // Close existing connections
            for (const socket of this.connections) {
                socket.destroy();
            }
            
            // Close database connections
            await dbManager.close();
            logger.info('Database connections closed');
            
            clearTimeout(shutdownTimeout);
            
            logger.info('Graceful shutdown completed');
            process.exit(exitCode);
            
        } catch (error) {
            logger.error('Error during graceful shutdown', {
                error: error.message,
                stack: error.stack
            });
            
            clearTimeout(shutdownTimeout);
            process.exit(1);
        }
    }
    
    /**
     * Get server metrics
     */
    async getServerMetrics() {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        return {
            server: {
                uptime: Date.now() - this.startTime,
                version: config.SERVER.version,
                environment: config.ENVIRONMENT.nodeEnv,
                pid: process.pid,
                nodeVersion: process.version
            },
            memory: {
                rss: memoryUsage.rss,
                heapTotal: memoryUsage.heapTotal,
                heapUsed: memoryUsage.heapUsed,
                external: memoryUsage.external,
                arrayBuffers: memoryUsage.arrayBuffers
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            connections: {
                http: this.connections.size,
                websocket: this.wsServer ? this.wsServer.clients.size : 0
            },
            database: await dbManager.getMetrics(),
            timestamp: new Date().toISOString()
        };
    }
}

// Create and export server instance
const server = new SecurityDashboardServer();

module.exports = {
    SecurityDashboardServer,
    server
};

// Start server if this file is run directly
if (require.main === module) {
    server.start().catch((error) => {
        logger.error('Failed to start server', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    });
}