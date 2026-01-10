/**
 * TripleThink Export/Import Routes
 * Data export and import operations
 */

const express = require('express');
const router = express.Router();

const {
  asyncHandler,
  NotFoundError,
  ValidationError,
  validateRequired
} = require('../error-handling');

const { exportRateLimit } = require('../middleware/rate-limit');

// ============================================================
// ROUTES
// ============================================================

/**
 * GET /api/export/project
 * Export complete project data
 */
router.get('/project', exportRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { format = 'json', include_metadata = 'true' } = req.query;

  if (format !== 'json') {
    throw new ValidationError(`Export format "${format}" not supported yet. Use "json".`);
  }

  const exportData = {
    export_info: {
      format: 'triplethink-export-v1',
      exported_at: new Date().toISOString(),
      schema_version: '1.0.0'
    },
    project: null,
    entities: [],
    metadata: [],
    event_phases: [],
    facts: [],
    knowledge_states: [],
    knowledge_state_facts: [],
    relationships: [],
    state_timeline: [],
    fictions: [],
    causal_links: [],
    narrative_structure: [],
    scenes: [],
    scene_events: []
  };

  // Export project
  const project = db.db.prepare('SELECT * FROM projects LIMIT 1').get();
  if (project) {
    exportData.project = project;
  }

  // Export entities
  const entities = db.db.prepare('SELECT * FROM entities ORDER BY id').all();
  exportData.entities = entities.map(e => ({
    ...e,
    data: JSON.parse(e.data)
  }));

  // Export metadata
  if (include_metadata === 'true') {
    const metadata = db.db.prepare('SELECT * FROM metadata ORDER BY id').all();
    exportData.metadata = metadata.map(m => {
      ['author_notes', 'ai_guidance', 'dev_status', 'version_info',
       'prose_guidance', 'consistency_rules'].forEach(field => {
        if (m[field]) m[field] = JSON.parse(m[field]);
      });
      return m;
    });
  }

  // Export event phases
  const phases = db.db.prepare('SELECT * FROM event_phases ORDER BY event_id, sequence').all();
  exportData.event_phases = phases.map(p => ({
    ...p,
    participants: JSON.parse(p.participants),
    state_changes: p.state_changes ? JSON.parse(p.state_changes) : null
  }));

  // Export facts
  exportData.facts = db.db.prepare('SELECT * FROM facts ORDER BY id').all();

  // Export knowledge states
  exportData.knowledge_states = db.db.prepare(
    'SELECT * FROM knowledge_states ORDER BY character_id, timestamp'
  ).all();

  // Export knowledge state facts
  exportData.knowledge_state_facts = db.db.prepare(
    'SELECT * FROM knowledge_state_facts ORDER BY knowledge_state_id'
  ).all();

  // Export relationships
  const relationships = db.db.prepare('SELECT * FROM relationships ORDER BY from_entity_id').all();
  exportData.relationships = relationships.map(r => ({
    ...r,
    data: r.data ? JSON.parse(r.data) : null
  }));

  // Export state timeline
  const stateTimeline = db.db.prepare('SELECT * FROM state_timeline ORDER BY entity_id, timestamp').all();
  exportData.state_timeline = stateTimeline.map(s => ({
    ...s,
    value: JSON.parse(s.value)
  }));

  // Export fictions
  const fictions = db.db.prepare('SELECT * FROM fictions ORDER BY entity_id').all();
  exportData.fictions = fictions.map(f => ({
    ...f,
    target_audience: JSON.parse(f.target_audience),
    created_by: JSON.parse(f.created_by),
    facts_contradicted: JSON.parse(f.facts_contradicted),
    constraints: f.constraints ? JSON.parse(f.constraints) : null,
    exposure_triggers: f.exposure_triggers ? JSON.parse(f.exposure_triggers) : null
  }));

  // Export causal links
  exportData.causal_links = db.db.prepare(
    'SELECT * FROM causal_links ORDER BY cause_event_id'
  ).all();

  // Export narrative structure
  exportData.narrative_structure = db.db.prepare(
    'SELECT * FROM narrative_structure ORDER BY structure_type, sequence'
  ).all();

  // Export scenes
  const scenes = db.db.prepare('SELECT * FROM scenes ORDER BY chapter_id, sequence').all();
  exportData.scenes = scenes.map(s => ({
    ...s,
    epistemic_constraints: JSON.parse(s.epistemic_constraints)
  }));

  // Export scene events
  exportData.scene_events = db.db.prepare('SELECT * FROM scene_events ORDER BY scene_id').all();

  // Add summary
  exportData.summary = {
    entities: exportData.entities.length,
    metadata: exportData.metadata.length,
    events: exportData.entities.filter(e => e.entity_type === 'event').length,
    characters: exportData.entities.filter(e => e.entity_type === 'character').length,
    fictions: exportData.fictions.length,
    facts: exportData.facts.length,
    knowledge_states: exportData.knowledge_states.length,
    scenes: exportData.scenes.length
  };

  res.json(exportData);
}));

