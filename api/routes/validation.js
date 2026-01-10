/**
 * TripleThink Validation Routes
 * Consistency validation for entities, timelines, and epistemic states
 */

const express = require('express');
const router = express.Router();

const {
  asyncHandler,
  NotFoundError,
  ValidationError,
  EpistemicViolationError,
  TemporalInconsistencyError,
  FictionScopeViolationError,
  CausalViolationError,
  validateRequired,
  validateTimestamp
} = require('../error-handling');

const { standardRateLimit, epistemicRateLimit } = require('../middleware/rate-limit');

// ============================================================
// ROUTES
// ============================================================

/**
 * POST /api/validate/consistency
 * Validate proposed changes to an entity
 */
router.post('/consistency', epistemicRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { entity_id, proposed_changes } = req.body;

  validateRequired(req.body, ['entity_id', 'proposed_changes']);

  // Get entity
  const entity = db.getEntity(entity_id, { includeMetadata: 'always' });
  if (!entity) {
    throw new NotFoundError('Entity', entity_id);
  }

  const violations = [];
  const warnings = [];

  // Entity-type specific validation
  switch (entity.entity_type) {
    case 'event':
      await validateEventChanges(db, entity, proposed_changes, violations, warnings);
      break;
    case 'character':
      await validateCharacterChanges(db, entity, proposed_changes, violations, warnings);
      break;
    case 'fiction':
      await validateFictionChanges(db, entity, proposed_changes, violations, warnings);
      break;
    default:
      await validateGenericChanges(db, entity, proposed_changes, violations, warnings);
  }

  // Check consistency rules from metadata
  if (entity.metadata?.consistency_rules) {
    for (const rule of entity.metadata.consistency_rules) {
      warnings.push({
        type: 'CONSISTENCY_RULE',
        message: `Entity has consistency rule: ${rule}`,
        severity: 'info'
      });
    }
  }

  res.json({
    data: {
      entity_id,
      entity_type: entity.entity_type,
      valid: violations.length === 0,
      violations,
      warnings
    }
  });
}));

/**
 * GET /api/validate/timeline
 * Validate timeline consistency for a book or entire project
 */
router.get('/timeline', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { book_id } = req.query;

  const violations = [];
  const warnings = [];

  // Get all events
  let events;
  if (book_id) {
    events = db.getChapterEvents(book_id);
  } else {
    const stmt = db.db.prepare(`
      SELECT * FROM entities WHERE entity_type = 'event' ORDER BY timestamp
    `);
    events = stmt.all().map(e => ({ ...e, data: JSON.parse(e.data) }));
  }

  // Check for timestamp issues
  for (const event of events) {
    if (!event.timestamp) {
      violations.push({
        type: 'MISSING_TIMESTAMP',
        event_id: event.id,
        event_name: event.name,
        message: 'Event has no timestamp'
      });
    }
  }

  // Check causal link consistency
  const causalStmt = db.db.prepare(`
    SELECT cl.*,
           e1.timestamp as cause_timestamp, e1.name as cause_name,
           e2.timestamp as effect_timestamp, e2.name as effect_name
    FROM causal_links cl
    JOIN entities e1 ON cl.cause_event_id = e1.id
    JOIN entities e2 ON cl.effect_event_id = e2.id
  `);

  const causalLinks = causalStmt.all();

  for (const link of causalLinks) {
    if (link.cause_timestamp && link.effect_timestamp) {
      if (new Date(link.cause_timestamp) > new Date(link.effect_timestamp)) {
        violations.push({
          type: 'CAUSAL_ORDER_VIOLATION',
          cause_event_id: link.cause_event_id,
          cause_name: link.cause_name,
          cause_timestamp: link.cause_timestamp,
          effect_event_id: link.effect_event_id,
          effect_name: link.effect_name,
          effect_timestamp: link.effect_timestamp,
          message: 'Cause occurs after effect'
        });
      }
    }
  }

  // Check for overlapping scenes
  const scenesStmt = db.db.prepare(`
    SELECT s1.id as scene1_id, s1.title as scene1_title,
           s1.temporal_start as s1_start, s1.temporal_end as s1_end,
           s1.pov_character_id as s1_pov,
           s2.id as scene2_id, s2.title as scene2_title,
           s2.temporal_start as s2_start, s2.temporal_end as s2_end,
           s2.pov_character_id as s2_pov
    FROM scenes s1
    JOIN scenes s2 ON s1.id < s2.id
    WHERE s1.pov_character_id = s2.pov_character_id
      AND s1.temporal_end > s2.temporal_start
      AND s1.temporal_start < s2.temporal_end
  `);

  const overlaps = scenesStmt.all();

  for (const overlap of overlaps) {
    warnings.push({
      type: 'SCENE_OVERLAP',
      scene1: {
        id: overlap.scene1_id,
        title: overlap.scene1_title,
        time_range: { start: overlap.s1_start, end: overlap.s1_end }
      },
      scene2: {
        id: overlap.scene2_id,
        title: overlap.scene2_title,
        time_range: { start: overlap.s2_start, end: overlap.s2_end }
      },
      pov_character_id: overlap.s1_pov,
      message: 'Scenes with same POV character overlap in time'
    });
  }

  res.json({
    data: {
      book_id: book_id || 'all',
      valid: violations.length === 0,
      events_checked: events.length,
      causal_links_checked: causalLinks.length,
      violations,
      warnings
    }
  });
}));

