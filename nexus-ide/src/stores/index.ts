// Zustand stores for NEXUS IDE state management

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  FileSystemItem,
  EditorTab,
  TerminalSession,
  AIAssistantState,
  ProjectSettings,
  NotificationItem,
  KeyboardShortcut,
  PluginInfo,
  SearchResult,
  DebugSession,
  GitStatus,
  ThemeConfig
} from '../types';

// Theme Store
interface ThemeStore {
  theme: 'light' | 'dark' | 'system';
  currentTheme: 'light' | 'dark';
  customThemes: ThemeConfig[];
  activeCustomTheme: string | null;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCurrentTheme: (theme: 'light' | 'dark') => void;
  addCustomTheme: (theme: ThemeConfig) => void;
  removeCustomTheme: (id: string) => void;
  setActiveCustomTheme: (id: string | null) => void;
  updateCustomTheme: (id: string, updates: Partial<ThemeConfig>) => void;
}

export const useThemeStore = create<ThemeStore>()()
  (devtools(
    persist(
      immer((set, get) => ({
        theme: 'system',
        currentTheme: 'dark',
        customThemes: [],
        activeCustomTheme: null,
        
        setTheme: (theme) => set((state) => {
          state.theme = theme;
          if (theme !== 'system') {
            state.currentTheme = theme;
          }
        }),
        
        setCurrentTheme: (theme) => set((state) => {
          state.currentTheme = theme;
        }),
        
        addCustomTheme: (theme) => set((state) => {
          state.customThemes.push(theme);
        }),
        
        removeCustomTheme: (id) => set((state) => {
          state.customThemes = state.customThemes.filter(t => t.id !== id);
          if (state.activeCustomTheme === id) {
            state.activeCustomTheme = null;
          }
        }),
        
        setActiveCustomTheme: (id) => set((state) => {
          state.activeCustomTheme = id;
        }),
        
        updateCustomTheme: (id, updates) => set((state) => {
          const theme = state.customThemes.find(t => t.id === id);
          if (theme) {
            Object.assign(theme, updates);
          }
        })
      })),
      {
        name: 'nexus-theme-store',
        partialize: (state) => ({
          theme: state.theme,
          customThemes: state.customThemes,
          activeCustomTheme: state.activeCustomTheme
        })
      }
    ),
    { name: 'ThemeStore' }
  ));

// File System Store
interface FileSystemStore {
  rootPath: string;
  currentPath: string;
  items: FileSystemItem[];
  selectedItems: string[];
  expandedFolders: Set<string>;
  recentFiles: string[];
  pinnedFiles: string[];
  searchQuery: string;
  searchResults: FileSystemItem[];
  isLoading: boolean;
  error: string | null;
  
