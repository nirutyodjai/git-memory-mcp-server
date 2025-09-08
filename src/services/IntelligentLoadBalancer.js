const EventEmitter = require('events');

class IntelligentLoadBalancer extends EventEmitter {
    constructor(servers) {
        super();
        this.servers = servers;
        this.trafficHistory = {};
        this.anomalyHistory = [];
        this.optimizationHistory = [];

        // Initialize traffic history
        this.servers.forEach(server => {
            this.trafficHistory[server.id] = [];
        });

        // Simulate real-time monitoring
        setInterval(() => {
            this.collectTrafficData();
            this.detectAnomalies();
            this.optimizeTraffic();
        }, 5000); // Run every 5 seconds
    }

    collectTrafficData() {
        // ML-based traffic prediction (simulated)
        this.servers.forEach(server => {
            const mockTraffic = Math.floor(Math.random() * 1000) + 100; // Simulate traffic
            this.trafficHistory[server.id].push({ timestamp: Date.now(), traffic: mockTraffic });
            if (this.trafficHistory[server.id].length > 100) {
                this.trafficHistory[server.id].shift(); // Keep last 100 data points
            }
        });
        this.emit('traffic-updated', this.trafficHistory);
    }

    detectAnomalies() {
        // Anomaly detection (simulated)
        this.servers.forEach(server => {
            const history = this.trafficHistory[server.id];
            if (history.length < 2) return;

            const lastTwo = history.slice(-2);
            const [previous, latest] = lastTwo;

            if (latest.traffic > previous.traffic * 2) { // Simple anomaly detection
                const anomaly = {
                    serverId: server.id,
                    timestamp: Date.now(),
                    message: `Traffic spike detected: ${latest.traffic} requests`,
                    level: 'warning'
                };
                this.anomalyHistory.push(anomaly);
                this.emit('anomaly-detected', anomaly);
                this.selfHeal(server);
            }
        });
    }

    optimizeTraffic() {
        // Automatic optimization (simulated)
        const totalTraffic = this.servers.reduce((acc, server) => {
            const history = this.trafficHistory[server.id];
            return acc + (history.length > 0 ? history[history.length - 1].traffic : 0);
        }, 0);

        const averageTraffic = totalTraffic / this.servers.length;

        this.servers.forEach(server => {
            const history = this.trafficHistory[server.id];
            const latestTraffic = history.length > 0 ? history[history.length - 1].traffic : 0;

            if (latestTraffic > averageTraffic * 1.5) {
                const optimization = {
                    serverId: server.id,
                    timestamp: Date.now(),
                    message: `High traffic detected. Optimizing routing.`
                };
                this.optimizationHistory.push(optimization);
                this.emit('traffic-optimized', optimization);
            }
        });
    }

    selfHeal(server) {
        // Self-healing systems (simulated)
        const healingAction = {
            serverId: server.id,
            timestamp: Date.now(),
            message: `Initiating self-healing for server ${server.id}. Rerouting traffic.`
        };
        this.emit('self-healing', healingAction);

        // In a real scenario, you would reroute traffic to other servers
        console.log(`Self-healing: Rerouting traffic from server ${server.id}`);
    }

    getTrafficHistory() {
        return this.trafficHistory;
    }

    getAnomalyHistory() {
        return this.anomalyHistory;
    }

    getOptimizationHistory() {
        return this.optimizationHistory;
    }
}

module.exports = IntelligentLoadBalancer;