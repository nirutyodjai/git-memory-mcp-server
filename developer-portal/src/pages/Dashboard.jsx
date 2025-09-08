import React from 'react';

export default function Dashboard() {
  const cards = [
    { title: 'Projects', value: 12, color: 'bg-indigo-600' },
    { title: 'Active Sessions', value: 3, color: 'bg-emerald-600' },
    { title: 'Open Issues', value: 18, color: 'bg-amber-600' },
    { title: 'Build Status', value: 'Passing', color: 'bg-green-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="rounded shadow bg-white p-4">
            <div className="text-gray-500 text-sm">{c.title}</div>
            <div className={`mt-2 inline-block px-3 py-1 rounded text-white font-semibold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow p-4 min-h-[200px]">
          <div className="font-semibold mb-2">Recent Activity</div>
          <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
            <li>Deployed service api-gateway to production</li>
            <li>PR #214 merged to main</li>
            <li>CI pipeline passed (12m 21s)</li>
          </ul>
        </div>
        <div className="bg-white rounded shadow p-4 min-h-[200px]">
          <div className="font-semibold mb-2">AI Suggestions</div>
          <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
            <li>Refactor utils/date.ts for better testability</li>
            <li>Add caching to /api/projects endpoint</li>
            <li>Enable bundle splitting for IDE page</li>
          </ul>
        </div>
      </div>
    </div>
  );
}