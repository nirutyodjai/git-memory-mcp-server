import React, { useRef, useState } from 'react';

export default function TerminalPage() {
  const [lines, setLines] = useState([
    'NEXUS Integrated Terminal — type "help" to see available commands',
  ]);
  const [cmd, setCmd] = useState('');
  const endRef = useRef(null);

  const run = (input) => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const out = [];
    switch (trimmed) {
      case 'help':
        out.push('Available: help, date, clear, echo <text>');
        break;
      case 'date':
        out.push(new Date().toString());
        break;
      case 'clear':
        setLines([]);
        return;
      default:
        if (trimmed.startsWith('echo ')) out.push(trimmed.slice(5));
        else out.push(`Command not found: ${trimmed}`);
    }
    setLines((prev) => [...prev, `$ ${trimmed}`, ...out]);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    run(cmd);
    setCmd('');
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Terminal</h1>
      <div className="bg-black text-green-300 rounded p-3 font-mono text-sm h-[60vh] overflow-auto border border-gray-800">
        {lines.map((l, i) => (
          <div key={i} className="whitespace-pre-wrap">{l}</div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input value={cmd} onChange={(e)=>setCmd(e.target.value)} className="flex-1 border rounded px-3 py-2" placeholder="Type a command..." />
        <button className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold" type="submit">Run</button>
      </form>
    </div>
  );
}