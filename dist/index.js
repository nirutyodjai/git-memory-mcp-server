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
exports.GitMemoryServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const simple_git_1 = __importDefault(require("simple-git"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const zlib = __importStar(require("zlib"));
const express_1 = __importDefault(require("express"));
const crypto_1 = require("crypto");
class GitMemoryServer {
    constructor() {
        this.memory = new Map();
        this.CACHE_SIZE = 1000;
        this.CACHE_TTL = 300000; // 5 minutes
        this.SAVE_DEBOUNCE_MS = 1000;
        this.isInitialized = false;
        this.debouncedSave = this.debounce(() => this.saveMemory(), 1000);
        this.port = parseInt(process.env.MCP_PORT || '9002', 10);
        this.app = (0, express_1.default)();
        this.app.use(express_1.default.json());
        const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
            sessionIdGenerator: () => (0, crypto_1.randomUUID)(),
        });
        this.server = new index_js_1.Server({
            name: 'git-memory-mcp-server',
            version: '1.1.0',
            transport,
        });
        this.app.all('/mcp', (req, res) => {
            const reqWithAuth = req;
            transport.handleRequest(reqWithAuth, res, req.body);
        });
        this.git = (0, simple_git_1.default)();
        this.memoryCache = new Map();
        this.memoryFile = path.join(process.cwd(), '.git-memory.json');
        this.compressionEnabled = process.env.MCP_COMPRESSION === 'true';
        this.lastSaveTime = 0;
        this.initialize();
        this.setupToolHandlers();
        // Cleanup cache periodically
        setInterval(() => this.cleanupCache(), 60000); // Every minute
    }
    async initialize() {
        if (this.isInitialized) {
            console.log('GitMemoryServer already initialized');
            return;
        }
        this.app.get('/health', (req, res) => {
            res.status(200).json({ status: 'ok' });
        });
        this.app.listen(this.port, () => {
            console.log(`Git Memory Server listening on port ${this.port}`);
        });
        try {
            await this.loadMemory();
            await this.initializeLLMServices();
            this.isInitialized = true;
            console.log('GitMemoryServer initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize GitMemoryServer:', error);
            throw error;
        }
    }
    async initializeLLMServices() {
        // TODO: Implement LLM service initialization
    }
    async loadMemory() {
        try {
            if (fs.existsSync(this.memoryFile)) {
                const fileContent = fs.readFileSync(this.memoryFile, 'utf-8');
                if (fileContent) {
                    const memoryData = JSON.parse(fileContent);
                    this.memoryCache = new Map(Object.entries(memoryData.cache));
                    console.log('Memory loaded successfully');
                }
                else {
                    this.memoryCache = new Map();
                    console.log('Memory file is empty, starting with a new cache');
                }
            }
            else {
                this.memoryCache = new Map();
                console.log('No memory file found, starting with a new cache');
            }
        }
        catch (error) {
            console.error('Failed to load memory:', error);
            this.memoryCache = new Map();
        }
    }
    async saveMemory() {
        try {
            const memoryData = {
                cache: Object.fromEntries(this.memoryCache),
            };
            fs.writeFileSync(this.memoryFile, JSON.stringify(memoryData, null, 2));
            console.log('Memory saved successfully');
        }
        catch (error) {
            console.error('Failed to save memory:', error);
        }
    }
    validateGitRepository(repoPath) {
        return fs.existsSync(path.join(repoPath, '.git'));
    }
    validateStringInput(input) {
        return typeof input === 'string' && input.length > 0;
    }
    cleanupCache() {
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
    getCachedMemory(key) {
        const cached = this.memoryCache.get(key);
        if (cached && Date.now() < cached.expiration) {
            return cached.data;
        }
        return null;
    }
    setCachedMemory(key, data, ttl = this.CACHE_TTL) {
        const expiration = Date.now() + ttl;
        this.memoryCache.set(key, { data, expiration, timestamp: Date.now() });
        this.debouncedSave();
    }
    compressData(data) {
        return zlib.deflateSync(JSON.stringify(data)).toString('base64');
    }
    decompressData(data) {
        return JSON.parse(zlib.inflateSync(Buffer.from(data, 'base64')).toString());
    }
    setupToolHandlers() {
        // TODO: Implement tool handlers
    }
    debounce(func, waitFor) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), waitFor);
        };
    }
}
exports.GitMemoryServer = GitMemoryServer;
// Start the server if this file is run directly
if (typeof require !== 'undefined' && require.main === module) {
    const server = new GitMemoryServer();
    server.initialize().catch(console.error);
}
//# sourceMappingURL=index.js.map