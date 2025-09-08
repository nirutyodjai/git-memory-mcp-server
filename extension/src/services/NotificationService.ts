import * as vscode from 'vscode';
import { ConfigurationService } from './ConfigurationService';

export interface NotificationOptions {
  modal?: boolean;
  detail?: string;
  actions?: string[];
}

/**
 * Notification service for user messages
 */
export class NotificationService {
  constructor(private configService: ConfigurationService) {}
  
  /**
   * Show information message
   */
  async showInfo(message: string, options?: NotificationOptions): Promise<string | undefined> {
    if (!this.configService.get('ui.showNotifications', true)) {
      return;
    }
    
    if (options?.actions && options.actions.length > 0) {
      return await vscode.window.showInformationMessage(message, 
        { modal: options.modal, detail: options.detail }, 
        ...options.actions
      );
    }
    
    vscode.window.showInformationMessage(message, { modal: options?.modal, detail: options?.detail });
    return;
  }
  
  /**
   * Show warning message
   */
  async showWarning(message: string, options?: NotificationOptions): Promise<string | undefined> {
    if (options?.actions && options.actions.length > 0) {
      return await vscode.window.showWarningMessage(message, 
        { modal: options?.modal, detail: options?.detail }, 
        ...options.actions
      );
    }
    
    vscode.window.showWarningMessage(message, { modal: options?.modal, detail: options?.detail });
    return;
  }
  
  /**
   * Show error message
   */
  async showError(message: string, options?: NotificationOptions): Promise<string | undefined> {
    if (options?.actions && options.actions.length > 0) {
      return await vscode.window.showErrorMessage(message, 
        { modal: options?.modal, detail: options?.detail }, 
        ...options.actions
      );
    }
    
    vscode.window.showErrorMessage(message, { modal: options?.modal, detail: options?.detail });
    return;
  }
  
  /**
   * Show progress notification
   */
  async withProgress<T>(
    title: string,
    task: (progress: vscode.Progress<{ message?: string; increment?: number }>) => Promise<T>
  ): Promise<T> {
    return await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable: false
      },
      task
    );
  }
}