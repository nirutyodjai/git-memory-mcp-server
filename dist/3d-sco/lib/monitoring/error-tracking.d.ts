import { ErrorInfo } from './performance';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'javascript' | 'network' | 'resource' | 'unhandledrejection' | 'api' | 'authentication' | 'validation' | 'permission' | 'timeout' | 'memory' | 'performance';
export interface EnhancedErrorInfo extends ErrorInfo {
    id: string;
    category: ErrorCategory;
    context?: Record<string, any>;
    breadcrumbs?: Breadcrumb[];
    tags?: string[];
    fingerprint?: string;
    count?: number;
    firstSeen?: number;
    lastSeen?: number;
    resolved?: boolean;
    assignee?: string;
    notes?: string[];
}
export interface Breadcrumb {
    timestamp: number;
    message: string;
    category: string;
    level: 'info' | 'warning' | 'error' | 'debug';
    data?: Record<string, any>;
}
export interface ErrorReport {
    errors: EnhancedErrorInfo[];
    environment: {
        url: string;
        userAgent: string;
        timestamp: number;
        userId?: string;
        sessionId: string;
        buildVersion?: string;
        environment: 'development' | 'staging' | 'production';
    };
    performance?: {
        memory?: number;
        timing?: Record<string, number>;
    };
}
export interface ErrorTrackingConfig {
    apiEndpoint?: string;
    apiKey?: string;
    environment: 'development' | 'staging' | 'production';
    enableConsoleLogging: boolean;
    enableRemoteLogging: boolean;
    maxBreadcrumbs: number;
    maxErrors: number;
    sampleRate: number;
    beforeSend?: (error: EnhancedErrorInfo) => EnhancedErrorInfo | null;
    onError?: (error: EnhancedErrorInfo) => void;
}
export declare class ErrorTracker {
    private static instance;
    private config;
    private errors;
    private breadcrumbs;
    private sessionId;
    private userId?;
    private constructor();
    static getInstance(config?: Partial<ErrorTrackingConfig>): ErrorTracker;
    private generateSessionId;
    private generateErrorId;
    private generateFingerprint;
    private setupGlobalHandlers;
    setUser(userId: string): void;
    addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void;
    captureError(error: ErrorInfo, category?: ErrorCategory, context?: Record<string, any>, tags?: string[]): string;
    captureException(exception: Error, context?: Record<string, any>): string;
    captureMessage(message: string, level?: ErrorSeverity, context?: Record<string, any>): string;
    captureAPIError(url: string, status: number, statusText: string, responseBody?: any): string;
    private logToConsole;
    private getConsoleStyle;
    private sendToRemote;
    getErrors(): EnhancedErrorInfo[];
    getErrorById(id: string): EnhancedErrorInfo | undefined;
    getErrorsByCategory(category: ErrorCategory): EnhancedErrorInfo[];
    getErrorsBySeverity(severity: ErrorSeverity): EnhancedErrorInfo[];
    resolveError(id: string, assignee?: string, notes?: string): boolean;
    clearErrors(): void;
    clearBreadcrumbs(): void;
    generateReport(): ErrorReport;
    getStats(): {
        totalErrors: number;
        errorsBySeverity: Record<ErrorSeverity, number>;
        errorsByCategory: Record<ErrorCategory, number>;
        resolvedErrors: number;
        unresolvedErrors: number;
    };
}
export declare function useErrorTracking(config?: Partial<ErrorTrackingConfig>): {
    errors: any;
    stats: any;
    captureError: (error: Error, context?: Record<string, any>) => any;
    captureMessage: (message: string, level?: ErrorSeverity, context?: Record<string, any>) => any;
    addBreadcrumb: (breadcrumb: Omit<Breadcrumb, "timestamp">) => void;
    resolveError: (id: string, assignee?: string, notes?: string) => any;
    clearErrors: () => void;
    generateReport: () => any;
};
export declare class ErrorBoundary extends React.Component<{
    children: React.ReactNode;
    fallback?: React.ComponentType<{
        error: Error;
    }>;
}, {
    hasError: boolean;
    error?: Error;
}> {
    private tracker;
    constructor(props: any);
    static getDerivedStateFromError(error: Error): {
        hasError: boolean;
        error: Error;
    };
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    render(): any;
}
//# sourceMappingURL=error-tracking.d.ts.map