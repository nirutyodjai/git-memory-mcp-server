import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { useTheme } from '../providers/ThemeProvider';
import { useMCP } from '../providers/MCPProvider';
import { useKeyboardShortcuts } from '../providers/KeyboardShortcutsProvider';
import { useStatusBar } from '../layout/StatusBar';
import {
  Save,
  Search,
  Replace,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Zap,
  Bot,
  Users,
  Settings,
  FileText,
  Code,
  Eye,
  EyeOff,
  Play,
  Square,
  GitBranch,
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
} from 'lucide-react';

interface MonacoEditorProps {
  className?: string;
  value?: string;
  language?: string;
  theme?: string;
  readOnly?: boolean;
  minimap?: boolean;
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  fontSize?: number;
  tabSize?: number;
  insertSpaces?: boolean;
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  folding?: boolean;
  renderWhitespace?: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  cursorBlinking?: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  multiCursorModifier?: 'ctrlCmd' | 'alt';
  onValueChange?: (value: string) => void;
  onCursorPositionChange?: (position: { line: number; column: number }) => void;
  onSelectionChange?: (selection: string) => void;
  onLanguageChange?: (language: string) => void;
  onSave?: (value: string) => void;
  onFormat?: () => void;
  onFind?: () => void;
  onReplace?: () => void;
}

interface AIAssistantSuggestion {
  id: string;
  type: 'completion' | 'refactor' | 'fix' | 'optimize' | 'explain';
  title: string;
  description: string;
  code?: string;
  range?: monaco.Range;
  confidence: number;
  model: string;
}

interface CollaborationCursor {
  userId: string;
  userName: string;
  color: string;
  position: { line: number; column: number };
  selection?: { startLine: number; startColumn: number; endLine: number; endColumn: number };
}

