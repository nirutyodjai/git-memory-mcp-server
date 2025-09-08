/**
 * Security Configuration Manager
 * Dynamic security configuration management for NEXUS IDE
 * Enterprise-grade security settings with real-time updates
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');
const AuditService = require('./auditService');
const securityConfig = require('../config/security-config');

class SecurityConfigManager extends EventEmitter {
    constructor() {
        super();
        this.configPath = path.join(__dirname, '../config/runtime-security.json');
        this.config = {};
        this.watchers = new Map();
        this.auditService = new AuditService();
        this.lastModified = null;
        this.configHistory = [];
        this.maxHistorySize = 100;
        
        this.initialize();
    }
    
    /**
     * Initialize configuration manager
     */
    async initialize() {
        try {
            await this.loadConfiguration();
            await this.setupFileWatcher();
            await this.validateConfiguration();
            
            console.log('Security Configuration Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Security Configuration Manager:', error);
            throw error;
        }
    }
    
    /**
     * Load configuration from file
     */
    async loadConfiguration() {
        try {
            // Try to load existing configuration
            try {
                const configData = await fs.readFile(this.configPath, 'utf8');
                this.config = JSON.parse(configData);
                
                const stats = await fs.stat(this.configPath);
                this.lastModified = stats.mtime;
                
            } catch (error) {
                // If file doesn't exist, create default configuration
                if (error.code === 'ENOENT') {
                    await this.createDefaultConfiguration();
                } else {
                    throw error;
                }
            }
            
            // Merge with base security config
            this.config = {
                ...securityConfig,
                ...this.config,
                lastUpdated: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Failed to load security configuration:', error);
            throw error;
        }
    }
    
    /**
     * Create default configuration
     */
    async createDefaultConfiguration() {
        const defaultConfig = {
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            
            // Authentication settings
            authentication: {
                sessionTimeout: 3600000, // 1 hour
                maxLoginAttempts: 5,
                lockoutDuration: 900000, // 15 minutes
                passwordPolicy: {
                    minLength: 12,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireNumbers: true,
                    requireSpecialChars: true,
                    preventReuse: 5
                },
                mfa: {
                    enabled: true,
                    methods: ['totp', 'sms', 'email'],
                    backupCodes: true
                }
            },
            
            // Rate limiting settings
            rateLimiting: {
                enabled: true,
                global: {
                    windowMs: 900000, // 15 minutes
                    max: 1000
                },
                api: {
                    windowMs: 900000,
                    max: 100
                },
                auth: {
                    windowMs: 900000,
                    max: 10
                }
            },
            
            // Security headers
            headers: {
                hsts: {
                    enabled: true,
                    maxAge: 31536000,
                    includeSubDomains: true,
                    preload: true
                },
                csp: {
                    enabled: true,
                    directives: {
                        'default-src': ["'self'"],
                        'script-src': ["'self'", "'unsafe-inline'"],
                        'style-src': ["'self'", "'unsafe-inline'"],
                        'img-src': ["'self'", 'data:', 'https:'],
                        'connect-src': ["'self'"],
                        'font-src': ["'self'"],
                        'object-src': ["'none'"],
                        'media-src': ["'self'"],
                        'frame-src': ["'none'"]
                    }
                },
                frameOptions: 'DENY',
                contentTypeOptions: true,
                xssProtection: true
            },
            
            // Encryption settings
            encryption: {
                algorithm: 'aes-256-gcm',
                keyRotationInterval: 2592000000, // 30 days
                saltRounds: 12
            },
            
            // Monitoring settings
            monitoring: {
                enabled: true,
                realTimeAlerts: true,
                threatDetection: {
                    enabled: true,
                    sensitivity: 'medium',
                    autoBlock: false
                },
                anomalyDetection: {
                    enabled: true,
                    learningPeriod: 604800000, // 7 days
                    threshold: 0.8
                }
            },
            
            // Compliance settings
            compliance: {
                standards: ['SOC2', 'ISO27001', 'GDPR', 'HIPAA'],
                dataRetention: {
                    auditLogs: 2592000000, // 30 days
                    securityEvents: 7776000000, // 90 days
                    userSessions: 86400000 // 1 day
                },
                encryption: {
                    atRest: true,
                    inTransit: true,
                    keyManagement: 'internal'
                }
            },
            
            // IP filtering
            ipFiltering: {
                enabled: true,
                whitelist: [],
                blacklist: [],
                geoBlocking: {
                    enabled: false,
                    blockedCountries: []
                }
            },
            
            // API security
            apiSecurity: {
                cors: {
                    enabled: true,
                    origins: ['http://localhost:3000'],
                    credentials: true
                },
                csrf: {
                    enabled: true,
                    cookieName: '_csrf',
                    headerName: 'X-CSRF-Token'
                },
                validation: {
                    enabled: true,
                    maxRequestSize: '10mb',
                    sanitizeInput: true
                }
            }
        };
        
        await this.saveConfiguration(defaultConfig);
        this.config = defaultConfig;
        
        console.log('Default security configuration created');
    }
    
    /**
     * Setup file watcher for configuration changes
     */
    async setupFileWatcher() {
        try {
            const configDir = path.dirname(this.configPath);
            
            // Ensure config directory exists
            await fs.mkdir(configDir, { recursive: true });
            
            // Watch for file changes
            const watcher = fs.watch(this.configPath, async (eventType) => {
                if (eventType === 'change') {
                    try {
                        const stats = await fs.stat(this.configPath);
                        
                        // Only reload if file was actually modified
                        if (!this.lastModified || stats.mtime > this.lastModified) {
                            await this.reloadConfiguration();
                        }
                        
                    } catch (error) {
                        console.error('Error checking config file modification:', error);
                    }
                }
            });
            
            this.watchers.set('config', watcher);
            
        } catch (error) {
            console.error('Failed to setup file watcher:', error);
        }
    }
    
    /**
     * Reload configuration from file
     */
    async reloadConfiguration() {
        try {
            const oldConfig = JSON.parse(JSON.stringify(this.config));
            
            await this.loadConfiguration();
            await this.validateConfiguration();
            
            // Add to history
            this.addToHistory(oldConfig, this.config);
            
            // Emit configuration change event
            this.emit('configurationChanged', {
                oldConfig,
                newConfig: this.config,
                timestamp: new Date()
            });
            
            // Log configuration reload
            await this.auditService.logEvent({
                type: 'SECURITY_CONFIG_RELOADED',
                changes: this.getConfigDiff(oldConfig, this.config),
                timestamp: new Date()
            });
            
            console.log('Security configuration reloaded successfully');
            
        } catch (error) {
            console.error('Failed to reload security configuration:', error);
            throw error;
        }
    }
    
    /**
     * Validate configuration
     */
    async validateConfiguration() {
        const errors = [];
        
        try {
            // Validate authentication settings
            if (!this.config.authentication) {
                errors.push('Authentication configuration is missing');
            } else {
                if (this.config.authentication.sessionTimeout < 300000) {
                    errors.push('Session timeout is too short (minimum 5 minutes)');
                }
                
                if (this.config.authentication.maxLoginAttempts < 3) {
                    errors.push('Max login attempts is too low (minimum 3)');
                }
            }
            
            // Validate rate limiting
            if (this.config.rateLimiting?.enabled) {
                if (!this.config.rateLimiting.global?.max) {
                    errors.push('Global rate limit max is not configured');
                }
            }
            
            // Validate encryption settings
            if (!this.config.encryption?.algorithm) {
                errors.push('Encryption algorithm is not configured');
            }
            
            // Validate compliance settings
            if (!this.config.compliance?.standards?.length) {
                errors.push('No compliance standards configured');
            }
            
            if (errors.length > 0) {
                throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
            }
            
            console.log('Security configuration validation passed');
            
        } catch (error) {
            console.error('Configuration validation error:', error);
            throw error;
        }
    }
    
    /**
     * Get configuration value
     */
    get(path, defaultValue = null) {
        try {
            const keys = path.split('.');
            let value = this.config;
            
            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) {
                    value = value[key];
                } else {
                    return defaultValue;
                }
            }
            
            return value;
            
        } catch (error) {
            console.error('Error getting configuration value:', error);
            return defaultValue;
        }
    }
    
    /**
     * Set configuration value
     */
    async set(path, value, userId = null) {
        try {
            const oldConfig = JSON.parse(JSON.stringify(this.config));
            const keys = path.split('.');
            let current = this.config;
            
            // Navigate to the parent object
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!current[key] || typeof current[key] !== 'object') {
                    current[key] = {};
                }
                current = current[key];
            }
            
            // Set the value
            const lastKey = keys[keys.length - 1];
            const oldValue = current[lastKey];
            current[lastKey] = value;
            
            // Update timestamp
            this.config.lastUpdated = new Date().toISOString();
            
            // Validate configuration
            await this.validateConfiguration();
            
            // Save configuration
            await this.saveConfiguration(this.config);
            
            // Add to history
            this.addToHistory(oldConfig, this.config);
            
            // Log configuration change
            await this.auditService.logEvent({
                type: 'SECURITY_CONFIG_UPDATED',
                path,
                oldValue,
                newValue: value,
                updatedBy: userId,
                timestamp: new Date()
            });
            
            // Emit change event
            this.emit('configurationChanged', {
                path,
                oldValue,
                newValue: value,
                oldConfig,
                newConfig: this.config,
                timestamp: new Date()
            });
            
            console.log(`Security configuration updated: ${path} = ${JSON.stringify(value)}`);
            
        } catch (error) {
            console.error('Error setting configuration value:', error);
            throw error;
        }
    }
    
    /**
     * Save configuration to file
     */
    async saveConfiguration(config) {
        try {
            const configData = JSON.stringify(config, null, 2);
            await fs.writeFile(this.configPath, configData, 'utf8');
            
            const stats = await fs.stat(this.configPath);
            this.lastModified = stats.mtime;
            
        } catch (error) {
            console.error('Failed to save security configuration:', error);
            throw error;
        }
    }
    
    /**
     * Get full configuration
     */
    getAll() {
        return JSON.parse(JSON.stringify(this.config));
    }
    
    /**
     * Update multiple configuration values
     */
    async updateMultiple(updates, userId = null) {
        try {
            const oldConfig = JSON.parse(JSON.stringify(this.config));
            
            // Apply all updates
            for (const [path, value] of Object.entries(updates)) {
                const keys = path.split('.');
                let current = this.config;
                
                // Navigate to the parent object
                for (let i = 0; i < keys.length - 1; i++) {
                    const key = keys[i];
                    if (!current[key] || typeof current[key] !== 'object') {
                        current[key] = {};
                    }
                    current = current[key];
                }
                
                // Set the value
                const lastKey = keys[keys.length - 1];
                current[lastKey] = value;
            }
            
            // Update timestamp
            this.config.lastUpdated = new Date().toISOString();
            
            // Validate configuration
            await this.validateConfiguration();
            
            // Save configuration
            await this.saveConfiguration(this.config);
            
            // Add to history
            this.addToHistory(oldConfig, this.config);
            
            // Log configuration changes
            await this.auditService.logEvent({
                type: 'SECURITY_CONFIG_BULK_UPDATE',
                updates,
                changes: this.getConfigDiff(oldConfig, this.config),
                updatedBy: userId,
                timestamp: new Date()
            });
            
            // Emit change event
            this.emit('configurationChanged', {
                updates,
                oldConfig,
                newConfig: this.config,
                timestamp: new Date()
            });
            
            console.log('Security configuration bulk update completed');
            
        } catch (error) {
            console.error('Error updating multiple configuration values:', error);
            throw error;
        }
    }
    
    /**
     * Reset configuration to defaults
     */
    async resetToDefaults(userId = null) {
        try {
            const oldConfig = JSON.parse(JSON.stringify(this.config));
            
            await this.createDefaultConfiguration();
            
            // Add to history
            this.addToHistory(oldConfig, this.config);
            
            // Log configuration reset
            await this.auditService.logEvent({
                type: 'SECURITY_CONFIG_RESET',
                resetBy: userId,
                timestamp: new Date()
            });
            
            // Emit change event
            this.emit('configurationChanged', {
                type: 'reset',
                oldConfig,
                newConfig: this.config,
                timestamp: new Date()
            });
            
            console.log('Security configuration reset to defaults');
            
        } catch (error) {
            console.error('Error resetting configuration:', error);
            throw error;
        }
    }
    
    /**
     * Get configuration history
     */
    getHistory(limit = 10) {
        return this.configHistory.slice(-limit);
    }
    
    /**
     * Add configuration change to history
     */
    addToHistory(oldConfig, newConfig) {
        const historyEntry = {
            timestamp: new Date(),
            changes: this.getConfigDiff(oldConfig, newConfig),
            checksum: this.generateChecksum(newConfig)
        };
        
        this.configHistory.push(historyEntry);
        
        // Limit history size
        if (this.configHistory.length > this.maxHistorySize) {
            this.configHistory = this.configHistory.slice(-this.maxHistorySize);
        }
    }
    
    /**
     * Get configuration differences
     */
    getConfigDiff(oldConfig, newConfig) {
        const changes = [];
        
        const compareObjects = (obj1, obj2, path = '') => {
            const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
            
            for (const key of keys) {
                const currentPath = path ? `${path}.${key}` : key;
                const oldValue = obj1?.[key];
                const newValue = obj2?.[key];
                
                if (oldValue !== newValue) {
                    if (typeof oldValue === 'object' && typeof newValue === 'object' && 
                        oldValue !== null && newValue !== null) {
                        compareObjects(oldValue, newValue, currentPath);
                    } else {
                        changes.push({
                            path: currentPath,
                            oldValue,
                            newValue
                        });
                    }
                }
            }
        };
        
        compareObjects(oldConfig, newConfig);
        return changes;
    }
    
    /**
     * Generate configuration checksum
     */
    generateChecksum(config) {
        const configString = JSON.stringify(config, Object.keys(config).sort());
        return crypto.createHash('sha256').update(configString).digest('hex');
    }
    
    /**
     * Verify configuration integrity
     */
    verifyIntegrity() {
        const currentChecksum = this.generateChecksum(this.config);
        const lastHistoryEntry = this.configHistory[this.configHistory.length - 1];
        
        if (lastHistoryEntry && lastHistoryEntry.checksum !== currentChecksum) {
            console.warn('Configuration integrity check failed - checksum mismatch');
            return false;
        }
        
        return true;
    }
    
    /**
     * Export configuration
     */
    async exportConfiguration(format = 'json') {
        try {
            const exportData = {
                version: this.config.version,
                exportedAt: new Date().toISOString(),
                configuration: this.config,
                checksum: this.generateChecksum(this.config)
            };
            
            switch (format.toLowerCase()) {
                case 'json':
                    return JSON.stringify(exportData, null, 2);
                    
                case 'yaml':
                    // Would need yaml library
                    throw new Error('YAML export not implemented');
                    
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
            
        } catch (error) {
            console.error('Error exporting configuration:', error);
            throw error;
        }
    }
    
    /**
     * Import configuration
     */
    async importConfiguration(data, userId = null) {
        try {
            let importData;
            
            if (typeof data === 'string') {
                importData = JSON.parse(data);
            } else {
                importData = data;
            }
            
            // Validate import data
            if (!importData.configuration) {
                throw new Error('Invalid import data - missing configuration');
            }
            
            // Verify checksum if provided
            if (importData.checksum) {
                const calculatedChecksum = this.generateChecksum(importData.configuration);
                if (calculatedChecksum !== importData.checksum) {
                    throw new Error('Configuration integrity check failed - invalid checksum');
                }
            }
            
            const oldConfig = JSON.parse(JSON.stringify(this.config));
            
            // Update configuration
            this.config = {
                ...importData.configuration,
                lastUpdated: new Date().toISOString()
            };
            
            // Validate imported configuration
            await this.validateConfiguration();
            
            // Save configuration
            await this.saveConfiguration(this.config);
            
            // Add to history
            this.addToHistory(oldConfig, this.config);
            
            // Log configuration import
            await this.auditService.logEvent({
                type: 'SECURITY_CONFIG_IMPORTED',
                importedBy: userId,
                version: importData.version,
                timestamp: new Date()
            });
            
            // Emit change event
            this.emit('configurationChanged', {
                type: 'import',
                oldConfig,
                newConfig: this.config,
                timestamp: new Date()
            });
            
            console.log('Security configuration imported successfully');
            
        } catch (error) {
            console.error('Error importing configuration:', error);
            throw error;
        }
    }
    
    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            // Close file watchers
            for (const [name, watcher] of this.watchers) {
                watcher.close();
                console.log(`Closed file watcher: ${name}`);
            }
            
            this.watchers.clear();
            this.removeAllListeners();
            
            console.log('Security Configuration Manager cleanup completed');
            
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

module.exports = SecurityConfigManager;