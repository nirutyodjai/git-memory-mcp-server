/**
 * Main Layout Component for NEXUS IDE
 * 
 * The primary layout structure that contains all major UI components:
 * - Header/Menu Bar
 * - Sidebar (File Explorer, Extensions, etc.)
 * - Main Editor Area
 * - Panel Area (Terminal, Debug, etc.)
 * - Status Bar
 */

import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';

// Layout context for managing layout state
interface LayoutContextType {
  sidebarVisible: boolean;
  sidebarWidth: number;
  panelVisible: boolean;
  panelHeight: number;
  panelPosition: 'bottom' | 'right';
  toggleSidebar: () => void;
  togglePanel: () => void;
  setSidebarWidth: (width: number) => void;
  setPanelHeight: (height: number) => void;
  setPanelPosition: (position: 'bottom' | 'right') => void;
}

const LayoutContext = React.createContext<LayoutContextType | null>(null);

export const useLayout = () => {
  const context = React.useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

// Layout component props
export interface LayoutProps {
  children?: React.ReactNode;
  className?: string;
  // Header component
  header?: React.ReactNode;
  // Sidebar component
  sidebar?: React.ReactNode;
  // Main content (usually editor)
  main?: React.ReactNode;
  // Panel component (terminal, debug, etc.)
  panel?: React.ReactNode;
  // Status bar component
  statusBar?: React.ReactNode;
  // Initial layout state
  initialSidebarVisible?: boolean;
  initialSidebarWidth?: number;
  initialPanelVisible?: boolean;
  initialPanelHeight?: number;
  initialPanelPosition?: 'bottom' | 'right';
}

// Resizer component for draggable dividers
interface ResizerProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  className?: string;
}

const Resizer: React.FC<ResizerProps> = ({ direction, onResize, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPos(direction === 'horizontal' ? e.clientX : e.clientY);
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [direction]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPos;
      onResize(delta);
      setStartPos(currentPos);
    },
    [isDragging, startPos, direction, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={cn(
        'group relative flex-shrink-0 bg-gray-200 dark:bg-gray-700 transition-colors hover:bg-gray-300 dark:hover:bg-gray-600',
        direction === 'horizontal' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize',
        isDragging && 'bg-blue-500 dark:bg-blue-400',
        className
      )}
      onMouseDown={handleMouseDown}
    >
      {/* Visual indicator */}
      <div
        className={cn(
          'absolute bg-blue-500 dark:bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity',
          direction === 'horizontal'
            ? 'inset-y-0 left-0 w-1'
            : 'inset-x-0 top-0 h-1',
          isDragging && 'opacity-100'
        )}
      />
    </div>
  );
};

// Main Layout component
export const Layout: React.FC<LayoutProps> = ({
  children,
  className,
  header,
  sidebar,
  main,
  panel,
  statusBar,
  initialSidebarVisible = true,
  initialSidebarWidth = 280,
  initialPanelVisible = false,
  initialPanelHeight = 300,
  initialPanelPosition = 'bottom',
}) => {
  // Layout state
  const [sidebarVisible, setSidebarVisible] = useState(initialSidebarVisible);
  const [sidebarWidth, setSidebarWidth] = useState(initialSidebarWidth);
  const [panelVisible, setPanelVisible] = useState(initialPanelVisible);
  const [panelHeight, setPanelHeight] = useState(initialPanelHeight);
  const [panelPosition, setPanelPosition] = useState(initialPanelPosition);

  // Layout actions
  const toggleSidebar = useCallback(() => {
    setSidebarVisible(prev => !prev);
  }, []);

  const togglePanel = useCallback(() => {
    setPanelVisible(prev => !prev);
  }, []);

  const handleSidebarResize = useCallback((delta: number) => {
    setSidebarWidth(prev => Math.max(200, Math.min(600, prev + delta)));
  }, []);

  const handlePanelResize = useCallback((delta: number) => {
    if (panelPosition === 'bottom') {
      setPanelHeight(prev => Math.max(100, Math.min(800, prev - delta)));
    } else {
      // For right panel, we'd handle width instead
      // This is a simplified implementation
      setPanelHeight(prev => Math.max(200, Math.min(600, prev + delta)));
    }
  }, [panelPosition]);

  // Context value
  const contextValue: LayoutContextType = {
    sidebarVisible,
    sidebarWidth,
    panelVisible,
    panelHeight,
    panelPosition,
    toggleSidebar,
    togglePanel,
    setSidebarWidth,
    setPanelHeight,
    setPanelPosition,
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B: Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      // Ctrl/Cmd + J: Toggle panel
      if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
        e.preventDefault();
        togglePanel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, togglePanel]);

  return (
    <LayoutContext.Provider value={contextValue}>
      <div
        className={cn(
          'flex h-screen w-screen flex-col overflow-hidden bg-white dark:bg-gray-900',
          className
        )}
      >
        {/* Header */}
        {header && (
          <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
            {header}
          </header>
        )}

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {sidebarVisible && sidebar && (
            <>
              <aside
                className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                style={{ width: sidebarWidth }}
              >
                {sidebar}
              </aside>
              <Resizer direction="horizontal" onResize={handleSidebarResize} />
            </>
          )}

          {/* Main editor area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Editor content */}
            <main className="flex-1 overflow-hidden">
              {main || children}
            </main>

            {/* Bottom panel */}
            {panelVisible && panel && panelPosition === 'bottom' && (
              <>
                <Resizer direction="vertical" onResize={handlePanelResize} />
                <div
                  className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  style={{ height: panelHeight }}
                >
                  {panel}
                </div>
              </>
            )}
          </div>

          {/* Right panel */}
          {panelVisible && panel && panelPosition === 'right' && (
            <>
              <Resizer direction="horizontal" onResize={handlePanelResize} />
              <aside
                className="flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                style={{ width: panelHeight }} // Using panelHeight as width for simplicity
              >
                {panel}
              </aside>
            </>
          )}
        </div>

        {/* Status bar */}
        {statusBar && (
          <footer className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
            {statusBar}
          </footer>
        )}
      </div>
    </LayoutContext.Provider>
  );
};

Layout.displayName = 'Layout';

// Layout components for easier composition
export const LayoutHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      'flex h-12 items-center justify-between px-4 bg-white dark:bg-gray-900',
      className
    )}
  >
    {children}
  </div>
);

export const LayoutSidebar: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn('flex h-full flex-col overflow-hidden', className)}>
    {children}
  </div>
);

export const LayoutMain: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn('flex h-full flex-col overflow-hidden', className)}>
    {children}
  </div>
);

export const LayoutPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn('flex h-full flex-col overflow-hidden', className)}>
    {children}
  </div>
);

export const LayoutStatusBar: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      'flex h-6 items-center justify-between px-4 text-xs bg-blue-600 text-white dark:bg-blue-700',
      className
    )}
  >
    {children}
  </div>
);

// Layout utilities
export const useLayoutShortcuts = () => {
  const { toggleSidebar, togglePanel } = useLayout();
  
  return {
    toggleSidebar,
    togglePanel,
  };
};

// Layout presets
export const createLayoutPreset = (preset: 'default' | 'minimal' | 'focus') => {
  switch (preset) {
    case 'minimal':
      return {
        initialSidebarVisible: false,
        initialPanelVisible: false,
      };
    case 'focus':
      return {
        initialSidebarVisible: false,
        initialPanelVisible: false,
        initialSidebarWidth: 240,
      };
    default:
      return {
        initialSidebarVisible: true,
        initialPanelVisible: false,
        initialSidebarWidth: 280,
        initialPanelHeight: 300,
      };
  }
};

// Export layout context
export { LayoutContext };