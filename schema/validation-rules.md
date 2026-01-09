# TripleThink Schema Validation Rules v1.0

## Overview

This document specifies all validation rules that must be enforced by any TripleThink implementation. These rules ensure data integrity, temporal consistency, epistemic accuracy, and adherence to the event-sourced architecture.

**Validation Categories**:
1. ID and Referential Integrity
2. Temporal Consistency
3. Epistemic Consistency
4. Fiction System Rules
5. Metadata Consistency
6. Causal Chain Validity
7. Narrative Structure Rules
8. Event Sourcing Rules

---

## 1. ID and Referential Integrity

### Rule 1.1: Global ID Uniqueness
**Requirement**: All entity IDs must be globally unique across the entire schema.

**Validation**:
```
FOR each entity in [project, world_events, characters, objects, locations, fictions, systems, metadata]:
    ASSERT entity.id is unique across all entities
```

**Error**: `DUPLICATE_ID: Entity ID {id} appears multiple times`

---

### Rule 1.2: ID Prefix Conventions
**Requirement**: Entity IDs must use correct prefixes.

**Validation**:
```
ASSERT project.id starts with "proj-"
ASSERT world_event.id starts with "evt-"
ASSERT character.id starts with "char-"
ASSERT object.id starts with "obj-"
ASSERT location.id starts with "loc-"
ASSERT fiction.id starts with "fiction-"
ASSERT system.id starts with "sys-"
ASSERT metadata.id starts with "meta-"
ASSERT book.id starts with "book-"
ASSERT act.id starts with "act-"
ASSERT chapter.id starts with "ch-"
ASSERT scene.id starts with "scene-"
ASSERT phase.id starts with "phase-"
ASSERT fact.id starts with "fact-"
```

**Error**: `INVALID_ID_PREFIX: Entity {id} has invalid prefix for type {type}`

---

### Rule 1.3: Metadata References
**Requirement**: If entity has `meta_id`, corresponding metadata entry must exist.

**Validation**:
```
FOR each entity with meta_id:
    ASSERT metadata exists where metadata.id == entity.meta_id
    ASSERT metadata.entity_id == entity.id
```

**Error**: `MISSING_METADATA: Entity {entity_id} references non-existent metadata {meta_id}`

---

### Rule 1.4: Event References in Scenes
**Requirement**: Scene `event_ids` must reference existing events.

**Validation**:
```
FOR each scene in narrative_director:
    FOR each event_id in scene.event_ids:
        ASSERT world_event exists where world_event.id == event_id
```

**Error**: `INVALID_EVENT_REFERENCE: Scene {scene_id} references non-existent event {event_id}`

---

### Rule 1.5: Phase References in Scenes
**Requirement**: Scene `phase_ids` must reference phases within referenced events.

**Validation**:
```
FOR each scene in narrative_director:
    FOR each phase_id in scene.phase_ids:
        ASSERT phase exists in one of scene.event_ids events
        WHERE phase.phase_id == phase_id
```

**Error**: `INVALID_PHASE_REFERENCE: Scene {scene_id} references phase {phase_id} not in referenced events`

---

### Rule 1.6: Character/System References
**Requirement**: All character/system references must point to existing entities.

**Validation**:
```
FOR each reference in [
    event.phases[].participants,
    scene.pov_character,
    fiction.target_audience,
    fiction.created_by,
    relationship_timeline[].other_character_id
]:
    ASSERT entity exists in [characters, systems] where entity.id == reference
```

**Error**: `INVALID_CHARACTER_REFERENCE: Reference {ref} points to non-existent character/system`

---

### Rule 1.7: Fact References
**Requirement**: All `fact_id` references must point to facts created in world events.

**Validation**:
```
FOR each fact_reference in [
    knowledge_state_timeline[].facts_known[].fact_id,
    fiction.facts_contradicted[].ground_truth_fact_id,
    scene.epistemic_constraints.reader_knows,
    scene.epistemic_constraints.pov_character_knows
]:
    ASSERT fact exists in world_events[].phases[].facts_created
    WHERE fact.fact_id == fact_reference
```

**Error**: `INVALID_FACT_REFERENCE: Reference to non-existent fact {fact_id}`

---

### Rule 1.8: Causal Link References
**Requirement**: Causal links must reference existing events.

**Validation**:
```
FOR each event in world_events:
    FOR each cause_id in event.causal_links.causes:
        ASSERT world_event exists where world_event.id == cause_id
    FOR each effect_id in event.causal_links.effects:
        ASSERT world_event exists where world_event.id == effect_id
```

**Error**: `INVALID_CAUSAL_REFERENCE: Event {event_id} references non-existent causal event {causal_id}`

