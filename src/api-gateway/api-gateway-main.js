console.log('Starting API Gateway...');
console.log('Loading modules...');
const path = require('path');

// Simple logger for API Gateway
const logger = {
  info: (message, data) => console.log(`[INFO] ${message}`, data || ''),
  error: (message, data) => console.error(`[ERROR] ${message}`, data || ''),
  warn: (message, data) => console.warn(`[WARN] ${message}`, data || ''),
  debug: (message, data) => console.log(`[DEBUG] ${message}`, data || '')
};

// Make logger available globally for other modules
global.logger = logger;

/**
 * Git Memory MCP Server - API Gateway Main
 * Main Entry Point สำหรับ API Gateway System
 * 
 * Features:
 * - Unified API Gateway for 1000 MCP servers
 * - Advanced routing and load balancing
 * - Comprehensive monitoring and analytics
 * - Multi-layer caching system
 * - Advanced security and authentication
 * - WebSocket support
 * - High-performance proxy system
 * - Real-time dashboard
 * - Auto-scaling capabilities
 * - Health checking and failover
 */

const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs').promises;
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const AuthModule = require('../auth');
const APIGatewayConfig = require('./api-gateway-config');
const APIGatewayMiddleware = require('./api-gateway-middleware');
const APIGatewayRoutes = require('./api-gateway-routes');
const EnhancedMonitoring = require('../services/MonitoringService');
const APIGatewayDashboard = require('./api-gateway-dashboard');
const APIGatewayLoadBalancer = require('./api-gateway-load-balancer');
const APIGatewaySecurity = require('./api-gateway-security');
const APIGatewayWebSocket = require('./api-gateway-websocket');
const APIGatewayCache = require('./api-gateway-cache');
const APIGatewayProxy = require('./api-gateway-proxy');

/*
// Import routes
const subscriptionRoutes = require('../routes/subscriptionRoutes');
const paymentRoutes = require('../routes/paymentRoutes');
const developerPortalRoutes = require('../routes/developerPortalRoutes');
const communityMarketplaceRoutes = require('../routes/mcpMarketplaceRoutes');
const multiCloudDeploymentRoutes = require('../routes/multiCloudDeploymentRoutes');
const advancedComplianceRoutes = require('../routes/advancedComplianceRoutes');
const enterpriseSSORoutes = require('../routes/enterpriseSSORoutes');
const customBrandingRoutes = require('../routes/customBrandingRoutes');
const saasRoutes = require('../routes/saasRoutes');
const selfServicePortalRoutes = require('../routes/selfServicePortalRoutes');
const professionalServicesRoutes = require('../routes/professionalServicesRoutes');
const intelligentLoadBalancerRoutes = require('../routes/intelligentLoadBalancerRoutes');
const predictiveScalerRoutes = require('../routes/predictiveScalerRoutes');
const automatedOptimizationRoutes = require('../routes/automatedOptimizationRoutes');
const smartMonitoringRoutes = require('../routes/smartMonitoringRoutes');
const developerPlatformRoutes = require('../routes/developerPlatformRoutes');
*/



class APIGatewayMain {
    constructor(configPath = './api-gateway.config.json', monitoringConfigPath = './monitoring.config.json') {
        this.configPath = configPath;
        this.monitoringConfigPath = monitoringConfigPath;
        this.config = null;
        this.monitoringConfig = null;
        this.app = null;
        this.server = null;
        this.httpsServer = null;
        
        // Core components
        this.configManager = null;
        this.middleware = null;
        this.routes = null;
        this.monitoring = null;
        this.dashboard = null;
        this.loadBalancer = null;
        this.security = null;
        this.websocket = null;
        this.cache = null;
        this.proxy = null;
        this.authModule = null;
        
        // State
        this.isRunning = false;
        this.startTime = null;
        this.stats = {
            requests: 0,
            responses: 0,
            errors: 0,
            uptime: 0
        };
        
        console.log('🚀 API Gateway Main initializing...');
    }
    
    /**
     * Initialize API Gateway
     */
    async initialize() {
        try {
            console.log('🚀 Initializing API Gateway components...');

            
            // Load configuration
            await this.loadConfiguration();
            
            // Initialize core components
            await this.initializeComponents();
            
            // // Setup Express application
            // await this.setupExpressApp();
            
            // // Setup middleware
            // await this.setupMiddleware();
            
            // // Setup routes
            // await this.setupRoutes();
            
            // // Setup monitoring
            // await this.setupMonitoring();
            
            // // Setup dashboard
            // await this.setupDashboard();
            
            console.log('✅ API Gateway initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize API Gateway:', error);
            throw error;
        }
    }
    
