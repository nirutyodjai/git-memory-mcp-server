import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';

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
    endLineimport * as vscode from 'vscode';
import { MCPOrchestratorClient } from '../clients/MCPOrchestratorClient';
import { CodeIntelligenceClient } from '../clients/CodeIntelligenceClient';
import { AutoFixClient } from '../clients/AutoFixClient';
import { NotificationService } from './NotificationService';
import { StatusBarService } from './StatusBarService';
import { TelemetryService } from './TelemetryService';
import { CodeSnippet, FunctionPattern } from '../../../src/code-intelligence';

export interface CommandServiceDependencies {
  orchestratorClient: MCPOrchestratorClient;
  codeIntelligenceClient: CodeIntelligenceClient;
  autoFixClient: AutoFixClient;
  notificationService: NotificationService;
  statusBarService: StatusBarService;
  telemetryService: TelemetryService;
}

/**
 * Command service for handling VS Code commands
 */
export class CommandService {
  constructor(private deps: CommandServiceDependencies) {}
  
  /**
   * Register all commands
   */
  registerCommands(context: vscode.ExtensionContext): void {
    const commands = [
      // Snippet commands
      vscode.commands.registerCommand('gitMemoryMCP.insertSnippet', this.insertSnippet.bind(this)),
      vscode.commands.registerCommand('gitMemoryMCP.searchSnippets', this.searchSnippets.bind(this)),
      vscode.commands.registerCommand('gitMemoryMCP.refreshSnippets', this.refreshSnippets.bind(this)),
      
      // Pattern commands
      vscode.commands.registerCommand('gitMemoryMCP.applyPattern', this.applyPattern.bind(this)),
      vscode.commands.registerCommand('gitMemoryMCP.createPattern', this.createPattern.bind(this)),
      
      // Auto-fix commands
      vscode.commands.registerCommand('gitMemoryMCP.runAutoFix', this.runAutoFix.bind(this)),
      vscode.commands.registerCommand('gitMemoryMCP.toggleAutoFix', this.toggleAutoFix.bind(this)),
      
      // Agent commands
      vscode.commands.registerCommand('gitMemoryMCP.showAgentDashboard', this.showAgentDashboard.bind(this)),
      vscode.commands.registerCommand('gitMemoryMCP.reloadAgents', this.reloadAgents.bind(this)),
      
      // General commands
      vscode.commands.registerCommand('gitMemoryMCP.showStatus', this.showStatus.bind(this)),
      vscode.commands.registerCommand('gitMemoryMCP.openSettings', this.openSettings.bind(this))
    ];
    
    commands.forEach(command => context.subscriptions.push(command));
  }
  
