import { Pool, PoolClient } from 'pg';
import { query, getClient } from './connection';
import cache from '../cache';

// Query performance monitoring
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  params?: any[];
}

const queryMetrics: QueryMetrics[] = [];
const MAX_METRICS = 1000;

// Slow query threshold (in milliseconds)
const SLOW_QUERY_THRESHOLD = 1000;

// Enhanced query function with caching and monitoring
export async function optimizedQuery<T = any>(
  text: string,
  params?: any[],
  options?: {
    cache?: boolean;
    cacheTTL?: number;
    cacheKey?: string;
    skipMetrics?: boolean;
  }
): Promise<T> {
  const startTime = Date.now();
  const cacheKey = options?.cacheKey || `query:${Buffer.from(text + JSON.stringify(params || [])).toString('base64')}`;

  // Try cache first if enabled
  if (options?.cache) {
    const cached = await cache.get<T>(cacheKey, {
      prefix: 'db',
      ttl: options.cacheTTL || 300, // 5 minutes default
    });
    if (cached !== null) {
      return cached;
    }
  }

  try {
    const result = await query(text, params);
    const duration = Date.now() - startTime;

    // Store metrics
    if (!options?.skipMetrics) {
      queryMetrics.push({
        query: text,
        duration,
        timestamp: new Date(),
        params,
      });

      // Keep only recent metrics
      if (queryMetrics.length > MAX_METRICS) {
        queryMetrics.shift();
      }

      // Log slow queries
      if (duration > SLOW_QUERY_THRESHOLD) {
        console.warn(`Slow query detected (${duration}ms):`, {
          query: text,
          params,
          duration,
        });
      }
    }

    // Cache result if enabled
    if (options?.cache && result.rows) {
      await cache.set(cacheKey, result.rows, {
        prefix: 'db',
        ttl: options.cacheTTL || 300,
      });
    }

    return result.rows || result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Query error:', {
      query: text,
      params,
      duration,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

// Transaction wrapper with automatic rollback
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Batch insert optimization
export async function batchInsert(
  table: string,
  columns: string[],
  values: any[][],
  options?: {
    batchSize?: number;
    onConflict?: string;
    returning?: string[];
  }
): Promise<any[]> {
  const batchSize = options?.batchSize || 1000;
  const results: any[] = [];

  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    
    // Generate placeholders
    const placeholders = batch.map((_, rowIndex) => {
      const rowPlaceholders = columns.map((_, colIndex) => 
        `$${rowIndex * columns.length + colIndex + 1}`
      ).join(', ');
      return `(${rowPlaceholders})`;
    }).join(', ');

    // Flatten values
    const flatValues = batch.flat();

    // Build query
    let queryText = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`;
    
    if (options?.onConflict) {
      queryText += ` ${options.onConflict}`;
    }
    
    if (options?.returning) {
      queryText += ` RETURNING ${options.returning.join(', ')}`;
    }

    const result = await optimizedQuery(queryText, flatValues, { skipMetrics: true });
    if (result) {
      results.push(...(Array.isArray(result) ? result : [result]));
    }
  }

  return results;
}

// Prepared statement cache
const preparedStatements = new Map<string, string>();

export async function preparedQuery<T = any>(
  name: string,
  text: string,
  params?: any[]
): Promise<T> {
  const client = await getClient();
  
  try {
    // Prepare statement if not already prepared
    if (!preparedStatements.has(name)) {
      await client.query(`PREPARE ${name} AS ${text}`);
      preparedStatements.set(name, text);
    }

    // Execute prepared statement
    const paramPlaceholders = params ? params.map((_, i) => `$${i + 1}`).join(', ') : '';
    const result = await client.query(`EXECUTE ${name}${paramPlaceholders ? `(${paramPlaceholders})` : ''}`, params);
    
    return result.rows || result;
  } finally {
    client.release();
  }
}

// Index analysis and suggestions
export async function analyzeIndexUsage(): Promise<any[]> {
  const indexUsageQuery = `
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_tup_read,
      idx_tup_fetch,
      idx_scan,
      CASE 
        WHEN idx_scan = 0 THEN 'Never used'
        WHEN idx_scan < 10 THEN 'Rarely used'
        ELSE 'Frequently used'
      END as usage_status
    FROM pg_stat_user_indexes 
    ORDER BY idx_scan DESC;
  `;

  return await optimizedQuery(indexUsageQuery, [], { cache: true, cacheTTL: 3600 });
}

// Table statistics
export async function getTableStats(): Promise<any[]> {
  const statsQuery = `
    SELECT 
      schemaname,
      tablename,
      n_tup_ins as inserts,
      n_tup_upd as updates,
      n_tup_del as deletes,
      n_live_tup as live_tuples,
      n_dead_tup as dead_tuples,
      last_vacuum,
      last_autovacuum,
      last_analyze,
      last_autoanalyze
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC;
  `;

  return await optimizedQuery(statsQuery, [], { cache: true, cacheTTL: 1800 });
}

// Query performance metrics
export function getQueryMetrics() {
  const now = Date.now();
  const recentMetrics = queryMetrics.filter(m => now - m.timestamp.getTime() < 3600000); // Last hour

  const slowQueries = recentMetrics.filter(m => m.duration > SLOW_QUERY_THRESHOLD);
  const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length || 0;
  
  return {
    totalQueries: recentMetrics.length,
    slowQueries: slowQueries.length,
    averageDuration: Math.round(avgDuration),
    slowestQuery: recentMetrics.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest, 
      { duration: 0, query: '', timestamp: new Date() }
    ),
    queryFrequency: recentMetrics.reduce((freq: Record<string, number>, metric) => {
      const queryKey = metric.query.substring(0, 50);
      freq[queryKey] = (freq[queryKey] || 0) + 1;
      return freq;
    }, {}),
  };
}

// Database maintenance
export async function runMaintenance(): Promise<void> {
  console.log('Starting database maintenance...');
  
  try {
    // Analyze tables for better query planning
    await optimizedQuery('ANALYZE;', [], { skipMetrics: true });
    
    // Clean up old sessions
    await optimizedQuery(
      'DELETE FROM user_sessions WHERE expires_at < NOW() - INTERVAL \'7 days\';',
      [],
      { skipMetrics: true }
    );
    
    // Update table statistics
    const tables = await optimizedQuery(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public';",
      [],
      { skipMetrics: true }
    );
    
    for (const table of tables) {
      await optimizedQuery(`ANALYZE ${table.tablename};`, [], { skipMetrics: true });
    }
    
    console.log('Database maintenance completed successfully');
  } catch (error) {
    console.error('Database maintenance failed:', error);
    throw error;
  }
}

// Cache invalidation helpers
export async function invalidateCache(patterns: string[]): Promise<void> {
  for (const pattern of patterns) {
    await cache.clear(pattern, { prefix: 'db' });
  }
}

export async function invalidateUserCache(userId: number): Promise<void> {
  await Promise.all([
    cache.del(`user:${userId}`, { prefix: 'db' }),
    cache.clear(`user:${userId}:*`, { prefix: 'db' }),
    cache.clear('users:*', { prefix: 'db' }),
  ]);
}

// Export all optimization utilities
export default {
  optimizedQuery,
  withTransaction,
  batchInsert,
  preparedQuery,
  analyzeIndexUsage,
  getTableStats,
  getQueryMetrics,
  runMaintenance,
  invalidateCache,
  invalidateUserCache,
};