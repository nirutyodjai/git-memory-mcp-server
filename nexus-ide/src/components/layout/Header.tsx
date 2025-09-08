import React, { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useMCP } from '../providers/MCPProvider';
import { useKeyboardShortcuts } from '../providers/KeyboardShortcutsProvider';
import {
  Menu,
  Settings,
  Sun,
  Moon,
  Monitor,
  Wifi,
  WifiOff,
  Activity,
  Bell,
  Search,
  Command,
  GitBranch,
  Users,
  Zap,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const { theme, setTheme, actualTheme } = useTheme();
  const { servers, activeServer, isConnecting } = useMCP();
  const { shortcuts } = useKeyboardShortcuts();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);
  const [notifications, setNotifications] = useState(3); // Mock notifications

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Handle theme toggle
  const handleThemeToggle = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  // Get theme icon
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'system':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  // Get connection status
  const connectedServers = servers.filter(s => s.status === 'connected').length;
  const totalServers = servers.length;

  // Handle menu actions
  const handleMenuAction = (action: string) => {
    window.dispatchEvent(new CustomEvent(`nexus:${action}`));
  };

  return (
    <header className={`flex items-center justify-between h-12 px-4 bg-background border-b border-border ${className}`}>
      {/* Left Section - Logo and Menu */}
      <div className="flex items-center space-x-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            NEXUS IDE
          </span>
        </div>

        {/* Main Menu */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => handleMenuAction('file-menu')}
            className="px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded transition-colors"
          >
            File
          </button>
          <button
            onClick={() => handleMenuAction('edit-menu')}
            className="px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => handleMenuAction('view-menu')}
            className="px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded transition-colors"
          >
            View
          </button>
          <button
            onClick={() => handleMenuAction('run-menu')}
            className="px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded transition-colors"
          >
            Run
          </button>
          <button
            onClick={() => handleMenuAction('terminal-menu')}
            className="px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded transition-colors"
          >
            Terminal
          </button>
          <button
            onClick={() => handleMenuAction('help-menu')}
            className="px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded transition-colors"
          >
            Help
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => handleMenuAction('mobile-menu')}
          className="md:hidden p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Center Section - Search and Command Palette */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <button
            onClick={() => handleMenuAction('command-palette')}
            className="w-full flex items-center space-x-2 px-3 py-1.5 bg-muted text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Search files, commands...</span>
            <div className="flex items-center space-x-1 text-xs">
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">
                Ctrl
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">
                Shift
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">
                P
              </kbd>
            </div>
          </button>
        </div>
      </div>

      {/* Right Section - Status and Controls */}
      <div className="flex items-center space-x-2">
        {/* Git Branch */}
        <div className="hidden sm:flex items-center space-x-1 px-2 py-1 bg-muted rounded text-sm">
          <GitBranch className="w-3 h-3" />
          <span>main</span>
        </div>

        {/* Connection Status */}
        <div className="relative">
          <button
            onClick={() => setShowConnectionStatus(!showConnectionStatus)}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-sm transition-colors ${
              connectedServers === totalServers
                ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                : connectedServers > 0
                ? 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            {isConnecting ? (
              <Activity className="w-4 h-4 animate-pulse" />
            ) : connectedServers > 0 ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {connectedServers}/{totalServers}
            </span>
          </button>

          {/* Connection Status Dropdown */}
          {showConnectionStatus && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-popover border border-border rounded-md shadow-lg z-50">
              <div className="p-3">
                <h3 className="font-medium text-sm mb-2">MCP Server Status</h3>
                <div className="space-y-2">
                  {servers.map(server => (
                    <div key={server.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{server.name}</span>
                      <div className={`flex items-center space-x-1 ${
                        server.status === 'connected'
                          ? 'text-green-600'
                          : server.status === 'connecting'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {server.status === 'connecting' ? (
                          <Activity className="w-3 h-3 animate-pulse" />
                        ) : server.status === 'connected' ? (
                          <Wifi className="w-3 h-3" />
                        ) : (
                          <WifiOff className="w-3 h-3" />
                        )}
                        <span className="capitalize">{server.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {activeServer && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      Active: {activeServer.name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button
          onClick={() => handleMenuAction('notifications')}
          className="relative p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
        >
          <Bell className="w-4 h-4" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {notifications > 9 ? '9+' : notifications}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={handleThemeToggle}
          className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
          title={`Current theme: ${theme} (${actualTheme})`}
        >
          {getThemeIcon()}
        </button>

        {/* Collaboration */}
        <button
          onClick={() => handleMenuAction('collaboration')}
          className="hidden sm:flex items-center space-x-1 px-2 py-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors text-sm"
        >
          <Users className="w-4 h-4" />
          <span>2</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => handleMenuAction('settings')}
          className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 px-2 py-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
          >
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
              U
            </div>
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-lg z-50">
              <div className="p-2">
                <div className="px-2 py-1.5 text-sm font-medium">User Account</div>
                <div className="px-2 py-1 text-xs text-muted-foreground mb-2">user@nexus-ide.com</div>
                <hr className="border-border mb-2" />
                <button
                  onClick={() => handleMenuAction('profile')}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                >
                  Profile Settings
                </button>
                <button
                  onClick={() => handleMenuAction('preferences')}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                >
                  Preferences
                </button>
                <button
                  onClick={() => handleMenuAction('keyboard-shortcuts')}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                >
                  Keyboard Shortcuts
                </button>
                <hr className="border-border my-2" />
                <button
                  onClick={() => handleMenuAction('sign-out')}
                  className="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current Time */}
        <div className="hidden lg:block text-sm text-muted-foreground">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Click outside handlers */}
      {(showUserMenu || showConnectionStatus) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowConnectionStatus(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;

// Header utilities and hooks
export const useHeaderActions = () => {
  const handleAction = (action: string) => {
    window.dispatchEvent(new CustomEvent(`nexus:${action}`));
  };

  return {
    openFileMenu: () => handleAction('file-menu'),
    openEditMenu: () => handleAction('edit-menu'),
    openViewMenu: () => handleAction('view-menu'),
    openRunMenu: () => handleAction('run-menu'),
    openTerminalMenu: () => handleAction('terminal-menu'),
    openHelpMenu: () => handleAction('help-menu'),
    openCommandPalette: () => handleAction('command-palette'),
    openSettings: () => handleAction('settings'),
    openNotifications: () => handleAction('notifications'),
    openCollaboration: () => handleAction('collaboration'),
    openProfile: () => handleAction('profile'),
    signOut: () => handleAction('sign-out'),
  };
};

// Header configuration
export const headerConfig = {
  height: 48, // 12 * 4px = 48px
  zIndex: 50,
  breakpoints: {
    mobile: 768,
    tablet: 1024,
  },
};

// Export header component with display name
Header.displayName = 'Header';

export { Header };