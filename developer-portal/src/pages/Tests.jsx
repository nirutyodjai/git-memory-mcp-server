import React, { useMemo, useState } from 'react';

export default function Tests() {
  const [code, setCode] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [tests, setTests] = useState([
    { name: 'Sample utility should return correct value', status: 'pending' },
    { name: 'API client handles errors gracefully', status: 'pending' },
    { name: 'UI component renders props properly', status: 'pending' },
  ]);
  const [status, setStatus] = useState('idle');

  const loadFromIDE = () => {
    const map = JSON.parse(localStorage.getItem('nexus.ide.files') || '{}');
    const names = Object.keys(map);
    if (names.length === 0) {
      alert('No files found in IDE storage. Use IDE or AI Copilot to create one.');
      return;
    }
    const name = window.prompt('Open which file from IDE?', names[0]);
    if (!name) return;
    if (!(name in map)) {
      alert('File not found in IDE storage.');
      return;
    }
    setSelectedFile(name);
    setCode(map[name]);
  };

  const analyzeFunctions = (content) => {
    const names = new Set();
    const fnDecl = content.matchAll(/function\s+([a-zA-Z0-9_]+)/g);
    for (const m of fnDecl) names.add(m[1]);
    const arrowFn = content.matchAll(/const\s+([a-zA-Z0-9_]+)\s*=\s*\(/g);
    for (const m of arrowFn) names.add(m[1]);
    const exports = content.matchAll(/export\s+(?:default\s+)?function\s+([a-zA-Z0-9_]+)/g);
    for (const m of exports) names.add(m[1]);
    return Array.from(names);
  };

  const generateTests = () => {
    const fns = analyzeFunctions(code);
    if (fns.length === 0) {
      setTests([
        { name: 'Formatting should remain stable', status: 'pending' },
        { name: 'Static analysis found no critical issues', status: 'pending' },
      ]);
      return;
    }
    const next = fns.map((n) => ({ name: `${n}() should behave as expected`, status: 'pending' }));
    setTests(next);
  };

  const run = async () => {
    if (tests.length === 0) return;
    setStatus('running');
    // Simulate execution
    const next = [];
    for (let i = 0; i < tests.length; i++) {
      // Basic heuristics: if code contains TODO or throw in context of name, mark as fail
      const t = tests[i];
      // naive fail condition
      const failHeuristic = /TODO|FIXME|throw\s+new\s+Error/.test(code);
      next.push({ ...t, status: failHeuristic && i % 3 === 0 ? 'fail' : 'pass' });
    }
    await new Promise((r) => setTimeout(r, 800));
    setTests(next);
    setStatus('done');
  };

  const clearAll = () => {
    setTests([]);
    setCode('');
    setSelectedFile('');
    setStatus('idle');
  };

  const summary = useMemo(() => {
    const total = tests.length;
    const pass = tests.filter((t) => t.status === 'pass').length;
    const fail = tests.filter((t) => t.status === 'fail').length;
    const pending = total - pass - fail;
    return { total, pass, fail, pending };
  }, [tests]);

  const saveTestSkeletonToIDE = () => {
    const map = JSON.parse(localStorage.getItem('nexus.ide.files') || '{}');
    const base = selectedFile || 'src/module.ts';
    const testName = base.replace(/(\.[^/.]+)?$/, '.test$1');
    const skeleton = `// Auto-generated mock tests for ${base}\n// NOTE: Replace with real tests (Vitest/Jest)\n\n// pseudo-tests\nconst tests = ${JSON.stringify(
      tests.map((t) => ({ name: t.name, expect: t.status }))
    , null, 2)};\nconsole.log('Run tests:', tests.length);`;
    map[testName] = skeleton;
    localStorage.setItem('nexus.ide.files', JSON.stringify(map));
    localStorage.setItem('nexus.ide.editor.current', skeleton);
    alert('Saved test skeleton to IDE: ' + testName);
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <section className="col-span-12 lg:col-span-7">
        <div className="mb-2 flex flex-wrap gap-2">
          <button onClick={loadFromIDE} className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm">Load from IDE</button>
          <button onClick={generateTests} className="px-2 py-1 rounded bg-blue-200 hover:bg-blue-300 text-sm">Generate Tests</button>
          <button onClick={run} disabled={status==='running'} className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm">Run Tests</button>
          <button onClick={saveTestSkeletonToIDE} className="px-2 py-1 rounded bg-gray-900 text-white text-sm">Save Test Skeleton to IDE</button>
          <button onClick={clearAll} className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm">Clear</button>
        </div>
        <div className="text-xs text-gray-600 mb-2">{selectedFile ? `Loaded: ${selectedFile}` : 'No file loaded from IDE yet.'}</div>
        <textarea value={code} onChange={(e)=>setCode(e.target.value)} placeholder="Paste or load code to generate tests..." className="w-full min-h-[240px] border rounded p-3 font-mono text-sm" />
      </section>
      <aside className="col-span-12 lg:col-span-5">
        <div className="bg-white rounded shadow p-4 min-h-[320px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Test Results</h3>
            <span className="text-xs text-gray-600">{status === 'running' ? 'Running...' : status === 'done' ? 'Done' : 'Idle'}</span>
          </div>
          <div className="grid grid-cols-12 gap-2 text-sm">
            <div className="col-span-3">Total: {summary.total}</div>
            <div className="col-span-3 text-green-700">Pass: {summary.pass}</div>
            <div className="col-span-3 text-red-700">Fail: {summary.fail}</div>
            <div className="col-span-3 text-gray-700">Pending: {summary.pending}</div>
          </div>
          <ul className="mt-3 space-y-2">
            {tests.map((t, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${t.status==='pass' ? 'bg-green-500' : t.status==='fail' ? 'bg-red-500' : 'bg-gray-300'}`}></span>
                <span className="flex-1">{t.name}</span>
                <span className="text-xs text-gray-600">{t.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}