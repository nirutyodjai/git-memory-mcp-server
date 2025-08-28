export declare function GoogleAnalytics({ gaId }: {
    gaId: string;
}): any;
export declare function GoogleTagManager({ gtmId }: {
    gtmId: string;
}): any;
export declare function FacebookPixel({ pixelId }: {
    pixelId: string;
}): null;
export declare function useAnalytics(): {
    trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
    trackPageView: (url: string) => void;
    trackConversion: (conversionName: string, value?: number) => void;
    trackUserEngagement: (action: string, category?: string) => void;
};
export declare function usePerformanceMonitoring(): void;
export declare function useErrorTracking(): void;
interface AnalyticsProviderProps {
    children: React.ReactNode;
    gaId?: string;
    gtmId?: string;
    pixelId?: string;
}
export declare function AnalyticsProvider({ children, gaId, gtmId, pixelId }: AnalyticsProviderProps): any;
export default AnalyticsProvider;
//# sourceMappingURL=analytics.d.ts.map