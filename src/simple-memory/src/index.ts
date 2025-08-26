#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define memory file path
const defaultMemoryPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'memory-data.json');
const MEMORY_FILE_PATH = process.env.MEMORY_FILE_PATH || defaultMemoryPath;

interface MemoryEntry {
  key: string;
  value: any;
  ttl?: number;
  tags?: string[];
  metadata?: any;
  createdAt: number;
  updatedAt: number;
  accessCount: number;
}

interface MemoryStore {
  [key: string]: MemoryEntry;
}

class SimpleMemoryManager {
  private async loadMemory(): Promise<MemoryStore> {
    try {
      const data = await fs.readFile(MEMORY_FILE_PATH, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as any).code === "ENOENT") {
        return {};
      }
      throw error;
    }
  }

  private async saveMemory(store: MemoryStore): Promise<void> {
    await fs.writeFile(MEMORY_FILE_PATH, JSON.stringify(store, null, 2));
  }

  private isExpired(entry: MemoryEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() > entry.createdAt + entry.ttl * 1000;
  }

  async set(key: string, value: any, ttl?: number, tags?: string[], metadata?: any): Promise<boolean> {
    const store = await this.loadMemory();
    const now = Date.now();
    
    store[key] = {
      key,
      value,
      ttl,
      tags,
      metadata,
      createdAt: store[key]?.createdAt || now,
      updatedAt: now,
      accessCount: store[key]?.accessCount || 0
    };
    
    await this.saveMemory(store);
    return true;
  }

  async get(key: string, defaultValue?: any): Promise<any> {
    const store = await this.loadMemory();
    const entry = store[key];
    
    if (!entry) {
      return defaultValue;
    }
    
    if (this.isExpired(entry)) {
      delete store[key];
      await this.saveMemory(store);
      return defaultValue;
    }
    
    // Update access count
    entry.accessCount++;
    entry.updatedAt = Date.now();
    await this.saveMemory(store);
    
    return entry.value;
  }

  async delete(key: string): Promise<boolean> {
    const store = await this.loadMemory();
    if (store[key]) {
      delete store[key];
      await this.saveMemory(store);
      return true;
    }
    return false;
  }

  async query(pattern?: string, tags?: string[], limit: number = 100, offset: number = 0): Promise<MemoryEntry[]> {
    const store = await this.loadMemory();
    let entries = Object.values(store).filter(entry => !this.isExpired(entry));
    
    if (pattern) {
      const regex = new RegExp(pattern, 'i');
      entries = entries.filter(entry => regex.test(entry.key));
    }
    
    if (tags && tags.length > 0) {
      entries = entries.filter(entry => 
        entry.tags && tags.some(tag => entry.tags!.includes(tag))
      );
    }
    
    return entries.slice(offset, offset + limit);
  }

  async search(query: string, fuzzy: boolean = false, limit: number = 50): Promise<MemoryEntry[]> {
    const store = await this.loadMemory();
    let entries = Object.values(store).filter(entry => !this.isExpired(entry));
    
    const searchRegex = new RegExp(fuzzy ? query.split('').join('.*') : query, 'i');
    
    entries = entries.filter(entry => {
      const searchText = `${entry.key} ${JSON.stringify(entry.value)} ${entry.tags?.join(' ') || ''}`;
      return searchRegex.test(searchText);
    });
    
    return entries.slice(0, limit);
  }

  async bulkSet(entries: Array<{key: string, value: any, ttl?: number, tags?: string[], metadata?: any}>): Promise<number> {
    let count = 0;
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.ttl, entry.tags, entry.metadata);
      count++;
    }
    return count;
  }

  async bulkGet(keys: string[]): Promise<{[key: string]: any}> {
    const result: {[key: string]: any} = {};
    for (const key of keys) {
      result[key] = await this.get(key);
    }
    return result;
  }

  async bulkDelete(keys?: string[], pattern?: string): Promise<number> {
    const store = await this.loadMemory();
    let count = 0;
    
    if (keys) {
      for (const key of keys) {
        if (store[key]) {
          delete store[key];
          count++;
        }
      }
    }
    
    if (pattern) {
      const regex = new RegExp(pattern, 'i');
      for (const key in store) {
        if (regex.test(key)) {
          delete store[key];
          count++;
        }
      }
    }
    
    await this.saveMemory(store);
    return count;
  }
}

