#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import simpleGit, { SimpleGit } from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';

interface MemoryEntry {
  id: string;
  content: string;
  metadata: Record<string, any>;
  timestamp: number;
}

class GitMemoryServer {
  private server: Server;
  private git: SimpleGit;
  private memory: Map<string, MemoryEntry> = new Map();
  private memoryFile: string;

  constructor() {
    this.server = new Server(
      {
        name: 'git-memory-mcp-server',
        version: '1.0.1',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.git = simpleGit();
    this.memoryFile = path.join(process.cwd(), '.git-memory.json');
    this.loadMemory();
    this.setupToolHandlers();
  }

  private loadMemory(): void {
    try {
      if (fs.existsSync(this.memoryFile)) {
        const data = fs.readFileSync(this.memoryFile, 'utf-8');
        const entries = JSON.parse(data);
        this.memory = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load memory:', error);
    }
  }

  private saveMemory(): void {
    try {
      const entries = Array.from(this.memory.entries());
      fs.writeFileSync(this.memoryFile, JSON.stringify(entries, null, 2));
    } catch (error) {
      console.error('Failed to save memory:', error);
    }
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
    const status = await this.git.status();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
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
    const entry: MemoryEntry = {
      id: key,
      content,
      metadata,
      timestamp: Date.now(),
    };
    
    this.memory.set(key, entry);
    this.saveMemory();
    
    return {
      content: [
        {
          type: 'text',
          text: `Stored memory entry with key: ${key}`,
        },
      ],
    };
  }

  private async handleMemoryRetrieve(args: any) {
    const { key } = args;
    const entry = this.memory.get(key);
    
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

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Git Memory MCP server running on stdio');
  }
}

const server = new GitMemoryServer();
server.run().catch(console.error);