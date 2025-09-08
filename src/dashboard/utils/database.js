/**
 * NEXUS IDE Security Dashboard - Advanced Database Utilities
 * Enterprise-grade database management and utilities
 */

const { Pool } = require('pg');
const redis = require('redis');
const mongoose = require('mongoose');
const { DATABASE } = require('../config/dashboard-config');
const logger = require('./logger');
const { encryption } = require('./security');

/**
 * PostgreSQL Database Manager
 */
class PostgreSQLManager {
    constructor(config = DATABASE.postgresql) {
        this.config = config;
        this.pool = null;
        this.isConnected = false;
        this.connectionRetries = 0;
        this.maxRetries = 5;
    }
    
    /**
     * Initialize database connection
     */
    async initialize() {
        try {
            this.pool = new Pool({
                host: this.config.host,
                port: this.config.port,
                database: this.config.database,
                user: this.config.user,
                password: this.config.password,
                max: this.config.maxConnections || 20,
                idleTimeoutMillis: this.config.idleTimeout || 30000,
                connectionTimeoutMillis: this.config.connectionTimeout || 2000,
                ssl: this.config.ssl || false
            });
            
            // Test connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            
            this.isConnected = true;
            this.connectionRetries = 0;
            
            logger.info('PostgreSQL connected successfully', {
                host: this.config.host,
                database: this.config.database
            });
            
            // Setup connection event handlers
            this.pool.on('error', this.handleConnectionError.bind(this));
            this.pool.on('connect', () => {
                logger.debug('New PostgreSQL client connected');
            });
            
            return true;
        } catch (error) {
            logger.error('PostgreSQL connection failed', {
                error: error.message,
                retries: this.connectionRetries
            });
            
            if (this.connectionRetries < this.maxRetries) {
                this.connectionRetries++;
                logger.info(`Retrying PostgreSQL connection in 5 seconds... (${this.connectionRetries}/${this.maxRetries})`);
                await this.delay(5000);
                return this.initialize();
            }
            
            throw error;
        }
    }
    
    /**
     * Handle connection errors
     */
    handleConnectionError(error) {
        logger.error('PostgreSQL connection error', { error: error.message });
        this.isConnected = false;
        
        // Attempt to reconnect
        setTimeout(() => {
            this.initialize().catch(err => {
                logger.error('PostgreSQL reconnection failed', { error: err.message });
            });
        }, 5000);
    }
    
    /**
     * Execute query with error handling
     */
    async query(text, params = []) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }
        
        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            logger.debug('PostgreSQL query executed', {
                duration,
                rowCount: result.rowCount,
                query: text.substring(0, 100) + (text.length > 100 ? '...' : '')
            });
            
            return result;
        } catch (error) {
            const duration = Date.now() - start;
            logger.error('PostgreSQL query failed', {
                error: error.message,
                duration,
                query: text.substring(0, 100) + (text.length > 100 ? '...' : '')
            });
            throw error;
        }
    }
    
    /**
     * Execute transaction
     */
    async transaction(callback) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Get connection pool stats
     */
    getStats() {
        if (!this.pool) {
            return null;
        }
        
        return {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount,
            isConnected: this.isConnected
        };
    }
    
    /**
     * Close all connections
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            this.isConnected = false;
            logger.info('PostgreSQL connections closed');
        }
    }
    
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Redis Cache Manager
 */
class RedisManager {
    constructor(config = DATABASE.redis) {
        this.config = config;
        this.client = null;
        this.subscriber = null;
        this.publisher = null;
        this.isConnected = false;
        this.connectionRetries = 0;
        this.maxRetries = 5;
    }
    
