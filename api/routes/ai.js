/**
 * TripleThink AI Routes
 * AI-optimized query interface for token efficiency
 */

const express = require('express');
const router = express.Router();

const {
  asyncHandler,
  NotFoundError,
  ValidationError,
  EpistemicViolationError,
  validateRequired,
  validateTimestamp
} = require('../error-handling');

const { batchRateLimit, epistemicRateLimit } = require('../middleware/rate-limit');

// ============================================================
// QUERY TYPES
// ============================================================

const QUERY_TYPES = {
  CHARACTER_KNOWLEDGE: 'character_knowledge',
  EVENT_FACTS: 'event_facts',
  SCENE_CONTEXT: 'scene_context',
  FICTION_STATUS: 'fiction_status',
  RELATIONSHIP_STATE: 'relationship_state',
  ENTITY_STATE: 'entity_state',
  TIMELINE_SLICE: 'timeline_slice'
};

// ============================================================
// ROUTES
// ============================================================

/**
 * POST /api/ai/query
 * Unified AI query endpoint with token-efficient responses
 */
router.post('/query', epistemicRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { query_type, params, format = 'minimal' } = req.body;

  validateRequired(req.body, ['query_type', 'params']);

  if (!Object.values(QUERY_TYPES).includes(query_type)) {
    throw new ValidationError(
      `Invalid query_type: ${query_type}`,
      { valid_types: Object.values(QUERY_TYPES) }
    );
  }

  let result;

  switch (query_type) {
    case QUERY_TYPES.CHARACTER_KNOWLEDGE:
      result = await queryCharacterKnowledge(db, params, format);
      break;
    case QUERY_TYPES.EVENT_FACTS:
      result = await queryEventFacts(db, params, format);
      break;
    case QUERY_TYPES.SCENE_CONTEXT:
      result = await querySceneContext(db, params, format);
      break;
    case QUERY_TYPES.FICTION_STATUS:
      result = await queryFictionStatus(db, params, format);
      break;
    case QUERY_TYPES.RELATIONSHIP_STATE:
      result = await queryRelationshipState(db, params, format);
      break;
    case QUERY_TYPES.ENTITY_STATE:
      result = await queryEntityState(db, params, format);
      break;
    case QUERY_TYPES.TIMELINE_SLICE:
      result = await queryTimelineSlice(db, params, format);
      break;
  }

  res.json({
    query_type,
    format,
    data: result
  });
}));

/**
 * POST /api/ai/batch
 * Batch multiple queries in a single request
 */
router.post('/batch', batchRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { queries, format = 'minimal' } = req.body;

  validateRequired(req.body, ['queries']);

  if (!Array.isArray(queries) || queries.length === 0) {
    throw new ValidationError('queries must be a non-empty array');
  }

  if (queries.length > 20) {
    throw new ValidationError('Maximum 20 queries per batch');
  }

  const results = [];

  for (let i = 0; i < queries.length; i++) {
    const { query_type, params } = queries[i];

    try {
      let result;

      switch (query_type) {
        case QUERY_TYPES.CHARACTER_KNOWLEDGE:
          result = await queryCharacterKnowledge(db, params, format);
          break;
        case QUERY_TYPES.EVENT_FACTS:
          result = await queryEventFacts(db, params, format);
          break;
        case QUERY_TYPES.SCENE_CONTEXT:
          result = await querySceneContext(db, params, format);
          break;
        case QUERY_TYPES.FICTION_STATUS:
          result = await queryFictionStatus(db, params, format);
          break;
        case QUERY_TYPES.RELATIONSHIP_STATE:
          result = await queryRelationshipState(db, params, format);
          break;
        case QUERY_TYPES.ENTITY_STATE:
          result = await queryEntityState(db, params, format);
          break;
        case QUERY_TYPES.TIMELINE_SLICE:
          result = await queryTimelineSlice(db, params, format);
          break;
        default:
          result = { error: `Unknown query_type: ${query_type}` };
      }

      results.push({ index: i, query_type, success: true, data: result });
    } catch (error) {
      results.push({
        index: i,
        query_type,
        success: false,
        error: error.message
      });
    }
  }

  res.json({
    batch_size: queries.length,
    format,
    results
  });
}));

/**
 * POST /api/ai/validate-prose
 * Validate prose against epistemic constraints
 */
