/**
 * Auto-Fix Detector
 * 
 * Detects issues from various sources (lint, tests, runtime logs) and creates
 * incidents for the Auto-Fix pipeline to process.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../3d-sco/lib/monitoring/logging';

// Issue types and severity levels
export enum IssueType {
  LINT_ERROR = 'lint_error',
  LINT_WARNING = 'lint_warning',
  TEST_FAILURE = 'test_failure',
  RUNTIME_ERROR = 'runtime_error',
  COMPILATION_ERROR = 'compilation_error',
  SECURITY_VULNERABILITY = 'security_vulnerability',
  PERFORMANCE_ISSUE = 'performance_issue',
  DEPENDENCY_ISSUE = 'dependency_issue',
  TYPE_ERROR = 'type_error',
  SYNTAX_ERROR = 'syntax_error'
}

export enum IssueSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export enum IssueStatus {
  DETECTED = 'detected',
  ANALYZING = 'analyzing',
  FIX_PROPOSED = 'fix_proposed',
  FIX_APPLIED = 'fix_applied',
  VERIFIED = 'verified',
  RESOLVED = 'resolved',
  IGNORED = 'ignored',
  FAILED = 'failed'
}

// Core interfaces
export interface IssueLocation {
  file: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  function?: string;
  class?: string;
}

export interface IssueEvidence {
  source: string; // lint, test, runtime, etc.
  rawOutput: string;
  timestamp: number;
  context?: {
    command?: string;
    exitCode?: number;
    environment?: Record<string, string>;
    stackTrace?: string[];
    relatedFiles?: string[];
  };
}

export interface Issue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  status: IssueStatus;
  title: string;
  description: string;
  location: IssueLocation;
  evidence: IssueEvidence[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
  assignedTo?: string;
  estimatedFixTime?: number; // in minutes
  autoFixable: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface DetectorConfig {
  // Source configurations
  lint: {
    enabled: boolean;
    tools: string[]; // eslint, tslint, pylint, etc.
    configFiles: string[];
    watchMode: boolean;
  };
  test: {
    enabled: boolean;
    frameworks: string[]; // jest, mocha, pytest, etc.
    watchMode: boolean;
    failureThreshold: number;
  };
  runtime: {
    enabled: boolean;
    logFiles: string[];
    errorPatterns: RegExp[];
    watchMode: boolean;
  };
  compilation: {
    enabled: boolean;
    compilers: string[]; // tsc, javac, gcc, etc.
    watchMode: boolean;
  };
  
  // Detection settings
  autoFixThreshold: {
    [key in IssueSeverity]: boolean;
  };
  
  // Filtering and prioritization
  filters: {
    ignorePatterns: string[];
    includePatterns: string[];
    maxIssuesPerFile: number;
    duplicateWindow: number; // milliseconds
  };
  
  // Performance settings
  batchSize: number;
  processingInterval: number; // milliseconds
  maxConcurrentDetections: number;
}

export interface DetectionResult {
  issues: Issue[];
  summary: {
    total: number;
    byType: Record<IssueType, number>;
    bySeverity: Record<IssueSeverity, number>;
    autoFixable: number;
  };
  processingTime: number;
}

/**
 * Issue Detector
 * 
 * Monitors various sources for issues and creates structured incidents
 */
export class Detector extends EventEmitter {
  private config: DetectorConfig;
  private logger: Logger;
  private issues: Map<string, Issue> = new Map();
  private watchers: Map<string, any> = new Map();
  private processing = false;
  private processingQueue: (() => Promise<void>)[] = [];
  private recentIssues: Set<string> = new Set(); // For duplicate detection
  private statistics = {
    totalDetected: 0,
    totalResolved: 0,
    averageFixTime: 0,
    byType: {} as Record<IssueType, number>,
    bySeverity: {} as Record<IssueSeverity, number>
  };

  constructor(config: DetectorConfig, logger?: Logger) {
    super();
    this.config = config;
    this.logger = logger || new Logger('Detector');
  }

