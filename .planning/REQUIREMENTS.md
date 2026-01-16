# Requirements: TripleThink v4.1

**Defined:** 2026-01-16
**Core Value:** The orchestrator must assemble complete context packets for zero-knowledge scene generation

## v1 Requirements

Requirements for v4.1 production release. Each maps to roadmap phases.

### Foundation Layer

- [ ] **FOUND-01**: EVENT_MOMENTS table exists with columns for moment_uuid, event_uuid, sequence_index, beat_description, timestamp_offset
- [ ] **FOUND-02**: EVENT_MOMENTS database module (event-moments.js) provides CRUD operations
- [ ] **FOUND-03**: EVENT_MOMENTS integrates with existing events system for granular beat tracking
- [ ] **FOUND-04**: EVENT_MOMENTS API endpoints allow creation and retrieval of event beats
- [ ] **FOUND-05**: EVENT_MOMENTS tested with integration tests verifying beat sequencing

### Logic Layer - Database Schema

- [ ] **LOGIC-01**: CAUSALITY_CHAINS table exists with cause_event_id, effect_event_id, type, strength (1-10), explanation
- [ ] **LOGIC-02**: CHARACTER_ARCS table exists with character_id, archetype, lie_belief, truth_belief, want_external, need_internal, current_phase
- [ ] **LOGIC-03**: STORY_CONFLICTS table exists with type, protagonist_id, antagonist_source, stakes_success, stakes_fail, status
- [ ] **LOGIC-04**: THEMATIC_ELEMENTS table exists with project_id, statement, primary_symbol_id, question, manifestations
- [ ] **LOGIC-05**: MOTIF_INSTANCES table exists with motif_type, linked_entity_id, description, significance
- [ ] **LOGIC-06**: SETUP_PAYOFFS table exists with setup_event_id, payoff_event_id, description, status, planted_chapter, fired_chapter
- [ ] **LOGIC-07**: WORLD_RULES table exists with rule_category, statement, exceptions, enforcement_level

### Logic Layer - Database Modules

- [ ] **LOGIC-08**: causality-chains.js module provides CRUD operations for causality tracking
- [ ] **LOGIC-09**: causality-chains.js supports causal chain traversal with depth limiting
- [ ] **LOGIC-10**: character-arcs.js module provides CRUD operations for character transformation tracking
- [ ] **LOGIC-11**: character-arcs.js tracks Save the Cat beat sheet phases (setup, catalyst, debate, midpoint, etc.)
- [ ] **LOGIC-12**: story-conflicts.js module provides CRUD operations for conflict tracking
- [ ] **LOGIC-13**: story-conflicts.js supports conflict status transitions (latent → active → escalating → climactic → resolved)
- [ ] **LOGIC-14**: thematic-elements.js module provides CRUD operations for theme tracking
- [ ] **LOGIC-15**: motif-instances.js module provides CRUD operations for motif pattern tracking
- [ ] **LOGIC-16**: setup-payoffs.js module provides CRUD operations for setup/payoff tracking
- [ ] **LOGIC-17**: setup-payoffs.js identifies unfired setups (planted but not yet paid off)
- [ ] **LOGIC-18**: world-rules.js module provides CRUD operations for universe consistency rules

### Logic Layer - Integration

- [ ] **LOGIC-19**: All logic layer modules integrate with api-functions.js facade
- [ ] **LOGIC-20**: Orchestrator service queries logic layer for conflicts, arcs, themes during context assembly
- [ ] **LOGIC-21**: Logic layer modules tested with unit tests for CRUD operations
- [ ] **LOGIC-22**: Logic layer modules tested with integration tests for cross-table queries

### API Integration

