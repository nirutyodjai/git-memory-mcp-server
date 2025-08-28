const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const EventEmitter = require('events');
const os = require('os');

class MonitoringSystem1000 extends EventEmitter {
  constructor() {
    super();
    this.configPath = path.join(process.cwd(), 'mcp-coordinator-config.json');
    this.logsPath = path.join(process.cwd(), 'monitoring-logs');
    this.servers = new Map(); // serverId -> server info
    this.metrics = new Map(); // serverId -> metrics
    this.alerts = new Map(); // alertId -> alert info
    this.healthChecks = new Map(); // serverId -> health status
    this.performanceData = new Map(); // serverId -> performance history
    
    // Configuration
    this.monitoringInterval = 30000; // 30 seconds
    this.healthCheckTimeout = 5000; // 5 seconds
    this.alertThresholds = {
      responseTime: 5000, // 5 seconds
      errorRate: 0.05, // 5%
      memoryUsage: 0.8, // 80%
      cpuUsage: 0.9, // 90%
      diskUsage: 0.85 // 85%
    };
    
    this.dashboardPort = 9090;
    this.maxHistoryPoints = 1440; // 24 hours at 1-minute intervals
    this.alertRetentionDays = 7;
    
    this.initializeMonitoring();
  }

  async initialize() {
    try {
      // Create logs directory
      await fs.mkdir(this.logsPath, { recursive: true });
      
      // Load server configuration
      await this.loadServerConfiguration();
      
      // Initialize metrics for all servers
      await this.initializeMetrics();
      
      // Start monitoring processes
      this.startHealthChecks();
      this.startPerformanceMonitoring();
      this.startAlertSystem();
      this.startDashboard();
      
      console.log(`📊 Monitoring System initialized for ${this.servers.size} servers`);
      console.log(`🚨 Alert thresholds configured`);
      console.log(`📈 Dashboard available at http://localhost:${this.dashboardPort}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Monitoring System:', error.message);
      throw error;
    }
  }

  async loadServerConfiguration() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      this.servers.clear();
      
      if (config.mcpServers) {
        for (const server of config.mcpServers) {
          if (server.status === 'deployed') {
            this.registerServer(server);
          }
        }
      }
      
      console.log(`📋 Loaded ${this.servers.size} servers for monitoring`);
      
    } catch (error) {
      console.error('❌ Failed to load server configuration:', error.message);
      throw error;
    }
  }

  registerServer(server) {
    const serverId = server.id;
    
    this.servers.set(serverId, {
      id: serverId,
      category: server.category,
      port: server.port,
      host: 'localhost',
      status: server.status,
      createdAt: server.createdAt || new Date().toISOString(),
      lastSeen: new Date().toISOString()
    });
    
    // Initialize metrics
    this.metrics.set(serverId, {
      uptime: 0,
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      lastResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      diskUsage: 0,
      networkIn: 0,
      networkOut: 0,
      lastUpdated: Date.now()
    });
    
    // Initialize health status
    this.healthChecks.set(serverId, {
      status: 'unknown',
      lastCheck: Date.now(),
      consecutiveFailures: 0,
      totalChecks: 0,
      successRate: 0
    });
    
    // Initialize performance history
    this.performanceData.set(serverId, {
      responseTime: [],
      errorRate: [],
      memoryUsage: [],
      cpuUsage: [],
      requestRate: []
    });
  }

  async initializeMetrics() {
    console.log('📊 Initializing metrics collection...');
    
    // Create metrics files for each category
    const categories = new Set(Array.from(this.servers.values()).map(s => s.category));
    
    for (const category of categories) {
      const categoryDir = path.join(this.logsPath, category);
      await fs.mkdir(categoryDir, { recursive: true });
      
      const metricsFile = path.join(categoryDir, 'metrics.json');
      const initialMetrics = {
        category: category,
        servers: Array.from(this.servers.values())
          .filter(s => s.category === category)
          .map(s => s.id),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeFile(metricsFile, JSON.stringify(initialMetrics, null, 2));
    }
  }

  initializeMonitoring() {
    // Set up event listeners
    this.on('serverDown', (serverId) => {
      this.handleServerDown(serverId);
    });
    
    this.on('serverUp', (serverId) => {
      this.handleServerUp(serverId);
    });
    
    this.on('highResponseTime', (serverId, responseTime) => {
      this.createAlert('high_response_time', serverId, {
        responseTime: responseTime,
        threshold: this.alertThresholds.responseTime
      });
    });
    
    this.on('highErrorRate', (serverId, errorRate) => {
      this.createAlert('high_error_rate', serverId, {
        errorRate: errorRate,
        threshold: this.alertThresholds.errorRate
      });
    });
  }

  startHealthChecks() {
    setInterval(async () => {
      const healthCheckPromises = Array.from(this.servers.keys()).map(serverId => 
        this.performHealthCheck(serverId)
      );
      
      await Promise.allSettled(healthCheckPromises);
      
      // Log health summary every 5 minutes
      if (Date.now() % (5 * 60 * 1000) < this.monitoringInterval) {
        this.logHealthSummary();
      }
    }, this.monitoringInterval);
  }

  async performHealthCheck(serverId) {
    const server = this.servers.get(serverId);
    const healthCheck = this.healthChecks.get(serverId);
    
    if (!server || !healthCheck) return;

    const startTime = Date.now();
    
    try {
      const response = await this.makeHealthRequest(server);
      const responseTime = Date.now() - startTime;
      
      // Update health status
      healthCheck.status = 'healthy';
      healthCheck.lastCheck = Date.now();
      healthCheck.consecutiveFailures = 0;
      healthCheck.totalChecks++;
      healthCheck.successRate = ((healthCheck.totalChecks - healthCheck.consecutiveFailures) / healthCheck.totalChecks) * 100;
      
      // Update metrics
      const metrics = this.metrics.get(serverId);
      if (metrics) {
        metrics.lastResponseTime = responseTime;
        metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2;
        metrics.lastUpdated = Date.now();
        
        // Check for performance alerts
        if (responseTime > this.alertThresholds.responseTime) {
          this.emit('highResponseTime', serverId, responseTime);
        }
      }
      
      // Update performance history
      this.updatePerformanceHistory(serverId, 'responseTime', responseTime);
      
      // Server came back online
      if (server.status !== 'healthy') {
        server.status = 'healthy';
        this.emit('serverUp', serverId);
      }
      
    } catch (error) {
      // Update health status
      healthCheck.status = 'unhealthy';
      healthCheck.lastCheck = Date.now();
      healthCheck.consecutiveFailures++;
      healthCheck.totalChecks++;
      healthCheck.successRate = ((healthCheck.totalChecks - healthCheck.consecutiveFailures) / healthCheck.totalChecks) * 100;
      
      // Update metrics
      const metrics = this.metrics.get(serverId);
      if (metrics) {
        metrics.errorCount++;
        metrics.lastUpdated = Date.now();
      }
      
      // Server went down
      if (server.status !== 'unhealthy') {
        server.status = 'unhealthy';
        this.emit('serverDown', serverId);
      }
    }
  }

  makeHealthRequest(server) {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: server.host,
        port: server.port,
        path: '/health',
        method: 'GET',
        timeout: this.healthCheckTimeout
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, data: data });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Health check timeout'));
      });
      
      req.end();
    });
  }

  startPerformanceMonitoring() {
    setInterval(async () => {
      await this.collectPerformanceMetrics();
      await this.analyzePerformance();
      await this.saveMetricsToFile();
    }, 60000); // Every minute
  }

  async collectPerformanceMetrics() {
    const systemMetrics = this.getSystemMetrics();
    
    for (const [serverId, server] of this.servers) {
      const metrics = this.metrics.get(serverId);
      if (!metrics) continue;
      
      // Simulate server-specific metrics (in real implementation, these would come from actual monitoring)
      const serverMetrics = {
        memoryUsage: Math.random() * 0.8, // 0-80%
        cpuUsage: Math.random() * 0.6, // 0-60%
        diskUsage: Math.random() * 0.5, // 0-50%
        networkIn: Math.random() * 1000000, // bytes
        networkOut: Math.random() * 1000000 // bytes
      };
      
      // Update metrics
      Object.assign(metrics, serverMetrics);
      metrics.uptime = Date.now() - new Date(server.createdAt).getTime();
      
      // Update performance history
      this.updatePerformanceHistory(serverId, 'memoryUsage', serverMetrics.memoryUsage);
      this.updatePerformanceHistory(serverId, 'cpuUsage', serverMetrics.cpuUsage);
      
      // Check for alerts
      if (serverMetrics.memoryUsage > this.alertThresholds.memoryUsage) {
        this.createAlert('high_memory_usage', serverId, {
          memoryUsage: serverMetrics.memoryUsage,
          threshold: this.alertThresholds.memoryUsage
        });
      }
      
      if (serverMetrics.cpuUsage > this.alertThresholds.cpuUsage) {
        this.createAlert('high_cpu_usage', serverId, {
          cpuUsage: serverMetrics.cpuUsage,
          threshold: this.alertThresholds.cpuUsage
        });
      }
    }
  }

  updatePerformanceHistory(serverId, metric, value) {
    const history = this.performanceData.get(serverId);
    if (!history || !history[metric]) return;
    
    history[metric].push({
      timestamp: Date.now(),
      value: value
    });
    
    // Keep only recent data points
    if (history[metric].length > this.maxHistoryPoints) {
      history[metric] = history[metric].slice(-this.maxHistoryPoints);
    }
  }

  async analyzePerformance() {
    const analysis = {
      totalServers: this.servers.size,
      healthyServers: 0,
      unhealthyServers: 0,
      averageResponseTime: 0,
      totalRequests: 0,
      totalErrors: 0,
      categories: {}
    };
    
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    
    for (const [serverId, server] of this.servers) {
      const health = this.healthChecks.get(serverId);
      const metrics = this.metrics.get(serverId);
      
      if (health?.status === 'healthy') {
        analysis.healthyServers++;
      } else {
        analysis.unhealthyServers++;
      }
      
      if (metrics) {
        analysis.totalRequests += metrics.requestCount;
        analysis.totalErrors += metrics.errorCount;
        
        if (metrics.averageResponseTime > 0) {
          totalResponseTime += metrics.averageResponseTime;
          responseTimeCount++;
        }
      }
      
      // Category analysis
      const category = server.category;
      if (!analysis.categories[category]) {
        analysis.categories[category] = {
          total: 0,
          healthy: 0,
          unhealthy: 0,
          avgResponseTime: 0
        };
      }
      
      analysis.categories[category].total++;
      if (health?.status === 'healthy') {
        analysis.categories[category].healthy++;
      } else {
        analysis.categories[category].unhealthy++;
      }
    }
    
    if (responseTimeCount > 0) {
      analysis.averageResponseTime = totalResponseTime / responseTimeCount;
    }
    
    // Log analysis every 10 minutes
    if (Date.now() % (10 * 60 * 1000) < 60000) {
      this.logPerformanceAnalysis(analysis);
    }
    
    return analysis;
  }

  getSystemMetrics() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const cpus = os.cpus();
    
    return {
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: totalMemory - freeMemory,
        percentage: ((totalMemory - freeMemory) / totalMemory) * 100
      },
      cpu: {
        count: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        speed: cpus[0]?.speed || 0
      },
      uptime: os.uptime(),
      loadAverage: os.loadavg()
    };
  }

  startAlertSystem() {
    // Clean up old alerts every hour
    setInterval(() => {
      this.cleanupOldAlerts();
    }, 60 * 60 * 1000);
  }

  createAlert(type, serverId, data) {
    const alertId = `${type}_${serverId}_${Date.now()}`;
    const alert = {
      id: alertId,
      type: type,
      serverId: serverId,
      severity: this.getAlertSeverity(type),
      message: this.generateAlertMessage(type, serverId, data),
      data: data,
      createdAt: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    };
    
    this.alerts.set(alertId, alert);
    
    console.warn(`🚨 ALERT [${alert.severity}]: ${alert.message}`);
    
    // Emit alert event
    this.emit('alert', alert);
    
    return alertId;
  }

  getAlertSeverity(type) {
    const severityMap = {
      'server_down': 'critical',
      'high_response_time': 'warning',
      'high_error_rate': 'warning',
      'high_memory_usage': 'warning',
      'high_cpu_usage': 'warning',
      'high_disk_usage': 'warning'
    };
    
    return severityMap[type] || 'info';
  }

  generateAlertMessage(type, serverId, data) {
    const server = this.servers.get(serverId);
    const serverName = server ? `${server.category}/${serverId}` : serverId;
    
    const messages = {
      'server_down': `Server ${serverName} is down`,
      'high_response_time': `Server ${serverName} has high response time: ${data.responseTime}ms (threshold: ${data.threshold}ms)`,
      'high_error_rate': `Server ${serverName} has high error rate: ${(data.errorRate * 100).toFixed(2)}% (threshold: ${(data.threshold * 100).toFixed(2)}%)`,
      'high_memory_usage': `Server ${serverName} has high memory usage: ${(data.memoryUsage * 100).toFixed(2)}% (threshold: ${(data.threshold * 100).toFixed(2)}%)`,
      'high_cpu_usage': `Server ${serverName} has high CPU usage: ${(data.cpuUsage * 100).toFixed(2)}% (threshold: ${(data.threshold * 100).toFixed(2)}%)`,
      'high_disk_usage': `Server ${serverName} has high disk usage: ${(data.diskUsage * 100).toFixed(2)}% (threshold: ${(data.threshold * 100).toFixed(2)}%)`
    };
    
    return messages[type] || `Alert for server ${serverName}: ${type}`;
  }

  cleanupOldAlerts() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.alertRetentionDays);
    
    let cleanedCount = 0;
    
    for (const [alertId, alert] of this.alerts) {
      const alertDate = new Date(alert.createdAt);
      if (alertDate < cutoffDate) {
        this.alerts.delete(alertId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old alerts`);
    }
  }

