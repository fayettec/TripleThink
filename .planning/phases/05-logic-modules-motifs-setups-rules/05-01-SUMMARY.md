---
phase: 05-logic-modules-motifs-setups-rules
plan: 01
subsystem: database
tags: [motif-instances, setup-payoffs, pattern-tracking, chekhov-gun, better-sqlite3, event-sourcing]

# Dependency graph
requires:
  - phase: 02-logic-layer-schema
    provides: MOTIF_INSTANCES and SETUP_PAYOFFS tables with type/status validation
provides:
  - motif-instances.js module with 6 exported functions for recurring pattern tracking
  - setup-payoffs.js module with 7 exported functions including Chekhov's gun tracker
  - Support for 5 motif types (visual, dialogue, situational, symbolic, musical)
  - Support for 4 setup statuses (planted, referenced, fired, unfired)
affects: [05-logic-layer-modules, 07-logic-layer-api, orchestrator, gui-pattern-tracking]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module factory pattern (function takes db, returns object with methods)"
    - "Type and status enum validation with descriptive error messages"
    - "Dynamic SQL UPDATE with validated fields whitelist"
    - "Self-test pattern for database modules (run directly to test)"
    - "Specialized query functions (getUnfiredSetups for Chekhov's gun tracking)"

key-files:
  created: [db/modules/motif-instances.js, db/modules/setup-payoffs.js]
  modified: []

key-decisions:
  - "motif-instances.js exports 6 functions: createMotifInstance, getMotifInstancesByProject, getMotifInstancesByType, getMotifInstanceById, updateMotifInstance, deleteMotifInstance"
  - "setup-payoffs.js exports 7 functions including specialized getUnfiredSetups and fireSetup helper"
  - "getUnfiredSetups returns setups with status 'planted' or 'referenced' (Chekhov's gun tracker)"
  - "fireSetup helper simplifies marking setups as paid off with single function call"

patterns-established:
  - "JSDoc comments document parameters and return types for all exported functions"
  - "Validation logic mirrors database CHECK constraints for early error detection"
  - "Self-test creates in-memory database with comprehensive assertions (10+ per module)"
  - "Specialized query functions for common use cases (getMotifInstancesByType, getUnfiredSetups)"
  - "Helper functions for complex operations (fireSetup atomically updates status, payoff_event_id, fired_chapter)"

# Metrics
duration: 2min
completed: 2026-01-16
---

# Phase 05 Plan 01: Motif Instances & Setup Payoffs Modules Summary

**Complete motif-instances.js and setup-payoffs.js modules enabling recurring pattern tracking and Chekhov's gun management with specialized queries**

## Performance

- **Duration:** 2 min 3 sec
- **Started:** 2026-01-16 (epoch: 1768591398)
- **Completed:** 2026-01-16 (epoch: 1768591521)
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Implemented 6 CRUD functions for motif instance management with type validation
- Implemented 7 functions for setup/payoff tracking including specialized queries
- Created getUnfiredSetups function for Chekhov's gun tracking (returns planted/referenced setups)
- Created fireSetup helper for atomically marking setups as paid off
- Comprehensive self-tests with 10+ assertions per module
- Validated 5 motif types (visual, dialogue, situational, symbolic, musical)
- Validated 4 setup statuses (planted, referenced, fired, unfired)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create motif-instances.js module** - `4304b13` (feat)
2. **Task 2: Create setup-payoffs.js module** - `5dd08c3` (feat)

## Files Created/Modified

- `db/modules/motif-instances.js` - Motif instances database module with:
  - **createMotifInstance** - Creates motif with type validation (5 types)
  - **getMotifInstancesByProject** - Retrieves all motifs for a project
  - **getMotifInstancesByType** - Filters motifs by type for pattern analysis
  - **getMotifInstanceById** - Single motif retrieval by UUID
  - **updateMotifInstance** - Dynamic field updates (description, significance, linked_entity_id)
  - **deleteMotifInstance** - Motif deletion with success indicator

- `db/modules/setup-payoffs.js` - Setup/payoff database module with:
  - **createSetupPayoff** - Creates setup with status validation, defaults to 'planted'
  - **getSetupPayoffsByProject** - Retrieves all setups for a project
  - **getSetupPayoffById** - Single setup retrieval by UUID
  - **updateSetupPayoff** - Dynamic field updates (description, status, payoff_event_id, fired_chapter)
  - **deleteSetupPayoff** - Setup deletion with success indicator
  - **getUnfiredSetups** - Chekhov's gun tracker (returns planted/referenced setups)
  - **fireSetup** - Helper to mark setup as fired with payoff event and chapter

## Decisions Made

**1. getUnfiredSetups specialized query**
- Rationale: Chekhov's gun principle requires tracking planted setups that haven't fired yet. Query filters for status IN ('planted', 'referenced') to identify narrative promises that still need payoff. Essential for story consistency validation.

**2. fireSetup helper function**
- Rationale: Marking a setup as fired requires updating 3 fields atomically (status, payoff_event_id, fired_chapter). Helper function simplifies common operation and ensures all fields are set correctly together.

**3. getMotifInstancesByType specialized query**
- Rationale: Authors often want to review all instances of a specific motif type (e.g., all visual motifs for visual consistency). Specialized query prevents N+1 query patterns in GUI.

**4. Setup status defaults to 'planted' on creation**
- Rationale: Most setups start as planted (gun on mantelpiece). Authors can override if setup is immediately referenced or already fired.

## Deviations from Plan

None - plan executed exactly as written. Both modules follow established patterns from Phases 3-4, all functions implemented per specification, type/status validation working as designed, self-tests passing all assertions.

## Issues Encountered

None - both modules implemented, tested, and verified successfully on first pass. Followed established patterns from prior logic layer modules (story-conflicts.js, thematic-elements.js).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 5 Plan 2 (World Rules Module):**
- Motif and setup/payoff module patterns consistent with prior logic modules
- Self-test pattern validated and reusable
- Modules ready for Phase 6 integration and Phase 7 API exposure

**Ready for API integration (Phase 7):**
- Motif module exports all functions needed for pattern tracking endpoints
- Setup module exports all functions needed for Chekhov's gun management endpoints
- getUnfiredSetups provides ready-made "unfired setups" validation endpoint
- Type/status validation prevents invalid data

**Ready for GUI integration:**
- getMotifInstancesByProject supports project-level motif visualization
- getMotifInstancesByType enables type-filtered pattern analysis views
- getUnfiredSetups powers "Chekhov's Gun Dashboard" showing unfired promises
- fireSetup provides one-click "mark as paid off" action for GUI
- Setup status progression (planted → referenced → fired) maps to UI visual indicators

**Blockers/Concerns:**
- None. Both modules are self-contained and ready for use.

---
*Phase: 05-logic-modules-motifs-setups-rules*
*Completed: 2026-01-16*
