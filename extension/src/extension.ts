/**
 * Git Memory MCP IDE Extension
 * 
 * Main extension entry point that integrates with MCP Orchestrator,
 * Code Intelligence, and Auto-Fix systems.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { AgentDashboardProvider } from './providers/AgentDashboardProvider';
import { SnippetBarProvider } from './providers/SnippetBarProvider';
import { FunctionNotebookProvider } from './providers/FunctionNotebookProvider';
import { FixCenterProvider } from './providers/FixCenterProvider';
import { MCPOrchestratorClient } from './clients/MCPOrchestratorClient';
import { CodeIntelligenceClient } from './clients/CodeIntelligenceClient';
import { AutoFixClient } from './clients/AutoFixClient';
import { TelemetryService } from './services/TelemetryService';
import { ConfigurationService } from './services/ConfigurationService';
import { NotificationService } from './services/NotificationService';
import { StatusBarService } from './services/StatusBarService';
import { CommandService } from './services/CommandService';

/**
 * Extension context and services
 */
interface ExtensionServices {
  orchestratorClient: MCPOrchestratorClient;
  codeIntelligenceClient: CodeIntelligenceClient;
  autoFixClient: AutoFixClient;
  telemetryService: TelemetryService;
  configurationService: ConfigurationService;
  notificationService: NotificationService;
  statusBarService: StatusBarService;
  commandService: CommandService;
}

