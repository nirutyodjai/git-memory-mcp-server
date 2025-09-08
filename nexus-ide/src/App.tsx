import React, { Suspense, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTheme } from './hooks/useTheme';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useMCP } from './hooks/useMCP';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { ErrorFallback } from './components/ui/ErrorFallback';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import CommandPalette from './components/features/CommandPalette';
import NotificationCenter from './components/features/NotificationCenter';
import AIAssistant from './components/features/AIAssistant';
import { AIProvider } from './contexts/AIContext';

// Lazy load heavy components for better performance
const Editor = lazy(() => import('./components/features/Editor'));
const Terminal = lazy(() => import('./components/features/Terminal'));
const FileExplorer = lazy(() => import('./components/features/FileExplorer'));
const DebugPanel = lazy(() => import('./components/features/DebugPanel'));
const CollaborationHub = lazy(() => import('./components/features/CollaborationHub'));

// Loading fallback component
const ComponentLoader: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex items-center justify-center h-full bg-card">
    <div className="flex flex-col items-center space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-muted-foreground">Loading {name}...</p>
    </div>
  </div>
);

// Main App Component
const App: React.FC = () => {
  const { theme } = useTheme();
  const { isConnected, connectionStatus } = useMCP();
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    'cmd+shift+p': () => {
      // Open command palette
      const event = new CustomEvent('nexus:open-command-palette');
      window.dispatchEvent(event);
    },
    'cmd+`': () => {
      // Toggle terminal
      const event = new CustomEvent('nexus:toggle-terminal');
      window.dispatchEvent(event);
    },
    'cmd+b': () => {
      // Toggle sidebar
      const event = new CustomEvent('nexus:toggle-sidebar');
      window.dispatchEvent(event);
    },
    'cmd+shift+d': () => {
      // Open debug panel
      const event = new CustomEvent('nexus:open-debug');
      window.dispatchEvent(event);
    },
    'cmd+shift+x': () => {
      // Open extensions
      const event = new CustomEvent('nexus:open-extensions');
      window.dispatchEvent(event);
    },
  });

  return (
    <AIProvider>
      <div className={`app ${theme} h-screen overflow-hidden bg-background text-foreground`}>
        {/* Global Error Boundary */}
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onError={(error, errorInfo) => {
            console.error('NEXUS IDE Error:', error, errorInfo);
            // Send to error monitoring service
          }}
        >
        {/* Main IDE Layout */}
        <div className="grid-ide">
          {/* Header */}
          <div className="grid-area-header">
            <Header />
          </div>

          {/* Sidebar */}
          <div className="grid-area-sidebar">
            <Sidebar />
          </div>

          {/* Main Editor Area */}
          <div className="grid-area-editor relative">
            <Suspense fallback={<ComponentLoader name="Editor" />}>
              <Editor />
            </Suspense>
            
            {/* AI Assistant Overlay */}
            <div className="absolute top-4 right-4 z-50">
              <AIAssistant />
            </div>
          </div>

          {/* Terminal/Bottom Panel */}
          <div className="grid-area-terminal">
            <div className="h-full flex flex-col">
              {/* Panel Tabs */}
              <div className="flex items-center border-b border-border bg-card px-4 py-2">
                <div className="flex space-x-1">
                  <button className="nexus-tab-active">
                    Terminal
                  </button>
                  <button className="nexus-tab-inactive">
                    Debug Console
                  </button>
                  <button className="nexus-tab-inactive">
                    Problems
                  </button>
                  <button className="nexus-tab-inactive">
                    Output
                  </button>
                </div>
                
                {/* Panel Controls */}
                <div className="ml-auto flex items-center space-x-2">
                  <button className="nexus-button-ghost p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button className="nexus-button-ghost p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Panel Content */}
              <div className="flex-1 overflow-hidden">
                <Suspense fallback={<ComponentLoader name="Terminal" />}>
                  <Terminal />
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <StatusBar connectionStatus={connectionStatus} />

        {/* Global Components */}
        <CommandPalette />
        <NotificationCenter />
        
        {/* Collaboration Hub (when enabled) */}
        <Suspense fallback={null}>
          <CollaborationHub />
        </Suspense>

        {/* Connection Status Indicator */}
        {!isConnected && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="nexus-status-warning px-4 py-2 rounded-md border">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">
                  Connecting to MCP Server...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Development Tools (only in development) */}
        {import.meta.env.DEV && (
          <div className="fixed bottom-4 left-4 z-50">
            <div className="bg-card border border-border rounded-lg p-2 text-xs space-y-1">
              <div>Theme: {theme}</div>
              <div>MCP: {isConnected ? 'Connected' : 'Disconnected'}</div>
              <div>Status: {connectionStatus}</div>
            </div>
          </div>
        )}
        </ErrorBoundary>
      </div>
    </AIProvider>
  );
};

export default App;

// Performance monitoring
if (import.meta.env.DEV) {
  // Mark app render complete
  setTimeout(() => {
    performance.mark('nexus-ide-render-complete');
    performance.measure(
      'nexus-ide-init-to-render',
      'nexus-ide-init-complete',
      'nexus-ide-render-complete'
    );
  }, 0);
}