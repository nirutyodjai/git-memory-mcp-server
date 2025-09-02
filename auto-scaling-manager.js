#!/usr/bin/env node
/**
 * Auto-scaling Manager - ระบบปรับขนาด MCP Servers อัตโนมัติ
 * รองรับการเพิ่ม/ลด servers ตามความต้องการและโหลดของระบบ
 */

const http = require('http');
const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class AutoScalingManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            coordinatorUrl: options.coordinatorUrl || 'http://localhost:9000',
            minServers: options.minServers || 100,
            maxServers: options.maxServers || 2000,
            targetCpuThreshold: options.targetCpuThreshold || 70, // %
            targetMemoryThreshold: options.targetMemoryThreshold || 80, // %
            scaleUpThreshold: options.scaleUpThreshold || 85, // %
            scaleDownThreshold: options.scaleDownThreshold || 30, // %
            cooldownPeriod: options.cooldownPeriod || 300000, // 5 minutes
            checkInterval: options.checkInterval || 60000, // 1 minute
            scaleUpStep: options.scaleUpStep || 50, // servers to add
            scaleDownStep: options.scaleDownStep || 25, // servers to remove
            ...options
        };
        
        this.metrics = {
            cpu: [],
            memory: [],
            serverHealth: [],
            requestRate: [],
            responseTime: []
        };
        
        this.scalingHistory = [];
        this.lastScalingAction = null;
        this.isScaling = false;
        this.currentServers = 0;
        
        this.startMonitoring();
        this.startHttpServer();
    }
    
    /**
     * เริ่มต้นการตรวจสอบระบบ
     */
    startMonitoring() {
        console.log('🔍 เริ่มต้นระบบ Auto-scaling Monitoring...');
        
        setInterval(async () => {
            try {
                await this.collectMetrics();
                await this.evaluateScaling();
            } catch (error) {
                console.error('❌ Auto-scaling monitoring error:', error.message);
            }
        }, this.config.checkInterval);
        
        console.log(`📊 Auto-scaling check interval: ${this.config.checkInterval / 1000}s`);
    }
    
    /**
     * เริ่มต้น HTTP Server สำหรับ API
     */
    startHttpServer() {
        const server = http.createServer((req, res) => {
            const url = new URL(req.url, 'http://localhost:8080');
            const pathname = url.pathname;
            
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            if (pathname === '/status') {
                this.handleStatusRequest(res);
            } else if (pathname === '/metrics') {
                this.handleMetricsRequest(res);
            } else if (pathname === '/history') {
                this.handleHistoryRequest(res);
            } else if (pathname === '/config') {
                this.handleConfigRequest(res);
            } else if (pathname === '/scale' && req.method === 'POST') {
                this.handleManualScaleRequest(req, res);
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not Found' }));
            }
        });
        
        server.listen(8080, () => {
            console.log('🚀 Auto-scaling Manager API running on http://localhost:8080');
        });
    }
    
    /**
     * รวบรวมข้อมูลประสิทธิภาพ
     */
    async collectMetrics() {
        try {
            const coordinatorData = await this.fetchCoordinatorData('/status');
            const timestamp = new Date();
            
            if (coordinatorData) {
                // Server metrics
                if (coordinatorData.servers) {
                    this.currentServers = coordinatorData.servers.total;
                    const healthPercentage = (coordinatorData.servers.active / coordinatorData.servers.total) * 100;
                    
                    this.metrics.serverHealth.push({
                        timestamp,
                        total: coordinatorData.servers.total,
                        active: coordinatorData.servers.active,
                        inactive: coordinatorData.servers.inactive,
                        healthPercentage
                    });
                }
                
                // System metrics
                if (coordinatorData.coordinator) {
                    const memory = coordinatorData.coordinator.memory;
                    const memoryUsagePercentage = (memory.heapUsed / memory.heapTotal) * 100;
                    
                    this.metrics.memory.push({
                        timestamp,
                        usage: memoryUsagePercentage,
                        heapUsed: memory.heapUsed,
                        heapTotal: memory.heapTotal,
                        rss: memory.rss
                    });
                }
            }
            
            // CPU metrics
            const cpuUsage = await this.getCPUUsage();
            this.metrics.cpu.push({
                timestamp,
                usage: cpuUsage
            });
            
            // Request rate (placeholder - ในการใช้งานจริงควรเก็บจากข้อมูลจริง)
            const requestRate = Math.random() * 1000 + 500; // 500-1500 req/min
            this.metrics.requestRate.push({
                timestamp,
                rate: requestRate
            });
            
            // Response time (placeholder)
            const responseTime = Math.random() * 200 + 50; // 50-250ms
            this.metrics.responseTime.push({
                timestamp,
                time: responseTime
            });
            
            // Keep only last 100 data points
            Object.keys(this.metrics).forEach(key => {
                if (this.metrics[key].length > 100) {
                    this.metrics[key] = this.metrics[key].slice(-100);
                }
            });
            
        } catch (error) {
            console.error('❌ Error collecting metrics:', error.message);
        }
    }
    
    /**
     * ประเมินความจำเป็นในการปรับขนาด
     */
    async evaluateScaling() {
        if (this.isScaling) {
            console.log('⏳ กำลังดำเนินการปรับขนาด... รอการเสร็จสิ้น');
            return;
        }
        
        // ตรวจสอบ cooldown period
        if (this.lastScalingAction) {
            const timeSinceLastAction = Date.now() - this.lastScalingAction.timestamp;
            if (timeSinceLastAction < this.config.cooldownPeriod) {
                return;
            }
        }
        
        const decision = this.makeScalingDecision();
        
        if (decision.action !== 'none') {
            console.log(`🎯 Scaling decision: ${decision.action} (${decision.reason})`);
            await this.executeScaling(decision);
        }
    }
    
    /**
     * ตัดสินใจการปรับขนาด
     */
    makeScalingDecision() {
        const recentMetrics = this.getRecentMetrics(5); // Last 5 minutes
        
        if (!recentMetrics.cpu.length || !recentMetrics.memory.length) {
            return { action: 'none', reason: 'Insufficient metrics data' };
        }
        
        // คำนวณค่าเฉลี่ย
        const avgCpu = recentMetrics.cpu.reduce((sum, m) => sum + m.usage, 0) / recentMetrics.cpu.length;
        const avgMemory = recentMetrics.memory.reduce((sum, m) => sum + m.usage, 0) / recentMetrics.memory.length;
        const avgHealth = recentMetrics.serverHealth.length > 0 ? 
            recentMetrics.serverHealth.reduce((sum, m) => sum + m.healthPercentage, 0) / recentMetrics.serverHealth.length : 100;
        const avgRequestRate = recentMetrics.requestRate.reduce((sum, m) => sum + m.rate, 0) / recentMetrics.requestRate.length;
        const avgResponseTime = recentMetrics.responseTime.reduce((sum, m) => sum + m.time, 0) / recentMetrics.responseTime.length;
        
        console.log(`📊 Current metrics - CPU: ${avgCpu.toFixed(1)}%, Memory: ${avgMemory.toFixed(1)}%, Health: ${avgHealth.toFixed(1)}%, Requests: ${avgRequestRate.toFixed(0)}/min, Response: ${avgResponseTime.toFixed(0)}ms`);
        
        // Scale Up conditions
        if (this.currentServers < this.config.maxServers) {
            if (avgCpu > this.config.scaleUpThreshold) {
                return {
                    action: 'scale_up',
                    reason: `High CPU usage: ${avgCpu.toFixed(1)}%`,
                    targetServers: Math.min(this.currentServers + this.config.scaleUpStep, this.config.maxServers)
                };
            }
            
            if (avgMemory > this.config.scaleUpThreshold) {
                return {
                    action: 'scale_up',
                    reason: `High memory usage: ${avgMemory.toFixed(1)}%`,
                    targetServers: Math.min(this.currentServers + this.config.scaleUpStep, this.config.maxServers)
                };
            }
            
            if (avgHealth < 90 && this.currentServers < this.config.maxServers * 0.8) {
                return {
                    action: 'scale_up',
                    reason: `Low server health: ${avgHealth.toFixed(1)}%`,
                    targetServers: Math.min(this.currentServers + Math.floor(this.config.scaleUpStep / 2), this.config.maxServers)
                };
            }
            
            if (avgRequestRate > 1200 && avgResponseTime > 200) {
                return {
                    action: 'scale_up',
                    reason: `High load: ${avgRequestRate.toFixed(0)} req/min, ${avgResponseTime.toFixed(0)}ms response`,
                    targetServers: Math.min(this.currentServers + this.config.scaleUpStep, this.config.maxServers)
                };
            }
        }
        
        // Scale Down conditions
        if (this.currentServers > this.config.minServers) {
            if (avgCpu < this.config.scaleDownThreshold && 
                avgMemory < this.config.scaleDownThreshold && 
                avgHealth > 95 && 
                avgRequestRate < 600) {
                return {
                    action: 'scale_down',
                    reason: `Low resource usage - CPU: ${avgCpu.toFixed(1)}%, Memory: ${avgMemory.toFixed(1)}%, Requests: ${avgRequestRate.toFixed(0)}/min`,
                    targetServers: Math.max(this.currentServers - this.config.scaleDownStep, this.config.minServers)
                };
            }
        }
        
        return { action: 'none', reason: 'Metrics within normal range' };
    }
    
    /**
     * ดำเนินการปรับขนาด
     */
    async executeScaling(decision) {
        this.isScaling = true;
        const startTime = Date.now();
        
        try {
            console.log(`🚀 เริ่มต้น ${decision.action}: ${this.currentServers} → ${decision.targetServers} servers`);
            console.log(`📝 เหตุผล: ${decision.reason}`);
            
            let success = false;
            
            if (decision.action === 'scale_up') {
                success = await this.scaleUp(decision.targetServers);
            } else if (decision.action === 'scale_down') {
                success = await this.scaleDown(decision.targetServers);
            }
            
            const duration = Date.now() - startTime;
            
            // บันทึกประวัติ
            const historyEntry = {
                timestamp: new Date(),
                action: decision.action,
                reason: decision.reason,
                fromServers: this.currentServers,
                toServers: decision.targetServers,
                success,
                duration,
                metrics: this.getRecentMetrics(1)[0] || {}
            };
            
            this.scalingHistory.push(historyEntry);
            
            // Keep only last 100 history entries
            if (this.scalingHistory.length > 100) {
                this.scalingHistory = this.scalingHistory.slice(-100);
            }
            
            this.lastScalingAction = {
                timestamp: Date.now(),
                action: decision.action,
                success
            };
            
            if (success) {
                console.log(`✅ ${decision.action} สำเร็จ ใช้เวลา ${duration}ms`);
                this.emit('scaling_completed', historyEntry);
            } else {
                console.log(`❌ ${decision.action} ล้มเหลว`);
                this.emit('scaling_failed', historyEntry);
            }
            
        } catch (error) {
            console.error(`❌ Error during ${decision.action}:`, error.message);
            this.emit('scaling_error', { error: error.message, decision });
        } finally {
            this.isScaling = false;
        }
    }
    
    /**
     * เพิ่มจำนวน servers
     */
    async scaleUp(targetServers) {
        const serversToAdd = targetServers - this.currentServers;
        console.log(`📈 กำลังเพิ่ม ${serversToAdd} servers...`);
        
        try {
            // สร้าง servers ใหม่
            const result = await this.createAdditionalServers(serversToAdd);
            
            if (result.success) {
                console.log(`✅ เพิ่ม servers สำเร็จ: ${result.created} servers`);
                return true;
            } else {
                console.log(`❌ เพิ่ม servers ล้มเหลว: ${result.error}`);
                return false;
            }
        } catch (error) {
            console.error('❌ Scale up error:', error.message);
            return false;
        }
    }
    
    /**
     * ลดจำนวน servers
     */
    async scaleDown(targetServers) {
        const serversToRemove = this.currentServers - targetServers;
        console.log(`📉 กำลังลด ${serversToRemove} servers...`);
        
        try {
            // หยุด servers ที่ไม่จำเป็น
            const result = await this.removeExcessServers(serversToRemove);
            
            if (result.success) {
                console.log(`✅ ลด servers สำเร็จ: ${result.removed} servers`);
                return true;
            } else {
                console.log(`❌ ลด servers ล้มเหลว: ${result.error}`);
                return false;
            }
        } catch (error) {
            console.error('❌ Scale down error:', error.message);
            return false;
        }
    }
    
    /**
     * สร้าง servers เพิ่มเติม
     */
    async createAdditionalServers(count) {
        return new Promise((resolve) => {
            // สร้างสคริปต์สำหรับเพิ่ม servers
            const scriptPath = path.join(__dirname, 'create-additional-servers.js');
            
            // เรียกใช้สคริปต์
            const child = spawn('node', [scriptPath, count.toString()], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: __dirname
            });
            
            let output = '';
            let errorOutput = '';
            
            child.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ success: true, created: count, output });
                } else {
                    resolve({ success: false, error: errorOutput || 'Unknown error', code });
                }
            });
            
            // Timeout after 5 minutes
            setTimeout(() => {
                child.kill();
                resolve({ success: false, error: 'Timeout creating servers' });
            }, 300000);
        });
    }
    
    /**
     * ลบ servers ที่เกิน
     */
    async removeExcessServers(count) {
        return new Promise((resolve) => {
            // สร้างสคริปต์สำหรับลบ servers
            const scriptPath = path.join(__dirname, 'remove-excess-servers.js');
            
            // เรียกใช้สคริปต์
            const child = spawn('node', [scriptPath, count.toString()], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: __dirname
            });
            
            let output = '';
            let errorOutput = '';
            
            child.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ success: true, removed: count, output });
                } else {
                    resolve({ success: false, error: errorOutput || 'Unknown error', code });
                }
            });
            
            // Timeout after 3 minutes
            setTimeout(() => {
                child.kill();
                resolve({ success: false, error: 'Timeout removing servers' });
            }, 180000);
        });
    }
    
    /**
     * ดึงข้อมูลจาก Coordinator
     */
    async fetchCoordinatorData(endpoint) {
        return new Promise((resolve, reject) => {
            const req = http.get(`${this.config.coordinatorUrl}${endpoint}`, (res) => {
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
                const percentage = (totalUsage / 1000000) * 100;
                resolve(Math.min(percentage, 100));
            }, 100);
        });
    }
    
    /**
     * ดึงข้อมูลล่าสุด
     */
    getRecentMetrics(minutes = 5) {
        const cutoff = new Date(Date.now() - minutes * 60 * 1000);
        
        return {
            cpu: this.metrics.cpu.filter(m => new Date(m.timestamp) > cutoff),
            memory: this.metrics.memory.filter(m => new Date(m.timestamp) > cutoff),
            serverHealth: this.metrics.serverHealth.filter(m => new Date(m.timestamp) > cutoff),
            requestRate: this.metrics.requestRate.filter(m => new Date(m.timestamp) > cutoff),
            responseTime: this.metrics.responseTime.filter(m => new Date(m.timestamp) > cutoff)
        };
    }
    
    /**
     * จัดการ API requests
     */
    handleStatusRequest(res) {
        const status = {
            isScaling: this.isScaling,
            currentServers: this.currentServers,
            config: this.config,
            lastScalingAction: this.lastScalingAction,
            recentMetrics: this.getRecentMetrics(1),
            timestamp: new Date()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
    }
    
    handleMetricsRequest(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            metrics: this.metrics,
            summary: this.getMetricsSummary(),
            timestamp: new Date()
        }, null, 2));
    }
    
    handleHistoryRequest(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            history: this.scalingHistory,
            summary: this.getHistorySummary(),
            timestamp: new Date()
        }, null, 2));
    }
    
    handleConfigRequest(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            config: this.config,
            timestamp: new Date()
        }, null, 2));
    }
    
    async handleManualScaleRequest(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { action, targetServers, reason } = data;
                
                if (!['scale_up', 'scale_down'].includes(action)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid action' }));
                    return;
                }
                
                if (!targetServers || targetServers < this.config.minServers || targetServers > this.config.maxServers) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid target servers count' }));
                    return;
                }
                
                const decision = {
                    action,
                    targetServers,
                    reason: reason || 'Manual scaling request'
                };
                
                // Execute scaling in background
                setImmediate(() => this.executeScaling(decision));
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    message: 'Scaling request accepted',
                    decision,
                    timestamp: new Date()
                }));
                
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    }
    
    /**
     * สรุปข้อมูล metrics
     */
    getMetricsSummary() {
        const recent = this.getRecentMetrics(60); // Last hour
        
        return {
            cpu: {
                current: recent.cpu.length > 0 ? recent.cpu[recent.cpu.length - 1].usage : 0,
                average: recent.cpu.length > 0 ? 
                    recent.cpu.reduce((sum, m) => sum + m.usage, 0) / recent.cpu.length : 0,
                max: recent.cpu.length > 0 ? Math.max(...recent.cpu.map(m => m.usage)) : 0
            },
            memory: {
                current: recent.memory.length > 0 ? recent.memory[recent.memory.length - 1].usage : 0,
                average: recent.memory.length > 0 ? 
                    recent.memory.reduce((sum, m) => sum + m.usage, 0) / recent.memory.length : 0,
                max: recent.memory.length > 0 ? Math.max(...recent.memory.map(m => m.usage)) : 0
            },
            serverHealth: {
                current: recent.serverHealth.length > 0 ? recent.serverHealth[recent.serverHealth.length - 1].healthPercentage : 100,
                average: recent.serverHealth.length > 0 ? 
                    recent.serverHealth.reduce((sum, m) => sum + m.healthPercentage, 0) / recent.serverHealth.length : 100
            }
        };
    }
    
    /**
     * สรุปประวัติการปรับขนาด
     */
    getHistorySummary() {
        const last24h = this.scalingHistory.filter(
            h => new Date(h.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
        
        return {
            total: this.scalingHistory.length,
            last24h: last24h.length,
            successful: this.scalingHistory.filter(h => h.success).length,
            failed: this.scalingHistory.filter(h => !h.success).length,
            scaleUpCount: this.scalingHistory.filter(h => h.action === 'scale_up').length,
            scaleDownCount: this.scalingHistory.filter(h => h.action === 'scale_down').length,
            averageDuration: this.scalingHistory.length > 0 ? 
                this.scalingHistory.reduce((sum, h) => sum + h.duration, 0) / this.scalingHistory.length : 0
        };
    }
}

// เริ่มต้น Auto-scaling Manager
if (require.main === module) {
    console.log('🚀 เริ่มต้น Auto-scaling Manager...');
    console.log('📊 ระบบปรับขนาด MCP Servers อัตโนมัติ');
    console.log('=' .repeat(60));
    
    const autoScaler = new AutoScalingManager({
        minServers: 100,
        maxServers: 2000,
        targetCpuThreshold: 70,
        targetMemoryThreshold: 80,
        scaleUpThreshold: 85,
        scaleDownThreshold: 30,
        cooldownPeriod: 300000, // 5 minutes
        checkInterval: 60000, // 1 minute
        scaleUpStep: 50,
        scaleDownStep: 25
    });
    
    // Event listeners
    autoScaler.on('scaling_completed', (event) => {
        console.log(`✅ Scaling completed: ${event.action} (${event.fromServers} → ${event.toServers})`);
    });
    
    autoScaler.on('scaling_failed', (event) => {
        console.log(`❌ Scaling failed: ${event.action} (${event.reason})`);
    });
    
    autoScaler.on('scaling_error', (event) => {
        console.log(`💥 Scaling error: ${event.error}`);
    });
    
    // จัดการการปิดโปรแกรม
    process.on('SIGINT', () => {
        console.log('\n🛑 กำลังปิด Auto-scaling Manager...');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n🛑 กำลังปิด Auto-scaling Manager...');
        process.exit(0);
    });
}

module.exports = AutoScalingManager;