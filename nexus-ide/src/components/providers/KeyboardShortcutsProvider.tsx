import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

// Keyboard shortcut types
interface KeyboardShortcut {
  id: string;
  key: string;
  description: string;
  category: string;
  handler: () => void;
  enabled: boolean;
  global?: boolean;
  preventDefault?: boolean;
}

interface ShortcutCategory {
  id: string;
  name: string;
  description: string;
  shortcuts: KeyboardShortcut[];
}

interface KeyboardShortcutsState {
  shortcuts: KeyboardShortcut[];
  categories: ShortcutCategory[];
  isRecording: boolean;
  recordingFor: string | null;
  // Actions
  registerShortcut: (shortcut: Omit<KeyboardShortcut, 'id'>) => string;
  unregisterShortcut: (id: string) => void;
  updateShortcut: (id: string, updates: Partial<KeyboardShortcut>) => void;
  enableShortcut: (id: string) => void;
  disableShortcut: (id: string) => void;
  startRecording: (shortcutId: string) => void;
  stopRecording: () => void;
  getShortcutsByCategory: (category: string) => KeyboardShortcut[];
  executeShortcut: (key: string) => boolean;
  resetToDefaults: () => void;
}

const initialState: KeyboardShortcutsState = {
  shortcuts: [],
  categories: [],
  isRecording: false,
  recordingFor: null,
  registerShortcut: () => '',
  unregisterShortcut: () => {},
  updateShortcut: () => {},
  enableShortcut: () => {},
  disableShortcut: () => {},
  startRecording: () => {},
  stopRecording: () => {},
  getShortcutsByCategory: () => [],
  executeShortcut: () => false,
  resetToDefaults: () => {},
};

const KeyboardShortcutsContext = createContext<KeyboardShortcutsState>(initialState);

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  storageKey?: string;
}

// Default shortcuts configuration
const defaultShortcuts: Omit<KeyboardShortcut, 'id'>[] = [
  // File operations
  {
    key: 'Ctrl+N',
    description: 'New File',
    category: 'file',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:new-file')),
    enabled: true,
    global: true,
  },
  {
    key: 'Ctrl+O',
    description: 'Open File',
    category: 'file',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:open-file')),
    enabled: true,
    global: true,
  },
  {
    key: 'Ctrl+S',
    description: 'Save File',
    category: 'file',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:save-file')),
    enabled: true,
    global: true,
  },
  {
    key: 'Ctrl+Shift+S',
    description: 'Save All Files',
    category: 'file',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:save-all')),
    enabled: true,
    global: true,
  },
  {
    key: 'Ctrl+W',
    description: 'Close File',
    category: 'file',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:close-file')),
    enabled: true,
    global: true,
  },
  
  // Edit operations
  {
    key: 'Ctrl+Z',
    description: 'Undo',
    category: 'edit',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:undo')),
    enabled: true,
    global: true,
  },
  {
    key: 'Ctrl+Y',
    description: 'Redo',
    category: 'edit',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:redo')),
    enabled: true,
    global: true,
  },
  {
    key: 'Ctrl+F',
    description: 'Find',
    category: 'edit',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:find')),
    enabled: true,
    global: true,
  },
  {
    key: 'Ctrl+H',
    description: 'Find and Replace',
    category: 'edit',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:find-replace')),
    enabled: true,
    global: true,
  },
  {
    key: 'Ctrl+Shift+F',
    description: 'Find in Files',
    category: 'edit',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:find-in-files')),
    enabled: true,
    global: true,
  },
  
  // View operations
  {
    key: 'Ctrl+Shift+E',
    description: 'Toggle Explorer',
    category: 'view',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:toggle-explorer')),
    enabled: true,
    global: true,
  },
  {
    key: 'Ctrl+Shift+D',
    description: 'Toggle Debug Panel',
    category: 'view',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:toggle-debug')),
    enabled: true,
    global: true,
  },
  {
    key: 'Ctrl+`',
    description: 'Toggle Terminal',
    category: 'view',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:toggle-terminal')),
    enabled: true,
    global: true,
  },
  {
    key: 'Ctrl+Shift+P',
    description: 'Command Palette',
    category: 'view',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:command-palette')),
    enabled: true,
    global: true,
  },
  {
    key: 'Ctrl+P',
    description: 'Quick Open',
    category: 'view',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:quick-open')),
    enabled: true,
    global: true,
  },
  
  // Navigation
  {
    key: 'Ctrl+G',
    description: 'Go to Line',
    category: 'navigation',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:go-to-line')),
    enabled: true,
    global: true,
  },
  {
    key: 'F12',
    description: 'Go to Definition',
    category: 'navigation',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:go-to-definition')),
    enabled: true,
    global: true,
  },
  {
    key: 'Alt+F12',
    description: 'Peek Definition',
    category: 'navigation',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:peek-definition')),
    enabled: true,
    global: true,
  },
  {
    key: 'Shift+F12',
    description: 'Find All References',
    category: 'navigation',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:find-references')),
    enabled: true,
    global: true,
  },
  
  // Debug
  {
    key: 'F5',
    description: 'Start Debugging',
    category: 'debug',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:start-debug')),
    enabled: true,
    global: true,
  },
  {
    key: 'Shift+F5',
    description: 'Stop Debugging',
    category: 'debug',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:stop-debug')),
    enabled: true,
    global: true,
  },
  {
    key: 'F9',
    description: 'Toggle Breakpoint',
    category: 'debug',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:toggle-breakpoint')),
    enabled: true,
    global: true,
  },
  {
    key: 'F10',
    description: 'Step Over',
    category: 'debug',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:step-over')),
    enabled: true,
    global: true,
  },
  {
    key: 'F11',
    description: 'Step Into',
    category: 'debug',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:step-into')),
    enabled: true,
    global: true,
  },
  
  // AI Assistant
  {
    key: 'Ctrl+Shift+A',
    description: 'Open AI Assistant',
    category: 'ai',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:ai-assistant')),
    enabled: true,
    global: true,
  },
  {
    key: 'Ctrl+Shift+C',
    description: 'AI Code Completion',
    category: 'ai',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:ai-completion')),
    enabled: true,
    global: true,
  },
  {
    key: 'Ctrl+Shift+R',
    description: 'AI Code Review',
    category: 'ai',
    handler: () => window.dispatchEvent(new CustomEvent('nexus:ai-review')),
    enabled: true,
    global: true,
  },
];

