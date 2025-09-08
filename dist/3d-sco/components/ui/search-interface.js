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
exports.SearchInput = SearchInput;
exports.FilterPanel = FilterPanel;
exports.SearchResults = SearchResults;
exports.SearchInterface = SearchInterface;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const badge_1 = require("@/components/ui/badge");
const card_1 = require("@/components/ui/card");
const select_1 = require("@/components/ui/select");
const popover_1 = require("@/components/ui/popover");
const separator_1 = require("@/components/ui/separator");
const skeleton_1 = require("@/components/ui/skeleton");
const use_search_1 = require("@/hooks/use-search");
const utils_1 = require("@/lib/utils");
function SearchInput({ value, onChange, onSearch, placeholder = "ค้นหาโปรเจค, บล็อก, หรือทักษะ...", showSuggestions = true, className, }) {
    const [isFocused, setIsFocused] = (0, react_1.useState)(false);
    const { suggestions, isLoading: suggestionsLoading } = (0, use_search_1.useSearchSuggestions)(value);
    const { history, addToHistory, removeFromHistory } = (0, use_search_1.useSearchHistory)();
    const inputRef = (0, react_1.useRef)(null);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (value.trim()) {
            addToHistory(value.trim());
            onSearch?.();
            setIsFocused(false);
        }
    };
    const handleSuggestionClick = (suggestion) => {
        onChange(suggestion);
        addToHistory(suggestion);
        onSearch?.();
        setIsFocused(false);
    };
    const showDropdown = isFocused && showSuggestions && (suggestions.length > 0 || history.length > 0);
    return (react_1.default.createElement("div", { className: (0, utils_1.cn)("relative w-full", className) },
        react_1.default.createElement("form", { onSubmit: handleSubmit, className: "relative" },
            react_1.default.createElement(lucide_react_1.Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            react_1.default.createElement(input_1.Input, { ref: inputRef, type: "text", value: value, onChange: (e) => onChange(e.target.value), onFocus: () => setIsFocused(true), onBlur: () => setTimeout(() => setIsFocused(false), 200), placeholder: placeholder, className: "pl-10 pr-4" })),
        showDropdown && (react_1.default.createElement(card_1.Card, { className: "absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto" },
            react_1.default.createElement(card_1.CardContent, { className: "p-2" },
                suggestions.length > 0 && (react_1.default.createElement("div", { className: "space-y-1" },
                    react_1.default.createElement("div", { className: "px-2 py-1 text-xs font-medium text-muted-foreground" }, "\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33"),
                    suggestions.map((suggestion, index) => (react_1.default.createElement("button", { key: index, onClick: () => handleSuggestionClick(suggestion), className: "w-full text-left px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors" },
                        react_1.default.createElement(lucide_react_1.Search, { className: "inline h-3 w-3 mr-2 text-muted-foreground" }),
                        suggestion))))),
                history.length > 0 && suggestions.length > 0 && (react_1.default.createElement(separator_1.Separator, { className: "my-2" })),
                history.length > 0 && (react_1.default.createElement("div", { className: "space-y-1" },
                    react_1.default.createElement("div", { className: "px-2 py-1 text-xs font-medium text-muted-foreground flex items-center justify-between" },
                        "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E04\u0E49\u0E19\u0E2B\u0E32",
                        react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => history.forEach(removeFromHistory), className: "h-auto p-0 text-xs" }, "\u0E25\u0E49\u0E32\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14")),
                    history.slice(0, 5).map((item, index) => (react_1.default.createElement("div", { key: index, className: "flex items-center justify-between group" },
                        react_1.default.createElement("button", { onClick: () => handleSuggestionClick(item), className: "flex-1 text-left px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors" },
                            react_1.default.createElement(lucide_react_1.Clock, { className: "inline h-3 w-3 mr-2 text-muted-foreground" }),
                            item),
                        react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => removeFromHistory(item), className: "h-auto p-1 opacity-0 group-hover:opacity-100 transition-opacity" },
                            react_1.default.createElement(lucide_react_1.X, { className: "h-3 w-3" }))))))))))));
}
function FilterPanel({ filters, availableFilters, onFiltersChange, onReset }) {
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const updateFilter = (key, value) => {
        onFiltersChange({ ...filters, [key]: value });
    };
    const removeFilter = (key) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        onFiltersChange(newFilters);
    };
    const activeFiltersCount = Object.keys(filters).filter(key => {
        const value = filters[key];
        return value && (Array.isArray(value) ? value.length > 0 : true);
    }).length;
    return (react_1.default.createElement(popover_1.Popover, { open: isOpen, onOpenChange: setIsOpen },
        react_1.default.createElement(popover_1.PopoverTrigger, { asChild: true },
            react_1.default.createElement(button_1.Button, { variant: "outline", className: "relative" },
                react_1.default.createElement(lucide_react_1.Filter, { className: "h-4 w-4 mr-2" }),
                "\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07",
                activeFiltersCount > 0 && (react_1.default.createElement(badge_1.Badge, { variant: "secondary", className: "ml-2 h-5 w-5 p-0 text-xs" }, activeFiltersCount)))),
        react_1.default.createElement(popover_1.PopoverContent, { className: "w-80", align: "start" },
            react_1.default.createElement("div", { className: "space-y-4" },
                react_1.default.createElement("div", { className: "flex items-center justify-between" },
                    react_1.default.createElement("h4", { className: "font-medium" }, "\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E04\u0E49\u0E19\u0E2B\u0E32"),
                    react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: onReset }, "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15")),
                react_1.default.createElement("div", { className: "space-y-2" },
                    react_1.default.createElement("label", { className: "text-sm font-medium" }, "\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48"),
                    react_1.default.createElement(select_1.Select, { value: filters.category || '', onValueChange: (value) => updateFilter('category', value || undefined) },
                        react_1.default.createElement(select_1.SelectTrigger, null,
                            react_1.default.createElement(select_1.SelectValue, { placeholder: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48" })),
                        react_1.default.createElement(select_1.SelectContent, null,
                            react_1.default.createElement(select_1.SelectItem, { value: "" }, "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"),
                            availableFilters?.categories?.map((category) => (react_1.default.createElement(select_1.SelectItem, { key: category, value: category }, category)))))),
                react_1.default.createElement("div", { className: "space-y-2" },
                    react_1.default.createElement("label", { className: "text-sm font-medium" }, "\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E01"),
                    react_1.default.createElement(select_1.Select, { value: filters.difficulty || '', onValueChange: (value) => updateFilter('difficulty', value || undefined) },
                        react_1.default.createElement(select_1.SelectTrigger, null,
                            react_1.default.createElement(select_1.SelectValue, { placeholder: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E01" })),
                        react_1.default.createElement(select_1.SelectContent, null,
                            react_1.default.createElement(select_1.SelectItem, { value: "" }, "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"),
                            react_1.default.createElement(select_1.SelectItem, { value: "beginner" }, "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19"),
                            react_1.default.createElement(select_1.SelectItem, { value: "intermediate" }, "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07"),
                            react_1.default.createElement(select_1.SelectItem, { value: "advanced" }, "\u0E02\u0E31\u0E49\u0E19\u0E2A\u0E39\u0E07")))),
                react_1.default.createElement("div", { className: "space-y-2" },
                    react_1.default.createElement("label", { className: "text-sm font-medium" }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"),
                    react_1.default.createElement(select_1.Select, { value: filters.status || '', onValueChange: (value) => updateFilter('status', value || undefined) },
                        react_1.default.createElement(select_1.SelectTrigger, null,
                            react_1.default.createElement(select_1.SelectValue, { placeholder: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E16\u0E32\u0E19\u0E30" })),
                        react_1.default.createElement(select_1.SelectContent, null,
                            react_1.default.createElement(select_1.SelectItem, { value: "" }, "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"),
                            react_1.default.createElement(select_1.SelectItem, { value: "active" }, "\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E39\u0E48"),
                            react_1.default.createElement(select_1.SelectItem, { value: "completed" }, "\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E2A\u0E34\u0E49\u0E19"),
                            react_1.default.createElement(select_1.SelectItem, { value: "archived" }, "\u0E40\u0E01\u0E47\u0E1A\u0E16\u0E32\u0E27\u0E23")))),
                availableFilters?.tags && (react_1.default.createElement("div", { className: "space-y-2" },
                    react_1.default.createElement("label", { className: "text-sm font-medium" }, "\u0E41\u0E17\u0E47\u0E01"),
                    react_1.default.createElement("div", { className: "flex flex-wrap gap-1 max-h-32 overflow-y-auto" }, availableFilters.tags.slice(0, 20).map((tag) => {
                        const isSelected = filters.tags?.includes(tag);
                        return (react_1.default.createElement(badge_1.Badge, { key: tag, variant: isSelected ? "default" : "outline", className: "cursor-pointer text-xs", onClick: () => {
                                const currentTags = filters.tags || [];
                                const newTags = isSelected
                                    ? currentTags.filter((t) => t !== tag)
                                    : [...currentTags, tag];
                                updateFilter('tags', newTags.length > 0 ? newTags : undefined);
                            } },
                            react_1.default.createElement(lucide_react_1.Tag, { className: "h-3 w-3 mr-1" }),
                            tag));
                    }))))))));
}
function SearchResults({ results, isLoading, viewMode, onViewModeChange }) {
    if (isLoading) {
        return (react_1.default.createElement("div", { className: "space-y-4" }, Array.from({ length: 6 }).map((_, i) => (react_1.default.createElement(card_1.Card, { key: i },
            react_1.default.createElement(card_1.CardHeader, null,
                react_1.default.createElement(skeleton_1.Skeleton, { className: "h-4 w-3/4" }),
                react_1.default.createElement(skeleton_1.Skeleton, { className: "h-3 w-1/2" })),
            react_1.default.createElement(card_1.CardContent, null,
                react_1.default.createElement(skeleton_1.Skeleton, { className: "h-3 w-full mb-2" }),
                react_1.default.createElement(skeleton_1.Skeleton, { className: "h-3 w-2/3" })))))));
    }
    if (results.length === 0) {
        return (react_1.default.createElement(card_1.Card, null,
            react_1.default.createElement(card_1.CardContent, { className: "flex flex-col items-center justify-center py-12" },
                react_1.default.createElement(lucide_react_1.Search, { className: "h-12 w-12 text-muted-foreground mb-4" }),
                react_1.default.createElement("h3", { className: "text-lg font-medium mb-2" }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E04\u0E49\u0E19\u0E2B\u0E32"),
                react_1.default.createElement("p", { className: "text-muted-foreground text-center" }, "\u0E25\u0E2D\u0E07\u0E43\u0E0A\u0E49\u0E04\u0E33\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E2D\u0E37\u0E48\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E1B\u0E23\u0E31\u0E1A\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07"))));
    }
    return (react_1.default.createElement("div", { className: "space-y-4" },
        react_1.default.createElement("div", { className: "flex items-center justify-between" },
            react_1.default.createElement("p", { className: "text-sm text-muted-foreground" },
                "\u0E1E\u0E1A ",
                results.length,
                " \u0E1C\u0E25\u0E25\u0E31\u0E1E\u0E18\u0E4C"),
            react_1.default.createElement("div", { className: "flex items-center space-x-2" },
                react_1.default.createElement(button_1.Button, { variant: viewMode === 'grid' ? 'default' : 'outline', size: "sm", onClick: () => onViewModeChange('grid') },
                    react_1.default.createElement(lucide_react_1.Grid, { className: "h-4 w-4" })),
                react_1.default.createElement(button_1.Button, { variant: viewMode === 'list' ? 'default' : 'outline', size: "sm", onClick: () => onViewModeChange('list') },
                    react_1.default.createElement(lucide_react_1.List, { className: "h-4 w-4" })))),
        react_1.default.createElement("div", { className: (0, utils_1.cn)(viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-4') }, results.map((result) => (react_1.default.createElement(SearchResultCard, { key: result.id, result: result, viewMode: viewMode }))))));
}
function SearchResultCard({ result, viewMode }) {
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'beginner': return 'bg-green-100 text-green-800';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'advanced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'archived': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    return (react_1.default.createElement(card_1.Card, { className: "hover:shadow-md transition-shadow cursor-pointer" },
        react_1.default.createElement(card_1.CardHeader, { className: (0, utils_1.cn)(viewMode === 'list' && 'pb-2') },
            react_1.default.createElement("div", { className: "flex items-start justify-between" },
                react_1.default.createElement("div", { className: "flex-1" },
                    react_1.default.createElement(card_1.CardTitle, { className: "text-lg mb-1" }, result.title),
                    react_1.default.createElement("div", { className: "flex items-center space-x-2 mb-2" },
                        react_1.default.createElement(badge_1.Badge, { variant: "outline", className: "text-xs" }, result.type),
                        react_1.default.createElement(badge_1.Badge, { className: (0, utils_1.cn)('text-xs', getDifficultyColor(result.difficulty)) }, result.difficulty),
                        react_1.default.createElement(badge_1.Badge, { className: (0, utils_1.cn)('text-xs', getStatusColor(result.status)) }, result.status))),
                react_1.default.createElement("div", { className: "flex items-center space-x-1 text-sm text-muted-foreground" },
                    react_1.default.createElement(lucide_react_1.Star, { className: "h-4 w-4" }),
                    react_1.default.createElement("span", null, result.popularity)))),
        react_1.default.createElement(card_1.CardContent, null,
            react_1.default.createElement(card_1.CardDescription, { className: "mb-3" }, result.description),
            react_1.default.createElement("div", { className: "flex items-center justify-between" },
                react_1.default.createElement("div", { className: "flex flex-wrap gap-1" },
                    result.tags.slice(0, 3).map((tag) => (react_1.default.createElement(badge_1.Badge, { key: tag, variant: "secondary", className: "text-xs" }, tag))),
                    result.tags.length > 3 && (react_1.default.createElement(badge_1.Badge, { variant: "secondary", className: "text-xs" },
                        "+",
                        result.tags.length - 3))),
                react_1.default.createElement("div", { className: "text-xs text-muted-foreground" }, new Date(result.date).toLocaleDateString('th-TH'))))));
}
function SearchInterface({ className, initialQuery = '', showFilters = true, showSort = true }) {
    const [viewMode, setViewMode] = (0, react_1.useState)('grid');
    const { query, type, filters, sort, results, availableFilters, isLoading, hasSearched, setQuery, setType, setFilters, setSort, search, resetFilters, } = (0, use_search_1.useSearch)({
        initialQuery,
        autoSearch: true,
    });
    return (react_1.default.createElement("div", { className: (0, utils_1.cn)('space-y-6', className) },
        react_1.default.createElement("div", { className: "space-y-4" },
            react_1.default.createElement(SearchInput, { value: query, onChange: setQuery, onSearch: search }),
            react_1.default.createElement("div", { className: "flex items-center justify-between flex-wrap gap-4" },
                react_1.default.createElement("div", { className: "flex items-center space-x-4" },
                    react_1.default.createElement(select_1.Select, { value: type, onValueChange: setType },
                        react_1.default.createElement(select_1.SelectTrigger, { className: "w-40" },
                            react_1.default.createElement(select_1.SelectValue, null)),
                        react_1.default.createElement(select_1.SelectContent, null,
                            react_1.default.createElement(select_1.SelectItem, { value: "all" }, "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"),
                            react_1.default.createElement(select_1.SelectItem, { value: "projects" }, "\u0E42\u0E1B\u0E23\u0E40\u0E08\u0E04"),
                            react_1.default.createElement(select_1.SelectItem, { value: "blog" }, "\u0E1A\u0E25\u0E47\u0E2D\u0E01"),
                            react_1.default.createElement(select_1.SelectItem, { value: "skills" }, "\u0E17\u0E31\u0E01\u0E29\u0E30"))),
                    showFilters && (react_1.default.createElement(FilterPanel, { filters: filters, availableFilters: availableFilters, onFiltersChange: setFilters, onReset: resetFilters }))),
                showSort && (react_1.default.createElement("div", { className: "flex items-center space-x-2" },
                    react_1.default.createElement("span", { className: "text-sm text-muted-foreground" }, "\u0E40\u0E23\u0E35\u0E22\u0E07\u0E15\u0E32\u0E21:"),
                    react_1.default.createElement(select_1.Select, { value: `${sort.field}-${sort.order}`, onValueChange: (value) => {
                            const [field, order] = value.split('-');
                            setSort({ field, order });
                        } },
                        react_1.default.createElement(select_1.SelectTrigger, { className: "w-40" },
                            react_1.default.createElement(select_1.SelectValue, null)),
                        react_1.default.createElement(select_1.SelectContent, null,
                            react_1.default.createElement(select_1.SelectItem, { value: "relevance-desc" }, "\u0E04\u0E27\u0E32\u0E21\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E02\u0E49\u0E2D\u0E07"),
                            react_1.default.createElement(select_1.SelectItem, { value: "date-desc" }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 (\u0E43\u0E2B\u0E21\u0E48\u0E2A\u0E38\u0E14)"),
                            react_1.default.createElement(select_1.SelectItem, { value: "date-asc" }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 (\u0E40\u0E01\u0E48\u0E32\u0E2A\u0E38\u0E14)"),
                            react_1.default.createElement(select_1.SelectItem, { value: "title-asc" }, "\u0E0A\u0E37\u0E48\u0E2D (A-Z)"),
                            react_1.default.createElement(select_1.SelectItem, { value: "title-desc" }, "\u0E0A\u0E37\u0E48\u0E2D (Z-A)"),
                            react_1.default.createElement(select_1.SelectItem, { value: "popularity-desc" }, "\u0E04\u0E27\u0E32\u0E21\u0E19\u0E34\u0E22\u0E21"))))))),
        hasSearched && (react_1.default.createElement(SearchResults, { results: results, isLoading: isLoading, viewMode: viewMode, onViewModeChange: setViewMode }))));
}
