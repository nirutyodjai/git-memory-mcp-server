/**
 * Multi-System Routes
 * API endpoints สำหรับจัดการ MCP Multi-System operations
 */

const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
const MCPMultiSystemIntegration = require('../integration/MCPMultiSystemIntegration');
const MultiSystemMiddleware = require('../middleware/multiSystemMiddleware');

class MultiSystemRoutes {
  constructor(integration, middleware) {
    this.integration = integration;
    this.middleware = middleware;
    this.router = express.Router();
    
    this.setupRoutes();
  }

  /**
   * Setup all multi-system routes
   */
  setupRoutes() {
    // System management routes
    this.router.get('/systems', this.getSystems.bind(this));
    this.router.get('/systems/:systemId', this.getSystem.bind(this));
    this.router.post('/systems/:systemId/register', this.registerSystem.bind(this));
    this.router.delete('/systems/:systemId', this.unregisterSystem.bind(this));
    
    // System health routes
    this.router.get('/systems/:systemId/health', this.getSystemHealth.bind(this));
    this.router.get('/health', this.getOverallHealth.bind(this));
    
    // Request routing routes
    this.router.post('/route', this.routeRequest.bind(this));
    this.router.post('/broadcast', this.broadcastRequest.bind(this));
    this.router.post('/batch', this.batchRequest.bind(this));
    
    // Performance and metrics routes
    this.router.get('/metrics', this.getMetrics.bind(this));
    this.router.get('/performance', this.getPerformanceMetrics.bind(this));
    this.router.post('/metrics/reset', this.resetMetrics.bind(this));
    
    // Configuration routes
    this.router.get('/config', this.getConfiguration.bind(this));
    this.router.post('/config/reload', this.reloadConfiguration.bind(this));
    
    // Load balancing routes
    this.router.get('/load-balancing', this.getLoadBalancingStatus.bind(this));
    this.router.post('/load-balancing/rebalance', this.rebalanceSystems.bind(this));
    
    // Cache management routes
    this.router.get('/cache', this.getCacheStatus.bind(this));
    this.router.post('/cache/clear', this.clearCache.bind(this));
    this.router.post('/cache/clear/:systemId', this.clearSystemCache.bind(this));
    
    // System discovery routes
    this.router.get('/discovery', this.discoverSystems.bind(this));
    this.router.post('/discovery/scan', this.scanForSystems.bind(this));
    
    // Integration status routes
    this.router.get('/status', this.getIntegrationStatus.bind(this));
    this.router.get('/status/detailed', this.getDetailedStatus.bind(this));
  }

