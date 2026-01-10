/**
 * TripleThink Epistemic Routes
 * The Power Feature: Character knowledge state queries
 */

const express = require('express');
const router = express.Router();

const {
  asyncHandler,
  NotFoundError,
  ValidationError,
  EpistemicViolationError,
  FictionScopeViolationError,
  validateRequired,
  validateTimestamp
} = require('../error-handling');

const { epistemicCacheMiddleware, invalidateEntityCache } = require('../middleware/cache');
const { epistemicRateLimit } = require('../middleware/rate-limit');

// ============================================================
// ROUTES
// ============================================================

/**
 * GET /api/epistemic/character/:id/knowledge
 * Get character's knowledge state at a specific time
 */
router.get('/character/:id/knowledge', epistemicRateLimit(), epistemicCacheMiddleware(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { at_timestamp, format = 'detailed' } = req.query;

  // Validate character exists
  const character = db.getEntity(id, { includeMetadata: 'never' });
  if (!character) {
    throw new NotFoundError('Character', id);
  }

  if (character.entity_type !== 'character' && character.entity_type !== 'system') {
    throw new ValidationError(
      `Entity "${id}" is not a character or system`,
      { entity_type: character.entity_type }
    );
  }

  // Use current time if not specified
  const timestamp = at_timestamp || new Date().toISOString();
  validateTimestamp(timestamp, 'at_timestamp');

  const knowledgeState = db.getCharacterKnowledgeState(id, timestamp);

  if (!knowledgeState) {
    return res.json({
      data: {
        character_id: id,
        timestamp: timestamp,
        facts_known: [],
        false_beliefs: [],
        message: 'No knowledge state recorded for this character at or before this timestamp'
      }
    });
  }

  // Minimal format for token efficiency
  if (format === 'minimal') {
    const believes = knowledgeState.facts_known.map(f => ({
      fact_id: f.fact_id,
      belief: f.belief,
      alternative: f.believed_alternative || null
    }));

    return res.json({
      data: {
        character_id: id,
        timestamp: timestamp,
        believes
      }
    });
  }

  // Detailed format
  const trueBeliefs = knowledgeState.facts_known.filter(f => f.belief === 'true');
  const falseBeliefs = knowledgeState.facts_known.filter(f => f.belief === 'false');

  res.json({
    data: {
      character_id: id,
      character_name: character.name,
      queried_timestamp: timestamp,
      knowledge_state: {
        id: knowledgeState.id,
        timestamp: knowledgeState.timestamp,
        trigger_event_id: knowledgeState.trigger_event_id
      },
      true_beliefs: trueBeliefs.map(f => ({
        fact_id: f.fact_id,
        confidence: f.confidence,
        source: f.source
      })),
      false_beliefs: falseBeliefs.map(f => ({
        fact_id: f.fact_id,
        believed_alternative: f.believed_alternative,
        confidence: f.confidence,
        source: f.source
      })),
      summary: {
        total_facts_known: knowledgeState.facts_known.length,
        true_beliefs_count: trueBeliefs.length,
        false_beliefs_count: falseBeliefs.length
      }
    }
  });
}));

/**
 * GET /api/epistemic/character/:id/knowledge/history
 * Get full knowledge state history for a character
 */
router.get('/character/:id/knowledge/history', epistemicRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { from, to } = req.query;

  // Validate character exists
  const character = db.getEntity(id, { includeMetadata: 'never' });
  if (!character) {
    throw new NotFoundError('Character', id);
  }

  let query = `
    SELECT ks.*, e.name as trigger_event_name
    FROM knowledge_states ks
    LEFT JOIN entities e ON ks.trigger_event_id = e.id
    WHERE ks.character_id = ?
  `;
  const params = [id];

  if (from) {
    validateTimestamp(from, 'from');
    query += ' AND ks.timestamp >= ?';
    params.push(from);
  }

  if (to) {
    validateTimestamp(to, 'to');
    query += ' AND ks.timestamp <= ?';
    params.push(to);
  }

  query += ' ORDER BY ks.timestamp ASC';

  const stmt = db.db.prepare(query);
  const states = stmt.all(...params);

  // Get facts for each state
  const factsStmt = db.db.prepare(`
    SELECT * FROM knowledge_state_facts WHERE knowledge_state_id = ?
  `);

  const history = states.map(state => ({
    id: state.id,
    timestamp: state.timestamp,
    trigger_event_id: state.trigger_event_id,
    trigger_event_name: state.trigger_event_name,
    facts_known: factsStmt.all(state.id)
  }));

  res.json({
    data: {
      character_id: id,
      character_name: character.name,
      history,
      total_state_changes: history.length
    }
  });
}));

