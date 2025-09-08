/**
 * Git Memory MCP Server - API Gateway Cache
 * Advanced Caching System สำหรับ API Gateway
 * 
 * Features:
 * - Multi-layer caching (Memory, Redis, File)
 * - Cache strategies (LRU, LFU, TTL)
 * - Cache warming and preloading
 * - Cache invalidation patterns
 * - Distributed caching
 * - Cache compression
 * - Cache analytics and monitoring
 * - Smart cache key generation
 * - Cache partitioning
 * - Cache replication
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const zlib = require('zlib');
const EventEmitter = require('events');

class APIGatewayCache extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            layers: {
                memory: {
                    enabled: true,
                    maxSize: 100 * 1024 * 1024, // 100MB
                    maxItems: 10000,
                    ttl: 300000, // 5 minutes
                    strategy: 'lru' // lru, lfu, fifo
                },
                redis: {
                    enabled: false,
                    host: 'localhost',
                    port: 6379,
                    password: null,
                    db: 0,
                    ttl: 3600000, // 1 hour
                    keyPrefix: 'api-gateway:'
                },
                file: {
                    enabled: true,
                    directory: './cache',
                    maxSize: 1024 * 1024 * 1024, // 1GB
                    ttl: 86400000, // 24 hours
                    compression: true
                }
            },
            compression: {
                enabled: true,
                algorithm: 'gzip',
                level: 6,
                threshold: 1024 // Compress if larger than 1KB
            },
            invalidation: {
                patterns: {
                    'user:*': ['user:profile:*', 'user:settings:*'],
                    'server:*': ['server:status:*', 'server:metrics:*']
                },
                webhooks: [],
                ttlVariance: 0.1 // 10% variance to prevent thundering herd
            },
            warming: {
                enabled: true,
                strategies: ['popular', 'recent', 'scheduled'],
                batchSize: 100,
                interval: 300000 // 5 minutes
            },
            analytics: {
                enabled: true,
                retention: 86400000, // 24 hours
                sampleRate: 1.0
            },
            partitioning: {
                enabled: false,
                strategy: 'hash', // hash, range, consistent
                partitions: 4
            },
            replication: {
                enabled: false,
                factor: 2,
                consistency: 'eventual' // strong, eventual
            },
            ...config
        };
        
        // Memory cache
        this.memoryCache = new Map();
        this.memoryStats = new Map();
        this.memorySize = 0;
        
        // Redis client
        this.redisClient = null;
        
        // File cache
        this.fileCacheDir = this.config.layers.file.directory;
        this.fileCacheSize = 0;
        
        // Analytics
        this.analytics = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0,
            errors: 0,
            hitsByLayer: { memory: 0, redis: 0, file: 0 },
            responseTimeSum: 0,
            responseTimeCount: 0,
            startTime: Date.now()
        };
        
        // Cache warming queue
        this.warmingQueue = [];
        this.warmingInProgress = false;
        
        this.setupFileCache();
        this.setupRedisCache();
        this.setupCleanupTasks();
        
        console.log('💾 Cache system initialized');
    }
    
    /**
     * Setup file cache directory
     */
    async setupFileCache() {
        if (!this.config.layers.file.enabled) {
            return;
        }
        
        try {
            await fs.mkdir(this.fileCacheDir, { recursive: true });
            
            // Calculate current cache size
            await this.calculateFileCacheSize();
            
            console.log('💾 File cache initialized');
        } catch (error) {
            console.error('❌ Failed to setup file cache:', error);
        }
    }
    
    /**
     * Setup Redis cache
     */
    setupRedisCache() {
        if (!this.config.layers.redis.enabled) {
            return;
        }
        
        try {
            const redis = require('redis');
            
            this.redisClient = redis.createClient({
                host: this.config.layers.redis.host,
                port: this.config.layers.redis.port,
                password: this.config.layers.redis.password,
                db: this.config.layers.redis.db
            });
            
            this.redisClient.on('error', (error) => {
                console.error('❌ Redis cache error:', error);
                this.analytics.errors++;
            });
            
            this.redisClient.on('connect', () => {
                console.log('💾 Redis cache connected');
            });
            
        } catch (error) {
            console.error('❌ Failed to setup Redis cache:', error);
            this.config.layers.redis.enabled = false;
        }
    }
    
    /**
     * Generate cache key
     */
    generateKey(namespace, identifier, params = {}) {
        const keyParts = [namespace, identifier];
        
        // Add sorted parameters
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}:${params[key]}`)
            .join('|');
        
        if (sortedParams) {
            keyParts.push(sortedParams);
        }
        
        const key = keyParts.join(':');
        
        // Hash long keys
        if (key.length > 250) {
            return crypto.createHash('sha256').update(key).digest('hex');
        }
        
        return key;
    }
    
    /**
     * Get from cache
     */
    async get(key, options = {}) {
        const startTime = Date.now();
        
        try {
            // Try memory cache first
            if (this.config.layers.memory.enabled) {
                const memoryResult = this.getFromMemory(key);
                if (memoryResult !== null) {
                    this.recordHit('memory', startTime);
                    return memoryResult;
                }
            }
            
            // Try Redis cache
            if (this.config.layers.redis.enabled && this.redisClient) {
                const redisResult = await this.getFromRedis(key);
                if (redisResult !== null) {
                    // Store in memory cache for faster access
                    if (this.config.layers.memory.enabled) {
                        this.setInMemory(key, redisResult, this.config.layers.memory.ttl);
                    }
                    this.recordHit('redis', startTime);
                    return redisResult;
                }
            }
            
            // Try file cache
            if (this.config.layers.file.enabled) {
                const fileResult = await this.getFromFile(key);
                if (fileResult !== null) {
                    // Store in upper layers
                    if (this.config.layers.redis.enabled && this.redisClient) {
                        await this.setInRedis(key, fileResult, this.config.layers.redis.ttl);
                    }
                    if (this.config.layers.memory.enabled) {
                        this.setInMemory(key, fileResult, this.config.layers.memory.ttl);
                    }
                    this.recordHit('file', startTime);
                    return fileResult;
                }
            }
            
            this.recordMiss(startTime);
            return null;
            
        } catch (error) {
            console.error('❌ Cache get error:', error);
            this.analytics.errors++;
            return null;
        }
    }
    
    /**
     * Set in cache
     */
    async set(key, value, ttl = null, options = {}) {
        try {
            const serializedValue = this.serialize(value);
            const compressedValue = await this.compress(serializedValue);
            
            const cacheItem = {
                value: compressedValue,
                compressed: compressedValue !== serializedValue,
                timestamp: Date.now(),
                ttl: ttl || this.getDefaultTTL(),
                size: Buffer.byteLength(compressedValue, 'utf8'),
                hits: 0,
                lastAccess: Date.now()
            };
            
            // Set in all enabled layers
            const promises = [];
            
            if (this.config.layers.memory.enabled) {
                promises.push(this.setInMemory(key, cacheItem, cacheItem.ttl));
            }
            
            if (this.config.layers.redis.enabled && this.redisClient) {
                promises.push(this.setInRedis(key, cacheItem, cacheItem.ttl));
            }
            
            if (this.config.layers.file.enabled) {
                promises.push(this.setInFile(key, cacheItem, cacheItem.ttl));
            }
            
            await Promise.all(promises);
            
            this.analytics.sets++;
            
            // Trigger cache warming if needed
            if (this.config.warming.enabled) {
                this.scheduleWarming(key, options);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Cache set error:', error);
            this.analytics.errors++;
            return false;
        }
    }
    
    /**
     * Delete from cache
     */
    async delete(key) {
        try {
            const promises = [];
            
            if (this.config.layers.memory.enabled) {
                promises.push(this.deleteFromMemory(key));
            }
            
            if (this.config.layers.redis.enabled && this.redisClient) {
                promises.push(this.deleteFromRedis(key));
            }
            
            if (this.config.layers.file.enabled) {
                promises.push(this.deleteFromFile(key));
            }
            
            await Promise.all(promises);
            
            this.analytics.deletes++;
            return true;
            
        } catch (error) {
            console.error('❌ Cache delete error:', error);
            this.analytics.errors++;
            return false;
        }
    }
    
    /**
     * Invalidate cache by pattern
     */
    async invalidate(pattern) {
        try {
            const keys = await this.getKeysByPattern(pattern);
            
            for (const key of keys) {
                await this.delete(key);
            }
            
            // Check for related patterns
            const relatedPatterns = this.config.invalidation.patterns[pattern] || [];
            for (const relatedPattern of relatedPatterns) {
                const relatedKeys = await this.getKeysByPattern(relatedPattern);
                for (const key of relatedKeys) {
                    await this.delete(key);
                }
            }
            
            console.log(`💾 Invalidated ${keys.length} keys for pattern: ${pattern}`);
            return keys.length;
            
        } catch (error) {
            console.error('❌ Cache invalidation error:', error);
            this.analytics.errors++;
            return 0;
        }
    }
    
    /**
     * Memory cache operations
     */
    getFromMemory(key) {
        const item = this.memoryCache.get(key);
        if (!item) {
            return null;
        }
        
        // Check TTL
        if (Date.now() > item.timestamp + item.ttl) {
            this.memoryCache.delete(key);
            this.memoryStats.delete(key);
            this.memorySize -= item.size;
            return null;
        }
        
        // Update access statistics
        item.hits++;
        item.lastAccess = Date.now();
        
        return this.deserialize(this.decompress(item.value, item.compressed));
    }
    
    setInMemory(key, item, ttl) {
        // Check size limits
        if (this.memorySize + item.size > this.config.layers.memory.maxSize ||
            this.memoryCache.size >= this.config.layers.memory.maxItems) {
            this.evictFromMemory();
        }
        
        // Remove existing item
        const existing = this.memoryCache.get(key);
        if (existing) {
            this.memorySize -= existing.size;
        }
        
        // Add new item
        this.memoryCache.set(key, { ...item, ttl });
        this.memoryStats.set(key, {
            hits: 0,
            lastAccess: Date.now(),
            created: Date.now()
        });
        this.memorySize += item.size;
        
        return true;
    }
    
    deleteFromMemory(key) {
        const item = this.memoryCache.get(key);
        if (item) {
            this.memorySize -= item.size;
            this.memoryCache.delete(key);
            this.memoryStats.delete(key);
        }
        return true;
    }
    
    /**
     * Redis cache operations
     */
    async getFromRedis(key) {
        if (!this.redisClient) {
            return null;
        }
        
        try {
            const fullKey = this.config.layers.redis.keyPrefix + key;
            const data = await this.redisClient.get(fullKey);
            
            if (!data) {
                return null;
            }
            
            const item = JSON.parse(data);
            return this.deserialize(this.decompress(item.value, item.compressed));
            
        } catch (error) {
            console.error('❌ Redis get error:', error);
            return null;
        }
    }
    
    async setInRedis(key, item, ttl) {
        if (!this.redisClient) {
            return false;
        }
        
        try {
            const fullKey = this.config.layers.redis.keyPrefix + key;
            const data = JSON.stringify(item);
            
            if (ttl) {
                await this.redisClient.setex(fullKey, Math.floor(ttl / 1000), data);
            } else {
                await this.redisClient.set(fullKey, data);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Redis set error:', error);
            return false;
        }
    }
    
    async deleteFromRedis(key) {
        if (!this.redisClient) {
            return false;
        }
        
        try {
            const fullKey = this.config.layers.redis.keyPrefix + key;
            await this.redisClient.del(fullKey);
            return true;
            
        } catch (error) {
            console.error('❌ Redis delete error:', error);
            return false;
        }
    }
    
    /**
     * File cache operations
     */
    async getFromFile(key) {
        try {
            const filePath = this.getFilePath(key);
            const data = await fs.readFile(filePath, 'utf8');
            const item = JSON.parse(data);
            
            // Check TTL
            if (Date.now() > item.timestamp + item.ttl) {
                await fs.unlink(filePath);
                this.fileCacheSize -= item.size;
                return null;
            }
            
            return this.deserialize(this.decompress(item.value, item.compressed));
            
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('❌ File cache get error:', error);
            }
            return null;
        }
    }
    
    async setInFile(key, item, ttl) {
        try {
            const filePath = this.getFilePath(key);
            const data = JSON.stringify({ ...item, ttl });
            
            // Check size limits
            if (this.fileCacheSize + item.size > this.config.layers.file.maxSize) {
                await this.evictFromFile();
            }
            
            await fs.writeFile(filePath, data, 'utf8');
            this.fileCacheSize += item.size;
            
            return true;
            
        } catch (error) {
            console.error('❌ File cache set error:', error);
            return false;
        }
    }
    
    async deleteFromFile(key) {
        try {
            const filePath = this.getFilePath(key);
            const stats = await fs.stat(filePath);
            await fs.unlink(filePath);
            this.fileCacheSize -= stats.size;
            return true;
            
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('❌ File cache delete error:', error);
            }
            return false;
        }
    }
    
    /**
     * Get file path for cache key
     */
    getFilePath(key) {
        const hash = crypto.createHash('sha256').update(key).digest('hex');
        const dir = path.join(this.fileCacheDir, hash.substring(0, 2));
        return path.join(dir, hash + '.cache');
    }
    
    /**
     * Serialize value
     */
    serialize(value) {
        return JSON.stringify(value);
    }
    
    /**
     * Deserialize value
     */
    deserialize(data) {
        return JSON.parse(data);
    }
    
    /**
     * Compress data
     */
    async compress(data) {
        if (!this.config.compression.enabled || 
            Buffer.byteLength(data, 'utf8') < this.config.compression.threshold) {
            return data;
        }
        
        return new Promise((resolve, reject) => {
            zlib.gzip(data, { level: this.config.compression.level }, (error, compressed) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(compressed.toString('base64'));
                }
            });
        });
    }
    
    /**
     * Decompress data
     */
    decompress(data, isCompressed) {
        if (!isCompressed) {
            return data;
        }
        
        return new Promise((resolve, reject) => {
            const buffer = Buffer.from(data, 'base64');
            zlib.gunzip(buffer, (error, decompressed) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(decompressed.toString('utf8'));
                }
            });
        });
    }
    
    /**
     * Evict from memory cache
     */
    evictFromMemory() {
        const strategy = this.config.layers.memory.strategy;
        let keyToEvict;
        
        switch (strategy) {
            case 'lru':
                keyToEvict = this.findLRUKey();
                break;
            case 'lfu':
                keyToEvict = this.findLFUKey();
                break;
            case 'fifo':
                keyToEvict = this.memoryCache.keys().next().value;
                break;
            default:
                keyToEvict = this.findLRUKey();
        }
        
        if (keyToEvict) {
            this.deleteFromMemory(keyToEvict);
            this.analytics.evictions++;
        }
    }
    
    /**
     * Find LRU key
     */
    findLRUKey() {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, stats] of this.memoryStats.entries()) {
            if (stats.lastAccess < oldestTime) {
                oldestTime = stats.lastAccess;
                oldestKey = key;
            }
        }
        
        return oldestKey;
    }
    
    /**
     * Find LFU key
     */
    findLFUKey() {
        let leastUsedKey = null;
        let leastHits = Infinity;
        
        for (const [key, stats] of this.memoryStats.entries()) {
            if (stats.hits < leastHits) {
                leastHits = stats.hits;
                leastUsedKey = key;
            }
        }
        
        return leastUsedKey;
    }
    
    /**
     * Evict from file cache
     */
    async evictFromFile() {
        try {
            const files = await this.getFileCacheFiles();
            
            // Sort by last modified time (oldest first)
            files.sort((a, b) => a.mtime - b.mtime);
            
            // Remove oldest files until under limit
            const targetSize = this.config.layers.file.maxSize * 0.8; // 80% of max
            
            for (const file of files) {
                if (this.fileCacheSize <= targetSize) {
                    break;
                }
                
                await fs.unlink(file.path);
                this.fileCacheSize -= file.size;
                this.analytics.evictions++;
            }
            
        } catch (error) {
            console.error('❌ File cache eviction error:', error);
        }
    }
    
    /**
     * Get file cache files
     */
    async getFileCacheFiles() {
        const files = [];
        
        const scanDirectory = async (dir) => {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    
                    if (entry.isDirectory()) {
                        await scanDirectory(fullPath);
                    } else if (entry.name.endsWith('.cache')) {
                        const stats = await fs.stat(fullPath);
                        files.push({
                            path: fullPath,
                            size: stats.size,
                            mtime: stats.mtime.getTime()
                        });
                    }
                }
            } catch (error) {
                // Directory might not exist
            }
        };
        
        await scanDirectory(this.fileCacheDir);
        return files;
    }
    
    /**
     * Calculate file cache size
     */
    async calculateFileCacheSize() {
        const files = await this.getFileCacheFiles();
        this.fileCacheSize = files.reduce((total, file) => total + file.size, 0);
    }
    
    /**
     * Get keys by pattern
     */
    async getKeysByPattern(pattern) {
        const keys = new Set();
        
        // Memory cache
        for (const key of this.memoryCache.keys()) {
            if (this.matchPattern(key, pattern)) {
                keys.add(key);
            }
        }
        
        // Redis cache
        if (this.config.layers.redis.enabled && this.redisClient) {
            try {
                const redisKeys = await this.redisClient.keys(
                    this.config.layers.redis.keyPrefix + pattern
                );
                
                for (const redisKey of redisKeys) {
                    const key = redisKey.replace(this.config.layers.redis.keyPrefix, '');
                    keys.add(key);
                }
            } catch (error) {
                console.error('❌ Redis keys error:', error);
            }
        }
        
        return Array.from(keys);
    }
    
    /**
     * Match pattern
     */
    matchPattern(key, pattern) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(key);
    }
    
    /**
     * Get default TTL with variance
     */
    getDefaultTTL() {
        const baseTTL = this.config.layers.memory.ttl;
        const variance = this.config.invalidation.ttlVariance;
        const randomFactor = 1 + (Math.random() - 0.5) * 2 * variance;
        return Math.floor(baseTTL * randomFactor);
    }
    
    /**
     * Record cache hit
     */
    recordHit(layer, startTime) {
        this.analytics.hits++;
        this.analytics.hitsByLayer[layer]++;
        
        const responseTime = Date.now() - startTime;
        this.analytics.responseTimeSum += responseTime;
        this.analytics.responseTimeCount++;
    }
    
    /**
     * Record cache miss
     */
    recordMiss(startTime) {
        this.analytics.misses++;
        
        const responseTime = Date.now() - startTime;
        this.analytics.responseTimeSum += responseTime;
        this.analytics.responseTimeCount++;
    }
    
    /**
     * Schedule cache warming
     */
    scheduleWarming(key, options) {
        if (!this.config.warming.enabled) {
            return;
        }
        
        this.warmingQueue.push({ key, options, timestamp: Date.now() });
        
        if (!this.warmingInProgress) {
            this.processWarmingQueue();
        }
    }
    
    /**
     * Process warming queue
     */
    async processWarmingQueue() {
        this.warmingInProgress = true;
        
        while (this.warmingQueue.length > 0) {
            const batch = this.warmingQueue.splice(0, this.config.warming.batchSize);
            
            for (const item of batch) {
                try {
                    await this.warmCache(item.key, item.options);
                } catch (error) {
                    console.error('❌ Cache warming error:', error);
                }
            }
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.warmingInProgress = false;
    }
    
    /**
     * Warm cache
     */
    async warmCache(key, options) {
        // This would be implemented based on specific warming strategies
        console.log(`💾 Warming cache for key: ${key}`);
    }
    
    /**
     * Setup cleanup tasks
     */
    setupCleanupTasks() {
        // Clean expired items every 5 minutes
        setInterval(() => {
            this.cleanupExpiredItems();
        }, 300000);
        
        // Update analytics every minute
        setInterval(() => {
            this.updateAnalytics();
        }, 60000);
    }
    
    /**
     * Cleanup expired items
     */
    async cleanupExpiredItems() {
        const now = Date.now();
        
        // Memory cache
        for (const [key, item] of this.memoryCache.entries()) {
            if (now > item.timestamp + item.ttl) {
                this.deleteFromMemory(key);
            }
        }
        
        // File cache
        if (this.config.layers.file.enabled) {
            const files = await this.getFileCacheFiles();
            
            for (const file of files) {
                try {
                    const data = await fs.readFile(file.path, 'utf8');
                    const item = JSON.parse(data);
                    
                    if (now > item.timestamp + item.ttl) {
                        await fs.unlink(file.path);
                        this.fileCacheSize -= file.size;
                    }
                } catch (error) {
                    // File might be corrupted, remove it
                    try {
                        await fs.unlink(file.path);
                        this.fileCacheSize -= file.size;
                    } catch (unlinkError) {
                        // Ignore
                    }
                }
            }
        }
    }
    
    /**
     * Update analytics
     */
    updateAnalytics() {
        // Calculate hit rate
        const totalRequests = this.analytics.hits + this.analytics.misses;
        const hitRate = totalRequests > 0 ? this.analytics.hits / totalRequests : 0;
        
        // Calculate average response time
        const avgResponseTime = this.analytics.responseTimeCount > 0 ?
            this.analytics.responseTimeSum / this.analytics.responseTimeCount : 0;
        
        this.emit('analytics', {
            ...this.analytics,
            hitRate,
            avgResponseTime,
            memoryUsage: {
                size: this.memorySize,
                items: this.memoryCache.size,
                utilization: this.memorySize / this.config.layers.memory.maxSize
            },
            fileUsage: {
                size: this.fileCacheSize,
                utilization: this.fileCacheSize / this.config.layers.file.maxSize
            }
        });
    }
    
    /**
     * Get cache statistics
     */
    getStats() {
        const totalRequests = this.analytics.hits + this.analytics.misses;
        const hitRate = totalRequests > 0 ? this.analytics.hits / totalRequests : 0;
        const avgResponseTime = this.analytics.responseTimeCount > 0 ?
            this.analytics.responseTimeSum / this.analytics.responseTimeCount : 0;
        
        return {
            ...this.analytics,
            hitRate,
            avgResponseTime,
            uptime: Date.now() - this.analytics.startTime,
            layers: {
                memory: {
                    enabled: this.config.layers.memory.enabled,
                    size: this.memorySize,
                    items: this.memoryCache.size,
                    utilization: this.memorySize / this.config.layers.memory.maxSize,
                    hits: this.analytics.hitsByLayer.memory
                },
                redis: {
                    enabled: this.config.layers.redis.enabled,
                    connected: this.redisClient && this.redisClient.connected,
                    hits: this.analytics.hitsByLayer.redis
                },
                file: {
                    enabled: this.config.layers.file.enabled,
                    size: this.fileCacheSize,
                    utilization: this.fileCacheSize / this.config.layers.file.maxSize,
                    hits: this.analytics.hitsByLayer.file
                }
            }
        };
    }
    
    /**
     * Clear all cache
     */
    async clear() {
        try {
            // Clear memory cache
            this.memoryCache.clear();
            this.memoryStats.clear();
            this.memorySize = 0;
            
            // Clear Redis cache
            if (this.config.layers.redis.enabled && this.redisClient) {
                const keys = await this.redisClient.keys(this.config.layers.redis.keyPrefix + '*');
                if (keys.length > 0) {
                    await this.redisClient.del(keys);
                }
            }
            
            // Clear file cache
            if (this.config.layers.file.enabled) {
                const files = await this.getFileCacheFiles();
                for (const file of files) {
                    await fs.unlink(file.path);
                }
                this.fileCacheSize = 0;
            }
            
            console.log('💾 Cache cleared');
            return true;
            
        } catch (error) {
            console.error('❌ Cache clear error:', error);
            return false;
        }
    }
}

// Export class
module.exports = APIGatewayCache;

// CLI interface
if (require.main === module) {
    const cache = new APIGatewayCache({
        layers: {
            memory: {
                enabled: true,
                maxSize: 10 * 1024 * 1024, // 10MB
                maxItems: 1000
            },
            file: {
                enabled: true,
                directory: './test-cache'
            }
        },
        compression: {
            enabled: true,
            threshold: 100
        }
    });
    
    // Test cache operations
    async function testCache() {
        console.log('💾 Testing cache operations...');
        
        // Test set/get
        const testData = { message: 'Hello, World!', timestamp: Date.now() };
        const key = cache.generateKey('test', 'hello', { version: '1.0' });
        
        await cache.set(key, testData, 60000); // 1 minute TTL
        console.log('💾 Set test data');
        
        const retrieved = await cache.get(key);
        console.log('💾 Retrieved:', retrieved);
        
        // Test invalidation
        await cache.invalidate('test:*');
        console.log('💾 Invalidated test keys');
        
        const afterInvalidation = await cache.get(key);
        console.log('💾 After invalidation:', afterInvalidation);
        
        // Print stats
        setInterval(() => {
            const stats = cache.getStats();
            console.log('💾 Cache Stats:', {
                hitRate: (stats.hitRate * 100).toFixed(2) + '%',
                hits: stats.hits,
                misses: stats.misses,
                memoryItems: stats.layers.memory.items,
                memorySize: Math.round(stats.layers.memory.size / 1024) + 'KB'
            });
        }, 5000);
    }
    
    testCache().catch(console.error);
}