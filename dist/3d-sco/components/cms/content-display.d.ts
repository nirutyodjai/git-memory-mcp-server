interface ContentDisplayProps {
    type?: 'page' | 'post' | 'project' | 'skill';
    categorySlug?: string;
    featured?: boolean;
    limit?: number;
    showSearch?: boolean;
    showFilters?: boolean;
    showPagination?: boolean;
    layout?: 'grid' | 'list' | 'card';
}
export declare function ContentDisplay({ type, categorySlug, featured, limit, showSearch, showFilters, showPagination, layout }: ContentDisplayProps): any;
export default ContentDisplay;
//# sourceMappingURL=content-display.d.ts.map