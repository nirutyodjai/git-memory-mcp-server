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
 * Code Intelligence Client
 * 
 * Handles communication with the Code Intelligence service
 * for static analysis, snippet mining, and function notebook management.
 */

import { EventEmitter } from 'events';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import axios, { AxiosInstance } from 'axios';

/**
 * Code snippet information
 */
// Types for Code Intelligence API
export interface CodeSnippet {
    id: string;
    type: 'FUNCTION_CALL' | 'CODE_PATTERN' | 'IMPORT_STATEMENT' | 'CLASS_DEFINITION' | 'VARIABLE_DECLARATION';
    name: string;
    template: string;
    parameters: SnippetParameter[];
    language: string;
    tags: string[];
    frequency: number;
    score: number;
    contexts: SnippetContext[];
    examples: SnippetExample[];
    metadata: Record<string, any>;
}

export interface SnippetParameter {
    name: string;
    type: string;
    description?: string;
    defaultValue?: string;
    required: boolean;
}

export interface SnippetContext {
    filePattern: string;
    lineContext: string[];
    imports: string[];
    scope: 'global' | 'class' | 'function' | 'block';
}

export interface SnippetExample {
    code: string;
    description: string;
    language: string;
}

export interface FunctionPattern {
    id: string;
    name: string;
    description: string;
    category: string;
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    steps: PatternStep[];
    constraints: PatternConstraint[];
    metrics: PatternMetric[];
    examples: PatternExample[];
    version: string;
    createdAt: Date;
    updatedAt: Date;
    usageCount: number;
    successRate: number;
    aiMetadata: {
        preferredModels: string[];
        contextRequirements: string[];
        estimatedTokens: number;
        complexity: number;
    };
}

export interface PatternStep {
    order: number;
    action: string;
    description: string;
    code?: string;
    validation?: string;
}

export interface PatternConstraint {
    type: 'LANGUAGE' | 'FRAMEWORK' | 'VERSION' | 'DEPENDENCY' | 'CUSTOM';
    value: string;
    description: string;
}

export interface PatternMetric {
    name: string;
    description: string;
    expectedValue: string;
    actualValue?: string;
    status?: 'PASS' | 'FAIL' | 'UNKNOWN';
}

export interface PatternExample {
    title: string;
    description: string;
    beforeCode: string;
    afterCode: string;
    language: string;
    context: string;
}

export interface AnalysisResult {
    fileAnalysis: FileAnalysis[];
    snippets: CodeSnippet[];
    patterns: FunctionPattern[];
    hotspots: CodeHotspot[];
    recommendations: string[];
}

export interface FileAnalysis {
    filePath: string;
    language: string;
    elements: CodeElement[];
    dependencies: string[];
    complexity: number;
    maintainabilityIndex: number;
    lastModified: Date;
}

export interface CodeElement {
    type: 'CLASS' | 'FUNCTION' | 'VARIABLE' | 'IMPORT' | 'INTERFACE' | 'TYPE';
    name: string;
    startLine: number;
    endLine: number;
    complexity?: number;
    dependencies: string[];
    metadata: Record<string, any>;
}

export interface CodeHotspot {
    filePath: string;
    start

export interface AnalysisContext {
  file: string;
  language: string;
  position: vscode.Position;
  selectedText?: string;
  surroundingCode?: string;
}

/**
 * Mining statistics
 */
export interface MiningStats {
  totalSnippets: number;
  newSnippets: number;
  updatedSnippets: number;
  totalPatterns: number;
  newPatterns: number;
  lastMiningTime: Date;
  averageScore: number;
}

/**
 * Client configuration
 */
export interface CodeIntelligenceConfig {
  serverPath: string;
  host?: string;
  port?: number;
  snippetMiner: {
    enabled: boolean;
    minFrequency: number;
    maxSnippets: number;
    miningInterval?: number;
  };
  staticAnalysis?: {
    enabled: boolean;
    languages: string[];
  };
}

/**
 * Code Intelligence Client
 */
export class CodeIntelligenceClient extends EventEmitter {
  private config: Required<CodeIntelligenceConfig>;
  private serverProcess?: ChildProcess;
  private isInitialized = false;
  private snippets = new Map<string, CodeSnippet>();
  private patterns = new Map<string, FunctionPattern>();
  private currentContext?: AnalysisContext;
  private miningTimer?: NodeJS.Timeout;
  private analysisQueue = new Set<string>();
  private miningQueue = new Set<string>();
  private stats: MiningStats = {
    totalSnippets: 0,
    newSnippets: 0,
    updatedSnippets: 0,
    totalPatterns: 0,
    newPatterns: 0,
    lastMiningTime: new Date(),
    averageScore: 0
  };

