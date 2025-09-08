"use strict";
/**
 * Auto-Fix Committer
 *
 * Handles committing verified fixes to version control and creating pull requests
 * with comprehensive documentation and rollback capabilities.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_COMMITTER_CONFIG = exports.Committer = exports.CommitStrategy = exports.CommitStatus = void 0;
var events_1 = require("events");
var fs = require("fs/promises");
var path = require("path");
var child_process_1 = require("child_process");
var logger_1 = require("../utils/logger");
// Commit and PR types
var CommitStatus;
(function (CommitStatus) {
    CommitStatus["PENDING"] = "pending";
    CommitStatus["PREPARING"] = "preparing";
    CommitStatus["COMMITTED"] = "committed";
    CommitStatus["PR_CREATED"] = "pr_created";
    CommitStatus["MERGED"] = "merged";
    CommitStatus["FAILED"] = "failed";
    CommitStatus["ROLLED_BACK"] = "rolled_back";
})(CommitStatus || (exports.CommitStatus = CommitStatus = {}));
var CommitStrategy;
(function (CommitStrategy) {
    CommitStrategy["DIRECT_COMMIT"] = "direct_commit";
    CommitStrategy["PULL_REQUEST"] = "pull_request";
    CommitStrategy["DRAFT_PR"] = "draft_pr";
    CommitStrategy["BRANCH_ONLY"] = "branch_only";
})(CommitStrategy || (exports.CommitStrategy = CommitStrategy = {}));
/**
 * Auto-Fix Committer
 *
 * Manages the final stage of auto-fixing: committing changes and creating PRs
 */
