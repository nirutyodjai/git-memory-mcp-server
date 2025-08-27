# Database Optimization & Caching Guide

This document provides comprehensive information about the database optimization and caching systems implemented in the 3D-SCO project.

## Overview

The project implements a multi-layered caching and database optimization strategy:

- **PostgreSQL Database** with performance optimizations
- **Redis Cache** for distributed caching (optional)
- **LRU Memory Cache** as fallback
- **Query Performance Monitoring**
- **Automated Database Maintenance**

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│   Cache Layer   │───▶│   PostgreSQL    │
│                 │    │                 │    │   Database      │
│ - API Routes    │    │ - Redis Cache   │    │                 │
│ - Components    │    │ - Memory Cache  │    │ - Optimized     │
│ - Services      │    │ - Query Cache   │    │   Queries       │
└─────────────────┘    └─────────────────┘    │ - Indexes       │
                                              │ - Maintenance   │
                                              └─────────────────┘
```

## Cache System

### Redis Cache (Primary)

**Configuration:**
```env
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600
```

**Features:**
- Distributed caching across multiple instances
- Persistent cache storage
- Advanced data structures (sets, lists, hashes)
- Automatic expiration (TTL)
- Connection pooling

### Memory Cache (Fallback)

**Configuration:**
- LRU (Least Recently Used) eviction policy
- Configurable max size (default: 1000 items)
- Memory usage monitoring
- Automatic cleanup

### Cache Usage Examples

```typescript
import { cache } from '@/lib/cache';

// Basic caching
const user = await cache.get('user:123');
if (!user) {
  const userData = await fetchUserFromDB(123);
  await cache.set('user:123', userData, 300); // 5 minutes TTL
}

// Function caching with decorator
const cachedFunction = cache.cached(
  async (userId: string) => {
    return await expensiveUserOperation(userId);
  },
  { ttl: 600, keyPrefix: 'expensive_op' }
);
```

## Database Optimization

### Query Optimization

**Features:**
- Automatic query caching
- Slow query detection (>1000ms)
- Query performance metrics
- Prepared statement caching

**Usage:**
```typescript
import { optimizedQuery } from '@/lib/database/optimizer';

// Optimized query with caching
const users = await optimizedQuery(
  'SELECT * FROM users WHERE role = $1',
  ['admin'],
  {
    cacheKey: 'admin_users',
    ttl: 300,
    slowQueryThreshold: 500
  }
);
```

### Transaction Management

```typescript
import { withTransaction } from '@/lib/database/optimizer';

// Atomic operations
const result = await withTransaction(async (client) => {
  await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [100, userId]);
  await client.query('INSERT INTO transactions (user_id, amount) VALUES ($1, $2)', [userId, -100]);
  return { success: true };
});
```

### Batch Operations

```typescript
import { batchInsert } from '@/lib/database/optimizer';

// Efficient bulk inserts
const users = [
  { name: 'John', email: 'john@example.com' },
  { name: 'Jane', email: 'jane@example.com' }
];

await batchInsert('users', users, ['name', 'email']);
```

## Performance Monitoring

### Query Metrics

The system automatically tracks:
- Query execution time
- Slow queries (>1000ms by default)
- Query frequency
- Cache hit/miss ratios

### Database Statistics

**Table Statistics:**
- Live/dead tuple counts
- Insert/update/delete operations
- Last vacuum/analyze timestamps

**Index Usage:**
- Index scan frequency
- Index effectiveness
- Unused index detection

### Admin Dashboard

Access the database monitoring dashboard at `/admin/database`:

- Real-time performance metrics
- Cache usage statistics
- Query performance analysis
- Maintenance operations
- Optimization recommendations

## Database Indexes

### Automatic Indexes

The system creates these performance indexes:

```sql
-- User table indexes
CREATE INDEX idx_users_email_lower ON users (LOWER(email));
CREATE INDEX idx_users_username_lower ON users (LOWER(username));
CREATE INDEX idx_users_created_at ON users (created_at);
CREATE INDEX idx_users_role ON users (role);

-- Session table indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions (expires_at);

-- Composite indexes
CREATE INDEX idx_users_email_role ON users (email, role);
CREATE INDEX idx_user_sessions_user_expires ON user_sessions (user_id, expires_at);
```

### Index Monitoring

The system monitors index usage and provides recommendations:
- Unused indexes (candidates for removal)
- Missing indexes (based on query patterns)
- Index effectiveness metrics

## Maintenance Operations

### Automated Maintenance

Runs automatically and includes:
- `ANALYZE` for query planner statistics
- Expired session cleanup
- Dead tuple cleanup recommendations
- Cache cleanup

### Manual Maintenance

```typescript
import { runMaintenance } from '@/lib/database/optimizer';

// Run maintenance operations
await runMaintenance();
```

**Via API:**
```bash
curl -X POST /api/admin/database \
  -H "Content-Type: application/json" \
  -d '{"action": "maintenance"}'