  constructor(config: CodeIntelligenceConfig) {
    super();
    
    this.config = {
      serverPath: config.serverPath,
      host: config.host || 'localhost',
      port: config.port || 8081,
      snippetMiner: {
        enabled: config.snippetMiner.enabled,
        minFrequency: config.snippetMiner.minFrequency,
        maxSnippets: config.snippetMiner.maxSnippets,
        miningInterval: config.snippetMiner.miningInterval || 300000 // 5 minutes
      },
      staticAnalysis: {
        enabled: config.staticAnalysis?.enabled ?? true,
        languages: config.staticAnalysis?.languages || ['typescript', 'javascript', 'python', 'java', 'cpp', 'go', 'rust']
      }
    };
  }

  /**
   * Initialize the code intelligence client
   */
  async initialize(): Promise<void> {
    try {
      // Load cached data
      await this.loadCachedData();
      
      // Start background mining if enabled
      if (this.config.snippetMiner.enabled) {
        this.startBackgroundMining();
      }
      
      this.isInitialized = true;
      console.log('Code Intelligence Client initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Code Intelligence Client:', error);
      throw error;
    }
  }

  /**
   * Load cached snippets and patterns
   */
  private async loadCachedData(): Promise<void> {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) return;
      
      const cacheDir = path.join(workspaceRoot, '.vscode', 'git-memory-mcp');
      
      // Load snippets
      const snippetsFile = path.join(cacheDir, 'snippets.json');
      if (fs.existsSync(snippetsFile)) {
        const snippetsData = JSON.parse(fs.readFileSync(snippetsFile, 'utf8'));
        snippetsData.forEach((snippet: CodeSnippet) => {
          this.snippets.set(snippet.id, snippet);
        });
        console.log(`Loaded ${this.snippets.size} cached snippets`);
      }
      
      // Load patterns
      const patternsFile = path.join(cacheDir, 'patterns.json');
      if (fs.existsSync(patternsFile)) {
        const patternsData = JSON.parse(fs.readFileSync(patternsFile, 'utf8'));
        patternsData.forEach((pattern: FunctionPattern) => {
          this.patterns.set(pattern.id, pattern);
        });
        console.log(`Loaded ${this.patterns.size} cached patterns`);
      }
      
      // Update stats
      this.stats.totalSnippets = this.snippets.size;
      this.stats.totalPatterns = this.patterns.size;
      
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
      
      // Save snippets
      const snippetsFile = path.join(cacheDir, 'snippets.json');
      const snippetsData = Array.from(this.snippets.values());
      fs.writeFileSync(snippetsFile, JSON.stringify(snippetsData, null, 2));
      