---

### Rule 1.9: Ownership References
**Requirement**: Object ownership must reference existing entities.

**Validation**:
```
FOR each object in assets.objects:
    IF object.ownership exists:
        ASSERT entity exists where entity.id == object.ownership.owner_id
```

**Error**: `INVALID_OWNER_REFERENCE: Object {obj_id} references non-existent owner {owner_id}`

---

### Rule 1.10: Location Parent References
**Requirement**: Parent location must exist.

**Validation**:
```
FOR each location in assets.locations:
    IF location.parent_location_id exists:
        ASSERT location exists in assets.locations
        WHERE location.id == parent_location_id
        AND location.id != parent_location_id  // No self-reference
```

**Error**: `INVALID_LOCATION_PARENT: Location {loc_id} references invalid parent {parent_id}`

---

## 2. Temporal Consistency

### Rule 2.1: Phase Timestamps Within Event
**Requirement**: Event phase timestamps must be >= event timestamp.

**Validation**:
```
FOR each event in world_events:
    FOR each phase in event.phases:
        ASSERT phase.timestamp >= event.timestamp
```

**Error**: `TEMPORAL_VIOLATION: Phase {phase_id} timestamp {phase_ts} precedes event {event_id} timestamp {event_ts}`

---

### Rule 2.2: Phase Chronological Order
**Requirement**: Phases within event must be in chronological order.

**Validation**:
```
FOR each event in world_events:
    FOR i in range(len(event.phases) - 1):
        ASSERT event.phases[i].timestamp <= event.phases[i+1].timestamp
```

**Error**: `PHASE_ORDER_VIOLATION: Phases in event {event_id} not in chronological order`

---

### Rule 2.3: Knowledge State Chronological Order
**Requirement**: Character knowledge states must be in chronological order.

**Validation**:
```
FOR each character in assets.characters:
    FOR i in range(len(character.knowledge_state_timeline) - 1):
        ASSERT character.knowledge_state_timeline[i].timestamp
            <= character.knowledge_state_timeline[i+1].timestamp
```

**Error**: `KNOWLEDGE_STATE_ORDER_VIOLATION: Character {char_id} knowledge states not chronological`

---

### Rule 2.4: State Timeline Chronological Order
**Requirement**: Entity state timelines must be in chronological order.

**Validation**:
```
FOR each entity with state_timeline:
    FOR i in range(len(entity.state_timeline) - 1):
        ASSERT entity.state_timeline[i].timestamp
            <= entity.state_timeline[i+1].timestamp
```

**Error**: `STATE_TIMELINE_ORDER_VIOLATION: Entity {entity_id} state timeline not chronological`

---

### Rule 2.5: Scene Temporal Scope
**Requirement**: Scene start must be <= end.

**Validation**:
```
FOR each scene in narrative_director:
    ASSERT scene.temporal_scope.start <= scene.temporal_scope.end
```

**Error**: `SCENE_TEMPORAL_VIOLATION: Scene {scene_id} start {start} after end {end}`

---

### Rule 2.6: Scene Chronological Order Within Chapter
**Requirement**: Scenes within chapter should be chronologically ordered.

**Validation** (Warning, not Error):
```
FOR each chapter in narrative_director:
    FOR i in range(len(chapter.scenes) - 1):
        IF chapter.scenes[i].temporal_scope.end > chapter.scenes[i+1].temporal_scope.start:
            WARN "Scene order may be non-chronological"
```

**Warning**: `SCENE_ORDER_WARNING: Scenes in chapter {ch_id} may not be chronological`

---

### Rule 2.7: Fiction Active Period
**Requirement**: Fiction start must be <= end (if end exists).

**Validation**:
```
FOR each fiction in assets.fictions:
    IF fiction.active_period.end is not null:
        ASSERT fiction.active_period.start <= fiction.active_period.end
```

**Error**: `FICTION_TEMPORAL_VIOLATION: Fiction {fiction_id} start after end`

---

### Rule 2.8: Fiction Status Consistency
**Requirement**: Active fictions must have end=null, collapsed/dormant must have end!=null.

**Validation**:
```
FOR each fiction in assets.fictions:
    IF fiction.active_period.status == "active":
        ASSERT fiction.active_period.end is null
    ELSE IF fiction.active_period.status in ["collapsed", "dormant"]:
        ASSERT fiction.active_period.end is not null
```

**Error**: `FICTION_STATUS_VIOLATION: Fiction {fiction_id} status {status} inconsistent with end timestamp`

---

### Rule 2.9: Causal Temporal Order
**Requirement**: Cause events must occur before or at same time as effect events.

