/**
 * Git Memory MCP Server - API Gateway Monitoring System
 * ระบบตรวจสอบและรายงานสำหรับ API Gateway
 * 
 * Features:
 * - Real-time metrics collection
 * - Performance monitoring
 * - Health status tracking
 * - Alert system
 * - Dashboard data provider
 * - Log aggregation
 * - SLA monitoring
 * - Resource usage tracking
 * - Custom metrics
 * - Historical data analysis
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class APIGatewayMonitoring extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            metricsInterval: 5000,
            retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
            alertThresholds: {
                responseTime: 5000,
                errorRate: 5,
                cpuUsage: 80,
                memoryUsage: 80,
                diskUsage: 90
            },
            enableAlerts: true,
            enableDashboard: true,
            logLevel: 'info',
            ...config
        };
        
        // Metrics storage
        this.metrics = {
            requests: new Map(),
            responses: new Map(),
            errors: new Map(),
            latency: new Map(),
            throughput: new Map(),
            upstreams: new Map(),
            system: new Map()
        };
        
        // Real-time data
        this.realTimeMetrics = {
            currentRequests: 0,
            totalRequests: 0,
            totalResponses: 0,
            totalErrors: 0,
            avgResponseTime: 0,
            requestsPerSecond: 0,
            errorRate: 0,
            uptime: Date.now()
        };
        
        // Alert state
        this.alerts = new Map();
        this.alertHistory = [];
        
        // Monitoring intervals
        this.intervals = new Map();
        
        // Dashboard clients
        this.dashboardClients = new Set();
        
        this.init();
    }
    
    /**
     * Initialize monitoring system
     */
    async init() {
        console.log('📊 Initializing API Gateway Monitoring...');
        
        try {
            // Setup metrics collection
            this.startMetricsCollection();
            
            // Setup system monitoring
            this.startSystemMonitoring();
            
            // Setup alert system
            if (this.config.enableAlerts) {
                this.startAlertSystem();
            }
            
            // Setup data cleanup
            this.startDataCleanup();
            
            console.log('✅ API Gateway Monitoring initialized');
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize monitoring:', error.message);
            throw error;
        }
    }
    
    /**
     * Start metrics collection
     */
    startMetricsCollection() {
        const interval = setInterval(() => {
            this.collectMetrics();
        }, this.config.metricsInterval);
        
        this.intervals.set('metrics', interval);
        console.log('📈 Metrics collection started');
    }
    
    /**
     * Start system monitoring
     */
    startSystemMonitoring() {
        const interval = setInterval(() => {
            this.collectSystemMetrics();
        }, this.config.metricsInterval);
        
        this.intervals.set('system', interval);
        console.log('🖥️ System monitoring started');
    }
    
    /**
     * Start alert system
     */
    startAlertSystem() {
        const interval = setInterval(() => {
            this.checkAlerts();
        }, this.config.metricsInterval);
        
        this.intervals.set('alerts', interval);
        console.log('🚨 Alert system started');
    }
    
    /**
     * Start data cleanup
     */
    startDataCleanup() {
        const interval = setInterval(() => {
            this.cleanupOldData();
        }, 60 * 60 * 1000); // Every hour
        
        this.intervals.set('cleanup', interval);
        console.log('🧹 Data cleanup started');
    }
    
    /**
     * Record request start
     */
    recordRequestStart(req) {
        const requestId = this.generateRequestId();
        const timestamp = Date.now();
        
        req.monitoringId = requestId;
        req.startTime = timestamp;
        
        // Update real-time metrics
        this.realTimeMetrics.currentRequests++;
        this.realTimeMetrics.totalRequests++;
        
        // Store request data
        this.metrics.requests.set(requestId, {
            id: requestId,
            method: req.method,
            url: req.url,
            headers: req.headers,
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.connection.remoteAddress,
            startTime: timestamp,
            route: req.route?.path,
            upstream: req.upstream?.id
        });
        
        this.emit('requestStart', {
            requestId,
            method: req.method,
            url: req.url,
            timestamp
        });
        
        return requestId;
    }
    
    /**
     * Record request end
     */
    recordRequestEnd(req, res, error = null) {
        const requestId = req.monitoringId;
        const endTime = Date.now();
        const startTime = req.startTime;
        const responseTime = endTime - startTime;
        
        if (!requestId) {
            return;
        }
        
        // Update real-time metrics
        this.realTimeMetrics.currentRequests--;
        this.realTimeMetrics.totalResponses++;
        
        if (error) {
            this.realTimeMetrics.totalErrors++;
        }
        
        // Update average response time
        const totalResponses = this.realTimeMetrics.totalResponses;
        this.realTimeMetrics.avgResponseTime = 
            (this.realTimeMetrics.avgResponseTime * (totalResponses - 1) + responseTime) / totalResponses;
        
        // Calculate error rate
        this.realTimeMetrics.errorRate = 
            (this.realTimeMetrics.totalErrors / this.realTimeMetrics.totalRequests) * 100;
        
        // Store response data
        this.metrics.responses.set(requestId, {
            requestId,
            statusCode: res.statusCode,
            responseTime,
            contentLength: res.get('content-length') || 0,
            endTime,
            error: error ? {
                message: error.message,
                stack: error.stack,
                code: error.code
            } : null
        });
        
        // Store latency data
        this.recordLatency(responseTime, req.route?.path);
        
        // Store error if present
        if (error) {
            this.recordError(error, req, res);
        }
        
        this.emit('requestEnd', {
            requestId,
            statusCode: res.statusCode,
            responseTime,
            error: error?.message
        });
    }
    
    /**
     * Record upstream metrics
     */
    recordUpstreamMetrics(upstreamId, metrics) {
        const timestamp = Date.now();
        
        if (!this.metrics.upstreams.has(upstreamId)) {
            this.metrics.upstreams.set(upstreamId, []);
        }
        
        const upstreamMetrics = this.metrics.upstreams.get(upstreamId);
        upstreamMetrics.push({
            timestamp,
            ...metrics
        });
        
        // Keep only recent data
        const cutoff = timestamp - this.config.retentionPeriod;
        const filtered = upstreamMetrics.filter(m => m.timestamp > cutoff);
        this.metrics.upstreams.set(upstreamId, filtered);
        
        this.emit('upstreamMetrics', {
            upstreamId,
            metrics,
            timestamp
        });
    }
    
    /**
     * Record latency data
     */
    recordLatency(responseTime, route = 'unknown') {
        const timestamp = Date.now();
        const bucket = Math.floor(timestamp / (60 * 1000)) * (60 * 1000); // 1-minute buckets
        
        if (!this.metrics.latency.has(bucket)) {
            this.metrics.latency.set(bucket, new Map());
        }
        
        const bucketData = this.metrics.latency.get(bucket);
        
        if (!bucketData.has(route)) {
            bucketData.set(route, {
                count: 0,
                total: 0,
                min: Infinity,
                max: 0,
                p50: 0,
                p95: 0,
                p99: 0,
                values: []
            });
        }
        
        const routeData = bucketData.get(route);
        routeData.count++;
        routeData.total += responseTime;
        routeData.min = Math.min(routeData.min, responseTime);
        routeData.max = Math.max(routeData.max, responseTime);
        routeData.values.push(responseTime);
        
        // Calculate percentiles
        if (routeData.values.length > 0) {
            const sorted = [...routeData.values].sort((a, b) => a - b);
            const len = sorted.length;
            
            routeData.p50 = sorted[Math.floor(len * 0.5)];
            routeData.p95 = sorted[Math.floor(len * 0.95)];
            routeData.p99 = sorted[Math.floor(len * 0.99)];
        }
    }
    
    /**
     * Record error
     */
    recordError(error, req, res) {
        const timestamp = Date.now();
        const errorId = this.generateErrorId();
        
        this.metrics.errors.set(errorId, {
            id: errorId,
            message: error.message,
            stack: error.stack,
            code: error.code,
            statusCode: res.statusCode,
            method: req.method,
            url: req.url,
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.connection.remoteAddress,
            timestamp,
            route: req.route?.path,
            upstream: req.upstream?.id
        });
        
        this.emit('error', {
            errorId,
            message: error.message,
            statusCode: res.statusCode,
            url: req.url,
            timestamp
        });
    }
    
    /**
     * Collect general metrics
     */
    collectMetrics() {
        const timestamp = Date.now();
        
        // Calculate requests per second
        const timeWindow = 60 * 1000; // 1 minute
        const recentRequests = Array.from(this.metrics.requests.values())
            .filter(req => timestamp - req.startTime < timeWindow);
        
        this.realTimeMetrics.requestsPerSecond = recentRequests.length / 60;
        
        // Emit real-time metrics
        this.emit('metrics', {
            timestamp,
            ...this.realTimeMetrics
        });
        
        // Broadcast to dashboard clients
        this.broadcastToDashboard('metrics', this.realTimeMetrics);
    }
    
    /**
     * Collect system metrics
     */
    collectSystemMetrics() {
        const timestamp = Date.now();
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        const systemMetrics = {
            timestamp,
            memory: {
                rss: memUsage.rss,
                heapTotal: memUsage.heapTotal,
                heapUsed: memUsage.heapUsed,
                external: memUsage.external,
                usage: (memUsage.heapUsed / memUsage.heapTotal) * 100
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system,
                usage: this.calculateCpuUsage(cpuUsage)
            },
            system: {
                uptime: process.uptime(),
                loadAvg: os.loadavg(),
                freeMem: os.freemem(),
                totalMem: os.totalmem(),
                memoryUsage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
            },
            eventLoop: {
                delay: this.measureEventLoopDelay()
            }
        };
        
        // Store system metrics
        const bucket = Math.floor(timestamp / (60 * 1000)) * (60 * 1000);
        this.metrics.system.set(bucket, systemMetrics);
        
        this.emit('systemMetrics', systemMetrics);
        this.broadcastToDashboard('systemMetrics', systemMetrics);
    }
    
    /**
     * Calculate CPU usage percentage
     */
    calculateCpuUsage(cpuUsage) {
        if (!this.lastCpuUsage) {
            this.lastCpuUsage = cpuUsage;
            return 0;
        }
        
        const userDiff = cpuUsage.user - this.lastCpuUsage.user;
        const systemDiff = cpuUsage.system - this.lastCpuUsage.system;
        const totalDiff = userDiff + systemDiff;
        
        this.lastCpuUsage = cpuUsage;
        
        // Convert microseconds to percentage (rough estimate)
        return Math.min(100, (totalDiff / 1000000) * 100);
    }
    
    /**
     * Measure event loop delay
     */
    measureEventLoopDelay() {
        const start = process.hrtime.bigint();
        setImmediate(() => {
            const delay = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
            this.lastEventLoopDelay = delay;
        });
        
        return this.lastEventLoopDelay || 0;
    }
    
    /**
     * Check alerts
     */
    checkAlerts() {
        const thresholds = this.config.alertThresholds;
        const currentTime = Date.now();
        
        // Check response time alert
        if (this.realTimeMetrics.avgResponseTime > thresholds.responseTime) {
            this.triggerAlert('high_response_time', {
                current: this.realTimeMetrics.avgResponseTime,
                threshold: thresholds.responseTime,
                message: `Average response time (${this.realTimeMetrics.avgResponseTime}ms) exceeds threshold (${thresholds.responseTime}ms)`
            });
        }
        
        // Check error rate alert
        if (this.realTimeMetrics.errorRate > thresholds.errorRate) {
            this.triggerAlert('high_error_rate', {
                current: this.realTimeMetrics.errorRate,
                threshold: thresholds.errorRate,
                message: `Error rate (${this.realTimeMetrics.errorRate.toFixed(2)}%) exceeds threshold (${thresholds.errorRate}%)`
            });
        }
        
        // Check system alerts
        const latestSystemMetrics = Array.from(this.metrics.system.values()).pop();
        if (latestSystemMetrics) {
            // Memory usage alert
            if (latestSystemMetrics.memory.usage > thresholds.memoryUsage) {
                this.triggerAlert('high_memory_usage', {
                    current: latestSystemMetrics.memory.usage,
                    threshold: thresholds.memoryUsage,
                    message: `Memory usage (${latestSystemMetrics.memory.usage.toFixed(2)}%) exceeds threshold (${thresholds.memoryUsage}%)`
                });
            }
            
            // System memory alert
            if (latestSystemMetrics.system.memoryUsage > thresholds.memoryUsage) {
                this.triggerAlert('high_system_memory', {
                    current: latestSystemMetrics.system.memoryUsage,
                    threshold: thresholds.memoryUsage,
                    message: `System memory usage (${latestSystemMetrics.system.memoryUsage.toFixed(2)}%) exceeds threshold (${thresholds.memoryUsage}%)`
                });
            }
        }
    }
    
    /**
     * Trigger alert
     */
    triggerAlert(alertType, data) {
        const alertId = `${alertType}_${Date.now()}`;
        const alert = {
            id: alertId,
            type: alertType,
            severity: this.getAlertSeverity(alertType),
            timestamp: Date.now(),
            data,
            acknowledged: false,
            resolved: false
        };
        
        // Check if similar alert is already active
        const existingAlert = Array.from(this.alerts.values())
            .find(a => a.type === alertType && !a.resolved);
        
        if (existingAlert) {
            // Update existing alert
            existingAlert.data = data;
            existingAlert.timestamp = Date.now();
        } else {
            // Create new alert
            this.alerts.set(alertId, alert);
            this.alertHistory.push(alert);
            
            console.log(`🚨 Alert triggered: ${alertType} - ${data.message}`);
            
            this.emit('alert', alert);
            this.broadcastToDashboard('alert', alert);
        }
    }
    
    /**
     * Get alert severity
     */
    getAlertSeverity(alertType) {
        const severityMap = {
            high_response_time: 'warning',
            high_error_rate: 'critical',
            high_memory_usage: 'warning',
            high_system_memory: 'critical',
            high_cpu_usage: 'warning',
            high_disk_usage: 'critical',
            upstream_down: 'critical',
            circuit_breaker_open: 'warning'
        };
        
        return severityMap[alertType] || 'info';
    }
    
    /**
     * Acknowledge alert
     */
    acknowledgeAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = Date.now();
            
            console.log(`✅ Alert acknowledged: ${alert.type}`);
            this.emit('alertAcknowledged', alert);
            this.broadcastToDashboard('alertAcknowledged', alert);
        }
    }
    
    /**
     * Resolve alert
     */
    resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolvedAt = Date.now();
            
            console.log(`✅ Alert resolved: ${alert.type}`);
            this.emit('alertResolved', alert);
            this.broadcastToDashboard('alertResolved', alert);
        }
    }
    
    /**
     * Clean up old data
     */
    cleanupOldData() {
        const cutoff = Date.now() - this.config.retentionPeriod;
        
        // Clean up requests
        for (const [id, request] of this.metrics.requests) {
            if (request.startTime < cutoff) {
                this.metrics.requests.delete(id);
            }
        }
        
        // Clean up responses
        for (const [id, response] of this.metrics.responses) {
            if (response.endTime < cutoff) {
                this.metrics.responses.delete(id);
            }
        }
        
        // Clean up errors
        for (const [id, error] of this.metrics.errors) {
            if (error.timestamp < cutoff) {
                this.metrics.errors.delete(id);
            }
        }
        
        // Clean up latency data
        for (const [bucket] of this.metrics.latency) {
            if (bucket < cutoff) {
                this.metrics.latency.delete(bucket);
            }
        }
        
        // Clean up system metrics
        for (const [bucket] of this.metrics.system) {
            if (bucket < cutoff) {
                this.metrics.system.delete(bucket);
            }
        }
        
        // Clean up alert history
        this.alertHistory = this.alertHistory.filter(alert => 
            alert.timestamp > cutoff
        );
        
        console.log('🧹 Old monitoring data cleaned up');
    }
    
    /**
     * Get dashboard data
     */
    getDashboardData() {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        
        // Get recent latency data
        const latencyData = [];
        for (const [bucket, routes] of this.metrics.latency) {
            if (bucket > oneHourAgo) {
                for (const [route, data] of routes) {
                    latencyData.push({
                        timestamp: bucket,
                        route,
                        avg: data.total / data.count,
                        p95: data.p95,
                        p99: data.p99
                    });
                }
            }
        }
        
        // Get recent system metrics
        const systemData = Array.from(this.metrics.system.values())
            .filter(m => m.timestamp > oneHourAgo)
            .sort((a, b) => a.timestamp - b.timestamp);
        
        // Get active alerts
        const activeAlerts = Array.from(this.alerts.values())
            .filter(alert => !alert.resolved)
            .sort((a, b) => b.timestamp - a.timestamp);
        
        // Get error summary
        const recentErrors = Array.from(this.metrics.errors.values())
            .filter(error => error.timestamp > oneHourAgo);
        
        const errorsByType = {};
        recentErrors.forEach(error => {
            const type = error.statusCode || 'unknown';
            errorsByType[type] = (errorsByType[type] || 0) + 1;
        });
        
        return {
            realTime: this.realTimeMetrics,
            latency: latencyData,
            system: systemData,
            alerts: activeAlerts,
            errors: {
                total: recentErrors.length,
                byType: errorsByType,
                recent: recentErrors.slice(-10)
            },
            uptime: now - this.realTimeMetrics.uptime
        };
    }
    
    /**
     * Add dashboard client
     */
    addDashboardClient(client) {
        this.dashboardClients.add(client);
        
        // Send initial data
        client.send(JSON.stringify({
            type: 'initialData',
            data: this.getDashboardData()
        }));
        
        console.log('📊 Dashboard client connected');
    }
    
    /**
     * Remove dashboard client
     */
    removeDashboardClient(client) {
        this.dashboardClients.delete(client);
        console.log('📊 Dashboard client disconnected');
    }
    
    /**
     * Broadcast to dashboard clients
     */
    broadcastToDashboard(type, data) {
        const message = JSON.stringify({ type, data });
        
        for (const client of this.dashboardClients) {
            try {
                client.send(message);
            } catch (error) {
                // Remove disconnected client
                this.dashboardClients.delete(client);
            }
        }
    }
    
    /**
     * Generate request ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Generate error ID
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get monitoring statistics
     */
    getStats() {
        return {
            requests: this.metrics.requests.size,
            responses: this.metrics.responses.size,
            errors: this.metrics.errors.size,
            activeAlerts: Array.from(this.alerts.values()).filter(a => !a.resolved).length,
            totalAlerts: this.alerts.size,
            uptime: Date.now() - this.realTimeMetrics.uptime,
            realTime: this.realTimeMetrics
        };
    }
    
    /**
     * Export metrics data
     */
    async exportMetrics(format = 'json') {
        const data = {
            timestamp: Date.now(),
            realTime: this.realTimeMetrics,
            requests: Array.from(this.metrics.requests.values()),
            responses: Array.from(this.metrics.responses.values()),
            errors: Array.from(this.metrics.errors.values()),
            alerts: Array.from(this.alerts.values()),
            system: Array.from(this.metrics.system.values())
        };
        
        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        }
        
        // Add other formats as needed
        return data;
    }
    
    /**
     * Start monitoring system
     */
    async start() {
        if (this.isStarted) {
            console.log('⚠️ Monitoring system already started');
            return;
        }
        
        await this.init();
        this.isStarted = true;
        console.log('🚀 Monitoring system started');
    }
    
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        console.log('🔄 Monitoring configuration updated');
        this.emit('configUpdated', newConfig);
    }
    
    /**
     * Stop monitoring
     */
    async stop() {
        console.log('🛑 Stopping monitoring system...');
        
        // Clear all intervals
        for (const [name, interval] of this.intervals) {
            clearInterval(interval);
            console.log(`⏹️ Stopped ${name} monitoring`);
        }
        
        // Close dashboard connections
        for (const client of this.dashboardClients) {
            try {
                client.close();
            } catch (error) {
                // Ignore errors when closing
            }
        }
        
        // Clear data
        this.metrics.requests.clear();
        this.metrics.responses.clear();
        this.metrics.errors.clear();
        this.metrics.latency.clear();
        this.metrics.upstreams.clear();
        this.metrics.system.clear();
        this.alerts.clear();
        this.dashboardClients.clear();
        this.intervals.clear();
        
        console.log('✅ Monitoring system stopped');
        this.emit('stopped');
    }
}

