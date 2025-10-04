import simpleGit from 'simple-git';
import { createLogger } from 'winston';
import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info'
});

export class GitMemoryService {
  constructor() {
    // Simple cache using Map with TTL
    this.cache = new Map();
    this.cacheTTL = new Map();
    
    this.gitInstances = new Map();
    this.operationQueue = new Map();
    this.maxConcurrentOperations = parseInt(process.env.GIT_MAX_CONCURRENT) || 10;
    this.currentOperations = 0;
    
    this.setupGitDefaults();
    
    // Clean expired cache entries every minute
    setInterval(() => this.cleanExpiredCache(), 60000);
  }

  cleanExpiredCache() {
    const now = Date.now();
    for (const [key, expiry] of this.cacheTTL.entries()) {
      if (now > expiry) {
        this.cache.delete(key);
        this.cacheTTL.delete(key);
      }
    }
  }

  setCache(key, value, ttl = 300) {
    this.cache.set(key, value);
    this.cacheTTL.set(key, Date.now() + (ttl * 1000));
  }

  getCache(key) {
    const expiry = this.cacheTTL.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheTTL.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  setupGitDefaults() {
    // Default Git configuration for better performance
    this.gitOptions = {
      timeout: {
        block: 30000, // 30 seconds
      },
      config: [
        'core.preloadindex=true',
        'core.fscache=true',
        'gc.auto=0' // Disable auto garbage collection
      ]
    };
  }

  // Get or create Git instance for a repository
  getGitInstance(repoPath) {
    const normalizedPath = path.resolve(repoPath);
    
    if (!this.gitInstances.has(normalizedPath)) {
      const git = simpleGit(normalizedPath, this.gitOptions);
      this.gitInstances.set(normalizedPath, git);
    }
    
    return this.gitInstances.get(normalizedPath);
  }

  // Execute Git operation with concurrency control
  async executeGitOperation(operation, cacheKey = null, cacheTTL = 300) {
    // Check cache first
    if (cacheKey) {
      const cached = this.getCache(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for: ${cacheKey}`);
        return cached;
      }
    }

    // Wait for available slot
    while (this.currentOperations >= this.maxConcurrentOperations) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.currentOperations++;
    
    try {
      const result = await operation();
      
      // Cache the result if cache key provided
      if (cacheKey && result) {
        this.setCache(cacheKey, result, cacheTTL);
        logger.debug(`Cached result for: ${cacheKey}`);
      }
      
      return result;
    } finally {
      this.currentOperations--;
    }
  }

  // Validate repository path
  async validateRepository(repoPath) {
    try {
      const normalizedPath = path.resolve(repoPath);
      const stats = await fs.stat(normalizedPath);
      
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${repoPath}`);
      }
      
      const gitDir = path.join(normalizedPath, '.git');
      const gitStats = await fs.stat(gitDir);
      
      if (!gitStats.isDirectory()) {
        throw new Error(`Not a Git repository: ${repoPath}`);
      }
      
      return normalizedPath;
    } catch (error) {
      throw new Error(`Invalid repository path: ${error.message}`);
    }
  }

  // Get current branch
  async getCurrentBranch(repoPath) {
    const validatedPath = await this.validateRepository(repoPath);
    const cacheKey = `current_branch:${validatedPath}`;
    
    return this.executeGitOperation(async () => {
      const git = this.getGitInstance(validatedPath);
      const branch = await git.branch();
      
      return {
        current: branch.current,
        all: branch.all,
        timestamp: Date.now()
      };
    }, cacheKey, 60); // Cache for 1 minute
  }