/**
 * POST /api/export/entities
 * Export specific entities
 */
router.post('/entities', exportRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { entity_ids, include_metadata = 'true', include_related = 'false' } = req.body;

  validateRequired(req.body, ['entity_ids']);

  if (!Array.isArray(entity_ids) || entity_ids.length === 0) {
    throw new ValidationError('entity_ids must be a non-empty array');
  }

  const exportData = {
    export_info: {
      format: 'triplethink-partial-export-v1',
      exported_at: new Date().toISOString(),
      entity_ids: entity_ids
    },
    entities: [],
    metadata: [],
    related: {
      event_phases: [],
      facts: [],
      knowledge_states: [],
      relationships: [],
      fictions: []
    }
  };

  // Export requested entities
  for (const id of entity_ids) {
    const entity = db.getEntity(id, { includeMetadata: include_metadata === 'true' ? 'always' : 'never' });

    if (!entity) {
      throw new NotFoundError('Entity', id);
    }

    exportData.entities.push(entity);

    if (entity.metadata) {
      exportData.metadata.push(entity.metadata);
    }

    // Include related data
    if (include_related === 'true') {
      // Event phases
      if (entity.entity_type === 'event') {
        const phases = db.db.prepare('SELECT * FROM event_phases WHERE event_id = ?').all(id);
        exportData.related.event_phases.push(...phases.map(p => ({
          ...p,
          participants: JSON.parse(p.participants),
          state_changes: p.state_changes ? JSON.parse(p.state_changes) : null
        })));

        // Facts
        const facts = db.db.prepare('SELECT * FROM facts WHERE event_id = ?').all(id);
        exportData.related.facts.push(...facts);
      }

      // Knowledge states for characters
      if (entity.entity_type === 'character' || entity.entity_type === 'system') {
        const ks = db.db.prepare('SELECT * FROM knowledge_states WHERE character_id = ?').all(id);
        for (const state of ks) {
          const facts = db.db.prepare('SELECT * FROM knowledge_state_facts WHERE knowledge_state_id = ?').all(state.id);
          exportData.related.knowledge_states.push({
            ...state,
            facts_known: facts
          });
        }
      }

      // Relationships
      const rels = db.db.prepare('SELECT * FROM relationships WHERE from_entity_id = ? OR to_entity_id = ?').all(id, id);
      exportData.related.relationships.push(...rels.map(r => ({
        ...r,
        data: r.data ? JSON.parse(r.data) : null
      })));

      // Fiction data
      if (entity.entity_type === 'fiction') {
        const fiction = db.db.prepare('SELECT * FROM fictions WHERE entity_id = ?').get(id);
        if (fiction) {
          exportData.related.fictions.push({
            ...fiction,
            target_audience: JSON.parse(fiction.target_audience),
            created_by: JSON.parse(fiction.created_by),
            facts_contradicted: JSON.parse(fiction.facts_contradicted),
            constraints: fiction.constraints ? JSON.parse(fiction.constraints) : null,
            exposure_triggers: fiction.exposure_triggers ? JSON.parse(fiction.exposure_triggers) : null
          });
        }
      }
    }
  }

  res.json(exportData);
}));

/**
 * POST /api/import/project
 * Import project data
 */
