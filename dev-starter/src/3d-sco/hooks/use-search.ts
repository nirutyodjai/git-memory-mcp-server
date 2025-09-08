'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from './use-debounce';

// Types
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
  // State
  query: string;
  type: string;
  filters: SearchFilters;
  sort: SearchSort;
  pagination: SearchPagination;
  results: SearchResult[];
  availableFilters: SearchResponse['availableFilters'];
  analytics: SearchResponse['analytics'];
  
  // Status
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  hasSearched: boolean;
  
  // Actions
  setQuery: (query: string) => void;
  setType: (type: string) => void;
  setFilters: (filters: SearchFilters) => void;
  setSort: (sort: SearchSort) => void;
  setPagination: (pagination: SearchPagination) => void;
  search: () => Promise<void>;
  clearSearch: () => void;
  resetFilters: () => void;
  
  // Pagination helpers
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  
  // Filter helpers
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  toggleTag: (tag: string) => void;
  setCategory: (category: string | undefined) => void;
  setDifficulty: (difficulty: SearchFilters['difficulty']) => void;
  setStatus: (status: SearchFilters['status']) => void;
  setDateRange: (dateRange: SearchFilters['dateRange']) => void;
}

// Custom hook for debouncing
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
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
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    initialQuery = '',
    initialType = 'all',
    initialFilters = {},
    initialSort = { field: 'relevance', order: 'desc' },
    initialPagination = { page: 1, limit: 10 },
    debounceMs = 300,
    autoSearch = true,
  } = options;

  // State
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [sort, setSort] = useState<SearchSort>(initialSort);
  const [pagination, setPagination] = useState<SearchPagination>(initialPagination);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [availableFilters, setAvailableFilters] = useState<SearchResponse['availableFilters']>();
  const [analytics, setAnalytics] = useState<SearchResponse['analytics']>();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced query for auto-search
  const debouncedQuery = useDebounce(query, debounceMs);

  // Search function
  const search = useCallback(async () => {
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
      if (filters.category) params.append('category', filters.category);
      if (filters.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data: SearchResponse = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setAvailableFilters(data.availableFilters);
        setAnalytics(data.analytics);
        setPagination(prev => ({
          ...prev,
          ...data.pagination,
        }));
        setHasSearched(true);
      } else {
        throw new Error('Search request failed');
      }
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, type, filters, sort, pagination.page, pagination.limit]);

  // Advanced search with POST request
  const advancedSearch = useCallback(async () => {
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

      const data: SearchResponse = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setAnalytics(data.analytics);
        setPagination(prev => ({
          ...prev,
          ...data.pagination,
        }));
        setHasSearched(true);
      } else {
        throw new Error('Advanced search request failed');
      }
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Advanced search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, type, filters, sort, pagination]);

  // Auto-search effect
  useEffect(() => {
    if (autoSearch && (debouncedQuery || Object.keys(filters).length)) {
      search();
    }
  }, [debouncedQuery, type, filters, sort, autoSearch, search]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
    setIsError(false);
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({});
    setPagination({ page: 1, limit: 10 });
  }, []);

  // Pagination helpers
  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const nextPage = useCallback(() => {
    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
  }, []);

  const prevPage = useCallback(() => {
    setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }));
  }, []);

  // Filter helpers
  const addTag = useCallback((tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: [...(prev.tags || []), tag],
    }));
  }, []);

  const removeTag = useCallback((tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag),
    }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
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

  const setCategory = useCallback((category: string | undefined) => {
    setFilters(prev => ({ ...prev, category }));
  }, []);

  const setDifficulty = useCallback((difficulty: SearchFilters['difficulty']) => {
    setFilters(prev => ({ ...prev, difficulty }));
  }, []);

  const setStatus = useCallback((status: SearchFilters['status']) => {
    setFilters(prev => ({ ...prev, status }));
  }, []);

  const setDateRange = useCallback((dateRange: SearchFilters['dateRange']) => {
    setFilters(prev => ({ ...prev, dateRange }));
  }, []);

  // Memoized return value
  return useMemo(() => ({
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
export function useSearchSuggestions(query: string, limit = 5) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
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
      .filter(suggestion => 
        suggestion.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
      .slice(0, limit);

    setTimeout(() => {
      setSuggestions(filteredSuggestions);
      setIsLoading(false);
    }, 100);
  }, [debouncedQuery, limit]);

  return { suggestions, isLoading };
}

// Hook for search history
export function useSearchHistory(maxItems = 10) {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('search-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }
  }, []);

  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setHistory(prev => {
      const newHistory = [query, ...prev.filter(item => item !== query)]
        .slice(0, maxItems);
      
      localStorage.setItem('search-history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, [maxItems]);

  const removeFromHistory = useCallback((query: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item !== query);
      localStorage.setItem('search-history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
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