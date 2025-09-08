import React from 'react';
import { Menu, Search, Settings, User, Bell, GitBranch, Zap, Monitor, Brain } from 'lucide-react';
import ProxyDashboard from '../ProxyDashboard';
import GitMemoryPanel from '../GitMemoryPanel';
import { useLayout } from '../layout/Layout';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { ThemeToggle } from '../theme/ThemeToggle';
import { CommandPaletteButton } from '../command/CommandPaletteButton';
import { AIStatusIndicator } from '../ai/AIStatusIndicator';
import { CollaborationIndicator } from '../collaboration/CollaborationIndicator';
import { ProjectSelector } from '../project/ProjectSelector';
import { BreadcrumbNavigation } from '../navigation/BreadcrumbNavigation';

/**
 * NEXUS IDE Header Component
 * 
 * The main header bar that contains:
 * - Project selector and navigation
 * - Global search
 * - AI status indicator
 * - Collaboration tools
 * - User menu and settings
 * - Theme toggle
 * - Notification center
 */
export const Header: React.FC = () => {
  const { toggleSidebar, sidebarVisible } = useLayout();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [notifications, setNotifications] = React.useState(3);
  const [isProxyDashboardOpen, setIsProxyDashboardOpen] = React.useState(false);
  const [isGitMemoryPanelOpen, setIsGitMemoryPanelOpen] = React.useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement global search functionality
    console.log('Searching for:', query);
  };

  const handleNotificationClick = () => {
    // Open notification center
    const event = new CustomEvent('nexus:open-notifications');
    window.dispatchEvent(event);
  };

  return (
    <header className="nexus-header flex items-center justify-between px-4 py-2 h-12 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left Section - Navigation & Project */}
      <div className="flex items-center space-x-4">
        {/* Sidebar Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="nexus-button-ghost p-2"
          aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* NEXUS IDE Logo */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gradient-to-br from-nexus-400 to-nexus-600 text-white font-bold text-sm">
            N
          </div>
          <span className="font-semibold text-lg nexus-gradient-text hidden sm:inline">
            NEXUS IDE
          </span>
        </div>

        {/* Project Selector */}
        <ProjectSelector />

        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation />
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search files, symbols, commands... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="nexus-input pl-10 pr-4 bg-muted/50 border-muted focus:bg-background transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // Trigger search
                handleSearch(searchQuery);
              }
            }}
          />
        </div>
      </div>

      {/* Right Section - Tools & User */}
      <div className="flex items-center space-x-2">
        {/* AI Status Indicator */}
        <AIStatusIndicator />

        {/* Collaboration Indicator */}
        <CollaborationIndicator />

        {/* Git Branch Indicator */}
        <Button variant="ghost" size="sm" className="nexus-button-ghost">
          <GitBranch className="h-4 w-4 mr-1" />
          <span className="text-sm hidden md:inline">main</span>
          <Badge variant="secondary" className="ml-2 text-xs">
            3
          </Badge>
        </Button>

        {/* Command Palette Button */}
        <CommandPaletteButton />

        {/* Proxy Dashboard Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsProxyDashboardOpen(true)}
          className="nexus-button-ghost"
          aria-label="Proxy Dashboard"
          title="Open Proxy Dashboard"
        >
          <Monitor className="h-4 w-4" />
        </Button>

        {/* Git Memory Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsGitMemoryPanelOpen(true)}
          className="nexus-button-ghost"
          aria-label="Git Memory MCP Server"
          title="Git Memory MCP Server"
        >
          <Brain className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNotificationClick}
          className="nexus-button-ghost relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {notifications > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {notifications}
            </Badge>
          )}
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Settings Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="nexus-button-ghost">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Zap className="mr-2 h-4 w-4" />
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <GitBranch className="mr-2 h-4 w-4" />
              <span>Extensions</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Workspace Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span>Keyboard Shortcuts</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatars/user.png" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Developer</p>
                <p className="text-xs leading-none text-muted-foreground">
                  developer@nexus-ide.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Account Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Proxy Dashboard Modal */}
      <ProxyDashboard 
        isOpen={isProxyDashboardOpen}
        onClose={() => setIsProxyDashboardOpen(false)}
      />

      {/* Git Memory Panel Modal */}
      <GitMemoryPanel 
        isOpen={isGitMemoryPanelOpen}
        onClose={() => setIsGitMemoryPanelOpen(false)}
      />
    </header>
  );
};

export default Header;

/**
 * Header Features:
 * 
 * 1. Navigation:
 *    - Sidebar toggle button
 *    - Project selector with recent projects
 *    - Breadcrumb navigation for current file path
 * 
 * 2. Search:
 *    - Global search with keyboard shortcut (Ctrl+K)
 *    - Search across files, symbols, and commands
 *    - Real-time search suggestions
 * 
 * 3. Status Indicators:
 *    - AI assistant status and availability
 *    - Real-time collaboration status
 *    - Git branch and changes indicator
 * 
 * 4. Tools:
 *    - Command palette access
 *    - Notification center with badge
 *    - Theme toggle (light/dark/auto)
 *    - Settings and preferences
 * 
 * 5. User Management:
 *    - User avatar and profile
 *    - Account settings
 *    - Sign in/out functionality
 * 
 * 6. Responsive Design:
 *    - Adapts to different screen sizes
 *    - Hides non-essential elements on mobile
 *    - Maintains accessibility standards
 */