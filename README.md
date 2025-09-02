# Federal Deregulation Analysis Tool

A comprehensive tool for analyzing federal regulations from the Electronic Code of Federal Regulations (eCFR), providing insights into regulatory complexity, historical changes, and cross-cutting analysis across government agencies.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose

### Quick Start

1. **Clone and setup the project:**
```bash
git clone [repository-url]
cd federal-deregulation-analysis-tool
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
- **Complexity Scoring**: Quantitative assessment of regulatory complexity
- **Cross-Cutting Analysis**: Identify regulatory overlap across multiple agencies
- **Content Integrity**: Checksum-based verification of regulatory content

### API Endpoints
All endpoints support JSON responses with comprehensive error handling and caching.

#### Data Endpoints
- `GET /api/data/agencies` - List all agencies with hierarchical support
- `GET /api/data/titles?agencyId=[id]` - Get CFR titles filtered by agency

#### Analysis Endpoints
- `GET /api/analysis/word_count/agency/[agencyId]` - Word count aggregation
- `GET /api/analysis/historical_changes/agency/[agencyId]` - Change analysis
- `GET /api/analysis/checksum/agency/[agencyId]` - Content integrity verification
- `GET /api/analysis/complexity_score/agency/[agencyId]` - Complexity scoring
- `GET /api/analysis/complexity_score/max-cached` - Maximum complexity score (cached)
- `GET /api/analysis/cross-cutting/` - Cross-cutting regulatory analysis
- `GET /api/analysis/cross-cutting/agency/[agencyId]` - Agency-specific cross-cutting analysis

## 🏗️ Architecture

### Technology Stack

**Backend:**
- **Next.js 15.5.2** - Full-stack React framework with API routes and Turbopack
- **Prisma 6.15.0** - Type-safe PostgreSQL ORM with auto-migrations
- **PostgreSQL 15** - Primary database with jsonb and full-text search support
- **xml2js 0.6.2** - XML parsing for eCFR content processing

**Frontend:**
- **React 19.1.0** - Modern React with latest features
- **TypeScript 5** - Type safety across the full stack
- **Tailwind CSS 4** - Utility-first styling

**Infrastructure:**
- **Docker** - Containerization for PostgreSQL and application
- **Prisma Migrations** - Database schema version control

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
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema changes to database

# Data Ingestion
npm run ingest       # Full data ingestion from eCFR APIs
npm run ingest:test  # Limited ingestion (2 agencies) for testing
npm run ingest:all   # Complete data ingestion (all agencies)
```

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

### Data Ingestion Process

The application integrates with eCFR APIs to fetch and process regulatory data:

**eCFR Endpoints Used:**
- `/api/admin/v1/agencies.json` - Agency metadata ✅
- `/api/versioner/v1/titles.json` - CFR title information ✅
- `/api/versioner/v1/structure/{date}/title-{title}.json` - Hierarchical structure ✅
- `/api/versioner/v1/full/{date}/title-{title}.xml` - Full XML content ✅
