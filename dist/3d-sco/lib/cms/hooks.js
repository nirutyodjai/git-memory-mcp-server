"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useContent = useContent;
exports.useContentById = useContentById;
exports.useContentBySlug = useContentBySlug;
exports.usePublishedContent = usePublishedContent;
exports.useContentByType = useContentByType;
exports.useContentByCategory = useContentByCategory;
exports.useCategories = useCategories;
exports.useCategoryById = useCategoryById;
exports.useActiveCategories = useActiveCategories;
exports.useCategoryTree = useCategoryTree;
exports.useMedia = useMedia;
exports.useMediaById = useMediaById;
exports.usePublicMedia = usePublicMedia;
exports.useMediaByType = useMediaByType;
exports.useContentSearch = useContentSearch;
exports.useContentMutations = useContentMutations;
exports.useCategoryMutations = useCategoryMutations;
exports.useMediaMutations = useMediaMutations;
exports.usePagination = usePagination;
exports.useLocalStorage = useLocalStorage;
exports.useContentFilters = useContentFilters;
exports.useMediaFilters = useMediaFilters;
exports.useBulkOperations = useBulkOperations;
const react_1 = require("react");
const client_1 = require("./client");
function useAsync(asyncFunction, dependencies = []) {
    const [data, setData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const execute = (0, react_1.useCallback)(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await asyncFunction();
            setData(result);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setData(null);
        }
        finally {
            setLoading(false);
        }
    }, dependencies);
    (0, react_1.useEffect)(() => {
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
function useContent(query = {}) {
    return useAsync(() => client_1.cmsClient.getContent(query), [JSON.stringify(query)]);
}
function useContentById(id) {
    return useAsync(() => client_1.cmsClient.getContentById(id), [id]);
}
function useContentBySlug(slug, locale) {
    return useAsync(() => client_1.cmsClient.getContentBySlug(slug, locale), [slug, locale]);
}
function usePublishedContent(query = {}) {
    return useAsync(() => client_1.cmsClient.getPublishedContent(query), [JSON.stringify(query)]);
}
function useContentByType(type, query = {}) {
    return useAsync(() => client_1.cmsClient.getContentByType(type, query), [type, JSON.stringify(query)]);
}
function useContentByCategory(category, query = {}) {
    return useAsync(() => client_1.cmsClient.getContentByCategory(category, query), [category, JSON.stringify(query)]);
}
// Category hooks
function useCategories(query = {}) {
    return useAsync(() => client_1.cmsClient.getCategories(query), [JSON.stringify(query)]);
}
function useCategoryById(id) {
    return useAsync(() => client_1.cmsClient.getCategoryById(id), [id]);
}
function useActiveCategories(locale) {
    return useAsync(() => client_1.cmsClient.getActiveCategories(locale), [locale]);
}
function useCategoryTree(locale) {
    return useAsync(() => client_1.cmsClient.getCategoryTree(locale), [locale]);
}
// Media hooks
function useMedia(query = {}) {
    return useAsync(() => client_1.cmsClient.getMedia(query), [JSON.stringify(query)]);
}
function useMediaById(id) {
    return useAsync(() => client_1.cmsClient.getMediaById(id), [id]);
}
function usePublicMedia(query = {}) {
    return useAsync(() => client_1.cmsClient.getPublicMedia(query), [JSON.stringify(query)]);
}
function useMediaByType(type, query = {}) {
    return useAsync(() => client_1.cmsClient.getMediaByType(type, query), [type, JSON.stringify(query)]);
}
// Search hooks
function useContentSearch(searchQuery, options = {}) {
    const [debouncedQuery, setDebouncedQuery] = (0, react_1.useState)(searchQuery);
    // Debounce search query
    (0, react_1.useEffect)(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);
    return useAsync(() => debouncedQuery ? client_1.cmsClient.searchContent(debouncedQuery, options) : Promise.resolve({ content: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false }, filters: {} }), [debouncedQuery, JSON.stringify(options)]);
}
// Mutation hooks for admin operations
function useContentMutations() {
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const createContent = (0, react_1.useCallback)(async (data) => {
        try {
            setLoading(true);
            setError(null);
            const result = await client_1.cmsClient.createContent(data);
            return result;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create content';
            setError(errorMessage);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    const updateContent = (0, react_1.useCallback)(async (id, data) => {
        try {
            setLoading(true);
            setError(null);
            const result = await client_1.cmsClient.updateContent(id, data);
            return result;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update content';
            setError(errorMessage);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    const deleteContent = (0, react_1.useCallback)(async (id) => {
        try {
            setLoading(true);
            setError(null);
            await client_1.cmsClient.deleteContent(id);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete content';
            setError(errorMessage);
            throw err;
        }
        finally {
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
function useCategoryMutations() {
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const createCategory = (0, react_1.useCallback)(async (data) => {
        try {
            setLoading(true);
            setError(null);
            const result = await client_1.cmsClient.createCategory(data);
            return result;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create category';
            setError(errorMessage);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    const updateCategory = (0, react_1.useCallback)(async (id, data) => {
        try {
            setLoading(true);
            setError(null);
            const result = await client_1.cmsClient.updateCategory(id, data);
            return result;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update category';
            setError(errorMessage);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    const deleteCategory = (0, react_1.useCallback)(async (id, force = false) => {
        try {
            setLoading(true);
            setError(null);
            await client_1.cmsClient.deleteCategory(id, force);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete category';
            setError(errorMessage);
            throw err;
        }
        finally {
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
function useMediaMutations() {
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [uploadProgress, setUploadProgress] = (0, react_1.useState)(0);
    const uploadMedia = (0, react_1.useCallback)(async (file, metadata) => {
        try {
            setLoading(true);
            setError(null);
            setUploadProgress(0);
            // Note: For real upload progress, you'd need to use XMLHttpRequest
            // This is a simplified version
            const result = await client_1.cmsClient.uploadMedia(file, metadata);
            setUploadProgress(100);
            return result;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to upload media';
            setError(errorMessage);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    const updateMedia = (0, react_1.useCallback)(async (id, data) => {
        try {
            setLoading(true);
            setError(null);
            const result = await client_1.cmsClient.updateMedia(id, data);
            return result;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update media';
            setError(errorMessage);
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    const deleteMedia = (0, react_1.useCallback)(async (id) => {
        try {
            setLoading(true);
            setError(null);
            await client_1.cmsClient.deleteMedia(id);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete media';
            setError(errorMessage);
            throw err;
        }
        finally {
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
function usePagination(initialPage = 1, initialLimit = 10) {
    const [page, setPage] = (0, react_1.useState)(initialPage);
    const [limit, setLimit] = (0, react_1.useState)(initialLimit);
    const nextPage = (0, react_1.useCallback)(() => setPage(prev => prev + 1), []);
    const prevPage = (0, react_1.useCallback)(() => setPage(prev => Math.max(1, prev - 1)), []);
    const goToPage = (0, react_1.useCallback)((newPage) => setPage(Math.max(1, newPage)), []);
    const changeLimit = (0, react_1.useCallback)((newLimit) => {
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
function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = (0, react_1.useState)(() => {
        try {
            if (typeof window === 'undefined')
                return initialValue;
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        }
        catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });
    const setValue = (0, react_1.useCallback)((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        }
        catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);
    return [storedValue, setValue];
}
// Filter and sort hooks
function useContentFilters() {
    const [filters, setFilters] = useLocalStorage('cms-content-filters', {});
    const updateFilter = (0, react_1.useCallback)((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, [setFilters]);
    const clearFilters = (0, react_1.useCallback)(() => {
        setFilters({});
    }, [setFilters]);
    const removeFilter = (0, react_1.useCallback)((key) => {
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
function useMediaFilters() {
    const [filters, setFilters] = useLocalStorage('cms-media-filters', {});
    const updateFilter = (0, react_1.useCallback)((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, [setFilters]);
    const clearFilters = (0, react_1.useCallback)(() => {
        setFilters({});
    }, [setFilters]);
    const removeFilter = (0, react_1.useCallback)((key) => {
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
function useBulkOperations() {
    const [selectedItems, setSelectedItems] = (0, react_1.useState)(new Set());
    const selectItem = (0, react_1.useCallback)((id) => {
        setSelectedItems(prev => new Set([...prev, id]));
    }, []);
    const deselectItem = (0, react_1.useCallback)((id) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    }, []);
    const toggleItem = (0, react_1.useCallback)((id) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            }
            else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);
    const selectAll = (0, react_1.useCallback)((items) => {
        setSelectedItems(new Set(items.map(item => item.id)));
    }, []);
    const deselectAll = (0, react_1.useCallback)(() => {
        setSelectedItems(new Set());
    }, []);
    const isSelected = (0, react_1.useCallback)((id) => {
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
//# sourceMappingURL=hooks.js.map