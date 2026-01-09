-- ============================================================
-- TRIPLETHINK VALIDATION TRIGGERS
-- Enforce data integrity beyond simple constraints
-- ============================================================

-- Trigger: Update updated_at on entity modification
CREATE TRIGGER trg_entities_updated_at
AFTER UPDATE ON entities
BEGIN
    UPDATE entities SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_metadata_updated_at
AFTER UPDATE ON metadata
BEGIN
    UPDATE metadata SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_projects_updated_at
AFTER UPDATE ON projects
BEGIN
    UPDATE projects SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger: Validate phase timestamp >= event timestamp
CREATE TRIGGER trg_phase_timestamp_check
BEFORE INSERT ON event_phases
BEGIN
    SELECT CASE
        WHEN NEW.timestamp < (SELECT timestamp FROM entities WHERE id = NEW.event_id)
        THEN RAISE(ABORT, 'Phase timestamp cannot precede event timestamp')
    END;
END;

-- Trigger: Validate fiction status consistency
CREATE TRIGGER trg_fiction_status_check
BEFORE UPDATE ON fictions
BEGIN
    SELECT CASE
        WHEN NEW.status = 'active' AND NEW.active_end IS NOT NULL
        THEN RAISE(ABORT, 'Active fiction cannot have end timestamp')
        WHEN NEW.status IN ('collapsed', 'dormant') AND NEW.active_end IS NULL
        THEN RAISE(ABORT, 'Collapsed/dormant fiction must have end timestamp')
    END;
END;

-- Trigger: Ensure knowledge state fact has alternative if belief=false
CREATE TRIGGER trg_ks_fact_alternative_check
BEFORE INSERT ON knowledge_state_facts
BEGIN
    SELECT CASE
        WHEN NEW.belief = 'false' AND (NEW.believed_alternative IS NULL OR NEW.believed_alternative = '')
        THEN RAISE(ABORT, 'False belief must have believed_alternative')
    END;
END;

-- Trigger: Validate causal link temporal order
CREATE TRIGGER trg_causal_temporal_check
BEFORE INSERT ON causal_links
BEGIN
    SELECT CASE
        WHEN (SELECT timestamp FROM entities WHERE id = NEW.cause_event_id) >
             (SELECT timestamp FROM entities WHERE id = NEW.effect_event_id)
        THEN RAISE(ABORT, 'Cause event cannot occur after effect event')
    END;
END;

-- Trigger: Populate event_participants when phase is inserted
CREATE TRIGGER trg_populate_participants
AFTER INSERT ON event_phases
BEGIN
    INSERT INTO event_participants (event_id, phase_id, participant_id)
    SELECT
        NEW.event_id,
        NEW.id,
        json_each.value
    FROM json_each(NEW.participants);
END;

-- Trigger: Validate scene temporal scope
CREATE TRIGGER trg_scene_temporal_check
BEFORE INSERT ON scenes
BEGIN
    SELECT CASE
        WHEN NEW.temporal_start > NEW.temporal_end
        THEN RAISE(ABORT, 'Scene start cannot be after end')
    END;
END;
