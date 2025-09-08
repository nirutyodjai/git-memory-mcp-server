"use strict";
/**
 * Auto-Fix Detector
 *
 * Detects issues from various sources (lint, tests, runtime logs) and creates
 * incidents for the Auto-Fix pipeline to process.
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DETECTOR_CONFIG = exports.Detector = exports.IssueStatus = exports.IssueSeverity = exports.IssueType = void 0;
var events_1 = require("events");
var logger_1 = require("../utils/logger");
// Issue types and severity levels
var IssueType;
(function (IssueType) {
    IssueType["LINT_ERROR"] = "lint_error";
    IssueType["LINT_WARNING"] = "lint_warning";
    IssueType["TEST_FAILURE"] = "test_failure";
    IssueType["RUNTIME_ERROR"] = "runtime_error";
    IssueType["COMPILATION_ERROR"] = "compilation_error";
    IssueType["SECURITY_VULNERABILITY"] = "security_vulnerability";
    IssueType["PERFORMANCE_ISSUE"] = "performance_issue";
    IssueType["DEPENDENCY_ISSUE"] = "dependency_issue";
    IssueType["TYPE_ERROR"] = "type_error";
    IssueType["SYNTAX_ERROR"] = "syntax_error";
})(IssueType || (exports.IssueType = IssueType = {}));
var IssueSeverity;
(function (IssueSeverity) {
    IssueSeverity["CRITICAL"] = "critical";
    IssueSeverity["HIGH"] = "high";
    IssueSeverity["MEDIUM"] = "medium";
    IssueSeverity["LOW"] = "low";
    IssueSeverity["INFO"] = "info";
})(IssueSeverity || (exports.IssueSeverity = IssueSeverity = {}));
var IssueStatus;
(function (IssueStatus) {
    IssueStatus["DETECTED"] = "detected";
    IssueStatus["ANALYZING"] = "analyzing";
    IssueStatus["FIX_PROPOSED"] = "fix_proposed";
    IssueStatus["FIX_APPLIED"] = "fix_applied";
    IssueStatus["VERIFIED"] = "verified";
    IssueStatus["RESOLVED"] = "resolved";
    IssueStatus["IGNORED"] = "ignored";
    IssueStatus["FAILED"] = "failed";
})(IssueStatus || (exports.IssueStatus = IssueStatus = {}));
/**
 * Issue Detector
 *
 * Monitors various sources for issues and creates structured incidents
 */
