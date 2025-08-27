'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, Calendar, Tag, Star, Clock, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearch, useSearchSuggestions, useSearchHistory, SearchResult } from '@/hooks/use-search';
import { cn } from '@/lib/utils';

// Search Input Component
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  showSuggestions?: boolean;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "ค้นหาโปรเจค, บล็อก, หรือทักษะ...",
  showSuggestions = true,
  className,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { suggestions, isLoading: suggestionsLoading } = useSearchSuggestions(value);
  const { history, addToHistory, removeFromHistory } = useSearchHistory();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      addToHistory(value.trim());
      onSearch?.();
      setIsFocused(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    addToHistory(suggestion);
    onSearch?.();
    setIsFocused(false);
  };

  const showDropdown = isFocused && showSuggestions && (suggestions.length > 0 || history.length > 0);

  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className="pl-10 pr-4"
        />
      </form>

      {showDropdown && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto">
          <CardContent className="p-2">
            {suggestions.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  คำแนะนำ
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
                  >
                    <Search className="inline h-3 w-3 mr-2 text-muted-foreground" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {history.length > 0 && suggestions.length > 0 && (
              <Separator className="my-2" />
            )}

            {history.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center justify-between">
                  ประวัติการค้นหา
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => history.forEach(removeFromHistory)}
                    className="h-auto p-0 text-xs"
                  >
                    ล้างทั้งหมด
                  </Button>
                </div>
                {history.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between group">
                    <button
                      onClick={() => handleSuggestionClick(item)}
                      className="flex-1 text-left px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
                    >
                      <Clock className="inline h-3 w-3 mr-2 text-muted-foreground" />
                      {item}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromHistory(item)}
                      className="h-auto p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Filter Panel Component
interface FilterPanelProps {
  filters: any;
  availableFilters?: any;
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
}

export function FilterPanel({ filters, availableFilters, onFiltersChange, onReset }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const removeFilter = (key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key];
    return value && (Array.isArray(value) ? value.length > 0 : true);
  }).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          ตัวกรอง
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">ตัวกรองการค้นหา</h4>
            <Button variant="ghost" size="sm" onClick={onReset}>
              รีเซ็ต
            </Button>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">หมวดหมู่</label>
            <Select
              value={filters.category || ''}
              onValueChange={(value) => updateFilter('category', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ทั้งหมด</SelectItem>
                {availableFilters?.categories?.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">ระดับความยาก</label>
            <Select
              value={filters.difficulty || ''}
              onValueChange={(value) => updateFilter('difficulty', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกระดับความยาก" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ทั้งหมด</SelectItem>
                <SelectItem value="beginner">เริ่มต้น</SelectItem>
                <SelectItem value="intermediate">ปานกลาง</SelectItem>
                <SelectItem value="advanced">ขั้นสูง</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">สถานะ</label>
            <Select
              value={filters.status || ''}
              onValueChange={(value) => updateFilter('status', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ทั้งหมด</SelectItem>
                <SelectItem value="active">ใช้งานอยู่</SelectItem>
                <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                <SelectItem value="archived">เก็บถาวร</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags Filter */}
          {availableFilters?.tags && (
            <div className="space-y-2">
              <label className="text-sm font-medium">แท็ก</label>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {availableFilters.tags.slice(0, 20).map((tag: string) => {
                  const isSelected = filters.tags?.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => {
                        const currentTags = filters.tags || [];
                        const newTags = isSelected
                          ? currentTags.filter((t: string) => t !== tag)
                          : [...currentTags, tag];
                        updateFilter('tags', newTags.length > 0 ? newTags : undefined);
                      }}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Search Results Component
interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function SearchResults({ results, isLoading, viewMode, onViewModeChange }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">ไม่พบผลการค้นหา</h3>
          <p className="text-muted-foreground text-center">
            ลองใช้คำค้นหาอื่น หรือปรับเปลี่ยนตัวกรอง
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          พบ {results.length} ผลลัพธ์
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className={cn(
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-4'
      )}>
        {results.map((result) => (
          <SearchResultCard key={result.id} result={result} viewMode={viewMode} />
        ))}
      </div>
    </div>
  );
}

// Search Result Card Component
interface SearchResultCardProps {
  result: SearchResult;
  viewMode: 'grid' | 'list';
}

function SearchResultCard({ result, viewMode }: SearchResultCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className={cn(viewMode === 'list' && 'pb-2')}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{result.title}</CardTitle>
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {result.type}
              </Badge>
              <Badge className={cn('text-xs', getDifficultyColor(result.difficulty))}>
                {result.difficulty}
              </Badge>
              <Badge className={cn('text-xs', getStatusColor(result.status))}>
                {result.status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4" />
            <span>{result.popularity}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-3">
          {result.description}
        </CardDescription>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {result.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {result.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{result.tags.length - 3}
              </Badge>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            {new Date(result.date).toLocaleDateString('th-TH')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Search Interface Component
interface SearchInterfaceProps {
  className?: string;
  initialQuery?: string;
  showFilters?: boolean;
  showSort?: boolean;
}

export function SearchInterface({ 
  className, 
  initialQuery = '', 
  showFilters = true, 
  showSort = true 
}: SearchInterfaceProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const {
    query,
    type,
    filters,
    sort,
    results,
    availableFilters,
    isLoading,
    hasSearched,
    setQuery,
    setType,
    setFilters,
    setSort,
    search,
    resetFilters,
  } = useSearch({
    initialQuery,
    autoSearch: true,
  });

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search Header */}
      <div className="space-y-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          onSearch={search}
        />
        
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            {/* Type Filter */}
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="projects">โปรเจค</SelectItem>
                <SelectItem value="blog">บล็อก</SelectItem>
                <SelectItem value="skills">ทักษะ</SelectItem>
              </SelectContent>
            </Select>

            {/* Filters */}
            {showFilters && (
              <FilterPanel
                filters={filters}
                availableFilters={availableFilters}
                onFiltersChange={setFilters}
                onReset={resetFilters}
              />
            )}
          </div>

          {/* Sort */}
          {showSort && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">เรียงตาม:</span>
              <Select
                value={`${sort.field}-${sort.order}`}
                onValueChange={(value) => {
                  const [field, order] = value.split('-') as [any, 'asc' | 'desc'];
                  setSort({ field, order });
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance-desc">ความเกี่ยวข้อง</SelectItem>
                  <SelectItem value="date-desc">วันที่ (ใหม่สุด)</SelectItem>
                  <SelectItem value="date-asc">วันที่ (เก่าสุด)</SelectItem>
                  <SelectItem value="title-asc">ชื่อ (A-Z)</SelectItem>
                  <SelectItem value="title-desc">ชื่อ (Z-A)</SelectItem>
                  <SelectItem value="popularity-desc">ความนิยม</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <SearchResults
          results={results}
          isLoading={isLoading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}
    </div>
  );
}