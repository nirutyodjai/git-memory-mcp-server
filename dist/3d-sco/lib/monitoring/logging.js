"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = exports.RemoteTransport = exports.LocalStorageTransport = exports.ConsoleTransport = void 0;
exports.useLogger = useLogger;
// Default configuration
const DEFAULT_CONFIG = {
    level: 'info',
    transports: [],
    enableConsole: true,
    enableStorage: true,
    maxStorageEntries: 1000,
    environment: 'development',
    enableStackTrace: true,
    enableTimestamp: true,
    enableUserTracking: true,
};
// Log level priorities
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
};
// Console transport
class ConsoleTransport {
    constructor(level = 'debug') {
        this.name = 'console';
        this.enabled = true;
        this.level = level;
    }
    format(entry) {
        const timestamp = new Date(entry.timestamp).toISOString();
        const level = entry.level.toUpperCase().padEnd(5);
        const category = entry.category ? `[${entry.category}]` : '';
        return `${timestamp} ${level} ${category} ${entry.message}`;
    }
    send(entry) {
        if (!this.shouldLog(entry.level))
            return;
        const formatted = this.format(entry);
        const style = this.getConsoleStyle(entry.level);
        switch (entry.level) {
            case 'debug':
                console.debug(`%c${formatted}`, style, entry.data);
                break;
            case 'info':
                console.info(`%c${formatted}`, style, entry.data);
                break;
            case 'warn':
                console.warn(`%c${formatted}`, style, entry.data);
                break;
            case 'error':
            case 'fatal':
                console.error(`%c${formatted}`, style, entry.data);
                if (entry.stack) {
                    console.error('Stack trace:', entry.stack);
                }
                break;
        }
    }
    shouldLog(level) {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
    }
    getConsoleStyle(level) {
        switch (level) {
            case 'debug':
                return 'color: #6b7280; font-weight: normal;';
            case 'info':
                return 'color: #3b82f6; font-weight: normal;';
            case 'warn':
                return 'color: #f59e0b; font-weight: bold;';
            case 'error':
                return 'color: #ef4444; font-weight: bold;';
            case 'fatal':
                return 'color: white; background-color: #dc2626; font-weight: bold; padding: 2px 4px;';
            default:
                return 'color: #374151; font-weight: normal;';
        }
    }
}
exports.ConsoleTransport = ConsoleTransport;
// Local storage transport
class LocalStorageTransport {
    constructor(level = 'info', maxEntries = 1000) {
        this.name = 'localStorage';
        this.enabled = true;
        this.storageKey = 'app_logs';
        this.level = level;
        this.maxEntries = maxEntries;
    }
    send(entry) {
        if (!this.shouldLog(entry.level) || typeof window === 'undefined')
            return;
        try {
            const existingLogs = this.getLogs();
            const updatedLogs = [...existingLogs, entry];
            // Limit the number of stored logs
            if (updatedLogs.length > this.maxEntries) {
                updatedLogs.splice(0, updatedLogs.length - this.maxEntries);
            }
            localStorage.setItem(this.storageKey, JSON.stringify(updatedLogs));
        }
        catch (error) {
            console.error('Failed to save log to localStorage:', error);
        }
    }
    getLogs() {
        if (typeof window === 'undefined')
            return [];
        try {
            const logs = localStorage.getItem(this.storageKey);
            return logs ? JSON.parse(logs) : [];
        }
        catch (error) {
            console.error('Failed to retrieve logs from localStorage:', error);
            return [];
        }
    }
    clearLogs() {
        if (typeof window === 'undefined')
            return;
        localStorage.removeItem(this.storageKey);
    }
    shouldLog(level) {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
    }
}
exports.LocalStorageTransport = LocalStorageTransport;
// Remote transport
class RemoteTransport {
    constructor(endpoint, level = 'warn', options = {}) {
        this.name = 'remote';
        this.enabled = true;
        this.batch = [];
        this.endpoint = endpoint;
        this.level = level;
        this.apiKey = options.apiKey;
        this.batchSize = options.batchSize || 10;
        this.flushInterval = options.flushInterval || 30000; // 30 seconds
        this.startFlushTimer();
    }
    send(entry) {
        if (!this.shouldLog(entry.level))
            return;
        this.batch.push(entry);
        if (this.batch.length >= this.batchSize) {
            this.flush();
        }
    }
    async flush() {
        if (this.batch.length === 0)
            return;
        const logsToSend = [...this.batch];
        this.batch = [];
        try {
            const headers = {
                'Content-Type': 'application/json',
            };
            if (this.apiKey) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }
            await fetch(this.endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({ logs: logsToSend }),
            });
        }
        catch (error) {
            console.error('Failed to send logs to remote:', error);
            // Re-add logs to batch for retry
            this.batch.unshift(...logsToSend);
        }
    }
    startFlushTimer() {
        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.flushInterval);
    }
    shouldLog(level) {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
    }
    destroy() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        this.flush(); // Final flush
    }
}
exports.RemoteTransport = RemoteTransport;
// Main Logger class
class Logger {
    constructor(config = {}) {
        this.logs = [];
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.sessionId = this.generateSessionId();
        // Add default console transport if none provided
        if (this.config.transports.length === 0 && this.config.enableConsole) {
            this.config.transports.push(new ConsoleTransport(this.config.level));
        }
        // Add localStorage transport if enabled
        if (this.config.enableStorage) {
            this.config.transports.push(new LocalStorageTransport(this.config.level, this.config.maxStorageEntries));
        }
    }
    static getInstance(config) {
        if (!Logger.instance) {
            Logger.instance = new Logger(config);
        }
        return Logger.instance;
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateLogId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    setUser(userId) {
        this.userId = userId;
    }
    addTransport(transport) {
        this.config.transports.push(transport);
    }
    removeTransport(name) {
        this.config.transports = this.config.transports.filter(t => t.name !== name);
    }
    createLogEntry(level, message, data, category, tags) {
        const entry = {
            id: this.generateLogId(),
            timestamp: Date.now(),
            level,
            message,
            category: category || this.config.defaultCategory,
            data,
            userId: this.userId,
            sessionId: this.sessionId,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            tags,
            environment: this.config.environment,
        };
        // Add stack trace for errors
        if ((level === 'error' || level === 'fatal') && this.config.enableStackTrace) {
            entry.stack = new Error().stack;
        }
        return entry;
    }
    log(level, message, data, category, tags) {
        if (LOG_LEVELS[level] < LOG_LEVELS[this.config.level]) {
            return;
        }
        const entry = this.createLogEntry(level, message, data, category, tags);
        // Store in memory
        this.logs.push(entry);
        // Limit memory storage
        if (this.logs.length > this.config.maxStorageEntries) {
            this.logs = this.logs.slice(-this.config.maxStorageEntries);
        }
        // Send to transports
        this.config.transports.forEach(transport => {
            if (transport.enabled) {
                try {
                    transport.send(entry);
                }
                catch (error) {
                    console.error(`Transport ${transport.name} failed:`, error);
                }
            }
        });
    }
    debug(message, data, category, tags) {
        this.log('debug', message, data, category, tags);
    }
    info(message, data, category, tags) {
        this.log('info', message, data, category, tags);
    }
    warn(message, data, category, tags) {
        this.log('warn', message, data, category, tags);
    }
    error(message, data, category, tags) {
        this.log('error', message, data, category, tags);
    }
    fatal(message, data, category, tags) {
        this.log('fatal', message, data, category, tags);
    }
    getLogs(filter) {
        let filteredLogs = [...this.logs];
        if (filter) {
            if (filter.level) {
                filteredLogs = filteredLogs.filter(log => filter.level.includes(log.level));
            }
            if (filter.category) {
                filteredLogs = filteredLogs.filter(log => log.category && filter.category.includes(log.category));
            }
            if (filter.userId) {
                filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
            }
            if (filter.sessionId) {
                filteredLogs = filteredLogs.filter(log => log.sessionId === filter.sessionId);
            }
            if (filter.startTime) {
                filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startTime);
            }
            if (filter.endTime) {
                filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endTime);
            }
            if (filter.search) {
                const searchLower = filter.search.toLowerCase();
                filteredLogs = filteredLogs.filter(log => log.message.toLowerCase().includes(searchLower) ||
                    (log.category && log.category.toLowerCase().includes(searchLower)));
            }
            if (filter.tags) {
                filteredLogs = filteredLogs.filter(log => log.tags && filter.tags.some(tag => log.tags.includes(tag)));
            }
            // Apply pagination
            if (filter.offset || filter.limit) {
                const offset = filter.offset || 0;
                const limit = filter.limit || filteredLogs.length;
                filteredLogs = filteredLogs.slice(offset, offset + limit);
            }
        }
        return filteredLogs;
    }
    clearLogs() {
        this.logs = [];
        // Clear localStorage transport logs
        const localStorageTransport = this.config.transports.find(t => t instanceof LocalStorageTransport);
        if (localStorageTransport) {
            localStorageTransport.clearLogs();
        }
    }
    getStats() {
        const logs = this.getLogs();
        const logsByLevel = logs.reduce((acc, log) => {
            acc[log.level] = (acc[log.level] || 0) + 1;
            return acc;
        }, {});
        const logsByCategory = logs.reduce((acc, log) => {
            const category = log.category || 'uncategorized';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});
        const recentLogs = logs
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
        return {
            totalLogs: logs.length,
            logsByLevel,
            logsByCategory,
            recentLogs,
        };
    }
    exportLogs(format = 'json') {
        const logs = this.getLogs();
        if (format === 'csv') {
            const headers = ['timestamp', 'level', 'message', 'category', 'userId', 'sessionId'];
            const csvRows = [headers.join(',')];
            logs.forEach(log => {
                const row = [
                    new Date(log.timestamp).toISOString(),
                    log.level,
                    `"${log.message.replace(/"/g, '""')}"`,
                    log.category || '',
                    log.userId || '',
                    log.sessionId,
                ];
                csvRows.push(row.join(','));
            });
            return csvRows.join('\n');
        }
        return JSON.stringify(logs, null, 2);
    }
}
exports.Logger = Logger;
// React hook for logging
function useLogger(config) {
    const [logger] = useState(() => Logger.getInstance(config));
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(logger.getStats());
    useEffect(() => {
        const updateData = () => {
            setLogs(logger.getLogs());
            setStats(logger.getStats());
        };
        // Initial update
        updateData();
        // Set up periodic updates
        const interval = setInterval(updateData, 5000);
        return () => clearInterval(interval);
    }, [logger]);
    return {
        logger,
        logs,
        stats,
        debug: (message, data, category, tags) => {
            logger.debug(message, data, category, tags);
        },
        info: (message, data, category, tags) => {
            logger.info(message, data, category, tags);
        },
        warn: (message, data, category, tags) => {
            logger.warn(message, data, category, tags);
        },
        error: (message, data, category, tags) => {
            logger.error(message, data, category, tags);
        },
        fatal: (message, data, category, tags) => {
            logger.fatal(message, data, category, tags);
        },
        clearLogs: () => {
            logger.clearLogs();
            setLogs([]);
            setStats(logger.getStats());
        },
        exportLogs: (format) => logger.exportLogs(format),
    };
}
// Default logger instance
exports.logger = Logger.getInstance();
//# sourceMappingURL=logging.js.map