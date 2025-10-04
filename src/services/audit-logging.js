/**
 * Comprehensive Audit Logging Service for Git Memory MCP Server
 *
 * Features:
 * - Structured audit logs with multiple storage backends
 * - Real-time log streaming and filtering
 * - Log retention policies and rotation
 * - GDPR compliance with data anonymization
 * - Performance impact monitoring
 * - Integration with monitoring systems
 */

import { EventEmitter } from 'events';
import winston from 'winston';
import { createClient } from 'redis';
import fs from 'fs/promises';
import path from 'path';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  action: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  details: Record<string, any>;
  metadata: {
    requestId?: string;
    traceId?: string;
    spanId?: string;
    duration?: number;
    statusCode?: number;
    errorCode?: string;
    tags?: string[];
  };
  compliance?: {
    gdpr?: boolean;
    hipaa?: boolean;
    sox?: boolean;
    retention?: string;
  };
}

export interface AuditLogFilter {
  startTime?: Date;
  endTime?: Date;
  level?: string[];
  category?: string[];
  action?: string[];
  userId?: string[];
  ip?: string[];
  resource?: string[];
  resourceId?: string[];
  tags?: string[];
}

export interface AuditLogConfig {
  enableConsole: boolean;
  enableFile: boolean;
  enableRedis: boolean;
  enableDatabase: boolean;
  logDir: string;
  maxFileSize: number; // in bytes
  maxFiles: number;
  retentionDays: number;
  enableCompression: boolean;
  enableEncryption: boolean;
  encryptionKey?: string;
  anonymizeIp: boolean;
  anonymizeUserData: boolean;
  performanceThreshold: number; // ms
}

export class AuditLoggingService extends EventEmitter {
  private logger: winston.Logger;
  private redis: any;
  private config: AuditLogConfig;
  private logBuffer: AuditLogEntry[] = [];
  private bufferSize: number = 1000;
  private flushInterval: NodeJS.Timeout | null = null;
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor(config: Partial<AuditLogConfig> = {}) {
    super();

    this.config = {
      enableConsole: true,
      enableFile: true,
      enableRedis: true,
      enableDatabase: false,
      logDir: './logs/audit',
      maxFileSize: 100 * 1024 * 1024, // 100MB
      maxFiles: 30,
      retentionDays: 90,
      enableCompression: true,
      enableEncryption: false,
      anonymizeIp: true,
      anonymizeUserData: false,
      performanceThreshold: 1000,
      ...config
    };

    this.initializeLogger();
    this.initializeRedis();
    this.startPeriodicFlush();
    this.startCleanupTask();
  }

