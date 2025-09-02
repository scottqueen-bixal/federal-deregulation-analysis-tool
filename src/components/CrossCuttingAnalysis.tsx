'use client';

import { useState } from 'react';
import MetricCard from './MetricCard';
import CFRTitlesList from './CFRTitlesList';
import Tooltip from './Tooltip';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner';
import {
  SharedTitlesTooltipContent,
  PartnerAgenciesTooltipContent,
  CrossCuttingImpactTooltipContent
} from './TooltipContent';

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

interface CrossCuttingSeverity {
  score: number;
  level: 'MINIMAL' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

interface CrossCuttingAnalysisProps {
  data: CrossCuttingData;
  loading: boolean;
  severity: CrossCuttingSeverity;
  onAgencySelect: (agencyId: number) => void;
}

export default function CrossCuttingAnalysis({
  data,
  loading,
  severity,
  onAgencySelect
}: CrossCuttingAnalysisProps) {
  const [showCrossCuttingTooltip, setShowCrossCuttingTooltip] = useState(false);

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'MINIMAL': return 'text-gray-800 dark:text-gray-200';
      case 'LOW': return 'text-green-700 dark:text-green-400';
      case 'MODERATE': return 'text-yellow-700 dark:text-yellow-400';
      case 'HIGH': return 'text-orange-700 dark:text-orange-400';
      case 'CRITICAL': return 'text-red-700 dark:text-red-400';
      default: return 'text-gray-800 dark:text-gray-200';
    }
  };

  if (!data && !loading) {
    return null;
  }

  // Check if we have meaningful data (not just initial empty state)
  const hasValidData = data && data.summary && data.summary.agencyName;

  return (
    <section aria-labelledby="cross-cutting-heading" aria-live="polite" className="mb-12">
      <h2 id="cross-cutting-heading" className="font-heading text-3xl font-semibold mb-8 text-foreground">
        Cross-Cutting Regulatory Analysis
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10" role="region" aria-label="Cross-cutting analysis summary">
        <MetricCard
          title="Shared Titles"
          value={hasValidData ? data.summary.sharedTitles : undefined}
          description="CFR titles affecting multiple agencies"
          tooltipContent={<SharedTitlesTooltipContent />}
          valueColor="text-chart-3"
          loading={loading}
          ariaLabel={hasValidData ? `Number of shared titles: ${data.summary.sharedTitles}` : "Select an agency to view shared titles"}
        />

        <MetricCard
          title="Partner Agencies"
          value={hasValidData ? data.summary.sharedWithAgencies : undefined}
          description="Other agencies sharing regulations"
          tooltipContent={<PartnerAgenciesTooltipContent />}
          valueColor="text-chart-4"
          loading={loading}
          ariaLabel={hasValidData ? `Number of agencies sharing regulations: ${data.summary.sharedWithAgencies}` : "Select an agency to view partner agencies"}
        />

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
                aria-describedby={showCrossCuttingTooltip ? "crosscutting-tooltip" : undefined}
                aria-expanded={showCrossCuttingTooltip}
              >
                i
              </button>
              <Tooltip show={showCrossCuttingTooltip} id="crosscutting-tooltip">
                <CrossCuttingImpactTooltipContent />
              </Tooltip>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 mb-2">
              <LoadingSpinner size="sm" showSpinner={true} text="" />
              <span className="text-muted-foreground text-sm">Calculating...</span>
            </div>
          ) : hasValidData ? (
            <>
              <p className={`text-4xl font-bold mb-2 ${getSeverityColor(severity.level)}`}
                 aria-label={`Cross-cutting severity score: ${severity.score}, ${severity.level.toLowerCase()} severity level`}>
                {severity.score}
              </p>
              <p className="text-sm text-muted-foreground mb-1">
                Severity: <span className={`font-semibold ${getSeverityColor(severity.level)}`}>
                  {severity.level}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {data.summary.highImpactShared} high-impact shared titles
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm">Select an agency to view cross-cutting impact</p>
            </div>
          )}
        </article>
      </div>

      {/* CFR Titles Section */}
      {loading ? (
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          {/* Header with loading indicator */}
          <div className="flex items-center gap-3 mb-6">
            <LoadingSpinner size="md" text="Loading CFR Titles..." textClassName="text-card-foreground font-semibold text-xl" />
          </div>

          {/* Skeleton content */}
          <div className="animate-pulse">
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border-l-4 border-muted pl-6 py-4 bg-accent/20 rounded-r-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="h-6 bg-muted rounded w-20"></div>
                      <div className="h-6 bg-muted rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer loading message */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <LoadingSpinner size="sm" showSpinner={true} text="" />
              <span className="text-sm">Analyzing cross-cutting regulatory data...</span>
            </div>
          </div>
        </div>
      ) : hasValidData && data.crossCuttingTitles && data.crossCuttingTitles.length > 0 ? (
        <CFRTitlesList
          titles={data.crossCuttingTitles}
          agencyName={data.summary.agencyName}
          onAgencySelect={onAgencySelect}
        />
      ) : hasValidData ? (
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm text-center">
          <div className="py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">No CFR Titles Found</h3>
            <p className="text-muted-foreground">
              No cross-cutting regulatory data is available for {data.summary.agencyName} at this time.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm text-center">
          <div className="py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Select an Agency</h3>
            <p className="text-muted-foreground">
              Choose a federal agency above to view cross-cutting regulatory analysis.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
