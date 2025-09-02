'use client';

import { useState, useRef, useEffect } from 'react';

interface Agency {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number | null;
  parent?: Agency | null;
  children?: Agency[];
}

interface AgencyGroup {
  label: string;
  agencies: Agency[];
}

interface AgencyComboboxProps {
  agencies: Agency[];
  selectedAgency: number | null;
  onAgencyChange: (agencyId: number | null) => void;
  loading?: boolean;
  disabled?: boolean;
}

// Simple SVG icons
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

interface Agency {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number | null;
  parent?: Agency | null;
  children?: Agency[];
}

interface AgencyGroup {
  label: string;
  agencies: Agency[];
}

interface AgencyComboboxProps {
  agencies: Agency[];
  selectedAgency: number | null;
  onAgencyChange: (agencyId: number | null) => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function AgencyCombobox({
  agencies,
  selectedAgency,
  onAgencyChange,
  loading = false,
  disabled = false
}: AgencyComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Group agencies by parent/independent
  const groupedAgencies: AgencyGroup[] = (() => {
    if (!Array.isArray(agencies)) return [];

    const parentAgencies = agencies.filter(agency => !agency.parentId);
    const childAgencies = agencies.filter(agency => agency.parentId);
    const groups: AgencyGroup[] = [];

    // Add departmental groups
    parentAgencies.forEach(agency => {
      const children = childAgencies.filter(child => child.parentId === agency.id);

      if (children.length > 0) {
        groups.push({
          label: agency.name,
          agencies: [
            { ...agency, name: `${agency.name} (Main Department)` },
            ...children
          ]
        });
      }
    });

    // Add independent agencies group
    const independentAgencies = parentAgencies.filter(agency => {
      const hasChildren = childAgencies.some(child => child.parentId === agency.id);
      return !hasChildren;
    });

    if (independentAgencies.length > 0) {
      groups.push({
        label: 'Independent Agencies',
        agencies: independentAgencies
      });
    }

    return groups;
  })();

  // Filter agencies based on search term
  const filteredGroups = groupedAgencies.map(group => ({
    ...group,
    agencies: group.agencies.filter(agency =>
      agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(group => group.agencies.length > 0);

  // Get all filtered agencies for keyboard navigation
  const allFilteredAgencies = filteredGroups.flatMap(group => group.agencies);

  // Get selected agency name
  const selectedAgencyName = selectedAgency
    ? agencies.find(a => a.id === selectedAgency)?.name
    : null;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < allFilteredAgencies.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : allFilteredAgencies.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && allFilteredAgencies[highlightedIndex]) {
            onAgencyChange(allFilteredAgencies[highlightedIndex].id);
            setIsOpen(false);
            setSearchTerm('');
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, allFilteredAgencies, onAgencyChange]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled || loading) return;
    setIsOpen(!isOpen);
    setHighlightedIndex(-1);
  };

  const handleAgencySelect = (agency: Agency) => {
    onAgencyChange(agency.id);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label htmlFor="agency-combobox" className="block text-sm font-semibold mb-3 text-card-foreground">
        Select Federal Agency
      </label>

      {/* Trigger Button */}
      <button
        id="agency-combobox"
        type="button"
        onClick={handleToggle}
        disabled={disabled || loading}
        className="w-full p-4 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 font-medium flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate">
          {loading
            ? 'Loading agencies...'
            : selectedAgencyName
              ? selectedAgencyName
              : 'Choose an agency...'
          }
        </span>
        <ChevronDownIcon
          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-border rounded-md shadow-lg max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-border bg-white dark:bg-gray-800">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(-1);
                }}
                placeholder="Search agencies..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-80 overflow-y-auto bg-white dark:bg-gray-800">
            {filteredGroups.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center bg-white dark:bg-gray-800">
                No agencies found matching &ldquo;{searchTerm}&rdquo;
              </div>
            ) : (
              filteredGroups.map((group, groupIndex) => (
                <div key={group.label}>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-gray-50 dark:bg-gray-700">
                    {group.label}
                  </div>
                  {group.agencies.map((agency, agencyIndex) => {
                    const globalIndex = filteredGroups
                      .slice(0, groupIndex)
                      .reduce((acc, g) => acc + g.agencies.length, 0) + agencyIndex;

                    const isHighlighted = globalIndex === highlightedIndex;
                    const isSelected = agency.id === selectedAgency;
                    const isChild = agency.parentId !== null && agency.parentId !== undefined;

                    return (
                      <button
                        key={agency.id}
                        type="button"
                        onClick={() => handleAgencySelect(agency)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 bg-white dark:bg-gray-800 cursor-pointer ${
                          isChild ? 'pl-8' : ''
                        } ${
                          isHighlighted
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        } ${
                          isSelected
                            ? 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100 font-medium'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        {isChild && <span className="text-muted-foreground mr-2">└─</span>}
                        {agency.name}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
