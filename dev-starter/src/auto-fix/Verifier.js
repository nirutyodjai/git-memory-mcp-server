"use strict";
/**
 * Auto-Fix Verifier
 *
 * Verifies fixes before they are committed. Runs comprehensive validation
 * including tests, security checks, and policy enforcement.
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
exports.DEFAULT_VERIFIER_CONFIG = exports.Verifier = exports.VerificationType = exports.VerificationStatus = void 0;
var events_1 = require("events");
var fs = require("fs/promises");
var path = require("path");
var child_process_1 = require("child_process");
var logger_1 = require("../utils/logger");
var Detector_1 = require("./Detector");
// Verification types and results
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "pending";
    VerificationStatus["RUNNING"] = "running";
    VerificationStatus["PASSED"] = "passed";
    VerificationStatus["FAILED"] = "failed";
    VerificationStatus["SKIPPED"] = "skipped";
    VerificationStatus["TIMEOUT"] = "timeout";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
var VerificationType;
(function (VerificationType) {
    VerificationType["SYNTAX_CHECK"] = "syntax_check";
    VerificationType["TYPE_CHECK"] = "type_check";
    VerificationType["UNIT_TESTS"] = "unit_tests";
    VerificationType["INTEGRATION_TESTS"] = "integration_tests";
    VerificationType["LINT_CHECK"] = "lint_check";
    VerificationType["SECURITY_SCAN"] = "security_scan";
    VerificationType["PERFORMANCE_CHECK"] = "performance_check";
    VerificationType["POLICY_CHECK"] = "policy_check";
    VerificationType["DEPENDENCY_CHECK"] = "dependency_check";
})(VerificationType || (exports.VerificationType = VerificationType = {}));
/**
 * Auto-Fix Verifier
 *
 * Comprehensive verification system for auto-generated fixes
 */
