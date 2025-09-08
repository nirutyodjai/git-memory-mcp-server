/**
 * Permission and Role-Based Access Control (RBAC) Middleware
 * Advanced permission system for NEXUS IDE
 */

const { User } = require('../models/User');

// Permission definitions
const PERMISSIONS = {
    // Project permissions
    PROJECT: {
        CREATE: 'project:create',
        READ: 'project:read',
        UPDATE: 'project:update',
        DELETE: 'project:delete',
        SHARE: 'project:share',
        ADMIN: 'project:admin'
    },
    
    // File permissions
    FILE: {
        CREATE: 'file:create',
        READ: 'file:read',
        UPDATE: 'file:update',
        DELETE: 'file:delete',
        EXECUTE: 'file:execute'
    },
    
    // AI permissions
    AI: {
        USE_ASSISTANT: 'ai:use_assistant',
        CODE_COMPLETION: 'ai:code_completion',
        CODE_REVIEW: 'ai:code_review',
        GENERATE_CODE: 'ai:generate_code',
        ANALYZE_CODE: 'ai:analyze_code'
    },
    
    // Collaboration permissions
    COLLABORATION: {
        INVITE_USERS: 'collaboration:invite_users',
        MANAGE_TEAM: 'collaboration:manage_team',
        LIVE_SHARE: 'collaboration:live_share',
        COMMENT: 'collaboration:comment',
        REVIEW: 'collaboration:review'
    },
    
    // Git permissions
    GIT: {
        CLONE: 'git:clone',
        PUSH: 'git:push',
        PULL: 'git:pull',
        MERGE: 'git:merge',
        BRANCH: 'git:branch',
        TAG: 'git:tag'
    },
    
    // Admin permissions
    ADMIN: {
        MANAGE_USERS: 'admin:manage_users',
        MANAGE_SUBSCRIPTIONS: 'admin:manage_subscriptions',
        VIEW_ANALYTICS: 'admin:view_analytics',
        SYSTEM_CONFIG: 'admin:system_config',
        BILLING: 'admin:billing'
    },
    
    // API permissions
    API: {
        CREATE_KEY: 'api:create_key',
        MANAGE_KEYS: 'api:manage_keys',
        UNLIMITED_REQUESTS: 'api:unlimited_requests'
    }
};

// Role definitions with default permissions
const ROLES = {
    USER: {
        name: 'user',
        permissions: [
            PERMISSIONS.PROJECT.CREATE,
            PERMISSIONS.PROJECT.READ,
            PERMISSIONS.PROJECT.UPDATE,
            PERMISSIONS.PROJECT.DELETE,
            PERMISSIONS.FILE.CREATE,
            PERMISSIONS.FILE.READ,
            PERMISSIONS.FILE.UPDATE,
            PERMISSIONS.FILE.DELETE,
            PERMISSIONS.FILE.EXECUTE,
            PERMISSIONS.AI.USE_ASSISTANT,
            PERMISSIONS.AI.CODE_COMPLETION,
            PERMISSIONS.COLLABORATION.COMMENT,
            PERMISSIONS.GIT.CLONE,
            PERMISSIONS.GIT.PUSH,
            PERMISSIONS.GIT.PULL,
            PERMISSIONS.API.CREATE_KEY
        ]
    },
    
    PRO_USER: {
        name: 'pro_user',
        permissions: [
            ...ROLES.USER.permissions,
            PERMISSIONS.AI.CODE_REVIEW,
            PERMISSIONS.AI.GENERATE_CODE,
            PERMISSIONS.AI.ANALYZE_CODE,
            PERMISSIONS.COLLABORATION.INVITE_USERS,
            PERMISSIONS.COLLABORATION.LIVE_SHARE,
            PERMISSIONS.COLLABORATION.REVIEW,
            PERMISSIONS.GIT.MERGE,
            PERMISSIONS.GIT.BRANCH,
            PERMISSIONS.PROJECT.SHARE
        ]
    },
    
    TEAM_ADMIN: {
        name: 'team_admin',
        permissions: [
            ...ROLES.PRO_USER.permissions,
            PERMISSIONS.COLLABORATION.MANAGE_TEAM,
            PERMISSIONS.PROJECT.ADMIN,
            PERMISSIONS.GIT.TAG,
            PERMISSIONS.API.MANAGE_KEYS
        ]
    },
    
    ADMIN: {
        name: 'admin',
        permissions: [
            ...Object.values(PERMISSIONS).flatMap(category => Object.values(category))
        ]
    }
};