router.post('/validate-prose', epistemicRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const {
    prose,
    scene_id,
    pov_character_id,
    timestamp,
    mentioned_facts = [],
    mentioned_characters = []
  } = req.body;

  validateRequired(req.body, ['prose', 'timestamp']);
  validateTimestamp(timestamp, 'timestamp');

  // Determine POV character
  let povCharId = pov_character_id;
  if (!povCharId && scene_id) {
    const scene = db.getSceneData(scene_id, false);
    if (scene) {
      povCharId = scene.pov_character_id;
    }
  }

  if (!povCharId) {
    throw new ValidationError('Either pov_character_id or scene_id is required');
  }

  // Get POV character's knowledge state
  const povKS = db.getCharacterKnowledgeState(povCharId, timestamp);

  // Get active fictions targeting POV character
  const activeFictions = db.getFictionsTargetingCharacter(povCharId, timestamp);

  const violations = [];
  const warnings = [];
  const suggestions = [];

  // Build POV beliefs map
  const povBeliefs = new Map();
  if (povKS) {
    for (const fact of povKS.facts_known) {
      povBeliefs.set(fact.fact_id, {
        belief: fact.belief,
        alternative: fact.believed_alternative,
        source: fact.source
      });
    }
  }

  // Check mentioned facts
  for (const factId of mentioned_facts) {
    const povBelief = povBeliefs.get(factId);

    if (!povBelief) {
      violations.push({
        type: 'UNKNOWN_FACT',
        fact_id: factId,
        message: `POV character has no knowledge of "${factId}" at this time`,
        severity: 'error'
      });
    } else if (povBelief.belief === 'false') {
      // Check if this is a fiction-related false belief
      const relatedFiction = activeFictions.find(f =>
        f.facts_contradicted.some(fc => fc.ground_truth_fact_id === factId)
      );

      violations.push({
        type: 'FALSE_BELIEF_USED_AS_TRUE',
        fact_id: factId,
        message: `POV character believes this fact is FALSE`,
        believed_alternative: povBelief.alternative,
        fiction_id: relatedFiction?.entity_id,
        severity: 'critical',
        suggestion: `Use the character's believed alternative: "${povBelief.alternative}"`
      });
    }
  }

  // Check mentioned characters for fiction exposure risks
  for (const charId of mentioned_characters) {
    if (charId === povCharId) continue;

    // Check if any interaction might expose a fiction
    for (const fiction of activeFictions) {
      if (fiction.target_audience.includes(povCharId) &&
          !fiction.target_audience.includes(charId)) {
        // This character knows truth, POV believes fiction

        const groundTruthHolder = db.getEntity(charId, { includeMetadata: 'never' });

        warnings.push({
          type: 'FICTION_EXPOSURE_RISK',
          fiction_id: fiction.entity_id,
          character_id: charId,
          character_name: groundTruthHolder?.name,
          message: `Character "${groundTruthHolder?.name}" knows ground truth that contradicts POV's fiction-based beliefs`,
          severity: 'warning'
        });

        // Check fiction constraints
        for (const constraint of fiction.constraints || []) {
          if (constraint.includes(charId) || constraint.toLowerCase().includes('discuss')) {
            suggestions.push({
              type: 'CONSTRAINT_REMINDER',
              fiction_id: fiction.entity_id,
              constraint: constraint
            });
          }
        }
      }
    }
  }

  // Simple prose analysis for common epistemic issues
  const proseLC = prose.toLowerCase();

  // Check for absolute certainty language when character should be uncertain
  const certaintyWords = ['knew', 'certain', 'definitely', 'obviously', 'clearly'];
  for (const word of certaintyWords) {
    if (proseLC.includes(word)) {
      warnings.push({
        type: 'CERTAINTY_CHECK',
        message: `Word "${word}" implies certainty - verify POV character has this confidence level`,
        severity: 'info'
      });
    }
  }

  // Check for memory-related words when dealing with fictions
  if (activeFictions.length > 0) {
    const memoryWords = ['remembered', 'recalled', 'memory'];
    for (const word of memoryWords) {
      if (proseLC.includes(word)) {
        warnings.push({
          type: 'MEMORY_FICTION_CHECK',
          message: `Word "${word}" used - character has active fictions, verify memory aligns with fiction-based beliefs`,
          severity: 'warning'
        });
      }
    }
  }

  const isValid = violations.length === 0;

  res.json({
    valid: isValid,
    pov_character_id: povCharId,
    timestamp,
    violations,
    warnings,
    suggestions,
    context: {
      pov_has_knowledge_state: povKS !== null,
      active_fictions_count: activeFictions.length,
      facts_checked: mentioned_facts.length,
      characters_checked: mentioned_characters.length
    }
  });
}));

/**
 * GET /api/ai/writing-context/:sceneId
 * Get complete writing context for a scene (optimized for AI)
 */