```

**Via Admin Dashboard:**
Use the "Maintenance" button in the database monitor.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=3d_sco
DB_USER=postgres
DB_PASSWORD=your_password

# Redis (optional)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Initialize Database with Caching

```bash
# Initialize with optimization and caching
npm run db:setup:cache

# Or basic initialization
npm run db:setup
```

### 4. Start Redis (Optional)

```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or install locally
# Windows: Download from https://redis.io/download
# macOS: brew install redis
# Linux: sudo apt-get install redis-server
```

## Performance Best Practices

### Query Optimization

1. **Use Prepared Statements**
   ```typescript
   const stmt = await preparedQuery('SELECT * FROM users WHERE id = $1');
   const user = await stmt.execute([userId]);
   ```

2. **Implement Proper Indexing**
   - Index frequently queried columns
   - Use composite indexes for multi-column queries
   - Monitor and remove unused indexes

3. **Cache Frequently Accessed Data**
   ```typescript
   const cacheKey = `user:${userId}`;
   let user = await cache.get(cacheKey);
   if (!user) {
     user = await fetchUser(userId);
     await cache.set(cacheKey, user, 300);
   }
   ```

### Cache Strategy

1. **Cache-Aside Pattern**
   - Check cache first
   - Fetch from database if miss
   - Update cache with result

2. **Write-Through Pattern**
   - Update database and cache simultaneously
   - Ensures cache consistency

3. **Cache Invalidation**
   ```typescript
   // Invalidate specific cache
   await cache.del('user:123');
   
   // Invalidate pattern
   await invalidateUserCache(userId);
   ```

### Connection Management

1. **Use Connection Pooling**
   - Configured automatically in `connection.ts`
   - Adjust pool size based on load

2. **Handle Connection Errors**
   ```typescript
   try {
     const result = await query('SELECT * FROM users');
   } catch (error) {
     if (error.code === 'ECONNREFUSED') {
       // Handle database connection error
     }
   }
   ```

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Database Performance**
   - Query execution time
   - Connection pool usage
   - Lock contention
   - Dead tuple ratio

2. **Cache Performance**
   - Hit/miss ratio
   - Memory usage
   - Eviction rate
   - Connection status

3. **System Resources**
   - CPU usage
   - Memory consumption
   - Disk I/O
   - Network latency

### Setting Up Alerts

```typescript
// Example: Alert on slow queries
if (queryDuration > 2000) {
  console.warn(`Slow query detected: ${queryDuration}ms`);
  // Send alert to monitoring system
}

// Example: Alert on cache miss rate
const hitRate = cacheHits / (cacheHits + cacheMisses);
if (hitRate < 0.8) {
  console.warn(`Low cache hit rate: ${hitRate * 100}%`);
}
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   ```
   Error: Redis connection failed
   ```
   - Check Redis server status
   - Verify connection configuration
   - System falls back to memory cache

2. **Slow Query Performance**
   ```
   Warning: Slow query detected: 2500ms
   ```
   - Check query execution plan
   - Add missing indexes
   - Optimize query structure

3. **High Memory Usage**
   ```
   Warning: Cache memory usage high: 95%
   ```
   - Reduce cache TTL
   - Increase cache size limit
   - Implement cache eviction strategy

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
DEBUG=cache,database,query
```

### Performance Analysis

```bash
# Check database performance
curl http://localhost:3000/api/admin/database

# Analyze slow queries
curl -X POST http://localhost:3000/api/admin/database \
  -d '{"action": "optimize_queries"}'
```

## API Reference

### Cache API

```typescript
// Get from cache
const value = await cache.get(key);

// Set with TTL
await cache.set(key, value, ttl);

// Delete
await cache.del(key);

// Check existence
const exists = await cache.exists(key);

// Get statistics
const stats = await cache.getStats();
```

### Database API

```typescript
// Optimized query
const result = await optimizedQuery(sql, params, options);

// Transaction
const result = await withTransaction(callback);

// Batch insert
await batchInsert(table, data, columns);

// Get metrics
const metrics = await getQueryMetrics();
```

### Admin API

```typescript
// GET /api/admin/database - Get overview
// POST /api/admin/database - Maintenance operations
// DELETE /api/admin/database - Clear cache
```

## Future Enhancements

1. **Advanced Caching**
   - Cache warming strategies
   - Distributed cache invalidation
   - Cache compression

2. **Database Optimization**
   - Automatic index recommendations
   - Query plan caching
   - Partition management

3. **Monitoring**
   - Real-time dashboards
   - Performance alerts
   - Capacity planning

4. **Scaling**
   - Read replicas
   - Horizontal sharding
   - Connection pooling optimization

---

## Support

For issues or questions about database optimization and caching:

1. Check the admin dashboard at `/admin/database`
2. Review application logs
3. Monitor system resources
4. Consult this documentation

The system is designed to be self-monitoring and self-healing, with automatic fallbacks and graceful degradation when components are unavailable.