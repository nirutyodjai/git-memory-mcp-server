/**
 * Distributed Memory Service
 * รองรับการจัดการ distributed memory แบบ MCP
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const logger = require('../utils/logger');

class DistributedMemoryService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = config;
    this.type = 'distributed-memory';
    this.id = config.id || `distributed-memory-${crypto.randomUUID()}`;
    
    // Connection settings
    this.endpoint = config.endpoint || 'http://localhost:8080';
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    
    // Health and status
    this.isConnected = false;
    this.lastError = null;
    this.connectionCount = 0;
    
    // Memory storage
    this.memoryNodes = new Map();
    this.memoryIndex = new Map();
    this.replicationFactor = config.replicationFactor || 2;
    
    // Performance metrics
    this.requestCount = 0;
    this.errorCount = 0;
    this.averageResponseTime = 0;
    
    logger.info(`DistributedMemoryService initialized with endpoint: ${this.endpoint}`);
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      logger.info(`Initializing DistributedMemoryService ${this.id}...`);
      
      // Setup memory nodes
      await this.setupMemoryNodes();
      
      // Test connection if endpoint provided
      if (this.endpoint) {
        await this.testConnection();
      }
      
      this.isConnected = true;
      this.emit('initialized', { serviceId: this.id });
      
      logger.info(`DistributedMemoryService ${this.id} initialized successfully`);
      return true;
      
    } catch (error) {
      this.lastError = error;
      logger.error(`Failed to initialize DistributedMemoryService ${this.id}:`, error);
      throw error;
    }
  }

  /**
   * Test connection to distributed memory system
   */
  async testConnection() {
    const startTime = Date.now();
    
    try {
      // Simulate connection test - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      logger.debug(`DistributedMemoryService connection test successful in ${responseTime}ms`);
      return true;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      
      logger.error(`DistributedMemoryService connection test failed:`, error);
      throw error;
    }
  }

  /**
   * Setup memory nodes for distributed storage
   */
  async setupMemoryNodes() {
    const nodeCount = this.config.nodeCount || 3;
    
    for (let i = 0; i < nodeCount; i++) {
      const nodeId = `node-${i}`;
      this.memoryNodes.set(nodeId, {
        id: nodeId,
        status: 'healthy',
        memoryUsage: 0,
        lastSync: new Date(),
        data: new Map()
      });
    }
    
    logger.info(`Setup ${nodeCount} distributed memory nodes`);
  }

  /**
   * Store data in distributed memory
   */
  async storeMemory(key, value, options = {}) {
    const startTime = Date.now();
    
    try {
      // Hash-based node selection
      const targetNodes = this.selectNodes(key, this.replicationFactor);
      
      // Store in multiple nodes for redundancy
      const promises = targetNodes.map(nodeId => {
        const node = this.memoryNodes.get(nodeId);
        if (node) {
          node.data.set(key, {
            value,
            timestamp: new Date(),
            metadata: options.metadata || {}
          });
          node.memoryUsage++;
        }
      });
      
      await Promise.all(promises);
      
      // Update index
      this.memoryIndex.set(key, {
        nodes: targetNodes,
        lastUpdate: new Date(),
        size: JSON.stringify(value).length
      });
      
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      logger.debug(`Stored memory key '${key}' in ${targetNodes.length} nodes`);
      
      return {
        success: true,
        key,
        nodes: targetNodes,
        responseTime
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      
      logger.error(`Failed to store memory key '${key}':`, error);
      throw error;
    }
  }

  /**
   * Retrieve data from distributed memory
   */
  async retrieveMemory(key, options = {}) {
    const startTime = Date.now();
    
    try {
      const indexEntry = this.memoryIndex.get(key);
      if (!indexEntry) {
        throw new Error(`Memory key '${key}' not found`);
      }
      
      // Try to retrieve from available nodes
      for (const nodeId of indexEntry.nodes) {
        const node = this.memoryNodes.get(nodeId);
        if (node && node.status === 'healthy' && node.data.has(key)) {
          const data = node.data.get(key);
          
          const responseTime = Date.now() - startTime;
          this.updateMetrics(responseTime, false);
          
          logger.debug(`Retrieved memory key '${key}' from node ${nodeId}`);
          
          return {
            success: true,
            key,
            value: data.value,
            metadata: data.metadata,
            timestamp: data.timestamp,
            sourceNode: nodeId,
            responseTime
          };
        }
      }
      
      throw new Error(`Memory key '${key}' not available in any healthy node`);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      
      logger.error(`Failed to retrieve memory key '${key}':`, error);
      throw error;
    }
  }

  /**
   * Delete data from distributed memory
   */
  async deleteMemory(key) {
    const startTime = Date.now();
    
    try {
      const indexEntry = this.memoryIndex.get(key);
      if (!indexEntry) {
        return { success: true, key, message: 'Key already deleted' };
      }
      
      // Delete from all nodes
      const promises = indexEntry.nodes.map(nodeId => {
        const node = this.memoryNodes.get(nodeId);
        if (node && node.data.has(key)) {
          node.data.delete(key);
          node.memoryUsage = Math.max(0, node.memoryUsage - 1);
        }
      });
      
      await Promise.all(promises);
      
      // Remove from index
      this.memoryIndex.delete(key);
      
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      logger.debug(`Deleted memory key '${key}' from distributed storage`);
      
      return {
        success: true,
        key,
        responseTime
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      
      logger.error(`Failed to delete memory key '${key}':`, error);
      throw error;
    }
  }

  /**
   * Remember data with optional TTL and tags (high-level API)
   */
  async remember(key, value, options = {}) {
    const startTime = Date.now();
    try {
      const ttlMs = options.ttlMs || (options.ttlSeconds ? options.ttlSeconds * 1000 : null);
      const expireAt = ttlMs ? new Date(Date.now() + ttlMs) : null;
      const tags = Array.isArray(options.tags) ? options.tags : (options.tags ? [options.tags] : []);

      // Merge metadata to carry TTL/tags information down to nodes
      const metadata = {
        ...(options.metadata || {}),
        tags,
        expireAt
      };

      const result = await this.storeMemory(key, value, { metadata });

      // Enrich index entry with TTL/tags
      const idx = this.memoryIndex.get(key) || {};
      if (tags && tags.length) idx.tags = tags;
      if (expireAt) idx.expireAt = expireAt;
      // Ensure we keep existing fields
      this.memoryIndex.set(key, {
        nodes: idx.nodes || (result.nodes || []),
        lastUpdate: new Date(),
        size: JSON.stringify(value).length,
        tags: idx.tags || tags || [],
        expireAt: idx.expireAt || expireAt || null
      });

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);

      return {
        ...result,
        tags,
        expireAt
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      logger.error(`Failed to remember key '${key}':`, error);
      throw error;
    }
  }

  /**
   * Recall data honoring TTL semantics (throws if expired)
   */
  async recall(key, options = {}) {
    const startTime = Date.now();
    try {
      const entry = this.memoryIndex.get(key);
      if (!entry) {
        throw new Error(`Memory key '${key}' not found`);
      }
      if (entry.expireAt && new Date(entry.expireAt).getTime() <= Date.now()) {
        // Auto-clean expired entry
        await this.deleteMemory(key);
        throw new Error(`Memory key '${key}' expired`);
      }
      const res = await this.retrieveMemory(key, options);
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      return res;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      logger.error(`Failed to recall key '${key}':`, error);
      throw error;
    }
  }

  /**
   * List keys with optional filtering (prefix, pattern, tags), sorting and pagination
   */
  async listKeys(options = {}) {
    const startTime = Date.now();
    try {
      const {
        prefix,
        pattern,
        tags,
        includeExpired = false,
        sortBy = 'key', // key | size | lastUpdate
        order = 'asc',
        limit,
        offset = 0
      } = options || {};

      const now = Date.now();
      let items = Array.from(this.memoryIndex.entries()).map(([key, meta]) => ({ key, meta }));

      if (prefix) {
        items = items.filter(it => it.key.startsWith(prefix));
      }

      if (pattern) {
        let regex = null;
        try {
          regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
        } catch (e) {
          // ignore invalid pattern
        }
        if (regex) items = items.filter(it => regex.test(it.key));
      }

      if (Array.isArray(tags) && tags.length) {
        items = items.filter(it => Array.isArray(it.meta.tags) && tags.every(t => it.meta.tags.includes(t)));
      }

      if (!includeExpired) {
        items = items.filter(it => !it.meta.expireAt || new Date(it.meta.expireAt).getTime() > now);
      }

      // Sorting
      items.sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'size') cmp = (a.meta.size || 0) - (b.meta.size || 0);
        else if (sortBy === 'lastUpdate') cmp = new Date(a.meta.lastUpdate || 0) - new Date(b.meta.lastUpdate || 0);
        else cmp = a.key.localeCompare(b.key);
        return order === 'desc' ? -cmp : cmp;
      });

      const sliced = typeof limit === 'number' ? items.slice(offset, offset + limit) : items.slice(offset);

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);

      return {
        success: true,
        count: sliced.length,
        total: items.length,
        keys: sliced.map(it => it.key)
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      logger.error('Failed to list keys:', error);
      throw error;
    }
  }

  /**
   * Create a snapshot of current distributed memory
   */
  async snapshot(options = {}) {
    const startTime = Date.now();
    try {
      const { includeValues = false, keys } = options;
      const selectedKeys = Array.isArray(keys) && keys.length ? keys : Array.from(this.memoryIndex.keys());

      const items = [];
      for (const key of selectedKeys) {
        const meta = this.memoryIndex.get(key);
        if (!meta) continue;
        const item = { key, meta };
        if (includeValues) {
          // Try to read directly from a healthy node without extra network overhead
          const nodeId = (meta.nodes || []).find(nid => {
            const n = this.memoryNodes.get(nid);
            return n && n.status === 'healthy' && n.data.has(key);
          });
          if (nodeId) {
            const node = this.memoryNodes.get(nodeId);
            const data = node.data.get(key);
            item.value = data?.value;
          } else {
            // Fallback
            try {
              const res = await this.retrieveMemory(key);
              item.value = res.value;
            } catch (_) {}
          }
        }
        items.push(item);
      }

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);

      return {
        success: true,
        createdAt: new Date().toISOString(),
        nodeCount: this.memoryNodes.size,
        totalKeys: this.memoryIndex.size,
        items
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      logger.error('Failed to create snapshot:', error);
      throw error;
    }
  }

  /**
   * Replicate keys to another DistributedMemoryService-like target
   */
  async replicateTo(params = {}) {
    const startTime = Date.now();
    try {
      const { targetService, keys, overwrite = true } = params;
      if (!targetService || (typeof targetService !== 'object')) {
        throw new Error('replicateTo requires a valid targetService instance');
      }

      const canRemember = typeof targetService.remember === 'function';
      const canStore = typeof targetService.storeMemory === 'function';
      if (!canRemember && !canStore) {
        throw new Error('Target service does not support remember/storeMemory');
      }

      const selectedKeys = Array.isArray(keys) && keys.length ? keys : Array.from(this.memoryIndex.keys());
      const report = { success: 0, failed: 0, total: selectedKeys.length, details: [] };

      for (const key of selectedKeys) {
        try {
          const meta = this.memoryIndex.get(key);
          if (!meta) continue;
          if (!overwrite && (targetService.memoryIndex?.has?.(key))) {
            report.details.push({ key, status: 'skipped' });
            continue;
          }
          const read = await this.retrieveMemory(key);
          const tags = Array.isArray(meta.tags) ? meta.tags : [];
          const ttlMs = meta.expireAt ? Math.max(0, new Date(meta.expireAt).getTime() - Date.now()) : null;

          if (canRemember) {
            await targetService.remember(key, read.value, { ttlMs, tags, metadata: { replicatedFrom: this.id } });
          } else {
            await targetService.storeMemory(key, read.value, { metadata: { ...read.metadata, replicatedFrom: this.id, tags, expireAt: meta.expireAt } });
          }
          report.success++;
          report.details.push({ key, status: 'ok' });
        } catch (e) {
          report.failed++;
          report.details.push({ key, status: 'error', error: e.message });
        }
      }

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      return { success: true, ...report };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      logger.error('Failed to replicate:', error);
      throw error;
    }
  }

  /**
   * Garbage collect expired or aged entries
   */
  async gc(options = {}) {
    const startTime = Date.now();
    try {
      const { now = Date.now(), maxAgeMs } = options;
      let removed = 0;
      const toDelete = [];

      for (const [key, meta] of this.memoryIndex.entries()) {
        const expired = meta.expireAt && new Date(meta.expireAt).getTime() <= now;
        const tooOld = maxAgeMs ? (new Date(meta.lastUpdate || 0).getTime() + maxAgeMs <= now) : false;
        if (expired || tooOld) toDelete.push(key);
      }

      for (const key of toDelete) {
        try {
          await this.deleteMemory(key);
          removed++;
        } catch (_) {}
      }

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      return { success: true, removed };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      logger.error('GC failed:', error);
      throw error;
    }
  }

  /**
   * Select nodes for data storage based on consistent hashing
   */
  selectNodes(key, count) {
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    const hashValue = parseInt(hash.substring(0, 8), 16);
    
    const nodeIds = Array.from(this.memoryNodes.keys()).filter(nodeId => {
      const node = this.memoryNodes.get(nodeId);
      return node && node.status === 'healthy';
    });
    
    if (nodeIds.length === 0) {
      throw new Error('No healthy nodes available');
    }
    
    // Simple selection based on hash
    const selectedNodes = [];
    for (let i = 0; i < Math.min(count, nodeIds.length); i++) {
      const index = (hashValue + i) % nodeIds.length;
      selectedNodes.push(nodeIds[index]);
    }
    
    return selectedNodes;
  }

  /**
   * Get service status
   */
  getStatus() {
    const totalNodes = this.memoryNodes.size;
    const healthyNodes = Array.from(this.memoryNodes.values())
      .filter(node => node.status === 'healthy').length;
    
    const totalMemory = Array.from(this.memoryNodes.values())
      .reduce((sum, node) => sum + node.memoryUsage, 0);
    
    return {
      id: this.id,
      type: this.type,
      endpoint: this.endpoint,
      isConnected: this.isConnected,
      lastError: this.lastError?.message,
      nodes: {
        total: totalNodes,
        healthy: healthyNodes,
        status: healthyNodes === totalNodes ? 'healthy' : 'degraded'
      },
      memory: {
        totalKeys: this.memoryIndex.size,
        totalMemoryUsage: totalMemory,
        averageMemoryPerNode: totalNodes > 0 ? Math.round(totalMemory / totalNodes) : 0
      },
      performance: {
        requestCount: this.requestCount,
        errorCount: this.errorCount,
        errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) + '%' : '0%',
        averageResponseTime: Math.round(this.averageResponseTime) + 'ms'
      },
      config: {
        replicationFactor: this.replicationFactor,
        timeout: this.timeout,
        retryAttempts: this.retryAttempts
      }
    };
  }

  /**
   * Check service health
   */
  async checkHealth() {
    try {
      const healthyNodes = Array.from(this.memoryNodes.values())
        .filter(node => node.status === 'healthy').length;
      
      const isHealthy = this.isConnected && healthyNodes > 0;
      
      return {
        healthy: isHealthy,
        status: isHealthy ? 'healthy' : 'unhealthy',
        nodes: {
          healthy: healthyNodes,
          total: this.memoryNodes.size
        },
        lastCheck: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error(`Health check failed for DistributedMemoryService ${this.id}:`, error);
      return {
        healthy: false,
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Update performance metrics
   */
  updateMetrics(responseTime, isError) {
    this.requestCount++;
    if (isError) {
      this.errorCount++;
    }
    
    // Update average response time
    this.averageResponseTime = 
      (this.averageResponseTime * (this.requestCount - 1) + responseTime) / this.requestCount;
  }

  /**
   * Handle MCP request
   */
  async handleRequest(request) {
    const startTime = Date.now();
    
    try {
      const { method, params } = request;
      
      switch (method) {
        case 'memory/store':
          return await this.storeMemory(params.key, params.value, params.options);
          
        case 'memory/retrieve':
          return await this.retrieveMemory(params.key, params.options);
          
        case 'memory/delete':
          return await this.deleteMemory(params.key);
          
        case 'memory/status':
          return this.getStatus();
          
        case 'memory/health':
          return await this.checkHealth();

        // High-level operations
        case 'memory/remember':
          return await this.remember(params.key, params.value, params.options);

        case 'memory/recall':
          return await this.recall(params.key, params.options);

        case 'memory/listKeys':
          return await this.listKeys(params);

        case 'memory/snapshot':
          return await this.snapshot(params);

        case 'memory/replicate':
          return await this.replicateTo(params);

        case 'memory/gc':
          return await this.gc(params);
          
        default:
          throw new Error(`Unknown method: ${method}`);
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      
      logger.error(`Failed to handle request ${request.method}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      logger.info(`Cleaning up DistributedMemoryService ${this.id}...`);
      
      // Clear memory data
      for (const node of this.memoryNodes.values()) {
        node.data.clear();
      }
      this.memoryNodes.clear();
      this.memoryIndex.clear();
      
      this.isConnected = false;
      this.emit('cleanup', { serviceId: this.id });
      
      logger.info(`DistributedMemoryService ${this.id} cleanup completed`);
      
    } catch (error) {
      logger.error(`Error during DistributedMemoryService cleanup:`, error);
      throw error;
    }
  }
}

module.exports = DistributedMemoryService;