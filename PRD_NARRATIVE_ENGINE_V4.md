# Product Requirements Document: TripleThink Narrative Engine v4.1 ("The Skippy Upgrade")

**Version:** 4.1  
**Date:** 2026-01-14  
**Status:** Draft  
**Target System:** TripleThink (Node.js/Express + SQLite)

## 1. Executive Summary

This document defines the upgrade path for TripleThink from its current v1.0 Event-Sourced architecture to the **v4.1 Narrative Engine**. The goal is to transform the system from a passive tracker of "what happened" into an active **Context Orchestration System**.

The v4.1 upgrade introduces a **Logic Layer** (handling causality, themes, and arcs) and a **Hybrid State Engine** (Snapshots + Deltas) to solve scalability issues. This enables "Zero-Knowledge Assembly," allowing AI agents to generate high-quality narrative scenes with perfect continuity without requiring a full-text context window of the entire novel.

## 2. System Architecture

The system is divided into four distinct layers:

### 2.1 Foundation Layer (Identity & History)
*   **Role:** Defines the immutable objective reality of the universe.
*   **Key Components:** Projects, Timeline Versions, Assets, World Events.
*   **Change:** Introduction of `timeline_versions` to support branching narratives (e.g., "Draft 1" vs "Draft 2").

### 2.2 Logic Layer (Meaning & Causality)
*   **Role:** Defines *why* things happen and *what* they mean.
*   **Key Components:** Causality Chains, Character Arcs, Story Conflicts, Themes, Motifs, World Rules.
*   **New:** Entirely new semantic layer.

### 2.3 Context Matrix (The Brain)
*   **Role:** Tracks the state of every entity at every moment, filtered by perception.
*   **Key Components:** Hybrid State Engine (Snapshots + Deltas), Epistemic Fact Ledger (Who knows what), Relationship Dynamics, Dialogue Profiles.
*   **Optimization:** Implements the v4.1 "Skippy Compromise" to reduce storage overhead from ~300MB to ~50MB per book while maintaining <100ms query times.

### 2.4 Narrative Layer (The Syuzhet)
*   **Role:** Orchestrates how the story is told to the reader.
*   **Key Components:** Books, Narrative Scenes, Scene Transitions, Context Packets.
*   **Feature:** The "Context Orchestrator" generates prompt payloads for AI writers.

---

## 3. Database Schema Specification (SQLite Adaptation)

*Note: All `UUID` fields are stored as `TEXT`. All `JSONB` fields are stored as `TEXT` (JSON). Arrays are stored as JSON arrays.*

### 3.1 Foundation Layer

