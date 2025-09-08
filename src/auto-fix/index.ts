/**
 * Auto-Fix Module
 * 
 * Comprehensive auto-fix system that detects issues, generates fixes,
 * verifies them, and commits the changes with full audit trail.
 */

// Core components
export { Detector, DetectorConfig, Issue, IssueType, IssueSeverity, IssueStatus, IssueLocation, IssueEvidence, DetectionResult, DEFAULT_DETECTOR_CONFIG } from './Detector';
export { Fixer, FixerConfig, Fix, FixType, FixStrategy, FixStatus, FixAction, TestUpdate, FixTemplate, FixResult, DEFAULT_FIXER_CONFIG } from './Fixer';
export { Verifier, VerifierConfig, VerificationResult, VerificationStatus, VerificationStep, PolicyViolation, DEFAULT_VERIFIER_CONFIG } from './Verifier';
export { Committer, CommitterConfig, CommitInfo, CommitStatus, CommitStrategy, PRTemplate, CommitMessage, DEFAULT_COMMITTER_CONFIG } from './Committer';

// Re-export types for convenience
export type {
  // Detector types
  IssueLocation,
  IssueEvidence,
  Issue,
  DetectionResult,
  
  // Fixer types
  FixAction,
  TestUpdate,
  Fix,
  FixTemplate,
  FixResult,
  
  // Verifier types
  VerificationResult,
  VerificationStep,
  PolicyViolation,
  
  // Committer types
  CommitInfo,
  PRTemplate,
  CommitMessage
};

import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import { Detector, DetectorConfig, DEFAULT_DETECTOR_CONFIG } from './Detector';
import { Fixer, FixerConfig, DEFAULT_FIXER_CONFIG } from './Fixer';
import { Verifier, VerifierConfig, DEFAULT_VERIFIER_CONFIG } from './Verifier';
import { Committer, CommitterConfig, DEFAULT_COMMITTER_CONFIG } from './Committer';
import type { Issue, Fix, VerificationResult, CommitInfo } from './index';

/**
 * Auto-Fix Pipeline Configuration
 */
export interface AutoFixConfig {
  enabled: boolean;
  
  // Component configurations
  detector: DetectorConfig;
  fixer: FixerConfig;
  verifier: VerifierConfig;
  committer: CommitterConfig;
  
  // Pipeline settings
  pipeline: {
    // Processing settings
    maxConcurrentFixes: number;
    maxQueueSize: number;
    processingTimeout: number; // milliseconds
    
    // Retry settings
    maxRetries: number;
    retryDelay: number; // milliseconds
    backoffMultiplier: number;
    
    // Filtering settings
    minSeverityLevel: string; // 'low', 'medium', 'high', 'critical'
    allowedIssueTypes: string[];
    excludedFiles: RegExp[];
    
    // Auto-approval settings
    autoApprovalThreshold: number; // 0-1, verification score threshold
    autoApprovalMaxFiles: number;
    autoApprovalMaxLines: number;
    
    // Monitoring settings
    enableTelemetry: boolean;
    telemetryInterval: number; // milliseconds
    
    // Safety settings
    enableSafetyChecks: boolean;
    requireHumanApproval: boolean;
    dryRunMode: boolean;
  };
  
  // Integration settings
  integrations: {
    // IDE integration
    vscode?: {
      showNotifications: boolean;
      showProgress: boolean;
      autoOpenDiff: boolean;
    };
    
    // CI/CD integration
    ci?: {
      enabled: boolean;
      triggerOnPush: boolean;
      triggerOnPR: boolean;
      failOnUnfixed: boolean;
    };
    
    // Monitoring integration
    monitoring?: {
      enabled: boolean;
      endpoint?: string;
      apiKey?: string;
    };
  };
}

/**
 * Auto-Fix Pipeline Statistics
 */
