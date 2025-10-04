import rateLimit from 'express-rate-limit';
import { createLogger } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info'
});

export class RateLimiter {
  constructor(options = {}) {
    this.config = {
      // Global rate limiting
      windowMs: options.windowMs || 60 * 1000, // 1 minute
      max: options.max || 100, // limit each IP to 100 requests per windowMs
      
      // Message configuration
      message: options.message || {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 'Retry after'
      },
      
      // Headers
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      
      // Skip configuration
      skip: options.skip || (() => false),
      
      // Handler for when limit is exceeded
      handler: options.handler || this.defaultHandler.bind(this)
    };
    
    this.limiter = rateLimit(this.config);
    
    logger.info('Rate limiter initialized', {
      windowMs: this.config.windowMs,
      max: this.config.max
    });
  }

  defaultHandler(req, res) {
    const retryAfter = Math.ceil(this.config.windowMs / 1000);
    
    res.status(429).json({
      error: this.config.message.error,
      retryAfter: retryAfter,
      limit: this.config.max,
      windowMs: this.config.windowMs
    });
  }

  middleware() {
    return this.limiter;
  }

  getClientIP(req) {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           'unknown';
  }

  getStats() {
    return {
      windowMs: this.config.windowMs,
      max: this.config.max,
      message: this.config.message
    };
  }

  cleanup() {
    logger.info('Rate limiter cleaned up');
  }
}

export class RateLimitError extends Error {
  constructor(message, rejRes, type) {
    super(message);
    this.name = 'RateLimitError';
    this.rejRes = rejRes;
    this.type = type;
  }
}

export function createRateLimiter(options) {
  return new RateLimiter(options);
}