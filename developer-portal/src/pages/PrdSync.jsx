import React, { useMemo, useState } from 'react';

function parsePRD(text) {
  const lines = text.split(/\r?\n/);
  const headings = [];
  const bullets = [];
  for (const ln of lines) {
    if (/^\s*#{1,6}\s+/.test(ln)) headings.push(ln.replace(/^\s*#{1,6}\s+/, '').trim());
    if (/^\s*[-*+]\s+/.test(ln)) bullets.push(ln.replace(/^\s*[-*+]\s+/, '').trim());
  }
  return { headings, bullets, length: text.length, lines: lines.length };
}

export default function PrdSync() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);

  const stats = useMemo(() => (result ? [
    { k: 'Characters', v: result.length },
    { k: 'Lines', v: result.lines },
    { k: 'Headings', v: result.headings.length },
    { k: 'Bullet Items', v: result.bullets.length },
  ] : []), [result]);

  const onAnalyze = () => {
    if (!input.trim()) return;
    setResult(parsePRD(input));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Sync PRD</h1>
        <div className="text-sm text-gray-500">Paste your PRD in Markdown or plain text, then click Analyze.</div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <section className="col-span-12 lg:col-span-7">
          <textarea
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            placeholder="Paste PRD here..."
            className="w-full min-h-[320px] border rounded p-3 font-mono text-sm"
          />
          <div className="mt-3 flex gap-2">
            <button onClick={onAnalyze} className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Analyze PRD</button>
            <button onClick={()=>{setInput(''); setResult(null);}} className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Clear</button>
          </div>
        </section>
        <aside className="col-span-12 lg:col-span-5 space-y-4">
          <div className="bg-white rounded shadow p-4">
            <div className="font-semibold mb-2">Summary</div>
            {!result && <div className="text-gray-500 text-sm">No analysis yet.</div>}
            {result && (
              <ul className="text-sm text-gray-700 space-y-1">
                {stats.map((s)=> (
                  <li key={s.k} className="flex justify-between"><span>{s.k}</span><span className="font-medium">{s.v}</span></li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white rounded shadow p-4">
            <div className="font-semibold mb-2">Headings</div>
            {!result && <div className="text-gray-500 text-sm">—</div>}
            {result && (
              <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                {result.headings.slice(0, 20).map((h, i)=> <li key={i}>{h}</li>)}
              </ul>
            )}
          </div>
          <div className="bg-white rounded shadow p-4">
            <div className="font-semibold mb-2">Key Bullets</div>
            {!result && <div className="text-gray-500 text-sm">—</div>}
            {result && (
              <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                {result.bullets.slice(0, 30).map((b, i)=> <li key={i}>{b}</li>)}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}