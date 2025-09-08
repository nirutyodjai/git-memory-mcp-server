/**
 * Logger utility for the MCP system
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
  component: string;
  message: string;
  data?: any;
  error?: Error;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
  format?: 'json' | 'text';
}

/**
 * Simple logger implementation
 */
export class Logger {
  private static globalConfig: LoggerConfig = {
    level: LogLevel.INFO,
    enableConsole: true,
    enableFile: false,
    format: 'text'
  };

  private static logs: LogEntry[] = [];
  private static maxLogHistory = 1000;

  constructor(private component: string) {}

  /**
   * Configure global logger settings
   */
  static configure(config: Partial<LoggerConfig>): void {
    Logger.globalConfig = { ...Logger.globalConfig, ...config };
  }

  /**
   * Get recent log entries
   */
  static getRecentLogs(count: number = 100): LogEntry[] {
    return Logger.logs.slice(-count);
  }

  /**
   * Clear log history
   */
  static clearLogs(): void {
    Logger.logs = [];
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any): void {
    this.log(LogLevel.ERROR, message, undefined, error instanceof Error ? error : undefined);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    if (level < Logger.globalConfig.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      component: this.component,
      message,
      data,
      error
    };

    // Add to history
    Logger.logs.push(entry);
    if (Logger.logs.length > Logger.maxLogHistory) {
      Logger.logs = Logger.logs.slice(-Logger.maxLogHistory / 2);
    }

    // Console output
    if (Logger.globalConfig.enableConsole) {
      this.outputToConsole(entry);
    }

    // File output (simplified - in production you'd use a proper file logger)
    if (Logger.globalConfig.enableFile) {
      this.outputToFile(entry);
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const prefix = `[${timestamp}] [${levelName}] [${entry.component}]`;
    
    const message = `${prefix} ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.error || entry.data || '');
        if (entry.error?.stack) {
          console.error(entry.error.stack);
        }
        break;
    }
  }

  /**
   * Output log entry to file (placeholder implementation)
   */
  private outputToFile(entry: LogEntry): void {
    // In a real implementation, you would write to a file
    // For now, we'll just store it in memory
    // You could integrate with libraries like winston, pino, etc.
  }

  /**
   * Create a child logger with additional context
   */
  child(context: string): Logger {
    return new Logger(`${this.component}:${context}`);
  }

  /**
   * Check if a log level is enabled
   */
  isLevelEnabled(level: LogLevel): boolean {
    return level >= Logger.globalConfig.level;
  }

  /**
   * Time a function execution
   */
  async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.debug(`Starting ${label}`);
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`Completed ${label} in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed ${label} after ${duration}ms`, error as Error);
      throw error;
    }
  }

  /**
   * Time a synchronous function execution
   */
  timeSync<T>(label: string, fn: () => T): T {
    const start = Date.now();
    this.debug(`Starting ${label}`);
    
    try {
      const result = fn();
      const duration = Date.now() - start;
      this.info(`Completed ${label} in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed ${label} after ${duration}ms`, error as Error);
      throw error;
    }
  }
}

/**
 * Create a logger instance
 */
export function createLogger(component: string): Logger {
  return new Logger(component);
}

/**
 * Default logger instance
 */
export const defaultLogger = new Logger('MCP');

export default Logger;