/**
 * TripleThink Search Routes
 * Search and discovery operations
 */

const express = require('express');
const router = express.Router();

const {
  asyncHandler,
  NotFoundError,
  ValidationError,
  validateTimestamp
} = require('../error-handling');

const { searchRateLimit } = require('../middleware/rate-limit');

// ============================================================
// ROUTES
// ============================================================

/**
 * GET /api/search
 * Full-text search across entities
 */
router.get('/', searchRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const {
    q,
    type,
    date_range,
    limit = 50,
    offset = 0,
    include_metadata = 'false'
  } = req.query;

  if (!q || q.length < 2) {
    throw new ValidationError('Search query must be at least 2 characters');
  }

  let query = `
    SELECT e.*, m.author_notes, m.ai_guidance
    FROM entities e
    LEFT JOIN metadata m ON e.meta_id = m.id
    WHERE (
      e.name LIKE ? OR
      e.summary LIKE ? OR
      e.data LIKE ?
    )
  `;
  const searchPattern = `%${q}%`;
  const params = [searchPattern, searchPattern, searchPattern];

  // Filter by type
  if (type) {
    query += ' AND e.entity_type = ?';
    params.push(type);
  }

  // Filter by date range
  if (date_range) {
    const [start, end] = date_range.split(',');
    if (start && end) {
      validateTimestamp(start, 'date_range start');
      validateTimestamp(end, 'date_range end');
      query += ' AND e.timestamp >= ? AND e.timestamp <= ?';
      params.push(start, end);
    }
  }

  // Order by relevance (name matches first, then by date)
  query += ` ORDER BY
    CASE
      WHEN e.name LIKE ? THEN 1
      WHEN e.summary LIKE ? THEN 2
      ELSE 3
    END,
    e.updated_at DESC
    LIMIT ? OFFSET ?
  `;
  params.push(searchPattern, searchPattern, parseInt(limit), parseInt(offset));

  const stmt = db.db.prepare(query);
  let results = stmt.all(...params);

  // Parse JSON and optionally include metadata
  results = results.map(entity => {
    const parsed = {
      ...entity,
      data: JSON.parse(entity.data)
    };

    if (include_metadata === 'true' && entity.author_notes) {
      parsed.metadata = {
        author_notes: JSON.parse(entity.author_notes),
        ai_guidance: entity.ai_guidance ? JSON.parse(entity.ai_guidance) : null
      };
    }

    delete parsed.author_notes;
    delete parsed.ai_guidance;

    return parsed;
  });

  // Also search in metadata
  const metaResults = [];
  if (include_metadata === 'true') {
    const metaQuery = `
      SELECT m.*, e.name as entity_name, e.entity_type
      FROM metadata m
      JOIN entities e ON m.entity_id = e.id
      WHERE
        m.author_notes LIKE ? OR
        m.ai_guidance LIKE ? OR
        m.prose_guidance LIKE ?
    `;
    const metaStmt = db.db.prepare(metaQuery);
    const metaMatches = metaStmt.all(searchPattern, searchPattern, searchPattern);

    for (const match of metaMatches) {
      if (!results.find(r => r.id === match.entity_id)) {
        metaResults.push({
          match_type: 'metadata',
          entity_id: match.entity_id,
          entity_name: match.entity_name,
          entity_type: match.entity_type,
          metadata_id: match.id
        });
      }
    }
  }

  res.json({
    data: {
      query: q,
      filters: { type, date_range },
      results,
      metadata_matches: metaResults,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: results.length
      }
    }
  });
}));

/**
 * GET /api/search/relationships/:entityId
 * Get related entities via graph traversal
 */
