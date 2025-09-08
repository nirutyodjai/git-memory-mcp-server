import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { AiSDKAdapter } from './AiSDKAdapter';
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
import { LLMProviderService } from './services/LLMProviderService';
import { SoloAIOrchestrator } from './services/SoloAIOrchestrator';
import express from 'express';
import { randomUUID } from 'crypto';

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
  private memoryCache: Map<string, { data: any; expiration: number; timestamp: number; }>;
  private readonly CACHE_SIZE = 1000;
  private readonly CACHE_TTL = 300000; // 5 minutes
  private compressionEnabled: boolean;
  private lastSaveTime: number;
  private readonly SAVE_DEBOUNCE_MS = 1000;
  private llmService?: LLMProviderService;
  private aiOrchestrator?: SoloAIOrchestrator;
  private app: express.Express;
  private port: number;

  private isInitialized: boolean = false;

  constructor() {
    this.port = parseInt(process.env.MCP_PORT || '9001', 10);
    this.app = express();
    this.app.use(express.json());

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    this.server = new Server({
      name: 'git-memory-mcp-server',
      version: '1.1.0',
      transport,
    });

    this.app.all('/mcp', (req, res) => {
      const reqWithAuth = req as express.Request & { auth?: any };
      transport.handleRequest(reqWithAuth, res, req.body);
    });

    this.git = simpleGit();
    this.memoryCache = new Map();
    this.memoryFile = path.join(process.cwd(), '.git-memory.json');
    this.compressionEnabled = process.env.MCP_COMPRESSION === 'true';
    this.lastSaveTime = 0;
    this.initialize();
    this.setupToolHandlers();
    
    // Cleanup cache periodically
    setInterval(() => this.cleanupCache(), 60000); // Every minute
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('GitMemoryServer already initialized');
      return;
    }

    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });

    this.app.listen(this.port, '127.0.0.1', () => {
      console.log(`Git Memory Server listening on port ${this.port}`);
    });

    try {
      await this.loadMemory();
      await this.initializeLLMServices();
      this.isInitialized = true;
      console.log('GitMemoryServer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize GitMemoryServer:', error);
      throw error;
    }
  }

  private async initializeLLMServices() {
    // TODO: Implement LLM service initialization
  }

  private async loadMemory(): Promise<void> {
    try {
      if (fs.existsSync(this.memoryFile)) {
        const fileContent = fs.readFileSync(this.memoryFile, 'utf-8');
        if (fileContent) {
          const memoryData = JSON.parse(fileContent);
          this.memoryCache = new Map(Object.entries(memoryData.cache));
          console.log('Memory loaded successfully');
        } else {
          this.memoryCache = new Map();
          console.log('Memory file is empty, starting with a new cache');
        }
      } else {
        this.memoryCache = new Map();
        console.log('No memory file found, starting with a new cache');
      }
    } catch (error) {
      console.error('Failed to load memory:', error);
      this.memoryCache = new Map();
    }
  }

  private async saveMemory(): Promise<void> {
    try {
      const memoryData = {
        cache: Object.fromEntries(this.memoryCache),
      };
      fs.writeFileSync(this.memoryFile, JSON.stringify(memoryData, null, 2));
      console.log('Memory saved successfully');
    } catch (error) {
      console.error('Failed to save memory:', error);
    }
  }

  private validateGitRepository(repoPath: string): boolean {
    return fs.existsSync(path.join(repoPath, '.git'));
  }

  private validateStringInput(input: any): input is string {
    return typeof input === 'string' && input.length > 0;
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (now > value.expiration) {
        this.memoryCache.delete(key);
      }
    }

    if (this.memoryCache.size > this.CACHE_SIZE) {
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, entries.length - this.CACHE_SIZE);
      for (const [key] of toRemove) {
        this.memoryCache.delete(key);
      }
    }
  }

  private getCachedMemory(key: string): any {
    const cached = this.memoryCache.get(key);
    if (cached && Date.now() < cached.expiration) {
      return cached.data;
    }
    return null;
  }

  private setCachedMemory(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    const expiration = Date.now() + ttl;
    this.memoryCache.set(key, { data, expiration, timestamp: Date.now() });
    this.debouncedSave();
  }

  private compressData(data: any): string {
    return zlib.deflateSync(JSON.stringify(data)).toString('base64');
  }

  private decompressData(data: string): any {
    return JSON.parse(zlib.inflateSync(Buffer.from(data, 'base64')).toString());
  }

  private debouncedSave = this.debounce(() => this.saveMemory(), 1000);

  private setupToolHandlers() {
    // TODO: Implement tool handlers
  }

  private debounce<F extends (...args: any[]) => any>(func: F, waitFor: number): (...args: Parameters<F>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<F>): void => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), waitFor);
    };
  }

  async start(): Promise<void> {
    await this.initialize();
    console.log(`Git Memory MCP Server started on port ${this.port}`);
  }
}

// Start the server
if (require.main === module) {
  const server = new GitMemoryServer();
  server.start().catch(console.error);
}