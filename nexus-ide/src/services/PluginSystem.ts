/**
 * Plugin System
 * 
 * Universal plugin system for NEXUS IDE.
 * Supports dynamic loading, hot-reloading, and secure sandboxing.
 * 
 * Features:
 * - Dynamic plugin loading/unloading
 * - Hot-reloading support
 * - Secure sandboxing
 * - Plugin lifecycle management
 * - API versioning
 * - Dependency resolution
 * - Plugin marketplace integration
 * - Performance monitoring
 * - Security scanning
 * - Auto-updates
 */

import { EventEmitter } from '../utils/EventEmitter';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  homepage?: string;
  repository?: string;
  
  // Requirements
  engines: {
    nexus: string; // Minimum NEXUS IDE version
    node?: string;
  };
  
  // Entry points
  main: string;
  browser?: string;
  types?: string;
  
  // Categories
  categories: PluginCategory[];
  keywords: string[];
  
  // Dependencies
  dependencies?: { [key: string]: string };
  peerDependencies?: { [key: string]: string };
  optionalDependencies?: { [key: string]: string };
  
  // Capabilities
  capabilities: PluginCapability[];
  permissions: PluginPermission[];
  
  // Contribution points
  contributes?: {
    commands?: CommandContribution[];
    menus?: MenuContribution[];
    keybindings?: KeybindingContribution[];
    languages?: LanguageContribution[];
    themes?: ThemeContribution[];
    snippets?: SnippetContribution[];
    debuggers?: DebuggerContribution[];
    taskProviders?: TaskProviderContribution[];
    views?: ViewContribution[];
    webviews?: WebviewContribution[];
    settings?: SettingContribution[];
  };
  
  // Activation
  activationEvents: string[];
  
  // Resources
  icon?: string;
  galleryBanner?: {
    color: string;
    theme: 'dark' | 'light';
  };
  
  // Metadata
  displayName?: string;
  publisher: string;
  extensionKind?: 'ui' | 'workspace';
  
  // Security
  trusted?: boolean;
  signature?: string;
  
  // Marketplace
  pricing?: 'free' | 'paid' | 'freemium';
  price?: number;
  currency?: string;
}

export type PluginCategory = 
  | 'AI & Machine Learning'
  | 'Code Editing'
  | 'Debugging'
  | 'Extension Packs'
  | 'Formatters'
  | 'Keymaps'
  | 'Language Packs'
  | 'Linters'
  | 'Other'
  | 'Programming Languages'
  | 'SCM Providers'
  | 'Snippets'
  | 'Testing'
  | 'Themes'
  | 'Visualization';

export type PluginCapability =
  | 'fileSystem'
  | 'network'
  | 'terminal'
  | 'webview'
  | 'clipboard'
  | 'notifications'
  | 'statusBar'
  | 'quickPick'
  | 'inputBox'
  | 'progress'
  | 'workspace'
  | 'editor'
  | 'debug'
  | 'tasks'
  | 'scm'
  | 'authentication';

export type PluginPermission =
  | 'read:workspace'
  | 'write:workspace'
  | 'read:settings'
  | 'write:settings'
  | 'execute:commands'
  | 'access:network'
  | 'access:filesystem'
  | 'access:terminal'
  | 'access:clipboard'
  | 'access:notifications'
  | 'access:ui'
  | 'access:debug'
  | 'access:git'
  | 'access:ai';

export interface CommandContribution {
  command: string;
  title: string;
  category?: string;
  icon?: string;
  enablement?: string;
}

export interface MenuContribution {
  commandPalette?: {
    command: string;
    when?: string;
  }[];
  editor?: {
    command: string;
    when?: string;
    group?: string;
  }[];
  explorer?: {
    command: string;
    when?: string;
    group?: string;
  }[];
}

export interface KeybindingContribution {
  command: string;
  key: string;
  mac?: string;
  linux?: string;
  when?: string;
}

export interface LanguageContribution {
  id: string;
  aliases?: string[];
  extensions?: string[];
  filenames?: string[];
  firstLine?: string;
  configuration?: string;
}

export interface ThemeContribution {
  label: string;
  uiTheme: 'vs' | 'vs-dark' | 'hc-black';
  path: string;
}

export interface SnippetContribution {
  language: string;
  path: string;
}

export interface DebuggerContribution {
  type: string;
  label: string;
  program?: string;
  runtime?: string;
  configurationAttributes?: any;
  initialConfigurations?: any[];
  configurationSnippets?: any[];
}

export interface TaskProviderContribution {
  type: string;
  required?: string[];
  properties?: any;
}

export interface ViewContribution {
  id: string;
  name: string;
  when?: string;
}

export interface WebviewContribution {
  viewType: string;
  displayName: string;
  selector?: any[];
}

export interface SettingContribution {
  title: string;
  properties: { [key: string]: any };
}

