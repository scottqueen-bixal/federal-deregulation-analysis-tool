'use client';

import { useState } from 'react';
import MetricCard from './MetricCard';
import CFRTitlesList from './CFRTitlesList';
import Tooltip from './Tooltip';
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

  return (
    <section aria-labelledby="cross-cutting-heading" aria-live="polite" className="mb-12">
      <h2 id="cross-cutting-heading" className="font-heading text-3xl font-semibold mb-8 text-foreground">
        Cross-Cutting Regulatory Analysis
      </h2>

      {loading ? (
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
          <MetricCard
            title="Shared Titles"
            value={data.summary.sharedTitles}
            description="CFR titles affecting multiple agencies"
            tooltipContent={<SharedTitlesTooltipContent />}
            valueColor="text-chart-3"
            ariaLabel={`Number of shared titles: ${data.summary.sharedTitles}`}
          />

          <MetricCard
            title="Partner Agencies"
            value={data.summary.sharedWithAgencies}
            description="Other agencies sharing regulations"
            tooltipContent={<PartnerAgenciesTooltipContent />}
            valueColor="text-chart-4"
            ariaLabel={`Number of agencies sharing regulations: ${data.summary.sharedWithAgencies}`}
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
          </article>
        </div>
      )}

      {!loading && data.crossCuttingTitles && data.crossCuttingTitles.length > 0 && (
        <CFRTitlesList
          titles={data.crossCuttingTitles}
          agencyName={data.summary.agencyName}
          onAgencySelect={onAgencySelect}
        />
      )}
    </section>
  );
}
