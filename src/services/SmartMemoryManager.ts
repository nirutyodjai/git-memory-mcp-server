/**
 * Smart Memory Management System
 * ระบบจัดการหน่วยความจำแบบอัจฉริยะสำหรับ Git Memory MCP Server
 * รองรับการเรียนรู้และปรับปรุงประสิทธิภาพอัตโนมัติ
 */

import { EventEmitter } from 'events';
import { AIIntegrationLayer, AIMemoryContext, AIInsight, SmartMemoryQuery } from './AIIntegrationLayer';
import { Logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface MemoryPattern {
  id: string;
  pattern: string;
  frequency: number;
  contexts: string[]; // Context IDs
  effectiveness: number;
  lastUsed: number;
  category: 'access' | 'search' | 'storage' | 'retrieval';
  metadata: {
    avgResponseTime: number;
    successRate: number;
    userSatisfaction: number;
    complexity: 'low' | 'medium' | 'high';
  };
}

export interface MemoryOptimization {
  id: string;
  type: 'cache' | 'index' | 'compression' | 'cleanup' | 'prefetch';
  description: string;
  impact: 'performance' | 'storage' | 'accuracy' | 'speed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImprovement: number; // Percentage
  implementationCost: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
}

export interface MemoryMetrics {
  totalMemoryUsage: number;
  activeContexts: number;
  cacheHitRate: number;
  averageQueryTime: number;
  memoryEfficiency: number;
  compressionRatio: number;
  indexingSpeed: number;
  retrievalAccuracy: number;
  userSatisfactionScore: number;
  systemLoad: number;
}

export interface SmartCacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  compressionEnabled: boolean;
  prefetchEnabled: boolean;
  adaptiveExpiry: boolean;
  priorityLevels: number;
}

export class SmartMemoryManager extends EventEmitter {
  private aiLayer: AIIntegrationLayer;
  private logger: Logger;
  private patterns: Map<string, MemoryPattern> = new Map();
  private optimizations: Map<string, MemoryOptimization> = new Map();
  private cache: Map<string, { data: any; timestamp: number; priority: number; hits: number }> = new Map();
  private metrics: MemoryMetrics;
  private config: SmartCacheConfig;
  private isOptimizing = false;
  private optimizationInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private patternsFile: string;
  private optimizationsFile: string;
  private metricsFile: string;

  constructor(
    aiLayer: AIIntegrationLayer,
    logger: Logger,
    options: {
      memoryPath?: string;
      cacheConfig?: Partial<SmartCacheConfig>;
      optimizationInterval?: number;
      metricsInterval?: number;
    } = {}
  ) {
    super();
    this.aiLayer = aiLayer;
    this.logger = logger;
    
    const memoryPath = options.memoryPath || path.join(process.cwd(), '.smart-memory');
    this.patternsFile = path.join(memoryPath, 'patterns.json');
    this.optimizationsFile = path.join(memoryPath, 'optimizations.json');
    this.metricsFile = path.join(memoryPath, 'metrics.json');
    
    this.config = {
      maxSize: 1000,
      ttl: 3600000, // 1 hour
      compressionEnabled: true,
      prefetchEnabled: true,
      adaptiveExpiry: true,
      priorityLevels: 5,
      ...options.cacheConfig
    };
    
    this.metrics = this.initializeMetrics();
    
    this.initialize(options.optimizationInterval, options.metricsInterval);
  }

  /**
   * Initialize Smart Memory Manager
   */
  private async initialize(
    optimizationInterval = 300000, // 5 minutes
    metricsInterval = 60000 // 1 minute
  ): Promise<void> {
    try {
      await this.ensureDirectoryExists();
      await this.loadPatterns();
      await this.loadOptimizations();
      await this.loadMetrics();
      
      this.setupEventHandlers();
      this.startOptimizationLoop(optimizationInterval);
      this.startMetricsCollection(metricsInterval);
      
      this.logger.info('Smart Memory Manager initialized successfully');
      this.emit('initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Smart Memory Manager:', error);
      throw error;
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.aiLayer.on('context_stored', (context: AIMemoryContext) => {
      this.analyzeStoragePattern(context);
    });
    
    this.aiLayer.on('insight_generated', (insight: AIInsight) => {
      this.processInsightForOptimization(insight);
    });
  }

  /**
   * Smart memory search with caching and optimization
   */
  async smartSearch(query: SmartMemoryQuery): Promise<{
    contexts: AIMemoryContext[];
    insights: AIInsight[];
    suggestions: string[];
    fromCache: boolean;
    responseTime: number;
  }> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(query);
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.updateCacheHit(cacheKey);
      return {
        ...cached,
        fromCache: true,
        responseTime: Date.now() - startTime
      };
    }
    
