import * as vscode from 'vscode';
import { CodeIntelligenceClient } from '../clients/CodeIntelligenceClient';
import { NotificationService } from '../services/NotificationService';
import { TelemetryService } from '../services/TelemetryService';

export interface NotebookPattern {
    id: string;
    name: string;
    description: string;
    category: string;
    language: string;
    version: string;
    steps: NotebookStep[];
    examples: NotebookExample[];
    constraints: string[];
    metrics: NotebookMetrics;
    tags: string[];
    author: string;
    createdAt: Date;
    updatedAt: Date;
    usageCount: number;
    rating: number;
    approved: boolean;
}

export interface NotebookStep {
    id: string;
    title: string;
    description: string;
    code?: string;
    parameters?: { [key: string]: any };
    validation?: string;
    order: number;
}

export interface NotebookExample {
    id: string;
    title: string;
    description: string;
    input: string;
    output: string;
    context: string;
}

export interface NotebookMetrics {
    successRate: number;
    averageExecutionTime: number;
    errorRate: number;
    lastUsed: Date;
    complexity: 'low' | 'medium' | 'high';
}

export class NotebookPatternItem extends vscode.TreeItem {
    constructor(
        public readonly pattern: NotebookPattern,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(pattern.name, collapsibleState);
        
        this.tooltip = `${pattern.description}\n\nCategory: ${pattern.category}\nLanguage: ${pattern.language}\nVersion: ${pattern.version}\nRating: ${pattern.rating}/5\nUsage: ${pattern.usageCount} times`;
        this.description = `${pattern.category} • ${pattern.language} • v${pattern.version}`;
        
        // Set icon based on pattern type and approval status
        if (pattern.approved) {
            this.iconPath = new vscode.ThemeIcon('verified', new vscode.ThemeColor('charts.green'));
        } else {
            this.iconPath = new vscode.ThemeIcon('unverified', new vscode.ThemeColor('charts.yellow'));
        }
        
        // Context value for commands
        this.contextValue = pattern.approved ? 'approvedPattern' : 'pendingPattern';
        
        // Command to execute when clicked
        this.command = {
            command: 'gitMemoryMcp.previewPattern',
            title: 'Preview Pattern',
            arguments: [pattern]
        };
    }
}

export class NotebookStepItem extends vscode.TreeItem {
    constructor(
        public readonly step: NotebookStep,
        public readonly patternId: string
    ) {
        super(step.title, vscode.TreeItemCollapsibleState.None);
        
        this.tooltip = step.description;
        this.description = `Step ${step.order}`;
        this.iconPath = new vscode.ThemeIcon('list-ordered');
        this.contextValue = 'notebookStep';
        
        this.command = {
            command: 'gitMemoryMcp.executeStep',
            title: 'Execute Step',
            arguments: [step, patternId]
        };
    }
}

export class NotebookCategoryItem extends vscode.TreeItem {
    constructor(
        public readonly category: string,
        public readonly patternCount: number
    ) {
        super(category, vscode.TreeItemCollapsibleState.Expanded);
        
        this.tooltip = `${patternCount} patterns in ${category}`;
        this.description = `${patternCount} patterns`;
        this.iconPath = new vscode.ThemeIcon('folder');
        this.contextValue = 'notebookCategory';
    }
}

