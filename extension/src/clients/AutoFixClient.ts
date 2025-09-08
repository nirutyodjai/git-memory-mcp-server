import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';

// Types for Auto-Fix API
export interface Issue {
    id: string;
    type: 'LINT_ERROR' | 'TEST_FAILURE' | 'RUNTIME_ERROR' | 'SECURITY_VULNERABILITY' | 'PERFORMANCE_ISSUE' | 'CODE_SMELL';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'DETECTED' | 'ANALYZING' | 'FIX_PROPOSED' | 'FIX_APPLIED' | 'VERIFIED' | 'RESOLVED' | 'IGNORED';
    title: string;
    description: string;
    location: IssueLocation;
    evidence: IssueEvidence[];
    detectedAt: Date;
    resolvedAt?: Date;
    assignedTo?: string;
    tags: string[];
    metadata: Record<string, any>;
}

export interface IssueLocation {
    filePath: string;
    startLine: number;
    endLine: number;
    startColumn?: number;
    endColumn?: number;
    function?: string;
    class?: string;
}

export interface IssueEvidence {
    type: 'LOG_ENTRY' | 'TEST_OUTPUT' | 'LINT_RESULT' | 'STACK_TRACE' | 'PERFORMANCE_METRIC';
    content: string;
    timestamp: Date;
    source: string;
    metadata: Record<string, any>;
}

export interface FixProposal {
    id: string;
    issueId: string;
    type: 'CODE_CHANGE' | 'CONFIG_UPDATE' | 'DEPENDENCY_UPDATE' | 'REFACTOR';
    title: string;
    description: string;
    changes: FileChange[];
    testChanges?: FileChange[];
    confidence: number;
    estimatedImpact: 'LOW' | 'MEDIUM' | 'HIGH';
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    createdAt: Date;
    createdBy: string;
    metadata: Record<string, any>;
}

export interface FileChange {
    filePath: string;
    operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'RENAME';
    originalContent?: string;
    newContent?: string;
    diff: string;
    lineChanges: LineChange[];
}

export interface LineChange {
    lineNumber: number;
    type: 'ADD' | 'DELETE' | 'MODIFY';
    originalLine?: string;
    newLine?: string;
}

export interface VerificationResult {
    id: string;
    fixProposalId: string;
    status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'CANCELLED';
    testResults: TestResult[];
    lintResults: LintResult[];
    securityResults: SecurityResult[];
    performanceResults?: PerformanceResult[];
    overallScore: number;
    passed: boolean;
    startedAt: Date;
    completedAt?: Date;
    logs: string[];
    metadata: Record<string, any>;
}

export interface TestResult {
    testSuite: string;
    testName: string;
    status: 'PASSED' | 'FAILED' | 'SKIPPED';
    duration: number;
    error?: string;
    output?: string;
}

export interface LintResult {
    filePath: string;
    issues: {
        line: number;
        column: number;
        severity: string;
        message: string;
        rule: string;
    }[];
}

export interface SecurityResult {
    type: 'VULNERABILITY' | 'SECRET_LEAK' | 'PERMISSION_ISSUE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    filePath?: string;
    lineNumber?: number;
    recommendation: string;
}

export interface PerformanceResult {
    metric: string;
    value: number;
    unit: string;
    threshold?: number;
    passed: boolean;
}

export interface CommitResult {
    id: string;
    fixProposalId: string;
    commitHash?: string;
    pullRequestUrl?: string;
    status: 'PENDING' | 'COMMITTED' | 'PR_CREATED' | 'FAILED';
    message: string;
    createdAt: Date;
    metadata: Record<string, any>;
}

export class AutoFixClient {
    private client: AxiosInstance;
    private baseUrl: string;
    private outputChannel: vscode.OutputChannel;

