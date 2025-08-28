export interface SearchFilters {
    category?: string;
    tags?: string[];
    dateRange?: {
        from?: string;
        to?: string;
    };
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    status?: 'active' | 'completed' | 'archived';
}
export interface SearchSort {
    field: 'relevance' | 'date' | 'title' | 'popularity';
    order: 'asc' | 'desc';
}
export interface SearchPagination {
    page: number;
    limit: number;
}
export interface SearchResult {
    id: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    difficulty: string;
    status: string;
    date: string;
    popularity: number;
    type: string;
}
export interface SearchResponse {
    success: boolean;
    query: string;
    filters?: SearchFilters;
    sort?: SearchSort;
    results: SearchResult[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    availableFilters?: {
        categories: string[];
        tags: string[];
        difficulties: string[];
        statuses: string[];
        types: string[];
    };
    analytics?: {
        totalResults: number;
        searchTime: number;
        topCategories: Record<string, number>;
        averagePopularity: number;
    };
    searchTime: number;
}
export interface UseSearchOptions {
    initialQuery?: string;
    initialType?: 'all' | 'projects' | 'blog' | 'skills' | 'content';
    initialFilters?: SearchFilters;
    initialSort?: SearchSort;
    initialPagination?: SearchPagination;
    debounceMs?: number;
    autoSearch?: boolean;
}
export interface UseSearchReturn {
    query: string;
    type: string;
    filters: SearchFilters;
    sort: SearchSort;
    pagination: SearchPagination;
    results: SearchResult[];
    availableFilters: SearchResponse['availableFilters'];
    analytics: SearchResponse['analytics'];
    isLoading: boolean;
    isError: boolean;
    error: string | null;
    hasSearched: boolean;
    setQuery: (query: string) => void;
    setType: (type: string) => void;
    setFilters: (filters: SearchFilters) => void;
    setSort: (sort: SearchSort) => void;
    setPagination: (pagination: SearchPagination) => void;
    search: () => Promise<void>;
    clearSearch: () => void;
    resetFilters: () => void;
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    addTag: (tag: string) => void;
    removeTag: (tag: string) => void;
    toggleTag: (tag: string) => void;
    setCategory: (category: string | undefined) => void;
    setDifficulty: (difficulty: SearchFilters['difficulty']) => void;
    setStatus: (status: SearchFilters['status']) => void;
    setDateRange: (dateRange: SearchFilters['dateRange']) => void;
}
export declare function useDebounce<T>(value: T, delay: number): T;
export declare function useSearch(options?: UseSearchOptions): UseSearchReturn;
export declare function useSearchSuggestions(query: string, limit?: number): {
    suggestions: any;
    isLoading: any;
};
export declare function useSearchHistory(maxItems?: number): {
    history: any;
    addToHistory: any;
    removeFromHistory: any;
    clearHistory: any;
};
//# sourceMappingURL=use-search.d.ts.map