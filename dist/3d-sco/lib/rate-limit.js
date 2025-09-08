"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = exports.generalApiLimiter = exports.adminApiLimiter = exports.adminLoginLimiter = void 0;
exports.createRateLimitResponse = createRateLimitResponse;
class RateLimiter {
    constructor(config) {
        this.store = new Map();
        this.config = config;
        // Clean up expired entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
    getKey(request) {
        // Use IP address as the key
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
        return ip;
    }
    cleanup() {
        const now = Date.now();
        for (const [key, record] of this.store.entries()) {
            if (record.resetTime < now && (!record.blocked || (record.blockUntil && record.blockUntil < now))) {
                this.store.delete(key);
            }
        }
    }
    check(request) {
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
    getStats() {
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
exports.RateLimiter = RateLimiter;
// Pre-configured rate limiters for different endpoints
exports.adminLoginLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
});
exports.adminApiLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
});
exports.generalApiLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requests per minute
});
// Helper function to create rate limit response
function createRateLimitResponse(result) {
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