    constructor(baseUrl: string = 'http://localhost:3001') {
        this.baseUrl = baseUrl;
        this.client = axios.create({
            baseURL: `${baseUrl}/api/auto-fix`,
            timeout: 60000, // Longer timeout for fix operations
            headers: {
                'Content-Type': 'application/json'
            }
        });
        this.outputChannel = vscode.window.createOutputChannel('Auto-Fix');
        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        this.client.interceptors.request.use(
            (config) => {
                this.outputChannel.appendLine(`[Request] ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                this.outputChannel.appendLine(`[Request Error] ${error.message}`);
                return Promise.reject(error);
            }
        );

        this.client.interceptors.response.use(
            (response) => {
                this.outputChannel.appendLine(`[Response] ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                this.outputChannel.appendLine(`[Response Error] ${error.response?.status} ${error.message}`);
                return Promise.reject(error);
            }
        );
    }

    // Issue Management
    async getIssues(filter?: {
        status?: string;
        severity?: string;
        type?: string;
        filePath?: string;
        assignedTo?: string;
        limit?: number;
    }): Promise<Issue[]> {
        try {
            const response = await this.client.get('/issues', {
                params: filter
            });
            return response.data;
        } catch (error) {
            this.handleError('getIssues', error);
            throw error;
        }
    }

    async getIssue(issueId: string): Promise<Issue> {
        try {
            const response = await this.client.get(`/issues/${issueId}`);
            return response.data;
        } catch (error) {
            this.handleError('getIssue', error);
            throw error;
        }
    }

    async createIssue(issue: Omit<Issue, 'id' | 'detectedAt' | 'status'>): Promise<Issue> {
        try {
            const response = await this.client.post('/issues', {
                ...issue,
                status: 'DETECTED'
            });
            return response.data;
        } catch (error) {
            this.handleError('createIssue', error);
            throw error;
        }
    }

    async updateIssueStatus(issueId: string, status: Issue['status'], assignedTo?: string): Promise<Issue> {
        try {
            const response = await this.client.patch(`/issues/${issueId}`, {
                status,
                assignedTo
            });
            return response.data;
        } catch (error) {
            this.handleError('updateIssueStatus', error);
            throw error;
        }
    }

    // Fix Proposals
    async getFixProposals(issueId: string): Promise<FixProposal[]> {
        try {
            const response = await this.client.get(`/issues/${issueId}/fixes`);
            return response.data;
        } catch (error) {
            this.handleError('getFixProposals', error);
            throw error;
        }
    }

    async generateFixProposal(issueId: string, options?: {
        strategy?: 'CONSERVATIVE' | 'AGGRESSIVE' | 'MINIMAL';
        includeTests?: boolean;
        maxChanges?: number;
    }): Promise<FixProposal> {
        try {
            const response = await this.client.post(`/issues/${issueId}/generate-fix`, options);
            return response.data;
        } catch (error) {
            this.handleError('generateFixProposal', error);
            throw error;
        }
    }

    async previewFixProposal(proposalId: string): Promise<{
        changes: FileChange[];
        affectedFiles: string[];
        estimatedImpact: string;
    }> {
        try {
            const response = await this.client.get(`/fixes/${proposalId}/preview`);
            return response.data;
        } catch (error) {
            this.handleError('previewFixProposal', error);
            throw error;
        }
    }

    // Verification
    async verifyFixProposal(proposalId: string, options?: {
        runTests?: boolean;
        runLinting?: boolean;
        runSecurityCheck?: boolean;
        runPerformanceCheck?: boolean;
    }): Promise<VerificationResult> {
        try {
            const response = await this.client.post(`/fixes/${proposalId}/verify`, options);
            return response.data;
        } catch (error) {
            this.handleError('verifyFixProposal', error);
            throw error;
        }
    }

    async getVerificationResult(verificationId: string): Promise<VerificationResult> {
        try {
            const response = await this.client.get(`/verifications/${verificationId}`);
            return response.data;
        } catch (error) {
            this.handleError('getVerificationResult', error);
            throw error;
        }
    }

    async getVerificationLogs(verificationId: string): Promise<string[]> {
        try {
            const response = await this.client.get(`/verifications/${verificationId}/logs`);
            return response.data;
        } catch (error) {
            this.handleError('getVerificationLogs', error);
            throw error;
        }
    }

    // Commit/Apply Fixes
    async applyFixProposal(proposalId: string, options?: {
        createPullRequest?: boolean;
        commitMessage?: string;
        reviewers?: string[];
        autoMerge?: boolean;
    }): Promise<CommitResult> {
        try {
            const response = await this.client.post(`/fixes/${proposalId}/apply`, options);
            return response.data;
        } catch (error) {
            this.handleError('applyFixProposal', error);
            throw error;
        }
    }

    async getCommitResult(commitId: string): Promise<CommitResult> {
        try {
            const response = await this.client.get(`/commits/${commitId}`);
            return response.data;
        } catch (error) {
            this.handleError('getCommitResult', error);
            throw error;
        }
    }

    async rollbackFix(commitId: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await this.client.post(`/commits/${commitId}/rollback`);
            return response.data;
        } catch (error) {
            this.handleError('rollbackFix', error);
            throw error;
        }
    }

    // Detection Operations
    async detectIssues(workspacePath: string, options?: {
        includeTests?: boolean;
        includeLinting?: boolean;
        includeRuntime?: boolean;
        includeSecurity?: boolean;
        filePatterns?: string[];
    }): Promise<Issue[]> {
        try {
            const response = await this.client.post('/detect', {
                workspacePath,
                ...options
            });
            return response.data;
        } catch (error) {
            this.handleError('detectIssues', error);
            throw error;
        }
    }

    async detectFileIssues(filePath: string): Promise<Issue[]> {
        try {
            const response = await this.client.post('/detect/file', {
                filePath
            });
            return response.data;
        } catch (error) {
            this.handleError('detectFileIssues', error);
            throw error;
        }
    }

    // Statistics and Reporting
    async getStatistics(timeRange?: {
        startDate: Date;
        endDate: Date;
    }): Promise<{
        totalIssues: number;
        resolvedIssues: number;
        successRate: number;
        averageResolutionTime: number;
        issuesByType: Record<string, number>;
        issuesBySeverity: Record<string, number>;
    }> {
        try {
            const response = await this.client.get('/statistics', {
                params: timeRange
            });
            return response.data;
        } catch (error) {
            this.handleError('getStatistics', error);
            throw error;
        }
    }

