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
    ttl?: number; // Time to live in milliseconds
    expiresAt?: Date;
    size: number; // Size in bytes
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

// Memory Storage Manager
export class MemoryTools {
  private static instance: MemoryTools;
  private storage: Map<string, MemoryEntry> = new Map();
  private indexes: {
    byNamespace: Map<string, Set<string>>;
    byTag: Map<string, Set<string>>;
    byType: Map<string, Set<string>>;
    byPriority: Map<string, Set<string>>;
  };
  private maxSize: number = 100 * 1024 * 1024; // 100MB default
  private currentSize: number = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.indexes = {
      byNamespace: new Map(),
      byTag: new Map(),
      byType: new Map(),
      byPriority: new Map()
    };
    
    // Start cleanup interval (every 5 minutes)
    this.startCleanup();
  }

  public static getInstance(): MemoryTools {
    if (!MemoryTools.instance) {
      MemoryTools.instance = new MemoryTools();
    }
    return MemoryTools.instance;
  }

  // Configuration
  setMaxSize(sizeInBytes: number): void {
    this.maxSize = sizeInBytes;
    this.enforceMemoryLimit();
  }

  getMaxSize(): number {
    return this.maxSize;
  }

  getCurrentSize(): number {
    return this.currentSize;
  }

  // Storage operations
  set(
    key: string,
    value: any,
    options: {
      tags?: string[];
      namespace?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      ttl?: number;
      compress?: boolean;
      encrypt?: boolean;
    } = {}
  ): MemoryEntry {
    const id = this.generateId();
    const serializedValue = JSON.stringify(value);
    const size = new Blob([serializedValue]).size;
    const now = new Date();
    
    // Check if adding this entry would exceed memory limit
    if (this.currentSize + size > this.maxSize) {
      this.enforceMemoryLimit(size);
    }
    
    const entry: MemoryEntry = {
      id,
      key,
      value,
      type: this.getValueType(value),
      tags: options.tags || [],
      metadata: {
        createdAt: now,
        updatedAt: now,
        accessCount: 0,
        lastAccessed: now,
        ttl: options.ttl,
        expiresAt: options.ttl ? new Date(now.getTime() + options.ttl) : undefined,
        size,
        compressed: options.compress || false,
        encrypted: options.encrypt || false
      },
      namespace: options.namespace,
      priority: options.priority || 'medium'
    };

    // Remove existing entry with same key if it exists
    const existingEntry = this.findByKey(key, options.namespace);
    if (existingEntry) {
      this.delete(existingEntry.id);
    }

    // Store entry
    this.storage.set(id, entry);
    this.currentSize += size;
    
    // Update indexes
    this.updateIndexes(entry, 'add');
    
    return entry;
  }

  get(key: string, namespace?: string): any | null {
    const entry = this.findByKey(key, namespace);
    if (!entry) return null;
    
    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(entry.id);
      return null;
    }
    
    // Update access metadata
    entry.metadata.accessCount++;
    entry.metadata.lastAccessed = new Date();
    
    return entry.value;
  }

  getEntry(key: string, namespace?: string): MemoryEntry | null {
    const entry = this.findByKey(key, namespace);
    if (!entry) return null;
    
    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(entry.id);
      return null;
    }
    
    // Update access metadata
    entry.metadata.accessCount++;
    entry.metadata.lastAccessed = new Date();
    
    return entry;
  }

  has(key: string, namespace?: string): boolean {
    const entry = this.findByKey(key, namespace);
    if (!entry) return false;
    
    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(entry.id);
      return false;
    }
    
    return true;
  }

  delete(id: string): boolean {
    const entry = this.storage.get(id);
    if (!entry) return false;
    
    this.storage.delete(id);
    this.currentSize -= entry.metadata.size;
    this.updateIndexes(entry, 'remove');
    
    return true;
  }

  deleteByKey(key: string, namespace?: string): boolean {
    const entry = this.findByKey(key, namespace);
    if (!entry) return false;
    
    return this.delete(entry.id);
  }

  clear(namespace?: string): number {
    let deletedCount = 0;
    
    if (namespace) {
      const namespaceEntries = this.indexes.byNamespace.get(namespace);
      if (namespaceEntries) {
        for (const id of namespaceEntries) {
          if (this.delete(id)) {
            deletedCount++;
          }
        }
      }
    } else {
      deletedCount = this.storage.size;
      this.storage.clear();
      this.currentSize = 0;
      this.clearIndexes();
    }
    
    return deletedCount;
  }

  // Query operations
  query(query: MemoryQuery): MemoryEntry[] {
    let results: MemoryEntry[] = [];
    
    // Start with all entries or filter by namespace
    if (query.namespace) {
      const namespaceIds = this.indexes.byNamespace.get(query.namespace);
      if (namespaceIds) {
        results = Array.from(namespaceIds)
          .map(id => this.storage.get(id))
          .filter((entry): entry is MemoryEntry => entry !== undefined);
      }
    } else {
      results = Array.from(this.storage.values());
    }
    
    // Filter by key
    if (query.key) {
      results = results.filter(entry => entry.key === query.key);
    }
    
    // Filter by keys
    if (query.keys) {
      results = results.filter(entry => query.keys!.includes(entry.key));
    }
    
    // Filter by tags
    if (query.tags) {
      results = results.filter(entry => 
        query.tags!.some(tag => entry.tags.includes(tag))
      );
    }
    
    // Filter by type
    if (query.type) {
      results = results.filter(entry => entry.type === query.type);
    }
    
    // Filter by priority
    if (query.priority) {
      results = results.filter(entry => entry.priority === query.priority);
    }
    
    // Filter by date ranges
    if (query.createdAfter) {
      results = results.filter(entry => entry.metadata.createdAt >= query.createdAfter!);
    }
    
    if (query.createdBefore) {
      results = results.filter(entry => entry.metadata.createdAt <= query.createdBefore!);
    }
    
    if (query.accessedAfter) {
      results = results.filter(entry => entry.metadata.lastAccessed >= query.accessedAfter!);
    }
    
    if (query.accessedBefore) {
      results = results.filter(entry => entry.metadata.lastAccessed <= query.accessedBefore!);
    }
    
    // Remove expired entries
    results = results.filter(entry => !this.isExpired(entry));
    
    // Sort results
    if (query.sortBy) {
      results.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (query.sortBy) {
          case 'createdAt':
            aValue = a.metadata.createdAt.getTime();
            bValue = b.metadata.createdAt.getTime();
            break;
          case 'updatedAt':
            aValue = a.metadata.updatedAt.getTime();
            bValue = b.metadata.updatedAt.getTime();
            break;
          case 'lastAccessed':
            aValue = a.metadata.lastAccessed.getTime();
            bValue = b.metadata.lastAccessed.getTime();
            break;
          case 'accessCount':
            aValue = a.metadata.accessCount;
            bValue = b.metadata.accessCount;
            break;
          case 'size':
            aValue = a.metadata.size;
            bValue = b.metadata.size;
            break;
          default:
            return 0;
        }
        
        const order = query.sortOrder === 'desc' ? -1 : 1;
        return aValue < bValue ? -order : aValue > bValue ? order : 0;
      });
    }
    
    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit;
    
    if (limit) {
      results = results.slice(offset, offset + limit);
    } else if (offset > 0) {
      results = results.slice(offset);
    }
    
    return results;
  }

  // Statistics
  getStats(): MemoryStats {
    const entries = Array.from(this.storage.values());
    const validEntries = entries.filter(entry => !this.isExpired(entry));
    
    const types: Record<string, number> = {};
    const priorities: Record<string, number> = {};
    const tags: Record<string, number> = {};
    
    let totalSize = 0;
    let oldestEntry: Date | undefined;
    let newestEntry: Date | undefined;
    let mostAccessed: MemoryEntry | undefined;
    let leastAccessed: MemoryEntry | undefined;
    
    for (const entry of validEntries) {
      // Types
      types[entry.type] = (types[entry.type] || 0) + 1;
      
      // Priorities
      priorities[entry.priority] = (priorities[entry.priority] || 0) + 1;
      
      // Tags
      for (const tag of entry.tags) {
        tags[tag] = (tags[tag] || 0) + 1;
      }
      
      // Size
      totalSize += entry.metadata.size;
      
      // Dates
      if (!oldestEntry || entry.metadata.createdAt < oldestEntry) {
        oldestEntry = entry.metadata.createdAt;
      }
      
      if (!newestEntry || entry.metadata.createdAt > newestEntry) {
        newestEntry = entry.metadata.createdAt;
      }
      
      // Access counts
      if (!mostAccessed || entry.metadata.accessCount > mostAccessed.metadata.accessCount) {
        mostAccessed = entry;
      }
      
      if (!leastAccessed || entry.metadata.accessCount < leastAccessed.metadata.accessCount) {
        leastAccessed = entry;
      }
    }
    
    return {
      totalEntries: validEntries.length,
      totalSize,
      averageSize: validEntries.length > 0 ? totalSize / validEntries.length : 0,
      namespaces: Array.from(this.indexes.byNamespace.keys()),
      types,
      priorities,
      tags,
      oldestEntry,
      newestEntry,
      mostAccessed,
      leastAccessed,
      expiredEntries: entries.length - validEntries.length
    };
  }

  // Backup and restore
  createBackup(): MemoryBackup {
    const entries = Array.from(this.storage.values());
    const stats = this.getStats();
    
    return {
      id: this.generateId(),
      timestamp: new Date(),
      entries,
      stats,
      metadata: {
        version: '1.0.0',
        compressed: false,
        encrypted: false,
        size: JSON.stringify(entries).length
      }
    };
  }

  restoreBackup(backup: MemoryBackup): boolean {
    try {
      this.clear();
      
      for (const entry of backup.entries) {
        this.storage.set(entry.id, entry);
        this.currentSize += entry.metadata.size;
        this.updateIndexes(entry, 'add');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return false;
    }
  }

  // Private helper methods
  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getValueType(value: any): 'string' | 'number' | 'boolean' | 'object' | 'array' {
    if (Array.isArray(value)) return 'array';
    return typeof value as 'string' | 'number' | 'boolean' | 'object';
  }

  private findByKey(key: string, namespace?: string): MemoryEntry | null {
    for (const entry of this.storage.values()) {
      if (entry.key === key && entry.namespace === namespace) {
        return entry;
      }
    }
    return null;
  }

  private isExpired(entry: MemoryEntry): boolean {
    if (!entry.metadata.expiresAt) return false;
    return new Date() > entry.metadata.expiresAt;
  }

  private updateIndexes(entry: MemoryEntry, operation: 'add' | 'remove'): void {
    const { id, namespace, tags, type, priority } = entry;
    
    if (operation === 'add') {
      // Namespace index
      if (namespace) {
        if (!this.indexes.byNamespace.has(namespace)) {
          this.indexes.byNamespace.set(namespace, new Set());
        }
        this.indexes.byNamespace.get(namespace)!.add(id);
      }
      
      // Tag indexes
      for (const tag of tags) {
        if (!this.indexes.byTag.has(tag)) {
          this.indexes.byTag.set(tag, new Set());
        }
        this.indexes.byTag.get(tag)!.add(id);
      }
      
      // Type index
      if (!this.indexes.byType.has(type)) {
        this.indexes.byType.set(type, new Set());
      }
      this.indexes.byType.get(type)!.add(id);
      
      // Priority index
      if (!this.indexes.byPriority.has(priority)) {
        this.indexes.byPriority.set(priority, new Set());
      }
      this.indexes.byPriority.get(priority)!.add(id);
      
    } else {
      // Remove from all indexes
      if (namespace) {
        this.indexes.byNamespace.get(namespace)?.delete(id);
      }
      
      for (const tag of tags) {
        this.indexes.byTag.get(tag)?.delete(id);
      }
      
      this.indexes.byType.get(type)?.delete(id);
      this.indexes.byPriority.get(priority)?.delete(id);
    }
  }

  private clearIndexes(): void {
    this.indexes.byNamespace.clear();
    this.indexes.byTag.clear();
    this.indexes.byType.clear();
    this.indexes.byPriority.clear();
  }

  private enforceMemoryLimit(additionalSize: number = 0): void {
    const targetSize = this.maxSize - additionalSize;
    
    if (this.currentSize <= targetSize) return;
    
    // Get entries sorted by priority (low first) and last accessed (oldest first)
    const entries = Array.from(this.storage.values())
      .sort((a, b) => {
        const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        return a.metadata.lastAccessed.getTime() - b.metadata.lastAccessed.getTime();
      });
    
    // Remove entries until we're under the limit
    for (const entry of entries) {
      if (this.currentSize <= targetSize) break;
      this.delete(entry.id);
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private cleanupExpired(): void {
    const expiredIds: string[] = [];
    
    for (const [id, entry] of this.storage.entries()) {
      if (this.isExpired(entry)) {
        expiredIds.push(id);
      }
    }
    
    for (const id of expiredIds) {
      this.delete(id);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Export singleton instance
export const memoryTools = MemoryTools.getInstance();