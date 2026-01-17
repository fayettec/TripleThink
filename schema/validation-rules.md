# TripleThink Validation Rules

## Overview

Comprehensive database consistency validation with **106 rules** across **8 categories** ensuring database integrity, temporal consistency, epistemic correctness, and narrative coherence.

**Purpose:** Automated validation catches errors before they propagate through the system, maintaining data quality and preventing logical inconsistencies in complex narrative structures.

**Execution:** Run via `/api/validation` endpoint or programmatically via `TripleThinkValidator` class.

---

## Rule Categories

### 1. Referential Integrity (RI-1 to RI-15)

Critical rules ensuring foreign key consistency and entity references.

**RI-1: Entity ID Prefix Match**
- **Severity:** Critical
- **Description:** Entity IDs must match their type prefix
- **Check:** Events start with `evt-`, characters with `char-`, objects with `obj-`, locations with `loc-`, systems with `sys-`
- **Fix:** Correct entity ID or type field to match convention

**RI-2: Foreign Key Validity**
- **Severity:** Critical
- **Description:** All foreign keys must reference existing records
- **Check:** entities.project_id → projects.id, fictions.project_id → projects.id
- **Fix:** Remove orphaned records or restore referenced parent records

**RI-3: Metadata References**
- **Severity:** Error
- **Description:** Metadata must reference existing entities and fictions
- **Check:** metadata.entity_id → entities.id, metadata.fiction_id → fictions.id
- **Fix:** Delete orphaned metadata or restore referenced entities

**RI-4: Fiction Project References**
- **Severity:** Critical
- **Description:** Every fiction must belong to valid project
- **Check:** fictions.project_id → projects.id
- **Fix:** Restore project or reassign fiction to valid project

**RI-5: Scene Fiction References**
- **Severity:** Critical
- **Description:** Narrative scenes must reference existing fictions
- **Check:** narrative_scenes.fiction_id → fictions.id
- **Fix:** Delete orphaned scenes or restore fiction

**RI-6: Epistemic Entity References**
- **Severity:** Error
- **Description:** Epistemic fact ledger must reference existing entities
- **Check:** epistemic_fact_ledger.entity_id → entities.id
- **Fix:** Remove orphaned knowledge states or restore entities

**RI-7: Relationship Entity References**
- **Severity:** Error
- **Description:** Relationship dynamics must reference existing entities for both sides
- **Check:** relationship_dynamics.entity_a_id → entities.id, entity_b_id → entities.id
- **Fix:** Delete invalid relationships or restore missing entities

**RI-8: Causality Event References**
- **Severity:** Error
- **Description:** Causality chains must reference existing events
- **Check:** causality_chains.cause_event_id → events.event_uuid, effect_event_id → events.event_uuid
- **Fix:** Remove invalid causality chains or restore events (Note: Events table may not exist in current schema)

**RI-9: Character Arc References**
- **Severity:** Error
- **Description:** Character arcs must reference existing character entities
- **Check:** character_arcs.character_id → entities.id WHERE entity_type='character'
- **Fix:** Delete invalid arcs or create character entity

**RI-10: Setup Payoff References**
- **Severity:** Error
- **Description:** Setup/payoff tracking must reference existing events
- **Check:** setup_payoffs.setup_event_id → events.event_uuid, payoff_event_id → events.event_uuid
- **Fix:** Remove invalid setup/payoffs or restore events

**RI-11: Transition Scene References**
- **Severity:** Error
- **Description:** Scene transitions must reference existing scenes
- **Check:** scene_transitions.from_scene_id → narrative_scenes.id, to_scene_id → narrative_scenes.id
- **Fix:** Delete orphaned transitions or restore scenes

**RI-12: Dialogue Profile References**
- **Severity:** Error
- **Description:** Dialogue profiles must reference existing entities
- **Check:** dialogue_profiles.entity_id → entities.id
- **Fix:** Delete orphaned profiles or restore entities

