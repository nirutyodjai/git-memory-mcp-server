/**
 * Auto-Fix Committer
 * 
 * Handles committing verified fixes to version control and creating pull requests
 * with comprehensive documentation and rollback capabilities.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';
import { Logger } from '../3d-sco/lib/monitoring/logging';
import { Fix, FixStatus } from './Fixer';
import { VerificationResult, VerificationStatus } from './Verifier';
import { Issue } from './Detector';

// Commit and PR types
export enum CommitStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  COMMITTED = 'committed',
  PR_CREATED = 'pr_created',
  MERGED = 'merged',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back'
}

export enum CommitStrategy {
  DIRECT_COMMIT = 'direct_commit',
  PULL_REQUEST = 'pull_request',
  DRAFT_PR = 'draft_pr',
  BRANCH_ONLY = 'branch_only'
}

export interface CommitInfo {
  id: string;
  fixId: string;
  strategy: CommitStrategy;
  status: CommitStatus;
  branch: string;
  baseBranch: string;
  commitHash?: string;
  prNumber?: number;
  prUrl?: string;
  title: string;
  description: string;
  files: string[];
  author: {
    name: string;
    email: string;
  };
  timestamp: number;
  rollbackInfo?: {
    originalCommit: string;
    rollbackCommit?: string;
    rollbackReason?: string;
  };
  metadata: {
    issueId?: string;
    verificationScore: number;
    autoApproved: boolean;
    reviewers?: string[];
    labels?: string[];
    milestone?: string;
  };
}

export interface PRTemplate {
  title: string;
  description: string;
  labels: string[];
  reviewers: string[];
  assignees: string[];
  milestone?: string;
  draft: boolean;
}

export interface CommitMessage {
  type: string; // feat, fix, docs, style, refactor, test, chore
  scope?: string;
  subject: string;
  body?: string;
  footer?: string;
  breakingChange?: boolean;
}

export interface CommitterConfig {
  // General settings
  enabled: boolean;
  defaultStrategy: CommitStrategy;
  
  // Git settings
  git: {
    defaultBranch: string;
    branchPrefix: string;
    authorName: string;
    authorEmail: string;
    signCommits: boolean;
    gpgKeyId?: string;
  };
  
  // Commit settings
  commit: {
    conventionalCommits: boolean;
    includeIssueId: boolean;
    includeVerificationInfo: boolean;
    maxSubjectLength: number;
    requireDescription: boolean;
  };
  
  // PR settings
  pullRequest: {
    enabled: boolean;
    defaultReviewers: string[];
    defaultLabels: string[];
    requireReview: boolean;
    autoMerge: boolean;
    autoMergeThreshold: number; // verification score
    deleteBranchAfterMerge: boolean;
    template: PRTemplate;
  };
  
  // Rollback settings
  rollback: {
    enabled: boolean;
    autoRollbackOnFailure: boolean;
    keepRollbackBranch: boolean;
    notifyOnRollback: boolean;
  };
  
  // Security settings
  security: {
    requireApprovalForCritical: boolean;
    allowedFilePatterns: RegExp[];
    forbiddenFilePatterns: RegExp[];
    maxFilesPerCommit: number;
    maxLinesPerCommit: number;
  };
  
  // Integration settings
  integrations: {
    github?: {
      token: string;
      owner: string;
      repo: string;
      apiUrl?: string;
    };
    gitlab?: {
      token: string;
      projectId: string;
      apiUrl?: string;
    };
    bitbucket?: {
      username: string;
      appPassword: string;
      workspace: string;
      repo: string;
    };
  };
}

/**
 * Auto-Fix Committer
 * 
 * Manages the final stage of auto-fixing: committing changes and creating PRs
 */
export class Committer extends EventEmitter {
  private config: CommitterConfig;
  private logger: Logger;
  private commits: Map<string, CommitInfo> = new Map();
  private activeCommits: Map<string, Promise<CommitInfo>> = new Map();
  private statistics = {
    totalCommits: 0,
    totalPRs: 0,
    totalMerged: 0,
    totalRolledBack: 0,
    averageTimeToMerge: 0,
    successRate: 0,
    byStrategy: {} as Record<CommitStrategy, { count: number; successRate: number }>
  };

