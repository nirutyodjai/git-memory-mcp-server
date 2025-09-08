/**
 * Enterprise Security Integration System
 * รวมระบบความปลอดภัยทั้งหมดเข้าด้วยกัน
 * 
 * Features:
 * - Multi-tenant Security Architecture
 * - JWT & API Key Authentication
 * - Role-Based Access Control (RBAC)
 * - Real-time Security Monitoring
 * - Audit Logging & Compliance
 * - Threat Detection & Response
 * - Security Configuration Management
 * - Performance Monitoring
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { EventEmitter } = require('events');

// Import Security Components
const AuthMiddleware = require('../middleware/authMiddleware');
const SecurityMiddleware = require('../middleware/securityMiddleware');
const UserService = require('../services/userService');
const AuditService = require('../services/auditService');
const MonitoringService = require('../services/monitoringService');
const SecurityConfig = require('../config/security-config');
const SecurityConfigManager = require('../services/securityConfigManager');
const SecurityIntegrationService = require('../services/securityIntegrationService');

// Import Routes
const securityRoutes = require('../routes/securityRoutes');
const securityAPI = require('../routes/securityAPI');
const securityDashboard = require('../routes/securityDashboard');

class EnterpriseSecuritySystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            port: options.port || 3333,
            host: options.host || 'localhost',
            environment: options.environment || 'development',
            enableDashboard: options.enableDashboard !== false,
            enableAPI: options.enableAPI !== false,
            enableMonitoring: options.enableMonitoring !== false,
            enableAudit: options.enableAudit !== false,
            enableTesting: options.enableTesting !== false,
            ...options
        };
        
        this.app = express();
        this.server = null;
        this.services = {};
        this.middleware = {};
        this.isInitialized = false;
        this.isRunning = false;
        
        this.logger = console; // Replace with proper logger
        
        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.restart = this.restart.bind(this);
    }
    
    /**
     * Initialize Security System
     */
    async initialize() {
        try {
            this.logger.info('🔐 Initializing Enterprise Security System...');
            
            // Initialize Security Configuration
            await this.initializeSecurityConfig();
            
            // Initialize Services
            await this.initializeServices();
            
            // Initialize Middleware
            await this.initializeMiddleware();
            
            // Setup Express App
            await this.setupExpressApp();
            
            // Setup Routes
            await this.setupRoutes();
            
            // Setup Event Listeners
            await this.setupEventListeners();
            
            // Initialize Monitoring
            if (this.options.enableMonitoring) {
                await this.initializeMonitoring();
            }
            
            // Initialize Audit System
            if (this.options.enableAudit) {
                await this.initializeAuditSystem();
            }
            
            this.isInitialized = true;
            this.logger.info('✅ Enterprise Security System initialized successfully');
            
            this.emit('initialized');
            
        } catch (error) {
            this.logger.error('❌ Failed to initialize Security System:', error);
            throw error;
        }
    }
    
    /**
     * Initialize Security Configuration
     */
    async initializeSecurityConfig() {
        this.logger.info('📋 Initializing Security Configuration...');
        
        // Initialize Security Config Manager
        this.services.configManager = new SecurityConfigManager({
            environment: this.options.environment,
            configPath: this.options.configPath
        });
        
        await this.services.configManager.initialize();
        
        // Get current security configuration
        this.securityConfig = await this.services.configManager.getConfiguration();
        
        this.logger.info('✅ Security Configuration initialized');
    }
    
    /**
     * Initialize Services
     */
    async initializeServices() {
        this.logger.info('🔧 Initializing Security Services...');
        
        // Initialize User Service
        this.services.userService = new UserService({
            config: this.securityConfig,
            environment: this.options.environment
        });
        await this.services.userService.initialize();
        
        // Initialize Audit Service
        this.services.auditService = new AuditService({
            config: this.securityConfig,
            environment: this.options.environment
        });
        await this.services.auditService.initialize();
        
        // Initialize Monitoring Service
        this.services.monitoringService = new MonitoringService({
            config: this.securityConfig,
            environment: this.options.environment
        });
        await this.services.monitoringService.initialize();
        
        // Initialize Security Integration Service
        this.services.integrationService = new SecurityIntegrationService({
            userService: this.services.userService,
            auditService: this.services.auditService,
            monitoringService: this.services.monitoringService,
            configManager: this.services.configManager,
            config: this.securityConfig
        });
        await this.services.integrationService.initialize();
        
        this.logger.info('✅ Security Services initialized');
    }
    
    /**
     * Initialize Middleware
     */
    async initializeMiddleware() {
        this.logger.info('🛡️ Initializing Security Middleware...');
        
        // Initialize Auth Middleware
        this.middleware.auth = new AuthMiddleware({
            userService: this.services.userService,
            auditService: this.services.auditService,
            config: this.securityConfig
        });
        
        // Initialize Security Middleware
        this.middleware.security = new SecurityMiddleware({
            auditService: this.services.auditService,
            monitoringService: this.services.monitoringService,
            config: this.securityConfig
        });
        
        this.logger.info('✅ Security Middleware initialized');
    }
    
    /**
     * Setup Express Application
     */
    async setupExpressApp() {
        this.logger.info('🚀 Setting up Express Application...');
        
        // Basic middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"]
                }
            },
            crossOriginEmbedderPolicy: false
        }));
        
        this.app.use(cors({
            origin: this.securityConfig.cors?.allowedOrigins || ['http://localhost:3000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Tenant-ID']
        }));
        
        this.app.use(compression());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: this.securityConfig.rateLimiting?.maxRequests || 1000,
            message: {
                error: 'Too many requests',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false
        });
        
        this.app.use(limiter);
        
        // Security middleware
        this.app.use(this.middleware.security.securityHeaders());
        this.app.use(this.middleware.security.requestValidation());
        this.app.use(this.middleware.security.auditLogging());
        
        this.logger.info('✅ Express Application configured');
    }
    
    /**
     * Setup Routes
     */
    async setupRoutes() {
        this.logger.info('🛣️ Setting up Security Routes...');
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                services: {
                    userService: this.services.userService ? 'running' : 'stopped',
                    auditService: this.services.auditService ? 'running' : 'stopped',
                    monitoringService: this.services.monitoringService ? 'running' : 'stopped',
                    integrationService: this.services.integrationService ? 'running' : 'stopped'
                }
            });
        });
        
        // Security API Routes
        if (this.options.enableAPI) {
            this.app.use('/api/security', securityAPI({
                userService: this.services.userService,
                auditService: this.services.auditService,
                monitoringService: this.services.monitoringService,
                configManager: this.services.configManager,
                authMiddleware: this.middleware.auth
            }));
        }
        
        // Security Dashboard
        if (this.options.enableDashboard) {
            this.app.use('/dashboard', securityDashboard({
                userService: this.services.userService,
                auditService: this.services.auditService,
                monitoringService: this.services.monitoringService,
                configManager: this.services.configManager
            }));
        }
        
        // Main Security Routes
        this.app.use('/security', securityRoutes({
            userService: this.services.userService,
            auditService: this.services.auditService,
            monitoringService: this.services.monitoringService,
            configManager: this.services.configManager,
            authMiddleware: this.middleware.auth,
            securityMiddleware: this.middleware.security
        }));
        
        // Error handling
        this.app.use((error, req, res, next) => {
            this.logger.error('Security System Error:', error);
            
            // Log security event
            if (this.services.auditService) {
                this.services.auditService.logSecurityEvent({
                    type: 'system_error',
                    severity: 'high',
                    source: 'security_system',
                    details: {
                        error: error.message,
                        stack: error.stack,
                        url: req.url,
                        method: req.method,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    },
                    timestamp: new Date().toISOString()
                });
            }
            
            res.status(500).json({
                error: 'Internal Security System Error',
                message: this.options.environment === 'development' ? error.message : 'An error occurred',
                timestamp: new Date().toISOString()
            });
        });
        
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.originalUrl,
                timestamp: new Date().toISOString()
            });
        });
        
        this.logger.info('✅ Security Routes configured');
    }
    
    /**
     * Setup Event Listeners
     */
    async setupEventListeners() {
        this.logger.info('📡 Setting up Event Listeners...');
        
        // Listen to service events
        if (this.services.integrationService) {
            this.services.integrationService.on('security_event', (event) => {
                this.emit('security_event', event);
            });
            
            this.services.integrationService.on('threat_detected', (threat) => {
                this.emit('threat_detected', threat);
                this.logger.warn('🚨 Threat detected:', threat);
            });
            
            this.services.integrationService.on('compliance_violation', (violation) => {
                this.emit('compliance_violation', violation);
                this.logger.warn('⚠️ Compliance violation:', violation);
            });
        }
        
        // Process events
        process.on('SIGTERM', () => {
            this.logger.info('📴 Received SIGTERM, shutting down gracefully...');
            this.stop();
        });
        
        process.on('SIGINT', () => {
            this.logger.info('📴 Received SIGINT, shutting down gracefully...');
            this.stop();
        });
        
        this.logger.info('✅ Event Listeners configured');
    }
    
    /**
     * Initialize Monitoring
     */
    async initializeMonitoring() {
        this.logger.info('📊 Initializing Security Monitoring...');
        
        // Start monitoring services
        if (this.services.monitoringService) {
            await this.services.monitoringService.startMonitoring();
        }
        
        this.logger.info('✅ Security Monitoring initialized');
    }
    
    /**
     * Initialize Audit System
     */
    async initializeAuditSystem() {
        this.logger.info('📝 Initializing Audit System...');
        
        // Start audit logging
        if (this.services.auditService) {
            await this.services.auditService.startAuditLogging();
        }
        
        this.logger.info('✅ Audit System initialized');
    }
    
    /**
     * Start Security System
     */
    async start() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            
            if (this.isRunning) {
                this.logger.warn('⚠️ Security System is already running');
                return;
            }
            
            this.logger.info(`🚀 Starting Enterprise Security System on ${this.options.host}:${this.options.port}...`);
            
            this.server = this.app.listen(this.options.port, this.options.host, () => {
                this.isRunning = true;
                this.logger.info(`✅ Enterprise Security System started successfully`);
                this.logger.info(`🔐 Security Dashboard: http://${this.options.host}:${this.options.port}/dashboard`);
                this.logger.info(`🔌 Security API: http://${this.options.host}:${this.options.port}/api/security`);
                this.logger.info(`❤️ Health Check: http://${this.options.host}:${this.options.port}/health`);
                
                this.emit('started');
            });
            
            // Handle server errors
            this.server.on('error', (error) => {
                this.logger.error('❌ Server error:', error);
                this.emit('error', error);
            });
            
        } catch (error) {
            this.logger.error('❌ Failed to start Security System:', error);
            throw error;
        }
    }
    
    /**
     * Stop Security System
     */
    async stop() {
        try {
            if (!this.isRunning) {
                this.logger.warn('⚠️ Security System is not running');
                return;
            }
            
            this.logger.info('📴 Stopping Enterprise Security System...');
            
            // Stop services
            if (this.services.monitoringService) {
                await this.services.monitoringService.stopMonitoring();
            }
            
            if (this.services.auditService) {
                await this.services.auditService.stopAuditLogging();
            }
            
            // Close server
            if (this.server) {
                await new Promise((resolve) => {
                    this.server.close(resolve);
                });
            }
            
            this.isRunning = false;
            this.logger.info('✅ Enterprise Security System stopped successfully');
            
            this.emit('stopped');
            
        } catch (error) {
            this.logger.error('❌ Failed to stop Security System:', error);
            throw error;
        }
    }
    
    /**
     * Restart Security System
     */
    async restart() {
        this.logger.info('🔄 Restarting Enterprise Security System...');
        
        await this.stop();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        await this.start();
        
        this.logger.info('✅ Enterprise Security System restarted successfully');
    }
    
    /**
     * Get System Status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            running: this.isRunning,
            port: this.options.port,
            host: this.options.host,
            environment: this.options.environment,
            services: {
                userService: this.services.userService ? 'active' : 'inactive',
                auditService: this.services.auditService ? 'active' : 'inactive',
                monitoringService: this.services.monitoringService ? 'active' : 'inactive',
                integrationService: this.services.integrationService ? 'active' : 'inactive',
                configManager: this.services.configManager ? 'active' : 'inactive'
            },
            middleware: {
                auth: this.middleware.auth ? 'active' : 'inactive',
                security: this.middleware.security ? 'active' : 'inactive'
            },
            uptime: this.isRunning ? process.uptime() : 0,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Get Security Metrics
     */
    async getSecurityMetrics() {
        const metrics = {
            system: this.getStatus(),
            security: {},
            performance: {},
            audit: {},
            timestamp: new Date().toISOString()
        };
        
        // Get security metrics from monitoring service
        if (this.services.monitoringService) {
            metrics.security = await this.services.monitoringService.getSecurityMetrics();
            metrics.performance = await this.services.monitoringService.getPerformanceMetrics();
        }
        
        // Get audit metrics
        if (this.services.auditService) {
            metrics.audit = await this.services.auditService.getAuditMetrics();
        }
        
        return metrics;
    }
}

