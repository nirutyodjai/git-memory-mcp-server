/**
 * NEXUS IDE Progress Tracking System
 * ระบบติดตามความคืบหน้าแบบ real-time สำหรับ PRD
 * Created: 2025-01-06
 */

const { EventEmitter } = require('events');
const { prdTracker } = require('./prd-tracker-ai');
const fs = require('fs').promises;
const path = require('path');

class ProgressTrackingSystem extends EventEmitter {
    constructor() {
        super();
        this.isTracking = false;
        this.trackingInterval = null;
        this.webSocketClients = new Set();
        this.currentDate = new Date().toISOString().split('T')[0];
        this.progressHistory = [];
        
        this.init();
    }

    async init() {
        console.log(`📊 Progress Tracking System เริ่มทำงาน - ${this.currentDate}`);
        await this.loadProgressHistory();
        this.startRealTimeTracking();
        this.setupEventListeners();
    }

    async loadProgressHistory() {
        try {
            const historyPath = path.join(__dirname, '../logs/progress-history.json');
            const data = await fs.readFile(historyPath, 'utf8');
            this.progressHistory = JSON.parse(data);
        } catch (error) {
            this.progressHistory = [];
        }
    }

    async saveProgressHistory() {
        try {
            const historyPath = path.join(__dirname, '../logs/progress-history.json');
            await fs.mkdir(path.dirname(historyPath), { recursive: true });
            await fs.writeFile(historyPath, JSON.stringify(this.progressHistory, null, 2));
        } catch (error) {
            console.error('❌ Error saving progress history:', error);
        }
    }

    startRealTimeTracking() {
        if (this.isTracking) return;
        
        this.isTracking = true;
        console.log('🔄 เริ่ม Real-time Progress Tracking...');
        
        // ติดตามทุก 10 วินาที
        this.trackingInterval = setInterval(async () => {
            await this.trackProgress();
        }, 10000);

        // สร้าง snapshot ทุก 5 นาที
        setInterval(async () => {
            await this.createProgressSnapshot();
        }, 300000);
    }

