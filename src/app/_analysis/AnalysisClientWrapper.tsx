// src/app/_analysis/AnalysisClientWrapper.tsx
'use client';

import { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import AgencySelector from '../../components/AgencySelector';
import MetricCard from '../../components/MetricCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorBoundary from '../../components/ErrorBoundary';
import {
  WordCountTooltipContent,
  ChecksumTooltipContent,
  ComplexityTooltipContent
} from '../../components/TooltipContent';

// Lazy load heavy components
const CrossCuttingAnalysis = lazy(() => import('../../components/CrossCuttingAnalysis'));

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

interface AnalysisData {
  wordCount?: number;
  checksum?: string;
  complexityScore?: number;
  relativeComplexityScore?: number;
  metrics?: {
    totalSections: number;
    totalWords: number;
    avgWordsPerSection: number;
    hierarchyDepth?: number;
  };
}

interface ApiAnalysisResult {
  agencyId?: number;
  wordCount?: number;
  checksum?: string;
  complexity_score?: number;
  relative_complexity_score?: number;
  hierarchy_depth?: number;
  calculation_details?: {
    total_sections: number;
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

interface AnalysisClientWrapperProps {
  initialAgencies: Agency[];
}

export default function AnalysisClientWrapper({
  initialAgencies
}: AnalysisClientWrapperProps) {
  const [agencies] = useState<Agency[]>(initialAgencies);
  const [selectedAgency, setSelectedAgency] = useState<number | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData>({});
  const [crossCuttingData, setCrossCuttingData] = useState<CrossCuttingData>({
    summary: {
      agencyName: '',
      totalCfrTitles: 0,
      sharedTitles: 0,
      exclusiveTitles: 0,
      highImpactShared: 0,
      sharedWithAgencies: 0,
      crossCuttingPercentage: 0,
    },
    crossCuttingTitles: [],
    selectedAgency: { id: 0, name: '', slug: '' },
  });
  const [wordCountLoading, setWordCountLoading] = useState(false);
  const [checksumLoading, setChecksumLoading] = useState(false);
  const [complexityScoreLoading, setComplexityScoreLoading] = useState(false);
  const [crossCuttingLoading, setCrossCuttingLoading] = useState(false);
  const [includeSubAgencies, setIncludeSubAgencies] = useState(false);
  const [aggregatedData, setAggregatedData] = useState<AnalysisData>({});

  // Calculate cross-cutting severity score based on multiple factors
  const calculateCrossCuttingSeverity = useCallback((
    summary: CrossCuttingData['summary'],
    crossCuttingTitles: CrossCuttingData['crossCuttingTitles']
  ) => {
    if (!crossCuttingTitles.length) return { score: 0, level: 'MINIMAL' as const };

    // Factor 1: Impact distribution (weighted by impact level)
    const impactScore = crossCuttingTitles.reduce((score: number, title) => {
      if (title.impactLevel === 'HIGH') return score + 3;
      if (title.impactLevel === 'MEDIUM') return score + 2;
      return score + 1; // LOW
    }, 0);

    // Factor 2: Agency breadth (more agencies = higher complexity)
    const agencyBreadthScore = Math.min(summary.sharedWithAgencies * 2, 10); // Cap at 10

    // Factor 3: Regulatory density (percentage of shared titles)
    const densityScore = (summary.sharedTitles / summary.totalCfrTitles) * 10;

    // Factor 4: High-impact concentration (bonus for multiple high-impact titles)
    const highImpactBonus = summary.highImpactShared > 1 ? summary.highImpactShared * 1.5 : 0;

    // Weighted final score (max ~30)
    const rawScore = (impactScore * 0.4) + (agencyBreadthScore * 0.3) + (densityScore * 0.2) + (highImpactBonus * 0.1);

    // Keep raw score instead of normalizing to 100
    const finalScore = Math.min(rawScore, 30);

    // Determine severity level based on new ranges
    let level: 'MINIMAL' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    if (finalScore < 2) level = 'MINIMAL';
    else if (finalScore < 4) level = 'LOW';
    else if (finalScore < 6) level = 'MODERATE';
    else if (finalScore < 11) level = 'HIGH';
    else level = 'CRITICAL';

    return { score: Math.round(finalScore), level };
  }, []);

  const crossCuttingSeverity = useMemo(() =>
    calculateCrossCuttingSeverity(crossCuttingData.summary, crossCuttingData.crossCuttingTitles),
    [crossCuttingData.summary, crossCuttingData.crossCuttingTitles, calculateCrossCuttingSeverity]
  );

  // Helper function to get selected agency details
  const getSelectedAgencyDetails = useCallback(() => {
    return agencies.find(agency => agency.id === selectedAgency);
  }, [agencies, selectedAgency]);

  // Helper function to check if selected agency has children
  const selectedAgencyHasChildren = useCallback(() => {
    const agency = getSelectedAgencyDetails();
    return agency?.children && agency.children.length > 0;
  }, [getSelectedAgencyDetails]);

  const fetchAnalysis = useCallback(async (endpoint: string, agencyId?: number) => {
    const targetAgencyId = agencyId || selectedAgency;
    if (!targetAgencyId) return;

    // Set loading state based on endpoint
    if (endpoint === 'word_count') setWordCountLoading(true);
    else if (endpoint === 'checksum') setChecksumLoading(true);
    else if (endpoint === 'complexity_score') setComplexityScoreLoading(true);

    try {
      const url = `/api/analysis/${endpoint}/agency/${targetAgencyId}`;
      const res = await fetch(url);
      const data = await res.json();

      // Handle field mapping for complexity score API
      if (endpoint === 'complexity_score' && data.complexity_score !== undefined) {
        data.complexityScore = Math.round(data.complexity_score);
        data.relativeComplexityScore = Math.round(data.relative_complexity_score || 0);

        // Ensure metrics structure exists for individual agencies
        if (data.calculation_details?.total_sections) {
          // Get current word count from state or data
          const currentWordCount = data.wordCount || analysisData.wordCount || 0;
          data.metrics = {
            totalSections: data.calculation_details.total_sections,
            totalWords: currentWordCount,
            avgWordsPerSection: data.calculation_details.total_sections > 0 && currentWordCount > 0 ?
              Math.round(currentWordCount / data.calculation_details.total_sections) : 0,
            hierarchyDepth: data.hierarchy_depth || 3
          };
        }
      }

      setAnalysisData(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      // Clear loading state
      if (endpoint === 'word_count') setWordCountLoading(false);
      else if (endpoint === 'checksum') setChecksumLoading(false);
      else if (endpoint === 'complexity_score') setComplexityScoreLoading(false);
    }
  }, [selectedAgency, analysisData.wordCount]);

  const fetchCrossCuttingData = useCallback(async (agencyId: number) => {
    setCrossCuttingLoading(true);
    try {
      const response = await fetch(`/api/analysis/cross-cutting/agency/${agencyId}`);
      const data = await response.json();
      setCrossCuttingData(data);
    } catch (error) {
      console.error('Error fetching cross-cutting data:', error);
    } finally {
      setCrossCuttingLoading(false);
    }
  }, []);

  // Function to fetch aggregated data for parent and all children
  const fetchAggregatedAnalysis = useCallback(async (endpoint: string, parentAgencyId: number, existingWordCount?: number) => {
    // Get child IDs directly from agencies data instead of using state
    const selectedAgencyData = agencies.find(agency => agency.id === parentAgencyId);
    const childIds = selectedAgencyData?.children?.map(child => child.id) || [];
    const allAgencyIds = [parentAgencyId, ...childIds];

    // Set loading state based on endpoint
    if (endpoint === 'word_count') setWordCountLoading(true);
    else if (endpoint === 'checksum') setChecksumLoading(true);
    else if (endpoint === 'complexity_score') setComplexityScoreLoading(true);

    try {
      // Fetch data for all agencies (parent + children) with rate limiting
      const BATCH_SIZE = 5; // Process in smaller batches
      const results: (ApiAnalysisResult | null)[] = [];

      for (let i = 0; i < allAgencyIds.length; i += BATCH_SIZE) {
        const batch = allAgencyIds.slice(i, i + BATCH_SIZE);

        const batchPromises = batch.map(async (agencyId) => {
          const url = `/api/analysis/${endpoint}/agency/${agencyId}`;
          try {
            const res = await fetch(url);
            if (!res.ok) {
              console.error(`Failed to fetch ${endpoint} for agency ${agencyId}:`, res.status, res.statusText);
              return null;
            }
            const data: ApiAnalysisResult = await res.json();
            return data;
          } catch (error) {
            console.error(`[${endpoint}] Error fetching agency ${agencyId}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Small delay between batches to avoid overwhelming the server
        if (i + BATCH_SIZE < allAgencyIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      const validResults = results.filter((result): result is ApiAnalysisResult => result !== null);

      // Aggregate the results based on endpoint type
      let aggregatedResult: Record<string, unknown> = {};

      if (endpoint === 'word_count') {
        const totalWordCount = validResults.reduce((sum, result) => sum + (result.wordCount || 0), 0);
        const totalSections = validResults.reduce((sum, result) =>
          sum + (result.calculation_details?.total_sections || 0), 0);

        aggregatedResult = {
          wordCount: totalWordCount,
          metrics: {
            totalSections: totalSections,
            totalWords: totalWordCount,
            avgWordsPerSection: Math.round(totalSections > 0 && totalWordCount > 0 ?
              totalWordCount / totalSections : 0)
          }
        };
        setAggregatedData(prev => ({ ...prev, ...aggregatedResult }));
        return totalWordCount; // Return word count for use in complexity calculation
      } else if (endpoint === 'complexity_score') {
        // Instead of averaging, aggregate complexity properly
        const validScores = validResults.filter(result => result.complexity_score !== undefined);

        if (validScores.length > 0) {
          // Method 1: Sum all complexity scores (additive complexity)
          const totalComplexity = validScores.reduce((sum, result) => {
            const score = Number(result.complexity_score) || 0;
            return sum + score;
          }, 0);

          // Get total sections across all agencies for proper metrics
          const totalSections = validScores.reduce((sum, result) =>
            sum + (result.calculation_details?.total_sections || 0), 0);

          // Use the passed word count or try to get from current state
          const aggregatedWordCount = existingWordCount || aggregatedData.wordCount || 0;

          // For relative score, calculate against the appropriate max
          let relativeComplexity = 0;
          try {
            // Use max-aggregated endpoint for aggregated complexity comparison
            const maxResponse = await fetch('/api/analysis/complexity_score/max-aggregated?bustCache=true');
            if (maxResponse.ok) {
              const maxData = await maxResponse.json();
              const maxAggregatedScore = maxData.max_aggregated_complexity_score;
              if (maxAggregatedScore > 0) {
                relativeComplexity = Math.round((totalComplexity / maxAggregatedScore) * 100);
                // Cap at 100 to prevent display issues
                relativeComplexity = Math.min(relativeComplexity, 100);
              }
            }
          } catch (error) {
            console.warn('Could not fetch max aggregated score for relative calculation:', error);
            // Fallback: use the highest relative score among constituent agencies
            relativeComplexity = Math.max(...validScores.map(result => result.relative_complexity_score || 0));
          }

          aggregatedResult = {
            complexityScore: Math.round(totalComplexity),
            relativeComplexityScore: relativeComplexity,
            metrics: {
              totalSections: totalSections,
              totalWords: aggregatedWordCount, // Use actual aggregated word count
              avgWordsPerSection: Math.round(totalSections > 0 && aggregatedWordCount > 0 ?
                aggregatedWordCount / totalSections : 0),
              hierarchyDepth: Math.max(...validScores.map(result => result.hierarchy_depth || 3))
            }
          };
        }
      } else if (endpoint === 'checksum') {
        // For checksum, we can create a combined hash or just show the parent's checksum
        const parentResult = validResults[0];
        aggregatedResult = { checksum: parentResult.checksum };
      }

      setAggregatedData(prev => ({ ...prev, ...aggregatedResult }));
    } catch (error) {
      console.error('Error fetching aggregated analysis:', error);
    } finally {
      // Clear loading state
      if (endpoint === 'word_count') setWordCountLoading(false);
      else if (endpoint === 'checksum') setChecksumLoading(false);
      else if (endpoint === 'complexity_score') setComplexityScoreLoading(false);
    }
  }, [agencies, aggregatedData.wordCount]);

  // Helper function to get the data to display (individual or aggregated)
  const getDisplayData = useCallback(() => {
    const shouldUseAggregated = includeSubAgencies && selectedAgencyHasChildren();

    if (shouldUseAggregated) {
      // Only return aggregated data if it has actual data (not empty)
      if (aggregatedData.wordCount !== undefined) {
        return aggregatedData;
      }
      // If aggregated data is still loading, return empty object to show loading states
      return {};
    }

    return analysisData;
  }, [includeSubAgencies, selectedAgencyHasChildren, aggregatedData, analysisData]);

  // Function to handle toggle change
  const handleAggregationToggle = useCallback(async (checked: boolean) => {
    setIncludeSubAgencies(checked);

    if (!selectedAgency) return;

    // Get agency details directly instead of relying on state
    const selectedAgencyData = agencies.find(agency => agency.id === selectedAgency);
    const hasChildren = selectedAgencyData?.children && selectedAgencyData.children.length > 0;

    if (checked && hasChildren) {
      // Fetch aggregated data in correct order - word count first, then complexity
      setAggregatedData({});

      // First fetch word count since complexity metrics depend on it
      const wordCount = await fetchAggregatedAnalysis('word_count', selectedAgency) as number;

      await fetchAggregatedAnalysis('checksum', selectedAgency);

      // Then fetch complexity which will use the word count data
      await fetchAggregatedAnalysis('complexity_score', selectedAgency, wordCount);
    } else {
      // Reset to individual agency data and fetch fresh data for just the main department
      setAggregatedData({});
      setAnalysisData({}); // Clear existing analysis data

      // Fetch individual agency data only (not aggregated)
      await Promise.all([
        fetchAnalysis('word_count', selectedAgency),
        fetchAnalysis('checksum', selectedAgency),
        fetchAnalysis('complexity_score', selectedAgency)
      ]);
    }
  }, [selectedAgency, agencies, fetchAggregatedAnalysis, fetchAnalysis]);

  // Function to handle agency selection from shared agencies list
  const handleSharedAgencySelect = useCallback(async (agencyId: number) => {
    setSelectedAgency(agencyId);
    setIncludeSubAgencies(false); // Reset aggregation toggle
    setAggregatedData({}); // Reset aggregated data

    // Reset analysis data
    setAnalysisData({});

    // Fetch all data for the new agency in parallel
    await Promise.all([
      fetchCrossCuttingData(agencyId),
      fetchAnalysis('word_count', agencyId),
      fetchAnalysis('checksum', agencyId),
      fetchAnalysis('complexity_score', agencyId)
    ]);

    // Safe window API usage
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [fetchCrossCuttingData, fetchAnalysis]);

  const handleAgencyChange = useCallback(async (agencyId: number | null) => {
    if (!agencyId) return;

    setSelectedAgency(agencyId);
    setAggregatedData({}); // Reset aggregated data
    if (agencyId) {
      // Check if the newly selected agency has children
      const agency = agencies.find(a => a.id === agencyId);
      const hasChildren = !!(agency?.children && agency.children.length > 0);

      // Reset analysis data
      setAnalysisData({});
      setAggregatedData({});

      if (hasChildren) {
        // For main departments: set checkbox to checked and fetch aggregated data first
        setIncludeSubAgencies(true);

        // Fetch aggregated data immediately without setTimeout to avoid race conditions
        try {
          // First fetch word count since complexity metrics depend on it
          const wordCount = await fetchAggregatedAnalysis('word_count', agencyId) as number;

          await fetchAggregatedAnalysis('checksum', agencyId);

          // Then fetch complexity which will use the word count data
          await fetchAggregatedAnalysis('complexity_score', agencyId, wordCount);
        } catch (error) {
          console.error('Error in aggregated data fetch:', error);
        }

        // Also fetch cross-cutting data
        fetchCrossCuttingData(agencyId);
      } else {
        // For sub-agencies: set checkbox to unchecked and fetch individual data only
        setIncludeSubAgencies(false);

        // Fetch individual agency data in parallel to avoid waterfalls
        await Promise.all([
          fetchCrossCuttingData(agencyId),
          fetchAnalysis('word_count', agencyId),
          fetchAnalysis('checksum', agencyId),
          fetchAnalysis('complexity_score', agencyId)
        ]);
      }
    }
  }, [agencies, fetchAggregatedAnalysis, fetchCrossCuttingData, fetchAnalysis]);

  return (
    <>
      <AgencySelector
        agencies={agencies}
        selectedAgency={selectedAgency}
        agenciesLoading={false}
        includeSubAgencies={includeSubAgencies}
        onAgencyChange={handleAgencyChange}
        onAggregationToggle={handleAggregationToggle}
      />

      <section aria-labelledby="metrics-heading" aria-live="polite" className="mb-12">
        <h2 id="metrics-heading" className="font-heading text-3xl font-semibold mb-8 text-foreground">
          Key Analysis Metrics
        </h2>
        <ErrorBoundary
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-6">
                  <div className="text-center py-8">
                    <p className="text-destructive mb-2">Failed to load metric</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-sm text-primary hover:underline"
                    >
                      Reload to try again
                    </button>
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" role="region" aria-label="Key analysis metrics">
          <MetricCard
            title="Word Count"
            value={getDisplayData().wordCount?.toLocaleString() || 'N/A'}
            description={includeSubAgencies && selectedAgencyHasChildren() ?
              'Total regulatory text volume (including sub-agencies)' :
              'Total regulatory text volume'
            }
            tooltipContent={<WordCountTooltipContent />}
            loading={wordCountLoading}
            loadingText="Loading..."
            valueColor="text-chart-1"
            ariaLabel={`Total word count: ${getDisplayData().wordCount?.toLocaleString() || 'Not available'}`}
            additionalContent={(
              <dl className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between py-1 border-b border-border/30">
                  <dt className="font-medium">Sections:</dt>
                  <dd className="text-card-foreground">
                    {wordCountLoading || complexityScoreLoading ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : (
                      getDisplayData().metrics?.totalSections || 'N/A'
                    )}
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-border/30">
                  <dt className="font-medium">Avg Words/Section:</dt>
                  <dd className="text-card-foreground">
                    {wordCountLoading || complexityScoreLoading ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : (
                      getDisplayData().metrics?.avgWordsPerSection?.toFixed(1) || 'N/A'
                    )}
                  </dd>
                </div>
              </dl>
            )}
          />

          <MetricCard
            title="Document Checksum"
            value={
              <p className="text-sm font-mono break-all text-muted-foreground bg-muted p-3 rounded border">
                {getDisplayData().checksum || 'N/A'}
              </p>
            }
            description={includeSubAgencies && selectedAgencyHasChildren() ?
              'Verification hash (parent agency)' :
              'Verification hash'
            }
            tooltipContent={<ChecksumTooltipContent />}
            loading={checksumLoading}
            loadingText="Calculating checksum..."
            valueColor="text-chart-2"
            ariaLabel={`Document checksum: ${getDisplayData().checksum || 'Not available'}`}
          />

          <MetricCard
            title="Complexity Score"
            value={getDisplayData().relativeComplexityScore ? `${getDisplayData().relativeComplexityScore}/100` : 'N/A'}
            description={
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {includeSubAgencies && selectedAgencyHasChildren() ?
                    'Relative to most complex department (including sub-agencies)' :
                    'Relative to most complex agency'
                  }
                </p>
                {getDisplayData().complexityScore && (
                  <p className="text-xs text-muted-foreground opacity-75">
                    (Raw score: {getDisplayData().complexityScore?.toLocaleString()})
                  </p>
                )}
              </div>
            }
            tooltipContent={<ComplexityTooltipContent />}
            loading={complexityScoreLoading}
            loadingText="Calculating..."
            valueColor={
              !getDisplayData().relativeComplexityScore ? 'text-muted-foreground' :
              (getDisplayData().relativeComplexityScore || 0) < 25 ? 'text-green-700 dark:text-green-400' :
              (getDisplayData().relativeComplexityScore || 0) <= 60 ? 'text-orange-700 dark:text-orange-400' :
              'text-red-700 dark:text-red-400'
            }
            ariaLabel={`Complexity score: ${getDisplayData().relativeComplexityScore || 'Not available'} out of 100`}
          />
          </div>
        </ErrorBoundary>
      </section>

      {/* Cross-Cutting Analysis Section */}
      <Suspense fallback={
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
      }>
        <CrossCuttingAnalysis
          data={crossCuttingData}
          loading={crossCuttingLoading}
          severity={crossCuttingSeverity}
          onAgencySelect={handleSharedAgencySelect}
        />
      </Suspense>
    </>
  );
}
