/**
 * User Model for NEXUS IDE
 * Comprehensive user schema with subscription, permissions, and usage tracking
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// User Schema
const userSchema = new mongoose.Schema({
    // Basic Information
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    password: { 
        type: String, 
        select: false,
        minlength: 8
    },
    name: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 100
    },
    username: { 
        type: String, 
        unique: true, 
        sparse: true,
        lowercase: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
        match: /^[a-zA-Z0-9_-]+$/
    },
    avatar: { 
        type: String,
        default: null
    },
    bio: {
        type: String,
        maxlength: 500
    },
    location: {
        type: String,
        maxlength: 100
    },
    website: {
        type: String,
        maxlength: 200
    },
    
    // OAuth IDs
    googleId: { 
        type: String, 
        unique: true, 
        sparse: true,
        index: true
    },
    githubId: { 
        type: String, 
        unique: true, 
        sparse: true,
        index: true
    },
    microsoftId: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    
    // Authentication
    authProvider: { 
        type: String, 
        enum: ['local', 'google', 'github', 'microsoft'], 
        default: 'local'
    },
    isEmailVerified: { 
        type: Boolean, 
        default: false,
        index: true
    },
    emailVerificationToken: { 
        type: String,
        index: true
    },
    emailVerificationExpires: {
        type: Date
    },
    
    // Password Reset
    passwordResetToken: {
        type: String,
        index: true
    },
    passwordResetExpires: {
        type: Date
    },
    
    // 2FA
    twoFactorEnabled: { 
        type: Boolean, 
        default: false 
    },
    twoFactorSecret: { 
        type: String,
        select: false
    },
    twoFactorBackupCodes: [{
        code: String,
        used: { type: Boolean, default: false }
    }],
    
    // Account Status
    status: {
        type: String,
        enum: ['active', 'suspended', 'banned', 'pending'],
        default: 'active',
        index: true
    },
    
    // Subscription
    subscription: {
        tier: { 
            type: String, 
            enum: ['free', 'pro', 'team', 'enterprise'], 
            default: 'free',
            index: true
        },
        status: { 
            type: String, 
            enum: ['active', 'cancelled', 'expired', 'past_due', 'unpaid'], 
            default: 'active',
            index: true
        },
        startDate: { 
            type: Date, 
            default: Date.now 
        },
        endDate: { 
            type: Date 
        },
        trialEndDate: {
            type: Date
        },
        cancelAtPeriodEnd: {
            type: Boolean,
            default: false
        },
        
        // Stripe Integration
        stripeCustomerId: { 
            type: String,
            index: true
        },
        stripeSubscriptionId: { 
            type: String,
            index: true
        },
        stripePriceId: {
            type: String
        },
        
        // Billing
        billingCycle: {
            type: String,
            enum: ['monthly', 'yearly'],
            default: 'monthly'
        },
        nextBillingDate: {
            type: Date
        },
        lastPaymentDate: {
            type: Date
        },
        
        // Features
        features: {
            aiRequests: { type: Number, default: 100 }, // per month
            storageLimit: { type: Number, default: 1024 }, // MB
            collaborators: { type: Number, default: 1 },
            projects: { type: Number, default: 3 },
            privateRepos: { type: Number, default: 0 },
            customDomains: { type: Number, default: 0 },
            prioritySupport: { type: Boolean, default: false },
            advancedAnalytics: { type: Boolean, default: false },
            whiteLabel: { type: Boolean, default: false }
        }
    },
    
    // Permissions & Roles
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator', 'developer'],
        default: 'user',
        index: true
    },
    permissions: [{
        resource: {
            type: String,
            required: true
        },
        actions: [{
            type: String,
            enum: ['create', 'read', 'update', 'delete', 'execute', 'share', 'admin']
        }],
        scope: {
            type: String,
            enum: ['global', 'organization', 'project', 'personal'],
            default: 'personal'
        }
    }],
    
    // Organization Memberships
    organizations: [{
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization'
        },
        role: {
            type: String,
            enum: ['owner', 'admin', 'member', 'viewer'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        permissions: [String]
    }],
    
    // Usage Tracking
    usage: {
        // Current Period (resets monthly)
        currentPeriod: {
            aiRequests: { type: Number, default: 0 },
            storageUsed: { type: Number, default: 0 }, // MB
            collaborators: { type: Number, default: 0 },
            projects: { type: Number, default: 0 },
            apiCalls: { type: Number, default: 0 },
            buildMinutes: { type: Number, default: 0 }
        },
        
        // Historical Data
        history: [{
            month: { type: String }, // YYYY-MM format
            aiRequests: { type: Number, default: 0 },
            storageUsed: { type: Number, default: 0 },
            collaborators: { type: Number, default: 0 },
            projects: { type: Number, default: 0 },
            apiCalls: { type: Number, default: 0 },
            buildMinutes: { type: Number, default: 0 }
        }],
        
        // Limits
        limits: {
            aiRequests: { type: Number },
            storageUsed: { type: Number },
            collaborators: { type: Number },
            projects: { type: Number },
            apiCalls: { type: Number },
            buildMinutes: { type: Number }
        },
        
        // Reset Date
        periodStartDate: {
            type: Date,
            default: Date.now
        }
    },
    
    // Preferences
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'auto'
        },
        language: {
            type: String,
            default: 'en'
        },
        timezone: {
            type: String,
            default: 'UTC'
        },
        notifications: {
            email: {
                marketing: { type: Boolean, default: true },
                product: { type: Boolean, default: true },
                security: { type: Boolean, default: true },
                billing: { type: Boolean, default: true }
            },
            push: {
                enabled: { type: Boolean, default: true },
                mentions: { type: Boolean, default: true },
                comments: { type: Boolean, default: true },
                builds: { type: Boolean, default: true }
            }
        },
        editor: {
            fontSize: { type: Number, default: 14 },
            fontFamily: { type: String, default: 'Monaco' },
            tabSize: { type: Number, default: 2 },
            wordWrap: { type: Boolean, default: true },
            minimap: { type: Boolean, default: true },
            lineNumbers: { type: Boolean, default: true }
        }
    },
    
    // Security
    security: {
        loginAttempts: {
            count: { type: Number, default: 0 },
            lastAttempt: { type: Date },
            lockedUntil: { type: Date }
        },
        sessions: [{
            sessionId: String,
            ipAddress: String,
            userAgent: String,
            location: String,
            createdAt: { type: Date, default: Date.now },
            lastActivity: { type: Date, default: Date.now },
            isActive: { type: Boolean, default: true }
        }],
        apiKeys: [{
            name: String,
            key: String,
            permissions: [String],
            lastUsed: Date,
            createdAt: { type: Date, default: Date.now },
            expiresAt: Date,
            isActive: { type: Boolean, default: true }
        }]
    },
    
    // Analytics
    analytics: {
        firstLogin: { type: Date },
        lastLogin: { type: Date, index: true },
        loginCount: { type: Number, default: 0 },
        lastActivity: { type: Date, default: Date.now },
        
        // Feature Usage
        featureUsage: {
            aiAssistant: { type: Number, default: 0 },
            codeCompletion: { type: Number, default: 0 },
            debugging: { type: Number, default: 0 },
            collaboration: { type: Number, default: 0 },
            gitOperations: { type: Number, default: 0 }
        },
        
        // Onboarding
        onboarding: {
            completed: { type: Boolean, default: false },
            currentStep: { type: Number, default: 0 },
            completedSteps: [Number],
            skippedSteps: [Number]
        }
    },
    
    // Metadata
    createdAt: { 
        type: Date, 
        default: Date.now,
        index: true
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    },
    deletedAt: {
        type: Date,
        index: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.twoFactorSecret;
            delete ret.emailVerificationToken;
            delete ret.passwordResetToken;
            return ret;
        }
    }
});

// Indexes
userSchema.index({ email: 1, status: 1 });
userSchema.index({ 'subscription.tier': 1, 'subscription.status': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ 'organizations.organizationId': 1 });

// Virtual fields
userSchema.virtual('isSubscribed').get(function() {
    return this.subscription.tier !== 'free' && this.subscription.status === 'active';
});

userSchema.virtual('isTrialActive').get(function() {
    return this.subscription.trialEndDate && this.subscription.trialEndDate > new Date();
});

userSchema.virtual('daysUntilTrialEnd').get(function() {
    if (!this.subscription.trialEndDate) return null;
    const diff = this.subscription.trialEndDate - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Set first login if not set
    if (this.isModified('lastLogin') && !this.analytics.firstLogin) {
        this.analytics.firstLogin = this.lastLogin;
    }
    
    // Update usage limits based on subscription
    if (this.isModified('subscription.tier')) {
        this.updateUsageLimits();
    }
    
    next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generatePasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    return resetToken;
};

userSchema.methods.generateEmailVerificationToken = function() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    return verificationToken;
};

userSchema.methods.updateUsageLimits = function() {
    const limits = {
        free: {
            aiRequests: 100,
            storageUsed: 1024, // 1GB
            collaborators: 1,
            projects: 3,
            apiCalls: 1000,
            buildMinutes: 100
        },
        pro: {
            aiRequests: 1000,
            storageUsed: 10240, // 10GB
            collaborators: 5,
            projects: 25,
            apiCalls: 10000,
            buildMinutes: 1000
        },
        team: {
            aiRequests: 5000,
            storageUsed: 51200, // 50GB
            collaborators: 25,
            projects: 100,
            apiCalls: 50000,
            buildMinutes: 5000
        },
        enterprise: {
            aiRequests: -1, // unlimited
            storageUsed: -1, // unlimited
            collaborators: -1, // unlimited
            projects: -1, // unlimited
            apiCalls: -1, // unlimited
            buildMinutes: -1 // unlimited
        }
    };
    
    this.usage.limits = limits[this.subscription.tier] || limits.free;
};

userSchema.methods.canUseFeature = function(feature, amount = 1) {
    const limit = this.usage.limits[feature];
    if (limit === -1) return true; // unlimited
    
    const current = this.usage.currentPeriod[feature] || 0;
    return current + amount <= limit;
};

userSchema.methods.incrementUsage = function(feature, amount = 1) {
    if (!this.usage.currentPeriod[feature]) {
        this.usage.currentPeriod[feature] = 0;
    }
    this.usage.currentPeriod[feature] += amount;
};

userSchema.methods.resetUsagePeriod = function() {
    // Save current period to history
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const historyEntry = {
        month: currentMonth,
        ...this.usage.currentPeriod
    };
    
    this.usage.history.push(historyEntry);
    
    // Keep only last 12 months
    if (this.usage.history.length > 12) {
        this.usage.history = this.usage.history.slice(-12);
    }
    
    // Reset current period
    this.usage.currentPeriod = {
        aiRequests: 0,
        storageUsed: 0,
        collaborators: 0,
        projects: 0,
        apiCalls: 0,
        buildMinutes: 0
    };
    
    this.usage.periodStartDate = new Date();
};

userSchema.methods.hasPermission = function(resource, action, scope = 'personal') {
    // Admin has all permissions
    if (this.role === 'admin') return true;
    
    // Check specific permissions
    const permission = this.permissions.find(p => 
        p.resource === resource && 
        p.actions.includes(action) &&
        (p.scope === scope || p.scope === 'global')
    );
    
    return !!permission;
};

userSchema.methods.addPermission = function(resource, actions, scope = 'personal') {
    const existingPermission = this.permissions.find(p => 
        p.resource === resource && p.scope === scope
    );
    
    if (existingPermission) {
        // Add new actions to existing permission
        actions.forEach(action => {
            if (!existingPermission.actions.includes(action)) {
                existingPermission.actions.push(action);
            }
        });
    } else {
        // Create new permission
        this.permissions.push({
            resource,
            actions: Array.isArray(actions) ? actions : [actions],
            scope
        });
    }
};

userSchema.methods.removePermission = function(resource, actions, scope = 'personal') {
    const permission = this.permissions.find(p => 
        p.resource === resource && p.scope === scope
    );
    
    if (permission) {
        if (actions) {
            // Remove specific actions
            const actionsToRemove = Array.isArray(actions) ? actions : [actions];
            permission.actions = permission.actions.filter(action => 
                !actionsToRemove.includes(action)
            );
            
            // Remove permission if no actions left
            if (permission.actions.length === 0) {
                this.permissions = this.permissions.filter(p => p !== permission);
            }
        } else {
            // Remove entire permission
            this.permissions = this.permissions.filter(p => p !== permission);
        }
    }
};

// Static methods
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = function(username) {
    return this.findOne({ username: username.toLowerCase() });
};

userSchema.statics.findByProvider = function(provider, providerId) {
    const query = {};
    query[`${provider}Id`] = providerId;
    return this.findOne(query);
};

userSchema.statics.getSubscriptionStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$subscription.tier',
                count: { $sum: 1 },
                active: {
                    $sum: {
                        $cond: [{ $eq: ['$subscription.status', 'active'] }, 1, 0]
                    }
                }
            }
        }
    ]);
};

module.exports = mongoose.model('User', userSchema);