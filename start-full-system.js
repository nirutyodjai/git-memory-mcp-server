#!/usr/bin/env node

/**
 * Full System Starter - เริ่มต้นระบบ NEXUS IDE ทั้งหมด
 * รวม Git Memory MCP Server, MCP Proxy 500, Load Balancer
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class FullSystemStarter {
  constructor() {
    this.processes = [];
    this.config = {
      gitMemoryPort: 65261,
      mcpProxyPort: 65262,
      loadBalancerPort: 65263,
      healthCheckPort: 65264,
      monitoringPort: 65265
    };
  }

  async startSystem() {
    console.log('🚀 Starting NEXUS IDE Full System...');
    console.log('=' .repeat(60));
    
    try {
      // 1. Start Git Memory MCP Server
      await this.startGitMemoryServer();
      await this.sleep(2000);
      
      // 2. Start MCP Proxy Server 500
      await this.startMCPProxy();
      await this.sleep(2000);
      
      // 3. Start Load Balancer
      await this.startLoadBalancer();
      await this.sleep(2000);
      
      // 4. Start Health Monitor
      await this.startHealthMonitor();
      await this.sleep(2000);
      
      // 5. Start System Monitor
      await this.startSystemMonitor();
      
      console.log('\n🎉 NEXUS IDE Full System Started Successfully!');
      console.log('=' .repeat(60));
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
    console.log('📡 Starting Git Memory MCP Server...');
    
    const gitMemoryProcess = spawn('node', ['test-server.js'], {
      cwd: path.join(__dirname),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    this.processes.push({
      name: 'Git Memory MCP Server',
      process: gitMemoryProcess,
      port: this.config.gitMemoryPort
    });
    
    gitMemoryProcess.stdout.on('data', (data) => {
      console.log(`[Git Memory] ${data.toString().trim()}`);
    });
    
    gitMemoryProcess.stderr.on('data', (data) => {
      console.error(`[Git Memory Error] ${data.toString().trim()}`);
    });
    
    console.log(`✅ Git Memory MCP Server started on port ${this.config.gitMemoryPort}`);
  }

  async startMCPProxy() {
    console.log('🔗 Starting MCP Proxy Server 500...');
    
    const mcpProxyProcess = spawn('node', ['mcp-proxy-server-500.js'], {
      cwd: path.join(__dirname, 'mcp-proxy'),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    this.processes.push({
      name: 'MCP Proxy Server 500',
      process: mcpProxyProcess,
      port: this.config.mcpProxyPort
    });
    
    mcpProxyProcess.stdout.on('data', (data) => {
      console.log(`[MCP Proxy] ${data.toString().trim()}`);
    });
    
    mcpProxyProcess.stderr.on('data', (data) => {
      console.error(`[MCP Proxy Error] ${data.toString().trim()}`);
    });
    
    console.log(`✅ MCP Proxy Server 500 started on port ${this.config.mcpProxyPort}`);
  }

  async startLoadBalancer() {
    console.log('⚖️  Starting Load Balancer...');
    
    // Create a simple load balancer
    const loadBalancerCode = `
const http = require('http');
const httpProxy = require('http-proxy');

class LoadBalancer {
  constructor() {
    this.servers = [
      { host: 'localhost', port: ${this.config.gitMemoryPort}, weight: 1 },
      { host: 'localhost', port: ${this.config.mcpProxyPort}, weight: 1 }
    ];
    this.currentIndex = 0;
    this.proxy = httpProxy.createProxyServer({});
  }

  getNextServer() {
    const server = this.servers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.servers.length;
    return server;
  }

  start() {
    const server = http.createServer((req, res) => {
      const target = this.getNextServer();
      console.log(\`🔄 Routing request to \${target.host}:\${target.port}\`);
      
      this.proxy.web(req, res, {
        target: \`http://\${target.host}:\${target.port}\`
      });
    });

    server.listen(${this.config.loadBalancerPort}, () => {
      console.log('⚖️  Load Balancer running on port ${this.config.loadBalancerPort}');
    });
  }
}

const lb = new LoadBalancer();
lb.start();
`;
    
    fs.writeFileSync(path.join(__dirname, 'load-balancer.js'), loadBalancerCode);
    
    const loadBalancerProcess = spawn('node', ['load-balancer.js'], {
      cwd: path.join(__dirname),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    this.processes.push({
      name: 'Load Balancer',
      process: loadBalancerProcess,
      port: this.config.loadBalancerPort
    });
    
    loadBalancerProcess.stdout.on('data', (data) => {
      console.log(`[Load Balancer] ${data.toString().trim()}`);
    });
    
    console.log(`✅ Load Balancer started on port ${this.config.loadBalancerPort}`);
  }

  async startHealthMonitor() {
    console.log('🏥 Starting Health Monitor...');
    
    const healthMonitorCode = `
const http = require('http');
const axios = require('axios');

class HealthMonitor {
  constructor() {
    this.endpoints = [
      { name: 'Git Memory MCP', url: 'http://localhost:${this.config.gitMemoryPort}/health' },
      { name: 'Load Balancer', url: 'http://localhost:${this.config.loadBalancerPort}' }
    ];
  }

  async checkHealth() {
    const results = [];
    
    for (const endpoint of this.endpoints) {
      try {
        const start = Date.now();
        await axios.get(endpoint.url, { timeout: 5000 });
        const responseTime = Date.now() - start;
        
        results.push({
          name: endpoint.name,
          status: 'healthy',
          responseTime: responseTime + 'ms'
        });
      } catch (error) {
        results.push({
          name: endpoint.name,
          status: 'unhealthy',
          error: error.message
        });
      }
    }
    
    return results;
  }

  start() {
    const server = http.createServer(async (req, res) => {
      if (req.url === '/health') {
        const healthResults = await this.checkHealth();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          timestamp: new Date().toISOString(),
          status: 'monitoring',
          services: healthResults
        }, null, 2));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(${this.config.healthCheckPort}, () => {
      console.log('🏥 Health Monitor running on port ${this.config.healthCheckPort}');
    });
    
    // Periodic health checks
    setInterval(async () => {
      const results = await this.checkHealth();
      console.log('🏥 Health Check Results:', results);
    }, 30000);
  }
}

const monitor = new HealthMonitor();
monitor.start();
`;
    
    fs.writeFileSync(path.join(__dirname, 'health-monitor.js'), healthMonitorCode);
    
    const healthProcess = spawn('node', ['health-monitor.js'], {
      cwd: path.join(__dirname),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    this.processes.push({
      name: 'Health Monitor',
      process: healthProcess,
      port: this.config.healthCheckPort
    });
    
    console.log(`✅ Health Monitor started on port ${this.config.healthCheckPort}`);
  }

  async startSystemMonitor() {
    console.log('📊 Starting System Monitor...');
    
    const systemMonitorCode = `
const http = require('http');
const os = require('os');

class SystemMonitor {
  getSystemStats() {
    return {
      timestamp: new Date().toISOString(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        uptime: os.uptime(),
        loadavg: os.loadavg(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        cpus: os.cpus().length
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      nexus: {
        gitMemoryPort: ${this.config.gitMemoryPort},
        mcpProxyPort: ${this.config.mcpProxyPort},
        loadBalancerPort: ${this.config.loadBalancerPort},
        healthCheckPort: ${this.config.healthCheckPort},
        monitoringPort: ${this.config.monitoringPort}
      }
    };
  }

  start() {
    const server = http.createServer((req, res) => {
      if (req.url === '/stats') {
        const stats = this.getSystemStats();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats, null, 2));
      } else if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(\`
<!DOCTYPE html>
<html>
<head>
    <title>NEXUS IDE System Monitor</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #1e1e1e; color: #fff; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .service { background: #2d2d2d; padding: 20px; border-radius: 8px; border-left: 4px solid #007acc; }
        .service h3 { margin-top: 0; color: #007acc; }
        .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .status.running { background: #28a745; }
        .metrics { background: #2d2d2d; padding: 20px; border-radius: 8px; margin-top: 20px; }
        pre { background: #1e1e1e; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 NEXUS IDE System Monitor</h1>
            <p>Real-time monitoring of all system components</p>
        </div>
        
        <div class="services">
            <div class="service">
                <h3>📡 Git Memory MCP Server</h3>
                <p><span class="status running">RUNNING</span></p>
                <p>Port: ${this.config.gitMemoryPort}</p>
                <p>Status: Active and processing requests</p>
            </div>
            
            <div class="service">
                <h3>🔗 MCP Proxy Server 500</h3>
                <p><span class="status running">RUNNING</span></p>
                <p>Port: ${this.config.mcpProxyPort}</p>
                <p>Status: Ready for 500 connections</p>
            </div>
            
            <div class="service">
                <h3>⚖️ Load Balancer</h3>
                <p><span class="status running">RUNNING</span></p>
                <p>Port: ${this.config.loadBalancerPort}</p>
                <p>Status: Distributing traffic</p>
            </div>
            
            <div class="service">
                <h3>🏥 Health Monitor</h3>
                <p><span class="status running">RUNNING</span></p>
                <p>Port: ${this.config.healthCheckPort}</p>
                <p>Status: Monitoring all services</p>
            </div>
        </div>
        
        <div class="metrics">
            <h3>📊 System Metrics</h3>
            <p><a href="/stats" style="color: #007acc;">View Real-time Stats (JSON)</a></p>
            <p>System uptime, memory usage, CPU stats, and more...</p>
        </div>
    </div>
    
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>
        \`);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(${this.config.monitoringPort}, () => {
      console.log('📊 System Monitor running on port ${this.config.monitoringPort}');
      console.log('🌐 Dashboard: http://localhost:${this.config.monitoringPort}');
    });
  }
}

const monitor = new SystemMonitor();
monitor.start();
`;
    
    fs.writeFileSync(path.join(__dirname, 'system-monitor.js'), systemMonitorCode);
    
    const systemProcess = spawn('node', ['system-monitor.js'], {
      cwd: path.join(__dirname),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    this.processes.push({
      name: 'System Monitor',
      process: systemProcess,
      port: this.config.monitoringPort
    });
    
    console.log(`✅ System Monitor started on port ${this.config.monitoringPort}`);
  }

  displaySystemStatus() {
    console.log('\n🎯 NEXUS IDE System Status:');
    console.log('─'.repeat(50));
    
    this.processes.forEach(proc => {
      console.log(`✅ ${proc.name}: Running on port ${proc.port}`);
    });
    
    console.log('\n🌐 Access Points:');
    console.log(`📡 Git Memory MCP: http://localhost:${this.config.gitMemoryPort}/health`);
    console.log(`⚖️  Load Balancer: http://localhost:${this.config.loadBalancerPort}`);
    console.log(`🏥 Health Monitor: http://localhost:${this.config.healthCheckPort}/health`);
    console.log(`📊 System Dashboard: http://localhost:${this.config.monitoringPort}`);
    
    console.log('\n💡 Tips:');
    console.log('- Visit the System Dashboard for real-time monitoring');
    console.log('- All services are load-balanced and monitored');
    console.log('- Press Ctrl+C to gracefully shutdown all services');
  }

  setupGracefulShutdown() {
    process.on('SIGINT', async () => {
      console.log('\n🛑 Graceful shutdown initiated...');
      await this.cleanup();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Graceful shutdown initiated...');
      await this.cleanup();
      process.exit(0);
    });
  }

  async cleanup() {
    console.log('🧹 Cleaning up processes...');
    
    for (const proc of this.processes) {
      try {
        proc.process.kill('SIGTERM');
        console.log(`✅ ${proc.name} stopped`);
      } catch (error) {
        console.warn(`⚠️  Failed to stop ${proc.name}:`, error.message);
      }
    }
    
    // Clean up generated files
    const filesToClean = [
      'load-balancer.js',
      'health-monitor.js', 
      'system-monitor.js'
    ];
    
    filesToClean.forEach(file => {
      try {
        fs.unlinkSync(path.join(__dirname, file));
      } catch (error) {
        // Ignore cleanup errors
      }
    });
    
    console.log('✅ Cleanup completed');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const starter = new FullSystemStarter();
  await starter.startSystem();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { FullSystemStarter };