import { createClient, RedisClientType } from 'redis';
import { LRUCache } from 'lru-cache';

// Redis client configuration
let redisClient: RedisClientType | null = null;

// In-memory LRU cache as fallback
const memoryCache = new LRUCache<string, any>({
  max: 1000, // Maximum number of items
  ttl: 1000 * 60 * 15, // 15 minutes default TTL
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

// Initialize Redis client
export async function initializeRedis(): Promise<void> {
  if (process.env.REDIS_URL) {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 5000,
        },
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
        redisClient = null; // Fallback to memory cache
      });

      redisClient.on('connect', () => {
        console.log('Redis connected successfully');
      });

      redisClient.on('disconnect', () => {
        console.log('Redis disconnected');
      });

      await redisClient.connect();
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      redisClient = null;
    }
  }
}

// Cache interface
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
}

// Get value from cache
export async function get<T = any>(key: string, options?: CacheOptions): Promise<T | null> {
  const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;

  try {
    if (redisClient && redisClient.isOpen) {
      const value = await redisClient.get(fullKey);
      return value ? JSON.parse(value) : null;
    }
  } catch (error) {
    console.error('Redis get error:', error);
  }

  // Fallback to memory cache
  return memoryCache.get(fullKey) || null;
}

// Set value in cache
export async function set<T = any>(
  key: string,
  value: T,
  options?: CacheOptions
): Promise<boolean> {
  const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;
  const ttl = options?.ttl || 900; // Default 15 minutes

  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.setEx(fullKey, ttl, JSON.stringify(value));
      return true;
    }
  } catch (error) {
    console.error('Redis set error:', error);
  }

  // Fallback to memory cache
  memoryCache.set(fullKey, value, { ttl: ttl * 1000 });
  return true;
}

// Delete value from cache
export async function del(key: string, options?: CacheOptions): Promise<boolean> {
  const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;

  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.del(fullKey);
      return true;
    }
  } catch (error) {
    console.error('Redis del error:', error);
  }

  // Fallback to memory cache
  memoryCache.delete(fullKey);
  return true;
}

// Clear cache by pattern
export async function clear(pattern?: string, options?: CacheOptions): Promise<boolean> {
  const prefix = options?.prefix || '';
  const searchPattern = pattern ? `${prefix}:${pattern}*` : `${prefix}:*`;

  try {
    if (redisClient && redisClient.isOpen) {
      const keys = await redisClient.keys(searchPattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    }
  } catch (error) {
    console.error('Redis clear error:', error);
  }

  // Fallback to memory cache
  if (pattern) {
    const keys = Array.from(memoryCache.keys()).filter((k) => (k as string).startsWith(searchPattern.replace('*', '')));
    keys.forEach(key => memoryCache.delete(key));
  } else {
    memoryCache.clear();
  }
  return true;
}

// Check if key exists
export async function exists(key: string, options?: CacheOptions): Promise<boolean> {
  const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;

  try {
    if (redisClient && redisClient.isOpen) {
      const result = await redisClient.exists(fullKey);
      return result === 1;
    }
  } catch (error) {
    console.error('Redis exists error:', error);
  }

  // Fallback to memory cache
  return memoryCache.has(fullKey);
}

// Get cache statistics
export function getStats() {
  return {
    memoryCache: {
      size: memoryCache.size,
      max: memoryCache.max,
      calculatedSize: memoryCache.calculatedSize,
    },
    redis: {
      connected: redisClient?.isOpen || false,
      ready: redisClient?.isReady || false,
    },
  };
}

// Cache decorator for functions
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: CacheOptions & { keyGenerator?: (...args: Parameters<T>) => string }
): T {
  return (async (...args: Parameters<T>) => {
    const key = options?.keyGenerator ? options.keyGenerator(...args) : JSON.stringify(args);
    
    // Try to get from cache first
    const cached = await get(key, options);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    await set(key, result, options);
    return result;
  }) as T;
}

// Cleanup function
export async function cleanup(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
  }
  memoryCache.clear();
}

// Initialize cache on module load
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).window === 'undefined') {
  initializeRedis().catch(console.error);
}

export default {
  get,
  set,
  del,
  clear,
  exists,
  getStats,
  cached,
  cleanup,
  initializeRedis,
};