  /**
   * Initialize the detector
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Auto-Fix Detector...');

    // Start watchers if enabled
    if (this.config.lint.watchMode) {
      await this.startLintWatcher();
    }

    if (this.config.test.watchMode) {
      await this.startTestWatcher();
    }

    if (this.config.runtime.watchMode) {
      await this.startRuntimeWatcher();
    }

    if (this.config.compilation.watchMode) {
      await this.startCompilationWatcher();
    }

    // Start processing queue
    this.startProcessingLoop();

    this.logger.info('Auto-Fix Detector initialized successfully');
  }

  /**
   * Shutdown the detector
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Auto-Fix Detector...');

    // Stop all watchers
    for (const [name, watcher] of this.watchers) {
      if (watcher && typeof watcher.close === 'function') {
        watcher.close();
      }
      this.logger.debug(`Stopped watcher: ${name}`);
    }
    this.watchers.clear();

    // Stop processing
    this.processing = false;

    this.logger.info('Auto-Fix Detector shutdown complete');
  }

  /**
   * Manually trigger detection from various sources
   */
  async detectIssues(sources?: string[]): Promise<DetectionResult> {
    const startTime = Date.now();
    const allIssues: Issue[] = [];

    const sourcesToCheck = sources || ['lint', 'test', 'runtime', 'compilation'];

    for (const source of sourcesToCheck) {
      try {
        let issues: Issue[] = [];

        switch (source) {
          case 'lint':
            if (this.config.lint.enabled) {
              issues = await this.detectLintIssues();
            }
            break;
          case 'test':
            if (this.config.test.enabled) {
              issues = await this.detectTestIssues();
            }
            break;
          case 'runtime':
            if (this.config.runtime.enabled) {
              issues = await this.detectRuntimeIssues();
            }
            break;
          case 'compilation':
            if (this.config.compilation.enabled) {
              issues = await this.detectCompilationIssues();
            }
            break;
        }

        allIssues.push(...issues);
      } catch (error) {
        this.logger.error(`Error detecting ${source} issues:`, error);
      }
    }

    // Process and store issues
    const processedIssues = await this.processIssues(allIssues);

    const processingTime = Date.now() - startTime;

    const result: DetectionResult = {
      issues: processedIssues,
      summary: this.generateSummary(processedIssues),
      processingTime
    };

    this.emit('detection_complete', result);
    return result;
  }

  /**
   * Get issue by ID
   */
  getIssue(id: string): Issue | undefined {
    return this.issues.get(id);
  }

  /**
   * Get all issues with optional filtering
   */
  getIssues(filters?: {
    type?: IssueType[];
    severity?: IssueSeverity[];
    status?: IssueStatus[];
    autoFixable?: boolean;
    file?: string;
  }): Issue[] {
    let issues = Array.from(this.issues.values());

    if (filters) {
      if (filters.type) {
        issues = issues.filter(issue => filters.type!.includes(issue.type));
      }
      if (filters.severity) {
        issues = issues.filter(issue => filters.severity!.includes(issue.severity));
      }
      if (filters.status) {
        issues = issues.filter(issue => filters.status!.includes(issue.status));
      }
      if (filters.autoFixable !== undefined) {
        issues = issues.filter(issue => issue.autoFixable === filters.autoFixable);
      }
      if (filters.file) {
        issues = issues.filter(issue => issue.location.file === filters.file);
      }
    }

    return issues.sort((a, b) => {
      // Sort by severity first, then by creation time
      const severityOrder = {
        [IssueSeverity.CRITICAL]: 0,
        [IssueSeverity.HIGH]: 1,
        [IssueSeverity.MEDIUM]: 2,
        [IssueSeverity.LOW]: 3,
        [IssueSeverity.INFO]: 4
      };
      
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      
      return b.createdAt - a.createdAt;
    });
  }

  /**
   * Update issue status
   */
  updateIssueStatus(id: string, status: IssueStatus, metadata?: Record<string, any>): boolean {
    const issue = this.issues.get(id);
    if (!issue) return false;

    const oldStatus = issue.status;
    issue.status = status;
    issue.updatedAt = Date.now();
    
    if (metadata) {
      issue.metadata = { ...issue.metadata, ...metadata };
    }

    this.emit('issue_status_changed', {
      issue,
      oldStatus,
      newStatus: status
    });

    // Update statistics
    if (status === IssueStatus.RESOLVED) {
      this.statistics.totalResolved++;
    }

    return true;
  }

  /**
   * Get detection statistics
   */
  getStatistics(): typeof this.statistics {
    return { ...this.statistics };
  }

  /**
   * Clear resolved issues older than specified time
   */
  cleanupResolvedIssues(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - olderThanMs;
    let cleaned = 0;

    for (const [id, issue] of this.issues) {
      if (issue.status === IssueStatus.RESOLVED && issue.updatedAt < cutoff) {
        this.issues.delete(id);
        cleaned++;
      }
    }

    this.logger.info(`Cleaned up ${cleaned} resolved issues`);
    return cleaned;
  }

  // Private methods

