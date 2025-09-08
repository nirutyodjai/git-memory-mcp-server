#!/usr/bin/env node

// ... existing code ...
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');
const Analyzer = require(path.join(projectRoot, 'analyze-project-files.js'));

const OUT_PLAN = path.join(projectRoot, 'restructure-plan.json');

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function isRootLevel(relPath) {
  // root-level file has dirname '.'
  return path.dirname(relPath) === '.';
}

function suggestRisk(level) {
  // normalize risk level
  if (['low', 'medium', 'high'].includes(level)) return level;
  return 'medium';
}

function buildPlan(files) {
  const moves = [];
  const skipped = [];
  const warnings = [];

  const skipDirs = [
    'servers', 'src', 'docs', 'config', 'scripts',
    'tests', 'prisma', 'data', 'extension', 'comdee-ide',
    'github-servers', 'generated-servers', '.git', 'node_modules'
  ];

  const isInSkippedDir = (relPath) =>
    skipDirs.some(dir => relPath.toLowerCase().startsWith(dir.toLowerCase() + path.sep));

  for (const file of files) {
    const rel = file.relativePath.replace(/\\/g, path.sep);
    const name = file.name;
    const ext = file.extension.toLowerCase();

    // 1) ข้ามไฟล์ระบบสำคัญบางตัวโดยตรง
    if (['package.json', 'Dockerfile', 'Dockerfile.production', 'docker-compose.prod.yml'].includes(name)) {
      skipped.push({ reason: 'core-root-file', file: rel });
      continue;
    }

    // 2) ข้ามไฟล์ในโฟลเดอร์ที่มีโครงสร้างแล้ว
    if (isInSkippedDir(rel)) {
      skipped.push({ reason: 'already-structured', file: rel });
      continue;
    }

    // 3) กฎ servers: mcp-server-<type>-<number>.js (ที่ยังอยู่ root)
    const mcpMatch = /^mcp-server-([a-z0-9\-]+)-(\d+)\.js$/i.exec(name);
    if (mcpMatch && isRootLevel(rel)) {
      const type = mcpMatch[1].toLowerCase();
      const num = mcpMatch[2];
      const dest = path.join('servers', type, `${num}.js`);
      moves.push({
        from: rel,
        to: dest,
        reason: 'Group MCP servers by type/number',
        risk: 'low'
      });
      continue;
    }

    // 4) กฎ api-gateway-*.js -> src/api-gateway/ (ตั้งให้เสี่ยงสูง: อาจต้องแก้ Dockerfile/refs)
    if (/^api-gateway-.*\.js$/i.test(name) && isRootLevel(rel)) {
      const dest = path.join('src', 'api-gateway', name);
      moves.push({
        from: rel,
        to: dest,
        reason: 'Group API Gateway files under src/api-gateway',
        risk: 'high'
      });
      continue;
    }

    // 5) เอกสาร: *.md (ยกเว้น README.md, LICENSE) -> docs/
    if (ext === '.md' && isRootLevel(rel) && !['readme.md', 'license'].includes(name.toLowerCase())) {
      const dest = path.join('docs', name);
      moves.push({
        from: rel,
        to: dest,
        reason: 'Move documentation to docs/',
        risk: 'medium'
      });
      continue;
    }

    // 6) คอนฟิก: *.config.json / *.yaml / *.yml -> config/
    if (isRootLevel(rel) && (name.endsWith('.config.json') || name.endsWith('.yaml') || name.endsWith('.yml'))) {
      const dest = path.join('config', name);
      moves.push({
        from: rel,
        to: dest,
        reason: 'Move configuration files to config/',
        risk: 'medium'
      });
      continue;
    }

    // 7) สคริปต์อัตโนมัติ: start-*, deploy-*, scale-*, test-*, quick-*, backup-* -> scripts/
    if (isRootLevel(rel) && /^((start|deploy|scale|test|quick|backup|restart|increase)-.*\.(js|bat|ps1))$/i.test(name)) {
      const dest = path.join('scripts', name);
      moves.push({
        from: rel,
        to: dest,
        reason: 'Move automation scripts to scripts/',
        risk: 'medium'
      });
      continue;
    }

    // 8) อื่นๆ: เว้นไว้ก่อน (ต้องรีวิว)
    skipped.push({ reason: 'no-rule', file: rel });
  }

  // สรุปจำนวนตามระดับความเสี่ยง
  const summary = {
    totalCandidates: moves.length,
    byRisk: {
      low: moves.filter(m => m.risk === 'low').length,
      medium: moves.filter(m => m.risk === 'medium').length,
      high: moves.filter(m => m.risk === 'high').length
    }
  };

  return { moves, skipped, warnings, summary };
}

(async () => {
  console.log('🔍 Building restructure plan (dry-run)...');
  const analyzer = new Analyzer();
  const files = await analyzer.scanAllFiles();

  const plan = buildPlan(files);
  const out = {
    generatedAt: new Date().toISOString(),
    notes: 'Review this plan carefully. Only low-risk moves should be applied first.',
    summary: plan.summary,
    moves: plan.moves,
    skipped: plan.skipped,
    warnings: plan.warnings
  };

  fs.writeFileSync(OUT_PLAN, JSON.stringify(out, null, 2));
  console.log(`✅ Plan saved to ${OUT_PLAN}`);
  console.log(`   - low: ${plan.summary.byRisk.low}, medium: ${plan.summary.byRisk.medium}, high: ${plan.summary.byRisk.high}`);
})();