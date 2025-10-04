import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { MetricsCollector } from '../monitoring/metrics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GitMemoryCLIService {
  constructor(options = {}) {
    this.pythonBin = options.pythonBin || process.env.GIT_MEMORY_PYTHON || process.env.PYTHON_BIN || 'python';
    this.moduleRoot = options.moduleRoot || process.env.GIT_MEMORY_PY_ROOT || path.resolve(__dirname, '../../..');
    this.allowedRepos = (options.allowedRepos || process.env.GIT_MEMORY_ALLOWED_REPOS || '')
      .split(path.delimiter)
      .map(entry => entry.trim())
      .filter(Boolean)
      .map(entry => path.resolve(entry));
    this.metrics = options.metrics || new MetricsCollector();
  }

  buildPythonPath() {
    const existing = process.env.PYTHONPATH || '';
    const entries = [this.moduleRoot, existing].filter(Boolean);
    return entries.join(path.delimiter);
  }

  assertRepoAllowed(repoPath) {
    const resolved = path.resolve(repoPath);
    if (this.allowedRepos.length === 0) {
      return resolved;
    }
    const isAllowed = this.allowedRepos.some(base => resolved === base || resolved.startsWith(`${base}${path.sep}`));
    if (!isAllowed) {
      throw new Error(`Repository path is not allowed: ${resolved}`);
    }
    return resolved;
  }

  runCLI(args, repoPath, { expectJson = false } = {}) {
    return new Promise((resolve, reject) => {
      if (!repoPath) {
        reject(new Error('Repository path is required'));
        return;
      }

      let resolvedRepo;
      try {
        resolvedRepo = this.assertRepoAllowed(repoPath);
      } catch (error) {
        reject(error);
        return;
      }

      const pythonPath = this.buildPythonPath();
      const child = spawn(this.pythonBin, ['-m', 'git_memory.cli', ...args], {
        cwd: resolvedRepo,
        env: {
          ...process.env,
          PYTHONPATH: pythonPath
        },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (error) => {
        reject(error);
      });

      const startTime = Date.now();

      child.on('close', (code) => {
        if (code === 0) {
          const trimmedStdout = stdout.trim();
          if (expectJson) {
            try {
              const json = trimmedStdout ? JSON.parse(trimmedStdout) : {};
              this.metrics.recordToolDuration(args[0] || 'git_memory_cli', Date.now() - startTime);
              resolve({ stdout: trimmedStdout, stderr: stderr.trim(), json });
            } catch (error) {
              reject(new Error(`Failed to parse JSON output: ${error.message}`));
            }
          } else {
            this.metrics.recordToolDuration(args[0] || 'git_memory_cli', Date.now() - startTime);
            resolve({ stdout: trimmedStdout, stderr: stderr.trim() });
          }
        } else {
          this.metrics.incrementToolErrors(args[0] || 'git_memory_cli');
          reject(new Error(stderr.trim() || `git_memory CLI exited with code ${code}`));
        }
      });
    });
  }

  async status(repoPath, { json = true } = {}) {
    const args = ['status'];
    if (json) {
      args.push('--json');
    }
    const result = await this.runCLI(args, repoPath, { expectJson: json });
    if (json) {
      return result.json;
    }
    return { output: result.stdout };
  }

  async fetch(repoPath, { remote = 'origin', prune = false, tags = false, all = false } = {}) {
    const args = ['fetch'];
    if (all) {
      args.push('--all');
    } else if (remote) {
      args.push(remote);
    }
    if (prune) {
      args.push('--prune');
    }
    if (tags) {
      args.push('--tags');
    }
    return this.runCLI(args, repoPath);
  }

  async rebase(
    repoPath,
    {
      upstream,
      branch,
      continueRebase = false,
      abort = false,
      skip = false,
      autostash = false
    } = {}
  ) {
    const args = ['rebase'];
    if (autostash) {
      args.push('--autostash');
    }
    if (abort) {
      args.push('--abort');
      return this.runCLI(args, repoPath);
    }
    if (continueRebase) {
      args.push('--continue');
      return this.runCLI(args, repoPath);
    }
    if (skip) {
      args.push('--skip');
      return this.runCLI(args, repoPath);
    }

    if (upstream) {
      args.push(upstream);
    }
    if (branch) {
      args.push(branch);
    }

    return this.runCLI(args, repoPath);
  }
}
