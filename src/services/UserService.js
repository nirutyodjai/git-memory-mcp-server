/**
 * User Service
 * Enterprise-grade user management with RBAC and multi-tenant support
 * รองรับการจัดการผู้ใช้, บทบาท, และสิทธิ์การเข้าถึงแบบครอบคลุม
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const AuthMiddleware = require('../middleware/authMiddleware');
const securityConfig = require('../config/security-config');

class UserService {
    constructor(database = null) {
        this.db = database; // Will be injected
        this.authMiddleware = new AuthMiddleware();
        this.securityConfig = securityConfig;
        
        // In-memory storage for demo (replace with actual database)
        this.users = new Map();
        this.roles = new Map();
        this.permissions = new Map();
        this.tenants = new Map();
        this.sessions = new Map();
        this.loginAttempts = new Map();
        
        this.initializeDefaultData();
    }
    
    /**
     * Initialize default roles, permissions, and admin user
     */
    initializeDefaultData() {
        // Default permissions
        const defaultPermissions = [
            { id: 'read:projects', name: 'Read Projects', description: 'View projects and files' },
            { id: 'write:projects', name: 'Write Projects', description: 'Create and modify projects' },
            { id: 'delete:projects', name: 'Delete Projects', description: 'Delete projects' },
            { id: 'read:users', name: 'Read Users', description: 'View user information' },
            { id: 'write:users', name: 'Write Users', description: 'Create and modify users' },
            { id: 'delete:users', name: 'Delete Users', description: 'Delete users' },
            { id: 'manage:roles', name: 'Manage Roles', description: 'Create and modify roles' },
            { id: 'manage:tenants', name: 'Manage Tenants', description: 'Manage tenant settings' },
            { id: 'access:admin', name: 'Admin Access', description: 'Access admin panel' },
            { id: 'access:api', name: 'API Access', description: 'Access API endpoints' },
            { id: 'collaborate:realtime', name: 'Real-time Collaboration', description: 'Use real-time collaboration features' },
            { id: 'use:ai', name: 'AI Features', description: 'Use AI-powered features' },
            { id: 'debug:advanced', name: 'Advanced Debugging', description: 'Use advanced debugging tools' },
            { id: 'deploy:production', name: 'Production Deployment', description: 'Deploy to production environments' }
        ];
        
        defaultPermissions.forEach(permission => {
            this.permissions.set(permission.id, permission);
        });
        
        // Default roles
        const defaultRoles = [
            {
                id: 'super_admin',
                name: 'Super Administrator',
                description: 'Full system access',
                permissions: Array.from(this.permissions.keys()),
                isSystemRole: true
            },
            {
                id: 'admin',
                name: 'Administrator',
                description: 'Tenant administrator',
                permissions: [
                    'read:projects', 'write:projects', 'delete:projects',
                    'read:users', 'write:users', 'delete:users',
                    'manage:roles', 'access:admin', 'access:api',
                    'collaborate:realtime', 'use:ai', 'debug:advanced'
                ],
                isSystemRole: true
            },
            {
                id: 'developer',
                name: 'Developer',
                description: 'Full development access',
                permissions: [
                    'read:projects', 'write:projects',
                    'read:users', 'access:api',
                    'collaborate:realtime', 'use:ai', 'debug:advanced'
                ],
                isSystemRole: true
            },
            {
                id: 'viewer',
                name: 'Viewer',
                description: 'Read-only access',
                permissions: [
                    'read:projects', 'read:users', 'access:api'
                ],
                isSystemRole: true
            },
            {
                id: 'guest',
                name: 'Guest',
                description: 'Limited access',
                permissions: [
                    'read:projects', 'access:api'
                ],
                isSystemRole: true
            }
        ];
        
        defaultRoles.forEach(role => {
            this.roles.set(role.id, {
                ...role,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        });
        
        // Default tenant
        const defaultTenant = {
            id: 'default',
            name: 'Default Tenant',
            domain: 'localhost',
            settings: {
                maxUsers: 100,
                maxProjects: 50,
                features: ['ai', 'collaboration', 'debugging'],
                customBranding: false
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        this.tenants.set(defaultTenant.id, defaultTenant);
        
        // Default admin user
        this.createDefaultAdmin();
    }
    
    /**
     * Create default admin user
     */
    async createDefaultAdmin() {
        const adminExists = Array.from(this.users.values())
            .some(user => user.roles.includes('super_admin'));
            
        if (!adminExists) {
            const adminUser = {
                id: uuidv4(),
                username: 'admin',
                email: 'admin@nexus-ide.local',
                password: await this.authMiddleware.hashPassword('admin123!'),
                firstName: 'System',
                lastName: 'Administrator',
                roles: ['super_admin'],
                tenantId: 'default',
                isActive: true,
                isVerified: true,
                isSystemUser: true,
                profile: {
                    avatar: null,
                    timezone: 'UTC',
                    language: 'en',
                    theme: 'dark'
                },
                security: {
                    twoFactorEnabled: false,
                    lastPasswordChange: new Date(),
                    loginAttempts: 0,
                    lockedUntil: null
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLoginAt: null
            };
            
            this.users.set(adminUser.id, adminUser);
            console.log('✅ Default admin user created: admin / admin123!');
        }
    }
    
    /**
     * Create new user
     */
    async createUser(userData, creatorId = null) {
        // Validate input
        const validation = this.validateUserData(userData);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Check if user already exists
        const existingUser = this.findUserByEmail(userData.email) || 
                           this.findUserByUsername(userData.username);
        if (existingUser) {
            throw new Error('User with this email or username already exists');
        }
        
        // Hash password
        const hashedPassword = await this.authMiddleware.hashPassword(userData.password);
        
        // Create user object
        const user = {
            id: uuidv4(),
            username: userData.username,
            email: userData.email.toLowerCase(),
            password: hashedPassword,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            roles: userData.roles || ['viewer'],
            tenantId: userData.tenantId || 'default',
            isActive: userData.isActive !== undefined ? userData.isActive : true,
            isVerified: userData.isVerified || false,
            isSystemUser: false,
            profile: {
                avatar: userData.avatar || null,
                timezone: userData.timezone || 'UTC',
                language: userData.language || 'en',
                theme: userData.theme || 'dark',
                bio: userData.bio || '',
                website: userData.website || '',
                location: userData.location || ''
            },
            security: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                backupCodes: [],
                lastPasswordChange: new Date(),
                loginAttempts: 0,
                lockedUntil: null,
                trustedDevices: []
            },
            preferences: {
                notifications: {
                    email: true,
                    push: true,
                    desktop: true
                },
                privacy: {
                    profileVisibility: 'team',
                    activityVisibility: 'team'
                }
            },
            metadata: {
                createdBy: creatorId,
                source: 'manual',
                ipAddress: null,
                userAgent: null
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: null
        };
        
        // Validate roles
        const invalidRoles = user.roles.filter(roleId => !this.roles.has(roleId));
        if (invalidRoles.length > 0) {
            throw new Error(`Invalid roles: ${invalidRoles.join(', ')}`);
        }
        
        // Validate tenant
        if (!this.tenants.has(user.tenantId)) {
            throw new Error(`Invalid tenant: ${user.tenantId}`);
        }
        
        this.users.set(user.id, user);
        
        // Return user without password
        return this.sanitizeUser(user);
    }
    
    /**
     * Authenticate user
     */
    async authenticateUser(identifier, password, options = {}) {
        // Find user by email or username
        const user = this.findUserByEmail(identifier) || 
                    this.findUserByUsername(identifier);
                    
        if (!user) {
            throw new Error('Invalid credentials');
        }
        
        // Check if account is locked
        if (user.security.lockedUntil && user.security.lockedUntil > new Date()) {
            const lockTimeRemaining = Math.ceil((user.security.lockedUntil - new Date()) / 1000 / 60);
            throw new Error(`Account locked. Try again in ${lockTimeRemaining} minutes.`);
        }
        
        // Check if account is active
        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }
        
        // Verify password
        const isValidPassword = await this.authMiddleware.verifyPassword(password, user.password);
        
        if (!isValidPassword) {
            await this.handleFailedLogin(user.id);
            throw new Error('Invalid credentials');
        }
        
        // Reset login attempts on successful login
        await this.resetLoginAttempts(user.id);
        
        // Update last login
        user.lastLoginAt = new Date();
        user.updatedAt = new Date();
        
        // Generate tokens
        const tokenPayload = {
            userId: user.id,
            username: user.username,
            email: user.email,
            roles: user.roles,
            tenantId: user.tenantId,
            permissions: this.getUserPermissions(user.id)
        };
        
        const accessToken = this.authMiddleware.generateToken(tokenPayload);
        const refreshToken = this.authMiddleware.generateRefreshToken({ userId: user.id });
        
        // Create session
        const session = {
            id: uuidv4(),
            userId: user.id,
            accessToken,
            refreshToken,
            ipAddress: options.ipAddress,
            userAgent: options.userAgent,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            isActive: true
        };
        
        this.sessions.set(session.id, session);
        
        return {
            user: this.sanitizeUser(user),
            tokens: {
                accessToken,
                refreshToken,
                expiresIn: 24 * 60 * 60 // 24 hours in seconds
            },
            session: {
                id: session.id,
                expiresAt: session.expiresAt
            }
        };
    }
    
    /**
     * Handle failed login attempt
     */
    async handleFailedLogin(userId) {
        const user = this.users.get(userId);
        if (!user) return;
        
        user.security.loginAttempts += 1;
        user.updatedAt = new Date();
        
        const maxAttempts = this.securityConfig.get('account').maxLoginAttempts;
        const lockoutDuration = this.securityConfig.get('account').lockoutDuration;
        
        if (user.security.loginAttempts >= maxAttempts) {
            user.security.lockedUntil = new Date(Date.now() + lockoutDuration);
            console.warn(`🔒 User account locked: ${user.email} (${user.security.loginAttempts} failed attempts)`);
        }
    }
    
    /**
     * Reset login attempts
     */
    async resetLoginAttempts(userId) {
        const user = this.users.get(userId);
        if (!user) return;
        
        user.security.loginAttempts = 0;
        user.security.lockedUntil = null;
        user.updatedAt = new Date();
    }
    
    /**
     * Get user by ID
     */
    getUserById(userId) {
        const user = this.users.get(userId);
        return user ? this.sanitizeUser(user) : null;
    }
    
    /**
     * Find user by email
     */
    findUserByEmail(email) {
        return Array.from(this.users.values())
            .find(user => user.email.toLowerCase() === email.toLowerCase());
    }
    
    /**
     * Find user by username
     */
    findUserByUsername(username) {
        return Array.from(this.users.values())
            .find(user => user.username.toLowerCase() === username.toLowerCase());
    }
    
    /**
     * Update user
     */
    async updateUser(userId, updates, updaterId = null) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Validate updates
        const allowedFields = [
            'firstName', 'lastName', 'email', 'username', 'roles',
            'isActive', 'profile', 'preferences'
        ];
        
        const updateData = {};
        Object.keys(updates).forEach(key => {
            if (Array.isArray(allowedFields) && allowedFields.includes(key)) {
                updateData[key] = updates[key];
            }
        });
        
        // Validate email uniqueness if changed
        if (updateData.email && updateData.email !== user.email) {
            const existingUser = this.findUserByEmail(updateData.email);
            if (existingUser && existingUser.id !== userId) {
                throw new Error('Email already in use');
            }
        }
        
        // Validate username uniqueness if changed
        if (updateData.username && updateData.username !== user.username) {
            const existingUser = this.findUserByUsername(updateData.username);
            if (existingUser && existingUser.id !== userId) {
                throw new Error('Username already in use');
            }
        }
        
        // Validate roles
        if (updateData.roles) {
            const invalidRoles = Array.isArray(updateData.roles) ? 
                updateData.roles.filter(roleId => !this.roles.has(roleId)) : [];
            if (invalidRoles.length > 0) {
                throw new Error(`Invalid roles: ${invalidRoles.join(', ')}`);
            }
        }
        
        // Apply updates
        Object.assign(user, updateData);
        user.updatedAt = new Date();
        
        if (updaterId) {
            user.metadata.lastUpdatedBy = updaterId;
        }
        
        return this.sanitizeUser(user);
    }
    
    /**
     * Delete user
     */
    async deleteUser(userId, deleterId = null) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Prevent deletion of system users
        if (user.isSystemUser) {
            throw new Error('Cannot delete system user');
        }
        
        // Soft delete - mark as inactive
        user.isActive = false;
        user.deletedAt = new Date();
        user.updatedAt = new Date();
        
        if (deleterId) {
            user.metadata.deletedBy = deleterId;
        }
        
        // Invalidate all sessions
        this.invalidateUserSessions(userId);
        
        return true;
    }
    
    /**
     * Get user permissions
     */
    getUserPermissions(userId) {
        const user = this.users.get(userId);
        if (!user) return [];
        
        const permissions = new Set();
        
        user.roles.forEach(roleId => {
            const role = this.roles.get(roleId);
            if (role) {
                role.permissions.forEach(permission => {
                    permissions.add(permission);
                });
            }
        });
        
        return Array.from(permissions);
    }
    
    /**
     * Check if user has permission
     */
    hasPermission(userId, permission) {
        const userPermissions = this.getUserPermissions(userId);
        return Array.isArray(userPermissions) && userPermissions.includes(permission);
    }
    
    /**
     * Check if user has role
     */
    hasRole(userId, role) {
        const user = this.users.get(userId);
        return user && Array.isArray(user.roles) ? user.roles.includes(role) : false;
    }
    
    /**
     * Get users by tenant
     */
    getUsersByTenant(tenantId, options = {}) {
        const { page = 1, limit = 50, search = '', roles = [] } = options;
        
        let users = Array.from(this.users.values())
            .filter(user => user.tenantId === tenantId);
            
        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            users = users.filter(user => 
                user.username.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower) ||
                user.firstName.toLowerCase().includes(searchLower) ||
                user.lastName.toLowerCase().includes(searchLower)
            );
        }
        
        // Apply role filter
        if (Array.isArray(roles) && roles.length > 0) {
            users = users.filter(user => 
                Array.isArray(user.roles) && user.roles.some(role => roles.includes(role))
            );
        }
        
        // Apply pagination
        const total = users.length;
        const offset = (page - 1) * limit;
        users = users.slice(offset, offset + limit);
        
        return {
            users: users.map(user => this.sanitizeUser(user)),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    
    /**
     * Invalidate user sessions
     */
    invalidateUserSessions(userId) {
        Array.from(this.sessions.values())
            .filter(session => session.userId === userId)
            .forEach(session => {
                session.isActive = false;
                session.invalidatedAt = new Date();
            });
    }
    
    /**
     * Validate user data
     */
    validateUserData(userData) {
        const errors = [];
        
        // Required fields
        if (!userData.username || userData.username.length < 3) {
            errors.push('Username must be at least 3 characters long');
        }
        
        if (!userData.email || !this.isValidEmail(userData.email)) {
            errors.push('Valid email address is required');
        }
        
        if (!userData.password || userData.password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        
        // Password strength
        if (userData.password && !this.isStrongPassword(userData.password)) {
            errors.push('Password must contain uppercase, lowercase, number, and special character');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Check password strength
     */
    isStrongPassword(password) {
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
        
        return hasUpper && hasLower && hasNumber && hasSpecial;
    }
    
    /**
     * Sanitize user object (remove sensitive data)
     */
    sanitizeUser(user) {
        const { password, security, ...sanitizedUser } = user;
        return {
            ...sanitizedUser,
            permissions: this.getUserPermissions(user.id),
            security: {
                twoFactorEnabled: security.twoFactorEnabled,
                lastPasswordChange: security.lastPasswordChange
            }
        };
    }
    
    /**
     * Get service statistics
     */
    getStats() {
        const totalUsers = this.users.size;
        const activeUsers = Array.from(this.users.values())
            .filter(user => user.isActive).length;
        const verifiedUsers = Array.from(this.users.values())
            .filter(user => user.isVerified).length;
        const activeSessions = Array.from(this.sessions.values())
            .filter(session => session.isActive).length;
            
        return {
            users: {
                total: totalUsers,
                active: activeUsers,
                verified: verifiedUsers,
                inactive: totalUsers - activeUsers
            },
            sessions: {
                active: activeSessions,
                total: this.sessions.size
            },
            roles: this.roles.size,
            permissions: this.permissions.size,
            tenants: this.tenants.size
        };
    }
}

module.exports = UserService;