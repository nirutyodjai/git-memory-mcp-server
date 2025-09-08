/**
 * Cache and Compression Service
 * จัดการระบบ caching และ compression สำหรับข้อมูลขนาดใหญ่
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const zlib = require('zlib');
const NodeCache = require('node-cache');
// Removed top-level Redis and LRU requires to avoid ESM import issues
// const Redis = require('redis');
// const LRU = require('lru-cache');
const { promisify } = require('util');
const logger = require('../utils/logger');

// Compression algorithms
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);
const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

class CacheCompressionService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = config;
    this.id = config.id || `cache-compression-${crypto.randomUUID()}`;
    
    // Cache configuration
    this.cacheEnabled = config.cacheEnabled !== false;
    this.compressionEnabled = config.compressionEnabled !== false;
    
    // Cache layers
    this.memoryCache = null;  // L1 - Memory cache
    this.redisCache = null;   // L2 - Redis cache
    this.lruCache = null;     // L3 - LRU cache
    
    // Compression settings
    this.compressionAlgorithm = config.compressionAlgorithm || 'gzip'; // gzip, deflate, brotli
    this.compressionLevel = config.compressionLevel || 6;
    this.compressionThreshold = config.compressionThreshold || 1024; // bytes
    
    // Cache settings
    this.memoryCacheSize = config.memoryCacheSize || 1000;
    this.memoryCacheTtl = config.memoryCacheTtl || 3600; // seconds
    this.redisCacheTtl = config.redisCacheTtl || 86400; // seconds
    this.lruCacheSize = config.lruCacheSize || 10000;
    
    // Performance metrics
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.compressionRatio = 0;
    this.totalCompressions = 0;
    this.averageCompressionTime = 0;
    this.averageDecompressionTime = 0;
    
    // Redis configuration
    this.redisConfig = config.redis || {
      host: 'localhost',
      port: 6379,
      db: 0
    };
    
    // Cache strategy
    this.cacheStrategy = config.cacheStrategy || 'write-through'; // write-through, write-back, write-around
    
    logger.info(`CacheCompressionService initialized with strategy: ${this.cacheStrategy}`);
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      logger.info(`Initializing CacheCompressionService ${this.id}...`);
      
      if (this.cacheEnabled) {
        await this.initializeCaches();
      }
      
      this.emit('initialized', { serviceId: this.id });
      
      logger.info(`CacheCompressionService ${this.id} initialized successfully`);
      return true;
      
    } catch (error) {
      logger.error(`Failed to initialize CacheCompressionService ${this.id}:`, error);
      throw error;
    }
  }

  /**
   * Initialize cache layers
   */
  async initializeCaches() {
    try {
      // L1 - Memory cache (fastest)
      this.memoryCache = new NodeCache({
        stdTTL: this.memoryCacheTtl,
        maxKeys: this.memoryCacheSize,
        checkperiod: 600,
        useClones: false
      });
      
      // L2 - Redis cache (persistent)
      if (this.redisConfig.enabled !== false) {
        try {
          // Dynamically import redis to avoid ESM require issues
          const redisModule = await import('redis');
          const createClient = redisModule.createClient || (redisModule.default && redisModule.default.createClient);

          if (!createClient) {
            throw new Error('Redis module does not expose createClient');
          }

          // Build options compatible with redis v4/v5
          const redisOptions = this.redisConfig.url
            ? { url: this.redisConfig.url }
            : {
                socket: {
                  host: this.redisConfig.host || 'localhost',
                  port: this.redisConfig.port || 6379,
                },
                database: this.redisConfig.db ?? 0,
              };

          this.redisCache = createClient(redisOptions);

          this.redisCache.on('error', (error) => {
            logger.error('Redis cache error:', error);
          });

          await this.redisCache.connect();
          
          logger.info('Redis cache connected successfully');
        } catch (error) {
          logger.warn(`Redis cache not available or failed to initialize, continuing without it: ${error.message}`);
          this.redisCache = null;
        }
      }
      
      // L3 - LRU cache (memory-efficient)
      try {
        // Dynamically import lru-cache to support both CJS/ESM
        const lruModule = await import('lru-cache');
        const LRUClass = lruModule.default || lruModule.LRUCache || lruModule;
        
        this.lruCache = new LRUClass({
          maxSize: this.lruCacheSize * 1024 * 1024, // MB to bytes
          sizeCalculation: (value, key) => {
            return JSON.stringify(value).length + key.length;
          },
          dispose: (value, key) => {
            logger.debug(`LRU cache evicted key: ${key}`);
          }
        });
      } catch (error) {
        logger.warn(`Failed to initialize LRU cache, continuing without it: ${error.message}`);
        this.lruCache = null;
      }
      
      logger.info('All cache layers initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize cache layers:', error);
      throw error;
    }
  }

  /**
   * Store data with caching and compression
   */
  async store(key, data, options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate input
      if (!key || data === undefined) {
        throw new Error('Key and data are required');
      }
      
      const ttl = options.ttl || this.memoryCacheTtl;
      const forceCompression = options.forceCompression || false;
      
      // Convert data to buffer if needed
      let dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(JSON.stringify(data));
      let compressed = false;
      let compressionAlgo = null;
      
      // Apply compression if enabled and threshold met
      if (this.compressionEnabled && (dataBuffer.length >= this.compressionThreshold || forceCompression)) {
        const compressStartTime = Date.now();
        dataBuffer = await this.compress(dataBuffer);
        compressed = true;
        compressionAlgo = this.compressionAlgorithm;
        
        const compressionTime = Date.now() - compressStartTime;
        this.updateCompressionMetrics(compressionTime, true);
        
        logger.debug(`Compressed data for key ${key}: ${dataBuffer.length} bytes`);
      }
      
      // Create cache entry
      const cacheEntry = {
        data: dataBuffer,
        compressed,
        compressionAlgo,
        timestamp: Date.now(),
        size: dataBuffer.length,
        originalSize: Buffer.isBuffer(data) ? data.length : JSON.stringify(data).length
      };
      
      // Store in cache layers based on strategy
      await this.storeInCacheLayers(key, cacheEntry, ttl);
      
      const totalTime = Date.now() - startTime;
      logger.debug(`Stored key ${key} in ${totalTime}ms`);
      
      this.emit('stored', { key, size: cacheEntry.size, compressed, time: totalTime });
      
      return {
        key,
        size: cacheEntry.size,
        originalSize: cacheEntry.originalSize,
        compressed,
        compressionRatio: compressed ? (cacheEntry.originalSize / cacheEntry.size).toFixed(2) : 1,
        storageTime: totalTime
      };
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      logger.error(`Failed to store key ${key}:`, error);
      this.emit('error', { operation: 'store', key, error, time: totalTime });
      throw error;
    }
  }

  /**
   * Retrieve data from cache with decompression
   */
  async retrieve(key, options = {}) {
    const startTime = Date.now();
    
    try {
      if (!key) {
        throw new Error('Key is required');
      }
      
      // Try to get from cache layers
      const cacheEntry = await this.getFromCacheLayers(key);
      
      if (!cacheEntry) {
        this.cacheMisses++;
        this.emit('miss', { key, time: Date.now() - startTime });
        return null;
      }
      
      this.cacheHits++;
      
      let data = cacheEntry.data;
      
      // Decompress if needed
      if (cacheEntry.compressed) {
        const decompressStartTime = Date.now();
        data = await this.decompress(data, cacheEntry.compressionAlgo);
        
        const decompressionTime = Date.now() - decompressStartTime;
        this.updateCompressionMetrics(decompressionTime, false);
        
        logger.debug(`Decompressed data for key ${key}: ${data.length} bytes`);
      }
      
      // Parse data if it was originally JSON
      let result = data;
      if (!Buffer.isBuffer(data)) {
        try {
          result = JSON.parse(data.toString());
        } catch (error) {
          // Keep as buffer if parsing fails
          result = data;
        }
      }
      
      const totalTime = Date.now() - startTime;
      logger.debug(`Retrieved key ${key} in ${totalTime}ms`);
      
      this.emit('hit', { key, size: cacheEntry.size, compressed: cacheEntry.compressed, time: totalTime });
      
      return {
        data: result,
        metadata: {
          key,
          size: cacheEntry.size,
          originalSize: cacheEntry.originalSize,
          compressed: cacheEntry.compressed,
          timestamp: cacheEntry.timestamp,
          age: Date.now() - cacheEntry.timestamp,
          retrievalTime: totalTime
        }
      };
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      logger.error(`Failed to retrieve key ${key}:`, error);
      this.emit('error', { operation: 'retrieve', key, error, time: totalTime });
      throw error;
    }
  }

  /**
   * Store in cache layers based on strategy
   */
  async storeInCacheLayers(key, cacheEntry, ttl) {
    const promises = [];
    
    // L1 - Memory cache (always store if enabled)
    if (this.memoryCache) {
      this.memoryCache.set(key, cacheEntry, ttl);
    }
    
    // L2 - Redis cache
    if (this.redisCache) {
      promises.push(
        this.redisCache.setEx(key, this.redisCacheTtl, JSON.stringify(cacheEntry))
          .catch(error => logger.warn(`Redis cache store failed for key ${key}:`, error))
      );
    }
    
    // L3 - LRU cache
    if (this.lruCache) {
      this.lruCache.set(key, cacheEntry);
    }
    
    // Wait for async operations
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  /**
   * Get from cache layers (L1 -> L2 -> L3)
   */
  async getFromCacheLayers(key) {
    // L1 - Memory cache (fastest)
    if (this.memoryCache) {
      const entry = this.memoryCache.get(key);
      if (entry) {
        logger.debug(`Cache hit in L1 (memory) for key: ${key}`);
        return entry;
      }
    }
    
    // L2 - Redis cache
    if (this.redisCache) {
      try {
        const entry = await this.redisCache.get(key);
        if (entry) {
          const parsedEntry = JSON.parse(entry);
          // Populate L1 cache
          if (this.memoryCache) {
            this.memoryCache.set(key, parsedEntry);
          }
          logger.debug(`Cache hit in L2 (Redis) for key: ${key}`);
          return parsedEntry;
        }
      } catch (error) {
        logger.warn(`Redis cache get failed for key ${key}:`, error);
      }
    }
    
    // L3 - LRU cache
    if (this.lruCache) {
      const entry = this.lruCache.get(key);
      if (entry) {
        // Populate upper cache layers
        if (this.memoryCache) {
          this.memoryCache.set(key, entry);
        }
        if (this.redisCache) {
          this.redisCache.setEx(key, this.redisCacheTtl, JSON.stringify(entry))
            .catch(error => logger.warn(`Redis cache populate failed for key ${key}:`, error));
        }
        logger.debug(`Cache hit in L3 (LRU) for key: ${key}`);
        return entry;
      }
    }
    
    return null;
  }

  /**
   * Compress data using configured algorithm
   */
  async compress(data) {
    switch (this.compressionAlgorithm) {
      case 'gzip':
        return await gzip(data, { level: this.compressionLevel });
      case 'deflate':
        return await deflate(data, { level: this.compressionLevel });
      case 'brotli':
        return await brotliCompress(data, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: this.compressionLevel
          }
        });
      default:
        throw new Error(`Unknown compression algorithm: ${this.compressionAlgorithm}`);
    }
  }

  /**
   * Decompress data using specified algorithm
   */
  async decompress(data, algorithm) {
    switch (algorithm || this.compressionAlgorithm) {
      case 'gzip':
        return await gunzip(data);
      case 'deflate':  
        return await inflate(data);
      case 'brotli':
        return await brotliDecompress(data);
      default:
        throw new Error(`Unknown compression algorithm: ${algorithm}`);
    }
  }

  /**
   * Delete from all cache layers
   */
  async delete(key) {
    const promises = [];
    
    if (this.memoryCache) {
      this.memoryCache.del(key);
    }
    
    if (this.redisCache) {
      promises.push(
        this.redisCache.del(key)
          .catch(error => logger.warn(`Redis cache delete failed for key ${key}:`, error))
      );
    }
    
    if (this.lruCache) {
      this.lruCache.delete(key);
    }
    
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
    
    this.emit('deleted', { key });
    logger.debug(`Deleted key ${key} from all cache layers`);
  }

  /**
   * Clear all caches
   */
  async clear() {
    const promises = [];
    
    if (this.memoryCache) {
      this.memoryCache.flushAll();
    }
    
    if (this.redisCache) {
      promises.push(
        this.redisCache.flushDb()
          .catch(error => logger.warn('Redis cache clear failed:', error))
      );
    }
    
    if (this.lruCache) {
      this.lruCache.clear();
    }
    
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
    
    this.emit('cleared');
    logger.info('All cache layers cleared');
  }

  /**
   * Update compression metrics
   */
  updateCompressionMetrics(time, isCompression) {
    this.totalCompressions++;
    
    if (isCompression) {
      this.averageCompressionTime = 
        (this.averageCompressionTime * (this.totalCompressions - 1) + time) / this.totalCompressions;
    } else {
      this.averageDecompressionTime = 
        (this.averageDecompressionTime * (this.totalCompressions - 1) + time) / this.totalCompressions;
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    const hitRate = this.cacheHits + this.cacheMisses > 0 ? 
      (this.cacheHits / (this.cacheHits + this.cacheMisses) * 100).toFixed(2) : 0;
    
    return {
      id: this.id,
      cacheEnabled: this.cacheEnabled,
      compressionEnabled: this.compressionEnabled,
      cacheStats: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate: `${hitRate}%`,
        totalRequests: this.cacheHits + this.cacheMisses
      },
      compressionStats: {
        algorithm: this.compressionAlgorithm,
        level: this.compressionLevel,
        threshold: this.compressionThreshold,
        totalCompressions: this.totalCompressions,
        averageCompressionTime: Math.round(this.averageCompressionTime),
        averageDecompressionTime: Math.round(this.averageDecompressionTime)
      },
      cacheLayers: {
        memory: this.memoryCache ? {
          keys: this.memoryCache.keys().length,
          size: this.memoryCacheSize
        } : null,
        redis: this.redisCache ? {
          connected: this.redisCache.isReady
        } : null,
        lru: this.lruCache ? {
          size: this.lruCache.size,
          maxSize: this.lruCacheSize
        } : null
      },
      config: {
        strategy: this.cacheStrategy,
        memoryCacheTtl: this.memoryCacheTtl,
        redisCacheTtl: this.redisCacheTtl
      }
    };
  }

  /**
   * Health check
   */
  async checkHealth() {
    try {
      const health = {
        healthy: true,
        services: {},
        lastCheck: new Date().toISOString()
      };
      
      // Check memory cache
      if (this.memoryCache) {
        health.services.memoryCache = {
          healthy: true,
          keys: this.memoryCache.keys().length
        };
      }
      
      // Check Redis cache
      if (this.redisCache) {
        try {
          await this.redisCache.ping();
          health.services.redisCache = {
            healthy: true,
            connected: this.redisCache.isReady
          };
        } catch (error) {
          health.services.redisCache = {
            healthy: false,
            error: error.message
          };
          health.healthy = false;
        }
      }
      
      // Check LRU cache
      if (this.lruCache) {
        health.services.lruCache = {
          healthy: true,
          size: this.lruCache.size
        };
      }
      
      return health;
      
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        healthy: false,
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      logger.info(`Cleaning up CacheCompressionService ${this.id}...`);
      
      if (this.memoryCache) {
        this.memoryCache.close();
      }
      
      if (this.redisCache) {
        await this.redisCache.quit();
      }
      
      if (this.lruCache) {
        this.lruCache.clear();
      }
      
      this.emit('cleanup', { serviceId: this.id });
      
      logger.info(`CacheCompressionService ${this.id} cleanup completed`);
      
    } catch (error) {
      logger.error(`Error during CacheCompressionService cleanup:`, error);
      throw error;
    }
  }
}

module.exports = CacheCompressionService;