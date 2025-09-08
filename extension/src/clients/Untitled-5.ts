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
}