    stopRealTimeTracking() {
        if (!this.isTracking) return;
        
        this.isTracking = false;
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }
        console.log('⏹️ หยุด Real-time Progress Tracking');
    }

    setupEventListeners() {
        // ฟัง events จาก PRD Tracker
        prdTracker.on('progress', (data) => {
            this.handleProgressUpdate(data);
        });

        prdTracker.on('milestone', (milestone) => {
            this.handleMilestoneAchieved(milestone);
        });

        // ฟัง file system changes
        this.watchFileChanges();
    }

    async trackProgress() {
        try {
            const currentStatus = await prdTracker.getStatus();
            const timestamp = new Date().toISOString();
            
            const progressData = {
                timestamp,
                date: this.currentDate,
                overallProgress: currentStatus.overallProgress,
                features: currentStatus.features.map(f => ({
                    id: f.id,
                    name: f.name,
                    status: f.status,
                    completion: f.completion
                })),
                goals: currentStatus.goals,
                systemHealth: await this.checkSystemHealth()
            };

            // เก็บประวัติ
            this.progressHistory.push(progressData);
            
            // เก็บแค่ 1000 records ล่าสุด
            if (this.progressHistory.length > 1000) {
                this.progressHistory = this.progressHistory.slice(-1000);
            }

            // ส่งข้อมูลไปยัง WebSocket clients
            this.broadcastProgress(progressData);

            // บันทึกลง file ทุก 10 records
            if (this.progressHistory.length % 10 === 0) {
                await this.saveProgressHistory();
            }

        } catch (error) {
            console.error('❌ Error tracking progress:', error);
        }
    }

    async checkSystemHealth() {
        const health = {
            apiGateway: false,
            mcpServers: 0,
            database: false,
            websocket: false,
            timestamp: new Date().toISOString()
        };

        try {
            // ตรวจสอบ API Gateway
            const response = await fetch('http://localhost:8080/health').catch(() => null);
            health.apiGateway = response?.ok || false;

            // ตรวจสอบ MCP Servers (จำลอง)
            health.mcpServers = health.apiGateway ? 1000 : 0;

            // ตรวจสอบ WebSocket
            health.websocket = this.webSocketClients.size > 0;

            // ตรวจสอบ Database (จำลอง)
            health.database = health.apiGateway;

        } catch (error) {
            console.error('❌ Error checking system health:', error);
        }

        return health;
    }

    async createProgressSnapshot() {
        const snapshot = {
            id: `snapshot-${Date.now()}`,
            createdAt: new Date().toISOString(),
            date: this.currentDate,
            status: await prdTracker.getStatus(),
            systemHealth: await this.checkSystemHealth(),
            recentActivity: this.getRecentActivity(),
            metrics: this.calculateMetrics()
        };

        // บันทึก snapshot
        const snapshotPath = path.join(__dirname, '../snapshots', `${this.currentDate}.json`);
        try {
            await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
            await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
            console.log(`📸 Progress Snapshot created: ${snapshot.id}`);
        } catch (error) {
            console.error('❌ Error creating snapshot:', error);
        }

        return snapshot;
    }

    getRecentActivity() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return this.progressHistory.filter(p => {
            return new Date(p.timestamp) > oneHourAgo;
        });
    }

    calculateMetrics() {
        if (this.progressHistory.length < 2) {
            return { trend: 'stable', velocity: 0, efficiency: 0 };
        }

        const recent = this.progressHistory.slice(-10);
        const oldest = recent[0];
        const newest = recent[recent.length - 1];

        const progressDiff = newest.overallProgress - oldest.overallProgress;
        const timeDiff = new Date(newest.timestamp) - new Date(oldest.timestamp);
        const velocity = timeDiff > 0 ? (progressDiff / (timeDiff / 1000 / 60)) : 0; // progress per minute

        return {
            trend: progressDiff > 0 ? 'improving' : progressDiff < 0 ? 'declining' : 'stable',
            velocity: Math.round(velocity * 100) / 100,
            efficiency: this.calculateEfficiency(),
            completedToday: this.getCompletedToday()
        };
    }

    calculateEfficiency() {
        // คำนวณประสิทธิภาพจากจำนวน features ที่เสร็จต่อเวลา
        const todayProgress = this.progressHistory.filter(p => p.date === this.currentDate);
        if (todayProgress.length === 0) return 0;

        const startProgress = todayProgress[0].overallProgress;
        const currentProgress = todayProgress[todayProgress.length - 1].overallProgress;
        const hoursWorked = todayProgress.length * (10 / 60 / 60); // 10 seconds intervals

        return hoursWorked > 0 ? Math.round((currentProgress - startProgress) / hoursWorked * 100) / 100 : 0;
    }

    getCompletedToday() {
        const todayProgress = this.progressHistory.filter(p => p.date === this.currentDate);
        if (todayProgress.length === 0) return 0;

        const startProgress = todayProgress[0].overallProgress;
        const currentProgress = todayProgress[todayProgress.length - 1].overallProgress;
        return Math.max(0, currentProgress - startProgress);
    }

    handleProgressUpdate(data) {
        console.log(`📈 Progress Update: ${data.feature} - ${data.progress}%`);
        this.emit('progressUpdate', data);
        
        // ส่งไปยัง WebSocket clients
        this.broadcastToClients('progressUpdate', data);
    }

    handleMilestoneAchieved(milestone) {
        console.log(`🎉 Milestone Achieved: ${milestone.id}`);
        this.emit('milestone', milestone);
        
        // ส่งไปยัง WebSocket clients
        this.broadcastToClients('milestone', milestone);
        
        // บันทึก milestone
        this.recordMilestone(milestone);
    }

    async recordMilestone(milestone) {
        const record = {
            ...milestone,
            recordedAt: new Date().toISOString(),
            date: this.currentDate
        };

        await prdTracker.markTaskComplete(`milestone-${milestone.id}`, record);
    }

    watchFileChanges() {
        // ติดตาม file changes ในโปรเจค
        const watchPaths = [
            path.join(__dirname, '../ai'),
            path.join(__dirname, '../api-gateway'),
            path.join(__dirname, '../services')
        ];

        watchPaths.forEach(watchPath => {
            try {
                const fs = require('fs');
                fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
                    if (filename && (filename.endsWith('.js') || filename.endsWith('.json'))) {
                        this.handleFileChange(eventType, filename, watchPath);
                    }
                });
            } catch (error) {
                // Path might not exist, ignore
            }
        });
    }

    handleFileChange(eventType, filename, watchPath) {
        const changeData = {
            type: eventType,
            file: filename,
            path: watchPath,
            timestamp: new Date().toISOString(),
            date: this.currentDate
        };

        console.log(`📝 File ${eventType}: ${filename}`);
        this.emit('fileChange', changeData);
        
        // ส่งไปยัง WebSocket clients
        this.broadcastToClients('fileChange', changeData);
    }

    // WebSocket Management
    addWebSocketClient(client) {
        this.webSocketClients.add(client);
        console.log(`🔌 WebSocket client connected. Total: ${this.webSocketClients.size}`);
        
        // ส่งข้อมูลปัจจุบันให้ client ใหม่
        this.sendCurrentStatus(client);
    }

    removeWebSocketClient(client) {
        this.webSocketClients.delete(client);
        console.log(`🔌 WebSocket client disconnected. Total: ${this.webSocketClients.size}`);
    }

    async sendCurrentStatus(client) {
        try {
            const status = await prdTracker.getStatus();
            const metrics = this.calculateMetrics();
            const systemHealth = await this.checkSystemHealth();
            
            client.send(JSON.stringify({
                type: 'currentStatus',
                data: {
                    status,
                    metrics,
                    systemHealth,
                    timestamp: new Date().toISOString()
                }
            }));
        } catch (error) {
            console.error('❌ Error sending current status:', error);
        }
    }

    broadcastProgress(progressData) {
        this.broadcastToClients('progress', progressData);
    }

    broadcastToClients(type, data) {
        const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
        
        this.webSocketClients.forEach(client => {
            try {
                if (client.readyState === 1) { // WebSocket.OPEN
                    client.send(message);
                }
            } catch (error) {
                console.error('❌ Error broadcasting to client:', error);
                this.webSocketClients.delete(client);
            }
        });
    }

    // API Methods
    async getProgressHistory(limit = 100) {
        return this.progressHistory.slice(-limit);
    }

    async getMetrics() {
        return this.calculateMetrics();
    }

    async getSystemHealth() {
        return await this.checkSystemHealth();
    }

    async generateDailyReport() {
        const todayData = this.progressHistory.filter(p => p.date === this.currentDate);
        const metrics = this.calculateMetrics();
        const systemHealth = await this.checkSystemHealth();
        
        const report = {
            date: this.currentDate,
            generatedAt: new Date().toISOString(),
            summary: {
                totalDataPoints: todayData.length,
                progressMade: this.getCompletedToday(),
                efficiency: metrics.efficiency,
                systemUptime: systemHealth.apiGateway ? '100%' : '0%'
            },
            metrics,
            systemHealth,
            milestones: await this.getTodayMilestones(),
            recommendations: this.generateRecommendations(metrics)
        };

        // บันทึกรายงาน
        const reportPath = path.join(__dirname, '../reports', `daily-${this.currentDate}.json`);
        try {
            await fs.mkdir(path.dirname(reportPath), { recursive: true });
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            console.log(`📋 Daily Report generated: ${reportPath}`);
        } catch (error) {
            console.error('❌ Error generating daily report:', error);
        }

        return report;
    }

    async getTodayMilestones() {
        try {
            const progressData = await prdTracker.getProgressHistory();
            return (progressData.milestones || []).filter(m => m.date === this.currentDate);
        } catch (error) {
            return [];
        }
    }

    generateRecommendations(metrics) {
        const recommendations = [];
        
        if (metrics.velocity < 0.1) {
            recommendations.push('พิจารณาเพิ่มทรัพยากรหรือปรับปรุงกระบวนการพัฒนา');
        }
        
        if (metrics.efficiency < 1) {
            recommendations.push('ควรปรับปรุงประสิทธิภาพการทำงานและลดเวลาที่สูญเสีย');
        }
        
        if (metrics.trend === 'declining') {
            recommendations.push('ตรวจสอบปัญหาที่อาจทำให้ความคืบหน้าชะลอตัว');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('ความคืบหน้าดีมาก! รักษาจังหวะการทำงานนี้ต่อไป');
        }
        
        return recommendations;
    }
}

// Export singleton instance
const progressTracker = new ProgressTrackingSystem();

module.exports = {
    ProgressTrackingSystem,
    progressTracker
};

// Auto-start if run directly
if (require.main === module) {
    console.log('🚀 Starting Progress Tracking System...');
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down Progress Tracking System...');
        progressTracker.stopRealTimeTracking();
        await progressTracker.generateDailyReport();
        process.exit(0);
    });
}