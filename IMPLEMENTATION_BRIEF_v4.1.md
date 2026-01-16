# TripleThink v4.1 Implementation Brief
## "START HERE" - Complete Context for New Session

**Date Created**: 2026-01-14
**Status**: APPROVED FOR IMPLEMENTATION
**Timeline**: 19 weeks (or 13-week MVP)
**Next Action**: Begin Week 1 (Hybrid State System)

---

## WHAT IS TRIPLETHINK?

**TripleThink** is an event-sourced narrative construction database designed for managing multi-book fiction series with complex epistemic states (who knows what when).

### Core Unique Features:
1. **Epistemic Tracking**: Precise tracking of character knowledge, beliefs, and false beliefs
2. **Fictions System**: Models lies, conspiracies, and false narratives with specific target audiences
3. **Event Sourcing**: Immutable event log as single source of truth
4. **Three Layers of Reality**:
   - Layer 1: World Truth (what actually happened)
   - Layer 2: Character Perception (what each character believes)
   - Layer 3: Narrative Presentation (what reader sees when)

### Current Status:
- **v1.0**: Fully implemented and working
- **Location**: `/app/` (Docker container or Windows local)
- **Tech Stack**: Node.js, Express, SQLite, plain HTML/CSS/JS
- **Database**: `/app/api/triplethink.db`

### User Interaction Model:
- Users do NOT interact with the database directly
- Users talk to Claude Code AI agents in natural language about their story
- AI agents manage TripleThink in the background
- **This means**: Schema complexity is NOT a concern for users

---

## WHAT IS v4.1?

**v4.1** is a major architectural evolution that transforms TripleThink from "epistemic truth tracker" into a complete **"Narrative Operating System"** with AI-assisted scene generation.

### Origin:
1. "Skippy" (a persona) proposed v4.0 with comprehensive story structure tools
2. Initial concern: Centralized state matrix would cause storage explosion (300MB-2GB)
3. Skippy responded with v4.1 **hybrid architecture**: snapshots + deltas
4. Result: 48MB storage, 60ms queries (vs 300MB, 5000ms)

### v4.1 Key Additions to v1.0:

#### Foundation Layer
- **TIMELINE_VERSIONS**: Branching timelines for "what if" scenarios
- **ASSET_STATE_SNAPSHOTS**: Full state at anchor points (chapter starts, major events)
- **ASSET_STATE_DELTAS**: Changes between snapshots (diff-based)
- **EVENT_MOMENTS**: Granular beats within events

#### Logic Layer (ALL NEW)
- **CAUSALITY_CHAINS**: Cause-effect tracking with strength/type
- **CHARACTER_ARCS**: Transformation tracking (lie/truth, want/need, Save the Cat phases)
- **STORY_CONFLICTS**: Protagonist/antagonist/stakes/escalation
- **THEMATIC_ELEMENTS**: Big ideas, questions, symbolic meaning
- **MOTIF_INSTANCES**: Recurring patterns (visual, dialogue, situational)
- **SETUP_PAYOFFS**: Chekhov's guns, foreshadowing, clues
- **WORLD_RULES**: Universe consistency (magic systems, tech limits, cultural norms)

#### Context Matrix (Enhanced)
- **EPISTEMIC_FACT_LEDGER**: Centralized fact tracking with accuracy beliefs
- **RELATIONSHIP_DYNAMICS**: Multidimensional (trust, fear, respect, power balance, hidden facts)
- **DIALOGUE_PROFILES**: Voice differentiation (vocabulary, tics, forbidden words)

#### Narrative Layer (Enhanced)
- **NARRATIVE_SCENES**: Enhanced with orchestration fields for AI generation
- **SCENE_TRANSITIONS**: Continuity tracking
- **PACING_CHECKPOINTS**: Tension curve, reader knowledge state

#### AI Integration (NEW)
- **ORCHESTRATOR**: Context assembly engine for zero-knowledge scene generation
  - Input: Scene ID
  - Output: Complete context packet (state, knowledge, relationships, conflicts, themes, dialogue profiles)
  - Purpose: AI writer receives only what it needs for that specific scene

---

## WHY v4.1?

### Problem v4.1 Solves:
1. **Scene Generation**: AI needs rich context to write consistent scenes
2. **Story Structure**: Authors need help tracking arcs, conflicts, setup/payoffs
3. **Consistency**: Multi-book series need causal tracking and world rules
4. **Revision Workflow**: Timeline branching enables "what if" exploration
5. **Scalability**: v4.0's approach would create storage explosion; v4.1 solves this

