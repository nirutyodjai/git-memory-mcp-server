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
exports.MonitoringDashboard = MonitoringDashboard;
const react_1 = __importStar(require("react"));
const card_1 = require("@/components/ui/card");
const tabs_1 = require("@/components/ui/tabs");
const badge_1 = require("@/components/ui/badge");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const select_1 = require("@/components/ui/select");
const react_i18next_1 = require("react-i18next");
const performance_1 = require("@/lib/monitoring/performance");
const error_tracking_1 = require("@/lib/monitoring/error-tracking");
const logging_1 = require("@/lib/monitoring/logging");
const recharts_1 = require("recharts");
const lucide_react_1 = require("lucide-react");
// Log level colors
const LOG_LEVEL_COLORS = {
    debug: '#6b7280',
    info: '#3b82f6',
    warn: '#f59e0b',
    error: '#ef4444',
    fatal: '#dc2626',
};
// Error severity colors
const ERROR_SEVERITY_COLORS = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
};
// Performance score colors
const getPerformanceScoreColor = (score) => {
    if (score >= 90)
        return '#10b981'; // Green
    if (score >= 70)
        return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
};
// Format duration
const formatDuration = (ms) => {
    if (ms < 1000)
        return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
};
// Format bytes
const formatBytes = (bytes) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0)
        return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};
