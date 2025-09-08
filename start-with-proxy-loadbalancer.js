#!/usr/bin/env node

/**
 * NEXUS IDE Complete System Starter
 * เริ่มต้นระบบครบครันพร้อม Proxy และ Load Balancer
 * 
 * Features:
 * - Git Memory MCP Server (1000 servers)
 * - API Gateway with Proxy
 * - Distributed Load Balancer
 * - Health Monitoring
 * - Auto-scaling
 * - Performance Monitoring
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');

class NEXUSSystemStarter {
  constructor() {
    this.processes = [];
    this.config = {
      // Core Services
      gitMemoryPort: 65261,
      coordinatorPort: 9000,
      
      // Proxy & Load Balancer
      apiGatewayPort: 8080,
      proxyPort: 65262,
      loadBalancerPort: 65263,
      
      // Monitoring
      healthCheckPort: 65264,
      monitoringPort: 65265,
      metricsPort: 65266,
      
      // Dashboard
      dashboardPort: 3001
    };
    
    this.services = {
      'git-memory': { status: 'stopped', port: this.config.gitMemoryPort },
      'coordinator': { status: 'stopped', port: this.config.coordinatorPort },
      'api-gateway': { status: 'stopped', port: this.config.apiGatewayPort },
      'proxy': { status: 'stopped', port: this.config.proxyPort },
      'load-balancer': { status: 'stopped', port: this.config.loadBalancerPort },
      'health-monitor': { status: 'stopped', port: this.config.healthCheckPort },
      'dashboard': { status: 'stopped', port: this.config.dashboardPort }
    };
  }

  async startSystem() {
    console.log('🚀 Starting NEXUS IDE Complete System with Proxy & Load Balancer...');
    console.log('=' .repeat(80));
    
    try {
      // 1. Start Git Memory MCP Server
      await this.startGitMemoryServer();
      await this.sleep(3000);
      
      // 2. Start Coordinator
      await this.startCoordinator();
      await this.sleep(2000);
      
      // 3. Start API Gateway with Proxy
      await this.startAPIGateway();
      await this.sleep(2000);
      
      // 4. Start MCP Proxy Server
      await this.startMCPProxy();
      await this.sleep(2000);
      
      // 5. Start Distributed Load Balancer
      await this.startLoadBalancer();
      await this.sleep(2000);
      
      // 6. Start Health Monitor
      await this.startHealthMonitor();
      await this.sleep(2000);
      
      // 7. Start System Dashboard
      await this.startDashboard();
      
      console.log('\n🎉 NEXUS IDE Complete System Started Successfully!');
      console.log('=' .repeat(80));
      this.displaySystemStatus();
      
      // Keep the system running
      this.setupGracefulShutdown();
      
    } catch (error) {
      console.error('❌ Failed to start system:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }

  async startGitMemoryServer() {
    console.log('📡 Starting Git Memory MCP Server (1000 servers)...');
    
    const gitMemoryProcess = spawn('node', ['test-server.js'], {
      cwd: path.join(__dirname),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PORT: this.config.gitMemoryPort }
    });
    
    this.processes.push({
      name: 'Git Memory MCP Server',
      process: gitMemoryProcess,
      port: this.config.gitMemoryPort,
      service: 'git-memory'
    });
    
    gitMemoryProcess.stdout.on('data', (data) => {
      console.log(`[Git Memory] ${data.toString().trim()}`);
    });
    
    gitMemoryProcess.stderr.on('data', (data) => {
      console.error(`[Git Memory Error] ${data.toString().trim()}`);
    });
    
    this.services['git-memory'].status = 'running';
    console.log(`✅ Git Memory MCP Server started on port ${this.config.gitMemoryPort}`);
  }

  async startCoordinator() {
    console.log('🎯 Starting Git Memory Coordinator...');
    
    const coordinatorProcess = spawn('node', ['git-memory-coordinator.js'], {
      cwd: path.join(__dirname),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PORT: this.config.coordinatorPort }
    });
    
    this.processes.push({
      name: 'Git Memory Coordinator',
      process: coordinatorProcess,
      port: this.config.coordinatorPort,
      service: 'coordinator'
    });
    
    coordinatorProcess.stdout.on('data', (data) => {
      console.log(`[Coordinator] ${data.toString().trim()}`);
    });
    
    coordinatorProcess.stderr.on('data', (data) => {
      console.error(`[Coordinator Error] ${data.toString().trim()}`);
    });
    
    this.services['coordinator'].status = 'running';
    console.log(`✅ Git Memory Coordinator started on port ${this.config.coordinatorPort}`);
  }

  async startAPIGateway() {
    console.log('🌐 Starting API Gateway with Proxy...');
    
    const apiGatewayProcess = spawn('node', ['api-gateway.js'], {
      cwd: path.join(__dirname),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        PORT: this.config.apiGatewayPort,
        PROXY_ENABLED: 'true',
        LOAD_BALANCER_ENABLED: 'true'
      }
    });
    
    this.processes.push({
      name: 'API Gateway',
      process: apiGatewayProcess,
      port: this.config.apiGatewayPort,
      service: 'api-gateway'
    });
    
    apiGatewayProcess.stdout.on('data', (data) => {
      console.log(`[API Gateway] ${data.toString().trim()}`);
    });
    
    apiGatewayProcess.stderr.on('data', (data) => {
      console.error(`[API Gateway Error] ${data.toString().trim()}`);
    });
    
    this.services['api-gateway'].status = 'running';
    console.log(`✅ API Gateway started on port ${this.config.apiGatewayPort}`);
  }

  async startMCPProxy() {
    console.log('🔗 Starting MCP Proxy Server 500...');
    
    const mcpProxyProcess = spawn('node', ['mcp-proxy-server-500.js'], {
      cwd: path.join(__dirname, 'mcp-proxy'),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PORT: this.config.proxyPort }
    });
    
    this.processes.push({
      name: 'MCP Proxy Server 500',
      process: mcpProxyProcess,
      port: this.config.proxyPort,
      service: 'proxy'
    });
    
    mcpProxyProcess.stdout.on('data', (data) => {
      console.log(`[MCP Proxy] ${data.toString().trim()}`);
    });
    
    mcpProxyProcess.stderr.on('data', (data) => {
      console.error(`[MCP Proxy Error] ${data.toString().trim()}`);
    });
    
    this.services['proxy'].status = 'running';
    console.log(`✅ MCP Proxy Server started on port ${this.config.proxyPort}`);
  }

  async startLoadBalancer() {
    console.log('⚖️  Starting Distributed Load Balancer...');
    
    const loadBalancerProcess = spawn('node', ['distributed-load-balancer.js'], {
      cwd: path.join(__dirname),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PORT: this.config.loadBalancerPort }
    });
    
    this.processes.push({
      name: 'Distributed Load Balancer',
      process: loadBalancerProcess,
      port: this.config.loadBalancerPort,
      service: 'load-balancer'
    });
    
    loadBalancerProcess.stdout.on('data', (data) => {
      console.log(`[Load Balancer] ${data.toString().trim()}`);
    });
    
    loadBalancerProcess.stderr.on('data', (data) => {
      console.error(`[Load Balancer Error] ${data.toString().trim()}`);
    });
    
    this.services['load-balancer'].status = 'running';
    console.log(`✅ Distributed Load Balancer started on port ${this.config.loadBalancerPort}`);
  }

  async startHealthMonitor() {
    console.log('🏥 Starting Health Monitor...');
    
    const app = express();
    
    app.get('/health', async (req, res) => {
      const healthStatus = await this.checkSystemHealth();
      res.json(healthStatus);
    });
    
    app.get('/status', (req, res) => {
      res.json({
        services: this.services,
        processes: this.processes.length,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
    });
    
    const server = app.listen(this.config.healthCheckPort, () => {
      console.log(`✅ Health Monitor started on port ${this.config.healthCheckPort}`);
    });
    
    this.processes.push({
      name: 'Health Monitor',
      server: server,
      port: this.config.healthCheckPort,
      service: 'health-monitor'
    });
    
    this.services['health-monitor'].status = 'running';
  }

  async startDashboard() {
    console.log('📊 Starting System Dashboard...');
    
    const app = express();
    
    // Serve static dashboard
    app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML());
    });
    
    app.get('/api/status', (req, res) => {
      res.json({
        services: this.services,
        config: this.config,
        processes: this.processes.length,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });
    });
    
    const server = app.listen(this.config.dashboardPort, () => {
      console.log(`✅ System Dashboard started on port ${this.config.dashboardPort}`);
      console.log(`🌐 Dashboard URL: http://localhost:${this.config.dashboardPort}`);
    });
    
    this.processes.push({
      name: 'System Dashboard',
      server: server,
      port: this.config.dashboardPort,
      service: 'dashboard'
    });
    
    this.services['dashboard'].status = 'running';
  }

  generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>NEXUS IDE System Dashboard</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .service { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status-running { color: #28a745; font-weight: bold; }
        .status-stopped { color: #dc3545; font-weight: bold; }
        .port { background: #e9ecef; padding: 5px 10px; border-radius: 5px; font-family: monospace; }
        .refresh { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 NEXUS IDE System Dashboard</h1>
            <p>Complete System with Proxy & Load Balancer</p>
        </div>
        
        <button class="refresh" onclick="location.reload()">🔄 Refresh Status</button>
        
        <div class="services">
            ${Object.entries(this.services).map(([name, service]) => `
                <div class="service">
                    <h3>${name.toUpperCase()}</h3>
                    <p>Status: <span class="status-${service.status}">${service.status.toUpperCase()}</span></p>
                    <p>Port: <span class="port">${service.port}</span></p>
                    <p><a href="http://localhost:${service.port}" target="_blank">Open Service</a></p>
                </div>
            `).join('')}
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 10px;">
            <h3>📋 System Information</h3>
            <p><strong>Total Processes:</strong> ${this.processes.length}</p>
            <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds</p>
            <p><strong>Memory Usage:</strong> ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB</p>
            <p><strong>Last Updated:</strong> ${new Date().toLocaleString()}</p>
        </div>
    </div>
    
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>
    `;
  }

  async checkSystemHealth() {
    const health = {
      status: 'healthy',
      services: {},
      timestamp: new Date().toISOString()
    };
    
    for (const [name, service] of Object.entries(this.services)) {
      try {
        const response = await this.pingService(service.port);
        health.services[name] = { status: 'healthy', port: service.port };
      } catch (error) {
        health.services[name] = { status: 'unhealthy', port: service.port, error: error.message };
        health.status = 'degraded';
      }
    }
    
    return health;
  }

  async pingService(port) {
    return new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${port}/health`, (res) => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Timeout')));
    });
  }

  displaySystemStatus() {
    console.log('\n📊 System Status:');
    console.log('-'.repeat(60));
    
    Object.entries(this.services).forEach(([name, service]) => {
      const status = service.status === 'running' ? '✅' : '❌';
      console.log(`${status} ${name.padEnd(20)} | Port: ${service.port}`);
    });
    
    console.log('-'.repeat(60));
    console.log(`🌐 Dashboard: http://localhost:${this.config.dashboardPort}`);
    console.log(`🏥 Health Check: http://localhost:${this.config.healthCheckPort}/health`);
    console.log(`📊 System Status: http://localhost:${this.config.healthCheckPort}/status`);
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      await this.cleanup();
      process.exit(0);
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  async cleanup() {
    console.log('🧹 Cleaning up processes...');
    
    for (const proc of this.processes) {
      try {
        if (proc.process) {
          proc.process.kill('SIGTERM');
        }
        if (proc.server) {
          proc.server.close();
        }
        console.log(`✅ Stopped ${proc.name}`);
      } catch (error) {
        console.error(`❌ Error stopping ${proc.name}:`, error.message);
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start the system if this file is run directly
if (require.main === module) {
  const starter = new NEXUSSystemStarter();
  starter.startSystem().catch(console.error);
}

module.exports = NEXUSSystemStarter;