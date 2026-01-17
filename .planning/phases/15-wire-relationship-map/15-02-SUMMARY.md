---
phase: 15-wire-relationship-map
plan: 02
subsystem: api
tags: [relationships, epistemic, database, api-client, gui]

# Dependency graph
requires:
  - phase: 12-gui-advanced-features
    provides: RelationshipMap component in GUI Characters screen
provides:
  - getAllRelationships() database function for querying all relationships in fiction
  - GET /api/epistemic/relationships endpoint with fiction_id query param
  - Corrected API client path from /api/relationships to /api/epistemic/relationships
affects: [gui-visualization, relationship-tracking, character-interactions]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Query endpoint pattern for all entities in fiction", "Temporal relationship queries with optional timestamp"]

key-files:
  created: []
  modified:
    - db/modules/relationships.js
    - api/routes/epistemic.js
    - gui/js/api-client.js

key-decisions:
  - "getAllRelationships() supports optional timestamp for temporal queries following existing relationship module patterns"
  - "Query endpoint placed before POST endpoint in routes for logical route ordering"
  - "Relationship deduplication by pair key when timestamp filter applied to get latest state"

patterns-established:
  - "Fiction-wide query functions in database modules follow pattern: getAllX(db, fictionId, timestamp = null)"
  - "API query endpoints require fiction_id parameter validation with 400 error"

# Metrics
duration: 2min
completed: 2026-01-17
---

# Phase 15 Plan 02: Wire Relationship Map Summary

**Fixed API endpoint mismatch - RelationshipMap now fetches all relationships via /api/epistemic/relationships with new getAllRelationships() database function**

## Performance

- **Duration:** 2 min (99 seconds)
- **Started:** 2026-01-17T18:50:58Z
- **Completed:** 2026-01-17T18:52:37Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Created getAllRelationships() function in relationships module for querying all relationships in a fiction
- Added GET /api/epistemic/relationships endpoint with fiction_id query parameter
- Fixed API client path mismatch from /api/relationships to /api/epistemic/relationships
- Established end-to-end flow: GUI → API client → API endpoint → database module

## Task Commits

Each task was committed atomically:

1. **Task 1: Add getAllRelationships() function to database module** - `11f8fb3` (feat)
2. **Task 2: Add GET /relationships query endpoint to API** - `295e9e9` (feat)
3. **Task 3: Fix API client path to use correct endpoint** - `d94f0db` (fix)

**Plan metadata:** (pending - committed after this summary)

## Files Created/Modified
- `db/modules/relationships.js` - Added getAllRelationships(db, fictionId, timestamp) function following temporal query pattern from getRelationshipsFor()
- `api/routes/epistemic.js` - Added GET /relationships endpoint before POST endpoint with fiction_id validation
- `gui/js/api-client.js` - Fixed getRelationships() to call /api/epistemic/relationships instead of /api/relationships

## Decisions Made

**getAllRelationships() temporal query behavior**
- When timestamp provided: returns latest state for each relationship pair (deduplicated by entity_a_id:entity_b_id:relationship_type key)
- When no timestamp: returns all relationship records ordered by created_at DESC
- Follows pattern established by getRelationshipsFor() for consistency

**Route ordering**
- Placed GET /relationships before POST /relationships for logical ordering (query before create)
- Maintains convention of listing read operations before write operations

**No NARRATIVE_DELTAS join needed**
- Relationships table has fiction_id directly, unlike epistemic facts which require join
- Simpler query improves performance for relationship visualization

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**RelationshipMap end-to-end flow complete:**
- GUI component wired and accessible (15-01)
- API client calls correct endpoint (15-02)
- API endpoint exists and handles fiction_id queries (15-02)
- Database function queries all relationships (15-02)

**Ready for:**
- Relationship data visualization in GUI
- User testing of Characters → Relationships tab
- Future relationship analysis features

**No blockers or concerns.**

---
*Phase: 15-wire-relationship-map*
*Completed: 2026-01-17*
