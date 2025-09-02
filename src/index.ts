#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import simpleGit from 'simple-git';
type SimpleGit = ReturnType<typeof simpleGit>;
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

interface MemoryEntry {
  id: string;
  content: string;
  metadata: Record<string, any>;
  timestamp: number;
}

export class GitMemoryServer {
  private server: Server;
  private git: SimpleGit;
  private memory: Map<string, MemoryEntry> = new Map();
  private memoryFile: string;
  private memoryCache: Map<string, { data: MemoryEntry; lastAccessed: number }>;
  private readonly CACHE_SIZE = 1000;
  private readonly CACHE_TTL = 300000; // 5 minutes
  private compressionEnabled: boolean;
  private lastSaveTime: number;
  private readonly SAVE_DEBOUNCE_MS = 1000;

  private isInitialized: boolean = false;

  constructor() {
    this.server = new Server(
      {
        name: 'git-memory-mcp-server',
        version: '1.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.git = simpleGit();
    this.memoryCache = new Map();
    this.memoryFile = path.join(process.cwd(), '.git-memory.json');
    this.compressionEnabled = process.env.MCP_COMPRESSION === 'true';
    this.lastSaveTime = 0;
    this.initializeAsync();
    this.setupToolHandlers();
    
    // Cleanup cache periodically
    setInterval(() => this.cleanupCache(), 60000); // Every minute
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('GitMemoryServer already initialized');
      return;
    }

    try {
      await this.loadMemory();
      this.isInitialized = true;
      console.log('GitMemoryServer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize GitMemoryServer:', error);
      throw error;
    }
  }

  private async initializeAsync(): Promise<void> {
    await this.loadMemory();
  }

  private async loadMemory(): Promise<void> {
    try {
      if (fs.existsSync(this.memoryFile)) {
        let data: string;
        
        if (this.compressionEnabled && this.memoryFile.endsWith('.gz')) {
          const compressedData = await fs.promises.readFile(this.memoryFile);
          data = await this.decompressData(compressedData);
        } else {
          data = await fs.promises.readFile(this.memoryFile, 'utf8');
        }
        
        const entries = JSON.parse(data);
        this.memory = new Map(entries);
        
        // Pre-populate cache with frequently accessed items
        const recentEntries = entries
          .sort((a: any, b: any) => new Date(b[1].timestamp).getTime() - new Date(a[1].timestamp).getTime())
          .slice(0, Math.min(100, this.CACHE_SIZE / 2));
        
        recentEntries.forEach(([key, entry]: [string, MemoryEntry]) => {
          this.setCachedMemory(key, entry);
        });
      }
    } catch (error) {
      console.error('Failed to load memory:', error);
    }
  }

  private async saveMemory(): Promise<void> {
    try {
      const entries = Array.from(this.memory.entries());
      const jsonData = JSON.stringify(entries, null, 2);
      
      if (this.compressionEnabled) {
        const compressedData = await this.compressData(jsonData);
        const compressedFile = this.memoryFile.replace('.json', '.json.gz');
        await fs.promises.writeFile(compressedFile, compressedData);
        
        // Remove uncompressed file if it exists
        if (fs.existsSync(this.memoryFile) && this.memoryFile !== compressedFile) {
          await fs.promises.unlink(this.memoryFile);
        }
      } else {
        await fs.promises.writeFile(this.memoryFile, jsonData, 'utf8');
      }
    } catch (error) {
      console.error('Failed to save memory:', error);
    }
  }

  private async validateGitRepository(): Promise<void> {
    try {
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          'Current directory is not a git repository. Please run this command from within a git repository.'
        );
      }
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to validate git repository: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private validateStringInput(value: any, fieldName: string, maxLength?: number): void {
    if (!value || typeof value !== 'string') {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `${fieldName} must be a non-empty string`
      );
    }
    
    if (maxLength && value.length > maxLength) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `${fieldName} must be ${maxLength} characters or less`
      );
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, cached] of this.memoryCache.entries()) {
      if (now - cached.lastAccessed > this.CACHE_TTL) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.memoryCache.delete(key));
    
    // If cache is still too large, remove oldest entries
    if (this.memoryCache.size > this.CACHE_SIZE) {
      const entries = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const toRemove = entries.slice(0, entries.length - this.CACHE_SIZE);
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
    }
  }

  private getCachedMemory(key: string): MemoryEntry | null {
    const cached = this.memoryCache.get(key);
    if (cached) {
      cached.lastAccessed = Date.now();
      return cached.data;
    }
    return null;
  }

  private setCachedMemory(key: string, data: MemoryEntry): void {
    this.memoryCache.set(key, {
      data: { ...data },
      lastAccessed: Date.now()
    });
  }

  private async compressData(data: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      zlib.gzip(data, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  private async decompressData(data: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      zlib.gunzip(data, (err, result) => {
        if (err) reject(err);
        else resolve(result.toString());
      });
    });
  }

  private async debouncedSave(): Promise<void> {
    const now = Date.now();
    if (now - this.lastSaveTime < this.SAVE_DEBOUNCE_MS) {
      return;
    }
    this.lastSaveTime = now;
    await this.saveMemory();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'git_status',
          description: 'Get the current git status of the repository',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'git_log',
          description: 'Get git commit history',
          inputSchema: {
            type: 'object',
            properties: {
              maxCount: {
                type: 'number',
                description: 'Maximum number of commits to retrieve',
                default: 10,
              },
            },
          },
        },
        {
          name: 'git_diff',
          description: 'Get git diff for staged or unstaged changes',
          inputSchema: {
            type: 'object',
            properties: {
              staged: {
                type: 'boolean',
                description: 'Show staged changes (--cached)',
                default: false,
              },
            },
          },
        },
        {
          name: 'memory_store',
          description: 'Store information in memory with metadata',
          inputSchema: {
            type: 'object',
            properties: {
              key: {
                type: 'string',
                description: 'Unique identifier for the memory entry',
              },
              content: {
                type: 'string',
                description: 'Content to store',
              },
              metadata: {
                type: 'object',
                description: 'Additional metadata',
                default: {},
              },
            },
            required: ['key', 'content'],
          },
        },
        {
          name: 'memory_retrieve',
          description: 'Retrieve information from memory',
          inputSchema: {
            type: 'object',
            properties: {
              key: {
                type: 'string',
                description: 'Key of the memory entry to retrieve',
              },
            },
            required: ['key'],
          },
        },
        {
          name: 'memory_list',
          description: 'List all memory entries',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'memory_delete',
          description: 'Delete a memory entry',
          inputSchema: {
            type: 'object',
            properties: {
              key: {
                type: 'string',
                description: 'Key of the memory entry to delete',
              },
            },
            required: ['key'],
          },
        },
        {
          name: 'memory_search',
          description: 'Search memory entries by content or metadata',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query to match against content',
              },
              metadata: {
                type: 'object',
                description: 'Metadata filters to match',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return',
                default: 10,
              },
              sortBy: {
                type: 'string',
                enum: ['timestamp', 'key'],
                description: 'Sort results by field',
                default: 'timestamp',
              },
              sortOrder: {
                type: 'string',
                enum: ['asc', 'desc'],
                description: 'Sort order',
                default: 'desc',
              },
            },
          },
        },
        {
          name: 'memory_filter',
          description: 'Filter memory entries with advanced criteria',
          inputSchema: {
            type: 'object',
            properties: {
              dateRange: {
                type: 'object',
                properties: {
                  from: {
                    type: 'string',
                    description: 'Start date (ISO string)',
                  },
                  to: {
                    type: 'string',
                    description: 'End date (ISO string)',
                  },
                },
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter by tags in metadata',
              },
              contentType: {
                type: 'string',
                description: 'Filter by content type in metadata',
              },
              minLength: {
                type: 'number',
                description: 'Minimum content length',
              },
              maxLength: {
                type: 'number',
                description: 'Maximum content length',
              },
            },
          },
        },
        {
          name: 'git_add',
          description: 'Add files to git staging area',
          inputSchema: {
            type: 'object',
            properties: {
              files: {
                type: 'array',
                items: { type: 'string' },
                description: 'Files to add (use ["." ] for all files)',
                default: ['.'],
              },
            },
          },
        },
        {
          name: 'git_commit',
          description: 'Commit staged changes',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Commit message',
              },
              author: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
                description: 'Author information (optional)',
              },
            },
            required: ['message'],
          },
        },
        {
          name: 'git_push',
          description: 'Push commits to remote repository',
          inputSchema: {
            type: 'object',
            properties: {
              remote: {
                type: 'string',
                description: 'Remote name',
                default: 'origin',
              },
              branch: {
                type: 'string',
                description: 'Branch name (current branch if not specified)',
              },
              force: {
                type: 'boolean',
                description: 'Force push',
                default: false,
              },
            },
          },
        },
        {
          name: 'git_pull',
          description: 'Pull changes from remote repository',
          inputSchema: {
            type: 'object',
            properties: {
              remote: {
                type: 'string',
                description: 'Remote name',
                default: 'origin',
              },
              branch: {
                type: 'string',
                description: 'Branch name (current branch if not specified)',
              },
            },
          },
        },
        {
          name: 'git_branch',
          description: 'Manage git branches',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['list', 'create', 'delete', 'checkout'],
                description: 'Branch action to perform',
                default: 'list',
              },
              name: {
                type: 'string',
                description: 'Branch name (required for create, delete, checkout)',
              },
              force: {
                type: 'boolean',
                description: 'Force delete branch',
                default: false,
              },
            },
          },
        },
        {
          name: 'git_merge',
          description: 'Merge branches',
          inputSchema: {
            type: 'object',
            properties: {
              branch: {
                type: 'string',
                description: 'Branch to merge into current branch',
              },
              noFastForward: {
                type: 'boolean',
                description: 'Disable fast-forward merge',
                default: false,
              },
            },
            required: ['branch'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'git_status':
            return await this.handleGitStatus();
          case 'git_log':
            return await this.handleGitLog(args);
          case 'git_diff':
            return await this.handleGitDiff(args);
          case 'memory_store':
            return await this.handleMemoryStore(args);
          case 'memory_retrieve':
            return await this.handleMemoryRetrieve(args);
          case 'memory_list':
            return await this.handleMemoryList();
          case 'memory_delete':
            return await this.handleMemoryDelete(args);
          case 'memory_search':
            return await this.handleMemorySearch(args);
          case 'memory_filter':
            return await this.handleMemoryFilter(args);
          case 'git_add':
            return await this.handleGitAdd(args);
          case 'git_commit':
            return await this.handleGitCommit(args);
          case 'git_push':
            return await this.handleGitPush(args);
          case 'git_pull':
            return await this.handleGitPull(args);
          case 'git_branch':
            return await this.handleGitBranch(args);
          case 'git_merge':
            return await this.handleGitMerge(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async handleGitStatus() {
    try {
      await this.validateGitRepository();
      
      const status = await this.git.status();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Git status failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleGitLog(args: any) {
    const maxCount = args?.maxCount || 10;
    const log = await this.git.log({ maxCount });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(log, null, 2),
        },
      ],
    };
  }

  private async handleGitDiff(args: any) {
    const staged = args?.staged || false;
    const diff = staged ? await this.git.diff(['--cached']) : await this.git.diff();
    return {
      content: [
        {
          type: 'text',
          text: diff,
        },
      ],
    };
  }

  private async handleMemoryStore(args: any) {
    const { key, content, metadata = {} } = args;
    
    // Input validation using helper methods
    this.validateStringInput(key, 'Key', 255);
    this.validateStringInput(content, 'Content', 1000000); // 1MB limit
    
    try {
      const entry: MemoryEntry = {
        id: key,
        content,
        metadata,
        timestamp: Date.now(),
      };
      
      this.memory.set(key, entry);
      this.setCachedMemory(key, entry);
      await this.debouncedSave();
      
      return {
        content: [
          {
            type: 'text',
            text: `Stored memory entry with key: ${key}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to store memory entry: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleMemoryRetrieve(args: any) {
    const { key } = args;
    
    // Try cache first
    let entry = this.getCachedMemory(key);
    
    // If not in cache, get from memory and cache it
    if (!entry) {
      const memoryEntry = this.memory.get(key);
      if (memoryEntry) {
        entry = memoryEntry;
        this.setCachedMemory(key, entry);
      }
    }
    
    if (!entry) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Memory entry not found: ${key}`
      );
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(entry, null, 2),
        },
      ],
    };
  }

  private async handleMemoryList() {
    const entries = Array.from(this.memory.values());
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(entries, null, 2),
        },
      ],
    };
  }

  private async handleMemoryDelete(args: any) {
    const { key } = args;
    const deleted = this.memory.delete(key);
    
    if (!deleted) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Memory entry not found: ${key}`
      );
    }
    
    this.saveMemory();
    
    return {
      content: [
        {
          type: 'text',
          text: `Deleted memory entry with key: ${key}`,
        },
      ],
    };
  }

  private async handleMemorySearch(args: any) {
    const { query, metadata, limit = 10, sortBy = 'timestamp', sortOrder = 'desc' } = args;
    
    let results = Array.from(this.memory.values());
    
    // Filter by content query
    if (query) {
      const searchQuery = query.toLowerCase();
      results = results.filter(entry => 
        entry.content.toLowerCase().includes(searchQuery) ||
        entry.id.toLowerCase().includes(searchQuery)
      );
    }
    
    // Filter by metadata
    if (metadata) {
      results = results.filter(entry => {
        return Object.entries(metadata).every(([key, value]) => {
          return entry.metadata[key] === value;
        });
      });
    }
    
    // Sort results
    results.sort((a, b) => {
      let aValue, bValue;
      if (sortBy === 'timestamp') {
        aValue = a.timestamp;
        bValue = b.timestamp;
      } else if (sortBy === 'key') {
        aValue = a.id;
        bValue = b.id;
      } else {
        aValue = a.timestamp;
        bValue = b.timestamp;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Limit results
    results = results.slice(0, limit);
    
    return {
       content: [
         {
           type: 'text',
           text: JSON.stringify({
             total: results.length,
             results: results
           }, null, 2),
         },
       ],
     };
   }

   private async handleMemoryFilter(args: any) {
     const { dateRange, tags, contentType, minLength, maxLength } = args;
     
     let results = Array.from(this.memory.values());
     
     // Filter by date range
     if (dateRange) {
       const fromDate = dateRange.from ? new Date(dateRange.from) : null;
       const toDate = dateRange.to ? new Date(dateRange.to) : null;
       
       results = results.filter(entry => {
         const entryDate = new Date(entry.timestamp);
         if (fromDate && entryDate < fromDate) return false;
         if (toDate && entryDate > toDate) return false;
         return true;
       });
     }
     
     // Filter by tags
     if (tags && tags.length > 0) {
       results = results.filter(entry => {
          const entryTags = entry.metadata.tags || [];
          return tags.some((tag: string) => entryTags.includes(tag));
        });
     }
     
     // Filter by content type
     if (contentType) {
       results = results.filter(entry => {
         return entry.metadata.contentType === contentType;
       });
     }
     
     // Filter by content length
     if (minLength !== undefined) {
       results = results.filter(entry => entry.content.length >= minLength);
     }
     
     if (maxLength !== undefined) {
       results = results.filter(entry => entry.content.length <= maxLength);
     }
     
     return {
       content: [
         {
           type: 'text',
           text: JSON.stringify({
             total: results.length,
             filters: { dateRange, tags, contentType, minLength, maxLength },
             results: results
           }, null, 2),
         },
       ],
     };
   }

  private async handleGitAdd(args: any) {
    const { files = ['.'] } = args;
    
    try {
      await this.validateGitRepository();
      
      // Validate files input
      if (!Array.isArray(files) && typeof files !== 'string') {
        throw new McpError(
          ErrorCode.InvalidRequest,
          'Files must be a string or array of strings'
        );
      }
      
      const filesToAdd = Array.isArray(files) ? files : [files];
      
      // Validate each file path
      for (const file of filesToAdd) {
        if (typeof file !== 'string' || file.trim() === '') {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'Each file path must be a non-empty string'
          );
        }
      }
      
      await this.git.add(filesToAdd);
      
      return {
        content: [
          {
            type: 'text',
            text: `Added files to staging: ${filesToAdd.join(', ')}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Git add failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleGitCommit(args: any) {
    const { message, author } = args;
    try {
      const options: any = { '-m': message };
      if (author) {
        options['--author'] = `${author.name} <${author.email}>`;
      }
      const result = await this.git.commit(message, undefined, options);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to commit: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleGitPush(args: any) {
    const { remote = 'origin', branch, force = false } = args;
    try {
      const options: any = {};
      if (force) options['--force'] = null;
      
      const result = branch 
        ? await this.git.push(remote, branch, options)
        : await this.git.push(options);
      
      return {
        content: [
          {
            type: 'text',
            text: `Successfully pushed to ${remote}${branch ? `/${branch}` : ''}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to push: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleGitPull(args: any) {
    const { remote = 'origin', branch } = args;
    try {
      const result = branch 
        ? await this.git.pull(remote, branch)
        : await this.git.pull();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to pull: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleGitBranch(args: any) {
    const { action = 'list', name, force = false } = args;
    try {
      let result: any;
      
      switch (action) {
        case 'list':
          result = await this.git.branch();
          break;
        case 'create':
          if (!name) throw new Error('Branch name is required for create action');
          result = await this.git.checkoutLocalBranch(name);
          break;
        case 'delete':
          if (!name) throw new Error('Branch name is required for delete action');
          result = await this.git.deleteLocalBranch(name, force);
          break;
        case 'checkout':
          if (!name) throw new Error('Branch name is required for checkout action');
          result = await this.git.checkout(name);
          break;
        default:
          throw new Error(`Unknown branch action: ${action}`);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to execute branch operation: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleGitMerge(args: any) {
    const { branch, noFastForward = false } = args;
    try {
      const options: string[] = [];
      if (noFastForward) options.push('--no-ff');
      
      const result = await this.git.merge([branch, ...options]);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to merge: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Git Memory MCP server running on stdio');
  }
}

// Export the class for use in other modules
export default GitMemoryServer;

// Only run the server if this file is executed directly
if (require.main === module) {
  const server = new GitMemoryServer();
  server.run().catch(console.error);
}