/**
 * POST /api/validate/fiction-scope
 * Validate fiction audience constraints
 */
router.post('/fiction-scope', epistemicRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { fiction_id, proposed_audience } = req.body;

  validateRequired(req.body, ['fiction_id']);

  // Get fiction
  const fictionStmt = db.db.prepare(`
    SELECT f.*, e.name FROM fictions f
    JOIN entities e ON f.entity_id = e.id
    WHERE f.entity_id = ?
  `);
  const fiction = fictionStmt.get(fiction_id);

  if (!fiction) {
    throw new NotFoundError('Fiction', fiction_id);
  }

  const currentAudience = JSON.parse(fiction.target_audience);
  const violations = [];
  const warnings = [];

  // If proposing new audience, check if it expands
  if (proposed_audience) {
    const newMembers = proposed_audience.filter(id => !currentAudience.includes(id));

    if (newMembers.length > 0) {
      violations.push({
        type: 'AUDIENCE_EXPANSION',
        fiction_id: fiction_id,
        fiction_name: fiction.name,
        current_audience: currentAudience,
        new_members: newMembers,
        message: 'Fiction target audience would be expanded',
        severity: 'critical'
      });
    }
  }

  // Check for exposure triggers
  const exposureTriggers = fiction.exposure_triggers ? JSON.parse(fiction.exposure_triggers) : [];

  // Check knowledge states of audience members
  const timestamp = new Date().toISOString();
  const factsContradicted = JSON.parse(fiction.facts_contradicted);

  for (const charId of currentAudience) {
    const ks = db.getCharacterKnowledgeState(charId, timestamp);

    if (ks) {
      // Check if character has knowledge that contradicts fiction
      for (const fc of factsContradicted) {
        const factBelief = ks.facts_known.find(f => f.fact_id === fc.ground_truth_fact_id);

        if (factBelief && factBelief.belief === 'true') {
          violations.push({
            type: 'FICTION_COMPROMISED',
            fiction_id: fiction_id,
            character_id: charId,
            fact_id: fc.ground_truth_fact_id,
            message: `Character "${charId}" knows ground truth for contradicted fact`,
            severity: 'critical'
          });
        }
      }
    }
  }

  // Check for potential exposure scenarios
  for (const trigger of exposureTriggers) {
    warnings.push({
      type: 'EXPOSURE_TRIGGER',
      trigger: trigger.trigger,
      consequence: trigger.consequence,
      severity: 'warning'
    });
  }

  res.json({
    data: {
      fiction_id,
      fiction_name: fiction.name,
      current_audience: currentAudience,
      proposed_audience: proposed_audience || null,
      valid: violations.length === 0,
      violations,
      warnings
    }
  });
}));

/**
 * POST /api/validate/knowledge-transfer
 * Validate a proposed knowledge transfer between characters
 */
