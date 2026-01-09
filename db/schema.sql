-- ============================================================
-- TRIPLETHINK DATABASE SCHEMA v1.0
-- SQLite with JSON1 extension
-- ============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ============================================================
-- 1. PROJECTS TABLE
-- Series-level metadata
-- ============================================================
CREATE TABLE projects (
    id TEXT PRIMARY KEY,                    -- 'proj-xxx'
    name TEXT NOT NULL,
    author TEXT,
    description TEXT,
    schema_version TEXT NOT NULL DEFAULT '1.0.0',
    meta_id TEXT,
    read_metadata_mandatory INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 2. METADATA TABLE (must come before entities for FK)
-- Separated metadata for token efficiency
-- ============================================================
CREATE TABLE metadata (
    id TEXT PRIMARY KEY,                    -- 'meta-xxx'
    entity_id TEXT NOT NULL,                -- References any entity
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'project', 'event', 'character', 'object',
        'location', 'fiction', 'system', 'book'
    )),
    author_notes JSON,                      -- {creative_intent, themes, constraints}
    ai_guidance JSON,                       -- {tone, scene_rendering, pov_recommendations}
    dev_status JSON,                        -- {completeness, todo, uncertainties, warnings}
    version_info JSON NOT NULL,             -- {created, modified, changelog}
    prose_guidance JSON,                    -- {voice, tone, pacing_notes}
    consistency_rules JSON,                 -- Array of rule strings
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 3. ENTITIES TABLE (Polymorphic)
-- All entity types: events, characters, objects, locations, systems
-- ============================================================
CREATE TABLE entities (
    id TEXT PRIMARY KEY,                    -- 'evt-xxx', 'char-xxx', etc.
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'event', 'character', 'object', 'location', 'system'
    )),
    name TEXT NOT NULL,
    timestamp TEXT,                         -- For events: when it occurred
    summary TEXT,                           -- Brief description
    data JSON NOT NULL,                     -- Type-specific structured data
    meta_id TEXT,
    read_metadata_mandatory INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (meta_id) REFERENCES metadata(id)
);

-- ============================================================
-- 4. EVENT_PHASES TABLE
-- Multi-phase event structure
-- ============================================================
CREATE TABLE event_phases (
    id TEXT PRIMARY KEY,                    -- 'phase-xxx'
    event_id TEXT NOT NULL,
    sequence INTEGER NOT NULL,              -- Order within event
    timestamp TEXT NOT NULL,
    summary TEXT,
    participants JSON NOT NULL,             -- Array of entity IDs
    state_changes JSON,                     -- Array of {entity_id, property, before, after}
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- ============================================================
-- 5. FACTS TABLE
-- Ground truth facts created by events
-- ============================================================
CREATE TABLE facts (
    id TEXT PRIMARY KEY,                    -- 'fact-xxx'
    phase_id TEXT NOT NULL,                 -- Which phase created this fact
    event_id TEXT NOT NULL,                 -- Parent event (denormalized for queries)
    content TEXT NOT NULL,                  -- What the fact states
    visibility TEXT NOT NULL CHECK (visibility IN (
        'ground_truth', 'witnessed_by_crew',
        'limited_knowledge', 'epistemic_state'
    )),
    confidence TEXT NOT NULL DEFAULT 'absolute' CHECK (confidence IN (
        'absolute', 'high', 'medium', 'low'
    )),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (phase_id) REFERENCES event_phases(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES entities(id)
);

-- ============================================================
-- 6. KNOWLEDGE_STATES TABLE
-- Epistemic tracking: who knows/believes what, when
-- ============================================================
CREATE TABLE knowledge_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id TEXT NOT NULL,             -- Character or system
    timestamp TEXT NOT NULL,                -- When this state became active
    trigger_event_id TEXT NOT NULL,         -- Event that caused this state
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (character_id) REFERENCES entities(id),
    FOREIGN KEY (trigger_event_id) REFERENCES entities(id)
);

-- ============================================================
-- 7. KNOWLEDGE_STATE_FACTS TABLE
-- Individual fact beliefs within a knowledge state
-- ============================================================
CREATE TABLE knowledge_state_facts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    knowledge_state_id INTEGER NOT NULL,
    fact_id TEXT NOT NULL,
    belief TEXT NOT NULL CHECK (belief IN ('true', 'false')),
    believed_alternative TEXT,              -- Required if belief='false'
    confidence TEXT NOT NULL CHECK (confidence IN (
        'absolute', 'high', 'medium', 'low'
    )),
    source TEXT NOT NULL,                   -- 'direct_experience', 'told_by_X', etc.
    FOREIGN KEY (knowledge_state_id) REFERENCES knowledge_states(id) ON DELETE CASCADE,
    FOREIGN KEY (fact_id) REFERENCES facts(id),
    CHECK (belief = 'true' OR believed_alternative IS NOT NULL)
);

