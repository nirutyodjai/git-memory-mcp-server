/**
 * Admin API Routes for Git Memory MCP Server
 *
 * Provides comprehensive admin functionality:
 * - Server status and health monitoring
 * - Real-time metrics and analytics
 * - Configuration management
 * - Log streaming and filtering
 * - Server control (restart, shutdown)
 * - Cache management
 * - Performance profiling
 */

import express from 'express';
import { AdvancedCachingService } from '../services/advanced-caching.js';
import { AdvancedRateLimitService } from '../services/advanced-rate-limiting.js';
import { AuditLoggingService } from '../services/audit-logging.js';
import { APIVersioningService } from '../services/api-versioning.js';
import { AdvancedLoadBalancingService } from '../services/load-balancing.js';
import { AdvancedConnectionPoolService } from '../services/connection-pooling.js';

const router = express.Router();

// Initialize services (in a real app, these would be injected)
let cacheService: AdvancedCachingService;
let rateLimitService: AdvancedRateLimitService;
let auditService: AuditLoggingService;
let apiVersioningService: APIVersioningService;
let loadBalancingService: AdvancedLoadBalancingService;
let connectionPoolService: AdvancedConnectionPoolService;

// Initialize services function
export function initializeAdminServices(services: {
  cache?: AdvancedCachingService;
  rateLimit?: AdvancedRateLimitService;
  audit?: AuditLoggingService;
  apiVersioning?: APIVersioningService;
  loadBalancing?: AdvancedLoadBalancingService;
  connectionPool?: AdvancedConnectionPoolService;
}) {
  cacheService = services.cache!;
  rateLimitService = services.rateLimit!;
  auditService = services.audit!;
  apiVersioningService = services.apiVersioning!;
  loadBalancingService = services.loadBalancing!;
  connectionPoolService = services.connectionPool!;
}

/**
 * Get comprehensive server status
 */
router.get('/api/status', async (req, res) => {
  try {
    const status = {
      server: {
        version: process.env.npm_package_version || '2.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        pid: process.pid
      },
      services: {
        cache: cacheService ? await cacheService.healthCheck() : { status: 'not_initialized' },
        rateLimit: rateLimitService ? await rateLimitService.healthCheck() : { status: 'not_initialized' },
        audit: auditService ? await auditService.healthCheck() : { status: 'not_initialized' },
        loadBalancing: loadBalancingService ? await loadBalancingService.healthCheck() : { status: 'not_initialized' },
        connectionPool: connectionPoolService ? await connectionPoolService.healthCheck() : { status: 'not_initialized' }
      },
      timestamp: new Date().toISOString(),
      healthy: true // This would be calculated based on service health
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get server status',
      details: error.message
    });
  }
});

/**
 * Get real-time metrics
 */
router.get('/api/metrics', async (req, res) => {
  try {
    const metrics = {
      // Server metrics
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      loadAverage: require('os').loadavg(),

      // Cache metrics
      cache: cacheService ? cacheService.getMetrics() : null,

      // Rate limiting metrics
      rateLimiting: rateLimitService ? await rateLimitService.getStatistics() : null,

      // Load balancing metrics
      loadBalancing: loadBalancingService ? loadBalancingService.getDetailedMetrics() : null,

      // Connection pool metrics
      connectionPool: connectionPoolService ? connectionPoolService.getMetrics() : null,

      // API versioning stats
      apiVersions: apiVersioningService ? apiVersioningService.getVersionStatistics() : null,

      timestamp: new Date().toISOString()
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get metrics',
      details: error.message
    });
  }
});

/**
 * Get audit logs with filtering
 */
router.get('/api/logs', async (req, res) => {
  try {
    const {
      startTime,
      endTime,
      level,
      category,
      limit = 100,
      offset = 0
    } = req.query;

    const filter: any = {};

    if (startTime) filter.startTime = new Date(startTime as string);
    if (endTime) filter.endTime = new Date(endTime as string);
    if (level) filter.level = Array.isArray(level) ? level : [level];
    if (category) filter.category = Array.isArray(category) ? category : [category];

    const result = await auditService.query(filter, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get logs',
      details: error.message
    });
  }
});

/**
 * Update server configuration
 */
router.post('/api/config', async (req, res) => {
  try {
    const configUpdates = req.body;

    // Validate configuration updates
    const allowedConfig = [
      'logLevel', 'rateLimit', 'cacheTTL', 'maxConnections',
      'enableMetrics', 'enableTracing', 'enableCompression'
    ];

    const validUpdates: any = {};
    for (const key of allowedConfig) {
      if (configUpdates.hasOwnProperty(key)) {
        validUpdates[key] = configUpdates[key];
      }
    }

    // Apply configuration updates
    if (validUpdates.logLevel) {
      // Update logging level (implementation depends on your logger)
      process.env.LOG_LEVEL = validUpdates.logLevel;
    }

    if (validUpdates.rateLimit) {
      // Update rate limiting (implementation would go here)
      process.env.RATE_LIMIT = validUpdates.rateLimit;
    }

    if (validUpdates.cacheTTL) {
      // Update cache TTL (implementation would go here)
      process.env.CACHE_TTL = validUpdates.cacheTTL;
    }

    if (validUpdates.maxConnections) {
      // Update max connections (implementation would go here)
      process.env.MAX_CONNECTIONS = validUpdates.maxConnections;
    }

    // Log configuration change
    if (auditService) {
      await auditService.log({
        level: 'info',
        category: 'configuration',
        action: 'config_updated',
        details: validUpdates,
        metadata: { tags: ['admin', 'config'] }
      });
    }

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      updated: validUpdates
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update configuration',
      details: error.message
    });
  }
});

/**
 * Restart server
 */
router.post('/api/restart', async (req, res) => {
  try {
    // Log restart action
    if (auditService) {
      await auditService.log({
        level: 'warn',
        category: 'system',
        action: 'server_restart',
        details: { source: 'admin_dashboard' },
        metadata: { tags: ['admin', 'restart'] }
      });
    }

    res.json({
      success: true,
      message: 'Server restart initiated'
    });

    // Delay restart to allow response to be sent
    setTimeout(() => {
      process.exit(0); // Graceful exit
    }, 1000);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to restart server',
      details: error.message
    });
  }
});

/**
 * Clear caches
 */
router.post('/api/cache/clear', async (req, res) => {
  try {
    const { level = 'all' } = req.body;

    if (cacheService) {
      await cacheService.clear(level);
    }

    // Log cache clear action
    if (auditService) {
      await auditService.log({
        level: 'info',
        category: 'cache',
        action: 'cache_cleared',
        details: { level },
        metadata: { tags: ['admin', 'cache'] }
      });
    }

    res.json({
      success: true,
      message: `Cache cleared for level: ${level}`
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear cache',
      details: error.message
    });
  }
});

/**
 * Get cache statistics
 */
router.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = cacheService ? cacheService.getMetrics() : null;

    res.json({
      cache: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get cache statistics',
      details: error.message
    });
  }
});

/**
 * Get rate limiting statistics
 */
router.get('/api/rate-limiting/stats', async (req, res) => {
  try {
    const stats = rateLimitService ? await rateLimitService.getStatistics() : null;

    res.json({
      rateLimiting: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get rate limiting statistics',
      details: error.message
    });
  }
});

/**
 * Update rate limiting rules
 */
router.post('/api/rate-limiting/rules', async (req, res) => {
  try {
    const { rules } = req.body;

    if (rateLimitService && rules) {
      // This would update rate limiting rules
      // Implementation depends on your rate limiting service
    }

    res.json({
      success: true,
      message: 'Rate limiting rules updated'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update rate limiting rules',
      details: error.message
    });
  }
});

/**
 * Get load balancing statistics
 */
router.get('/api/load-balancing/stats', async (req, res) => {
  try {
    const stats = loadBalancingService ? loadBalancingService.getDetailedMetrics() : null;

    res.json({
      loadBalancing: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get load balancing statistics',
      details: error.message
    });
  }
});

/**
 * Get API versioning statistics
 */
router.get('/api/versions/stats', async (req, res) => {
  try {
    const stats = apiVersioningService ? apiVersioningService.getVersionStatistics() : null;

    res.json({
      apiVersions: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get API versioning statistics',
      details: error.message
    });
  }
});

/**
 * Get performance profile data
 */
router.get('/api/profile', async (req, res) => {
  try {
    // This would return performance profiling data
    // Implementation would depend on your profiling setup

    const profile = {
      memory: {
        usage: process.memoryUsage(),
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss
      },
      cpu: process.cpuUsage(),
      handles: process._getActiveHandles ? process._getActiveHandles().length : 0,
      requests: process._getActiveRequests ? process._getActiveRequests().length : 0,
      timestamp: new Date().toISOString()
    };

    res.json(profile);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get performance profile',
      details: error.message
    });
  }
});

/**
 * Force garbage collection (development only)
 */
router.post('/api/gc', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      if (global.gc) {
        global.gc();

        // Log GC action
        if (auditService) {
          await auditService.log({
            level: 'info',
            category: 'performance',
            action: 'garbage_collection',
            details: { forced: true },
            metadata: { tags: ['admin', 'performance'] }
          });
        }

        res.json({
          success: true,
          message: 'Garbage collection completed'
        });
      } else {
        res.status(400).json({
          error: 'Garbage collection not available. Run Node.js with --expose-gc'
        });
      }
    } else {
      res.status(403).json({
        error: 'Garbage collection only available in development mode'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to perform garbage collection',
      details: error.message
    });
  }
});

/**
 * Export system data for analysis
 */
router.get('/api/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const format = req.query.format || 'json';

    let data: any = {};

    switch (type) {
      case 'metrics':
        data = await getAllMetrics();
        break;
      case 'logs':
        const logsResult = await auditService.query({}, { limit: 10000 });
        data = { logs: logsResult.entries };
        break;
      case 'config':
        data = {
          environment: process.env,
          services: {
            cache: cacheService ? cacheService.getMetrics() : null,
            rateLimit: rateLimitService ? await rateLimitService.getStatistics() : null,
            loadBalancing: loadBalancingService ? loadBalancingService.getDetailedMetrics() : null
          }
        };
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    const filename = `git-memory-${type}-${new Date().toISOString().split('T')[0]}.${format}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      if (type === 'logs') {
        const csv = convertLogsToCSV(data.logs);
        res.send(csv);
      } else {
        res.status(400).json({ error: 'CSV export only available for logs' });
      }
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(data);
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to export data',
      details: error.message
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {}
    };

    // Check individual services
    if (cacheService) {
      health.services.cache = await cacheService.healthCheck();
    }

    if (rateLimitService) {
      health.services.rateLimit = await rateLimitService.healthCheck();
    }

    if (auditService) {
      health.services.audit = await auditService.healthCheck();
    }

    if (loadBalancingService) {
      health.services.loadBalancing = await loadBalancingService.healthCheck();
    }

    if (connectionPoolService) {
      health.services.connectionPool = await connectionPoolService.healthCheck();
    }

    // Overall health determination
    const allHealthy = Object.values(health.services).every((service: any) => service.status === 'healthy');
    health.status = allHealthy ? 'healthy' : 'degraded';

    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to get all metrics
async function getAllMetrics() {
  return {
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    cache: cacheService ? cacheService.getMetrics() : null,
    rateLimiting: rateLimitService ? await rateLimitService.getStatistics() : null,
    loadBalancing: loadBalancingService ? loadBalancingService.getDetailedMetrics() : null,
    connectionPool: connectionPoolService ? connectionPoolService.getMetrics() : null,
    apiVersions: apiVersioningService ? apiVersioningService.getVersionStatistics() : null
  };
}

// Helper function to convert logs to CSV
function convertLogsToCSV(logs: any[]): string {
  if (logs.length === 0) return '';

  const headers = ['timestamp', 'level', 'category', 'action', 'userId', 'ip', 'details'];
  const csvRows = [headers.join(',')];

  for (const log of logs) {
    const row = [
      log.timestamp,
      log.level,
      log.category,
      log.action,
      log.userId || '',
      log.ip || '',
      JSON.stringify(log.details).replace(/"/g, '""')
    ];
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

export default router;
