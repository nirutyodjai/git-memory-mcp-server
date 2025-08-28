export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export interface LogEntry {
    id: string;
    timestamp: number;
    level: LogLevel;
    message: string;
    category?: string;
    data?: Record<string, any>;
    userId?: string;
    sessionId?: string;
    url?: string;
    userAgent?: string;
    stack?: string;
    tags?: string[];
    source?: string;
    environment?: 'development' | 'staging' | 'production';
}
export interface LogFilter {
    level?: LogLevel[];
    category?: string[];
    userId?: string;
    sessionId?: string;
    startTime?: number;
    endTime?: number;
    search?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
}
export interface LogTransport {
    name: string;
    level: LogLevel;
    enabled: boolean;
    format?: (entry: LogEntry) => string;
    send: (entry: LogEntry) => Promise<void> | void;
}
export interface LoggerConfig {
    level: LogLevel;
    transports: LogTransport[];
    enableConsole: boolean;
    enableStorage: boolean;
    maxStorageEntries: number;
    environment: 'development' | 'staging' | 'production';
    defaultCategory?: string;
    enableStackTrace: boolean;
    enableTimestamp: boolean;
    enableUserTracking: boolean;
}
export declare class ConsoleTransport implements LogTransport {
    name: string;
    level: LogLevel;
    enabled: boolean;
    constructor(level?: LogLevel);
    format(entry: LogEntry): string;
    send(entry: LogEntry): void;
    private shouldLog;
    private getConsoleStyle;
}
export declare class LocalStorageTransport implements LogTransport {
    name: string;
    level: LogLevel;
    enabled: boolean;
    private storageKey;
    private maxEntries;
    constructor(level?: LogLevel, maxEntries?: number);
    send(entry: LogEntry): void;
    getLogs(): LogEntry[];
    clearLogs(): void;
    private shouldLog;
}
export declare class RemoteTransport implements LogTransport {
    name: string;
    level: LogLevel;
    enabled: boolean;
    private endpoint;
    private apiKey?;
    private batchSize;
    private flushInterval;
    private batch;
    private flushTimer?;
    constructor(endpoint: string, level?: LogLevel, options?: {
        apiKey?: string;
        batchSize?: number;
        flushInterval?: number;
    });
    send(entry: LogEntry): void;
    private flush;
    private startFlushTimer;
    private shouldLog;
    destroy(): void;
}
export declare class Logger {
    private static instance;
    private config;
    private sessionId;
    private userId?;
    private logs;
    private constructor();
    static getInstance(config?: Partial<LoggerConfig>): Logger;
    private generateSessionId;
    private generateLogId;
    setUser(userId: string): void;
    addTransport(transport: LogTransport): void;
    removeTransport(name: string): void;
    private createLogEntry;
    private log;
    debug(message: string, data?: Record<string, any>, category?: string, tags?: string[]): void;
    info(message: string, data?: Record<string, any>, category?: string, tags?: string[]): void;
    warn(message: string, data?: Record<string, any>, category?: string, tags?: string[]): void;
    error(message: string, data?: Record<string, any>, category?: string, tags?: string[]): void;
    fatal(message: string, data?: Record<string, any>, category?: string, tags?: string[]): void;
    getLogs(filter?: LogFilter): LogEntry[];
    clearLogs(): void;
    getStats(): {
        totalLogs: number;
        logsByLevel: Record<LogLevel, number>;
        logsByCategory: Record<string, number>;
        recentLogs: LogEntry[];
    };
    exportLogs(format?: 'json' | 'csv'): string;
}
export declare function useLogger(config?: Partial<LoggerConfig>): {
    logger: any;
    logs: any;
    stats: any;
    debug: (message: string, data?: Record<string, any>, category?: string, tags?: string[]) => void;
    info: (message: string, data?: Record<string, any>, category?: string, tags?: string[]) => void;
    warn: (message: string, data?: Record<string, any>, category?: string, tags?: string[]) => void;
    error: (message: string, data?: Record<string, any>, category?: string, tags?: string[]) => void;
    fatal: (message: string, data?: Record<string, any>, category?: string, tags?: string[]) => void;
    clearLogs: () => void;
    exportLogs: (format?: "json" | "csv") => any;
};
export declare const logger: Logger;
//# sourceMappingURL=logging.d.ts.map