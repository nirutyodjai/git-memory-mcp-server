import { BlogPost } from '@/lib/blog/blog-service';
interface BlogListProps {
    showFilters?: boolean;
    showSearch?: boolean;
    limit?: number;
    categoryId?: string;
    authorId?: string;
    status?: BlogPost['status'];
    variant?: 'grid' | 'list';
}
export declare function BlogList({ showFilters, showSearch, limit, categoryId, authorId, status, variant, }: BlogListProps): any;
export {};
//# sourceMappingURL=blog-list.d.ts.map