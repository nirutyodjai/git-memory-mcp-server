#!/usr/bin/env node

/**
 * =============================================================================
 * Enterprise Security System Status Monitor
 * =============================================================================
 * Real-time status monitoring and alerting system for Git Memory MCP Server Security
 * Features: Continuous monitoring, alerting, metrics collection, and dashboard integration
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const { HealthChecker } = require('./health-check');
const WebSocket = require('ws');
const nodemailer = require('nodemailer');
const os = require('os');

// =============================================================================
// Configuration
// =============================================================================
const CONFIG = {
    // Monitoring intervals (in milliseconds)
    intervals: {
        health: 30000,      // 30 seconds
        performance: 10000, // 10 seconds
        services: 15000,    // 15 seconds
        cleanup: 300000     // 5 minutes
    },
    
    // Alert thresholds
    thresholds: {
        consecutiveFailures: 3,
        responseTime: 5000,
        cpuUsage: 80,
        memoryUsage: 85,
        diskUsage: 90,
        errorRate: 10
    },
    
    // Notification settings
    notifications: {
        email: {
            enabled: process.env.EMAIL_NOTIFICATIONS === 'true',
            smtp: {
                host: process.env.SMTP_HOST || 'localhost',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            },
            from: process.env.EMAIL_FROM || 'security@gitmemorymcp.com',
            to: process.env.EMAIL_TO ? process.env.EMAIL_TO.split(',') : ['admin@gitmemorymcp.com']
        },
        webhook: {
            enabled: process.env.WEBHOOK_NOTIFICATIONS === 'true',
            url: process.env.WEBHOOK_URL,
            timeout: 5000
        },
        slack: {
            enabled: process.env.SLACK_NOTIFICATIONS === 'true',
            webhook: process.env.SLACK_WEBHOOK_URL,
            channel: process.env.SLACK_CHANNEL || '#security-alerts'
        }
    },
    
    // Data retention
    retention: {
        metrics: 24 * 60 * 60 * 1000,    // 24 hours
        alerts: 7 * 24 * 60 * 60 * 1000, // 7 days
        logs: 30 * 24 * 60 * 60 * 1000   // 30 days
    },
    
    // WebSocket server for real-time updates
    websocket: {
        enabled: true,
        port: parseInt(process.env.MONITOR_WS_PORT) || 8080,
        path: '/monitor'
    },
    
    // Storage paths
    paths: {
        data: path.resolve(__dirname, '..', 'data', 'monitoring'),
        logs: path.resolve(__dirname, '..', 'logs', 'monitoring'),
        reports: path.resolve(__dirname, '..', 'reports')
    }
};

// =============================================================================
// Status Monitor Class
// =============================================================================
class StatusMonitor extends EventEmitter {
    constructor(config = CONFIG) {
        super();
        this.config = config;
        this.isRunning = false;
        this.intervals = {};
        this.metrics = new Map();
        this.alerts = new Map();
        this.services = new Map();
        this.wsServer = null;
        this.clients = new Set();
        this.healthChecker = new HealthChecker();
        this.emailTransporter = null;
        
        // Initialize storage
        this.initializeStorage();
        
        // Setup email transporter if enabled
        if (this.config.notifications.email.enabled) {
            this.setupEmailTransporter();
        }
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    // Initialize storage directories
    async initializeStorage() {
        try {
            for (const dir of Object.values(this.config.paths)) {
                await fs.mkdir(dir, { recursive: true });
            }
        } catch (error) {
            console.error(`Failed to initialize storage: ${error.message}`);
        }
    }
    
    // Setup email transporter
    setupEmailTransporter() {
        try {
            this.emailTransporter = nodemailer.createTransporter(this.config.notifications.email.smtp);
        } catch (error) {
            console.error(`Failed to setup email transporter: ${error.message}`);
        }
    }
    
    // Setup event listeners
    setupEventListeners() {
        this.on('alert', this.handleAlert.bind(this));
        this.on('metric', this.handleMetric.bind(this));
        this.on('service-status', this.handleServiceStatus.bind(this));
        
        // Graceful shutdown
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }
    
    // Start monitoring
    async start() {
        if (this.isRunning) {
            console.log('Monitor is already running');
            return;
        }
        
        console.log('🚀 Starting Enterprise Security System Status Monitor...');
        
        try {
            // Start WebSocket server
            if (this.config.websocket.enabled) {
                await this.startWebSocketServer();
            }
            
            // Start monitoring intervals
            this.startMonitoringIntervals();
            
            // Load historical data
            await this.loadHistoricalData();
            
            this.isRunning = true;
            console.log('✅ Status Monitor started successfully');
            
            // Emit startup event
            this.emit('monitor-started', {
                timestamp: new Date().toISOString(),
                pid: process.pid,
                version: require('../package.json').version
            });
            
        } catch (error) {
            console.error(`Failed to start monitor: ${error.message}`);
            throw error;
        }
    }
    
    // Stop monitoring
    async stop() {
        if (!this.isRunning) {
            return;
        }
        
        console.log('🛑 Stopping Status Monitor...');
        
        try {
            // Clear intervals
            Object.values(this.intervals).forEach(interval => clearInterval(interval));
            this.intervals = {};
            
            // Close WebSocket server
            if (this.wsServer) {
                this.wsServer.close();
            }
            
            // Save current data
            await this.saveCurrentData();
            
            this.isRunning = false;
            console.log('✅ Status Monitor stopped');
            
            // Emit shutdown event
            this.emit('monitor-stopped', {
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
            
        } catch (error) {
            console.error(`Error stopping monitor: ${error.message}`);
        }
    }
    
    // Start WebSocket server
    async startWebSocketServer() {
        return new Promise((resolve, reject) => {
            try {
                this.wsServer = new WebSocket.Server({
                    port: this.config.websocket.port,
                    path: this.config.websocket.path
                });
                
                this.wsServer.on('connection', (ws) => {
                    console.log('📱 New WebSocket client connected');
                    this.clients.add(ws);
                    
                    // Send current status
                    ws.send(JSON.stringify({
                        type: 'status',
                        data: this.getCurrentStatus()
                    }));
                    
                    ws.on('close', () => {
                        console.log('📱 WebSocket client disconnected');
                        this.clients.delete(ws);
                    });
                    
                    ws.on('error', (error) => {
                        console.error(`WebSocket error: ${error.message}`);
                        this.clients.delete(ws);
                    });
                });
                
                this.wsServer.on('listening', () => {
                    console.log(`📡 WebSocket server listening on port ${this.config.websocket.port}`);
                    resolve();
                });
                
                this.wsServer.on('error', reject);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Start monitoring intervals
    startMonitoringIntervals() {
        // Health check interval
        this.intervals.health = setInterval(async () => {
            try {
                const results = await this.healthChecker.runAllChecks();
                this.emit('health-check', results);
                this.broadcastToClients('health-check', results);
            } catch (error) {
                console.error(`Health check error: ${error.message}`);
            }
        }, this.config.intervals.health);
        
        // Performance monitoring interval
        this.intervals.performance = setInterval(async () => {
            try {
                const metrics = await this.collectPerformanceMetrics();
                this.emit('metric', { type: 'performance', data: metrics });
                this.broadcastToClients('performance', metrics);
            } catch (error) {
                console.error(`Performance monitoring error: ${error.message}`);
            }
        }, this.config.intervals.performance);
        
        // Service monitoring interval
        this.intervals.services = setInterval(async () => {
            try {
                const status = await this.checkServicesStatus();
                this.emit('service-status', status);
                this.broadcastToClients('services', status);
            } catch (error) {
                console.error(`Service monitoring error: ${error.message}`);
            }
        }, this.config.intervals.services);
        
        // Cleanup interval
        this.intervals.cleanup = setInterval(async () => {
            try {
                await this.performCleanup();
            } catch (error) {
                console.error(`Cleanup error: ${error.message}`);
            }
        }, this.config.intervals.cleanup);
    }
    
    // Collect performance metrics
    async collectPerformanceMetrics() {
        const timestamp = new Date().toISOString();
        
        const metrics = {
            timestamp,
            system: {
                cpu: {
                    usage: await this.getCpuUsage(),
                    loadAverage: os.loadavg()
                },
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem(),
                    usage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
                },
                uptime: os.uptime()
            },
            process: {
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                cpu: process.cpuUsage()
            },
            network: await this.getNetworkMetrics(),
            disk: await this.getDiskMetrics()
        };
        
        // Store metrics
        this.storeMetric('performance', metrics);
        
        // Check thresholds
        this.checkPerformanceThresholds(metrics);
        
        return metrics;
    }
    
    // Get CPU usage
    async getCpuUsage() {
        return new Promise((resolve) => {
            const startUsage = process.cpuUsage();
            const startTime = process.hrtime();
            
            setTimeout(() => {
                const currentUsage = process.cpuUsage(startUsage);
                const currentTime = process.hrtime(startTime);
                
                const totalTime = currentTime[0] * 1000000 + currentTime[1] / 1000;
                const cpuPercent = ((currentUsage.user + currentUsage.system) / totalTime) * 100;
                
                resolve(Math.min(100, Math.max(0, cpuPercent)));
            }, 100);
        });
    }
    
    // Get network metrics
    async getNetworkMetrics() {
        try {
            const interfaces = os.networkInterfaces();
            const metrics = {};
            
            for (const [name, addresses] of Object.entries(interfaces)) {
                if (addresses) {
                    metrics[name] = {
                        addresses: addresses.length,
                        ipv4: addresses.filter(addr => addr.family === 'IPv4').length,
                        ipv6: addresses.filter(addr => addr.family === 'IPv6').length
                    };
                }
            }
            
            return metrics;
        } catch (error) {
            return { error: error.message };
        }
    }
    
    // Get disk metrics
    async getDiskMetrics() {
        try {
            // This is a simplified implementation
            // In production, you might want to use a library like 'node-disk-info'
            return {
                usage: 50, // Placeholder
                available: '10GB', // Placeholder
                total: '20GB' // Placeholder
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    // Check services status
    async checkServicesStatus() {
        const services = [
            { name: 'Security Service', url: 'http://localhost:3333/api/security/health' },
            { name: 'Authentication', url: 'http://localhost:3333/api/auth/status' },
            { name: 'Dashboard', url: 'http://localhost:3333/dashboard' }
        ];
        
        const results = await Promise.all(
            services.map(async (service) => {
                try {
                    const startTime = Date.now();
                    const response = await fetch(service.url, { timeout: 5000 });
                    const responseTime = Date.now() - startTime;
                    
                    return {
                        name: service.name,
                        status: response.ok ? 'healthy' : 'unhealthy',
                        responseTime,
                        statusCode: response.status,
                        timestamp: new Date().toISOString()
                    };
                } catch (error) {
                    return {
                        name: service.name,
                        status: 'error',
                        error: error.message,
                        timestamp: new Date().toISOString()
                    };
                }
            })
        );
        
        // Update service status tracking
        results.forEach(result => {
            this.updateServiceStatus(result.name, result);
        });
        
        return results;
    }
    
    // Update service status
    updateServiceStatus(serviceName, status) {
        if (!this.services.has(serviceName)) {
            this.services.set(serviceName, {
                name: serviceName,
                history: [],
                consecutiveFailures: 0,
                lastHealthy: null,
                lastUnhealthy: null
            });
        }
        
        const service = this.services.get(serviceName);
        service.history.push(status);
        
        // Keep only recent history
        if (service.history.length > 100) {
            service.history = service.history.slice(-50);
        }
        
        // Update failure count
        if (status.status === 'healthy') {
            service.consecutiveFailures = 0;
            service.lastHealthy = status.timestamp;
        } else {
            service.consecutiveFailures++;
            service.lastUnhealthy = status.timestamp;
            
            // Check if we need to alert
            if (service.consecutiveFailures >= this.config.thresholds.consecutiveFailures) {
                this.emit('alert', {
                    type: 'service-failure',
                    severity: 'critical',
                    service: serviceName,
                    message: `Service ${serviceName} has failed ${service.consecutiveFailures} consecutive times`,
                    data: status,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    
    // Check performance thresholds
    checkPerformanceThresholds(metrics) {
        const alerts = [];
        
        // CPU usage
        if (metrics.system.cpu.usage > this.config.thresholds.cpuUsage) {
            alerts.push({
                type: 'high-cpu',
                severity: 'warning',
                message: `High CPU usage: ${metrics.system.cpu.usage.toFixed(2)}%`,
                threshold: this.config.thresholds.cpuUsage,
                current: metrics.system.cpu.usage
            });
        }
        
        // Memory usage
        if (metrics.system.memory.usage > this.config.thresholds.memoryUsage) {
            alerts.push({
                type: 'high-memory',
                severity: 'warning',
                message: `High memory usage: ${metrics.system.memory.usage.toFixed(2)}%`,
                threshold: this.config.thresholds.memoryUsage,
                current: metrics.system.memory.usage
            });
        }
        
        // Emit alerts
        alerts.forEach(alert => {
            this.emit('alert', {
                ...alert,
                timestamp: new Date().toISOString()
            });
        });
    }
    
    // Handle alert
    async handleAlert(alert) {
        console.log(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
        
        // Store alert
        this.storeAlert(alert);
        
        // Send notifications
        await this.sendNotifications(alert);
        
        // Broadcast to WebSocket clients
        this.broadcastToClients('alert', alert);
    }
    
    // Handle metric
    handleMetric(metric) {
        // Store metric for historical analysis
        this.storeMetric(metric.type, metric.data);
    }
    
    // Handle service status
    handleServiceStatus(status) {
        // Already handled in updateServiceStatus
    }
    
    // Store metric
    storeMetric(type, data) {
        const key = `${type}-${Date.now()}`;
        this.metrics.set(key, {
            type,
            data,
            timestamp: new Date().toISOString()
        });
        
        // Clean old metrics
        this.cleanOldMetrics();
    }
    
    // Store alert
    storeAlert(alert) {
        const key = `alert-${Date.now()}-${Math.random()}`;
        this.alerts.set(key, alert);
        
        // Clean old alerts
        this.cleanOldAlerts();
    }
    
    // Clean old metrics
    cleanOldMetrics() {
        const cutoff = Date.now() - this.config.retention.metrics;
        
        for (const [key, metric] of this.metrics.entries()) {
            if (new Date(metric.timestamp).getTime() < cutoff) {
                this.metrics.delete(key);
            }
        }
    }
    
    // Clean old alerts
    cleanOldAlerts() {
        const cutoff = Date.now() - this.config.retention.alerts;
        
        for (const [key, alert] of this.alerts.entries()) {
            if (new Date(alert.timestamp).getTime() < cutoff) {
                this.alerts.delete(key);
            }
        }
    }
    
    // Send notifications
    async sendNotifications(alert) {
        const notifications = [];
        
        // Email notification
        if (this.config.notifications.email.enabled && this.emailTransporter) {
            notifications.push(this.sendEmailNotification(alert));
        }
        
        // Webhook notification
        if (this.config.notifications.webhook.enabled) {
            notifications.push(this.sendWebhookNotification(alert));
        }
        
        // Slack notification
        if (this.config.notifications.slack.enabled) {
            notifications.push(this.sendSlackNotification(alert));
        }
        
        // Wait for all notifications
        await Promise.allSettled(notifications);
    }
    
    // Send email notification
    async sendEmailNotification(alert) {
        try {
            const subject = `[${alert.severity.toUpperCase()}] Security System Alert: ${alert.type}`;
            const html = `
                <h2>Security System Alert</h2>
                <p><strong>Type:</strong> ${alert.type}</p>
                <p><strong>Severity:</strong> ${alert.severity}</p>
                <p><strong>Message:</strong> ${alert.message}</p>
                <p><strong>Timestamp:</strong> ${alert.timestamp}</p>
                ${alert.data ? `<p><strong>Details:</strong> <pre>${JSON.stringify(alert.data, null, 2)}</pre></p>` : ''}
                <hr>
                <p><small>Git Memory MCP Server Security System</small></p>
            `;
            
            await this.emailTransporter.sendMail({
                from: this.config.notifications.email.from,
                to: this.config.notifications.email.to,
                subject,
                html
            });
            
            console.log('📧 Email notification sent');
            
        } catch (error) {
            console.error(`Failed to send email notification: ${error.message}`);
        }
    }
    
    // Send webhook notification
    async sendWebhookNotification(alert) {
        try {
            const response = await fetch(this.config.notifications.webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    alert,
                    system: 'git-memory-mcp-security',
                    timestamp: new Date().toISOString()
                }),
                timeout: this.config.notifications.webhook.timeout
            });
            
            if (response.ok) {
                console.log('🔗 Webhook notification sent');
            } else {
                console.error(`Webhook notification failed: ${response.status}`);
            }
            
        } catch (error) {
            console.error(`Failed to send webhook notification: ${error.message}`);
        }
    }
    
    // Send Slack notification
    async sendSlackNotification(alert) {
        try {
            const color = {
                critical: 'danger',
                warning: 'warning',
                info: 'good'
            }[alert.severity] || 'warning';
            
            const payload = {
                channel: this.config.notifications.slack.channel,
                username: 'Security Monitor',
                icon_emoji: ':shield:',
                attachments: [{
                    color,
                    title: `Security System Alert: ${alert.type}`,
                    text: alert.message,
                    fields: [
                        {
                            title: 'Severity',
                            value: alert.severity.toUpperCase(),
                            short: true
                        },
                        {
                            title: 'Timestamp',
                            value: alert.timestamp,
                            short: true
                        }
                    ],
                    footer: 'Git Memory MCP Security',
                    ts: Math.floor(Date.now() / 1000)
                }]
            };
            
            const response = await fetch(this.config.notifications.slack.webhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                console.log('💬 Slack notification sent');
            } else {
                console.error(`Slack notification failed: ${response.status}`);
            }
            
        } catch (error) {
            console.error(`Failed to send Slack notification: ${error.message}`);
        }
    }
    
    // Broadcast to WebSocket clients
    broadcastToClients(type, data) {
        if (this.clients.size === 0) return;
        
        const message = JSON.stringify({
            type,
            data,
            timestamp: new Date().toISOString()
        });
        
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                } catch (error) {
                    console.error(`Failed to send message to client: ${error.message}`);
                    this.clients.delete(client);
                }
            }
        });
    }
    
    // Get current status
    getCurrentStatus() {
        return {
            monitor: {
                running: this.isRunning,
                uptime: process.uptime(),
                pid: process.pid,
                version: require('../package.json').version
            },
            services: Array.from(this.services.values()),
            alerts: Array.from(this.alerts.values()).slice(-10), // Last 10 alerts
            metrics: {
                count: this.metrics.size,
                latest: Array.from(this.metrics.values()).slice(-5) // Last 5 metrics
            },
            clients: this.clients.size
        };
    }
    
    // Load historical data
    async loadHistoricalData() {
        try {
            // Load metrics
            const metricsFile = path.join(this.config.paths.data, 'metrics.json');
            try {
                const metricsData = await fs.readFile(metricsFile, 'utf8');
                const metrics = JSON.parse(metricsData);
                metrics.forEach(metric => this.metrics.set(metric.key, metric.data));
                console.log(`📊 Loaded ${metrics.length} historical metrics`);
            } catch (error) {
                // File doesn't exist or is invalid, that's okay
            }
            
            // Load alerts
            const alertsFile = path.join(this.config.paths.data, 'alerts.json');
            try {
                const alertsData = await fs.readFile(alertsFile, 'utf8');
                const alerts = JSON.parse(alertsData);
                alerts.forEach(alert => this.alerts.set(alert.key, alert.data));
                console.log(`🚨 Loaded ${alerts.length} historical alerts`);
            } catch (error) {
                // File doesn't exist or is invalid, that's okay
            }
            
        } catch (error) {
            console.error(`Failed to load historical data: ${error.message}`);
        }
    }
    
    // Save current data
    async saveCurrentData() {
        try {
            // Save metrics
            const metricsData = Array.from(this.metrics.entries()).map(([key, data]) => ({ key, data }));
            const metricsFile = path.join(this.config.paths.data, 'metrics.json');
            await fs.writeFile(metricsFile, JSON.stringify(metricsData, null, 2));
            
            // Save alerts
            const alertsData = Array.from(this.alerts.entries()).map(([key, data]) => ({ key, data }));
            const alertsFile = path.join(this.config.paths.data, 'alerts.json');
            await fs.writeFile(alertsFile, JSON.stringify(alertsData, null, 2));
            
            console.log('💾 Current data saved');
            
        } catch (error) {
            console.error(`Failed to save current data: ${error.message}`);
        }
    }
    
    // Perform cleanup
    async performCleanup() {
        try {
            // Clean old metrics and alerts
            this.cleanOldMetrics();
            this.cleanOldAlerts();
            
            // Clean old log files
            await this.cleanOldLogs();
            
            // Save current state
            await this.saveCurrentData();
            
            console.log('🧹 Cleanup completed');
            
        } catch (error) {
            console.error(`Cleanup error: ${error.message}`);
        }
    }
    
    // Clean old log files
    async cleanOldLogs() {
        try {
            const logsDir = this.config.paths.logs;
            const files = await fs.readdir(logsDir);
            const cutoff = Date.now() - this.config.retention.logs;
            
            for (const file of files) {
                const filePath = path.join(logsDir, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtime.getTime() < cutoff) {
                    await fs.unlink(filePath);
                    console.log(`🗑️  Deleted old log file: ${file}`);
                }
            }
            
        } catch (error) {
            // Directory might not exist, that's okay
        }
    }
    
    // Generate report
    async generateReport(timeRange = '24h') {
        const now = Date.now();
        const ranges = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };
        
        const cutoff = now - (ranges[timeRange] || ranges['24h']);
        
        // Filter data by time range
        const metrics = Array.from(this.metrics.values())
            .filter(m => new Date(m.timestamp).getTime() >= cutoff);
        
        const alerts = Array.from(this.alerts.values())
            .filter(a => new Date(a.timestamp).getTime() >= cutoff);
        
        const report = {
            timeRange,
            period: {
                start: new Date(cutoff).toISOString(),
                end: new Date(now).toISOString()
            },
            summary: {
                totalMetrics: metrics.length,
                totalAlerts: alerts.length,
                alertsBySeverity: {
                    critical: alerts.filter(a => a.severity === 'critical').length,
                    warning: alerts.filter(a => a.severity === 'warning').length,
                    info: alerts.filter(a => a.severity === 'info').length
                },
                services: Array.from(this.services.values()).map(service => ({
                    name: service.name,
                    consecutiveFailures: service.consecutiveFailures,
                    lastHealthy: service.lastHealthy,
                    lastUnhealthy: service.lastUnhealthy,
                    uptime: this.calculateServiceUptime(service, cutoff)
                }))
            },
            metrics,
            alerts,
            generatedAt: new Date().toISOString()
        };
        
        // Save report
        const reportFile = path.join(
            this.config.paths.reports,
            `status-report-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
        );
        
        await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
        
        return report;
    }
    
    // Calculate service uptime
    calculateServiceUptime(service, since) {
        const relevantHistory = service.history.filter(
            h => new Date(h.timestamp).getTime() >= since
        );
        
        if (relevantHistory.length === 0) {
            return 100;
        }
        
        const healthyCount = relevantHistory.filter(h => h.status === 'healthy').length;
        return (healthyCount / relevantHistory.length) * 100;
    }
}

// =============================================================================
// CLI Interface
// =============================================================================
function showUsage() {
    console.log(`
Usage: node status-monitor.js [COMMAND] [OPTIONS]

Real-time status monitoring for Git Memory MCP Server Security System

Commands:
    start           Start the status monitor
    stop            Stop the status monitor
    status          Show current status
    report [RANGE]  Generate status report (1h, 24h, 7d, 30d)
    test            Test notifications
    help            Show this help message

Options:
    --config FILE   Configuration file path
    --daemon        Run as daemon (background process)
    --verbose       Enable verbose output
    --port PORT     WebSocket server port (default: 8080)

Examples:
    node status-monitor.js start                    # Start monitoring
    node status-monitor.js start --daemon           # Start as daemon
    node status-monitor.js report 24h               # Generate 24h report
    node status-monitor.js test                     # Test notifications
    node status-monitor.js status                   # Show current status

Environment Variables:
    EMAIL_NOTIFICATIONS=true/false
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
    WEBHOOK_NOTIFICATIONS=true/false
    WEBHOOK_URL
    SLACK_NOTIFICATIONS=true/false
    SLACK_WEBHOOK_URL, SLACK_CHANNEL
`);
}

// Parse command line arguments
function parseArguments() {
    const args = process.argv.slice(2);
    const options = {
        command: 'start',
        config: null,
        daemon: false,
        verbose: false,
        port: null,
        timeRange: '24h'
    };
    
    if (args.length > 0) {
        options.command = args[0];
    }
    
    for (let i = 1; i < args.length; i++) {
        switch (args[i]) {
            case '--config':
                options.config = args[++i];
                break;
            case '--daemon':
                options.daemon = true;
                break;
            case '--verbose':
                options.verbose = true;
                break;
            case '--port':
                options.port = parseInt(args[++i]);
                break;
            default:
                if (options.command === 'report' && !args[i].startsWith('--')) {
                    options.timeRange = args[i];
                }
                break;
        }
    }
    
    return options;
}

// Main function
async function main() {
    const options = parseArguments();
    
    if (options.command === 'help') {
        showUsage();
        process.exit(0);
    }
    
    try {
        // Load custom config if provided
        let config = CONFIG;
        if (options.config) {
            const customConfig = require(path.resolve(options.config));
            config = { ...CONFIG, ...customConfig };
        }
        
        // Override port if provided
        if (options.port) {
            config.websocket.port = options.port;
        }
        
        const monitor = new StatusMonitor(config);
        
        switch (options.command) {
            case 'start':
                if (options.daemon) {
                    // Run as daemon (simplified)
                    process.stdout.write('Starting status monitor as daemon...\n');
                }
                await monitor.start();
                break;
                
            case 'stop':
                // In a real implementation, you'd send a signal to the running process
                console.log('Stop command would signal the running monitor to stop');
                break;
                
            case 'status':
                const status = monitor.getCurrentStatus();
                console.log(JSON.stringify(status, null, 2));
                break;
                
            case 'report':
                const report = await monitor.generateReport(options.timeRange);
                console.log(`Report generated for ${options.timeRange}:`);
                console.log(JSON.stringify(report.summary, null, 2));
                break;
                
            case 'test':
                console.log('Testing notifications...');
                await monitor.sendNotifications({
                    type: 'test',
                    severity: 'info',
                    message: 'This is a test notification from Status Monitor',
                    timestamp: new Date().toISOString()
                });
                console.log('Test notifications sent');
                break;
                
            default:
                console.error(`Unknown command: ${options.command}`);
                showUsage();
                process.exit(1);
        }
        
    } catch (error) {
        console.error(`Status monitor error: ${error.message}`);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error(`Fatal error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { StatusMonitor, CONFIG };