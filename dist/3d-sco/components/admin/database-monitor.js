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
exports.default = DatabaseMonitor;
const react_1 = __importStar(require("react"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const tabs_1 = require("@/components/ui/tabs");
const alert_1 = require("@/components/ui/alert");
const progress_1 = require("@/components/ui/progress");
const lucide_react_1 = require("lucide-react");
const use_toast_1 = require("@/hooks/use-toast");
function DatabaseMonitor() {
    const [overview, setOverview] = (0, react_1.useState)(null);
    const [recommendations, setRecommendations] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [activeTab, setActiveTab] = (0, react_1.useState)('overview');
    const { toast } = (0, use_toast_1.useToast)();
    const fetchOverview = async () => {
        try {
            const response = await fetch('/api/admin/database');
            if (!response.ok)
                throw new Error('Failed to fetch database overview');
            const data = await response.json();
            setOverview(data.overview);
        }
        catch (error) {
            console.error('Error fetching database overview:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch database overview',
                variant: 'destructive',
            });
        }
    };
    const fetchRecommendations = async () => {
        try {
            const response = await fetch('/api/admin/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'optimize_queries' }),
            });
            if (!response.ok)
                throw new Error('Failed to fetch recommendations');
            const data = await response.json();
            setRecommendations(data.analysis.recommendations || []);
        }
        catch (error) {
            console.error('Error fetching recommendations:', error);
        }
    };
    const runMaintenance = async () => {
        try {
            setRefreshing(true);
            const response = await fetch('/api/admin/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'maintenance' }),
            });
            if (!response.ok)
                throw new Error('Maintenance failed');
            toast({
                title: 'Success',
                description: 'Database maintenance completed successfully',
            });
            await fetchOverview();
        }
        catch (error) {
            console.error('Error running maintenance:', error);
            toast({
                title: 'Error',
                description: 'Failed to run database maintenance',
                variant: 'destructive',
            });
        }
        finally {
            setRefreshing(false);
        }
    };
    const clearCache = async (patterns) => {
        try {
            const response = await fetch('/api/admin/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'clear_cache',
                    data: patterns ? { patterns } : undefined,
                }),
            });
            if (!response.ok)
                throw new Error('Cache clear failed');
            toast({
                title: 'Success',
                description: 'Cache cleared successfully',
            });
            await fetchOverview();
        }
        catch (error) {
            console.error('Error clearing cache:', error);
            toast({
                title: 'Error',
                description: 'Failed to clear cache',
                variant: 'destructive',
            });
        }
    };
    const refresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchOverview(), fetchRecommendations()]);
        setRefreshing(false);
    };
    (0, react_1.useEffect)(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchOverview(), fetchRecommendations()]);
            setLoading(false);
        };
        loadData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchOverview, 30000);
        return () => clearInterval(interval);
    }, []);
    if (loading) {
        return (react_1.default.createElement("div", { className: "flex items-center justify-center h-64" },
            react_1.default.createElement(lucide_react_1.RefreshCw, { className: "h-8 w-8 animate-spin" }),
            react_1.default.createElement("span", { className: "ml-2" }, "Loading database overview...")));
    }
    if (!overview) {
        return (react_1.default.createElement(alert_1.Alert, null,
            react_1.default.createElement(lucide_react_1.AlertTriangle, { className: "h-4 w-4" }),
            react_1.default.createElement(alert_1.AlertDescription, null, "Failed to load database overview. Please try refreshing the page.")));
    }
    const { queryMetrics, tableStats, indexUsage, cacheStats } = overview;
    return (react_1.default.createElement("div", { className: "space-y-6" },
        react_1.default.createElement("div", { className: "flex items-center justify-between" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h2", { className: "text-3xl font-bold tracking-tight" }, "Database Monitor"),
                react_1.default.createElement("p", { className: "text-muted-foreground" }, "Monitor database performance, cache usage, and system health")),
            react_1.default.createElement("div", { className: "flex gap-2" },
                react_1.default.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: refresh, disabled: refreshing },
                    react_1.default.createElement(lucide_react_1.RefreshCw, { className: `h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}` }),
                    "Refresh"),
                react_1.default.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: runMaintenance, disabled: refreshing },
                    react_1.default.createElement(lucide_react_1.Settings, { className: "h-4 w-4 mr-2" }),
                    "Maintenance"),
                react_1.default.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: () => clearCache() },
                    react_1.default.createElement(lucide_react_1.Trash2, { className: "h-4 w-4 mr-2" }),
                    "Clear Cache"))),
        react_1.default.createElement("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4" },
            react_1.default.createElement(card_1.Card, null,
                react_1.default.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
                    react_1.default.createElement(card_1.CardTitle, { className: "text-sm font-medium" }, "Total Queries"),
                    react_1.default.createElement(lucide_react_1.Activity, { className: "h-4 w-4 text-muted-foreground" })),
                react_1.default.createElement(card_1.CardContent, null,
                    react_1.default.createElement("div", { className: "text-2xl font-bold" }, queryMetrics.totalQueries.toLocaleString()),
                    react_1.default.createElement("p", { className: "text-xs text-muted-foreground" }, "Last hour"))),
            react_1.default.createElement(card_1.Card, null,
                react_1.default.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
                    react_1.default.createElement(card_1.CardTitle, { className: "text-sm font-medium" }, "Slow Queries"),
                    react_1.default.createElement(lucide_react_1.AlertTriangle, { className: "h-4 w-4 text-muted-foreground" })),
                react_1.default.createElement(card_1.CardContent, null,
                    react_1.default.createElement("div", { className: "text-2xl font-bold" }, queryMetrics.slowQueries),
                    react_1.default.createElement("p", { className: "text-xs text-muted-foreground" }, queryMetrics.totalQueries > 0
                        ? `${((queryMetrics.slowQueries / queryMetrics.totalQueries) * 100).toFixed(1)}% of total`
                        : 'No queries'))),
            react_1.default.createElement(card_1.Card, null,
                react_1.default.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
                    react_1.default.createElement(card_1.CardTitle, { className: "text-sm font-medium" }, "Avg Duration"),
                    react_1.default.createElement(lucide_react_1.Clock, { className: "h-4 w-4 text-muted-foreground" })),
                react_1.default.createElement(card_1.CardContent, null,
                    react_1.default.createElement("div", { className: "text-2xl font-bold" },
                        queryMetrics.averageDuration,
                        "ms"),
                    react_1.default.createElement("p", { className: "text-xs text-muted-foreground" }, "Per query"))),
            react_1.default.createElement(card_1.Card, null,
                react_1.default.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
                    react_1.default.createElement(card_1.CardTitle, { className: "text-sm font-medium" }, "Cache Status"),
                    react_1.default.createElement(lucide_react_1.Database, { className: "h-4 w-4 text-muted-foreground" })),
                react_1.default.createElement(card_1.CardContent, null,
                    react_1.default.createElement("div", { className: "flex items-center space-x-2" },
                        cacheStats.redis.connected ? (react_1.default.createElement(lucide_react_1.CheckCircle, { className: "h-4 w-4 text-green-500" })) : (react_1.default.createElement(lucide_react_1.AlertTriangle, { className: "h-4 w-4 text-yellow-500" })),
                        react_1.default.createElement("span", { className: "text-sm" }, cacheStats.redis.connected ? 'Redis Connected' : 'Memory Only')),
                    react_1.default.createElement("p", { className: "text-xs text-muted-foreground mt-1" },
                        cacheStats.memoryCache.size,
                        "/",
                        cacheStats.memoryCache.max,
                        " items")))),
        recommendations.length > 0 && (react_1.default.createElement(alert_1.Alert, null,
            react_1.default.createElement(lucide_react_1.AlertTriangle, { className: "h-4 w-4" }),
            react_1.default.createElement(alert_1.AlertDescription, null,
                react_1.default.createElement("div", { className: "font-medium mb-2" }, "Database Optimization Recommendations:"),
                react_1.default.createElement("ul", { className: "list-disc list-inside space-y-1" }, recommendations.slice(0, 3).map((rec, index) => (react_1.default.createElement("li", { key: index, className: "text-sm" },
                    react_1.default.createElement("strong", null,
                        rec.table || rec.index,
                        ":"),
                    " ",
                    rec.recommendation)))),
                recommendations.length > 3 && (react_1.default.createElement("p", { className: "text-sm mt-2" },
                    "And ",
                    recommendations.length - 3,
                    " more recommendations..."))))),
        react_1.default.createElement(tabs_1.Tabs, { value: activeTab, onValueChange: setActiveTab },
            react_1.default.createElement(tabs_1.TabsList, null,
                react_1.default.createElement(tabs_1.TabsTrigger, { value: "overview" }, "Overview"),
                react_1.default.createElement(tabs_1.TabsTrigger, { value: "tables" }, "Tables"),
                react_1.default.createElement(tabs_1.TabsTrigger, { value: "indexes" }, "Indexes"),
                react_1.default.createElement(tabs_1.TabsTrigger, { value: "cache" }, "Cache")),
            react_1.default.createElement(tabs_1.TabsContent, { value: "overview", className: "space-y-4" },
                react_1.default.createElement("div", { className: "grid gap-4 md:grid-cols-2" },
                    react_1.default.createElement(card_1.Card, null,
                        react_1.default.createElement(card_1.CardHeader, null,
                            react_1.default.createElement(card_1.CardTitle, null, "Query Performance"),
                            react_1.default.createElement(card_1.CardDescription, null, "Recent query execution metrics")),
                        react_1.default.createElement(card_1.CardContent, null,
                            react_1.default.createElement("div", { className: "space-y-4" },
                                react_1.default.createElement("div", null,
                                    react_1.default.createElement("div", { className: "flex justify-between text-sm" },
                                        react_1.default.createElement("span", null, "Slow Query Rate"),
                                        react_1.default.createElement("span", null, queryMetrics.totalQueries > 0
                                            ? `${((queryMetrics.slowQueries / queryMetrics.totalQueries) * 100).toFixed(1)}%`
                                            : '0%')),
                                    react_1.default.createElement(progress_1.Progress, { value: queryMetrics.totalQueries > 0
                                            ? (queryMetrics.slowQueries / queryMetrics.totalQueries) * 100
                                            : 0, className: "mt-2" })),
                                queryMetrics.slowestQuery.duration > 0 && (react_1.default.createElement("div", null,
                                    react_1.default.createElement("h4", { className: "text-sm font-medium mb-2" }, "Slowest Query"),
                                    react_1.default.createElement("div", { className: "bg-muted p-3 rounded text-xs" },
                                        react_1.default.createElement("div", { className: "font-mono mb-1" },
                                            queryMetrics.slowestQuery.query.substring(0, 100),
                                            "..."),
                                        react_1.default.createElement("div", { className: "text-muted-foreground" },
                                            "Duration: ",
                                            queryMetrics.slowestQuery.duration,
                                            "ms"))))))),
                    react_1.default.createElement(card_1.Card, null,
                        react_1.default.createElement(card_1.CardHeader, null,
                            react_1.default.createElement(card_1.CardTitle, null, "Cache Performance"),
                            react_1.default.createElement(card_1.CardDescription, null, "Memory and Redis cache status")),
                        react_1.default.createElement(card_1.CardContent, null,
                            react_1.default.createElement("div", { className: "space-y-4" },
                                react_1.default.createElement("div", null,
                                    react_1.default.createElement("div", { className: "flex justify-between text-sm" },
                                        react_1.default.createElement("span", null, "Memory Cache Usage"),
                                        react_1.default.createElement("span", null,
                                            cacheStats.memoryCache.size,
                                            "/",
                                            cacheStats.memoryCache.max)),
                                    react_1.default.createElement(progress_1.Progress, { value: (cacheStats.memoryCache.size / cacheStats.memoryCache.max) * 100, className: "mt-2" })),
                                react_1.default.createElement("div", { className: "flex items-center justify-between" },
                                    react_1.default.createElement("span", { className: "text-sm" }, "Redis Status"),
                                    react_1.default.createElement(badge_1.Badge, { variant: cacheStats.redis.connected ? 'default' : 'secondary' }, cacheStats.redis.connected ? 'Connected' : 'Disconnected'))))))),
            react_1.default.createElement(tabs_1.TabsContent, { value: "tables", className: "space-y-4" },
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null, "Table Statistics"),
                        react_1.default.createElement(card_1.CardDescription, null, "Database table performance and maintenance status")),
                    react_1.default.createElement(card_1.CardContent, null,
                        react_1.default.createElement("div", { className: "overflow-x-auto" },
                            react_1.default.createElement("table", { className: "w-full text-sm" },
                                react_1.default.createElement("thead", null,
                                    react_1.default.createElement("tr", { className: "border-b" },
                                        react_1.default.createElement("th", { className: "text-left p-2" }, "Table"),
                                        react_1.default.createElement("th", { className: "text-right p-2" }, "Live Tuples"),
                                        react_1.default.createElement("th", { className: "text-right p-2" }, "Dead Tuples"),
                                        react_1.default.createElement("th", { className: "text-right p-2" }, "Inserts"),
                                        react_1.default.createElement("th", { className: "text-right p-2" }, "Updates"),
                                        react_1.default.createElement("th", { className: "text-right p-2" }, "Last Analyze"))),
                                react_1.default.createElement("tbody", null, tableStats.map((table, index) => (react_1.default.createElement("tr", { key: index, className: "border-b" },
                                    react_1.default.createElement("td", { className: "p-2 font-medium" }, table.tablename),
                                    react_1.default.createElement("td", { className: "text-right p-2" }, table.live_tuples.toLocaleString()),
                                    react_1.default.createElement("td", { className: "text-right p-2" },
                                        react_1.default.createElement("span", { className: table.dead_tuples > table.live_tuples * 0.1 ? 'text-red-500' : '' }, table.dead_tuples.toLocaleString())),
                                    react_1.default.createElement("td", { className: "text-right p-2" }, table.inserts.toLocaleString()),
                                    react_1.default.createElement("td", { className: "text-right p-2" }, table.updates.toLocaleString()),
                                    react_1.default.createElement("td", { className: "text-right p-2" }, table.last_analyze
                                        ? new Date(table.last_analyze).toLocaleDateString()
                                        : 'Never')))))))))),
            react_1.default.createElement(tabs_1.TabsContent, { value: "indexes", className: "space-y-4" },
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null, "Index Usage"),
                        react_1.default.createElement(card_1.CardDescription, null, "Database index performance and usage statistics")),
                    react_1.default.createElement(card_1.CardContent, null,
                        react_1.default.createElement("div", { className: "overflow-x-auto" },
                            react_1.default.createElement("table", { className: "w-full text-sm" },
                                react_1.default.createElement("thead", null,
                                    react_1.default.createElement("tr", { className: "border-b" },
                                        react_1.default.createElement("th", { className: "text-left p-2" }, "Index"),
                                        react_1.default.createElement("th", { className: "text-left p-2" }, "Table"),
                                        react_1.default.createElement("th", { className: "text-right p-2" }, "Scans"),
                                        react_1.default.createElement("th", { className: "text-right p-2" }, "Tuples Read"),
                                        react_1.default.createElement("th", { className: "text-left p-2" }, "Status"))),
                                react_1.default.createElement("tbody", null, indexUsage.map((index, i) => (react_1.default.createElement("tr", { key: i, className: "border-b" },
                                    react_1.default.createElement("td", { className: "p-2 font-medium" }, index.indexname),
                                    react_1.default.createElement("td", { className: "p-2" }, index.tablename),
                                    react_1.default.createElement("td", { className: "text-right p-2" }, index.idx_scan.toLocaleString()),
                                    react_1.default.createElement("td", { className: "text-right p-2" }, index.idx_tup_read.toLocaleString()),
                                    react_1.default.createElement("td", { className: "p-2" },
                                        react_1.default.createElement(badge_1.Badge, { variant: index.usage_status === 'Frequently used' ? 'default' :
                                                index.usage_status === 'Rarely used' ? 'secondary' : 'destructive' }, index.usage_status))))))))))),
            react_1.default.createElement(tabs_1.TabsContent, { value: "cache", className: "space-y-4" },
                react_1.default.createElement("div", { className: "grid gap-4 md:grid-cols-2" },
                    react_1.default.createElement(card_1.Card, null,
                        react_1.default.createElement(card_1.CardHeader, null,
                            react_1.default.createElement(card_1.CardTitle, null, "Memory Cache"),
                            react_1.default.createElement(card_1.CardDescription, null, "In-memory LRU cache statistics")),
                        react_1.default.createElement(card_1.CardContent, null,
                            react_1.default.createElement("div", { className: "space-y-4" },
                                react_1.default.createElement("div", null,
                                    react_1.default.createElement("div", { className: "flex justify-between text-sm" },
                                        react_1.default.createElement("span", null, "Items"),
                                        react_1.default.createElement("span", null,
                                            cacheStats.memoryCache.size,
                                            "/",
                                            cacheStats.memoryCache.max)),
                                    react_1.default.createElement(progress_1.Progress, { value: (cacheStats.memoryCache.size / cacheStats.memoryCache.max) * 100, className: "mt-2" })),
                                react_1.default.createElement("div", { className: "flex justify-between text-sm" },
                                    react_1.default.createElement("span", null, "Calculated Size"),
                                    react_1.default.createElement("span", null,
                                        (cacheStats.memoryCache.calculatedSize / 1024 / 1024).toFixed(2),
                                        " MB")),
                                react_1.default.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: () => clearCache(['memory']), className: "w-full" },
                                    react_1.default.createElement(lucide_react_1.Trash2, { className: "h-4 w-4 mr-2" }),
                                    "Clear Memory Cache")))),
                    react_1.default.createElement(card_1.Card, null,
                        react_1.default.createElement(card_1.CardHeader, null,
                            react_1.default.createElement(card_1.CardTitle, null, "Redis Cache"),
                            react_1.default.createElement(card_1.CardDescription, null, "Redis cache connection and status")),
                        react_1.default.createElement(card_1.CardContent, null,
                            react_1.default.createElement("div", { className: "space-y-4" },
                                react_1.default.createElement("div", { className: "flex items-center justify-between" },
                                    react_1.default.createElement("span", { className: "text-sm" }, "Connection Status"),
                                    react_1.default.createElement(badge_1.Badge, { variant: cacheStats.redis.connected ? 'default' : 'destructive' }, cacheStats.redis.connected ? 'Connected' : 'Disconnected')),
                                react_1.default.createElement("div", { className: "flex items-center justify-between" },
                                    react_1.default.createElement("span", { className: "text-sm" }, "Ready State"),
                                    react_1.default.createElement(badge_1.Badge, { variant: cacheStats.redis.ready ? 'default' : 'secondary' }, cacheStats.redis.ready ? 'Ready' : 'Not Ready')),
                                react_1.default.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: () => clearCache(['redis']), className: "w-full", disabled: !cacheStats.redis.connected },
                                    react_1.default.createElement(lucide_react_1.Trash2, { className: "h-4 w-4 mr-2" }),
                                    "Clear Redis Cache")))))))));
}