-- ============================================================
-- 8. RELATIONSHIPS TABLE
-- Entity-to-entity relationships with timeline
-- ============================================================
CREATE TABLE relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_entity_id TEXT NOT NULL,
    to_entity_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL,        -- 'colleague', 'friend', 'owns', etc.
    timestamp TEXT NOT NULL,                -- When relationship state began
    data JSON,                              -- {sentiment, trust_level, etc.}
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (from_entity_id) REFERENCES entities(id),
    FOREIGN KEY (to_entity_id) REFERENCES entities(id)
);

-- ============================================================
-- 9. STATE_TIMELINE TABLE
-- Generic entity state changes over time
-- ============================================================
CREATE TABLE state_timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    property TEXT NOT NULL,
    value TEXT NOT NULL,                    -- JSON-encoded value
    trigger_event_id TEXT,                  -- Optional: event that caused change
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (entity_id) REFERENCES entities(id),
    FOREIGN KEY (trigger_event_id) REFERENCES entities(id)
);

-- ============================================================
-- 10. FICTIONS TABLE
-- False narrative systems with target audiences
-- ============================================================
CREATE TABLE fictions (
    entity_id TEXT PRIMARY KEY,             -- Links to entities table
    target_audience JSON NOT NULL,          -- Array of character IDs
    created_by JSON NOT NULL,               -- Array of creator IDs
    core_narrative TEXT NOT NULL,
    facts_contradicted JSON NOT NULL,       -- [{ground_truth_fact_id, fictional_alternative}]
    constraints JSON,                       -- Array of constraint strings
    exposure_triggers JSON,                 -- [{trigger, consequence}]
    active_start TEXT,
    active_end TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
        'active', 'collapsed', 'dormant'
    )),
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    CHECK (status != 'active' OR active_end IS NULL)
);

-- ============================================================
-- 11. CAUSAL_LINKS TABLE
-- Event cause/effect relationships
-- ============================================================
CREATE TABLE causal_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cause_event_id TEXT NOT NULL,
    effect_event_id TEXT NOT NULL,
    FOREIGN KEY (cause_event_id) REFERENCES entities(id),
    FOREIGN KEY (effect_event_id) REFERENCES entities(id),
    UNIQUE(cause_event_id, effect_event_id)
);

-- ============================================================
-- 12. NARRATIVE_STRUCTURE TABLE
-- Books, acts, chapters hierarchy
-- ============================================================
CREATE TABLE narrative_structure (
    id TEXT PRIMARY KEY,                    -- 'book-1', 'act-1-1', 'ch-1-1-1'
    parent_id TEXT,                         -- Parent in hierarchy
    structure_type TEXT NOT NULL CHECK (structure_type IN (
        'book', 'act', 'chapter'
    )),
    title TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    meta_id TEXT,
    read_metadata_mandatory INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (parent_id) REFERENCES narrative_structure(id),
    FOREIGN KEY (meta_id) REFERENCES metadata(id)
);

-- ============================================================
-- 13. SCENES TABLE
-- Scenes within chapters
-- ============================================================
CREATE TABLE scenes (
    id TEXT PRIMARY KEY,                    -- 'scene-xxx'
    chapter_id TEXT NOT NULL,
    title TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    pov_character_id TEXT NOT NULL,
    temporal_start TEXT NOT NULL,
    temporal_end TEXT NOT NULL,
    epistemic_constraints JSON NOT NULL,    -- {reader_knows, pov_knows, dramatic_irony}
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (chapter_id) REFERENCES narrative_structure(id),
    FOREIGN KEY (pov_character_id) REFERENCES entities(id)
);

-- ============================================================
-- 14. SCENE_EVENTS TABLE
-- Many-to-many: scenes cover events/phases
-- ============================================================
CREATE TABLE scene_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scene_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    phase_id TEXT,                          -- Optional: specific phase
    FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES entities(id),
    FOREIGN KEY (phase_id) REFERENCES event_phases(id)
);

-- ============================================================
-- 15. EVENT_PARTICIPANTS TABLE
-- Denormalized for fast participant queries
-- ============================================================
CREATE TABLE event_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    phase_id TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES entities(id),
    FOREIGN KEY (phase_id) REFERENCES event_phases(id),
    FOREIGN KEY (participant_id) REFERENCES entities(id),
    UNIQUE(phase_id, participant_id)
);

-- ============================================================
-- 16. SCHEMA_MIGRATIONS TABLE
-- Version tracking for migrations
-- ============================================================
CREATE TABLE schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now')),
    rollback_sql TEXT
);

-- Insert initial migration record
INSERT INTO schema_migrations (version, name) VALUES (1, 'initial_schema');