      // Save patterns
      const patternsFile = path.join(cacheDir, 'patterns.json');
      const patternsData = Array.from(this.patterns.values());
      fs.writeFileSync(patternsFile, JSON.stringify(patternsData, null, 2));
      
    } catch (error) {
      console.error('Failed to save cached data:', error);
    }
  }

  /**
   * Start background mining
   */
  private startBackgroundMining(): void {
    this.miningTimer = setInterval(async () => {
      if (this.miningQueue.size > 0) {
        await this.processMiningQueue();
      }
    }, this.config.snippetMiner.miningInterval);
  }

  /**
   * Process mining queue
   */
  private async processMiningQueue(): Promise<void> {
    const files = Array.from(this.miningQueue);
    this.miningQueue.clear();
    
    try {
      const results = await this.mineSnippetsFromFiles(files);
      
      // Update snippets
      let newCount = 0;
      let updatedCount = 0;
      
      results.forEach(snippet => {
        if (this.snippets.has(snippet.id)) {
          updatedCount++;
        } else {
          newCount++;
        }
        this.snippets.set(snippet.id, snippet);
      });
      
      // Update stats
      this.stats.newSnippets += newCount;
      this.stats.updatedSnippets += updatedCount;
      this.stats.totalSnippets = this.snippets.size;
      this.stats.lastMiningTime = new Date();
      
      // Save to cache
      await this.saveCachedData();
      
      // Emit events
      this.emit('snippets_mined', newCount + updatedCount);
      this.emit('snippets_updated', Array.from(this.snippets.values()));
      
      console.log(`Mined ${newCount} new and ${updatedCount} updated snippets`);
      
    } catch (error) {
      console.error('Failed to process mining queue:', error);
      this.emit('error', error);
    }
  }

  /**
   * Mine snippets from files
   */
  private async mineSnippetsFromFiles(files: string[]): Promise<CodeSnippet[]> {
    const snippets: CodeSnippet[] = [];
    
    for (const file of files) {
      try {
        if (!fs.existsSync(file)) continue;
        
        const content = fs.readFileSync(file, 'utf8');
        const language = this.detectLanguage(file);
        
        if (!this.config.staticAnalysis.languages.includes(language)) {
          continue;
        }
        
        const fileSnippets = await this.extractSnippetsFromContent(content, language, file);
        snippets.push(...fileSnippets);
        
      } catch (error) {
        console.error(`Failed to mine snippets from ${file}:`, error);
      }
    }
    
    return snippets;
  }

  /**
   * Extract snippets from content
   */
  private async extractSnippetsFromContent(content: string, language: string, filePath: string): Promise<CodeSnippet[]> {
    const snippets: CodeSnippet[] = [];
    
    // Simple pattern extraction (can be enhanced with AST parsing)
    const patterns = this.getLanguagePatterns(language);
    
    for (const pattern of patterns) {
      const matches = content.matchAll(pattern.regex);
      
      for (const match of matches) {
        if (match[0] && match[0].length > 10) { // Minimum length filter
          const snippet: CodeSnippet = {
            id: this.generateSnippetId(match[0], language),
            name: pattern.name,
            description: pattern.description,
            template: this.createTemplate(match[0]),
            parameters: this.extractParameters(match[0]),
            language,
            tags: [pattern.category, language],
            frequency: 1,
            score: this.calculateSnippetScore(match[0]),
            contexts: [path.basename(filePath)],
            examples: [{
              description: `Example from ${path.basename(filePath)}`,
              code: match[0],
              context: filePath
            }],
            metadata: {
              filePath,
              lineNumber: this.getLineNumber(content, match.index || 0),
              extractedAt: new Date().toISOString()
            }
          };
          
          snippets.push(snippet);
        }
      }
    }
    
    return snippets;
  }

  /**
   * Get language-specific patterns
   */
  private getLanguagePatterns(language: string): Array<{name: string, description: string, category: string, regex: RegExp}> {
    const patterns: Record<string, Array<{name: string, description: string, category: string, regex: RegExp}>> = {
      typescript: [
        {
          name: 'Function Declaration',
          description: 'TypeScript function declaration',
          category: 'function',
          regex: /(?:export\s+)?(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{[^}]*\}/g
        },
        {
          name: 'Arrow Function',
          description: 'TypeScript arrow function',
          category: 'function',
          regex: /(?:const|let|var)\s+\w+\s*=\s*(?:\([^)]*\)|\w+)\s*=>\s*(?:\{[^}]*\}|[^;\n]+)/g
        },
        {
          name: 'Class Method',
          description: 'TypeScript class method',
          category: 'method',
          regex: /(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?\w+\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{[^}]*\}/g
        }
      ],
      javascript: [
        {
          name: 'Function Declaration',
          description: 'JavaScript function declaration',
          category: 'function',
          regex: /(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g
        },
        {
          name: 'Arrow Function',
          description: 'JavaScript arrow function',
          category: 'function',
          regex: /(?:const|let|var)\s+\w+\s*=\s*(?:\([^)]*\)|\w+)\s*=>\s*(?:\{[^}]*\}|[^;\n]+)/g
        }
      ],
      python: [
        {
          name: 'Function Definition',
          description: 'Python function definition',
          category: 'function',
          regex: /def\s+\w+\s*\([^)]*\)\s*(?:->\s*[^:]+)?:\s*(?:\n(?:\s{4,}.*\n?)*)/g
        },
        {
          name: 'Class Method',
          description: 'Python class method',
          category: 'method',
          regex: /def\s+\w+\s*\(self[^)]*\)\s*(?:->\s*[^:]+)?:\s*(?:\n(?:\s{4,}.*\n?)*)/g
        }
      ]
    };
    
    return patterns[language] || [];
  }

  /**
   * Detect file language
   */
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.cc': 'cpp',
      '.cxx': 'cpp',
      '.c': 'c',
      '.go': 'go',
      '.rs': 'rust'
    };
    
    return languageMap[ext] || 'unknown';
  }

  /**
   * Generate snippet ID
   */
  private generateSnippetId(code: string, language: string): string {
    const hash = require('crypto').createHash('md5').update(code + language).digest('hex');
    return `snippet_${language}_${hash.substring(0, 8)}`;
  }

  /**
   * Create template from code
   */
  private createTemplate(code: string): string {
    // Simple template creation - replace literals with placeholders
    return code
      .replace(/"[^"]*"/g, '"${1:string}"')
      .replace(/'[^']*'/g, "'${1:string}'")
      .replace(/\b\d+\b/g, '${1:number}')
      .replace(/\b(true|false)\b/g, '${1:boolean}');
  }

  /**
   * Extract parameters from code
   */
  private extractParameters(code: string): SnippetParameter[] {
    const parameters: SnippetParameter[] = [];
    
    // Extract function parameters
    const paramMatch = code.match(/\(([^)]*)\)/);
    if (paramMatch && paramMatch[1]) {
      const params = paramMatch[1].split(',').map(p => p.trim()).filter(p => p);
      
      params.forEach((param, index) => {
        const [name, type] = param.split(':').map(p => p.trim());
        parameters.push({
          name: name || `param${index + 1}`,
          type: type || 'any',
          description: `Parameter ${index + 1}`,
          required: true
        });
      });
    }
    
    return parameters;
  }

  /**
   * Calculate snippet score
   */
  private calculateSnippetScore(code: string): number {
    let score = 0;
    
    // Length factor (prefer medium-length snippets)
    const length = code.length;
    if (length >= 50 && length <= 500) {
      score += 10;
    } else if (length > 500 && length <= 1000) {
      score += 5;
    }
    
    // Complexity indicators
    if (code.includes('async') || code.includes('await')) score += 5;
    if (code.includes('try') || code.includes('catch')) score += 5;
    if (code.includes('interface') || code.includes('type')) score += 3;
    if (code.includes('export')) score += 3;
    
    // Common patterns
    if (code.includes('useState') || code.includes('useEffect')) score += 8;
    if (code.includes('Promise') || code.includes('.then')) score += 5;
    
    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Get line number from content and index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Schedule snippet mining for a file
   */
  scheduleSnippetMining(filePath: string): void {
    if (this.config.snippetMiner.enabled) {
      this.miningQueue.add(filePath);
    }
  }

  /**
   * Schedule analysis for a file
   */
  scheduleAnalysis(filePath: string): void {
    this.analysisQueue.add(filePath);
  }

  /**
   * Update current context
   */
  updateContext(context: AnalysisContext): void {
    this.currentContext = context;
    this.emit('context_updated', context);
  }

  /**
   * Get snippets for current context
   */
  getContextualSnippets(limit: number = 10): CodeSnippet[] {
    if (!this.currentContext) {
      return Array.from(this.snippets.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }
    
    const { language, file } = this.currentContext;
    const fileName = path.basename(file);
    
    return Array.from(this.snippets.values())
      .filter(snippet => {
        // Language match
        if (snippet.language !== language) return false;
        
        // Context relevance
        const contextScore = snippet.contexts.some(ctx => ctx.includes(fileName)) ? 10 : 0;
        snippet.score += contextScore;
        
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Search snippets
   */
  searchSnippets(query: string, filters?: {
    language?: string;
    tags?: string[];
    minScore?: number;
  }): CodeSnippet[] {
    const queryLower = query.toLowerCase();
    
    return Array.from(this.snippets.values())
      .filter(snippet => {
        // Text search
        const textMatch = snippet.name.toLowerCase().includes(queryLower) ||
                         snippet.description.toLowerCase().includes(queryLower) ||
                         snippet.template.toLowerCase().includes(queryLower) ||
                         snippet.tags.some(tag => tag.toLowerCase().includes(queryLower));
        
        if (!textMatch) return false;
        
        // Apply filters
        if (filters?.language && snippet.language !== filters.language) return false;
        if (filters?.tags && !filters.tags.some(tag => snippet.tags.includes(tag))) return false;
        if (filters?.minScore && snippet.score < filters.minScore) return false;
        
        return true;
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get all snippets
   */
  getSnippets(): CodeSnippet[] {
    return Array.from(this.snippets.values());
  }

  /**
   * Get snippet by ID
   */
  getSnippet(id: string): CodeSnippet | undefined {
    return this.snippets.get(id);
  }

  /**
   * Get all patterns
   */
  getPatterns(): FunctionPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get pattern by ID
   */
  getPattern(id: string): FunctionPattern | undefined {
    return this.patterns.get(id);
  }

  /**
   * Search patterns
   */
  searchPatterns(query: string, filters?: {
    category?: string;
    complexity?: string;
    status?: string;
  }): FunctionPattern[] {
    const queryLower = query.toLowerCase();
    
    return Array.from(this.patterns.values())
      .filter(pattern => {
        // Text search
        const textMatch = pattern.name.toLowerCase().includes(queryLower) ||
                         pattern.description.toLowerCase().includes(queryLower) ||
                         pattern.tags.some(tag => tag.toLowerCase().includes(queryLower));
        
        if (!textMatch) return false;
        
        // Apply filters
        if (filters?.category && pattern.category !== filters.category) return false;
        if (filters?.complexity && pattern.complexity !== filters.complexity) return false;
        if (filters?.status && pattern.status !== filters.status) return false;
        
        return true;
      });
  }

  /**
   * Mine snippets manually
   */
  async mineSnippets(): Promise<void> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      throw new Error('No workspace folder found');
    }
    
    // Find all relevant files
    const files = await this.findSourceFiles(workspaceRoot);
    
    // Add to mining queue
    files.forEach(file => this.miningQueue.add(file));
    
    // Process immediately
    await this.processMiningQueue();
  }

  /**
   * Find source files in workspace
   */
  private async findSourceFiles(rootPath: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.c', '.go', '.rs'];
    
    const findFiles = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip common directories to ignore
          if (!['node_modules', '.git', 'dist', 'build', '__pycache__'].includes(entry.name)) {
            findFiles(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    findFiles(rootPath);
    return files;
  }

  /**
   * Get mining statistics
   */
  getStats(): MiningStats {
    return { ...this.stats };
  }

  /**
   * Clear all data
   */
  async clearData(): Promise<void> {
    this.snippets.clear();
    this.patterns.clear();
    
    this.stats = {
      totalSnippets: 0,
      newSnippets: 0,
      updatedSnippets: 0,
      totalPatterns: 0,
      newPatterns: 0,
      lastMiningTime: new Date(),
      averageScore: 0
    };
    
    await this.saveCachedData();
    
    this.emit('snippets_updated', []);
    this.emit('patterns_updated', []);
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.miningTimer) {
      clearInterval(this.miningTimer);
      this.miningTimer = undefined;
    }
    
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = undefined;
    }
  }
}