# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-16)

**Core value:** The orchestrator must assemble complete context packets for zero-knowledge scene generation
**Current focus:** Phase 11 — GUI Epistemic & Reader Knowledge

## Current Position

Phase: 11 of 14 (GUI Epistemic & Reader Knowledge)
Plan: 3 of 3 (Reader Knowledge Events UI)
Status: Phase complete
Last activity: 2026-01-17 — Completed 11-03-PLAN.md

Progress: ████████████░ 83% (29/35 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 29
- Average duration: 2.8 min
- Total execution time: 1.4 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 2 | 5 min | 2.5 min |
| 02 | 2 | 3 min | 1.5 min |
| 03 | 2 | 4 min | 2.0 min |
| 04 | 2 | 4 min | 2.0 min |
| 05 | 2 | 5 min | 2.5 min |
| 06 | 3 | 16 min | 5.3 min |
| 07 | 3 | 8 min | 2.7 min |
| 08 | 3 | 9 min | 3.0 min |
| 09 | 3 | 10 min | 3.3 min |
| 10 | 4 | 13 min | 3.3 min |
| 11 | 3 | 11 min | 3.7 min |

**Recent Trend:**
- Last 5 plans: 3min, 3min, 4min, 3min, 4min (avg: 3.4 min)
- Trend: Phase 11 complete - Timeline and characters screens enhanced with epistemic toggles and knowledge modals, velocity consistent

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Hybrid state architecture (v4.1) - Solves storage explosion while maintaining query speed
- Implement v4.1 completely, not selectively - AI handles complexity
- Logic Layer before API routes - Must build tables/modules before exposing functionality
- 14-phase comprehensive approach - Enables testing at each gate, minimal compression

**Phase 1 decisions:**
- Defer FOREIGN KEY constraint on event_uuid until EVENTS table created in Phase 2 - Allows progressive schema building without circular dependencies
- Dual positioning system (sequence_index + timestamp_offset) - Supports both relative ordering and precise timing for different authoring workflows
- Server only listens when run directly (require.main === module) - Enables test imports without port conflicts
- Added supertest for API integration testing - Established standard tool for HTTP testing across project

**Phase 2 decisions:**
- CHECK constraints for enum validation - Enforces valid values at database level for type, status, category fields
- Deferred foreign key constraints to EVENTS table - Allows progressive schema building (causality_chains, setup_payoffs reference event_uuid)
- Causality strength as 1-10 integer - Quantifies relationship strength for filtering and prioritization
- Save the Cat 13-beat structure as enum - Provides specific vocabulary for character arc tracking
- World rules with enforcement_level (strict/flexible/guideline) - Distinguishes immutable physics from social guidelines
- Database file gitignored - Standard practice for generated artifacts, database created via migrations
- Transaction-based testing with ROLLBACK - Validates schema without polluting database with test data

**Phase 3 decisions:**
- Breadth-first search for traverseChain - BFS prevents infinite loops in cyclic causal graphs, level tracking enables depth-based filtering
- Default depth 3, max depth 10 for traversal - Balances insight vs performance, aligns with GUI requirement (50 nodes max)
- Graph structure with nodes and edges arrays - Standard graph representation compatible with D3.js and vis.js visualization libraries
- Validation throws errors before database interaction - Early failure with clear messages reduces database load from invalid inputs
- Dynamic UPDATE with allowed fields whitelist - Prevents modification of immutable fields (chain_uuid, project_id, event IDs)
- advancePhase helper simplifies sequential progression while updateArc allows non-linear changes - GUI convenience without restricting authorial flexibility
- Nullable arc fields (archetype, lie/truth, want/need) allow incremental arc definition - Authors can create placeholder arcs that get filled in during story development
- Phase validation at both creation and update ensures data integrity - Catches invalid phases early at entry points

**Phase 4 decisions:**
- transitionConflictStatus supports non-linear transitions - Unlike character arcs, conflicts can jump between statuses (latent → climactic, active → resolved) for flexible storytelling
- Conflict status defaults to 'latent' - Most conflicts start in background before surfacing, authors can override if conflict is immediately active
- Protagonist_id immutable after creation - Conflicts fundamentally tied to protagonist, if protagonist changes it's a different conflict
- Manifestations stored as JSON TEXT in database - SQLite has no native JSON type, TEXT with JSON.stringify/parse provides flexible array storage
- Empty/null manifestations always return empty array - Consistent API for GUI, always receives array without null checking
- Helper functions (addManifestation/removeManifestation) reuse CRUD operations - DRY principle, internally call getThemeById and updateTheme

**Phase 5 decisions:**
- getUnfiredSetups specialized query for Chekhov's gun tracking - Filters for status IN ('planted', 'referenced') to identify narrative promises needing payoff
- fireSetup helper function for atomic updates - Marks setup as fired while setting payoff_event_id and fired_chapter in single operation
- getMotifInstancesByType specialized query - Prevents N+1 query patterns for type-filtered pattern analysis in GUI
- Setup status defaults to 'planted' - Most setups start as planted (gun on mantelpiece), authors can override if immediately referenced or fired
- rule_category is immutable - A rule's category is fundamental (physics rule can't become magic rule), to change requires delete+create
- Default enforcement_level is 'strict' - Defaulting to strictest enforcement is safest, prevents accidental rule violations
- Three-tier enforcement model: strict (immutable physics), flexible (social norms with exceptions), guideline (soft suggestions) - Different rule types need different rigidity levels
- Exceptions field is optional TEXT - Allows NULL for rules without exceptions, stores documented edge cases as free text