// Export the main class
module.exports = EnterpriseSecuritySystem;

// Export factory function for easy usage
module.exports.createSecuritySystem = (options = {}) => {
    return new EnterpriseSecuritySystem(options);
};

// Export individual components for advanced usage
module.exports.components = {
    AuthMiddleware,
    SecurityMiddleware,
    UserService,
    AuditService,
    MonitoringService,
    SecurityConfig,
    SecurityConfigManager,
    SecurityIntegrationService
};

// Example usage and startup script
if (require.main === module) {
    const securitySystem = new EnterpriseSecuritySystem({
        port: process.env.SECURITY_PORT || 3333,
        host: process.env.SECURITY_HOST || 'localhost',
        environment: process.env.NODE_ENV || 'development',
        enableDashboard: true,
        enableAPI: true,
        enableMonitoring: true,
        enableAudit: true
    });
    
    // Start the security system
    securitySystem.start().catch((error) => {
        console.error('❌ Failed to start Enterprise Security System:', error);
        process.exit(1);
    });
    
    // Log security events
    securitySystem.on('security_event', (event) => {
        console.log('🔐 Security Event:', event);
    });
    
    securitySystem.on('threat_detected', (threat) => {
        console.log('🚨 Threat Detected:', threat);
    });
    
    securitySystem.on('compliance_violation', (violation) => {
        console.log('⚠️ Compliance Violation:', violation);
    });
}