/**
 * Auto-Fix Pipeline
 * 
 * Orchestrates the complete auto-fix workflow from detection to commit.
 * Integrates Detector, Fixer, Verifier, and Committer components.
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import { Detector, Issue, IssueType, IssueSeverity, DetectorConfig } from './Detector';
import { Fixer, Fix, FixStrategy, FixerConfig } from './Fixer';
import { Verifier, VerificationResult, VerifierConfig } from './Verifier';
import { Committer, CommitInfo, CommitterConfig } from './Committer';

export interface PipelineConfig {
  detector: DetectorConfig;
  fixer: FixerConfig;
  verifier: VerifierConfig;
  committer: CommitterConfig;
  
  pipeline: {
    enabled: boolean;
    autoMode: boolean;
    maxConcurrentFixes: number;
    retryAttempts: number;
    retryDelay: number;
    timeout: number;
    
    filters: {
      severityThreshold: IssueSeverity;
      issueTypes: IssueType[];
      pathPatterns: string[];
      excludePatterns: string[];
    };
    
    approval: {
      required: boolean;
      autoApprove: {
        lowRisk: boolean;
        highConfidence: boolean;
        testsPassing: boolean;
      };
      approvers: string[];
      timeout: number;
    };
    
    rollback: {
      enabled: boolean;
      conditions: {
        testFailures: boolean;
        verificationScore: number;
        userReports: number;
      };
      autoRollback: boolean;
      gracePeriod: number;
    };
    
    monitoring: {
      enabled: boolean;
      metrics: {
        successRate: boolean;
        averageTime: boolean;
        issueTypes: boolean;
        fixStrategies: boolean;
      };
      alerts: {
        failureRate: number;
        responseTime: number;
        errorPatterns: string[];
      };
    };
  };
}

export interface PipelineRun {
  id: string;
  issue: Issue;
  fix?: Fix;
  verificationResult?: VerificationResult;
  commitResult?: CommitInfo;
  status: PipelineStatus;
  stage: PipelineStage;
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: Error;
  metadata: PipelineMetadata;
}

export enum PipelineStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  AWAITING_APPROVAL = 'awaiting_approval',
  ROLLED_BACK = 'rolled_back'
}

export enum PipelineStage {
  DETECTION = 'detection',
  FIXING = 'fixing',
  VERIFICATION = 'verification',
  APPROVAL = 'approval',
  COMMIT = 'commit',
  MONITORING = 'monitoring',
  COMPLETED = 'completed'
}

export interface PipelineMetadata {
  triggeredBy: 'automatic' | 'manual' | 'scheduled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  context: {
    repository: string;
    branch: string;
    commit: string;
    author: string;
  };
  performance: {
    detectionTime: number;
    fixingTime: number;
    verificationTime: number;
    commitTime: number;
  };
}

export interface PipelineStatistics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  cancelledRuns: number;
  rolledBackRuns: number;
  
  averageRunTime: number;
  successRate: number;
  
  byIssueType: Record<IssueType, {
    count: number;
    successRate: number;
    averageTime: number;
  }>;
  
  byFixStrategy: Record<FixStrategy, {
    count: number;
    successRate: number;
    averageTime: number;
  }>;
  
  bySeverity: Record<IssueSeverity, {
    count: number;
    successRate: number;
    averageTime: number;
  }>;
  
  recentTrends: {
    hourly: number[];
    daily: number[];
    weekly: number[];
  };
}

export class AutoFixPipeline extends EventEmitter {
  private config: PipelineConfig;
  private logger: Logger;
  
  private detector: Detector;
  private fixer: Fixer;
  private verifier: Verifier;
  private committer: Committer;
  
  private activeRuns: Map<string, PipelineRun> = new Map();
  private runHistory: Map<string, PipelineRun> = new Map();
  private pendingApprovals: Map<string, PipelineRun> = new Map();
  
  private statistics: PipelineStatistics = {
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    cancelledRuns: 0,
    rolledBackRuns: 0,
    averageRunTime: 0,
    successRate: 0,
    byIssueType: {} as any,
    byFixStrategy: {} as any,
    bySeverity: {} as any,
    recentTrends: {
      hourly: new Array(24).fill(0),
      daily: new Array(7).fill(0),
      weekly: new Array(4).fill(0)
    }
  };
  
  private isRunning = false;
  private shutdownRequested = false;

  constructor(config: PipelineConfig, logger?: Logger) {
    super();
    this.config = config;
    this.logger = logger || new Logger('AutoFixPipeline');
    
    // Initialize components
    this.detector = new Detector(config.detector, this.logger);
    this.fixer = new Fixer(config.fixer, this.logger);
    this.verifier = new Verifier(config.verifier, this.logger);
    this.committer = new Committer(config.committer, this.logger);
    
    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Auto-Fix Pipeline...');
    
    try {
      // Initialize all components
      await Promise.all([
        this.detector.initialize(),
        this.fixer.initialize(),
        this.verifier.initialize(),
        this.committer.initialize()
      ]);
      
      // Start monitoring if enabled
      if (this.config.pipeline.monitoring.enabled) {
        this.startMonitoring();
      }
      
      this.isRunning = true;
      this.logger.info('Auto-Fix Pipeline initialized successfully');
      this.emit('pipeline.initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize Auto-Fix Pipeline:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    // Detector events
    this.detector.on('issue.detected', (issue: Issue) => {
      if (this.config.pipeline.autoMode && this.shouldProcessIssue(issue)) {
        this.processIssue(issue, 'automatic');
      }
    });
    
    // Component error events
    this.detector.on('error', (error) => this.handleComponentError('detector', error));
    this.fixer.on('error', (error) => this.handleComponentError('fixer', error));
    this.verifier.on('error', (error) => this.handleComponentError('verifier', error));
    this.committer.on('error', (error) => this.handleComponentError('committer', error));
  }

  async processIssue(
    issue: Issue, 
    triggeredBy: 'automatic' | 'manual' | 'scheduled' = 'manual'
  ): Promise<PipelineRun> {
    const runId = this.generateRunId();
    const startTime = Date.now();
    
    const run: PipelineRun = {
      id: runId,
      issue,
      status: PipelineStatus.RUNNING,
      stage: PipelineStage.DETECTION,
      startTime,
      metadata: {
        triggeredBy,
        priority: this.mapSeverityToPriority(issue.severity),
        tags: [issue.type, issue.severity],
        context: await this.getRepositoryContext(),
        performance: {
          detectionTime: 0,
          fixingTime: 0,
          verificationTime: 0,
          commitTime: 0
        }
      }
    };
    
    this.activeRuns.set(runId, run);
    this.emit('pipeline.started', run);
    
    try {
      // Check if we're at capacity
      if (this.activeRuns.size > this.config.pipeline.maxConcurrentFixes) {
        throw new Error('Maximum concurrent fixes reached');
      }
      
      // Execute pipeline stages
      await this.executePipelineStages(run);
      
      // Mark as completed
      run.status = PipelineStatus.SUCCESS;
      run.stage = PipelineStage.COMPLETED;
      run.endTime = Date.now();
      run.duration = run.endTime - run.startTime;
      
      this.statistics.successfulRuns++;
      this.emit('pipeline.completed', run);
      
    } catch (error) {
      this.logger.error(`Pipeline run ${runId} failed:`, error);
      
      run.status = PipelineStatus.FAILED;
      run.error = error as Error;
      run.endTime = Date.now();
      run.duration = run.endTime - run.startTime;
      
      this.statistics.failedRuns++;
      this.emit('pipeline.failed', run);
      
      // Attempt rollback if configured
      if (this.config.pipeline.rollback.enabled && run.commitResult) {
        await this.attemptRollback(run);
      }
    } finally {
      this.activeRuns.delete(runId);
      this.runHistory.set(runId, run);
      this.updateStatistics(run);
    }
    
    return run;
  }

  private async executePipelineStages(run: PipelineRun): Promise<void> {
    const { issue } = run;
    
    // Stage 1: Generate Fix
    run.stage = PipelineStage.FIXING;
    this.emit('pipeline.stage.started', { run, stage: PipelineStage.FIXING });
    
    const fixStartTime = Date.now();
    run.fix = await this.fixer.generateFix(issue);
    run.metadata.performance.fixingTime = Date.now() - fixStartTime;
    
    if (!run.fix) {
      throw new Error('Failed to generate fix');
    }
    
    this.emit('pipeline.stage.completed', { run, stage: PipelineStage.FIXING });
    
    // Stage 2: Verify Fix
    run.stage = PipelineStage.VERIFICATION;
    this.emit('pipeline.stage.started', { run, stage: PipelineStage.VERIFICATION });
    
    const verifyStartTime = Date.now();
    run.verificationResult = await this.verifier.verifyFix(run.fix);
    run.metadata.performance.verificationTime = Date.now() - verifyStartTime;
    
    if (!run.verificationResult.canProceed) {
      throw new Error(`Fix verification failed: ${run.verificationResult.blockers.join(', ')}`);
    }
    
    this.emit('pipeline.stage.completed', { run, stage: PipelineStage.VERIFICATION });
    
    // Stage 3: Approval (if required)
    if (this.requiresApproval(run)) {
      run.stage = PipelineStage.APPROVAL;
      run.status = PipelineStatus.AWAITING_APPROVAL;
      
      this.pendingApprovals.set(run.id, run);
      this.emit('pipeline.approval.required', run);
      
      // Wait for approval or timeout
      await this.waitForApproval(run);
      
      this.pendingApprovals.delete(run.id);
    }
    
    // Stage 4: Commit Fix
    run.stage = PipelineStage.COMMIT;
    this.emit('pipeline.stage.started', { run, stage: PipelineStage.COMMIT });
    
    const commitStartTime = Date.now();
    run.commitResult = await this.committer.commitFix(
      run.fix!, 
      run.verificationResult!, 
      issue
    );
    run.metadata.performance.commitTime = Date.now() - commitStartTime;
    
    if (!run.commitResult.success) {
      throw new Error('Failed to commit fix');
    }
    
    this.emit('pipeline.stage.completed', { run, stage: PipelineStage.COMMIT });
    
    // Stage 5: Post-commit monitoring
    if (this.config.pipeline.monitoring.enabled) {
      run.stage = PipelineStage.MONITORING;
      this.startPostCommitMonitoring(run);
    }
  }

  private shouldProcessIssue(issue: Issue): boolean {
    const { filters } = this.config.pipeline;
    
    // Check severity threshold
    if (this.getSeverityLevel(issue.severity) < this.getSeverityLevel(filters.severityThreshold)) {
      return false;
    }
    
    // Check issue types
    if (filters.issueTypes.length > 0 && !filters.issueTypes.includes(issue.type)) {
      return false;
    }
    
    // Check path patterns
    if (filters.pathPatterns.length > 0) {
      const matchesPattern = filters.pathPatterns.some(pattern => 
        this.matchesPattern(issue.location.file, pattern)
      );
      if (!matchesPattern) {
        return false;
      }
    }
    
    // Check exclude patterns
    if (filters.excludePatterns.length > 0) {
      const matchesExclude = filters.excludePatterns.some(pattern => 
        this.matchesPattern(issue.location.file, pattern)
      );
      if (matchesExclude) {
        return false;
      }
    }
    
    return true;
  }

  private requiresApproval(run: PipelineRun): boolean {
    const { approval } = this.config.pipeline;
    
    if (!approval.required) {
      return false;
    }
    
    // Check auto-approval conditions
    const { autoApprove } = approval;
    const { verificationResult, metadata } = run;
    
    if (autoApprove.lowRisk && metadata.priority === 'low') {
      return false;
    }
    
    if (autoApprove.highConfidence && verificationResult && verificationResult.overallScore > 0.9) {
      return false;
    }
    
    if (autoApprove.testsPassing && verificationResult && verificationResult.canProceed) {
      const allTestsPassed = verificationResult.steps.every(step => 
        step.status === 'passed'
      );
      if (allTestsPassed) {
        return false;
      }
    }
    
    return true;
  }

  private async waitForApproval(run: PipelineRun): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Approval timeout'));
      }, this.config.pipeline.approval.timeout);
      
      const approvalHandler = (approvedRunId: string, approved: boolean) => {
        if (approvedRunId === run.id) {
          clearTimeout(timeout);
          this.off('pipeline.approval.response', approvalHandler);
          
          if (approved) {
            resolve();
          } else {
            reject(new Error('Fix was rejected'));
          }
        }
      };
      
      this.on('pipeline.approval.response', approvalHandler);
    });
  }

  async approveFix(runId: string, approved: boolean, approver: string): Promise<void> {
    const run = this.pendingApprovals.get(runId);
    if (!run) {
      throw new Error(`No pending approval found for run ${runId}`);
    }
    
    this.logger.info(`Fix ${runId} ${approved ? 'approved' : 'rejected'} by ${approver}`);
    
    run.metadata.tags.push(approved ? 'approved' : 'rejected');
    
    this.emit('pipeline.approval.response', runId, approved);
  }

  private async attemptRollback(run: PipelineRun): Promise<void> {
    if (!run.commitResult) {
      return;
    }
    
    try {
      this.logger.info(`Attempting rollback for run ${run.id}`);
      
      await this.committer.rollback(run.commitResult.rollbackInfo);
      
      run.status = PipelineStatus.ROLLED_BACK;
      this.statistics.rolledBackRuns++;
      
      this.emit('pipeline.rolled.back', run);
      
    } catch (error) {
      this.logger.error(`Rollback failed for run ${run.id}:`, error);
      this.emit('pipeline.rollback.failed', { run, error });
    }
  }

  private startPostCommitMonitoring(run: PipelineRun): void {
    // Monitor for issues after commit
    const monitoringPeriod = this.config.pipeline.rollback.gracePeriod;
    
    setTimeout(async () => {
      try {
        const postCommitIssues = await this.detector.scanForIssues({
          paths: run.fix!.actions.map(action => action.file),
          since: run.commitResult!.timestamp
        });
        
        if (postCommitIssues.length > 0) {
          this.logger.warn(`Post-commit issues detected for run ${run.id}:`, postCommitIssues);
          
          if (this.config.pipeline.rollback.autoRollback) {
            await this.attemptRollback(run);
          } else {
            this.emit('pipeline.post.commit.issues', { run, issues: postCommitIssues });
          }
        }
      } catch (error) {
        this.logger.error(`Post-commit monitoring failed for run ${run.id}:`, error);
      }
    }, monitoringPeriod);
  }

  private startMonitoring(): void {
    // Start periodic statistics collection
    setInterval(() => {
      this.collectMetrics();
    }, 60000); // Every minute
    
    // Start trend analysis
    setInterval(() => {
      this.updateTrends();
    }, 3600000); // Every hour
  }

  private collectMetrics(): void {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    // Count recent runs
    const recentRuns = Array.from(this.runHistory.values())
      .filter(run => run.startTime > oneHourAgo);
    
    // Update success rate
    if (this.statistics.totalRuns > 0) {
      this.statistics.successRate = this.statistics.successfulRuns / this.statistics.totalRuns;
    }
    
    // Check alert conditions
    this.checkAlerts(recentRuns);
    
    this.emit('pipeline.metrics.updated', this.statistics);
  }

  private updateTrends(): void {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Shift hourly trend
    this.statistics.recentTrends.hourly.shift();
    this.statistics.recentTrends.hourly.push(
      Array.from(this.runHistory.values())
        .filter(run => {
          const runDate = new Date(run.startTime);
          return runDate.getHours() === currentHour && 
                 runDate.getDate() === now.getDate();
        }).length
    );
  }

  private checkAlerts(recentRuns: PipelineRun[]): void {
    const { alerts } = this.config.pipeline.monitoring;
    
    // Check failure rate
    if (recentRuns.length > 0) {
      const failureRate = recentRuns.filter(run => 
        run.status === PipelineStatus.FAILED
      ).length / recentRuns.length;
      
      if (failureRate > alerts.failureRate) {
        this.emit('pipeline.alert', {
          type: 'high_failure_rate',
          value: failureRate,
          threshold: alerts.failureRate
        });
      }
    }
    
    // Check response time
    const avgResponseTime = recentRuns.reduce((sum, run) => 
      sum + (run.duration || 0), 0
    ) / recentRuns.length;
    
    if (avgResponseTime > alerts.responseTime) {
      this.emit('pipeline.alert', {
        type: 'slow_response_time',
        value: avgResponseTime,
        threshold: alerts.responseTime
      });
    }
  }

  private updateStatistics(run: PipelineRun): void {
    this.statistics.totalRuns++;
    
    // Update by issue type
    if (!this.statistics.byIssueType[run.issue.type]) {
      this.statistics.byIssueType[run.issue.type] = {
        count: 0,
        successRate: 0,
        averageTime: 0
      };
    }
    
    const issueStats = this.statistics.byIssueType[run.issue.type];
    issueStats.count++;
    
    if (run.status === PipelineStatus.SUCCESS) {
      issueStats.successRate = (issueStats.successRate * (issueStats.count - 1) + 1) / issueStats.count;
    } else {
      issueStats.successRate = (issueStats.successRate * (issueStats.count - 1)) / issueStats.count;
    }
    
    if (run.duration) {
      issueStats.averageTime = (issueStats.averageTime * (issueStats.count - 1) + run.duration) / issueStats.count;
    }
    
    // Update overall average time
    if (run.duration) {
      this.statistics.averageRunTime = (
        (this.statistics.averageRunTime * (this.statistics.totalRuns - 1) + run.duration) /
        this.statistics.totalRuns
      );
    }
  }

  private handleComponentError(component: string, error: Error): void {
    this.logger.error(`${component} error:`, error);
    this.emit('pipeline.component.error', { component, error });
  }

  private async getRepositoryContext(): Promise<any> {
    try {
      const { execAsync } = require('util');
      const { promisify } = require('util');
      const exec = promisify(require('child_process').exec);
      
      const [repoUrl, branch, commit, author] = await Promise.all([
        exec('git config --get remote.origin.url').then(r => r.stdout.trim()).catch(() => 'unknown'),
        exec('git branch --show-current').then(r => r.stdout.trim()).catch(() => 'unknown'),
        exec('git rev-parse HEAD').then(r => r.stdout.trim()).catch(() => 'unknown'),
        exec('git config user.name').then(r => r.stdout.trim()).catch(() => 'unknown')
      ]);
      
      return { repository: repoUrl, branch, commit, author };
    } catch {
      return { repository: 'unknown', branch: 'unknown', commit: 'unknown', author: 'unknown' };
    }
  }

  private generateRunId(): string {
    return `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapSeverityToPriority(severity: IssueSeverity): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case IssueSeverity.CRITICAL: return 'critical';
      case IssueSeverity.HIGH: return 'high';
      case IssueSeverity.MEDIUM: return 'medium';
      default: return 'low';
    }
  }

  private getSeverityLevel(severity: IssueSeverity): number {
    switch (severity) {
      case IssueSeverity.CRITICAL: return 4;
      case IssueSeverity.HIGH: return 3;
      case IssueSeverity.MEDIUM: return 2;
      case IssueSeverity.LOW: return 1;
      default: return 0;
    }
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(filePath);
  }

  // Public API methods
  async manualFix(issueId: string): Promise<PipelineRun> {
    const issue = await this.detector.getIssue(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }
    
    return this.processIssue(issue, 'manual');
  }

  async cancelRun(runId: string): Promise<void> {
    const run = this.activeRuns.get(runId);
    if (!run) {
      throw new Error(`Run ${runId} not found or not active`);
    }
    
    run.status = PipelineStatus.CANCELLED;
    run.endTime = Date.now();
    run.duration = run.endTime - run.startTime;
    
    this.activeRuns.delete(runId);
    this.runHistory.set(runId, run);
    this.statistics.cancelledRuns++;
    
    this.emit('pipeline.cancelled', run);
  }

  getRun(runId: string): PipelineRun | undefined {
    return this.activeRuns.get(runId) || this.runHistory.get(runId);
  }

  getActiveRuns(): PipelineRun[] {
    return Array.from(this.activeRuns.values());
  }

  getPendingApprovals(): PipelineRun[] {
    return Array.from(this.pendingApprovals.values());
  }

  getRunHistory(limit = 100): PipelineRun[] {
    return Array.from(this.runHistory.values())
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  getStatistics(): PipelineStatistics {
    return { ...this.statistics };
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Auto-Fix Pipeline...');
    this.shutdownRequested = true;
    
    // Cancel all active runs
    for (const runId of this.activeRuns.keys()) {
      await this.cancelRun(runId);
    }
    
    // Shutdown components
    await Promise.all([
      this.detector.shutdown(),
      this.fixer.shutdown(),
      this.verifier.shutdown()
    ]);
    
    this.isRunning = false;
    this.emit('pipeline.shutdown');
    this.removeAllListeners();
  }

  isHealthy(): boolean {
    return this.isRunning && !this.shutdownRequested;
  }
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  detector: {} as DetectorConfig, // Will be filled from Detector defaults
  fixer: {} as FixerConfig,       // Will be filled from Fixer defaults
  verifier: {} as VerifierConfig, // Will be filled from Verifier defaults
  committer: {} as CommitterConfig, // Will be filled from Committer defaults
  
  pipeline: {
    enabled: true,
    autoMode: false,
    maxConcurrentFixes: 5,
    retryAttempts: 3,
    retryDelay: 5000,
    timeout: 300000, // 5 minutes
    
    filters: {
      severityThreshold: IssueSeverity.MEDIUM,
      issueTypes: [],
      pathPatterns: [],
      excludePatterns: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
    },
    
    approval: {
      required: true,
      autoApprove: {
        lowRisk: true,
        highConfidence: true,
        testsPassing: true
      },
      approvers: [],
      timeout: 3600000 // 1 hour
    },
    
    rollback: {
      enabled: true,
      conditions: {
        testFailures: true,
        verificationScore: 0.7,
        userReports: 3
      },
      autoRollback: false,
      gracePeriod: 1800000 // 30 minutes
    },
    
    monitoring: {
      enabled: true,
      metrics: {
        successRate: true,
        averageTime: true,
        issueTypes: true,
        fixStrategies: true
      },
      alerts: {
        failureRate: 0.3,
        responseTime: 60000,
        errorPatterns: ['timeout', 'out of memory', 'permission denied']
      }
    }
  }
};

export default AutoFixPipeline;