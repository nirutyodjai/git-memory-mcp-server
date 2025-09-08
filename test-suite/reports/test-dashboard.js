#!/usr/bin/env node
/**
 * NEXUS IDE - Test Results Dashboard
 * Dashboard แสดงผลการทดสอบแบบ real-time
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

// Dashboard Configuration
const DASHBOARD_CONFIG = {
    port: 3001,
    reportsDir: path.join(__dirname),
    staticDir: path.join(__dirname, 'static'),
    updateInterval: 5000, // 5 seconds
    maxReports: 50,
    enableRealTime: true
};

// Test Dashboard Server
class TestDashboard {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.reports = new Map();
        this.watchers = new Map();
        this.clients = new Set();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupFileWatchers();
    }

    setupMiddleware() {
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

        // JSON parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Static files
        if (fs.existsSync(DASHBOARD_CONFIG.staticDir)) {
            this.app.use('/static', express.static(DASHBOARD_CONFIG.staticDir));
        }

        // Logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                reports: this.reports.size,
                clients: this.clients.size
            });
        });

        // Dashboard home
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });

        // API Routes
        this.app.get('/api/reports', (req, res) => {
            const reports = Array.from(this.reports.values())
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, DASHBOARD_CONFIG.maxReports);
            
            res.json({
                success: true,
                data: reports,
                total: this.reports.size,
                timestamp: new Date().toISOString()
            });
        });

        // Get specific report
        this.app.get('/api/reports/:id', (req, res) => {
            const report = this.reports.get(req.params.id);
            if (report) {
                res.json({ success: true, data: report });
            } else {
                res.status(404).json({ success: false, error: 'Report not found' });
            }
        });

        // Get latest report
        this.app.get('/api/reports/latest', (req, res) => {
            const latest = Array.from(this.reports.values())
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
            
            if (latest) {
                res.json({ success: true, data: latest });
            } else {
                res.status(404).json({ success: false, error: 'No reports found' });
            }
        });

        // Submit test results
        this.app.post('/api/reports', (req, res) => {
            try {
                const report = this.processTestReport(req.body);
                this.reports.set(report.id, report);
                
                // Broadcast to connected clients
                this.io.emit('newReport', report);
                
                res.json({ success: true, data: report });
            } catch (error) {
                console.error('Error processing report:', error);
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // Get dashboard statistics
        this.app.get('/api/stats', (req, res) => {
            const stats = this.generateStatistics();
            res.json({ success: true, data: stats });
        });

        // Clear all reports
        this.app.delete('/api/reports', (req, res) => {
            this.reports.clear();
            this.io.emit('reportsCleared');
            res.json({ success: true, message: 'All reports cleared' });
        });
    }

    setupWebSocket() {
        this.io.on('connection', (socket) => {
            console.log(`📱 Client connected: ${socket.id}`);
            this.clients.add(socket.id);
            
            // Send current reports to new client
            const reports = Array.from(this.reports.values())
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 10);
            
            socket.emit('initialData', {
                reports,
                stats: this.generateStatistics()
            });
            
            socket.on('disconnect', () => {
                console.log(`📱 Client disconnected: ${socket.id}`);
                this.clients.delete(socket.id);
            });
            
            socket.on('requestUpdate', () => {
                socket.emit('dataUpdate', {
                    reports: Array.from(this.reports.values())
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                        .slice(0, 10),
                    stats: this.generateStatistics()
                });
            });
        });
    }

    setupFileWatchers() {
        if (!DASHBOARD_CONFIG.enableRealTime) return;
        
        // Watch for new report files
        const watcher = chokidar.watch(DASHBOARD_CONFIG.reportsDir, {
            ignored: /node_modules/,
            persistent: true,
            ignoreInitial: false
        });
        
        watcher.on('add', (filePath) => {
            if (filePath.endsWith('.json') && filePath.includes('test-report')) {
                this.loadReportFile(filePath);
            }
        });
        
        watcher.on('change', (filePath) => {
            if (filePath.endsWith('.json') && filePath.includes('test-report')) {
                this.loadReportFile(filePath);
            }
        });
        
        this.watchers.set('reports', watcher);
        
        console.log(`👀 Watching for report files in: ${DASHBOARD_CONFIG.reportsDir}`);
    }

    loadReportFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const report = JSON.parse(content);
            const processedReport = this.processTestReport(report);
            
            this.reports.set(processedReport.id, processedReport);
            
            // Broadcast to connected clients
            this.io.emit('newReport', processedReport);
            
            console.log(`📄 Loaded report: ${path.basename(filePath)}`);
        } catch (error) {
            console.error(`❌ Error loading report ${filePath}:`, error.message);
        }
    }

    processTestReport(rawReport) {
        const id = rawReport.id || this.generateReportId();
        const timestamp = rawReport.timestamp || new Date().toISOString();
        
        return {
            id,
            timestamp,
            summary: rawReport.summary || {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                duration: 0,
                successRate: 0
            },
            suites: rawReport.suites || [],
            environment: rawReport.environment || {},
            errors: rawReport.errors || [],
            warnings: rawReport.warnings || [],
            metadata: {
                source: rawReport.source || 'automated',
                version: rawReport.version || '1.0.0',
                processed: new Date().toISOString()
            }
        };
    }

    generateReportId() {
        return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    generateStatistics() {
        const reports = Array.from(this.reports.values());
        
        if (reports.length === 0) {
            return {
                totalReports: 0,
                averageSuccessRate: 0,
                totalTests: 0,
                totalDuration: 0,
                trends: {
                    successRate: [],
                    testCount: [],
                    duration: []
                }
            };
        }
        
        const totalTests = reports.reduce((sum, r) => sum + (r.summary.total || 0), 0);
        const totalDuration = reports.reduce((sum, r) => sum + (r.summary.duration || 0), 0);
        const averageSuccessRate = reports.reduce((sum, r) => sum + (r.summary.successRate || 0), 0) / reports.length;
        
        // Generate trends (last 10 reports)
        const recentReports = reports
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .slice(-10);
        
        return {
            totalReports: reports.length,
            averageSuccessRate: Math.round(averageSuccessRate * 100) / 100,
            totalTests,
            totalDuration: Math.round(totalDuration),
            trends: {
                successRate: recentReports.map(r => r.summary.successRate || 0),
                testCount: recentReports.map(r => r.summary.total || 0),
                duration: recentReports.map(r => Math.round((r.summary.duration || 0) / 1000))
            },
            lastUpdate: new Date().toISOString()
        };
    }

    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧪 NEXUS IDE Test Dashboard</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; color: #333; }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header h1 { color: #007bff; margin-bottom: 10px; }
        .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-left: 10px; }
        .status-online { background: #28a745; }
        .status-offline { background: #dc3545; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .stat-number { font-size: 36px; font-weight: bold; color: #007bff; margin-bottom: 5px; }
        .stat-label { font-size: 14px; color: #6c757d; }
        .chart-container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .reports-container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .report-item { border-bottom: 1px solid #eee; padding: 15px 0; display: flex; justify-content: space-between; align-items: center; }
        .report-item:last-child { border-bottom: none; }
        .report-info h4 { margin-bottom: 5px; }
        .report-meta { font-size: 12px; color: #6c757d; }
        .success-rate { font-weight: bold; padding: 5px 10px; border-radius: 15px; font-size: 12px; }
        .success-excellent { background: #d4edda; color: #155724; }
        .success-good { background: #fff3cd; color: #856404; }
        .success-poor { background: #f8d7da; color: #721c24; }
        .loading { text-align: center; padding: 40px; color: #6c757d; }
        .controls { margin-bottom: 20px; text-align: center; }
        .btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 0 5px; }
        .btn:hover { background: #0056b3; }
        .btn-danger { background: #dc3545; }
        .btn-danger:hover { background: #c82333; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 NEXUS IDE Test Dashboard</h1>
            <p>Real-time Test Results Monitoring</p>
            <span id="connectionStatus">Connecting...</span>
            <span class="status-indicator" id="statusIndicator"></span>
        </div>
        
        <div class="controls">
            <button class="btn" onclick="refreshData()">🔄 Refresh</button>
            <button class="btn" onclick="toggleAutoRefresh()">⏸️ Auto Refresh</button>
            <button class="btn btn-danger" onclick="clearReports()">🗑️ Clear All</button>
        </div>
        
        <div class="stats-grid" id="statsGrid">
            <div class="stat-card">
                <div class="stat-number" id="totalReports">-</div>
                <div class="stat-label">Total Reports</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="averageSuccess">-</div>
                <div class="stat-label">Average Success Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="totalTests">-</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="totalDuration">-</div>
                <div class="stat-label">Total Duration (s)</div>
            </div>
        </div>
        
        <div class="chart-container">
            <h3>📈 Success Rate Trend</h3>
            <canvas id="trendChart" width="400" height="200"></canvas>
        </div>
        
        <div class="reports-container">
            <h3>📋 Recent Test Reports</h3>
            <div id="reportsList" class="loading">
                Loading reports...
            </div>
        </div>
    </div>
    
    <script>
        const socket = io();
        let autoRefresh = true;
        let chart = null;
        
        // Socket event handlers
        socket.on('connect', () => {
            document.getElementById('connectionStatus').textContent = 'Connected';
            document.getElementById('statusIndicator').className = 'status-indicator status-online';
        });
        
        socket.on('disconnect', () => {
            document.getElementById('connectionStatus').textContent = 'Disconnected';
            document.getElementById('statusIndicator').className = 'status-indicator status-offline';
        });
        
        socket.on('initialData', (data) => {
            updateStats(data.stats);
            updateReports(data.reports);
            updateChart(data.stats.trends);
        });
        
        socket.on('newReport', (report) => {
            if (autoRefresh) {
                refreshData();
            }
        });
        
        socket.on('dataUpdate', (data) => {
            updateStats(data.stats);
            updateReports(data.reports);
            updateChart(data.stats.trends);
        });
        
        socket.on('reportsCleared', () => {
            document.getElementById('reportsList').innerHTML = '<p class="loading">No reports available</p>';
            updateStats({ totalReports: 0, averageSuccessRate: 0, totalTests: 0, totalDuration: 0 });
        });
        
        // Update functions
        function updateStats(stats) {
            document.getElementById('totalReports').textContent = stats.totalReports || 0;
            document.getElementById('averageSuccess').textContent = (stats.averageSuccessRate || 0).toFixed(1) + '%';
            document.getElementById('totalTests').textContent = stats.totalTests || 0;
            document.getElementById('totalDuration').textContent = stats.totalDuration || 0;
        }
        
        function updateReports(reports) {
            const container = document.getElementById('reportsList');
            
            if (!reports || reports.length === 0) {
                container.innerHTML = '<p class="loading">No reports available</p>';
                return;
            }
            
            container.innerHTML = reports.map(report => {
                const successRate = report.summary.successRate || 0;
                const successClass = successRate >= 90 ? 'success-excellent' : 
                                   successRate >= 70 ? 'success-good' : 'success-poor';
                
                return `
                    <div class="report-item">
                        <div class="report-info">
                            <h4>Test Report - ${new Date(report.timestamp).toLocaleString()}</h4>
                            <div class="report-meta">
                                Tests: ${report.summary.total} | 
                                Passed: ${report.summary.passed} | 
                                Failed: ${report.summary.failed} | 
                                Duration: ${(report.summary.duration / 1000).toFixed(1)}s
                            </div>
                        </div>
                        <div class="success-rate ${successClass}">
                            ${successRate.toFixed(1)}%
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        function updateChart(trends) {
            if (!trends || !trends.successRate) return;
            
            const ctx = document.getElementById('trendChart').getContext('2d');
            
            if (chart) {
                chart.destroy();
            }
            
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: trends.successRate.map((_, i) => `Run ${i + 1}`),
                    datasets: [{
                        label: 'Success Rate (%)',
                        data: trends.successRate,
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        }
        
        // Control functions
        function refreshData() {
            socket.emit('requestUpdate');
        }
        
        function toggleAutoRefresh() {
            autoRefresh = !autoRefresh;
            const btn = event.target;
            btn.textContent = autoRefresh ? '⏸️ Auto Refresh' : '▶️ Auto Refresh';
        }
        
        function clearReports() {
            if (confirm('Are you sure you want to clear all reports?')) {
                fetch('/api/reports', { method: 'DELETE' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('All reports cleared successfully');
                        }
                    })
                    .catch(error => {
                        console.error('Error clearing reports:', error);
                        alert('Error clearing reports');
                    });
            }
        }
        
        // Auto refresh every 30 seconds
        setInterval(() => {
            if (autoRefresh) {
                refreshData();
            }
        }, 30000);
    </script>
</body>
</html>
        `;
    }

    async start() {
        return new Promise((resolve, reject) => {
            this.server.listen(DASHBOARD_CONFIG.port, (error) => {
                if (error) {
                    console.error('❌ Failed to start dashboard:', error);
                    reject(error);
                } else {
                    console.log(`🚀 Test Dashboard started at http://localhost:${DASHBOARD_CONFIG.port}`);
                    console.log(`📊 Dashboard URL: http://localhost:${DASHBOARD_CONFIG.port}`);
                    console.log(`🔗 API Base URL: http://localhost:${DASHBOARD_CONFIG.port}/api`);
                    resolve();
                }
            });
        });
    }

    async stop() {
        // Close file watchers
        for (const [name, watcher] of this.watchers) {
            await watcher.close();
            console.log(`👀 Stopped watching: ${name}`);
        }
        
        // Close server
        return new Promise((resolve) => {
            this.server.close(() => {
                console.log('🛑 Test Dashboard stopped');
                resolve();
            });
        });
    }
}

// Main execution
if (require.main === module) {
    const dashboard = new TestDashboard();
    
    dashboard.start()
        .then(() => {
            console.log('✅ Dashboard is ready!');
        })
        .catch(error => {
            console.error('💥 Failed to start dashboard:', error);
            process.exit(1);
        });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down dashboard...');
        await dashboard.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Shutting down dashboard...');
        await dashboard.stop();
        process.exit(0);
    });
}

module.exports = TestDashboard;