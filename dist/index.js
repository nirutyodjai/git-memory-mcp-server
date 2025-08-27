#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const simple_git_1 = __importDefault(require("simple-git"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class GitMemoryServer {
    constructor() {
        this.memory = new Map();
        this.server = new index_js_1.Server({
            name: 'git-memory-mcp-server',
            version: '1.0.1',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.git = (0, simple_git_1.default)();
        this.memoryFile = path.join(process.cwd(), '.git-memory.json');
        this.loadMemory();
        this.setupToolHandlers();
    }
    loadMemory() {
        try {
            if (fs.existsSync(this.memoryFile)) {
                const data = fs.readFileSync(this.memoryFile, 'utf-8');
                const entries = JSON.parse(data);
                this.memory = new Map(entries);
            }
        }
        catch (error) {
            console.error('Failed to load memory:', error);
        }
    }
    saveMemory() {
        try {
            const entries = Array.from(this.memory.entries());
            fs.writeFileSync(this.memoryFile, JSON.stringify(entries, null, 2));
        }
        catch (error) {
            console.error('Failed to save memory:', error);
        }
    }
    setupToolHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
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
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
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
                        throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            }
            catch (error) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    async handleGitStatus() {
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
    async handleGitLog(args) {
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
    async handleGitDiff(args) {
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
    async handleMemoryStore(args) {
        const { key, content, metadata = {} } = args;
        const entry = {
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
    async handleMemoryRetrieve(args) {
        const { key } = args;
        const entry = this.memory.get(key);
        if (!entry) {
            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, `Memory entry not found: ${key}`);
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
    async handleMemoryList() {
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
    async handleMemoryDelete(args) {
        const { key } = args;
        const deleted = this.memory.delete(key);
        if (!deleted) {
            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, `Memory entry not found: ${key}`);
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
    async run() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error('Git Memory MCP server running on stdio');
    }
}
const server = new GitMemoryServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map