**RI-13: Pacing Checkpoint References**
- **Severity:** Warning
- **Description:** Pacing checkpoints should reference existing scenes when specified
- **Check:** pacing_checkpoints.scene_id → narrative_scenes.id (when not NULL)
- **Fix:** Update or clear invalid scene references

**RI-14: Vent Moment References**
- **Severity:** Warning
- **Description:** Vent moments must reference existing scenes and entities
- **Check:** vent_moments.scene_id → narrative_scenes.id, entity_id → entities.id
- **Fix:** Delete invalid vent moments or restore references

**RI-15: Theme Symbol References**
- **Severity:** Warning
- **Description:** Thematic elements should reference valid symbol entities
- **Check:** thematic_elements.primary_symbol_id → entities.id (when not NULL)
- **Fix:** Update or clear invalid symbol references

---

### 2. Temporal Consistency (TC-1 to TC-15)

Rules ensuring timeline coherence and timestamp validity.

**TC-1: Narrative Time Validity**
- **Severity:** Error
- **Description:** Narrative time must be non-negative and not NULL
- **Check:** narrative_scenes.narrative_time >= 0
- **Fix:** Set valid narrative_time for scenes

**TC-2: Scene Chronological Order**
- **Severity:** Warning
- **Description:** Scenes should progress chronologically by scene_number
- **Check:** Within fiction, narrative_time should increase with scene_number
- **Fix:** Reorder scenes or adjust narrative_time values

**TC-3: Epistemic Timestamp Match**
- **Severity:** Error
- **Description:** Epistemic fact acquisition timestamps must be valid
- **Check:** epistemic_fact_ledger.acquired_at >= 0
- **Fix:** Set valid acquired_at timestamps

**TC-4: Relationship Timestamp Validity**
- **Severity:** Warning
- **Description:** Relationship dynamics valid_from should be non-negative
- **Check:** relationship_dynamics.valid_from >= 0
- **Fix:** Correct invalid timestamps

**TC-5: No Duplicate Scene Numbers**
- **Severity:** Error
- **Description:** Scene numbers must be unique within fiction
- **Check:** No duplicate (fiction_id, scene_number) pairs
- **Fix:** Renumber duplicate scenes

**TC-6: Scene Duration Validity**
- **Severity:** Warning
- **Description:** Scene durations should be non-negative
- **Check:** narrative_scenes.duration_minutes >= 0 (when not NULL)
- **Fix:** Correct negative durations

**TC-7: Setup Fired After Planted**
- **Severity:** Error
- **Description:** Setup payoffs must fire after being planted
- **Check:** setup_payoffs.planted_chapter <= fired_chapter (lexicographically)
- **Fix:** Correct chapter ordering or fired status

**TC-8: Timestamps Not In Future**
- **Severity:** Error
- **Description:** System timestamps must not be in future
- **Check:** created_at <= current_time
- **Fix:** Correct future timestamps (system clock issue or data corruption)

**TC-9: Arc Phase Transitions Valid**
- **Severity:** Warning
- **Description:** Character arc phases must be valid Save the Cat beats
- **Check:** current_phase IN (setup, catalyst, debate, break_into_two, b_story, fun_and_games, midpoint, bad_guys_close_in, all_is_lost, dark_night_of_soul, break_into_three, finale, final_image)
- **Fix:** Use valid phase name

**TC-10: Conflict Status Transitions Valid**
- **Severity:** Warning
- **Description:** Conflict status must be valid
- **Check:** status IN (latent, active, escalating, climactic, resolved)
- **Fix:** Use valid status value

**TC-11: Transition Time Gaps Valid**
- **Severity:** Warning
- **Description:** Scene transition time gaps should be non-negative
- **Check:** scene_transitions.time_gap_minutes >= 0 (when not NULL)
- **Fix:** Correct negative time gaps

**TC-12: Pacing Checkpoint Ordering**
- **Severity:** Warning
- **Description:** Pacing checkpoints should follow narrative structure order
- **Check:** Checkpoints appear in reasonable order (inciting_incident → rising_action → midpoint → climax → resolution)
- **Fix:** Reorder checkpoints or adjust narrative_time

