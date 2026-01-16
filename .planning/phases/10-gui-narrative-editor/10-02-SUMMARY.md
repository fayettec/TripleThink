---
phase: 10-gui-narrative-editor
plan: 02
subsystem: ui
tags: [vanilla-js, drag-drop, narrative-editor, scene-management, chapter-operations]

# Dependency graph
requires:
  - phase: 10-01
    provides: Narrative tree editor component with drag-and-drop foundation
provides:
  - Auto-renumbering of scenes after drag-and-drop operations
  - Split chapter operation (UI + API)
  - Merge chapter operation (UI + API)
  - Batch scene update endpoint
  - Comprehensive narrative tree CSS styling
affects: [10-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [event-delegation-for-buttons, batch-update-pattern, renumbering-after-mutations]

key-files:
  created: []
  modified:
    - gui/js/components/narrative-tree-editor.js
    - api/routes/orchestrator.js
    - gui/styles/components.css

key-decisions:
  - "Event delegation for split/merge buttons - cleaner than inline onclick handlers"
  - "Batch update endpoint for renumbering - single API call for multiple scene updates"
  - "Direct SQL queries in split/merge endpoints - scenes module uses fictionId filter, chapters need direct chapterId access"
  - "Split creates timestamped chapter ID (ch-{timestamp}) - simple unique ID generation without UUID library"

patterns-established:
  - "Renumbering pattern: After any chapter mutation (split/merge/move), call renumberScenes() to ensure sequential numbering"
  - "Button event delegation: Single click listener on tree container with data-action attributes for scalability"

# Metrics
duration: 4min
completed: 2026-01-16
---

# Phase 10 Plan 02: Narrative Tree Operations Summary

**Auto-renumbering, split chapter, and merge chapter operations complete with batch update API and comprehensive tree styling**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-16T22:45:21Z
- **Completed:** 2026-01-16T22:49:08Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Scenes automatically renumber after drag-and-drop operations
- Users can split chapters at any scene index (2+)
- Users can merge adjacent chapters with confirmation
- Batch scene update endpoint reduces API calls for renumbering
- Comprehensive CSS styling for narrative tree with drag feedback

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement auto-renumbering after drag-and-drop** - `57fa5c9` (feat)
2. **Task 2: Add split chapter operation UI and logic** - `77a5c60` (feat)
3. **Task 3: Add merge chapter operation UI and CSS styling** - `1eea593` (feat)

## Files Created/Modified
- `gui/js/components/narrative-tree-editor.js` - Added renumberScenes(), findChapterForScene(), findSceneIndex(), showSplitDialog(), splitChapter(), mergeWithNext() methods; updated reorderSceneToScene() and moveSceneToChapter() to trigger renumbering; added event delegation for button clicks; updated renderChapter() to include split/merge buttons
- `api/routes/orchestrator.js` - Added PATCH /scenes/batch endpoint for batch updates, POST /chapters/:chapterId/split endpoint, POST /chapters/merge endpoint
- `gui/styles/components.css` - Added comprehensive narrative tree editor styling (tree-chapter, chapter-header, tree-scene, drag-handle, dragging/drop-target states, button styling)

## Decisions Made

**Event delegation for split/merge buttons**
- Used single click listener with data-action attributes instead of inline onclick
- Rationale: Cleaner separation of concerns, easier testing, more maintainable

**Batch update endpoint for renumbering**
- Created PATCH /scenes/batch accepting array of {sceneId, sceneNumber, chapterId} updates
- Rationale: Single API call instead of N individual calls reduces latency for renumbering operations

**Direct SQL queries in split/merge endpoints**
- Used db.prepare() directly instead of scenes module methods
- Rationale: scenes module filters by fictionId, but split/merge need chapterId-based queries; direct SQL avoids filtering mismatch

**Split creates timestamped chapter ID**
- Format: `ch-{Date.now()}`
- Rationale: Simple unique ID generation without adding UUID library dependency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation proceeded smoothly.

## Next Phase Readiness

- Narrative tree operations complete (GUI-15, GUI-16, GUI-17)
- Ready for Plan 03: Scene detail editor and inline editing
- Split/merge operations functional, renumbering ensures data consistency
- CSS provides polished visual experience for drag-and-drop

---
*Phase: 10-gui-narrative-editor*
*Completed: 2026-01-16*
