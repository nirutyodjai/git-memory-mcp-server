
const http = require('http');
const httpProxy = require('http-proxy');

class LoadBalancer {
  constructor() {
    this.servers = [
      { host: 'localhost', port: 65261, weight: 1 },
      { host: 'localhost', port: 65262, weight: 1 }
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
      console.log(`🔄 Routing request to ${target.host}:${target.port}`);
      
      this.proxy.web(req, res, {
        target: `http://${target.host}:${target.port}`
      });
    });

    server.listen(65263, () => {
      console.log('⚖️  Load Balancer running on port 65263');
    });
  }
}

const lb = new LoadBalancer();
lb.start();
