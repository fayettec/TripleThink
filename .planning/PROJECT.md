# TripleThink v4.1

## What This Is

TripleThink is an event-sourced narrative database for managing multi-book fiction series with complex epistemic states (who knows what when). It enables authors to develop stories conversationally through QACS (Question-Answer-Challenge-Suggestions) sessions with Claude Code, which populates the database while the GUI provides transparency and spot-editing capabilities.

The system tracks three layers of reality: World Truth (what actually happened), Character Perception (what each character believes), and Reader Knowledge (what's been revealed in the narrative). Each series is a self-contained project with its own SQLite database.

## Core Value

**The orchestrator must assemble complete context packets for zero-knowledge scene generation.** This is what transforms TripleThink from a passive tracker into an active "Narrative Operating System" - enabling Claude to generate consistent, epistemically-accurate scenes without reading the entire novel, purely from assembled context about state, knowledge, relationships, conflicts, and themes at a specific moment in time.

## Requirements

### Validated

<!-- Shipped and confirmed working (inferred from existing codebase) -->

- ✓ Event sourcing architecture - immutable event log as single source of truth — existing
- ✓ Hybrid state reconstruction - snapshots + deltas with <100ms query performance — existing
- ✓ Epistemic tracking - character knowledge states across timeline — existing
- ✓ FICTIONS system - models lies, conspiracies, false narratives with target audiences — existing
- ✓ REST API with Express - routes for entities, metadata, epistemic, temporal — existing
- ✓ Vanilla JS GUI - timeline visualization, epistemic graphs, scene management — existing
- ✓ State management - LRU caching, pub/sub state updates — existing
- ✓ SQLite database - WAL mode with JSON1 extension — existing
- ✓ Middleware stack - authentication, caching, rate limiting, error handling — existing
- ✓ Multi-project support - separate DB files per series — existing

### Active

<!-- Current v4.1 completion scope -->

- [ ] EVENT_MOMENTS - granular beats within events for precise causality tracking
- [ ] CAUSALITY_CHAINS - cause-effect relationships with strength/type classification
- [ ] CHARACTER_ARCS - transformation tracking with lie/truth, want/need, Save the Cat phases
- [ ] STORY_CONFLICTS - protagonist/antagonist/stakes with escalation tracking
- [ ] THEMATIC_ELEMENTS - big ideas, questions, symbolic meaning tied to story assets
- [ ] MOTIF_INSTANCES - recurring visual, dialogue, and situational patterns
- [ ] SETUP_PAYOFFS - Chekhov's guns with plant/fire tracking across chapters
- [ ] WORLD_RULES - universe consistency enforcement (magic systems, tech limits, cultural norms)
- [ ] API route registration - expose all logic layer functionality via REST endpoints
- [ ] GUI narrative editor - drag-and-drop chapter/scene reordering with auto-renumbering
- [ ] GUI reader knowledge tracking - Layer 3 revelation tracking and dramatic irony panels
- [ ] GUI power drawer - slide-out advanced panel for deep epistemic/state inspection
- [ ] SQL query window placeholder - future power-user feature for direct database queries

### Out of Scope

- Timeline branching UI — API exists but hide from GUI v1 (single timeline sufficient for most authors)
- Mobile support — Desktop development tool only, complex visualizations require screen space
- Real-time collaboration — Single-author workflow, no concurrent editing needed
- Migration from v1 codebase — Previous "version 1" isolated, starting fresh to avoid YOLO mode contamination
- Framework migration — Keep vanilla JavaScript, no React/Vue conversion (working code is valuable)
- Prose writing interface — Authors write in their preferred editor, TripleThink tracks structure
- Build step/transpilation — Plain ES6+ JavaScript with no bundling complexity

## Context

**Development workflow**: Authors develop stories through conversational QACS sessions with Claude Code. During these sessions, Claude asks questions about the story, challenges ideas, offers alternatives, and populates the database via API calls. The GUI exists primarily for **transparency** (verifying Claude understood correctly) and **spot-edits** (quick 1-2 field corrections), not as a primary authoring tool.

**Typical scale**: ~100 characters per series, ~100 events per book, multi-book projects spanning years of development. Each series is isolated with no cross-series connections (use export/import for asset sharing).

**Current state**: v4.1 is 57% complete per gap analysis. Foundation layer (hybrid state) is operational. Context Matrix (epistemic, relationships, dialogue) is complete. Narrative orchestration layer is complete. **Critical gap**: Logic Layer (Phase 2) is 0% implemented - all 7 tables missing, blocking full story structure tracking.

**Technical environment**: Docker container running Node.js 20 + SQLite3. API on port 3000, GUI on port 8080. Better-sqlite3 for high-performance database access. D3.js and vis.js for visualizations. No build step required.

**Phase dependencies**: Phase 1 (Foundation) must complete before Phase 2 (Logic Layer). Phase 2 must complete before Phase 5 (API Integration). GUI can be enhanced in parallel once APIs exist.

## Constraints

- **Event sourcing immutability**: Never edit or delete events, only add new ones — Core architectural principle
- **Epistemic precision**: Always track who knows/believes what at each timestamp — Prevents narrative inconsistencies
- **ID-based references**: No data duplication, reference by ID only — Performance and consistency requirement
- **Performance targets**: <100ms state reconstruction, <1s orchestrator assembly, <50MB storage per 10-book series — User experience requirements
- **SQLite only**: No PostgreSQL/MySQL support planned — Simplicity and portability over enterprise scaling
- **No frameworks**: Keep vanilla JavaScript in GUI — Existing code works, migration wastes effort
- **Preserve FICTIONS system**: Unique TripleThink feature for modeling lies/conspiracies — Differentiator from other writing tools
- **Phase completion gates**: Cannot proceed to Phase N+1 before Phase N complete — Prevents dependency issues

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid state architecture (v4.1) | Solves storage explosion (300MB→48MB) while maintaining query speed (<100ms) | ✓ Good - Performance targets met |
| Implement v4.1 completely, not selectively | AI handles complexity, users never see schema directly | — Pending - In progress |
| Preserve FICTIONS system | Unique differentiator for modeling lies, conspiracies, false narratives | ✓ Good - No other tool has this |
| Keep vanilla JavaScript in GUI | 3,860 working lines of code, no framework lock-in | ✓ Good - Simplicity maintained |
| GUI as inspection tool, not authoring tool | QACS sessions via Claude Code are the primary interface | — Pending - Validating workflow |
| Separate projects per series | Prevents cross-contamination, enables clean export/import | ✓ Good - Clear boundaries |
| Logic Layer before API routes | Must build tables/modules before exposing functionality | — Pending - Following dependency chain |
| 19-week phased approach | Enables testing at each gate, prevents big-bang failures | — Pending - Currently executing |
| SQL query window as placeholder only | Power-user feature deferred to avoid scope creep | — Pending - Revisit after v4.1 complete |

---
*Last updated: 2026-01-16 after initialization via /gsd:new-project*
