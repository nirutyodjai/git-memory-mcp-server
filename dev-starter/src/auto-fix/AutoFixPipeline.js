"use strict";
/**
 * Auto-Fix Pipeline
 *
 * Orchestrates the complete auto-fix workflow from detection to commit.
 * Integrates Detector, Fixer, Verifier, and Committer components.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PIPELINE_CONFIG = exports.AutoFixPipeline = exports.PipelineStage = exports.PipelineStatus = void 0;
var events_1 = require("events");
var logger_1 = require("../utils/logger");
var Detector_1 = require("./Detector");
var Fixer_1 = require("./Fixer");
var Verifier_1 = require("./Verifier");
var Committer_1 = require("./Committer");
var PipelineStatus;
(function (PipelineStatus) {
    PipelineStatus["PENDING"] = "pending";
    PipelineStatus["RUNNING"] = "running";
    PipelineStatus["SUCCESS"] = "success";
    PipelineStatus["FAILED"] = "failed";
    PipelineStatus["CANCELLED"] = "cancelled";
    PipelineStatus["AWAITING_APPROVAL"] = "awaiting_approval";
    PipelineStatus["ROLLED_BACK"] = "rolled_back";
})(PipelineStatus || (exports.PipelineStatus = PipelineStatus = {}));
var PipelineStage;
(function (PipelineStage) {
    PipelineStage["DETECTION"] = "detection";
    PipelineStage["FIXING"] = "fixing";
    PipelineStage["VERIFICATION"] = "verification";
    PipelineStage["APPROVAL"] = "approval";
    PipelineStage["COMMIT"] = "commit";
    PipelineStage["MONITORING"] = "monitoring";
    PipelineStage["COMPLETED"] = "completed";
})(PipelineStage || (exports.PipelineStage = PipelineStage = {}));
var AutoFixPipeline = /** @class */ (function (_super) {
    __extends(AutoFixPipeline, _super);
    function AutoFixPipeline(config, logger) {
        var _this = _super.call(this) || this;
        _this.activeRuns = new Map();
        _this.runHistory = new Map();
        _this.pendingApprovals = new Map();
        _this.statistics = {
            totalRuns: 0,
            successfulRuns: 0,
            failedRuns: 0,
            cancelledRuns: 0,
            rolledBackRuns: 0,
            averageRunTime: 0,
            successRate: 0,
            byIssueType: {},
            byFixStrategy: {},
            bySeverity: {},
            recentTrends: {
                hourly: new Array(24).fill(0),
                daily: new Array(7).fill(0),
                weekly: new Array(4).fill(0)
            }
        };
        _this.isRunning = false;
        _this.shutdownRequested = false;
        _this.config = config;
        _this.logger = logger || new logger_1.Logger('AutoFixPipeline');
        // Initialize components
        _this.detector = new Detector_1.Detector(config.detector, _this.logger);
        _this.fixer = new Fixer_1.Fixer(config.fixer, _this.logger);
        _this.verifier = new Verifier_1.Verifier(config.verifier, _this.logger);
        _this.committer = new Committer_1.Committer(config.committer, _this.logger);
        _this.setupEventHandlers();
        return _this;
    }
    AutoFixPipeline.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info('Initializing Auto-Fix Pipeline...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // Initialize all components
                        return [4 /*yield*/, Promise.all([
                                this.detector.initialize(),
                                this.fixer.initialize(),
                                this.verifier.initialize(),
                                this.committer.initialize()
                            ])];
                    case 2:
                        // Initialize all components
                        _a.sent();
                        // Start monitoring if enabled
                        if (this.config.pipeline.monitoring.enabled) {
                            this.startMonitoring();
                        }
                        this.isRunning = true;
                        this.logger.info('Auto-Fix Pipeline initialized successfully');
                        this.emit('pipeline.initialized');
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        this.logger.error('Failed to initialize Auto-Fix Pipeline:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AutoFixPipeline.prototype.setupEventHandlers = function () {
        var _this = this;
        // Detector events
        this.detector.on('issue.detected', function (issue) {
            if (_this.config.pipeline.autoMode && _this.shouldProcessIssue(issue)) {
                _this.processIssue(issue, 'automatic');
            }
        });
        // Component error events
        this.detector.on('error', function (error) { return _this.handleComponentError('detector', error); });
        this.fixer.on('error', function (error) { return _this.handleComponentError('fixer', error); });
        this.verifier.on('error', function (error) { return _this.handleComponentError('verifier', error); });
        this.committer.on('error', function (error) { return _this.handleComponentError('committer', error); });
    };
    AutoFixPipeline.prototype.processIssue = function (issue_1) {
        return __awaiter(this, arguments, void 0, function (issue, triggeredBy) {
            var runId, startTime, run, error_2;
            var _a, _b;
            if (triggeredBy === void 0) { triggeredBy = 'manual'; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        runId = this.generateRunId();
                        startTime = Date.now();
                        _a = {
                            id: runId,
                            issue: issue,
                            status: PipelineStatus.RUNNING,
                            stage: PipelineStage.DETECTION,
                            startTime: startTime
                        };
                        _b = {
                            triggeredBy: triggeredBy,
                            priority: this.mapSeverityToPriority(issue.severity),
                            tags: [issue.type, issue.severity]
                        };
                        return [4 /*yield*/, this.getRepositoryContext()];
                    case 1:
                        run = (_a.metadata = (_b.context = _c.sent(),
                            _b.performance = {
                                detectionTime: 0,
                                fixingTime: 0,
                                verificationTime: 0,
                                commitTime: 0
                            },
                            _b),
                            _a);
                        this.activeRuns.set(runId, run);
                        this.emit('pipeline.started', run);
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, 7, 8]);
                        // Check if we're at capacity
                        if (this.activeRuns.size > this.config.pipeline.maxConcurrentFixes) {
                            throw new Error('Maximum concurrent fixes reached');
                        }
                        // Execute pipeline stages
                        return [4 /*yield*/, this.executePipelineStages(run)];
                    case 3:
                        // Execute pipeline stages
                        _c.sent();
                        // Mark as completed
                        run.status = PipelineStatus.SUCCESS;
                        run.stage = PipelineStage.COMPLETED;
                        run.endTime = Date.now();
                        run.duration = run.endTime - run.startTime;
                        this.statistics.successfulRuns++;
                        this.emit('pipeline.completed', run);
                        return [3 /*break*/, 8];
                    case 4:
                        error_2 = _c.sent();
                        this.logger.error("Pipeline run ".concat(runId, " failed:"), error_2);
                        run.status = PipelineStatus.FAILED;
                        run.error = error_2;
                        run.endTime = Date.now();
                        run.duration = run.endTime - run.startTime;
                        this.statistics.failedRuns++;
                        this.emit('pipeline.failed', run);
                        if (!(this.config.pipeline.rollback.enabled && run.commitResult)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.attemptRollback(run)];
                    case 5:
                        _c.sent();
                        _c.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        this.activeRuns.delete(runId);
                        this.runHistory.set(runId, run);
                        this.updateStatistics(run);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/, run];
                }
            });
        });
    };
    AutoFixPipeline.prototype.executePipelineStages = function (run) {
        return __awaiter(this, void 0, void 0, function () {
            var issue, fixStartTime, _a, verifyStartTime, _b, commitStartTime, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        issue = run.issue;
                        // Stage 1: Generate Fix
                        run.stage = PipelineStage.FIXING;
                        this.emit('pipeline.stage.started', { run: run, stage: PipelineStage.FIXING });
                        fixStartTime = Date.now();
                        _a = run;
                        return [4 /*yield*/, this.fixer.generateFix(issue)];
                    case 1:
                        _a.fix = _d.sent();
                        run.metadata.performance.fixingTime = Date.now() - fixStartTime;
                        if (!run.fix) {
                            throw new Error('Failed to generate fix');
                        }
                        this.emit('pipeline.stage.completed', { run: run, stage: PipelineStage.FIXING });
                        // Stage 2: Verify Fix
                        run.stage = PipelineStage.VERIFICATION;
                        this.emit('pipeline.stage.started', { run: run, stage: PipelineStage.VERIFICATION });
                        verifyStartTime = Date.now();
                        _b = run;
                        return [4 /*yield*/, this.verifier.verifyFix(run.fix, issue)];
                    case 2:
                        _b.verificationResult = _d.sent();
                        run.metadata.performance.verificationTime = Date.now() - verifyStartTime;
                        if (!run.verificationResult.success) {
                            throw new Error("Fix verification failed: ".concat(run.verificationResult.message));
                        }
                        this.emit('pipeline.stage.completed', { run: run, stage: PipelineStage.VERIFICATION });
                        if (!this.requiresApproval(run)) return [3 /*break*/, 4];
                        run.stage = PipelineStage.APPROVAL;
                        run.status = PipelineStatus.AWAITING_APPROVAL;
                        this.pendingApprovals.set(run.id, run);
                        this.emit('pipeline.approval.required', run);
                        // Wait for approval or timeout
                        return [4 /*yield*/, this.waitForApproval(run)];
                    case 3:
                        // Wait for approval or timeout
                        _d.sent();
                        this.pendingApprovals.delete(run.id);
                        _d.label = 4;
                    case 4:
                        // Stage 4: Commit Fix
                        run.stage = PipelineStage.COMMIT;
                        this.emit('pipeline.stage.started', { run: run, stage: PipelineStage.COMMIT });
                        commitStartTime = Date.now();
                        _c = run;
                        return [4 /*yield*/, this.committer.commitFix(run.fix, run.verificationResult, issue)];
                    case 5:
                        _c.commitResult = _d.sent();
                        run.metadata.performance.commitTime = Date.now() - commitStartTime;
                        if (!run.commitResult.success) {
                            throw new Error('Failed to commit fix');
                        }
                        this.emit('pipeline.stage.completed', { run: run, stage: PipelineStage.COMMIT });
                        // Stage 5: Post-commit monitoring
                        if (this.config.pipeline.monitoring.enabled) {
                            run.stage = PipelineStage.MONITORING;
                            this.startPostCommitMonitoring(run);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    AutoFixPipeline.prototype.shouldProcessIssue = function (issue) {
        var _this = this;
        var filters = this.config.pipeline.filters;
        // Check severity threshold
        if (this.getSeverityLevel(issue.severity) < this.getSeverityLevel(filters.severityThreshold)) {
            return false;
        }
        // Check issue types
        if (filters.issueTypes.length > 0 && !filters.issueTypes.includes(issue.type)) {
            return false;
        }
        // Check path patterns
        if (filters.pathPatterns.length > 0) {
            var matchesPattern = filters.pathPatterns.some(function (pattern) {
                return _this.matchesPattern(issue.location.file, pattern);
            });
            if (!matchesPattern) {
                return false;
            }
        }
        // Check exclude patterns
        if (filters.excludePatterns.length > 0) {
            var matchesExclude = filters.excludePatterns.some(function (pattern) {
                return _this.matchesPattern(issue.location.file, pattern);
            });
            if (matchesExclude) {
                return false;
            }
        }
        return true;
    };
    AutoFixPipeline.prototype.requiresApproval = function (run) {
        var approval = this.config.pipeline.approval;
        if (!approval.required) {
            return false;
        }
        // Check auto-approval conditions
        var autoApprove = approval.autoApprove;
        var verificationResult = run.verificationResult, metadata = run.metadata;
        if (autoApprove.lowRisk && metadata.priority === 'low') {
            return false;
        }
        if (autoApprove.highConfidence && verificationResult && verificationResult.score > 0.9) {
            return false;
        }
        if (autoApprove.testsPassing && verificationResult && verificationResult.success) {
            var allTestsPassed = verificationResult.checks.every(function (check) {
                return check.status === 'passed';
            });
            if (allTestsPassed) {
                return false;
            }
        }
        return true;
    };
    AutoFixPipeline.prototype.waitForApproval = function (run) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var timeout = setTimeout(function () {
                            reject(new Error('Approval timeout'));
                        }, _this.config.pipeline.approval.timeout);
                        var approvalHandler = function (approvedRunId, approved) {
                            if (approvedRunId === run.id) {
                                clearTimeout(timeout);
                                _this.off('pipeline.approval.response', approvalHandler);
                                if (approved) {
                                    resolve();
                                }
                                else {
                                    reject(new Error('Fix was rejected'));
                                }
                            }
                        };
                        _this.on('pipeline.approval.response', approvalHandler);
                    })];
            });
        });
    };
    AutoFixPipeline.prototype.approveFix = function (runId, approved, approver) {
        return __awaiter(this, void 0, void 0, function () {
            var run;
            return __generator(this, function (_a) {
                run = this.pendingApprovals.get(runId);
                if (!run) {
                    throw new Error("No pending approval found for run ".concat(runId));
                }
                this.logger.info("Fix ".concat(runId, " ").concat(approved ? 'approved' : 'rejected', " by ").concat(approver));
                run.metadata.tags.push(approved ? 'approved' : 'rejected');
                this.emit('pipeline.approval.response', runId, approved);
                return [2 /*return*/];
            });
        });
    };
    AutoFixPipeline.prototype.attemptRollback = function (run) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!run.commitResult) {
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        this.logger.info("Attempting rollback for run ".concat(run.id));
                        return [4 /*yield*/, this.committer.rollback(run.commitResult.rollbackInfo)];
                    case 2:
                        _a.sent();
                        run.status = PipelineStatus.ROLLED_BACK;
                        this.statistics.rolledBackRuns++;
                        this.emit('pipeline.rolled.back', run);
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        this.logger.error("Rollback failed for run ".concat(run.id, ":"), error_3);
                        this.emit('pipeline.rollback.failed', { run: run, error: error_3 });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AutoFixPipeline.prototype.startPostCommitMonitoring = function (run) {
        var _this = this;
        // Monitor for issues after commit
        var monitoringPeriod = this.config.pipeline.rollback.gracePeriod;
        setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
            var postCommitIssues, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, this.detector.scanForIssues({
                                paths: run.fix.actions.map(function (action) { return action.file; }),
                                since: run.commitResult.timestamp
                            })];
                    case 1:
                        postCommitIssues = _a.sent();
                        if (!(postCommitIssues.length > 0)) return [3 /*break*/, 4];
                        this.logger.warn("Post-commit issues detected for run ".concat(run.id, ":"), postCommitIssues);
                        if (!this.config.pipeline.rollback.autoRollback) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.attemptRollback(run)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        this.emit('pipeline.post.commit.issues', { run: run, issues: postCommitIssues });
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_4 = _a.sent();
                        this.logger.error("Post-commit monitoring failed for run ".concat(run.id, ":"), error_4);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        }); }, monitoringPeriod);
    };
    AutoFixPipeline.prototype.startMonitoring = function () {
        var _this = this;
        // Start periodic statistics collection
        setInterval(function () {
            _this.collectMetrics();
        }, 60000); // Every minute
        // Start trend analysis
        setInterval(function () {
            _this.updateTrends();
        }, 3600000); // Every hour
    };
    AutoFixPipeline.prototype.collectMetrics = function () {
        var now = Date.now();
        var oneHourAgo = now - 3600000;
        // Count recent runs
        var recentRuns = Array.from(this.runHistory.values())
            .filter(function (run) { return run.startTime > oneHourAgo; });
        // Update success rate
        if (this.statistics.totalRuns > 0) {
            this.statistics.successRate = this.statistics.successfulRuns / this.statistics.totalRuns;
        }
        // Check alert conditions
        this.checkAlerts(recentRuns);
        this.emit('pipeline.metrics.updated', this.statistics);
    };
    AutoFixPipeline.prototype.updateTrends = function () {
        var now = new Date();
        var currentHour = now.getHours();
        // Shift hourly trend
        this.statistics.recentTrends.hourly.shift();
        this.statistics.recentTrends.hourly.push(Array.from(this.runHistory.values())
            .filter(function (run) {
            var runDate = new Date(run.startTime);
            return runDate.getHours() === currentHour &&
                runDate.getDate() === now.getDate();
        }).length);
    };
    AutoFixPipeline.prototype.checkAlerts = function (recentRuns) {
        var alerts = this.config.pipeline.monitoring.alerts;
        // Check failure rate
        if (recentRuns.length > 0) {
            var failureRate = recentRuns.filter(function (run) {
                return run.status === PipelineStatus.FAILED;
            }).length / recentRuns.length;
            if (failureRate > alerts.failureRate) {
                this.emit('pipeline.alert', {
                    type: 'high_failure_rate',
                    value: failureRate,
                    threshold: alerts.failureRate
                });
            }
        }
        // Check response time
        var avgResponseTime = recentRuns.reduce(function (sum, run) {
            return sum + (run.duration || 0);
        }, 0) / recentRuns.length;
        if (avgResponseTime > alerts.responseTime) {
            this.emit('pipeline.alert', {
                type: 'slow_response_time',
                value: avgResponseTime,
                threshold: alerts.responseTime
            });
        }
    };
    AutoFixPipeline.prototype.updateStatistics = function (run) {
        this.statistics.totalRuns++;
        // Update by issue type
        if (!this.statistics.byIssueType[run.issue.type]) {
            this.statistics.byIssueType[run.issue.type] = {
                count: 0,
                successRate: 0,
                averageTime: 0
            };
        }
        var issueStats = this.statistics.byIssueType[run.issue.type];
        issueStats.count++;
        if (run.status === PipelineStatus.SUCCESS) {
            issueStats.successRate = (issueStats.successRate * (issueStats.count - 1) + 1) / issueStats.count;
        }
        else {
            issueStats.successRate = (issueStats.successRate * (issueStats.count - 1)) / issueStats.count;
        }
        if (run.duration) {
            issueStats.averageTime = (issueStats.averageTime * (issueStats.count - 1) + run.duration) / issueStats.count;
        }
        // Update overall average time
        if (run.duration) {
            this.statistics.averageRunTime = ((this.statistics.averageRunTime * (this.statistics.totalRuns - 1) + run.duration) /
                this.statistics.totalRuns);
        }
    };
    AutoFixPipeline.prototype.handleComponentError = function (component, error) {
        this.logger.error("".concat(component, " error:"), error);
        this.emit('pipeline.component.error', { component: component, error: error });
    };
    AutoFixPipeline.prototype.getRepositoryContext = function () {
        return __awaiter(this, void 0, void 0, function () {
            var execAsync, promisify, exec, _a, repoUrl, branch, commit, author, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        execAsync = require('util').execAsync;
                        promisify = require('util').promisify;
                        exec = promisify(require('child_process').exec);
                        return [4 /*yield*/, Promise.all([
                                exec('git config --get remote.origin.url').then(function (r) { return r.stdout.trim(); }).catch(function () { return 'unknown'; }),
                                exec('git branch --show-current').then(function (r) { return r.stdout.trim(); }).catch(function () { return 'unknown'; }),
                                exec('git rev-parse HEAD').then(function (r) { return r.stdout.trim(); }).catch(function () { return 'unknown'; }),
                                exec('git config user.name').then(function (r) { return r.stdout.trim(); }).catch(function () { return 'unknown'; })
                            ])];
                    case 1:
                        _a = _c.sent(), repoUrl = _a[0], branch = _a[1], commit = _a[2], author = _a[3];
                        return [2 /*return*/, { repository: repoUrl, branch: branch, commit: commit, author: author }];
                    case 2:
                        _b = _c.sent();
                        return [2 /*return*/, { repository: 'unknown', branch: 'unknown', commit: 'unknown', author: 'unknown' }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AutoFixPipeline.prototype.generateRunId = function () {
        return "run-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
    };
    AutoFixPipeline.prototype.mapSeverityToPriority = function (severity) {
        switch (severity) {
            case Detector_1.IssueSeverity.CRITICAL: return 'critical';
            case Detector_1.IssueSeverity.HIGH: return 'high';
            case Detector_1.IssueSeverity.MEDIUM: return 'medium';
            default: return 'low';
        }
    };
    AutoFixPipeline.prototype.getSeverityLevel = function (severity) {
        switch (severity) {
            case Detector_1.IssueSeverity.CRITICAL: return 4;
            case Detector_1.IssueSeverity.HIGH: return 3;
            case Detector_1.IssueSeverity.MEDIUM: return 2;
            case Detector_1.IssueSeverity.LOW: return 1;
            default: return 0;
        }
    };
    AutoFixPipeline.prototype.matchesPattern = function (filePath, pattern) {
        var regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(filePath);
    };
    // Public API methods
    AutoFixPipeline.prototype.manualFix = function (issueId) {
        return __awaiter(this, void 0, void 0, function () {
            var issue;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.detector.getIssue(issueId)];
                    case 1:
                        issue = _a.sent();
                        if (!issue) {
                            throw new Error("Issue ".concat(issueId, " not found"));
                        }
                        return [2 /*return*/, this.processIssue(issue, 'manual')];
                }
            });
        });
    };
    AutoFixPipeline.prototype.cancelRun = function (runId) {
        return __awaiter(this, void 0, void 0, function () {
            var run;
            return __generator(this, function (_a) {
                run = this.activeRuns.get(runId);
                if (!run) {
                    throw new Error("Run ".concat(runId, " not found or not active"));
                }
                run.status = PipelineStatus.CANCELLED;
                run.endTime = Date.now();
                run.duration = run.endTime - run.startTime;
                this.activeRuns.delete(runId);
                this.runHistory.set(runId, run);
                this.statistics.cancelledRuns++;
                this.emit('pipeline.cancelled', run);
                return [2 /*return*/];
            });
        });
    };
    AutoFixPipeline.prototype.getRun = function (runId) {
        return this.activeRuns.get(runId) || this.runHistory.get(runId);
    };
    AutoFixPipeline.prototype.getActiveRuns = function () {
        return Array.from(this.activeRuns.values());
    };
    AutoFixPipeline.prototype.getPendingApprovals = function () {
        return Array.from(this.pendingApprovals.values());
    };
    AutoFixPipeline.prototype.getRunHistory = function (limit) {
        if (limit === void 0) { limit = 100; }
        return Array.from(this.runHistory.values())
            .sort(function (a, b) { return b.startTime - a.startTime; })
            .slice(0, limit);
    };
    AutoFixPipeline.prototype.getStatistics = function () {
        return __assign({}, this.statistics);
    };
    AutoFixPipeline.prototype.shutdown = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, runId;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.logger.info('Shutting down Auto-Fix Pipeline...');
                        this.shutdownRequested = true;
                        _i = 0, _a = this.activeRuns.keys();
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        runId = _a[_i];
                        return [4 /*yield*/, this.cancelRun(runId)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: 
                    // Shutdown components
                    return [4 /*yield*/, Promise.all([
                            this.detector.shutdown(),
                            this.fixer.shutdown(),
                            this.verifier.shutdown()
                        ])];
                    case 5:
                        // Shutdown components
                        _b.sent();
                        this.isRunning = false;
                        this.emit('pipeline.shutdown');
                        this.removeAllListeners();
                        return [2 /*return*/];
                }
            });
        });
    };
    AutoFixPipeline.prototype.isHealthy = function () {
        return this.isRunning && !this.shutdownRequested;
    };
    return AutoFixPipeline;
}(events_1.EventEmitter));
exports.AutoFixPipeline = AutoFixPipeline;
exports.DEFAULT_PIPELINE_CONFIG = {
    detector: {}, // Will be filled from Detector defaults
    fixer: {}, // Will be filled from Fixer defaults
    verifier: {}, // Will be filled from Verifier defaults
    committer: {}, // Will be filled from Committer defaults
    pipeline: {
        enabled: true,
        autoMode: false,
        maxConcurrentFixes: 5,
        retryAttempts: 3,
        retryDelay: 5000,
        timeout: 300000, // 5 minutes
        filters: {
            severityThreshold: Detector_1.IssueSeverity.MEDIUM,
            issueTypes: [],
            pathPatterns: [],
            excludePatterns: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
        },
        approval: {
            required: true,
            autoApprove: {
                lowRisk: true,
                highConfidence: true,
                testsPassing: true
            },
            approvers: [],
            timeout: 3600000 // 1 hour
        },
        rollback: {
            enabled: true,
            conditions: {
                testFailures: true,
                verificationScore: 0.7,
                userReports: 3
            },
            autoRollback: false,
            gracePeriod: 1800000 // 30 minutes
        },
        monitoring: {
            enabled: true,
            metrics: {
                successRate: true,
                averageTime: true,
                issueTypes: true,
                fixStrategies: true
            },
            alerts: {
                failureRate: 0.3,
                responseTime: 60000,
                errorPatterns: ['timeout', 'out of memory', 'permission denied']
            }
        }
    }
};
exports.default = AutoFixPipeline;