router.post('/project', exportRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { data, mode = 'merge', dry_run = 'false' } = req.body;

  validateRequired(req.body, ['data']);

  if (!data.export_info?.format?.startsWith('triplethink-')) {
    throw new ValidationError('Invalid export format. Expected triplethink export format.');
  }

  const results = {
    dry_run: dry_run === 'true',
    mode,
    imported: {
      entities: 0,
      metadata: 0,
      event_phases: 0,
      facts: 0,
      knowledge_states: 0,
      knowledge_state_facts: 0,
      relationships: 0,
      state_timeline: 0,
      fictions: 0,
      causal_links: 0,
      narrative_structure: 0,
      scenes: 0,
      scene_events: 0
    },
    skipped: {
      existing: [],
      errors: []
    },
    conflicts: []
  };

  // Check for conflicts
  if (data.entities) {
    for (const entity of data.entities) {
      const existing = db.getEntity(entity.id, { includeMetadata: 'never' });
      if (existing) {
        if (mode === 'skip') {
          results.skipped.existing.push({ type: 'entity', id: entity.id });
        } else if (mode === 'merge') {
          results.conflicts.push({
            type: 'entity',
            id: entity.id,
            action: 'update'
          });
        } else if (mode === 'replace') {
          results.conflicts.push({
            type: 'entity',
            id: entity.id,
            action: 'replace'
          });
        }
      }
    }
  }

  // If dry run, return analysis without importing
  if (dry_run === 'true') {
    return res.json({
      data: {
        ...results,
        would_import: {
          entities: data.entities?.length || 0,
          metadata: data.metadata?.length || 0,
          event_phases: data.event_phases?.length || 0,
          facts: data.facts?.length || 0,
          fictions: data.fictions?.length || 0,
          knowledge_states: data.knowledge_states?.length || 0,
          scenes: data.scenes?.length || 0
        }
      }
    });
  }

  // Actually import data
  db.db.transaction(() => {
    // Import entities
    if (data.entities) {
      const entityStmt = db.db.prepare(`
        INSERT INTO entities (id, entity_type, name, timestamp, summary, data, meta_id, read_metadata_mandatory)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO ${mode === 'replace' ? 'REPLACE' : 'NOTHING'}
      `);

      for (const entity of data.entities) {
        try {
          const result = entityStmt.run(
            entity.id,
            entity.entity_type,
            entity.name,
            entity.timestamp,
            entity.summary,
            JSON.stringify(entity.data),
            entity.meta_id,
            entity.read_metadata_mandatory ? 1 : 0
          );
          if (result.changes > 0) results.imported.entities++;
        } catch (e) {
          results.skipped.errors.push({ type: 'entity', id: entity.id, error: e.message });
        }
      }
    }

    // Import metadata
    if (data.metadata) {
      for (const meta of data.metadata) {
        try {
          db.saveMetadata(meta);
          results.imported.metadata++;
        } catch (e) {
          results.skipped.errors.push({ type: 'metadata', id: meta.id, error: e.message });
        }
      }
    }

    // Import event phases
    if (data.event_phases) {
      const phaseStmt = db.db.prepare(`
        INSERT INTO event_phases (id, event_id, sequence, timestamp, summary, participants, state_changes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO ${mode === 'replace' ? 'REPLACE' : 'NOTHING'}
      `);

      for (const phase of data.event_phases) {
        try {
          const result = phaseStmt.run(
            phase.id,
            phase.event_id,
            phase.sequence,
            phase.timestamp,
            phase.summary,
            JSON.stringify(phase.participants),
            phase.state_changes ? JSON.stringify(phase.state_changes) : null
          );
          if (result.changes > 0) results.imported.event_phases++;
        } catch (e) {
          results.skipped.errors.push({ type: 'event_phase', id: phase.id, error: e.message });
        }
      }
    }

    // Import facts
    if (data.facts) {
      const factStmt = db.db.prepare(`
        INSERT INTO facts (id, phase_id, event_id, content, visibility, confidence)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO ${mode === 'replace' ? 'REPLACE' : 'NOTHING'}
      `);

      for (const fact of data.facts) {
        try {
          const result = factStmt.run(
            fact.id,
            fact.phase_id,
            fact.event_id,
            fact.content,
            fact.visibility,
            fact.confidence
          );
          if (result.changes > 0) results.imported.facts++;
        } catch (e) {
          results.skipped.errors.push({ type: 'fact', id: fact.id, error: e.message });
        }
      }
    }

    // Import fictions
    if (data.fictions) {
      const fictionStmt = db.db.prepare(`
        INSERT INTO fictions (entity_id, target_audience, created_by, core_narrative, facts_contradicted, constraints, exposure_triggers, active_start, active_end, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(entity_id) DO ${mode === 'replace' ? 'REPLACE' : 'NOTHING'}
      `);

      for (const fiction of data.fictions) {
        try {
          const result = fictionStmt.run(
            fiction.entity_id,
            JSON.stringify(fiction.target_audience),
            JSON.stringify(fiction.created_by),
            fiction.core_narrative,
            JSON.stringify(fiction.facts_contradicted),
            fiction.constraints ? JSON.stringify(fiction.constraints) : null,
            fiction.exposure_triggers ? JSON.stringify(fiction.exposure_triggers) : null,
            fiction.active_start,
            fiction.active_end,
            fiction.status
          );
          if (result.changes > 0) results.imported.fictions++;
        } catch (e) {
          results.skipped.errors.push({ type: 'fiction', id: fiction.entity_id, error: e.message });
        }
      }
    }

    // Import knowledge states
    if (data.knowledge_states) {
      const ksStmt = db.db.prepare(`
        INSERT INTO knowledge_states (id, character_id, timestamp, trigger_event_id)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO ${mode === 'replace' ? 'REPLACE' : 'NOTHING'}
      `);

      for (const ks of data.knowledge_states) {
        try {
          const result = ksStmt.run(ks.id, ks.character_id, ks.timestamp, ks.trigger_event_id);
          if (result.changes > 0) results.imported.knowledge_states++;
        } catch (e) {
          results.skipped.errors.push({ type: 'knowledge_state', id: ks.id, error: e.message });
        }
      }
    }

    // Import knowledge state facts
    if (data.knowledge_state_facts) {
      const ksfStmt = db.db.prepare(`
        INSERT INTO knowledge_state_facts (knowledge_state_id, fact_id, belief, believed_alternative, confidence, source)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const ksf of data.knowledge_state_facts) {
        try {
          ksfStmt.run(
            ksf.knowledge_state_id,
            ksf.fact_id,
            ksf.belief,
            ksf.believed_alternative,
            ksf.confidence,
            ksf.source
          );
          results.imported.knowledge_state_facts++;
        } catch (e) {
          results.skipped.errors.push({ type: 'knowledge_state_fact', error: e.message });
        }
      }
    }

    // Import causal links
    if (data.causal_links) {
      const clStmt = db.db.prepare(`
        INSERT OR IGNORE INTO causal_links (cause_event_id, effect_event_id) VALUES (?, ?)
      `);

      for (const link of data.causal_links) {
        try {
          const result = clStmt.run(link.cause_event_id, link.effect_event_id);
          if (result.changes > 0) results.imported.causal_links++;
        } catch (e) {
          results.skipped.errors.push({ type: 'causal_link', error: e.message });
        }
      }
    }

    // Import narrative structure
    if (data.narrative_structure) {
      const nsStmt = db.db.prepare(`
        INSERT INTO narrative_structure (id, parent_id, structure_type, title, sequence, meta_id, read_metadata_mandatory)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO ${mode === 'replace' ? 'REPLACE' : 'NOTHING'}
      `);

      for (const ns of data.narrative_structure) {
        try {
          const result = nsStmt.run(
            ns.id,
            ns.parent_id,
            ns.structure_type,
            ns.title,
            ns.sequence,
            ns.meta_id,
            ns.read_metadata_mandatory ? 1 : 0
          );
          if (result.changes > 0) results.imported.narrative_structure++;
        } catch (e) {
          results.skipped.errors.push({ type: 'narrative_structure', id: ns.id, error: e.message });
        }
      }
    }

    // Import scenes
    if (data.scenes) {
      const sceneStmt = db.db.prepare(`
        INSERT INTO scenes (id, chapter_id, title, sequence, pov_character_id, temporal_start, temporal_end, epistemic_constraints)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO ${mode === 'replace' ? 'REPLACE' : 'NOTHING'}
      `);

      for (const scene of data.scenes) {
        try {
          const result = sceneStmt.run(
            scene.id,
            scene.chapter_id,
            scene.title,
            scene.sequence,
            scene.pov_character_id,
            scene.temporal_start,
            scene.temporal_end,
            JSON.stringify(scene.epistemic_constraints)
          );
          if (result.changes > 0) results.imported.scenes++;
        } catch (e) {
          results.skipped.errors.push({ type: 'scene', id: scene.id, error: e.message });
        }
      }
    }

    // Import scene events
    if (data.scene_events) {
      const seStmt = db.db.prepare(`
        INSERT INTO scene_events (scene_id, event_id, phase_id) VALUES (?, ?, ?)
      `);

      for (const se of data.scene_events) {
        try {
          seStmt.run(se.scene_id, se.event_id, se.phase_id);
          results.imported.scene_events++;
        } catch (e) {
          results.skipped.errors.push({ type: 'scene_event', error: e.message });
        }
      }
    }
  })();

  res.json({ data: results });
}));

/**
 * GET /api/export/schema
 * Export the JSON schema
 */
router.get('/schema', exportRateLimit(), asyncHandler(async (req, res) => {
  const fs = require('fs');
  const path = require('path');

  const schemaPath = path.join(__dirname, '../../schema/schema.json');

  if (!fs.existsSync(schemaPath)) {
    throw new NotFoundError('Schema', 'schema.json');
  }

  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

  res.json(schema);
}));

// ============================================================
// EXPORTS
// ============================================================

module.exports = router;
