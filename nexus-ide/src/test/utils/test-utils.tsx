/**
 * Custom Testing Utilities for NEXUS IDE
 * 
 * This file provides custom render functions and utilities
 * that wrap components with necessary providers and context.
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Import providers (these will be created later)
// import { ThemeProvider } from '../providers/ThemeProvider';
// import { MCPProvider } from '../providers/MCPProvider';
// import { KeyboardShortcutsProvider } from '../providers/KeyboardShortcutsProvider';
// import { CollaborationProvider } from '../providers/CollaborationProvider';

// Mock providers for testing
const MockThemeProvider = ({ children }: { children: ReactNode }) => {
  const mockThemeContext = {
    theme: 'dark' as const,
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
    systemTheme: 'dark' as const,
    resolvedTheme: 'dark' as const,
  };
  
  return (
    <div data-theme="dark" data-testid="theme-provider">
      {children}
    </div>
  );
};

const MockMCPProvider = ({ children }: { children: ReactNode }) => {
  const mockMCPContext = {
    isConnected: true,
    connectionStatus: 'connected' as const,
    servers: [],
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendMessage: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  };
  
  return (
    <div data-testid="mcp-provider">
      {children}
    </div>
  );
};

const MockKeyboardShortcutsProvider = ({ children }: { children: ReactNode }) => {
  const mockKeyboardContext = {
    shortcuts: new Map(),
    registerShortcut: vi.fn(),
    unregisterShortcut: vi.fn(),
    isShortcutPressed: vi.fn(),
    getShortcut: vi.fn(),
  };
  
  return (
    <div data-testid="keyboard-shortcuts-provider">
      {children}
    </div>
  );
};

const MockCollaborationProvider = ({ children }: { children: ReactNode }) => {
  const mockCollaborationContext = {
    isConnected: false,
    users: [],
    currentUser: null,
    cursors: new Map(),
    selections: new Map(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendCursor: vi.fn(),
    sendSelection: vi.fn(),
    sendMessage: vi.fn(),
  };
  
  return (
    <div data-testid="collaboration-provider">
      {children}
    </div>
  );
};

// Custom render options
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Router options
  initialEntries?: string[];
  
  // Query client options
  queryClient?: QueryClient;
  
  // Provider options
  withTheme?: boolean;
  withMCP?: boolean;
  withKeyboardShortcuts?: boolean;
  withCollaboration?: boolean;
  withRouter?: boolean;
  
  // Theme options
  initialTheme?: 'light' | 'dark' | 'auto';
  
  // User options
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'developer' | 'viewer';
  };
  
  // Project options
  project?: {
    id: string;
    name: string;
    type: 'web' | 'mobile' | 'desktop' | 'library';
  };
}

// Create a custom render function
function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const {
    initialEntries = ['/'],
    queryClient,
    withTheme = true,
    withMCP = false,
    withKeyboardShortcuts = false,
    withCollaboration = false,
    withRouter = true,
    initialTheme = 'dark',
    user,
    project,
    ...renderOptions
  } = options;

  // Create a fresh QueryClient for each test if not provided
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  });

  // Build the wrapper component
  const Wrapper = ({ children }: { children: ReactNode }) => {
    let wrappedChildren = children;

    // Wrap with QueryClient
    wrappedChildren = (
      <QueryClientProvider client={testQueryClient}>
        {wrappedChildren}
      </QueryClientProvider>
    );

    // Wrap with Router if needed
    if (withRouter) {
      wrappedChildren = (
        <BrowserRouter>
          {wrappedChildren}
        </BrowserRouter>
      );
    }

    // Wrap with Theme Provider if needed
    if (withTheme) {
      wrappedChildren = (
        <MockThemeProvider>
          {wrappedChildren}
        </MockThemeProvider>
      );
    }

    // Wrap with MCP Provider if needed
    if (withMCP) {
      wrappedChildren = (
        <MockMCPProvider>
          {wrappedChildren}
        </MockMCPProvider>
      );
    }

    // Wrap with Keyboard Shortcuts Provider if needed
    if (withKeyboardShortcuts) {
      wrappedChildren = (
        <MockKeyboardShortcutsProvider>
          {wrappedChildren}
        </MockKeyboardShortcutsProvider>
      );
    }

    // Wrap with Collaboration Provider if needed
    if (withCollaboration) {
      wrappedChildren = (
        <MockCollaborationProvider>
          {wrappedChildren}
        </MockCollaborationProvider>
      );
    }

    return <>{wrappedChildren}</>;
  };

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...result,
    // Add custom utilities
    queryClient: testQueryClient,
  };
}

// Render with all providers
function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  return customRender(ui, {
    withTheme: true,
    withMCP: true,
    withKeyboardShortcuts: true,
    withCollaboration: true,
    withRouter: true,
    ...options,
  });
}

// Render with minimal providers (just QueryClient and Router)
function renderWithMinimalProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  return customRender(ui, {
    withTheme: false,
    withMCP: false,
    withKeyboardShortcuts: false,
    withCollaboration: false,
    withRouter: true,
    ...options,
  });
}

// Render without any providers (for unit testing pure components)
function renderWithoutProviders(
  ui: ReactElement,
  options: Omit<CustomRenderOptions, 'withTheme' | 'withMCP' | 'withKeyboardShortcuts' | 'withCollaboration' | 'withRouter'> = {}
): RenderResult {
  return render(ui, options);
}

// Mock implementations for common hooks
export const mockUseTheme = () => ({
  theme: 'dark' as const,
  setTheme: vi.fn(),
  toggleTheme: vi.fn(),
  systemTheme: 'dark' as const,
  resolvedTheme: 'dark' as const,
});

export const mockUseMCP = () => ({
  isConnected: true,
  connectionStatus: 'connected' as const,
  servers: [],
  connect: vi.fn(),
  disconnect: vi.fn(),
  sendMessage: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
});

export const mockUseKeyboardShortcuts = () => ({
  shortcuts: new Map(),
  registerShortcut: vi.fn(),
  unregisterShortcut: vi.fn(),
  isShortcutPressed: vi.fn(),
  getShortcut: vi.fn(),
});

export const mockUseCollaboration = () => ({
  isConnected: false,
  users: [],
  currentUser: null,
  cursors: new Map(),
  selections: new Map(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  sendCursor: vi.fn(),
  sendSelection: vi.fn(),
  sendMessage: vi.fn(),
});

// Utility functions for testing
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
};

export const createMockFile = (name: string, content: string = '') => ({
  name,
  content,
  path: `/${name}`,
  size: content.length,
  lastModified: new Date().toISOString(),
  type: 'file' as const,
});

export const createMockProject = (name: string = 'Test Project') => ({
  id: `proj-${Date.now()}`,
  name,
  description: `Description for ${name}`,
  type: 'web' as const,
  language: 'TypeScript',
  framework: 'React',
  repository: {
    url: `https://github.com/test/${name.toLowerCase().replace(/\s+/g, '-')}`,
    branch: 'main',
    lastCommit: {
      hash: 'abc123',
      message: 'Initial commit',
      author: 'Test User',
      timestamp: new Date().toISOString(),
    },
  },
  collaborators: ['user-1'],
  settings: {
    autoSave: true,
    linting: true,
    formatting: true,
    testing: false,
  },
});

export const createMockUser = (name: string = 'Test User') => ({
  id: `user-${Date.now()}`,
  name,
  email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
  avatar: `https://avatar.example.com/${name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
  role: 'developer' as const,
  preferences: {
    theme: 'dark' as const,
    language: 'en',
    fontSize: 14,
    keyBindings: 'vscode' as const,
  },
});

// Mock localStorage and sessionStorage
export const mockStorage = () => {
  const storage: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
    length: 0,
    key: vi.fn(),
  };
};

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
  });
  
  Object.defineProperty(global, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
  });
  
  return mockIntersectionObserver;
};

// Mock ResizeObserver
export const mockResizeObserver = () => {
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: mockResizeObserver,
  });
  
  Object.defineProperty(global, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: mockResizeObserver,
  });
  
  return mockResizeObserver;
};

// Mock matchMedia
export const mockMatchMedia = (matches: boolean = false) => {
  const mockMatchMedia = vi.fn().mockImplementation(query => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
  });
  
  return mockMatchMedia;
};

// Mock fetch
export const mockFetch = (response: any = {}, status: number = 200) => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: vi.fn().mockResolvedValue(response),
    text: vi.fn().mockResolvedValue(JSON.stringify(response)),
    blob: vi.fn().mockResolvedValue(new Blob([JSON.stringify(response)])),
    headers: new Headers(),
  });
  
  global.fetch = mockFetch;
  return mockFetch;
};

// Export everything
export {
  customRender,
  renderWithProviders,
  renderWithMinimalProviders,
  renderWithoutProviders,
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export * from '@testing-library/user-event';

// Override the default render with our custom render
export { customRender as render };