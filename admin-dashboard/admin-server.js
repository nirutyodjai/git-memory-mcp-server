/**
 * Admin Dashboard Server
 * Central administration interface for NEXUS IDE
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoose = require('mongoose');
const path = require('path');
const { User } = require('../auth-system/models/User');
const { TenantManager } = require('../multi-tenancy/tenant-manager');
const { dataIsolationManager } = require('../multi-tenancy/data-isolation');
const { BillingManager } = require('../billing-system/billing-server');

class AdminDashboardServer {
    constructor(options = {}) {
        this.app = express();
        this.port = options.port || process.env.ADMIN_PORT || 3004;
        this.host = options.host || process.env.ADMIN_HOST || 'localhost';
        this.server = null;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    
    /**
     * Setup middleware
     */
    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"]
                }
            },
            crossOriginEmbedderPolicy: false
        }));
        
        // CORS configuration
        this.app.use(cors({
            origin: (origin, callback) => {
                const allowedOrigins = [
                    /^https?:\/\/localhost(:\d+)?$/,
                    /^https?:\/\/admin\.nexus-ide\.com$/,
                    /^https?:\/\/nexus-ide\.com$/
                ];
                
                if (!origin || allowedOrigins.some(pattern => pattern.test(origin))) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true
        }));
        
        // Rate limiting for admin (more restrictive)
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 500, // limit each IP to 500 requests per windowMs
            message: {
                error: 'Too many admin requests from this IP',
                code: 'ADMIN_RATE_LIMIT_EXCEEDED'
            }
        });
        this.app.use(limiter);
        
        // Body parsing
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
        // Compression
        this.app.use(compression());
        
        // Static files for dashboard
        this.app.use('/static', express.static(path.join(__dirname, 'public')));
        
        // Admin authentication middleware
        this.app.use('/api/admin', this.requireAdminAuth.bind(this));
        
        // Request logging
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                console.log(`[ADMIN] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
            });
            next();
        });
    }
    
    /**
     * Admin authentication middleware
     */
    async requireAdminAuth(req, res, next) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return res.status(401).json({
                    error: 'Admin authentication required',
                    code: 'ADMIN_AUTH_REQUIRED'
                });
            }
            
            // Verify JWT token (implement your JWT verification logic)
            const decoded = this.verifyJWT(token);
            const user = await User.findById(decoded.userId);
            
            if (!user || !user.permissions.roles.includes('admin') && !user.permissions.roles.includes('super_admin')) {
                return res.status(403).json({
                    error: 'Admin access required',
                    code: 'ADMIN_ACCESS_DENIED'
                });
            }
            
            req.admin = user;
            next();
        } catch (error) {
            console.error('Admin auth error:', error);
            res.status(401).json({
                error: 'Invalid admin token',
                code: 'INVALID_ADMIN_TOKEN'
            });
        }
    }
    
    /**
     * Verify JWT token (placeholder - implement your JWT logic)
     */
    verifyJWT(token) {
        // Implement JWT verification
        // This is a placeholder - use your actual JWT library
        try {
            const jwt = require('jsonwebtoken');
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
    
    /**
     * Setup routes
     */
    setupRoutes() {
        // Serve admin dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'admin-dashboard-server',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });
        
        // Admin API routes
        this.setupUserManagementRoutes();
        this.setupTenantManagementRoutes();
        this.setupBillingManagementRoutes();
        this.setupSystemMonitoringRoutes();
        this.setupAnalyticsRoutes();
        this.setupConfigurationRoutes();
    }
    
    /**
     * Setup user management routes
     */
    setupUserManagementRoutes() {
        const router = express.Router();
        
        // Get all users with pagination
        router.get('/users', async (req, res) => {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 50;
                const search = req.query.search || '';
                const status = req.query.status;
                const tier = req.query.tier;
                
                const query = {};
                
                if (search) {
                    query.$or = [
                        { email: { $regex: search, $options: 'i' } },
                        { 'profile.firstName': { $regex: search, $options: 'i' } },
                        { 'profile.lastName': { $regex: search, $options: 'i' } }
                    ];
                }
                
                if (status) {
                    query['account.status'] = status;
                }
                
                if (tier) {
                    query['subscription.tier'] = tier;
                }
                
                const users = await User.find(query)
                    .select('-password -twoFactor.secret')
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .skip((page - 1) * limit);
                
                const total = await User.countDocuments(query);
                
                res.json({
                    success: true,
                    users,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                });
            } catch (error) {
                console.error('Error getting users:', error);
                res.status(500).json({
                    error: 'Failed to get users',
                    code: 'USER_FETCH_FAILED'
                });
            }
        });
        
        // Get user details
        router.get('/users/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const user = await User.findById(userId).select('-password -twoFactor.secret');
                
                if (!user) {
                    return res.status(404).json({
                        error: 'User not found',
                        code: 'USER_NOT_FOUND'
                    });
                }
                
                // Get user's tenants
                const tenants = await TenantManager.getUserTenants(userId);
                
                // Get billing information
                const billingInfo = await BillingManager.getUserBillingInfo(userId);
                
                res.json({
                    success: true,
                    user: {
                        ...user.toObject(),
                        tenants: tenants.map(t => ({
                            tenantId: t.tenantId,
                            name: t.name,
                            role: t.getMemberRole(userId),
                            status: t.status
                        })),
                        billing: billingInfo
                    }
                });
            } catch (error) {
                console.error('Error getting user details:', error);
                res.status(500).json({
                    error: 'Failed to get user details',
                    code: 'USER_DETAILS_FAILED'
                });
            }
        });
        
        // Update user status
        router.patch('/users/:userId/status', async (req, res) => {
            try {
                const { userId } = req.params;
                const { status, reason } = req.body;
                
                const user = await User.findById(userId);
                if (!user) {
                    return res.status(404).json({
                        error: 'User not found',
                        code: 'USER_NOT_FOUND'
                    });
                }
                
                user.account.status = status;
                if (reason) {
                    user.account.statusReason = reason;
                }
                user.account.statusUpdatedAt = new Date();
                user.account.statusUpdatedBy = req.admin._id;
                
                await user.save();
                
                res.json({
                    success: true,
                    message: 'User status updated successfully'
                });
            } catch (error) {
                console.error('Error updating user status:', error);
                res.status(500).json({
                    error: 'Failed to update user status',
                    code: 'USER_STATUS_UPDATE_FAILED'
                });
            }
        });
        
        // Update user subscription
        router.patch('/users/:userId/subscription', async (req, res) => {
            try {
                const { userId } = req.params;
                const { tier, features, limits } = req.body;
                
                const user = await User.findById(userId);
                if (!user) {
                    return res.status(404).json({
                        error: 'User not found',
                        code: 'USER_NOT_FOUND'
                    });
                }
                
                if (tier) user.subscription.tier = tier;
                if (features) user.subscription.features = features;
                if (limits) user.subscription.limits = limits;
                
                await user.save();
                
                res.json({
                    success: true,
                    message: 'User subscription updated successfully'
                });
            } catch (error) {
                console.error('Error updating user subscription:', error);
                res.status(500).json({
                    error: 'Failed to update user subscription',
                    code: 'USER_SUBSCRIPTION_UPDATE_FAILED'
                });
            }
        });
        
        this.app.use('/api/admin', router);
    }
    
    /**
     * Setup tenant management routes
     */
    setupTenantManagementRoutes() {
        const router = express.Router();
        
        // Get all tenants
        router.get('/tenants', async (req, res) => {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 50;
                const search = req.query.search || '';
                const status = req.query.status;
                const type = req.query.type;
                
                const Tenant = mongoose.model('Tenant');
                const query = {};
                
                if (search) {
                    query.$or = [
                        { name: { $regex: search, $options: 'i' } },
                        { domain: { $regex: search, $options: 'i' } },
                        { subdomain: { $regex: search, $options: 'i' } }
                    ];
                }
                
                if (status) query.status = status;
                if (type) query.type = type;
                
                const tenants = await Tenant.find(query)
                    .populate('members.userId', 'email profile')
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .skip((page - 1) * limit);
                
                const total = await Tenant.countDocuments(query);
                
                res.json({
                    success: true,
                    tenants: tenants.map(tenant => ({
                        tenantId: tenant.tenantId,
                        name: tenant.name,
                        domain: tenant.domain,
                        subdomain: tenant.subdomain,
                        type: tenant.type,
                        status: tenant.status,
                        memberCount: tenant.members.length,
                        usage: tenant.usage,
                        subscription: tenant.subscription,
                        createdAt: tenant.createdAt,
                        updatedAt: tenant.updatedAt
                    })),
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                });
            } catch (error) {
                console.error('Error getting tenants:', error);
                res.status(500).json({
                    error: 'Failed to get tenants',
                    code: 'TENANT_FETCH_FAILED'
                });
            }
        });
        
        // Get tenant analytics
        router.get('/tenants/:tenantId/analytics', async (req, res) => {
            try {
                const { tenantId } = req.params;
                const analytics = await TenantManager.getTenantAnalytics(tenantId);
                const dataStats = await dataIsolationManager.getTenantDataStats(tenantId);
                
                res.json({
                    success: true,
                    analytics: {
                        ...analytics,
                        dataStats
                    }
                });
            } catch (error) {
                console.error('Error getting tenant analytics:', error);
                res.status(500).json({
                    error: 'Failed to get tenant analytics',
                    code: 'TENANT_ANALYTICS_FAILED'
                });
            }
        });
        
        // Suspend/unsuspend tenant
        router.patch('/tenants/:tenantId/status', async (req, res) => {
            try {
                const { tenantId } = req.params;
                const { status, reason } = req.body;
                
                const Tenant = mongoose.model('Tenant');
                const tenant = await Tenant.findOne({ tenantId });
                
                if (!tenant) {
                    return res.status(404).json({
                        error: 'Tenant not found',
                        code: 'TENANT_NOT_FOUND'
                    });
                }
                
                tenant.status = status;
                if (reason) {
                    tenant.metadata.statusReason = reason;
                }
                tenant.metadata.statusUpdatedAt = new Date();
                tenant.metadata.statusUpdatedBy = req.admin._id;
                
                await tenant.save();
                
                res.json({
                    success: true,
                    message: 'Tenant status updated successfully'
                });
            } catch (error) {
                console.error('Error updating tenant status:', error);
                res.status(500).json({
                    error: 'Failed to update tenant status',
                    code: 'TENANT_STATUS_UPDATE_FAILED'
                });
            }
        });
        
        this.app.use('/api/admin', router);
    }
    
    /**
     * Setup billing management routes
     */
    setupBillingManagementRoutes() {
        const router = express.Router();
        
        // Get billing overview
        router.get('/billing/overview', async (req, res) => {
            try {
                const overview = await BillingManager.getBillingOverview();
                res.json({
                    success: true,
                    overview
                });
            } catch (error) {
                console.error('Error getting billing overview:', error);
                res.status(500).json({
                    error: 'Failed to get billing overview',
                    code: 'BILLING_OVERVIEW_FAILED'
                });
            }
        });
        
        // Get subscription analytics
        router.get('/billing/analytics', async (req, res) => {
            try {
                const analytics = await BillingManager.getSubscriptionAnalytics();
                res.json({
                    success: true,
                    analytics
                });
            } catch (error) {
                console.error('Error getting subscription analytics:', error);
                res.status(500).json({
                    error: 'Failed to get subscription analytics',
                    code: 'SUBSCRIPTION_ANALYTICS_FAILED'
                });
            }
        });
        
        this.app.use('/api/admin', router);
    }
    
    /**
     * Setup system monitoring routes
     */
    setupSystemMonitoringRoutes() {
        const router = express.Router();
        
        // Get system health
        router.get('/system/health', async (req, res) => {
            try {
                const health = await this.getSystemHealth();
                res.json({
                    success: true,
                    health
                });
            } catch (error) {
                console.error('Error getting system health:', error);
                res.status(500).json({
                    error: 'Failed to get system health',
                    code: 'SYSTEM_HEALTH_FAILED'
                });
            }
        });
        
        // Get system metrics
        router.get('/system/metrics', async (req, res) => {
            try {
                const metrics = await this.getSystemMetrics();
                res.json({
                    success: true,
                    metrics
                });
            } catch (error) {
                console.error('Error getting system metrics:', error);
                res.status(500).json({
                    error: 'Failed to get system metrics',
                    code: 'SYSTEM_METRICS_FAILED'
                });
            }
        });
        
        this.app.use('/api/admin', router);
    }
    
    /**
     * Setup analytics routes
     */
    setupAnalyticsRoutes() {
        const router = express.Router();
        
        // Get platform analytics
        router.get('/analytics/platform', async (req, res) => {
            try {
                const analytics = await this.getPlatformAnalytics();
                res.json({
                    success: true,
                    analytics
                });
            } catch (error) {
                console.error('Error getting platform analytics:', error);
                res.status(500).json({
                    error: 'Failed to get platform analytics',
                    code: 'PLATFORM_ANALYTICS_FAILED'
                });
            }
        });
        
        this.app.use('/api/admin', router);
    }
    
    /**
     * Setup configuration routes
     */
    setupConfigurationRoutes() {
        const router = express.Router();
        
        // Get system configuration
        router.get('/config', async (req, res) => {
            try {
                const config = await this.getSystemConfiguration();
                res.json({
                    success: true,
                    config
                });
            } catch (error) {
                console.error('Error getting system configuration:', error);
                res.status(500).json({
                    error: 'Failed to get system configuration',
                    code: 'CONFIG_FETCH_FAILED'
                });
            }
        });
        
        // Update system configuration
        router.patch('/config', async (req, res) => {
            try {
                const { config } = req.body;
                await this.updateSystemConfiguration(config);
                
                res.json({
                    success: true,
                    message: 'System configuration updated successfully'
                });
            } catch (error) {
                console.error('Error updating system configuration:', error);
                res.status(500).json({
                    error: 'Failed to update system configuration',
                    code: 'CONFIG_UPDATE_FAILED'
                });
            }
        });
        
        this.app.use('/api/admin', router);
    }
    
    /**
     * Get system health
     */
    async getSystemHealth() {
        const health = {
            timestamp: new Date().toISOString(),
            services: {},
            database: {},
            system: {}
        };
        
        try {
            // Check database connection
            health.database.mongodb = {
                status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
                connections: mongoose.connection.readyState
            };
            
            // Check system resources
            health.system = {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                nodeVersion: process.version
            };
            
            // Check external services (placeholder)
            health.services = {
                auth: { status: 'healthy' },
                billing: { status: 'healthy' },
                multiTenancy: { status: 'healthy' }
            };
            
        } catch (error) {
            console.error('Error checking system health:', error);
        }
        
        return health;
    }
    
    /**
     * Get system metrics
     */
    async getSystemMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            users: {},
            tenants: {},
            billing: {},
            performance: {}
        };
        
        try {
            // User metrics
            metrics.users = {
                total: await User.countDocuments(),
                active: await User.countDocuments({ 'account.status': 'active' }),
                suspended: await User.countDocuments({ 'account.status': 'suspended' }),
                byTier: await User.aggregate([
                    { $group: { _id: '$subscription.tier', count: { $sum: 1 } } }
                ])
            };
            
            // Tenant metrics
            const Tenant = mongoose.model('Tenant');
            metrics.tenants = {
                total: await Tenant.countDocuments(),
                active: await Tenant.countDocuments({ status: 'active' }),
                suspended: await Tenant.countDocuments({ status: 'suspended' }),
                byType: await Tenant.aggregate([
                    { $group: { _id: '$type', count: { $sum: 1 } } }
                ])
            };
            
        } catch (error) {
            console.error('Error getting system metrics:', error);
        }
        
        return metrics;
    }
    
    /**
     * Get platform analytics
     */
    async getPlatformAnalytics() {
        const analytics = {
            timestamp: new Date().toISOString(),
            growth: {},
            usage: {},
            revenue: {}
        };
        
        try {
            // Growth analytics
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            analytics.growth = {
                newUsers: await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
                newTenants: await mongoose.model('Tenant').countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
            };
            
            // Usage analytics (placeholder)
            analytics.usage = {
                apiRequests: 0, // Implement API request tracking
                aiRequests: 0,  // Implement AI request tracking
                storageUsed: 0  // Implement storage tracking
            };
            
        } catch (error) {
            console.error('Error getting platform analytics:', error);
        }
        
        return analytics;
    }
    
    /**
     * Get system configuration
     */
    async getSystemConfiguration() {
        // Implement configuration retrieval
        return {
            features: {
                aiEnabled: true,
                billingEnabled: true,
                multiTenancyEnabled: true
            },
            limits: {
                maxUsersPerTenant: 100,
                maxProjectsPerTenant: 50,
                maxStoragePerTenant: '10GB'
            },
            security: {
                twoFactorRequired: false,
                passwordMinLength: 8,
                sessionTimeout: 3600
            }
        };
    }
    
    /**
     * Update system configuration
     */
    async updateSystemConfiguration(config) {
        // Implement configuration update
        console.log('Updating system configuration:', config);
    }
    
    /**
     * Generate admin dashboard HTML
     */
    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS IDE - Admin Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/@heroicons/react@1.0.6/outline/index.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gray-100">
    <div class="min-h-screen flex">
        <!-- Sidebar -->
        <div class="bg-gray-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out">
            <div class="text-center">
                <h1 class="text-2xl font-bold">NEXUS IDE</h1>
                <p class="text-gray-400">Admin Dashboard</p>
            </div>
            
            <nav class="space-y-2">
                <a href="#dashboard" class="nav-link block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white" onclick="showSection('dashboard')">
                    📊 Dashboard
                </a>
                <a href="#users" class="nav-link block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white" onclick="showSection('users')">
                    👥 Users
                </a>
                <a href="#tenants" class="nav-link block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white" onclick="showSection('tenants')">
                    🏢 Tenants
                </a>
                <a href="#billing" class="nav-link block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white" onclick="showSection('billing')">
                    💳 Billing
                </a>
                <a href="#system" class="nav-link block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white" onclick="showSection('system')">
                    ⚙️ System
                </a>
                <a href="#analytics" class="nav-link block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white" onclick="showSection('analytics')">
                    📈 Analytics
                </a>
            </nav>
        </div>
        
        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Header -->
            <header class="bg-white shadow-sm border-b border-gray-200">
                <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center">
                        <h2 id="page-title" class="text-2xl font-bold text-gray-900">Dashboard</h2>
                        <div class="flex items-center space-x-4">
                            <span class="text-sm text-gray-500" id="last-updated">Last updated: Loading...</span>
                            <button onclick="refreshData()" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            
            <!-- Content -->
            <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <!-- Dashboard Section -->
                    <div id="dashboard-section" class="section">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div class="bg-white overflow-hidden shadow rounded-lg">
                                <div class="p-5">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0">
                                            <div class="text-2xl">👥</div>
                                        </div>
                                        <div class="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt class="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                                                <dd class="text-lg font-medium text-gray-900" id="total-users">Loading...</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white overflow-hidden shadow rounded-lg">
                                <div class="p-5">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0">
                                            <div class="text-2xl">🏢</div>
                                        </div>
                                        <div class="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt class="text-sm font-medium text-gray-500 truncate">Active Tenants</dt>
                                                <dd class="text-lg font-medium text-gray-900" id="active-tenants">Loading...</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white overflow-hidden shadow rounded-lg">
                                <div class="p-5">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0">
                                            <div class="text-2xl">💰</div>
                                        </div>
                                        <div class="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt class="text-sm font-medium text-gray-500 truncate">Monthly Revenue</dt>
                                                <dd class="text-lg font-medium text-gray-900" id="monthly-revenue">Loading...</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white overflow-hidden shadow rounded-lg">
                                <div class="p-5">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0">
                                            <div class="text-2xl">⚡</div>
                                        </div>
                                        <div class="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt class="text-sm font-medium text-gray-500 truncate">System Health</dt>
                                                <dd class="text-lg font-medium text-green-600" id="system-health">Healthy</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Charts -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div class="bg-white p-6 rounded-lg shadow">
                                <h3 class="text-lg font-medium text-gray-900 mb-4">User Growth</h3>
                                <canvas id="userGrowthChart" width="400" height="200"></canvas>
                            </div>
                            
                            <div class="bg-white p-6 rounded-lg shadow">
                                <h3 class="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
                                <canvas id="revenueChart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Users Section -->
                    <div id="users-section" class="section hidden">
                        <div class="bg-white shadow overflow-hidden sm:rounded-md">
                            <div class="px-4 py-5 sm:px-6">
                                <h3 class="text-lg leading-6 font-medium text-gray-900">User Management</h3>
                                <p class="mt-1 max-w-2xl text-sm text-gray-500">Manage all users in the system</p>
                            </div>
                            <div class="border-t border-gray-200">
                                <div id="users-list" class="p-4">
                                    Loading users...
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tenants Section -->
                    <div id="tenants-section" class="section hidden">
                        <div class="bg-white shadow overflow-hidden sm:rounded-md">
                            <div class="px-4 py-5 sm:px-6">
                                <h3 class="text-lg leading-6 font-medium text-gray-900">Tenant Management</h3>
                                <p class="mt-1 max-w-2xl text-sm text-gray-500">Manage all tenants in the system</p>
                            </div>
                            <div class="border-t border-gray-200">
                                <div id="tenants-list" class="p-4">
                                    Loading tenants...
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Billing Section -->
                    <div id="billing-section" class="section hidden">
                        <div class="bg-white shadow overflow-hidden sm:rounded-md">
                            <div class="px-4 py-5 sm:px-6">
                                <h3 class="text-lg leading-6 font-medium text-gray-900">Billing Overview</h3>
                                <p class="mt-1 max-w-2xl text-sm text-gray-500">Monitor billing and subscriptions</p>
                            </div>
                            <div class="border-t border-gray-200">
                                <div id="billing-overview" class="p-4">
                                    Loading billing data...
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- System Section -->
                    <div id="system-section" class="section hidden">
                        <div class="bg-white shadow overflow-hidden sm:rounded-md">
                            <div class="px-4 py-5 sm:px-6">
                                <h3 class="text-lg leading-6 font-medium text-gray-900">System Monitoring</h3>
                                <p class="mt-1 max-w-2xl text-sm text-gray-500">Monitor system health and performance</p>
                            </div>
                            <div class="border-t border-gray-200">
                                <div id="system-monitoring" class="p-4">
                                    Loading system data...
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Analytics Section -->
                    <div id="analytics-section" class="section hidden">
                        <div class="bg-white shadow overflow-hidden sm:rounded-md">
                            <div class="px-4 py-5 sm:px-6">
                                <h3 class="text-lg leading-6 font-medium text-gray-900">Platform Analytics</h3>
                                <p class="mt-1 max-w-2xl text-sm text-gray-500">Detailed analytics and insights</p>
                            </div>
                            <div class="border-t border-gray-200">
                                <div id="analytics-data" class="p-4">
                                    Loading analytics...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
    
    <script>
        let currentSection = 'dashboard';
        
        function showSection(sectionName) {
            // Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.add('hidden');
            });
            
            // Show selected section
            document.getElementById(sectionName + '-section').classList.remove('hidden');
            
            // Update page title
            document.getElementById('page-title').textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('bg-gray-700');
            });
            event.target.classList.add('bg-gray-700');
            
            currentSection = sectionName;
            loadSectionData(sectionName);
        }
        
        async function loadSectionData(section) {
            try {
                switch(section) {
                    case 'dashboard':
                        await loadDashboardData();
                        break;
                    case 'users':
                        await loadUsersData();
                        break;
                    case 'tenants':
                        await loadTenantsData();
                        break;
                    case 'billing':
                        await loadBillingData();
                        break;
                    case 'system':
                        await loadSystemData();
                        break;
                    case 'analytics':
                        await loadAnalyticsData();
                        break;
                }
            } catch (error) {
                console.error('Error loading section data:', error);
            }
        }
        
        async function loadDashboardData() {
            try {
                // Load system metrics
                const response = await fetch('/api/admin/system/metrics');
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('total-users').textContent = data.metrics.users.total || '0';
                    document.getElementById('active-tenants').textContent = data.metrics.tenants.active || '0';
                }
                
                // Load charts
                loadCharts();
                
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            }
        }
        
        async function loadUsersData() {
            try {
                const response = await fetch('/api/admin/users');
                const data = await response.json();
                
                if (data.success) {
                    const usersList = document.getElementById('users-list');
                    usersList.innerHTML = data.users.map(user => `
                        <div class="border-b border-gray-200 py-4">
                            <div class="flex justify-between items-center">
                                <div>
                                    <h4 class="font-medium">${user.email}</h4>
                                    <p class="text-sm text-gray-500">${user.profile?.firstName || ''} ${user.profile?.lastName || ''}</p>
                                    <p class="text-xs text-gray-400">Tier: ${user.subscription?.tier || 'free'}</p>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <span class="px-2 py-1 text-xs rounded-full ${
                                        user.account.status === 'active' ? 'bg-green-100 text-green-800' :
                                        user.account.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }">
                                        ${user.account.status}
                                    </span>
                                    <button onclick="viewUser('${user._id}')" class="text-blue-600 hover:text-blue-800">View</button>
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            } catch (error) {
                console.error('Error loading users data:', error);
            }
        }
        
        async function loadTenantsData() {
            try {
                const response = await fetch('/api/admin/tenants');
                const data = await response.json();
                
                if (data.success) {
                    const tenantsList = document.getElementById('tenants-list');
                    tenantsList.innerHTML = data.tenants.map(tenant => `
                        <div class="border-b border-gray-200 py-4">
                            <div class="flex justify-between items-center">
                                <div>
                                    <h4 class="font-medium">${tenant.name}</h4>
                                    <p class="text-sm text-gray-500">${tenant.domain || tenant.subdomain}</p>
                                    <p class="text-xs text-gray-400">Members: ${tenant.memberCount} | Type: ${tenant.type}</p>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <span class="px-2 py-1 text-xs rounded-full ${
                                        tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                                        tenant.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }">
                                        ${tenant.status}
                                    </span>
                                    <button onclick="viewTenant('${tenant.tenantId}')" class="text-blue-600 hover:text-blue-800">View</button>
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            } catch (error) {
                console.error('Error loading tenants data:', error);
            }
        }
        
        async function loadBillingData() {
            document.getElementById('billing-overview').innerHTML = 'Billing data will be loaded here...';
        }
        
        async function loadSystemData() {
            try {
                const response = await fetch('/api/admin/system/health');
                const data = await response.json();
                
                if (data.success) {
                    const systemMonitoring = document.getElementById('system-monitoring');
                    systemMonitoring.innerHTML = `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-gray-50 p-4 rounded">
                                <h4 class="font-medium mb-2">Database Status</h4>
                                <p class="text-sm">MongoDB: <span class="font-medium ${data.health.database.mongodb.status === 'healthy' ? 'text-green-600' : 'text-red-600'}">${data.health.database.mongodb.status}</span></p>
                            </div>
                            <div class="bg-gray-50 p-4 rounded">
                                <h4 class="font-medium mb-2">System Info</h4>
                                <p class="text-sm">Uptime: ${Math.floor(data.health.system.uptime / 3600)}h ${Math.floor((data.health.system.uptime % 3600) / 60)}m</p>
                                <p class="text-sm">Node.js: ${data.health.system.nodeVersion}</p>
                            </div>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error loading system data:', error);
            }
        }
        
        async function loadAnalyticsData() {
            document.getElementById('analytics-data').innerHTML = 'Analytics data will be loaded here...';
        }
        
        function loadCharts() {
            // User Growth Chart
            const userCtx = document.getElementById('userGrowthChart').getContext('2d');
            new Chart(userCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'New Users',
                        data: [12, 19, 3, 5, 2, 3],
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
            
            // Revenue Chart
            const revenueCtx = document.getElementById('revenueChart').getContext('2d');
            new Chart(revenueCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue ($)',
                        data: [1200, 1900, 3000, 5000, 2000, 3000],
                        backgroundColor: 'rgba(34, 197, 94, 0.8)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        
        function refreshData() {
            loadSectionData(currentSection);
            document.getElementById('last-updated').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
        }
        
        function viewUser(userId) {
            alert('View user: ' + userId);
        }
        
        function viewTenant(tenantId) {
            alert('View tenant: ' + tenantId);
        }
        
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            loadDashboardData();
            document.getElementById('last-updated').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
        });
    </script>
</body>
</html>
        `;
    }
    
    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Admin endpoint not found',
                code: 'ADMIN_NOT_FOUND',
                path: req.originalUrl
            });
        });
        
        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Admin server error:', error);
            
            res.status(500).json({
                error: 'Admin server error',
                code: 'ADMIN_SERVER_ERROR',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        });
    }
    
    /**
     * Start the server
     */
    async start() {
        try {
            // Connect to database
            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            
            console.log('✅ Admin Dashboard connected to database');
            
            // Start server
            this.server = this.app.listen(this.port, this.host, () => {
                console.log(`🚀 Admin Dashboard Server running on http://${this.host}:${this.port}`);
                console.log(`📊 Dashboard: http://${this.host}:${this.port}`);
                console.log(`🔧 Health check: http://${this.host}:${this.port}/health`);
            });
            
            // Graceful shutdown
            process.on('SIGTERM', () => this.shutdown());
            process.on('SIGINT', () => this.shutdown());
            
        } catch (error) {
            console.error('❌ Failed to start Admin Dashboard Server:', error);
            process.exit(1);
        }
    }
    
    /**
     * Shutdown the server
     */
    async shutdown() {
        console.log('🔄 Shutting down Admin Dashboard Server...');
        
        if (this.server) {
            this.server.close(() => {
                console.log('✅ Admin Dashboard Server closed');
            });
        }
        
        await mongoose.connection.close();
        console.log('✅ Admin database connection closed');
        
        process.exit(0);
    }
}

// Export for use in other modules
module.exports = { AdminDashboardServer };

// Start server if run directly
if (require.main === module) {
    const server = new AdminDashboardServer();
    server.start();
}