/**
 * GET /api/epistemic/fact/:id/believers
 * Get who believes a fact at a specific time
 */
router.get('/fact/:id/believers', epistemicRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { at_timestamp } = req.query;

  // Validate fact exists
  const factCheck = db.db.prepare('SELECT * FROM facts WHERE id = ?').get(id);
  if (!factCheck) {
    throw new NotFoundError('Fact', id);
  }

  const timestamp = at_timestamp || new Date().toISOString();
  validateTimestamp(timestamp, 'at_timestamp');

  const divergence = db.getBeliefDivergence(id, timestamp);

  res.json({
    data: {
      fact_id: id,
      fact_content: factCheck.content,
      fact_visibility: factCheck.visibility,
      timestamp: timestamp,
      ground_truth: {
        content: factCheck.content,
        confidence: factCheck.confidence
      },
      believers: divergence.believers.map(b => ({
        character_id: b.character_id,
        confidence: b.confidence,
        source: b.source
      })),
      disbelievers: divergence.disbelievers.map(d => ({
        character_id: d.character_id,
        believed_alternative: d.believed_alternative,
        confidence: d.confidence,
        source: d.source
      })),
      summary: {
        believers_count: divergence.believers.length,
        disbelievers_count: divergence.disbelievers.length,
        has_epistemic_divergence: divergence.disbelievers.length > 0
      }
    }
  });
}));

/**
 * GET /api/epistemic/fiction/:id/audience
 * Get who is in fiction's target audience at a specific time
 */
router.get('/fiction/:id/audience', epistemicRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { at_timestamp } = req.query;

  const timestamp = at_timestamp || new Date().toISOString();
  validateTimestamp(timestamp, 'at_timestamp');

  // Get fiction
  const fictionStmt = db.db.prepare(`
    SELECT f.*, e.name, e.summary FROM fictions f
    JOIN entities e ON f.entity_id = e.id
    WHERE f.entity_id = ?
  `);
  const fiction = fictionStmt.get(id);

  if (!fiction) {
    throw new NotFoundError('Fiction', id);
  }

  // Check if fiction was active at this time
  const isActive = fiction.active_start <= timestamp &&
    (fiction.active_end === null || fiction.active_end > timestamp);

  const targetAudience = JSON.parse(fiction.target_audience);
  const factsContradicted = JSON.parse(fiction.facts_contradicted);
  const creators = JSON.parse(fiction.created_by);

  // Get audience members' belief states
  const audienceBelief = [];
  for (const charId of targetAudience) {
    const beliefState = db.getCharacterKnowledgeState(charId, timestamp);
    if (beliefState) {
      // Check each contradicted fact
      const beliefs = factsContradicted.map(fc => {
        const factBelief = beliefState.facts_known.find(f => f.fact_id === fc.ground_truth_fact_id);
        return {
          ground_truth_fact_id: fc.ground_truth_fact_id,
          fictional_alternative: fc.fictional_alternative,
          currently_believes_fiction: factBelief?.belief === 'false',
          belief_source: factBelief?.source
        };
      });

      audienceBelief.push({
        character_id: charId,
        has_knowledge_state: true,
        beliefs
      });
    } else {
      audienceBelief.push({
        character_id: charId,
        has_knowledge_state: false,
        beliefs: []
      });
    }
  }

  res.json({
    data: {
      fiction_id: id,
      fiction_name: fiction.name,
      timestamp: timestamp,
      is_active: isActive,
      status: fiction.status,
      target_audience: targetAudience,
      creators: creators,
      facts_contradicted: factsContradicted,
      audience_belief_states: audienceBelief,
      constraints: fiction.constraints ? JSON.parse(fiction.constraints) : [],
      exposure_triggers: fiction.exposure_triggers ? JSON.parse(fiction.exposure_triggers) : []
    }
  });
}));

/**
 * POST /api/epistemic/validate-scene
 * Validate a scene for epistemic consistency
 */
