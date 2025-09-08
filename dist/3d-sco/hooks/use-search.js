"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDebounce = useDebounce;
exports.useSearch = useSearch;
exports.useSearchSuggestions = useSearchSuggestions;
exports.useSearchHistory = useSearchHistory;
const react_1 = require("react");
const use_debounce_1 = require("./use-debounce");
// Custom hook for debouncing
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = (0, react_1.useState)(value);
    (0, react_1.useEffect)(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}
// Main search hook
function useSearch(options = {}) {
    const { initialQuery = '', initialType = 'all', initialFilters = {}, initialSort = { field: 'relevance', order: 'desc' }, initialPagination = { page: 1, limit: 10 }, debounceMs = 300, autoSearch = true, } = options;
    // State
    const [query, setQuery] = (0, react_1.useState)(initialQuery);
    const [type, setType] = (0, react_1.useState)(initialType);
    const [filters, setFilters] = (0, react_1.useState)(initialFilters);
    const [sort, setSort] = (0, react_1.useState)(initialSort);
    const [pagination, setPagination] = (0, react_1.useState)(initialPagination);
    const [results, setResults] = (0, react_1.useState)([]);
    const [availableFilters, setAvailableFilters] = (0, react_1.useState)();
    const [analytics, setAnalytics] = (0, react_1.useState)();
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [isError, setIsError] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [hasSearched, setHasSearched] = (0, react_1.useState)(false);
    // Debounced query for auto-search
    const debouncedQuery = (0, use_debounce_1.useDebounce)(query, debounceMs);
    // Search function
    const search = (0, react_1.useCallback)(async () => {
        if (!query.trim() && !Object.keys(filters).length) {
            setResults([]);
            setHasSearched(false);
            return;
        }
        setIsLoading(true);
        setIsError(false);
        setError(null);
        try {
            // Build query parameters
            const params = new URLSearchParams({
                q: query,
                type,
                sort: sort.field,
                order: sort.order,
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });
            // Add filters to params
            if (filters.category)
                params.append('category', filters.category);
            if (filters.tags?.length)
                params.append('tags', filters.tags.join(','));
            if (filters.difficulty)
                params.append('difficulty', filters.difficulty);
            if (filters.status)
                params.append('status', filters.status);
            const response = await fetch(`/api/search?${params}`);
            if (!response.ok) {
                throw new Error(`Search failed: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.success) {
                setResults(data.results);
                setAvailableFilters(data.availableFilters);
                setAnalytics(data.analytics);
                setPagination(prev => ({
                    ...prev,
                    ...data.pagination,
                }));
                setHasSearched(true);
            }
            else {
                throw new Error('Search request failed');
            }
        }
        catch (err) {
            setIsError(true);
            setError(err instanceof Error ? err.message : 'Search failed');
            setResults([]);
        }
        finally {
            setIsLoading(false);
        }
    }, [query, type, filters, sort, pagination.page, pagination.limit]);
    // Advanced search with POST request
    const advancedSearch = (0, react_1.useCallback)(async () => {
        setIsLoading(true);
        setIsError(false);
        setError(null);
        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    type,
                    filters,
                    sort,
                    pagination,
                }),
            });
            if (!response.ok) {
                throw new Error(`Advanced search failed: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.success) {
                setResults(data.results);
                setAnalytics(data.analytics);
                setPagination(prev => ({
                    ...prev,
                    ...data.pagination,
                }));
                setHasSearched(true);
            }
            else {
                throw new Error('Advanced search request failed');
            }
        }
        catch (err) {
            setIsError(true);
            setError(err instanceof Error ? err.message : 'Advanced search failed');
            setResults([]);
        }
        finally {
            setIsLoading(false);
        }
    }, [query, type, filters, sort, pagination]);
    // Auto-search effect
    (0, react_1.useEffect)(() => {
        if (autoSearch && (debouncedQuery || Object.keys(filters).length)) {
            search();
        }
    }, [debouncedQuery, type, filters, sort, autoSearch, search]);
    // Clear search
    const clearSearch = (0, react_1.useCallback)(() => {
        setQuery('');
        setResults([]);
        setHasSearched(false);
        setError(null);
        setIsError(false);
    }, []);
    // Reset filters
    const resetFilters = (0, react_1.useCallback)(() => {
        setFilters({});
        setPagination({ page: 1, limit: 10 });
    }, []);
    // Pagination helpers
    const goToPage = (0, react_1.useCallback)((page) => {
        setPagination(prev => ({ ...prev, page }));
    }, []);
    const nextPage = (0, react_1.useCallback)(() => {
        setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }, []);
    const prevPage = (0, react_1.useCallback)(() => {
        setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }));
    }, []);
    // Filter helpers
    const addTag = (0, react_1.useCallback)((tag) => {
        setFilters(prev => ({
            ...prev,
            tags: [...(prev.tags || []), tag],
        }));
    }, []);
    const removeTag = (0, react_1.useCallback)((tag) => {
        setFilters(prev => ({
            ...prev,
            tags: prev.tags?.filter(t => t !== tag),
        }));
    }, []);
    const toggleTag = (0, react_1.useCallback)((tag) => {
        setFilters(prev => {
            const currentTags = prev.tags || [];
            const hasTag = currentTags.includes(tag);
            return {
                ...prev,
                tags: hasTag
                    ? currentTags.filter(t => t !== tag)
                    : [...currentTags, tag],
            };
        });
    }, []);
    const setCategory = (0, react_1.useCallback)((category) => {
        setFilters(prev => ({ ...prev, category }));
    }, []);
    const setDifficulty = (0, react_1.useCallback)((difficulty) => {
        setFilters(prev => ({ ...prev, difficulty }));
    }, []);
    const setStatus = (0, react_1.useCallback)((status) => {
        setFilters(prev => ({ ...prev, status }));
    }, []);
    const setDateRange = (0, react_1.useCallback)((dateRange) => {
        setFilters(prev => ({ ...prev, dateRange }));
    }, []);
    // Memoized return value
    return (0, react_1.useMemo)(() => ({
        // State
        query,
        type,
        filters,
        sort,
        pagination,
        results,
        availableFilters,
        analytics,
        // Status
        isLoading,
        isError,
        error,
        hasSearched,
        // Actions
        setQuery,
        setType,
        setFilters,
        setSort,
        setPagination,
        search,
        clearSearch,
        resetFilters,
        // Pagination helpers
        goToPage,
        nextPage,
        prevPage,
        // Filter helpers
        addTag,
        removeTag,
        toggleTag,
        setCategory,
        setDifficulty,
        setStatus,
        setDateRange,
    }), [
        query, type, filters, sort, pagination, results, availableFilters, analytics,
        isLoading, isError, error, hasSearched,
        setQuery, setType, setFilters, setSort, setPagination, search, clearSearch, resetFilters,
        goToPage, nextPage, prevPage,
        addTag, removeTag, toggleTag, setCategory, setDifficulty, setStatus, setDateRange,
    ]);
}
// Hook for search suggestions/autocomplete
function useSearchSuggestions(query, limit = 5) {
    const [suggestions, setSuggestions] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const debouncedQuery = (0, use_debounce_1.useDebounce)(query, 200);
    (0, react_1.useEffect)(() => {
        if (!debouncedQuery.trim()) {
            setSuggestions([]);
            return;
        }
        setIsLoading(true);
        // Mock suggestions - in a real app, this would call an API
        const mockSuggestions = [
            'Next.js development',
            'React hooks',
            'TypeScript patterns',
            '3D animations',
            'WebSocket chat',
            'Authentication system',
            'Database integration',
            'API development',
            'Frontend optimization',
            'Backend architecture',
        ];
        const filteredSuggestions = mockSuggestions
            .filter(suggestion => suggestion.toLowerCase().includes(debouncedQuery.toLowerCase()))
            .slice(0, limit);
        setTimeout(() => {
            setSuggestions(filteredSuggestions);
            setIsLoading(false);
        }, 100);
    }, [debouncedQuery, limit]);
    return { suggestions, isLoading };
}
// Hook for search history
function useSearchHistory(maxItems = 10) {
    const [history, setHistory] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        // Load from localStorage
        const saved = localStorage.getItem('search-history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            }
            catch (error) {
                console.error('Failed to parse search history:', error);
            }
        }
    }, []);
    const addToHistory = (0, react_1.useCallback)((query) => {
        if (!query.trim())
            return;
        setHistory(prev => {
            const newHistory = [query, ...prev.filter(item => item !== query)]
                .slice(0, maxItems);
            localStorage.setItem('search-history', JSON.stringify(newHistory));
            return newHistory;
        });
    }, [maxItems]);
    const removeFromHistory = (0, react_1.useCallback)((query) => {
        setHistory(prev => {
            const newHistory = prev.filter(item => item !== query);
            localStorage.setItem('search-history', JSON.stringify(newHistory));
            return newHistory;
        });
    }, []);
    const clearHistory = (0, react_1.useCallback)(() => {
        setHistory([]);
        localStorage.removeItem('search-history');
    }, []);
    return {
        history,
        addToHistory,
        removeFromHistory,
        clearHistory,
    };
}