**Validation**:
```
FOR each event in world_events:
    FOR each cause_id in event.causal_links.causes:
        cause_event = get_event(cause_id)
        ASSERT cause_event.timestamp <= event.timestamp
```

**Error**: `CAUSAL_TEMPORAL_VIOLATION: Effect {event_id} timestamp precedes cause {cause_id} timestamp`

---

### Rule 2.10: State Change Within Event Bounds
**Requirement**: State change timestamps must be within event temporal scope.

**Validation**:
```
FOR each event in world_events:
    FOR each phase in event.phases:
        FOR each state_change in phase.state_changes:
            ASSERT state_change.timestamp >= event.timestamp
            // Note: state change should also be <= phase end if tracked
```

**Error**: `STATE_CHANGE_TEMPORAL_VIOLATION: State change in event {event_id} has invalid timestamp`

---

### Rule 2.11: Project Timestamp Consistency
**Requirement**: Project created timestamp must be <= modified timestamp.

**Validation**:
```
ASSERT project.created <= project.modified
```

**Error**: `PROJECT_TIMESTAMP_VIOLATION: Created {created} after modified {modified}`

---

### Rule 2.12: Metadata Timestamp Consistency
**Requirement**: Metadata created timestamp must be <= modified timestamp.

**Validation**:
```
FOR each metadata in metadata:
    ASSERT metadata.version_info.created <= metadata.version_info.modified
```

**Error**: `METADATA_TIMESTAMP_VIOLATION: Metadata {meta_id} created after modified`

---

## 3. Epistemic Consistency

### Rule 3.1: Knowledge State Trigger Event Exists
**Requirement**: Knowledge state `trigger_event_id` must reference existing event.

**Validation**:
```
FOR each character in [assets.characters, assets.systems]:
    FOR each ks in character.knowledge_state_timeline:
        ASSERT world_event exists where world_event.id == ks.trigger_event_id
```

**Error**: `INVALID_TRIGGER_EVENT: Knowledge state references non-existent event {event_id}`

---

### Rule 3.2: False Belief Must Have Alternative
**Requirement**: If belief="false", must have `believed_alternative`.

**Validation**:
```
FOR each character in [assets.characters, assets.systems]:
    FOR each ks in character.knowledge_state_timeline:
        FOR each fact in ks.facts_known:
            IF fact.belief == "false":
                ASSERT fact.believed_alternative exists and is not empty
```

**Error**: `MISSING_BELIEVED_ALTERNATIVE: Fact {fact_id} has belief=false without alternative`

---

### Rule 3.3: Knowledge State Before Scene
**Requirement**: Facts in scene epistemic constraints must be established before scene.

**Validation**:
```
FOR each scene in narrative_director:
    FOR each fact_id in scene.epistemic_constraints[all fields]:
        fact = find_fact(fact_id)
        fact_event = find_event_containing_fact(fact_id)
        ASSERT fact_event.timestamp <= scene.temporal_scope.start
```

**Error**: `EPISTEMIC_TEMPORAL_VIOLATION: Scene {scene_id} references fact {fact_id} not yet established`

---

### Rule 3.4: POV Character Knowledge Consistency
**Requirement**: POV character must know facts they reference in scene.

**Validation**:
```
FOR each scene in narrative_director:
    pov_char = get_character(scene.pov_character)
    pov_knowledge = get_knowledge_state_at_time(pov_char, scene.temporal_scope.start)

    FOR each fact_id in scene.epistemic_constraints.pov_character_knows:
        ASSERT fact_id in pov_knowledge.facts_known
```

**Error**: `POV_KNOWLEDGE_VIOLATION: Scene {scene_id} POV character doesn't know fact {fact_id}`

---

### Rule 3.5: Dramatic Irony Requires Knowledge Gap
**Requirement**: Dramatic irony requires reader to know something POV character doesn't.

**Validation**:
```
FOR each scene in narrative_director:
    IF scene.epistemic_constraints.dramatic_irony is not empty:
        ASSERT len(scene.epistemic_constraints.reader_knows)
            > len(scene.epistemic_constraints.pov_character_knows)
        // Or check for specific knowledge gap in dramatic_irony facts
```

**Warning**: `DRAMATIC_IRONY_WARNING: Scene {scene_id} has dramatic_irony but unclear knowledge gap`

---

### Rule 3.6: Knowledge Source Validity
**Requirement**: Knowledge source must be valid type.

