#!/usr/bin/env node
/**
 * Security Configuration
 * การตั้งค่าความปลอดภัยสำหรับระบบ Git Memory MCP Server
 * รวมถึง encryption keys, JWT settings, rate limiting และ security policies
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

class SecurityConfig {
    constructor() {
        this.configPath = path.join(__dirname, 'security-config.json');
        this.loadConfig();
    }
    
    /**
     * โหลดการตั้งค่าจากไฟล์
     */
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, 'utf8');
                this.config = JSON.parse(configData);
            } else {
                this.config = this.getDefaultConfig();
                this.saveConfig();
            }
        } catch (error) {
            console.warn('Failed to load security config, using defaults:', error.message);
            this.config = this.getDefaultConfig();
        }
    }
    
    /**
     * บันทึกการตั้งค่าลงไฟล์
     */
    saveConfig() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        } catch (error) {
            console.error('Failed to save security config:', error.message);
        }
    }
    
    /**
     * การตั้งค่าเริ่มต้น
     */
    getDefaultConfig() {
        return {
            // Encryption Settings
            encryption: {
                algorithm: 'aes-256-gcm',
                keyLength: 32,
                ivLength: 16,
                tagLength: 16,
                secretKey: this.generateSecretKey(),
                saltRounds: 12
            },
            
            // JWT Settings
            jwt: {
                secret: this.generateJWTSecret(),
                algorithm: 'HS256',
                expiresIn: '24h',
                refreshExpiresIn: '7d',
                issuer: 'git-memory-mcp-server',
                audience: 'mcp-clients'
            },
            
            // Rate Limiting
            rateLimit: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                maxRequests: 1000, // requests per window
                skipSuccessfulRequests: false,
                skipFailedRequests: false,
                keyGenerator: 'ip', // 'ip' | 'user' | 'custom'
                
                // Different limits for different endpoints
                endpoints: {
                    '/login': {
                        windowMs: 15 * 60 * 1000,
                        maxRequests: 5
                    },
                    '/register': {
                        windowMs: 60 * 60 * 1000,
                        maxRequests: 3
                    },
                    '/memory/set': {
                        windowMs: 60 * 1000,
                        maxRequests: 100
                    },
                    '/memory/get': {
                        windowMs: 60 * 1000,
                        maxRequests: 500
                    }
                }
            },
            
            // Session Management
            session: {
                maxSessions: 5, // per user
                sessionTimeout: 30 * 60 * 1000, // 30 minutes
                extendOnActivity: true,
                secureCookies: true,
                sameSite: 'strict'
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
                maxAttempts: 5,
                lockoutDuration: 15 * 60 * 1000 // 15 minutes
            },
            
            // CORS Settings
            cors: {
                enabled: true,
                allowedOrigins: [
                    'http://localhost:3000',
                    'http://localhost:8080',
                    'https://localhost:*'
                ],
                allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: [
                    'Content-Type',
                    'Authorization',
                    'X-Requested-With',
                    'X-Request-ID',
                    'X-Client-Version'
                ],
                credentials: true,
                maxAge: 86400 // 24 hours
            },
            
            // Security Headers
            headers: {
                contentSecurityPolicy: {
                    enabled: true,
                    directives: {
                        defaultSrc: ["'self'"],
                        scriptSrc: ["'self'", "'unsafe-inline'"],
                        styleSrc: ["'self'", "'unsafe-inline'"],
                        imgSrc: ["'self'", 'data:', 'https:'],
                        connectSrc: ["'self'"],
                        fontSrc: ["'self'"],
                        objectSrc: ["'none'"],
                        mediaSrc: ["'self'"],
                        frameSrc: ["'none'"]
                    }
                },
                hsts: {
                    enabled: true,
                    maxAge: 31536000,
                    includeSubDomains: true,
                    preload: true
                },
                xssProtection: {
                    enabled: true,
                    mode: 'block'
                },
                noSniff: true,
                frameOptions: 'DENY',
                referrerPolicy: 'strict-origin-when-cross-origin'
            },
            
            // Request Validation
            validation: {
                maxRequestSize: 10 * 1024 * 1024, // 10MB
                maxHeaderSize: 8192, // 8KB
                maxUrlLength: 2048,
                maxQueryParams: 100,
                allowedContentTypes: [
                    'application/json',
                    'application/x-www-form-urlencoded',
                    'multipart/form-data',
                    'text/plain'
                ]
            },
            
            // Logging & Monitoring
            logging: {
                enabled: true,
                level: 'info', // 'debug' | 'info' | 'warn' | 'error'
                logRequests: true,
                logResponses: false,
                logSecurityEvents: true,
                logFailedAuth: true,
                maxLogSize: 100 * 1024 * 1024, // 100MB
                logRotation: true,
                retentionDays: 30
            },
            
            // Intrusion Detection
            intrusion: {
                enabled: true,
                maxFailedAttempts: 10,
                blockDuration: 60 * 60 * 1000, // 1 hour
                monitorPatterns: [
                    'sql_injection',
                    'xss_attack',
                    'path_traversal',
                    'command_injection',
                    'brute_force'
                ],
                alertThreshold: 5,
                autoBlock: true
            },
            
            // API Security
            api: {
                versioning: true,
                deprecationWarnings: true,
                requestIdRequired: false,
                clientVersionCheck: false,
                supportedVersions: ['v1', 'v2'],
                defaultVersion: 'v1'
            },
            
            // File Upload Security
            upload: {
                enabled: false,
                maxFileSize: 5 * 1024 * 1024, // 5MB
                allowedTypes: [
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                    'text/plain',
                    'application/json'
                ],
                scanForMalware: false,
                quarantinePath: './quarantine'
            },
            
            // Backup & Recovery
            backup: {
                enabled: true,
                interval: 24 * 60 * 60 * 1000, // 24 hours
                retention: 7, // days
                encryptBackups: true,
                backupPath: './backups/security'
            },
            
            // Environment Settings
            environment: {
                production: process.env.NODE_ENV === 'production',
                debug: process.env.DEBUG === 'true',
                testMode: process.env.TEST_MODE === 'true'
            }
        };
    }
    
    /**
     * สร้าง Secret Key สำหรับ encryption
     */
    generateSecretKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    /**
     * สร้าง JWT Secret
     */
    generateJWTSecret() {
        return crypto.randomBytes(64).toString('hex');
    }
    
    /**
     * ดึงการตั้งค่า
     */
    get(key) {
        const keys = key.split('.');
        let value = this.config;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return undefined;
            }
        }
        
        return value;
    }
    
    /**
     * ตั้งค่า
     */
    set(key, value) {
        const keys = key.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in current) || typeof current[k] !== 'object') {
                current[k] = {};
            }
            current = current[k];
        }
        
        current[keys[keys.length - 1]] = value;
        this.saveConfig();
    }
    
    /**
     * ตรวจสอบว่าอยู่ใน production mode หรือไม่
     */
    isProduction() {
        return this.get('environment.production');
    }
    
    /**
     * ตรวจสอบว่าเปิด debug mode หรือไม่
     */
    isDebug() {
        return this.get('environment.debug');
    }
    
    /**
     * ตรวจสอบว่าอยู่ใน test mode หรือไม่
     */
    isTestMode() {
        return this.get('environment.testMode');
    }
    
    /**
     * ดึงการตั้งค่า encryption
     */
    getEncryptionConfig() {
        return this.get('encryption');
    }
    
    /**
     * ดึงการตั้งค่า JWT
     */
    getJWTConfig() {
        return this.get('jwt');
    }
    
    /**
     * ดึงการตั้งค่า rate limiting
     */
    getRateLimitConfig() {
        return this.get('rateLimit');
    }
    
    /**
     * ดึงการตั้งค่า password policy
     */
    getPasswordPolicy() {
        return this.get('password');
    }
    
    /**
     * ดึงการตั้งค่า CORS
     */
    getCORSConfig() {
        return this.get('cors');
    }
    
    /**
     * ดึงการตั้งค่า security headers
     */
    getSecurityHeaders() {
        return this.get('headers');
    }
    
    /**
     * ดึงการตั้งค่า logging
     */
    getLoggingConfig() {
        return this.get('logging');
    }
    
    /**
     * ดึงการตั้งค่า intrusion detection
     */
    getIntrusionConfig() {
        return this.get('intrusion');
    }
    
    /**
     * อัปเดต secret keys
     */
    rotateSecrets() {
        this.set('encryption.secretKey', this.generateSecretKey());
        this.set('jwt.secret', this.generateJWTSecret());
        console.log('🔄 Security secrets rotated successfully');
    }
    
    /**
     * ตรวจสอบการตั้งค่าความปลอดภัย
     */
    validateConfig() {
        const issues = [];
        
        // ตรวจสอบ JWT secret
        const jwtSecret = this.get('jwt.secret');
        if (!jwtSecret || jwtSecret.length < 32) {
            issues.push('JWT secret is too short (minimum 32 characters)');
        }
        
        // ตรวจสอบ encryption key
        const encryptionKey = this.get('encryption.secretKey');
        if (!encryptionKey || encryptionKey.length < 32) {
            issues.push('Encryption key is too short (minimum 32 characters)');
        }
        
        // ตรวจสอบ password policy
        const passwordPolicy = this.getPasswordPolicy();
        if (passwordPolicy.minLength < 8) {
            issues.push('Password minimum length should be at least 8 characters');
        }
        
        // ตรวจสอบ rate limiting
        const rateLimit = this.getRateLimitConfig();
        if (rateLimit.maxRequests > 10000) {
            issues.push('Rate limit might be too high for security');
        }
        
        // ตรวจสอบ production settings
        if (this.isProduction()) {
            if (this.isDebug()) {
                issues.push('Debug mode should be disabled in production');
            }
            
            const cors = this.getCORSConfig();
            if (cors.allowedOrigins.includes('*')) {
                issues.push('CORS should not allow all origins in production');
            }
        }
        
        return {
            valid: issues.length === 0,
            issues
        };
    }
    
    /**
     * สร้างรายงานการตั้งค่าความปลอดภัย
     */
    getSecurityReport() {
        const validation = this.validateConfig();
        
        return {
            timestamp: new Date().toISOString(),
            environment: {
                production: this.isProduction(),
                debug: this.isDebug(),
                testMode: this.isTestMode()
            },
            features: {
                encryption: !!this.get('encryption.secretKey'),
                jwt: !!this.get('jwt.secret'),
                rateLimit: this.get('rateLimit.enabled') !== false,
                cors: this.get('cors.enabled'),
                securityHeaders: this.get('headers.hsts.enabled'),
                intrusion: this.get('intrusion.enabled'),
                logging: this.get('logging.enabled')
            },
            validation,
            recommendations: this.getSecurityRecommendations()
        };
    }
    
    /**
     * ข้อแนะนำด้านความปลอดภัย
     */
    getSecurityRecommendations() {
        const recommendations = [];
        
        if (!this.isProduction()) {
            recommendations.push('Consider enabling production mode for better security');
        }
        
        if (!this.get('headers.hsts.enabled')) {
            recommendations.push('Enable HSTS headers for HTTPS enforcement');
        }
        
        if (!this.get('intrusion.enabled')) {
            recommendations.push('Enable intrusion detection for better monitoring');
        }
        
        if (this.get('logging.level') === 'debug') {
            recommendations.push('Consider changing log level from debug in production');
        }
        
        const passwordPolicy = this.getPasswordPolicy();
        if (passwordPolicy.minLength < 12) {
            recommendations.push('Consider increasing minimum password length to 12+ characters');
        }
        
        return recommendations;
    }
    
    /**
     * Export configuration (ซ่อนข้อมูลลับ)
     */
    exportConfig(includeSensitive = false) {
        const config = JSON.parse(JSON.stringify(this.config));
        
        if (!includeSensitive) {
            // ซ่อนข้อมูลลับ
            if (config.encryption) {
                config.encryption.secretKey = '[HIDDEN]';
            }
            if (config.jwt) {
                config.jwt.secret = '[HIDDEN]';
            }
        }
        
        return config;
    }
    
    /**
     * Import configuration
     */
    importConfig(newConfig, merge = true) {
        if (merge) {
            this.config = { ...this.config, ...newConfig };
        } else {
            this.config = newConfig;
        }
        
        this.saveConfig();
    }
    
    /**
     * Reset to default configuration
     */
    resetToDefaults() {
        this.config = this.getDefaultConfig();
        this.saveConfig();
        console.log('🔄 Security configuration reset to defaults');
    }
}

// Singleton instance
let instance = null;

/**
 * Get security config instance
 */
function getSecurityConfig() {
    if (!instance) {
        instance = new SecurityConfig();
    }
    return instance;
}

/**
 * Create new security config instance
 */
function createSecurityConfig(configPath) {
    return new SecurityConfig(configPath);
}

module.exports = {
    SecurityConfig,
    getSecurityConfig,
    createSecurityConfig
};