function MonitoringDashboard() {
    const { t } = (0, react_i18next_1.useTranslation)();
    const { metrics, webVitals, customMetrics, startMonitoring, stopMonitoring } = (0, performance_1.usePerformanceMonitor)();
    const { errors, stats: errorStats, resolveError, clearErrors } = (0, error_tracking_1.useErrorTracking)();
    const { logs, stats: logStats, clearLogs, exportLogs } = (0, logging_1.useLogger)();
    const [activeTab, setActiveTab] = (0, react_1.useState)('overview');
    const [isMonitoring, setIsMonitoring] = (0, react_1.useState)(false);
    const [errorFilter, setErrorFilter] = (0, react_1.useState)({});
    const [logFilter, setLogFilter] = (0, react_1.useState)({});
    // Start/stop monitoring
    const toggleMonitoring = () => {
        if (isMonitoring) {
            stopMonitoring();
        }
        else {
            startMonitoring();
        }
        setIsMonitoring(!isMonitoring);
    };
    // Filter errors
    const filteredErrors = errors.filter(error => {
        if (errorFilter.severity && error.severity !== errorFilter.severity)
            return false;
        if (errorFilter.category && error.category !== errorFilter.category)
            return false;
        if (errorFilter.resolved !== undefined && error.resolved !== errorFilter.resolved)
            return false;
        return true;
    });
    // Filter logs
    const filteredLogs = logs.filter(log => {
        if (logFilter.level && log.level !== logFilter.level)
            return false;
        if (logFilter.search && !log.message.toLowerCase().includes(logFilter.search.toLowerCase()))
            return false;
        return true;
    });
    // Generate performance chart data
    const performanceChartData = customMetrics.map((metric, index) => ({
        timestamp: Date.now() - (customMetrics.length - index) * 1000,
        value: metric.pageLoadTime || 0,
        label: new Date(Date.now() - (customMetrics.length - index) * 1000).toLocaleTimeString(),
    }));
    // Generate error trend data
    const errorTrendData = [];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    }).reverse();
    last7Days.forEach(date => {
        const dayStart = new Date(date).getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        const dayErrors = errors.filter(error => error.timestamp >= dayStart && error.timestamp < dayEnd);
        const resolvedErrors = dayErrors.filter(error => error.resolved);
        errorTrendData.push({
            date,
            errors: dayErrors.length,
            resolved: resolvedErrors.length,
        });
    });
    // Web Vitals score
    const webVitalsScore = webVitals.length > 0 ?
        Math.round(webVitals.reduce((sum, vital) => sum + (vital.value || 0), 0) / webVitals.length) : 0;
    return (react_1.default.createElement("div", { className: "space-y-6" },
        react_1.default.createElement("div", { className: "flex items-center justify-between" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h1", { className: "text-3xl font-bold" }, t('monitoring.title')),
                react_1.default.createElement("p", { className: "text-muted-foreground" }, t('monitoring.description'))),
            react_1.default.createElement("div", { className: "flex items-center gap-2" },
                react_1.default.createElement(button_1.Button, { variant: isMonitoring ? 'destructive' : 'default', onClick: toggleMonitoring, className: "flex items-center gap-2" },
                    isMonitoring ? react_1.default.createElement(lucide_react_1.XCircle, { className: "h-4 w-4" }) : react_1.default.createElement(lucide_react_1.Activity, { className: "h-4 w-4" }),
                    isMonitoring ? t('monitoring.stop') : t('monitoring.start')),
                react_1.default.createElement(button_1.Button, { variant: "outline", onClick: () => window.location.reload() },
                    react_1.default.createElement(lucide_react_1.RefreshCw, { className: "h-4 w-4" })))),
        react_1.default.createElement(tabs_1.Tabs, { value: activeTab, onValueChange: setActiveTab },
            react_1.default.createElement(tabs_1.TabsList, { className: "grid w-full grid-cols-4" },
                react_1.default.createElement(tabs_1.TabsTrigger, { value: "overview" }, t('monitoring.overview')),
                react_1.default.createElement(tabs_1.TabsTrigger, { value: "performance" }, t('monitoring.performance')),
                react_1.default.createElement(tabs_1.TabsTrigger, { value: "errors" }, t('monitoring.errors')),
                react_1.default.createElement(tabs_1.TabsTrigger, { value: "logs" }, t('monitoring.logs'))),
            react_1.default.createElement(tabs_1.TabsContent, { value: "overview", className: "space-y-6" },
                react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" },
                    react_1.default.createElement(card_1.Card, null,
                        react_1.default.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
                            react_1.default.createElement(card_1.CardTitle, { className: "text-sm font-medium" }, t('monitoring.webVitalsScore')),
                            react_1.default.createElement(lucide_react_1.TrendingUp, { className: "h-4 w-4 text-muted-foreground" })),
                        react_1.default.createElement(card_1.CardContent, null,
                            react_1.default.createElement("div", { className: "text-2xl font-bold", style: { color: getPerformanceScoreColor(webVitalsScore) } }, webVitalsScore),
                            react_1.default.createElement("p", { className: "text-xs text-muted-foreground" }, webVitalsScore >= 90 ? t('monitoring.excellent') :
                                webVitalsScore >= 70 ? t('monitoring.good') : t('monitoring.needsImprovement')))),
                    react_1.default.createElement(card_1.Card, null,
                        react_1.default.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
                            react_1.default.createElement(card_1.CardTitle, { className: "text-sm font-medium" }, t('monitoring.totalErrors')),
                            react_1.default.createElement(lucide_react_1.Bug, { className: "h-4 w-4 text-muted-foreground" })),
                        react_1.default.createElement(card_1.CardContent, null,
                            react_1.default.createElement("div", { className: "text-2xl font-bold text-red-600" }, errorStats.totalErrors),
                            react_1.default.createElement("p", { className: "text-xs text-muted-foreground" },
                                errorStats.unresolvedErrors,
                                " ",
                                t('monitoring.unresolved')))),
                    react_1.default.createElement(card_1.Card, null,
                        react_1.default.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
                            react_1.default.createElement(card_1.CardTitle, { className: "text-sm font-medium" }, t('monitoring.avgLoadTime')),
                            react_1.default.createElement(lucide_react_1.Clock, { className: "h-4 w-4 text-muted-foreground" })),
                        react_1.default.createElement(card_1.CardContent, null,
                            react_1.default.createElement("div", { className: "text-2xl font-bold" }, customMetrics.length > 0 ?
                                formatDuration(customMetrics.reduce((sum, m) => sum + (m.pageLoadTime || 0), 0) / customMetrics.length) :
                                '0ms'),
                            react_1.default.createElement("p", { className: "text-xs text-muted-foreground" }, t('monitoring.last24Hours')))),
                    react_1.default.createElement(card_1.Card, null,
                        react_1.default.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
                            react_1.default.createElement(card_1.CardTitle, { className: "text-sm font-medium" }, t('monitoring.memoryUsage')),
                            react_1.default.createElement(lucide_react_1.Zap, { className: "h-4 w-4 text-muted-foreground" })),
                        react_1.default.createElement(card_1.CardContent, null,
                            react_1.default.createElement("div", { className: "text-2xl font-bold" }, customMetrics.length > 0 && customMetrics[customMetrics.length - 1].memoryUsage ?
                                formatBytes(customMetrics[customMetrics.length - 1].memoryUsage) :
                                'N/A'),
                            react_1.default.createElement("p", { className: "text-xs text-muted-foreground" }, t('monitoring.current'))))),
                react_1.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
                    react_1.default.createElement(card_1.Card, null,
                        react_1.default.createElement(card_1.CardHeader, null,
                            react_1.default.createElement(card_1.CardTitle, null, t('monitoring.performanceTrend')),
                            react_1.default.createElement(card_1.CardDescription, null, t('monitoring.pageLoadTimes'))),
                        react_1.default.createElement(card_1.CardContent, null,
                            react_1.default.createElement(recharts_1.ResponsiveContainer, { width: "100%", height: 300 },
                                react_1.default.createElement(recharts_1.LineChart, { data: performanceChartData },
                                    react_1.default.createElement(recharts_1.CartesianGrid, { strokeDasharray: "3 3" }),
                                    react_1.default.createElement(recharts_1.XAxis, { dataKey: "label" }),
                                    react_1.default.createElement(recharts_1.YAxis, null),
                                    react_1.default.createElement(recharts_1.Tooltip, { formatter: (value) => [formatDuration(value), t('monitoring.loadTime')] }),
                                    react_1.default.createElement(recharts_1.Line, { type: "monotone", dataKey: "value", stroke: "#3b82f6", strokeWidth: 2 }))))),
                    react_1.default.createElement(card_1.Card, null,
                        react_1.default.createElement(card_1.CardHeader, null,
                            react_1.default.createElement(card_1.CardTitle, null, t('monitoring.errorTrend')),
                            react_1.default.createElement(card_1.CardDescription, null, t('monitoring.last7Days'))),
                        react_1.default.createElement(card_1.CardContent, null,
                            react_1.default.createElement(recharts_1.ResponsiveContainer, { width: "100%", height: 300 },
                                react_1.default.createElement(recharts_1.AreaChart, { data: errorTrendData },
                                    react_1.default.createElement(recharts_1.CartesianGrid, { strokeDasharray: "3 3" }),
                                    react_1.default.createElement(recharts_1.XAxis, { dataKey: "date" }),
                                    react_1.default.createElement(recharts_1.YAxis, null),
                                    react_1.default.createElement(recharts_1.Tooltip, null),
                                    react_1.default.createElement(recharts_1.Area, { type: "monotone", dataKey: "errors", stackId: "1", stroke: "#ef4444", fill: "#ef4444", fillOpacity: 0.6 }),
                                    react_1.default.createElement(recharts_1.Area, { type: "monotone", dataKey: "resolved", stackId: "1", stroke: "#10b981", fill: "#10b981", fillOpacity: 0.6 }))))))),
            react_1.default.createElement(tabs_1.TabsContent, { value: "performance", className: "space-y-6" },
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null, t('monitoring.webVitals')),
                        react_1.default.createElement(card_1.CardDescription, null, t('monitoring.coreWebVitals'))),
                    react_1.default.createElement(card_1.CardContent, null,
                        react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" }, webVitals.map((vital, index) => (react_1.default.createElement("div", { key: index, className: "p-4 border rounded-lg" },
                            react_1.default.createElement("div", { className: "flex items-center justify-between mb-2" },
                                react_1.default.createElement("span", { className: "font-medium" }, vital.name),
                                react_1.default.createElement(badge_1.Badge, { variant: vital.rating === 'good' ? 'default' : vital.rating === 'needs-improvement' ? 'secondary' : 'destructive' }, vital.rating)),
                            react_1.default.createElement("div", { className: "text-2xl font-bold" }, vital.name === 'CLS' ? vital.value?.toFixed(3) : formatDuration(vital.value || 0)))))))),
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null, t('monitoring.performanceMetrics'))),
                    react_1.default.createElement(card_1.CardContent, null,
                        react_1.default.createElement("div", { className: "space-y-4" }, customMetrics.slice(-5).map((metric, index) => (react_1.default.createElement("div", { key: index, className: "grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg" },
                            react_1.default.createElement("div", null,
                                react_1.default.createElement("span", { className: "text-sm text-muted-foreground" }, t('monitoring.pageLoad')),
                                react_1.default.createElement("div", { className: "font-medium" }, formatDuration(metric.pageLoadTime || 0))),
                            react_1.default.createElement("div", null,
                                react_1.default.createElement("span", { className: "text-sm text-muted-foreground" }, t('monitoring.domContentLoaded')),
                                react_1.default.createElement("div", { className: "font-medium" }, formatDuration(metric.domContentLoadedTime || 0))),
                            react_1.default.createElement("div", null,
                                react_1.default.createElement("span", { className: "text-sm text-muted-foreground" }, t('monitoring.resourceLoad')),
                                react_1.default.createElement("div", { className: "font-medium" }, formatDuration(metric.resourceLoadTime || 0))),
                            react_1.default.createElement("div", null,
                                react_1.default.createElement("span", { className: "text-sm text-muted-foreground" }, t('monitoring.memory')),
                                react_1.default.createElement("div", { className: "font-medium" }, metric.memoryUsage ? formatBytes(metric.memoryUsage) : 'N/A'))))))))),
            react_1.default.createElement(tabs_1.TabsContent, { value: "errors", className: "space-y-6" },
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null, t('monitoring.errorFilters'))),
                    react_1.default.createElement(card_1.CardContent, null,
                        react_1.default.createElement("div", { className: "flex flex-wrap gap-4" },
                            react_1.default.createElement(select_1.Select, { value: errorFilter.severity || '', onValueChange: (value) => setErrorFilter(prev => ({ ...prev, severity: value || undefined })) },
                                react_1.default.createElement(select_1.SelectTrigger, { className: "w-40" },
                                    react_1.default.createElement(select_1.SelectValue, { placeholder: t('monitoring.severity') })),
                                react_1.default.createElement(select_1.SelectContent, null,
                                    react_1.default.createElement(select_1.SelectItem, { value: "" }, t('monitoring.all')),
                                    react_1.default.createElement(select_1.SelectItem, { value: "low" }, t('monitoring.low')),
                                    react_1.default.createElement(select_1.SelectItem, { value: "medium" }, t('monitoring.medium')),
                                    react_1.default.createElement(select_1.SelectItem, { value: "high" }, t('monitoring.high')),
                                    react_1.default.createElement(select_1.SelectItem, { value: "critical" }, t('monitoring.critical')))),
                            react_1.default.createElement(select_1.Select, { value: errorFilter.category || '', onValueChange: (value) => setErrorFilter(prev => ({ ...prev, category: value || undefined })) },
                                react_1.default.createElement(select_1.SelectTrigger, { className: "w-40" },
                                    react_1.default.createElement(select_1.SelectValue, { placeholder: t('monitoring.category') })),
                                react_1.default.createElement(select_1.SelectContent, null,
                                    react_1.default.createElement(select_1.SelectItem, { value: "" }, t('monitoring.all')),
                                    react_1.default.createElement(select_1.SelectItem, { value: "javascript" }, "JavaScript"),
                                    react_1.default.createElement(select_1.SelectItem, { value: "network" }, "Network"),
                                    react_1.default.createElement(select_1.SelectItem, { value: "resource" }, "Resource"),
                                    react_1.default.createElement(select_1.SelectItem, { value: "api" }, "API"))),
                            react_1.default.createElement(select_1.Select, { value: errorFilter.resolved?.toString() || '', onValueChange: (value) => setErrorFilter(prev => ({ ...prev, resolved: value === '' ? undefined : value === 'true' })) },
                                react_1.default.createElement(select_1.SelectTrigger, { className: "w-40" },
                                    react_1.default.createElement(select_1.SelectValue, { placeholder: t('monitoring.status') })),
                                react_1.default.createElement(select_1.SelectContent, null,
                                    react_1.default.createElement(select_1.SelectItem, { value: "" }, t('monitoring.all')),
                                    react_1.default.createElement(select_1.SelectItem, { value: "false" }, t('monitoring.unresolved')),
                                    react_1.default.createElement(select_1.SelectItem, { value: "true" }, t('monitoring.resolved')))),
                            react_1.default.createElement(button_1.Button, { variant: "outline", onClick: () => setErrorFilter({}) }, t('monitoring.clearFilters')),
                            react_1.default.createElement(button_1.Button, { variant: "outline", onClick: clearErrors }, t('monitoring.clearErrors'))))),
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null,
                            t('monitoring.errorList'),
                            " (",
                            filteredErrors.length,
                            ")")),
                    react_1.default.createElement(card_1.CardContent, null,
                        react_1.default.createElement("div", { className: "space-y-4" },
                            filteredErrors.map((error) => (react_1.default.createElement("div", { key: error.id, className: "p-4 border rounded-lg" },
                                react_1.default.createElement("div", { className: "flex items-start justify-between mb-2" },
                                    react_1.default.createElement("div", { className: "flex items-center gap-2" },
                                        react_1.default.createElement(badge_1.Badge, { variant: "outline", style: { borderColor: ERROR_SEVERITY_COLORS[error.severity], color: ERROR_SEVERITY_COLORS[error.severity] } }, error.severity),
                                        react_1.default.createElement(badge_1.Badge, { variant: "secondary" }, error.category),
                                        error.resolved && react_1.default.createElement(badge_1.Badge, { variant: "default" }, "Resolved")),
                                    react_1.default.createElement("div", { className: "flex items-center gap-2" },
                                        !error.resolved && (react_1.default.createElement(button_1.Button, { size: "sm", variant: "outline", onClick: () => resolveError(error.id) },
                                            react_1.default.createElement(lucide_react_1.CheckCircle, { className: "h-4 w-4" }))),
                                        react_1.default.createElement("span", { className: "text-sm text-muted-foreground" }, new Date(error.timestamp).toLocaleString()))),
                                react_1.default.createElement("div", { className: "font-medium mb-2" }, error.message),
                                error.filename && (react_1.default.createElement("div", { className: "text-sm text-muted-foreground mb-2" },
                                    error.filename,
                                    ":",
                                    error.lineno,
                                    ":",
                                    error.colno)),
                                error.count && error.count > 1 && (react_1.default.createElement("div", { className: "text-sm text-muted-foreground" },
                                    "Occurred ",
                                    error.count,
                                    " times"))))),
                            filteredErrors.length === 0 && (react_1.default.createElement("div", { className: "text-center py-8 text-muted-foreground" }, t('monitoring.noErrors'))))))),
            react_1.default.createElement(tabs_1.TabsContent, { value: "logs", className: "space-y-6" },
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null, t('monitoring.logFilters'))),
                    react_1.default.createElement(card_1.CardContent, null,
                        react_1.default.createElement("div", { className: "flex flex-wrap gap-4" },
                            react_1.default.createElement("div", { className: "flex items-center gap-2" },
                                react_1.default.createElement(lucide_react_1.Search, { className: "h-4 w-4" }),
                                react_1.default.createElement(input_1.Input, { placeholder: t('monitoring.searchLogs'), value: logFilter.search || '', onChange: (e) => setLogFilter(prev => ({ ...prev, search: e.target.value || undefined })), className: "w-64" })),
                            react_1.default.createElement(select_1.Select, { value: logFilter.level || '', onValueChange: (value) => setLogFilter(prev => ({ ...prev, level: value || undefined })) },
                                react_1.default.createElement(select_1.SelectTrigger, { className: "w-32" },
                                    react_1.default.createElement(select_1.SelectValue, { placeholder: t('monitoring.level') })),
                                react_1.default.createElement(select_1.SelectContent, null,
                                    react_1.default.createElement(select_1.SelectItem, { value: "" }, t('monitoring.all')),
                                    react_1.default.createElement(select_1.SelectItem, { value: "debug" }, "Debug"),
                                    react_1.default.createElement(select_1.SelectItem, { value: "info" }, "Info"),
                                    react_1.default.createElement(select_1.SelectItem, { value: "warn" }, "Warn"),
                                    react_1.default.createElement(select_1.SelectItem, { value: "error" }, "Error"),
                                    react_1.default.createElement(select_1.SelectItem, { value: "fatal" }, "Fatal"))),
                            react_1.default.createElement(button_1.Button, { variant: "outline", onClick: () => setLogFilter({}) }, t('monitoring.clearFilters')),
                            react_1.default.createElement(button_1.Button, { variant: "outline", onClick: clearLogs }, t('monitoring.clearLogs')),
                            react_1.default.createElement(button_1.Button, { variant: "outline", onClick: () => {
                                    const data = exportLogs('json');
                                    const blob = new Blob([data], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                } },
                                react_1.default.createElement(lucide_react_1.Download, { className: "h-4 w-4 mr-2" }),
                                t('monitoring.exportLogs'))))),
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null,
                            t('monitoring.logList'),
                            " (",
                            filteredLogs.length,
                            ")")),
                    react_1.default.createElement(card_1.CardContent, null,
                        react_1.default.createElement("div", { className: "space-y-2 max-h-96 overflow-y-auto" },
                            filteredLogs.slice(-50).reverse().map((log) => (react_1.default.createElement("div", { key: log.id, className: "flex items-start gap-3 p-2 text-sm border-b" },
                                react_1.default.createElement("div", { className: "flex items-center gap-2 min-w-0" },
                                    react_1.default.createElement("div", { className: "w-2 h-2 rounded-full flex-shrink-0", style: { backgroundColor: LOG_LEVEL_COLORS[log.level] } }),
                                    react_1.default.createElement("span", { className: "text-xs text-muted-foreground min-w-0" }, new Date(log.timestamp).toLocaleTimeString()),
                                    react_1.default.createElement(badge_1.Badge, { variant: "outline", className: "text-xs" }, log.level),
                                    log.category && (react_1.default.createElement(badge_1.Badge, { variant: "secondary", className: "text-xs" }, log.category))),
                                react_1.default.createElement("div", { className: "flex-1 min-w-0" },
                                    react_1.default.createElement("div", { className: "truncate" }, log.message),
                                    log.data && Object.keys(log.data).length > 0 && (react_1.default.createElement("details", { className: "mt-1" },
                                        react_1.default.createElement("summary", { className: "cursor-pointer text-xs text-muted-foreground" }, t('monitoring.showData')),
                                        react_1.default.createElement("pre", { className: "mt-1 text-xs bg-muted p-2 rounded overflow-x-auto" }, JSON.stringify(log.data, null, 2)))))))),
                            filteredLogs.length === 0 && (react_1.default.createElement("div", { className: "text-center py-8 text-muted-foreground" }, t('monitoring.noLogs'))))))))));
}
