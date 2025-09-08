const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const mongoose = require('mongoose');
const winston = require('winston');
const moment = require('moment');
const EventEmitter = require('events');

// Redis connection for rate limiting
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/rate-limiter-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/rate-limiter.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage tracking schema
const UsageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  responseTime: { type: Number },
  statusCode: { type: Number },
  userAgent: { type: String },
  ip: { type: String },
  requestSize: { type: Number },
  responseSize: { type: Number },
  rateLimitHit: { type: Boolean, default: false },
  quotaUsed: { type: Number, default: 0 },
  subscriptionTier: { type: String },
  cost: { type: Number, default: 0 },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'usage_logs'
});

// Indexes for performance
UsageSchema.index({ userId: 1, timestamp: -1 });
UsageSchema.index({ tenantId: 1, timestamp: -1 });
UsageSchema.index({ endpoint: 1, timestamp: -1 });
UsageSchema.index({ timestamp: -1 });
UsageSchema.index({ userId: 1, endpoint: 1, timestamp: -1 });

const Usage = mongoose.model('Usage', UsageSchema);

// Rate limit configurations by subscription tier
const RATE_LIMITS = {
  free: {
    requests: 100,
    window: 60 * 60 * 1000, // 1 hour
    dailyQuota: 1000,
    monthlyQuota: 10000,
    concurrentRequests: 5,
    burstLimit: 20
  },
  basic: {
    requests: 500,
    window: 60 * 60 * 1000, // 1 hour
    dailyQuota: 10000,
    monthlyQuota: 100000,
    concurrentRequests: 10,
    burstLimit: 50
  },
  pro: {
    requests: 2000,
    window: 60 * 60 * 1000, // 1 hour
    dailyQuota: 50000,
    monthlyQuota: 500000,
    concurrentRequests: 25,
    burstLimit: 100
  },
  enterprise: {
    requests: 10000,
    window: 60 * 60 * 1000, // 1 hour
    dailyQuota: 500000,
    monthlyQuota: 5000000,
    concurrentRequests: 100,
    burstLimit: 500
  },
  unlimited: {
    requests: Infinity,
    window: 60 * 60 * 1000,
    dailyQuota: Infinity,
    monthlyQuota: Infinity,
    concurrentRequests: Infinity,
    burstLimit: Infinity
  }
};

// Endpoint-specific rate limits
const ENDPOINT_LIMITS = {
  '/api/ai/generate': {
    free: { requests: 10, window: 60 * 60 * 1000, cost: 10 },
    basic: { requests: 50, window: 60 * 60 * 1000, cost: 5 },
    pro: { requests: 200, window: 60 * 60 * 1000, cost: 2 },
    enterprise: { requests: 1000, window: 60 * 60 * 1000, cost: 1 },
    unlimited: { requests: Infinity, window: 60 * 60 * 1000, cost: 0 }
  },
  '/api/git/operations': {
    free: { requests: 50, window: 60 * 60 * 1000, cost: 1 },
    basic: { requests: 200, window: 60 * 60 * 1000, cost: 0.5 },
    pro: { requests: 1000, window: 60 * 60 * 1000, cost: 0.2 },
    enterprise: { requests: 5000, window: 60 * 60 * 1000, cost: 0.1 },
    unlimited: { requests: Infinity, window: 60 * 60 * 1000, cost: 0 }
  },
  '/api/files/upload': {
    free: { requests: 20, window: 60 * 60 * 1000, cost: 2 },
    basic: { requests: 100, window: 60 * 60 * 1000, cost: 1 },
    pro: { requests: 500, window: 60 * 60 * 1000, cost: 0.5 },
    enterprise: { requests: 2000, window: 60 * 60 * 1000, cost: 0.2 },
    unlimited: { requests: Infinity, window: 60 * 60 * 1000, cost: 0 }
  }
};

class RateLimiterManager extends EventEmitter {
  constructor() {
    super();
    this.activeConnections = new Map();
    this.quotaCache = new Map();
    this.setupCleanupInterval();
  }

