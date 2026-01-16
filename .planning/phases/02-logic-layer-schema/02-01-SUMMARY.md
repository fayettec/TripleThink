---
phase: 02-logic-layer-schema
plan: 01
subsystem: database
tags: [sqlite, schema, event-sourcing, story-structure, causality, character-arcs, conflicts]

# Dependency graph
requires:
  - phase: 01-foundation-enhancement
    provides: Event moments table, migration infrastructure, event sourcing patterns
provides:
  - 7 logic layer tables for story structure tracking
  - Causality chains for cause-effect relationships
  - Character arc tracking with Save the Cat phases
  - Story conflict management with 5 types
  - Thematic elements and motif instances
  - Setup/payoff (Chekhov's gun) tracking
  - World rules for universe consistency
affects: [03-logic-layer-modules, 07-logic-layer-api, testing, orchestrator]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Logic layer tables following event sourcing (append-only)"
    - "Deferred foreign key constraints pattern (references not-yet-created tables)"
    - "CHECK constraints for enum-style validation at database level"

key-files:
  created: [db/migrations/006_logic_layer.sql]
  modified: []

key-decisions:
  - "All logic layer tables use TEXT PRIMARY KEY with {table}_uuid naming convention"
  - "CHECK constraints enforce valid enum values at database level (type, status, category fields)"
  - "Foreign key constraints to EVENTS table deferred until future phase when EVENTS created"
  - "Save the Cat beat structure encoded as 13 named phases in character_arcs.current_phase"
  - "Causality strength quantified as 1-10 integer for prioritization and analysis"
  - "Setup/payoffs track both planted and fired chapters for Chekhov's gun analysis"

patterns-established:
  - "Migration header comments explain table purpose and relationship to overall system"
  - "Each table section includes CREATE TABLE and associated CREATE INDEX statements"
  - "Inline comments document foreign key relationships even when constraints deferred"
  - "Migration footer notes explain event sourcing, deferred constraints, and future usage"

# Metrics
duration: 1min
completed: 2026-01-16
---

# Phase 2 Plan 1: Logic Layer Schema Summary

**7-table logic layer schema for story structure: causality chains, character arcs (Save the Cat), 5-type conflict system, themes, motifs, setup/payoffs, and world rules**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-16T16:00:40Z
- **Completed:** 2026-01-16T16:01:49Z
- **Tasks:** 3 (consolidated into single migration creation)
- **Files modified:** 1

## Accomplishments

- Created comprehensive 163-line migration defining all 7 logic layer tables
- Established 16 indexes for common query patterns (project_id, foreign keys, status fields)
- Encoded Save the Cat's 13-beat structure as character arc phases
- Implemented 5-type conflict system (internal, interpersonal, societal, environmental, supernatural)
- Validated SQL syntax with better-sqlite3, confirmed all tables and indexes created

## Task Commits

Each task was committed atomically:

1. **Tasks 1-3: Create logic layer migration with all 7 tables** - `6f5c73e` (feat)

**Note:** All three tasks were completed in a single integrated migration file, as they are interdependent table definitions for the same subsystem.

## Files Created/Modified

- `db/migrations/006_logic_layer.sql` - Complete logic layer schema with 7 tables:
  - **causality_chains** - Tracks cause-effect relationships with type (direct_cause, enabling_condition, motivation, psychological_trigger) and strength (1-10)
  - **character_arcs** - Character transformation tracking with Save the Cat phases, lie/truth, want/need
  - **story_conflicts** - Conflict management with 5 types, protagonist/antagonist, stakes, and status progression
  - **thematic_elements** - Theme statements, symbols, questions, and manifestations (JSON array)
  - **motif_instances** - Recurring patterns (visual, dialogue, situational, symbolic, musical)
  - **setup_payoffs** - Chekhov's gun tracking with planted/fired status and chapter references
  - **world_rules** - Universe consistency rules with categories and enforcement levels

## Decisions Made

**1. CHECK constraints for enum validation**
- Used CHECK constraints at database level for all enum-style fields (type, status, category, enforcement_level)
- Rationale: Early validation, prevents invalid data entry, self-documenting valid values

**2. Deferred foreign key constraints to EVENTS table**
- Causality chains and setup/payoffs reference event_uuid, but EVENTS table doesn't exist yet
- Pattern: Comment inline where FKs will be added, document in migration footer
- Rationale: Enables progressive schema building without circular dependencies (same pattern from Phase 1)

**3. Strength as 1-10 integer for causality chains**
- Quantifies relationship strength for prioritization, filtering, visualization
- Rationale: Simple scale enables "show me strong causal connections" queries

**4. Manifestations as TEXT (JSON array) in thematic_elements**
- Stores array of how theme appears throughout story
- Rationale: Flexible schema, avoids separate table for theme instances, easier to query all manifestations

**5. Save the Cat 13-beat structure as enum**
- Encoded Blake Snyder's beats as current_phase values
- Rationale: Widely recognized structure, provides specific vocabulary for arc tracking

**6. World rules with enforcement_level (strict, flexible, guideline)**
- Distinguishes immutable physics from social guidelines
- Rationale: Not all rules are equally enforced; enables "when can we break this?" analysis

## Deviations from Plan

None - plan executed exactly as written. All 7 tables implemented with specified columns per requirements LOGIC-01 through LOGIC-07.

## Issues Encountered

None - migration created and validated successfully on first attempt.

## User Setup Required

None - no external service configuration required. Migration will be executed in Plan 02-02.

## Next Phase Readiness

**Ready for Phase 2 Plan 2 (Execute Migration):**
- Migration file syntactically valid (verified with better-sqlite3)
- All 7 tables defined with proper PRIMARY KEYs, NOT NULL constraints, CHECK constraints
- 16 indexes ready for efficient querying
- Pattern matches existing migrations (005_event_moments.sql)

**Ready for Phase 3 (Logic Layer Modules):**
- Schema foundation established for module implementation
- Table structures support planned module functions (insert, query, analyze)

**Blockers/Concerns:**
- None. EVENTS table will be created in future phase; foreign key constraints documented for later addition.

---
*Phase: 02-logic-layer-schema*
*Completed: 2026-01-16*