    /**
     * Initialize Redis connection
     */
    async initialize() {
        try {
            const redisConfig = {
                host: this.config.host,
                port: this.config.port,
                password: this.config.password,
                db: this.config.database || 0,
                retryDelayOnFailover: 100,
                enableReadyCheck: false,
                maxRetriesPerRequest: 3
            };
            
            // Main client
            this.client = redis.createClient(redisConfig);
            
            // Pub/Sub clients
            this.subscriber = redis.createClient(redisConfig);
            this.publisher = redis.createClient(redisConfig);
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Connect all clients
            await Promise.all([
                this.client.connect(),
                this.subscriber.connect(),
                this.publisher.connect()
            ]);
            
            this.isConnected = true;
            this.connectionRetries = 0;
            
            logger.info('Redis connected successfully', {
                host: this.config.host,
                database: this.config.database
            });
            
            return true;
        } catch (error) {
            logger.error('Redis connection failed', {
                error: error.message,
                retries: this.connectionRetries
            });
            
            if (this.connectionRetries < this.maxRetries) {
                this.connectionRetries++;
                logger.info(`Retrying Redis connection in 5 seconds... (${this.connectionRetries}/${this.maxRetries})`);
                await this.delay(5000);
                return this.initialize();
            }
            
            throw error;
        }
    }
    
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        const clients = [this.client, this.subscriber, this.publisher].filter(Boolean);
        