  // Create rate limiter for specific tier
  createRateLimiter(tier = 'free', endpoint = null) {
    const config = RATE_LIMITS[tier] || RATE_LIMITS.free;
    const endpointConfig = endpoint && ENDPOINT_LIMITS[endpoint] ? ENDPOINT_LIMITS[endpoint][tier] : null;
    
    const finalConfig = endpointConfig || config;

    return rateLimit({
      store: new RedisStore({
        sendCommand: (...args) => redis.call(...args),
      }),
      windowMs: finalConfig.window,
      max: finalConfig.requests,
      message: {
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${finalConfig.requests} per ${finalConfig.window / 1000 / 60} minutes`,
        retryAfter: Math.ceil(finalConfig.window / 1000),
        tier: tier,
        endpoint: endpoint
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        const userId = req.user?.id || req.ip;
        const tenantId = req.tenant?.id || 'default';
        return `${tier}:${endpoint || 'general'}:${userId}:${tenantId}`;
      },
      handler: (req, res) => {
        this.logRateLimitHit(req, tier, endpoint);
        res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${finalConfig.requests} per ${finalConfig.window / 1000 / 60} minutes`,
          retryAfter: Math.ceil(finalConfig.window / 1000),
          tier: tier,
          endpoint: endpoint,
          timestamp: new Date().toISOString()
        });
      },
      onLimitReached: (req, res, options) => {
        this.emit('limitReached', {
          userId: req.user?.id,
          tenantId: req.tenant?.id,
          tier,
          endpoint,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date()
        });
      }
    });
  }

  // Dynamic rate limiter middleware
  dynamicRateLimit() {
    return async (req, res, next) => {
      try {
        const user = req.user;
        const tier = user?.subscription?.tier || 'free';
        const endpoint = this.normalizeEndpoint(req.path);
        
        // Check quota before applying rate limit
        const quotaCheck = await this.checkQuota(user?.id, tier, endpoint);
        if (!quotaCheck.allowed) {
          return res.status(429).json({
            error: 'Quota exceeded',
            message: quotaCheck.message,
            quotaUsed: quotaCheck.used,
            quotaLimit: quotaCheck.limit,
            resetDate: quotaCheck.resetDate
          });
        }

        // Apply rate limiting
        const limiter = this.createRateLimiter(tier, endpoint);
        limiter(req, res, (err) => {
          if (err) {
            logger.error('Rate limiter error:', err);
            return next(err);
          }
          
          // Track usage
          this.trackUsage(req, res, tier, endpoint);
          next();
        });
      } catch (error) {
        logger.error('Dynamic rate limit error:', error);
        next(error);
      }
    };
  }

  // Check quota limits
  async checkQuota(userId, tier, endpoint) {
    if (!userId || tier === 'unlimited') {
      return { allowed: true };
    }

    const config = RATE_LIMITS[tier] || RATE_LIMITS.free;
    const endpointConfig = ENDPOINT_LIMITS[endpoint]?.[tier];
    
    const today = moment().startOf('day');
    const thisMonth = moment().startOf('month');

    try {
      // Check daily quota
      const dailyUsage = await Usage.countDocuments({
        userId,
        timestamp: { $gte: today.toDate() }
      });

      if (dailyUsage >= config.dailyQuota) {
        return {
          allowed: false,
          message: 'Daily quota exceeded',
          used: dailyUsage,
          limit: config.dailyQuota,
          resetDate: moment().add(1, 'day').startOf('day').toDate()
        };
      }

      // Check monthly quota
      const monthlyUsage = await Usage.countDocuments({
        userId,
        timestamp: { $gte: thisMonth.toDate() }
      });

      if (monthlyUsage >= config.monthlyQuota) {
        return {
          allowed: false,
          message: 'Monthly quota exceeded',
          used: monthlyUsage,
          limit: config.monthlyQuota,
          resetDate: moment().add(1, 'month').startOf('month').toDate()
        };
      }

      return { allowed: true, dailyUsed: dailyUsage, monthlyUsed: monthlyUsage };
    } catch (error) {
      logger.error('Quota check error:', error);
      return { allowed: true }; // Allow on error to prevent blocking
    }
  }

  // Track concurrent connections
  trackConcurrentConnections() {
    return (req, res, next) => {
      const userId = req.user?.id || req.ip;
      const tier = req.user?.subscription?.tier || 'free';
      const config = RATE_LIMITS[tier] || RATE_LIMITS.free;
      
      const currentConnections = this.activeConnections.get(userId) || 0;
      
      if (currentConnections >= config.concurrentRequests) {
        return res.status(429).json({
          error: 'Too many concurrent requests',
          message: `Maximum ${config.concurrentRequests} concurrent requests allowed for ${tier} tier`,
          currentConnections,
          maxConnections: config.concurrentRequests
        });
      }

      // Increment connection count
      this.activeConnections.set(userId, currentConnections + 1);
      
      // Decrement on response finish
      res.on('finish', () => {
        const current = this.activeConnections.get(userId) || 0;
        if (current > 0) {
          this.activeConnections.set(userId, current - 1);
        }
      });

      next();
    };
  }

  // Track API usage
  async trackUsage(req, res, tier, endpoint) {
    try {
      const startTime = req.startTime || Date.now();
      const responseTime = Date.now() - startTime;
      const endpointConfig = ENDPOINT_LIMITS[endpoint]?.[tier];
      const cost = endpointConfig?.cost || 0;

      const usage = new Usage({
        userId: req.user?.id,
        tenantId: req.tenant?.id,
        endpoint: req.path,
        method: req.method,
        responseTime,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        requestSize: req.get('Content-Length') || 0,
        responseSize: res.get('Content-Length') || 0,
        subscriptionTier: tier,
        cost,
        metadata: {
          query: req.query,
          params: req.params,
          rateLimitHeaders: {
            limit: res.get('X-RateLimit-Limit'),
            remaining: res.get('X-RateLimit-Remaining'),
            reset: res.get('X-RateLimit-Reset')
          }
        }
      });

      await usage.save();
      
      // Emit usage event for real-time monitoring
      this.emit('usage', {
        userId: req.user?.id,
        tenantId: req.tenant?.id,
        endpoint: req.path,
        method: req.method,
        tier,
        cost,
        responseTime,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Usage tracking error:', error);
    }
  }

  // Log rate limit hits
  async logRateLimitHit(req, tier, endpoint) {
    try {
      const usage = new Usage({
        userId: req.user?.id,
        tenantId: req.tenant?.id,
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        rateLimitHit: true,
        subscriptionTier: tier,
        metadata: {
          rateLimitType: 'request_limit',
          endpoint: endpoint
        }
      });

      await usage.save();
      
      logger.warn('Rate limit hit', {
        userId: req.user?.id,
        tenantId: req.tenant?.id,
        endpoint: req.path,
        tier,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (error) {
      logger.error('Rate limit logging error:', error);
    }
  }

  // Get usage statistics
  async getUsageStats(userId, period = 'day', startDate = null, endDate = null) {
    try {
      const start = startDate ? moment(startDate) : moment().subtract(1, period);
      const end = endDate ? moment(endDate) : moment();

      const pipeline = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            timestamp: {
              $gte: start.toDate(),
              $lte: end.toDate()
            }
          }
        },
        {
          $group: {
            _id: {
              endpoint: '$endpoint',
              method: '$method',
              date: {
                $dateToString: {
                  format: period === 'hour' ? '%Y-%m-%d %H:00:00' : '%Y-%m-%d',
                  date: '$timestamp'
                }
              }
            },
            requests: { $sum: 1 },
            totalCost: { $sum: '$cost' },
            avgResponseTime: { $avg: '$responseTime' },
            rateLimitHits: {
              $sum: {
                $cond: ['$rateLimitHit', 1, 0]
              }
            },
            errors: {
              $sum: {
                $cond: [{ $gte: ['$statusCode', 400] }, 1, 0]
              }
            }
          }
        },
        {
          $sort: { '_id.date': 1, '_id.endpoint': 1 }
        }
      ];

      const stats = await Usage.aggregate(pipeline);
      
      // Get quota usage
      const quotaUsage = await this.getQuotaUsage(userId);
      
      return {
        period,
        startDate: start.toDate(),
        endDate: end.toDate(),
        stats,
        quotaUsage,
        summary: this.calculateSummary(stats)
      };
    } catch (error) {
      logger.error('Get usage stats error:', error);
      throw error;
    }
  }

  // Get quota usage
  async getQuotaUsage(userId) {
    const today = moment().startOf('day');
    const thisMonth = moment().startOf('month');

    const [dailyUsage, monthlyUsage] = await Promise.all([
      Usage.countDocuments({
        userId,
        timestamp: { $gte: today.toDate() }
      }),
      Usage.countDocuments({
        userId,
        timestamp: { $gte: thisMonth.toDate() }
      })
    ]);

    return {
      daily: {
        used: dailyUsage,
        resetDate: moment().add(1, 'day').startOf('day').toDate()
      },
      monthly: {
        used: monthlyUsage,
        resetDate: moment().add(1, 'month').startOf('month').toDate()
      }
    };
  }

  // Calculate summary statistics
  calculateSummary(stats) {
    const totalRequests = stats.reduce((sum, stat) => sum + stat.requests, 0);
    const totalCost = stats.reduce((sum, stat) => sum + stat.totalCost, 0);
    const totalErrors = stats.reduce((sum, stat) => sum + stat.errors, 0);
    const totalRateLimitHits = stats.reduce((sum, stat) => sum + stat.rateLimitHits, 0);
    const avgResponseTime = stats.length > 0 
      ? stats.reduce((sum, stat) => sum + stat.avgResponseTime, 0) / stats.length 
      : 0;

    return {
      totalRequests,
      totalCost,
      totalErrors,
      totalRateLimitHits,
      avgResponseTime,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      rateLimitHitRate: totalRequests > 0 ? (totalRateLimitHits / totalRequests) * 100 : 0
    };
  }

  // Normalize endpoint for rate limiting
  normalizeEndpoint(path) {
    // Remove IDs and normalize paths
    const normalized = path
      .replace(/\/[0-9a-fA-F]{24}/g, '/:id') // MongoDB ObjectIds
      .replace(/\/\d+/g, '/:id') // Numeric IDs
      .replace(/\/[a-fA-F0-9-]{36}/g, '/:uuid'); // UUIDs
    
    // Check if it matches any configured endpoint
    for (const endpoint of Object.keys(ENDPOINT_LIMITS)) {
      if (normalized.startsWith(endpoint)) {
        return endpoint;
      }
    }
    
    return null;
  }

  // Setup cleanup interval for active connections
  setupCleanupInterval() {
    setInterval(() => {
      // Clean up stale connections
      for (const [userId, count] of this.activeConnections.entries()) {
        if (count <= 0) {
          this.activeConnections.delete(userId);
        }
      }
      
      // Clean up quota cache
      this.quotaCache.clear();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Burst protection middleware
  burstProtection() {
    const burstCounts = new Map();
    
    return (req, res, next) => {
      const userId = req.user?.id || req.ip;
      const tier = req.user?.subscription?.tier || 'free';
      const config = RATE_LIMITS[tier] || RATE_LIMITS.free;
      
      const now = Date.now();
      const windowStart = now - 60000; // 1 minute window
      
      let userBursts = burstCounts.get(userId) || [];
      userBursts = userBursts.filter(timestamp => timestamp > windowStart);
      
      if (userBursts.length >= config.burstLimit) {
        return res.status(429).json({
          error: 'Burst limit exceeded',
          message: `Too many requests in short time. Limit: ${config.burstLimit} per minute`,
          retryAfter: 60
        });
      }
      
      userBursts.push(now);
      burstCounts.set(userId, userBursts);
      
      next();
    };
  }

  // Health check
  async healthCheck() {
    try {
      await redis.ping();
      await Usage.findOne().limit(1);
      
      return {
        status: 'healthy',
        redis: 'connected',
        database: 'connected',
        activeConnections: this.activeConnections.size,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

// Export singleton instance
const rateLimiterManager = new RateLimiterManager();

module.exports = {
  RateLimiterManager,
  rateLimiterManager,
  RATE_LIMITS,
  ENDPOINT_LIMITS,
  Usage
};