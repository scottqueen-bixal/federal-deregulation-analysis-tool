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
  const [showWordCountTooltip, setShowWordCountTooltip] = useState(false);
  const [showChecksumTooltip, setShowChecksumTooltip] = useState(false);
  const [showComplexityTooltip, setShowComplexityTooltip] = useState(false);
  const [showCrossCuttingTooltip, setShowCrossCuttingTooltip] = useState(false);

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

    // Normalize to 0-100 scale
    const normalizedScore = Math.min((rawScore / 30) * 100, 100);

    // Determine severity level
    let level: 'MINIMAL' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    if (normalizedScore < 15) level = 'MINIMAL';
    else if (normalizedScore < 35) level = 'LOW';
    else if (normalizedScore < 60) level = 'MODERATE';
    else if (normalizedScore < 80) level = 'HIGH';
    else level = 'CRITICAL';

    return { score: Math.round(normalizedScore), level };
  };

  const crossCuttingSeverity = calculateCrossCuttingSeverity(crossCuttingData.summary, crossCuttingData.crossCuttingTitles);

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

      // Handle field mapping for complexity score API
      if (endpoint === 'complexity_score' && data.complexity_score !== undefined) {
        data.complexityScore = data.complexity_score;
        data.relativeComplexityScore = data.relative_complexity_score;
      }

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
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-semibold text-card-foreground font-heading">Word Count</h3>
                <div className="relative">
                  <button
                    type="button"
                    className="w-5 h-5 rounded-full bg-gray-200 hover:bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-colors duration-200 flex items-center justify-center text-xs font-bold"
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
              <p className="text-4xl font-bold text-chart-1 mb-2" aria-label={`Total word count: ${analysisData.wordCount?.toLocaleString() || 'Not available'}`}>
                {analysisData.wordCount?.toLocaleString() || 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">Total regulatory text volume</p>
            </article>

            <article className="bg-card border border-border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-semibold text-card-foreground font-heading">Document Checksum</h3>
                <div className="relative">
                  <button
                    type="button"
                    className="w-5 h-5 rounded-full bg-gray-200 hover:bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-colors duration-200 flex items-center justify-center text-xs font-bold"
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
              <p className="text-sm font-mono break-all text-muted-foreground bg-muted p-3 rounded border" aria-label={`Document checksum: ${analysisData.checksum || 'Not available'}`}>
                {analysisData.checksum || 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Verification hash</p>
            </article>

            <article className="bg-card border border-border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-semibold text-card-foreground font-heading">Complexity Score</h3>
                <div className="relative">
                  <button
                    type="button"
                    className="w-5 h-5 rounded-full bg-gray-200 hover:bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-colors duration-200 flex items-center justify-center text-xs font-bold"
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
              <p className={`text-4xl font-bold mb-2 ${
                !analysisData.relativeComplexityScore ? 'text-muted-foreground' :
                analysisData.relativeComplexityScore < 25 ? 'text-green-600 dark:text-green-400' :
                analysisData.relativeComplexityScore <= 60 ? 'text-orange-600 dark:text-orange-400' :
                'text-red-600 dark:text-red-400'
              }`} aria-label={`Complexity score: ${analysisData.relativeComplexityScore || 'Not available'} out of 100`}>
                {analysisData.relativeComplexityScore ? `${analysisData.relativeComplexityScore}/100` : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Relative to most complex agency
                {analysisData.complexityScore && (
                  <span className="block text-xs opacity-75">
                    (Raw score: {analysisData.complexityScore.toLocaleString()})
                  </span>
                )}
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
                  <div className="flex justify-between py-1 border-b border-border/30">
                    <dt className="font-medium">Avg Words/Section:</dt>
                    <dd className="text-card-foreground">{analysisData.metrics.avgWordsPerSection?.toFixed(1)}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="font-medium">Hierarchy Depth:</dt>
                    <dd className="text-card-foreground">{analysisData.metrics.hierarchyDepth || 'N/A'}</dd>
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
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-semibold text-card-foreground font-heading">Cross-Cutting Impact</h3>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-5 h-5 rounded-full bg-gray-200 hover:bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-colors duration-200 flex items-center justify-center text-xs font-bold"
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
                            <li className="text-gray-600"><strong>MINIMAL (0-14):</strong> Limited cross-agency impact</li>
                            <li className="text-green-600"><strong>LOW (15-34):</strong> Minor overlap concerns</li>
                            <li className="text-yellow-600"><strong>MODERATE (35-59):</strong> Significant coordination needed</li>
                            <li className="text-orange-600"><strong>HIGH (60-79):</strong> Complex inter-agency effects</li>
                            <li className="text-red-600"><strong>CRITICAL (80+):</strong> Major bureaucratic entanglement</li>
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
                  crossCuttingSeverity.level === 'MINIMAL' ? 'text-gray-500 dark:text-gray-400' :
                  crossCuttingSeverity.level === 'LOW' ? 'text-green-600 dark:text-green-400' :
                  crossCuttingSeverity.level === 'MODERATE' ? 'text-yellow-600 dark:text-yellow-400' :
                  crossCuttingSeverity.level === 'HIGH' ? 'text-orange-600 dark:text-orange-400' :
                  'text-red-600 dark:text-red-400'
                }`} aria-label={`Cross-cutting severity score: ${crossCuttingSeverity.score} out of 100, ${crossCuttingSeverity.level.toLowerCase()} impact`}>
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
                        <div>
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