router.post('/knowledge-transfer', epistemicRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { from_character_id, to_character_id, fact_ids, timestamp } = req.body;

  validateRequired(req.body, ['from_character_id', 'to_character_id', 'fact_ids', 'timestamp']);
  validateTimestamp(timestamp, 'timestamp');

  // Get source character's knowledge state
  const sourceKS = db.getCharacterKnowledgeState(from_character_id, timestamp);

  // Get target character's knowledge state
  const targetKS = db.getCharacterKnowledgeState(to_character_id, timestamp);

  // Get active fictions
  const activeFictions = db.getFictionsActiveAtTime(timestamp);

  const violations = [];
  const warnings = [];
  const transferableKnowledge = [];

  for (const factId of fact_ids) {
    // Check if source knows the fact
    const sourceBelief = sourceKS?.facts_known.find(f => f.fact_id === factId);

    if (!sourceBelief) {
      violations.push({
        type: 'SOURCE_UNKNOWN',
        fact_id: factId,
        from_character_id,
        message: `Source character does not know fact "${factId}" at this timestamp`
      });
      continue;
    }

    // Check for fiction constraints
    for (const fiction of activeFictions) {
      const targetAudience = fiction.target_audience;
      const factsContradicted = fiction.facts_contradicted;

      // Check if this fact is contradicted by a fiction
      const contradicted = factsContradicted.find(fc => fc.ground_truth_fact_id === factId);

      if (contradicted) {
        // Check if transfer would violate fiction scope
        const sourceInAudience = targetAudience.includes(from_character_id);
        const targetInAudience = targetAudience.includes(to_character_id);

        if (sourceInAudience && !targetInAudience) {
          // Source believes fiction, target would learn fiction
          warnings.push({
            type: 'FICTION_PROPAGATION',
            fact_id: factId,
            fiction_id: fiction.entity_id,
            message: `Transfer would propagate Fiction "${fiction.name}" to non-audience member`
          });
        }

        if (!sourceInAudience && targetInAudience) {
          // Source knows truth, target believes fiction
          violations.push({
            type: 'FICTION_EXPOSURE',
            fact_id: factId,
            fiction_id: fiction.entity_id,
            to_character_id,
            message: `Transfer would expose Fiction "${fiction.name}" to audience member "${to_character_id}"`,
            severity: 'critical'
          });
        }
      }
    }

    // If no violations for this fact, it's transferable
    if (!violations.some(v => v.fact_id === factId)) {
      transferableKnowledge.push({
        fact_id: factId,
        source_belief: sourceBelief.belief,
        source_confidence: sourceBelief.confidence
      });
    }
  }

  res.json({
    data: {
      from_character_id,
      to_character_id,
      timestamp,
      valid: violations.length === 0,
      transferable_knowledge: transferableKnowledge,
      violations,
      warnings
    }
  });
}));

/**
 * GET /api/validate/project-health
 * Overall project validation and health check
 */
router.get('/project-health', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');

  const health = {
    entities: { total: 0, by_type: {} },
    metadata: { total: 0, with_warnings: 0 },
    events: { total: 0, with_phases: 0, without_timestamp: 0 },
    characters: { total: 0, with_knowledge_states: 0 },
    fictions: { total: 0, active: 0 },
    narrative: { books: 0, chapters: 0, scenes: 0 },
    issues: [],
    warnings: []
  };

  // Count entities
  const entityCounts = db.db.prepare(`
    SELECT entity_type, COUNT(*) as count FROM entities GROUP BY entity_type
  `).all();

  for (const ec of entityCounts) {
    health.entities.by_type[ec.entity_type] = ec.count;
    health.entities.total += ec.count;
  }

  // Count metadata
  health.metadata.total = db.db.prepare('SELECT COUNT(*) as count FROM metadata').get().count;

  // Count metadata with dev_status warnings
  const metaWarnings = db.db.prepare(`
    SELECT COUNT(*) as count FROM metadata WHERE dev_status LIKE '%"warnings":%'
  `).get();
  health.metadata.with_warnings = metaWarnings.count;

  // Check events
  health.events.total = health.entities.by_type.event || 0;
  health.events.with_phases = db.db.prepare(
    'SELECT COUNT(DISTINCT event_id) as count FROM event_phases'
  ).get().count;
  health.events.without_timestamp = db.db.prepare(`
    SELECT COUNT(*) as count FROM entities WHERE entity_type = 'event' AND timestamp IS NULL
  `).get().count;

  if (health.events.without_timestamp > 0) {
    health.issues.push({
      type: 'EVENTS_WITHOUT_TIMESTAMP',
      count: health.events.without_timestamp,
      message: `${health.events.without_timestamp} events lack timestamps`
    });
  }

  // Check characters
  health.characters.total = health.entities.by_type.character || 0;
  health.characters.with_knowledge_states = db.db.prepare(
    'SELECT COUNT(DISTINCT character_id) as count FROM knowledge_states'
  ).get().count;

  // Check fictions
  const fictionStats = db.db.prepare(`
    SELECT status, COUNT(*) as count FROM fictions GROUP BY status
  `).all();

  for (const fs of fictionStats) {
    health.fictions.total += fs.count;
    if (fs.status === 'active') {
      health.fictions.active = fs.count;
    }
  }

  // Check narrative structure
  const narrativeCounts = db.db.prepare(`
    SELECT structure_type, COUNT(*) as count FROM narrative_structure GROUP BY structure_type
  `).all();

  for (const nc of narrativeCounts) {
    if (nc.structure_type === 'book') health.narrative.books = nc.count;
    if (nc.structure_type === 'chapter') health.narrative.chapters = nc.count;
  }

  health.narrative.scenes = db.db.prepare('SELECT COUNT(*) as count FROM scenes').get().count;

  // Check for orphaned entities
  const orphanedMeta = db.db.prepare(`
    SELECT COUNT(*) as count FROM metadata m
    WHERE NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = m.entity_id)
  `).get().count;

  if (orphanedMeta > 0) {
    health.warnings.push({
      type: 'ORPHANED_METADATA',
      count: orphanedMeta,
      message: `${orphanedMeta} metadata entries reference non-existent entities`
    });
  }

  // Check for causal inconsistencies
  const causalIssues = db.db.prepare(`
    SELECT COUNT(*) as count FROM causal_links cl
    JOIN entities e1 ON cl.cause_event_id = e1.id
    JOIN entities e2 ON cl.effect_event_id = e2.id
    WHERE e1.timestamp > e2.timestamp
  `).get().count;

  if (causalIssues > 0) {
    health.issues.push({
      type: 'CAUSAL_INCONSISTENCIES',
      count: causalIssues,
      message: `${causalIssues} causal links where cause occurs after effect`
    });
  }

  // Calculate overall health score
  const issueScore = health.issues.reduce((sum, i) => sum + (i.count || 1) * 10, 0);
  const warningScore = health.warnings.reduce((sum, w) => sum + (w.count || 1) * 2, 0);
  health.score = Math.max(0, 100 - issueScore - warningScore);

  res.json({ data: health });
}));