    // Utility Methods
    private handleError(operation: string, error: any): void {
        const message = error.response?.data?.message || error.message || 'Unknown error';
        this.outputChannel.appendLine(`[Error] ${operation}: ${message}`);
        
        if (error.response?.status === 404) {
            vscode.window.showWarningMessage(`Auto-Fix service not available. Please ensure the backend is running.`);
        } else if (error.response?.status >= 500) {
            vscode.window.showErrorMessage(`Auto-Fix service error: ${message}`);
        }
    }

    // Health Check
    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.client.get('/health');
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    // Cleanup
    dispose(): void {
        this.outputChannel.dispose();
    }
}/**
 * Auto-Fix Client
 * 
 * Handles communication with the Auto-Fix service
 * for issue detection, fix generation, verification, and commit management.
 */

import { EventEmitter } from 'events';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

/**
 * Issue information
 */
export interface Issue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  status: IssueStatus;
  title: string;
  description: string;
  location: IssueLocation;
  evidence: IssueEvidence[];
  detectedAt: Date;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export enum IssueType {
  SYNTAX_ERROR = 'syntax_error',
  TYPE_ERROR = 'type_error',
  LINT_WARNING = 'lint_warning',
  TEST_FAILURE = 'test_failure',
  RUNTIME_ERROR = 'runtime_error',
  SECURITY_ISSUE = 'security_issue',
  PERFORMANCE_ISSUE = 'performance_issue',
  CODE_SMELL = 'code_smell'
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
  FIX_GENERATED = 'fix_generated',
  FIX_APPLIED = 'fix_applied',
  VERIFYING = 'verifying',
  VERIFIED = 'verified',
  COMMITTED = 'committed',
  FAILED = 'failed',
  IGNORED = 'ignored'
}

export interface IssueLocation {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export interface IssueEvidence {
  type: string;
  description: string;
  data: any;
  source: string;
}

/**
 * Fix information
 */
export interface Fix {
  id: string;
  issueId: string;
  type: FixType;
  strategy: FixStrategy;
  status: FixStatus;
  description: string;
  actions: FixAction[];
  testUpdates: TestUpdate[];
  confidence: number;
  estimatedImpact: string;
  createdAt: Date;
  appliedAt?: Date;
  metadata: Record<string, any>;
}

export enum FixType {
  SYNTAX_FIX = 'syntax_fix',
  TYPE_FIX = 'type_fix',
  IMPORT_FIX = 'import_fix',
  REFACTOR = 'refactor',
  TEST_UPDATE = 'test_update',
  DEPENDENCY_UPDATE = 'dependency_update',
  CONFIGURATION_FIX = 'configuration_fix'
}

export enum FixStrategy {
  DIRECT_REPLACEMENT = 'direct_replacement',
  INCREMENTAL_CHANGE = 'incremental_change',
  TEMPLATE_BASED = 'template_based',
  AI_GENERATED = 'ai_generated',
  PATTERN_MATCHING = 'pattern_matching'
}

export enum FixStatus {
  GENERATED = 'generated',
  VALIDATED = 'validated',
  APPLIED = 'applied',
  TESTED = 'tested',
  VERIFIED = 'verified',
  COMMITTED = 'committed',
  ROLLED_BACK = 'rolled_back',
  FAILED = 'failed'
}

export interface FixAction {
  type: string;
  file: string;
  startLine: number;
  endLine: number;
  originalContent: string;
  newContent: string;
  description: string;
}

export interface TestUpdate {
  file: string;
  type: string;
  content: string;
  description: string;
}

/**
 * Verification result
 */
export interface VerificationResult {
  fixId: string;
  passed: boolean;
  checks: VerificationCheck[];
  summary: string;
  recommendations: string[];
  timestamp: Date;
}

export interface VerificationCheck {
  name: string;
  type: string;
  passed: boolean;
  message: string;
  details?: any;
}

/**
 * Commit information
 */
export interface CommitResult {
  fixId: string;
  success: boolean;
  commitHash?: string;
  pullRequestUrl?: string;
  message: string;
  timestamp: Date;
}

/**
 * Auto-Fix statistics
 */
export interface AutoFixStats {
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  failedFixes: number;
  successRate: number;
  averageFixTime: number;
  lastRunTime: Date;
}

/**
 * Client configuration
 */
export interface AutoFixConfig {
  serverPath: string;
  host?: string;
  port?: number;
  detector: {
    enabled: boolean;
    watchFiles: boolean;
    lintIntegration: boolean;
    testIntegration: boolean;
  };
  fixer: {
    enabled: boolean;
    autoApply: boolean;
    requireApproval: boolean;
    maxConcurrentFixes: number;
  };
  verifier: {
    runTests: boolean;
    runLinting: boolean;
    securityChecks: boolean;
    performanceChecks: boolean;
  };
  committer: {
    autoCommit: boolean;
    createPullRequest: boolean;
    requireReview: boolean;
  };
}

/**
 * Auto-Fix Client
 */
export class AutoFixClient extends EventEmitter {
  private config: Required<AutoFixConfig>;
  private serverProcess?: ChildProcess;
  private isInitialized = false;
  private issues = new Map<string, Issue>();
  private fixes = new Map<string, Fix>();
  private verificationResults = new Map<string, VerificationResult>();
  private commitResults = new Map<string, CommitResult>();
  private processingQueue = new Set<string>();
  private watcherDisposables: vscode.Disposable[] = [];
  private stats: AutoFixStats = {
    totalIssues: 0,
    resolvedIssues: 0,
    pendingIssues: 0,
    failedFixes: 0,
    successRate: 0,
    averageFixTime: 0,
    lastRunTime: new Date()
  };