let extensionServices: ExtensionServices | undefined;

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('Git Memory MCP IDE Extension is being activated...');
  
  try {
    // Initialize services
    extensionServices = await initializeServices(context);
    
    // Register providers
    await registerProviders(context, extensionServices);
    
    // Register commands
    await registerCommands(context, extensionServices);
    
    // Setup event listeners
    setupEventListeners(context, extensionServices);
    
    // Set context for when clauses
    await vscode.commands.executeCommand('setContext', 'gitMemoryMCP.enabled', true);
    
    // Show activation notification
    if (extensionServices.configurationService.get('ui.showNotifications')) {
      extensionServices.notificationService.showInfo(
        'Git Memory MCP IDE Extension activated successfully! 🚀'
      );
    }
    
    // Update status bar
    extensionServices.statusBarService.updateStatus('ready', 'Git Memory MCP: Ready');
    
    console.log('Git Memory MCP IDE Extension activated successfully');
    
  } catch (error) {
    console.error('Failed to activate Git Memory MCP IDE Extension:', error);
    
    vscode.window.showErrorMessage(
      `Failed to activate Git Memory MCP IDE Extension: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    
    throw error;
  }
}

/**
 * Extension deactivation
 */
export async function deactivate(): Promise<void> {
  console.log('Git Memory MCP IDE Extension is being deactivated...');
  
  try {
    if (extensionServices) {
      // Stop auto-fix if running
      await extensionServices.autoFixClient.stop();
      
      // Disconnect from orchestrator
      await extensionServices.orchestratorClient.disconnect();
      
      // Clean up telemetry
      extensionServices.telemetryService.dispose();
      
      // Clean up status bar
      extensionServices.statusBarService.dispose();
    }
    
    console.log('Git Memory MCP IDE Extension deactivated successfully');
    
  } catch (error) {
    console.error('Error during extension deactivation:', error);
  }
}

/**
 * Initialize all extension services
 */
async function initializeServices(context: vscode.ExtensionContext): Promise<ExtensionServices> {
  // Configuration service (must be first)
  const configurationService = new ConfigurationService();
  
  // Notification service
  const notificationService = new NotificationService(configurationService);
  
  // Status bar service
  const statusBarService = new StatusBarService();
  
  // Telemetry service
  const telemetryService = new TelemetryService(configurationService);
  
  // Get server path (assume it's in the parent directory)
  const serverPath = path.join(context.extensionPath, '..', 'src');
  
  // MCP Orchestrator client
  const orchestratorClient = new MCPOrchestratorClient({
    serverPath,
    maxAgents: configurationService.get('orchestrator.maxAgents'),
    maxConcurrentTasks: configurationService.get('orchestrator.maxConcurrentTasks'),
    connectionTimeout: configurationService.get('orchestrator.connectionTimeout')
  });
  
  // Code Intelligence client
  const codeIntelligenceClient = new CodeIntelligenceClient({
    serverPath,
    snippetMiner: {
      enabled: configurationService.get('snippetMiner.enabled'),
      minFrequency: configurationService.get('snippetMiner.minFrequency'),
      maxSnippets: configurationService.get('snippetMiner.maxSnippets')
    }
  });
  
  // Auto-Fix client
  const autoFixClient = new AutoFixClient({
    serverPath,
    enabled: configurationService.get('autoFix.enabled'),
    autoApproval: configurationService.get('autoFix.autoApproval'),
    dryRun: configurationService.get('autoFix.dryRun')
  });
  
  // Command service
  const commandService = new CommandService({
    orchestratorClient,
    codeIntelligenceClient,
    autoFixClient,
    notificationService,
    statusBarService,
    telemetryService
  });
  
  // Initialize clients
  statusBarService.updateStatus('initializing', 'Git Memory MCP: Initializing...');
  
  try {
    await Promise.all([
      orchestratorClient.initialize(),
      codeIntelligenceClient.initialize(),
      autoFixClient.initialize()
    ]);
    
    // Start telemetry if enabled
    if (configurationService.get('telemetry.enabled')) {
      telemetryService.start();
    }
    
  } catch (error) {
    statusBarService.updateStatus('error', 'Git Memory MCP: Initialization Failed');
    throw error;
  }
  
  return {
    orchestratorClient,
    codeIntelligenceClient,
    autoFixClient,
    telemetryService,
    configurationService,
    notificationService,
    statusBarService,
    commandService
  };
}

/**
 * Register tree data providers
 */
async function registerProviders(context: vscode.ExtensionContext, services: ExtensionServices): Promise<void> {
  // Agent Dashboard Provider
  const agentDashboardProvider = new AgentDashboardProvider(services.orchestratorClient);
  const agentDashboardView = vscode.window.createTreeView('gitMemoryMCP.agentDashboard', {
    treeDataProvider: agentDashboardProvider,
    showCollapseAll: true
  });
  context.subscriptions.push(agentDashboardView);
  
  // Snippet Bar Provider
  const snippetBarProvider = new SnippetBarProvider(services.codeIntelligenceClient);
  const snippetBarView = vscode.window.createTreeView('gitMemoryMCP.snippetBar', {
    treeDataProvider: snippetBarProvider,
    showCollapseAll: true
  });
  context.subscriptions.push(snippetBarView);
  
  // Function Notebook Provider
  const functionNotebookProvider = new FunctionNotebookProvider(services.codeIntelligenceClient);
  const functionNotebookView = vscode.window.createTreeView('gitMemoryMCP.functionNotebook', {
    treeDataProvider: functionNotebookProvider,
    showCollapseAll: true
  });
  context.subscriptions.push(functionNotebookView);
  
  // Fix Center Provider
  const fixCenterProvider = new FixCenterProvider(services.autoFixClient);
  const fixCenterView = vscode.window.createTreeView('gitMemoryMCP.fixCenter', {
    treeDataProvider: fixCenterProvider,
    showCollapseAll: true
  });
  context.subscriptions.push(fixCenterView);
  
  // Setup refresh handlers
  services.orchestratorClient.on('agents_updated', () => {
    agentDashboardProvider.refresh();
  });
  
  services.codeIntelligenceClient.on('snippets_updated', () => {
    snippetBarProvider.refresh();
  });
  
  services.codeIntelligenceClient.on('patterns_updated', () => {
    functionNotebookProvider.refresh();
  });
  
  services.autoFixClient.on('issues_updated', () => {
    fixCenterProvider.refresh();
  });
}

/**
 * Register extension commands
 */
async function registerCommands(context: vscode.ExtensionContext, services: ExtensionServices): Promise<void> {
  const commands = [
    // Dashboard commands
    vscode.commands.registerCommand('gitMemoryMCP.openAgentDashboard', 
      () => services.commandService.openAgentDashboard()),
    
    vscode.commands.registerCommand('gitMemoryMCP.refreshAgents', 
      () => services.commandService.refreshAgents()),
    
    // Snippet commands
    vscode.commands.registerCommand('gitMemoryMCP.openSnippetBar', 
      () => services.commandService.openSnippetBar()),
    
    vscode.commands.registerCommand('gitMemoryMCP.mineSnippets', 
      () => services.commandService.mineSnippets()),
    
    vscode.commands.registerCommand('gitMemoryMCP.applySnippet', 
      (snippet) => services.commandService.applySnippet(snippet)),
    
    // Function Notebook commands
    vscode.commands.registerCommand('gitMemoryMCP.openFunctionNotebook', 
      () => services.commandService.openFunctionNotebook()),
    
    vscode.commands.registerCommand('gitMemoryMCP.applyPattern', 
      (pattern) => services.commandService.applyPattern(pattern)),
    
    // Auto-Fix commands
    vscode.commands.registerCommand('gitMemoryMCP.openFixCenter', 
      () => services.commandService.openFixCenter()),
    
    vscode.commands.registerCommand('gitMemoryMCP.startAutoFix', 
      () => services.commandService.startAutoFix()),
    
    vscode.commands.registerCommand('gitMemoryMCP.stopAutoFix', 
      () => services.commandService.stopAutoFix()),
    
    vscode.commands.registerCommand('gitMemoryMCP.processIssue', 
      (issue) => services.commandService.processIssue(issue)),
    
    // Logs & Trace commands
    vscode.commands.registerCommand('gitMemoryMCP.openLogsTrace', 
      () => services.commandService.openLogsTrace())
  ];
  
  // Register all commands
  commands.forEach(command => {
    context.subscriptions.push(command);
  });
}

/**
 * Setup event listeners
 */
function setupEventListeners(context: vscode.ExtensionContext, services: ExtensionServices): void {
  // Configuration change listener
  const configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('gitMemoryMCP')) {
      services.configurationService.refresh();
      
      // Update services based on new configuration
      if (event.affectsConfiguration('gitMemoryMCP.telemetry.enabled')) {
        if (services.configurationService.get('telemetry.enabled')) {
          services.telemetryService.start();
        } else {
          services.telemetryService.stop();
        }
      }
    }
  });
  context.subscriptions.push(configChangeListener);
  
  // File system watchers for auto-mining
  if (services.configurationService.get('snippetMiner.enabled')) {
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,js,py,java,cpp,c,go,rs}');
    
    fileWatcher.onDidChange(uri => {
      // Debounce snippet mining
      services.codeIntelligenceClient.scheduleSnippetMining(uri.fsPath);
    });
    
    context.subscriptions.push(fileWatcher);
  }
  
  // Document change listener for real-time analysis
  const documentChangeListener = vscode.workspace.onDidChangeTextDocument(event => {
    if (event.document.languageId && event.contentChanges.length > 0) {
      // Schedule analysis for changed document
      services.codeIntelligenceClient.scheduleAnalysis(event.document.uri.fsPath);
    }
  });
  context.subscriptions.push(documentChangeListener);
  
  // Active editor change listener
  const activeEditorChangeListener = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      // Update context-aware snippets
      services.codeIntelligenceClient.updateContext({
        file: editor.document.uri.fsPath,
        language: editor.document.languageId,
        position: editor.selection.active
      });
    }
  });
  context.subscriptions.push(activeEditorChangeListener);
  
  // Selection change listener for context-aware suggestions
  const selectionChangeListener = vscode.window.onDidChangeTextEditorSelection(event => {
    if (event.textEditor && event.selections.length > 0) {
      const selection = event.selections[0];
      if (!selection.isEmpty) {
        // Update context for selected text
        services.codeIntelligenceClient.updateContext({
          file: event.textEditor.document.uri.fsPath,
          language: event.textEditor.document.languageId,
          position: selection.active,
          selectedText: event.textEditor.document.getText(selection)
        });
      }
    }
  });
  context.subscriptions.push(selectionChangeListener);
  
  // Error handling for services
  services.orchestratorClient.on('error', (error: Error) => {
    console.error('Orchestrator error:', error);
    services.statusBarService.updateStatus('error', 'Git Memory MCP: Orchestrator Error');
    
    if (services.configurationService.get('ui.showNotifications')) {
      services.notificationService.showError(`Orchestrator Error: ${error.message}`);
    }
  });
  
  services.codeIntelligenceClient.on('error', (error: Error) => {
    console.error('Code Intelligence error:', error);
    
    if (services.configurationService.get('ui.showNotifications')) {
      services.notificationService.showError(`Code Intelligence Error: ${error.message}`);
    }
  });
  
  services.autoFixClient.on('error', (error: Error) => {
    console.error('Auto-Fix error:', error);
    
    if (services.configurationService.get('ui.showNotifications')) {
      services.notificationService.showError(`Auto-Fix Error: ${error.message}`);
    }
  });
  
  // Success notifications
  services.autoFixClient.on('fix_applied', (fix: any) => {
    if (services.configurationService.get('ui.showNotifications')) {
      services.notificationService.showInfo(`Fix applied successfully: ${fix.description}`);
    }
    
    services.telemetryService.recordEvent('fix_applied', {
      fixId: fix.id,
      fixType: fix.type,
      success: true
    });
  });
  
  services.codeIntelligenceClient.on('snippets_mined', (count: number) => {
    if (services.configurationService.get('ui.showNotifications')) {
      services.notificationService.showInfo(`Found ${count} new code snippets`);
    }
    
    services.telemetryService.recordEvent('snippets_mined', {
      count,
      timestamp: Date.now()
    });
  });
}

/**
 * Get extension services (for testing)
 */
export function getExtensionServices(): ExtensionServices | undefined {
  return extensionServices;
}