const defaultCategories: Omit<ShortcutCategory, 'shortcuts'>[] = [
  { id: 'file', name: 'File Operations', description: 'File management shortcuts' },
  { id: 'edit', name: 'Edit Operations', description: 'Text editing shortcuts' },
  { id: 'view', name: 'View Operations', description: 'UI and panel shortcuts' },
  { id: 'navigation', name: 'Navigation', description: 'Code navigation shortcuts' },
  { id: 'debug', name: 'Debug Operations', description: 'Debugging shortcuts' },
  { id: 'ai', name: 'AI Assistant', description: 'AI-powered features' },
];

export function KeyboardShortcutsProvider({ 
  children, 
  storageKey = 'nexus-ide-shortcuts' 
}: KeyboardShortcutsProviderProps) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [categories, setCategories] = useState<ShortcutCategory[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingFor, setRecordingFor] = useState<string | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Generate unique ID
  const generateId = useCallback(() => {
    return `shortcut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Parse key combination
  const parseKeyCombo = useCallback((key: string) => {
    const parts = key.toLowerCase().split('+');
    return {
      ctrl: parts.includes('ctrl'),
      shift: parts.includes('shift'),
      alt: parts.includes('alt'),
      meta: parts.includes('meta') || parts.includes('cmd'),
      key: parts[parts.length - 1],
    };
  }, []);

  // Format key combination
  const formatKeyCombo = useCallback((keys: Set<string>) => {
    const keyArray = Array.from(keys).sort();
    const modifiers = [];
    const regularKeys = [];
    
    keyArray.forEach(key => {
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
        modifiers.push(key === 'Control' ? 'Ctrl' : key);
      } else {
        regularKeys.push(key);
      }
    });
    
    return [...modifiers, ...regularKeys].join('+');
  }, []);

  // Register shortcut
  const registerShortcut = useCallback((shortcut: Omit<KeyboardShortcut, 'id'>) => {
    const id = generateId();
    const newShortcut: KeyboardShortcut = { ...shortcut, id };
    
    setShortcuts(prev => {
      // Remove existing shortcut with same key
      const filtered = prev.filter(s => s.key !== shortcut.key);
      return [...filtered, newShortcut];
    });
    
    return id;
  }, [generateId]);

  // Unregister shortcut
  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
  }, []);

  // Update shortcut
  const updateShortcut = useCallback((id: string, updates: Partial<KeyboardShortcut>) => {
    setShortcuts(prev => 
      prev.map(s => s.id === id ? { ...s, ...updates } : s)
    );
  }, []);

  // Enable/disable shortcuts
  const enableShortcut = useCallback((id: string) => {
    updateShortcut(id, { enabled: true });
  }, [updateShortcut]);

  const disableShortcut = useCallback((id: string) => {
    updateShortcut(id, { enabled: false });
  }, [updateShortcut]);

  // Recording functionality
  const startRecording = useCallback((shortcutId: string) => {
    setIsRecording(true);
    setRecordingFor(shortcutId);
    setPressedKeys(new Set());
    toast.info('Recording shortcut... Press keys now');
  }, []);

  const stopRecording = useCallback(() => {
    if (isRecording && recordingFor && pressedKeys.size > 0) {
      const newKey = formatKeyCombo(pressedKeys);
      updateShortcut(recordingFor, { key: newKey });
      toast.success(`Shortcut updated: ${newKey}`);
    }
    
    setIsRecording(false);
    setRecordingFor(null);
    setPressedKeys(new Set());
  }, [isRecording, recordingFor, pressedKeys, formatKeyCombo, updateShortcut]);

  // Get shortcuts by category
  const getShortcutsByCategory = useCallback((category: string) => {
    return shortcuts.filter(s => s.category === category);
  }, [shortcuts]);

  // Execute shortcut
  const executeShortcut = useCallback((key: string) => {
    const shortcut = shortcuts.find(s => 
      s.enabled && s.key.toLowerCase() === key.toLowerCase()
    );
    
    if (shortcut) {
      try {
        shortcut.handler();
        return true;
      } catch (error) {
        console.error('Error executing shortcut:', error);
        toast.error(`Failed to execute shortcut: ${shortcut.description}`);
      }
    }
    
    return false;
  }, [shortcuts]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const defaultShortcutsWithIds = defaultShortcuts.map(shortcut => ({
      ...shortcut,
      id: generateId(),
    }));
    
    setShortcuts(defaultShortcutsWithIds);
    toast.success('Shortcuts reset to defaults');
  }, [generateId]);

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (isRecording) {
      event.preventDefault();
      setPressedKeys(prev => new Set([...prev, event.key]));
      return;
    }

    const combo = [];
    if (event.ctrlKey) combo.push('Ctrl');
    if (event.shiftKey) combo.push('Shift');
    if (event.altKey) combo.push('Alt');
    if (event.metaKey) combo.push('Meta');
    combo.push(event.key);
    
    const keyCombo = combo.join('+');
    const executed = executeShortcut(keyCombo);
    
    if (executed) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, [isRecording, executeShortcut]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (isRecording && pressedKeys.size > 0) {
      // Stop recording after a short delay to capture full combo
      setTimeout(stopRecording, 100);
    }
  }, [isRecording, pressedKeys.size, stopRecording]);

  // Initialize shortcuts and categories
  useEffect(() => {
    // Load from localStorage or use defaults
    const savedShortcuts = localStorage.getItem(storageKey);
    if (savedShortcuts) {
      try {
        const parsed = JSON.parse(savedShortcuts);
        setShortcuts(parsed);
      } catch (error) {
        console.error('Failed to parse saved shortcuts:', error);
        resetToDefaults();
      }
    } else {
      resetToDefaults();
    }

    // Initialize categories
    const categoriesWithShortcuts = defaultCategories.map(cat => ({
      ...cat,
      shortcuts: [],
    }));
    setCategories(categoriesWithShortcuts);
  }, [storageKey, resetToDefaults]);

  // Save shortcuts to localStorage
  useEffect(() => {
    if (shortcuts.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(shortcuts));
    }
  }, [shortcuts, storageKey]);

  // Update categories with shortcuts
  useEffect(() => {
    setCategories(prev => 
      prev.map(cat => ({
        ...cat,
        shortcuts: shortcuts.filter(s => s.category === cat.id),
      }))
    );
  }, [shortcuts]);

  // Add global event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [handleKeyDown, handleKeyUp]);

  const value: KeyboardShortcutsState = {
    shortcuts,
    categories,
    isRecording,
    recordingFor,
    registerShortcut,
    unregisterShortcut,
    updateShortcut,
    enableShortcut,
    disableShortcut,
    startRecording,
    stopRecording,
    getShortcutsByCategory,
    executeShortcut,
    resetToDefaults,
  };

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}

export const useKeyboardShortcuts = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (context === undefined) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutsProvider');
  }
  return context;
};

// Custom hooks for specific shortcut operations
export const useShortcut = (key: string, handler: () => void, enabled = true) => {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
  
  useEffect(() => {
    if (enabled) {
      const id = registerShortcut({
        key,
        description: `Custom shortcut: ${key}`,
        category: 'custom',
        handler,
        enabled: true,
      });
      
      return () => unregisterShortcut(id);
    }
  }, [key, handler, enabled, registerShortcut, unregisterShortcut]);
};

export const useShortcutCategory = (categoryId: string) => {
  const { categories, getShortcutsByCategory } = useKeyboardShortcuts();
  
  const category = categories.find(c => c.id === categoryId);
  const shortcuts = getShortcutsByCategory(categoryId);
  
  return {
    category,
    shortcuts,
    count: shortcuts.length,
    enabledCount: shortcuts.filter(s => s.enabled).length,
  };
};

// Export context for advanced usage
export { KeyboardShortcutsContext };
export type { KeyboardShortcut, ShortcutCategory, KeyboardShortcutsState };