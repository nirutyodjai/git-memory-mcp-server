import * as vscode from 'vscode';
import { AutoFixClient } from '../clients/AutoFixClient';
import { NotificationService } from '../services/NotificationService';
import { TelemetryService } from '../services/TelemetryService';
import { StatusBarService } from '../services/StatusBarService';

export interface FixIssue {
    id: string;
    title: string;
    description: string;
    severity: 'error' | 'warning' | 'info';
    category: 'syntax' | 'logic' | 'performance' | 'security' | 'style' | 'test';
    filePath: string;
    line: number;
    column: number;
    source: 'lint' | 'test' | 'runtime' | 'static-analysis';
    status: 'detected' | 'analyzing' | 'fix-proposed' | 'fix-applied' | 'verified' | 'resolved' | 'ignored';
    createdAt: Date;
    updatedAt: Date;
    autoFixable: boolean;
    confidence: number;
    tags: string[];
}

export interface FixProposal {
    id: string;
    issueId: string;
    title: string;
    description: string;
    changes: FixChange[];
    testChanges?: FixChange[];
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
    estimatedTime: number;
    createdAt: Date;
    status: 'proposed' | 'previewing' | 'applying' | 'applied' | 'failed' | 'rolled-back';
    metadata: { [key: string]: any };
}

export interface FixChange {
    filePath: string;
    startLine: number;
    endLine: number;
    originalContent: string;
    newContent: string;
    changeType: 'replace' | 'insert' | 'delete';
    description: string;
}

export interface FixStats {
    totalIssues: number;
    resolvedIssues: number;
    pendingIssues: number;
    autoFixSuccessRate: number;
    averageFixTime: number;
    issuesByCategory: { [category: string]: number };
    issuesBySeverity: { [severity: string]: number };
}

export class FixIssueItem extends vscode.TreeItem {
    constructor(
        public readonly issue: FixIssue,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(issue.title, collapsibleState);
        
        this.tooltip = `${issue.description}\n\nFile: ${issue.filePath}\nLine: ${issue.line}\nSeverity: ${issue.severity}\nCategory: ${issue.category}\nSource: ${issue.source}\nStatus: ${issue.status}\nAuto-fixable: ${issue.autoFixable ? 'Yes' : 'No'}\nConfidence: ${Math.round(issue.confidence * 100)}%`;
        
        this.description = `${issue.category} • Line ${issue.line} • ${issue.status}`;
        
        // Set icon based on severity and status
        this.iconPath = this.getIssueIcon(issue);
        
        // Context value for commands
        this.contextValue = `fixIssue-${issue.status}-${issue.autoFixable ? 'fixable' : 'manual'}`;
        
        // Command to execute when clicked
        this.command = {
            command: 'gitMemoryMcp.showIssueDetails',
            title: 'Show Issue Details',
            arguments: [issue]
        };
    }

    private getIssueIcon(issue: FixIssue): vscode.ThemeIcon {
        const baseIcon = issue.severity === 'error' ? 'error' : 
                        issue.severity === 'warning' ? 'warning' : 'info';
        
        const color = issue.severity === 'error' ? 'errorForeground' : 
                     issue.severity === 'warning' ? 'warningForeground' : 'infoForeground';
        
        if (issue.status === 'resolved') {
            return new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
        } else if (issue.status === 'fix-applied') {
            return new vscode.ThemeIcon('sync', new vscode.ThemeColor('charts.blue'));
        } else if (issue.autoFixable) {
            return new vscode.ThemeIcon('lightbulb-autofix', new vscode.ThemeColor(color));
        } else {
            return new vscode.ThemeIcon(baseIcon, new vscode.ThemeColor(color));
        }
    }
}