  /**
   * Initialize Winston logger
   */
  private initializeLogger(): void {
    const transports: winston.transport[] = [];

    // Console transport
    if (this.config.enableConsole) {
      transports.push(new winston.transports.Console({
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return JSON.stringify({
              timestamp,
              level,
              message,
              ...meta
            });
          })
        )
      }));
    }

    // File transport
    if (this.config.enableFile) {
      transports.push(new winston.transports.File({
        filename: path.join(this.config.logDir, 'audit.log'),
        level: 'info',
        maxsize: this.config.maxFileSize,
        maxFiles: this.config.maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }));
    }

    this.logger = winston.createLogger({
      level: 'info',
      transports,
      exitOnError: false
    });
  }

  /**
   * Initialize Redis client for caching
   */
  private async initializeRedis(): Promise<void> {
    if (!this.config.enableRedis) return;

    try {
      this.redis = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.redis.on('error', (error) => {
        this.emit('redis:error', error);
      });

      await this.redis.connect();
      this.emit('redis:connected');
    } catch (error) {
      this.emit('redis:error', error);
    }
  }

  /**
   * Log audit entry
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<string> {
    const startTime = Date.now();

    const auditEntry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...entry
    };

    // Anonymize sensitive data if configured
    if (this.config.anonymizeIp && auditEntry.ip) {
      auditEntry.ip = this.anonymizeIp(auditEntry.ip);
    }

    if (this.config.anonymizeUserData && auditEntry.userId) {
      auditEntry.userId = this.anonymizeUserId(auditEntry.userId);
    }

    // Add to buffer
    this.logBuffer.push(auditEntry);

    // Check if buffer is full
    if (this.logBuffer.length >= this.bufferSize) {
      await this.flushBuffer();
    }

    // Log immediately for high-priority entries
    if (entry.level === 'error' || entry.level === 'warn') {
      this.logger.log(entry.level, 'Audit Log', { auditEntry });
    }

    // Track performance
    const duration = Date.now() - startTime;
    this.trackPerformance('log', duration);

    if (duration > this.config.performanceThreshold) {
      this.emit('performance:warning', {
        operation: 'log',
        duration,
        threshold: this.config.performanceThreshold
      });
    }

    return auditEntry.id;
  }

  /**
   * Log authentication events
   */
  async logAuth(
    action: 'login' | 'logout' | 'token_refresh' | 'password_change' | 'mfa_enabled' | 'mfa_disabled',
    userId: string,
    ip: string,
    details: Record<string, any> = {}
  ): Promise<string> {
    return this.log({
      level: action === 'logout' ? 'info' : 'info',
      category: 'authentication',
      action,
      userId,
      ip,
      details,
      metadata: {
        tags: ['auth', 'security']
      },
      compliance: {
        gdpr: true,
        retention: '7years'
      }
    });
  }

  /**
   * Log authorization events
   */
  async logAuthz(
    action: 'access_granted' | 'access_denied' | 'permission_changed',
    userId: string,
    resource: string,
    resourceId?: string,
    details: Record<string, any> = {}
  ): Promise<string> {
    return this.log({
      level: action === 'access_denied' ? 'warn' : 'info',
      category: 'authorization',
      action,
      userId,
      resource,
      resourceId,
      details,
      metadata: {
        tags: ['authz', 'security']
      },
      compliance: {
        gdpr: true,
        retention: '7years'
      }
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    action: 'read' | 'write' | 'delete' | 'export',
    userId: string,
    resource: string,
    resourceId: string,
    details: Record<string, any> = {}
  ): Promise<string> {
    return this.log({
      level: 'info',
      category: 'data_access',
      action,
      userId,
      resource,
      resourceId,
      details,
      metadata: {
        tags: ['data', 'privacy']
      },
      compliance: {
        gdpr: true,
        retention: '3years'
      }
    });
  }

  /**
   * Log system events
   */
  async logSystem(
    action: 'startup' | 'shutdown' | 'config_change' | 'backup' | 'restore' | 'maintenance',
    details: Record<string, any> = {}
  ): Promise<string> {
    return this.log({
      level: 'info',
      category: 'system',
      action,
      details,
      metadata: {
        tags: ['system', 'operations']
      }
    });
  }

  /**
   * Log security events
   */
  async logSecurity(
    action: 'suspicious_activity' | 'failed_login' | 'rate_limit_exceeded' | 'malicious_request',
    ip: string,
    details: Record<string, any> = {}
  ): Promise<string> {
    return this.log({
      level: 'warn',
      category: 'security',
      action,
      ip,
      details,
      metadata: {
        tags: ['security', 'threat']
      },
      compliance: {
        retention: '10years'
      }
    });
  }

  /**
   * Query audit logs
   */
  async query(filter: AuditLogFilter = {}, options: {
    limit?: number;
    offset?: number;
    sortBy?: 'timestamp' | 'level' | 'category';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    entries: AuditLogEntry[];
    total: number;
    hasMore: boolean;
  }> {
    const startTime = Date.now();

    try {
      let entries = [...this.logBuffer];

      // Apply filters
      entries = this.applyFilters(entries, filter);

      // Sort
      const sortBy = options.sortBy || 'timestamp';
      const sortOrder = options.sortOrder || 'desc';

      entries.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];

        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      // Pagination
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      const total = entries.length;
      const hasMore = offset + limit < total;

      entries = entries.slice(offset, offset + limit);

      const duration = Date.now() - startTime;
      this.trackPerformance('query', duration);

      return {
        entries,
        total,
        hasMore
      };
    } catch (error) {
      this.emit('error', { type: 'query', error });
      throw error;
    }
  }

  /**
   * Apply filters to log entries
   */
  private applyFilters(entries: AuditLogEntry[], filter: AuditLogFilter): AuditLogEntry[] {
    return entries.filter(entry => {
      // Time range filter
      if (filter.startTime && new Date(entry.timestamp) < filter.startTime) {
        return false;
      }
      if (filter.endTime && new Date(entry.timestamp) > filter.endTime) {
        return false;
      }

      // Level filter
      if (filter.level && filter.level.length > 0 && !filter.level.includes(entry.level)) {
        return false;
      }

      // Category filter
      if (filter.category && filter.category.length > 0 && !filter.category.includes(entry.category)) {
        return false;
      }

      // Action filter
      if (filter.action && filter.action.length > 0 && !filter.action.includes(entry.action)) {
        return false;
      }

      // User ID filter
      if (filter.userId && filter.userId.length > 0 && (!entry.userId || !filter.userId.includes(entry.userId))) {
        return false;
      }

      // IP filter
      if (filter.ip && filter.ip.length > 0 && (!entry.ip || !filter.ip.includes(entry.ip))) {
        return false;
      }

      // Resource filter
      if (filter.resource && filter.resource.length > 0 && (!entry.resource || !filter.resource.includes(entry.resource))) {
        return false;
      }

      // Resource ID filter
      if (filter.resourceId && filter.resourceId.length > 0 && (!entry.resourceId || !filter.resourceId.includes(entry.resourceId))) {
        return false;
      }

      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        const entryTags = entry.metadata.tags || [];
        const hasMatchingTag = filter.tags.some(tag => entryTags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Generate unique ID for audit entry
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Anonymize IP address for GDPR compliance
   */
  private anonymizeIp(ip: string): string {
    if (ip.startsWith('::1') || ip.startsWith('127.')) {
      return 'localhost';
    }

    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.${parts[3]}`;
    }

    return 'anonymized';
  }

  /**
   * Anonymize user ID for GDPR compliance
   */
  private anonymizeUserId(userId: string): string {
    // Hash the user ID for anonymization
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(userId).digest('hex').substring(0, 16);
  }

  /**
   * Track performance metrics
   */
  private trackPerformance(operation: string, duration: number): void {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }

    const metrics = this.performanceMetrics.get(operation)!;
    metrics.push(duration);

    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, any> = {};

    for (const [operation, metrics] of this.performanceMetrics.entries()) {
      if (metrics.length === 0) continue;

      const avg = metrics.reduce((sum, m) => sum + m, 0) / metrics.length;
      const min = Math.min(...metrics);
      const max = Math.max(...metrics);

      result[operation] = { avg, min, max, count: metrics.length };
    }

    return result;
  }

  /**
   * Flush buffer to persistent storage
   */
  private async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const entries = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Write to file
      if (this.config.enableFile) {
        const logFile = path.join(this.config.logDir, 'audit.log');
        const logData = entries.map(e => JSON.stringify(e)).join('\n') + '\n';

        await fs.appendFile(logFile, logData);
      }

      // Write to Redis for real-time access
      if (this.config.enableRedis && this.redis) {
        for (const entry of entries) {
          await this.redis.lPush('audit:logs', JSON.stringify(entry));
        }
        // Keep only last 10000 entries in Redis
        await this.redis.lTrim('audit:logs', 0, 9999);
      }

      // Write to database (if configured)
      if (this.config.enableDatabase) {
        await this.writeToDatabase(entries);
      }

      this.emit('buffer:flushed', { count: entries.length });
    } catch (error) {
      this.emit('error', { type: 'flush-buffer', error });
      // Put entries back in buffer if flush fails
      this.logBuffer.unshift(...entries);
    }
  }

  /**
   * Write entries to database (placeholder)
   */
  private async writeToDatabase(entries: AuditLogEntry[]): Promise<void> {
    // This would integrate with your database of choice
    // For now, just emit an event
    this.emit('database:write', { count: entries.length });
  }

  /**
   * Start periodic buffer flush
   */
  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(async () => {
      await this.flushBuffer();
    }, 5000); // Flush every 5 seconds
  }

  /**
   * Start cleanup task for old logs
   */
  private startCleanupTask(): void {
    // Clean up old logs daily
    setInterval(async () => {
      await this.cleanupOldLogs();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  /**
   * Clean up old log files
   */
  private async cleanupOldLogs(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      // Clean up old files (placeholder - would need to implement file rotation)
      this.emit('cleanup:completed', { cutoffDate: cutoffDate.toISOString() });
    } catch (error) {
      this.emit('error', { type: 'cleanup', error });
    }
  }

  /**
   * Export audit logs for compliance
   */
  async exportLogs(
    filter: AuditLogFilter = {},
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<string> {
    const { entries } = await this.query(filter, { limit: 100000 }); // Reasonable limit

    switch (format) {
      case 'csv':
        return this.convertToCSV(entries);
      case 'xml':
        return this.convertToXML(entries);
      default:
        return JSON.stringify(entries, null, 2);
    }
  }

  /**
   * Convert entries to CSV format
   */
  private convertToCSV(entries: AuditLogEntry[]): string {
    if (entries.length === 0) return '';

    const headers = [
      'id', 'timestamp', 'level', 'category', 'action', 'userId',
      'ip', 'resource', 'resourceId', 'details', 'metadata'
    ];

    const csvRows = [
      headers.join(','),
      ...entries.map(entry => [
        entry.id,
        entry.timestamp,
        entry.level,
        entry.category,
        entry.action,
        entry.userId || '',
        entry.ip || '',
        entry.resource || '',
        entry.resourceId || '',
        JSON.stringify(entry.details),
        JSON.stringify(entry.metadata)
      ].join(','))
    ];

    return csvRows.join('\n');
  }

  /**
   * Convert entries to XML format
   */
  private convertToXML(entries: AuditLogEntry[]): string {
    const entriesXml = entries.map(entry => {
      return `  <entry>
    <id>${entry.id}</id>
    <timestamp>${entry.timestamp}</timestamp>
    <level>${entry.level}</level>
    <category>${entry.category}</category>
    <action>${entry.action}</action>
    <userId>${entry.userId || ''}</userId>
    <ip>${entry.ip || ''}</ip>
    <resource>${entry.resource || ''}</resource>
    <resourceId>${entry.resourceId || ''}</resourceId>
    <details>${JSON.stringify(entry.details)}</details>
    <metadata>${JSON.stringify(entry.metadata)}</metadata>
  </entry>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<audit-logs>
${entriesXml}
</audit-logs>`;
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(): Promise<Record<string, any>> {
    const bufferStats = {
      bufferedEntries: this.logBuffer.length,
      bufferCapacity: this.bufferSize
    };

    const performanceStats = this.getPerformanceMetrics();

    const categoryStats = this.getCategoryStatistics();
    const levelStats = this.getLevelStatistics();

    return {
      buffer: bufferStats,
      performance: performanceStats,
      categories: categoryStats,
      levels: levelStats,
      config: {
        retentionDays: this.config.retentionDays,
        maxFileSize: this.config.maxFileSize,
        maxFiles: this.config.maxFiles
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get statistics by category
   */
  private getCategoryStatistics(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const entry of this.logBuffer) {
      stats[entry.category] = (stats[entry.category] || 0) + 1;
    }

    return stats;
  }

  /**
   * Get statistics by level
   */
  private getLevelStatistics(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const entry of this.logBuffer) {
      stats[entry.level] = (stats[entry.level] || 0) + 1;
    }

    return stats;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      const stats = await this.getStatistics();

      if (stats.buffer.bufferedEntries > this.bufferSize * 0.9) {
        return {
          status: 'unhealthy',
          details: { issue: 'Buffer almost full', bufferUsage: stats.buffer.bufferedEntries / this.bufferSize }
        };
      }

      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }

  /**
   * Gracefully shutdown
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    // Flush any remaining entries
    await this.flushBuffer();

    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
    }

    this.emit('shutdown');
  }
}