  private async startLintWatcher(): Promise<void> {
    // Implementation would depend on specific linting tools
    // This is a placeholder for the concept
    this.logger.debug('Starting lint watcher...');
    // TODO: Implement file system watching for lint configuration changes
    // TODO: Integrate with ESLint, TSLint, Pylint, etc.
  }

  private async startTestWatcher(): Promise<void> {
    this.logger.debug('Starting test watcher...');
    // TODO: Implement test result monitoring
    // TODO: Integrate with Jest, Mocha, PyTest, etc.
  }

  private async startRuntimeWatcher(): Promise<void> {
    this.logger.debug('Starting runtime watcher...');
    // TODO: Implement log file monitoring
    // TODO: Parse error patterns from application logs
  }

  private async startCompilationWatcher(): Promise<void> {
    this.logger.debug('Starting compilation watcher...');
    // TODO: Implement compilation error monitoring
    // TODO: Integrate with TypeScript, Java, C++, etc. compilers
  }

  private startProcessingLoop(): void {
    const processQueue = async () => {
      if (!this.processing || this.processingQueue.length === 0) {
        setTimeout(processQueue, this.config.processingInterval);
        return;
      }

      const batch = this.processingQueue.splice(0, this.config.batchSize);
      
      try {
        await Promise.all(batch.map(task => task()));
      } catch (error) {
        this.logger.error('Error processing detection queue:', error);
      }

      setTimeout(processQueue, this.config.processingInterval);
    };

    this.processing = true;
    processQueue();
  }

  private async detectLintIssues(): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // TODO: Implement actual lint detection
    // This would run configured linters and parse their output
    
    return issues;
  }

  private async detectTestIssues(): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // TODO: Implement actual test failure detection
    // This would run tests and parse failure reports
    
    return issues;
  }

  private async detectRuntimeIssues(): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // TODO: Implement actual runtime error detection
    // This would monitor log files and parse error patterns
    
    return issues;
  }

  private async detectCompilationIssues(): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // TODO: Implement actual compilation error detection
    // This would run compilers and parse error output
    
    return issues;
  }

  private async processIssues(rawIssues: Issue[]): Promise<Issue[]> {
    const processedIssues: Issue[] = [];

    for (const issue of rawIssues) {
      // Check for duplicates
      if (this.isDuplicate(issue)) {
        continue;
      }

      // Apply filters
      if (!this.passesFilters(issue)) {
        continue;
      }

      // Determine auto-fixability
      issue.autoFixable = this.isAutoFixable(issue);
      
      // Estimate fix time
      issue.estimatedFixTime = this.estimateFixTime(issue);
      
      // Determine risk level
      issue.riskLevel = this.assessRiskLevel(issue);

      // Store issue
      this.issues.set(issue.id, issue);
      processedIssues.push(issue);

      // Update statistics
      this.updateStatistics(issue);

      // Mark as recent for duplicate detection
      this.recentIssues.add(this.getIssueSignature(issue));
      setTimeout(() => {
        this.recentIssues.delete(this.getIssueSignature(issue));
      }, this.config.filters.duplicateWindow);

      // Emit event
      this.emit('issue_detected', issue);
    }

    return processedIssues;
  }

  private isDuplicate(issue: Issue): boolean {
    const signature = this.getIssueSignature(issue);
    return this.recentIssues.has(signature);
  }

  private getIssueSignature(issue: Issue): string {
    return `${issue.type}:${issue.location.file}:${issue.location.line}:${issue.title}`;
  }

  private passesFilters(issue: Issue): boolean {
    // Check ignore patterns
    for (const pattern of this.config.filters.ignorePatterns) {
      if (new RegExp(pattern).test(issue.location.file) || 
          new RegExp(pattern).test(issue.title)) {
        return false;
      }
    }

    // Check include patterns (if any)
    if (this.config.filters.includePatterns.length > 0) {
      let matches = false;
      for (const pattern of this.config.filters.includePatterns) {
        if (new RegExp(pattern).test(issue.location.file) || 
            new RegExp(pattern).test(issue.title)) {
          matches = true;
          break;
        }
      }
      if (!matches) return false;
    }

    // Check max issues per file
    const fileIssues = Array.from(this.issues.values())
      .filter(i => i.location.file === issue.location.file);
    if (fileIssues.length >= this.config.filters.maxIssuesPerFile) {
      return false;
    }

    return true;
  }

  private isAutoFixable(issue: Issue): boolean {
    // Check if this severity level is configured for auto-fix
    if (!this.config.autoFixThreshold[issue.severity]) {
      return false;
    }

    // Additional logic based on issue type
    switch (issue.type) {
      case IssueType.SECURITY_VULNERABILITY:
        return false; // Never auto-fix security issues
      case IssueType.SYNTAX_ERROR:
      case IssueType.LINT_ERROR:
      case IssueType.TYPE_ERROR:
        return true; // Usually safe to auto-fix
      case IssueType.TEST_FAILURE:
        return issue.severity === IssueSeverity.LOW; // Only low-severity test failures
      default:
        return issue.severity === IssueSeverity.LOW || issue.severity === IssueSeverity.INFO;
    }
  }

  private estimateFixTime(issue: Issue): number {
    // Estimate fix time in minutes based on issue type and complexity
    const baseTime = {
      [IssueType.SYNTAX_ERROR]: 2,
      [IssueType.LINT_ERROR]: 1,
      [IssueType.LINT_WARNING]: 1,
      [IssueType.TYPE_ERROR]: 3,
      [IssueType.TEST_FAILURE]: 10,
      [IssueType.COMPILATION_ERROR]: 5,
      [IssueType.RUNTIME_ERROR]: 15,
      [IssueType.SECURITY_VULNERABILITY]: 60,
      [IssueType.PERFORMANCE_ISSUE]: 30,
      [IssueType.DEPENDENCY_ISSUE]: 20
    };

    const severityMultiplier = {
      [IssueSeverity.INFO]: 0.5,
      [IssueSeverity.LOW]: 1,
      [IssueSeverity.MEDIUM]: 2,
      [IssueSeverity.HIGH]: 3,
      [IssueSeverity.CRITICAL]: 5
    };

    return Math.round(
      (baseTime[issue.type] || 10) * severityMultiplier[issue.severity]
    );
  }

  private assessRiskLevel(issue: Issue): 'low' | 'medium' | 'high' {
    // Assess risk level for auto-fixing
    if (issue.type === IssueType.SECURITY_VULNERABILITY) {
      return 'high';
    }

    if (issue.severity === IssueSeverity.CRITICAL || issue.severity === IssueSeverity.HIGH) {
      return 'high';
    }

    if (issue.type === IssueType.RUNTIME_ERROR || issue.type === IssueType.TEST_FAILURE) {
      return 'medium';
    }

    return 'low';
  }

  private updateStatistics(issue: Issue): void {
    this.statistics.totalDetected++;
    this.statistics.byType[issue.type] = (this.statistics.byType[issue.type] || 0) + 1;
    this.statistics.bySeverity[issue.severity] = (this.statistics.bySeverity[issue.severity] || 0) + 1;
  }

  private generateSummary(issues: Issue[]): DetectionResult['summary'] {
    const summary = {
      total: issues.length,
      byType: {} as Record<IssueType, number>,
      bySeverity: {} as Record<IssueSeverity, number>,
      autoFixable: 0
    };

    for (const issue of issues) {
      summary.byType[issue.type] = (summary.byType[issue.type] || 0) + 1;
      summary.bySeverity[issue.severity] = (summary.bySeverity[issue.severity] || 0) + 1;
      if (issue.autoFixable) {
        summary.autoFixable++;
      }
    }

    return summary;
  }
}