  // Get recent commits
  async getRecentCommits(repoPath, limit = 10) {
    const validatedPath = await this.validateRepository(repoPath);
    const cacheKey = `recent_commits:${validatedPath}:${limit}`;
    
    return this.executeGitOperation(async () => {
      const git = this.getGitInstance(validatedPath);
      const log = await git.log({
        maxCount: limit,
        format: {
          hash: '%H',
          date: '%ai',
          message: '%s',
          author_name: '%an',
          author_email: '%ae'
        }
      });
      
      return {
        commits: log.all.map(commit => ({
          hash: commit.hash,
          shortHash: commit.hash.substring(0, 7),
          message: commit.message,
          author: {
            name: commit.author_name,
            email: commit.author_email
          },
          date: commit.date,
          timestamp: new Date(commit.date).getTime()
        })),
        total: log.total,
        timestamp: Date.now()
      };
    }, cacheKey, 120); // Cache for 2 minutes
  }

  // Get repository status
  async getRepoStatus(repoPath) {
    const validatedPath = await this.validateRepository(repoPath);
    const cacheKey = `repo_status:${validatedPath}`;
    
    return this.executeGitOperation(async () => {
      const git = this.getGitInstance(validatedPath);
      const status = await git.status();
      
      return {
        current: status.current,
        tracking: status.tracking,
        ahead: status.ahead,
        behind: status.behind,
        staged: status.staged,
        modified: status.modified,
        not_added: status.not_added,
        deleted: status.deleted,
        renamed: status.renamed,
        conflicted: status.conflicted,
        isClean: status.isClean(),
        timestamp: Date.now()
      };
    }, cacheKey, 30); // Cache for 30 seconds
  }

  // List all branches
  async listBranches(repoPath) {
    const validatedPath = await this.validateRepository(repoPath);
    const cacheKey = `branches:${validatedPath}`;
    
    return this.executeGitOperation(async () => {
      const git = this.getGitInstance(validatedPath);
      const branches = await git.branch(['-a']);
      
      const localBranches = [];
      const remoteBranches = [];
      
      branches.all.forEach(branch => {
        if (branch.startsWith('remotes/')) {
          remoteBranches.push({
            name: branch.replace('remotes/', ''),
            current: branch === branches.current,
            type: 'remote'
          });
        } else {
          localBranches.push({
            name: branch,
            current: branch === branches.current,
            type: 'local'
          });
        }
      });
      
      return {
        current: branches.current,
        local: localBranches,
        remote: remoteBranches,
        all: branches.all,
        timestamp: Date.now()
      };
    }, cacheKey, 180); // Cache for 3 minutes
  }

  // Search commits
  async searchCommits(repoPath, query, limit = 20) {
    const validatedPath = await this.validateRepository(repoPath);
    const cacheKey = `search_commits:${validatedPath}:${query}:${limit}`;
    
    return this.executeGitOperation(async () => {
      const git = this.getGitInstance(validatedPath);
      
      // Search in commit messages
      const messageResults = await git.log({
        maxCount: limit,
        grep: query,
        format: {
          hash: '%H',
          date: '%ai',
          message: '%s',
          author_name: '%an',
          author_email: '%ae'
        }
      });
      
      // Search in author names
      const authorResults = await git.log({
        maxCount: limit,
        author: query,
        format: {
          hash: '%H',
          date: '%ai',
          message: '%s',
          author_name: '%an',
          author_email: '%ae'
        }
      });
      
      // Combine and deduplicate results
      const allCommits = [...messageResults.all, ...authorResults.all];
      const uniqueCommits = allCommits.filter((commit, index, self) => 
        index === self.findIndex(c => c.hash === commit.hash)
      );
      
      // Sort by date (newest first)
      uniqueCommits.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      return {
        query,
        commits: uniqueCommits.slice(0, limit).map(commit => ({
          hash: commit.hash,
          shortHash: commit.hash.substring(0, 7),
          message: commit.message,
          author: {
            name: commit.author_name,
            email: commit.author_email
          },
          date: commit.date,
          timestamp: new Date(commit.date).getTime()
        })),
        total: uniqueCommits.length,
        timestamp: Date.now()
      };
    }, cacheKey, 300); // Cache for 5 minutes
  }