router.get('/relationships/:entityId', searchRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { entityId } = req.params;
  const { depth = 1, relationship_type } = req.query;

  // Verify entity exists
  const entity = db.getEntity(entityId, { includeMetadata: 'never' });
  if (!entity) {
    throw new NotFoundError('Entity', entityId);
  }

  const maxDepth = Math.min(parseInt(depth), 3); // Limit depth to prevent explosion

  // Recursive function to get related entities
  function getRelated(id, currentDepth, visited = new Set()) {
    if (currentDepth > maxDepth || visited.has(id)) {
      return [];
    }
    visited.add(id);

    let query = `
      SELECT r.*, e.name, e.entity_type, e.summary
      FROM relationships r
      JOIN entities e ON r.to_entity_id = e.id
      WHERE r.from_entity_id = ?
    `;
    const params = [id];

    if (relationship_type) {
      query += ' AND r.relationship_type = ?';
      params.push(relationship_type);
    }

    const stmt = db.db.prepare(query);
    const related = stmt.all(...params);

    return related.map(r => ({
      entity_id: r.to_entity_id,
      entity_name: r.name,
      entity_type: r.entity_type,
      summary: r.summary,
      relationship_type: r.relationship_type,
      relationship_data: r.data ? JSON.parse(r.data) : null,
      timestamp: r.timestamp,
      related: currentDepth < maxDepth
        ? getRelated(r.to_entity_id, currentDepth + 1, visited)
        : []
    }));
  }

  const related = getRelated(entityId, 1);

  // Also get incoming relationships
  let incomingQuery = `
    SELECT r.*, e.name, e.entity_type, e.summary
    FROM relationships r
    JOIN entities e ON r.from_entity_id = e.id
    WHERE r.to_entity_id = ?
  `;
  const incomingParams = [entityId];

  if (relationship_type) {
    incomingQuery += ' AND r.relationship_type = ?';
    incomingParams.push(relationship_type);
  }

  const incomingStmt = db.db.prepare(incomingQuery);
  const incoming = incomingStmt.all(...incomingParams).map(r => ({
    entity_id: r.from_entity_id,
    entity_name: r.name,
    entity_type: r.entity_type,
    summary: r.summary,
    relationship_type: r.relationship_type,
    relationship_data: r.data ? JSON.parse(r.data) : null,
    timestamp: r.timestamp,
    direction: 'incoming'
  }));

  res.json({
    data: {
      entity_id: entityId,
      entity_name: entity.name,
      depth: maxDepth,
      outgoing_relationships: related,
      incoming_relationships: incoming,
      total_connections: related.length + incoming.length
    }
  });
}));

/**
 * GET /api/search/events/by-participant/:characterId
 * Get all events involving a character
 */
router.get('/events/by-participant/:characterId', searchRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { characterId } = req.params;
  const { from, to } = req.query;

  // Verify character exists
  const character = db.getEntity(characterId, { includeMetadata: 'never' });
  if (!character) {
    throw new NotFoundError('Character', characterId);
  }

  let events = db.getEventsWithParticipant(characterId);

  // Filter by date range
  if (from) {
    validateTimestamp(from, 'from');
    events = events.filter(e => e.timestamp >= from);
  }
  if (to) {
    validateTimestamp(to, 'to');
    events = events.filter(e => e.timestamp <= to);
  }

  res.json({
    data: {
      character_id: characterId,
      character_name: character.name,
      events: events.map(e => ({
        id: e.id,
        name: e.name,
        timestamp: e.timestamp,
        summary: e.summary,
        type: e.data.type
      })),
      total_events: events.length
    }
  });
}));

/**
 * GET /api/search/fictions/targeting/:characterId
 * Get all fictions targeting a character
 */
router.get('/fictions/targeting/:characterId', searchRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { characterId } = req.params;
  const { at_timestamp, include_expired = 'false' } = req.query;

  // Verify character exists
  const character = db.getEntity(characterId, { includeMetadata: 'never' });
  if (!character) {
    throw new NotFoundError('Character', characterId);
  }

  const timestamp = at_timestamp || new Date().toISOString();
  validateTimestamp(timestamp, 'at_timestamp');

  // Get fictions
  let query = `
    SELECT f.*, e.name, e.summary
    FROM fictions f
    JOIN entities e ON f.entity_id = e.id
    WHERE f.target_audience LIKE ?
  `;
  const params = [`%"${characterId}"%`];

  if (include_expired !== 'true') {
    query += ` AND (f.active_end IS NULL OR f.active_end > ?)
               AND f.active_start <= ?`;
    params.push(timestamp, timestamp);
  }

  const stmt = db.db.prepare(query);
  const fictions = stmt.all(...params).map(f => ({
    fiction_id: f.entity_id,
    name: f.name,
    summary: f.summary,
    target_audience: JSON.parse(f.target_audience),
    created_by: JSON.parse(f.created_by),
    status: f.status,
    active_period: {
      start: f.active_start,
      end: f.active_end
    },
    facts_contradicted: JSON.parse(f.facts_contradicted)
  }));

  res.json({
    data: {
      character_id: characterId,
      character_name: character.name,
      timestamp,
      fictions,
      total_fictions: fictions.length
    }
  });
}));

/**
 * GET /api/search/facts/by-visibility/:visibility
 * Get facts by visibility level
 */
