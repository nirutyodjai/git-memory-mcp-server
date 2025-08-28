/**
 * Memory MCP Tools
 * This file provides utilities for memory management, data storage, and retrieval
 */
export interface MemoryEntry {
    id: string;
    key: string;
    value: any;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    tags: string[];
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        accessCount: number;
        lastAccessed: Date;
        ttl?: number;
        expiresAt?: Date;
        size: number;
        compressed?: boolean;
        encrypted?: boolean;
    };
    namespace?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
}
export interface MemoryQuery {
    key?: string;
    keys?: string[];
    tags?: string[];
    namespace?: string;
    type?: string;
    priority?: string;
    createdAfter?: Date;
    createdBefore?: Date;
    accessedAfter?: Date;
    accessedBefore?: Date;
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'lastAccessed' | 'accessCount' | 'size';
    sortOrder?: 'asc' | 'desc';
}
export interface MemoryStats {
    totalEntries: number;
    totalSize: number;
    averageSize: number;
    namespaces: string[];
    types: Record<string, number>;
    priorities: Record<string, number>;
    tags: Record<string, number>;
    oldestEntry?: Date;
    newestEntry?: Date;
    mostAccessed?: MemoryEntry;
    leastAccessed?: MemoryEntry;
    expiredEntries: number;
}
export interface MemoryBackup {
    id: string;
    timestamp: Date;
    entries: MemoryEntry[];
    stats: MemoryStats;
    metadata: {
        version: string;
        compressed: boolean;
        encrypted: boolean;
        size: number;
    };
}
export declare class MemoryTools {
    private static instance;
    private storage;
    private indexes;
    private maxSize;
    private currentSize;
    private cleanupInterval;
    private constructor();
    static getInstance(): MemoryTools;
    setMaxSize(sizeInBytes: number): void;
    getMaxSize(): number;
    getCurrentSize(): number;
    set(key: string, value: any, options?: {
        tags?: string[];
        namespace?: string;
        priority?: 'low' | 'medium' | 'high' | 'critical';
        ttl?: number;
        compress?: boolean;
        encrypt?: boolean;
    }): MemoryEntry;
    get(key: string, namespace?: string): any | null;
    getEntry(key: string, namespace?: string): MemoryEntry | null;
    has(key: string, namespace?: string): boolean;
    delete(id: string): boolean;
    deleteByKey(key: string, namespace?: string): boolean;
    clear(namespace?: string): number;
    query(query: MemoryQuery): MemoryEntry[];
    getStats(): MemoryStats;
    createBackup(): MemoryBackup;
    restoreBackup(backup: MemoryBackup): boolean;
    private generateId;
    private getValueType;
    private findByKey;
    private isExpired;
    private updateIndexes;
    private clearIndexes;
    private enforceMemoryLimit;
    private startCleanup;
    private cleanupExpired;
    destroy(): void;
}
export declare const memoryTools: MemoryTools;
//# sourceMappingURL=memory-tools.d.ts.map