        clients.forEach(client => {
            client.on('error', (error) => {
                logger.error('Redis client error', { error: error.message });
                this.isConnected = false;
            });
            
            client.on('connect', () => {
                logger.debug('Redis client connected');
            });
            
            client.on('ready', () => {
                logger.debug('Redis client ready');
                this.isConnected = true;
            });
            
            client.on('end', () => {
                logger.debug('Redis client disconnected');
                this.isConnected = false;
            });
        });
    }
    
    /**
     * Set key-value pair with optional expiration
     */
    async set(key, value, expireInSeconds = null) {
        try {
            const serializedValue = JSON.stringify(value);
            
            if (expireInSeconds) {
                await this.client.setEx(key, expireInSeconds, serializedValue);
            } else {
                await this.client.set(key, serializedValue);
            }
            
            logger.debug('Redis SET operation', { key, expire: expireInSeconds });
        } catch (error) {
            logger.error('Redis SET failed', { key, error: error.message });
            throw error;
        }
    }
    
    /**
     * Get value by key
     */
    async get(key) {
        try {
            const value = await this.client.get(key);
            
            if (value === null) {
                return null;
            }
            
            logger.debug('Redis GET operation', { key });
            return JSON.parse(value);
        } catch (error) {
            logger.error('Redis GET failed', { key, error: error.message });
            throw error;
        }
    }
    
    /**
     * Delete key
     */
    async del(key) {
        try {
            const result = await this.client.del(key);
            logger.debug('Redis DEL operation', { key, deleted: result });
            return result;
        } catch (error) {
            logger.error('Redis DEL failed', { key, error: error.message });
            throw error;
        }
    }
    
    /**
     * Check if key exists
     */
    async exists(key) {
        try {
            return await this.client.exists(key);
        } catch (error) {
            logger.error('Redis EXISTS failed', { key, error: error.message });
            throw error;
        }
    }
    
    /**
     * Set expiration for key
     */
    async expire(key, seconds) {
        try {
            return await this.client.expire(key, seconds);
        } catch (error) {
            logger.error('Redis EXPIRE failed', { key, error: error.message });
            throw error;
        }
    }
    
    /**
     * Increment counter
     */
    async incr(key) {
        try {
            return await this.client.incr(key);
        } catch (error) {
            logger.error('Redis INCR failed', { key, error: error.message });
            throw error;
        }
    }
    
    /**
     * Hash operations
     */
    async hset(key, field, value) {
        try {
            return await this.client.hSet(key, field, JSON.stringify(value));
        } catch (error) {
            logger.error('Redis HSET failed', { key, field, error: error.message });
            throw error;
        }
    }
    
    async hget(key, field) {
        try {
            const value = await this.client.hGet(key, field);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Redis HGET failed', { key, field, error: error.message });
            throw error;
        }
    }
    
    async hgetall(key) {
        try {
            const hash = await this.client.hGetAll(key);
            const result = {};
            
            for (const [field, value] of Object.entries(hash)) {
                result[field] = JSON.parse(value);
            }
            
            return result;
        } catch (error) {
            logger.error('Redis HGETALL failed', { key, error: error.message });
            throw error;
        }
    }
    
    /**
     * List operations
     */
    async lpush(key, ...values) {
        try {
            const serializedValues = values.map(v => JSON.stringify(v));
            return await this.client.lPush(key, serializedValues);
        } catch (error) {
            logger.error('Redis LPUSH failed', { key, error: error.message });
            throw error;
        }
    }
    
    async rpop(key) {
        try {
            const value = await this.client.rPop(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Redis RPOP failed', { key, error: error.message });
            throw error;
        }
    }
    
    /**
     * Pub/Sub operations
     */
    async publish(channel, message) {
        try {
            return await this.publisher.publish(channel, JSON.stringify(message));
        } catch (error) {
            logger.error('Redis PUBLISH failed', { channel, error: error.message });
            throw error;
        }
    }
    
    async subscribe(channel, callback) {
        try {
            await this.subscriber.subscribe(channel, (message) => {
                try {
                    const parsedMessage = JSON.parse(message);
                    callback(parsedMessage);
                } catch (error) {
                    logger.error('Redis message parsing failed', { error: error.message });
                    callback(message);
                }
            });
        } catch (error) {
            logger.error('Redis SUBSCRIBE failed', { channel, error: error.message });
            throw error;
        }
    }
    
    /**
     * Get Redis info
     */
    async getInfo() {
        try {
            return await this.client.info();
        } catch (error) {
            logger.error('Redis INFO failed', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Close all connections
     */
    async close() {
        const clients = [this.client, this.subscriber, this.publisher].filter(Boolean);
        
        await Promise.all(clients.map(client => {
            if (client.isOpen) {
                return client.quit();
            }
        }));
        
        this.isConnected = false;
        logger.info('Redis connections closed');
    }
    
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * MongoDB Manager
 */
class MongoDBManager {
    constructor(config = DATABASE.mongodb) {
        this.config = config;
        this.connection = null;
        this.isConnected = false;
        this.connectionRetries = 0;
        this.maxRetries = 5;
    }
    
    /**
     * Initialize MongoDB connection
     */
    async initialize() {
        try {
            const connectionString = this.buildConnectionString();
            
            await mongoose.connect(connectionString, {
                maxPoolSize: this.config.maxConnections || 10,
                serverSelectionTimeoutMS: this.config.connectionTimeout || 5000,
                socketTimeoutMS: this.config.socketTimeout || 45000,
                bufferCommands: false,
                bufferMaxEntries: 0
            });
            
            this.connection = mongoose.connection;
            this.isConnected = true;
            this.connectionRetries = 0;
            
            // Setup event handlers
            this.setupEventHandlers();
            
            logger.info('MongoDB connected successfully', {
                host: this.config.host,
                database: this.config.database
            });
            
            return true;
        } catch (error) {
            logger.error('MongoDB connection failed', {
                error: error.message,
                retries: this.connectionRetries
            });
            
            if (this.connectionRetries < this.maxRetries) {
                this.connectionRetries++;
                logger.info(`Retrying MongoDB connection in 5 seconds... (${this.connectionRetries}/${this.maxRetries})`);
                await this.delay(5000);
                return this.initialize();
            }
            
            throw error;
        }
    }
    
    /**
     * Build MongoDB connection string
     */
    buildConnectionString() {
        const { host, port, database, user, password, options = {} } = this.config;
        
        let connectionString = 'mongodb://';
        
        if (user && password) {
            connectionString += `${encodeURIComponent(user)}:${encodeURIComponent(password)}@`;
        }
        
        connectionString += `${host}:${port}/${database}`;
        
        const queryParams = new URLSearchParams(options);
        if (queryParams.toString()) {
            connectionString += `?${queryParams.toString()}`;
        }
        
        return connectionString;
    }
    
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        this.connection.on('connected', () => {
            logger.debug('MongoDB connected');
            this.isConnected = true;
        });
        
        this.connection.on('error', (error) => {
            logger.error('MongoDB connection error', { error: error.message });
            this.isConnected = false;
        });
        
        this.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
            this.isConnected = false;
            
            // Attempt to reconnect
            setTimeout(() => {
                this.initialize().catch(err => {
                    logger.error('MongoDB reconnection failed', { error: err.message });
                });
            }, 5000);
        });
    }
    
    /**
     * Get connection stats
     */
    getStats() {
        if (!this.connection) {
            return null;
        }
        
        return {
            readyState: this.connection.readyState,
            isConnected: this.isConnected,
            host: this.connection.host,
            port: this.connection.port,
            name: this.connection.name
        };
    }
    
    /**
     * Close connection
     */
    async close() {
        if (this.connection) {
            await mongoose.connection.close();
            this.isConnected = false;
            logger.info('MongoDB connection closed');
        }
    }
    
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Database Manager - Orchestrates all database connections
 */
class DatabaseManager {
    constructor() {
        this.postgresql = new PostgreSQLManager();
        this.redis = new RedisManager();
        this.mongodb = new MongoDBManager();
        this.isInitialized = false;
    }
    
    /**
     * Initialize all database connections
     */
    async initialize() {
        try {
            const initPromises = [];
            
            // Initialize PostgreSQL if configured
            if (DATABASE.postgresql.enabled) {
                initPromises.push(this.postgresql.initialize());
            }
            
            // Initialize Redis if configured
            if (DATABASE.redis.enabled) {
                initPromises.push(this.redis.initialize());
            }
            
            // Initialize MongoDB if configured
            if (DATABASE.mongodb.enabled) {
                initPromises.push(this.mongodb.initialize());
            }
            
            await Promise.all(initPromises);
            
            this.isInitialized = true;
            logger.info('All databases initialized successfully');
            
            return true;
        } catch (error) {
            logger.error('Database initialization failed', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Get health status of all databases
     */
    async getHealthStatus() {
        const status = {
            overall: 'healthy',
            databases: {}
        };
        
        try {
            // PostgreSQL health
            if (DATABASE.postgresql.enabled) {
                const pgStats = this.postgresql.getStats();
                status.databases.postgresql = {
                    status: pgStats?.isConnected ? 'healthy' : 'unhealthy',
                    stats: pgStats
                };
            }
            
            // Redis health
            if (DATABASE.redis.enabled) {
                status.databases.redis = {
                    status: this.redis.isConnected ? 'healthy' : 'unhealthy',
                    info: this.redis.isConnected ? await this.redis.getInfo() : null
                };
            }
            
            // MongoDB health
            if (DATABASE.mongodb.enabled) {
                const mongoStats = this.mongodb.getStats();
                status.databases.mongodb = {
                    status: mongoStats?.isConnected ? 'healthy' : 'unhealthy',
                    stats: mongoStats
                };
            }
            
            // Check overall health
            const unhealthyDbs = Object.values(status.databases)
                .filter(db => db.status === 'unhealthy');
            
            if (unhealthyDbs.length > 0) {
                status.overall = 'degraded';
            }
            
        } catch (error) {
            logger.error('Health check failed', { error: error.message });
            status.overall = 'unhealthy';
            status.error = error.message;
        }
        
        return status;
    }
    
    /**
     * Close all database connections
     */
    async close() {
        const closePromises = [];
        
        if (DATABASE.postgresql.enabled) {
            closePromises.push(this.postgresql.close());
        }
        
        if (DATABASE.redis.enabled) {
            closePromises.push(this.redis.close());
        }
        
        if (DATABASE.mongodb.enabled) {
            closePromises.push(this.mongodb.close());
        }
        
        await Promise.all(closePromises);
        
        this.isInitialized = false;
        logger.info('All database connections closed');
    }
    
    /**
     * Get database instances
     */
    getPostgreSQL() {
        return this.postgresql;
    }
    
    getRedis() {
        return this.redis;
    }
    
    getMongoDB() {
        return this.mongodb;
    }
}

// Create singleton instance
const databaseManager = new DatabaseManager();

// Export classes and singleton
module.exports = {
    DatabaseManager,
    PostgreSQLManager,
    RedisManager,
    MongoDBManager,
    db: databaseManager,
    postgresql: databaseManager.getPostgreSQL(),
    redis: databaseManager.getRedis(),
    mongodb: databaseManager.getMongoDB()
};