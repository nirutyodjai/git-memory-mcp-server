import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useMCP } from '../providers/MCPProvider';
import { useKeyboardShortcuts } from '../providers/KeyboardShortcutsProvider';
import MonacoEditor from '../editor/MonacoEditor';
import Terminal from '../terminal/Terminal';
import FileExplorer from '../explorer/FileExplorer';
import {
  Split,
  Maximize2,
  Minimize2,
  X,
  Plus,
  MoreHorizontal,
  Code,
  Terminal as TerminalIcon,
  FileText,
  Search,
  GitBranch,
  Bug,
  Settings,
  Layers,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RefreshCw,
  Zap,
  Brain,
  Users,
  MessageSquare,
  Video,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react';

// Main layout types
interface TabItem {
  id: string;
  title: string;
  type: 'editor' | 'terminal' | 'output' | 'problems' | 'debug' | 'preview' | 'custom';
  icon?: React.ReactNode;
  content?: React.ReactNode;
  filePath?: string;
  isModified?: boolean;
  isActive?: boolean;
  isPinned?: boolean;
  canClose?: boolean;
}

interface PanelConfig {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  position: 'top' | 'bottom' | 'left' | 'right';
  isVisible?: boolean;
  isCollapsed?: boolean;
}

interface MainProps {
  className?: string;
  sidebarWidth?: number;
  panelHeight?: number;
  onSidebarResize?: (width: number) => void;
  onPanelResize?: (height: number) => void;
}

interface LayoutState {
  activeEditorTab: string | null;
  activeBottomTab: string | null;
  activeRightTab: string | null;
  editorTabs: TabItem[];
  bottomTabs: TabItem[];
  rightTabs: TabItem[];
  splitView: {
    enabled: boolean;
    orientation: 'horizontal' | 'vertical';
    sizes: number[];
  };
  panels: {
    bottom: {
      isVisible: boolean;
      height: number;
      isCollapsed: boolean;
    };
    right: {
      isVisible: boolean;
      width: number;
      isCollapsed: boolean;
    };
  };
}

const Main: React.FC<MainProps> = ({
  className = '',
  sidebarWidth = 300,
  panelHeight = 300,
  onSidebarResize,
  onPanelResize,
}) => {
  const { actualTheme } = useTheme();
  const { servers, sendMessage } = useMCP();
  const { executeShortcut } = useKeyboardShortcuts();
  const mainRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const bottomPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  
  const [layoutState, setLayoutState] = useState<LayoutState>({
    activeEditorTab: null,
    activeBottomTab: 'terminal',
    activeRightTab: null,
    editorTabs: [],
    bottomTabs: [
      {
        id: 'terminal',
        title: 'Terminal',
        type: 'terminal',
        icon: <TerminalIcon className="w-4 h-4" />,
        isActive: true,
        canClose: false,
      },
      {
        id: 'output',
        title: 'Output',
        type: 'output',
        icon: <FileText className="w-4 h-4" />,
        canClose: false,
      },
      {
        id: 'problems',
        title: 'Problems',
        type: 'problems',
        icon: <Bug className="w-4 h-4" />,
        canClose: false,
      },
      {
        id: 'debug',
        title: 'Debug Console',
        type: 'debug',
        icon: <Bug className="w-4 h-4" />,
        canClose: false,
      },
    ],
    rightTabs: [],
    splitView: {
      enabled: false,
      orientation: 'vertical',
      sizes: [50, 50],
    },
    panels: {
      bottom: {
        isVisible: true,
        height: panelHeight,
        isCollapsed: false,
      },
      right: {
        isVisible: false,
        width: 300,
        isCollapsed: false,
      },
    },
  });

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dragType: 'bottom-panel' | 'right-panel' | null;
    startY: number;
    startX: number;
    startHeight: number;
    startWidth: number;
  }>({ isDragging: false, dragType: null, startY: 0, startX: 0, startHeight: 0, startWidth: 0 });

  // Handle file opening
  const openFile = useCallback((filePath: string, content?: string) => {
    const existingTab = layoutState.editorTabs.find(tab => tab.filePath === filePath);
    
    if (existingTab) {
      setLayoutState(prev => ({
        ...prev,
        activeEditorTab: existingTab.id,
        editorTabs: prev.editorTabs.map(tab => ({
          ...tab,
          isActive: tab.id === existingTab.id,
        })),
      }));
      return;
    }

    const newTab: TabItem = {
      id: `editor-${Date.now()}`,
      title: filePath.split('/').pop() || 'Untitled',
      type: 'editor',
      icon: <Code className="w-4 h-4" />,
      filePath,
      isModified: false,
      isActive: true,
      canClose: true,
    };

    setLayoutState(prev => ({
      ...prev,
      activeEditorTab: newTab.id,
      editorTabs: [
        ...prev.editorTabs.map(tab => ({ ...tab, isActive: false })),
        newTab,
      ],
    }));
  }, [layoutState.editorTabs]);

  // Handle tab closing
  const closeTab = useCallback((tabId: string, tabType: 'editor' | 'bottom' | 'right') => {
    setLayoutState(prev => {
      const tabsKey = `${tabType}Tabs` as keyof Pick<LayoutState, 'editorTabs' | 'bottomTabs' | 'rightTabs'>;
      const activeKey = `active${tabType.charAt(0).toUpperCase() + tabType.slice(1)}Tab` as keyof Pick<LayoutState, 'activeEditorTab' | 'activeBottomTab' | 'activeRightTab'>;
      
      const tabs = prev[tabsKey] as TabItem[];
      const filteredTabs = tabs.filter(tab => tab.id !== tabId);
      
      let newActiveTab = prev[activeKey];
      if (newActiveTab === tabId) {
        newActiveTab = filteredTabs.length > 0 ? filteredTabs[filteredTabs.length - 1].id : null;
      }
      
      return {
        ...prev,
        [tabsKey]: filteredTabs.map(tab => ({
          ...tab,
          isActive: tab.id === newActiveTab,
        })),
        [activeKey]: newActiveTab,
      };
    });
  }, []);

  // Handle tab activation
  const activateTab = useCallback((tabId: string, tabType: 'editor' | 'bottom' | 'right') => {
    setLayoutState(prev => {
      const tabsKey = `${tabType}Tabs` as keyof Pick<LayoutState, 'editorTabs' | 'bottomTabs' | 'rightTabs'>;
      const activeKey = `active${tabType.charAt(0).toUpperCase() + tabType.slice(1)}Tab` as keyof Pick<LayoutState, 'activeEditorTab' | 'activeBottomTab' | 'activeRightTab'>;
      
      return {
        ...prev,
        [activeKey]: tabId,
        [tabsKey]: (prev[tabsKey] as TabItem[]).map(tab => ({
          ...tab,
          isActive: tab.id === tabId,
        })),
      };
    });
  }, []);

  // Handle panel toggle
  const togglePanel = useCallback((panel: 'bottom' | 'right') => {
    setLayoutState(prev => ({
      ...prev,
      panels: {
        ...prev.panels,
        [panel]: {
          ...prev.panels[panel],
          isVisible: !prev.panels[panel].isVisible,
        },
      },
    }));
  }, []);

  // Handle panel collapse
  const togglePanelCollapse = useCallback((panel: 'bottom' | 'right') => {
    setLayoutState(prev => ({
      ...prev,
      panels: {
        ...prev.panels,
        [panel]: {
          ...prev.panels[panel],
          isCollapsed: !prev.panels[panel].isCollapsed,
        },
      },
    }));
  }, []);

  // Handle drag start for panel resizing
  const handleDragStart = useCallback((e: React.MouseEvent, dragType: 'bottom-panel' | 'right-panel') => {
    e.preventDefault();
    
    const startY = e.clientY;
    const startX = e.clientX;
    const startHeight = layoutState.panels.bottom.height;
    const startWidth = layoutState.panels.right.width;
    
    setDragState({
      isDragging: true,
      dragType,
      startY,
      startX,
      startHeight,
      startWidth,
    });
  }, [layoutState.panels]);

  // Handle drag move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.dragType) return;
      
      if (dragState.dragType === 'bottom-panel') {
        const deltaY = dragState.startY - e.clientY;
        const newHeight = Math.max(100, Math.min(600, dragState.startHeight + deltaY));
        
        setLayoutState(prev => ({
          ...prev,
          panels: {
            ...prev.panels,
            bottom: {
              ...prev.panels.bottom,
              height: newHeight,
            },
          },
        }));
        
        onPanelResize?.(newHeight);
      } else if (dragState.dragType === 'right-panel') {
        const deltaX = dragState.startX - e.clientX;
        const newWidth = Math.max(200, Math.min(600, dragState.startWidth + deltaX));
        
        setLayoutState(prev => ({
          ...prev,
          panels: {
            ...prev.panels,
            right: {
              ...prev.panels.right,
              width: newWidth,
            },
          },
        }));
      }
    };

    const handleMouseUp = () => {
      setDragState(prev => ({ ...prev, isDragging: false, dragType: null }));
    };

    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, onPanelResize]);

  // Keyboard shortcuts
  useEffect(() => {
    const shortcuts = {
      'Ctrl+`': () => togglePanel('bottom'),
      'Ctrl+Shift+`': () => togglePanelCollapse('bottom'),
      'Ctrl+W': () => {
        if (layoutState.activeEditorTab) {
          closeTab(layoutState.activeEditorTab, 'editor');
        }
      },
      'Ctrl+Tab': () => {
        const tabs = layoutState.editorTabs;
        if (tabs.length > 1) {
          const currentIndex = tabs.findIndex(tab => tab.id === layoutState.activeEditorTab);
          const nextIndex = (currentIndex + 1) % tabs.length;
          activateTab(tabs[nextIndex].id, 'editor');
        }
      },
      'Ctrl+Shift+Tab': () => {
        const tabs = layoutState.editorTabs;
        if (tabs.length > 1) {
          const currentIndex = tabs.findIndex(tab => tab.id === layoutState.activeEditorTab);
          const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
          activateTab(tabs[prevIndex].id, 'editor');
        }
      },
    };

    Object.entries(shortcuts).forEach(([key, handler]) => {
      executeShortcut(key, handler);
    });
  }, [executeShortcut, layoutState, togglePanel, togglePanelCollapse, closeTab, activateTab]);

  // Render tab bar
  const renderTabBar = (tabs: TabItem[], tabType: 'editor' | 'bottom' | 'right') => {
    if (tabs.length === 0) return null;

    return (
      <div className="flex items-center bg-muted/30 border-b border-border">
        <div className="flex-1 flex items-center overflow-x-auto">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`flex items-center px-3 py-2 border-r border-border cursor-pointer transition-colors ${
                tab.isActive
                  ? 'bg-background text-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              onClick={() => activateTab(tab.id, tabType)}
            >
              {tab.icon}
              <span className="ml-2 text-sm">{tab.title}</span>
              {tab.isModified && (
                <div className="w-2 h-2 bg-primary rounded-full ml-2" />
              )}
              {tab.canClose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id, tabType);
                  }}
                  className="ml-2 p-1 hover:bg-destructive hover:text-destructive-foreground rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex items-center px-2">
          <button
            onClick={() => {
              // Add new tab logic here
            }}
            className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
            title="New Tab"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors ml-1"
            title="More Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Render tab content
  const renderTabContent = (tabs: TabItem[], activeTabId: string | null) => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (!activeTab) return null;

    switch (activeTab.type) {
      case 'editor':
        return (
          <MonacoEditor
            filePath={activeTab.filePath}
            className="h-full"
          />
        );
      case 'terminal':
        return <Terminal className="h-full" />;
      case 'output':
        return (
          <div className="h-full p-4 font-mono text-sm">
            <div className="text-muted-foreground mb-2">Output Console</div>
            <div className="space-y-1">
              <div>[INFO] Build completed successfully</div>
              <div>[INFO] Server started on port 3000</div>
              <div className="text-green-500">[SUCCESS] All tests passed</div>
            </div>
          </div>
        );
      case 'problems':
        return (
          <div className="h-full p-4">
            <div className="text-muted-foreground mb-2">Problems</div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-red-500">
                <Bug className="w-4 h-4" />
                <span className="text-sm">Error: Unused variable 'x' in main.ts:42</span>
              </div>
              <div className="flex items-center space-x-2 text-yellow-500">
                <Bug className="w-4 h-4" />
                <span className="text-sm">Warning: Missing return type in utils.ts:15</span>
              </div>
            </div>
          </div>
        );
      case 'debug':
        return (
          <div className="h-full p-4 font-mono text-sm">
            <div className="text-muted-foreground mb-2">Debug Console</div>
            <div className="space-y-1">
              <div className="text-blue-500">[DEBUG] Breakpoint hit at line 25</div>
              <div>[LOG] Variable value: {'{"name": "test", "value": 42}'}</div>
              <div className="text-green-500">[TRACE] Function call stack</div>
            </div>
          </div>
        );
      default:
        return activeTab.content || <div className="h-full flex items-center justify-center text-muted-foreground">No content</div>;
    }
  };

  return (
    <div ref={mainRef} className={`flex-1 flex flex-col ${className}`}>
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Editor Tabs */}
        {renderTabBar(layoutState.editorTabs, 'editor')}
        
        {/* Editor Content */}
        <div ref={editorRef} className="flex-1 relative">
          {layoutState.editorTabs.length > 0 ? (
            renderTabContent(layoutState.editorTabs, layoutState.activeEditorTab)
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Welcome to NEXUS IDE</h3>
                <p className="text-sm">Open a file to start coding</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Panel */}
      {layoutState.panels.bottom.isVisible && (
        <>
          {/* Bottom Panel Resizer */}
          <div
            className="h-1 bg-border hover:bg-primary cursor-row-resize transition-colors"
            onMouseDown={(e) => handleDragStart(e, 'bottom-panel')}
          />
          
          {/* Bottom Panel Content */}
          <div
            ref={bottomPanelRef}
            className="flex flex-col border-t border-border"
            style={{
              height: layoutState.panels.bottom.isCollapsed ? 'auto' : layoutState.panels.bottom.height,
            }}
          >
            {/* Bottom Panel Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
              <div className="flex items-center space-x-4">
                {renderTabBar(layoutState.bottomTabs, 'bottom')}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => togglePanelCollapse('bottom')}
                  className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                  title={layoutState.panels.bottom.isCollapsed ? 'Expand' : 'Collapse'}
                >
                  {layoutState.panels.bottom.isCollapsed ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Minimize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => togglePanel('bottom')}
                  className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                  title="Close Panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Bottom Panel Content */}
            {!layoutState.panels.bottom.isCollapsed && (
              <div className="flex-1">
                {renderTabContent(layoutState.bottomTabs, layoutState.activeBottomTab)}
              </div>
            )}
          </div>
        </>
      )}

      {/* Right Panel */}
      {layoutState.panels.right.isVisible && (
        <div
          ref={rightPanelRef}
          className="absolute top-0 right-0 bottom-0 bg-background border-l border-border flex flex-col"
          style={{ width: layoutState.panels.right.width }}
        >
          {/* Right Panel Resizer */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 bg-border hover:bg-primary cursor-col-resize transition-colors"
            onMouseDown={(e) => handleDragStart(e, 'right-panel')}
          />
          
          {/* Right Panel Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
            <div className="flex items-center space-x-4">
              {renderTabBar(layoutState.rightTabs, 'right')}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => togglePanelCollapse('right')}
                className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                title={layoutState.panels.right.isCollapsed ? 'Expand' : 'Collapse'}
              >
                {layoutState.panels.right.isCollapsed ? (
                  <ArrowLeft className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => togglePanel('right')}
                className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                title="Close Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Right Panel Content */}
          {!layoutState.panels.right.isCollapsed && (
            <div className="flex-1">
              {renderTabContent(layoutState.rightTabs, layoutState.activeRightTab)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Main;

// Main utilities and hooks
export const useMainActions = () => {
  const handleAction = (action: string, data?: any) => {
    window.dispatchEvent(new CustomEvent(`nexus:main-${action}`, { detail: data }));
  };

  return {
    openFile: (filePath: string, content?: string) => handleAction('open-file', { filePath, content }),
    closeTab: (tabId: string, tabType: 'editor' | 'bottom' | 'right') => handleAction('close-tab', { tabId, tabType }),
    activateTab: (tabId: string, tabType: 'editor' | 'bottom' | 'right') => handleAction('activate-tab', { tabId, tabType }),
    togglePanel: (panel: 'bottom' | 'right') => handleAction('toggle-panel', { panel }),
    togglePanelCollapse: (panel: 'bottom' | 'right') => handleAction('toggle-panel-collapse', { panel }),
    splitView: (orientation: 'horizontal' | 'vertical') => handleAction('split-view', { orientation }),
    newTab: (type: 'editor' | 'terminal' | 'output') => handleAction('new-tab', { type }),
  };
};

// Main configuration
export const mainConfig = {
  defaultLayout: {
    panels: {
      bottom: {
        isVisible: true,
        height: 300,
        isCollapsed: false,
      },
      right: {
        isVisible: false,
        width: 300,
        isCollapsed: false,
      },
    },
    splitView: {
      enabled: false,
      orientation: 'vertical' as const,
      sizes: [50, 50],
    },
  },
  tabTypes: {
    editor: { icon: Code, canClose: true },
    terminal: { icon: TerminalIcon, canClose: false },
    output: { icon: FileText, canClose: false },
    problems: { icon: Bug, canClose: false },
    debug: { icon: Bug, canClose: false },
    preview: { icon: Eye, canClose: true },
  },
  panelSizes: {
    bottom: { min: 100, max: 600, default: 300 },
    right: { min: 200, max: 600, default: 300 },
  },
};

// Export main component with display name
Main.displayName = 'Main';

export { Main };