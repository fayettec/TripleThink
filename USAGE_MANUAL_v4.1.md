# TripleThink v4.1 Usage Manual (AI & Human)

## 1. Introduction
TripleThink v4.1 is an event-sourced narrative engine designed to manage complex, multi-book fiction series. It tracks "who knows what, when" using a sophisticated epistemic model and provides an orchestration layer for generating narrative content.

**Current Status:** Production Ready (All Phases Complete).
**Version:** 4.1.0
**Phase Progress:** 14/14 Complete - Documentation & Deployment Phase

## 2. Architecture Overview

### Three Layers of Reality
1.  **Foundation Layer (Ground Truth):** Event sourcing with immutable facts. The objective "what happened."
2.  **Hybrid State Layer (Performance):** Uses "Snapshots" (full state at anchor points) and "Deltas" (changes) to allow <100ms state reconstruction. Snapshots anchored every 10 events enable fast state reconstruction without full event replay.
3.  **Logic Layer (Story Structure):** Tracks narrative meta-structures built in Phases 3-5:
    *   **Causality Chains:** Cause-and-effect relationships with 4 types (direct_cause, enabling_condition, motivation, psychological_trigger)
    *   **Character Arcs:** Save the Cat 13-beat structure tracking lie/truth, want/need
    *   **Story Conflicts:** 5 types (internal, interpersonal, societal, environmental, supernatural) with status progression
    *   **Themes & Motifs:** Thematic statements with manifestations and 5 motif types
    *   **Setup/Payoffs:** Chekhov's gun tracking with planted/referenced/fired/unfired states
    *   **World Rules:** 6 categories with 3 enforcement levels (strict/flexible/guideline)

### Key Systems
*   **Epistemic System:** Tracks character knowledge, beliefs, and false beliefs (who knows what, when). Supports dramatic irony detection via knowledge divergence queries.
*   **Orchestrator (QACS):** Query-Assemble-Context-Supply workflow assembles complete zero-knowledge context packets for AI scene generation in <1s.
*   **Context Matrix:** Tracks relationships (6 dimensions: sentiment, trust, power, conflict), dialogue profiles (formality, emotionality, verbosity, quirks), and social dynamics.
*   **Validation System:** 106 rules across 8 categories (Epistemic, Causality, Arcs, Conflicts, Setup/Payoffs, World Rules, Narrative, Performance) ensure database consistency.

## 3. Getting Started (Humans)

### Prerequisites
*   Node.js v18+
*   npm
*   SQLite3

### Installation
```bash
cd /app/TripleThink
npm install
```

### Database Setup
Initialize the database and apply migrations:
```bash
node db/init-database.js
```

### Running the System
TripleThink includes a production startup script that launches both the API (port 3000) and GUI (port 8080).
```bash
./start.sh
```
*   **API:** `http://localhost:3000`
*   **GUI:** `http://localhost:8080`

### Migration
To migrate from v1.0:
```javascript
const TripleThinkMigrator = require('./api/services/migrator');
const migrator = new TripleThinkMigrator('/path/to/v1.0.db', '/path/to/v4.1.db');
await migrator.migrateFromV1();
```

## 4. AI Integration Guide

AI agents interact with TripleThink primarily through the **AI Functions** and **Orchestrator** endpoints.

### AI-Optimized Endpoints (`/api/ai`)
These endpoints are designed as MCP-style functions for direct LLM usage.

*   `GET /api/ai/context/:sceneId`
    *   **Returns:** Complete narrative context packet (POV, knowledge, relationships, pacing).
    *   **Use for:** Generating scene text or analyzing a specific moment.
*   `GET /api/ai/knowledge/:entityId?timestamp=...`
    *   **Returns:** Detailed belief state of a character.
    *   **Use for:** Checking if a character knows a secret or has a false belief.
*   `GET /api/ai/causality/:eventId`
    *   **Returns:** Upstream causes and downstream effects.
    *   **Use for:** Understanding "why" something happened.
*   `POST /api/ai/validate`
    *   **Returns:** Consistency report for a set of narrative facts.
    *   **Use for:** Checking if a proposed plot twist contradicts established lore.

### The Orchestrator (`/api/orchestrator`)
(Alias for `/api/ai/context`)
*   **Payload Includes:**
    *   POV Character details & Epistemic State
    *   Present characters & their current states
    *   Active Story Conflicts & Thematic elements
    *   Relationship dynamics (trust, affection, power)
    *   Recent relevant events & Pacing directives

## 5. API Reference (Key Endpoints)

### State Management
*   `POST /api/state/events` - Submit a new event (moves time forward).
*   `GET /api/state/:assetId/at/:eventId` - Time-travel: Get state at a specific past event.

