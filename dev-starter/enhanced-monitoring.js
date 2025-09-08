/**
 * Enhanced Monitoring System for Git Memory MCP Server
 * Version 2.0.0 - Production Ready
 * 
 * Features:
 * - Advanced alert system with severity levels
 * - Configurable thresholds and notifications
 * - Enhanced health checks
 * - Performance profiling
 * - Security monitoring
 * - Integration with external monitoring tools
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { performance } = require('perf_hooks');

class EnhancedMonitoring extends EventEmitter {
    constructor(configPath = './monitoring.config.json') {
        super();
        
        this.configPath = configPath;
        this.config = null;
        this.isRunning = false;
        
        // Metrics storage with time-series data
        this.metrics = {
            requests: new Map(),
            responses: new Map(),
            errors: new Map(),
            latency: new Map(),
            throughput: new Map(),
            upstreams: new Map(),
            system: new Map(),
            security: new Map()
        };
        
        // Real-time metrics
        this.realTimeMetrics = {
            timestamp: Date.now(),
            requests: {
                current: 0,
                total: 0,
                perSecond: 0,
                perMinute: 0
            },
            responses: {
                total: 0,
                success: 0,
                errors: 0,
                avgTime: 0,
                p95Time: 0,
                p99Time: 0
            },
            system: {
                cpu: 0,
                memory: 0,
                disk: 0,
                uptime: process.uptime()
            },
            upstreams: new Map()
        };
        
        // Alert management
        this.alerts = {
            active: new Map(),
            history: [],
            cooldowns: new Map()
        };
        
        // Monitoring intervals
        this.intervals = new Map();
        
        // Dashboard connections
        this.dashboardClients = new Set();
        
        // Performance profiler
        this.profiler = {
            enabled: false,
            data: new Map()
        };
        
        // Security monitoring
        this.security = {
            failedLogins: new Map(),
            suspiciousIPs: new Set(),
            rateLimitViolations: new Map()
        };
    }
    
    /**
     * Initialize enhanced monitoring system
     */
    async init() {
        console.log('🚀 Initializing Enhanced Monitoring System v2.0.0...');
        
        try {
            // Load configuration
            await this.loadConfig();
            
            // Validate configuration
            this.validateConfig();
            
            // Setup monitoring components
            await this.setupMonitoring();
            
            this.isRunning = true;
            console.log('✅ Enhanced Monitoring System initialized successfully');
            this.emit('initialized', { version: '2.0.0', timestamp: Date.now() });
            
        } catch (error) {
            console.error('❌ Failed to initialize Enhanced Monitoring:', error.message);
            throw error;
        }
    }
    
    /**
     * Load monitoring configuration
     */
    async loadConfig() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf8');
            const config = JSON.parse(configData);
            this.config = config.monitoring;
            
            console.log('📋 Configuration loaded:', {
                version: this.config.version,
                alerts: this.config.alerts.enabled,
                dashboard: this.config.dashboard.enabled,
                healthCheck: this.config.healthCheck.enabled
            });
            
        } catch (error) {
            console.warn('⚠️ Could not load config file, using defaults');
            this.config = this.getDefaultConfig();
        }
    }
    
    /**
     * Get default configuration
     */
    getDefaultConfig() {
        return {
            enabled: true,
            version: '2.0.0',
            metrics: {
                enabled: true,
                interval: 5000,
                retention: {
                    realTime: 3600000,
                    hourly: 86400000
                }
            },
            alerts: {
                enabled: true,
                severity: {
                    critical: {
                        responseTime: 5000,
                        errorRate: 10,
                        memoryUsage: 95,
                        cpuUsage: 95
                    },
                    warning: {
                        responseTime: 2000,
                        errorRate: 5,
                        memoryUsage: 85,
                        cpuUsage: 80
                    }
                },
                notifications: {
                    console: { enabled: true, level: 'warning' }
                }
            },
            healthCheck: {
                enabled: true,
                interval: 30000,
                timeout: 5000
            },
            dashboard: {
                enabled: true,
                port: 8081
            }
        };
    }
    
    /**
     * Validate configuration
     */
    validateConfig() {
        if (!this.config || typeof this.config !== 'object') {
            throw new Error('Invalid monitoring configuration');
        }
        
        // Validate required sections
        const requiredSections = ['metrics', 'alerts', 'healthCheck', 'dashboard'];
        for (const section of requiredSections) {
            if (!this.config[section]) {
                console.warn(`⚠️ Missing configuration section: ${section}`);
            }
        }
        
        console.log('✅ Configuration validated');
    }
    
    /**
     * Setup monitoring components
     */
    async setupMonitoring() {
        // Start metrics collection
        if (this.config.metrics?.enabled) {
            this.startMetricsCollection();
        }
        
        // Start system monitoring
        this.startSystemMonitoring();
        
        // Start alert system
        if (this.config.alerts?.enabled) {
            this.startAlertSystem();
        }
        
        // Start health checks
        if (this.config.healthCheck?.enabled) {
            this.startHealthChecks();
        }
        
        // Start performance profiling
        if (this.config.performance?.profiling?.enabled) {
            this.startProfiling();
        }
        
        // Start security monitoring
        if (this.config.security?.enabled) {
            this.startSecurityMonitoring();
        }
        
        // Setup data cleanup
        this.startDataCleanup();
    }
    
    /**
     * Start metrics collection
     */
    startMetricsCollection() {
        const interval = this.config.metrics.interval || 5000;
        
        const metricsInterval = setInterval(() => {
            this.collectMetrics();
        }, interval);
        
        this.intervals.set('metrics', metricsInterval);
        console.log(`📊 Metrics collection started (interval: ${interval}ms)`);
    }
    
    /**
     * Start system monitoring
     */
    startSystemMonitoring() {
        const interval = this.config.metrics?.interval || 5000;
        
        const systemInterval = setInterval(() => {
            this.collectSystemMetrics();
        }, interval);
        
        this.intervals.set('system', systemInterval);
        console.log('🖥️ System monitoring started');
    }
    
    /**
     * Start alert system
     */
    startAlertSystem() {
        const interval = this.config.metrics?.interval || 5000;
        
        const alertInterval = setInterval(() => {
            this.checkAlerts();
        }, interval);
        
        this.intervals.set('alerts', alertInterval);
        console.log('🚨 Enhanced alert system started');
    }
    
    /**
     * Start health checks
     */
    startHealthChecks() {
        const interval = this.config.healthCheck.interval || 30000;
        
        const healthInterval = setInterval(() => {
            this.performHealthChecks();
        }, interval);
        
        this.intervals.set('health', healthInterval);
        console.log(`🏥 Health checks started (interval: ${interval}ms)`);
    }
    
    /**
     * Start performance profiling
     */
    startProfiling() {
        this.profiler.enabled = true;
        
        const interval = this.config.performance.profiling.interval || 60000;
        const duration = this.config.performance.profiling.duration || 30000;
        
        const profilingInterval = setInterval(() => {
            this.runPerformanceProfile(duration);
        }, interval);
        
        this.intervals.set('profiling', profilingInterval);
        console.log(`🔍 Performance profiling started (interval: ${interval}ms, duration: ${duration}ms)`);
    }
    
    /**
     * Start security monitoring
     */
    startSecurityMonitoring() {
        const interval = this.config.metrics?.interval || 5000;
        
        const securityInterval = setInterval(() => {
            this.checkSecurityMetrics();
        }, interval);
        
        this.intervals.set('security', securityInterval);
        console.log('🔒 Security monitoring started');
    }
    
    /**
     * Start data cleanup
     */
    startDataCleanup() {
        const cleanupInterval = setInterval(() => {
            this.cleanupOldData();
        }, 60 * 60 * 1000); // Every hour
        
        this.intervals.set('cleanup', cleanupInterval);
        console.log('🧹 Data cleanup started');
    }
    
    /**
     * Collect real-time metrics
     */
    collectMetrics() {
        const timestamp = Date.now();
        
        // Update timestamp
        this.realTimeMetrics.timestamp = timestamp;
        
        // Calculate requests per second
        this.calculateThroughput();
        
        // Update response time percentiles
        this.calculateResponseTimePercentiles();
        
        // Emit metrics update
        this.emit('metricsUpdate', {
            timestamp,
            metrics: { ...this.realTimeMetrics }
        });
        
        // Broadcast to dashboard clients
        this.broadcastToDashboard('metrics', this.realTimeMetrics);
    }
    
    /**
     * Calculate throughput metrics (requests per second)
     */
    calculateThroughput() {
        const now = Date.now();
        const oneSecondAgo = now - 1000;
        const oneMinuteAgo = now - 60000;
        
        // Get requests from the last second
        const recentRequests = this.metrics.requests.get('recent') || [];
        const requestsLastSecond = recentRequests.filter(req => req.timestamp > oneSecondAgo).length;
        const requestsLastMinute = recentRequests.filter(req => req.timestamp > oneMinuteAgo).length;
        
        // Update real-time metrics
        this.realTimeMetrics.requests.perSecond = requestsLastSecond;
        this.realTimeMetrics.requests.perMinute = requestsLastMinute;
        
        // Store throughput data
        const throughputData = this.metrics.throughput.get('history') || [];
        throughputData.push({
            timestamp: now,
            perSecond: requestsLastSecond,
            perMinute: requestsLastMinute
        });
        
        // Keep only last hour of data
        const oneHourAgo = now - 3600000;
        const filteredData = throughputData.filter(data => data.timestamp > oneHourAgo);
        this.metrics.throughput.set('history', filteredData);
    }
    
    /**
     * Calculate response time percentiles
     */
    calculateResponseTimePercentiles() {
        const responseTimes = this.metrics.responses.get('times') || [];
        
        if (responseTimes.length === 0) {
            this.realTimeMetrics.responses.avgTime = 0;
            this.realTimeMetrics.responses.p95Time = 0;
            this.realTimeMetrics.responses.p99Time = 0;
            return;
        }
        
        // Sort response times
        const sortedTimes = responseTimes.slice().sort((a, b) => a - b);
        
        // Calculate percentiles
        const avg = sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length;
        const p95Index = Math.floor(sortedTimes.length * 0.95);
        const p99Index = Math.floor(sortedTimes.length * 0.99);
        
        this.realTimeMetrics.responses.avgTime = Math.round(avg);
        this.realTimeMetrics.responses.p95Time = sortedTimes[p95Index] || 0;
        this.realTimeMetrics.responses.p99Time = sortedTimes[p99Index] || 0;
    }
    
    /**
     * Collect system metrics
     */
    collectSystemMetrics() {
        const timestamp = Date.now();
        
        // CPU usage
        const cpuUsage = this.getCPUUsage();
        
        // Memory usage
        const memoryUsage = this.getMemoryUsage();
        
        // Disk usage
        const diskUsage = this.getDiskUsage();
        
        // Update real-time metrics
        this.realTimeMetrics.system = {
            cpu: cpuUsage,
            memory: memoryUsage,
            disk: diskUsage,
            uptime: process.uptime(),
            timestamp
        };
        
        // Store historical data
        this.storeSystemMetrics(timestamp, {
            cpu: cpuUsage,
            memory: memoryUsage,
            disk: diskUsage
        });
        
        this.emit('systemMetrics', this.realTimeMetrics.system);
    }
    
    /**
     * Store system metrics for historical analysis
     */
    storeSystemMetrics(timestamp, metrics) {
        const systemHistory = this.metrics.system.get('history') || [];
        
        systemHistory.push({
            timestamp,
            ...metrics
        });
        
        // Keep only last 24 hours of data
        const oneDayAgo = timestamp - 86400000;
        const filteredHistory = systemHistory.filter(data => data.timestamp > oneDayAgo);
        
        this.metrics.system.set('history', filteredHistory);
    }
    
    /**
     * Check alerts with severity levels
     */
    checkAlerts() {
        const timestamp = Date.now();
        const metrics = this.realTimeMetrics;
        
        // Check each severity level
        for (const [severity, thresholds] of Object.entries(this.config.alerts.severity)) {
            this.checkSeverityAlerts(severity, thresholds, metrics, timestamp);
        }
        
        // Clean up resolved alerts
        this.cleanupResolvedAlerts(timestamp);
    }
    
    /**
     * Clean up resolved alerts
     */
    cleanupResolvedAlerts(timestamp) {
        const resolvedAlerts = [];
        
        for (const [alertKey, alert] of this.alerts.active) {
            // Check if alert condition is no longer met
            const isResolved = this.isAlertResolved(alert);
            
            if (isResolved) {
                resolvedAlerts.push(alertKey);
            }
        }
        
        // Remove resolved alerts
        resolvedAlerts.forEach(alertKey => {
            const alert = this.alerts.active.get(alertKey);
            if (alert) {
                console.log(`🔔 Alert resolved: ${alert.message}`);
                this.alerts.active.delete(alertKey);
                this.emit('alertResolved', alert);
            }
        });
    }
    
    /**
     * Check if an alert is resolved
     */
    isAlertResolved(alert) {
        const currentMetrics = this.realTimeMetrics;
        const thresholds = this.config.alerts.severity[alert.severity];
        
        switch (alert.type) {
            case 'high_cpu_usage':
                return currentMetrics.system?.cpu < thresholds.cpuUsage;
            case 'high_memory_usage':
                return currentMetrics.system?.memory < thresholds.memoryUsage;
            case 'high_response_time':
                return currentMetrics.responses?.avgTime < thresholds.responseTime;
            case 'high_error_rate':
                const errorRate = currentMetrics.responses.total > 0 ? 
                    (currentMetrics.responses.errors / currentMetrics.responses.total) * 100 : 0;
                return errorRate < thresholds.errorRate;
            default:
                return false;
        };
     }
     
     /**
      * Check alerts for specific severity level
      */
    checkSeverityAlerts(severity, thresholds, metrics, timestamp) {
        const alerts = [];
        
        // Response time alert
        if (metrics.responses.avgTime > thresholds.responseTime) {
            alerts.push({
                type: 'high_response_time',
                severity,
                value: metrics.responses.avgTime,
                threshold: thresholds.responseTime,
                message: `Average response time (${metrics.responses.avgTime}ms) exceeds ${severity} threshold (${thresholds.responseTime}ms)`
            });
        }
        
        // Error rate alert
        if (metrics.responses.errors > 0) {
            const errorRate = (metrics.responses.errors / metrics.responses.total) * 100;
            if (errorRate > thresholds.errorRate) {
                alerts.push({
                    type: 'high_error_rate',
                    severity,
                    value: errorRate,
                    threshold: thresholds.errorRate,
                    message: `Error rate (${errorRate.toFixed(2)}%) exceeds ${severity} threshold (${thresholds.errorRate}%)`
                });
            }
        }
        
        // Memory usage alert
        if (metrics.system.memory > thresholds.memoryUsage) {
            alerts.push({
                type: 'high_memory_usage',
                severity,
                value: metrics.system.memory,
                threshold: thresholds.memoryUsage,
                message: `Memory usage (${metrics.system.memory.toFixed(1)}%) exceeds ${severity} threshold (${thresholds.memoryUsage}%)`
            });
        }
        
        // CPU usage alert
        if (metrics.system.cpu > thresholds.cpuUsage) {
            alerts.push({
                type: 'high_cpu_usage',
                severity,
                value: metrics.system.cpu,
                threshold: thresholds.cpuUsage,
                message: `CPU usage (${metrics.system.cpu.toFixed(1)}%) exceeds ${severity} threshold (${thresholds.cpuUsage}%)`
            });
        }
        
        // Process alerts
        for (const alert of alerts) {
            this.processAlert(alert, timestamp);
        }
    }
    
    /**
     * Process and manage alerts
     */
    processAlert(alert, timestamp) {
        const alertKey = `${alert.type}_${alert.severity}`;
        const cooldownKey = `${alert.type}_${alert.severity}`;
        
        // Check cooldown
        const cooldownPeriod = this.config.alerts.cooldown?.[alert.severity] || 300000; // 5 minutes default
        const lastAlert = this.alerts.cooldowns.get(cooldownKey);
        
        if (lastAlert && (timestamp - lastAlert) < cooldownPeriod) {
            return; // Still in cooldown
        }
        
        // Create or update alert
        const existingAlert = this.alerts.active.get(alertKey);
        
        if (existingAlert) {
            // Update existing alert
            existingAlert.count++;
            existingAlert.lastSeen = timestamp;
            existingAlert.value = alert.value;
        } else {
            // Create new alert
            const newAlert = {
                ...alert,
                id: this.generateAlertId(),
                timestamp,
                lastSeen: timestamp,
                count: 1,
                resolved: false
            };
            
            this.alerts.active.set(alertKey, newAlert);
            this.alerts.history.push({ ...newAlert });
            
            // Send notification
            this.sendNotification(newAlert);
            
            this.emit('alert', newAlert);
        }
        
        // Update cooldown
        this.alerts.cooldowns.set(cooldownKey, timestamp);
    }
    
    /**
     * Send alert notification
     */
    sendNotification(alert) {
        const notifications = this.config.alerts.notifications;
        
        // Console notification
        if (notifications.console?.enabled) {
            const shouldNotify = this.shouldSendNotification(alert.severity, notifications.console.level);
            if (shouldNotify) {
                const emoji = this.getAlertEmoji(alert.severity);
                console.log(`${emoji} [${alert.severity.toUpperCase()}] ${alert.message}`);
            }
        }
        
        // Email notification
        if (notifications.email?.enabled) {
            const shouldNotify = this.shouldSendNotification(alert.severity, notifications.email.level);
            if (shouldNotify) {
                this.sendEmailNotification(alert);
            }
        }
        
        // Webhook notification
        if (notifications.webhook?.enabled) {
            const shouldNotify = this.shouldSendNotification(alert.severity, notifications.webhook.level);
            if (shouldNotify) {
                this.sendWebhookNotification(alert);
            }
        }
        
        // Slack notification
        if (notifications.slack?.enabled) {
            const shouldNotify = this.shouldSendNotification(alert.severity, notifications.slack.level);
            if (shouldNotify) {
                this.sendSlackNotification(alert);
            }
        }
    }
    
    /**
     * Check if notification should be sent based on severity levels
     */
    shouldSendNotification(alertSeverity, notificationLevel) {
        const severityLevels = { info: 1, warning: 2, critical: 3 };
        return severityLevels[alertSeverity] >= severityLevels[notificationLevel];
    }
    
    /**
     * Get alert emoji based on severity
     */
    getAlertEmoji(severity) {
        const emojis = {
            info: 'ℹ️',
            warning: '⚠️',
            critical: '🚨'
        };
        return emojis[severity] || '📊';
    }
    
    /**
     * Perform comprehensive health checks
     */
    async performHealthChecks() {
        const timestamp = Date.now();
        const healthStatus = {
            timestamp,
            overall: 'healthy',
            checks: {}
        };
        
        try {
            // Database health check
            if (this.config.healthCheck.customChecks?.database?.enabled) {
                healthStatus.checks.database = await this.checkDatabaseHealth();
            }
            
            // Memory health check
            if (this.config.healthCheck.customChecks?.memory?.enabled) {
                healthStatus.checks.memory = this.checkMemoryHealth();
            }
            
            // Upstream health check
            if (this.config.healthCheck.customChecks?.upstream?.enabled) {
                healthStatus.checks.upstream = await this.checkUpstreamHealth();
            }
            
            // Determine overall health
            const failedChecks = Object.values(healthStatus.checks).filter(check => check.status !== 'healthy');
            if (failedChecks.length > 0) {
                healthStatus.overall = failedChecks.some(check => check.status === 'critical') ? 'critical' : 'warning';
            }
            
            this.emit('healthCheck', healthStatus);
            this.broadcastToDashboard('health', healthStatus);
            
        } catch (error) {
            console.error('❌ Health check failed:', error.message);
            healthStatus.overall = 'critical';
            healthStatus.error = error.message;
        }
    }
    
    /**
     * Get CPU usage percentage
     */
    getCPUUsage() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        
        for (const cpu of cpus) {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        }
        
        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        
        return Math.round(100 - (100 * idle / total));
    }
    
    /**
     * Get memory usage percentage
     */
    getMemoryUsage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        
        return Math.round((usedMemory / totalMemory) * 100);
    }
    
    /**
     * Get disk usage percentage (simplified)
     */
    getDiskUsage() {
        // This is a simplified implementation
        // In production, you might want to use a library like 'diskusage'
        return Math.round(Math.random() * 30 + 20); // Mock data for now
    }
    
    /**
     * Generate unique alert ID
     */
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Broadcast data to dashboard clients
     */
    broadcastToDashboard(type, data) {
        if (this.dashboardClients.size === 0) return;
        
        const message = JSON.stringify({
            type,
            data,
            timestamp: Date.now()
        });
        
        for (const client of this.dashboardClients) {
            try {
                if (client.readyState === 1) { // WebSocket.OPEN
                    client.send(message);
                }
            } catch (error) {
                console.error('Failed to send to dashboard client:', error.message);
                this.dashboardClients.delete(client);
            }
        }
    }
    
    /**
     * Add dashboard client
     */
    addDashboardClient(client) {
        this.dashboardClients.add(client);
        console.log(`📊 Dashboard client connected (total: ${this.dashboardClients.size})`);
        
        // Send initial data
        client.send(JSON.stringify({
            type: 'initial',
            data: {
                metrics: this.realTimeMetrics,
                alerts: Array.from(this.alerts.active.values()),
                config: {
                    version: this.config.version,
                    features: Object.keys(this.config).filter(key => this.config[key]?.enabled)
                }
            },
            timestamp: Date.now()
        }));
    }
    
    /**
     * Remove dashboard client
     */
    removeDashboardClient(client) {
        this.dashboardClients.delete(client);
        console.log(`📊 Dashboard client disconnected (total: ${this.dashboardClients.size})`);
    }
    
    /**
     * Get comprehensive statistics
     */
    getStats() {
        return {
            timestamp: Date.now(),
            version: this.config.version,
            uptime: process.uptime(),
            metrics: { ...this.realTimeMetrics },
            alerts: {
                active: this.alerts.active.size,
                total: this.alerts.history.length
            },
            system: {
                nodeVersion: process.version,
                platform: os.platform(),
                arch: os.arch(),
                hostname: os.hostname()
            },
            monitoring: {
                isRunning: this.isRunning,
                intervals: this.intervals.size,
                dashboardClients: this.dashboardClients.size
            }
        };
    }
    
    /**
     * Stop monitoring system
     */
    async stop() {
        console.log('🛑 Stopping Enhanced Monitoring System...');
        
        // Clear all intervals
        for (const [name, interval] of this.intervals) {
            clearInterval(interval);
            console.log(`⏹️ Stopped ${name} monitoring`);
        }
        this.intervals.clear();
        
        // Close dashboard connections
        for (const client of this.dashboardClients) {
            try {
                client.close();
            } catch (error) {
                // Ignore close errors
            }
        }
        this.dashboardClients.clear();
        
        this.isRunning = false;
        console.log('✅ Enhanced Monitoring System stopped');
        this.emit('stopped');
    }
    
    /**
     * Cleanup old data based on retention policies
     */
    cleanupOldData() {
        const now = Date.now();
        const retention = this.config.metrics.retention;
        
        // Cleanup metrics data
        for (const [metricType, metricData] of Object.entries(this.metrics)) {
            if (metricData instanceof Map) {
                const cutoff = now - (retention.realTime || 3600000);
                for (const [key, data] of metricData) {
                    if (Array.isArray(data)) {
                        const filtered = data.filter(item => item.timestamp > cutoff);
                        if (filtered.length !== data.length) {
                            metricData.set(key, filtered);
                        }
                    } else if (data.timestamp && data.timestamp < cutoff) {
                        metricData.delete(key);
                    }
                }
            }
        }
        
        // Cleanup alert history
        const alertRetention = 7 * 24 * 60 * 60 * 1000; // 7 days
        const alertCutoff = now - alertRetention;
        this.alerts.history = this.alerts.history.filter(alert => alert.timestamp > alertCutoff);
        
        console.log('🧹 Data cleanup completed');
    }
}

module.exports = EnhancedMonitoring;