### v4.1 Hybrid Architecture Benefits:
- **Storage**: 48MB (vs 300MB pure snapshots, 3MB pure event sourcing)
- **Query Speed**: 60ms average (vs 5000ms pure event sourcing)
- **Complexity**: Balanced between write ease and read speed

### Business Value:
- **Competitive Advantage**: No other writing tool has this level of narrative intelligence
- **AI Integration**: Enables Claude Code to be a true "co-author" not just assistant
- **Market Position**: Transform from "tool" to "narrative operating system"

---

## DECISION SUMMARY

### What Was Decided:

1. **IMPLEMENT v4.1 COMPLETELY** (not selective adoption)
   - Rationale: AI handles complexity, users never see schema

2. **USE HYBRID STATE ARCHITECTURE** (Skippy's v4.1 solution)
   - Snapshots at: Chapter starts, major events, every 50 events
   - Deltas between snapshots
   - Reconstruction: Find nearest snapshot + apply delta chain

3. **PRESERVE v1.0 CORE** (especially FICTIONS system)
   - Fictions are unique to TripleThink
   - Must migrate cleanly from v1.0

4. **19-WEEK TIMELINE** (with 13-week MVP option)
   - Phased approach with gates
   - Test early and often
   - Performance benchmarks required

5. **ORCHESTRATOR IS CRITICAL**
   - Week 12 deliverable
   - Core AI integration point
   - Enables zero-knowledge scene assembly

### What Was Rejected:

1. **Pure Snapshot Approach**: Storage explosion
2. **Pure Event Sourcing**: Query performance too slow
3. **Selective Adoption**: Would create incomplete system
4. **User Complexity Concerns**: AI handles interface, not users

---

## IMPLEMENTATION PLAN STRUCTURE

### 7 Phases Over 19 Weeks

| Phase | Weeks | Goal | Key Deliverables |
|-------|-------|------|------------------|
| **1: Foundation** | 1-3 | Hybrid state + branching | Snapshots, deltas, reconstruction, timeline versions |
| **2: Logic Layer** | 4-7 | Story structure tracking | Causality, arcs, conflicts, themes, setup/payoffs, world rules |
| **3: Context** | 8-10 | Rich character data | Enhanced epistemic, relationships, dialogue profiles |
| **4: Orchestration** | 11-13 | AI scene generation | Enhanced scenes, context assembler, transitions, pacing |
| **5: API** | 14-15 | Expose functionality | REST endpoints, AI agent functions |
| **6: Validation** | 16-17 | Quality assurance | 100+ validation rules, performance testing |
| **7: Migration** | 18-19 | Launch readiness | v1.0→v4.1 scripts, documentation, examples |

### Critical Path:
1. **Week 1** (BLOCKER): Hybrid state system must work
2. **Weeks 4-10** (PARALLEL): Logic layer and context can be parallelized
3. **Week 12** (BLOCKER): Orchestrator depends on all prior work
4. **Week 18** (BLOCKER): Migration depends on complete schema

---

## WEEK 1: IMMEDIATE NEXT STEPS

### Goal: Hybrid State System Operational

**Location**: `/app/` directory

### Tasks (in order):

#### 1. Update Schema (2 hours)
**File**: `schema/schema.json`

Add two new tables:
```json
{
  "asset_state_snapshots": {
    "snapshot_uuid": "UUID PRIMARY KEY",
    "timeline_version_uuid": "UUID FK",
    "linked_asset_uuid": "UUID FK → SERIES_ASSETS",
    "anchor_event_uuid": "UUID FK → WORLD_TIMELINE_EVENTS",
    "snapshot_type": "ENUM: CHAPTER_START | MAJOR_EVENT | PERIODIC | MANUAL",
    "full_state_json": "JSONB",
    "created_timestamp": "TIMESTAMP"
  },
  "asset_state_deltas": {
    "delta_uuid": "UUID PRIMARY KEY",
    "timeline_version_uuid": "UUID FK",
    "linked_asset_uuid": "UUID FK → SERIES_ASSETS",
    "linked_event_uuid": "UUID FK → WORLD_TIMELINE_EVENTS",
    "previous_snapshot_uuid": "UUID FK → ASSET_STATE_SNAPSHOTS",
    "changes_json": "JSONB",
    "change_category": "ENUM: PHYSICAL | PSYCHOLOGICAL | KNOWLEDGE | RELATIONSHIP",
    "magnitude": "INTEGER (1-10)"
  }
}
```

#### 2. Create Snapshot Module (4 hours)
**File**: `db/state-snapshots.js` (NEW)

**Functions to implement**:
```javascript
// CRUD operations
createSnapshot(assetUuid, eventUuid, fullState, snapshotType)
getSnapshot(snapshotUuid)
getSnapshotsForAsset(assetUuid, timelineVersionUuid)
getNearestSnapshot(assetUuid, eventUuid) // Critical for reconstruction

// Snapshot creation logic
shouldCreateSnapshot(event) // Returns true if chapter start, major event, or N events since last
autoCreateSnapshots(timelineVersionUuid) // Batch create at appropriate points
```

**Database Indexes**:
```sql
CREATE INDEX idx_snapshots_asset_event ON asset_state_snapshots(linked_asset_uuid, anchor_event_uuid);
CREATE INDEX idx_snapshots_event ON asset_state_snapshots(anchor_event_uuid);
```

#### 3. Create Delta Module (4 hours)
**File**: `db/state-deltas.js` (NEW)

**Functions to implement**:
```javascript
// CRUD operations
createDelta(assetUuid, eventUuid, previousSnapshotUuid, changes, category, magnitude)
getDeltas(assetUuid, startEventUuid, endEventUuid) // Get delta chain
getDeltasForAsset(assetUuid, timelineVersionUuid)

// Delta computation
computeDelta(previousState, newState) // Returns only changed fields
  // Example: {physical: {health: -20}} if health changed from 80 to 60

// Delta application
applyDelta(state, delta) // Merges delta into state object
```

**Database Indexes**:
```sql
CREATE INDEX idx_deltas_asset_event ON asset_state_deltas(linked_asset_uuid, linked_event_uuid);
CREATE INDEX idx_deltas_snapshot ON asset_state_deltas(previous_snapshot_uuid);
```

#### 4. Create Reconstruction Module (8 hours)
**File**: `db/state-reconstruction.js` (NEW)

**Core function** (this is THE critical piece):
```javascript
/**
 * Reconstructs asset state at a specific event by:
 * 1. Finding nearest prior snapshot
 * 2. Applying delta chain from snapshot to target event
 * 3. Caching result for reuse
 *
 * @param {string} assetUuid - Asset to reconstruct
 * @param {string} targetEventUuid - Time point to reconstruct at
 * @param {string} timelineVersionUuid - Which timeline branch
 * @returns {Object} Complete state object
 */
async function getStateAtEvent(assetUuid, targetEventUuid, timelineVersionUuid) {
  // 1. Check cache first
  const cacheKey = `${assetUuid}:${targetEventUuid}`;
  if (stateCache.has(cacheKey)) {
    return stateCache.get(cacheKey);
  }

  // 2. Find nearest prior snapshot
  const snapshot = await getNearestSnapshot(assetUuid, targetEventUuid);

  let state;
  if (snapshot) {
    state = JSON.parse(JSON.stringify(snapshot.full_state_json)); // Deep copy
  } else {
    // No snapshot found, use baseline/initial state
    state = await getBaselineState(assetUuid);
  }

  // 3. Get all deltas between snapshot and target
  const deltas = await getDeltas(
    assetUuid,
    snapshot ? snapshot.anchor_event_uuid : null,
    targetEventUuid
  );

  // 4. Apply delta chain
  for (const delta of deltas) {
    state = applyDelta(state, delta.changes_json);
  }

  // 5. Cache result
  stateCache.set(cacheKey, state);

  return state;
}
```

**Cache implementation** (LRU):
```javascript
const LRU = require('lru-cache');
const stateCache = new LRU({
  max: 1000, // Cache up to 1000 states
  maxAge: 1000 * 60 * 10 // 10 minutes
});

function clearStateCache() {
  stateCache.reset();
}
```

**Helper functions**:
```javascript
getBaselineState(assetUuid) // Returns initial/default state
applyDelta(state, delta) // Merges delta into state
```

#### 5. Update API Functions (2 hours)
**File**: `db/api-functions.js` (UPDATE)

Add:
```javascript
module.exports = {
  ...existingFunctions,

  // State queries
  getAssetStateAtEvent,
  getMultipleAssetStatesAtEvent, // Batch query for scene
  createSnapshotAtEvent,
  recordStateChange, // Creates delta

  // Cache management
  clearStateCache
};
```

#### 6. Create API Route (2 hours)
**File**: `api/routes/state-queries.js` (NEW)

```javascript
const express = require('express');
const router = express.Router();
const db = require('../../db/api-functions');

// GET /api/state/:assetId/at/:eventId
router.get('/:assetId/at/:eventId', async (req, res) => {
  try {
    const state = await db.getAssetStateAtEvent(
      req.params.assetId,
      req.params.eventId,
      req.query.timelineVersion
    );
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/state/:assetId/snapshot
router.post('/:assetId/snapshot', async (req, res) => {
  try {
    const snapshot = await db.createSnapshotAtEvent(
      req.params.assetId,
      req.body.eventUuid,
      req.body.state,
      req.body.snapshotType
    );
    res.status(201).json(snapshot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/state/:assetId/change
router.post('/:assetId/change', async (req, res) => {
  try {
    const delta = await db.recordStateChange(
      req.params.assetId,
      req.body.eventUuid,
      req.body.newState
    );
    res.status(201).json(delta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

**Register route in `api/server.js`**:
```javascript
const stateQueryRoutes = require('./routes/state-queries');
app.use('/api/state', stateQueryRoutes);
```

#### 7. Testing (4 hours)

**Create test file**: `tests/performance/state-reconstruction.test.js`

```javascript
const assert = require('assert');
const db = require('../../db/api-functions');

describe('State Reconstruction', () => {
  it('should reconstruct state from snapshot + deltas', async () => {
    // Setup: Create snapshot at event-001
    await db.createSnapshotAtEvent('char-eric', 'evt-001', {
      physical: { health: 100, location: 'ship' },
      psychological: { emotion: 'calm' }
    }, 'MANUAL');

    // Create 10 deltas
    for (let i = 2; i <= 11; i++) {
      await db.recordStateChange('char-eric', `evt-00${i}`, {
        physical: { health: 100 - (i * 5) } // Health decreases
      });
    }

    // Test: Reconstruct at event-011
    const state = await db.getAssetStateAtEvent('char-eric', 'evt-011');

    // Verify
    assert.equal(state.physical.health, 50); // 100 - (10 * 5)
    assert.equal(state.physical.location, 'ship'); // Unchanged
  });

  it('should reconstruct within 100ms for 100-delta chain', async () => {
    // Setup: Create 100 deltas
    // ...

    const startTime = Date.now();
    const state = await db.getAssetStateAtEvent('char-test', 'evt-100');
    const duration = Date.now() - startTime;

    assert(duration < 100, `Took ${duration}ms, expected < 100ms`);
  });
});
```

**Run tests**:
```bash
cd /app
npm test -- tests/performance/state-reconstruction.test.js
```

---

### Week 1 Success Criteria

- ✅ `asset_state_snapshots` and `asset_state_deltas` tables exist in schema
- ✅ Snapshot CRUD operations work
- ✅ Delta computation correctly identifies changes
- ✅ State reconstruction produces accurate results
- ✅ Reconstruction time < 100ms for 100-delta chain
- ✅ API endpoints respond correctly
- ✅ All tests pass

### Week 1 Deliverables

**Files Created**:
- `db/state-snapshots.js`
- `db/state-deltas.js`
- `db/state-reconstruction.js`
- `api/routes/state-queries.js`
- `tests/performance/state-reconstruction.test.js`

**Files Modified**:
- `schema/schema.json` (added 2 tables)
- `db/api-functions.js` (added state functions)
- `api/server.js` (registered route)

**Verification Command**:
```bash
cd /app
npm test -- tests/performance/state-reconstruction.test.js
```

---

## WEEKS 2-19: OVERVIEW

### Week 2: Timeline Branching
- Create `TIMELINE_VERSIONS` table
- Branch creation/switching API
- UI for branch management

### Week 3: Foundation Polish
- `EVENT_MOMENTS` table
- Enhanced `WORLD_TIMELINE_EVENTS`
- Performance tuning

### Weeks 4-7: Logic Layer
- Week 4: Causality chains, setup/payoffs
- Week 5: Character arcs
- Week 6: Story conflicts
- Week 7: Themes, motifs, world rules

### Weeks 8-10: Context Matrix
- Week 8: Enhanced epistemic tracking
- Week 9: Relationship dimensions
- Week 10: Dialogue profiles

### Weeks 11-13: Orchestration
- Week 11: Enhanced scene structure
- **Week 12: THE ORCHESTRATOR** (critical AI integration)
- Week 13: Transitions, pacing

### Weeks 14-15: API & AI Integration
- Week 14: REST endpoints for all features
- Week 15: AI agent functions (MCP-style)

### Weeks 16-17: Validation & Testing
- Week 16: 100+ validation rules
- Week 17: Performance benchmarks

### Weeks 18-19: Migration & Launch
- Week 18: v1.0 → v4.1 migration scripts
- Week 19: Documentation, examples

---

## REFERENCE DOCUMENTS

### In This Repository:

1. **Full Implementation Plan**: `/root/.claude/plans/scalable-dancing-riddle.md`
   - Complete 19-week breakdown
   - Phase-by-phase tasks
   - Risk mitigation strategies

2. **v4.0 Original Spec**: (Provided by user as "Skippy Edition")
   - Complete table definitions
   - Workflow descriptions
   - Orchestration examples

3. **Current v1.0 Schema**:
   - `schema/schema.json`
   - `schema/schema-documentation.md`
   - `schema/validation-rules.md`

### Key Principles:

1. **Event Sourcing**: Never edit events, only add new ones
2. **Immutability**: Events and facts are immutable
3. **Epistemic Precision**: Always track who knows/believes what at each timestamp
4. **ID-Based References**: No data duplication, reference by ID
5. **Fiction Isolation**: Never expand target audiences without explicit design

---

## CRITICAL WARNINGS

### DO NOT:
1. ❌ Remove or break the FICTIONS system (unique to TripleThink)
2. ❌ Break v1.0 backward compatibility
3. ❌ Skip performance testing
4. ❌ Implement without testing each phase
5. ❌ Proceed to Phase N+1 before Phase N is complete

### DO:
1. ✅ Test after each major component
2. ✅ Benchmark performance against targets
3. ✅ Preserve v1.0 functionality throughout
4. ✅ Create rollback plans
5. ✅ Cache aggressively for state queries

---

## PERFORMANCE TARGETS

| Operation | Target | Critical? |
|-----------|--------|-----------|
| State reconstruction (100 deltas) | < 100ms | YES |
| Epistemic query | < 100ms | YES |
| Causal chain traversal (50 events) | < 200ms | NO |
| Orchestrator context assembly | < 1s | YES |
| Total storage (10-book series) | < 50MB | YES |
| Migration time (1000 events) | < 5 min | NO |

---

## SUCCESS DEFINITION

**v4.1 is complete when**:

1. All 21 tables implemented and tested
2. Hybrid state system operational (snapshots + deltas)
3. Orchestrator can assemble complete context packets
4. AI agents can query TripleThink via functions
5. All performance targets met
6. v1.0 → v4.1 migration works cleanly
7. 100+ validation rules pass
8. Fiction system preserved
9. Documentation complete

---

## CONTACT & CONTEXT

**Current Location**: `/app/` (Docker container `triple-think`)

**To Start Week 1**:
```bash
cd /app
# Follow "WEEK 1: IMMEDIATE NEXT STEPS" section above
# Start with task 1: Update schema.json
```

**If Confused**:
1. Read this document top-to-bottom again
2. Check `/root/.claude/plans/scalable-dancing-riddle.md` for detailed phase breakdowns
3. Reference current v1.0 schema at `schema/schema.json`

**Status Tracking**:
- Current phase: Foundation (Week 1)
- Next milestone: Week 1 completion (hybrid state system working)
- Overall goal: v4.1 production ready in 19 weeks

---

## FINAL SANITY CHECK

Before starting Week 1, verify:

- [ ] You understand what TripleThink is (epistemic narrative tracker)
- [ ] You understand what v4.1 adds (logic layer + orchestration)
- [ ] You understand why hybrid architecture (storage vs speed balance)
- [ ] You know where to start (Task 1: Update schema.json)
- [ ] You have the full 19-week plan available
- [ ] You know the performance targets
- [ ] You know success criteria

**If all checked: BEGIN WEEK 1, TASK 1**

---

*This document contains everything needed to implement v4.1 from scratch in a new context.*
*If anything is unclear, the problem is this document, not your understanding.*
*Read it again until it makes sense.*

**END OF IMPLEMENTATION BRIEF**
