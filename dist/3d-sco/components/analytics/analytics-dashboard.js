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
exports.AnalyticsDashboard = AnalyticsDashboard;
const react_1 = __importStar(require("react"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const tabs_1 = require("@/components/ui/tabs");
const select_1 = require("@/components/ui/select");
const calendar_1 = require("@/components/ui/calendar");
const popover_1 = require("@/components/ui/popover");
const lucide_react_1 = require("lucide-react");
const date_fns_1 = require("date-fns");
const utils_1 = require("@/lib/utils");
function AnalyticsDashboard() {
    const [data, setData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [dateRange, setDateRange] = (0, react_1.useState)({
        from: (0, date_fns_1.subDays)(new Date(), 30),
        to: new Date()
    });
    const [selectedMetric, setSelectedMetric] = (0, react_1.useState)('pageViews');
    const [refreshInterval, setRefreshInterval] = (0, react_1.useState)(null);
    // Fetch analytics data
    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: dateRange.from.toISOString(),
                    endDate: dateRange.to.toISOString(),
                    metrics: ['pageViews', 'uniqueVisitors', 'bounceRate', 'avgSessionDuration']
                })
            });
            if (response.ok) {
                const analyticsData = await response.json();
                setData(analyticsData);
            }
        }
        catch (error) {
            console.error('Failed to fetch analytics data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    // Auto-refresh setup
    (0, react_1.useEffect)(() => {
        fetchAnalyticsData();
        if (refreshInterval) {
            const interval = setInterval(fetchAnalyticsData, refreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [dateRange, refreshInterval]);
    // Format numbers
    const formatNumber = (num) => {
        if (num >= 1000000)
            return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000)
            return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };
    // Format percentage
    const formatPercentage = (num) => `${num.toFixed(1)}%`;
    // Format duration
    const formatDuration = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    if (loading) {
        return (react_1.default.createElement("div", { className: "space-y-6" },
            react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" }, [...Array(4)].map((_, i) => (react_1.default.createElement(card_1.Card, { key: i, className: "animate-pulse" },
                react_1.default.createElement(card_1.CardHeader, { className: "pb-2" },
                    react_1.default.createElement("div", { className: "h-4 bg-gray-200 rounded w-3/4" })),
                react_1.default.createElement(card_1.CardContent, null,
                    react_1.default.createElement("div", { className: "h-8 bg-gray-200 rounded w-1/2 mb-2" }),
                    react_1.default.createElement("div", { className: "h-3 bg-gray-200 rounded w-1/4" }))))))));
    }
    if (!data) {
        return (react_1.default.createElement("div", { className: "flex items-center justify-center h-64" },
            react_1.default.createElement("p", { className: "text-gray-500" }, "No analytics data available")));
    }
    return (react_1.default.createElement("div", { className: "space-y-6" },
        react_1.default.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h1", { className: "text-3xl font-bold" }, "Analytics Dashboard"),
                react_1.default.createElement("p", { className: "text-gray-600" }, "Monitor your website performance and user behavior")),
            react_1.default.createElement("div", { className: "flex flex-col sm:flex-row gap-2" },
                react_1.default.createElement(popover_1.Popover, null,
                    react_1.default.createElement(popover_1.PopoverTrigger, { asChild: true },
                        react_1.default.createElement(button_1.Button, { variant: "outline", className: "w-[280px] justify-start text-left font-normal" },
                            react_1.default.createElement(lucide_react_1.CalendarIcon, { className: "mr-2 h-4 w-4" }),
                            dateRange.from ? (dateRange.to ? (react_1.default.createElement(react_1.default.Fragment, null,
                                (0, date_fns_1.format)(dateRange.from, "LLL dd, y"),
                                " -",
                                " ",
                                (0, date_fns_1.format)(dateRange.to, "LLL dd, y"))) : ((0, date_fns_1.format)(dateRange.from, "LLL dd, y"))) : (react_1.default.createElement("span", null, "Pick a date range")))),
                    react_1.default.createElement(popover_1.PopoverContent, { className: "w-auto p-0", align: "start" },
                        react_1.default.createElement(calendar_1.Calendar, { initialFocus: true, mode: "range", defaultMonth: dateRange.from, selected: dateRange, onSelect: (range) => range && setDateRange(range), numberOfMonths: 2 }))),
                react_1.default.createElement(select_1.Select, { value: refreshInterval?.toString() || 'off', onValueChange: (value) => setRefreshInterval(value === 'off' ? null : parseInt(value)) },
                    react_1.default.createElement(select_1.SelectTrigger, { className: "w-[140px]" },
                        react_1.default.createElement(select_1.SelectValue, { placeholder: "Auto refresh" })),
                    react_1.default.createElement(select_1.SelectContent, null,
                        react_1.default.createElement(select_1.SelectItem, { value: "off" }, "Off"),
                        react_1.default.createElement(select_1.SelectItem, { value: "30" }, "30 seconds"),
                        react_1.default.createElement(select_1.SelectItem, { value: "60" }, "1 minute"),
                        react_1.default.createElement(select_1.SelectItem, { value: "300" }, "5 minutes"))),
                react_1.default.createElement(button_1.Button, { onClick: fetchAnalyticsData, variant: "outline" }, "Refresh"))),
        react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" },
            react_1.default.createElement(card_1.Card, null,
                react_1.default.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
                    react_1.default.createElement(card_1.CardTitle, { className: "text-sm font-medium" }, "Page Views"),
                    react_1.default.createElement(lucide_react_1.Eye, { className: "h-4 w-4 text-muted-foreground" })),
                react_1.default.createElement(card_1.CardContent, null,
                    react_1.default.createElement("div", { className: "text-2xl font-bold" }, formatNumber(data.pageViews)),
                    react_1.default.createElement("p", { className: "text-xs text-muted-foreground" },
                        react_1.default.createElement(lucide_react_1.TrendingUp, { className: "inline h-3 w-3 mr-1" }),
                        "+12.5% from last period"))),
            react_1.default.createElement(card_1.Card, null,
                react_1.default.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
                    react_1.default.createElement(card_1.CardTitle, { className: "text-sm font-medium" }, "Unique Visitors"),
                    react_1.default.createElement(lucide_react_1.Users, { className: "h-4 w-4 text-muted-foreground" })),
                react_1.default.createElement(card_1.CardContent, null,
                    react_1.default.createElement("div", { className: "text-2xl font-bold" }, formatNumber(data.uniqueVisitors)),
                    react_1.default.createElement("p", { className: "text-xs text-muted-foreground" },
                        react_1.default.createElement(lucide_react_1.TrendingUp, { className: "inline h-3 w-3 mr-1" }),
                        "+8.2% from last period"))),
            react_1.default.createElement(card_1.Card, null,
                react_1.default.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
                    react_1.default.createElement(card_1.CardTitle, { className: "text-sm font-medium" }, "Bounce Rate"),
                    react_1.default.createElement(lucide_react_1.TrendingDown, { className: "h-4 w-4 text-muted-foreground" })),
                react_1.default.createElement(card_1.CardContent, null,
                    react_1.default.createElement("div", { className: "text-2xl font-bold" }, formatPercentage(data.bounceRate)),
                    react_1.default.createElement("p", { className: "text-xs text-muted-foreground" },
                        react_1.default.createElement(lucide_react_1.TrendingDown, { className: "inline h-3 w-3 mr-1" }),
                        "-2.1% from last period"))),
            react_1.default.createElement(card_1.Card, null,
                react_1.default.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2" },
                    react_1.default.createElement(card_1.CardTitle, { className: "text-sm font-medium" }, "Avg. Session Duration"),
                    react_1.default.createElement(lucide_react_1.Clock, { className: "h-4 w-4 text-muted-foreground" })),
                react_1.default.createElement(card_1.CardContent, null,
                    react_1.default.createElement("div", { className: "text-2xl font-bold" }, formatDuration(data.avgSessionDuration)),
                    react_1.default.createElement("p", { className: "text-xs text-muted-foreground" },
                        react_1.default.createElement(lucide_react_1.TrendingUp, { className: "inline h-3 w-3 mr-1" }),
                        "+5.3% from last period")))),
        react_1.default.createElement(card_1.Card, null,
            react_1.default.createElement(card_1.CardHeader, null,
                react_1.default.createElement(card_1.CardTitle, { className: "flex items-center gap-2" },
                    react_1.default.createElement("div", { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse" }),
                    "Real-time Activity"),
                react_1.default.createElement(card_1.CardDescription, null, "Current visitors and activity on your website")),
            react_1.default.createElement(card_1.CardContent, null,
                react_1.default.createElement("div", { className: "flex items-center justify-between" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("div", { className: "text-3xl font-bold" }, data.realTimeVisitors),
                        react_1.default.createElement("p", { className: "text-sm text-muted-foreground" }, "Active visitors right now")),
                    react_1.default.createElement("div", { className: "text-right" },
                        react_1.default.createElement("div", { className: "text-lg font-semibold" }, formatPercentage(data.conversionRate)),
                        react_1.default.createElement("p", { className: "text-sm text-muted-foreground" }, "Conversion rate"))))),
        react_1.default.createElement(tabs_1.Tabs, { defaultValue: "pages", className: "space-y-4" },
            react_1.default.createElement(tabs_1.TabsList, null,
                react_1.default.createElement(tabs_1.TabsTrigger, { value: "pages" }, "Top Pages"),
                react_1.default.createElement(tabs_1.TabsTrigger, { value: "countries" }, "Countries"),
                react_1.default.createElement(tabs_1.TabsTrigger, { value: "devices" }, "Devices"),
                react_1.default.createElement(tabs_1.TabsTrigger, { value: "sources" }, "Traffic Sources")),
            react_1.default.createElement(tabs_1.TabsContent, { value: "pages", className: "space-y-4" },
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null, "Top Pages"),
                        react_1.default.createElement(card_1.CardDescription, null, "Most visited pages on your website")),
                    react_1.default.createElement(card_1.CardContent, null,
                        react_1.default.createElement("div", { className: "space-y-4" }, data.topPages.map((page, index) => (react_1.default.createElement("div", { key: page.path, className: "flex items-center justify-between" },
                            react_1.default.createElement("div", { className: "flex items-center gap-3" },
                                react_1.default.createElement(badge_1.Badge, { variant: "outline" }, index + 1),
                                react_1.default.createElement("div", null,
                                    react_1.default.createElement("p", { className: "font-medium" }, page.path),
                                    react_1.default.createElement("p", { className: "text-sm text-muted-foreground" },
                                        formatNumber(page.views),
                                        " views"))),
                            react_1.default.createElement("div", { className: (0, utils_1.cn)("flex items-center gap-1 text-sm", page.change >= 0 ? "text-green-600" : "text-red-600") },
                                page.change >= 0 ? react_1.default.createElement(lucide_react_1.TrendingUp, { className: "h-3 w-3" }) : react_1.default.createElement(lucide_react_1.TrendingDown, { className: "h-3 w-3" }),
                                Math.abs(page.change),
                                "%")))))))),
            react_1.default.createElement(tabs_1.TabsContent, { value: "countries", className: "space-y-4" },
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null, "Top Countries"),
                        react_1.default.createElement(card_1.CardDescription, null, "Visitors by country")),
                    react_1.default.createElement(card_1.CardContent, null,
                        react_1.default.createElement("div", { className: "space-y-4" }, data.topCountries.map((country, index) => (react_1.default.createElement("div", { key: country.country, className: "flex items-center justify-between" },
                            react_1.default.createElement("div", { className: "flex items-center gap-3" },
                                react_1.default.createElement(badge_1.Badge, { variant: "outline" }, index + 1),
                                react_1.default.createElement("div", null,
                                    react_1.default.createElement("p", { className: "font-medium" }, country.country),
                                    react_1.default.createElement("p", { className: "text-sm text-muted-foreground" },
                                        formatNumber(country.visitors),
                                        " visitors"))),
                            react_1.default.createElement("div", { className: "text-sm text-muted-foreground" }, formatPercentage(country.percentage))))))))),
            react_1.default.createElement(tabs_1.TabsContent, { value: "devices", className: "space-y-4" },
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null, "Device Types"),
                        react_1.default.createElement(card_1.CardDescription, null, "Visitors by device type")),
                    react_1.default.createElement(card_1.CardContent, null,
                        react_1.default.createElement("div", { className: "space-y-4" }, data.deviceTypes.map((device) => (react_1.default.createElement("div", { key: device.type, className: "flex items-center justify-between" },
                            react_1.default.createElement("div", null,
                                react_1.default.createElement("p", { className: "font-medium capitalize" }, device.type),
                                react_1.default.createElement("p", { className: "text-sm text-muted-foreground" },
                                    formatNumber(device.count),
                                    " visitors")),
                            react_1.default.createElement("div", { className: "text-sm text-muted-foreground" }, formatPercentage(device.percentage))))))))),
            react_1.default.createElement(tabs_1.TabsContent, { value: "sources", className: "space-y-4" },
                react_1.default.createElement(card_1.Card, null,
                    react_1.default.createElement(card_1.CardHeader, null,
                        react_1.default.createElement(card_1.CardTitle, null, "Traffic Sources"),
                        react_1.default.createElement(card_1.CardDescription, null, "Where your visitors come from")),
                    react_1.default.createElement(card_1.CardContent, null,
                        react_1.default.createElement("div", { className: "space-y-4" }, data.trafficSources.map((source) => (react_1.default.createElement("div", { key: source.source, className: "flex items-center justify-between" },
                            react_1.default.createElement("div", null,
                                react_1.default.createElement("p", { className: "font-medium capitalize" }, source.source),
                                react_1.default.createElement("p", { className: "text-sm text-muted-foreground" },
                                    formatNumber(source.visitors),
                                    " visitors")),
                            react_1.default.createElement("div", { className: "text-sm text-muted-foreground" }, formatPercentage(source.percentage))))))))))));
}
exports.default = AnalyticsDashboard;
