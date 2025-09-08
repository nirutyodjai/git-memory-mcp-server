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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogList = BlogList;
const react_1 = __importStar(require("react"));
const blog_provider_1 = require("./blog-provider");
const use_translation_1 = require("@/lib/i18n/use-translation");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const badge_1 = require("@/components/ui/badge");
const card_1 = require("@/components/ui/card");
const select_1 = require("@/components/ui/select");
const lucide_react_1 = require("lucide-react");
const date_fns_1 = require("date-fns");
const link_1 = __importDefault(require("next/link"));
const image_1 = __importDefault(require("next/image"));
function BlogList({ showFilters = true, showSearch = true, limit, categoryId, authorId, status = 'published', variant = 'grid', }) {
    const { t } = (0, use_translation_1.useTranslation)();
    const { state, loadPosts, loadCategories } = (0, blog_provider_1.useBlog)();
    const [filters, setFilters] = (0, react_1.useState)({
        status,
        category: categoryId,
        author: authorId,
        limit,
        page: 1,
        sortBy: 'publishedAt',
        sortOrder: 'desc',
    });
    const [viewMode, setViewMode] = (0, react_1.useState)(variant);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        loadCategories();
        loadPosts(filters);
    }, [loadCategories, loadPosts, filters]);
    const handleSearch = (query) => {
        setSearchQuery(query);
        setFilters(prev => ({ ...prev, query, page: 1 }));
    };
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };
    const handlePageChange = (page) => {
        setFilters(prev => ({ ...prev, page }));
    };
    const renderPostCard = (post) => {
        const isGridView = viewMode === 'grid';
        return (react_1.default.createElement(card_1.Card, { key: post.id, className: `overflow-hidden hover:shadow-lg transition-shadow ${isGridView ? '' : 'flex flex-row'}` },
            post.featuredImage && (react_1.default.createElement("div", { className: `relative ${isGridView ? 'h-48 w-full' : 'h-32 w-48 flex-shrink-0'}` },
                react_1.default.createElement(image_1.default, { src: post.featuredImage, alt: post.title, fill: true, className: "object-cover" }))),
            react_1.default.createElement("div", { className: `${isGridView ? '' : 'flex-1'}` },
                react_1.default.createElement(card_1.CardHeader, { className: `${isGridView ? 'pb-2' : 'pb-1'}` },
                    react_1.default.createElement("div", { className: "flex items-center gap-2 text-sm text-muted-foreground mb-2" },
                        react_1.default.createElement(badge_1.Badge, { variant: "secondary", style: { backgroundColor: post.category.color + '20', color: post.category.color } }, post.category.name),
                        react_1.default.createElement("span", { className: "flex items-center gap-1" },
                            react_1.default.createElement(lucide_react_1.Calendar, { className: "h-3 w-3" }),
                            (0, date_fns_1.format)(new Date(post.publishedAt || post.createdAt), 'MMM dd, yyyy'))),
                    react_1.default.createElement(card_1.CardTitle, { className: `${isGridView ? 'text-lg' : 'text-base'} line-clamp-2` },
                        react_1.default.createElement(link_1.default, { href: `/blog/${post.slug}`, className: "hover:text-primary transition-colors" }, post.title))),
                react_1.default.createElement(card_1.CardContent, { className: `${isGridView ? 'pt-0' : 'pt-0 pb-2'}` },
                    react_1.default.createElement("p", { className: `text-muted-foreground mb-4 ${isGridView ? 'line-clamp-3' : 'line-clamp-2'}` }, post.excerpt),
                    react_1.default.createElement("div", { className: "flex items-center justify-between" },
                        react_1.default.createElement("div", { className: "flex items-center gap-4 text-sm text-muted-foreground" },
                            react_1.default.createElement("span", { className: "flex items-center gap-1" },
                                react_1.default.createElement(lucide_react_1.User, { className: "h-3 w-3" }),
                                post.author.name),
                            react_1.default.createElement("span", { className: "flex items-center gap-1" },
                                react_1.default.createElement(lucide_react_1.Eye, { className: "h-3 w-3" }),
                                post.views),
                            react_1.default.createElement("span", { className: "flex items-center gap-1" },
                                react_1.default.createElement(lucide_react_1.Heart, { className: "h-3 w-3" }),
                                post.likes),
                            react_1.default.createElement("span", { className: "flex items-center gap-1" },
                                react_1.default.createElement(lucide_react_1.MessageCircle, { className: "h-3 w-3" }),
                                post.comments.length)),
                        post.tags.length > 0 && (react_1.default.createElement("div", { className: "flex gap-1 flex-wrap" },
                            post.tags.slice(0, isGridView ? 3 : 2).map(tag => (react_1.default.createElement(badge_1.Badge, { key: tag, variant: "outline", className: "text-xs" }, tag))),
                            post.tags.length > (isGridView ? 3 : 2) && (react_1.default.createElement(badge_1.Badge, { variant: "outline", className: "text-xs" },
                                "+",
                                post.tags.length - (isGridView ? 3 : 2))))))))));
    };
    const renderPagination = () => {
        if (!state.searchResult || state.searchResult.totalPages <= 1)
            return null;
        const { page, totalPages } = state.searchResult;
        const pages = [];
        for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
            pages.push(i);
        }
        return (react_1.default.createElement("div", { className: "flex items-center justify-center gap-2 mt-8" },
            react_1.default.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: () => handlePageChange(page - 1), disabled: page === 1 }, t('common.previous')),
            pages.map(pageNum => (react_1.default.createElement(button_1.Button, { key: pageNum, variant: pageNum === page ? 'default' : 'outline', size: "sm", onClick: () => handlePageChange(pageNum) }, pageNum))),
            react_1.default.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: () => handlePageChange(page + 1), disabled: page === totalPages }, t('common.next'))));
    };
    return (react_1.default.createElement("div", { className: "space-y-6" },
        react_1.default.createElement("div", { className: "flex items-center justify-between" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h1", { className: "text-3xl font-bold" }, t('blog.title')),
                react_1.default.createElement("p", { className: "text-muted-foreground mt-1" }, state.searchResult ?
                    t('blog.postsFound', { count: state.searchResult.total }) :
                    t('blog.description'))),
            react_1.default.createElement("div", { className: "flex items-center gap-2" },
                react_1.default.createElement(button_1.Button, { variant: viewMode === 'grid' ? 'default' : 'outline', size: "sm", onClick: () => setViewMode('grid') },
                    react_1.default.createElement(lucide_react_1.Grid, { className: "h-4 w-4" })),
                react_1.default.createElement(button_1.Button, { variant: viewMode === 'list' ? 'default' : 'outline', size: "sm", onClick: () => setViewMode('list') },
                    react_1.default.createElement(lucide_react_1.List, { className: "h-4 w-4" })))),
        (showSearch || showFilters) && (react_1.default.createElement(card_1.Card, null,
            react_1.default.createElement(card_1.CardContent, { className: "pt-6" },
                react_1.default.createElement("div", { className: "space-y-4" },
                    showSearch && (react_1.default.createElement("div", { className: "relative" },
                        react_1.default.createElement(lucide_react_1.Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
                        react_1.default.createElement(input_1.Input, { placeholder: t('blog.search.placeholder'), value: searchQuery, onChange: (e) => handleSearch(e.target.value), className: "pl-10" }))),
                    showFilters && (react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4" },
                        react_1.default.createElement(select_1.Select, { value: filters.category || '', onValueChange: (value) => handleFilterChange('category', value || undefined) },
                            react_1.default.createElement(select_1.SelectTrigger, null,
                                react_1.default.createElement(select_1.SelectValue, { placeholder: t('blog.filters.category') })),
                            react_1.default.createElement(select_1.SelectContent, null,
                                react_1.default.createElement(select_1.SelectItem, { value: "" }, t('blog.filters.allCategories')),
                                state.categories.map(category => (react_1.default.createElement(select_1.SelectItem, { key: category.id, value: category.slug },
                                    category.name,
                                    " (",
                                    category.postCount,
                                    ")"))))),
                        react_1.default.createElement(select_1.Select, { value: filters.sortBy || 'publishedAt', onValueChange: (value) => handleFilterChange('sortBy', value) },
                            react_1.default.createElement(select_1.SelectTrigger, null,
                                react_1.default.createElement(select_1.SelectValue, { placeholder: t('blog.filters.sortBy') })),
                            react_1.default.createElement(select_1.SelectContent, null,
                                react_1.default.createElement(select_1.SelectItem, { value: "publishedAt" }, t('blog.sort.newest')),
                                react_1.default.createElement(select_1.SelectItem, { value: "views" }, t('blog.sort.popular')),
                                react_1.default.createElement(select_1.SelectItem, { value: "likes" }, t('blog.sort.liked')),
                                react_1.default.createElement(select_1.SelectItem, { value: "title" }, t('blog.sort.title')))),
                        react_1.default.createElement(select_1.Select, { value: filters.sortOrder || 'desc', onValueChange: (value) => handleFilterChange('sortOrder', value) },
                            react_1.default.createElement(select_1.SelectTrigger, null,
                                react_1.default.createElement(select_1.SelectValue, { placeholder: t('blog.filters.order') })),
                            react_1.default.createElement(select_1.SelectContent, null,
                                react_1.default.createElement(select_1.SelectItem, { value: "desc" }, t('blog.sort.descending')),
                                react_1.default.createElement(select_1.SelectItem, { value: "asc" }, t('blog.sort.ascending')))),
                        react_1.default.createElement(select_1.Select, { value: filters.limit?.toString() || '10', onValueChange: (value) => handleFilterChange('limit', parseInt(value)) },
                            react_1.default.createElement(select_1.SelectTrigger, null,
                                react_1.default.createElement(select_1.SelectValue, { placeholder: t('blog.filters.perPage') })),
                            react_1.default.createElement(select_1.SelectContent, null,
                                react_1.default.createElement(select_1.SelectItem, { value: "5" },
                                    "5 ",
                                    t('blog.filters.posts')),
                                react_1.default.createElement(select_1.SelectItem, { value: "10" },
                                    "10 ",
                                    t('blog.filters.posts')),
                                react_1.default.createElement(select_1.SelectItem, { value: "20" },
                                    "20 ",
                                    t('blog.filters.posts')),
                                react_1.default.createElement(select_1.SelectItem, { value: "50" },
                                    "50 ",
                                    t('blog.filters.posts')))))))))),
        state.loading && (react_1.default.createElement("div", { className: "flex items-center justify-center py-12" },
            react_1.default.createElement("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }))),
        state.error && (react_1.default.createElement(card_1.Card, null,
            react_1.default.createElement(card_1.CardContent, { className: "pt-6" },
                react_1.default.createElement("div", { className: "text-center py-8" },
                    react_1.default.createElement("p", { className: "text-destructive mb-4" }, state.error),
                    react_1.default.createElement(button_1.Button, { onClick: () => loadPosts(filters) }, t('common.retry')))))),
        !state.loading && !state.error && state.searchResult && (react_1.default.createElement(react_1.default.Fragment, null,
            state.searchResult.posts.length === 0 ? (react_1.default.createElement(card_1.Card, null,
                react_1.default.createElement(card_1.CardContent, { className: "pt-6" },
                    react_1.default.createElement("div", { className: "text-center py-12" },
                        react_1.default.createElement("h3", { className: "text-lg font-semibold mb-2" }, t('blog.empty.title')),
                        react_1.default.createElement("p", { className: "text-muted-foreground mb-4" }, t('blog.empty.description')),
                        react_1.default.createElement(button_1.Button, { onClick: () => {
                                setSearchQuery('');
                                setFilters({ status, page: 1, sortBy: 'publishedAt', sortOrder: 'desc' });
                            } }, t('blog.empty.clearFilters')))))) : (react_1.default.createElement("div", { className: `${viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'}` }, state.searchResult.posts.map(renderPostCard))),
            renderPagination()))));
}
