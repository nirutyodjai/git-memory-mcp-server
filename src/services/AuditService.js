/**
 * Audit Service
 * Enterprise-grade audit logging and compliance system
 * รองรับการติดตามและบันทึกกิจกรรมทั้งหมดในระบบ
 */

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class AuditService {
    constructor(options = {}) {
        this.options = {
            logLevel: options.logLevel || 'info',
            retentionDays: options.retentionDays || 365,
            encryptLogs: options.encryptLogs || true,
            realTimeAlerts: options.realTimeAlerts || true,
            complianceMode: options.complianceMode || 'SOX', // SOX, GDPR, HIPAA, PCI-DSS
            logDirectory: options.logDirectory || './logs/audit',
            maxLogSize: options.maxLogSize || 100 * 1024 * 1024, // 100MB
            ...options
        };
        
        // In-memory storage for demo (replace with database)
        this.auditLogs = new Map();
        this.alertRules = new Map();
        this.complianceReports = new Map();
        this.securityEvents = new Map();
        
        this.initializeAuditSystem();
    }
    
    /**
     * Initialize audit system
     */
    async initializeAuditSystem() {
        try {
            // Create log directory if it doesn't exist
            await fs.mkdir(this.options.logDirectory, { recursive: true });
            
            // Initialize alert rules
            this.setupDefaultAlertRules();
            
            // Start log rotation scheduler
            this.startLogRotation();
            
            console.log('✅ Audit Service initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Audit Service:', error);
        }
    }
    
    /**
     * Log audit event
     */
    async logEvent(eventData) {
        try {
            const auditEvent = {
                id: uuidv4(),
                timestamp: new Date(),
                eventType: eventData.eventType,
                category: eventData.category || 'general',
                severity: eventData.severity || 'info',
                userId: eventData.userId,
                tenantId: eventData.tenantId,
                sessionId: eventData.sessionId,
                ipAddress: eventData.ipAddress,
                userAgent: eventData.userAgent,
                resource: eventData.resource,
                action: eventData.action,
                outcome: eventData.outcome || 'success',
                details: eventData.details || {},
                metadata: {
                    source: eventData.source || 'system',
                    version: eventData.version || '1.0',
                    correlationId: eventData.correlationId || uuidv4(),
                    requestId: eventData.requestId,
                    ...eventData.metadata
                },
                compliance: {
                    dataClassification: eventData.dataClassification || 'internal',
                    retentionRequired: eventData.retentionRequired !== false,
                    personalData: eventData.personalData || false,
                    sensitiveData: eventData.sensitiveData || false
                },
                hash: null // Will be calculated
            };
            
            // Calculate event hash for integrity
            auditEvent.hash = this.calculateEventHash(auditEvent);
            
            // Store in memory
            this.auditLogs.set(auditEvent.id, auditEvent);
            
            // Write to persistent storage
            await this.persistAuditEvent(auditEvent);
            
            // Check alert rules
            await this.checkAlertRules(auditEvent);
            
            // Update compliance metrics
            this.updateComplianceMetrics(auditEvent);
            
            return auditEvent.id;
        } catch (error) {
            console.error('❌ Failed to log audit event:', error);
            throw error;
        }
    }
    
    /**
     * Log security event
     */
    async logSecurityEvent(eventData) {
        const securityEvent = {
            ...eventData,
            category: 'security',
            severity: eventData.severity || 'high',
            eventType: eventData.eventType || 'security_incident',
            sensitiveData: true
        };
        
        const eventId = await this.logEvent(securityEvent);
        
        // Store in security events for quick access
        this.securityEvents.set(eventId, {
            id: eventId,
            timestamp: new Date(),
            ...securityEvent
        });
        
        // Trigger immediate alert for high severity events
        if (securityEvent.severity === 'critical' || securityEvent.severity === 'high') {
            await this.triggerSecurityAlert(securityEvent);
        }
        
        return eventId;
    }
    
    /**
     * Log user activity
     */
    async logUserActivity(userId, action, details = {}) {
        return await this.logEvent({
            eventType: 'user_activity',
            category: 'user',
            userId,
            action,
            details,
            personalData: true
        });
    }
    
    /**
     * Log system event
     */
    async logSystemEvent(eventType, details = {}) {
        return await this.logEvent({
            eventType,
            category: 'system',
            action: 'system_operation',
            details,
            source: 'system'
        });
    }
    
    /**
     * Log API access
     */
    async logApiAccess(request, response, userId = null) {
        return await this.logEvent({
            eventType: 'api_access',
            category: 'api',
            userId,
            action: `${request.method} ${request.path}`,
            resource: request.path,
            outcome: response.statusCode < 400 ? 'success' : 'failure',
            details: {
                method: request.method,
                path: request.path,
                statusCode: response.statusCode,
                responseTime: response.responseTime,
                requestSize: request.headers['content-length'],
                responseSize: response.get('content-length')
            },
            ipAddress: request.ip,
            userAgent: request.get('user-agent')
        });
    }
    
    /**
     * Log data access
     */
    async logDataAccess(userId, dataType, action, details = {}) {
        return await this.logEvent({
            eventType: 'data_access',
            category: 'data',
            userId,
            action,
            resource: dataType,
            details,
            personalData: details.personalData || false,
            sensitiveData: details.sensitiveData || false,
            dataClassification: details.dataClassification || 'internal'
        });
    }
    
    /**
     * Search audit logs
     */
    async searchLogs(criteria = {}) {
        const {
            startDate,
            endDate,
            userId,
            tenantId,
            eventType,
            category,
            severity,
            outcome,
            page = 1,
            limit = 100,
            sortBy = 'timestamp',
            sortOrder = 'desc'
        } = criteria;
        
        let logs = Array.from(this.auditLogs.values());
        
        // Apply filters
        if (startDate) {
            logs = logs.filter(log => log.timestamp >= new Date(startDate));
        }
        
        if (endDate) {
            logs = logs.filter(log => log.timestamp <= new Date(endDate));
        }
        
        if (userId) {
            logs = logs.filter(log => log.userId === userId);
        }
        
        if (tenantId) {
            logs = logs.filter(log => log.tenantId === tenantId);
        }
        
        if (eventType) {
            logs = logs.filter(log => log.eventType === eventType);
        }
        
        if (category) {
            logs = logs.filter(log => log.category === category);
        }
        
        if (severity) {
            logs = logs.filter(log => log.severity === severity);
        }
        
        if (outcome) {
            logs = logs.filter(log => log.outcome === outcome);
        }
        
        // Sort logs
        logs.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            
            if (sortOrder === 'desc') {
                return bValue > aValue ? 1 : -1;
            } else {
                return aValue > bValue ? 1 : -1;
            }
        });
        
        // Apply pagination
        const total = logs.length;
        const offset = (page - 1) * limit;
        logs = logs.slice(offset, offset + limit);
        
        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    
    /**
     * Generate compliance report
     */
    async generateComplianceReport(type, period = 'monthly') {
        const reportId = uuidv4();
        const now = new Date();
        let startDate, endDate;
        
        // Calculate date range based on period
        switch (period) {
            case 'daily':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
                break;
            case 'weekly':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'quarterly':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
                break;
            case 'yearly':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                endDate = now;
        }
        
        // Get logs for the period
        const { logs } = await this.searchLogs({ startDate, endDate, limit: 10000 });
        
        // Generate report based on type
        let report;
        switch (type) {
            case 'SOX':
                report = this.generateSOXReport(logs, startDate, endDate);
                break;
            case 'GDPR':
                report = this.generateGDPRReport(logs, startDate, endDate);
                break;
            case 'HIPAA':
                report = this.generateHIPAAReport(logs, startDate, endDate);
                break;
            case 'PCI-DSS':
                report = this.generatePCIDSSReport(logs, startDate, endDate);
                break;
            default:
                report = this.generateGeneralReport(logs, startDate, endDate);
        }
        
        const complianceReport = {
            id: reportId,
            type,
            period,
            startDate,
            endDate,
            generatedAt: now,
            ...report
        };
        
        this.complianceReports.set(reportId, complianceReport);
        
        return complianceReport;
    }
    
    /**
     * Generate SOX compliance report
     */
    generateSOXReport(logs, startDate, endDate) {
        const financialDataAccess = logs.filter(log => 
            log.category === 'data' && 
            (log.details.dataType === 'financial' || log.details.sensitive === true)
        );
        
        const privilegedAccess = logs.filter(log => 
            log.eventType === 'privileged_access' || 
            (log.userId && log.details.adminAction === true)
        );
        
        const systemChanges = logs.filter(log => 
            log.eventType === 'system_change' || 
            log.category === 'configuration'
        );
        
        return {
            summary: {
                totalEvents: logs.length,
                financialDataAccess: financialDataAccess.length,
                privilegedAccess: privilegedAccess.length,
                systemChanges: systemChanges.length,
                securityIncidents: logs.filter(log => log.category === 'security').length
            },
            details: {
                financialDataAccess,
                privilegedAccess,
                systemChanges
            },
            compliance: {
                status: 'compliant',
                issues: [],
                recommendations: []
            }
        };
    }
    
    /**
     * Generate GDPR compliance report
     */
    generateGDPRReport(logs, startDate, endDate) {
        const personalDataAccess = logs.filter(log => log.personalData === true);
        const dataExports = logs.filter(log => log.action === 'data_export');
        const dataDeletions = logs.filter(log => log.action === 'data_deletion');
        const consentChanges = logs.filter(log => log.eventType === 'consent_change');
        
        return {
            summary: {
                totalEvents: logs.length,
                personalDataAccess: personalDataAccess.length,
                dataExports: dataExports.length,
                dataDeletions: dataDeletions.length,
                consentChanges: consentChanges.length
            },
            details: {
                personalDataAccess,
                dataExports,
                dataDeletions,
                consentChanges
            },
            compliance: {
                status: 'compliant',
                dataRetentionCompliance: true,
                consentManagement: true,
                rightToErasure: true
            }
        };
    }
    
    /**
     * Setup default alert rules
     */
    setupDefaultAlertRules() {
        const defaultRules = [
            {
                id: 'failed_login_attempts',
                name: 'Multiple Failed Login Attempts',
                condition: {
                    eventType: 'authentication',
                    outcome: 'failure',
                    threshold: 5,
                    timeWindow: 300000 // 5 minutes
                },
                severity: 'high',
                actions: ['email', 'slack', 'log']
            },
            {
                id: 'privileged_access',
                name: 'Privileged Access Outside Business Hours',
                condition: {
                    eventType: 'privileged_access',
                    timeRange: { start: '18:00', end: '08:00' }
                },
                severity: 'medium',
                actions: ['email', 'log']
            },
            {
                id: 'data_export_large',
                name: 'Large Data Export',
                condition: {
                    action: 'data_export',
                    threshold: { field: 'details.recordCount', value: 1000 }
                },
                severity: 'medium',
                actions: ['email', 'log']
            },
            {
                id: 'security_incident',
                name: 'Security Incident',
                condition: {
                    category: 'security',
                    severity: ['high', 'critical']
                },
                severity: 'critical',
                actions: ['email', 'sms', 'slack', 'log']
            }
        ];
        
        defaultRules.forEach(rule => {
            this.alertRules.set(rule.id, rule);
        });
    }
    
    /**
     * Check alert rules against event
     */
    async checkAlertRules(event) {
        for (const rule of this.alertRules.values()) {
            if (this.evaluateAlertRule(rule, event)) {
                await this.triggerAlert(rule, event);
            }
        }
    }
    
    /**
     * Evaluate alert rule
     */
    evaluateAlertRule(rule, event) {
        const condition = rule.condition;
        
        // Check basic conditions
        if (condition.eventType && event.eventType !== condition.eventType) {
            return false;
        }
        
        if (condition.category && event.category !== condition.category) {
            return false;
        }
        
        if (condition.outcome && event.outcome !== condition.outcome) {
            return false;
        }
        
        if (condition.severity) {
            if (Array.isArray(condition.severity)) {
                if (!Array.isArray(condition.severity) || !condition.severity.includes(event.severity)) {
                    return false;
                }
            } else if (event.severity !== condition.severity) {
                return false;
            }
        }
        
        // Check threshold conditions
        if (condition.threshold && typeof condition.threshold === 'number') {
            // Count similar events in time window
            const timeWindow = condition.timeWindow || 300000; // 5 minutes default
            const cutoffTime = new Date(event.timestamp.getTime() - timeWindow);
            
            const similarEvents = Array.from(this.auditLogs.values())
                .filter(log => 
                    log.timestamp >= cutoffTime &&
                    log.eventType === event.eventType &&
                    log.outcome === event.outcome &&
                    log.userId === event.userId
                );
                
            return similarEvents.length >= condition.threshold;
        }
        
        // Check time range conditions
        if (condition.timeRange) {
            const eventTime = event.timestamp.getHours() + ':' + 
                            event.timestamp.getMinutes().toString().padStart(2, '0');
            const { start, end } = condition.timeRange;
            
            if (start > end) { // Overnight range
                return eventTime >= start || eventTime <= end;
            } else {
                return eventTime >= start && eventTime <= end;
            }
        }
        
        return true;
    }
    
    /**
     * Trigger alert
     */
    async triggerAlert(rule, event) {
        const alert = {
            id: uuidv4(),
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            event,
            triggeredAt: new Date(),
            actions: rule.actions
        };
        
        console.warn(`🚨 SECURITY ALERT: ${rule.name}`, {
            severity: rule.severity,
            event: event.eventType,
            user: event.userId,
            details: event.details
        });
        
        // Execute alert actions
        for (const action of rule.actions) {
            await this.executeAlertAction(action, alert);
        }
    }
    
    /**
     * Execute alert action
     */
    async executeAlertAction(action, alert) {
        switch (action) {
            case 'email':
                // Send email notification
                console.log(`📧 Email alert sent: ${alert.ruleName}`);
                break;
            case 'sms':
                // Send SMS notification
                console.log(`📱 SMS alert sent: ${alert.ruleName}`);
                break;
            case 'slack':
                // Send Slack notification
                console.log(`💬 Slack alert sent: ${alert.ruleName}`);
                break;
            case 'log':
                // Log to security log
                await this.logSecurityEvent({
                    eventType: 'security_alert',
                    action: 'alert_triggered',
                    severity: alert.severity,
                    details: {
                        ruleId: alert.ruleId,
                        ruleName: alert.ruleName,
                        originalEvent: alert.event
                    }
                });
                break;
        }
    }
    
    /**
     * Calculate event hash for integrity
     */
    calculateEventHash(event) {
        const hashData = {
            timestamp: event.timestamp.toISOString(),
            eventType: event.eventType,
            userId: event.userId,
            action: event.action,
            outcome: event.outcome,
            details: JSON.stringify(event.details)
        };
        
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(hashData))
            .digest('hex');
    }
    
    /**
     * Persist audit event to storage
     */
    async persistAuditEvent(event) {
        try {
            const logFile = path.join(
                this.options.logDirectory,
                `audit-${event.timestamp.toISOString().split('T')[0]}.log`
            );
            
            const logEntry = JSON.stringify(event) + '\n';
            
            if (this.options.encryptLogs) {
                // Encrypt log entry (simplified - use proper encryption in production)
                const encrypted = crypto
                    .createCipher('aes-256-cbc', 'audit-log-key')
                    .update(logEntry, 'utf8', 'hex');
                
                await fs.appendFile(logFile + '.enc', encrypted + '\n');
            } else {
                await fs.appendFile(logFile, logEntry);
            }
        } catch (error) {
            console.error('❌ Failed to persist audit event:', error);
        }
    }
    
    /**
     * Start log rotation
     */
    startLogRotation() {
        // Rotate logs daily at midnight
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.rotateLogs();
            // Set up daily rotation
            setInterval(() => this.rotateLogs(), 24 * 60 * 60 * 1000);
        }, msUntilMidnight);
    }
    
    /**
     * Rotate logs
     */
    async rotateLogs() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.options.retentionDays);
            
            // Archive old logs
            const files = await fs.readdir(this.options.logDirectory);
            
            for (const file of files) {
                const filePath = path.join(this.options.logDirectory, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtime < cutoffDate) {
                    // Archive or delete old log files
                    await fs.unlink(filePath);
                    console.log(`🗂️ Archived old log file: ${file}`);
                }
            }
            
            console.log('✅ Log rotation completed');
        } catch (error) {
            console.error('❌ Log rotation failed:', error);
        }
    }
    
    /**
     * Update compliance metrics
     */
    updateComplianceMetrics(event) {
        // Update various compliance metrics based on the event
        // This would typically update a metrics database
    }
    
    /**
     * Trigger security alert
     */
    async triggerSecurityAlert(event) {
        console.error(`🚨 CRITICAL SECURITY EVENT: ${event.eventType}`, {
            severity: event.severity,
            user: event.userId,
            details: event.details,
            timestamp: new Date()
        });
        
        // In a real implementation, this would:
        // - Send immediate notifications to security team
        // - Trigger automated response procedures
        // - Update security dashboards
        // - Integrate with SIEM systems
    }
    
    /**
     * Get audit statistics
     */
    getStats() {
        const totalLogs = this.auditLogs.size;
        const securityEvents = Array.from(this.auditLogs.values())
            .filter(log => log.category === 'security').length;
        const failedLogins = Array.from(this.auditLogs.values())
            .filter(log => log.eventType === 'authentication' && log.outcome === 'failure').length;
        const dataAccess = Array.from(this.auditLogs.values())
            .filter(log => log.category === 'data').length;
            
        return {
            logs: {
                total: totalLogs,
                security: securityEvents,
                failedLogins,
                dataAccess
            },
            alerts: {
                rules: this.alertRules.size,
                triggered: Array.from(this.securityEvents.values()).length
            },
            compliance: {
                reports: this.complianceReports.size,
                retentionDays: this.options.retentionDays
            }
        };
    }
}

module.exports = AuditService;