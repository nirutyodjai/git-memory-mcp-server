import React, { useState } from 'react';

export default function BugFixer() {
  const [trace, setTrace] = useState('');
  const [fix, setFix] = useState('');

  const run = () => {
    if (!trace.trim()) return;
    setFix('Suggested Fix\n- Identify root cause from stack trace\n- Add null checks\n- Write a regression test\n\nNote: Hook this to AI Bug Fixer for automated patches.');
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <section className="col-span-12 lg:col-span-7">
        <textarea value={trace} onChange={(e)=>setTrace(e.target.value)} placeholder="Paste error stack trace..." className="w-full min-h-[280px] border rounded p-3 font-mono text-sm" />
        <div className="mt-3 flex gap-2">
          <button onClick={run} className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Suggest Fix</button>
          <button onClick={()=>{setTrace(''); setFix('');}} className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Clear</button>
        </div>
      </section>
      <aside className="col-span-12 lg:col-span-5">
        <div className="bg-white rounded shadow p-4 min-h-[280px] whitespace-pre-wrap text-sm">{fix || 'No suggestions yet.'}</div>
      </aside>
    </div>
  );
}