### Logic Layer
*   `POST /api/logic/causality-chains` - Link cause → effect.
*   `POST /api/logic/character-arcs` - Define/Update character arcs.
*   `POST /api/logic/story-conflicts` - Manage narrative tension.
*   `POST /api/logic/setup-payoffs` - Track Chekhov's guns.

### Epistemic & Context
*   `GET /api/epistemic/divergence/:charA/:charB` - Find knowledge gaps between characters (e.g., Dramatic Irony).
*   `GET /api/temporal/timeline/:id` - Navigate branching timelines.

### System
*   `GET /api/search?q=...` - Semantic/Full-text search.
*   `GET /api/export` - Export project data.

## 6. Directory Structure
*   `api/` - Express server, routes, and services.
    *   `services/migrator.js` - Migration logic.
    *   `routes/ai.js` - AI-specific endpoints.
*   `db/` - Database logic and modules.
    *   `migrations/` - SQL schema definitions (001-004).
*   `gui/` - Web frontend (served on port 8080).
*   `schema/` - JSON schema and detailed documentation.
*   `tests/` - Unit, Integration, and E2E tests.

## 7. Performance Targets
*   **State Reconstruction:** <100ms (Hybrid State)
*   **Context Assembly:** <1s
*   **Storage:** <50MB for a 10-book series.

## 8. The QACS Workflow (Query-Assemble-Context-Supply)

### What is QACS?

The Orchestrator implements the QACS workflow - a pattern for assembling zero-knowledge context packets that enable AI to generate narrative content without prior knowledge of the story.

**Workflow Steps:**

1. **Query:** Identify what information is needed for a scene
2. **Assemble:** Gather POV knowledge, character states, relationships, conflicts, themes in parallel
3. **Context:** Package everything into a single JSON structure
4. **Supply:** Deliver complete context to AI for scene generation

### What's Included in a Context Packet?

A complete context packet from `GET /api/orchestrator/:sceneId` includes:

*   **Meta:** Scene ID, fiction ID, narrative time, assembly time (<1s target)
*   **Scene:** Title, summary, location, mood, tension level, stakes, goal, status
*   **POV Character:**
    *   Knowledge state (all facts known at this time, organized by type)
    *   False beliefs (for dramatic irony)
    *   Voice/dialogue profile (formality, emotionality, quirks)
    *   Relationships with other characters
*   **Present Characters:**
    *   Voice profiles for natural dialogue
    *   Knowledge counts
    *   Key secrets they know
*   **Relationship Matrix:**
    *   All pairwise relationships between present characters
    *   Sentiment, trust, power balance, conflict level
*   **Active Conflicts:**
    *   Type, status, protagonist, antagonist
    *   Stakes (success and failure outcomes)
*   **Active Themes:**
    *   Thematic statements and questions
    *   Manifestations in prior scenes
*   **Logic Layer:**
    *   Character arcs (current phase, lie/truth, want/need)
    *   Conflicts (same as above, organized for AI consumption)
    *   Themes (same as above)
