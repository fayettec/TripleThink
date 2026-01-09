# TripleThink JSON Schema v1.0 Documentation

## Overview

TripleThink is an event-sourced narrative construction system designed for managing multi-book fiction series with complex epistemic states. The schema uses a **separated metadata architecture** where lean entity data is stored separately from rich authorial metadata, enabling token-efficient queries.

**Schema Version**: 1.0.0
**Schema URL**: https://TripleThink-engine.dev/v1/schema

---

## Table of Contents

1. [Top-Level Structure](#top-level-structure)
2. [Project Section](#project-section)
3. [World Events](#world-events)
4. [Assets](#assets)
5. [Metadata Table](#metadata-table)
6. [Narrative Director](#narrative-director)
7. [Indexes](#indexes)
8. [Query Patterns](#query-patterns)
9. [Relationships](#relationships)
10. [Constraints](#constraints)

---

## Top-Level Structure

### Purpose
The root structure organizes all TripleThink data into logical sections that mirror the system's three-layer architecture:
- **Layer 1 (World Truth)**: `world_events` - what actually happened
- **Layer 2 (Character Perception)**: `assets.characters[].knowledge_state_timeline` - what characters believe
- **Layer 3 (Narrative Presentation)**: `narrative_director` - what readers see when

### Schema

```json
{
  "$schema": "https://TripleThink-engine.dev/v1/schema",
  "schema_version": "1.0.0",
  "project": {...},
  "world_events": [...],
  "assets": {...},
  "metadata": [...],
  "narrative_director": {...},
  "indexes": {...}
}
```

### Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `$schema` | string | Yes | Schema identifier for validation |
| `schema_version` | string | Yes | Version for compatibility checking |
| `project` | object | Yes | Project-level metadata |
| `world_events` | array | Yes | Ground truth event timeline |
| `assets` | object | Yes | Characters, objects, locations, fictions, systems |
| `metadata` | array | Yes | Separated metadata for all entities |
| `narrative_director` | object | Yes | Books/chapters/scenes structure |
| `indexes` | object | Yes | Query optimization indexes |

### Relationships
- All sections reference each other via IDs
- `metadata` references all other sections via `entity_id`
- `indexes` provide fast lookups into `world_events` and `assets`

---

## Project Section

### Purpose
Contains project-level information: series name, author, creation dates, and metadata reference.

### Query Patterns
- **Load project info**: `SELECT project WHERE id = "proj-*"`
- **Check schema version**: `project.schema_version`
- **Load project metadata optionally**: Check `project.read_metadata_mandatory`, fetch from `metadata` table if needed

### Schema

```json
{
  "id": "proj-*",
  "name": "Project Name",
  "author": "Author Name",
  "created": "ISO-8601 timestamp",
  "modified": "ISO-8601 timestamp",
  "description": "Project description",
  "meta_id": "meta-proj-*",
  "read_metadata_mandatory": false
}
```

### Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | string | Yes | Unique project identifier (prefix: `proj-`) |
| `name` | string | Yes | Human-readable project name |
| `author` | string | Yes | Author name |
| `created` | ISO-8601 | Yes | Project creation timestamp |
| `modified` | ISO-8601 | Yes | Last modification timestamp |
| `description` | string | No | Project description |
| `meta_id` | string | Yes | Reference to metadata entry |
| `read_metadata_mandatory` | boolean | Yes | If true, metadata must be loaded with entity |

### Constraints
- `id` must be unique across all projects
- `meta_id` must reference existing metadata entry
- `created` timestamp must be <= `modified` timestamp

---

## World Events

### Purpose
**World events are the single source of truth**. They represent objective reality—what actually happened in the story universe. All character knowledge, fictions, and narrative presentations derive from these ground truth events.

Events use a **multi-phase structure** to represent complex occurrences that unfold over time.

### Query Patterns
- **Get event by ID**: `world_events[id="evt-*"]`
- **Get events in time range**: `world_events[timestamp BETWEEN t1 AND t2]`
- **Get events by participant**: `indexes.events_by_participant[character_id]`
- **Get causal chain**: Follow `causal_links.causes` and `causal_links.effects`
- **Time-travel query**: Get all events before timestamp T, replay to reconstruct world state

### Schema

```json
{
  "id": "evt-*",
  "timestamp": "ISO-8601 timestamp",
  "type": "event_type",
  "summary": "Brief description",
  "meta_id": "meta-evt-*",
  "read_metadata_mandatory": true/false,
  "phases": [
    {
      "phase_id": "phase-*",
      "timestamp": "ISO-8601 timestamp",
      "summary": "Phase description",
      "facts_created": [
        {
          "fact_id": "fact-*",
          "content": "Fact description",
          "visibility": "ground_truth|witnessed_by_crew|limited_knowledge|epistemic_state",
          "confidence": "absolute|high|medium|low"
        }
      ],
      "participants": ["char-*", "sys-*"],
      "state_changes": [
        {
          "entity_id": "char-*|obj-*",
          "property": "property_name",
          "before": "value",
          "after": "value",
          "timestamp": "ISO-8601 timestamp"
        }
      ]
    }
  ],
  "causal_links": {
    "causes": ["evt-*"],
    "effects": ["evt-*"]
  }
}
```

### Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | string | Yes | Unique event identifier (prefix: `evt-`) |
| `timestamp` | ISO-8601 | Yes | When event began |
| `type` | string | Yes | Event classification |
| `summary` | string | Yes | Brief event description |
| `meta_id` | string | Yes | Reference to metadata entry |
| `read_metadata_mandatory` | boolean | Yes | If true, metadata required for scene rendering |
| `phases` | array | Yes | Event phases (chronological order) |
| `causal_links` | object | Yes | Cause/effect relationships |

#### Phase Object

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `phase_id` | string | Yes | Unique phase identifier within event |
| `timestamp` | ISO-8601 | Yes | When phase occurred |
| `summary` | string | Yes | Phase description |
| `facts_created` | array | Yes | Facts established by this phase |
| `participants` | array | Yes | Entity IDs present in phase |
| `state_changes` | array | Yes | State transitions triggered |

#### Fact Object

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `fact_id` | string | Yes | Unique fact identifier (prefix: `fact-`) |
| `content` | string | Yes | What the fact states |
| `visibility` | enum | Yes | Who can know this fact |
| `confidence` | enum | Yes | Certainty level |

**Visibility Levels**:
- `ground_truth`: Objective reality, author knows
- `witnessed_by_crew`: Anyone present knows
- `limited_knowledge`: Only specific characters know
- `epistemic_state`: Belief state, may be false

#### State Change Object

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `entity_id` | string | Yes | ID of entity whose state changed |
| `property` | string | Yes | Property name that changed |
| `before` | any | Yes | Value before change |
| `after` | any | Yes | Value after change |
| `timestamp` | ISO-8601 | Yes | Exact moment of change |

### Relationships
- Events reference `assets.characters` and `assets.systems` via `participants`
- Events reference other events via `causal_links`
- Events create facts that appear in character `knowledge_state_timeline`
- Events trigger state changes recorded in entity `state_timeline`

### Constraints
- Event IDs must be unique
- Phase timestamps must be >= event timestamp
- Phases must be in chronological order
- All `participants` must reference existing entities
- All `causal_links.causes` and `causal_links.effects` must reference existing events
- `state_changes.entity_id` must reference existing entity
- Facts are immutable—never edit, only add new events

---

## Assets

### Purpose
Assets are the entities that populate the story world: characters, objects, locations, fictions, and systems. Each asset type has a timeline structure to track state changes over time.

Assets use **separated metadata architecture**:
- Lean core data (always loaded)
- Rich metadata (loaded only when `read_metadata_mandatory = true` or explicitly requested)

### Structure

```json
"assets": {
  "characters": [...],
  "objects": [...],
  "locations": [...],
  "fictions": [...],
  "systems": [...]
}
```

---

### Characters

#### Purpose
Characters are story participants with identity, traits, knowledge states, relationships, and state timelines. The `knowledge_state_timeline` is critical for epistemic tracking.

#### Query Patterns
- **Get character by ID**: `assets.characters[id="char-*"]`
- **What does Character X know at time T?**: Query `knowledge_state_timeline`, find entry with `timestamp <= T`, check `facts_known`
- **Who knows Fact F?**: Query all characters, check if `fact_id` appears in their `knowledge_state_timeline`
- **Get character's relationships at time T**: Query `relationship_timeline` where `timestamp <= T`

#### Schema

```json
{
  "id": "char-*",
  "name": "Character Name",
  "role": "protagonist|antagonist|supporting|etc",
  "meta_id": "meta-char-*",
  "read_metadata_mandatory": true/false,
  "identity": {
    "full_name": "Full Name",
    "age": number,
    "profession": "Profession"
  },
  "core_traits": [
    {
      "trait": "trait_name",
      "strength": "very_high|high|medium|low"
    }
  ],
  "knowledge_state_timeline": [
    {
      "timestamp": "ISO-8601",
      "trigger_event_id": "evt-*",
      "facts_known": [
        {
          "fact_id": "fact-*",
          "belief": "true|false",
          "believed_alternative": "string (if belief=false)",
          "confidence": "absolute|high|medium|low",
          "source": "direct_experience|told_by_X|inferred|etc"
        }
      ]
    }
  ],
  "relationship_timeline": [
    {
      "timestamp": "ISO-8601",
      "other_character_id": "char-*",
      "relationship_type": "colleague|friend|enemy|etc",
      "sentiment": "positive|neutral|negative|complex",
      "trust_level": "absolute|high|medium|low|none"
    }
  ],
  "state_timeline": [
    {
      "timestamp": "ISO-8601",
      "property": "property_name",
      "value": "any"
    }
  ]
}
```

#### Key Fields

**knowledge_state_timeline**: Most critical field for epistemic tracking.
- Each entry represents character's knowledge at a specific point in time
- Entries are cumulative: new entry adds/updates facts, doesn't replace entire state
- `belief: "false"` means character has **false belief** about ground truth
- `believed_alternative` specifies what they incorrectly believe

**relationship_timeline**: Tracks how character's relationships evolve.
- New entry for each relationship change
- Can track multiple relationships with same character over time

**state_timeline**: Generic property tracking.
- Used for emotional states, physical states, status, etc.
- Flexible key-value structure

#### Relationships
- Characters appear in `world_events[].phases[].participants`
- Characters reference other characters in `relationship_timeline`
- Characters' knowledge states reference `world_events[].phases[].facts_created`
- Characters appear in `narrative_director.books[].acts[].chapters[].scenes[].pov_character`

#### Constraints
- Character IDs must be unique
- `knowledge_state_timeline` must be in chronological order
- `trigger_event_id` must reference existing event
- `facts_known[].fact_id` must reference fact created in some event
- `relationship_timeline.other_character_id` must reference existing character
- Cannot have belief="false" without `believed_alternative`

---

### Objects

#### Purpose
Physical objects in the story world with specifications, state tracking, and ownership.

#### Query Patterns
- **Get object by ID**: `assets.objects[id="obj-*"]`
- **Get object state at time T**: Query `state_timeline` where `timestamp <= T`
- **Find objects owned by entity X**: `assets.objects[ownership.owner_id="X"]`

#### Schema

```json
{
  "id": "obj-*",
  "name": "Object Name",
  "type": "object_type",
  "meta_id": "meta-obj-*",
  "read_metadata_mandatory": false,
  "specifications": {
    "key": "value"
  },
  "state_timeline": [
    {
      "timestamp": "ISO-8601",
      "property": "property_name",
      "value": "any"
    }
  ],
  "ownership": {
    "owner_id": "char-*|org-*",
    "ownership_type": "personal|government|corporate|etc"
  }
}
```

#### Relationships
- Objects appear in events as subjects or context
- Objects reference owners via `ownership.owner_id`

---

### Locations

#### Purpose
Physical locations in story world, supporting hierarchical relationships (e.g., room → building → city).

#### Query Patterns
- **Get location by ID**: `assets.locations[id="loc-*"]`
- **Get location hierarchy**: Follow `parent_location_id` recursively

#### Schema

```json
{
  "id": "loc-*",
  "name": "Location Name",
  "type": "location_type",
  "meta_id": "meta-loc-*",
  "read_metadata_mandatory": false,
  "properties": {
    "key": "value"
  },
  "parent_location_id": "loc-*"
}
```

#### Relationships
- Locations reference parent locations via `parent_location_id`
- Events occur at locations (implicit, can be added to event context)

---

### Fictions

#### Purpose
**Critical unique feature of TripleThink**: Fictions are false narrative systems with specific target audiences. They represent incompatible reality versions that coexist in different characters' minds.

Fictions enable modeling:
- Lies told to specific characters
- Propaganda systems
- Character delusions
- Competing narratives

#### Query Patterns
- **Get fiction by ID**: `assets.fictions[id="fiction-*"]`
- **Is Character X target of Fiction F?**: Check if `char-X` in `fiction.target_audience`
- **What fictions is Character X subject to?**: Query all fictions where `char-X` in `target_audience`
- **What facts does Fiction F contradict?**: Check `fiction.facts_contradicted`
- **Active fictions at time T**: Query `indexes.fictions_timeline` where `start <= T` and (`end > T` or `end = null`)

#### Schema

```json
{
  "id": "fiction-*",
  "name": "Fiction Name",
  "meta_id": "meta-fiction-*",
  "read_metadata_mandatory": true,
  "target_audience": ["char-*"],
  "created_by": ["char-*", "sys-*"],
  "created_timestamp": "ISO-8601",
  "core_narrative": "string",
  "facts_contradicted": [
    {
      "ground_truth_fact_id": "fact-*",
      "fictional_alternative": "string"
    }
  ],
  "constraints": ["string"],
  "exposure_triggers": [
    {
      "trigger": "string (condition description)",
      "consequence": "string (what happens)"
    }
  ],
  "active_period": {
    "start": "ISO-8601",
    "end": "ISO-8601 or null",
    "status": "active|collapsed|dormant"
  }
}
```

#### Key Fields

**target_audience**: CRITICAL. Array of character IDs who are subject to this fiction.
- **Must be explicit**: If character not in list, they know ground truth
- **Cannot expand without narrative justification**: Adding character to existing fiction requires new event
- **Audience boundaries are structural**: Fiction collapse often triggered by cross-audience contact

**facts_contradicted**: Maps ground truth facts to fictional alternatives.
- Each fiction creates alternate reality for target audience
- Fiction contradicts objective facts established in `world_events`

**constraints**: Conditions that must hold for fiction to remain stable.
- Example: "Eric must never discuss crash with MS-0014 crew"
- Violations may trigger fiction collapse

**exposure_triggers**: Conditions that cause fiction to collapse.
- When triggered, target audience learns ground truth
- Often involves evidence or cross-checking with knowing characters

#### Relationships
- Fictions contradict facts from `world_events[].phases[].facts_created`
- Fictions target characters from `assets.characters`
- Fictions appear in character `knowledge_state_timeline` as source of false beliefs
- Fictions tracked in `indexes.fictions_timeline`

#### Constraints
- Fiction IDs must be unique
- `target_audience` must be non-empty array
- All `target_audience` IDs must reference existing characters
- `facts_contradicted[].ground_truth_fact_id` must reference existing fact
- `created_by` must reference existing characters/systems
- **CRITICAL**: Target audience must remain stable unless explicit event expands it
- Active fiction (`active_period.status = "active"`) must have `end = null`

---

### Systems

#### Purpose
Non-human entities with agency: AI systems, organizations, etc. Systems can have knowledge states like characters.

#### Query Patterns
- **Get system by ID**: `assets.systems[id="sys-*"]`
- **What does System X know at time T?**: Query `knowledge_state_timeline` (same as characters)

#### Schema

```json
{
  "id": "sys-*",
  "name": "System Name",
  "type": "artificial_intelligence|organization|etc",
  "meta_id": "meta-sys-*",
  "read_metadata_mandatory": true/false,
  "identity": {
    "designation": "string",
    "creation_date": "ISO-8601",
    "key": "value"
  },
  "knowledge_state_timeline": [
    {
      "timestamp": "ISO-8601",
      "trigger_event_id": "evt-*",
      "facts_known": [
        {
          "fact_id": "fact-*",
          "belief": "true|false",
          "confidence": "absolute|high|medium|low",
          "source": "string"
        }
      ]
    }
  ]
}
```

#### Relationships
- Systems appear in `world_events[].phases[].participants`
- Systems can create fictions (`assets.fictions[].created_by`)

---

## Metadata Table

### Purpose
**Core innovation of TripleThink**: Metadata is separated from entities to enable token-efficient queries.

**Why Separated?**
- Simple queries (e.g., "What does Eric know?") don't need author notes
- Metadata loading is controlled by `read_metadata_mandatory` flag
- Result: **87% token savings** for lean queries

**When is Metadata Loaded?**
1. **Always**: If entity has `read_metadata_mandatory: true`
2. **On-demand**: When AI needs to render scene or needs creative guidance
3. **Never**: For simple fact lookups

### Query Patterns
- **Get metadata by entity ID**: `metadata[entity_id="X"]`
- **Check if metadata is mandatory**: Check entity's `read_metadata_mandatory` field
- **Load metadata for scene rendering**: Query all metadata for event, characters, location in scene

### Schema

```json
{
  "id": "meta-*",
  "entity_id": "any entity ID",
  "entity_type": "project|world_event|character|object|location|fiction|system",
  "author_notes": {
    "creative_intent": "string",
    "scene_notes": "string",
    "character_arc": "string",
    "themes": ["string"],
    "constraints": ["string"]
  },
  "ai_guidance": {
    "tone": "string",
    "scene_rendering": "string",
    "pov_recommendations": ["string"],
    "dramatic_beats": ["string"],
    "character_voice": "string",
    "internal_conflict": "string"
  },
  "dev_status": {
    "completeness": "complete|core_defined|initial_design|stub",
    "todo": ["string"],
    "uncertainties": ["string"],
    "warnings": ["string"]
  },
  "version_info": {
    "created": "ISO-8601",
    "modified": "ISO-8601",
    "changelog": ["string"]
  },
  "prose_guidance": {
    "voice": "string",
    "tone": "string",
    "pacing_notes": "string",
    "speech_patterns": "string",
    "body_language": "string"
  },
  "consistency_rules": ["string"]
}
```

### Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | string | Yes | Unique metadata identifier |
| `entity_id` | string | Yes | ID of entity this metadata describes |
| `entity_type` | enum | Yes | Type of entity |
| `author_notes` | object | No | Creative intent, themes, constraints |
| `ai_guidance` | object | No | Instructions for AI scene generation |
| `dev_status` | object | No | Development tracking |
| `version_info` | object | Yes | Creation/modification timestamps |
| `prose_guidance` | object | No | Writing style guidance |
| `consistency_rules` | array | No | Constraints that must hold |

#### Author Notes
- `creative_intent`: Why this entity exists in story
- `themes`: Thematic connections
- `constraints`: Rules that cannot be violated

#### AI Guidance
- `scene_rendering`: Instructions for generating prose
- `pov_recommendations`: Best POV characters for this entity
- `dramatic_beats`: Key moments to hit
- `character_voice`: How character speaks/thinks

#### Dev Status
- `completeness`: How fully defined the entity is
- `todo`: What still needs development
- `uncertainties`: Open questions
- `warnings`: Important constraints or gotchas

#### Consistency Rules
Array of rules that must be maintained:
- Example: "Fiction 2 target audience must remain [char-eric] only"
- Validation system should check these

### Relationships
- Each metadata entry references exactly one entity via `entity_id`
- Entities reference their metadata via `meta_id`

### Constraints
- Metadata IDs must be unique
- `entity_id` must reference existing entity
- One metadata entry per entity (1:1 relationship)
- Metadata is optional—entities can exist without metadata, but if they have `meta_id`, metadata must exist

---

## Narrative Director

### Purpose
The **Narrative Director** maps story structure (books, acts, chapters, scenes) to world events. It represents **Layer 3: Narrative Presentation**—what the reader sees when.

This is where **dramatic irony** is designed: controlling what information readers have vs. what POV characters know.

### Query Patterns
- **Get scene by ID**: Navigate `books[].acts[].chapters[].scenes[]`
- **Find scenes covering event E**: Query scenes where `event_ids` contains `E`
- **Get scenes with Character X as POV**: Query scenes where `pov_character = "char-X"`
- **Find dramatic irony moments**: Query scenes where `epistemic_constraints.dramatic_irony` is non-empty

### Schema

```json
{
  "books": [
    {
      "book_id": "book-*",
      "title": "string",
      "sequence": number,
      "acts": [
        {
          "act_id": "act-*",
          "title": "string",
          "sequence": number,
          "chapters": [
            {
              "chapter_id": "ch-*",
              "title": "string",
              "sequence": number,
              "scenes": [
                {
                  "scene_id": "scene-*",
                  "title": "string",
                  "event_ids": ["evt-*"],
                  "phase_ids": ["phase-*"],
                  "pov_character": "char-*",
                  "epistemic_constraints": {
                    "reader_knows": ["fact-*"],
                    "pov_character_knows": ["fact-*"],
                    "pov_character_false_beliefs": ["fact-*"],
                    "dramatic_irony": [
                      {
                        "reader_knows": "string",
                        "character_believes": "string",
                        "tension": "string"
                      }
                    ]
                  },
                  "temporal_scope": {
                    "start": "ISO-8601",
                    "end": "ISO-8601"
                  }
                }
              ]
            }
          ]
        }
      ],
      "meta_id": "meta-book-*",
      "read_metadata_mandatory": false
    }
  ]
}
```

### Key Concepts

#### Scene Structure
Each scene:
- References world events via `event_ids`
- Can reference specific event phases via `phase_ids`
- Has exactly one POV character
- Specifies what reader knows vs. what POV character knows
- Has temporal boundaries

#### Epistemic Constraints
**Most important feature for dramatic irony**:

- `reader_knows`: Facts reader has learned so far
- `pov_character_knows`: Facts POV character knows
- `pov_character_false_beliefs`: Facts POV character believes are false (subject to fictions)
- `dramatic_irony`: Explicit tension created by reader/character knowledge gap

**Example**:
```json
{
  "reader_knows": ["All crew survived"],
  "pov_character_knows": ["7 crew died"],
  "dramatic_irony": [
    {
      "reader_knows": "All crew survived crash",
      "character_believes": "7 crew died, only Eric survived",
      "tension": "Reader watches Eric grieve for people who are alive"
    }
  ]
}
```

This structure makes it possible to:
1. Generate scenes that maintain consistent knowledge boundaries
2. Build dramatic irony deliberately
3. Ensure characters never "leak" knowledge they shouldn't have

### Relationships
- Scenes reference `world_events` via `event_ids`
- Scenes reference event phases via `phase_ids`
- Scenes specify POV via `pov_character` (must be character or system ID)
- Scenes reference facts from `world_events[].phases[].facts_created`

### Constraints
- Scene IDs must be unique within book
- `event_ids` must reference existing events
- `phase_ids` must reference phases within referenced events
- `pov_character` must reference existing character or system
- `temporal_scope.start` must be <= `temporal_scope.end`
- Scenes within chapter must be in chronological order (by `temporal_scope.start`)
- Facts in `epistemic_constraints` must be established in prior events
- `pov_character_knows` must be subset of character's actual knowledge state at scene timestamp

---

## Indexes

### Purpose
Indexes provide fast query paths for common access patterns. They are **denormalized views** of the data—redundant but optimized for performance.

Indexes should be automatically generated/updated when source data changes.

### Query Patterns
- **Who knows what when?**: `epistemic_states_by_character[char_id][timestamp]`
- **What events involve Character X?**: `events_by_participant[char_id]`
- **Active fictions at time T?**: `fictions_timeline` where `start <= T` and (`end > T` or `end = null`)
- **Facts by visibility level**: `facts_by_visibility[visibility_level]`

### Schema

```json
{
  "epistemic_states_by_character": {
    "char-*": [
      {
        "timestamp": "ISO-8601",
        "event_id": "evt-*",
        "facts_known": ["fact-*"],
        "false_beliefs": [
          {
            "ground_truth_fact": "fact-*",
            "believed_falsehood": "string"
          }
        ]
      }
    ]
  },
  "events_by_participant": {
    "char-*|sys-*": ["evt-*"]
  },
  "fictions_timeline": [
    {
      "fiction_id": "fiction-*",
      "start_timestamp": "ISO-8601",
      "end_timestamp": "ISO-8601 or null",
      "status": "active|collapsed|dormant",
      "target_audience": ["char-*"],
      "creation_event": "evt-*",
      "activation_event": "evt-*"
    }
  ],
  "facts_by_visibility": {
    "ground_truth": ["fact-*"],
    "witnessed_by_crew": ["fact-*"],
    "limited_knowledge": ["fact-*"],
    "epistemic_state": ["fact-*"]
  }
}
```

### Epistemic States By Character
**Most critical index for epistemic queries**.

For each character, maintains chronological list of their knowledge states:
- What facts they know (and believe to be true)
- What facts they falsely believe

Enables queries like:
- "What does Eric know at 2033-07-05?"
- "When did Stella learn about Fiction 2?"

### Events By Participant
Maps character/system IDs to array of event IDs they participated in.

Enables:
- "Find all events involving Eric"
- "What did Stella witness?"

### Fictions Timeline
Chronological list of all fictions with their active periods.

Enables:
- "What fictions are active at time T?"
- "When did Fiction 2 collapse?"
- "Who was subject to which fictions?"

### Facts By Visibility
Groups facts by their visibility level.

Enables:
- "What are all ground truth facts?"
- "What facts are known only to limited characters?"

### Relationships
All indexes derive from source data:
- `epistemic_states_by_character` derives from `assets.characters[].knowledge_state_timeline`
- `events_by_participant` derives from `world_events[].phases[].participants`
- `fictions_timeline` derives from `assets.fictions`
- `facts_by_visibility` derives from `world_events[].phases[].facts_created[].visibility`

### Constraints
- Indexes must stay in sync with source data
- All IDs in indexes must reference existing entities
- Epistemic states must be in chronological order
- Fiction timeline entries must not overlap for same fiction

---

## Query Patterns

### Common Queries and How to Execute Them

#### 1. What does Character X know at time T?

```
1. Query: assets.characters[id="char-X"].knowledge_state_timeline
2. Filter: entries where timestamp <= T
3. Take: entry with latest timestamp <= T
4. Return: facts_known array
```

**Optimized**: Use `indexes.epistemic_states_by_character["char-X"]`

#### 2. Find all events involving Character X

```
1. Query: indexes.events_by_participant["char-X"]
2. Return: array of event IDs
3. Optional: Fetch full events from world_events
```

#### 3. Is Fact F known to Character X at time T?

```
1. Get Character X's knowledge state at time T (see Query 1)
2. Check if fact_id "F" appears in facts_known
3. Check belief field:
   - If belief="true": Character knows and believes fact
   - If belief="false": Character has false belief about fact
4. Return: {knows: boolean, believes: boolean, confidence: string}
```

#### 4. What fictions is Character X subject to at time T?

```
1. Query: indexes.fictions_timeline
2. Filter: entries where start_timestamp <= T and (end_timestamp > T or end_timestamp = null)
3. Filter: entries where "char-X" in target_audience
4. Return: array of fiction objects
```

#### 5. What's the ground truth about Event E?

```
1. Query: world_events[id="evt-E"]
2. Return: event object (this IS ground truth)
3. Iterate phases to get all facts_created with visibility="ground_truth"
```

#### 6. Find all characters who falsely believe Fact F at time T

```
1. Query: assets.characters (all)
2. For each character:
   a. Get knowledge state at time T
   b. Check if fact F is in facts_known with belief="false"
3. Return: array of character IDs with false beliefs
```

#### 7. Get scene covering Event E from Character X's POV

```
1. Query: narrative_director.books[].acts[].chapters[].scenes[]
2. Filter: scenes where "evt-E" in event_ids
3. Filter: scenes where pov_character = "char-X"
4. Return: scene object
```

#### 8. Find moments of dramatic irony in Book B

```
1. Query: narrative_director.books[book_id="book-B"]
2. Iterate: acts → chapters → scenes
3. Filter: scenes where epistemic_constraints.dramatic_irony is non-empty
4. Return: array of {scene_id, dramatic_irony objects}
```

#### 9. Reconstruct world state at time T (time-travel query)

```
1. Query: world_events where timestamp <= T
2. Sort: by timestamp ascending
3. For each event:
   a. Apply state_changes to entities
   b. Update character knowledge states
   c. Activate/deactivate fictions
4. Return: complete world state object
```

#### 10. Validate Fiction F hasn't been exposed

```
1. Query: assets.fictions[id="fiction-F"]
2. Get: target_audience, exposure_triggers
3. For each exposure trigger:
   a. Check if trigger condition has occurred
   b. Query events for evidence of trigger
4. Return: {exposed: boolean, trigger_events: []}
```

---

## Relationships

### Entity Relationship Diagram (Conceptual)

```
PROJECT
  ├─ references → METADATA

WORLD_EVENTS
  ├─ contains → PHASES
  │   ├─ creates → FACTS
  │   ├─ involves → CHARACTERS, SYSTEMS (participants)
  │   └─ triggers → STATE_CHANGES
  ├─ causes → other WORLD_EVENTS
  ├─ effects → other WORLD_EVENTS
  └─ references → METADATA

CHARACTERS
  ├─ has → KNOWLEDGE_STATE_TIMELINE
  │   └─ references → FACTS
  ├─ has → RELATIONSHIP_TIMELINE
  │   └─ references → other CHARACTERS
  ├─ has → STATE_TIMELINE
  ├─ participates_in → WORLD_EVENTS
  ├─ is_pov_for → SCENES
  ├─ is_target_of → FICTIONS
  └─ references → METADATA

FICTIONS
  ├─ targets → CHARACTERS (target_audience)
  ├─ contradicts → FACTS
  ├─ created_by → CHARACTERS, SYSTEMS
  └─ references → METADATA

SCENES
  ├─ covers → WORLD_EVENTS, PHASES
  ├─ has_pov → CHARACTER
  ├─ knows → FACTS (epistemic_constraints)
  └─ contains → DRAMATIC_IRONY

METADATA
  └─ describes → any entity (1:1 relationship)

INDEXES (derived)
  ├─ epistemic_states_by_character → aggregates CHARACTER knowledge
  ├─ events_by_participant → indexes EVENT participation
  ├─ fictions_timeline → tracks FICTION lifecycles
  └─ facts_by_visibility → categorizes FACTS
```

### Key Relationship Patterns

1. **Events create Facts, Characters know Facts**
   - Events establish ground truth via facts_created
   - Characters learn facts via knowledge_state_timeline
   - Fictions contradict facts

2. **Metadata is separated from all entities**
   - Every entity can have metadata (via meta_id)
   - Metadata loaded conditionally (controlled by read_metadata_mandatory)
   - Enables token-efficient queries

3. **Scenes bridge Events and Presentation**
   - Scenes reference events (what happened)
   - Scenes specify POV character (whose eyes)
   - Scenes define epistemic boundaries (what's revealed)

4. **Fictions overlay false realities on Characters**
   - Fictions target specific characters
   - Character knowledge_state shows belief="false" for contradicted facts
   - Fictions have lifecycle (creation, activation, collapse)

---

## Constraints

### Schema-Level Constraints

These constraints must be validated by any TripleThink implementation:

#### 1. ID Uniqueness
- All entity IDs must be globally unique
- ID prefixes must be respected:
  - `proj-*`: projects
  - `evt-*`: events
  - `phase-*`: event phases
  - `fact-*`: facts
  - `char-*`: characters
  - `obj-*`: objects
  - `loc-*`: locations
  - `fiction-*`: fictions
  - `sys-*`: systems
  - `book-*`: books
  - `act-*`: acts
  - `ch-*`: chapters
  - `scene-*`: scenes
  - `meta-*`: metadata

#### 2. Referential Integrity
- All ID references must point to existing entities:
  - `meta_id` must reference existing metadata entry
  - `event_ids` must reference existing events
  - `fact_id` must reference fact created in some event
  - `character_id` must reference existing character
  - All causal links must reference existing events

#### 3. Temporal Consistency
- Event phase timestamps must be >= event timestamp
- Event phases must be in chronological order
- Knowledge state timeline must be in chronological order
- Scene temporal_scope.start must be <= temporal_scope.end
- Fiction start_timestamp must be <= end_timestamp (if end is not null)

#### 4. Epistemic Consistency
- Facts in character knowledge_state must exist in world_events
- Character with belief="false" must have `believed_alternative`
- POV character in scene must know facts they reference in scene
- Dramatic irony requires knowledge gap: reader knows X, character doesn't

#### 5. Fiction Constraints
- Fiction target_audience must be non-empty
- Facts contradicted must reference existing facts
- Fiction status="active" requires end_timestamp=null
- Fiction status="collapsed" or "dormant" requires end_timestamp != null
- Target audience cannot expand without explicit event

#### 6. Metadata Consistency
- If entity has `meta_id`, metadata entry must exist
- Metadata `entity_id` must reference existing entity
- One metadata entry per entity (1:1 relationship)

#### 7. Causal Chain Validity
- If Event A causes Event B: A.timestamp <= B.timestamp
- Causal chains must not create cycles (no circular causation)

#### 8. Participant Validity
- All participants in events must exist
- Participants must be characters or systems (not objects/locations)

#### 9. State Change Validity
- State change entity_id must reference existing entity
- State change timestamp must be within event temporal bounds

#### 10. Narrative Director Constraints
- Scene event_ids must reference existing events
- Scene phase_ids must reference phases within referenced events
- Scene pov_character must reference existing character or system
- Scenes within chapter should be chronologically ordered
- Epistemic constraints must reference facts from prior events

---

## Version History

### v1.0.0 (2026-01-09)
- Initial schema design
- Separated metadata architecture
- Multi-phase event structure
- Fiction system with target audiences
- Epistemic state tracking
- Narrative director with dramatic irony support
- Comprehensive indexes

---

## Implementation Notes

### Token Efficiency Strategy

**Problem**: Large projects can have millions of tokens of metadata.

**Solution**: Separated metadata with conditional loading.

**Query Patterns**:
1. **Simple fact lookup**: Load entity only (no metadata) → 87% token savings
2. **Scene rendering**: Load entity + metadata for relevant entities
3. **Planning**: Load selective metadata as needed

**Example**:
```
Query: "What does Eric know about the crash?"
- Load: char-eric (lean)
- Load: char-eric.knowledge_state_timeline
- Filter: facts related to crash
- Result: ~500 tokens instead of ~4000 tokens
```

### Implementation Recommendations

1. **Database Schema**: Consider PostgreSQL with JSONB for flexible querying
2. **Indexes**: Create database indexes matching schema indexes
3. **Validation Layer**: Implement constraint checking on all mutations
4. **Metadata Loading**: Implement lazy loading with `read_metadata_mandatory` flag
5. **Causal Chain**: Implement graph traversal for cause/effect queries
6. **Time-Travel**: Implement event replay engine for state reconstruction
7. **Fiction Tracking**: Implement active fiction monitoring and exposure detection

### Performance Targets

- Get entity by ID: < 10ms
- Epistemic query (who knows what): < 100ms
- Complex join (events + characters + fictions): < 200ms
- Time-travel query (reconstruct state at time T): < 500ms
- Full scene render (load all needed entities + metadata): < 1s

---

## Appendix: Example Queries in Pseudocode

### Query: What does Eric know about the crash at 2033-07-06?

```python
def get_character_knowledge(char_id, timestamp, topic_keywords):
    # Get character
    char = db.get_character(char_id)

    # Find knowledge state at timestamp
    knowledge_states = char.knowledge_state_timeline
    relevant_state = max(
        [ks for ks in knowledge_states if ks.timestamp <= timestamp],
        key=lambda ks: ks.timestamp
    )

    # Filter facts by topic
    relevant_facts = [
        fact for fact in relevant_state.facts_known
        if any(keyword in fact.fact_id or keyword in get_fact_content(fact.fact_id)
               for keyword in topic_keywords)
    ]

    return relevant_facts

# Usage
eric_crash_knowledge = get_character_knowledge(
    "char-eric",
    "2033-07-06T00:00:00Z",
    ["crash", "ms0001", "entry", "landing"]
)
```

### Query: Is Fiction 2 stable at time T?

```python
def check_fiction_stability(fiction_id, timestamp):
    fiction = db.get_fiction(fiction_id)

    # Check if fiction is active
    if fiction.active_period.status != "active":
        return False, "Fiction not active"

    if fiction.active_period.start > timestamp:
        return False, "Fiction not yet active"

    # Check exposure triggers
    for trigger in fiction.exposure_triggers:
        # Query events for trigger conditions
        events = db.get_events_between(
            fiction.active_period.start,
            timestamp
        )

        if trigger_occurred(trigger, events, fiction.target_audience):
            return False, f"Exposure trigger: {trigger.trigger}"

    # Check constraint violations
    for constraint in fiction.constraints:
        if constraint_violated(constraint, timestamp):
            return False, f"Constraint violated: {constraint}"

    return True, "Fiction stable"
```

### Query: Find dramatic irony moments in Book 1

```python
def find_dramatic_irony(book_id):
    book = db.get_book(book_id)
    irony_moments = []

    for act in book.acts:
        for chapter in act.chapters:
            for scene in chapter.scenes:
                if scene.epistemic_constraints.dramatic_irony:
                    irony_moments.append({
                        "scene_id": scene.scene_id,
                        "scene_title": scene.title,
                        "chapter": chapter.title,
                        "irony": scene.epistemic_constraints.dramatic_irony
                    })

    return irony_moments
```

---

**End of Documentation**

For questions or clarifications about this schema, refer to the validation rules document or consult the TripleThink specification.
