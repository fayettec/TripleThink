# TripleThink v4.1 Schema Documentation

**Version**: 4.1.0
**Database**: SQLite3 with JSON1 extension
**Date**: January 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Core Tables](#core-tables)
3. [Event Processing Pipeline](#event-processing-pipeline)
4. [Epistemic System](#epistemic-system)
5. [Hybrid State Architecture](#hybrid-state-architecture)
6. [Logic Layer](#logic-layer)
7. [Design Principles](#design-principles)
8. [Query Patterns](#query-patterns)
9. [Performance Characteristics](#performance-characteristics)

---

## Overview

TripleThink v4.1 is an **event-sourced narrative construction database** designed for managing complex fiction series with precise epistemic tracking (who knows what, when). It combines three architectural layers:

1. **Foundation Layer**: Event sourcing with immutable facts
2. **Hybrid State Layer**: Snapshots + deltas for efficient queries
3. **Logic Layer**: Story structure tracking (causality, arcs, conflicts, themes)

The system tracks **three layers of reality** simultaneously:
- **Layer 1 (Ground Truth)**: What actually happened
- **Layer 2 (Character Knowledge)**: What each character believes
- **Layer 3 (Reader Perspective)**: What the reader sees when

---

## Core Tables

### 1. **projects** (Series Container)

Organizes all narrative data into distinct projects (typically one project = one series).

**Purpose**: Top-level container for organizing multi-book narratives.

### 2. **metadata** (Efficient Metadata Storage)

Stores author notes, AI guidance, and development status separately to optimize token usage when not needed.

**Design Note**: Metadata is optional and separate to keep queries lean when full context isn't needed.

### 3. **entities** (Polymorphic Storage)

Single table for all narrative entities: events, characters, objects, locations, systems.

**Entity Types**:
- `event`: Narrative events (immutable)
- `character`: Characters and NPCs
- `object`: Physical objects with properties
- `location`: Narrative locations
- `system`: Systems (governments, tech, magic systems)

### 4. **event_phases** (Event Decomposition)

Events can be complex and multi-phased. This table breaks them into sequential beats.

**Example**: A crisis event might have phases:
1. "Alert triggered"
2. "Evacuation order"
3. "Escape successful"

### 5. **facts** (Ground Truth)

Facts are immutable truths created by events. They form the single source of truth for what actually happened.

**Visibility Levels**:
- `ground_truth`: Objective fact (narrator/author knows)
- `witnessed_by_crew`: Multiple characters witnessed this
- `limited_knowledge`: Only specific characters know
- `epistemic_state`: Character belief, not ground truth

### 6. **relationships** (Entity Connections)

Tracks relationships between entities with temporal state evolution.

---

## Event Processing Pipeline

Events flow through this processing pipeline:

```
Event (entity)
  → Event Phases (decomposition)
    → Facts (ground truth)
      → Knowledge States (character beliefs)
        → Relationships (updated)
```

---

## Epistemic System

The epistemic system models **what each character knows/believes at each point in time**.

### Core Epistemic Tables:

#### **knowledge_states**
When a character's understanding changes.

#### **knowledge_state_facts**
Individual beliefs within a knowledge state.

### Epistemic Query Example

**Question**: "What does Captain believe about the malfunction at 14:35?"

1. Find knowledge state for Captain at 14:35
2. Query knowledge_state_facts for that state
3. Look for fact about malfunction
4. Return: {belief: 'false', believed_alternative: 'Systems reset normally', confidence: 'high'}

**Result**: Captain incorrectly believes the malfunction resolved itself (not knowing the full truth).

---

## Hybrid State Architecture

TripleThink v4.1 uses a **hybrid state system** that balances storage (pure events = 3MB) with query speed (pure snapshots = 300MB).

### Target Architecture:
- **Storage**: 48MB (vs 300MB pure snapshots, 3MB pure events)
- **Query Speed**: 60ms average (vs 5000ms pure events)

### Implementation:

#### **Timeline Versions** (Branching Support)
Enable branching narratives for "what if" scenarios.

#### **Asset State Snapshots** (Anchor Points)
Full state dumps at chapter starts, major events, or periodic checkpoints.

**Snapshot Types**:
- `chapter_start`: Beginning of each chapter
- `major_event`: After significant narrative events
- `periodic`: Every N events (e.g., every 50)
- `manual`: Author-created checkpoints

#### **Asset State Deltas** (Incremental Changes)
Only the diff from previous state, not full state.

**Change Categories**:
- `physical`: Health, location, appearance changes
- `psychological`: Emotional, mental state changes
- `knowledge`: New information learned
- `relationship`: Relationship status changes
- `location`: Position/movement changes
- `mixed`: Multiple categories

### State Reconstruction Algorithm

To get an asset's state at Event E:

1. Find nearest prior snapshot
2. Start with snapshot state or baseline
3. Get delta chain from snapshot to target event
4. Apply deltas in order
5. Return complete state

**Performance**: 60ms average for 100-delta chains (cached).

---

## Logic Layer

The Logic Layer adds story structure tracking to the foundation layer.

### Tables:

#### **causality_chains**
Links cause-effect relationships between events.

**Types**:
- `direct_cause`: A directly caused B
- `enabling_condition`: A made B possible
- `motivation`: A motivated character to do B
- `psychological_trigger`: A triggered character's emotional response

#### **character_arcs**
Tracks character development using Save the Cat structure.

**Save the Cat Phases**:
setup → catalyst → debate → break_into_two → fun_and_games → midpoint → bad_guys_close_in → all_is_lost → dark_night → break_into_three → finale → final_image

#### **story_conflicts**
Models active conflicts and dramatic tension.

**Conflict Types**:
- `internal`: Character vs self
- `interpersonal`: Character vs character
- `societal`: Character vs society
- `environmental`: Character vs environment

**Status Progression**:
latent → active → escalating → climactic → resolved

#### **thematic_elements**
Tracks themes being explored.

#### **motif_instances**
Tracks where patterns repeat.

**Motif Types**:
- `visual`: Visual recurring patterns
- `dialogue`: Speech/phrase patterns
- `situational`: Plot pattern repeats
- `symbolic`: Symbolic patterns
- `musical`: Audio/music patterns

#### **setup_payoffs**
Chekhov's guns, foreshadowing, clues, red herrings.

**Setup Types**:
- `chekhov_gun`: Tool planted that will be used
- `foreshadowing`: Hint of future events
- `promise`: Something promised to reader
- `clue`: Puzzle piece for mystery
- `red_herring`: False lead

**Status**:
planted → referenced → fired → abandoned

#### **world_rules**
Universe rules that should never be violated.

**Rule Categories**:
- `physics`: Physical laws
- `magic_system`: Magic rules
- `technology`: Tech limitations
- `cultural`: Cultural norms
- `historical`: Historical facts
- `biological`: Biology/medicine rules
- `societal`: Social structures
- `metaphysical`: Spiritual/philosophical rules

---

## Design Principles

### 1. **Event Sourcing**
- Events are immutable (never edited)
- New events always added, never deleted
- Complete audit trail always preserved

### 2. **Epistemic Precision**
- Always know who believes what, when
- False beliefs tracked explicitly
- Confidence levels on all knowledge

### 3. **ID-Based References**
- No data duplication
- All connections via ID
- Enables easy refactoring

### 4. **Polymorphism**
- Single entities table with type discrimination
- Reduces schema complexity
- Flexible for new entity types

### 5. **Hybrid State**
- Snapshots + deltas balance storage/speed
- Lossless reconstruction
- Efficient queries (<100ms)

### 6. **JSON Storage**
- SQLite JSON1 extension for nested data
- Type-specific data stored as JSON
- Flexible schema evolution

---

## Performance Characteristics

### Query Performance Targets

| Query | Target | Status |
|-------|--------|--------|
| State reconstruction (100 deltas) | <100ms | ✓ |
| Character knowledge state | <100ms | ✓ |
| Causal chain (50 events) | <200ms | ✓ |
| Orchestrator context assembly | <1s | ✓ |

### Storage Characteristics

| Dataset | Target | Notes |
|---------|--------|-------|
| 10-book series (5000 events) | <50MB | Hybrid architecture |
| Single book (500 events) | <5MB | Efficient deltas |
| Character with 1000 beliefs | <500KB | JSON storage |

---

## Next Steps

1. **API Layer**: REST endpoints for all tables
2. **Orchestrator**: Context assembly for AI scene generation
3. **Validation**: 100+ consistency rules
4. **Performance Tuning**: Query optimization
5. **Documentation**: User guides for AI agents

---

*End of Schema Documentation*
