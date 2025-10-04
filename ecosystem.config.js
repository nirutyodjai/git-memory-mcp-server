module.exports = {
  apps: [
    {
      name: 'git-memory-mcp-server',
      script: './src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        MAX_CONNECTIONS: 3000,
        WORKERS: 'auto'
      },
      // Performance monitoring
      monitoring: true,
      
      // Memory management
      max_memory_restart: '2G',
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'test'],
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Health check
      health_check_grace_period: 3000,
      
      // Advanced settings
      node_args: '--max-old-space-size=4096',
      
      // Environment specific settings
      merge_logs: true,
      time: true
    },
    {
      name: 'git-memory-metrics',
      script: './src/monitoring/metrics-server.js',
      instances: 1,
      env: {
        NODE_ENV: 'development',
        METRICS_PORT: 9090
      },
      env_production: {
        NODE_ENV: 'production',
        METRICS_PORT: 9090
      },
      max_memory_restart: '512M',
      log_file: './logs/metrics.log',
      error_file: './logs/metrics-error.log'
    }
  ],
  
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/git-memory-mcp-server.git',
      path: '/var/www/git-memory-mcp-server',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y'
    },
    
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/git-memory-mcp-server.git',
      path: '/var/www/git-memory-mcp-server-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging'
    }
  }
};