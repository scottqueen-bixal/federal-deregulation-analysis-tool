'use client';

import React, { Component, ReactNode } from 'react';

// Simple SVG icons
const AlertTriangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  eventId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Set error info in state
    this.setState({
      errorInfo,
      eventId: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    });
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys have changed
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) =>
        key !== prevProps.resetKeys![index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset error state if any props have changed and resetOnPropsChange is true
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    // Clear any existing timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    const { hasError, error, errorInfo, eventId } = this.state;
    const { children, fallback, showDetails } = this.props;

    // Determine if we should show details based on props or environment
    const shouldShowDetails = showDetails ?? (typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || process.env.NODE_ENV === 'development'));

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
                  <div className="bg-card border border-destructive rounded-lg p-6 max-w-2xl mx-auto shadow-lg">
          {/* Error Icon and Message */}
          <div className="flex items-start space-x-4 mb-6">
            <div className="flex-shrink-0">
              <AlertTriangleIcon className="h-8 w-8 text-destructive" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">
                Something went wrong
              </h2>
              <p className="text-sm text-muted-foreground" role="alert" aria-live="assertive">
                We encountered an unexpected error. Please try again.
              </p>
            </div>
          </div>

          {/* Error Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button
              onClick={this.handleRetry}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-[3px] focus:ring-ring focus:ring-offset-2"
              aria-label="Try to recover from the error and continue"
            >
              <RefreshIcon className="h-4 w-4" aria-hidden="true" />
              <span>Try Again</span>
            </button>

            <button
              onClick={this.handleReload}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-[3px] focus:ring-ring focus:ring-offset-2"
              aria-label="Reload the entire page to reset the application"
            >
              <RefreshIcon className="h-4 w-4" aria-hidden="true" />
              <span>Reload Page</span>
            </button>

            <button
              onClick={this.handleGoHome}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors focus:outline-none focus:ring-[3px] focus:ring-ring focus:ring-offset-2"
              aria-label="Navigate to the home page"
            >
              <HomeIcon className="h-4 w-4" aria-hidden="true" />
              <span>Go Home</span>
            </button>
          </div>

            {/* Error Details (for development) */}
            {shouldShowDetails && error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  Technical Details
                </summary>
                <div className="mt-3 p-3 bg-muted rounded border text-xs">
                  <div className="mb-2">
                    <strong>Error:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-all">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  {errorInfo && (
                    <div className="mb-2">
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-all">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                  {eventId && (
                    <div>
                      <strong>Event ID:</strong> {eventId}
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* User-friendly error reporting */}
            <div className="mt-4 p-3 bg-muted/50 rounded border-l-4 border-l-muted-foreground/30">
              <p className="text-xs text-muted-foreground">
                If this problem persists, please contact support and reference error ID:
                <code className="ml-1 font-mono">{eventId}</code>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