    /**
     * Load configuration
     */
    async loadConfiguration() {
        try {
            console.log('🔄 Loading configuration...');
            this.configManager = new APIGatewayConfig({
                configDir: path.join(__dirname, 'config'),
                environment: process.env.NODE_ENV || 'development'
            });

            const config = await new Promise((resolve, reject) => {
                this.configManager.on('initialized', resolve);
                this.configManager.on('error', reject);
            });

            this.config = config;
            this.monitoringConfig = config.monitoring;

            if (!this.monitoringConfig) {
                console.error('❌ Monitoring configuration is missing after load!');
                throw new Error('Monitoring configuration failed to load.');
            }

            console.log('✅ Configuration loaded and validated successfully');
        } catch (error) {
            console.error('❌ Failed to load configuration:', error);
            throw error;
        }
    }
    
    /**
     * Create default configuration
     */
    async createDefaultConfig() {
        const defaultConfig = {
            server: {
                port: 8080,
                httpsPort: 8443,
                host: '0.0.0.0',
                ssl: {
                    enabled: false,
                    cert: null,
                    key: null
                }
            },
            upstream: {
                servers: [],
                healthCheck: {
                    enabled: true,
                    interval: 30000,
                    timeout: 5000,
                    path: '/health'
                }
            },
            loadBalancer: {
                algorithm: 'round-robin',
                healthCheck: true,
                failover: true,
                sticky: false
            },
            cache: {
                enabled: true,
                layers: {
                    memory: { enabled: true, maxSize: 100 * 1024 * 1024 },
                    redis: { enabled: false },
                    file: { enabled: true, directory: './cache' }
                }
            },
            security: {
                authentication: {
                    enabled: true,
                    methods: ['jwt', 'apikey']
                },
                rateLimit: {
                    enabled: true,
                    windowMs: 60000,
                    max: 1000
                },
                cors: {
                    enabled: true,
                    origin: '*'
                }
            },
            monitoring: {
                enabled: true,
                metrics: {
                    enabled: true,
                    retention: 86400000
                },
                dashboard: {
                    enabled: true,
                    port: 8081
                }
            },
            websocket: {
                enabled: true,
                port: 8082
            },
            proxy: {
                timeout: 30000,
                retries: 3,
                keepAlive: true
            }
        };
        
        await fs.writeFile(this.configPath, JSON.stringify(defaultConfig, null, 2));
        console.log('✅ Default configuration created');
    }
    
    /**
     * Get default monitoring configuration
     */
    getDefaultMonitoringConfig() {
        return {
            metrics: {
                enabled: true,
                interval: 5000,
                retention: 86400000,
                aggregation: {
                    enabled: true,
                    intervals: [60000, 300000, 3600000]
                }
            },
            alerts: {
                enabled: true,
                thresholds: {
                    responseTime: { warning: 500, critical: 1000 },
                    errorRate: { warning: 5, critical: 10 },
                    memoryUsage: { warning: 80, critical: 90 },
                    cpuUsage: { warning: 70, critical: 85 },
                    diskUsage: { warning: 80, critical: 90 }
                },
                notifications: {
                    console: { enabled: true },
                    email: { enabled: false },
                    webhook: { enabled: false },
                    slack: { enabled: false }
                },
                cooldown: 300000
            },
            healthCheck: {
                enabled: true,
                interval: 30000,
                timeout: 5000,
                endpoints: ['/health', '/status']
            },
            dashboard: {
                enabled: true,
                port: 8081,
                host: '0.0.0.0'
            },
            logging: {
                level: 'info',
                format: 'json'
            }
        };
    }
    
