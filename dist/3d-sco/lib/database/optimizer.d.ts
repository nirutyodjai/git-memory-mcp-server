import { PoolClient } from 'pg';
interface QueryMetrics {
    query: string;
    duration: number;
    timestamp: Date;
    params?: any[];
}
export declare function optimizedQuery<T = any>(text: string, params?: any[], options?: {
    cache?: boolean;
    cacheTTL?: number;
    cacheKey?: string;
    skipMetrics?: boolean;
}): Promise<T>;
export declare function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
export declare function batchInsert(table: string, columns: string[], values: any[][], options?: {
    batchSize?: number;
    onConflict?: string;
    returning?: string[];
}): Promise<any[]>;
export declare function preparedQuery<T = any>(name: string, text: string, params?: any[]): Promise<T>;
export declare function analyzeIndexUsage(): Promise<any[]>;
export declare function getTableStats(): Promise<any[]>;
export declare function getQueryMetrics(): {
    totalQueries: number;
    slowQueries: number;
    averageDuration: number;
    slowestQuery: QueryMetrics;
    queryFrequency: Record<string, number>;
};
export declare function runMaintenance(): Promise<void>;
export declare function invalidateCache(patterns: string[]): Promise<void>;
export declare function invalidateUserCache(userId: number): Promise<void>;
declare const _default: {
    optimizedQuery: typeof optimizedQuery;
    withTransaction: typeof withTransaction;
    batchInsert: typeof batchInsert;
    preparedQuery: typeof preparedQuery;
    analyzeIndexUsage: typeof analyzeIndexUsage;
    getTableStats: typeof getTableStats;
    getQueryMetrics: typeof getQueryMetrics;
    runMaintenance: typeof runMaintenance;
    invalidateCache: typeof invalidateCache;
    invalidateUserCache: typeof invalidateUserCache;
};
export default _default;
//# sourceMappingURL=optimizer.d.ts.map