// Export class
module.exports = APIGatewayMonitoring;

// CLI interface
if (require.main === module) {
    const monitoring = new APIGatewayMonitoring({
        metricsInterval: 5000,
        enableAlerts: true,
        alertThresholds: {
            responseTime: 2000,
            errorRate: 3,
            memoryUsage: 70
        }
    });
    
    // Event listeners
    monitoring.on('initialized', () => {
        console.log('🎉 Monitoring system initialized');
        console.log('📊 Stats:', monitoring.getStats());
    });
    
    monitoring.on('alert', (alert) => {
        console.log(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.data.message}`);
    });
    
    monitoring.on('metrics', (metrics) => {
        console.log(`📈 RPS: ${metrics.requestsPerSecond.toFixed(2)}, Avg Response: ${metrics.avgResponseTime.toFixed(2)}ms, Error Rate: ${metrics.errorRate.toFixed(2)}%`);
    });
    
    // Simulate some requests for testing
    setTimeout(() => {
        console.log('🧪 Simulating requests...');
        
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const mockReq = {
                    method: 'GET',
                    url: `/api/test/${i}`,
                    headers: { 'user-agent': 'test-client' },
                    ip: '127.0.0.1'
                };
                
                const mockRes = {
                    statusCode: Math.random() > 0.1 ? 200 : 500,
                    get: () => '1024'
                };
                
                monitoring.recordRequestStart(mockReq);
                
                setTimeout(() => {
                    const error = mockRes.statusCode >= 400 ? new Error('Test error') : null;
                    monitoring.recordRequestEnd(mockReq, mockRes, error);
                }, Math.random() * 1000);
                
            }, i * 100);
        }
    }, 2000);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down...');
        await monitoring.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down...');
        await monitoring.stop();
        process.exit(0);
    });
}