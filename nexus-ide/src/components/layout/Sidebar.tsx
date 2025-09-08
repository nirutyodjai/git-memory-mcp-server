import React, { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useMCP } from '../providers/MCPProvider';
import {
  Files,
  Search,
  GitBranch,
  Bug,
  Package,
  Settings,
  Terminal,
  Database,
  Zap,
  Bot,
  Users,
  Activity,
  Bookmark,
  History,
  Globe,
  Code,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  Plus,
  MoreHorizontal,
  Wifi,
} from 'lucide-react';
import ProxyStatus from '../ProxyStatus';

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  badge?: string | number;
  children?: SidebarItem[];
  action?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  className = '', 
  isCollapsed = false, 
  onToggleCollapse 
}) => {
  const { actualTheme } = useTheme();
  const { servers, activeServer } = useMCP();
  const [activeTab, setActiveTab] = useState('explorer');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['workspace']));
  const [recentFiles, setRecentFiles] = useState<string[]>([
    'src/App.tsx',
    'src/components/Header.tsx',
    'package.json',
    'README.md',
  ]);

  // Sidebar tabs configuration
  const sidebarTabs: SidebarItem[] = [
    {
      id: 'explorer',
      label: 'Explorer',
      icon: <Files className="w-5 h-5" />,
      isActive: activeTab === 'explorer',
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="w-5 h-5" />,
      isActive: activeTab === 'search',
    },
    {
      id: 'git',
      label: 'Source Control',
      icon: <GitBranch className="w-5 h-5" />,
      isActive: activeTab === 'git',
      badge: '3',
    },
    {
      id: 'debug',
      label: 'Run and Debug',
      icon: <Bug className="w-5 h-5" />,
      isActive: activeTab === 'debug',
    },
    {
      id: 'extensions',
      label: 'Extensions',
      icon: <Package className="w-5 h-5" />,
      isActive: activeTab === 'extensions',
    },
    {
      id: 'ai-assistant',
      label: 'AI Assistant',
      icon: <Bot className="w-5 h-5" />,
      isActive: activeTab === 'ai-assistant',
      badge: 'AI',
    },
    {
      id: 'collaboration',
      label: 'Collaboration',
      icon: <Users className="w-5 h-5" />,
      isActive: activeTab === 'collaboration',
      badge: '2',
    },
    {
      id: 'database',
      label: 'Database',
      icon: <Database className="w-5 h-5" />,
      isActive: activeTab === 'database',
    },
    {
      id: 'terminal',
      label: 'Terminal',
      icon: <Terminal className="w-5 h-5" />,
      isActive: activeTab === 'terminal',
    },
  ];

  // File explorer mock data
  const fileExplorerData: SidebarItem[] = [
    {
      id: 'workspace',
      label: 'NEXUS-IDE',
      icon: expandedItems.has('workspace') ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />,
      children: [
        {
          id: 'src',
          label: 'src',
          icon: expandedItems.has('src') ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />,
          children: [
            {
              id: 'components',
              label: 'components',
              icon: <Folder className="w-4 h-4" />,
            },
            {
              id: 'hooks',
              label: 'hooks',
              icon: <Folder className="w-4 h-4" />,
            },
            {
              id: 'utils',
              label: 'utils',
              icon: <Folder className="w-4 h-4" />,
            },
            {
              id: 'app-tsx',
              label: 'App.tsx',
              icon: <File className="w-4 h-4" />,
            },
            {
              id: 'main-tsx',
              label: 'main.tsx',
              icon: <File className="w-4 h-4" />,
            },
          ],
        },
        {
          id: 'public',
          label: 'public',
          icon: <Folder className="w-4 h-4" />,
        },
        {
          id: 'package-json',
          label: 'package.json',
          icon: <File className="w-4 h-4" />,
        },
        {
          id: 'tsconfig-json',
          label: 'tsconfig.json',
          icon: <File className="w-4 h-4" />,
        },
        {
          id: 'vite-config',
          label: 'vite.config.ts',
          icon: <File className="w-4 h-4" />,
        },
        {
          id: 'readme',
          label: 'README.md',
          icon: <File className="w-4 h-4" />,
        },
      ],
    },
  ];

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.dispatchEvent(new CustomEvent(`nexus:sidebar-${tabId}`));
  };

  // Handle item expansion
  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Render file tree item
  const renderFileTreeItem = (item: SidebarItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const paddingLeft = level * 12 + 8;

    return (
      <div key={item.id}>
        <div
          className={`flex items-center py-1 px-2 hover:bg-accent hover:text-accent-foreground cursor-pointer group transition-colors`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else {
              window.dispatchEvent(new CustomEvent('nexus:file-open', { detail: { file: item.label } }));
            }
          }}
        >
          {hasChildren && (
            <button
              className="mr-1 p-0.5 hover:bg-accent rounded"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(item.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4 mr-1" />}
          <div className="mr-2">{item.icon}</div>
          <span className="flex-1 text-sm truncate">{item.label}</span>
          {level === 0 && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1 hover:bg-accent rounded">
                <Plus className="w-3 h-3" />
              </button>
              <button className="p-1 hover:bg-accent rounded">
                <MoreHorizontal className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {item.children!.map(child => renderFileTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render sidebar content based on active tab
  const renderSidebarContent = () => {
    switch (activeTab) {
      case 'explorer':
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Explorer
                </h3>
                <div className="flex space-x-1">
                  <button className="p-1 hover:bg-accent rounded">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button className="p-1 hover:bg-accent rounded">
                    <MoreHorizontal className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {fileExplorerData.map(item => renderFileTreeItem(item))}
            </div>
            
            {/* Recent Files */}
            <div className="p-2 border-t border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Recent Files
              </h3>
              {recentFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center py-1 px-2 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                  onClick={() => window.dispatchEvent(new CustomEvent('nexus:file-open', { detail: { file } }))}
                >
                  <History className="w-4 h-4 mr-2" />
                  <span className="text-sm truncate">{file}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="flex-1 p-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Search
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search files..."
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="text"
                placeholder="Replace..."
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors">
                  Search
                </button>
                <button className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80 transition-colors">
                  Replace All
                </button>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">No results found</div>
            </div>
          </div>
        );

      case 'git':
        return (
          <div className="flex-1 p-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Source Control
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Changes (3)</span>
                <div className="flex space-x-1">
                  <button className="p-1 hover:bg-accent rounded">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button className="p-1 hover:bg-accent rounded">
                    <MoreHorizontal className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center py-1 px-2 hover:bg-accent rounded cursor-pointer">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm">src/App.tsx</span>
                </div>
                <div className="flex items-center py-1 px-2 hover:bg-accent rounded cursor-pointer">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm">src/components/Header.tsx</span>
                </div>
                <div className="flex items-center py-1 px-2 hover:bg-accent rounded cursor-pointer">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm">package.json</span>
                </div>
              </div>
              <textarea
                placeholder="Commit message..."
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
              />
              <button className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors">
                Commit
              </button>
            </div>
          </div>
        );

      case 'ai-assistant':
        return (
          <div className="flex-1 p-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              AI Assistant
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-muted rounded-md">
                <div className="flex items-center space-x-2 mb-2">
                  <Bot className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">NEXUS AI</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready to help with coding, debugging, and optimization.
                </p>
              </div>
              <div className="space-y-1">
                <button className="w-full text-left px-3 py-2 hover:bg-accent rounded-md text-sm transition-colors">
                  Code Suggestions
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-accent rounded-md text-sm transition-colors">
                  Debug Assistant
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-accent rounded-md text-sm transition-colors">
                  Code Review
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-accent rounded-md text-sm transition-colors">
                  Performance Tips
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-accent rounded-md text-sm transition-colors">
                  Documentation
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex-1 p-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {sidebarTabs.find(tab => tab.id === activeTab)?.label}
            </h3>
            <div className="text-sm text-muted-foreground">
              Content for {activeTab} will be implemented here.
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`flex h-full bg-background border-r border-border ${className}`}>
      {/* Sidebar Tabs */}
      <div className="w-12 bg-muted/30 border-r border-border flex flex-col">
        {/* Tab Icons */}
        <div className="flex-1">
          {sidebarTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative w-full h-12 flex items-center justify-center hover:bg-accent transition-colors ${
                tab.isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              }`}
              title={tab.label}
            >
              {tab.icon}
              {tab.badge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
              {tab.isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"></div>
              )}
            </button>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-border">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('nexus:settings'))}
            className="w-full h-12 flex items-center justify-center hover:bg-accent text-muted-foreground transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ProxyStatus */}
       {!isCollapsed && (
         <div className="absolute bottom-2 left-14 right-2">
           <ProxyStatus />
         </div>
       )}
 
        {/* Sidebar Content */}
        {!isCollapsed && (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="h-8 flex items-center justify-between px-2 border-b border-border bg-muted/20">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {sidebarTabs.find(tab => tab.id === activeTab)?.label}
            </span>
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-accent rounded transition-colors"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="w-3 h-3" />
            </button>
          </div>

          {/* Content */}
          {renderSidebarContent()}
        </div>
      )}

      {/* Collapsed State Toggle */}
      {isCollapsed && onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute top-2 -right-3 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center hover:bg-accent transition-colors z-10"
          title="Expand Sidebar"
        >
          <PanelLeftOpen className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default Sidebar;

// Sidebar utilities and hooks
export const useSidebarActions = () => {
  const [activeTab, setActiveTab] = useState('explorer');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const switchTab = (tabId: string) => {
    setActiveTab(tabId);
    window.dispatchEvent(new CustomEvent(`nexus:sidebar-${tabId}`));
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    window.dispatchEvent(new CustomEvent('nexus:sidebar-toggle'));
  };

  return {
    activeTab,
    isCollapsed,
    switchTab,
    toggleCollapse,
    setActiveTab,
    setIsCollapsed,
  };
};

// Sidebar configuration
export const sidebarConfig = {
  defaultWidth: 280,
  collapsedWidth: 48,
  minWidth: 200,
  maxWidth: 400,
  tabWidth: 48,
};

// Export sidebar component with display name
Sidebar.displayName = 'Sidebar';

export { Sidebar };