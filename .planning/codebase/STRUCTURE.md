# Codebase Structure

**Analysis Date:** 2026-01-16

## Directory Layout

```
/app/
├── api/                # API layer (Express server)
├── db/                 # Database layer (SQLite + business logic)
├── gui/                # GUI layer (SPA)
├── schema/             # Schema documentation
├── tests/              # Integration and performance tests
├── .planning/          # GSD planning artifacts
├── start.sh            # Primary entry point
├── package.json        # Root dependencies
└── triplethink.db      # SQLite database file
```

## Directory Purposes

**`/app/api/`:**
- Purpose: REST API server implementation
- Contains: Express routes, middleware, server configuration, error handling
- Key files:
  - `server.js`: Main entry point, route registration, middleware chain
  - `error-handling.js`: Custom error classes, validators, error middleware
  - `ai-query-layer.js`: AI-optimized query interface (future MCP integration)
  - `api-spec.yaml`: OpenAPI specification

**`/app/api/routes/`:**
- Purpose: Route handlers organized by domain
- Contains: Express routers for each API endpoint group
- Key files:
  - `entities.js`: Entity CRUD (events, characters, objects, locations, systems)
  - `metadata.js`: Metadata CRUD
  - `epistemic.js`: Knowledge state queries
  - `temporal.js`: Time-travel queries
  - `narrative.js`: Narrative structure (books, acts, chapters, scenes)
  - `fictions.js`: Fiction CRUD (unique to TripleThink)
  - `validation.js`: Validation rules and checks
  - `logic-layer.js`: Story structure tracking (causality, arcs, conflicts, themes, motifs, setup/payoffs, world rules)
  - `search.js`: Search and discovery
  - `export-import.js`: Data export/import
  - `projects.js`: Project (series) CRUD
  - `ai.js`: AI-optimized endpoints

**`/app/api/middleware/`:**
- Purpose: Reusable Express middleware
- Contains: Authentication, caching, rate limiting
- Key files:
  - `auth.js`: Optional API key authentication
  - `cache.js`: LRU caching with separate caches per domain
  - `rate-limit.js`: Token bucket rate limiting

**`/app/db/`:**
- Purpose: Database access layer and business logic
- Contains: SQLite interface, query modules, migrations
- Key files:
  - `api-functions.js`: Main database facade (TripleThinkDB class)
  - `schema.sql`: Complete database schema (16 tables)
  - `init-database.js`: Database initialization script
  - `indexes.sql`: Performance indexes
  - `validation-triggers.sql`: SQL-level validation triggers
  - `backup.js`: Database backup utilities
  - `state-snapshots.js`: Snapshot CRUD for hybrid state system
  - `state-deltas.js`: Delta computation and application
  - `state-reconstruction.js`: State reconstruction engine
  - `causality-chains.js`: Causality tracking
  - `character-arcs.js`: Character arc tracking
  - `story-conflicts.js`: Story conflict tracking
  - `thematic-elements.js`: Theme tracking
  - `motif-instances.js`: Motif tracking
  - `setup-payoffs.js`: Setup/payoff tracking
  - `world-rules.js`: World consistency rules

**`/app/db/migrations/`:**
- Purpose: Database schema migrations
- Contains: Migration scripts with version tracking
- Pattern: Numbered migrations with forward/rollback SQL

**`/app/gui/`:**
- Purpose: Single-page web application
- Contains: HTML, CSS, JavaScript, assets
- Key files:
  - `index.html`: SPA shell, loads all scripts and styles
  - `api-client.js`: API communication layer
  - `app.js`: Main application entry point
  - `router.js`: Client-side routing (hash-based)
  - `state.js`: Simple pub/sub state manager

**`/app/gui/js/components/`:**
- Purpose: Reusable UI components
- Contains: Component modules for common UI patterns
- Key files:
  - `entity-editor.js`: Entity creation/editing modal
  - `entity-list.js`: Entity list rendering
  - `metadata-modal.js`: Metadata editor
  - `knowledge-editor.js`: Epistemic state editor
  - `fiction-manager.js`: Fiction CRUD interface
  - `validation-panel.js`: Validation results display
  - `narrative-tree.js`: Narrative structure tree view
  - `scene-editor.js`: Scene creation/editing
  - `event-mapper.js`: Event relationship mapper
  - `timeline-viz.js`: Timeline visualization
  - `epistemic-graph.js`: Knowledge graph visualization
  - `quick-search.js`: Quick search modal

