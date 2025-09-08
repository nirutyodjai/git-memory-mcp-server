#!/usr/bin/env node

// ... existing code ...
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function riskRank(risk) {
  if (risk === 'low') return 1;
  if (risk === 'medium') return 2;
  if (risk === 'high') return 3;
  return 99;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { plan: path.join(projectRoot, 'restructure-plan.json'), risk: 'low', force: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--plan' && args[i + 1]) opts.plan = path.resolve(process.cwd(), args[++i]);
    else if (a === '--risk' && args[i + 1]) opts.risk = args[++i].toLowerCase();
    else if (a === '--force') opts.force = true;
  }
  return opts;
}

(function main() {
  const opts = parseArgs();
  if (!fs.existsSync(opts.plan)) {
    console.error(`❌ Plan not found: ${opts.plan}`);
    process.exit(1);
  }

  const plan = readJson(opts.plan);
  const allowRank = riskRank(opts.risk);
  const executed = [];
  const skipped = [];

  console.log(`🚚 Applying plan: ${opts.plan}`);
  console.log(`   Allowed risk: ${opts.risk} (<= rank ${allowRank})`);
  console.log('');

  for (const move of plan.moves) {
    const thisRank = riskRank(move.risk);
    const fromAbs = path.join(projectRoot, move.from);
    const toAbs = path.join(projectRoot, move.to);

    if (thisRank > allowRank && !opts.force) {
      skipped.push({ ...move, reason: `risk>${opts.risk}` });
      continue;
    }

    if (!fs.existsSync(fromAbs)) {
      console.warn(`⚠️  Missing: ${move.from} (skip)`);
      skipped.push({ ...move, reason: 'missing-source' });
      continue;
    }

    ensureDirSync(path.dirname(toAbs));

    try {
      fs.renameSync(fromAbs, toAbs);
      executed.push(move);
      console.log(`✅ ${move.from} -> ${move.to} [${move.risk}]`);
    } catch (err) {
      console.error(`❌ Failed moving ${move.from} -> ${move.to}: ${err.message}`);
      skipped.push({ ...move, reason: err.message });
    }
  }

  const out = {
    executedCount: executed.length,
    skippedCount: skipped.length,
    executed,
    skipped,
    finishedAt: new Date().toISOString(),
    appliedRisk: opts.risk,
    force: opts.force
  };
  const outPath = path.join(projectRoot, 'restructure-applied.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  console.log('');
  console.log(`📄 Result saved to ${outPath}`);
  console.log(`   Executed: ${executed.length}, Skipped: ${skipped.length}`);
})();