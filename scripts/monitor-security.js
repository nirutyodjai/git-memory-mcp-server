#!/usr/bin/env node

/**
 * =============================================================================
 * Enterprise Security System Monitoring Script
 * =============================================================================
 * This script provides comprehensive monitoring for the Git Memory MCP Server Security System
 * Features: Health checks, performance monitoring, alerting, log analysis, and reporting
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const https = require('https');
const { EventEmitter } = require('events');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// =============================================================================
// Configuration
// =============================================================================
const CONFIG = {
    // Monitoring intervals (in milliseconds)
    healthCheckInterval: 30000,     // 30 seconds
    performanceCheckInterval: 60000, // 1 minute
    logAnalysisInterval: 300000,    // 5 minutes
    reportInterval: 3600000,        // 1 hour
    
    // Thresholds
    thresholds: {
        responseTime: 5000,         // 5 seconds
        cpuUsage: 80,              // 80%
        memoryUsage: 85,           // 85%
        diskUsage: 90,             // 90%
        errorRate: 5,              // 5%
        failedLogins: 10           // 10 failed logins per minute
    },
    
    // Endpoints to monitor
    endpoints: [
        { name: 'Health Check', url: 'http://localhost:3333/api/security/health', critical: true },
        { name: 'Authentication', url: 'http://localhost:3333/api/auth/status', critical: true },
        { name: 'Dashboard', url: 'http://localhost:3333/dashboard', critical: false },
        { name: 'API Documentation', url: 'http://localhost:3333/api/docs', critical: false }
    ],
    
    // Notification settings
    notifications: {
        email: {
            enabled: process.env.MONITOR_EMAIL_ENABLED === 'true',
            smtp: {
                host: process.env.MONITOR_SMTP_HOST || 'localhost',
                port: parseInt(process.env.MONITOR_SMTP_PORT) || 587,
                secure: process.env.MONITOR_SMTP_SECURE === 'true',
                auth: {
                    user: process.env.MONITOR_SMTP_USER,
                    pass: process.env.MONITOR_SMTP_PASS
                }
            },
            from: process.env.MONITOR_EMAIL_FROM || 'security-monitor@localhost',
            to: process.env.MONITOR_EMAIL_TO ? process.env.MONITOR_EMAIL_TO.split(',') : ['admin@localhost']
        },
        webhook: {
            enabled: process.env.MONITOR_WEBHOOK_ENABLED === 'true',
            url: process.env.MONITOR_WEBHOOK_URL,
            secret: process.env.MONITOR_WEBHOOK_SECRET
        },
        slack: {
            enabled: process.env.MONITOR_SLACK_ENABLED === 'true',
            webhookUrl: process.env.MONITOR_SLACK_WEBHOOK_URL,
            channel: process.env.MONITOR_SLACK_CHANNEL || '#security-alerts'
        }
    },
    
    // File paths
    paths: {
        projectRoot: path.resolve(__dirname, '..'),
        logsDir: path.resolve(__dirname, '..', 'logs'),
        dataDir: path.resolve(__dirname, '..', 'data'),
        reportsDir: path.resolve(__dirname, '..', 'reports')
    }
};

// =============================================================================
// Security Monitor Class
// =============================================================================
class SecurityMonitor extends EventEmitter {
    constructor(config = CONFIG) {
        super();
        this.config = config;
        this.isRunning = false;
        this.intervals = new Map();
        this.metrics = {
            uptime: Date.now(),
            checks: {
                total: 0,
                passed: 0,
                failed: 0
            },
            performance: {
                cpu: [],
                memory: [],
                disk: [],
                responseTime: []
            },
            alerts: [],
            lastReport: null
        };
        
        this.setupEventHandlers();
    }
    
    // Setup event handlers
    setupEventHandlers() {
        this.on('healthCheck', this.handleHealthCheck.bind(this));
        this.on('performanceCheck', this.handlePerformanceCheck.bind(this));
        this.on('alert', this.handleAlert.bind(this));
        this.on('error', this.handleError.bind(this));
        
        // Graceful shutdown
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }
    
    // Start monitoring
    async start() {
        if (this.isRunning) {
            this.log('WARN', 'Monitor is already running');
            return;
        }
        
        this.log('INFO', 'Starting Security Monitor...');
        
        try {
            // Create necessary directories
            await this.ensureDirectories();
            
            // Start monitoring intervals
            this.intervals.set('healthCheck', setInterval(
                () => this.emit('healthCheck'),
                this.config.healthCheckInterval
            ));
            
            this.intervals.set('performanceCheck', setInterval(
                () => this.emit('performanceCheck'),
                this.config.performanceCheckInterval
            ));
            
            this.intervals.set('logAnalysis', setInterval(
                () => this.analyzeSecurityLogs(),
                this.config.logAnalysisInterval
            ));
            
            this.intervals.set('report', setInterval(
                () => this.generateReport(),
                this.config.reportInterval
            ));
            
            this.isRunning = true;
            this.metrics.uptime = Date.now();
            
            // Initial checks
            this.emit('healthCheck');
            this.emit('performanceCheck');
            
            this.log('INFO', 'Security Monitor started successfully');
            
        } catch (error) {
            this.log('ERROR', `Failed to start monitor: ${error.message}`);
            throw error;
        }
    }
    
    // Stop monitoring
    async stop() {
        if (!this.isRunning) {
            return;
        }
        
        this.log('INFO', 'Stopping Security Monitor...');
        
        // Clear all intervals
        for (const [name, interval] of this.intervals) {
            clearInterval(interval);
            this.log('DEBUG', `Cleared interval: ${name}`);
        }
        this.intervals.clear();
        
        // Generate final report
        await this.generateReport();
        
        this.isRunning = false;
        this.log('INFO', 'Security Monitor stopped');
        
        process.exit(0);
    }
    
    // Ensure required directories exist
    async ensureDirectories() {
        const dirs = Object.values(this.config.paths);
        dirs.push(this.config.paths.reportsDir);
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    throw error;
                }
            }
        }
    }
    
    // Health check handler
    async handleHealthCheck() {
        this.log('DEBUG', 'Performing health checks...');
        
        const results = [];
        
        for (const endpoint of this.config.endpoints) {
            try {
                const result = await this.checkEndpoint(endpoint);
                results.push(result);
                
                this.metrics.checks.total++;
                if (result.status === 'healthy') {
                    this.metrics.checks.passed++;
                } else {
                    this.metrics.checks.failed++;
                    
                    if (endpoint.critical) {
                        this.emit('alert', {
                            type: 'critical',
                            message: `Critical endpoint ${endpoint.name} is unhealthy`,
                            details: result
                        });
                    }
                }
                
            } catch (error) {
                this.metrics.checks.total++;
                this.metrics.checks.failed++;
                
                const result = {
                    endpoint: endpoint.name,
                    url: endpoint.url,
                    status: 'error',
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
                
                results.push(result);
                
                if (endpoint.critical) {
                    this.emit('alert', {
                        type: 'critical',
                        message: `Critical endpoint ${endpoint.name} check failed`,
                        details: result
                    });
                }
            }
        }
        
        // Log results
        const healthyCount = results.filter(r => r.status === 'healthy').length;
        const totalCount = results.length;
        
        this.log('INFO', `Health check completed: ${healthyCount}/${totalCount} endpoints healthy`);
        
        // Store results
        await this.storeHealthResults(results);
    }
    
    // Check individual endpoint
    async checkEndpoint(endpoint) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const url = new URL(endpoint.url);
            const client = url.protocol === 'https:' ? https : http;
            
            const request = client.get(endpoint.url, {
                timeout: this.config.thresholds.responseTime
            }, (response) => {
                const responseTime = Date.now() - startTime;
                
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    const result = {
                        endpoint: endpoint.name,
                        url: endpoint.url,
                        status: response.statusCode >= 200 && response.statusCode < 400 ? 'healthy' : 'unhealthy',
                        statusCode: response.statusCode,
                        responseTime,
                        timestamp: new Date().toISOString()
                    };
                    
                    // Check response time threshold
                    if (responseTime > this.config.thresholds.responseTime) {
                        result.warning = 'High response time';
                    }
                    
                    resolve(result);
                });
            });
            
            request.on('error', (error) => {
                resolve({
                    endpoint: endpoint.name,
                    url: endpoint.url,
                    status: 'error',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            });
            
            request.on('timeout', () => {
                request.destroy();
                resolve({
                    endpoint: endpoint.name,
                    url: endpoint.url,
                    status: 'timeout',
                    error: 'Request timeout',
                    timestamp: new Date().toISOString()
                });
            });
        });
    }
    
    // Performance check handler
    async handlePerformanceCheck() {
        this.log('DEBUG', 'Performing performance checks...');
        
        try {
            const metrics = await this.collectSystemMetrics();
            
            // Store metrics
            this.metrics.performance.cpu.push(metrics.cpu);
            this.metrics.performance.memory.push(metrics.memory);
            this.metrics.performance.disk.push(metrics.disk);
            
            // Keep only last 100 measurements
            Object.keys(this.metrics.performance).forEach(key => {
                if (this.metrics.performance[key].length > 100) {
                    this.metrics.performance[key] = this.metrics.performance[key].slice(-100);
                }
            });
            
            // Check thresholds
            if (metrics.cpu > this.config.thresholds.cpuUsage) {
                this.emit('alert', {
                    type: 'warning',
                    message: `High CPU usage: ${metrics.cpu}%`,
                    details: metrics
                });
            }
            
            if (metrics.memory > this.config.thresholds.memoryUsage) {
                this.emit('alert', {
                    type: 'warning',
                    message: `High memory usage: ${metrics.memory}%`,
                    details: metrics
                });
            }
            
            if (metrics.disk > this.config.thresholds.diskUsage) {
                this.emit('alert', {
                    type: 'critical',
                    message: `High disk usage: ${metrics.disk}%`,
                    details: metrics
                });
            }
            
            this.log('DEBUG', `Performance metrics - CPU: ${metrics.cpu}%, Memory: ${metrics.memory}%, Disk: ${metrics.disk}%`);
            
        } catch (error) {
            this.log('ERROR', `Performance check failed: ${error.message}`);
        }
    }
    
    // Collect system metrics
    async collectSystemMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            cpu: 0,
            memory: 0,
            disk: 0,
            processes: []
        };
        
        try {
            // Get CPU usage
            if (process.platform === 'win32') {
                const { stdout } = await execAsync('wmic cpu get loadpercentage /value');
                const match = stdout.match(/LoadPercentage=(\d+)/);
                if (match) {
                    metrics.cpu = parseInt(match[1]);
                }
            } else {
                const { stdout } = await execAsync('top -bn1 | grep "Cpu(s)" | awk \'{ print $2}\' | awk -F\'%\' \'{ print $1}\'');
                metrics.cpu = parseFloat(stdout.trim()) || 0;
            }
            
            // Get memory usage
            if (process.platform === 'win32') {
                const { stdout } = await execAsync('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value');
                const total = stdout.match(/TotalVisibleMemorySize=(\d+)/);
                const free = stdout.match(/FreePhysicalMemory=(\d+)/);
                if (total && free) {
                    const totalMem = parseInt(total[1]);
                    const freeMem = parseInt(free[1]);
                    metrics.memory = Math.round(((totalMem - freeMem) / totalMem) * 100);
                }
            } else {
                const { stdout } = await execAsync('free | grep Mem | awk \'{printf "%.0f", $3/$2 * 100.0}\'');
                metrics.memory = parseFloat(stdout.trim()) || 0;
            }
            
            // Get disk usage
            if (process.platform === 'win32') {
                const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
                // Parse Windows disk info (simplified)
                metrics.disk = 50; // Placeholder
            } else {
                const { stdout } = await execAsync('df -h / | awk \'NR==2{printf "%s", $5}\' | sed \'s/%//\'');
                metrics.disk = parseInt(stdout.trim()) || 0;
            }
            
            // Get Node.js process info
            const memUsage = process.memoryUsage();
            metrics.nodeMemory = {
                rss: Math.round(memUsage.rss / 1024 / 1024), // MB
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024)
            };
            
        } catch (error) {
            this.log('WARN', `Failed to collect some system metrics: ${error.message}`);
        }
        
        return metrics;
    }
    
    // Analyze security logs
    async analyzeSecurityLogs() {
        this.log('DEBUG', 'Analyzing security logs...');
        
        try {
            const logFiles = await this.getLogFiles();
            const analysis = {
                timestamp: new Date().toISOString(),
                totalEvents: 0,
                securityEvents: 0,
                failedLogins: 0,
                suspiciousActivity: [],
                errors: 0
            };
            
            for (const logFile of logFiles) {
                const content = await fs.readFile(logFile, 'utf8');
                const lines = content.split('\n').filter(line => line.trim());
                
                analysis.totalEvents += lines.length;
                
                for (const line of lines) {
                    // Parse log entries (simplified)
                    if (line.includes('SECURITY') || line.includes('AUTH')) {
                        analysis.securityEvents++;
                    }
                    
                    if (line.includes('LOGIN_FAILED') || line.includes('AUTHENTICATION_FAILED')) {
                        analysis.failedLogins++;
                    }
                    
                    if (line.includes('ERROR') || line.includes('CRITICAL')) {
                        analysis.errors++;
                    }
                    
                    // Detect suspicious patterns
                    if (line.includes('BRUTE_FORCE') || line.includes('SUSPICIOUS')) {
                        analysis.suspiciousActivity.push({
                            timestamp: new Date().toISOString(),
                            event: line.substring(0, 200)
                        });
                    }
                }
            }
            
            // Check thresholds
            if (analysis.failedLogins > this.config.thresholds.failedLogins) {
                this.emit('alert', {
                    type: 'warning',
                    message: `High number of failed logins: ${analysis.failedLogins}`,
                    details: analysis
                });
            }
            
            if (analysis.suspiciousActivity.length > 0) {
                this.emit('alert', {
                    type: 'critical',
                    message: `Suspicious activity detected: ${analysis.suspiciousActivity.length} events`,
                    details: analysis
                });
            }
            
            this.log('INFO', `Log analysis completed - Events: ${analysis.totalEvents}, Security: ${analysis.securityEvents}, Failed logins: ${analysis.failedLogins}`);
            
        } catch (error) {
            this.log('ERROR', `Log analysis failed: ${error.message}`);
        }
    }
    
    // Get log files
    async getLogFiles() {
        const logFiles = [];
        
        try {
            const files = await fs.readdir(this.config.paths.logsDir);
            
            for (const file of files) {
                if (file.endsWith('.log')) {
                    logFiles.push(path.join(this.config.paths.logsDir, file));
                }
            }
        } catch (error) {
            this.log('WARN', `Failed to read log directory: ${error.message}`);
        }
        
        return logFiles;
    }
    
    // Handle alerts
    async handleAlert(alert) {
        this.log('WARN', `ALERT [${alert.type.toUpperCase()}]: ${alert.message}`);
        
        // Store alert
        this.metrics.alerts.push({
            ...alert,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 1000 alerts
        if (this.metrics.alerts.length > 1000) {
            this.metrics.alerts = this.metrics.alerts.slice(-1000);
        }
        
        // Send notifications
        await this.sendNotifications(alert);
    }
    
    // Send notifications
    async sendNotifications(alert) {
        const notifications = [];
        
        // Email notification
        if (this.config.notifications.email.enabled) {
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
        
        try {
            await Promise.allSettled(notifications);
        } catch (error) {
            this.log('ERROR', `Failed to send notifications: ${error.message}`);
        }
    }
    
    // Send email notification (placeholder)
    async sendEmailNotification(alert) {
        // Implementation would use nodemailer or similar
        this.log('DEBUG', `Would send email notification for: ${alert.message}`);
    }
    
    // Send webhook notification (placeholder)
    async sendWebhookNotification(alert) {
        // Implementation would make HTTP POST to webhook URL
        this.log('DEBUG', `Would send webhook notification for: ${alert.message}`);
    }
    
    // Send Slack notification (placeholder)
    async sendSlackNotification(alert) {
        // Implementation would use Slack webhook
        this.log('DEBUG', `Would send Slack notification for: ${alert.message}`);
    }
    
    // Generate monitoring report
    async generateReport() {
        this.log('INFO', 'Generating monitoring report...');
        
        try {
            const report = {
                timestamp: new Date().toISOString(),
                period: {
                    start: this.metrics.lastReport || new Date(this.metrics.uptime).toISOString(),
                    end: new Date().toISOString()
                },
                summary: {
                    uptime: Date.now() - this.metrics.uptime,
                    totalChecks: this.metrics.checks.total,
                    successRate: this.metrics.checks.total > 0 ? 
                        Math.round((this.metrics.checks.passed / this.metrics.checks.total) * 100) : 0,
                    alertsCount: this.metrics.alerts.length
                },
                performance: {
                    avgCpu: this.calculateAverage(this.metrics.performance.cpu),
                    avgMemory: this.calculateAverage(this.metrics.performance.memory),
                    avgDisk: this.calculateAverage(this.metrics.performance.disk)
                },
                recentAlerts: this.metrics.alerts.slice(-10),
                recommendations: this.generateRecommendations()
            };
            
            // Save report
            const reportFile = path.join(
                this.config.paths.reportsDir,
                `security-monitor-${new Date().toISOString().split('T')[0]}.json`
            );
            
            await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
            
            this.metrics.lastReport = report.timestamp;
            
            this.log('INFO', `Report generated: ${reportFile}`);
            
        } catch (error) {
            this.log('ERROR', `Failed to generate report: ${error.message}`);
        }
    }
    
    // Calculate average
    calculateAverage(values) {
        if (!values || values.length === 0) return 0;
        return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
    }
    
    // Generate recommendations
    generateRecommendations() {
        const recommendations = [];
        
        // Performance recommendations
        const avgCpu = this.calculateAverage(this.metrics.performance.cpu);
        const avgMemory = this.calculateAverage(this.metrics.performance.memory);
        
        if (avgCpu > 70) {
            recommendations.push('Consider optimizing CPU-intensive operations or scaling horizontally');
        }
        
        if (avgMemory > 80) {
            recommendations.push('Monitor memory usage and consider increasing available memory');
        }
        
        // Security recommendations
        const recentAlerts = this.metrics.alerts.filter(
            alert => Date.now() - new Date(alert.timestamp).getTime() < 24 * 60 * 60 * 1000
        );
        
        if (recentAlerts.length > 10) {
            recommendations.push('High number of security alerts - review security policies and monitoring rules');
        }
        
        return recommendations;
    }
    
    // Store health results
    async storeHealthResults(results) {
        try {
            const resultsFile = path.join(
                this.config.paths.dataDir,
                `health-${new Date().toISOString().split('T')[0]}.json`
            );
            
            let existingResults = [];
            try {
                const content = await fs.readFile(resultsFile, 'utf8');
                existingResults = JSON.parse(content);
            } catch (error) {
                // File doesn't exist or is invalid, start fresh
            }
            
            existingResults.push(...results);
            
            // Keep only last 1000 results
            if (existingResults.length > 1000) {
                existingResults = existingResults.slice(-1000);
            }
            
            await fs.writeFile(resultsFile, JSON.stringify(existingResults, null, 2));
            
        } catch (error) {
            this.log('ERROR', `Failed to store health results: ${error.message}`);
        }
    }
    
    // Handle errors
    handleError(error) {
        this.log('ERROR', `Monitor error: ${error.message}`);
    }
    
    // Logging function
    log(level, message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}`;
        
        // Console output with colors
        const colors = {
            ERROR: '\x1b[31m',   // Red
            WARN: '\x1b[33m',    // Yellow
            INFO: '\x1b[32m',    // Green
            DEBUG: '\x1b[36m'    // Cyan
        };
        
        const color = colors[level] || '';
        const reset = '\x1b[0m';
        
        console.log(`${color}${logEntry}${reset}`);
        
        // Write to log file
        const logFile = path.join(this.config.paths.logsDir, 'monitor.log');
        fs.appendFile(logFile, logEntry + '\n').catch(() => {});
    }
}

// =============================================================================
// CLI Interface
// =============================================================================
function showUsage() {
    console.log(`
Usage: node monitor-security.js [OPTIONS]

Monitor the Git Memory MCP Server Security System

Options:
    --config FILE       Configuration file path
    --interval SECONDS  Health check interval (default: 30)
    --verbose          Enable verbose logging
    --help             Show this help message

Examples:
    node monitor-security.js                    # Start monitoring with default settings
    node monitor-security.js --interval 60      # Check every 60 seconds
    node monitor-security.js --verbose          # Enable verbose output

Environment Variables:
    MONITOR_EMAIL_ENABLED        Enable email notifications (true/false)
    MONITOR_SMTP_HOST           SMTP server host
    MONITOR_SMTP_PORT           SMTP server port
    MONITOR_SMTP_USER           SMTP username
    MONITOR_SMTP_PASS           SMTP password
    MONITOR_EMAIL_FROM          From email address
    MONITOR_EMAIL_TO            To email addresses (comma-separated)
    MONITOR_WEBHOOK_ENABLED     Enable webhook notifications (true/false)
    MONITOR_WEBHOOK_URL         Webhook URL
    MONITOR_SLACK_ENABLED       Enable Slack notifications (true/false)
    MONITOR_SLACK_WEBHOOK_URL   Slack webhook URL
    MONITOR_SLACK_CHANNEL       Slack channel (default: #security-alerts)
`);
}

// Parse command line arguments
function parseArguments() {
    const args = process.argv.slice(2);
    const options = {
        config: null,
        interval: null,
        verbose: false,
        help: false
    };
    
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--config':
                options.config = args[++i];
                break;
            case '--interval':
                options.interval = parseInt(args[++i]) * 1000;
                break;
            case '--verbose':
                options.verbose = true;
                break;
            case '--help':
                options.help = true;
                break;
            default:
                console.error(`Unknown option: ${args[i]}`);
                process.exit(1);
        }
    }
    
    return options;
}

// Main function
async function main() {
    const options = parseArguments();
    
    if (options.help) {
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
        
        // Override interval if provided
        if (options.interval) {
            config.healthCheckInterval = options.interval;
        }
        
        // Create and start monitor
        const monitor = new SecurityMonitor(config);
        
        console.log('\n=== Git Memory MCP Server Security Monitor ===\n');
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Health check interval: ${config.healthCheckInterval / 1000}s`);
        console.log(`Performance check interval: ${config.performanceCheckInterval / 1000}s`);
        console.log(`Log analysis interval: ${config.logAnalysisInterval / 1000}s`);
        console.log(`Report interval: ${config.reportInterval / 1000}s`);
        console.log('');
        
        await monitor.start();
        
        // Keep the process running
        process.on('SIGINT', () => {
            console.log('\nReceived SIGINT, shutting down gracefully...');
            monitor.stop();
        });
        
        process.on('SIGTERM', () => {
            console.log('\nReceived SIGTERM, shutting down gracefully...');
            monitor.stop();
        });
        
    } catch (error) {
        console.error(`Failed to start security monitor: ${error.message}`);
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

module.exports = { SecurityMonitor, CONFIG };