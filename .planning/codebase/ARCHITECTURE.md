# Architecture

**Analysis Date:** 2026-01-16

## Pattern Overview

**Overall:** Event-Sourced REST API with Client-Side Rendered GUI

**Key Characteristics:**
- Event sourcing with immutable event log as single source of truth
- Hybrid state reconstruction (snapshots + deltas for performance)
- Epistemic tracking for character knowledge states across timeline
- Three-layer separation: Database (SQLite), API (Express), GUI (Vanilla JS SPA)
- ID-based referencing with no data duplication

## Layers

**Database Layer:**
- Purpose: Persistent storage with event sourcing and epistemic tracking
- Location: `/app/db/`
- Contains: SQLite interface modules, business logic for state reconstruction, migrations
- Depends on: `better-sqlite3`, SQLite database file
- Used by: API routes via `api-functions.js` facade
- Key abstraction: `TripleThinkDB` class (`/app/db/api-functions.js`) provides unified interface to all database operations

**API Layer:**
- Purpose: HTTP REST interface exposing database operations
- Location: `/app/api/`
- Contains: Express server, route handlers, middleware (auth, cache, rate-limit), error handling
- Depends on: Database layer, Express framework
- Used by: GUI layer, AI agents (future MCP integration)
- Key abstraction: Route-per-domain pattern (entities, metadata, epistemic, temporal, narrative, logic-layer)

**GUI Layer:**
- Purpose: Interactive web interface for narrative construction
- Location: `/app/gui/`
- Contains: HTML/CSS/JS SPA with component-based architecture
- Depends on: API layer via `api-client.js`
- Used by: End users (authors)
- Key abstraction: Screen-based routing with reusable components

**Logic Layer (v4.1):**
- Purpose: Story structure tracking (causality, arcs, conflicts, themes, motifs, setup/payoffs, world rules)
- Location: `/app/db/` (causality-chains.js, character-arcs.js, story-conflicts.js, thematic-elements.js, motif-instances.js, setup-payoffs.js, world-rules.js)
- Contains: Business logic modules for narrative structure analysis
- Depends on: Database layer
- Used by: API routes (`/app/api/routes/logic-layer.js`), future orchestrator

## Data Flow

**Entity Creation Flow:**

1. User interacts with GUI component (`/app/gui/js/components/entity-editor.js`)
2. Component calls API client (`/app/gui/js/api-client.js`)
3. API client sends HTTP POST to `/api/entities`
4. Express route handler (`/app/api/routes/entities.js`) validates request
5. Route calls database layer (`db.createEntity()` in `/app/db/api-functions.js`)
6. Database layer writes to SQLite (`entities` table)
7. Response bubbles back through layers to GUI
8. GUI updates state (`/app/gui/js/state.js`) and re-renders

**Epistemic Query Flow:**

1. User requests character knowledge state at timestamp
2. GUI calls `/api/epistemic/:characterId/knowledge?at_timestamp=X`
3. Route handler (`/app/api/routes/epistemic.js`) checks cache middleware
4. Database layer queries `knowledge_states` and `knowledge_state_facts` tables
5. Joins with `facts` table to reconstruct what character knows/believes
6. Response cached for 1 minute (LRU cache in `/app/api/middleware/cache.js`)
7. GUI visualizes knowledge graph

**State Reconstruction Flow (v4.1 Hybrid):**

1. Query for entity state at specific event: `getAssetStateAtEvent(assetId, eventId)`
2. StateReconstruction module (`/app/db/state-reconstruction.js`) checks LRU cache
3. If cache miss, finds nearest prior snapshot from `asset_state_snapshots` table
4. Retrieves delta chain from snapshot to target event from `asset_state_deltas` table
5. Applies deltas sequentially to snapshot state
6. Caches reconstructed state
7. Returns complete state object

**State Management:**
- GUI uses simple pub/sub state manager (`/app/gui/js/state.js`)
- API layer is stateless (RESTful)
- Database maintains event log and computed snapshots/deltas

## Key Abstractions

**Entity (Polymorphic):**
- Purpose: Unified storage for all narrative elements (events, characters, objects, locations, systems)
- Examples: `/app/db/schema.sql` line 50 (`entities` table)
- Pattern: Single table with `entity_type` discriminator and `data` JSON column for type-specific fields
- References: ID format indicates type: `evt-*`, `char-*`, `obj-*`, `loc-*`, `sys-*`