export class FunctionNotebookProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private patterns: NotebookPattern[] = [];
    private groupByCategory: boolean = true;
    private searchQuery: string = '';
    private selectedLanguage: string = 'all';
    private showOnlyApproved: boolean = false;

    constructor(
        private codeIntelligenceClient: CodeIntelligenceClient,
        private notificationService: NotificationService,
        private telemetryService: TelemetryService
    ) {
        this.loadPatterns();
    }

    refresh(): void {
        this.loadPatterns();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (!element) {
            // Root level
            if (this.groupByCategory) {
                return this.getCategoryItems();
            } else {
                return this.getFilteredPatterns().map(pattern => 
                    new NotebookPatternItem(pattern, vscode.TreeItemCollapsibleState.Collapsed)
                );
            }
        }

        if (element instanceof NotebookCategoryItem) {
            // Show patterns in category
            const categoryPatterns = this.getFilteredPatterns()
                .filter(pattern => pattern.category === element.category);
            return categoryPatterns.map(pattern => 
                new NotebookPatternItem(pattern, vscode.TreeItemCollapsibleState.Collapsed)
            );
        }

        if (element instanceof NotebookPatternItem) {
            // Show pattern steps
            return element.pattern.steps
                .sort((a, b) => a.order - b.order)
                .map(step => new NotebookStepItem(step, element.pattern.id));
        }

        return [];
    }

    private getCategoryItems(): NotebookCategoryItem[] {
        const filteredPatterns = this.getFilteredPatterns();
        const categories = new Map<string, number>();
        
        filteredPatterns.forEach(pattern => {
            const count = categories.get(pattern.category) || 0;
            categories.set(pattern.category, count + 1);
        });

        return Array.from(categories.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, count]) => new NotebookCategoryItem(category, count));
    }

    private getFilteredPatterns(): NotebookPattern[] {
        let filtered = this.patterns;

        // Filter by search query
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(pattern => 
                pattern.name.toLowerCase().includes(query) ||
                pattern.description.toLowerCase().includes(query) ||
                pattern.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Filter by language
        if (this.selectedLanguage !== 'all') {
            filtered = filtered.filter(pattern => pattern.language === this.selectedLanguage);
        }

        // Filter by approval status
        if (this.showOnlyApproved) {
            filtered = filtered.filter(pattern => pattern.approved);
        }

        // Sort by rating and usage
        return filtered.sort((a, b) => {
            if (a.rating !== b.rating) {
                return b.rating - a.rating;
            }
            return b.usageCount - a.usageCount;
        });
    }

    async loadPatterns(): Promise<void> {
        try {
            this.patterns = await this.codeIntelligenceClient.getPatterns();
        } catch (error) {
            this.notificationService.showError(`Failed to load patterns: ${error}`);
            this.patterns = [];
        }
    }

    async createPattern(pattern: Partial<NotebookPattern>): Promise<void> {
        try {
            const newPattern = await this.codeIntelligenceClient.createPattern({
                name: pattern.name || 'New Pattern',
                description: pattern.description || '',
                category: pattern.category || 'General',
                language: pattern.language || 'typescript',
                version: '1.0.0',
                steps: pattern.steps || [],
                examples: pattern.examples || [],
                constraints: pattern.constraints || [],
                metrics: pattern.metrics || {
                    successRate: 0,
                    averageExecutionTime: 0,
                    errorRate: 0,
                    lastUsed: new Date(),
                    complexity: 'medium'
                },
                tags: pattern.tags || [],
                author: 'User',
                approved: false
            });

            this.patterns.push(newPattern);
            this.refresh();
            this.notificationService.showInfo(`Pattern "${newPattern.name}" created successfully`);
            
            this.telemetryService.trackEvent('pattern.created', {
                category: newPattern.category,
                language: newPattern.language,
                stepCount: newPattern.steps.length
            });
        } catch (error) {
            this.notificationService.showError(`Failed to create pattern: ${error}`);
        }
    }

    async updatePattern(patternId: string, updates: Partial<NotebookPattern>): Promise<void> {
        try {
            const updatedPattern = await this.codeIntelligenceClient.updatePattern(patternId, updates);
            const index = this.patterns.findIndex(p => p.id === patternId);
            if (index !== -1) {
                this.patterns[index] = updatedPattern;
                this.refresh();
                this.notificationService.showInfo(`Pattern "${updatedPattern.name}" updated successfully`);
                
                this.telemetryService.trackEvent('pattern.updated', {
                    patternId,
                    category: updatedPattern.category,
                    language: updatedPattern.language
                });
            }
        } catch (error) {
            this.notificationService.showError(`Failed to update pattern: ${error}`);
        }
    }

    async deletePattern(patternId: string): Promise<void> {
        try {
            await this.codeIntelligenceClient.deletePattern(patternId);
            this.patterns = this.patterns.filter(p => p.id !== patternId);
            this.refresh();
            this.notificationService.showInfo('Pattern deleted successfully');
            
            this.telemetryService.trackEvent('pattern.deleted', { patternId });
        } catch (error) {
            this.notificationService.showError(`Failed to delete pattern: ${error}`);
        }
    }

    async executePattern(pattern: NotebookPattern, parameters?: { [key: string]: any }): Promise<void> {
        try {
            this.notificationService.showProgress(
                `Executing pattern "${pattern.name}"...`,
                async (progress) => {
                    const totalSteps = pattern.steps.length;
                    
                    for (let i = 0; i < totalSteps; i++) {
                        const step = pattern.steps[i];
                        progress.report({ 
                            increment: (100 / totalSteps),
                            message: `Step ${i + 1}: ${step.title}`
                        });
                        
                        await this.executeStep(step, pattern.id, parameters);
                    }
                }
            );

            // Update usage metrics
            await this.updatePatternUsage(pattern.id);
            this.notificationService.showInfo(`Pattern "${pattern.name}" executed successfully`);
            
            this.telemetryService.trackEvent('pattern.executed', {
                patternId: pattern.id,
                category: pattern.category,
                language: pattern.language,
                stepCount: pattern.steps.length
            });
        } catch (error) {
            this.notificationService.showError(`Failed to execute pattern: ${error}`);
            
            this.telemetryService.trackEvent('pattern.execution.failed', {
                patternId: pattern.id,
                error: error.toString()
            });
        }
    }

    async executeStep(step: NotebookStep, patternId: string, parameters?: { [key: string]: any }): Promise<void> {
        try {
            await this.codeIntelligenceClient.executePatternStep(patternId, step.id, parameters);
        } catch (error) {
            throw new Error(`Step "${step.title}" failed: ${error}`);
        }
    }

    async approvePattern(patternId: string): Promise<void> {
        try {
            await this.updatePattern(patternId, { approved: true });
            this.notificationService.showInfo('Pattern approved successfully');
        } catch (error) {
            this.notificationService.showError(`Failed to approve pattern: ${error}`);
        }
    }

    async ratePattern(patternId: string, rating: number): Promise<void> {
        try {
            await this.updatePattern(patternId, { rating });
            this.notificationService.showInfo(`Pattern rated ${rating}/5`);
        } catch (error) {
            this.notificationService.showError(`Failed to rate pattern: ${error}`);
        }
    }

    private async updatePatternUsage(patternId: string): Promise<void> {
        const pattern = this.patterns.find(p => p.id === patternId);
        if (pattern) {
            await this.updatePattern(patternId, {
                usageCount: pattern.usageCount + 1,
                metrics: {
                    ...pattern.metrics,
                    lastUsed: new Date()
                }
            });
        }
    }

    // Filter and search methods
    setSearchQuery(query: string): void {
        this.searchQuery = query;
        this.refresh();
    }

    setLanguageFilter(language: string): void {
        this.selectedLanguage = language;
        this.refresh();
    }

    toggleGroupByCategory(): void {
        this.groupByCategory = !this.groupByCategory;
        this.refresh();
    }

    toggleShowOnlyApproved(): void {
        this.showOnlyApproved = !this.showOnlyApproved;
        this.refresh();
    }

    getAvailableLanguages(): string[] {
        const languages = new Set(this.patterns.map(p => p.language));
        return ['all', ...Array.from(languages).sort()];
    }

    getAvailableCategories(): string[] {
        const categories = new Set(this.patterns.map(p => p.category));
        return Array.from(categories).sort();
    }

    // Export/Import functionality
    async exportPatterns(filePath: string): Promise<void> {
        try {
            const exportData = {
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                patterns: this.getFilteredPatterns()
            };

            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(filePath),
                Buffer.from(JSON.stringify(exportData, null, 2))
            );

            this.notificationService.showInfo(`Exported ${exportData.patterns.length} patterns to ${filePath}`);
            
            this.telemetryService.trackEvent('patterns.exported', {
                count: exportData.patterns.length,
                filePath
            });
        } catch (error) {
            this.notificationService.showError(`Failed to export patterns: ${error}`);
        }
    }

    async importPatterns(filePath: string): Promise<void> {
        try {
            const fileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
            const importData = JSON.parse(fileContent.toString());

            if (!importData.patterns || !Array.isArray(importData.patterns)) {
                throw new Error('Invalid import file format');
            }

            let importedCount = 0;
            for (const pattern of importData.patterns) {
                try {
                    await this.createPattern(pattern);
                    importedCount++;
                } catch (error) {
                    console.warn(`Failed to import pattern "${pattern.name}": ${error}`);
                }
            }

            this.notificationService.showInfo(`Imported ${importedCount} patterns from ${filePath}`);
            
            this.telemetryService.trackEvent('patterns.imported', {
                count: importedCount,
                filePath
            });
        } catch (error) {
            this.notificationService.showError(`Failed to import patterns: ${error}`);
        }
    }
}