**Validation**:
```
valid_sources = [
    "direct_experience", "direct_sensor_data", "self_awareness",
    "told_by_X", "inferred", "read_from_X", "observed", "creator"
]

FOR each character in [assets.characters, assets.systems]:
    FOR each ks in character.knowledge_state_timeline:
        FOR each fact in ks.facts_known:
            ASSERT fact.source in valid_sources OR fact.source starts with "told_by_" OR fact.source starts with "read_from_"
```

**Warning**: `UNUSUAL_KNOWLEDGE_SOURCE: Fact {fact_id} has unusual source {source}`

---

### Rule 3.7: Fiction Target Knowledge State
**Requirement**: Characters in fiction target_audience should have false beliefs about contradicted facts.

**Validation** (Warning):
```
FOR each fiction in assets.fictions:
    IF fiction.active_period.status == "active":
        FOR each char_id in fiction.target_audience:
            char = get_character(char_id)
            ks = get_knowledge_state_at_time(char, current_time)

            FOR each contradicted in fiction.facts_contradicted:
                fact_entry = find_fact_in_knowledge_state(ks, contradicted.ground_truth_fact_id)
                IF fact_entry exists:
                    ASSERT fact_entry.belief == "false"
```

**Warning**: `FICTION_BELIEF_INCONSISTENCY: Fiction {fiction_id} target {char_id} doesn't have expected false belief`

---

## 4. Fiction System Rules

### Rule 4.1: Non-Empty Target Audience
**Requirement**: Fiction must have at least one target.

**Validation**:
```
FOR each fiction in assets.fictions:
    ASSERT len(fiction.target_audience) > 0
```

**Error**: `EMPTY_FICTION_AUDIENCE: Fiction {fiction_id} has empty target_audience`

---

### Rule 4.2: Target Audience References Valid Characters
**Requirement**: All fiction target_audience IDs must reference existing characters.

**Validation**:
```
FOR each fiction in assets.fictions:
    FOR each char_id in fiction.target_audience:
        ASSERT character exists where character.id == char_id
```

**Error**: `INVALID_FICTION_TARGET: Fiction {fiction_id} targets non-existent character {char_id}`

---

### Rule 4.3: Fiction Contradicts Existing Facts
**Requirement**: Contradicted facts must exist.

**Validation**:
```
FOR each fiction in assets.fictions:
    FOR each contradicted in fiction.facts_contradicted:
        ASSERT fact exists in world_events[].phases[].facts_created
        WHERE fact.fact_id == contradicted.ground_truth_fact_id
```

**Error**: `INVALID_FICTION_CONTRADICTION: Fiction {fiction_id} contradicts non-existent fact {fact_id}`

---

### Rule 4.4: Fiction Creators Exist
**Requirement**: Fiction creators must reference existing entities.

**Validation**:
```
FOR each fiction in assets.fictions:
    FOR each creator_id in fiction.created_by:
        ASSERT entity exists in [characters, systems] where entity.id == creator_id
```

**Error**: `INVALID_FICTION_CREATOR: Fiction {fiction_id} created by non-existent entity {creator_id}`

---

### Rule 4.5: Fiction Activation Event Exists
**Requirement**: If fiction has activation_event in indexes, event must exist.

**Validation**:
```
FOR each fiction_entry in indexes.fictions_timeline:
    IF fiction_entry.activation_event exists:
        ASSERT event exists where event.id == fiction_entry.activation_event
    IF fiction_entry.creation_event exists:
        ASSERT event exists where event.id == fiction_entry.creation_event
```

**Error**: `INVALID_FICTION_EVENT: Fiction timeline references non-existent event {event_id}`

---

### Rule 4.6: Fiction Target Audience Stability
**Requirement**: Fiction target_audience should not expand without explicit event.

**Validation** (Warning):
```
// Check for fiction modifications that expanded target_audience
// This requires version history tracking
FOR each fiction in assets.fictions:
    IF metadata exists for fiction:
        IF "target audience expanded" in metadata.version_info.changelog:
            // Check that expansion is justified by event
            WARN if no corresponding event
```

**Warning**: `FICTION_AUDIENCE_EXPANSION: Fiction {fiction_id} audience may have expanded without justification`

---

### Rule 4.7: Fiction Must Have Metadata
**Requirement**: Fictions should have `read_metadata_mandatory: true`.

**Validation** (Warning):
```
FOR each fiction in assets.fictions:
    IF fiction.read_metadata_mandatory == false:
        WARN "Fiction should have mandatory metadata"
```

**Warning**: `FICTION_METADATA_WARNING: Fiction {fiction_id} should have read_metadata_mandatory=true`

---

## 5. Metadata Consistency

### Rule 5.1: Metadata Entity Reference
**Requirement**: Metadata `entity_id` must reference existing entity.

