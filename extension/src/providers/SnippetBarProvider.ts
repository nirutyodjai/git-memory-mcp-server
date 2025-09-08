import * as vscode from 'vscode';
import { CodeIntelligenceClient } from '../clients/CodeIntelligenceClient';
import { CodeSnippet, SnippetType } from '../../../src/code-intelligence';

/**
 * Snippet Bar Tree Item
 */
export class SnippetBarItem extends vscode.TreeItem {
  constructor(
    public readonly snippet: CodeSnippet,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
  ) {
    super(snippet.name, collapsibleState);
    
    this.tooltip = `${snippet.description}\n\nUsage: ${snippet.metadata.usageCount} times\nScore: ${snippet.score.toFixed(2)}`;
    this.description = `${snippet.language} • ${snippet.metadata.usageCount}x`;
    this.contextValue = 'snippet';
    
    // Set icon based on snippet type
    this.iconPath = this.getIconForSnippetType(snippet.type);
    
    // Command to insert snippet
    this.command = {
      command: 'gitMemoryMCP.insertSnippet',
      title: 'Insert Snippet',
      arguments: [snippet]
    };
  }
  
  private getIconForSnippetType(type: SnippetType): vscode.ThemeIcon {
    switch (type) {
      case SnippetType.FUNCTION_CALL:
        return new vscode.ThemeIcon('symbol-function');
      case SnippetType.IMPORT_STATEMENT:
        return new vscode.ThemeIcon('package');
      case SnippetType.VARIABLE_DECLARATION:
        return new vscode.ThemeIcon('symbol-variable');
      case SnippetType.CONTROL_STRUCTURE:
        return new vscode.ThemeIcon('git-branch');
      case SnippetType.ERROR_HANDLING:
        return new vscode.ThemeIcon('warning');
      case SnippetType.API_USAGE:
        return new vscode.ThemeIcon('globe');
      case SnippetType.CONFIGURATION:
        return new vscode.ThemeIcon('settings-gear');
      default:
        return new vscode.ThemeIcon('code');
    }
  }
}

/**
 * Snippet Bar Category Item
 */
export class SnippetCategoryItem extends vscode.TreeItem {
  constructor(
    public readonly category: string,
    public readonly snippets: CodeSnippet[],
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded
  ) {
    super(category, collapsibleState);
    
    this.tooltip = `${snippets.length} snippets in ${category}`;
    this.description = `${snippets.length} items`;
    this.contextValue = 'snippetCategory';
    this.iconPath = new vscode.ThemeIcon('folder');
  }
}

/**
 * Snippet Bar Provider for VS Code Tree View
 */
export class SnippetBarProvider implements vscode.TreeDataProvider<SnippetBarItem | SnippetCategoryItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SnippetBarItem | SnippetCategoryItem | undefined | null | void> = new vscode.EventEmitter<SnippetBarItem | SnippetCategoryItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<SnippetBarItem | SnippetCategoryItem | undefined | null | void> = this._onDidChangeTreeData.event;
  
  private snippets: CodeSnippet[] = [];
  private groupByCategory = true;
  private currentContext: any = {};
  
  constructor(
    private codeIntelligenceClient: CodeIntelligenceClient
  ) {
    // Listen for active editor changes to update context
    vscode.window.onDidChangeActiveTextEditor(() => {
      this.updateContext();
    });
    
    // Listen for cursor position changes
    vscode.window.onDidChangeTextEditorSelection(() => {
      this.updateContext();
    });
    
    // Initial context update
    this.updateContext();
  }
  
  /**
   * Get tree item
   */
  getTreeItem(element: SnippetBarItem | SnippetCategoryItem): vscode.TreeItem {
    return element;
  }
  
  /**
   * Get children
   */
  async getChildren(element?: SnippetBarItem | SnippetCategoryItem): Promise<(SnippetBarItem | SnippetCategoryItem)[]> {
    if (!element) {
      // Root level
      if (this.groupByCategory) {
        return this.getSnippetsByCategory();
      } else {
        return this.snippets.map(snippet => new SnippetBarItem(snippet));
      }
    } else if (element instanceof SnippetCategoryItem) {
      // Category children
      return element.snippets.map(snippet => new SnippetBarItem(snippet));
    }
    
    return [];
  }
  
  /**
   * Refresh snippets based on current context
   */
  async refresh(): Promise<void> {
    await this.updateSnippets();
    this._onDidChangeTreeData.fire();
  }
  
  /**
   * Toggle grouping by category
   */
  toggleGrouping(): void {
    this.groupByCategory = !this.groupByCategory;
    this._onDidChangeTreeData.fire();
  }
  
  /**
   * Search snippets
   */
  async searchSnippets(query: string): Promise<void> {
    try {
      const results = await this.codeIntelligenceClient.searchSnippets(query, {
        language: this.currentContext.language,
        limit: 50
      });
      
      this.snippets = results;
      this._onDidChangeTreeData.fire();
      
    } catch (error) {
      console.error('Failed to search snippets:', error);
      vscode.window.showErrorMessage(`Failed to search snippets: ${error}`);
    }
  }
  
  /**
   * Update context based on current editor
   */
  private async updateContext(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.currentContext = {};
      return;
    }
    
    const document = editor.document;
    const position = editor.selection.active;
    
    this.currentContext = {
      filePath: document.fileName,
      language: document.languageId,
      cursorPosition: {
        line: position.line,
        column: position.character
      },
      precedingCode: this.getPrecedingCode(document, position),
      followingCode: this.getFollowingCode(document, position)
    };
    
    // Auto-refresh snippets when context changes
    await this.updateSnippets();
  }
  
  /**
   * Update snippets based on current context
   */
  private async updateSnippets(): Promise<void> {
    try {
      const suggestions = await this.codeIntelligenceClient.getContextSuggestions(
        this.currentContext.filePath || '',
        this.currentContext.cursorPosition,
        20
      );
      
      this.snippets = suggestions.snippets || [];
      this._onDidChangeTreeData.fire();
      
    } catch (error) {
      console.error('Failed to update snippets:', error);
      // Don't show error to user for auto-updates
    }
  }
  
  /**
   * Group snippets by category
   */
  private getSnippetsByCategory(): SnippetCategoryItem[] {
    const categories = new Map<string, CodeSnippet[]>();
    
    for (const snippet of this.snippets) {
      const category = snippet.metadata.category || 'Other';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(snippet);
    }
    
    return Array.from(categories.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, snippets]) => new SnippetCategoryItem(category, snippets));
  }
  
  /**
   * Get preceding code context
   */
  private getPrecedingCode(document: vscode.TextDocument, position: vscode.Position): string {
    const startLine = Math.max(0, position.line - 3);
    const range = new vscode.Range(startLine, 0, position.line, position.character);
    return document.getText(range);
  }
  
  /**
   * Get following code context
   */
  private getFollowingCode(document: vscode.TextDocument, position: vscode.Position): string {
    const endLine = Math.min(document.lineCount - 1, position.line + 3);
    const range = new vscode.Range(position.line, position.character, endLine, Number.MAX_SAFE_INTEGER);
    return document.getText(range);
  }
}