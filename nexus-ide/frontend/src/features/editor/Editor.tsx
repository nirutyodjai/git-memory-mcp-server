import React, { useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';

interface EditorProps {
  language?: string;
}

const Editor: React.FC<EditorProps> = ({ language = 'javascript' }) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    const doc = new Y.Doc();
    // Connect to the Yjs websocket server
    const provider = new WebsocketProvider(
      'ws://localhost:1234',
      'monaco-room', // A room name for this document
      doc
    );
    const ytext = doc.getText('monaco');

    // Bind the Monaco editor to the Yjs text type
    new MonacoBinding(
      ytext,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );
  };

  return (
    <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden">
      <MonacoEditor
        height="100%"
        language={language}
        theme="vs-dark"
        // value and onChange are now controlled by Yjs
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
        }}
      />
    </div>
  );
};

export default Editor;