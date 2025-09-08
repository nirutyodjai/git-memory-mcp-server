/**
 * NEXUS IDE Security Dashboard - API Routes
 * Enterprise-grade API endpoints for dashboard functionality
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, query, param, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { db } = require('../utils/database');
const logger = require('../utils/logger');
const { encryption, tokenUtils } = require('../utils/security');

const router = express.Router();

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: {
        error: 'Too many API requests',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Strict rate limiting for sensitive endpoints
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: 'Rate limit exceeded for sensitive operation',
        retryAfter: '15 minutes'
    }
});

// Apply rate limiting to all API routes
router.use(apiLimiter);

/**
 * Dashboard Overview Endpoints
 */

// Get dashboard overview data
router.get('/overview',
    authenticate,
    authorize(['admin', 'user']),
    async (req, res) => {
        try {
            const userId = req.user.id;
            const timeRange = req.query.timeRange || '24h';
            
            // Get cached overview data
            const cacheKey = `dashboard:overview:${userId}:${timeRange}`;
            let overviewData = await db.redis.get(cacheKey);
            
            if (!overviewData) {
                // Generate overview data
                overviewData = await generateOverviewData(userId, timeRange);
                
                // Cache for 5 minutes
                await db.redis.set(cacheKey, overviewData, 300);
            }
            
            res.json({
                success: true,
                data: overviewData,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Overview data fetch failed', {
                error: error.message,
                userId: req.user?.id,
                stack: error.stack
            });
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch overview data'
            });
        }
    }
);

// Get system statistics
router.get('/stats',
    authenticate,
    authorize(['admin', 'user']),
    async (req, res) => {
        try {
            const stats = await getSystemStats();
            
            res.json({
                success: true,
                data: stats,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('System stats fetch failed', {
                error: error.message,
                stack: error.stack
            });
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch system statistics'
            });
        }
    }
);

/**
 * Security Monitoring Endpoints
 */

// Get security events
router.get('/security/events',
    authenticate,
    authorize(['admin', 'security']),
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
        query('type').optional().isString(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601()
    ],
    validateRequest,
    async (req, res) => {
        try {
            const {
                page = 1,
                limit = 50,
                severity,
                type,
                startDate,
                endDate
            } = req.query;
            
            const events = await getSecurityEvents({
                page,
                limit,
                severity,
                type,
                startDate,
                endDate,
                userId: req.user.id
            });
            
            res.json({
                success: true,
                data: events,
                pagination: {
                    page,
                    limit,
                    total: events.total,
                    pages: Math.ceil(events.total / limit)
                }
            });
            
        } catch (error) {
            logger.error('Security events fetch failed', {
                error: error.message,
                userId: req.user?.id,
                stack: error.stack
            });
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch security events'
            });
        }
    }
);

// Get threat intelligence data
router.get('/security/threats',
    authenticate,
    authorize(['admin', 'security']),
    async (req, res) => {
        try {
            const threats = await getThreatIntelligence();
            
            res.json({
                success: true,
                data: threats,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Threat intelligence fetch failed', {
                error: error.message,
                stack: error.stack
            });
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch threat intelligence'
            });
        }
    }
);

// Report security incident
router.post('/security/incidents',
    strictLimiter,
    authenticate,
    authorize(['admin', 'security', 'user']),
    [
        body('title').notEmpty().isLength({ min: 5, max: 200 }),
        body('description').notEmpty().isLength({ min: 10, max: 2000 }),
        body('severity').isIn(['low', 'medium', 'high', 'critical']),
        body('type').isIn(['malware', 'phishing', 'data_breach', 'unauthorized_access', 'other']),
        body('affectedSystems').optional().isArray(),
        body('evidence').optional().isArray()
    ],
    validateRequest,
    async (req, res) => {
        try {
            const incidentData = {
                ...req.body,
                reportedBy: req.user.id,
                reportedAt: new Date(),
                status: 'open',
                id: generateIncidentId()
            };
            
            const incident = await createSecurityIncident(incidentData);
            
            // Log security event
            logger.security('Security incident reported', {
                incidentId: incident.id,
                severity: incident.severity,
                type: incident.type,
                reportedBy: req.user.id
            });
            
            res.status(201).json({
                success: true,
                data: incident
            });
            
        } catch (error) {
            logger.error('Security incident creation failed', {
                error: error.message,
                userId: req.user?.id,
                stack: error.stack
            });
            
            res.status(500).json({
                success: false,
                error: 'Failed to create security incident'
            });
        }
    }
);

/**
 * Audit & Compliance Endpoints
 */

