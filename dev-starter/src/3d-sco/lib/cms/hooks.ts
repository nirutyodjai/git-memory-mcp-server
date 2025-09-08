'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CMSClient,
  cmsClient,
  Content,
  Category,
  Media,
  ContentQuery,
  CategoryQuery,
  MediaQuery,
  ContentResponse,
  CategoryResponse,
  MediaResponse,
} from './client';

// Base hook for API calls with loading and error states
interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: any[] = []
): UseAsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    refetch: execute,
  };
}

// Content hooks
export function useContent(query: ContentQuery = {}) {
  return useAsync<ContentResponse>(
    () => cmsClient.getContent(query),
    [JSON.stringify(query)]
  );
}

export function useContentById(id: string) {
  return useAsync<Content>(
    () => cmsClient.getContentById(id),
    [id]
  );
}

export function useContentBySlug(slug: string, locale?: string) {
  return useAsync<Content>(
    () => cmsClient.getContentBySlug(slug, locale),
    [slug, locale]
  );
}

export function usePublishedContent(query: Partial<ContentQuery> = {}) {
  return useAsync<ContentResponse>(
    () => cmsClient.getPublishedContent(query),
    [JSON.stringify(query)]
  );
}

export function useContentByType(type: Content['type'], query: Partial<ContentQuery> = {}) {
  return useAsync<ContentResponse>(
    () => cmsClient.getContentByType(type, query),
    [type, JSON.stringify(query)]
  );
}

export function useContentByCategory(category: string, query: Partial<ContentQuery> = {}) {
  return useAsync<ContentResponse>(
    () => cmsClient.getContentByCategory(category, query),
    [category, JSON.stringify(query)]
  );
}

// Category hooks
export function useCategories(query: CategoryQuery = {}) {
  return useAsync<CategoryResponse>(
    () => cmsClient.getCategories(query),
    [JSON.stringify(query)]
  );
}

export function useCategoryById(id: string) {
  return useAsync<Category>(
    () => cmsClient.getCategoryById(id),
    [id]
  );
}

export function useActiveCategories(locale?: string) {
  return useAsync<CategoryResponse>(
    () => cmsClient.getActiveCategories(locale),
    [locale]
  );
}

export function useCategoryTree(locale?: string) {
  return useAsync<CategoryResponse>(
    () => cmsClient.getCategoryTree(locale),
    [locale]
  );
}

// Media hooks
export function useMedia(query: MediaQuery = {}) {
  return useAsync<MediaResponse>(
    () => cmsClient.getMedia(query),
    [JSON.stringify(query)]
  );
}

export function useMediaById(id: string) {
  return useAsync<Media>(
    () => cmsClient.getMediaById(id),
    [id]
  );
}

export function usePublicMedia(query: Partial<MediaQuery> = {}) {
  return useAsync<MediaResponse>(
    () => cmsClient.getPublicMedia(query),
    [JSON.stringify(query)]
  );
}

export function useMediaByType(type: Media['type'], query: Partial<MediaQuery> = {}) {
  return useAsync<MediaResponse>(
    () => cmsClient.getMediaByType(type, query),
    [type, JSON.stringify(query)]
  );
}

// Search hooks
export function useContentSearch(searchQuery: string, options: Partial<ContentQuery> = {}) {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return useAsync<ContentResponse>(
    () => debouncedQuery ? cmsClient.searchContent(debouncedQuery, options) : Promise.resolve({ content: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false }, filters: {} }),
    [debouncedQuery, JSON.stringify(options)]
  );
}

// Mutation hooks for admin operations
export function useContentMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createContent = useCallback(async (data: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await cmsClient.createContent(data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create content';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateContent = useCallback(async (id: string, data: Partial<Content>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await cmsClient.updateContent(id, data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update content';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteContent = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await cmsClient.deleteContent(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete content';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createContent,
    updateContent,
    deleteContent,
    loading,
    error,
  };
}

export function useCategoryMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCategory = useCallback(async (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'children'>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await cmsClient.createCategory(data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create category';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCategory = useCallback(async (id: string, data: Partial<Category>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await cmsClient.updateCategory(id, data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update category';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string, force: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      await cmsClient.deleteCategory(id, force);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    loading,
    error,
  };
}

export function useMediaMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMedia = useCallback(async (
    file: File,
    metadata?: Partial<Omit<Media, 'id' | 'name' | 'originalName' | 'url' | 'type' | 'mimeType' | 'size' | 'uploadedBy' | 'createdAt' | 'updatedAt'>>
  ) => {
    try {
      setLoading(true);
      setError(null);
      setUploadProgress(0);
      
      // Note: For real upload progress, you'd need to use XMLHttpRequest
      // This is a simplified version
      const result = await cmsClient.uploadMedia(file, metadata);
      setUploadProgress(100);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload media';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMedia = useCallback(async (id: string, data: Partial<Media>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await cmsClient.updateMedia(id, data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update media';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMedia = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await cmsClient.deleteMedia(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete media';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    uploadMedia,
    updateMedia,
    deleteMedia,
    loading,
    error,
    uploadProgress,
  };
}

// Utility hooks
export function usePagination(initialPage: number = 1, initialLimit: number = 10) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const nextPage = useCallback(() => setPage(prev => prev + 1), []);
  const prevPage = useCallback(() => setPage(prev => Math.max(1, prev - 1)), []);
  const goToPage = useCallback((newPage: number) => setPage(Math.max(1, newPage)), []);
  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  }, []);

  return {
    page,
    limit,
    nextPage,
    prevPage,
    goToPage,
    changeLimit,
    setPage,
    setLimit,
  };
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

// Filter and sort hooks
export function useContentFilters() {
  const [filters, setFilters] = useLocalStorage<ContentQuery>('cms-content-filters', {});

  const updateFilter = useCallback((key: keyof ContentQuery, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, [setFilters]);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  const removeFilter = useCallback((key: keyof ContentQuery) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, [setFilters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    removeFilter,
    setFilters,
  };
}

export function useMediaFilters() {
  const [filters, setFilters] = useLocalStorage<MediaQuery>('cms-media-filters', {});

  const updateFilter = useCallback((key: keyof MediaQuery, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, [setFilters]);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  const removeFilter = useCallback((key: keyof MediaQuery) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, [setFilters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    removeFilter,
    setFilters,
  };
}

// Bulk operations hook
export function useBulkOperations<T extends { id: string }>() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const selectItem = useCallback((id: string) => {
    setSelectedItems(prev => new Set([...prev, id]));
  }, []);

  const deselectItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const toggleItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((items: T[]) => {
    setSelectedItems(new Set(items.map(item => item.id)));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedItems.has(id);
  }, [selectedItems]);

  const selectedCount = selectedItems.size;
  const selectedIds = Array.from(selectedItems);

  return {
    selectedItems,
    selectedIds,
    selectedCount,
    selectItem,
    deselectItem,
    toggleItem,
    selectAll,
    deselectAll,
    isSelected,
  };
}