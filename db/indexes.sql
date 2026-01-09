-- ============================================================
-- TRIPLETHINK INDEX DEFINITIONS
-- Optimized for common query patterns
-- ============================================================

-- Entities: type-based queries
CREATE INDEX idx_entities_type ON entities(entity_type);
CREATE INDEX idx_entities_timestamp ON entities(timestamp) WHERE timestamp IS NOT NULL;
CREATE INDEX idx_entities_meta ON entities(meta_id) WHERE meta_id IS NOT NULL;

-- Event phases: by event and sequence
CREATE INDEX idx_phases_event ON event_phases(event_id, sequence);
CREATE INDEX idx_phases_timestamp ON event_phases(timestamp);

-- Facts: by event, visibility
CREATE INDEX idx_facts_event ON facts(event_id);
CREATE INDEX idx_facts_phase ON facts(phase_id);
CREATE INDEX idx_facts_visibility ON facts(visibility);

-- Knowledge states: THE CRITICAL INDEX for epistemic queries
CREATE INDEX idx_knowledge_char_time ON knowledge_states(character_id, timestamp);
CREATE INDEX idx_knowledge_trigger ON knowledge_states(trigger_event_id);

-- Knowledge state facts: by fact for "who knows" queries
CREATE INDEX idx_ks_facts_fact ON knowledge_state_facts(fact_id);
CREATE INDEX idx_ks_facts_belief ON knowledge_state_facts(fact_id, belief);

-- Relationships: bidirectional lookup
CREATE INDEX idx_rel_from ON relationships(from_entity_id, timestamp);
CREATE INDEX idx_rel_to ON relationships(to_entity_id, timestamp);
CREATE INDEX idx_rel_type ON relationships(relationship_type);

-- State timeline: entity state at time T
CREATE INDEX idx_state_entity_time ON state_timeline(entity_id, timestamp);
CREATE INDEX idx_state_property ON state_timeline(entity_id, property, timestamp);

-- Fictions: active fictions at time T
CREATE INDEX idx_fictions_status ON fictions(status);
CREATE INDEX idx_fictions_period ON fictions(active_start, active_end);

-- Causal links: both directions
CREATE INDEX idx_causal_cause ON causal_links(cause_event_id);
CREATE INDEX idx_causal_effect ON causal_links(effect_event_id);

-- Narrative structure: hierarchy navigation
CREATE INDEX idx_narrative_parent ON narrative_structure(parent_id);
CREATE INDEX idx_narrative_type ON narrative_structure(structure_type, sequence);

-- Scenes: by chapter
CREATE INDEX idx_scenes_chapter ON scenes(chapter_id, sequence);
CREATE INDEX idx_scenes_pov ON scenes(pov_character_id);
CREATE INDEX idx_scenes_temporal ON scenes(temporal_start, temporal_end);

-- Scene events: scene-to-event mapping
CREATE INDEX idx_scene_events_scene ON scene_events(scene_id);
CREATE INDEX idx_scene_events_event ON scene_events(event_id);

-- Event participants: fast "events by character" lookup
CREATE INDEX idx_participants_event ON event_participants(event_id);
CREATE INDEX idx_participants_char ON event_participants(participant_id);

-- Metadata: by entity
CREATE INDEX idx_metadata_entity ON metadata(entity_id);
CREATE INDEX idx_metadata_type ON metadata(entity_type);
