/**
 * Data Isolation System for Multi-Tenancy
 * Ensures complete data separation between tenants
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const { TenantManager } = require('./tenant-manager');

class DataIsolationManager {
    constructor() {
        this.tenantConnections = new Map();
        this.schemaRegistry = new Map();
        this.encryptionKeys = new Map();
    }
    
    /**
     * Get or create tenant-specific database connection
     */
    async getTenantConnection(tenantId) {
        try {
            if (this.tenantConnections.has(tenantId)) {
                return this.tenantConnections.get(tenantId);
            }
            
            // Create tenant-specific database name
            const dbName = `nexus_tenant_${tenantId}`;
            const connectionString = process.env.MONGODB_URI.replace(/\/[^/]*$/, `/${dbName}`);
            
            // Create new connection for tenant
            const connection = mongoose.createConnection(connectionString, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            
            // Handle connection events
            connection.on('connected', () => {
                console.log(`✅ Tenant database connected: ${dbName}`);
            });
            
            connection.on('error', (err) => {
                console.error(`❌ Tenant database error for ${dbName}:`, err);
            });
            
            connection.on('disconnected', () => {
                console.log(`🔌 Tenant database disconnected: ${dbName}`);
                this.tenantConnections.delete(tenantId);
            });
            
            this.tenantConnections.set(tenantId, connection);
            
            // Initialize tenant-specific schemas
            await this.initializeTenantSchemas(connection, tenantId);
            
            return connection;
        } catch (error) {
            console.error('Error getting tenant connection:', error);
            throw error;
        }
    }
    
    /**
     * Initialize tenant-specific schemas
     */
    async initializeTenantSchemas(connection, tenantId) {
        try {
            // Project Schema
            const projectSchema = new mongoose.Schema({
                projectId: {
                    type: String,
                    required: true,
                    unique: true,
                    index: true
                },
                name: {
                    type: String,
                    required: true
                },
                description: String,
                type: {
                    type: String,
                    enum: ['web', 'mobile', 'desktop', 'api', 'library', 'other'],
                    default: 'web'
                },
                language: {
                    primary: String,
                    secondary: [String]
                },
                framework: String,
                repository: {
                    url: String,
                    branch: {
                        type: String,
                        default: 'main'
                    },
                    provider: {
                        type: String,
                        enum: ['github', 'gitlab', 'bitbucket', 'azure', 'other']
                    },
                    credentials: {
                        encrypted: String,
                        iv: String
                    }
                },
                structure: {
                    files: [{
                        path: String,
                        type: String,
                        size: Number,
                        lastModified: Date,
                        checksum: String
                    }],
                    directories: [String],
                    dependencies: mongoose.Schema.Types.Mixed
                },
                collaborators: [{
                    userId: {
                        type: mongoose.Schema.Types.ObjectId,
                        required: true
                    },
                    role: {
                        type: String,
                        enum: ['owner', 'admin', 'developer', 'viewer'],
                        default: 'developer'
                    },
                    permissions: [String],
                    addedAt: {
                        type: Date,
                        default: Date.now
                    }
                }],
                settings: {
                    visibility: {
                        type: String,
                        enum: ['private', 'team', 'public'],
                        default: 'private'
                    },
                    aiEnabled: {
                        type: Boolean,
                        default: true
                    },
                    autoSync: {
                        type: Boolean,
                        default: true
                    },
                    backupEnabled: {
                        type: Boolean,
                        default: true
                    }
                },
                metadata: {
                    tags: [String],
                    category: String,
                    priority: {
                        type: String,
                        enum: ['low', 'medium', 'high', 'critical'],
                        default: 'medium'
                    },
                    customFields: mongoose.Schema.Types.Mixed
                },
                analytics: {
                    totalCommits: {
                        type: Number,
                        default: 0
                    },
                    totalLines: {
                        type: Number,
                        default: 0
                    },
                    activeContributors: {
                        type: Number,
                        default: 0
                    },
                    lastActivity: Date
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
            
            // File Content Schema (for caching and AI analysis)
            const fileContentSchema = new mongoose.Schema({
                projectId: {
                    type: String,
                    required: true,
                    index: true
                },
                filePath: {
                    type: String,
                    required: true
                },
                content: {
                    encrypted: String,
                    iv: String,
                    encoding: {
                        type: String,
                        default: 'utf8'
                    }
                },
                metadata: {
                    size: Number,
                    mimeType: String,
                    language: String,
                    checksum: String,
                    lastModified: Date
                },
                analysis: {
                    complexity: Number,
                    maintainability: Number,
                    testCoverage: Number,
                    dependencies: [String],
                    exports: [String],
                    imports: [String],
                    functions: [{
                        name: String,
                        line: Number,
                        complexity: Number,
                        parameters: [String]
                    }],
                    classes: [{
                        name: String,
                        line: Number,
                        methods: [String],
                        properties: [String]
                    }]
                },
                aiInsights: {
                    suggestions: [{
                        type: String,
                        message: String,
                        line: Number,
                        severity: String,
                        confidence: Number
                    }],
                    documentation: String,
                    testSuggestions: [String],
                    refactoringOpportunities: [String]
                },
                versions: [{
                    version: String,
                    content: {
                        encrypted: String,
                        iv: String
                    },
                    timestamp: Date,
                    author: String,
                    changes: String
                }],
                createdAt: {
                    type: Date,
                    default: Date.now
                },
                updatedAt: {
                    type: Date,
                    default: Date.now
                }
            });
            
            // AI Conversation Schema
            const aiConversationSchema = new mongoose.Schema({
                conversationId: {
                    type: String,
                    required: true,
                    unique: true,
                    index: true
                },
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    index: true
                },
                projectId: String,
                context: {
                    type: {
                        type: String,
                        enum: ['project', 'file', 'general', 'debug', 'review'],
                        default: 'general'
                    },
                    projectId: String,
                    filePath: String,
                    codeSelection: {
                        start: Number,
                        end: Number,
                        content: String
                    }
                },
                messages: [{
                    messageId: String,
                    role: {
                        type: String,
                        enum: ['user', 'assistant', 'system'],
                        required: true
                    },
                    content: {
                        encrypted: String,
                        iv: String
                    },
                    metadata: {
                        model: String,
                        tokens: Number,
                        cost: Number,
                        processingTime: Number
                    },
                    timestamp: {
                        type: Date,
                        default: Date.now
                    }
                }],
                summary: String,
                tags: [String],
                status: {
                    type: String,
                    enum: ['active', 'archived', 'deleted'],
                    default: 'active'
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
            
            // Usage Analytics Schema
            const usageAnalyticsSchema = new mongoose.Schema({
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    index: true
                },
                date: {
                    type: Date,
                    required: true,
                    index: true
                },
                metrics: {
                    aiRequests: {
                        type: Number,
                        default: 0
                    },
                    codeGenerated: {
                        type: Number,
                        default: 0
                    },
                    filesModified: {
                        type: Number,
                        default: 0
                    },
                    collaborationTime: {
                        type: Number,
                        default: 0
                    },
                    debugSessions: {
                        type: Number,
                        default: 0
                    },
                    gitOperations: {
                        type: Number,
                        default: 0
                    }
                },
                projects: [{
                    projectId: String,
                    timeSpent: Number,
                    actions: Number
                }],
                features: [{
                    feature: String,
                    usage: Number,
                    lastUsed: Date
                }]
            });
            
            // Register models with tenant connection
            connection.model('Project', projectSchema);
            connection.model('FileContent', fileContentSchema);
            connection.model('AIConversation', aiConversationSchema);
            connection.model('UsageAnalytics', usageAnalyticsSchema);
            
            // Create indexes for performance
            await this.createTenantIndexes(connection);
            
            console.log(`✅ Tenant schemas initialized for: ${tenantId}`);
        } catch (error) {
            console.error('Error initializing tenant schemas:', error);
            throw error;
        }
    }
    
    /**
     * Create performance indexes for tenant database
     */
    async createTenantIndexes(connection) {
        try {
            const Project = connection.model('Project');
            const FileContent = connection.model('FileContent');
            const AIConversation = connection.model('AIConversation');
            const UsageAnalytics = connection.model('UsageAnalytics');
            
            // Project indexes
            await Project.collection.createIndex({ projectId: 1 });
            await Project.collection.createIndex({ 'collaborators.userId': 1 });
            await Project.collection.createIndex({ 'settings.visibility': 1 });
            await Project.collection.createIndex({ createdAt: -1 });
            
            // FileContent indexes
            await FileContent.collection.createIndex({ projectId: 1, filePath: 1 });
            await FileContent.collection.createIndex({ 'metadata.language': 1 });
            await FileContent.collection.createIndex({ updatedAt: -1 });
            
            // AIConversation indexes
            await AIConversation.collection.createIndex({ userId: 1, createdAt: -1 });
            await AIConversation.collection.createIndex({ projectId: 1 });
            await AIConversation.collection.createIndex({ status: 1 });
            
            // UsageAnalytics indexes
            await UsageAnalytics.collection.createIndex({ userId: 1, date: -1 });
            await UsageAnalytics.collection.createIndex({ date: -1 });
            
            console.log('✅ Tenant database indexes created');
        } catch (error) {
            console.error('Error creating tenant indexes:', error);
            throw error;
        }
    }
    
    /**
     * Get tenant-specific model
     */
    async getTenantModel(tenantId, modelName) {
        try {
            const connection = await this.getTenantConnection(tenantId);
            return connection.model(modelName);
        } catch (error) {
            console.error('Error getting tenant model:', error);
            throw error;
        }
    }
    
    /**
     * Encrypt sensitive data for tenant
     */
    encryptData(tenantId, data) {
        try {
            const key = this.getTenantEncryptionKey(tenantId);
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher('aes-256-gcm', key);
            
            let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            return {
                encrypted,
                iv: iv.toString('hex')
            };
        } catch (error) {
            console.error('Error encrypting data:', error);
            throw error;
        }
    }
    
    /**
     * Decrypt sensitive data for tenant
     */
    decryptData(tenantId, encryptedData) {
        try {
            const key = this.getTenantEncryptionKey(tenantId);
            const decipher = crypto.createDecipher('aes-256-gcm', key);
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Error decrypting data:', error);
            throw error;
        }
    }
    
    /**
     * Get or generate tenant-specific encryption key
     */
    getTenantEncryptionKey(tenantId) {
        if (this.encryptionKeys.has(tenantId)) {
            return this.encryptionKeys.get(tenantId);
        }
        
        // Generate key from tenant ID and master key
        const masterKey = process.env.MASTER_ENCRYPTION_KEY || 'default-master-key';
        const key = crypto.pbkdf2Sync(tenantId, masterKey, 100000, 32, 'sha512');
        
        this.encryptionKeys.set(tenantId, key);
        return key;
    }
    
    /**
     * Clean up tenant connection
     */
    async closeTenantConnection(tenantId) {
        try {
            const connection = this.tenantConnections.get(tenantId);
            if (connection) {
                await connection.close();
                this.tenantConnections.delete(tenantId);
                this.encryptionKeys.delete(tenantId);
                console.log(`🔌 Tenant connection closed: ${tenantId}`);
            }
        } catch (error) {
            console.error('Error closing tenant connection:', error);
            throw error;
        }
    }
    
    /**
     * Backup tenant data
     */
    async backupTenantData(tenantId) {
        try {
            const connection = await this.getTenantConnection(tenantId);
            const collections = await connection.db.listCollections().toArray();
            
            const backup = {
                tenantId,
                timestamp: new Date(),
                collections: {}
            };
            
            for (const collection of collections) {
                const collectionName = collection.name;
                const data = await connection.db.collection(collectionName).find({}).toArray();
                backup.collections[collectionName] = data;
            }
            
            // Store backup (implement your preferred storage method)
            const backupPath = `backups/tenant_${tenantId}_${Date.now()}.json`;
            // await this.storeBackup(backupPath, backup);
            
            console.log(`✅ Tenant data backed up: ${tenantId}`);
            return backup;
        } catch (error) {
            console.error('Error backing up tenant data:', error);
            throw error;
        }
    }
    
    /**
     * Restore tenant data from backup
     */
    async restoreTenantData(tenantId, backupData) {
        try {
            const connection = await this.getTenantConnection(tenantId);
            
            // Clear existing data
            const collections = await connection.db.listCollections().toArray();
            for (const collection of collections) {
                await connection.db.collection(collection.name).deleteMany({});
            }
            
            // Restore data
            for (const [collectionName, data] of Object.entries(backupData.collections)) {
                if (data.length > 0) {
                    await connection.db.collection(collectionName).insertMany(data);
                }
            }
            
            console.log(`✅ Tenant data restored: ${tenantId}`);
        } catch (error) {
            console.error('Error restoring tenant data:', error);
            throw error;
        }
    }
    
    /**
     * Delete all tenant data (GDPR compliance)
     */
    async deleteTenantData(tenantId) {
        try {
            const connection = await this.getTenantConnection(tenantId);
            
            // Drop entire tenant database
            await connection.db.dropDatabase();
            
            // Close connection
            await this.closeTenantConnection(tenantId);
            
            console.log(`🗑️ Tenant data deleted: ${tenantId}`);
        } catch (error) {
            console.error('Error deleting tenant data:', error);
            throw error;
        }
    }
    
    /**
     * Get tenant data statistics
     */
    async getTenantDataStats(tenantId) {
        try {
            const connection = await this.getTenantConnection(tenantId);
            const collections = await connection.db.listCollections().toArray();
            
            const stats = {
                tenantId,
                collections: {},
                totalSize: 0,
                totalDocuments: 0
            };
            
            for (const collection of collections) {
                const collectionName = collection.name;
                const collectionStats = await connection.db.collection(collectionName).stats();
                
                stats.collections[collectionName] = {
                    documents: collectionStats.count,
                    size: collectionStats.size,
                    avgObjSize: collectionStats.avgObjSize
                };
                
                stats.totalSize += collectionStats.size;
                stats.totalDocuments += collectionStats.count;
            }
            
            return stats;
        } catch (error) {
            console.error('Error getting tenant data stats:', error);
            throw error;
        }
    }
}

// Middleware for data isolation
const dataIsolationMiddleware = (isolationManager) => {
    return async (req, res, next) => {
        try {
            if (!req.tenant) {
                return res.status(400).json({
                    error: 'Tenant context required for data isolation',
                    code: 'TENANT_REQUIRED'
                });
            }
            
            // Add tenant-specific database access to request
            req.tenantDb = {
                getModel: (modelName) => isolationManager.getTenantModel(req.tenant.tenantId, modelName),
                encrypt: (data) => isolationManager.encryptData(req.tenant.tenantId, data),
                decrypt: (encryptedData) => isolationManager.decryptData(req.tenant.tenantId, encryptedData)
            };
            
            next();
        } catch (error) {
            console.error('Data isolation middleware error:', error);
            res.status(500).json({
                error: 'Data isolation error',
                code: 'ISOLATION_ERROR'
            });
        }
    };
};

// Create singleton instance
const dataIsolationManager = new DataIsolationManager();

module.exports = {
    DataIsolationManager,
    dataIsolationManager,
    dataIsolationMiddleware
};