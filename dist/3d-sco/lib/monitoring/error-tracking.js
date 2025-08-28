"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorBoundary = exports.ErrorTracker = void 0;
exports.useErrorTracking = useErrorTracking;
// Default configuration
const DEFAULT_CONFIG = {
    environment: 'development',
    enableConsoleLogging: true,
    enableRemoteLogging: false,
    maxBreadcrumbs: 50,
    maxErrors: 100,
    sampleRate: 1.0,
};
// Error tracking class
class ErrorTracker {
    constructor(config = {}) {
        this.errors = new Map();
        this.breadcrumbs = [];
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.sessionId = this.generateSessionId();
        this.setupGlobalHandlers();
    }
    static getInstance(config) {
        if (!ErrorTracker.instance) {
            ErrorTracker.instance = new ErrorTracker(config);
        }
        return ErrorTracker.instance;
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateFingerprint(error) {
        const key = `${error.message}_${error.filename}_${error.lineno}_${error.type}`;
        return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    }
    setupGlobalHandlers() {
        if (typeof window === 'undefined')
            return;
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
                const target = event.target;
                this.captureError({
                    message: `Resource failed to load: ${target.tagName}`,
                    filename: target.src || target.href,
                    timestamp: Date.now(),
                    type: 'resource',
                    severity: 'medium',
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                }, 'resource');
            }
        }, true);
    }
    setUser(userId) {
        this.userId = userId;
    }
    addBreadcrumb(breadcrumb) {
        const fullBreadcrumb = {
            ...breadcrumb,
            timestamp: Date.now(),
        };
        this.breadcrumbs.push(fullBreadcrumb);
        // Limit breadcrumbs
        if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
            this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
        }
    }
    captureError(error, category = 'javascript', context, tags) {
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
        }
        else {
            // Create new error
            const enhancedError = {
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
    captureException(exception, context) {
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
    captureMessage(message, level = 'medium', context) {
        return this.captureError({
            message,
            timestamp: Date.now(),
            type: 'javascript',
            severity: level,
            url: typeof window !== 'undefined' ? window.location.href : '',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        }, 'javascript', context);
    }
    captureAPIError(url, status, statusText, responseBody) {
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
    logToConsole(error) {
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
    getConsoleStyle(severity) {
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
    async sendToRemote(error) {
        if (!this.config.apiEndpoint || !this.config.apiKey) {
            return;
        }
        try {
            const report = {
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
        }
        catch (e) {
            console.error('Failed to send error to remote:', e);
        }
    }
    getErrors() {
        return Array.from(this.errors.values());
    }
    getErrorById(id) {
        return Array.from(this.errors.values()).find(error => error.id === id);
    }
    getErrorsByCategory(category) {
        return this.getErrors().filter(error => error.category === category);
    }
    getErrorsBySeverity(severity) {
        return this.getErrors().filter(error => error.severity === severity);
    }
    resolveError(id, assignee, notes) {
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
    clearErrors() {
        this.errors.clear();
    }
    clearBreadcrumbs() {
        this.breadcrumbs = [];
    }
    generateReport() {
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
                    window.performance.memory?.usedJSHeapSize : undefined,
            },
        };
    }
    getStats() {
        const errors = this.getErrors();
        const errorsBySeverity = errors.reduce((acc, error) => {
            acc[error.severity] = (acc[error.severity] || 0) + (error.count || 1);
            return acc;
        }, {});
        const errorsByCategory = errors.reduce((acc, error) => {
            acc[error.category] = (acc[error.category] || 0) + (error.count || 1);
            return acc;
        }, {});
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
exports.ErrorTracker = ErrorTracker;
// React hook for error tracking
function useErrorTracking(config) {
    const [tracker] = useState(() => ErrorTracker.getInstance(config));
    const [errors, setErrors] = useState([]);
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
    const captureError = (error, context) => {
        return tracker.captureException(error, context);
    };
    const captureMessage = (message, level, context) => {
        return tracker.captureMessage(message, level, context);
    };
    const addBreadcrumb = (breadcrumb) => {
        tracker.addBreadcrumb(breadcrumb);
    };
    const resolveError = (id, assignee, notes) => {
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
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
        this.tracker = ErrorTracker.getInstance();
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        this.tracker.captureException(error, {
            componentStack: errorInfo.componentStack,
            errorBoundary: true,
        });
    }
    render() {
        if (this.state.hasError) {
            const FallbackComponent = this.props.fallback;
            if (FallbackComponent && this.state.error) {
                return error;
                {
                    this.state.error;
                }
                />;
            }
            return className = "error-boundary p-4 border border-red-300 rounded-lg bg-red-50" >
                className;
            "text-lg font-semibold text-red-800 mb-2" > Something;
            went;
            wrong < /h2>
                < p;
            className = "text-red-600" > An;
            error;
            occurred in this;
            component.Please;
            try { }
            finally { }
            refreshing;
            the;
            page. < /p>;
            {
                this.state.error && className;
                "mt-2" >
                    className;
                "cursor-pointer text-sm text-red-700" > Error;
                details < /summary>
                    < pre;
                className = "mt-2 text-xs text-red-600 whitespace-pre-wrap" >
                    { this: .state.error.message }
                    < /pre>
                    < /details>;
            }
            /div>;
            ;
        }
        return this.props.children;
    }
}
exports.ErrorBoundary = ErrorBoundary;
//# sourceMappingURL=error-tracking.js.map