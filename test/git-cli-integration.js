import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { exec as execCallback } from 'child_process';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { GitMemoryCLIService } from '../src/services/git-memory-cli.js';

const exec = promisify(execCallback);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run(cmd, cwd) {
  await exec(cmd, { cwd, env: { ...process.env } });
}

async function main() {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'git-memory-cli-'));
  const repoPath = path.join(tempRoot, 'work');
  const remotePath = path.join(tempRoot, 'remote.git');

  await fs.mkdir(repoPath, { recursive: true });
  await fs.mkdir(remotePath, { recursive: true });

  await run('git init', repoPath);
  await run('git config user.email "test@example.com"', repoPath);
  await run('git config user.name "Automation Test"', repoPath);

  await run('git init --bare', remotePath);
  await run(`git remote add origin "${remotePath.replace(/\\/g, '/')}"`, repoPath);

  await fs.writeFile(path.join(repoPath, 'README.md'), '# Git Memory CLI Automation\n', 'utf8');
  await run('git add README.md', repoPath);
  await run('git commit -m "Initial commit"', repoPath);

  const cli = new GitMemoryCLIService({ moduleRoot: path.resolve(__dirname, '..') });

  console.log('Running git-memory status --json');
  const status = await cli.status(repoPath, { json: true });
  console.log(JSON.stringify(status, null, 2));

  console.log('Running git-memory fetch');
  const fetchResult = await cli.fetch(repoPath, { remote: 'origin', prune: true });
  console.log(fetchResult.stdout || 'Fetch completed');

  // Prepare branches for rebase test
  await run('git checkout -b feature', repoPath);
  await fs.appendFile(path.join(repoPath, 'README.md'), 'Feature line\n', 'utf8');
  await run('git add README.md', repoPath);
  await run('git commit -m "Feature update"', repoPath);

  await run('git checkout main', repoPath);
  await fs.appendFile(path.join(repoPath, 'README.md'), 'Main line\n', 'utf8');
  await run('git add README.md', repoPath);
  await run('git commit -m "Main branch change"', repoPath);

  console.log('Running git-memory rebase main feature');
  const rebaseResult = await cli.rebase(repoPath, { upstream: 'main', branch: 'feature' });
  console.log(rebaseResult.stdout || 'Rebase completed');

  console.log('Automation script completed successfully.');
}

main().catch((error) => {
  console.error('Automation script failed:', error);
  process.exitCode = 1;
});
