const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const winston = require('winston');
const moment = require('moment');
const { rateLimiterManager, Usage } = require('./rate-limiter');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/usage-monitor-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/usage-monitor.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class UsageMonitor {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    this.clients = new Set();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupEventListeners();
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request timing middleware
    this.app.use((req, res, next) => {
      req.startTime = Date.now();
      next();
    });

    // Logging middleware
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      });
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const health = await rateLimiterManager.healthCheck();
        res.json(health);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get usage statistics for a user
    this.app.get('/api/usage/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const { period = 'day', startDate, endDate, limit = 100 } = req.query;
        
        const stats = await rateLimiterManager.getUsageStats(
          userId, 
          period, 
          startDate, 
          endDate
        );
        
        res.json(stats);
      } catch (error) {
        logger.error('Get usage stats error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get real-time usage metrics
    this.app.get('/api/metrics/realtime', async (req, res) => {
      try {
        const metrics = await this.getRealTimeMetrics();
        res.json(metrics);
      } catch (error) {
        logger.error('Get real-time metrics error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get system-wide statistics
    this.app.get('/api/metrics/system', async (req, res) => {
      try {
        const { period = 'hour', hours = 24 } = req.query;
        const metrics = await this.getSystemMetrics(period, hours);
        res.json(metrics);
      } catch (error) {
        logger.error('Get system metrics error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get top users by usage
    this.app.get('/api/metrics/top-users', async (req, res) => {
      try {
        const { period = 'day', limit = 10 } = req.query;
        const topUsers = await this.getTopUsers(period, parseInt(limit));
        res.json(topUsers);
      } catch (error) {
        logger.error('Get top users error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get endpoint statistics
    this.app.get('/api/metrics/endpoints', async (req, res) => {
      try {
        const { period = 'day', limit = 20 } = req.query;
        const endpoints = await this.getEndpointStats(period, parseInt(limit));
        res.json(endpoints);
      } catch (error) {
        logger.error('Get endpoint stats error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get rate limit violations
    this.app.get('/api/metrics/violations', async (req, res) => {
      try {
        const { period = 'day', limit = 50 } = req.query;
        const violations = await this.getRateLimitViolations(period, parseInt(limit));
        res.json(violations);
      } catch (error) {
        logger.error('Get violations error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get usage trends
    this.app.get('/api/metrics/trends', async (req, res) => {
      try {
        const { period = 'day', days = 7 } = req.query;
        const trends = await this.getUsageTrends(period, parseInt(days));
        res.json(trends);
      } catch (error) {
        logger.error('Get trends error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get cost analysis
    this.app.get('/api/metrics/costs', async (req, res) => {
      try {
        const { period = 'day', startDate, endDate } = req.query;
        const costs = await this.getCostAnalysis(period, startDate, endDate);
        res.json(costs);
      } catch (error) {
        logger.error('Get cost analysis error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Export usage data
    this.app.get('/api/export/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const { format = 'json', startDate, endDate } = req.query;
        
        const data = await this.exportUsageData(userId, format, startDate, endDate);
        
        if (format === 'csv') {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="usage-${userId}-${Date.now()}.csv"`);
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="usage-${userId}-${Date.now()}.json"`);
        }
        
        res.send(data);
      } catch (error) {
        logger.error('Export data error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Usage monitoring dashboard
    this.app.get('/dashboard', (req, res) => {
      res.send(this.generateDashboardHTML());
    });

    // API documentation
    this.app.get('/docs', (req, res) => {
      res.json({
        title: 'NEXUS IDE Usage Monitor API',
        version: '1.0.0',
        endpoints: {
          'GET /health': 'Health check',
          'GET /api/usage/:userId': 'Get user usage statistics',
          'GET /api/metrics/realtime': 'Get real-time metrics',
          'GET /api/metrics/system': 'Get system-wide metrics',
          'GET /api/metrics/top-users': 'Get top users by usage',
          'GET /api/metrics/endpoints': 'Get endpoint statistics',
          'GET /api/metrics/violations': 'Get rate limit violations',
          'GET /api/metrics/trends': 'Get usage trends',
          'GET /api/metrics/costs': 'Get cost analysis',
          'GET /api/export/:userId': 'Export user usage data',
          'GET /dashboard': 'Usage monitoring dashboard',
          'WebSocket /ws': 'Real-time usage updates'
        }
      });
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      logger.info('WebSocket client connected', { ip: req.socket.remoteAddress });
      this.clients.add(ws);

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          logger.error('WebSocket message error:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send initial metrics
      this.sendRealTimeMetrics(ws);
    });
  }

  setupEventListeners() {
    // Listen for usage events from rate limiter
    rateLimiterManager.on('usage', (data) => {
      this.broadcastToClients({
        type: 'usage',
        data
      });
    });

    rateLimiterManager.on('limitReached', (data) => {
      this.broadcastToClients({
        type: 'limitReached',
        data
      });
    });
  }

  async getRealTimeMetrics() {
    const now = moment();
    const oneMinuteAgo = moment().subtract(1, 'minute');
    const oneHourAgo = moment().subtract(1, 'hour');

    const [lastMinute, lastHour, activeUsers] = await Promise.all([
      Usage.countDocuments({
        timestamp: { $gte: oneMinuteAgo.toDate() }
      }),
      Usage.countDocuments({
        timestamp: { $gte: oneHourAgo.toDate() }
      }),
      Usage.distinct('userId', {
        timestamp: { $gte: oneHourAgo.toDate() }
      })
    ]);

    return {
      requestsLastMinute: lastMinute,
      requestsLastHour: lastHour,
      activeUsers: activeUsers.length,
      connectedClients: this.clients.size,
      timestamp: now.toDate()
    };
  }

  async getSystemMetrics(period, hours) {
    const startTime = moment().subtract(hours, 'hours');
    
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: startTime.toDate() }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: period === 'minute' ? '%Y-%m-%d %H:%M:00' : '%Y-%m-%d %H:00:00',
              date: '$timestamp'
            }
          },
          requests: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          avgResponseTime: { $avg: '$responseTime' },
          errors: {
            $sum: {
              $cond: [{ $gte: ['$statusCode', 400] }, 1, 0]
            }
          },
          rateLimitHits: {
            $sum: {
              $cond: ['$rateLimitHit', 1, 0]
            }
          },
          totalCost: { $sum: '$cost' }
        }
      },
      {
        $project: {
          _id: 1,
          requests: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          avgResponseTime: 1,
          errors: 1,
          rateLimitHits: 1,
          totalCost: 1,
          errorRate: {
            $cond: [
              { $gt: ['$requests', 0] },
              { $multiply: [{ $divide: ['$errors', '$requests'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const metrics = await Usage.aggregate(pipeline);
    return {
      period,
      hours,
      startTime: startTime.toDate(),
      metrics
    };
  }

  async getTopUsers(period, limit) {
    const startTime = moment().subtract(1, period === 'hour' ? 'hour' : 'day');
    
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: startTime.toDate() },
          userId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$userId',
          requests: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          avgResponseTime: { $avg: '$responseTime' },
          errors: {
            $sum: {
              $cond: [{ $gte: ['$statusCode', 400] }, 1, 0]
            }
          },
          rateLimitHits: {
            $sum: {
              $cond: ['$rateLimitHit', 1, 0]
            }
          },
          subscriptionTier: { $last: '$subscriptionTier' }
        }
      },
      {
        $project: {
          userId: '$_id',
          requests: 1,
          totalCost: 1,
          avgResponseTime: 1,
          errors: 1,
          rateLimitHits: 1,
          subscriptionTier: 1,
          errorRate: {
            $cond: [
              { $gt: ['$requests', 0] },
              { $multiply: [{ $divide: ['$errors', '$requests'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { requests: -1 } },
      { $limit: limit }
    ];

    return await Usage.aggregate(pipeline);
  }

  async getEndpointStats(period, limit) {
    const startTime = moment().subtract(1, period === 'hour' ? 'hour' : 'day');
    
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: startTime.toDate() }
        }
      },
      {
        $group: {
          _id: {
            endpoint: '$endpoint',
            method: '$method'
          },
          requests: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' },
          errors: {
            $sum: {
              $cond: [{ $gte: ['$statusCode', 400] }, 1, 0]
            }
          },
          rateLimitHits: {
            $sum: {
              $cond: ['$rateLimitHit', 1, 0]
            }
          },
          totalCost: { $sum: '$cost' }
        }
      },
      {
        $project: {
          endpoint: '$_id.endpoint',
          method: '$_id.method',
          requests: 1,
          avgResponseTime: 1,
          minResponseTime: 1,
          maxResponseTime: 1,
          errors: 1,
          rateLimitHits: 1,
          totalCost: 1,
          errorRate: {
            $cond: [
              { $gt: ['$requests', 0] },
              { $multiply: [{ $divide: ['$errors', '$requests'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { requests: -1 } },
      { $limit: limit }
    ];

    return await Usage.aggregate(pipeline);
  }

  async getRateLimitViolations(period, limit) {
    const startTime = moment().subtract(1, period === 'hour' ? 'hour' : 'day');
    
    const violations = await Usage.find({
      timestamp: { $gte: startTime.toDate() },
      rateLimitHit: true
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'email username')
    .lean();

    return violations;
  }

  async getUsageTrends(period, days) {
    const startTime = moment().subtract(days, 'days').startOf('day');
    
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: startTime.toDate() }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          },
          requests: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          totalCost: { $sum: '$cost' },
          errors: {
            $sum: {
              $cond: [{ $gte: ['$statusCode', 400] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          date: '$_id',
          requests: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          totalCost: 1,
          errors: 1
        }
      },
      { $sort: { date: 1 } }
    ];

    const trends = await Usage.aggregate(pipeline);
    
    // Calculate growth rates
    const trendsWithGrowth = trends.map((trend, index) => {
      if (index === 0) {
        return { ...trend, requestsGrowth: 0, usersGrowth: 0 };
      }
      
      const prev = trends[index - 1];
      const requestsGrowth = prev.requests > 0 
        ? ((trend.requests - prev.requests) / prev.requests) * 100 
        : 0;
      const usersGrowth = prev.uniqueUsers > 0 
        ? ((trend.uniqueUsers - prev.uniqueUsers) / prev.uniqueUsers) * 100 
        : 0;
      
      return {
        ...trend,
        requestsGrowth: Math.round(requestsGrowth * 100) / 100,
        usersGrowth: Math.round(usersGrowth * 100) / 100
      };
    });

    return {
      period,
      days,
      startTime: startTime.toDate(),
      trends: trendsWithGrowth
    };
  }

  async getCostAnalysis(period, startDate, endDate) {
    const start = startDate ? moment(startDate) : moment().subtract(1, period === 'hour' ? 'hour' : 'day');
    const end = endDate ? moment(endDate) : moment();
    
    const pipeline = [
      {
        $match: {
          timestamp: {
            $gte: start.toDate(),
            $lte: end.toDate()
          },
          cost: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: {
            subscriptionTier: '$subscriptionTier',
            endpoint: '$endpoint'
          },
          totalCost: { $sum: '$cost' },
          requests: { $sum: 1 },
          avgCostPerRequest: { $avg: '$cost' }
        }
      },
      {
        $group: {
          _id: '$_id.subscriptionTier',
          totalCost: { $sum: '$totalCost' },
          totalRequests: { $sum: '$requests' },
          endpoints: {
            $push: {
              endpoint: '$_id.endpoint',
              cost: '$totalCost',
              requests: '$requests',
              avgCostPerRequest: '$avgCostPerRequest'
            }
          }
        }
      },
      { $sort: { totalCost: -1 } }
    ];

    const costAnalysis = await Usage.aggregate(pipeline);
    
    const totalCost = costAnalysis.reduce((sum, tier) => sum + tier.totalCost, 0);
    const totalRequests = costAnalysis.reduce((sum, tier) => sum + tier.totalRequests, 0);
    
    return {
      period,
      startDate: start.toDate(),
      endDate: end.toDate(),
      totalCost,
      totalRequests,
      avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      byTier: costAnalysis
    };
  }

  async exportUsageData(userId, format, startDate, endDate) {
    const start = startDate ? moment(startDate) : moment().subtract(30, 'days');
    const end = endDate ? moment(endDate) : moment();
    
    const usage = await Usage.find({
      userId,
      timestamp: {
        $gte: start.toDate(),
        $lte: end.toDate()
      }
    })
    .sort({ timestamp: -1 })
    .lean();

    if (format === 'csv') {
      const csv = this.convertToCSV(usage);
      return csv;
    }
    
    return JSON.stringify(usage, null, 2);
  }

  convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).filter(key => key !== '__v');
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value).replace(/"/g, '""');
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
  }

  handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        ws.subscriptions = data.subscriptions || ['usage', 'metrics'];
        break;
      case 'unsubscribe':
        ws.subscriptions = [];
        break;
      case 'getMetrics':
        this.sendRealTimeMetrics(ws);
        break;
      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  async sendRealTimeMetrics(ws) {
    try {
      const metrics = await this.getRealTimeMetrics();
      ws.send(JSON.stringify({
        type: 'metrics',
        data: metrics
      }));
    } catch (error) {
      logger.error('Send real-time metrics error:', error);
    }
  }

  broadcastToClients(message) {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        const subscriptions = client.subscriptions || ['usage', 'metrics'];
        if (subscriptions.includes(message.type)) {
          client.send(messageStr);
        }
      }
    });
  }

  generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS IDE - Usage Monitor Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .metric-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .chart-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold text-center mb-8 text-gray-800">NEXUS IDE Usage Monitor</h1>
        
        <!-- Real-time Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="metric-card text-white p-6 rounded-lg shadow-lg">
                <h3 class="text-lg font-semibold mb-2">Requests/Min</h3>
                <p class="text-3xl font-bold" id="requestsPerMin">-</p>
            </div>
            <div class="metric-card text-white p-6 rounded-lg shadow-lg">
                <h3 class="text-lg font-semibold mb-2">Active Users</h3>
                <p class="text-3xl font-bold" id="activeUsers">-</p>
            </div>
            <div class="metric-card text-white p-6 rounded-lg shadow-lg">
                <h3 class="text-lg font-semibold mb-2">Connected Clients</h3>
                <p class="text-3xl font-bold" id="connectedClients">-</p>
            </div>
            <div class="metric-card text-white p-6 rounded-lg shadow-lg">
                <h3 class="text-lg font-semibold mb-2">Requests/Hour</h3>
                <p class="text-3xl font-bold" id="requestsPerHour">-</p>
            </div>
        </div>
        
        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div class="chart-container p-6 rounded-lg shadow-lg">
                <h3 class="text-xl font-semibold mb-4">Usage Trends</h3>
                <canvas id="usageTrendsChart" width="400" height="200"></canvas>
            </div>
            <div class="chart-container p-6 rounded-lg shadow-lg">
                <h3 class="text-xl font-semibold mb-4">Top Endpoints</h3>
                <canvas id="endpointsChart" width="400" height="200"></canvas>
            </div>
        </div>
        
        <!-- Tables -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="bg-white p-6 rounded-lg shadow-lg">
                <h3 class="text-xl font-semibold mb-4">Top Users</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full table-auto">
                        <thead>
                            <tr class="bg-gray-50">
                                <th class="px-4 py-2 text-left">User ID</th>
                                <th class="px-4 py-2 text-left">Requests</th>
                                <th class="px-4 py-2 text-left">Tier</th>
                            </tr>
                        </thead>
                        <tbody id="topUsersTable">
                            <!-- Dynamic content -->
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-lg">
                <h3 class="text-xl font-semibold mb-4">Recent Violations</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full table-auto">
                        <thead>
                            <tr class="bg-gray-50">
                                <th class="px-4 py-2 text-left">Time</th>
                                <th class="px-4 py-2 text-left">User</th>
                                <th class="px-4 py-2 text-left">Endpoint</th>
                            </tr>
                        </thead>
                        <tbody id="violationsTable">
                            <!-- Dynamic content -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:3005/ws');
        
        ws.onopen = function() {
            console.log('Connected to Usage Monitor');
            ws.send(JSON.stringify({ type: 'subscribe', subscriptions: ['usage', 'metrics'] }));
        };
        
        ws.onmessage = function(event) {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
        };
        
        function handleWebSocketMessage(message) {
            switch(message.type) {
                case 'metrics':
                    updateRealTimeMetrics(message.data);
                    break;
                case 'usage':
                    // Handle real-time usage updates
                    break;
            }
        }
        
        function updateRealTimeMetrics(data) {
            document.getElementById('requestsPerMin').textContent = data.requestsLastMinute || 0;
            document.getElementById('activeUsers').textContent = data.activeUsers || 0;
            document.getElementById('connectedClients').textContent = data.connectedClients || 0;
            document.getElementById('requestsPerHour').textContent = data.requestsLastHour || 0;
        }
        
        // Initialize charts
        const usageTrendsCtx = document.getElementById('usageTrendsChart').getContext('2d');
        const usageTrendsChart = new Chart(usageTrendsCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Requests',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        const endpointsCtx = document.getElementById('endpointsChart').getContext('2d');
        const endpointsChart = new Chart(endpointsCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true
            }
        });
        
        // Load initial data
        async function loadInitialData() {
            try {
                // Load trends
                const trendsResponse = await fetch('/api/metrics/trends?days=7');
                const trendsData = await trendsResponse.json();
                
                usageTrendsChart.data.labels = trendsData.trends.map(t => t.date);
                usageTrendsChart.data.datasets[0].data = trendsData.trends.map(t => t.requests);
                usageTrendsChart.update();
                
                // Load endpoints
                const endpointsResponse = await fetch('/api/metrics/endpoints?limit=6');
                const endpointsData = await endpointsResponse.json();
                
                endpointsChart.data.labels = endpointsData.map(e => e.endpoint);
                endpointsChart.data.datasets[0].data = endpointsData.map(e => e.requests);
                endpointsChart.update();
                
                // Load top users
                const usersResponse = await fetch('/api/metrics/top-users?limit=10');
                const usersData = await usersResponse.json();
                
                const usersTable = document.getElementById('topUsersTable');
                usersTable.innerHTML = usersData.map(user => `
                    <tr>
                        <td class="px-4 py-2">${user.userId}</td>
                        <td class="px-4 py-2">${user.requests}</td>
                        <td class="px-4 py-2">
                            <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                ${user.subscriptionTier || 'free'}
                            </span>
                        </td>
                    </tr>
                `).join('');
                
                // Load violations
                const violationsResponse = await fetch('/api/metrics/violations?limit=10');
                const violationsData = await violationsResponse.json();
                
                const violationsTable = document.getElementById('violationsTable');
                violationsTable.innerHTML = violationsData.map(violation => `
                    <tr>
                        <td class="px-4 py-2">${new Date(violation.timestamp).toLocaleTimeString()}</td>
                        <td class="px-4 py-2">${violation.userId || 'Anonymous'}</td>
                        <td class="px-4 py-2">${violation.endpoint}</td>
                    </tr>
                `).join('');
                
            } catch (error) {
                console.error('Error loading initial data:', error);
            }
        }
        
        // Load data when page loads
        document.addEventListener('DOMContentLoaded', loadInitialData);
        
        // Refresh data every 30 seconds
        setInterval(loadInitialData, 30000);
    </script>
</body>
</html>
    `;
  }

  start(port = 3005) {
    this.server.listen(port, () => {
      logger.info(`Usage Monitor Dashboard started on port ${port}`);
      console.log(`🚀 Usage Monitor Dashboard: http://localhost:${port}/dashboard`);
      console.log(`📊 API Documentation: http://localhost:${port}/docs`);
      console.log(`🔌 WebSocket: ws://localhost:${port}/ws`);
    });
  }
}

// Export for use as module
module.exports = UsageMonitor;

// Start server if run directly
if (require.main === module) {
  const monitor = new UsageMonitor();
  monitor.start();
}