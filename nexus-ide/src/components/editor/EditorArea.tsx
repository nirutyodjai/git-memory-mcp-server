import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useMCP } from '../providers/MCPProvider';
import { useKeyboardShortcuts } from '../providers/KeyboardShortcutsProvider';
import {
  X,
  Plus,
  Save,
  RotateCcw,
  RotateCw,
  Search,
  Replace,
  Settings,
  Maximize2,
  Minimize2,
  Copy,
  Scissors,
  Clipboard,
  FileText,
  Code,
  Eye,
  EyeOff,
  Zap,
  Brain,
  GitBranch,
  Bug,
  Play,
  Square,
  MoreHorizontal,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Info,
  Lightbulb,
} from 'lucide-react';

// Monaco Editor types (will be loaded dynamically)
interface MonacoEditor {
  getValue(): string;
  setValue(value: string): void;
  getPosition(): { lineNumber: number; column: number } | null;
  setPosition(position: { lineNumber: number; column: number }): void;
  getSelection(): any;
  setSelection(selection: any): void;
  focus(): void;
  layout(): void;
  dispose(): void;
  onDidChangeModelContent(listener: () => void): any;
  onDidChangeCursorPosition(listener: (e: any) => void): any;
  onDidChangeModelLanguage(listener: (e: any) => void): any;
}

interface EditorTab {
  id: string;
  title: string;
  filePath: string;
  content: string;
  language: string;
  isDirty: boolean;
  isActive: boolean;
  isPreview?: boolean;
  encoding?: string;
  lineEnding?: string;
  lastModified?: Date;
}

interface EditorAreaProps {
  className?: string;
}

interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  minimap: boolean;
  folding: boolean;
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  rulers: number[];
  bracketPairColorization: boolean;
  autoClosingBrackets: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
  autoClosingQuotes: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
  autoIndent: 'none' | 'keep' | 'brackets' | 'advanced' | 'full';
  formatOnSave: boolean;
  formatOnPaste: boolean;
  formatOnType: boolean;
}

