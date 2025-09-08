/**
 * NEXUS IDE - Advanced API Gateway
 * Phase 3 Server Infrastructure
 * 
 * Features:
 * - Intelligent Request Routing
 * - Load Balancing & Health Checks
 * - Rate Limiting & Security
 * - Real-time WebSocket Management
 * - GraphQL & REST API Support
 * - Microservices Orchestration
 * - Performance Monitoring
 * - Auto-scaling Integration
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const WebSocket = require('ws');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const jwt = require('jsonwebtoken');
const Redis = require('redis');
const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class NexusAPIGateway extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            port: process.env.GATEWAY_PORT || 8080,
            host: process.env.GATEWAY_HOST || '0.0.0.0',
            
            // Security Configuration
            security: {
                jwtSecret: process.env.JWT_SECRET || 'nexus-ide-secret-key',
                jwtExpiry: '24h',
                rateLimiting: {
                    windowMs: 15 * 60 * 1000, // 15 minutes
                    max: 1000, // requests per window
                    message: 'Too many requests from this IP'
                },
                cors: {
                    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
                    credentials: true,
                    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
                    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
                }
            },
            
            // Service Registry
            services: {
                'auth-service': {
                    url: 'http://localhost:3001',
                    healthCheck: '/health',
                    timeout: 10000,
                    retries: 3,
                    loadBalancing: 'round-robin'
                },
                'git-memory-service': {
                    url: 'http://localhost:3002',
                    healthCheck: '/health',
                    timeout: 15000,
                    retries: 2,
                    loadBalancing: 'least-connections'
                },
                'ai-service': {
                    url: 'http://localhost:3003',
                    healthCheck: '/health',
                    timeout: 30000,
                    retries: 1,
                    loadBalancing: 'weighted-round-robin',
                    weight: 2
                },
                'collaboration-service': {
                    url: 'http://localhost:3004',
                    healthCheck: '/health',
                    timeout: 5000,
                    retries: 3,
                    loadBalancing: 'fastest-response'
                },
                'file-service': {
                    url: 'http://localhost:3005',
                    healthCheck: '/health',
                    timeout: 20000,
                    retries: 2,
                    loadBalancing: 'round-robin'
                },
                'performance-service': {
                    url: 'http://localhost:3006',
                    healthCheck: '/health',
                    timeout: 10000,
                    retries: 3,
                    loadBalancing: 'least-connections'
                }
            },
            
            // WebSocket Configuration
            websocket: {
                enabled: true,
                port: process.env.WS_PORT || 8081,
                maxConnections: 10000,
                heartbeatInterval: 30000,
                messageRateLimit: 100 // messages per second
            },
            
            // GraphQL Configuration
            graphql: {
                enabled: true,
                endpoint: '/graphql',
                playground: process.env.NODE_ENV !== 'production',
                introspection: process.env.NODE_ENV !== 'production'
            },
            
            // Caching Configuration
            cache: {
                enabled: true,
                redis: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: process.env.REDIS_PORT || 6379,
                    password: process.env.REDIS_PASSWORD,
                    db: 0
                },
                ttl: {
                    default: 300, // 5 minutes
                    auth: 3600, // 1 hour
                    static: 86400, // 24 hours
                    dynamic: 60 // 1 minute
                }
            },
            
            // Monitoring Configuration
            monitoring: {
                enabled: true,
                metricsEndpoint: '/metrics',
                healthEndpoint: '/health',
                statusEndpoint: '/status'
            },
            
            ...config
        };
        
        this.app = express();
        this.server = null;
        this.wsServer = null;
        this.redis = null;
        
        // Service registry and health tracking
        this.serviceRegistry = new Map();
        this.serviceHealth = new Map();
        this.loadBalancers = new Map();
        
        // WebSocket connections
        this.wsConnections = new Map();
        this.wsRooms = new Map();
        
        // Metrics and monitoring
        this.metrics = {
            requests: { total: 0, success: 0, errors: 0 },
            responseTime: { avg: 0, p95: 0, p99: 0 },
            services: new Map(),
            websocket: { connections: 0, messages: 0 },
            cache: { hits: 0, misses: 0, hitRate: 0 }
        };
        
        this.responseTimes = [];
        this.requestQueue = [];
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing NEXUS API Gateway...');
        
        try {
            // Initialize Redis connection
            if (this.config.cache.enabled) {
                await this.initializeRedis();
            }
            
            // Setup middleware
            this.setupMiddleware();
            
            // Setup routes
            this.setupRoutes();
            
            // Setup GraphQL
            if (this.config.graphql.enabled) {
                this.setupGraphQL();
            }
            
            // Initialize service registry
            this.initializeServiceRegistry();
            
            // Setup WebSocket server
            if (this.config.websocket.enabled) {
                await this.setupWebSocketServer();
            }
            
            // Start health checks
            this.startHealthChecks();
            
            // Start metrics collection
            this.startMetricsCollection();
            
            // Start the server
            await this.start();
            
            console.log('✅ NEXUS API Gateway initialized successfully');
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize NEXUS API Gateway:', error);
            throw error;
        }
    }
    
    async initializeRedis() {
        console.log('🔴 Connecting to Redis...');
        
        this.redis = Redis.createClient(this.config.cache.redis);
        
        this.redis.on('error', (error) => {
            console.error('❌ Redis connection error:', error);
        });
        
        this.redis.on('connect', () => {
            console.log('✅ Connected to Redis');
        });
        
        await this.redis.connect();
    }
    
    setupMiddleware() {
        console.log('🔧 Setting up middleware...');
        
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "ws:", "wss:"]
                }
            }
        }));
        
        // CORS
        this.app.use(cors(this.config.security.cors));
        
        // Compression
        this.app.use(compression());
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Rate limiting
        const limiter = rateLimit(this.config.security.rateLimiting);
        this.app.use(limiter);
        
        // Request logging and metrics
        this.app.use((req, res, next) => {
            const startTime = Date.now();
            req.id = crypto.randomUUID();
            req.startTime = startTime;
            
            console.log(`📥 ${req.method} ${req.path} [${req.id}]`);
            
            res.on('finish', () => {
                const responseTime = Date.now() - startTime;
                this.recordMetrics(req, res, responseTime);
                
                console.log(`📤 ${req.method} ${req.path} [${req.id}] - ${res.statusCode} (${responseTime}ms)`);
            });
            
            next();
        });
        
        // Authentication middleware
        this.app.use('/api', this.authenticateToken.bind(this));
    }
    
    setupRoutes() {
        console.log('🛣️ Setting up routes...');
        
        // Health check endpoint
        this.app.get(this.config.monitoring.healthEndpoint, (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                services: this.getServiceHealthStatus()
            });
        });
        
        // Status endpoint
        this.app.get(this.config.monitoring.statusEndpoint, (req, res) => {
            res.json({
                gateway: {
                    version: '1.0.0',
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage()
                },
                services: this.getDetailedServiceStatus(),
                metrics: this.getMetrics()
            });
        });
        
        // Metrics endpoint
        this.app.get(this.config.monitoring.metricsEndpoint, (req, res) => {
            res.json(this.getMetrics());
        });
        
        // Service proxy routes
        this.setupServiceProxies();
        
        // WebSocket upgrade handling
        this.app.get('/ws', (req, res) => {
            res.json({
                message: 'WebSocket endpoint available',
                url: `ws://${req.get('host').replace(/:\d+/, `:${this.config.websocket.port}`)}`
            });
        });
        
        // Catch-all error handler
        this.app.use((error, req, res, next) => {
            console.error(`❌ Gateway error [${req.id}]:`, error);
            
            res.status(error.status || 500).json({
                error: {
                    message: error.message || 'Internal server error',
                    code: error.code || 'INTERNAL_ERROR',
                    requestId: req.id
                }
            });
        });
        
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: {
                    message: 'Endpoint not found',
                    code: 'NOT_FOUND',
                    requestId: req.id
                }
            });
        });
    }
    
    setupServiceProxies() {
        console.log('🔄 Setting up service proxies...');
        
        for (const [serviceName, serviceConfig] of Object.entries(this.config.services)) {
            const proxyPath = `/api/${serviceName.replace('-service', '')}`;
            
            console.log(`📡 Proxying ${proxyPath} -> ${serviceConfig.url}`);
            
            const proxy = createProxyMiddleware({
                target: serviceConfig.url,
                changeOrigin: true,
                pathRewrite: {
                    [`^${proxyPath}`]: ''
                },
                timeout: serviceConfig.timeout,
                retries: serviceConfig.retries,
                onProxyReq: (proxyReq, req, res) => {
                    // Add request headers
                    proxyReq.setHeader('X-Gateway-Request-ID', req.id);
                    proxyReq.setHeader('X-Gateway-Timestamp', req.startTime);
                    
                    // Forward user information
                    if (req.user) {
                        proxyReq.setHeader('X-User-ID', req.user.id);
                        proxyReq.setHeader('X-User-Role', req.user.role);
                    }
                },
                onProxyRes: (proxyRes, req, res) => {
                    // Add response headers
                    proxyRes.headers['X-Gateway-Service'] = serviceName;
                    proxyRes.headers['X-Gateway-Response-Time'] = Date.now() - req.startTime;
                },
                onError: (error, req, res) => {
                    console.error(`❌ Proxy error for ${serviceName}:`, error.message);
                    
                    // Mark service as unhealthy
                    this.serviceHealth.set(serviceName, {
                        healthy: false,
                        lastError: error.message,
                        lastCheck: new Date()
                    });
                    
                    res.status(503).json({
                        error: {
                            message: 'Service temporarily unavailable',
                            code: 'SERVICE_UNAVAILABLE',
                            service: serviceName,
                            requestId: req.id
                        }
                    });
                }
            });
            
            this.app.use(proxyPath, proxy);
        }
    }
    
    setupGraphQL() {
        console.log('🔮 Setting up GraphQL...');
        
        const schema = buildSchema(`
            type Query {
                services: [Service!]!
                metrics: Metrics!
                health: Health!
            }
            
            type Service {
                name: String!
                url: String!
                healthy: Boolean!
                responseTime: Float
                lastCheck: String
            }
            
            type Metrics {
                requests: RequestMetrics!
                responseTime: ResponseTimeMetrics!
                cache: CacheMetrics!
                websocket: WebSocketMetrics!
            }
            
            type RequestMetrics {
                total: Int!
                success: Int!
                errors: Int!
            }
            
            type ResponseTimeMetrics {
                avg: Float!
                p95: Float!
                p99: Float!
            }
            
            type CacheMetrics {
                hits: Int!
                misses: Int!
                hitRate: Float!
            }
            
            type WebSocketMetrics {
                connections: Int!
                messages: Int!
            }
            
            type Health {
                status: String!
                uptime: Float!
                services: [ServiceHealth!]!
            }
            
            type ServiceHealth {
                name: String!
                healthy: Boolean!
                responseTime: Float
                lastCheck: String
                error: String
            }
        `);
        
        const root = {
            services: () => this.getServicesForGraphQL(),
            metrics: () => this.getMetrics(),
            health: () => this.getHealthForGraphQL()
        };
        
        this.app.use(this.config.graphql.endpoint, graphqlHTTP({
            schema: schema,
            rootValue: root,
            graphiql: this.config.graphql.playground,
            introspection: this.config.graphql.introspection
        }));
    }
    
    async setupWebSocketServer() {
        console.log('🔌 Setting up WebSocket server...');
        
        this.wsServer = new WebSocket.Server({
            port: this.config.websocket.port,
            maxPayload: 1024 * 1024, // 1MB
            perMessageDeflate: true
        });
        
        this.wsServer.on('connection', (ws, req) => {
            this.handleWebSocketConnection(ws, req);
        });
        
        this.wsServer.on('error', (error) => {
            console.error('❌ WebSocket server error:', error);
        });
        
        // Setup heartbeat
        setInterval(() => {
            this.wsServer.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    return ws.terminate();
                }
                
                ws.isAlive = false;
                ws.ping();
            });
        }, this.config.websocket.heartbeatInterval);
        
        console.log(`✅ WebSocket server listening on port ${this.config.websocket.port}`);
    }
    
    handleWebSocketConnection(ws, req) {
        const connectionId = crypto.randomUUID();
        const clientIP = req.socket.remoteAddress;
        
        console.log(`🔌 New WebSocket connection: ${connectionId} from ${clientIP}`);
        
        // Initialize connection
        ws.id = connectionId;
        ws.isAlive = true;
        ws.joinedRooms = new Set();
        ws.messageCount = 0;
        ws.lastMessageTime = Date.now();
        
        this.wsConnections.set(connectionId, ws);
        this.metrics.websocket.connections++;
        
        // Handle messages
        ws.on('message', (data) => {
            this.handleWebSocketMessage(ws, data);
        });
        
        // Handle pong
        ws.on('pong', () => {
            ws.isAlive = true;
        });
        
        // Handle close
        ws.on('close', () => {
            console.log(`🔌 WebSocket connection closed: ${connectionId}`);
            
            // Leave all rooms
            ws.joinedRooms.forEach(room => {
                this.leaveRoom(ws, room);
            });
            
            this.wsConnections.delete(connectionId);
            this.metrics.websocket.connections--;
        });
        
        // Handle error
        ws.on('error', (error) => {
            console.error(`❌ WebSocket error for ${connectionId}:`, error);
        });
        
        // Send welcome message
        this.sendWebSocketMessage(ws, {
            type: 'welcome',
            connectionId,
            timestamp: new Date().toISOString()
        });
    }
    
    handleWebSocketMessage(ws, data) {
        try {
            const message = JSON.parse(data.toString());
            
            // Rate limiting
            const now = Date.now();
            if (now - ws.lastMessageTime < 1000 / this.config.websocket.messageRateLimit) {
                ws.messageCount++;
                if (ws.messageCount > this.config.websocket.messageRateLimit) {
                    this.sendWebSocketMessage(ws, {
                        type: 'error',
                        message: 'Rate limit exceeded'
                    });
                    return;
                }
            } else {
                ws.messageCount = 0;
            }
            ws.lastMessageTime = now;
            
            this.metrics.websocket.messages++;
            
            // Handle different message types
            switch (message.type) {
                case 'join_room':
                    this.joinRoom(ws, message.room);
                    break;
                    
                case 'leave_room':
                    this.leaveRoom(ws, message.room);
                    break;
                    
                case 'broadcast':
                    this.broadcastToRoom(message.room, message.data, ws.id);
                    break;
                    
                case 'ping':
                    this.sendWebSocketMessage(ws, { type: 'pong' });
                    break;
                    
                default:
                    console.warn(`⚠️ Unknown WebSocket message type: ${message.type}`);
            }
            
        } catch (error) {
            console.error('❌ WebSocket message parsing error:', error);
            this.sendWebSocketMessage(ws, {
                type: 'error',
                message: 'Invalid message format'
            });
        }
    }
    
    joinRoom(ws, roomName) {
        if (!this.wsRooms.has(roomName)) {
            this.wsRooms.set(roomName, new Set());
        }
        
        this.wsRooms.get(roomName).add(ws.id);
        ws.joinedRooms.add(roomName);
        
        console.log(`🏠 WebSocket ${ws.id} joined room: ${roomName}`);
        
        this.sendWebSocketMessage(ws, {
            type: 'room_joined',
            room: roomName,
            members: this.wsRooms.get(roomName).size
        });
    }
    
    leaveRoom(ws, roomName) {
        if (this.wsRooms.has(roomName)) {
            this.wsRooms.get(roomName).delete(ws.id);
            
            if (this.wsRooms.get(roomName).size === 0) {
                this.wsRooms.delete(roomName);
            }
        }
        
        ws.joinedRooms.delete(roomName);
        
        console.log(`🏠 WebSocket ${ws.id} left room: ${roomName}`);
        
        this.sendWebSocketMessage(ws, {
            type: 'room_left',
            room: roomName
        });
    }
    
    broadcastToRoom(roomName, data, excludeId = null) {
        if (!this.wsRooms.has(roomName)) return;
        
        const room = this.wsRooms.get(roomName);
        const message = {
            type: 'broadcast',
            room: roomName,
            data,
            timestamp: new Date().toISOString()
        };
        
        room.forEach(connectionId => {
            if (connectionId !== excludeId) {
                const ws = this.wsConnections.get(connectionId);
                if (ws && ws.readyState === WebSocket.OPEN) {
                    this.sendWebSocketMessage(ws, message);
                }
            }
        });
    }
    
    sendWebSocketMessage(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    
    initializeServiceRegistry() {
        console.log('📋 Initializing service registry...');
        
        for (const [serviceName, serviceConfig] of Object.entries(this.config.services)) {
            this.serviceRegistry.set(serviceName, {
                ...serviceConfig,
                instances: [serviceConfig.url],
                currentIndex: 0,
                connections: 0
            });
            
            this.serviceHealth.set(serviceName, {
                healthy: true,
                responseTime: 0,
                lastCheck: new Date(),
                consecutiveFailures: 0
            });
            
            // Initialize load balancer for service
            this.loadBalancers.set(serviceName, new ServiceLoadBalancer(
                serviceConfig.loadBalancing || 'round-robin'
            ));
        }
    }
    
    startHealthChecks() {
        console.log('🏥 Starting health checks...');
        
        setInterval(async () => {
            for (const [serviceName, serviceConfig] of this.serviceRegistry.entries()) {
                await this.checkServiceHealth(serviceName, serviceConfig);
            }
        }, 30000); // Check every 30 seconds
    }
    
    async checkServiceHealth(serviceName, serviceConfig) {
        try {
            const startTime = Date.now();
            const response = await fetch(`${serviceConfig.url}${serviceConfig.healthCheck}`, {
                method: 'GET',
                timeout: 5000
            });
            
            const responseTime = Date.now() - startTime;
            const healthy = response.ok;
            
            this.serviceHealth.set(serviceName, {
                healthy,
                responseTime,
                lastCheck: new Date(),
                consecutiveFailures: healthy ? 0 : (this.serviceHealth.get(serviceName)?.consecutiveFailures || 0) + 1,
                lastError: healthy ? null : `HTTP ${response.status}`
            });
            
            if (!healthy) {
                console.warn(`⚠️ Service ${serviceName} health check failed: HTTP ${response.status}`);
            }
            
        } catch (error) {
            const healthInfo = this.serviceHealth.get(serviceName) || {};
            
            this.serviceHealth.set(serviceName, {
                healthy: false,
                responseTime: 0,
                lastCheck: new Date(),
                consecutiveFailures: (healthInfo.consecutiveFailures || 0) + 1,
                lastError: error.message
            });
            
            console.error(`❌ Service ${serviceName} health check error:`, error.message);
        }
    }
    
    startMetricsCollection() {
        console.log('📊 Starting metrics collection...');
        
        setInterval(() => {
            this.calculateMetrics();
        }, 10000); // Calculate every 10 seconds
    }
    
    calculateMetrics() {
        // Calculate response time percentiles
        if (this.responseTimes.length > 0) {
            const sorted = [...this.responseTimes].sort((a, b) => a - b);
            
            this.metrics.responseTime.avg = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
            this.metrics.responseTime.p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
            this.metrics.responseTime.p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
            
            // Keep only recent response times
            if (this.responseTimes.length > 1000) {
                this.responseTimes = this.responseTimes.slice(-500);
            }
        }
        
        // Calculate cache hit rate
        const totalCacheRequests = this.metrics.cache.hits + this.metrics.cache.misses;
        this.metrics.cache.hitRate = totalCacheRequests > 0 ? this.metrics.cache.hits / totalCacheRequests : 0;
    }
    
    recordMetrics(req, res, responseTime) {
        this.responseTimes.push(responseTime);
        
        this.metrics.requests.total++;
        if (res.statusCode < 400) {
            this.metrics.requests.success++;
        } else {
            this.metrics.requests.errors++;
        }
    }
    
    async authenticateToken(req, res, next) {
        // Skip authentication for health checks and public endpoints
        if (req.path.startsWith('/health') || req.path.startsWith('/status') || req.path.startsWith('/metrics')) {
            return next();
        }
        
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                error: {
                    message: 'Access token required',
                    code: 'MISSING_TOKEN'
                }
            });
        }
        
        try {
            const decoded = jwt.verify(token, this.config.security.jwtSecret);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(403).json({
                error: {
                    message: 'Invalid or expired token',
                    code: 'INVALID_TOKEN'
                }
            });
        }
    }
    
    getServiceHealthStatus() {
        const status = {};
        
        for (const [serviceName, health] of this.serviceHealth.entries()) {
            status[serviceName] = {
                healthy: health.healthy,
                responseTime: health.responseTime,
                lastCheck: health.lastCheck.toISOString()
            };
        }
        
        return status;
    }
    
    getDetailedServiceStatus() {
        const status = {};
        
        for (const [serviceName, health] of this.serviceHealth.entries()) {
            const serviceConfig = this.serviceRegistry.get(serviceName);
            
            status[serviceName] = {
                url: serviceConfig?.url,
                healthy: health.healthy,
                responseTime: health.responseTime,
                lastCheck: health.lastCheck.toISOString(),
                consecutiveFailures: health.consecutiveFailures,
                lastError: health.lastError,
                loadBalancing: serviceConfig?.loadBalancing
            };
        }
        
        return status;
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        };
    }
    
    getServicesForGraphQL() {
        const services = [];
        
        for (const [serviceName, health] of this.serviceHealth.entries()) {
            const serviceConfig = this.serviceRegistry.get(serviceName);
            
            services.push({
                name: serviceName,
                url: serviceConfig?.url || '',
                healthy: health.healthy,
                responseTime: health.responseTime,
                lastCheck: health.lastCheck.toISOString()
            });
        }
        
        return services;
    }
    
    getHealthForGraphQL() {
        const services = [];
        
        for (const [serviceName, health] of this.serviceHealth.entries()) {
            services.push({
                name: serviceName,
                healthy: health.healthy,
                responseTime: health.responseTime,
                lastCheck: health.lastCheck.toISOString(),
                error: health.lastError
            });
        }
        
        return {
            status: services.every(s => s.healthy) ? 'healthy' : 'degraded',
            uptime: process.uptime(),
            services
        };
    }
    
    async start() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.config.port, this.config.host, (error) => {
                if (error) {
                    reject(error);
                } else {
                    console.log(`🚀 NEXUS API Gateway listening on ${this.config.host}:${this.config.port}`);
                    resolve();
                }
            });
        });
    }
    
    async shutdown() {
        console.log('🔄 Shutting down NEXUS API Gateway...');
        
        // Close WebSocket server
        if (this.wsServer) {
            this.wsServer.close();
        }
        
        // Close HTTP server
        if (this.server) {
            this.server.close();
        }
        
        // Close Redis connection
        if (this.redis) {
            await this.redis.quit();
        }
        
        this.emit('shutdown');
        console.log('✅ NEXUS API Gateway shutdown complete');
    }
}

// Service Load Balancer
class ServiceLoadBalancer {
    constructor(algorithm = 'round-robin') {
        this.algorithm = algorithm;
        this.currentIndex = 0;
        this.connections = new Map();
    }
    
    selectInstance(instances, healthStatus) {
        const healthyInstances = instances.filter((instance, index) => {
            const health = healthStatus[index];
            return health && health.healthy;
        });
        
        if (healthyInstances.length === 0) {
            return null;
        }
        
        switch (this.algorithm) {
            case 'round-robin':
                return this.roundRobin(healthyInstances);
            case 'least-connections':
                return this.leastConnections(healthyInstances);
            case 'weighted-round-robin':
                return this.weightedRoundRobin(healthyInstances);
            case 'fastest-response':
                return this.fastestResponse(healthyInstances, healthStatus);
            default:
                return healthyInstances[0];
        }
    }
    
    roundRobin(instances) {
        const instance = instances[this.currentIndex % instances.length];
        this.currentIndex++;
        return instance;
    }
    
    leastConnections(instances) {
        return instances.reduce((min, instance) => {
            const minConnections = this.connections.get(min) || 0;
            const instanceConnections = this.connections.get(instance) || 0;
            return instanceConnections < minConnections ? instance : min;
        });
    }
    
    weightedRoundRobin(instances) {
        // Simplified weighted round robin
        return this.roundRobin(instances);
    }
    
    fastestResponse(instances, healthStatus) {
        return instances.reduce((fastest, instance) => {
            const fastestTime = this.getResponseTime(fastest, healthStatus);
            const instanceTime = this.getResponseTime(instance, healthStatus);
            return instanceTime < fastestTime ? instance : fastest;
        });
    }
    
    getResponseTime(instance, healthStatus) {
        // Find response time for instance
        return 100; // Placeholder
    }
    
    incrementConnections(instance) {
        const current = this.connections.get(instance) || 0;
        this.connections.set(instance, current + 1);
    }
    
    decrementConnections(instance) {
        const current = this.connections.get(instance) || 0;
        this.connections.set(instance, Math.max(0, current - 1));
    }
}

// Export the main class
module.exports = NexusAPIGateway;

// Example usage
if (require.main === module) {
    const gateway = new NexusAPIGateway();
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await gateway.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await gateway.shutdown();
        process.exit(0);
    });
}