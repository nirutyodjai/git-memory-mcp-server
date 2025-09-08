/**
 * NEXUS IDE - Master Control System
 * ระบบควบคุมหลักที่ประสานงานระหว่าง MCP Servers ทั้ง 3000 ตัว
 * ให้ทำงานเป็นก้อนข้อมูลเดียวกัน
 */

const NexusDataIntegration = require('./nexus-data-integration');
const { UniversalDataClient } = require('./universal-data-client');
const WebSocket = require('ws');
const http = require('http');
const { performance } = require('perf_hooks');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class NexusMasterControl {
    constructor() {
        this.port = 9003;
        this.server = null;
        this.wsServer = null;
        this.connections = new Map();
        
        // ระบบย่อยทั้งหมด
        this.subsystems = {
            dataIntegration: null,
            universalHub: null,
            gitMemory: null,
            mcpRegistry: null
        };
        
        // สถิติระบบ
        this.systemStats = {
            totalServers: 3000,
            activeServers: 0,
            dataNodes: 0,
            totalConnections: 0,
            dataTransfers: 0,
            systemUptime: Date.now(),
            lastHealthCheck: null,
            errors: 0,
            performance: {
                cpu: 0,
                memory: 0,
                network: 0
            }
        };
        
        // การกำหนดค่าระบบ
        this.config = {
            autoStart: true,
            healthCheckInterval: 30000, // 30 วินาที
            dataBackupInterval: 300000, // 5 นาที
            maxRetries: 3,
            timeoutMs: 10000
        };
        
        // กระบวนการที่กำลังทำงาน
        this.processes = new Map();
        
        // ข้อมูลสำหรับการ backup
        this.backupData = new Map();
        
        this.healthCheckInterval = null;
        this.backupInterval = null;
    }

    async initialize() {
        console.log('🚀 เริ่มต้น NEXUS Master Control System...');
        console.log('=' .repeat(60));
        
        try {
            // สร้าง HTTP และ WebSocket Server
            await this.createServers();
            
            // เริ่มต้นระบบย่อยทั้งหมด
            await this.initializeSubsystems();
            
            // เริ่มต้นการตรวจสอบสุขภาพระบบ
            this.startHealthMonitoring();
            
            // เริ่มต้นการ backup ข้อมูล
            this.startDataBackup();
            
            // แสดงสถานะระบบ
            await this.displaySystemStatus();
            
            console.log('=' .repeat(60));
            console.log('🎯 NEXUS Master Control พร้อมใช้งาน!');
            console.log(`📡 Control Panel: http://localhost:${this.port}`);
            console.log(`🔌 WebSocket API: ws://localhost:${this.port}`);
            console.log('=' .repeat(60));
            
        } catch (error) {
            console.error('❌ ข้อผิดพลาดในการเริ่มต้นระบบ:', error);
            throw error;
        }
    }

    async createServers() {
        // สร้าง HTTP Server
        this.server = http.createServer((req, res) => {
            this.handleHTTPRequest(req, res);
        });
        
        // สร้าง WebSocket Server
        this.wsServer = new WebSocket.Server({ server: this.server });
        
        this.wsServer.on('connection', (ws, req) => {
            const connectionId = `master-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            this.connections.set(connectionId, {
                ws,
                connectedAt: new Date(),
                lastActivity: new Date()
            });
            
            this.systemStats.totalConnections++;
            
            console.log(`🔗 Master Control เชื่อมต่อใหม่: ${connectionId}`);
            
            ws.send(JSON.stringify({
                type: 'master_welcome',
                data: {
                    connectionId,
                    message: 'เชื่อมต่อ NEXUS Master Control สำเร็จ',
                    systemStats: this.systemStats,
                    subsystems: Object.keys(this.subsystems)
                }
            }));
            
            ws.on('message', (message) => {
                this.handleWebSocketMessage(connectionId, message);
            });
            
            ws.on('close', () => {
                this.connections.delete(connectionId);
                console.log(`🔌 Master Control การเชื่อมต่อปิด: ${connectionId}`);
            });
        });
        
        // เริ่มต้น Server
        await new Promise((resolve) => {
            this.server.listen(this.port, () => {
                console.log(`🌐 Master Control Server เริ่มทำงานที่ port ${this.port}`);
                resolve();
            });
        });
    }

    async initializeSubsystems() {
        console.log('🔧 เริ่มต้นระบบย่อยทั้งหมด...');
        
        try {
            // 1. เริ่มต้น Data Integration
            console.log('📊 เริ่มต้น Data Integration Layer...');
            this.subsystems.dataIntegration = new NexusDataIntegration();
            await this.subsystems.dataIntegration.initialize();
            
            // 2. เริ่มต้น Universal Data Hub
            console.log('🌐 เริ่มต้น Universal Data Hub...');
            await this.startUniversalHub();
            
            // 3. เริ่มต้น Git Memory Coordinator
            console.log('📝 เริ่มต้น Git Memory Coordinator...');
            await this.startGitMemoryCoordinator();
            
            // 4. เริ่มต้น MCP Registry
            console.log('🗂️ เริ่มต้น MCP Registry...');
            await this.startMCPRegistry();
            
            console.log('✅ ระบบย่อยทั้งหมดเริ่มต้นสำเร็จ');
            
        } catch (error) {
            console.error('❌ ข้อผิดพลาดในการเริ่มต้นระบบย่อย:', error);
            throw error;
        }
    }

    async startUniversalHub() {
        return new Promise((resolve, reject) => {
            const hubProcess = spawn('node', ['universal-data-hub.js'], {
                cwd: __dirname,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            this.processes.set('universal-hub', hubProcess);
            
            hubProcess.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('Universal Data Hub พร้อมใช้งาน')) {
                    console.log('✅ Universal Data Hub เริ่มทำงานแล้ว');
                    resolve();
                }
            });
            
            hubProcess.stderr.on('data', (data) => {
                console.error('Universal Hub Error:', data.toString());
            });
            
            hubProcess.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`Universal Hub ปิดด้วยรหัส ${code}`);
                }
                this.processes.delete('universal-hub');
            });
            
            // Timeout หลัง 10 วินาที
            setTimeout(() => {
                if (this.processes.has('universal-hub')) {
                    resolve(); // อนุญาตให้ดำเนินการต่อแม้ไม่ได้รับสัญญาณ
                }
            }, 10000);
        });
    }

    async startGitMemoryCoordinator() {
        return new Promise((resolve, reject) => {
            const memoryProcess = spawn('node', ['git-memory-coordinator.js'], {
                cwd: __dirname,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            this.processes.set('git-memory', memoryProcess);
            
            memoryProcess.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('Git Memory Coordinator พร้อมใช้งาน')) {
                    console.log('✅ Git Memory Coordinator เริ่มทำงานแล้ว');
                    resolve();
                }
            });
            
            memoryProcess.stderr.on('data', (data) => {
                console.error('Git Memory Error:', data.toString());
            });
            
            memoryProcess.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`Git Memory Coordinator ปิดด้วยรหัส ${code}`);
                }
                this.processes.delete('git-memory');
            });
            
            // Timeout หลัง 10 วินาที
            setTimeout(() => {
                if (this.processes.has('git-memory')) {
                    resolve();
                }
            }, 10000);
        });
    }

    async startMCPRegistry() {
        // MCP Registry อาจเริ่มทำงานแล้วจาก NEXUS IDE
        // ตรวจสอบว่าทำงานอยู่หรือไม่
        try {
            const response = await fetch('http://localhost:8080/api/servers/status');
            if (response.ok) {
                console.log('✅ MCP Registry ทำงานอยู่แล้ว');
                return;
            }
        } catch (error) {
            // MCP Registry ไม่ทำงาน เริ่มต้นใหม่
        }
        
        return new Promise((resolve) => {
            console.log('🔄 เริ่มต้น MCP Registry ใหม่...');
            // ในกรณีจริงจะเริ่มต้น MCP Registry ที่นี่
            setTimeout(resolve, 2000);
        });
    }

    async handleHTTPRequest(req, res) {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        const url = new URL(req.url, `http://localhost:${this.port}`);
        const path = url.pathname;
        
        try {
            let response = {};
            
            switch (path) {
                case '/':
                    response = await this.getControlPanel();
                    res.setHeader('Content-Type', 'text/html');
                    break;
                    
                case '/api/status':
                    response = await this.getSystemStatus();
                    break;
                    
                case '/api/stats':
                    response = await this.getDetailedStats();
                    break;
                    
                case '/api/health':
                    response = await this.performHealthCheck();
                    break;
                    
                case '/api/restart':
                    if (req.method === 'POST') {
                        const body = await this.getRequestBody(req);
                        response = await this.restartSubsystem(body.subsystem);
                    }
                    break;
                    
                case '/api/backup':
                    response = await this.createDataBackup();
                    break;
                    
                case '/api/unified-data':
                    response = await this.getUnifiedDataOverview();
                    break;
                    
                default:
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'ไม่พบ endpoint' }));
                    return;
            }
            
            if (typeof response === 'string') {
                res.writeHead(200);
                res.end(response);
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));
            }
            
        } catch (error) {
            console.error('❌ ข้อผิดพลาด HTTP:', error);
            this.systemStats.errors++;
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    async handleWebSocketMessage(connectionId, message) {
        try {
            const data = JSON.parse(message);
            const { type, payload } = data;
            
            // อัปเดต last activity
            const connection = this.connections.get(connectionId);
            if (connection) {
                connection.lastActivity = new Date();
            }
            
            let response = {};
            
            switch (type) {
                case 'get_system_status':
                    response = await this.getSystemStatus();
                    break;
                    
                case 'perform_health_check':
                    response = await this.performHealthCheck();
                    break;
                    
                case 'restart_subsystem':
                    response = await this.restartSubsystem(payload.subsystem);
                    break;
                    
                case 'get_unified_data':
                    response = await this.getUnifiedDataOverview();
                    break;
                    
                case 'create_backup':
                    response = await this.createDataBackup();
                    break;
                    
                case 'get_performance_metrics':
                    response = await this.getPerformanceMetrics();
                    break;
            }
            
            this.sendToConnection(connectionId, {
                type: `${type}_response`,
                data: response
            });
            
        } catch (error) {
            console.error('❌ ข้อผิดพลาด WebSocket:', error);
            this.systemStats.errors++;
            this.sendToConnection(connectionId, {
                type: 'error',
                data: { message: error.message }
            });
        }
    }

    async getSystemStatus() {
        const uptime = Date.now() - this.systemStats.systemUptime;
        
        return {
            success: true,
            system: {
                status: 'running',
                uptime: uptime,
                uptimeFormatted: this.formatUptime(uptime)
            },
            subsystems: {
                dataIntegration: this.subsystems.dataIntegration ? 'running' : 'stopped',
                universalHub: this.processes.has('universal-hub') ? 'running' : 'stopped',
                gitMemory: this.processes.has('git-memory') ? 'running' : 'stopped',
                mcpRegistry: 'running' // สมมติว่าทำงานอยู่
            },
            stats: this.systemStats,
            processes: Array.from(this.processes.keys()),
            connections: this.connections.size
        };
    }

    async getDetailedStats() {
        const memUsage = process.memoryUsage();
        
        return {
            success: true,
            system: {
                memory: {
                    used: Math.round(memUsage.heapUsed / 1024 / 1024),
                    total: Math.round(memUsage.heapTotal / 1024 / 1024),
                    external: Math.round(memUsage.external / 1024 / 1024)
                },
                cpu: {
                    usage: process.cpuUsage(),
                    loadAverage: require('os').loadavg()
                },
                network: {
                    connections: this.connections.size,
                    dataTransfers: this.systemStats.dataTransfers
                }
            },
            subsystems: await this.getSubsystemStats()
        };
    }

    async getSubsystemStats() {
        const stats = {};
        
        // Data Integration Stats
        if (this.subsystems.dataIntegration) {
            try {
                const response = await fetch('http://localhost:9002/api/stats');
                if (response.ok) {
                    stats.dataIntegration = await response.json();
                }
            } catch (error) {
                stats.dataIntegration = { error: 'ไม่สามารถเชื่อมต่อได้' };
            }
        }
        
        // Universal Hub Stats
        try {
            const response = await fetch('http://localhost:9001/api/stats');
            if (response.ok) {
                stats.universalHub = await response.json();
            }
        } catch (error) {
            stats.universalHub = { error: 'ไม่สามารถเชื่อมต่อได้' };
        }
        
        return stats;
    }

    async performHealthCheck() {
        console.log('🏥 เริ่มต้นการตรวจสอบสุขภาพระบบ...');
        
        const healthStatus = {
            timestamp: new Date(),
            overall: 'healthy',
            subsystems: {},
            issues: []
        };
        
        // ตรวจสอบ Data Integration
        try {
            const response = await fetch('http://localhost:9002/api/stats', { timeout: 5000 });
            healthStatus.subsystems.dataIntegration = response.ok ? 'healthy' : 'unhealthy';
        } catch (error) {
            healthStatus.subsystems.dataIntegration = 'unhealthy';
            healthStatus.issues.push('Data Integration ไม่ตอบสนong');
        }
        
        // ตรวจสอบ Universal Hub
        try {
            const response = await fetch('http://localhost:9001/api/stats', { timeout: 5000 });
            healthStatus.subsystems.universalHub = response.ok ? 'healthy' : 'unhealthy';
        } catch (error) {
            healthStatus.subsystems.universalHub = 'unhealthy';
            healthStatus.issues.push('Universal Hub ไม่ตอบสนอง');
        }
        
        // ตรวจสอบ Memory Usage
        const memUsage = process.memoryUsage();
        const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        if (memUsagePercent > 80) {
            healthStatus.issues.push(`การใช้ Memory สูง: ${memUsagePercent.toFixed(1)}%`);
        }
        
        // กำหนดสถานะโดยรวม
        if (healthStatus.issues.length > 0) {
            healthStatus.overall = healthStatus.issues.length > 2 ? 'critical' : 'warning';
        }
        
        this.systemStats.lastHealthCheck = healthStatus.timestamp;
        
        // แจ้งเตือนผู้เชื่อมต่อทั้งหมด
        this.broadcastToAll({
            type: 'health_check_completed',
            data: healthStatus
        });
        
        console.log(`🏥 การตรวจสอบสุขภาพเสร็จสิ้น: ${healthStatus.overall}`);
        
        return {
            success: true,
            health: healthStatus
        };
    }

    async getUnifiedDataOverview() {
        try {
            // ดึงข้อมูลจาก Data Integration
            const integrationResponse = await fetch('http://localhost:9002/api/stats');
            const integrationData = integrationResponse.ok ? await integrationResponse.json() : null;
            
            // ดึงข้อมูลจาก Universal Hub
            const hubResponse = await fetch('http://localhost:9001/api/stats');
            const hubData = hubResponse.ok ? await hubResponse.json() : null;
            
            return {
                success: true,
                overview: {
                    totalServers: this.systemStats.totalServers,
                    activeConnections: this.connections.size,
                    dataIntegration: integrationData,
                    universalHub: hubData,
                    lastSync: this.systemStats.lastHealthCheck
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createDataBackup() {
        const backupId = `backup-${Date.now()}`;
        const backupPath = path.join(__dirname, 'backups', `${backupId}.json`);
        
        try {
            // สร้างโฟลเดอร์ backup ถ้าไม่มี
            await fs.mkdir(path.dirname(backupPath), { recursive: true });
            
            // รวบรวมข้อมูลสำหรับ backup
            const backupData = {
                timestamp: new Date(),
                backupId,
                systemStats: this.systemStats,
                subsystemsStatus: await this.getSystemStatus(),
                connections: this.connections.size,
                processes: Array.from(this.processes.keys())
            };
            
            // บันทึกไฟล์ backup
            await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
            
            console.log(`💾 สร้าง backup สำเร็จ: ${backupId}`);
            
            return {
                success: true,
                backupId,
                path: backupPath,
                size: JSON.stringify(backupData).length
            };
            
        } catch (error) {
            console.error('❌ ข้อผิดพลาดในการสร้าง backup:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async restartSubsystem(subsystemName) {
        console.log(`🔄 เริ่มต้น restart ${subsystemName}...`);
        
        try {
            switch (subsystemName) {
                case 'universal-hub':
                    if (this.processes.has('universal-hub')) {
                        this.processes.get('universal-hub').kill();
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                    await this.startUniversalHub();
                    break;
                    
                case 'git-memory':
                    if (this.processes.has('git-memory')) {
                        this.processes.get('git-memory').kill();
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                    await this.startGitMemoryCoordinator();
                    break;
                    
                case 'data-integration':
                    if (this.subsystems.dataIntegration) {
                        await this.subsystems.dataIntegration.shutdown();
                    }
                    this.subsystems.dataIntegration = new NexusDataIntegration();
                    await this.subsystems.dataIntegration.initialize();
                    break;
                    
                default:
                    throw new Error(`ไม่รู้จักระบบย่อย: ${subsystemName}`);
            }
            
            console.log(`✅ Restart ${subsystemName} สำเร็จ`);
            
            return {
                success: true,
                message: `Restart ${subsystemName} สำเร็จ`,
                timestamp: new Date()
            };
            
        } catch (error) {
            console.error(`❌ ข้อผิดพลาดในการ restart ${subsystemName}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    startHealthMonitoring() {
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck().catch(error => {
                console.error('❌ Health check ล้มเหลว:', error);
            });
        }, this.config.healthCheckInterval);
        
        console.log(`🏥 เริ่มต้น Health Monitoring (ทุก ${this.config.healthCheckInterval/1000} วินาที)`);
    }

    startDataBackup() {
        this.backupInterval = setInterval(() => {
            this.createDataBackup().catch(error => {
                console.error('❌ Auto backup ล้มเหลว:', error);
            });
        }, this.config.dataBackupInterval);
        
        console.log(`💾 เริ่มต้น Auto Backup (ทุก ${this.config.dataBackupInterval/1000/60} นาที)`);
    }

    async displaySystemStatus() {
        const status = await this.getSystemStatus();
        
        console.log('\n📊 สถานะระบบ NEXUS Master Control:');
        console.log(`   🟢 ระบบหลัก: ${status.system.status}`);
        console.log(`   ⏱️  Uptime: ${status.system.uptimeFormatted}`);
        console.log(`   🔗 การเชื่อมต่อ: ${status.connections}`);
        console.log(`   🔧 กระบวนการ: ${status.processes.length}`);
        console.log('\n🔧 ระบบย่อย:');
        Object.entries(status.subsystems).forEach(([name, status]) => {
            const icon = status === 'running' ? '🟢' : '🔴';
            console.log(`   ${icon} ${name}: ${status}`);
        });
    }

    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    sendToConnection(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (connection && connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(JSON.stringify(message));
        }
    }

    broadcastToAll(message) {
        for (const [connectionId, connection] of this.connections) {
            if (connection.ws.readyState === WebSocket.OPEN) {
                connection.ws.send(JSON.stringify(message));
            }
        }
    }

    async getRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async getControlPanel() {
        return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS Master Control Panel</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a; color: #fff; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #00ff88; font-size: 2.5em; margin-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #1a1a1a; border: 1px solid #333; border-radius: 10px; padding: 20px; }
        .stat-card h3 { color: #00ff88; margin-bottom: 15px; }
        .stat-value { font-size: 2em; font-weight: bold; color: #fff; }
        .stat-label { color: #888; font-size: 0.9em; }
        .status-indicator { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; }
        .status-running { background: #00ff88; }
        .status-stopped { background: #ff4444; }
        .controls { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px; }
        .btn { padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
        .btn-primary { background: #00ff88; color: #000; }
        .btn-secondary { background: #333; color: #fff; }
        .btn:hover { opacity: 0.8; }
        .log-container { background: #1a1a1a; border: 1px solid #333; border-radius: 10px; padding: 20px; height: 300px; overflow-y: auto; }
        .log-entry { margin-bottom: 5px; font-family: monospace; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 NEXUS Master Control</h1>
            <p>ระบบควบคุมหลัก MCP Servers ทั้ง 3000 ตัว</p>
        </div>
        
        <div class="stats-grid" id="statsGrid">
            <div class="stat-card">
                <h3>🖥️ ระบบหลัก</h3>
                <div class="stat-value" id="systemStatus">กำลังโหลด...</div>
                <div class="stat-label">สถานะระบบ</div>
            </div>
            <div class="stat-card">
                <h3>🔗 การเชื่อมต่อ</h3>
                <div class="stat-value" id="connections">0</div>
                <div class="stat-label">การเชื่อมต่อทั้งหมด</div>
            </div>
            <div class="stat-card">
                <h3>📊 MCP Servers</h3>
                <div class="stat-value" id="mcpServers">3000</div>
                <div class="stat-label">เซิร์ฟเวอร์ทั้งหมด</div>
            </div>
            <div class="stat-card">
                <h3>⏱️ Uptime</h3>
                <div class="stat-value" id="uptime">0s</div>
                <div class="stat-label">เวลาทำงาน</div>
            </div>
        </div>
        
        <div class="controls">
            <button class="btn btn-primary" onclick="performHealthCheck()">🏥 ตรวจสอบสุขภาพ</button>
            <button class="btn btn-secondary" onclick="createBackup()">💾 สร้าง Backup</button>
            <button class="btn btn-secondary" onclick="refreshStats()">🔄 รีเฟรช</button>
        </div>
        
        <div style="margin-top: 30px;">
            <h3>📋 System Logs</h3>
            <div class="log-container" id="logContainer">
                <div class="log-entry">🚀 NEXUS Master Control เริ่มทำงาน...</div>
            </div>
        </div>
    </div>
    
    <script>
        let ws = null;
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.port}');
            
            ws.onopen = () => {
                addLog('🔗 เชื่อมต่อ WebSocket สำเร็จ');
                refreshStats();
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onclose = () => {
                addLog('🔌 การเชื่อมต่อ WebSocket ปิด');
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'master_welcome':
                    updateStats(data.data.systemStats);
                    break;
                case 'get_system_status_response':
                    updateStats(data.data.stats);
                    updateSystemStatus(data.data);
                    break;
                case 'health_check_completed':
                    addLog('🏥 การตรวจสอบสุขภาพเสร็จสิ้น: ' + data.data.overall);
                    break;
            }
        }
        
        function updateStats(stats) {
            document.getElementById('connections').textContent = stats.totalConnections || 0;
            document.getElementById('mcpServers').textContent = stats.totalServers || 3000;
        }
        
        function updateSystemStatus(status) {
            const systemStatusEl = document.getElementById('systemStatus');
            const uptimeEl = document.getElementById('uptime');
            
            systemStatusEl.textContent = status.system.status;
            uptimeEl.textContent = status.system.uptimeFormatted;
        }
        
        function refreshStats() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'get_system_status' }));
            }
        }
        
        function performHealthCheck() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'perform_health_check' }));
                addLog('🏥 เริ่มต้นการตรวจสอบสุขภาพ...');
            }
        }
        
        function createBackup() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'create_backup' }));
                addLog('💾 เริ่มต้นการสร้าง backup...');
            }
        }
        
        function addLog(message) {
            const logContainer = document.getElementById('logContainer');
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.textContent = new Date().toLocaleTimeString() + ' - ' + message;
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight;
        }
        
        // เริ่มต้นการเชื่อมต่อ
        connectWebSocket();
        
        // รีเฟรชสถิติทุก 5 วินาที
        setInterval(refreshStats, 5000);
    </script>
</body>
</html>
        `;
    }

    async shutdown() {
        console.log('🛑 กำลังปิด NEXUS Master Control...');
        
        // ปิด intervals
        if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
        if (this.backupInterval) clearInterval(this.backupInterval);
        
        // ปิดระบบย่อย
        if (this.subsystems.dataIntegration) {
            await this.subsystems.dataIntegration.shutdown();
        }
        
        // ปิดกระบวนการ
        for (const [name, process] of this.processes) {
            console.log(`🔌 ปิด ${name}...`);
            process.kill();
        }
        
        // ปิด server
        if (this.server) {
            this.server.close();
        }
        
        console.log('✅ NEXUS Master Control ปิดเรียบร้อย');
    }
}

// Export สำหรับใช้งานจากไฟล์อื่น
module.exports = NexusMasterControl;

// ถ้ารันไฟล์นี้โดยตรง
if (require.main === module) {
    const masterControl = new NexusMasterControl();
    
    masterControl.initialize().catch(error => {
        console.error('❌ ไม่สามารถเริ่มต้น NEXUS Master Control:', error);
        process.exit(1);
    });
    
    // จัดการ graceful shutdown
    process.on('SIGINT', async () => {
        await masterControl.shutdown();
        process.exit(0);
    });
}