router.get('/facts/by-visibility/:visibility', searchRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { visibility } = req.params;
  const { limit = 100, offset = 0 } = req.query;

  const validVisibilities = ['ground_truth', 'witnessed_by_crew', 'limited_knowledge', 'epistemic_state'];
  if (!validVisibilities.includes(visibility)) {
    throw new ValidationError(
      `Invalid visibility: ${visibility}`,
      { valid_values: validVisibilities }
    );
  }

  const stmt = db.db.prepare(`
    SELECT f.*, ep.event_id, e.name as event_name
    FROM facts f
    JOIN event_phases ep ON f.phase_id = ep.id
    JOIN entities e ON ep.event_id = e.id
    WHERE f.visibility = ?
    ORDER BY f.id
    LIMIT ? OFFSET ?
  `);

  const facts = stmt.all(visibility, parseInt(limit), parseInt(offset));

  res.json({
    data: {
      visibility,
      facts,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: facts.length
      }
    }
  });
}));

/**
 * GET /api/search/similar/:entityId
 * Find similar entities based on type and attributes
 */
router.get('/similar/:entityId', searchRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { entityId } = req.params;
  const { limit = 10 } = req.query;

  // Get source entity
  const entity = db.getEntity(entityId, { includeMetadata: 'never' });
  if (!entity) {
    throw new NotFoundError('Entity', entityId);
  }

  // Find similar entities of the same type
  const stmt = db.db.prepare(`
    SELECT * FROM entities
    WHERE entity_type = ? AND id != ?
    ORDER BY updated_at DESC
    LIMIT ?
  `);

  let similar = stmt.all(entity.entity_type, entityId, parseInt(limit)).map(e => ({
    ...e,
    data: JSON.parse(e.data)
  }));

  // Simple similarity scoring based on name/summary overlap
  const sourceWords = new Set(
    (entity.name + ' ' + (entity.summary || '')).toLowerCase().split(/\s+/)
  );

  similar = similar.map(s => {
    const targetWords = new Set(
      (s.name + ' ' + (s.summary || '')).toLowerCase().split(/\s+/)
    );

    // Jaccard similarity
    const intersection = [...sourceWords].filter(w => targetWords.has(w)).length;
    const union = new Set([...sourceWords, ...targetWords]).size;
    const similarity = union > 0 ? intersection / union : 0;

    return { ...s, similarity_score: Math.round(similarity * 100) };
  });

  // Sort by similarity
  similar.sort((a, b) => b.similarity_score - a.similarity_score);

  res.json({
    data: {
      source_entity_id: entityId,
      source_entity_name: entity.name,
      entity_type: entity.entity_type,
      similar_entities: similar.map(s => ({
        id: s.id,
        name: s.name,
        summary: s.summary,
        similarity_score: s.similarity_score
      }))
    }
  });
}));

/**
 * GET /api/search/timeline-context/:timestamp
 * Get context around a specific timestamp
 */
router.get('/timeline-context/:timestamp', searchRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { timestamp } = req.params;
  const { window_hours = 24 } = req.query;

  validateTimestamp(timestamp, 'timestamp');

  const windowMs = parseInt(window_hours) * 60 * 60 * 1000;
  const startTime = new Date(new Date(timestamp).getTime() - windowMs).toISOString();
  const endTime = new Date(new Date(timestamp).getTime() + windowMs).toISOString();

  // Get events in window
  const events = db.getEventsInTimeRange(startTime, endTime);

  // Get active fictions at this time
  const fictions = db.getFictionsActiveAtTime(timestamp);

  // Get state changes in window
  const stateChanges = db.db.prepare(`
    SELECT st.*, e.name as entity_name, e.entity_type
    FROM state_timeline st
    JOIN entities e ON st.entity_id = e.id
    WHERE st.timestamp >= ? AND st.timestamp <= ?
    ORDER BY st.timestamp
  `).all(startTime, endTime).map(s => ({
    ...s,
    value: JSON.parse(s.value)
  }));

  res.json({
    data: {
      center_timestamp: timestamp,
      window_hours: parseInt(window_hours),
      time_range: {
        start: startTime,
        end: endTime
      },
      events: events.map(e => ({
        id: e.id,
        name: e.name,
        timestamp: e.timestamp,
        type: e.data.type
      })),
      active_fictions: fictions.map(f => ({
        id: f.entity_id,
        name: f.name,
        target_audience: f.target_audience
      })),
      state_changes: stateChanges,
      summary: {
        events_count: events.length,
        active_fictions_count: fictions.length,
        state_changes_count: stateChanges.length
      }
    }
  });
}));

// ============================================================
// EXPORTS
// ============================================================

module.exports = router;
