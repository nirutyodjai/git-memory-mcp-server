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
const react_1 = __importStar(require("react"));
const useApi_1 = require("@/hooks/useApi");
const DatabaseDashboard = () => {
    const [stats, setStats] = (0, react_1.useState)({ users: 0, posts: 0, comments: 0, analytics: 0 });
    const [activeTab, setActiveTab] = (0, react_1.useState)('overview');
    const { data: healthData, loading: healthLoading, error: healthError } = (0, useApi_1.useHealthCheck)();
    const { data: usersData, loading: usersLoading, refetch: refetchUsers } = (0, useApi_1.useUsers)({ limit: 5 });
    const { data: postsData, loading: postsLoading, refetch: refetchPosts } = (0, useApi_1.usePosts)({ limit: 5 });
    const { data: commentsData, loading: commentsLoading, refetch: refetchComments } = (0, useApi_1.useComments)({ limit: 5 });
    const { data: analyticsData, loading: analyticsLoading } = (0, useApi_1.useAnalytics)();
    const { trackEvent } = (0, useApi_1.useTrackAnalytics)();
    (0, react_1.useEffect)(() => {
        // Track dashboard view
        trackEvent('system', {
            event: 'dashboard_view',
            category: 'admin',
            metadata: { tab: activeTab }
        });
    }, [activeTab, trackEvent]);
    (0, react_1.useEffect)(() => {
        // Update stats when data changes
        setStats({
            users: usersData?.pagination?.total || 0,
            posts: postsData?.pagination?.total || 0,
            comments: commentsData?.pagination?.total || 0,
            analytics: analyticsData?.summary?.total || 0
        });
    }, [usersData, postsData, commentsData, analyticsData]);
    const refreshAll = () => {
        refetchUsers();
        refetchPosts();
        refetchComments();
        trackEvent('system', {
            event: 'dashboard_refresh',
            category: 'admin'
        });
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy':
            case 'ok':
                return 'text-green-600 bg-green-100';
            case 'unhealthy':
            case 'error':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-yellow-600 bg-yellow-100';
        }
    };
    const StatCard = ({ title, value, icon, color }) => (react_1.default.createElement("div", { className: `p-6 rounded-lg shadow-md ${color} transition-transform hover:scale-105` },
        react_1.default.createElement("div", { className: "flex items-center justify-between" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("p", { className: "text-sm font-medium text-gray-600" }, title),
                react_1.default.createElement("p", { className: "text-3xl font-bold text-gray-900" }, value.toLocaleString())),
            react_1.default.createElement("div", { className: "text-4xl" }, icon))));
    const TabButton = ({ tab, label, isActive }) => (react_1.default.createElement("button", { onClick: () => setActiveTab(tab), className: `px-4 py-2 rounded-lg font-medium transition-colors ${isActive
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}` }, label));
    return (react_1.default.createElement("div", { className: "p-6 max-w-7xl mx-auto" },
        react_1.default.createElement("div", { className: "flex justify-between items-center mb-8" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h1", { className: "text-3xl font-bold text-gray-900" }, "Database Dashboard"),
                react_1.default.createElement("p", { className: "text-gray-600 mt-2" }, "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E41\u0E25\u0E30\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A")),
            react_1.default.createElement("button", { onClick: refreshAll, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2" }, "\uD83D\uDD04 \u0E23\u0E35\u0E40\u0E1F\u0E23\u0E0A")),
        healthData && (react_1.default.createElement("div", { className: "mb-8 p-4 rounded-lg border" },
            react_1.default.createElement("h2", { className: "text-xl font-semibold mb-4" }, "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E23\u0E30\u0E1A\u0E1A"),
            react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                react_1.default.createElement("div", { className: "flex items-center gap-3" },
                    react_1.default.createElement("span", { className: `px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.status)}` }, healthData.status.toUpperCase()),
                    react_1.default.createElement("span", { className: "text-gray-600" }, "\u0E23\u0E30\u0E1A\u0E1A\u0E2B\u0E25\u0E31\u0E01")),
                react_1.default.createElement("div", { className: "flex items-center gap-3" },
                    react_1.default.createElement("span", { className: `px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.services.database.status)}` }, healthData.services.database.status.toUpperCase()),
                    react_1.default.createElement("span", { className: "text-gray-600" }, "\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"))),
            react_1.default.createElement("div", { className: "mt-4 text-sm text-gray-500" },
                react_1.default.createElement("p", null,
                    "Uptime: ",
                    Math.floor(healthData.services.server.uptime / 3600),
                    "h ",
                    Math.floor((healthData.services.server.uptime % 3600) / 60),
                    "m"),
                react_1.default.createElement("p", null,
                    "Memory: ",
                    Math.round(healthData.services.server.memory.used / 1024 / 1024),
                    "MB / ",
                    Math.round(healthData.services.server.memory.total / 1024 / 1024),
                    "MB")))),
        react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" },
            react_1.default.createElement(StatCard, { title: "\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19", value: stats.users, icon: "\uD83D\uDC65", color: "bg-blue-50" }),
            react_1.default.createElement(StatCard, { title: "\u0E42\u0E1E\u0E2A\u0E15\u0E4C", value: stats.posts, icon: "\uD83D\uDCDD", color: "bg-green-50" }),
            react_1.default.createElement(StatCard, { title: "\u0E04\u0E27\u0E32\u0E21\u0E04\u0E34\u0E14\u0E40\u0E2B\u0E47\u0E19", value: stats.comments, icon: "\uD83D\uDCAC", color: "bg-purple-50" }),
            react_1.default.createElement(StatCard, { title: "Analytics Events", value: stats.analytics, icon: "\uD83D\uDCCA", color: "bg-orange-50" })),
        react_1.default.createElement("div", { className: "flex gap-2 mb-6" },
            react_1.default.createElement(TabButton, { tab: "overview", label: "\u0E20\u0E32\u0E1E\u0E23\u0E27\u0E21", isActive: activeTab === 'overview' }),
            react_1.default.createElement(TabButton, { tab: "users", label: "\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19", isActive: activeTab === 'users' }),
            react_1.default.createElement(TabButton, { tab: "posts", label: "\u0E42\u0E1E\u0E2A\u0E15\u0E4C", isActive: activeTab === 'posts' }),
            react_1.default.createElement(TabButton, { tab: "comments", label: "\u0E04\u0E27\u0E32\u0E21\u0E04\u0E34\u0E14\u0E40\u0E2B\u0E47\u0E19", isActive: activeTab === 'comments' }),
            react_1.default.createElement(TabButton, { tab: "analytics", label: "Analytics", isActive: activeTab === 'analytics' })),
        react_1.default.createElement("div", { className: "bg-white rounded-lg shadow-md p-6" },
            activeTab === 'overview' && (react_1.default.createElement("div", null,
                react_1.default.createElement("h3", { className: "text-xl font-semibold mb-4" }, "\u0E20\u0E32\u0E1E\u0E23\u0E27\u0E21\u0E23\u0E30\u0E1A\u0E1A"),
                react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("h4", { className: "font-medium mb-2" }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14"),
                        react_1.default.createElement("ul", { className: "space-y-2 text-sm text-gray-600" },
                            react_1.default.createElement("li", null,
                                "\u2022 \u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14: ",
                                stats.users,
                                " \u0E04\u0E19"),
                            react_1.default.createElement("li", null,
                                "\u2022 \u0E42\u0E1E\u0E2A\u0E15\u0E4C\u0E17\u0E35\u0E48\u0E40\u0E1C\u0E22\u0E41\u0E1E\u0E23\u0E48: ",
                                stats.posts,
                                " \u0E42\u0E1E\u0E2A\u0E15\u0E4C"),
                            react_1.default.createElement("li", null,
                                "\u2022 \u0E04\u0E27\u0E32\u0E21\u0E04\u0E34\u0E14\u0E40\u0E2B\u0E47\u0E19: ",
                                stats.comments,
                                " \u0E04\u0E27\u0E32\u0E21\u0E04\u0E34\u0E14\u0E40\u0E2B\u0E47\u0E19"),
                            react_1.default.createElement("li", null,
                                "\u2022 Analytics Events: ",
                                stats.analytics,
                                " events"))),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("h4", { className: "font-medium mb-2" }, "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E01\u0E32\u0E23\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D"),
                        react_1.default.createElement("div", { className: "space-y-2" },
                            healthLoading && react_1.default.createElement("p", { className: "text-gray-500" }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A..."),
                            healthError && react_1.default.createElement("p", { className: "text-red-500" },
                                "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14: ",
                                healthError),
                            healthData && (react_1.default.createElement("div", { className: "text-sm" },
                                react_1.default.createElement("p", { className: `font-medium ${healthData.status === 'ok' ? 'text-green-600' : 'text-red-600'}` },
                                    "\u0E23\u0E30\u0E1A\u0E1A: ",
                                    healthData.status === 'ok' ? 'ปกติ' : 'มีปัญหา'),
                                react_1.default.createElement("p", { className: `font-medium ${healthData.services.database.status === 'healthy' ? 'text-green-600' : 'text-red-600'}` },
                                    "\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25: ",
                                    healthData.services.database.status === 'healthy' ? 'เชื่อมต่อแล้ว' : 'ไม่สามารถเชื่อมต่อ')))))))),
            activeTab === 'users' && (react_1.default.createElement("div", null,
                react_1.default.createElement("h3", { className: "text-xl font-semibold mb-4" }, "\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14"),
                usersLoading ? (react_1.default.createElement("p", { className: "text-gray-500" }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...")) : usersData && usersData.length > 0 ? (react_1.default.createElement("div", { className: "overflow-x-auto" },
                    react_1.default.createElement("table", { className: "w-full text-sm" },
                        react_1.default.createElement("thead", null,
                            react_1.default.createElement("tr", { className: "border-b" },
                                react_1.default.createElement("th", { className: "text-left py-2" }, "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49"),
                                react_1.default.createElement("th", { className: "text-left py-2" }, "\u0E2D\u0E35\u0E40\u0E21\u0E25"),
                                react_1.default.createElement("th", { className: "text-left py-2" }, "\u0E1A\u0E17\u0E1A\u0E32\u0E17"),
                                react_1.default.createElement("th", { className: "text-left py-2" }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E21\u0E31\u0E04\u0E23"),
                                react_1.default.createElement("th", { className: "text-left py-2" }, "\u0E42\u0E1E\u0E2A\u0E15\u0E4C"))),
                        react_1.default.createElement("tbody", null, usersData.map((user) => (react_1.default.createElement("tr", { key: user.id, className: "border-b hover:bg-gray-50" },
                            react_1.default.createElement("td", { className: "py-2" },
                                react_1.default.createElement("div", { className: "flex items-center gap-2" },
                                    user.avatar ? (react_1.default.createElement("img", { src: user.avatar, alt: user.username, className: "w-6 h-6 rounded-full" })) : (react_1.default.createElement("div", { className: "w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs" }, user.username[0].toUpperCase())),
                                    react_1.default.createElement("span", { className: "font-medium" }, user.username),
                                    user.verified && react_1.default.createElement("span", { className: "text-blue-500" }, "\u2713"))),
                            react_1.default.createElement("td", { className: "py-2 text-gray-600" }, user.email),
                            react_1.default.createElement("td", { className: "py-2" },
                                react_1.default.createElement("span", { className: `px-2 py-1 rounded text-xs ${user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                                        user.role === 'MODERATOR' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'}` }, user.role)),
                            react_1.default.createElement("td", { className: "py-2 text-gray-600" }, new Date(user.createdAt).toLocaleDateString('th-TH')),
                            react_1.default.createElement("td", { className: "py-2 text-gray-600" }, user._count?.posts || 0)))))))) : (react_1.default.createElement("p", { className: "text-gray-500" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19")))),
            activeTab === 'posts' && (react_1.default.createElement("div", null,
                react_1.default.createElement("h3", { className: "text-xl font-semibold mb-4" }, "\u0E42\u0E1E\u0E2A\u0E15\u0E4C\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14"),
                postsLoading ? (react_1.default.createElement("p", { className: "text-gray-500" }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...")) : postsData && postsData.length > 0 ? (react_1.default.createElement("div", { className: "space-y-4" }, postsData.map((post) => (react_1.default.createElement("div", { key: post.id, className: "border rounded-lg p-4 hover:bg-gray-50" },
                    react_1.default.createElement("div", { className: "flex justify-between items-start mb-2" },
                        react_1.default.createElement("h4", { className: "font-medium text-lg" }, post.title),
                        react_1.default.createElement("div", { className: "flex gap-2" },
                            post.published && react_1.default.createElement("span", { className: "px-2 py-1 bg-green-100 text-green-700 text-xs rounded" }, "\u0E40\u0E1C\u0E22\u0E41\u0E1E\u0E23\u0E48"),
                            post.featured && react_1.default.createElement("span", { className: "px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded" }, "\u0E41\u0E19\u0E30\u0E19\u0E33"))),
                    react_1.default.createElement("p", { className: "text-gray-600 text-sm mb-2" }, post.excerpt || post.content.substring(0, 150) + '...'),
                    react_1.default.createElement("div", { className: "flex justify-between items-center text-sm text-gray-500" },
                        react_1.default.createElement("span", null,
                            "\u0E42\u0E14\u0E22 ",
                            post.author.name || post.author.username),
                        react_1.default.createElement("div", { className: "flex gap-4" },
                            react_1.default.createElement("span", null,
                                "\uD83D\uDCAC ",
                                post._count.comments),
                            react_1.default.createElement("span", null,
                                "\u2764\uFE0F ",
                                post._count.likes),
                            react_1.default.createElement("span", null, new Date(post.createdAt).toLocaleDateString('th-TH')))),
                    post.tags.length > 0 && (react_1.default.createElement("div", { className: "flex gap-1 mt-2" }, post.tags.map((tag, index) => (react_1.default.createElement("span", { key: index, className: "px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded" },
                        "#",
                        tag)))))))))) : (react_1.default.createElement("p", { className: "text-gray-500" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E42\u0E1E\u0E2A\u0E15\u0E4C")))),
            activeTab === 'comments' && (react_1.default.createElement("div", null,
                react_1.default.createElement("h3", { className: "text-xl font-semibold mb-4" }, "\u0E04\u0E27\u0E32\u0E21\u0E04\u0E34\u0E14\u0E40\u0E2B\u0E47\u0E19\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14"),
                commentsLoading ? (react_1.default.createElement("p", { className: "text-gray-500" }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...")) : commentsData && commentsData.length > 0 ? (react_1.default.createElement("div", { className: "space-y-4" }, commentsData.map((comment) => (react_1.default.createElement("div", { key: comment.id, className: "border rounded-lg p-4 hover:bg-gray-50" },
                    react_1.default.createElement("div", { className: "flex justify-between items-start mb-2" },
                        react_1.default.createElement("div", { className: "flex items-center gap-2" },
                            comment.author.avatar ? (react_1.default.createElement("img", { src: comment.author.avatar, alt: comment.author.username, className: "w-8 h-8 rounded-full" })) : (react_1.default.createElement("div", { className: "w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm" }, comment.author.username[0].toUpperCase())),
                            react_1.default.createElement("span", { className: "font-medium" }, comment.author.name || comment.author.username)),
                        react_1.default.createElement("span", { className: "text-sm text-gray-500" }, new Date(comment.createdAt).toLocaleDateString('th-TH'))),
                    react_1.default.createElement("p", { className: "text-gray-700 mb-2" }, comment.content),
                    react_1.default.createElement("div", { className: "flex justify-between items-center text-sm text-gray-500" },
                        react_1.default.createElement("span", null,
                            "\u0E43\u0E19: ",
                            comment.post.title),
                        react_1.default.createElement("div", { className: "flex gap-4" },
                            react_1.default.createElement("span", null,
                                "\u2764\uFE0F ",
                                comment._count.likes),
                            react_1.default.createElement("span", null,
                                "\uD83D\uDCAC ",
                                comment._count.replies))),
                    comment.parent && (react_1.default.createElement("div", { className: "mt-2 p-2 bg-gray-100 rounded text-sm" },
                        react_1.default.createElement("span", { className: "text-gray-600" }, "\u0E15\u0E2D\u0E1A\u0E01\u0E25\u0E31\u0E1A: "),
                        react_1.default.createElement("span", { className: "font-medium" }, comment.parent.author.name || comment.parent.author.username),
                        react_1.default.createElement("p", { className: "text-gray-600 mt-1" },
                            comment.parent.content.substring(0, 100),
                            "...")))))))) : (react_1.default.createElement("p", { className: "text-gray-500" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E04\u0E34\u0E14\u0E40\u0E2B\u0E47\u0E19")))),
            activeTab === 'analytics' && (react_1.default.createElement("div", null,
                react_1.default.createElement("h3", { className: "text-xl font-semibold mb-4" }, "Analytics"),
                analyticsLoading ? (react_1.default.createElement("p", { className: "text-gray-500" }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...")) : analyticsData?.summary ? (react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" },
                    react_1.default.createElement("div", { className: "p-4 border rounded-lg" },
                        react_1.default.createElement("h4", { className: "font-medium text-gray-600" }, "User Events"),
                        react_1.default.createElement("p", { className: "text-2xl font-bold text-blue-600" }, analyticsData.summary.userEvents)),
                    react_1.default.createElement("div", { className: "p-4 border rounded-lg" },
                        react_1.default.createElement("h4", { className: "font-medium text-gray-600" }, "Post Events"),
                        react_1.default.createElement("p", { className: "text-2xl font-bold text-green-600" }, analyticsData.summary.postEvents)),
                    react_1.default.createElement("div", { className: "p-4 border rounded-lg" },
                        react_1.default.createElement("h4", { className: "font-medium text-gray-600" }, "System Events"),
                        react_1.default.createElement("p", { className: "text-2xl font-bold text-purple-600" }, analyticsData.summary.systemEvents)),
                    react_1.default.createElement("div", { className: "p-4 border rounded-lg" },
                        react_1.default.createElement("h4", { className: "font-medium text-gray-600" }, "Total Events"),
                        react_1.default.createElement("p", { className: "text-2xl font-bold text-orange-600" }, analyticsData.summary.total)))) : (react_1.default.createElement("p", { className: "text-gray-500" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 Analytics")))))));
};
exports.default = DatabaseDashboard;
