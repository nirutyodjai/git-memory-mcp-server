import React, { useState, useEffect } from 'react';
import { X, Download, Play, Square, Settings, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { universalPluginSystem, IPlugin } from '../lib/universalPluginSystem';
import { mcpErrorHandler, LogLevel } from '../lib/mcpErrorHandler';

interface PluginManifest {
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

interface PluginManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PluginStats {
  totalPlugins: number;
  activePlugins: number;
  inactivePlugins: number;
  errorPlugins: number;
}

const PluginManager: React.FC<PluginManagerProps> = ({ isOpen, onClose }) => {
  const [plugins, setPlugins] = useState<IPlugin[]>([]);
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [stats, setStats] = useState<PluginStats>({
    totalPlugins: 0,
    activePlugins: 0,
    inactivePlugins: 0,
    errorPlugins: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plugins' | 'mcp' | 'marketplace'>('plugins');
  const [marketplacePlugins] = useState<PluginManifest[]>([
    {
      id: 'nexus-rest-client',
      name: 'Nexus REST Client',
      version: '1.0.0',
      description: 'A powerful REST API client for Nexus integration with advanced features',
      author: 'Nexus Team',
      permissions: ['network', 'storage']
    },
    {
      id: 'data-visualizer',
      name: 'Data Visualizer',
      version: '2.1.0',
      description: 'Create beautiful charts and graphs from your data',
      author: 'DataViz Inc',
      permissions: ['storage', 'display']
    },
    {
      id: 'ai-assistant',
      name: 'AI Assistant',
      version: '1.5.0',
      description: 'Intelligent assistant for code completion and suggestions',
      author: 'AI Corp',
      permissions: ['ai', 'code-analysis']
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    const handlePluginEvent = () => {
      loadData();
    };

    const handleError = (error: any) => {
      setError(error.message || 'An error occurred');
    };

    universalPluginSystem.on('plugin-activated', handlePluginEvent);
    universalPluginSystem.on('plugin-deactivated', handlePluginEvent);
    universalPluginSystem.on('plugin-error', handleError);

    return () => {
      universalPluginSystem.off('plugin-activated', handlePluginEvent);
      universalPluginSystem.off('plugin-deactivated', handlePluginEvent);
      universalPluginSystem.off('plugin-error', handleError);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      mcpErrorHandler.log(LogLevel.DEBUG, 'Loading plugins in PluginManager', {
        timestamp: new Date().toISOString()
      });
      
      const allPlugins = universalPluginSystem.getAllPlugins();
      setPlugins(allPlugins);
      
      mcpErrorHandler.log(LogLevel.DEBUG, 'Plugins loaded', {
        count: allPlugins.length,
        plugins: allPlugins.map(p => ({ id: p.id, name: p.name, isActive: p.isActive }))
      });
      
      mcpErrorHandler.log(LogLevel.DEBUG, 'Loading MCP servers in PluginManager', {
        timestamp: new Date().toISOString()
      });
      
      const servers = universalPluginSystem.getConnectedMCPServers();
      setMcpServers(servers);
      
      mcpErrorHandler.log(LogLevel.DEBUG, 'MCP servers loaded', {
        count: servers.length,
        servers: servers.map(s => ({ id: s.id, name: s.name, status: s.status }))
      });
      
      const pluginStats = await universalPluginSystem.getPluginStats();
      setStats(pluginStats);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load plugin data';
      setError(errorMessage);
      mcpErrorHandler.log(LogLevel.ERROR, 'Error loading plugin data', { error: err });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlugin = async (pluginId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await universalPluginSystem.activatePlugin(pluginId);
      } else {
        await universalPluginSystem.deactivatePlugin(pluginId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle plugin';
      setError(errorMessage);
    }
  };

  const handleInstallPlugin = async (plugin: PluginManifest) => {
    try {
      setLoading(true);
      setError(null);
      
      // Convert PluginManifest to IPlugin format
      const pluginData: IPlugin = {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        author: plugin.author,
        capabilities: plugin.permissions || ['basic'],
        isActive: false,
        manifest: plugin
      };
      
      await universalPluginSystem.installPlugin(pluginData);
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to install plugin';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const isInstalled = (plugin: PluginManifest) => {
    return plugins.some(p => p.id === plugin.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Plugin Manager</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalPlugins}</div>
              <div className="text-sm text-gray-600">Total Plugins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.activePlugins}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.inactivePlugins}</div>
              <div className="text-sm text-gray-600">Inactive</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.errorPlugins}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('plugins')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'plugins'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Installed Plugins
          </button>
          <button
            onClick={() => setActiveTab('mcp')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'mcp'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            MCP Servers
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'marketplace'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Marketplace
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          )}

          {/* Plugins Tab */}
          {activeTab === 'plugins' && !loading && (
            <div className="space-y-4">
              {plugins.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No plugins installed
                </div>
              ) : (
                plugins.map((plugin) => (
                  <div key={plugin.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-800">{plugin.name}</h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            v{plugin.version}
                          </span>
                          {plugin.isActive && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{plugin.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>By {plugin.author}</span>
                          <span>•</span>
                          <span>Capabilities: {plugin.capabilities.join(', ')}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTogglePlugin(plugin.id, !plugin.isActive)}
                          className={`p-2 rounded-full transition-colors ${
                            plugin.isActive
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          }`}
                          title={plugin.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {plugin.isActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                          title="Settings"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* MCP Servers Tab */}
          {activeTab === 'mcp' && !loading && (
            <div className="space-y-4">
              {mcpServers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No MCP servers connected
                </div>
              ) : (
                mcpServers.map((server) => (
                  <div key={server.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-800">{server.name}</h3>
                          {getStatusIcon(server.status)}
                          <span className={`px-2 py-1 text-xs rounded ${
                            server.status === 'connected'
                              ? 'bg-green-100 text-green-700'
                              : server.status === 'error'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {server.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">{server.description}</p>
                        <div className="mt-2">
                          <span className="text-sm text-gray-500">
                            Tools: {server.tools?.length || 0}
                          </span>
                          {server.tools && server.tools.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {server.tools.slice(0, 3).map((tool, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                  {tool.name}
                                </span>
                              ))}
                              {server.tools.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  +{server.tools.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Marketplace Tab */}
          {activeTab === 'marketplace' && !loading && (
            <div className="space-y-4">
              {marketplacePlugins.map((plugin) => (
                <div key={plugin.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-800">{plugin.name}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          v{plugin.version}
                        </span>
                        {isInstalled(plugin) && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            Installed
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{plugin.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>By {plugin.author}</span>
                        {plugin.permissions && (
                          <>
                            <span>•</span>
                            <span>Permissions: {plugin.permissions.join(', ')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!isInstalled(plugin) ? (
                        <button
                          onClick={() => handleInstallPlugin(plugin)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                          disabled={loading}
                        >
                          <Download className="w-4 h-4" />
                          <span>Install</span>
                        </button>
                      ) : (
                        <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                          Installed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { PluginManager };
export default PluginManager;