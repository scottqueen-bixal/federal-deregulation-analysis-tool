'use client';

import { useState, ReactNode } from 'react';
import Tooltip from './Tooltip';

interface MetricCardProps {
  title: string;
  value: string | ReactNode;
  description: string | ReactNode;
  tooltipContent: ReactNode;
  loading?: boolean;
  loadingText?: string;
  additionalContent?: ReactNode;
  valueColor?: string;
  ariaLabel?: string;
}

export default function MetricCard({
  title,
  value,
  description,
  tooltipContent,
  loading = false,
  loadingText = 'Loading...',
  additionalContent,
  valueColor = 'text-chart-1',
  ariaLabel
}: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipId = `${title.toLowerCase().replace(/\s+/g, '-')}-tooltip`;

  return (
    <article className="bg-card border border-border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xl font-semibold text-card-foreground font-heading">{title}</h3>
        <div className="relative">
          <button
            type="button"
            className="w-5 h-5 rounded-full bg-gray-200 hover:bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-colors duration-200 flex items-center justify-center text-xs font-bold cursor-pointer"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            aria-label={`${title} information`}
            aria-describedby={showTooltip ? tooltipId : undefined}
            aria-expanded={showTooltip}
          >
            i
          </button>
          <Tooltip show={showTooltip} id={tooltipId}>
            {tooltipContent}
          </Tooltip>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-chart-1"></div>
            <p className="text-4xl font-bold text-muted-foreground">{loadingText}</p>
          </div>
        ) : (
          <div className={`text-4xl font-bold mb-2 ${valueColor}`} aria-label={ariaLabel}>
            {value}
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        {typeof description === 'string' ? description : <>{description}</>}
      </div>

      {additionalContent && !loading && (
        <div className="mt-4">
          {additionalContent}
        </div>
      )}
    </article>
  );
}
