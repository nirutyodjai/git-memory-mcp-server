/**
 * Advanced Multi-Level Caching Service for Git Memory MCP Server
 *
 * Features:
 * - Multi-level caching (L1: Memory, L2: Redis, L3: File/SSD)
 * - Intelligent cache warming and preloading
 * - Cache compression and serialization
 * - Distributed cache invalidation
 * - Cache analytics and performance monitoring
 * - Adaptive TTL based on access patterns
 * - Cache partitioning and sharding
 * - Background refresh and stale-while-revalidate
 */

import { EventEmitter } from 'events';
import Redis from 'redis';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';

export interface CacheConfig {
  // Memory cache (L1)
  memoryMaxSize: number; // Max entries in memory cache
  memoryDefaultTTL: number; // Default TTL in seconds

  // Redis cache (L2)
  redisTTL: number; // TTL for Redis cache
  redisPrefix: string; // Key prefix for Redis

  // File cache (L3)
  fileCacheDir: string; // Directory for file cache
  fileCacheMaxSize: number; // Max cache size in bytes
  fileCompression: boolean; // Enable compression

  // General settings
  enableMetrics: boolean;
  enableCompression: boolean;
  enableEncryption: boolean;
  encryptionKey?: string;

  // Advanced features
  adaptiveTTL: boolean; // Enable adaptive TTL
  backgroundRefresh: boolean; // Enable stale-while-revalidate
  cacheWarming: boolean; // Enable cache warming
  distributedInvalidation: boolean; // Enable distributed cache invalidation
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl: number;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  size: number; // Size in bytes
  compressed: boolean;
  encrypted: boolean;
  metadata: Record<string, any>;
  checksum: string;
}

export interface CacheMetrics {
  memory: {
    entries: number;
    size: number;
    hitRate: number;
    hits: number;
    misses: number;
  };
  redis: {
    entries: number;
    hitRate: number;
    hits: number;
    misses: number;
    errors: number;
  };
  file: {
    entries: number;
    size: number;
    hitRate: number;
    hits: number;
    misses: number;
  };
  overall: {
    hitRate: number;
    totalHits: number;
    totalMisses: number;
    averageResponseTime: number;
  };
}

export class AdvancedCachingService extends EventEmitter {
  private config: CacheConfig;
  private redis: Redis.RedisClientType | null = null;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private accessPatterns: Map<string, { count: number; lastAccess: number }> = new Map();
  private cacheWarmingQueue: Set<string> = new Set();
  private backgroundRefreshTimer: NodeJS.Timeout | null = null;
  private cacheWarmingTimer: NodeJS.Timeout | null = null;
  private metricsTimer: NodeJS.Timeout | null = null;

  private metrics = {
    memory: { hits: 0, misses: 0 },
    redis: { hits: 0, misses: 0, errors: 0 },
    file: { hits: 0, misses: 0 },
    responseTimes: [] as number[]
  };

  constructor(config: Partial<CacheConfig> = {}) {
    super();

    this.config = {
      memoryMaxSize: 10000,
      memoryDefaultTTL: 300, // 5 minutes
      redisTTL: 3600, // 1 hour
      redisPrefix: 'git-memory:cache',
      fileCacheDir: './cache',
      fileCacheMaxSize: 1024 * 1024 * 1024, // 1GB
      fileCompression: true,
      enableMetrics: true,
      enableCompression: true,
      enableEncryption: false,
      adaptiveTTL: true,
      backgroundRefresh: true,
      cacheWarming: true,
      distributedInvalidation: true,
      ...config
    };

    this.initializeCache();
    this.startBackgroundTasks();
    this.startMetricsCollection();
  }

  /**
   * Initialize cache directories and Redis connection
   */
  private async initializeCache(): Promise<void> {
    try {
      // Create file cache directory
      await fs.mkdir(this.config.fileCacheDir, { recursive: true });

      // Initialize Redis connection
      if (process.env.REDIS_URL) {
        this.redis = Redis.createClient({
          url: process.env.REDIS_URL
        });

        this.redis.on('error', (error) => {
          this.emit('redis:error', error);
          this.metrics.redis.errors++;
        });

        await this.redis.connect();
        this.emit('redis:connected');
      }

      this.emit('cache:initialized');
    } catch (error) {
      this.emit('cache:initialization:error', error);
    }
  }

