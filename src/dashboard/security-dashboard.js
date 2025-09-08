// =============================================================================
// Enterprise Security Dashboard & Web Interface
// Git Memory MCP Server - Security System v2.0.0
// =============================================================================

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Import security components
const { SecurityAuditEngine } = require('../scripts/security-audit');
const { SecurityMonitor } = require('../scripts/security-monitor');
const { SecurityMetricsCollector } = require('../scripts/security-audit');
const { SecurityConfigManager } = require('../services/securityConfigManager');

// =============================================================================
// Security Dashboard Configuration
// =============================================================================

const DASHBOARD_CONFIG = {
    server: {
        port: process.env.SECURITY_DASHBOARD_PORT || 8443,
        host: process.env.SECURITY_DASHBOARD_HOST || '0.0.0.0',
        ssl: {
            enabled: process.env.SECURITY_DASHBOARD_SSL === 'true',
            cert: process.env.SECURITY_DASHBOARD_SSL_CERT,
            key: process.env.SECURITY_DASHBOARD_SSL_KEY
        }
    },
    auth: {
        jwtSecret: process.env.SECURITY_DASHBOARD_JWT_SECRET || 'your-super-secret-jwt-key',
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000 // 15 minutes
    },
    features: {
        realTimeMonitoring: true,
        auditReports: true,
        complianceTracking: true,
        threatIntelligence: true,
        userManagement: true,
        apiAccess: true
    },
    ui: {
        theme: 'dark',
        refreshInterval: 5000,
        maxLogEntries: 1000,
        chartDataPoints: 100
    }
};

// =============================================================================
// Security Dashboard Server
// =============================================================================

class SecurityDashboard {
    constructor(config = DASHBOARD_CONFIG) {
        this.config = config;
        this.app = express();
        this.server = null;
        this.io = null;
        
        // Security components
        this.auditEngine = new SecurityAuditEngine();
        this.securityMonitor = new SecurityMonitor();
        this.metricsCollector = new SecurityMetricsCollector();
        this.configManager = new SecurityConfigManager();
        
        // Dashboard state
        this.connectedClients = new Map();
        this.activeUsers = new Map();
        this.loginAttempts = new Map();
        this.realtimeData = {
            metrics: {},
            alerts: [],
            logs: [],
            threats: []
        };
        
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeWebSocket();
    }
    
    // =========================================================================
    // Middleware Setup
    // =========================================================================
    
    initializeMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
                    scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    connectSrc: ["'self'", 'ws:', 'wss:']
                }
            }
        }));
        
        // CORS configuration
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true
        }));
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP'
        });
        this.app.use('/api/', limiter);
        
        // Compression and logging
        this.app.use(compression());
        this.app.use(morgan('combined'));
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Static files
        this.app.use('/static', express.static(path.join(__dirname, 'public')));
    }
    
    // =========================================================================
    // Authentication Middleware
    // =========================================================================
    
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        
        jwt.verify(token, this.config.auth.jwtSecret, (err, user) => {
            if (err) {
                return res.status(403).json({ error: 'Invalid or expired token' });
            }
            req.user = user;
            next();
        });
    }
    
    checkPermission(permission) {
        return (req, res, next) => {
            if (!req.user.permissions.includes(permission) && !req.user.permissions.includes('admin')) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
            next();
        };
    }
    
    // =========================================================================
    // API Routes
    // =========================================================================
    
    initializeRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        });
        
        // Authentication routes
        this.app.post('/api/auth/login', this.handleLogin.bind(this));
        this.app.post('/api/auth/logout', this.authenticateToken.bind(this), this.handleLogout.bind(this));
        this.app.get('/api/auth/me', this.authenticateToken.bind(this), this.handleGetUser.bind(this));
        
        // Dashboard data routes
        this.app.get('/api/dashboard/overview', this.authenticateToken.bind(this), this.handleDashboardOverview.bind(this));
        this.app.get('/api/dashboard/metrics', this.authenticateToken.bind(this), this.handleMetrics.bind(this));
        this.app.get('/api/dashboard/alerts', this.authenticateToken.bind(this), this.handleAlerts.bind(this));
        this.app.get('/api/dashboard/logs', this.authenticateToken.bind(this), this.handleLogs.bind(this));
        
        // Security audit routes
        this.app.get('/api/audit/reports', this.authenticateToken.bind(this), this.checkPermission('audit:read'), this.handleAuditReports.bind(this));
        this.app.post('/api/audit/run', this.authenticateToken.bind(this), this.checkPermission('audit:execute'), this.handleRunAudit.bind(this));
        this.app.get('/api/audit/report/:id', this.authenticateToken.bind(this), this.checkPermission('audit:read'), this.handleGetAuditReport.bind(this));
        
        // Compliance routes
        this.app.get('/api/compliance/frameworks', this.authenticateToken.bind(this), this.handleComplianceFrameworks.bind(this));
        this.app.get('/api/compliance/status', this.authenticateToken.bind(this), this.handleComplianceStatus.bind(this));
        
        // Configuration routes
        this.app.get('/api/config/security', this.authenticateToken.bind(this), this.checkPermission('config:read'), this.handleGetSecurityConfig.bind(this));
        this.app.put('/api/config/security', this.authenticateToken.bind(this), this.checkPermission('config:write'), this.handleUpdateSecurityConfig.bind(this));
        
        // Threat intelligence routes
        this.app.get('/api/threats/current', this.authenticateToken.bind(this), this.handleCurrentThreats.bind(this));
        this.app.get('/api/threats/history', this.authenticateToken.bind(this), this.handleThreatHistory.bind(this));
        
        // User management routes
        this.app.get('/api/users', this.authenticateToken.bind(this), this.checkPermission('users:read'), this.handleGetUsers.bind(this));
        this.app.post('/api/users', this.authenticateToken.bind(this), this.checkPermission('users:create'), this.handleCreateUser.bind(this));
        this.app.put('/api/users/:id', this.authenticateToken.bind(this), this.checkPermission('users:update'), this.handleUpdateUser.bind(this));
        this.app.delete('/api/users/:id', this.authenticateToken.bind(this), this.checkPermission('users:delete'), this.handleDeleteUser.bind(this));
        
        // Main dashboard route
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });
        
        // Error handling
        this.app.use(this.handleError.bind(this));
    }
    
    // =========================================================================
    // Authentication Handlers
    // =========================================================================
    
    async handleLogin(req, res) {
        try {
            const { username, password } = req.body;
            const clientIp = req.ip;
            
            // Check for too many login attempts
            const attempts = this.loginAttempts.get(clientIp) || { count: 0, lastAttempt: 0 };
            if (attempts.count >= this.config.auth.maxLoginAttempts) {
                const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
                if (timeSinceLastAttempt < this.config.auth.lockoutDuration) {
                    return res.status(429).json({ 
                        error: 'Too many login attempts. Please try again later.',
                        lockoutRemaining: Math.ceil((this.config.auth.lockoutDuration - timeSinceLastAttempt) / 1000)
                    });
                } else {
                    // Reset attempts after lockout period
                    this.loginAttempts.delete(clientIp);
                }
            }
            
            // Validate credentials (in production, use proper user database)
            const user = await this.validateUser(username, password);
            if (!user) {
                // Record failed attempt
                attempts.count++;
                attempts.lastAttempt = Date.now();
                this.loginAttempts.set(clientIp, attempts);
                
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Clear failed attempts on successful login
            this.loginAttempts.delete(clientIp);
            
            // Generate JWT token
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username, 
                    permissions: user.permissions 
                },
                this.config.auth.jwtSecret,
                { expiresIn: '24h' }
            );
            
            // Store active session
            this.activeUsers.set(user.id, {
                ...user,
                loginTime: new Date(),
                lastActivity: new Date(),
                token
            });
            
            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    permissions: user.permissions
                }
            });
            
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleLogout(req, res) {
        try {
            this.activeUsers.delete(req.user.id);
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleGetUser(req, res) {
        try {
            const user = this.activeUsers.get(req.user.id);
            if (!user) {
                return res.status(401).json({ error: 'Session expired' });
            }
            
            // Update last activity
            user.lastActivity = new Date();
            
            res.json({
                id: user.id,
                username: user.username,
                permissions: user.permissions,
                loginTime: user.loginTime,
                lastActivity: user.lastActivity
            });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async validateUser(username, password) {
        // In production, this should query a proper user database
        const users = {
            'admin': {
                id: '1',
                username: 'admin',
                password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeGvGzjYwSY4VHGlIHyuP2Q7K9dq', // 'password'
                permissions: ['admin']
            },
            'security': {
                id: '2',
                username: 'security',
                password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeGvGzjYwSY4VHGlIHyuP2Q7K9dq', // 'password'
                permissions: ['audit:read', 'audit:execute', 'config:read', 'threats:read']
            },
            'viewer': {
                id: '3',
                username: 'viewer',
                password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeGvGzjYwSY4VHGlIHyuP2Q7K9dq', // 'password'
                permissions: ['audit:read', 'threats:read']
            }
        };
        
        const user = users[username];
        if (!user) return null;
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        return isValidPassword ? user : null;
    }
    
    // =========================================================================
    // Dashboard Data Handlers
    // =========================================================================
    
    async handleDashboardOverview(req, res) {
        try {
            const overview = {
                system: {
                    status: 'operational',
                    uptime: process.uptime(),
                    version: '2.0.0',
                    lastUpdate: new Date().toISOString()
                },
                security: {
                    threatLevel: 'low',
                    activeThreats: this.realtimeData.threats.length,
                    blockedIPs: 0,
                    failedLogins: Array.from(this.loginAttempts.values()).reduce((sum, attempts) => sum + attempts.count, 0)
                },
                audit: {
                    lastAuditTime: null,
                    complianceScore: 85,
                    criticalFindings: 0,
                    highFindings: 2
                },
                monitoring: {
                    activeAlerts: this.realtimeData.alerts.length,
                    logEntries: this.realtimeData.logs.length,
                    connectedClients: this.connectedClients.size
                }
            };
            
            res.json(overview);
        } catch (error) {
            console.error('Dashboard overview error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleMetrics(req, res) {
        try {
            const metrics = this.metricsCollector.getMetrics();
            res.json(metrics);
        } catch (error) {
            console.error('Metrics error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleAlerts(req, res) {
        try {
            const { limit = 50, severity, category } = req.query;
            let alerts = [...this.realtimeData.alerts];
            
            // Filter by severity
            if (severity) {
                alerts = alerts.filter(alert => alert.severity === severity);
            }
            
            // Filter by category
            if (category) {
                alerts = alerts.filter(alert => alert.category === category);
            }
            
            // Limit results
            alerts = alerts.slice(0, parseInt(limit));
            
            res.json(alerts);
        } catch (error) {
            console.error('Alerts error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleLogs(req, res) {
        try {
            const { limit = 100, level, source } = req.query;
            let logs = [...this.realtimeData.logs];
            
            // Filter by level
            if (level) {
                logs = logs.filter(log => log.level === level);
            }
            
            // Filter by source
            if (source) {
                logs = logs.filter(log => log.source === source);
            }
            
            // Limit results
            logs = logs.slice(0, parseInt(limit));
            
            res.json(logs);
        } catch (error) {
            console.error('Logs error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    // =========================================================================
    // Security Audit Handlers
    // =========================================================================
    
    async handleAuditReports(req, res) {
        try {
            // In production, this would query a database
            const reports = [];
            res.json(reports);
        } catch (error) {
            console.error('Audit reports error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleRunAudit(req, res) {
        try {
            const { type = 'full', frameworks = [] } = req.body;
            
            // Start audit in background
            const auditId = uuidv4();
            this.runAuditAsync(auditId, type, frameworks, req.user);
            
            res.json({ 
                message: 'Audit started', 
                auditId,
                estimatedDuration: '5-10 minutes'
            });
        } catch (error) {
            console.error('Run audit error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async runAuditAsync(auditId, type, frameworks, user) {
        try {
            console.log(`Starting ${type} audit ${auditId} by user ${user.username}`);
            
            // Emit audit started event
            this.io.emit('audit:started', { auditId, type, user: user.username });
            
            // Run the audit
            const report = await this.auditEngine.runFullAudit();
            report.audit.id = auditId;
            
            // Record metrics
            this.metricsCollector.recordAuditResults(report);
            
            // Emit audit completed event
            this.io.emit('audit:completed', { auditId, report });
            
            console.log(`Audit ${auditId} completed successfully`);
            
        } catch (error) {
            console.error(`Audit ${auditId} failed:`, error);
            this.io.emit('audit:failed', { auditId, error: error.message });
        }
    }
    
    async handleGetAuditReport(req, res) {
        try {
            const { id } = req.params;
            // In production, this would query a database
            res.status(404).json({ error: 'Report not found' });
        } catch (error) {
            console.error('Get audit report error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    // =========================================================================
    // WebSocket Setup
    // =========================================================================
    
    initializeWebSocket() {
        this.io = socketIo(this.server, {
            cors: {
                origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
                methods: ['GET', 'POST']
            }
        });
        
        // Authentication middleware for WebSocket
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }
            
            jwt.verify(token, this.config.auth.jwtSecret, (err, user) => {
                if (err) {
                    return next(new Error('Authentication error'));
                }
                socket.user = user;
                next();
            });
        });
        
        this.io.on('connection', (socket) => {
            console.log(`User ${socket.user.username} connected to dashboard`);
            
            // Store connected client
            this.connectedClients.set(socket.id, {
                user: socket.user,
                connectedAt: new Date(),
                socket
            });
            
            // Send initial data
            socket.emit('dashboard:init', {
                metrics: this.realtimeData.metrics,
                alerts: this.realtimeData.alerts.slice(0, 10),
                logs: this.realtimeData.logs.slice(0, 50)
            });
            
            // Handle client events
            socket.on('dashboard:subscribe', (channels) => {
                channels.forEach(channel => {
                    socket.join(channel);
                });
            });
            
            socket.on('dashboard:unsubscribe', (channels) => {
                channels.forEach(channel => {
                    socket.leave(channel);
                });
            });
            
            socket.on('disconnect', () => {
                console.log(`User ${socket.user.username} disconnected from dashboard`);
                this.connectedClients.delete(socket.id);
            });
        });
        
        // Start real-time data broadcasting
        this.startRealtimeBroadcast();
    }
    
    startRealtimeBroadcast() {
        setInterval(() => {
            // Broadcast metrics updates
            this.io.to('metrics').emit('metrics:update', this.realtimeData.metrics);
            
            // Broadcast new alerts
            if (this.realtimeData.alerts.length > 0) {
                this.io.to('alerts').emit('alerts:new', this.realtimeData.alerts.slice(-5));
            }
            
            // Broadcast new logs
            if (this.realtimeData.logs.length > 0) {
                this.io.to('logs').emit('logs:new', this.realtimeData.logs.slice(-10));
            }
            
        }, this.config.ui.refreshInterval);
    }
    
    // =========================================================================
    // Additional Handlers (Compliance, Config, Threats, Users)
    // =========================================================================
    
    async handleComplianceFrameworks(req, res) {
        try {
            const frameworks = [
                { id: 'soc2', name: 'SOC 2', description: 'Service Organization Control 2' },
                { id: 'iso27001', name: 'ISO 27001', description: 'Information Security Management' },
                { id: 'gdpr', name: 'GDPR', description: 'General Data Protection Regulation' },
                { id: 'hipaa', name: 'HIPAA', description: 'Health Insurance Portability and Accountability Act' },
                { id: 'pci', name: 'PCI DSS', description: 'Payment Card Industry Data Security Standard' }
            ];
            res.json(frameworks);
        } catch (error) {
            console.error('Compliance frameworks error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleComplianceStatus(req, res) {
        try {
            const status = {
                overall: 85,
                frameworks: {
                    soc2: { score: 90, status: 'compliant', lastAssessment: '2024-01-15' },
                    iso27001: { score: 88, status: 'compliant', lastAssessment: '2024-01-10' },
                    gdpr: { score: 82, status: 'partial', lastAssessment: '2024-01-12' },
                    hipaa: { score: 75, status: 'non-compliant', lastAssessment: '2024-01-08' },
                    pci: { score: 95, status: 'compliant', lastAssessment: '2024-01-18' }
                }
            };
            res.json(status);
        } catch (error) {
            console.error('Compliance status error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleGetSecurityConfig(req, res) {
        try {
            const config = await this.configManager.getConfiguration();
            res.json(config);
        } catch (error) {
            console.error('Get security config error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleUpdateSecurityConfig(req, res) {
        try {
            const updates = req.body;
            await this.configManager.updateConfiguration(updates);
            res.json({ message: 'Configuration updated successfully' });
        } catch (error) {
            console.error('Update security config error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleCurrentThreats(req, res) {
        try {
            res.json(this.realtimeData.threats);
        } catch (error) {
            console.error('Current threats error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleThreatHistory(req, res) {
        try {
            const { limit = 100, severity, type } = req.query;
            // In production, this would query a database
            const history = [];
            res.json(history);
        } catch (error) {
            console.error('Threat history error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleGetUsers(req, res) {
        try {
            // In production, this would query a user database
            const users = [
                { id: '1', username: 'admin', permissions: ['admin'], lastLogin: new Date() },
                { id: '2', username: 'security', permissions: ['audit:read', 'audit:execute'], lastLogin: new Date() },
                { id: '3', username: 'viewer', permissions: ['audit:read'], lastLogin: new Date() }
            ];
            res.json(users);
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleCreateUser(req, res) {
        try {
            const { username, password, permissions } = req.body;
            // In production, this would create a user in the database
            res.json({ message: 'User created successfully', id: uuidv4() });
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleUpdateUser(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            // In production, this would update the user in the database
            res.json({ message: 'User updated successfully' });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async handleDeleteUser(req, res) {
        try {
            const { id } = req.params;
            // In production, this would delete the user from the database
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    // =========================================================================
    // Error Handling
    // =========================================================================
    
    handleError(err, req, res, next) {
        console.error('Dashboard error:', err);
        
        if (err.name === 'ValidationError') {
            return res.status(400).json({ error: 'Validation error', details: err.message });
        }
        
        if (err.name === 'UnauthorizedError') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
    
    // =========================================================================
    // Server Management
    // =========================================================================
    
    async start() {
        try {
            // Initialize security components
            await this.configManager.initialize();
            
            // Create HTTP server
            this.server = http.createServer(this.app);
            
            // Initialize WebSocket after server creation
            this.initializeWebSocket();
            
            // Start server
            this.server.listen(this.config.server.port, this.config.server.host, () => {
                console.log(`🛡️ Security Dashboard started on ${this.config.server.host}:${this.config.server.port}`);
                console.log(`📊 Dashboard URL: http://${this.config.server.host}:${this.config.server.port}`);
                console.log(`🔐 Default credentials: admin/password`);
            });
            
            // Start monitoring
            this.startMonitoring();
            
        } catch (error) {
            console.error('Failed to start security dashboard:', error);
            process.exit(1);
        }
    }
    
    async stop() {
        try {
            if (this.server) {
                this.server.close();
                console.log('🛡️ Security Dashboard stopped');
            }
        } catch (error) {
            console.error('Error stopping security dashboard:', error);
        }
    }
    
    startMonitoring() {
        // Simulate real-time data updates
        setInterval(() => {
            this.updateRealtimeData();
        }, 5000);
        
        // Clean up old data
        setInterval(() => {
            this.cleanupOldData();
        }, 60000);
    }
    
    updateRealtimeData() {
        // Update metrics
        this.realtimeData.metrics = {
            timestamp: new Date().toISOString(),
            cpu: Math.random() * 100,
            memory: Math.random() * 100,
            disk: Math.random() * 100,
            network: Math.random() * 1000,
            activeConnections: this.connectedClients.size,
            requestsPerSecond: Math.floor(Math.random() * 100)
        };
        
        // Occasionally add alerts
        if (Math.random() < 0.1) {
            this.realtimeData.alerts.push({
                id: uuidv4(),
                timestamp: new Date().toISOString(),
                severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
                category: 'security',
                title: 'Sample Security Alert',
                description: 'This is a sample security alert for demonstration purposes',
                source: 'security-monitor'
            });
        }
        
        // Add log entries
        this.realtimeData.logs.push({
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            level: ['info', 'warn', 'error'][Math.floor(Math.random() * 3)],
            source: 'dashboard',
            message: 'Sample log entry',
            metadata: {}
        });
    }
    
    cleanupOldData() {
        // Keep only recent alerts
        this.realtimeData.alerts = this.realtimeData.alerts.slice(-this.config.ui.maxLogEntries);
        
        // Keep only recent logs
        this.realtimeData.logs = this.realtimeData.logs.slice(-this.config.ui.maxLogEntries);
        
        // Clean up expired login attempts
        const now = Date.now();
        for (const [ip, attempts] of this.loginAttempts.entries()) {
            if (now - attempts.lastAttempt > this.config.auth.lockoutDuration) {
                this.loginAttempts.delete(ip);
            }
        }
    }
}

// =============================================================================
// Export and CLI Entry Point
// =============================================================================

module.exports = {
    SecurityDashboard,
    DASHBOARD_CONFIG
};

// CLI Entry Point
if (require.main === module) {
    const dashboard = new SecurityDashboard();
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down Security Dashboard...');
        await dashboard.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Shutting down Security Dashboard...');
        await dashboard.stop();
        process.exit(0);
    });
    
    // Start dashboard
    dashboard.start().catch(error => {
        console.error('Failed to start Security Dashboard:', error);
        process.exit(1);
    });
}