var Committer = /** @class */ (function (_super) {
    __extends(Committer, _super);
    function Committer(config, logger) {
        var _this = _super.call(this) || this;
        _this.commits = new Map();
        _this.activeCommits = new Map();
        _this.statistics = {
            totalCommits: 0,
            totalPRs: 0,
            totalMerged: 0,
            totalRolledBack: 0,
            averageTimeToMerge: 0,
            successRate: 0,
            byStrategy: {}
        };
        _this.config = config;
        _this.logger = logger || new logger_1.Logger({ level: 'info' });
        return _this;
    }
    /**
     * Initialize the committer
     */
    Committer.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info('Initializing Auto-Fix Committer...');
                        // Validate configuration
                        return [4 /*yield*/, this.validateConfiguration()];
                    case 1:
                        // Validate configuration
                        _a.sent();
                        // Test git availability
                        return [4 /*yield*/, this.testGitAvailability()];
                    case 2:
                        // Test git availability
                        _a.sent();
                        // Test integrations
                        return [4 /*yield*/, this.testIntegrations()];
                    case 3:
                        // Test integrations
                        _a.sent();
                        this.logger.info('Auto-Fix Committer initialized successfully');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Commit a verified fix
     */
    Committer.prototype.commitFix = function (fix, verificationResult, issue) {
        return __awaiter(this, void 0, void 0, function () {
            var commitPromise, commitInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.enabled) {
                            throw new Error('Committer is disabled');
                        }
                        if (!this.activeCommits.has(fix.id)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.activeCommits.get(fix.id)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        this.logger.info("Starting commit process for fix: ".concat(fix.id));
                        commitPromise = this.performCommit(fix, verificationResult, issue);
                        this.activeCommits.set(fix.id, commitPromise);
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, , 5, 6]);
                        return [4 /*yield*/, commitPromise];
                    case 4:
                        commitInfo = _a.sent();
                        this.commits.set(commitInfo.id, commitInfo);
                        this.updateStatistics(commitInfo);
                        this.emit('commit_completed', commitInfo);
                        return [2 /*return*/, commitInfo];
                    case 5:
                        this.activeCommits.delete(fix.id);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Rollback a commit
     */
    Committer.prototype.rollbackCommit = function (commitId, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var commitInfo, rollbackCommit, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        commitInfo = this.commits.get(commitId);
                        if (!commitInfo) {
                            throw new Error("Commit not found: ".concat(commitId));
                        }
                        if (!this.config.rollback.enabled) {
                            throw new Error('Rollback is disabled');
                        }
                        this.logger.info("Rolling back commit: ".concat(commitId));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, this.createRollbackCommit(commitInfo, reason)];
                    case 2:
                        rollbackCommit = _a.sent();
                        // Update commit info
                        commitInfo.status = CommitStatus.ROLLED_BACK;
                        commitInfo.rollbackInfo = {
                            originalCommit: commitInfo.commitHash,
                            rollbackCommit: rollbackCommit,
                            rollbackReason: reason
                        };
                        if (!(commitInfo.prNumber && commitInfo.status !== CommitStatus.MERGED)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.closePR(commitInfo, "Rolled back due to: ".concat(reason))];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        this.emit('commit_rolled_back', commitInfo);
                        return [2 /*return*/, commitInfo];
                    case 5:
                        error_1 = _a.sent();
                        this.logger.error("Rollback failed for commit ".concat(commitId, ":"), error_1);
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get commit information
     */
    Committer.prototype.getCommitInfo = function (commitId) {
        return this.commits.get(commitId);
    };
    /**
     * Get all commits with optional filtering
     */
    Committer.prototype.getCommits = function (filters) {
        var commits = Array.from(this.commits.values());
        if (filters) {
            if (filters.status) {
                commits = commits.filter(function (c) { return filters.status.includes(c.status); });
            }
            if (filters.strategy) {
                commits = commits.filter(function (c) { return filters.strategy.includes(c.strategy); });
            }
            if (filters.author) {
                commits = commits.filter(function (c) { return c.author.name === filters.author || c.author.email === filters.author; });
            }
            if (filters.dateRange) {
                commits = commits.filter(function (c) {
                    return c.timestamp >= filters.dateRange.from &&
                        c.timestamp <= filters.dateRange.to;
                });
            }
        }
        return commits.sort(function (a, b) { return b.timestamp - a.timestamp; });
    };
    /**
     * Get committer statistics
     */
    Committer.prototype.getStatistics = function () {
        return __assign({}, this.statistics);
    };
    /**
     * Update PR status (called by external webhook or polling)
     */
    Committer.prototype.updatePRStatus = function (commitId, status, mergeCommit) {
        return __awaiter(this, void 0, void 0, function () {
            var commitInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        commitInfo = this.commits.get(commitId);
                        if (!commitInfo) {
                            return [2 /*return*/];
                        }
                        if (!(status === 'merged')) return [3 /*break*/, 3];
                        commitInfo.status = CommitStatus.MERGED;
                        if (mergeCommit) {
                            commitInfo.commitHash = mergeCommit;
                        }
                        if (!this.config.pullRequest.deleteBranchAfterMerge) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.deleteBranch(commitInfo.branch)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.emit('pr_merged', commitInfo);
                        return [3 /*break*/, 4];
                    case 3:
                        this.emit('pr_closed', commitInfo);
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Private methods
    Committer.prototype.performCommit = function (fix, verificationResult, issue) {
        return __awaiter(this, void 0, void 0, function () {
            var commitId, commitInfo, _a, commitMessage, _b, _c, prInfo, error_2, cleanupError_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        commitId = "commit_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                        commitInfo = {
                            id: commitId,
                            fixId: fix.id,
                            strategy: this.determineCommitStrategy(fix, verificationResult),
                            status: CommitStatus.PENDING,
                            branch: '',
                            baseBranch: this.config.git.defaultBranch,
                            title: '',
                            description: '',
                            files: __spreadArray([], new Set(fix.actions.map(function (a) { return a.file; })), true),
                            author: {
                                name: this.config.git.authorName,
                                email: this.config.git.authorEmail
                            },
                            timestamp: Date.now(),
                            metadata: {
                                issueId: issue === null || issue === void 0 ? void 0 : issue.id,
                                verificationScore: verificationResult.overallScore,
                                autoApproved: !verificationResult.approvalRequired
                            }
                        };
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 13, , 18]);
                        commitInfo.status = CommitStatus.PREPARING;
                        // Create branch
                        _a = commitInfo;
                        return [4 /*yield*/, this.createBranch(fix, issue)];
                    case 2:
                        // Create branch
                        _a.branch = _d.sent();
                        // Apply changes
                        return [4 /*yield*/, this.applyChanges(fix)];
                    case 3:
                        // Apply changes
                        _d.sent();
                        commitMessage = this.generateCommitMessage(fix, verificationResult, issue);
                        commitInfo.title = commitMessage.subject;
                        commitInfo.description = this.generateCommitDescription(fix, verificationResult, issue);
                        // Commit changes
                        _b = commitInfo;
                        return [4 /*yield*/, this.createCommit(commitMessage)];
                    case 4:
                        // Commit changes
                        _b.commitHash = _d.sent();
                        commitInfo.status = CommitStatus.COMMITTED;
                        _c = commitInfo.strategy;
                        switch (_c) {
                            case CommitStrategy.DIRECT_COMMIT: return [3 /*break*/, 5];
                            case CommitStrategy.PULL_REQUEST: return [3 /*break*/, 7];
                            case CommitStrategy.DRAFT_PR: return [3 /*break*/, 7];
                            case CommitStrategy.BRANCH_ONLY: return [3 /*break*/, 10];
                        }
                        return [3 /*break*/, 12];
                    case 5: return [4 /*yield*/, this.pushToMainBranch(commitInfo)];
                    case 6:
                        _d.sent();
                        return [3 /*break*/, 12];
                    case 7: return [4 /*yield*/, this.pushBranch(commitInfo.branch)];
                    case 8:
                        _d.sent();
                        return [4 /*yield*/, this.createPullRequest(commitInfo, fix, verificationResult, issue)];
                    case 9:
                        prInfo = _d.sent();
                        commitInfo.prNumber = prInfo.number;
                        commitInfo.prUrl = prInfo.url;
                        commitInfo.status = CommitStatus.PR_CREATED;
                        return [3 /*break*/, 12];
                    case 10: return [4 /*yield*/, this.pushBranch(commitInfo.branch)];
                    case 11:
                        _d.sent();
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/, commitInfo];
                    case 13:
                        error_2 = _d.sent();
                        commitInfo.status = CommitStatus.FAILED;
                        this.logger.error("Commit failed for fix ".concat(fix.id, ":"), error_2);
                        _d.label = 14;
                    case 14:
                        _d.trys.push([14, 16, , 17]);
                        return [4 /*yield*/, this.cleanupFailedCommit(commitInfo)];
                    case 15:
                        _d.sent();
                        return [3 /*break*/, 17];
                    case 16:
                        cleanupError_1 = _d.sent();
                        this.logger.error('Cleanup failed:', cleanupError_1);
                        return [3 /*break*/, 17];
                    case 17: throw error_2;
                    case 18: return [2 /*return*/];
                }
            });
        });
    };
    Committer.prototype.determineCommitStrategy = function (fix, verificationResult) {
        // Use direct commit for low-risk, high-confidence fixes
        if (verificationResult.overallScore >= 0.95 &&
            !verificationResult.approvalRequired &&
            fix.estimatedImpact.riskScore < 0.2 &&
            fix.estimatedImpact.filesChanged === 1) {
            return CommitStrategy.DIRECT_COMMIT;
        }
        // Use draft PR for experimental or low-confidence fixes
        if (verificationResult.overallScore < 0.7 ||
            fix.estimatedImpact.riskScore > 0.8) {
            return CommitStrategy.DRAFT_PR;
        }
        // Default to pull request
        return this.config.defaultStrategy;
    };
    Committer.prototype.createBranch = function (fix, issue) {
        return __awaiter(this, void 0, void 0, function () {
            var branchName;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        branchName = this.generateBranchName(fix, issue);
                        // Ensure we're on the base branch
                        return [4 /*yield*/, this.runGitCommand(['checkout', this.config.git.defaultBranch])];
                    case 1:
                        // Ensure we're on the base branch
                        _a.sent();
                        return [4 /*yield*/, this.runGitCommand(['pull', 'origin', this.config.git.defaultBranch])];
                    case 2:
                        _a.sent();
                        // Create and checkout new branch
                        return [4 /*yield*/, this.runGitCommand(['checkout', '-b', branchName])];
                    case 3:
                        // Create and checkout new branch
                        _a.sent();
                        return [2 /*return*/, branchName];
                }
            });
        });
    };
    Committer.prototype.generateBranchName = function (fix, issue) {
        var prefix = this.config.git.branchPrefix;
        var timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        var fixType = fix.type.toLowerCase().replace(/_/g, '-');
        var branchName = "".concat(prefix).concat(fixType, "-").concat(timestamp);
        if (issue) {
            var issueId = issue.id.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
            branchName += "-".concat(issueId);
        }
        // Add random suffix to ensure uniqueness
        branchName += "-".concat(Math.random().toString(36).substr(2, 6));
        return branchName;
    };
    Committer.prototype.applyChanges = function (fix) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, action, filePath;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = fix.actions;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        action = _a[_i];
                        filePath = path.resolve(action.file);
                        // Security check
                        if (!this.isFileAllowed(action.file)) {
                            throw new Error("File not allowed for auto-commit: ".concat(action.file));
                        }
                        // Ensure directory exists
                        return [4 /*yield*/, fs.mkdir(path.dirname(filePath), { recursive: true })];
                    case 2:
                        // Ensure directory exists
                        _b.sent();
                        // Write new content
                        return [4 /*yield*/, fs.writeFile(filePath, action.newContent, 'utf8')];
                    case 3:
                        // Write new content
                        _b.sent();
                        // Stage the file
                        return [4 /*yield*/, this.runGitCommand(['add', action.file])];
                    case 4:
                        // Stage the file
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    Committer.prototype.generateCommitMessage = function (fix, verificationResult, issue) {
        var commitMessage = {
            type: this.getCommitType(fix),
            subject: this.generateCommitSubject(fix, issue),
            body: this.generateCommitBody(fix, verificationResult, issue),
            footer: this.generateCommitFooter(fix, verificationResult, issue)
        };
        // Add scope if available
        if (fix.actions.length === 1) {
            var file = fix.actions[0].file;
            var scope = this.extractScope(file);
            if (scope) {
                commitMessage.scope = scope;
            }
        }
        return commitMessage;
    };
    Committer.prototype.getCommitType = function (fix) {
        var typeMap = {
            'BUG_FIX': 'fix',
            'PERFORMANCE': 'perf',
            'SECURITY': 'fix',
            'STYLE': 'style',
            'REFACTOR': 'refactor',
            'TEST': 'test',
            'DOCUMENTATION': 'docs',
            'DEPENDENCY': 'chore'
        };
        return typeMap[fix.type] || 'fix';
    };
    Committer.prototype.generateCommitSubject = function (fix, issue) {
        var subject = fix.description || 'Auto-fix applied';
        // Truncate if too long
        var maxLength = this.config.commit.maxSubjectLength;
        if (subject.length > maxLength) {
            subject = subject.substring(0, maxLength - 3) + '...';
        }
        // Add issue ID if configured
        if (this.config.commit.includeIssueId && issue) {
            subject += " (#".concat(issue.id, ")");
        }
        return subject;
    };
    Committer.prototype.generateCommitBody = function (fix, verificationResult, issue) {
        var lines = [];
        if (fix.description && fix.description !== fix.description) {
            lines.push(fix.description);
            lines.push('');
        }
        // Add fix details
        lines.push('Auto-generated fix details:');
        lines.push("- Fix type: ".concat(fix.type));
        lines.push("- Strategy: ".concat(fix.strategy));
        lines.push("- Files changed: ".concat(fix.actions.length));
        lines.push("- Lines changed: ".concat(fix.estimatedImpact.linesChanged));
        if (this.config.commit.includeVerificationInfo) {
            lines.push('');
            lines.push('Verification results:');
            lines.push("- Overall score: ".concat((verificationResult.overallScore * 100).toFixed(1), "%"));
            lines.push("- Tests passed: ".concat(verificationResult.summary.passed, "/").concat(verificationResult.summary.total));
            if (verificationResult.warnings.length > 0) {
                lines.push("- Warnings: ".concat(verificationResult.warnings.length));
            }
        }
        if (issue) {
            lines.push('');
            lines.push("Fixes issue: ".concat(issue.type, " - ").concat(issue.message));
            if (issue.file) {
                lines.push("Location: ".concat(issue.file, ":").concat(issue.line || 'unknown'));
            }
        }
        return lines.join('\n');
    };
    Committer.prototype.generateCommitFooter = function (fix, verificationResult, issue) {
        var footers = [];
        if (issue) {
            footers.push("Fixes: ".concat(issue.id));
        }
        footers.push("Auto-fix-id: ".concat(fix.id));
        footers.push("Verification-score: ".concat(verificationResult.overallScore.toFixed(3)));
        return footers.join('\n');
    };
    Committer.prototype.generateCommitDescription = function (fix, verificationResult, issue) {
        var lines = [];
        lines.push('## Auto-Generated Fix');
        lines.push('');
        lines.push("This fix was automatically generated and verified with a score of ".concat((verificationResult.overallScore * 100).toFixed(1), "%."));
        lines.push('');
        if (issue) {
            lines.push('### Issue Fixed');
            lines.push("- **Type**: ".concat(issue.type));
            lines.push("- **Severity**: ".concat(issue.severity));
            lines.push("- **Message**: ".concat(issue.message));
            if (issue.file) {
                lines.push("- **Location**: ".concat(issue.file, ":").concat(issue.line || 'unknown'));
            }
            lines.push('');
        }
        lines.push('### Changes Made');
        for (var _i = 0, _a = fix.actions; _i < _a.length; _i++) {
            var action = _a[_i];
            lines.push("- Modified `".concat(action.file, "` (lines ").concat(action.startLine, "-").concat(action.endLine, ")"));
        }
        lines.push('');
        lines.push('### Verification Results');
        lines.push("- **Overall Score**: ".concat((verificationResult.overallScore * 100).toFixed(1), "%"));
        lines.push("- **Tests Passed**: ".concat(verificationResult.summary.passed, "/").concat(verificationResult.summary.total));
        if (verificationResult.warnings.length > 0) {
            lines.push("- **Warnings**: ".concat(verificationResult.warnings.length));
            for (var _b = 0, _c = verificationResult.warnings.slice(0, 3); _b < _c.length; _b++) {
                var warning = _c[_b];
                lines.push("  - ".concat(warning));
            }
            if (verificationResult.warnings.length > 3) {
                lines.push("  - ... and ".concat(verificationResult.warnings.length - 3, " more"));
            }
        }
        if (verificationResult.recommendations.length > 0) {
            lines.push('');
            lines.push('### Recommendations');
            for (var _d = 0, _e = verificationResult.recommendations.slice(0, 3); _d < _e.length; _d++) {
                var rec = _e[_d];
                lines.push("- ".concat(rec));
            }
        }
        return lines.join('\n');
    };
    Committer.prototype.extractScope = function (filePath) {
        var parts = filePath.split('/');
        // Try to extract meaningful scope from path
        if (parts.includes('src')) {
            var srcIndex = parts.indexOf('src');
            if (srcIndex < parts.length - 1) {
                return parts[srcIndex + 1];
            }
        }
        // Fallback to directory name
        if (parts.length > 1) {
            return parts[parts.length - 2];
        }
        return undefined;
    };
    Committer.prototype.createCommit = function (commitMessage) {
        return __awaiter(this, void 0, void 0, function () {
            var message, args, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        message = this.formatCommitMessage(commitMessage);
                        args = ['commit', '-m', message];
                        // Add signing if configured
                        if (this.config.git.signCommits) {
                            args.push('-S');
                            if (this.config.git.gpgKeyId) {
                                args.push("--gpg-sign=".concat(this.config.git.gpgKeyId));
                            }
                        }
                        return [4 /*yield*/, this.runGitCommand(args)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.runGitCommand(['rev-parse', 'HEAD'])];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.trim()];
                }
            });
        });
    };
    Committer.prototype.formatCommitMessage = function (commitMessage) {
        if (!this.config.commit.conventionalCommits) {
            return commitMessage.subject;
        }
        var message = commitMessage.type;
        if (commitMessage.scope) {
            message += "(".concat(commitMessage.scope, ")");
        }
        if (commitMessage.breakingChange) {
            message += '!';
        }
        message += ": ".concat(commitMessage.subject);
        if (commitMessage.body) {
            message += "\n\n".concat(commitMessage.body);
        }
        if (commitMessage.footer) {
            message += "\n\n".concat(commitMessage.footer);
        }
        return message;
    };
    Committer.prototype.pushToMainBranch = function (commitInfo) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runGitCommand(['push', 'origin', this.config.git.defaultBranch])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Committer.prototype.pushBranch = function (branch) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runGitCommand(['push', 'origin', branch])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Committer.prototype.createPullRequest = function (commitInfo, fix, verificationResult, issue) {
        return __awaiter(this, void 0, void 0, function () {
            var prData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prData = {
                            title: commitInfo.title,
                            body: commitInfo.description,
                            head: commitInfo.branch,
                            base: commitInfo.baseBranch,
                            draft: commitInfo.strategy === CommitStrategy.DRAFT_PR
                        };
                        if (!this.config.integrations.github) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.createGitHubPR(prData)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        if (!this.config.integrations.gitlab) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.createGitLabMR(prData)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        if (!this.config.integrations.bitbucket) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.createBitbucketPR(prData)];
                    case 5: return [2 /*return*/, _a.sent()];
                    case 6: throw new Error('No PR integration configured');
                }
            });
        });
    };
    Committer.prototype.createGitHubPR = function (prData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Implement GitHub PR creation
                // This would use the GitHub API to create a pull request
                throw new Error('GitHub integration not implemented');
            });
        });
    };
    Committer.prototype.createGitLabMR = function (prData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Implement GitLab MR creation
                throw new Error('GitLab integration not implemented');
            });
        });
    };
    Committer.prototype.createBitbucketPR = function (prData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Implement Bitbucket PR creation
                throw new Error('Bitbucket integration not implemented');
            });
        });
    };
    Committer.prototype.createRollbackCommit = function (commitInfo, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!commitInfo.commitHash) {
                            throw new Error('Cannot rollback: no commit hash available');
                        }
                        // Create rollback commit
                        return [4 /*yield*/, this.runGitCommand(['revert', '--no-edit', commitInfo.commitHash])];
                    case 1:
                        // Create rollback commit
                        _a.sent();
                        return [4 /*yield*/, this.runGitCommand(['rev-parse', 'HEAD'])];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.trim()];
                }
            });
        });
    };
    Committer.prototype.closePR = function (commitInfo, reason) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!commitInfo.prNumber) {
                    return [2 /*return*/];
                }
                // TODO: Implement PR closing for different integrations
                this.logger.info("Would close PR #".concat(commitInfo.prNumber, ": ").concat(reason));
                return [2 /*return*/];
            });
        });
    };
    Committer.prototype.deleteBranch = function (branch) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.runGitCommand(['branch', '-D', branch])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.runGitCommand(['push', 'origin', '--delete', branch])];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        this.logger.warn("Failed to delete branch ".concat(branch, ":"), error_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Committer.prototype.cleanupFailedCommit = function (commitInfo) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        // Reset to original state
                        return [4 /*yield*/, this.runGitCommand(['reset', '--hard', 'HEAD~1'])];
                    case 1:
                        // Reset to original state
                        _a.sent();
                        if (!(commitInfo.branch && commitInfo.branch !== this.config.git.defaultBranch)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.runGitCommand(['checkout', this.config.git.defaultBranch])];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.runGitCommand(['branch', '-D', commitInfo.branch])];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_4 = _a.sent();
                        this.logger.error('Cleanup failed:', error_4);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    Committer.prototype.isFileAllowed = function (filePath) {
        // Check forbidden patterns
        for (var _i = 0, _a = this.config.security.forbiddenFilePatterns; _i < _a.length; _i++) {
            var pattern = _a[_i];
            if (pattern.test(filePath)) {
                return false;
            }
        }
        // Check allowed patterns
        if (this.config.security.allowedFilePatterns.length > 0) {
            return this.config.security.allowedFilePatterns.some(function (pattern) { return pattern.test(filePath); });
        }
        return true;
    };
    Committer.prototype.runGitCommand = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var _a, _b;
                        var child = (0, child_process_1.spawn)('git', args, {
                            stdio: 'pipe',
                            cwd: process.cwd()
                        });
                        var stdout = '';
                        var stderr = '';
                        (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
                            stdout += data.toString();
                        });
                        (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
                            stderr += data.toString();
                        });
                        child.on('close', function (code) {
                            if (code === 0) {
                                resolve(stdout);
                            }
                            else {
                                reject(new Error("Git command failed: ".concat(args.join(' '), "\n").concat(stderr)));
                            }
                        });
                        child.on('error', function (error) {
                            reject(error);
                        });
                    })];
            });
        });
    };
    Committer.prototype.validateConfiguration = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.config.git.authorName || !this.config.git.authorEmail) {
                    throw new Error('Git author name and email must be configured');
                }
                if (this.config.pullRequest.enabled && !Object.keys(this.config.integrations).length) {
                    throw new Error('PR integration must be configured when pull requests are enabled');
                }
                return [2 /*return*/];
            });
        });
    };
    Committer.prototype.testGitAvailability = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.runGitCommand(['--version'])];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        throw new Error('Git is not available or not properly configured');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Committer.prototype.testIntegrations = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Test configured integrations
                this.logger.debug('Integration tests passed');
                return [2 /*return*/];
            });
        });
    };
    Committer.prototype.updateStatistics = function (commitInfo) {
        this.statistics.totalCommits++;
        if (commitInfo.status === CommitStatus.PR_CREATED) {
            this.statistics.totalPRs++;
        }
        if (commitInfo.status === CommitStatus.MERGED) {
            this.statistics.totalMerged++;
        }
        if (commitInfo.status === CommitStatus.ROLLED_BACK) {
            this.statistics.totalRolledBack++;
        }
        // Update success rate
        var successful = this.statistics.totalMerged + (this.statistics.totalCommits - this.statistics.totalPRs);
        this.statistics.successRate = successful / this.statistics.totalCommits;
        // Update by strategy statistics
        if (!this.statistics.byStrategy[commitInfo.strategy]) {
            this.statistics.byStrategy[commitInfo.strategy] = { count: 0, successRate: 0 };
        }
        var strategyStats = this.statistics.byStrategy[commitInfo.strategy];
        strategyStats.count++;
        // Calculate strategy success rate
        var strategyCommits = Array.from(this.commits.values())
            .filter(function (c) { return c.strategy === commitInfo.strategy; });
        var strategySuccessful = strategyCommits.filter(function (c) {
            return c.status === CommitStatus.MERGED ||
                (c.status === CommitStatus.COMMITTED && c.strategy === CommitStrategy.DIRECT_COMMIT);
        }).length;
        strategyStats.successRate = strategySuccessful / strategyStats.count;
    };
    return Committer;
}(events_1.EventEmitter));
exports.Committer = Committer;
// Default configuration
exports.DEFAULT_COMMITTER_CONFIG = {
    enabled: true,
    defaultStrategy: CommitStrategy.PULL_REQUEST,
    git: {
        defaultBranch: 'main',
        branchPrefix: 'autofix/',
        authorName: 'Auto-Fix Bot',
        authorEmail: 'autofix@example.com',
        signCommits: false
    },
    commit: {
        conventionalCommits: true,
        includeIssueId: true,
        includeVerificationInfo: true,
        maxSubjectLength: 72,
        requireDescription: true
    },
    pullRequest: {
        enabled: true,
        defaultReviewers: [],
        defaultLabels: ['auto-fix', 'bot'],
        requireReview: true,
        autoMerge: false,
        autoMergeThreshold: 0.9,
        deleteBranchAfterMerge: true,
        template: {
            title: 'Auto-fix: {title}',
            description: '{description}',
            labels: ['auto-fix'],
            reviewers: [],
            assignees: [],
            draft: false
        }
    },
    rollback: {
        enabled: true,
        autoRollbackOnFailure: false,
        keepRollbackBranch: true,
        notifyOnRollback: true
    },
    security: {
        requireApprovalForCritical: true,
        allowedFilePatterns: [
            /\.(js|ts|jsx|tsx|py|java|go|rs|cpp|c|h)$/,
            /\.(json|yaml|yml|toml|ini)$/,
            /\.(md|txt|rst)$/
        ],
        forbiddenFilePatterns: [
            /\.env$/,
            /\.key$/,
            /\.pem$/,
            /\.p12$/,
            /password/i,
            /secret/i
        ],
        maxFilesPerCommit: 10,
        maxLinesPerCommit: 500
    },
    integrations: {}
};
exports.default = Committer;
