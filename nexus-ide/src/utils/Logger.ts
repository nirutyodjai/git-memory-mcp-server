/**
 * Logger Utility for NEXUS IDE
 * Powerful logging system for NEXUS IDE
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: any;
  source?: string;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = 10000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, context?: any, source?: string): void {
    this.log(LogLevel.DEBUG, message, context, source);
  }

  info(message: string, context?: any, source?: string): void {
    this.log(LogLevel.INFO, message, context, source);
  }

  warn(message: string, context?: any, source?: string): void {
    this.log(LogLevel.WARN, message, context, source);
  }

  error(message: string, context?: any, source?: string): void {
    this.log(LogLevel.ERROR, message, context, source);
  }

  private log(level: LogLevel, message: string, context?: any, source?: string): void {
    if (level < this.logLevel) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      source
    };

    this.logs.push(entry);
    
    // Keep only the latest logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output
    const levelStr = LogLevel[level];
    const timestamp = entry.timestamp.toISOString();
    const sourceStr = source ? `[${source}]` : '';
    
    console.log(`${timestamp} ${levelStr} ${sourceStr} ${message}`, context || '');
  }

  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level !== undefined) {
      filteredLogs = this.logs.filter(log => log.level >= level);
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }
    
    return filteredLogs;
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Export singleton instance
export const logger = Logger.getInstance();