router.post('/validate-scene', epistemicRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { scene_id, character_pov, timestamp, proposed_facts } = req.body;

  validateRequired(req.body, ['timestamp']);
  validateTimestamp(timestamp, 'timestamp');

  const violations = [];
  const warnings = [];

  // If scene_id provided, get scene data
  let sceneData = null;
  if (scene_id) {
    sceneData = db.getSceneData(scene_id, true);
    if (!sceneData) {
      throw new NotFoundError('Scene', scene_id);
    }
  }

  // Determine POV character
  const povCharacterId = character_pov || sceneData?.pov_character_id;
  if (!povCharacterId) {
    throw new ValidationError('Either character_pov or scene_id with POV character is required');
  }

  // Get POV character's knowledge state
  const povKnowledge = db.getCharacterKnowledgeState(povCharacterId, timestamp);

  if (!povKnowledge) {
    warnings.push({
      type: 'NO_KNOWLEDGE_STATE',
      message: `No knowledge state found for character "${povCharacterId}" at timestamp`,
      severity: 'warning'
    });
  }

  // Get active fictions targeting this character
  const activeFictions = db.getFictionsTargetingCharacter(povCharacterId, timestamp);

  // Build map of what POV character believes
  const povBeliefs = new Map();
  if (povKnowledge) {
    for (const fact of povKnowledge.facts_known) {
      povBeliefs.set(fact.fact_id, {
        belief: fact.belief,
        alternative: fact.believed_alternative,
        source: fact.source
      });
    }
  }

  // Check proposed facts against POV character's knowledge
  if (proposed_facts && Array.isArray(proposed_facts)) {
    for (const pf of proposed_facts) {
      const { fact_id, is_revealed, character_knows } = pf;

      // Check if character should know this fact
      if (is_revealed && character_knows) {
        const povBelief = povBeliefs.get(fact_id);

        if (!povBelief) {
          violations.push({
            type: 'UNKNOWN_FACT',
            message: `Character "${povCharacterId}" has no knowledge of fact "${fact_id}" at this timestamp`,
            fact_id,
            severity: 'error'
          });
        } else if (povBelief.belief === 'false') {
          // Check if this contradicts a fiction
          const contradictingFiction = activeFictions.find(f => {
            const contradicted = f.facts_contradicted;
            return contradicted.some(fc => fc.ground_truth_fact_id === fact_id);
          });

          if (contradictingFiction) {
            violations.push({
              type: 'FICTION_VIOLATION',
              message: `Character "${povCharacterId}" believes "${fact_id}" is false due to Fiction "${contradictingFiction.name}"`,
              fact_id,
              fiction_id: contradictingFiction.entity_id,
              believed_alternative: povBelief.alternative,
              severity: 'critical'
            });
          } else {
            violations.push({
              type: 'FALSE_BELIEF',
              message: `Character "${povCharacterId}" has a false belief about fact "${fact_id}"`,
              fact_id,
              believed_alternative: povBelief.alternative,
              severity: 'error'
            });
          }
        }
      }
    }
  }

  // Check for fiction scope violations
  for (const fiction of activeFictions) {
    const constraints = fiction.constraints || [];
    for (const constraint of constraints) {
      warnings.push({
        type: 'ACTIVE_CONSTRAINT',
        message: `Fiction "${fiction.name}" has active constraint: ${constraint}`,
        fiction_id: fiction.entity_id,
        severity: 'info'
      });
    }
  }

  const isValid = violations.length === 0;

  res.json({
    data: {
      valid: isValid,
      scene_id: scene_id || null,
      character_pov: povCharacterId,
      timestamp: timestamp,
      violations,
      warnings,
      active_fictions: activeFictions.map(f => ({
        fiction_id: f.entity_id,
        fiction_name: f.name,
        target_audience: f.target_audience
      })),
      pov_knowledge_summary: povKnowledge ? {
        state_timestamp: povKnowledge.timestamp,
        trigger_event_id: povKnowledge.trigger_event_id,
        facts_count: povKnowledge.facts_known.length
      } : null
    }
  });
}));

/**
 * POST /api/epistemic/knowledge-state
 * Create a new knowledge state for a character
 */