  handleServerDown(serverId) {
    this.createAlert('server_down', serverId, {});
    console.error(`🔴 Server ${serverId} is DOWN`);
  }

  handleServerUp(serverId) {
    console.log(`🟢 Server ${serverId} is UP`);
    
    // Resolve any server_down alerts for this server
    for (const [alertId, alert] of this.alerts) {
      if (alert.serverId === serverId && alert.type === 'server_down' && !alert.resolved) {
        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();
      }
    }
  }

  async saveMetricsToFile() {
    try {
      const timestamp = new Date().toISOString();
      const metricsData = {
        timestamp: timestamp,
        servers: Object.fromEntries(this.servers),
        metrics: Object.fromEntries(this.metrics),
        healthChecks: Object.fromEntries(this.healthChecks),
        alerts: Array.from(this.alerts.values()).filter(alert => !alert.resolved)
      };
      
      const filename = `metrics-${timestamp.split('T')[0]}.json`;
      const filepath = path.join(this.logsPath, filename);
      
      await fs.writeFile(filepath, JSON.stringify(metricsData, null, 2));
      
    } catch (error) {
      console.error('❌ Failed to save metrics:', error.message);
    }
  }

  logHealthSummary() {
    const healthyCount = Array.from(this.healthChecks.values())
      .filter(health => health.status === 'healthy').length;
    const totalCount = this.servers.size;
    
    console.log(`💓 Health Summary: ${healthyCount}/${totalCount} servers healthy (${((healthyCount/totalCount)*100).toFixed(1)}%)`);
  }

