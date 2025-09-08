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
exports.LLMProviderService = void 0;
var axios_1 = require("axios");
var events_1 = require("events");
var LLMProviderService = /** @class */ (function (_super) {
    __extends(LLMProviderService, _super);
    function LLMProviderService(config, logger) {
        var _this = _super.call(this) || this;
        _this.providers = new Map();
        _this.clients = new Map();
        _this.cache = new Map();
        _this.rateLimiter = new Map();
        _this.config = config;
        _this.logger = logger;
        _this.initializeProviders();
        return _this;
    }
    LLMProviderService.prototype.initializeProviders = function () {
        for (var _i = 0, _a = Object.entries(this.config.providers); _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], providerConfig = _b[1];
            var provider = providerConfig;
            this.providers.set(id, provider);
            if (provider.enabled && provider.type === 'rest-api') {
                var client = axios_1.default.create({
                    baseURL: provider.config.baseURL,
                    timeout: provider.config.timeout || 30000,
                    headers: {
                        'Authorization': "Bearer ".concat(provider.config.apiKey),
                        'Content-Type': 'application/json'
                    }
                });
                this.clients.set(id, client);
            }
        }
        this.logger.info("Initialized ".concat(this.providers.size, " LLM providers"));
    };
    LLMProviderService.prototype.generateResponse = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, cacheKey, cached, provider, response, cacheKey, error_1;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        startTime = Date.now();
                        // Check cache first
                        if ((_a = this.config.cache) === null || _a === void 0 ? void 0 : _a.enabled) {
                            cacheKey = this.getCacheKey(request);
                            cached = this.cache.get(cacheKey);
                            if (cached && (Date.now() - cached.timestamp) < this.config.cache.ttl) {
                                this.emit('cache_hit', { cacheKey: cacheKey, request: request });
                                return [2 /*return*/, cached.response];
                            }
                        }
                        provider = this.getActiveProvider();
                        if (!provider) {
                            throw new Error('No active LLM provider available');
                        }
                        // Check rate limits
                        if (!this.checkRateLimit(provider.id)) {
                            throw new Error("Rate limit exceeded for provider ".concat(provider.id));
                        }
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.callProvider(provider, request)];
                    case 2:
                        response = _d.sent();
                        response.latency = Date.now() - startTime;
                        // Cache response
                        if ((_b = this.config.cache) === null || _b === void 0 ? void 0 : _b.enabled) {
                            cacheKey = this.getCacheKey(request);
                            this.cache.set(cacheKey, { response: response, timestamp: Date.now() });
                            // Clean old cache entries
                            if (this.cache.size > this.config.cache.maxSize) {
                                this.cleanCache();
                            }
                        }
                        this.emit('response_generated', { provider: provider.id, request: request, response: response });
                        return [2 /*return*/, response];
                    case 3:
                        error_1 = _d.sent();
                        this.logger.error("LLM request failed for provider ".concat(provider.id, ":"), error_1);
                        // Try fallback providers
                        if ((_c = this.config.fallback) === null || _c === void 0 ? void 0 : _c.enabled) {
                            return [2 /*return*/, this.tryFallbackProviders(request, provider.id, startTime)];
                        }
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LLMProviderService.prototype.callProvider = function (provider, request) {
        return __awaiter(this, void 0, void 0, function () {
            var client, model, maxTokens, temperature, requestBody, endpoint, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        client = this.clients.get(provider.id);
                        if (!client) {
                            throw new Error("No client available for provider ".concat(provider.id));
                        }
                        model = request.model || provider.config.models.default;
                        maxTokens = request.maxTokens || provider.config.maxTokens;
                        temperature = request.temperature || provider.config.temperature;
                        switch (provider.id) {
                            case 'openai':
                                endpoint = '/chat/completions';
                                requestBody = {
                                    model: model,
                                    messages: [{ role: 'user', content: request.prompt }],
                                    max_tokens: maxTokens,
                                    temperature: temperature
                                };
                                break;
                            case 'claude':
                                endpoint = '/messages';
                                requestBody = {
                                    model: model,
                                    messages: [{ role: 'user', content: request.prompt }],
                                    max_tokens: maxTokens,
                                    temperature: temperature
                                };
                                break;
                            case 'gemini':
                                endpoint = "/models/".concat(model, ":generateContent");
                                requestBody = {
                                    contents: [{ parts: [{ text: request.prompt }] }],
                                    generationConfig: {
                                        maxOutputTokens: maxTokens,
                                        temperature: temperature
                                    }
                                };
                                break;
                            default:
                                throw new Error("Unsupported provider: ".concat(provider.id));
                        }
                        return [4 /*yield*/, client.post(endpoint, requestBody)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, this.parseProviderResponse(provider.id, response.data, model)];
                }
            });
        });
    };
    LLMProviderService.prototype.parseProviderResponse = function (providerId, data, model) {
        var _a, _b, _c;
        var content;
        var usage;
        switch (providerId) {
            case 'openai':
                content = data.choices[0].message.content;
                usage = data.usage;
                break;
            case 'claude':
                content = data.content[0].text;
                usage = data.usage;
                break;
            case 'gemini':
                content = data.candidates[0].content.parts[0].text;
                usage = {
                    promptTokens: ((_a = data.usageMetadata) === null || _a === void 0 ? void 0 : _a.promptTokenCount) || 0,
                    completionTokens: ((_b = data.usageMetadata) === null || _b === void 0 ? void 0 : _b.candidatesTokenCount) || 0,
                    totalTokens: ((_c = data.usageMetadata) === null || _c === void 0 ? void 0 : _c.totalTokenCount) || 0
                };
                break;
            default:
                throw new Error("Unknown provider response format: ".concat(providerId));
        }
        return {
            content: content,
            usage: {
                promptTokens: usage.promptTokens || usage.prompt_tokens || 0,
                completionTokens: usage.completionTokens || usage.completion_tokens || 0,
                totalTokens: usage.totalTokens || usage.total_tokens || 0
            },
            model: model,
            provider: providerId,
            latency: 0 // Will be set by caller
        };
    };
    LLMProviderService.prototype.getActiveProvider = function () {
        var enabledProviders = Array.from(this.providers.values())
            .filter(function (p) { return p.enabled; })
            .sort(function (a, b) { return a.priority - b.priority; });
        return enabledProviders[0] || null;
    };
    LLMProviderService.prototype.tryFallbackProviders = function (request, failedProviderId, startTime) {
        return __awaiter(this, void 0, void 0, function () {
            var fallbackOrder, _i, fallbackOrder_1, providerId, provider, response, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fallbackOrder = this.config.fallback.order.filter(function (id) { var _a; return id !== failedProviderId && ((_a = _this.providers.get(id)) === null || _a === void 0 ? void 0 : _a.enabled); });
                        _i = 0, fallbackOrder_1 = fallbackOrder;
                        _a.label = 1;
                    case 1:
                        if (!(_i < fallbackOrder_1.length)) return [3 /*break*/, 6];
                        providerId = fallbackOrder_1[_i];
                        provider = this.providers.get(providerId);
                        if (!provider)
                            return [3 /*break*/, 5];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        this.logger.info("Trying fallback provider: ".concat(providerId));
                        return [4 /*yield*/, this.callProvider(provider, request)];
                    case 3:
                        response = _a.sent();
                        response.latency = Date.now() - startTime;
                        this.emit('fallback_success', { provider: providerId, request: request, response: response });
                        return [2 /*return*/, response];
                    case 4:
                        error_2 = _a.sent();
                        this.logger.warn("Fallback provider ".concat(providerId, " also failed:"), error_2);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: throw new Error('All LLM providers failed');
                }
            });
        });
    };
    LLMProviderService.prototype.checkRateLimit = function (providerId) {
        var _a;
        if (!((_a = this.config.rateLimit) === null || _a === void 0 ? void 0 : _a.enabled))
            return true;
        var now = Date.now();
        var limit = this.rateLimiter.get(providerId);
        if (!limit || now > limit.resetTime) {
            this.rateLimiter.set(providerId, {
                count: 1,
                resetTime: now + 60000 // 1 minute
            });
            return true;
        }
        if (limit.count >= this.config.rateLimit.requestsPerMinute) {
            return false;
        }
        limit.count++;
        return true;
    };
    LLMProviderService.prototype.getCacheKey = function (request) {
        return Buffer.from(JSON.stringify({
            prompt: request.prompt,
            model: request.model,
            maxTokens: request.maxTokens,
            temperature: request.temperature
        })).toString('base64');
    };
    LLMProviderService.prototype.cleanCache = function () {
        var _this = this;
        var entries = Array.from(this.cache.entries())
            .sort(function (a, b) { return a[1].timestamp - b[1].timestamp; });
        var toDelete = entries.slice(0, Math.floor(this.cache.size * 0.2));
        toDelete.forEach(function (_a) {
            var key = _a[0];
            return _this.cache.delete(key);
        });
    };
    LLMProviderService.prototype.getProviderStatus = function () {
        var status = {};
        for (var _i = 0, _a = this.providers; _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], provider = _b[1];
            status[id] = {
                enabled: provider.enabled,
                priority: provider.priority,
                hasClient: this.clients.has(id),
                rateLimit: this.rateLimiter.get(id)
            };
        }
        return status;
    };
    LLMProviderService.prototype.enableProvider = function (providerId) {
        var provider = this.providers.get(providerId);
        if (provider) {
            provider.enabled = true;
            this.logger.info("Enabled LLM provider: ".concat(providerId));
        }
    };
    LLMProviderService.prototype.disableProvider = function (providerId) {
        var provider = this.providers.get(providerId);
        if (provider) {
            provider.enabled = false;
            this.logger.info("Disabled LLM provider: ".concat(providerId));
        }
    };
    return LLMProviderService;
}(events_1.EventEmitter));
exports.LLMProviderService = LLMProviderService;
