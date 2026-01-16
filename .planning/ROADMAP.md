# Roadmap: TripleThink v4.1

## Overview

TripleThink v4.1 completes the Logic Layer implementation, enabling full story structure tracking (causality, arcs, conflicts, themes, motifs, setups, world rules). This transforms TripleThink from a passive tracker into an active "Narrative Operating System" capable of assembling zero-knowledge context packets for scene generation.

The journey: Foundation enhancement (EVENT_MOMENTS) → Logic Layer database (7 tables) → Logic Layer modules (7 modules in 3 waves) → Integration & testing → API exposure → GUI visualization → GUI editing capabilities → GUI epistemic enhancements → Advanced features → Validation system → Documentation.

## Phases

**Phase Numbering:**
- Integer phases (1-14): Planned milestone work
- Decimal phases (e.g., 2.1): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation Enhancement** - EVENT_MOMENTS implementation for granular beat tracking
- [x] **Phase 2: Logic Layer Schema** - Create 7 new database tables
- [ ] **Phase 3: Logic Layer Modules - Causality & Arcs** - First wave: causality-chains.js and character-arcs.js
- [ ] **Phase 4: Logic Layer Modules - Conflicts & Themes** - Second wave: story-conflicts.js and thematic-elements.js
- [ ] **Phase 5: Logic Layer Modules - Motifs, Setups & Rules** - Third wave: motif-instances.js, setup-payoffs.js, world-rules.js
- [ ] **Phase 6: Logic Layer Integration** - Wire modules to api-functions.js and orchestrator, add tests
- [ ] **Phase 7: API Layer** - REST endpoints for all logic layer functionality
- [ ] **Phase 8: GUI Core Infrastructure** - Power drawer, layer switcher, state management, API client
- [ ] **Phase 9: GUI Logic Visualization** - Story logic screen with 6 tabs
- [ ] **Phase 10: GUI Narrative Editor** - Drag-and-drop chapter/scene reordering
- [ ] **Phase 11: GUI Epistemic & Reader Knowledge** - Layer switching, dramatic irony tracking
- [ ] **Phase 12: GUI Advanced Features & Polish** - Relationship maps, dashboard enhancements
- [ ] **Phase 13: Validation & Testing** - Comprehensive validation system with 100+ rules
- [ ] **Phase 14: Documentation** - User guides, API docs, component reference

## Phase Details

### Phase 1: Foundation Enhancement
**Goal**: EVENT_MOMENTS table and API enable granular beat tracking within events
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05
**Success Criteria** (what must be TRUE):
  1. EVENT_MOMENTS table exists with proper schema (moment_uuid, event_uuid, sequence_index, beat_description, timestamp_offset)
  2. Database module (event-moments.js) provides create, read, update, delete operations for moments
  3. Moments integrate with existing events system (can query moments for any event)
  4. API endpoints (/api/moments) allow creating and retrieving event beats
  5. Integration tests verify beat sequencing (moments return in correct order, timestamps offset correctly)
**Research**: Unlikely (extending existing events system with established patterns)
**Plans**: 2 plans

Plans:
- [x] 01-01: Database schema and module
- [x] 01-02: API endpoints and integration tests

### Phase 2: Logic Layer Schema
**Goal**: All 7 logic layer tables exist with proper schema and indexes
**Depends on**: Phase 1
**Requirements**: LOGIC-01, LOGIC-02, LOGIC-03, LOGIC-04, LOGIC-05, LOGIC-06, LOGIC-07
**Success Criteria** (what must be TRUE):
  1. CAUSALITY_CHAINS table exists with cause_event_id, effect_event_id, type, strength, explanation
  2. CHARACTER_ARCS table exists with character_id, archetype, lie_belief, truth_belief, want_external, need_internal, current_phase
  3. STORY_CONFLICTS table exists with type, protagonist_id, antagonist_source, stakes_success, stakes_fail, status
  4. THEMATIC_ELEMENTS table exists with project_id, statement, primary_symbol_id, question, manifestations
  5. MOTIF_INSTANCES table exists with motif_type, linked_entity_id, description, significance
  6. SETUP_PAYOFFS table exists with setup_event_id, payoff_event_id, description, status, planted_chapter, fired_chapter
  7. WORLD_RULES table exists with rule_category, statement, exceptions, enforcement_level