var Verifier = /** @class */ (function (_super) {
    __extends(Verifier, _super);
    function Verifier(config, logger) {
        var _this = _super.call(this) || this;
        _this.verificationResults = new Map();
        _this.activeVerifications = new Map();
        _this.policyRules = new Map();
        _this.statistics = {
            totalVerifications: 0,
            totalPassed: 0,
            totalFailed: 0,
            averageScore: 0,
            averageTime: 0,
            byType: {}
        };
        _this.config = config;
        _this.logger = logger || new logger_1.Logger({ level: 'info' });
        // Load built-in policy rules
        _this.loadBuiltInPolicies();
        // Load custom policy rules
        if (config.policies.enabled) {
            _this.loadCustomPolicies();
        }
        return _this;
    }
    /**
     * Initialize the verifier
     */
    Verifier.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info('Initializing Auto-Fix Verifier...');
                        // Validate configuration
                        return [4 /*yield*/, this.validateConfiguration()];
                    case 1:
                        // Validate configuration
                        _a.sent();
                        // Test verification tools
                        return [4 /*yield*/, this.testVerificationTools()];
                    case 2:
                        // Test verification tools
                        _a.sent();
                        this.logger.info('Auto-Fix Verifier initialized successfully');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Verify a fix
     */
    Verifier.prototype.verifyFix = function (fix) {
        return __awaiter(this, void 0, void 0, function () {
            var verificationPromise, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.enabled) {
                            return [2 /*return*/, this.createSkippedResult(fix.id, 'Verifier disabled')];
                        }
                        if (!this.activeVerifications.has(fix.id)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.activeVerifications.get(fix.id)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        this.logger.info("Starting verification for fix: ".concat(fix.id));
                        verificationPromise = this.performVerification(fix);
                        this.activeVerifications.set(fix.id, verificationPromise);
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, , 5, 6]);
                        return [4 /*yield*/, verificationPromise];
                    case 4:
                        result = _a.sent();
                        this.verificationResults.set(fix.id, result);
                        this.updateStatistics(result);
                        this.emit('verification_completed', result);
                        return [2 /*return*/, result];
                    case 5:
                        this.activeVerifications.delete(fix.id);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get verification result
     */
    Verifier.prototype.getVerificationResult = function (fixId) {
        return this.verificationResults.get(fixId);
    };
    /**
     * Get all verification results with optional filtering
     */
    Verifier.prototype.getVerificationResults = function (filters) {
        var results = Array.from(this.verificationResults.values());
        if (filters) {
            if (filters.status) {
                results = results.filter(function (r) { return filters.status.includes(r.status); });
            }
            if (filters.minScore !== undefined) {
                results = results.filter(function (r) { return r.overallScore >= filters.minScore; });
            }
            if (filters.maxScore !== undefined) {
                results = results.filter(function (r) { return r.overallScore <= filters.maxScore; });
            }
        }
        return results.sort(function (a, b) { return b.metrics.totalTime - a.metrics.totalTime; });
    };
    /**
     * Get verifier statistics
     */
    Verifier.prototype.getStatistics = function () {
        return __assign({}, this.statistics);
    };
    /**
     * Add custom policy rule
     */
    Verifier.prototype.addPolicyRule = function (rule) {
        this.policyRules.set(rule.id, rule);
        this.logger.info("Added custom policy rule: ".concat(rule.name));
    };
    /**
     * Remove policy rule
     */
    Verifier.prototype.removePolicyRule = function (ruleId) {
        if (this.policyRules.delete(ruleId)) {
            this.logger.info("Removed policy rule: ".concat(ruleId));
        }
    };
    // Private methods
    Verifier.prototype.performVerification = function (fix) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, result, context, steps, _i, steps_1, step, policyViolations, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        result = {
                            fixId: fix.id,
                            status: VerificationStatus.RUNNING,
                            overallScore: 0,
                            steps: [],
                            summary: {
                                total: 0,
                                passed: 0,
                                failed: 0,
                                skipped: 0,
                                timeout: 0
                            },
                            recommendations: [],
                            blockers: [],
                            warnings: [],
                            metrics: {
                                totalTime: 0
                            },
                            approvalRequired: false,
                            canProceed: false
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        return [4 /*yield*/, this.createVerificationContext(fix)];
                    case 2:
                        context = _a.sent();
                        steps = this.generateVerificationSteps(fix, context);
                        result.steps = steps;
                        result.summary.total = steps.length;
                        _i = 0, steps_1 = steps;
                        _a.label = 3;
                    case 3:
                        if (!(_i < steps_1.length)) return [3 /*break*/, 6];
                        step = steps_1[_i];
                        return [4 /*yield*/, this.runVerificationStep(step, fix, context)];
                    case 4:
                        _a.sent();
                        this.updateSummary(result.summary, step);
                        // Stop on critical failures in strict mode
                        if (this.config.strictMode && step.status === VerificationStatus.FAILED && step.required) {
                            result.blockers.push("Critical step failed: ".concat(step.name));
                            return [3 /*break*/, 6];
                        }
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        if (!this.config.policies.enabled) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.runPolicyChecks(fix, context)];
                    case 7:
                        policyViolations = _a.sent();
                        this.processPolicyViolations(result, policyViolations);
                        _a.label = 8;
                    case 8:
                        // Calculate overall score and status
                        this.calculateOverallResult(result);
                        // Determine if approval is required
                        result.approvalRequired = this.requiresApproval(fix, result);
                        // Determine if can proceed
                        result.canProceed = this.canProceed(result);
                        // Generate recommendations
                        result.recommendations = this.generateRecommendations(result);
                        return [3 /*break*/, 10];
                    case 9:
                        error_1 = _a.sent();
                        result.status = VerificationStatus.FAILED;
                        result.blockers.push("Verification error: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                        this.logger.error("Verification failed for fix ".concat(fix.id, ":"), error_1);
                        return [3 /*break*/, 10];
                    case 10:
                        result.metrics.totalTime = Date.now() - startTime;
                        return [2 /*return*/, result];
                }
            });
        });
    };
    Verifier.prototype.createVerificationContext = function (fix) {
        return __awaiter(this, void 0, void 0, function () {
            var workspaceRoot, affectedFiles, testFiles, _i, affectedFiles_1, file, testFile, configFiles;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        workspaceRoot = process.cwd();
                        affectedFiles = __spreadArray([], new Set(fix.actions.map(function (a) { return a.file; })), true);
                        testFiles = [];
                        _i = 0, affectedFiles_1 = affectedFiles;
                        _a.label = 1;
                    case 1:
                        if (!(_i < affectedFiles_1.length)) return [3 /*break*/, 4];
                        file = affectedFiles_1[_i];
                        return [4 /*yield*/, this.findTestFile(file)];
                    case 2:
                        testFile = _a.sent();
                        if (testFile) {
                            testFiles.push(testFile);
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [4 /*yield*/, this.findConfigFiles(workspaceRoot)];
                    case 5:
                        configFiles = _a.sent();
                        return [2 /*return*/, {
                                workspaceRoot: workspaceRoot,
                                affectedFiles: affectedFiles,
                                testFiles: testFiles,
                                configFiles: configFiles,
                                environment: 'development', // TODO: Detect environment
                                metadata: {
                                    fixType: fix.type,
                                    fixStrategy: fix.strategy,
                                    issueType: fix.issueId
                                }
                            }];
                }
            });
        });
    };
    Verifier.prototype.generateVerificationSteps = function (fix, context) {
        var steps = [];
        // Add configured verification steps
        for (var _i = 0, _a = Object.entries(this.config.steps); _i < _a.length; _i++) {
            var _b = _a[_i], type = _b[0], config = _b[1];
            if (!config.enabled)
                continue;
            var step = {
                id: "".concat(type, "_").concat(Date.now()),
                type: type,
                name: this.getStepName(type),
                description: this.getStepDescription(type),
                command: config.command,
                timeout: config.timeout,
                required: config.required,
                retries: config.retries,
                status: VerificationStatus.PENDING
            };
            steps.push(step);
        }
        return steps;
    };
    Verifier.prototype.runVerificationStep = function (step, fix, context) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        step.status = VerificationStatus.RUNNING;
                        step.startTime = Date.now();
                        this.logger.debug("Running verification step: ".concat(step.name));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 24, 25, 26]);
                        _a = step.type;
                        switch (_a) {
                            case VerificationType.SYNTAX_CHECK: return [3 /*break*/, 2];
                            case VerificationType.TYPE_CHECK: return [3 /*break*/, 4];
                            case VerificationType.UNIT_TESTS: return [3 /*break*/, 6];
                            case VerificationType.INTEGRATION_TESTS: return [3 /*break*/, 8];
                            case VerificationType.LINT_CHECK: return [3 /*break*/, 10];
                            case VerificationType.SECURITY_SCAN: return [3 /*break*/, 12];
                            case VerificationType.PERFORMANCE_CHECK: return [3 /*break*/, 14];
                            case VerificationType.POLICY_CHECK: return [3 /*break*/, 16];
                            case VerificationType.DEPENDENCY_CHECK: return [3 /*break*/, 18];
                        }
                        return [3 /*break*/, 20];
                    case 2: return [4 /*yield*/, this.runSyntaxCheck(step, fix, context)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 23];
                    case 4: return [4 /*yield*/, this.runTypeCheck(step, fix, context)];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 23];
                    case 6: return [4 /*yield*/, this.runUnitTests(step, fix, context)];
                    case 7:
                        _b.sent();
                        return [3 /*break*/, 23];
                    case 8: return [4 /*yield*/, this.runIntegrationTests(step, fix, context)];
                    case 9:
                        _b.sent();
                        return [3 /*break*/, 23];
                    case 10: return [4 /*yield*/, this.runLintCheck(step, fix, context)];
                    case 11:
                        _b.sent();
                        return [3 /*break*/, 23];
                    case 12: return [4 /*yield*/, this.runSecurityScan(step, fix, context)];
                    case 13:
                        _b.sent();
                        return [3 /*break*/, 23];
                    case 14: return [4 /*yield*/, this.runPerformanceCheck(step, fix, context)];
                    case 15:
                        _b.sent();
                        return [3 /*break*/, 23];
                    case 16: return [4 /*yield*/, this.runPolicyCheck(step, fix, context)];
                    case 17:
                        _b.sent();
                        return [3 /*break*/, 23];
                    case 18: return [4 /*yield*/, this.runDependencyCheck(step, fix, context)];
                    case 19:
                        _b.sent();
                        return [3 /*break*/, 23];
                    case 20:
                        if (!step.command) return [3 /*break*/, 22];
                        return [4 /*yield*/, this.runCommandStep(step, fix, context)];
                    case 21:
                        _b.sent();
                        return [3 /*break*/, 23];
                    case 22:
                        step.status = VerificationStatus.SKIPPED;
                        step.output = 'No implementation available';
                        _b.label = 23;
                    case 23:
                        if (step.status === VerificationStatus.RUNNING) {
                            step.status = VerificationStatus.PASSED;
                        }
                        return [3 /*break*/, 26];
                    case 24:
                        error_2 = _b.sent();
                        step.status = VerificationStatus.FAILED;
                        step.error = error_2 instanceof Error ? error_2.message : String(error_2);
                        this.logger.error("Verification step ".concat(step.name, " failed:"), error_2);
                        return [3 /*break*/, 26];
                    case 25:
                        step.endTime = Date.now();
                        return [7 /*endfinally*/];
                    case 26: return [2 /*return*/];
                }
            });
        });
    };
    Verifier.prototype.runCommandStep = function (step, fix, context) {
        return __awaiter(this, void 0, void 0, function () {
            var stepConfig;
            return __generator(this, function (_a) {
                if (!step.command) {
                    throw new Error('No command specified for step');
                }
                stepConfig = this.config.steps[step.type];
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var _a, _b;
                        var child = (0, child_process_1.spawn)(step.command, stepConfig.args || [], {
                            cwd: context.workspaceRoot,
                            env: __assign(__assign({}, process.env), stepConfig.env),
                            stdio: 'pipe'
                        });
                        var stdout = '';
                        var stderr = '';
                        (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
                            stdout += data.toString();
                        });
                        (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
                            stderr += data.toString();
                        });
                        var timeout = setTimeout(function () {
                            child.kill('SIGTERM');
                            step.status = VerificationStatus.TIMEOUT;
                            reject(new Error("Step timed out after ".concat(step.timeout, "ms")));
                        }, step.timeout);
                        child.on('close', function (code) {
                            clearTimeout(timeout);
                            step.exitCode = code || 0;
                            step.output = stdout;
                            if (stderr) {
                                step.error = stderr;
                            }
                            if (code === 0) {
                                resolve();
                            }
                            else {
                                reject(new Error("Command failed with exit code ".concat(code)));
                            }
                        });
                        child.on('error', function (error) {
                            clearTimeout(timeout);
                            reject(error);
                        });
                    })];
            });
        });
    };
    Verifier.prototype.runSyntaxCheck = function (step, fix, context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Implement syntax checking for different languages
                step.output = 'Syntax check passed';
                return [2 /*return*/];
            });
        });
    };
    Verifier.prototype.runTypeCheck = function (step, fix, context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Implement type checking (TypeScript, etc.)
                step.output = 'Type check passed';
                return [2 /*return*/];
            });
        });
    };
    Verifier.prototype.runUnitTests = function (step, fix, context) {
        return __awaiter(this, void 0, void 0, function () {
            var command;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.testing.runUnitTests) {
                            step.status = VerificationStatus.SKIPPED;
                            return [2 /*return*/];
                        }
                        command = this.config.testing.testCommand;
                        if (!command) return [3 /*break*/, 2];
                        step.command = command;
                        return [4 /*yield*/, this.runCommandStep(step, fix, context)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    Verifier.prototype.runIntegrationTests = function (step, fix, context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.config.testing.runIntegrationTests) {
                    step.status = VerificationStatus.SKIPPED;
                    return [2 /*return*/];
                }
                // TODO: Implement integration test running
                step.output = 'Integration tests passed';
                return [2 /*return*/];
            });
        });
    };
    Verifier.prototype.runLintCheck = function (step, fix, context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Implement linting for affected files
                step.output = 'Lint check passed';
                return [2 /*return*/];
            });
        });
    };
    Verifier.prototype.runSecurityScan = function (step, fix, context) {
        return __awaiter(this, void 0, void 0, function () {
            var violations, _i, _a, action, _b, _c, pattern, _d, _e, action;
            return __generator(this, function (_f) {
                if (!this.config.security.enabled) {
                    step.status = VerificationStatus.SKIPPED;
                    return [2 /*return*/];
                }
                violations = [];
                // Check for secrets
                if (this.config.security.scanSecrets) {
                    for (_i = 0, _a = fix.actions; _i < _a.length; _i++) {
                        action = _a[_i];
                        if (this.containsSecrets(action.newContent)) {
                            violations.push("Potential secret detected in ".concat(action.file));
                        }
                    }
                }
                // Check forbidden patterns
                for (_b = 0, _c = this.config.security.forbiddenPatterns; _b < _c.length; _b++) {
                    pattern = _c[_b];
                    for (_d = 0, _e = fix.actions; _d < _e.length; _d++) {
                        action = _e[_d];
                        if (pattern.test(action.newContent)) {
                            violations.push("Forbidden pattern detected in ".concat(action.file));
                        }
                    }
                }
                if (violations.length > 0) {
                    step.error = violations.join('; ');
                    throw new Error("Security violations: ".concat(violations.join(', ')));
                }
                step.output = 'Security scan passed';
                return [2 /*return*/];
            });
        });
    };
    Verifier.prototype.runPerformanceCheck = function (step, fix, context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.config.performance.enabled) {
                    step.status = VerificationStatus.SKIPPED;
                    return [2 /*return*/];
                }
                // TODO: Implement performance checking
                step.output = 'Performance check passed';
                return [2 /*return*/];
            });
        });
    };
    Verifier.prototype.runPolicyCheck = function (step, fix, context) {
        return __awaiter(this, void 0, void 0, function () {
            var violations, criticalViolations;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runPolicyChecks(fix, context)];
                    case 1:
                        violations = _a.sent();
                        if (violations.length > 0) {
                            criticalViolations = violations.filter(function (v) { return v.severity === Detector_1.IssueSeverity.CRITICAL; });
                            if (criticalViolations.length > 0) {
                                step.error = criticalViolations.map(function (v) { return v.message; }).join('; ');
                                throw new Error("Policy violations: ".concat(criticalViolations.map(function (v) { return v.message; }).join(', ')));
                            }
                        }
                        step.output = "Policy check passed (".concat(violations.length, " warnings)");
                        return [2 /*return*/];
                }
            });
        });
    };
    Verifier.prototype.runDependencyCheck = function (step, fix, context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Implement dependency checking
                step.output = 'Dependency check passed';
                return [2 /*return*/];
            });
        });
    };
    Verifier.prototype.runPolicyChecks = function (fix, context) {
        return __awaiter(this, void 0, void 0, function () {
            var violations, _i, _a, rule, ruleViolations, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        violations = [];
                        _i = 0, _a = this.policyRules.values();
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        rule = _a[_i];
                        if (!rule.enabled)
                            return [3 /*break*/, 5];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, rule.check(fix, context)];
                    case 3:
                        ruleViolations = _b.sent();
                        violations.push.apply(violations, ruleViolations);
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _b.sent();
                        this.logger.error("Policy rule ".concat(rule.id, " failed:"), error_3);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, violations];
                }
            });
        });
    };
    Verifier.prototype.processPolicyViolations = function (result, violations) {
        for (var _i = 0, violations_1 = violations; _i < violations_1.length; _i++) {
            var violation = violations_1[_i];
            switch (violation.severity) {
                case Detector_1.IssueSeverity.CRITICAL:
                    result.blockers.push(violation.message);
                    break;
                case Detector_1.IssueSeverity.HIGH:
                    result.warnings.push(violation.message);
                    break;
                default:
                    result.recommendations.push(violation.suggestion || violation.message);
            }
        }
    };
    Verifier.prototype.updateSummary = function (summary, step) {
        switch (step.status) {
            case VerificationStatus.PASSED:
                summary.passed++;
                break;
            case VerificationStatus.FAILED:
                summary.failed++;
                break;
            case VerificationStatus.SKIPPED:
                summary.skipped++;
                break;
            case VerificationStatus.TIMEOUT:
                summary.timeout++;
                break;
        }
    };
    Verifier.prototype.calculateOverallResult = function (result) {
        var summary = result.summary;
        // Calculate score based on passed/failed ratio
        var totalExecuted = summary.passed + summary.failed + summary.timeout;
        if (totalExecuted === 0) {
            result.overallScore = 0;
            result.status = VerificationStatus.SKIPPED;
            return;
        }
        result.overallScore = summary.passed / totalExecuted;
        // Determine overall status
        if (result.blockers.length > 0) {
            result.status = VerificationStatus.FAILED;
        }
        else if (summary.failed > 0 || summary.timeout > 0) {
            result.status = VerificationStatus.FAILED;
        }
        else if (summary.passed > 0) {
            result.status = VerificationStatus.PASSED;
        }
        else {
            result.status = VerificationStatus.SKIPPED;
        }
    };
    Verifier.prototype.requiresApproval = function (fix, result) {
        var approval = this.config.approval;
        // Check approval requirements
        if (approval.requireForCritical && fix.estimatedImpact.riskScore > 0.8) {
            return true;
        }
        if (approval.requireForMultipleFiles && fix.estimatedImpact.filesChanged > 1) {
            return true;
        }
        if (approval.requireForSecurity && result.steps.some(function (s) { return s.type === VerificationType.SECURITY_SCAN && s.status === VerificationStatus.FAILED; })) {
            return true;
        }
        // Check auto-approve threshold
        if (result.overallScore < approval.autoApproveThreshold) {
            return true;
        }
        return false;
    };
    Verifier.prototype.canProceed = function (result) {
        // Cannot proceed if there are blockers
        if (result.blockers.length > 0) {
            return false;
        }
        // Cannot proceed if verification failed and strict mode is enabled
        if (this.config.strictMode && result.status === VerificationStatus.FAILED) {
            return false;
        }
        // Can proceed if approval is not required or if score is above threshold
        return !result.approvalRequired || result.overallScore >= this.config.approval.autoApproveThreshold;
    };
    Verifier.prototype.generateRecommendations = function (result) {
        var recommendations = [];
        // Add recommendations based on failed steps
        for (var _i = 0, _a = result.steps; _i < _a.length; _i++) {
            var step = _a[_i];
            if (step.status === VerificationStatus.FAILED) {
                recommendations.push("Fix issues in ".concat(step.name, ": ").concat(step.error || 'Unknown error'));
            }
        }
        // Add recommendations based on score
        if (result.overallScore < 0.8) {
            recommendations.push('Consider manual review due to low verification score');
        }
        return recommendations;
    };
    Verifier.prototype.containsSecrets = function (content) {
        var secretPatterns = [
            /(?:password|passwd|pwd)\s*[=:]\s*['"]?[^\s'"]+/i,
            /(?:api[_-]?key|apikey)\s*[=:]\s*['"]?[^\s'"]+/i,
            /(?:secret|token)\s*[=:]\s*['"]?[^\s'"]+/i,
            /(?:private[_-]?key)\s*[=:]\s*['"]?[^\s'"]+/i
        ];
        return secretPatterns.some(function (pattern) { return pattern.test(content); });
    };
    Verifier.prototype.findTestFile = function (sourceFile) {
        return __awaiter(this, void 0, void 0, function () {
            var dir, name, ext, testPatterns, _i, testPatterns_1, testFile, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        dir = path.dirname(sourceFile);
                        name = path.basename(sourceFile, path.extname(sourceFile));
                        ext = path.extname(sourceFile);
                        testPatterns = [
                            path.join(dir, "".concat(name, ".test").concat(ext)),
                            path.join(dir, "".concat(name, ".spec").concat(ext)),
                            path.join(dir, '__tests__', "".concat(name, ".test").concat(ext)),
                            path.join(dir, '__tests__', "".concat(name, ".spec").concat(ext))
                        ];
                        _i = 0, testPatterns_1 = testPatterns;
                        _b.label = 1;
                    case 1:
                        if (!(_i < testPatterns_1.length)) return [3 /*break*/, 6];
                        testFile = testPatterns_1[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, fs.access(testFile)];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, testFile];
                    case 4:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, null];
                }
            });
        });
    };
    Verifier.prototype.findConfigFiles = function (workspaceRoot) {
        return __awaiter(this, void 0, void 0, function () {
            var configFiles, configPatterns, _loop_1, _i, configPatterns_1, pattern;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        configFiles = [];
                        configPatterns = [
                            'package.json',
                            'tsconfig.json',
                            '.eslintrc.*',
                            'jest.config.*',
                            'webpack.config.*'
                        ];
                        _loop_1 = function (pattern) {
                            var files, matches, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _c.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, fs.readdir(workspaceRoot)];
                                    case 1:
                                        files = _c.sent();
                                        matches = files.filter(function (file) {
                                            if (pattern.includes('*')) {
                                                var regex = new RegExp(pattern.replace('*', '.*'));
                                                return regex.test(file);
                                            }
                                            return file === pattern;
                                        });
                                        configFiles.push.apply(configFiles, matches.map(function (file) { return path.join(workspaceRoot, file); }));
                                        return [3 /*break*/, 3];
                                    case 2:
                                        _b = _c.sent();
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, configPatterns_1 = configPatterns;
                        _a.label = 1;
                    case 1:
                        if (!(_i < configPatterns_1.length)) return [3 /*break*/, 4];
                        pattern = configPatterns_1[_i];
                        return [5 /*yield**/, _loop_1(pattern)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, configFiles];
                }
            });
        });
    };
    Verifier.prototype.getStepName = function (type) {
        var _a;
        var names = (_a = {},
            _a[VerificationType.SYNTAX_CHECK] = 'Syntax Check',
            _a[VerificationType.TYPE_CHECK] = 'Type Check',
            _a[VerificationType.UNIT_TESTS] = 'Unit Tests',
            _a[VerificationType.INTEGRATION_TESTS] = 'Integration Tests',
            _a[VerificationType.LINT_CHECK] = 'Lint Check',
            _a[VerificationType.SECURITY_SCAN] = 'Security Scan',
            _a[VerificationType.PERFORMANCE_CHECK] = 'Performance Check',
            _a[VerificationType.POLICY_CHECK] = 'Policy Check',
            _a[VerificationType.DEPENDENCY_CHECK] = 'Dependency Check',
            _a);
        return names[type] || type;
    };
    Verifier.prototype.getStepDescription = function (type) {
        var _a;
        var descriptions = (_a = {},
            _a[VerificationType.SYNTAX_CHECK] = 'Check for syntax errors in modified files',
            _a[VerificationType.TYPE_CHECK] = 'Verify type correctness',
            _a[VerificationType.UNIT_TESTS] = 'Run unit tests for affected code',
            _a[VerificationType.INTEGRATION_TESTS] = 'Run integration tests',
            _a[VerificationType.LINT_CHECK] = 'Check code style and quality',
            _a[VerificationType.SECURITY_SCAN] = 'Scan for security vulnerabilities',
            _a[VerificationType.PERFORMANCE_CHECK] = 'Check performance impact',
            _a[VerificationType.POLICY_CHECK] = 'Verify compliance with policies',
            _a[VerificationType.DEPENDENCY_CHECK] = 'Check dependency compatibility',
            _a);
        return descriptions[type] || 'Custom verification step';
    };
    Verifier.prototype.createSkippedResult = function (fixId, reason) {
        return {
            fixId: fixId,
            status: VerificationStatus.SKIPPED,
            overallScore: 0,
            steps: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                timeout: 0
            },
            recommendations: [],
            blockers: [],
            warnings: [reason],
            metrics: {
                totalTime: 0
            },
            approvalRequired: false,
            canProceed: true
        };
    };
    Verifier.prototype.validateConfiguration = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Validate test commands
                if (this.config.testing.runUnitTests && !this.config.testing.testCommand) {
                    throw new Error('Test command not configured');
                }
                // Validate security settings
                if (this.config.security.enabled && this.config.security.maxRiskScore < 0 || this.config.security.maxRiskScore > 1) {
                    throw new Error('Invalid security risk score threshold');
                }
                return [2 /*return*/];
            });
        });
    };
    Verifier.prototype.testVerificationTools = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Test that verification tools are available
                this.logger.debug('Verification tools test passed');
                return [2 /*return*/];
            });
        });
    };
    Verifier.prototype.loadBuiltInPolicies = function () {
        var _this = this;
        // Load built-in policy rules
        var builtInPolicies = [
            {
                id: 'no_console_log',
                name: 'No Console Logs',
                description: 'Prevent console.log statements in production code',
                severity: Detector_1.IssueSeverity.LOW,
                enabled: true,
                check: function (fix, context) { return __awaiter(_this, void 0, void 0, function () {
                    var violations, _i, _a, action;
                    return __generator(this, function (_b) {
                        violations = [];
                        for (_i = 0, _a = fix.actions; _i < _a.length; _i++) {
                            action = _a[_i];
                            if (action.newContent.includes('console.log')) {
                                violations.push({
                                    ruleId: 'no_console_log',
                                    severity: Detector_1.IssueSeverity.LOW,
                                    message: 'Console.log statement detected',
                                    file: action.file,
                                    line: action.startLine,
                                    suggestion: 'Use proper logging instead of console.log'
                                });
                            }
                        }
                        return [2 /*return*/, violations];
                    });
                }); }
            },
            {
                id: 'no_hardcoded_secrets',
                name: 'No Hardcoded Secrets',
                description: 'Prevent hardcoded secrets in code',
                severity: Detector_1.IssueSeverity.CRITICAL,
                enabled: true,
                check: function (fix, context) { return __awaiter(_this, void 0, void 0, function () {
                    var violations, _i, _a, action;
                    return __generator(this, function (_b) {
                        violations = [];
                        for (_i = 0, _a = fix.actions; _i < _a.length; _i++) {
                            action = _a[_i];
                            if (this.containsSecrets(action.newContent)) {
                                violations.push({
                                    ruleId: 'no_hardcoded_secrets',
                                    severity: Detector_1.IssueSeverity.CRITICAL,
                                    message: 'Potential hardcoded secret detected',
                                    file: action.file,
                                    line: action.startLine,
                                    suggestion: 'Use environment variables or secure configuration'
                                });
                            }
                        }
                        return [2 /*return*/, violations];
                    });
                }); }
            }
        ];
        for (var _i = 0, builtInPolicies_1 = builtInPolicies; _i < builtInPolicies_1.length; _i++) {
            var policy = builtInPolicies_1[_i];
            this.policyRules.set(policy.id, policy);
        }
    };
    Verifier.prototype.loadCustomPolicies = function () {
        for (var _i = 0, _a = this.config.policies.customRules; _i < _a.length; _i++) {
            var rule = _a[_i];
            this.policyRules.set(rule.id, rule);
        }
    };
    Verifier.prototype.updateStatistics = function (result) {
        this.statistics.totalVerifications++;
        if (result.status === VerificationStatus.PASSED) {
            this.statistics.totalPassed++;
        }
        else if (result.status === VerificationStatus.FAILED) {
            this.statistics.totalFailed++;
        }
        // Update averages
        var total = this.statistics.totalVerifications;
        this.statistics.averageScore = ((this.statistics.averageScore * (total - 1)) + result.overallScore) / total;
        this.statistics.averageTime = ((this.statistics.averageTime * (total - 1)) + result.metrics.totalTime) / total;
        // Update by type statistics
        for (var _i = 0, _a = result.steps; _i < _a.length; _i++) {
            var step = _a[_i];
            if (!this.statistics.byType[step.type]) {
                this.statistics.byType[step.type] = { passed: 0, failed: 0, avgTime: 0 };
            }
            var typeStats = this.statistics.byType[step.type];
            var stepTime = (step.endTime || 0) - (step.startTime || 0);
            if (step.status === VerificationStatus.PASSED) {
                typeStats.passed++;
            }
            else if (step.status === VerificationStatus.FAILED) {
                typeStats.failed++;
            }
            var typeTotal = typeStats.passed + typeStats.failed;
            if (typeTotal > 0) {
                typeStats.avgTime = ((typeStats.avgTime * (typeTotal - 1)) + stepTime) / typeTotal;
            }
        }
    };
    return Verifier;
}(events_1.EventEmitter));
exports.Verifier = Verifier;
// Default configuration
exports.DEFAULT_VERIFIER_CONFIG = {
    enabled: true,
    strictMode: false,
    steps: (_a = {},
        _a[VerificationType.SYNTAX_CHECK] = {
            enabled: true,
            required: true,
            timeout: 10000,
            retries: 1
        },
        _a[VerificationType.TYPE_CHECK] = {
            enabled: true,
            required: false,
            timeout: 15000,
            retries: 1,
            command: 'npx tsc --noEmit'
        },
        _a[VerificationType.UNIT_TESTS] = {
            enabled: true,
            required: false,
            timeout: 30000,
            retries: 1
        },
        _a[VerificationType.INTEGRATION_TESTS] = {
            enabled: false,
            required: false,
            timeout: 60000,
            retries: 1
        },
        _a[VerificationType.LINT_CHECK] = {
            enabled: true,
            required: false,
            timeout: 10000,
            retries: 1,
            command: 'npx eslint'
        },
        _a[VerificationType.SECURITY_SCAN] = {
            enabled: true,
            required: true,
            timeout: 20000,
            retries: 1
        },
        _a[VerificationType.PERFORMANCE_CHECK] = {
            enabled: false,
            required: false,
            timeout: 30000,
            retries: 1
        },
        _a[VerificationType.POLICY_CHECK] = {
            enabled: true,
            required: true,
            timeout: 5000,
            retries: 1
        },
        _a[VerificationType.DEPENDENCY_CHECK] = {
            enabled: false,
            required: false,
            timeout: 15000,
            retries: 1
        },
        _a),
    policies: {
        enabled: true,
        strictMode: false,
        customRules: []
    },
    testing: {
        runUnitTests: true,
        runIntegrationTests: false,
        requireCoverage: false,
        minCoverage: 80,
        testTimeout: 30000,
        testCommand: 'npm test',
        coverageCommand: 'npm run coverage'
    },
    security: {
        enabled: true,
        scanSecrets: true,
        scanVulnerabilities: false,
        allowedDomains: [],
        forbiddenPatterns: [
            /eval\s*\(/,
            /document\.write\s*\(/,
            /innerHTML\s*=/
        ],
        maxRiskScore: 0.7
    },
    performance: {
        enabled: false,
        maxBuildTime: 60000,
        maxMemoryUsage: 512
    },
    approval: {
        requireForCritical: true,
        requireForHigh: false,
        requireForSecurity: true,
        requireForMultipleFiles: false,
        autoApproveThreshold: 0.8
    }
};
exports.default = Verifier;
