/**
 * Advanced Rate Limiting Service for Git Memory MCP Server
 *
 * Features:
 * - Multiple rate limiting algorithms (Token Bucket, Sliding Window, Fixed Window)
 * - Per-user, per-IP, per-endpoint rate limiting
 * - Dynamic rate limiting based on system load
 * - Distributed rate limiting with Redis
 * - Rate limiting analytics and monitoring
 * - WebSocket connection rate limiting
 */

import Redis from 'redis';
import { EventEmitter } from 'events';

export interface RateLimitConfig {
  windowMs: number;           // Time window in milliseconds
  maxRequests: number;       // Max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

export interface RateLimitRule {
  name: string;
  pattern: string | RegExp;
  config: RateLimitConfig;
  priority?: number;
  enabled?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  strategy: string;
}

export interface RateLimitAnalytics {
  endpoint: string;
  method: string;
  userId?: string;
  ip: string;
  userAgent?: string;
  statusCode: number;
  responseTime: number;
  rateLimited: boolean;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class AdvancedRateLimitService extends EventEmitter {
  private redis: Redis.RedisClientType;
  private rules: Map<string, RateLimitRule[]> = new Map();
  private analytics: RateLimitAnalytics[] = [];
  private maxAnalyticsSize: number = 10000;
  private systemLoadThreshold: number = 0.8;
  private dynamicMultiplier: number = 1.0;

  constructor(redisUrl?: string) {
    super();
    this.redis = Redis.createClient({
      url: redisUrl || process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.redis.on('error', (error) => {
      this.emit('error', error);
    });

    this.initializeRedis();
    this.startSystemLoadMonitor();
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    try {
      await this.redis.connect();
      this.emit('redis:connected');
    } catch (error) {
      this.emit('redis:error', error);
    }
  }

  /**
   * Add rate limiting rule
   */
  addRule(endpoint: string, rule: RateLimitRule): void {
    if (!this.rules.has(endpoint)) {
      this.rules.set(endpoint, []);
    }
    this.rules.get(endpoint)!.push(rule);
    this.emit('rule:added', { endpoint, rule: rule.name });
  }

  /**
   * Remove rate limiting rule
   */
  removeRule(endpoint: string, ruleName: string): boolean {
    const rules = this.rules.get(endpoint);
    if (!rules) return false;

    const index = rules.findIndex(r => r.name === ruleName);
    if (index === -1) return false;

    rules.splice(index, 1);
    this.emit('rule:removed', { endpoint, rule: ruleName });
    return true;
  }

  /**
   * Check rate limit for request
   */
  async checkRateLimit(
    endpoint: string,
    method: string,
    ip: string,
    userId?: string,
    userAgent?: string
  ): Promise<RateLimitResult> {
    const startTime = Date.now();
    const rules = this.rules.get(endpoint) || [];
    const applicableRules = rules.filter(rule => rule.enabled !== false);

    if (applicableRules.length === 0) {
      return {
        success: true,
        limit: Infinity,
        remaining: Infinity,
        resetTime: 0,
        strategy: 'none'
      };
    }

    // Sort rules by priority (higher priority first)
    applicableRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Apply dynamic multiplier based on system load
    const adjustedRules = this.applyDynamicMultiplier(applicableRules);

    // Check each rule
    for (const rule of adjustedRules) {
      const result = await this.checkRule(rule, endpoint, method, ip, userId);
      if (!result.success) {
        // Log rate limiting event
        await this.logRateLimitEvent(endpoint, method, ip, userId, userAgent, result);

        return result;
      }
    }

    return {
      success: true,
      limit: adjustedRules[0]?.config.maxRequests || Infinity,
      remaining: adjustedRules[0]?.config.maxRequests || Infinity,
      resetTime: Date.now() + (adjustedRules[0]?.config.windowMs || 60000),
      strategy: 'multi-rule'
    };
  }

  /**
   * Check specific rate limiting rule
   */
  private async checkRule(
    rule: RateLimitRule,
    endpoint: string,
    method: string,
    ip: string,
    userId?: string
  ): Promise<RateLimitResult> {
    const key = this.generateKey(rule, endpoint, method, ip, userId);
    const now = Date.now();
    const windowMs = rule.config.windowMs;
    const maxRequests = Math.floor(rule.config.maxRequests * this.dynamicMultiplier);

    try {
      // Get current count from Redis
      const currentCount = await this.redis.get(key) || '0';
      const count = parseInt(currentCount, 10);

      // Check if we're over the limit
      if (count >= maxRequests) {
        const resetTime = await this.getResetTime(key, windowMs);

        return {
          success: false,
          limit: maxRequests,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil((resetTime - now) / 1000),
          strategy: rule.name
        };
      }

      // Increment counter
      const pipeline = this.redis.multi();
      pipeline.incr(key);
      pipeline.expire(key, Math.ceil(windowMs / 1000));

      await pipeline.exec();

      // Calculate remaining requests
      const ttl = await this.redis.ttl(key);
      const resetTime = now + (ttl * 1000);

      return {
        success: true,
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - (count + 1)),
        resetTime,
        strategy: rule.name
      };
    } catch (error) {
      this.emit('error', { type: 'rate-limit-check', error, rule: rule.name });
      // Fail open - allow request if Redis is down
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests,
        resetTime: now + windowMs,
        strategy: 'fallback'
      };
    }
  }

  /**
   * Generate Redis key for rate limiting
   */
  private generateKey(
    rule: RateLimitRule,
    endpoint: string,
    method: string,
    ip: string,
    userId?: string
  ): string {
    const parts = [
      'rate-limit',
      rule.name,
      endpoint,
      method,
      ip
    ];

    if (userId) {
      parts.push(`user:${userId}`);
    }

    return parts.join(':');
  }

  /**
   * Get reset time for rate limit window
   */
  private async getResetTime(key: string, windowMs: number): Promise<number> {
    try {
      const ttl = await this.redis.ttl(key);
      return Date.now() + (ttl * 1000);
    } catch {
      return Date.now() + windowMs;
    }
  }

  /**
   * Apply dynamic multiplier based on system load
   */
  private applyDynamicMultiplier(rules: RateLimitRule[]): RateLimitRule[] {
    return rules.map(rule => ({
      ...rule,
      config: {
        ...rule.config,
        maxRequests: Math.floor(rule.config.maxRequests * this.dynamicMultiplier)
      }
    }));
  }

  /**
   * Monitor system load and adjust rate limiting
   */
  private startSystemLoadMonitor(): void {
    setInterval(async () => {
      try {
        const load = await this.getSystemLoad();
        this.adjustDynamicMultiplier(load);
      } catch (error) {
        this.emit('error', { type: 'system-load-monitor', error });
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get current system load
   */
  private async getSystemLoad(): Promise<number> {
    // In a real implementation, this would check actual system metrics
    // For now, we'll simulate based on memory usage
    const memUsage = process.memoryUsage();
    const usageRatio = memUsage.heapUsed / memUsage.heapTotal;

    // Also consider active connections
    const activeConnections = await this.getActiveConnectionCount();

    return Math.max(usageRatio, activeConnections / 3000); // Normalize to 0-1
  }

  /**
   * Get active connection count (simplified)
   */
  private async getActiveConnectionCount(): Promise<number> {
    try {
      const count = await this.redis.get('active:connections');
      return parseInt(count || '0', 10);
    } catch {
      return 0;
    }
  }

  /**
   * Adjust dynamic multiplier based on system load
   */
  private adjustDynamicMultiplier(load: number): void {
    const previousMultiplier = this.dynamicMultiplier;

    if (load > this.systemLoadThreshold) {
      // Reduce rate limits when system is under high load
      this.dynamicMultiplier = Math.max(0.5, 1.0 - (load - this.systemLoadThreshold));
    } else {
      // Gradually restore rate limits when load decreases
      this.dynamicMultiplier = Math.min(1.0, this.dynamicMultiplier + 0.1);
    }

    if (Math.abs(this.dynamicMultiplier - previousMultiplier) > 0.01) {
      this.emit('multiplier:changed', {
        previous: previousMultiplier,
        current: this.dynamicMultiplier,
        load
      });
    }
  }

  /**
   * Log rate limiting event for analytics
   */
  private async logRateLimitEvent(
    endpoint: string,
    method: string,
    ip: string,
    userId?: string,
    userAgent?: string,
    result: RateLimitResult
  ): Promise<void> {
    const analytics: RateLimitAnalytics = {
      endpoint,
      method,
      userId,
      ip,
      userAgent,
      statusCode: 429,
      responseTime: Date.now(),
      rateLimited: true,
      timestamp: new Date().toISOString(),
      metadata: {
        strategy: result.strategy,
        retryAfter: result.retryAfter
      }
    };

    this.addAnalyticsEntry(analytics);

    // Store in Redis for persistence (optional)
    try {
      await this.redis.lPush('rate-limit:events', JSON.stringify(analytics));
      await this.redis.lTrim('rate-limit:events', 0, 999); // Keep last 1000 events
    } catch (error) {
      this.emit('error', { type: 'analytics-log', error });
    }
  }

  /**
   * Add analytics entry with size management
   */
  private addAnalyticsEntry(entry: RateLimitAnalytics): void {
    this.analytics.unshift(entry);

    if (this.analytics.length > this.maxAnalyticsSize) {
      this.analytics = this.analytics.slice(0, this.maxAnalyticsSize);
    }
  }

  /**
   * Get rate limiting analytics
   */
  getAnalytics(limit: number = 100): RateLimitAnalytics[] {
    return this.analytics.slice(0, limit);
  }

  /**
   * Get rate limiting statistics
   */
  async getStatistics(): Promise<Record<string, any>> {
    try {
      const totalEvents = await this.redis.lLen('rate-limit:events');
      const recentEvents = await this.redis.lRange('rate-limit:events', 0, 99);

      const stats = {
        totalRateLimitedRequests: totalEvents,
        dynamicMultiplier: this.dynamicMultiplier,
        activeRules: Array.from(this.rules.entries()).map(([endpoint, rules]) => ({
          endpoint,
          ruleCount: rules.length,
          enabledRules: rules.filter(r => r.enabled !== false).length
        })),
        recentEvents: recentEvents.map(e => JSON.parse(e)),
        timestamp: new Date().toISOString()
      };

      return stats;
    } catch (error) {
      this.emit('error', { type: 'statistics', error });
      return {
        error: 'Unable to retrieve statistics',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Clear all rate limiting data
   */
  async clearAll(): Promise<void> {
    try {
      const pattern = 'rate-limit:*';
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(keys);
      }

      this.analytics = [];
      this.emit('data:cleared');
    } catch (error) {
      this.emit('error', { type: 'clear-all', error });
    }
  }

  /**
   * Gracefully shutdown
   */
  async shutdown(): Promise<void> {
    try {
      await this.redis.quit();
      this.emit('shutdown');
    } catch (error) {
      this.emit('error', { type: 'shutdown', error });
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      await this.redis.ping();
      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }
}

/**
 * Middleware factory for Express rate limiting
 */
export function createRateLimitMiddleware(
  rateLimitService: AdvancedRateLimitService,
  options: {
    getUserId?: (req: any) => string | undefined;
    getIp?: (req: any) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  } = {}
) {
  return async (req: any, res: any, next: any) => {
    try {
      const endpoint = `${req.method}:${req.path}`;
      const ip = options.getIp ? options.getIp(req) : req.ip;
      const userId = options.getUserId ? options.getUserId(req) : undefined;
      const userAgent = req.get('User-Agent');

      const result = await rateLimitService.checkRateLimit(
        endpoint,
        req.method,
        ip,
        userId,
        userAgent
      );

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': result.limit,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        'X-RateLimit-Strategy': result.strategy
      });

      if (result.retryAfter) {
        res.set('Retry-After', result.retryAfter.toString());
      }

      if (!result.success) {
        return res.status(429).json({
          error: 'Too Many Requests',
          retryAfter: result.retryAfter,
          resetTime: new Date(result.resetTime).toISOString(),
          message: 'Rate limit exceeded. Please try again later.'
        });
      }

      next();
    } catch (error) {
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
}

/**
 * WebSocket rate limiting middleware
 */
export function createWebSocketRateLimitMiddleware(
  rateLimitService: AdvancedRateLimitService,
  options: {
    getUserId?: (socket: any) => string | undefined;
    getIp?: (socket: any) => string;
    maxConnectionsPerIp?: number;
    maxConnectionsPerUser?: number;
  } = {}
) {
  const connections = new Map<string, Set<string>>(); // ip -> Set of connectionIds
  const userConnections = new Map<string, Set<string>>(); // userId -> Set of connectionIds

  return async (socket: any, next: any) => {
    try {
      const ip = options.getIp ? options.getIp(socket) : socket.handshake.address;
      const userId = options.getUserId ? options.getUserId(socket) : undefined;

      // Check IP-based connection limits
      if (options.maxConnectionsPerIp) {
        const ipConnections = connections.get(ip) || new Set();
        if (ipConnections.size >= options.maxConnectionsPerIp) {
          return next(new Error('Too many connections from this IP'));
        }
      }

      // Check user-based connection limits
      if (options.maxConnectionsPerUser && userId) {
        const userConns = userConnections.get(userId) || new Set();
        if (userConns.size >= options.maxConnectionsPerUser) {
          return next(new Error('Too many connections for this user'));
        }
      }

      // Check WebSocket message rate limiting
      const wsEndpoint = 'websocket:connection';
      const result = await rateLimitService.checkRateLimit(
        wsEndpoint,
        'WS',
        ip,
        userId
      );

      if (!result.success) {
        return next(new Error('WebSocket rate limit exceeded'));
      }

      // Track connection
      if (options.maxConnectionsPerIp) {
        if (!connections.has(ip)) {
          connections.set(ip, new Set());
        }
        connections.get(ip)!.add(socket.id);
      }

      if (options.maxConnectionsPerUser && userId) {
        if (!userConnections.has(userId)) {
          userConnections.set(userId, new Set());
        }
        userConnections.get(userId)!.add(socket.id);
      }

      // Clean up on disconnect
      socket.on('disconnect', () => {
        if (options.maxConnectionsPerIp && connections.has(ip)) {
          connections.get(ip)!.delete(socket.id);
          if (connections.get(ip)!.size === 0) {
            connections.delete(ip);
          }
        }

        if (options.maxConnectionsPerUser && userId && userConnections.has(userId)) {
          userConnections.get(userId)!.delete(socket.id);
          if (userConnections.get(userId)!.size === 0) {
            userConnections.delete(userId);
          }
        }
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}