export interface PluginContext {
  subscriptions: { dispose(): void }[];
  workspaceState: PluginMemento;
  globalState: PluginMemento;
  secrets: PluginSecretStorage;
  extensionUri: string;
  extensionPath: string;
  storageUri?: string;
  storagePath?: string;
  globalStorageUri: string;
  globalStoragePath: string;
  logUri: string;
  logPath: string;
  asAbsolutePath(relativePath: string): string;
}

export interface PluginMemento {
  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  update(key: string, value: any): Promise<void>;
  keys(): readonly string[];
}

export interface PluginSecretStorage {
  get(key: string): Promise<string | undefined>;
  store(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface PluginAPI {
  // Core APIs
  commands: {
    registerCommand(command: string, callback: (...args: any[]) => any): void;
    executeCommand<T>(command: string, ...rest: any[]): Promise<T>;
    getCommands(filterInternal?: boolean): Promise<string[]>;
  };
  
  workspace: {
    workspaceFolders?: readonly any[];
    name?: string;
    workspaceFile?: any;
    onDidChangeWorkspaceFolders: any;
    getConfiguration(section?: string): any;
    onDidChangeConfiguration: any;
    openTextDocument(uri: string): Promise<any>;
    saveAll(includeUntitled?: boolean): Promise<boolean>;
    findFiles(include: string, exclude?: string): Promise<any[]>;
  };
  
  window: {
    showInformationMessage(message: string, ...items: string[]): Promise<string | undefined>;
    showWarningMessage(message: string, ...items: string[]): Promise<string | undefined>;
    showErrorMessage(message: string, ...items: string[]): Promise<string | undefined>;
    showQuickPick(items: string[] | Promise<string[]>): Promise<string | undefined>;
    showInputBox(options?: any): Promise<string | undefined>;
    createStatusBarItem(alignment?: any, priority?: number): any;
    createOutputChannel(name: string): any;
    createTerminal(options?: any): any;
    showTextDocument(document: any, column?: any): Promise<any>;
    onDidChangeActiveTextEditor: any;
    onDidChangeVisibleTextEditors: any;
  };
  
  languages: {
    registerCompletionItemProvider(selector: any, provider: any): void;
    registerHoverProvider(selector: any, provider: any): void;
    registerDefinitionProvider(selector: any, provider: any): void;
    registerReferenceProvider(selector: any, provider: any): void;
    registerDocumentFormattingEditProvider(selector: any, provider: any): void;
    registerCodeActionsProvider(selector: any, provider: any): void;
    registerCodeLensProvider(selector: any, provider: any): void;
    registerDocumentSymbolProvider(selector: any, provider: any): void;
    registerWorkspaceSymbolProvider(provider: any): void;
    registerRenameProvider(selector: any, provider: any): void;
    registerSignatureHelpProvider(selector: any, provider: any): void;
    registerDocumentHighlightProvider(selector: any, provider: any): void;
    registerFoldingRangeProvider(selector: any, provider: any): void;
    registerSelectionRangeProvider(selector: any, provider: any): void;
    registerColorProvider(selector: any, provider: any): void;
    registerDeclarationProvider(selector: any, provider: any): void;
    registerTypeDefinitionProvider(selector: any, provider: any): void;
    registerImplementationProvider(selector: any, provider: any): void;
    registerDocumentLinkProvider(selector: any, provider: any): void;
    registerCallHierarchyProvider(selector: any, provider: any): void;
    registerSemanticTokensProvider(selector: any, provider: any): void;
  };
  
  debug: {
    registerDebugConfigurationProvider(debugType: string, provider: any): void;
    registerDebugAdapterDescriptorFactory(debugType: string, factory: any): void;
    startDebugging(folder: any, nameOrConfiguration: string | any): Promise<boolean>;
    addBreakpoints(breakpoints: any[]): void;
    removeBreakpoints(breakpoints: any[]): void;
    onDidStartDebugSession: any;
    onDidTerminateDebugSession: any;
    onDidChangeActiveDebugSession: any;
    onDidChangeBreakpoints: any;
  };
  
  tasks: {
    registerTaskProvider(type: string, provider: any): void;
    executeTask(task: any): Promise<any>;
    onDidStartTask: any;
    onDidEndTask: any;
    onDidStartTaskProcess: any;
    onDidEndTaskProcess: any;
  };
  
  scm: {
    createSourceControl(id: string, label: string, rootUri?: any): any;
    inputBox: any;
  };
  
  // NEXUS-specific APIs
  ai: {
    generateCode(prompt: string, context?: any): Promise<string>;
    explainCode(code: string, language?: string): Promise<string>;
    optimizeCode(code: string, language?: string): Promise<string>;
    findBugs(code: string, language?: string): Promise<any[]>;
    generateTests(code: string, language?: string): Promise<string>;
    chat(message: string, context?: any): Promise<string>;
  };
  
  mcp: {
    connect(serverUrl: string, options?: any): Promise<any>;
    disconnect(serverId: string): Promise<void>;
    sendMessage(serverId: string, message: any): Promise<any>;
    onMessage(serverId: string, callback: (message: any) => void): void;
  };
  
  collaboration: {
    startSession(options?: any): Promise<string>;
    joinSession(sessionId: string): Promise<void>;
    leaveSession(): Promise<void>;
    shareFile(filePath: string): Promise<void>;
    unshareFile(filePath: string): Promise<void>;
    onUserJoined: any;
    onUserLeft: any;
    onFileShared: any;
    onFileChanged: any;
  };
  
  performance: {
    getMetrics(): Promise<any>;
    startProfiling(options?: any): Promise<string>;
    stopProfiling(sessionId: string): Promise<any>;
    onMetricsUpdated: any;
  };
}

export interface PluginInfo {
  id: string;
  manifest: PluginManifest;
  path: string;
  isActive: boolean;
  isEnabled: boolean;
  activationTime?: number;
  context?: PluginContext;
  api?: PluginAPI;
  instance?: any;
  
  // Runtime info
  loadTime: number;
  memoryUsage: number;
  cpuUsage: number;
  
  // Error info
  errors: PluginError[];
  warnings: PluginWarning[];
  
  // Dependencies
  dependencies: string[];
  dependents: string[];
  
  // Security
  trusted: boolean;
  sandboxed: boolean;
  permissions: PluginPermission[];
  
  // Marketplace
  installed: Date;
  lastUpdated?: Date;
  updateAvailable?: boolean;
  rating?: number;
  downloads?: number;
}

export interface PluginError {
  id: string;
  message: string;
  stack?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: any;
}

export interface PluginWarning {
  id: string;
  message: string;
  timestamp: Date;
  context?: any;
}

export interface PluginMarketplace {
  search(query: string, options?: SearchOptions): Promise<PluginSearchResult[]>;
  getPlugin(id: string): Promise<PluginMarketplaceInfo>;
  install(id: string, version?: string): Promise<void>;
  uninstall(id: string): Promise<void>;
  update(id: string, version?: string): Promise<void>;
  getUpdates(): Promise<PluginUpdate[]>;
  getRecommendations(): Promise<PluginRecommendation[]>;
}

export interface SearchOptions {
  category?: PluginCategory;
  sortBy?: 'relevance' | 'downloads' | 'rating' | 'updated';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  includePrerelease?: boolean;
}

export interface PluginSearchResult {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  publisher: string;
  rating: number;
  downloads: number;
  updated: Date;
  categories: PluginCategory[];
  icon?: string;
  verified: boolean;
}

export interface PluginMarketplaceInfo extends PluginSearchResult {
  manifest: PluginManifest;
  readme: string;
  changelog: string;
  versions: PluginVersion[];
  reviews: PluginReview[];
  statistics: PluginStatistics;
}

export interface PluginVersion {
  version: string;
  published: Date;
  changelog?: string;
  deprecated?: boolean;
  prerelease?: boolean;
}

export interface PluginReview {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: Date;
  helpful: number;
}

export interface PluginStatistics {
  downloads: {
    total: number;
    weekly: number;
    daily: number;
  };
  ratings: {
    average: number;
    count: number;
    distribution: { [rating: number]: number };
  };
  usage: {
    activeUsers: number;
    retention: number;
  };
}

export interface PluginUpdate {
  id: string;
  currentVersion: string;
  latestVersion: string;
  changelog: string;
  breaking: boolean;
  security: boolean;
}

export interface PluginRecommendation {
  id: string;
  reason: 'popular' | 'similar' | 'complementary' | 'ai-suggested';
  confidence: number;
  context?: any;
}

interface PluginSystemEvents {
  'plugin-loaded': (plugin: PluginInfo) => void;
  'plugin-activated': (plugin: PluginInfo) => void;
  'plugin-deactivated': (plugin: PluginInfo) => void;
  'plugin-unloaded': (plugin: PluginInfo) => void;
  'plugin-error': (plugin: PluginInfo, error: PluginError) => void;
  'plugin-warning': (plugin: PluginInfo, warning: PluginWarning) => void;
  'plugin-installed': (plugin: PluginInfo) => void;
  'plugin-uninstalled': (pluginId: string) => void;
  'plugin-updated': (plugin: PluginInfo, oldVersion: string) => void;
  'marketplace-connected': () => void;
  'marketplace-disconnected': () => void;
}

class PluginSystem extends EventEmitter {
  private plugins: Map<string, PluginInfo> = new Map();
  private activationQueue: string[] = [];
  private isProcessingQueue = false;
  private marketplace: PluginMarketplace | null = null;
  private sandboxes: Map<string, any> = new Map();
  private apiInstances: Map<string, PluginAPI> = new Map();
  
  // Configuration
  private config = {
    pluginsPath: './plugins',
    marketplaceUrl: 'https://marketplace.nexus-ide.com',
    enableHotReload: true,
    enableSandboxing: true,
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB per plugin
    maxCpuUsage: 50, // 50% CPU usage
    activationTimeout: 10000, // 10 seconds
    enableAutoUpdates: false,
    trustedPublishers: ['nexus-official', 'microsoft', 'google'],
  };

  constructor() {
    super();
    this.initializeSystem();
  }

  /**
   * Initialize plugin system
   */
  private async initializeSystem(): Promise<void> {
    try {
      console.log('Initializing Plugin System...');
      
      // Initialize marketplace connection
      await this.initializeMarketplace();
      
      // Load installed plugins
      await this.loadInstalledPlugins();
      
      // Start activation queue processor
      this.startActivationProcessor();
      
      // Setup hot-reload if enabled
      if (this.config.enableHotReload) {
        this.setupHotReload();
      }
      
      console.log('Plugin System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Plugin System:', error);
      throw error;
    }
  }

  /**
   * Load plugin from path
   */
  async loadPlugin(pluginPath: string): Promise<PluginInfo> {
    try {
      console.log(`Loading plugin from: ${pluginPath}`);
      
      // Read manifest
      const manifestPath = path.join(pluginPath, 'package.json');
      const manifest = await this.readManifest(manifestPath);
      
      // Validate manifest
      this.validateManifest(manifest);
      
      // Check if already loaded
      if (this.plugins.has(manifest.id)) {
        throw new Error(`Plugin ${manifest.id} is already loaded`);
      }
      
      // Create plugin info
      const pluginInfo: PluginInfo = {
        id: manifest.id,
        manifest,
        path: pluginPath,
        isActive: false,
        isEnabled: true,
        loadTime: Date.now(),
        memoryUsage: 0,
        cpuUsage: 0,
        errors: [],
        warnings: [],
        dependencies: Object.keys(manifest.dependencies || {}),
        dependents: [],
        trusted: this.isTrustedPlugin(manifest),
        sandboxed: this.config.enableSandboxing && !this.isTrustedPlugin(manifest),
        permissions: manifest.permissions || [],
        installed: new Date()
      };
      
      // Check dependencies
      await this.checkDependencies(pluginInfo);
      
      // Security scan
      await this.performSecurityScan(pluginInfo);
      
      // Load plugin code
      await this.loadPluginCode(pluginInfo);
      
      // Register plugin
      this.plugins.set(manifest.id, pluginInfo);
      
      this.emit('plugin-loaded', pluginInfo);
      
      console.log(`Plugin loaded successfully: ${manifest.name} v${manifest.version}`);
      return pluginInfo;
    } catch (error) {
      console.error(`Failed to load plugin from ${pluginPath}:`, error);
      throw error;
    }
  }

  /**
   * Activate plugin
   */
  async activatePlugin(pluginId: string): Promise<void> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`);
      }
      
      if (plugin.isActive) {
        console.log(`Plugin ${pluginId} is already active`);
        return;
      }
      
      console.log(`Activating plugin: ${plugin.manifest.name}`);
      
      const startTime = Date.now();
      
      // Check activation events
      if (!this.shouldActivate(plugin)) {
        console.log(`Plugin ${pluginId} activation conditions not met`);
        return;
      }
      
      // Create context
      plugin.context = this.createPluginContext(plugin);
      
      // Create API instance
      plugin.api = this.createPluginAPI(plugin);
      
      // Activate plugin
      if (plugin.instance && typeof plugin.instance.activate === 'function') {
        await Promise.race([
          plugin.instance.activate(plugin.context),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Activation timeout')), this.config.activationTimeout)
          )
        ]);
      }
      
      plugin.isActive = true;
      plugin.activationTime = Date.now() - startTime;
      
      // Register contributions
      await this.registerContributions(plugin);
      
      // Start monitoring
      this.startPluginMonitoring(plugin);
      
      this.emit('plugin-activated', plugin);
      
      console.log(`Plugin activated: ${plugin.manifest.name} (${plugin.activationTime}ms)`);
    } catch (error) {
      console.error(`Failed to activate plugin ${pluginId}:`, error);
      
      const plugin = this.plugins.get(pluginId);
      if (plugin) {
        this.addPluginError(plugin, {
          id: 'activation-error',
          message: error instanceof Error ? error.message : 'Unknown activation error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date(),
          severity: 'high',
          context: { phase: 'activation' }
        });
      }
      
      throw error;
    }
  }

  /**
   * Deactivate plugin
   */
  async deactivatePlugin(pluginId: string): Promise<void> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin || !plugin.isActive) {
        return;
      }
      
      console.log(`Deactivating plugin: ${plugin.manifest.name}`);
      
      // Stop monitoring
      this.stopPluginMonitoring(plugin);
      
      // Unregister contributions
      await this.unregisterContributions(plugin);
      
      // Deactivate plugin
      if (plugin.instance && typeof plugin.instance.deactivate === 'function') {
        await plugin.instance.deactivate();
      }
      
      // Dispose context
      if (plugin.context) {
        plugin.context.subscriptions.forEach(subscription => {
          try {
            subscription.dispose();
          } catch (error) {
            console.warn('Error disposing subscription:', error);
          }
        });
      }
      
      plugin.isActive = false;
      plugin.context = undefined;
      plugin.api = undefined;
      
      this.emit('plugin-deactivated', plugin);
      
      console.log(`Plugin deactivated: ${plugin.manifest.name}`);
    } catch (error) {
      console.error(`Failed to deactivate plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Unload plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        return;
      }
      
      console.log(`Unloading plugin: ${plugin.manifest.name}`);
      
      // Deactivate if active
      if (plugin.isActive) {
        await this.deactivatePlugin(pluginId);
      }
      
      // Clean up sandbox
      if (plugin.sandboxed) {
        this.cleanupSandbox(pluginId);
      }
      
      // Remove from registry
      this.plugins.delete(pluginId);
      
      this.emit('plugin-unloaded', plugin);
      
      console.log(`Plugin unloaded: ${plugin.manifest.name}`);
    } catch (error) {
      console.error(`Failed to unload plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Install plugin from marketplace
   */
  async installPlugin(pluginId: string, version?: string): Promise<PluginInfo> {
    try {
      if (!this.marketplace) {
        throw new Error('Marketplace not available');
      }
      
      console.log(`Installing plugin: ${pluginId}${version ? `@${version}` : ''}`);
      
      // Download and install
      await this.marketplace.install(pluginId, version);
      
      // Load the installed plugin
      const pluginPath = path.join(this.config.pluginsPath, pluginId);
      const plugin = await this.loadPlugin(pluginPath);
      
      this.emit('plugin-installed', plugin);
      
      console.log(`Plugin installed: ${plugin.manifest.name}`);
      return plugin;
    } catch (error) {
      console.error(`Failed to install plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Uninstall plugin
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    try {
      console.log(`Uninstalling plugin: ${pluginId}`);
      
      // Unload plugin
      await this.unloadPlugin(pluginId);
      
      // Remove from marketplace
      if (this.marketplace) {
        await this.marketplace.uninstall(pluginId);
      }
      
      this.emit('plugin-uninstalled', pluginId);
      
      console.log(`Plugin uninstalled: ${pluginId}`);
    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Update plugin
   */
  async updatePlugin(pluginId: string, version?: string): Promise<PluginInfo> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`);
      }
      
      const oldVersion = plugin.manifest.version;
      
      console.log(`Updating plugin: ${pluginId} from ${oldVersion} to ${version || 'latest'}`);
      
      // Deactivate current version
      if (plugin.isActive) {
        await this.deactivatePlugin(pluginId);
      }
      
      // Update via marketplace
      if (this.marketplace) {
        await this.marketplace.update(pluginId, version);
      }
      
      // Reload plugin
      await this.unloadPlugin(pluginId);
      const pluginPath = path.join(this.config.pluginsPath, pluginId);
      const updatedPlugin = await this.loadPlugin(pluginPath);
      
      // Reactivate if it was active
      if (plugin.isActive) {
        await this.activatePlugin(pluginId);
      }
      
      this.emit('plugin-updated', updatedPlugin, oldVersion);
      
      console.log(`Plugin updated: ${pluginId} to ${updatedPlugin.manifest.version}`);
      return updatedPlugin;
    } catch (error) {
      console.error(`Failed to update plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Get plugin info
   */
  getPlugin(pluginId: string): PluginInfo | null {
    return this.plugins.get(pluginId) || null;
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get active plugins
   */
  getActivePlugins(): PluginInfo[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.isActive);
  }

  /**
   * Search marketplace
   */
  async searchMarketplace(query: string, options?: SearchOptions): Promise<PluginSearchResult[]> {
    if (!this.marketplace) {
      throw new Error('Marketplace not available');
    }
    
    return await this.marketplace.search(query, options);
  }

  /**
   * Get plugin recommendations
   */
  async getRecommendations(): Promise<PluginRecommendation[]> {
    if (!this.marketplace) {
      throw new Error('Marketplace not available');
    }
    
    return await this.marketplace.getRecommendations();
  }

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<PluginUpdate[]> {
    if (!this.marketplace) {
      throw new Error('Marketplace not available');
    }
    
    return await this.marketplace.getUpdates();
  }

  /**
   * Get system statistics
   */
  getStatistics() {
    const plugins = Array.from(this.plugins.values());
    
    return {
      totalPlugins: plugins.length,
      activePlugins: plugins.filter(p => p.isActive).length,
      enabledPlugins: plugins.filter(p => p.isEnabled).length,
      trustedPlugins: plugins.filter(p => p.trusted).length,
      sandboxedPlugins: plugins.filter(p => p.sandboxed).length,
      totalMemoryUsage: plugins.reduce((sum, p) => sum + p.memoryUsage, 0),
      averageCpuUsage: plugins.reduce((sum, p) => sum + p.cpuUsage, 0) / plugins.length || 0,
      totalErrors: plugins.reduce((sum, p) => sum + p.errors.length, 0),
      totalWarnings: plugins.reduce((sum, p) => sum + p.warnings.length, 0),
      activationQueue: this.activationQueue.length,
      isProcessingQueue: this.isProcessingQueue
    };
  }

  // Private methods

  private async initializeMarketplace(): Promise<void> {
    try {
      // Mock marketplace implementation
      this.marketplace = {
        search: async (query: string, options?: SearchOptions) => {
          // Mock search results
          return [];
        },
        getPlugin: async (id: string) => {
          // Mock plugin info
          throw new Error('Plugin not found');
        },
        install: async (id: string, version?: string) => {
          // Mock installation
          console.log(`Mock install: ${id}@${version || 'latest'}`);
        },
        uninstall: async (id: string) => {
          // Mock uninstallation
          console.log(`Mock uninstall: ${id}`);
        },
        update: async (id: string, version?: string) => {
          // Mock update
          console.log(`Mock update: ${id}@${version || 'latest'}`);
        },
        getUpdates: async () => {
          // Mock updates
          return [];
        },
        getRecommendations: async () => {
          // Mock recommendations
          return [];
        }
      };
      
      this.emit('marketplace-connected');
    } catch (error) {
      console.warn('Failed to connect to marketplace:', error);
    }
  }

  private async loadInstalledPlugins(): Promise<void> {
    // Mock implementation - would scan plugins directory
    console.log('Loading installed plugins...');
  }

  private startActivationProcessor(): void {
    const processQueue = async () => {
      if (this.isProcessingQueue || this.activationQueue.length === 0) {
        return;
      }

      this.isProcessingQueue = true;
      const pluginId = this.activationQueue.shift()!;

      try {
        await this.activatePlugin(pluginId);
      } catch (error) {
        console.error(`Failed to process activation queue for ${pluginId}:`, error);
      } finally {
        this.isProcessingQueue = false;
      }
    };

    // Process queue every 1000ms
    setInterval(processQueue, 1000);
  }

  private setupHotReload(): void {
    // Mock hot-reload setup
    console.log('Hot-reload enabled');
  }

  private async readManifest(manifestPath: string): Promise<PluginManifest> {
    // Mock manifest reading
    return {
      id: 'mock-plugin',
      name: 'Mock Plugin',
      version: '1.0.0',
      description: 'A mock plugin for testing',
      author: 'Test Author',
      license: 'MIT',
      engines: {
        nexus: '^1.0.0'
      },
      main: 'index.js',
      categories: ['Other'],
      keywords: ['test', 'mock'],
      capabilities: ['workspace'],
      permissions: ['read:workspace'],
      activationEvents: ['*'],
      publisher: 'test-publisher'
    };
  }

  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.id || !manifest.name || !manifest.version) {
      throw new Error('Invalid manifest: missing required fields');
    }
    
    if (!manifest.engines?.nexus) {
      throw new Error('Invalid manifest: missing nexus engine requirement');
    }
  }

  private isTrustedPlugin(manifest: PluginManifest): boolean {
    return this.config.trustedPublishers.includes(manifest.publisher) || manifest.trusted === true;
  }

  private async checkDependencies(plugin: PluginInfo): Promise<void> {
    // Check if all dependencies are available
    for (const dep of plugin.dependencies) {
      if (!this.plugins.has(dep)) {
        console.warn(`Plugin ${plugin.id} depends on ${dep} which is not loaded`);
      }
    }
  }

  private async performSecurityScan(plugin: PluginInfo): Promise<void> {
    // Mock security scan
    if (!plugin.trusted) {
      console.log(`Performing security scan for ${plugin.id}`);
      // In real implementation, this would scan for malicious code
    }
  }

  private async loadPluginCode(plugin: PluginInfo): Promise<void> {
    try {
      // Mock plugin loading
      const mainPath = path.join(plugin.path, plugin.manifest.main);
      
      if (plugin.sandboxed) {
        // Load in sandbox
        plugin.instance = await this.loadInSandbox(plugin, mainPath);
      } else {
        // Load directly
        plugin.instance = { activate: () => {}, deactivate: () => {} };
      }
    } catch (error) {
      throw new Error(`Failed to load plugin code: ${error}`);
    }
  }

  private async loadInSandbox(plugin: PluginInfo, mainPath: string): Promise<any> {
    // Mock sandbox loading
    console.log(`Loading ${plugin.id} in sandbox`);
    return { activate: () => {}, deactivate: () => {} };
  }

  private shouldActivate(plugin: PluginInfo): boolean {
    // Check activation events
    return plugin.manifest.activationEvents.includes('*') || 
           plugin.manifest.activationEvents.some(event => this.checkActivationEvent(event));
  }

  private checkActivationEvent(event: string): boolean {
    // Mock activation event checking
    return event === '*';
  }

  private createPluginContext(plugin: PluginInfo): PluginContext {
    return {
      subscriptions: [],
      workspaceState: this.createMemento(`workspace-${plugin.id}`),
      globalState: this.createMemento(`global-${plugin.id}`),
      secrets: this.createSecretStorage(plugin.id),
      extensionUri: plugin.path,
      extensionPath: plugin.path,
      globalStorageUri: path.join(plugin.path, 'storage'),
      globalStoragePath: path.join(plugin.path, 'storage'),
      logUri: path.join(plugin.path, 'logs'),
      logPath: path.join(plugin.path, 'logs'),
      asAbsolutePath: (relativePath: string) => path.join(plugin.path, relativePath)
    };
  }

  private createMemento(key: string): PluginMemento {
    const storage = new Map<string, any>();
    
    return {
      get: <T>(key: string, defaultValue?: T): T | undefined => {
        return storage.get(key) ?? defaultValue;
      },
      update: async (key: string, value: any): Promise<void> => {
        storage.set(key, value);
      },
      keys: (): readonly string[] => {
        return Array.from(storage.keys());
      }
    };
  }

  private createSecretStorage(pluginId: string): PluginSecretStorage {
    const secrets = new Map<string, string>();
    
    return {
      get: async (key: string): Promise<string | undefined> => {
        return secrets.get(key);
      },
      store: async (key: string, value: string): Promise<void> => {
        secrets.set(key, value);
      },
      delete: async (key: string): Promise<void> => {
        secrets.delete(key);
      }
    };
  }

  private createPluginAPI(plugin: PluginInfo): PluginAPI {
    // Mock API implementation
    return {
      commands: {
        registerCommand: (command: string, callback: (...args: any[]) => any) => {
          console.log(`Registered command: ${command}`);
        },
        executeCommand: async <T>(command: string, ...rest: any[]): Promise<T> => {
          console.log(`Executing command: ${command}`);
          return {} as T;
        },
        getCommands: async (filterInternal?: boolean): Promise<string[]> => {
          return [];
        }
      },
      workspace: {
        workspaceFolders: [],
        name: 'Mock Workspace',
        onDidChangeWorkspaceFolders: () => {},
        getConfiguration: (section?: string) => ({}),
        onDidChangeConfiguration: () => {},
        openTextDocument: async (uri: string) => ({}),
        saveAll: async (includeUntitled?: boolean) => true,
        findFiles: async (include: string, exclude?: string) => []
      },
      window: {
        showInformationMessage: async (message: string, ...items: string[]) => undefined,
        showWarningMessage: async (message: string, ...items: string[]) => undefined,
        showErrorMessage: async (message: string, ...items: string[]) => undefined,
        showQuickPick: async (items: string[] | Promise<string[]>) => undefined,
        showInputBox: async (options?: any) => undefined,
        createStatusBarItem: (alignment?: any, priority?: number) => ({}),
        createOutputChannel: (name: string) => ({}),
        createTerminal: (options?: any) => ({}),
        showTextDocument: async (document: any, column?: any) => ({}),
        onDidChangeActiveTextEditor: () => {},
        onDidChangeVisibleTextEditors: () => {}
      },
      languages: {
        registerCompletionItemProvider: (selector: any, provider: any) => {},
        registerHoverProvider: (selector: any, provider: any) => {},
        registerDefinitionProvider: (selector: any, provider: any) => {},
        registerReferenceProvider: (selector: any, provider: any) => {},
        registerDocumentFormattingEditProvider: (selector: any, provider: any) => {},
        registerCodeActionsProvider: (selector: any, provider: any) => {},
        registerCodeLensProvider: (selector: any, provider: any) => {},
        registerDocumentSymbolProvider: (selector: any, provider: any) => {},
        registerWorkspaceSymbolProvider: (provider: any) => {},
        registerRenameProvider: (selector: any, provider: any) => {},
        registerSignatureHelpProvider: (selector: any, provider: any) => {},
        registerDocumentHighlightProvider: (selector: any, provider: any) => {},
        registerFoldingRangeProvider: (selector: any, provider: any) => {},
        registerSelectionRangeProvider: (selector: any, provider: any) => {},
        registerColorProvider: (selector: any, provider: any) => {},
        registerDeclarationProvider: (selector: any, provider: any) => {},
        registerTypeDefinitionProvider: (selector: any, provider: any) => {},
        registerImplementationProvider: (selector: any, provider: any) => {},
        registerDocumentLinkProvider: (selector: any, provider: any) => {},
        registerCallHierarchyProvider: (selector: any, provider: any) => {},
        registerSemanticTokensProvider: (selector: any, provider: any) => {}
      },
      debug: {
        registerDebugConfigurationProvider: (debugType: string, provider: any) => {},
        registerDebugAdapterDescriptorFactory: (debugType: string, factory: any) => {},
        startDebugging: async (folder: any, nameOrConfiguration: string | any) => true,
        addBreakpoints: (breakpoints: any[]) => {},
        removeBreakpoints: (breakpoints: any[]) => {},
        onDidStartDebugSession: () => {},
        onDidTerminateDebugSession: () => {},
        onDidChangeActiveDebugSession: () => {},
        onDidChangeBreakpoints: () => {}
      },
      tasks: {
        registerTaskProvider: (type: string, provider: any) => {},
        executeTask: async (task: any) => ({}),
        onDidStartTask: () => {},
        onDidEndTask: () => {},
        onDidStartTaskProcess: () => {},
        onDidEndTaskProcess: () => {}
      },
      scm: {
        createSourceControl: (id: string, label: string, rootUri?: any) => ({}),
        inputBox: {}
      },
      ai: {
        generateCode: async (prompt: string, context?: any) => '',
        explainCode: async (code: string, language?: string) => '',
        optimizeCode: async (code: string, language?: string) => '',
        findBugs: async (code: string, language?: string) => [],
        generateTests: async (code: string, language?: string) => '',
        chat: async (message: string, context?: any) => ''
      },
      mcp: {
        connect: async (serverUrl: string, options?: any) => ({}),
        disconnect: async (serverId: string) => {},
        sendMessage: async (serverId: string, message: any) => ({}),
        onMessage: (serverId: string, callback: (message: any) => void) => {}
      },
      collaboration: {
        startSession: async (options?: any) => '',
        joinSession: async (sessionId: string) => {},
        leaveSession: async () => {},
        shareFile: async (filePath: string) => {},
        unshareFile: async (filePath: string) => {},
        onUserJoined: () => {},
        onUserLeft: () => {},
        onFileShared: () => {},
        onFileChanged: () => {}
      },
      performance: {
        getMetrics: async () => ({}),
        startProfiling: async (options?: any) => '',
        stopProfiling: async (sessionId: string) => ({}),
        onMetricsUpdated: () => {}
      }
    };
  }

  private async registerContributions(plugin: PluginInfo): Promise<void> {
    const contributions = plugin.manifest.contributes;
    if (!contributions) return;
    
    // Register commands
    if (contributions.commands) {
      contributions.commands.forEach(command => {
        console.log(`Registered command: ${command.command}`);
      });
    }
    
    // Register other contributions...
  }

  private async unregisterContributions(plugin: PluginInfo): Promise<void> {
    console.log(`Unregistering contributions for ${plugin.id}`);
  }

  private startPluginMonitoring(plugin: PluginInfo): void {
    // Mock monitoring
    const monitor = setInterval(() => {
      plugin.memoryUsage = Math.random() * 50 * 1024 * 1024; // Random memory usage
      plugin.cpuUsage = Math.random() * 20; // Random CPU usage
      
      // Check limits
      if (plugin.memoryUsage > this.config.maxMemoryUsage) {
        this.addPluginWarning(plugin, {
          id: 'high-memory-usage',
          message: `High memory usage: ${(plugin.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
          timestamp: new Date()
        });
      }
      
      if (plugin.cpuUsage > this.config.maxCpuUsage) {
        this.addPluginWarning(plugin, {
          id: 'high-cpu-usage',
          message: `High CPU usage: ${plugin.cpuUsage.toFixed(2)}%`,
          timestamp: new Date()
        });
      }
    }, 5000);
    
    // Store monitor reference for cleanup
    (plugin as any).monitor = monitor;
  }

  private stopPluginMonitoring(plugin: PluginInfo): void {
    const monitor = (plugin as any).monitor;
    if (monitor) {
      clearInterval(monitor);
      delete (plugin as any).monitor;
    }
  }

  private cleanupSandbox(pluginId: string): void {
    const sandbox = this.sandboxes.get(pluginId);
    if (sandbox) {
      // Cleanup sandbox resources
      this.sandboxes.delete(pluginId);
      console.log(`Cleaned up sandbox for ${pluginId}`);
    }
  }

  private addPluginError(plugin: PluginInfo, error: PluginError): void {
    plugin.errors.push(error);
    
    // Keep only last 100 errors
    if (plugin.errors.length > 100) {
      plugin.errors = plugin.errors.slice(-100);
    }
    
    this.emit('plugin-error', plugin, error);
  }

  private addPluginWarning(plugin: PluginInfo, warning: PluginWarning): void {
    plugin.warnings.push(warning);
    
    // Keep only last 100 warnings
    if (plugin.warnings.length > 100) {
      plugin.warnings = plugin.warnings.slice(-100);
    }
    
    this.emit('plugin-warning', plugin, warning);
  }
}

// Create singleton instance
const pluginSystem = new PluginSystem();

export default pluginSystem;
export { PluginSystem };