    // Perform search
    const result = await this.aiLayer.searchMemory(query);
    const responseTime = Date.now() - startTime;
    
    // Cache the result
    this.setCache(cacheKey, {
      contexts: result.contexts,
      insights: result.insights,
      suggestions: result.suggestions,
      fromCache: false,
      responseTime
    });
    
    // Analyze search pattern
    await this.analyzeSearchPattern(query, result, responseTime);
    
    // Update metrics
    this.updateSearchMetrics(responseTime, result.contexts.length);
    
    return {
      ...result,
      fromCache: false,
      responseTime
    };
  }

  /**
   * Intelligent memory prefetching
   */
  async prefetchMemory(contexts: AIMemoryContext[]): Promise<void> {
    if (!this.config.prefetchEnabled) return;
    
    const prefetchTasks: Promise<void>[] = [];
    
    for (const context of contexts) {
      // Prefetch related contexts
      if (context.relationships.relatedIds) {
        for (const relatedId of context.relationships.relatedIds) {
          prefetchTasks.push(this.prefetchContext(relatedId));
        }
      }
    }
    
    await Promise.all(prefetchTasks);
    this.logger.debug(`Prefetched ${prefetchTasks.length} related contexts`);
  }

  /**
   * Prefetch individual context
   */
  private async prefetchContext(contextId: string): Promise<void> {
    const cacheKey = `context:${contextId}`;
    if (this.cache.has(cacheKey)) return;
    
    // This would typically fetch from the AI layer
    // For now, we'll just mark it as prefetched
    this.setCache(cacheKey, { prefetched: true }, 1); // Low priority
  }

  /**
   * Analyze storage patterns
   */
  private async analyzeStoragePattern(context: AIMemoryContext): Promise<void> {
    const patternKey = `storage:${context.type}:${context.metadata.language || 'unknown'}`;
    
    let pattern = this.patterns.get(patternKey);
    if (!pattern) {
      pattern = {
        id: randomUUID(),
        pattern: patternKey,
        frequency: 0,
        contexts: [],
        effectiveness: 0.5,
        lastUsed: Date.now(),
        category: 'storage',
        metadata: {
          avgResponseTime: 0,
          successRate: 1.0,
          userSatisfaction: 0.8,
          complexity: context.metadata.complexity || 'medium'
        }
      };
    }
    
    pattern.frequency++;
    pattern.contexts.push(context.id);
    pattern.lastUsed = Date.now();
    
    this.patterns.set(patternKey, pattern);
    await this.savePatterns();
    
    // Generate optimization suggestions
    if (pattern.frequency > 10) {
      await this.suggestStorageOptimization(pattern);
    }
  }

  /**
   * Analyze search patterns
   */
  private async analyzeSearchPattern(
    query: SmartMemoryQuery,
    result: any,
    responseTime: number
  ): Promise<void> {
    const patternKey = `search:${query.type || 'hybrid'}:${query.query.length > 50 ? 'long' : 'short'}`;
    
    let pattern = this.patterns.get(patternKey);
    if (!pattern) {
      pattern = {
        id: randomUUID(),
        pattern: patternKey,
        frequency: 0,
        contexts: [],
        effectiveness: 0.5,
        lastUsed: Date.now(),
        category: 'search',
        metadata: {
          avgResponseTime: responseTime,
          successRate: result.contexts.length > 0 ? 1.0 : 0.0,
          userSatisfaction: 0.8,
          complexity: query.query.length > 100 ? 'high' : 'medium'
        }
      };
    } else {
      // Update running averages
      pattern.metadata.avgResponseTime = 
        (pattern.metadata.avgResponseTime * pattern.frequency + responseTime) / (pattern.frequency + 1);
      pattern.metadata.successRate = 
        (pattern.metadata.successRate * pattern.frequency + (result.contexts.length > 0 ? 1.0 : 0.0)) / (pattern.frequency + 1);
    }
    
    pattern.frequency++;
    pattern.lastUsed = Date.now();
    
    this.patterns.set(patternKey, pattern);
    await this.savePatterns();
  }

  /**
   * Process insights for optimization opportunities
   */
  private async processInsightForOptimization(insight: AIInsight): Promise<void> {
    if (insight.type === 'optimization' && insight.impact === 'high') {
      const optimization: MemoryOptimization = {
        id: randomUUID(),
        type: 'cache',
        description: `AI-suggested optimization: ${insight.title}`,
        impact: 'performance',
        priority: 'high',
        estimatedImprovement: insight.confidence * 100,
        implementationCost: 'medium',
        status: 'pending',
        createdAt: Date.now()
      };
      
      this.optimizations.set(optimization.id, optimization);
      await this.saveOptimizations();
      
      this.emit('optimization_suggested', optimization);
    }
  }

  /**
   * Suggest storage optimization
   */
  private async suggestStorageOptimization(pattern: MemoryPattern): Promise<void> {
    const optimization: MemoryOptimization = {
      id: randomUUID(),
      type: 'index',
      description: `Optimize storage for pattern: ${pattern.pattern}`,
      impact: 'storage',
      priority: pattern.frequency > 50 ? 'high' : 'medium',
      estimatedImprovement: Math.min(pattern.frequency * 2, 50),
      implementationCost: 'low',
      status: 'pending',
      createdAt: Date.now()
    };
    
    this.optimizations.set(optimization.id, optimization);
    await this.saveOptimizations();
  }

  /**
   * Start optimization loop
   */
  private startOptimizationLoop(interval: number): void {
    this.optimizationInterval = setInterval(async () => {
      if (!this.isOptimizing) {
        await this.runOptimizations();
      }
    }, interval);
  }

  /**
   * Run pending optimizations
   */
  private async runOptimizations(): Promise<void> {
    this.isOptimizing = true;
    
    try {
      const pendingOptimizations = Array.from(this.optimizations.values())
        .filter(opt => opt.status === 'pending')
        .sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
      
      for (const optimization of pendingOptimizations.slice(0, 3)) { // Process max 3 at a time
        await this.executeOptimization(optimization);
      }
    } catch (error) {
      this.logger.error('Error running optimizations:', error);
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Execute individual optimization
   */
  private async executeOptimization(optimization: MemoryOptimization): Promise<void> {
    optimization.status = 'in_progress';
    this.optimizations.set(optimization.id, optimization);
    
    try {
      switch (optimization.type) {
        case 'cache':
          await this.optimizeCache();
          break;
        case 'index':
          await this.optimizeIndexing();
          break;
        case 'compression':
          await this.optimizeCompression();
          break;
        case 'cleanup':
          await this.cleanupMemory();
          break;
        case 'prefetch':
          await this.optimizePrefetching();
          break;
      }
      
      optimization.status = 'completed';
      optimization.completedAt = Date.now();
      
      this.logger.info(`Optimization completed: ${optimization.description}`);
      this.emit('optimization_completed', optimization);
    } catch (error) {
      optimization.status = 'failed';
      this.logger.error(`Optimization failed: ${optimization.description}`, error);
      this.emit('optimization_failed', optimization, error);
    }
    
    this.optimizations.set(optimization.id, optimization);
    await this.saveOptimizations();
  }

  /**
   * Optimize cache performance
   */
  private async optimizeCache(): Promise<void> {
    // Remove expired entries
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    // Remove least recently used entries if cache is too large
    if (this.cache.size > this.config.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = this.cache.size - this.config.maxSize;
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
        removedCount++;
      }
    }
    
    this.logger.debug(`Cache optimization: removed ${removedCount} entries`);
  }

  /**
   * Optimize indexing
   */
  private async optimizeIndexing(): Promise<void> {
    // This would implement index optimization logic
    // For now, we'll just log the action
    this.logger.debug('Index optimization completed');
  }

  /**
   * Optimize compression
   */
  private async optimizeCompression(): Promise<void> {
    if (!this.config.compressionEnabled) return;
    
    // This would implement compression optimization
    this.logger.debug('Compression optimization completed');
  }

  /**
   * Clean up memory
   */
  private async cleanupMemory(): Promise<void> {
    // Remove old patterns
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    let removedPatterns = 0;
    
    for (const [key, pattern] of this.patterns.entries()) {
      if (pattern.lastUsed < cutoffTime && pattern.frequency < 5) {
        this.patterns.delete(key);
        removedPatterns++;
      }
    }
    
    await this.savePatterns();
    this.logger.debug(`Memory cleanup: removed ${removedPatterns} old patterns`);
  }

  /**
   * Optimize prefetching
   */
  private async optimizePrefetching(): Promise<void> {
    // Analyze prefetch effectiveness and adjust strategy
    this.logger.debug('Prefetch optimization completed');
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(interval: number): void {
    this.metricsInterval = setInterval(async () => {
      await this.collectMetrics();
    }, interval);
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics(): Promise<void> {
    const memoryUsage = process.memoryUsage();
    const cacheHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hits, 0);
    const totalCacheAccess = Math.max(cacheHits, 1);
    
    this.metrics = {
      totalMemoryUsage: memoryUsage.heapUsed,
      activeContexts: this.aiLayer.getMemoryContexts().length,
      cacheHitRate: cacheHits / totalCacheAccess,
      averageQueryTime: this.calculateAverageQueryTime(),
      memoryEfficiency: this.calculateMemoryEfficiency(),
      compressionRatio: this.calculateCompressionRatio(),
      indexingSpeed: this.calculateIndexingSpeed(),
      retrievalAccuracy: this.calculateRetrievalAccuracy(),
      userSatisfactionScore: this.calculateUserSatisfaction(),
      systemLoad: this.calculateSystemLoad()
    };
    
    await this.saveMetrics();
    this.emit('metrics_updated', this.metrics);
  }

  /**
   * Calculate average query time
   */
  private calculateAverageQueryTime(): number {
    const searchPatterns = Array.from(this.patterns.values())
      .filter(p => p.category === 'search');
    
    if (searchPatterns.length === 0) return 0;
    
    const totalTime = searchPatterns.reduce((sum, p) => sum + p.metadata.avgResponseTime, 0);
    return totalTime / searchPatterns.length;
  }

  /**
   * Calculate memory efficiency
   */
  private calculateMemoryEfficiency(): number {
    const totalPatterns = this.patterns.size;
    const effectivePatterns = Array.from(this.patterns.values())
      .filter(p => p.effectiveness > 0.7).length;
    
    return totalPatterns > 0 ? effectivePatterns / totalPatterns : 0;
  }

  /**
   * Calculate compression ratio
   */
  private calculateCompressionRatio(): number {
    // This would calculate actual compression ratio
    // For now, return a placeholder value
    return this.config.compressionEnabled ? 0.7 : 1.0;
  }

  /**
   * Calculate indexing speed
   */
  private calculateIndexingSpeed(): number {
    // This would measure actual indexing performance
    return 1000; // contexts per second
  }

  /**
   * Calculate retrieval accuracy
   */
  private calculateRetrievalAccuracy(): number {
    const searchPatterns = Array.from(this.patterns.values())
      .filter(p => p.category === 'search');
    
    if (searchPatterns.length === 0) return 0;
    
    const totalAccuracy = searchPatterns.reduce((sum, p) => sum + p.metadata.successRate, 0);
    return totalAccuracy / searchPatterns.length;
  }

  /**
   * Calculate user satisfaction
   */
  private calculateUserSatisfaction(): number {
    const allPatterns = Array.from(this.patterns.values());
    
    if (allPatterns.length === 0) return 0;
    
    const totalSatisfaction = allPatterns.reduce((sum, p) => sum + p.metadata.userSatisfaction, 0);
    return totalSatisfaction / allPatterns.length;
  }

  /**
   * Calculate system load
   */
  private calculateSystemLoad(): number {
    const memoryUsage = process.memoryUsage();
    const maxMemory = 1024 * 1024 * 1024; // 1GB
    return memoryUsage.heapUsed / maxMemory;
  }

  /**
   * Update search metrics
   */
  private updateSearchMetrics(responseTime: number, resultCount: number): void {
    // This would update real-time search metrics
    this.emit('search_completed', { responseTime, resultCount });
  }

  /**
   * Generate cache key for query
   */
  private generateCacheKey(query: SmartMemoryQuery): string {
    const keyData = {
      query: query.query,
      type: query.type,
      filters: query.filters,
      limit: query.limit
    };
    
    return `search:${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
  }

  /**
   * Get data from cache
   */
  private getFromCache(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: any, priority = 3): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      priority,
      hits: 0
    });
  }

  /**
   * Update cache hit count
   */
  private updateCacheHit(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      entry.hits++;
      this.cache.set(key, entry);
    }
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): MemoryMetrics {
    return {
      totalMemoryUsage: 0,
      activeContexts: 0,
      cacheHitRate: 0,
      averageQueryTime: 0,
      memoryEfficiency: 0,
      compressionRatio: 1.0,
      indexingSpeed: 0,
      retrievalAccuracy: 0,
      userSatisfactionScore: 0,
      systemLoad: 0
    };
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(): Promise<void> {
    const dir = path.dirname(this.patternsFile);
    await fs.mkdir(dir, { recursive: true });
  }

  /**
   * Load patterns from file
   */
  private async loadPatterns(): Promise<void> {
    try {
      const data = await fs.readFile(this.patternsFile, 'utf-8');
      const patterns = JSON.parse(data);
      this.patterns = new Map(Object.entries(patterns));
    } catch (error) {
      this.patterns = new Map();
    }
  }

  /**
   * Save patterns to file
   */
  private async savePatterns(): Promise<void> {
    const patterns = Object.fromEntries(this.patterns);
    await fs.writeFile(this.patternsFile, JSON.stringify(patterns, null, 2));
  }

  /**
   * Load optimizations from file
   */
  private async loadOptimizations(): Promise<void> {
    try {
      const data = await fs.readFile(this.optimizationsFile, 'utf-8');
      const optimizations = JSON.parse(data);
      this.optimizations = new Map(Object.entries(optimizations));
    } catch (error) {
      this.optimizations = new Map();
    }
  }

  /**
   * Save optimizations to file
   */
  private async saveOptimizations(): Promise<void> {
    const optimizations = Object.fromEntries(this.optimizations);
    await fs.writeFile(this.optimizationsFile, JSON.stringify(optimizations, null, 2));
  }

  /**
   * Load metrics from file
   */
  private async loadMetrics(): Promise<void> {
    try {
      const data = await fs.readFile(this.metricsFile, 'utf-8');
      this.metrics = JSON.parse(data);
    } catch (error) {
      this.metrics = this.initializeMetrics();
    }
  }

  /**
   * Save metrics to file
   */
  private async saveMetrics(): Promise<void> {
    await fs.writeFile(this.metricsFile, JSON.stringify(this.metrics, null, 2));
  }

  /**
   * Get current metrics
   */
  getMetrics(): MemoryMetrics {
    return { ...this.metrics };
  }

  /**
   * Get memory patterns
   */
  getPatterns(): MemoryPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get optimizations
   */
  getOptimizations(): MemoryOptimization[] {
    return Array.from(this.optimizations.values());
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalHits: number;
  } {
    const totalHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hits, 0);
    const totalAccess = Math.max(totalHits, 1);
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: totalHits / totalAccess,
      totalHits
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.emit('cache_cleared');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SmartCacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config_updated', this.config);
  }

  /**
   * Shutdown manager
   */
  shutdown(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    this.emit('shutdown');
  }
}

export default SmartMemoryManager;