router.get('/writing-context/:sceneId', epistemicRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { sceneId } = req.params;
  const { format = 'minimal' } = req.query;

  const scene = db.getSceneData(sceneId, true);
  if (!scene) {
    throw new NotFoundError('Scene', sceneId);
  }

  // Get active fictions for POV character
  const activeFictions = db.getFictionsTargetingCharacter(
    scene.pov_character_id,
    scene.temporal_start
  );

  // Get POV character metadata for writing guidance
  const povCharacter = db.getEntity(scene.pov_character_id, { includeMetadata: 'always' });

  // Minimal format
  if (format === 'minimal') {
    return res.json({
      scene_id: sceneId,
      pov: {
        id: scene.pov_character_id,
        name: povCharacter?.name,
        voice: povCharacter?.metadata?.prose_guidance?.internal_voice,
        speech: povCharacter?.metadata?.prose_guidance?.speech_patterns
      },
      time: {
        start: scene.temporal_start,
        end: scene.temporal_end
      },
      knows: scene.pov_knowledge_state?.facts_known.map(f => ({
        id: f.fact_id,
        belief: f.belief,
        alt: f.believed_alternative
      })) || [],
      fictions: activeFictions.map(f => ({
        id: f.entity_id,
        contradicts: f.facts_contradicted.map(fc => fc.ground_truth_fact_id)
      })),
      irony: scene.active_dramatic_irony || []
    });
  }

  // Detailed format
  res.json({
    scene: {
      id: sceneId,
      title: scene.title,
      time_range: {
        start: scene.temporal_start,
        end: scene.temporal_end
      },
      epistemic_constraints: scene.epistemic_constraints
    },
    pov_character: {
      id: scene.pov_character_id,
      name: povCharacter?.name,
      metadata: povCharacter?.metadata ? {
        voice: povCharacter.metadata.prose_guidance?.internal_voice,
        speech_patterns: povCharacter.metadata.prose_guidance?.speech_patterns,
        body_language: povCharacter.metadata.prose_guidance?.body_language,
        character_arc: povCharacter.metadata.author_notes?.character_arc,
        internal_conflict: povCharacter.metadata.ai_guidance?.internal_conflict
      } : null
    },
    knowledge_state: scene.pov_knowledge_state,
    active_fictions: activeFictions.map(f => ({
      fiction_id: f.entity_id,
      name: f.name,
      facts_contradicted: f.facts_contradicted,
      constraints: f.constraints,
      exposure_triggers: f.exposure_triggers
    })),
    dramatic_irony: scene.active_dramatic_irony,
    events: scene.events?.map(e => ({
      id: e.id,
      name: e.name,
      timestamp: e.timestamp,
      type: e.data?.type
    }))
  });
}));

// ============================================================
// QUERY HANDLER FUNCTIONS
// ============================================================

async function queryCharacterKnowledge(db, params, format) {
  const { character_id, timestamp } = params;
  validateRequired(params, ['character_id', 'timestamp']);
  validateTimestamp(timestamp, 'timestamp');

  const ks = db.getCharacterKnowledgeState(character_id, timestamp);

  if (!ks) {
    return { character_id, timestamp, facts_known: [], message: 'No knowledge state' };
  }

  if (format === 'minimal') {
    return {
      character_id,
      timestamp,
      believes: ks.facts_known.map(f => ({
        fact_id: f.fact_id,
        belief: f.belief,
        alternative: f.believed_alternative || null
      }))
    };
  }

  return {
    character_id,
    timestamp,
    knowledge_state: ks
  };
}

async function queryEventFacts(db, params, format) {
  const { event_id } = params;
  validateRequired(params, ['event_id']);

  const event = db.getEventWithPhases(event_id);
  if (!event) {
    throw new NotFoundError('Event', event_id);
  }

  // Collect all facts from all phases
  const facts = [];
  for (const phase of event.phases || []) {
    for (const fact of phase.facts_created || []) {
      facts.push({
        fact_id: fact.id,
        content: fact.content,
        visibility: fact.visibility,
        phase_id: phase.id
      });
    }
  }

  if (format === 'minimal') {
    return {
      event_id,
      facts: facts.map(f => ({
        id: f.fact_id,
        content: f.content,
        vis: f.visibility
      }))
    };
  }

  return {
    event_id,
    event_name: event.name,
    timestamp: event.timestamp,
    facts,
    phase_count: event.phases?.length || 0
  };
}

