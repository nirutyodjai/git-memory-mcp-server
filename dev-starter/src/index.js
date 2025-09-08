"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitMemoryServer = void 0;
var index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
var http_js_1 = require("@modelcontextprotocol/sdk/server/http.js");
var types_js_1 = require("@modelcontextprotocol/sdk/types.js");
var simple_git_1 = require("simple-git");
var fs = require("fs");
var path = require("path");
var zlib = require("zlib");
var LLMProviderService_1 = require("./services/LLMProviderService");
var SoloAIOrchestrator_1 = require("./services/SoloAIOrchestrator");
const tenantMiddleware = require('./middleware/tenantMiddleware');
const express_1 = require("express");
var GitMemoryServer = /** @class */ (function () {
    function GitMemoryServer() {
        var _this = this;
        this.memory = new Map();
        this.CACHE_SIZE = 1000;
        this.CACHE_TTL = 300000; // 5 minutes
        this.SAVE_DEBOUNCE_MS = 1000;
        this.isInitialized = false;
        this.port = parseInt(process.env.MCP_PORT || '9001', 10);
        this.app = (0, express_1.default)();
        this.app.use(tenantMiddleware);
        this.server = new index_js_1.Server({
            transport: new http_js_1.HttpServerTransport({ app: this.app, port: this.port }),
            handlers: {
                name: 'git-memory-mcp-server',
                version: '1.1.0',
                capabilities: {
                    tools: {},
                },
            }
        });
        this.git = (0, simple_git_1.default)();
        this.memoryCache = new Map();
        this.memoryFile = path.join(process.cwd(), '.git-memory.json');
        this.compressionEnabled = process.env.MCP_COMPRESSION === 'true';
        this.lastSaveTime = 0;
        this.initialize();
        this.setupToolHandlers();
        // Cleanup cache periodically
        setInterval(function () { return _this.cleanupCache(); }, 60000); // Every minute
    }
    GitMemoryServer.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isInitialized) {
                            console.log('GitMemoryServer already initialized');
                            return [2 /*return*/];
                        }
                        this.app.get('/health', function (req, res) {
                            res.status(200).json({ status: 'ok' });
                        });
                        this.app.listen(this.port, function () {
                            console.log("Git Memory Server health check endpoint listening on port ".concat(_this.port));
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.loadMemory()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.initializeLLMServices()];
                    case 3:
                        _a.sent();
                        this.isInitialized = true;
                        console.log('GitMemoryServer initialized successfully');
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        console.error('Failed to initialize GitMemoryServer:', error_1);
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.initializeLLMServices = function () {
        return __awaiter(this, void 0, void 0, function () {
            var llmConfig;
            return __generator(this, function (_a) {
                try {
                    llmConfig = JSON.parse(fs.readFileSync('./config/solo-llm-config.json', 'utf8'));
                    this.llmService = new LLMProviderService_1.LLMProviderService(llmConfig, console);
                    this.aiOrchestrator = new SoloAIOrchestrator_1.SoloAIOrchestrator(this.llmService, console);
                    console.log('✅ Solo LLM Integration initialized successfully');
                }
                catch (error) {
                    console.error('❌ Failed to initialize LLM services:', error);
                }
                return [2 /*return*/];
            });
        });
    };
    GitMemoryServer.prototype.generateAIResponse = function (prompt_1) {
        return __awaiter(this, arguments, void 0, function (prompt, taskType) {
            var task;
            if (taskType === void 0) { taskType = 'code_analysis'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.aiOrchestrator) {
                            throw new Error('AI Orchestrator not initialized');
                        }
                        task = {
                            id: 'task-' + Date.now(),
                            type: taskType,
                            prompt: prompt,
                            priority: 'medium'
                        };
                        return [4 /*yield*/, this.aiOrchestrator.executeTask(task)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    GitMemoryServer.prototype.loadMemory = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, compressedData, entries, recentEntries, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        if (!fs.existsSync(this.memoryFile)) return [3 /*break*/, 6];
                        data = void 0;
                        if (!(this.compressionEnabled && this.memoryFile.endsWith('.gz'))) return [3 /*break*/, 3];
                        return [4 /*yield*/, fs.promises.readFile(this.memoryFile)];
                    case 1:
                        compressedData = _a.sent();
                        return [4 /*yield*/, this.decompressData(compressedData)];
                    case 2:
                        data = _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, fs.promises.readFile(this.memoryFile, 'utf8')];
                    case 4:
                        data = _a.sent();
                        _a.label = 5;
                    case 5:
                        entries = JSON.parse(data);
                        this.memory = new Map(entries);
                        recentEntries = entries
                            .sort(function (a, b) { return new Date(b[1].timestamp).getTime() - new Date(a[1].timestamp).getTime(); })
                            .slice(0, Math.min(100, this.CACHE_SIZE / 2));
                        recentEntries.forEach(function (_a) {
                            var key = _a[0], entry = _a[1];
                            _this.setCachedMemory(key, entry);
                        });
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_2 = _a.sent();
                        console.error('Failed to load memory:', error_2);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.saveMemory = function () {
        return __awaiter(this, void 0, void 0, function () {
            var entries, jsonData, compressedData, compressedFile, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        entries = Array.from(this.memory.entries());
                        jsonData = JSON.stringify(entries, null, 2);
                        if (!this.compressionEnabled) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.compressData(jsonData)];
                    case 1:
                        compressedData = _a.sent();
                        compressedFile = this.memoryFile.replace('.json', '.json.gz');
                        return [4 /*yield*/, fs.promises.writeFile(compressedFile, compressedData)];
                    case 2:
                        _a.sent();
                        if (!(fs.existsSync(this.memoryFile) && this.memoryFile !== compressedFile)) return [3 /*break*/, 4];
                        return [4 /*yield*/, fs.promises.unlink(this.memoryFile)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, fs.promises.writeFile(this.memoryFile, jsonData, 'utf8')];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_3 = _a.sent();
                        console.error('Failed to save memory:', error_3);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.validateGitRepository = function () {
        return __awaiter(this, void 0, void 0, function () {
            var isRepo, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.git.checkIsRepo()];
                    case 1:
                        isRepo = _a.sent();
                        if (!isRepo) {
                            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, 'Current directory is not a git repository. Please run this command from within a git repository.');
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        if (error_4 instanceof types_js_1.McpError) {
                            throw error_4;
                        }
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Failed to validate git repository: ".concat(error_4 instanceof Error ? error_4.message : String(error_4)));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.validateStringInput = function (value, fieldName, maxLength) {
        if (!value || typeof value !== 'string') {
            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, "".concat(fieldName, " must be a non-empty string"));
        }
        if (maxLength && value.length > maxLength) {
            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, "".concat(fieldName, " must be ").concat(maxLength, " characters or less"));
        }
    };
    GitMemoryServer.prototype.cleanupCache = function () {
        var _this = this;
        var now = Date.now();
        var keysToDelete = [];
        for (var _i = 0, _a = this.memoryCache.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], cached = _b[1];
            if (now - cached.lastAccessed > this.CACHE_TTL) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(function (key) { return _this.memoryCache.delete(key); });
        // If cache is still too large, remove oldest entries
        if (this.memoryCache.size > this.CACHE_SIZE) {
            var entries = Array.from(this.memoryCache.entries())
                .sort(function (a, b) { return a[1].lastAccessed - b[1].lastAccessed; });
            var toRemove = entries.slice(0, entries.length - this.CACHE_SIZE);
            toRemove.forEach(function (_a) {
                var key = _a[0];
                return _this.memoryCache.delete(key);
            });
        }
    };
    GitMemoryServer.prototype.getCachedMemory = function (key) {
        var cached = this.memoryCache.get(key);
        if (cached) {
            cached.lastAccessed = Date.now();
            return cached.data;
        }
        return null;
    };
    GitMemoryServer.prototype.setCachedMemory = function (key, data) {
        this.memoryCache.set(key, {
            data: __assign({}, data),
            lastAccessed: Date.now()
        });
    };
    GitMemoryServer.prototype.compressData = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        zlib.gzip(data, function (err, result) {
                            if (err)
                                reject(err);
                            else
                                resolve(result);
                        });
                    })];
            });
        });
    };
    GitMemoryServer.prototype.decompressData = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        zlib.gunzip(data, function (err, result) {
                            if (err)
                                reject(err);
                            else
                                resolve(result.toString());
                        });
                    })];
            });
        });
    };
    GitMemoryServer.prototype.debouncedSave = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = Date.now();
                        if (now - this.lastSaveTime < this.SAVE_DEBOUNCE_MS) {
                            return [2 /*return*/];
                        }
                        this.lastSaveTime = now;
                        return [4 /*yield*/, this.saveMemory()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.setupToolHandlers = function () {
        var _this = this;
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, ({
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
                            {
                                name: 'ai_generate',
                                description: 'Generate AI response for a given prompt',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        prompt: {
                                            type: 'string',
                                            description: 'The prompt to send to the AI',
                                        },
                                        taskType: {
                                            type: 'string',
                                            description: 'Type of task (code_analysis, text_generation, etc)',
                                            default: 'code_analysis',
                                        },
                                    },
                                    required: ['prompt'],
                                },
                            },
                        ],
                    })];
            });
        }); });
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, function (request) { return __awaiter(_this, void 0, void 0, function () {
            var _a, name, args, _b, error_5;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = request.params, name = _a.name, args = _a.arguments;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 36, , 37]);
                        _b = name;
                        switch (_b) {
                            case 'git_status': return [3 /*break*/, 2];
                            case 'git_log': return [3 /*break*/, 4];
                            case 'git_diff': return [3 /*break*/, 6];
                            case 'memory_store': return [3 /*break*/, 8];
                            case 'memory_retrieve': return [3 /*break*/, 10];
                            case 'memory_list': return [3 /*break*/, 12];
                            case 'memory_delete': return [3 /*break*/, 14];
                            case 'memory_search': return [3 /*break*/, 16];
                            case 'memory_filter': return [3 /*break*/, 18];
                            case 'git_add': return [3 /*break*/, 20];
                            case 'git_commit': return [3 /*break*/, 22];
                            case 'git_push': return [3 /*break*/, 24];
                            case 'git_pull': return [3 /*break*/, 26];
                            case 'git_branch': return [3 /*break*/, 28];
                            case 'git_merge': return [3 /*break*/, 30];
                            case 'ai_generate': return [3 /*break*/, 32];
                        }
                        return [3 /*break*/, 34];
                    case 2: return [4 /*yield*/, this.handleGitStatus()];
                    case 3: return [2 /*return*/, _c.sent()];
                    case 4: return [4 /*yield*/, this.handleGitLog(args)];
                    case 5: return [2 /*return*/, _c.sent()];
                    case 6: return [4 /*yield*/, this.handleGitDiff(args)];
                    case 7: return [2 /*return*/, _c.sent()];
                    case 8: return [4 /*yield*/, this.handleMemoryStore(args, request.tenant)];
                    case 9: return [2 /*return*/, _c.sent()];
                    case 10: return [4 /*yield*/, this.handleMemoryRetrieve(args, request.tenant)];
                    case 11: return [2 /*return*/, _c.sent()];
                    case 12: return [4 /*yield*/, this.handleMemoryList(request.tenant)];
                    case 13: return [2 /*return*/, _c.sent()];
                    case 14: return [4 /*yield*/, this.handleMemoryDelete(args, request.tenant)];
                    case 15: return [2 /*return*/, _c.sent()];
                    case 16: return [4 /*yield*/, this.handleMemorySearch(args, request.tenant)];
                    case 17: return [2 /*return*/, _c.sent()];
                    case 18: return [4 /*yield*/, this.handleMemoryFilter(args, request.tenant)];
                    case 19: return [2 /*return*/, _c.sent()];
                    case 20: return [4 /*yield*/, this.handleGitAdd(args)];
                    case 21: return [2 /*return*/, _c.sent()];
                    case 22: return [4 /*yield*/, this.handleGitCommit(args)];
                    case 23: return [2 /*return*/, _c.sent()];
                    case 24: return [4 /*yield*/, this.handleGitPush(args)];
                    case 25: return [2 /*return*/, _c.sent()];
                    case 26: return [4 /*yield*/, this.handleGitPull(args)];
                    case 27: return [2 /*return*/, _c.sent()];
                    case 28: return [4 /*yield*/, this.handleGitBranch(args)];
                    case 29: return [2 /*return*/, _c.sent()];
                    case 30: return [4 /*yield*/, this.handleGitMerge(args)];
                    case 31: return [2 /*return*/, _c.sent()];
                    case 32: return [4 /*yield*/, this.handleAIGenerate(args)];
                    case 33: return [2 /*return*/, _c.sent()];
                    case 34: throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, "Unknown tool: ".concat(name));
                    case 35: return [3 /*break*/, 37];
                    case 36:
                        error_5 = _c.sent();
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Tool execution failed: ".concat(error_5 instanceof Error ? error_5.message : String(error_5)));
                    case 37: return [2 /*return*/];
                }
            });
        }); });
    };
    GitMemoryServer.prototype.handleGitStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var status_1, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.validateGitRepository()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.git.status()];
                    case 2:
                        status_1 = _a.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify(status_1, null, 2),
                                    },
                                ],
                            }];
                    case 3:
                        error_6 = _a.sent();
                        if (error_6 instanceof types_js_1.McpError) {
                            throw error_6;
                        }
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Git status failed: ".concat(error_6 instanceof Error ? error_6.message : String(error_6)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleGitLog = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var maxCount, log;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        maxCount = (args === null || args === void 0 ? void 0 : args.maxCount) || 10;
                        return [4 /*yield*/, this.git.log({ maxCount: maxCount })];
                    case 1:
                        log = _a.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify(log, null, 2),
                                    },
                                ],
                            }];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleGitDiff = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var staged, diff, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        staged = (args === null || args === void 0 ? void 0 : args.staged) || false;
                        if (!staged) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.git.diff(['--cached'])];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.git.diff()];
                    case 3:
                        _a = _b.sent();
                        _b.label = 4;
                    case 4:
                        diff = _a;
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: diff,
                                    },
                                ],
                            }];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleMemoryStore = function (args, tenant) {
        return __awaiter(this, void 0, void 0, function () {
            var key, content, _a, metadata, tenantKey, entry, error_7;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        key = args.key, content = args.content, _a = args.metadata, metadata = _a === void 0 ? {} : _a;
                        if (!tenant || !tenant.id) {
                            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, "Tenant information is missing.");
                        }
                        // Input validation using helper methods
                        this.validateStringInput(key, 'Key', 255);
                        this.validateStringInput(content, 'Content', 1000000); // 1MB limit
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        tenantKey = "".concat(tenant.id, ":").concat(key);
                        entry = {
                            id: key,
                            content: content,
                            metadata: metadata,
                            timestamp: Date.now(),
                        };
                        this.memory.set(tenantKey, entry);
                        this.setCachedMemory(tenantKey, entry);
                        return [4 /*yield*/, this.debouncedSave()];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: "Stored memory entry with key: ".concat(key),
                                    },
                                ],
                            }];
                    case 3:
                        error_7 = _b.sent();
                        if (error_7 instanceof types_js_1.McpError) {
                            throw error_7;
                        }
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Failed to store memory entry: ".concat(error_7 instanceof Error ? error_7.message : String(error_7)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleMemoryRetrieve = function (args, tenant) {
        return __awaiter(this, void 0, void 0, function () {
            var key, tenantKey, entry, memoryEntry;
            return __generator(this, function (_a) {
                key = args.key;
                if (!tenant || !tenant.id) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, "Tenant information is missing.");
                }
                tenantKey = "".concat(tenant.id, ":").concat(key);
                entry = this.getCachedMemory(tenantKey);
                // If not in cache, get from memory and cache it
                if (!entry) {
                    memoryEntry = this.memory.get(tenantKey);
                    if (memoryEntry) {
                        entry = memoryEntry;
                        this.setCachedMemory(tenantKey, entry);
                    }
                }
                if (!entry) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, "Memory entry not found: ".concat(key));
                }
                return [2 /*return*/, {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(entry, null, 2),
                            },
                        ],
                    }];
            });
        });
    };
    GitMemoryServer.prototype.handleMemoryList = function (tenant) {
        return __awaiter(this, void 0, void 0, function () {
            var entries;
            return __generator(this, function (_a) {
                if (!tenant || !tenant.id) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, "Tenant information is missing.");
                }
                entries = Array.from(this.memory.entries())
                    .filter(function (_a) {
                    var key = _a[0], value = _a[1];
                    return key.startsWith("".concat(tenant.id, ":"));
                })
                    .map(function (_a) {
                    var key = _a[0], value = _a[1];
                    return value;
                });
                return [2 /*return*/, {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(entries, null, 2),
                            },
                        ],
                    }];
            });
        });
    };
    GitMemoryServer.prototype.handleMemoryDelete = function (args, tenant) {
        return __awaiter(this, void 0, void 0, function () {
            var key, tenantKey, deleted;
            return __generator(this, function (_a) {
                key = args.key;
                if (!tenant || !tenant.id) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, "Tenant information is missing.");
                }
                tenantKey = "".concat(tenant.id, ":").concat(key);
                deleted = this.memory.delete(tenantKey);
                if (!deleted) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, "Memory entry not found: ".concat(key));
                }
                this.saveMemory();
                return [2 /*return*/, {
                        content: [
                            {
                                type: 'text',
                                text: "Deleted memory entry with key: ".concat(key),
                            },
                        ],
                    }];
            });
        });
    };
    GitMemoryServer.prototype.handleMemorySearch = function (args, tenant) {
        return __awaiter(this, void 0, void 0, function () {
            var query, metadata, _a, limit, _b, sortBy, _c, sortOrder, results, searchQuery_1;
            return __generator(this, function (_d) {
                query = args.query, metadata = args.metadata, _a = args.limit, limit = _a === void 0 ? 10 : _a, _b = args.sortBy, sortBy = _b === void 0 ? 'timestamp' : _b, _c = args.sortOrder, sortOrder = _c === void 0 ? 'desc' : _c;
                if (!tenant || !tenant.id) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, "Tenant information is missing.");
                }
                results = Array.from(this.memory.entries())
                    .filter(function (_a) {
                    var key = _a[0], value = _a[1];
                    return key.startsWith("".concat(tenant.id, ":"));
                })
                    .map(function (_a) {
                    var key = _a[0], value = _a[1];
                    return value;
                });
                // Filter by content query
                if (query) {
                    searchQuery_1 = query.toLowerCase();
                    results = results.filter(function (entry) {
                        return entry.content.toLowerCase().includes(searchQuery_1) ||
                            entry.id.toLowerCase().includes(searchQuery_1);
                    });
                }
                // Filter by metadata
                if (metadata) {
                    results = results.filter(function (entry) {
                        return Object.entries(metadata).every(function (_a) {
                            var key = _a[0], value = _a[1];
                            return entry.metadata[key] === value;
                        });
                    });
                }
                // Sort results
                results.sort(function (a, b) {
                    var aValue, bValue;
                    if (sortBy === 'timestamp') {
                        aValue = a.timestamp;
                        bValue = b.timestamp;
                    }
                    else if (sortBy === 'key') {
                        aValue = a.id;
                        bValue = b.id;
                    }
                    else {
                        aValue = a.timestamp;
                        bValue = b.timestamp;
                    }
                    if (sortOrder === 'asc') {
                        return aValue > bValue ? 1 : -1;
                    }
                    else {
                        return aValue < bValue ? 1 : -1;
                    }
                });
                // Limit results
                results = results.slice(0, limit);
                return [2 /*return*/, {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    total: results.length,
                                    results: results
                                }, null, 2),
                            },
                        ],
                    }];
            });
        });
    };
    GitMemoryServer.prototype.handleMemoryFilter = function (args, tenant) {
        return __awaiter(this, void 0, void 0, function () {
            var dateRange, tags, contentType, minLength, maxLength, results, fromDate_1, toDate_1;
            return __generator(this, function (_a) {
                dateRange = args.dateRange, tags = args.tags, contentType = args.contentType, minLength = args.minLength, maxLength = args.maxLength;
                if (!tenant || !tenant.id) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, "Tenant information is missing.");
                }
                results = Array.from(this.memory.entries())
                    .filter(function (_a) {
                    var key = _a[0], value = _a[1];
                    return key.startsWith("".concat(tenant.id, ":"));
                })
                    .map(function (_a) {
                    var key = _a[0], value = _a[1];
                    return value;
                });
                // Filter by date range
                if (dateRange) {
                    fromDate_1 = dateRange.from ? new Date(dateRange.from) : null;
                    toDate_1 = dateRange.to ? new Date(dateRange.to) : null;
                    results = results.filter(function (entry) {
                        var entryDate = new Date(entry.timestamp);
                        if (fromDate_1 && entryDate < fromDate_1)
                            return false;
                        if (toDate_1 && entryDate > toDate_1)
                            return false;
                        return true;
                    });
                }
                // Filter by tags
                if (tags && tags.length > 0) {
                    results = results.filter(function (entry) {
                        var entryTags = entry.metadata.tags || [];
                        return tags.some(function (tag) { return entryTags.includes(tag); });
                    });
                }
                // Filter by content type
                if (contentType) {
                    results = results.filter(function (entry) {
                        return entry.metadata.contentType === contentType;
                    });
                }
                // Filter by content length
                if (minLength !== undefined) {
                    results = results.filter(function (entry) { return entry.content.length >= minLength; });
                }
                if (maxLength !== undefined) {
                    results = results.filter(function (entry) { return entry.content.length <= maxLength; });
                }
                return [2 /*return*/, {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    total: results.length,
                                    filters: { dateRange: dateRange, tags: tags, contentType: contentType, minLength: minLength, maxLength: maxLength },
                                    results: results
                                }, null, 2),
                            },
                        ],
                    }];
            });
        });
    };
    GitMemoryServer.prototype.handleGitAdd = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, files, filesToAdd, _i, filesToAdd_1, file, error_8;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = args.files, files = _a === void 0 ? ['.'] : _a;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.validateGitRepository()];
                    case 2:
                        _b.sent();
                        // Validate files input
                        if (!Array.isArray(files) && typeof files !== 'string') {
                            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, 'Files must be a string or array of strings');
                        }
                        filesToAdd = Array.isArray(files) ? files : [files];
                        // Validate each file path
                        for (_i = 0, filesToAdd_1 = filesToAdd; _i < filesToAdd_1.length; _i++) {
                            file = filesToAdd_1[_i];
                            if (typeof file !== 'string' || file.trim() === '') {
                                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, 'Each file path must be a non-empty string');
                            }
                        }
                        return [4 /*yield*/, this.git.add(filesToAdd)];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: "Added files to staging: ".concat(filesToAdd.join(', ')),
                                    },
                                ],
                            }];
                    case 4:
                        error_8 = _b.sent();
                        if (error_8 instanceof types_js_1.McpError) {
                            throw error_8;
                        }
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Git add failed: ".concat(error_8 instanceof Error ? error_8.message : String(error_8)));
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleGitCommit = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var message, author, options, result, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        message = args.message, author = args.author;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        options = { '-m': message };
                        if (author) {
                            options['--author'] = "".concat(author.name, " <").concat(author.email, ">");
                        }
                        return [4 /*yield*/, this.git.commit(message, undefined, options)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify(result, null, 2),
                                    },
                                ],
                            }];
                    case 3:
                        error_9 = _a.sent();
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Failed to commit: ".concat(error_9 instanceof Error ? error_9.message : String(error_9)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleGitPush = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, remote, branch, _b, force, options, result, _c, error_10;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = args.remote, remote = _a === void 0 ? 'origin' : _a, branch = args.branch, _b = args.force, force = _b === void 0 ? false : _b;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, , 7]);
                        options = {};
                        if (force)
                            options['--force'] = null;
                        if (!branch) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.git.push(remote, branch, options)];
                    case 2:
                        _c = _d.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.git.push(options)];
                    case 4:
                        _c = _d.sent();
                        _d.label = 5;
                    case 5:
                        result = _c;
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: "Successfully pushed to ".concat(remote).concat(branch ? "/".concat(branch) : ''),
                                    },
                                ],
                            }];
                    case 6:
                        error_10 = _d.sent();
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Failed to push: ".concat(error_10 instanceof Error ? error_10.message : String(error_10)));
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleGitPull = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, remote, branch, result, _b, error_11;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = args.remote, remote = _a === void 0 ? 'origin' : _a, branch = args.branch;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 6, , 7]);
                        if (!branch) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.git.pull(remote, branch)];
                    case 2:
                        _b = _c.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.git.pull()];
                    case 4:
                        _b = _c.sent();
                        _c.label = 5;
                    case 5:
                        result = _b;
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify(result, null, 2),
                                    },
                                ],
                            }];
                    case 6:
                        error_11 = _c.sent();
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Failed to pull: ".concat(error_11 instanceof Error ? error_11.message : String(error_11)));
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleGitBranch = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, action, name, _b, force, result, _c, error_12;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = args.action, action = _a === void 0 ? 'list' : _a, name = args.name, _b = args.force, force = _b === void 0 ? false : _b;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 12, , 13]);
                        result = void 0;
                        _c = action;
                        switch (_c) {
                            case 'list': return [3 /*break*/, 2];
                            case 'create': return [3 /*break*/, 4];
                            case 'delete': return [3 /*break*/, 6];
                            case 'checkout': return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 10];
                    case 2: return [4 /*yield*/, this.git.branch()];
                    case 3:
                        result = _d.sent();
                        return [3 /*break*/, 11];
                    case 4:
                        if (!name)
                            throw new Error('Branch name is required for create action');
                        return [4 /*yield*/, this.git.checkoutLocalBranch(name)];
                    case 5:
                        result = _d.sent();
                        return [3 /*break*/, 11];
                    case 6:
                        if (!name)
                            throw new Error('Branch name is required for delete action');
                        return [4 /*yield*/, this.git.deleteLocalBranch(name, force)];
                    case 7:
                        result = _d.sent();
                        return [3 /*break*/, 11];
                    case 8:
                        if (!name)
                            throw new Error('Branch name is required for checkout action');
                        return [4 /*yield*/, this.git.checkout(name)];
                    case 9:
                        result = _d.sent();
                        return [3 /*break*/, 11];
                    case 10: throw new Error("Unknown branch action: ".concat(action));
                    case 11: return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(result, null, 2),
                                },
                            ],
                        }];
                    case 12:
                        error_12 = _d.sent();
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Failed to execute branch operation: ".concat(error_12 instanceof Error ? error_12.message : String(error_12)));
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleGitMerge = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var branch, _a, noFastForward, options, result, error_13;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        branch = args.branch, _a = args.noFastForward, noFastForward = _a === void 0 ? false : _a;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        options = [];
                        if (noFastForward)
                            options.push('--no-ff');
                        return [4 /*yield*/, this.git.merge(__spreadArray([branch], options, true))];
                    case 2:
                        result = _b.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify(result, null, 2),
                                    },
                                ],
                            }];
                    case 3:
                        error_13 = _b.sent();
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Failed to merge: ".concat(error_13 instanceof Error ? error_13.message : String(error_13)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleAIGenerate = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, _a, taskType, response, error_14;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        prompt = args.prompt, _a = args.taskType, taskType = _a === void 0 ? 'code_analysis' : _a;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        if (!prompt || typeof prompt !== 'string') {
                            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, 'Prompt must be a non-empty string');
                        }
                        return [4 /*yield*/, this.generateAIResponse(prompt, taskType)];
                    case 2:
                        response = _b.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: response,
                                    },
                                ],
                            }];
                    case 3:
                        error_14 = _b.sent();
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "AI generation failed: ".concat(error_14 instanceof Error ? error_14.message : String(error_14)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.server.transport instanceof http_js_1.HttpServerTransport)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.server.transport.listen()];
                    case 1:
                        _a.sent();
                        console.log("Git Memory Server listening on port ".concat(this.port));
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_15;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isInitialized) {
                            console.log('GitMemoryServer already initialized');
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.loadMemory()];
                    case 2:
                        _a.sent();
                        this.isInitialized = true;
                        console.log('GitMemoryServer initialized successfully');
                        return [3 /*break*/, 4];
                    case 3:
                        error_15 = _a.sent();
                        console.error('Failed to initialize GitMemoryServer:', error_15);
                        throw error_15;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.initializeAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadMemory()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.initializeLLMServices()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.initializeLLMServices = function () {
        return __awaiter(this, void 0, void 0, function () {
            var llmConfig;
            return __generator(this, function (_a) {
                try {
                    llmConfig = JSON.parse(fs.readFileSync('./config/solo-llm-config.json', 'utf8'));
                    this.llmService = new LLMProviderService_1.LLMProviderService(llmConfig, console);
                    this.aiOrchestrator = new SoloAIOrchestrator_1.SoloAIOrchestrator(this.llmService, console);
                    console.log('✅ Solo LLM Integration initialized successfully');
                }
                catch (error) {
                    console.error('❌ Failed to initialize LLM services:', error);
                }
                return [2 /*return*/];
            });
        });
    };
    GitMemoryServer.prototype.generateAIResponse = function (prompt_1) {
        return __awaiter(this, arguments, void 0, function (prompt, taskType) {
            var task;
            if (taskType === void 0) { taskType = 'code_analysis'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.aiOrchestrator) {
                            throw new Error('AI Orchestrator not initialized');
                        }
                        task = {
                            id: 'task-' + Date.now(),
                            type: taskType,
                            prompt: prompt,
                            priority: 'medium'
                        };
                        return [4 /*yield*/, this.aiOrchestrator.executeTask(task)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    GitMemoryServer.prototype.loadMemory = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, compressedData, entries, recentEntries, error_16;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        if (!fs.existsSync(this.memoryFile)) return [3 /*break*/, 6];
                        data = void 0;
                        if (!(this.compressionEnabled && this.memoryFile.endsWith('.gz'))) return [3 /*break*/, 3];
                        return [4 /*yield*/, fs.promises.readFile(this.memoryFile)];
                    case 1:
                        compressedData = _a.sent();
                        return [4 /*yield*/, this.decompressData(compressedData)];
                    case 2:
                        data = _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, fs.promises.readFile(this.memoryFile, 'utf8')];
                    case 4:
                        data = _a.sent();
                        _a.label = 5;
                    case 5:
                        entries = JSON.parse(data);
                        this.memory = new Map(entries);
                        recentEntries = entries
                            .sort(function (a, b) { return new Date(b[1].timestamp).getTime() - new Date(a[1].timestamp).getTime(); })
                            .slice(0, Math.min(100, this.CACHE_SIZE / 2));
                        recentEntries.forEach(function (_a) {
                            var key = _a[0], entry = _a[1];
                            _this.setCachedMemory(key, entry);
                        });
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_16 = _a.sent();
                        console.error('Failed to load memory:', error_16);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.saveMemory = function () {
        return __awaiter(this, void 0, void 0, function () {
            var entries, jsonData, compressedData, compressedFile, error_17;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        entries = Array.from(this.memory.entries());
                        jsonData = JSON.stringify(entries, null, 2);
                        if (!this.compressionEnabled) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.compressData(jsonData)];
                    case 1:
                        compressedData = _a.sent();
                        compressedFile = this.memoryFile.replace('.json', '.json.gz');
                        return [4 /*yield*/, fs.promises.writeFile(compressedFile, compressedData)];
                    case 2:
                        _a.sent();
                        if (!(fs.existsSync(this.memoryFile) && this.memoryFile !== compressedFile)) return [3 /*break*/, 4];
                        return [4 /*yield*/, fs.promises.unlink(this.memoryFile)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, fs.promises.writeFile(this.memoryFile, jsonData, 'utf8')];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_17 = _a.sent();
                        console.error('Failed to save memory:', error_17);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.validateGitRepository = function () {
        return __awaiter(this, void 0, void 0, function () {
            var isRepo, error_18;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.git.checkIsRepo()];
                    case 1:
                        isRepo = _a.sent();
                        if (!isRepo) {
                            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, 'Current directory is not a git repository. Please run this command from within a git repository.');
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_18 = _a.sent();
                        if (error_18 instanceof types_js_1.McpError) {
                            throw error_18;
                        }
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Failed to validate git repository: ".concat(error_18 instanceof Error ? error_18.message : String(error_18)));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.validateStringInput = function (value, fieldName, maxLength) {
        if (!value || typeof value !== 'string') {
            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, "".concat(fieldName, " must be a non-empty string"));
        }
        if (maxLength && value.length > maxLength) {
            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, "".concat(fieldName, " must be ").concat(maxLength, " characters or less"));
        }
    };
    GitMemoryServer.prototype.cleanupCache = function () {
        var _this = this;
        var now = Date.now();
        var keysToDelete = [];
        for (var _i = 0, _a = this.memoryCache.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], cached = _b[1];
            if (now - cached.lastAccessed > this.CACHE_TTL) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(function (key) { return _this.memoryCache.delete(key); });
        // If cache is still too large, remove oldest entries
        if (this.memoryCache.size > this.CACHE_SIZE) {
            var entries = Array.from(this.memoryCache.entries())
                .sort(function (a, b) { return a[1].lastAccessed - b[1].lastAccessed; });
            var toRemove = entries.slice(0, entries.length - this.CACHE_SIZE);
            toRemove.forEach(function (_a) {
                var key = _a[0];
                return _this.memoryCache.delete(key);
            });
        }
    };
    GitMemoryServer.prototype.getCachedMemory = function (key) {
        var cached = this.memoryCache.get(key);
        if (cached) {
            cached.lastAccessed = Date.now();
            return cached.data;
        }
        return null;
    };
    GitMemoryServer.prototype.setCachedMemory = function (key, data) {
        this.memoryCache.set(key, {
            data: __assign({}, data),
            lastAccessed: Date.now()
        });
    };
    GitMemoryServer.prototype.compressData = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        zlib.gzip(data, function (err, result) {
                            if (err)
                                reject(err);
                            else
                                resolve(result);
                        });
                    })];
            });
        });
    };
    GitMemoryServer.prototype.decompressData = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        zlib.gunzip(data, function (err, result) {
                            if (err)
                                reject(err);
                            else
                                resolve(result.toString());
                        });
                    })];
            });
        });
    };
    GitMemoryServer.prototype.debouncedSave = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = Date.now();
                        if (now - this.lastSaveTime < this.SAVE_DEBOUNCE_MS) {
                            return [2 /*return*/];
                        }
                        this.lastSaveTime = now;
                        return [4 /*yield*/, this.saveMemory()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.setupToolHandlers = function () {
        var _this = this;
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, ({
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
                            {
                                name: 'ai_generate',
                                description: 'Generate AI response for a given prompt',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        prompt: {
                                            type: 'string',
                                            description: 'The prompt to send to the AI',
                                        },
                                        taskType: {
                                            type: 'string',
                                            description: 'Type of task (code_analysis, text_generation, etc)',
                                            default: 'code_analysis',
                                        },
                                    },
                                    required: ['prompt'],
                                },
                            },
                        ],
                    })];
            });
        }); });
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, function (request) { return __awaiter(_this, void 0, void 0, function () {
            var _a, name, args, _b, error_19;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = request.params, name = _a.name, args = _a.arguments;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 36, , 37]);
                        _b = name;
                        switch (_b) {
                            case 'git_status': return [3 /*break*/, 2];
                            case 'git_log': return [3 /*break*/, 4];
                            case 'git_diff': return [3 /*break*/, 6];
                            case 'memory_store': return [3 /*break*/, 8];
                            case 'memory_retrieve': return [3 /*break*/, 10];
                            case 'memory_list': return [3 /*break*/, 12];
                            case 'memory_delete': return [3 /*break*/, 14];
                            case 'memory_search': return [3 /*break*/, 16];
                            case 'memory_filter': return [3 /*break*/, 18];
                            case 'git_add': return [3 /*break*/, 20];
                            case 'git_commit': return [3 /*break*/, 22];
                            case 'git_push': return [3 /*break*/, 24];
                            case 'git_pull': return [3 /*break*/, 26];
                            case 'git_branch': return [3 /*break*/, 28];
                            case 'git_merge': return [3 /*break*/, 30];
                            case 'ai_generate': return [3 /*break*/, 32];
                        }
                        return [3 /*break*/, 34];
                    case 2: return [4 /*yield*/, this.handleGitStatus()];
                    case 3: return [2 /*return*/, _c.sent()];
                    case 4: return [4 /*yield*/, this.handleGitLog(args)];
                    case 5: return [2 /*return*/, _c.sent()];
                    case 6: return [4 /*yield*/, this.handleGitDiff(args)];
                    case 7: return [2 /*return*/, _c.sent()];
                    case 8: return [4 /*yield*/, this.handleMemoryStore(args)];
                    case 9: return [2 /*return*/, _c.sent()];
                    case 10: return [4 /*yield*/, this.handleMemoryRetrieve(args)];
                    case 11: return [2 /*return*/, _c.sent()];
                    case 12: return [4 /*yield*/, this.handleMemoryList()];
                    case 13: return [2 /*return*/, _c.sent()];
                    case 14: return [4 /*yield*/, this.handleMemoryDelete(args)];
                    case 15: return [2 /*return*/, _c.sent()];
                    case 16: return [4 /*yield*/, this.handleMemorySearch(args)];
                    case 17: return [2 /*return*/, _c.sent()];
                    case 18: return [4 /*yield*/, this.handleMemoryFilter(args)];
                    case 19: return [2 /*return*/, _c.sent()];
                    case 20: return [4 /*yield*/, this.handleGitAdd(args)];
                    case 21: return [2 /*return*/, _c.sent()];
                    case 22: return [4 /*yield*/, this.handleGitCommit(args)];
                    case 23: return [2 /*return*/, _c.sent()];
                    case 24: return [4 /*yield*/, this.handleGitPush(args)];
                    case 25: return [2 /*return*/, _c.sent()];
                    case 26: return [4 /*yield*/, this.handleGitPull(args)];
                    case 27: return [2 /*return*/, _c.sent()];
                    case 28: return [4 /*yield*/, this.handleGitBranch(args)];
                    case 29: return [2 /*return*/, _c.sent()];
                    case 30: return [4 /*yield*/, this.handleGitMerge(args)];
                    case 31: return [2 /*return*/, _c.sent()];
                    case 32: return [4 /*yield*/, this.handleAIGenerate(args)];
                    case 33: return [2 /*return*/, _c.sent()];
                    case 34: throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, "Unknown tool: ".concat(name));
                    case 35: return [3 /*break*/, 37];
                    case 36:
                        error_19 = _c.sent();
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Tool execution failed: ".concat(error_19 instanceof Error ? error_19.message : String(error_19)));
                    case 37: return [2 /*return*/];
                }
            });
        }); });
    };
    GitMemoryServer.prototype.handleGitStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var status_2, error_20;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.validateGitRepository()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.git.status()];
                    case 2:
                        status_2 = _a.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify(status_2, null, 2),
                                    },
                                ],
                            }];
                    case 3:
                        error_20 = _a.sent();
                        if (error_20 instanceof types_js_1.McpError) {
                            throw error_20;
                        }
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Git status failed: ".concat(error_20 instanceof Error ? error_20.message : String(error_20)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleGitLog = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var maxCount, log;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        maxCount = (args === null || args === void 0 ? void 0 : args.maxCount) || 10;
                        return [4 /*yield*/, this.git.log({ maxCount: maxCount })];
                    case 1:
                        log = _a.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify(log, null, 2),
                                    },
                                ],
                            }];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleGitDiff = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var staged, diff, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        staged = (args === null || args === void 0 ? void 0 : args.staged) || false;
                        if (!staged) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.git.diff(['--cached'])];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.git.diff()];
                    case 3:
                        _a = _b.sent();
                        _b.label = 4;
                    case 4:
                        diff = _a;
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: diff,
                                    },
                                ],
                            }];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleMemoryStore = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var key, content, _a, metadata, entry, error_21;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        key = args.key, content = args.content, _a = args.metadata, metadata = _a === void 0 ? {} : _a;
                        // Input validation using helper methods
                        this.validateStringInput(key, 'Key', 255);
                        this.validateStringInput(content, 'Content', 1000000); // 1MB limit
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        entry = {
                            id: key,
                            content: content,
                            metadata: metadata,
                            timestamp: Date.now(),
                        };
                        this.memory.set(key, entry);
                        this.setCachedMemory(key, entry);
                        return [4 /*yield*/, this.debouncedSave()];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: "Stored memory entry with key: ".concat(key),
                                    },
                                ],
                            }];
                    case 3:
                        error_21 = _b.sent();
                        if (error_21 instanceof types_js_1.McpError) {
                            throw error_21;
                        }
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Failed to store memory entry: ".concat(error_21 instanceof Error ? error_21.message : String(error_21)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleMemoryRetrieve = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var key, entry, memoryEntry;
            return __generator(this, function (_a) {
                key = args.key;
                entry = this.getCachedMemory(key);
                // If not in cache, get from memory and cache it
                if (!entry) {
                    memoryEntry = this.memory.get(key);
                    if (memoryEntry) {
                        entry = memoryEntry;
                        this.setCachedMemory(key, entry);
                    }
                }
                if (!entry) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, "Memory entry not found: ".concat(key));
                }
                return [2 /*return*/, {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(entry, null, 2),
                            },
                        ],
                    }];
            });
        });
    };
    GitMemoryServer.prototype.handleMemoryList = function () {
        return __awaiter(this, void 0, void 0, function () {
            var entries;
            return __generator(this, function (_a) {
                entries = Array.from(this.memory.values());
                return [2 /*return*/, {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(entries, null, 2),
                            },
                        ],
                    }];
            });
        });
    };
    GitMemoryServer.prototype.handleMemoryDelete = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var key, deleted;
            return __generator(this, function (_a) {
                key = args.key;
                deleted = this.memory.delete(key);
                if (!deleted) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, "Memory entry not found: ".concat(key));
                }
                this.saveMemory();
                return [2 /*return*/, {
                        content: [
                            {
                                type: 'text',
                                text: "Deleted memory entry with key: ".concat(key),
                            },
                        ],
                    }];
            });
        });
    };
    GitMemoryServer.prototype.handleMemorySearch = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var query, metadata, _a, limit, _b, sortBy, _c, sortOrder, results, searchQuery_2;
            return __generator(this, function (_d) {
                query = args.query, metadata = args.metadata, _a = args.limit, limit = _a === void 0 ? 10 : _a, _b = args.sortBy, sortBy = _b === void 0 ? 'timestamp' : _b, _c = args.sortOrder, sortOrder = _c === void 0 ? 'desc' : _c;
                results = Array.from(this.memory.values());
                // Filter by content query
                if (query) {
                    searchQuery_2 = query.toLowerCase();
                    results = results.filter(function (entry) {
                        return entry.content.toLowerCase().includes(searchQuery_2) ||
                            entry.id.toLowerCase().includes(searchQuery_2);
                    });
                }
                // Filter by metadata
                if (metadata) {
                    results = results.filter(function (entry) {
                        return Object.entries(metadata).every(function (_a) {
                            var key = _a[0], value = _a[1];
                            return entry.metadata[key] === value;
                        });
                    });
                }
                // Sort results
                results.sort(function (a, b) {
                    var aValue, bValue;
                    if (sortBy === 'timestamp') {
                        aValue = a.timestamp;
                        bValue = b.timestamp;
                    }
                    else if (sortBy === 'key') {
                        aValue = a.id;
                        bValue = b.id;
                    }
                    else {
                        aValue = a.timestamp;
                        bValue = b.timestamp;
                    }
                    if (sortOrder === 'asc') {
                        return aValue > bValue ? 1 : -1;
                    }
                    else {
                        return aValue < bValue ? 1 : -1;
                    }
                });
                // Limit results
                results = results.slice(0, limit);
                return [2 /*return*/, {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    total: results.length,
                                    results: results
                                }, null, 2),
                            },
                        ],
                    }];
            });
        });
    };
    GitMemoryServer.prototype.handleMemoryFilter = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var dateRange, tags, contentType, minLength, maxLength, results, fromDate_2, toDate_2;
            return __generator(this, function (_a) {
                dateRange = args.dateRange, tags = args.tags, contentType = args.contentType, minLength = args.minLength, maxLength = args.maxLength;
                results = Array.from(this.memory.values());
                // Filter by date range
                if (dateRange) {
                    fromDate_2 = dateRange.from ? new Date(dateRange.from) : null;
                    toDate_2 = dateRange.to ? new Date(dateRange.to) : null;
                    results = results.filter(function (entry) {
                        var entryDate = new Date(entry.timestamp);
                        if (fromDate_2 && entryDate < fromDate_2)
                            return false;
                        if (toDate_2 && entryDate > toDate_2)
                            return false;
                        return true;
                    });
                }
                // Filter by tags
                if (tags && tags.length > 0) {
                    results = results.filter(function (entry) {
                        var entryTags = entry.metadata.tags || [];
                        return tags.some(function (tag) { return entryTags.includes(tag); });
                    });
                }
                // Filter by content type
                if (contentType) {
                    results = results.filter(function (entry) {
                        return entry.metadata.contentType === contentType;
                    });
                }
                // Filter by content length
                if (minLength !== undefined) {
                    results = results.filter(function (entry) { return entry.content.length >= minLength; });
                }
                if (maxLength !== undefined) {
                    results = results.filter(function (entry) { return entry.content.length <= maxLength; });
                }
                return [2 /*return*/, {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    total: results.length,
                                    filters: { dateRange: dateRange, tags: tags, contentType: contentType, minLength: minLength, maxLength: maxLength },
                                    results: results
                                }, null, 2),
                            },
                        ],
                    }];
            });
        });
    };
    GitMemoryServer.prototype.handleGitAdd = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, files, filesToAdd, _i, filesToAdd_2, file, error_22;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = args.files, files = _a === void 0 ? ['.'] : _a;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.validateGitRepository()];
                    case 2:
                        _b.sent();
                        // Validate files input
                        if (!Array.isArray(files) && typeof files !== 'string') {
                            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, 'Files must be a string or array of strings');
                        }
                        filesToAdd = Array.isArray(files) ? files : [files];
                        // Validate each file path
                        for (_i = 0, filesToAdd_2 = filesToAdd; _i < filesToAdd_2.length; _i++) {
                            file = filesToAdd_2[_i];
                            if (typeof file !== 'string' || file.trim() === '') {
                                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, 'Each file path must be a non-empty string');
                            }
                        }
                        return [4 /*yield*/, this.git.add(filesToAdd)];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: "Added files to staging: ".concat(filesToAdd.join(', ')),
                                    },
                                ],
                            }];
                    case 4:
                        error_22 = _b.sent();
                        if (error_22 instanceof types_js_1.McpError) {
                            throw error_22;
                        }
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Git add failed: ".concat(error_22 instanceof Error ? error_22.message : String(error_22)));
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleGitCommit = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var message, author, options, result, error_23;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        message = args.message, author = args.author;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        options = { '-m': message };
                        if (author) {
                            options['--author'] = "".concat(author.name, " <").concat(author.email, ">");
                        }
                        return [4 /*yield*/, this.git.commit(message, undefined, options)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify(result, null, 2),
                                    },
                                ],
                            }];
                    case 3:
                        error_23 = _a.sent();
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Failed to commit: ".concat(error_23 instanceof Error ? error_23.message : String(error_23)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleGitPush = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, remote, branch, _b, force, options, result, _c, error_24;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = args.remote, remote = _a === void 0 ? 'origin' : _a, branch = args.branch, _b = args.force, force = _b === void 0 ? false : _b;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, , 7]);
                        options = {};
                        if (force)
                            options['--force'] = null;
                        if (!branch) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.git.push(remote, branch, options)];
                    case 2:
                        _c = _d.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.git.push(options)];
                    case 4:
                        _c = _d.sent();
                        _d.label = 5;
                    case 5:
                        result = _c;
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: "Successfully pushed to ".concat(remote).concat(branch ? "/".concat(branch) : ''),
                                    },
                                ],
                            }];
                    case 6:
                        error_24 = _d.sent();
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Failed to push: ".concat(error_24 instanceof Error ? error_24.message : String(error_24)));
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleGitPull = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, remote, branch, result, _b, error_25;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = args.remote, remote = _a === void 0 ? 'origin' : _a, branch = args.branch;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 6, , 7]);
                        if (!branch) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.git.pull(remote, branch)];
                    case 2:
                        _b = _c.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.git.pull()];
                    case 4:
                        _b = _c.sent();
                        _c.label = 5;
                    case 5:
                        result = _b;
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify(result, null, 2),
                                    },
                                ],
                            }];
                    case 6:
                        error_25 = _c.sent();
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Failed to pull: ".concat(error_25 instanceof Error ? error_25.message : String(error_25)));
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleGitBranch = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, action, name, _b, force, result, _c, error_26;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = args.action, action = _a === void 0 ? 'list' : _a, name = args.name, _b = args.force, force = _b === void 0 ? false : _b;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 12, , 13]);
                        result = void 0;
                        _c = action;
                        switch (_c) {
                            case 'list': return [3 /*break*/, 2];
                            case 'create': return [3 /*break*/, 4];
                            case 'delete': return [3 /*break*/, 6];
                            case 'checkout': return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 10];
                    case 2: return [4 /*yield*/, this.git.branch()];
                    case 3:
                        result = _d.sent();
                        return [3 /*break*/, 11];
                    case 4:
                        if (!name)
                            throw new Error('Branch name is required for create action');
                        return [4 /*yield*/, this.git.checkoutLocalBranch(name)];
                    case 5:
                        result = _d.sent();
                        return [3 /*break*/, 11];
                    case 6:
                        if (!name)
                            throw new Error('Branch name is required for delete action');
                        return [4 /*yield*/, this.git.deleteLocalBranch(name, force)];
                    case 7:
                        result = _d.sent();
                        return [3 /*break*/, 11];
                    case 8:
                        if (!name)
                            throw new Error('Branch name is required for checkout action');
                        return [4 /*yield*/, this.git.checkout(name)];
                    case 9:
                        result = _d.sent();
                        return [3 /*break*/, 11];
                    case 10: throw new Error("Unknown branch action: ".concat(action));
                    case 11: return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(result, null, 2),
                                },
                            ],
                        }];
                    case 12:
                        error_26 = _d.sent();
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Failed to execute branch operation: ".concat(error_26 instanceof Error ? error_26.message : String(error_26)));
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleGitMerge = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var branch, _a, noFastForward, options, result, error_27;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        branch = args.branch, _a = args.noFastForward, noFastForward = _a === void 0 ? false : _a;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        options = [];
                        if (noFastForward)
                            options.push('--no-ff');
                        return [4 /*yield*/, this.git.merge(__spreadArray([branch], options, true))];
                    case 2:
                        result = _b.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify(result, null, 2),
                                    },
                                ],
                            }];
                    case 3:
                        error_27 = _b.sent();
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Failed to merge: ".concat(error_27 instanceof Error ? error_27.message : String(error_27)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleAIGenerate = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, _a, taskType, response, error_28;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        prompt = args.prompt, _a = args.taskType, taskType = _a === void 0 ? 'code_analysis' : _a;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        if (!prompt || typeof prompt !== 'string') {
                            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, 'Prompt must be a non-empty string');
                        }
                        return [4 /*yield*/, this.generateAIResponse(prompt, taskType)];
                    case 2:
                        response = _b.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: response,
                                    },
                                ],
                            }];
                    case 3:
                        error_28 = _b.sent();
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "AI generation failed: ".concat(error_28 instanceof Error ? error_28.message : String(error_28)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GitMemoryServer.prototype.handleRequest = function (connection) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c, request, _d, name_1, args, _e, error_29, e_1_1;
            var _f, e_1, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        _j.trys.push([0, 41, 42, 47]);
                        _a = true, _b = __asyncValues(connection.requests());
                        _j.label = 1;
                    case 1: return [4 /*yield*/, _b.next()];
                    case 2:
                        if (!(_c = _j.sent(), _f = _c.done, !_f)) return [3 /*break*/, 40];
                        _h = _c.value;
                        _a = false;
                        request = _h;
                        _d = request.params, name_1 = _d.name, args = _d.arguments;
                        _j.label = 3;
                    case 3:
                        _j.trys.push([3, 38, , 39]);
                        _e = name_1;
                        switch (_e) {
                            case 'git_status': return [3 /*break*/, 4];
                            case 'git_log': return [3 /*break*/, 6];
                            case 'git_diff': return [3 /*break*/, 8];
                            case 'memory_store': return [3 /*break*/, 10];
                            case 'memory_retrieve': return [3 /*break*/, 12];
                            case 'memory_list': return [3 /*break*/, 14];
                            case 'memory_delete': return [3 /*break*/, 16];
                            case 'memory_search': return [3 /*break*/, 18];
                            case 'memory_filter': return [3 /*break*/, 20];
                            case 'git_add': return [3 /*break*/, 22];
                            case 'git_commit': return [3 /*break*/, 24];
                            case 'git_push': return [3 /*break*/, 26];
                            case 'git_pull': return [3 /*break*/, 28];
                            case 'git_branch': return [3 /*break*/, 30];
                            case 'git_merge': return [3 /*break*/, 32];
                            case 'ai_generate': return [3 /*break*/, 34];
                        }
                        return [3 /*break*/, 36];
                    case 4: return [4 /*yield*/, this.handleGitStatus()];
                    case 5: return [2 /*return*/, _j.sent()];
                    case 6: return [4 /*yield*/, this.handleGitLog(args)];
                    case 7: return [2 /*return*/, _j.sent()];
                    case 8: return [4 /*yield*/, this.handleGitDiff(args)];
                    case 9: return [2 /*return*/, _j.sent()];
                    case 10: return [4 /*yield*/, this.handleMemoryStore(args)];
                    case 11: return [2 /*return*/, _j.sent()];
                    case 12: return [4 /*yield*/, this.handleMemoryRetrieve(args)];
                    case 13: return [2 /*return*/, _j.sent()];
                    case 14: return [4 /*yield*/, this.handleMemoryList()];
                    case 15: return [2 /*return*/, _j.sent()];
                    case 16: return [4 /*yield*/, this.handleMemoryDelete(args)];
                    case 17: return [2 /*return*/, _j.sent()];
                    case 18: return [4 /*yield*/, this.handleMemorySearch(args)];
                    case 19: return [2 /*return*/, _j.sent()];
                    case 20: return [4 /*yield*/, this.handleMemoryFilter(args)];
                    case 21: return [2 /*return*/, _j.sent()];
                    case 22: return [4 /*yield*/, this.handleGitAdd(args)];
                    case 23: return [2 /*return*/, _j.sent()];
                    case 24: return [4 /*yield*/, this.handleGitCommit(args)];
                    case 25: return [2 /*return*/, _j.sent()];
                    case 26: return [4 /*yield*/, this.handleGitPush(args)];
                    case 27: return [2 /*return*/, _j.sent()];
                    case 28: return [4 /*yield*/, this.handleGitPull(args)];
                    case 29: return [2 /*return*/, _j.sent()];
                    case 30: return [4 /*yield*/, this.handleGitBranch(args)];
                    case 31: return [2 /*return*/, _j.sent()];
                    case 32: return [4 /*yield*/, this.handleGitMerge(args)];
                    case 33: return [2 /*return*/, _j.sent()];
                    case 34: return [4 /*yield*/, this.handleAIGenerate(args)];
                    case 35: return [2 /*return*/, _j.sent()];
                    case 36: throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, "Unknown tool: ".concat(name_1));
                    case 37: return [3 /*break*/, 39];
                    case 38:
                        error_29 = _j.sent();
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Tool execution failed: ".concat(error_29 instanceof Error ? error_29.message : String(error_29)));
                    case 39:
                        _a = true;
                        return [3 /*break*/, 1];
                    case 40: return [3 /*break*/, 47];
                    case 41:
                        e_1_1 = _j.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 47];
                    case 42:
                        _j.trys.push([42, , 45, 46]);
                        if (!(!_a && !_f && (_g = _b.return))) return [3 /*break*/, 44];
                        return [4 /*yield*/, _g.call(_b)];
                    case 43:
                        _j.sent();
                        _j.label = 44;
                    case 44: return [3 /*break*/, 46];
                    case 45:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 46: return [7 /*endfinally*/];
                    case 47: return [2 /*return*/];
                }
            });
        });
    };
    return GitMemoryServer;
}());
exports.GitMemoryServer = GitMemoryServer;
// Export the class for use in other modules
exports.default = GitMemoryServer;
