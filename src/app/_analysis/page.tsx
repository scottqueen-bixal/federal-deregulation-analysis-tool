'use client';

import { useState, useEffect } from 'react';
import AnalysisHeader from '../../components/AnalysisHeader';
import AgencySelector from '../../components/AgencySelector';
import MetricCard from '../../components/MetricCard';
import CrossCuttingAnalysis from '../../components/CrossCuttingAnalysis';
import {
  WordCountTooltipContent,
  ChecksumTooltipContent,
  ComplexityTooltipContent
} from '../../components/TooltipContent';

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

export default function Analysis() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
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
  const [agenciesLoading, setAgenciesLoading] = useState(true);
  const [wordCountLoading, setWordCountLoading] = useState(false);
  const [checksumLoading, setChecksumLoading] = useState(false);
  const [complexityScoreLoading, setComplexityScoreLoading] = useState(false);
  const [crossCuttingLoading, setCrossCuttingLoading] = useState(false);
  const [includeSubAgencies, setIncludeSubAgencies] = useState(false);
  const [aggregatedData, setAggregatedData] = useState<AnalysisData>({});

  // Calculate cross-cutting severity score based on multiple factors
  const calculateCrossCuttingSeverity = (
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
  };

  const crossCuttingSeverity = calculateCrossCuttingSeverity(crossCuttingData.summary, crossCuttingData.crossCuttingTitles);

  // Helper function to get selected agency details
  const getSelectedAgencyDetails = () => {
    console.log(`[DEBUG] getSelectedAgencyDetails - selectedAgency: ${selectedAgency}`);
    console.log(`[DEBUG] getSelectedAgencyDetails - agencies.length: ${agencies.length}`);
    console.log(`[DEBUG] getSelectedAgencyDetails - agencies[0]:`, agencies[0]?.name);
    const found = agencies.find(agency => agency.id === selectedAgency);
    console.log(`[DEBUG] getSelectedAgencyDetails - found agency:`, found?.name);
    return found;
  };

  // Helper function to check if selected agency has children
  const selectedAgencyHasChildren = () => {
    const agency = getSelectedAgencyDetails();
    return agency?.children && agency.children.length > 0;
  };

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
  };

  const fetchCrossCuttingData = async (agencyId: number) => {
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
  };

  // Function to fetch aggregated data for parent and all children
  const fetchAggregatedAnalysis = async (endpoint: string, parentAgencyId: number, existingWordCount?: number) => {
    // Get child IDs directly from agencies data instead of using state
    const selectedAgencyData = agencies.find(agency => agency.id === parentAgencyId);
    const childIds = selectedAgencyData?.children?.map(child => child.id) || [];
    const allAgencyIds = [parentAgencyId, ...childIds];

    console.log(`[DEBUG] fetchAggregatedAnalysis - Parent ID: ${parentAgencyId}`);
    console.log(`[DEBUG] fetchAggregatedAnalysis - Child IDs: ${childIds.join(', ')}`);
    console.log(`[DEBUG] fetchAggregatedAnalysis - All agency IDs: ${allAgencyIds.join(', ')}`);
    console.log(`[DEBUG] fetchAggregatedAnalysis - includeSubAgencies: ${includeSubAgencies}`);
    console.log(`[DEBUG] fetchAggregatedAnalysis - selectedAgencyHasChildren: ${!!selectedAgencyData?.children?.length}`);

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
        console.log(`[${endpoint}] Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(allAgencyIds.length/BATCH_SIZE)}: agencies ${batch.join(', ')}`);

        const batchPromises = batch.map(async (agencyId) => {
          const url = `/api/analysis/${endpoint}/agency/${agencyId}`;
          try {
            const res = await fetch(url);
            if (!res.ok) {
              console.error(`Failed to fetch ${endpoint} for agency ${agencyId}:`, res.status, res.statusText);
              return null;
            }
            const data: ApiAnalysisResult = await res.json();
            console.log(`[${endpoint}] Success for agency ${agencyId}:`, data.complexity_score || data.wordCount || 'data fetched');
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

      // Debug logging for aggregation
      console.log(`[${endpoint}] Fetching data for agencies:`, allAgencyIds);
      console.log(`[${endpoint}] Valid results count:`, validResults.length);
      console.log(`[${endpoint}] Results:`, validResults.map(r => ({
        agencyId: r.agencyId,
        complexity_score: r.complexity_score,
        wordCount: r.wordCount,
        sections: r.calculation_details?.total_sections
      })));

      // Aggregate the results based on endpoint type
      let aggregatedResult: Record<string, unknown> = {};

      if (endpoint === 'word_count') {
        const totalWordCount = validResults.reduce((sum, result) => sum + (result.wordCount || 0), 0);
        aggregatedResult = { wordCount: totalWordCount };
        setAggregatedData(prev => ({ ...prev, ...aggregatedResult }));
        return totalWordCount; // Return word count for use in complexity calculation
      } else if (endpoint === 'complexity_score') {
        // Instead of averaging, aggregate complexity properly
        const validScores = validResults.filter(result => result.complexity_score !== undefined);
        console.log(`[complexity_score] Valid scores found:`, validScores.length);
        console.log(`[complexity_score] Individual scores:`, validScores.map(r => ({
          agencyId: r.agencyId,
          score: r.complexity_score,
          scoreType: typeof r.complexity_score,
          isNumber: Number.isInteger(r.complexity_score)
        })));

        if (validScores.length > 0) {
          // Method 1: Sum all complexity scores (additive complexity)
          const totalComplexity = validScores.reduce((sum, result) => {
            const score = Number(result.complexity_score) || 0;
            console.log(`[complexity_score] Adding ${score} (type: ${typeof score}) to sum ${sum}`);
            return sum + score;
          }, 0);

          console.log(`[complexity_score] Final totalComplexity:`, totalComplexity);

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
                // Debug logging
                console.log(`Aggregated complexity calculation:`, {
                  totalComplexity,
                  maxAggregatedScore,
                  relativeComplexity,
                  isOverMax: relativeComplexity > 100,
                  wordCount: aggregatedWordCount,
                  sections: totalSections
                });

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
  };

  // Helper function to get the data to display (individual or aggregated)
  const getDisplayData = () => {
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
  };

  // Function to handle toggle change
  const handleAggregationToggle = async (checked: boolean) => {
    setIncludeSubAgencies(checked);

    if (!selectedAgency) return;

    // Get agency details directly instead of relying on state
    const selectedAgencyData = agencies.find(agency => agency.id === selectedAgency);
    const hasChildren = selectedAgencyData?.children && selectedAgencyData.children.length > 0;

    console.log(`[DEBUG] handleAggregationToggle - checked: ${checked}`);
    console.log(`[DEBUG] handleAggregationToggle - selectedAgency: ${selectedAgency}`);
    console.log(`[DEBUG] handleAggregationToggle - selectedAgencyData:`, selectedAgencyData?.name);
    console.log(`[DEBUG] handleAggregationToggle - hasChildren: ${hasChildren}`);

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
      console.log(`[DEBUG] handleAggregationToggle - switching to individual agency data`);
      setAggregatedData({});
      setAnalysisData({}); // Clear existing analysis data

      // Fetch individual agency data only (not aggregated)
      fetchAnalysis('word_count', selectedAgency);
      fetchAnalysis('checksum', selectedAgency);
      fetchAnalysis('complexity_score', selectedAgency);
    }
  };

  // Function to handle agency selection from shared agencies list
  const handleSharedAgencySelect = (agencyId: number) => {
    setSelectedAgency(agencyId);
    setIncludeSubAgencies(false); // Reset aggregation toggle
    setAggregatedData({}); // Reset aggregated data

    // Reset analysis data
    setAnalysisData({});

    // Fetch all data for the new agency
    fetchCrossCuttingData(agencyId);
    fetchAnalysis('word_count', agencyId);
    fetchAnalysis('checksum', agencyId);
    fetchAnalysis('complexity_score', agencyId);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <AnalysisHeader />

          <AgencySelector
            agencies={agencies}
            selectedAgency={selectedAgency}
            agenciesLoading={agenciesLoading}
            includeSubAgencies={includeSubAgencies}
            onAgencyChange={(agencyId) => {
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

                  console.log(`[DEBUG] Agency selection - selecting department with children: ${agency.name}`);

                  // Fetch aggregated data immediately without setTimeout to avoid race conditions
                  (async () => {
                    try {
                      // First fetch word count since complexity metrics depend on it
                      const wordCount = await fetchAggregatedAnalysis('word_count', agencyId) as number;

                      await fetchAggregatedAnalysis('checksum', agencyId);

                      // Then fetch complexity which will use the word count data
                      await fetchAggregatedAnalysis('complexity_score', agencyId, wordCount);
                    } catch (error) {
                      console.error('Error in aggregated data fetch:', error);
                    }
                  })();

                  // Also fetch cross-cutting data
                  fetchCrossCuttingData(agencyId);
                } else {
                  // For sub-agencies: set checkbox to unchecked and fetch individual data only
                  setIncludeSubAgencies(false);

                  // Fetch individual agency data
                  fetchCrossCuttingData(agencyId);
                  fetchAnalysis('word_count', agencyId);
                  fetchAnalysis('checksum', agencyId);
                  fetchAnalysis('complexity_score', agencyId);
                }
              }
            }}
            onAggregationToggle={handleAggregationToggle}
          />

        <section aria-labelledby="metrics-heading" aria-live="polite" className="mb-12">
          <h2 id="metrics-heading" className="font-heading text-3xl font-semibold mb-8 text-foreground">
            Key Analysis Metrics
          </h2>
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
              additionalContent={getDisplayData().metrics && !complexityScoreLoading ? (
                <dl className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <dt className="font-medium">Sections:</dt>
                    <dd className="text-card-foreground">{getDisplayData().metrics?.totalSections}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <dt className="font-medium">Avg Words/Section:</dt>
                    <dd className="text-card-foreground">{getDisplayData().metrics?.avgWordsPerSection?.toFixed(1)}</dd>
                  </div>
                </dl>
              ) : undefined}
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
        </section>

        {/* Cross-Cutting Analysis Section */}
        <CrossCuttingAnalysis
          data={crossCuttingData}
          loading={crossCuttingLoading}
          severity={crossCuttingSeverity}
          onAgencySelect={handleSharedAgencySelect}
        />
        </main>
      </div>
    </div>
  );
}
