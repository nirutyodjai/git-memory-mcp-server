'use client';

import { ErrorInfo } from './performance';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error categories
export type ErrorCategory = 
  | 'javascript'
  | 'network'
  | 'resource'
  | 'unhandledrejection'
  | 'api'
  | 'authentication'
  | 'validation'
  | 'permission'
  | 'timeout'
  | 'memory'
  | 'performance';

// Enhanced error interface
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

// Breadcrumb for error context
export interface Breadcrumb {
  timestamp: number;
  message: string;
  category: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  data?: Record<string, any>;
}

// Error report for sending to external services
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

// Error tracking configuration
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

// Default configuration
const DEFAULT_CONFIG: ErrorTrackingConfig = {
  environment: 'development',
  enableConsoleLogging: true,
  enableRemoteLogging: false,
  maxBreadcrumbs: 50,
  maxErrors: 100,
  sampleRate: 1.0,
};

// Error tracking class
export class ErrorTracker {
  private static instance: ErrorTracker;
  private config: ErrorTrackingConfig;
  private errors: Map<string, EnhancedErrorInfo> = new Map();
  private breadcrumbs: Breadcrumb[] = [];
  private sessionId: string;
  private userId?: string;
  
  private constructor(config: Partial<ErrorTrackingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.setupGlobalHandlers();
  }
  
