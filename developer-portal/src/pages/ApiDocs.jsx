import React from 'react';

const apis = [
  { method: 'GET', path: '/api/projects', desc: 'List projects' },
  { method: 'POST', path: '/api/projects', desc: 'Create project' },
  { method: 'GET', path: '/api/logs', desc: 'Fetch system logs' },
];

export default function ApiDocs() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">API Documentation</h1>
      <div className="bg-white rounded shadow divide-y">
        <div className="grid grid-cols-12 px-4 py-2 text-xs uppercase text-gray-500">
          <div className="col-span-2">Method</div>
          <div className="col-span-6">Path</div>
          <div className="col-span-4">Description</div>
        </div>
        {apis.map((a, i) => (
          <div key={i} className="grid grid-cols-12 px-4 py-2 text-sm">
            <div className="col-span-2"><span className={`px-2 py-0.5 rounded text-white text-xs ${a.method==='GET'?'bg-green-600':a.method==='POST'?'bg-blue-600':'bg-gray-700'}`}>{a.method}</span></div>
            <div className="col-span-6 font-mono text-xs">{a.path}</div>
            <div className="col-span-4 text-gray-600">{a.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}