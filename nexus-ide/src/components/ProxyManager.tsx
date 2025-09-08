import React, { useState, useEffect } from 'react';
import { useProxy } from '../hooks/useProxy';
import { useMCP } from '../hooks/useMCP';
import { 
  Settings, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Activity,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Server,
  Database,
  Cloud,
  Monitor,
  Gauge,
  TrendingUp,
  Clock,
  Users,
  Lock,
  Unlock,
  Play,
  Pause,
  Square
} from 'lucide-react';
import proxyConfig from '../config/proxy-config.json';

interface ProxyManagerProps {
  className?: string;
}

interface ProxyEndpoint {
  id: string;
  name: string;
  url: string;
  type: 'api-gateway' | 'mcp-proxy' | 'load-balancer' | 'direct';
  status: 'online' | 'offline' | 'error' | 'maintenance';
  responseTime: number;
  uptime: number;
  requests: number;
  errors: number;
}

const ProxyManager: React.FC<ProxyManagerProps> = ({ className = '' }) => {
  const proxy = useProxy();
  const mcp = useMCP();
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'settings' | 'monitoring'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [endpoints, setEndpoints] = useState<ProxyEndpoint[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Initialize endpoints from config
  useEffect(() => {
    const initialEndpoints: ProxyEndpoint[] = [
      {
        id: 'api-gateway',
        name: 'API Gateway',
        url: `http://localhost:${proxyConfig.apiGateway.port}`,
        type: 'api-gateway',
        status: 'online',
        responseTime: 45,
        uptime: 99.9,
        requests: 15420,
        errors: 12
      },
      {
        id: 'mcp-proxy',
        name: 'MCP Proxy Server',
        url: `http://localhost:${proxyConfig.mcpProxy.port}`,
        type: 'mcp-proxy',
        status: 'online',
        responseTime: 32,
        uptime: 99.8,
        requests: 8930,
        errors: 5
      },
      {
        id: 'load-balancer',
        name: 'Load Balancer',
        url: `http://localhost:${proxyConfig.loadBalancer.port}`,
        type: 'load-balancer',
        status: 'online',
        responseTime: 28,
        uptime: 99.95,
        requests: 25680,
        errors: 8
      }
    ];
    setEndpoints(initialEndpoints);
  }, []);

  // Auto refresh endpoints status
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      await refreshEndpointsStatus();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const refreshEndpointsStatus = async () => {
    setIsRefreshing(true);
    try {
      // Simulate API calls to check endpoint status
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEndpoints(prev => prev.map(endpoint => ({
        ...endpoint,
        responseTime: Math.floor(Math.random() * 100) + 20,
        requests: endpoint.requests + Math.floor(Math.random() * 10),
        errors: endpoint.errors + (Math.random() > 0.95 ? 1 : 0)
      })));
    } catch (error) {
      console.error('Failed to refresh endpoints:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-gray-500';
      case 'error': return 'text-red-500';
      case 'maintenance': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4" />;
      case 'offline': return <WifiOff className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'maintenance': return <Settings className="w-4 h-4" />;
      default: return <WifiOff className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api-gateway': return <Globe className="w-4 h-4" />;
      case 'mcp-proxy': return <Server className="w-4 h-4" />;
      case 'load-balancer': return <Database className="w-4 h-4" />;
      case 'direct': return <Wifi className="w-4 h-4" />;
      default: return <Server className="w-4 h-4" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const calculateSuccessRate = (requests: number, errors: number) => {
    if (requests === 0) return 100;
    return ((requests - errors) / requests * 100).toFixed(1);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-900 rounded-lg">
              <Activity className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-sm text-gray-400">System Status</div>
              <div className="text-lg font-bold text-green-400">Operational</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-900 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Total Requests</div>
              <div className="text-lg font-bold text-white">
                {formatNumber(endpoints.reduce((sum, ep) => sum + ep.requests, 0))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-900 rounded-lg">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Avg Response</div>
              <div className="text-lg font-bold text-white">
                {Math.round(endpoints.reduce((sum, ep) => sum + ep.responseTime, 0) / endpoints.length)}ms
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoints Status */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Endpoints Status</h3>
        <div className="space-y-3">
          {endpoints.map((endpoint) => (
            <div key={endpoint.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={getStatusColor(endpoint.status)}>
                  {getStatusIcon(endpoint.status)}
                </div>
                <div className="text-gray-300">
                  {getTypeIcon(endpoint.type)}
                </div>
                <div>
                  <div className="text-white font-medium">{endpoint.name}</div>
                  <div className="text-sm text-gray-400">{endpoint.url}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white">{endpoint.responseTime}ms</div>
                <div className="text-sm text-gray-400">{endpoint.uptime}% uptime</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEndpoints = () => (
    <div className="space-y-4">
      {endpoints.map((endpoint) => (
        <div key={endpoint.id} className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={getStatusColor(endpoint.status)}>
                {getStatusIcon(endpoint.status)}
              </div>
              <div className="text-gray-300">
                {getTypeIcon(endpoint.type)}
              </div>
              <div>
                <div className="text-white font-medium">{endpoint.name}</div>
                <div className="text-sm text-gray-400">{endpoint.url}</div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Play className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Pause className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{endpoint.responseTime}ms</div>
              <div className="text-xs text-gray-400">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{endpoint.uptime}%</div>
              <div className="text-xs text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{formatNumber(endpoint.requests)}</div>
              <div className="text-xs text-gray-400">Requests</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">
                {calculateSuccessRate(endpoint.requests, endpoint.errors)}%
              </div>
              <div className="text-xs text-gray-400">Success Rate</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Proxy Configuration */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Proxy Configuration</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">Enable Proxy</div>
              <div className="text-sm text-gray-400">Route requests through proxy servers</div>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">Load Balancing</div>
              <div className="text-sm text-gray-400">Distribute requests across multiple servers</div>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">Circuit Breaker</div>
              <div className="text-sm text-gray-400">Prevent cascading failures</div>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">Request Caching</div>
              <div className="text-sm text-gray-400">Cache responses for better performance</div>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">Rate Limiting</div>
              <div className="text-sm text-gray-400">Limit requests per minute</div>
            </div>
            <input 
              type="number" 
              defaultValue={1000}
              className="w-20 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">SSL/TLS</div>
              <div className="text-sm text-gray-400">Enable secure connections</div>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">API Key Validation</div>
              <div className="text-sm text-gray-400">Validate API keys for requests</div>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMonitoring = () => (
    <div className="space-y-6">
      {/* Real-time Metrics */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Real-time Monitoring</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded transition-colors ${
                autoRefresh ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}
            >
              {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600"
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <Monitor className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{proxy.metrics.activeConnections}</div>
            <div className="text-sm text-gray-400">Active Connections</div>
          </div>
          
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{formatNumber(proxy.metrics.totalRequests)}</div>
            <div className="text-sm text-gray-400">Total Requests</div>
          </div>
          
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{proxy.metrics.averageResponseTime}ms</div>
            <div className="text-sm text-gray-400">Avg Response Time</div>
          </div>
          
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <Gauge className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {proxy.metrics.totalRequests > 0 
                ? Math.round((proxy.metrics.successfulRequests / proxy.metrics.totalRequests) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-400">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Trends</h3>
        <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-2" />
            <div>Performance charts will be displayed here</div>
            <div className="text-sm">Real-time metrics visualization</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Proxy Manager</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshEndpointsStatus}
            disabled={isRefreshing}
            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'endpoints', label: 'Endpoints', icon: Server },
          { id: 'settings', label: 'Settings', icon: Settings },
          { id: 'monitoring', label: 'Monitoring', icon: Monitor }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'endpoints' && renderEndpoints()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'monitoring' && renderMonitoring()}
      </div>
    </div>
  );
};

export default ProxyManager;