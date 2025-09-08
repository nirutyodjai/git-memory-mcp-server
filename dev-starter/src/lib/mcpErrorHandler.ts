export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  error?: Error;
}

export class MCPErrorHandler {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  public log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data
    };

    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output
    this.outputToConsole(entry);
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const logMessage = `[${timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(logMessage, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(logMessage, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(logMessage, entry.data || '');
        break;
    }
  }

  public getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public getRecentLogs(count: number = 10): LogEntry[] {
    return this.logs.slice(-count);
  }

  public handleError(error: Error, context?: string): void {
    this.log(LogLevel.ERROR, `Error${context ? ` in ${context}` : ''}: ${error.message}`, {
      stack: error.stack,
      name: error.name
    });
  }

  public handlePromiseRejection(reason: any, context?: string): void {
    this.log(LogLevel.ERROR, `Unhandled promise rejection${context ? ` in ${context}` : ''}`, {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined
    });
  }
}

export const mcpErrorHandler = new MCPErrorHandler();

// Global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    mcpErrorHandler.handleError(event.error, 'Global error handler');
  });

  window.addEventListener('unhandledrejection', (event) => {
    mcpErrorHandler.handlePromiseRejection(event.reason, 'Global promise rejection handler');
  });
}

export default mcpErrorHandler;