// Subscription tier permissions
const SUBSCRIPTION_PERMISSIONS = {
    free: {
        maxProjects: 3,
        maxCollaborators: 1,
        maxAIRequests: 100,
        maxStorageGB: 1,
        features: ['basic_ai', 'git_integration']
    },
    
    pro: {
        maxProjects: 25,
        maxCollaborators: 5,
        maxAIRequests: 1000,
        maxStorageGB: 10,
        features: ['advanced_ai', 'code_review', 'live_collaboration', 'priority_support']
    },
    
    team: {
        maxProjects: 100,
        maxCollaborators: 25,
        maxAIRequests: 5000,
        maxStorageGB: 50,
        features: ['team_management', 'advanced_analytics', 'custom_integrations']
    },
    
    enterprise: {
        maxProjects: -1, // unlimited
        maxCollaborators: -1,
        maxAIRequests: -1,
        maxStorageGB: -1,
        features: ['white_label', 'sso', 'advanced_security', 'dedicated_support']
    }
};

class PermissionManager {
    /**
     * Check if user has specific permission
     */
    static hasPermission(user, permission, scope = 'personal') {
        // Admin has all permissions
        if (user.role === 'admin') return true;
        
        // Check role-based permissions
        const rolePermissions = this.getRolePermissions(user.subscription.tier, user.role);
        if (rolePermissions.includes(permission)) return true;
        
        // Check custom user permissions
        const userPermission = user.permissions.find(p => 
            p.resource === permission.split(':')[0] && 
            p.actions.includes(permission.split(':')[1]) &&
            (p.scope === scope || p.scope === 'global')
        );
        
        return !!userPermission;
    }
    
    /**
     * Check if user has any of the specified permissions
     */
    static hasAnyPermission(user, permissions, scope = 'personal') {
        return permissions.some(permission => 
            this.hasPermission(user, permission, scope)
        );
    }
    
    /**
     * Check if user has all specified permissions
     */
    static hasAllPermissions(user, permissions, scope = 'personal') {
        return permissions.every(permission => 
            this.hasPermission(user, permission, scope)
        );
    }
    
    /**
     * Get role permissions based on subscription tier
     */
    static getRolePermissions(subscriptionTier, role) {
        let basePermissions = [];
        
        switch (subscriptionTier) {
            case 'free':
                basePermissions = ROLES.USER.permissions;
                break;
            case 'pro':
                basePermissions = ROLES.PRO_USER.permissions;
                break;
            case 'team':
            case 'enterprise':
                basePermissions = ROLES.TEAM_ADMIN.permissions;
                break;
        }
        
        // Add role-specific permissions
        if (role === 'admin') {
            return ROLES.ADMIN.permissions;
        }
        
        return basePermissions;
    }
    
    /**
     * Check subscription limits
     */
    static checkSubscriptionLimit(user, resource, currentUsage) {
        const limits = SUBSCRIPTION_PERMISSIONS[user.subscription.tier];
        if (!limits) return false;
        
        const limit = limits[`max${resource.charAt(0).toUpperCase() + resource.slice(1)}`];
        if (limit === -1) return true; // unlimited
        
        return currentUsage < limit;
    }
    
    /**
     * Check if user has access to feature
     */
    static hasFeatureAccess(user, feature) {
        const limits = SUBSCRIPTION_PERMISSIONS[user.subscription.tier];
        return limits && limits.features.includes(feature);
    }
    
    /**
     * Get user's effective permissions
     */
    static getUserPermissions(user) {
        const rolePermissions = this.getRolePermissions(user.subscription.tier, user.role);
        const customPermissions = user.permissions.flatMap(p => 
            p.actions.map(action => `${p.resource}:${action}`)
        );
        
        return [...new Set([...rolePermissions, ...customPermissions])];
    }
}

// Middleware functions

