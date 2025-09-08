/**
 * PM2 Ecosystem Configuration for NEXUS IDE - AI Central Server
 * 
 * This configuration file defines how PM2 should manage the AI Central Server
 * in different environments (development, staging, production)
 * 
 * Usage:
 * - Development: pm2 start ecosystem.config.js --env development
 * - Staging: pm2 start ecosystem.config.js --env staging  
 * - Production: pm2 start ecosystem.config.js --env production
 * 
 * Commands:
 * - pm2 start ecosystem.config.js
 * - pm2 restart ecosystem.config.js
 * - pm2 stop ecosystem.config.js
 * - pm2 delete ecosystem.config.js
 * - pm2 logs ai-central
 * - pm2 monit
 */

module.exports = {
  apps: [
    {
      // Application Configuration
      name: 'ai-central',
      script: './ai-central-api.js',
      cwd: __dirname,
      
      // Instance Configuration
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Enable cluster mode for better performance
      
      // Process Management
      autorestart: true,
      watch: false, // Disable in production, enable in development
      max_memory_restart: '2G', // Restart if memory usage exceeds 2GB
      restart_delay: 1000, // Delay between restarts
      max_restarts: 10, // Maximum number of restarts
      min_uptime: '10s', // Minimum uptime before considering restart
      
      // Logging Configuration
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Environment Variables (Default/Development)
      env: {
        NODE_ENV: 'development',
        PORT: 4200,
        HOST: 'localhost',
        LOG_LEVEL: 'debug',
        ENABLE_HOT_RELOAD: 'true',
        ENABLE_DEBUG_MODE: 'true',
        CACHE_TTL: '300', // 5 minutes for development
        MAX_CONCURRENT_REQUESTS: '50'
      },
      
      // Development Environment
      env_development: {
        NODE_ENV: 'development',
        PORT: 4200,
        HOST: 'localhost',
        LOG_LEVEL: 'debug',
        ENABLE_HOT_RELOAD: 'true',
        ENABLE_DEBUG_MODE: 'true',
        CACHE_TTL: '300',
        MAX_CONCURRENT_REQUESTS: '50',
        MOCK_AI_SERVICES: 'false',
        VERBOSE_LOGGING: 'true'
      },
      
      // Staging Environment
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 4200,
        HOST: '0.0.0.0',
        LOG_LEVEL: 'info',
        ENABLE_HOT_RELOAD: 'false',
        ENABLE_DEBUG_MODE: 'false',
        CACHE_TTL: '1800', // 30 minutes
        MAX_CONCURRENT_REQUESTS: '100',
        ENABLE_RATE_LIMITING: 'true',
        ENABLE_REQUEST_VALIDATION: 'true'
      },
      
      // Production Environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 4200,
        HOST: '0.0.0.0',
        LOG_LEVEL: 'warn',
        ENABLE_HOT_RELOAD: 'false',
        ENABLE_DEBUG_MODE: 'false',
        CACHE_TTL: '3600', // 1 hour
        MAX_CONCURRENT_REQUESTS: '200',
        ENABLE_RATE_LIMITING: 'true',
        ENABLE_REQUEST_VALIDATION: 'true',
        ENABLE_RESPONSE_COMPRESSION: 'true',
        ENABLE_SECURITY_HEADERS: 'true',
        CLUSTER_MODE: 'true'
      },
      
      // Advanced Configuration
      node_args: [
        '--max-old-space-size=4096', // Increase heap size to 4GB
        '--optimize-for-size', // Optimize for memory usage
        '--gc-interval=100' // Garbage collection interval
      ],
      
      // Health Check
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Process Monitoring
      pmx: true,
      
      // Source Map Support
      source_map_support: true,
      
      // Time Zone
      time: true,
      
      // Interpreter
      interpreter: 'node',
      interpreter_args: '--harmony',
      
      // Kill Timeout
      kill_timeout: 5000,
      
      // Listen Timeout
      listen_timeout: 8000,
      
      // Shutdown Timeout
      shutdown_with_message: true
    },
    
    // AI Models Integration Service
    {
      name: 'ai-models-integration',
      script: './ai-models-integration.js',
      cwd: __dirname,
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      env: {
        NODE_ENV: 'development',
        PORT: 4201,
        SERVICE_NAME: 'ai-models-integration'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 4201,
        SERVICE_NAME: 'ai-models-integration',
        LOG_LEVEL: 'info'
      }
    },
    
    // AI Code Features Service
    {
      name: 'ai-code-features',
      script: './ai-code-features.js',
      cwd: __dirname,
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      env: {
        NODE_ENV: 'development',
        PORT: 4202,
        SERVICE_NAME: 'ai-code-features'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 4202,
        SERVICE_NAME: 'ai-code-features',
        LOG_LEVEL: 'info'
      }
    },
    
    // AI Conversation Service
    {
      name: 'ai-conversation',
      script: './ai-conversation.js',
      cwd: __dirname,
      instances: 1, // Single instance for conversation state management
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      env: {
        NODE_ENV: 'development',
        PORT: 4203,
        SERVICE_NAME: 'ai-conversation'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 4203,
        SERVICE_NAME: 'ai-conversation',
        LOG_LEVEL: 'info'
      }
    },
    
    // AI Debugging Service
    {
      name: 'ai-debugging',
      script: './ai-debugging.js',
      cwd: __dirname,
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      env: {
        NODE_ENV: 'development',
        PORT: 4204,
        SERVICE_NAME: 'ai-debugging'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 4204,
        SERVICE_NAME: 'ai-debugging',
        LOG_LEVEL: 'info'
      }
    },
    
    // AI Optimization Service
    {
      name: 'ai-optimization',
      script: './ai-optimization.js',
      cwd: __dirname,
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      env: {
        NODE_ENV: 'development',
        PORT: 4205,
        SERVICE_NAME: 'ai-optimization'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 4205,
        SERVICE_NAME: 'ai-optimization',
        LOG_LEVEL: 'info'
      }
    }
  ],
  
  // Deployment Configuration
  deploy: {
    // Production Deployment
    production: {
      user: 'nexus',
      host: ['production-server-1.com', 'production-server-2.com'],
      ref: 'origin/main',
      repo: 'git@github.com:nexus-ide/ai-central.git',
      path: '/var/www/ai-central',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    },
    
    // Staging Deployment
    staging: {
      user: 'nexus',
      host: 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:nexus-ide/ai-central.git',
      path: '/var/www/ai-central-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  },
  
  // PM2+ Configuration (Monitoring)
  pmx: {
    // Enable PM2+ monitoring
    monitoring: true,
    
    // Custom metrics
    custom_metrics: {
      'AI Requests/min': {
        unit: 'req/min',
        historic: true
      },
      'Active Conversations': {
        unit: 'conversations',
        historic: true
      },
      'Code Completions/min': {
        unit: 'completions/min',
        historic: true
      },
      'Average Response Time': {
        unit: 'ms',
        historic: true
      },
      'Cache Hit Rate': {
        unit: '%',
        historic: true
      },
      'Memory Usage': {
        unit: 'MB',
        historic: true
      },
      'CPU Usage': {
        unit: '%',
        historic: true
      }
    },
    
    // Network monitoring
    network: true,
    
    // Port monitoring
    ports: true,
    
    // Alert system
    alert_enabled: true,
    
    // Custom actions
    actions: [
      {
        action_name: 'Clear Cache',
        action_type: 'http',
        url: 'http://localhost:4200/api/v1/admin/cache/clear',
        method: 'POST'
      },
      {
        action_name: 'Health Check',
        action_type: 'http',
        url: 'http://localhost:4200/health',
        method: 'GET'
      },
      {
        action_name: 'Restart AI Models',
        action_type: 'http',
        url: 'http://localhost:4200/api/v1/admin/models/restart',
        method: 'POST'
      }
    ]
  }
};

/**
 * PM2 Commands Reference:
 * 
 * Basic Commands:
 * - pm2 start ecosystem.config.js
 * - pm2 restart ecosystem.config.js
 * - pm2 stop ecosystem.config.js
 * - pm2 delete ecosystem.config.js
 * - pm2 reload ecosystem.config.js
 * 
 * Environment Specific:
 * - pm2 start ecosystem.config.js --env development
 * - pm2 start ecosystem.config.js --env staging
 * - pm2 start ecosystem.config.js --env production
 * 
 * Monitoring:
 * - pm2 list
 * - pm2 monit
 * - pm2 logs
 * - pm2 logs ai-central
 * - pm2 logs --lines 100
 * 
 * Process Management:
 * - pm2 describe ai-central
 * - pm2 restart ai-central
 * - pm2 stop ai-central
 * - pm2 delete ai-central
 * 
 * Scaling:
 * - pm2 scale ai-central 4
 * - pm2 scale ai-central +2
 * - pm2 scale ai-central -1
 * 
 * Memory Management:
 * - pm2 flush
 * - pm2 reloadLogs
 * 
 * Startup Script:
 * - pm2 startup
 * - pm2 save
 * - pm2 resurrect
 * 
 * Deployment:
 * - pm2 deploy production setup
 * - pm2 deploy production
 * - pm2 deploy production revert 1
 * 
 * PM2+ Integration:
 * - pm2 link <secret_key> <public_key>
 * - pm2 unlink
 * - pm2 monitor
 * 
 * Configuration:
 * - pm2 ecosystem
 * - pm2 init
 * 
 * Updates:
 * - pm2 update
 * - pm2 install pm2-logrotate
 * - pm2 install pm2-auto-pull
 */