  public static getInstance(config?: Partial<ErrorTrackingConfig>): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker(config);
    }
    return ErrorTracker.instance;
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateFingerprint(error: ErrorInfo): string {
    const key = `${error.message}_${error.filename}_${error.lineno}_${error.type}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }
  
  private setupGlobalHandlers(): void {
    if (typeof window === 'undefined') return;
    
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        type: 'javascript',
        severity: 'high',
        url: window.location.href,
        userAgent: navigator.userAgent,
      }, 'javascript');
    });
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled promise rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        type: 'unhandledrejection',
        severity: 'high',
        url: window.location.href,
        userAgent: navigator.userAgent,
      }, 'unhandledrejection');
    });
    
    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        this.captureError({
          message: `Resource failed to load: ${target.tagName}`,
          filename: (target as any).src || (target as any).href,
          timestamp: Date.now(),
          type: 'resource',
          severity: 'medium',
          url: window.location.href,
          userAgent: navigator.userAgent,
        }, 'resource');
      }
    }, true);
  }
  
  public setUser(userId: string): void {
    this.userId = userId;
  }
  
  public addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
    };
    
    this.breadcrumbs.push(fullBreadcrumb);
    
    // Limit breadcrumbs
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }
  }
  
  public captureError(
    error: ErrorInfo, 
    category: ErrorCategory = 'javascript',
    context?: Record<string, any>,
    tags?: string[]
  ): string {
    // Check sample rate
    if (Math.random() > this.config.sampleRate) {
      return '';
    }
    
    const fingerprint = this.generateFingerprint(error);
    const existingError = this.errors.get(fingerprint);
    
    if (existingError) {
      // Update existing error
      existingError.count = (existingError.count || 1) + 1;
      existingError.lastSeen = Date.now();
      existingError.breadcrumbs = [...this.breadcrumbs];
      
      if (context) {
        existingError.context = { ...existingError.context, ...context };
      }
      
      if (tags) {
        existingError.tags = [...(existingError.tags || []), ...tags];
      }
    } else {
      // Create new error
      const enhancedError: EnhancedErrorInfo = {
        ...error,
        id: this.generateErrorId(),
        category,
        context,
        breadcrumbs: [...this.breadcrumbs],
        tags,
        fingerprint,
        count: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        resolved: false,
        sessionId: this.sessionId,
        userId: this.userId,
      };
      
      // Apply beforeSend hook
      const processedError = this.config.beforeSend ? 
        this.config.beforeSend(enhancedError) : enhancedError;
      
      if (processedError) {
        this.errors.set(fingerprint, processedError);
        
        // Limit stored errors
        if (this.errors.size > this.config.maxErrors) {
          const oldestKey = this.errors.keys().next().value;
          this.errors.delete(oldestKey);
        }
        
        // Console logging
        if (this.config.enableConsoleLogging) {
          this.logToConsole(processedError);
        }
        
        // Remote logging
        if (this.config.enableRemoteLogging) {
          this.sendToRemote(processedError);
        }
        
        // Call onError hook
        if (this.config.onError) {
          this.config.onError(processedError);
        }
        
        return processedError.id;
      }
    }
    
    return existingError?.id || '';
  }
  
  public captureException(exception: Error, context?: Record<string, any>): string {
    return this.captureError({
      message: exception.message,
      stack: exception.stack,
      timestamp: Date.now(),
      type: 'javascript',
      severity: 'high',
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    }, 'javascript', context);
  }
  
  public captureMessage(
    message: string, 
    level: ErrorSeverity = 'medium',
    context?: Record<string, any>
  ): string {
    return this.captureError({
      message,
      timestamp: Date.now(),
      type: 'javascript',
      severity: level,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    }, 'javascript', context);
  }
  
  public captureAPIError(
    url: string,
    status: number,
    statusText: string,
    responseBody?: any
  ): string {
    return this.captureError({
      message: `API Error: ${status} ${statusText}`,
      filename: url,
      timestamp: Date.now(),
      type: 'network',
      severity: status >= 500 ? 'high' : 'medium',
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    }, 'api', {
      apiUrl: url,
      status,
      statusText,
      responseBody,
    });
  }
  
  private logToConsole(error: EnhancedErrorInfo): void {
    const style = this.getConsoleStyle(error.severity);
    
    console.group(`%c[${error.severity.toUpperCase()}] ${error.category}`, style);
    console.error(error.message);
    
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    
    if (error.context) {
      console.error('Context:', error.context);
    }
    
    if (error.breadcrumbs && error.breadcrumbs.length > 0) {
      console.error('Breadcrumbs:', error.breadcrumbs);
    }
    
    console.groupEnd();
  }
  
  private getConsoleStyle(severity: ErrorSeverity): string {
    switch (severity) {
      case 'critical':
        return 'color: white; background-color: #dc2626; font-weight: bold; padding: 2px 4px;';
      case 'high':
        return 'color: white; background-color: #ea580c; font-weight: bold; padding: 2px 4px;';
      case 'medium':
        return 'color: white; background-color: #d97706; font-weight: bold; padding: 2px 4px;';
      case 'low':
        return 'color: white; background-color: #65a30d; font-weight: bold; padding: 2px 4px;';
      default:
        return 'color: white; background-color: #6b7280; font-weight: bold; padding: 2px 4px;';
    }
  }
  
  private async sendToRemote(error: EnhancedErrorInfo): Promise<void> {
    if (!this.config.apiEndpoint || !this.config.apiKey) {
      return;
    }
    
    try {
      const report: ErrorReport = {
        errors: [error],
        environment: {
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          timestamp: Date.now(),
          userId: this.userId,
          sessionId: this.sessionId,
          environment: this.config.environment,
        },
      };
      
      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(report),
      });
    } catch (e) {
      console.error('Failed to send error to remote:', e);
    }
  }
  
  public getErrors(): EnhancedErrorInfo[] {
    return Array.from(this.errors.values());
  }
  
  public getErrorById(id: string): EnhancedErrorInfo | undefined {
    return Array.from(this.errors.values()).find(error => error.id === id);
  }
  
  public getErrorsByCategory(category: ErrorCategory): EnhancedErrorInfo[] {
    return this.getErrors().filter(error => error.category === category);
  }
  
  public getErrorsBySeverity(severity: ErrorSeverity): EnhancedErrorInfo[] {
    return this.getErrors().filter(error => error.severity === severity);
  }
  
  public resolveError(id: string, assignee?: string, notes?: string): boolean {
    const error = this.getErrorById(id);
    if (error) {
      error.resolved = true;
      error.assignee = assignee;
      if (notes) {
        error.notes = [...(error.notes || []), notes];
      }
      return true;
    }
    return false;
  }
  
  public clearErrors(): void {
    this.errors.clear();
  }
  
  public clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }
  
  public generateReport(): ErrorReport {
    return {
      errors: this.getErrors(),
      environment: {
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: Date.now(),
        userId: this.userId,
        sessionId: this.sessionId,
        environment: this.config.environment,
      },
      performance: {
        memory: typeof window !== 'undefined' && 'memory' in window.performance ? 
          (window.performance as any).memory?.usedJSHeapSize : undefined,
      },
    };
  }
  
  public getStats(): {
    totalErrors: number;
    errorsBySeverity: Record<ErrorSeverity, number>;
    errorsByCategory: Record<ErrorCategory, number>;
    resolvedErrors: number;
    unresolvedErrors: number;
  } {
    const errors = this.getErrors();
    
    const errorsBySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + (error.count || 1);
      return acc;
    }, {} as Record<ErrorSeverity, number>);
    
    const errorsByCategory = errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + (error.count || 1);
      return acc;
    }, {} as Record<ErrorCategory, number>);
    
    const resolvedErrors = errors.filter(error => error.resolved).length;
    const unresolvedErrors = errors.filter(error => !error.resolved).length;
    
    return {
      totalErrors: errors.length,
      errorsBySeverity,
      errorsByCategory,
      resolvedErrors,
      unresolvedErrors,
    };
  }
}

// React hook for error tracking
export function useErrorTracking(config?: Partial<ErrorTrackingConfig>) {
  const [tracker] = useState(() => ErrorTracker.getInstance(config));
  const [errors, setErrors] = useState<EnhancedErrorInfo[]>([]);
  const [stats, setStats] = useState(tracker.getStats());
  
  useEffect(() => {
    const updateData = () => {
      setErrors(tracker.getErrors());
      setStats(tracker.getStats());
    };
    
    // Initial update
    updateData();
    
    // Set up periodic updates
    const interval = setInterval(updateData, 5000);
    
    return () => clearInterval(interval);
  }, [tracker]);
  
  const captureError = (error: Error, context?: Record<string, any>) => {
    return tracker.captureException(error, context);
  };
  
  const captureMessage = (message: string, level?: ErrorSeverity, context?: Record<string, any>) => {
    return tracker.captureMessage(message, level, context);
  };
  
  const addBreadcrumb = (breadcrumb: Omit<Breadcrumb, 'timestamp'>) => {
    tracker.addBreadcrumb(breadcrumb);
  };
  
  const resolveError = (id: string, assignee?: string, notes?: string) => {
    const result = tracker.resolveError(id, assignee, notes);
    if (result) {
      setErrors(tracker.getErrors());
      setStats(tracker.getStats());
    }
    return result;
  };
  
  return {
    errors,
    stats,
    captureError,
    captureMessage,
    addBreadcrumb,
    resolveError,
    clearErrors: () => {
      tracker.clearErrors();
      setErrors([]);
      setStats(tracker.getStats());
    },
    generateReport: () => tracker.generateReport(),
  };
}

// Error boundary component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  private tracker: ErrorTracker;
  
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
    this.tracker = ErrorTracker.getInstance();
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.tracker.captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} />;
      }
      
      return (
        <div className="error-boundary p-4 border border-red-300 rounded-lg bg-red-50">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-600">An error occurred in this component. Please try refreshing the page.</p>
          {this.state.error && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-red-700">Error details</summary>
              <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }
    
    return this.props.children;
  }
}