// Get audit logs
router.get('/audit/logs',
    authenticate,
    authorize(['admin', 'auditor']),
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('action').optional().isString(),
        query('resource').optional().isString(),
        query('userId').optional().isString(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601()
    ],
    validateRequest,
    async (req, res) => {
        try {
            const {
                page = 1,
                limit = 50,
                action,
                resource,
                userId,
                startDate,
                endDate
            } = req.query;
            
            const auditLogs = await getAuditLogs({
                page,
                limit,
                action,
                resource,
                userId,
                startDate,
                endDate
            });
            
            res.json({
                success: true,
                data: auditLogs,
                pagination: {
                    page,
                    limit,
                    total: auditLogs.total,
                    pages: Math.ceil(auditLogs.total / limit)
                }
            });
            
        } catch (error) {
            logger.error('Audit logs fetch failed', {
                error: error.message,
                userId: req.user?.id,
                stack: error.stack
            });
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch audit logs'
            });
        }
    }
);

// Get compliance status
router.get('/compliance/status',
    authenticate,
    authorize(['admin', 'compliance']),
    async (req, res) => {
        try {
            const complianceStatus = await getComplianceStatus();
            
            res.json({
                success: true,
                data: complianceStatus,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Compliance status fetch failed', {
                error: error.message,
                stack: error.stack
            });
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch compliance status'
            });
        }
    }
);

// Generate compliance report
router.post('/compliance/reports',
    strictLimiter,
    authenticate,
    authorize(['admin', 'compliance']),
    [
        body('type').isIn(['gdpr', 'hipaa', 'sox', 'pci_dss', 'iso27001']),
        body('startDate').isISO8601(),
        body('endDate').isISO8601(),
        body('format').optional().isIn(['pdf', 'xlsx', 'json'])
    ],
    validateRequest,
    async (req, res) => {
        try {
            const reportRequest = {
                ...req.body,
                requestedBy: req.user.id,
                requestedAt: new Date(),
                id: generateReportId()
            };
            
            const report = await generateComplianceReport(reportRequest);
            
            res.json({
                success: true,
                data: report
            });
            
        } catch (error) {
            logger.error('Compliance report generation failed', {
                error: error.message,
                userId: req.user?.id,
                stack: error.stack
            });
            
            res.status(500).json({
                success: false,
                error: 'Failed to generate compliance report'
            });
        }
    }
);

/**
 * Configuration Management Endpoints
 */

// Get system configuration
router.get('/config',
    authenticate,
    authorize(['admin']),
    async (req, res) => {
        try {
            const config = await getSystemConfiguration();
            
            // Remove sensitive information
            const sanitizedConfig = sanitizeConfiguration(config);
            
            res.json({
                success: true,
                data: sanitizedConfig
            });
            
        } catch (error) {
            logger.error('Configuration fetch failed', {
                error: error.message,
                userId: req.user?.id,
                stack: error.stack
            });
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch configuration'
            });
        }
    }
);

// Update system configuration
router.put('/config',
    strictLimiter,
    authenticate,
    authorize(['admin']),
    [
        body('section').notEmpty().isString(),
        body('settings').isObject()
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { section, settings } = req.body;
            
            // Validate configuration changes
            await validateConfigurationChanges(section, settings);
            
            // Update configuration
            const updatedConfig = await updateSystemConfiguration(section, settings, req.user.id);
            
            // Log configuration change
            logger.audit('Configuration updated', {
                section,
                changedBy: req.user.id,
                changes: Object.keys(settings)
            });
            
            res.json({
                success: true,
                data: updatedConfig
            });
            
        } catch (error) {
            logger.error('Configuration update failed', {
                error: error.message,
                userId: req.user?.id,
                stack: error.stack
            });
            
            res.status(500).json({
                success: false,
                error: 'Failed to update configuration'
            });
        }
    }
);

/**
 * User Management Endpoints
 */

// Get users list
router.get('/users',
    authenticate,
    authorize(['admin']),
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('role').optional().isString(),
        query('status').optional().isIn(['active', 'inactive', 'suspended']),
        query('search').optional().isString()
    ],
    validateRequest,
    async (req, res) => {
        try {
            const {
                page = 1,
                limit = 50,
                role,
                status,
                search
            } = req.query;
            
            const users = await getUsers({
                page,
                limit,
                role,
                status,
                search
            });
            
            res.json({
                success: true,
                data: users,
                pagination: {
                    page,
                    limit,
                    total: users.total,
                    pages: Math.ceil(users.total / limit)
                }
            });
            
        } catch (error) {
            logger.error('Users fetch failed', {
                error: error.message,
                userId: req.user?.id,
                stack: error.stack
            });
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch users'
            });
        }
    }
);