const memoryManager = new SimpleMemoryManager();

const server = new Server({
  name: "simple-memory-server",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
  },
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "set",
        description: "Store a value in memory with optional expiration",
        inputSchema: {
          type: "object",
          properties: {
            key: { type: "string" },
            value: {},
            ttl: { type: "number" },
            tags: { type: "array", items: { type: "string" } },
            metadata: { type: "object" }
          },
          required: ["key", "value"]
        }
      },
      {
        name: "get",
        description: "Retrieve a value from memory",
        inputSchema: {
          type: "object",
          properties: {
            key: { type: "string" },
            defaultValue: {}
          },
          required: ["key"]
        }
      },
      {
        name: "delete",
        description: "Delete a value from memory",
        inputSchema: {
          type: "object",
          properties: {
            key: { type: "string" }
          },
          required: ["key"]
        }
      },
      {
        name: "query",
        description: "Query memory entries with filters",
        inputSchema: {
          type: "object",
          properties: {
            pattern: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            limit: { type: "number", default: 100 },
            offset: { type: "number", default: 0 }
          }
        }
      },
      {
        name: "search",
        description: "Search memory entries by content",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            fuzzy: { type: "boolean", default: false },
            limit: { type: "number", default: 50 }
          },
          required: ["query"]
        }
      },
      {
        name: "bulk_set",
        description: "Set multiple key-value pairs at once",
        inputSchema: {
          type: "object",
          properties: {
            entries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  key: { type: "string" },
                  value: {},
                  ttl: { type: "number" },
                  tags: { type: "array", items: { type: "string" } },
                  metadata: { type: "object" }
                },
                required: ["key", "value"]
              },
              maxItems: 100
            }
          },
          required: ["entries"]
        }
      },
      {
        name: "bulk_get",
        description: "Get multiple values by keys",
        inputSchema: {
          type: "object",
          properties: {
            keys: { type: "array", items: { type: "string" }, maxItems: 100 }
          },
          required: ["keys"]
        }
      },
      {
        name: "bulk_delete",
        description: "Delete multiple keys at once",
        inputSchema: {
          type: "object",
          properties: {
            keys: { type: "array", items: { type: "string" }, maxItems: 100 },
            pattern: { type: "string" }
          }
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    
    if (!args) {
      throw new Error("Missing arguments");
    }
    
    switch (name) {
      case "set":
        const success = await memoryManager.set(
          (args as any).key,
          (args as any).value,
          (args as any).ttl,
          (args as any).tags,
          (args as any).metadata
        );
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success, key: (args as any).key, message: "Value stored successfully" })
          }]
        };
        
      case "get":
        const value = await memoryManager.get((args as any).key, (args as any).defaultValue);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ key: (args as any).key, value })
          }]
        };
        
      case "delete":
        const deleted = await memoryManager.delete((args as any).key);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: deleted, key: (args as any).key, message: deleted ? "Key deleted" : "Key not found" })
          }]
        };
        
      case "query":
        const queryResults = await memoryManager.query(
          (args as any).pattern,
          (args as any).tags,
          (args as any).limit || 100,
          (args as any).offset || 0
        );
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ results: queryResults, count: queryResults.length })
          }]
        };
        
      case "search":
        const searchResults = await memoryManager.search(
          (args as any).query,
          (args as any).fuzzy || false,
          (args as any).limit || 50
        );
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ results: searchResults, count: searchResults.length })
          }]
        };
        
      case "bulk_set":
        const setCount = await memoryManager.bulkSet((args as any).entries);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, count: setCount, message: `${setCount} entries stored` })
          }]
        };
        
      case "bulk_get":
        const bulkValues = await memoryManager.bulkGet((args as any).keys);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ values: bulkValues })
          }]
        };
        
      case "bulk_delete":
        const deleteCount = await memoryManager.bulkDelete((args as any).keys, (args as any).pattern);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, count: deleteCount, message: `${deleteCount} entries deleted` })
          }]
        };
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: true,
          message: error instanceof Error ? error.message : "Unknown error occurred",
          action: request.params.name,
          timestamp: new Date().toISOString()
        })
      }]
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Simple Memory MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});