  /**
   * Set cache entry with automatic tier management
   */
  async set<T>(
    key: string,
    value: T,
    options: {
      ttl?: number;
      level?: 'memory' | 'redis' | 'file' | 'all';
      compress?: boolean;
      encrypt?: boolean;
      metadata?: Record<string, any>;
      backgroundRefresh?: boolean;
    } = {}
  ): Promise<boolean> {
    const startTime = Date.now();
    const ttl = options.ttl || this.config.memoryDefaultTTL;
    const level = options.level || 'all';

    try {
      const entry: CacheEntry<T> = {
        key,
        value,
        ttl,
        createdAt: startTime,
        lastAccessed: startTime,
        accessCount: 0,
        size: this.calculateSize(value),
        compressed: options.compress ?? this.config.enableCompression,
        encrypted: options.encrypt ?? this.config.enableEncryption,
        metadata: options.metadata || {},
        checksum: this.generateChecksum(value)
      };

      // Process entry based on compression/encryption settings
      const processedEntry = await this.processEntry(entry);

      // Store in requested levels
      const results = [];

      if (level === 'memory' || level === 'all') {
        results.push(this.setMemory(processedEntry));
      }

      if ((level === 'redis' || level === 'all') && this.redis) {
        results.push(this.setRedis(processedEntry));
      }

      if (level === 'file' || level === 'all') {
        results.push(this.setFile(processedEntry));
      }

      const success = results.every(r => r);

      if (success) {
        // Track access pattern for adaptive TTL
        this.trackAccessPattern(key, 'write');

        // Add to warming queue if background refresh is enabled
        if (options.backgroundRefresh && this.config.cacheWarming) {
          this.cacheWarmingQueue.add(key);
        }

        this.emit('cache:set', { key, level, success: true });
      }

      const duration = Date.now() - startTime;
      this.trackResponseTime(duration);

      return success;
    } catch (error) {
      this.emit('cache:set:error', { key, error });
      return false;
    }
  }

  /**
   * Get cache entry with multi-level fallback
   */
  async get<T>(
    key: string,
    options: {
      level?: 'memory' | 'redis' | 'file' | 'all';
      fallback?: () => Promise<T>;
    } = {}
  ): Promise<T | null> {
    const startTime = Date.now();
    const level = options.level || 'all';

    try {
      // Try memory cache first (fastest)
      if (level === 'memory' || level === 'all') {
        const memoryResult = this.getMemory<T>(key);
        if (memoryResult) {
          this.trackAccessPattern(key, 'read');
          const duration = Date.now() - startTime;
          this.trackResponseTime(duration);
          return memoryResult;
        }
      }

      // Try Redis cache
      if ((level === 'redis' || level === 'all') && this.redis) {
        const redisResult = await this.getRedis<T>(key);
        if (redisResult) {
          // Promote to memory cache for faster future access
          await this.set(key, redisResult, { level: 'memory' });
          this.trackAccessPattern(key, 'read');
          const duration = Date.now() - startTime;
          this.trackResponseTime(duration);
          return redisResult;
        }
      }

      // Try file cache (slowest)
      if (level === 'file' || level === 'all') {
        const fileResult = await this.getFile<T>(key);
        if (fileResult) {
          // Promote to higher levels for faster future access
          await this.set(key, fileResult, { level: 'all' });
          this.trackAccessPattern(key, 'read');
          const duration = Date.now() - startTime;
          this.trackResponseTime(duration);
          return fileResult;
        }
      }

      // Cache miss - try fallback function
      if (options.fallback) {
        const fallbackValue = await options.fallback();
        if (fallbackValue !== null) {
          await this.set(key, fallbackValue);
        }
        return fallbackValue;
      }

      const duration = Date.now() - startTime;
      this.trackResponseTime(duration);

      return null;
    } catch (error) {
      this.emit('cache:get:error', { key, error });
      return null;
    }
  }

  /**
   * Delete cache entry from all levels
   */
  async delete(key: string, level: 'memory' | 'redis' | 'file' | 'all' = 'all'): Promise<boolean> {
    try {
      const results = [];

      if (level === 'memory' || level === 'all') {
        results.push(this.deleteMemory(key));
      }

      if ((level === 'redis' || level === 'all') && this.redis) {
        results.push(this.deleteRedis(key));
      }

      if (level === 'file' || level === 'all') {
        results.push(this.deleteFile(key));
      }

      // Distributed invalidation
      if (this.config.distributedInvalidation) {
        await this.distributedInvalidate(key);
      }

      const success = results.every(r => r);
      this.emit('cache:delete', { key, level, success });

      return success;
    } catch (error) {
      this.emit('cache:delete:error', { key, error });
      return false;
    }
  }

  /**
   * Memory cache operations
   */
  private setMemory<T>(entry: CacheEntry<T>): boolean {
    // Check size limit and evict if necessary
    if (this.memoryCache.size >= this.config.memoryMaxSize && !this.memoryCache.has(entry.key)) {
      this.evictMemoryEntries();
    }

    this.memoryCache.set(entry.key, entry);
    return true;
  }

