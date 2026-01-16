-- Narrative Orchestration tables for TripleThink v4.1 Phase 4
-- Scene management, transitions, pacing, and vent moments
-- Event sourcing: tables are append-only, never edit existing records

-- Enhanced narrative scenes with orchestration fields
CREATE TABLE IF NOT EXISTS narrative_scenes (
  id TEXT PRIMARY KEY,
  fiction_id TEXT NOT NULL,
  chapter_id TEXT,
  scene_number INTEGER NOT NULL,
  title TEXT,
  summary TEXT,
  pov_entity_id TEXT,                -- Point of view character
  location_id TEXT,                  -- Scene location entity
  narrative_time INTEGER NOT NULL,   -- In-story timestamp
  duration_minutes INTEGER,          -- How long the scene spans
  mood TEXT DEFAULT 'neutral',       -- Overall scene mood
  tension_level REAL DEFAULT 0.5,    -- 0.0-1.0 tension scale
  stakes TEXT,                       -- What's at risk in this scene
  scene_goal TEXT,                   -- What this scene accomplishes narratively
  present_entity_ids TEXT,           -- JSON array of entity IDs present
  entering_entity_ids TEXT,          -- JSON array of entities entering mid-scene
  exiting_entity_ids TEXT,           -- JSON array of entities leaving mid-scene
  active_conflict_ids TEXT,          -- JSON array of active conflict IDs
  active_theme_ids TEXT,             -- JSON array of thematic element IDs
  forbidden_reveal_ids TEXT,         -- JSON array of facts NOT to reveal yet
  setup_payoff_ids TEXT,             -- JSON array of setups being paid off
  notes TEXT,                        -- Author notes
  status TEXT DEFAULT 'draft',       -- draft, in_progress, complete, revised
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (fiction_id) REFERENCES fictions(id)
);

-- Scene transitions for continuity tracking
CREATE TABLE IF NOT EXISTS scene_transitions (
  id TEXT PRIMARY KEY,
  fiction_id TEXT NOT NULL,
  from_scene_id TEXT NOT NULL,
  to_scene_id TEXT NOT NULL,
  transition_type TEXT NOT NULL,     -- cut, fade, dissolve, time_skip, flashback, flashforward
  time_gap_minutes INTEGER,          -- Time between scenes
  location_change INTEGER DEFAULT 0, -- Boolean: did location change?
  pov_change INTEGER DEFAULT 0,      -- Boolean: did POV change?
  continuity_notes TEXT,             -- Notes about what carries over
  carried_tensions TEXT,             -- JSON array of unresolved tensions
  resolved_tensions TEXT,            -- JSON array of tensions resolved in transition
  entity_state_changes TEXT,         -- JSON object of entity state changes during gap
  validation_status TEXT DEFAULT 'pending', -- pending, valid, invalid
  validation_errors TEXT,            -- JSON array of continuity errors found
  created_at INTEGER NOT NULL,
  FOREIGN KEY (fiction_id) REFERENCES fictions(id),
  FOREIGN KEY (from_scene_id) REFERENCES narrative_scenes(id),
  FOREIGN KEY (to_scene_id) REFERENCES narrative_scenes(id)
);

-- Pacing checkpoints for tension curve management
CREATE TABLE IF NOT EXISTS pacing_checkpoints (
  id TEXT PRIMARY KEY,
  fiction_id TEXT NOT NULL,
  scene_id TEXT,                     -- Optional: can be at scene level or story level
  chapter_id TEXT,                   -- Optional: can be at chapter level
  checkpoint_type TEXT NOT NULL,     -- inciting_incident, rising_action, midpoint, climax, resolution, etc.
  narrative_time INTEGER NOT NULL,   -- When this checkpoint occurs
  tension_target REAL NOT NULL,      -- Target tension level (0.0-1.0)
  actual_tension REAL,               -- Measured/calculated tension
  emotional_beat TEXT,               -- Primary emotion at this point
  stakes_escalation TEXT,            -- How stakes have changed
  character_growth_notes TEXT,       -- Character development at this point
  audience_knowledge TEXT,           -- JSON: what audience knows vs characters
  dramatic_irony_level REAL DEFAULT 0.0, -- 0.0-1.0 how much audience knows more
  notes TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (fiction_id) REFERENCES fictions(id),
  FOREIGN KEY (scene_id) REFERENCES narrative_scenes(id)
);

-- Vent moments for emotional release tracking
CREATE TABLE IF NOT EXISTS vent_moments (
  id TEXT PRIMARY KEY,
  fiction_id TEXT NOT NULL,
  scene_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,           -- Character having the vent moment
  vent_type TEXT NOT NULL,           -- catharsis, revelation, confrontation, breakdown, triumph, etc.
  trigger_event TEXT,                -- What triggered this moment
  emotional_peak REAL NOT NULL,      -- 0.0-1.0 intensity
  tension_before REAL NOT NULL,      -- Tension level before vent
  tension_after REAL NOT NULL,       -- Tension level after vent
  duration_beats INTEGER,            -- How many story beats this spans
  affected_entity_ids TEXT,          -- JSON array of entities affected
  relationship_impacts TEXT,         -- JSON object mapping entity pairs to impact
  revealed_facts TEXT,               -- JSON array of fact_keys revealed during vent
  narrative_time INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (fiction_id) REFERENCES fictions(id),
  FOREIGN KEY (scene_id) REFERENCES narrative_scenes(id),
  FOREIGN KEY (entity_id) REFERENCES entities(id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_scenes_fiction ON narrative_scenes(fiction_id);
CREATE INDEX IF NOT EXISTS idx_scenes_chapter ON narrative_scenes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_scenes_pov ON narrative_scenes(pov_entity_id);
CREATE INDEX IF NOT EXISTS idx_scenes_time ON narrative_scenes(narrative_time);
CREATE INDEX IF NOT EXISTS idx_scenes_fiction_time ON narrative_scenes(fiction_id, narrative_time);

CREATE INDEX IF NOT EXISTS idx_transitions_fiction ON scene_transitions(fiction_id);
CREATE INDEX IF NOT EXISTS idx_transitions_from ON scene_transitions(from_scene_id);
CREATE INDEX IF NOT EXISTS idx_transitions_to ON scene_transitions(to_scene_id);

CREATE INDEX IF NOT EXISTS idx_pacing_fiction ON pacing_checkpoints(fiction_id);
CREATE INDEX IF NOT EXISTS idx_pacing_scene ON pacing_checkpoints(scene_id);
CREATE INDEX IF NOT EXISTS idx_pacing_time ON pacing_checkpoints(narrative_time);

CREATE INDEX IF NOT EXISTS idx_vent_fiction ON vent_moments(fiction_id);
CREATE INDEX IF NOT EXISTS idx_vent_scene ON vent_moments(scene_id);
CREATE INDEX IF NOT EXISTS idx_vent_entity ON vent_moments(entity_id);
