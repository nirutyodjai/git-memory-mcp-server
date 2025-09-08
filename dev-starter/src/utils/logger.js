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
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLogger = exports.Logger = exports.LogLevel = void 0;
exports.createLogger = createLogger;
/**
 * Logger utility for the MCP system
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Simple logger implementation
 */
var Logger = /** @class */ (function () {
    function Logger(component) {
        this.component = component;
    }
    /**
     * Configure global logger settings
     */
    Logger.configure = function (config) {
        Logger.globalConfig = __assign(__assign({}, Logger.globalConfig), config);
    };
    /**
     * Get recent log entries
     */
    Logger.getRecentLogs = function (count) {
        if (count === void 0) { count = 100; }
        return Logger.logs.slice(-count);
    };
    /**
     * Clear log history
     */
    Logger.clearLogs = function () {
        Logger.logs = [];
    };
    /**
     * Log debug message
     */
    Logger.prototype.debug = function (message, data) {
        this.log(LogLevel.DEBUG, message, data);
    };
    /**
     * Log info message
     */
    Logger.prototype.info = function (message, data) {
        this.log(LogLevel.INFO, message, data);
    };
    /**
     * Log warning message
     */
    Logger.prototype.warn = function (message, data) {
        this.log(LogLevel.WARN, message, data);
    };
    /**
     * Log error message
     */
    Logger.prototype.error = function (message, error) {
        this.log(LogLevel.ERROR, message, undefined, error instanceof Error ? error : undefined);
    };
    /**
     * Internal log method
     */
    Logger.prototype.log = function (level, message, data, error) {
        if (level < Logger.globalConfig.level) {
            return;
        }
        var entry = {
            timestamp: new Date(),
            level: level,
            component: this.component,
            message: message,
            data: data,
            error: error
        };
        // Add to history
        Logger.logs.push(entry);
        if (Logger.logs.length > Logger.maxLogHistory) {
            Logger.logs = Logger.logs.slice(-Logger.maxLogHistory / 2);
        }
        // Console output
        if (Logger.globalConfig.enableConsole) {
            this.outputToConsole(entry);
        }
        // File output (simplified - in production you'd use a proper file logger)
        if (Logger.globalConfig.enableFile) {
            this.outputToFile(entry);
        }
    };
    /**
     * Output log entry to console
     */
    Logger.prototype.outputToConsole = function (entry) {
        var _a;
        var timestamp = entry.timestamp.toISOString();
        var levelName = LogLevel[entry.level];
        var prefix = "[".concat(timestamp, "] [").concat(levelName, "] [").concat(entry.component, "]");
        var message = "".concat(prefix, " ").concat(entry.message);
        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(message, entry.data || '');
                break;
            case LogLevel.INFO:
                console.info(message, entry.data || '');
                break;
            case LogLevel.WARN:
                console.warn(message, entry.data || '');
                break;
            case LogLevel.ERROR:
                console.error(message, entry.error || entry.data || '');
                if ((_a = entry.error) === null || _a === void 0 ? void 0 : _a.stack) {
                    console.error(entry.error.stack);
                }
                break;
        }
    };
    /**
     * Output log entry to file (placeholder implementation)
     */
    Logger.prototype.outputToFile = function (entry) {
        // In a real implementation, you would write to a file
        // For now, we'll just store it in memory
        // You could integrate with libraries like winston, pino, etc.
    };
    /**
     * Create a child logger with additional context
     */
    Logger.prototype.child = function (context) {
        return new Logger("".concat(this.component, ":").concat(context));
    };
    /**
     * Check if a log level is enabled
     */
    Logger.prototype.isLevelEnabled = function (level) {
        return level >= Logger.globalConfig.level;
    };
    /**
     * Time a function execution
     */
    Logger.prototype.time = function (label, fn) {
        return __awaiter(this, void 0, void 0, function () {
            var start, result, duration, error_1, duration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        start = Date.now();
                        this.debug("Starting ".concat(label));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fn()];
                    case 2:
                        result = _a.sent();
                        duration = Date.now() - start;
                        this.info("Completed ".concat(label, " in ").concat(duration, "ms"));
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        duration = Date.now() - start;
                        this.error("Failed ".concat(label, " after ").concat(duration, "ms"), error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Time a synchronous function execution
     */
    Logger.prototype.timeSync = function (label, fn) {
        var start = Date.now();
        this.debug("Starting ".concat(label));
        try {
            var result = fn();
            var duration = Date.now() - start;
            this.info("Completed ".concat(label, " in ").concat(duration, "ms"));
            return result;
        }
        catch (error) {
            var duration = Date.now() - start;
            this.error("Failed ".concat(label, " after ").concat(duration, "ms"), error);
            throw error;
        }
    };
    Logger.globalConfig = {
        level: LogLevel.INFO,
        enableConsole: true,
        enableFile: false,
        format: 'text'
    };
    Logger.logs = [];
    Logger.maxLogHistory = 1000;
    return Logger;
}());
exports.Logger = Logger;
/**
 * Create a logger instance
 */
function createLogger(component) {
    return new Logger(component);
}
/**
 * Default logger instance
 */
exports.defaultLogger = new Logger('MCP');
exports.default = Logger;
