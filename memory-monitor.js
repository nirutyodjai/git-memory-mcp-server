
const os = require('os');
const fs = require('fs');

class MemoryMonitor {
    constructor() {
        this.logFile = 'memory-usage.log';
        this.alertThreshold = 0.85; // 85% memory usage
    }

    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    async logMemoryUsage() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const usagePercent = (usedMem / totalMem) * 100;
        
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} - Total: ${this.formatBytes(totalMem)}, Used: ${this.formatBytes(usedMem)}, Free: ${this.formatBytes(freeMem)}, Usage: ${usagePercent.toFixed(2)}%\n`;
        
        fs.appendFileSync(this.logFile, logEntry);
        
        if (usagePercent > this.alertThreshold * 100) {
            console.log(`🚨 HIGH MEMORY USAGE ALERT: ${usagePercent.toFixed(2)}%`);
            
            // Trigger garbage collection for all Node processes
            if (global.gc) {
                global.gc();
                console.log('🧹 System garbage collection triggered');
            }
        }
        
        return {
            total: totalMem,
            used: usedMem,
            free: freeMem,
            percentage: usagePercent
        };
    }

    startMonitoring(intervalMs = 10000) {
        console.log('🔍 Starting memory monitoring...');
        setInterval(() => {
            this.logMemoryUsage();
        }, intervalMs);
    }
}

const monitor = new MemoryMonitor();
monitor.startMonitoring();

// Also log initial status
monitor.logMemoryUsage().then(status => {
    console.log('📊 Initial Memory Status:', {
        total: monitor.formatBytes(status.total),
        used: monitor.formatBytes(status.used),
        free: monitor.formatBytes(status.free),
        percentage: status.percentage.toFixed(2) + '%'
    });
});