**Phase 6 decisions:**
- Factory function pattern for facade - createAPI(db) matches module pattern, enables independent instances per database
- CamelCase namespace exports - causalityChains, characterArcs, etc. match JavaScript conventions and prevent namespace collision
- Orchestrator creates API instance per helper function - Maintains functional purity, no need to thread API instance through signatures
- Empty array defaults for scene.activeConflictIds/activeThemeIds - Phase 7 will add these columns, graceful handling prevents errors now
- logicLayer section added to context packet alongside top-level paths - Maintains backward compatibility while providing organized namespace
- Character arcs queried by presentEntityIds - Arcs are character-specific, naturally indexed by character_id (no separate activeArcIds needed)
- Jest with beforeAll/afterAll for tests - Matches existing test infrastructure, cleaner than Mocha callbacks
- Load migration files directly in tests - No unified schema.sql, migrations provide granular control
- Test actual return types not assumptions - Modules have inconsistent returns (numbers vs objects vs wrapped booleans), tests match reality
- Separate unit and integration test files - Clear separation of CRUD tests vs cross-module queries, easier navigation

**Phase 7 decisions:**
- Enum validation at API layer - Return 400 with clear error messages listing valid values before module call, better developer experience
- Immutable field enforcement at API layer - Block updates to type, character_id, protagonist_id fields per REST conventions
- Helper endpoints for common workflows - POST /arcs/:id/advance and /conflicts/:id/transition reduce client complexity for sequential operations
- Stub routes for future implementation - Created minimal placeholder endpoints satisfying requirements without blocking progress
- Route organization by logical sections - Core Data, Temporal & State, Logic Layer, Utility sections improve maintainability

**Phase 8 decisions:**
- Vanilla JavaScript without build step - Matches project constraint for simplicity, no transpilation complexity
- Singleton API client pattern - Single instance exported for easy import, no need to pass around
- Generic request() method with error handling - Centralizes HTTP logic, consistent error handling across all 43 endpoints
- CSS custom properties for design tokens - Enable theme consistency, easier to maintain than hardcoded values
- camelCase method names (convert from snake_case API) - Follow JavaScript naming conventions, clearer separation between API and client
- Pub/sub pattern for state changes - Enables reactive UI without framework overhead, standard observer pattern
- Immutable getAll() returns copy - Prevents accidental state mutation from external code
- subscribe() returns unsubscribe function - Standard pattern for cleanup, prevents memory leaks
- Power drawer slides from right - Preserves screen space, familiar UX pattern (VS Code, browser DevTools)
- Layer switcher updates viewMode state - Enables future screens to react to layer changes without tight coupling
- Hash-based routing - Simple, no server configuration, works with script tag loading
- Global scope for components (no ES6 modules) - Removed ES6 imports to match vanilla JS approach with script tag loading
- Sidebar navigation pattern - Familiar UX, clear screen separation
- Screen objects with render() method - Consistent interface for router

