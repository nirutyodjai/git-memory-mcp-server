
const http = require('http');
const axios = require('axios');

class HealthMonitor {
  constructor() {
    this.endpoints = [
      { name: 'Git Memory MCP', url: 'http://localhost:65261/health' },
      { name: 'Load Balancer', url: 'http://localhost:65263' }
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

    server.listen(65264, () => {
      console.log('🏥 Health Monitor running on port 65264');
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