**`/app/gui/js/screens/`:**
- Purpose: Top-level screen components (one per route)
- Contains: Screen modules registered with router
- Key files:
  - `dashboard.js`: Overview screen with stats
  - `entities.js`: Entity browsing and filtering
  - `timeline.js`: Timeline view
  - `narrative.js`: Narrative structure management
  - `epistemic.js`: Epistemic graph visualization
  - `projects.js`: Project management

**`/app/gui/js/utils/`:**
- Purpose: Utility functions
- Contains: Formatters, validators, toast notifications, keyboard shortcuts
- Pattern: Pure functions, no side effects

**`/app/gui/styles/`:**
- Purpose: CSS stylesheets
- Contains: Design system, layout, component styles
- Key files:
  - `design-system.css`: Color palette, typography, spacing tokens
  - `layout.css`: Grid, flexbox, responsive layout
  - `components.css`: Component-specific styles
  - `screens.css`: Screen-specific styles
  - `visualizations.css`: D3/Vis.js visualization styles

**`/app/gui/assets/`:**
- Purpose: Static assets
- Contains: Fonts, icons
- Subdirectories: `fonts/`, `icons/`

**`/app/gui/lib/`:**
- Purpose: External JavaScript libraries
- Contains: Vendored dependencies (D3, Vis.js)
- Pattern: Local copies to avoid CDN dependencies

**`/app/schema/`:**
- Purpose: Schema documentation and validation rules
- Contains: Schema documentation, validation rules, update scripts
- Key files:
  - `validation-rules.md`: Comprehensive validation rules

**`/app/tests/`:**
- Purpose: Test suite
- Contains: Integration tests, performance tests, benchmarks
- Key files:
  - `validator.test.js`: Validation tests
  - `phase5-api-integration.test.js`: API integration tests
  - `hybrid-state-test.js`: State reconstruction tests
  - `logic-layer-test.js`: Story structure tests
  - `benchmark.js`: Performance benchmarks

**`/app/.planning/`:**
- Purpose: GSD planning artifacts
- Contains: Codebase analysis documents
- Subdirectories: `codebase/` (this document)

**`/app/TripleThink/`:**
- Purpose: Appears to be experimental or backup copy
- Contains: Duplicate structure
- Note: Not part of primary codebase, may be vestigial

## Key File Locations

**Entry Points:**
- `/app/start.sh`: Primary launch script (starts API + GUI)
- `/app/api/server.js`: API server entry point
- `/app/gui/index.html`: GUI entry point
- `/app/db/init-database.js`: Database initialization

**Configuration:**
- `/app/package.json`: Root dependencies and scripts
- `/app/api/package.json`: API dependencies
- `/app/api/server.js` (lines 43-53): Server configuration (port, DB path, CORS)
- Environment variables: `PORT`, `DB_PATH`, `CORS_ORIGIN`, `TRIPLETHINK_AUTH_ENABLED`, `TRIPLETHINK_API_KEY`

**Core Logic:**
- `/app/db/api-functions.js`: Main database interface (590+ lines)
- `/app/db/schema.sql`: Complete database schema
- `/app/api/error-handling.js`: Error handling and validation
- `/app/gui/js/api-client.js`: API communication

**Testing:**
- `/app/tests/`: All test files
- Run with: `npm test` from `/app/`

## Naming Conventions

**Files:**
- `kebab-case.js`: JavaScript modules (`state-reconstruction.js`, `api-client.js`)
- `kebab-case.sql`: SQL files (`schema.sql`, `indexes.sql`)
- `kebab-case.css`: Stylesheets (`design-system.css`)
- `kebab-case.md`: Documentation (`validation-rules.md`)
- `UPPERCASE.md`: Important docs (`README.md`, `IMPLEMENTATION_BRIEF_v4.1.md`)

**Directories:**
- `lowercase`: Single-word directories (`api`, `db`, `gui`, `tests`, `schema`)
- `kebab-case`: Multi-word directories (none currently)

**IDs:**
- `{type}-{identifier}`: Prefixed IDs (`evt-001`, `char-alice`, `obj-sword`, `loc-castle`, `sys-magic`, `fact-123`, `phase-001`)
- `{type}-{number}`: Structured IDs for narrative (`book-1`, `act-1-2`, `ch-1-2-3`, `scene-001`)
- UUIDs: Used in v4.1 tables (`snapshot_uuid`, `delta_uuid`)

**Functions:**
- `camelCase`: JavaScript functions (`createEntity`, `getStateAtEvent`)
- `snake_case`: SQL columns (`entity_type`, `created_at`)

**Classes:**
- `PascalCase`: JavaScript classes (`TripleThinkDB`, `StateReconstruction`)

**Constants:**
- `SCREAMING_SNAKE_CASE`: JavaScript constants (`CACHE_SIZE`, `DEFAULT_CONFIG`)
- `UPPERCASE`: Enums in SQL (`CHECK (status IN ('ACTIVE', 'COLLAPSED'))`)

## Where to Add New Code

**New Feature:**
- Primary code: Depends on layer
  - Database logic: `/app/db/{feature-name}.js` (module class pattern)
  - API endpoint: `/app/api/routes/{domain}.js` (add route to existing domain or create new router)
  - GUI component: `/app/gui/js/components/{feature-name}.js`
  - GUI screen: `/app/gui/js/screens/{feature-name}.js`
- Tests: `/app/tests/{feature-name}.test.js`

**New Component/Module:**
- Implementation:
  - Database module: `/app/db/{module-name}.js` (export class, register in `api-functions.js`)
  - API route: `/app/api/routes/{route-name}.js` (export router, register in `server.js`)
  - GUI component: `/app/gui/js/components/{component-name}.js` (export functions, include in `index.html`)

**Utilities:**
- Shared helpers:
  - API: `/app/api/error-handling.js` (validation functions) or new util file
  - GUI: `/app/gui/js/utils/{util-name}.js` (pure functions)
  - Database: Add to `/app/db/api-functions.js` or create new module

**New Database Table:**
1. Add to `/app/db/schema.sql`
2. Create migration in `/app/db/migrations/{version}-{name}.sql`
3. Create module in `/app/db/{table-name}.js` with CRUD operations
4. Register in `/app/db/api-functions.js`
5. Add API routes in `/app/api/routes/{domain}.js`
6. Update validation in `/app/api/routes/validation.js`

**New API Endpoint:**
1. Add route handler to `/app/api/routes/{domain}.js`
2. Register router in `/app/api/server.js` if new domain
3. Add validation rules
4. Update `/app/api/api-spec.yaml` (OpenAPI spec)

**New GUI Screen:**
1. Create screen module: `/app/gui/js/screens/{screen-name}.js`
2. Register route in screen module (router.register call at bottom of file)
3. Add navigation item to `/app/gui/index.html` sidebar
4. Include script tag in `/app/gui/index.html`

**New GUI Component:**
1. Create component module: `/app/gui/js/components/{component-name}.js`
2. Export functions (render, show, hide, etc.)
3. Include script tag in `/app/gui/index.html`
4. Use in screen modules

## Special Directories

**`/app/node_modules/`:**
- Purpose: Root dependencies
- Generated: Yes (by npm install)
- Committed: No (.gitignore)

**`/app/api/node_modules/`:**
- Purpose: API dependencies
- Generated: Yes (by npm install in /app/api)
- Committed: No (.gitignore)

**`/app/db/migrations/`:**
- Purpose: Database schema version tracking
- Generated: No (manually created)
- Committed: Yes
- Pattern: `{version}-{name}.sql` with forward and rollback SQL

**`/app/.git/`:**
- Purpose: Git repository
- Generated: Yes (by git init)
- Committed: No (internal git structure)

**`/app/TripleThink/`:**
- Purpose: Unclear (appears to be experimental copy or backup)
- Generated: Unknown
- Committed: No (not in .gitignore but appears untracked)
- Recommendation: Clarify purpose or remove

**`/tmp/`:**
- Purpose: Runtime logs (created by start.sh)
- Generated: Yes (by start.sh)
- Committed: No
- Files: `triplethink-api.log`, `triplethink-gui.log`

**`/app/.planning/codebase/`:**
- Purpose: Codebase analysis documents (GSD system)
- Generated: Yes (by /gsd:map-codebase)
- Committed: Yes (documentation)
- Files: `ARCHITECTURE.md`, `STRUCTURE.md`

---

*Structure analysis: 2026-01-16*