**Validation**:
```
FOR each metadata in metadata:
    ASSERT entity exists where entity.id == metadata.entity_id
```

**Error**: `ORPHANED_METADATA: Metadata {meta_id} references non-existent entity {entity_id}`

---

### Rule 5.2: Metadata Entity Type Match
**Requirement**: Metadata `entity_type` must match actual entity type.

**Validation**:
```
FOR each metadata in metadata:
    entity = find_entity(metadata.entity_id)
    expected_type = get_entity_type(entity)
    ASSERT metadata.entity_type == expected_type
```

**Error**: `METADATA_TYPE_MISMATCH: Metadata {meta_id} entity_type {type} doesn't match entity {entity_id} actual type`

---

### Rule 5.3: One Metadata Per Entity
**Requirement**: Each entity can have at most one metadata entry.

**Validation**:
```
FOR each entity with meta_id:
    metadata_count = count(metadata where metadata.entity_id == entity.id)
    ASSERT metadata_count <= 1
```

**Error**: `DUPLICATE_METADATA: Entity {entity_id} has multiple metadata entries`

---

### Rule 5.4: Metadata Bidirectional Reference
**Requirement**: Entity meta_id must match metadata id, and vice versa.

**Validation**:
```
FOR each entity with meta_id:
    metadata = find_metadata(entity.meta_id)
    ASSERT metadata.entity_id == entity.id

FOR each metadata:
    entity = find_entity(metadata.entity_id)
    IF entity has meta_id:
        ASSERT entity.meta_id == metadata.id
```

**Error**: `METADATA_REFERENCE_MISMATCH: Entity {entity_id} and metadata {meta_id} have mismatched references`

---

### Rule 5.5: Version Info Required
**Requirement**: Metadata must have version_info with created and modified timestamps.

**Validation**:
```
FOR each metadata in metadata:
    ASSERT metadata.version_info exists
    ASSERT metadata.version_info.created exists
    ASSERT metadata.version_info.modified exists
```

**Error**: `MISSING_METADATA_VERSION: Metadata {meta_id} missing version_info`

---

### Rule 5.6: Consistency Rules Format
**Requirement**: Metadata consistency_rules should be non-empty strings.

**Validation** (Warning):
```
FOR each metadata in metadata:
    IF metadata.consistency_rules exists:
        FOR each rule in metadata.consistency_rules:
            IF rule is empty string:
                WARN "Empty consistency rule"
```

**Warning**: `EMPTY_CONSISTENCY_RULE: Metadata {meta_id} has empty consistency rule`

---

## 6. Causal Chain Validity

### Rule 6.1: No Circular Causation
**Requirement**: Causal chains must not create cycles.

**Validation**:
```
FOR each event in world_events:
    visited = set()
    stack = [event.id]

    WHILE stack is not empty:
        current = stack.pop()
        IF current in visited:
            ERROR "Circular causation detected"
        visited.add(current)

        current_event = get_event(current)
        FOR each cause_id in current_event.causal_links.causes:
            stack.append(cause_id)
```

**Error**: `CIRCULAR_CAUSATION: Causal chain contains cycle involving event {event_id}`

---

### Rule 6.2: Bidirectional Causal Links
**Requirement**: If Event A causes Event B, then B must list A in effects.

**Validation**:
```
FOR each event_A in world_events:
    FOR each event_B_id in event_A.causal_links.effects:
        event_B = get_event(event_B_id)
        ASSERT event_A.id in event_B.causal_links.causes
```

**Error**: `UNIDIRECTIONAL_CAUSAL_LINK: Event {event_A} causes {event_B} but reverse link missing`

---

### Rule 6.3: Causal Link Temporal Consistency
**Requirement**: Cause must precede or coincide with effect (checked in Rule 2.9).

---

## 7. Narrative Structure Rules

### Rule 7.1: Sequential Book Numbers
**Requirement**: Books should have sequential sequence numbers starting from 1.

**Validation**:
```
book_sequences = [book.sequence for book in narrative_director.books]
book_sequences.sort()
ASSERT book_sequences == [1, 2, 3, ..., len(books)]
```

**Warning**: `NON_SEQUENTIAL_BOOKS: Books have non-sequential sequence numbers`

---

### Rule 7.2: Sequential Act Numbers Within Book
**Requirement**: Acts within book should have sequential sequence numbers.

**Validation**:
```
FOR each book in narrative_director.books:
    act_sequences = [act.sequence for act in book.acts]
    act_sequences.sort()
    ASSERT act_sequences == [1, 2, 3, ..., len(acts)]
```

**Warning**: `NON_SEQUENTIAL_ACTS: Book {book_id} has non-sequential act numbers`