export interface AutoFixStatistics {
  // Processing stats
  totalIssuesDetected: number;
  totalFixesGenerated: number;
  totalFixesApplied: number;
  totalFixesCommitted: number;
  totalFixesRolledBack: number;
  
  // Success rates
  detectionSuccessRate: number;
  fixGenerationSuccessRate: number;
  verificationSuccessRate: number;
  commitSuccessRate: number;
  
  // Performance stats
  averageDetectionTime: number;
  averageFixTime: number;
  averageVerificationTime: number;
  averageCommitTime: number;
  averageEndToEndTime: number;
  
  // Issue breakdown
  issuesByType: Record<string, number>;
  issuesBySeverity: Record<string, number>;
  issuesByFile: Record<string, number>;
  
  // Fix breakdown
  fixesByType: Record<string, number>;
  fixesByStrategy: Record<string, number>;
  
  // Time-based stats
  dailyStats: Record<string, {
    detected: number;
    fixed: number;
    committed: number;
  }>;
  
  // Quality metrics
  averageVerificationScore: number;
  humanApprovalRate: number;
  rollbackRate: number;
}

/**
 * Auto-Fix Pipeline Events
 */
export interface AutoFixEvents {
  // Pipeline events
  'pipeline_started': { timestamp: number };
  'pipeline_stopped': { timestamp: number };
  'pipeline_error': { error: Error; timestamp: number };
  
  // Issue events
  'issue_detected': { issue: Issue; timestamp: number };
  'issue_queued': { issue: Issue; queueSize: number; timestamp: number };
  'issue_processing': { issue: Issue; timestamp: number };
  'issue_completed': { issue: Issue; fix?: Fix; commit?: CommitInfo; timestamp: number };
  'issue_failed': { issue: Issue; error: Error; timestamp: number };
  
  // Fix events
  'fix_generated': { issue: Issue; fix: Fix; timestamp: number };
  'fix_verified': { fix: Fix; result: VerificationResult; timestamp: number };
  'fix_approved': { fix: Fix; auto: boolean; timestamp: number };
  'fix_rejected': { fix: Fix; reason: string; timestamp: number };
  'fix_committed': { fix: Fix; commit: CommitInfo; timestamp: number };
  'fix_rolled_back': { fix: Fix; commit: CommitInfo; reason: string; timestamp: number };
  
  // Statistics events
  'statistics_updated': { stats: AutoFixStatistics; timestamp: number };
}

/**
 * Main Auto-Fix Pipeline Manager
 * 
 * Orchestrates the entire auto-fix process from detection to commit
 */
export class AutoFixManager extends EventEmitter {
  private config: AutoFixConfig;
  private logger: Logger;
  
  // Core components
  private detector: Detector;
  private fixer: Fixer;
  private verifier: Verifier;
  private committer: Committer;
  
  // Pipeline state
  private isRunning = false;
  private issueQueue: Issue[] = [];
  private processingIssues = new Map<string, Promise<void>>();
  private statistics: AutoFixStatistics;
  
  // Timers and intervals
  private telemetryInterval?: NodeJS.Timeout;
  private queueProcessor?: NodeJS.Timeout;

  constructor(config: Partial<AutoFixConfig> = {}, logger?: Logger) {
    super();
    
    this.config = this.mergeConfig(config);
    this.logger = logger || new Logger({ level: 'info' });
    
    // Initialize components
    this.detector = new Detector(this.config.detector, this.logger);
    this.fixer = new Fixer(this.config.fixer, this.logger);
    this.verifier = new Verifier(this.config.verifier, this.logger);
    this.committer = new Committer(this.config.committer, this.logger);
    
    // Initialize statistics
    this.statistics = this.initializeStatistics();
    
    // Setup event handlers
    this.setupEventHandlers();
  }

