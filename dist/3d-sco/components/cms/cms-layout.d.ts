interface CMSLayoutProps {
    children: React.ReactNode;
    sidebar?: React.ReactNode;
    header?: React.ReactNode;
    showSidebar?: boolean;
    sidebarCollapsed?: boolean;
    onSidebarToggle?: () => void;
}
interface CMSSidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
}
interface CMSHeaderProps {
    title?: string;
    description?: string;
    actions?: React.ReactNode;
    breadcrumbs?: Array<{
        label: string;
        href?: string;
    }>;
}
interface CMSStatsProps {
    stats: Array<{
        label: string;
        value: string | number;
        icon: React.ReactNode;
        trend?: {
            value: number;
            isPositive: boolean;
        };
    }>;
}
interface CMSContentGridProps {
    children: React.ReactNode;
    columns?: 1 | 2 | 3 | 4;
    gap?: 'sm' | 'md' | 'lg';
}
interface CMSToolbarProps {
    searchPlaceholder?: string;
    onSearch?: (query: string) => void;
    filters?: React.ReactNode;
    actions?: React.ReactNode;
    viewMode?: 'grid' | 'list';
    onViewModeChange?: (mode: 'grid' | 'list') => void;
}
export declare function CMSLayout({ children, sidebar, header, showSidebar, sidebarCollapsed, onSidebarToggle }: CMSLayoutProps): any;
export declare function CMSSidebar({ collapsed, onToggle, activeTab, onTabChange }: CMSSidebarProps): any;
export declare function CMSHeader({ title, description, actions, breadcrumbs }: CMSHeaderProps): any;
export declare function CMSStats({ stats }: CMSStatsProps): any;
export declare function CMSContentGrid({ children, columns, gap }: CMSContentGridProps): any;
export declare function CMSToolbar({ searchPlaceholder, onSearch, filters, actions, viewMode, onViewModeChange }: CMSToolbarProps): any;
export declare function CMSContentCard({ title, description, image, status, type, author, publishedAt, tags, onEdit, onDelete, onView }: {
    title: string;
    description?: string;
    image?: string;
    status: 'draft' | 'published' | 'archived';
    type: string;
    author?: string;
    publishedAt?: Date;
    tags?: string[];
    onEdit?: () => void;
    onDelete?: () => void;
    onView?: () => void;
}): any;
export default CMSLayout;
//# sourceMappingURL=cms-layout.d.ts.map