  constructor(config: CommitterConfig, logger?: Logger) {
    super();
    this.config = config;
    this.logger = logger || new Logger({ level: 'info' });
  }

  /**
   * Initialize the committer
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Auto-Fix Committer...');
    
    // Validate configuration
    await this.validateConfiguration();
    
    // Test git availability
    await this.testGitAvailability();
    
    // Test integrations
    await this.testIntegrations();
    
    this.logger.info('Auto-Fix Committer initialized successfully');
  }

  /**
   * Commit a verified fix
   */
  async commitFix(
    fix: Fix,
    verificationResult: VerificationResult,
    issue?: Issue
  ): Promise<CommitInfo> {
    if (!this.config.enabled) {
      throw new Error('Committer is disabled');
    }
    
    // Check if commit is already in progress
    if (this.activeCommits.has(fix.id)) {
      return await this.activeCommits.get(fix.id)!;
    }
    
    this.logger.info(`Starting commit process for fix: ${fix.id}`);
    
    const commitPromise = this.performCommit(fix, verificationResult, issue);
    this.activeCommits.set(fix.id, commitPromise);
    
    try {
      const commitInfo = await commitPromise;
      this.commits.set(commitInfo.id, commitInfo);
      this.updateStatistics(commitInfo);
      
      this.emit('commit_completed', commitInfo);
      return commitInfo;
      
    } finally {
      this.activeCommits.delete(fix.id);
    }
  }

  /**
   * Rollback a commit
   */
  async rollbackCommit(commitId: string, reason: string): Promise<CommitInfo> {
    const commitInfo = this.commits.get(commitId);
    if (!commitInfo) {
      throw new Error(`Commit not found: ${commitId}`);
    }
    
    if (!this.config.rollback.enabled) {
      throw new Error('Rollback is disabled');
    }
    
    this.logger.info(`Rolling back commit: ${commitId}`);
    
    try {
      // Create rollback commit
      const rollbackCommit = await this.createRollbackCommit(commitInfo, reason);
      
      // Update commit info
      commitInfo.status = CommitStatus.ROLLED_BACK;
      commitInfo.rollbackInfo = {
        originalCommit: commitInfo.commitHash!,
        rollbackCommit,
        rollbackReason: reason
      };
      
      // Close PR if exists
      if (commitInfo.prNumber && commitInfo.status !== CommitStatus.MERGED) {
        await this.closePR(commitInfo, `Rolled back due to: ${reason}`);
      }
      
      this.emit('commit_rolled_back', commitInfo);
      return commitInfo;
      
    } catch (error) {
      this.logger.error(`Rollback failed for commit ${commitId}:`, error);
      throw error;
    }
  }

  /**
   * Get commit information
   */
  getCommitInfo(commitId: string): CommitInfo | undefined {
    return this.commits.get(commitId);
  }