---

### Rule 7.3: Sequential Chapter Numbers Within Act
**Requirement**: Chapters within act should have sequential sequence numbers.

**Validation**:
```
FOR each act in all acts:
    chapter_sequences = [ch.sequence for ch in act.chapters]
    chapter_sequences.sort()
    ASSERT chapter_sequences == [1, 2, 3, ..., len(chapters)]
```

**Warning**: `NON_SEQUENTIAL_CHAPTERS: Act {act_id} has non-sequential chapter numbers`

---

### Rule 7.4: Scene IDs Unique Within Book
**Requirement**: Scene IDs must be unique within book.

**Validation**:
```
FOR each book in narrative_director.books:
    scene_ids = collect_all_scene_ids(book)
    ASSERT len(scene_ids) == len(set(scene_ids))  // No duplicates
```

**Error**: `DUPLICATE_SCENE_ID: Book {book_id} has duplicate scene ID {scene_id}`

---

### Rule 7.5: Scene POV Character Exists
**Requirement**: Scene POV character must exist.

**Validation**:
```
FOR each scene in all scenes:
    ASSERT character or system exists where id == scene.pov_character
```

**Error**: `INVALID_POV_CHARACTER: Scene {scene_id} POV {pov_char} doesn't exist`

---

### Rule 7.6: Scene Event Coverage
**Requirement**: Scene temporal scope should overlap with referenced event timestamps.

**Validation** (Warning):
```
FOR each scene in all scenes:
    FOR each event_id in scene.event_ids:
        event = get_event(event_id)
        IF event.timestamp < scene.temporal_scope.start OR event.timestamp > scene.temporal_scope.end:
            WARN "Event outside scene temporal scope"
```

**Warning**: `EVENT_TEMPORAL_MISMATCH: Scene {scene_id} temporal scope doesn't cover event {event_id}`

---

## 8. Event Sourcing Rules

### Rule 8.1: Events Are Immutable
**Requirement**: Once created, events should not be modified.

**Validation** (requires version tracking):
```
// Check metadata changelog for event modifications
FOR each event in world_events:
    IF metadata exists for event:
        IF "modified event" in metadata.version_info.changelog:
            WARN "Event was modified - violates immutability"
```

**Warning**: `EVENT_MODIFIED: Event {event_id} was modified, violates event sourcing principles`

---

### Rule 8.2: Facts Are Immutable
**Requirement**: Facts should not be edited; create new events instead.

**Validation** (requires version tracking):
```
// Similar to Rule 8.1, check for fact modifications
FOR each fact in all facts:
    IF fact metadata indicates modification:
        WARN "Fact was modified"
```

**Warning**: `FACT_MODIFIED: Fact {fact_id} was modified, should create new event instead`

---

### Rule 8.3: State Reconstruction via Replay
**Requirement**: Current state must be derivable by replaying events.

**Validation** (complex):
```
// Replay all events in chronological order
// Compare final state with current entity states
// This is a comprehensive integration test

reconstructed_state = {}
FOR each event in sorted(world_events, key=timestamp):
    apply_event_state_changes(event, reconstructed_state)

FOR each entity in all entities:
    latest_state = get_latest_state_from_timeline(entity)
    ASSERT reconstructed_state[entity.id] == latest_state
```

**Error**: `STATE_RECONSTRUCTION_FAILURE: Entity {entity_id} state doesn't match event replay`

---

### Rule 8.4: No Orphaned State Changes
**Requirement**: All state changes must be triggered by events.

**Validation**:
```
FOR each entity with state_timeline:
    FOR each state_entry in entity.state_timeline:
        // Check if there exists an event with state_change at this timestamp
        matching_event = find_event_with_state_change(
            entity.id,
            state_entry.property,
            state_entry.timestamp
        )

        IF not matching_event:
            WARN "State change without corresponding event"
```

**Warning**: `ORPHANED_STATE_CHANGE: Entity {entity_id} state change at {timestamp} has no corresponding event`

---

## 9. Index Consistency

### Rule 9.1: Epistemic Index Matches Character Knowledge
**Requirement**: Index epistemic_states_by_character must match character knowledge_state_timeline.

**Validation**:
```
FOR each character in assets.characters:
    indexed_states = indexes.epistemic_states_by_character[character.id]

    ASSERT len(indexed_states) == len(character.knowledge_state_timeline)

    FOR i in range(len(indexed_states)):
        ASSERT indexed_states[i].timestamp == character.knowledge_state_timeline[i].timestamp
        ASSERT indexed_states[i].event_id == character.knowledge_state_timeline[i].trigger_event_id
```

