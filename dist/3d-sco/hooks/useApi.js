"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useApi = useApi;
exports.usePaginatedApi = usePaginatedApi;
exports.useUsers = useUsers;
exports.usePosts = usePosts;
exports.useComments = useComments;
exports.useHealthCheck = useHealthCheck;
exports.useAnalytics = useAnalytics;
exports.useCreateUser = useCreateUser;
exports.useCreatePost = useCreatePost;
exports.useCreateComment = useCreateComment;
exports.useTrackAnalytics = useTrackAnalytics;
const react_1 = require("react");
// Generic API hook
function useApi(url, options) {
    const [data, setData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchData = (0, react_1.useCallback)(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers
                },
                ...options
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            setData(result);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
        finally {
            setLoading(false);
        }
    }, [url, options]);
    (0, react_1.useEffect)(() => {
        fetchData();
    }, [fetchData]);
    return {
        data,
        loading,
        error,
        refetch: fetchData
    };
}
// Paginated API hook
function usePaginatedApi(baseUrl, initialParams = {}) {
    const [data, setData] = (0, react_1.useState)([]);
    const [pagination, setPagination] = (0, react_1.useState)({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [params, setParams] = (0, react_1.useState)(initialParams);
    const fetchData = (0, react_1.useCallback)(async (reset = false) => {
        try {
            setLoading(true);
            setError(null);
            const currentPage = reset ? 1 : pagination.page;
            const searchParams = new URLSearchParams({
                page: currentPage.toString(),
                limit: pagination.limit.toString(),
                ...params
            });
            const response = await fetch(`${baseUrl}?${searchParams}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            if (reset) {
                setData(result.data || result.users || result.posts || result.comments || []);
            }
            else {
                setData(prev => [...prev, ...(result.data || result.users || result.posts || result.comments || [])]);
            }
            setPagination(result.pagination);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
        finally {
            setLoading(false);
        }
    }, [baseUrl, params, pagination.page, pagination.limit]);
    const loadMore = (0, react_1.useCallback)(() => {
        if (pagination.page < pagination.pages) {
            setPagination(prev => ({ ...prev, page: prev.page + 1 }));
        }
    }, [pagination.page, pagination.pages]);
    const refetch = (0, react_1.useCallback)(() => {
        fetchData(true);
    }, [fetchData]);
    (0, react_1.useEffect)(() => {
        fetchData(pagination.page === 1);
    }, [params, pagination.page]);
    return {
        data,
        pagination,
        loading,
        error,
        refetch,
        loadMore,
        hasMore: pagination.page < pagination.pages
    };
}
// Specific hooks for different entities
function useUsers(params = {}) {
    return usePaginatedApi('/api/users', params);
}
function usePosts(params = {}) {
    return usePaginatedApi('/api/posts', params);
}
function useComments(params = {}) {
    return usePaginatedApi('/api/comments', params);
}
function useHealthCheck() {
    return useApi('/api/health');
}
// Analytics hooks
function useAnalytics(type, params = {}) {
    const searchParams = new URLSearchParams({
        ...(type && { type }),
        ...params
    });
    return useApi(`/api/analytics?${searchParams}`);
}
// Mutation hooks
function useCreateUser() {
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const createUser = (0, react_1.useCallback)(async (userData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create user');
            }
            return await response.json();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    return { createUser, loading, error };
}
function useCreatePost() {
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const createPost = (0, react_1.useCallback)(async (postData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create post');
            }
            return await response.json();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    return { createPost, loading, error };
}
function useCreateComment() {
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const createComment = (0, react_1.useCallback)(async (commentData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commentData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create comment');
            }
            return await response.json();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            throw err;
        }
        finally {
            setLoading(false);
        }
    }, []);
    return { createComment, loading, error };
}
// Analytics tracking hook
function useTrackAnalytics() {
    const trackEvent = (0, react_1.useCallback)(async (type, data) => {
        try {
            await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, ...data })
            });
        }
        catch (error) {
            console.error('Failed to track analytics:', error);
        }
    }, []);
    return { trackEvent };
}