**Research**: Unlikely (SQL schema creation following existing patterns)
**Plans**: 2 plans

Plans:
- [x] 02-01: Create migration script with all 7 tables
- [x] 02-02: Run migration and verify schema with queries

### Phase 3: Logic Layer Modules - Causality & Arcs
**Goal**: Causality chains and character arcs have full CRUD operations and specialized queries
**Depends on**: Phase 2
**Requirements**: LOGIC-08, LOGIC-09, LOGIC-10, LOGIC-11
**Success Criteria** (what must be TRUE):
  1. db/modules/causality-chains.js exists and provides create, read, update, delete operations
  2. Causality chains support traversal queries (get full causal chain with depth limiting)
  3. db/modules/character-arcs.js exists and provides CRUD operations
  4. Character arcs track Save the Cat beat sheet phases (setup, catalyst, debate, midpoint, all-is-lost, finale)
**Research**: Unlikely (CRUD patterns established in existing codebase)
**Plans**: 2 plans

Plans:
- [ ] 03-01: causality-chains.js module with traversal
- [ ] 03-02: character-arcs.js module with phase tracking

### Phase 4: Logic Layer Modules - Conflicts & Themes
**Goal**: Story conflicts and thematic elements have full CRUD operations and status tracking
**Depends on**: Phase 3
**Requirements**: LOGIC-12, LOGIC-13, LOGIC-14
**Success Criteria** (what must be TRUE):
  1. db/modules/story-conflicts.js exists and provides CRUD operations
  2. Conflicts support status transitions (latent → active → escalating → climactic → resolved)
  3. db/modules/thematic-elements.js exists and provides CRUD operations for theme tracking
**Research**: Unlikely (following established module patterns)
**Plans**: 2 plans

Plans:
- [ ] 04-01: story-conflicts.js module with status transitions
- [ ] 04-02: thematic-elements.js module

### Phase 5: Logic Layer Modules - Motifs, Setups & Rules
**Goal**: Motifs, setup/payoffs, and world rules have full CRUD operations and specialized queries
**Depends on**: Phase 4
**Requirements**: LOGIC-15, LOGIC-16, LOGIC-17, LOGIC-18
**Success Criteria** (what must be TRUE):
  1. db/modules/motif-instances.js exists and provides CRUD operations for motif pattern tracking
  2. db/modules/setup-payoffs.js exists and provides CRUD operations
  3. Setup/payoffs module identifies unfired setups (planted but not yet paid off)
  4. db/modules/world-rules.js exists and provides CRUD operations for universe consistency rules
**Research**: Unlikely (final modules following established patterns)
**Plans**: 2 plans

Plans:
- [ ] 05-01: motif-instances.js and setup-payoffs.js modules
- [ ] 05-02: world-rules.js module and unfired setups query

### Phase 6: Logic Layer Integration
**Goal**: Logic layer wired to api-functions.js and orchestrator with comprehensive tests
**Depends on**: Phase 5
**Requirements**: LOGIC-19, LOGIC-20, LOGIC-21, LOGIC-22
**Success Criteria** (what must be TRUE):
  1. All 7 logic layer modules integrate with db/api-functions.js facade (exported functions available)
  2. Orchestrator service (api/services/orchestrator.js) queries logic layer for conflicts, arcs, themes during context assembly
  3. Unit tests exist for all logic layer modules (CRUD operations verified)
  4. Integration tests exist for cross-table queries (e.g., arc + conflicts for character, causality chain + themes)
**Research**: Unlikely (integration following existing orchestrator patterns)
**Plans**: 3 plans

Plans:
- [ ] 06-01: Wire all modules to api-functions.js facade
- [ ] 06-02: Integrate logic layer queries into orchestrator context assembly
- [ ] 06-03: Unit and integration tests for logic layer

