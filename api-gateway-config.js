/**
 * Git Memory MCP Server - API Gateway Configuration Manager
 * ระบบจัดการการกำหนดค่า API Gateway แบบยืดหยุ่นและปรับแต่งได้
 * 
 * Features:
 * - Dynamic configuration loading
 * - Environment-based configuration
 * - Configuration validation
 * - Hot reloading
 * - Configuration templates
 * - Security configuration
 * - Performance tuning
 * - Multi-environment support
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const chokidar = require('chokidar');
const Joi = require('joi');
const yaml = require('js-yaml');
const crypto = require('crypto');

class APIGatewayConfig extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            configDir: options.configDir || path.join(__dirname, 'config'),
            environment: options.environment || process.env.NODE_ENV || 'development',
            watchConfig: options.watchConfig !== false,
            validateConfig: options.validateConfig !== false,
            encryptSecrets: options.encryptSecrets !== false,
            secretKey: options.secretKey || process.env.CONFIG_SECRET_KEY || 'default-secret-key',
            ...options
        };
        
        this.config = {};
        this.configFiles = new Map();
        this.watchers = new Map();
        this.templates = new Map();
        
        // Configuration schema
        this.schema = this.createConfigSchema();
        
        this.init();
    }
    
    /**
     * Initialize configuration manager
     */
    async init() {
        console.log('⚙️ Initializing API Gateway Configuration...');
        
        try {
            // Ensure config directory exists
            if (!fs.existsSync(this.options.configDir)) {
                fs.mkdirSync(this.options.configDir, { recursive: true });
            }
            
            // Load configuration templates
            await this.loadTemplates();
            
            // Load configuration
            await this.loadConfiguration();
            
            // Setup file watching
            if (this.options.watchConfig) {
                this.setupFileWatching();
            }
            
            console.log('✅ API Gateway Configuration initialized');
            this.emit('initialized', this.config);
            
        } catch (error) {
            console.error('❌ Failed to initialize configuration:', error.message);
            throw error;
        }
    }
    
    /**
     * Create configuration schema
     */
    createConfigSchema() {
        return Joi.object({
            // Server configuration
            server: Joi.object({
                port: Joi.number().port().default(8080),
                httpsPort: Joi.number().port().default(8443),
                host: Joi.string().default('0.0.0.0'),
                maxConnections: Joi.number().positive().default(1000),
                keepAliveTimeout: Joi.number().positive().default(5000),
                headersTimeout: Joi.number().positive().default(60000)
            }).default(),
            
            // SSL configuration
            ssl: Joi.object({
                enabled: Joi.boolean().default(false),
                cert: Joi.string().when('enabled', { is: true, then: Joi.required() }),
                key: Joi.string().when('enabled', { is: true, then: Joi.required() }),
                ca: Joi.string(),
                passphrase: Joi.string(),
                ciphers: Joi.string(),
                secureProtocol: Joi.string()
            }).default(),
            
            // Load balancing configuration
            loadBalancing: Joi.object({
                algorithm: Joi.string().valid('round-robin', 'least-connections', 'weighted', 'ip-hash', 'health-based').default('round-robin'),
                healthCheckInterval: Joi.number().positive().default(30000),
                healthCheckTimeout: Joi.number().positive().default(5000),
                healthCheckPath: Joi.string().default('/health'),
                maxRetries: Joi.number().min(0).default(3),
                retryDelay: Joi.number().positive().default(1000),
                retryBackoff: Joi.string().valid('linear', 'exponential').default('exponential')
            }).default(),
            
            // Rate limiting configuration
            rateLimit: Joi.object({
                enabled: Joi.boolean().default(true),
                windowMs: Joi.number().positive().default(900000), // 15 minutes
                max: Joi.number().positive().default(1000),
                skipSuccessfulRequests: Joi.boolean().default(false),
                skipFailedRequests: Joi.boolean().default(false),
                keyGenerator: Joi.string().valid('ip', 'user', 'custom').default('ip'),
                store: Joi.string().valid('memory', 'redis').default('memory'),
                message: Joi.object({
                    error: Joi.string().default('Too many requests'),
                    retryAfter: Joi.number()
                }).default()
            }).default(),
            
            // Circuit breaker configuration
            circuitBreaker: Joi.object({
                enabled: Joi.boolean().default(true),
                failureThreshold: Joi.number().positive().default(5),
                resetTimeout: Joi.number().positive().default(60000),
                monitoringPeriod: Joi.number().positive().default(10000),
                volumeThreshold: Joi.number().positive().default(10),
                errorThresholdPercentage: Joi.number().min(0).max(100).default(50)
            }).default(),
            
            // Caching configuration
            cache: Joi.object({
                enabled: Joi.boolean().default(true),
                ttl: Joi.number().positive().default(300), // 5 minutes
                maxSize: Joi.number().positive().default(1000),
                strategy: Joi.string().valid('lru', 'lfu', 'fifo').default('lru'),
                redis: Joi.object({
                    enabled: Joi.boolean().default(false),
                    host: Joi.string().default('localhost'),
                    port: Joi.number().port().default(6379),
                    password: Joi.string(),
                    db: Joi.number().min(0).default(0),
                    keyPrefix: Joi.string().default('gateway:'),
                    maxRetriesPerRequest: Joi.number().min(0).default(3)
                }).default()
            }).default(),
            
            // Authentication configuration
            auth: Joi.object({
                enabled: Joi.boolean().default(true),
                strategy: Joi.string().valid('jwt', 'oauth2', 'apikey', 'basic').default('jwt'),
                jwtSecret: Joi.string().when('strategy', { is: 'jwt', then: Joi.required() }),
                tokenExpiry: Joi.string().default('24h'),
                refreshTokenExpiry: Joi.string().default('7d'),
                issuer: Joi.string(),
                audience: Joi.string(),
                algorithms: Joi.array().items(Joi.string()).default(['HS256']),
                publicKey: Joi.string(),
                privateKey: Joi.string()
            }).default(),
            
            // Authorization configuration
            authorization: Joi.object({
                enabled: Joi.boolean().default(true),
                strategy: Joi.string().valid('rbac', 'abac', 'acl').default('rbac'),
                roles: Joi.array().items(Joi.string()).default(['admin', 'user', 'guest']),
                permissions: Joi.array().items(Joi.string()).default(['read', 'write', 'delete']),
                defaultRole: Joi.string().default('guest')
            }).default(),
            
            // Compression configuration
            compression: Joi.object({
                enabled: Joi.boolean().default(true),
                threshold: Joi.number().positive().default(1024),
                level: Joi.number().min(-1).max(9).default(6),
                chunkSize: Joi.number().positive().default(16384),
                windowBits: Joi.number().min(8).max(15).default(15),
                memLevel: Joi.number().min(1).max(9).default(8)
            }).default(),
            
            // CORS configuration
            cors: Joi.object({
                enabled: Joi.boolean().default(true),
                origin: Joi.alternatives().try(
                    Joi.string(),
                    Joi.array().items(Joi.string()),
                    Joi.boolean()
                ).default('*'),
                methods: Joi.array().items(Joi.string()).default(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
                allowedHeaders: Joi.array().items(Joi.string()).default(['Content-Type', 'Authorization']),
                exposedHeaders: Joi.array().items(Joi.string()).default([]),
                credentials: Joi.boolean().default(false),
                maxAge: Joi.number().positive().default(86400)
            }).default(),
            
            // Monitoring configuration
            monitoring: Joi.object({
                enabled: Joi.boolean().default(true),
                metricsPath: Joi.string().default('/metrics'),
                healthPath: Joi.string().default('/health'),
                statusPath: Joi.string().default('/status'),
                collectDefaultMetrics: Joi.boolean().default(true),
                metricsInterval: Joi.number().positive().default(10000),
                histogramBuckets: Joi.array().items(Joi.number()).default([0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10])
            }).default(),
            
            // WebSocket configuration
            websocket: Joi.object({
                enabled: Joi.boolean().default(true),
                path: Joi.string().default('/ws'),
                heartbeatInterval: Joi.number().positive().default(30000),
                maxConnections: Joi.number().positive().default(1000),
                compression: Joi.boolean().default(true),
                perMessageDeflate: Joi.boolean().default(true)
            }).default(),
            
            // Upstream servers configuration
            upstreams: Joi.array().items(
                Joi.object({
                    id: Joi.string().required(),
                    name: Joi.string().required(),
                    url: Joi.string().uri().required(),
                    weight: Joi.number().positive().default(1),
                    category: Joi.string().default('default'),
                    timeout: Joi.number().positive().default(30000),
                    maxConnections: Joi.number().positive().default(100),
                    metadata: Joi.object().default({})
                })
            ).default([]),
            
            // Service discovery configuration
            serviceDiscovery: Joi.object({
                enabled: Joi.boolean().default(false),
                provider: Joi.string().valid('consul', 'etcd', 'kubernetes', 'dns').default('consul'),
                consulUrl: Joi.string().uri(),
                refreshInterval: Joi.number().positive().default(30000),
                serviceName: Joi.string().default('mcp-server'),
                tags: Joi.array().items(Joi.string()).default([]),
                healthCheck: Joi.object({
                    enabled: Joi.boolean().default(true),
                    interval: Joi.string().default('10s'),
                    timeout: Joi.string().default('3s')
                }).default()
            }).default(),
            
            // Logging configuration
            logging: Joi.object({
                level: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
                format: Joi.string().valid('json', 'text').default('text'),
                destination: Joi.string().valid('console', 'file', 'both').default('console'),
                file: Joi.object({
                    path: Joi.string().default('./logs/gateway.log'),
                    maxSize: Joi.string().default('10MB'),
                    maxFiles: Joi.number().positive().default(5),
                    compress: Joi.boolean().default(true)
                }).default(),
                requestLogging: Joi.boolean().default(true),
                errorLogging: Joi.boolean().default(true)
            }).default(),
            
            // Security configuration
            security: Joi.object({
                helmet: Joi.object({
                    enabled: Joi.boolean().default(true),
                    contentSecurityPolicy: Joi.boolean().default(true),
                    hsts: Joi.boolean().default(true),
                    noSniff: Joi.boolean().default(true),
                    xssFilter: Joi.boolean().default(true)
                }).default(),
                rateLimitByIP: Joi.boolean().default(true),
                rateLimitByUser: Joi.boolean().default(true),
                blacklist: Joi.array().items(Joi.string()).default([]),
                whitelist: Joi.array().items(Joi.string()).default([]),
                maxRequestSize: Joi.string().default('10mb')
            }).default()
        });
    }
    
    /**
     * Load configuration templates
     */
    async loadTemplates() {
        const templatesDir = path.join(this.options.configDir, 'templates');
        
        if (!fs.existsSync(templatesDir)) {
            fs.mkdirSync(templatesDir, { recursive: true });
            await this.createDefaultTemplates();
        }
        
        const templateFiles = fs.readdirSync(templatesDir)
            .filter(file => file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml'));
        
        for (const file of templateFiles) {
            const templatePath = path.join(templatesDir, file);
            const templateName = path.basename(file, path.extname(file));
            
            try {
                const content = fs.readFileSync(templatePath, 'utf8');
                let template;
                
                if (file.endsWith('.json')) {
                    template = JSON.parse(content);
                } else {
                    template = yaml.load(content);
                }
                
                this.templates.set(templateName, template);
                console.log(`📄 Loaded template: ${templateName}`);
                
            } catch (error) {
                console.error(`Failed to load template ${file}:`, error.message);
            }
        }
    }
    
    /**
     * Create default configuration templates
     */
    async createDefaultTemplates() {
        const templates = {
            'development': {
                server: {
                    port: 8080,
                    host: '0.0.0.0'
                },
                ssl: {
                    enabled: false
                },
                auth: {
                    enabled: false
                },
                cache: {
                    redis: {
                        enabled: false
                    }
                },
                logging: {
                    level: 'debug',
                    destination: 'console'
                }
            },
            'production': {
                server: {
                    port: 80,
                    httpsPort: 443,
                    host: '0.0.0.0'
                },
                ssl: {
                    enabled: true
                },
                auth: {
                    enabled: true
                },
                cache: {
                    redis: {
                        enabled: true
                    }
                },
                logging: {
                    level: 'info',
                    destination: 'both'
                },
                monitoring: {
                    enabled: true
                }
            },
            'testing': {
                server: {
                    port: 8081
                },
                auth: {
                    enabled: false
                },
                logging: {
                    level: 'warn'
                }
            }
        };
        
        const templatesDir = path.join(this.options.configDir, 'templates');
        
        for (const [name, template] of Object.entries(templates)) {
            const templatePath = path.join(templatesDir, `${name}.json`);
            fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
            console.log(`📄 Created template: ${name}`);
        }
    }
    
    /**
     * Load configuration from files
     */
    async loadConfiguration() {
        console.log(`📖 Loading configuration for environment: ${this.options.environment}`);
        
        // Start with default configuration
        this.config = {};
        
        // Load base configuration
        await this.loadConfigFile('default');
        
        // Load environment-specific configuration
        if (this.options.environment !== 'default') {
            await this.loadConfigFile(this.options.environment);
        }
        
        // Load local configuration (overrides)
        await this.loadConfigFile('local');
        
        // Apply environment variables
        this.applyEnvironmentVariables();
        
        // Decrypt secrets
        if (this.options.encryptSecrets) {
            this.decryptSecrets();
        }
        
        // Validate configuration
        if (this.options.validateConfig) {
            this.validateConfiguration();
        }
        
        console.log('✅ Configuration loaded successfully');
    }
    
    /**
     * Load single configuration file
     */
    async loadConfigFile(name) {
        const configPath = this.findConfigFile(name);
        
        if (!configPath) {
            if (name === 'default') {
                // Create default configuration
                await this.createDefaultConfig();
                return this.loadConfigFile(name);
            }
            return;
        }
        
        try {
            const content = fs.readFileSync(configPath, 'utf8');
            let fileConfig;
            
            if (configPath.endsWith('.json')) {
                fileConfig = JSON.parse(content);
            } else {
                fileConfig = yaml.load(content);
            }
            
            // Merge with existing configuration
            this.config = this.mergeConfig(this.config, fileConfig);
            
            // Track file for watching
            this.configFiles.set(name, {
                path: configPath,
                lastModified: fs.statSync(configPath).mtime
            });
            
            console.log(`📖 Loaded config file: ${path.basename(configPath)}`);
            
        } catch (error) {
            console.error(`Failed to load config file ${configPath}:`, error.message);
        }
    }
    
    /**
     * Find configuration file
     */
    findConfigFile(name) {
        const extensions = ['.json', '.yaml', '.yml'];
        
        for (const ext of extensions) {
            const configPath = path.join(this.options.configDir, `${name}${ext}`);
            if (fs.existsSync(configPath)) {
                return configPath;
            }
        }
        
        return null;
    }
    
    /**
     * Create default configuration file
     */
    async createDefaultConfig() {
        const defaultConfig = {
            server: {
                port: 8080,
                host: '0.0.0.0'
            },
            loadBalancing: {
                algorithm: 'round-robin'
            },
            auth: {
                enabled: true,
                jwtSecret: 'your-secret-key-here'
            },
            upstreams: []
        };
        
        const configPath = path.join(this.options.configDir, 'default.json');
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        
        console.log('📄 Created default configuration file');
    }
    
    /**
     * Merge configuration objects
     */
    mergeConfig(target, source) {
        const result = { ...target };
        
        for (const [key, value] of Object.entries(source)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                result[key] = this.mergeConfig(result[key] || {}, value);
            } else {
                result[key] = value;
            }
        }
        
        return result;
    }
    
    /**
     * Apply environment variables
     */
    applyEnvironmentVariables() {
        const envMappings = {
            'GATEWAY_PORT': 'server.port',
            'GATEWAY_HOST': 'server.host',
            'GATEWAY_HTTPS_PORT': 'server.httpsPort',
            'SSL_ENABLED': 'ssl.enabled',
            'SSL_CERT': 'ssl.cert',
            'SSL_KEY': 'ssl.key',
            'JWT_SECRET': 'auth.jwtSecret',
            'AUTH_ENABLED': 'auth.enabled',
            'REDIS_HOST': 'cache.redis.host',
            'REDIS_PORT': 'cache.redis.port',
            'REDIS_PASSWORD': 'cache.redis.password',
            'LOAD_BALANCING_ALGORITHM': 'loadBalancing.algorithm',
            'RATE_LIMIT_MAX': 'rateLimit.max',
            'LOG_LEVEL': 'logging.level'
        };
        
        for (const [envVar, configPath] of Object.entries(envMappings)) {
            const envValue = process.env[envVar];
            
            if (envValue !== undefined) {
                this.setConfigValue(configPath, this.parseEnvValue(envValue));
            }
        }
    }
    
    /**
     * Parse environment variable value
     */
    parseEnvValue(value) {
        // Try to parse as JSON first
        try {
            return JSON.parse(value);
        } catch {
            // Not JSON, check for boolean
            if (value.toLowerCase() === 'true') return true;
            if (value.toLowerCase() === 'false') return false;
            
            // Check for number
            const num = Number(value);
            if (!isNaN(num)) return num;
            
            // Return as string
            return value;
        }
    }
    
    /**
     * Set configuration value by path
     */
    setConfigValue(path, value) {
        const keys = path.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    }
    
    /**
     * Decrypt secrets in configuration
     */
    decryptSecrets() {
        const secretPaths = [
            'auth.jwtSecret',
            'ssl.passphrase',
            'cache.redis.password'
        ];
        
        for (const secretPath of secretPaths) {
            const encryptedValue = this.getConfigValue(secretPath);
            
            if (encryptedValue && typeof encryptedValue === 'string' && encryptedValue.startsWith('encrypted:')) {
                try {
                    const encrypted = encryptedValue.substring(10);
                    const decrypted = this.decrypt(encrypted);
                    this.setConfigValue(secretPath, decrypted);
                } catch (error) {
                    console.error(`Failed to decrypt secret at ${secretPath}:`, error.message);
                }
            }
        }
    }
    
    /**
     * Get configuration value by path
     */
    getConfigValue(path) {
        const keys = path.split('.');
        let current = this.config;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return undefined;
            }
        }
        
        return current;
    }
    
    /**
     * Encrypt secret value
     */
    encrypt(text) {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(this.options.secretKey, 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipher(algorithm, key);
        cipher.setAAD(Buffer.from('gateway-config'));
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }
    
    /**
     * Decrypt secret value
     */
    decrypt(encryptedText) {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(this.options.secretKey, 'salt', 32);
        
        const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        
        const decipher = crypto.createDecipher(algorithm, key);
        decipher.setAAD(Buffer.from('gateway-config'));
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }
    
    /**
     * Validate configuration
     */
    validateConfiguration() {
        try {
            const { error, value } = this.schema.validate(this.config, {
                allowUnknown: true,
                stripUnknown: false
            });
            
            if (error) {
                throw new Error(`Configuration validation failed: ${error.message}`);
            }
            
            this.config = value;
            console.log('✅ Configuration validation passed');
            
        } catch (error) {
            console.error('❌ Configuration validation failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Setup file watching for hot reloading
     */
    setupFileWatching() {
        console.log('👁️ Setting up configuration file watching...');
        
        const watcher = chokidar.watch(this.options.configDir, {
            ignored: /node_modules/,
            persistent: true,
            ignoreInitial: true
        });
        
        watcher.on('change', async (filePath) => {
            console.log(`📝 Configuration file changed: ${filePath}`);
            
            try {
                await this.reloadConfiguration();
                this.emit('configChanged', this.config);
            } catch (error) {
                console.error('Failed to reload configuration:', error.message);
                this.emit('configError', error);
            }
        });
        
        watcher.on('add', async (filePath) => {
            if (this.isConfigFile(filePath)) {
                console.log(`📄 New configuration file added: ${filePath}`);
                
                try {
                    await this.reloadConfiguration();
                    this.emit('configChanged', this.config);
                } catch (error) {
                    console.error('Failed to reload configuration:', error.message);
                    this.emit('configError', error);
                }
            }
        });
        
        this.watchers.set('config', watcher);
    }
    
    /**
     * Check if file is a configuration file
     */
    isConfigFile(filePath) {
        const ext = path.extname(filePath);
        return ['.json', '.yaml', '.yml'].includes(ext);
    }
    
    /**
     * Reload configuration
     */
    async reloadConfiguration() {
        console.log('🔄 Reloading configuration...');
        
        const oldConfig = { ...this.config };
        
        try {
            await this.loadConfiguration();
            console.log('✅ Configuration reloaded successfully');
            
            // Emit change event with old and new config
            this.emit('configReloaded', {
                oldConfig,
                newConfig: this.config
            });
            
        } catch (error) {
            // Restore old configuration on error
            this.config = oldConfig;
            throw error;
        }
    }
    
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    
    /**
     * Get configuration for specific section
     */
    getSection(section) {
        return this.config[section] ? { ...this.config[section] } : {};
    }
    
    /**
     * Update configuration section
     */
    updateSection(section, updates) {
        if (!this.config[section]) {
            this.config[section] = {};
        }
        
        this.config[section] = this.mergeConfig(this.config[section], updates);
        
        // Validate updated configuration
        if (this.options.validateConfig) {
            this.validateConfiguration();
        }
        
        this.emit('sectionUpdated', { section, updates });
    }
    
    /**
     * Save configuration to file
     */
    async saveConfig(filename = 'runtime') {
        const configPath = path.join(this.options.configDir, `${filename}.json`);
        
        try {
            fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
            console.log(`💾 Configuration saved to: ${configPath}`);
            
        } catch (error) {
            console.error('Failed to save configuration:', error.message);
            throw error;
        }
    }
    
    /**
     * Export configuration as different formats
     */
    exportConfig(format = 'json') {
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(this.config, null, 2);
            case 'yaml':
            case 'yml':
                return yaml.dump(this.config);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    
    /**
     * Get configuration summary
     */
    getSummary() {
        return {
            environment: this.options.environment,
            configFiles: Array.from(this.configFiles.keys()),
            templates: Array.from(this.templates.keys()),
            sections: Object.keys(this.config),
            validation: this.options.validateConfig,
            watching: this.options.watchConfig,
            encryption: this.options.encryptSecrets
        };
    }
    
    /**
     * Stop configuration manager
     */
    async stop() {
        console.log('🛑 Stopping configuration manager...');
        
        // Close file watchers
        for (const [name, watcher] of this.watchers) {
            await watcher.close();
            console.log(`👁️ Closed watcher: ${name}`);
        }
        
        this.watchers.clear();
        
        console.log('✅ Configuration manager stopped');
        this.emit('stopped');
    }
}

// Export class
module.exports = APIGatewayConfig;

// CLI interface
if (require.main === module) {
    const configManager = new APIGatewayConfig({
        environment: process.argv[2] || 'development',
        configDir: process.argv[3] || './config'
    });
    
    // Event listeners
    configManager.on('initialized', (config) => {
        console.log('🎉 Configuration manager initialized');
        console.log('📋 Configuration summary:', configManager.getSummary());
    });
    
    configManager.on('configChanged', (config) => {
        console.log('🔄 Configuration changed');
    });
    
    configManager.on('configError', (error) => {
        console.error('❌ Configuration error:', error.message);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down...');
        await configManager.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down...');
        await configManager.stop();
        process.exit(0);
    });
}