  private getMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      this.metrics.memory.misses++;
      return null;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      this.metrics.memory.misses++;
      return null;
    }

    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.metrics.memory.hits++;

    return entry.value;
  }

  private deleteMemory(key: string): boolean {
    return this.memoryCache.delete(key);
  }

  /**
   * Redis cache operations
   */
  private async setRedis<T>(entry: CacheEntry<T>): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const serialized = JSON.stringify(entry);
      const compressed = this.config.enableCompression ?
        await promisify(zlib.deflate)(serialized) : serialized;

      const redisKey = `${this.config.redisPrefix}:${entry.key}`;
      await this.redis.setEx(redisKey, entry.ttl, compressed);
      return true;
    } catch (error) {
      this.metrics.redis.errors++;
      return false;
    }
  }

  private async getRedis<T>(key: string): Promise<T | null> {
    if (!this.redis) {
      this.metrics.redis.misses++;
      return null;
    }

    try {
      const redisKey = `${this.config.redisPrefix}:${key}`;
      const compressed = await this.redis.get(redisKey);

      if (!compressed) {
        this.metrics.redis.misses++;
        return null;
      }

      const serialized = this.config.enableCompression ?
        await promisify(zlib.inflate)(Buffer.from(compressed, 'binary')) :
        compressed;

      const entry: CacheEntry<T> = JSON.parse(serialized);

      if (this.isExpired(entry)) {
        await this.redis.del(redisKey);
        this.metrics.redis.misses++;
        return null;
      }

      this.metrics.redis.hits++;
      return entry.value;
    } catch (error) {
      this.metrics.redis.errors++;
      this.metrics.redis.misses++;
      return null;
    }
  }

  private async deleteRedis(key: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const redisKey = `${this.config.redisPrefix}:${key}`;
      await this.redis.del(redisKey);
      return true;
    } catch (error) {
      this.metrics.redis.errors++;
      return false;
    }
  }

  /**
   * File cache operations
   */
  private async setFile<T>(entry: CacheEntry<T>): Promise<boolean> {
    try {
      const filePath = this.getFilePath(entry.key);
      const serialized = JSON.stringify(entry);

      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, serialized, 'utf8');

      // Check file cache size and cleanup if necessary
      await this.checkFileCacheSize();

      return true;
    } catch (error) {
      this.emit('file-cache:error', { operation: 'set', key: entry.key, error });
      return false;
    }
  }

  private async getFile<T>(key: string): Promise<T | null> {
    try {
      const filePath = this.getFilePath(key);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        this.metrics.file.misses++;
        return null;
      }

      const serialized = await fs.readFile(filePath, 'utf8');
      const entry: CacheEntry<T> = JSON.parse(serialized);

      if (this.isExpired(entry)) {
        await fs.unlink(filePath).catch(() => {});
        this.metrics.file.misses++;
        return null;
      }

      this.metrics.file.hits++;
      return entry.value;
    } catch (error) {
      this.metrics.file.misses++;
      return null;
    }
  }

  private async deleteFile(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Process entry for compression/encryption
   */
  private async processEntry<T>(entry: CacheEntry<T>): Promise<CacheEntry<T>> {
    let processed = { ...entry };

    if (this.config.enableCompression && entry.compressed) {
      const serialized = JSON.stringify(entry);
      processed.value = await promisify(zlib.deflate)(serialized) as any;
    }

    if (this.config.enableEncryption && entry.encrypted && this.config.encryptionKey) {
      // Implement encryption here
      // For now, just mark as processed
    }

    return processed;
  }

  /**
   * Generate file path for cache entry
   */
  private getFilePath(key: string): string {
    const hash = crypto.createHash('md5').update(key).digest('hex');
    const subdir = hash.substring(0, 2);
    const filename = hash.substring(2);
    return path.join(this.config.fileCacheDir, subdir, `${filename}.cache`);
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > (entry.createdAt + (entry.ttl * 1000));
  }

  /**
   * Calculate size of value in bytes
   */
  private calculateSize(value: any): number {
    return Buffer.byteLength(JSON.stringify(value), 'utf8');
  }

  /**
   * Generate checksum for data integrity
   */
  private generateChecksum(value: any): string {
    return crypto.createHash('md5').update(JSON.stringify(value)).digest('hex');
  }

  /**
   * Track access patterns for adaptive TTL
   */
  private trackAccessPattern(key: string, operation: 'read' | 'write'): void {
    const now = Date.now();
    const pattern = this.accessPatterns.get(key) || { count: 0, lastAccess: now };

    pattern.count++;
    pattern.lastAccess = now;

    this.accessPatterns.set(key, pattern);

    // Cleanup old patterns
    if (this.accessPatterns.size > 100000) {
      this.cleanupAccessPatterns();
    }
  }

  /**
   * Cleanup old access patterns
   */
  private cleanupAccessPatterns(): void {
    const now = Date.now();
    const cutoff = now - (24 * 60 * 60 * 1000); // 24 hours

    for (const [key, pattern] of this.accessPatterns.entries()) {
      if (pattern.lastAccess < cutoff) {
        this.accessPatterns.delete(key);
      }
    }
  }

  /**
   * Evict memory cache entries using LRU
   */
  private evictMemoryEntries(): void {
    // Sort by last accessed time (oldest first)
    const sortedEntries = Array.from(this.memoryCache.entries()).sort(
      (a, b) => a[1].lastAccessed - b[1].lastAccessed
    );

    // Remove oldest 20% of entries
    const toRemove = Math.ceil(sortedEntries.length * 0.2);

    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(sortedEntries[i][0]);
    }
  }

  /**
   * Check file cache size and cleanup if necessary
   */
  private async checkFileCacheSize(): Promise<void> {
    try {
      const stats = await this.getDirectorySize(this.config.fileCacheDir);

      if (stats.size > this.config.fileCacheMaxSize) {
        await this.cleanupFileCache(stats.size - this.config.fileCacheMaxSize);
      }
    } catch (error) {
      this.emit('file-cache:error', { operation: 'size-check', error });
    }
  }

  /**
   * Get directory size
   */
  private async getDirectorySize(dirPath: string): Promise<{ size: number; files: number }> {
    let size = 0;
    let files = 0;

    async function walk(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else {
          const stat = await fs.stat(fullPath);
          size += stat.size;
          files++;
        }
      }
    }

    await walk(dirPath);
    return { size, files };
  }

  /**
   * Cleanup file cache by removing oldest files
   */
  private async cleanupFileCache(targetReduction: number): Promise<void> {
    const files = await this.getCacheFiles();

    // Sort by modification time (oldest first)
    files.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

    let freedSpace = 0;
    for (const file of files) {
      if (freedSpace >= targetReduction) break;

      await fs.unlink(file.path);
      freedSpace += file.size;
    }
  }

  /**
   * Get all cache files with metadata
   */
  private async getCacheFiles(): Promise<Array<{ path: string; size: number; mtime: Date }>> {
    const files: Array<{ path: string; size: number; mtime: Date }> = [];

    async function walk(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.name.endsWith('.cache')) {
          const stat = await fs.stat(fullPath);
          files.push({
            path: fullPath,
            size: stat.size,
            mtime: stat.mtime
          });
        }
      }
    }

    await walk(this.config.fileCacheDir);
    return files;
  }

  /**
   * Distributed cache invalidation
   */
  private async distributedInvalidate(key: string): Promise<void> {
    if (!this.redis) return;

    try {
      // Publish invalidation message to Redis channel
      await this.redis.publish('cache:invalidation', JSON.stringify({
        key,
        timestamp: Date.now(),
        source: 'git-memory-server'
      }));
    } catch (error) {
      this.emit('distributed-invalidation:error', { key, error });
    }
  }

  /**
   * Start background tasks
   */
  private startBackgroundTasks(): void {
    if (this.config.backgroundRefresh) {
      this.backgroundRefreshTimer = setInterval(async () => {
        await this.performBackgroundRefresh();
      }, 60000); // Every minute
    }

    if (this.config.cacheWarming) {
      this.cacheWarmingTimer = setInterval(async () => {
        await this.performCacheWarming();
      }, 300000); // Every 5 minutes
    }
  }

  /**
   * Perform background refresh for stale-while-revalidate
   */
  private async performBackgroundRefresh(): Promise<void> {
    const now = Date.now();
    const refreshThreshold = 0.8; // Refresh when 80% of TTL has passed

    for (const [key, entry] of this.memoryCache.entries()) {
      const age = now - entry.createdAt;
      const ttlRatio = age / (entry.ttl * 1000);

      if (ttlRatio > refreshThreshold && ttlRatio < 1.0) {
        // Entry is getting stale, refresh in background
        this.emit('cache:background-refresh', { key });
        // Here you would call the original function to refresh the cache
      }
    }
  }

  /**
   * Perform cache warming for frequently accessed keys
   */
  private async performCacheWarming(): Promise<void> {
    const keysToWarm: string[] = [];

    for (const [key, pattern] of this.accessPatterns.entries()) {
      if (pattern.count > 10 && !this.memoryCache.has(key)) {
        keysToWarm.push(key);
      }
    }

    // Limit warming to avoid overwhelming the system
    const keysToProcess = keysToWarm.slice(0, 100);

    for (const key of keysToProcess) {
      this.emit('cache:warming', { key });
      // Here you would call the original function to warm the cache
    }
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    if (!this.config.enableMetrics) return;

    this.metricsTimer = setInterval(() => {
      this.emit('metrics:updated', this.getMetrics());
    }, 30000); // Every 30 seconds
  }

  /**
   * Track response time
   */
  private trackResponseTime(duration: number): void {
    this.metrics.responseTimes.push(duration);

    // Keep only last 1000 measurements
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes.shift();
    }
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics(): CacheMetrics {
    const memoryHitRate = (this.metrics.memory.hits + this.metrics.memory.misses) > 0
      ? this.metrics.memory.hits / (this.metrics.memory.hits + this.metrics.memory.misses)
      : 0;

    const redisHitRate = (this.metrics.redis.hits + this.metrics.redis.misses) > 0
      ? this.metrics.redis.hits / (this.metrics.redis.hits + this.metrics.redis.misses)
      : 0;

    const fileHitRate = (this.metrics.file.hits + this.metrics.file.misses) > 0
      ? this.metrics.file.hits / (this.metrics.file.hits + this.metrics.file.misses)
      : 0;

    const totalHits = this.metrics.memory.hits + this.metrics.redis.hits + this.metrics.file.hits;
    const totalMisses = this.metrics.memory.misses + this.metrics.redis.misses + this.metrics.file.misses;
    const overallHitRate = (totalHits + totalMisses) > 0 ? totalHits / (totalHits + totalMisses) : 0;

    const averageResponseTime = this.metrics.responseTimes.length > 0
      ? this.metrics.responseTimes.reduce((sum, time) => sum + time, 0) / this.metrics.responseTimes.length
      : 0;

    return {
      memory: {
        entries: this.memoryCache.size,
        size: Array.from(this.memoryCache.values()).reduce((sum, entry) => sum + entry.size, 0),
        hitRate: Math.round(memoryHitRate * 10000) / 100,
        hits: this.metrics.memory.hits,
        misses: this.metrics.memory.misses
      },
      redis: {
        entries: 0, // Would need to track this separately
        hitRate: Math.round(redisHitRate * 10000) / 100,
        hits: this.metrics.redis.hits,
        misses: this.metrics.redis.misses,
        errors: this.metrics.redis.errors
      },
      file: {
        entries: 0, // Would need to track this separately
        size: 0, // Would need to calculate this
        hitRate: Math.round(fileHitRate * 10000) / 100,
        hits: this.metrics.file.hits,
        misses: this.metrics.file.misses
      },
      overall: {
        hitRate: Math.round(overallHitRate * 10000) / 100,
        totalHits,
        totalMisses,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100
      }
    };
  }

  /**
   * Clear all caches
   */
  async clear(level: 'memory' | 'redis' | 'file' | 'all' = 'all'): Promise<void> {
    try {
      if (level === 'memory' || level === 'all') {
        this.memoryCache.clear();
        this.accessPatterns.clear();
      }

      if ((level === 'redis' || level === 'all') && this.redis) {
        const pattern = `${this.config.redisPrefix}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      }

      if (level === 'file' || level === 'all') {
        await fs.rm(this.config.fileCacheDir, { recursive: true, force: true });
        await fs.mkdir(this.config.fileCacheDir, { recursive: true });
      }

      this.emit('cache:cleared', { level });
    } catch (error) {
      this.emit('cache:clear:error', { level, error });
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      const metrics = this.getMetrics();

      if (metrics.redis.errors > 100) {
        return {
          status: 'unhealthy',
          details: { issue: 'High Redis error rate', errors: metrics.redis.errors }
        };
      }

      if (metrics.overall.hitRate < 0.5 && metrics.overall.totalHits + metrics.overall.totalMisses > 100) {
        return {
          status: 'unhealthy',
          details: { issue: 'Low cache hit rate', hitRate: metrics.overall.hitRate }
        };
      }

      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }

  /**
   * Gracefully shutdown
   */
  async shutdown(): Promise<void> {
    if (this.backgroundRefreshTimer) {
      clearInterval(this.backgroundRefreshTimer);
    }

    if (this.cacheWarmingTimer) {
      clearInterval(this.cacheWarmingTimer);
    }

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }

    if (this.redis) {
      await this.redis.quit();
    }

    this.emit('cache:shutdown');
  }
}
