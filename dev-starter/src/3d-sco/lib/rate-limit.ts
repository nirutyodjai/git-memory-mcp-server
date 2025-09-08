import { NextRequest } from 'next/server';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Store for tracking requests
interface RequestRecord {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

class RateLimiter {
  private store = new Map<string, RequestRecord>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private getKey(request: NextRequest): string {
    // Use IP address as the key
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
    return ip;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (record.resetTime < now && (!record.blocked || (record.blockUntil && record.blockUntil < now))) {
        this.store.delete(key);
      }
    }
  }

  public check(request: NextRequest): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const key = this.getKey(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    let record = this.store.get(key);
    
    // Initialize or reset if window expired
    if (!record || record.resetTime <= now) {
      record = {
        count: 0,
        resetTime: now + this.config.windowMs,
        blocked: false
      };
    }
    
    // Check if currently blocked
    if (record.blocked && record.blockUntil && record.blockUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter: Math.ceil((record.blockUntil - now) / 1000)
      };
    }
    
    // Reset block if expired
    if (record.blocked && record.blockUntil && record.blockUntil <= now) {
      record.blocked = false;
      record.blockUntil = undefined;
      record.count = 0;
      record.resetTime = now + this.config.windowMs;
    }
    
    // Increment counter
    record.count++;
    
    // Check if limit exceeded
    if (record.count > this.config.maxRequests) {
      record.blocked = true;
      record.blockUntil = now + (this.config.windowMs * 2); // Block for 2x window time
      this.store.set(key, record);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter: Math.ceil((record.blockUntil - now) / 1000)
      };
    }
    
    this.store.set(key, record);
    
    return {
      allowed: true,
      remaining: Math.max(0, this.config.maxRequests - record.count),
      resetTime: record.resetTime
    };
  }

  public getStats(): {
    totalKeys: number;
    blockedKeys: number;
    activeRequests: number;
  } {
    const now = Date.now();
    let blockedKeys = 0;
    let activeRequests = 0;
    
    for (const record of this.store.values()) {
      if (record.blocked && record.blockUntil && record.blockUntil > now) {
        blockedKeys++;
      }
      if (record.resetTime > now) {
        activeRequests += record.count;
      }
    }
    
    return {
      totalKeys: this.store.size,
      blockedKeys,
      activeRequests
    };
  }
}

// Pre-configured rate limiters for different endpoints
export const adminLoginLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
});

export const adminApiLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
});

export const generalApiLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 200, // 200 requests per minute
});

// Helper function to create rate limit response
export function createRateLimitResponse(result: ReturnType<RateLimiter['check']>) {
  const headers = new Headers({
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  });
  
  if (!result.allowed && result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }
  
  return {
    headers,
    status: result.allowed ? 200 : 429,
    message: result.allowed ? 'OK' : 'Too Many Requests'
  };
}

export { RateLimiter };
export type { RateLimitConfig, RequestRecord };