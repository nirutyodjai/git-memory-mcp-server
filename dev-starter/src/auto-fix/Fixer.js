"use strict";
/**
 * Auto-Fix Fixer
 *
 * Generates and applies fixes for detected issues. Works with the Detector
 * to create patches, update tests, and prepare changes for verification.
 */
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FIXER_CONFIG = exports.Fixer = exports.FixStatus = exports.FixStrategy = exports.FixType = void 0;
var events_1 = require("events");
var fs = require("fs/promises");
var path = require("path");
var logger_1 = require("../utils/logger");
var Detector_1 = require("./Detector");
// Fix types and strategies
var FixType;
(function (FixType) {
    FixType["PATCH"] = "patch";
    FixType["REPLACEMENT"] = "replacement";
    FixType["INSERTION"] = "insertion";
    FixType["DELETION"] = "deletion";
    FixType["REFACTOR"] = "refactor";
    FixType["CONFIGURATION"] = "configuration";
    FixType["DEPENDENCY"] = "dependency";
})(FixType || (exports.FixType = FixType = {}));
var FixStrategy;
(function (FixStrategy) {
    FixStrategy["CONSERVATIVE"] = "conservative";
    FixStrategy["STANDARD"] = "standard";
    FixStrategy["AGGRESSIVE"] = "aggressive"; // More comprehensive fixes
})(FixStrategy || (exports.FixStrategy = FixStrategy = {}));
var FixStatus;
(function (FixStatus) {
    FixStatus["PENDING"] = "pending";
    FixStatus["GENERATING"] = "generating";
    FixStatus["GENERATED"] = "generated";
    FixStatus["APPLYING"] = "applying";
    FixStatus["APPLIED"] = "applied";
    FixStatus["TESTING"] = "testing";
    FixStatus["VERIFIED"] = "verified";
    FixStatus["FAILED"] = "failed";
    FixStatus["REJECTED"] = "rejected";
})(FixStatus || (exports.FixStatus = FixStatus = {}));
/**
 * Auto-Fix Fixer
 *
 * Generates and applies fixes for detected issues
 */
