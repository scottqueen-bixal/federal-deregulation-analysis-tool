# Federal Deregulation Analysis Tool

A comprehensive Next.js application for analyzing federal regulations from the Electronic Code of Federal Regulations (eCFR), providing insights into regulatory complexity, historical changes, and cross-cutting analysis across government agencies.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose (for database)

### Quick Start

1. **Setup the project:**
```bash
npm install
```

2. **For development without ingestion:**
```bash
docker-compose up --build
```

3. **For full setup with data ingestion:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.build.yml up --build
```

**Alternative local setup:**

1. **Start the database:**
```bash
docker-compose up -d postgres
```

2. **Setup the database schema:**
```bash
npm run db:migrate
npm run db:generate
```

3. **Ingest data (optional - for testing with limited data):**
```bash
npm run ingest:test
```

4. **Start the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📊 Features

### Core Capabilities
- **Agency Analysis**: Comprehensive analysis of regulatory data by federal agency
- **Hierarchical Agency Support**: Aggregate analysis across parent agencies and their sub-agencies
- **Complexity Scoring**: Quantitative assessment of regulatory complexity with relative scoring
- **Cross-Cutting Analysis**: Identify regulatory overlap across multiple agencies with severity scoring
- **Content Integrity**: Checksum-based verification of regulatory content
- **Real-time Updates**: Dynamic loading states and responsive UI updates
- **Performance Optimization**: Caching, parallel data fetching, and efficient database queries

### Interactive Features
- **Agency Selector**: Combobox with search functionality for federal agencies
- **Sub-agency Aggregation**: Toggle to include/exclude sub-agency data in analysis
- **Tooltips**: Contextual information and definitions for all metrics
- **Cross-cutting Navigation**: Click-through navigation between related agencies
- **Loading States**: Comprehensive loading indicators with progress feedback

### API Endpoints
All endpoints support JSON responses with comprehensive error handling and caching.

#### Data Endpoints
- `GET /api/data/agencies` - List all agencies with hierarchical parent-child relationships
- `GET /api/data/titles?agencyId=[id]` - Get CFR titles filtered by agency

#### Analysis Endpoints
- `GET /api/analysis/word_count/agency/[agencyId]` - Word count aggregation with sub-agency support
- `GET /api/analysis/historical_changes/agency/[agencyId]` - Historical change analysis
- `GET /api/analysis/checksum/agency/[agencyId]` - Content integrity verification with timestamp tracking
- `GET /api/analysis/complexity_score/agency/[agencyId]` - Complexity scoring with relative percentile ranking
- `GET /api/analysis/complexity_score/max-cached` - Maximum complexity score (cached for performance)
- `GET /api/analysis/complexity_score/max-aggregated` - Aggregated maximum complexity calculation
- `GET /api/analysis/cross-cutting/` - Cross-cutting regulatory analysis with impact levels
- `GET /api/analysis/cross-cutting/agency/[agencyId]` - Agency-specific cross-cutting analysis with severity scoring

#### Debug Endpoints
- `GET /api/debug/aggregation-test` - Test aggregation functionality

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- **Next.js 15.5.2** - Full-stack React framework with App Router and SWC compilation
- **React 19.1.0** - Modern React with latest features and concurrent rendering
- **TypeScript 5** - Type safety across the full stack
- **Tailwind CSS 4** - Utility-first styling with modern PostCSS integration

**Backend:**
- **Next.js API Routes** - Serverless API endpoints with built-in optimization
- **Prisma 6.15.0** - Type-safe PostgreSQL ORM with auto-migrations and query optimization
- **PostgreSQL 15** - Primary database with JSONB and full-text search support
- **xml2js 0.6.2** - XML parsing for eCFR content processing

**Development & Testing:**
- **Jest 30** - Comprehensive testing framework with ES module support
- **ESLint 9** - Modern linting with Next.js configuration
- **TypeScript Strict Mode** - Enhanced type checking and safety
- **Docker** - Containerization for PostgreSQL and development environment

**Performance & Optimization:**
- **SWC Compiler** - Fast compilation replacing Babel for Next.js
- **React Suspense** - Granular loading states and streaming
- **Database Indexing** - Optimized queries with composite indexes
- **API Caching** - Intelligent caching strategies for performance

### Database Schema

**Core Tables:**
- `agencies` - Federal agencies with hierarchical parent-child relationships
- `titles` - CFR titles linked to agencies
- `versions` - Timestamped versions of title content with JSON structure and XML content
- `sections` - Individual regulation sections with computed word counts and checksums

**Key Features:**
- JSONB columns for flexible structure queries
- Composite indexes for performance
- Unique constraints for data integrity
- Computed columns for metrics

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with Next.js
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
npm run test              # Run all Jest tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate test coverage report
npm run test:health       # Run health check tests
npm run test:api          # Run API endpoint tests
npm run test:performance  # Run performance tests
npm run test:integration  # Run integration tests

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema changes to database

# Data Ingestion
npm run ingest       # Full data ingestion from eCFR APIs
npm run ingest:test  # Limited ingestion (2 agencies) for testing
npm run ingest:all   # Complete data ingestion (all agencies)
```

