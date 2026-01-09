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
