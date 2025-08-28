import { SearchResult } from '@/hooks/use-search';
interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onSearch?: () => void;
    placeholder?: string;
    showSuggestions?: boolean;
    className?: string;
}
export declare function SearchInput({ value, onChange, onSearch, placeholder, showSuggestions, className, }: SearchInputProps): any;
interface FilterPanelProps {
    filters: any;
    availableFilters?: any;
    onFiltersChange: (filters: any) => void;
    onReset: () => void;
}
export declare function FilterPanel({ filters, availableFilters, onFiltersChange, onReset }: FilterPanelProps): any;
interface SearchResultsProps {
    results: SearchResult[];
    isLoading: boolean;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
}
export declare function SearchResults({ results, isLoading, viewMode, onViewModeChange }: SearchResultsProps): any;
interface SearchInterfaceProps {
    className?: string;
    initialQuery?: string;
    showFilters?: boolean;
    showSort?: boolean;
}
export declare function SearchInterface({ className, initialQuery, showFilters, showSort }: SearchInterfaceProps): any;
export {};
//# sourceMappingURL=search-interface.d.ts.map