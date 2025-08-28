export interface PerformanceMetrics {
    lcp: number | null;
    fid: number | null;
    cls: number | null;
    fcp: number | null;
    ttfb: number | null;
    pageLoadTime: number | null;
    domContentLoaded: number | null;
    resourceLoadTime: number | null;
    memoryUsage: number | null;
    timeToInteractive: number | null;
    totalBlockingTime: number | null;
}
export interface ResourceTiming {
    name: string;
    duration: number;
    size: number;
    type: string;
    startTime: number;
    endTime: number;
}
export interface PerformanceReport {
    url: string;
    timestamp: number;
    userAgent: string;
    connection: string;
    metrics: PerformanceMetrics;
    resources: ResourceTiming[];
    errors: ErrorInfo[];
    warnings: string[];
}
export interface ErrorInfo {
    message: string;
    stack?: string;
    filename?: string;
    lineno?: number;
    colno?: number;
    timestamp: number;
    type: 'javascript' | 'network' | 'resource' | 'unhandledrejection';
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
    sessionId?: string;
    url: string;
    userAgent: string;
}
export declare class PerformanceMonitor {
    private static instance;
    private metrics;
    private errors;
    private observers;
    private reportCallback?;
    private sessionId;
    private constructor();
    static getInstance(): PerformanceMonitor;
    private generateSessionId;
    private initializeMetrics;
    private setupPerformanceObservers;
    private setupErrorHandlers;
    recordError(error: ErrorInfo): void;
    getMetrics(): PerformanceMetrics;
    getErrors(): ErrorInfo[];
    getResourceTimings(): ResourceTiming[];
    private getResourceType;
    generateReport(): PerformanceReport;
    private getConnectionInfo;
    private generateWarnings;
    setReportCallback(callback: (report: PerformanceReport) => void): void;
    sendReport(): void;
    startPeriodicReporting(intervalMs?: number): void;
    cleanup(): void;
}
export declare function usePerformanceMonitor(): {
    metrics: any;
    errors: any;
    isLoading: any;
    generateReport: () => any;
    recordCustomError: (error: Partial<ErrorInfo>) => void;
};
export declare function measurePerformance<T>(name: string, fn: () => T): T;
export declare function measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T>;
export declare function getWebVitalsScore(metrics: PerformanceMetrics): {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    details: Record<string, {
        value: number | null;
        score: number;
        threshold: string;
    }>;
};
//# sourceMappingURL=performance.d.ts.map