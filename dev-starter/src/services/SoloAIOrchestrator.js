"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoloAIOrchestrator = void 0;
var events_1 = require("events");
var SoloAIOrchestrator = /** @class */ (function (_super) {
    __extends(SoloAIOrchestrator, _super);
    function SoloAIOrchestrator(llmService, logger) {
        var _this = _super.call(this) || this;
        _this.taskQueue = [];
        _this.activeTasks = new Map();
        _this.results = new Map();
        _this.isProcessing = false;
        _this.maxConcurrentTasks = 3;
        _this.taskHistory = [];
        _this.llmService = llmService;
        _this.logger = logger;
        _this.setupEventHandlers();
        return _this;
    }
    SoloAIOrchestrator.prototype.setupEventHandlers = function () {
        var _this = this;
        this.llmService.on('response_generated', function (data) {
            _this.emit('llm_response', data);
        });
        this.llmService.on('fallback_success', function (data) {
            _this.emit('llm_fallback', data);
        });
    };
    SoloAIOrchestrator.prototype.executeTask = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, llmRequest, response, result, error_1, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        this.logger.info("Executing AI task: ".concat(task.id, " (").concat(task.type, ")"));
                        this.activeTasks.set(task.id, task);
                        llmRequest = this.prepareLLMRequest(task);
                        return [4 /*yield*/, this.executeWithTimeout(llmRequest, task.timeout || 30000)];
                    case 2:
                        response = _a.sent();
                        result = {
                            taskId: task.id,
                            success: true,
                            response: response,
                            executionTime: Date.now() - startTime,
                            timestamp: Date.now()
                        };
                        this.results.set(task.id, result);
                        this.taskHistory.push(result);
                        this.activeTasks.delete(task.id);
                        this.emit('task_completed', result);
                        this.logger.info("Task completed: ".concat(task.id, " in ").concat(result.executionTime, "ms"));
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        result = {
                            taskId: task.id,
                            success: false,
                            error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                            executionTime: Date.now() - startTime,
                            timestamp: Date.now()
                        };
                        this.results.set(task.id, result);
                        this.taskHistory.push(result);
                        this.activeTasks.delete(task.id);
                        this.emit('task_failed', result);
                        this.logger.error("Task failed: ".concat(task.id), error_1);
                        return [2 /*return*/, result];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SoloAIOrchestrator.prototype.prepareLLMRequest = function (task) {
        var systemPrompt = '';
        var model = 'default';
        switch (task.type) {
            case 'code_analysis':
                systemPrompt = 'You are an expert code analyst. Analyze the provided code and identify issues, improvements, and patterns.';
                model = 'code';
                break;
            case 'code_generation':
                systemPrompt = 'You are an expert software developer. Generate high-quality, well-documented code based on the requirements.';
                model = 'code';
                break;
            case 'debugging':
                systemPrompt = 'You are an expert debugger. Analyze the error and provide a solution with explanation.';
                model = 'smart';
                break;
            case 'refactoring':
                systemPrompt = 'You are an expert at code refactoring. Improve the code while maintaining functionality.';
                model = 'code';
                break;
            case 'documentation':
                systemPrompt = 'You are a technical writer. Create clear, comprehensive documentation.';
                model = 'fast';
                break;
            default:
                systemPrompt = 'You are a helpful AI assistant.';
        }
        var fullPrompt = "".concat(systemPrompt, "\n\n").concat(task.prompt);
        return {
            prompt: fullPrompt,
            model: model,
            context: task.context,
            maxTokens: this.getMaxTokensForTask(task.type),
            temperature: this.getTemperatureForTask(task.type)
        };
    };
    SoloAIOrchestrator.prototype.getMaxTokensForTask = function (taskType) {
        switch (taskType) {
            case 'code_generation':
            case 'refactoring':
                return 2048;
            case 'code_analysis':
            case 'debugging':
                return 1024;
            case 'documentation':
                return 1536;
            default:
                return 1024;
        }
    };
    SoloAIOrchestrator.prototype.getTemperatureForTask = function (taskType) {
        switch (taskType) {
            case 'code_generation':
            case 'refactoring':
                return 0.3; // More deterministic for code
            case 'code_analysis':
            case 'debugging':
                return 0.1; // Very deterministic for analysis
            case 'documentation':
                return 0.7; // More creative for documentation
            default:
                return 0.5;
        }
    };
    SoloAIOrchestrator.prototype.executeWithTimeout = function (request, timeout) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var timer = setTimeout(function () {
                            reject(new Error("Task timeout after ".concat(timeout, "ms")));
                        }, timeout);
                        _this.llmService.generateResponse(request)
                            .then(function (response) {
                            clearTimeout(timer);
                            resolve(response);
                        })
                            .catch(function (error) {
                            clearTimeout(timer);
                            reject(error);
                        });
                    })];
            });
        });
    };
    SoloAIOrchestrator.prototype.queueTask = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.taskQueue.push(task);
                this.logger.info("Task queued: ".concat(task.id, " (").concat(task.type, ")"));
                if (!this.isProcessing) {
                    this.processQueue();
                }
                return [2 /*return*/, task.id];
            });
        });
    };
    SoloAIOrchestrator.prototype.processQueue = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _loop_1, this_1;
            var _this = this;
            return __generator(this, function (_a) {
                if (this.isProcessing)
                    return [2 /*return*/];
                this.isProcessing = true;
                _loop_1 = function () {
                    var task = this_1.taskQueue.shift();
                    if (task) {
                        // Execute task without waiting (fire and forget for queue processing)
                        this_1.executeTask(task).catch(function (error) {
                            _this.logger.error("Queue task execution failed: ".concat(task.id), error);
                        });
                    }
                };
                this_1 = this;
                while (this.taskQueue.length > 0 && this.activeTasks.size < this.maxConcurrentTasks) {
                    _loop_1();
                }
                this.isProcessing = false;
                // Continue processing if there are more tasks
                if (this.taskQueue.length > 0) {
                    setTimeout(function () { return _this.processQueue(); }, 100);
                }
                return [2 /*return*/];
            });
        });
    };
    SoloAIOrchestrator.prototype.getTaskResult = function (taskId) {
        return this.results.get(taskId) || null;
    };
    SoloAIOrchestrator.prototype.getActiveTasksCount = function () {
        return this.activeTasks.size;
    };
    SoloAIOrchestrator.prototype.getQueueLength = function () {
        return this.taskQueue.length;
    };
    SoloAIOrchestrator.prototype.getTaskHistory = function (limit) {
        if (limit === void 0) { limit = 100; }
        return this.taskHistory.slice(-limit);
    };
    SoloAIOrchestrator.prototype.getStatistics = function () {
        var history = this.taskHistory;
        var successful = history.filter(function (r) { return r.success; }).length;
        var failed = history.filter(function (r) { return !r.success; }).length;
        var avgExecutionTime = history.length > 0
            ? history.reduce(function (sum, r) { return sum + r.executionTime; }, 0) / history.length
            : 0;
        return {
            totalTasks: history.length,
            successful: successful,
            failed: failed,
            successRate: history.length > 0 ? (successful / history.length) * 100 : 0,
            avgExecutionTime: Math.round(avgExecutionTime),
            activeTasks: this.activeTasks.size,
            queueLength: this.taskQueue.length
        };
    };
    SoloAIOrchestrator.prototype.clearHistory = function () {
        this.taskHistory = [];
        this.results.clear();
        this.logger.info('Task history cleared');
    };
    SoloAIOrchestrator.prototype.setMaxConcurrentTasks = function (max) {
        this.maxConcurrentTasks = Math.max(1, Math.min(10, max));
        this.logger.info("Max concurrent tasks set to: ".concat(this.maxConcurrentTasks));
    };
    return SoloAIOrchestrator;
}(events_1.EventEmitter));
exports.SoloAIOrchestrator = SoloAIOrchestrator;
