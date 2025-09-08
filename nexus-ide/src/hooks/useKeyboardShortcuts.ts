/**
 * useKeyboardShortcuts Hook
 * 
 * A React hook for managing keyboard shortcuts throughout the NEXUS IDE.
 * Provides a centralized way to register, handle, and manage keyboard shortcuts
 * with support for different contexts and priority levels.
 * 
 * Features:
 * - Global and context-specific shortcuts
 * - Priority-based shortcut handling
 * - Conflict detection and resolution
 * - Dynamic shortcut registration/unregistration
 * - Integration with the KeyboardShortcutsProvider
 */

import { useEffect, useCallback, useContext } from 'react';
import { toast } from 'sonner';

// Types
export interface KeyboardShortcut {
  id: string;
  keys: string; // e.g., 'ctrl+s', 'cmd+shift+p'
  description: string;
  action: () => void;
  context?: string; // Optional context (e.g., 'editor', 'terminal')
  priority?: number; // Higher number = higher priority
  enabled?: boolean;
}

export interface ShortcutContext {
  shortcuts: Map<string, KeyboardShortcut>;
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  getShortcut: (keys: string) => KeyboardShortcut | undefined;
  executeShortcut: (keys: string) => boolean;
  listShortcuts: (context?: string) => KeyboardShortcut[];
}

// Default shortcuts for NEXUS IDE
const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: 'save-file',
    keys: 'ctrl+s',
    description: 'Save current file',
    action: () => {
      // This will be overridden by actual save functionality
      toast.success('File saved');
    },
    context: 'editor',
    priority: 100
  },
  {
    id: 'open-command-palette',
    keys: 'ctrl+shift+p',
    description: 'Open command palette',
    action: () => {
      toast.info('Command palette opened');
    },
    priority: 100
  },
  {
    id: 'toggle-sidebar',
    keys: 'ctrl+b',
    description: 'Toggle sidebar visibility',
    action: () => {
      toast.info('Sidebar toggled');
    },
    priority: 90
  },
  {
    id: 'toggle-terminal',
    keys: 'ctrl+`',
    description: 'Toggle terminal panel',
    action: () => {
      toast.info('Terminal toggled');
    },
    context: 'global',
    priority: 90
  },
  {
    id: 'new-file',
    keys: 'ctrl+n',
    description: 'Create new file',
    action: () => {
      toast.info('New file created');
    },
    context: 'editor',
    priority: 80
  },
  {
    id: 'open-file',
    keys: 'ctrl+o',
    description: 'Open file',
    action: () => {
      toast.info('File dialog opened');
    },
    context: 'editor',
    priority: 80
  },
  {
    id: 'find-in-file',
    keys: 'ctrl+f',
    description: 'Find in current file',
    action: () => {
      toast.info('Find dialog opened');
    },
    context: 'editor',
    priority: 80
  },
  {
    id: 'find-in-files',
    keys: 'ctrl+shift+f',
    description: 'Find in all files',
    action: () => {
      toast.info('Global search opened');
    },
    priority: 80
  }
];

// Utility functions
const normalizeKeys = (keys: string): string => {
  return keys.toLowerCase().replace(/\s+/g, '');
};

const parseKeyEvent = (event: KeyboardEvent): string => {
  const parts: string[] = [];
  
  if (event.ctrlKey || event.metaKey) parts.push('ctrl');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  
  // Handle special keys
  let key = event.key.toLowerCase();
  if (key === ' ') key = 'space';
  if (key === 'escape') key = 'esc';
  if (key === 'arrowup') key = 'up';
  if (key === 'arrowdown') key = 'down';
  if (key === 'arrowleft') key = 'left';
  if (key === 'arrowright') key = 'right';
  
  parts.push(key);
  
  return parts.join('+');
};

// Main hook
export const useKeyboardShortcuts = (context?: string) => {
  const shortcuts = new Map<string, KeyboardShortcut>();

  // Initialize with default shortcuts
  useEffect(() => {
    DEFAULT_SHORTCUTS.forEach(shortcut => {
      const normalizedKeys = normalizeKeys(shortcut.keys);
      shortcuts.set(normalizedKeys, { ...shortcut, enabled: true });
    });
  }, []);

  // Register a new shortcut
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    const normalizedKeys = normalizeKeys(shortcut.keys);
    
    // Check for conflicts
    const existing = shortcuts.get(normalizedKeys);
    if (existing && existing.priority >= (shortcut.priority || 0)) {
      console.warn(`Shortcut conflict: ${shortcut.keys} already registered with higher priority`);
      return false;
    }
    
    shortcuts.set(normalizedKeys, { ...shortcut, enabled: true });
    return true;
  }, [shortcuts]);

  // Unregister a shortcut
  const unregisterShortcut = useCallback((id: string) => {
    for (const [keys, shortcut] of shortcuts.entries()) {
      if (shortcut.id === id) {
        shortcuts.delete(keys);
        return true;
      }
    }
    return false;
  }, [shortcuts]);

  // Get shortcut by keys
  const getShortcut = useCallback((keys: string): KeyboardShortcut | undefined => {
    const normalizedKeys = normalizeKeys(keys);
    return shortcuts.get(normalizedKeys);
  }, [shortcuts]);

  // Execute shortcut
  const executeShortcut = useCallback((keys: string): boolean => {
    const shortcut = getShortcut(keys);
    if (shortcut && shortcut.enabled) {
      // Check context match
      if (context && shortcut.context && shortcut.context !== context && shortcut.context !== 'global') {
        return false;
      }
      
      try {
        shortcut.action();
        return true;
      } catch (error) {
        console.error(`Error executing shortcut ${keys}:`, error);
        toast.error(`Failed to execute shortcut: ${shortcut.description}`);
        return false;
      }
    }
    return false;
  }, [getShortcut, context]);

  // List shortcuts
  const listShortcuts = useCallback((filterContext?: string): KeyboardShortcut[] => {
    const result: KeyboardShortcut[] = [];
    
    for (const shortcut of shortcuts.values()) {
      if (!filterContext || !shortcut.context || shortcut.context === filterContext || shortcut.context === 'global') {
        result.push(shortcut);
      }
    }
    
    return result.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }, [shortcuts]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const keys = parseKeyEvent(event);
    
    if (executeShortcut(keys)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, [executeShortcut]);

  // Set up global event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    registerShortcut,
    unregisterShortcut,
    getShortcut,
    executeShortcut,
    listShortcuts,
    shortcuts: Array.from(shortcuts.values())
  };
};

// Hook for getting shortcut display string
export const useShortcutDisplay = () => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  const formatShortcut = useCallback((keys: string): string => {
    return keys
      .split('+')
      .map(key => {
        switch (key.toLowerCase()) {
          case 'ctrl':
            return isMac ? 'Cmd' : 'Ctrl';
  case 'alt':
    return isMac ? 'Opt' : 'Alt';
  case 'shift':
    return isMac ? 'Shift' : 'Shift';
          case 'space':
            return 'Space';
          case 'esc':
            return 'Esc';
          default:
            return key.charAt(0).toUpperCase() + key.slice(1);
        }
      })
      .join(isMac ? '' : '+');
  }, [isMac]);
  
  return { formatShortcut, isMac };
};

export default useKeyboardShortcuts;