#### `timeline_versions`
Enables non-destructive branching of history.
```sql
CREATE TABLE timeline_versions (
    id TEXT PRIMARY KEY, -- UUID
    project_id TEXT NOT NULL,
    parent_version_id TEXT,
    branch_point_event_id TEXT, -- Where divergence occurred
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

### 3.2 Logic Layer (New Tables)

#### `causality_chains`
Tracks why events happen.
```sql
CREATE TABLE causality_chains (
    id TEXT PRIMARY KEY,
    cause_event_id TEXT NOT NULL,
    effect_event_id TEXT NOT NULL,
    type TEXT CHECK(type IN ('direct_cause', 'enabling_condition', 'motivation', 'psychological_trigger')),
    strength INTEGER, -- 1-10
    explanation TEXT,
    FOREIGN KEY (cause_event_id) REFERENCES entities(id),
    FOREIGN KEY (effect_event_id) REFERENCES entities(id)
);
```

#### `character_arcs`
Tracks internal change.
```sql
CREATE TABLE character_arcs (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL,
    archetype TEXT,
    lie_belief TEXT,
    truth_belief TEXT,
    want_external TEXT,
    need_internal TEXT,
    current_phase TEXT, -- 'setup', 'debate', 'midpoint', etc.
    FOREIGN KEY (character_id) REFERENCES entities(id)
);
```

#### `story_conflicts`
Tracks stakes and opposition.
```sql
CREATE TABLE story_conflicts (
    id TEXT PRIMARY KEY,
    type TEXT, -- 'internal', 'interpersonal', 'societal'
    protagonist_id TEXT NOT NULL,
    antagonist_source TEXT,
    stakes_success TEXT,
    stakes_fail TEXT,
    status TEXT CHECK(status IN ('latent', 'active', 'escalating', 'climactic', 'resolved')),
    FOREIGN KEY (protagonist_id) REFERENCES entities(id)
);
```

#### `thematic_elements`
Tracks recurring motifs and themes.
```sql
CREATE TABLE thematic_elements (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    statement TEXT, -- "Power corrupts"
    primary_symbol_id TEXT, -- Link to asset
    FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

### 3.3 Context Matrix (Hybrid State Engine)

#### `asset_state_snapshots` (Anchor Points)
Full state dumps at key intervals (e.g., Chapter starts).
```sql
CREATE TABLE asset_state_snapshots (
    id TEXT PRIMARY KEY,
    timeline_version_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    anchor_event_id TEXT NOT NULL,
    type TEXT CHECK(type IN ('chapter_start', 'major_event', 'manual')),
    state_json TEXT NOT NULL, -- Full JSON state
    FOREIGN KEY (timeline_version_id) REFERENCES timeline_versions(id),
    FOREIGN KEY (asset_id) REFERENCES entities(id),
    FOREIGN KEY (anchor_event_id) REFERENCES entities(id)
);
CREATE INDEX idx_snapshot_lookup ON asset_state_snapshots(asset_id, anchor_event_id);
```

#### `asset_state_deltas` (Changes)
Only what changed between snapshots.
```sql
CREATE TABLE asset_state_deltas (
    id TEXT PRIMARY KEY,
    timeline_version_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    previous_snapshot_id TEXT NOT NULL,
    changes_json TEXT NOT NULL, -- ONLY the diff
    change_category TEXT, -- 'physical', 'psychological', 'knowledge'
    FOREIGN KEY (previous_snapshot_id) REFERENCES asset_state_snapshots(id)
);
```

#### `relationship_dynamics`
Complex bond tracking.
```sql
CREATE TABLE relationship_dynamics (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    linked_event_id TEXT NOT NULL,
    metrics_json TEXT NOT NULL, -- {trust: 50, fear: 10, power_balance: -5}
    FOREIGN KEY (subject_id) REFERENCES entities(id),
    FOREIGN KEY (target_id) REFERENCES entities(id)
);
```

### 3.4 Narrative Layer

#### `narrative_scenes` (The Script)
Instructions for the Orchestrator.
```sql
CREATE TABLE narrative_scenes (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    chapter_index INTEGER,
    scene_index INTEGER,
    target_event_id TEXT NOT NULL,
    pov_character_id TEXT NOT NULL,
    narrative_voice TEXT, -- 'first', 'third_limited'
    context_config_json TEXT, -- {hide_facts: [], emphasize_themes: []}
    pacing_directive TEXT,
    FOREIGN KEY (target_event_id) REFERENCES entities(id)
);
```

---

## 4. Core Feature Specifications

### 4.1 Hybrid State Reconstruction Algorithm
**Goal:** Efficiently rebuild entity state at any point `T`.

**Logic:**
1.  Query `asset_state_snapshots` for `asset_id` where `anchor_event_timestamp <= T`, ordered descending. Limit 1.
2.  Load the `state_json` from the snapshot as `base_state`.
3.  Query `asset_state_deltas` for `asset_id` where `event_timestamp > snapshot_timestamp` AND `event_timestamp <= T`.
4.  Iterate through deltas and deep-merge `changes_json` into `base_state`.
5.  Return final state.

### 4.2 The Context Orchestrator (Zero-Knowledge Assembly)
**Goal:** Generate a "Context Packet" for AI generation without reading the book.

**Input:** `scene_id`
**Process:**
1.  **Fetch Scene Config:** Get POV, target event, and constraints.
2.  **Temporal Context:** Get event details (location, participants).
3.  **State Context:** Run Reconstruction Algorithm for POV and all participants.
4.  **Epistemic Context:** Query `knowledge_states` to filter what the POV *actually* knows vs. what is true.
5.  **Relational Context:** Fetch `relationship_dynamics` for POV vs. participants.
6.  **Logic Context:** Identify active `character_arcs`, `story_conflicts`, and `world_rules`.
7.  **Assembly:** Compile into a structured JSON/Markdown payload.

### 4.3 Pacing & Consistency Validator
**Goal:** Automated quality control.
*   **Rule Check:** "Does this scene violate a World Rule?"
*   **Arc Check:** "Does this scene advance the character's active phase?"
*   **Fact Check:** "Did the character mention a fact they don't know yet?"

---

## 5. Migration Strategy

### Phase 1: Foundation Upgrade
1.  Apply schema migration `003_v4_foundation.sql`.
2.  Create default `timeline_version` (Original Timeline).
3.  Assign all existing events/entities to the default timeline.

### Phase 2: Logic Injection
1.  Apply schema migration `004_v4_logic.sql`.
2.  Run "Ingestion Agent" (AI) to scan existing event summaries and auto-populate `causality_chains` and `character_arcs`.

### Phase 3: State Transformation
1.  Apply schema migration `005_v4_state_engine.sql`.
2.  **Snapshotting:** Create initial snapshots for all characters at Event 0.
3.  **Delta Conversion:** Script reads existing `state_timeline` table and converts entries into `asset_state_deltas`.
4.  **Verification:** Compare `get_state(T)` from old system vs new system.

---

## 6. Implementation Plan

1.  **Database Migration:** Write SQL scripts for new tables.
2.  **Models (API):** Create Data Access Objects (DAOs) for new tables.
3.  **State Engine Service:** Implement the Snapshot+Delta reconstruction logic in `api/services/state-engine.js`.
4.  **Orchestrator Service:** Implement the context packet builder in `api/services/orchestrator.js`.
5.  **GUI Update:** Add "Logic" tab (Arcs/Conflicts) and "Scene Builder" interface.
