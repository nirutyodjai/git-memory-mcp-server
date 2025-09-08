/**
 * =============================================================================
 * NEXUS IDE - AI Central Server Configuration
 * =============================================================================
 * 
 * Centralized configuration management for AI Central Server
 * 
 * Features:
 * - Environment-based configuration
 * - Validation and type checking
 * - Default values and overrides
 * - Security settings
 * - Performance tuning
 * - Feature flags
 * 
 * Author: NEXUS IDE Team
 * Version: 1.0.0
 * License: MIT
 * 
 * =============================================================================
 */

'use strict';

const path = require('path');
const os = require('os');

// Load environment variables
require('dotenv').config();

// =============================================================================
// Environment Detection
// =============================================================================
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDevelopment = NODE_ENV === 'development';
const isProduction = NODE_ENV === 'production';
const isTesting = NODE_ENV === 'test';

// =============================================================================
// Helper Functions
// =============================================================================
const parseBoolean = (value, defaultValue = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return defaultValue;
};

const parseInteger = (value, defaultValue = 0) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const parseFloat = (value, defaultValue = 0.0) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

const parseArray = (value, defaultValue = []) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
  return defaultValue;
};

// =============================================================================
// Configuration Object
// =============================================================================
const config = {
  // ==========================================================================
  // Environment
  // ==========================================================================
  env: {
    NODE_ENV,
    isDevelopment,
    isProduction,
    isTesting
  },
  
  // ==========================================================================
  // Server Configuration
  // ==========================================================================
  server: {
    name: process.env.SERVER_NAME || 'NEXUS IDE AI Central Server',
    version: process.env.npm_package_version || '1.0.0',
    port: parseInteger(process.env.PORT, 4200),
    host: process.env.HOST || '0.0.0.0',
    
    // Cluster Configuration
    cluster: {
      enabled: parseBoolean(process.env.CLUSTER_MODE, !isDevelopment),
      workers: parseInteger(process.env.CLUSTER_WORKERS, os.cpus().length),
      maxMemory: parseInteger(process.env.MAX_MEMORY_MB, 512) * 1024 * 1024, // Convert to bytes
      restartDelay: parseInteger(process.env.RESTART_DELAY, 1000)
    },
    
    // Request Configuration
    request: {
      timeout: parseInteger(process.env.REQUEST_TIMEOUT, 30000),
      maxSize: process.env.MAX_REQUEST_SIZE || '50mb',
      keepAliveTimeout: parseInteger(process.env.KEEP_ALIVE_TIMEOUT, 5000),
      headersTimeout: parseInteger(process.env.HEADERS_TIMEOUT, 60000)
    },
    
    // Static Files
    static: {
      enabled: parseBoolean(process.env.SERVE_STATIC, true),
      path: process.env.STATIC_PATH || path.join(__dirname, '../public'),
      maxAge: parseInteger(process.env.STATIC_MAX_AGE, 86400000) // 1 day
    }
  },
  
  // ==========================================================================
  // SSL/TLS Configuration
  // ==========================================================================
  ssl: {
    enabled: parseBoolean(process.env.SSL_ENABLED, false),
    keyPath: process.env.SSL_KEY_PATH || path.join(__dirname, '../ssl/server.key'),
    certPath: process.env.SSL_CERT_PATH || path.join(__dirname, '../ssl/server.crt'),
    caPath: process.env.SSL_CA_PATH,
    passphrase: process.env.SSL_PASSPHRASE,
    
    // SSL Options
    options: {
      secureProtocol: process.env.SSL_PROTOCOL || 'TLSv1_2_method',
      ciphers: process.env.SSL_CIPHERS || 'ECDHE-RSA-AES128-GCM-SHA256:!RC4:!MD5:!aNULL:!eNULL:!NULL:!DH:!EDH:!EXP:+HIGH:+MEDIUM',
      honorCipherOrder: parseBoolean(process.env.SSL_HONOR_CIPHER_ORDER, true)
    }
  },
  
  // ==========================================================================
  // Database Configuration
  // ==========================================================================
  database: {
    // MongoDB Configuration
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus-ide',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: parseInteger(process.env.MONGODB_MAX_POOL_SIZE, 10),
        serverSelectionTimeoutMS: parseInteger(process.env.MONGODB_SERVER_SELECTION_TIMEOUT, 5000),
        socketTimeoutMS: parseInteger(process.env.MONGODB_SOCKET_TIMEOUT, 45000),
        family: 4, // Use IPv4, skip trying IPv6
        keepAlive: true,
        keepAliveInitialDelay: 300000,
        maxIdleTimeMS: parseInteger(process.env.MONGODB_MAX_IDLE_TIME, 30000),
        retryWrites: parseBoolean(process.env.MONGODB_RETRY_WRITES, true)
      }
    },
    
    // Redis Configuration
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInteger(process.env.REDIS_PORT, 6379),
      password: process.env.REDIS_PASSWORD,
      db: parseInteger(process.env.REDIS_DB, 0),
      
      // Connection Options
      connectTimeout: parseInteger(process.env.REDIS_CONNECT_TIMEOUT, 10000),
      commandTimeout: parseInteger(process.env.REDIS_COMMAND_TIMEOUT, 5000),
      retryDelayOnFailover: parseInteger(process.env.REDIS_RETRY_DELAY, 100),
      maxRetriesPerRequest: parseInteger(process.env.REDIS_MAX_RETRIES, 3),
      lazyConnect: parseBoolean(process.env.REDIS_LAZY_CONNECT, true),
      keepAlive: parseInteger(process.env.REDIS_KEEP_ALIVE, 30000),
      
      // Cluster Configuration (if using Redis Cluster)
      cluster: {
        enabled: parseBoolean(process.env.REDIS_CLUSTER_ENABLED, false),
        nodes: parseArray(process.env.REDIS_CLUSTER_NODES, ['localhost:6379']),
        options: {
          redisOptions: {
            password: process.env.REDIS_PASSWORD
          }
        }
      }
    },
    
    // PostgreSQL Configuration
    postgresql: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInteger(process.env.POSTGRES_PORT, 5432),
      database: process.env.POSTGRES_DB || 'nexus_ide',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD,
      
      // Pool Configuration
      max: parseInteger(process.env.POSTGRES_MAX_CONNECTIONS, 20),
      min: parseInteger(process.env.POSTGRES_MIN_CONNECTIONS, 2),
      idleTimeoutMillis: parseInteger(process.env.POSTGRES_IDLE_TIMEOUT, 30000),
      connectionTimeoutMillis: parseInteger(process.env.POSTGRES_CONNECTION_TIMEOUT, 2000),
      acquireTimeoutMillis: parseInteger(process.env.POSTGRES_ACQUIRE_TIMEOUT, 60000),
      
      // SSL Configuration
      ssl: parseBoolean(process.env.POSTGRES_SSL, false) ? {
        rejectUnauthorized: parseBoolean(process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED, true),
        ca: process.env.POSTGRES_SSL_CA,
        cert: process.env.POSTGRES_SSL_CERT,
        key: process.env.POSTGRES_SSL_KEY
      } : false
    }
  },
  
  // ==========================================================================
  // Security Configuration
  // ==========================================================================
  security: {
    // JWT Configuration
    jwt: {
      secret: process.env.JWT_SECRET || 'nexus-ide-super-secret-key-change-in-production',
      algorithm: process.env.JWT_ALGORITHM || 'HS256',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: process.env.JWT_ISSUER || 'nexus-ide',
      audience: process.env.JWT_AUDIENCE || 'nexus-ide-users'
    },
    
    // Password Hashing
    bcrypt: {
      rounds: parseInteger(process.env.BCRYPT_ROUNDS, 12)
    },
    
    // Rate Limiting
    rateLimit: {
      windowMs: parseInteger(process.env.RATE_LIMIT_WINDOW, 15 * 60 * 1000), // 15 minutes
      max: parseInteger(process.env.RATE_LIMIT_MAX, 1000),
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(parseInteger(process.env.RATE_LIMIT_WINDOW, 15 * 60 * 1000) / 1000)
      },
      standardHeaders: parseBoolean(process.env.RATE_LIMIT_STANDARD_HEADERS, true),
      legacyHeaders: parseBoolean(process.env.RATE_LIMIT_LEGACY_HEADERS, false),
      
      // Skip successful requests
      skipSuccessfulRequests: parseBoolean(process.env.RATE_LIMIT_SKIP_SUCCESS, false),
      skipFailedRequests: parseBoolean(process.env.RATE_LIMIT_SKIP_FAILED, false)
    },
    
    // Speed Limiting
    speedLimit: {
      windowMs: parseInteger(process.env.SPEED_LIMIT_WINDOW, 15 * 60 * 1000), // 15 minutes
      delayAfter: parseInteger(process.env.SPEED_LIMIT_DELAY_AFTER, 100),
      delayMs: parseInteger(process.env.SPEED_LIMIT_DELAY_MS, 500),
      maxDelayMs: parseInteger(process.env.SPEED_LIMIT_MAX_DELAY, 20000)
    },
    
    // CORS Configuration
    cors: {
      origin: process.env.CORS_ORIGIN ? parseArray(process.env.CORS_ORIGIN) : true,
      credentials: parseBoolean(process.env.CORS_CREDENTIALS, true),
      methods: parseArray(process.env.CORS_METHODS, ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']),
      allowedHeaders: parseArray(process.env.CORS_ALLOWED_HEADERS, [
        'Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key', 'X-Client-Version'
      ]),
      exposedHeaders: parseArray(process.env.CORS_EXPOSED_HEADERS, [
        'X-Total-Count', 'X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset'
      ]),
      maxAge: parseInteger(process.env.CORS_MAX_AGE, 86400) // 24 hours
    },
    
    // Content Security Policy
    csp: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      },
      reportOnly: parseBoolean(process.env.CSP_REPORT_ONLY, isDevelopment)
    },
    
    // API Keys
    apiKeys: {
      enabled: parseBoolean(process.env.API_KEYS_ENABLED, false),
      header: process.env.API_KEY_HEADER || 'X-API-Key',
      keys: parseArray(process.env.API_KEYS, [])
    }
  },
  
  // ==========================================================================
  // AI Configuration
  // ==========================================================================
  ai: {
    // Default Settings
    defaults: {
      model: process.env.DEFAULT_AI_MODEL || 'gpt-4',
      maxTokens: parseInteger(process.env.DEFAULT_MAX_TOKENS, 4096),
      temperature: parseFloat(process.env.DEFAULT_TEMPERATURE, 0.7),
      topP: parseFloat(process.env.DEFAULT_TOP_P, 1.0),
      frequencyPenalty: parseFloat(process.env.DEFAULT_FREQUENCY_PENALTY, 0.0),
      presencePenalty: parseFloat(process.env.DEFAULT_PRESENCE_PENALTY, 0.0),
      timeout: parseInteger(process.env.AI_REQUEST_TIMEOUT, 30000)
    },
    
    // Model Providers
    providers: {
      openai: {
        enabled: parseBoolean(process.env.OPENAI_ENABLED, true),
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORGANIZATION,
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        timeout: parseInteger(process.env.OPENAI_TIMEOUT, 30000),
        maxRetries: parseInteger(process.env.OPENAI_MAX_RETRIES, 3),
        models: parseArray(process.env.OPENAI_MODELS, [
          'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'
        ])
      },
      
      claude: {
        enabled: parseBoolean(process.env.CLAUDE_ENABLED, true),
        apiKey: process.env.CLAUDE_API_KEY,
        baseURL: process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com',
        timeout: parseInteger(process.env.CLAUDE_TIMEOUT, 30000),
        maxRetries: parseInteger(process.env.CLAUDE_MAX_RETRIES, 3),
        models: parseArray(process.env.CLAUDE_MODELS, [
          'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'
        ])
      },
      
      gemini: {
        enabled: parseBoolean(process.env.GEMINI_ENABLED, true),
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
        timeout: parseInteger(process.env.GEMINI_TIMEOUT, 30000),
        maxRetries: parseInteger(process.env.GEMINI_MAX_RETRIES, 3),
        models: parseArray(process.env.GEMINI_MODELS, [
          'gemini-pro', 'gemini-pro-vision'
        ])
      },
      
      ollama: {
        enabled: parseBoolean(process.env.OLLAMA_ENABLED, false),
        baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        timeout: parseInteger(process.env.OLLAMA_TIMEOUT, 60000),
        maxRetries: parseInteger(process.env.OLLAMA_MAX_RETRIES, 2),
        models: parseArray(process.env.OLLAMA_MODELS, [
          'llama2', 'codellama', 'mistral', 'neural-chat'
        ])
      },
      
      huggingface: {
        enabled: parseBoolean(process.env.HUGGINGFACE_ENABLED, false),
        apiKey: process.env.HUGGINGFACE_API_KEY,
        baseURL: process.env.HUGGINGFACE_BASE_URL || 'https://api-inference.huggingface.co',
        timeout: parseInteger(process.env.HUGGINGFACE_TIMEOUT, 30000),
        maxRetries: parseInteger(process.env.HUGGINGFACE_MAX_RETRIES, 3),
        models: parseArray(process.env.HUGGINGFACE_MODELS, [
          'microsoft/DialoGPT-large', 'facebook/blenderbot-400M-distill'
        ])
      }
    },
    
    // Load Balancing
    loadBalancing: {
      strategy: process.env.AI_LOAD_BALANCE_STRATEGY || 'round-robin', // round-robin, least-connections, weighted, random
      healthCheckInterval: parseInteger(process.env.AI_HEALTH_CHECK_INTERVAL, 30000),
      maxFailures: parseInteger(process.env.AI_MAX_FAILURES, 3),
      recoveryTime: parseInteger(process.env.AI_RECOVERY_TIME, 60000)
    },
    
    // Caching
    cache: {
      enabled: parseBoolean(process.env.AI_CACHE_ENABLED, true),
      ttl: parseInteger(process.env.AI_CACHE_TTL, 3600), // 1 hour
      maxSize: parseInteger(process.env.AI_CACHE_MAX_SIZE, 1000),
      keyPrefix: process.env.AI_CACHE_KEY_PREFIX || 'ai:cache:'
    },
    
    // Rate Limiting for AI requests
    rateLimiting: {
      enabled: parseBoolean(process.env.AI_RATE_LIMIT_ENABLED, true),
      requests: parseInteger(process.env.AI_RATE_LIMIT_REQUESTS, 100),
      window: parseInteger(process.env.AI_RATE_LIMIT_WINDOW, 60000), // 1 minute
      burst: parseInteger(process.env.AI_RATE_LIMIT_BURST, 10)
    }
  },
  
  // ==========================================================================
  // Logging Configuration
  // ==========================================================================
  logging: {
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    format: process.env.LOG_FORMAT || 'json', // json, simple, combined
    
    // File Logging
    files: {
      enabled: parseBoolean(process.env.LOG_FILES_ENABLED, true),
      directory: process.env.LOG_DIRECTORY || path.join(__dirname, '../logs'),
      
      // Error Log
      error: {
        filename: process.env.LOG_ERROR_FILE || 'error.log',
        maxsize: parseInteger(process.env.LOG_ERROR_MAX_SIZE, 5242880), // 5MB
        maxFiles: parseInteger(process.env.LOG_ERROR_MAX_FILES, 5)
      },
      
      // Combined Log
      combined: {
        filename: process.env.LOG_COMBINED_FILE || 'combined.log',
        maxsize: parseInteger(process.env.LOG_COMBINED_MAX_SIZE, 5242880), // 5MB
        maxFiles: parseInteger(process.env.LOG_COMBINED_MAX_FILES, 5)
      },
      
      // Access Log
      access: {
        enabled: parseBoolean(process.env.LOG_ACCESS_ENABLED, true),
        filename: process.env.LOG_ACCESS_FILE || 'access.log',
        maxsize: parseInteger(process.env.LOG_ACCESS_MAX_SIZE, 10485760), // 10MB
        maxFiles: parseInteger(process.env.LOG_ACCESS_MAX_FILES, 10)
      }
    },
    
    // Console Logging
    console: {
      enabled: parseBoolean(process.env.LOG_CONSOLE_ENABLED, !isProduction),
      colorize: parseBoolean(process.env.LOG_CONSOLE_COLORIZE, !isProduction),
      timestamp: parseBoolean(process.env.LOG_CONSOLE_TIMESTAMP, true)
    },
    
    // External Logging Services
    external: {
      // Elasticsearch
      elasticsearch: {
        enabled: parseBoolean(process.env.LOG_ELASTICSEARCH_ENABLED, false),
        host: process.env.ELASTICSEARCH_HOST || 'localhost:9200',
        index: process.env.LOG_ELASTICSEARCH_INDEX || 'nexus-ide-logs',
        type: process.env.LOG_ELASTICSEARCH_TYPE || 'log'
      },
      
      // Syslog
      syslog: {
        enabled: parseBoolean(process.env.LOG_SYSLOG_ENABLED, false),
        host: process.env.SYSLOG_HOST || 'localhost',
        port: parseInteger(process.env.SYSLOG_PORT, 514),
        facility: process.env.SYSLOG_FACILITY || 'local0'
      }
    }
  },
  
  // ==========================================================================
  // Monitoring Configuration
  // ==========================================================================
  monitoring: {
    enabled: parseBoolean(process.env.MONITORING_ENABLED, true),
    
    // Health Checks
    health: {
      enabled: parseBoolean(process.env.HEALTH_CHECK_ENABLED, true),
      interval: parseInteger(process.env.HEALTH_CHECK_INTERVAL, 30000),
      timeout: parseInteger(process.env.HEALTH_CHECK_TIMEOUT, 5000),
      retries: parseInteger(process.env.HEALTH_CHECK_RETRIES, 3)
    },
    
    // Metrics
    metrics: {
      enabled: parseBoolean(process.env.METRICS_ENABLED, true),
      port: parseInteger(process.env.METRICS_PORT, 9090),
      path: process.env.METRICS_PATH || '/metrics',
      interval: parseInteger(process.env.METRICS_INTERVAL, 15000)
    },
    
    // Performance Monitoring
    performance: {
      enabled: parseBoolean(process.env.PERFORMANCE_MONITORING_ENABLED, true),
      sampleRate: parseFloat(process.env.PERFORMANCE_SAMPLE_RATE, 0.1), // 10%
      slowRequestThreshold: parseInteger(process.env.SLOW_REQUEST_THRESHOLD, 1000) // 1 second
    },
    
    // Memory Monitoring
    memory: {
      enabled: parseBoolean(process.env.MEMORY_MONITORING_ENABLED, true),
      interval: parseInteger(process.env.MEMORY_CHECK_INTERVAL, 60000), // 1 minute
      threshold: parseInteger(process.env.MEMORY_THRESHOLD_MB, 500), // 500MB
      gcThreshold: parseFloat(process.env.GC_THRESHOLD, 0.8) // 80%
    },
    
    // External Monitoring Services
    external: {
      // Prometheus
      prometheus: {
        enabled: parseBoolean(process.env.PROMETHEUS_ENABLED, false),
        gateway: process.env.PROMETHEUS_GATEWAY,
        jobName: process.env.PROMETHEUS_JOB_NAME || 'nexus-ide-ai-central'
      },
      
      // New Relic
      newrelic: {
        enabled: parseBoolean(process.env.NEW_RELIC_ENABLED, false),
        licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
        appName: process.env.NEW_RELIC_APP_NAME || 'NEXUS IDE AI Central Server'
      },
      
      // DataDog
      datadog: {
        enabled: parseBoolean(process.env.DATADOG_ENABLED, false),
        apiKey: process.env.DATADOG_API_KEY,
        hostname: process.env.DATADOG_HOSTNAME || os.hostname()
      }
    }
  },
  
  // ==========================================================================
  // WebSocket Configuration
  // ==========================================================================
  websocket: {
    enabled: parseBoolean(process.env.WEBSOCKET_ENABLED, true),
    path: process.env.WEBSOCKET_PATH || '/ws',
    
    // Connection Settings
    maxConnections: parseInteger(process.env.WEBSOCKET_MAX_CONNECTIONS, 1000),
    heartbeatInterval: parseInteger(process.env.WEBSOCKET_HEARTBEAT_INTERVAL, 30000),
    connectionTimeout: parseInteger(process.env.WEBSOCKET_CONNECTION_TIMEOUT, 60000),
    
    // Message Settings
    maxMessageSize: parseInteger(process.env.WEBSOCKET_MAX_MESSAGE_SIZE, 1048576), // 1MB
    compression: parseBoolean(process.env.WEBSOCKET_COMPRESSION, true),
    
    // Compression Settings
    perMessageDeflate: {
      enabled: parseBoolean(process.env.WEBSOCKET_DEFLATE_ENABLED, true),
      threshold: parseInteger(process.env.WEBSOCKET_DEFLATE_THRESHOLD, 1024),
      concurrencyLimit: parseInteger(process.env.WEBSOCKET_DEFLATE_CONCURRENCY, 10),
      level: parseInteger(process.env.WEBSOCKET_DEFLATE_LEVEL, 3),
      chunkSize: parseInteger(process.env.WEBSOCKET_DEFLATE_CHUNK_SIZE, 1024)
    }
  },
  
  // ==========================================================================
  // Feature Flags
  // ==========================================================================
  features: {
    // AI Features
    aiCodeCompletion: parseBoolean(process.env.FEATURE_AI_CODE_COMPLETION, true),
    aiCodeGeneration: parseBoolean(process.env.FEATURE_AI_CODE_GENERATION, true),
    aiCodeReview: parseBoolean(process.env.FEATURE_AI_CODE_REVIEW, true),
    aiConversation: parseBoolean(process.env.FEATURE_AI_CONVERSATION, true),
    aiDebugging: parseBoolean(process.env.FEATURE_AI_DEBUGGING, true),
    aiOptimization: parseBoolean(process.env.FEATURE_AI_OPTIMIZATION, true),
    
    // Collaboration Features
    realTimeCollaboration: parseBoolean(process.env.FEATURE_REAL_TIME_COLLABORATION, true),
    voiceChat: parseBoolean(process.env.FEATURE_VOICE_CHAT, false),
    videoChat: parseBoolean(process.env.FEATURE_VIDEO_CHAT, false),
    screenSharing: parseBoolean(process.env.FEATURE_SCREEN_SHARING, false),
    
    // Advanced Features
    multiModelAI: parseBoolean(process.env.FEATURE_MULTI_MODEL_AI, true),
    aiLoadBalancing: parseBoolean(process.env.FEATURE_AI_LOAD_BALANCING, true),
    advancedCaching: parseBoolean(process.env.FEATURE_ADVANCED_CACHING, true),
    performanceOptimization: parseBoolean(process.env.FEATURE_PERFORMANCE_OPTIMIZATION, true),
    
    // Experimental Features
    experimentalFeatures: parseBoolean(process.env.FEATURE_EXPERIMENTAL, isDevelopment),
    betaFeatures: parseBoolean(process.env.FEATURE_BETA, false)
  },
  
  // ==========================================================================
  // Cache Configuration
  // ==========================================================================
  cache: {
    // Memory Cache
    memory: {
      enabled: parseBoolean(process.env.MEMORY_CACHE_ENABLED, true),
      maxSize: parseInteger(process.env.MEMORY_CACHE_MAX_SIZE, 100), // 100 items
      ttl: parseInteger(process.env.MEMORY_CACHE_TTL, 300000), // 5 minutes
      checkPeriod: parseInteger(process.env.MEMORY_CACHE_CHECK_PERIOD, 60000) // 1 minute
    },
    
    // Redis Cache
    redis: {
      enabled: parseBoolean(process.env.REDIS_CACHE_ENABLED, true),
      keyPrefix: process.env.REDIS_CACHE_PREFIX || 'nexus:cache:',
      defaultTTL: parseInteger(process.env.REDIS_CACHE_DEFAULT_TTL, 3600), // 1 hour
      maxRetries: parseInteger(process.env.REDIS_CACHE_MAX_RETRIES, 3)
    }
  },
  
  // ==========================================================================
  // Development Configuration
  // ==========================================================================
  development: {
    // Hot Reload
    hotReload: parseBoolean(process.env.HOT_RELOAD_ENABLED, isDevelopment),
    
    // Debug Mode
    debug: parseBoolean(process.env.DEBUG_MODE, isDevelopment),
    debugPort: parseInteger(process.env.DEBUG_PORT, 9229),
    
    // Mock Services
    mockAI: parseBoolean(process.env.MOCK_AI_SERVICES, false),
    mockDatabase: parseBoolean(process.env.MOCK_DATABASE, false),
    
    // Development Tools
    devTools: parseBoolean(process.env.DEV_TOOLS_ENABLED, isDevelopment),
    profiling: parseBoolean(process.env.PROFILING_ENABLED, false)
  }
};

