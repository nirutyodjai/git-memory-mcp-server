export interface User {
    id: string;
    email: string;
    username: string;
    name?: string;
    avatar?: string;
    bio?: string;
    role: 'USER' | 'ADMIN' | 'MODERATOR';
    verified: boolean;
    createdAt: string;
    _count?: {
        posts: number;
        comments: number;
        likes: number;
    };
}
export interface Post {
    id: string;
    title: string;
    content: string;
    excerpt?: string;
    slug: string;
    published: boolean;
    featured: boolean;
    tags: string[];
    metadata?: Record<string, any>;
    authorId: string;
    author: {
        id: string;
        username: string;
        name?: string;
        avatar?: string;
    };
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    _count: {
        comments: number;
        likes: number;
    };
}
export interface Comment {
    id: string;
    content: string;
    postId: string;
    authorId: string;
    parentId?: string;
    author: {
        id: string;
        username: string;
        name?: string;
        avatar?: string;
    };
    post: {
        id: string;
        title: string;
        slug: string;
    };
    parent?: {
        id: string;
        content: string;
        author: {
            username: string;
            name?: string;
        };
    };
    replies?: Comment[];
    createdAt: string;
    updatedAt: string;
    _count: {
        likes: number;
        replies: number;
    };
}
export interface ApiResponse<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    loading: boolean;
    error: string | null;
    refetch: () => void;
    loadMore: () => void;
    hasMore: boolean;
}
export declare function useApi<T>(url: string, options?: RequestInit): ApiResponse<T>;
export declare function usePaginatedApi<T>(baseUrl: string, initialParams?: Record<string, any>): PaginatedResponse<T>;
export declare function useUsers(params?: Record<string, any>): PaginatedResponse<User>;
export declare function usePosts(params?: Record<string, any>): PaginatedResponse<Post>;
export declare function useComments(params?: Record<string, any>): PaginatedResponse<Comment>;
export declare function useHealthCheck(): ApiResponse<{
    status: string;
    timestamp: string;
    services: {
        database: {
            status: string;
            timestamp: string;
        };
        server: {
            status: string;
            uptime: number;
            memory: any;
            version: string;
        };
    };
}>;
export declare function useAnalytics(type?: string, params?: Record<string, any>): ApiResponse<{
    analytics?: any[];
    summary?: {
        userEvents: number;
        postEvents: number;
        systemEvents: number;
        total: number;
    };
    total?: number;
    type: string;
    pagination?: {
        page: number;
        limit: number;
        pages: number;
    };
}>;
export declare function useCreateUser(): {
    createUser: any;
    loading: any;
    error: any;
};
export declare function useCreatePost(): {
    createPost: any;
    loading: any;
    error: any;
};
export declare function useCreateComment(): {
    createComment: any;
    loading: any;
    error: any;
};
export declare function useTrackAnalytics(): {
    trackEvent: any;
};
//# sourceMappingURL=useApi.d.ts.map