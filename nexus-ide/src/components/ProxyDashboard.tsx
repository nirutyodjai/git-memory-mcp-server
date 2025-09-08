import React, { useState, useEffect } from 'react';
import { useProxy } from '../hooks/useProxy';
import { useMCP } from '../hooks/useMCP';
import ProxyStatus from './ProxyStatus';
import ProxyManager from './ProxyManager';
import { 
  Activity, 
  BarChart3, 
  Settings, 
  Wifi, 
  Server, 
  Database, 
  Globe, 
  Shield, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Monitor, 
  Gauge, 
  RefreshCw,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ProxyDashboardProps {
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface SystemMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  activeConnections: number;
  uptime: number;
  throughput: number;
  errorRate: number;
}

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  endpoint?: string;
}

const ProxyDashboard: React.FC<ProxyDashboardProps> = ({ 
  className = '', 
  isOpen, 
  onClose 
}) => {
  const proxy = useProxy();
  const mcp = useMCP();
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'manager'>('dashboard');
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    activeConnections: 0,
    uptime: 99.9,
    throughput: 0,
    errorRate: 0
  });
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update system metrics from proxy data
  useEffect(() => {
    setSystemMetrics({
      totalRequests: proxy.metrics.totalRequests,
      successfulRequests: proxy.metrics.successfulRequests,
      failedRequests: proxy.metrics.totalRequests - proxy.metrics.successfulRequests,
      averageResponseTime: proxy.metrics.averageResponseTime,
      activeConnections: proxy.metrics.activeConnections,
      uptime: 99.9,
      throughput: proxy.metrics.totalRequests / 60, // requests per minute
      errorRate: proxy.metrics.totalRequests > 0 
        ? ((proxy.metrics.totalRequests - proxy.metrics.successfulRequests) / proxy.metrics.totalRequests) * 100
        : 0
    });
  }, [proxy.metrics]);

  // Generate sample alerts
  useEffect(() => {
    const sampleAlerts: AlertItem[] = [
      {
        id: '1',
        type: 'warning',
        message: 'High response time detected on API Gateway',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        endpoint: 'api-gateway'
      },
      {
        id: '2',
        type: 'info',
        message: 'Load balancer successfully redistributed traffic',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        endpoint: 'load-balancer'
      },
      {
        id: '3',
        type: 'error',
        message: 'Connection timeout on MCP Proxy Server',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        endpoint: 'mcp-proxy'
      }
    ];
    setAlerts(sampleAlerts);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await proxy.reconnect();
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAlertBgColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-900/20 border-red-700';
      case 'warning': return 'bg-yellow-900/20 border-yellow-700';
      case 'info': return 'bg-blue-900/20 border-blue-700';
      default: return 'bg-gray-900/20 border-gray-700';
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-900 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Total Requests</div>
              <div className="text-xl font-bold text-white">
                {formatNumber(systemMetrics.totalRequests)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-900 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Success Rate</div>
              <div className="text-xl font-bold text-white">
                {systemMetrics.totalRequests > 0 
                  ? Math.round((systemMetrics.successfulRequests / systemMetrics.totalRequests) * 100)
                  : 0}%
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
              <div className="text-xl font-bold text-white">
                {systemMetrics.averageResponseTime}ms
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-900 rounded-lg">
              <Users className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Active Connections</div>
              <div className="text-xl font-bold text-white">
                {systemMetrics.activeConnections}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Performance */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span>Performance Metrics</span>
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Throughput</span>
              <span className="text-white font-medium">
                {formatNumber(systemMetrics.throughput)} req/min
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Error Rate</span>
              <span className={`font-medium ${
                systemMetrics.errorRate < 1 ? 'text-green-400' :
                systemMetrics.errorRate < 5 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {systemMetrics.errorRate.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Uptime</span>
              <span className="text-green-400 font-medium">
                {systemMetrics.uptime}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Failed Requests</span>
              <span className="text-red-400 font-medium">
                {formatNumber(systemMetrics.failedRequests)}
              </span>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span>System Status</span>
          </h3>
          <div className="space-y-3">
            {proxy.connections.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    connection.status === 'connected' ? 'bg-green-400' :
                    connection.status === 'connecting' ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`} />
                  <div>
                    <div className="text-white font-medium capitalize">
                      {connection.type.replace('-', ' ')}
                    </div>
                    <div className="text-xs text-gray-400">
                      {connection.url}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm">
                    {connection.status}
                  </div>
                  {connection.errorCount > 0 && (
                    <div className="text-red-400 text-xs">
                      {connection.errorCount} errors
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <span>Recent Alerts</span>
        </h3>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-2" />
              <div>No alerts at this time</div>
              <div className="text-sm">All systems are operating normally</div>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className={`p-3 rounded-lg border ${getAlertBgColor(alert.type)}`}>
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="text-white font-medium">{alert.message}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      {alert.endpoint && (
                        <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                          {alert.endpoint}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {alert.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => mcp.switchToProxy()}
            className="flex items-center space-x-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Wifi className="w-4 h-4" />
            <span>Enable Proxy</span>
          </button>
          <button 
            onClick={() => mcp.switchToDirect()}
            className="flex items-center space-x-2 p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Server className="w-4 h-4" />
            <span>Direct Mode</span>
          </button>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={() => setActiveView('manager')}
            className="flex items-center space-x-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className={cn(
      'fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4',
      className
    )}>
      <div className={cn(
        'bg-gray-900 border border-gray-700 rounded-lg shadow-2xl transition-all duration-300',
        isMaximized ? 'w-full h-full' : 'w-full max-w-6xl h-5/6'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Monitor className="w-6 h-6 text-blue-400" />
              <h1 className="text-xl font-bold text-white">Proxy Dashboard</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  activeView === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveView('manager')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  activeView === 'manager'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Manager
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeView === 'dashboard' ? renderDashboard() : (
            <ProxyManager className="h-full" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProxyDashboard;