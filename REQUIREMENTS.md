- **eCFR Endpoints to Use**:
  - `/api/admin/v1/agencies.json`: Fetches metadata on all agencies (e.g., names, IDs). Reasoning: Essential for grouping data by agency in analyses like word count or checksum, as titles/parts are associated with agencies.
  - `/api/versioner/v1/titles.json`: Provides summary info on all CFR titles (e.g., codes, names, associated agencies). Reasoning: Used to discover all titles and map them to agencies; serves as entry point to fetch per-title data without hardcoding.
  - `/api/versioner/v1/structure/{date}/title-{title}.json`: Returns hierarchical JSON structure for a title on a specific date (e.g., parts, subparts, sections). Reasoning: Captures organization of regulations; needed for parsing hierarchy, identifying changes over time (by comparing structures across dates), and linking to content for metrics.
  - `/api/versioner/v1/full/{date}/title-{title}.xml`: Downloads full XML content for a title on a date. Reasoning: Contains actual text for analysis (e.g., word count, checksum); XML format allows parsing sections/appendices for granular metrics. Fetch for multiple dates to enable historical comparisons.
  - `/api/admin/v1/corrections/title/{title}.json`: Gets corrections/changes for a title. Reasoning: Supplements historical analysis by providing explicit change logs (e.g., additions/deletions), reducing need to diff entire structures manually.

  Avoid search endpoints (e.g., `/api/search/v1/results`) as they focus on querying rather than bulk data download/structure. For current data, use latest available date (e.g., query titles.json for max date). For historical, iterate dates (e.g., daily/weekly back to a baseline, limited by storage).

- **Mapping to PostgreSQL Server-Side**:
  Use PostgreSQL with jsonb for flexible semi-structured data, full-text search extension for future queries, and computed columns/indexes for performance. Schema:
  - `agencies` table: `id` (serial PK), `name` (varchar), `description` (text), `slug` (varchar unique). Reasoning: Stores agency metadata from agencies.json; slug for URL-friendly IDs in APIs.
  - `titles` table: `id` (serial PK), `code` (varchar unique, e.g., '2'), `name` (varchar), `agency_id` (FK to agencies.id). Reasoning: From titles.json; links titles to agencies for per-agency aggregation.
  - `versions` table: `id` (serial PK), `title_id` (FK to titles.id), `date` (date unique with title_id), `structure_json` (jsonb), `content_xml` (text). Reasoning: Stores raw fetches per date; jsonb for querying structure (e.g., section counts via jsonb_path_query); XML as text for on-demand parsing to avoid upfront bloat.
  - `sections` table: `id` (serial PK), `version_id` (FK to versions.id), `identifier` (varchar, e.g., '1.100'), `label` (varchar), `text_content` (text), `word_count` (int, computed as length(regexp_replace(text_content, '\s+', ' ', 'g')) - length(replace(regexp_replace(text_content, '\s+', ' ', 'g'), ' ', '')) + 1), `checksum` (varchar, e.g., MD5 hash of text_content). Indexing: Composite on version_id + identifier; full-text on text_content. Reasoning: Parse XML on ingest to extract per-section text (using xml2js lib); precompute word_count/checksum for fast queries; enables granular historical diffs (e.g., compare text_content across versions).

  Ingest process: Node.js script (run via Next.js API or cron) fetches agencies/titles once, then loops titles to fetch structure/full for target dates, parses XML to populate sections. Use triggers for recomputing metrics on insert. Reasoning: Balances storage (raw for backup, parsed for speed) with query efficiency; historical via date filter on versions/sections.

- **API Endpoints to Create**:
  Use Next.js API routes (/api/*) for backend, with Prisma ORM for Postgres interaction (advantage: Type-safe queries, migrations; significant over raw SQL for dev speed/complex joins). Frontend UI in Next.js pages for analysis views (e.g., charts with Recharts lib for viz advantage).
  - `GET /api/data/agencies`: Returns list of agencies. Reasoning: Basic retrieval for UI dropdowns.
  - `GET /api/data/titles?agencyId=[id]`: Filtered titles per agency. Reasoning: Supports agency-focused UI navigation.
  - `GET /api/analysis/word_count/agency/[agencyId]?date=[yyyy-mm-dd]`: Sums word_count from sections for titles under agency on date (query joins titles/versions/sections). Reasoning: Direct response to task; aggregates for overview (e.g., regulatory burden).
  - `GET /api/analysis/historical_changes/agency/[agencyId]?from=[date]&to=[date]`: Returns changes (e.g., added/removed sections, word count delta) by diffing structures/sections between dates (use jsdiff lib for text diffs if needed; advantage: Accurate change detection). Reasoning: Task requires over-time changes; compute on fly or pre-store diffs in a `changes` table for perf.
  - `GET /api/analysis/checksum/agency/[agencyId]?date=[yyyy-mm-dd]`: Computes aggregate checksum (e.g., SHA-256 of concatenated section checksums, sorted by identifier). Reasoning: Verifies content integrity per agency/date; useful for auditing.
  - Custom metric: `GET /api/analysis/complexity_score/agency/[agencyId]?date=[yyyy-mm-dd]`: Score as (total sections + avg word_count per section) / hierarchy depth (from structure_json). Reasoning: Informs decision-making by quantifying regulation complexity (e.g., denser rules may need simplification); beyond basics, helps policymakers prioritize reviews.

  UI: Next.js pages like /analysis/[agencyId] with tabs for metrics, date pickers, charts. Fetch via APIs. Reasoning: Endpoints separate data/logic; UI consumes for interactive analysis.

- **Proposed JS Libraries**:
  - Prisma: For Postgres ORM (advantage: Schema-first, auto-migrations, safe queries vs. raw SQL errors).
  - xml2js: Parse XML to JSON (advantage: Handles eCFR XML structure efficiently during ingest).
  - crypto (Node built-in): For checksums (no extra lib needed).
  - diff (jsdiff): For historical text diffs (advantage: Precise change highlighting in UI/responses).
  - Recharts: For UI charts (advantage: Simple React integration for visualizing metrics over time).