  setRootPath: (path: string) => void;
  setCurrentPath: (path: string) => void;
  setItems: (items: FileSystemItem[]) => void;
  addItem: (item: FileSystemItem) => void;
  removeItem: (path: string) => void;
  updateItem: (path: string, updates: Partial<FileSystemItem>) => void;
  selectItem: (path: string, multi?: boolean) => void;
  clearSelection: () => void;
  toggleFolder: (path: string) => void;
  addRecentFile: (path: string) => void;
  removeRecentFile: (path: string) => void;
  togglePinnedFile: (path: string) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: FileSystemItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFileSystemStore = create<FileSystemStore>()()
  (devtools(
    persist(
      immer((set, get) => ({
        rootPath: '',
        currentPath: '',
        items: [],
        selectedItems: [],
        expandedFolders: new Set(),
        recentFiles: [],
        pinnedFiles: [],
        searchQuery: '',
        searchResults: [],
        isLoading: false,
        error: null,
        
        setRootPath: (path) => set((state) => {
          state.rootPath = path;
          state.currentPath = path;
        }),
        
        setCurrentPath: (path) => set((state) => {
          state.currentPath = path;
        }),
        
        setItems: (items) => set((state) => {
          state.items = items;
        }),
        
        addItem: (item) => set((state) => {
          state.items.push(item);
        }),
        
        removeItem: (path) => set((state) => {
          state.items = state.items.filter(item => item.path !== path);
          state.selectedItems = state.selectedItems.filter(p => p !== path);
          state.recentFiles = state.recentFiles.filter(p => p !== path);
          state.pinnedFiles = state.pinnedFiles.filter(p => p !== path);
        }),
        
        updateItem: (path, updates) => set((state) => {
          const item = state.items.find(i => i.path === path);
          if (item) {
            Object.assign(item, updates);
          }
        }),
        
        selectItem: (path, multi = false) => set((state) => {
          if (multi) {
            if (state.selectedItems.includes(path)) {
              state.selectedItems = state.selectedItems.filter(p => p !== path);
            } else {
              state.selectedItems.push(path);
            }
          } else {
            state.selectedItems = [path];
          }
        }),
        
        clearSelection: () => set((state) => {
          state.selectedItems = [];
        }),
        
        toggleFolder: (path) => set((state) => {
          if (state.expandedFolders.has(path)) {
            state.expandedFolders.delete(path);
          } else {
            state.expandedFolders.add(path);
          }
        }),
        
        addRecentFile: (path) => set((state) => {
          state.recentFiles = [path, ...state.recentFiles.filter(p => p !== path)].slice(0, 20);
        }),
        
        removeRecentFile: (path) => set((state) => {
          state.recentFiles = state.recentFiles.filter(p => p !== path);
        }),
        
        togglePinnedFile: (path) => set((state) => {
          if (state.pinnedFiles.includes(path)) {
            state.pinnedFiles = state.pinnedFiles.filter(p => p !== path);
          } else {
            state.pinnedFiles.push(path);
          }
        }),
        
        setSearchQuery: (query) => set((state) => {
          state.searchQuery = query;
        }),
        
        setSearchResults: (results) => set((state) => {
          state.searchResults = results;
        }),
        
        setLoading: (loading) => set((state) => {
          state.isLoading = loading;
        }),
        
        setError: (error) => set((state) => {
          state.error = error;
        })
      })),
      {
        name: 'nexus-filesystem-store',
        partialize: (state) => ({
          rootPath: state.rootPath,
          expandedFolders: Array.from(state.expandedFolders),
          recentFiles: state.recentFiles,
          pinnedFiles: state.pinnedFiles
        }),
        onRehydrateStorage: () => (state) => {
          if (state && Array.isArray(state.expandedFolders)) {
            state.expandedFolders = new Set(state.expandedFolders);
          }
        }
      }
    ),
    { name: 'FileSystemStore' }
  ));

// Editor Store
interface EditorStore {
  tabs: EditorTab[];
  activeTabId: string | null;
  splitPanes: string[];
  activePaneId: string;
  settings: {
    fontSize: number;
    fontFamily: string;
    tabSize: number;
    insertSpaces: boolean;
    wordWrap: boolean;
    lineNumbers: boolean;
    minimap: boolean;
    autoSave: boolean;
    autoSaveDelay: number;
  };
  
