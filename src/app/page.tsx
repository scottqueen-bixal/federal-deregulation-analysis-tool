import { Suspense } from 'react';
import AnalysisHeader from '../components/AnalysisHeader';
import AnalysisClientWrapper from './_analysis/AnalysisClientWrapper';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';

interface Agency {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
  parent?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  children?: {
    id: number;
    name: string;
    slug: string;
  }[];
}

// Server Component - can use async/await for data fetching
export default async function Home() {
  // Server-side data fetching - no loading state needed
  let agencies: Agency[] = [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/data/agencies`, {
      // Add cache revalidation
      next: { revalidate: 3600 } // revalidate every hour
    });

    if (res.ok) {
      const data = await res.json();
      if (data.agencies && Array.isArray(data.agencies)) {
        agencies = data.agencies;
      }
    }
  } catch (error) {
    console.error('Error fetching agencies:', error);
    // agencies remains empty array
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Skip Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50 font-medium"
      >
        Skip to main content
      </a>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <main id="main-content">
          <AnalysisHeader />
          <Suspense fallback={
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
                    text="Loading analysis components..."
                    className="text-center py-8"
                    showSpinner={true}
                  />
                </div>
              </section>
            </div>
          }>
            <ErrorBoundary
              showDetails={process.env.NODE_ENV === 'development'}
              resetOnPropsChange={true}
            >
              <AnalysisClientWrapper initialAgencies={agencies} />
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