const EditorArea: React.FC<EditorAreaProps> = ({ className = '' }) => {
  const { actualTheme } = useTheme();
  const { servers, sendMessage } = useMCP();
  const { executeShortcut } = useKeyboardShortcuts();
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<MonacoEditor | null>(null);
  const [isMonacoLoaded, setIsMonacoLoaded] = useState(false);
  const [tabs, setTabs] = useState<EditorTab[]>([
    {
      id: 'welcome',
      title: 'Welcome',
      filePath: 'welcome.md',
      content: `# Welcome to NEXUS IDE

## The Ultimate AI-Powered Development Environment

NEXUS IDE is designed to be the most advanced and intelligent IDE ever created. Here's what makes it special:

### Key Features

- **AI-Native Development**: Built-in AI assistant that understands your entire codebase
- **Universal Connectivity**: Connect to any data source, API, or service through MCP
- **Real-time Collaboration**: Work together with your team in real-time
- **Advanced Code Intelligence**: Smart code completion, refactoring, and analysis
- **Multi-Language Support**: Support for 100+ programming languages
- **Performance Optimized**: Lightning-fast performance with intelligent caching

### Getting Started

1. **Open a Project**: Use Ctrl+O to open an existing project or Ctrl+N to create a new one
2. **Explore Files**: Use the file explorer on the left to navigate your project
3. **AI Assistant**: Press Ctrl+Shift+A to open the AI assistant
4. **Terminal**: Access the integrated terminal with Ctrl+\`
5. **Settings**: Customize your experience with Ctrl+,

### Pro Tips

- Use **Ctrl+P** for quick file navigation
- **Ctrl+Shift+P** opens the command palette
- **F12** for Go to Definition
- **Ctrl+D** for multi-cursor selection
- **Alt+Shift+F** for format document

### AI Features

- **Smart Code Completion**: Context-aware suggestions
- **Code Generation**: Generate code from natural language
- **Bug Detection**: Automatic bug detection and fixes
- **Code Explanation**: Understand complex code instantly
- **Refactoring**: Intelligent code refactoring suggestions

Start coding and experience the future of development!
`,
      language: 'markdown',
      isDirty: false,
      isActive: true,
      isPreview: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState('welcome');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [editorSettings, setEditorSettings] = useState<EditorSettings>({
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'off',
    lineNumbers: 'on',
    minimap: true,
    folding: true,
    renderWhitespace: 'selection',
    rulers: [80, 120],
    bracketPairColorization: true,
    autoClosingBrackets: 'languageDefined',
    autoClosingQuotes: 'languageDefined',
    autoIndent: 'advanced',
    formatOnSave: true,
    formatOnPaste: true,
    formatOnType: true,
  });
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isAIAssisting, setIsAIAssisting] = useState(false);

  // Load Monaco Editor dynamically
  useEffect(() => {
    const loadMonaco = async () => {
      try {
        // Load Monaco Editor from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
        script.onload = () => {
          // @ts-ignore
          window.require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
          // @ts-ignore
          window.require(['vs/editor/editor.main'], () => {
            setIsMonacoLoaded(true);
          });
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to load Monaco Editor:', error);
      }
    };

    if (!isMonacoLoaded) {
      loadMonaco();
    }
  }, [isMonacoLoaded]);

  // Initialize Monaco Editor
  useEffect(() => {
    if (isMonacoLoaded && editorRef.current && !monacoRef.current) {
      try {
        // @ts-ignore
        const monaco = window.monaco;
        
        // Configure Monaco themes
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
            { token: 'variable', foreground: '9CDCFE' },
          ],
          colors: {
            'editor.background': '#0D1117',
            'editor.foreground': '#E6EDF3',
            'editorLineNumber.foreground': '#7D8590',
            'editor.selectionBackground': '#264F78',
            'editor.inactiveSelectionBackground': '#3A3D41',
            'editorCursor.foreground': '#FFFFFF',
            'editor.lineHighlightBackground': '#2F81F7',
          },
        });

        monaco.editor.defineTheme('nexus-light', {
          base: 'vs',
          inherit: true,
          rules: [
            { token: 'comment', foreground: '008000' },
            { token: 'keyword', foreground: '0000FF' },
            { token: 'string', foreground: 'A31515' },
            { token: 'number', foreground: '098658' },
            { token: 'type', foreground: '267F99' },
            { token: 'class', foreground: '267F99' },
            { token: 'function', foreground: '795E26' },
            { token: 'variable', foreground: '001080' },
          ],
          colors: {
            'editor.background': '#FFFFFF',
            'editor.foreground': '#000000',
            'editorLineNumber.foreground': '#237893',
            'editor.selectionBackground': '#ADD6FF',
            'editor.inactiveSelectionBackground': '#E5EBF1',
            'editorCursor.foreground': '#000000',
            'editor.lineHighlightBackground': '#F0F0F0',
          },
        });

        // Create editor instance
        const editor = monaco.editor.create(editorRef.current, {
          value: tabs.find(tab => tab.id === activeTabId)?.content || '',
          language: tabs.find(tab => tab.id === activeTabId)?.language || 'markdown',
          theme: actualTheme === 'dark' ? 'nexus-dark' : 'nexus-light',
          fontSize: editorSettings.fontSize,
          fontFamily: editorSettings.fontFamily,
          tabSize: editorSettings.tabSize,
          insertSpaces: editorSettings.insertSpaces,
          wordWrap: editorSettings.wordWrap,
          lineNumbers: editorSettings.lineNumbers,
          minimap: { enabled: editorSettings.minimap },
          folding: editorSettings.folding,
          renderWhitespace: editorSettings.renderWhitespace,
          rulers: editorSettings.rulers,
          bracketPairColorization: { enabled: editorSettings.bracketPairColorization },
          autoClosingBrackets: editorSettings.autoClosingBrackets,
          autoClosingQuotes: editorSettings.autoClosingQuotes,
          autoIndent: editorSettings.autoIndent,
          formatOnPaste: editorSettings.formatOnPaste,
          formatOnType: editorSettings.formatOnType,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          contextmenu: true,
          mouseWheelZoom: true,
          multiCursorModifier: 'ctrlCmd',
          selectionHighlight: true,
          occurrencesHighlight: true,
          codeLens: true,
          colorDecorators: true,
          lightbulb: { enabled: true },
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          snippetSuggestions: 'top',
          wordBasedSuggestions: true,
          parameterHints: { enabled: true },
          hover: { enabled: true },
          definitionLinkOpensInPeek: false,
          gotoLocation: {
            multipleReferences: 'peek',
            multipleDefinitions: 'peek',
            multipleDeclarations: 'peek',
            multipleImplementations: 'peek',
          },
        });

        monacoRef.current = editor;

        // Set up event listeners
        editor.onDidChangeModelContent(() => {
          const activeTab = tabs.find(tab => tab.id === activeTabId);
          if (activeTab) {
            const newContent = editor.getValue();
            setTabs(prevTabs => 
              prevTabs.map(tab => 
                tab.id === activeTabId 
                  ? { ...tab, content: newContent, isDirty: newContent !== activeTab.content }
                  : tab
              )
            );
          }
        });

        editor.onDidChangeCursorPosition((e) => {
          // Update status bar with cursor position
          window.dispatchEvent(new CustomEvent('nexus:cursor-position', {
            detail: { line: e.position.lineNumber, column: e.position.column }
          }));
        });

        editor.onDidChangeModelLanguage((e) => {
          // Update status bar with language
          window.dispatchEvent(new CustomEvent('nexus:language-change', {
            detail: { language: e.newLanguage }
          }));
        });

        // Add AI-powered features
        setupAIFeatures(monaco, editor);

      } catch (error) {
        console.error('Failed to initialize Monaco Editor:', error);
      }
    }
  }, [isMonacoLoaded, activeTabId, actualTheme, editorSettings]);

  // Setup AI-powered features
  const setupAIFeatures = useCallback((monaco: any, editor: MonacoEditor) => {
    // AI Code Completion Provider
    monaco.languages.registerCompletionItemProvider('*', {
      provideCompletionItems: async (model: any, position: any) => {
        try {
          setIsAIAssisting(true);
          const textUntilPosition = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          // Send request to AI service through MCP
          const response = await sendMessage('ai-completion', {
            text: textUntilPosition,
            language: model.getLanguageId(),
            position: position,
          });

          const suggestions = response?.suggestions || [];
          setSuggestions(suggestions);

          return {
            suggestions: suggestions.map((suggestion: any) => ({
              label: suggestion.label,
              kind: monaco.languages.CompletionItemKind[suggestion.kind] || monaco.languages.CompletionItemKind.Text,
              insertText: suggestion.insertText,
              documentation: suggestion.documentation,
              detail: suggestion.detail,
              sortText: suggestion.sortText,
            })),
          };
        } catch (error) {
          console.error('AI completion error:', error);
          return { suggestions: [] };
        } finally {
          setIsAIAssisting(false);
        }
      },
    });

    // AI Hover Provider
    monaco.languages.registerHoverProvider('*', {
      provideHover: async (model: any, position: any) => {
        try {
          const word = model.getWordAtPosition(position);
          if (!word) return null;

          const response = await sendMessage('ai-hover', {
            word: word.word,
            language: model.getLanguageId(),
            context: model.getValue(),
            position: position,
          });

          if (response?.hover) {
            return {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
              ),
              contents: [
                { value: response.hover.title },
                { value: response.hover.description },
              ],
            };
          }
        } catch (error) {
          console.error('AI hover error:', error);
        }
        return null;
      },
    });

    // AI Code Actions Provider
    monaco.languages.registerCodeActionProvider('*', {
      provideCodeActions: async (model: any, range: any, context: any) => {
        try {
          const response = await sendMessage('ai-code-actions', {
            text: model.getValueInRange(range),
            language: model.getLanguageId(),
            diagnostics: context.markers,
          });

          const actions = response?.actions || [];
          return {
            actions: actions.map((action: any) => ({
              title: action.title,
              kind: action.kind,
              edit: action.edit,
              command: action.command,
            })),
            dispose: () => {},
          };
        } catch (error) {
          console.error('AI code actions error:', error);
          return { actions: [], dispose: () => {} };
        }
      },
    });
  }, [sendMessage]);

  // Handle tab operations
  const handleTabClick = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    const tab = tabs.find(t => t.id === tabId);
    if (tab && monacoRef.current) {
      monacoRef.current.setValue(tab.content);
      // @ts-ignore
      window.monaco?.editor.setModelLanguage(monacoRef.current.getModel(), tab.language);
    }
  }, [tabs]);

  const handleTabClose = useCallback((tabId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    const tabToClose = tabs.find(t => t.id === tabId);
    if (tabToClose?.isDirty) {
      // Show save dialog
      const shouldSave = window.confirm(`Save changes to ${tabToClose.title}?`);
      if (shouldSave) {
        handleSaveTab(tabId);
      }
    }

    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId) {
      const newActiveTab = newTabs[newTabs.length - 1];
      if (newActiveTab) {
        setActiveTabId(newActiveTab.id);
      }
    }
  }, [tabs, activeTabId]);

  const handleSaveTab = useCallback(async (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab && monacoRef.current) {
      try {
        // Save through MCP
        await sendMessage('file-save', {
          filePath: tab.filePath,
          content: monacoRef.current.getValue(),
        });

        setTabs(prevTabs => 
          prevTabs.map(t => 
            t.id === tabId ? { ...t, isDirty: false } : t
          )
        );
      } catch (error) {
        console.error('Failed to save file:', error);
      }
    }
  }, [tabs, sendMessage]);

  const handleNewTab = useCallback(() => {
    const newTab: EditorTab = {
      id: `untitled-${Date.now()}`,
      title: 'Untitled',
      filePath: '',
      content: '',
      language: 'plaintext',
      isDirty: false,
      isActive: false,
      isPreview: false,
    };
    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            handleSaveTab(activeTabId);
            break;
          case 'n':
            event.preventDefault();
            handleNewTab();
            break;
          case 'w':
            event.preventDefault();
            handleTabClose(activeTabId);
            break;
          case 'f':
            event.preventDefault();
            setShowSearch(true);
            break;
          case ',':
            event.preventDefault();
            setShowSettings(true);
            break;
        }
      }
      
      if (event.key === 'F11') {
        event.preventDefault();
        setIsFullscreen(!isFullscreen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, isFullscreen, handleSaveTab, handleNewTab, handleTabClose]);

  // Render tab
  const renderTab = (tab: EditorTab) => (
    <div
      key={tab.id}
      className={`flex items-center px-3 py-2 border-r border-border cursor-pointer transition-colors ${
        tab.isActive
          ? 'bg-background text-foreground border-b-2 border-b-primary'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
      onClick={() => handleTabClick(tab.id)}
    >
      <FileText className="w-4 h-4 mr-2" />
      <span className="text-sm truncate max-w-32">{tab.title}</span>
      {tab.isDirty && (
        <div className="w-2 h-2 bg-orange-500 rounded-full ml-2" />
      )}
      <button
        onClick={(e) => handleTabClose(tab.id, e)}
        className="ml-2 p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div className={`flex flex-col h-full bg-background ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Tab Bar */}
      <div className="flex items-center bg-muted/30 border-b border-border">
        <div className="flex items-center flex-1 overflow-x-auto">
          {tabs.map(renderTab)}
        </div>
        
        {/* Tab Actions */}
        <div className="flex items-center px-2 space-x-1">
          <button
            onClick={handleNewTab}
            className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
            title="New Tab (Ctrl+N)"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
            title="Search (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
            title="Settings (Ctrl+,)"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
            title="Fullscreen (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="flex items-center p-2 bg-muted/50 border-b border-border space-x-2">
          <div className="flex items-center space-x-2 flex-1">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Replace className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Replace..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="flex-1 px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={() => setShowSearch(false)}
            className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor Container */}
      <div className="flex-1 relative">
        {/* Monaco Editor */}
        <div ref={editorRef} className="w-full h-full" />
        
        {/* Loading Overlay */}
        {!isMonacoLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading Editor...</span>
            </div>
          </div>
        )}
        
        {/* AI Assistant Indicator */}
        {isAIAssisting && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg">
            <Brain className="w-4 h-4 animate-pulse" />
            <span className="text-sm">AI Assisting...</span>
          </div>
        )}
        
        {/* Diagnostics Panel */}
        {diagnostics.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 bg-background border border-border rounded-lg shadow-lg max-h-32 overflow-y-auto">
            <div className="p-2 border-b border-border">
              <h3 className="text-sm font-medium">Problems</h3>
            </div>
            <div className="p-2 space-y-1">
              {diagnostics.map((diagnostic, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  {diagnostic.severity === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                  {diagnostic.severity === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                  {diagnostic.severity === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                  <span>{diagnostic.message}</span>
                  <span className="text-muted-foreground">Line {diagnostic.line}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editor Info Bar */}
      {activeTab && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t border-border text-xs">
          <div className="flex items-center space-x-4">
            <span>{activeTab.language}</span>
            <span>{activeTab.encoding || 'UTF-8'}</span>
            <span>{activeTab.lineEnding || 'LF'}</span>
            {activeTab.isDirty && (
              <span className="text-orange-500">* Modified</span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {suggestions.length > 0 && (
              <span className="text-muted-foreground">
                {suggestions.length} suggestions
              </span>
            )}
            <span className="text-muted-foreground">
              {activeTab.content.split('\n').length} lines
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorArea;

// Editor utilities and hooks
export const useEditorActions = () => {
  const handleAction = (action: string, data?: any) => {
    window.dispatchEvent(new CustomEvent(`nexus:editor-${action}`, { detail: data }));
  };

  return {
    newFile: () => handleAction('new-file'),
    openFile: (filePath: string) => handleAction('open-file', { filePath }),
    saveFile: () => handleAction('save-file'),
    saveAllFiles: () => handleAction('save-all-files'),
    closeFile: (tabId: string) => handleAction('close-file', { tabId }),
    closeAllFiles: () => handleAction('close-all-files'),
    formatDocument: () => handleAction('format-document'),
    gotoLine: (line: number) => handleAction('goto-line', { line }),
    find: (query: string) => handleAction('find', { query }),
    replace: (query: string, replacement: string) => handleAction('replace', { query, replacement }),
    toggleFullscreen: () => handleAction('toggle-fullscreen'),
    showSettings: () => handleAction('show-settings'),
  };
};

// Editor configuration
export const editorConfig = {
  defaultSettings: {
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'off' as const,
    lineNumbers: 'on' as const,
    minimap: true,
    folding: true,
    renderWhitespace: 'selection' as const,
    rulers: [80, 120],
    bracketPairColorization: true,
    autoClosingBrackets: 'languageDefined' as const,
    autoClosingQuotes: 'languageDefined' as const,
    autoIndent: 'advanced' as const,
    formatOnSave: true,
    formatOnPaste: true,
    formatOnType: true,
  },
  supportedLanguages: [
    'typescript', 'javascript', 'python', 'java', 'csharp', 'cpp', 'c',
    'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'clojure',
    'html', 'css', 'scss', 'less', 'json', 'xml', 'yaml', 'toml',
    'markdown', 'plaintext', 'sql', 'shell', 'powershell', 'dockerfile',
    'makefile', 'cmake', 'gradle', 'maven', 'npm', 'yarn',
  ],
  themes: {
    dark: 'nexus-dark',
    light: 'nexus-light',
  },
};

// Export editor component with display name
EditorArea.displayName = 'EditorArea';

export { EditorArea };