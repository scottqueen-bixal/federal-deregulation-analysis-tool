# Changelog

All notable changes to the Federal Deregulation Analysis Tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Dynamic tooltip positioning that adjusts based on viewport space
- Enhanced tooltip arrows that adapt to different positioning scenarios
- Smart positioning logic to prevent tooltips from being cut off by screen edges

### Changed
- Improved tooltip component to handle multiple edge constraints simultaneously
- Enhanced arrow positioning to maintain proper alignment with trigger elements

## [0.3.0] - 2025-09-02

### Added
- **UI/UX Enhancements**
  - Enhanced Tooltip component with dynamic positioning and arrow adjustments
  - CheckIcon component for improved visual feedback
  - Enhanced AgencyCombobox with scroll functionality and improved selection display
  - Loading states with Suspense and LoadingSpinner components
  - Enhanced accessibility features with ARIA attributes for tooltips and agency selection
  - Improved focus ring styles for better accessibility
  - Added favicon and visual improvements

- **Component Architecture**
  - ErrorBoundary component for better error handling
  - Refactored AnalysisClientWrapper to use useReducer for state management
  - Added comprehensive tooltip content components for regulatory analysis
  - MetricCard, AnalysisHeader, CFRTitlesList, and CrossCuttingAnalysis components
  - LoadingSpinner component with size variants and loading text

- **Features**
  - Most complex agency feature implementation
  - Agency selection functionality for shared agencies
  - Accordion functionality to toggle shared agency sections
  - Cross-cutting severity calculation with updated display ranges
  - Cache clearing endpoint for max aggregated complexity score
  - Informational section about the eCFR

### Changed
- **Refactoring**
  - Refactored Analysis Component into Server Component and Client Wrapper
  - Enhanced metrics calculation for analysis data
  - Improved display logic for average words per section
  - Updated LoadingSpinner imports and error handling
  - Enhanced agency selection UI with improved layout

- **Styling & Accessibility**
  - Updated border color in LoadingSpinner to use HSL variables
  - Enhanced styling for cross-cutting impact indicators
  - Improved styling for shared section toggle with better spacing
  - Updated styling for agency group labels in AgencyCombobox
  - Added cursor pointer to interactive elements

### Fixed
- Improved display logic for average words per section in AnalysisClientWrapper
- Removed unnecessary whitespace in tooltip and agency combobox components
- Updated parameter type handling for agencyId in GET requests

### Removed
- Unused LoadingSpinner component and associated styles
- Complexity optimizations documentation file
- Unused SVG files
- REQUIREMENTS.md file (no longer needed)

## [0.2.0] - 2025-08-30

### Added
- **Performance & Optimization**
  - Optimized complexity score calculations with caching
  - Improved performance metrics implementation
  - Enhanced data ingestion command to enable all agencies
  - Increased max agencies for data ingestion from 5 to 30

- **UI Components**
  - AgencyCombobox component for improved agency selection
  - Enhanced agency selection by grouping independent agencies
  - Integration of Analysis component into Home page

### Changed
- Updated data ingestion logic to handle production and development environments
- Enhanced Docker setup and ingestion process with new configurations

## [0.1.0] - 2025-08-29

### Added
- **Core Foundation**
  - Initial Next.js application setup
  - PostgreSQL database integration with Prisma ORM
  - Docker containerization with docker-compose setup
  - Initial API scaffold with analysis dashboard

- **Database Schema**
  - Agency model with parent-child relationship support for hierarchy
  - CFR (Code of Federal Regulations) data structure
  - Migration system for database schema management

- **Data Ingestion**
  - eCFR API integration for regulatory data collection
  - Data ingestion scripts for CFR references and agency data
  - Support for multiple agencies and CFR titles with date tracking
  - XML parsing capabilities for regulatory content
  - Ingestion hierarchy processing for agencies with CFR references

- **Analysis Features**
  - Cross-cutting administrative rules analysis
  - Summary statistics calculation
  - Complexity score calculations with dynamic hierarchy depth analysis
  - Word count analysis for regulatory content
  - Checksum generation for document integrity
  - Historical changes tracking

- **API Endpoints**
  - Cross-cutting analysis API for agency data retrieval
  - Analysis endpoints for various metrics
  - Data endpoints for agencies and titles
  - Debug endpoints for development support

- **Testing Infrastructure**
  - Jest testing framework setup
  - API endpoint test suite
  - Health check monitoring
  - Comprehensive test coverage for core functionality

### Technical Details
- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Testing**: Jest with comprehensive API testing
- **Containerization**: Docker with multi-stage builds
- **Data Source**: eCFR (Electronic Code of Federal Regulations) API

---

## Development Guidelines

This project follows these conventions:
- **Commit Types**: feat, fix, refactor, chore, docs, test, style
- **Component Architecture**: Server Components by default, Client Components when interactivity is needed
- **State Management**: useReducer for complex state, useState for simple state
- **Data Fetching**: Server Components for GET requests, Server Actions for mutations
- **Styling**: Tailwind CSS with custom design system
- **Testing**: Jest for unit and integration tests

## Contributing

Please read our contributing guidelines and ensure all commits follow the conventional commit format for automatic changelog generation.