**TC-13: Vent Moment Timing Valid**
- **Severity:** Warning
- **Description:** Vent moments must have valid narrative_time
- **Check:** vent_moments.narrative_time >= 0
- **Fix:** Set valid narrative_time

**TC-14: Created At Timestamps Valid**
- **Severity:** Error
- **Description:** All created_at timestamps must be reasonable
- **Check:** projects, fictions, entities created_at not in future
- **Fix:** Correct system timestamps

**TC-15: Dialogue Profile Timestamp Order**
- **Severity:** Warning
- **Description:** Dialogue profiles for same entity should have increasing valid_from
- **Check:** For each entity, profiles ordered by valid_from
- **Fix:** Reorder or adjust valid_from timestamps

---

### 3. Epistemic Consistency (EC-1 to EC-12)

Rules ensuring knowledge tracking correctness and dramatic irony integrity.

**EC-1: Knowledge Before Revelation**
- **Severity:** Error
- **Description:** Characters cannot know facts before revelation events
- **Check:** Fact acquired_at >= revelation event timestamp
- **Fix:** Requires event timing data - currently skipped

**EC-2: False Beliefs Have True Facts**
- **Severity:** Error
- **Description:** Every false belief must have corresponding true fact
- **Check:** For each is_true=0 fact, matching is_true=1 fact exists with same fact_type and fact_key
- **Fix:** Create true fact or mark belief as true

**EC-3: Knowledge State Cumulative**
- **Severity:** Error
- **Description:** Knowledge should accumulate over time (no forgetting without explicit event)
- **Check:** Temporal analysis of knowledge persistence
- **Fix:** Requires temporal tracking - currently skipped

**EC-4: Dramatic Irony Tracked**
- **Severity:** Warning
- **Description:** False beliefs should exist to enable dramatic irony
- **Check:** Database contains at least some false beliefs (is_true=0)
- **Fix:** Add false beliefs where characters have incorrect knowledge

**EC-5: Fact Source Valid**
- **Severity:** Error
- **Description:** Fact source_type must be valid acquisition method
- **Check:** source_type IN (witnessed, told, deduced, read, overheard, assumed, remembered)
- **Fix:** Use valid source_type value

**EC-6: Fact Type Consistency**
- **Severity:** Warning
- **Description:** Fact types should be populated
- **Check:** fact_type values exist and are consistent
- **Fix:** Add fact_type classification

**EC-7: No Orphaned Knowledge States**
- **Severity:** Warning
- **Description:** Knowledge states should reference existing entities
- **Check:** All epistemic_fact_ledger.entity_id values exist in entities
- **Fix:** Remove orphaned knowledge or restore entities

**EC-8: Confidence Levels Valid**
- **Severity:** Warning
- **Description:** Confidence levels must be in 0-1 range
- **Check:** epistemic_fact_ledger.confidence BETWEEN 0 AND 1
- **Fix:** Clamp or correct confidence values

**EC-9: Source Entity Exists**
- **Severity:** Error
- **Description:** Source entity references must be valid
- **Check:** epistemic_fact_ledger.source_entity_id → entities.id (when not NULL)
- **Fix:** Remove invalid source references or restore entities

**EC-10: Fact Key Consistency**
- **Severity:** Warning
- **Description:** Fact keys should be populated for each fact type
- **Check:** Each fact_type has at least one fact_key
- **Fix:** Ensure fact_key values are meaningful

**EC-11: Fiction-Entity Epistemic Match**
- **Severity:** Error
- **Description:** Epistemic facts must align fiction/entity project mapping
- **Check:** entity.project_id matches fiction.project_id for epistemic entries
- **Fix:** Correct project/fiction associations

**EC-12: Forbidden Reveals Not Leaked**
- **Severity:** Warning
- **Description:** Forbidden reveals should not be leaked to characters
- **Check:** Scene-by-scene analysis of forbidden_reveal_ids
- **Fix:** Requires complex scene analysis - currently skipped

---

### 4. Fiction System (FS-1 to FS-10)

Rules ensuring project/fiction structure integrity.

