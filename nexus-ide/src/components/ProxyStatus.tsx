import React, { useState, useEffect } from 'react';
import { useProxy } from '../hooks/useProxy';
import { useMCP } from '../hooks/useMCP';
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Settings,
  BarChart3,
  Zap
} from 'lucide-react';

interface ProxyStatusProps {
  className?: string;
  showDetails?: boolean;
}

const ProxyStatus: React.FC<ProxyStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const proxy = useProxy();
  const mcp = useMCP();
  const [showMetrics, setShowMetrics] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'connecting': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <WifiOff className="w-4 h-4" />;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await proxy.reconnect();
    } catch (error) {
      console.error('Failed to refresh proxy connection:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSwitchToProxy = async () => {
    try {
      await mcp.switchToProxy();
    } catch (error) {
      console.error('Failed to switch to proxy:', error);
    }
  };

  const handleSwitchToDirect = async () => {
    try {
      await mcp.switchToDirect();
    } catch (error) {
      console.error('Failed to switch to direct connection:', error);
    }
  };

  const formatResponseTime = (time: number) => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Wifi className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-medium text-white">Proxy Status</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Toggle Metrics"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh Connection"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="space-y-3">
        {proxy.connections.map((connection) => (
          <div key={connection.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={getStatusColor(connection.status)}>
                {getStatusIcon(connection.status)}
              </div>
              <div>
                <div className="text-sm font-medium text-white capitalize">
                  {connection.type.replace('-', ' ')}
                </div>
                <div className="text-xs text-gray-400">
                  {connection.url}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              {connection.lastConnected && (
                <div>Last: {connection.lastConnected.toLocaleTimeString()}</div>
              )}
              {connection.errorCount > 0 && (
                <div className="text-red-400">Errors: {connection.errorCount}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MCP Connection Mode */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white">MCP Connection</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded ${
              mcp.connection?.mode === 'proxy' 
                ? 'bg-blue-900 text-blue-200' 
                : 'bg-gray-700 text-gray-300'
            }`}>
              {mcp.connection?.mode || 'disconnected'}
            </span>
            <div className={getStatusColor(mcp.connection?.status || 'disconnected')}>
              {getStatusIcon(mcp.connection?.status || 'disconnected')}
            </div>
          </div>
        </div>
        
        {/* Connection Mode Switcher */}
        <div className="mt-2 flex space-x-2">
          <button
            onClick={handleSwitchToProxy}
            disabled={mcp.connection?.mode === 'proxy'}
            className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Use Proxy
          </button>
          <button
            onClick={handleSwitchToDirect}
            disabled={mcp.connection?.mode === 'direct'}
            className="flex-1 px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Direct
          </button>
        </div>
      </div>

      {/* Metrics Panel */}
      {showMetrics && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {formatNumber(proxy.metrics.totalRequests)}
              </div>
              <div className="text-xs text-gray-400">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">
                {proxy.metrics.totalRequests > 0 
                  ? Math.round((proxy.metrics.successfulRequests / proxy.metrics.totalRequests) * 100)
                  : 0}%
              </div>
              <div className="text-xs text-gray-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">
                {formatResponseTime(proxy.metrics.averageResponseTime)}
              </div>
              <div className="text-xs text-gray-400">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">
                {proxy.metrics.activeConnections}
              </div>
              <div className="text-xs text-gray-400">Active Connections</div>
            </div>
          </div>
          
          {/* Performance Indicator */}
          <div className="mt-3 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  proxy.metrics.averageResponseTime < 100 ? 'bg-green-400' :
                  proxy.metrics.averageResponseTime < 500 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ 
                  width: `${Math.min(100, (proxy.metrics.averageResponseTime / 1000) * 100)}%` 
                }}
              />
            </div>
            <span className="text-xs text-gray-400">
              {proxy.metrics.averageResponseTime < 100 ? 'Excellent' :
               proxy.metrics.averageResponseTime < 500 ? 'Good' : 'Slow'}
            </span>
          </div>
        </div>
      )}

      {/* Details Panel */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 space-y-1">
            <div>Proxy Enabled: {proxy.isConnected ? 'Yes' : 'No'}</div>
            <div>Load Balancing: Active</div>
            <div>Circuit Breaker: Enabled</div>
            <div>Cache: Enabled (LRU)</div>
            <div>Rate Limiting: 1000 req/min</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProxyStatus;