/**
 * NEXUS IDE Security Dashboard - Configuration
 * Centralized configuration management for security dashboard
 */

const path = require('path');
const os = require('os');

/**
 * Environment configuration
 */
const ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = ENV === 'production';
const IS_DEVELOPMENT = ENV === 'development';

/**
 * Server configuration
 */
const SERVER_CONFIG = {
    // Basic server settings
    host: process.env.DASHBOARD_HOST || '0.0.0.0',
    port: parseInt(process.env.DASHBOARD_PORT) || 8443,
    
    // SSL/TLS configuration
    ssl: {
        enabled: process.env.SSL_ENABLED === 'true' || IS_PRODUCTION,
        keyPath: process.env.SSL_KEY_PATH || path.join(__dirname, '../certs/server.key'),
        certPath: process.env.SSL_CERT_PATH || path.join(__dirname, '../certs/server.crt'),
        caPath: process.env.SSL_CA_PATH || null,
        passphrase: process.env.SSL_PASSPHRASE || null
    },
    
    // CORS configuration
    cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
            'http://localhost:3000',
            'http://localhost:8080',
            'https://localhost:8443'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    
    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: IS_PRODUCTION ? 100 : 1000, // requests per window
        message: 'Too many requests from this IP',
        standardHeaders: true,
        legacyHeaders: false
    },
    
    // Session configuration
    session: {
        secret: process.env.SESSION_SECRET || 'nexus-security-dashboard-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: IS_PRODUCTION,
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        },
        name: 'nexus.sid'
    },
    
    // Static files
    static: {
        path: path.join(__dirname, '../public'),
        options: {
            maxAge: IS_PRODUCTION ? '1d' : '0',
            etag: true,
            lastModified: true
        }
    }
};

/**
 * Database configuration
 */
const DATABASE_CONFIG = {
    // Primary database (PostgreSQL)
    primary: {
        type: 'postgresql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'nexus_security',
        username: process.env.DB_USER || 'nexus_user',
        password: process.env.DB_PASSWORD || 'nexus_password',
        ssl: IS_PRODUCTION ? { rejectUnauthorized: false } : false,
        pool: {
            min: 2,
            max: 20,
            idle: 10000,
            acquire: 30000
        }
    },
    
    // Redis for caching and sessions
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || null,
        db: parseInt(process.env.REDIS_DB) || 0,
        keyPrefix: 'nexus:dashboard:',
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
    },
    
    // InfluxDB for time-series data
    influxdb: {
        url: process.env.INFLUXDB_URL || 'http://localhost:8086',
        token: process.env.INFLUXDB_TOKEN || 'nexus-influxdb-token',
        org: process.env.INFLUXDB_ORG || 'nexus',
        bucket: process.env.INFLUXDB_BUCKET || 'security_metrics'
    }
};

/**
 * Authentication configuration
 */
const AUTH_CONFIG = {
    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'nexus-jwt-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'nexus-security-dashboard',
        audience: 'nexus-users'
    },
    
    // OAuth providers
    oauth: {
        google: {
            enabled: process.env.GOOGLE_OAUTH_ENABLED === 'true',
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
        },
        github: {
            enabled: process.env.GITHUB_OAUTH_ENABLED === 'true',
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.GITHUB_CALLBACK_URL || '/auth/github/callback'
        },
        microsoft: {
            enabled: process.env.MICROSOFT_OAUTH_ENABLED === 'true',
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            callbackURL: process.env.MICROSOFT_CALLBACK_URL || '/auth/microsoft/callback'
        }
    },
    
    // LDAP configuration
    ldap: {
        enabled: process.env.LDAP_ENABLED === 'true',
        url: process.env.LDAP_URL || 'ldap://localhost:389',
        bindDN: process.env.LDAP_BIND_DN,
        bindCredentials: process.env.LDAP_BIND_PASSWORD,
        searchBase: process.env.LDAP_SEARCH_BASE || 'ou=users,dc=example,dc=com',
        searchFilter: process.env.LDAP_SEARCH_FILTER || '(uid={{username}})'
    },
    
    // Multi-factor authentication
    mfa: {
        enabled: process.env.MFA_ENABLED === 'true' || IS_PRODUCTION,
        issuer: 'NEXUS Security Dashboard',
        window: 2, // Allow 2 time steps
        qrCodeOptions: {
            width: 200,
            height: 200,
            margin: 2
        }
    }
};

/**
 * Security configuration
 */