// Create new user
router.post('/users',
    strictLimiter,
    authenticate,
    authorize(['admin']),
    [
        body('username').notEmpty().isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_-]+$/),
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
        body('role').isIn(['admin', 'user', 'security', 'auditor', 'compliance']),
        body('firstName').notEmpty().isLength({ min: 1, max: 50 }),
        body('lastName').notEmpty().isLength({ min: 1, max: 50 })
    ],
    validateRequest,
    async (req, res) => {
        try {
            const userData = {
                ...req.body,
                createdBy: req.user.id,
                createdAt: new Date(),
                status: 'active',
                id: generateUserId()
            };
            
            const user = await createUser(userData);
            
            // Log user creation
            logger.audit('User created', {
                userId: user.id,
                username: user.username,
                role: user.role,
                createdBy: req.user.id
            });
            
            res.status(201).json({
                success: true,
                data: user
            });
            
        } catch (error) {
            logger.error('User creation failed', {
                error: error.message,
                userId: req.user?.id,
                stack: error.stack
            });
            
            res.status(500).json({
                success: false,
                error: 'Failed to create user'
            });
        }
    }
);

/**
 * Performance Monitoring Endpoints
 */

// Get performance metrics
router.get('/performance/metrics',
    authenticate,
    authorize(['admin', 'user']),
    async (req, res) => {
        try {
            const metrics = await getPerformanceMetrics();
            
            res.json({
                success: true,
                data: metrics,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Performance metrics fetch failed', {
                error: error.message,
                stack: error.stack
            });
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch performance metrics'
            });
        }
    }
);

// Get system health
router.get('/health',
    async (req, res) => {
        try {
            const health = await getSystemHealth();
            
            const statusCode = health.status === 'healthy' ? 200 : 503;
            
            res.status(statusCode).json({
                success: health.status === 'healthy',
                data: health,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Health check failed', {
                error: error.message,
                stack: error.stack
            });
            
            res.status(503).json({
                success: false,
                error: 'Health check failed',
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * Helper Functions
 */

async function generateOverviewData(userId, timeRange) {
    // Implementation for generating dashboard overview data
    return {
        totalEvents: 1250,
        criticalAlerts: 3,
        systemHealth: 'good',
        complianceScore: 95,
        recentActivity: [],
        charts: {
            securityEvents: [],
            performance: [],
            compliance: []
        }
    };
}

async function getSystemStats() {
    // Implementation for system statistics
    return {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: await getCPUUsage(),
        connections: await getActiveConnections(),
        requests: await getRequestStats()
    };
}

async function getSecurityEvents(filters) {
    // Implementation for fetching security events
    return {
        events: [],
        total: 0
    };
}

async function getThreatIntelligence() {
    // Implementation for threat intelligence
    return {
        threats: [],
        riskLevel: 'medium',
        lastUpdated: new Date()
    };
}

async function createSecurityIncident(incidentData) {
    // Implementation for creating security incident
    return incidentData;
}

async function getAuditLogs(filters) {
    // Implementation for fetching audit logs
    return {
        logs: [],
        total: 0
    };
}

async function getComplianceStatus() {
    // Implementation for compliance status
    return {
        overall: 95,
        frameworks: {
            gdpr: 98,
            hipaa: 92,
            sox: 96
        }
    };
}

async function generateComplianceReport(reportRequest) {
    // Implementation for generating compliance report
    return {
        id: reportRequest.id,
        status: 'generating',
        estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000)
    };
}

async function getSystemConfiguration() {
    // Implementation for getting system configuration
    return {};
}

function sanitizeConfiguration(config) {
    // Remove sensitive data from configuration
    const sanitized = { ...config };
    delete sanitized.secrets;
    delete sanitized.passwords;
    delete sanitized.apiKeys;
    return sanitized;
}

async function validateConfigurationChanges(section, settings) {
    // Validate configuration changes
    return true;
}

async function updateSystemConfiguration(section, settings, userId) {
    // Implementation for updating system configuration
    return { section, settings, updatedBy: userId, updatedAt: new Date() };
}

async function getUsers(filters) {
    // Implementation for fetching users
    return {
        users: [],
        total: 0
    };
}

async function createUser(userData) {
    // Implementation for creating user
    const user = { ...userData };
    delete user.password; // Don't return password
    return user;
}

async function getPerformanceMetrics() {
    // Implementation for performance metrics
    return {
        cpu: 45,
        memory: 68,
        disk: 32,
        network: 12
    };
}

async function getSystemHealth() {
    // Implementation for system health check
    const dbHealth = await db.getHealthStatus();
    
    return {
        status: dbHealth.overall === 'healthy' ? 'healthy' : 'unhealthy',
        components: {
            database: dbHealth,
            api: 'healthy',
            cache: 'healthy'
        }
    };
}

async function getCPUUsage() {
    // Implementation for CPU usage
    return 45;
}

async function getActiveConnections() {
    // Implementation for active connections
    return 150;
}

async function getRequestStats() {
    // Implementation for request statistics
    return {
        total: 10000,
        success: 9850,
        errors: 150
    };
}

function generateIncidentId() {
    return `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateReportId() {
    return `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateUserId() {
    return `USR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Error handling middleware
router.use((error, req, res, next) => {
    logger.error('API route error', {
        error: error.message,
        path: req.path,
        method: req.method,
        userId: req.user?.id,
        stack: error.stack
    });
    
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

module.exports = router;