**Metadata (Separated):**
- Purpose: Token-efficient storage of author notes, AI guidance, consistency rules
- Examples: `/app/db/schema.sql` line 29 (`metadata` table)
- Pattern: Optional 1:1 relationship with entities via `meta_id` foreign key
- Loading: Conditional based on `read_metadata_mandatory` flag or explicit `includeMetadata` parameter

**Event Phase:**
- Purpose: Multi-phase event structure for complex actions
- Examples: `/app/db/schema.sql` line 70 (`event_phases` table)
- Pattern: 1:N relationship with events, sequential ordering, participant tracking
- Used for: State changes, fact creation, knowledge state updates

**Fact:**
- Purpose: Ground truth statements created by events
- Examples: `/app/db/schema.sql` line 86 (`facts` table)
- Pattern: Immutable, linked to creating event phase, visibility scoping
- Epistemic tracking: `knowledge_state_facts` maps character beliefs about facts

**Fiction:**
- Purpose: False narrative systems with target audiences
- Examples: `/app/db/schema.sql` line 172 (`fictions` table)
- Pattern: Links to `entities` table, tracks contradicted facts, audience membership, exposure triggers
- Unique feature: TripleThink's signature capability for modeling lies and conspiracies

**Snapshot + Delta (Hybrid State):**
- Purpose: Balance between pure event sourcing (slow queries) and pure snapshots (storage explosion)
- Examples: `/app/db/state-snapshots.js`, `/app/db/state-deltas.js`
- Pattern: Snapshots at anchor points (chapter starts, major events, every N events), deltas between snapshots
- Reconstruction: Find nearest snapshot + apply delta chain

## Entry Points

**API Server:**
- Location: `/app/api/server.js`
- Triggers: `node api/server.js` or `npm start` (from `/app/api/`)
- Responsibilities: Initialize Express app, connect to database, register routes/middleware, start HTTP server on port 3000

**GUI Server:**
- Location: `/app/gui/index.html`
- Triggers: Static file serving via `serve -s /app/gui -l 8080` or Express static middleware
- Responsibilities: Load SPA shell, initialize router, connect to API

**Database Initialization:**
- Location: `/app/db/init-database.js`
- Triggers: `node db/init-database.js` (called by `/app/start.sh` if DB doesn't exist)
- Responsibilities: Create SQLite database, run schema.sql, apply migrations

**Start Script:**
- Location: `/app/start.sh`
- Triggers: `./start.sh` (primary entry point)
- Responsibilities: Validate environment, initialize database if needed, start API server (port 3000), start GUI server (port 8080)

**GUI Router:**
- Location: `/app/gui/js/router.js`
- Triggers: `hashchange` event, initial page load
- Responsibilities: Parse URL hash, load appropriate screen component, update navigation state

## Error Handling

**Strategy:** Centralized error handling with custom error classes and Express middleware

**Patterns:**
- Custom error classes in `/app/api/error-handling.js`: `NotFoundError`, `ValidationError`, `ConflictError`
- `asyncHandler` wrapper catches async route errors and passes to error middleware
- Global error handler (`errorHandler` middleware) formats errors as JSON with error codes, messages, timestamps
- Validation errors include field-specific suggestions
- Database errors caught and wrapped with context

## Cross-Cutting Concerns

**Logging:** Console logging with timestamps and request duration tracking (middleware in `/app/api/server.js` lines 93-104)

**Validation:**
- API layer: Custom validators in `/app/api/error-handling.js` (`validateRequired`, `validateId`, `validateTimestamp`, `validateEntityType`)
- Database layer: SQL CHECK constraints and foreign keys (`PRAGMA foreign_keys = ON`)
- Route layer: `/app/api/routes/validation.js` provides comprehensive validation endpoints

**Authentication:** Optional API key authentication via `/app/api/middleware/auth.js` (disabled by default for local use, enabled via `TRIPLETHINK_AUTH_ENABLED=true` env var)

**Caching:** LRU caching middleware in `/app/api/middleware/cache.js` with separate caches for entities (5min TTL), metadata (10min TTL), epistemic queries (1min TTL), search (30sec TTL)

**Rate Limiting:** Token bucket rate limiting in `/app/api/middleware/rate-limit.js` with tiered limits (standard: 100 req/min, strict: 20 req/min, relaxed: 500 req/min)

---

*Architecture analysis: 2026-01-16*
