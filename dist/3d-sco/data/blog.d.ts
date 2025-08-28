export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage?: string;
    author: {
        name: string;
        avatar?: string;
        bio?: string;
    };
    tags: string[];
    category: string;
    publishedAt: Date;
    updatedAt: Date;
    isPublished: boolean;
    readingTime: number;
    views: number;
    likes: number;
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string[];
    };
}
export interface BlogCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    postCount: number;
}
export interface BlogTag {
    id: string;
    name: string;
    slug: string;
    postCount: number;
}
export declare const BLOG_CATEGORIES: BlogCategory[];
export declare const BLOG_TAGS: BlogTag[];
export declare const SAMPLE_BLOG_POSTS: BlogPost[];
export declare function getBlogPostBySlug(slug: string): BlogPost | undefined;
export declare function getBlogPostsByCategory(category: string): BlogPost[];
export declare function getBlogPostsByTag(tag: string): BlogPost[];
export declare function getPublishedBlogPosts(): BlogPost[];
export declare function getRelatedPosts(currentPost: BlogPost, limit?: number): BlogPost[];
export declare function calculateReadingTime(content: string): number;
//# sourceMappingURL=blog.d.ts.map