### Phase 7: API Layer
**Goal**: All logic layer functionality exposed via REST endpoints
**Depends on**: Phase 6
**Requirements**: API-01, API-02, API-03, API-04, API-05, API-06, API-07, API-08, API-09, API-10, API-11, API-12, API-13, API-14, API-15, API-16, API-17
**Success Criteria** (what must be TRUE):
  1. /api/logic route exists and is registered in server.js
  2. /api/logic/causality endpoints support CRUD and chain traversal (/api/logic/causality/chain/:eventId with depth parameter)
  3. /api/logic/arcs, /api/logic/conflicts, /api/logic/themes, /api/logic/motifs endpoints support CRUD
  4. /api/logic/setup-payoffs endpoints support CRUD and /api/logic/setup-payoffs/unfired returns unfired setups
  5. /api/logic/world-rules endpoints support CRUD
  6. /api/validation, /api/projects, /api/fictions, /api/entities, /api/temporal, /api/search, /api/export routes verified registered or added
**Research**: Unlikely (REST endpoint patterns established in existing api/routes/)
**Plans**: 3 plans

Plans:
- [ ] 07-01: Create api/routes/logic-layer.js with causality, arcs, conflicts endpoints
- [ ] 07-02: Add themes, motifs, setup-payoffs, world-rules endpoints
- [ ] 07-03: Verify/add validation, projects, fictions, entities, temporal, search, export routes

### Phase 8: GUI Core Infrastructure
**Goal**: Core GUI components and state management ready for logic layer features
**Depends on**: Phase 7
**Requirements**: GUI-01, GUI-02, GUI-03, GUI-04, GUI-05, GUI-06
**Success Criteria** (what must be TRUE):
  1. gui/js/components/power-drawer.js component provides slide-out panel for advanced inspection
  2. Power drawer integrates with timeline, epistemic, and character screens (toggle button on each)
  3. gui/js/components/layer-switcher.js component toggles between World Truth, Character View, Reader View
  4. Layer switcher updates state.js viewMode and re-renders affected components
  5. gui/js/api-client.js extended with all logic layer endpoint calls (causality, arcs, conflicts, themes, motifs, setups, rules)
  6. gui/js/state.js enhanced with v4.1 fields (currentProjectId, currentTimestamp, selectedCharacter, viewMode, powerDrawerOpen, causalityDepth, activeTab)
**Research**: Unlikely (component patterns established in existing GUI)
**Plans**: 3 plans

Plans:
- [ ] 08-01: power-drawer.js component and integration
- [ ] 08-02: layer-switcher.js component and viewMode state
- [ ] 08-03: Extend api-client.js and state.js with v4.1 fields

### Phase 9: GUI Logic Visualization
**Goal**: Story logic screen with 6 tabs displaying arcs, conflicts, causality, themes, motifs, setups
**Depends on**: Phase 8
**Requirements**: GUI-07, GUI-08, GUI-09, GUI-10, GUI-11, GUI-12, GUI-13
**Success Criteria** (what must be TRUE):
  1. gui/js/screens/story-logic.js screen exists with 6 tabs (Arcs, Conflicts, Causality, Themes, Motifs, Setup/Payoffs)
  2. gui/js/components/arc-card.js component displays character arc with progress bar and phase tracking
  3. gui/js/components/conflict-card.js component displays story conflict with protagonist/antagonist/stakes
  4. gui/js/components/causality-graph.js component renders D3 force-directed graph with depth control
  5. Causality graph uses color-coded arrows (direct cause, enabling condition, motivation, psychological trigger)
  6. Causality graph limits to 50 nodes max with depth slider (default: 3, max: 10)
  7. gui/js/components/setup-payoff-list.js component displays Chekhov's gun tracker with status (planted, referenced, fired, unfired warning)
**Research**: Unlikely (D3 visualizations follow existing epistemic-graph.js patterns)
**Plans**: 3 plans

