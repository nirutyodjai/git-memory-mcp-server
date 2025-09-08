/**
 * Security Integration Service
 * รวมระบบความปลอดภัยทั้งหมดเข้าด้วยกัน
 * Enterprise-grade security orchestration
 */

const SecurityMiddleware = require('../middleware/securityMiddleware');
const AuthMiddleware = require('../middleware/authMiddleware');
const UserService = require('./userService');
const AuditService = require('./auditService');
const MonitoringService = require('./monitoringService');
const securityConfig = require('../config/security-config');
const EventEmitter = require('events');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class SecurityIntegrationService extends EventEmitter {
    constructor() {
        super();
        
        // Initialize services
        this.securityMiddleware = new SecurityMiddleware();
        this.authMiddleware = new AuthMiddleware();
        this.userService = new UserService();
        this.auditService = new AuditService();
        this.monitoringService = new MonitoringService();
        
        // Security state
        this.securityState = {
            initialized: false,
            threats: new Map(),
            sessions: new Map(),
            rateLimits: new Map(),
            blockedIPs: new Set(),
            suspiciousActivities: new Map()
        };
        
        // Security metrics
        this.metrics = {
            totalLogins: 0,
            failedLogins: 0,
            blockedAttempts: 0,
            securityEvents: 0,
            activeThreats: 0
        };
        
        this.initialize();
    }
    
    /**
     * Initialize security integration service
     */
    async initialize() {
        try {
            console.log('🔐 Initializing Security Integration Service...');
            
            // Initialize all services
            await this.userService.initialize();
            await this.auditService.initialize();
            await this.monitoringService.initialize();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start security monitoring
            this.startSecurityMonitoring();
            
            // Setup threat detection
            this.setupThreatDetection();
            
            // Initialize compliance monitoring
            this.initializeComplianceMonitoring();
            
            this.securityState.initialized = true;
            
            console.log('✅ Security Integration Service initialized successfully');
            this.emit('security:initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Security Integration Service:', error);
            this.emit('security:initialization_failed', error);
            throw error;
        }
    }
    
    /**
     * Setup event listeners for security events
     */
    setupEventListeners() {
        // User service events
        this.userService.on('user:login_attempt', this.handleLoginAttempt.bind(this));
        this.userService.on('user:login_success', this.handleLoginSuccess.bind(this));
        this.userService.on('user:login_failed', this.handleLoginFailed.bind(this));
        this.userService.on('user:password_changed', this.handlePasswordChanged.bind(this));
        this.userService.on('user:account_locked', this.handleAccountLocked.bind(this));
        
        // Audit service events
        this.auditService.on('audit:security_event', this.handleSecurityEvent.bind(this));
        this.auditService.on('audit:compliance_violation', this.handleComplianceViolation.bind(this));
        
        // Monitoring service events
        this.monitoringService.on('monitoring:threat_detected', this.handleThreatDetected.bind(this));
        this.monitoringService.on('monitoring:anomaly_detected', this.handleAnomalyDetected.bind(this));
        this.monitoringService.on('monitoring:performance_issue', this.handlePerformanceIssue.bind(this));
        
        console.log('🔗 Security event listeners setup completed');
    }
    
    /**
     * Start security monitoring
     */
    startSecurityMonitoring() {
        // Monitor security metrics every 30 seconds
        setInterval(() => {
            this.updateSecurityMetrics();
        }, 30000);
        
        // Check for threats every minute
        setInterval(() => {
            this.checkForThreats();
        }, 60000);
        
        // Clean up old data every hour
        setInterval(() => {
            this.cleanupOldData();
        }, 3600000);
        
        console.log('📊 Security monitoring started');
    }
    
    /**
     * Setup threat detection system
     */
    setupThreatDetection() {
        this.threatDetectionRules = [
            {
                name: 'Brute Force Attack',
                condition: (data) => {
                    const failedAttempts = this.getFailedLoginAttempts(data.ip, 300000); // 5 minutes
                    return failedAttempts >= 5;
                },
                severity: 'high',
                action: 'block_ip'
            },
            {
                name: 'Suspicious Login Pattern',
                condition: (data) => {
                    const locations = this.getLoginLocations(data.userId, 3600000); // 1 hour
                    return locations.length > 3;
                },
                severity: 'medium',
                action: 'require_mfa'
            },
            {
                name: 'Unusual API Usage',
                condition: (data) => {
                    const requests = this.getApiRequests(data.apiKey, 60000); // 1 minute
                    return requests > 1000;
                },
                severity: 'medium',
                action: 'rate_limit'
            },
            {
                name: 'Privilege Escalation Attempt',
                condition: (data) => {
                    return data.action === 'role_change' && data.newRole === 'admin';
                },
                severity: 'critical',
                action: 'alert_admin'
            }
        ];
        
        console.log('🛡️ Threat detection rules configured');
    }
    
    /**
     * Initialize compliance monitoring
     */
    initializeComplianceMonitoring() {
        this.complianceRules = {
            gdpr: {
                dataRetention: 365 * 24 * 60 * 60 * 1000, // 1 year
                consentRequired: true,
                rightToErasure: true
            },
            hipaa: {
                encryptionRequired: true,
                auditTrailRequired: true,
                accessControlRequired: true
            },
            sox: {
                financialDataProtection: true,
                changeManagement: true,
                accessReview: true
            },
            pci: {
                cardDataEncryption: true,
                networkSegmentation: true,
                regularTesting: true
            }
        };
        
        console.log('📋 Compliance monitoring initialized');
    }
    
    /**
     * Handle login attempt
     */
    async handleLoginAttempt(data) {
        try {
            this.metrics.totalLogins++;
            
            // Check if IP is blocked
            if (this.securityState.blockedIPs.has(data.ip)) {
                this.metrics.blockedAttempts++;
                throw new Error('IP address is blocked');
            }
            
            // Check rate limiting
            const rateLimitKey = `login:${data.ip}`;
            const attempts = this.securityState.rateLimits.get(rateLimitKey) || 0;
            
            if (attempts >= securityConfig.rateLimiting.login.max) {
                this.metrics.blockedAttempts++;
                throw new Error('Rate limit exceeded');
            }
            
            this.securityState.rateLimits.set(rateLimitKey, attempts + 1);
            
            // Log the attempt
            await this.auditService.logEvent({
                type: 'LOGIN_ATTEMPT',
                userId: data.userId,
                ip: data.ip,
                userAgent: data.userAgent,
                timestamp: new Date()
            });
            
        } catch (error) {
            console.error('Error handling login attempt:', error);
            this.emit('security:login_attempt_error', { data, error });
        }
    }
    
    /**
     * Handle successful login
     */
    async handleLoginSuccess(data) {
        try {
            // Create session
            const sessionId = crypto.randomUUID();
            this.securityState.sessions.set(sessionId, {
                userId: data.userId,
                ip: data.ip,
                userAgent: data.userAgent,
                loginTime: new Date(),
                lastActivity: new Date()
            });
            
            // Reset rate limiting for successful login
            const rateLimitKey = `login:${data.ip}`;
            this.securityState.rateLimits.delete(rateLimitKey);
            
            // Log successful login
            await this.auditService.logEvent({
                type: 'LOGIN_SUCCESS',
                userId: data.userId,
                sessionId,
                ip: data.ip,
                userAgent: data.userAgent,
                timestamp: new Date()
            });
            
            this.emit('security:login_success', { ...data, sessionId });
            
        } catch (error) {
            console.error('Error handling login success:', error);
            this.emit('security:login_success_error', { data, error });
        }
    }
    
    /**
     * Handle failed login
     */
    async handleLoginFailed(data) {
        try {
            this.metrics.failedLogins++;
            
            // Track suspicious activity
            const suspiciousKey = `failed_login:${data.ip}`;
            const failedAttempts = this.securityState.suspiciousActivities.get(suspiciousKey) || 0;
            this.securityState.suspiciousActivities.set(suspiciousKey, failedAttempts + 1);
            
            // Check for brute force attack
            if (failedAttempts >= 5) {
                await this.handleThreatDetected({
                    type: 'brute_force_attack',
                    severity: 'high',
                    ip: data.ip,
                    details: `${failedAttempts + 1} failed login attempts`
                });
            }
            
            // Log failed login
            await this.auditService.logSecurityEvent({
                type: 'LOGIN_FAILED',
                severity: 'medium',
                ip: data.ip,
                userAgent: data.userAgent,
                reason: data.reason,
                timestamp: new Date()
            });
            
            this.emit('security:login_failed', data);
            
        } catch (error) {
            console.error('Error handling login failure:', error);
            this.emit('security:login_failed_error', { data, error });
        }
    }
    
    /**
     * Handle password change
     */
    async handlePasswordChanged(data) {
        try {
            // Log password change
            await this.auditService.logEvent({
                type: 'PASSWORD_CHANGED',
                userId: data.userId,
                ip: data.ip,
                userAgent: data.userAgent,
                timestamp: new Date()
            });
            
            // Invalidate all sessions for the user
            await this.invalidateUserSessions(data.userId);
            
            this.emit('security:password_changed', data);
            
        } catch (error) {
            console.error('Error handling password change:', error);
            this.emit('security:password_change_error', { data, error });
        }
    }
    
    /**
     * Handle account locked
     */
    async handleAccountLocked(data) {
        try {
            // Log account lock
            await this.auditService.logSecurityEvent({
                type: 'ACCOUNT_LOCKED',
                severity: 'high',
                userId: data.userId,
                reason: data.reason,
                timestamp: new Date()
            });
            
            // Invalidate all sessions for the user
            await this.invalidateUserSessions(data.userId);
            
            this.emit('security:account_locked', data);
            
        } catch (error) {
            console.error('Error handling account lock:', error);
            this.emit('security:account_lock_error', { data, error });
        }
    }
    
    /**
     * Handle security event
     */
    async handleSecurityEvent(data) {
        try {
            this.metrics.securityEvents++;
            
            // Check threat detection rules
            for (const rule of this.threatDetectionRules) {
                if (rule.condition(data)) {
                    await this.executeThreatResponse(rule, data);
                }
            }
            
            this.emit('security:event_processed', data);
            
        } catch (error) {
            console.error('Error handling security event:', error);
            this.emit('security:event_error', { data, error });
        }
    }
    
    /**
     * Handle compliance violation
     */
    async handleComplianceViolation(data) {
        try {
            // Log compliance violation
            await this.auditService.logSecurityEvent({
                type: 'COMPLIANCE_VIOLATION',
                severity: 'critical',
                standard: data.standard,
                violation: data.violation,
                details: data.details,
                timestamp: new Date()
            });
            
            // Alert administrators
            await this.alertAdministrators({
                type: 'compliance_violation',
                severity: 'critical',
                message: `Compliance violation detected: ${data.violation}`,
                details: data
            });
            
            this.emit('security:compliance_violation', data);
            
        } catch (error) {
            console.error('Error handling compliance violation:', error);
            this.emit('security:compliance_violation_error', { data, error });
        }
    }
    
    /**
     * Handle threat detected
     */
    async handleThreatDetected(data) {
        try {
            this.metrics.activeThreats++;
            
            const threatId = crypto.randomUUID();
            this.securityState.threats.set(threatId, {
                ...data,
                id: threatId,
                detectedAt: new Date(),
                status: 'active'
            });
            
            // Log threat
            await this.auditService.logSecurityEvent({
                type: 'THREAT_DETECTED',
                severity: data.severity,
                threatType: data.type,
                threatId,
                details: data.details,
                timestamp: new Date()
            });
            
            // Execute immediate response
            await this.executeThreatResponse({
                name: data.type,
                severity: data.severity,
                action: this.determineThreatAction(data)
            }, data);
            
            this.emit('security:threat_detected', { ...data, threatId });
            
        } catch (error) {
            console.error('Error handling threat detection:', error);
            this.emit('security:threat_detection_error', { data, error });
        }
    }
    
    /**
     * Handle anomaly detected
     */
    async handleAnomalyDetected(data) {
        try {
            // Log anomaly
            await this.auditService.logEvent({
                type: 'ANOMALY_DETECTED',
                anomalyType: data.type,
                severity: data.severity,
                details: data.details,
                timestamp: new Date()
            });
            
            // Check if anomaly indicates a security threat
            if (this.isSecurityThreat(data)) {
                await this.handleThreatDetected({
                    type: 'anomaly_based_threat',
                    severity: data.severity,
                    details: data.details
                });
            }
            
            this.emit('security:anomaly_detected', data);
            
        } catch (error) {
            console.error('Error handling anomaly detection:', error);
            this.emit('security:anomaly_detection_error', { data, error });
        }
    }
    
    /**
     * Handle performance issue
     */
    async handlePerformanceIssue(data) {
        try {
            // Check if performance issue might be a DoS attack
            if (data.type === 'high_cpu' || data.type === 'high_memory' || data.type === 'high_requests') {
                await this.handleThreatDetected({
                    type: 'potential_dos_attack',
                    severity: 'medium',
                    details: `Performance issue detected: ${data.type}`
                });
            }
            
            this.emit('security:performance_issue', data);
            
        } catch (error) {
            console.error('Error handling performance issue:', error);
            this.emit('security:performance_issue_error', { data, error });
        }
    }
    
    /**
     * Execute threat response
     */
    async executeThreatResponse(rule, data) {
        try {
            switch (rule.action) {
                case 'block_ip':
                    if (data.ip) {
                        this.securityState.blockedIPs.add(data.ip);
                        console.log(`🚫 Blocked IP: ${data.ip}`);
                    }
                    break;
                    
                case 'rate_limit':
                    if (data.ip) {
                        const rateLimitKey = `threat:${data.ip}`;
                        this.securityState.rateLimits.set(rateLimitKey, 0);
                        console.log(`⏱️ Rate limited IP: ${data.ip}`);
                    }
                    break;
                    
                case 'require_mfa':
                    if (data.userId) {
                        await this.userService.requireMFA(data.userId);
                        console.log(`🔐 MFA required for user: ${data.userId}`);
                    }
                    break;
                    
                case 'alert_admin':
                    await this.alertAdministrators({
                        type: 'security_threat',
                        severity: rule.severity,
                        message: `Security threat detected: ${rule.name}`,
                        details: data
                    });
                    break;
                    
                case 'lock_account':
                    if (data.userId) {
                        await this.userService.lockAccount(data.userId, rule.name);
                        console.log(`🔒 Locked account: ${data.userId}`);
                    }
                    break;
            }
            
        } catch (error) {
            console.error('Error executing threat response:', error);
            this.emit('security:threat_response_error', { rule, data, error });
        }
    }
    
    /**
     * Determine threat action based on threat data
     */
    determineThreatAction(data) {
        switch (data.type) {
            case 'brute_force_attack':
                return 'block_ip';
            case 'suspicious_login_pattern':
                return 'require_mfa';
            case 'privilege_escalation_attempt':
                return 'alert_admin';
            case 'potential_dos_attack':
                return 'rate_limit';
            default:
                return 'alert_admin';
        }
    }
    
    /**
     * Check if anomaly indicates a security threat
     */
    isSecurityThreat(data) {
        const securityAnomalies = [
            'unusual_login_pattern',
            'suspicious_api_usage',
            'abnormal_data_access',
            'privilege_escalation',
            'data_exfiltration'
        ];
        
        return Array.isArray(securityAnomalies) && securityAnomalies.includes(data.type);
    }
    
    /**
     * Alert administrators
     */
    async alertAdministrators(alert) {
        try {
            // Log the alert
            await this.auditService.logSecurityEvent({
                type: 'ADMIN_ALERT',
                severity: alert.severity,
                alertType: alert.type,
                message: alert.message,
                details: alert.details,
                timestamp: new Date()
            });
            
            // Send notifications (email, SMS, etc.)
            // This would integrate with notification services
            console.log(`🚨 ADMIN ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
            
            this.emit('security:admin_alert', alert);
            
        } catch (error) {
            console.error('Error alerting administrators:', error);
            this.emit('security:admin_alert_error', { alert, error });
        }
    }
    
    /**
     * Invalidate user sessions
     */
    async invalidateUserSessions(userId) {
        try {
            const sessionsToRemove = [];
            
            for (const [sessionId, session] of this.securityState.sessions) {
                if (session.userId === userId) {
                    sessionsToRemove.push(sessionId);
                }
            }
            
            for (const sessionId of sessionsToRemove) {
                this.securityState.sessions.delete(sessionId);
            }
            
            console.log(`🔄 Invalidated ${sessionsToRemove.length} sessions for user: ${userId}`);
            
        } catch (error) {
            console.error('Error invalidating user sessions:', error);
            throw error;
        }
    }
    
    /**
     * Update security metrics
     */
    updateSecurityMetrics() {
        try {
            // Update active threats count
            this.metrics.activeThreats = this.securityState.threats.size;
            
            // Emit metrics update
            this.emit('security:metrics_updated', this.metrics);
            
        } catch (error) {
            console.error('Error updating security metrics:', error);
        }
    }
    
    /**
     * Check for threats
     */
    checkForThreats() {
        try {
            // Check for expired threats
            const now = new Date();
            const expiredThreats = [];
            
            for (const [threatId, threat] of this.securityState.threats) {
                const age = now - threat.detectedAt;
                if (age > 24 * 60 * 60 * 1000) { // 24 hours
                    expiredThreats.push(threatId);
                }
            }
            
            // Remove expired threats
            for (const threatId of expiredThreats) {
                this.securityState.threats.delete(threatId);
            }
            
            if (expiredThreats.length > 0) {
                console.log(`🧹 Cleaned up ${expiredThreats.length} expired threats`);
            }
            
        } catch (error) {
            console.error('Error checking for threats:', error);
        }
    }
    
    /**
     * Clean up old data
     */
    cleanupOldData() {
        try {
            const now = new Date();
            
            // Clean up old rate limit data
            for (const [key, timestamp] of this.securityState.rateLimits) {
                if (now - timestamp > 3600000) { // 1 hour
                    this.securityState.rateLimits.delete(key);
                }
            }
            
            // Clean up old suspicious activities
            for (const [key, count] of this.securityState.suspiciousActivities) {
                if (count === 0) {
                    this.securityState.suspiciousActivities.delete(key);
                }
            }
            
            console.log('🧹 Security data cleanup completed');
            
        } catch (error) {
            console.error('Error cleaning up old data:', error);
        }
    }
    
    /**
     * Get security status
     */
    getSecurityStatus() {
        return {
            initialized: this.securityState.initialized,
            metrics: this.metrics,
            activeThreats: this.securityState.threats.size,
            blockedIPs: this.securityState.blockedIPs.size,
            activeSessions: this.securityState.sessions.size,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Get failed login attempts for IP
     */
    getFailedLoginAttempts(ip, timeWindow) {
        const key = `failed_login:${ip}`;
        return this.securityState.suspiciousActivities.get(key) || 0;
    }
    
    /**
     * Get login locations for user
     */
    getLoginLocations(userId, timeWindow) {
        const locations = [];
        const now = new Date();
        
        for (const session of this.securityState.sessions.values()) {
            if (session.userId === userId && (now - session.loginTime) <= timeWindow) {
                locations.push(session.ip);
            }
        }
        
        return [...new Set(locations)];
    }
    
    /**
     * Get API requests count
     */
    getApiRequests(apiKey, timeWindow) {
        // This would typically query a database or cache
        // For now, return a mock value
        return Math.floor(Math.random() * 100);
    }
    
    /**
     * Shutdown security service
     */
    async shutdown() {
        try {
            console.log('🔐 Shutting down Security Integration Service...');
            
            // Save current state
            await this.saveSecurityState();
            
            // Shutdown services
            await this.monitoringService.shutdown();
            await this.auditService.shutdown();
            
            console.log('✅ Security Integration Service shutdown completed');
            
        } catch (error) {
            console.error('❌ Error during security service shutdown:', error);
            throw error;
        }
    }
    
    /**
     * Save security state
     */
    async saveSecurityState() {
        try {
            // This would typically save to a database
            // For now, just log the state
            console.log('💾 Security state saved:', {
                threats: this.securityState.threats.size,
                sessions: this.securityState.sessions.size,
                blockedIPs: this.securityState.blockedIPs.size
            });
            
        } catch (error) {
            console.error('Error saving security state:', error);
            throw error;
        }
    }
}

module.exports = SecurityIntegrationService;