const SECURITY_CONFIG = {
    // Encryption
    encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16,
        tagLength: 16,
        saltLength: 32
    },
    
    // Password policy
    password: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
        historyCount: 5 // Remember last 5 passwords
    },
    
    // Account lockout
    lockout: {
        maxAttempts: 5,
        lockoutDuration: 30 * 60 * 1000, // 30 minutes
        resetTime: 24 * 60 * 60 * 1000 // 24 hours
    },
    
    // IP whitelist/blacklist
    ipFilter: {
        enabled: process.env.IP_FILTER_ENABLED === 'true',
        whitelist: process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [],
        blacklist: process.env.IP_BLACKLIST ? process.env.IP_BLACKLIST.split(',') : []
    },
    
    // Content Security Policy
    csp: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'cdn.jsdelivr.net'],
            fontSrc: ["'self'", 'fonts.gstatic.com', 'cdn.jsdelivr.net'],
            imgSrc: ["'self'", 'data:', 'blob:', '*.gravatar.com'],
            connectSrc: ["'self'", 'ws:', 'wss:'],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"]
        }
    }
};

/**
 * Monitoring configuration
 */
const MONITORING_CONFIG = {
    // Metrics collection
    metrics: {
        enabled: true,
        interval: 30000, // 30 seconds
        retention: {
            raw: 24 * 60 * 60 * 1000, // 24 hours
            aggregated: 30 * 24 * 60 * 60 * 1000 // 30 days
        }
    },
    
    // Health checks
    healthCheck: {
        enabled: true,
        interval: 60000, // 1 minute
        timeout: 5000, // 5 seconds
        endpoints: [
            '/health',
            '/api/health',
            '/metrics'
        ]
    },
    
    // Alerting
    alerts: {
        enabled: true,
        channels: {
            email: {
                enabled: process.env.EMAIL_ALERTS_ENABLED === 'true',
                smtp: {
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT) || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASSWORD
                    }
                },
                from: process.env.ALERT_FROM_EMAIL || 'alerts@nexus-security.com',
                to: process.env.ALERT_TO_EMAIL ? process.env.ALERT_TO_EMAIL.split(',') : []
            },
            slack: {
                enabled: process.env.SLACK_ALERTS_ENABLED === 'true',
                webhookUrl: process.env.SLACK_WEBHOOK_URL,
                channel: process.env.SLACK_CHANNEL || '#security-alerts',
                username: 'NEXUS Security Bot'
            },
            webhook: {
                enabled: process.env.WEBHOOK_ALERTS_ENABLED === 'true',
                url: process.env.WEBHOOK_URL,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': process.env.WEBHOOK_AUTH_TOKEN
                }
            }
        }
    }
};

/**
 * Logging configuration
 */
const LOGGING_CONFIG = {
    level: process.env.LOG_LEVEL || (IS_PRODUCTION ? 'info' : 'debug'),
    format: IS_PRODUCTION ? 'json' : 'combined',
    
    // File logging
    file: {
        enabled: true,
        path: process.env.LOG_PATH || path.join(__dirname, '../../../logs'),
        filename: 'dashboard-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        compress: true
    },
    
    // Console logging
    console: {
        enabled: !IS_PRODUCTION,
        colorize: true,
        timestamp: true
    },
    
    // External logging services
    external: {
        elasticsearch: {
            enabled: process.env.ELASTICSEARCH_LOGGING_ENABLED === 'true',
            host: process.env.ELASTICSEARCH_HOST || 'localhost:9200',
            index: 'nexus-dashboard-logs',
            type: 'log'
        },
        syslog: {
            enabled: process.env.SYSLOG_ENABLED === 'true',
            host: process.env.SYSLOG_HOST || 'localhost',
            port: parseInt(process.env.SYSLOG_PORT) || 514,
            facility: 'local0'
        }
    }
};

/**
 * API configuration
 */
const API_CONFIG = {
    // API versioning
    version: 'v1',
    prefix: '/api/v1',
    
    // Request limits
    limits: {
        json: '10mb',
        urlencoded: '10mb',
        raw: '10mb',
        text: '10mb'
    },
    
    // Pagination
    pagination: {
        defaultLimit: 20,
        maxLimit: 100
    },
    
    // Cache settings
    cache: {
        enabled: true,
        ttl: 300, // 5 minutes
        checkPeriod: 600 // 10 minutes
    },
    
    // External API integrations
    integrations: {
        virustotal: {
            enabled: process.env.VIRUSTOTAL_ENABLED === 'true',
            apiKey: process.env.VIRUSTOTAL_API_KEY,
            baseUrl: 'https://www.virustotal.com/vtapi/v2'
        },
        shodan: {
            enabled: process.env.SHODAN_ENABLED === 'true',
            apiKey: process.env.SHODAN_API_KEY,
            baseUrl: 'https://api.shodan.io'
        },
        threatintel: {
            enabled: process.env.THREATINTEL_ENABLED === 'true',
            apiKey: process.env.THREATINTEL_API_KEY,
            baseUrl: 'https://api.threatintelligence.com/v1'
        }
    }
};