**Phase 9 decisions:**
- D3.js v7 from CDN - Standard approach for client-side visualizations without build step, includes all needed modules
- Force-directed layout with configurable physics - Natural graph layout with repulsion/attraction forces, tuned for readability
- 50-node hard limit with truncation - Performance protection for large graphs, plan requirement for browser performance
- Depth slider updates state and re-fetches - Reactive pattern maintains consistency, API re-fetch ensures correct depth traversal
- Color-coded edges by relationship type - Four colors for visual distinction (red=direct-cause, blue=enabling-condition, purple=motivation, orange=psychological-trigger)
- Tab state tracked in global state.activeTab - Enables screen persistence and reactive updates across tab switches
- Arc progress calculated as (phaseIndex / 12) * 100 - Maps Save the Cat 13-beat structure to visual progress percentage
- Type and status badges use inline color styling - Component-controlled colors for dynamic type/status mapping without CSS explosion
- Empty states distinguish between no-project vs no-data - Provides actionable guidance based on actual blocker (select project vs create data)
- Card grid uses auto-fill with minmax(350px, 1fr) - Responsive layout adapts to viewport width without media queries
- SetupPayoffList fetches both all setups and unfired setups - Parallel fetching for efficient filtering, better than client-side filtering
- Unfired setups highlighted with orange background - Visual distinction makes unfired setups immediately noticeable for tracking narrative promises
- Causality tab uses first event as default - Prevents empty state on first load when no event selected in state
- Component render() methods return HTML strings - Consistent pattern across all card components for vanilla JS approach

**Phase 10 decisions:**
- HTML5 Drag and Drop API for native browser support - Zero dependencies, built-in visual feedback with dragstart/dragover/drop/dragend events
- Separate setupDragHandlers() after render - Event listeners can't be attached to HTML strings, only DOM elements
- Chapter grouping by scene.chapterId with 'unassigned' handling - Logical grouping for scenes without chapters, unassigned chapter not draggable
- Status badges inline color styling - Matches existing pattern from Phase 9 card components
- Event delegation for split/merge buttons - Cleaner than inline onclick handlers, easier testing, more maintainable
- Batch update endpoint for renumbering - Single API call instead of N individual calls reduces latency for renumbering operations
- Direct SQL queries in split/merge endpoints - scenes module filters by fictionId, chapters need chapterId-based queries
- Split creates timestamped chapter ID (ch-{timestamp}) - Simple unique ID generation without adding UUID library dependency
- Prompt-based rename/delete dialogs - Simple UX without modal complexity, good enough for MVP authoring tool
- Chapter delete shows scene count warning - Prevents accidental deletion of work by making consequences explicit
- Help text explains drag-and-drop and action icons - User guidance at point of use reduces confusion for non-obvious interactions
- Chapter rename returns limitation message - Chapters are ID-based logical groupings, not database entities with titles; endpoint explains limitation rather than failing
- Chapter delete removes all scenes - Following split/merge pattern, deletion cascades to all scenes with that chapter_id

**Phase 11 decisions:**
- Reader as epistemic entity - Use existing epistemic endpoints with reader-{fictionId} entity ID pattern instead of creating new dedicated reader-knowledge endpoints
- D3 force-directed layout for epistemic graph - Reused pattern from Phase 9 causality graph, natural visual clustering for knowledge states
- Color-coded nodes by knowledge category - Green (shared), blue (primary-only), purple (secondary-only), orange (false beliefs) enable instant visual distinction
- Comparison diff badges with click filtering - Interactive filtering via badge clicks provides user control over graph visibility, active badge highlighting shows current filter
- Three-level false belief visualization - Orange border on nodes + hover tooltip + click detail panel provides progressive disclosure of false belief information
- Empty state dictionary pattern - Centralized icon/message/hint mapping for multiple scenarios improves consistency across no-project/no-characters/no-data states
- Leverage cumulative knowledge queries - Single timestamp query returns all facts entity knows by that point, epistemic module handles cumulative logic
- Aggregate irony panel for all present characters - Scene editor checks dramatic irony for all characters in present_entity_ids array via parallel queries
- Scenes as timeline events - Use narrative_scenes table with narrative_time for chronological timeline display, scene entities serve as event representation
- Toggle-based overlays for epistemic/causality - Opt-in checkboxes reduce visual clutter, epistemic knowledge badges and causality arrows only shown when enabled
- Knowledge badges with click-to-expand - Display entity name and fact count, expand on click to show detailed fact list instead of always-expanded to save space
- False belief highlighting in orange - Visual distinction in knowledge modal for dramatic irony, truth indicator shows actual value alongside false belief

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-17T14:05:26Z
Stopped at: Completed 11-03-PLAN.md (Reader Knowledge Events UI) - Phase 11 complete
Resume file: None
