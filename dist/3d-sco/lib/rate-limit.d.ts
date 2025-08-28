import { NextRequest } from 'next/server';
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}
interface RequestRecord {
    count: number;
    resetTime: number;
    blocked: boolean;
    blockUntil?: number;
}
declare class RateLimiter {
    private store;
    private config;
    constructor(config: RateLimitConfig);
    private getKey;
    private cleanup;
    check(request: NextRequest): {
        allowed: boolean;
        remaining: number;
        resetTime: number;
        retryAfter?: number;
    };
    getStats(): {
        totalKeys: number;
        blockedKeys: number;
        activeRequests: number;
    };
}
export declare const adminLoginLimiter: RateLimiter;
export declare const adminApiLimiter: RateLimiter;
export declare const generalApiLimiter: RateLimiter;
export declare function createRateLimitResponse(result: ReturnType<RateLimiter['check']>): {
    headers: import("undici-types").Headers;
    status: number;
    message: string;
};
export { RateLimiter };
export type { RateLimitConfig, RequestRecord };
//# sourceMappingURL=rate-limit.d.ts.map