**FS-1: Fiction Belongs to Project**
- **Severity:** Critical
- **Description:** Every fiction must belong to valid project
- **Check:** fictions.project_id → projects.id
- **Fix:** Restore project or delete orphaned fictions

**FS-2: Fiction Names Unique**
- **Severity:** Error
- **Description:** Fiction names must be unique within project
- **Check:** No duplicate (project_id, name) pairs
- **Fix:** Rename duplicate fictions

**FS-3: Fiction Has Entities**
- **Severity:** Warning
- **Description:** Fictions should have associated entities or scenes
- **Check:** Fiction has metadata entries or narrative_scenes
- **Fix:** Add entities/scenes or delete empty fiction

**FS-4: Entity Types Valid**
- **Severity:** Critical
- **Description:** Entity types must be recognized
- **Check:** entity_type IN (event, character, object, location, system)
- **Fix:** Correct entity_type to valid value

**FS-5: Metadata Valid JSON**
- **Severity:** Error
- **Description:** Metadata data field must contain valid JSON
- **Check:** JSON.parse(metadata.data) succeeds
- **Fix:** Repair JSON syntax or replace with valid JSON

**FS-6: Fiction ID Convention**
- **Severity:** Warning
- **Description:** Fiction IDs should follow 'fic-*' convention
- **Check:** fictions.id LIKE 'fic-%'
- **Fix:** Rename ID to follow convention (or accept non-standard ID)

**FS-7: Project ID Convention**
- **Severity:** Warning
- **Description:** Project IDs should follow 'proj-*' convention
- **Check:** projects.id LIKE 'proj-%'
- **Fix:** Rename ID to follow convention (or accept non-standard ID)

**FS-8: Project Has Fictions**
- **Severity:** Warning
- **Description:** Projects should contain at least one fiction
- **Check:** Project has associated fictions
- **Fix:** Add fiction or delete empty project

**FS-9: Entity ID Format Valid**
- **Severity:** Error
- **Description:** Entity IDs should follow format 'prefix-uuid'
- **Check:** entities.id matches pattern '___-%'
- **Fix:** Correct ID format

**FS-10: Metadata Updated After Created**
- **Severity:** Warning
- **Description:** Metadata updated_at should be >= created_at
- **Check:** metadata.updated_at >= metadata.created_at
- **Fix:** Correct timestamps (created/updated should not be reversed)

---

### 5. Narrative Consistency (NC-1 to NC-12)

Rules ensuring narrative structure coherence and scene validity.

**NC-1: Scenes Have Valid Chapters**
- **Severity:** Warning
- **Description:** Scenes should have chapter assignments
- **Check:** narrative_scenes.chapter_id IS NOT NULL
- **Fix:** Assign scenes to chapters

**NC-2: Present Entity IDs Valid**
- **Severity:** Error
- **Description:** Scene present_entity_ids must reference existing entities
- **Check:** All IDs in present_entity_ids JSON array exist in entities table
- **Fix:** Remove invalid entity IDs or restore entities

**NC-3: Active Conflict IDs Valid**
- **Severity:** Error
- **Description:** Scene active_conflict_ids must reference existing conflicts
- **Check:** All IDs in active_conflict_ids JSON array exist in story_conflicts table
- **Fix:** Remove invalid conflict IDs or restore conflicts

**NC-4: Active Theme IDs Valid**
- **Severity:** Error
- **Description:** Scene active_theme_ids must reference existing themes
- **Check:** All IDs in active_theme_ids JSON array exist in thematic_elements table
- **Fix:** Remove invalid theme IDs or restore themes

**NC-5: Chapter Numbering Sequential**
- **Severity:** Warning
- **Description:** Chapters should be numbered sequentially
- **Check:** Chapter IDs follow sequential pattern
- **Fix:** Informational only - chapter IDs may be non-sequential by design

**NC-6: Scene Numbering Sequential**
- **Severity:** Warning
- **Description:** Scenes should be numbered sequentially within fiction
- **Check:** No gaps in scene_number sequence per fiction
- **Fix:** Renumber scenes to fill gaps

