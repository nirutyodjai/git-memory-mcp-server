import type { SEOConfig } from './meta-tags';
export interface SEOAnalytics {
    pageViews: number;
    bounceRate: number;
    avgTimeOnPage: number;
    searchImpressions: number;
    searchClicks: number;
    ctr: number;
    avgPosition: number;
    keywords: Array<{
        keyword: string;
        position: number;
        clicks: number;
        impressions: number;
    }>;
}
export interface SEOAudit {
    score: number;
    issues: Array<{
        type: 'error' | 'warning' | 'info';
        message: string;
        element?: string;
        recommendation: string;
    }>;
    recommendations: string[];
}
export declare function useSEOState(initialConfig?: Partial<SEOConfig>): {
    seoConfig: any;
    updateSEO: (updates: Partial<SEOConfig>) => void;
    optimizeSEO: () => void;
    isLoading: any;
    error: any;
};
export declare function useRouteSEO(): any;
export declare function useContentSEO(content: string): any;
export declare function auditSEO(element: HTMLElement): SEOAudit;
export declare class SEOMonitor {
    private analytics;
    trackPageView(): void;
    trackSearchClick(keyword: string, position: number): void;
    trackSearchImpression(keyword: string, position: number): void;
    private updateCTR;
    private sendAnalytics;
    getAnalytics(): SEOAnalytics;
    reset(): void;
}
export declare const seoMonitor: SEOMonitor;
export declare function useSEOMonitor(): {
    analytics: any;
    trackPageView: () => void;
    trackSearchClick: (keyword: string, position: number) => void;
    trackSearchImpression: (keyword: string, position: number) => void;
    reset: () => void;
};
declare const _default: {
    useSEOState: typeof useSEOState;
    useRouteSEO: typeof useRouteSEO;
    useContentSEO: typeof useContentSEO;
    useSEOMonitor: typeof useSEOMonitor;
    auditSEO: typeof auditSEO;
    seoMonitor: SEOMonitor;
};
export default _default;
//# sourceMappingURL=utils.d.ts.map