/**
 * Require authentication
 */
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }
    
    // Check if user is active
    if (req.user.status !== 'active') {
        return res.status(403).json({ 
            error: 'Account is not active',
            code: 'ACCOUNT_INACTIVE'
        });
    }
    
    next();
};

/**
 * Require specific permission
 */
const requirePermission = (permission, scope = 'personal') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        
        if (!PermissionManager.hasPermission(req.user, permission, scope)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                code: 'PERMISSION_DENIED',
                required: permission
            });
        }
        
        next();
    };
};

/**
 * Require any of the specified permissions
 */
const requireAnyPermission = (permissions, scope = 'personal') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        
        if (!PermissionManager.hasAnyPermission(req.user, permissions, scope)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                code: 'PERMISSION_DENIED',
                required: permissions
            });
        }
        
        next();
    };
};

/**
 * Require all specified permissions
 */
const requireAllPermissions = (permissions, scope = 'personal') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        
        if (!PermissionManager.hasAllPermissions(req.user, permissions, scope)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                code: 'PERMISSION_DENIED',
                required: permissions
            });
        }
        
        next();
    };
};

/**
 * Require specific role
 */
const requireRole = (roles) => {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        
        if (!roleArray.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Insufficient role',
                code: 'ROLE_DENIED',
                required: roles
            });
        }
        
        next();
    };
};

/**
 * Require subscription tier
 */
const requireSubscription = (tiers) => {
    const tierArray = Array.isArray(tiers) ? tiers : [tiers];
    const tierHierarchy = ['free', 'pro', 'team', 'enterprise'];
    
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        
        const userTierIndex = tierHierarchy.indexOf(req.user.subscription.tier);
        const requiredTierIndex = Math.min(...tierArray.map(tier => tierHierarchy.indexOf(tier)));
        
        if (userTierIndex < requiredTierIndex) {
            return res.status(403).json({ 
                error: 'Subscription upgrade required',
                code: 'SUBSCRIPTION_REQUIRED',
                required: tiers,
                current: req.user.subscription.tier
            });
        }
        
        next();
    };
};

/**
 * Check usage limits
 */
const checkUsageLimit = (resource) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(401).json({ 
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }
        
        const currentUsage = user.usage.currentPeriod[resource] || 0;
        
        if (!PermissionManager.checkSubscriptionLimit(user, resource, currentUsage)) {
            return res.status(429).json({ 
                error: 'Usage limit exceeded',
                code: 'USAGE_LIMIT_EXCEEDED',
                resource,
                current: currentUsage,
                limit: SUBSCRIPTION_PERMISSIONS[user.subscription.tier][`max${resource.charAt(0).toUpperCase() + resource.slice(1)}`]
            });
        }
        
        req.user = user; // Update with full user object
        next();
    };
};

/**
 * Require feature access
 */
const requireFeature = (feature) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        
        if (!PermissionManager.hasFeatureAccess(req.user, feature)) {
            return res.status(403).json({ 
                error: 'Feature not available in current subscription',
                code: 'FEATURE_NOT_AVAILABLE',
                feature,
                subscription: req.user.subscription.tier
            });
        }
        
        next();
    };
};

/**
 * Admin only middleware
 */
const adminOnly = requireRole('admin');

/**
 * Owner or admin middleware
 */
const ownerOrAdmin = (getOwnerId) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        
        // Admin can access everything
        if (req.user.role === 'admin') {
            return next();
        }
        
        // Check ownership
        const ownerId = typeof getOwnerId === 'function' ? getOwnerId(req) : req.params[getOwnerId];
        if (req.user.userId !== ownerId) {
            return res.status(403).json({ 
                error: 'Access denied - not owner',
                code: 'NOT_OWNER'
            });
        }
        
        next();
    };
};

module.exports = {
    PERMISSIONS,
    ROLES,
    SUBSCRIPTION_PERMISSIONS,
    PermissionManager,
    
    // Middleware
    requireAuth,
    requirePermission,
    requireAnyPermission,
    requireAllPermissions,
    requireRole,
    requireSubscription,
    checkUsageLimit,
    requireFeature,
    adminOnly,
    ownerOrAdmin
};