export class FixProposalItem extends vscode.TreeItem {
    constructor(
        public readonly proposal: FixProposal,
        public readonly issue: FixIssue
    ) {
        super(`Fix: ${proposal.title}`, vscode.TreeItemCollapsibleState.Collapsed);
        
        this.tooltip = `${proposal.description}\n\nConfidence: ${Math.round(proposal.confidence * 100)}%\nRisk Level: ${proposal.riskLevel}\nEstimated Time: ${proposal.estimatedTime}s\nChanges: ${proposal.changes.length} files\nStatus: ${proposal.status}`;
        
        this.description = `${proposal.riskLevel} risk • ${Math.round(proposal.confidence * 100)}% confidence`;
        
        // Set icon based on status and risk level
        this.iconPath = this.getProposalIcon(proposal);
        
        this.contextValue = `fixProposal-${proposal.status}-${proposal.riskLevel}`;
        
        this.command = {
            command: 'gitMemoryMcp.previewFix',
            title: 'Preview Fix',
            arguments: [proposal, issue]
        };
    }

    private getProposalIcon(proposal: FixProposal): vscode.ThemeIcon {
        if (proposal.status === 'applied') {
            return new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
        } else if (proposal.status === 'failed') {
            return new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
        } else if (proposal.status === 'applying') {
            return new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.blue'));
        } else {
            const color = proposal.riskLevel === 'high' ? 'warningForeground' : 
                        proposal.riskLevel === 'medium' ? 'charts.yellow' : 'charts.green';
            return new vscode.ThemeIcon('lightbulb', new vscode.ThemeColor(color));
        }
    }
}

export class FixChangeItem extends vscode.TreeItem {
    constructor(
        public readonly change: FixChange,
        public readonly proposalId: string
    ) {
        super(`${change.filePath.split('/').pop()} (${change.changeType})`, vscode.TreeItemCollapsibleState.None);
        
        this.tooltip = `${change.description}\n\nFile: ${change.filePath}\nLines: ${change.startLine}-${change.endLine}\nType: ${change.changeType}`;
        
        this.description = `Lines ${change.startLine}-${change.endLine}`;
        
        const iconName = change.changeType === 'replace' ? 'replace' :
                        change.changeType === 'insert' ? 'add' : 'remove';
        this.iconPath = new vscode.ThemeIcon(iconName);
        
        this.contextValue = 'fixChange';
        
        this.command = {
            command: 'gitMemoryMcp.showChangeDiff',
            title: 'Show Diff',
            arguments: [change, proposalId]
        };
    }
}

export class FixCategoryItem extends vscode.TreeItem {
    constructor(
        public readonly category: string,
        public readonly issueCount: number,
        public readonly severity: string
    ) {
        super(`${category} (${issueCount})`, vscode.TreeItemCollapsibleState.Expanded);
        
        this.tooltip = `${issueCount} ${severity} issues in ${category} category`;
        this.description = `${issueCount} issues`;
        
        const iconName = severity === 'error' ? 'error' : 
                        severity === 'warning' ? 'warning' : 'info';
        const color = severity === 'error' ? 'errorForeground' : 
                     severity === 'warning' ? 'warningForeground' : 'infoForeground';
        
        this.iconPath = new vscode.ThemeIcon(iconName, new vscode.ThemeColor(color));
        this.contextValue = 'fixCategory';
    }
}

