/**
 * Security Configuration
 * Enterprise-grade security settings for NEXUS IDE
 * รองรับ multi-tenant, encryption, และ compliance standards
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class SecurityConfig {
    constructor() {
        this.environment = process.env.NODE_ENV || 'development';
        this.loadConfiguration();
        this.validateConfiguration();
    }
    
    /**
     * Load security configuration based on environment
     */
    loadConfiguration() {
        // Base security configuration
        this.config = {
            // JWT Configuration
            jwt: {
                secret: process.env.JWT_SECRET || this.generateSecureSecret(),
                algorithm: 'HS256',
                expiresIn: '24h',
                refreshExpiresIn: '7d',
                issuer: 'nexus-ide',
                audience: 'nexus-users',
                clockTolerance: 30 // seconds
            },
            
            // API Key Configuration
            apiKey: {
                secret: process.env.API_KEY_SECRET || this.generateSecureSecret(),
                algorithm: 'sha256',
                keyLength: 32,
                enableRotation: true,
                rotationInterval: 30 * 24 * 60 * 60 * 1000 // 30 days
            },
            
            // Encryption Configuration
            encryption: {
                algorithm: 'aes-256-gcm',
                keyDerivation: 'pbkdf2',
                iterations: 100000,
                saltLength: 32,
                ivLength: 16,
                tagLength: 16,
                masterKey: process.env.MASTER_KEY || this.generateSecureSecret()
            },
            
            // Password Policy
            password: {
                minLength: 8,
                maxLength: 128,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: true,
                specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
                preventCommonPasswords: true,
                preventUserInfo: true,
                maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
                historyCount: 5
            },
            
            // Session Configuration
            session: {
                timeout: 30 * 60 * 1000, // 30 minutes
                maxConcurrent: 5,
                enableRememberMe: true,
                rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
                secureCookies: this.environment === 'production',
                sameSite: 'strict',
                httpOnly: true
            },
            
            // Rate Limiting
            rateLimit: {
                enabled: true,
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100, // requests per window
                skipSuccessfulRequests: false,
                skipFailedRequests: false,
                keyGenerator: (req) => req.ip,
                
                // Specific endpoints
                endpoints: {
                    '/auth/login': { max: 5, windowMs: 15 * 60 * 1000 },
                    '/auth/register': { max: 3, windowMs: 60 * 60 * 1000 },
                    '/auth/forgot-password': { max: 3, windowMs: 60 * 60 * 1000 },
                    '/api/': { max: 1000, windowMs: 15 * 60 * 1000 }
                }
            },
            
            // Account Security
            account: {
                maxLoginAttempts: 5,
                lockoutDuration: 15 * 60 * 1000, // 15 minutes
                progressiveLockout: true,
                enableTwoFactor: false,
                twoFactorMethods: ['totp', 'sms', 'email'],
                enableDeviceTracking: true,
                suspiciousActivityDetection: true
            },
            
            // Multi-Tenant Security
            multiTenant: {
                enabled: true,
                isolation: 'strict', // strict, moderate, relaxed
                tenantIdValidation: true,
                crossTenantAccess: false,
                tenantSpecificKeys: true,
                auditCrossTenantRequests: true
            },
            
            // CORS Configuration
            cors: {
                enabled: true,
                origin: this.getAllowedOrigins(),
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
                allowedHeaders: [
                    'Content-Type',
                    'Authorization',
                    'X-API-Key',
                    'X-API-Signature',
                    'X-API-Payload',
                    'X-Tenant-ID',
                    'X-Request-ID',
                    'X-Client-Version'
                ],
                exposedHeaders: [
                    'X-Total-Count',
                    'X-Rate-Limit-Remaining',
                    'X-Rate-Limit-Reset',
                    'X-Request-ID'
                ],
                maxAge: 86400 // 24 hours
            },
            
            // Security Headers
            headers: {
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: ["'self'"],
                        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                        scriptSrc: ["'self'", "'unsafe-eval'"], // unsafe-eval needed for Monaco Editor
                        imgSrc: ["'self'", 'data:', 'https:'],
                        connectSrc: ["'self'", 'ws:', 'wss:'],
                        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                        objectSrc: ["'none'"],
                        mediaSrc: ["'self'"],
                        frameSrc: ["'none'"],
                        workerSrc: ["'self'", 'blob:']
                    }
                },
                hsts: {
                    maxAge: 31536000, // 1 year
                    includeSubDomains: true,
                    preload: true
                },
                frameOptions: 'DENY',
                contentTypeOptions: 'nosniff',
                xssProtection: '1; mode=block',
                referrerPolicy: 'strict-origin-when-cross-origin'
            },
            
            // Audit and Logging
            audit: {
                enabled: true,
                logLevel: 'info',
                logSensitiveData: false,
                retentionDays: 90,
                realTimeAlerts: true,
                
                // Events to log
                events: {
                    authentication: true,
                    authorization: true,
                    dataAccess: true,
                    configChanges: true,
                    securityViolations: true,
                    suspiciousActivity: true
                },
                
                // Alert thresholds
                alerts: {
                    failedLoginThreshold: 10,
                    suspiciousIPThreshold: 50,
                    dataExfiltrationThreshold: 1000,
                    timeWindow: 5 * 60 * 1000 // 5 minutes
                }
            },
            
            // Data Protection
            dataProtection: {
                encryptAtRest: true,
                encryptInTransit: true,
                dataClassification: true,
                piiDetection: true,
                dataLossPrevention: true,
                backupEncryption: true,
                
                // GDPR Compliance
                gdpr: {
                    enabled: true,
                    dataRetentionDays: 365,
                    rightToErasure: true,
                    dataPortability: true,
                    consentManagement: true
                }
            },
            
            // Network Security
            network: {
                enableHttps: this.environment === 'production',
                tlsVersion: '1.2',
                cipherSuites: [
                    'ECDHE-RSA-AES128-GCM-SHA256',
                    'ECDHE-RSA-AES256-GCM-SHA384',
                    'ECDHE-RSA-AES128-SHA256',
                    'ECDHE-RSA-AES256-SHA384'
                ],
                enableHPKP: false, // HTTP Public Key Pinning
                enableOCSP: true,
                
                // IP Filtering
                ipFiltering: {
                    enabled: false,
                    whitelist: [],
                    blacklist: []
                }
            },
            
            // Compliance Standards
            compliance: {
                standards: ['SOC2', 'ISO27001', 'GDPR', 'HIPAA'],
                
                soc2: {
                    enabled: true,
                    auditTrail: true,
                    accessControls: true,
                    dataIntegrity: true
                },
                
                iso27001: {
                    enabled: true,
                    riskAssessment: true,
                    incidentResponse: true,
                    businessContinuity: true
                },
                
                hipaa: {
                    enabled: false,
                    phi_protection: true,
                    access_logging: true,
                    encryption_required: true
                }
            }
        };
        
        // Environment-specific overrides
        this.applyEnvironmentOverrides();
    }
    
    /**
     * Apply environment-specific security overrides
     */
    applyEnvironmentOverrides() {
        switch (this.environment) {
            case 'production':
                this.config.session.secureCookies = true;
                this.config.network.enableHttps = true;
                this.config.audit.logLevel = 'warn';
                this.config.rateLimit.max = 50; // Stricter in production
                break;
                
            case 'staging':
                this.config.audit.logLevel = 'info';
                this.config.rateLimit.max = 200;
                break;
                
            case 'development':
                this.config.session.secureCookies = false;
                this.config.network.enableHttps = false;
                this.config.audit.logLevel = 'debug';
                this.config.rateLimit.max = 1000;
                this.config.cors.origin = ['http://localhost:3000', 'http://localhost:3001'];
                break;
                
            case 'test':
                this.config.rateLimit.enabled = false;
                this.config.audit.enabled = false;
                this.config.account.maxLoginAttempts = 100;
                break;
        }
    }
    
    /**
     * Get allowed origins based on environment
     */
    getAllowedOrigins() {
        const envOrigins = process.env.ALLOWED_ORIGINS;
        if (envOrigins) {
            return envOrigins.split(',').map(origin => origin.trim());
        }
        
        switch (this.environment) {
            case 'production':
                return ['https://nexus-ide.com', 'https://app.nexus-ide.com'];
            case 'staging':
                return ['https://staging.nexus-ide.com'];
            case 'development':
                return ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];
            default:
                return ['http://localhost:3000'];
        }
    }
    
    /**
     * Generate secure random secret
     */
    generateSecureSecret(length = 64) {
        return crypto.randomBytes(length).toString('hex');
    }
    
    /**
     * Validate security configuration
     */
    validateConfiguration() {
        const errors = [];
        
        // Validate JWT secret
        if (!this.config.jwt.secret || this.config.jwt.secret.length < 32) {
            errors.push('JWT secret must be at least 32 characters long');
        }
        
        // Validate API key secret
        if (!this.config.apiKey.secret || this.config.apiKey.secret.length < 32) {
            errors.push('API key secret must be at least 32 characters long');
        }
        
        // Validate encryption master key
        if (!this.config.encryption.masterKey || this.config.encryption.masterKey.length < 32) {
            errors.push('Encryption master key must be at least 32 characters long');
        }
        
        // Validate HTTPS in production
        if (this.environment === 'production' && !this.config.network.enableHttps) {
            errors.push('HTTPS must be enabled in production environment');
        }
        
        if (errors.length > 0) {
            throw new Error(`Security configuration validation failed:\n${errors.join('\n')}`);
        }
    }
    
    /**
     * Get configuration for specific component
     */
    get(component) {
        return this.config[component] || null;
    }
    
    /**
     * Get all configuration
     */
    getAll() {
        return { ...this.config };
    }
    
    /**
     * Update configuration (runtime)
     */
    update(component, updates) {
        if (this.config[component]) {
            this.config[component] = { ...this.config[component], ...updates };
            this.validateConfiguration();
            return true;
        }
        return false;
    }
    
    /**
     * Get security headers for Express
     */
    getSecurityHeaders() {
        return this.config.headers;
    }
    
    /**
     * Get CORS configuration for Express
     */
    getCorsConfig() {
        return this.config.cors;
    }
    
    /**
     * Get rate limit configuration
     */
    getRateLimitConfig(endpoint = null) {
        if (endpoint && this.config.rateLimit.endpoints[endpoint]) {
            return {
                ...this.config.rateLimit,
                ...this.config.rateLimit.endpoints[endpoint]
            };
        }
        return this.config.rateLimit;
    }
    
    /**
     * Check if feature is enabled
     */
    isEnabled(feature) {
        const parts = feature.split('.');
        let current = this.config;
        
        for (const part of parts) {
            if (current[part] === undefined) {
                return false;
            }
            current = current[part];
        }
        
        return current === true;
    }
    
    /**
     * Generate security report
     */
    generateSecurityReport() {
        return {
            environment: this.environment,
            timestamp: new Date().toISOString(),
            
            security_features: {
                jwt_authentication: !!this.config.jwt.secret,
                api_key_authentication: !!this.config.apiKey.secret,
                encryption_at_rest: this.config.dataProtection.encryptAtRest,
                encryption_in_transit: this.config.dataProtection.encryptInTransit,
                rate_limiting: this.config.rateLimit.enabled,
                multi_tenant_isolation: this.config.multiTenant.enabled,
                audit_logging: this.config.audit.enabled,
                two_factor_auth: this.config.account.enableTwoFactor,
                https_enforced: this.config.network.enableHttps,
                security_headers: true,
                cors_protection: this.config.cors.enabled
            },
            
            compliance_status: {
                soc2: this.config.compliance.soc2.enabled,
                iso27001: this.config.compliance.iso27001.enabled,
                gdpr: this.config.dataProtection.gdpr.enabled,
                hipaa: this.config.compliance.hipaa.enabled
            },
            
            security_score: this.calculateSecurityScore(),
            
            recommendations: this.getSecurityRecommendations()
        };
    }
    
    /**
     * Calculate security score (0-100)
     */
    calculateSecurityScore() {
        let score = 0;
        const checks = [
            { condition: !!this.config.jwt.secret, weight: 10 },
            { condition: this.config.encryption.masterKey.length >= 64, weight: 10 },
            { condition: this.config.rateLimit.enabled, weight: 8 },
            { condition: this.config.audit.enabled, weight: 8 },
            { condition: this.config.network.enableHttps, weight: 12 },
            { condition: this.config.session.secureCookies, weight: 6 },
            { condition: this.config.password.minLength >= 8, weight: 6 },
            { condition: this.config.account.enableTwoFactor, weight: 15 },
            { condition: this.config.multiTenant.enabled, weight: 8 },
            { condition: this.config.dataProtection.encryptAtRest, weight: 10 },
            { condition: this.config.cors.enabled, weight: 4 },
            { condition: this.config.compliance.soc2.enabled, weight: 3 }
        ];
        
        checks.forEach(check => {
            if (check.condition) {
                score += check.weight;
            }
        });
        
        return Math.min(score, 100);
    }
    
    /**
     * Get security recommendations
     */
    getSecurityRecommendations() {
        const recommendations = [];
        
        if (!this.config.account.enableTwoFactor) {
            recommendations.push('Enable two-factor authentication for enhanced security');
        }
        
        if (this.config.encryption.masterKey.length < 64) {
            recommendations.push('Use a longer master encryption key (64+ characters)');
        }
        
        if (this.environment === 'production' && !this.config.network.enableHttps) {
            recommendations.push('Enable HTTPS in production environment');
        }
        
        if (!this.config.audit.realTimeAlerts) {
            recommendations.push('Enable real-time security alerts');
        }
        
        if (this.config.password.minLength < 12) {
            recommendations.push('Consider increasing minimum password length to 12+ characters');
        }
        
        return recommendations;
    }
    
    /**
     * Export configuration to file
     */
    exportConfig(filePath) {
        const configData = {
            environment: this.environment,
            timestamp: new Date().toISOString(),
            config: this.config
        };
        
        fs.writeFileSync(filePath, JSON.stringify(configData, null, 2));
        return true;
    }
    
    /**
     * Import configuration from file
     */
    importConfig(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Configuration file not found: ${filePath}`);
        }
        
        const configData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.config = { ...this.config, ...configData.config };
        this.validateConfiguration();
        return true;
    }
}

// Export singleton instance
module.exports = new SecurityConfig();