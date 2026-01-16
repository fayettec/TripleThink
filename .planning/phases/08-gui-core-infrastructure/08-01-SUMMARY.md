---
phase: 08-gui-core-infrastructure
plan: 01
subsystem: gui
tags: [vanilla-js, spa, api-client, rest, logic-layer]

# Dependency graph
requires:
  - phase: 07-api-layer
    provides: 43 REST endpoints for all 7 logic layer modules (causality, arcs, conflicts, themes, motifs, setups, rules)
provides:
  - GUI directory structure with component/screen/util organization
  - HTML5 SPA shell with script loading order
  - Complete API client with 43 methods for all logic layer endpoints
  - Design system with CSS variables for colors, spacing, typography
affects: [09-gui-components, 10-gui-screens, 11-visualization]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Vanilla JavaScript (no build step, no frameworks)
    - Singleton API client pattern with generic request method
    - CSS custom properties for design system tokens
    - Kebab-case file naming convention

key-files:
  created:
    - gui/index.html (SPA shell)
    - gui/js/api-client.js (API communication layer)
    - gui/package.json (serve configuration)
    - gui/styles/main.css (design system)
  modified: []

key-decisions:
  - "Vanilla JavaScript without build step - matches project constraint for simplicity"
  - "Singleton API client pattern - single instance exported for easy import"
  - "Generic request() method with error handling - centralizes HTTP logic"
  - "CSS custom properties for design tokens - enables theme consistency"

patterns-established:
  - "Script loading order: utils → api-client → state → components → screens → app"
  - "Directory structure: js/components/, js/screens/, js/utils/ for separation of concerns"
  - "API client methods follow camelCase naming (convert from snake_case API)"
  - "Design tokens in :root with semantic naming (--color-primary, --space-md)"

# Metrics
duration: 3.5min
completed: 2026-01-16
---

# Phase 08 Plan 01: GUI Foundation and API Client Summary

**Complete API client with 43 methods for all logic layer endpoints, HTML5 SPA shell, and design system with CSS variables**

## Performance

- **Duration:** 3.5 minutes
- **Started:** 2026-01-16T21:00:25Z
- **Completed:** 2026-01-16T21:03:53Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments
- Created GUI directory structure with component/screen/util organization
- Built HTML5 SPA shell with script loading order
- Implemented complete API client with 43 methods covering all 7 logic layer modules
- Established design system with CSS variables for colors, spacing, typography

## Task Commits

Each task was committed atomically:

1. **Task 1: Create base GUI structure** - `6bdbce1` (feat)
2. **Task 2: Create api-client.js with all logic layer endpoints** - `e9951f6` (feat)

**Plan metadata:** (will be committed with STATE.md update)

## Files Created/Modified

**Created:**
- `gui/index.html` (68 lines) - HTML5 SPA shell with script tags for all components
- `gui/js/api-client.js` (568 lines) - Complete API client with 43 methods for logic layer
- `gui/package.json` (13 lines) - Package configuration with serve script for port 8080
- `gui/styles/main.css` (195 lines) - CSS reset and design tokens

**Directory structure:**
- `gui/js/components/` - Future UI components
- `gui/js/screens/` - Future screen modules
- `gui/js/utils/` - Future utility functions
- `gui/styles/` - Stylesheets
- `gui/assets/` - Static assets

## API Client Coverage

The api-client.js file provides complete coverage of all 43 REST endpoints:

### Causality Chains (5 methods)
- `createCausalityChain(data)` - POST /api/logic/causality
- `getCausalityChain(chainId)` - GET /api/logic/causality/:chainId
- `getCausalityGraph(eventId, depth)` - GET /api/logic/causality/chain/:eventId?depth=N
- `updateCausalityChain(chainId, updates)` - PUT /api/logic/causality/:chainId
- `deleteCausalityChain(chainId)` - DELETE /api/logic/causality/:chainId

### Character Arcs (6 methods)
- `createCharacterArc(data)` - POST /api/logic/arcs
- `getCharacterArcByCharacter(characterId)` - GET /api/logic/arcs/character/:characterId
- `getCharacterArc(arcId)` - GET /api/logic/arcs/:arcId
- `updateCharacterArc(arcId, updates)` - PUT /api/logic/arcs/:arcId
- `advanceArcPhase(arcId)` - POST /api/logic/arcs/:arcId/advance
- `deleteCharacterArc(arcId)` - DELETE /api/logic/arcs/:arcId

### Story Conflicts (6 methods)
- `createStoryConflict(data)` - POST /api/logic/conflicts
- `getStoryConflict(conflictId)` - GET /api/logic/conflicts/:conflictId
- `getStoryConflictsByProject(projectId)` - GET /api/logic/conflicts/project/:projectId
- `updateStoryConflict(conflictId, updates)` - PUT /api/logic/conflicts/:conflictId
- `transitionConflictStatus(conflictId, newStatus)` - POST /api/logic/conflicts/:conflictId/transition
- `deleteStoryConflict(conflictId)` - DELETE /api/logic/conflicts/:conflictId