async function querySceneContext(db, params, format) {
  const { scene_id, include_events = true } = params;
  validateRequired(params, ['scene_id']);

  const scene = db.getSceneData(scene_id, true);
  if (!scene) {
    throw new NotFoundError('Scene', scene_id);
  }

  if (format === 'minimal') {
    return {
      scene_id,
      pov: scene.pov_character_id,
      time: { start: scene.temporal_start, end: scene.temporal_end },
      knows: scene.pov_knowledge_state?.facts_known.length || 0,
      events: include_events ? scene.events?.map(e => e.id) : undefined
    };
  }

  return {
    scene_id,
    title: scene.title,
    pov_character: scene.pov_character,
    time_range: { start: scene.temporal_start, end: scene.temporal_end },
    epistemic_constraints: scene.epistemic_constraints,
    pov_knowledge_state: scene.pov_knowledge_state,
    dramatic_irony: scene.active_dramatic_irony,
    events: include_events ? scene.events : undefined
  };
}

async function queryFictionStatus(db, params, format) {
  const { fiction_id, timestamp } = params;
  validateRequired(params, ['fiction_id', 'timestamp']);
  validateTimestamp(timestamp, 'timestamp');

  const fictionStmt = db.db.prepare(`
    SELECT f.*, e.name FROM fictions f
    JOIN entities e ON f.entity_id = e.id
    WHERE f.entity_id = ?
  `);
  const fiction = fictionStmt.get(fiction_id);

  if (!fiction) {
    throw new NotFoundError('Fiction', fiction_id);
  }

  const isActive = fiction.active_start <= timestamp &&
    (fiction.active_end === null || fiction.active_end > timestamp);

  const targetAudience = JSON.parse(fiction.target_audience);

  if (format === 'minimal') {
    return {
      fiction_id,
      active: isActive,
      status: fiction.status,
      audience: targetAudience
    };
  }

  return {
    fiction_id,
    name: fiction.name,
    active: isActive,
    status: fiction.status,
    target_audience: targetAudience,
    created_by: JSON.parse(fiction.created_by),
    facts_contradicted: JSON.parse(fiction.facts_contradicted),
    constraints: fiction.constraints ? JSON.parse(fiction.constraints) : [],
    exposure_triggers: fiction.exposure_triggers ? JSON.parse(fiction.exposure_triggers) : []
  };
}

async function queryRelationshipState(db, params, format) {
  const { from_entity_id, to_entity_id, timestamp } = params;
  validateRequired(params, ['from_entity_id', 'to_entity_id', 'timestamp']);
  validateTimestamp(timestamp, 'timestamp');

  const stmt = db.db.prepare(`
    SELECT * FROM relationships
    WHERE from_entity_id = ? AND to_entity_id = ? AND timestamp <= ?
    ORDER BY timestamp DESC
    LIMIT 1
  `);

  const rel = stmt.get(from_entity_id, to_entity_id, timestamp);

  if (!rel) {
    return { from_entity_id, to_entity_id, timestamp, relationship: null };
  }

  if (format === 'minimal') {
    return {
      from: from_entity_id,
      to: to_entity_id,
      type: rel.relationship_type,
      data: rel.data ? JSON.parse(rel.data) : null
    };
  }

  return {
    from_entity_id,
    to_entity_id,
    timestamp,
    relationship: {
      type: rel.relationship_type,
      established: rel.timestamp,
      data: rel.data ? JSON.parse(rel.data) : null
    }
  };
}

async function queryEntityState(db, params, format) {
  const { entity_id, timestamp } = params;
  validateRequired(params, ['entity_id', 'timestamp']);
  validateTimestamp(timestamp, 'timestamp');

  const state = db.getEntityStateAtTime(entity_id, timestamp);

  if (format === 'minimal') {
    return { entity_id, timestamp, state };
  }

  const entity = db.getEntity(entity_id, { includeMetadata: 'never' });

  return {
    entity_id,
    entity_name: entity?.name,
    timestamp,
    state,
    property_count: Object.keys(state).length
  };
}

async function queryTimelineSlice(db, params, format) {
  const { from, to, entity_types } = params;
  validateRequired(params, ['from', 'to']);
  validateTimestamp(from, 'from');
  validateTimestamp(to, 'to');

  const events = db.getEventsInTimeRange(from, to);

  let filteredEvents = events;
  if (entity_types) {
    const types = Array.isArray(entity_types) ? entity_types : [entity_types];
    filteredEvents = events.filter(e => types.includes(e.data?.type));
  }

  if (format === 'minimal') {
    return {
      from,
      to,
      events: filteredEvents.map(e => ({
        id: e.id,
        ts: e.timestamp,
        type: e.data?.type
      }))
    };
  }

  return {
    from,
    to,
    events: filteredEvents.map(e => ({
      id: e.id,
      name: e.name,
      timestamp: e.timestamp,
      type: e.data?.type,
      summary: e.summary
    })),
    count: filteredEvents.length
  };
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = router;
module.exports.QUERY_TYPES = QUERY_TYPES;
