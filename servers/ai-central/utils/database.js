/**
 * =============================================================================
 * NEXUS IDE - Advanced Database Management System
 * =============================================================================
 * 
 * Comprehensive database utilities for AI Central Server
 * 
 * Features:
 * - Multi-database support (MongoDB, PostgreSQL, Redis, SQLite)
 * - Connection pooling and management
 * - Query optimization and caching
 * - Transaction management
 * - Migration system
 * - Backup and restore
 * - Performance monitoring
 * - Health checks
 * 
 * Author: NEXUS IDE Team
 * Version: 1.0.0
 * License: MIT
 * 
 * =============================================================================
 */

'use strict';

const mongoose = require('mongoose');
const { Pool } = require('pg');
const redis = require('redis');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const EventEmitter = require('events');
const config = require('../config/config');
const logger = require('./logger');

// =============================================================================
// Database Manager Class
// =============================================================================

class DatabaseManager extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map();
    this.pools = new Map();
    this.healthChecks = new Map();
    this.metrics = {
      queries: 0,
      errors: 0,
      connections: 0,
      avgResponseTime: 0,
      slowQueries: 0
    };
    
    this.isInitialized = false;
    this.initPromise = null;
  }
  
  /**
   * Initialize all database connections
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }
    
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = this._performInitialization();
    return this.initPromise;
  }
  
  async _performInitialization() {
    try {
      logger.info('Initializing database connections...');
      
      // Initialize MongoDB
      if (config.database.mongodb.enabled) {
        await this.initMongoDB();
      }
      
      // Initialize PostgreSQL
      if (config.database.postgresql.enabled) {
        await this.initPostgreSQL();
      }
      
      // Initialize Redis
      if (config.database.redis.enabled) {
        await this.initRedis();
      }
      
      // Initialize SQLite
      if (config.database.sqlite.enabled) {
        await this.initSQLite();
      }
      
      this.isInitialized = true;
      this.emit('initialized');
      
      // Start health checks
      this.startHealthChecks();
      
      // Start metrics collection
      this.startMetricsCollection();
      
      logger.info('Database connections initialized successfully', {
        connections: Array.from(this.connections.keys()),
        pools: Array.from(this.pools.keys())
      });
      
    } catch (error) {
      logger.error('Failed to initialize database connections', { error: error.message });
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Initialize MongoDB connection
   */
  async initMongoDB() {
    try {
      const mongoConfig = config.database.mongodb;
      const connectionString = `mongodb://${mongoConfig.host}:${mongoConfig.port}/${mongoConfig.database}`;
      
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: mongoConfig.maxPoolSize,
        minPoolSize: mongoConfig.minPoolSize,
        maxIdleTimeMS: mongoConfig.maxIdleTimeMS,
        serverSelectionTimeoutMS: mongoConfig.serverSelectionTimeoutMS,
        socketTimeoutMS: mongoConfig.socketTimeoutMS,
        family: 4, // Use IPv4, skip trying IPv6
        retryWrites: true,
        w: 'majority'
      };
      
      if (mongoConfig.auth.enabled) {
        options.auth = {
          username: mongoConfig.auth.username,
          password: mongoConfig.auth.password
        };
      }
      
      await mongoose.connect(connectionString, options);
      
      const connection = mongoose.connection;
      this.connections.set('mongodb', connection);
      
      // Event listeners
      connection.on('connected', () => {
        logger.info('MongoDB connected successfully');
        this.emit('mongodb:connected');
      });
      
      connection.on('error', (error) => {
        logger.error('MongoDB connection error', { error: error.message });
        this.metrics.errors++;
        this.emit('mongodb:error', error);
      });
      
      connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.emit('mongodb:disconnected');
      });
      
      connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.emit('mongodb:reconnected');
      });
      
      logger.info('MongoDB initialized', {
        host: mongoConfig.host,
        port: mongoConfig.port,
        database: mongoConfig.database
      });
      
    } catch (error) {
      logger.error('Failed to initialize MongoDB', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Initialize PostgreSQL connection pool
   */
  async initPostgreSQL() {
    try {
      const pgConfig = config.database.postgresql;
      
      const poolConfig = {
        user: pgConfig.user,
        host: pgConfig.host,
        database: pgConfig.database,
        password: pgConfig.password,
        port: pgConfig.port,
        max: pgConfig.maxConnections,
        min: pgConfig.minConnections,
        idleTimeoutMillis: pgConfig.idleTimeoutMillis,
        connectionTimeoutMillis: pgConfig.connectionTimeoutMillis,
        statement_timeout: pgConfig.statementTimeout,
        query_timeout: pgConfig.queryTimeout,
        application_name: 'nexus-ide-ai-central'
      };
      
      if (pgConfig.ssl.enabled) {
        poolConfig.ssl = {
          rejectUnauthorized: pgConfig.ssl.rejectUnauthorized,
          ca: pgConfig.ssl.ca,
          cert: pgConfig.ssl.cert,
          key: pgConfig.ssl.key
        };
      }
      
      const pool = new Pool(poolConfig);
      this.pools.set('postgresql', pool);
      
      // Test connection
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      
      // Event listeners
      pool.on('connect', (client) => {
        logger.debug('PostgreSQL client connected');
        this.metrics.connections++;
      });
      
      pool.on('error', (error, client) => {
        logger.error('PostgreSQL pool error', { error: error.message });
        this.metrics.errors++;
        this.emit('postgresql:error', error);
      });
      
      pool.on('remove', (client) => {
        logger.debug('PostgreSQL client removed');
        this.metrics.connections--;
      });
      
      logger.info('PostgreSQL initialized', {
        host: pgConfig.host,
        port: pgConfig.port,
        database: pgConfig.database,
        maxConnections: pgConfig.maxConnections,
        testQuery: result.rows[0]
      });
      
    } catch (error) {
      logger.error('Failed to initialize PostgreSQL', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Initialize Redis connection
   */
  async initRedis() {
    try {
      const redisConfig = config.database.redis;
      
      const clientOptions = {
        host: redisConfig.host,
        port: redisConfig.port,
        db: redisConfig.db,
        password: redisConfig.password,
        retryDelayOnFailover: redisConfig.retryDelayOnFailover,
        maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
        lazyConnect: true,
        keepAlive: true,
        family: 4,
        connectTimeout: redisConfig.connectTimeout,
        commandTimeout: redisConfig.commandTimeout
      };
      
      if (redisConfig.cluster.enabled) {
        const Redis = require('ioredis');
        const cluster = new Redis.Cluster(redisConfig.cluster.nodes, {
          ...clientOptions,
          enableReadyCheck: true,
          redisOptions: clientOptions
        });
        
        this.connections.set('redis', cluster);
        
        cluster.on('connect', () => {
          logger.info('Redis cluster connected');
          this.emit('redis:connected');
        });
        
        cluster.on('error', (error) => {
          logger.error('Redis cluster error', { error: error.message });
          this.metrics.errors++;
          this.emit('redis:error', error);
        });
        
        await cluster.connect();
        
      } else {
        const client = redis.createClient(clientOptions);
        this.connections.set('redis', client);
        
        client.on('connect', () => {
          logger.info('Redis connected');
          this.emit('redis:connected');
        });
        
        client.on('error', (error) => {
          logger.error('Redis error', { error: error.message });
          this.metrics.errors++;
          this.emit('redis:error', error);
        });
        
        client.on('end', () => {
          logger.warn('Redis connection ended');
          this.emit('redis:disconnected');
        });
        
        await client.connect();
      }
      
      // Test connection
      const redis_client = this.connections.get('redis');
      await redis_client.ping();
      
      logger.info('Redis initialized', {
        host: redisConfig.host,
        port: redisConfig.port,
        db: redisConfig.db,
        cluster: redisConfig.cluster.enabled
      });
      
    } catch (error) {
      logger.error('Failed to initialize Redis', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Initialize SQLite connection
   */
  async initSQLite() {
    try {
      const sqliteConfig = config.database.sqlite;
      
      const db = await open({
        filename: sqliteConfig.filename,
        driver: sqlite3.Database
      });
      
      // Configure SQLite
      await db.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA cache_size = ${sqliteConfig.cacheSize};
        PRAGMA temp_store = MEMORY;
        PRAGMA mmap_size = ${sqliteConfig.mmapSize};
      `);
      
      this.connections.set('sqlite', db);
      
      // Test connection
      const result = await db.get('SELECT datetime("now") as now');
      
      logger.info('SQLite initialized', {
        filename: sqliteConfig.filename,
        cacheSize: sqliteConfig.cacheSize,
        mmapSize: sqliteConfig.mmapSize,
        testQuery: result
      });
      
    } catch (error) {
      logger.error('Failed to initialize SQLite', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get database connection
   */
  getConnection(type) {
    if (!this.isInitialized) {
      throw new Error('Database manager not initialized');
    }
    
    const connection = this.connections.get(type);
    if (!connection) {
      throw new Error(`Database connection '${type}' not found`);
    }
    
    return connection;
  }
  
  /**
   * Get database pool
   */
  getPool(type) {
    if (!this.isInitialized) {
      throw new Error('Database manager not initialized');
    }
    
    const pool = this.pools.get(type);
    if (!pool) {
      throw new Error(`Database pool '${type}' not found`);
    }
    
    return pool;
  }
  
  /**
   * Execute query with performance monitoring
   */
  async executeQuery(type, query, params = [], options = {}) {
    const timer = logger.timer(`db_query_${type}`, {
      query: query.substring(0, 100),
      type
    });
    
    try {
      this.metrics.queries++;
      
      let result;
      
      switch (type) {
        case 'postgresql':
          result = await this.executePostgreSQLQuery(query, params, options);
          break;
        case 'sqlite':
          result = await this.executeSQLiteQuery(query, params, options);
          break;
        case 'mongodb':
          result = await this.executeMongoQuery(query, params, options);
          break;
        case 'redis':
          result = await this.executeRedisCommand(query, params, options);
          break;
        default:
          throw new Error(`Unsupported database type: ${type}`);
      }
      
      const performance = timer.end({ success: true });
      
      // Track slow queries
      if (performance.durationMs > config.monitoring.database.slowQueryThreshold) {
        this.metrics.slowQueries++;
        logger.warn('Slow query detected', {
          type,
          query: query.substring(0, 200),
          duration: performance.duration,
          params: params.length
        });
      }
      
      return result;
      
    } catch (error) {
      timer.end({ success: false, error: error.message });
      this.metrics.errors++;
      
      logger.error('Database query failed', {
        type,
        query: query.substring(0, 200),
        error: error.message,
        params: params.length
      });
      
      throw error;
    }
  }
  
  /**
   * Execute PostgreSQL query
   */
  async executePostgreSQLQuery(query, params, options) {
    const pool = this.getPool('postgresql');
    const client = await pool.connect();
    
    try {
      if (options.transaction) {
        await client.query('BEGIN');
        
        try {
          const result = await client.query(query, params);
          await client.query('COMMIT');
          return result;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      } else {
        return await client.query(query, params);
      }
    } finally {
      client.release();
    }
  }
  
  /**
   * Execute SQLite query
   */
  async executeSQLiteQuery(query, params, options) {
    const db = this.getConnection('sqlite');
    
    if (options.transaction) {
      return await db.run('BEGIN TRANSACTION')
        .then(() => {
          if (query.toLowerCase().startsWith('select')) {
            return db.all(query, params);
          } else {
            return db.run(query, params);
          }
        })
        .then(async (result) => {
          await db.run('COMMIT');
          return result;
        })
        .catch(async (error) => {
          await db.run('ROLLBACK');
          throw error;
        });
    } else {
      if (query.toLowerCase().startsWith('select')) {
        return await db.all(query, params);
      } else {
        return await db.run(query, params);
      }
    }
  }
  
  /**
   * Execute MongoDB query
   */
  async executeMongoQuery(collection, operation, params) {
    const db = this.getConnection('mongodb').db;
    const coll = db.collection(collection);
    
    switch (operation) {
      case 'find':
        return await coll.find(params.filter || {}, params.options || {}).toArray();
      case 'findOne':
        return await coll.findOne(params.filter || {}, params.options || {});
      case 'insertOne':
        return await coll.insertOne(params.document, params.options || {});
      case 'insertMany':
        return await coll.insertMany(params.documents, params.options || {});
      case 'updateOne':
        return await coll.updateOne(params.filter, params.update, params.options || {});
      case 'updateMany':
        return await coll.updateMany(params.filter, params.update, params.options || {});
      case 'deleteOne':
        return await coll.deleteOne(params.filter, params.options || {});
      case 'deleteMany':
        return await coll.deleteMany(params.filter, params.options || {});
      case 'aggregate':
        return await coll.aggregate(params.pipeline, params.options || {}).toArray();
      default:
        throw new Error(`Unsupported MongoDB operation: ${operation}`);
    }
  }
  
  /**
   * Execute Redis command
   */
  async executeRedisCommand(command, params, options) {
    const redis_client = this.getConnection('redis');
    
    if (options.pipeline) {
      const pipeline = redis_client.pipeline();
      pipeline[command](...params);
      return await pipeline.exec();
    } else {
      return await redis_client[command](...params);
    }
  }
  
  /**
   * Start health checks
   */
  startHealthChecks() {
    const interval = config.monitoring.database.healthCheckInterval;
    
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, interval);
    
    logger.info('Database health checks started', { interval });
  }
  
  /**
   * Perform health checks
   */
  async performHealthChecks() {
    const results = {};
    
    for (const [type, connection] of this.connections) {
      try {
        const startTime = Date.now();
        
        switch (type) {
          case 'mongodb':
            await connection.db.admin().ping();
            break;
          case 'redis':
            await connection.ping();
            break;
          case 'sqlite':
            await connection.get('SELECT 1');
            break;
        }
        
        const responseTime = Date.now() - startTime;
        
        results[type] = {
          status: 'healthy',
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString()
        };
        
      } catch (error) {
        results[type] = {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        };
        
        logger.error(`Database health check failed for ${type}`, {
          error: error.message
        });
      }
    }
    
    // Check PostgreSQL pools
    for (const [type, pool] of this.pools) {
      try {
        const startTime = Date.now();
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        
        const responseTime = Date.now() - startTime;
        
        results[type] = {
          status: 'healthy',
          responseTime: `${responseTime}ms`,
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount,
          timestamp: new Date().toISOString()
        };
        
      } catch (error) {
        results[type] = {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        };
        
        logger.error(`Database health check failed for ${type}`, {
          error: error.message
        });
      }
    }
    
    this.healthChecks.set('latest', results);
    this.emit('healthCheck', results);
  }
  
  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    const interval = config.monitoring.database.metricsInterval;
    
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, interval);
    
    logger.info('Database metrics collection started', { interval });
  }
  
  /**
   * Collect metrics
   */
  collectMetrics() {
    const metrics = {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      connections: {},
      pools: {}
    };
    
    // Collect connection metrics
    for (const [type, connection] of this.connections) {
      switch (type) {
        case 'mongodb':
          metrics.connections[type] = {
            readyState: connection.readyState,
            host: connection.host,
            port: connection.port,
            name: connection.name
          };
          break;
        case 'redis':
          metrics.connections[type] = {
            status: connection.status,
            options: {
              host: connection.options.host,
              port: connection.options.port,
              db: connection.options.db
            }
          };
          break;
      }
    }
    
    // Collect pool metrics
    for (const [type, pool] of this.pools) {
      if (type === 'postgresql') {
        metrics.pools[type] = {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount
        };
      }
    }
    
    logger.debug('Database metrics collected', metrics);
    this.emit('metrics', metrics);
  }
  
  /**
   * Get health status
   */
  getHealthStatus() {
    return this.healthChecks.get('latest') || {};
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Close all connections
   */
  async close() {
    logger.info('Closing database connections...');
    
    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    // Close connections
    for (const [type, connection] of this.connections) {
      try {
        switch (type) {
          case 'mongodb':
            await mongoose.connection.close();
            break;
          case 'redis':
            await connection.quit();
            break;
          case 'sqlite':
            await connection.close();
            break;
        }
        
        logger.info(`${type} connection closed`);
      } catch (error) {
        logger.error(`Failed to close ${type} connection`, {
          error: error.message
        });
      }
    }
    
    // Close pools
    for (const [type, pool] of this.pools) {
      try {
        await pool.end();
        logger.info(`${type} pool closed`);
      } catch (error) {
        logger.error(`Failed to close ${type} pool`, {
          error: error.message
        });
      }
    }
    
    this.connections.clear();
    this.pools.clear();
    this.isInitialized = false;
    
    logger.info('All database connections closed');
  }
}

// =============================================================================
// Database Schemas and Models
// =============================================================================

/**
 * MongoDB Schemas
 */
const mongoSchemas = {
  // User schema
  User: new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: {
      firstName: String,
      lastName: String,
      avatar: String,
      bio: String,
      location: String,
      website: String
    },
    preferences: {
      theme: { type: String, default: 'dark' },
      language: { type: String, default: 'en' },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        desktop: { type: Boolean, default: true }
      }
    },
    roles: [{ type: String, enum: ['user', 'admin', 'developer', 'moderator'] }],
    permissions: [String],
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    lastLogin: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }, {
    timestamps: true,
    collection: 'users'
  }),
  
  // Project schema
  Project: new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    owner: { type: String, required: true, ref: 'User' },
    collaborators: [{
      userId: { type: String, ref: 'User' },
      role: { type: String, enum: ['owner', 'admin', 'editor', 'viewer'], default: 'viewer' },
      permissions: [String],
      joinedAt: { type: Date, default: Date.now }
    }],
    repository: {
      url: String,
      branch: { type: String, default: 'main' },
      provider: { type: String, enum: ['github', 'gitlab', 'bitbucket', 'local'] },
      credentials: {
        token: String,
        username: String,
        password: String
      }
    },
    settings: {
      visibility: { type: String, enum: ['public', 'private', 'internal'], default: 'private' },
      language: String,
      framework: String,
      buildTool: String,
      packageManager: String
    },
    ai: {
      enabled: { type: Boolean, default: true },
      models: [String],
      features: {
        codeCompletion: { type: Boolean, default: true },
        codeGeneration: { type: Boolean, default: true },
        debugging: { type: Boolean, default: true },
        optimization: { type: Boolean, default: true },
        documentation: { type: Boolean, default: true }
      }
    },
    status: { type: String, enum: ['active', 'archived', 'deleted'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }, {
    timestamps: true,
    collection: 'projects'
  }),
  
  // Session schema
  Session: new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, ref: 'User' },
    projectId: { type: String, ref: 'Project' },
    type: { type: String, enum: ['coding', 'debugging', 'collaboration', 'ai-chat'], required: true },
    data: mongoose.Schema.Types.Mixed,
    metadata: {
      userAgent: String,
      ip: String,
      location: String,
      device: String
    },
    status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }, {
    timestamps: true,
    collection: 'sessions'
  }),
  
  // AI Conversation schema
  AIConversation: new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, ref: 'User' },
    projectId: { type: String, ref: 'Project' },
    sessionId: { type: String, ref: 'Session' },
    title: String,
    messages: [{
      id: String,
      role: { type: String, enum: ['user', 'assistant', 'system'] },
      content: String,
      metadata: {
        model: String,
        tokens: Number,
        cost: Number,
        responseTime: Number,
        context: mongoose.Schema.Types.Mixed
      },
      timestamp: { type: Date, default: Date.now }
    }],
    context: {
      files: [String],
      functions: [String],
      variables: [String],
      dependencies: [String]
    },
    settings: {
      model: String,
      temperature: Number,
      maxTokens: Number,
      topP: Number,
      frequencyPenalty: Number,
      presencePenalty: Number
    },
    status: { type: String, enum: ['active', 'archived', 'deleted'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }, {
    timestamps: true,
    collection: 'ai_conversations'
  })
};

// =============================================================================
// PostgreSQL Schemas
// =============================================================================

const postgresSchemas = {
  // Create tables SQL
  createTables: `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      profile JSONB DEFAULT '{}',
      preferences JSONB DEFAULT '{}',
      roles TEXT[] DEFAULT ARRAY['user'],
      permissions TEXT[] DEFAULT ARRAY[],
      status VARCHAR(50) DEFAULT 'active',
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Projects table
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      owner VARCHAR(255) REFERENCES users(id),
      collaborators JSONB DEFAULT '[]',
      repository JSONB DEFAULT '{}',
      settings JSONB DEFAULT '{}',
      ai JSONB DEFAULT '{}',
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Sessions table
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) REFERENCES users(id),
      project_id VARCHAR(255) REFERENCES projects(id),
      type VARCHAR(100) NOT NULL,
      data JSONB DEFAULT '{}',
      metadata JSONB DEFAULT '{}',
      status VARCHAR(50) DEFAULT 'active',
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- AI Conversations table
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) REFERENCES users(id),
      project_id VARCHAR(255) REFERENCES projects(id),
      session_id VARCHAR(255) REFERENCES sessions(id),
      title VARCHAR(255),
      messages JSONB DEFAULT '[]',
      context JSONB DEFAULT '{}',
      settings JSONB DEFAULT '{}',
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    
    CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_project_id ON sessions(project_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
    
    CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_conversations_project_id ON ai_conversations(project_id);
    CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_conversations(session_id);
    
    -- Triggers for updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `
};

// =============================================================================
// Export
// =============================================================================

// Create singleton instance
const databaseManager = new DatabaseManager();

module.exports = {
  // Database manager instance
  db: databaseManager,
  
  // Schemas
  mongoSchemas,
  postgresSchemas,
  
  // Utility functions
  initialize: () => databaseManager.initialize(),
  getConnection: (type) => databaseManager.getConnection(type),
  getPool: (type) => databaseManager.getPool(type),
  executeQuery: (type, query, params, options) => 
    databaseManager.executeQuery(type, query, params, options),
  getHealthStatus: () => databaseManager.getHealthStatus(),
  getMetrics: () => databaseManager.getMetrics(),
  close: () => databaseManager.close()
};

// =============================================================================
// End of File
// =============================================================================