/**
 * Additional Git API Endpoints for Git Memory MCP Server
 *
 * This module provides additional Git operations beyond the CLI-based ones,
 * including merge, push, pull, clone, and other advanced Git operations.
 */

import { GitMemoryService } from '../src/services/git-memory.js';

/**
 * Enhanced Git operations service with additional endpoints
 */
class GitOperationsService {
  constructor() {
    this.gitMemoryService = new GitMemoryService();
  }

  /**
   * Clone a repository
   */
  async cloneRepository(url, targetPath, options = {}) {
    try {
      const {
        branch = 'main',
        depth = null,
        recursive = false,
        bare = false
      } = options;

      // Validate URL and path
      if (!url || !targetPath) {
        throw new Error('URL and target path are required');
      }

      // Use simple-git for cloning
      const git = await import('simple-git');
      const simpleGit = git.default(targetPath);

      const cloneOptions = {
        '--branch': branch,
        ...(depth && { '--depth': depth }),
        ...(recursive && { '--recursive': true }),
        ...(bare && { '--bare': true })
      };

      const result = await simpleGit.clone(url, targetPath, cloneOptions);

      return {
        success: true,
        url,
        targetPath,
        branch,
        result
      };
    } catch (error) {
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  /**
   * Push changes to remote repository
   */
  async pushToRemote(repoPath, remote = 'origin', branch = 'main', options = {}) {
    try {
      const {
        force = false,
        tags = false,
        upstream = null
      } = options;

      const git = await import('simple-git');
      const simpleGit = git.default(repoPath);

      const pushOptions = [
        ...(force ? ['--force'] : []),
        ...(tags ? ['--tags'] : []),
        ...(upstream ? ['--set-upstream', remote, upstream] : [])
      ];

      const result = await simpleGit.push(remote, branch, pushOptions);

      return {
        success: true,
        repoPath,
        remote,
        branch,
        result
      };
    } catch (error) {
      throw new Error(`Failed to push to remote: ${error.message}`);
    }
  }

  /**
   * Pull changes from remote repository
   */
  async pullFromRemote(repoPath, remote = 'origin', branch = 'main', options = {}) {
    try {
      const {
        rebase = false,
        noEdit = false,
        strategy = null
      } = options;

      const git = await import('simple-git');
      const simpleGit = git.default(repoPath);

      const pullOptions = [
        ...(rebase ? ['--rebase'] : []),
        ...(noEdit ? ['--no-edit'] : []),
        ...(strategy ? [`--strategy=${strategy}`] : [])
      ];

      const result = await simpleGit.pull(remote, branch, pullOptions);

      return {
        success: true,
        repoPath,
        remote,
        branch,
        result
      };
    } catch (error) {
      throw new Error(`Failed to pull from remote: ${error.message}`);
    }
  }

  /**
   * Merge branches
   */
  async mergeBranches(repoPath, sourceBranch, targetBranch = 'main', options = {}) {
    try {
      const {
        noFastForward = false,
        squash = false,
        message = null
      } = options;

      const git = await import('simple-git');
      const simpleGit = git.default(repoPath);

      // Checkout target branch first
      await simpleGit.checkout(targetBranch);

      const mergeOptions = [
        ...(noFastForward ? ['--no-ff'] : []),
        ...(squash ? ['--squash'] : []),
        ...(message ? ['--message', message] : [])
      ];

      const result = await simpleGit.merge([sourceBranch, ...mergeOptions]);

      return {
        success: true,
        repoPath,
        sourceBranch,
        targetBranch,
        result
      };
    } catch (error) {
      throw new Error(`Failed to merge branches: ${error.message}`);
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(repoPath, branchName, baseBranch = 'main') {
    try {
      const git = await import('simple-git');
      const simpleGit = git.default(repoPath);

      // Checkout base branch first
      await simpleGit.checkout(baseBranch);

      // Create and checkout new branch
      await simpleGit.checkoutLocalBranch(branchName);

      return {
        success: true,
        repoPath,
        branchName,
        baseBranch
      };
    } catch (error) {
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  /**
   * Delete a branch
   */
  async deleteBranch(repoPath, branchName, options = {}) {
    try {
      const {
        force = false,
        remote = false
      } = options;

      const git = await import('simple-git');
      const simpleGit = git.default(repoPath);

      const deleteOptions = [
        ...(force ? ['--force'] : []),
        ...(remote ? ['--remotes'] : [])
      ];

      const result = await simpleGit.deleteLocalBranch(branchName, deleteOptions);

      return {
        success: true,
        repoPath,
        branchName,
        result
      };
    } catch (error) {
      throw new Error(`Failed to delete branch: ${error.message}`);
    }
  }

  /**
   * Get repository statistics
   */
  async getRepositoryStats(repoPath) {
    try {
      const git = await import('simple-git');
      const simpleGit = git.default(repoPath);

      // Get commit count
      const commitCount = await simpleGit.revparse(['--short', 'HEAD']);
      const branchCount = await simpleGit.branch(['--list']);

      // Get file count and size
      const lsTree = await simpleGit.raw(['ls-tree', '-r', '--name-only', 'HEAD']);
      const files = lsTree.trim().split('\n').filter(Boolean);

      // Get contributors
      const contributors = await simpleGit.raw(['shortlog', '-sn', '--no-merges', 'HEAD']);

      return {
        success: true,
        repoPath,
        stats: {
          commitCount: commitCount.length,
          branchCount: Object.keys(branchCount.branches).length,
          fileCount: files.length,
          contributors: contributors.trim().split('\n').length
        }
      };
    } catch (error) {
      throw new Error(`Failed to get repository stats: ${error.message}`);
    }
  }

  /**
   * Stash changes
   */
  async stashChanges(repoPath, message = null) {
    try {
      const git = await import('simple-git');
      const simpleGit = git.default(repoPath);

      const stashOptions = message ? [message] : [];
      const result = await simpleGit.stash(stashOptions);

      return {
        success: true,
        repoPath,
        result
      };
    } catch (error) {
      throw new Error(`Failed to stash changes: ${error.message}`);
    }
  }

  /**
   * Apply stashed changes
   */
  async applyStash(repoPath, stashIndex = 0) {
    try {
      const git = await import('simple-git');
      const simpleGit = git.default(repoPath);

      const result = await simpleGit.stash(['apply', `stash@{${stashIndex}}`]);

      return {
        success: true,
        repoPath,
        stashIndex,
        result
      };
    } catch (error) {
      throw new Error(`Failed to apply stash: ${error.message}`);
    }
  }

  /**
   * Get diff between commits
   */
  async getDiff(repoPath, fromCommit = 'HEAD~1', toCommit = 'HEAD') {
    try {
      const git = await import('simple-git');
      const simpleGit = git.default(repoPath);

      const result = await simpleGit.diff([`${fromCommit}..${toCommit}`]);

      return {
        success: true,
        repoPath,
        fromCommit,
        toCommit,
        diff: result
      };
    } catch (error) {
      throw new Error(`Failed to get diff: ${error.message}`);
    }
  }
}

/**
 * Express middleware and route handlers for additional Git endpoints
 */
export class GitApiEndpoints {
  constructor(app, gitMemoryCLI, options = {}) {
    this.app = app;
    this.gitMemoryCLI = gitMemoryCLI;
    this.gitOps = new GitOperationsService();
    this.apiKey = options.apiKey || '';
    this.allowedRepos = options.allowedRepos || [];

    this.setupRoutes();
  }

  /**
   * Setup API routes for additional Git operations
   */
  setupRoutes() {
    // Clone repository
    this.app.post('/git/clone', async (req, res) => {
      await this.handleGitRequest(req, res, async () => {
        const { url, targetPath, branch, depth, recursive, bare } = req.body;
        return await this.gitOps.cloneRepository(url, targetPath, {
          branch, depth, recursive, bare
        });
      });
    });

    // Push to remote
    this.app.post('/git/push', async (req, res) => {
      await this.handleGitRequest(req, res, async () => {
        const { repoPath, remote, branch, force, tags, upstream } = req.body;
        return await this.gitOps.pushToRemote(repoPath, remote, branch, {
          force, tags, upstream
        });
      });
    });

    // Pull from remote
    this.app.post('/git/pull', async (req, res) => {
      await this.handleGitRequest(req, res, async () => {
        const { repoPath, remote, branch, rebase, noEdit, strategy } = req.body;
        return await this.gitOps.pullFromRemote(repoPath, remote, branch, {
          rebase, noEdit, strategy
        });
      });
    });

    // Merge branches
    this.app.post('/git/merge', async (req, res) => {
      await this.handleGitRequest(req, res, async () => {
        const { repoPath, sourceBranch, targetBranch, noFastForward, squash, message } = req.body;
        return await this.gitOps.mergeBranches(repoPath, sourceBranch, targetBranch, {
          noFastForward, squash, message
        });
      });
    });

    // Create branch
    this.app.post('/git/branch/create', async (req, res) => {
      await this.handleGitRequest(req, res, async () => {
        const { repoPath, branchName, baseBranch } = req.body;
        return await this.gitOps.createBranch(repoPath, branchName, baseBranch);
      });
    });

    // Delete branch
    this.app.delete('/git/branch/:branchName', async (req, res) => {
      await this.handleGitRequest(req, res, async () => {
        const { repoPath, force, remote } = req.body;
        return await this.gitOps.deleteBranch(repoPath, req.params.branchName, {
          force, remote
        });
      });
    });

    // Get repository statistics
    this.app.get('/git/stats', async (req, res) => {
      await this.handleGitRequest(req, res, async () => {
        const { repoPath } = req.query;
        return await this.gitOps.getRepositoryStats(repoPath);
      });
    });

    // Stash changes
    this.app.post('/git/stash', async (req, res) => {
      await this.handleGitRequest(req, res, async () => {
        const { repoPath, message } = req.body;
        return await this.gitOps.stashChanges(repoPath, message);
      });
    });

    // Apply stash
    this.app.post('/git/stash/apply', async (req, res) => {
      await this.handleGitRequest(req, res, async () => {
        const { repoPath, stashIndex } = req.body;
        return await this.gitOps.applyStash(repoPath, stashIndex);
      });
    });

    // Get diff
    this.app.get('/git/diff', async (req, res) => {
      await this.handleGitRequest(req, res, async () => {
        const { repoPath, fromCommit, toCommit } = req.query;
        return await this.gitOps.getDiff(repoPath, fromCommit, toCommit);
      });
    });
  }

  /**
   * Enhanced request handler with API key validation and metrics
   */
  async handleGitRequest(req, res, operation) {
    try {
      // Validate API key
      if (this.apiKey) {
        const authHeader = req.headers['x-api-key'] || req.headers['authorization'] || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

        if (token !== this.apiKey) {
          return res.status(401).json({ error: 'Invalid API key' });
        }
      }

      // Validate repository path if provided
      if (req.body.repoPath || req.query.repoPath) {
        const repoPath = req.body.repoPath || req.query.repoPath;
        if (this.allowedRepos.length > 0) {
          const resolved = require('path').resolve(repoPath);
          const isAllowed = this.allowedRepos.some(base =>
            resolved === base || resolved.startsWith(`${base}${require('path').sep}`)
          );

          if (!isAllowed) {
            return res.status(403).json({ error: `Repository path not permitted: ${resolved}` });
          }
        }
      }

      const start = Date.now();
      const result = await operation();
      const duration = Date.now() - start;

      // Record metrics if available
      if (this.gitMemoryCLI && this.gitMemoryCLI.metrics) {
        const endpoint = req.route.path.replace(/[:/]/g, '_').substring(1);
        this.gitMemoryCLI.metrics.recordToolDuration(`http_${endpoint}`, duration);
      }

      res.json({ success: true, data: result, duration });

    } catch (error) {
      console.error('Git operation error:', error);

      // Record error metrics if available
      if (this.gitMemoryCLI && this.gitMemoryCLI.metrics) {
        const endpoint = req.route.path.replace(/[:/]/g, '_').substring(1);
        this.gitMemoryCLI.metrics.incrementToolErrors(`http_${endpoint}`);
      }

      const statusCode = error.message.includes('API key') ? 401 :
                        error.message.includes('not permitted') ? 403 : 500;

      res.status(statusCode).json({ error: error.message });
    }
  }
}

// Export for use in other modules
export { GitOperationsService };
