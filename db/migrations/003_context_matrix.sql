-- Context Matrix tables for TripleThink v4.1 Phase 3
-- Epistemic tracking: who knows what when
-- Event sourcing: tables are append-only, never edit existing records

-- Epistemic Fact Ledger: tracks knowledge acquisition by characters/entities
-- Each entry represents a fact becoming known to an entity at a specific time
CREATE TABLE IF NOT EXISTS epistemic_fact_ledger (
  id TEXT PRIMARY KEY,
  fiction_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,           -- who knows this fact (character/entity)
  fact_type TEXT NOT NULL,           -- category of knowledge (location, secret, event, relationship, etc.)
  fact_key TEXT NOT NULL,            -- unique identifier for the fact within its type
  fact_value TEXT NOT NULL,          -- JSON value of the fact
  source_type TEXT NOT NULL,         -- how they learned (witnessed, told, deduced, read, etc.)
  source_entity_id TEXT,             -- who told them (if applicable)
  source_event_id TEXT,              -- event where they learned it
  confidence REAL DEFAULT 1.0,       -- certainty level (0.0-1.0)
  is_true INTEGER DEFAULT 1,         -- whether the fact is objectively true (for dramatic irony)
  acquired_at INTEGER NOT NULL,      -- narrative timestamp when fact was acquired
  created_at INTEGER NOT NULL,       -- system timestamp
  FOREIGN KEY (fiction_id) REFERENCES fictions(id),
  FOREIGN KEY (entity_id) REFERENCES entities(id)
);

-- Relationship Dynamics: tracks evolving relationships between entities
-- Each entry represents the state of a relationship at a point in time
CREATE TABLE IF NOT EXISTS relationship_dynamics (
  id TEXT PRIMARY KEY,
  fiction_id TEXT NOT NULL,
  entity_a_id TEXT NOT NULL,         -- first entity in relationship
  entity_b_id TEXT NOT NULL,         -- second entity in relationship
  relationship_type TEXT NOT NULL,   -- family, romantic, professional, rival, etc.
  sentiment REAL DEFAULT 0.0,        -- -1.0 (hostile) to 1.0 (loving)
  trust_level REAL DEFAULT 0.5,      -- 0.0 (no trust) to 1.0 (complete trust)
  power_balance REAL DEFAULT 0.0,    -- -1.0 (B dominates) to 1.0 (A dominates)
  intimacy_level REAL DEFAULT 0.0,   -- 0.0 (strangers) to 1.0 (deeply intimate)
  conflict_level REAL DEFAULT 0.0,   -- 0.0 (harmonious) to 1.0 (intense conflict)
  status TEXT DEFAULT 'active',      -- active, estranged, ended, unknown
  dynamics_json TEXT,                -- additional relationship-specific data
  cause_event_id TEXT,               -- event that caused this state
  valid_from INTEGER NOT NULL,       -- narrative timestamp when this state began
  created_at INTEGER NOT NULL,       -- system timestamp
  FOREIGN KEY (fiction_id) REFERENCES fictions(id),
  FOREIGN KEY (entity_a_id) REFERENCES entities(id),
  FOREIGN KEY (entity_b_id) REFERENCES entities(id)
);

-- Dialogue Profiles: defines how characters speak and their voice characteristics
-- Used for generating consistent dialogue and tracking voice evolution
CREATE TABLE IF NOT EXISTS dialogue_profiles (
  id TEXT PRIMARY KEY,
  fiction_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,           -- character this profile belongs to
  vocabulary_level TEXT DEFAULT 'medium',  -- simple, medium, complex, technical
  formality_level TEXT DEFAULT 'casual',   -- very_formal, formal, neutral, casual, very_casual
  speech_patterns TEXT,              -- JSON array of characteristic patterns/phrases
  dialect TEXT,                      -- regional dialect or accent markers
  quirks TEXT,                       -- JSON array of speech quirks/habits
  emotional_baseline TEXT DEFAULT 'neutral', -- typical emotional tone
  topics_of_interest TEXT,           -- JSON array of topics they often discuss
  topics_to_avoid TEXT,              -- JSON array of topics they avoid
  relationship_modifiers TEXT,       -- JSON object mapping entity_ids to voice adjustments
  context_modifiers TEXT,            -- JSON object mapping contexts to voice adjustments
  voice_hints TEXT,                  -- JSON object with additional AI generation hints
  valid_from INTEGER NOT NULL,       -- narrative timestamp when this profile applies
  created_at INTEGER NOT NULL,       -- system timestamp
  FOREIGN KEY (fiction_id) REFERENCES fictions(id),
  FOREIGN KEY (entity_id) REFERENCES entities(id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_epistemic_fiction ON epistemic_fact_ledger(fiction_id);
CREATE INDEX IF NOT EXISTS idx_epistemic_entity ON epistemic_fact_ledger(entity_id);
CREATE INDEX IF NOT EXISTS idx_epistemic_fact ON epistemic_fact_ledger(fact_type, fact_key);
CREATE INDEX IF NOT EXISTS idx_epistemic_acquired ON epistemic_fact_ledger(acquired_at);
CREATE INDEX IF NOT EXISTS idx_epistemic_entity_time ON epistemic_fact_ledger(entity_id, acquired_at);

CREATE INDEX IF NOT EXISTS idx_relationships_fiction ON relationship_dynamics(fiction_id);
CREATE INDEX IF NOT EXISTS idx_relationships_entity_a ON relationship_dynamics(entity_a_id);
CREATE INDEX IF NOT EXISTS idx_relationships_entity_b ON relationship_dynamics(entity_b_id);
CREATE INDEX IF NOT EXISTS idx_relationships_valid_from ON relationship_dynamics(valid_from);
CREATE INDEX IF NOT EXISTS idx_relationships_pair ON relationship_dynamics(entity_a_id, entity_b_id, valid_from);

CREATE INDEX IF NOT EXISTS idx_dialogue_fiction ON dialogue_profiles(fiction_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_entity ON dialogue_profiles(entity_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_valid_from ON dialogue_profiles(valid_from);