var Fixer = /** @class */ (function (_super) {
    __extends(Fixer, _super);
    function Fixer(config, logger) {
        var _this = _super.call(this) || this;
        _this.fixes = new Map();
        _this.activeFixJobs = new Map();
        _this.templates = new Map();
        _this.statistics = {
            totalGenerated: 0,
            totalApplied: 0,
            totalSuccessful: 0,
            totalFailed: 0,
            averageConfidence: 0,
            averageGenerationTime: 0,
            averageApplicationTime: 0,
            byType: {},
            byStrategy: {}
        };
        _this.config = config;
        _this.logger = logger || new logger_1.Logger({ level: 'info' });
        // Load built-in templates
        _this.loadBuiltInTemplates();
        // Load custom templates
        if (config.templates.enabled) {
            _this.loadCustomTemplates();
        }
        return _this;
    }
    /**
     * Initialize the fixer
     */
    Fixer.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info('Initializing Auto-Fix Fixer...');
                        if (!this.config.aiProvider.enabled) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.validateAIProvider()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.logger.info('Auto-Fix Fixer initialized successfully');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate a fix for an issue
     */
    Fixer.prototype.generateFix = function (issue_1) {
        return __awaiter(this, arguments, void 0, function (issue, strategy) {
            var startTime, fix, actions, testUpdates, error_1;
            if (strategy === void 0) { strategy = this.config.defaultStrategy; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        this.logger.info("Generating fix for issue ".concat(issue.id, " using ").concat(strategy, " strategy"));
                        // Check if fix is already being generated
                        if (this.activeFixJobs.has(issue.id)) {
                            throw new Error("Fix generation already in progress for issue ".concat(issue.id));
                        }
                        fix = {
                            id: "fix_".concat(issue.id, "_").concat(Date.now()),
                            issueId: issue.id,
                            type: this.inferFixType(issue),
                            strategy: strategy,
                            status: FixStatus.GENERATING,
                            title: "Fix for: ".concat(issue.title),
                            description: "Auto-generated fix for ".concat(issue.type, " in ").concat(issue.location.file),
                            actions: [],
                            testUpdates: [],
                            estimatedImpact: {
                                filesChanged: 0,
                                linesChanged: 0,
                                testsAffected: 0,
                                riskScore: 0
                            },
                            metadata: {
                                generatedBy: 'auto-fixer',
                                generatedAt: Date.now(),
                                aiModel: this.config.aiProvider.model,
                                confidence: 0,
                                reviewRequired: this.config.safety.requireReview[issue.severity]
                            },
                            validation: {
                                syntaxCheck: false,
                                testsPassing: false,
                                lintPassing: false,
                                securityCheck: false
                            }
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        // Store fix
                        this.fixes.set(fix.id, fix);
                        return [4 /*yield*/, this.generateFixActions(issue, strategy)];
                    case 2:
                        actions = _a.sent();
                        fix.actions = actions;
                        return [4 /*yield*/, this.generateTestUpdates(issue, actions)];
                    case 3:
                        testUpdates = _a.sent();
                        fix.testUpdates = testUpdates;
                        // Calculate estimated impact
                        fix.estimatedImpact = this.calculateEstimatedImpact(actions, testUpdates);
                        // Calculate confidence
                        fix.metadata.confidence = this.calculateConfidence(issue, actions);
                        // Update status
                        fix.status = FixStatus.GENERATED;
                        // Update statistics
                        this.updateStatistics(fix, Date.now() - startTime);
                        this.emit('fix_generated', fix);
                        this.logger.info("Fix generated successfully: ".concat(fix.id));
                        return [2 /*return*/, fix];
                    case 4:
                        error_1 = _a.sent();
                        fix.status = FixStatus.FAILED;
                        this.logger.error("Failed to generate fix for issue ".concat(issue.id, ":"), error_1);
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Apply a generated fix
     */
    Fixer.prototype.applyFix = function (fixId) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, fix, result, applicationStartTime, validationStartTime, validationResult, error_2, rollbackError_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        fix = this.fixes.get(fixId);
                        if (!fix) {
                            throw new Error("Fix not found: ".concat(fixId));
                        }
                        if (fix.status !== FixStatus.GENERATED) {
                            throw new Error("Fix ".concat(fixId, " is not ready for application (status: ").concat(fix.status, ")"));
                        }
                        this.logger.info("Applying fix: ".concat(fixId));
                        result = {
                            fix: fix,
                            success: false,
                            warnings: [],
                            metrics: {
                                generationTime: 0,
                                applicationTime: 0,
                                validationTime: 0,
                                totalTime: 0
                            }
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 13]);
                        fix.status = FixStatus.APPLYING;
                        if (!this.config.safety.requireBackup) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.createBackup(fix)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        applicationStartTime = Date.now();
                        return [4 /*yield*/, this.applyFixActions(fix.actions)];
                    case 4:
                        _a.sent();
                        result.metrics.applicationTime = Date.now() - applicationStartTime;
                        if (!(fix.testUpdates.length > 0)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.applyTestUpdates(fix.testUpdates)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        fix.status = FixStatus.APPLIED;
                        fix.metadata.appliedAt = Date.now();
                        validationStartTime = Date.now();
                        return [4 /*yield*/, this.validateFix(fix)];
                    case 7:
                        validationResult = _a.sent();
                        result.metrics.validationTime = Date.now() - validationStartTime;
                        fix.validation = validationResult;
                        if (this.isValidationSuccessful(validationResult)) {
                            fix.status = FixStatus.VERIFIED;
                            fix.metadata.verifiedAt = Date.now();
                            result.success = true;
                            this.statistics.totalSuccessful++;
                        }
                        else {
                            fix.status = FixStatus.FAILED;
                            result.success = false;
                            result.error = 'Validation failed';
                            result.warnings.push('Fix validation failed, consider rollback');
                            this.statistics.totalFailed++;
                        }
                        return [3 /*break*/, 13];
                    case 8:
                        error_2 = _a.sent();
                        fix.status = FixStatus.FAILED;
                        result.success = false;
                        result.error = error_2 instanceof Error ? error_2.message : String(error_2);
                        this.statistics.totalFailed++;
                        if (!fix.metadata.rollbackInfo) return [3 /*break*/, 12];
                        _a.label = 9;
                    case 9:
                        _a.trys.push([9, 11, , 12]);
                        return [4 /*yield*/, this.rollbackFix(fix)];
                    case 10:
                        _a.sent();
                        result.warnings.push('Fix rolled back due to error');
                        return [3 /*break*/, 12];
                    case 11:
                        rollbackError_1 = _a.sent();
                        result.warnings.push('Failed to rollback fix');
                        this.logger.error('Rollback failed:', rollbackError_1);
                        return [3 /*break*/, 12];
                    case 12: return [3 /*break*/, 13];
                    case 13:
                        result.metrics.totalTime = Date.now() - startTime;
                        this.statistics.totalApplied++;
                        this.emit('fix_applied', result);
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Get fix by ID
     */
    Fixer.prototype.getFix = function (id) {
        return this.fixes.get(id);
    };
    /**
     * Get all fixes with optional filtering
     */
    Fixer.prototype.getFixes = function (filters) {
        var fixes = Array.from(this.fixes.values());
        if (filters) {
            if (filters.issueId) {
                fixes = fixes.filter(function (fix) { return fix.issueId === filters.issueId; });
            }
            if (filters.status) {
                fixes = fixes.filter(function (fix) { return filters.status.includes(fix.status); });
            }
            if (filters.type) {
                fixes = fixes.filter(function (fix) { return filters.type.includes(fix.type); });
            }
            if (filters.strategy) {
                fixes = fixes.filter(function (fix) { return filters.strategy.includes(fix.strategy); });
            }
        }
        return fixes.sort(function (a, b) { return b.metadata.generatedAt - a.metadata.generatedAt; });
    };
    /**
     * Rollback a fix
     */
    Fixer.prototype.rollbackFix = function (fix) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, _b, filePath, originalContent;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!fix.metadata.rollbackInfo) {
                            throw new Error('No rollback information available');
                        }
                        this.logger.info("Rolling back fix: ".concat(fix.id));
                        _i = 0, _a = Object.entries(fix.metadata.rollbackInfo.originalFiles);
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        _b = _a[_i], filePath = _b[0], originalContent = _b[1];
                        return [4 /*yield*/, fs.writeFile(filePath, originalContent, 'utf8')];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        fix.status = FixStatus.REJECTED;
                        this.emit('fix_rolled_back', fix);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get fixer statistics
     */
    Fixer.prototype.getStatistics = function () {
        return __assign({}, this.statistics);
    };
    // Private methods
    Fixer.prototype.loadBuiltInTemplates = function () {
        // Load common fix templates
        var builtInTemplates = [
            {
                id: 'missing_semicolon',
                name: 'Missing Semicolon',
                description: 'Add missing semicolon at end of statement',
                issueTypes: [Detector_1.IssueType.SYNTAX_ERROR, Detector_1.IssueType.LINT_ERROR],
                pattern: /(.+)(?<!;)\s*$/,
                replacement: '$1;',
                confidence: 0.9,
                riskLevel: 'low'
            },
            {
                id: 'unused_import',
                name: 'Remove Unused Import',
                description: 'Remove unused import statement',
                issueTypes: [Detector_1.IssueType.LINT_WARNING],
                pattern: /^import\s+.*?\s+from\s+['"].*?['"];?\s*$/m,
                replacement: '',
                confidence: 0.8,
                riskLevel: 'low'
            },
            {
                id: 'missing_return_type',
                name: 'Add Return Type',
                description: 'Add explicit return type to function',
                issueTypes: [Detector_1.IssueType.TYPE_ERROR, Detector_1.IssueType.LINT_WARNING],
                pattern: /function\s+(\w+)\s*\([^)]*\)\s*{/,
                replacement: 'function $1(): void {',
                confidence: 0.7,
                riskLevel: 'medium'
            }
        ];
        for (var _i = 0, builtInTemplates_1 = builtInTemplates; _i < builtInTemplates_1.length; _i++) {
            var template = builtInTemplates_1[_i];
            this.templates.set(template.id, template);
        }
    };
    Fixer.prototype.loadCustomTemplates = function () {
        for (var _i = 0, _a = Object.entries(this.config.templates.customTemplates); _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], template = _b[1];
            this.templates.set(id, template);
        }
    };
    Fixer.prototype.validateAIProvider = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.config.aiProvider.apiKey && !this.config.aiProvider.endpoint) {
                    throw new Error('AI provider requires either API key or endpoint');
                }
                // TODO: Test AI provider connection
                this.logger.debug('AI provider validation passed');
                return [2 /*return*/];
            });
        });
    };
    Fixer.prototype.inferFixType = function (issue) {
        switch (issue.type) {
            case Detector_1.IssueType.SYNTAX_ERROR:
            case Detector_1.IssueType.LINT_ERROR:
            case Detector_1.IssueType.TYPE_ERROR:
                return FixType.PATCH;
            case Detector_1.IssueType.TEST_FAILURE:
                return FixType.REFACTOR;
            case Detector_1.IssueType.DEPENDENCY_ISSUE:
                return FixType.DEPENDENCY;
            case Detector_1.IssueType.SECURITY_VULNERABILITY:
                return FixType.REPLACEMENT;
            default:
                return FixType.PATCH;
        }
    };
    Fixer.prototype.generateFixActions = function (issue, strategy) {
        return __awaiter(this, void 0, void 0, function () {
            var actions, templateAction, aiActions, heuristicActions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        actions = [];
                        return [4 /*yield*/, this.tryTemplateFix(issue)];
                    case 1:
                        templateAction = _a.sent();
                        if (templateAction) {
                            actions.push(templateAction);
                            return [2 /*return*/, actions];
                        }
                        if (!this.config.aiProvider.enabled) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.generateAIFix(issue, strategy)];
                    case 2:
                        aiActions = _a.sent();
                        actions.push.apply(actions, aiActions);
                        _a.label = 3;
                    case 3:
                        if (!(actions.length === 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.generateHeuristicFix(issue, strategy)];
                    case 4:
                        heuristicActions = _a.sent();
                        actions.push.apply(actions, heuristicActions);
                        _a.label = 5;
                    case 5: return [2 /*return*/, actions];
                }
            });
        });
    };
    Fixer.prototype.tryTemplateFix = function (issue) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, template, fileContent, lines, line, match, replacement;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = this.templates.values();
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        template = _a[_i];
                        if (!template.issueTypes.includes(issue.type)) {
                            return [3 /*break*/, 3];
                        }
                        return [4 /*yield*/, fs.readFile(issue.location.file, 'utf8')];
                    case 2:
                        fileContent = _b.sent();
                        lines = fileContent.split('\n');
                        if (issue.location.line && issue.location.line <= lines.length) {
                            line = lines[issue.location.line - 1];
                            match = line.match(template.pattern);
                            if (match) {
                                replacement = typeof template.replacement === 'function'
                                    ? template.replacement(match, { issue: issue, line: line, lines: lines })
                                    : line.replace(template.pattern, template.replacement);
                                return [2 /*return*/, {
                                        type: FixType.REPLACEMENT,
                                        file: issue.location.file,
                                        startLine: issue.location.line,
                                        endLine: issue.location.line,
                                        originalContent: line,
                                        newContent: replacement,
                                        description: template.description,
                                        confidence: template.confidence,
                                        riskLevel: template.riskLevel
                                    }];
                            }
                        }
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, null];
                }
            });
        });
    };
    Fixer.prototype.generateAIFix = function (issue, strategy) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Implement AI-based fix generation
                // This would call the configured AI provider with the issue context
                // and generate appropriate fix actions
                this.logger.debug("AI fix generation not implemented yet for issue ".concat(issue.id));
                return [2 /*return*/, []];
            });
        });
    };
    Fixer.prototype.generateHeuristicFix = function (issue, strategy) {
        return __awaiter(this, void 0, void 0, function () {
            var actions, _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        actions = [];
                        _a = issue.type;
                        switch (_a) {
                            case Detector_1.IssueType.LINT_ERROR: return [3 /*break*/, 1];
                            case Detector_1.IssueType.SYNTAX_ERROR: return [3 /*break*/, 4];
                        }
                        return [3 /*break*/, 7];
                    case 1:
                        if (!issue.title.includes('semicolon')) return [3 /*break*/, 3];
                        _c = (_b = actions).push;
                        return [4 /*yield*/, this.createSemicolonFix(issue)];
                    case 2:
                        _c.apply(_b, [_f.sent()]);
                        _f.label = 3;
                    case 3: return [3 /*break*/, 7];
                    case 4:
                        if (!(issue.title.includes('bracket') || issue.title.includes('brace'))) return [3 /*break*/, 6];
                        _e = (_d = actions).push;
                        return [4 /*yield*/, this.createBracketFix(issue)];
                    case 5:
                        _e.apply(_d, [_f.sent()]);
                        _f.label = 6;
                    case 6: return [3 /*break*/, 7];
                    case 7: return [2 /*return*/, actions];
                }
            });
        });
    };
    Fixer.prototype.createSemicolonFix = function (issue) {
        return __awaiter(this, void 0, void 0, function () {
            var fileContent, lines, lineIndex, line;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs.readFile(issue.location.file, 'utf8')];
                    case 1:
                        fileContent = _a.sent();
                        lines = fileContent.split('\n');
                        lineIndex = (issue.location.line || 1) - 1;
                        line = lines[lineIndex];
                        return [2 /*return*/, {
                                type: FixType.REPLACEMENT,
                                file: issue.location.file,
                                startLine: issue.location.line,
                                endLine: issue.location.line,
                                originalContent: line,
                                newContent: line.trimEnd() + ';',
                                description: 'Add missing semicolon',
                                confidence: 0.9,
                                riskLevel: 'low'
                            }];
                }
            });
        });
    };
    Fixer.prototype.createBracketFix = function (issue) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Implement bracket/brace fixing logic
                throw new Error('Bracket fix not implemented');
            });
        });
    };
    Fixer.prototype.generateTestUpdates = function (issue, actions) {
        return __awaiter(this, void 0, void 0, function () {
            var updates;
            return __generator(this, function (_a) {
                updates = [];
                // TODO: Implement test update generation
                // This would analyze the fix actions and determine if tests need to be updated
                return [2 /*return*/, updates];
            });
        });
    };
    Fixer.prototype.calculateEstimatedImpact = function (actions, testUpdates) {
        var filesChanged = new Set(__spreadArray(__spreadArray([], actions.map(function (a) { return a.file; }), true), testUpdates.map(function (t) { return t.file; }), true)).size;
        var linesChanged = actions.reduce(function (sum, action) {
            var startLine = action.startLine || 1;
            var endLine = action.endLine || startLine;
            return sum + (endLine - startLine + 1);
        }, 0);
        var testsAffected = testUpdates.length;
        // Calculate risk score based on various factors
        var riskScore = Math.min(1, ((filesChanged * 0.1) +
            (linesChanged * 0.01) +
            (testsAffected * 0.2) +
            (actions.some(function (a) { return a.riskLevel === 'high'; }) ? 0.5 : 0) +
            (actions.some(function (a) { return a.riskLevel === 'medium'; }) ? 0.2 : 0)));
        return {
            filesChanged: filesChanged,
            linesChanged: linesChanged,
            testsAffected: testsAffected,
            riskScore: riskScore
        };
    };
    Fixer.prototype.calculateConfidence = function (issue, actions) {
        if (actions.length === 0)
            return 0;
        var avgConfidence = actions.reduce(function (sum, action) { return sum + action.confidence; }, 0) / actions.length;
        // Adjust confidence based on issue complexity
        var adjustment = 1;
        if (issue.severity === Detector_1.IssueSeverity.CRITICAL)
            adjustment *= 0.8;
        if (issue.type === Detector_1.IssueType.SECURITY_VULNERABILITY)
            adjustment *= 0.7;
        if (actions.some(function (a) { return a.riskLevel === 'high'; }))
            adjustment *= 0.8;
        return Math.min(1, avgConfidence * adjustment);
    };
    Fixer.prototype.createBackup = function (fix) {
        return __awaiter(this, void 0, void 0, function () {
            var backupDir, originalFiles, _i, _a, action, content, backupFile;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        backupDir = path.join(process.cwd(), '.auto-fix-backups', fix.id);
                        return [4 /*yield*/, fs.mkdir(backupDir, { recursive: true })];
                    case 1:
                        _b.sent();
                        originalFiles = {};
                        _i = 0, _a = fix.actions;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        action = _a[_i];
                        if (!!originalFiles[action.file]) return [3 /*break*/, 5];
                        return [4 /*yield*/, fs.readFile(action.file, 'utf8')];
                    case 3:
                        content = _b.sent();
                        originalFiles[action.file] = content;
                        backupFile = path.join(backupDir, path.basename(action.file));
                        return [4 /*yield*/, fs.writeFile(backupFile, content, 'utf8')];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 2];
                    case 6:
                        fix.metadata.rollbackInfo = {
                            backupPath: backupDir,
                            originalFiles: originalFiles
                        };
                        return [2 /*return*/];
                }
            });
        });
    };
    Fixer.prototype.applyFixActions = function (actions) {
        return __awaiter(this, void 0, void 0, function () {
            var actionsByFile, _i, actions_1, action, _a, actionsByFile_1, _b, filePath, fileActions;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        actionsByFile = new Map();
                        for (_i = 0, actions_1 = actions; _i < actions_1.length; _i++) {
                            action = actions_1[_i];
                            if (!actionsByFile.has(action.file)) {
                                actionsByFile.set(action.file, []);
                            }
                            actionsByFile.get(action.file).push(action);
                        }
                        _a = 0, actionsByFile_1 = actionsByFile;
                        _c.label = 1;
                    case 1:
                        if (!(_a < actionsByFile_1.length)) return [3 /*break*/, 4];
                        _b = actionsByFile_1[_a], filePath = _b[0], fileActions = _b[1];
                        return [4 /*yield*/, this.applyFileActions(filePath, fileActions)];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        _a++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Fixer.prototype.applyFileActions = function (filePath, actions) {
        return __awaiter(this, void 0, void 0, function () {
            var content, lines, sortedActions, _i, sortedActions_1, action, startIdx, endIdx, startIdx, endIdx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs.readFile(filePath, 'utf8')];
                    case 1:
                        content = _a.sent();
                        lines = content.split('\n');
                        sortedActions = actions.sort(function (a, b) { return (b.startLine || 0) - (a.startLine || 0); });
                        for (_i = 0, sortedActions_1 = sortedActions; _i < sortedActions_1.length; _i++) {
                            action = sortedActions_1[_i];
                            switch (action.type) {
                                case FixType.REPLACEMENT:
                                    if (action.startLine && action.endLine) {
                                        startIdx = action.startLine - 1;
                                        endIdx = action.endLine - 1;
                                        lines.splice(startIdx, endIdx - startIdx + 1, action.newContent);
                                    }
                                    break;
                                case FixType.INSERTION:
                                    if (action.startLine) {
                                        lines.splice(action.startLine - 1, 0, action.newContent);
                                    }
                                    break;
                                case FixType.DELETION:
                                    if (action.startLine && action.endLine) {
                                        startIdx = action.startLine - 1;
                                        endIdx = action.endLine - 1;
                                        lines.splice(startIdx, endIdx - startIdx + 1);
                                    }
                                    break;
                            }
                        }
                        return [4 /*yield*/, fs.writeFile(filePath, lines.join('\n'), 'utf8')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Fixer.prototype.applyTestUpdates = function (updates) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, updates_1, update, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, updates_1 = updates;
                        _b.label = 1;
                    case 1:
                        if (!(_i < updates_1.length)) return [3 /*break*/, 11];
                        update = updates_1[_i];
                        _a = update.type;
                        switch (_a) {
                            case 'create': return [3 /*break*/, 2];
                            case 'update': return [3 /*break*/, 5];
                            case 'delete': return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 10];
                    case 2:
                        if (!update.content) return [3 /*break*/, 4];
                        return [4 /*yield*/, fs.writeFile(update.file, update.content, 'utf8')];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4: return [3 /*break*/, 10];
                    case 5:
                        if (!update.content) return [3 /*break*/, 7];
                        return [4 /*yield*/, fs.writeFile(update.file, update.content, 'utf8')];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7: return [3 /*break*/, 10];
                    case 8: return [4 /*yield*/, fs.unlink(update.file)];
                    case 9:
                        _b.sent();
                        return [3 /*break*/, 10];
                    case 10:
                        _i++;
                        return [3 /*break*/, 1];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    Fixer.prototype.validateFix = function (fix) {
        return __awaiter(this, void 0, void 0, function () {
            var validation, _a, _b, _c, _d, error_3;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        validation = {
                            syntaxCheck: false,
                            testsPassing: false,
                            lintPassing: false,
                            securityCheck: false
                        };
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 10, , 11]);
                        if (!this.config.validation.runSyntaxCheck) return [3 /*break*/, 3];
                        _a = validation;
                        return [4 /*yield*/, this.runSyntaxCheck(fix)];
                    case 2:
                        _a.syntaxCheck = _e.sent();
                        _e.label = 3;
                    case 3:
                        if (!this.config.validation.runTests) return [3 /*break*/, 5];
                        _b = validation;
                        return [4 /*yield*/, this.runTests(fix)];
                    case 4:
                        _b.testsPassing = _e.sent();
                        _e.label = 5;
                    case 5:
                        if (!this.config.validation.runLinter) return [3 /*break*/, 7];
                        _c = validation;
                        return [4 /*yield*/, this.runLinter(fix)];
                    case 6:
                        _c.lintPassing = _e.sent();
                        _e.label = 7;
                    case 7:
                        if (!this.config.validation.runSecurityScan) return [3 /*break*/, 9];
                        _d = validation;
                        return [4 /*yield*/, this.runSecurityScan(fix)];
                    case 8:
                        _d.securityCheck = _e.sent();
                        _e.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        error_3 = _e.sent();
                        this.logger.error('Validation error:', error_3);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/, validation];
                }
            });
        });
    };
    Fixer.prototype.runSyntaxCheck = function (fix) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Implement syntax checking for affected files
                return [2 /*return*/, true];
            });
        });
    };
    Fixer.prototype.runTests = function (fix) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Implement test running
                return [2 /*return*/, true];
            });
        });
    };
    Fixer.prototype.runLinter = function (fix) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Implement linting
                return [2 /*return*/, true];
            });
        });
    };
    Fixer.prototype.runSecurityScan = function (fix) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Implement security scanning
                return [2 /*return*/, true];
            });
        });
    };
    Fixer.prototype.isValidationSuccessful = function (validation) {
        return validation.syntaxCheck &&
            validation.testsPassing &&
            validation.lintPassing &&
            validation.securityCheck;
    };
    Fixer.prototype.updateStatistics = function (fix, generationTime) {
        this.statistics.totalGenerated++;
        this.statistics.byType[fix.type] = (this.statistics.byType[fix.type] || 0) + 1;
        this.statistics.byStrategy[fix.strategy] = (this.statistics.byStrategy[fix.strategy] || 0) + 1;
        // Update averages
        var total = this.statistics.totalGenerated;
        this.statistics.averageConfidence = ((this.statistics.averageConfidence * (total - 1)) + fix.metadata.confidence) / total;
        this.statistics.averageGenerationTime = ((this.statistics.averageGenerationTime * (total - 1)) + generationTime) / total;
    };
    return Fixer;
}(events_1.EventEmitter));
exports.Fixer = Fixer;
// Default configuration
exports.DEFAULT_FIXER_CONFIG = {
    defaultStrategy: FixStrategy.STANDARD,
    aiProvider: {
        enabled: false,
        model: 'gpt-4',
        maxTokens: 2000,
        temperature: 0.1
    },
    safety: {
        requireBackup: true,
        maxFilesPerFix: 10,
        maxLinesPerFix: 100,
        allowedFileTypes: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs'],
        forbiddenPaths: ['node_modules', '.git', 'dist', 'build'],
        requireReview: (_a = {},
            _a[Detector_1.IssueSeverity.CRITICAL] = true,
            _a[Detector_1.IssueSeverity.HIGH] = true,
            _a[Detector_1.IssueSeverity.MEDIUM] = false,
            _a[Detector_1.IssueSeverity.LOW] = false,
            _a[Detector_1.IssueSeverity.INFO] = false,
            _a)
    },
    validation: {
        runSyntaxCheck: true,
        runTests: true,
        runLinter: true,
        runSecurityScan: false,
        testTimeout: 30000 // 30 seconds
    },
    concurrency: {
        maxConcurrentFixes: 3,
        maxConcurrentValidations: 2
    },
    templates: {
        enabled: true,
        customTemplates: {}
    }
};
exports.default = Fixer;
