export declare function initializeRedis(): Promise<void>;
export interface CacheOptions {
    ttl?: number;
    prefix?: string;
}
export declare function get<T = any>(key: string, options?: CacheOptions): Promise<T | null>;
export declare function set<T = any>(key: string, value: T, options?: CacheOptions): Promise<boolean>;
export declare function del(key: string, options?: CacheOptions): Promise<boolean>;
export declare function clear(pattern?: string, options?: CacheOptions): Promise<boolean>;
export declare function exists(key: string, options?: CacheOptions): Promise<boolean>;
export declare function getStats(): {
    memoryCache: {
        size: any;
        max: any;
        calculatedSize: any;
    };
    redis: {
        connected: any;
        ready: any;
    };
};
export declare function cached<T extends (...args: any[]) => Promise<any>>(fn: T, options?: CacheOptions & {
    keyGenerator?: (...args: Parameters<T>) => string;
}): T;
export declare function cleanup(): Promise<void>;
declare const _default: {
    get: typeof get;
    set: typeof set;
    del: typeof del;
    clear: typeof clear;
    exists: typeof exists;
    getStats: typeof getStats;
    cached: typeof cached;
    cleanup: typeof cleanup;
    initializeRedis: typeof initializeRedis;
};
export default _default;
//# sourceMappingURL=index.d.ts.map