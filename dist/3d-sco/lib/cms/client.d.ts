export interface Content {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    status: 'draft' | 'published' | 'archived';
    type: 'page' | 'post' | 'project' | 'skill';
    category?: string;
    tags: string[];
    featuredImage?: string;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        keywords: string[];
        ogImage?: string;
    };
    publishedAt?: string;
    locale: 'th' | 'en' | 'zh' | 'ja';
    createdAt: string;
    updatedAt: string;
}
export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    icon?: string;
    parentId?: string;
    isActive: boolean;
    sortOrder: number;
    locale: 'th' | 'en' | 'zh' | 'ja';
    children?: Category[];
    createdAt: string;
    updatedAt: string;
}
export interface Media {
    id: string;
    name: string;
    originalName: string;
    url: string;
    thumbnailUrl?: string;
    type: 'image' | 'video' | 'audio' | 'document' | 'other';
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    alt?: string;
    caption?: string;
    description?: string;
    tags: string[];
    category?: string;
    isPublic: boolean;
    uploadedBy: string;
    createdAt: string;
    updatedAt: string;
}
export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface ContentResponse {
    content: Content[];
    pagination: PaginationInfo;
    filters: {
        status?: string;
        type?: string;
        category?: string;
        locale?: string;
        search?: string;
    };
}
export interface CategoryResponse {
    categories: Category[];
    total: number;
}
export interface MediaResponse {
    media: Media[];
    pagination: PaginationInfo;
    stats: {
        totalFiles: number;
        totalSize: number;
        typeStats: Record<string, number>;
    };
    filters: {
        type?: string;
        category?: string;
        isPublic?: boolean;
        search?: string;
    };
}
export interface ContentQuery {
    page?: number;
    limit?: number;
    status?: 'draft' | 'published' | 'archived';
    type?: 'page' | 'post' | 'project' | 'skill';
    category?: string;
    search?: string;
    locale?: 'th' | 'en' | 'zh' | 'ja';
    sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
}
export interface CategoryQuery {
    locale?: 'th' | 'en' | 'zh' | 'ja';
    parentId?: string;
    isActive?: boolean;
    includeChildren?: boolean;
}
export interface MediaQuery {
    page?: number;
    limit?: number;
    type?: 'image' | 'video' | 'audio' | 'document' | 'other';
    category?: string;
    search?: string;
    isPublic?: boolean;
    sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'size';
    sortOrder?: 'asc' | 'desc';
}
export declare class CMSClient {
    private baseUrl;
    private defaultHeaders;
    constructor(baseUrl?: string);
    private request;
    private buildQueryString;
    getContent(query?: ContentQuery): Promise<ContentResponse>;
    getContentById(id: string): Promise<Content>;
    getContentBySlug(slug: string, locale?: string): Promise<Content>;
    createContent(data: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>): Promise<Content>;
    updateContent(id: string, data: Partial<Content>): Promise<Content>;
    deleteContent(id: string): Promise<void>;
    getCategories(query?: CategoryQuery): Promise<CategoryResponse>;
    getCategoryById(id: string): Promise<Category>;
    createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'children'>): Promise<Category>;
    updateCategory(id: string, data: Partial<Category>): Promise<Category>;
    deleteCategory(id: string, force?: boolean): Promise<void>;
    getMedia(query?: MediaQuery): Promise<MediaResponse>;
    getMediaById(id: string): Promise<Media>;
    uploadMedia(file: File, metadata?: Partial<Omit<Media, 'id' | 'name' | 'originalName' | 'url' | 'type' | 'mimeType' | 'size' | 'uploadedBy' | 'createdAt' | 'updatedAt'>>): Promise<Media>;
    updateMedia(id: string, data: Partial<Media>): Promise<Media>;
    deleteMedia(id: string): Promise<void>;
    searchContent(query: string, options?: Partial<ContentQuery>): Promise<ContentResponse>;
    getPublishedContent(options?: Partial<ContentQuery>): Promise<ContentResponse>;
    getContentByType(type: Content['type'], options?: Partial<ContentQuery>): Promise<ContentResponse>;
    getContentByCategory(category: string, options?: Partial<ContentQuery>): Promise<ContentResponse>;
    getActiveCategories(locale?: string): Promise<CategoryResponse>;
    getCategoryTree(locale?: string): Promise<CategoryResponse>;
    getPublicMedia(options?: Partial<MediaQuery>): Promise<MediaResponse>;
    getMediaByType(type: Media['type'], options?: Partial<MediaQuery>): Promise<MediaResponse>;
}
export declare const cmsClient: CMSClient;
export declare function useCMSClient(): CMSClient;
export declare function formatFileSize(bytes: number): string;
export declare function getMediaTypeIcon(type: Media['type']): string;
export declare function isImageType(mimeType: string): boolean;
export declare function isVideoType(mimeType: string): boolean;
export declare function generateSlug(title: string): string;
export declare function truncateText(text: string, maxLength: number): string;
export declare function stripHtml(html: string): string;
export declare function getExcerpt(content: string, maxLength?: number): string;
//# sourceMappingURL=client.d.ts.map