'use client';

import { useState, useEffect } from 'react';
import AgencyCombobox from '../../components/AgencyCombobox';

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
  const [showWordCountTooltip, setShowWordCountTooltip] = useState(false);
  const [showChecksumTooltip, setShowChecksumTooltip] = useState(false);
  const [showComplexityTooltip, setShowComplexityTooltip] = useState(false);
  const [showCrossCuttingTooltip, setShowCrossCuttingTooltip] = useState(false);
  const [includeSubAgencies, setIncludeSubAgencies] = useState(false);
  const [aggregatedData, setAggregatedData] = useState<AnalysisData>({});
  const [expandedSharedSections, setExpandedSharedSections] = useState<Set<number>>(new Set());

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

  // Helper function to get child agency IDs
  const getChildAgencyIds = () => {
    const agency = getSelectedAgencyDetails();
    const childIds = agency?.children?.map(child => child.id) || [];
    console.log(`[DEBUG] getChildAgencyIds - Selected agency:`, agency?.name, `(ID: ${agency?.id})`);
    console.log(`[DEBUG] getChildAgencyIds - Children count:`, agency?.children?.length || 0);
    console.log(`[DEBUG] getChildAgencyIds - Child IDs:`, childIds);
    return childIds;
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
      const results: (Record<string, unknown> | null)[] = [];

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
            const data = await res.json();
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
      const validResults = results.filter(result => result !== null);

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

  // Function to toggle accordion sections
  const toggleSharedSection = (titleIndex: number) => {
    setExpandedSharedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(titleIndex)) {
        newSet.delete(titleIndex);
      } else {
        newSet.add(titleIndex);
      }
      return newSet;
    });
  };

  // Function to handle agency selection from shared agencies list
  const handleSharedAgencySelect = (agencyId: number) => {
    setSelectedAgency(agencyId);
    setIncludeSubAgencies(false); // Reset aggregation toggle
    setAggregatedData({}); // Reset aggregated data
    setExpandedSharedSections(new Set()); // Close all accordions

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
          <header className="mb-12">
            <h1 className="pt-8 font-display text-5xl font-bold mb-4 text-foreground tracking-tight">
              Federal Deregulation Analysis
            </h1>
            <p className="text-xl text-muted-foreground font-light max-w-4xl">
              Comprehensive regulatory analysis and cross-cutting impact assessment for federal agencies
            </p>
            <div className="mb-8 pt-6 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Code of Federal Regulations (CFR) is the official legal print publication containing the codification of the general and permanent rules published in the Federal Register by the departments and agencies of the Federal Government. The Electronic Code of Federal Regulations (eCFR) is a continuously updated online version of the CFR. It is not an official legal edition of the CFR.{' '}
                <a
                  href="https://www.ecfr.gov/reader-aids/understanding-the-ecfr/what-is-the-ecfr"
                  className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors duration-200 cursor-pointer"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Learn more about the eCFR, its status, and the editorial process (opens in new tab)"
                >
                  Learn more about the eCFR, its status, and the editorial process.
                </a>
              </p>
            </div>
          </header>

          <section aria-labelledby="agency-selection-heading" className="mb-12">
            <h2 id="agency-selection-heading" className="sr-only">Agency Selection</h2>
            <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
              <form className="space-y-6">
                <div>
                  <AgencyCombobox
                    agencies={agencies}
                    selectedAgency={selectedAgency}
                    onAgencyChange={(agencyId) => {
                      setSelectedAgency(agencyId);
                      setAggregatedData({}); // Reset aggregated data
                      setExpandedSharedSections(new Set()); // Close all accordions
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
                    loading={agenciesLoading}
                    disabled={agenciesLoading}
                  />
                  <div className="sr-only">
                    Select a federal agency to view its regulatory analysis data
                  </div>
                </div>

                {/* Aggregation Toggle - only show if selected agency has children */}
                {selectedAgency && selectedAgencyHasChildren() && (
                  <div className="mt-6 p-4 bg-muted/50 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label htmlFor="aggregation-toggle" className="text-sm font-semibold text-card-foreground cursor-pointer">
                          Include Sub-Agency Data
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Aggregate metrics from {getSelectedAgencyDetails()?.name} and all its sub-agencies
                        </p>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="aggregation-toggle"
                          type="checkbox"
                          checked={includeSubAgencies}
                          onChange={(e) => handleAggregationToggle(e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-ring border-border rounded transition-colors duration-200 cursor-pointer"
                        />
                      </div>
                    </div>
                    {includeSubAgencies && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        <strong>Including data from:</strong>
                        <ul className="mt-1 ml-4">
                          <li>• {getSelectedAgencyDetails()?.name} (Main Department)</li>
                          {getSelectedAgencyDetails()?.children?.map(child => (
                            <li key={child.id}>• {child.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          </section>        <section aria-labelledby="metrics-heading" aria-live="polite" className="mb-12">
          <h2 id="metrics-heading" className="font-heading text-3xl font-semibold mb-8 text-foreground">
            Key Analysis Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" role="region" aria-label="Key analysis metrics">
            <article className="bg-card border border-border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-semibold text-card-foreground font-heading">Word Count</h3>
                <div className="relative">
                  <button
                    type="button"
                    className="w-5 h-5 rounded-full bg-gray-200 hover:bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-colors duration-200 flex items-center justify-center text-xs font-bold cursor-pointer"
                    onMouseEnter={() => setShowWordCountTooltip(true)}
                    onMouseLeave={() => setShowWordCountTooltip(false)}
                    onFocus={() => setShowWordCountTooltip(true)}
                    onBlur={() => setShowWordCountTooltip(false)}
                    aria-label="Word count information"
                  >
                    i
                  </button>
                  {showWordCountTooltip && (
                    <div className="absolute z-50 w-80 p-4 bg-white border border-gray-300 rounded-lg shadow-lg -top-2 left-8 animate-fade-in">
                      <div className="text-sm text-gray-900">
                        <h4 className="font-semibold mb-2 text-gray-900">Word Count Calculation</h4>
                        <p className="mb-3 text-gray-800">
                          Counts all words in the agency&apos;s Code of Federal Regulations (CFR) sections, including:
                        </p>
                        <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700">
                          <li>Regulatory text and definitions</li>
                          <li>Requirements and procedures</li>
                          <li>Compliance guidelines</li>
                          <li>Enforcement provisions</li>
                        </ul>
                        <p className="text-gray-700">
                          <strong className="text-gray-900">Why it matters:</strong> Higher word counts often indicate more complex regulations that may burden businesses and citizens with compliance costs.
                        </p>
                      </div>
                      {/* Tooltip arrow */}
                      <div className="absolute top-3 -left-2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-gray-300"></div>
                      <div className="absolute top-3 -left-1 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-white"></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {wordCountLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-chart-1"></div>
                    <p className="text-4xl font-bold text-muted-foreground">Loading...</p>
                  </div>
                ) : (
                  <p className="text-4xl font-bold text-chart-1 mb-2" aria-label={`Total word count: ${getDisplayData().wordCount?.toLocaleString() || 'Not available'}`}>
                    {getDisplayData().wordCount?.toLocaleString() || 'N/A'}
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {includeSubAgencies && selectedAgencyHasChildren() ?
                  'Total regulatory text volume (including sub-agencies)' :
                  'Total regulatory text volume'
                }
              </p>
              {getDisplayData().metrics && !complexityScoreLoading && (
                <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <dt className="font-medium">Sections:</dt>
                    <dd className="text-card-foreground">{getDisplayData().metrics?.totalSections}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <dt className="font-medium">Avg Words/Section:</dt>
                    <dd className="text-card-foreground">{getDisplayData().metrics?.avgWordsPerSection?.toFixed(1)}</dd>
                  </div>
                </dl>
              )}
            </article>

            <article className="bg-card border border-border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-semibold text-card-foreground font-heading">Document Checksum</h3>
                <div className="relative">
                  <button
                    type="button"
                    className="w-5 h-5 rounded-full bg-gray-200 hover:bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-colors duration-200 flex items-center justify-center text-xs font-bold cursor-pointer"
                    onMouseEnter={() => setShowChecksumTooltip(true)}
                    onMouseLeave={() => setShowChecksumTooltip(false)}
                    onFocus={() => setShowChecksumTooltip(true)}
                    onBlur={() => setShowChecksumTooltip(false)}
                    aria-label="Document checksum information"
                  >
                    i
                  </button>
                  {showChecksumTooltip && (
                    <div className="absolute z-50 w-80 p-4 bg-white border border-gray-300 rounded-lg shadow-lg -top-2 left-8 animate-fade-in">
                      <div className="text-sm text-gray-900">
                        <h4 className="font-semibold mb-2 text-gray-900">Document Checksum</h4>
                        <p className="mb-3 text-gray-800">
                          A unique cryptographic fingerprint (hash) generated from the regulatory text content.
                        </p>
                        <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700">
                          <li>Verifies document integrity</li>
                          <li>Detects any content changes</li>
                          <li>Ensures data consistency</li>
                          <li>Enables version tracking</li>
                        </ul>
                        <p className="text-gray-700">
                          <strong className="text-gray-900">Why it matters:</strong> Checksums provide audit trails and ensure the regulatory text hasn&apos;t been altered, maintaining data integrity for analysis.
                        </p>
                      </div>
                      {/* Tooltip arrow */}
                      <div className="absolute top-3 -left-2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-gray-300"></div>
                      <div className="absolute top-3 -left-1 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-white"></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {checksumLoading ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded border">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-chart-2"></div>
                    <span className="text-sm text-muted-foreground">Calculating checksum...</span>
                  </div>
                ) : (
                  <p className="text-sm font-mono break-all text-muted-foreground bg-muted p-3 rounded border" aria-label={`Document checksum: ${getDisplayData().checksum || 'Not available'}`}>
                    {getDisplayData().checksum || 'N/A'}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {includeSubAgencies && selectedAgencyHasChildren() ?
                    'Verification hash (parent agency)' :
                    'Verification hash'
                  }
                </p>
              </div>
            </article>

            <article className="bg-card border border-border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-semibold text-card-foreground font-heading">Complexity Score</h3>
                <div className="relative">
                  <button
                    type="button"
                    className="w-5 h-5 rounded-full bg-gray-200 hover:bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-colors duration-200 flex items-center justify-center text-xs font-bold cursor-pointer"
                    onMouseEnter={() => setShowComplexityTooltip(true)}
                    onMouseLeave={() => setShowComplexityTooltip(false)}
                    onFocus={() => setShowComplexityTooltip(true)}
                    onBlur={() => setShowComplexityTooltip(false)}
                    aria-label="Complexity score information"
                  >
                    i
                  </button>
                  {showComplexityTooltip && (
                    <div className="absolute z-50 w-80 p-4 bg-white border border-gray-300 rounded-lg shadow-lg -top-2 left-8 animate-fade-in">
                      <div className="text-sm text-gray-900">
                        <h4 className="font-semibold mb-2 text-gray-900">Relative Complexity Score</h4>
                        <p className="mb-3 text-gray-800">
                          Score from 0-100 showing this agency&apos;s regulatory complexity relative to the most complex agency in the dataset.
                        </p>
                        <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700">
                          <li><strong>Volume:</strong> Total number of regulatory sections</li>
                          <li><strong>Cross-references:</strong> Citations to other CFR sections</li>
                          <li><strong>Technical density:</strong> Regulatory jargon frequency</li>
                          <li><strong>Relative scaling:</strong> Normalized against highest complexity agency</li>
                        </ul>
                        <div className="mb-3 space-y-1 text-gray-700">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-green-500 rounded"></span>
                            <span>0-24: Low complexity</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-orange-500 rounded"></span>
                            <span>25-60: Moderate complexity</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-red-500 rounded"></span>
                            <span>61-100: High complexity</span>
                          </div>
                        </div>
                        <p className="text-gray-700">
                          <strong className="text-gray-900">Why it matters:</strong> Higher scores indicate regulations with complex navigation and compliance requirements, making them prime candidates for simplification.
                        </p>
                      </div>
                      {/* Tooltip arrow */}
                      <div className="absolute top-3 -left-2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-gray-300"></div>
                      <div className="absolute top-3 -left-1 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-white"></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {complexityScoreLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-chart-3"></div>
                    <p className="text-4xl font-bold text-muted-foreground">Calculating...</p>
                  </div>
                ) : (
                  <p className={`text-4xl font-bold mb-2 ${
                    !getDisplayData().relativeComplexityScore ? 'text-muted-foreground' :
                    (getDisplayData().relativeComplexityScore || 0) < 25 ? 'text-green-600 dark:text-green-400' :
                    (getDisplayData().relativeComplexityScore || 0) <= 60 ? 'text-orange-600 dark:text-orange-400' :
                    'text-red-600 dark:text-red-400'
                  }`} aria-label={`Complexity score: ${getDisplayData().relativeComplexityScore || 'Not available'} out of 100`}>
                    {getDisplayData().relativeComplexityScore ? `${getDisplayData().relativeComplexityScore}/100` : 'N/A'}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mb-2">
                  {includeSubAgencies && selectedAgencyHasChildren() ?
                    'Relative to most complex department (including sub-agencies)' :
                    'Relative to most complex agency'
                  }
                  {getDisplayData().complexityScore && (
                    <span className="block text-xs opacity-75">
                      (Raw score: {getDisplayData().complexityScore?.toLocaleString()})
                    </span>
                  )}
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* Cross-Cutting Analysis Section */}
        {(crossCuttingData || crossCuttingLoading) && (
          <section aria-labelledby="cross-cutting-heading" aria-live="polite" className="mb-12">
            <h2 id="cross-cutting-heading" className="font-heading text-3xl font-semibold mb-8 text-foreground">
              Cross-Cutting Regulatory Analysis
            </h2>

            {crossCuttingLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                {[1, 2, 3].map((i) => (
                  <article key={i} className="bg-card border border-border rounded-lg p-8 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-chart-3"></div>
                      <h3 className="text-xl font-semibold text-muted-foreground font-heading">Loading...</h3>
                    </div>
                    <div className="h-12 bg-muted rounded animate-pulse mb-2"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                  </article>
                ))}
              </div>
            ) : (
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
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-semibold text-card-foreground font-heading">Cross-Cutting Impact</h3>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-5 h-5 rounded-full bg-gray-200 hover:bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-colors duration-200 flex items-center justify-center text-xs font-bold cursor-pointer"
                      onMouseEnter={() => setShowCrossCuttingTooltip(true)}
                      onMouseLeave={() => setShowCrossCuttingTooltip(false)}
                      onFocus={() => setShowCrossCuttingTooltip(true)}
                      onBlur={() => setShowCrossCuttingTooltip(false)}
                      aria-label="Cross-cutting impact information"
                    >
                      i
                    </button>
                    {showCrossCuttingTooltip && (
                      <div className="absolute z-50 w-80 p-4 bg-white border border-gray-300 rounded-lg shadow-lg -top-2 left-8 animate-fade-in">
                        <div className="text-sm text-gray-900">
                          <h4 className="font-semibold mb-2 text-gray-900">Cross-Cutting Impact Analysis</h4>
                          <p className="mb-3 text-gray-800">
                            Multi-factor severity score evaluating regulatory complexity across agencies.
                          </p>
                          <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700">
                            <li>Impact level distribution (HIGH/MEDIUM/LOW)</li>
                            <li>Number of agencies involved</li>
                            <li>Regulatory density (shared vs. exclusive)</li>
                            <li>High-impact concentration bonus</li>
                          </ul>
                          <p className="text-gray-700 mb-2">
                            <strong className="text-gray-900">Severity levels:</strong>
                          </p>
                          <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700 ml-4">
                            <li className="text-gray-600"><strong>MINIMAL (0-1):</strong> Limited cross-agency impact</li>
                            <li className="text-green-600"><strong>LOW (2-3):</strong> Minor overlap concerns</li>
                            <li className="text-yellow-600"><strong>MODERATE (4-5):</strong> Significant coordination needed</li>
                            <li className="text-orange-600"><strong>HIGH (6-10):</strong> Complex inter-agency effects</li>
                            <li className="text-red-600"><strong>CRITICAL (11+):</strong> Major bureaucratic entanglement</li>
                          </ul>
                          <p className="text-gray-700">
                            <strong className="text-gray-900">Why it matters:</strong> Higher scores indicate regulations requiring coordinated reform efforts and potential sources of bureaucratic inefficiency.
                          </p>
                        </div>
                        {/* Tooltip arrow */}
                        <div className="absolute top-3 -left-2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-gray-300"></div>
                        <div className="absolute top-3 -left-1 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-white"></div>
                      </div>
                    )}
                  </div>
                </div>
                <p className={`text-4xl font-bold mb-2 ${
                  crossCuttingSeverity.level === 'MINIMAL' ? 'text-gray-600' :
                  crossCuttingSeverity.level === 'LOW' ? 'text-green-600' :
                  crossCuttingSeverity.level === 'MODERATE' ? 'text-yellow-600' :
                  crossCuttingSeverity.level === 'HIGH' ? 'text-orange-600' :
                  'text-red-600'
                }`} aria-label={`Cross-cutting severity score: ${crossCuttingSeverity.score}, ${crossCuttingSeverity.level.toLowerCase()} severity level`}>
                  {crossCuttingSeverity.score}
                </p>
                <p className="text-sm text-muted-foreground mb-1">
                  Severity: <span className={`font-semibold ${
                    crossCuttingSeverity.level === 'MINIMAL' ? 'text-gray-600' :
                    crossCuttingSeverity.level === 'LOW' ? 'text-green-600' :
                    crossCuttingSeverity.level === 'MODERATE' ? 'text-yellow-600' :
                    crossCuttingSeverity.level === 'HIGH' ? 'text-orange-600' :
                    'text-red-600'
                  }`}>{crossCuttingSeverity.level}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {crossCuttingData.summary.highImpactShared} high-impact shared titles
                </p>
              </article>
            </div>

            )}

            {!crossCuttingLoading && crossCuttingData.crossCuttingTitles && crossCuttingData.crossCuttingTitles.length > 0 && (
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
                        <div className="flex flex-col sm:flex-row gap-2" role="group" aria-label="Title status indicators">
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
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => toggleSharedSection(index)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleSharedSection(index);
                              }
                            }}
                            className="flex items-center gap-2 text-left text-sm font-semibold text-card-foreground hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-[3px] focus:ring-ring focus:ring-offset-2 rounded-md px-2 py-1 cursor-pointer"
                            aria-expanded={expandedSharedSections.has(index)}
                            aria-controls={`shared-agencies-${index}`}
                            id={`shared-toggle-${index}`}
                          >
                            <span>View agencies</span>
                            <svg
                              className={`w-4 h-4 transition-transform duration-200 ${
                                expandedSharedSections.has(index) ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <div
                            id={`shared-agencies-${index}`}
                            role="region"
                            aria-labelledby={`shared-toggle-${index}`}
                            className={`transition-all duration-300 ease-in-out ${
                              expandedSharedSections.has(index)
                                ? 'opacity-100 mt-3 bg-gray-800 border border-gray-700 rounded-lg p-4'
                                : 'max-h-0 opacity-0 overflow-hidden'
                            }`}
                          >
                            <ul
                              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-1 gap-y-1 text-sm"
                              role="list"
                              aria-label={`${title.sharedWith.length} agencies sharing this CFR title`}
                            >
                              {title.sharedWith.map((agency) => (
                                <li key={agency.id} className="flex">
                                  <button
                                    onClick={() => handleSharedAgencySelect(agency.id)}
                                    className="w-full h-full text-left text-white hover:text-gray-200 hover:bg-gray-600 transition-colors duration-200 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[3px] focus:ring-[#0080ff] focus:ring-offset-2 focus:ring-offset-gray-800 cursor-pointer flex items-center"
                                    aria-label={`Switch to ${agency.name} for analysis`}
                                  >
                                    <span className="font-medium">{agency.name}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
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
