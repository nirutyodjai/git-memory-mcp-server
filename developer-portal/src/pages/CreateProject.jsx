import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateProject() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [stack, setStack] = useState('React • Vite • Tailwind');
  const [desc, setDesc] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter a project name');
    const project = {
      id: String(Date.now()),
      name: name.trim(),
      stack: stack.trim() || 'Custom',
      desc: desc.trim(),
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    try {
      const raw = localStorage.getItem('projects');
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(project);
      localStorage.setItem('projects', JSON.stringify(arr));
    } catch (_) {}
    nav('/projects');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Create Project</h1>
      <form onSubmit={onSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Project Name</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g., NEXUS Web" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tech Stack</label>
          <input value={stack} onChange={(e)=>setStack(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={desc} onChange={(e)=>setDesc(e.target.value)} className="w-full border rounded px-3 py-2 min-h-[120px]" placeholder="What is this project about?" />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={()=>nav(-1)} className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Cancel</button>
          <button type="submit" className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Create</button>
        </div>
      </form>
    </div>
  );
}