/**
 * WebSocket configuration
 */
const WEBSOCKET_CONFIG = {
    enabled: true,
    path: '/ws',
    
    // Connection settings
    pingTimeout: 60000, // 1 minute
    pingInterval: 25000, // 25 seconds
    upgradeTimeout: 10000, // 10 seconds
    maxHttpBufferSize: 1e6, // 1MB
    
    // CORS for WebSocket
    cors: {
        origin: SERVER_CONFIG.cors.origin,
        credentials: true
    },
    
    // Rooms and namespaces
    namespaces: {
        dashboard: '/dashboard',
        monitoring: '/monitoring',
        alerts: '/alerts'
    }
};

/**
 * Feature flags
 */
const FEATURE_FLAGS = {
    // Dashboard features
    realTimeMonitoring: process.env.FEATURE_REALTIME_MONITORING !== 'false',
    threatIntelligence: process.env.FEATURE_THREAT_INTELLIGENCE === 'true',
    complianceReporting: process.env.FEATURE_COMPLIANCE_REPORTING !== 'false',
    auditLogging: process.env.FEATURE_AUDIT_LOGGING !== 'false',
    
    // Advanced features
    aiAnalysis: process.env.FEATURE_AI_ANALYSIS === 'true',
    predictiveAnalytics: process.env.FEATURE_PREDICTIVE_ANALYTICS === 'true',
    automatedResponse: process.env.FEATURE_AUTOMATED_RESPONSE === 'true',
    
    // Integration features
    ssoIntegration: process.env.FEATURE_SSO_INTEGRATION === 'true',
    apiIntegrations: process.env.FEATURE_API_INTEGRATIONS === 'true',
    webhookSupport: process.env.FEATURE_WEBHOOK_SUPPORT === 'true'
};

/**
 * Performance configuration
 */
const PERFORMANCE_CONFIG = {
    // Clustering
    cluster: {
        enabled: process.env.CLUSTER_ENABLED === 'true' && IS_PRODUCTION,
        workers: parseInt(process.env.CLUSTER_WORKERS) || os.cpus().length
    },
    
    // Compression
    compression: {
        enabled: true,
        level: IS_PRODUCTION ? 6 : 1,
        threshold: 1024 // Only compress responses > 1KB
    },
    
    // Memory management
    memory: {
        maxOldSpaceSize: process.env.NODE_MAX_OLD_SPACE_SIZE || '4096',
        gcInterval: 60000 // Force GC every minute
    }
};

/**
 * Export configuration object
 */
module.exports = {
    ENV,
    IS_PRODUCTION,
    IS_DEVELOPMENT,
    
    SERVER: SERVER_CONFIG,
    DATABASE: DATABASE_CONFIG,
    AUTH: AUTH_CONFIG,
    SECURITY: SECURITY_CONFIG,
    MONITORING: MONITORING_CONFIG,
    LOGGING: LOGGING_CONFIG,
    API: API_CONFIG,
    WEBSOCKET: WEBSOCKET_CONFIG,
    FEATURES: FEATURE_FLAGS,
    PERFORMANCE: PERFORMANCE_CONFIG,
    
    // Utility functions
    get(path, defaultValue = null) {
        return path.split('.').reduce((obj, key) => {
            return obj && obj[key] !== undefined ? obj[key] : defaultValue;
        }, this);
    },
    
    // Validate configuration
    validate() {
        const errors = [];
        
        // Check required environment variables
        const required = [
            'JWT_SECRET',
            'SESSION_SECRET'
        ];
        
        if (IS_PRODUCTION) {
            required.push(
                'DB_PASSWORD',
                'SSL_KEY_PATH',
                'SSL_CERT_PATH'
            );
        }
        
        required.forEach(key => {
            if (!process.env[key]) {
                errors.push(`Missing required environment variable: ${key}`);
            }
        });
        
        // Validate SSL configuration in production
        if (IS_PRODUCTION && SERVER_CONFIG.ssl.enabled) {
            const fs = require('fs');
            if (!fs.existsSync(SERVER_CONFIG.ssl.keyPath)) {
                errors.push(`SSL key file not found: ${SERVER_CONFIG.ssl.keyPath}`);
            }
            if (!fs.existsSync(SERVER_CONFIG.ssl.certPath)) {
                errors.push(`SSL certificate file not found: ${SERVER_CONFIG.ssl.certPath}`);
            }
        }
        
        return errors;
    }
};