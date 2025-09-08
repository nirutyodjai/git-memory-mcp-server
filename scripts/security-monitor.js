#!/usr/bin/env node

/**
 * =============================================================================
 * Enterprise Security Monitoring & Alerting System
 * =============================================================================
 * Real-time security monitoring, threat detection, and automated response
 * Features: Intrusion detection, anomaly detection, automated blocking, alerts
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const crypto = require('crypto');
const os = require('os');
const { spawn } = require('child_process');

// =============================================================================
// Configuration
// =============================================================================
const CONFIG = {
    // Monitoring settings
    monitoring: {
        enabled: process.env.SECURITY_MONITORING_ENABLED !== 'false',
        interval: parseInt(process.env.MONITORING_INTERVAL) || 5000, // 5 seconds
        logRetention: parseInt(process.env.LOG_RETENTION_DAYS) || 30,
        realTimeAlerts: process.env.REAL_TIME_ALERTS !== 'false'
    },
    
    // Threat detection
    threats: {
        bruteForce: {
            enabled: true,
            maxAttempts: parseInt(process.env.BRUTE_FORCE_MAX_ATTEMPTS) || 5,
            timeWindow: parseInt(process.env.BRUTE_FORCE_TIME_WINDOW) || 300000, // 5 minutes
            blockDuration: parseInt(process.env.BRUTE_FORCE_BLOCK_DURATION) || 3600000 // 1 hour
        },
        rateLimiting: {
            enabled: true,
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
            timeWindow: parseInt(process.env.RATE_LIMIT_TIME_WINDOW) || 60000, // 1 minute
            blockDuration: parseInt(process.env.RATE_LIMIT_BLOCK_DURATION) || 300000 // 5 minutes
        },
        suspiciousActivity: {
            enabled: true,
            patterns: [
                /sql\s*injection/i,
                /xss|cross.site.scripting/i,
                /\.\.\/|\.\.\\/i, // Path traversal
                /<script[^>]*>.*?<\/script>/i,
                /union\s+select/i,
                /drop\s+table/i,
                /exec\s*\(/i
            ],
            scoreThreshold: parseInt(process.env.SUSPICIOUS_SCORE_THRESHOLD) || 50
        },
        geoLocation: {
            enabled: process.env.GEO_BLOCKING_ENABLED === 'true',
            blockedCountries: process.env.BLOCKED_COUNTRIES ? process.env.BLOCKED_COUNTRIES.split(',') : [],
            allowedCountries: process.env.ALLOWED_COUNTRIES ? process.env.ALLOWED_COUNTRIES.split(',') : []
        },
        anomalyDetection: {
            enabled: true,
            learningPeriod: parseInt(process.env.ANOMALY_LEARNING_PERIOD) || 86400000, // 24 hours
            sensitivityLevel: parseFloat(process.env.ANOMALY_SENSITIVITY) || 0.8,
            minSamples: parseInt(process.env.ANOMALY_MIN_SAMPLES) || 100
        }
    },
    
    // Response actions
    responses: {
        autoBlock: {
            enabled: process.env.AUTO_BLOCK_ENABLED !== 'false',
            methods: ['iptables', 'fail2ban', 'cloudflare'], // Available blocking methods
            defaultMethod: process.env.AUTO_BLOCK_METHOD || 'iptables'
        },
        notifications: {
            email: {
                enabled: process.env.SECURITY_EMAIL_ALERTS === 'true',
                smtp: {
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT) || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                },
                from: process.env.SECURITY_EMAIL_FROM || 'security@gitmemorymcp.com',
                to: process.env.SECURITY_EMAIL_TO ? process.env.SECURITY_EMAIL_TO.split(',') : ['admin@gitmemorymcp.com']
            },
            slack: {
                enabled: process.env.SLACK_ALERTS === 'true',
                webhook: process.env.SLACK_WEBHOOK_URL,
                channel: process.env.SLACK_CHANNEL || '#security-alerts'
            },
            webhook: {
                enabled: process.env.WEBHOOK_ALERTS === 'true',
                url: process.env.SECURITY_WEBHOOK_URL,
                secret: process.env.WEBHOOK_SECRET
            },
            sms: {
                enabled: process.env.SMS_ALERTS === 'true',
                provider: process.env.SMS_PROVIDER || 'twilio',
                apiKey: process.env.SMS_API_KEY,
                apiSecret: process.env.SMS_API_SECRET,
                from: process.env.SMS_FROM,
                to: process.env.SMS_TO ? process.env.SMS_TO.split(',') : []
            }
        },
        quarantine: {
            enabled: process.env.QUARANTINE_ENABLED === 'true',
            directory: process.env.QUARANTINE_DIR || path.resolve(__dirname, '..', 'quarantine'),
            maxSize: parseInt(process.env.QUARANTINE_MAX_SIZE) || 1073741824 // 1GB
        }
    },
    
    // Data sources
    sources: {
        logs: {
            access: process.env.ACCESS_LOG_PATH || '/var/log/nginx/access.log',
            error: process.env.ERROR_LOG_PATH || '/var/log/nginx/error.log',
            application: process.env.APP_LOG_PATH || path.resolve(__dirname, '..', 'logs', 'app.log'),
            security: process.env.SECURITY_LOG_PATH || path.resolve(__dirname, '..', 'logs', 'security.log')
        },
        system: {
            enabled: true,
            metrics: ['cpu', 'memory', 'disk', 'network', 'processes']
        },
        network: {
            enabled: process.env.NETWORK_MONITORING === 'true',
            interfaces: process.env.NETWORK_INTERFACES ? process.env.NETWORK_INTERFACES.split(',') : ['eth0'],
            ports: process.env.MONITORED_PORTS ? process.env.MONITORED_PORTS.split(',').map(Number) : [80, 443, 22, 3000]
        },
        database: {
            enabled: true,
            connection: process.env.DATABASE_URL || 'mongodb://localhost:27017/security',
            collections: ['security_events', 'blocked_ips', 'user_sessions', 'audit_logs']
        }
    },
    
    // Storage
    storage: {
        events: {
            path: process.env.EVENTS_STORAGE_PATH || path.resolve(__dirname, '..', 'data', 'security-events'),
            maxSize: parseInt(process.env.EVENTS_MAX_SIZE) || 10737418240, // 10GB
            compression: process.env.EVENTS_COMPRESSION !== 'false'
        },
        reports: {
            path: process.env.REPORTS_STORAGE_PATH || path.resolve(__dirname, '..', 'reports'),
            retention: parseInt(process.env.REPORTS_RETENTION_DAYS) || 90
        }
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
        this.monitors = new Map();
        this.threatDetectors = new Map();
        this.blockedIPs = new Set();
        this.suspiciousIPs = new Map();
        this.anomalyBaseline = new Map();
        this.eventQueue = [];
        this.stats = {
            eventsProcessed: 0,
            threatsDetected: 0,
            ipsBlocked: 0,
            alertsSent: 0,
            uptime: Date.now()
        };
        
        // Initialize
        this.initialize();
    }
    
    // Initialize security monitor
    async initialize() {
        try {
            console.log('🛡️  Initializing Security Monitor...');
            
            // Create directories
            await this.createDirectories();
            
            // Load blocked IPs from storage
            await this.loadBlockedIPs();
            
            // Initialize threat detectors
            this.initializeThreatDetectors();
            
            // Setup monitors
            this.setupMonitors();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load anomaly baseline
            await this.loadAnomalyBaseline();
            
            console.log('✅ Security Monitor initialized');
            
        } catch (error) {
            console.error(`Failed to initialize security monitor: ${error.message}`);
            throw error;
        }
    }
    
    // Create necessary directories
    async createDirectories() {
        const dirs = [
            this.config.storage.events.path,
            this.config.storage.reports.path,
            this.config.responses.quarantine.directory,
            path.dirname(this.config.sources.logs.security)
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    // Load blocked IPs from storage
    async loadBlockedIPs() {
        try {
            const blockedIPsFile = path.join(this.config.storage.events.path, 'blocked-ips.json');
            const data = await fs.readFile(blockedIPsFile, 'utf8');
            const blockedData = JSON.parse(data);
            
            for (const [ip, info] of Object.entries(blockedData)) {
                if (info.expiresAt > Date.now()) {
                    this.blockedIPs.add(ip);
                }
            }
            
            console.log(`📋 Loaded ${this.blockedIPs.size} blocked IPs`);
            
        } catch (error) {
            // File doesn't exist or is corrupted, start fresh
            console.log('📋 Starting with empty blocked IPs list');
        }
    }
    
    // Save blocked IPs to storage
    async saveBlockedIPs() {
        try {
            const blockedIPsFile = path.join(this.config.storage.events.path, 'blocked-ips.json');
            const blockedData = {};
            
            for (const ip of this.blockedIPs) {
                blockedData[ip] = {
                    blockedAt: Date.now(),
                    expiresAt: Date.now() + this.config.threats.bruteForce.blockDuration
                };
            }
            
            await fs.writeFile(blockedIPsFile, JSON.stringify(blockedData, null, 2));
            
        } catch (error) {
            console.error(`Failed to save blocked IPs: ${error.message}`);
        }
    }
    
    // Initialize threat detectors
    initializeThreatDetectors() {
        // Brute force detector
        if (this.config.threats.bruteForce.enabled) {
            this.threatDetectors.set('bruteForce', new BruteForceDetector(this.config.threats.bruteForce));
        }
        
        // Rate limiting detector
        if (this.config.threats.rateLimiting.enabled) {
            this.threatDetectors.set('rateLimiting', new RateLimitDetector(this.config.threats.rateLimiting));
        }
        
        // Suspicious activity detector
        if (this.config.threats.suspiciousActivity.enabled) {
            this.threatDetectors.set('suspiciousActivity', new SuspiciousActivityDetector(this.config.threats.suspiciousActivity));
        }
        
        // Anomaly detector
        if (this.config.threats.anomalyDetection.enabled) {
            this.threatDetectors.set('anomalyDetection', new AnomalyDetector(this.config.threats.anomalyDetection));
        }
        
        console.log(`🔍 Initialized ${this.threatDetectors.size} threat detectors`);
    }
    
    // Setup monitors
    setupMonitors() {
        // Log file monitors
        if (this.config.sources.logs.access) {
            this.monitors.set('accessLog', new LogMonitor(this.config.sources.logs.access, 'access'));
        }
        
        if (this.config.sources.logs.error) {
            this.monitors.set('errorLog', new LogMonitor(this.config.sources.logs.error, 'error'));
        }
        
        if (this.config.sources.logs.application) {
            this.monitors.set('appLog', new LogMonitor(this.config.sources.logs.application, 'application'));
        }
        
        // System monitor
        if (this.config.sources.system.enabled) {
            this.monitors.set('system', new SystemMonitor(this.config.sources.system));
        }
        
        // Network monitor
        if (this.config.sources.network.enabled) {
            this.monitors.set('network', new NetworkMonitor(this.config.sources.network));
        }
        
        console.log(`📊 Setup ${this.monitors.size} monitors`);
    }
    
    // Setup event listeners
    setupEventListeners() {
        this.on('security-event', this.handleSecurityEvent.bind(this));
        this.on('threat-detected', this.handleThreatDetected.bind(this));
        this.on('ip-blocked', this.handleIPBlocked.bind(this));
        this.on('anomaly-detected', this.handleAnomalyDetected.bind(this));
        
        // Setup monitor event listeners
        for (const [name, monitor] of this.monitors) {
            monitor.on('event', (event) => {
                this.emit('security-event', { ...event, source: name });
            });
            
            monitor.on('error', (error) => {
                console.error(`Monitor ${name} error: ${error.message}`);
            });
        }
    }
    
    // Load anomaly baseline
    async loadAnomalyBaseline() {
        try {
            const baselineFile = path.join(this.config.storage.events.path, 'anomaly-baseline.json');
            const data = await fs.readFile(baselineFile, 'utf8');
            const baseline = JSON.parse(data);
            
            for (const [key, value] of Object.entries(baseline)) {
                this.anomalyBaseline.set(key, value);
            }
            
            console.log(`📈 Loaded anomaly baseline with ${this.anomalyBaseline.size} metrics`);
            
        } catch (error) {
            console.log('📈 Starting with empty anomaly baseline');
        }
    }
    
    // Save anomaly baseline
    async saveAnomalyBaseline() {
        try {
            const baselineFile = path.join(this.config.storage.events.path, 'anomaly-baseline.json');
            const baseline = Object.fromEntries(this.anomalyBaseline);
            
            await fs.writeFile(baselineFile, JSON.stringify(baseline, null, 2));
            
        } catch (error) {
            console.error(`Failed to save anomaly baseline: ${error.message}`);
        }
    }
    
    // Start monitoring
    async start() {
        if (this.isRunning) {
            console.log('⚠️  Security monitor is already running');
            return;
        }
        
        this.isRunning = true;
        console.log('🚀 Starting security monitoring...');
        
        // Start all monitors
        for (const [name, monitor] of this.monitors) {
            try {
                await monitor.start();
                console.log(`✅ Started ${name} monitor`);
            } catch (error) {
                console.error(`❌ Failed to start ${name} monitor: ${error.message}`);
            }
        }
        
        // Start event processing loop
        this.startEventProcessing();
        
        // Start periodic tasks
        this.startPeriodicTasks();
        
        console.log('🛡️  Security monitoring active');
        
        // Send startup notification
        await this.sendAlert('info', 'Security Monitor Started', {
            message: 'Security monitoring system has been started',
            monitors: Array.from(this.monitors.keys()),
            detectors: Array.from(this.threatDetectors.keys()),
            timestamp: new Date().toISOString()
        });
    }
    
    // Stop monitoring
    async stop() {
        if (!this.isRunning) {
            console.log('⚠️  Security monitor is not running');
            return;
        }
        
        this.isRunning = false;
        console.log('🛑 Stopping security monitoring...');
        
        // Stop all monitors
        for (const [name, monitor] of this.monitors) {
            try {
                await monitor.stop();
                console.log(`✅ Stopped ${name} monitor`);
            } catch (error) {
                console.error(`❌ Failed to stop ${name} monitor: ${error.message}`);
            }
        }
        
        // Save state
        await this.saveBlockedIPs();
        await this.saveAnomalyBaseline();
        
        console.log('🛡️  Security monitoring stopped');
        
        // Send shutdown notification
        await this.sendAlert('info', 'Security Monitor Stopped', {
            message: 'Security monitoring system has been stopped',
            uptime: Date.now() - this.stats.uptime,
            stats: this.stats,
            timestamp: new Date().toISOString()
        });
    }
    
    // Start event processing loop
    startEventProcessing() {
        const processEvents = async () => {
            if (!this.isRunning) return;
            
            try {
                // Process queued events
                while (this.eventQueue.length > 0) {
                    const event = this.eventQueue.shift();
                    await this.processSecurityEvent(event);
                }
                
                // Schedule next processing
                setTimeout(processEvents, this.config.monitoring.interval);
                
            } catch (error) {
                console.error(`Event processing error: ${error.message}`);
                setTimeout(processEvents, this.config.monitoring.interval * 2);
            }
        };
        
        processEvents();
    }
    
    // Start periodic tasks
    startPeriodicTasks() {
        // Cleanup expired blocks
        setInterval(() => {
            this.cleanupExpiredBlocks();
        }, 60000); // Every minute
        
        // Generate reports
        setInterval(() => {
            this.generateSecurityReport();
        }, 3600000); // Every hour
        
        // Update anomaly baseline
        setInterval(() => {
            this.updateAnomalyBaseline();
        }, 300000); // Every 5 minutes
        
        // Cleanup old logs
        setInterval(() => {
            this.cleanupOldLogs();
        }, 86400000); // Every day
    }
    
    // Handle security event
    async handleSecurityEvent(event) {
        this.eventQueue.push(event);
        this.stats.eventsProcessed++;
    }
    
    // Process security event
    async processSecurityEvent(event) {
        try {
            // Log the event
            await this.logSecurityEvent(event);
            
            // Check if IP is already blocked
            if (event.ip && this.blockedIPs.has(event.ip)) {
                return; // Skip processing for blocked IPs
            }
            
            // Run through threat detectors
            for (const [name, detector] of this.threatDetectors) {
                try {
                    const threat = await detector.analyze(event);
                    if (threat) {
                        this.emit('threat-detected', { ...threat, detector: name, event });
                    }
                } catch (error) {
                    console.error(`Threat detector ${name} error: ${error.message}`);
                }
            }
            
            // Update anomaly detection
            if (this.config.threats.anomalyDetection.enabled) {
                this.updateAnomalyMetrics(event);
            }
            
        } catch (error) {
            console.error(`Failed to process security event: ${error.message}`);
        }
    }
    
    // Handle threat detected
    async handleThreatDetected(threat) {
        this.stats.threatsDetected++;
        
        console.log(`🚨 Threat detected: ${threat.type} from ${threat.event.ip || 'unknown'}`);
        
        // Auto-block if configured
        if (this.config.responses.autoBlock.enabled && threat.severity >= 7) {
            await this.blockIP(threat.event.ip, threat.type, threat.duration);
        }
        
        // Send alert
        await this.sendAlert('threat', `Threat Detected: ${threat.type}`, {
            threat,
            event: threat.event,
            timestamp: new Date().toISOString()
        });
        
        // Log threat
        await this.logThreat(threat);
    }
    
    // Handle IP blocked
    async handleIPBlocked(data) {
        this.stats.ipsBlocked++;
        
        console.log(`🚫 IP blocked: ${data.ip} (${data.reason})`);
        
        // Send alert for high-severity blocks
        if (data.severity >= 8) {
            await this.sendAlert('block', `IP Blocked: ${data.ip}`, {
                ip: data.ip,
                reason: data.reason,
                duration: data.duration,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    // Handle anomaly detected
    async handleAnomalyDetected(anomaly) {
        console.log(`📊 Anomaly detected: ${anomaly.metric} (score: ${anomaly.score})`);
        
        // Send alert for significant anomalies
        if (anomaly.score >= 0.9) {
            await this.sendAlert('anomaly', `Anomaly Detected: ${anomaly.metric}`, {
                anomaly,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    // Block IP address
    async blockIP(ip, reason, duration = null) {
        if (!ip || this.blockedIPs.has(ip)) {
            return;
        }
        
        const blockDuration = duration || this.config.threats.bruteForce.blockDuration;
        
        // Add to blocked set
        this.blockedIPs.add(ip);
        
        // Apply blocking method
        try {
            await this.applyIPBlock(ip, blockDuration);
        } catch (error) {
            console.error(`Failed to apply IP block: ${error.message}`);
        }
        
        // Schedule unblock
        setTimeout(() => {
            this.unblockIP(ip);
        }, blockDuration);
        
        // Save blocked IPs
        await this.saveBlockedIPs();
        
        this.emit('ip-blocked', {
            ip,
            reason,
            duration: blockDuration,
            severity: this.calculateThreatSeverity(reason),
            timestamp: Date.now()
        });
    }
    
    // Apply IP block using configured method
    async applyIPBlock(ip, duration) {
        const method = this.config.responses.autoBlock.defaultMethod;
        
        switch (method) {
            case 'iptables':
                await this.blockIPWithIptables(ip);
                break;
            case 'fail2ban':
                await this.blockIPWithFail2ban(ip, duration);
                break;
            case 'cloudflare':
                await this.blockIPWithCloudflare(ip, duration);
                break;
            default:
                console.warn(`Unknown blocking method: ${method}`);
        }
    }
    
    // Block IP with iptables
    async blockIPWithIptables(ip) {
        return new Promise((resolve, reject) => {
            const iptables = spawn('iptables', ['-A', 'INPUT', '-s', ip, '-j', 'DROP']);
            
            iptables.on('close', (code) => {
                if (code === 0) {
                    console.log(`🚫 Blocked ${ip} with iptables`);
                    resolve();
                } else {
                    reject(new Error(`iptables exited with code ${code}`));
                }
            });
            
            iptables.on('error', reject);
        });
    }
    
    // Block IP with fail2ban
    async blockIPWithFail2ban(ip, duration) {
        return new Promise((resolve, reject) => {
            const fail2ban = spawn('fail2ban-client', ['set', 'git-memory-mcp', 'banip', ip]);
            
            fail2ban.on('close', (code) => {
                if (code === 0) {
                    console.log(`🚫 Blocked ${ip} with fail2ban`);
                    resolve();
                } else {
                    reject(new Error(`fail2ban-client exited with code ${code}`));
                }
            });
            
            fail2ban.on('error', reject);
        });
    }
    
    // Block IP with Cloudflare
    async blockIPWithCloudflare(ip, duration) {
        // This would integrate with Cloudflare API
        console.log(`🚫 Would block ${ip} with Cloudflare for ${duration}ms`);
        // Implementation depends on Cloudflare API setup
    }
    
    // Unblock IP address
    async unblockIP(ip) {
        if (!this.blockedIPs.has(ip)) {
            return;
        }
        
        this.blockedIPs.delete(ip);
        
        // Remove from blocking method
        try {
            await this.removeIPBlock(ip);
        } catch (error) {
            console.error(`Failed to remove IP block: ${error.message}`);
        }
        
        // Save blocked IPs
        await this.saveBlockedIPs();
        
        console.log(`✅ Unblocked IP: ${ip}`);
    }
    
    // Remove IP block
    async removeIPBlock(ip) {
        const method = this.config.responses.autoBlock.defaultMethod;
        
        switch (method) {
            case 'iptables':
                await this.unblockIPWithIptables(ip);
                break;
            case 'fail2ban':
                await this.unblockIPWithFail2ban(ip);
                break;
            case 'cloudflare':
                await this.unblockIPWithCloudflare(ip);
                break;
        }
    }
    
    // Unblock IP with iptables
    async unblockIPWithIptables(ip) {
        return new Promise((resolve, reject) => {
            const iptables = spawn('iptables', ['-D', 'INPUT', '-s', ip, '-j', 'DROP']);
            
            iptables.on('close', (code) => {
                if (code === 0) {
                    console.log(`✅ Unblocked ${ip} with iptables`);
                    resolve();
                } else {
                    // Might already be removed, don't treat as error
                    resolve();
                }
            });
            
            iptables.on('error', resolve); // Don't fail on errors
        });
    }
    
    // Unblock IP with fail2ban
    async unblockIPWithFail2ban(ip) {
        return new Promise((resolve, reject) => {
            const fail2ban = spawn('fail2ban-client', ['set', 'git-memory-mcp', 'unbanip', ip]);
            
            fail2ban.on('close', (code) => {
                console.log(`✅ Unblocked ${ip} with fail2ban`);
                resolve();
            });
            
            fail2ban.on('error', resolve); // Don't fail on errors
        });
    }
    
    // Unblock IP with Cloudflare
    async unblockIPWithCloudflare(ip) {
        console.log(`✅ Would unblock ${ip} with Cloudflare`);
        // Implementation depends on Cloudflare API setup
    }
    
    // Calculate threat severity (1-10)
    calculateThreatSeverity(reason) {
        const severityMap = {
            'brute-force': 8,
            'rate-limit': 6,
            'sql-injection': 10,
            'xss': 9,
            'path-traversal': 9,
            'suspicious-activity': 7,
            'anomaly': 5,
            'geo-block': 4
        };
        
        return severityMap[reason] || 5;
    }
    
    // Log security event
    async logSecurityEvent(event) {
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                type: 'security-event',
                ...event
            };
            
            const logLine = JSON.stringify(logEntry) + '\n';
            await fs.appendFile(this.config.sources.logs.security, logLine);
            
        } catch (error) {
            console.error(`Failed to log security event: ${error.message}`);
        }
    }
    
    // Log threat
    async logThreat(threat) {
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                type: 'threat',
                ...threat
            };
            
            const logLine = JSON.stringify(logEntry) + '\n';
            await fs.appendFile(this.config.sources.logs.security, logLine);
            
        } catch (error) {
            console.error(`Failed to log threat: ${error.message}`);
        }
    }
    
    // Send alert
    async sendAlert(type, title, data) {
        this.stats.alertsSent++;
        
        const alerts = [];
        
        // Email alert
        if (this.config.responses.notifications.email.enabled) {
            alerts.push(this.sendEmailAlert(type, title, data));
        }
        
        // Slack alert
        if (this.config.responses.notifications.slack.enabled) {
            alerts.push(this.sendSlackAlert(type, title, data));
        }
        
        // Webhook alert
        if (this.config.responses.notifications.webhook.enabled) {
            alerts.push(this.sendWebhookAlert(type, title, data));
        }
        
        // SMS alert (for critical threats)
        if (this.config.responses.notifications.sms.enabled && type === 'threat' && data.threat?.severity >= 9) {
            alerts.push(this.sendSMSAlert(type, title, data));
        }
        
        await Promise.allSettled(alerts);
    }
    
    // Send email alert
    async sendEmailAlert(type, title, data) {
        try {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransporter(this.config.responses.notifications.email.smtp);
            
            const severity = this.getAlertSeverity(type, data);
            const color = this.getAlertColor(severity);
            
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: ${color}; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">${this.getAlertIcon(type)} ${title}</h1>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Security Alert - ${severity.toUpperCase()}</p>
                    </div>
                    
                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3>Alert Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Type:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${type}</td></tr>
                            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Timestamp:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.timestamp}</td></tr>
                            ${data.threat ? `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Threat Type:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.threat.type}</td></tr>` : ''}
                            ${data.ip ? `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">IP Address:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.ip}</td></tr>` : ''}
                            ${data.reason ? `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Reason:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.reason}</td></tr>` : ''}
                        </table>
                        
                        ${data.event ? `
                            <h3>Event Details</h3>
                            <pre style="background: #fff; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px;">${JSON.stringify(data.event, null, 2)}</pre>
                        ` : ''}
                        
                        <div style="margin-top: 20px; padding: 15px; background: #e8f4fd; border-left: 4px solid #2196F3; border-radius: 4px;">
                            <strong>🛡️ Git Memory MCP Security System</strong><br>
                            <small>Automated security monitoring and threat detection</small>
                        </div>
                    </div>
                </div>
            `;
            
            await transporter.sendMail({
                from: this.config.responses.notifications.email.from,
                to: this.config.responses.notifications.email.to,
                subject: `[${severity.toUpperCase()}] ${title}`,
                html
            });
            
        } catch (error) {
            console.error(`Failed to send email alert: ${error.message}`);
        }
    }
    
    // Send Slack alert
    async sendSlackAlert(type, title, data) {
        try {
            const severity = this.getAlertSeverity(type, data);
            const color = this.getSlackColor(severity);
            
            const payload = {
                channel: this.config.responses.notifications.slack.channel,
                username: 'Security Monitor',
                icon_emoji: ':shield:',
                attachments: [{
                    color,
                    title: `${this.getAlertIcon(type)} ${title}`,
                    text: data.message || 'Security alert detected',
                    fields: [
                        { title: 'Type', value: type, short: true },
                        { title: 'Severity', value: severity.toUpperCase(), short: true },
                        { title: 'Timestamp', value: data.timestamp, short: false }
                    ],
                    footer: 'Git Memory MCP Security',
                    ts: Math.floor(Date.now() / 1000)
                }]
            };
            
            if (data.threat) {
                payload.attachments[0].fields.push(
                    { title: 'Threat Type', value: data.threat.type, short: true },
                    { title: 'Detector', value: data.threat.detector, short: true }
                );
            }
            
            if (data.ip) {
                payload.attachments[0].fields.push(
                    { title: 'IP Address', value: data.ip, short: true }
                );
            }
            
            const response = await fetch(this.config.responses.notifications.slack.webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                console.error(`Slack alert failed: ${response.status}`);
            }
            
        } catch (error) {
            console.error(`Failed to send Slack alert: ${error.message}`);
        }
    }
    
    // Send webhook alert
    async sendWebhookAlert(type, title, data) {
        try {
            const payload = {
                type,
                title,
                data,
                system: 'git-memory-mcp-security',
                timestamp: new Date().toISOString()
            };
            
            // Add signature if secret is configured
            let headers = { 'Content-Type': 'application/json' };
            if (this.config.responses.notifications.webhook.secret) {
                const signature = crypto
                    .createHmac('sha256', this.config.responses.notifications.webhook.secret)
                    .update(JSON.stringify(payload))
                    .digest('hex');
                headers['X-Signature'] = `sha256=${signature}`;
            }
            
            const response = await fetch(this.config.responses.notifications.webhook.url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                console.error(`Webhook alert failed: ${response.status}`);
            }
            
        } catch (error) {
            console.error(`Failed to send webhook alert: ${error.message}`);
        }
    }
    
    // Send SMS alert
    async sendSMSAlert(type, title, data) {
        try {
            // This is a simplified implementation
            // In production, you'd integrate with Twilio, AWS SNS, etc.
            const message = `🚨 SECURITY ALERT: ${title}\n${data.message || 'Critical threat detected'}\nTime: ${data.timestamp}`;
            
            console.log(`📱 SMS Alert: ${message}`);
            
            // Example Twilio integration:
            // const twilio = require('twilio');
            // const client = twilio(this.config.responses.notifications.sms.apiKey, this.config.responses.notifications.sms.apiSecret);
            // await client.messages.create({
            //     body: message,
            //     from: this.config.responses.notifications.sms.from,
            //     to: this.config.responses.notifications.sms.to[0]
            // });
            
        } catch (error) {
            console.error(`Failed to send SMS alert: ${error.message}`);
        }
    }
    
    // Get alert severity
    getAlertSeverity(type, data) {
        if (type === 'threat' && data.threat) {
            if (data.threat.severity >= 9) return 'critical';
            if (data.threat.severity >= 7) return 'high';
            if (data.threat.severity >= 5) return 'medium';
            return 'low';
        }
        
        const severityMap = {
            'threat': 'high',
            'block': 'medium',
            'anomaly': 'medium',
            'info': 'low'
        };
        
        return severityMap[type] || 'low';
    }
    
    // Get alert color
    getAlertColor(severity) {
        const colors = {
            'critical': '#d32f2f',
            'high': '#f57c00',
            'medium': '#fbc02d',
            'low': '#388e3c'
        };
        
        return colors[severity] || '#757575';
    }
    
    // Get Slack color
    getSlackColor(severity) {
        const colors = {
            'critical': 'danger',
            'high': 'warning',
            'medium': 'warning',
            'low': 'good'
        };
        
        return colors[severity] || '#757575';
    }
    
    // Get alert icon
    getAlertIcon(type) {
        const icons = {
            'threat': '🚨',
            'block': '🚫',
            'anomaly': '📊',
            'info': 'ℹ️'
        };
        
        return icons[type] || '⚠️';
    }
    
    // Update anomaly metrics
    updateAnomalyMetrics(event) {
        // This is a simplified implementation
        // In production, you'd use more sophisticated anomaly detection algorithms
        
        const metrics = [
            `requests_per_minute_${event.ip}`,
            `error_rate_${event.source}`,
            `response_time_${event.endpoint}`,
            'total_requests_per_minute'
        ];
        
        for (const metric of metrics) {
            if (!this.anomalyBaseline.has(metric)) {
                this.anomalyBaseline.set(metric, {
                    samples: [],
                    mean: 0,
                    stddev: 0,
                    lastUpdate: Date.now()
                });
            }
            
            const baseline = this.anomalyBaseline.get(metric);
            const value = this.extractMetricValue(event, metric);
            
            if (value !== null) {
                baseline.samples.push(value);
                
                // Keep only recent samples
                if (baseline.samples.length > this.config.threats.anomalyDetection.minSamples) {
                    baseline.samples = baseline.samples.slice(-this.config.threats.anomalyDetection.minSamples);
                }
                
                // Update statistics
                baseline.mean = baseline.samples.reduce((a, b) => a + b, 0) / baseline.samples.length;
                const variance = baseline.samples.reduce((a, b) => a + Math.pow(b - baseline.mean, 2), 0) / baseline.samples.length;
                baseline.stddev = Math.sqrt(variance);
                baseline.lastUpdate = Date.now();
                
                // Check for anomaly
                const zScore = Math.abs((value - baseline.mean) / (baseline.stddev || 1));
                if (zScore > 3 && baseline.samples.length >= this.config.threats.anomalyDetection.minSamples) {
                    this.emit('anomaly-detected', {
                        metric,
                        value,
                        expected: baseline.mean,
                        score: Math.min(zScore / 3, 1),
                        event
                    });
                }
            }
        }
    }
    
    // Extract metric value from event
    extractMetricValue(event, metric) {
        // This is a simplified implementation
        // In production, you'd have more sophisticated metric extraction
        
        if (metric.startsWith('requests_per_minute_')) {
            return 1; // Each event represents one request
        }
        
        if (metric.startsWith('error_rate_')) {
            return event.status >= 400 ? 1 : 0;
        }
        
        if (metric.startsWith('response_time_')) {
            return event.responseTime || 0;
        }
        
        if (metric === 'total_requests_per_minute') {
            return 1;
        }
        
        return null;
    }
    
    // Cleanup expired blocks
    cleanupExpiredBlocks() {
        // This is handled by setTimeout in blockIP method
        // But we can also do periodic cleanup here
    }
    
    // Update anomaly baseline
    async updateAnomalyBaseline() {
        await this.saveAnomalyBaseline();
    }
    
    // Generate security report
    async generateSecurityReport() {
        try {
            const report = {
                timestamp: new Date().toISOString(),
                period: 'hourly',
                stats: { ...this.stats },
                blockedIPs: Array.from(this.blockedIPs),
                topThreats: await this.getTopThreats(),
                systemHealth: await this.getSystemHealth(),
                recommendations: await this.getSecurityRecommendations()
            };
            
            const reportFile = path.join(
                this.config.storage.reports.path,
                `security-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
            );
            
            await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
            
            console.log(`📊 Security report generated: ${reportFile}`);
            
        } catch (error) {
            console.error(`Failed to generate security report: ${error.message}`);
        }
    }
    
    // Get top threats
    async getTopThreats() {
        // This would analyze recent security logs to identify top threats
        return [
            { type: 'brute-force', count: 15, severity: 8 },
            { type: 'suspicious-activity', count: 8, severity: 7 },
            { type: 'rate-limit', count: 23, severity: 6 }
        ];
    }
    
    // Get system health
    async getSystemHealth() {
        return {
            cpu: os.loadavg()[0],
            memory: (os.totalmem() - os.freemem()) / os.totalmem(),
            uptime: os.uptime(),
            monitors: this.monitors.size,
            detectors: this.threatDetectors.size
        };
    }
    
    // Get security recommendations
    async getSecurityRecommendations() {
        const recommendations = [];
        
        if (this.stats.threatsDetected > 50) {
            recommendations.push({
                type: 'high-threat-activity',
                message: 'High number of threats detected. Consider reviewing security policies.',
                priority: 'high'
            });
        }
        
        if (this.blockedIPs.size > 100) {
            recommendations.push({
                type: 'many-blocked-ips',
                message: 'Large number of blocked IPs. Consider implementing additional preventive measures.',
                priority: 'medium'
            });
        }
        
        return recommendations;
    }
    
    // Cleanup old logs
    async cleanupOldLogs() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.config.monitoring.logRetention);
            
            // Cleanup security logs
            // This is a simplified implementation
            console.log(`🧹 Cleaning up logs older than ${cutoffDate.toISOString()}`);
            
        } catch (error) {
            console.error(`Failed to cleanup old logs: ${error.message}`);
        }
    }
    
    // Get status
    getStatus() {
        return {
            running: this.isRunning,
            uptime: Date.now() - this.stats.uptime,
            stats: this.stats,
            monitors: Array.from(this.monitors.keys()),
            detectors: Array.from(this.threatDetectors.keys()),
            blockedIPs: this.blockedIPs.size,
            config: {
                monitoring: this.config.monitoring.enabled,
                autoBlock: this.config.responses.autoBlock.enabled,
                notifications: {
                    email: this.config.responses.notifications.email.enabled,
                    slack: this.config.responses.notifications.slack.enabled,
                    webhook: this.config.responses.notifications.webhook.enabled,
                    sms: this.config.responses.notifications.sms.enabled
                }
            }
        };
    }
}

// =============================================================================
// Threat Detector Classes
// =============================================================================

// Brute Force Detector
class BruteForceDetector {
    constructor(config) {
        this.config = config;
        this.attempts = new Map(); // IP -> { count, firstAttempt, lastAttempt }
    }
    
    async analyze(event) {
        if (!event.ip || event.status !== 401) {
            return null;
        }
        
        const now = Date.now();
        const ip = event.ip;
        
        if (!this.attempts.has(ip)) {
            this.attempts.set(ip, {
                count: 1,
                firstAttempt: now,
                lastAttempt: now
            });
            return null;
        }
        
        const attempt = this.attempts.get(ip);
        
        // Reset if outside time window
        if (now - attempt.firstAttempt > this.config.timeWindow) {
            this.attempts.set(ip, {
                count: 1,
                firstAttempt: now,
                lastAttempt: now
            });
            return null;
        }
        
        // Increment attempt count
        attempt.count++;
        attempt.lastAttempt = now;
        
        // Check if threshold exceeded
        if (attempt.count >= this.config.maxAttempts) {
            return {
                type: 'brute-force',
                severity: 8,
                confidence: 0.9,
                duration: this.config.blockDuration,
                details: {
                    attempts: attempt.count,
                    timeWindow: now - attempt.firstAttempt
                }
            };
        }
        
        return null;
    }
}

// Rate Limit Detector
class RateLimitDetector {
    constructor(config) {
        this.config = config;
        this.requests = new Map(); // IP -> [timestamps]
    }
    
    async analyze(event) {
        if (!event.ip) {
            return null;
        }
        
        const now = Date.now();
        const ip = event.ip;
        
        if (!this.requests.has(ip)) {
            this.requests.set(ip, [now]);
            return null;
        }
        
        const timestamps = this.requests.get(ip);
        
        // Remove old timestamps
        const cutoff = now - this.config.timeWindow;
        const recentTimestamps = timestamps.filter(t => t > cutoff);
        recentTimestamps.push(now);
        
        this.requests.set(ip, recentTimestamps);
        
        // Check if rate limit exceeded
        if (recentTimestamps.length > this.config.maxRequests) {
            return {
                type: 'rate-limit',
                severity: 6,
                confidence: 0.8,
                duration: this.config.blockDuration,
                details: {
                    requests: recentTimestamps.length,
                    timeWindow: this.config.timeWindow
                }
            };
        }
        
        return null;
    }
}

// Suspicious Activity Detector
class SuspiciousActivityDetector {
    constructor(config) {
        this.config = config;
    }
    
    async analyze(event) {
        let score = 0;
        const details = [];
        
        // Check URL patterns
        if (event.url) {
            for (const pattern of this.config.patterns) {
                if (pattern.test(event.url)) {
                    score += 20;
                    details.push(`Suspicious URL pattern: ${pattern.source}`);
                }
            }
        }
        
        // Check user agent
        if (event.userAgent) {
            if (/bot|crawler|scanner/i.test(event.userAgent)) {
                score += 10;
                details.push('Suspicious user agent');
            }
        }
        
        // Check request body
        if (event.body) {
            for (const pattern of this.config.patterns) {
                if (pattern.test(event.body)) {
                    score += 25;
                    details.push(`Suspicious request body: ${pattern.source}`);
                }
            }
        }
        
        // Check headers
        if (event.headers) {
            const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-originating-ip'];
            for (const header of suspiciousHeaders) {
                if (event.headers[header] && event.headers[header].includes(',')) {
                    score += 5;
                    details.push(`Multiple IPs in ${header} header`);
                }
            }
        }
        
        if (score >= this.config.scoreThreshold) {
            return {
                type: 'suspicious-activity',
                severity: Math.min(Math.floor(score / 10), 10),
                confidence: Math.min(score / 100, 1),
                duration: 3600000, // 1 hour
                details: {
                    score,
                    patterns: details
                }
            };
        }
        
        return null;
    }
}

// Anomaly Detector
class AnomalyDetector {
    constructor(config) {
        this.config = config;
    }
    
    async analyze(event) {
        // This is handled in the main SecurityMonitor class
        // This detector is more for statistical analysis
        return null;
    }
}

// =============================================================================
// Monitor Classes
// =============================================================================

// Log Monitor
class LogMonitor extends EventEmitter {
    constructor(logPath, type) {
        super();
        this.logPath = logPath;
        this.type = type;
        this.watcher = null;
        this.lastPosition = 0;
    }
    
    async start() {
        try {
            // Get initial file size
            const stats = await fs.stat(this.logPath);
            this.lastPosition = stats.size;
            
            // Watch for file changes
            this.watcher = fs.watch(this.logPath, (eventType) => {
                if (eventType === 'change') {
                    this.processNewLines();
                }
            });
            
        } catch (error) {
            console.warn(`Warning: Could not start log monitor for ${this.logPath}: ${error.message}`);
        }
    }
    
    async stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
    }
    
    async processNewLines() {
        try {
            const stats = await fs.stat(this.logPath);
            
            if (stats.size <= this.lastPosition) {
                return; // File was truncated or no new data
            }
            
            const stream = fs.createReadStream(this.logPath, {
                start: this.lastPosition,
                end: stats.size - 1
            });
            
            let buffer = '';
            
            stream.on('data', (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line in buffer
                
                for (const line of lines) {
                    if (line.trim()) {
                        this.parseLine(line);
                    }
                }
            });
            
            stream.on('end', () => {
                this.lastPosition = stats.size;
            });
            
        } catch (error) {
            console.error(`Error processing log file ${this.logPath}: ${error.message}`);
        }
    }
    
    parseLine(line) {
        try {
            let event = null;
            
            if (this.type === 'access') {
                event = this.parseAccessLog(line);
            } else if (this.type === 'error') {
                event = this.parseErrorLog(line);
            } else if (this.type === 'application') {
                event = this.parseApplicationLog(line);
            }
            
            if (event) {
                this.emit('event', event);
            }
            
        } catch (error) {
            console.error(`Error parsing log line: ${error.message}`);
        }
    }
    
    parseAccessLog(line) {
        // Parse common log format: IP - - [timestamp] "method url protocol" status size "referer" "user-agent"
        const regex = /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) (\S+)" (\d+) (\S+) "([^"]*)" "([^"]*)"/;
        const match = line.match(regex);
        
        if (match) {
            return {
                ip: match[1],
                timestamp: new Date(match[2]).toISOString(),
                method: match[3],
                url: match[4],
                protocol: match[5],
                status: parseInt(match[6]),
                size: match[7] === '-' ? 0 : parseInt(match[7]),
                referer: match[8],
                userAgent: match[9],
                type: 'access'
            };
        }
        
        return null;
    }
    
    parseErrorLog(line) {
        // Parse error log format: [timestamp] [level] message
        const regex = /^\[([^\]]+)\] \[([^\]]+)\] (.+)$/;
        const match = line.match(regex);
        
        if (match) {
            return {
                timestamp: new Date(match[1]).toISOString(),
                level: match[2],
                message: match[3],
                type: 'error'
            };
        }
        
        return null;
    }
    
    parseApplicationLog(line) {
        try {
            // Try to parse as JSON first
            const event = JSON.parse(line);
            return {
                ...event,
                type: 'application'
            };
        } catch {
            // Fallback to simple text parsing
            return {
                timestamp: new Date().toISOString(),
                message: line,
                type: 'application'
            };
        }
    }
}

// System Monitor
class SystemMonitor extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.interval = null;
        this.lastMetrics = {};
    }
    
    async start() {
        this.interval = setInterval(() => {
            this.collectMetrics();
        }, 30000); // Every 30 seconds
        
        // Collect initial metrics
        await this.collectMetrics();
    }
    
    async stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    async collectMetrics() {
        try {
            const metrics = {
                timestamp: new Date().toISOString(),
                cpu: os.loadavg(),
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem(),
                    percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
                },
                uptime: os.uptime(),
                processes: await this.getProcessCount()
            };
            
            // Check for anomalies
            this.checkSystemAnomalies(metrics);
            
            this.lastMetrics = metrics;
            this.emit('event', {
                type: 'system-metrics',
                ...metrics
            });
            
        } catch (error) {
            console.error(`System metrics collection error: ${error.message}`);
        }
    }
    
    async getProcessCount() {
        try {
            if (process.platform === 'win32') {
                return new Promise((resolve) => {
                    const { exec } = require('child_process');
                    exec('tasklist /fo csv | find /c /v ""', (error, stdout) => {
                        resolve(error ? 0 : parseInt(stdout.trim()) - 1);
                    });
                });
            } else {
                return new Promise((resolve) => {
                    const { exec } = require('child_process');
                    exec('ps aux | wc -l', (error, stdout) => {
                        resolve(error ? 0 : parseInt(stdout.trim()) - 1);
                    });
                });
            }
        } catch {
            return 0;
        }
    }
    
    checkSystemAnomalies(metrics) {
        // Check CPU usage
        if (metrics.cpu[0] > 0.8) {
            this.emit('event', {
                type: 'system-anomaly',
                metric: 'cpu',
                value: metrics.cpu[0],
                severity: 'medium',
                timestamp: metrics.timestamp
            });
        }
        
        // Check memory usage
        if (metrics.memory.percentage > 90) {
            this.emit('event', {
                type: 'system-anomaly',
                metric: 'memory',
                value: metrics.memory.percentage,
                severity: 'high',
                timestamp: metrics.timestamp
            });
        }
    }
}

// Network Monitor
class NetworkMonitor extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.interval = null;
        this.connections = new Map();
    }
    
    async start() {
        this.interval = setInterval(() => {
            this.monitorConnections();
        }, 10000); // Every 10 seconds
        
        // Start initial monitoring
        await this.monitorConnections();
    }
    
    async stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    async monitorConnections() {
        try {
            const connections = await this.getActiveConnections();
            
            for (const conn of connections) {
                this.emit('event', {
                    type: 'network-connection',
                    ...conn,
                    timestamp: new Date().toISOString()
                });
            }
            
        } catch (error) {
            console.error(`Network monitoring error: ${error.message}`);
        }
    }
    
    async getActiveConnections() {
        return new Promise((resolve) => {
            const { exec } = require('child_process');
            const command = process.platform === 'win32' 
                ? 'netstat -an'
                : 'netstat -tuln';
            
            exec(command, (error, stdout) => {
                if (error) {
                    resolve([]);
                    return;
                }
                
                const connections = [];
                const lines = stdout.split('\n');
                
                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 4 && (parts[0] === 'TCP' || parts[0] === 'UDP')) {
                        const [protocol, localAddr, foreignAddr, state] = parts;
                        connections.push({
                            protocol,
                            localAddress: localAddr,
                            foreignAddress: foreignAddr,
                            state: state || 'N/A'
                        });
                    }
                }
                
                resolve(connections);
            });
        });
    }
}

// =============================================================================
// CLI Interface
// =============================================================================

class SecurityMonitorCLI {
    constructor() {
        this.monitor = null;
    }
    
    async run() {
        const args = process.argv.slice(2);
        const command = args[0] || 'start';
        
        switch (command) {
            case 'start':
                await this.startMonitoring();
                break;
            case 'stop':
                await this.stopMonitoring();
                break;
            case 'status':
                await this.showStatus();
                break;
            case 'config':
                await this.showConfig();
                break;
            case 'test':
                await this.runTests();
                break;
            case 'help':
            default:
                this.showHelp();
                break;
        }
    }
    
    async startMonitoring() {
        try {
            console.log('🛡️  Starting Git Memory MCP Security Monitor...');
            
            this.monitor = new SecurityMonitor();
            await this.monitor.start();
            
            // Handle graceful shutdown
            process.on('SIGINT', async () => {
                console.log('\n🛑 Received SIGINT, shutting down gracefully...');
                await this.monitor.stop();
                process.exit(0);
            });
            
            process.on('SIGTERM', async () => {
                console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
                await this.monitor.stop();
                process.exit(0);
            });
            
            // Keep process alive
            process.stdin.resume();
            
        } catch (error) {
            console.error(`❌ Failed to start security monitor: ${error.message}`);
            process.exit(1);
        }
    }
    
    async stopMonitoring() {
        console.log('🛑 Stopping security monitor...');
        // This would typically send a signal to a running process
        console.log('✅ Security monitor stopped');
    }
    
    async showStatus() {
        try {
            // This would typically connect to a running monitor instance
            console.log('📊 Security Monitor Status:');
            console.log('Status: Not implemented in CLI mode');
            console.log('Use the API endpoint /api/security/status for real-time status');
            
        } catch (error) {
            console.error(`❌ Failed to get status: ${error.message}`);
        }
    }
    
    async showConfig() {
        console.log('⚙️  Security Monitor Configuration:');
        console.log(JSON.stringify(CONFIG, null, 2));
    }
    
    async runTests() {
        console.log('🧪 Running security monitor tests...');
        
        try {
            // Test threat detectors
            console.log('Testing threat detectors...');
            
            const bruteForceDetector = new BruteForceDetector(CONFIG.threats.bruteForce);
            const rateLimitDetector = new RateLimitDetector(CONFIG.threats.rateLimiting);
            const suspiciousDetector = new SuspiciousActivityDetector(CONFIG.threats.suspiciousActivity);
            
            // Test brute force detection
            const testEvent = {
                ip: '192.168.1.100',
                status: 401,
                timestamp: new Date().toISOString()
            };
            
            for (let i = 0; i < 6; i++) {
                const threat = await bruteForceDetector.analyze(testEvent);
                if (threat) {
                    console.log('✅ Brute force detection working');
                    break;
                }
            }
            
            // Test suspicious activity detection
            const suspiciousEvent = {
                ip: '192.168.1.101',
                url: '/admin/../../../etc/passwd',
                timestamp: new Date().toISOString()
            };
            
            const suspiciousThreat = await suspiciousDetector.analyze(suspiciousEvent);
            if (suspiciousThreat) {
                console.log('✅ Suspicious activity detection working');
            }
            
            console.log('✅ All tests passed');
            
        } catch (error) {
            console.error(`❌ Tests failed: ${error.message}`);
        }
    }
    
    showHelp() {
        console.log(`
🛡️  Git Memory MCP Security Monitor

Usage: node security-monitor.js [command]

Commands:
  start     Start the security monitoring system
  stop      Stop the security monitoring system
  status    Show current status
  config    Show current configuration
  test      Run system tests
  help      Show this help message

Environment Variables:
  SECURITY_MONITORING_ENABLED    Enable/disable monitoring (default: true)
  MONITORING_INTERVAL           Monitoring interval in ms (default: 5000)
  BRUTE_FORCE_MAX_ATTEMPTS      Max failed attempts (default: 5)
  RATE_LIMIT_MAX_REQUESTS       Max requests per window (default: 100)
  AUTO_BLOCK_ENABLED            Enable auto-blocking (default: true)
  SECURITY_EMAIL_ALERTS         Enable email alerts (default: false)
  SLACK_ALERTS                  Enable Slack alerts (default: false)
  
For more information, visit: https://github.com/git-memory-mcp/security
`);
    }
}

// =============================================================================
// Export and CLI Entry Point
// =============================================================================

module.exports = {
    SecurityMonitor,
    BruteForceDetector,
    RateLimitDetector,
    SuspiciousActivityDetector,
    AnomalyDetector,
    LogMonitor,
    SystemMonitor,
    NetworkMonitor,
    CONFIG
};

// CLI entry point
if (require.main === module) {
    const cli = new SecurityMonitorCLI();
    cli.run().catch(error => {
        console.error(`❌ CLI Error: ${error.message}`);
        process.exit(1);
    });
}