/**
 * Git Memory MCP Server - Backup Scheduler
 * ระบบจัดการตารางเวลาสำรองข้อมูลแบบยืดหยุ่น
 * 
 * Features:
 * - Flexible scheduling (cron-like)
 * - Multiple backup strategies
 * - Priority-based scheduling
 * - Resource-aware scheduling
 * - Conflict resolution
 * - Schedule optimization
 * - Event-driven triggers
 * - Performance monitoring
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const BackupManager = require('./backup-manager');

class BackupScheduler extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            // Scheduling options
            enableScheduling: options.enableScheduling !== false,
            maxConcurrentBackups: options.maxConcurrentBackups || 2,
            scheduleFile: options.scheduleFile || path.join(__dirname, 'backup-schedule.json'),
            
            // Resource monitoring
            monitorResources: options.monitorResources !== false,
            maxCpuUsage: options.maxCpuUsage || 80, // %
            maxMemoryUsage: options.maxMemoryUsage || 80, // %
            maxDiskUsage: options.maxDiskUsage || 90, // %
            
            // Backup strategies
            strategies: options.strategies || {
                'critical': {
                    type: 'full',
                    frequency: '0 */6 * * *', // Every 6 hours
                    priority: 1,
                    retryCount: 3,
                    timeout: 30 * 60 * 1000 // 30 minutes
                },
                'important': {
                    type: 'incremental',
                    frequency: '0 */2 * * *', // Every 2 hours
                    priority: 2,
                    retryCount: 2,
                    timeout: 15 * 60 * 1000 // 15 minutes
                },
                'regular': {
                    type: 'incremental',
                    frequency: '0 */4 * * *', // Every 4 hours
                    priority: 3,
                    retryCount: 1,
                    timeout: 10 * 60 * 1000 // 10 minutes
                }
            },
            
            ...options
        };
        
        this.schedules = new Map();
        this.activeBackups = new Map();
        this.schedulerInterval = null;
        this.isRunning = false;
        
        this.backupManager = new BackupManager(options.backupManager || {});
        
        this.stats = {
            scheduledBackups: 0,
            completedBackups: 0,
            failedBackups: 0,
            skippedBackups: 0,
            totalExecutionTime: 0,
            averageExecutionTime: 0,
            lastScheduleCheck: null,
            nextScheduledBackup: null
        };
        
        this.init();
    }
    
    /**
     * Initialize scheduler
     */
    init() {
        console.log('📅 Initializing Backup Scheduler...');
        
        // Load existing schedules
        this.loadSchedules();
        
        // Setup backup manager event listeners
        this.setupBackupManagerListeners();
        
        // Start scheduler if enabled
        if (this.options.enableScheduling) {
            this.start();
        }
        
        console.log('✅ Backup Scheduler initialized');
        this.emit('initialized');
    }
    
    /**
     * Setup backup manager event listeners
     */
    setupBackupManagerListeners() {
        this.backupManager.on('backupCompleted', (backupInfo) => {
            this.handleBackupCompleted(backupInfo);
        });
        
        this.backupManager.on('backupError', (error) => {
            this.handleBackupError(error);
        });
        
        this.backupManager.on('backupStarted', (backupInfo) => {
            this.handleBackupStarted(backupInfo);
        });
    }
    
    /**
     * Start scheduler
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ Scheduler is already running');
            return;
        }
        
        console.log('🚀 Starting Backup Scheduler...');
        this.isRunning = true;
        
        // Check schedules every minute
        this.schedulerInterval = setInterval(() => {
            this.checkSchedules().catch(error => {
                console.error('❌ Schedule check failed:', error.message);
            });
        }, 60 * 1000);
        
        // Initial schedule check
        setTimeout(() => {
            this.checkSchedules().catch(error => {
                console.error('❌ Initial schedule check failed:', error.message);
            });
        }, 5000);
        
        this.emit('started');
    }
    
    /**
     * Stop scheduler
     */
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ Scheduler is not running');
            return;
        }
        
        console.log('🛑 Stopping Backup Scheduler...');
        this.isRunning = false;
        
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }
        
        // Wait for active backups to complete
        if (this.activeBackups.size > 0) {
            console.log(`⏳ Waiting for ${this.activeBackups.size} active backups to complete...`);
        }
        
        this.emit('stopped');
    }
    
    /**
     * Add schedule
     */
    addSchedule(name, schedule) {
        const scheduleConfig = {
            name,
            enabled: schedule.enabled !== false,
            type: schedule.type || 'incremental',
            frequency: schedule.frequency,
            priority: schedule.priority || 5,
            retryCount: schedule.retryCount || 1,
            timeout: schedule.timeout || 10 * 60 * 1000,
            conditions: schedule.conditions || {},
            targets: schedule.targets || ['all'],
            lastRun: null,
            nextRun: null,
            runCount: 0,
            successCount: 0,
            failureCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        // Calculate next run time
        scheduleConfig.nextRun = this.calculateNextRun(scheduleConfig.frequency);
        
        this.schedules.set(name, scheduleConfig);
        this.saveSchedules();
        
        console.log(`📅 Added schedule: ${name} (next run: ${new Date(scheduleConfig.nextRun).toISOString()})`);
        this.emit('scheduleAdded', scheduleConfig);
        
        return scheduleConfig;
    }
    
    /**
     * Remove schedule
     */
    removeSchedule(name) {
        if (!this.schedules.has(name)) {
            throw new Error(`Schedule not found: ${name}`);
        }
        
        const schedule = this.schedules.get(name);
        this.schedules.delete(name);
        this.saveSchedules();
        
        console.log(`🗑️ Removed schedule: ${name}`);
        this.emit('scheduleRemoved', schedule);
        
        return schedule;
    }
    
    /**
     * Update schedule
     */
    updateSchedule(name, updates) {
        if (!this.schedules.has(name)) {
            throw new Error(`Schedule not found: ${name}`);
        }
        
        const schedule = this.schedules.get(name);
        Object.assign(schedule, updates, { updatedAt: Date.now() });
        
        // Recalculate next run if frequency changed
        if (updates.frequency) {
            schedule.nextRun = this.calculateNextRun(schedule.frequency);
        }
        
        this.schedules.set(name, schedule);
        this.saveSchedules();
        
        console.log(`📝 Updated schedule: ${name}`);
        this.emit('scheduleUpdated', schedule);
        
        return schedule;
    }
    
    /**
     * Enable/disable schedule
     */
    toggleSchedule(name, enabled = null) {
        if (!this.schedules.has(name)) {
            throw new Error(`Schedule not found: ${name}`);
        }
        
        const schedule = this.schedules.get(name);
        schedule.enabled = enabled !== null ? enabled : !schedule.enabled;
        schedule.updatedAt = Date.now();
        
        this.schedules.set(name, schedule);
        this.saveSchedules();
        
        console.log(`${schedule.enabled ? '✅' : '❌'} ${schedule.enabled ? 'Enabled' : 'Disabled'} schedule: ${name}`);
        this.emit('scheduleToggled', schedule);
        
        return schedule;
    }
    
    /**
     * Check schedules and execute due backups
     */
    async checkSchedules() {
        const now = Date.now();
        this.stats.lastScheduleCheck = now;
        
        // Get due schedules
        const dueSchedules = Array.from(this.schedules.values())
            .filter(schedule => 
                schedule.enabled && 
                schedule.nextRun && 
                schedule.nextRun <= now
            )
            .sort((a, b) => a.priority - b.priority); // Sort by priority (lower number = higher priority)
        
        if (dueSchedules.length === 0) {
            // Update next scheduled backup
            this.updateNextScheduledBackup();
            return;
        }
        
        console.log(`📅 Found ${dueSchedules.length} due schedules`);
        
        for (const schedule of dueSchedules) {
            try {
                // Check if we can run this backup
                if (await this.canRunBackup(schedule)) {
                    await this.executeScheduledBackup(schedule);
                } else {
                    console.log(`⏸️ Skipping backup ${schedule.name} - conditions not met`);
                    this.stats.skippedBackups++;
                    
                    // Reschedule for next check
                    schedule.nextRun = now + (5 * 60 * 1000); // Try again in 5 minutes
                }
            } catch (error) {
                console.error(`❌ Failed to execute scheduled backup ${schedule.name}:`, error.message);
                this.handleScheduleError(schedule, error);
            }
        }
        
        this.updateNextScheduledBackup();
    }
    
    /**
     * Check if backup can run
     */
    async canRunBackup(schedule) {
        // Check concurrent backup limit
        if (this.activeBackups.size >= this.options.maxConcurrentBackups) {
            return false;
        }
        
        // Check resource usage if monitoring is enabled
        if (this.options.monitorResources) {
            const resources = await this.getResourceUsage();
            
            if (resources.cpu > this.options.maxCpuUsage ||
                resources.memory > this.options.maxMemoryUsage ||
                resources.disk > this.options.maxDiskUsage) {
                return false;
            }
        }
        
        // Check custom conditions
        if (schedule.conditions) {
            if (schedule.conditions.minFreeSpace) {
                const freeSpace = await this.getFreeSpace();
                if (freeSpace < schedule.conditions.minFreeSpace) {
                    return false;
                }
            }
            
            if (schedule.conditions.maxLoadAverage) {
                const loadAverage = await this.getLoadAverage();
                if (loadAverage > schedule.conditions.maxLoadAverage) {
                    return false;
                }
            }
            
            if (schedule.conditions.timeWindow) {
                const currentHour = new Date().getHours();
                const { start, end } = schedule.conditions.timeWindow;
                if (currentHour < start || currentHour > end) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Execute scheduled backup
     */
    async executeScheduledBackup(schedule) {
        const backupId = `scheduled-${schedule.name}-${Date.now()}`;
        const startTime = Date.now();
        
        console.log(`🚀 Executing scheduled backup: ${schedule.name} (${schedule.type})`);
        
        // Update schedule stats
        schedule.lastRun = startTime;
        schedule.runCount++;
        schedule.nextRun = this.calculateNextRun(schedule.frequency, startTime);
        
        // Add to active backups
        this.activeBackups.set(backupId, {
            scheduleId: schedule.name,
            schedule,
            startTime,
            timeout: setTimeout(() => {
                this.handleBackupTimeout(backupId);
            }, schedule.timeout)
        });
        
        this.stats.scheduledBackups++;
        
        try {
            let backupResult;
            
            // Execute backup based on type
            if (schedule.type === 'full') {
                backupResult = await this.backupManager.createFullBackup();
            } else {
                backupResult = await this.backupManager.createIncrementalBackup();
            }
            
            // Handle successful backup
            if (backupResult) {
                schedule.successCount++;
                this.stats.completedBackups++;
                
                const executionTime = Date.now() - startTime;
                this.stats.totalExecutionTime += executionTime;
                this.stats.averageExecutionTime = this.stats.totalExecutionTime / this.stats.completedBackups;
                
                console.log(`✅ Scheduled backup completed: ${schedule.name} (${executionTime}ms)`);
                this.emit('scheduledBackupCompleted', { schedule, backupResult, executionTime });
            }
            
        } catch (error) {
            schedule.failureCount++;
            this.stats.failedBackups++;
            
            console.error(`❌ Scheduled backup failed: ${schedule.name} - ${error.message}`);
            this.emit('scheduledBackupFailed', { schedule, error });
            
            // Retry logic
            if (schedule.retryCount > 0) {
                schedule.retryCount--;
                schedule.nextRun = Date.now() + (5 * 60 * 1000); // Retry in 5 minutes
                console.log(`🔄 Will retry backup ${schedule.name} in 5 minutes (${schedule.retryCount} retries left)`);
            }
        } finally {
            // Remove from active backups
            const activeBackup = this.activeBackups.get(backupId);
            if (activeBackup && activeBackup.timeout) {
                clearTimeout(activeBackup.timeout);
            }
            this.activeBackups.delete(backupId);
            
            // Save updated schedule
            this.schedules.set(schedule.name, schedule);
            this.saveSchedules();
        }
    }
    
    /**
     * Handle backup timeout
     */
    handleBackupTimeout(backupId) {
        const activeBackup = this.activeBackups.get(backupId);
        if (!activeBackup) return;
        
        console.error(`⏰ Backup timeout: ${activeBackup.schedule.name}`);
        
        // Update schedule
        activeBackup.schedule.failureCount++;
        this.stats.failedBackups++;
        
        // Remove from active backups
        this.activeBackups.delete(backupId);
        
        this.emit('backupTimeout', activeBackup);
    }
    
    /**
     * Handle schedule error
     */
    handleScheduleError(schedule, error) {
        schedule.failureCount++;
        schedule.nextRun = this.calculateNextRun(schedule.frequency, Date.now() + (10 * 60 * 1000)); // Delay 10 minutes
        
        this.schedules.set(schedule.name, schedule);
        this.saveSchedules();
        
        this.emit('scheduleError', { schedule, error });
    }
    
    /**
     * Handle backup events
     */
    handleBackupStarted(backupInfo) {
        this.emit('backupStarted', backupInfo);
    }
    
    handleBackupCompleted(backupInfo) {
        this.emit('backupCompleted', backupInfo);
    }
    
    handleBackupError(error) {
        this.emit('backupError', error);
    }
    
    /**
     * Calculate next run time based on cron-like frequency
     */
    calculateNextRun(frequency, fromTime = Date.now()) {
        // Simple cron parser - supports basic patterns
        // Format: "minute hour day month dayOfWeek"
        // Examples:
        // "0 */6 * * *" - Every 6 hours
        // "30 2 * * *" - Daily at 2:30 AM
        // "0 0 * * 0" - Weekly on Sunday at midnight
        
        const parts = frequency.split(' ');
        if (parts.length !== 5) {
            throw new Error(`Invalid cron format: ${frequency}`);
        }
        
        const [minute, hour, day, month, dayOfWeek] = parts;
        const now = new Date(fromTime);
        const next = new Date(now);
        
        // Simple implementation - handle */N patterns
        if (hour.startsWith('*/')) {
            const interval = parseInt(hour.substring(2));
            const currentHour = now.getHours();
            const nextHour = Math.ceil((currentHour + 1) / interval) * interval;
            
            next.setHours(nextHour, parseInt(minute) || 0, 0, 0);
            
            // If next time is in the past, add interval
            if (next.getTime() <= now.getTime()) {
                next.setHours(next.getHours() + interval);
            }
        } else {
            // Fixed time
            next.setHours(parseInt(hour) || 0, parseInt(minute) || 0, 0, 0);
            
            // If time has passed today, schedule for tomorrow
            if (next.getTime() <= now.getTime()) {
                next.setDate(next.getDate() + 1);
            }
        }
        
        return next.getTime();
    }
    
    /**
     * Get resource usage
     */
    async getResourceUsage() {
        const os = require('os');
        
        // CPU usage (simplified)
        const cpuUsage = process.cpuUsage();
        const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
        
        // Memory usage
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const memoryPercent = ((totalMemory - freeMemory) / totalMemory) * 100;
        
        // Disk usage (simplified - would need platform-specific implementation)
        const diskPercent = 50; // Placeholder
        
        return {
            cpu: Math.min(cpuPercent, 100),
            memory: memoryPercent,
            disk: diskPercent
        };
    }
    
    /**
     * Get free disk space
     */
    async getFreeSpace() {
        // Simplified implementation
        return 1024 * 1024 * 1024; // 1GB placeholder
    }
    
    /**
     * Get system load average
     */
    async getLoadAverage() {
        const os = require('os');
        const loadAvg = os.loadavg();
        return loadAvg[0]; // 1-minute load average
    }
    
    /**
     * Update next scheduled backup time
     */
    updateNextScheduledBackup() {
        const enabledSchedules = Array.from(this.schedules.values())
            .filter(s => s.enabled && s.nextRun);
        
        if (enabledSchedules.length > 0) {
            this.stats.nextScheduledBackup = Math.min(...enabledSchedules.map(s => s.nextRun));
        } else {
            this.stats.nextScheduledBackup = null;
        }
    }
    
    /**
     * Load schedules from file
     */
    loadSchedules() {
        try {
            if (fs.existsSync(this.options.scheduleFile)) {
                const data = fs.readFileSync(this.options.scheduleFile, 'utf8');
                const schedules = JSON.parse(data);
                
                for (const [name, schedule] of Object.entries(schedules)) {
                    this.schedules.set(name, schedule);
                }
                
                console.log(`📚 Loaded ${this.schedules.size} schedules`);
            } else {
                // Create default schedules
                this.createDefaultSchedules();
            }
        } catch (error) {
            console.error('Failed to load schedules:', error.message);
            this.createDefaultSchedules();
        }
    }
    
    /**
     * Save schedules to file
     */
    saveSchedules() {
        try {
            const schedules = Object.fromEntries(this.schedules);
            fs.writeFileSync(this.options.scheduleFile, JSON.stringify(schedules, null, 2));
        } catch (error) {
            console.error('Failed to save schedules:', error.message);
        }
    }
    
    /**
     * Create default schedules
     */
    createDefaultSchedules() {
        console.log('📅 Creating default backup schedules...');
        
        // Critical data - every 6 hours
        this.addSchedule('critical-backup', {
            type: 'full',
            frequency: '0 */6 * * *',
            priority: 1,
            retryCount: 3,
            timeout: 30 * 60 * 1000,
            conditions: {
                minFreeSpace: 1024 * 1024 * 1024, // 1GB
                timeWindow: { start: 0, end: 23 } // Anytime
            }
        });
        
        // Regular incremental - every 2 hours
        this.addSchedule('incremental-backup', {
            type: 'incremental',
            frequency: '0 */2 * * *',
            priority: 2,
            retryCount: 2,
            timeout: 15 * 60 * 1000,
            conditions: {
                minFreeSpace: 512 * 1024 * 1024 // 512MB
            }
        });
        
        // Daily full backup at 2 AM
        this.addSchedule('daily-full-backup', {
            type: 'full',
            frequency: '0 2 * * *',
            priority: 1,
            retryCount: 2,
            timeout: 60 * 60 * 1000,
            conditions: {
                timeWindow: { start: 1, end: 5 }, // Night hours
                minFreeSpace: 2 * 1024 * 1024 * 1024 // 2GB
            }
        });
        
        console.log('✅ Default schedules created');
    }
    
    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeBackups: this.activeBackups.size,
            totalSchedules: this.schedules.size,
            enabledSchedules: Array.from(this.schedules.values()).filter(s => s.enabled).length,
            stats: { ...this.stats },
            schedules: Array.from(this.schedules.entries()).map(([name, schedule]) => ({
                name,
                ...schedule,
                nextRunFormatted: schedule.nextRun ? new Date(schedule.nextRun).toISOString() : null
            })),
            resourceLimits: {
                maxConcurrentBackups: this.options.maxConcurrentBackups,
                maxCpuUsage: this.options.maxCpuUsage,
                maxMemoryUsage: this.options.maxMemoryUsage,
                maxDiskUsage: this.options.maxDiskUsage
            }
        };
    }
    
    /**
     * Get schedule by name
     */
    getSchedule(name) {
        return this.schedules.get(name);
    }
    
    /**
     * Get all schedules
     */
    getAllSchedules() {
        return Array.from(this.schedules.entries()).map(([name, schedule]) => ({
            name,
            ...schedule
        }));
    }
    
    /**
     * Trigger immediate backup
     */
    async triggerBackup(scheduleName, type = null) {
        const schedule = this.schedules.get(scheduleName);
        if (!schedule) {
            throw new Error(`Schedule not found: ${scheduleName}`);
        }
        
        // Override type if specified
        if (type) {
            schedule.type = type;
        }
        
        console.log(`🚀 Triggering immediate backup: ${scheduleName}`);
        return await this.executeScheduledBackup(schedule);
    }
    
    /**
     * Shutdown scheduler
     */
    async shutdown() {
        console.log('🛑 Shutting down Backup Scheduler...');
        
        this.stop();
        
        // Wait for active backups to complete (with timeout)
        const maxWait = 60000; // 1 minute
        const startWait = Date.now();
        
        while (this.activeBackups.size > 0 && (Date.now() - startWait) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (this.activeBackups.size > 0) {
            console.log(`⚠️ ${this.activeBackups.size} backups still active after timeout`);
        }
        
        // Save final state
        this.saveSchedules();
        
        // Shutdown backup manager
        await this.backupManager.shutdown();
        
        this.emit('shutdown');
        console.log('✅ Backup Scheduler shutdown completed');
    }
}

// Export class
module.exports = BackupScheduler;

// CLI interface
if (require.main === module) {
    const scheduler = new BackupScheduler({
        enableScheduling: true,
        monitorResources: true,
        maxConcurrentBackups: 1,
        backupManager: {
            autoBackup: false, // Let scheduler handle timing
            enableCompression: true,
            enableEncryption: true,
            verifyBackups: true
        }
    });
    
    // Event listeners
    scheduler.on('scheduledBackupCompleted', ({ schedule, backupResult, executionTime }) => {
        console.log(`✅ Scheduled backup completed: ${schedule.name} in ${executionTime}ms`);
    });
    
    scheduler.on('scheduledBackupFailed', ({ schedule, error }) => {
        console.error(`❌ Scheduled backup failed: ${schedule.name} - ${error.message}`);
    });
    
    scheduler.on('backupTimeout', (activeBackup) => {
        console.error(`⏰ Backup timeout: ${activeBackup.schedule.name}`);
    });
    
    // Status reporting
    setInterval(() => {
        const status = scheduler.getStatus();
        console.log(`📊 Scheduler Status: ${status.activeBackups} active, ${status.enabledSchedules} enabled schedules`);
        
        if (status.stats.nextScheduledBackup) {
            const nextBackup = new Date(status.stats.nextScheduledBackup);
            console.log(`⏰ Next backup: ${nextBackup.toISOString()}`);
        }
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await scheduler.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        await scheduler.shutdown();
        process.exit(0);
    });
    
    console.log('🚀 Backup Scheduler started!');
    console.log('Press Ctrl+C to stop');
}