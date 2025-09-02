#!/usr/bin/env node
/**
 * Enhanced Monitoring Dashboard - Real-time monitoring สำหรับ Git Memory MCP Server System
 * รองรับการแสดงผลแบบ real-time, กราฟประสิทธิภาพ, และ WebSocket connections
 */

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class EnhancedMonitoringDashboard {
    constructor() {
        this.port = 3000;
        this.wsPort = 3001;
        this.coordinatorUrl = 'http://localhost:9000';
        this.servers = [];
        this.performanceData = {
            cpu: [],
            memory: [],
            network: [],
            serverHealth: []
        };
        this.wsClients = new Set();
        this.updateInterval = 5000; // 5 seconds
        
        this.startWebSocketServer();
        this.startHttpServer();
        this.startPerformanceMonitoring();
    }
    
    /**
     * เริ่มต้น WebSocket Server สำหรับ real-time updates
     */
    startWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 WebSocket client connected');
            this.wsClients.add(ws);
            
            // ส่งข้อมูลเริ่มต้น
            this.sendInitialData(ws);
            
            ws.on('close', () => {
                console.log('🔌 WebSocket client disconnected');
                this.wsClients.delete(ws);
            });
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('❌ WebSocket message error:', error.message);
                }
            });
        });
        
        console.log(`🌐 WebSocket Server running on port ${this.wsPort}`);
    }
    
    /**
     * เริ่มต้น HTTP Server สำหรับ Dashboard UI
     */
    startHttpServer() {
        const server = http.createServer((req, res) => {
            const url = new URL(req.url, `http://localhost:${this.port}`);
            const pathname = url.pathname;
            
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            if (pathname === '/') {
                this.serveDashboard(res);
            } else if (pathname === '/api/status') {
                this.serveStatus(res);
            } else if (pathname === '/api/performance') {
                this.servePerformanceData(res);
            } else if (pathname === '/api/servers') {
                this.serveServersData(res);
            } else if (pathname === '/api/analytics') {
                this.serveAnalytics(res);
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`🚀 Enhanced Monitoring Dashboard running on http://localhost:${this.port}`);
            console.log(`📊 Real-time WebSocket on port ${this.wsPort}`);
        });
    }
    
    /**
     * เริ่มต้นการตรวจสอบประสิทธิภาพแบบ real-time
     */
    startPerformanceMonitoring() {
        setInterval(async () => {
            try {
                await this.collectPerformanceData();
                await this.updateServerStatus();
                this.broadcastToClients();
            } catch (error) {
                console.error('❌ Performance monitoring error:', error.message);
            }
        }, this.updateInterval);
        
        console.log('📈 Performance monitoring started');
    }
    
    /**
     * รวบรวมข้อมูลประสิทธิภาพ
     */
    async collectPerformanceData() {
        const timestamp = new Date();
        
        // CPU Usage
        const cpuUsage = await this.getCPUUsage();
        this.performanceData.cpu.push({ timestamp, value: cpuUsage });
        
        // Memory Usage
        const memoryUsage = process.memoryUsage();
        this.performanceData.memory.push({
            timestamp,
            rss: memoryUsage.rss / 1024 / 1024, // MB
            heapUsed: memoryUsage.heapUsed / 1024 / 1024,
            heapTotal: memoryUsage.heapTotal / 1024 / 1024,
            external: memoryUsage.external / 1024 / 1024
        });
        
        // Network Stats (placeholder)
        this.performanceData.network.push({
            timestamp,
            connections: this.wsClients.size,
            activeServers: this.servers.filter(s => s.status === 'active').length
        });
        
        // Keep only last 100 data points
        Object.keys(this.performanceData).forEach(key => {
            if (this.performanceData[key].length > 100) {
                this.performanceData[key] = this.performanceData[key].slice(-100);
            }
        });
    }
    
    /**
     * อัปเดตสถานะ servers
     */
    async updateServerStatus() {
        try {
            const response = await this.fetchCoordinatorData('/status');
            if (response && response.servers) {
                this.servers = response.servers.list || [];
                
                // เก็บข้อมูลสุขภาพ servers
                const healthData = {
                    timestamp: new Date(),
                    total: response.servers.total,
                    active: response.servers.active,
                    inactive: response.servers.inactive,
                    healthPercentage: (response.servers.active / response.servers.total) * 100
                };
                
                this.performanceData.serverHealth.push(healthData);
                
                if (this.performanceData.serverHealth.length > 100) {
                    this.performanceData.serverHealth = this.performanceData.serverHealth.slice(-100);
                }
            }
        } catch (error) {
            console.error('❌ Error updating server status:', error.message);
        }
    }
    
    /**
     * ดึงข้อมูลจาก Coordinator
     */
    async fetchCoordinatorData(endpoint) {
        return new Promise((resolve, reject) => {
            const req = http.get(`${this.coordinatorUrl}${endpoint}`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            req.on('error', reject);
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }
    
    /**
     * คำนวณ CPU Usage
     */
    async getCPUUsage() {
        return new Promise((resolve) => {
            const startUsage = process.cpuUsage();
            setTimeout(() => {
                const endUsage = process.cpuUsage(startUsage);
                const totalUsage = endUsage.user + endUsage.system;
                const percentage = (totalUsage / 1000000) * 100; // Convert to percentage
                resolve(Math.min(percentage, 100));
            }, 100);
        });
    }
    
    /**
     * ส่งข้อมูลเริ่มต้นไปยัง WebSocket client
     */
    async sendInitialData(ws) {
        try {
            const status = await this.fetchCoordinatorData('/status');
            ws.send(JSON.stringify({
                type: 'initial_data',
                data: {
                    status,
                    performance: this.performanceData,
                    timestamp: new Date()
                }
            }));
        } catch (error) {
            console.error('❌ Error sending initial data:', error.message);
        }
    }
    
    /**
     * จัดการ WebSocket messages
     */
    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
                break;
            case 'request_update':
                this.sendInitialData(ws);
                break;
            default:
                console.log('🔔 Unknown WebSocket message type:', data.type);
        }
    }
    
    /**
     * ส่งข้อมูลไปยัง WebSocket clients ทั้งหมด
     */
    broadcastToClients() {
        if (this.wsClients.size === 0) return;
        
        const updateData = {
            type: 'performance_update',
            data: {
                performance: this.performanceData,
                servers: this.servers,
                timestamp: new Date()
            }
        };
        
        const message = JSON.stringify(updateData);
        
        this.wsClients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
    
    /**
     * แสดง Dashboard HTML
     */
    serveDashboard(res) {
        const html = this.generateDashboardHTML();
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }
    
    /**
     * แสดงข้อมูลสถานะ
     */
    async serveStatus(res) {
        try {
            const status = await this.fetchCoordinatorData('/status');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(status, null, 2));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    
    /**
     * แสดงข้อมูลประสิทธิภาพ
     */
    servePerformanceData(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            performance: this.performanceData,
            timestamp: new Date()
        }, null, 2));
    }
    
    /**
     * แสดงข้อมูล servers
     */
    serveServersData(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            servers: this.servers,
            summary: {
                total: this.servers.length,
                active: this.servers.filter(s => s.status === 'active').length,
                inactive: this.servers.filter(s => s.status === 'inactive').length
            },
            timestamp: new Date()
        }, null, 2));
    }
    
    /**
     * แสดงข้อมูลการวิเคราะห์
     */
    serveAnalytics(res) {
        const analytics = this.generateAnalytics();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(analytics, null, 2));
    }
    
    /**
     * สร้างข้อมูลการวิเคราะห์
     */
    generateAnalytics() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        // Filter data from last hour
        const recentHealth = this.performanceData.serverHealth.filter(
            data => new Date(data.timestamp) > oneHourAgo
        );
        
        const recentMemory = this.performanceData.memory.filter(
            data => new Date(data.timestamp) > oneHourAgo
        );
        
        return {
            uptime: {
                total: process.uptime(),
                formatted: this.formatUptime(process.uptime())
            },
            serverHealth: {
                current: this.servers.filter(s => s.status === 'active').length,
                total: this.servers.length,
                percentage: this.servers.length > 0 ? 
                    (this.servers.filter(s => s.status === 'active').length / this.servers.length) * 100 : 0,
                trend: this.calculateTrend(recentHealth, 'healthPercentage')
            },
            memory: {
                current: process.memoryUsage(),
                trend: this.calculateTrend(recentMemory, 'heapUsed')
            },
            performance: {
                avgResponseTime: this.calculateAverageResponseTime(),
                peakConnections: Math.max(...this.performanceData.network.map(n => n.connections), 0)
            },
            timestamp: now
        };
    }
    
    /**
     * คำนวณแนวโน้ม
     */
    calculateTrend(data, field) {
        if (data.length < 2) return 'stable';
        
        const recent = data.slice(-10); // Last 10 data points
        const first = recent[0][field];
        const last = recent[recent.length - 1][field];
        
        const change = ((last - first) / first) * 100;
        
        if (change > 5) return 'increasing';
        if (change < -5) return 'decreasing';
        return 'stable';
    }
    
    /**
     * คำนวณเวลาตอบสนองเฉลี่ย
     */
    calculateAverageResponseTime() {
        // Placeholder - ในการใช้งานจริงควรเก็บข้อมูลจริง
        return Math.random() * 100 + 50; // 50-150ms
    }
    
    /**
     * จัดรูปแบบ uptime
     */
    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        return `${days}d ${hours}h ${minutes}m ${secs}s`;
    }
    
    /**
     * สร้าง Dashboard HTML
     */
    generateDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Enhanced Git Memory MCP Server Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-online { background-color: #4CAF50; }
        .status-offline { background-color: #f44336; }
        .status-warning { background-color: #ff9800; }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .card h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.2em;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .metric-value {
            font-weight: bold;
            font-size: 1.1em;
        }
        
        .chart-container {
            position: relative;
            height: 300px;
            margin-top: 15px;
        }
        
        .servers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .server-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 10px;
            border-left: 4px solid #ddd;
        }
        
        .server-card.active {
            border-left-color: #4CAF50;
            background: #e8f5e8;
        }
        
        .server-card.inactive {
            border-left-color: #f44336;
            background: #ffeaea;
        }
        
        .server-name {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .server-ports {
            font-size: 0.9em;
            color: #666;
        }
        
        .real-time-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            z-index: 1000;
        }
        
        .real-time-indicator.disconnected {
            background: rgba(244, 67, 54, 0.9);
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .pulse {
            animation: pulse 2s infinite;
        }
        
        .footer {
            text-align: center;
            color: white;
            margin-top: 30px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="real-time-indicator" id="connectionStatus">
        🔌 เชื่อมต่อ Real-time
    </div>
    
    <div class="container">
        <div class="header">
            <h1>🚀 Enhanced Git Memory MCP Server Dashboard</h1>
            <p>ระบบตรวจสอบแบบ Real-time สำหรับ 1000 MCP Servers</p>
        </div>
        
        <div class="dashboard-grid">
            <div class="card">
                <h3>📊 สถานะระบบ</h3>
                <div class="metric">
                    <span>Servers ทั้งหมด:</span>
                    <span class="metric-value" id="totalServers">-</span>
                </div>
                <div class="metric">
                    <span>🟢 Servers ที่ทำงาน:</span>
                    <span class="metric-value" id="activeServers">-</span>
                </div>
                <div class="metric">
                    <span>🔴 Servers ที่หยุด:</span>
                    <span class="metric-value" id="inactiveServers">-</span>
                </div>
                <div class="metric">
                    <span>📈 อัตราการทำงาน:</span>
                    <span class="metric-value" id="healthPercentage">-</span>
                </div>
            </div>
            
            <div class="card">
                <h3>💾 การใช้หน่วยความจำ</h3>
                <div class="metric">
                    <span>RSS:</span>
                    <span class="metric-value" id="memoryRSS">-</span>
                </div>
                <div class="metric">
                    <span>Heap Used:</span>
                    <span class="metric-value" id="memoryHeapUsed">-</span>
                </div>
                <div class="metric">
                    <span>Heap Total:</span>
                    <span class="metric-value" id="memoryHeapTotal">-</span>
                </div>
                <div class="chart-container">
                    <canvas id="memoryChart"></canvas>
                </div>
            </div>
            
            <div class="card">
                <h3>🔥 ประสิทธิภาพ CPU</h3>
                <div class="metric">
                    <span>CPU Usage:</span>
                    <span class="metric-value" id="cpuUsage">-</span>
                </div>
                <div class="metric">
                    <span>Uptime:</span>
                    <span class="metric-value" id="uptime">-</span>
                </div>
                <div class="chart-container">
                    <canvas id="cpuChart"></canvas>
                </div>
            </div>
            
            <div class="card">
                <h3>🌐 เครือข่าย</h3>
                <div class="metric">
                    <span>WebSocket Connections:</span>
                    <span class="metric-value" id="wsConnections">-</span>
                </div>
                <div class="metric">
                    <span>Active Connections:</span>
                    <span class="metric-value" id="activeConnections">-</span>
                </div>
                <div class="chart-container">
                    <canvas id="networkChart"></canvas>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h3>🖥️ สถานะ Servers แบบ Real-time</h3>
            <div class="servers-grid" id="serversGrid">
                <!-- Servers will be populated here -->
            </div>
        </div>
        
        <div class="card">
            <h3>📈 กราฟสุขภาพระบบ</h3>
            <div class="chart-container">
                <canvas id="healthChart"></canvas>
            </div>
        </div>
        
        <div class="footer">
            <p>🚀 Git Memory MCP Server System | Enhanced Monitoring Dashboard</p>
            <p>Last Updated: <span id="lastUpdate">-</span></p>
        </div>
    </div>
    
    <script>
        // WebSocket connection
        let ws;
        let charts = {};
        
        // Initialize WebSocket connection
        function initWebSocket() {
            ws = new WebSocket('ws://localhost:3001');
            
            ws.onopen = function() {
                console.log('🔌 WebSocket connected');
                updateConnectionStatus(true);
            };
            
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onclose = function() {
                console.log('🔌 WebSocket disconnected');
                updateConnectionStatus(false);
                // Reconnect after 5 seconds
                setTimeout(initWebSocket, 5000);
            };
            
            ws.onerror = function(error) {
                console.error('❌ WebSocket error:', error);
                updateConnectionStatus(false);
            };
        }
        
        // Handle WebSocket messages
        function handleWebSocketMessage(data) {
            switch(data.type) {
                case 'initial_data':
                    updateDashboard(data.data);
                    break;
                case 'performance_update':
                    updatePerformanceData(data.data);
                    break;
                case 'pong':
                    console.log('🏓 Pong received');
                    break;
            }
        }
        
        // Update connection status indicator
        function updateConnectionStatus(connected) {
            const indicator = document.getElementById('connectionStatus');
            if (connected) {
                indicator.textContent = '🔌 เชื่อมต่อ Real-time';
                indicator.className = 'real-time-indicator';
            } else {
                indicator.textContent = '🔌 ขาดการเชื่อมต่อ';
                indicator.className = 'real-time-indicator disconnected pulse';
            }
        }
        
        // Update dashboard with initial data
        function updateDashboard(data) {
            if (data.status && data.status.servers) {
                const servers = data.status.servers;
                document.getElementById('totalServers').textContent = servers.total;
                document.getElementById('activeServers').textContent = servers.active;
                document.getElementById('inactiveServers').textContent = servers.inactive;
                document.getElementById('healthPercentage').textContent = 
                    ((servers.active / servers.total) * 100).toFixed(1) + '%';
                
                updateServersGrid(servers.list);
            }
            
            if (data.status && data.status.coordinator) {
                const memory = data.status.coordinator.memory;
                document.getElementById('memoryRSS').textContent = 
                    (memory.rss / 1024 / 1024).toFixed(1) + ' MB';
                document.getElementById('memoryHeapUsed').textContent = 
                    (memory.heapUsed / 1024 / 1024).toFixed(1) + ' MB';
                document.getElementById('memoryHeapTotal').textContent = 
                    (memory.heapTotal / 1024 / 1024).toFixed(1) + ' MB';
                document.getElementById('uptime').textContent = 
                    formatUptime(data.status.coordinator.uptime);
            }
            
            initializeCharts(data.performance);
            document.getElementById('lastUpdate').textContent = new Date().toLocaleString('th-TH');
        }
        
        // Update performance data
        function updatePerformanceData(data) {
            if (data.performance) {
                updateCharts(data.performance);
            }
            
            if (data.servers) {
                updateServersGrid(data.servers);
                
                const active = data.servers.filter(s => s.status === 'active').length;
                const total = data.servers.length;
                
                document.getElementById('activeServers').textContent = active;
                document.getElementById('totalServers').textContent = total;
                document.getElementById('inactiveServers').textContent = total - active;
                document.getElementById('healthPercentage').textContent = 
                    ((active / total) * 100).toFixed(1) + '%';
            }
            
            document.getElementById('lastUpdate').textContent = new Date().toLocaleString('th-TH');
        }
        
        // Update servers grid
        function updateServersGrid(servers) {
            const grid = document.getElementById('serversGrid');
            grid.innerHTML = '';
            
            servers.forEach(server => {
                const serverCard = document.createElement('div');
                serverCard.className = \`server-card \${server.status}\`;
                serverCard.innerHTML = \`
                    <div class="server-name">
                        <span class="status-indicator status-\${server.status === 'active' ? 'online' : 'offline'}"></span>
                        \${server.name}
                    </div>
                    <div class="server-ports">
                        Health: \${server.healthPort} | MCP: \${server.mcpPort}
                    </div>
                \`;
                grid.appendChild(serverCard);
            });
        }
        
        // Initialize charts
        function initializeCharts(performanceData) {
            // Memory Chart
            const memoryCtx = document.getElementById('memoryChart').getContext('2d');
            charts.memory = new Chart(memoryCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Heap Used (MB)',
                        data: [],
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            
            // CPU Chart
            const cpuCtx = document.getElementById('cpuChart').getContext('2d');
            charts.cpu = new Chart(cpuCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'CPU Usage (%)',
                        data: [],
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
            
            // Network Chart
            const networkCtx = document.getElementById('networkChart').getContext('2d');
            charts.network = new Chart(networkCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Active Servers',
                        data: [],
                        borderColor: 'rgb(54, 162, 235)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            
            // Health Chart
            const healthCtx = document.getElementById('healthChart').getContext('2d');
            charts.health = new Chart(healthCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'System Health (%)',
                        data: [],
                        borderColor: 'rgb(75, 192, 75)',
                        backgroundColor: 'rgba(75, 192, 75, 0.2)',
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
            
            // Update charts with initial data
            if (performanceData) {
                updateCharts(performanceData);
            }
        }
        
        // Update charts with new data
        function updateCharts(performanceData) {
            // Update Memory Chart
            if (performanceData.memory && charts.memory) {
                const memoryData = performanceData.memory.slice(-20); // Last 20 points
                charts.memory.data.labels = memoryData.map(d => 
                    new Date(d.timestamp).toLocaleTimeString('th-TH')
                );
                charts.memory.data.datasets[0].data = memoryData.map(d => d.heapUsed);
                charts.memory.update('none');
            }
            
            // Update CPU Chart
            if (performanceData.cpu && charts.cpu) {
                const cpuData = performanceData.cpu.slice(-20);
                charts.cpu.data.labels = cpuData.map(d => 
                    new Date(d.timestamp).toLocaleTimeString('th-TH')
                );
                charts.cpu.data.datasets[0].data = cpuData.map(d => d.value);
                charts.cpu.update('none');
                
                // Update CPU usage display
                if (cpuData.length > 0) {
                    document.getElementById('cpuUsage').textContent = 
                        cpuData[cpuData.length - 1].value.toFixed(1) + '%';
                }
            }
            
            // Update Network Chart
            if (performanceData.network && charts.network) {
                const networkData = performanceData.network.slice(-20);
                charts.network.data.labels = networkData.map(d => 
                    new Date(d.timestamp).toLocaleTimeString('th-TH')
                );
                charts.network.data.datasets[0].data = networkData.map(d => d.activeServers);
                charts.network.update('none');
                
                // Update network display
                if (networkData.length > 0) {
                    const latest = networkData[networkData.length - 1];
                    document.getElementById('wsConnections').textContent = latest.connections;
                    document.getElementById('activeConnections').textContent = latest.activeServers;
                }
            }
            
            // Update Health Chart
            if (performanceData.serverHealth && charts.health) {
                const healthData = performanceData.serverHealth.slice(-20);
                charts.health.data.labels = healthData.map(d => 
                    new Date(d.timestamp).toLocaleTimeString('th-TH')
                );
                charts.health.data.datasets[0].data = healthData.map(d => d.healthPercentage);
                charts.health.update('none');
            }
        }
        
        // Format uptime
        function formatUptime(seconds) {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            
            return \`\${days}d \${hours}h \${minutes}m \${secs}s\`;
        }
        
        // Send ping every 30 seconds
        setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);
        
        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', function() {
            initWebSocket();
        });
    </script>
</body>
</html>`;
    }
}

// เริ่มต้น Enhanced Monitoring Dashboard
if (require.main === module) {
    console.log('🚀 เริ่มต้น Enhanced Monitoring Dashboard...');
    console.log('📊 Real-time monitoring สำหรับ Git Memory MCP Server System');
    console.log('=' .repeat(60));
    
    const dashboard = new EnhancedMonitoringDashboard();
    
    // จัดการการปิดโปรแกรม
    process.on('SIGINT', () => {
        console.log('\n🛑 กำลังปิด Enhanced Monitoring Dashboard...');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n🛑 กำลังปิด Enhanced Monitoring Dashboard...');
        process.exit(0);
    });
}

module.exports = EnhancedMonitoringDashboard;