**NC-7: Narrative Timeline Coherent**
- **Severity:** Error
- **Description:** Scenes must not overlap in timeline
- **Check:** scene.narrative_time + duration <= next_scene.narrative_time
- **Fix:** Adjust narrative_time or duration to prevent overlaps

**NC-8: Scene Transitions Valid**
- **Severity:** Warning
- **Description:** Scene transitions must reference existing scenes
- **Check:** scene_transitions.from_scene_id and to_scene_id exist
- **Fix:** Delete invalid transitions or restore scenes

**NC-9: Scene Tension Levels Valid**
- **Severity:** Warning
- **Description:** Tension levels must be in 0-1 range
- **Check:** narrative_scenes.tension_level BETWEEN 0 AND 1
- **Fix:** Clamp tension_level to valid range

**NC-10: Scene Status Valid**
- **Severity:** Warning
- **Description:** Scene status must be recognized value
- **Check:** status IN (draft, in_progress, complete, revised)
- **Fix:** Use valid status value

**NC-11: Entering/Exiting Entities Valid**
- **Severity:** Error
- **Description:** Scene entering/exiting entity IDs must reference existing entities
- **Check:** All IDs in entering_entity_ids and exiting_entity_ids JSON arrays exist in entities
- **Fix:** Remove invalid entity IDs or restore entities

**NC-12: Setup Payoff IDs Valid**
- **Severity:** Error
- **Description:** Scene setup_payoff_ids must reference existing setup/payoffs
- **Check:** All IDs in setup_payoff_ids JSON array exist in setup_payoffs table
- **Fix:** Remove invalid IDs or restore setup/payoffs

---

### 6. Logic Layer (LL-1 to LL-18)

Rules validating story structure elements (causality, arcs, conflicts, themes).

**LL-1: Causality Strength 1-10**
- **Severity:** Error
- **Description:** Causality chain strength must be 1-10 scale
- **Check:** causality_chains.strength BETWEEN 1 AND 10
- **Fix:** Adjust strength to valid range

**LL-2: Causality Type Valid**
- **Severity:** Critical
- **Description:** Causality type must be recognized relationship
- **Check:** type IN (direct_cause, enabling_condition, motivation, psychological_trigger)
- **Fix:** Use valid causality type

**LL-3: Arc Phase Valid**
- **Severity:** Critical
- **Description:** Character arc phase must be Save the Cat beat
- **Check:** current_phase IN (13 valid beats)
- **Fix:** Use valid phase name from Save the Cat structure

**LL-4: Arc Archetype Valid**
- **Severity:** Warning
- **Description:** Character archetype should be recognized type
- **Check:** archetype IN (hero, mentor, shadow, trickster, ally, herald, shapeshifter, guardian)
- **Fix:** Use standard archetype or accept custom value

**LL-5: Conflict Type Valid**
- **Severity:** Critical
- **Description:** Conflict type must be recognized category
- **Check:** type IN (internal, interpersonal, societal, environmental, supernatural)
- **Fix:** Use valid conflict type

**LL-6: Conflict Status Valid**
- **Severity:** Critical
- **Description:** Conflict status must be valid progression state
- **Check:** status IN (latent, active, escalating, climactic, resolved)
- **Fix:** Use valid conflict status

**LL-7: Setup Status Valid**
- **Severity:** Critical
- **Description:** Setup status must be valid tracking state
- **Check:** status IN (planted, referenced, fired, unfired)
- **Fix:** Use valid setup status

**LL-8: World Rule Category Valid**
- **Severity:** Critical
- **Description:** World rule category must be recognized domain
- **Check:** rule_category IN (physics, magic, technology, social, biological, metaphysical)
- **Fix:** Use valid category

**LL-9: World Rule Enforcement Valid**
- **Severity:** Critical
- **Description:** Enforcement level must be valid strictness
- **Check:** enforcement_level IN (strict, flexible, guideline)
- **Fix:** Use valid enforcement level

