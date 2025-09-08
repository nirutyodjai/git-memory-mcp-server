/**
 * Multi-Tenancy Management System
 * Advanced tenant isolation and data management for NEXUS IDE
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const { User } = require('../auth-system/models/User');

// Tenant Schema
const tenantSchema = new mongoose.Schema({
    tenantId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    domain: {
        type: String,
        unique: true,
        sparse: true // Allow null values but ensure uniqueness when present
    },
    subdomain: {
        type: String,
        unique: true,
        sparse: true
    },
    type: {
        type: String,
        enum: ['personal', 'team', 'organization', 'enterprise'],
        default: 'personal'
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'inactive', 'deleted'],
        default: 'active'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['owner', 'admin', 'member', 'viewer'],
            default: 'member'
        },
        permissions: [{
            resource: String,
            actions: [String],
            scope: {
                type: String,
                enum: ['tenant', 'project', 'file'],
                default: 'tenant'
            }
        }],
        joinedAt: {
            type: Date,
            default: Date.now
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    settings: {
        branding: {
            logo: String,
            primaryColor: String,
            secondaryColor: String,
            customCSS: String
        },
        security: {
            ssoEnabled: {
                type: Boolean,
                default: false
            },
            ssoProvider: String,
            ssoConfig: mongoose.Schema.Types.Mixed,
            mfaRequired: {
                type: Boolean,
                default: false
            },
            ipWhitelist: [String],
            sessionTimeout: {
                type: Number,
                default: 24 * 60 * 60 * 1000 // 24 hours
            }
        },
        features: {
            aiEnabled: {
                type: Boolean,
                default: true
            },
            collaborationEnabled: {
                type: Boolean,
                default: true
            },
            gitIntegrationEnabled: {
                type: Boolean,
                default: true
            },
            customIntegrations: [{
                name: String,
                type: String,
                config: mongoose.Schema.Types.Mixed,
                enabled: Boolean
            }]
        },
        limits: {
            maxUsers: {
                type: Number,
                default: -1 // -1 means unlimited
            },
            maxProjects: {
                type: Number,
                default: -1
            },
            maxStorageGB: {
                type: Number,
                default: -1
            },
            maxAIRequests: {
                type: Number,
                default: -1
            }
        }
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'pro', 'team', 'enterprise'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['active', 'past_due', 'canceled', 'unpaid'],
            default: 'active'
        },
        billingEmail: String,
        stripeCustomerId: String,
        stripeSubscriptionId: String
    },
    usage: {
        currentPeriod: {
            users: {
                type: Number,
                default: 0
            },
            projects: {
                type: Number,
                default: 0
            },
            storageGB: {
                type: Number,
                default: 0
            },
            aiRequests: {
                type: Number,
                default: 0
            },
            apiCalls: {
                type: Number,
                default: 0
            }
        },
        history: [{
            period: {
                start: Date,
                end: Date
            },
            usage: {
                users: Number,
                projects: Number,
                storageGB: Number,
                aiRequests: Number,
                apiCalls: Number
            }
        }]
    },
    metadata: {
        industry: String,
        companySize: String,
        useCase: String,
        customFields: mongoose.Schema.Types.Mixed
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for performance
tenantSchema.index({ owner: 1 });
tenantSchema.index({ 'members.userId': 1 });
tenantSchema.index({ domain: 1 });
tenantSchema.index({ subdomain: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ type: 1 });

// Pre-save middleware
tenantSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Instance methods
tenantSchema.methods.addMember = function(userId, role = 'member', invitedBy = null) {
    const existingMember = this.members.find(m => m.userId.toString() === userId.toString());
    if (existingMember) {
        throw new Error('User is already a member of this tenant');
    }
    
    this.members.push({
        userId,
        role,
        invitedBy,
        joinedAt: new Date()
    });
    
    return this.save();
};

tenantSchema.methods.removeMember = function(userId) {
    this.members = this.members.filter(m => m.userId.toString() !== userId.toString());
    return this.save();
};

tenantSchema.methods.updateMemberRole = function(userId, newRole) {
    const member = this.members.find(m => m.userId.toString() === userId.toString());
    if (!member) {
        throw new Error('User is not a member of this tenant');
    }
    
    member.role = newRole;
    return this.save();
};

tenantSchema.methods.isMember = function(userId) {
    return this.members.some(m => m.userId.toString() === userId.toString());
};

tenantSchema.methods.getMemberRole = function(userId) {
    const member = this.members.find(m => m.userId.toString() === userId.toString());
    return member ? member.role : null;
};

tenantSchema.methods.canUserAccess = function(userId, requiredRole = 'member') {
    const roleHierarchy = ['viewer', 'member', 'admin', 'owner'];
    const userRole = this.getMemberRole(userId);
    
    if (!userRole) return false;
    
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    
    return userRoleIndex >= requiredRoleIndex;
};

const Tenant = mongoose.model('Tenant', tenantSchema);

class TenantManager {
    /**
     * Create a new tenant
     */
    static async createTenant(ownerId, tenantData) {
        try {
            const tenantId = this.generateTenantId();
            
            const tenant = new Tenant({
                tenantId,
                name: tenantData.name,
                domain: tenantData.domain,
                subdomain: tenantData.subdomain,
                type: tenantData.type || 'personal',
                owner: ownerId,
                members: [{
                    userId: ownerId,
                    role: 'owner',
                    joinedAt: new Date()
                }],
                settings: tenantData.settings || {},
                metadata: tenantData.metadata || {}
            });
            
            await tenant.save();
            
            // Update user's tenant association
            await User.findByIdAndUpdate(ownerId, {
                $push: {
                    'organizations.memberships': {
                        tenantId: tenant.tenantId,
                        role: 'owner',
                        joinedAt: new Date()
                    }
                }
            });
            
            return tenant;
        } catch (error) {
            console.error('Error creating tenant:', error);
            throw error;
        }
    }
    
    /**
     * Get tenant by ID
     */
    static async getTenant(tenantId) {
        try {
            return await Tenant.findOne({ tenantId }).populate('owner members.userId');
        } catch (error) {
            console.error('Error getting tenant:', error);
            throw error;
        }
    }
    
    /**
     * Get tenant by domain
     */
    static async getTenantByDomain(domain) {
        try {
            return await Tenant.findOne({ 
                $or: [
                    { domain: domain },
                    { subdomain: domain }
                ]
            }).populate('owner members.userId');
        } catch (error) {
            console.error('Error getting tenant by domain:', error);
            throw error;
        }
    }
    
    /**
     * Get user's tenants
     */
    static async getUserTenants(userId) {
        try {
            return await Tenant.find({
                'members.userId': userId,
                status: 'active'
            }).populate('owner');
        } catch (error) {
            console.error('Error getting user tenants:', error);
            throw error;
        }
    }
    
    /**
     * Add member to tenant
     */
    static async addMember(tenantId, userId, role = 'member', invitedBy = null) {
        try {
            const tenant = await Tenant.findOne({ tenantId });
            if (!tenant) {
                throw new Error('Tenant not found');
            }
            
            await tenant.addMember(userId, role, invitedBy);
            
            // Update user's tenant association
            await User.findByIdAndUpdate(userId, {
                $push: {
                    'organizations.memberships': {
                        tenantId: tenant.tenantId,
                        role: role,
                        joinedAt: new Date()
                    }
                }
            });
            
            return tenant;
        } catch (error) {
            console.error('Error adding member to tenant:', error);
            throw error;
        }
    }
    
    /**
     * Remove member from tenant
     */
    static async removeMember(tenantId, userId) {
        try {
            const tenant = await Tenant.findOne({ tenantId });
            if (!tenant) {
                throw new Error('Tenant not found');
            }
            
            // Don't allow removing the owner
            if (tenant.owner.toString() === userId.toString()) {
                throw new Error('Cannot remove tenant owner');
            }
            
            await tenant.removeMember(userId);
            
            // Update user's tenant association
            await User.findByIdAndUpdate(userId, {
                $pull: {
                    'organizations.memberships': {
                        tenantId: tenant.tenantId
                    }
                }
            });
            
            return tenant;
        } catch (error) {
            console.error('Error removing member from tenant:', error);
            throw error;
        }
    }
    
    /**
     * Update member role
     */
    static async updateMemberRole(tenantId, userId, newRole) {
        try {
            const tenant = await Tenant.findOne({ tenantId });
            if (!tenant) {
                throw new Error('Tenant not found');
            }
            
            await tenant.updateMemberRole(userId, newRole);
            
            // Update user's tenant association
            await User.findOneAndUpdate(
                { 
                    _id: userId,
                    'organizations.memberships.tenantId': tenantId
                },
                {
                    $set: {
                        'organizations.memberships.$.role': newRole
                    }
                }
            );
            
            return tenant;
        } catch (error) {
            console.error('Error updating member role:', error);
            throw error;
        }
    }
    
    /**
     * Check if user can access tenant
     */
    static async canUserAccessTenant(userId, tenantId, requiredRole = 'member') {
        try {
            const tenant = await Tenant.findOne({ tenantId });
            if (!tenant) {
                return false;
            }
            
            return tenant.canUserAccess(userId, requiredRole);
        } catch (error) {
            console.error('Error checking tenant access:', error);
            return false;
        }
    }
    
    /**
     * Get tenant context for request
     */
    static async getTenantContext(req) {
        try {
            let tenantId = null;
            
            // Try to get tenant from header
            if (req.headers['x-tenant-id']) {
                tenantId = req.headers['x-tenant-id'];
            }
            // Try to get tenant from subdomain
            else if (req.headers.host) {
                const subdomain = req.headers.host.split('.')[0];
                const tenant = await this.getTenantByDomain(subdomain);
                if (tenant) {
                    tenantId = tenant.tenantId;
                }
            }
            // Try to get tenant from query parameter
            else if (req.query.tenant) {
                tenantId = req.query.tenant;
            }
            
            if (!tenantId) {
                return null;
            }
            
            const tenant = await this.getTenant(tenantId);
            if (!tenant || tenant.status !== 'active') {
                return null;
            }
            
            return {
                tenant,
                tenantId: tenant.tenantId,
                canUserAccess: (userId, role = 'member') => 
                    tenant.canUserAccess(userId, role)
            };
        } catch (error) {
            console.error('Error getting tenant context:', error);
            return null;
        }
    }
    
    /**
     * Update tenant usage
     */
    static async updateUsage(tenantId, resource, increment = 1) {
        try {
            const updateField = `usage.currentPeriod.${resource}`;
            
            await Tenant.findOneAndUpdate(
                { tenantId },
                { $inc: { [updateField]: increment } }
            );
        } catch (error) {
            console.error('Error updating tenant usage:', error);
            throw error;
        }
    }
    
    /**
     * Check tenant limits
     */
    static async checkLimit(tenantId, resource) {
        try {
            const tenant = await Tenant.findOne({ tenantId });
            if (!tenant) {
                throw new Error('Tenant not found');
            }
            
            const limit = tenant.settings.limits[`max${resource.charAt(0).toUpperCase() + resource.slice(1)}`];
            if (limit === -1) return true; // unlimited
            
            const currentUsage = tenant.usage.currentPeriod[resource] || 0;
            return currentUsage < limit;
        } catch (error) {
            console.error('Error checking tenant limit:', error);
            return false;
        }
    }
    
    /**
     * Generate unique tenant ID
     */
    static generateTenantId() {
        return 'tenant_' + crypto.randomBytes(16).toString('hex');
    }
    
    /**
     * Delete tenant (soft delete)
     */
    static async deleteTenant(tenantId, userId) {
        try {
            const tenant = await Tenant.findOne({ tenantId });
            if (!tenant) {
                throw new Error('Tenant not found');
            }
            
            // Only owner can delete tenant
            if (tenant.owner.toString() !== userId.toString()) {
                throw new Error('Only tenant owner can delete tenant');
            }
            
            // Soft delete
            tenant.status = 'deleted';
            await tenant.save();
            
            // Remove tenant from all users
            await User.updateMany(
                { 'organizations.memberships.tenantId': tenantId },
                {
                    $pull: {
                        'organizations.memberships': {
                            tenantId: tenantId
                        }
                    }
                }
            );
            
            return tenant;
        } catch (error) {
            console.error('Error deleting tenant:', error);
            throw error;
        }
    }
    
    /**
     * Get tenant analytics
     */
    static async getTenantAnalytics(tenantId) {
        try {
            const tenant = await Tenant.findOne({ tenantId }).populate('members.userId');
            if (!tenant) {
                throw new Error('Tenant not found');
            }
            
            const analytics = {
                overview: {
                    totalMembers: tenant.members.length,
                    activeMembers: tenant.members.filter(m => {
                        const user = m.userId;
                        return user && user.status === 'active';
                    }).length,
                    tenantAge: Math.floor((new Date() - tenant.createdAt) / (1000 * 60 * 60 * 24)), // days
                    subscriptionPlan: tenant.subscription.plan
                },
                usage: {
                    current: tenant.usage.currentPeriod,
                    limits: tenant.settings.limits,
                    utilization: {}
                },
                members: {
                    byRole: {},
                    recentJoins: tenant.members
                        .sort((a, b) => b.joinedAt - a.joinedAt)
                        .slice(0, 5)
                        .map(m => ({
                            userId: m.userId._id,
                            email: m.userId.email,
                            role: m.role,
                            joinedAt: m.joinedAt
                        }))
                }
            };
            
            // Calculate utilization percentages
            Object.keys(tenant.usage.currentPeriod).forEach(resource => {
                const current = tenant.usage.currentPeriod[resource];
                const limit = tenant.settings.limits[`max${resource.charAt(0).toUpperCase() + resource.slice(1)}`];
                
                if (limit > 0) {
                    analytics.usage.utilization[resource] = Math.round((current / limit) * 100);
                } else {
                    analytics.usage.utilization[resource] = 0;
                }
            });
            
            // Count members by role
            tenant.members.forEach(member => {
                analytics.members.byRole[member.role] = 
                    (analytics.members.byRole[member.role] || 0) + 1;
            });
            
            return analytics;
        } catch (error) {
            console.error('Error getting tenant analytics:', error);
            throw error;
        }
    }
}

// Middleware for tenant context
const tenantMiddleware = async (req, res, next) => {
    try {
        const tenantContext = await TenantManager.getTenantContext(req);
        req.tenant = tenantContext;
        next();
    } catch (error) {
        console.error('Tenant middleware error:', error);
        next();
    }
};

// Middleware to require tenant access
const requireTenantAccess = (requiredRole = 'member') => {
    return (req, res, next) => {
        if (!req.tenant) {
            return res.status(400).json({
                error: 'Tenant context required',
                code: 'TENANT_REQUIRED'
            });
        }
        
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        
        if (!req.tenant.canUserAccess(req.user.userId, requiredRole)) {
            return res.status(403).json({
                error: 'Insufficient tenant permissions',
                code: 'TENANT_ACCESS_DENIED',
                required: requiredRole
            });
        }
        
        next();
    };
};

module.exports = {
    Tenant,
    TenantManager,
    tenantMiddleware,
    requireTenantAccess
};