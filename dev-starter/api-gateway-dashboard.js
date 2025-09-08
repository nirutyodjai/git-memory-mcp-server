/**
 * Git Memory MCP Server - API Gateway Dashboard
 * Web Dashboard สำหรับแสดงข้อมูลการตรวจสอบ API Gateway แบบ real-time
 * 
 * Features:
 * - Real-time metrics visualization
 * - Interactive charts and graphs
 * - Alert management
 * - System health monitoring
 * - Request/response analytics
 * - Upstream server status
 * - Performance insights
 * - Historical data analysis
 * - Responsive design
 * - WebSocket real-time updates
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs').promises;

class APIGatewayDashboard {
    constructor(config = {}) {
        this.config = {
            port: 8080,
            host: '0.0.0.0',
            staticPath: path.join(__dirname, 'dashboard-static'),
            enableAuth: false,
            authToken: 'dashboard-token',
            updateInterval: 1000,
            ...config
        };
        
        this.app = express();
        this.server = null;
        this.wss = null;
        this.clients = new Set();
        this.monitoring = null;
        
        this.setupExpress();
        this.setupRoutes();
    }
    
    /**
     * Setup Express application
     */
    setupExpress() {
        // Middleware
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });
        
        // Authentication middleware
        if (this.config.enableAuth) {
            this.app.use('/api', this.authMiddleware.bind(this));
        }
        
        // Static files
        this.app.use(express.static(this.config.staticPath));
        
        console.log('🌐 Express application configured');
    }
    
    /**
     * Setup routes
     */
    setupRoutes() {
        // Dashboard home
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
        
        // API routes
        this.app.get('/api/health', this.healthHandler.bind(this));
        this.app.get('/api/metrics', this.metricsHandler.bind(this));
        this.app.get('/api/alerts', this.alertsHandler.bind(this));
        this.app.get('/api/upstreams', this.upstreamsHandler.bind(this));
        this.app.get('/api/system', this.systemHandler.bind(this));
        this.app.get('/api/stats', this.statsHandler.bind(this));
        
        // Alert management
        this.app.post('/api/alerts/:id/acknowledge', this.acknowledgeAlertHandler.bind(this));
        this.app.post('/api/alerts/:id/resolve', this.resolveAlertHandler.bind(this));
        
        // Export data
        this.app.get('/api/export/:format', this.exportHandler.bind(this));
        
        console.log('🛣️ Dashboard routes configured');
    }
    
    /**
     * Authentication middleware
     */
    authMiddleware(req, res, next) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token || token !== this.config.authToken) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        
        next();
    }
    
    /**
     * Health handler
     */
    async healthHandler(req, res) {
        res.json({
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: '1.0.0'
            }
        });
    }
    
    /**
     * Metrics handler
     */
    async metricsHandler(req, res) {
        if (!this.monitoring) {
            return res.status(503).json({
                success: false,
                error: 'Monitoring not available'
            });
        }
        
        try {
            const data = this.monitoring.getDashboardData();
            res.json({
                success: true,
                data
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * Alerts handler
     */
    async alertsHandler(req, res) {
        if (!this.monitoring) {
            return res.status(503).json({
                success: false,
                error: 'Monitoring not available'
            });
        }
        
        try {
            const alerts = Array.from(this.monitoring.alerts.values())
                .sort((a, b) => b.timestamp - a.timestamp);
            
            res.json({
                success: true,
                data: alerts
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * Upstreams handler
     */
    async upstreamsHandler(req, res) {
        // This would need to be connected to the routes manager
        res.json({
            success: true,
            data: []
        });
    }
    
    /**
     * System handler
     */
    async systemHandler(req, res) {
        const systemInfo = {
            node: {
                version: process.version,
                platform: process.platform,
                arch: process.arch,
                uptime: process.uptime()
            },
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            env: process.env.NODE_ENV || 'development'
        };
        
        res.json({
            success: true,
            data: systemInfo
        });
    }
    
    /**
     * Stats handler
     */
    async statsHandler(req, res) {
        if (!this.monitoring) {
            return res.status(503).json({
                success: false,
                error: 'Monitoring not available'
            });
        }
        
        try {
            const stats = this.monitoring.getStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * Acknowledge alert handler
     */
    async acknowledgeAlertHandler(req, res) {
        const { id } = req.params;
        
        if (!this.monitoring) {
            return res.status(503).json({
                success: false,
                error: 'Monitoring not available'
            });
        }
        
        try {
            this.monitoring.acknowledgeAlert(id);
            res.json({
                success: true,
                message: 'Alert acknowledged'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * Resolve alert handler
     */
    async resolveAlertHandler(req, res) {
        const { id } = req.params;
        
        if (!this.monitoring) {
            return res.status(503).json({
                success: false,
                error: 'Monitoring not available'
            });
        }
        
        try {
            this.monitoring.resolveAlert(id);
            res.json({
                success: true,
                message: 'Alert resolved'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * Export handler
     */
    async exportHandler(req, res) {
        const { format } = req.params;
        
        if (!this.monitoring) {
            return res.status(503).json({
                success: false,
                error: 'Monitoring not available'
            });
        }
        
        try {
            const data = await this.monitoring.exportMetrics(format);
            
            if (format === 'json') {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="metrics-${Date.now()}.json"`);
            }
            
            res.send(data);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * Generate dashboard HTML
     */
    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Gateway Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            line-height: 1.6;
        }
        
        .header {
            background: #1e293b;
            padding: 1rem 2rem;
            border-bottom: 1px solid #334155;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            color: #60a5fa;
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10b981;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .container {
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .card {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 1.5rem;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .card-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #f1f5f9;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .metric-label {
            color: #94a3b8;
        }
        
        .metric-value {
            font-weight: 600;
            color: #f1f5f9;
        }
        
        .metric-value.success {
            color: #10b981;
        }
        
        .metric-value.warning {
            color: #f59e0b;
        }
        
        .metric-value.error {
            color: #ef4444;
        }
        
        .chart-container {
            height: 200px;
            background: #0f172a;
            border-radius: 4px;
            margin-top: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
        }
        
        .alerts-section {
            margin-top: 2rem;
        }
        
        .alert {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 6px;
            padding: 1rem;
            margin-bottom: 0.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .alert.critical {
            border-left: 4px solid #ef4444;
        }
        
        .alert.warning {
            border-left: 4px solid #f59e0b;
        }
        
        .alert.info {
            border-left: 4px solid #3b82f6;
        }
        
        .alert-content {
            flex: 1;
        }
        
        .alert-title {
            font-weight: 600;
            margin-bottom: 0.25rem;
        }
        
        .alert-message {
            color: #94a3b8;
            font-size: 0.9rem;
        }
        
        .alert-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background-color 0.2s;
        }
        
        .btn-primary {
            background: #3b82f6;
            color: white;
        }
        
        .btn-primary:hover {
            background: #2563eb;
        }
        
        .btn-secondary {
            background: #6b7280;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #4b5563;
        }
        
        .loading {
            text-align: center;
            color: #64748b;
            padding: 2rem;
        }
        
        .error {
            background: #7f1d1d;
            color: #fecaca;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .header {
                padding: 1rem;
            }
            
            .grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 API Gateway Dashboard</h1>
        <div class="status-indicator">
            <div class="status-dot" id="connectionStatus"></div>
            <span id="connectionText">Connecting...</span>
        </div>
    </div>
    
    <div class="container">
        <div id="error-container"></div>
        
        <div class="grid">
            <div class="card">
                <div class="card-title">📊 Real-time Metrics</div>
                <div class="metric">
                    <span class="metric-label">Requests/sec</span>
                    <span class="metric-value" id="rps">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Avg Response Time</span>
                    <span class="metric-value" id="avgResponseTime">0ms</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Error Rate</span>
                    <span class="metric-value" id="errorRate">0%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Active Requests</span>
                    <span class="metric-value" id="activeRequests">0</span>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">🖥️ System Health</div>
                <div class="metric">
                    <span class="metric-label">Memory Usage</span>
                    <span class="metric-value" id="memoryUsage">0%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">CPU Usage</span>
                    <span class="metric-value" id="cpuUsage">0%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Uptime</span>
                    <span class="metric-value" id="uptime">0s</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Load Average</span>
                    <span class="metric-value" id="loadAvg">0.00</span>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">🎯 Request Statistics</div>
                <div class="metric">
                    <span class="metric-label">Total Requests</span>
                    <span class="metric-value" id="totalRequests">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Responses</span>
                    <span class="metric-value" id="totalResponses">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Errors</span>
                    <span class="metric-value" id="totalErrors">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Success Rate</span>
                    <span class="metric-value" id="successRate">100%</span>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">📈 Performance Chart</div>
                <div class="chart-container">
                    <canvas id="performanceChart" width="400" height="200"></canvas>
                </div>
            </div>
        </div>
        
        <div class="alerts-section">
            <h2 style="margin-bottom: 1rem; color: #f1f5f9;">🚨 Active Alerts</h2>
            <div id="alerts-container">
                <div class="loading">Loading alerts...</div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        class DashboardClient {
            constructor() {
                this.ws = null;
                this.reconnectAttempts = 0;
                this.maxReconnectAttempts = 5;
                this.reconnectDelay = 1000;
                this.performanceChart = null;
                this.chartData = {
                    labels: [],
                    datasets: [{
                        label: 'Requests/sec',
                        data: [],
                        borderColor: 'rgb(96, 165, 250)',
                        backgroundColor: 'rgba(96, 165, 250, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Response Time (ms)',
                        data: [],
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }]
                };
                
                this.connect();
                this.setupEventListeners();
                this.initializeChart();
            }
            
            connect() {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = \`\${protocol}//\${window.location.host}/ws\`;
                
                try {
                    this.ws = new WebSocket(wsUrl);
                    
                    this.ws.onopen = () => {
                        console.log('Connected to dashboard');
                        this.updateConnectionStatus(true);
                        this.reconnectAttempts = 0;
                    };
                    
                    this.ws.onmessage = (event) => {
                        try {
                            const message = JSON.parse(event.data);
                            this.handleMessage(message);
                        } catch (error) {
                            console.error('Failed to parse message:', error);
                        }
                    };
                    
                    this.ws.onclose = () => {
                        console.log('Disconnected from dashboard');
                        this.updateConnectionStatus(false);
                        this.scheduleReconnect();
                    };
                    
                    this.ws.onerror = (error) => {
                        console.error('WebSocket error:', error);
                        this.updateConnectionStatus(false);
                    };
                    
                } catch (error) {
                    console.error('Failed to connect:', error);
                    this.updateConnectionStatus(false);
                    this.scheduleReconnect();
                }
            }
            
            scheduleReconnect() {
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
                    
                    setTimeout(() => {
                        console.log(\`Reconnecting... (attempt \${this.reconnectAttempts})\`);
                        this.connect();
                    }, delay);
                }
            }
            
            updateConnectionStatus(connected) {
                const statusDot = document.getElementById('connectionStatus');
                const statusText = document.getElementById('connectionText');
                
                if (connected) {
                    statusDot.style.background = '#10b981';
                    statusText.textContent = 'Connected';
                } else {
                    statusDot.style.background = '#ef4444';
                    statusText.textContent = 'Disconnected';
                }
            }
            
            handleMessage(message) {
                switch (message.type) {
                    case 'initialData':
                        this.updateDashboard(message.data);
                        break;
                    case 'metrics':
                        this.updateMetrics(message.data);
                        break;
                    case 'systemMetrics':
                        this.updateSystemMetrics(message.data);
                        break;
                    case 'alert':
                        this.addAlert(message.data);
                        break;
                    case 'alertAcknowledged':
                    case 'alertResolved':
                        this.updateAlert(message.data);
                        break;
                }
            }
            
            updateDashboard(data) {
                this.updateMetrics(data.realTime);
                this.updateAlerts(data.alerts);
            }
            
            updateMetrics(metrics) {
                document.getElementById('rps').textContent = metrics.requestsPerSecond?.toFixed(2) || '0';
                document.getElementById('avgResponseTime').textContent = \`\${metrics.avgResponseTime?.toFixed(2) || 0}ms\`;
                document.getElementById('errorRate').textContent = \`\${metrics.errorRate?.toFixed(2) || 0}%\`;
                document.getElementById('activeRequests').textContent = metrics.currentRequests || '0';
                document.getElementById('totalRequests').textContent = metrics.totalRequests || '0';
                document.getElementById('totalResponses').textContent = metrics.totalResponses || '0';
                document.getElementById('totalErrors').textContent = metrics.totalErrors || '0';
                
                const successRate = metrics.totalRequests > 0 ? 
                    ((metrics.totalResponses - metrics.totalErrors) / metrics.totalRequests * 100) : 100;
                document.getElementById('successRate').textContent = \`\${successRate.toFixed(2)}%\`;
                
                // Update colors based on values
                this.updateMetricColor('errorRate', metrics.errorRate, 5, 10);
                this.updateMetricColor('avgResponseTime', metrics.avgResponseTime, 1000, 3000);
                
                // Update performance chart
                this.updatePerformanceChart(metrics);
            }
            
            updateSystemMetrics(metrics) {
                if (metrics.memory) {
                    document.getElementById('memoryUsage').textContent = \`\${metrics.memory.usage?.toFixed(2) || 0}%\`;
                    this.updateMetricColor('memoryUsage', metrics.memory.usage, 70, 90);
                }
                
                if (metrics.cpu) {
                    document.getElementById('cpuUsage').textContent = \`\${metrics.cpu.usage?.toFixed(2) || 0}%\`;
                    this.updateMetricColor('cpuUsage', metrics.cpu.usage, 70, 90);
                }
                
                if (metrics.system) {
                    document.getElementById('uptime').textContent = this.formatUptime(metrics.system.uptime);
                    
                    if (metrics.system.loadAvg && metrics.system.loadAvg.length > 0) {
                        document.getElementById('loadAvg').textContent = metrics.system.loadAvg[0].toFixed(2);
                    }
                }
            }
            
            updateMetricColor(elementId, value, warningThreshold, errorThreshold) {
                const element = document.getElementById(elementId);
                if (!element) return;
                
                element.className = 'metric-value';
                
                if (value >= errorThreshold) {
                    element.classList.add('error');
                } else if (value >= warningThreshold) {
                    element.classList.add('warning');
                } else {
                    element.classList.add('success');
                }
            }
            
            updateAlerts(alerts) {
                const container = document.getElementById('alerts-container');
                
                if (!alerts || alerts.length === 0) {
                    container.innerHTML = '<div class="loading">No active alerts</div>';
                    return;
                }
                
                container.innerHTML = alerts.map(alert => this.renderAlert(alert)).join('');
            }
            
            addAlert(alert) {
                const container = document.getElementById('alerts-container');
                const alertElement = document.createElement('div');
                alertElement.innerHTML = this.renderAlert(alert);
                container.insertBefore(alertElement.firstChild, container.firstChild);
            }
            
            renderAlert(alert) {
                const timestamp = new Date(alert.timestamp).toLocaleString();
                
                return \`
                    <div class="alert \${alert.severity}" data-alert-id="\${alert.id}">
                        <div class="alert-content">
                            <div class="alert-title">\${alert.type.replace(/_/g, ' ').toUpperCase()}</div>
                            <div class="alert-message">\${alert.data.message}</div>
                            <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.25rem;">\${timestamp}</div>
                        </div>
                        <div class="alert-actions">
                            \${!alert.acknowledged ? \`<button class="btn btn-secondary" onclick="dashboard.acknowledgeAlert('\${alert.id}')">Acknowledge</button>\` : ''}
                            \${!alert.resolved ? \`<button class="btn btn-primary" onclick="dashboard.resolveAlert('\${alert.id}')">Resolve</button>\` : ''}
                        </div>
                    </div>
                \`;
            }
            
            async acknowledgeAlert(alertId) {
                try {
                    const response = await fetch(\`/api/alerts/\${alertId}/acknowledge\`, {
                        method: 'POST'
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to acknowledge alert');
                    }
                    
                    console.log('Alert acknowledged');
                } catch (error) {
                    console.error('Error acknowledging alert:', error);
                }
            }
            
            async resolveAlert(alertId) {
                try {
                    const response = await fetch(\`/api/alerts/\${alertId}/resolve\`, {
                        method: 'POST'
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to resolve alert');
                    }
                    
                    console.log('Alert resolved');
                } catch (error) {
                    console.error('Error resolving alert:', error);
                }
            }
            
            formatUptime(seconds) {
                if (!seconds) return '0s';
                
                const days = Math.floor(seconds / 86400);
                const hours = Math.floor((seconds % 86400) / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = Math.floor(seconds % 60);
                
                if (days > 0) {
                    return \`\${days}d \${hours}h\`;
                } else if (hours > 0) {
                    return \`\${hours}h \${minutes}m\`;
                } else if (minutes > 0) {
                    return \`\${minutes}m \${secs}s\`;
                } else {
                    return \`\${secs}s\`;
                }
            }
            
            initializeChart() {
                const ctx = document.getElementById('performanceChart');
                if (!ctx) return;
                
                this.performanceChart = new Chart(ctx, {
                    type: 'line',
                    data: this.chartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Real-time Performance Metrics',
                                color: '#f1f5f9'
                            },
                            legend: {
                                labels: {
                                    color: '#f1f5f9'
                                }
                            }
                        },
                        scales: {
                            x: {
                                ticks: {
                                    color: '#94a3b8'
                                },
                                grid: {
                                    color: '#334155'
                                }
                            },
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                ticks: {
                                    color: '#94a3b8'
                                },
                                grid: {
                                    color: '#334155'
                                },
                                title: {
                                    display: true,
                                    text: 'Requests/sec',
                                    color: '#94a3b8'
                                }
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                ticks: {
                                    color: '#94a3b8'
                                },
                                grid: {
                                    drawOnChartArea: false,
                                    color: '#334155'
                                },
                                title: {
                                    display: true,
                                    text: 'Response Time (ms)',
                                    color: '#94a3b8'
                                }
                            }
                        },
                        elements: {
                            point: {
                                radius: 3,
                                hoverRadius: 6
                            }
                        }
                    }
                });
            }
            
            updatePerformanceChart(metrics) {
                if (!this.performanceChart) return;
                
                const now = new Date();
                const timeLabel = now.toLocaleTimeString();
                
                // Add new data point
                this.chartData.labels.push(timeLabel);
                this.chartData.datasets[0].data.push(metrics.requestsPerSecond || 0);
                this.chartData.datasets[1].data.push(metrics.avgResponseTime || 0);
                
                // Keep only last 20 data points
                const maxDataPoints = 20;
                if (this.chartData.labels.length > maxDataPoints) {
                    this.chartData.labels.shift();
                    this.chartData.datasets[0].data.shift();
                    this.chartData.datasets[1].data.shift();
                }
                
                // Update chart
                this.performanceChart.update('none');
            }
            
            setupEventListeners() {
                // Add any additional event listeners here
            }
        }
        
        // Initialize dashboard
        const dashboard = new DashboardClient();
        
        // Fallback: Load initial data via HTTP if WebSocket fails
        setTimeout(async () => {
            if (!dashboard.ws || dashboard.ws.readyState !== WebSocket.OPEN) {
                try {
                    const response = await fetch('/api/metrics');
                    const data = await response.json();
                    
                    if (data.success) {
                        dashboard.updateDashboard(data.data);
                    }
                } catch (error) {
                    console.error('Failed to load initial data:', error);
                    document.getElementById('error-container').innerHTML = 
                        '<div class="error">Failed to connect to API Gateway. Please check if the server is running.</div>';
                }
            }
        }, 3000);
    </script>
</body>
</html>
        `;
    }
    
    /**
     * Setup WebSocket server
     */
    setupWebSocket() {
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.wss.on('connection', (ws, req) => {
            console.log('📊 Dashboard client connected');
            this.clients.add(ws);
            
            // Add client to monitoring if available
            if (this.monitoring) {
                this.monitoring.addDashboardClient(ws);
            }
            
            ws.on('close', () => {
                console.log('📊 Dashboard client disconnected');
                this.clients.delete(ws);
                
                if (this.monitoring) {
                    this.monitoring.removeDashboardClient(ws);
                }
            });
            
            ws.on('error', (error) => {
                console.error('📊 Dashboard WebSocket error:', error);
                this.clients.delete(ws);
            });
        });
        
        console.log('🔌 WebSocket server configured');
    }
    
    /**
     * Set monitoring instance
     */
    setMonitoring(monitoring) {
        this.monitoring = monitoring;
        console.log('📊 Monitoring instance connected to dashboard');
    }
    
    /**
     * Start dashboard server
     */
    async start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = http.createServer(this.app);
                
                // Setup WebSocket
                this.setupWebSocket();
                
                this.server.listen(this.config.port, this.config.host, () => {
                    console.log(`🌐 Dashboard server running on http://${this.config.host}:${this.config.port}`);
                    resolve();
                });
                
                this.server.on('error', (error) => {
                    console.error('❌ Dashboard server error:', error);
                    reject(error);
                });
                
            } catch (error) {
                console.error('❌ Failed to start dashboard:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Stop dashboard server
     */
    async stop() {
        console.log('🛑 Stopping dashboard server...');
        
        // Close WebSocket connections
        if (this.wss) {
            this.wss.clients.forEach(ws => {
                ws.close();
            });
            this.wss.close();
        }
        
        // Close HTTP server
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    console.log('✅ Dashboard server stopped');
                    resolve();
                });
            });
        }
    }
    
    /**
     * Get dashboard URL
     */
    getUrl() {
        return `http://${this.config.host}:${this.config.port}`;
    }
}

// Export class
module.exports = APIGatewayDashboard;

// CLI interface
if (require.main === module) {
    const dashboard = new APIGatewayDashboard({
        port: 8080,
        host: '0.0.0.0'
    });
    
    dashboard.start().then(() => {
        console.log('🎉 Dashboard started successfully');
        console.log(`🌐 Open ${dashboard.getUrl()} in your browser`);
    }).catch((error) => {
        console.error('❌ Failed to start dashboard:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down...');
        await dashboard.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down...');
        await dashboard.stop();
        process.exit(0);
    });
}