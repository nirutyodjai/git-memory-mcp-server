/**
 * Advanced Editor Hook for NEXUS IDE
 * Provides comprehensive Monaco Editor management with AI integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { useAI } from './useAI';
import { useMCP } from './useMCP';

export interface EditorFile {
  id: string;
  path: string;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
  isReadonly: boolean;
  encoding: string;
  lineEnding: 'LF' | 'CRLF';
  lastModified: Date;
  size: number;
}

export interface EditorTab {
  id: string;
  file: EditorFile;
  isActive: boolean;
  isPinned: boolean;
  isPreview: boolean;
}

export interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
  splitView: 'none' | 'horizontal' | 'vertical';
  secondaryTabId: string | null;
  isLoading: boolean;
  error: string | null;
  unsavedChanges: string[];
}

export interface EditorActions {
  openFile: (filePath: string) => Promise<void>;
  createFile: (name: string, content?: string, language?: string) => void;
  closeFile: (fileId: string) => void;
  closeAllFiles: () => void;
  closeOtherFiles: (fileId: string) => void;
  saveFile: (fileId: string) => Promise<void>;
  saveAllFiles: () => Promise<void>;
  revertFile: (fileId: string) => void;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  duplicateFile: (fileId: string) => void;
  setActiveTab: (tabId: string) => void;
  pinTab: (tabId: string) => void;
  unpinTab: (tabId: string) => void;
  moveTab: (fromIndex: number, toIndex: number) => void;
  splitEditor: (direction: 'horizontal' | 'vertical') => void;
  closeSplit: () => void;
  formatDocument: (fileId?: string) => Promise<void>;
  organizeImports: (fileId?: string) => Promise<void>;
  findAndReplace: (searchText: string, replaceText: string, options?: any) => void;
  goToLine: (line: number, column?: number) => void;
  goToDefinition: () => void;
  findReferences: () => void;
  renameSymbol: () => void;
  showHover: (position: monaco.Position) => void;
  triggerSuggest: () => void;
  commentLine: () => void;
  foldAll: () => void;
  unfoldAll: () => void;
  toggleMinimap: () => void;
  toggleWordWrap: () => void;
  changeLanguage: (fileId: string, language: string) => void;
  changeEncoding: (fileId: string, encoding: string) => void;
  changeLineEnding: (fileId: string, lineEnding: 'LF' | 'CRLF') => void;
}

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  cursorStyle: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';
  theme: string;
  autoSave: 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange';
  autoSaveDelay: number;
}

const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 14,
  fontFamily: 'Fira Code, Consolas, Monaco, monospace',
  tabSize: 2,
  insertSpaces: true,
  wordWrap: 'off',
  minimap: true,
  lineNumbers: 'on',
  renderWhitespace: 'selection',
  cursorStyle: 'line',
  theme: 'vs-dark',
  autoSave: 'afterDelay',
  autoSaveDelay: 1000
};

export function useEditor(): EditorState & EditorActions & { settings: EditorSettings; updateSettings: (settings: Partial<EditorSettings>) => void } {
  const [state, setState] = useState<EditorState>({
    tabs: [],
    activeTabId: null,
    splitView: 'none',
    secondaryTabId: null,
    isLoading: false,
    error: null,
    unsavedChanges: []
  });

  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const secondaryEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { generateCode, explainCode, optimizeCode } = useAI();
  const { sendMessage } = useMCP();

  // Initialize Monaco Editor
  useEffect(() => {
    // Configure Monaco Editor
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types']
    });

    // Add extra libraries
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `declare module 'react' { export = React; export as namespace React; }`,
      'react.d.ts'
    );

    // Register custom themes
    monaco.editor.defineTheme('nexus-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'class', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' }
      ],
      colors: {
        'editor.background': '#0D1117',
        'editor.foreground': '#E6EDF3',
        'editorLineNumber.foreground': '#7D8590',
        'editorLineNumber.activeForeground': '#E6EDF3',
        'editor.selectionBackground': '#264F78',
        'editor.selectionHighlightBackground': '#264F7840',
        'editorCursor.foreground': '#E6EDF3',
        'editor.findMatchBackground': '#9E6A03',
        'editor.findMatchHighlightBackground': '#F2CC6040'
      }
    });

    monaco.editor.setTheme('nexus-dark');
  }, []);

  // Open file
  const openFile = useCallback(async (filePath: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if file is already open
      const existingTab = state.tabs.find(tab => tab.file.path === filePath);
      if (existingTab) {
        setState(prev => ({ ...prev, activeTabId: existingTab.id, isLoading: false }));
        return;
      }

      // Load file content (this would typically come from a file system API)
      const response = await fetch(`/api/files?path=${encodeURIComponent(filePath)}`);
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`);
      }

      const fileData = await response.json();
      const fileExtension = filePath.split('.').pop() || '';
      const language = monaco.languages.getLanguages().find(lang => 
        lang.extensions?.includes(`.${fileExtension}`)
      )?.id || 'plaintext';

      const newFile: EditorFile = {
        id: Date.now().toString(),
        path: filePath,
        name: filePath.split('/').pop() || 'Untitled',
        content: fileData.content,
        language,
        isDirty: false,
        isReadonly: fileData.readonly || false,
        encoding: fileData.encoding || 'utf-8',
        lineEnding: fileData.lineEnding || 'LF',
        lastModified: new Date(fileData.lastModified),
        size: fileData.size
      };

      const newTab: EditorTab = {
        id: newFile.id,
        file: newFile,
        isActive: true,
        isPinned: false,
        isPreview: false
      };

      setState(prev => ({
        ...prev,
        tabs: [...prev.tabs.map(tab => ({ ...tab, isActive: false })), newTab],
        activeTabId: newTab.id,
        isLoading: false
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to open file'
      }));
    }
  }, [state.tabs]);

  // Create new file
  const createFile = useCallback((name: string, content = '', language = 'typescript') => {
    const newFile: EditorFile = {
      id: Date.now().toString(),
      path: `untitled:${name}`,
      name,
      content,
      language,
      isDirty: true,
      isReadonly: false,
      encoding: 'utf-8',
      lineEnding: 'LF',
      lastModified: new Date(),
      size: content.length
    };

    const newTab: EditorTab = {
      id: newFile.id,
      file: newFile,
      isActive: true,
      isPinned: false,
      isPreview: false
    };

    setState(prev => ({
      ...prev,
      tabs: [...prev.tabs.map(tab => ({ ...tab, isActive: false })), newTab],
      activeTabId: newTab.id
    }));
  }, []);

  // Close file
  const closeFile = useCallback((fileId: string) => {
    setState(prev => {
      const tabIndex = prev.tabs.findIndex(tab => tab.id === fileId);
      if (tabIndex === -1) return prev;

      const newTabs = prev.tabs.filter(tab => tab.id !== fileId);
      let newActiveTabId = prev.activeTabId;

      if (prev.activeTabId === fileId) {
        if (newTabs.length > 0) {
          const nextIndex = Math.min(tabIndex, newTabs.length - 1);
          newActiveTabId = newTabs[nextIndex].id;
        } else {
          newActiveTabId = null;
        }
      }

      return {
        ...prev,
        tabs: newTabs,
        activeTabId: newActiveTabId,
        unsavedChanges: prev.unsavedChanges.filter(id => id !== fileId)
      };
    });
  }, []);

  // Save file
  const saveFile = useCallback(async (fileId: string): Promise<void> => {
    const tab = state.tabs.find(t => t.id === fileId);
    if (!tab) return;

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: tab.file.path,
          content: tab.file.content,
          encoding: tab.file.encoding
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save file: ${response.statusText}`);
      }

      setState(prev => ({
        ...prev,
        tabs: prev.tabs.map(t => 
          t.id === fileId 
            ? { ...t, file: { ...t.file, isDirty: false } }
            : t
        ),
        unsavedChanges: prev.unsavedChanges.filter(id => id !== fileId)
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save file'
      }));
    }
  }, [state.tabs]);

  // Format document
  const formatDocument = useCallback(async (fileId?: string): Promise<void> => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      await editor.getAction('editor.action.formatDocument')?.run();
    } catch (error) {
      console.error('Failed to format document:', error);
    }
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<EditorSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Apply settings to Monaco Editor
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: newSettings.fontSize,
        fontFamily: newSettings.fontFamily,
        tabSize: newSettings.tabSize,
        insertSpaces: newSettings.insertSpaces,
        wordWrap: newSettings.wordWrap,
        minimap: { enabled: newSettings.minimap },
        lineNumbers: newSettings.lineNumbers,
        renderWhitespace: newSettings.renderWhitespace,
        cursorStyle: newSettings.cursorStyle
      });
    }

    if (newSettings.theme) {
      monaco.editor.setTheme(newSettings.theme);
    }
  }, []);

  // Placeholder implementations for other actions
  const closeAllFiles = useCallback(() => {
    setState(prev => ({ ...prev, tabs: [], activeTabId: null, unsavedChanges: [] }));
  }, []);

  const closeOtherFiles = useCallback((fileId: string) => {
    setState(prev => ({
      ...prev,
      tabs: prev.tabs.filter(tab => tab.id === fileId),
      activeTabId: fileId,
      unsavedChanges: prev.unsavedChanges.filter(id => id === fileId)
    }));
  }, []);

  const saveAllFiles = useCallback(async () => {
    for (const tab of state.tabs.filter(t => t.file.isDirty)) {
      await saveFile(tab.id);
    }
  }, [state.tabs, saveFile]);

  const setActiveTab = useCallback((tabId: string) => {
    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => ({ ...tab, isActive: tab.id === tabId })),
      activeTabId: tabId
    }));
  }, []);

  // Return state and actions
  return {
    ...state,
    settings,
    openFile,
    createFile,
    closeFile,
    closeAllFiles,
    closeOtherFiles,
    saveFile,
    saveAllFiles,
    revertFile: () => {},
    renameFile: async () => {},
    duplicateFile: () => {},
    setActiveTab,
    pinTab: () => {},
    unpinTab: () => {},
    moveTab: () => {},
    splitEditor: () => {},
    closeSplit: () => {},
    formatDocument,
    organizeImports: async () => {},
    findAndReplace: () => {},
    goToLine: () => {},
    goToDefinition: () => {},
    findReferences: () => {},
    renameSymbol: () => {},
    showHover: () => {},
    triggerSuggest: () => {},
    commentLine: () => {},
    foldAll: () => {},
    unfoldAll: () => {},
    toggleMinimap: () => {},
    toggleWordWrap: () => {},
    changeLanguage: () => {},
    changeEncoding: () => {},
    changeLineEnding: () => {},
    updateSettings
  };
}

export default useEditor;