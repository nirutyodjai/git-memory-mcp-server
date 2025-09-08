import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const sampleProjects = [
  { id: 'demo-1', name: 'NEXUS Core', stack: 'Node.js • React • Postgres', updatedAt: '2025-09-01 10:13' },
  { id: 'demo-2', name: 'AI Copilot', stack: 'Python • FastAPI • Vector DB', updatedAt: '2025-09-02 08:47' },
];

export default function Projects() {
  const [query, setQuery] = useState('');
  const [custom, setCustom] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('projects');
      if (raw) setCustom(JSON.parse(raw));
    } catch (_) {}
  }, []);

  const projects = useMemo(() => {
    const all = [...custom, ...sampleProjects];
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(p => p.name.toLowerCase().includes(q) || p.stack.toLowerCase().includes(q));
  }, [custom, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects..."
            className="border rounded px-3 py-2 text-sm w-64 max-w-full"
          />
          <Link to="/projects/new" className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">
            New Project
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="bg-white rounded shadow p-4">
            <div className="font-semibold text-lg mb-1">{p.name}</div>
            <div className="text-sm text-gray-600 mb-2">{p.stack}</div>
            <div className="text-xs text-gray-500">Updated: {p.updatedAt}</div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full text-center text-gray-500 bg-white rounded border p-10">No projects found.</div>
        )}
      </div>
    </div>
  );
}