  /**
   * Insert snippet at cursor position
   */
  private async insertSnippet(snippet: CodeSnippet): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.deps.notificationService.showWarning('No active editor found');
      return;
    }
    
    try {
      const position = editor.selection.active;
      const template = this.processSnippetTemplate(snippet.template, snippet.parameters);
      
      await editor.edit(editBuilder => {
        editBuilder.insert(position, template);
      });
      
      // Track usage
      this.deps.telemetryService.trackSnippetUsage(snippet.id, true, editor.document.languageId);
      
      // Update snippet usage statistics
      await this.deps.codeIntelligenceClient.updateSnippetUsage(snippet.id, true);
      
    } catch (error) {
      this.deps.notificationService.showError(`Failed to insert snippet: ${error}`);
      this.deps.telemetryService.trackSnippetUsage(snippet.id, false);
    }
  }
  
  /**
   * Search snippets
   */
  private async searchSnippets(): Promise<void> {
    const query = await vscode.window.showInputBox({
      prompt: 'Search snippets',
      placeHolder: 'Enter search query...'
    });
    
    if (!query) return;
    
    try {
      const results = await this.deps.codeIntelligenceClient.searchSnippets(query);
      
      if (results.length === 0) {
        this.deps.notificationService.showInfo('No snippets found');
        return;
      }
      
      // Show results in quick pick
      const items = results.map(snippet => ({
        label: snippet.name,
        description: snippet.description,
        detail: `${snippet.language} • ${snippet.metadata.usageCount}x`,
        snippet
      }));
      
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select snippet to insert'
      });
      
      if (selected) {
        await this.insertSnippet(selected.snippet);
      }
      
    } catch (error) {
      this.deps.notificationService.showError(`Search failed: ${error}`);
    }
  }
  
  /**
   * Refresh snippets
   */
  private async refreshSnippets(): Promise<void> {
    this.deps.statusBarService.showProgress('Refreshing snippets...');
    
    try {
      await this.deps.codeIntelligenceClient.refreshSnippets();
      this.deps.notificationService.showInfo('Snippets refreshed successfully');
      
    } catch (error) {
      this.deps.notificationService.showError(`Failed to refresh snippets: ${error}`);
    } finally {
      this.deps.statusBarService.updateStatus('ready', 'Git Memory MCP: Ready');
    }
  }
  
  /**
   * Apply pattern
   */
  private async applyPattern(pattern: FunctionPattern): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.deps.notificationService.showWarning('No active editor found');
      return;
    }
    
    try {
      const startTime = Date.now();
      
      // Show pattern preview
      const apply = await this.deps.notificationService.showInfo(
        `Apply pattern "${pattern.name}"?`,
        {
          detail: pattern.description,
          actions: ['Apply', 'Cancel']
        }
      );
      
      if (apply !== 'Apply') return;
      
      // Apply pattern steps
      for (const step of pattern.steps) {
        await this.executePatternStep(step, editor);
      }
      
      const executionTime = Date.now() - startTime;
      this.deps.telemetryService.trackPatternUsage(pattern.id, true, executionTime);
      
      this.deps.notificationService.showInfo('Pattern applied successfully');
      
    } catch (error) {
      this.deps.notificationService.showError(`Failed to apply pattern: ${error}`);
      this.deps.telemetryService.trackPatternUsage(pattern.id, false);
    }
  }
  
  /**
   * Run auto-fix
   */
  private async runAutoFix(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      this.deps.notificationService.showWarning('No workspace folder found');
      return;
    }
    
    try {
      this.deps.statusBarService.showProgress('Running auto-fix...');
      
      const result = await this.deps.autoFixClient.runAutoFix(workspaceFolder.uri.fsPath);
      
      if (result.fixesApplied > 0) {
        this.deps.notificationService.showInfo(
          `Auto-fix completed: ${result.fixesApplied} fixes applied`,
          { detail: result.summary }
        );
      } else {
        this.deps.notificationService.showInfo('No issues found to fix');
      }
      
    } catch (error) {
      this.deps.notificationService.showError(`Auto-fix failed: ${error}`);
    } finally {
      this.deps.statusBarService.updateStatus('ready', 'Git Memory MCP: Ready');
    }
  }
  
  /**
   * Show status information
   */
  private async showStatus(): Promise<void> {
    const stats = await this.deps.codeIntelligenceClient.getStatistics();
    
    const message = `Git Memory MCP Status:\n\n` +
      `Snippets: ${stats.snippets.total}\n` +
      `Patterns: ${stats.patterns.total}\n` +
      `Agents: ${stats.agents?.active || 0}/${stats.agents?.total || 0}`;
    
    this.deps.notificationService.showInfo(message, { modal: true });
  }
  
  /**
   * Process snippet template with parameters
   */
  private processSnippetTemplate(template: string, parameters: any[]): string {
    let processed = template;
    
    // Simple parameter substitution
    parameters.forEach((param, index) => {
      const placeholder = `\${${index + 1}:${param.name}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), param.defaultValue || '');
    });
    
    return processed;
  }
  
  /**
   * Execute pattern step
   */
  private async executePatternStep(step: any, editor: vscode.TextEditor): Promise<void> {
    // Implementation would depend on step type
    console.log('Executing pattern step:', step);
  }
  
  private async showAgentDashboard(): Promise<void> {
    // Implementation for showing agent dashboard
  }
  
  private async reloadAgents(): Promise<void> {
    // Implementation for reloading agents
  }
  
  private async toggleAutoFix(): Promise<void> {
    // Implementation for toggling auto-fix
  }
  
  private async createPattern(): Promise<void> {
    // Implementation for creating new pattern
  }
  
  private async openSettings(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.openSettings', 'gitMemoryMCP');
  }
}