router.post('/knowledge-state', epistemicRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { character_id, timestamp, trigger_event_id, facts_known } = req.body;

  validateRequired(req.body, ['character_id', 'timestamp', 'trigger_event_id', 'facts_known']);
  validateTimestamp(timestamp, 'timestamp');

  // Validate character exists
  const character = db.getEntity(character_id, { includeMetadata: 'never' });
  if (!character) {
    throw new NotFoundError('Character', character_id);
  }

  // Validate trigger event exists
  const event = db.getEntity(trigger_event_id, { includeMetadata: 'never' });
  if (!event) {
    throw new NotFoundError('Event', trigger_event_id);
  }

  // Validate facts exist and have required fields
  for (const fact of facts_known) {
    validateRequired(fact, ['fact_id', 'belief', 'confidence', 'source']);

    // Check fact exists
    const factCheck = db.db.prepare('SELECT id FROM facts WHERE id = ?').get(fact.fact_id);
    if (!factCheck) {
      throw new ValidationError(
        `Fact "${fact.fact_id}" does not exist`,
        { fact_id: fact.fact_id }
      );
    }

    // Validate false beliefs have alternative
    if (fact.belief === 'false' && !fact.believed_alternative) {
      throw new ValidationError(
        `False belief for fact "${fact.fact_id}" requires believed_alternative`,
        { fact_id: fact.fact_id }
      );
    }
  }

  // Create knowledge state
  const ksId = db.createKnowledgeState(character_id, timestamp, trigger_event_id, facts_known);

  // Get created state
  const knowledgeState = db.getCharacterKnowledgeState(character_id, timestamp);

  // Invalidate cache
  invalidateEntityCache(character_id);

  res.status(201).json({
    data: {
      id: ksId,
      character_id,
      timestamp,
      trigger_event_id,
      facts_known: knowledgeState.facts_known
    }
  });
}));

/**
 * GET /api/epistemic/character/:charId/believes/:factId
 * Quick check if character believes a specific fact
 */
router.get('/character/:charId/believes/:factId', epistemicRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { charId, factId } = req.params;
  const { at_timestamp } = req.query;

  const timestamp = at_timestamp || new Date().toISOString();
  validateTimestamp(timestamp, 'at_timestamp');

  const belief = db.doesCharacterBelieve(charId, factId, timestamp);

  res.json({
    data: {
      character_id: charId,
      fact_id: factId,
      timestamp: timestamp,
      ...belief
    }
  });
}));

/**
 * GET /api/epistemic/divergences
 * Find all epistemic divergences (where characters disagree with ground truth)
 */
router.get('/divergences', epistemicRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { at_timestamp, character_id } = req.query;

  const timestamp = at_timestamp || new Date().toISOString();
  validateTimestamp(timestamp, 'at_timestamp');

  // Find all false beliefs at this timestamp
  let query = `
    WITH latest_states AS (
      SELECT character_id, MAX(timestamp) as max_ts
      FROM knowledge_states
      WHERE timestamp <= ?
      GROUP BY character_id
    )
    SELECT
      ks.character_id,
      e.name as character_name,
      ksf.fact_id,
      f.content as fact_content,
      ksf.believed_alternative,
      ksf.confidence,
      ksf.source
    FROM knowledge_states ks
    JOIN latest_states ls ON ks.character_id = ls.character_id AND ks.timestamp = ls.max_ts
    JOIN knowledge_state_facts ksf ON ks.id = ksf.knowledge_state_id
    JOIN entities e ON ks.character_id = e.id
    JOIN facts f ON ksf.fact_id = f.id
    WHERE ksf.belief = 'false'
  `;
  const params = [timestamp];

  if (character_id) {
    query += ' AND ks.character_id = ?';
    params.push(character_id);
  }

  query += ' ORDER BY ks.character_id, ksf.fact_id';

  const stmt = db.db.prepare(query);
  const divergences = stmt.all(...params);

  // Group by character
  const byCharacter = {};
  for (const d of divergences) {
    if (!byCharacter[d.character_id]) {
      byCharacter[d.character_id] = {
        character_id: d.character_id,
        character_name: d.character_name,
        false_beliefs: []
      };
    }
    byCharacter[d.character_id].false_beliefs.push({
      fact_id: d.fact_id,
      fact_content: d.fact_content,
      believed_alternative: d.believed_alternative,
      confidence: d.confidence,
      source: d.source
    });
  }

  res.json({
    data: {
      timestamp,
      divergences: Object.values(byCharacter),
      total_divergences: divergences.length,
      characters_with_false_beliefs: Object.keys(byCharacter).length
    }
  });
}));

// ============================================================
// EXPORTS
// ============================================================

module.exports = router;