// =============================================================================
// Configuration Validation
// =============================================================================
const validateConfig = () => {
  const errors = [];
  
  // Required environment variables in production
  if (isProduction) {
    const requiredVars = [
      'JWT_SECRET',
      'MONGODB_URI',
      'REDIS_HOST'
    ];
    
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        errors.push(`Missing required environment variable: ${varName}`);
      }
    });
    
    // Check AI provider keys
    const aiProviders = ['OPENAI_API_KEY', 'CLAUDE_API_KEY', 'GEMINI_API_KEY'];
    const hasAnyAIProvider = aiProviders.some(key => process.env[key]);
    
    if (!hasAnyAIProvider) {
      errors.push('At least one AI provider API key must be configured');
    }
  }
  
  // Validate port ranges
  if (config.server.port < 1 || config.server.port > 65535) {
    errors.push('Server port must be between 1 and 65535');
  }
  
  // Validate JWT secret length
  if (config.security.jwt.secret.length < 32) {
    errors.push('JWT secret must be at least 32 characters long');
  }
  
  // Validate bcrypt rounds
  if (config.security.bcrypt.rounds < 10 || config.security.bcrypt.rounds > 15) {
    errors.push('Bcrypt rounds must be between 10 and 15');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
};

// Validate configuration
validateConfig();