**LL-10: Theme Manifestations Valid JSON**
- **Severity:** Error
- **Description:** Theme manifestations must be valid JSON array
- **Check:** JSON.parse(manifestations) returns array
- **Fix:** Repair JSON or convert to array format

**LL-11: Motif Instances Link Valid**
- **Severity:** Error
- **Description:** Motif linked_entity_id must reference existing entity
- **Check:** motif_instances.linked_entity_id → entities.id (when not NULL)
- **Fix:** Remove invalid link or restore entity

**LL-12: Setup Payoff Temporal Order**
- **Severity:** Error
- **Description:** Payoff must occur after setup temporally
- **Check:** Requires event timestamp comparison
- **Fix:** Requires event timing data - currently skipped

**LL-13: No Circular Causality**
- **Severity:** Error
- **Description:** Causality chains must not form cycles
- **Check:** DFS cycle detection in causality graph
- **Fix:** Break circular dependencies

**LL-14: Arc Progression Monotonic**
- **Severity:** Warning
- **Description:** Arc phases should progress forward (not regress)
- **Check:** Requires historical phase tracking
- **Fix:** Requires change history - currently skipped

**LL-15: Conflict Protagonist Immutable**
- **Severity:** Critical
- **Description:** Conflict protagonist should not change after creation
- **Check:** Requires change tracking
- **Fix:** Requires audit log - currently skipped

**LL-16: Motif Type Valid**
- **Severity:** Critical
- **Description:** Motif type must be recognized pattern category
- **Check:** motif_type IN (visual, dialogue, situational, symbolic, musical)
- **Fix:** Use valid motif type

**LL-17: Conflict Stakes Not Empty**
- **Severity:** Warning
- **Description:** Conflicts should define stakes (success and failure)
- **Check:** stakes_success and stakes_fail are not NULL or empty
- **Fix:** Define what protagonist gains/loses

**LL-18: Arc Core Fields Present**
- **Severity:** Warning
- **Description:** Character arcs should define core transformation elements
- **Check:** lie_belief, truth_belief, want_external, need_internal not NULL
- **Fix:** Complete arc definition with lie/truth and want/need

---

### 7. State Integrity (SI-1 to SI-12)

Rules validating hybrid state system (snapshots, deltas, relationship states).

**SI-1: Snapshot References Valid**
- **Severity:** Error
- **Description:** Asset snapshots must reference valid assets
- **Check:** Requires asset_state_snapshots table
- **Fix:** Table does not exist in current schema - skipped

**SI-2: Delta Chain Valid**
- **Severity:** Error
- **Description:** Delta chains must form valid reconstruction paths
- **Check:** Requires state reconstruction module
- **Fix:** Module-based validation - currently skipped

**SI-3: Delta Chain Length Reasonable**
- **Severity:** Warning
- **Description:** Delta chains should not exceed reasonable length (<100)
- **Check:** Requires state tracking
- **Fix:** State tracking required - currently skipped

**SI-4: Snapshot Every 10 Events**
- **Severity:** Warning
- **Description:** Snapshots should exist at regular intervals (every 10 events)
- **Check:** Requires event counting
- **Fix:** Event-based validation - currently skipped

**SI-5: State Reconstruction Valid JSON**
- **Severity:** Error
- **Description:** Reconstructed state must produce valid JSON
- **Check:** Requires reconstruction module
- **Fix:** Module-based validation - currently skipped

**SI-6: No Orphaned Deltas**
- **Severity:** Warning
- **Description:** Deltas should reference existing snapshots
- **Check:** Requires delta tracking
- **Fix:** Delta tracking required - currently skipped

**SI-7: No Orphaned Snapshots**
- **Severity:** Warning
- **Description:** Snapshots should reference existing assets
- **Check:** Requires snapshot tracking
- **Fix:** Snapshot tracking required - currently skipped

**SI-8: Relationship State Changes Valid**
- **Severity:** Error
- **Description:** Relationship dynamics_json must be valid JSON
- **Check:** JSON.parse(dynamics_json) succeeds
- **Fix:** Repair JSON syntax