Plans:
- [ ] 09-01: story-logic.js screen with tabs and arc-card/conflict-card components
- [ ] 09-02: causality-graph.js D3 visualization with depth control
- [ ] 09-03: setup-payoff-list.js component with status tracking

### Phase 10: GUI Narrative Editor
**Goal**: Drag-and-drop chapter/scene reordering with auto-renumbering
**Depends on**: Phase 9
**Requirements**: GUI-14, GUI-15, GUI-16, GUI-17, GUI-18, GUI-19
**Success Criteria** (what must be TRUE):
  1. gui/js/components/narrative-tree-editor.js component supports drag-and-drop chapter/scene reordering
  2. Narrative tree editor auto-renumbers chapters/scenes after reorder (Chapter 1 → 2 if moved)
  3. Narrative tree editor supports split chapter operation (split Chapter 3 → Chapter 3 & 4, renumber rest)
  4. Narrative tree editor supports merge chapter operation (merge Chapter 2 + 3 → Chapter 2, renumber rest)
  5. Narrative tree editor supports rename/delete with confirmation dialogs
  6. gui/js/screens/narrative.js integrates narrative-tree-editor.js replacing old tree view
**Research**: Unlikely (drag-and-drop using established HTML5 drag API or existing patterns)
**Plans**: 3 plans

Plans:
- [ ] 10-01: narrative-tree-editor.js component with drag-and-drop
- [ ] 10-02: Auto-renumbering, split, and merge operations
- [ ] 10-03: Integrate into narrative.js screen

### Phase 11: GUI Epistemic & Reader Knowledge
**Goal**: Layer switching with reader knowledge tracking and dramatic irony detection
**Depends on**: Phase 10
**Requirements**: GUI-20, GUI-21, GUI-22, GUI-23, GUI-24, GUI-25, GUI-26, GUI-27, GUI-28, GUI-29, GUI-30
**Success Criteria** (what must be TRUE):
  1. gui/js/components/reader-knowledge-tracker.js component tracks facts revealed to reader per scene
  2. gui/js/components/dramatic-irony-panel.js component compares reader knowledge vs character knowledge
  3. gui/js/components/scene-editor.js enhanced with "Facts Revealed to Reader" section
  4. Scene editor shows dramatic irony warnings when character speaks about unknown facts (orange warning badge)
  5. Layer switcher includes Reader View mode showing only reader-known facts
  6. gui/js/screens/epistemic.js supports character knowledge comparison mode (select 2 characters, show diff)
  7. Epistemic screen highlights false beliefs with orange borders
  8. gui/js/screens/timeline.js enhanced with epistemic toggle (show/hide knowledge states)
  9. Timeline shows causality arrows between events when enabled (using Phase 9 causality data)
  10. gui/js/screens/characters.js integrates arc-card.js component from Phase 9
  11. Characters screen has "What They Know" button opening epistemic modal
**Research**: Unlikely (building on existing epistemic-graph.js and scene-editor.js)
**Plans**: 3 plans

Plans:
- [ ] 11-01: reader-knowledge-tracker.js and dramatic-irony-panel.js components
- [ ] 11-02: Enhance scene-editor.js with reader knowledge section and warnings
- [ ] 11-03: Enhance epistemic.js, timeline.js, characters.js with v4.1 features

### Phase 12: GUI Advanced Features & Polish
**Goal**: Relationship maps, dashboard enhancements, SQL query placeholder
**Depends on**: Phase 11
**Requirements**: GUI-31, GUI-32, GUI-33, GUI-34, GUI-35, GUI-36
**Success Criteria** (what must be TRUE):
  1. gui/js/components/relationship-map.js component renders character relationship visualization using Vis.js
  2. Relationship map shows trust, fear, respect, power balance with color-coded edges (green=trust, red=fear, blue=respect, purple=power)
  3. gui/js/components/timeline-viz.js enhanced with state reconstruction indicators (snapshot anchors, delta symbols)
  4. gui/js/screens/dashboard.js enhanced with v4.1 stats (unfired setups count, incomplete arcs count, unresolved conflicts count)
  5. SQL query window placeholder exists in GUI (non-functional, labeled "Coming Soon - Power User Feature")
  6. gui/js/screens/validation.js organizes validation results by category tabs (Epistemic, Causality, Arcs, Conflicts, Setup/Payoffs, World Rules, Narrative, Performance)