*   **Forbidden Reveals:**
    *   Facts that must NOT be revealed in this scene
    *   Criticality levels (high if POV doesn't know yet)
*   **Pacing Context:**
    *   Current checkpoint (midpoint, climax, etc.)
    *   Next checkpoint and time until
    *   Tension curve statistics
    *   Recommended tension direction (increase/decrease/maintain)
    *   Vent moments (humor, reflection for emotional release)
*   **Previous Scene:**
    *   Transition type (cut, fade, dissolve)
    *   Time gap
    *   Carried tensions
    *   Location/POV changes
    *   Continuity notes

### Example: Assembling Context for a 3-Character Scene

```bash
curl http://localhost:3000/api/orchestrator/scene-001
```

Returns a context packet containing:
- POV character's 25 known facts organized by type (secrets, events, identities)
- 2 false beliefs for dramatic irony
- Voice profiles for all 3 characters
- 3 pairwise relationships (A-B, A-C, B-C)
- 2 active conflicts (1 internal, 1 interpersonal)
- 1 active theme with 5 manifestations
- Character arcs for all 3 characters
- 3 forbidden reveals (secrets not yet revealed)
- Pacing guidance: "increase tension" toward climax
- Previous scene: cut transition, 30-minute time gap, location changed

Assembly time: 24ms

### API Usage

**Full Context (for scene generation):**
```http
GET /api/orchestrator/:sceneId
```

**Quick Context (for dialogue generation only):**
```http
GET /api/orchestrator/:sceneId/quick
```

Quick context omits epistemic details, relationships, and pacing - returns only voice profiles and forbidden reveals for faster assembly (~8ms).

---

## 9. GUI Features (Phase 8-12)

The GUI (http://localhost:8080) provides a visual interface for authoring and managing narrative databases.

### Dashboard (Phase 12)

**Purpose:** Story health overview and entry point.

**Widgets:**
- Unfired Setups: Track Chekhov's guns that need payoff
- Incomplete Arcs: Characters with unfinished arcs
- Unresolved Conflicts: Active/escalating conflicts needing resolution
- Validation Status: Quick health check (critical/error/warning counts)

**Navigation:** Click any widget to drill down to relevant Story Logic tab.

### Narrative Editor (Phase 10)

**Features:**
- Drag-and-drop scene reordering within and between chapters
- Chapter split/merge operations
- Scene status badges (draft/review/final)
- Visual chapter grouping
- Unassigned scenes collection

**Actions:**
- Rename/delete chapters (with scene count warnings)
- Batch renumber scenes after reordering
- Quick scene status updates

### Story Logic Screen (Phase 9)

**6 Tabs:**

1. **Causality:**
   - Force-directed graph visualization (D3.js)
   - Depth slider (1-10 levels, default 3)
   - 50-node performance limit
   - Color-coded edges by relationship type
   - Interactive node selection

2. **Character Arcs:**
   - Card grid with progress bars
   - Phase badges (Setup → Catalyst → ... → Finale)
   - Lie/Truth, Want/Need display
   - Progress calculated as (phaseIndex / 12) × 100%

3. **Conflicts:**
   - Type and status badges
   - Protagonist/antagonist display
   - Stakes (success/failure) text
   - Status transition controls

4. **Themes:**
   - Thematic statement cards
   - Questions and primary symbols
   - Manifestation lists
   - Add/remove manifestation controls

5. **Motifs:**
   - Type badges (visual/auditory/symbolic/narrative_pattern/recurring_phrase)
   - Linked entity references
   - Significance descriptions

6. **Setup/Payoffs:**
   - Unfired setups highlighted in orange
   - Parallel fetch (all setups + unfired setups)
   - Planted/fired chapter tracking
   - Chekhov's gun monitoring

### Epistemic Enhancements (Phase 11)

**Reader Knowledge Tracker:**
- Reader entity (`reader-{fictionId}`) tracks audience knowledge
- Force-directed epistemic graph
- Color-coded nodes:
  - Green: Shared knowledge
  - Blue: Primary-only knowledge
  - Purple: Secondary-only knowledge
  - Orange: False beliefs
- Interactive filtering via badge clicks

**Dramatic Irony Panel:**
- Aggregate irony detection for all present characters
- Scene editor integration
- Knowledge badges with click-to-expand
- False belief highlighting with truth indicators

**Timeline Integration:**
- Scenes as timeline events
- Narrative time chronological display
- Toggle-based epistemic/causality overlays
- Knowledge badges show entity name + fact count

### Advanced Features (Phase 12)

**Relationship Map (Vis.js):**
- Network graph of all characters
- Edge colors by relationship priority:
  1. Trust (highest priority - blue)
  2. Conflict (red)
  3. Respect (green)
  4. Power (yellow)
- Interactive node selection
- Filtered by current project

**Characters Screen:**
- Tab navigation (List / Relationships)
- Character list with arcs
- Relationship graph integration

**Layer Switching:**
- Power drawer (slides from right)
- 3 view modes:
  1. World Truth (objective reality)
  2. Character View (POV-filtered)
  3. Reader View (audience knowledge)
- Updates global viewMode state

**State Visualization:**
- Snapshot anchors (every 10 events) with gold ⚓ badges
- Delta distance badges (Δ0-Δ9) show distance from last snapshot
- Enables understanding of state reconstruction

**SQL Playground (Reserved):**
- Disabled button with "Coming Soon"
- Placeholder for future power-user feature
- No delivery timeline promised

---

## 10. Validation System (Phase 13)

### Overview

The validation system runs 106 rules across 8 categories to ensure database consistency and catch authoring errors.

**Categories:**
1. **Epistemic** (13 rules) - Knowledge facts, false beliefs, temporal consistency
2. **Causality** (12 rules) - Circular chains, orphaned events, strength validation
3. **Character Arcs** (14 rules) - Phase progression, completeness, character existence
4. **Conflicts** (11 rules) - Status progression, protagonist validation, stakes presence
5. **Setup/Payoffs** (9 rules) - Unfired setups, event references, chapter consistency
6. **World Rules** (8 rules) - Category validation, enforcement levels, contradictions
7. **Narrative** (15 rules) - Scene continuity, POV consistency, temporal ordering
8. **Performance** (24 rules) - Query speed, state reconstruction time, storage efficiency

### Severity Levels

- **Critical:** Database corruption or fundamental inconsistencies (must fix immediately)
- **Error:** Logical errors that break story coherence (should fix before publishing)
- **Warning:** Style issues or potential problems (review and decide)

### Running Validation

**Via API:**
```bash
# Full report
curl http://localhost:3000/api/validation

# Summary only
curl http://localhost:3000/api/validation/summary

# Errors only
curl http://localhost:3000/api/validation/errors

# Specific category
curl http://localhost:3000/api/validation/category/epistemic

# Health check
curl http://localhost:3000/api/validation/health
```

**Via GUI:**
- Dashboard widget shows validation status
- Click to view detailed report
- Color-coded by severity

### Understanding Results

**Healthy System:**
```json
{
  "status": "healthy",
  "critical_issues": 0,
  "error_issues": 0,
  "warning_issues": 5
}
```

**Degraded System:**
```json
{
  "status": "degraded",
  "critical_issues": 0,
  "error_issues": 3,
  "warning_issues": 12,
  "issues": [
    {
      "rule": "CAUSAL-002",
      "severity": "error",
      "message": "Circular causality chain detected",
      "details": { "chain": ["event-001", "event-002", "event-001"] }
    }
  ]
}
```

**Critical System:**
```json
{
  "status": "critical",
  "critical_issues": 2,
  "error_issues": 5,
  "warning_issues": 8
}
```

### Performance

- Full validation: <2s for realistic data volumes
- Validation runs synchronously (structured for future async job support)
- Skips rules requiring missing schema elements (with warnings)

---

## 11. Performance Notes

TripleThink v4.1 achieves exceptional performance through the hybrid state architecture and optimized query patterns.

### Measured Performance (Phase 13 Benchmarks)

**State Reconstruction:**
- 10-delta chain: ~1ms
- 50-delta chain: ~8ms
- 100-delta chain: ~18ms
- **Target: <100ms** ✓ Massively exceeded

**Context Assembly (QACS):**
- 3-character scene: ~24ms
- 10-character scene: ~85ms
- With full epistemic, relationships, arcs, conflicts, themes
- **Target: <1s** ✓ Massively exceeded

**Storage Efficiency:**
- 5-book series: ~0.70 MB
- 10-book series: ~1.4 MB
- Includes entities, events, knowledge, arcs, conflicts, themes, scenes
- **Target: <50MB** ✓ Massively exceeded (35x under budget)

**Validation:**
- 106 rules on 2000+ entity database: ~1.5s
- In-memory SQLite isolation ensures no cross-test contamination
- **Target: <2s** ✓ Met

### Optimization Techniques

1. **Snapshot Anchoring:** Every 10 events creates full state snapshot
2. **Delta Chains:** Between snapshots, only changes stored
3. **Parallel Assembly:** QACS fetches epistemic, relationships, arcs, conflicts in parallel
4. **Query Caching:** State reconstruction caches intermediate results
5. **Index Optimization:** Strategic indexes on temporal queries

### When Performance Matters

- **QACS Assembly:** Real-time AI generation requires <1s context assembly
- **State Reconstruction:** GUI displays require fast historical state queries
- **Validation:** Pre-publish checks need quick turnaround

---

## 12. Troubleshooting

### Database Issues

*   **"Database not found":** Run `node db/init-database.js` to create database and apply migrations.
*   **"Migration failed":** Check that all migration files (001-004) are present in `db/migrations/`.
*   **"Foreign key constraint":** Ensure entities are created before events that reference them.

### Performance Issues

*   **Slow state reconstruction:** Check that snapshots are being created (query `asset_state_snapshots` table).
*   **Slow context assembly:** Verify that epistemic queries are indexed (check `epistemic_fact_ledger` indexes).
*   **Large database:** Run validation to check for orphaned data. Consider archiving old fictions.

### API Issues

*   **"Port 3000 in use":** Another process is using the port. Run `lsof -i :3000` to find it.
*   **"Port 8080 in use":** GUI port conflict. Edit `start.sh` to use different port.
*   **400 Bad Request errors:** Check request body against API documentation. Ensure required fields present and enum values valid.
*   **404 Not Found errors:** Verify resource IDs exist in database. Check that referenced entities were created first.

### Validation Issues

*   **Critical issues:** Address immediately - indicates database corruption or fundamental errors.
*   **Error issues:** Fix before publishing - logical inconsistencies that break story coherence.
*   **Warning issues:** Review individually - may be intentional authoring choices.
*   **Skipped rules:** Rules require schema elements not yet implemented. Safe to ignore unless blocking your workflow.

### GUI Issues

*   **Blank screen:** Check browser console for JavaScript errors. Verify API is running on port 3000.
*   **Drag-and-drop not working:** Event delegation requires clicking scene card, not buttons. Click background of card.
*   **Relationship graph empty:** Ensure project selected and relationships created via API first.
*   **Dashboard shows no data:** Create project, add entities, define arcs/conflicts/setups to populate widgets.