  /**
   * Get all commits with optional filtering
   */
  getCommits(filters?: {
    status?: CommitStatus[];
    strategy?: CommitStrategy[];
    author?: string;
    dateRange?: { from: number; to: number };
  }): CommitInfo[] {
    let commits = Array.from(this.commits.values());
    
    if (filters) {
      if (filters.status) {
        commits = commits.filter(c => filters.status!.includes(c.status));
      }
      if (filters.strategy) {
        commits = commits.filter(c => filters.strategy!.includes(c.strategy));
      }
      if (filters.author) {
        commits = commits.filter(c => c.author.name === filters.author || c.author.email === filters.author);
      }
      if (filters.dateRange) {
        commits = commits.filter(c => 
          c.timestamp >= filters.dateRange!.from && 
          c.timestamp <= filters.dateRange!.to
        );
      }
    }
    
    return commits.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get committer statistics
   */
  getStatistics(): typeof this.statistics {
    return { ...this.statistics };
  }

  /**
   * Update PR status (called by external webhook or polling)
   */
  async updatePRStatus(commitId: string, status: 'merged' | 'closed', mergeCommit?: string): Promise<void> {
    const commitInfo = this.commits.get(commitId);
    if (!commitInfo) {
      return;
    }
    
    if (status === 'merged') {
      commitInfo.status = CommitStatus.MERGED;
      if (mergeCommit) {
        commitInfo.commitHash = mergeCommit;
      }
      
      // Delete branch if configured
      if (this.config.pullRequest.deleteBranchAfterMerge) {
        await this.deleteBranch(commitInfo.branch);
      }
      
      this.emit('pr_merged', commitInfo);
    } else {
      this.emit('pr_closed', commitInfo);
    }
  }

  // Private methods

  private async performCommit(
    fix: Fix,
    verificationResult: VerificationResult,
    issue?: Issue
  ): Promise<CommitInfo> {
    const commitId = `commit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const commitInfo: CommitInfo = {
      id: commitId,
      fixId: fix.id,
      strategy: this.determineCommitStrategy(fix, verificationResult),
      status: CommitStatus.PENDING,
      branch: '',
      baseBranch: this.config.git.defaultBranch,
      title: '',
      description: '',
      files: [...new Set(fix.actions.map(a => a.file))],
      author: {
        name: this.config.git.authorName,
        email: this.config.git.authorEmail
      },
      timestamp: Date.now(),
      metadata: {
        issueId: issue?.id,
        verificationScore: verificationResult.overallScore,
        autoApproved: !verificationResult.approvalRequired
      }
    };
    
    try {
      commitInfo.status = CommitStatus.PREPARING;
      
      // Create branch
      commitInfo.branch = await this.createBranch(fix, issue);
      
      // Apply changes
      await this.applyChanges(fix);
      
      // Generate commit message
      const commitMessage = this.generateCommitMessage(fix, verificationResult, issue);
      commitInfo.title = commitMessage.subject;
      commitInfo.description = this.generateCommitDescription(fix, verificationResult, issue);
      
      // Commit changes
      commitInfo.commitHash = await this.createCommit(commitMessage);
      commitInfo.status = CommitStatus.COMMITTED;
      
      // Handle different strategies
      switch (commitInfo.strategy) {
        case CommitStrategy.DIRECT_COMMIT:
          await this.pushToMainBranch(commitInfo);
          break;
          
        case CommitStrategy.PULL_REQUEST:
        case CommitStrategy.DRAFT_PR:
          await this.pushBranch(commitInfo.branch);
          const prInfo = await this.createPullRequest(commitInfo, fix, verificationResult, issue);
          commitInfo.prNumber = prInfo.number;
          commitInfo.prUrl = prInfo.url;
          commitInfo.status = CommitStatus.PR_CREATED;
          break;
          
        case CommitStrategy.BRANCH_ONLY:
          await this.pushBranch(commitInfo.branch);
          break;
      }
      
      return commitInfo;
      
    } catch (error) {
      commitInfo.status = CommitStatus.FAILED;
      this.logger.error(`Commit failed for fix ${fix.id}:`, error);
      
      // Attempt cleanup
      try {
        await this.cleanupFailedCommit(commitInfo);
      } catch (cleanupError) {
        this.logger.error('Cleanup failed:', cleanupError);
      }
      
      throw error;
    }
  }

  private determineCommitStrategy(
    fix: Fix,
    verificationResult: VerificationResult
  ): CommitStrategy {
    // Use direct commit for low-risk, high-confidence fixes
    if (
      verificationResult.overallScore >= 0.95 &&
      !verificationResult.approvalRequired &&
      fix.estimatedImpact.riskScore < 0.2 &&
      fix.estimatedImpact.filesChanged === 1
    ) {
      return CommitStrategy.DIRECT_COMMIT;
    }
    
    // Use draft PR for experimental or low-confidence fixes
    if (
      verificationResult.overallScore < 0.7 ||
      fix.estimatedImpact.riskScore > 0.8
    ) {
      return CommitStrategy.DRAFT_PR;
    }
    
    // Default to pull request
    return this.config.defaultStrategy;
  }

  private async createBranch(fix: Fix, issue?: Issue): Promise<string> {
    const branchName = this.generateBranchName(fix, issue);
    
    // Ensure we're on the base branch
    await this.runGitCommand(['checkout', this.config.git.defaultBranch]);
    await this.runGitCommand(['pull', 'origin', this.config.git.defaultBranch]);
    
    // Create and checkout new branch
    await this.runGitCommand(['checkout', '-b', branchName]);
    
    return branchName;
  }

  private generateBranchName(fix: Fix, issue?: Issue): string {
    const prefix = this.config.git.branchPrefix;
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fixType = fix.type.toLowerCase().replace(/_/g, '-');
    
    let branchName = `${prefix}${fixType}-${timestamp}`;
    
    if (issue) {
      const issueId = issue.id.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
      branchName += `-${issueId}`;
    }
    
    // Add random suffix to ensure uniqueness
    branchName += `-${Math.random().toString(36).substr(2, 6)}`;
    
    return branchName;
  }

  private async applyChanges(fix: Fix): Promise<void> {
    for (const action of fix.actions) {
      const filePath = path.resolve(action.file);
      
      // Security check
      if (!this.isFileAllowed(action.file)) {
        throw new Error(`File not allowed for auto-commit: ${action.file}`);
      }
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Write new content
      await fs.writeFile(filePath, action.newContent, 'utf8');
      
      // Stage the file
      await this.runGitCommand(['add', action.file]);
    }
  }

  private generateCommitMessage(
    fix: Fix,
    verificationResult: VerificationResult,
    issue?: Issue
  ): CommitMessage {
    const commitMessage: CommitMessage = {
      type: this.getCommitType(fix),
      subject: this.generateCommitSubject(fix, issue),
      body: this.generateCommitBody(fix, verificationResult, issue),
      footer: this.generateCommitFooter(fix, verificationResult, issue)
    };
    
    // Add scope if available
    if (fix.actions.length === 1) {
      const file = fix.actions[0].file;
      const scope = this.extractScope(file);
      if (scope) {
        commitMessage.scope = scope;
      }
    }
    
    return commitMessage;
  }

  private getCommitType(fix: Fix): string {
    const typeMap: Record<string, string> = {
      'BUG_FIX': 'fix',
      'PERFORMANCE': 'perf',
      'SECURITY': 'fix',
      'STYLE': 'style',
      'REFACTOR': 'refactor',
      'TEST': 'test',
      'DOCUMENTATION': 'docs',
      'DEPENDENCY': 'chore'
    };
    
    return typeMap[fix.type] || 'fix';
  }

  private generateCommitSubject(fix: Fix, issue?: Issue): string {
    let subject = fix.description || 'Auto-fix applied';
    
    // Truncate if too long
    const maxLength = this.config.commit.maxSubjectLength;
    if (subject.length > maxLength) {
      subject = subject.substring(0, maxLength - 3) + '...';
    }
    
    // Add issue ID if configured
    if (this.config.commit.includeIssueId && issue) {
      subject += ` (#${issue.id})`;
    }
    
    return subject;
  }

  private generateCommitBody(
    fix: Fix,
    verificationResult: VerificationResult,
    issue?: Issue
  ): string {
    const lines: string[] = [];
    
    if (fix.description && fix.description !== fix.description) {
      lines.push(fix.description);
      lines.push('');
    }
    
    // Add fix details
    lines.push('Auto-generated fix details:');
    lines.push(`- Fix type: ${fix.type}`);
    lines.push(`- Strategy: ${fix.strategy}`);
    lines.push(`- Files changed: ${fix.actions.length}`);
    lines.push(`- Lines changed: ${fix.estimatedImpact.linesChanged}`);
    
    if (this.config.commit.includeVerificationInfo) {
      lines.push('');
      lines.push('Verification results:');
      lines.push(`- Overall score: ${(verificationResult.overallScore * 100).toFixed(1)}%`);
      lines.push(`- Tests passed: ${verificationResult.summary.passed}/${verificationResult.summary.total}`);
      
      if (verificationResult.warnings.length > 0) {
        lines.push(`- Warnings: ${verificationResult.warnings.length}`);
      }
    }
    
    if (issue) {
      lines.push('');
      lines.push(`Fixes issue: ${issue.type} - ${issue.message}`);
      if (issue.file) {
        lines.push(`Location: ${issue.file}:${issue.line || 'unknown'}`);
      }
    }
    
    return lines.join('\n');
  }

  private generateCommitFooter(
    fix: Fix,
    verificationResult: VerificationResult,
    issue?: Issue
  ): string {
    const footers: string[] = [];
    
    if (issue) {
      footers.push(`Fixes: ${issue.id}`);
    }
    
    footers.push(`Auto-fix-id: ${fix.id}`);
    footers.push(`Verification-score: ${verificationResult.overallScore.toFixed(3)}`);
    
    return footers.join('\n');
  }

  private generateCommitDescription(
    fix: Fix,
    verificationResult: VerificationResult,
    issue?: Issue
  ): string {
    const lines: string[] = [];
    
    lines.push('## Auto-Generated Fix');
    lines.push('');
    lines.push(`This fix was automatically generated and verified with a score of ${(verificationResult.overallScore * 100).toFixed(1)}%.`);
    lines.push('');
    
    if (issue) {
      lines.push('### Issue Fixed');
      lines.push(`- **Type**: ${issue.type}`);
      lines.push(`- **Severity**: ${issue.severity}`);
      lines.push(`- **Message**: ${issue.message}`);
      if (issue.file) {
        lines.push(`- **Location**: ${issue.file}:${issue.line || 'unknown'}`);
      }
      lines.push('');
    }
    
    lines.push('### Changes Made');
    for (const action of fix.actions) {
      lines.push(`- Modified \`${action.file}\` (lines ${action.startLine}-${action.endLine})`);
    }
    lines.push('');
    
    lines.push('### Verification Results');
    lines.push(`- **Overall Score**: ${(verificationResult.overallScore * 100).toFixed(1)}%`);
    lines.push(`- **Tests Passed**: ${verificationResult.summary.passed}/${verificationResult.summary.total}`);
    
    if (verificationResult.warnings.length > 0) {
      lines.push(`- **Warnings**: ${verificationResult.warnings.length}`);
      for (const warning of verificationResult.warnings.slice(0, 3)) {
        lines.push(`  - ${warning}`);
      }
      if (verificationResult.warnings.length > 3) {
        lines.push(`  - ... and ${verificationResult.warnings.length - 3} more`);
      }
    }
    
    if (verificationResult.recommendations.length > 0) {
      lines.push('');
      lines.push('### Recommendations');
      for (const rec of verificationResult.recommendations.slice(0, 3)) {
        lines.push(`- ${rec}`);
      }
    }
    
    return lines.join('\n');
  }

  private extractScope(filePath: string): string | undefined {
    const parts = filePath.split('/');
    
    // Try to extract meaningful scope from path
    if (parts.includes('src')) {
      const srcIndex = parts.indexOf('src');
      if (srcIndex < parts.length - 1) {
        return parts[srcIndex + 1];
      }
    }
    
    // Fallback to directory name
    if (parts.length > 1) {
      return parts[parts.length - 2];
    }
    
    return undefined;
  }

  private async createCommit(commitMessage: CommitMessage): Promise<string> {
    const message = this.formatCommitMessage(commitMessage);
    
    const args = ['commit', '-m', message];
    
    // Add signing if configured
    if (this.config.git.signCommits) {
      args.push('-S');
      if (this.config.git.gpgKeyId) {
        args.push(`--gpg-sign=${this.config.git.gpgKeyId}`);
      }
    }
    
    await this.runGitCommand(args);
    
    // Get commit hash
    const result = await this.runGitCommand(['rev-parse', 'HEAD']);
    return result.trim();
  }

  private formatCommitMessage(commitMessage: CommitMessage): string {
    if (!this.config.commit.conventionalCommits) {
      return commitMessage.subject;
    }
    
    let message = commitMessage.type;
    
    if (commitMessage.scope) {
      message += `(${commitMessage.scope})`;
    }
    
    if (commitMessage.breakingChange) {
      message += '!';
    }
    
    message += `: ${commitMessage.subject}`;
    
    if (commitMessage.body) {
      message += `\n\n${commitMessage.body}`;
    }
    
    if (commitMessage.footer) {
      message += `\n\n${commitMessage.footer}`;
    }
    
    return message;
  }

  private async pushToMainBranch(commitInfo: CommitInfo): Promise<void> {
    await this.runGitCommand(['push', 'origin', this.config.git.defaultBranch]);
  }

  private async pushBranch(branch: string): Promise<void> {
    await this.runGitCommand(['push', 'origin', branch]);
  }

  private async createPullRequest(
    commitInfo: CommitInfo,
    fix: Fix,
    verificationResult: VerificationResult,
    issue?: Issue
  ): Promise<{ number: number; url: string }> {
    const prData = {
      title: commitInfo.title,
      body: commitInfo.description,
      head: commitInfo.branch,
      base: commitInfo.baseBranch,
      draft: commitInfo.strategy === CommitStrategy.DRAFT_PR
    };
    
    // Use appropriate integration
    if (this.config.integrations.github) {
      return await this.createGitHubPR(prData);
    } else if (this.config.integrations.gitlab) {
      return await this.createGitLabMR(prData);
    } else if (this.config.integrations.bitbucket) {
      return await this.createBitbucketPR(prData);
    } else {
      throw new Error('No PR integration configured');
    }
  }

  private async createGitHubPR(prData: any): Promise<{ number: number; url: string }> {
    // TODO: Implement GitHub PR creation
    // This would use the GitHub API to create a pull request
    throw new Error('GitHub integration not implemented');
  }

  private async createGitLabMR(prData: any): Promise<{ number: number; url: string }> {
    // TODO: Implement GitLab MR creation
    throw new Error('GitLab integration not implemented');
  }

  private async createBitbucketPR(prData: any): Promise<{ number: number; url: string }> {
    // TODO: Implement Bitbucket PR creation
    throw new Error('Bitbucket integration not implemented');
  }

  private async createRollbackCommit(commitInfo: CommitInfo, reason: string): Promise<string> {
    if (!commitInfo.commitHash) {
      throw new Error('Cannot rollback: no commit hash available');
    }
    
    // Create rollback commit
    await this.runGitCommand(['revert', '--no-edit', commitInfo.commitHash]);
    
    // Get rollback commit hash
    const result = await this.runGitCommand(['rev-parse', 'HEAD']);
    return result.trim();
  }

  private async closePR(commitInfo: CommitInfo, reason: string): Promise<void> {
    if (!commitInfo.prNumber) {
      return;
    }
    
    // TODO: Implement PR closing for different integrations
    this.logger.info(`Would close PR #${commitInfo.prNumber}: ${reason}`);
  }

  private async deleteBranch(branch: string): Promise<void> {
    try {
      await this.runGitCommand(['branch', '-D', branch]);
      await this.runGitCommand(['push', 'origin', '--delete', branch]);
    } catch (error) {
      this.logger.warn(`Failed to delete branch ${branch}:`, error);
    }
  }

  private async cleanupFailedCommit(commitInfo: CommitInfo): Promise<void> {
    try {
      // Reset to original state
      await this.runGitCommand(['reset', '--hard', 'HEAD~1']);
      
      // Delete branch if it was created
      if (commitInfo.branch && commitInfo.branch !== this.config.git.defaultBranch) {
        await this.runGitCommand(['checkout', this.config.git.defaultBranch]);
        await this.runGitCommand(['branch', '-D', commitInfo.branch]);
      }
    } catch (error) {
      this.logger.error('Cleanup failed:', error);
    }
  }

  private isFileAllowed(filePath: string): boolean {
    // Check forbidden patterns
    for (const pattern of this.config.security.forbiddenFilePatterns) {
      if (pattern.test(filePath)) {
        return false;
      }
    }
    
    // Check allowed patterns
    if (this.config.security.allowedFilePatterns.length > 0) {
      return this.config.security.allowedFilePatterns.some(pattern => pattern.test(filePath));
    }
    
    return true;
  }

  private async runGitCommand(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('git', args, {
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Git command failed: ${args.join(' ')}\n${stderr}`));
        }
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async validateConfiguration(): Promise<void> {
    if (!this.config.git.authorName || !this.config.git.authorEmail) {
      throw new Error('Git author name and email must be configured');
    }
    
    if (this.config.pullRequest.enabled && !Object.keys(this.config.integrations).length) {
      throw new Error('PR integration must be configured when pull requests are enabled');
    }
  }

  private async testGitAvailability(): Promise<void> {
    try {
      await this.runGitCommand(['--version']);
    } catch (error) {
      throw new Error('Git is not available or not properly configured');
    }
  }

  private async testIntegrations(): Promise<void> {
    // TODO: Test configured integrations
    this.logger.debug('Integration tests passed');
  }

  private updateStatistics(commitInfo: CommitInfo): void {
    this.statistics.totalCommits++;
    
    if (commitInfo.status === CommitStatus.PR_CREATED) {
      this.statistics.totalPRs++;
    }
    
    if (commitInfo.status === CommitStatus.MERGED) {
      this.statistics.totalMerged++;
    }
    
    if (commitInfo.status === CommitStatus.ROLLED_BACK) {
      this.statistics.totalRolledBack++;
    }
    
    // Update success rate
    const successful = this.statistics.totalMerged + (this.statistics.totalCommits - this.statistics.totalPRs);
    this.statistics.successRate = successful / this.statistics.totalCommits;
    
    // Update by strategy statistics
    if (!this.statistics.byStrategy[commitInfo.strategy]) {
      this.statistics.byStrategy[commitInfo.strategy] = { count: 0, successRate: 0 };
    }
    
    const strategyStats = this.statistics.byStrategy[commitInfo.strategy];
    strategyStats.count++;
    
    // Calculate strategy success rate
    const strategyCommits = Array.from(this.commits.values())
      .filter(c => c.strategy === commitInfo.strategy);
    const strategySuccessful = strategyCommits.filter(c => 
      c.status === CommitStatus.MERGED || 
      (c.status === CommitStatus.COMMITTED && c.strategy === CommitStrategy.DIRECT_COMMIT)
    ).length;
    
    strategyStats.successRate = strategySuccessful / strategyStats.count;
  }
}

// Default configuration
export const DEFAULT_COMMITTER_CONFIG: CommitterConfig = {
  enabled: true,
  defaultStrategy: CommitStrategy.PULL_REQUEST,
  
  git: {
    defaultBranch: 'main',
    branchPrefix: 'autofix/',
    authorName: 'Auto-Fix Bot',
    authorEmail: 'autofix@example.com',
    signCommits: false
  },
  
  commit: {
    conventionalCommits: true,
    includeIssueId: true,
    includeVerificationInfo: true,
    maxSubjectLength: 72,
    requireDescription: true
  },
  
  pullRequest: {
    enabled: true,
    defaultReviewers: [],
    defaultLabels: ['auto-fix', 'bot'],
    requireReview: true,
    autoMerge: false,
    autoMergeThreshold: 0.9,
    deleteBranchAfterMerge: true,
    template: {
      title: 'Auto-fix: {title}',
      description: '{description}',
      labels: ['auto-fix'],
      reviewers: [],
      assignees: [],
      draft: false
    }
  },
  
  rollback: {
    enabled: true,
    autoRollbackOnFailure: false,
    keepRollbackBranch: true,
    notifyOnRollback: true
  },
  
  security: {
    requireApprovalForCritical: true,
    allowedFilePatterns: [
      /\.(js|ts|jsx|tsx|py|java|go|rs|cpp|c|h)$/,
      /\.(json|yaml|yml|toml|ini)$/,
      /\.(md|txt|rst)$/
    ],
    forbiddenFilePatterns: [
      /\.env$/,
      /\.key$/,
      /\.pem$/,
      /\.p12$/,
      /password/i,
      /secret/i
    ],
    maxFilesPerCommit: 10,
    maxLinesPerCommit: 500
  },
  
  integrations: {}
};

export default Committer;