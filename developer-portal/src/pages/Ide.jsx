import React, { useState, useRef, useCallback } from 'react';

// Lightweight in-file Terminal emulator (mock)
function TerminalEmulator({ onRunHook }) {
  const [lines, setLines] = useState([
    'NEXUS Terminal — type `help` to see available commands.'
  ]);
  const [input, setInput] = useState('');
  const viewRef = useRef(null);

  const append = useCallback((text) => {
    setLines((prev) => [...prev, text]);
    setTimeout(() => {
      if (viewRef.current) {
        viewRef.current.scrollTop = viewRef.current.scrollHeight;
      }
    }, 0);
  }, []);

  const runCommand = useCallback((raw) => {
    const cmd = raw.trim();
    if (!cmd) return;
    append(`$ ${cmd}`);

    const [base, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(' ');

    switch (base) {
      case 'help':
        append('Available: help, clear, echo <msg>, time, build, test, ls, cat <name>');
        break;
      case 'clear':
        setLines([]);
        break;
      case 'echo':
        append(arg || '');
        break;
      case 'time':
        append(new Date().toString());
        break;
      case 'build':
        append('Building project...');
        setTimeout(() => append('✔ Build successful (mock).'), 600);
        break;
      case 'test':
        append('Running tests...');
        setTimeout(() => append('✔ All tests passed (mock).'), 800);
        break;
      case 'ls':
        append('src  public  package.json  README.md');
        break;
      case 'cat':
        append(arg ? `(mock) contents of ${arg}` : 'cat: missing filename');
        break;
      default:
        append(`${base}: command not found`);
    }
  }, [append]);

  // Allow parent to programmatically run commands (e.g., toolbar Run)
  React.useEffect(() => {
    if (typeof onRunHook === 'function') {
      onRunHook({ runCommand });
    }
  }, [onRunHook, runCommand]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    runCommand(input);
    setInput('');
  };

  return (
    <div className="h-full flex flex-col">
      <div ref={viewRef} className="flex-1 rounded border border-dashed border-gray-200 p-2 text-xs font-mono text-gray-800 overflow-auto bg-white">
        {lines.map((l, i) => (
          <div key={i} className="whitespace-pre-wrap">{l}</div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="mt-2 flex gap-2">
        <span className="px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded">$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Type a command... (help, build, test)"
        />
        <button type="submit" className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold">Run</button>
      </form>
    </div>
  );
}

const ToolbarButton = ({ children, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium transition ${className}`}
  >
    {children}
  </button>
);

const Ide = () => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { role: 'system', content: 'Welcome to NEXUS IDE Copilot. Ask me to generate code, explain errors, or run tasks.' },
  ]);

  // Editor state
  const [currentFile, setCurrentFile] = useState('untitled.js');
  const [editorValue, setEditorValue] = useState(() => {
    const saved = localStorage.getItem('nexus.ide.editor.current');
    return saved ?? '// Start coding in NEXUS IDE\n\nfunction greet(name){\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("NEXUS"));\n';
  });
  const [isDirty, setIsDirty] = useState(false);
  // LocalStorage-backed files list
  const [myFiles, setMyFiles] = useState(() => Object.keys(JSON.parse(localStorage.getItem('nexus.ide.files') || '{}')));

  // Terminal ref hook
  const terminalRef = useRef({ runCommand: () => {} });
  const registerTerminal = useCallback((api) => {
    terminalRef.current = api;
  }, []);

  const refreshMyFiles = useCallback(() => {
    try {
      const map = JSON.parse(localStorage.getItem('nexus.ide.files') || '{}');
      setMyFiles(Object.keys(map));
    } catch {
      setMyFiles([]);
    }
  }, []);

  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'nexus.ide.files') {
        refreshMyFiles();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshMyFiles]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: prompt.trim() }]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'This is a mock response. In production, this would connect to the AI Copilot service via MCP.',
        },
      ]);
    }, 300);
    setPrompt('');
  };

  // Toolbar handlers
  const onNewFile = () => {
    const name = window.prompt('New file name?', 'untitled.js');
    if (!name) return;
    setCurrentFile(name);
    setEditorValue('');
    setIsDirty(false);
  };

  const onOpenQuick = (name, sample) => {
    setCurrentFile(name);
    const savedMapJson = localStorage.getItem('nexus.ide.files') || '{}';
    const savedMap = JSON.parse(savedMapJson);
    setEditorValue(savedMap[name] ?? sample);
    setIsDirty(false);
  };

  const onOpenMyFile = (name) => {
    const map = JSON.parse(localStorage.getItem('nexus.ide.files') || '{}');
    if (map[name] != null) {
      setCurrentFile(name);
      setEditorValue(map[name]);
      setIsDirty(false);
    }
  };

  const onDeleteMyFile = (name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    const key = 'nexus.ide.files';
    const map = JSON.parse(localStorage.getItem(key) || '{}');
    delete map[name];
    localStorage.setItem(key, JSON.stringify(map));
    refreshMyFiles();
    if (currentFile === name) {
      setCurrentFile('untitled.js');
      setEditorValue('');
      setIsDirty(false);
    }
  };

  const onSave = () => {
    const key = 'nexus.ide.files';
    const map = JSON.parse(localStorage.getItem(key) || '{}');
    map[currentFile] = editorValue;
    localStorage.setItem(key, JSON.stringify(map));
    localStorage.setItem('nexus.ide.editor.current', editorValue);
    setIsDirty(false);
    refreshMyFiles();
  };

  const onFormat = () => {
    // naive format: trim trailing spaces and ensure newline at EOF
    const formatted = editorValue
      .split('\n')
      .map((l) => l.replace(/\s+$/g, ''))
      .join('\n') + (editorValue.endsWith('\n') ? '' : '\n');
    setEditorValue(formatted);
    setIsDirty(true);
  };

  const onRun = () => {
    terminalRef.current?.runCommand?.('build');
  };

  // Sample file contents for quick open in explorer
  const samples = {
    'src/main.tsx': `import React from 'react'\nimport ReactDOM from 'react-dom/client'\n\nReactDOM.createRoot(document.getElementById('root')).render(<div>Hello</div>)\n`,
    'src/App.tsx': `export function App(){\n  return <h1>NEXUS IDE</h1>\n}\n`,
    'package.json': `{"name":"nexus-ide","private":true}`,
    'README.md': `# NEXUS IDE\nNext-Generation IDE powered by AI.`,
  };

  return (
    <div className="space-y-4">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <ToolbarButton onClick={onNewFile}>New File</ToolbarButton>
        <ToolbarButton onClick={() => onOpenQuick('src/App.tsx', samples['src/App.tsx'])}>Open</ToolbarButton>
        <ToolbarButton onClick={onRun} className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700">Run</ToolbarButton>
        <ToolbarButton onClick={onSave}>Save</ToolbarButton>
        <ToolbarButton onClick={onFormat}>Format</ToolbarButton>
        <div className="ml-auto text-sm text-gray-500">NEXUS IDE · Alpha</div>
      </div>

      {/* Main workspace grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* File Explorer */}
        <aside className="col-span-12 md:col-span-2 bg-white rounded shadow p-3">
          <div className="font-semibold mb-2">File Explorer</div>
          <ul className="space-y-1 text-sm text-gray-700">
            {Object.keys(samples).map((path) => (
              <li
                key={path}
                className="hover:bg-gray-50 px-2 py-1 rounded cursor-pointer flex items-center justify-between"
                onClick={() => onOpenQuick(path, samples[path])}
                title={`Open ${path}`}
              >
                <span className="truncate">{path}</span>
                <span className="text-[10px] text-gray-400 ml-2">⇧⏎</span>
              </li>
            ))}
            <li className="hover:bg-gray-50 px-2 py-1 rounded cursor-pointer" onClick={() => onOpenQuick('package.json', samples['package.json'])}>package.json</li>
            <li className="hover:bg-gray-50 px-2 py-1 rounded cursor-pointer" onClick={() => onOpenQuick('README.md', samples['README.md'])}>README.md</li>
          </ul>
          <div className="border-t mt-3 pt-3">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Your Files</div>
            {myFiles.length === 0 ? (
              <div className="text-xs text-gray-400">No files saved yet. Use Save in the editor or from Copilot.</div>
            ) : (
              <ul className="space-y-1 text-sm text-gray-700">
                {myFiles.map((name) => (
                  <li key={name} className="group hover:bg-gray-50 px-2 py-1 rounded cursor-pointer flex items-center justify-between" onClick={() => onOpenMyFile(name)} title={`Open ${name}`}>
                    <span className="truncate">{name}</span>
                    <button
                      className="opacity-70 group-hover:opacity-100 text-[10px] text-red-500 hover:text-red-600"
                      onClick={(e) => { e.stopPropagation(); onDeleteMyFile(name); }}
                      aria-label={`Delete ${name}`}
                    >✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Editor + Terminal */}
        <section className="col-span-12 md:col-span-7 space-y-4">
          <div className="bg-white h-[46vh] md:h-[48vh] rounded shadow p-3 flex flex-col">
            <div className="text-sm text-gray-500 mb-2 flex items-center justify-between">
              <div className="truncate">
                <span className="font-mono text-gray-700">{currentFile}</span>
                {isDirty && <span className="ml-2 text-amber-600">• unsaved</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onSave} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Save</button>
                <button onClick={onFormat} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Format</button>
              </div>
            </div>
            <textarea
              value={editorValue}
              onChange={(e) => { setEditorValue(e.target.value); setIsDirty(true); }}
              className="flex-1 rounded border border-dashed border-gray-200 p-3 text-sm font-mono text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
              spellCheck={false}
            />
          </div>
          <div className="bg-white h-[22vh] md:h-[24vh] rounded shadow p-3">
            <div className="text-sm text-gray-500 mb-2">Terminal</div>
            <TerminalEmulator onRunHook={registerTerminal} />
          </div>
        </section>

        {/* AI Copilot */}
        <aside className="col-span-12 md:col-span-3 bg-white rounded shadow p-3 flex flex-col min-h-[70vh]">
          <div className="font-semibold mb-2">AI Copilot</div>
          <div className="flex-1 overflow-auto space-y-3 pr-1">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.role === 'assistant'
                    ? 'bg-indigo-50 text-indigo-900 p-2 rounded'
                    : m.role === 'system'
                    ? 'bg-gray-50 text-gray-700 p-2 rounded'
                    : 'bg-white border p-2 rounded'
                }
              >
                <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">{m.role}</div>
                <div className="text-sm whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="mt-3 flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ask the Copilot... (e.g., Create a React component for sidebar)"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
            >
              Send
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
};

export default Ide;