  openTab: (tab: Omit<EditorTab, 'id'>) => string;
  closeTab: (id: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<EditorTab>) => void;
  moveTab: (fromIndex: number, toIndex: number) => void;
  duplicateTab: (id: string) => void;
  splitPane: (direction: 'horizontal' | 'vertical') => void;
  closeSplitPane: (paneId: string) => void;
  setActivePane: (paneId: string) => void;
  updateSettings: (settings: Partial<EditorStore['settings']>) => void;
}

export const useEditorStore = create<EditorStore>()()
  (devtools(
    persist(
      immer((set, get) => ({
        tabs: [],
        activeTabId: null,
        splitPanes: ['main'],
        activePaneId: 'main',
        settings: {
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Consolas, monospace',
          tabSize: 2,
          insertSpaces: true,
          wordWrap: true,
          lineNumbers: true,
          minimap: true,
          autoSave: true,
          autoSaveDelay: 1000
        },
        
        openTab: (tabData) => {
          const id = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const tab: EditorTab = { ...tabData, id };
          
          set((state) => {
            // Check if file is already open
            const existingTab = state.tabs.find(t => t.filePath === tab.filePath);
            if (existingTab) {
              state.activeTabId = existingTab.id;
              return;
            }
            
            state.tabs.push(tab);
            state.activeTabId = id;
          });
          
          return id;
        },
        
        closeTab: (id) => set((state) => {
          const index = state.tabs.findIndex(t => t.id === id);
          if (index === -1) return;
          
          state.tabs.splice(index, 1);
          
          if (state.activeTabId === id) {
            if (state.tabs.length > 0) {
              const newIndex = Math.min(index, state.tabs.length - 1);
              state.activeTabId = state.tabs[newIndex]?.id || null;
            } else {
              state.activeTabId = null;
            }
          }
        }),
        
        closeAllTabs: () => set((state) => {
          state.tabs = [];
          state.activeTabId = null;
        }),
        
        closeOtherTabs: (id) => set((state) => {
          const tab = state.tabs.find(t => t.id === id);
          if (tab) {
            state.tabs = [tab];
            state.activeTabId = id;
          }
        }),
        
        setActiveTab: (id) => set((state) => {
          if (state.tabs.find(t => t.id === id)) {
            state.activeTabId = id;
          }
        }),
        
        updateTab: (id, updates) => set((state) => {
          const tab = state.tabs.find(t => t.id === id);
          if (tab) {
            Object.assign(tab, updates);
          }
        }),
        
        moveTab: (fromIndex, toIndex) => set((state) => {
          const [tab] = state.tabs.splice(fromIndex, 1);
          state.tabs.splice(toIndex, 0, tab);
        }),
        
        duplicateTab: (id) => {
          const { openTab } = get();
          const tab = get().tabs.find(t => t.id === id);
          if (tab) {
            const { id: _, ...tabData } = tab;
            openTab({ ...tabData, title: `${tab.title} (Copy)` });
          }
        },
        
        splitPane: (direction) => set((state) => {
          const newPaneId = `pane-${Date.now()}`;
          state.splitPanes.push(newPaneId);
          state.activePaneId = newPaneId;
        }),
        
        closeSplitPane: (paneId) => set((state) => {
          if (state.splitPanes.length > 1) {
            state.splitPanes = state.splitPanes.filter(p => p !== paneId);
            if (state.activePaneId === paneId) {
              state.activePaneId = state.splitPanes[0];
            }
          }
        }),
        
        setActivePane: (paneId) => set((state) => {
          if (state.splitPanes.includes(paneId)) {
            state.activePaneId = paneId;
          }
        }),
        
        updateSettings: (settings) => set((state) => {
          Object.assign(state.settings, settings);
        })
      })),
      {
        name: 'nexus-editor-store',
        partialize: (state) => ({
          settings: state.settings,
          tabs: state.tabs.map(tab => ({
            ...tab,
            content: undefined // Don't persist content
          }))
        })
      }
    ),
    { name: 'EditorStore' }
  ));

// Terminal Store
interface TerminalStore {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  settings: {
    fontSize: number;
    fontFamily: string;
    theme: string;
    cursorStyle: 'block' | 'underline' | 'bar';
    cursorBlink: boolean;
    scrollback: number;
  };
  
