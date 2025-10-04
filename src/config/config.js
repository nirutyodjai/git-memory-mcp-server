import os from 'os';

export class ConfigManager {
  constructor() {
    this.loadConfig();
  }

  loadConfig() {
    // Server configuration
    this.port = parseInt(process.env.PORT) || 3000;
    this.host = process.env.HOST || '0.0.0.0';
    
    // Worker configuration
    this.workers = process.env.WORKERS || 'auto';
    if (this.workers !== 'auto') {
      this.workers = parseInt(this.workers);
    }
    
    // Connection limits
    this.maxConnections = parseInt(process.env.MAX_CONNECTIONS) || 3000;
    this.maxConnectionsPerWorker = parseInt(process.env.MAX_CONNECTIONS_PER_WORKER) || 
      Math.ceil(this.maxConnections / (this.workers === 'auto' ? os.cpus().length : this.workers));
    
    // Timeouts
    this.connectionTimeout = parseInt(process.env.CONNECTION_TIMEOUT) || 30000; // 30 seconds
    this.requestTimeout = parseInt(process.env.REQUEST_TIMEOUT) || 10000; // 10 seconds
    this.keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT) || 65000; // 65 seconds
    
    // Redis configuration
    this.redis = {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || null,
      db: parseInt(process.env.REDIS_DB) || 0,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      lazyConnect: true,
      maxmemoryPolicy: 'allkeys-lru'
    };
    
    // Cache configuration
    this.cache = {
      ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
      checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 60, // 1 minute
      maxKeys: parseInt(process.env.CACHE_MAX_KEYS) || 10000
    };
    
    // Rate limiting
    this.rateLimit = {
      points: parseInt(process.env.RATE_LIMIT_POINTS) || 100,
      duration: parseInt(process.env.RATE_LIMIT_DURATION) || 60,
      blockDuration: parseInt(process.env.RATE_LIMIT_BLOCK_DURATION) || 60
    };
    
    // Git configuration
    this.git = {
      defaultTimeout: parseInt(process.env.GIT_TIMEOUT) || 30000,
      maxConcurrentOperations: parseInt(process.env.GIT_MAX_CONCURRENT) || 10,
      cacheResults: process.env.GIT_CACHE_RESULTS !== 'false'
    };
    
    // Logging configuration
    this.logging = {
      level: process.env.LOG_LEVEL || 'info',
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
      maxSize: process.env.LOG_MAX_SIZE || '10m',
      enableConsole: process.env.LOG_CONSOLE !== 'false',
      enableFile: process.env.LOG_FILE !== 'false'
    };
    
    // Security configuration
    this.security = {
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
      enableHelmet: process.env.ENABLE_HELMET !== 'false',
      enableCors: process.env.ENABLE_CORS !== 'false',
      maxPayloadSize: process.env.MAX_PAYLOAD_SIZE || '10mb'
    };
    
    // Performance configuration
    this.performance = {
      enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
      compressionLevel: parseInt(process.env.COMPRESSION_LEVEL) || 6,
      enableKeepAlive: process.env.ENABLE_KEEP_ALIVE !== 'false',
      maxSockets: parseInt(process.env.MAX_SOCKETS) || Infinity,
      maxFreeSockets: parseInt(process.env.MAX_FREE_SOCKETS) || 256
    };
    
    // Monitoring configuration
    this.monitoring = {
      enableMetrics: process.env.ENABLE_METRICS !== 'false',
      metricsPath: process.env.METRICS_PATH || '/metrics',
      healthPath: process.env.HEALTH_PATH || '/health',
      statsInterval: parseInt(process.env.STATS_INTERVAL) || 10000 // 10 seconds
    };
    
    // WebSocket configuration
    this.websocket = {
      maxPayload: parseInt(process.env.WS_MAX_PAYLOAD) || 1024 * 1024, // 1MB
      perMessageDeflate: process.env.WS_PER_MESSAGE_DEFLATE !== 'false',
      pingInterval: parseInt(process.env.WS_PING_INTERVAL) || 30000, // 30 seconds
      pongTimeout: parseInt(process.env.WS_PONG_TIMEOUT) || 5000 // 5 seconds
    };
    
    // Development configuration
    this.development = {
      enableDebug: process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true',
      enableHotReload: process.env.HOT_RELOAD === 'true',
      enableProfiler: process.env.ENABLE_PROFILER === 'true'
    };
  }

  // Get configuration for a specific section
  getSection(section) {
    return this[section] || {};
  }

  // Get all configuration
  getAll() {
    return {
      port: this.port,
      host: this.host,
      workers: this.workers,
      maxConnections: this.maxConnections,
      maxConnectionsPerWorker: this.maxConnectionsPerWorker,
      connectionTimeout: this.connectionTimeout,
      requestTimeout: this.requestTimeout,
      keepAliveTimeout: this.keepAliveTimeout,
      redis: this.redis,
      cache: this.cache,
      rateLimit: this.rateLimit,
      git: this.git,
      logging: this.logging,
      security: this.security,
      performance: this.performance,
      monitoring: this.monitoring,
      websocket: this.websocket,
      development: this.development
    };
  }

  // Validate configuration
  validate() {
    const errors = [];
    
    if (this.port < 1 || this.port > 65535) {
      errors.push('Port must be between 1 and 65535');
    }
    
    if (this.maxConnections < 1) {
      errors.push('Max connections must be greater than 0');
    }
    
    if (this.workers !== 'auto' && this.workers < 1) {
      errors.push('Number of workers must be greater than 0');
    }
    
    if (this.connectionTimeout < 1000) {
      errors.push('Connection timeout must be at least 1000ms');
    }
    
    if (this.requestTimeout < 1000) {
      errors.push('Request timeout must be at least 1000ms');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Update configuration at runtime
  update(newConfig) {
    Object.assign(this, newConfig);
    return this.validate();
  }

  // Get environment-specific configuration
  getEnvironmentConfig() {
    const env = process.env.NODE_ENV || 'development';
    
    const configs = {
      development: {
        logging: { level: 'debug' },
        development: { enableDebug: true },
        cache: { ttl: 60 }, // Shorter cache in dev
        git: { cacheResults: false } // Disable caching in dev
      },
      production: {
        logging: { level: 'info' },
        development: { enableDebug: false },
        performance: { enableCompression: true },
        security: { enableHelmet: true }
      },
      test: {
        logging: { level: 'error' },
        cache: { ttl: 10 },
        maxConnections: 100
      }
    };
    
    return configs[env] || configs.development;
  }

  // Apply environment-specific configuration
  applyEnvironmentConfig() {
    const envConfig = this.getEnvironmentConfig();
    
    Object.keys(envConfig).forEach(section => {
      if (this[section]) {
        Object.assign(this[section], envConfig[section]);
      }
    });
  }

  // Get configuration summary for logging
  getSummary() {
    return {
      environment: process.env.NODE_ENV || 'development',
      port: this.port,
      host: this.host,
      workers: this.workers,
      maxConnections: this.maxConnections,
      redis: {
        host: this.redis.host,
        port: this.redis.port,
        db: this.redis.db
      },
      logging: {
        level: this.logging.level
      }
    };
  }
}