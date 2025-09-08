import React, { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useMCP } from '../providers/MCPProvider';
import {
  GitBranch,
  AlertCircle,
  CheckCircle,
  Info,
  Zap,
  Wifi,
  WifiOff,
  Activity,
  Clock,
  Code,
  FileText,
  Users,
  Database,
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  Thermometer,
  Bell,
  Settings,
  ChevronUp,
  Play,
  Square,
  RotateCcw,
} from 'lucide-react';

interface StatusBarProps {
  className?: string;
}

interface StatusItem {
  id: string;
  content: React.ReactNode;
  tooltip?: string;
  onClick?: () => void;
  priority: 'low' | 'medium' | 'high';
  position: 'left' | 'center' | 'right';
}

interface SystemStats {
  cpu: number;
  memory: number;
  disk: number;
  temperature: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ className = '' }) => {
  const { actualTheme } = useTheme();
  const { servers, activeServer, isConnecting } = useMCP();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStats, setSystemStats] = useState<SystemStats>({
    cpu: 45,
    memory: 68,
    disk: 32,
    temperature: 42,
  });
  const [notifications, setNotifications] = useState([
    { id: '1', type: 'error', message: 'TypeScript error in App.tsx', count: 2 },
    { id: '2', type: 'warning', message: 'Unused imports detected', count: 5 },
    { id: '3', type: 'info', message: 'Build completed successfully', count: 1 },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [buildStatus, setBuildStatus] = useState<'idle' | 'building' | 'success' | 'error'>('idle');
  const [collaborators, setCollaborators] = useState(2);
  const [currentFile, setCurrentFile] = useState('src/App.tsx');
  const [cursorPosition, setCursorPosition] = useState({ line: 42, column: 18 });
  const [selectedText, setSelectedText] = useState('');
  const [encoding, setEncoding] = useState('UTF-8');
  const [lineEnding, setLineEnding] = useState('LF');
  const [language, setLanguage] = useState('TypeScript');
  const [gitBranch, setGitBranch] = useState('main');
  const [gitStatus, setGitStatus] = useState({ ahead: 2, behind: 0, changes: 3 });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate system stats updates
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemStats({
        cpu: Math.floor(Math.random() * 30) + 30,
        memory: Math.floor(Math.random() * 20) + 60,
        disk: Math.floor(Math.random() * 10) + 30,
        temperature: Math.floor(Math.random() * 10) + 38,
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Handle status bar actions
  const handleAction = (action: string, data?: any) => {
    window.dispatchEvent(new CustomEvent(`nexus:statusbar-${action}`, { detail: data }));
  };

  // Get notification counts
  const errorCount = notifications.filter(n => n.type === 'error').reduce((sum, n) => sum + n.count, 0);
  const warningCount = notifications.filter(n => n.type === 'warning').reduce((sum, n) => sum + n.count, 0);
  const infoCount = notifications.filter(n => n.type === 'info').reduce((sum, n) => sum + n.count, 0);

  // Get connection status
  const connectedServers = servers.filter(s => s.status === 'connected').length;
  const totalServers = servers.length;

  // Status items configuration
  const statusItems: StatusItem[] = [
    // Left side items
    {
      id: 'git-branch',
      position: 'left',
      priority: 'high',
      tooltip: `Branch: ${gitBranch} (${gitStatus.ahead} ahead, ${gitStatus.behind} behind, ${gitStatus.changes} changes)`,
      onClick: () => handleAction('git-status'),
      content: (
        <div className="flex items-center space-x-1">
          <GitBranch className="w-3 h-3" />
          <span>{gitBranch}</span>
          {gitStatus.changes > 0 && (
            <span className="text-yellow-500">*{gitStatus.changes}</span>
          )}
        </div>
      ),
    },
    {
      id: 'notifications',
      position: 'left',
      priority: 'high',
      tooltip: `${errorCount} errors, ${warningCount} warnings, ${infoCount} info`,
      onClick: () => handleAction('notifications'),
      content: (
        <div className="flex items-center space-x-2">
          {errorCount > 0 && (
            <div className="flex items-center space-x-1 text-red-500">
              <AlertCircle className="w-3 h-3" />
              <span>{errorCount}</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center space-x-1 text-yellow-500">
              <AlertCircle className="w-3 h-3" />
              <span>{warningCount}</span>
            </div>
          )}
          {infoCount > 0 && (
            <div className="flex items-center space-x-1 text-blue-500">
              <Info className="w-3 h-3" />
              <span>{infoCount}</span>
            </div>
          )}
          {errorCount === 0 && warningCount === 0 && (
            <div className="flex items-center space-x-1 text-green-500">
              <CheckCircle className="w-3 h-3" />
              <span>No issues</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'build-status',
      position: 'left',
      priority: 'medium',
      tooltip: `Build status: ${buildStatus}`,
      onClick: () => handleAction('build-status'),
      content: (
        <div className="flex items-center space-x-1">
          {buildStatus === 'building' && <Activity className="w-3 h-3 animate-spin" />}
          {buildStatus === 'success' && <CheckCircle className="w-3 h-3 text-green-500" />}
          {buildStatus === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
          {buildStatus === 'idle' && <Square className="w-3 h-3" />}
          <span className="capitalize">{buildStatus}</span>
        </div>
      ),
    },
    {
      id: 'run-status',
      position: 'left',
      priority: 'medium',
      tooltip: isRunning ? 'Application is running' : 'Application is stopped',
      onClick: () => {
        setIsRunning(!isRunning);
        handleAction('toggle-run');
      },
      content: (
        <div className="flex items-center space-x-1">
          {isRunning ? (
            <>
              <Square className="w-3 h-3 text-red-500" />
              <span>Running</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 text-green-500" />
              <span>Stopped</span>
            </>
          )}
        </div>
      ),
    },

    // Center items
    {
      id: 'file-info',
      position: 'center',
      priority: 'high',
      tooltip: `Current file: ${currentFile}`,
      onClick: () => handleAction('file-info'),
      content: (
        <div className="flex items-center space-x-2">
          <FileText className="w-3 h-3" />
          <span>{currentFile}</span>
          <span className="text-muted-foreground">•</span>
          <span>{language}</span>
        </div>
      ),
    },
    {
      id: 'cursor-position',
      position: 'center',
      priority: 'medium',
      tooltip: `Line ${cursorPosition.line}, Column ${cursorPosition.column}${selectedText ? ` (${selectedText.length} selected)` : ''}`,
      onClick: () => handleAction('goto-line'),
      content: (
        <div className="flex items-center space-x-1">
          <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
          {selectedText && (
            <span className="text-muted-foreground">({selectedText.length} selected)</span>
          )}
        </div>
      ),
    },
    {
      id: 'encoding',
      position: 'center',
      priority: 'low',
      tooltip: `File encoding: ${encoding}, Line ending: ${lineEnding}`,
      onClick: () => handleAction('encoding'),
      content: (
        <div className="flex items-center space-x-2">
          <span>{encoding}</span>
          <span className="text-muted-foreground">•</span>
          <span>{lineEnding}</span>
        </div>
      ),
    },

    // Right side items
    {
      id: 'collaboration',
      position: 'right',
      priority: 'medium',
      tooltip: `${collaborators} collaborators online`,
      onClick: () => handleAction('collaboration'),
      content: (
        <div className="flex items-center space-x-1">
          <Users className="w-3 h-3" />
          <span>{collaborators}</span>
        </div>
      ),
    },
    {
      id: 'mcp-status',
      position: 'right',
      priority: 'high',
      tooltip: `MCP Servers: ${connectedServers}/${totalServers} connected`,
      onClick: () => handleAction('mcp-status'),
      content: (
        <div className="flex items-center space-x-1">
          {isConnecting ? (
            <Activity className="w-3 h-3 animate-pulse text-yellow-500" />
          ) : connectedServers === totalServers ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : connectedServers > 0 ? (
            <Wifi className="w-3 h-3 text-yellow-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          <span>{connectedServers}/{totalServers}</span>
        </div>
      ),
    },
    {
      id: 'system-stats',
      position: 'right',
      priority: 'low',
      tooltip: `CPU: ${systemStats.cpu}%, Memory: ${systemStats.memory}%, Disk: ${systemStats.disk}%, Temp: ${systemStats.temperature}C`,
      onClick: () => handleAction('system-stats'),
      content: (
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Cpu className="w-3 h-3" />
            <span>{systemStats.cpu}%</span>
          </div>
          <div className="flex items-center space-x-1">
            <MemoryStick className="w-3 h-3" />
            <span>{systemStats.memory}%</span>
          </div>
          <div className="flex items-center space-x-1">
            <Thermometer className={`w-3 h-3 ${
              systemStats.temperature > 70 ? 'text-red-500' : 
              systemStats.temperature > 50 ? 'text-yellow-500' : 'text-green-500'
            }`} />
            <span>{systemStats.temperature}C</span>
          </div>
        </div>
      ),
    },
    {
      id: 'current-time',
      position: 'right',
      priority: 'low',
      tooltip: currentTime.toLocaleString(),
      onClick: () => handleAction('time'),
      content: (
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ),
    },
  ];

  // Filter and sort status items
  const leftItems = statusItems.filter(item => item.position === 'left').sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  const centerItems = statusItems.filter(item => item.position === 'center').sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  const rightItems = statusItems.filter(item => item.position === 'right').sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  // Render status item
  const renderStatusItem = (item: StatusItem) => (
    <button
      key={item.id}
      onClick={item.onClick}
      className="flex items-center px-2 py-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors text-xs"
      title={item.tooltip}
    >
      {item.content}
    </button>
  );

  return (
    <div className={`flex items-center justify-between h-6 px-2 bg-muted/30 border-t border-border text-xs ${className}`}>
      {/* Left Section */}
      <div className="flex items-center space-x-1">
        {leftItems.map(renderStatusItem)}
      </div>

      {/* Center Section */}
      <div className="flex items-center space-x-1">
        {centerItems.map(renderStatusItem)}
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-1">
        {rightItems.map(renderStatusItem)}
        
        {/* Settings Button */}
        <button
          onClick={() => handleAction('settings')}
          className="flex items-center px-2 py-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
          title="Settings"
        >
          <Settings className="w-3 h-3" />
        </button>
        
        {/* Expand/Collapse Button */}
        <button
          onClick={() => handleAction('toggle-panel')}
          className="flex items-center px-2 py-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
          title="Toggle Panel"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default StatusBar;

// Status bar utilities and hooks
export const useStatusBarActions = () => {
  const handleAction = (action: string, data?: any) => {
    window.dispatchEvent(new CustomEvent(`nexus:statusbar-${action}`, { detail: data }));
  };

  return {
    showGitStatus: () => handleAction('git-status'),
    showNotifications: () => handleAction('notifications'),
    showBuildStatus: () => handleAction('build-status'),
    toggleRun: () => handleAction('toggle-run'),
    showFileInfo: () => handleAction('file-info'),
    gotoLine: () => handleAction('goto-line'),
    changeEncoding: () => handleAction('encoding'),
    showCollaboration: () => handleAction('collaboration'),
    showMCPStatus: () => handleAction('mcp-status'),
    showSystemStats: () => handleAction('system-stats'),
    showTime: () => handleAction('time'),
    openSettings: () => handleAction('settings'),
    togglePanel: () => handleAction('toggle-panel'),
  };
};

// Status bar configuration
export const statusBarConfig = {
  height: 24, // 6 * 4px = 24px
  zIndex: 40,
  updateInterval: 1000, // 1 second
  systemStatsInterval: 5000, // 5 seconds
};

// Status bar context for sharing state
export const StatusBarContext = React.createContext<{
  currentFile: string;
  setCurrentFile: (file: string) => void;
  cursorPosition: { line: number; column: number };
  setCursorPosition: (position: { line: number; column: number }) => void;
  selectedText: string;
  setSelectedText: (text: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  encoding: string;
  setEncoding: (encoding: string) => void;
  lineEnding: string;
  setLineEnding: (ending: string) => void;
} | null>(null);

// Status bar provider
export const StatusBarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentFile, setCurrentFile] = useState('src/App.tsx');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [selectedText, setSelectedText] = useState('');
  const [language, setLanguage] = useState('TypeScript');
  const [encoding, setEncoding] = useState('UTF-8');
  const [lineEnding, setLineEnding] = useState('LF');

  const value = {
    currentFile,
    setCurrentFile,
    cursorPosition,
    setCursorPosition,
    selectedText,
    setSelectedText,
    language,
    setLanguage,
    encoding,
    setEncoding,
    lineEnding,
    setLineEnding,
  };

  return (
    <StatusBarContext.Provider value={value}>
      {children}
    </StatusBarContext.Provider>
  );
};

// Hook to use status bar context
export const useStatusBar = () => {
  const context = React.useContext(StatusBarContext);
  if (!context) {
    throw new Error('useStatusBar must be used within a StatusBarProvider');
  }
  return context;
};

// Export status bar component with display name
StatusBar.displayName = 'StatusBar';

export { StatusBar };