  /**
   * Get all registered systems
   */
  async getSystems(req, res) {
    try {
      const status = this.integration.getIntegrationStatus();
      
      res.json({
        success: true,
        data: {
          totalSystems: status.systems.totalSystems,
          healthySystems: status.systems.healthySystems,
          systems: status.systems.systems
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to get systems', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve systems',
        message: error.message
      });
    }
  }

  /**
   * Get specific system information
   */
  async getSystem(req, res) {
    try {
      const { systemId } = req.params;
      const status = this.integration.getIntegrationStatus();
      
      const system = status.systems.systems[systemId];
      if (!system) {
        return res.status(404).json({
          success: false,
          error: 'System not found',
          message: `System '${systemId}' is not registered`
        });
      }
      
      res.json({
        success: true,
        data: {
          systemId,
          ...system
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to get system', {
        requestId: req.requestId,
        systemId: req.params.systemId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve system',
        message: error.message
      });
    }
  }

  /**
   * Register a new system
   */
  async registerSystem(req, res) {
    try {
      const { systemId } = req.params;
      const systemConfig = req.body;
      
      // Validate system configuration
      if (!systemConfig.type) {
        return res.status(400).json({
          success: false,
          error: 'Invalid configuration',
          message: 'System type is required'
        });
      }
      
      await this.integration.registerSystem(systemId, systemConfig);
      
      // Register route in middleware
      this.middleware.registerSystemRoute(systemId, {
        type: systemConfig.type,
        endpoint: systemConfig.endpoint,
        priority: systemConfig.priority || 1
      });
      
      logger.info('System registered via API', {
        requestId: req.requestId,
        systemId,
        type: systemConfig.type
      });
      
      res.status(201).json({
        success: true,
        message: `System '${systemId}' registered successfully`,
        data: {
          systemId,
          type: systemConfig.type,
          registeredAt: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('Failed to register system', {
        requestId: req.requestId,
        systemId: req.params.systemId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to register system',
        message: error.message
      });
    }
  }

  /**
   * Unregister a system
   */
  async unregisterSystem(req, res) {
    try {
      const { systemId } = req.params;
      
      await this.integration.multiSystemManager.unregisterSystem(systemId);
      
      // Unregister route from middleware
      this.middleware.unregisterSystemRoute(systemId);
      
      logger.info('System unregistered via API', {
        requestId: req.requestId,
        systemId
      });
      
      res.json({
        success: true,
        message: `System '${systemId}' unregistered successfully`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to unregister system', {
        requestId: req.requestId,
        systemId: req.params.systemId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to unregister system',
        message: error.message
      });
    }
  }

  /**
   * Get system health
   */
  async getSystemHealth(req, res) {
    try {
      const { systemId } = req.params;
      
      const health = await this.integration.multiSystemManager.checkSystemHealth(systemId);
      
      res.json({
        success: true,
        data: {
          systemId,
          ...health,
          checkedAt: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('Failed to get system health', {
        requestId: req.requestId,
        systemId: req.params.systemId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to check system health',
        message: error.message
      });
    }
  }

  /**
   * Get overall health
   */
  async getOverallHealth(req, res) {
    try {
      const status = this.integration.getIntegrationStatus();
      
      const healthStatus = {
        overall: status.systems.healthySystems === status.systems.totalSystems ? 'healthy' : 'degraded',
        totalSystems: status.systems.totalSystems,
        healthySystems: status.systems.healthySystems,
        unhealthySystems: status.systems.totalSystems - status.systems.healthySystems,
        integration: {
          initialized: status.integration.initialized,
          running: status.integration.running,
          uptime: status.metrics.uptime
        },
        performance: {
          averageResponseTime: status.metrics.averageResponseTime,
          successRate: status.metrics.successRate,
          totalRequests: status.metrics.totalRequests
        }
      };
      
      const httpStatus = healthStatus.overall === 'healthy' ? 200 : 503;
      
      res.status(httpStatus).json({
        success: true,
        data: healthStatus,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to get overall health', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to check overall health',
        message: error.message
      });
    }
  }

  /**
   * Route request to appropriate system
   */
  async routeRequest(req, res) {
    try {
      const { targetSystem, request, options = {} } = req.body;
      
      if (!request) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Request body is required'
        });
      }
      
      const routingOptions = {
        targetSystems: targetSystem ? [targetSystem] : undefined,
        strategy: options.strategy || 'round-robin',
        timeout: options.timeout || 30000,
        retries: options.retries || 0
      };
      
      const result = await this.integration.multiSystemManager.routeRequest(request, routingOptions);
      
      res.json({
        success: true,
        data: result,
        routing: {
          targetSystem: result.systemId,
          strategy: routingOptions.strategy,
          responseTime: result.responseTime
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to route request', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to route request',
        message: error.message
      });
    }
  }

  /**
   * Broadcast request to multiple systems
   */
  async broadcastRequest(req, res) {
    try {
      const { request, targetSystems, options = {} } = req.body;
      
      if (!request) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Request body is required'
        });
      }
      
      const broadcastOptions = {
        targetSystems,
        timeout: options.timeout || 30000,
        failFast: options.failFast || false,
        aggregateResults: options.aggregateResults !== false
      };
      
      const results = await this.integration.multiSystemManager.broadcastRequest(request, broadcastOptions);
      
      res.json({
        success: true,
        data: results,
        broadcast: {
          totalSystems: results.length,
          successfulSystems: results.filter(r => r.success).length,
          failedSystems: results.filter(r => !r.success).length
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to broadcast request', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to broadcast request',
        message: error.message
      });
    }
  }

  /**
   * Process batch requests
   */
  async batchRequest(req, res) {
    try {
      const { requests, options = {} } = req.body;
      
      if (!Array.isArray(requests) || requests.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Requests array is required and must not be empty'
        });
      }
      
      const batchOptions = {
        concurrency: options.concurrency || 5,
        timeout: options.timeout || 30000,
        failFast: options.failFast || false
      };
      
      const results = await this.integration.multiSystemManager.processBatchRequests(requests, batchOptions);
      
      res.json({
        success: true,
        data: results,
        batch: {
          totalRequests: requests.length,
          successfulRequests: results.filter(r => r.success).length,
          failedRequests: results.filter(r => !r.success).length,
          concurrency: batchOptions.concurrency
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to process batch request', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to process batch request',
        message: error.message
      });
    }
  }

  /**
   * Get metrics
   */
  async getMetrics(req, res) {
    try {
      const integrationStatus = this.integration.getIntegrationStatus();
      const middlewareMetrics = this.middleware.getMetrics();
      
      // Get MonitoringService metrics if available
      let monitoringMetrics = null;
      let prometheusMetrics = null;
      
      if (this.integration.multiSystemManager && this.integration.multiSystemManager.monitoringService) {
        const monitoringService = this.integration.multiSystemManager.monitoringService;
        
        // Get monitoring data
        monitoringMetrics = {
          systemHealth: monitoringService.getSystemHealth(),
          allServersStatus: monitoringService.getAllServersStatus(),
          activeAlerts: monitoringService.getActiveAlerts()
        };
        
        // Get Prometheus metrics if enabled
        prometheusMetrics = monitoringService.getPrometheusMetrics();
      }
      
      const metrics = {
        integration: integrationStatus.metrics,
        middleware: middlewareMetrics,
        systems: integrationStatus.systems,
        monitoring: monitoringMetrics,
        prometheus: prometheusMetrics,
        timestamp: new Date().toISOString()
      };
      
      // If client requests Prometheus format
      if (req.headers.accept === 'text/plain' || req.query.format === 'prometheus') {
        if (prometheusMetrics) {
          res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
          res.send(prometheusMetrics);
        } else {
          res.status(501).json({
            success: false,
            error: 'Prometheus metrics not enabled'
          });
        }
        return;
      }
      
      res.json({
        success: true,
        data: metrics
      });
      
    } catch (error) {
      logger.error('Failed to get metrics', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve metrics',
        message: error.message
      });
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(req, res) {
    try {
      const performance = await this.integration.multiSystemManager.getPerformanceMetrics();
      
      res.json({
        success: true,
        data: performance,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to get performance metrics', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance metrics',
        message: error.message
      });
    }
  }

  /**
   * Reset metrics
   */
  async resetMetrics(req, res) {
    try {
      // Reset manager and middleware metrics
      await this.integration.multiSystemManager.resetMetrics();
      this.middleware.resetMetrics();
      
      // Reset MonitoringService metrics if available
      if (this.integration.multiSystemManager && this.integration.multiSystemManager.monitoringService) {
        await this.integration.multiSystemManager.monitoringService.resetMetrics();
      }
      
      logger.info('Metrics reset via API', {
        requestId: req.requestId,
        components: ['multiSystemManager', 'middleware', 'monitoringService']
      });
      
      res.json({
        success: true,
        message: 'Metrics reset successfully',
        components: ['integration', 'middleware', 'monitoring'],
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to reset metrics', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to reset metrics',
        message: error.message
      });
    }
  }

  /**
   * Get configuration
   */
  async getConfiguration(req, res) {
    try {
      const status = this.integration.getIntegrationStatus();
      
      res.json({
        success: true,
        data: {
          configuration: status.configuration,
          configPath: this.integration.configPath,
          lastLoaded: this.integration.config ? new Date().toISOString() : null
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to get configuration', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve configuration',
        message: error.message
      });
    }
  }

  /**
   * Reload configuration
   */
  async reloadConfiguration(req, res) {
    try {
      await this.integration.reloadConfiguration();
      
      logger.info('Configuration reloaded via API', {
        requestId: req.requestId
      });
      
      res.json({
        success: true,
        message: 'Configuration reloaded successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to reload configuration', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to reload configuration',
        message: error.message
      });
    }
  }

  /**
   * Get load balancing status
   */
  async getLoadBalancingStatus(req, res) {
    try {
      const status = await this.integration.multiSystemManager.getLoadBalancingStatus();
      
      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to get load balancing status', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve load balancing status',
        message: error.message
      });
    }
  }

  /**
   * Rebalance systems
   */
  async rebalanceSystems(req, res) {
    try {
      await this.integration.multiSystemManager.rebalanceSystems();
      
      logger.info('Systems rebalanced via API', {
        requestId: req.requestId
      });
      
      res.json({
        success: true,
        message: 'Systems rebalanced successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to rebalance systems', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to rebalance systems',
        message: error.message
      });
    }
  }

  /**
   * Get cache status
   */
  async getCacheStatus(req, res) {
    try {
      const status = await this.integration.multiSystemManager.getCacheStatus();
      
      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to get cache status', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cache status',
        message: error.message
      });
    }
  }

  /**
   * Clear all cache
   */
  async clearCache(req, res) {
    try {
      await this.integration.multiSystemManager.clearCache();
      
      logger.info('Cache cleared via API', {
        requestId: req.requestId
      });
      
      res.json({
        success: true,
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to clear cache', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache',
        message: error.message
      });
    }
  }

  /**
   * Clear system-specific cache
   */
  async clearSystemCache(req, res) {
    try {
      const { systemId } = req.params;
      
      await this.integration.multiSystemManager.clearSystemCache(systemId);
      
      logger.info('System cache cleared via API', {
        requestId: req.requestId,
        systemId
      });
      
      res.json({
        success: true,
        message: `Cache for system '${systemId}' cleared successfully`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to clear system cache', {
        requestId: req.requestId,
        systemId: req.params.systemId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to clear system cache',
        message: error.message
      });
    }
  }

  /**
   * Discover systems
   */
  async discoverSystems(req, res) {
    try {
      const discovered = await this.integration.multiSystemManager.discoverSystems();
      
      res.json({
        success: true,
        data: {
          discoveredSystems: discovered,
          count: discovered.length
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to discover systems', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to discover systems',
        message: error.message
      });
    }
  }

  /**
   * Scan for systems
   */
  async scanForSystems(req, res) {
    try {
      const { networks, ports, timeout } = req.body;
      
      const scanOptions = {
        networks: networks || ['localhost'],
        ports: ports || [5500, 5501, 5502],
        timeout: timeout || 5000
      };
      
      const found = await this.integration.multiSystemManager.scanForSystems(scanOptions);
      
      res.json({
        success: true,
        data: {
          foundSystems: found,
          count: found.length,
          scanOptions
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to scan for systems', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to scan for systems',
        message: error.message
      });
    }
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(req, res) {
    try {
      const status = this.integration.getIntegrationStatus();
      
      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to get integration status', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve integration status',
        message: error.message
      });
    }
  }

  /**
   * Get detailed status
   */
  async getDetailedStatus(req, res) {
    try {
      const status = this.integration.getIntegrationStatus();
      const middlewareMetrics = this.middleware.getMetrics();
      const performance = await this.integration.multiSystemManager.getPerformanceMetrics();
      
      const detailedStatus = {
        ...status,
        middleware: middlewareMetrics,
        performance,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          memory: process.memoryUsage(),
          uptime: process.uptime()
        }
      };
      
      res.json({
        success: true,
        data: detailedStatus,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to get detailed status', {
        requestId: req.requestId,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve detailed status',
        message: error.message
      });
    }
  }

  /**
   * Get router instance
   * @returns {express.Router} Express router
   */
  getRouter() {
    return this.router;
  }
}

module.exports = MultiSystemRoutes;