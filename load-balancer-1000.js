const http = require('http');
const httpProxy = require('http-proxy');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class LoadBalancer1000 extends EventEmitter {
  constructor() {
    super();
    this.configPath = path.join(process.cwd(), 'mcp-coordinator-config.json');
    this.servers = new Map(); // serverId -> server info
    this.categories = new Map(); // category -> server pool
    this.healthChecks = new Map(); // serverId -> health status
    this.requestCounts = new Map(); // serverId -> request count
    this.proxy = httpProxy.createProxyServer({});
    this.port = 8080;
    this.maxServersPerCategory = 100;
    this.healthCheckInterval = 30000; // 30 seconds
    this.loadBalancingStrategy = 'round-robin'; // round-robin, least-connections, weighted
    this.circuitBreaker = new Map(); // serverId -> circuit breaker state
    
    this.setupProxyErrorHandling();
    this.startHealthChecks();
  }

  async loadConfiguration() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      // Clear existing data
      this.servers.clear();
      this.categories.clear();
      this.healthChecks.clear();
      this.requestCounts.clear();
      
      // Load servers from config
      if (config.mcpServers) {
        for (const server of config.mcpServers) {
          if (server.status === 'deployed') {
            this.addServer(server);
          }
        }
      }
      
      console.log(`🔄 Loaded ${this.servers.size} servers across ${this.categories.size} categories`);
      this.logCategoryDistribution();
      
    } catch (error) {
      console.error('❌ Failed to load configuration:', error.message);
      throw error;
    }
  }

  addServer(server) {
    const serverId = server.id;
    const category = server.category;
    
    // Add to servers map
    this.servers.set(serverId, {
      id: serverId,
      category: category,
      port: server.port,
      host: 'localhost',
      status: 'healthy',
      lastHealthCheck: Date.now(),
      weight: 1,
      connections: 0
    });
    
    // Add to category pool
    if (!this.categories.has(category)) {
      this.categories.set(category, {
        servers: [],
        roundRobinIndex: 0,
        totalWeight: 0
      });
    }
    
    const categoryPool = this.categories.get(category);
    categoryPool.servers.push(serverId);
    categoryPool.totalWeight += 1;
    
    // Initialize health check and request count
    this.healthChecks.set(serverId, { status: 'healthy', lastCheck: Date.now() });
    this.requestCounts.set(serverId, 0);
    
    // Initialize circuit breaker
    this.circuitBreaker.set(serverId, {
      state: 'closed', // closed, open, half-open
      failures: 0,
      lastFailure: 0,
      threshold: 5,
      timeout: 60000 // 1 minute
    });
  }

  logCategoryDistribution() {
    console.log('\n📊 Server Distribution by Category:');
    for (const [category, pool] of this.categories) {
      const healthyCount = pool.servers.filter(serverId => 
        this.healthChecks.get(serverId)?.status === 'healthy'
      ).length;
      console.log(`  ${category}: ${healthyCount}/${pool.servers.length} healthy servers`);
    }
    console.log('');
  }

  selectServer(category, strategy = this.loadBalancingStrategy) {
    const categoryPool = this.categories.get(category);
    if (!categoryPool || categoryPool.servers.length === 0) {
      return null;
    }

    // Filter healthy servers with closed circuit breakers
    const healthyServers = categoryPool.servers.filter(serverId => {
      const health = this.healthChecks.get(serverId);
      const circuit = this.circuitBreaker.get(serverId);
      return health?.status === 'healthy' && circuit?.state !== 'open';
    });

    if (healthyServers.length === 0) {
      return null;
    }

    let selectedServerId;
    
    switch (strategy) {
      case 'round-robin':
        selectedServerId = this.roundRobinSelection(categoryPool, healthyServers);
        break;
      case 'least-connections':
        selectedServerId = this.leastConnectionsSelection(healthyServers);
        break;
      case 'weighted':
        selectedServerId = this.weightedSelection(healthyServers);
        break;
      default:
        selectedServerId = healthyServers[0];
    }

    return this.servers.get(selectedServerId);
  }

  roundRobinSelection(categoryPool, healthyServers) {
    const index = categoryPool.roundRobinIndex % healthyServers.length;
    categoryPool.roundRobinIndex = (categoryPool.roundRobinIndex + 1) % healthyServers.length;
    return healthyServers[index];
  }

  leastConnectionsSelection(healthyServers) {
    return healthyServers.reduce((least, current) => {
      const leastServer = this.servers.get(least);
      const currentServer = this.servers.get(current);
      return currentServer.connections < leastServer.connections ? current : least;
    });
  }

  weightedSelection(healthyServers) {
    const totalWeight = healthyServers.reduce((sum, serverId) => {
      return sum + this.servers.get(serverId).weight;
    }, 0);
    
    let random = Math.random() * totalWeight;
    
    for (const serverId of healthyServers) {
      const server = this.servers.get(serverId);
      random -= server.weight;
      if (random <= 0) {
        return serverId;
      }
    }
    
    return healthyServers[0];
  }

  async handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (pathParts.length === 0) {
      return this.sendResponse(res, 200, {
        message: 'MCP Load Balancer for 1000 servers',
        totalServers: this.servers.size,
        categories: Array.from(this.categories.keys()),
        healthyServers: Array.from(this.healthChecks.entries())
          .filter(([_, health]) => health.status === 'healthy').length
      });
    }

    const category = pathParts[0];
    const server = this.selectServer(category);
    
    if (!server) {
      return this.sendResponse(res, 503, {
        error: 'No healthy servers available',
        category: category,
        availableCategories: Array.from(this.categories.keys())
      });
    }

    // Update connection count
    server.connections++;
    this.requestCounts.set(server.id, (this.requestCounts.get(server.id) || 0) + 1);

    // Proxy the request
    const target = `http://${server.host}:${server.port}`;
    
    req.on('close', () => {
      server.connections = Math.max(0, server.connections - 1);
    });

    this.proxy.web(req, res, {
      target: target,
      timeout: 30000,
      proxyTimeout: 30000
    }, (error) => {
      server.connections = Math.max(0, server.connections - 1);
      this.handleProxyError(error, server.id, req, res);
    });
  }

  handleProxyError(error, serverId, req, res) {
    console.error(`🔥 Proxy error for server ${serverId}:`, error.message);
    
    // Update circuit breaker
    const circuit = this.circuitBreaker.get(serverId);
    if (circuit) {
      circuit.failures++;
      circuit.lastFailure = Date.now();
      
      if (circuit.failures >= circuit.threshold) {
        circuit.state = 'open';
        console.warn(`⚡ Circuit breaker opened for server ${serverId}`);
      }
    }
    
    // Mark server as unhealthy
    this.healthChecks.set(serverId, {
      status: 'unhealthy',
      lastCheck: Date.now(),
      error: error.message
    });

    if (!res.headersSent) {
      this.sendResponse(res, 502, {
        error: 'Server unavailable',
        serverId: serverId,
        message: error.message
      });
    }
  }

  setupProxyErrorHandling() {
    this.proxy.on('error', (error, req, res) => {
      console.error('🔥 Proxy error:', error.message);
      if (!res.headersSent) {
        this.sendResponse(res, 500, {
          error: 'Internal proxy error',
          message: error.message
        });
      }
    });
  }

  async performHealthCheck(serverId) {
    const server = this.servers.get(serverId);
    if (!server) return;

    try {
      const response = await this.makeHealthCheckRequest(server);
      
      // Update health status
      this.healthChecks.set(serverId, {
        status: 'healthy',
        lastCheck: Date.now(),
        responseTime: response.responseTime
      });
      
      // Reset circuit breaker on successful health check
      const circuit = this.circuitBreaker.get(serverId);
      if (circuit && circuit.state === 'open') {
        const timeSinceLastFailure = Date.now() - circuit.lastFailure;
        if (timeSinceLastFailure > circuit.timeout) {
          circuit.state = 'half-open';
          circuit.failures = 0;
        }
      } else if (circuit && circuit.state === 'half-open') {
        circuit.state = 'closed';
        circuit.failures = 0;
      }
      
    } catch (error) {
      this.healthChecks.set(serverId, {
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: error.message
      });
    }
  }

  makeHealthCheckRequest(server) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const req = http.request({
        hostname: server.host,
        port: server.port,
        path: '/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        const responseTime = Date.now() - startTime;
        resolve({ statusCode: res.statusCode, responseTime });
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Health check timeout')));
      req.end();
    });
  }

  startHealthChecks() {
    setInterval(async () => {
      const healthCheckPromises = Array.from(this.servers.keys()).map(serverId => 
        this.performHealthCheck(serverId)
      );
      
      await Promise.allSettled(healthCheckPromises);
      
      // Log health status periodically
      if (Date.now() % (5 * 60 * 1000) < this.healthCheckInterval) { // Every 5 minutes
        this.logHealthStatus();
      }
    }, this.healthCheckInterval);
  }

  logHealthStatus() {
    const totalServers = this.servers.size;
    const healthyServers = Array.from(this.healthChecks.values())
      .filter(health => health.status === 'healthy').length;
    
    console.log(`💓 Health Check: ${healthyServers}/${totalServers} servers healthy`);
    
    // Log top requested servers
    const topServers = Array.from(this.requestCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    if (topServers.length > 0) {
      console.log('📈 Top 5 most requested servers:');
      topServers.forEach(([serverId, count]) => {
        console.log(`  ${serverId}: ${count} requests`);
      });
    }
  }

  sendResponse(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  async start() {
    await this.loadConfiguration();
    
    const server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });
    
    server.listen(this.port, () => {
      console.log(`🚀 Load Balancer started on port ${this.port}`);
      console.log(`📊 Managing ${this.servers.size} servers across ${this.categories.size} categories`);
      console.log(`🔄 Load balancing strategy: ${this.loadBalancingStrategy}`);
      console.log(`💓 Health check interval: ${this.healthCheckInterval}ms`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Shutting down load balancer...');
      server.close(() => {
        console.log('✅ Load balancer stopped');
        process.exit(0);
      });
    });
  }

  // API endpoints for monitoring
  getStats() {
    return {
      totalServers: this.servers.size,
      categories: Object.fromEntries(
        Array.from(this.categories.entries()).map(([category, pool]) => [
          category,
          {
            total: pool.servers.length,
            healthy: pool.servers.filter(serverId => 
              this.healthChecks.get(serverId)?.status === 'healthy'
            ).length
          }
        ])
      ),
      requestCounts: Object.fromEntries(this.requestCounts),
      healthStatus: Object.fromEntries(this.healthChecks),
      circuitBreakers: Object.fromEntries(
        Array.from(this.circuitBreaker.entries()).map(([serverId, circuit]) => [
          serverId,
          { state: circuit.state, failures: circuit.failures }
        ])
      )
    };
  }
}

// Start the load balancer if this file is run directly
if (require.main === module) {
  const loadBalancer = new LoadBalancer1000();
  loadBalancer.start().catch(error => {
    console.error('❌ Failed to start load balancer:', error);
    process.exit(1);
  });
}

module.exports = LoadBalancer1000;