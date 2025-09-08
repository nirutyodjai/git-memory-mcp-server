const EventEmitter = require('events');

class SmartMonitoring extends EventEmitter {
    constructor(serverManager) {
        super();
        this.serverManager = serverManager;
        this.alertHistory = [];
        this.isMonitoring = false;

        this.start();
    }

    start() {
        setInterval(() => this.runMonitoring(), 60 * 1000); // Run every minute
    }

    async runMonitoring() {
        if (this.isMonitoring) return;
        this.isMonitoring = true;

        try {
            const servers = this.serverManager.getServers();
            const alerts = [];

            for (const server of servers) {
                const alert = await this.monitorServer(server);
                if (alert) {
                    alerts.push(alert);
                }
            }

            if (alerts.length > 0) {
                const alertRecord = { timestamp: new Date(), alerts };
                this.alertHistory.push(alertRecord);
                this.emit('alert', alertRecord);
            }

        } catch (error) {
            console.error('Error during smart monitoring:', error);
        } finally {
            this.isMonitoring = false;
        }
    }

    async monitorServer(server) {
        // Mock monitoring logic
        const health = await this.serverManager.checkHealth(server.id);

        if (health.status === 'unhealthy') {
            const rootCause = this.analyzeRootCause(health);
            console.log(`🚨 Alert: Server ${server.id} is unhealthy. Root cause: ${rootCause}`);
            return { serverId: server.id, type: 'unhealthy', rootCause };
        }

        const predictiveAlert = this.predictiveMaintenance(server);
        if (predictiveAlert) {
            console.log(`🔮 Predictive Alert: ${predictiveAlert.message}`);
            return predictiveAlert;
        }

        return null;
    }

    analyzeRootCause(health) {
        // Mock root cause analysis
        if (health.error.includes('timeout')) {
            return 'Network timeout';
        }
        if (health.error.includes('500')) {
            return 'Internal server error';
        }
        return 'Unknown error';
    }

    predictiveMaintenance(server) {
        // Mock predictive maintenance
        const cpuUsage = Math.random();
        if (cpuUsage > 0.9) {
            return {
                serverId: server.id,
                type: 'predictive',
                message: `High CPU usage on server ${server.id} may lead to performance degradation.`,
            };
        }
        return null;
    }

    getAlertHistory() {
        return this.alertHistory;
    }
}

module.exports = SmartMonitoring;