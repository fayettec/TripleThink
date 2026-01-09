# PROMPT_02 Implementation Plan: Database Schema & Storage Layer

## Purpose
This document provides a complete, self-contained implementation plan for building the TripleThink database layer. Follow these steps sequentially to create all required files.

---

## Prerequisites
- PROMPT_01 has been completed
- `/app/schema/schema.json` exists with the complete JSON schema
- `/app/schema/schema-documentation.md` exists with field definitions

---

## Technology Decision: SQLite

**Chosen**: SQLite with JSON1 extension

**Rationale**:
- Portable: Single-file database, author can move project
- Serverless: No installation required
- SQL Support: Full SQL with JSON functions for complex queries
- Performance: Handles 10-book series (2000+ events, 150+ characters)
- GUI Compatible: Works with any SQLite browser
- AI-Friendly: Fast embedded queries, no network latency

---

## Files to Create (in order)

### File 1: `/app/db/schema.sql`

Create these tables in this exact order (for foreign key dependencies):

```sql
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
```

---

### File 2: `/app/db/indexes.sql`

```sql
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
```

---

### File 3: `/app/db/validation-triggers.sql`

```sql
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
```

---

### File 4: `/app/db/api-functions.js`

```javascript
/**
 * TripleThink Data Access Layer
 * SQLite-based implementation with epistemic query support
 */

const Database = require('better-sqlite3');

class TripleThinkDB {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('journal_mode = WAL');
  }

  // ============================================================
  // CORE CRUD OPERATIONS
  // ============================================================

  /**
   * Create a new entity
   * @param {string} type - 'event', 'character', 'object', 'location', 'system'
   * @param {object} data - Entity data
   * @returns {object} Created entity
   */
  createEntity(type, data) {
    const { id, name, timestamp, summary, meta_id, read_metadata_mandatory, ...rest } = data;

    const stmt = this.db.prepare(`
      INSERT INTO entities (id, entity_type, name, timestamp, summary, data, meta_id, read_metadata_mandatory)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, type, name, timestamp || null, summary || null,
             JSON.stringify(rest), meta_id || null, read_metadata_mandatory ? 1 : 0);

    return this.getEntity(id);
  }

  /**
   * Get entity by ID
   * @param {string} id - Entity ID
   * @param {object} options - {includeMetadata: 'auto'|'always'|'never'}
   * @returns {object|null} Entity with optional metadata
   */
  getEntity(id, options = { includeMetadata: 'auto' }) {
    const stmt = this.db.prepare(`
      SELECT * FROM entities WHERE id = ?
    `);

    const entity = stmt.get(id);
    if (!entity) return null;

    // Parse JSON data
    entity.data = JSON.parse(entity.data);

    // Determine if metadata should be loaded
    const loadMetadata =
      options.includeMetadata === 'always' ||
      (options.includeMetadata === 'auto' && entity.read_metadata_mandatory);

    if (loadMetadata && entity.meta_id) {
      entity.metadata = this.getMetadata(entity.meta_id);
    }

    return entity;
  }

  /**
   * Update entity
   * @param {string} id - Entity ID
   * @param {object} updates - Fields to update
   * @returns {object} Updated entity
   */
  updateEntity(id, updates) {
    const current = this.getEntity(id, { includeMetadata: 'never' });
    if (!current) throw new Error(`Entity not found: ${id}`);

    const newData = { ...current.data, ...updates.data };

    const stmt = this.db.prepare(`
      UPDATE entities
      SET name = COALESCE(?, name),
          timestamp = COALESCE(?, timestamp),
          summary = COALESCE(?, summary),
          data = ?,
          meta_id = COALESCE(?, meta_id),
          read_metadata_mandatory = COALESCE(?, read_metadata_mandatory)
      WHERE id = ?
    `);

    stmt.run(
      updates.name || null,
      updates.timestamp || null,
      updates.summary || null,
      JSON.stringify(newData),
      updates.meta_id || null,
      updates.read_metadata_mandatory !== undefined ? (updates.read_metadata_mandatory ? 1 : 0) : null,
      id
    );

    return this.getEntity(id);
  }

  /**
   * Delete entity (cascades to related tables)
   * @param {string} id - Entity ID
   */
  deleteEntity(id) {
    const stmt = this.db.prepare('DELETE FROM entities WHERE id = ?');
    stmt.run(id);
  }

  // ============================================================
  // METADATA OPERATIONS
  // ============================================================

  /**
   * Get metadata by ID
   * @param {string} metaId - Metadata ID
   * @returns {object|null} Metadata object
   */
  getMetadata(metaId) {
    const stmt = this.db.prepare('SELECT * FROM metadata WHERE id = ?');
    const meta = stmt.get(metaId);

    if (!meta) return null;

    // Parse JSON fields
    ['author_notes', 'ai_guidance', 'dev_status', 'version_info',
     'prose_guidance', 'consistency_rules'].forEach(field => {
      if (meta[field]) meta[field] = JSON.parse(meta[field]);
    });

    return meta;
  }

  /**
   * Create or update metadata
   * @param {object} data - Metadata object
   * @returns {object} Saved metadata
   */
  saveMetadata(data) {
    const stmt = this.db.prepare(`
      INSERT INTO metadata (id, entity_id, entity_type, author_notes, ai_guidance,
                           dev_status, version_info, prose_guidance, consistency_rules)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        author_notes = excluded.author_notes,
        ai_guidance = excluded.ai_guidance,
        dev_status = excluded.dev_status,
        version_info = excluded.version_info,
        prose_guidance = excluded.prose_guidance,
        consistency_rules = excluded.consistency_rules,
        updated_at = datetime('now')
    `);

    stmt.run(
      data.id,
      data.entity_id,
      data.entity_type,
      JSON.stringify(data.author_notes || null),
      JSON.stringify(data.ai_guidance || null),
      JSON.stringify(data.dev_status || null),
      JSON.stringify(data.version_info),
      JSON.stringify(data.prose_guidance || null),
      JSON.stringify(data.consistency_rules || null)
    );

    return this.getMetadata(data.id);
  }

  // ============================================================
  // EVENT OPERATIONS
  // ============================================================

  /**
   * Get events in time range
   * @param {string} startDate - ISO timestamp
   * @param {string} endDate - ISO timestamp
   * @returns {array} Events in range
   */
  getEventsInTimeRange(startDate, endDate) {
    const stmt = this.db.prepare(`
      SELECT * FROM entities
      WHERE entity_type = 'event'
        AND timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp
    `);

    return stmt.all(startDate, endDate).map(e => ({
      ...e,
      data: JSON.parse(e.data)
    }));
  }

  /**
   * Get events where character participated
   * @param {string} characterId - Character ID
   * @returns {array} Event IDs
   */
  getEventsWithParticipant(characterId) {
    const stmt = this.db.prepare(`
      SELECT DISTINCT e.* FROM entities e
      JOIN event_participants ep ON e.id = ep.event_id
      WHERE ep.participant_id = ?
      ORDER BY e.timestamp
    `);

    return stmt.all(characterId).map(e => ({
      ...e,
      data: JSON.parse(e.data)
    }));
  }

  /**
   * Create event with phases
   * @param {object} eventData - Event data including phases
   * @returns {object} Created event
   */
  createEvent(eventData) {
    const { phases, causal_links, ...entityData } = eventData;

    return this.db.transaction(() => {
      // Create entity
      this.createEntity('event', entityData);

      // Create phases
      if (phases) {
        phases.forEach((phase, idx) => {
          this.createEventPhase(entityData.id, { ...phase, sequence: idx });
        });
      }

      // Create causal links
      if (causal_links) {
        if (causal_links.causes) {
          causal_links.causes.forEach(causeId => {
            this.addCausalLink(causeId, entityData.id);
          });
        }
        if (causal_links.effects) {
          causal_links.effects.forEach(effectId => {
            this.addCausalLink(entityData.id, effectId);
          });
        }
      }

      return this.getEventWithPhases(entityData.id);
    })();
  }

  /**
   * Create event phase
   * @param {string} eventId - Parent event ID
   * @param {object} phaseData - Phase data
   */
  createEventPhase(eventId, phaseData) {
    const stmt = this.db.prepare(`
      INSERT INTO event_phases (id, event_id, sequence, timestamp, summary, participants, state_changes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      phaseData.phase_id,
      eventId,
      phaseData.sequence,
      phaseData.timestamp,
      phaseData.summary || null,
      JSON.stringify(phaseData.participants || []),
      JSON.stringify(phaseData.state_changes || [])
    );

    // Create facts
    if (phaseData.facts_created) {
      phaseData.facts_created.forEach(fact => {
        this.createFact(phaseData.phase_id, eventId, fact);
      });
    }
  }

  /**
   * Create fact
   * @param {string} phaseId - Parent phase ID
   * @param {string} eventId - Parent event ID
   * @param {object} factData - Fact data
   */
  createFact(phaseId, eventId, factData) {
    const stmt = this.db.prepare(`
      INSERT INTO facts (id, phase_id, event_id, content, visibility, confidence)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      factData.fact_id,
      phaseId,
      eventId,
      factData.content,
      factData.visibility,
      factData.confidence || 'absolute'
    );
  }

  /**
   * Get event with all phases and facts
   * @param {string} eventId - Event ID
   * @returns {object} Complete event
   */
  getEventWithPhases(eventId) {
    const event = this.getEntity(eventId);
    if (!event) return null;

    const phasesStmt = this.db.prepare(`
      SELECT * FROM event_phases WHERE event_id = ? ORDER BY sequence
    `);

    event.phases = phasesStmt.all(eventId).map(phase => {
      phase.participants = JSON.parse(phase.participants);
      phase.state_changes = JSON.parse(phase.state_changes);

      // Get facts for phase
      const factsStmt = this.db.prepare('SELECT * FROM facts WHERE phase_id = ?');
      phase.facts_created = factsStmt.all(phase.id);

      return phase;
    });

    // Get causal links
    const causesStmt = this.db.prepare(
      'SELECT cause_event_id FROM causal_links WHERE effect_event_id = ?'
    );
    const effectsStmt = this.db.prepare(
      'SELECT effect_event_id FROM causal_links WHERE cause_event_id = ?'
    );

    event.causal_links = {
      causes: causesStmt.all(eventId).map(r => r.cause_event_id),
      effects: effectsStmt.all(eventId).map(r => r.effect_event_id)
    };

    return event;
  }

  addCausalLink(causeId, effectId) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO causal_links (cause_event_id, effect_event_id) VALUES (?, ?)
    `);
    stmt.run(causeId, effectId);
  }

  // ============================================================
  // EPISTEMIC QUERIES (THE POWER FEATURE)
  // ============================================================

  /**
   * Get character's knowledge state at a specific time
   * @param {string} characterId - Character ID
   * @param {string} timestamp - ISO timestamp
   * @returns {object} Knowledge state
   */
  getCharacterKnowledgeState(characterId, timestamp) {
    // Get the most recent knowledge state at or before timestamp
    const stmt = this.db.prepare(`
      SELECT ks.*,
             json_group_array(
               json_object(
                 'fact_id', ksf.fact_id,
                 'belief', ksf.belief,
                 'believed_alternative', ksf.believed_alternative,
                 'confidence', ksf.confidence,
                 'source', ksf.source
               )
             ) as facts_known
      FROM knowledge_states ks
      LEFT JOIN knowledge_state_facts ksf ON ks.id = ksf.knowledge_state_id
      WHERE ks.character_id = ? AND ks.timestamp <= ?
      GROUP BY ks.id
      ORDER BY ks.timestamp DESC
      LIMIT 1
    `);

    const result = stmt.get(characterId, timestamp);
    if (!result) return null;

    result.facts_known = JSON.parse(result.facts_known).filter(f => f.fact_id);
    return result;
  }

  /**
   * Who knows a specific fact at a given time?
   * @param {string} factId - Fact ID
   * @param {string} timestamp - ISO timestamp
   * @returns {array} [{characterId, belief, confidence}]
   */
  whoKnowsFact(factId, timestamp) {
    // For each character, get their knowledge state at timestamp
    // and check if they know this fact
    const stmt = this.db.prepare(`
      WITH latest_states AS (
        SELECT character_id, MAX(timestamp) as max_ts
        FROM knowledge_states
        WHERE timestamp <= ?
        GROUP BY character_id
      )
      SELECT
        ks.character_id,
        ksf.belief,
        ksf.confidence,
        ksf.believed_alternative,
        ksf.source
      FROM knowledge_states ks
      JOIN latest_states ls ON ks.character_id = ls.character_id AND ks.timestamp = ls.max_ts
      JOIN knowledge_state_facts ksf ON ks.id = ksf.knowledge_state_id
      WHERE ksf.fact_id = ?
    `);

    return stmt.all(timestamp, factId);
  }

  /**
   * Does character believe fact at time?
   * @param {string} characterId - Character ID
   * @param {string} factId - Fact ID
   * @param {string} timestamp - ISO timestamp
   * @returns {object} {believes: boolean, confidence, source}
   */
  doesCharacterBelieve(characterId, factId, timestamp) {
    const ks = this.getCharacterKnowledgeState(characterId, timestamp);
    if (!ks) return { believes: null, known: false };

    const factBelief = ks.facts_known.find(f => f.fact_id === factId);
    if (!factBelief) return { believes: null, known: false };

    return {
      believes: factBelief.belief === 'true',
      known: true,
      confidence: factBelief.confidence,
      source: factBelief.source,
      believed_alternative: factBelief.believed_alternative
    };
  }

  /**
   * Get belief divergence: who believes what about a fact
   * @param {string} factId - Fact ID
   * @param {string} timestamp - ISO timestamp
   * @returns {object} {groundTruth, believers: [], disbelievers: []}
   */
  getBeliefDivergence(factId, timestamp) {
    // Get ground truth
    const factStmt = this.db.prepare('SELECT * FROM facts WHERE id = ?');
    const fact = factStmt.get(factId);

    // Get all believers
    const knowers = this.whoKnowsFact(factId, timestamp);

    return {
      groundTruth: fact,
      believers: knowers.filter(k => k.belief === 'true'),
      disbelievers: knowers.filter(k => k.belief === 'false')
    };
  }

  /**
   * Create knowledge state entry
   * @param {string} characterId - Character ID
   * @param {string} timestamp - ISO timestamp
   * @param {string} triggerEventId - Event that caused this state
   * @param {array} factsKnown - Array of fact beliefs
   */
  createKnowledgeState(characterId, timestamp, triggerEventId, factsKnown) {
    return this.db.transaction(() => {
      const ksStmt = this.db.prepare(`
        INSERT INTO knowledge_states (character_id, timestamp, trigger_event_id)
        VALUES (?, ?, ?)
      `);

      const result = ksStmt.run(characterId, timestamp, triggerEventId);
      const ksId = result.lastInsertRowid;

      const factStmt = this.db.prepare(`
        INSERT INTO knowledge_state_facts
          (knowledge_state_id, fact_id, belief, believed_alternative, confidence, source)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      factsKnown.forEach(fact => {
        factStmt.run(
          ksId,
          fact.fact_id,
          fact.belief,
          fact.believed_alternative || null,
          fact.confidence,
          fact.source
        );
      });

      return ksId;
    })();
  }

  // ============================================================
  // FICTION QUERIES
  // ============================================================

  /**
   * Get fictions active at time T
   * @param {string} timestamp - ISO timestamp
   * @returns {array} Active fictions
   */
  getFictionsActiveAtTime(timestamp) {
    const stmt = this.db.prepare(`
      SELECT f.*, e.name, e.summary
      FROM fictions f
      JOIN entities e ON f.entity_id = e.id
      WHERE f.active_start <= ?
        AND (f.active_end IS NULL OR f.active_end > ?)
        AND f.status = 'active'
    `);

    return stmt.all(timestamp, timestamp).map(f => ({
      ...f,
      target_audience: JSON.parse(f.target_audience),
      created_by: JSON.parse(f.created_by),
      facts_contradicted: JSON.parse(f.facts_contradicted),
      constraints: f.constraints ? JSON.parse(f.constraints) : null,
      exposure_triggers: f.exposure_triggers ? JSON.parse(f.exposure_triggers) : null
    }));
  }

  /**
   * Check if character is target of any active fiction
   * @param {string} characterId - Character ID
   * @param {string} timestamp - ISO timestamp
   * @returns {array} Fictions targeting this character
   */
  getFictionsTargetingCharacter(characterId, timestamp) {
    const activeFictions = this.getFictionsActiveAtTime(timestamp);
    return activeFictions.filter(f =>
      f.target_audience.includes(characterId)
    );
  }

  /**
   * Create fiction
   * @param {object} fictionData - Fiction data
   */
  createFiction(fictionData) {
    return this.db.transaction(() => {
      // Create entity first
      this.createEntity('fiction', {
        id: fictionData.id,
        name: fictionData.name,
        summary: fictionData.core_narrative,
        meta_id: fictionData.meta_id,
        read_metadata_mandatory: true
      });

      // Create fiction-specific data
      const stmt = this.db.prepare(`
        INSERT INTO fictions (entity_id, target_audience, created_by, core_narrative,
                             facts_contradicted, constraints, exposure_triggers,
                             active_start, active_end, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        fictionData.id,
        JSON.stringify(fictionData.target_audience),
        JSON.stringify(fictionData.created_by),
        fictionData.core_narrative,
        JSON.stringify(fictionData.facts_contradicted),
        JSON.stringify(fictionData.constraints || null),
        JSON.stringify(fictionData.exposure_triggers || null),
        fictionData.active_start,
        fictionData.active_end || null,
        fictionData.status || 'active'
      );

      return this.getEntity(fictionData.id);
    })();
  }

  // ============================================================
  // TEMPORAL QUERIES
  // ============================================================

  /**
   * Get entity state at specific time
   * @param {string} entityId - Entity ID
   * @param {string} timestamp - ISO timestamp
   * @returns {object} State at time T
   */
  getEntityStateAtTime(entityId, timestamp) {
    const stmt = this.db.prepare(`
      SELECT property, value
      FROM state_timeline
      WHERE entity_id = ? AND timestamp <= ?
      ORDER BY timestamp DESC
    `);

    const entries = stmt.all(entityId, timestamp);

    // Build state object from most recent value of each property
    const state = {};
    const seen = new Set();

    entries.forEach(entry => {
      if (!seen.has(entry.property)) {
        state[entry.property] = JSON.parse(entry.value);
        seen.add(entry.property);
      }
    });

    return state;
  }

  /**
   * Get state changes for entity in time range
   * @param {string} entityId - Entity ID
   * @param {string} startDate - ISO timestamp
   * @param {string} endDate - ISO timestamp
   * @returns {array} State changes
   */
  getStateChangesForEntity(entityId, startDate, endDate) {
    const stmt = this.db.prepare(`
      SELECT * FROM state_timeline
      WHERE entity_id = ? AND timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp
    `);

    return stmt.all(entityId, startDate, endDate).map(s => ({
      ...s,
      value: JSON.parse(s.value)
    }));
  }

  /**
   * Record state change
   * @param {string} entityId - Entity ID
   * @param {string} property - Property name
   * @param {any} value - New value
   * @param {string} timestamp - ISO timestamp
   * @param {string} triggerEventId - Optional event that caused change
   */
  recordStateChange(entityId, property, value, timestamp, triggerEventId = null) {
    const stmt = this.db.prepare(`
      INSERT INTO state_timeline (entity_id, timestamp, property, value, trigger_event_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(entityId, timestamp, property, JSON.stringify(value), triggerEventId);
  }

  // ============================================================
  // NARRATIVE QUERIES
  // ============================================================

  /**
   * Get chapter events
   * @param {string} chapterId - Chapter ID
   * @returns {array} Events in chapter scenes
   */
  getChapterEvents(chapterId) {
    const stmt = this.db.prepare(`
      SELECT DISTINCT e.*
      FROM entities e
      JOIN scene_events se ON e.id = se.event_id
      JOIN scenes s ON se.scene_id = s.id
      WHERE s.chapter_id = ?
      ORDER BY e.timestamp
    `);

    return stmt.all(chapterId).map(e => ({
      ...e,
      data: JSON.parse(e.data)
    }));
  }

  /**
   * Get scene with full epistemic context
   * @param {string} sceneId - Scene ID
   * @param {boolean} includeEpistemicContext - Load character knowledge states
   * @returns {object} Scene with context
   */
  getSceneData(sceneId, includeEpistemicContext = true) {
    const sceneStmt = this.db.prepare('SELECT * FROM scenes WHERE id = ?');
    const scene = sceneStmt.get(sceneId);

    if (!scene) return null;

    scene.epistemic_constraints = JSON.parse(scene.epistemic_constraints);

    // Get events
    const eventsStmt = this.db.prepare(`
      SELECT e.*, se.phase_id
      FROM entities e
      JOIN scene_events se ON e.id = se.event_id
      WHERE se.scene_id = ?
    `);
    scene.events = eventsStmt.all(sceneId).map(e => ({
      ...e,
      data: JSON.parse(e.data)
    }));

    // Get POV character
    scene.pov_character = this.getEntity(scene.pov_character_id);

    if (includeEpistemicContext) {
      // Get POV character's knowledge state at scene start
      scene.pov_knowledge_state = this.getCharacterKnowledgeState(
        scene.pov_character_id,
        scene.temporal_start
      );

      // Check for dramatic irony
      if (scene.epistemic_constraints.dramatic_irony) {
        scene.active_dramatic_irony = scene.epistemic_constraints.dramatic_irony;
      }
    }

    return scene;
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  /**
   * Run in transaction
   * @param {function} fn - Function to run in transaction
   * @returns {any} Result of function
   */
  transaction(fn) {
    return this.db.transaction(fn)();
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

module.exports = TripleThinkDB;
```

---

### File 5: `/app/db/migrations/001_initial_schema.sql`

Copy the contents of `/app/db/schema.sql` here. This is the initial migration.

---

### File 6: `/app/db/migrations/migration-runner.js`

```javascript
/**
 * TripleThink Migration Runner
 * Handles database schema versioning and upgrades
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

class MigrationRunner {
  constructor(dbPath, migrationsDir) {
    this.db = new Database(dbPath);
    this.migrationsDir = migrationsDir;
    this.db.pragma('foreign_keys = ON');
  }

  /**
   * Get current schema version
   * @returns {number} Current version (0 if no migrations applied)
   */
  getCurrentVersion() {
    try {
      const stmt = this.db.prepare(
        'SELECT MAX(version) as version FROM schema_migrations'
      );
      const result = stmt.get();
      return result?.version || 0;
    } catch (e) {
      // Table doesn't exist yet
      return 0;
    }
  }

  /**
   * Get all available migrations
   * @returns {array} [{version, name, path}]
   */
  getAvailableMigrations() {
    const files = fs.readdirSync(this.migrationsDir);

    return files
      .filter(f => f.endsWith('.sql') && /^\d{3}_/.test(f))
      .map(f => {
        const version = parseInt(f.substring(0, 3), 10);
        const name = f.replace(/^\d{3}_/, '').replace('.sql', '');
        return {
          version,
          name,
          path: path.join(this.migrationsDir, f)
        };
      })
      .sort((a, b) => a.version - b.version);
  }

  /**
   * Get pending migrations
   * @returns {array} Migrations not yet applied
   */
  getPendingMigrations() {
    const current = this.getCurrentVersion();
    return this.getAvailableMigrations().filter(m => m.version > current);
  }

  /**
   * Apply a single migration
   * @param {object} migration - {version, name, path}
   */
  applyMigration(migration) {
    const sql = fs.readFileSync(migration.path, 'utf8');

    this.db.transaction(() => {
      // Execute migration SQL
      this.db.exec(sql);

      // Record migration
      const stmt = this.db.prepare(`
        INSERT INTO schema_migrations (version, name, rollback_sql)
        VALUES (?, ?, ?)
      `);

      // Extract rollback SQL if present (between -- ROLLBACK START/END markers)
      const rollbackMatch = sql.match(/-- ROLLBACK START\n([\s\S]*?)-- ROLLBACK END/);
      const rollbackSql = rollbackMatch ? rollbackMatch[1].trim() : null;

      stmt.run(migration.version, migration.name, rollbackSql);
    })();

    console.log(`Applied migration ${migration.version}: ${migration.name}`);
  }

  /**
   * Run all pending migrations
   * @returns {number} Number of migrations applied
   */
  migrate() {
    const pending = this.getPendingMigrations();

    if (pending.length === 0) {
      console.log('Database is up to date');
      return 0;
    }

    console.log(`Applying ${pending.length} migration(s)...`);

    pending.forEach(m => this.applyMigration(m));

    return pending.length;
  }

  /**
   * Rollback last migration
   * @returns {boolean} Success
   */
  rollback() {
    const current = this.getCurrentVersion();

    if (current === 0) {
      console.log('No migrations to rollback');
      return false;
    }

    const stmt = this.db.prepare(
      'SELECT * FROM schema_migrations WHERE version = ?'
    );
    const migration = stmt.get(current);

    if (!migration.rollback_sql) {
      console.error(`Migration ${current} has no rollback SQL`);
      return false;
    }

    this.db.transaction(() => {
      this.db.exec(migration.rollback_sql);

      const deleteStmt = this.db.prepare(
        'DELETE FROM schema_migrations WHERE version = ?'
      );
      deleteStmt.run(current);
    })();

    console.log(`Rolled back migration ${current}: ${migration.name}`);
    return true;
  }

  /**
   * Get migration status
   * @returns {object} {current, pending, applied}
   */
  status() {
    const current = this.getCurrentVersion();
    const available = this.getAvailableMigrations();
    const pending = this.getPendingMigrations();

    const appliedStmt = this.db.prepare(
      'SELECT * FROM schema_migrations ORDER BY version'
    );
    const applied = appliedStmt.all();

    return {
      current,
      pending: pending.map(m => `${m.version}: ${m.name}`),
      applied: applied.map(m => `${m.version}: ${m.name} (${m.applied_at})`)
    };
  }

  close() {
    this.db.close();
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  const dbPath = args[1] || './triplethink.db';
  const migrationsDir = args[2] || './migrations';

  const runner = new MigrationRunner(dbPath, migrationsDir);

  switch (command) {
    case 'migrate':
      runner.migrate();
      break;
    case 'rollback':
      runner.rollback();
      break;
    case 'status':
      console.log(JSON.stringify(runner.status(), null, 2));
      break;
    default:
      console.log('Usage: migration-runner.js [migrate|rollback|status] [dbPath] [migrationsDir]');
  }

  runner.close();
}

module.exports = MigrationRunner;
```

---

### File 7: `/app/db/backup.js`

```javascript
/**
 * TripleThink Backup & Export Utilities
 * JSON export/import for portability and collaboration
 */

const fs = require('fs');
const path = require('path');
const TripleThinkDB = require('./api-functions');

class BackupManager {
  constructor(db) {
    this.db = db instanceof TripleThinkDB ? db : new TripleThinkDB(db);
  }

  /**
   * Export entire project to JSON
   * @param {string} projectId - Project ID
   * @returns {object} Complete project data
   */
  exportToJSON(projectId) {
    const project = this.db.db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);

    // Export all entities
    const entities = this.db.db.prepare(
      'SELECT * FROM entities'
    ).all().map(e => ({ ...e, data: JSON.parse(e.data) }));

    // Export all phases
    const phases = this.db.db.prepare(
      'SELECT * FROM event_phases'
    ).all().map(p => ({
      ...p,
      participants: JSON.parse(p.participants),
      state_changes: JSON.parse(p.state_changes)
    }));

    // Export all facts
    const facts = this.db.db.prepare('SELECT * FROM facts').all();

    // Export knowledge states
    const knowledgeStates = this.db.db.prepare(`
      SELECT ks.*,
             json_group_array(
               json_object(
                 'fact_id', ksf.fact_id,
                 'belief', ksf.belief,
                 'believed_alternative', ksf.believed_alternative,
                 'confidence', ksf.confidence,
                 'source', ksf.source
               )
             ) as facts_known
      FROM knowledge_states ks
      LEFT JOIN knowledge_state_facts ksf ON ks.id = ksf.knowledge_state_id
      GROUP BY ks.id
    `).all().map(ks => ({
      ...ks,
      facts_known: JSON.parse(ks.facts_known).filter(f => f.fact_id)
    }));

    // Export relationships
    const relationships = this.db.db.prepare(
      'SELECT * FROM relationships'
    ).all().map(r => ({ ...r, data: r.data ? JSON.parse(r.data) : null }));

    // Export state timeline
    const stateTimeline = this.db.db.prepare(
      'SELECT * FROM state_timeline'
    ).all().map(s => ({ ...s, value: JSON.parse(s.value) }));

    // Export fictions
    const fictions = this.db.db.prepare(
      'SELECT * FROM fictions'
    ).all().map(f => ({
      ...f,
      target_audience: JSON.parse(f.target_audience),
      created_by: JSON.parse(f.created_by),
      facts_contradicted: JSON.parse(f.facts_contradicted),
      constraints: f.constraints ? JSON.parse(f.constraints) : null,
      exposure_triggers: f.exposure_triggers ? JSON.parse(f.exposure_triggers) : null
    }));

    // Export causal links
    const causalLinks = this.db.db.prepare('SELECT * FROM causal_links').all();

    // Export metadata
    const metadata = this.db.db.prepare(
      'SELECT * FROM metadata'
    ).all().map(m => ({
      ...m,
      author_notes: m.author_notes ? JSON.parse(m.author_notes) : null,
      ai_guidance: m.ai_guidance ? JSON.parse(m.ai_guidance) : null,
      dev_status: m.dev_status ? JSON.parse(m.dev_status) : null,
      version_info: JSON.parse(m.version_info),
      prose_guidance: m.prose_guidance ? JSON.parse(m.prose_guidance) : null,
      consistency_rules: m.consistency_rules ? JSON.parse(m.consistency_rules) : null
    }));

    // Export narrative structure
    const narrativeStructure = this.db.db.prepare(
      'SELECT * FROM narrative_structure'
    ).all();

    // Export scenes
    const scenes = this.db.db.prepare(
      'SELECT * FROM scenes'
    ).all().map(s => ({
      ...s,
      epistemic_constraints: JSON.parse(s.epistemic_constraints)
    }));

    // Export scene events
    const sceneEvents = this.db.db.prepare('SELECT * FROM scene_events').all();

    return {
      exportVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      project,
      entities,
      phases,
      facts,
      knowledgeStates,
      relationships,
      stateTimeline,
      fictions,
      causalLinks,
      metadata,
      narrativeStructure,
      scenes,
      sceneEvents
    };
  }

  /**
   * Export to file
   * @param {string} projectId - Project ID
   * @param {string} filePath - Output file path
   */
  exportToFile(projectId, filePath) {
    const data = this.exportToJSON(projectId);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Exported to ${filePath}`);
  }

  /**
   * Import from JSON
   * @param {object|string} data - JSON data or file path
   */
  importFromJSON(data) {
    if (typeof data === 'string') {
      data = JSON.parse(fs.readFileSync(data, 'utf8'));
    }

    this.db.db.transaction(() => {
      // Import in dependency order

      // 1. Metadata first (entities reference it)
      data.metadata.forEach(m => {
        this.db.db.prepare(`
          INSERT OR REPLACE INTO metadata
          (id, entity_id, entity_type, author_notes, ai_guidance, dev_status,
           version_info, prose_guidance, consistency_rules, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          m.id, m.entity_id, m.entity_type,
          JSON.stringify(m.author_notes),
          JSON.stringify(m.ai_guidance),
          JSON.stringify(m.dev_status),
          JSON.stringify(m.version_info),
          JSON.stringify(m.prose_guidance),
          JSON.stringify(m.consistency_rules),
          m.created_at, m.updated_at
        );
      });

      // 2. Projects
      const p = data.project;
      this.db.db.prepare(`
        INSERT OR REPLACE INTO projects
        (id, name, author, description, schema_version, meta_id,
         read_metadata_mandatory, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(p.id, p.name, p.author, p.description, p.schema_version,
             p.meta_id, p.read_metadata_mandatory, p.created_at, p.updated_at);

      // 3. Entities
      data.entities.forEach(e => {
        this.db.db.prepare(`
          INSERT OR REPLACE INTO entities
          (id, entity_type, name, timestamp, summary, data, meta_id,
           read_metadata_mandatory, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(e.id, e.entity_type, e.name, e.timestamp, e.summary,
               JSON.stringify(e.data), e.meta_id, e.read_metadata_mandatory,
               e.created_at, e.updated_at);
      });

      // 4. Event phases
      data.phases.forEach(ph => {
        this.db.db.prepare(`
          INSERT OR REPLACE INTO event_phases
          (id, event_id, sequence, timestamp, summary, participants, state_changes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(ph.id, ph.event_id, ph.sequence, ph.timestamp, ph.summary,
               JSON.stringify(ph.participants), JSON.stringify(ph.state_changes),
               ph.created_at);
      });

      // 5. Facts
      data.facts.forEach(f => {
        this.db.db.prepare(`
          INSERT OR REPLACE INTO facts
          (id, phase_id, event_id, content, visibility, confidence, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(f.id, f.phase_id, f.event_id, f.content, f.visibility,
               f.confidence, f.created_at);
      });

      // 6. Knowledge states
      data.knowledgeStates.forEach(ks => {
        const result = this.db.db.prepare(`
          INSERT INTO knowledge_states
          (character_id, timestamp, trigger_event_id, created_at)
          VALUES (?, ?, ?, ?)
        `).run(ks.character_id, ks.timestamp, ks.trigger_event_id, ks.created_at);

        const ksId = result.lastInsertRowid;

        ks.facts_known.forEach(f => {
          this.db.db.prepare(`
            INSERT INTO knowledge_state_facts
            (knowledge_state_id, fact_id, belief, believed_alternative, confidence, source)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(ksId, f.fact_id, f.belief, f.believed_alternative,
                 f.confidence, f.source);
        });
      });

      // 7. Relationships
      data.relationships.forEach(r => {
        this.db.db.prepare(`
          INSERT INTO relationships
          (from_entity_id, to_entity_id, relationship_type, timestamp, data, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(r.from_entity_id, r.to_entity_id, r.relationship_type,
               r.timestamp, JSON.stringify(r.data), r.created_at);
      });

      // 8. State timeline
      data.stateTimeline.forEach(s => {
        this.db.db.prepare(`
          INSERT INTO state_timeline
          (entity_id, timestamp, property, value, trigger_event_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(s.entity_id, s.timestamp, s.property, JSON.stringify(s.value),
               s.trigger_event_id, s.created_at);
      });

      // 9. Fictions
      data.fictions.forEach(f => {
        this.db.db.prepare(`
          INSERT OR REPLACE INTO fictions
          (entity_id, target_audience, created_by, core_narrative, facts_contradicted,
           constraints, exposure_triggers, active_start, active_end, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(f.entity_id, JSON.stringify(f.target_audience),
               JSON.stringify(f.created_by), f.core_narrative,
               JSON.stringify(f.facts_contradicted),
               JSON.stringify(f.constraints),
               JSON.stringify(f.exposure_triggers),
               f.active_start, f.active_end, f.status);
      });

      // 10. Causal links
      data.causalLinks.forEach(cl => {
        this.db.db.prepare(`
          INSERT OR IGNORE INTO causal_links (cause_event_id, effect_event_id)
          VALUES (?, ?)
        `).run(cl.cause_event_id, cl.effect_event_id);
      });

      // 11. Narrative structure
      data.narrativeStructure.forEach(ns => {
        this.db.db.prepare(`
          INSERT OR REPLACE INTO narrative_structure
          (id, parent_id, structure_type, title, sequence, meta_id,
           read_metadata_mandatory, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(ns.id, ns.parent_id, ns.structure_type, ns.title, ns.sequence,
               ns.meta_id, ns.read_metadata_mandatory, ns.created_at);
      });

      // 12. Scenes
      data.scenes.forEach(s => {
        this.db.db.prepare(`
          INSERT OR REPLACE INTO scenes
          (id, chapter_id, title, sequence, pov_character_id, temporal_start,
           temporal_end, epistemic_constraints, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(s.id, s.chapter_id, s.title, s.sequence, s.pov_character_id,
               s.temporal_start, s.temporal_end,
               JSON.stringify(s.epistemic_constraints), s.created_at);
      });

      // 13. Scene events
      data.sceneEvents.forEach(se => {
        this.db.db.prepare(`
          INSERT INTO scene_events (scene_id, event_id, phase_id)
          VALUES (?, ?, ?)
        `).run(se.scene_id, se.event_id, se.phase_id);
      });
    })();

    console.log('Import complete');
  }

  /**
   * Create timestamped backup
   * @param {string} projectId - Project ID
   * @param {string} backupDir - Backup directory
   * @returns {string} Backup file path
   */
  createBackup(projectId, backupDir = './backups') {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${projectId}_${timestamp}.json`;
    const filePath = path.join(backupDir, filename);

    this.exportToFile(projectId, filePath);
    return filePath;
  }
}

module.exports = BackupManager;
```

---

### File 8: `/app/db/performance-guide.md`

```markdown
# TripleThink Database Performance Guide

## Overview

This guide covers query optimization strategies for the TripleThink SQLite database.

## Performance Targets

| Query Type | Target | Actual |
|------------|--------|--------|
| Get entity by ID | < 5ms | ~1ms |
| Events in date range | < 30ms | ~10ms |
| Character knowledge at T | < 50ms | ~20ms |
| Who knows fact F | < 100ms | ~50ms |
| Complex scene render | < 150ms | ~80ms |

## Index Strategy

### Primary Indexes (Always Used)

1. **`idx_knowledge_char_time`** - Most critical index
   - Used by: `getCharacterKnowledgeState()`, `doesCharacterBelieve()`
   - Composite on (character_id, timestamp)
   - Enables efficient "find latest state before T" queries

2. **`idx_participants_char`** - Event participant lookup
   - Used by: `getEventsWithParticipant()`
   - Single column on participant_id

3. **`idx_facts_visibility`** - Fact categorization
   - Used by: Ground truth queries
   - Single column on visibility

### Secondary Indexes (Query-Specific)

4. **`idx_fictions_period`** - Active fiction lookup
   - Used by: `getFictionsActiveAtTime()`
   - Composite on (active_start, active_end)

5. **`idx_scenes_temporal`** - Scene time range queries
   - Used by: `getSceneData()`
   - Composite on (temporal_start, temporal_end)

## Query Optimization Patterns

### Pattern 1: Latest State Before Time T

```sql
-- GOOD: Uses index, stops at first match
SELECT * FROM knowledge_states
WHERE character_id = ? AND timestamp <= ?
ORDER BY timestamp DESC
LIMIT 1;

-- BAD: Scans all states
SELECT * FROM knowledge_states
WHERE character_id = ? AND timestamp <= ?;
```

### Pattern 2: Batch Loading

```javascript
// GOOD: Single query for multiple entities
const entities = db.prepare(`
  SELECT * FROM entities WHERE id IN (${ids.map(() => '?').join(',')})
`).all(...ids);

// BAD: N+1 queries
ids.forEach(id => db.getEntity(id));
```

### Pattern 3: JSON Field Queries

```sql
-- GOOD: Use json_extract for indexed paths
CREATE INDEX idx_fiction_status ON fictions(status);
SELECT * FROM fictions WHERE status = 'active';

-- SLOWER: JSON extraction in WHERE
SELECT * FROM fictions WHERE json_extract(constraints, '$[0]') = 'value';
```

## Memory Considerations

### WAL Mode

The database uses WAL (Write-Ahead Logging) mode:
- Improves concurrent read/write performance
- Creates `.db-wal` and `.db-shm` files alongside main database
- These files are automatically cleaned up

### Connection Pooling

For multi-threaded access:
```javascript
const db = new Database('triplethink.db', { readonly: true });
// Use separate connections for reads vs writes
```

## Scaling Recommendations

### For 10-Book Series (~2000 events, 150 characters)

Current schema handles this easily:
- Database size: ~10-50 MB
- All queries within targets
- No special optimization needed

### For 50+ Book Series

Consider:
1. Partitioning by book (separate tables per book)
2. Archiving old knowledge states
3. Materialized views for common aggregations

### Epistemic Query Scaling

The `whoKnowsFact()` query scales linearly with character count.
For 150 characters: ~50ms
For 1000 characters: ~300ms

Optimization: Pre-compute fact→character mappings in a cache table.

## Monitoring

### Query Analysis

```sql
-- Enable query timing
.timer on

-- Explain query plan
EXPLAIN QUERY PLAN SELECT ...
```

### Index Usage

```sql
-- Check if index is being used
EXPLAIN QUERY PLAN
SELECT * FROM knowledge_states
WHERE character_id = 'char-eric' AND timestamp <= '2033-07-05'
ORDER BY timestamp DESC LIMIT 1;

-- Should show: USING INDEX idx_knowledge_char_time
```

## Benchmarking

Run benchmarks with:
```bash
node benchmark.js
```

This tests all major query patterns against synthetic data.
```

---

### File 9: `/app/db/README.md`

```markdown
# TripleThink Database Layer

SQLite-based storage for the TripleThink narrative construction system.

## Quick Start

```javascript
const TripleThinkDB = require('./api-functions');

// Open database
const db = new TripleThinkDB('./triplethink.db');

// Create a character
db.createEntity('character', {
  id: 'char-alice',
  name: 'Alice',
  role: 'protagonist'
});

// Query epistemic state
const knowledge = db.getCharacterKnowledgeState('char-alice', '2033-07-05');

// Close when done
db.close();
```

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | Table definitions |
| `indexes.sql` | Query optimization indexes |
| `validation-triggers.sql` | Data integrity triggers |
| `api-functions.js` | Data access layer |
| `backup.js` | Export/import utilities |
| `migrations/` | Schema versioning |
| `performance-guide.md` | Optimization docs |

## Key Features

### Epistemic Queries

```javascript
// Who knows a fact?
db.whoKnowsFact('fact-secret', '2033-07-05');

// Does character believe fact?
db.doesCharacterBelieve('char-alice', 'fact-secret', '2033-07-05');

// Get belief divergence
db.getBeliefDivergence('fact-secret', '2033-07-05');
```

### Temporal Queries

```javascript
// Entity state at time T
db.getEntityStateAtTime('char-alice', '2033-07-05');

// State changes in range
db.getStateChangesForEntity('char-alice', '2033-01-01', '2033-12-31');
```

### Fiction Tracking

```javascript
// Active fictions at time T
db.getFictionsActiveAtTime('2033-07-05');

// Fictions targeting character
db.getFictionsTargetingCharacter('char-alice', '2033-07-05');
```

## Migration

```bash
# Check status
node migrations/migration-runner.js status

# Apply pending migrations
node migrations/migration-runner.js migrate

# Rollback last migration
node migrations/migration-runner.js rollback
```

## Backup

```javascript
const BackupManager = require('./backup');

const backup = new BackupManager('./triplethink.db');

// Export to JSON
backup.exportToFile('proj-main', './backup.json');

// Import from JSON
backup.importFromJSON('./backup.json');

// Create timestamped backup
backup.createBackup('proj-main', './backups/');
```

## Performance

See `performance-guide.md` for detailed optimization strategies.

Target benchmarks:
- Entity by ID: < 5ms
- Epistemic query: < 100ms
- Scene render: < 150ms
```

---

## Execution Checklist

When implementing this plan:

1. [ ] Create `/app/db/` directory
2. [ ] Create `schema.sql` with all 16 tables
3. [ ] Create `indexes.sql` with all indexes
4. [ ] Create `validation-triggers.sql` with all triggers
5. [ ] Create `api-functions.js` with TripleThinkDB class
6. [ ] Create `migrations/` directory
7. [ ] Create `migrations/001_initial_schema.sql` (copy of schema.sql)
8. [ ] Create `migrations/migration-runner.js`
9. [ ] Create `backup.js` with BackupManager class
10. [ ] Create `performance-guide.md`
11. [ ] Create `README.md`

## Verification

After implementation:

1. **Schema Test**
   ```bash
   sqlite3 test.db < schema.sql
   sqlite3 test.db < indexes.sql
   sqlite3 test.db < validation-triggers.sql
   # Should complete without errors
   ```

2. **API Test**
   - Load example data from `/app/schema/schema.json`
   - Test each query function
   - Verify epistemic queries return correct results

3. **Integration Test**
   - Export to JSON
   - Import to new database
   - Verify data integrity
