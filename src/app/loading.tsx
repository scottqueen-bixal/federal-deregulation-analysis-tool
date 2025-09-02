import LoadingSpinner from '../components/LoadingSpinner';

export default function AnalysisLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <main>
          {/* Header Skeleton */}
          <div className="mb-12">
            <div className="h-8 bg-muted rounded-md animate-pulse mb-4 max-w-md"></div>
            <div className="h-4 bg-muted rounded-md animate-pulse max-w-2xl"></div>
          </div>

          {/* Agency Selector Skeleton */}
          <div className="mb-12">
            <div className="h-6 bg-muted rounded-md animate-pulse mb-4 max-w-xs"></div>
            <div className="h-10 bg-muted rounded-md animate-pulse max-w-sm mb-4"></div>
            <div className="h-5 bg-muted rounded-md animate-pulse max-w-xs"></div>
          </div>

          {/* Metrics Cards Skeleton */}
          <section className="mb-12">
            <div className="h-8 bg-muted rounded-md animate-pulse mb-8 max-w-xs"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-6">
                  <div className="h-6 bg-muted rounded-md animate-pulse mb-4 max-w-32"></div>
                  <div className="h-8 bg-muted rounded-md animate-pulse mb-2 max-w-24"></div>
                  <div className="h-4 bg-muted rounded-md animate-pulse max-w-full"></div>
                </div>
              ))}
            </div>
          </section>

          {/* Cross-Cutting Analysis Skeleton */}
          <section>
            <div className="h-8 bg-muted rounded-md animate-pulse mb-8 max-w-sm"></div>
            <div className="bg-card border border-border rounded-lg p-6">
              <LoadingSpinner
                text="Loading cross-cutting analysis..."
                className="text-center py-8"
                showSpinner={true}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
