"use strict";
'use client';
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringProvider = MonitoringProvider;
exports.useMonitoring = useMonitoring;
const react_1 = __importStar(require("react"));
const performance_1 = require("@/lib/monitoring/performance");
const error_tracking_1 = require("@/lib/monitoring/error-tracking");
const logging_1 = require("@/lib/monitoring/logging");
const initialState = {
    isMonitoring: false,
    performanceMetrics: null,
    errors: [],
    logs: [],
    webVitalsScore: 0,
    totalErrors: 0,
    avgLoadTime: 0,
    memoryUsage: 0,
};
function monitoringReducer(state, action) {
    switch (action.type) {
        case 'START_MONITORING':
            return { ...state, isMonitoring: true };
        case 'STOP_MONITORING':
            return { ...state, isMonitoring: false };
        case 'UPDATE_PERFORMANCE':
            return { ...state, performanceMetrics: action.payload };
        case 'ADD_ERROR':
            return {
                ...state,
                errors: [action.payload, ...state.errors].slice(0, 100), // Keep last 100 errors
                totalErrors: state.totalErrors + 1,
            };
        case 'ADD_LOG':
            return {
                ...state,
                logs: [action.payload, ...state.logs].slice(0, 500), // Keep last 500 logs
            };
        case 'CLEAR_ERRORS':
            return { ...state, errors: [] };
        case 'CLEAR_LOGS':
            return { ...state, logs: [] };
        case 'UPDATE_STATS':
            return {
                ...state,
                webVitalsScore: action.payload.webVitalsScore,
                totalErrors: action.payload.totalErrors,
                avgLoadTime: action.payload.avgLoadTime,
                memoryUsage: action.payload.memoryUsage,
            };
        default:
            return state;
    }
}
const MonitoringContext = (0, react_1.createContext)(undefined);
function MonitoringProvider({ children }) {
    const [state, dispatch] = (0, react_1.useReducer)(monitoringReducer, initialState);
    // Initialize monitoring services
    const performanceMonitor = react_1.default.useMemo(() => new performance_1.PerformanceMonitor(), []);
    const errorTracker = react_1.default.useMemo(() => new error_tracking_1.ErrorTracker({
        apiEndpoint: '/api/errors',
        enableConsoleLog: true,
        enableBreadcrumbs: true,
        maxBreadcrumbs: 50,
    }), []);
    const logger = react_1.default.useMemo(() => new logging_1.Logger({
        level: 'info',
        enableConsole: true,
        enableLocalStorage: true,
        maxEntries: 1000,
    }), []);
    const startMonitoring = () => {
        dispatch({ type: 'START_MONITORING' });
        // Start performance monitoring
        performanceMonitor.startMonitoring();
        // Start error tracking
        errorTracker.init();
        // Set up event listeners
        const handlePerformanceUpdate = (metrics) => {
            dispatch({ type: 'UPDATE_PERFORMANCE', payload: metrics });
            // Calculate Web Vitals score
            const score = calculateWebVitalsScore(metrics);
            const avgLoadTime = metrics.customMetrics?.pageLoadTime || 0;
            const memoryUsage = metrics.customMetrics?.memoryUsage || 0;
            dispatch({
                type: 'UPDATE_STATS',
                payload: {
                    webVitalsScore: score,
                    totalErrors: state.totalErrors,
                    avgLoadTime,
                    memoryUsage,
                },
            });
        };
        const handleError = (error) => {
            dispatch({ type: 'ADD_ERROR', payload: error });
            logger.error('Application Error', { error });
        };
        const handleLog = (log) => {
            dispatch({ type: 'ADD_LOG', payload: log });
        };
        // Set up periodic updates
        const performanceInterval = setInterval(() => {
            const metrics = performanceMonitor.getMetrics();
            if (metrics) {
                handlePerformanceUpdate(metrics);
            }
        }, 5000);
        const errorInterval = setInterval(() => {
            const errors = errorTracker.getErrors();
            errors.forEach(error => {
                if (!state.errors.find(e => e.id === error.id)) {
                    handleError(error);
                }
            });
        }, 1000);
        const logInterval = setInterval(() => {
            const logs = logger.getLogs();
            logs.forEach(log => {
                if (!state.logs.find(l => l.id === log.id)) {
                    handleLog(log);
                }
            });
        }, 1000);
        // Store intervals for cleanup
        window.__monitoringIntervals = {
            performance: performanceInterval,
            error: errorInterval,
            log: logInterval,
        };
    };
    const stopMonitoring = () => {
        dispatch({ type: 'STOP_MONITORING' });
        // Clear intervals
        const intervals = window.__monitoringIntervals;
        if (intervals) {
            clearInterval(intervals.performance);
            clearInterval(intervals.error);
            clearInterval(intervals.log);
            delete window.__monitoringIntervals;
        }
    };
    const clearErrors = () => {
        dispatch({ type: 'CLEAR_ERRORS' });
        errorTracker.clearErrors();
    };
    const clearLogs = () => {
        dispatch({ type: 'CLEAR_LOGS' });
        logger.clear();
    };
    const exportLogs = () => {
        const logs = logger.exportLogs();
        const blob = new Blob([logs], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    // Cleanup on unmount
    (0, react_1.useEffect)(() => {
        return () => {
            stopMonitoring();
        };
    }, []);
    const value = {
        state,
        startMonitoring,
        stopMonitoring,
        clearErrors,
        clearLogs,
        exportLogs,
        performanceMonitor,
        errorTracker,
        logger,
    };
    return (<MonitoringContext.Provider value={value}>
      {children}
    </MonitoringContext.Provider>);
}
function useMonitoring() {
    const context = (0, react_1.useContext)(MonitoringContext);
    if (context === undefined) {
        throw new Error('useMonitoring must be used within a MonitoringProvider');
    }
    return context;
}
// Helper function to calculate Web Vitals score
function calculateWebVitalsScore(metrics) {
    const { lcp, fid, cls, fcp, ttfb } = metrics;
    let score = 0;
    let count = 0;
    // LCP (Largest Contentful Paint)
    if (lcp !== undefined) {
        if (lcp <= 2500)
            score += 100;
        else if (lcp <= 4000)
            score += 75;
        else
            score += 50;
        count++;
    }
    // FID (First Input Delay)
    if (fid !== undefined) {
        if (fid <= 100)
            score += 100;
        else if (fid <= 300)
            score += 75;
        else
            score += 50;
        count++;
    }
    // CLS (Cumulative Layout Shift)
    if (cls !== undefined) {
        if (cls <= 0.1)
            score += 100;
        else if (cls <= 0.25)
            score += 75;
        else
            score += 50;
        count++;
    }
    // FCP (First Contentful Paint)
    if (fcp !== undefined) {
        if (fcp <= 1800)
            score += 100;
        else if (fcp <= 3000)
            score += 75;
        else
            score += 50;
        count++;
    }
    // TTFB (Time to First Byte)
    if (ttfb !== undefined) {
        if (ttfb <= 800)
            score += 100;
        else if (ttfb <= 1800)
            score += 75;
        else
            score += 50;
        count++;
    }
    return count > 0 ? Math.round(score / count) : 0;
}
//# sourceMappingURL=monitoring-provider.js.map