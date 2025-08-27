import { simpleGit, SimpleGit, StatusResult, LogResult } from 'simple-git';
import * as path from 'path';
import * as fs from 'fs-extra';

export class GitManager {
  private getGit(repoPath?: string): SimpleGit {
    const workingDir = repoPath || process.cwd();
    return simpleGit(workingDir);
  }

  async getStatus(repoPath?: string) {
    try {
      const git = this.getGit(repoPath);
      const status: StatusResult = await git.status();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
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
              created: status.created,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting git status: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getLog(repoPath?: string, maxCount?: number, oneline?: boolean): Promise<any> {
    try {
      const git = this.getGit(repoPath);
      const options: any = {};
      
      if (maxCount) {
        options.maxCount = maxCount;
      }
      if (oneline) {
        options.format = { hash: '%H', date: '%ai', message: '%s', author_name: '%an' };
      }

      const log: LogResult = await git.log(options);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              total: log.total,
              latest: log.latest,
              all: log.all.map(commit => ({
                hash: commit.hash,
                date: commit.date,
                message: commit.message,
                author_name: commit.author_name,
                author_email: commit.author_email,
                refs: commit.refs,
              })),
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting git log: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getDiff(repoPath?: string, staged?: boolean, file?: string): Promise<any> {
    try {
      const git = this.getGit(repoPath);
      let diff: string;

      if (staged) {
        const args = ['--cached', file].filter((arg): arg is string => arg !== undefined);
        diff = await git.diff(args);
      } else {
        const args = [file].filter((arg): arg is string => arg !== undefined);
        diff = await git.diff(args);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: diff || 'No differences found',
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting git diff: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async commit(message: string, repoPath?: string, addAll?: boolean): Promise<any> {
    try {
      const git = this.getGit(repoPath);
      
      if (addAll) {
        await git.add('.');
      }
      
      const result = await git.commit(message);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              commit: result.commit,
              summary: result.summary,
              author: result.author,
              root: result.root,
              branch: result.branch,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating commit: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async manageBranch(action: string, repoPath?: string, branchName?: string): Promise<any> {
    try {
      const git = this.getGit(repoPath);
      let result: any;

      switch (action) {
        case 'list':
          result = await git.branch();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  current: result.current,
                  all: result.all,
                  branches: result.branches,
                }, null, 2),
              },
            ],
          };

        case 'create':
          if (!branchName) {
            throw new Error('Branch name is required for create action');
          }
          await git.checkoutLocalBranch(branchName);
          return {
            content: [
              {
                type: 'text',
                text: `Created and switched to branch: ${branchName}`,
              },
            ],
          };

        case 'delete':
          if (!branchName) {
            throw new Error('Branch name is required for delete action');
          }
          await git.deleteLocalBranch(branchName);
          return {
            content: [
              {
                type: 'text',
                text: `Deleted branch: ${branchName}`,
              },
            ],
          };

        case 'checkout':
          if (!branchName) {
            throw new Error('Branch name is required for checkout action');
          }
          await git.checkout(branchName);
          return {
            content: [
              {
                type: 'text',
                text: `Switched to branch: ${branchName}`,
              },
            ],
          };

        default:
          throw new Error(`Unknown branch action: ${action}`);
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error managing branch: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async add(repoPath?: string, files: string | string[] = '.'): Promise<any> {
    try {
      const git = this.getGit(repoPath);
      await git.add(files);
      
      return {
        content: [
          {
            type: 'text',
            text: `Added files: ${Array.isArray(files) ? files.join(', ') : files}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error adding files: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async init(repoPath?: string): Promise<any> {
    try {
      const workingDir = repoPath || process.cwd();
      const git = simpleGit(workingDir);
      await git.init();
      
      return {
        content: [
          {
            type: 'text',
            text: `Initialized Git repository in ${workingDir}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error initializing repository: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Helper method to get repository information for memory integration
  async getRepoInfo(repoPath?: string): Promise<any> {
    try {
      const git = this.getGit(repoPath);
      const status = await git.status();
      const log = await git.log({ maxCount: 10 });
      const branches = await git.branch();
      
      return {
        status,
        recentCommits: log.all,
        branches: branches.all,
        currentBranch: branches.current,
      };
    } catch (error: any) {
      throw new Error(`Error getting repository info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}