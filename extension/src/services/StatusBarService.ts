import * as vscode from 'vscode';

export type StatusType = 'ready' | 'initializing' | 'working' | 'error' | 'disabled';

/**
 * Status bar service for showing extension status
 */
export class StatusBarService {
  private statusBarItem: vscode.StatusBarItem;
  
  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.show();
  }
  
  /**
   * Update status
   */
  updateStatus(type: StatusType, text: string, tooltip?: string): void {
    this.statusBarItem.text = this.getStatusIcon(type) + ' ' + text;
    this.statusBarItem.tooltip = tooltip || text;
    this.statusBarItem.backgroundColor = this.getStatusColor(type);
    
    // Set command for status bar click
    this.statusBarItem.command = 'gitMemoryMCP.showStatus';
  }
  
  /**
   * Show progress
   */
  showProgress(text: string): void {
    this.statusBarItem.text = '$(sync~spin) ' + text;
    this.statusBarItem.tooltip = text;
  }
  
  /**
   * Hide status bar
   */
  hide(): void {
    this.statusBarItem.hide();
  }
  
  /**
   * Show status bar
   */
  show(): void {
    this.statusBarItem.show();
  }
  
  /**
   * Dispose status bar
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
  
  private getStatusIcon(type: StatusType): string {
    switch (type) {
      case 'ready': return '$(check)';
      case 'initializing': return '$(sync~spin)';
      case 'working': return '$(gear~spin)';
      case 'error': return '$(error)';
      case 'disabled': return '$(circle-slash)';
      default: return '$(question)';
    }
  }
  
  private getStatusColor(type: StatusType): vscode.ThemeColor | undefined {
    switch (type) {
      case 'error': return new vscode.ThemeColor('statusBarItem.errorBackground');
      case 'disabled': return new vscode.ThemeColor('statusBarItem.warningBackground');
      default: return undefined;
    }
  }
}