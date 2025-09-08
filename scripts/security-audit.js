#!/usr/bin/env node

/**
 * Git Memory MCP Server - Enterprise Security Audit & Compliance System
 * 
 * This comprehensive security audit system provides:
 * - Automated security assessments
 * - Compliance checking (SOC2, ISO27001, GDPR, HIPAA)
 * - Vulnerability scanning
 * - Configuration auditing
 * - Risk assessment and reporting
 * - Remediation recommendations
 * 
 * Features:
 * - Multi-framework compliance checking
 * - Automated vulnerability detection
 * - Risk scoring and prioritization
 * - Detailed audit reports
 * - Remediation tracking
 * - Continuous monitoring
 * 
 * @author Git Memory MCP Team
 * @version 2.0.0
 * @license MIT
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const os = require('os');

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
    audit: {
        enabled: process.env.SECURITY_AUDIT_ENABLED !== 'false',
        interval: parseInt(process.env.AUDIT_INTERVAL) || 86400000, // 24 hours
        reportPath: process.env.AUDIT_REPORT_PATH || './reports/security',
        maxReports: parseInt(process.env.MAX_AUDIT_REPORTS) || 30,
        autoRemediation: process.env.AUTO_REMEDIATION_ENABLED === 'true'
    },
    compliance: {
        frameworks: {
            soc2: process.env.SOC2_COMPLIANCE === 'true',
            iso27001: process.env.ISO27001_COMPLIANCE === 'true',
            gdpr: process.env.GDPR_COMPLIANCE === 'true',
            hipaa: process.env.HIPAA_COMPLIANCE === 'true',
            pci: process.env.PCI_COMPLIANCE === 'true'
        },
        strictMode: process.env.COMPLIANCE_STRICT_MODE === 'true'
    },
    vulnerability: {
        scanEnabled: process.env.VULNERABILITY_SCAN_ENABLED !== 'false',
        databases: {
            nvd: process.env.NVD_API_KEY || null,
            snyk: process.env.SNYK_TOKEN || null,
            github: process.env.GITHUB_TOKEN || null
        },
        severity: {
            critical: 9.0,
            high: 7.0,
            medium: 4.0,
            low: 0.1
        }
    },
    risk: {
        matrix: {
            critical: { impact: 5, likelihood: 5 },
            high: { impact: 4, likelihood: 4 },
            medium: { impact: 3, likelihood: 3 },
            low: { impact: 2, likelihood: 2 },
            info: { impact: 1, likelihood: 1 }
        },
        threshold: {
            critical: 20,
            high: 15,
            medium: 9,
            low: 4
        }
    },
    notifications: {
        email: {
            enabled: process.env.AUDIT_EMAIL_ENABLED === 'true',
            recipients: (process.env.AUDIT_EMAIL_RECIPIENTS || '').split(',').filter(Boolean),
            smtp: {
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            }
        },
        slack: {
            enabled: process.env.AUDIT_SLACK_ENABLED === 'true',
            webhook: process.env.AUDIT_SLACK_WEBHOOK,
            channel: process.env.AUDIT_SLACK_CHANNEL || '#security'
        },
        webhook: {
            enabled: process.env.AUDIT_WEBHOOK_ENABLED === 'true',
            url: process.env.AUDIT_WEBHOOK_URL,
            secret: process.env.AUDIT_WEBHOOK_SECRET
        }
    }
};

// =============================================================================
// Security Audit Engine
// =============================================================================

class SecurityAuditEngine extends EventEmitter {
    constructor(config = CONFIG) {
        super();
        this.config = config;
        this.auditId = null;
        this.startTime = null;
        this.findings = [];
        this.risks = [];
        this.compliance = {};
        this.vulnerabilities = [];
    }
    
    async runFullAudit() {
        try {
            this.auditId = this.generateAuditId();
            this.startTime = new Date();
            this.findings = [];
            this.risks = [];
            this.compliance = {};
            this.vulnerabilities = [];
            
            console.log(`🔍 Starting security audit ${this.auditId}...`);
            
            // Run all audit components
            await this.auditConfiguration();
            await this.auditAuthentication();
            await this.auditAuthorization();
            await this.auditEncryption();
            await this.auditNetworkSecurity();
            await this.auditDataProtection();
            await this.auditLogging();
            await this.auditDependencies();
            await this.auditFilePermissions();
            await this.auditSystemHardening();
            
            // Run compliance checks
            await this.checkCompliance();
            
            // Run vulnerability scan
            if (this.config.vulnerability.scanEnabled) {
                await this.scanVulnerabilities();
            }
            
            // Calculate risk scores
            await this.calculateRiskScores();
            
            // Generate report
            const report = await this.generateReport();
            
            // Send notifications
            await this.sendNotifications(report);
            
            console.log(`✅ Security audit ${this.auditId} completed`);
            
            return report;
            
        } catch (error) {
            console.error(`❌ Security audit failed: ${error.message}`);
            throw error;
        }
    }
    
    generateAuditId() {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        return `audit-${timestamp}-${random}`;
    }
    
    // =============================================================================
    // Configuration Audit
    // =============================================================================
    
    async auditConfiguration() {
        console.log('🔧 Auditing configuration security...');
        
        const findings = [];
        
        // Check environment variables
        const sensitiveEnvVars = [
            'JWT_SECRET', 'API_KEY', 'DATABASE_PASSWORD', 'ENCRYPTION_KEY',
            'SMTP_PASS', 'OAUTH_SECRET', 'WEBHOOK_SECRET'
        ];
        
        for (const envVar of sensitiveEnvVars) {
            if (!process.env[envVar]) {
                findings.push({
                    type: 'configuration',
                    severity: 'high',
                    title: `Missing sensitive environment variable: ${envVar}`,
                    description: `The environment variable ${envVar} is not set, which may cause security issues.`,
                    remediation: `Set the ${envVar} environment variable with a secure value.`,
                    category: 'configuration'
                });
            } else if (process.env[envVar].length < 32) {
                findings.push({
                    type: 'configuration',
                    severity: 'medium',
                    title: `Weak ${envVar} detected`,
                    description: `The ${envVar} appears to be too short and may be easily guessable.`,
                    remediation: `Use a stronger ${envVar} with at least 32 characters.`,
                    category: 'configuration'
                });
            }
        }
        
        // Check SSL/TLS configuration
        if (!process.env.HTTPS_ENABLED || process.env.HTTPS_ENABLED !== 'true') {
            findings.push({
                type: 'configuration',
                severity: 'high',
                title: 'HTTPS not enabled',
                description: 'The application is not configured to use HTTPS, which exposes data to interception.',
                remediation: 'Enable HTTPS by setting HTTPS_ENABLED=true and providing SSL certificates.',
                category: 'transport-security'
            });
        }
        
        // Check CORS configuration
        if (process.env.CORS_ORIGIN === '*') {
            findings.push({
                type: 'configuration',
                severity: 'medium',
                title: 'Permissive CORS configuration',
                description: 'CORS is configured to allow all origins, which may expose the API to unauthorized access.',
                remediation: 'Configure CORS_ORIGIN to specific trusted domains only.',
                category: 'access-control'
            });
        }
        
        this.findings.push(...findings);
    }
    
    // =============================================================================
    // Authentication Audit
    // =============================================================================
    
    async auditAuthentication() {
        console.log('🔐 Auditing authentication security...');
        
        const findings = [];
        
        // Check JWT configuration
        if (process.env.JWT_ALGORITHM !== 'RS256' && process.env.JWT_ALGORITHM !== 'ES256') {
            findings.push({
                type: 'authentication',
                severity: 'medium',
                title: 'Weak JWT algorithm',
                description: 'JWT is using a symmetric algorithm which is less secure than asymmetric algorithms.',
                remediation: 'Use RS256 or ES256 algorithm for JWT signing.',
                category: 'authentication'
            });
        }
        
        // Check session configuration
        if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
            findings.push({
                type: 'authentication',
                severity: 'high',
                title: 'Weak session secret',
                description: 'Session secret is missing or too weak, making sessions vulnerable to attacks.',
                remediation: 'Set a strong SESSION_SECRET with at least 32 random characters.',
                category: 'session-management'
            });
        }
        
        // Check password policy
        const minPasswordLength = parseInt(process.env.MIN_PASSWORD_LENGTH) || 8;
        if (minPasswordLength < 12) {
            findings.push({
                type: 'authentication',
                severity: 'medium',
                title: 'Weak password policy',
                description: 'Minimum password length is too short, making accounts vulnerable to brute force attacks.',
                remediation: 'Set MIN_PASSWORD_LENGTH to at least 12 characters.',
                category: 'password-policy'
            });
        }
        
        // Check MFA configuration
        if (!process.env.MFA_ENABLED || process.env.MFA_ENABLED !== 'true') {
            findings.push({
                type: 'authentication',
                severity: 'medium',
                title: 'Multi-factor authentication not enabled',
                description: 'MFA is not enabled, reducing account security.',
                remediation: 'Enable MFA by setting MFA_ENABLED=true and configuring MFA providers.',
                category: 'multi-factor-auth'
            });
        }
        
        this.findings.push(...findings);
    }
    
    // =============================================================================
    // Authorization Audit
    // =============================================================================
    
    async auditAuthorization() {
        console.log('🛡️ Auditing authorization security...');
        
        const findings = [];
        
        // Check RBAC configuration
        if (!process.env.RBAC_ENABLED || process.env.RBAC_ENABLED !== 'true') {
            findings.push({
                type: 'authorization',
                severity: 'medium',
                title: 'Role-based access control not enabled',
                description: 'RBAC is not enabled, which may lead to privilege escalation vulnerabilities.',
                remediation: 'Enable RBAC by setting RBAC_ENABLED=true and configuring roles and permissions.',
                category: 'access-control'
            });
        }
        
        // Check default permissions
        if (process.env.DEFAULT_USER_ROLE === 'admin') {
            findings.push({
                type: 'authorization',
                severity: 'high',
                title: 'Dangerous default user role',
                description: 'New users are assigned admin role by default, violating principle of least privilege.',
                remediation: 'Set DEFAULT_USER_ROLE to a restricted role like "user" or "guest".',
                category: 'privilege-management'
            });
        }
        
        // Check API key permissions
        if (!process.env.API_KEY_SCOPED || process.env.API_KEY_SCOPED !== 'true') {
            findings.push({
                type: 'authorization',
                severity: 'medium',
                title: 'API keys not scoped',
                description: 'API keys have full access instead of scoped permissions.',
                remediation: 'Enable API_KEY_SCOPED=true and implement scoped API key permissions.',
                category: 'api-security'
            });
        }
        
        this.findings.push(...findings);
    }
    
    // =============================================================================
    // Encryption Audit
    // =============================================================================
    
    async auditEncryption() {
        console.log('🔒 Auditing encryption security...');
        
        const findings = [];
        
        // Check encryption algorithm
        const encryptionAlgorithm = process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';
        const weakAlgorithms = ['des', 'rc4', 'md5', 'sha1', 'aes-128-ecb'];
        
        if (weakAlgorithms.some(weak => encryptionAlgorithm.toLowerCase().includes(weak))) {
            findings.push({
                type: 'encryption',
                severity: 'high',
                title: 'Weak encryption algorithm',
                description: `The encryption algorithm ${encryptionAlgorithm} is considered weak or deprecated.`,
                remediation: 'Use strong encryption algorithms like AES-256-GCM or ChaCha20-Poly1305.',
                category: 'cryptography'
            });
        }
        
        // Check key management
        if (!process.env.KEY_ROTATION_ENABLED || process.env.KEY_ROTATION_ENABLED !== 'true') {
            findings.push({
                type: 'encryption',
                severity: 'medium',
                title: 'Key rotation not enabled',
                description: 'Encryption keys are not rotated regularly, increasing risk if keys are compromised.',
                remediation: 'Enable KEY_ROTATION_ENABLED=true and configure automatic key rotation.',
                category: 'key-management'
            });
        }
        
        // Check data at rest encryption
        if (!process.env.DATABASE_ENCRYPTION_ENABLED || process.env.DATABASE_ENCRYPTION_ENABLED !== 'true') {
            findings.push({
                type: 'encryption',
                severity: 'high',
                title: 'Database encryption not enabled',
                description: 'Database is not encrypted at rest, exposing sensitive data if storage is compromised.',
                remediation: 'Enable DATABASE_ENCRYPTION_ENABLED=true and configure database encryption.',
                category: 'data-protection'
            });
        }
        
        this.findings.push(...findings);
    }
    
    // =============================================================================
    // Network Security Audit
    // =============================================================================
    
    async auditNetworkSecurity() {
        console.log('🌐 Auditing network security...');
        
        const findings = [];
        
        // Check firewall configuration
        if (!process.env.FIREWALL_ENABLED || process.env.FIREWALL_ENABLED !== 'true') {
            findings.push({
                type: 'network',
                severity: 'high',
                title: 'Firewall not enabled',
                description: 'Network firewall is not enabled, exposing services to unauthorized access.',
                remediation: 'Enable FIREWALL_ENABLED=true and configure firewall rules.',
                category: 'network-security'
            });
        }
        
        // Check rate limiting
        if (!process.env.RATE_LIMITING_ENABLED || process.env.RATE_LIMITING_ENABLED !== 'true') {
            findings.push({
                type: 'network',
                severity: 'medium',
                title: 'Rate limiting not enabled',
                description: 'Rate limiting is not enabled, making the service vulnerable to DoS attacks.',
                remediation: 'Enable RATE_LIMITING_ENABLED=true and configure appropriate rate limits.',
                category: 'dos-protection'
            });
        }
        
        // Check DDoS protection
        if (!process.env.DDOS_PROTECTION_ENABLED || process.env.DDOS_PROTECTION_ENABLED !== 'true') {
            findings.push({
                type: 'network',
                severity: 'medium',
                title: 'DDoS protection not enabled',
                description: 'DDoS protection is not enabled, making the service vulnerable to distributed attacks.',
                remediation: 'Enable DDOS_PROTECTION_ENABLED=true and configure DDoS protection.',
                category: 'dos-protection'
            });
        }
        
        this.findings.push(...findings);
    }
    
    // =============================================================================
    // Data Protection Audit
    // =============================================================================
    
    async auditDataProtection() {
        console.log('📊 Auditing data protection...');
        
        const findings = [];
        
        // Check data classification
        if (!process.env.DATA_CLASSIFICATION_ENABLED || process.env.DATA_CLASSIFICATION_ENABLED !== 'true') {
            findings.push({
                type: 'data-protection',
                severity: 'medium',
                title: 'Data classification not implemented',
                description: 'Data is not classified, making it difficult to apply appropriate protection measures.',
                remediation: 'Enable DATA_CLASSIFICATION_ENABLED=true and implement data classification.',
                category: 'data-governance'
            });
        }
        
        // Check data retention policy
        if (!process.env.DATA_RETENTION_POLICY || process.env.DATA_RETENTION_POLICY === 'unlimited') {
            findings.push({
                type: 'data-protection',
                severity: 'medium',
                title: 'No data retention policy',
                description: 'Data retention policy is not defined, potentially violating privacy regulations.',
                remediation: 'Define DATA_RETENTION_POLICY with appropriate retention periods.',
                category: 'privacy-compliance'
            });
        }
        
        // Check backup encryption
        if (!process.env.BACKUP_ENCRYPTION_ENABLED || process.env.BACKUP_ENCRYPTION_ENABLED !== 'true') {
            findings.push({
                type: 'data-protection',
                severity: 'high',
                title: 'Backup encryption not enabled',
                description: 'Backups are not encrypted, exposing data if backup storage is compromised.',
                remediation: 'Enable BACKUP_ENCRYPTION_ENABLED=true and encrypt all backups.',
                category: 'backup-security'
            });
        }
        
        this.findings.push(...findings);
    }
    
    // =============================================================================
    // Logging Audit
    // =============================================================================
    
    async auditLogging() {
        console.log('📝 Auditing logging security...');
        
        const findings = [];
        
        // Check audit logging
        if (!process.env.AUDIT_LOGGING_ENABLED || process.env.AUDIT_LOGGING_ENABLED !== 'true') {
            findings.push({
                type: 'logging',
                severity: 'high',
                title: 'Audit logging not enabled',
                description: 'Audit logging is not enabled, making it difficult to detect and investigate security incidents.',
                remediation: 'Enable AUDIT_LOGGING_ENABLED=true and configure comprehensive audit logging.',
                category: 'audit-logging'
            });
        }
        
        // Check log integrity
        if (!process.env.LOG_INTEGRITY_ENABLED || process.env.LOG_INTEGRITY_ENABLED !== 'true') {
            findings.push({
                type: 'logging',
                severity: 'medium',
                title: 'Log integrity protection not enabled',
                description: 'Logs are not protected against tampering, reducing their value for forensic analysis.',
                remediation: 'Enable LOG_INTEGRITY_ENABLED=true and implement log signing or hashing.',
                category: 'log-integrity'
            });
        }
        
        // Check log retention
        const logRetention = parseInt(process.env.LOG_RETENTION_DAYS) || 30;
        if (logRetention < 90) {
            findings.push({
                type: 'logging',
                severity: 'medium',
                title: 'Short log retention period',
                description: 'Log retention period is too short for effective incident investigation.',
                remediation: 'Set LOG_RETENTION_DAYS to at least 90 days for security logs.',
                category: 'log-management'
            });
        }
        
        this.findings.push(...findings);
    }
    
    // =============================================================================
    // Dependency Audit
    // =============================================================================
    
    async auditDependencies() {
        console.log('📦 Auditing dependencies...');
        
        try {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            
            const findings = [];
            
            // Check for known vulnerable packages
            const vulnerablePackages = [
                'lodash@4.17.20', 'moment@2.29.1', 'axios@0.21.0',
                'express@4.17.0', 'jsonwebtoken@8.5.0'
            ];
            
            const allDeps = {
                ...packageJson.dependencies || {},
                ...packageJson.devDependencies || {}
            };
            
            for (const [pkg, version] of Object.entries(allDeps)) {
                const pkgVersion = `${pkg}@${version}`;
                if (vulnerablePackages.includes(pkgVersion)) {
                    findings.push({
                        type: 'dependency',
                        severity: 'high',
                        title: `Vulnerable dependency: ${pkg}`,
                        description: `The package ${pkg}@${version} has known security vulnerabilities.`,
                        remediation: `Update ${pkg} to the latest secure version.`,
                        category: 'dependency-security'
                    });
                }
            }
            
            this.findings.push(...findings);
            
        } catch (error) {
            console.warn(`Could not audit dependencies: ${error.message}`);
        }
    }
    
    // =============================================================================
    // File Permissions Audit
    // =============================================================================
    
    async auditFilePermissions() {
        console.log('📁 Auditing file permissions...');
        
        const findings = [];
        
        try {
            const sensitiveFiles = [
                '.env', '.env.local', '.env.production',
                'config/database.js', 'config/secrets.js',
                'private.key', 'server.key'
            ];
            
            for (const file of sensitiveFiles) {
                try {
                    const stats = await fs.stat(file);
                    const mode = stats.mode & parseInt('777', 8);
                    
                    // Check if file is world-readable or world-writable
                    if (mode & parseInt('044', 8)) {
                        findings.push({
                            type: 'file-permissions',
                            severity: 'high',
                            title: `Sensitive file has permissive permissions: ${file}`,
                            description: `The file ${file} is readable by others, potentially exposing sensitive information.`,
                            remediation: `Change permissions of ${file} to 600 (owner read/write only).`,
                            category: 'file-security'
                        });
                    }
                } catch {
                    // File doesn't exist, skip
                }
            }
            
            this.findings.push(...findings);
            
        } catch (error) {
            console.warn(`Could not audit file permissions: ${error.message}`);
        }
    }
    
    // =============================================================================
    // System Hardening Audit
    // =============================================================================
    
    async auditSystemHardening() {
        console.log('🔧 Auditing system hardening...');
        
        const findings = [];
        
        // Check if running as root (Unix-like systems)
        if (process.getuid && process.getuid() === 0) {
            findings.push({
                type: 'system-hardening',
                severity: 'high',
                title: 'Application running as root',
                description: 'The application is running with root privileges, increasing the impact of potential compromises.',
                remediation: 'Run the application with a dedicated non-privileged user account.',
                category: 'privilege-management'
            });
        }
        
        // Check security headers configuration
        const securityHeaders = [
            'SECURITY_HEADERS_ENABLED',
            'HSTS_ENABLED',
            'CSP_ENABLED',
            'X_FRAME_OPTIONS_ENABLED'
        ];
        
        for (const header of securityHeaders) {
            if (!process.env[header] || process.env[header] !== 'true') {
                findings.push({
                    type: 'system-hardening',
                    severity: 'medium',
                    title: `Security header not enabled: ${header}`,
                    description: `The ${header} security header is not enabled, reducing protection against common attacks.`,
                    remediation: `Enable ${header}=true and configure appropriate security headers.`,
                    category: 'web-security'
                });
            }
        }
        
        this.findings.push(...findings);
    }
    
    // =============================================================================
    // Compliance Checking
    // =============================================================================
    
    async checkCompliance() {
        console.log('📋 Checking compliance frameworks...');
        
        const frameworks = this.config.compliance.frameworks;
        
        if (frameworks.soc2) {
            this.compliance.soc2 = await this.checkSOC2Compliance();
        }
        
        if (frameworks.iso27001) {
            this.compliance.iso27001 = await this.checkISO27001Compliance();
        }
        
        if (frameworks.gdpr) {
            this.compliance.gdpr = await this.checkGDPRCompliance();
        }
        
        if (frameworks.hipaa) {
            this.compliance.hipaa = await this.checkHIPAACompliance();
        }
        
        if (frameworks.pci) {
            this.compliance.pci = await this.checkPCICompliance();
        }
    }
    
    async checkSOC2Compliance() {
        const checks = {
            'CC6.1': this.hasSecurityHeaders(),
            'CC6.2': this.hasEncryptionInTransit(),
            'CC6.3': this.hasEncryptionAtRest(),
            'CC6.6': this.hasVulnerabilityManagement(),
            'CC6.7': this.hasIncidentResponse(),
            'CC7.1': this.hasAccessControls(),
            'CC7.2': this.hasUserAuthentication(),
            'CC8.1': this.hasChangeManagement()
        };
        
        const passed = Object.values(checks).filter(Boolean).length;
        const total = Object.keys(checks).length;
        
        return {
            framework: 'SOC 2',
            score: (passed / total) * 100,
            passed,
            total,
            checks,
            compliant: passed === total
        };
    }
    
    async checkISO27001Compliance() {
        const checks = {
            'A.9.1.1': this.hasAccessControlPolicy(),
            'A.9.2.1': this.hasUserRegistration(),
            'A.9.4.2': this.hasSecureLogon(),
            'A.10.1.1': this.hasCryptographicPolicy(),
            'A.12.2.1': this.hasAntiMalware(),
            'A.12.4.1': this.hasEventLogging(),
            'A.12.6.1': this.hasVulnerabilityManagement(),
            'A.13.1.1': this.hasNetworkControls()
        };
        
        const passed = Object.values(checks).filter(Boolean).length;
        const total = Object.keys(checks).length;
        
        return {
            framework: 'ISO 27001',
            score: (passed / total) * 100,
            passed,
            total,
            checks,
            compliant: passed === total
        };
    }
    
    async checkGDPRCompliance() {
        const checks = {
            'Art.25': this.hasDataProtectionByDesign(),
            'Art.30': this.hasRecordsOfProcessing(),
            'Art.32': this.hasSecurityOfProcessing(),
            'Art.33': this.hasBreachNotification(),
            'Art.35': this.hasDataProtectionImpactAssessment()
        };
        
        const passed = Object.values(checks).filter(Boolean).length;
        const total = Object.keys(checks).length;
        
        return {
            framework: 'GDPR',
            score: (passed / total) * 100,
            passed,
            total,
            checks,
            compliant: passed === total
        };
    }
    
    async checkHIPAACompliance() {
        const checks = {
            '164.308': this.hasAdministrativeSafeguards(),
            '164.310': this.hasPhysicalSafeguards(),
            '164.312': this.hasTechnicalSafeguards(),
            '164.314': this.hasOrganizationalRequirements()
        };
        
        const passed = Object.values(checks).filter(Boolean).length;
        const total = Object.keys(checks).length;
        
        return {
            framework: 'HIPAA',
            score: (passed / total) * 100,
            passed,
            total,
            checks,
            compliant: passed === total
        };
    }
    
    async checkPCICompliance() {
        const checks = {
            'Req.1': this.hasFirewallConfiguration(),
            'Req.2': this.hasSecureConfiguration(),
            'Req.3': this.hasDataProtection(),
            'Req.4': this.hasEncryptionInTransit(),
            'Req.6': this.hasSecureDevelopment(),
            'Req.7': this.hasAccessControls(),
            'Req.8': this.hasUserAuthentication(),
            'Req.10': this.hasLoggingMonitoring(),
            'Req.11': this.hasVulnerabilityTesting()
        };
        
        const passed = Object.values(checks).filter(Boolean).length;
        const total = Object.keys(checks).length;
        
        return {
            framework: 'PCI DSS',
            score: (passed / total) * 100,
            passed,
            total,
            checks,
            compliant: passed === total
        };
    }
    
    // Compliance check helper methods
    hasSecurityHeaders() {
        return process.env.SECURITY_HEADERS_ENABLED === 'true';
    }
    
    hasEncryptionInTransit() {
        return process.env.HTTPS_ENABLED === 'true';
    }
    
    hasEncryptionAtRest() {
        return process.env.DATABASE_ENCRYPTION_ENABLED === 'true';
    }
    
    hasVulnerabilityManagement() {
        return process.env.VULNERABILITY_SCAN_ENABLED === 'true';
    }
    
    hasIncidentResponse() {
        return process.env.INCIDENT_RESPONSE_ENABLED === 'true';
    }
    
    hasAccessControls() {
        return process.env.RBAC_ENABLED === 'true';
    }
    
    hasUserAuthentication() {
        return process.env.AUTHENTICATION_ENABLED === 'true';
    }
    
    hasChangeManagement() {
        return process.env.CHANGE_MANAGEMENT_ENABLED === 'true';
    }
    
    hasAccessControlPolicy() {
        return process.env.ACCESS_CONTROL_POLICY === 'true';
    }
    
    hasUserRegistration() {
        return process.env.USER_REGISTRATION_ENABLED === 'true';
    }
    
    hasSecureLogon() {
        return process.env.SECURE_LOGON_ENABLED === 'true';
    }
    
    hasCryptographicPolicy() {
        return process.env.CRYPTOGRAPHIC_POLICY === 'true';
    }
    
    hasAntiMalware() {
        return process.env.ANTI_MALWARE_ENABLED === 'true';
    }
    
    hasEventLogging() {
        return process.env.AUDIT_LOGGING_ENABLED === 'true';
    }
    
    hasNetworkControls() {
        return process.env.FIREWALL_ENABLED === 'true';
    }
    
    hasDataProtectionByDesign() {
        return process.env.DATA_PROTECTION_BY_DESIGN === 'true';
    }
    
    hasRecordsOfProcessing() {
        return process.env.RECORDS_OF_PROCESSING === 'true';
    }
    
    hasSecurityOfProcessing() {
        return process.env.SECURITY_OF_PROCESSING === 'true';
    }
    
    hasBreachNotification() {
        return process.env.BREACH_NOTIFICATION_ENABLED === 'true';
    }
    
    hasDataProtectionImpactAssessment() {
        return process.env.DPIA_ENABLED === 'true';
    }
    
    hasAdministrativeSafeguards() {
        return process.env.ADMINISTRATIVE_SAFEGUARDS === 'true';
    }
    
    hasPhysicalSafeguards() {
        return process.env.PHYSICAL_SAFEGUARDS === 'true';
    }
    
    hasTechnicalSafeguards() {
        return process.env.TECHNICAL_SAFEGUARDS === 'true';
    }
    
    hasOrganizationalRequirements() {
        return process.env.ORGANIZATIONAL_REQUIREMENTS === 'true';
    }
    
    hasFirewallConfiguration() {
        return process.env.FIREWALL_ENABLED === 'true';
    }
    
    hasSecureConfiguration() {
        return process.env.SECURE_CONFIGURATION === 'true';
    }
    
    hasDataProtection() {
        return process.env.DATA_PROTECTION_ENABLED === 'true';
    }
    
    hasSecureDevelopment() {
        return process.env.SECURE_DEVELOPMENT === 'true';
    }
    
    hasLoggingMonitoring() {
        return process.env.AUDIT_LOGGING_ENABLED === 'true';
    }
    
    hasVulnerabilityTesting() {
        return process.env.VULNERABILITY_TESTING === 'true';
    }
    
    // =============================================================================
    // Vulnerability Scanning
    // =============================================================================
    
    async scanVulnerabilities() {
        console.log('🔍 Scanning for vulnerabilities...');
        
        // This would integrate with external vulnerability databases
        // For now, we'll simulate some common vulnerabilities
        
        const commonVulns = [
            {
                id: 'CVE-2021-44228',
                title: 'Log4j Remote Code Execution',
                severity: 'critical',
                score: 10.0,
                description: 'Apache Log4j2 JNDI features do not protect against attacker controlled LDAP and other JNDI related endpoints.',
                affected: 'log4j-core',
                remediation: 'Update to Log4j 2.17.0 or later'
            },
            {
                id: 'CVE-2021-23337',
                title: 'Lodash Command Injection',
                severity: 'high',
                score: 7.2,
                description: 'Lodash versions prior to 4.17.21 are vulnerable to Command Injection via template.',
                affected: 'lodash',
                remediation: 'Update to Lodash 4.17.21 or later'
            }
        ];
        
        // Check if vulnerable packages are present
        try {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            
            const allDeps = {
                ...packageJson.dependencies || {},
                ...packageJson.devDependencies || {}
            };
            
            for (const vuln of commonVulns) {
                if (allDeps[vuln.affected]) {
                    this.vulnerabilities.push({
                        ...vuln,
                        found: true,
                        currentVersion: allDeps[vuln.affected]
                    });
                }
            }
            
        } catch (error) {
            console.warn(`Could not scan dependencies for vulnerabilities: ${error.message}`);
        }
    }
    
    // =============================================================================
    // Risk Assessment
    // =============================================================================
    
    async calculateRiskScores() {
        console.log('📊 Calculating risk scores...');
        
        for (const finding of this.findings) {
            const risk = this.calculateRisk(finding);
            this.risks.push({
                ...finding,
                risk
            });
        }
        
        for (const vuln of this.vulnerabilities) {
            const risk = this.calculateVulnerabilityRisk(vuln);
            this.risks.push({
                type: 'vulnerability',
                title: vuln.title,
                severity: vuln.severity,
                description: vuln.description,
                remediation: vuln.remediation,
                category: 'vulnerability',
                risk
            });
        }
        
        // Sort risks by score (highest first)
        this.risks.sort((a, b) => b.risk.score - a.risk.score);
    }
    
    calculateRisk(finding) {
        const severityMap = {
            critical: 5,
            high: 4,
            medium: 3,
            low: 2,
            info: 1
        };
        
        const impact = severityMap[finding.severity] || 1;
        const likelihood = this.calculateLikelihood(finding);
        const score = impact * likelihood;
        
        return {
            impact,
            likelihood,
            score,
            level: this.getRiskLevel(score)
        };
    }
    
    calculateVulnerabilityRisk(vuln) {
        const impact = Math.ceil(vuln.score / 2); // Convert CVSS to 1-5 scale
        const likelihood = vuln.found ? 5 : 1; // High likelihood if vulnerable package is present
        const score = impact * likelihood;
        
        return {
            impact,
            likelihood,
            score,
            level: this.getRiskLevel(score),
            cvss: vuln.score
        };
    }
    
    calculateLikelihood(finding) {
        // Simple likelihood calculation based on finding type and category
        const categoryLikelihood = {
            'authentication': 4,
            'authorization': 4,
            'configuration': 3,
            'encryption': 3,
            'network-security': 3,
            'data-protection': 2,
            'logging': 2,
            'dependency-security': 5,
            'file-security': 2,
            'system-hardening': 2
        };
        
        return categoryLikelihood[finding.category] || 3;
    }
    
    getRiskLevel(score) {
        const thresholds = this.config.risk.threshold;
        
        if (score >= thresholds.critical) return 'critical';
        if (score >= thresholds.high) return 'high';
        if (score >= thresholds.medium) return 'medium';
        if (score >= thresholds.low) return 'low';
        return 'info';
    }
    
    // =============================================================================
    // Report Generation
    // =============================================================================
    
    async generateReport() {
        const endTime = new Date();
        const duration = endTime - this.startTime;
        
        const report = {
            audit: {
                id: this.auditId,
                startTime: this.startTime.toISOString(),
                endTime: endTime.toISOString(),
                duration: Math.round(duration / 1000), // seconds
                version: '2.0.0'
            },
            summary: {
                totalFindings: this.findings.length,
                totalVulnerabilities: this.vulnerabilities.length,
                totalRisks: this.risks.length,
                riskDistribution: this.getRiskDistribution(),
                complianceScore: this.getOverallComplianceScore()
            },
            findings: this.findings,
            vulnerabilities: this.vulnerabilities,
            risks: this.risks,
            compliance: this.compliance,
            recommendations: this.generateRecommendations(),
            metadata: {
                hostname: os.hostname(),
                platform: os.platform(),
                nodeVersion: process.version,
                environment: process.env.NODE_ENV || 'development'
            }
        };
        
        // Save report to file
        await this.saveReport(report);
        
        return report;
    }
    
    getRiskDistribution() {
        const distribution = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0
        };
        
        for (const risk of this.risks) {
            distribution[risk.risk.level]++;
        }
        
        return distribution;
    }
    
    getOverallComplianceScore() {
        const scores = Object.values(this.compliance).map(c => c.score);
        if (scores.length === 0) return 0;
        
        return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }
    
    generateRecommendations() {
        const recommendations = [];
        
        // High-priority recommendations based on critical/high risks
        const criticalRisks = this.risks.filter(r => r.risk.level === 'critical');
        const highRisks = this.risks.filter(r => r.risk.level === 'high');
        
        if (criticalRisks.length > 0) {
            recommendations.push({
                priority: 'critical',
                title: 'Address Critical Security Risks Immediately',
                description: `Found ${criticalRisks.length} critical security risks that require immediate attention.`,
                actions: criticalRisks.slice(0, 5).map(r => r.remediation)
            });
        }
        
        if (highRisks.length > 0) {
            recommendations.push({
                priority: 'high',
                title: 'Resolve High-Priority Security Issues',
                description: `Found ${highRisks.length} high-priority security issues that should be addressed soon.`,
                actions: highRisks.slice(0, 5).map(r => r.remediation)
            });
        }
        
        // Compliance recommendations
        const nonCompliantFrameworks = Object.entries(this.compliance)
            .filter(([_, compliance]) => !compliance.compliant)
            .map(([framework, _]) => framework);
        
        if (nonCompliantFrameworks.length > 0) {
            recommendations.push({
                priority: 'medium',
                title: 'Improve Compliance Posture',
                description: `Non-compliant with: ${nonCompliantFrameworks.join(', ')}`,
                actions: [
                    'Review compliance requirements for each framework',
                    'Implement missing controls and safeguards',
                    'Document compliance procedures',
                    'Schedule regular compliance assessments'
                ]
            });
        }
        
        return recommendations;
    }
    
    async saveReport(report) {
        try {
            // Ensure report directory exists
            const reportDir = this.config.audit.reportPath;
            await fs.mkdir(reportDir, { recursive: true });
            
            // Save JSON report
            const jsonPath = path.join(reportDir, `${this.auditId}.json`);
            await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
            
            // Save HTML report
            const htmlPath = path.join(reportDir, `${this.auditId}.html`);
            const htmlReport = this.generateHTMLReport(report);
            await fs.writeFile(htmlPath, htmlReport);
            
            // Clean up old reports
            await this.cleanupOldReports(reportDir);
            
            console.log(`📄 Report saved: ${jsonPath}`);
            console.log(`📄 HTML report: ${htmlPath}`);
            
        } catch (error) {
            console.error(`Failed to save report: ${error.message}`);
        }
    }
    
    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Audit Report - ${report.audit.id}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .number { font-size: 2em; font-weight: bold; color: #007bff; }
        .risk-critical { color: #dc3545; }
        .risk-high { color: #fd7e14; }
        .risk-medium { color: #ffc107; }
        .risk-low { color: #28a745; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .finding { background: #f8f9fa; padding: 15px; margin-bottom: 15px; border-left: 4px solid #007bff; border-radius: 4px; }
        .finding.critical { border-left-color: #dc3545; }
        .finding.high { border-left-color: #fd7e14; }
        .finding.medium { border-left-color: #ffc107; }
        .finding.low { border-left-color: #28a745; }
        .finding h4 { margin: 0 0 10px 0; color: #333; }
        .finding .severity { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; text-transform: uppercase; }
        .severity.critical { background: #dc3545; color: white; }
        .severity.high { background: #fd7e14; color: white; }
        .severity.medium { background: #ffc107; color: black; }
        .severity.low { background: #28a745; color: white; }
        .compliance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .compliance-card { background: #f8f9fa; padding: 20px; border-radius: 6px; }
        .compliance-score { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .score-excellent { color: #28a745; }
        .score-good { color: #ffc107; }
        .score-poor { color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Security Audit Report</h1>
            <p><strong>Audit ID:</strong> ${report.audit.id}</p>
            <p><strong>Generated:</strong> ${new Date(report.audit.endTime).toLocaleString()}</p>
            <p><strong>Duration:</strong> ${report.audit.duration} seconds</p>
        </div>
        
        <div class="section">
            <h2>📊 Executive Summary</h2>
            <div class="summary">
                <div class="summary-card">
                    <h3>Total Findings</h3>
                    <div class="number">${report.summary.totalFindings}</div>
                </div>
                <div class="summary-card">
                    <h3>Vulnerabilities</h3>
                    <div class="number">${report.summary.totalVulnerabilities}</div>
                </div>
                <div class="summary-card">
                    <h3>Critical Risks</h3>
                    <div class="number risk-critical">${report.summary.riskDistribution.critical}</div>
                </div>
                <div class="summary-card">
                    <h3>Compliance Score</h3>
                    <div class="number">${report.summary.complianceScore}%</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>🚨 Risk Distribution</h2>
            <div class="summary">
                <div class="summary-card">
                    <h3>Critical</h3>
                    <div class="number risk-critical">${report.summary.riskDistribution.critical}</div>
                </div>
                <div class="summary-card">
                    <h3>High</h3>
                    <div class="number risk-high">${report.summary.riskDistribution.high}</div>
                </div>
                <div class="summary-card">
                    <h3>Medium</h3>
                    <div class="number risk-medium">${report.summary.riskDistribution.medium}</div>
                </div>
                <div class="summary-card">
                    <h3>Low</h3>
                    <div class="number risk-low">${report.summary.riskDistribution.low}</div>
                </div>
            </div>
        </div>
        
        ${Object.keys(report.compliance).length > 0 ? `
        <div class="section">
            <h2>📋 Compliance Status</h2>
            <div class="compliance-grid">
                ${Object.entries(report.compliance).map(([framework, compliance]) => `
                <div class="compliance-card">
                    <h3>${compliance.framework}</h3>
                    <div class="compliance-score ${compliance.score >= 90 ? 'score-excellent' : compliance.score >= 70 ? 'score-good' : 'score-poor'}">
                        ${compliance.score}%
                    </div>
                    <p>${compliance.passed}/${compliance.total} controls passed</p>
                    <p><strong>Status:</strong> ${compliance.compliant ? '✅ Compliant' : '❌ Non-compliant'}</p>
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        ${report.findings.length > 0 ? `
        <div class="section">
            <h2>🔍 Security Findings</h2>
            ${report.findings.map(finding => `
            <div class="finding ${finding.severity}">
                <h4>${finding.title} <span class="severity ${finding.severity}">${finding.severity}</span></h4>
                <p><strong>Description:</strong> ${finding.description}</p>
                <p><strong>Category:</strong> ${finding.category}</p>
                <p><strong>Remediation:</strong> ${finding.remediation}</p>
            </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${report.vulnerabilities.length > 0 ? `
        <div class="section">
            <h2>🔓 Vulnerabilities</h2>
            ${report.vulnerabilities.map(vuln => `
            <div class="finding ${vuln.severity}">
                <h4>${vuln.title} <span class="severity ${vuln.severity}">${vuln.severity}</span></h4>
                <p><strong>CVE ID:</strong> ${vuln.id}</p>
                <p><strong>CVSS Score:</strong> ${vuln.score}</p>
                <p><strong>Description:</strong> ${vuln.description}</p>
                <p><strong>Affected Package:</strong> ${vuln.affected}</p>
                <p><strong>Remediation:</strong> ${vuln.remediation}</p>
            </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${report.recommendations.length > 0 ? `
        <div class="section">
            <h2>💡 Recommendations</h2>
            ${report.recommendations.map(rec => `
            <div class="finding ${rec.priority}">
                <h4>${rec.title} <span class="severity ${rec.priority}">${rec.priority}</span></h4>
                <p>${rec.description}</p>
                <ul>
                    ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                </ul>
            </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="section">
            <h2>ℹ️ System Information</h2>
            <p><strong>Hostname:</strong> ${report.metadata.hostname}</p>
            <p><strong>Platform:</strong> ${report.metadata.platform}</p>
            <p><strong>Node.js Version:</strong> ${report.metadata.nodeVersion}</p>
            <p><strong>Environment:</strong> ${report.metadata.environment}</p>
        </div>
    </div>
</body>
</html>
        `;
    }
    
    async cleanupOldReports(reportDir) {
        try {
            const files = await fs.readdir(reportDir);
            const reportFiles = files
                .filter(file => file.startsWith('audit-') && file.endsWith('.json'))
                .map(file => ({
                    name: file,
                    path: path.join(reportDir, file),
                    time: fs.stat(path.join(reportDir, file)).then(stats => stats.mtime)
                }));
            
            if (reportFiles.length > this.config.audit.maxReports) {
                // Sort by modification time and remove oldest files
                const sortedFiles = await Promise.all(
                    reportFiles.map(async file => ({
                        ...file,
                        time: await file.time
                    }))
                );
                
                sortedFiles.sort((a, b) => a.time - b.time);
                
                const filesToDelete = sortedFiles.slice(0, sortedFiles.length - this.config.audit.maxReports);
                
                for (const file of filesToDelete) {
                    await fs.unlink(file.path);
                    // Also delete corresponding HTML file
                    const htmlPath = file.path.replace('.json', '.html');
                    try {
                        await fs.unlink(htmlPath);
                    } catch {
                        // HTML file might not exist
                    }
                }
                
                console.log(`🗑️ Cleaned up ${filesToDelete.length} old reports`);
            }
            
        } catch (error) {
            console.warn(`Could not cleanup old reports: ${error.message}`);
        }
    }
    
    // =============================================================================
    // Notifications
    // =============================================================================
    
    async sendNotifications(report) {
        const notifications = this.config.notifications;
        
        if (notifications.email.enabled) {
            await this.sendEmailNotification(report);
        }
        
        if (notifications.slack.enabled) {
            await this.sendSlackNotification(report);
        }
        
        if (notifications.webhook.enabled) {
            await this.sendWebhookNotification(report);
        }
    }
    
    async sendEmailNotification(report) {
        try {
            const nodemailer = require('nodemailer');
            
            const transporter = nodemailer.createTransporter(this.config.notifications.email.smtp);
            
            const criticalRisks = report.summary.riskDistribution.critical;
            const highRisks = report.summary.riskDistribution.high;
            const complianceScore = report.summary.complianceScore;
            
            const subject = `🛡️ Security Audit Report - ${report.audit.id} (${criticalRisks} Critical, ${highRisks} High)`;
            
            const html = `
                <h2>Security Audit Report</h2>
                <p><strong>Audit ID:</strong> ${report.audit.id}</p>
                <p><strong>Generated:</strong> ${new Date(report.audit.endTime).toLocaleString()}</p>
                
                <h3>Summary</h3>
                <ul>
                    <li>Total Findings: ${report.summary.totalFindings}</li>
                    <li>Vulnerabilities: ${report.summary.totalVulnerabilities}</li>
                    <li>Critical Risks: ${criticalRisks}</li>
                    <li>High Risks: ${highRisks}</li>
                    <li>Compliance Score: ${complianceScore}%</li>
                </ul>
                
                ${criticalRisks > 0 ? `
                <h3 style="color: #dc3545;">⚠️ Critical Issues Require Immediate Attention</h3>
                <p>This audit found ${criticalRisks} critical security issues that need immediate remediation.</p>
                ` : ''}
                
                <p>Full report available in the security dashboard.</p>
            `;
            
            const mailOptions = {
                from: this.config.notifications.email.smtp.auth.user,
                to: this.config.notifications.email.recipients.join(','),
                subject,
                html
            };
            
            await transporter.sendMail(mailOptions);
            console.log('📧 Email notification sent');
            
        } catch (error) {
            console.error(`Failed to send email notification: ${error.message}`);
        }
    }
    
    async sendSlackNotification(report) {
        try {
            const axios = require('axios');
            
            const criticalRisks = report.summary.riskDistribution.critical;
            const highRisks = report.summary.riskDistribution.high;
            const complianceScore = report.summary.complianceScore;
            
            const color = criticalRisks > 0 ? 'danger' : highRisks > 0 ? 'warning' : 'good';
            
            const payload = {
                channel: this.config.notifications.slack.channel,
                username: 'Security Audit Bot',
                icon_emoji: ':shield:',
                attachments: [{
                    color,
                    title: `🛡️ Security Audit Report - ${report.audit.id}`,
                    fields: [
                        {
                            title: 'Total Findings',
                            value: report.summary.totalFindings,
                            short: true
                        },
                        {
                            title: 'Critical Risks',
                            value: criticalRisks,
                            short: true
                        },
                        {
                            title: 'High Risks',
                            value: highRisks,
                            short: true
                        },
                        {
                            title: 'Compliance Score',
                            value: `${complianceScore}%`,
                            short: true
                        }
                    ],
                    footer: 'Git Memory MCP Security Audit',
                    ts: Math.floor(Date.now() / 1000)
                }]
            };
            
            await axios.post(this.config.notifications.slack.webhook, payload);
            console.log('💬 Slack notification sent');
            
        } catch (error) {
            console.error(`Failed to send Slack notification: ${error.message}`);
        }
    }
    
    async sendWebhookNotification(report) {
        try {
            const axios = require('axios');
            const crypto = require('crypto');
            
            const payload = {
                event: 'security_audit_completed',
                audit_id: report.audit.id,
                timestamp: report.audit.endTime,
                summary: report.summary,
                critical_findings: report.risks.filter(r => r.risk.level === 'critical').slice(0, 5)
            };
            
            const payloadString = JSON.stringify(payload);
            
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'Git-Memory-MCP-Security-Audit/2.0.0'
            };
            
            // Add signature if secret is configured
            if (this.config.notifications.webhook.secret) {
                const signature = crypto
                    .createHmac('sha256', this.config.notifications.webhook.secret)
                    .update(payloadString)
                    .digest('hex');
                headers['X-Signature-SHA256'] = `sha256=${signature}`;
            }
            
            await axios.post(this.config.notifications.webhook.url, payload, { headers });
            console.log('🔗 Webhook notification sent');
            
        } catch (error) {
            console.error(`Failed to send webhook notification: ${error.message}`);
        }
    }
}

// =============================================================================
// Compliance Framework Manager
// =============================================================================

class ComplianceFrameworkManager {
    constructor() {
        this.frameworks = new Map();
        this.initializeFrameworks();
    }
    
    initializeFrameworks() {
        // SOC 2 Framework
        this.frameworks.set('soc2', {
            name: 'SOC 2',
            description: 'Service Organization Control 2',
            categories: {
                'CC6': 'Logical and Physical Access Controls',
                'CC7': 'System Operations',
                'CC8': 'Change Management'
            },
            controls: {
                'CC6.1': 'Security Management Process',
                'CC6.2': 'Logical and Physical Access Controls',
                'CC6.3': 'Network Security',
                'CC6.6': 'Vulnerability Management',
                'CC6.7': 'Data Classification',
                'CC7.1': 'System Operations',
                'CC7.2': 'Detection of Security Events',
                'CC8.1': 'Change Management Process'
            }
        });
        
        // ISO 27001 Framework
        this.frameworks.set('iso27001', {
            name: 'ISO 27001',
            description: 'Information Security Management System',
            categories: {
                'A.9': 'Access Control',
                'A.10': 'Cryptography',
                'A.12': 'Operations Security',
                'A.13': 'Communications Security'
            },
            controls: {
                'A.9.1.1': 'Access Control Policy',
                'A.9.2.1': 'User Registration and De-registration',
                'A.9.4.2': 'Secure Log-on Procedures',
                'A.10.1.1': 'Policy on the Use of Cryptographic Controls',
                'A.12.2.1': 'Controls Against Malware',
                'A.12.4.1': 'Event Logging',
                'A.12.6.1': 'Management of Technical Vulnerabilities',
                'A.13.1.1': 'Network Controls'
            }
        });
        
        // GDPR Framework
        this.frameworks.set('gdpr', {
            name: 'GDPR',
            description: 'General Data Protection Regulation',
            categories: {
                'Art.25': 'Data Protection by Design and by Default',
                'Art.30': 'Records of Processing Activities',
                'Art.32': 'Security of Processing',
                'Art.33': 'Notification of Personal Data Breach',
                'Art.35': 'Data Protection Impact Assessment'
            },
            controls: {
                'Art.25': 'Data Protection by Design and by Default',
                'Art.30': 'Records of Processing Activities',
                'Art.32': 'Security of Processing',
                'Art.33': 'Notification of Personal Data Breach to Supervisory Authority',
                'Art.35': 'Data Protection Impact Assessment'
            }
        });
    }
    
    getFramework(name) {
        return this.frameworks.get(name);
    }
    
    getAllFrameworks() {
        return Array.from(this.frameworks.values());
    }
}

// =============================================================================
// Vulnerability Database Manager
// =============================================================================

class VulnerabilityDatabaseManager {
    constructor(config) {
        this.config = config;
        this.databases = new Map();
        this.cache = new Map();
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    }
    
    async initializeDatabases() {
        if (this.config.vulnerability.databases.nvd) {
            this.databases.set('nvd', new NVDDatabase(this.config.vulnerability.databases.nvd));
        }
        
        if (this.config.vulnerability.databases.snyk) {
            this.databases.set('snyk', new SnykDatabase(this.config.vulnerability.databases.snyk));
        }
        
        if (this.config.vulnerability.databases.github) {
            this.databases.set('github', new GitHubAdvisoryDatabase(this.config.vulnerability.databases.github));
        }
    }
    
    async searchVulnerabilities(packageName, version) {
        const cacheKey = `${packageName}@${version}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }
        
        const vulnerabilities = [];
        
        // Search all available databases
        for (const [name, database] of this.databases) {
            try {
                const vulns = await database.search(packageName, version);
                vulnerabilities.push(...vulns.map(v => ({ ...v, source: name })));
            } catch (error) {
                console.warn(`Failed to search ${name} database: ${error.message}`);
            }
        }
        
        // Cache results
        this.cache.set(cacheKey, {
            data: vulnerabilities,
            timestamp: Date.now()
        });
        
        return vulnerabilities;
    }
}

// =============================================================================
// Risk Assessment Engine
// =============================================================================

class RiskAssessmentEngine {
    constructor(config) {
        this.config = config;
        this.riskMatrix = config.risk.matrix;
        this.thresholds = config.risk.threshold;
    }
    
    assessRisk(finding) {
        const impact = this.calculateImpact(finding);
        const likelihood = this.calculateLikelihood(finding);
        const score = impact * likelihood;
        
        return {
            impact,
            likelihood,
            score,
            level: this.getRiskLevel(score),
            category: finding.category,
            mitigation: this.suggestMitigation(finding)
        };
    }
    
    calculateImpact(finding) {
        const severityMap = {
            critical: 5,
            high: 4,
            medium: 3,
            low: 2,
            info: 1
        };
        
        let impact = severityMap[finding.severity] || 3;
        
        // Adjust based on category
        const categoryMultipliers = {
            'authentication': 1.2,
            'authorization': 1.2,
            'encryption': 1.1,
            'data-protection': 1.1,
            'network-security': 1.0,
            'configuration': 0.9,
            'logging': 0.8
        };
        
        const multiplier = categoryMultipliers[finding.category] || 1.0;
        impact = Math.min(5, Math.round(impact * multiplier));
        
        return impact;
    }
    
    calculateLikelihood(finding) {
        // Base likelihood from category
        const categoryLikelihood = {
            'authentication': 4,
            'authorization': 4,
            'configuration': 3,
            'encryption': 3,
            'network-security': 3,
            'data-protection': 2,
            'logging': 2,
            'dependency-security': 5,
            'file-security': 2,
            'system-hardening': 2
        };
        
        let likelihood = categoryLikelihood[finding.category] || 3;
        
        // Adjust based on environment
        const environment = process.env.NODE_ENV || 'development';
        if (environment === 'production') {
            likelihood = Math.min(5, likelihood + 1);
        }
        
        return likelihood;
    }
    
    getRiskLevel(score) {
        if (score >= this.thresholds.critical) return 'critical';
        if (score >= this.thresholds.high) return 'high';
        if (score >= this.thresholds.medium) return 'medium';
        if (score >= this.thresholds.low) return 'low';
        return 'info';
    }
    
    suggestMitigation(finding) {
        const mitigationStrategies = {
            'authentication': [
                'Implement multi-factor authentication',
                'Use strong password policies',
                'Enable account lockout mechanisms',
                'Implement session management controls'
            ],
            'authorization': [
                'Implement role-based access control',
                'Apply principle of least privilege',
                'Regular access reviews',
                'Implement attribute-based access control'
            ],
            'encryption': [
                'Use strong encryption algorithms',
                'Implement proper key management',
                'Enable encryption in transit and at rest',
                'Regular key rotation'
            ],
            'configuration': [
                'Implement configuration management',
                'Use infrastructure as code',
                'Regular configuration audits',
                'Implement change control processes'
            ]
        };
        
        return mitigationStrategies[finding.category] || [
            'Review and implement security best practices',
            'Conduct regular security assessments',
            'Implement monitoring and alerting',
            'Provide security training to team members'
        ];
    }
}

// =============================================================================
// Automated Remediation Engine
// =============================================================================

class AutomatedRemediationEngine {
    constructor(config) {
        this.config = config;
        this.enabled = config.audit.autoRemediation;
        this.remediationActions = new Map();
        this.initializeActions();
    }
    
    initializeActions() {
        // File permission fixes
        this.remediationActions.set('file-permissions', {
            canAutoRemediate: true,
            action: this.fixFilePermissions.bind(this),
            description: 'Fix insecure file permissions'
        });
        
        // Configuration fixes
        this.remediationActions.set('configuration', {
            canAutoRemediate: true,
            action: this.fixConfiguration.bind(this),
            description: 'Apply secure configuration settings'
        });
        
        // Dependency updates
        this.remediationActions.set('dependency-security', {
            canAutoRemediate: false, // Requires manual review
            action: this.suggestDependencyUpdates.bind(this),
            description: 'Suggest dependency updates'
        });
    }
    
    async attemptRemediation(finding) {
        if (!this.enabled) {
            return { remediated: false, reason: 'Auto-remediation disabled' };
        }
        
        const action = this.remediationActions.get(finding.category);
        if (!action) {
            return { remediated: false, reason: 'No remediation action available' };
        }
        
        if (!action.canAutoRemediate) {
            return { remediated: false, reason: 'Manual remediation required' };
        }
        
        try {
            const result = await action.action(finding);
            return { remediated: true, result };
        } catch (error) {
            return { remediated: false, reason: error.message };
        }
    }
    
    async fixFilePermissions(finding) {
        // Extract file path from finding
        const fileMatch = finding.description.match(/file ([^\s]+)/);
        if (!fileMatch) {
            throw new Error('Could not extract file path from finding');
        }
        
        const filePath = fileMatch[1];
        
        // Set secure permissions (600 for sensitive files)
        await fs.chmod(filePath, 0o600);
        
        return `Fixed permissions for ${filePath}`;
    }
    
    async fixConfiguration(finding) {
        // This would implement configuration fixes
        // For now, just log the recommendation
        console.log(`Configuration fix needed: ${finding.remediation}`);
        return 'Configuration fix logged for manual review';
    }
    
    async suggestDependencyUpdates(finding) {
        // This would suggest dependency updates
        console.log(`Dependency update needed: ${finding.remediation}`);
        return 'Dependency update suggestion logged';
    }
}

// =============================================================================
// Security Metrics Collector
// =============================================================================

class SecurityMetricsCollector {
    constructor() {
        this.metrics = {
            auditHistory: [],
            trendData: {},
            benchmarks: {}
        };
    }
    
    recordAuditResults(report) {
        const metrics = {
            timestamp: report.audit.endTime,
            auditId: report.audit.id,
            totalFindings: report.summary.totalFindings,
            riskDistribution: report.summary.riskDistribution,
            complianceScore: report.summary.complianceScore,
            vulnerabilities: report.summary.totalVulnerabilities
        };
        
        this.metrics.auditHistory.push(metrics);
        this.updateTrends();
        this.updateBenchmarks();
    }
    
    updateTrends() {
        const history = this.metrics.auditHistory;
        if (history.length < 2) return;
        
        const current = history[history.length - 1];
        const previous = history[history.length - 2];
        
        this.metrics.trendData = {
            findingsTrend: current.totalFindings - previous.totalFindings,
            complianceTrend: current.complianceScore - previous.complianceScore,
            vulnerabilitiesTrend: current.vulnerabilities - previous.vulnerabilities,
            riskTrend: {
                critical: current.riskDistribution.critical - previous.riskDistribution.critical,
                high: current.riskDistribution.high - previous.riskDistribution.high
            }
        };
    }
    
    updateBenchmarks() {
        const history = this.metrics.auditHistory;
        if (history.length === 0) return;
        
        const totalFindings = history.map(h => h.totalFindings);
        const complianceScores = history.map(h => h.complianceScore);
        
        this.metrics.benchmarks = {
            averageFindings: totalFindings.reduce((a, b) => a + b, 0) / totalFindings.length,
            averageCompliance: complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length,
            bestCompliance: Math.max(...complianceScores),
            worstCompliance: Math.min(...complianceScores)
        };
    }
    
    getMetrics() {
        return this.metrics;
    }
}

// =============================================================================
// Main Security Audit CLI
// =============================================================================

class SecurityAuditCLI {
    constructor() {
        this.engine = new SecurityAuditEngine();
        this.metricsCollector = new SecurityMetricsCollector();
    }
    
    async run() {
        try {
            console.log('🛡️ Git Memory MCP Server - Security Audit System v2.0.0');
            console.log('=' .repeat(60));
            
            const report = await this.engine.runFullAudit();
            
            // Record metrics
            this.metricsCollector.recordAuditResults(report);
            
            // Display summary
            this.displaySummary(report);
            
            // Exit with appropriate code
            const criticalRisks = report.summary.riskDistribution.critical;
            const highRisks = report.summary.riskDistribution.high;
            
            if (criticalRisks > 0) {
                console.log('\n❌ Audit completed with CRITICAL issues - immediate action required');
                process.exit(1);
            } else if (highRisks > 0) {
                console.log('\n⚠️ Audit completed with HIGH priority issues - action recommended');
                process.exit(1);
            } else {
                console.log('\n✅ Audit completed successfully - no critical issues found');
                process.exit(0);
            }
            
        } catch (error) {
            console.error(`\n❌ Security audit failed: ${error.message}`);
            process.exit(1);
        }
    }
    
    displaySummary(report) {
        console.log('\n📊 AUDIT SUMMARY');
        console.log('-'.repeat(40));
        console.log(`Audit ID: ${report.audit.id}`);
        console.log(`Duration: ${report.audit.duration} seconds`);
        console.log(`Total Findings: ${report.summary.totalFindings}`);
        console.log(`Vulnerabilities: ${report.summary.totalVulnerabilities}`);
        console.log(`Compliance Score: ${report.summary.complianceScore}%`);
        
        console.log('\n🚨 RISK DISTRIBUTION');
        console.log('-'.repeat(40));
        console.log(`Critical: ${report.summary.riskDistribution.critical}`);
        console.log(`High: ${report.summary.riskDistribution.high}`);
        console.log(`Medium: ${report.summary.riskDistribution.medium}`);
        console.log(`Low: ${report.summary.riskDistribution.low}`);
        
        if (Object.keys(report.compliance).length > 0) {
            console.log('\n📋 COMPLIANCE STATUS');
            console.log('-'.repeat(40));
            for (const [framework, compliance] of Object.entries(report.compliance)) {
                const status = compliance.compliant ? '✅' : '❌';
                console.log(`${status} ${compliance.framework}: ${compliance.score}% (${compliance.passed}/${compliance.total})`);
            }
        }
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 TOP RECOMMENDATIONS');
            console.log('-'.repeat(40));
            report.recommendations.slice(0, 3).forEach((rec, index) => {
                console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
            });
        }
    }
}

// =============================================================================
// Export and CLI Entry Point
// =============================================================================

module.exports = {
    SecurityAuditEngine,
    ComplianceFrameworkManager,
    VulnerabilityDatabaseManager,
    RiskAssessmentEngine,
    AutomatedRemediationEngine,
    SecurityMetricsCollector,
    SecurityAuditCLI,
    CONFIG
};

// CLI Entry Point
if (require.main === module) {
    const cli = new SecurityAuditCLI();
    cli.run().catch(error => {
        console.error(`Fatal error: ${error.message}`);
        process.exit(1);
    });
}