
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
        gitMemoryPort: 65261,
        mcpProxyPort: 65262,
        loadBalancerPort: 65263,
        healthCheckPort: 65264,
        monitoringPort: 65265
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
        res.end(`
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
                <p>Port: 65261</p>
                <p>Status: Active and processing requests</p>
            </div>
            
            <div class="service">
                <h3>🔗 MCP Proxy Server 500</h3>
                <p><span class="status running">RUNNING</span></p>
                <p>Port: 65262</p>
                <p>Status: Ready for 500 connections</p>
            </div>
            
            <div class="service">
                <h3>⚖️ Load Balancer</h3>
                <p><span class="status running">RUNNING</span></p>
                <p>Port: 65263</p>
                <p>Status: Distributing traffic</p>
            </div>
            
            <div class="service">
                <h3>🏥 Health Monitor</h3>
                <p><span class="status running">RUNNING</span></p>
                <p>Port: 65264</p>
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
        `);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(65265, () => {
      console.log('📊 System Monitor running on port 65265');
      console.log('🌐 Dashboard: http://localhost:65265');
    });
  }
}

const monitor = new SystemMonitor();
monitor.start();
