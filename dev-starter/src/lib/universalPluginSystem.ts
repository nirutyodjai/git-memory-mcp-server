import { EventEmitter } from 'events';
import { mcpErrorHandler, LogLevel } from './mcpErrorHandler';

export interface IPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  capabilities: string[];
  isActive: boolean;
  manifest?: PluginManifest;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  main?: string;
  dependencies?: Record<string, string>;
  permissions?: string[];
  api?: {
    version: string;
    endpoints?: string[];
  };
}

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  tools: MCPTool[];
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface PluginStats {
  totalPlugins: number;
  activePlugins: number;
  inactivePlugins: number;
  errorPlugins: number;
}

export class UniversalPluginSystem extends EventEmitter {
  private static instance: UniversalPluginSystem;
  private plugins: Map<string, IPlugin> = new Map();
  private mcpServers: Map<string, MCPServer> = new Map();
  private isInitialized = false;

  private constructor() {
    super();
    this.initializeDefaultPlugins();
  }

  public static getInstance(): UniversalPluginSystem {
    if (!UniversalPluginSystem.instance) {
      UniversalPluginSystem.instance = new UniversalPluginSystem();
    }
    return UniversalPluginSystem.instance;
  }

  private initializeDefaultPlugins(): void {
    // Initialize with some default plugins
    const defaultPlugins: IPlugin[] = [
      {
        id: 'nexus-rest-client',
        name: 'Nexus REST Client',
        version: '1.0.0',
        description: 'REST API client for Nexus integration',
        author: 'System',
        capabilities: ['rest-api', 'http-client'],
        isActive: false
      },
      {
        id: 'mcp-multi-fetch',
        name: 'MCP Multi Fetch',
        version: '1.0.0',
        description: 'Multi-format content fetching tool',
        author: 'System',
        capabilities: ['web-fetch', 'content-extraction'],
        isActive: false
      }
    ];

    defaultPlugins.forEach(plugin => {
      this.plugins.set(plugin.id, plugin);
    });
  }

  public async initializeSystem(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      mcpErrorHandler.log(LogLevel.INFO, 'Initializing Universal Plugin System');
      
      // Initialize MCP servers
      await this.initializeMCPServers();
      
      this.isInitialized = true;
      this.emit('system-initialized');
      
      mcpErrorHandler.log(LogLevel.INFO, 'Universal Plugin System initialized successfully');
    } catch (error) {
      mcpErrorHandler.log(LogLevel.ERROR, 'Failed to initialize Universal Plugin System', { error });
      throw error;
    }
  }

  private async initializeMCPServers(): Promise<void> {
    // Mock MCP servers for now
    const mockServers: MCPServer[] = [
      {
        id: 'multi-fetch',
        name: 'Multi Fetch',
        description: 'Fetch content from various sources',
        status: 'connected',
        tools: [
          {
            name: 'fetch_html',
            description: 'Fetch HTML content from URL',
            inputSchema: { type: 'object', properties: { url: { type: 'string' } } }
          }
        ]
      },
      {
        id: 'ffmpeg-processor',
        name: 'FFmpeg Video Processor',
        description: 'Process video files with FFmpeg',
        status: 'connected',
        tools: [
          {
            name: 'resize-video',
            description: 'Resize video to different resolutions',
            inputSchema: { type: 'object', properties: { videoPath: { type: 'string' } } }
          }
        ]
      }
    ];

    mockServers.forEach(server => {
      this.mcpServers.set(server.id, server);
    });
  }

  public async installPlugin(pluginData: PluginManifest | IPlugin): Promise<void> {
    try {
      let plugin: IPlugin;
      
      if ('capabilities' in pluginData) {
        // It's already an IPlugin
        plugin = pluginData as IPlugin;
      } else {
        // It's a PluginManifest, convert to IPlugin
        const manifest = pluginData as PluginManifest;
        plugin = {
          id: manifest.id,
          name: manifest.name,
          version: manifest.version,
          description: manifest.description,
          author: manifest.author,
          capabilities: manifest.permissions || ['basic'],
          isActive: false,
          manifest: manifest
        };
      }

      this.plugins.set(plugin.id, plugin);
      this.emit('plugin-installed', plugin);
      
      mcpErrorHandler.log(LogLevel.INFO, `Plugin ${plugin.name} installed successfully`, { pluginId: plugin.id });
    } catch (error) {
      mcpErrorHandler.log(LogLevel.ERROR, 'Failed to install plugin', { error, pluginData });
      throw error;
    }
  }

  public async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.isActive = true;
    this.emit('plugin-activated', plugin);
    
    mcpErrorHandler.log(LogLevel.INFO, `Plugin ${plugin.name} activated`, { pluginId });
  }

  public async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.isActive = false;
    this.emit('plugin-deactivated', plugin);
    
    mcpErrorHandler.log(LogLevel.INFO, `Plugin ${plugin.name} deactivated`, { pluginId });
  }

  public getInstalledPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  public getAllPlugins(): IPlugin[] {
    return this.getInstalledPlugins();
  }

  public getLoadedPlugins(): IPlugin[] {
    return this.getInstalledPlugins().filter(plugin => plugin.isActive);
  }

  public getConnectedMCPServers(): MCPServer[] {
    return Array.from(this.mcpServers.values());
  }

  public async getPluginStats(): Promise<PluginStats> {
    const plugins = this.getInstalledPlugins();
    return {
      totalPlugins: plugins.length,
      activePlugins: plugins.filter(p => p.isActive).length,
      inactivePlugins: plugins.filter(p => !p.isActive).length,
      errorPlugins: 0 // Mock for now
    };
  }

  // Additional methods for App.tsx and PluginManager.tsx compatibility
  public async initialize(): Promise<void> {
    return this.initializeSystem();
  }

  public async getPlugins(): Promise<IPlugin[]> {
    return this.getInstalledPlugins();
  }

  public async getMCPServers(): Promise<MCPServer[]> {
    return this.getConnectedMCPServers();
  }

  public async getStats(): Promise<PluginStats> {
    return this.getPluginStats();
  }

  public async connectMCPServer(serverId: string): Promise<void> {
    const server = this.mcpServers.get(serverId);
    if (!server) {
      throw new Error(`MCP Server ${serverId} not found`);
    }
    
    server.status = 'connected';
    this.emit('mcpServerStatusChanged', server);
    
    mcpErrorHandler.log(LogLevel.INFO, `MCP Server ${server.name} connected`, { serverId });
  }

  public async disconnectMCPServer(serverId: string): Promise<void> {
    const server = this.mcpServers.get(serverId);
    if (!server) {
      throw new Error(`MCP Server ${serverId} not found`);
    }
    
    server.status = 'disconnected';
    this.emit('mcpServerStatusChanged', server);
    
    mcpErrorHandler.log(LogLevel.INFO, `MCP Server ${server.name} disconnected`, { serverId });
  }
}

export const universalPluginSystem = UniversalPluginSystem.getInstance();