// =============================================================================
// Export Configuration
// =============================================================================
module.exports = config;

// =============================================================================
// Configuration Summary (Development Only)
// =============================================================================
if (isDevelopment && !isTesting) {
  console.log('\n🔧 NEXUS IDE AI Central Server Configuration:');
  console.log(`   Environment: ${NODE_ENV}`);
  console.log(`   Server: ${config.server.host}:${config.server.port}`);
  console.log(`   SSL: ${config.ssl.enabled ? 'Enabled' : 'Disabled'}`);
  console.log(`   Cluster: ${config.server.cluster.enabled ? `Enabled (${config.server.cluster.workers} workers)` : 'Disabled'}`);
  console.log(`   MongoDB: ${config.database.mongodb.uri}`);
  console.log(`   Redis: ${config.database.redis.host}:${config.database.redis.port}`);
  console.log(`   PostgreSQL: ${config.database.postgresql.host}:${config.database.postgresql.port}`);
  console.log(`   AI Providers: ${Object.entries(config.ai.providers).filter(([, provider]) => provider.enabled).map(([name]) => name).join(', ')}`);
  console.log(`   Features: ${Object.entries(config.features).filter(([, enabled]) => enabled).length} enabled`);
  console.log('');
}

// =============================================================================
// End of File
// =============================================================================