  /**
   * Initialize the auto-fix pipeline
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.info('Auto-Fix pipeline is disabled');
      return;
    }
    
    this.logger.info('Initializing Auto-Fix pipeline...');
    
    try {
      // Initialize all components
      await Promise.all([
        this.detector.initialize(),
        this.fixer.initialize(),
        this.verifier.initialize(),
        this.committer.initialize()
      ]);
      
      this.logger.info('Auto-Fix pipeline initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize Auto-Fix pipeline:', error);
      throw error;
    }
  }

  /**
   * Start the auto-fix pipeline
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Auto-Fix pipeline is disabled');
    }
    
    if (this.isRunning) {
      this.logger.warn('Auto-Fix pipeline is already running');
      return;
    }
    
    this.logger.info('Starting Auto-Fix pipeline...');
    
    try {
      // Start detection
      await this.detector.startWatching();
      
      // Start queue processor
      this.startQueueProcessor();
      
      // Start telemetry
      if (this.config.pipeline.enableTelemetry) {
        this.startTelemetry();
      }
      
      this.isRunning = true;
      this.emit('pipeline_started', { timestamp: Date.now() });
      
      this.logger.info('Auto-Fix pipeline started successfully');
      
    } catch (error) {
      this.logger.error('Failed to start Auto-Fix pipeline:', error);
      this.emit('pipeline_error', { error: error as Error, timestamp: Date.now() });
      throw error;
    }
  }

  /**
   * Stop the auto-fix pipeline
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    this.logger.info('Stopping Auto-Fix pipeline...');
    
    try {
      // Stop detection
      await this.detector.stopWatching();
      
      // Stop queue processor
      if (this.queueProcessor) {
        clearInterval(this.queueProcessor);
        this.queueProcessor = undefined;
      }
      
      // Stop telemetry
      if (this.telemetryInterval) {
        clearInterval(this.telemetryInterval);
        this.telemetryInterval = undefined;
      }
      
      // Wait for ongoing processing to complete
      await Promise.all(Array.from(this.processingIssues.values()));
      
      this.isRunning = false;
      this.emit('pipeline_stopped', { timestamp: Date.now() });
      
      this.logger.info('Auto-Fix pipeline stopped successfully');
      
    } catch (error) {
      this.logger.error('Error stopping Auto-Fix pipeline:', error);
      throw error;
    }
  }

  /**
   * Process a single issue manually
   */
  async processIssue(issue: Issue): Promise<{ fix?: Fix; commit?: CommitInfo; error?: Error }> {
    if (!this.config.enabled) {
      throw new Error('Auto-Fix pipeline is disabled');
    }
    
    this.logger.info(`Processing issue manually: ${issue.id}`);
    
    try {
      const result = await this.processIssueInternal(issue);
      this.emit('issue_completed', { issue, ...result, timestamp: Date.now() });
      return result;
      
    } catch (error) {
      this.logger.error(`Failed to process issue ${issue.id}:`, error);
      this.emit('issue_failed', { issue, error: error as Error, timestamp: Date.now() });
      return { error: error as Error };
    }
  }

  /**
   * Get current pipeline statistics
   */
  getStatistics(): AutoFixStatistics {
    return { ...this.statistics };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): AutoFixConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  async updateConfiguration(updates: Partial<AutoFixConfig>): Promise<void> {
    this.config = this.mergeConfig(updates, this.config);
    
    // Update component configurations
    // Note: This might require restarting components
    this.logger.info('Configuration updated');
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): {
    size: number;
    processing: number;
    issues: Issue[];
  } {
    return {
      size: this.issueQueue.length,
      processing: this.processingIssues.size,
      issues: [...this.issueQueue]
    };
  }

  /**
   * Clear the issue queue
   */
  clearQueue(): void {
    this.issueQueue.length = 0;
    this.logger.info('Issue queue cleared');
  }

  /**
   * Get component instances (for advanced usage)
   */
  getComponents(): {
    detector: Detector;
    fixer: Fixer;
    verifier: Verifier;
    committer: Committer;
  } {
    return {
      detector: this.detector,
      fixer: this.fixer,
      verifier: this.verifier,
      committer: this.committer
    };
  }