**SI-9: Dialogue Profile Valid From**
- **Severity:** Warning
- **Description:** Dialogue profile valid_from should be non-negative
- **Check:** dialogue_profiles.valid_from >= 0
- **Fix:** Correct negative timestamps

**SI-10: Pacing Checkpoint Tension Valid**
- **Severity:** Warning
- **Description:** Pacing checkpoint tension values must be 0-1 range
- **Check:** tension_target and actual_tension BETWEEN 0 AND 1
- **Fix:** Clamp tension values to valid range

**SI-11: Relationship Status Valid**
- **Severity:** Warning
- **Description:** Relationship status must be recognized state
- **Check:** status IN (active, estranged, ended, unknown)
- **Fix:** Use valid relationship status

**SI-12: Dialogue Profile JSON Fields Valid**
- **Severity:** Error
- **Description:** Dialogue profile JSON fields must be valid JSON
- **Check:** speech_patterns, quirks, topics_of_interest, topics_to_avoid, relationship_modifiers, context_modifiers, voice_hints are valid JSON
- **Fix:** Repair JSON syntax in profile fields

---

### 8. Cross-Entity (XE-1 to XE-12)

Rules validating relationships between different entity types.

**XE-1: Relationship Both Entities Exist**
- **Severity:** Critical
- **Description:** Both sides of relationship must reference existing entities
- **Check:** entity_a_id and entity_b_id exist in entities table
- **Fix:** Delete invalid relationships or restore missing entities

**XE-2: Relationship Values In Range**
- **Severity:** Error
- **Description:** Relationship attribute values must be in valid ranges
- **Check:** sentiment [-1,1], trust_level [0,1], power_balance [-1,1], intimacy_level [0,1], conflict_level [0,1]
- **Fix:** Clamp values to valid ranges

**XE-3: No Duplicate Relationships**
- **Severity:** Warning
- **Description:** Same relationship should not be defined multiple times
- **Check:** No duplicate (entity_a_id, entity_b_id, relationship_type, valid_from) tuples
- **Fix:** Remove duplicate relationship entries

**XE-4: Entity Metadata Consistency**
- **Severity:** Warning
- **Description:** Entity metadata should align with fiction/project structure
- **Check:** entity.project_id matches fiction.project_id for metadata entries
- **Fix:** Correct project/fiction associations

**XE-5: Causality Chains Connect Events**
- **Severity:** Error
- **Description:** Causality chains should connect existing events
- **Check:** Requires events table
- **Fix:** Events table required - currently skipped

**XE-6: Arcs Cover Present Characters**
- **Severity:** Warning
- **Description:** Major characters should have defined arcs
- **Check:** Characters (entity_type='character') have character_arcs entries
- **Fix:** Create arcs for untracked characters

**XE-7: Conflicts Reference Valid Antagonists**
- **Severity:** Error
- **Description:** Conflict antagonist_source should reference existing entity (if entity ID format)
- **Check:** antagonist_source starting with 'char-' or 'sys-' exists in entities
- **Fix:** Correct antagonist reference or restore entity

**XE-8: Themes Reference Valid Symbols**
- **Severity:** Warning
- **Description:** Theme primary_symbol_id should reference existing entity
- **Check:** thematic_elements.primary_symbol_id → entities.id (when not NULL)
- **Fix:** Remove invalid symbol reference or restore entity

**XE-9: Scene POV Entity Valid**
- **Severity:** Error
- **Description:** Scene POV must be character entity
- **Check:** narrative_scenes.pov_entity_id → entities.id WHERE entity_type='character'
- **Fix:** Use character entity for POV or clear POV field

**XE-10: Scene Location Entity Valid**
- **Severity:** Warning
- **Description:** Scene location should be location entity
- **Check:** narrative_scenes.location_id → entities.id WHERE entity_type='location'
- **Fix:** Use location entity for scene location

**XE-11: Vent Moment Entity Valid**
- **Severity:** Error
- **Description:** Vent moment entity must be character
- **Check:** vent_moments.entity_id → entities.id WHERE entity_type='character'
- **Fix:** Use character entity for vent moments

