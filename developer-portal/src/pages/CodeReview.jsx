import React, { useState } from 'react';

export default function CodeReview() {
  const [code, setCode] = useState('');
  const [report, setReport] = useState('');

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
    setCode(map[name]);
  };

  const autoFix = () => {
    if (!code.trim()) return;
    // naive fixes: remove console.log in production, ensure semi-colons
    const fixed = code
      .replace(/console\.log\(.*?\);?/g, '// console.log removed for production')
      .replace(/([^;\s\}\)])\n/g, '$1;\n');
    setCode(fixed);
    setReport((r) => r + '\n\nAuto-fix applied: removed console.log and normalized semicolons.');
  };

  const saveToIDE = () => {
    const map = JSON.parse(localStorage.getItem('nexus.ide.files') || '{}');
    const name = window.prompt('Save back as (existing or new path):', 'src/ReviewedFile.ts');
    if (!name) return;
    map[name] = code;
    localStorage.setItem('nexus.ide.files', JSON.stringify(map));
    localStorage.setItem('nexus.ide.editor.current', code);
    alert('Saved to IDE: ' + name);
  };

  const run = () => {
    if (!code.trim()) return;
    const issues = [];
    if (/var\s+/.test(code)) issues.push('- Usage of var detected; prefer let/const.');
    if (!/use strict/.test(code)) issues.push('- Missing "use strict" declaration.');
    if (/console\.log\(/.test(code)) issues.push('- console.log present; consider removing in production.');
    if (!/\n\n/.test(code)) issues.push('- Consider adding whitespace for readability.');
    const score = 100 - issues.length * 10;
    const body = `Mock Review\nScore: ${score}/100\n${issues.length ? issues.join('\n') : '- No obvious issues found.'}`;
    setReport(body);
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <section className="col-span-12 lg:col-span-7">
        <div className="mb-2 flex gap-2">
          <button onClick={loadFromIDE} className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm">Load from IDE</button>
          <button onClick={autoFix} className="px-2 py-1 rounded bg-amber-200 hover:bg-amber-300 text-sm">Auto-fix</button>
          <button onClick={saveToIDE} className="px-2 py-1 rounded bg-gray-900 text-white text-sm">Save to IDE</button>
        </div>
        <textarea value={code} onChange={(e)=>setCode(e.target.value)} placeholder="Paste code here..." className="w-full min-h-[320px] border rounded p-3 font-mono text-sm" />
        <div className="mt-3 flex gap-2">
          <button onClick={run} className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Run Review</button>
          <button onClick={()=>{setCode(''); setReport('');}} className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Clear</button>
        </div>
      </section>
      <aside className="col-span-12 lg:col-span-5">
        <div className="bg-white rounded shadow p-4 min-h-[320px] whitespace-pre-wrap text-sm">{report || 'No report yet.'}</div>
      </aside>
    </div>
  );
}