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
    return (<div className={(0, utils_1.cn)("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <lucide_react_1.Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
        <input_1.Input ref={inputRef} type="text" value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => setTimeout(() => setIsFocused(false), 200)} placeholder={placeholder} className="pl-10 pr-4"/>
      </form>

      {showDropdown && (<card_1.Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto">
          <card_1.CardContent className="p-2">
            {suggestions.length > 0 && (<div className="space-y-1">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  คำแนะนำ
                </div>
                {suggestions.map((suggestion, index) => (<button key={index} onClick={() => handleSuggestionClick(suggestion)} className="w-full text-left px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors">
                    <lucide_react_1.Search className="inline h-3 w-3 mr-2 text-muted-foreground"/>
                    {suggestion}
                  </button>))}
              </div>)}

            {history.length > 0 && suggestions.length > 0 && (<separator_1.Separator className="my-2"/>)}

            {history.length > 0 && (<div className="space-y-1">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center justify-between">
                  ประวัติการค้นหา
                  <button_1.Button variant="ghost" size="sm" onClick={() => history.forEach(removeFromHistory)} className="h-auto p-0 text-xs">
                    ล้างทั้งหมด
                  </button_1.Button>
                </div>
                {history.slice(0, 5).map((item, index) => (<div key={index} className="flex items-center justify-between group">
                    <button onClick={() => handleSuggestionClick(item)} className="flex-1 text-left px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors">
                      <lucide_react_1.Clock className="inline h-3 w-3 mr-2 text-muted-foreground"/>
                      {item}
                    </button>
                    <button_1.Button variant="ghost" size="sm" onClick={() => removeFromHistory(item)} className="h-auto p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <lucide_react_1.X className="h-3 w-3"/>
                    </button_1.Button>
                  </div>))}
              </div>)}
          </card_1.CardContent>
        </card_1.Card>)}
    </div>);
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
    return (<popover_1.Popover open={isOpen} onOpenChange={setIsOpen}>
      <popover_1.PopoverTrigger asChild>
        <button_1.Button variant="outline" className="relative">
          <lucide_react_1.Filter className="h-4 w-4 mr-2"/>
          ตัวกรอง
          {activeFiltersCount > 0 && (<badge_1.Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
              {activeFiltersCount}
            </badge_1.Badge>)}
        </button_1.Button>
      </popover_1.PopoverTrigger>
      <popover_1.PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">ตัวกรองการค้นหา</h4>
            <button_1.Button variant="ghost" size="sm" onClick={onReset}>
              รีเซ็ต
            </button_1.Button>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">หมวดหมู่</label>
            <select_1.Select value={filters.category || ''} onValueChange={(value) => updateFilter('category', value || undefined)}>
              <select_1.SelectTrigger>
                <select_1.SelectValue placeholder="เลือกหมวดหมู่"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="">ทั้งหมด</select_1.SelectItem>
                {availableFilters?.categories?.map((category) => (<select_1.SelectItem key={category} value={category}>
                    {category}
                  </select_1.SelectItem>))}
              </select_1.SelectContent>
            </select_1.Select>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">ระดับความยาก</label>
            <select_1.Select value={filters.difficulty || ''} onValueChange={(value) => updateFilter('difficulty', value || undefined)}>
              <select_1.SelectTrigger>
                <select_1.SelectValue placeholder="เลือกระดับความยาก"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="">ทั้งหมด</select_1.SelectItem>
                <select_1.SelectItem value="beginner">เริ่มต้น</select_1.SelectItem>
                <select_1.SelectItem value="intermediate">ปานกลาง</select_1.SelectItem>
                <select_1.SelectItem value="advanced">ขั้นสูง</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">สถานะ</label>
            <select_1.Select value={filters.status || ''} onValueChange={(value) => updateFilter('status', value || undefined)}>
              <select_1.SelectTrigger>
                <select_1.SelectValue placeholder="เลือกสถานะ"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="">ทั้งหมด</select_1.SelectItem>
                <select_1.SelectItem value="active">ใช้งานอยู่</select_1.SelectItem>
                <select_1.SelectItem value="completed">เสร็จสิ้น</select_1.SelectItem>
                <select_1.SelectItem value="archived">เก็บถาวร</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>
          </div>

          {/* Tags Filter */}
          {availableFilters?.tags && (<div className="space-y-2">
              <label className="text-sm font-medium">แท็ก</label>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {availableFilters.tags.slice(0, 20).map((tag) => {
                const isSelected = filters.tags?.includes(tag);
                return (<badge_1.Badge key={tag} variant={isSelected ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => {
                        const currentTags = filters.tags || [];
                        const newTags = isSelected
                            ? currentTags.filter((t) => t !== tag)
                            : [...currentTags, tag];
                        updateFilter('tags', newTags.length > 0 ? newTags : undefined);
                    }}>
                      <lucide_react_1.Tag className="h-3 w-3 mr-1"/>
                      {tag}
                    </badge_1.Badge>);
            })}
              </div>
            </div>)}
        </div>
      </popover_1.PopoverContent>
    </popover_1.Popover>);
}
function SearchResults({ results, isLoading, viewMode, onViewModeChange }) {
    if (isLoading) {
        return (<div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (<card_1.Card key={i}>
            <card_1.CardHeader>
              <skeleton_1.Skeleton className="h-4 w-3/4"/>
              <skeleton_1.Skeleton className="h-3 w-1/2"/>
            </card_1.CardHeader>
            <card_1.CardContent>
              <skeleton_1.Skeleton className="h-3 w-full mb-2"/>
              <skeleton_1.Skeleton className="h-3 w-2/3"/>
            </card_1.CardContent>
          </card_1.Card>))}
      </div>);
    }
    if (results.length === 0) {
        return (<card_1.Card>
        <card_1.CardContent className="flex flex-col items-center justify-center py-12">
          <lucide_react_1.Search className="h-12 w-12 text-muted-foreground mb-4"/>
          <h3 className="text-lg font-medium mb-2">ไม่พบผลการค้นหา</h3>
          <p className="text-muted-foreground text-center">
            ลองใช้คำค้นหาอื่น หรือปรับเปลี่ยนตัวกรอง
          </p>
        </card_1.CardContent>
      </card_1.Card>);
    }
    return (<div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          พบ {results.length} ผลลัพธ์
        </p>
        <div className="flex items-center space-x-2">
          <button_1.Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => onViewModeChange('grid')}>
            <lucide_react_1.Grid className="h-4 w-4"/>
          </button_1.Button>
          <button_1.Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => onViewModeChange('list')}>
            <lucide_react_1.List className="h-4 w-4"/>
          </button_1.Button>
        </div>
      </div>

      {/* Results */}
      <div className={(0, utils_1.cn)(viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4')}>
        {results.map((result) => (<SearchResultCard key={result.id} result={result} viewMode={viewMode}/>))}
      </div>
    </div>);
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
    return (<card_1.Card className="hover:shadow-md transition-shadow cursor-pointer">
      <card_1.CardHeader className={(0, utils_1.cn)(viewMode === 'list' && 'pb-2')}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <card_1.CardTitle className="text-lg mb-1">{result.title}</card_1.CardTitle>
            <div className="flex items-center space-x-2 mb-2">
              <badge_1.Badge variant="outline" className="text-xs">
                {result.type}
              </badge_1.Badge>
              <badge_1.Badge className={(0, utils_1.cn)('text-xs', getDifficultyColor(result.difficulty))}>
                {result.difficulty}
              </badge_1.Badge>
              <badge_1.Badge className={(0, utils_1.cn)('text-xs', getStatusColor(result.status))}>
                {result.status}
              </badge_1.Badge>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <lucide_react_1.Star className="h-4 w-4"/>
            <span>{result.popularity}</span>
          </div>
        </div>
      </card_1.CardHeader>
      <card_1.CardContent>
        <card_1.CardDescription className="mb-3">
          {result.description}
        </card_1.CardDescription>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {result.tags.slice(0, 3).map((tag) => (<badge_1.Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </badge_1.Badge>))}
            {result.tags.length > 3 && (<badge_1.Badge variant="secondary" className="text-xs">
                +{result.tags.length - 3}
              </badge_1.Badge>)}
          </div>
          
          <div className="text-xs text-muted-foreground">
            {new Date(result.date).toLocaleDateString('th-TH')}
          </div>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
function SearchInterface({ className, initialQuery = '', showFilters = true, showSort = true }) {
    const [viewMode, setViewMode] = (0, react_1.useState)('grid');
    const { query, type, filters, sort, results, availableFilters, isLoading, hasSearched, setQuery, setType, setFilters, setSort, search, resetFilters, } = (0, use_search_1.useSearch)({
        initialQuery,
        autoSearch: true,
    });
    return (<div className={(0, utils_1.cn)('space-y-6', className)}>
      {/* Search Header */}
      <div className="space-y-4">
        <SearchInput value={query} onChange={setQuery} onSearch={search}/>
        
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            {/* Type Filter */}
            <select_1.Select value={type} onValueChange={setType}>
              <select_1.SelectTrigger className="w-40">
                <select_1.SelectValue />
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="all">ทั้งหมด</select_1.SelectItem>
                <select_1.SelectItem value="projects">โปรเจค</select_1.SelectItem>
                <select_1.SelectItem value="blog">บล็อก</select_1.SelectItem>
                <select_1.SelectItem value="skills">ทักษะ</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>

            {/* Filters */}
            {showFilters && (<FilterPanel filters={filters} availableFilters={availableFilters} onFiltersChange={setFilters} onReset={resetFilters}/>)}
          </div>

          {/* Sort */}
          {showSort && (<div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">เรียงตาม:</span>
              <select_1.Select value={`${sort.field}-${sort.order}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSort({ field, order });
            }}>
                <select_1.SelectTrigger className="w-40">
                  <select_1.SelectValue />
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="relevance-desc">ความเกี่ยวข้อง</select_1.SelectItem>
                  <select_1.SelectItem value="date-desc">วันที่ (ใหม่สุด)</select_1.SelectItem>
                  <select_1.SelectItem value="date-asc">วันที่ (เก่าสุด)</select_1.SelectItem>
                  <select_1.SelectItem value="title-asc">ชื่อ (A-Z)</select_1.SelectItem>
                  <select_1.SelectItem value="title-desc">ชื่อ (Z-A)</select_1.SelectItem>
                  <select_1.SelectItem value="popularity-desc">ความนิยม</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>)}
        </div>
      </div>

      {/* Results */}
      {hasSearched && (<SearchResults results={results} isLoading={isLoading} viewMode={viewMode} onViewModeChange={setViewMode}/>)}
    </div>);
}
//# sourceMappingURL=search-interface.js.map