**Error**: `INDEX_MISMATCH: Epistemic index for {char_id} doesn't match knowledge_state_timeline`

---

### Rule 9.2: Events By Participant Index Matches Event Participants
**Requirement**: Index events_by_participant must match actual event participation.

**Validation**:
```
FOR each participant_id in indexes.events_by_participant:
    indexed_events = indexes.events_by_participant[participant_id]

    actual_events = [
        event.id for event in world_events
        if participant_id in any(phase.participants for phase in event.phases)
    ]

    ASSERT set(indexed_events) == set(actual_events)
```

**Error**: `INDEX_MISMATCH: Events_by_participant for {participant_id} doesn't match actual participation`

---

### Rule 9.3: Fictions Timeline Index Matches Fiction Active Periods
**Requirement**: Index fictions_timeline must match fiction active_period data.

**Validation**:
```
FOR each fiction in assets.fictions:
    index_entry = find_in(indexes.fictions_timeline, fiction_id=fiction.id)

    ASSERT index_entry.start_timestamp == fiction.active_period.start
    ASSERT index_entry.end_timestamp == fiction.active_period.end
    ASSERT index_entry.status == fiction.active_period.status
    ASSERT set(index_entry.target_audience) == set(fiction.target_audience)
```

**Error**: `INDEX_MISMATCH: Fictions_timeline for {fiction_id} doesn't match fiction active_period`

---

### Rule 9.4: Facts By Visibility Index Complete
**Requirement**: Index facts_by_visibility must include all facts.

**Validation**:
```
all_facts = collect_all_facts_from_events()
indexed_facts = flatten(indexes.facts_by_visibility.values())

ASSERT set(all_facts) == set(indexed_facts)
```

**Error**: `INDEX_INCOMPLETE: Facts_by_visibility missing facts or has extras`

---

### Rule 9.5: Facts By Visibility Correct Categorization
**Requirement**: Facts must be in correct visibility category.

**Validation**:
```
FOR each visibility_level in indexes.facts_by_visibility:
    FOR each fact_id in indexes.facts_by_visibility[visibility_level]:
        fact = find_fact(fact_id)
        ASSERT fact.visibility == visibility_level
```

**Error**: `INDEX_MISCATEGORIZATION: Fact {fact_id} in wrong visibility category`

---

## 10. Data Completeness

### Rule 10.1: Required Fields Present
**Requirement**: All required fields must be present and non-empty.

**Validation**:
```
// Check all required fields per entity type
// See schema documentation for required field lists

FOR each entity:
    FOR each required_field in get_required_fields(entity.type):
        ASSERT entity[required_field] exists and is not empty
```

**Error**: `MISSING_REQUIRED_FIELD: Entity {entity_id} missing required field {field}`

---

### Rule 10.2: Enum Values Valid
**Requirement**: Enum fields must have valid values.

**Validation**:
```
valid_enums = {
    "visibility": ["ground_truth", "witnessed_by_crew", "limited_knowledge", "epistemic_state"],
    "confidence": ["absolute", "high", "medium", "low"],
    "belief": ["true", "false"],
    "status": ["active", "collapsed", "dormant"],
    "completeness": ["complete", "core_defined", "initial_design", "stub"]
}

FOR each entity:
    FOR each enum_field in entity:
        IF enum_field in valid_enums:
            ASSERT entity[enum_field] in valid_enums[enum_field]
```

**Error**: `INVALID_ENUM_VALUE: Field {field} has invalid value {value}`

---

### Rule 10.3: Non-Empty Arrays Where Required
**Requirement**: Arrays that should have content must not be empty.

**Validation**:
```
// Check arrays that should have at least one element
FOR each event in world_events:
    ASSERT len(event.phases) > 0

FOR each phase in all phases:
    ASSERT len(phase.participants) > 0

FOR each fiction in assets.fictions:
    ASSERT len(fiction.target_audience) > 0
```

**Error**: `EMPTY_REQUIRED_ARRAY: Entity {entity_id} has empty {array_field}`

---

## 11. Advanced Consistency Rules

### Rule 11.1: Fiction Exposure Detection
**Requirement**: If fiction exposure trigger has occurred, fiction should be collapsed.

**Validation** (complex):
```
FOR each fiction in assets.fictions:
    IF fiction.active_period.status == "active":
        FOR each trigger in fiction.exposure_triggers:
            IF trigger_has_occurred(trigger, fiction, world_events):
                WARN "Fiction exposure trigger occurred but fiction still active"
```

**Warning**: `FICTION_EXPOSURE_UNHANDLED: Fiction {fiction_id} trigger {trigger} occurred but fiction still active`

---