- [ ] **API-01**: /api/logic route exists and is registered in server.js
- [ ] **API-02**: /api/logic/causality endpoints support creating and querying causal chains
- [ ] **API-03**: /api/logic/causality/chain/:eventId endpoint returns full causal chain with depth parameter
- [ ] **API-04**: /api/logic/arcs endpoints support character arc CRUD operations
- [ ] **API-05**: /api/logic/conflicts endpoints support story conflict CRUD operations
- [ ] **API-06**: /api/logic/themes endpoints support thematic element CRUD operations
- [ ] **API-07**: /api/logic/motifs endpoints support motif instance CRUD operations
- [ ] **API-08**: /api/logic/setup-payoffs endpoints support setup/payoff CRUD operations
- [ ] **API-09**: /api/logic/setup-payoffs/unfired endpoint returns planted but unfired setups
- [ ] **API-10**: /api/logic/world-rules endpoints support world rule CRUD operations
- [ ] **API-11**: /api/validation route is registered in server.js
- [ ] **API-12**: /api/projects route is registered in server.js (or verified existing)
- [ ] **API-13**: /api/fictions route is registered in server.js (or verified existing)
- [ ] **API-14**: /api/entities route is registered in server.js (or verified existing)
- [ ] **API-15**: /api/temporal route is registered in server.js (or verified existing)
- [ ] **API-16**: /api/search route is registered in server.js (or verified existing)
- [ ] **API-17**: /api/export route is registered in server.js (or verified existing)

### GUI - Core Components

- [ ] **GUI-01**: power-drawer.js component provides slide-out panel for advanced inspection
- [ ] **GUI-02**: Power drawer integrates with timeline, epistemic, and character screens
- [ ] **GUI-03**: layer-switcher.js component toggles between World Truth, Character View, Reader View
- [ ] **GUI-04**: Layer switcher updates state.js viewMode and re-renders affected components
- [ ] **GUI-05**: api-client.js extended with all logic layer endpoint calls
- [ ] **GUI-06**: state.js enhanced with v4.1 fields (currentProjectId, currentTimestamp, selectedCharacter, viewMode, powerDrawerOpen, causalityDepth, activeTab)

### GUI - Logic Layer Visualization

- [ ] **GUI-07**: story-logic.js screen exists with 6 tabs (Arcs, Conflicts, Causality, Themes, Motifs, Setup/Payoffs)
- [ ] **GUI-08**: arc-card.js component displays character arc with progress bar and phase tracking
- [ ] **GUI-09**: conflict-card.js component displays story conflict with protagonist/antagonist/stakes
- [ ] **GUI-10**: causality-graph.js component renders D3 force-directed graph with depth control
- [ ] **GUI-11**: Causality graph uses color-coded arrows (direct cause, enabling condition, motivation, psychological trigger)
- [ ] **GUI-12**: Causality graph limits to 50 nodes max with depth slider (default: 3, max: 10)
- [ ] **GUI-13**: setup-payoff-list.js component displays Chekhov's gun tracker with status (planted, referenced, fired, unfired warning)

### GUI - Narrative Editing

- [ ] **GUI-14**: narrative-tree-editor.js component supports drag-and-drop chapter/scene reordering
- [ ] **GUI-15**: Narrative tree editor auto-renumbers chapters/scenes after reorder
- [ ] **GUI-16**: Narrative tree editor supports split chapter operation
- [ ] **GUI-17**: Narrative tree editor supports merge chapter operation
- [ ] **GUI-18**: Narrative tree editor supports rename/delete with confirmations
- [ ] **GUI-19**: narrative.js screen integrates narrative-tree-editor.js replacing old tree view

### GUI - Reader Knowledge Tracking

- [ ] **GUI-20**: reader-knowledge-tracker.js component tracks facts revealed to reader per scene
- [ ] **GUI-21**: dramatic-irony-panel.js component compares reader knowledge vs character knowledge
- [ ] **GUI-22**: scene-editor.js enhanced with "Facts Revealed to Reader" section
- [ ] **GUI-23**: scene-editor.js shows dramatic irony warnings when character speaks about unknown facts
- [ ] **GUI-24**: Layer switcher includes Reader View mode showing only reader-known facts

### GUI - Epistemic Enhancements

- [ ] **GUI-25**: epistemic.js screen supports character knowledge comparison mode
- [ ] **GUI-26**: epistemic.js highlights false beliefs with orange borders
- [ ] **GUI-27**: timeline.js enhanced with epistemic toggle (show/hide knowledge states)
- [ ] **GUI-28**: timeline.js shows causality arrows between events when enabled
- [ ] **GUI-29**: characters.js screen integrates arc-card.js component
- [ ] **GUI-30**: characters.js screen has "What They Know" button opening epistemic modal

### GUI - Advanced Features

