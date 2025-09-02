'use client';

import React, { useMemo, useCallback } from 'react';
import AgencyCombobox from './AgencyCombobox';

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

interface AgencySelectorProps {
  agencies: Agency[];
  selectedAgency: number | null;
  agenciesLoading: boolean;
  includeSubAgencies: boolean;
  onAgencyChange: (agencyId: number | null) => void;
  onAggregationToggle: (checked: boolean) => void;
}

export default React.memo(function AgencySelector({
  agencies,
  selectedAgency,
  agenciesLoading,
  includeSubAgencies,
  onAgencyChange,
  onAggregationToggle
}: AgencySelectorProps) {
  // Helper function to get selected agency details - memoized
  const getSelectedAgencyDetails = useCallback(() => {
    return agencies.find(agency => agency.id === selectedAgency);
  }, [agencies, selectedAgency]);

  // Helper function to check if selected agency has children - memoized
  const selectedAgencyHasChildren = useMemo(() => {
    const agency = getSelectedAgencyDetails();
    return agency?.children && agency.children.length > 0;
  }, [getSelectedAgencyDetails]);

  return (
    <section aria-labelledby="agency-selection-heading" className="mb-12">
      <h2 id="agency-selection-heading" className="sr-only">Agency Selection</h2>
      <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
        <form className="space-y-6">
          <div>
            <AgencyCombobox
              agencies={agencies}
              selectedAgency={selectedAgency}
              onAgencyChange={onAgencyChange}
              loading={agenciesLoading}
              disabled={agenciesLoading}
            />
            <div className="sr-only">
              Select a federal agency to view its regulatory analysis data
            </div>
          </div>

          {/* Aggregation Toggle - only show if selected agency has children */}
          {selectedAgency && selectedAgencyHasChildren && (
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
                    onChange={(e) => onAggregationToggle(e.target.checked)}
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
    </section>
  );
});
