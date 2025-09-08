import React, { useRef, useEffect } from 'react';
import * as monaco from '@monaco-editor/react';

interface CodeEditorProps {
  value?: string;
  language?: string;
  theme?: 'vs-dark' | 'vs-light' | 'hc-black';
  onChange?: (value: string) => void;
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value = '',
  language = 'javascript',
  theme = 'vs-dark',
  onChange,
  onMount,
  options = {},
  className = ''
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Configure Monaco Editor
    monaco.editor.defineTheme('nexus-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
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
      }
    });

    // Create editor instance
    const editor = monaco.editor.create(editorRef.current, {
      value,
      language,
      theme: theme === 'vs-dark' ? 'nexus-dark' : theme,
      automaticLayout: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Fira Code, Monaco, Cascadia Code, Roboto Mono, monospace',
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      wordWrap: 'on',
      tabSize: 2,
      insertSpaces: true,
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'always',
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true
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
        showIssues: true
      },
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      parameterHints: { enabled: true },
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: 'on',
      accessibilitySupport: 'auto',
      ...options
    });

    editorInstanceRef.current = editor;

    // Handle value changes
    const disposable = editor.onDidChangeModelContent(() => {
      const currentValue = editor.getValue();
      if (onChange && currentValue !== value) {
        onChange(currentValue);
      }
    });

    // Call onMount callback
    if (onMount) {
      onMount(editor);
    }

    // Cleanup function
    return () => {
      disposable.dispose();
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
      monaco.editor.setTheme(theme === 'vs-dark' ? 'nexus-dark' : theme);
    }
  }, [theme]);

  return (
    <div 
      ref={editorRef} 
      className={`w-full h-full ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
};

export default CodeEditor;