- [ ] **GUI-31**: relationship-map.js component renders character relationship visualization using Vis.js
- [ ] **GUI-32**: Relationship map shows trust, fear, respect, power balance with color-coded edges
- [ ] **GUI-33**: timeline-viz.js enhanced with state reconstruction indicators (snapshot anchors, delta symbols)
- [ ] **GUI-34**: dashboard.js enhanced with v4.1 stats (logic layer health: unfired setups, incomplete arcs, unresolved conflicts)
- [ ] **GUI-35**: SQL query window placeholder exists in GUI (non-functional, labeled "Coming Soon")
- [ ] **GUI-36**: validation.js screen organizes validation results by category tabs

### Validation & Testing

- [ ] **VAL-01**: Validation service integrated into server.js with registered route
- [ ] **VAL-02**: 100+ validation rules operational across 8 categories (epistemic, causality, arcs, conflicts, setup/payoffs, world rules, narrative, performance)
- [ ] **VAL-03**: Performance benchmarks verify state reconstruction <100ms for 100-delta chains
- [ ] **VAL-04**: Performance benchmarks verify orchestrator context assembly <1s for 10-character scenes
- [ ] **VAL-05**: Integration tests exist for all logic layer modules
- [ ] **VAL-06**: Integration tests exist for all API routes
- [ ] **VAL-07**: End-to-end tests verify QACS workflow (create event → populate logic layer → assemble context)
- [ ] **VAL-08**: Storage benchmarks verify <50MB for 10-book series with full logic layer

### Documentation

- [ ] **DOC-01**: COMPONENT_GUIDE.md documents all new GUI components with usage examples
- [ ] **DOC-02**: NARRATIVE_EDITING_GUIDE.md documents drag-and-drop editor workflow
- [ ] **DOC-03**: API documentation updated with all logic layer endpoints
- [ ] **DOC-04**: USAGE_MANUAL updated with v4.1 features and QACS workflow
- [ ] **DOC-05**: Migration guide exists for any v1.0 users (if applicable)

## v2 Requirements

Deferred to future releases.

### Advanced Features

- **ADV-01**: Timeline branching UI - Multiple "what if" scenarios with branch visualization
- **ADV-02**: SQL query window - Full functional SQL editor with results grid
- **ADV-03**: Real-time collaboration - Multi-user editing with conflict resolution
- **ADV-04**: Mobile-optimized GUI - Responsive design for tablet/phone
- **ADV-05**: AI writing integration - Direct prose generation from context packets
- **ADV-06**: Export to Scrivener/Final Draft - Industry-standard writing tool integration
- **ADV-07**: Voice memo integration - Audio notes linked to events
- **ADV-08**: Character relationship timeline - Animated relationship evolution over time

### AI Enhancements

- **AI-01**: Auto-detect causality from event descriptions
- **AI-02**: Auto-suggest character arc phases based on events
- **AI-03**: Auto-identify potential setup/payoff pairs
- **AI-04**: Auto-flag world rule violations in new events
- **AI-05**: Theme strength analysis - Quantify thematic coherence

## Out of Scope