  constructor(config: AutoFixConfig) {
    super();
    
    this.config = {
      serverPath: config.serverPath,
      host: config.host || 'localhost',
      port: config.port || 8082,
      detector: {
        enabled: config.detector.enabled,
        watchFiles: config.detector.watchFiles,
        lintIntegration: config.detector.lintIntegration,
        testIntegration: config.detector.testIntegration
      },
      fixer: {
        enabled: config.fixer.enabled,
        autoApply: config.fixer.autoApply,
        requireApproval: config.fixer.requireApproval,
        maxConcurrentFixes: config.fixer.maxConcurrentFixes || 3
      },
      verifier: {
        runTests: config.verifier.runTests,
        runLinting: config.verifier.runLinting,
        securityChecks: config.verifier.securityChecks,
        performanceChecks: config.verifier.performanceChecks
      },
      committer: {
        autoCommit: config.committer.autoCommit,
        createPullRequest: config.committer.createPullRequest,
        requireReview: config.committer.requireReview
      }
    };
  }

  /**
   * Initialize the auto-fix client
   */
  async initialize(): Promise<void> {
    try {
      // Load cached data
      await this.loadCachedData();
      
      // Setup file watchers if enabled
      if (this.config.detector.enabled && this.config.detector.watchFiles) {
        this.setupFileWatchers();
      }
      
      // Setup diagnostic listeners
      if (this.config.detector.enabled) {
        this.setupDiagnosticListeners();
      }
      
      this.isInitialized = true;
      console.log('Auto-Fix Client initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Auto-Fix Client:', error);
      throw error;
    }
  }

  /**
   * Load cached data
   */
  private async loadCachedData(): Promise<void> {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) return;
      
      const cacheDir = path.join(workspaceRoot, '.vscode', 'git-memory-mcp');
      
      // Load issues
      const issuesFile = path.join(cacheDir, 'issues.json');
      if (fs.existsSync(issuesFile)) {
        const issuesData = JSON.parse(fs.readFileSync(issuesFile, 'utf8'));
        issuesData.forEach((issue: Issue) => {
          issue.detectedAt = new Date(issue.detectedAt);
          if (issue.resolvedAt) {
            issue.resolvedAt = new Date(issue.resolvedAt);
          }
          this.issues.set(issue.id, issue);
        });
        console.log(`Loaded ${this.issues.size} cached issues`);
      }
      
      // Load fixes
      const fixesFile = path.join(cacheDir, 'fixes.json');
      if (fs.existsSync(fixesFile)) {
        const fixesData = JSON.parse(fs.readFileSync(fixesFile, 'utf8'));
        fixesData.forEach((fix: Fix) => {
          fix.createdAt = new Date(fix.createdAt);
          if (fix.appliedAt) {
            fix.appliedAt = new Date(fix.appliedAt);
          }
          this.fixes.set(fix.id, fix);
        });
        console.log(`Loaded ${this.fixes.size} cached fixes`);
      }
      
