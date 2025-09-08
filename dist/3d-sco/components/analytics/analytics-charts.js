"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrafficOverviewChart = TrafficOverviewChart;
exports.HourlyTrafficChart = HourlyTrafficChart;
exports.DeviceTypesChart = DeviceTypesChart;
exports.TopPagesChart = TopPagesChart;
exports.GeographicChart = GeographicChart;
exports.BrowserChart = BrowserChart;
exports.ChatActivityChart = ChatActivityChart;
exports.PerformanceChart = PerformanceChart;
exports.AnalyticsCharts = AnalyticsCharts;
const react_1 = __importDefault(require("react"));
const card_1 = require("@/components/ui/card");
const recharts_1 = require("recharts");
// Color palette for charts
const COLORS = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    warning: '#f97316',
    info: '#06b6d4',
    success: '#22c55e',
    muted: '#6b7280'
};
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
// Traffic Overview Chart
function TrafficOverviewChart({ data, className }) {
    if (!data?.traffic?.daily)
        return null;
    return (react_1.default.createElement(card_1.Card, { className: className },
        react_1.default.createElement(card_1.CardHeader, null,
            react_1.default.createElement(card_1.CardTitle, null, "Traffic Overview"),
            react_1.default.createElement(card_1.CardDescription, null, "Daily visitors and page views for the last 7 days")),
        react_1.default.createElement(card_1.CardContent, null,
            react_1.default.createElement(recharts_1.ResponsiveContainer, { width: "100%", height: 300 },
                react_1.default.createElement(recharts_1.AreaChart, { data: data.traffic.daily },
                    react_1.default.createElement(recharts_1.CartesianGrid, { strokeDasharray: "3 3", className: "opacity-30" }),
                    react_1.default.createElement(recharts_1.XAxis, { dataKey: "date", tickFormatter: (value) => new Date(value).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }), className: "text-xs" }),
                    react_1.default.createElement(recharts_1.YAxis, { className: "text-xs" }),
                    react_1.default.createElement(recharts_1.Tooltip, { labelFormatter: (value) => new Date(value).toLocaleDateString('th-TH', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }), formatter: (value, name) => [
                            value.toLocaleString(),
                            name === 'visitors' ? 'ผู้เยี่ยมชม' : name === 'pageViews' ? 'การดูหน้า' : 'เซสชัน'
                        ] }),
                    react_1.default.createElement(recharts_1.Legend, { formatter: (value) => value === 'visitors' ? 'ผู้เยี่ยมชม' :
                            value === 'pageViews' ? 'การดูหน้า' : 'เซสชัน' }),
                    react_1.default.createElement(recharts_1.Area, { type: "monotone", dataKey: "pageViews", stackId: "1", stroke: COLORS.primary, fill: COLORS.primary, fillOpacity: 0.6 }),
                    react_1.default.createElement(recharts_1.Area, { type: "monotone", dataKey: "visitors", stackId: "2", stroke: COLORS.secondary, fill: COLORS.secondary, fillOpacity: 0.6 }))))));
}
// Hourly Traffic Chart
function HourlyTrafficChart({ data, className }) {
    if (!data?.traffic?.hourly)
        return null;
    return (react_1.default.createElement(card_1.Card, { className: className },
        react_1.default.createElement(card_1.CardHeader, null,
            react_1.default.createElement(card_1.CardTitle, null, "Hourly Traffic"),
            react_1.default.createElement(card_1.CardDescription, null, "Visitor distribution throughout the day")),
        react_1.default.createElement(card_1.CardContent, null,
            react_1.default.createElement(recharts_1.ResponsiveContainer, { width: "100%", height: 300 },
                react_1.default.createElement(recharts_1.LineChart, { data: data.traffic.hourly },
                    react_1.default.createElement(recharts_1.CartesianGrid, { strokeDasharray: "3 3", className: "opacity-30" }),
                    react_1.default.createElement(recharts_1.XAxis, { dataKey: "hour", tickFormatter: (value) => `${value}:00`, className: "text-xs" }),
                    react_1.default.createElement(recharts_1.YAxis, { className: "text-xs" }),
                    react_1.default.createElement(recharts_1.Tooltip, { labelFormatter: (value) => `เวลา ${value}:00`, formatter: (value, name) => [
                            value.toLocaleString(),
                            name === 'visitors' ? 'ผู้เยี่ยมชม' : 'การดูหน้า'
                        ] }),
                    react_1.default.createElement(recharts_1.Legend, { formatter: (value) => value === 'visitors' ? 'ผู้เยี่ยมชม' : 'การดูหน้า' }),
                    react_1.default.createElement(recharts_1.Line, { type: "monotone", dataKey: "visitors", stroke: COLORS.primary, strokeWidth: 2, dot: { fill: COLORS.primary, strokeWidth: 2, r: 4 }, activeDot: { r: 6, stroke: COLORS.primary, strokeWidth: 2 } }),
                    react_1.default.createElement(recharts_1.Line, { type: "monotone", dataKey: "pageViews", stroke: COLORS.secondary, strokeWidth: 2, dot: { fill: COLORS.secondary, strokeWidth: 2, r: 4 }, activeDot: { r: 6, stroke: COLORS.secondary, strokeWidth: 2 } }))))));
}
// Device Types Chart
function DeviceTypesChart({ data, className }) {
    if (!data?.devices?.deviceTypes)
        return null;
    return (react_1.default.createElement(card_1.Card, { className: className },
        react_1.default.createElement(card_1.CardHeader, null,
            react_1.default.createElement(card_1.CardTitle, null, "Device Types"),
            react_1.default.createElement(card_1.CardDescription, null, "Visitor distribution by device type")),
        react_1.default.createElement(card_1.CardContent, null,
            react_1.default.createElement(recharts_1.ResponsiveContainer, { width: "100%", height: 300 },
                react_1.default.createElement(recharts_1.PieChart, null,
                    react_1.default.createElement(recharts_1.Pie, { data: data.devices.deviceTypes, cx: "50%", cy: "50%", labelLine: false, label: ({ type, percentage }) => `${type} (${percentage.toFixed(1)}%)`, outerRadius: 80, fill: "#8884d8", dataKey: "count" }, data.devices.deviceTypes.map((entry, index) => (react_1.default.createElement(recharts_1.Cell, { key: `cell-${index}`, fill: PIE_COLORS[index % PIE_COLORS.length] })))),
                    react_1.default.createElement(recharts_1.Tooltip, { formatter: (value) => [value.toLocaleString(), 'ผู้เยี่ยมชม'] }),
                    react_1.default.createElement(recharts_1.Legend, null))))));
}
// Top Pages Chart
function TopPagesChart({ data, className }) {
    if (!data?.pages?.topPages)
        return null;
    return (react_1.default.createElement(card_1.Card, { className: className },
        react_1.default.createElement(card_1.CardHeader, null,
            react_1.default.createElement(card_1.CardTitle, null, "Top Pages"),
            react_1.default.createElement(card_1.CardDescription, null, "Most visited pages on your website")),
        react_1.default.createElement(card_1.CardContent, null,
            react_1.default.createElement(recharts_1.ResponsiveContainer, { width: "100%", height: 300 },
                react_1.default.createElement(recharts_1.BarChart, { data: data.pages.topPages, layout: "horizontal" },
                    react_1.default.createElement(recharts_1.CartesianGrid, { strokeDasharray: "3 3", className: "opacity-30" }),
                    react_1.default.createElement(recharts_1.XAxis, { type: "number", className: "text-xs" }),
                    react_1.default.createElement(recharts_1.YAxis, { type: "category", dataKey: "title", width: 100, className: "text-xs" }),
                    react_1.default.createElement(recharts_1.Tooltip, { formatter: (value) => [value.toLocaleString(), 'การดูหน้า'], labelFormatter: (label) => `หน้า: ${label}` }),
                    react_1.default.createElement(recharts_1.Bar, { dataKey: "views", fill: COLORS.primary, radius: [0, 4, 4, 0] }))))));
}
// Geographic Distribution Chart
function GeographicChart({ data, className }) {
    if (!data?.geography?.countries)
        return null;
    return (react_1.default.createElement(card_1.Card, { className: className },
        react_1.default.createElement(card_1.CardHeader, null,
            react_1.default.createElement(card_1.CardTitle, null, "Geographic Distribution"),
            react_1.default.createElement(card_1.CardDescription, null, "Visitors by country")),
        react_1.default.createElement(card_1.CardContent, null,
            react_1.default.createElement(recharts_1.ResponsiveContainer, { width: "100%", height: 300 },
                react_1.default.createElement(recharts_1.BarChart, { data: data.geography.countries.slice(0, 7) },
                    react_1.default.createElement(recharts_1.CartesianGrid, { strokeDasharray: "3 3", className: "opacity-30" }),
                    react_1.default.createElement(recharts_1.XAxis, { dataKey: "country", angle: -45, textAnchor: "end", height: 80, className: "text-xs" }),
                    react_1.default.createElement(recharts_1.YAxis, { className: "text-xs" }),
                    react_1.default.createElement(recharts_1.Tooltip, { formatter: (value) => [value.toLocaleString(), 'ผู้เยี่ยมชม'], labelFormatter: (label) => `ประเทศ: ${label}` }),
                    react_1.default.createElement(recharts_1.Bar, { dataKey: "visitors", fill: COLORS.secondary, radius: [4, 4, 0, 0] }))))));
}
// Browser Distribution Chart
function BrowserChart({ data, className }) {
    if (!data?.devices?.browsers)
        return null;
    return (react_1.default.createElement(card_1.Card, { className: className },
        react_1.default.createElement(card_1.CardHeader, null,
            react_1.default.createElement(card_1.CardTitle, null, "Browser Distribution"),
            react_1.default.createElement(card_1.CardDescription, null, "Visitors by browser type")),
        react_1.default.createElement(card_1.CardContent, null,
            react_1.default.createElement(recharts_1.ResponsiveContainer, { width: "100%", height: 300 },
                react_1.default.createElement(recharts_1.PieChart, null,
                    react_1.default.createElement(recharts_1.Pie, { data: data.devices.browsers, cx: "50%", cy: "50%", innerRadius: 40, outerRadius: 80, paddingAngle: 5, dataKey: "count" }, data.devices.browsers.map((entry, index) => (react_1.default.createElement(recharts_1.Cell, { key: `cell-${index}`, fill: PIE_COLORS[index % PIE_COLORS.length] })))),
                    react_1.default.createElement(recharts_1.Tooltip, { formatter: (value) => [value.toLocaleString(), 'ผู้เยี่ยมชม'] }),
                    react_1.default.createElement(recharts_1.Legend, null))))));
}
// Chat Activity Chart
function ChatActivityChart({ data, className }) {
    if (!data?.chat?.messagesByHour)
        return null;
    return (react_1.default.createElement(card_1.Card, { className: className },
        react_1.default.createElement(card_1.CardHeader, null,
            react_1.default.createElement(card_1.CardTitle, null, "Chat Activity"),
            react_1.default.createElement(card_1.CardDescription, null, "Messages sent throughout the day")),
        react_1.default.createElement(card_1.CardContent, null,
            react_1.default.createElement(recharts_1.ResponsiveContainer, { width: "100%", height: 300 },
                react_1.default.createElement(recharts_1.AreaChart, { data: data.chat.messagesByHour },
                    react_1.default.createElement(recharts_1.CartesianGrid, { strokeDasharray: "3 3", className: "opacity-30" }),
                    react_1.default.createElement(recharts_1.XAxis, { dataKey: "hour", tickFormatter: (value) => `${value}:00`, className: "text-xs" }),
                    react_1.default.createElement(recharts_1.YAxis, { className: "text-xs" }),
                    react_1.default.createElement(recharts_1.Tooltip, { labelFormatter: (value) => `เวลา ${value}:00`, formatter: (value) => [value.toLocaleString(), 'ข้อความ'] }),
                    react_1.default.createElement(recharts_1.Area, { type: "monotone", dataKey: "messages", stroke: COLORS.accent, fill: COLORS.accent, fillOpacity: 0.6 }))))));
}
// Performance Metrics Chart
function PerformanceChart({ data, className }) {
    if (!data?.performance?.errorsByType)
        return null;
    return (react_1.default.createElement(card_1.Card, { className: className },
        react_1.default.createElement(card_1.CardHeader, null,
            react_1.default.createElement(card_1.CardTitle, null, "Error Distribution"),
            react_1.default.createElement(card_1.CardDescription, null, "Types of errors encountered")),
        react_1.default.createElement(card_1.CardContent, null,
            react_1.default.createElement(recharts_1.ResponsiveContainer, { width: "100%", height: 300 },
                react_1.default.createElement(recharts_1.BarChart, { data: data.performance.errorsByType },
                    react_1.default.createElement(recharts_1.CartesianGrid, { strokeDasharray: "3 3", className: "opacity-30" }),
                    react_1.default.createElement(recharts_1.XAxis, { dataKey: "type", angle: -45, textAnchor: "end", height: 80, className: "text-xs" }),
                    react_1.default.createElement(recharts_1.YAxis, { className: "text-xs" }),
                    react_1.default.createElement(recharts_1.Tooltip, { formatter: (value) => [value.toLocaleString(), 'จำนวนข้อผิดพลาด'] }),
                    react_1.default.createElement(recharts_1.Bar, { dataKey: "count", fill: COLORS.danger, radius: [4, 4, 0, 0] }))))));
}
// Combined Analytics Charts Component
function AnalyticsCharts({ data }) {
    if (!data)
        return null;
    return (react_1.default.createElement("div", { className: "space-y-6" },
        react_1.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
            react_1.default.createElement(TrafficOverviewChart, { data: data }),
            react_1.default.createElement(HourlyTrafficChart, { data: data })),
        react_1.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
            react_1.default.createElement(DeviceTypesChart, { data: data }),
            react_1.default.createElement(BrowserChart, { data: data })),
        react_1.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
            react_1.default.createElement(TopPagesChart, { data: data }),
            react_1.default.createElement(GeographicChart, { data: data })),
        react_1.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
            react_1.default.createElement(ChatActivityChart, { data: data }),
            react_1.default.createElement(PerformanceChart, { data: data }))));
}
exports.default = AnalyticsCharts;
