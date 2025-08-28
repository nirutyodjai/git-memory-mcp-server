export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    featuredImage?: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
        bio?: string;
    };
    category: BlogCategory;
    tags: string[];
    status: 'draft' | 'published' | 'archived';
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    views: number;
    likes: number;
    comments: BlogComment[];
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string[];
        canonicalUrl?: string;
    };
}
export interface BlogCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    parentId?: string;
    postCount: number;
}
export interface BlogComment {
    id: string;
    postId: string;
    author: {
        name: string;
        email: string;
        avatar?: string;
    };
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    parentId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface BlogStats {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalViews: number;
    totalComments: number;
    totalCategories: number;
    popularPosts: BlogPost[];
    recentPosts: BlogPost[];
}
export interface BlogSearchFilters {
    query?: string;
    category?: string;
    tags?: string[];
    author?: string;
    status?: BlogPost['status'];
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: 'createdAt' | 'publishedAt' | 'views' | 'likes' | 'title';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
export interface BlogSearchResult {
    posts: BlogPost[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class BlogService {
    private posts;
    private categories;
    private comments;
    constructor();
    private initializeDefaultData;
    getPosts(filters?: BlogSearchFilters): Promise<BlogSearchResult>;
    getPostById(id: string): Promise<BlogPost | null>;
    getPostBySlug(slug: string): Promise<BlogPost | null>;
    createPost(postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'comments'>): Promise<BlogPost>;
    updatePost(id: string, updates: Partial<BlogPost>): Promise<BlogPost>;
    deletePost(id: string): Promise<void>;
    publishPost(id: string): Promise<BlogPost>;
    unpublishPost(id: string): Promise<BlogPost>;
    incrementViews(id: string): Promise<void>;
    toggleLike(id: string): Promise<BlogPost>;
    getCategories(): Promise<BlogCategory[]>;
    getCategoryById(id: string): Promise<BlogCategory | null>;
    getCategoryBySlug(slug: string): Promise<BlogCategory | null>;
    createCategory(categoryData: Omit<BlogCategory, 'id' | 'postCount'>): Promise<BlogCategory>;
    updateCategory(id: string, updates: Partial<BlogCategory>): Promise<BlogCategory>;
    deleteCategory(id: string): Promise<void>;
    private updateCategoryPostCount;
    getComments(postId?: string): Promise<BlogComment[]>;
    addComment(commentData: Omit<BlogComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogComment>;
    updateComment(id: string, updates: Partial<BlogComment>): Promise<BlogComment>;
    deleteComment(id: string): Promise<void>;
    approveComment(id: string): Promise<BlogComment>;
    rejectComment(id: string): Promise<BlogComment>;
    getBlogStats(): Promise<BlogStats>;
    getAllTags(): Promise<string[]>;
    getRelatedPosts(postId: string, limit?: number): Promise<BlogPost[]>;
    generateSlug(title: string): string;
}
//# sourceMappingURL=blog-service.d.ts.map