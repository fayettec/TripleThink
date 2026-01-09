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
