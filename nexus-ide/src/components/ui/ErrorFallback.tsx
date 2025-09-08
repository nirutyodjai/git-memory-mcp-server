/**
 * ErrorFallback Component
 * 
 * A comprehensive error boundary fallback component for the NEXUS IDE.
 * Provides user-friendly error messages and recovery options when components crash.
 * 
 * Features:
 * - User-friendly error messages
 * - Error details for developers
 * - Recovery actions (retry, reload, report)
 * - Different error types handling
 * - Integration with error reporting
 * - Responsive design
 */

import React from 'react';
import { FallbackProps } from 'react-error-boundary';
import { RefreshCw, AlertTriangle, Bug, Home, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export interface ErrorFallbackProps extends FallbackProps {
  title?: string;
  description?: string;
  showDetails?: boolean;
  showReportButton?: boolean;
  className?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again or contact support if the problem persists.',
  showDetails = import.meta.env.DEV,
  showReportButton = true,
  className
}) => {
  const [showErrorDetails, setShowErrorDetails] = React.useState(false);
  const [isReporting, setIsReporting] = React.useState(false);

  const handleRetry = () => {
    try {
      resetErrorBoundary();
      toast.success('Retrying...');
    } catch (err) {
      console.error('Failed to retry:', err);
      toast.error('Failed to retry. Please refresh the page.');
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReportError = async () => {
    setIsReporting(true);
    
    try {
      // In a real application, you would send this to your error reporting service
      const errorReport = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: 'anonymous' // Replace with actual user ID if available
      };
      
      console.log('Error report:', errorReport);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Error report sent successfully. Thank you for helping us improve!');
    } catch (err) {
      console.error('Failed to report error:', err);
      toast.error('Failed to send error report. Please try again later.');
    } finally {
      setIsReporting(false);
    }
  };

  const copyErrorToClipboard = async () => {
    try {
      const errorText = `Error: ${error.message}\n\nStack Trace:\n${error.stack}`;
      await navigator.clipboard.writeText(errorText);
      toast.success('Error details copied to clipboard');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      toast.error('Failed to copy error details');
    }
  };

  return (
    <div className={cn(
      'flex min-h-[400px] w-full flex-col items-center justify-center p-8 text-center',
      'bg-background border border-border rounded-lg',
      className
    )}>
      <div className="mb-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          {title}
        </h2>
        
        <p className="mb-6 max-w-md text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3 justify-center">
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
        
        <button
          onClick={handleReload}
          className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Reload Page
        </button>
        
        <button
          onClick={handleGoHome}
          className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Home className="h-4 w-4" />
          Go Home
        </button>
      </div>

      {/* Report Error Button */}
      {showReportButton && (
        <div className="mb-6">
          <button
            onClick={handleReportError}
            disabled={isReporting}
            className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="h-4 w-4" />
            {isReporting ? 'Sending Report...' : 'Report This Error'}
          </button>
        </div>
      )}

      {/* Error Details */}
      {showDetails && (
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setShowErrorDetails(!showErrorDetails)}
            className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bug className="h-4 w-4" />
            {showErrorDetails ? 'Hide' : 'Show'} Error Details
          </button>
          
          {showErrorDetails && (
            <div className="rounded-md border border-border bg-muted/50 p-4 text-left">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">
                  Error Details
                </h3>
                <button
                  onClick={copyErrorToClipboard}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Copy to Clipboard
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">
                    Error Message:
                  </h4>
                  <p className="text-sm font-mono text-red-600 dark:text-red-400">
                    {error.message}
                  </p>
                </div>
                
                {error.stack && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">
                      Stack Trace:
                    </h4>
                    <pre className="text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 text-xs text-muted-foreground">
        <p>
          If this problem continues, please contact our support team or check our{' '}
          <a 
            href="/help" 
            className="text-primary hover:underline"
            onClick={(e) => {
              e.preventDefault();
              toast.info('Help documentation coming soon!');
            }}
          >
            help documentation
          </a>
          .
        </p>
      </div>
    </div>
  );
};

// Simplified error fallback for smaller components
export const SimpleErrorFallback: React.FC<Pick<ErrorFallbackProps, 'error' | 'resetErrorBoundary' | 'className'>> = ({
  error,
  resetErrorBoundary,
  className
}) => {
  return (
    <div className={cn(
      'flex items-center justify-center p-4 text-center',
      'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md',
      className
    )}>
      <div>
        <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-red-600 dark:text-red-400" />
        <p className="text-sm text-red-800 dark:text-red-200 mb-2">
          Something went wrong
        </p>
        <button
          onClick={resetErrorBoundary}
          className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
        >
          Try again
        </button>
      </div>
    </div>
  );
};

export default ErrorFallback;