| Feature | Reason |
|---------|--------|
| Migration from v1 "version 1" codebase | Previous codebase isolated/contaminated by YOLO mode, starting fresh |
| Framework migration (React/Vue) | Existing vanilla JS works well, migration wastes working code |
| PostgreSQL/MySQL support | SQLite sufficient for single-user desktop tool, enterprise DB adds complexity |
| Build step/transpilation | Plain ES6+ JavaScript maintains simplicity |
| Prose writing editor | Authors use their preferred tools (Scrivener, Word), TripleThink tracks structure |
| Cloud sync/hosting | Desktop-first tool, cloud adds security/privacy complexity |
| Payment/monetization features | Not a commercial SaaS product |
| User authentication beyond API keys | Single-user local tool, complex auth unnecessary |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 1 | Pending |
| LOGIC-01 | Phase 2 | Pending |
| LOGIC-02 | Phase 2 | Pending |
| LOGIC-03 | Phase 2 | Pending |
| LOGIC-04 | Phase 2 | Pending |
| LOGIC-05 | Phase 2 | Pending |
| LOGIC-06 | Phase 2 | Pending |
| LOGIC-07 | Phase 2 | Pending |
| LOGIC-08 | Phase 3 | Pending |
| LOGIC-09 | Phase 3 | Pending |
| LOGIC-10 | Phase 3 | Pending |
| LOGIC-11 | Phase 3 | Pending |
| LOGIC-12 | Phase 4 | Pending |
| LOGIC-13 | Phase 4 | Pending |
| LOGIC-14 | Phase 4 | Pending |
| LOGIC-15 | Phase 5 | Pending |
| LOGIC-16 | Phase 5 | Pending |
| LOGIC-17 | Phase 5 | Pending |
| LOGIC-18 | Phase 5 | Pending |
| LOGIC-19 | Phase 6 | Pending |
| LOGIC-20 | Phase 6 | Pending |
| LOGIC-21 | Phase 6 | Pending |
| LOGIC-22 | Phase 6 | Pending |
| API-01 | Phase 7 | Pending |
| API-02 | Phase 7 | Pending |
| API-03 | Phase 7 | Pending |
| API-04 | Phase 7 | Pending |
| API-05 | Phase 7 | Pending |
| API-06 | Phase 7 | Pending |
| API-07 | Phase 7 | Pending |
| API-08 | Phase 7 | Pending |
| API-09 | Phase 7 | Pending |
| API-10 | Phase 7 | Pending |
| API-11 | Phase 7 | Pending |
| API-12 | Phase 7 | Pending |
| API-13 | Phase 7 | Pending |
| API-14 | Phase 7 | Pending |
| API-15 | Phase 7 | Pending |
| API-16 | Phase 7 | Pending |
| API-17 | Phase 7 | Pending |
| GUI-01 | Phase 8 | Pending |
| GUI-02 | Phase 8 | Pending |
| GUI-03 | Phase 8 | Pending |
| GUI-04 | Phase 8 | Pending |
| GUI-05 | Phase 8 | Pending |
| GUI-06 | Phase 8 | Pending |
| GUI-07 | Phase 9 | Pending |
| GUI-08 | Phase 9 | Pending |
| GUI-09 | Phase 9 | Pending |
| GUI-10 | Phase 9 | Pending |
| GUI-11 | Phase 9 | Pending |
| GUI-12 | Phase 9 | Pending |
| GUI-13 | Phase 9 | Pending |
| GUI-14 | Phase 10 | Pending |
| GUI-15 | Phase 10 | Pending |
| GUI-16 | Phase 10 | Pending |
| GUI-17 | Phase 10 | Pending |
| GUI-18 | Phase 10 | Pending |
| GUI-19 | Phase 10 | Pending |
| GUI-20 | Phase 11 | Pending |
| GUI-21 | Phase 11 | Pending |
| GUI-22 | Phase 11 | Pending |
| GUI-23 | Phase 11 | Pending |
| GUI-24 | Phase 11 | Pending |
| GUI-25 | Phase 11 | Pending |
| GUI-26 | Phase 11 | Pending |
| GUI-27 | Phase 11 | Pending |
| GUI-28 | Phase 11 | Pending |
| GUI-29 | Phase 11 | Pending |
| GUI-30 | Phase 11 | Pending |
| GUI-31 | Phase 12 | Pending |
| GUI-32 | Phase 12 | Pending |
| GUI-33 | Phase 12 | Pending |
| GUI-34 | Phase 12 | Pending |
| GUI-35 | Phase 12 | Pending |
| GUI-36 | Phase 12 | Pending |
| VAL-01 | Phase 13 | Pending |
| VAL-02 | Phase 13 | Pending |
| VAL-03 | Phase 13 | Pending |
| VAL-04 | Phase 13 | Pending |
| VAL-05 | Phase 13 | Pending |
| VAL-06 | Phase 13 | Pending |
| VAL-07 | Phase 13 | Pending |
| VAL-08 | Phase 13 | Pending |
| DOC-01 | Phase 14 | Pending |
| DOC-02 | Phase 14 | Pending |
| DOC-03 | Phase 14 | Pending |
| DOC-04 | Phase 14 | Pending |
| DOC-05 | Phase 14 | Pending |

**Coverage:**
- v1 requirements: 83 total
- Mapped to phases: 83
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-16*
*Last updated: 2026-01-16 after roadmap creation (100% coverage)*
