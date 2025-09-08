/**
 * =============================================================================
 * NEXUS IDE - Advanced Cache Management System
 * =============================================================================
 * 
 * Comprehensive caching utilities for AI Central Server
 * 
 * Features:
 * - Multi-layer caching (Memory, Redis, File)
 * - Intelligent cache strategies
 * - Cache warming and preloading
 * - Performance optimization
 * - Cache analytics and monitoring
 * - Distributed cache synchronization
 * - TTL and expiration management
 * - Cache compression
 * 
 * Author: NEXUS IDE Team
 * Version: 1.0.0
 * License: MIT
 * 
 * =============================================================================
 */

'use strict';

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const config = require('../config/config');
const logger = require('./logger');
const { db } = require('./database');

// Promisify compression functions
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);

// =============================================================================
// Cache Manager Class
// =============================================================================

class CacheManager extends EventEmitter {
  constructor() {
    super();
    this.layers = new Map();
    this.strategies = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      errors: 0,
      totalSize: 0,
      avgResponseTime: 0
    };
    
    this.isInitialized = false;
    this.initPromise = null;
    
    // Cache warming queue
    this.warmingQueue = [];
    this.isWarming = false;
    
    // Performance tracking
    this.performanceHistory = [];
    this.maxHistorySize = 1000;
  }
  
  /**
   * Initialize cache manager
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
      logger.info('Initializing cache manager...');
      
      // Initialize cache layers
      await this.initializeLayers();
      
      // Initialize cache strategies
      this.initializeStrategies();
      
      // Start monitoring
      this.startMonitoring();
      
      // Start cache warming
      this.startCacheWarming();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      logger.info('Cache manager initialized successfully', {
        layers: Array.from(this.layers.keys()),
        strategies: Array.from(this.strategies.keys())
      });
      
    } catch (error) {
      logger.error('Failed to initialize cache manager', { error: error.message });
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Initialize cache layers
   */
  async initializeLayers() {
    const cacheConfig = config.cache;
    
    // Memory cache layer
    if (cacheConfig.memory.enabled) {
      const memoryCache = new MemoryCache(cacheConfig.memory);
      await memoryCache.initialize();
      this.layers.set('memory', memoryCache);
      logger.info('Memory cache layer initialized');
    }
    
    // Redis cache layer
    if (cacheConfig.redis.enabled) {
      const redisCache = new RedisCache(cacheConfig.redis);
      await redisCache.initialize();
      this.layers.set('redis', redisCache);
      logger.info('Redis cache layer initialized');
    }
    
    // File cache layer
    if (cacheConfig.file.enabled) {
      const fileCache = new FileCache(cacheConfig.file);
      await fileCache.initialize();
      this.layers.set('file', fileCache);
      logger.info('File cache layer initialized');
    }
  }
  
  /**
   * Initialize cache strategies
   */
  initializeStrategies() {
    // LRU Strategy
    this.strategies.set('lru', new LRUStrategy());
    
    // LFU Strategy
    this.strategies.set('lfu', new LFUStrategy());
    
    // TTL Strategy
    this.strategies.set('ttl', new TTLStrategy());
    
    // Write-through Strategy
    this.strategies.set('write-through', new WriteThroughStrategy());
    
    // Write-behind Strategy
    this.strategies.set('write-behind', new WriteBehindStrategy());
    
    logger.info('Cache strategies initialized');
  }
  
  /**
   * Get value from cache
   */
  async get(key, options = {}) {
    const timer = logger.timer('cache_get', { key: this.hashKey(key) });
    
    try {
      const strategy = options.strategy || 'lru';
      const layers = options.layers || ['memory', 'redis', 'file'];
      const compress = options.compress !== false;
      
      let value = null;
      let foundLayer = null;
      
      // Try each layer in order
      for (const layerName of layers) {
        const layer = this.layers.get(layerName);
        if (!layer) continue;
        
        try {
          value = await layer.get(key, { compress });
          if (value !== null && value !== undefined) {
            foundLayer = layerName;
            break;
          }
        } catch (error) {
          logger.warn(`Cache layer ${layerName} get failed`, {
            key: this.hashKey(key),
            error: error.message
          });
        }
      }
      
      if (value !== null && value !== undefined) {
        this.metrics.hits++;
        
        // Promote to higher layers if found in lower layer
        if (foundLayer && layers.indexOf(foundLayer) > 0) {
          await this.promoteToHigherLayers(key, value, layers, foundLayer, { compress });
        }
        
        // Apply strategy
        const strategyInstance = this.strategies.get(strategy);
        if (strategyInstance) {
          await strategyInstance.onHit(key, value, foundLayer);
        }
        
        const performance = timer.end({ success: true, hit: true, layer: foundLayer });
        this.trackPerformance('get', performance, true);
        
        return value;
      } else {
        this.metrics.misses++;
        
        const performance = timer.end({ success: true, hit: false });
        this.trackPerformance('get', performance, false);
        
        return null;
      }
      
    } catch (error) {
      this.metrics.errors++;
      timer.end({ success: false, error: error.message });
      
      logger.error('Cache get failed', {
        key: this.hashKey(key),
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Set value in cache
   */
  async set(key, value, options = {}) {
    const timer = logger.timer('cache_set', { key: this.hashKey(key) });
    
    try {
      const strategy = options.strategy || 'write-through';
      const layers = options.layers || ['memory', 'redis', 'file'];
      const ttl = options.ttl || config.cache.defaultTTL;
      const compress = options.compress !== false;
      
      this.metrics.sets++;
      
      // Apply strategy
      const strategyInstance = this.strategies.get(strategy);
      if (strategyInstance) {
        await strategyInstance.onSet(key, value, options);
      }
      
      // Set in all specified layers
      const promises = layers.map(async (layerName) => {
        const layer = this.layers.get(layerName);
        if (!layer) return;
        
        try {
          await layer.set(key, value, { ttl, compress });
        } catch (error) {
          logger.warn(`Cache layer ${layerName} set failed`, {
            key: this.hashKey(key),
            error: error.message
          });
        }
      });
      
      await Promise.allSettled(promises);
      
      const performance = timer.end({ success: true });
      this.trackPerformance('set', performance, true);
      
      this.emit('set', { key, value, options });
      
    } catch (error) {
      this.metrics.errors++;
      timer.end({ success: false, error: error.message });
      
      logger.error('Cache set failed', {
        key: this.hashKey(key),
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Delete value from cache
   */
  async delete(key, options = {}) {
    const timer = logger.timer('cache_delete', { key: this.hashKey(key) });
    
    try {
      const layers = options.layers || ['memory', 'redis', 'file'];
      
      this.metrics.deletes++;
      
      // Delete from all layers
      const promises = layers.map(async (layerName) => {
        const layer = this.layers.get(layerName);
        if (!layer) return;
        
        try {
          await layer.delete(key);
        } catch (error) {
          logger.warn(`Cache layer ${layerName} delete failed`, {
            key: this.hashKey(key),
            error: error.message
          });
        }
      });
      
      await Promise.allSettled(promises);
      
      const performance = timer.end({ success: true });
      this.trackPerformance('delete', performance, true);
      
      this.emit('delete', { key, options });
      
    } catch (error) {
      this.metrics.errors++;
      timer.end({ success: false, error: error.message });
      
      logger.error('Cache delete failed', {
        key: this.hashKey(key),
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Clear cache
   */
  async clear(options = {}) {
    const timer = logger.timer('cache_clear');
    
    try {
      const layers = options.layers || ['memory', 'redis', 'file'];
      
      // Clear all layers
      const promises = layers.map(async (layerName) => {
        const layer = this.layers.get(layerName);
        if (!layer) return;
        
        try {
          await layer.clear();
        } catch (error) {
          logger.warn(`Cache layer ${layerName} clear failed`, {
            error: error.message
          });
        }
      });
      
      await Promise.allSettled(promises);
      
      // Reset metrics
      this.metrics = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
        errors: 0,
        totalSize: 0,
        avgResponseTime: 0
      };
      
      const performance = timer.end({ success: true });
      this.trackPerformance('clear', performance, true);
      
      this.emit('clear', { options });
      
      logger.info('Cache cleared successfully');
      
    } catch (error) {
      this.metrics.errors++;
      timer.end({ success: false, error: error.message });
      
      logger.error('Cache clear failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get cache statistics
   */
  async getStats(options = {}) {
    const layers = options.layers || ['memory', 'redis', 'file'];
    const stats = {
      global: { ...this.metrics },
      layers: {},
      performance: this.getPerformanceStats()
    };
    
    // Calculate hit rate
    const totalRequests = stats.global.hits + stats.global.misses;
    stats.global.hitRate = totalRequests > 0 ? (stats.global.hits / totalRequests) * 100 : 0;
    
    // Get layer-specific stats
    for (const layerName of layers) {
      const layer = this.layers.get(layerName);
      if (!layer) continue;
      
      try {
        stats.layers[layerName] = await layer.getStats();
      } catch (error) {
        logger.warn(`Failed to get stats for layer ${layerName}`, {
          error: error.message
        });
        stats.layers[layerName] = { error: error.message };
      }
    }
    
    return stats;
  }
  
  /**
   * Promote value to higher cache layers
   */
  async promoteToHigherLayers(key, value, layers, foundLayer, options) {
    const foundIndex = layers.indexOf(foundLayer);
    const higherLayers = layers.slice(0, foundIndex);
    
    const promises = higherLayers.map(async (layerName) => {
      const layer = this.layers.get(layerName);
      if (!layer) return;
      
      try {
        await layer.set(key, value, options);
      } catch (error) {
        logger.warn(`Failed to promote to layer ${layerName}`, {
          key: this.hashKey(key),
          error: error.message
        });
      }
    });
    
    await Promise.allSettled(promises);
  }
  
  /**
   * Start cache warming
   */
  startCacheWarming() {
    if (!config.cache.warming.enabled) {
      return;
    }
    
    const interval = config.cache.warming.interval;
    
    this.warmingInterval = setInterval(async () => {
      await this.performCacheWarming();
    }, interval);
    
    logger.info('Cache warming started', { interval });
  }
  
  /**
   * Perform cache warming
   */
  async performCacheWarming() {
    if (this.isWarming || this.warmingQueue.length === 0) {
      return;
    }
    
    this.isWarming = true;
    
    try {
      const batchSize = config.cache.warming.batchSize;
      const batch = this.warmingQueue.splice(0, batchSize);
      
      logger.debug('Starting cache warming batch', {
        batchSize: batch.length,
        remaining: this.warmingQueue.length
      });
      
      const promises = batch.map(async (item) => {
        try {
          const { key, loader, options } = item;
          const value = await loader();
          await this.set(key, value, options);
        } catch (error) {
          logger.warn('Cache warming item failed', {
            key: item.key,
            error: error.message
          });
        }
      });
      
      await Promise.allSettled(promises);
      
      logger.debug('Cache warming batch completed', {
        processed: batch.length,
        remaining: this.warmingQueue.length
      });
      
    } catch (error) {
      logger.error('Cache warming failed', { error: error.message });
    } finally {
      this.isWarming = false;
    }
  }
  
  /**
   * Add item to warming queue
   */
  addToWarmingQueue(key, loader, options = {}) {
    this.warmingQueue.push({ key, loader, options });
    
    logger.debug('Added item to warming queue', {
      key: this.hashKey(key),
      queueSize: this.warmingQueue.length
    });
  }
  
  /**
   * Start monitoring
   */
  startMonitoring() {
    const interval = config.monitoring.cache.interval;
    
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
    }, interval);
    
    logger.info('Cache monitoring started', { interval });
  }
  
  /**
   * Collect metrics
   */
  async collectMetrics() {
    try {
      const stats = await this.getStats();
      
      logger.debug('Cache metrics collected', stats.global);
      this.emit('metrics', stats);
      
      // Check for performance issues
      if (stats.global.hitRate < config.monitoring.cache.minHitRate) {
        logger.warn('Low cache hit rate detected', {
          hitRate: stats.global.hitRate,
          threshold: config.monitoring.cache.minHitRate
        });
        
        this.emit('lowHitRate', stats.global);
      }
      
      if (stats.global.avgResponseTime > config.monitoring.cache.maxResponseTime) {
        logger.warn('High cache response time detected', {
          avgResponseTime: stats.global.avgResponseTime,
          threshold: config.monitoring.cache.maxResponseTime
        });
        
        this.emit('highResponseTime', stats.global);
      }
      
    } catch (error) {
      logger.error('Failed to collect cache metrics', {
        error: error.message
      });
    }
  }
  
  /**
   * Track performance
   */
  trackPerformance(operation, performance, success) {
    this.performanceHistory.push({
      operation,
      duration: performance.durationMs,
      success,
      timestamp: Date.now()
    });
    
    // Keep history size manageable
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift();
    }
    
    // Update average response time
    const totalDuration = this.performanceHistory.reduce((sum, p) => sum + p.duration, 0);
    this.metrics.avgResponseTime = totalDuration / this.performanceHistory.length;
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    if (this.performanceHistory.length === 0) {
      return {
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        successRate: 0,
        totalOperations: 0
      };
    }
    
    const durations = this.performanceHistory.map(p => p.duration);
    const successes = this.performanceHistory.filter(p => p.success).length;
    
    return {
      avgResponseTime: this.metrics.avgResponseTime,
      minResponseTime: Math.min(...durations),
      maxResponseTime: Math.max(...durations),
      successRate: (successes / this.performanceHistory.length) * 100,
      totalOperations: this.performanceHistory.length
    };
  }
  
  /**
   * Hash key for logging
   */
  hashKey(key) {
    return crypto.createHash('md5').update(key).digest('hex').substring(0, 8);
  }
  
  /**
   * Close cache manager
   */
  async close() {
    logger.info('Closing cache manager...');
    
    // Clear intervals
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
    }
    
    // Close all layers
    for (const [layerName, layer] of this.layers) {
      try {
        await layer.close();
        logger.info(`Cache layer ${layerName} closed`);
      } catch (error) {
        logger.error(`Failed to close cache layer ${layerName}`, {
          error: error.message
        });
      }
    }
    
    this.layers.clear();
    this.strategies.clear();
    this.isInitialized = false;
    
    logger.info('Cache manager closed');
  }
}

// =============================================================================
// Memory Cache Layer
// =============================================================================

class MemoryCache {
  constructor(config) {
    this.config = config;
    this.cache = new Map();
    this.metadata = new Map();
    this.maxSize = config.maxSize;
    this.maxItems = config.maxItems;
    this.currentSize = 0;
  }
  
  async initialize() {
    logger.info('Memory cache initialized', {
      maxSize: this.maxSize,
      maxItems: this.maxItems
    });
  }
  
  async get(key, options = {}) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const metadata = this.metadata.get(key);
    
    // Check TTL
    if (metadata && metadata.expiresAt && Date.now() > metadata.expiresAt) {
      await this.delete(key);
      return null;
    }
    
    // Update access time
    if (metadata) {
      metadata.lastAccessed = Date.now();
      metadata.accessCount++;
    }
    
    return options.compress ? await this.decompress(item) : item;
  }
  
  async set(key, value, options = {}) {
    const compressedValue = options.compress ? await this.compress(value) : value;
    const size = this.calculateSize(compressedValue);
    
    // Check if we need to evict
    await this.evictIfNeeded(size);
    
    this.cache.set(key, compressedValue);
    this.metadata.set(key, {
      size,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      expiresAt: options.ttl ? Date.now() + options.ttl : null
    });
    
    this.currentSize += size;
  }
  
  async delete(key) {
    const metadata = this.metadata.get(key);
    if (metadata) {
      this.currentSize -= metadata.size;
    }
    
    this.cache.delete(key);
    this.metadata.delete(key);
  }
  
  async clear() {
    this.cache.clear();
    this.metadata.clear();
    this.currentSize = 0;
  }
  
  async getStats() {
    return {
      type: 'memory',
      items: this.cache.size,
      size: this.currentSize,
      maxSize: this.maxSize,
      maxItems: this.maxItems,
      utilization: (this.currentSize / this.maxSize) * 100
    };
  }
  
  async evictIfNeeded(newItemSize) {
    // Check size limit
    while (this.currentSize + newItemSize > this.maxSize && this.cache.size > 0) {
      await this.evictLRU();
    }
    
    // Check item limit
    while (this.cache.size >= this.maxItems && this.cache.size > 0) {
      await this.evictLRU();
    }
  }
  
  async evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, metadata] of this.metadata) {
      if (metadata.lastAccessed < oldestTime) {
        oldestTime = metadata.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      await this.delete(oldestKey);
    }
  }
  
  calculateSize(value) {
    if (typeof value === 'string') {
      return Buffer.byteLength(value, 'utf8');
    } else if (Buffer.isBuffer(value)) {
      return value.length;
    } else {
      return Buffer.byteLength(JSON.stringify(value), 'utf8');
    }
  }
  
  async compress(value) {
    if (!this.config.compression) return value;
    
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    return await gzip(data);
  }
  
  async decompress(value) {
    if (!this.config.compression || !Buffer.isBuffer(value)) return value;
    
    try {
      const decompressed = await gunzip(value);
      return decompressed.toString();
    } catch (error) {
      // If decompression fails, assume it's not compressed
      return value;
    }
  }
  
  async close() {
    await this.clear();
  }
}

// =============================================================================
// Redis Cache Layer
// =============================================================================

class RedisCache {
  constructor(config) {
    this.config = config;
    this.redis = null;
  }
  
  async initialize() {
    this.redis = db.getConnection('redis');
    logger.info('Redis cache initialized');
  }
  
  async get(key, options = {}) {
    const value = await this.redis.get(key);
    if (!value) return null;
    
    try {
      const parsed = JSON.parse(value);
      return options.compress ? await this.decompress(parsed.data) : parsed.data;
    } catch (error) {
      return value;
    }
  }
  
  async set(key, value, options = {}) {
    const data = options.compress ? await this.compress(value) : value;
    const serialized = JSON.stringify({ data, compressed: options.compress });
    
    if (options.ttl) {
      await this.redis.setex(key, Math.floor(options.ttl / 1000), serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }
  
  async delete(key) {
    await this.redis.del(key);
  }
  
  async clear() {
    await this.redis.flushdb();
  }
  
  async getStats() {
    const info = await this.redis.info('memory');
    const keyspace = await this.redis.info('keyspace');
    
    return {
      type: 'redis',
      memory: this.parseRedisInfo(info),
      keyspace: this.parseRedisInfo(keyspace)
    };
  }
  
  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const result = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = isNaN(value) ? value : Number(value);
      }
    }
    
    return result;
  }
  
  async compress(value) {
    if (!this.config.compression) return value;
    
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    const compressed = await gzip(data);
    return compressed.toString('base64');
  }
  
  async decompress(value) {
    if (!this.config.compression || typeof value !== 'string') return value;
    
    try {
      const buffer = Buffer.from(value, 'base64');
      const decompressed = await gunzip(buffer);
      return decompressed.toString();
    } catch (error) {
      return value;
    }
  }
  
  async close() {
    // Redis connection is managed by database manager
  }
}

// =============================================================================
// File Cache Layer
// =============================================================================

class FileCache {
  constructor(config) {
    this.config = config;
    this.cacheDir = config.directory;
  }
  
  async initialize() {
    await fs.mkdir(this.cacheDir, { recursive: true });
    logger.info('File cache initialized', { directory: this.cacheDir });
  }
  
  async get(key, options = {}) {
    const filePath = this.getFilePath(key);
    
    try {
      const stats = await fs.stat(filePath);
      
      // Check TTL
      if (this.config.ttl && Date.now() - stats.mtime.getTime() > this.config.ttl) {
        await this.delete(key);
        return null;
      }
      
      const data = await fs.readFile(filePath);
      const parsed = JSON.parse(data.toString());
      
      return options.compress ? await this.decompress(parsed.data) : parsed.data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }
  
  async set(key, value, options = {}) {
    const filePath = this.getFilePath(key);
    const dir = path.dirname(filePath);
    
    await fs.mkdir(dir, { recursive: true });
    
    const data = options.compress ? await this.compress(value) : value;
    const serialized = JSON.stringify({ data, compressed: options.compress });
    
    await fs.writeFile(filePath, serialized);
  }
  
  async delete(key) {
    const filePath = this.getFilePath(key);
    
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
  
  async clear() {
    try {
      await fs.rmdir(this.cacheDir, { recursive: true });
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      logger.warn('Failed to clear file cache', { error: error.message });
    }
  }
  
  async getStats() {
    try {
      const files = await this.getAllFiles(this.cacheDir);
      let totalSize = 0;
      
      for (const file of files) {
        const stats = await fs.stat(file);
        totalSize += stats.size;
      }
      
      return {
        type: 'file',
        items: files.length,
        size: totalSize,
        directory: this.cacheDir
      };
    } catch (error) {
      return {
        type: 'file',
        error: error.message
      };
    }
  }
  
  getFilePath(key) {
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    const subdir = hash.substring(0, 2);
    return path.join(this.cacheDir, subdir, `${hash}.json`);
  }
  
  async getAllFiles(dir) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or is empty
    }
    
    return files;
  }
  
  async compress(value) {
    if (!this.config.compression) return value;
    
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    const compressed = await gzip(data);
    return compressed.toString('base64');
  }
  
  async decompress(value) {
    if (!this.config.compression || typeof value !== 'string') return value;
    
    try {
      const buffer = Buffer.from(value, 'base64');
      const decompressed = await gunzip(buffer);
      return decompressed.toString();
    } catch (error) {
      return value;
    }
  }
  
  async close() {
    // File cache doesn't need explicit closing
  }
}

// =============================================================================
// Cache Strategies
// =============================================================================

class LRUStrategy {
  async onHit(key, value, layer) {
    // LRU is handled by individual cache layers
  }
  
  async onSet(key, value, options) {
    // LRU eviction is handled by individual cache layers
  }
}

class LFUStrategy {
  constructor() {
    this.frequencies = new Map();
  }
  
  async onHit(key, value, layer) {
    const current = this.frequencies.get(key) || 0;
    this.frequencies.set(key, current + 1);
  }
  
  async onSet(key, value, options) {
    this.frequencies.set(key, 0);
  }
}

class TTLStrategy {
  async onHit(key, value, layer) {
    // TTL is handled by individual cache layers
  }
  
  async onSet(key, value, options) {
    // TTL is handled by individual cache layers
  }
}

class WriteThroughStrategy {
  async onSet(key, value, options) {
    // Write to all layers synchronously
  }
}

class WriteBehindStrategy {
  constructor() {
    this.writeQueue = [];
    this.isProcessing = false;
  }
  
  async onSet(key, value, options) {
    // Add to write queue for asynchronous processing
    this.writeQueue.push({ key, value, options });
    
    if (!this.isProcessing) {
      setImmediate(() => this.processWriteQueue());
    }
  }
  
  async processWriteQueue() {
    if (this.isProcessing || this.writeQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      const batch = this.writeQueue.splice(0, 100); // Process in batches
      
      // Process batch asynchronously
      await Promise.allSettled(batch.map(async (item) => {
        // Write to persistent layers
      }));
    } finally {
      this.isProcessing = false;
      
      // Process remaining items
      if (this.writeQueue.length > 0) {
        setImmediate(() => this.processWriteQueue());
      }
    }
  }
}

// =============================================================================
// Export
// =============================================================================

// Create singleton instance
const cacheManager = new CacheManager();

module.exports = {
  // Cache manager instance
  cache: cacheManager,
  
  // Utility functions
  initialize: () => cacheManager.initialize(),
  get: (key, options) => cacheManager.get(key, options),
  set: (key, value, options) => cacheManager.set(key, value, options),
  delete: (key, options) => cacheManager.delete(key, options),
  clear: (options) => cacheManager.clear(options),
  getStats: (options) => cacheManager.getStats(options),
  addToWarmingQueue: (key, loader, options) => cacheManager.addToWarmingQueue(key, loader, options),
  close: () => cacheManager.close()
};

// =============================================================================
// End of File
// =============================================================================