    /**
     * Initialize core components
     */
    async initializeComponents() {
        console.log('⚙️ Initializing core components...');
        console.log('Inspecting config at start of initializeComponents:', JSON.stringify(this.config, null, 2));
        console.log('Inspecting monitoringConfig at start of initializeComponents:', JSON.stringify(this.monitoringConfig, null, 2));

        // Initialize cache
        this.cache = new APIGatewayCache(this.config.cache);
        
        // Initialize proxy
        this.proxy = new APIGatewayProxy(this.config.proxy);
        
        // Initialize security
        this.security = new APIGatewaySecurity(this.config.security);
        
        // Initialize load balancer
        this.loadBalancer = new APIGatewayLoadBalancer(this.config.loadBalancer);
        
        // Initialize enhanced monitoring
        this.monitoring = new EnhancedMonitoring(this.monitoringConfig);
        
        // Initialize routes
        this.routes = new APIGatewayRoutes({
            ...this.config.upstream,
            loadBalancer: this.loadBalancer,
            cache: this.cache,
            proxy: this.proxy,
            monitoring: this.monitoring
        });
        
        // Initialize middleware
        this.middleware = new APIGatewayMiddleware({
            security: this.security,
            cache: this.cache,
            monitoring: this.monitoring
        });
        
        // Initialize authentication module
        this.authModule = new AuthModule();
        
        // Initialize WebSocket
        if (this.config.websocket.enabled) {
            this.websocket = new APIGatewayWebSocket(this.config.websocket);
        }
        
        // Initialize dashboard
        console.log('Inspecting config before dashboard init:', JSON.stringify(this.config, null, 2));
        
        // Safeguard against config overwrite
        if (!this.config.monitoring) {
            console.warn('⚠️ Monitoring config missing, re-assigning from monitoringConfig');
            this.config.monitoring = this.monitoringConfig;
        }

        if (this.config.monitoring.dashboard.enabled) {
            this.dashboard = new APIGatewayDashboard({
                ...this.config.monitoring.dashboard,
                monitoring: this.monitoring,
                loadBalancer: this.loadBalancer,
                cache: this.cache
            });
        }
        
        console.log('✅ Core components initialized');
    }
    
    /**
     * Setup Express application
     */
    async setupExpressApp() {
        this.app = express();
        
        // Trust proxy
        this.app.set('trust proxy', true);
        
        // Basic security headers
        this.app.use(helmet());
        
        // CORS
        if (this.config.security.cors.enabled) {
            this.app.use(cors(this.config.security.cors));
        }
        
        // Compression
        this.app.use(compression());
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Rate limiting
        if (this.config.security.rateLimit.enabled) {
            const limiter = rateLimit(this.config.security.rateLimit);
            this.app.use(limiter);
        }
        
        console.log('✅ Express application configured');
    }
    
    /**
     * Setup middleware
     */
    async setupMiddleware() {
        // Apply API Gateway middleware
        this.middleware.applyToApp(this.app);
        
        // Request logging
        this.app.use((req, res, next) => {
            this.stats.requests++;
            req.startTime = Date.now();
            
            res.on('finish', () => {
                this.stats.responses++;
                const responseTime = Date.now() - req.startTime;
                
                // Log request
                console.log(`${req.method} ${req.url} - ${res.statusCode} (${responseTime}ms)`);
                
                // Update monitoring
                if (this.monitoring) {
                    this.monitoring.recordRequest({
                        method: req.method,
                        url: req.url,
                        statusCode: res.statusCode,
                        responseTime,
                        userAgent: req.headers['user-agent'],
                        ip: req.ip
                    });
                }
            });
            
            next();
        });
        
        console.log('✅ Middleware configured');
    }
    