var Detector = /** @class */ (function (_super) {
    __extends(Detector, _super);
    function Detector(config, logger) {
        var _this = _super.call(this) || this;
        _this.issues = new Map();
        _this.watchers = new Map();
        _this.processing = false;
        _this.processingQueue = [];
        _this.recentIssues = new Set(); // For duplicate detection
        _this.statistics = {
            totalDetected: 0,
            totalResolved: 0,
            averageFixTime: 0,
            byType: {},
            bySeverity: {}
        };
        _this.config = config;
        _this.logger = logger || new logger_1.Logger({ level: 'info' });
        return _this;
    }
    /**
     * Initialize the detector
     */
    Detector.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info('Initializing Auto-Fix Detector...');
                        if (!this.config.lint.watchMode) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.startLintWatcher()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!this.config.test.watchMode) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.startTestWatcher()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!this.config.runtime.watchMode) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.startRuntimeWatcher()];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        if (!this.config.compilation.watchMode) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.startCompilationWatcher()];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8:
                        // Start processing queue
                        this.startProcessingLoop();
                        this.logger.info('Auto-Fix Detector initialized successfully');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Shutdown the detector
     */
    Detector.prototype.shutdown = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, _b, name_1, watcher;
            return __generator(this, function (_c) {
                this.logger.info('Shutting down Auto-Fix Detector...');
                // Stop all watchers
                for (_i = 0, _a = this.watchers; _i < _a.length; _i++) {
                    _b = _a[_i], name_1 = _b[0], watcher = _b[1];
                    if (watcher && typeof watcher.close === 'function') {
                        watcher.close();
                    }
                    this.logger.debug("Stopped watcher: ".concat(name_1));
                }
                this.watchers.clear();
                // Stop processing
                this.processing = false;
                this.logger.info('Auto-Fix Detector shutdown complete');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Manually trigger detection from various sources
     */
    Detector.prototype.detectIssues = function (sources) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, allIssues, sourcesToCheck, _i, sourcesToCheck_1, source, issues, _a, error_1, processedIssues, processingTime, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = Date.now();
                        allIssues = [];
                        sourcesToCheck = sources || ['lint', 'test', 'runtime', 'compilation'];
                        _i = 0, sourcesToCheck_1 = sourcesToCheck;
                        _b.label = 1;
                    case 1:
                        if (!(_i < sourcesToCheck_1.length)) return [3 /*break*/, 18];
                        source = sourcesToCheck_1[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 16, , 17]);
                        issues = [];
                        _a = source;
                        switch (_a) {
                            case 'lint': return [3 /*break*/, 3];
                            case 'test': return [3 /*break*/, 6];
                            case 'runtime': return [3 /*break*/, 9];
                            case 'compilation': return [3 /*break*/, 12];
                        }
                        return [3 /*break*/, 15];
                    case 3:
                        if (!this.config.lint.enabled) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.detectLintIssues()];
                    case 4:
                        issues = _b.sent();
                        _b.label = 5;
                    case 5: return [3 /*break*/, 15];
                    case 6:
                        if (!this.config.test.enabled) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.detectTestIssues()];
                    case 7:
                        issues = _b.sent();
                        _b.label = 8;
                    case 8: return [3 /*break*/, 15];
                    case 9:
                        if (!this.config.runtime.enabled) return [3 /*break*/, 11];
                        return [4 /*yield*/, this.detectRuntimeIssues()];
                    case 10:
                        issues = _b.sent();
                        _b.label = 11;
                    case 11: return [3 /*break*/, 15];
                    case 12:
                        if (!this.config.compilation.enabled) return [3 /*break*/, 14];
                        return [4 /*yield*/, this.detectCompilationIssues()];
                    case 13:
                        issues = _b.sent();
                        _b.label = 14;
                    case 14: return [3 /*break*/, 15];
                    case 15:
                        allIssues.push.apply(allIssues, issues);
                        return [3 /*break*/, 17];
                    case 16:
                        error_1 = _b.sent();
                        this.logger.error("Error detecting ".concat(source, " issues:"), error_1);
                        return [3 /*break*/, 17];
                    case 17:
                        _i++;
                        return [3 /*break*/, 1];
                    case 18: return [4 /*yield*/, this.processIssues(allIssues)];
                    case 19:
                        processedIssues = _b.sent();
                        processingTime = Date.now() - startTime;
                        result = {
                            issues: processedIssues,
                            summary: this.generateSummary(processedIssues),
                            processingTime: processingTime
                        };
                        this.emit('detection_complete', result);
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Get issue by ID
     */
    Detector.prototype.getIssue = function (id) {
        return this.issues.get(id);
    };
    /**
     * Get all issues with optional filtering
     */
    Detector.prototype.getIssues = function (filters) {
        var issues = Array.from(this.issues.values());
        if (filters) {
            if (filters.type) {
                issues = issues.filter(function (issue) { return filters.type.includes(issue.type); });
            }
            if (filters.severity) {
                issues = issues.filter(function (issue) { return filters.severity.includes(issue.severity); });
            }
            if (filters.status) {
                issues = issues.filter(function (issue) { return filters.status.includes(issue.status); });
            }
            if (filters.autoFixable !== undefined) {
                issues = issues.filter(function (issue) { return issue.autoFixable === filters.autoFixable; });
            }
            if (filters.file) {
                issues = issues.filter(function (issue) { return issue.location.file === filters.file; });
            }
        }
        return issues.sort(function (a, b) {
            var _a;
            // Sort by severity first, then by creation time
            var severityOrder = (_a = {},
                _a[IssueSeverity.CRITICAL] = 0,
                _a[IssueSeverity.HIGH] = 1,
                _a[IssueSeverity.MEDIUM] = 2,
                _a[IssueSeverity.LOW] = 3,
                _a[IssueSeverity.INFO] = 4,
                _a);
            var severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
            if (severityDiff !== 0)
                return severityDiff;
            return b.createdAt - a.createdAt;
        });
    };
    /**
     * Update issue status
     */
    Detector.prototype.updateIssueStatus = function (id, status, metadata) {
        var issue = this.issues.get(id);
        if (!issue)
            return false;
        var oldStatus = issue.status;
        issue.status = status;
        issue.updatedAt = Date.now();
        if (metadata) {
            issue.metadata = __assign(__assign({}, issue.metadata), metadata);
        }
        this.emit('issue_status_changed', {
            issue: issue,
            oldStatus: oldStatus,
            newStatus: status
        });
        // Update statistics
        if (status === IssueStatus.RESOLVED) {
            this.statistics.totalResolved++;
        }
        return true;
    };
    /**
     * Get detection statistics
     */
    Detector.prototype.getStatistics = function () {
        return __assign({}, this.statistics);
    };
    /**
     * Clear resolved issues older than specified time
     */
    Detector.prototype.cleanupResolvedIssues = function (olderThanMs) {
        if (olderThanMs === void 0) { olderThanMs = 24 * 60 * 60 * 1000; }
        var cutoff = Date.now() - olderThanMs;
        var cleaned = 0;
        for (var _i = 0, _a = this.issues; _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], issue = _b[1];
            if (issue.status === IssueStatus.RESOLVED && issue.updatedAt < cutoff) {
                this.issues.delete(id);
                cleaned++;
            }
        }
        this.logger.info("Cleaned up ".concat(cleaned, " resolved issues"));
        return cleaned;
    };
    // Private methods
    Detector.prototype.startLintWatcher = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would depend on specific linting tools
                // This is a placeholder for the concept
                this.logger.debug('Starting lint watcher...');
                return [2 /*return*/];
            });
        });
    };
    Detector.prototype.startTestWatcher = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.logger.debug('Starting test watcher...');
                return [2 /*return*/];
            });
        });
    };
    Detector.prototype.startRuntimeWatcher = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.logger.debug('Starting runtime watcher...');
                return [2 /*return*/];
            });
        });
    };
    Detector.prototype.startCompilationWatcher = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.logger.debug('Starting compilation watcher...');
                return [2 /*return*/];
            });
        });
    };
    Detector.prototype.startProcessingLoop = function () {
        var _this = this;
        var processQueue = function () { return __awaiter(_this, void 0, void 0, function () {
            var batch, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.processing || this.processingQueue.length === 0) {
                            setTimeout(processQueue, this.config.processingInterval);
                            return [2 /*return*/];
                        }
                        batch = this.processingQueue.splice(0, this.config.batchSize);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, Promise.all(batch.map(function (task) { return task(); }))];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        this.logger.error('Error processing detection queue:', error_2);
                        return [3 /*break*/, 4];
                    case 4:
                        setTimeout(processQueue, this.config.processingInterval);
                        return [2 /*return*/];
                }
            });
        }); };
        this.processing = true;
        processQueue();
    };
    Detector.prototype.detectLintIssues = function () {
        return __awaiter(this, void 0, void 0, function () {
            var issues;
            return __generator(this, function (_a) {
                issues = [];
                // TODO: Implement actual lint detection
                // This would run configured linters and parse their output
                return [2 /*return*/, issues];
            });
        });
    };
    Detector.prototype.detectTestIssues = function () {
        return __awaiter(this, void 0, void 0, function () {
            var issues;
            return __generator(this, function (_a) {
                issues = [];
                // TODO: Implement actual test failure detection
                // This would run tests and parse failure reports
                return [2 /*return*/, issues];
            });
        });
    };
    Detector.prototype.detectRuntimeIssues = function () {
        return __awaiter(this, void 0, void 0, function () {
            var issues;
            return __generator(this, function (_a) {
                issues = [];
                // TODO: Implement actual runtime error detection
                // This would monitor log files and parse error patterns
                return [2 /*return*/, issues];
            });
        });
    };
    Detector.prototype.detectCompilationIssues = function () {
        return __awaiter(this, void 0, void 0, function () {
            var issues;
            return __generator(this, function (_a) {
                issues = [];
                // TODO: Implement actual compilation error detection
                // This would run compilers and parse error output
                return [2 /*return*/, issues];
            });
        });
    };
    Detector.prototype.processIssues = function (rawIssues) {
        return __awaiter(this, void 0, void 0, function () {
            var processedIssues, _loop_1, this_1, _i, rawIssues_1, issue;
            var _this = this;
            return __generator(this, function (_a) {
                processedIssues = [];
                _loop_1 = function (issue) {
                    // Check for duplicates
                    if (this_1.isDuplicate(issue)) {
                        return "continue";
                    }
                    // Apply filters
                    if (!this_1.passesFilters(issue)) {
                        return "continue";
                    }
                    // Determine auto-fixability
                    issue.autoFixable = this_1.isAutoFixable(issue);
                    // Estimate fix time
                    issue.estimatedFixTime = this_1.estimateFixTime(issue);
                    // Determine risk level
                    issue.riskLevel = this_1.assessRiskLevel(issue);
                    // Store issue
                    this_1.issues.set(issue.id, issue);
                    processedIssues.push(issue);
                    // Update statistics
                    this_1.updateStatistics(issue);
                    // Mark as recent for duplicate detection
                    this_1.recentIssues.add(this_1.getIssueSignature(issue));
                    setTimeout(function () {
                        _this.recentIssues.delete(_this.getIssueSignature(issue));
                    }, this_1.config.filters.duplicateWindow);
                    // Emit event
                    this_1.emit('issue_detected', issue);
                };
                this_1 = this;
                for (_i = 0, rawIssues_1 = rawIssues; _i < rawIssues_1.length; _i++) {
                    issue = rawIssues_1[_i];
                    _loop_1(issue);
                }
                return [2 /*return*/, processedIssues];
            });
        });
    };
    Detector.prototype.isDuplicate = function (issue) {
        var signature = this.getIssueSignature(issue);
        return this.recentIssues.has(signature);
    };
    Detector.prototype.getIssueSignature = function (issue) {
        return "".concat(issue.type, ":").concat(issue.location.file, ":").concat(issue.location.line, ":").concat(issue.title);
    };
    Detector.prototype.passesFilters = function (issue) {
        // Check ignore patterns
        for (var _i = 0, _a = this.config.filters.ignorePatterns; _i < _a.length; _i++) {
            var pattern = _a[_i];
            if (new RegExp(pattern).test(issue.location.file) ||
                new RegExp(pattern).test(issue.title)) {
                return false;
            }
        }
        // Check include patterns (if any)
        if (this.config.filters.includePatterns.length > 0) {
            var matches = false;
            for (var _b = 0, _c = this.config.filters.includePatterns; _b < _c.length; _b++) {
                var pattern = _c[_b];
                if (new RegExp(pattern).test(issue.location.file) ||
                    new RegExp(pattern).test(issue.title)) {
                    matches = true;
                    break;
                }
            }
            if (!matches)
                return false;
        }
        // Check max issues per file
        var fileIssues = Array.from(this.issues.values())
            .filter(function (i) { return i.location.file === issue.location.file; });
        if (fileIssues.length >= this.config.filters.maxIssuesPerFile) {
            return false;
        }
        return true;
    };
    Detector.prototype.isAutoFixable = function (issue) {
        // Check if this severity level is configured for auto-fix
        if (!this.config.autoFixThreshold[issue.severity]) {
            return false;
        }
        // Additional logic based on issue type
        switch (issue.type) {
            case IssueType.SECURITY_VULNERABILITY:
                return false; // Never auto-fix security issues
            case IssueType.SYNTAX_ERROR:
            case IssueType.LINT_ERROR:
            case IssueType.TYPE_ERROR:
                return true; // Usually safe to auto-fix
            case IssueType.TEST_FAILURE:
                return issue.severity === IssueSeverity.LOW; // Only low-severity test failures
            default:
                return issue.severity === IssueSeverity.LOW || issue.severity === IssueSeverity.INFO;
        }
    };
    Detector.prototype.estimateFixTime = function (issue) {
        var _a, _b;
        // Estimate fix time in minutes based on issue type and complexity
        var baseTime = (_a = {},
            _a[IssueType.SYNTAX_ERROR] = 2,
            _a[IssueType.LINT_ERROR] = 1,
            _a[IssueType.LINT_WARNING] = 1,
            _a[IssueType.TYPE_ERROR] = 3,
            _a[IssueType.TEST_FAILURE] = 10,
            _a[IssueType.COMPILATION_ERROR] = 5,
            _a[IssueType.RUNTIME_ERROR] = 15,
            _a[IssueType.SECURITY_VULNERABILITY] = 60,
            _a[IssueType.PERFORMANCE_ISSUE] = 30,
            _a[IssueType.DEPENDENCY_ISSUE] = 20,
            _a);
        var severityMultiplier = (_b = {},
            _b[IssueSeverity.INFO] = 0.5,
            _b[IssueSeverity.LOW] = 1,
            _b[IssueSeverity.MEDIUM] = 2,
            _b[IssueSeverity.HIGH] = 3,
            _b[IssueSeverity.CRITICAL] = 5,
            _b);
        return Math.round((baseTime[issue.type] || 10) * severityMultiplier[issue.severity]);
    };
    Detector.prototype.assessRiskLevel = function (issue) {
        // Assess risk level for auto-fixing
        if (issue.type === IssueType.SECURITY_VULNERABILITY) {
            return 'high';
        }
        if (issue.severity === IssueSeverity.CRITICAL || issue.severity === IssueSeverity.HIGH) {
            return 'high';
        }
        if (issue.type === IssueType.RUNTIME_ERROR || issue.type === IssueType.TEST_FAILURE) {
            return 'medium';
        }
        return 'low';
    };
    Detector.prototype.updateStatistics = function (issue) {
        this.statistics.totalDetected++;
        this.statistics.byType[issue.type] = (this.statistics.byType[issue.type] || 0) + 1;
        this.statistics.bySeverity[issue.severity] = (this.statistics.bySeverity[issue.severity] || 0) + 1;
    };
    Detector.prototype.generateSummary = function (issues) {
        var summary = {
            total: issues.length,
            byType: {},
            bySeverity: {},
            autoFixable: 0
        };
        for (var _i = 0, issues_1 = issues; _i < issues_1.length; _i++) {
            var issue = issues_1[_i];
            summary.byType[issue.type] = (summary.byType[issue.type] || 0) + 1;
            summary.bySeverity[issue.severity] = (summary.bySeverity[issue.severity] || 0) + 1;
            if (issue.autoFixable) {
                summary.autoFixable++;
            }
        }
        return summary;
    };
    return Detector;
}(events_1.EventEmitter));
exports.Detector = Detector;
// Default configuration
exports.DEFAULT_DETECTOR_CONFIG = {
    lint: {
        enabled: true,
        tools: ['eslint', 'tslint', 'pylint'],
        configFiles: ['.eslintrc.js', '.eslintrc.json', 'tslint.json', 'pylint.rc'],
        watchMode: true
    },
    test: {
        enabled: true,
        frameworks: ['jest', 'mocha', 'pytest'],
        watchMode: true,
        failureThreshold: 1
    },
    runtime: {
        enabled: true,
        logFiles: ['*.log', 'logs/*.log'],
        errorPatterns: [
            /ERROR/i,
            /FATAL/i,
            /Exception/i,
            /Error:/i
        ],
        watchMode: true
    },
    compilation: {
        enabled: true,
        compilers: ['tsc', 'javac', 'gcc'],
        watchMode: true
    },
    autoFixThreshold: (_a = {},
        _a[IssueSeverity.CRITICAL] = false,
        _a[IssueSeverity.HIGH] = false,
        _a[IssueSeverity.MEDIUM] = false,
        _a[IssueSeverity.LOW] = true,
        _a[IssueSeverity.INFO] = true,
        _a),
    filters: {
        ignorePatterns: [
            'node_modules',
            '.git',
            'dist',
            'build',
            '*.min.js'
        ],
        includePatterns: [],
        maxIssuesPerFile: 50,
        duplicateWindow: 5000 // 5 seconds
    },
    batchSize: 10,
    processingInterval: 1000, // 1 second
    maxConcurrentDetections: 5
};
exports.default = Detector;