**Research**: Unlikely (Vis.js usage similar to existing timeline-viz.js patterns)
**Plans**: 2 plans

Plans:
- [ ] 12-01: relationship-map.js Vis.js visualization and dashboard enhancements
- [ ] 12-02: Timeline-viz indicators, validation screen tabs, SQL query placeholder

### Phase 13: Validation & Testing
**Goal**: Comprehensive validation system with 100+ rules operational
**Depends on**: Phase 12
**Requirements**: VAL-01, VAL-02, VAL-03, VAL-04, VAL-05, VAL-06, VAL-07, VAL-08
**Success Criteria** (what must be TRUE):
  1. Validation service integrated into server.js with /api/validation route registered
  2. 100+ validation rules operational across 8 categories (epistemic, causality, arcs, conflicts, setup/payoffs, world rules, narrative, performance)
  3. Performance benchmarks verify state reconstruction <100ms for 100-delta chains
  4. Performance benchmarks verify orchestrator context assembly <1s for 10-character scenes
  5. Integration tests exist for all logic layer modules (already covered in Phase 6, verify complete)
  6. Integration tests exist for all API routes (verify all /api/logic endpoints)
  7. End-to-end tests verify QACS workflow (create event → populate logic layer → assemble context → verify context packet)
  8. Storage benchmarks verify <50MB for 10-book series with full logic layer populated
**Research**: Unlikely (validation rules follow existing patterns, performance testing uses standard benchmarks)
**Plans**: 3 plans

Plans:
- [ ] 13-01: Validation service with 100+ rules across 8 categories
- [ ] 13-02: Performance benchmarks for state reconstruction and orchestrator
- [ ] 13-03: End-to-end tests and storage benchmarks

### Phase 14: Documentation
**Goal**: Complete user documentation for v4.1 features
**Depends on**: Phase 13
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05
**Success Criteria** (what must be TRUE):
  1. COMPONENT_GUIDE.md exists documenting all new GUI components with usage examples (power drawer, layer switcher, arc card, conflict card, causality graph, etc.)
  2. NARRATIVE_EDITING_GUIDE.md exists documenting drag-and-drop editor workflow (reorder, split, merge operations)
  3. API documentation updated with all logic layer endpoints (api/API_DOCUMENTATION.md or similar)
  4. USAGE_MANUAL.md updated with v4.1 features and QACS workflow examples
  5. Migration guide exists for any v1.0 users (or note that v4.1 is fresh start, no migration needed)
**Research**: Unlikely (documentation of completed features)
**Plans**: 2 plans

Plans:
- [ ] 14-01: COMPONENT_GUIDE.md and NARRATIVE_EDITING_GUIDE.md
- [ ] 14-02: API documentation and USAGE_MANUAL.md updates

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation Enhancement | 2/2 | Complete | 2026-01-16 |
| 2. Logic Layer Schema | 2/2 | Complete | 2026-01-16 |
| 3. Logic Layer Modules - Causality & Arcs | 0/2 | Not started | - |
| 4. Logic Layer Modules - Conflicts & Themes | 0/2 | Not started | - |
| 5. Logic Layer Modules - Motifs, Setups & Rules | 0/2 | Not started | - |
| 6. Logic Layer Integration | 0/3 | Not started | - |
| 7. API Layer | 0/3 | Not started | - |
| 8. GUI Core Infrastructure | 0/3 | Not started | - |
| 9. GUI Logic Visualization | 0/3 | Not started | - |
| 10. GUI Narrative Editor | 0/3 | Not started | - |
| 11. GUI Epistemic & Reader Knowledge | 0/3 | Not started | - |
| 12. GUI Advanced Features & Polish | 0/2 | Not started | - |
| 13. Validation & Testing | 0/3 | Not started | - |
| 14. Documentation | 0/2 | Not started | - |
