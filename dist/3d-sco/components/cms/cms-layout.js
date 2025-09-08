"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.CMSLayout = CMSLayout;
exports.CMSSidebar = CMSSidebar;
exports.CMSHeader = CMSHeader;
exports.CMSStats = CMSStats;
exports.CMSContentGrid = CMSContentGrid;
exports.CMSToolbar = CMSToolbar;
exports.CMSContentCard = CMSContentCard;
const react_1 = require("react");
const client_1 = require("@/lib/i18n/client");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const badge_1 = require("@/components/ui/badge");
const separator_1 = require("@/components/ui/separator");
const scroll_area_1 = require("@/components/ui/scroll-area");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
function CMSLayout({ children, sidebar, header, showSidebar = true, sidebarCollapsed = false, onSidebarToggle }) {
    return (React.createElement("div", { className: "flex h-screen bg-background" },
        showSidebar && (React.createElement("div", { className: (0, utils_1.cn)("border-r bg-card transition-all duration-300", sidebarCollapsed ? "w-16" : "w-64") }, sidebar)),
        React.createElement("div", { className: "flex-1 flex flex-col overflow-hidden" },
            header && (React.createElement("div", { className: "border-b bg-card" }, header)),
            React.createElement("main", { className: "flex-1 overflow-auto" },
                React.createElement("div", { className: "container mx-auto p-6" }, children)))));
}
function CMSSidebar({ collapsed = false, onToggle, activeTab = 'dashboard', onTabChange }) {
    const { t } = (0, client_1.useI18n)();
    const menuItems = [
        {
            id: 'dashboard',
            label: t('cms.dashboard.title'),
            icon: React.createElement(lucide_react_1.LayoutDashboard, { className: "w-5 h-5" }),
            href: '/admin/cms'
        },
        {
            id: 'content',
            label: t('cms.content.title'),
            icon: React.createElement(lucide_react_1.FileText, { className: "w-5 h-5" }),
            href: '/admin/cms/content',
            badge: '12'
        },
        {
            id: 'categories',
            label: t('cms.categories.title'),
            icon: React.createElement(lucide_react_1.FolderTree, { className: "w-5 h-5" }),
            href: '/admin/cms/categories'
        },
        {
            id: 'media',
            label: t('cms.media.title'),
            icon: React.createElement(lucide_react_1.Image, { className: "w-5 h-5" }),
            href: '/admin/cms/media',
            badge: '48'
        },
        {
            id: 'analytics',
            label: t('cms.analytics.title'),
            icon: React.createElement(lucide_react_1.BarChart3, { className: "w-5 h-5" }),
            href: '/admin/cms/analytics'
        },
        {
            id: 'settings',
            label: t('common.settings'),
            icon: React.createElement(lucide_react_1.Settings, { className: "w-5 h-5" }),
            href: '/admin/cms/settings'
        }
    ];
    return (React.createElement("div", { className: "flex flex-col h-full" },
        React.createElement("div", { className: "p-4 border-b" },
            React.createElement("div", { className: "flex items-center justify-between" },
                !collapsed && (React.createElement("h2", { className: "text-lg font-semibold" }, t('cms.dashboard.title'))),
                onToggle && (React.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: onToggle, className: "ml-auto" }, collapsed ? React.createElement(lucide_react_1.ChevronRight, { className: "w-4 h-4" }) : React.createElement(lucide_react_1.ChevronLeft, { className: "w-4 h-4" }))))),
        React.createElement(scroll_area_1.ScrollArea, { className: "flex-1" },
            React.createElement("nav", { className: "p-2" }, menuItems.map((item) => (React.createElement(button_1.Button, { key: item.id, variant: activeTab === item.id ? 'secondary' : 'ghost', className: (0, utils_1.cn)("w-full justify-start mb-1", collapsed ? "px-2" : "px-3"), onClick: () => onTabChange?.(item.id) },
                item.icon,
                !collapsed && (React.createElement(React.Fragment, null,
                    React.createElement("span", { className: "ml-3" }, item.label),
                    item.badge && (React.createElement(badge_1.Badge, { variant: "secondary", className: "ml-auto" }, item.badge)))))))))));
}
function CMSHeader({ title, description, actions, breadcrumbs }) {
    return (React.createElement("div", { className: "p-6" },
        breadcrumbs && breadcrumbs.length > 0 && (React.createElement("nav", { className: "flex items-center space-x-2 text-sm text-muted-foreground mb-4" }, breadcrumbs.map((crumb, index) => (React.createElement("div", { key: index, className: "flex items-center" },
            index > 0 && React.createElement("span", { className: "mx-2" }, "/"),
            React.createElement("span", { className: index === breadcrumbs.length - 1 ? 'text-foreground' : '' }, crumb.label)))))),
        React.createElement("div", { className: "flex items-center justify-between" },
            React.createElement("div", null,
                title && React.createElement("h1", { className: "text-3xl font-bold" }, title),
                description && (React.createElement("p", { className: "text-muted-foreground mt-2" }, description))),
            actions && (React.createElement("div", { className: "flex items-center gap-2" }, actions)))));
}
function CMSStats({ stats }) {
    return (React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" }, stats.map((stat, index) => (React.createElement(card_1.Card, { key: index },
        React.createElement(card_1.CardContent, { className: "p-6" },
            React.createElement("div", { className: "flex items-center justify-between" },
                React.createElement("div", null,
                    React.createElement("p", { className: "text-sm font-medium text-muted-foreground" }, stat.label),
                    React.createElement("p", { className: "text-2xl font-bold" }, stat.value),
                    stat.trend && (React.createElement("p", { className: (0, utils_1.cn)("text-xs", stat.trend.isPositive ? "text-green-600" : "text-red-600") },
                        stat.trend.isPositive ? '+' : '',
                        stat.trend.value,
                        "%"))),
                React.createElement("div", { className: "text-muted-foreground" }, stat.icon))))))));
}
function CMSContentGrid({ children, columns = 3, gap = 'md' }) {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    };
    const gapSize = {
        sm: 'gap-4',
        md: 'gap-6',
        lg: 'gap-8'
    };
    return (React.createElement("div", { className: (0, utils_1.cn)('grid', gridCols[columns], gapSize[gap]) }, children));
}
function CMSToolbar({ searchPlaceholder = 'Search...', onSearch, filters, actions, viewMode = 'grid', onViewModeChange }) {
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const handleSearch = (value) => {
        setSearchQuery(value);
        onSearch?.(value);
    };
    return (React.createElement("div", { className: "flex flex-col sm:flex-row gap-4 mb-6" },
        React.createElement("div", { className: "flex-1 flex gap-2" },
            React.createElement("div", { className: "relative flex-1" },
                React.createElement(lucide_react_1.Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" }),
                React.createElement("input", { type: "text", placeholder: searchPlaceholder, value: searchQuery, onChange: (e) => handleSearch(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring" })),
            filters && (React.createElement(button_1.Button, { variant: "outline", size: "sm" },
                React.createElement(lucide_react_1.Filter, { className: "w-4 h-4 mr-2" }),
                "Filters"))),
        React.createElement("div", { className: "flex items-center gap-2" },
            onViewModeChange && (React.createElement("div", { className: "flex border rounded-md" },
                React.createElement(button_1.Button, { variant: viewMode === 'grid' ? 'secondary' : 'ghost', size: "sm", onClick: () => onViewModeChange('grid'), className: "rounded-r-none" },
                    React.createElement(lucide_react_1.Grid3X3, { className: "w-4 h-4" })),
                React.createElement(button_1.Button, { variant: viewMode === 'list' ? 'secondary' : 'ghost', size: "sm", onClick: () => onViewModeChange('list'), className: "rounded-l-none border-l" },
                    React.createElement(lucide_react_1.List, { className: "w-4 h-4" })))),
            actions)));
}
function CMSContentCard({ title, description, image, status, type, author, publishedAt, tags, onEdit, onDelete, onView }) {
    const { t } = (0, client_1.useI18n)();
    const statusColors = {
        draft: 'bg-yellow-100 text-yellow-800',
        published: 'bg-green-100 text-green-800',
        archived: 'bg-gray-100 text-gray-800'
    };
    return (React.createElement(card_1.Card, { className: "group hover:shadow-lg transition-shadow" },
        image && (React.createElement("div", { className: "aspect-video overflow-hidden rounded-t-lg" },
            React.createElement("img", { src: image, alt: title, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" }))),
        React.createElement(card_1.CardHeader, null,
            React.createElement("div", { className: "flex items-center justify-between mb-2" },
                React.createElement(badge_1.Badge, { className: statusColors[status] }, t(`cms.content.status.${status}`)),
                React.createElement(badge_1.Badge, { variant: "outline" }, t(`cms.content.type.${type}`))),
            React.createElement(card_1.CardTitle, { className: "line-clamp-2" }, title)),
        React.createElement(card_1.CardContent, null,
            description && (React.createElement("p", { className: "text-muted-foreground mb-4 line-clamp-3" }, description)),
            React.createElement("div", { className: "space-y-3" },
                tags && tags.length > 0 && (React.createElement("div", { className: "flex flex-wrap gap-1" },
                    tags.slice(0, 3).map((tag, index) => (React.createElement(badge_1.Badge, { key: index, variant: "outline", className: "text-xs" },
                        React.createElement(lucide_react_1.Tag, { className: "w-3 h-3 mr-1" }),
                        tag))),
                    tags.length > 3 && (React.createElement(badge_1.Badge, { variant: "outline", className: "text-xs" },
                        "+",
                        tags.length - 3)))),
                React.createElement("div", { className: "flex items-center justify-between text-sm text-muted-foreground" },
                    React.createElement("div", { className: "flex items-center gap-4" },
                        author && (React.createElement("div", { className: "flex items-center" },
                            React.createElement(lucide_react_1.User, { className: "w-4 h-4 mr-1" }),
                            author)),
                        publishedAt && (React.createElement("div", { className: "flex items-center" },
                            React.createElement(lucide_react_1.Calendar, { className: "w-4 h-4 mr-1" }),
                            publishedAt.toLocaleDateString())))),
                React.createElement(separator_1.Separator, null),
                React.createElement("div", { className: "flex items-center justify-between" },
                    React.createElement("div", { className: "flex gap-1" },
                        onView && (React.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: onView },
                            React.createElement(lucide_react_1.Eye, { className: "w-4 h-4" }))),
                        onEdit && (React.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: onEdit },
                            React.createElement(lucide_react_1.Edit, { className: "w-4 h-4" }))),
                        onDelete && (React.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: onDelete },
                            React.createElement(lucide_react_1.Trash2, { className: "w-4 h-4" })))))))));
}
exports.default = CMSLayout;