### Testing

The project includes comprehensive testing with Jest:

**Test Categories:**
- **Health Check Tests**: Environment and database connectivity verification
- **API Tests**: All endpoint functionality and error handling
- **Performance Tests**: Load testing and response time validation
- **Integration Tests**: End-to-end workflow testing

**Running Tests:**
```bash
# Run all tests
npm run test

# Run specific test categories
npm run test:health      # Basic health checks
npm run test:api         # API endpoint tests
npm run test:performance # Performance validation

# Development testing
npm run test:watch       # Watch mode for development
npm run test:coverage    # Generate coverage reports
```

**Test Configuration:**
- Jest with ES modules support
- TypeScript integration with ts-jest
- Babel fallback for JavaScript files
- 60-second timeout for API tests
- Coverage reporting with multiple formats

### Docker Usage

**For regular development (no ingestion):**
```bash
docker-compose up --build
```

**For full setup with data ingestion:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.build.yml up --build
```

**To rebuild containers without ingestion:**
```bash
docker-compose down
docker-compose up --build
```

The ingestion process is controlled by the `RUN_INGESTION` environment variable:
- Set to `false` (default) - skips data ingestion for faster startup
- Set to `true` (via docker-compose.build.yml) - runs full data ingestion

### Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── _analysis/               # Analysis page and components
│   │   ├── AnalysisClientWrapper.tsx  # Main client component with state management
│   │   ├── page.tsx             # Analysis page server component
│   │   └── loading.tsx          # Loading UI for analysis
│   ├── api/                     # API routes
│   │   ├── analysis/           # Analysis endpoints
│   │   │   ├── checksum/       # Content integrity verification
│   │   │   ├── complexity_score/ # Complexity scoring with caching
│   │   │   ├── cross-cutting/  # Cross-cutting analysis
│   │   │   ├── historical_changes/ # Change tracking
│   │   │   └── word_count/     # Word count aggregation
│   │   ├── data/               # Data endpoints
│   │   │   ├── agencies/       # Agency hierarchy data
│   │   │   └── titles/         # CFR titles data
│   │   └── debug/              # Debug and testing endpoints
│   ├── globals.css             # Global styles and Tailwind imports
│   ├── layout.tsx              # Root layout with fonts and metadata
│   ├── page.tsx                # Home page with server-side data fetching
│   ├── loading.tsx             # Global loading UI
│   ├── error.tsx               # Error boundary
│   └── global-error.tsx        # Global error handler
├── components/                  # Reusable React components
│   ├── AgencySelector.tsx      # Agency selection with aggregation toggle
│   ├── AgencyCombobox.tsx      # Searchable agency dropdown
│   ├── AnalysisHeader.tsx      # Page header component
│   ├── MetricCard.tsx          # Metric display with tooltips
│   ├── CrossCuttingAnalysis.tsx # Cross-cutting analysis display
│   ├── CFRTitlesList.tsx       # CFR titles listing with interaction
│   ├── Tooltip.tsx             # Tooltip wrapper component
│   ├── TooltipContent.tsx      # Tooltip content definitions
│   ├── ErrorBoundary.tsx       # Error boundary component
│   └── LoadingSpinner/         # Loading components and animations
│       ├── LoadingSpinner.tsx  # Main spinner component
│       ├── LoadingSpinner.module.css # Spinner styles
│       └── index.ts           # Component exports
├── lib/
│   └── prisma.ts              # Prisma client singleton
├── scripts/
│   ├── ingest.ts              # Data ingestion from eCFR APIs
│   └── cache-refresh.js       # Background cache refresh utility
├── __tests__/                 # Jest test suites
│   ├── setup.js              # Test configuration
│   ├── *.test.js             # Test files for each component/API
│   └── TEST_README.md        # Testing documentation
└── generated/                 # Generated Prisma client
    └── prisma/               # Type-safe database client
```

