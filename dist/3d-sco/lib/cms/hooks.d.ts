import { Content, Category, Media, ContentQuery, CategoryQuery, MediaQuery, ContentResponse, CategoryResponse, MediaResponse } from './client';
interface UseAsyncState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}
export declare function useContent(query?: ContentQuery): UseAsyncState<ContentResponse>;
export declare function useContentById(id: string): UseAsyncState<Content>;
export declare function useContentBySlug(slug: string, locale?: string): UseAsyncState<Content>;
export declare function usePublishedContent(query?: Partial<ContentQuery>): UseAsyncState<ContentResponse>;
export declare function useContentByType(type: Content['type'], query?: Partial<ContentQuery>): UseAsyncState<ContentResponse>;
export declare function useContentByCategory(category: string, query?: Partial<ContentQuery>): UseAsyncState<ContentResponse>;
export declare function useCategories(query?: CategoryQuery): UseAsyncState<CategoryResponse>;
export declare function useCategoryById(id: string): UseAsyncState<Category>;
export declare function useActiveCategories(locale?: string): UseAsyncState<CategoryResponse>;
export declare function useCategoryTree(locale?: string): UseAsyncState<CategoryResponse>;
export declare function useMedia(query?: MediaQuery): UseAsyncState<MediaResponse>;
export declare function useMediaById(id: string): UseAsyncState<Media>;
export declare function usePublicMedia(query?: Partial<MediaQuery>): UseAsyncState<MediaResponse>;
export declare function useMediaByType(type: Media['type'], query?: Partial<MediaQuery>): UseAsyncState<MediaResponse>;
export declare function useContentSearch(searchQuery: string, options?: Partial<ContentQuery>): UseAsyncState<ContentResponse>;
export declare function useContentMutations(): {
    createContent: any;
    updateContent: any;
    deleteContent: any;
    loading: any;
    error: any;
};
export declare function useCategoryMutations(): {
    createCategory: any;
    updateCategory: any;
    deleteCategory: any;
    loading: any;
    error: any;
};
export declare function useMediaMutations(): {
    uploadMedia: any;
    updateMedia: any;
    deleteMedia: any;
    loading: any;
    error: any;
    uploadProgress: any;
};
export declare function usePagination(initialPage?: number, initialLimit?: number): {
    page: any;
    limit: any;
    nextPage: any;
    prevPage: any;
    goToPage: any;
    changeLimit: any;
    setPage: any;
    setLimit: any;
};
export declare function useLocalStorage<T>(key: string, initialValue: T): readonly [any, any];
export declare function useContentFilters(): {
    filters: any;
    updateFilter: any;
    clearFilters: any;
    removeFilter: any;
    setFilters: any;
};
export declare function useMediaFilters(): {
    filters: any;
    updateFilter: any;
    clearFilters: any;
    removeFilter: any;
    setFilters: any;
};
export declare function useBulkOperations<T extends {
    id: string;
}>(): {
    selectedItems: any;
    selectedIds: unknown[];
    selectedCount: any;
    selectItem: any;
    deselectItem: any;
    toggleItem: any;
    selectAll: any;
    deselectAll: any;
    isSelected: any;
};
export {};
//# sourceMappingURL=hooks.d.ts.map