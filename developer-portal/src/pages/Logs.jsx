import React, { useMemo, useState } from 'react';

const seed = [
  { ts: '2025-09-06 06:40:01', level: 'info', msg: 'Server started', src: 'vite' },
  { ts: '2025-09-06 06:46:23', level: 'info', msg: 'Optimized deps: react-router-dom', src: 'vite' },
  { ts: '2025-09-06 06:47:15', level: 'hmr', msg: 'Update Header.jsx', src: 'vite' },
];

export default function Logs() {
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('all');

  const rows = useMemo(() => {
    return seed.filter((r) =>
      (level === 'all' || r.level === level) &&
      (!q.trim() || r.msg.toLowerCase().includes(q.toLowerCase()))
    );
  }, [q, level]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h1 className="text-2xl font-bold">Logs</h1>
        <div className="flex gap-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} className="border rounded px-3 py-2 text-sm" placeholder="Filter..." />
          <select value={level} onChange={(e)=>setLevel(e.target.value)} className="border rounded px-3 py-2 text-sm">
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="hmr">HMR</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>
      <div className="bg-white rounded shadow divide-y">
        <div className="grid grid-cols-12 px-4 py-2 text-xs uppercase text-gray-500">
          <div className="col-span-3">Timestamp</div>
          <div className="col-span-2">Level</div>
          <div className="col-span-5">Message</div>
          <div className="col-span-2">Source</div>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 px-4 py-2 text-sm">
            <div className="col-span-3 font-mono text-xs text-gray-600">{r.ts}</div>
            <div className="col-span-2"><span className={`px-2 py-0.5 rounded text-white text-xs ${r.level==='error'?'bg-red-600':r.level==='warn'?'bg-yellow-600':r.level==='hmr'?'bg-blue-600':'bg-gray-700'}`}>{r.level}</span></div>
            <div className="col-span-5">{r.msg}</div>
            <div className="col-span-2 text-gray-500">{r.src}</div>
          </div>
        ))}
      </div>
    </div>
  );
}