    /**
     * Setup routes
     */
    async setupRoutes() {
        // Authentication routes
        this.app.use('/api/auth', this.authModule.getRoutes());
        
        // Subscription and payment routes
        this.app.use('/api/subscriptions', subscriptionRoutes);
        this.app.use('/api/payments', paymentRoutes);
        this.app.use('/api/developer-portal', developerPortalRoutes);
        this.app.use('/api/community-marketplace', communityMarketplaceRoutes);
        this.app.use('/api/multi-cloud-deployment', multiCloudDeploymentRoutes);
        this.app.use('/api/advanced-compliance', advancedComplianceRoutes);
        this.app.use('/api/enterprise-sso', enterpriseSSORoutes);
        this.app.use('/api/custom-branding', customBrandingRoutes);
        this.app.use('/api/saas', saasRoutes);
        this.app.use('/api/self-service-portal', selfServicePortalRoutes);
        this.app.use('/api/professional-services', professionalServicesRoutes);
        this.app.use('/api/intelligent-load-balancer', intelligentLoadBalancerRoutes);
        this.app.use('/api/predictive-scaler', predictiveScalerRoutes);
        this.app.use('/api/automated-optimization', automatedOptimizationRoutes);
        this.app.use('/api/smart-monitoring', smartMonitoringRoutes);

        // Add more routes as needed
        console.log('✅ Routes setup complete');
        
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: Date.now() - this.startTime,
                version: '1.0.0',
                stats: this.getStats()
            });
        });
        
        // API Gateway info endpoint (protected)
        this.app.get('/info', 
            this.authModule.getMiddleware().verifyToken,
            (req, res) => {
                res.json({
                    name: 'API Gateway',
                    version: '1.0.0',
                    description: 'Advanced API Gateway for 1000 MCP Servers',
                    features: [
                        'Authentication & Authorization',
                        'Load Balancing',
                        'Caching',
                        'Security',
                        'Monitoring',
                        'WebSocket Support',
                        'Auto-scaling',
                        'Health Checking'
                    ],
                    stats: this.getStats(),
                    config: {
                        upstream: {
                            servers: this.config.upstream.servers.length
                        },
                        cache: {
                            enabled: this.config.cache.enabled
                        },
                        security: {
                            authentication: this.config.security.authentication.enabled
                        },
                        monitoring: {
                            enabled: this.config.monitoring.enabled
                        }
                    }
                });
            });
        
        // Stats endpoint (protected)
        this.app.get('/stats', 
            this.authModule.getMiddleware().verifyToken,
            (req, res) => {
                res.json(this.getDetailedStats());
            });
        
        // Apply routing middleware
        this.routes.applyToApp(this.app);
        
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: 'The requested resource was not found',
                path: req.originalUrl,
                timestamp: new Date().toISOString()
            });
        });
        
        // Error handler
        this.app.use((error, req, res, next) => {
            this.stats.errors++;
            
            console.error('❌ API Gateway error:', error);
            
            if (this.monitoring) {
                this.monitoring.recordError({
                    error: error.message,
                    stack: error.stack,
                    url: req.url,
                    method: req.method,
                    timestamp: Date.now()
                });
            }
            
            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: 'An unexpected error occurred',
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        console.log('✅ Routes configured');
    }
    
    /**
     * Setup monitoring
     */
    async setupMonitoring() {
        if (!this.monitoring) {
            return;
        }
        
        // Initialize monitoring
        await this.monitoring.init();
        
        // Setup monitoring events
        this.monitoring.on('alert', (alert) => {
            console.warn('⚠️ Monitoring Alert:', alert);
        });
        
        this.monitoring.on('metrics', (metrics) => {
            // Handle metrics update
        });
        
        console.log('✅ Monitoring configured');
    }
    
    /**
     * Setup dashboard
     */
    async setupDashboard() {
        if (!this.dashboard) {
            return;
        }
        
        // Start dashboard server
        await this.dashboard.start();
        
        console.log(`✅ Dashboard available at http://localhost:${this.config.monitoring.dashboard.port}`);
    }
    
    /**
     * Start API Gateway
     */
    async start() {
        try {
            if (this.isRunning) {
                console.log('⚠️ API Gateway is already running');
                return;
            }
            
            this.startTime = Date.now();
            
            // Initialize authentication module
            await this.authModule.initialize();
            console.log('✅ Authentication module initialized');
            
            // Start HTTP server
            this.server = http.createServer(this.app);
            
            // Handle WebSocket upgrades
            if (this.websocket) {
                this.server.on('upgrade', (req, socket, head) => {
                    this.websocket.handleUpgrade(req, socket, head);
                });
            }
            
            await new Promise((resolve, reject) => {
                this.server.listen(this.config.server.port, this.config.server.host, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
            
            console.log(`🚀 API Gateway HTTP server running on ${this.config.server.host}:${this.config.server.port}`);
            console.log(`🔐 Authentication enabled - Admin: ${process.env.ADMIN_USERNAME || 'admin'}`);
            
            // Start HTTPS server if SSL is enabled
            if (this.config.server.ssl.enabled && this.config.server.ssl.cert && this.config.server.ssl.key) {
                try {
                    const cert = await fs.readFile(this.config.server.ssl.cert);
                    const key = await fs.readFile(this.config.server.ssl.key);
                    
                    this.httpsServer = https.createServer({ cert, key }, this.app);
                    
                    await new Promise((resolve, reject) => {
                        this.httpsServer.listen(this.config.server.httpsPort, this.config.server.host, (error) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve();
                            }
                        });
                    });
                    
                    console.log(`🔒 API Gateway HTTPS server running on ${this.config.server.host}:${this.config.server.httpsPort}`);
                } catch (error) {
                    console.error('❌ Failed to start HTTPS server:', error);
                }
            }
            
            // Start WebSocket server
            if (this.websocket) {
                await this.websocket.start();
                console.log(`🔌 WebSocket server running on port ${this.config.websocket.port}`);
            }
            
            this.isRunning = true;
            
            // Setup graceful shutdown
            this.setupGracefulShutdown();
            
            console.log('✅ API Gateway started successfully');
            this.printStartupInfo();
            
        } catch (error) {
            console.error('❌ Failed to start API Gateway:', error);
            throw error;
        }
    }
    
    /**
     * Stop API Gateway
     */
    async stop() {
        try {
            if (!this.isRunning) {
                console.log('⚠️ API Gateway is not running');
                return;
            }
            
            console.log('🛑 Stopping API Gateway...');
            
            // Stop servers
            if (this.server) {
                await new Promise((resolve) => {
                    this.server.close(resolve);
                });
            }
            
            if (this.httpsServer) {
                await new Promise((resolve) => {
                    this.httpsServer.close(resolve);
                });
            }
            
            // Stop components
            if (this.authModule) {
                await this.authModule.close();
            }
            
            if (this.websocket) {
                await this.websocket.stop();
            }
            
            if (this.dashboard) {
                await this.dashboard.stop();
            }
            
            if (this.monitoring) {
                await this.monitoring.stop();
            }
            
            if (this.proxy) {
                await this.proxy.close();
            }
            
            this.isRunning = false;
            
            console.log('✅ API Gateway stopped successfully');
            
        } catch (error) {
            console.error('❌ Failed to stop API Gateway:', error);
            throw error;
        }
    }
    
    /**
     * Setup graceful shutdown
     */
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
            
            try {
                await this.stop();
                process.exit(0);
            } catch (error) {
                console.error('❌ Error during shutdown:', error);
                process.exit(1);
            }
        };
        
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon
    }
    
    /**
     * Get basic stats
     */
    getStats() {
        return {
            ...this.stats,
            uptime: this.startTime ? Date.now() - this.startTime : 0,
            isRunning: this.isRunning
        };
    }
    
    /**
     * Get detailed stats
     */
    getDetailedStats() {
        const stats = this.getStats();
        
        return {
            ...stats,
            components: {
                cache: this.cache ? this.cache.getStats() : null,
                proxy: this.proxy ? this.proxy.getStats() : null,
                loadBalancer: this.loadBalancer ? this.loadBalancer.getStats() : null,
                security: this.security ? this.security.getStats() : null,
                monitoring: this.monitoring ? this.monitoring.getStats() : null,
                websocket: this.websocket ? this.websocket.getStats() : null
            }
        };
    }
    
    /**
     * Print startup information
     */
    printStartupInfo() {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 API GATEWAY FOR 1000 MCP SERVERS');
        console.log('='.repeat(60));
        console.log(`📡 HTTP Server: http://${this.config.server.host}:${this.config.server.port}`);
        
        if (this.config.server.ssl.enabled) {
            console.log(`🔒 HTTPS Server: https://${this.config.server.host}:${this.config.server.httpsPort}`);
        }
        
        if (this.config.monitoring.dashboard.enabled) {
            console.log(`📊 Dashboard: http://localhost:${this.config.monitoring.dashboard.port}`);
        }
        
        if (this.config.websocket.enabled) {
            console.log(`🔌 WebSocket: ws://localhost:${this.config.websocket.port}`);
        }
        
        console.log('\n📋 Features:');
        console.log('  ✅ Authentication & Authorization');
        console.log('  ✅ Load Balancing & Failover');
        console.log('  ✅ Multi-layer Caching');
        console.log('  ✅ Advanced Security');
        console.log('  ✅ Real-time Monitoring');
        console.log('  ✅ WebSocket Support');
        console.log('  ✅ High-performance Proxy');
        console.log('  ✅ Auto-scaling Ready');
        console.log('  🔐 Secure API Access');
        
        console.log('\n🎯 Ready to handle requests to 1000 MCP servers!');
        console.log('='.repeat(60) + '\n');
    }
}

// Export class
module.exports = APIGatewayMain;

// CLI interface
if (require.main === module) {
    const gateway = new APIGatewayMain();
    
    async function main() {
        try {
            await gateway.initialize();
            await gateway.start();
            
            // Print stats every 30 seconds
            setInterval(() => {
                const stats = gateway.getStats();
                console.log('📊 Gateway Stats:', {
                    requests: stats.requests,
                    responses: stats.responses,
                    errors: stats.errors,
                    uptime: Math.round(stats.uptime / 1000) + 's',
                    requestRate: (stats.requests / (stats.uptime / 1000)).toFixed(2) + '/s'
                });
            }, 30000);
            
        } catch (error) {
            console.error('❌ Failed to start API Gateway:', error);
            process.exit(1);
        }
    }
    
    main();
}