// Default configuration
export const DEFAULT_DETECTOR_CONFIG: DetectorConfig = {
  lint: {
    enabled: true,
    tools: ['eslint', 'tslint', 'pylint'],
    configFiles: ['.eslintrc.js', '.eslintrc.json', 'tslint.json', 'pylint.rc'],
    watchMode: true
  },
  test: {
    enabled: true,
    frameworks: ['jest', 'mocha', 'pytest'],
    watchMode: true,
    failureThreshold: 1
  },
  runtime: {
    enabled: true,
    logFiles: ['*.log', 'logs/*.log'],
    errorPatterns: [
      /ERROR/i,
      /FATAL/i,
      /Exception/i,
      /Error:/i
    ],
    watchMode: true
  },
  compilation: {
    enabled: true,
    compilers: ['tsc', 'javac', 'gcc'],
    watchMode: true
  },
  autoFixThreshold: {
    [IssueSeverity.CRITICAL]: false,
    [IssueSeverity.HIGH]: false,
    [IssueSeverity.MEDIUM]: false,
    [IssueSeverity.LOW]: true,
    [IssueSeverity.INFO]: true
  },
  filters: {
    ignorePatterns: [
      'node_modules',
      '.git',
      'dist',
      'build',
      '*.min.js'
    ],
    includePatterns: [],
    maxIssuesPerFile: 50,
    duplicateWindow: 5000 // 5 seconds
  },
  batchSize: 10,
  processingInterval: 1000, // 1 second
  maxConcurrentDetections: 5
};

export default Detector;