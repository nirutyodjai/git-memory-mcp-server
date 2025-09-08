const EventEmitter = require('events');

class AutomatedOptimization extends EventEmitter {
    constructor(serverManager) {
        super();
        this.serverManager = serverManager;
        this.optimizationHistory = [];
        this.isOptimizing = false;

        this.start();
    }

    start() {
        setInterval(() => this.runOptimization(), 5 * 60 * 1000); // Run every 5 minutes
    }

    async runOptimization() {
        if (this.isOptimizing) return;
        this.isOptimizing = true;

        try {
            const servers = this.serverManager.getServers();
            const optimizations = [];

            for (const server of servers) {
                const optimization = await this.optimizeServer(server);
                if (optimization) {
                    optimizations.push(optimization);
                }
            }

            if (optimizations.length > 0) {
                const optimizationRecord = { timestamp: new Date(), optimizations };
                this.optimizationHistory.push(optimizationRecord);
                this.emit('optimization', optimizationRecord);
            }

        } catch (error) {
            console.error('Error during automated optimization:', error);
        } finally {
            this.isOptimizing = false;
        }
    }

    async optimizeServer(server) {
        // Mock optimization logic
        const cpuUsage = Math.random(); // Mock CPU usage
        const memoryUsage = Math.random(); // Mock memory usage

        if (cpuUsage > 0.8) {
            console.log(`🚀 Optimizing CPU for server ${server.id}`);
            return { serverId: server.id, type: 'CPU', action: 'restart' };
        }

        if (memoryUsage > 0.8) {
            console.log(`🚀 Optimizing Memory for server ${server.id}`);
            return { serverId: server.id, type: 'Memory', action: 'clear_cache' };
        }

        return null;
    }

    getOptimizationHistory() {
        return this.optimizationHistory;
    }
}

module.exports = AutomatedOptimization;