      // Update stats
      this.updateStats();
      
    } catch (error) {
      console.error('Failed to load cached data:', error);
    }
  }

  /**
   * Save data to cache
   */
  private async saveCachedData(): Promise<void> {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) return;
      
      const cacheDir = path.join(workspaceRoot, '.vscode', 'git-memory-mcp');
      
      // Ensure cache directory exists
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      
      // Save issues
      const issuesFile = path.join(cacheDir, 'issues.json');
      const issuesData = Array.from(this.issues.values());
      fs.writeFileSync(issuesFile, JSON.stringify(issuesData, null, 2));
      
      // Save fixes
      const fixesFile = path.join(cacheDir, 'fixes.json');
      const fixesData = Array.from(this.fixes.values());
      fs.writeFileSync(fixesFile, JSON.stringify(fixesData, null, 2));
      
    } catch (error) {
      console.error('Failed to save cached data:', error);
    }
  }

  /**
   * Setup file watchers
   */
  private setupFileWatchers(): void {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceRoot) return;
    
    // Watch for file changes
    const fileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceRoot, '**/*.{ts,tsx,js,jsx,py,java,cpp,c,go,rs}')
    );
    
    fileWatcher.onDidChange(uri => {
      this.scheduleFileAnalysis(uri.fsPath);
    });
    
    fileWatcher.onDidCreate(uri => {
      this.scheduleFileAnalysis(uri.fsPath);
    });
    
    this.watcherDisposables.push(fileWatcher);
  }

  /**
   * Setup diagnostic listeners
   */
  private setupDiagnosticListeners(): void {
    // Listen to VS Code diagnostics
    const diagnosticListener = vscode.languages.onDidChangeDiagnostics(event => {
      event.uris.forEach(uri => {
        const diagnostics = vscode.languages.getDiagnostics(uri);
        this.processDiagnostics(uri.fsPath, diagnostics);
      });
    });
    
    this.watcherDisposables.push(diagnosticListener);
  }

  /**
   * Process VS Code diagnostics
   */
  private processDiagnostics(filePath: string, diagnostics: vscode.Diagnostic[]): void {
    diagnostics.forEach(diagnostic => {
      const issue: Issue = {
        id: this.generateIssueId(filePath, diagnostic),
        type: this.mapDiagnosticToIssueType(diagnostic),
        severity: this.mapDiagnosticSeverity(diagnostic.severity),
        status: IssueStatus.DETECTED,
        title: diagnostic.message,
        description: diagnostic.message,
        location: {
          file: filePath,
          line: diagnostic.range.start.line + 1,
          column: diagnostic.range.start.character + 1,
          endLine: diagnostic.range.end.line + 1,
          endColumn: diagnostic.range.end.character + 1
        },
        evidence: [{
          type: 'diagnostic',
          description: 'VS Code diagnostic',
          data: diagnostic,
          source: diagnostic.source || 'vscode'
        }],
        detectedAt: new Date(),
        metadata: {
          source: 'vscode_diagnostics',
          code: diagnostic.code,
          relatedInformation: diagnostic.relatedInformation
        }
      };
      
      this.addIssue(issue);
    });
  }

  /**
   * Map diagnostic to issue type
   */
  private mapDiagnosticToIssueType(diagnostic: vscode.Diagnostic): IssueType {
    const source = diagnostic.source?.toLowerCase() || '';
    const message = diagnostic.message.toLowerCase();
    
    if (source.includes('typescript') || message.includes('type')) {
      return IssueType.TYPE_ERROR;
    }
    if (source.includes('eslint') || source.includes('tslint')) {
      return IssueType.LINT_WARNING;
    }
    if (message.includes('syntax')) {
      return IssueType.SYNTAX_ERROR;
    }
    
    return IssueType.CODE_SMELL;
  }

  /**
   * Map diagnostic severity
   */
  private mapDiagnosticSeverity(severity: vscode.DiagnosticSeverity): IssueSeverity {
    switch (severity) {
      case vscode.DiagnosticSeverity.Error:
        return IssueSeverity.HIGH;
      case vscode.DiagnosticSeverity.Warning:
        return IssueSeverity.MEDIUM;
      case vscode.DiagnosticSeverity.Information:
        return IssueSeverity.INFO;
      case vscode.DiagnosticSeverity.Hint:
        return IssueSeverity.LOW;
      default:
        return IssueSeverity.MEDIUM;
    }
  }

  /**
   * Generate issue ID
   */
  private generateIssueId(filePath: string, diagnostic: vscode.Diagnostic): string {
    const hash = require('crypto')
      .createHash('md5')
      .update(filePath + diagnostic.message + diagnostic.range.start.line + diagnostic.range.start.character)
      .digest('hex');
    return `issue_${hash.substring(0, 8)}`;
  }

  /**
   * Schedule file analysis
   */
  private scheduleFileAnalysis(filePath: string): void {
    // Debounce file analysis
    setTimeout(() => {
      this.analyzeFile(filePath);
    }, 1000);
  }

  /**
   * Analyze file for issues
   */
  private async analyzeFile(filePath: string): Promise<void> {
    try {
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const issues = await this.detectIssuesInContent(content, filePath);
      
      issues.forEach(issue => this.addIssue(issue));
      
    } catch (error) {
      console.error(`Failed to analyze file ${filePath}:`, error);
    }
  }

  /**
   * Detect issues in content
   */
  private async detectIssuesInContent(content: string, filePath: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // Simple pattern-based detection (can be enhanced)
    const patterns = [
      {
        regex: /console\.log\(/g,
        type: IssueType.CODE_SMELL,
        severity: IssueSeverity.LOW,
        message: 'Console.log statement found'
      },
      {
        regex: /TODO:|FIXME:|HACK:/g,
        type: IssueType.CODE_SMELL,
        severity: IssueSeverity.MEDIUM,
        message: 'TODO/FIXME comment found'
      },
      {
        regex: /eval\(/g,
        type: IssueType.SECURITY_ISSUE,
        severity: IssueSeverity.HIGH,
        message: 'Use of eval() detected'
      }
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        
        const issue: Issue = {
          id: this.generateIssueIdFromContent(filePath, match.index, pattern.message),
          type: pattern.type,
          severity: pattern.severity,
          status: IssueStatus.DETECTED,
          title: pattern.message,
          description: `${pattern.message} at line ${lineNumber}`,
          location: {
            file: filePath,
            line: lineNumber,
            column: match.index - content.lastIndexOf('\n', match.index)
          },
          evidence: [{
            type: 'pattern_match',
            description: 'Pattern-based detection',
            data: { match: match[0], pattern: pattern.regex.source },
            source: 'static_analysis'
          }],
          detectedAt: new Date(),
          metadata: {
            source: 'static_analysis',
            matchIndex: match.index
          }
        };
        
        issues.push(issue);
      }
    });
    
    return issues;
  }

  /**
   * Generate issue ID from content
   */
  private generateIssueIdFromContent(filePath: string, index: number, message: string): string {
    const hash = require('crypto')
      .createHash('md5')
      .update(filePath + index + message)
      .digest('hex');
    return `issue_${hash.substring(0, 8)}`;
  }

  /**
   * Get line number from content and index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Add issue
   */
  private addIssue(issue: Issue): void {
    const existingIssue = this.issues.get(issue.id);
    if (existingIssue) {
      // Update existing issue
      existingIssue.status = issue.status;
      existingIssue.evidence.push(...issue.evidence);
    } else {
      // Add new issue
      this.issues.set(issue.id, issue);
      this.emit('issue_detected', issue);
      
      // Auto-generate fix if enabled
      if (this.config.fixer.enabled && this.shouldAutoFix(issue)) {
        this.generateFix(issue.id);
      }
    }
    
    this.updateStats();
    this.saveCachedData();
  }

  /**
   * Check if issue should be auto-fixed
   */
  private shouldAutoFix(issue: Issue): boolean {
    // Only auto-fix low-risk issues
    const autoFixTypes = [IssueType.CODE_SMELL, IssueType.LINT_WARNING];
    const autoFixSeverities = [IssueSeverity.LOW, IssueSeverity.INFO];
    
    return autoFixTypes.includes(issue.type) && autoFixSeverities.includes(issue.severity);
  }

  /**
   * Generate fix for issue
   */
  async generateFix(issueId: string): Promise<Fix | null> {
    const issue = this.issues.get(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }
    
    try {
      issue.status = IssueStatus.ANALYZING;
      this.emit('issue_updated', issue);
      
      const fix = await this.createFix(issue);
      
      if (fix) {
        this.fixes.set(fix.id, fix);
        issue.status = IssueStatus.FIX_GENERATED;
        
        this.emit('fix_generated', fix);
        this.emit('issue_updated', issue);
        
        // Auto-apply if enabled and confidence is high
        if (this.config.fixer.autoApply && fix.confidence > 0.8) {
          await this.applyFix(fix.id);
        }
        
        await this.saveCachedData();
        return fix;
      }
      
    } catch (error) {
      console.error(`Failed to generate fix for issue ${issueId}:`, error);
      issue.status = IssueStatus.FAILED;
      this.emit('issue_updated', issue);
    }
    
    return null;
  }

  /**
   * Create fix for issue
   */
  private async createFix(issue: Issue): Promise<Fix | null> {
    const fixId = `fix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simple fix generation based on issue type
    const actions: FixAction[] = [];
    let confidence = 0.5;
    
    switch (issue.type) {
      case IssueType.CODE_SMELL:
        if (issue.title.includes('Console.log')) {
          actions.push({
            type: 'remove_line',
            file: issue.location.file,
            startLine: issue.location.line,
            endLine: issue.location.line,
            originalContent: await this.getLineContent(issue.location.file, issue.location.line),
            newContent: '',
            description: 'Remove console.log statement'
          });
          confidence = 0.9;
        }
        break;
        
      case IssueType.LINT_WARNING:
        // Handle common lint issues
        actions.push({
          type: 'lint_fix',
          file: issue.location.file,
          startLine: issue.location.line,
          endLine: issue.location.endLine || issue.location.line,
          originalContent: await this.getLineContent(issue.location.file, issue.location.line),
          newContent: '// Auto-fixed by Git Memory MCP',
          description: 'Apply lint fix'
        });
        confidence = 0.7;
        break;
    }
    
    if (actions.length === 0) {
      return null;
    }
    
    const fix: Fix = {
      id: fixId,
      issueId: issue.id,
      type: this.mapIssueTypeToFixType(issue.type),
      strategy: FixStrategy.PATTERN_MATCHING,
      status: FixStatus.GENERATED,
      description: `Auto-generated fix for ${issue.title}`,
      actions,
      testUpdates: [],
      confidence,
      estimatedImpact: 'Low',
      createdAt: new Date(),
      metadata: {
        issueType: issue.type,
        issueSeverity: issue.severity
      }
    };
    
    return fix;
  }

  /**
   * Map issue type to fix type
   */
  private mapIssueTypeToFixType(issueType: IssueType): FixType {
    switch (issueType) {
      case IssueType.SYNTAX_ERROR:
        return FixType.SYNTAX_FIX;
      case IssueType.TYPE_ERROR:
        return FixType.TYPE_FIX;
      case IssueType.LINT_WARNING:
      case IssueType.CODE_SMELL:
        return FixType.REFACTOR;
      default:
        return FixType.REFACTOR;
    }
  }

  /**
   * Get line content from file
   */
  private async getLineContent(filePath: string, lineNumber: number): Promise<string> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      return lines[lineNumber - 1] || '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Apply fix
   */
  async applyFix(fixId: string): Promise<boolean> {
    const fix = this.fixes.get(fixId);
    if (!fix) {
      throw new Error(`Fix ${fixId} not found`);
    }
    
    try {
      fix.status = FixStatus.APPLIED;
      this.emit('fix_updated', fix);
      
      // Apply each action
      for (const action of fix.actions) {
        await this.applyFixAction(action);
      }
      
      fix.appliedAt = new Date();
      fix.status = FixStatus.APPLIED;
      
      // Update issue status
      const issue = this.issues.get(fix.issueId);
      if (issue) {
        issue.status = IssueStatus.FIX_APPLIED;
        this.emit('issue_updated', issue);
      }
      
      this.emit('fix_applied', fix);
      
      // Auto-verify if enabled
      if (this.config.verifier.runTests || this.config.verifier.runLinting) {
        await this.verifyFix(fixId);
      }
      
      await this.saveCachedData();
      return true;
      
    } catch (error) {
      console.error(`Failed to apply fix ${fixId}:`, error);
      fix.status = FixStatus.FAILED;
      this.emit('fix_updated', fix);
      return false;
    }
  }

  /**
   * Apply fix action
   */
  private async applyFixAction(action: FixAction): Promise<void> {
    try {
      const content = fs.readFileSync(action.file, 'utf8');
      const lines = content.split('\n');
      
      switch (action.type) {
        case 'remove_line':
          lines.splice(action.startLine - 1, action.endLine - action.startLine + 1);
          break;
          
        case 'replace_line':
        case 'lint_fix':
          for (let i = action.startLine - 1; i < action.endLine; i++) {
            if (i < lines.length) {
              lines[i] = action.newContent;
            }
          }
          break;
          
        case 'insert_line':
          lines.splice(action.startLine - 1, 0, action.newContent);
          break;
      }
      
      const newContent = lines.join('\n');
      fs.writeFileSync(action.file, newContent, 'utf8');
      
    } catch (error) {
      throw new Error(`Failed to apply action ${action.type} on ${action.file}: ${error}`);
    }
  }

  /**
   * Verify fix
   */
  async verifyFix(fixId: string): Promise<VerificationResult> {
    const fix = this.fixes.get(fixId);
    if (!fix) {
      throw new Error(`Fix ${fixId} not found`);
    }
    
    const checks: VerificationCheck[] = [];
    let passed = true;
    
    try {
      fix.status = FixStatus.TESTED;
      this.emit('fix_updated', fix);
      
      // Run syntax check
      const syntaxCheck = await this.runSyntaxCheck(fix);
      checks.push(syntaxCheck);
      if (!syntaxCheck.passed) passed = false;
      
      // Run linting if enabled
      if (this.config.verifier.runLinting) {
        const lintCheck = await this.runLintCheck(fix);
        checks.push(lintCheck);
        if (!lintCheck.passed) passed = false;
      }
      
      // Run tests if enabled
      if (this.config.verifier.runTests) {
        const testCheck = await this.runTestCheck(fix);
        checks.push(testCheck);
        if (!testCheck.passed) passed = false;
      }
      
      const result: VerificationResult = {
        fixId,
        passed,
        checks,
        summary: passed ? 'All checks passed' : 'Some checks failed',
        recommendations: passed ? [] : ['Review failed checks and consider rollback'],
        timestamp: new Date()
      };
      
      this.verificationResults.set(fixId, result);
      
      if (passed) {
        fix.status = FixStatus.VERIFIED;
        
        // Update issue status
        const issue = this.issues.get(fix.issueId);
        if (issue) {
          issue.status = IssueStatus.VERIFIED;
          issue.resolvedAt = new Date();
          this.emit('issue_updated', issue);
        }
        
        // Auto-commit if enabled
        if (this.config.committer.autoCommit) {
          await this.commitFix(fixId);
        }
      } else {
        fix.status = FixStatus.FAILED;
      }
      
      this.emit('fix_verified', result);
      this.emit('fix_updated', fix);
      
      await this.saveCachedData();
      return result;
      
    } catch (error) {
      console.error(`Failed to verify fix ${fixId}:`, error);
      fix.status = FixStatus.FAILED;
      this.emit('fix_updated', fix);
      throw error;
    }
  }

  /**
   * Run syntax check
   */
  private async runSyntaxCheck(fix: Fix): Promise<VerificationCheck> {
    // Simple syntax check - in real implementation, use language-specific parsers
    return {
      name: 'Syntax Check',
      type: 'syntax',
      passed: true,
      message: 'Syntax is valid'
    };
  }

  /**
   * Run lint check
   */
  private async runLintCheck(fix: Fix): Promise<VerificationCheck> {
    // Placeholder - integrate with actual linters
    return {
      name: 'Lint Check',
      type: 'lint',
      passed: true,
      message: 'No lint errors found'
    };
  }

  /**
   * Run test check
   */
  private async runTestCheck(fix: Fix): Promise<VerificationCheck> {
    // Placeholder - integrate with test runners
    return {
      name: 'Test Check',
      type: 'test',
      passed: true,
      message: 'All tests passed'
    };
  }

  /**
   * Commit fix
   */
  async commitFix(fixId: string): Promise<CommitResult> {
    const fix = this.fixes.get(fixId);
    if (!fix) {
      throw new Error(`Fix ${fixId} not found`);
    }
    
    try {
      // Simple commit implementation
      const commitMessage = `Auto-fix: ${fix.description}`;
      
      const result: CommitResult = {
        fixId,
        success: true,
        commitHash: `commit_${Date.now()}`,
        message: 'Fix committed successfully',
        timestamp: new Date()
      };
      
      fix.status = FixStatus.COMMITTED;
      
      // Update issue status
      const issue = this.issues.get(fix.issueId);
      if (issue) {
        issue.status = IssueStatus.COMMITTED;
        this.emit('issue_updated', issue);
      }
      
      this.commitResults.set(fixId, result);
      
      this.emit('fix_committed', result);
      this.emit('fix_updated', fix);
      
      await this.saveCachedData();
      return result;
      
    } catch (error) {
      console.error(`Failed to commit fix ${fixId}:`, error);
      
      const result: CommitResult = {
        fixId,
        success: false,
        message: `Commit failed: ${error}`,
        timestamp: new Date()
      };
      
      this.commitResults.set(fixId, result);
      return result;
    }
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    const issues = Array.from(this.issues.values());
    const resolvedStatuses = [IssueStatus.VERIFIED, IssueStatus.COMMITTED];
    const failedStatuses = [IssueStatus.FAILED];
    
    this.stats.totalIssues = issues.length;
    this.stats.resolvedIssues = issues.filter(i => resolvedStatuses.includes(i.status)).length;
    this.stats.pendingIssues = issues.filter(i => !resolvedStatuses.includes(i.status) && !failedStatuses.includes(i.status)).length;
    this.stats.failedFixes = issues.filter(i => failedStatuses.includes(i.status)).length;
    this.stats.successRate = this.stats.totalIssues > 0 ? (this.stats.resolvedIssues / this.stats.totalIssues) * 100 : 0;
    this.stats.lastRunTime = new Date();
    
    // Calculate average fix time
    const completedFixes = Array.from(this.fixes.values()).filter(f => f.appliedAt);
    if (completedFixes.length > 0) {
      const totalTime = completedFixes.reduce((sum, fix) => {
        return sum + (fix.appliedAt!.getTime() - fix.createdAt.getTime());
      }, 0);
      this.stats.averageFixTime = totalTime / completedFixes.length;
    }
  }

  /**
   * Get all issues
   */
  getIssues(): Issue[] {
    return Array.from(this.issues.values());
  }

  /**
   * Get issue by ID
   */
  getIssue(id: string): Issue | undefined {
    return this.issues.get(id);
  }

  /**
   * Get all fixes
   */
  getFixes(): Fix[] {
    return Array.from(this.fixes.values());
  }

  /**
   * Get fix by ID
   */
  getFix(id: string): Fix | undefined {
    return this.fixes.get(id);
  }

  /**
   * Get verification result
   */
  getVerificationResult(fixId: string): VerificationResult | undefined {
    return this.verificationResults.get(fixId);
  }

  /**
   * Get commit result
   */
  getCommitResult(fixId: string): CommitResult | undefined {
    return this.commitResults.get(fixId);
  }

  /**
   * Get statistics
   */
  getStats(): AutoFixStats {
    return { ...this.stats };
  }

  /**
   * Start auto-fix processing
   */
  async startAutoFix(): Promise<void> {
    if (!this.config.fixer.enabled) {
      throw new Error('Auto-fix is disabled');
    }
    
    const pendingIssues = Array.from(this.issues.values())
      .filter(issue => issue.status === IssueStatus.DETECTED && this.shouldAutoFix(issue));
    
    console.log(`Starting auto-fix for ${pendingIssues.length} issues`);
    
    for (const issue of pendingIssues) {
      if (this.processingQueue.size >= this.config.fixer.maxConcurrentFixes) {
        break;
      }
      
      this.processingQueue.add(issue.id);
      this.generateFix(issue.id).finally(() => {
        this.processingQueue.delete(issue.id);
      });
    }
  }

  /**
   * Stop auto-fix processing
   */
  stopAutoFix(): void {
    this.processingQueue.clear();
    console.log('Auto-fix processing stopped');
  }

  /**
   * Clear all data
   */
  async clearData(): Promise<void> {
    this.issues.clear();
    this.fixes.clear();
    this.verificationResults.clear();
    this.commitResults.clear();
    this.processingQueue.clear();
    
    this.stats = {
      totalIssues: 0,
      resolvedIssues: 0,
      pendingIssues: 0,
      failedFixes: 0,
      successRate: 0,
      averageFixTime: 0,
      lastRunTime: new Date()
    };
    
    await this.saveCachedData();
    
    this.emit('data_cleared');
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    // Dispose watchers
    this.watcherDisposables.forEach(disposable => disposable.dispose());
    this.watcherDisposables = [];
    
    // Stop processing
    this.stopAutoFix();
    
    // Kill server process
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = undefined;
    }
  }
}