/**
 * Git Operations Service for MCP Protocol
 * Handles all Git-related operations with enhanced error handling and logging
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class GitOperationsService {
  constructor() {
    this.stats = {
      operations_count: 0,
      last_operation: null,
      errors_count: 0
    };
    this.isInitialized = false;
  }

  /**
   * Initialize the Git Operations Service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Check if git is available
      await this.executeGitCommand('git --version', process.cwd());
      this.isInitialized = true;
      logger.info('Git Operations Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Git Operations Service', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute Git command with proper error handling
   * @param {string} command - Git command to execute
   * @param {string} cwd - Working directory
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Command output
   */
  async executeGitCommand(command, cwd, options = {}) {
    try {
      this.stats.operations_count++;
      this.stats.last_operation = new Date().toISOString();
      
      logger.debug('Executing Git command', { command, cwd });
      
      const output = execSync(command, {
        cwd,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: options.timeout || 30000, // 30 second timeout
        ...options
      });
      
      return output.trim();
    } catch (error) {
      this.stats.errors_count++;
      logger.error('Git command failed', {
        command,
        cwd,
        error: error.message,
        stderr: error.stderr?.toString()
      });
      throw new Error(`Git command failed: ${error.message}`);
    }
  }

  /**
   * Check if directory is a Git repository
   * @param {string} repositoryPath - Path to check
   * @returns {Promise<boolean>} True if it's a Git repository
   */
  async isGitRepository(repositoryPath) {
    try {
      await this.executeGitCommand('git rev-parse --git-dir', repositoryPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the status of a Git repository
   * @param {string} repositoryPath - Path to the repository
   * @param {Object} options - Options for status command
   * @returns {Promise<Object>} Repository status
   */
  async getStatus(repositoryPath, options = {}) {
    try {
      if (!(await this.isGitRepository(repositoryPath))) {
        throw new Error('Not a Git repository');
      }

      const { includeUntracked = true } = options;
      
      // Get porcelain status for easy parsing
      const statusOutput = await this.executeGitCommand(
        `git status --porcelain${includeUntracked ? '' : ' --untracked-files=no'}`,
        repositoryPath
      );
      
      // Get current branch
      const currentBranch = await this.executeGitCommand(
        'git branch --show-current',
        repositoryPath
      );
      
      // Parse status output
      const files = [];
      const lines = statusOutput.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const status = line.substring(0, 2);
        const filePath = line.substring(3);
        
        files.push({
          path: filePath,
          status: this.parseFileStatus(status),
          raw_status: status
        });
      }
      
      // Get ahead/behind information
      let aheadBehind = { ahead: 0, behind: 0 };
      try {
        const aheadBehindOutput = await this.executeGitCommand(
          'git rev-list --left-right --count HEAD...@{upstream}',
          repositoryPath
        );
        const [ahead, behind] = aheadBehindOutput.split('\t').map(Number);
        aheadBehind = { ahead, behind };
      } catch (error) {
        // No upstream branch or other error
        logger.debug('Could not get ahead/behind info', { error: error.message });
      }
      
      return {
        repository_path: repositoryPath,
        current_branch: currentBranch,
        files,
        summary: {
          total_files: files.length,
          modified: files.filter(f => typeof f.status === 'string' && f.status.includes('modified')).length,
          added: files.filter(f => typeof f.status === 'string' && f.status.includes('added')).length,
          deleted: files.filter(f => typeof f.status === 'string' && f.status.includes('deleted')).length,
          untracked: files.filter(f => typeof f.status === 'string' && f.status.includes('untracked')).length,
          staged: files.filter(f => typeof f.status === 'string' && f.status.includes('staged')).length
        },
        upstream: aheadBehind,
        is_clean: files.length === 0
      };
    } catch (error) {
      logger.error('Git status operation failed', {
        repository_path: repositoryPath,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Parse Git file status codes
   * @param {string} status - Two-character status code
   * @returns {Array<string>} Human-readable status array
   */
  parseFileStatus(status) {
    const statusMap = {
      'M ': ['modified', 'staged'],
      ' M': ['modified'],
      'MM': ['modified', 'staged', 'modified_after_staging'],
      'A ': ['added', 'staged'],
      ' A': ['added'],
      'D ': ['deleted', 'staged'],
      ' D': ['deleted'],
      'R ': ['renamed', 'staged'],
      ' R': ['renamed'],
      'C ': ['copied', 'staged'],
      ' C': ['copied'],
      'U ': ['unmerged'],
      ' U': ['unmerged'],
      '??': ['untracked'],
      '!!': ['ignored']
    };
    
    return statusMap[status] || ['unknown'];
  }

  /**
   * Get commit history from a Git repository
   * @param {string} repositoryPath - Path to the repository
   * @param {Object} options - Options for log command
   * @returns {Promise<Array>} Array of commit objects
   */
  async getLog(repositoryPath, options = {}) {
    try {
      if (!(await this.isGitRepository(repositoryPath))) {
        throw new Error('Not a Git repository');
      }

      const { limit = 10, branch, since, until, author, grep } = options;
      
      let command = 'git log --pretty=format:"%H|%an|%ae|%ad|%s|%b" --date=iso';
      
      if (limit) command += ` -n ${limit}`;
      if (branch) command += ` ${branch}`;
      if (since) command += ` --since="${since}"`;
      if (until) command += ` --until="${until}"`;
      if (author) command += ` --author="${author}"`;
      if (grep) command += ` --grep="${grep}"`;
      
      const logOutput = await this.executeGitCommand(command, repositoryPath);
      
      if (!logOutput) {
        return [];
      }
      
      const commits = [];
      const commitBlocks = logOutput.split('\n\n');
      
      for (const block of commitBlocks) {
        const lines = block.split('\n');
        if (lines.length === 0) continue;
        
        const [hash, author, email, date, subject, ...bodyLines] = lines[0].split('|');
        const body = bodyLines.join('|').trim();
        
        commits.push({
          hash,
          author,
          email,
          date,
          subject,
          body,
          short_hash: hash.substring(0, 7)
        });
      }
      
      return commits;
    } catch (error) {
      logger.error('Git log operation failed', {
        repository_path: repositoryPath,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get differences between commits or working directory
   * @param {string} repositoryPath - Path to the repository
   * @param {Object} options - Options for diff command
   * @returns {Promise<Object>} Diff information
   */
  async getDiff(repositoryPath, options = {}) {
    try {
      if (!(await this.isGitRepository(repositoryPath))) {
        throw new Error('Not a Git repository');
      }

      const { fromCommit, toCommit, filePath, staged = false } = options;
      
      let command = 'git diff';
      
      if (staged) {
        command += ' --cached';
      } else if (fromCommit && toCommit) {
        command += ` ${fromCommit}..${toCommit}`;
      } else if (fromCommit) {
        command += ` ${fromCommit}`;
      }
      
      if (filePath) {
        command += ` -- "${filePath}"`;
      }
      
      const diffOutput = await this.executeGitCommand(command, repositoryPath);
      
      // Get diff stats
      let statsCommand = command.replace('git diff', 'git diff --stat');
      const statsOutput = await this.executeGitCommand(statsCommand, repositoryPath);
      
      return {
        repository_path: repositoryPath,
        from_commit: fromCommit,
        to_commit: toCommit,
        file_path: filePath,
        diff: diffOutput,
        stats: statsOutput,
        has_changes: diffOutput.length > 0
      };
    } catch (error) {
      logger.error('Git diff operation failed', {
        repository_path: repositoryPath,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Clone a Git repository
   * @param {string} repositoryUrl - URL of the repository to clone
   * @param {string} destinationPath - Local path to clone to
   * @param {Object} options - Clone options
   * @returns {Promise<Object>} Clone result
   */
  async cloneRepository(repositoryUrl, destinationPath, options = {}) {
    try {
      const { branch, depth, recursive = true } = options;
      
      // Check if destination already exists
      try {
        await fs.access(destinationPath);
        throw new Error('Destination path already exists');
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
      
      let command = `git clone "${repositoryUrl}" "${destinationPath}"`;
      
      if (branch) command += ` --branch ${branch}`;
      if (depth) command += ` --depth ${depth}`;
      if (recursive) command += ' --recursive';
      
      const output = await this.executeGitCommand(command, process.cwd(), {
        timeout: 300000 // 5 minute timeout for cloning
      });
      
      // Verify the clone was successful
      const isRepo = await this.isGitRepository(destinationPath);
      if (!isRepo) {
        throw new Error('Clone completed but destination is not a valid Git repository');
      }
      
      return {
        repository_url: repositoryUrl,
        destination_path: destinationPath,
        branch: branch || 'default',
        success: true,
        output
      };
    } catch (error) {
      logger.error('Git clone operation failed', {
        repository_url: repositoryUrl,
        destination_path: destinationPath,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create a new commit
   * @param {string} repositoryPath - Path to the repository
   * @param {string} message - Commit message
   * @param {Object} options - Commit options
   * @returns {Promise<Object>} Commit result
   */
  async createCommit(repositoryPath, message, options = {}) {
    try {
      if (!(await this.isGitRepository(repositoryPath))) {
        throw new Error('Not a Git repository');
      }

      const { files, authorName, authorEmail, allowEmpty = false } = options;
      
      // Add files to staging area
      if (files && files.length > 0) {
        for (const file of files) {
          await this.executeGitCommand(`git add "${file}"`, repositoryPath);
        }
      } else {
        // Add all changes
        await this.executeGitCommand('git add .', repositoryPath);
      }
      
      // Set author if provided
      let commitCommand = 'git commit';
      if (authorName && authorEmail) {
        commitCommand += ` --author="${authorName} <${authorEmail}>"`;
      }
      if (allowEmpty) {
        commitCommand += ' --allow-empty';
      }
      commitCommand += ` -m "${message.replace(/"/g, '\\"')}"`;
      
      const output = await this.executeGitCommand(commitCommand, repositoryPath);
      
      // Get the commit hash
      const hash = await this.executeGitCommand('git rev-parse HEAD', repositoryPath);
      
      return {
        repository_path: repositoryPath,
        message,
        hash,
        short_hash: hash.substring(0, 7),
        author: authorName,
        email: authorEmail,
        timestamp: new Date().toISOString(),
        output
      };
    } catch (error) {
      logger.error('Git commit operation failed', {
        repository_path: repositoryPath,
        message,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * List branches in the repository
   * @param {string} repositoryPath - Path to the repository
   * @param {Object} options - List options
   * @returns {Promise<Object>} Branch information
   */
  async listBranches(repositoryPath, options = {}) {
    try {
      if (!(await this.isGitRepository(repositoryPath))) {
        throw new Error('Not a Git repository');
      }

      const { includeRemote = true } = options;
      
      // Get local branches
      const localOutput = await this.executeGitCommand(
        'git branch --format="%(refname:short)|%(HEAD)|%(upstream:short)"',
        repositoryPath
      );
      
      const localBranches = localOutput.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [name, isCurrent, upstream] = line.split('|');
          return {
            name,
            type: 'local',
            is_current: isCurrent === '*',
            upstream: upstream || null
          };
        });
      
      let remoteBranches = [];
      if (includeRemote) {
        try {
          const remoteOutput = await this.executeGitCommand(
            'git branch -r --format="%(refname:short)"',
            repositoryPath
          );
          
          remoteBranches = remoteOutput.split('\n')
            .filter(line => line.trim() && typeof line === 'string' && !line.includes('HEAD'))
            .map(name => ({
              name: name.trim(),
              type: 'remote',
              is_current: false,
              upstream: null
            }));
        } catch (error) {
          logger.debug('Could not fetch remote branches', { error: error.message });
        }
      }
      
      const currentBranch = localBranches.find(b => b.is_current)?.name || null;
      
      return {
        repository_path: repositoryPath,
        current_branch: currentBranch,
        local_branches: localBranches,
        remote_branches: remoteBranches,
        total_count: localBranches.length + remoteBranches.length
      };
    } catch (error) {
      logger.error('Git list branches operation failed', {
        repository_path: repositoryPath,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create a new branch
   * @param {string} repositoryPath - Path to the repository
   * @param {string} branchName - Name of the new branch
   * @param {string} fromBranch - Branch to create from (optional)
   * @returns {Promise<Object>} Branch creation result
   */
  async createBranch(repositoryPath, branchName, fromBranch = null) {
    try {
      if (!(await this.isGitRepository(repositoryPath))) {
        throw new Error('Not a Git repository');
      }

      let command = `git checkout -b "${branchName}"`;
      if (fromBranch) {
        command += ` "${fromBranch}"`;
      }
      
      const output = await this.executeGitCommand(command, repositoryPath);
      
      return {
        repository_path: repositoryPath,
        branch_name: branchName,
        from_branch: fromBranch,
        success: true,
        output
      };
    } catch (error) {
      logger.error('Git create branch operation failed', {
        repository_path: repositoryPath,
        branch_name: branchName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Switch to a different branch
   * @param {string} repositoryPath - Path to the repository
   * @param {string} branchName - Name of the branch to switch to
   * @returns {Promise<Object>} Switch result
   */
  async switchBranch(repositoryPath, branchName) {
    try {
      if (!(await this.isGitRepository(repositoryPath))) {
        throw new Error('Not a Git repository');
      }

      const output = await this.executeGitCommand(
        `git checkout "${branchName}"`,
        repositoryPath
      );
      
      return {
        repository_path: repositoryPath,
        branch_name: branchName,
        success: true,
        output
      };
    } catch (error) {
      logger.error('Git switch branch operation failed', {
        repository_path: repositoryPath,
        branch_name: branchName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete a branch
   * @param {string} repositoryPath - Path to the repository
   * @param {string} branchName - Name of the branch to delete
   * @param {boolean} force - Force delete even if not merged
   * @returns {Promise<Object>} Delete result
   */
  async deleteBranch(repositoryPath, branchName, force = false) {
    try {
      if (!(await this.isGitRepository(repositoryPath))) {
        throw new Error('Not a Git repository');
      }

      const deleteFlag = force ? '-D' : '-d';
      const output = await this.executeGitCommand(
        `git branch ${deleteFlag} "${branchName}"`,
        repositoryPath
      );
      
      return {
        repository_path: repositoryPath,
        branch_name: branchName,
        force,
        success: true,
        output
      };
    } catch (error) {
      logger.error('Git delete branch operation failed', {
        repository_path: repositoryPath,
        branch_name: branchName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check if the service is healthy
   * @returns {Promise<boolean>} Health status
   */
  async isHealthy() {
    try {
      // Test basic Git functionality
      const testCommand = 'git --version';
      await this.executeGitCommand(testCommand, process.cwd());
      return true;
    } catch (error) {
      logger.error('GitOperationsService health check failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get service statistics
   * @returns {Promise<Object>} Service statistics
   */
  async getStats() {
    return {
      operations_count: this.stats.operations_count,
      errors_count: this.stats.errors_count,
      last_operation: this.stats.last_operation,
      error_rate: this.stats.operations_count > 0 
        ? (this.stats.errors_count / this.stats.operations_count * 100).toFixed(2) + '%'
        : '0%',
      uptime: process.uptime()
    };
  }
}

module.exports = GitOperationsService;