// ============================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================

async function validateEventChanges(db, event, changes, violations, warnings) {
  // Check timestamp changes
  if (changes.timestamp) {
    // Verify causal links would still be valid
    const causalLinks = db.db.prepare(`
      SELECT * FROM causal_links WHERE cause_event_id = ? OR effect_event_id = ?
    `).all(event.id, event.id);

    for (const link of causalLinks) {
      if (link.cause_event_id === event.id) {
        // This event is a cause - check effect
        const effect = db.getEntity(link.effect_event_id, { includeMetadata: 'never' });
        if (effect?.timestamp && new Date(changes.timestamp) > new Date(effect.timestamp)) {
          violations.push({
            type: 'CAUSAL_VIOLATION',
            effect_event_id: link.effect_event_id,
            message: `New timestamp would make this event occur after its effect "${effect.name}"`
          });
        }
      } else {
        // This event is an effect - check cause
        const cause = db.getEntity(link.cause_event_id, { includeMetadata: 'never' });
        if (cause?.timestamp && new Date(changes.timestamp) < new Date(cause.timestamp)) {
          violations.push({
            type: 'CAUSAL_VIOLATION',
            cause_event_id: link.cause_event_id,
            message: `New timestamp would make this event occur before its cause "${cause.name}"`
          });
        }
      }
    }
  }

  // Check participant changes
  if (changes.participants) {
    const newParticipants = changes.participants;
    const existingParticipants = event.data.participants || [];

    // Warn about removed participants
    const removed = existingParticipants.filter(p => !newParticipants.includes(p));
    if (removed.length > 0) {
      warnings.push({
        type: 'PARTICIPANTS_REMOVED',
        removed_participants: removed,
        message: `Removing participants may affect their knowledge states`
      });
    }
  }
}

async function validateCharacterChanges(db, character, changes, violations, warnings) {
  // Check for knowledge state impacts
  if (changes.knowledge_state) {
    warnings.push({
      type: 'KNOWLEDGE_STATE_CHANGE',
      message: 'Direct knowledge state changes should be done through events'
    });
  }
}

async function validateFictionChanges(db, fiction, changes, violations, warnings) {
  // Get current fiction data
  const fictionData = db.db.prepare('SELECT * FROM fictions WHERE entity_id = ?').get(fiction.id);

  if (!fictionData) {
    violations.push({
      type: 'FICTION_NOT_FOUND',
      message: 'Fiction data not found in fictions table'
    });
    return;
  }

  const currentAudience = JSON.parse(fictionData.target_audience);

  // Check audience expansion
  if (changes.target_audience) {
    const newMembers = changes.target_audience.filter(id => !currentAudience.includes(id));

    if (newMembers.length > 0) {
      violations.push({
        type: 'FICTION_SCOPE_VIOLATION',
        fiction_id: fiction.id,
        new_audience_members: newMembers,
        message: 'Expanding fiction target audience is not allowed without explicit design'
      });
    }
  }

  // Check status changes
  if (changes.status && changes.status === 'collapsed') {
    warnings.push({
      type: 'FICTION_COLLAPSE',
      message: 'Collapsing a fiction is a major narrative event - ensure all epistemic consequences are handled'
    });
  }
}

async function validateGenericChanges(db, entity, changes, violations, warnings) {
  // Check for ID changes (not allowed)
  if (changes.id && changes.id !== entity.id) {
    violations.push({
      type: 'ID_CHANGE_NOT_ALLOWED',
      message: 'Entity IDs cannot be changed'
    });
  }

  // Check for type changes (not allowed)
  if (changes.entity_type && changes.entity_type !== entity.entity_type) {
    violations.push({
      type: 'TYPE_CHANGE_NOT_ALLOWED',
      message: 'Entity types cannot be changed'
    });
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = router;
