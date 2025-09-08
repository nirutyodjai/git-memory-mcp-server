/**
 * Editor Component
 * 
 * An advanced code editor for the NEXUS IDE based on Monaco Editor.
 * Provides intelligent code editing, syntax highlighting, auto-completion, and AI-powered features.
 * 
 * Features:
 * - Monaco Editor Enhanced with custom features
 * - Multi-language support (100+ programming languages)
 * - Intelligent syntax highlighting and code folding
 * - AI-powered code completion and suggestions
 * - Real-time code analysis and error detection
 * - Multi-cursor editing and advanced selection
 * - Vim/Emacs key bindings support
 * - Custom themes and font settings
 * - Code minimap and breadcrumbs
 * - IntelliSense and parameter hints
 * - Code formatting and linting
 * - Git integration and diff view
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { 
  Save, 
  Search, 
  Replace, 
  Settings, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  RotateCw, 
  FileText, 
  Code, 
  Zap,
  Eye,
  EyeOff,
  Brain,
  Sparkles
} from 'lucide-react';
import AICodeCompletion, { CodeContext } from './AICodeCompletion';
import { useAI } from '../../contexts/AIContext';

export interface EditorFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
  isReadOnly?: boolean;
}

export interface EditorProps {
  files: EditorFile[];
  activeFileId?: string;
  onFileChange?: (fileId: string, content: string) => void;
  onFileSave?: (fileId: string) => void;
  onFileClose?: (fileId: string) => void;
  onActiveFileChange?: (fileId: string) => void;
  className?: string;
  theme?: 'vs-dark' | 'vs-light' | 'hc-black';
  fontSize?: number;
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  minimap?: boolean;
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  readOnly?: boolean;
}

export interface EditorSettings {
  theme: 'vs-dark' | 'vs-light' | 'hc-black';
  fontSize: number;
  fontFamily: string;
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  autoSave: boolean;
  formatOnSave: boolean;
  tabSize: number;
  insertSpaces: boolean;
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  cursorStyle: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';
  bracketPairColorization: boolean;
  codeLens: boolean;
  folding: boolean;
  glyphMargin: boolean;
  hover: boolean;
  links: boolean;
  mouseWheelZoom: boolean;
  quickSuggestions: boolean;
  scrollBeyondLastLine: boolean;
  smoothScrolling: boolean;
  wordBasedSuggestions: boolean;
}

const defaultSettings: EditorSettings = {
  theme: 'vs-dark',
  fontSize: 14,
  fontFamily: 'Fira Code, Consolas, Monaco, monospace',
  wordWrap: 'on',
  minimap: true,
  lineNumbers: 'on',
  autoSave: true,
  formatOnSave: true,
  tabSize: 2,
  insertSpaces: true,
  renderWhitespace: 'selection',
  cursorBlinking: 'blink',
  cursorStyle: 'line',
  bracketPairColorization: true,
  codeLens: true,
  folding: true,
  glyphMargin: true,
  hover: true,
  links: true,
  mouseWheelZoom: true,
  quickSuggestions: true,
  scrollBeyondLastLine: true,
  smoothScrolling: true,
  wordBasedSuggestions: true
};

// Configure Monaco Editor
const configureMonaco = () => {
  // Configure TypeScript compiler options
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.Latest,
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

  // Configure diagnostics
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false
  });

  // Add custom themes
  monaco.editor.defineTheme('nexus-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
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
      'editor.findMatchBackground': '#515C6A',
      'editor.findMatchHighlightBackground': '#515C6A60'
    }
  });

  monaco.editor.defineTheme('nexus-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '008000', fontStyle: 'italic' },
      { token: 'keyword', foreground: '0000FF' },
      { token: 'string', foreground: 'A31515' },
      { token: 'number', foreground: '098658' },
      { token: 'type', foreground: '267F99' },
      { token: 'class', foreground: '267F99' },
      { token: 'function', foreground: '795E26' },
      { token: 'variable', foreground: '001080' }
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#000000',
      'editorLineNumber.foreground': '#237893',
      'editorLineNumber.activeForeground': '#0B216F',
      'editor.selectionBackground': '#ADD6FF',
      'editor.selectionHighlightBackground': '#ADD6FF40',
      'editorCursor.foreground': '#000000',
      'editor.findMatchBackground': '#A8AC94',
      'editor.findMatchHighlightBackground': '#A8AC9460'
    }
  });
};

// Initialize Monaco configuration
configureMonaco();

export const Editor: React.FC<EditorProps> = ({
  files,
  activeFileId,
  onFileChange,
  onFileSave,
  onFileClose,
  onActiveFileChange,
  className,
  theme = 'vs-dark',
  fontSize = 14,
  wordWrap = 'on',
  minimap = true,
  lineNumbers = 'on',
  readOnly = false
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<EditorSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMinimap, setShowMinimap] = useState(minimap);
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const activeFile = files?.find(file => file.id === activeFileId);
  const { state: aiState, actions: aiActions } = useAI();

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    const editor = monaco.editor.create(containerRef.current, {
      value: activeFile?.content || '',
      language: activeFile?.language || 'typescript',
      theme: currentTheme === 'vs-dark' ? 'nexus-dark' : currentTheme === 'vs-light' ? 'nexus-light' : currentTheme,
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      wordWrap: settings.wordWrap,
      minimap: { enabled: showMinimap },
      lineNumbers: settings.lineNumbers,
      readOnly: readOnly || activeFile?.isReadOnly,
      automaticLayout: true,
      scrollBeyondLastLine: settings.scrollBeyondLastLine,
      smoothScrolling: settings.smoothScrolling,
      cursorBlinking: settings.cursorBlinking,
      cursorStyle: settings.cursorStyle,
      renderWhitespace: settings.renderWhitespace,
      bracketPairColorization: { enabled: settings.bracketPairColorization },
      codeLens: settings.codeLens,
      folding: settings.folding,
      glyphMargin: settings.glyphMargin,
      hover: { enabled: settings.hover },
      links: settings.links,
      mouseWheelZoom: settings.mouseWheelZoom,
      quickSuggestions: settings.quickSuggestions,
      wordBasedSuggestions: settings.wordBasedSuggestions,
      tabSize: settings.tabSize,
      insertSpaces: settings.insertSpaces,
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      acceptSuggestionOnCommitCharacter: true,
      snippetSuggestions: 'top',
      emptySelectionClipboard: false,
      copyWithSyntaxHighlighting: true,
      multiCursorModifier: 'ctrlCmd',
      accessibilitySupport: 'auto',
      find: {
        seedSearchStringFromSelection: 'always',
        autoFindInSelection: 'never'
      }
    });

    editorRef.current = editor;

    // Handle content changes
    const disposable = editor.onDidChangeModelContent(() => {
      if (activeFile && onFileChange) {
        const content = editor.getValue();
        onFileChange(activeFile.id, content);
      }
    });

    // Handle keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (activeFile && onFileSave) {
        onFileSave(activeFile.id);
        toast.success(`Saved ${activeFile.name}`);
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW, () => {
      if (activeFile && onFileClose) {
        onFileClose(activeFile.id);
      }
    });

    // Auto-save functionality
    let autoSaveTimeout: NodeJS.Timeout;
    if (settings.autoSave) {
      const autoSaveDisposable = editor.onDidChangeModelContent(() => {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
          if (activeFile && onFileSave) {
            onFileSave(activeFile.id);
          }
        }, 2000);
      });

      return () => {
        disposable.dispose();
        autoSaveDisposable.dispose();
        clearTimeout(autoSaveTimeout);
        editor.dispose();
      };
    }

    return () => {
      disposable.dispose();
      clearTimeout(autoSaveTimeout);
      editor.dispose();
    };
  }, []);

  // Create code context for AI
  const createCodeContext = useCallback((): CodeContext => {
    if (!activeFile || !editorRef.current) {
      return {
        projectType: 'unknown',
        language: 'plaintext',
        dependencies: [],
        recentFiles: [],
        currentFile: '',
        cursorPosition: { lineNumber: 1, column: 1 },
        surroundingCode: ''
      };
    }

    const editor = editorRef.current;
    const model = editor.getModel();
    const position = editor.getPosition() || { lineNumber: 1, column: 1 };
    
    // Get surrounding code (10 lines before and after cursor)
    const startLine = Math.max(1, position.lineNumber - 10);
    const endLine = Math.min(model?.getLineCount() || 1, position.lineNumber + 10);
    const surroundingCode = model?.getValueInRange({
      startLineNumber: startLine,
      startColumn: 1,
      endLineNumber: endLine,
      endColumn: model.getLineMaxColumn(endLine)
    }) || '';

    return {
      projectType: detectProjectType(),
      language: model?.getLanguageId() || 'plaintext',
      framework: detectFramework(),
      dependencies: extractDependencies(),
      recentFiles: files.slice(-5).map(f => f.name),
      currentFile: activeFile.name,
      cursorPosition: position,
      selectedText: model?.getValueInRange(editor.getSelection() || { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }),
      surroundingCode
    };
  }, [activeFile, files]);

  // Detect project type based on files
  const detectProjectType = useCallback((): string => {
    const fileNames = files.map(f => f.name.toLowerCase());
    
    if (fileNames.some(name => name.includes('package.json'))) return 'nodejs';
    if (fileNames.some(name => name.includes('requirements.txt') || name.includes('setup.py'))) return 'python';
    if (fileNames.some(name => name.includes('cargo.toml'))) return 'rust';
    if (fileNames.some(name => name.includes('go.mod'))) return 'go';
    if (fileNames.some(name => name.includes('pom.xml') || name.includes('build.gradle'))) return 'java';
    if (fileNames.some(name => name.includes('composer.json'))) return 'php';
    
    return 'general';
  }, [files]);

  // Detect framework based on dependencies and file structure
  const detectFramework = useCallback((): string | undefined => {
    const fileNames = files.map(f => f.name.toLowerCase());
    const fileContents = files.map(f => f.content.toLowerCase()).join(' ');
    
    if (fileContents.includes('react') || fileNames.some(name => name.includes('jsx') || name.includes('tsx'))) return 'react';
    if (fileContents.includes('vue')) return 'vue';
    if (fileContents.includes('angular')) return 'angular';
    if (fileContents.includes('express')) return 'express';
    if (fileContents.includes('django')) return 'django';
    if (fileContents.includes('flask')) return 'flask';
    if (fileContents.includes('spring')) return 'spring';
    
    return undefined;
  }, [files]);

  // Extract dependencies from package files
  const extractDependencies = useCallback((): string[] => {
    const packageFile = files.find(f => f.name === 'package.json');
    if (packageFile) {
      try {
        const pkg = JSON.parse(packageFile.content);
        return [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    const requirementsFile = files.find(f => f.name === 'requirements.txt');
    if (requirementsFile) {
      return requirementsFile.content.split('\n')
        .map(line => line.split('==')[0].split('>=')[0].split('<=')[0].trim())
        .filter(dep => dep.length > 0);
    }
    
    return [];
  }, [files]);

  // Handle AI suggestion acceptance
  const handleAISuggestionAccepted = useCallback((suggestion: any) => {
    aiActions.acceptSuggestion(suggestion);
    toast.success('AI suggestion applied!');
  }, [aiActions]);

  // Handle AI model toggle
  const handleAIModelToggle = useCallback((modelId: string, enabled: boolean) => {
    aiActions.toggleModel(modelId, enabled);
  }, [aiActions]);

  // Update editor when active file changes
  useEffect(() => {
    if (editorRef.current && activeFile) {
      const model = monaco.editor.createModel(
        activeFile.content,
        activeFile.language,
        monaco.Uri.file(activeFile.path)
      );
      editorRef.current.setModel(model);
    }
  }, [activeFile]);

  // Update editor settings
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        theme: currentTheme === 'vs-dark' ? 'nexus-dark' : currentTheme === 'vs-light' ? 'nexus-light' : currentTheme,
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily,
        wordWrap: settings.wordWrap,
        minimap: { enabled: showMinimap },
        lineNumbers: settings.lineNumbers,
        readOnly: readOnly || activeFile?.isReadOnly
      });
    }
  }, [settings, showMinimap, currentTheme, readOnly, activeFile]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format document
  const formatDocument = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
      toast.success('Document formatted');
    }
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Save file
  const saveFile = useCallback(() => {
    if (activeFile && onFileSave) {
      onFileSave(activeFile.id);
      toast.success(`Saved ${activeFile.name}`);
    }
  }, [activeFile, onFileSave]);

  // Find and replace
  const openFindReplace = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.startFindReplaceAction')?.run();
    }
  }, []);

  // Go to line
  const goToLine = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.gotoLine')?.run();
    }
  }, []);

  if (!activeFile) {
    return (
      <div className={cn(
        'flex-1 flex items-center justify-center',
        'bg-background text-muted-foreground',
        className
      )}>
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No file selected</h3>
          <p className="text-sm">Open a file to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex-1 flex flex-col',
      isFullscreen && 'fixed inset-0 z-50 bg-background',
      className
    )}>
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{activeFile.name}</span>
          {activeFile.isDirty && (
            <span className="w-2 h-2 bg-orange-500 rounded-full" title="Unsaved changes" />
          )}
          {activeFile.isReadOnly && (
            <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
              Read-only
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={saveFile}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
            title="Save (Ctrl+S)"
            disabled={!activeFile.isDirty || activeFile.isReadOnly}
          >
            <Save className="w-4 h-4" />
          </button>
          
          <button
            onClick={openFindReplace}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
            title="Find & Replace (Ctrl+H)"
          >
            <Replace className="w-4 h-4" />
          </button>
          
          <button
            onClick={formatDocument}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
            title="Format Document"
          >
            <Code className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowMinimap(!showMinimap)}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
            title="Toggle Minimap"
          >
            {showMinimap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
            title="Editor Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          {/* AI Toggle */}
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`p-1.5 rounded-md transition-colors ${
              aiEnabled 
                ? 'text-primary bg-primary/10 hover:bg-primary/20' 
                : 'hover:bg-accent'
            }`}
            title={aiEnabled ? 'Disable AI Assistant' : 'Enable AI Assistant'}
          >
            <Brain className="w-4 h-4" />
          </button>
          
          {/* AI Panel Toggle */}
          {aiEnabled && (
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={`p-1.5 rounded-md transition-colors ${
                showAIPanel 
                  ? 'text-primary bg-primary/10 hover:bg-primary/20' 
                  : 'hover:bg-accent'
              }`}
              title="AI Assistant Panel"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 relative">
        <div
          ref={containerRef}
          className="w-full h-full"
        />
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute top-4 right-4 w-80 bg-background border border-border rounded-lg shadow-lg p-4 z-10">
            <h3 className="font-medium mb-4">Editor Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Theme</label>
                <select
                  value={currentTheme}
                  onChange={(e) => setCurrentTheme(e.target.value as any)}
                  className="w-full mt-1 p-2 bg-background border border-border rounded"
                >
                  <option value="vs-dark">Dark</option>
                  <option value="vs-light">Light</option>
                  <option value="hc-black">High Contrast</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Font Size</label>
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) => setSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                  className="w-full mt-1"
                />
                <span className="text-xs text-muted-foreground">{settings.fontSize}px</span>
              </div>
              
              <div>
                <label className="text-sm font-medium">Word Wrap</label>
                <select
                  value={settings.wordWrap}
                  onChange={(e) => setSettings(prev => ({ ...prev, wordWrap: e.target.value as any }))}
                  className="w-full mt-1 p-2 bg-background border border-border rounded"
                >
                  <option value="on">On</option>
                  <option value="off">Off</option>
                  <option value="wordWrapColumn">Word Wrap Column</option>
                  <option value="bounded">Bounded</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Minimap</label>
                <input
                  type="checkbox"
                  checked={showMinimap}
                  onChange={(e) => setShowMinimap(e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto Save</label>
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoSave: e.target.checked }))}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Format on Save</label>
                <input
                  type="checkbox"
                  checked={settings.formatOnSave}
                  onChange={(e) => setSettings(prev => ({ ...prev, formatOnSave: e.target.checked }))}
                  className="rounded"
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        )}
        
        {/* AI Code Completion */}
        {aiEnabled && editorRef.current && (
          <AICodeCompletion
            editor={editorRef.current}
            context={createCodeContext()}
            models={aiState.models}
            onSuggestionAccepted={handleAISuggestionAccepted}
            onModelToggle={handleAIModelToggle}
            className="absolute inset-0 pointer-events-none"
          />
        )}
        
        {/* AI Status Indicator */}
        {aiEnabled && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              aiState.isInitialized 
                ? (aiState.isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500')
                : 'bg-red-500'
            }`} />
            <span className="text-muted-foreground">
              AI: {aiState.isInitialized ? (aiState.isLoading ? 'Thinking...' : 'Ready') : 'Initializing...'}
            </span>
            {aiState.activeModels.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                {aiState.activeModels.length} models
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;