### Thematic Elements (7 methods)
- `createThematicElement(data)` - POST /api/logic/themes
- `getThematicElement(themeId)` - GET /api/logic/themes/:themeId
- `getThematicElementsByProject(projectId)` - GET /api/logic/themes/project/:projectId
- `updateThematicElement(themeId, updates)` - PUT /api/logic/themes/:themeId
- `addManifestation(themeId, manifestation)` - POST /api/logic/themes/:themeId/manifestations
- `removeManifestation(themeId, index)` - DELETE /api/logic/themes/:themeId/manifestations/:index
- `deleteThematicElement(themeId)` - DELETE /api/logic/themes/:themeId

### Motif Instances (6 methods)
- `createMotifInstance(data)` - POST /api/logic/motifs
- `getMotifInstance(motifId)` - GET /api/logic/motifs/:motifId
- `getMotifInstancesByType(type, projectId)` - GET /api/logic/motifs/type/:type?project_id=X
- `getMotifInstancesByProject(projectId)` - GET /api/logic/motifs/project/:projectId
- `updateMotifInstance(motifId, updates)` - PUT /api/logic/motifs/:motifId
- `deleteMotifInstance(motifId)` - DELETE /api/logic/motifs/:motifId

### Setup/Payoffs (7 methods)
- `createSetupPayoff(data)` - POST /api/logic/setup-payoffs
- `getSetupPayoff(setupId)` - GET /api/logic/setup-payoffs/:setupId
- `getSetupPayoffsByProject(projectId)` - GET /api/logic/setup-payoffs/project/:projectId
- `getUnfiredSetups(projectId)` - GET /api/logic/setup-payoffs/unfired?project_id=X
- `fireSetup(setupId, payoffEventId, firedChapter)` - POST /api/logic/setup-payoffs/:setupId/fire
- `updateSetupPayoff(setupId, updates)` - PUT /api/logic/setup-payoffs/:setupId
- `deleteSetupPayoff(setupId)` - DELETE /api/logic/setup-payoffs/:setupId

### World Rules (6 methods)
- `createWorldRule(data)` - POST /api/logic/world-rules
- `getWorldRule(ruleId)` - GET /api/logic/world-rules/:ruleId
- `getWorldRulesByCategory(category, projectId)` - GET /api/logic/world-rules/category/:category?project_id=X
- `getWorldRulesByProject(projectId)` - GET /api/logic/world-rules/project/:projectId
- `updateWorldRule(ruleId, updates)` - PUT /api/logic/world-rules/:ruleId
- `deleteWorldRule(ruleId)` - DELETE /api/logic/world-rules/:ruleId

## Design System

The main.css file establishes a comprehensive design system using CSS custom properties:

**Color tokens:**
- Primary/secondary palettes with dark/light variants
- Semantic colors (success, warning, error, info)
- Neutral scale (gray-50 through gray-900)
- Semantic mappings (--color-bg, --color-text, --color-border)

**Spacing scale:**
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px, 3xl: 64px

**Typography:**
- Font sizes: xs (12px) through 3xl (32px)
- Font weights: normal (400), medium (500), semibold (600), bold (700)
- Line heights: tight (1.25), normal (1.5), relaxed (1.75)

**Other tokens:**
- Border radius: sm, md, lg, full
- Shadows: sm, md, lg, xl
- Transitions: fast (150ms), base (250ms), slow (350ms)
- Z-index layers: base, dropdown, modal, toast

## Decisions Made

**1. Vanilla JavaScript without build step**
- Rationale: Matches project constraint (see PROJECT.md) for simplicity
- Implementation: No webpack/vite/rollup, just script tags in order
- Impact: Faster development, no transpilation complexity

**2. Singleton API client pattern**
- Rationale: Single instance simplifies imports, no need to pass around
- Implementation: Export `const api = new APIClient()` at bottom
- Impact: Screens/components can just `import api` and use immediately

**3. Generic request() method with error handling**
- Rationale: Centralizes HTTP logic, consistent error handling across all endpoints
- Implementation: Single method handles fetch, JSON parsing, status codes, errors
- Impact: All 43 endpoint methods are thin wrappers around request()

**4. CSS custom properties for design tokens**
- Rationale: Enable theme consistency, easier to maintain than hardcoded values
- Implementation: All tokens in :root with semantic naming
- Impact: Future components can reference variables for consistent styling

**5. camelCase method names (convert from snake_case API)**
- Rationale: Follow JavaScript naming conventions
- Implementation: API uses snake_case (cause_event_id), client uses camelCase (causeEventId)
- Impact: More idiomatic JavaScript, clearer separation between API and client

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all files created successfully without errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 9 (GUI Components):**
- ✓ Directory structure in place for components
- ✓ API client ready to use in components
- ✓ Design system tokens available for styling
- ✓ HTML shell ready to host components

**Enablers for component development:**
- Complete API client coverage means components can interact with all logic layer modules
- Design tokens provide consistent styling foundation
- Script loading order ensures proper dependency resolution

**No blockers or concerns.**

---
*Phase: 08-gui-core-infrastructure*
*Completed: 2026-01-16*
