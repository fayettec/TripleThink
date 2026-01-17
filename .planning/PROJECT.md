# TripleThink v4.1

## What This Is

TripleThink is an event-sourced narrative database for managing multi-book fiction series with complex epistemic states (who knows what when) and full story structure tracking (causality, arcs, conflicts, themes, motifs, setups, world rules). It enables authors to develop stories conversationally through QACS (Question-Answer-Challenge-Suggestions) sessions with Claude Code, which populates the database while the GUI provides transparency and spot-editing capabilities.

The system tracks three layers of reality: World Truth (what actually happened), Character Perception (what each character believes), and Reader Knowledge (what's been revealed in the narrative). The Logic Layer enables the orchestrator to assemble zero-knowledge context packets for scene generation, transforming TripleThink from a passive tracker into an active "Narrative Operating System". Each series is a self-contained project with its own SQLite database.

## Core Value

**The orchestrator must assemble complete context packets for zero-knowledge scene generation.** This is what transforms TripleThink from a passive tracker into an active "Narrative Operating System" - enabling Claude to generate consistent, epistemically-accurate scenes without reading the entire novel, purely from assembled context about state, knowledge, relationships, conflicts, and themes at a specific moment in time.

## Requirements

### Validated

<!-- Shipped and confirmed working -->

- ✓ Event sourcing architecture - immutable event log as single source of truth — existing
- ✓ Hybrid state reconstruction - snapshots + deltas with <100ms query performance — existing (actual: 0.01ms)
- ✓ Epistemic tracking - character knowledge states across timeline — existing
- ✓ FICTIONS system - models lies, conspiracies, false narratives with target audiences — existing
- ✓ REST API with Express - routes for entities, metadata, epistemic, temporal — existing
- ✓ Vanilla JS GUI - timeline visualization, epistemic graphs, scene management — existing
- ✓ State management - LRU caching, pub/sub state updates — existing
- ✓ SQLite database - WAL mode with JSON1 extension — existing
- ✓ Middleware stack - authentication, caching, rate limiting, error handling — existing
- ✓ Multi-project support - separate DB files per series — existing
- ✓ EVENT_MOMENTS - granular beats within events for precise causality tracking — v4.1
- ✓ CAUSALITY_CHAINS - cause-effect relationships with BFS traversal and depth limiting — v4.1
- ✓ CHARACTER_ARCS - transformation tracking with lie/truth, want/need, Save the Cat 13-beat phases — v4.1
- ✓ STORY_CONFLICTS - protagonist/antagonist/stakes with status transitions — v4.1
- ✓ THEMATIC_ELEMENTS - big ideas, questions, symbolic meaning with manifestations — v4.1
- ✓ MOTIF_INSTANCES - recurring visual, dialogue, and situational patterns — v4.1
- ✓ SETUP_PAYOFFS - Chekhov's guns with plant/fire tracking and unfired setups query — v4.1
- ✓ WORLD_RULES - universe consistency enforcement with three-tier enforcement levels — v4.1
- ✓ Logic Layer API - 43 REST endpoints exposing all logic layer functionality — v4.1
- ✓ Orchestrator integration - assembles conflicts, arcs, themes in context packets (1.76ms avg) — v4.1
- ✓ GUI Story Logic screen - 6-tab visualization with arcs, conflicts, causality, themes, motifs, setups — v4.1
- ✓ GUI Causality graph - D3 force-directed visualization with depth control (1-10), 50-node limit — v4.1
- ✓ GUI Narrative editor - drag-and-drop chapter/scene reordering with auto-renumbering, split/merge — v4.1
- ✓ GUI Reader knowledge tracking - dramatic irony panels and reader view layer switching — v4.1
- ✓ GUI Epistemic enhancements - character comparison mode, false belief highlighting, knowledge modals — v4.1
- ✓ GUI Relationship map - Vis.js network visualization with color-coded edges — v4.1
- ✓ GUI Power drawer - slide-out advanced inspection panel — v4.1
- ✓ Validation system - 106 rules across 8 categories, <1ms execution — v4.1
- ✓ Comprehensive documentation - 5,617 lines covering components, API, usage, migration — v4.1

### Active

<!-- Next milestone scope (TBD) -->

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

**Current state**: v4.1 shipped 2026-01-17. All 83 v1 requirements satisfied. Complete Logic Layer operational with 7 modules, full-stack GUI with 13 components and 7 screens, 106 validation rules, 5,617 lines of documentation. Performance exceptional: state reconstruction 0.01ms (10,000x under target), orchestrator 1.76ms (568x under target), storage 1.4MB for 10-book series (97% under target).

**Technical environment**: Docker container running Node.js 20 + SQLite3. API on port 3000, GUI on port 8080. Better-sqlite3 for high-performance database access. D3.js and vis.js for visualizations. No build step required. 18,110 lines of JavaScript/HTML/CSS across 63 files.

**Known tech debt (non-blocking)**: Epistemic screen uses mock character data for testing, reader view filtering infrastructure complete but full implementation deferred, some E2E test fixtures need schema updates. All acceptable for v1 release.

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
| Hybrid state architecture (v4.1) | Solves storage explosion (300MB→48MB) while maintaining query speed (<100ms) | ✓ Good - Exceeded: 0.01ms actual, 1.4MB for 10 books |
| Implement v4.1 completely, not selectively | AI handles complexity, users never see schema directly | ✓ Good - All 83 requirements satisfied, zero orphaned code |
| Preserve FICTIONS system | Unique differentiator for modeling lies, conspiracies, false narratives | ✓ Good - No other tool has this |
| Keep vanilla JavaScript in GUI | 3,860 working lines of code, no framework lock-in | ✓ Good - Now 18,110 LOC, zero build complexity |
| GUI as inspection tool, not authoring tool | QACS sessions via Claude Code are the primary interface | ✓ Good - GUI provides transparency, not primary editing |
| Separate projects per series | Prevents cross-contamination, enables clean export/import | ✓ Good - Clear boundaries |
| Logic Layer before API routes | Must build tables/modules before exposing functionality | ✓ Good - Clean dependency chain, zero integration issues |
| 15-phase comprehensive approach | Enables testing at each gate, prevents big-bang failures | ✓ Good - Completed in 2 days, avg 4.3 min/plan |
| SQL query window as placeholder only | Power-user feature deferred to avoid scope creep | ✓ Good - Placeholder exists, no scope creep |
| 106 validation rules across 8 categories | Comprehensive coverage without overwhelming complexity | ✓ Good - <1ms execution, clear categorization |
| D3.js for causality graphs | Standard visualization library, no build step | ✓ Good - Natural force-directed layout works well |
| Vis.js for relationship maps | Built-in network layouts reduce code complexity | ✓ Good - Relationship graphs render cleanly |
| Phase-level verification (gsd-verifier) | Goal-backward validation prevents stub shipping | ✓ Good - Zero orphaned code, 100% wired implementations |

---
*Last updated: 2026-01-17 after v4.1 milestone completion*