**XE-12: Transition Continuity Fields Valid**
- **Severity:** Warning
- **Description:** Scene transition continuity fields must be valid JSON
- **Check:** carried_tensions, resolved_tensions, entity_state_changes, validation_errors are valid JSON
- **Fix:** Repair JSON syntax in transition fields

---

## Severity Levels

**Critical:**
- Database corruption or data loss risk
- MUST fix immediately before continuing development
- Affects core system functionality
- Examples: Invalid foreign keys, missing required entities, type mismatches

**Error:**
- Logical inconsistency or broken references
- SHOULD fix before production deployment
- May cause features to fail or produce incorrect results
- Examples: Orphaned references, invalid enum values, missing required data

**Warning:**
- Best practice violation or data quality issue
- FIX when convenient, does not block operation
- May affect user experience or data completeness
- Examples: Empty optional fields, non-standard conventions, incomplete data

---

## Running Validation

### Via API

**Full validation report:**
```bash
curl http://localhost:3000/api/validation
```

**Summary only:**
```bash
curl http://localhost:3000/api/validation/summary
```

**Errors only:**
```bash
curl http://localhost:3000/api/validation/errors
```

**Warnings only:**
```bash
curl http://localhost:3000/api/validation/warnings
```

**Category-specific:**
```bash
curl http://localhost:3000/api/validation/category/epistemic_consistency
curl http://localhost:3000/api/validation/category/logic_layer
```

**Health check (critical and errors only):**
```bash
curl http://localhost:3000/api/validation/health
```

**List all categories and rules:**
```bash
curl http://localhost:3000/api/validation/categories
```

**Trigger validation job:**
```bash
curl -X POST http://localhost:3000/api/validation/run
```

### Programmatically

```javascript
const TripleThinkValidator = require('./api/services/validator');
const db = require('better-sqlite3')('./db/triplethink.db');

const validator = new TripleThinkValidator(db);
const report = await validator.validateDatabase();

console.log(`Passed: ${report.summary.passed}/${report.summary.total_rules}`);
console.log(`Failed: ${report.summary.failed}`);
console.log(`Critical: ${report.summary.critical}`);
console.log(`Errors: ${report.summary.errors}`);
console.log(`Warnings: ${report.summary.warnings}`);
```

---

## Report Structure

```json
{
  "timestamp": "2026-01-17T15:30:00.000Z",
  "summary": {
    "total_rules": 106,
    "passed": 100,
    "failed": 6,
    "warnings": 4,
    "critical": 0,
    "errors": 2
  },
  "categories": {
    "referential_integrity": {
      "category": "referential_integrity",
      "total": 15,
      "passed": 15,
      "failed": 0,
      "warnings": 0,
      "rules": [...]
    },
    ...
  },
  "errors": [
    {
      "category": "epistemic_consistency",
      "rule_id": "EC-2",
      "name": "False Beliefs Have True Facts",
      "severity": "error",
      "errors": ["False belief fb-123 has no corresponding true fact"],
      "warnings": []
    }
  ],
  "warnings": [...],
  "critical": [...]
}
```

---

## Performance Considerations

- **Full validation** runs all 106 rules and typically completes in < 2 seconds for databases with < 10,000 records
- **Health check** endpoint filters to critical/error severity for faster execution
- **Category-specific** validation runs only rules for one category (~10-18 rules) for targeted checks
- **Caching:** Results are not cached - validation runs fresh each time to catch recent changes

---

## Future Enhancements

### Planned Rules (Require Additional Schema Elements)

- Event temporal validation (requires EVENTS table)
- State reconstruction verification (requires asset state tables)
- Arc progression history (requires change tracking/audit log)
- Conflict protagonist immutability (requires change tracking)
- Knowledge-before-revelation detailed analysis (requires event timestamps)

### Optimization Opportunities

- Parallel rule execution for independent checks
- Incremental validation (only check changes since last validation)
- Rule prioritization (run critical rules first, abort on critical failures)
- Background validation jobs for large databases

---

**Last updated:** 2026-01-17
**Version:** 1.0
**Total rules:** 106 across 8 categories