  // Private methods

  private mergeConfig(updates: Partial<AutoFixConfig>, base?: AutoFixConfig): AutoFixConfig {
    const defaultConfig = base || DEFAULT_AUTOFIX_CONFIG;
    
    return {
      ...defaultConfig,
      ...updates,
      detector: { ...defaultConfig.detector, ...updates.detector },
      fixer: { ...defaultConfig.fixer, ...updates.fixer },
      verifier: { ...defaultConfig.verifier, ...updates.verifier },
      committer: { ...defaultConfig.committer, ...updates.committer },
      pipeline: { ...defaultConfig.pipeline, ...updates.pipeline },
      integrations: { ...defaultConfig.integrations, ...updates.integrations }
    };
  }

  private initializeStatistics(): AutoFixStatistics {
    return {
      totalIssuesDetected: 0,
      totalFixesGenerated: 0,
      totalFixesApplied: 0,
      totalFixesCommitted: 0,
      totalFixesRolledBack: 0,
      
      detectionSuccessRate: 0,
      fixGenerationSuccessRate: 0,
      verificationSuccessRate: 0,
      commitSuccessRate: 0,
      
      averageDetectionTime: 0,
      averageFixTime: 0,
      averageVerificationTime: 0,
      averageCommitTime: 0,
      averageEndToEndTime: 0,
      
      issuesByType: {},
      issuesBySeverity: {},
      issuesByFile: {},
      
      fixesByType: {},
      fixesByStrategy: {},
      
      dailyStats: {},
      
      averageVerificationScore: 0,
      humanApprovalRate: 0,
      rollbackRate: 0
    };
  }

  private setupEventHandlers(): void {
    // Detector events
    this.detector.on('issue_detected', (issue: Issue) => {
      this.handleIssueDetected(issue);
    });
    
    // Component error events
    [this.detector, this.fixer, this.verifier, this.committer].forEach(component => {
      component.on('error', (error: Error) => {
        this.logger.error('Component error:', error);
        this.emit('pipeline_error', { error, timestamp: Date.now() });
      });
    });
  }

  private handleIssueDetected(issue: Issue): void {
    this.statistics.totalIssuesDetected++;
    this.updateIssueStatistics(issue);
    
    this.emit('issue_detected', { issue, timestamp: Date.now() });
    
    // Filter issue
    if (!this.shouldProcessIssue(issue)) {
      this.logger.debug(`Skipping issue ${issue.id}: filtered out`);
      return;
    }
    
    // Add to queue
    if (this.issueQueue.length >= this.config.pipeline.maxQueueSize) {
      this.logger.warn('Issue queue is full, dropping oldest issue');
      this.issueQueue.shift();
    }
    
    this.issueQueue.push(issue);
    this.emit('issue_queued', { 
      issue, 
      queueSize: this.issueQueue.length, 
      timestamp: Date.now() 
    });
  }

  private shouldProcessIssue(issue: Issue): boolean {
    // Check severity level
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    const minLevel = severityLevels.indexOf(this.config.pipeline.minSeverityLevel);
    const issueLevel = severityLevels.indexOf(issue.severity.toLowerCase());
    
    if (issueLevel < minLevel) {
      return false;
    }
    
    // Check issue type
    if (this.config.pipeline.allowedIssueTypes.length > 0) {
      if (!this.config.pipeline.allowedIssueTypes.includes(issue.type)) {
        return false;
      }
    }
    
    // Check excluded files
    if (issue.file) {
      for (const pattern of this.config.pipeline.excludedFiles) {
        if (pattern.test(issue.file)) {
          return false;
        }
      }
    }
    
    return true;
  }

  private startQueueProcessor(): void {
    this.queueProcessor = setInterval(() => {
      this.processQueue();
    }, 1000); // Process queue every second
  }

