import React, { useState } from 'react';

export default function Security() {
  const [code, setCode] = useState('');
  const [issues, setIssues] = useState([]);

  const scan = () => {
    if (!code.trim()) return;
    setIssues([
      { type: 'High', msg: 'Hardcoded secret detected in config', path: 'src/config.ts' },
      { type: 'Medium', msg: 'Potential SQL injection in buildQuery()', path: 'src/db/query.ts' },
    ]);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Security Scan</h1>
      <textarea value={code} onChange={(e)=>setCode(e.target.value)} placeholder="Paste code snippet..." className="w-full min-h-[200px] border rounded p-3 font-mono text-sm" />
      <div className="flex gap-2">
        <button onClick={scan} className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Scan</button>
        <button onClick={()=>{setCode(''); setIssues([]);}} className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Clear</button>
      </div>
      <div className="bg-white rounded shadow divide-y">
        {issues.length === 0 && <div className="p-6 text-gray-500">No issues yet.</div>}
        {issues.map((it, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-white text-xs ${it.type==='High'?'bg-red-600':'bg-yellow-600'}`}>{it.type}</span>
              <span>{it.msg}</span>
            </div>
            <div className="text-gray-500 text-xs font-mono">{it.path}</div>
          </div>
        ))}
      </div>
    </div>
  );
}