  logPerformanceAnalysis(analysis) {
    console.log('\n📊 Performance Analysis:');
    console.log(`  🖥️  Total Servers: ${analysis.totalServers}`);
    console.log(`  🟢 Healthy: ${analysis.healthyServers}`);
    console.log(`  🔴 Unhealthy: ${analysis.unhealthyServers}`);
    console.log(`  ⏱️  Avg Response Time: ${analysis.averageResponseTime.toFixed(2)}ms`);
    console.log(`  📈 Total Requests: ${analysis.totalRequests}`);
    console.log(`  ❌ Total Errors: ${analysis.totalErrors}`);
    
    if (analysis.totalRequests > 0) {
      const errorRate = (analysis.totalErrors / analysis.totalRequests) * 100;
      console.log(`  📊 Error Rate: ${errorRate.toFixed(2)}%`);
    }
  }

  startDashboard() {
    const server = http.createServer((req, res) => {
      this.handleDashboardRequest(req, res);
    });
    
    server.listen(this.dashboardPort, () => {
      console.log(`📈 Monitoring Dashboard started on port ${this.dashboardPort}`);
    });
  }

  async handleDashboardRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
      switch (url.pathname) {
        case '/':
        case '/dashboard':
          res.end(JSON.stringify(await this.getDashboardData(), null, 2));
          break;
        case '/metrics':
          res.end(JSON.stringify(Object.fromEntries(this.metrics), null, 2));
          break;
        case '/health':
          res.end(JSON.stringify(Object.fromEntries(this.healthChecks), null, 2));
          break;
        case '/alerts':
          res.end(JSON.stringify(Array.from(this.alerts.values()), null, 2));
          break;
        case '/performance':
          res.end(JSON.stringify(Object.fromEntries(this.performanceData), null, 2));
          break;
        default:
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  async getDashboardData() {
    const analysis = await this.analyzePerformance();
    const systemMetrics = this.getSystemMetrics();
    
    return {
      overview: analysis,
      system: systemMetrics,
      servers: Object.fromEntries(this.servers),
      recentAlerts: Array.from(this.alerts.values())
        .filter(alert => !alert.resolved)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10),
      categories: analysis.categories,
      timestamp: new Date().toISOString()
    };
  }

  // API methods
  getMonitoringStats() {
    return {
      totalServers: this.servers.size,
      healthyServers: Array.from(this.healthChecks.values())
        .filter(health => health.status === 'healthy').length,
      activeAlerts: Array.from(this.alerts.values())
        .filter(alert => !alert.resolved).length,
      totalAlerts: this.alerts.size,
      uptime: process.uptime()
    };
  }
}

// Start the monitoring system if this file is run directly
if (require.main === module) {
  const monitoringSystem = new MonitoringSystem1000();
  monitoringSystem.initialize().catch(error => {
    console.error('❌ Failed to start monitoring system:', error);
    process.exit(1);
  });
}

module.exports = MonitoringSystem1000;