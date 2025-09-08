/**
 * NEXUS IDE Date Logging System
 * ระบบบันทึกวันที่และ timestamp สำหรับทุกงานที่เสร็จ
 * Created: 2025-01-06
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class DateLoggingSystem extends EventEmitter {
    constructor() {
        super();
        this.currentDate = new Date().toISOString().split('T')[0];
        this.currentTime = new Date().toISOString();
        this.logEntries = [];
        this.dailyLogs = new Map();
        this.logPath = path.join(__dirname, '../logs/date-logs');
        
        this.init();
    }

    async init() {
        console.log(`📅 Date Logging System เริ่มทำงาน - ${this.currentDate} ${this.currentTime}`);
        await this.ensureLogDirectory();
        await this.loadTodayLogs();
        this.startDateTracking();
    }

    async ensureLogDirectory() {
        try {
            await fs.mkdir(this.logPath, { recursive: true });
            await fs.mkdir(path.join(this.logPath, 'daily'), { recursive: true });
            await fs.mkdir(path.join(this.logPath, 'monthly'), { recursive: true });
            await fs.mkdir(path.join(this.logPath, 'yearly'), { recursive: true });
        } catch (error) {
            console.error('❌ Error creating log directories:', error);
        }
    }

    async loadTodayLogs() {
        try {
            const todayLogPath = path.join(this.logPath, 'daily', `${this.currentDate}.json`);
            const data = await fs.readFile(todayLogPath, 'utf8');
            this.logEntries = JSON.parse(data);
            console.log(`📂 โหลดข้อมูล log วันนี้: ${this.logEntries.length} entries`);
        } catch (error) {
            this.logEntries = [];
            console.log('📝 เริ่มต้น log ใหม่สำหรับวันนี้');
        }
    }

    startDateTracking() {
        // ตรวจสอบการเปลี่ยนวันทุก 1 นาที
        setInterval(() => {
            this.checkDateChange();
        }, 60000);

        // บันทึก log ทุก 5 นาที
        setInterval(async () => {
            await this.saveLogs();
        }, 300000);

        // สร้างรายงานรายเดือนทุกวันที่ 1
        setInterval(async () => {
            await this.checkMonthlyReport();
        }, 3600000); // ทุกชั่วโมง
    }

    checkDateChange() {
        const newDate = new Date().toISOString().split('T')[0];
        if (newDate !== this.currentDate) {
            this.handleDateChange(newDate);
        }
    }

    async handleDateChange(newDate) {
        console.log(`📅 วันที่เปลี่ยน: ${this.currentDate} → ${newDate}`);
        
        // บันทึก log ของวันเก่า
        await this.saveLogs();
        await this.generateDailySummary();
        
        // เริ่มวันใหม่
        this.currentDate = newDate;
        this.currentTime = new Date().toISOString();
        this.logEntries = [];
        
        this.emit('dateChanged', { oldDate: this.currentDate, newDate });
    }

    // Core Logging Methods
    logTaskCompletion(taskId, taskName, details = {}) {
        const entry = this.createLogEntry('task_completion', {
            taskId,
            taskName,
            details,
            completedAt: new Date().toISOString(),
            date: this.currentDate
        });
        
        this.addLogEntry(entry);
        console.log(`✅ Task completed: ${taskName} - ${this.currentDate}`);
        return entry;
    }

    logFeatureProgress(featureId, featureName, progress, previousProgress = 0) {
        const entry = this.createLogEntry('feature_progress', {
            featureId,
            featureName,
            progress,
            previousProgress,
            progressDelta: progress - previousProgress,
            updatedAt: new Date().toISOString(),
            date: this.currentDate
        });
        
        this.addLogEntry(entry);
        console.log(`📈 Feature progress: ${featureName} ${previousProgress}% → ${progress}%`);
        return entry;
    }

    logMilestone(milestoneId, milestoneName, details = {}) {
        const entry = this.createLogEntry('milestone', {
            milestoneId,
            milestoneName,
            details,
            achievedAt: new Date().toISOString(),
            date: this.currentDate
        });
        
        this.addLogEntry(entry);
        console.log(`🎯 Milestone achieved: ${milestoneName} - ${this.currentDate}`);
        return entry;
    }

    logCodeChange(fileName, changeType, linesChanged = 0, details = {}) {
        const entry = this.createLogEntry('code_change', {
            fileName,
            changeType, // 'created', 'modified', 'deleted'
            linesChanged,
            details,
            changedAt: new Date().toISOString(),
            date: this.currentDate
        });
        
        this.addLogEntry(entry);
        console.log(`📝 Code change: ${fileName} (${changeType}) - ${linesChanged} lines`);
        return entry;
    }

    logSystemEvent(eventType, eventName, details = {}) {
        const entry = this.createLogEntry('system_event', {
            eventType,
            eventName,
            details,
            occurredAt: new Date().toISOString(),
            date: this.currentDate
        });
        
        this.addLogEntry(entry);
        console.log(`🔧 System event: ${eventName} (${eventType})`);
        return entry;
    }

    logUserAction(action, details = {}) {
        const entry = this.createLogEntry('user_action', {
            action,
            details,
            performedAt: new Date().toISOString(),
            date: this.currentDate
        });
        
        this.addLogEntry(entry);
        console.log(`👤 User action: ${action}`);
        return entry;
    }

    logError(errorType, errorMessage, details = {}) {
        const entry = this.createLogEntry('error', {
            errorType,
            errorMessage,
            details,
            occurredAt: new Date().toISOString(),
            date: this.currentDate
        });
        
        this.addLogEntry(entry);
        console.log(`❌ Error logged: ${errorType} - ${errorMessage}`);
        return entry;
    }

    logPerformanceMetric(metricName, value, unit = '', details = {}) {
        const entry = this.createLogEntry('performance_metric', {
            metricName,
            value,
            unit,
            details,
            measuredAt: new Date().toISOString(),
            date: this.currentDate
        });
        
        this.addLogEntry(entry);
        console.log(`📊 Performance metric: ${metricName} = ${value}${unit}`);
        return entry;
    }

    // Helper Methods
    createLogEntry(type, data) {
        return {
            id: this.generateLogId(),
            type,
            timestamp: new Date().toISOString(),
            date: this.currentDate,
            time: new Date().toLocaleTimeString('th-TH'),
            data,
            sessionId: this.getSessionId()
        };
    }

    generateLogId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = `session_${this.currentDate}_${Date.now()}`;
        }
        return this.sessionId;
    }

    addLogEntry(entry) {
        this.logEntries.push(entry);
        this.emit('logEntry', entry);
        
        // Auto-save ทุก 50 entries
        if (this.logEntries.length % 50 === 0) {
            this.saveLogs();
        }
    }

    // File Operations
    async saveLogs() {
        try {
            const todayLogPath = path.join(this.logPath, 'daily', `${this.currentDate}.json`);
            await fs.writeFile(todayLogPath, JSON.stringify(this.logEntries, null, 2));
            console.log(`💾 บันทึก logs: ${this.logEntries.length} entries - ${this.currentDate}`);
        } catch (error) {
            console.error('❌ Error saving logs:', error);
        }
    }

    async generateDailySummary() {
        const summary = {
            date: this.currentDate,
            generatedAt: new Date().toISOString(),
            totalEntries: this.logEntries.length,
            summary: this.analyzeDailyLogs(),
            entries: this.logEntries
        };

        try {
            const summaryPath = path.join(this.logPath, 'daily', `${this.currentDate}-summary.json`);
            await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
            console.log(`📋 สร้างสรุปรายวัน: ${this.currentDate}`);
        } catch (error) {
            console.error('❌ Error generating daily summary:', error);
        }

        return summary;
    }

    analyzeDailyLogs() {
        const analysis = {
            taskCompletions: 0,
            featureUpdates: 0,
            milestones: 0,
            codeChanges: 0,
            systemEvents: 0,
            userActions: 0,
            errors: 0,
            performanceMetrics: 0,
            mostActiveHour: null,
            productivityScore: 0
        };

        const hourlyActivity = new Array(24).fill(0);

        this.logEntries.forEach(entry => {
            // นับตาม type
            switch (entry.type) {
                case 'task_completion':
                    analysis.taskCompletions++;
                    break;
                case 'feature_progress':
                    analysis.featureUpdates++;
                    break;
                case 'milestone':
                    analysis.milestones++;
                    break;
                case 'code_change':
                    analysis.codeChanges++;
                    break;
                case 'system_event':
                    analysis.systemEvents++;
                    break;
                case 'user_action':
                    analysis.userActions++;
                    break;
                case 'error':
                    analysis.errors++;
                    break;
                case 'performance_metric':
                    analysis.performanceMetrics++;
                    break;
            }

            // นับ activity ตาม hour
            const hour = new Date(entry.timestamp).getHours();
            hourlyActivity[hour]++;
        });

        // หา hour ที่ active ที่สุด
        const maxActivity = Math.max(...hourlyActivity);
        analysis.mostActiveHour = hourlyActivity.indexOf(maxActivity);

        // คำนวณ productivity score
        analysis.productivityScore = this.calculateProductivityScore(analysis);

        return analysis;
    }

    calculateProductivityScore(analysis) {
        // คำนวณคะแนนจากกิจกรรมต่างๆ
        let score = 0;
        score += analysis.taskCompletions * 10;
        score += analysis.featureUpdates * 5;
        score += analysis.milestones * 20;
        score += analysis.codeChanges * 2;
        score -= analysis.errors * 5; // ลดคะแนนเมื่อมี error
        
        return Math.max(0, score);
    }

    async checkMonthlyReport() {
        const today = new Date();
        if (today.getDate() === 1 && today.getHours() === 0) {
            await this.generateMonthlyReport();
        }
    }

    async generateMonthlyReport() {
        const currentMonth = new Date().toISOString().substr(0, 7); // YYYY-MM
        const monthlyData = await this.getMonthlyData(currentMonth);
        
        const report = {
            month: currentMonth,
            generatedAt: new Date().toISOString(),
            summary: this.analyzeMonthlyData(monthlyData),
            dailySummaries: monthlyData,
            trends: this.calculateMonthlyTrends(monthlyData)
        };

        try {
            const reportPath = path.join(this.logPath, 'monthly', `${currentMonth}.json`);
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            console.log(`📊 สร้างรายงานรายเดือน: ${currentMonth}`);
        } catch (error) {
            console.error('❌ Error generating monthly report:', error);
        }

        return report;
    }

    async getMonthlyData(month) {
        const monthlyData = [];
        const dailyPath = path.join(this.logPath, 'daily');
        
        try {
            const files = await fs.readdir(dailyPath);
            const summaryFiles = files.filter(f => f.includes('-summary.json') && f.startsWith(month));
            
            for (const file of summaryFiles) {
                try {
                    const data = await fs.readFile(path.join(dailyPath, file), 'utf8');
                    monthlyData.push(JSON.parse(data));
                } catch (error) {
                    console.error(`❌ Error reading ${file}:`, error);
                }
            }
        } catch (error) {
            console.error('❌ Error getting monthly data:', error);
        }

        return monthlyData;
    }

    analyzeMonthlyData(monthlyData) {
        const totals = {
            totalDays: monthlyData.length,
            totalEntries: 0,
            totalTaskCompletions: 0,
            totalFeatureUpdates: 0,
            totalMilestones: 0,
            totalCodeChanges: 0,
            totalErrors: 0,
            averageProductivityScore: 0
        };

        monthlyData.forEach(day => {
            totals.totalEntries += day.totalEntries;
            totals.totalTaskCompletions += day.summary.taskCompletions;
            totals.totalFeatureUpdates += day.summary.featureUpdates;
            totals.totalMilestones += day.summary.milestones;
            totals.totalCodeChanges += day.summary.codeChanges;
            totals.totalErrors += day.summary.errors;
            totals.averageProductivityScore += day.summary.productivityScore;
        });

        if (monthlyData.length > 0) {
            totals.averageProductivityScore = Math.round(totals.averageProductivityScore / monthlyData.length);
        }

        return totals;
    }

    calculateMonthlyTrends(monthlyData) {
        if (monthlyData.length < 2) return { trend: 'insufficient_data' };

        const firstWeek = monthlyData.slice(0, 7);
        const lastWeek = monthlyData.slice(-7);

        const firstWeekAvg = firstWeek.reduce((sum, day) => sum + day.summary.productivityScore, 0) / firstWeek.length;
        const lastWeekAvg = lastWeek.reduce((sum, day) => sum + day.summary.productivityScore, 0) / lastWeek.length;

        const trendPercentage = ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100;

        return {
            trend: trendPercentage > 10 ? 'improving' : trendPercentage < -10 ? 'declining' : 'stable',
            trendPercentage: Math.round(trendPercentage * 100) / 100,
            firstWeekAvg: Math.round(firstWeekAvg * 100) / 100,
            lastWeekAvg: Math.round(lastWeekAvg * 100) / 100
        };
    }

    // Query Methods
    async getLogsByDate(date) {
        try {
            const logPath = path.join(this.logPath, 'daily', `${date}.json`);
            const data = await fs.readFile(logPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    async getLogsByDateRange(startDate, endDate) {
        const logs = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayLogs = await this.getLogsByDate(dateStr);
            logs.push(...dayLogs);
        }
        
        return logs;
    }

    async getLogsByType(type, date = null) {
        const targetDate = date || this.currentDate;
        const logs = await this.getLogsByDate(targetDate);
        return logs.filter(log => log.type === type);
    }

    getTodayLogs() {
        return this.logEntries;
    }

    getLogStats() {
        return {
            currentDate: this.currentDate,
            todayEntries: this.logEntries.length,
            sessionId: this.sessionId,
            lastLogTime: this.logEntries.length > 0 ? this.logEntries[this.logEntries.length - 1].timestamp : null
        };
    }
}

// Export singleton instance
const dateLogger = new DateLoggingSystem();

module.exports = {
    DateLoggingSystem,
    dateLogger
};

// Auto-start if run directly
if (require.main === module) {
    console.log('🚀 Starting Date Logging System...');
    
    // Test logging
    setTimeout(() => {
        dateLogger.logTaskCompletion('test-task', 'Test Task Completion', { test: true });
        dateLogger.logFeatureProgress('test-feature', 'Test Feature', 50, 0);
        dateLogger.logMilestone('test-milestone', 'Test Milestone', { important: true });
    }, 1000);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down Date Logging System...');
        await dateLogger.saveLogs();
        await dateLogger.generateDailySummary();
        process.exit(0);
    });
}