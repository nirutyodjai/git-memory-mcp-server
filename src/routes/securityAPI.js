/**
 * Security API Routes
 * Comprehensive security API endpoints for NEXUS IDE
 * Enterprise-grade security management and monitoring
 */

const express = require('express');
const SecurityIntegrationService = require('../services/securityIntegrationService');
const UserService = require('../services/userService');
const AuditService = require('../services/auditService');
const MonitoringService = require('../services/monitoringService');
const AuthMiddleware = require('../middleware/authMiddleware');
const SecurityMiddleware = require('../middleware/securityMiddleware');
const securityConfig = require('../config/security-config');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Initialize services
const securityService = new SecurityIntegrationService();
const userService = new UserService();
const auditService = new AuditService();
const monitoringService = new MonitoringService();

// Rate limiting for security endpoints
const securityRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many security requests from this IP',
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiting and security middleware
router.use(securityRateLimit);
router.use(SecurityMiddleware.validateRequest);
router.use(SecurityMiddleware.securityHeaders);

// =============================================================================
// AUTHENTICATION & AUTHORIZATION APIs
// =============================================================================

/**
 * User Login
 */
router.post('/auth/login', async (req, res) => {
    try {
        const { username, password, mfaCode, tenantId } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        // Authenticate user
        const result = await userService.authenticateUser({
            username,
            password,
            mfaCode,
            tenantId,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        if (!result.success) {
            // Log failed login attempt
            await auditService.logSecurityEvent({
                type: 'LOGIN_FAILED',
                severity: 'medium',
                username,
                reason: result.error,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date()
            });
            
            return res.status(401).json({ error: result.error });
        }
        
        // Log successful login
        await auditService.logSecurityEvent({
            type: 'LOGIN_SUCCESS',
            severity: 'low',
            userId: result.user.id,
            username,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date()
        });
        
        res.json({
            success: true,
            token: result.token,
            refreshToken: result.refreshToken,
            user: {
                id: result.user.id,
                username: result.user.username,
                email: result.user.email,
                roles: result.user.roles,
                permissions: result.user.permissions,
                tenantId: result.user.tenantId
            },
            expiresIn: securityConfig.jwt.expiresIn
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

/**
 * User Logout
 */
router.post('/auth/logout', AuthMiddleware.requireAuth, async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        // Invalidate token
        await userService.invalidateToken(token);
        
        // Log logout
        await auditService.logSecurityEvent({
            type: 'LOGOUT',
            severity: 'low',
            userId: req.user.id,
            ipAddress: req.ip,
            timestamp: new Date()
        });
        
        res.json({ success: true, message: 'Logged out successfully' });
        
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

/**
 * Refresh Token
 */
router.post('/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }
        
        const result = await userService.refreshToken(refreshToken);
        
        if (!result.success) {
            return res.status(401).json({ error: result.error });
        }
        
        res.json({
            success: true,
            token: result.token,
            refreshToken: result.refreshToken,
            expiresIn: securityConfig.jwt.expiresIn
        });
        
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

/**
 * Get Current User
 */
router.get('/auth/me', AuthMiddleware.requireAuth, async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            roles: user.roles,
            permissions: user.permissions,
            tenantId: user.tenantId,
            lastLogin: user.lastLogin,
            mfaEnabled: user.mfaEnabled
        });
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user information' });
    }
});

// =============================================================================
// USER MANAGEMENT APIs
// =============================================================================

/**
 * Create User
 */
router.post('/users', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('user:create'), async (req, res) => {
    try {
        const userData = req.body;
        userData.createdBy = req.user.id;
        userData.tenantId = req.user.tenantId;
        
        const result = await userService.createUser(userData);
        
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        
        // Log user creation
        await auditService.logEvent({
            type: 'USER_CREATED',
            userId: result.user.id,
            createdBy: req.user.id,
            userData: { username: userData.username, email: userData.email },
            timestamp: new Date()
        });
        
        res.status(201).json({
            success: true,
            user: {
                id: result.user.id,
                username: result.user.username,
                email: result.user.email,
                roles: result.user.roles,
                tenantId: result.user.tenantId
            }
        });
        
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

/**
 * Get Users List
 */
router.get('/users', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('user:read'), async (req, res) => {
    try {
        const { page = 1, limit = 20, search, role, status } = req.query;
        
        const result = await userService.getUsers({
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            role,
            status,
            tenantId: req.user.tenantId
        });
        
        res.json(result);
        
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

/**
 * Update User
 */
router.put('/users/:userId', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('user:update'), async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;
        updateData.updatedBy = req.user.id;
        
        const result = await userService.updateUser(userId, updateData);
        
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        
        // Log user update
        await auditService.logEvent({
            type: 'USER_UPDATED',
            userId,
            updatedBy: req.user.id,
            changes: updateData,
            timestamp: new Date()
        });
        
        res.json({ success: true, user: result.user });
        
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

/**
 * Delete User
 */
router.delete('/users/:userId', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('user:delete'), async (req, res) => {
    try {
        const { userId } = req.params;
        
        const result = await userService.deleteUser(userId);
        
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        
        // Log user deletion
        await auditService.logEvent({
            type: 'USER_DELETED',
            userId,
            deletedBy: req.user.id,
            timestamp: new Date()
        });
        
        res.json({ success: true, message: 'User deleted successfully' });
        
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// =============================================================================
// ROLE & PERMISSION MANAGEMENT APIs
// =============================================================================

/**
 * Get Roles
 */
router.get('/roles', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('role:read'), async (req, res) => {
    try {
        const roles = await userService.getRoles(req.user.tenantId);
        res.json(roles);
        
    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({ error: 'Failed to get roles' });
    }
});

/**
 * Create Role
 */
router.post('/roles', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('role:create'), async (req, res) => {
    try {
        const roleData = req.body;
        roleData.createdBy = req.user.id;
        roleData.tenantId = req.user.tenantId;
        
        const result = await userService.createRole(roleData);
        
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        
        // Log role creation
        await auditService.logEvent({
            type: 'ROLE_CREATED',
            roleId: result.role.id,
            roleName: result.role.name,
            createdBy: req.user.id,
            timestamp: new Date()
        });
        
        res.status(201).json({ success: true, role: result.role });
        
    } catch (error) {
        console.error('Create role error:', error);
        res.status(500).json({ error: 'Failed to create role' });
    }
});

/**
 * Assign Role to User
 */
router.post('/users/:userId/roles', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('user:update'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { roleId } = req.body;
        
        const result = await userService.assignRole(userId, roleId);
        
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        
        // Log role assignment
        await auditService.logEvent({
            type: 'ROLE_ASSIGNED',
            userId,
            roleId,
            assignedBy: req.user.id,
            timestamp: new Date()
        });
        
        res.json({ success: true, message: 'Role assigned successfully' });
        
    } catch (error) {
        console.error('Assign role error:', error);
        res.status(500).json({ error: 'Failed to assign role' });
    }
});

// =============================================================================
// API KEY MANAGEMENT APIs
// =============================================================================

/**
 * Generate API Key
 */
router.post('/api-keys', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('apikey:create'), async (req, res) => {
    try {
        const { name, permissions, expiresIn } = req.body;
        
        const result = await userService.generateApiKey({
            name,
            permissions,
            expiresIn,
            userId: req.user.id,
            tenantId: req.user.tenantId
        });
        
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        
        // Log API key generation
        await auditService.logEvent({
            type: 'API_KEY_GENERATED',
            apiKeyId: result.apiKey.id,
            name,
            permissions,
            generatedBy: req.user.id,
            timestamp: new Date()
        });
        
        res.status(201).json({
            success: true,
            apiKey: result.apiKey.key,
            id: result.apiKey.id,
            name: result.apiKey.name,
            permissions: result.apiKey.permissions,
            expiresAt: result.apiKey.expiresAt
        });
        
    } catch (error) {
        console.error('Generate API key error:', error);
        res.status(500).json({ error: 'Failed to generate API key' });
    }
});

/**
 * Get API Keys
 */
router.get('/api-keys', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('apikey:read'), async (req, res) => {
    try {
        const apiKeys = await userService.getApiKeys(req.user.id);
        
        // Don't return the actual key values
        const safeApiKeys = apiKeys.map(key => ({
            id: key.id,
            name: key.name,
            permissions: key.permissions,
            createdAt: key.createdAt,
            expiresAt: key.expiresAt,
            lastUsed: key.lastUsed,
            isActive: key.isActive
        }));
        
        res.json(safeApiKeys);
        
    } catch (error) {
        console.error('Get API keys error:', error);
        res.status(500).json({ error: 'Failed to get API keys' });
    }
});

/**
 * Revoke API Key
 */
router.delete('/api-keys/:keyId', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('apikey:delete'), async (req, res) => {
    try {
        const { keyId } = req.params;
        
        const result = await userService.revokeApiKey(keyId, req.user.id);
        
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        
        // Log API key revocation
        await auditService.logEvent({
            type: 'API_KEY_REVOKED',
            apiKeyId: keyId,
            revokedBy: req.user.id,
            timestamp: new Date()
        });
        
        res.json({ success: true, message: 'API key revoked successfully' });
        
    } catch (error) {
        console.error('Revoke API key error:', error);
        res.status(500).json({ error: 'Failed to revoke API key' });
    }
});

// =============================================================================
// SECURITY MONITORING APIs
// =============================================================================

/**
 * Get Security Status
 */
router.get('/status', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('security:read'), async (req, res) => {
    try {
        const status = securityService.getSecurityStatus();
        res.json(status);
        
    } catch (error) {
        console.error('Get security status error:', error);
        res.status(500).json({ error: 'Failed to get security status' });
    }
});

/**
 * Get Security Metrics
 */
router.get('/metrics', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('security:read'), async (req, res) => {
    try {
        const { period = '24h', type } = req.query;
        
        const metrics = await monitoringService.getSecurityMetrics({
            period,
            type,
            tenantId: req.user.tenantId
        });
        
        res.json(metrics);
        
    } catch (error) {
        console.error('Get security metrics error:', error);
        res.status(500).json({ error: 'Failed to get security metrics' });
    }
});

/**
 * Get Active Threats
 */
router.get('/threats', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('security:read'), async (req, res) => {
    try {
        const { severity, status, limit = 50 } = req.query;
        
        const threats = [];
        
        for (const [id, threat] of securityService.securityState.threats) {
            if (severity && threat.severity !== severity) continue;
            if (status && threat.status !== status) continue;
            
            threats.push({
                id,
                type: threat.type,
                severity: threat.severity,
                status: threat.status,
                details: threat.details,
                detectedAt: threat.detectedAt,
                source: threat.source,
                affectedResources: threat.affectedResources
            });
            
            if (threats.length >= limit) break;
        }
        
        res.json(threats);
        
    } catch (error) {
        console.error('Get threats error:', error);
        res.status(500).json({ error: 'Failed to get threats' });
    }
});

/**
 * Get Audit Logs
 */
router.get('/logs', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('audit:read'), async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 100, 
            level, 
            type, 
            userId, 
            startDate, 
            endDate 
        } = req.query;
        
        const logs = await auditService.getAuditLogs({
            page: parseInt(page),
            limit: parseInt(limit),
            level,
            type,
            userId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            tenantId: req.user.tenantId
        });
        
        res.json(logs);
        
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ error: 'Failed to get audit logs' });
    }
});

/**
 * Get Compliance Status
 */
router.get('/compliance', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('compliance:read'), async (req, res) => {
    try {
        const compliance = await auditService.getComplianceStatus({
            tenantId: req.user.tenantId
        });
        
        res.json(compliance);
        
    } catch (error) {
        console.error('Get compliance status error:', error);
        res.status(500).json({ error: 'Failed to get compliance status' });
    }
});

/**
 * Generate Compliance Report
 */
router.post('/compliance/report', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('compliance:generate'), async (req, res) => {
    try {
        const { standard, startDate, endDate, format = 'json' } = req.body;
        
        const report = await auditService.generateComplianceReport({
            standard,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            format,
            tenantId: req.user.tenantId,
            generatedBy: req.user.id
        });
        
        // Log report generation
        await auditService.logEvent({
            type: 'COMPLIANCE_REPORT_GENERATED',
            standard,
            startDate,
            endDate,
            format,
            generatedBy: req.user.id,
            timestamp: new Date()
        });
        
        res.json(report);
        
    } catch (error) {
        console.error('Generate compliance report error:', error);
        res.status(500).json({ error: 'Failed to generate compliance report' });
    }
});

// =============================================================================
// SECURITY ACTIONS APIs
// =============================================================================

/**
 * Block IP Address
 */
router.post('/block-ip', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('security:block'), async (req, res) => {
    try {
        const { ip, reason, duration } = req.body;
        
        if (!ip) {
            return res.status(400).json({ error: 'IP address is required' });
        }
        
        // Block IP
        securityService.securityState.blockedIPs.add(ip);
        
        // Log the block
        await auditService.logSecurityEvent({
            type: 'IP_BLOCKED',
            severity: 'medium',
            ip,
            reason,
            duration,
            blockedBy: req.user.id,
            timestamp: new Date()
        });
        
        res.json({ success: true, message: `IP ${ip} blocked successfully` });
        
    } catch (error) {
        console.error('Block IP error:', error);
        res.status(500).json({ error: 'Failed to block IP' });
    }
});

/**
 * Unblock IP Address
 */
router.post('/unblock-ip', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('security:unblock'), async (req, res) => {
    try {
        const { ip, reason } = req.body;
        
        if (!ip) {
            return res.status(400).json({ error: 'IP address is required' });
        }
        
        // Unblock IP
        securityService.securityState.blockedIPs.delete(ip);
        
        // Log the unblock
        await auditService.logSecurityEvent({
            type: 'IP_UNBLOCKED',
            severity: 'low',
            ip,
            reason,
            unblockedBy: req.user.id,
            timestamp: new Date()
        });
        
        res.json({ success: true, message: `IP ${ip} unblocked successfully` });
        
    } catch (error) {
        console.error('Unblock IP error:', error);
        res.status(500).json({ error: 'Failed to unblock IP' });
    }
});

/**
 * Resolve Threat
 */
router.post('/threats/:threatId/resolve', AuthMiddleware.requireAuth, AuthMiddleware.requirePermission('security:resolve'), async (req, res) => {
    try {
        const { threatId } = req.params;
        const { resolution, notes } = req.body;
        
        const threat = securityService.securityState.threats.get(threatId);
        if (!threat) {
            return res.status(404).json({ error: 'Threat not found' });
        }
        
        // Update threat status
        threat.status = 'resolved';
        threat.resolvedAt = new Date();
        threat.resolution = resolution;
        threat.notes = notes;
        threat.resolvedBy = req.user.id;
        
        // Log the resolution
        await auditService.logSecurityEvent({
            type: 'THREAT_RESOLVED',
            severity: 'low',
            threatId,
            threatType: threat.type,
            resolution,
            notes,
            resolvedBy: req.user.id,
            timestamp: new Date()
        });
        
        res.json({ success: true, message: 'Threat resolved successfully' });
        
    } catch (error) {
        console.error('Resolve threat error:', error);
        res.status(500).json({ error: 'Failed to resolve threat' });
    }
});

/**
 * Health Check
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
            authentication: 'operational',
            authorization: 'operational',
            monitoring: 'operational',
            auditing: 'operational'
        }
    });
});

module.exports = router;