  // Get file history
  async getFileHistory(repoPath, filePath, limit = 10) {
    const validatedPath = await this.validateRepository(repoPath);
    const cacheKey = `file_history:${validatedPath}:${filePath}:${limit}`;
    
    return this.executeGitOperation(async () => {
      const git = this.getGitInstance(validatedPath);
      
      // Check if file exists
      const fullFilePath = path.resolve(validatedPath, filePath);
      try {
        await fs.access(fullFilePath);
      } catch (error) {
        // File might be deleted, continue with history
      }
      
      const log = await git.log({
        file: filePath,
        maxCount: limit,
        format: {
          hash: '%H',
          date: '%ai',
          message: '%s',
          author_name: '%an',
          author_email: '%ae'
        }
      });
      
      return {
        file: filePath,
        commits: log.all.map(commit => ({
          hash: commit.hash,
          shortHash: commit.hash.substring(0, 7),
          message: commit.message,
          author: {
            name: commit.author_name,
            email: commit.author_email
          },
          date: commit.date,
          timestamp: new Date(commit.date).getTime()
        })),
        total: log.total,
        timestamp: Date.now()
      };
    }, cacheKey, 300); // Cache for 5 minutes
  }

  // Get commit diff
  async getCommitDiff(repoPath, commitHash) {
    const validatedPath = await this.validateRepository(repoPath);
    const cacheKey = `commit_diff:${validatedPath}:${commitHash}`;
    
    return this.executeGitOperation(async () => {
      const git = this.getGitInstance(validatedPath);
      const diff = await git.show([commitHash, '--stat']);
      
      return {
        commit: commitHash,
        diff,
        timestamp: Date.now()
      };
    }, cacheKey, 600); // Cache for 10 minutes
  }

  // Get repository information
  async getRepoInfo(repoPath) {
    const validatedPath = await this.validateRepository(repoPath);
    const cacheKey = `repo_info:${validatedPath}`;
    
    return this.executeGitOperation(async () => {
      const git = this.getGitInstance(validatedPath);
      
      // Get remote information
      const remotes = await git.getRemotes(true);
      
      // Get repository size (approximate)
      let repoSize = 0;
      try {
        const { stdout } = await execAsync(`du -sb "${validatedPath}/.git"`, { timeout: 5000 });
        repoSize = parseInt(stdout.split('\t')[0]);
      } catch (error) {
        logger.warn('Could not calculate repository size:', error.message);
      }
      
      // Get total commit count
      let totalCommits = 0;
      try {
        const { stdout } = await execAsync(`git -C "${validatedPath}" rev-list --all --count`, { timeout: 5000 });
        totalCommits = parseInt(stdout.trim());
      } catch (error) {
        logger.warn('Could not count total commits:', error.message);
      }
      
      return {
        path: validatedPath,
        remotes: remotes.map(remote => ({
          name: remote.name,
          refs: remote.refs
        })),
        size: repoSize,
        totalCommits,
        timestamp: Date.now()
      };
    }, cacheKey, 600); // Cache for 10 minutes
  }

  // Clear cache for a specific repository
  clearRepositoryCache(repoPath) {
    const validatedPath = path.resolve(repoPath);
    const keys = Array.from(this.cache.keys());
    const repoKeys = keys.filter(key => key.includes(validatedPath));
    
    repoKeys.forEach(key => {
      this.cache.delete(key);
      this.cacheTTL.delete(key);
    });
    
    logger.info(`Cleared ${repoKeys.length} cache entries for repository: ${validatedPath}`);
    return repoKeys.length;
  }

  // Get cache statistics
  getCacheStats() {
    return {
      keys: this.cache.size,
      entries: this.cache.size,
      ttlEntries: this.cacheTTL.size
    };
  }

  // Get service statistics
  getServiceStats() {
    return {
      gitInstances: this.gitInstances.size,
      currentOperations: this.currentOperations,
      maxConcurrentOperations: this.maxConcurrentOperations,
      cache: this.getCacheStats()
    };
  }

  // Cleanup resources
  cleanup() {
    this.cache.clear();
    this.cacheTTL.clear();
    this.gitInstances.clear();
    logger.info('Git Memory Service cleaned up');
  }
}