interface DiagnosticItem {
  id: string;
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  source: string;
  range: { startLine: number; startColumn: number; endLine: number; endColumn: number };
  quickFixes?: Array<{
    title: string;
    edit: string;
  }>;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  className = '',
  value = '',
  language = 'typescript',
  theme,
  readOnly = false,
  minimap = true,
  wordWrap = 'on',
  fontSize = 14,
  tabSize = 2,
  insertSpaces = true,
  lineNumbers = 'on',
  folding = true,
  renderWhitespace = 'selection',
  cursorBlinking = 'blink',
  multiCursorModifier = 'ctrlCmd',
  onValueChange,
  onCursorPositionChange,
  onSelectionChange,
  onLanguageChange,
  onSave,
  onFormat,
  onFind,
  onReplace,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { actualTheme } = useTheme();
  const { servers, sendMessage } = useMCP();
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
  const { setCurrentFile, setCursorPosition, setSelectedText, setLanguage } = useStatusBar();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMinimap, setShowMinimap] = useState(minimap);
  const [aiSuggestions, setAiSuggestions] = useState<AIAssistantSuggestion[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [collaborationCursors, setCollaborationCursors] = useState<CollaborationCursor[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [currentModel, setCurrentModel] = useState('gpt-4');
  const [autoSave, setAutoSave] = useState(true);
  const [vimMode, setVimMode] = useState(false);
  const [showInlayHints, setShowInlayHints] = useState(true);
  const [showCodeLens, setShowCodeLens] = useState(true);
  const [enableBracketPairColorization, setEnableBracketPairColorization] = useState(true);
  const [enableSemanticHighlighting, setEnableSemanticHighlighting] = useState(true);
  const [enableIntelliSense, setEnableIntelliSense] = useState(true);
  const [enableCodeActions, setEnableCodeActions] = useState(true);
  const [enableHover, setEnableHover] = useState(true);
  const [enableParameterHints, setEnableParameterHints] = useState(true);
  const [enableQuickSuggestions, setEnableQuickSuggestions] = useState(true);
  const [enableWordBasedSuggestions, setEnableWordBasedSuggestions] = useState(true);
  const [enableSnippetSuggestions, setEnableSnippetSuggestions] = useState(true);
  const [enableFormatOnType, setEnableFormatOnType] = useState(true);
  const [enableFormatOnPaste, setEnableFormatOnPaste] = useState(true);
  const [enableAutoClosingBrackets, setEnableAutoClosingBrackets] = useState(true);
  const [enableAutoClosingQuotes, setEnableAutoClosingQuotes] = useState(true);
  const [enableAutoSurround, setEnableAutoSurround] = useState(true);
  const [enableLinkedEditing, setEnableLinkedEditing] = useState(true);
  const [enableRenameOnType, setEnableRenameOnType] = useState(true);
  const [enableSmoothScrolling, setEnableSmoothScrolling] = useState(true);
  const [enableMultiCursorMerging, setEnableMultiCursorMerging] = useState(true);
  const [enableDragAndDrop, setEnableDragAndDrop] = useState(true);
  const [enableContextMenu, setEnableContextMenu] = useState(true);
  const [enableFindInSelection, setEnableFindInSelection] = useState(true);
  const [enableHighlightActiveIndentGuide, setEnableHighlightActiveIndentGuide] = useState(true);
  const [enableRenderControlCharacters, setEnableRenderControlCharacters] = useState(false);
  const [enableRenderFinalNewline, setEnableRenderFinalNewline] = useState(true);
  const [enableShowFoldingControls, setEnableShowFoldingControls] = useState('mouseover');
  const [enableUnfoldOnClickAfterEndOfLine, setEnableUnfoldOnClickAfterEndOfLine] = useState(false);
  const [enableGlyphMargin, setEnableGlyphMargin] = useState(true);
  const [enableLineDecorationsWidth, setEnableLineDecorationsWidth] = useState(10);
  const [enableLineNumbersMinChars, setEnableLineNumbersMinChars] = useState(5);
  const [enableOverviewRulerBorder, setEnableOverviewRulerBorder] = useState(true);
  const [enableOverviewRulerLanes, setEnableOverviewRulerLanes] = useState(3);
  const [enableRuler, setEnableRuler] = useState([80, 120]);
  const [enableScrollbar, setEnableScrollbar] = useState({
    vertical: 'auto',
    horizontal: 'auto',
    verticalScrollbarSize: 14,
    horizontalScrollbarSize: 12,
    verticalSliderSize: 14,
    horizontalSliderSize: 12,
  });

  // Initialize Monaco Editor
  useEffect(() => {
    if (!editorRef.current) return;

    // Configure Monaco environment
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
      typeRoots: ['node_modules/@types'],
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true,
    });

    // Enhanced editor configuration
    const editor = monaco.editor.create(editorRef.current, {
      value,
      language,
      theme: theme || (actualTheme === 'dark' ? 'vs-dark' : 'vs'),
      readOnly,
      minimap: {
        enabled: showMinimap,
        side: 'right',
        size: 'proportional',
        showSlider: 'mouseover',
        renderCharacters: true,
        maxColumn: 120,
        scale: 1,
      },
      wordWrap,
      fontSize,
      fontFamily: 'JetBrains Mono, Fira Code, SF Mono, Monaco, Inconsolata, Roboto Mono, source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace',
      fontLigatures: true,
      fontWeight: '400',
      letterSpacing: 0.5,
      lineHeight: 1.6,
      tabSize,
      insertSpaces,
      detectIndentation: true,
      trimAutoWhitespace: true,
      lineNumbers,
      lineNumbersMinChars: enableLineNumbersMinChars,
      lineDecorationsWidth: enableLineDecorationsWidth,
      glyphMargin: enableGlyphMargin,
      folding,
      foldingStrategy: 'indentation',
      foldingHighlight: true,
      unfoldOnClickAfterEndOfLine: enableUnfoldOnClickAfterEndOfLine,
      showFoldingControls: enableShowFoldingControls as any,
      renderWhitespace,
      renderControlCharacters: enableRenderControlCharacters,
      renderFinalNewline: enableRenderFinalNewline,
      renderLineHighlight: 'all',
      renderLineHighlightOnlyWhenFocus: false,
      renderValidationDecorations: 'on',
      cursorBlinking,
      cursorSmoothCaretAnimation: enableSmoothScrolling,
      cursorStyle: 'line',
      cursorWidth: 2,
      multiCursorModifier,
      multiCursorMerging: enableMultiCursorMerging,
      multiCursorPaste: 'spread',
      accessibilitySupport: 'auto',
      suggest: {
        enabled: enableIntelliSense,
        quickSuggestions: enableQuickSuggestions ? {
          other: true,
          comments: true,
          strings: true,
        } : false,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        acceptSuggestionOnCommitCharacter: true,
        snippetsPreventQuickSuggestions: false,
        localityBonus: true,
        shareSuggestSelections: true,
        showIcons: true,
        showStatusBar: true,
        showInlineDetails: true,
        showMethods: true,
        showFunctions: true,
        showConstructors: true,
        showFields: true,
        showVariables: true,
        showClasses: true,
        showStructs: true,
        showInterfaces: true,
        showModules: true,
        showProperties: true,
        showEvents: true,
        showOperators: true,
        showUnits: true,
        showValues: true,
        showConstants: true,
        showEnums: true,
        showEnumMembers: true,
        showKeywords: true,
        showWords: enableWordBasedSuggestions,
        showColors: true,
        showFiles: true,
        showReferences: true,
        showFolders: true,
        showTypeParameters: true,
        showSnippets: enableSnippetSuggestions,
        showUsers: true,
        showIssues: true,
      },
      parameterHints: {
        enabled: enableParameterHints,
        cycle: true,
      },
      hover: {
        enabled: enableHover,
        delay: 300,
        sticky: true,
      },
      lightbulb: {
        enabled: enableCodeActions,
      },
      codeActionsOnSave: {
        'source.organizeImports': true,
        'source.fixAll': true,
      },
      formatOnType: enableFormatOnType,
      formatOnPaste: enableFormatOnPaste,
      autoClosingBrackets: enableAutoClosingBrackets ? 'always' : 'never',
      autoClosingQuotes: enableAutoClosingQuotes ? 'always' : 'never',
      autoSurround: enableAutoSurround ? 'languageDefined' : 'never',
      linkedEditing: enableLinkedEditing,
      renameOnType: enableRenameOnType,
      smoothScrolling: enableSmoothScrolling,
      dragAndDrop: enableDragAndDrop,
      contextmenu: enableContextMenu,
      find: {
        seedSearchStringFromSelection: 'selection',
        autoFindInSelection: enableFindInSelection ? 'multiline' : 'never',
        addExtraSpaceOnTop: true,
        loop: true,
      },
      guides: {
        bracketPairs: enableBracketPairColorization,
        bracketPairsHorizontal: true,
        highlightActiveBracketPair: true,
        indentation: true,
        highlightActiveIndentation: enableHighlightActiveIndentGuide,
      },
      bracketPairColorization: {
        enabled: enableBracketPairColorization,
        independentColorPoolPerBracketType: true,
      },
      semanticHighlighting: {
        enabled: enableSemanticHighlighting,
      },
      inlayHints: {
        enabled: showInlayHints ? 'on' : 'off',
        fontSize: fontSize - 2,
        fontFamily: 'JetBrains Mono, Fira Code, SF Mono, Monaco, Inconsolata, Roboto Mono, source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace',
      },
      codeLens: enableCodeLens,
      overviewRulerBorder: enableOverviewRulerBorder,
      overviewRulerLanes: enableOverviewRulerLanes,
      rulers: enableRuler,
      scrollbar: enableScrollbar as any,
      scrollBeyondLastLine: true,
      scrollBeyondLastColumn: 5,
      smoothScrolling: enableSmoothScrolling,
      mouseWheelScrollSensitivity: 1,
      fastScrollSensitivity: 5,
      mouseWheelZoom: true,
      automaticLayout: true,
      wordBasedSuggestions: enableWordBasedSuggestions,
      wordBasedSuggestionsOnlySameLanguage: false,
      unicodeHighlight: {
        nonBasicASCII: 'inUntrustedWorkspace',
        invisibleCharacters: true,
        ambiguousCharacters: true,
      },
      stickyScroll: {
        enabled: true,
        maxLineCount: 5,
      },
      padding: {
        top: 16,
        bottom: 16,
      },
      fixedOverflowWidgets: true,
      links: true,
      colorDecorators: true,
      matchBrackets: 'always',
      selectionHighlight: true,
      occurrencesHighlight: true,
      codeLensProvider: true,
      definitionLinkOpensInPeek: false,
      gotoLocation: {
        multipleTypeDefinitions: 'peek',
        multipleDeclarations: 'peek',
        multipleImplementations: 'peek',
        multipleReferences: 'peek',
        alternativeDefinitionCommand: 'editor.action.goToReferences',
        alternativeTypeDefinitionCommand: 'editor.action.goToReferences',
        alternativeDeclarationCommand: 'editor.action.goToReferences',
        alternativeImplementationCommand: 'editor.action.goToReferences',
        alternativeReferenceCommand: 'editor.action.goToReferences',
      },
      peekWidgetDefaultFocus: 'editor',
      definitionLinkOpensInPeek: false,
      showUnused: true,
      showDeprecated: true,
    });

    monacoRef.current = editor;

    // Enhanced event listeners
    const disposables: monaco.IDisposable[] = [];

    // Value change listener
    disposables.push(
      editor.onDidChangeModelContent(() => {
        const newValue = editor.getValue();
        onValueChange?.(newValue);
        
        // Auto-save functionality
        if (autoSave) {
          const timeoutId = setTimeout(() => {
            onSave?.(newValue);
          }, 2000);
          
          return () => clearTimeout(timeoutId);
        }
      })
    );

    // Cursor position change listener
    disposables.push(
      editor.onDidChangeCursorPosition((e) => {
        const position = { line: e.position.lineNumber, column: e.position.column };
        onCursorPositionChange?.(position);
        setCursorPosition(position);
      })
    );

    // Selection change listener
    disposables.push(
      editor.onDidChangeCursorSelection((e) => {
        const selection = editor.getModel()?.getValueInRange(e.selection) || '';
        onSelectionChange?.(selection);
        setSelectedText(selection);
      })
    );

    // Language change listener
    disposables.push(
      editor.onDidChangeModelLanguage((e) => {
        const newLanguage = e.newLanguage;
        onLanguageChange?.(newLanguage);
        setLanguage(newLanguage);
      })
    );

    // Focus and blur listeners
    disposables.push(
      editor.onDidFocusEditorWidget(() => {
        window.dispatchEvent(new CustomEvent('nexus:editor-focus'));
      })
    );

    disposables.push(
      editor.onDidBlurEditorWidget(() => {
        window.dispatchEvent(new CustomEvent('nexus:editor-blur'));
      })
    );

    // AI-powered features
    disposables.push(
      editor.onDidChangeModelContent(async () => {
        if (!enableIntelliSense) return;
        
        const model = editor.getModel();
        if (!model) return;

        // Debounce AI suggestions
        const timeoutId = setTimeout(async () => {
          await getAISuggestions(model.getValue(), editor.getPosition());
        }, 1000);

        return () => clearTimeout(timeoutId);
      })
    );

    // Collaboration features
    disposables.push(
      editor.onDidChangeCursorPosition((e) => {
        // Broadcast cursor position to collaborators
        window.dispatchEvent(new CustomEvent('nexus:cursor-move', {
          detail: {
            position: { line: e.position.lineNumber, column: e.position.column },
            selection: editor.getSelection(),
          }
        }));
      })
    );

    // Enhanced diagnostics
    disposables.push(
      monaco.editor.onDidChangeMarkers((uris) => {
        const model = editor.getModel();
        if (!model || !uris.includes(model.uri)) return;

        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        const newDiagnostics: DiagnosticItem[] = markers.map((marker, index) => ({
          id: `diagnostic-${index}`,
          severity: {
            [monaco.MarkerSeverity.Error]: 'error' as const,
            [monaco.MarkerSeverity.Warning]: 'warning' as const,
            [monaco.MarkerSeverity.Info]: 'info' as const,
            [monaco.MarkerSeverity.Hint]: 'hint' as const,
          }[marker.severity],
          message: marker.message,
          source: marker.source || 'Monaco',
          range: {
            startLine: marker.startLineNumber,
            startColumn: marker.startColumn,
            endLine: marker.endLineNumber,
            endColumn: marker.endColumn,
          },
        }));

        setDiagnostics(newDiagnostics);
      })
    );

    return () => {
      disposables.forEach(d => d.dispose());
      editor.dispose();
    };
  }, [editorRef.current]);

  // Update editor options when props change
  useEffect(() => {
    if (!monacoRef.current) return;

    monacoRef.current.updateOptions({
      theme: theme || (actualTheme === 'dark' ? 'vs-dark' : 'vs'),
      readOnly,
      minimap: { enabled: showMinimap },
      wordWrap,
      fontSize,
      tabSize,
      insertSpaces,
      lineNumbers,
      folding,
      renderWhitespace,
      cursorBlinking,
      multiCursorModifier,
    });
  }, [theme, actualTheme, readOnly, showMinimap, wordWrap, fontSize, tabSize, insertSpaces, lineNumbers, folding, renderWhitespace, cursorBlinking, multiCursorModifier]);

  // Update editor value when prop changes
  useEffect(() => {
    if (!monacoRef.current) return;
    
    const currentValue = monacoRef.current.getValue();
    if (currentValue !== value) {
      monacoRef.current.setValue(value);
    }
  }, [value]);

  // Update editor language when prop changes
  useEffect(() => {
    if (!monacoRef.current) return;
    
    const model = monacoRef.current.getModel();
    if (model && model.getLanguageId() !== language) {
      monaco.editor.setModelLanguage(model, language);
    }
  }, [language]);

  // AI Suggestions functionality
  const getAISuggestions = useCallback(async (code: string, position: monaco.Position | null) => {
    if (!position || isAiThinking) return;

    setIsAiThinking(true);
    try {
      // Simulate AI API call
      const response = await sendMessage('ai-assistant', {
        action: 'get-suggestions',
        code,
        position: { line: position.lineNumber, column: position.column },
        language,
        model: currentModel,
      });

      if (response?.suggestions) {
        setAiSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
    } finally {
      setIsAiThinking(false);
    }
  }, [sendMessage, language, currentModel, isAiThinking]);

  // Apply AI suggestion
  const applyAISuggestion = useCallback((suggestion: AIAssistantSuggestion) => {
    if (!monacoRef.current || !suggestion.code) return;

    const editor = monacoRef.current;
    const model = editor.getModel();
    if (!model) return;

    if (suggestion.range) {
      // Replace specific range
      editor.executeEdits('ai-suggestion', [{
        range: suggestion.range,
        text: suggestion.code,
      }]);
    } else {
      // Insert at current position
      const position = editor.getPosition();
      if (position) {
        editor.executeEdits('ai-suggestion', [{
          range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
          text: suggestion.code,
        }]);
      }
    }

    // Remove applied suggestion
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const shortcuts = [
      {
        key: 'Ctrl+S',
        action: () => {
          if (monacoRef.current) {
            onSave?.(monacoRef.current.getValue());
          }
        },
        description: 'Save file',
      },
      {
        key: 'Ctrl+F',
        action: () => {
          monacoRef.current?.trigger('keyboard', 'actions.find', {});
          onFind?.();
        },
        description: 'Find',
      },
      {
        key: 'Ctrl+H',
        action: () => {
          monacoRef.current?.trigger('keyboard', 'editor.action.startFindReplaceAction', {});
          onReplace?.();
        },
        description: 'Find and Replace',
      },
      {
        key: 'Shift+Alt+F',
        action: () => {
          monacoRef.current?.trigger('keyboard', 'editor.action.formatDocument', {});
          onFormat?.();
        },
        description: 'Format Document',
      },
      {
        key: 'F11',
        action: () => setIsFullscreen(!isFullscreen),
        description: 'Toggle Fullscreen',
      },
      {
        key: 'Ctrl+Shift+P',
        action: () => monacoRef.current?.trigger('keyboard', 'editor.action.quickCommand', {}),
        description: 'Command Palette',
      },
      {
        key: 'Ctrl+Space',
        action: () => monacoRef.current?.trigger('keyboard', 'editor.action.triggerSuggest', {}),
        description: 'Trigger Suggest',
      },
      {
        key: 'Ctrl+Shift+I',
        action: () => setShowAiPanel(!showAiPanel),
        description: 'Toggle AI Assistant',
      },
      {
        key: 'Alt+M',
        action: () => setShowMinimap(!showMinimap),
        description: 'Toggle Minimap',
      },
    ];

    shortcuts.forEach(shortcut => {
      registerShortcut(shortcut.key, shortcut.action, shortcut.description);
    });

    return () => {
      shortcuts.forEach(shortcut => {
        unregisterShortcut(shortcut.key);
      });
    };
  }, [registerShortcut, unregisterShortcut, isFullscreen, showAiPanel, showMinimap, onSave, onFind, onReplace, onFormat]);

  // Render AI suggestions panel
  const renderAISuggestionsPanel = () => {
    if (!showAiPanel && aiSuggestions.length === 0) return null;

    return (
      <div className="absolute top-4 right-4 w-80 bg-background border border-border rounded-lg shadow-lg z-50">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center space-x-2">
            <Bot className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">AI Assistant</span>
            {isAiThinking && (
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </div>
          <button
            onClick={() => setShowAiPanel(false)}
            className="p-1 hover:bg-accent rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {aiSuggestions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No suggestions available</p>
              <p className="text-xs">Start typing to get AI assistance</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {aiSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-3 border border-border rounded-md hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => applyAISuggestion(suggestion)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {suggestion.type === 'completion' && <Code className="w-4 h-4 text-blue-500" />}
                      {suggestion.type === 'refactor' && <RotateCcw className="w-4 h-4 text-green-500" />}
                      {suggestion.type === 'fix' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      {suggestion.type === 'optimize' && <Zap className="w-4 h-4 text-yellow-500" />}
                      {suggestion.type === 'explain' && <Lightbulb className="w-4 h-4 text-purple-500" />}
                      <span className="text-sm font-medium">{suggestion.title}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-muted-foreground">{suggestion.model}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        suggestion.confidence > 0.8 ? 'bg-green-500' :
                        suggestion.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{suggestion.description}</p>
                  {suggestion.code && (
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      <code>{suggestion.code}</code>
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render collaboration cursors
  const renderCollaborationCursors = () => {
    return collaborationCursors.map((cursor) => (
      <div
        key={cursor.userId}
        className="absolute pointer-events-none z-40"
        style={{
          // Position would be calculated based on cursor.position
          // This is a simplified version
        }}
      >
        <div
          className="w-0.5 h-5 animate-pulse"
          style={{ backgroundColor: cursor.color }}
        ></div>
        <div
          className="text-xs px-1 py-0.5 rounded text-white whitespace-nowrap"
          style={{ backgroundColor: cursor.color }}
        >
          {cursor.userName}
        </div>
      </div>
    ));
  };

  // Render diagnostics panel
  const renderDiagnosticsPanel = () => {
    if (diagnostics.length === 0) return null;

    return (
      <div className="absolute bottom-4 left-4 right-4 bg-background border border-border rounded-lg shadow-lg z-40 max-h-48 overflow-y-auto">
        <div className="p-2 border-b border-border">
          <h3 className="text-sm font-medium">Problems ({diagnostics.length})</h3>
        </div>
        <div className="p-2 space-y-1">
          {diagnostics.map((diagnostic) => (
            <div
              key={diagnostic.id}
              className="flex items-start space-x-2 p-2 hover:bg-accent rounded cursor-pointer"
              onClick={() => {
                if (monacoRef.current) {
                  monacoRef.current.setPosition({
                    lineNumber: diagnostic.range.startLine,
                    column: diagnostic.range.startColumn,
                  });
                  monacoRef.current.focus();
                }
              }}
            >
              {diagnostic.severity === 'error' && <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />}
              {diagnostic.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />}
              {diagnostic.severity === 'info' && <Info className="w-4 h-4 text-blue-500 mt-0.5" />}
              {diagnostic.severity === 'hint' && <Lightbulb className="w-4 h-4 text-gray-500 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm">{diagnostic.message}</p>
                <p className="text-xs text-muted-foreground">
                  {diagnostic.source} - Line {diagnostic.range.startLine}, Column {diagnostic.range.startColumn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`relative h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''} ${className}`}>
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between h-8 px-2 bg-muted/30 border-b border-border">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-muted-foreground">
            {language.toUpperCase()}
          </span>
          <div className="w-px h-4 bg-border"></div>
          <button
            onClick={() => setShowMinimap(!showMinimap)}
            className={`p-1 rounded text-xs transition-colors ${
              showMinimap ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
            }`}
            title="Toggle Minimap"
          >
            <Eye className="w-3 h-3" />
          </button>
          <button
            onClick={() => setVimMode(!vimMode)}
            className={`p-1 rounded text-xs transition-colors ${
              vimMode ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
            }`}
            title="Toggle Vim Mode"
          >
            Vim
          </button>
          <button
            onClick={() => setAutoSave(!autoSave)}
            className={`p-1 rounded text-xs transition-colors ${
              autoSave ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
            }`}
            title="Toggle Auto Save"
          >
            <Save className="w-3 h-3" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className={`p-1 rounded transition-colors ${
              showAiPanel ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
            }`}
            title="Toggle AI Assistant"
          >
            <Bot className="w-3 h-3" />
          </button>
          <button
            onClick={() => monacoRef.current?.trigger('keyboard', 'actions.find', {})}
            className="p-1 hover:bg-accent rounded transition-colors"
            title="Find (Ctrl+F)"
          >
            <Search className="w-3 h-3" />
          </button>
          <button
            onClick={() => monacoRef.current?.trigger('keyboard', 'editor.action.startFindReplaceAction', {})}
            className="p-1 hover:bg-accent rounded transition-colors"
            title="Replace (Ctrl+H)"
          >
            <Replace className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:bg-accent rounded transition-colors"
            title="Toggle Fullscreen (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div ref={editorRef} className="h-full" />

      {/* AI Suggestions Panel */}
      {renderAISuggestionsPanel()}

      {/* Collaboration Cursors */}
      {renderCollaborationCursors()}

      {/* Diagnostics Panel */}
      {renderDiagnosticsPanel()}

      {/* Status Indicators */}
      <div className="absolute top-2 left-2 flex items-center space-x-2 pointer-events-none">
        {isAiThinking && (
          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-600">
            <Bot className="w-3 h-3 animate-pulse" />
            <span>AI thinking...</span>
          </div>
        )}
        {collaborationCursors.length > 0 && (
          <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-600">
            <Users className="w-3 h-3" />
            <span>{collaborationCursors.length} online</span>
          </div>
        )}
        {autoSave && (
          <div className="flex items-center space-x-1 px-2 py-1 bg-gray-500/10 border border-gray-500/20 rounded text-xs text-gray-600">
            <Save className="w-3 h-3" />
            <span>Auto-save</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonacoEditor;

// Monaco Editor utilities and hooks
export const useMonacoEditor = () => {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [model, setModel] = useState<monaco.editor.ITextModel | null>(null);

  const createEditor = useCallback((container: HTMLElement, options: monaco.editor.IStandaloneEditorConstructionOptions) => {
    const newEditor = monaco.editor.create(container, options);
    setEditor(newEditor);
    setModel(newEditor.getModel());
    return newEditor;
  }, []);

  const disposeEditor = useCallback(() => {
    if (editor) {
      editor.dispose();
      setEditor(null);
      setModel(null);
    }
  }, [editor]);

  const updateValue = useCallback((value: string) => {
    if (editor && editor.getValue() !== value) {
      editor.setValue(value);
    }
  }, [editor]);

  const updateLanguage = useCallback((language: string) => {
    if (model && model.getLanguageId() !== language) {
      monaco.editor.setModelLanguage(model, language);
    }
  }, [model]);

  const formatDocument = useCallback(() => {
    if (editor) {
      editor.trigger('keyboard', 'editor.action.formatDocument', {});
    }
  }, [editor]);

  const gotoLine = useCallback((line: number, column: number = 1) => {
    if (editor) {
      editor.setPosition({ lineNumber: line, column });
      editor.revealLineInCenter(line);
      editor.focus();
    }
  }, [editor]);

  const insertText = useCallback((text: string, position?: monaco.Position) => {
    if (editor) {
      const pos = position || editor.getPosition();
      if (pos) {
        editor.executeEdits('insert-text', [{
          range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
          text,
        }]);
      }
    }
  }, [editor]);

  const replaceText = useCallback((range: monaco.Range, text: string) => {
    if (editor) {
      editor.executeEdits('replace-text', [{ range, text }]);
    }
  }, [editor]);

  return {
    editor,
    model,
    createEditor,
    disposeEditor,
    updateValue,
    updateLanguage,
    formatDocument,
    gotoLine,
    insertText,
    replaceText,
  };
};

// Monaco Editor configuration
export const monacoConfig = {
  defaultOptions: {
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Fira Code, SF Mono, Monaco, Inconsolata, Roboto Mono, source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace',
    lineHeight: 1.6,
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on' as const,
    minimap: { enabled: true },
    lineNumbers: 'on' as const,
    folding: true,
    renderWhitespace: 'selection' as const,
    cursorBlinking: 'blink' as const,
    multiCursorModifier: 'ctrlCmd' as const,
  },
  themes: {
    light: 'vs',
    dark: 'vs-dark',
  },
  languages: [
    'typescript', 'javascript', 'python', 'java', 'csharp', 'cpp', 'c',
    'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'clojure',
    'html', 'css', 'scss', 'less', 'json', 'xml', 'yaml', 'toml',
    'markdown', 'sql', 'shell', 'dockerfile', 'makefile', 'cmake',
    'graphql', 'protobuf', 'thrift', 'avro', 'terraform', 'hcl',
  ],
};

// Export Monaco Editor component with display name
MonacoEditor.displayName = 'MonacoEditor';

export { MonacoEditor };