### Rule 11.2: Character Knowledge Evolution Tracking
**Requirement**: Character knowledge changes should be triggered by events.

**Validation**:
```
FOR each character in assets.characters:
    FOR each ks in character.knowledge_state_timeline:
        trigger_event = get_event(ks.trigger_event_id)

        // Check that character was participant in trigger event
        // OR someone told them (check for communication event)
        character_was_involved = character.id in collect_participants(trigger_event)

        IF not character_was_involved:
            // Check for intermediary communication event
            communication_exists = check_for_communication_chain(
                trigger_event, character, ks.timestamp
            )

            IF not communication_exists:
                WARN "Character knowledge update without clear involvement"
```

**Warning**: `UNEXPLAINED_KNOWLEDGE_UPDATE: Character {char_id} knows {fact_id} without clear source`

---

### Rule 11.3: Relationship Timeline Triggers
**Requirement**: Relationship changes should correlate with events.

**Validation** (Warning):
```
FOR each character in assets.characters:
    FOR each rel in character.relationship_timeline:
        // Check if there's an event near this timestamp involving both characters
        related_events = find_events_with_both_participants(
            character.id,
            rel.other_character_id,
            timestamp_window=rel.timestamp
        )

        IF len(related_events) == 0:
            WARN "Relationship change without apparent event"
```

**Warning**: `UNEXPLAINED_RELATIONSHIP_CHANGE: Character {char_id} relationship with {other_id} changed without event`

---

## Validation Priority Levels

### Critical (Must Pass)
- All referential integrity rules (1.x)
- All temporal consistency rules (2.x)
- Core epistemic rules (3.1-3.4)
- Fiction system core rules (4.1-4.5)
- Metadata core rules (5.1-5.4)
- Causal chain validity (6.1-6.2)

### Important (Should Pass)
- Scene structure rules (7.x)
- Index consistency rules (9.x)
- Data completeness rules (10.x)
- Fiction metadata rules (4.6-4.7)

### Advisory (Warning Only)
- Event sourcing rules (8.x)
- Advanced consistency rules (11.x)
- Scene chronology (2.6)
- Knowledge evolution tracking (11.2)

---

## Validation Implementation Recommendations

### Validation Levels

**Level 1: Schema Validation**
- Check required fields, types, enums
- Fast validation on load
- ~50 rules

**Level 2: Referential Integrity**
- Check all ID references
- Medium speed
- ~20 rules

**Level 3: Temporal Consistency**
- Check chronological order, timestamps
- Medium speed
- ~15 rules

**Level 4: Semantic Consistency**
- Check epistemic rules, fiction rules, causal chains
- Slower, more complex
- ~25 rules

**Level 5: Deep Consistency**
- Check event sourcing, index consistency, advanced rules
- Slowest, comprehensive analysis
- ~15 rules

### Validation Modes

**Fast Mode**: Levels 1-2 only (critical errors)
**Standard Mode**: Levels 1-4 (recommended for normal use)
**Comprehensive Mode**: All levels (recommended before publishing)

---

## Validation Output Format

### Error Format
```json
{
  "level": "error|warning",
  "rule": "RULE_CODE",
  "message": "Human-readable description",
  "entity_id": "Affected entity ID",
  "details": {
    "field": "Specific field",
    "expected": "Expected value",
    "actual": "Actual value"
  },
  "suggestion": "How to fix"
}
```

### Example Error
```json
{
  "level": "error",
  "rule": "INVALID_FACT_REFERENCE",
  "message": "Character knowledge references non-existent fact",
  "entity_id": "char-eric",
  "details": {
    "field": "knowledge_state_timeline[1].facts_known[0].fact_id",
    "expected": "Valid fact ID from world_events",
    "actual": "fact-nonexistent"
  },
  "suggestion": "Ensure fact 'fact-nonexistent' is created in a world event before 2033-07-05"
}
```

---

## Summary Statistics

**Total Rules**: ~100
- Critical (must pass): ~40
- Important (should pass): ~35
- Advisory (warnings): ~25

**Validation Categories**:
1. ID and Referential Integrity: 10 rules
2. Temporal Consistency: 12 rules
3. Epistemic Consistency: 7 rules
4. Fiction System: 7 rules
5. Metadata Consistency: 6 rules
6. Causal Chain Validity: 2 rules
7. Narrative Structure: 6 rules
8. Event Sourcing: 4 rules
9. Index Consistency: 5 rules
10. Data Completeness: 3 rules
11. Advanced Consistency: 3 rules

---

**End of Validation Rules**

For questions about specific rules or implementation guidance, consult the schema documentation or TripleThink specification.
