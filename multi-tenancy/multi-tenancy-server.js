/**
 * Multi-Tenancy Server
 * Central server for managing multi-tenant architecture
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoose = require('mongoose');
const { TenantManager, tenantMiddleware, requireTenantAccess } = require('./tenant-manager');
const { dataIsolationManager, dataIsolationMiddleware } = require('./data-isolation');
const { User } = require('../auth-system/models/User');

class MultiTenancyServer {
    constructor(options = {}) {
        this.app = express();
        this.port = options.port || process.env.MULTI_TENANCY_PORT || 3003;
        this.host = options.host || process.env.MULTI_TENANCY_HOST || 'localhost';
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
        
        // CORS configuration
        this.app.use(cors({
            origin: (origin, callback) => {
                // Allow requests from any subdomain of your domain
                const allowedOrigins = [
                    /^https?:\/\/localhost(:\d+)?$/,
                    /^https?:\/\/[\w-]+\.nexus-ide\.com$/,
                    /^https?:\/\/nexus-ide\.com$/
                ];
                
                if (!origin || allowedOrigins.some(pattern => pattern.test(origin))) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-API-Key']
        }));
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // limit each IP to 1000 requests per windowMs
            message: {
                error: 'Too many requests from this IP',
                code: 'RATE_LIMIT_EXCEEDED'
            },
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use(limiter);
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Compression
        this.app.use(compression());
        
        // Request logging
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
            });
            next();
        });
        
        // Tenant context middleware
        this.app.use(tenantMiddleware);
        
        // Data isolation middleware
        this.app.use(dataIsolationMiddleware(dataIsolationManager));
    }
    
    /**
     * Setup routes
     */
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'multi-tenancy-server',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });
        
        // Tenant management routes
        this.setupTenantRoutes();
        
        // Project management routes
        this.setupProjectRoutes();
        
        // File management routes
        this.setupFileRoutes();
        
        // AI conversation routes
        this.setupAIRoutes();
        
        // Analytics routes
        this.setupAnalyticsRoutes();
        
        // Admin routes
        this.setupAdminRoutes();
    }
    
    /**
     * Setup tenant management routes
     */
    setupTenantRoutes() {
        const router = express.Router();
        
        // Create tenant
        router.post('/tenants', async (req, res) => {
            try {
                const { name, domain, subdomain, type, settings, metadata } = req.body;
                const userId = req.user?.userId;
                
                if (!userId) {
                    return res.status(401).json({
                        error: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    });
                }
                
                const tenant = await TenantManager.createTenant(userId, {
                    name,
                    domain,
                    subdomain,
                    type,
                    settings,
                    metadata
                });
                
                res.status(201).json({
                    success: true,
                    tenant: {
                        tenantId: tenant.tenantId,
                        name: tenant.name,
                        domain: tenant.domain,
                        subdomain: tenant.subdomain,
                        type: tenant.type,
                        status: tenant.status
                    }
                });
            } catch (error) {
                console.error('Error creating tenant:', error);
                res.status(500).json({
                    error: 'Failed to create tenant',
                    code: 'TENANT_CREATION_FAILED',
                    details: error.message
                });
            }
        });
        
        // Get user's tenants
        router.get('/tenants', async (req, res) => {
            try {
                const userId = req.user?.userId;
                
                if (!userId) {
                    return res.status(401).json({
                        error: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    });
                }
                
                const tenants = await TenantManager.getUserTenants(userId);
                
                res.json({
                    success: true,
                    tenants: tenants.map(tenant => ({
                        tenantId: tenant.tenantId,
                        name: tenant.name,
                        domain: tenant.domain,
                        subdomain: tenant.subdomain,
                        type: tenant.type,
                        status: tenant.status,
                        role: tenant.getMemberRole(userId),
                        memberCount: tenant.members.length,
                        createdAt: tenant.createdAt
                    }))
                });
            } catch (error) {
                console.error('Error getting user tenants:', error);
                res.status(500).json({
                    error: 'Failed to get tenants',
                    code: 'TENANT_FETCH_FAILED'
                });
            }
        });
        
        // Get tenant details
        router.get('/tenants/:tenantId', requireTenantAccess('member'), async (req, res) => {
            try {
                const { tenantId } = req.params;
                const tenant = await TenantManager.getTenant(tenantId);
                
                if (!tenant) {
                    return res.status(404).json({
                        error: 'Tenant not found',
                        code: 'TENANT_NOT_FOUND'
                    });
                }
                
                const analytics = await TenantManager.getTenantAnalytics(tenantId);
                
                res.json({
                    success: true,
                    tenant: {
                        tenantId: tenant.tenantId,
                        name: tenant.name,
                        domain: tenant.domain,
                        subdomain: tenant.subdomain,
                        type: tenant.type,
                        status: tenant.status,
                        settings: tenant.settings,
                        subscription: tenant.subscription,
                        members: tenant.members.map(member => ({
                            userId: member.userId._id,
                            email: member.userId.email,
                            name: member.userId.profile?.firstName + ' ' + member.userId.profile?.lastName,
                            role: member.role,
                            joinedAt: member.joinedAt
                        })),
                        analytics,
                        createdAt: tenant.createdAt,
                        updatedAt: tenant.updatedAt
                    }
                });
            } catch (error) {
                console.error('Error getting tenant details:', error);
                res.status(500).json({
                    error: 'Failed to get tenant details',
                    code: 'TENANT_DETAILS_FAILED'
                });
            }
        });
        
        // Add member to tenant
        router.post('/tenants/:tenantId/members', requireTenantAccess('admin'), async (req, res) => {
            try {
                const { tenantId } = req.params;
                const { email, role = 'member' } = req.body;
                const invitedBy = req.user?.userId;
                
                // Find user by email
                const user = await User.findOne({ email });
                if (!user) {
                    return res.status(404).json({
                        error: 'User not found',
                        code: 'USER_NOT_FOUND'
                    });
                }
                
                await TenantManager.addMember(tenantId, user._id, role, invitedBy);
                
                res.json({
                    success: true,
                    message: 'Member added successfully'
                });
            } catch (error) {
                console.error('Error adding member:', error);
                res.status(500).json({
                    error: 'Failed to add member',
                    code: 'MEMBER_ADD_FAILED',
                    details: error.message
                });
            }
        });
        
        // Remove member from tenant
        router.delete('/tenants/:tenantId/members/:userId', requireTenantAccess('admin'), async (req, res) => {
            try {
                const { tenantId, userId } = req.params;
                
                await TenantManager.removeMember(tenantId, userId);
                
                res.json({
                    success: true,
                    message: 'Member removed successfully'
                });
            } catch (error) {
                console.error('Error removing member:', error);
                res.status(500).json({
                    error: 'Failed to remove member',
                    code: 'MEMBER_REMOVE_FAILED',
                    details: error.message
                });
            }
        });
        
        // Update member role
        router.patch('/tenants/:tenantId/members/:userId', requireTenantAccess('admin'), async (req, res) => {
            try {
                const { tenantId, userId } = req.params;
                const { role } = req.body;
                
                await TenantManager.updateMemberRole(tenantId, userId, role);
                
                res.json({
                    success: true,
                    message: 'Member role updated successfully'
                });
            } catch (error) {
                console.error('Error updating member role:', error);
                res.status(500).json({
                    error: 'Failed to update member role',
                    code: 'MEMBER_ROLE_UPDATE_FAILED',
                    details: error.message
                });
            }
        });
        
        this.app.use('/api/v1', router);
    }
    
    /**
     * Setup project management routes
     */
    setupProjectRoutes() {
        const router = express.Router();
        
        // Create project
        router.post('/projects', requireTenantAccess('member'), async (req, res) => {
            try {
                const Project = await req.tenantDb.getModel('Project');
                const projectData = {
                    ...req.body,
                    projectId: 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    collaborators: [{
                        userId: req.user.userId,
                        role: 'owner',
                        permissions: ['read', 'write', 'admin'],
                        addedAt: new Date()
                    }]
                };
                
                const project = new Project(projectData);
                await project.save();
                
                // Update tenant usage
                await TenantManager.updateUsage(req.tenant.tenantId, 'projects', 1);
                
                res.status(201).json({
                    success: true,
                    project: {
                        projectId: project.projectId,
                        name: project.name,
                        description: project.description,
                        type: project.type,
                        language: project.language,
                        createdAt: project.createdAt
                    }
                });
            } catch (error) {
                console.error('Error creating project:', error);
                res.status(500).json({
                    error: 'Failed to create project',
                    code: 'PROJECT_CREATION_FAILED'
                });
            }
        });
        
        // Get projects
        router.get('/projects', requireTenantAccess('member'), async (req, res) => {
            try {
                const Project = await req.tenantDb.getModel('Project');
                const userId = req.user.userId;
                
                const projects = await Project.find({
                    'collaborators.userId': userId
                }).sort({ updatedAt: -1 });
                
                res.json({
                    success: true,
                    projects: projects.map(project => ({
                        projectId: project.projectId,
                        name: project.name,
                        description: project.description,
                        type: project.type,
                        language: project.language,
                        collaborators: project.collaborators.length,
                        lastActivity: project.analytics.lastActivity,
                        createdAt: project.createdAt,
                        updatedAt: project.updatedAt
                    }))
                });
            } catch (error) {
                console.error('Error getting projects:', error);
                res.status(500).json({
                    error: 'Failed to get projects',
                    code: 'PROJECT_FETCH_FAILED'
                });
            }
        });
        
        this.app.use('/api/v1', router);
    }
    
    /**
     * Setup file management routes
     */
    setupFileRoutes() {
        const router = express.Router();
        
        // Save file content
        router.post('/projects/:projectId/files', requireTenantAccess('member'), async (req, res) => {
            try {
                const { projectId } = req.params;
                const { filePath, content, metadata } = req.body;
                
                const FileContent = await req.tenantDb.getModel('FileContent');
                
                // Encrypt file content
                const encryptedContent = req.tenantDb.encrypt(content);
                
                const fileContent = new FileContent({
                    projectId,
                    filePath,
                    content: encryptedContent,
                    metadata: {
                        ...metadata,
                        size: content.length,
                        lastModified: new Date()
                    }
                });
                
                await fileContent.save();
                
                res.status(201).json({
                    success: true,
                    message: 'File saved successfully'
                });
            } catch (error) {
                console.error('Error saving file:', error);
                res.status(500).json({
                    error: 'Failed to save file',
                    code: 'FILE_SAVE_FAILED'
                });
            }
        });
        
        // Get file content
        router.get('/projects/:projectId/files/*', requireTenantAccess('member'), async (req, res) => {
            try {
                const { projectId } = req.params;
                const filePath = req.params[0];
                
                const FileContent = await req.tenantDb.getModel('FileContent');
                const fileContent = await FileContent.findOne({ projectId, filePath });
                
                if (!fileContent) {
                    return res.status(404).json({
                        error: 'File not found',
                        code: 'FILE_NOT_FOUND'
                    });
                }
                
                // Decrypt file content
                const decryptedContent = req.tenantDb.decrypt(fileContent.content);
                
                res.json({
                    success: true,
                    file: {
                        projectId: fileContent.projectId,
                        filePath: fileContent.filePath,
                        content: decryptedContent,
                        metadata: fileContent.metadata,
                        analysis: fileContent.analysis,
                        aiInsights: fileContent.aiInsights,
                        updatedAt: fileContent.updatedAt
                    }
                });
            } catch (error) {
                console.error('Error getting file:', error);
                res.status(500).json({
                    error: 'Failed to get file',
                    code: 'FILE_FETCH_FAILED'
                });
            }
        });
        
        this.app.use('/api/v1', router);
    }
    
    /**
     * Setup AI conversation routes
     */
    setupAIRoutes() {
        const router = express.Router();
        
        // Create AI conversation
        router.post('/ai/conversations', requireTenantAccess('member'), async (req, res) => {
            try {
                const { context, initialMessage } = req.body;
                const userId = req.user.userId;
                
                const AIConversation = await req.tenantDb.getModel('AIConversation');
                
                const conversation = new AIConversation({
                    conversationId: 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    userId,
                    context,
                    messages: initialMessage ? [{
                        messageId: 'msg_' + Date.now(),
                        role: 'user',
                        content: req.tenantDb.encrypt(initialMessage),
                        timestamp: new Date()
                    }] : []
                });
                
                await conversation.save();
                
                // Update tenant usage
                await TenantManager.updateUsage(req.tenant.tenantId, 'aiRequests', 1);
                
                res.status(201).json({
                    success: true,
                    conversation: {
                        conversationId: conversation.conversationId,
                        context: conversation.context,
                        createdAt: conversation.createdAt
                    }
                });
            } catch (error) {
                console.error('Error creating AI conversation:', error);
                res.status(500).json({
                    error: 'Failed to create AI conversation',
                    code: 'AI_CONVERSATION_FAILED'
                });
            }
        });
        
        this.app.use('/api/v1', router);
    }
    
    /**
     * Setup analytics routes
     */
    setupAnalyticsRoutes() {
        const router = express.Router();
        
        // Get tenant analytics
        router.get('/analytics/tenant', requireTenantAccess('admin'), async (req, res) => {
            try {
                const analytics = await TenantManager.getTenantAnalytics(req.tenant.tenantId);
                const dataStats = await dataIsolationManager.getTenantDataStats(req.tenant.tenantId);
                
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
                    error: 'Failed to get analytics',
                    code: 'ANALYTICS_FAILED'
                });
            }
        });
        
        this.app.use('/api/v1', router);
    }
    
    /**
     * Setup admin routes
     */
    setupAdminRoutes() {
        const router = express.Router();
        
        // Backup tenant data
        router.post('/admin/tenants/:tenantId/backup', requireTenantAccess('owner'), async (req, res) => {
            try {
                const { tenantId } = req.params;
                const backup = await dataIsolationManager.backupTenantData(tenantId);
                
                res.json({
                    success: true,
                    message: 'Tenant data backed up successfully',
                    backup: {
                        timestamp: backup.timestamp,
                        collections: Object.keys(backup.collections)
                    }
                });
            } catch (error) {
                console.error('Error backing up tenant data:', error);
                res.status(500).json({
                    error: 'Failed to backup tenant data',
                    code: 'BACKUP_FAILED'
                });
            }
        });
        
        // Delete tenant data (GDPR)
        router.delete('/admin/tenants/:tenantId/data', requireTenantAccess('owner'), async (req, res) => {
            try {
                const { tenantId } = req.params;
                
                // First delete tenant record
                await TenantManager.deleteTenant(tenantId, req.user.userId);
                
                // Then delete all tenant data
                await dataIsolationManager.deleteTenantData(tenantId);
                
                res.json({
                    success: true,
                    message: 'Tenant data deleted successfully'
                });
            } catch (error) {
                console.error('Error deleting tenant data:', error);
                res.status(500).json({
                    error: 'Failed to delete tenant data',
                    code: 'DELETE_FAILED'
                });
            }
        });
        
        this.app.use('/api/v1', router);
    }
    
    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                code: 'NOT_FOUND',
                path: req.originalUrl
            });
        });
        
        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Global error handler:', error);
            
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    error: 'Validation error',
                    code: 'VALIDATION_ERROR',
                    details: error.message
                });
            }
            
            if (error.name === 'CastError') {
                return res.status(400).json({
                    error: 'Invalid ID format',
                    code: 'INVALID_ID'
                });
            }
            
            res.status(500).json({
                error: 'Internal server error',
                code: 'INTERNAL_ERROR',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        });
    }
    
    /**
     * Start the server
     */
    async start() {
        try {
            // Connect to main database
            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            
            console.log('✅ Connected to main database');
            
            // Start server
            this.server = this.app.listen(this.port, this.host, () => {
                console.log(`🚀 Multi-Tenancy Server running on http://${this.host}:${this.port}`);
                console.log(`📊 Health check: http://${this.host}:${this.port}/health`);
            });
            
            // Graceful shutdown
            process.on('SIGTERM', () => this.shutdown());
            process.on('SIGINT', () => this.shutdown());
            
        } catch (error) {
            console.error('❌ Failed to start Multi-Tenancy Server:', error);
            process.exit(1);
        }
    }
    
    /**
     * Shutdown the server
     */
    async shutdown() {
        console.log('🔄 Shutting down Multi-Tenancy Server...');
        
        if (this.server) {
            this.server.close(() => {
                console.log('✅ Multi-Tenancy Server closed');
            });
        }
        
        // Close all tenant connections
        for (const [tenantId] of dataIsolationManager.tenantConnections) {
            await dataIsolationManager.closeTenantConnection(tenantId);
        }
        
        // Close main database connection
        await mongoose.connection.close();
        console.log('✅ Database connections closed');
        
        process.exit(0);
    }
}

// Export for use in other modules
module.exports = { MultiTenancyServer };

// Start server if run directly
if (require.main === module) {
    const server = new MultiTenancyServer();
    server.start();
}