  private async processQueue(): Promise<void> {
    if (this.processingIssues.size >= this.config.pipeline.maxConcurrentFixes) {
      return; // Already at max concurrency
    }
    
    const issue = this.issueQueue.shift();
    if (!issue) {
      return; // No issues to process
    }
    
    // Start processing
    const processingPromise = this.processIssueInternal(issue)
      .then(result => {
        this.emit('issue_completed', { issue, ...result, timestamp: Date.now() });
      })
      .catch(error => {
        this.logger.error(`Failed to process issue ${issue.id}:`, error);
        this.emit('issue_failed', { issue, error, timestamp: Date.now() });
      })
      .finally(() => {
        this.processingIssues.delete(issue.id);
      });
    
    this.processingIssues.set(issue.id, processingPromise);
    this.emit('issue_processing', { issue, timestamp: Date.now() });
  }

  private async processIssueInternal(issue: Issue): Promise<{ fix?: Fix; commit?: CommitInfo }> {
    const startTime = Date.now();
    
    try {
      // Generate fix
      const fixStartTime = Date.now();
      const fix = await this.fixer.generateFix(issue);
      const fixTime = Date.now() - fixStartTime;
      
      if (!fix) {
        this.logger.warn(`No fix generated for issue: ${issue.id}`);
        return {};
      }
      
      this.statistics.totalFixesGenerated++;
      this.updateFixStatistics(fix);
      this.emit('fix_generated', { issue, fix, timestamp: Date.now() });
      
      // Verify fix
      const verifyStartTime = Date.now();
      const verificationResult = await this.verifier.verifyFix(fix, issue);
      const verifyTime = Date.now() - verifyStartTime;
      
      this.emit('fix_verified', { fix, result: verificationResult, timestamp: Date.now() });
      
      // Check if fix should be approved
      const shouldAutoApprove = this.shouldAutoApproveFix(fix, verificationResult);
      
      if (!shouldAutoApprove && this.config.pipeline.requireHumanApproval) {
        this.logger.info(`Fix ${fix.id} requires human approval`);
        // TODO: Implement human approval workflow
        return { fix };
      }
      
      if (shouldAutoApprove) {
        this.emit('fix_approved', { fix, auto: true, timestamp: Date.now() });
      }
      
      // Apply fix if not in dry run mode
      if (!this.config.pipeline.dryRunMode) {
        await this.fixer.applyFix(fix);
        this.statistics.totalFixesApplied++;
        
        // Commit fix
        const commitStartTime = Date.now();
        const commit = await this.committer.commitFix(fix, verificationResult, issue);
        const commitTime = Date.now() - commitStartTime;
        
        this.statistics.totalFixesCommitted++;
        this.emit('fix_committed', { fix, commit, timestamp: Date.now() });
        
        // Update timing statistics
        this.updateTimingStatistics({
          fixTime,
          verifyTime,
          commitTime,
          totalTime: Date.now() - startTime
        });
        
        return { fix, commit };
      } else {
        this.logger.info(`Dry run mode: would apply fix ${fix.id}`);
        return { fix };
      }
      
    } catch (error) {
      this.logger.error(`Error processing issue ${issue.id}:`, error);
      throw error;
    }
  }

  private shouldAutoApproveFix(fix: Fix, verificationResult: VerificationResult): boolean {
    // Check verification score threshold
    if (verificationResult.overallScore < this.config.pipeline.autoApprovalThreshold) {
      return false;
    }
    
    // Check file count limit
    if (fix.actions.length > this.config.pipeline.autoApprovalMaxFiles) {
      return false;
    }
    
    // Check line count limit
    const totalLines = fix.actions.reduce((sum, action) => 
      sum + (action.endLine - action.startLine + 1), 0
    );
    
    if (totalLines > this.config.pipeline.autoApprovalMaxLines) {
      return false;
    }
    
    // Check if approval is required by verification
    if (verificationResult.approvalRequired) {
      return false;
    }
    
    return true;
  }