### Data Ingestion Process

The application integrates with eCFR APIs to fetch and process regulatory data:

**eCFR Integration:**
- `/api/admin/v1/agencies.json` - Agency metadata with hierarchy ✅
- `/api/versioner/v1/titles.json` - CFR title information ✅
- `/api/versioner/v1/structure/{date}/title-{title}.json` - Hierarchical structure ✅
- `/api/versioner/v1/full/{date}/title-{title}.xml` - Full XML content ✅

**Data Processing Pipeline:**
1. **Agency Discovery**: Fetch all federal agencies and build hierarchy
2. **Title Mapping**: Associate CFR titles with responsible agencies
3. **Content Extraction**: Parse XML structure and extract sections
4. **Metrics Calculation**: Compute word counts, checksums, and complexity scores
5. **Cross-cutting Analysis**: Identify regulatory overlap across agencies

**Performance Features:**
- Parallel processing of multiple agencies
- Incremental updates with change detection
- Checksum-based content verification
- Intelligent caching of computation-heavy operations

## 🚀 Key Features Deep Dive

### Cross-Cutting Analysis
The application provides sophisticated analysis of regulatory overlap:

- **Impact Levels**: HIGH (4+ agencies), MEDIUM (3 agencies), LOW (2 agencies)
- **Severity Scoring**: Algorithm considering impact distribution, agency diversity, and exclusivity ratios
- **Interactive Navigation**: Click-through between related agencies
- **Visual Indicators**: Color-coded severity levels and impact metrics

### Complexity Scoring
Quantitative assessment of regulatory complexity:

- **Multi-factor Analysis**: Word count, section depth, structural complexity
- **Relative Scoring**: Percentile ranking against all agencies
- **Aggregation Support**: Parent agency + sub-agencies combined analysis
- **Performance Optimization**: Cached maximum values for rapid comparison

### Agency Hierarchy
Comprehensive federal agency organization:

- **Parent-Child Relationships**: Departments and their sub-agencies
- **Aggregated Analysis**: Option to include/exclude sub-agency data
- **Search Functionality**: Fast agency lookup with fuzzy matching
- **Dynamic Loading**: Real-time data fetching with loading states

## 📈 Performance & Optimization

### Database Optimization
- **Composite Indexes**: Multi-column indexes for complex queries
- **JSONB Support**: Flexible structure storage with fast querying
- **Query Optimization**: Efficient joins and aggregations
- **Connection Pooling**: Prisma connection management

### Frontend Optimization
- **Server Components**: Leverage Next.js App Router for optimal performance
- **Client Boundaries**: Minimal 'use client' directive usage
- **Suspense**: Granular loading states with React Suspense
- **State Management**: Efficient useReducer for complex state
- **Parallel Fetching**: Concurrent API calls where possible

### Caching Strategy
- **API Response Caching**: Strategic caching of computation-heavy endpoints
- **React Query Patterns**: Client-side caching with automatic invalidation
- **Database Query Optimization**: Prepared statements and indexed lookups

## 🧪 Testing Strategy

### Comprehensive Test Coverage
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint and database interaction testing
- **Performance Tests**: Load testing and response time validation
- **Health Checks**: System connectivity and dependency verification

### Test Environment
- **Jest Configuration**: ES modules with TypeScript support
- **Database Testing**: Isolated test database for integration tests
- **API Testing**: Comprehensive endpoint coverage with error scenarios
- **Mock Strategies**: External API mocking for reliable testing

## 🔒 Security & Best Practices

### Security Features
- **Type Safety**: Full TypeScript coverage for runtime safety
- **Input Validation**: Server-side validation for all API inputs
- **Error Handling**: Comprehensive error boundaries and API error responses
- **Environment Security**: Proper environment variable management

### Development Best Practices
- **Code Organization**: Clear separation of concerns with modular architecture
- **Component Patterns**: Reusable components with proper props interfaces
- **State Management**: Predictable state updates with useReducer
- **Performance Monitoring**: Built-in performance tracking and optimization

## 📝 Contributing

### Development Setup
1. Clone repository and install dependencies
2. Set up local PostgreSQL with Docker
3. Run database migrations
4. Start development server
5. Run test suite to verify setup

### Code Standards
- **TypeScript**: Strict mode enabled for enhanced type safety
- **ESLint**: Next.js recommended configuration
- **Component Design**: Accessible, reusable components
- **Testing**: Comprehensive test coverage for new features
