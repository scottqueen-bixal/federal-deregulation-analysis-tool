'use client';

import React, { useState, useCallback } from 'react';

interface CFRTitle {
  cfrNumber: number;
  name: string;
  agencyCount: number;
  agencies: Array<{ id: number; name: string; slug: string }>;
  sharedWith: Array<{ id: number; name: string; slug: string }>;
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  isShared: boolean;
}

interface CFRTitlesListProps {
  titles: CFRTitle[];
  agencyName: string;
  onAgencySelect: (agencyId: number) => void;
}

export default React.memo(function CFRTitlesList({ titles, agencyName, onAgencySelect }: CFRTitlesListProps) {
  const [expandedSharedSections, setExpandedSharedSections] = useState<Set<number>>(new Set());

  // Function to toggle accordion sections - memoized to prevent unnecessary re-renders
  const toggleSharedSection = useCallback((titleIndex: number) => {
    setExpandedSharedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(titleIndex)) {
        newSet.delete(titleIndex);
      } else {
        newSet.add(titleIndex);
      }
      return newSet;
    });
  }, []);

  if (!titles || titles.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="cfr-titles-heading" className="bg-card border border-border rounded-lg p-8 shadow-sm">
      <h3 id="cfr-titles-heading" className="text-2xl font-semibold mb-6 text-card-foreground font-heading">
        CFR Titles for {agencyName}
      </h3>
      <ul className="space-y-6" role="list" aria-label="List of CFR titles and their sharing status">
        {titles.map((title, index) => (
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
                          onClick={() => onAgencySelect(agency.id)}
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
  );
});
