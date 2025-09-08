import * as vscode from 'vscode';

/**
 * Configuration service for managing extension settings
 */
export class ConfigurationService {
  private readonly configSection = 'gitMemoryMCP';
  
  /**
   * Get configuration value
   */
  get<T>(key: string, defaultValue?: T): T {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<T>(key, defaultValue as T);
  }
  
  /**
   * Set configuration value
   */
  async set(key: string, value: any, target?: vscode.ConfigurationTarget): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.configSection);
    await config.update(key, value, target || vscode.ConfigurationTarget.Workspace);
  }
  
  /**
   * Watch for configuration changes
   */
  onDidChange(callback: (e: vscode.ConfigurationChangeEvent) => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration(this.configSection)) {
        callback(e);
      }
    });
  }
  
  /**
   * Get all configuration
   */
  getAll(): any {
    return vscode.workspace.getConfiguration(this.configSection);
  }
}