  private startTelemetry(): void {
    this.telemetryInterval = setInterval(() => {
      this.emit('statistics_updated', { 
        stats: this.statistics, 
        timestamp: Date.now() 
      });
    }, this.config.pipeline.telemetryInterval);
  }

  private updateIssueStatistics(issue: Issue): void {
    // Update by type
    this.statistics.issuesByType[issue.type] = 
      (this.statistics.issuesByType[issue.type] || 0) + 1;
    
    // Update by severity
    this.statistics.issuesBySeverity[issue.severity] = 
      (this.statistics.issuesBySeverity[issue.severity] || 0) + 1;
    
    // Update by file
    if (issue.file) {
      this.statistics.issuesByFile[issue.file] = 
        (this.statistics.issuesByFile[issue.file] || 0) + 1;
    }
    
    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    if (!this.statistics.dailyStats[today]) {
      this.statistics.dailyStats[today] = { detected: 0, fixed: 0, committed: 0 };
    }
    this.statistics.dailyStats[today].detected++;
  }

  private updateFixStatistics(fix: Fix): void {
    // Update by type
    this.statistics.fixesByType[fix.type] = 
      (this.statistics.fixesByType[fix.type] || 0) + 1;
    
    // Update by strategy
    this.statistics.fixesByStrategy[fix.strategy] = 
      (this.statistics.fixesByStrategy[fix.strategy] || 0) + 1;
  }

  private updateTimingStatistics(timings: {
    fixTime: number;
    verifyTime: number;
    commitTime: number;
    totalTime: number;
  }): void {
    // Simple moving average (could be improved with proper statistics)
    const count = this.statistics.totalFixesApplied;
    
    this.statistics.averageFixTime = 
      (this.statistics.averageFixTime * (count - 1) + timings.fixTime) / count;
    
    this.statistics.averageVerificationTime = 
      (this.statistics.averageVerificationTime * (count - 1) + timings.verifyTime) / count;
    
    this.statistics.averageCommitTime = 
      (this.statistics.averageCommitTime * (count - 1) + timings.commitTime) / count;
    
    this.statistics.averageEndToEndTime = 
      (this.statistics.averageEndToEndTime * (count - 1) + timings.totalTime) / count;
  }
}

// Default configuration
export const DEFAULT_AUTOFIX_CONFIG: AutoFixConfig = {
  enabled: true,
  
  detector: DEFAULT_DETECTOR_CONFIG,
  fixer: DEFAULT_FIXER_CONFIG,
  verifier: DEFAULT_VERIFIER_CONFIG,
  committer: DEFAULT_COMMITTER_CONFIG,
  
  pipeline: {
    maxConcurrentFixes: 3,
    maxQueueSize: 100,
    processingTimeout: 300000, // 5 minutes
    
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    backoffMultiplier: 2,
    
    minSeverityLevel: 'medium',
    allowedIssueTypes: [], // Empty means all types allowed
    excludedFiles: [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /coverage/
    ],
    
    autoApprovalThreshold: 0.8,
    autoApprovalMaxFiles: 3,
    autoApprovalMaxLines: 50,
    
    enableTelemetry: true,
    telemetryInterval: 60000, // 1 minute
    
    enableSafetyChecks: true,
    requireHumanApproval: false,
    dryRunMode: false
  },
  
  integrations: {
    vscode: {
      showNotifications: true,
      showProgress: true,
      autoOpenDiff: false
    },
    
    ci: {
      enabled: false,
      triggerOnPush: true,
      triggerOnPR: true,
      failOnUnfixed: false
    },
    
    monitoring: {
      enabled: false
    }
  }
};

export default AutoFixManager;

// Convenience function to create and initialize the auto-fix manager
export async function createAutoFixManager(
  config: Partial<AutoFixConfig> = {},
  logger?: Logger
): Promise<AutoFixManager> {
  const manager = new AutoFixManager(config, logger);
  await manager.initialize();
  return manager;
}