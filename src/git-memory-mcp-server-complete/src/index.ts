#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { GitManager } from './git-manager.js';
import { MemoryManager } from './memory-manager.js';
import { IntegratedOperations } from './integrated-operations.js';

class GitMemoryServer {
  private server: Server;
  private gitManager: GitManager;
  private memoryManager: MemoryManager;
  private integratedOps: IntegratedOperations;

  constructor() {
    this.server = new Server(
      {
        name: 'git-memory-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.gitManager = new GitManager();
    this.memoryManager = new MemoryManager();
    this.integratedOps = new IntegratedOperations(this.gitManager, this.memoryManager);

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Git Tools
          {
            name: 'git_status',
            description: 'Get the current status of the Git repository',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Repository path (optional, defaults to current directory)',
                },
              },
            },
          },
          {
            name: 'git_log',
            description: 'View commit history',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Repository path' },
                maxCount: { type: 'number', description: 'Maximum number of commits to show' },
                oneline: { type: 'boolean', description: 'Show one line per commit' },
              },
            },
          },
          {
            name: 'git_diff',
            description: 'Show differences between commits, commit and working tree, etc',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Repository path' },
                staged: { type: 'boolean', description: 'Show staged changes' },
                file: { type: 'string', description: 'Specific file to diff' },
              },
            },
          },
          {
            name: 'git_commit',
            description: 'Create a new commit',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Repository path' },
                message: { type: 'string', description: 'Commit message' },
                addAll: { type: 'boolean', description: 'Add all changes before committing' },
              },
              required: ['message'],
            },
          },
          {
            name: 'git_branch',
            description: 'List, create, or delete branches',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Repository path' },
                action: { type: 'string', enum: ['list', 'create', 'delete', 'checkout'] },
                branchName: { type: 'string', description: 'Branch name for create/delete/checkout' },
              },
              required: ['action'],
            },
          },
          // Memory Tools
          {
            name: 'memory_store',
            description: 'Store information in memory with semantic indexing',
            inputSchema: {
              type: 'object',
              properties: {
                key: { type: 'string', description: 'Unique identifier for the memory' },
                content: { type: 'string', description: 'Content to store' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
                metadata: { type: 'object', description: 'Additional metadata' },
              },
              required: ['key', 'content'],
            },
          },
          {
            name: 'memory_search',
            description: 'Search stored memories using semantic similarity',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                limit: { type: 'number', description: 'Maximum number of results' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
              },
              required: ['query'],
            },
          },
          {
            name: 'memory_recall',
            description: 'Recall specific memory by key',
            inputSchema: {
              type: 'object',
              properties: {
                key: { type: 'string', description: 'Memory key to recall' },
              },
              required: ['key'],
            },
          },
          // Integrated Tools
          {
            name: 'smart_commit',
            description: 'Create an AI-enhanced commit with memory-based suggestions',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Repository path' },
                userMessage: { type: 'string', description: 'User-provided commit message (optional)' },
                addAll: { type: 'boolean', description: 'Add all changes before committing' },
              },
            },
          },
          {
            name: 'pattern_analysis',
            description: 'Analyze repository patterns using Git history and memory',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Repository path' },
                analysisType: { 
                  type: 'string', 
                  enum: ['commit_patterns', 'branch_patterns', 'file_patterns', 'author_patterns'],
                  description: 'Type of pattern analysis to perform'
                },
              },
              required: ['analysisType'],
            },
          },
          {
            name: 'context_search',
            description: 'Search with combined Git and memory context',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                path: { type: 'string', description: 'Repository path' },
                includeCommits: { type: 'boolean', description: 'Include commit history in search' },
                includeMemory: { type: 'boolean', description: 'Include memory in search' },
              },
              required: ['query'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        const typedArgs = args as any;

        try {
          switch (name) {
            // Git Tools
          case 'git_status':
            return await this.gitManager.getStatus(typedArgs?.path);
          case 'git_log':
            return await this.gitManager.getLog(typedArgs?.path, typedArgs?.maxCount, typedArgs?.oneline);
          case 'git_diff':
            return await this.gitManager.getDiff(typedArgs?.path, typedArgs?.staged, typedArgs?.file);
          case 'git_commit':
            if (!typedArgs?.message) throw new Error('Message is required for commit');
            return await this.gitManager.commit(typedArgs.message, typedArgs?.path, typedArgs?.addAll);
          case 'git_branch':
            if (!typedArgs?.action) throw new Error('Action is required for branch management');
            return await this.gitManager.manageBranch(typedArgs.action, typedArgs?.path, typedArgs?.branchName);

          // Memory Tools
          case 'memory_store':
            if (!typedArgs?.key || !typedArgs?.content) throw new Error('Key and content are required for memory store');
            return await this.memoryManager.store(typedArgs.key, typedArgs.content, typedArgs?.tags, typedArgs?.metadata);
          case 'memory_search':
            if (!typedArgs?.query) throw new Error('Query is required for memory search');
            return await this.memoryManager.search(typedArgs.query, typedArgs?.limit, typedArgs?.tags);
          case 'memory_recall':
            if (!typedArgs?.key) throw new Error('Key is required for memory recall');
            return await this.memoryManager.recall(typedArgs.key);

          // Integrated Tools
          case 'smart_commit':
            return await this.integratedOps.smartCommit(typedArgs?.path, typedArgs?.userMessage, typedArgs?.addAll);
          case 'pattern_analysis':
            if (!typedArgs?.analysisType) throw new Error('Analysis type is required for pattern analysis');
            return await this.integratedOps.analyzePatterns(typedArgs?.path, typedArgs.analysisType);
          case 'context_search':
            if (!typedArgs?.query) throw new Error('Query is required for context search');
            return await this.integratedOps.contextSearch(
              typedArgs.query, 
              typedArgs?.path, 
              typedArgs?.includeCommits, 
              typedArgs?.includeMemory
            );

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Git Memory MCP server running on stdio');
  }
}

const server = new GitMemoryServer();
server.run().catch(console.error);