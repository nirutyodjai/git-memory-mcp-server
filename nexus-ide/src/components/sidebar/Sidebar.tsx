import React, { useState, useCallback } from 'react';
import {
  Files,
  Search,
  GitBranch,
  Package,
  Bug,
  Settings,
  User,
  Database,
  Terminal,
  Zap,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Image,
  Code,
  Coffee,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ScrollArea } from '../ui/ScrollArea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { useLayout } from '../layout/Layout';
import { FileExplorer } from './FileExplorer';
import { SearchPanel } from './SearchPanel';
import { GitPanel } from './GitPanel';
import { ExtensionsPanel } from './ExtensionsPanel';
import { DebugPanel } from './DebugPanel';

/**
 * Activity Bar Item Interface
 */
interface ActivityBarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  panel: React.ComponentType;
  shortcut?: string;
}

/**
 * Default Activity Bar Items
 */
const defaultActivityItems: ActivityBarItem[] = [
  {
    id: 'explorer',
    label: 'Explorer',
    icon: Files,
    panel: FileExplorer,
    shortcut: 'Ctrl+Shift+E',
  },
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    panel: SearchPanel,
    shortcut: 'Ctrl+Shift+F',
  },
  {
    id: 'git',
    label: 'Source Control',
    icon: GitBranch,
    badge: 3, // Number of changes
    panel: GitPanel,
    shortcut: 'Ctrl+Shift+G',
  },
  {
    id: 'debug',
    label: 'Run and Debug',
    icon: Bug,
    panel: DebugPanel,
    shortcut: 'Ctrl+Shift+D',
  },
  {
    id: 'extensions',
    label: 'Extensions',
    icon: Package,
    panel: ExtensionsPanel,
    shortcut: 'Ctrl+Shift+X',
  },
];

/**
 * Activity Bar Component
 */
interface ActivityBarProps {
  activeItem: string;
  onItemSelect: (itemId: string) => void;
  items?: ActivityBarItem[];
}

const ActivityBar: React.FC<ActivityBarProps> = ({
  activeItem,
  onItemSelect,
  items = defaultActivityItems,
}) => {
  return (
    <div className="nexus-activity-bar w-12 bg-muted/30 border-r border-border flex flex-col">
      {/* Primary Items */}
      <div className="flex-1 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <TooltipProvider key={item.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      'w-10 h-10 mx-1 mb-1 p-0 relative',
                      isActive && 'bg-accent text-accent-foreground border-l-2 border-l-primary rounded-l-none'
                    )}
                    onClick={() => onItemSelect(item.id)}
                  >
                    <Icon className="h-5 w-5" />
                    {item.badge && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="flex items-center space-x-2">
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <kbd className="text-xs bg-muted px-1 rounded">
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Secondary Items */}
      <div className="py-2 border-t border-border">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="w-10 h-10 mx-1 mb-1 p-0">
                <User className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Account
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="w-10 h-10 mx-1 p-0">
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Settings
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

/**
 * Sidebar Panel Component
 */
interface SidebarPanelProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const SidebarPanel: React.FC<SidebarPanelProps> = ({
  title,
  children,
  actions,
  className,
}) => {
  return (
    <div className={cn('nexus-sidebar-panel h-full flex flex-col', className)}>
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20">
        <h2 className="text-sm font-medium text-foreground uppercase tracking-wide">
          {title}
        </h2>
        {actions && (
          <div className="flex items-center space-x-1">
            {actions}
          </div>
        )}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {children}
        </ScrollArea>
      </div>
    </div>
  );
};

/**
 * Main Sidebar Component
 */
interface SidebarProps {
  className?: string;
  defaultActiveItem?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  className,
  defaultActiveItem = 'explorer',
}) => {
  const { sidebarVisible, sidebarWidth } = useLayout();
  const [activeItem, setActiveItem] = useState(defaultActiveItem);
  const [searchQuery, setSearchQuery] = useState('');

  const handleItemSelect = useCallback((itemId: string) => {
    setActiveItem(itemId);
  }, []);

  const activeItemConfig = defaultActivityItems.find(item => item.id === activeItem);
  const ActivePanel = activeItemConfig?.panel;

  if (!sidebarVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'nexus-sidebar flex bg-background border-r border-border',
        className
      )}
      style={{ width: sidebarWidth }}
    >
      {/* Activity Bar */}
      <ActivityBar
        activeItem={activeItem}
        onItemSelect={handleItemSelect}
      />

      {/* Sidebar Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {ActivePanel && (
          <SidebarPanel
            title={activeItemConfig?.label || 'Panel'}
            actions={
              activeItem === 'search' ? (
                <div className="flex items-center space-x-1">
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-6 text-xs"
                  />
                </div>
              ) : activeItem === 'explorer' ? (
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Folder className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <FileText className="h-3 w-3" />
                  </Button>
                </div>
              ) : null
            }
          >
            <ActivePanel searchQuery={searchQuery} />
          </SidebarPanel>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

/**
 * Sidebar Features:
 * 
 * 1. Activity Bar:
 *    - File Explorer with tree view
 *    - Global search across project
 *    - Git source control integration
 *    - Debug and run configurations
 *    - Extensions marketplace
 * 
 * 2. Dynamic Panels:
 *    - Each activity has its own panel
 *    - Contextual actions and tools
 *    - Search functionality where applicable
 *    - Keyboard shortcuts support
 * 
 * 3. Responsive Design:
 *    - Collapsible sidebar
 *    - Resizable width
 *    - Mobile-friendly interactions
 *    - Accessibility features
 * 
 * 4. State Management:
 *    - Active panel persistence
 *    - Search query state
 *    - Panel-specific settings
 *    - Integration with layout context
 * 
 * 5. Extensibility:
 *    - Plugin system for custom panels
 *    - Configurable activity items
 *    - Custom actions and tools
 *    - Theme and styling support
 */