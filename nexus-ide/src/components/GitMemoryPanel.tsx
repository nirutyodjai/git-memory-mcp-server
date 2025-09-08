import React, { useState, useEffect, useCallback } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  GitMerge, 
  History, 
  Search, 
  RefreshCw, 
  Database, 
  Brain, 
  Zap,
  Clock,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useMCP } from '../hooks/useMCP';
import { cn } from '../lib/utils';

interface GitMemoryData {
  id: string;
  type: 'commit' | 'branch' | 'merge' | 'memory';
  title: string;
  description: string;
  timestamp: string;
  author: string;
  hash?: string;
  branch?: string;
  status: 'success' | 'pending' | 'error';
  metadata?: Record<string, any>;
}

interface GitMemoryStats {
  totalCommits: number;
  totalBranches: number;
  memorySize: string;
  lastSync: string;
  activeConnections: number;
}

interface GitMemoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitMemoryPanel: React.FC<GitMemoryPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'commits' | 'branches' | 'memory' | 'search'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gitMemoryData, setGitMemoryData] = useState<GitMemoryData[]>([]);
  const [stats, setStats] = useState<GitMemoryStats>({
    totalCommits: 0,
    totalBranches: 0,
    memorySize: '0 MB',
    lastSync: 'Never',
    activeConnections: 0
  });
  
  const { sendMessage, isConnected } = useMCP();

  // Fetch Git Memory data
  const fetchGitMemoryData = useCallback(async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      const response = await sendMessage({
        method: 'git-memory/get-data',
        params: {
          type: activeTab === 'overview' ? 'all' : activeTab,
          query: searchQuery,
          limit: 100
        }
      });
      
      if (response?.result) {
        setGitMemoryData(response.result.data || []);
        setStats(response.result.stats || stats);
      }
    } catch (error) {
      console.error('Failed to fetch git memory data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery, isConnected, sendMessage, stats]);

  // Sync with Git Memory Server
  const syncGitMemory = useCallback(async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      await sendMessage({
        method: 'git-memory/sync',
        params: {}
      });
      
      // Refresh data after sync
      await fetchGitMemoryData();
    } catch (error) {
      console.error('Failed to sync git memory:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, sendMessage, fetchGitMemoryData]);

  // Initialize data on mount and tab change
  useEffect(() => {
    if (isOpen && isConnected) {
      fetchGitMemoryData();
    }
  }, [isOpen, isConnected, fetchGitMemoryData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isOpen || !isConnected) return;
    
    const interval = setInterval(fetchGitMemoryData, 30000);
    return () => clearInterval(interval);
  }, [isOpen, isConnected, fetchGitMemoryData]);

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <GitCommit className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">Commits</span>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.totalCommits.toLocaleString()}</p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium">Branches</span>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.totalBranches}</p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium">Memory</span>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.memorySize}</p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium">Active</span>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.activeConnections}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <History className="w-5 h-5" />
            <span>Recent Activity</span>
          </h3>
        </div>
        <div className="p-4">
          {gitMemoryData.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center space-x-3 py-2">
              {renderStatusIcon(item.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-gray-500 truncate">{item.description}</p>
              </div>
              <span className="text-xs text-gray-400">{item.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDataList = () => (
    <div className="space-y-2">
      {gitMemoryData.map((item) => (
        <div key={item.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {renderStatusIcon(item.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium">{item.title}</h4>
                  {item.hash && (
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {item.hash.substring(0, 8)}
                    </code>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>{item.author}</span>
                  <span>{item.timestamp}</span>
                  {item.branch && <span>Branch: {item.branch}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold">Git Memory MCP Server</h2>
            <div className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              isConnected 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            )}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={syncGitMemory}
              disabled={!isConnected || isLoading}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
            >
              <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: Database },
            { id: 'commits', label: 'Commits', icon: GitCommit },
            { id: 'branches', label: 'Branches', icon: GitBranch },
            { id: 'memory', label: 'Memory', icon: Brain },
            { id: 'search', label: 'Search', icon: Search }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={cn(
                "flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        {activeTab === 'search' && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search git memory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : activeTab === 'overview' ? (
            renderOverview()
          ) : (
            renderDataList()
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Last sync: {stats.lastSync}</span>
            <div className="flex items-center space-x-4">
              <span>Memory: {stats.memorySize}</span>
              <span>Connections: {stats.activeConnections}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitMemoryPanel;