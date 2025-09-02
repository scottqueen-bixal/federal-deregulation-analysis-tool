'use client';

import ErrorBoundary from '../components/ErrorBoundary';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <ErrorBoundary
          fallback={
            <div className="min-h-[400px] flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-card border border-destructive/20 rounded-lg p-6 shadow-lg">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-destructive mb-4">
                    Application Error
                  </h1>
                  <p className="text-muted-foreground mb-6">
                    Something went wrong with the Federal Deregulation Analysis Tool.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={reset}
                      className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => window.location.href = '/'}
                      className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                    >
                      Go Home
                    </button>
                  </div>
                  {error.digest && (
                    <p className="mt-4 text-xs text-muted-foreground">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              </div>
            </div>
          }
          showDetails={process.env.NODE_ENV === 'development'}
        >
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-destructive mb-4">
              Unexpected Error
            </h1>
            <p className="text-muted-foreground mb-6">
              {error.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
}
