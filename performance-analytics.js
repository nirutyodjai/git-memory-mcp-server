#!/usr/bin/env node
/**
 * Performance Analytics System with AI-Powered Insights
 * ระบบวิเคราะห์ประสิทธิภาพขั้นสูงพร้อม AI-powered insights สำหรับ Git Memory MCP Server
 * รวมถึงการวิเคราะห์แบบ real-time, การทำนายประสิทธิภาพ และการแนะนำการปรับปรุง
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { performance } = require('perf_hooks');
const EventEmitter = require('events');

class PerformanceAnalytics extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            dataPath: options.dataPath || './performance-data',
            maxDataFiles: options.maxDataFiles || 100,
            collectionInterval: options.collectionInterval || 5000, // 5 วินาที
            analysisInterval: options.analysisInterval || 60000, // 1 นาที
            aiInsightsInterval: options.aiInsightsInterval || 300000, // 5 นาที
            enableRealTimeAnalysis: options.enableRealTimeAnalysis !== false,
            enablePredictiveAnalysis: options.enablePredictiveAnalysis !== false,
            enableAIInsights: options.enableAIInsights !== false,
            ...options
        };
        
        this.metrics = {
            system: [],
            servers: new Map(),
            network: [],
            memory: [],
            cpu: [],
            disk: []
        };
        
        this.insights = [];
        this.predictions = [];
        this.recommendations = [];
        this.alerts = [];
        
        this.isCollecting = false;
        this.collectionTimer = null;
        this.analysisTimer = null;
        this.aiTimer = null;
        
        // สร้างโฟลเดอร์เก็บข้อมูล
        this.ensureDataDirectory();
        
        // เริ่มการเก็บข้อมูล
        if (this.options.enableRealTimeAnalysis) {
            this.startCollection();
        }
    }
    
    /**
     * สร้างโฟลเดอร์เก็บข้อมูล
     */
    ensureDataDirectory() {
        if (!fs.existsSync(this.options.dataPath)) {
            fs.mkdirSync(this.options.dataPath, { recursive: true });
        }
        
        // สร้างโฟลเดอร์ย่อย
        const subDirs = ['metrics', 'insights', 'predictions', 'reports'];
        for (const dir of subDirs) {
            const fullPath = path.join(this.options.dataPath, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }
        }
    }
    
    /**
     * เริ่มการเก็บข้อมูลประสิทธิภาพ
     */
    startCollection() {
        if (this.isCollecting) {
            console.log('⚠️ Performance collection is already running');
            return;
        }
        
        console.log('📊 Starting performance analytics collection...');
        this.isCollecting = true;
        
        // เก็บข้อมูลทุกๆ interval
        this.collectionTimer = setInterval(() => {
            this.collectMetrics();
        }, this.options.collectionInterval);
        
        // วิเคราะห์ข้อมูลทุกๆ interval
        this.analysisTimer = setInterval(() => {
            this.analyzePerformance();
        }, this.options.analysisInterval);
        
        // AI insights ทุกๆ interval
        if (this.options.enableAIInsights) {
            this.aiTimer = setInterval(() => {
                this.generateAIInsights();
            }, this.options.aiInsightsInterval);
        }
        
        // เก็บข้อมูลครั้งแรกทันที
        this.collectMetrics();
        
        this.emit('collectionStarted');
    }
    
    /**
     * หยุดการเก็บข้อมูล
     */
    stopCollection() {
        if (!this.isCollecting) {
            return;
        }
        
        console.log('🛑 Stopping performance analytics collection...');
        
        if (this.collectionTimer) {
            clearInterval(this.collectionTimer);
            this.collectionTimer = null;
        }
        
        if (this.analysisTimer) {
            clearInterval(this.analysisTimer);
            this.analysisTimer = null;
        }
        
        if (this.aiTimer) {
            clearInterval(this.aiTimer);
            this.aiTimer = null;
        }
        
        this.isCollecting = false;
        this.emit('collectionStopped');
    }
    
    /**
     * เก็บข้อมูลประสิทธิภาพ
     */
    async collectMetrics() {
        const timestamp = Date.now();
        
        try {
            // ข้อมูลระบบ
            const systemMetrics = await this.collectSystemMetrics();
            this.metrics.system.push({ timestamp, ...systemMetrics });
            
            // ข้อมูล MCP Servers
            const serverMetrics = await this.collectServerMetrics();
            for (const [serverId, metrics] of serverMetrics) {
                if (!this.metrics.servers.has(serverId)) {
                    this.metrics.servers.set(serverId, []);
                }
                this.metrics.servers.get(serverId).push({ timestamp, ...metrics });
            }
            
            // ข้อมูลเครือข่าย
            const networkMetrics = await this.collectNetworkMetrics();
            this.metrics.network.push({ timestamp, ...networkMetrics });
            
            // จำกัดขนาดข้อมูลในหน่วยความจำ
            this.limitMetricsSize();
            
            // บันทึกข้อมูลลงไฟล์
            await this.saveMetricsToFile(timestamp, {
                system: systemMetrics,
                servers: Object.fromEntries(serverMetrics),
                network: networkMetrics
            });
            
            this.emit('metricsCollected', { timestamp, systemMetrics, serverMetrics, networkMetrics });
            
        } catch (error) {
            console.error('❌ Failed to collect metrics:', error.message);
            this.emit('collectionError', error);
        }
    }
    
    /**
     * เก็บข้อมูลระบบ
     */
    async collectSystemMetrics() {
        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        
        // CPU Usage (ประมาณการจาก load average)
        const loadAvg = os.loadavg();
        const cpuUsage = Math.min((loadAvg[0] / cpus.length) * 100, 100);
        
        // Memory Usage
        const memoryUsage = (usedMem / totalMem) * 100;
        
        // Disk Usage (ถ้าสามารถเข้าถึงได้)
        let diskUsage = 0;
        try {
            const stats = fs.statSync('.');
            // ใช้ข้อมูลจาก process.memoryUsage() แทน
            const processMemory = process.memoryUsage();
            diskUsage = (processMemory.external / (1024 * 1024 * 1024)) * 100; // GB
        } catch (error) {
            // ไม่สามารถเข้าถึงข้อมูล disk ได้
        }
        
        // Network connections (ประมาณการจากจำนวน servers)
        let activeConnections = 0;
        try {
            if (fs.existsSync('./servers.json')) {
                const serversData = JSON.parse(fs.readFileSync('./servers.json', 'utf8'));
                activeConnections = serversData.servers?.filter(s => s.status === 'running').length || 0;
            }
        } catch (error) {
            // ไม่สามารถอ่านไฟล์ได้
        }
        
        return {
            cpu: {
                usage: cpuUsage,
                cores: cpus.length,
                loadAverage: loadAvg,
                model: cpus[0]?.model || 'Unknown'
            },
            memory: {
                total: totalMem,
                used: usedMem,
                free: freeMem,
                usage: memoryUsage,
                processMemory: process.memoryUsage()
            },
            disk: {
                usage: diskUsage
            },
            network: {
                activeConnections,
                hostname: os.hostname(),
                platform: os.platform(),
                arch: os.arch()
            },
            uptime: os.uptime(),
            processUptime: process.uptime()
        };
    }
    
    /**
     * เก็บข้อมูล MCP Servers
     */
    async collectServerMetrics() {
        const serverMetrics = new Map();
        
        try {
            if (fs.existsSync('./servers.json')) {
                const serversData = JSON.parse(fs.readFileSync('./servers.json', 'utf8'));
                
                for (const server of serversData.servers || []) {
                    const metrics = {
                        status: server.status,
                        port: server.port,
                        category: server.category,
                        pid: server.pid,
                        startTime: server.startTime,
                        uptime: server.startTime ? Date.now() - server.startTime : 0,
                        
                        // ประมาณการ performance metrics
                        responseTime: this.estimateResponseTime(server),
                        throughput: this.estimateThroughput(server),
                        errorRate: this.estimateErrorRate(server),
                        memoryUsage: this.estimateMemoryUsage(server)
                    };
                    
                    serverMetrics.set(server.name, metrics);
                }
            }
        } catch (error) {
            console.error('Failed to collect server metrics:', error.message);
        }
        
        return serverMetrics;
    }
    
    /**
     * เก็บข้อมูลเครือข่าย
     */
    async collectNetworkMetrics() {
        const networkInterfaces = os.networkInterfaces();
        const metrics = {
            interfaces: {},
            totalBytesReceived: 0,
            totalBytesSent: 0,
            activeConnections: 0
        };
        
        // วิเคราะห์ network interfaces
        for (const [name, interfaces] of Object.entries(networkInterfaces)) {
            const activeInterface = interfaces?.find(iface => !iface.internal && iface.family === 'IPv4');
            if (activeInterface) {
                metrics.interfaces[name] = {
                    address: activeInterface.address,
                    netmask: activeInterface.netmask,
                    mac: activeInterface.mac,
                    family: activeInterface.family
                };
            }
        }
        
        // ประมาณการ network traffic จากจำนวน servers
        try {
            if (fs.existsSync('./servers.json')) {
                const serversData = JSON.parse(fs.readFileSync('./servers.json', 'utf8'));
                const runningServers = serversData.servers?.filter(s => s.status === 'running').length || 0;
                
                // ประมาณการ traffic ตามจำนวน servers
                metrics.activeConnections = runningServers;
                metrics.estimatedBandwidth = runningServers * 1024; // KB/s per server
            }
        } catch (error) {
            // ไม่สามารถอ่านข้อมูลได้
        }
        
        return metrics;
    }
    
    /**
     * ประมาณการ response time
     */
    estimateResponseTime(server) {
        // ประมาณการตาม category และ uptime
        const baseTime = {
            'git-operations': 50,
            'file-management': 30,
            'data-processing': 100,
            'api-services': 25
        }[server.category] || 50;
        
        // เพิ่ม latency ถ้า server ทำงานมานาน
        const uptimeHours = server.startTime ? (Date.now() - server.startTime) / (1000 * 60 * 60) : 0;
        const latencyIncrease = Math.min(uptimeHours * 0.5, 20); // เพิ่มสูงสุด 20ms
        
        return baseTime + latencyIncrease + (Math.random() * 10); // เพิ่ม noise
    }
    
    /**
     * ประมาณการ throughput
     */
    estimateThroughput(server) {
        const baseThroughput = {
            'git-operations': 100,
            'file-management': 200,
            'data-processing': 50,
            'api-services': 300
        }[server.category] || 100;
        
        // ลด throughput ถ้า server ทำงานมานาน
        const uptimeHours = server.startTime ? (Date.now() - server.startTime) / (1000 * 60 * 60) : 0;
        const degradation = Math.min(uptimeHours * 0.01, 0.3); // ลดสูงสุด 30%
        
        return baseThroughput * (1 - degradation) + (Math.random() * 20 - 10); // เพิ่ม noise
    }
    
    /**
     * ประมาณการ error rate
     */
    estimateErrorRate(server) {
        if (server.status !== 'running') {
            return 100; // 100% error ถ้าไม่ทำงาน
        }
        
        // ประมาณการตาม uptime
        const uptimeHours = server.startTime ? (Date.now() - server.startTime) / (1000 * 60 * 60) : 0;
        const baseErrorRate = Math.min(uptimeHours * 0.1, 5); // เพิ่มสูงสุด 5%
        
        return baseErrorRate + (Math.random() * 2); // เพิ่ม noise
    }
    
    /**
     * ประมาณการ memory usage
     */
    estimateMemoryUsage(server) {
        const baseMemory = {
            'git-operations': 50,
            'file-management': 30,
            'data-processing': 100,
            'api-services': 40
        }[server.category] || 50; // MB
        
        // เพิ่ม memory usage ตาม uptime
        const uptimeHours = server.startTime ? (Date.now() - server.startTime) / (1000 * 60 * 60) : 0;
        const memoryLeak = Math.min(uptimeHours * 2, 50); // เพิ่มสูงสุด 50MB
        
        return baseMemory + memoryLeak + (Math.random() * 10); // เพิ่ม noise
    }
    
    /**
     * จำกัดขนาดข้อมูลในหน่วยความจำ
     */
    limitMetricsSize() {
        const maxPoints = 1000; // เก็บข้อมูล 1000 จุดล่าสุด
        
        // จำกัดข้อมูลระบบ
        if (this.metrics.system.length > maxPoints) {
            this.metrics.system = this.metrics.system.slice(-maxPoints);
        }
        
        // จำกัดข้อมูล servers
        for (const [serverId, data] of this.metrics.servers) {
            if (data.length > maxPoints) {
                this.metrics.servers.set(serverId, data.slice(-maxPoints));
            }
        }
        
        // จำกัดข้อมูลเครือข่าย
        if (this.metrics.network.length > maxPoints) {
            this.metrics.network = this.metrics.network.slice(-maxPoints);
        }
    }
    
    /**
     * วิเคราะห์ประสิทธิภาพ
     */
    async analyzePerformance() {
        console.log('🔍 Analyzing performance data...');
        
        try {
            const analysis = {
                timestamp: Date.now(),
                system: this.analyzeSystemPerformance(),
                servers: this.analyzeServerPerformance(),
                network: this.analyzeNetworkPerformance(),
                trends: this.analyzeTrends(),
                bottlenecks: this.identifyBottlenecks(),
                recommendations: this.generateRecommendations()
            };
            
            // บันทึกผลการวิเคราะห์
            await this.saveAnalysisToFile(analysis);
            
            this.emit('analysisCompleted', analysis);
            
            return analysis;
            
        } catch (error) {
            console.error('❌ Failed to analyze performance:', error.message);
            this.emit('analysisError', error);
        }
    }
    
    /**
     * วิเคราะห์ประสิทธิภาพระบบ
     */
    analyzeSystemPerformance() {
        if (this.metrics.system.length === 0) {
            return { status: 'no_data' };
        }
        
        const recent = this.metrics.system.slice(-10); // 10 จุดล่าสุด
        const latest = recent[recent.length - 1];
        
        // คำนวณค่าเฉลี่ย
        const avgCpuUsage = recent.reduce((sum, m) => sum + m.cpu.usage, 0) / recent.length;
        const avgMemoryUsage = recent.reduce((sum, m) => sum + m.memory.usage, 0) / recent.length;
        
        // ตรวจสอบ trends
        const cpuTrend = this.calculateTrend(recent.map(m => m.cpu.usage));
        const memoryTrend = this.calculateTrend(recent.map(m => m.memory.usage));
        
        // ประเมินสถานะ
        let status = 'healthy';
        const issues = [];
        
        if (avgCpuUsage > 80) {
            status = 'critical';
            issues.push('High CPU usage');
        } else if (avgCpuUsage > 60) {
            status = 'warning';
            issues.push('Elevated CPU usage');
        }
        
        if (avgMemoryUsage > 85) {
            status = 'critical';
            issues.push('High memory usage');
        } else if (avgMemoryUsage > 70) {
            status = 'warning';
            issues.push('Elevated memory usage');
        }
        
        return {
            status,
            issues,
            current: {
                cpu: latest.cpu.usage,
                memory: latest.memory.usage,
                uptime: latest.uptime
            },
            averages: {
                cpu: avgCpuUsage,
                memory: avgMemoryUsage
            },
            trends: {
                cpu: cpuTrend,
                memory: memoryTrend
            }
        };
    }
    
    /**
     * วิเคราะห์ประสิทธิภาพ servers
     */
    analyzeServerPerformance() {
        const analysis = {
            totalServers: this.metrics.servers.size,
            healthyServers: 0,
            warningServers: 0,
            criticalServers: 0,
            serverDetails: {},
            categories: {}
        };
        
        for (const [serverId, data] of this.metrics.servers) {
            if (data.length === 0) continue;
            
            const recent = data.slice(-5); // 5 จุดล่าสุด
            const latest = recent[recent.length - 1];
            
            // คำนวณค่าเฉลี่ย
            const avgResponseTime = recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length;
            const avgThroughput = recent.reduce((sum, m) => sum + m.throughput, 0) / recent.length;
            const avgErrorRate = recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length;
            
            // ประเมินสถานะ
            let status = 'healthy';
            const issues = [];
            
            if (latest.status !== 'running') {
                status = 'critical';
                issues.push('Server not running');
            } else {
                if (avgResponseTime > 200) {
                    status = 'warning';
                    issues.push('High response time');
                }
                
                if (avgErrorRate > 5) {
                    status = 'critical';
                    issues.push('High error rate');
                } else if (avgErrorRate > 2) {
                    status = 'warning';
                    issues.push('Elevated error rate');
                }
                
                if (avgThroughput < 50) {
                    status = 'warning';
                    issues.push('Low throughput');
                }
            }
            
            // นับสถานะ
            if (status === 'healthy') analysis.healthyServers++;
            else if (status === 'warning') analysis.warningServers++;
            else analysis.criticalServers++;
            
            // เก็บรายละเอียด
            analysis.serverDetails[serverId] = {
                status,
                issues,
                metrics: {
                    responseTime: avgResponseTime,
                    throughput: avgThroughput,
                    errorRate: avgErrorRate,
                    uptime: latest.uptime
                },
                category: latest.category
            };
            
            // สถิติตาม category
            const category = latest.category || 'unknown';
            if (!analysis.categories[category]) {
                analysis.categories[category] = {
                    total: 0,
                    healthy: 0,
                    warning: 0,
                    critical: 0
                };
            }
            
            analysis.categories[category].total++;
            analysis.categories[category][status]++;
        }
        
        return analysis;
    }
    
    /**
     * วิเคราะห์ประสิทธิภาพเครือข่าย
     */
    analyzeNetworkPerformance() {
        if (this.metrics.network.length === 0) {
            return { status: 'no_data' };
        }
        
        const recent = this.metrics.network.slice(-10);
        const latest = recent[recent.length - 1];
        
        // คำนวณค่าเฉลี่ย
        const avgConnections = recent.reduce((sum, m) => sum + m.activeConnections, 0) / recent.length;
        
        // ประเมินสถานะ
        let status = 'healthy';
        const issues = [];
        
        if (latest.activeConnections > 800) {
            status = 'warning';
            issues.push('High number of connections');
        }
        
        if (latest.activeConnections > 950) {
            status = 'critical';
            issues.push('Very high number of connections');
        }
        
        return {
            status,
            issues,
            current: {
                activeConnections: latest.activeConnections,
                interfaces: Object.keys(latest.interfaces).length
            },
            averages: {
                connections: avgConnections
            }
        };
    }
    
    /**
     * วิเคราะห์แนวโน้ม
     */
    analyzeTrends() {
        const trends = {};
        
        // แนวโน้ม CPU
        if (this.metrics.system.length > 5) {
            const cpuData = this.metrics.system.slice(-20).map(m => m.cpu.usage);
            trends.cpu = {
                direction: this.calculateTrend(cpuData),
                volatility: this.calculateVolatility(cpuData)
            };
        }
        
        // แนวโน้ม Memory
        if (this.metrics.system.length > 5) {
            const memoryData = this.metrics.system.slice(-20).map(m => m.memory.usage);
            trends.memory = {
                direction: this.calculateTrend(memoryData),
                volatility: this.calculateVolatility(memoryData)
            };
        }
        
        // แนวโน้มจำนวน servers
        if (this.metrics.network.length > 5) {
            const connectionData = this.metrics.network.slice(-20).map(m => m.activeConnections);
            trends.connections = {
                direction: this.calculateTrend(connectionData),
                volatility: this.calculateVolatility(connectionData)
            };
        }
        
        return trends;
    }
    
    /**
     * ระบุ bottlenecks
     */
    identifyBottlenecks() {
        const bottlenecks = [];
        
        if (this.metrics.system.length > 0) {
            const latest = this.metrics.system[this.metrics.system.length - 1];
            
            // CPU bottleneck
            if (latest.cpu.usage > 80) {
                bottlenecks.push({
                    type: 'cpu',
                    severity: latest.cpu.usage > 90 ? 'critical' : 'high',
                    value: latest.cpu.usage,
                    description: 'High CPU usage detected'
                });
            }
            
            // Memory bottleneck
            if (latest.memory.usage > 85) {
                bottlenecks.push({
                    type: 'memory',
                    severity: latest.memory.usage > 95 ? 'critical' : 'high',
                    value: latest.memory.usage,
                    description: 'High memory usage detected'
                });
            }
        }
        
        // Server bottlenecks
        let slowServers = 0;
        let errorServers = 0;
        
        for (const [serverId, data] of this.metrics.servers) {
            if (data.length > 0) {
                const latest = data[data.length - 1];
                
                if (latest.responseTime > 200) {
                    slowServers++;
                }
                
                if (latest.errorRate > 5) {
                    errorServers++;
                }
            }
        }
        
        if (slowServers > this.metrics.servers.size * 0.2) {
            bottlenecks.push({
                type: 'server_performance',
                severity: 'medium',
                value: slowServers,
                description: `${slowServers} servers have high response times`
            });
        }
        
        if (errorServers > 0) {
            bottlenecks.push({
                type: 'server_errors',
                severity: errorServers > this.metrics.servers.size * 0.1 ? 'high' : 'medium',
                value: errorServers,
                description: `${errorServers} servers have high error rates`
            });
        }
        
        return bottlenecks;
    }
    
    /**
     * สร้างข้อแนะนำ
     */
    generateRecommendations() {
        const recommendations = [];
        
        // วิเคราะห์ข้อมูลล่าสุด
        if (this.metrics.system.length > 0) {
            const latest = this.metrics.system[this.metrics.system.length - 1];
            
            // CPU recommendations
            if (latest.cpu.usage > 80) {
                recommendations.push({
                    type: 'cpu_optimization',
                    priority: 'high',
                    title: 'Optimize CPU Usage',
                    description: 'Consider reducing the number of concurrent servers or optimizing server code',
                    actions: [
                        'Scale down non-essential servers',
                        'Implement CPU throttling',
                        'Optimize server algorithms'
                    ]
                });
            }
            
            // Memory recommendations
            if (latest.memory.usage > 85) {
                recommendations.push({
                    type: 'memory_optimization',
                    priority: 'high',
                    title: 'Optimize Memory Usage',
                    description: 'Memory usage is high, consider memory optimization strategies',
                    actions: [
                        'Implement garbage collection tuning',
                        'Reduce server memory footprint',
                        'Add more RAM if possible'
                    ]
                });
            }
        }
        
        // Server recommendations
        let totalServers = this.metrics.servers.size;
        let runningServers = 0;
        let slowServers = 0;
        
        for (const [serverId, data] of this.metrics.servers) {
            if (data.length > 0) {
                const latest = data[data.length - 1];
                if (latest.status === 'running') {
                    runningServers++;
                    if (latest.responseTime > 200) {
                        slowServers++;
                    }
                }
            }
        }
        
        if (slowServers > runningServers * 0.2) {
            recommendations.push({
                type: 'server_performance',
                priority: 'medium',
                title: 'Improve Server Performance',
                description: `${slowServers} servers have slow response times`,
                actions: [
                    'Restart slow servers',
                    'Optimize server configuration',
                    'Check for resource conflicts'
                ]
            });
        }
        
        if (runningServers < totalServers * 0.9) {
            recommendations.push({
                type: 'server_availability',
                priority: 'medium',
                title: 'Improve Server Availability',
                description: 'Some servers are not running',
                actions: [
                    'Restart failed servers',
                    'Check server logs for errors',
                    'Implement health checks'
                ]
            });
        }
        
        return recommendations;
    }
    
    /**
     * สร้าง AI Insights
     */
    async generateAIInsights() {
        console.log('🤖 Generating AI-powered insights...');
        
        try {
            const insights = {
                timestamp: Date.now(),
                predictions: await this.generatePredictions(),
                anomalies: this.detectAnomalies(),
                optimizations: this.suggestOptimizations(),
                capacity: this.analyzeCapacity(),
                risks: this.assessRisks()
            };
            
            this.insights.push(insights);
            
            // จำกัดจำนวน insights
            if (this.insights.length > 50) {
                this.insights = this.insights.slice(-50);
            }
            
            // บันทึก insights
            await this.saveInsightsToFile(insights);
            
            this.emit('insightsGenerated', insights);
            
            return insights;
            
        } catch (error) {
            console.error('❌ Failed to generate AI insights:', error.message);
            this.emit('insightsError', error);
        }
    }
    
    /**
     * สร้างการทำนาย
     */
    async generatePredictions() {
        const predictions = [];
        
        // ทำนาย CPU usage
        if (this.metrics.system.length > 10) {
            const cpuData = this.metrics.system.slice(-20).map(m => m.cpu.usage);
            const cpuTrend = this.calculateTrend(cpuData);
            const currentCpu = cpuData[cpuData.length - 1];
            
            // ทำนาย 30 นาทีข้างหน้า
            const predictedCpu = currentCpu + (cpuTrend * 6); // 6 intervals = 30 minutes
            
            predictions.push({
                metric: 'cpu_usage',
                current: currentCpu,
                predicted: Math.max(0, Math.min(100, predictedCpu)),
                timeframe: '30_minutes',
                confidence: this.calculatePredictionConfidence(cpuData),
                trend: cpuTrend > 0 ? 'increasing' : cpuTrend < 0 ? 'decreasing' : 'stable'
            });
        }
        
        // ทำนาย Memory usage
        if (this.metrics.system.length > 10) {
            const memoryData = this.metrics.system.slice(-20).map(m => m.memory.usage);
            const memoryTrend = this.calculateTrend(memoryData);
            const currentMemory = memoryData[memoryData.length - 1];
            
            const predictedMemory = currentMemory + (memoryTrend * 6);
            
            predictions.push({
                metric: 'memory_usage',
                current: currentMemory,
                predicted: Math.max(0, Math.min(100, predictedMemory)),
                timeframe: '30_minutes',
                confidence: this.calculatePredictionConfidence(memoryData),
                trend: memoryTrend > 0 ? 'increasing' : memoryTrend < 0 ? 'decreasing' : 'stable'
            });
        }
        
        // ทำนายจำนวน active servers
        if (this.metrics.network.length > 10) {
            const connectionData = this.metrics.network.slice(-20).map(m => m.activeConnections);
            const connectionTrend = this.calculateTrend(connectionData);
            const currentConnections = connectionData[connectionData.length - 1];
            
            const predictedConnections = currentConnections + (connectionTrend * 6);
            
            predictions.push({
                metric: 'active_servers',
                current: currentConnections,
                predicted: Math.max(0, Math.min(1000, predictedConnections)),
                timeframe: '30_minutes',
                confidence: this.calculatePredictionConfidence(connectionData),
                trend: connectionTrend > 0 ? 'increasing' : connectionTrend < 0 ? 'decreasing' : 'stable'
            });
        }
        
        return predictions;
    }
    
    /**
     * ตรวจจับความผิดปกติ
     */
    detectAnomalies() {
        const anomalies = [];
        
        // ตรวจจับ CPU anomalies
        if (this.metrics.system.length > 20) {
            const cpuData = this.metrics.system.slice(-20).map(m => m.cpu.usage);
            const cpuAnomaly = this.detectStatisticalAnomaly(cpuData, 'cpu_usage');
            if (cpuAnomaly) {
                anomalies.push(cpuAnomaly);
            }
        }
        
        // ตรวจจับ Memory anomalies
        if (this.metrics.system.length > 20) {
            const memoryData = this.metrics.system.slice(-20).map(m => m.memory.usage);
            const memoryAnomaly = this.detectStatisticalAnomaly(memoryData, 'memory_usage');
            if (memoryAnomaly) {
                anomalies.push(memoryAnomaly);
            }
        }
        
        // ตรวจจับ Server response time anomalies
        for (const [serverId, data] of this.metrics.servers) {
            if (data.length > 10) {
                const responseData = data.slice(-10).map(m => m.responseTime);
                const anomaly = this.detectStatisticalAnomaly(responseData, 'response_time', serverId);
                if (anomaly) {
                    anomalies.push(anomaly);
                }
            }
        }
        
        return anomalies;
    }
    
    /**
     * แนะนำการปรับปรุง
     */
    suggestOptimizations() {
        const optimizations = [];
        
        // วิเคราะห์การใช้ทรัพยากร
        if (this.metrics.system.length > 0) {
            const latest = this.metrics.system[this.metrics.system.length - 1];
            
            // CPU optimization
            if (latest.cpu.usage < 30) {
                optimizations.push({
                    type: 'resource_utilization',
                    target: 'cpu',
                    suggestion: 'CPU utilization is low, consider increasing server load or reducing server count',
                    potential_benefit: 'Cost reduction',
                    priority: 'low'
                });
            }
            
            // Memory optimization
            if (latest.memory.usage < 40) {
                optimizations.push({
                    type: 'resource_utilization',
                    target: 'memory',
                    suggestion: 'Memory utilization is low, consider optimizing memory allocation',
                    potential_benefit: 'Resource efficiency',
                    priority: 'low'
                });
            }
        }
        
        // Server distribution optimization
        const categoryStats = {};
        for (const [serverId, data] of this.metrics.servers) {
            if (data.length > 0) {
                const latest = data[data.length - 1];
                const category = latest.category || 'unknown';
                
                if (!categoryStats[category]) {
                    categoryStats[category] = { total: 0, running: 0, avgResponseTime: 0 };
                }
                
                categoryStats[category].total++;
                if (latest.status === 'running') {
                    categoryStats[category].running++;
                    categoryStats[category].avgResponseTime += latest.responseTime;
                }
            }
        }
        
        // คำนวณค่าเฉลี่ย response time
        for (const category of Object.keys(categoryStats)) {
            if (categoryStats[category].running > 0) {
                categoryStats[category].avgResponseTime /= categoryStats[category].running;
                
                // แนะนำการปรับปรุงถ้า response time สูง
                if (categoryStats[category].avgResponseTime > 150) {
                    optimizations.push({
                        type: 'performance_optimization',
                        target: category,
                        suggestion: `${category} servers have high response times, consider optimization`,
                        potential_benefit: 'Improved user experience',
                        priority: 'medium'
                    });
                }
            }
        }
        
        return optimizations;
    }
    
    /**
     * วิเคราะห์ความจุ
     */
    analyzeCapacity() {
        const capacity = {
            current_utilization: {},
            projected_needs: {},
            scaling_recommendations: []
        };
        
        // วิเคราะห์การใช้งานปัจจุบัน
        if (this.metrics.system.length > 0) {
            const latest = this.metrics.system[this.metrics.system.length - 1];
            
            capacity.current_utilization = {
                cpu: latest.cpu.usage,
                memory: latest.memory.usage,
                servers: this.metrics.servers.size
            };
            
            // คำนวณความต้องการในอนาคต
            if (this.metrics.system.length > 10) {
                const cpuTrend = this.calculateTrend(this.metrics.system.slice(-10).map(m => m.cpu.usage));
                const memoryTrend = this.calculateTrend(this.metrics.system.slice(-10).map(m => m.memory.usage));
                
                capacity.projected_needs = {
                    cpu_in_1hour: Math.max(0, Math.min(100, latest.cpu.usage + (cpuTrend * 12))),
                    memory_in_1hour: Math.max(0, Math.min(100, latest.memory.usage + (memoryTrend * 12)))
                };
                
                // แนะนำการ scaling
                if (capacity.projected_needs.cpu_in_1hour > 80) {
                    capacity.scaling_recommendations.push({
                        type: 'scale_down',
                        reason: 'High CPU usage projected',
                        action: 'Reduce server count or optimize CPU usage'
                    });
                }
                
                if (capacity.projected_needs.memory_in_1hour > 85) {
                    capacity.scaling_recommendations.push({
                        type: 'scale_down',
                        reason: 'High memory usage projected',
                        action: 'Reduce server count or optimize memory usage'
                    });
                }
                
                if (latest.cpu.usage < 30 && latest.memory.usage < 40) {
                    capacity.scaling_recommendations.push({
                        type: 'scale_up',
                        reason: 'Low resource utilization',
                        action: 'Consider increasing server count or workload'
                    });
                }
            }
        }
        
        return capacity;
    }
    
    /**
     * ประเมินความเสี่ยง
     */
    assessRisks() {
        const risks = [];
        
        // ความเสี่ยงจากการใช้ทรัพยากรสูง
        if (this.metrics.system.length > 0) {
            const latest = this.metrics.system[this.metrics.system.length - 1];
            
            if (latest.cpu.usage > 85) {
                risks.push({
                    type: 'resource_exhaustion',
                    severity: 'high',
                    description: 'CPU usage is critically high',
                    impact: 'System slowdown or failure',
                    mitigation: 'Scale down servers or optimize CPU usage'
                });
            }
            
            if (latest.memory.usage > 90) {
                risks.push({
                    type: 'resource_exhaustion',
                    severity: 'critical',
                    description: 'Memory usage is critically high',
                    impact: 'Out of memory errors, system crash',
                    mitigation: 'Immediately reduce memory usage or add more RAM'
                });
            }
        }
        
        // ความเสี่ยงจาก server failures
        let failedServers = 0;
        let totalServers = this.metrics.servers.size;
        
        for (const [serverId, data] of this.metrics.servers) {
            if (data.length > 0) {
                const latest = data[data.length - 1];
                if (latest.status !== 'running') {
                    failedServers++;
                }
            }
        }
        
        if (failedServers > totalServers * 0.1) {
            risks.push({
                type: 'service_availability',
                severity: failedServers > totalServers * 0.2 ? 'high' : 'medium',
                description: `${failedServers} out of ${totalServers} servers are not running`,
                impact: 'Reduced service capacity and reliability',
                mitigation: 'Restart failed servers and investigate root causes'
            });
        }
        
        // ความเสี่ยงจาก performance degradation
        let slowServers = 0;
        for (const [serverId, data] of this.metrics.servers) {
            if (data.length > 0) {
                const latest = data[data.length - 1];
                if (latest.responseTime > 300) {
                    slowServers++;
                }
            }
        }
        
        if (slowServers > totalServers * 0.15) {
            risks.push({
                type: 'performance_degradation',
                severity: 'medium',
                description: `${slowServers} servers have very slow response times`,
                impact: 'Poor user experience and reduced throughput',
                mitigation: 'Optimize server performance or restart slow servers'
            });
        }
        
        return risks;
    }
    
    /**
     * คำนวณแนวโน้ม (Linear regression slope)
     */
    calculateTrend(data) {
        if (data.length < 2) return 0;
        
        const n = data.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = data;
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        
        return slope || 0;
    }
    
    /**
     * คำนวณความผันผวน
     */
    calculateVolatility(data) {
        if (data.length < 2) return 0;
        
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
        
        return Math.sqrt(variance);
    }
    
    /**
     * คำนวณความเชื่อมั่นในการทำนาย
     */
    calculatePredictionConfidence(data) {
        const volatility = this.calculateVolatility(data);
        const trend = Math.abs(this.calculateTrend(data));
        
        // ความเชื่อมั่นสูงถ้าข้อมูลมีแนวโน้มชัดเจนและความผันผวนต่ำ
        let confidence = 0.5; // base confidence
        
        if (trend > 1) confidence += 0.2; // มีแนวโน้มชัดเจน
        if (volatility < 5) confidence += 0.2; // ความผันผวนต่ำ
        if (data.length > 15) confidence += 0.1; // ข้อมูลเยอะ
        
        return Math.min(0.95, Math.max(0.1, confidence));
    }
    
    /**
     * ตรวจจับความผิดปกติทางสถิติ
     */
    detectStatisticalAnomaly(data, metricType, serverId = null) {
        if (data.length < 10) return null;
        
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const stdDev = Math.sqrt(data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length);
        
        const latest = data[data.length - 1];
        const zScore = Math.abs((latest - mean) / stdDev);
        
        // ถือว่าผิดปกติถ้า z-score > 2 (นอกเหนือ 2 standard deviations)
        if (zScore > 2) {
            return {
                type: 'statistical_anomaly',
                metric: metricType,
                server: serverId,
                current_value: latest,
                expected_range: {
                    min: mean - 2 * stdDev,
                    max: mean + 2 * stdDev
                },
                z_score: zScore,
                severity: zScore > 3 ? 'high' : 'medium',
                description: `${metricType} value is ${zScore.toFixed(2)} standard deviations from normal`
            };
        }
        
        return null;
    }
    
    /**
     * บันทึกข้อมูลลงไฟล์
     */
    async saveMetricsToFile(timestamp, metrics) {
        try {
            const filename = `metrics-${new Date(timestamp).toISOString().split('T')[0]}.json`;
            const filepath = path.join(this.options.dataPath, 'metrics', filename);
            
            let existingData = [];
            if (fs.existsSync(filepath)) {
                existingData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            }
            
            existingData.push({ timestamp, ...metrics });
            
            // เก็บเฉพาะข้อมูล 24 ชั่วโมงล่าสุด
            const oneDayAgo = timestamp - (24 * 60 * 60 * 1000);
            existingData = existingData.filter(item => item.timestamp > oneDayAgo);
            
            fs.writeFileSync(filepath, JSON.stringify(existingData, null, 2));
            
        } catch (error) {
            console.error('Failed to save metrics:', error.message);
        }
    }
    
    /**
     * บันทึกผลการวิเคราะห์
     */
    async saveAnalysisToFile(analysis) {
        try {
            const filename = `analysis-${new Date().toISOString().split('T')[0]}.json`;
            const filepath = path.join(this.options.dataPath, 'reports', filename);
            
            let existingData = [];
            if (fs.existsSync(filepath)) {
                existingData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            }
            
            existingData.push(analysis);
            
            // เก็บเฉพาะข้อมูล 7 วันล่าสุด
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            existingData = existingData.filter(item => item.timestamp > oneWeekAgo);
            
            fs.writeFileSync(filepath, JSON.stringify(existingData, null, 2));
            
        } catch (error) {
            console.error('Failed to save analysis:', error.message);
        }
    }
    
    /**
     * บันทึก AI insights
     */
    async saveInsightsToFile(insights) {
        try {
            const filename = `insights-${new Date().toISOString().split('T')[0]}.json`;
            const filepath = path.join(this.options.dataPath, 'insights', filename);
            
            let existingData = [];
            if (fs.existsSync(filepath)) {
                existingData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            }
            
            existingData.push(insights);
            
            // เก็บเฉพาะข้อมูล 30 วันล่าสุด
            const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            existingData = existingData.filter(item => item.timestamp > oneMonthAgo);
            
            fs.writeFileSync(filepath, JSON.stringify(existingData, null, 2));
            
        } catch (error) {
            console.error('Failed to save insights:', error.message);
        }
    }
    
    /**
     * ดึงข้อมูลประสิทธิภาพล่าสุด
     */
    getCurrentMetrics() {
        const current = {
            timestamp: Date.now(),
            system: this.metrics.system.length > 0 ? this.metrics.system[this.metrics.system.length - 1] : null,
            servers: {},
            network: this.metrics.network.length > 0 ? this.metrics.network[this.metrics.network.length - 1] : null
        };
        
        // ข้อมูล servers ล่าสุด
        for (const [serverId, data] of this.metrics.servers) {
            if (data.length > 0) {
                current.servers[serverId] = data[data.length - 1];
            }
        }
        
        return current;
    }
    
    /**
     * ดึงสถิติโดยรวม
     */
    getOverallStats() {
        const stats = {
            collection: {
                isRunning: this.isCollecting,
                dataPoints: {
                    system: this.metrics.system.length,
                    servers: this.metrics.servers.size,
                    network: this.metrics.network.length
                }
            },
            insights: {
                total: this.insights.length,
                latest: this.insights.length > 0 ? this.insights[this.insights.length - 1] : null
            },
            alerts: {
                total: this.alerts.length,
                active: this.alerts.filter(a => !a.resolved).length
            }
        };
        
        return stats;
    }
    
    /**
     * สร้างรายงานประสิทธิภาพ
     */
    async generatePerformanceReport(timeRange = '1hour') {
        console.log(`📊 Generating performance report for ${timeRange}...`);
        
        const now = Date.now();
        const timeRanges = {
            '1hour': 60 * 60 * 1000,
            '6hours': 6 * 60 * 60 * 1000,
            '24hours': 24 * 60 * 60 * 1000,
            '7days': 7 * 24 * 60 * 60 * 1000
        };
        
        const rangeMs = timeRanges[timeRange] || timeRanges['1hour'];
        const startTime = now - rangeMs;
        
        // กรองข้อมูลตามช่วงเวลา
        const systemData = this.metrics.system.filter(m => m.timestamp >= startTime);
        const networkData = this.metrics.network.filter(m => m.timestamp >= startTime);
        
        const report = {
            timeRange,
            startTime,
            endTime: now,
            summary: {
                dataPoints: systemData.length,
                avgCpuUsage: systemData.length > 0 ? systemData.reduce((sum, m) => sum + m.cpu.usage, 0) / systemData.length : 0,
                avgMemoryUsage: systemData.length > 0 ? systemData.reduce((sum, m) => sum + m.memory.usage, 0) / systemData.length : 0,
                maxCpuUsage: systemData.length > 0 ? Math.max(...systemData.map(m => m.cpu.usage)) : 0,
                maxMemoryUsage: systemData.length > 0 ? Math.max(...systemData.map(m => m.memory.usage)) : 0
            },
            trends: {
                cpu: systemData.length > 5 ? this.calculateTrend(systemData.map(m => m.cpu.usage)) : 0,
                memory: systemData.length > 5 ? this.calculateTrend(systemData.map(m => m.memory.usage)) : 0
            },
            servers: {
                total: this.metrics.servers.size,
                categories: this.getServerCategoryStats(startTime)
            },
            recommendations: this.generateRecommendations(),
            insights: this.insights.filter(i => i.timestamp >= startTime)
        };
        
        // บันทึกรายงาน
        try {
            const filename = `report-${timeRange}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            const filepath = path.join(this.options.dataPath, 'reports', filename);
            fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
            console.log(`📄 Report saved: ${filename}`);
        } catch (error) {
            console.error('Failed to save report:', error.message);
        }
        
        return report;
    }
    
    /**
     * ดึงสถิติ servers ตาม category
     */
    getServerCategoryStats(startTime = 0) {
        const stats = {};
        
        for (const [serverId, data] of this.metrics.servers) {
            const relevantData = data.filter(m => m.timestamp >= startTime);
            if (relevantData.length === 0) continue;
            
            const latest = relevantData[relevantData.length - 1];
            const category = latest.category || 'unknown';
            
            if (!stats[category]) {
                stats[category] = {
                    total: 0,
                    running: 0,
                    avgResponseTime: 0,
                    avgThroughput: 0,
                    avgErrorRate: 0,
                    servers: []
                };
            }
            
            stats[category].total++;
            stats[category].servers.push(serverId);
            
            if (latest.status === 'running') {
                stats[category].running++;
                stats[category].avgResponseTime += latest.responseTime;
                stats[category].avgThroughput += latest.throughput;
                stats[category].avgErrorRate += latest.errorRate;
            }
        }
        
        // คำนวณค่าเฉลี่ย
        for (const category of Object.keys(stats)) {
            if (stats[category].running > 0) {
                stats[category].avgResponseTime /= stats[category].running;
                stats[category].avgThroughput /= stats[category].running;
                stats[category].avgErrorRate /= stats[category].running;
            }
        }
        
        return stats;
    }
    
    /**
     * ล้างข้อมูลเก่า
     */
    async cleanupOldData(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 วัน
        console.log('🧹 Cleaning up old performance data...');
        
        const cutoffTime = Date.now() - maxAge;
        
        try {
            // ล้างข้อมูลในหน่วยความจำ
            this.metrics.system = this.metrics.system.filter(m => m.timestamp > cutoffTime);
            this.metrics.network = this.metrics.network.filter(m => m.timestamp > cutoffTime);
            
            for (const [serverId, data] of this.metrics.servers) {
                const filteredData = data.filter(m => m.timestamp > cutoffTime);
                if (filteredData.length === 0) {
                    this.metrics.servers.delete(serverId);
                } else {
                    this.metrics.servers.set(serverId, filteredData);
                }
            }
            
            this.insights = this.insights.filter(i => i.timestamp > cutoffTime);
            
            // ล้างไฟล์เก่า
            const dirs = ['metrics', 'insights', 'reports'];
            for (const dir of dirs) {
                const dirPath = path.join(this.options.dataPath, dir);
                if (fs.existsSync(dirPath)) {
                    const files = fs.readdirSync(dirPath);
                    for (const file of files) {
                        const filePath = path.join(dirPath, file);
                        const stats = fs.statSync(filePath);
                        if (stats.mtime.getTime() < cutoffTime) {
                            fs.unlinkSync(filePath);
                            console.log(`🗑️ Deleted old file: ${file}`);
                        }
                    }
                }
            }
            
            console.log('✅ Cleanup completed');
            
        } catch (error) {
            console.error('❌ Failed to cleanup old data:', error.message);
        }
    }
    
    /**
     * ส่งออกข้อมูลเป็น CSV
     */
    exportToCSV(timeRange = '24hours') {
        console.log(`📊 Exporting data to CSV for ${timeRange}...`);
        
        const now = Date.now();
        const timeRanges = {
            '1hour': 60 * 60 * 1000,
            '6hours': 6 * 60 * 60 * 1000,
            '24hours': 24 * 60 * 60 * 1000,
            '7days': 7 * 24 * 60 * 60 * 1000
        };
        
        const rangeMs = timeRanges[timeRange] || timeRanges['24hours'];
        const startTime = now - rangeMs;
        
        // กรองข้อมูล
        const systemData = this.metrics.system.filter(m => m.timestamp >= startTime);
        
        // สร้าง CSV header
        const headers = [
            'timestamp',
            'datetime',
            'cpu_usage',
            'memory_usage',
            'memory_total',
            'memory_used',
            'active_connections',
            'uptime'
        ];
        
        // สร้าง CSV rows
        const rows = systemData.map(data => [
            data.timestamp,
            new Date(data.timestamp).toISOString(),
            data.cpu.usage.toFixed(2),
            data.memory.usage.toFixed(2),
            Math.round(data.memory.total / (1024 * 1024)), // MB
            Math.round(data.memory.used / (1024 * 1024)), // MB
            data.network?.activeConnections || 0,
            Math.round(data.uptime)
        ]);
        
        // รวม header และ rows
        const csvContent = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');
        
        // บันทึกไฟล์
        try {
            const filename = `performance-export-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
            const filepath = path.join(this.options.dataPath, filename);
            fs.writeFileSync(filepath, csvContent);
            console.log(`📄 CSV exported: ${filename}`);
            return filepath;
        } catch (error) {
            console.error('❌ Failed to export CSV:', error.message);
            return null;
        }
    }
    
    /**
     * ปิดระบบ
     */
    async shutdown() {
        console.log('🛑 Shutting down Performance Analytics...');
        
        this.stopCollection();
        
        // บันทึกข้อมูลสุดท้าย
        if (this.metrics.system.length > 0 || this.metrics.servers.size > 0) {
            await this.saveMetricsToFile(Date.now(), {
                system: this.metrics.system[this.metrics.system.length - 1] || {},
                servers: Object.fromEntries(Array.from(this.metrics.servers.entries()).map(([id, data]) => [
                    id, data[data.length - 1] || {}
                ])),
                network: this.metrics.network[this.metrics.network.length - 1] || {}
            });
        }
        
        this.emit('shutdown');
        console.log('✅ Performance Analytics shutdown completed');
    }
}

// Export class
module.exports = PerformanceAnalytics;

// CLI interface
if (require.main === module) {
    const analytics = new PerformanceAnalytics({
        enableRealTimeAnalysis: true,
        enablePredictiveAnalysis: true,
        enableAIInsights: true,
        collectionInterval: 5000,
        analysisInterval: 60000,
        aiInsightsInterval: 300000
    });
    
    // Event listeners
    analytics.on('metricsCollected', (data) => {
        console.log(`📊 Metrics collected at ${new Date(data.timestamp).toLocaleTimeString()}`);
    });
    
    analytics.on('analysisCompleted', (analysis) => {
        console.log(`🔍 Analysis completed - System: ${analysis.system.status}`);
    });
    
    analytics.on('insightsGenerated', (insights) => {
        console.log(`🤖 AI insights generated - ${insights.predictions.length} predictions, ${insights.anomalies.length} anomalies`);
    });
    
    analytics.on('collectionError', (error) => {
        console.error('❌ Collection error:', error.message);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await analytics.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        await analytics.shutdown();
        process.exit(0);
    });
    
    console.log('🚀 Performance Analytics started!');
    console.log('Press Ctrl+C to stop');
}