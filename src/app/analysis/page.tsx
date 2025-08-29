'use client';

import { useState, useEffect } from 'react';

interface Agency {
  id: number;
  name: string;
  slug: string;
}

interface AnalysisData {
  wordCount?: number;
  checksum?: string;
  complexityScore?: number;
  metrics?: {
    totalSections: number;
    totalWords: number;
    avgWordsPerSection: number;
  };
}

interface CrossCuttingData {
  summary: {
    agencyName: string;
    totalCfrTitles: number;
    sharedTitles: number;
    exclusiveTitles: number;
    highImpactShared: number;
    sharedWithAgencies: number;
    crossCuttingPercentage: number;
  };
  crossCuttingTitles: Array<{
    cfrNumber: number;
    name: string;
    agencyCount: number;
    agencies: Array<{ id: number; name: string; slug: string }>;
    sharedWith: Array<{ id: number; name: string; slug: string }>;
    impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    isShared: boolean;
  }>;
  selectedAgency: {
    id: number;
    name: string;
    slug: string;
  };
}

export default function Analysis() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<number | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData>({});
  const [crossCuttingData, setCrossCuttingData] = useState<CrossCuttingData | null>(null);
  const [agenciesLoading, setAgenciesLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data/agencies')
      .then(res => res.json())
      .then(data => {
        if (data.agencies && Array.isArray(data.agencies)) {
          setAgencies(data.agencies);
        } else {
          console.error('Invalid agencies data:', data);
          setAgencies([]);
        }
      })
      .catch(error => {
        console.error('Error fetching agencies:', error);
        setAgencies([]);
      })
      .finally(() => {
        setAgenciesLoading(false);
      });
  }, []);

  const fetchAnalysis = async (endpoint: string, agencyId?: number) => {
    const targetAgencyId = agencyId || selectedAgency;
    if (!targetAgencyId) return;

    try {
      const url = `/api/analysis/${endpoint}/agency/${targetAgencyId}`;
      const res = await fetch(url);
      const data = await res.json();
      setAnalysisData(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error fetching analysis:', error);
    }
  };

  const fetchCrossCuttingData = async (agencyId: number) => {
    try {
      const response = await fetch(`/api/analysis/cross-cutting/agency/${agencyId}`);
      const data = await response.json();
      setCrossCuttingData(data);
    } catch (error) {
      console.error('Error fetching cross-cutting data:', error);
    }
  };

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
          <header className="mb-12">
            <h1 className="font-display text-5xl font-bold mb-4 text-foreground tracking-tight">
              Federal Deregulation Analysis
            </h1>
            <p className="text-xl text-muted-foreground font-light max-w-4xl">
              Comprehensive regulatory analysis and cross-cutting impact assessment for federal agencies
            </p>
          </header>

          <section aria-labelledby="agency-selection-heading" className="mb-12">
            <h2 id="agency-selection-heading" className="sr-only">Agency Selection</h2>
            <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
              <form className="space-y-6">
                <div>
                  <label htmlFor="agency-select" className="block text-sm font-semibold mb-3 text-card-foreground">
                    Select Federal Agency
                  </label>
                  <select
                    id="agency-select"
                    value={selectedAgency || ''}
                    onChange={(e) => {
                      const agencyId = parseInt(e.target.value);
                      setSelectedAgency(agencyId);
                      if (agencyId) {
                        fetchCrossCuttingData(agencyId);
                        fetchAnalysis('word_count', agencyId);
                        fetchAnalysis('checksum', agencyId);
                        fetchAnalysis('complexity_score', agencyId);
                      }
                    }}
                    className="w-full p-4 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 font-medium"
                    disabled={agenciesLoading}
                    aria-describedby="agency-select-description"
                  >
                    <option value="" className="text-muted-foreground">
                      {agenciesLoading ? 'Loading agencies...' : 'Choose an agency...'}
                    </option>
                    {Array.isArray(agencies) && agencies.map(agency => (
                      <option key={agency.id} value={agency.id} className="text-foreground">
                        {agency.name}
                      </option>
                    ))}
                  </select>
                  <div id="agency-select-description" className="sr-only">
                    Select a federal agency to view its regulatory analysis data
                  </div>
                </div>
              </form>
            </div>
          </section>        <section aria-labelledby="metrics-heading" aria-live="polite" className="mb-12">
          <h2 id="metrics-heading" className="font-heading text-3xl font-semibold mb-8 text-foreground">
            Key Analysis Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" role="region" aria-label="Key analysis metrics">
            <article className="bg-card border border-border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xl font-semibold mb-4 text-card-foreground font-heading">Word Count</h3>
              <p className="text-4xl font-bold text-chart-1 mb-2" aria-label={`Total word count: ${analysisData.wordCount?.toLocaleString() || 'Not available'}`}>
                {analysisData.wordCount?.toLocaleString() || 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">Total regulatory text volume</p>
            </article>

            <article className="bg-card border border-border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xl font-semibold mb-4 text-card-foreground font-heading">Document Checksum</h3>
              <p className="text-sm font-mono break-all text-muted-foreground bg-muted p-3 rounded border" aria-label={`Document checksum: ${analysisData.checksum || 'Not available'}`}>
                {analysisData.checksum || 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Verification hash</p>
            </article>

            <article className="bg-card border border-border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xl font-semibold mb-4 text-card-foreground font-heading">Complexity Score</h3>
              <p className={`text-4xl font-bold mb-2 ${
                !analysisData.complexityScore ? 'text-muted-foreground' :
                analysisData.complexityScore < 20 ? 'text-green-600 dark:text-green-400' :
                analysisData.complexityScore <= 50 ? 'text-orange-600 dark:text-orange-400' :
                'text-red-600 dark:text-red-400'
              }`} aria-label={`Complexity score: ${analysisData.complexityScore?.toFixed(2) || 'Not available'}`}>
                {analysisData.complexityScore?.toFixed(2) || 'N/A'}
              </p>
              {analysisData.metrics && (
                <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <dt className="font-medium">Sections:</dt>
                    <dd className="text-card-foreground">{analysisData.metrics.totalSections}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <dt className="font-medium">Total Words:</dt>
                    <dd className="text-card-foreground">{analysisData.metrics.totalWords}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="font-medium">Avg Words/Section:</dt>
                    <dd className="text-card-foreground">{analysisData.metrics.avgWordsPerSection?.toFixed(1)}</dd>
                  </div>
                </dl>
              )}
            </article>
          </div>
        </section>

        {/* Cross-Cutting Analysis Section */}
        {crossCuttingData && (
          <section aria-labelledby="cross-cutting-heading" aria-live="polite" className="mb-12">
            <h2 id="cross-cutting-heading" className="font-heading text-3xl font-semibold mb-8 text-foreground">
              Cross-Cutting Regulatory Analysis
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10" role="region" aria-label="Cross-cutting analysis summary">
              <article className="bg-card border border-border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
                <h3 className="text-xl font-semibold mb-4 text-card-foreground font-heading">Shared Titles</h3>
                <p className="text-4xl font-bold text-chart-3 mb-2" aria-label={`Number of shared titles: ${crossCuttingData.summary.sharedTitles}`}>
                  {crossCuttingData.summary.sharedTitles}
                </p>
                <p className="text-sm text-muted-foreground">
                  CFR titles affecting multiple agencies
                </p>
              </article>

              <article className="bg-card border border-border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
                <h3 className="text-xl font-semibold mb-4 text-card-foreground font-heading">Partner Agencies</h3>
                <p className="text-4xl font-bold text-chart-4 mb-2" aria-label={`Number of agencies sharing regulations: ${crossCuttingData.summary.sharedWithAgencies}`}>
                  {crossCuttingData.summary.sharedWithAgencies}
                </p>
                <p className="text-sm text-muted-foreground">
                  Other agencies sharing regulations
                </p>
              </article>

              <article className="bg-card border border-border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
                <h3 className="text-xl font-semibold mb-4 text-card-foreground font-heading">Cross-Cutting Impact</h3>
                <p className={`text-4xl font-bold mb-2 ${
                  crossCuttingData.summary.crossCuttingPercentage < 20 ? 'text-green-600 dark:text-green-400' :
                  crossCuttingData.summary.crossCuttingPercentage <= 50 ? 'text-orange-600 dark:text-orange-400' :
                  'text-red-600 dark:text-red-400'
                }`} aria-label={`Cross-cutting percentage: ${crossCuttingData.summary.crossCuttingPercentage.toFixed(1)} percent`}>
                  {crossCuttingData.summary.crossCuttingPercentage.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {crossCuttingData.summary.highImpactShared} high-impact shared titles
                </p>
              </article>
            </div>

            {crossCuttingData.crossCuttingTitles && crossCuttingData.crossCuttingTitles.length > 0 && (
              <section aria-labelledby="cfr-titles-heading" className="bg-card border border-border rounded-lg p-8 shadow-sm">
                <h3 id="cfr-titles-heading" className="text-2xl font-semibold mb-6 text-card-foreground font-heading">
                  CFR Titles for {crossCuttingData.summary.agencyName}
                </h3>
                <ul className="space-y-6" role="list" aria-label="List of CFR titles and their sharing status">
                  {crossCuttingData.crossCuttingTitles.map((title, index) => (
                    <li key={`title-${index}`} className="border-l-4 border-chart-1 pl-6 py-4 bg-accent/20 rounded-r-lg hover:bg-accent/30 transition-colors duration-200">
                      <article className="flex justify-between items-start">
                        <div className="flex-1 pr-4">
                          <h4 className="text-lg font-semibold text-card-foreground mb-2 font-heading">
                            Title {title.cfrNumber}: {title.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            {title.isShared ? `Shared with ${title.agencyCount - 1} other agencies` : 'Exclusive to this agency'}
                          </p>
                        </div>
                        <div className="flex space-x-2" role="group" aria-label="Title status indicators">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                              title.impactLevel === 'HIGH' ?
                                'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                              title.impactLevel === 'MEDIUM' ?
                                'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' :
                                'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                            }`}
                            aria-label={`Impact level: ${title.impactLevel}`}
                          >
                            {title.impactLevel} IMPACT
                          </span>
                          {title.isShared && (
                            <span
                              className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800"
                              aria-label="This title is shared across multiple agencies"
                            >
                              SHARED
                            </span>
                          )}
                        </div>
                      </article>
                      {title.isShared && title.sharedWith.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-muted">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-card-foreground">Shared with:</span>
                            <span className="ml-2" aria-label={`Shared with the following agencies: ${title.sharedWith.map(agency => agency.name).join(', ')}`}>
                              {title.sharedWith.map((agency, agencyIndex) => (
                                <span key={agency.id} className="inline-block">
                                  {agencyIndex > 0 && ', '}
                                  <span className="text-card-foreground font-medium">{agency.name}</span>
                                </span>
                              ))}
                            </span>
                          </p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </section>
        )}
        </main>
      </div>
    </div>
  );
}
