import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as monaco from '@monaco-editor/react';
import { debounce } from 'lodash';

interface AdvancedCodeEditorProps {
  value?: string;
  language?: string;
  theme?: 'vs-dark' | 'vs-light' | 'hc-black' | 'nexus-dark';
  onChange?: (value: string) => void;
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  className?: string;
  aiEnabled?: boolean;
  collaborativeMode?: boolean;
  projectContext?: any;
  onAICompletion?: (suggestion: string) => void;
  onCodeAnalysis?: (analysis: any) => void;
}

interface AICompletionProvider {
  provideCompletionItems: (model: monaco.editor.ITextModel, position: monaco.Position) => Promise<monaco.languages.CompletionList>;
}

interface CodeAnalysis {
  errors: Array<{
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  suggestions: Array<{
    line: number;
    message: string;
    fix?: string;
  }>;
  complexity: {
    score: number;
    level: 'low' | 'medium' | 'high';
  };
  performance: Array<{
    line: number;
    issue: string;
    impact: 'low' | 'medium' | 'high';
  }>;
}

const AdvancedCodeEditor: React.FC<AdvancedCodeEditorProps> = ({
  value = '',
  language = 'javascript',
  theme = 'nexus-dark',
  onChange,
  onMount,
  options = {},
  className = '',
  aiEnabled = true,
  collaborativeMode = false,
  projectContext,
  onAICompletion,
  onCodeAnalysis
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [collaborators, setCollaborators] = useState<Array<{ id: string; name: string; cursor: monaco.Position }>>([]);

  // AI-powered code completion provider
  const createAICompletionProvider = useCallback((): AICompletionProvider => {
    return {
      async provideCompletionItems(model, position) {
        if (!aiEnabled) {
          return { suggestions: [] };
        }

        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        // Simulate AI completion (in real implementation, this would call AI service)
        const aiSuggestions = await generateAICompletions(textUntilPosition, language, projectContext);
        
        return {
          suggestions: aiSuggestions.map((suggestion, index) => ({
            label: suggestion.label,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: suggestion.insertText,
            detail: suggestion.detail,
            documentation: suggestion.documentation,
            sortText: `0${index}`, // Higher priority for AI suggestions
            preselect: index === 0
          }))
        };
      }
    };
  }, [aiEnabled, language, projectContext]);

  // Real-time code analysis
  const analyzeCode = useCallback(debounce(async (code: string) => {
    if (!aiEnabled || !code.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const analysis = await performCodeAnalysis(code, language, projectContext);
      
      if (onCodeAnalysis) {
        onCodeAnalysis(analysis);
      }
      
      // Update editor markers for errors and warnings
      if (editorInstanceRef.current) {
        const model = editorInstanceRef.current.getModel();
        if (model) {
          const markers = analysis.errors.map(error => ({
            startLineNumber: error.line,
            startColumn: error.column,
            endLineNumber: error.line,
            endColumn: error.column + 10,
            message: error.message,
            severity: error.severity === 'error' ? monaco.MarkerSeverity.Error : 
                     error.severity === 'warning' ? monaco.MarkerSeverity.Warning : 
                     monaco.MarkerSeverity.Info
          }));
          
          monaco.editor.setModelMarkers(model, 'ai-analysis', markers);
        }
      }
    } catch (error) {
      console.error('Code analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, 1000), [aiEnabled, language, projectContext, onCodeAnalysis]);

  // Natural language programming support
  const processNaturalLanguageCommand = useCallback(async (command: string) => {
    if (!aiEnabled) return;
    
    try {
      const generatedCode = await generateCodeFromNaturalLanguage(command, language, projectContext);
      
      if (editorInstanceRef.current && generatedCode) {
        const position = editorInstanceRef.current.getPosition();
        if (position) {
          editorInstanceRef.current.executeEdits('natural-language', [{
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            text: generatedCode
          }]);
        }
        
        if (onAICompletion) {
          onAICompletion(generatedCode);
        }
      }
    } catch (error) {
      console.error('Natural language processing failed:', error);
    }
  }, [aiEnabled, language, projectContext, onAICompletion]);

  // Setup collaborative cursors
  const setupCollaborativeCursors = useCallback(() => {
    if (!collaborativeMode || !editorInstanceRef.current) return;
    
    // Simulate collaborative cursors (in real implementation, this would use WebSocket)
    collaborators.forEach(collaborator => {
      const decoration = {
        range: new monaco.Range(
          collaborator.cursor.lineNumber,
          collaborator.cursor.column,
          collaborator.cursor.lineNumber,
          collaborator.cursor.column + 1
        ),
        options: {
          className: `collaborator-cursor-${collaborator.id}`,
          hoverMessage: { value: `${collaborator.name} is here` }
        }
      };
      
      editorInstanceRef.current?.deltaDecorations([], [decoration]);
    });
  }, [collaborativeMode, collaborators]);

  useEffect(() => {
    if (!editorRef.current) return;

    // Define advanced themes
    monaco.editor.defineTheme('nexus-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0', fontStyle: 'bold' },
        { token: 'function', foreground: 'DCDCAA', fontStyle: 'bold' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'constant', foreground: '4FC1FF', fontStyle: 'bold' },
        { token: 'class', foreground: '4EC9B0', fontStyle: 'bold' },
        { token: 'interface', foreground: 'B8D7A3', fontStyle: 'italic' },
        { token: 'namespace', foreground: 'C586C0' },
        { token: 'parameter', foreground: '9CDCFE', fontStyle: 'italic' },
        { token: 'property', foreground: '9CDCFE' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'delimiter', foreground: 'D4D4D4' },
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#e2e8f0',
        'editor.lineHighlightBackground': '#1e293b',
        'editor.selectionBackground': '#3b82f6',
        'editor.inactiveSelectionBackground': '#1e40af',
        'editorCursor.foreground': '#3b82f6',
        'editorLineNumber.foreground': '#64748b',
        'editorLineNumber.activeForeground': '#e2e8f0',
        'editor.selectionHighlightBackground': '#1e40af',
        'editor.wordHighlightBackground': '#1e40af',
        'editor.findMatchBackground': '#f59e0b',
        'editor.findMatchHighlightBackground': '#f59e0b',
        'editorWidget.background': '#1e293b',
        'editorWidget.border': '#475569',
        'editorSuggestWidget.background': '#1e293b',
        'editorSuggestWidget.border': '#475569',
        'editorSuggestWidget.selectedBackground': '#3b82f6',
        'editorError.foreground': '#ef4444',
        'editorWarning.foreground': '#f59e0b',
        'editorInfo.foreground': '#3b82f6',
      }
    });

    // Create advanced editor instance
    const editor = monaco.editor.create(editorRef.current, {
      value,
      language,
      theme: theme,
      automaticLayout: true,
      minimap: { 
        enabled: true,
        showSlider: 'always',
        renderCharacters: true,
        maxColumn: 120
      },
      scrollBeyondLastLine: false,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Fira Code, Monaco, Cascadia Code, Roboto Mono, monospace',
      fontLigatures: true,
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      wordWrap: 'on',
      tabSize: 2,
      insertSpaces: true,
      folding: true,
      foldingStrategy: 'auto',
      showFoldingControls: 'always',
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
        bracketPairsHorizontal: true
      },
      suggest: {
        showKeywords: true,
        showSnippets: true,
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
        showColors: true,
        showFiles: true,
        showReferences: true,
        showFolders: true,
        showTypeParameters: true,
        showUsers: true,
        showIssues: true,
        filterGraceful: true,
        snippetsPreventQuickSuggestions: false
      },
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      parameterHints: { 
        enabled: true,
        cycle: true
      },
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: 'on',
      accessibilitySupport: 'auto',
      multiCursorModifier: 'ctrlCmd',
      multiCursorMergeOverlapping: true,
      wordBasedSuggestions: true,
      wordBasedSuggestionsOnlySameLanguage: false,
      semanticHighlighting: { enabled: true },
      occurrencesHighlight: true,
      codeLens: true,
      colorDecorators: true,
      lightbulb: { enabled: true },
      linkedEditing: true,
      ...options
    });

    editorInstanceRef.current = editor;

    // Register AI completion provider
    if (aiEnabled) {
      const completionProvider = createAICompletionProvider();
      monaco.languages.registerCompletionItemProvider(language, completionProvider);
    }

    // Handle value changes and trigger analysis
    const disposable = editor.onDidChangeModelContent(() => {
      const currentValue = editor.getValue();
      if (onChange && currentValue !== value) {
        onChange(currentValue);
      }
      
      // Trigger AI analysis
      analyzeCode(currentValue);
    });

    // Handle cursor position changes for collaboration
    const cursorDisposable = editor.onDidChangeCursorPosition((e) => {
      if (collaborativeMode) {
        // Emit cursor position to other collaborators
        // In real implementation, this would use WebSocket
        console.log('Cursor moved to:', e.position);
      }
    });

    // Add command for natural language programming
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, () => {
      const selection = editor.getSelection();
      if (selection) {
        const selectedText = editor.getModel()?.getValueInRange(selection);
        if (selectedText) {
          processNaturalLanguageCommand(selectedText);
        }
      }
    });

    // Setup collaborative features
    setupCollaborativeCursors();

    // Call onMount callback
    if (onMount) {
      onMount(editor);
    }

    // Cleanup function
    return () => {
      disposable.dispose();
      cursorDisposable.dispose();
      editor.dispose();
    };
  }, []);

  // Update editor value when prop changes
  useEffect(() => {
    if (editorInstanceRef.current && editorInstanceRef.current.getValue() !== value) {
      editorInstanceRef.current.setValue(value);
    }
  }, [value]);

  // Update editor language when prop changes
  useEffect(() => {
    if (editorInstanceRef.current) {
      const model = editorInstanceRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
      }
    }
  }, [language]);

  // Update editor theme when prop changes
  useEffect(() => {
    if (editorInstanceRef.current) {
      monaco.editor.setTheme(theme);
    }
  }, [theme]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div 
        ref={editorRef} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      
      {/* AI Analysis Indicator */}
      {isAnalyzing && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
          🤖 AI Analyzing...
        </div>
      )}
      
      {/* Collaborative Indicators */}
      {collaborativeMode && collaborators.length > 0 && (
        <div className="absolute top-2 left-2 flex space-x-1">
          {collaborators.map(collaborator => (
            <div 
              key={collaborator.id}
              className="bg-green-500 text-white px-2 py-1 rounded text-xs"
              title={`${collaborator.name} is editing`}
            >
              👤 {collaborator.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// AI Helper Functions (Mock implementations)
async function generateAICompletions(context: string, language: string, projectContext: any) {
  // Mock AI completion suggestions
  return [
    {
      label: 'smartFunction',
      insertText: 'function smartFunction(${1:param}) {\n\t${2:// AI-generated code}\n\treturn ${3:result};\n}',
      detail: 'AI-generated function',
      documentation: 'This function was generated by AI based on your context'
    },
    {
      label: 'asyncHandler',
      insertText: 'async function ${1:handlerName}(${2:params}) {\n\ttry {\n\t\t${3:// Your async code here}\n\t} catch (error) {\n\t\tconsole.error(error);\n\t}\n}',
      detail: 'AI-generated async handler',
      documentation: 'Async function with error handling'
    }
  ];
}

async function performCodeAnalysis(code: string, language: string, projectContext: any): Promise<CodeAnalysis> {
  // Mock code analysis
  return {
    errors: [],
    suggestions: [
      {
        line: 1,
        message: 'Consider using const instead of let for immutable variables',
        fix: 'const'
      }
    ],
    complexity: {
      score: 3,
      level: 'low'
    },
    performance: []
  };
}

async function generateCodeFromNaturalLanguage(command: string, language: string, projectContext: any): Promise<string> {
  // Mock natural language to code conversion
  if (command.toLowerCase().includes('create function')) {
    return `function generatedFunction() {\n  // Generated from: "${command}"\n  return true;\n}`;
  }
  return `// Generated from: "${command}"`;
}

export default AdvancedCodeEditor;
export type { AdvancedCodeEditorProps, CodeAnalysis };