export class FixCenterProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private issues: FixIssue[] = [];
    private proposals: Map<string, FixProposal[]> = new Map();
    private groupBy: 'severity' | 'category' | 'status' | 'file' = 'severity';
    private filterSeverity: string[] = ['error', 'warning', 'info'];
    private filterStatus: string[] = [];
    private showOnlyAutoFixable: boolean = false;
    private autoScanEnabled: boolean = true;
    private scanInterval: NodeJS.Timeout | null = null;

    constructor(
        private autoFixClient: AutoFixClient,
        private notificationService: NotificationService,
        private telemetryService: TelemetryService,
        private statusBarService: StatusBarService
    ) {
        this.loadIssues();
        this.startAutoScan();
    }

    refresh(): void {
        this.loadIssues();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (!element) {
            // Root level - show groups
            return this.getGroupItems();
        }

        if (element instanceof FixCategoryItem) {
            // Show issues in category/severity/status group
            const filteredIssues = this.getFilteredIssues()
                .filter(issue => this.matchesGroup(issue, element));
            return filteredIssues.map(issue => 
                new FixIssueItem(issue, vscode.TreeItemCollapsibleState.Collapsed)
            );
        }

        if (element instanceof FixIssueItem) {
            // Show proposals for issue
            const proposals = this.proposals.get(element.issue.id) || [];
            return proposals.map(proposal => 
                new FixProposalItem(proposal, element.issue)
            );
        }

        if (element instanceof FixProposalItem) {
            // Show changes in proposal
            return element.proposal.changes.map(change => 
                new FixChangeItem(change, element.proposal.id)
            );
        }

        return [];
    }

    private getGroupItems(): FixCategoryItem[] {
        const filteredIssues = this.getFilteredIssues();
        const groups = new Map<string, { count: number; severity: string }>();
        
        filteredIssues.forEach(issue => {
            const groupKey = this.getGroupKey(issue);
            const existing = groups.get(groupKey) || { count: 0, severity: issue.severity };
            groups.set(groupKey, { 
                count: existing.count + 1, 
                severity: this.getGroupSeverity(existing.severity, issue.severity)
            });
        });

        return Array.from(groups.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([group, data]) => new FixCategoryItem(group, data.count, data.severity));
    }

    private getGroupKey(issue: FixIssue): string {
        switch (this.groupBy) {
            case 'severity': return issue.severity;
            case 'category': return issue.category;
            case 'status': return issue.status;
            case 'file': return issue.filePath.split('/').pop() || issue.filePath;
            default: return issue.severity;
        }
    }

    private getGroupSeverity(current: string, newSeverity: string): string {
        const severityOrder = ['error', 'warning', 'info'];
        const currentIndex = severityOrder.indexOf(current);
        const newIndex = severityOrder.indexOf(newSeverity);
        return currentIndex < newIndex ? current : newSeverity;
    }

    private matchesGroup(issue: FixIssue, group: FixCategoryItem): boolean {
        return this.getGroupKey(issue) === group.category;
    }

    private getFilteredIssues(): FixIssue[] {
        let filtered = this.issues;

        // Filter by severity
        if (this.filterSeverity.length > 0) {
            filtered = filtered.filter(issue => this.filterSeverity.includes(issue.severity));
        }

        // Filter by status
        if (this.filterStatus.length > 0) {
            filtered = filtered.filter(issue => this.filterStatus.includes(issue.status));
        }

        // Filter by auto-fixable
        if (this.showOnlyAutoFixable) {
            filtered = filtered.filter(issue => issue.autoFixable);
        }

        // Sort by severity and confidence
        return filtered.sort((a, b) => {
            const severityOrder = { 'error': 0, 'warning': 1, 'info': 2 };
            if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                return severityOrder[a.severity] - severityOrder[b.severity];
            }
            return b.confidence - a.confidence;
        });
    }

    async loadIssues(): Promise<void> {
        try {
            this.issues = await this.autoFixClient.getIssues();
            
            // Load proposals for each issue
            for (const issue of this.issues) {
                try {
                    const proposals = await this.autoFixClient.getProposals(issue.id);
                    this.proposals.set(issue.id, proposals);
                } catch (error) {
                    console.warn(`Failed to load proposals for issue ${issue.id}: ${error}`);
                }
            }

            this.updateStatusBar();
        } catch (error) {
            this.notificationService.showError(`Failed to load issues: ${error}`);
            this.issues = [];
        }
    }

    async scanForIssues(): Promise<void> {
        try {
            this.statusBarService.updateStatus('Scanning for issues...', 'sync~spin');
            
            const newIssues = await this.autoFixClient.detectIssues();
            const addedCount = newIssues.length - this.issues.length;
            
            if (addedCount > 0) {
                this.notificationService.showInfo(`Found ${addedCount} new issues`);
                this.telemetryService.trackEvent('issues.detected', { count: addedCount });
            }
            
            this.issues = newIssues;
            this.refresh();
            this.updateStatusBar();
        } catch (error) {
            this.notificationService.showError(`Failed to scan for issues: ${error}`);
        }
    }

    async generateFix(issueId: string): Promise<void> {
        try {
            const issue = this.issues.find(i => i.id === issueId);
            if (!issue) {
                throw new Error('Issue not found');
            }

            this.notificationService.showProgress(
                `Generating fix for "${issue.title}"...`,
                async (progress) => {
                    progress.report({ increment: 25, message: 'Analyzing issue...' });
                    
                    const proposal = await this.autoFixClient.generateFix(issueId);
                    
                    progress.report({ increment: 50, message: 'Creating fix proposal...' });
                    
                    const existingProposals = this.proposals.get(issueId) || [];
                    this.proposals.set(issueId, [...existingProposals, proposal]);
                    
                    progress.report({ increment: 25, message: 'Fix proposal ready' });
                    
                    this.refresh();
                    this.notificationService.showInfo(`Fix proposal generated for "${issue.title}"`);
                    
                    this.telemetryService.trackEvent('fix.generated', {
                        issueId,
                        category: issue.category,
                        confidence: proposal.confidence,
                        riskLevel: proposal.riskLevel
                    });
                }
            );
        } catch (error) {
            this.notificationService.showError(`Failed to generate fix: ${error}`);
            
            this.telemetryService.trackEvent('fix.generation.failed', {
                issueId,
                error: error.toString()
            });
        }
    }

    async previewFix(proposalId: string): Promise<void> {
        try {
            const proposal = this.findProposal(proposalId);
            if (!proposal) {
                throw new Error('Proposal not found');
            }

            const preview = await this.autoFixClient.previewFix(proposalId);
            
            // Show diff in editor
            for (const change of proposal.changes) {
                await this.showChangeDiff(change, proposalId);
            }
            
            this.telemetryService.trackEvent('fix.previewed', {
                proposalId,
                changeCount: proposal.changes.length
            });
        } catch (error) {
            this.notificationService.showError(`Failed to preview fix: ${error}`);
        }
    }

    async applyFix(proposalId: string): Promise<void> {
        try {
            const proposal = this.findProposal(proposalId);
            if (!proposal) {
                throw new Error('Proposal not found');
            }

            // Show confirmation dialog for high-risk fixes
            if (proposal.riskLevel === 'high') {
                const confirm = await vscode.window.showWarningMessage(
                    `This fix has high risk level. Are you sure you want to apply it?`,
                    { modal: true },
                    'Apply Fix',
                    'Cancel'
                );
                
                if (confirm !== 'Apply Fix') {
                    return;
                }
            }

            this.notificationService.showProgress(
                `Applying fix "${proposal.title}"...`,
                async (progress) => {
                    progress.report({ increment: 20, message: 'Validating changes...' });
                    
                    await this.autoFixClient.validateFix(proposalId);
                    
                    progress.report({ increment: 30, message: 'Applying changes...' });
                    
                    await this.autoFixClient.applyFix(proposalId);
                    
                    progress.report({ increment: 30, message: 'Running tests...' });
                    
                    const verificationResult = await this.autoFixClient.verifyFix(proposalId);
                    
                    progress.report({ increment: 20, message: 'Fix applied successfully' });
                    
                    if (verificationResult.success) {
                        this.notificationService.showInfo(`Fix "${proposal.title}" applied successfully`);
                        
                        // Update issue status
                        await this.updateIssueStatus(proposal.issueId, 'resolved');
                    } else {
                        this.notificationService.showWarning(
                            `Fix applied but verification failed: ${verificationResult.message}`
                        );
                    }
                    
                    this.refresh();
                    
                    this.telemetryService.trackEvent('fix.applied', {
                        proposalId,
                        issueId: proposal.issueId,
                        success: verificationResult.success,
                        riskLevel: proposal.riskLevel
                    });
                }
            );
        } catch (error) {
            this.notificationService.showError(`Failed to apply fix: ${error}`);
            
            this.telemetryService.trackEvent('fix.application.failed', {
                proposalId,
                error: error.toString()
            });
        }
    }

    async rollbackFix(proposalId: string): Promise<void> {
        try {
            await this.autoFixClient.rollbackFix(proposalId);
            this.notificationService.showInfo('Fix rolled back successfully');
            this.refresh();
            
            this.telemetryService.trackEvent('fix.rolled_back', { proposalId });
        } catch (error) {
            this.notificationService.showError(`Failed to rollback fix: ${error}`);
        }
    }

    async ignoreIssue(issueId: string): Promise<void> {
        try {
            await this.updateIssueStatus(issueId, 'ignored');
            this.notificationService.showInfo('Issue ignored');
            
            this.telemetryService.trackEvent('issue.ignored', { issueId });
        } catch (error) {
            this.notificationService.showError(`Failed to ignore issue: ${error}`);
        }
    }

    private async updateIssueStatus(issueId: string, status: FixIssue['status']): Promise<void> {
        await this.autoFixClient.updateIssueStatus(issueId, status);
        
        const issue = this.issues.find(i => i.id === issueId);
        if (issue) {
            issue.status = status;
            issue.updatedAt = new Date();
        }
        
        this.refresh();
        this.updateStatusBar();
    }

    private findProposal(proposalId: string): FixProposal | undefined {
        for (const proposals of this.proposals.values()) {
            const proposal = proposals.find(p => p.id === proposalId);
            if (proposal) {
                return proposal;
            }
        }
        return undefined;
    }

    private async showChangeDiff(change: FixChange, proposalId: string): Promise<void> {
        try {
            const originalUri = vscode.Uri.parse(`git-memory-mcp://original/${proposalId}/${change.filePath}`);
            const modifiedUri = vscode.Uri.parse(`git-memory-mcp://modified/${proposalId}/${change.filePath}`);
            
            await vscode.commands.executeCommand(
                'vscode.diff',
                originalUri,
                modifiedUri,
                `${change.filePath} (Fix Preview)`,
                { preview: true }
            );
        } catch (error) {
            this.notificationService.showError(`Failed to show diff: ${error}`);
        }
    }

    private updateStatusBar(): void {
        const errorCount = this.issues.filter(i => i.severity === 'error' && i.status !== 'resolved').length;
        const warningCount = this.issues.filter(i => i.severity === 'warning' && i.status !== 'resolved').length;
        
        if (errorCount > 0) {
            this.statusBarService.updateStatus(
                `$(error) ${errorCount} errors, $(warning) ${warningCount} warnings`,
                'error'
            );
        } else if (warningCount > 0) {
            this.statusBarService.updateStatus(
                `$(warning) ${warningCount} warnings`,
                'warning'
            );
        } else {
            this.statusBarService.updateStatus(
                '$(check) No issues found',
                'check'
            );
        }
    }

    private startAutoScan(): void {
        if (this.autoScanEnabled && !this.scanInterval) {
            this.scanInterval = setInterval(() => {
                this.scanForIssues();
            }, 30000); // Scan every 30 seconds
        }
    }

    private stopAutoScan(): void {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
    }

    // Configuration methods
    setGroupBy(groupBy: 'severity' | 'category' | 'status' | 'file'): void {
        this.groupBy = groupBy;
        this.refresh();
    }

    setSeverityFilter(severities: string[]): void {
        this.filterSeverity = severities;
        this.refresh();
    }

    setStatusFilter(statuses: string[]): void {
        this.filterStatus = statuses;
        this.refresh();
    }

    toggleAutoFixableOnly(): void {
        this.showOnlyAutoFixable = !this.showOnlyAutoFixable;
        this.refresh();
    }

    toggleAutoScan(): void {
        this.autoScanEnabled = !this.autoScanEnabled;
        if (this.autoScanEnabled) {
            this.startAutoScan();
        } else {
            this.stopAutoScan();
        }
    }

    async getStats(): Promise<FixStats> {
        try {
            return await this.autoFixClient.getStats();
        } catch (error) {
            this.notificationService.showError(`Failed to get stats: ${error}`);
            return {
                totalIssues: this.issues.length,
                resolvedIssues: this.issues.filter(i => i.status === 'resolved').length,
                pendingIssues: this.issues.filter(i => i.status !== 'resolved' && i.status !== 'ignored').length,
                autoFixSuccessRate: 0,
                averageFixTime: 0,
                issuesByCategory: {},
                issuesBySeverity: {}
            };
        }
    }

    dispose(): void {
        this.stopAutoScan();
    }
}