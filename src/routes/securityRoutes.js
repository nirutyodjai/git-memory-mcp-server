/**
 * Security Routes
 * Enterprise-grade security API endpoints
 * รองรับการจัดการความปลอดภัยแบบครบวงจร
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const SecurityMiddleware = require('../middleware/securityMiddleware');
const AuthMiddleware = require('../middleware/authMiddleware');
const UserService = require('../services/userService');
const AuditService = require('../services/auditService');
const MonitoringService = require('../services/monitoringService');
const securityConfig = require('../config/security-config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

class SecurityRoutes {
    constructor() {
        this.router = express.Router();
        this.securityMiddleware = new SecurityMiddleware();
        this.authMiddleware = new AuthMiddleware();
        this.userService = new UserService();
        this.auditService = new AuditService();
        this.monitoringService = new MonitoringService();
        
        this.setupRoutes();
    }
    
    /**
     * Setup all security routes
     */
    setupRoutes() {
        // Authentication routes
        this.setupAuthRoutes();
        
        // User management routes
        this.setupUserRoutes();
        
        // Role and permission routes
        this.setupRoleRoutes();
        
        // API key management routes
        this.setupApiKeyRoutes();
        
        // Security monitoring routes
        this.setupMonitoringRoutes();
        
        // Audit log routes
        this.setupAuditRoutes();
        
        // Security configuration routes
        this.setupConfigRoutes();
        
        // Health check routes
        this.setupHealthRoutes();
        
        console.log('✅ Security Routes initialized successfully');
    }
    
    /**
     * Setup authentication routes
     */
    setupAuthRoutes() {
        // Login rate limiting
        const loginRateLimit = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // 5 attempts per window
            message: {
                error: 'Too many login attempts',
                message: 'Please try again later'
            },
            standardHeaders: true,
            legacyHeaders: false
        });
        
        // POST /auth/login - User login
        this.router.post('/auth/login',
            loginRateLimit,
            this.securityMiddleware.validateInput([
                body('email').isEmail().normalizeEmail(),
                body('password').isLength({ min: 8 }),
                body('tenantId').optional().isString()
            ]),
            async (req, res) => {
                try {
                    const { email, password, tenantId } = req.body;
                    
                    // Authenticate user
                    const result = await this.userService.authenticateUser(email, password, tenantId);
                    
                    if (!result.success) {
                        this.auditService.logSecurityEvent({
                            type: 'LOGIN_FAILED',
                            severity: 'medium',
                            email,
                            reason: result.message,
                            ip: req.ip,
                            userAgent: req.get('User-Agent')
                        });
                        
                        return res.status(401).json({
                            error: 'Authentication failed',
                            message: result.message
                        });
                    }
                    
                    // Generate JWT token
                    const token = jwt.sign(
                        {
                            userId: result.user.id,
                            email: result.user.email,
                            tenantId: result.user.tenantId,
                            roles: result.user.roles
                        },
                        securityConfig.jwt.secret,
                        {
                            expiresIn: securityConfig.jwt.expiresIn,
                            issuer: securityConfig.jwt.issuer,
                            audience: securityConfig.jwt.audience
                        }
                    );
                    
                    // Generate refresh token
                    const refreshToken = crypto.randomBytes(64).toString('hex');
                    
                    // Store refresh token
                    await this.userService.storeRefreshToken(result.user.id, refreshToken);
                    
                    // Generate CSRF token for session
                    const csrfToken = this.securityMiddleware.generateCSRFToken();
                    req.session.csrfToken = csrfToken;
                    
                    // Log successful login
                    this.auditService.logEvent({
                        type: 'USER_LOGIN_SUCCESS',
                        userId: result.user.id,
                        email: result.user.email,
                        tenantId: result.user.tenantId,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    });
                    
                    res.json({
                        success: true,
                        message: 'Login successful',
                        data: {
                            token,
                            refreshToken,
                            csrfToken,
                            user: {
                                id: result.user.id,
                                email: result.user.email,
                                name: result.user.name,
                                roles: result.user.roles,
                                permissions: result.user.permissions,
                                tenantId: result.user.tenantId
                            },
                            expiresIn: securityConfig.jwt.expiresIn
                        }
                    });
                    
                } catch (error) {
                    console.error('Login error:', error);
                    this.auditService.logSecurityEvent({
                        type: 'LOGIN_ERROR',
                        severity: 'high',
                        error: error.message,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    });
                    
                    res.status(500).json({
                        error: 'Login failed',
                        message: 'An error occurred during login'
                    });
                }
            }
        );
        
        // POST /auth/refresh - Refresh JWT token
        this.router.post('/auth/refresh',
            this.securityMiddleware.validateInput([
                body('refreshToken').isString().isLength({ min: 64 })
            ]),
            async (req, res) => {
                try {
                    const { refreshToken } = req.body;
                    
                    // Validate refresh token
                    const result = await this.userService.validateRefreshToken(refreshToken);
                    
                    if (!result.success) {
                        return res.status(401).json({
                            error: 'Invalid refresh token',
                            message: result.message
                        });
                    }
                    
                    // Generate new JWT token
                    const newToken = jwt.sign(
                        {
                            userId: result.user.id,
                            email: result.user.email,
                            tenantId: result.user.tenantId,
                            roles: result.user.roles
                        },
                        securityConfig.jwt.secret,
                        {
                            expiresIn: securityConfig.jwt.expiresIn,
                            issuer: securityConfig.jwt.issuer,
                            audience: securityConfig.jwt.audience
                        }
                    );
                    
                    // Log token refresh
                    this.auditService.logEvent({
                        type: 'TOKEN_REFRESHED',
                        userId: result.user.id,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    });
                    
                    res.json({
                        success: true,
                        message: 'Token refreshed successfully',
                        data: {
                            token: newToken,
                            expiresIn: securityConfig.jwt.expiresIn
                        }
                    });
                    
                } catch (error) {
                    console.error('Token refresh error:', error);
                    res.status(500).json({
                        error: 'Token refresh failed',
                        message: 'An error occurred during token refresh'
                    });
                }
            }
        );
        
        // POST /auth/logout - User logout
        this.router.post('/auth/logout',
            this.securityMiddleware.authenticateJWT(),
            async (req, res) => {
                try {
                    const { user, token } = req;
                    
                    // Blacklist the current token
                    await this.userService.blacklistToken(token);
                    
                    // Revoke refresh tokens
                    await this.userService.revokeRefreshTokens(user.id);
                    
                    // Clear session
                    req.session.destroy();
                    
                    // Log logout
                    this.auditService.logEvent({
                        type: 'USER_LOGOUT',
                        userId: user.id,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    });
                    
                    res.json({
                        success: true,
                        message: 'Logout successful'
                    });
                    
                } catch (error) {
                    console.error('Logout error:', error);
                    res.status(500).json({
                        error: 'Logout failed',
                        message: 'An error occurred during logout'
                    });
                }
            }
        );
        
        // POST /auth/register - User registration
        this.router.post('/auth/register',
            this.securityMiddleware.validateInput([
                body('email').isEmail().normalizeEmail(),
                body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
                body('name').isString().isLength({ min: 2, max: 100 }),
                body('tenantId').optional().isString()
            ]),
            async (req, res) => {
                try {
                    const { email, password, name, tenantId } = req.body;
                    
                    // Create user
                    const result = await this.userService.createUser({
                        email,
                        password,
                        name,
                        tenantId,
                        roles: ['user'] // Default role
                    });
                    
                    if (!result.success) {
                        return res.status(400).json({
                            error: 'Registration failed',
                            message: result.message
                        });
                    }
                    
                    // Log registration
                    this.auditService.logEvent({
                        type: 'USER_REGISTERED',
                        userId: result.user.id,
                        email: result.user.email,
                        tenantId: result.user.tenantId,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    });
                    
                    res.status(201).json({
                        success: true,
                        message: 'Registration successful',
                        data: {
                            user: {
                                id: result.user.id,
                                email: result.user.email,
                                name: result.user.name,
                                tenantId: result.user.tenantId
                            }
                        }
                    });
                    
                } catch (error) {
                    console.error('Registration error:', error);
                    res.status(500).json({
                        error: 'Registration failed',
                        message: 'An error occurred during registration'
                    });
                }
            }
        );
    }
    
    /**
     * Setup user management routes
     */
    setupUserRoutes() {
        // GET /users - List users (admin only)
        this.router.get('/users',
            this.securityMiddleware.authenticateJWT(),
            this.securityMiddleware.authorize(['admin', 'user_manager']),
            this.securityMiddleware.requireTenant(),
            this.securityMiddleware.validateInput([
                query('page').optional().isInt({ min: 1 }),
                query('limit').optional().isInt({ min: 1, max: 100 }),
                query('search').optional().isString(),
                query('role').optional().isString()
            ]),
            async (req, res) => {
                try {
                    const { page = 1, limit = 20, search, role } = req.query;
                    const { tenantId } = req;
                    
                    const result = await this.userService.getUsers({
                        tenantId,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        search,
                        role
                    });
                    
                    res.json({
                        success: true,
                        data: result
                    });
                    
                } catch (error) {
                    console.error('Get users error:', error);
                    res.status(500).json({
                        error: 'Failed to get users',
                        message: 'An error occurred while fetching users'
                    });
                }
            }
        );
        
        // GET /users/:id - Get user by ID
        this.router.get('/users/:id',
            this.securityMiddleware.authenticateJWT(),
            this.securityMiddleware.validateInput([
                param('id').isString()
            ]),
            async (req, res) => {
                try {
                    const { id } = req.params;
                    const { user } = req;
                    
                    // Users can only view their own profile unless they're admin
                    if (id !== user.id && !user.roles.includes('admin')) {
                        return res.status(403).json({
                            error: 'Access denied',
                            message: 'You can only view your own profile'
                        });
                    }
                    
                    const targetUser = await this.userService.getUserById(id);
                    
                    if (!targetUser) {
                        return res.status(404).json({
                            error: 'User not found',
                            message: 'The requested user does not exist'
                        });
                    }
                    
                    res.json({
                        success: true,
                        data: {
                            user: {
                                id: targetUser.id,
                                email: targetUser.email,
                                name: targetUser.name,
                                roles: targetUser.roles,
                                permissions: targetUser.permissions,
                                tenantId: targetUser.tenantId,
                                isActive: targetUser.isActive,
                                createdAt: targetUser.createdAt,
                                updatedAt: targetUser.updatedAt
                            }
                        }
                    });
                    
                } catch (error) {
                    console.error('Get user error:', error);
                    res.status(500).json({
                        error: 'Failed to get user',
                        message: 'An error occurred while fetching user'
                    });
                }
            }
        );
        
        // PUT /users/:id - Update user
        this.router.put('/users/:id',
            this.securityMiddleware.authenticateJWT(),
            this.securityMiddleware.validateInput([
                param('id').isString(),
                body('name').optional().isString().isLength({ min: 2, max: 100 }),
                body('email').optional().isEmail().normalizeEmail(),
                body('roles').optional().isArray(),
                body('isActive').optional().isBoolean()
            ]),
            async (req, res) => {
                try {
                    const { id } = req.params;
                    const { user } = req;
                    const updateData = req.body;
                    
                    // Users can only update their own profile unless they're admin
                    if (id !== user.id && !user.roles.includes('admin')) {
                        return res.status(403).json({
                            error: 'Access denied',
                            message: 'You can only update your own profile'
                        });
                    }
                    
                    // Non-admin users cannot update roles or active status
                    if (!user.roles.includes('admin')) {
                        delete updateData.roles;
                        delete updateData.isActive;
                    }
                    
                    const result = await this.userService.updateUser(id, updateData);
                    
                    if (!result.success) {
                        return res.status(400).json({
                            error: 'Update failed',
                            message: result.message
                        });
                    }
                    
                    // Log user update
                    this.auditService.logEvent({
                        type: 'USER_UPDATED',
                        userId: id,
                        updatedBy: user.id,
                        changes: updateData,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    });
                    
                    res.json({
                        success: true,
                        message: 'User updated successfully',
                        data: {
                            user: result.user
                        }
                    });
                    
                } catch (error) {
                    console.error('Update user error:', error);
                    res.status(500).json({
                        error: 'Update failed',
                        message: 'An error occurred while updating user'
                    });
                }
            }
        );
        
        // DELETE /users/:id - Delete user (admin only)
        this.router.delete('/users/:id',
            this.securityMiddleware.authenticateJWT(),
            this.securityMiddleware.authorize(['admin']),
            this.securityMiddleware.validateInput([
                param('id').isString()
            ]),
            async (req, res) => {
                try {
                    const { id } = req.params;
                    const { user } = req;
                    
                    // Prevent self-deletion
                    if (id === user.id) {
                        return res.status(400).json({
                            error: 'Cannot delete yourself',
                            message: 'You cannot delete your own account'
                        });
                    }
                    
                    const result = await this.userService.deleteUser(id);
                    
                    if (!result.success) {
                        return res.status(400).json({
                            error: 'Delete failed',
                            message: result.message
                        });
                    }
                    
                    // Log user deletion
                    this.auditService.logEvent({
                        type: 'USER_DELETED',
                        userId: id,
                        deletedBy: user.id,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    });
                    
                    res.json({
                        success: true,
                        message: 'User deleted successfully'
                    });
                    
                } catch (error) {
                    console.error('Delete user error:', error);
                    res.status(500).json({
                        error: 'Delete failed',
                        message: 'An error occurred while deleting user'
                    });
                }
            }
        );
    }
    
    /**
     * Setup role and permission routes
     */
    setupRoleRoutes() {
        // GET /roles - List all roles
        this.router.get('/roles',
            this.securityMiddleware.authenticateJWT(),
            this.securityMiddleware.authorize(['admin', 'user_manager']),
            async (req, res) => {
                try {
                    const roles = await this.userService.getAllRoles();
                    
                    res.json({
                        success: true,
                        data: { roles }
                    });
                    
                } catch (error) {
                    console.error('Get roles error:', error);
                    res.status(500).json({
                        error: 'Failed to get roles',
                        message: 'An error occurred while fetching roles'
                    });
                }
            }
        );
        
        // GET /permissions - List all permissions
        this.router.get('/permissions',
            this.securityMiddleware.authenticateJWT(),
            this.securityMiddleware.authorize(['admin', 'user_manager']),
            async (req, res) => {
                try {
                    const permissions = await this.userService.getAllPermissions();
                    
                    res.json({
                        success: true,
                        data: { permissions }
                    });
                    
                } catch (error) {
                    console.error('Get permissions error:', error);
                    res.status(500).json({
                        error: 'Failed to get permissions',
                        message: 'An error occurred while fetching permissions'
                    });
                }
            }
        );
    }
    
    /**
     * Setup API key management routes
     */
    setupApiKeyRoutes() {
        // GET /api-keys - List user's API keys
        this.router.get('/api-keys',
            this.securityMiddleware.authenticateJWT(),
            async (req, res) => {
                try {
                    const { user } = req;
                    
                    const apiKeys = await this.userService.getUserApiKeys(user.id);
                    
                    res.json({
                        success: true,
                        data: { apiKeys }
                    });
                    
                } catch (error) {
                    console.error('Get API keys error:', error);
                    res.status(500).json({
                        error: 'Failed to get API keys',
                        message: 'An error occurred while fetching API keys'
                    });
                }
            }
        );
        
        // POST /api-keys - Create new API key
        this.router.post('/api-keys',
            this.securityMiddleware.authenticateJWT(),
            this.securityMiddleware.validateInput([
                body('name').isString().isLength({ min: 1, max: 100 }),
                body('permissions').optional().isArray(),
                body('expiresAt').optional().isISO8601()
            ]),
            async (req, res) => {
                try {
                    const { user } = req;
                    const { name, permissions, expiresAt } = req.body;
                    
                    const result = await this.userService.createApiKey({
                        userId: user.id,
                        name,
                        permissions,
                        expiresAt
                    });
                    
                    if (!result.success) {
                        return res.status(400).json({
                            error: 'API key creation failed',
                            message: result.message
                        });
                    }
                    
                    // Log API key creation
                    this.auditService.logEvent({
                        type: 'API_KEY_CREATED',
                        userId: user.id,
                        apiKeyId: result.apiKey.id,
                        apiKeyName: name,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    });
                    
                    res.status(201).json({
                        success: true,
                        message: 'API key created successfully',
                        data: {
                            apiKey: result.apiKey
                        }
                    });
                    
                } catch (error) {
                    console.error('Create API key error:', error);
                    res.status(500).json({
                        error: 'API key creation failed',
                        message: 'An error occurred while creating API key'
                    });
                }
            }
        );
        
        // DELETE /api-keys/:id - Revoke API key
        this.router.delete('/api-keys/:id',
            this.securityMiddleware.authenticateJWT(),
            this.securityMiddleware.validateInput([
                param('id').isString()
            ]),
            async (req, res) => {
                try {
                    const { id } = req.params;
                    const { user } = req;
                    
                    const result = await this.userService.revokeApiKey(id, user.id);
                    
                    if (!result.success) {
                        return res.status(400).json({
                            error: 'API key revocation failed',
                            message: result.message
                        });
                    }
                    
                    // Log API key revocation
                    this.auditService.logEvent({
                        type: 'API_KEY_REVOKED',
                        userId: user.id,
                        apiKeyId: id,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    });
                    
                    res.json({
                        success: true,
                        message: 'API key revoked successfully'
                    });
                    
                } catch (error) {
                    console.error('Revoke API key error:', error);
                    res.status(500).json({
                        error: 'API key revocation failed',
                        message: 'An error occurred while revoking API key'
                    });
                }
            }
        );
    }
    
    /**
     * Setup security monitoring routes
     */
    setupMonitoringRoutes() {
        // GET /security/status - Get security status
        this.router.get('/security/status',
            this.securityMiddleware.authenticateJWT(),
            this.securityMiddleware.authorize(['admin', 'security_manager']),
            async (req, res) => {
                try {
                    const status = await this.monitoringService.getSecurityStatus();
                    
                    res.json({
                        success: true,
                        data: status
                    });
                    
                } catch (error) {
                    console.error('Get security status error:', error);
                    res.status(500).json({
                        error: 'Failed to get security status',
                        message: 'An error occurred while fetching security status'
                    });
                }
            }
        );
        
        // GET /security/alerts - Get security alerts
        this.router.get('/security/alerts',
            this.securityMiddleware.authenticateJWT(),
            this.securityMiddleware.authorize(['admin', 'security_manager']),
            this.securityMiddleware.validateInput([
                query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
                query('limit').optional().isInt({ min: 1, max: 100 })
            ]),
            async (req, res) => {
                try {
                    const { severity, limit = 50 } = req.query;
                    
                    const alerts = await this.monitoringService.getSecurityAlerts({
                        severity,
                        limit: parseInt(limit)
                    });
                    
                    res.json({
                        success: true,
                        data: { alerts }
                    });
                    
                } catch (error) {
                    console.error('Get security alerts error:', error);
                    res.status(500).json({
                        error: 'Failed to get security alerts',
                        message: 'An error occurred while fetching security alerts'
                    });
                }
            }
        );
    }
    
    /**
     * Setup audit log routes
     */
    setupAuditRoutes() {
        // GET /audit/logs - Get audit logs
        this.router.get('/audit/logs',
            this.securityMiddleware.authenticateJWT(),
            this.securityMiddleware.authorize(['admin', 'auditor']),
            this.securityMiddleware.validateInput([
                query('page').optional().isInt({ min: 1 }),
                query('limit').optional().isInt({ min: 1, max: 100 }),
                query('type').optional().isString(),
                query('userId').optional().isString(),
                query('startDate').optional().isISO8601(),
                query('endDate').optional().isISO8601()
            ]),
            async (req, res) => {
                try {
                    const {
                        page = 1,
                        limit = 50,
                        type,
                        userId,
                        startDate,
                        endDate
                    } = req.query;
                    
                    const logs = await this.auditService.getLogs({
                        page: parseInt(page),
                        limit: parseInt(limit),
                        type,
                        userId,
                        startDate: startDate ? new Date(startDate) : undefined,
                        endDate: endDate ? new Date(endDate) : undefined
                    });
                    
                    res.json({
                        success: true,
                        data: logs
                    });
                    
                } catch (error) {
                    console.error('Get audit logs error:', error);
                    res.status(500).json({
                        error: 'Failed to get audit logs',
                        message: 'An error occurred while fetching audit logs'
                    });
                }
            }
        );
        
        // GET /audit/reports - Generate audit reports
        this.router.get('/audit/reports',
            this.securityMiddleware.authenticateJWT(),
            this.securityMiddleware.authorize(['admin', 'auditor']),
            this.securityMiddleware.validateInput([
                query('type').isIn(['security', 'compliance', 'activity']),
                query('startDate').isISO8601(),
                query('endDate').isISO8601(),
                query('format').optional().isIn(['json', 'csv', 'pdf'])
            ]),
            async (req, res) => {
                try {
                    const {
                        type,
                        startDate,
                        endDate,
                        format = 'json'
                    } = req.query;
                    
                    const report = await this.auditService.generateReport({
                        type,
                        startDate: new Date(startDate),
                        endDate: new Date(endDate),
                        format
                    });
                    
                    if (format === 'json') {
                        res.json({
                            success: true,
                            data: report
                        });
                    } else {
                        res.setHeader('Content-Type', report.contentType);
                        res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
                        res.send(report.data);
                    }
                    
                } catch (error) {
                    console.error('Generate audit report error:', error);
                    res.status(500).json({
                        error: 'Failed to generate audit report',
                        message: 'An error occurred while generating audit report'
                    });
                }
            }
        );
    }
    
    /**
     * Setup security configuration routes
     */
    setupConfigRoutes() {
        // GET /security/config - Get security configuration
        this.router.get('/security/config',
            this.securityMiddleware.authenticateJWT(),
            this.securityMiddleware.authorize(['admin']),
            async (req, res) => {
                try {
                    // Return sanitized config (remove sensitive data)
                    const config = {
                        rateLimiting: securityConfig.rateLimiting,
                        cors: {
                            allowedOrigins: securityConfig.cors.allowedOrigins,
                            methods: securityConfig.cors.methods,
                            credentials: securityConfig.cors.credentials
                        },
                        jwt: {
                            expiresIn: securityConfig.jwt.expiresIn,
                            issuer: securityConfig.jwt.issuer,
                            audience: securityConfig.jwt.audience
                        },
                        encryption: {
                            algorithm: securityConfig.encryption.algorithm
                        },
                        compliance: securityConfig.compliance
                    };
                    
                    res.json({
                        success: true,
                        data: { config }
                    });
                    
                } catch (error) {
                    console.error('Get security config error:', error);
                    res.status(500).json({
                        error: 'Failed to get security config',
                        message: 'An error occurred while fetching security config'
                    });
                }
            }
        );
    }
    
    /**
     * Setup health check routes
     */
    setupHealthRoutes() {
        // GET /security/health - Security health check
        this.router.get('/security/health', async (req, res) => {
            try {
                const health = {
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    services: {
                        authentication: 'operational',
                        authorization: 'operational',
                        audit: 'operational',
                        monitoring: 'operational'
                    },
                    version: '1.0.0'
                };
                
                res.json(health);
                
            } catch (error) {
                console.error('Security health check error:', error);
                res.status(500).json({
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    error: error.message
                });
            }
        });
    }
    
    /**
     * Get router instance
     */
    getRouter() {
        return this.router;
    }
}

module.exports = SecurityRoutes;