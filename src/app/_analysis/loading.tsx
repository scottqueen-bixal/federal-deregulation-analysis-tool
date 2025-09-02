import LoadingSpinner from '../../components/LoadingSpinner';

export default function AnalysisLoading() {
  return (
    <div className="space-y-8">
      {/* Agency Selector Skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-muted rounded-md animate-pulse max-w-xs"></div>
        <div className="h-10 bg-muted rounded-md animate-pulse max-w-sm"></div>
        <div className="h-5 bg-muted rounded-md animate-pulse max-w-xs"></div>
      </div>

      {/* Metrics Cards Skeleton */}
      <section className="space-y-6">
        <div className="h-8 bg-muted rounded-md animate-pulse max-w-xs"></div>
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
      <section className="space-y-6">
        <div className="h-8 bg-muted rounded-md animate-pulse max-w-sm"></div>
        <div className="bg-card border border-border rounded-lg p-6">
          <LoadingSpinner
            text="Loading cross-cutting analysis..."
            className="text-center py-8"
            showSpinner={true}
          />
        </div>
      </section>
    </div>
  );
}
