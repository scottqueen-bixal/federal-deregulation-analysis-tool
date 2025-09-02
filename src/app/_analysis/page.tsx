import AnalysisHeader from '../../components/AnalysisHeader';
import AnalysisClientWrapper from './AnalysisClientWrapper';

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
export default async function AnalysisPage() {
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
          <AnalysisClientWrapper initialAgencies={agencies} />
        </main>
      </div>
    </div>
  );
}