  createSession: (session: Omit<TerminalSession, 'id'>) => string;
  removeSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  updateSession: (id: string, updates: Partial<TerminalSession>) => void;
  addToHistory: (sessionId: string, command: string) => void;
  clearHistory: (sessionId: string) => void;
  updateSettings: (settings: Partial<TerminalStore['settings']>) => void;
}

export const useTerminalStore = create<TerminalStore>()()
  (devtools(
    persist(
      immer((set, get) => ({
        sessions: [],
        activeSessionId: null,
        settings: {
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Consolas, monospace',
          theme: 'dark',
          cursorStyle: 'block',
          cursorBlink: true,
          scrollback: 1000
        },
        
        createSession: (sessionData) => {
          const id = `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const session: TerminalSession = {
            ...sessionData,
            id,
            history: [],
            createdAt: new Date(),
            lastActivity: new Date()
          };
          
          set((state) => {
            state.sessions.push(session);
            state.activeSessionId = id;
          });
          
          return id;
        },
        
        removeSession: (id) => set((state) => {
          state.sessions = state.sessions.filter(s => s.id !== id);
          if (state.activeSessionId === id) {
            state.activeSessionId = state.sessions[0]?.id || null;
          }
        }),
        
        setActiveSession: (id) => set((state) => {
          if (state.sessions.find(s => s.id === id)) {
            state.activeSessionId = id;
          }
        }),
        
        updateSession: (id, updates) => set((state) => {
          const session = state.sessions.find(s => s.id === id);
          if (session) {
            Object.assign(session, updates);
            session.lastActivity = new Date();
          }
        }),
        
        addToHistory: (sessionId, command) => set((state) => {
          const session = state.sessions.find(s => s.id === sessionId);
          if (session) {
            session.history.push(command);
            if (session.history.length > 1000) {
              session.history = session.history.slice(-1000);
            }
          }
        }),
        
        clearHistory: (sessionId) => set((state) => {
          const session = state.sessions.find(s => s.id === sessionId);
          if (session) {
            session.history = [];
          }
        }),
        
        updateSettings: (settings) => set((state) => {
          Object.assign(state.settings, settings);
        })
      })),
      {
        name: 'nexus-terminal-store',
        partialize: (state) => ({
          settings: state.settings,
          sessions: state.sessions.map(session => ({
            ...session,
            // Don't persist terminal instance
            terminal: undefined
          }))
        })
      }
    ),
    { name: 'TerminalStore' }
  ));

// AI Assistant Store
interface AIAssistantStore {
  isOpen: boolean;
  conversations: {
    id: string;
    title: string;
    messages: Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
      metadata?: any;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }[];
  activeConversationId: string | null;
  isLoading: boolean;
  settings: {
    model: string;
    temperature: number;
    maxTokens: number;
    autoSuggest: boolean;
    contextAware: boolean;
  };
  
  toggle: () => void;
  open: () => void;
  close: () => void;
  createConversation: (title?: string) => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: { role: 'user' | 'assistant'; content: string; metadata?: any }) => void;
  updateMessage: (conversationId: string, messageId: string, updates: any) => void;
  clearConversation: (id: string) => void;
  setLoading: (loading: boolean) => void;
  updateSettings: (settings: Partial<AIAssistantStore['settings']>) => void;
}

export const useAIAssistantStore = create<AIAssistantStore>()()
  (devtools(
    persist(
      immer((set, get) => ({
        isOpen: false,
        conversations: [],
        activeConversationId: null,
        isLoading: false,
        settings: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2048,
          autoSuggest: true,
          contextAware: true
        },
        
        toggle: () => set((state) => {
          state.isOpen = !state.isOpen;
        }),
        
        open: () => set((state) => {
          state.isOpen = true;
        }),
        
        close: () => set((state) => {
          state.isOpen = false;
        }),
        
        createConversation: (title = 'New Conversation') => {
          const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const now = new Date();
          
          set((state) => {
            state.conversations.push({
              id,
              title,
              messages: [],
              createdAt: now,
              updatedAt: now
            });
            state.activeConversationId = id;
          });
          
          return id;
        },
        
        deleteConversation: (id) => set((state) => {
          state.conversations = state.conversations.filter(c => c.id !== id);
          if (state.activeConversationId === id) {
            state.activeConversationId = state.conversations[0]?.id || null;
          }
        }),
        
        setActiveConversation: (id) => set((state) => {
          if (state.conversations.find(c => c.id === id)) {
            state.activeConversationId = id;
          }
        }),
        
        addMessage: (conversationId, messageData) => set((state) => {
          const conversation = state.conversations.find(c => c.id === conversationId);
          if (conversation) {
            const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            conversation.messages.push({
              ...messageData,
              id: messageId,
              timestamp: new Date()
            });
            conversation.updatedAt = new Date();
          }
        }),
        
        updateMessage: (conversationId, messageId, updates) => set((state) => {
          const conversation = state.conversations.find(c => c.id === conversationId);
          if (conversation) {
            const message = conversation.messages.find(m => m.id === messageId);
            if (message) {
              Object.assign(message, updates);
              conversation.updatedAt = new Date();
            }
          }
        }),
        
        clearConversation: (id) => set((state) => {
          const conversation = state.conversations.find(c => c.id === id);
          if (conversation) {
            conversation.messages = [];
            conversation.updatedAt = new Date();
          }
        }),
        
        setLoading: (loading) => set((state) => {
          state.isLoading = loading;
        }),
        
        updateSettings: (settings) => set((state) => {
          Object.assign(state.settings, settings);
        })
      })),
      {
        name: 'nexus-ai-assistant-store',
        partialize: (state) => ({
          conversations: state.conversations,
          activeConversationId: state.activeConversationId,
          settings: state.settings
        })
      }
    ),
    { name: 'AIAssistantStore' }
  ));

// Notification Store
interface NotificationStore {
  notifications: NotificationItem[];
  settings: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    duration: number;
    maxVisible: number;
  };
  
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  updateSettings: (settings: Partial<NotificationStore['settings']>) => void;
}

export const useNotificationStore = create<NotificationStore>()()
  (devtools(
    immer((set, get) => ({
      notifications: [],
      settings: {
        enabled: true,
        sound: true,
        desktop: true,
        position: 'top-right',
        duration: 5000,
        maxVisible: 5
      },
      
      addNotification: (notificationData) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const notification: NotificationItem = {
          ...notificationData,
          id,
          timestamp: new Date(),
          read: false
        };
        
        set((state) => {
          state.notifications.unshift(notification);
          // Keep only last 100 notifications
          if (state.notifications.length > 100) {
            state.notifications = state.notifications.slice(0, 100);
          }
        });
        
        return id;
      },
      
      removeNotification: (id) => set((state) => {
        state.notifications = state.notifications.filter(n => n.id !== id);
      }),
      
      clearAll: () => set((state) => {
        state.notifications = [];
      }),
      
      markAsRead: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        if (notification) {
          notification.read = true;
        }
      }),
      
      markAllAsRead: () => set((state) => {
        state.notifications.forEach(n => n.read = true);
      }),
      
      updateSettings: (settings) => set((state) => {
        Object.assign(state.settings, settings);
      })
    })),
    { name: 'NotificationStore' }
  ));

// Project Store
interface ProjectStore {
  currentProject: {
    name: string;
    path: string;
    type: string;
    settings: ProjectSettings;
    lastOpened: Date;
  } | null;
  recentProjects: Array<{
    name: string;
    path: string;
    type: string;
    lastOpened: Date;
  }>;
  
  openProject: (project: { name: string; path: string; type: string; settings?: ProjectSettings }) => void;
  closeProject: () => void;
  updateProjectSettings: (settings: Partial<ProjectSettings>) => void;
  addToRecent: (project: { name: string; path: string; type: string }) => void;
  removeFromRecent: (path: string) => void;
  clearRecent: () => void;
}

export const useProjectStore = create<ProjectStore>()()
  (devtools(
    persist(
      immer((set, get) => ({
        currentProject: null,
        recentProjects: [],
        
        openProject: (projectData) => set((state) => {
          const now = new Date();
          state.currentProject = {
            ...projectData,
            settings: projectData.settings || {},
            lastOpened: now
          };
          
          // Add to recent projects
          const recent = {
            name: projectData.name,
            path: projectData.path,
            type: projectData.type,
            lastOpened: now
          };
          
          state.recentProjects = [
            recent,
            ...state.recentProjects.filter(p => p.path !== projectData.path)
          ].slice(0, 10);
        }),
        
        closeProject: () => set((state) => {
          state.currentProject = null;
        }),
        
        updateProjectSettings: (settings) => set((state) => {
          if (state.currentProject) {
            Object.assign(state.currentProject.settings, settings);
          }
        }),
        
        addToRecent: (project) => set((state) => {
          const recent = {
            ...project,
            lastOpened: new Date()
          };
          
          state.recentProjects = [
            recent,
            ...state.recentProjects.filter(p => p.path !== project.path)
          ].slice(0, 10);
        }),
        
        removeFromRecent: (path) => set((state) => {
          state.recentProjects = state.recentProjects.filter(p => p.path !== path);
        }),
        
        clearRecent: () => set((state) => {
          state.recentProjects = [];
        })
      })),
      {
        name: 'nexus-project-store'
      }
    ),
    { name: 'ProjectStore' }
  ));

// Export all stores
export {
  useThemeStore,
  useFileSystemStore,
  useEditorStore,
  useTerminalStore,
  useAIAssistantStore,
  useNotificationStore,
  useProjectStore
};

// Export store types
export type {
  ThemeStore,
  FileSystemStore,
  EditorStore,
  TerminalStore,
  AIAssistantStore,
  NotificationStore,
  ProjectStore
};