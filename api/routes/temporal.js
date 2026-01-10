/**
 * TripleThink Temporal Routes
 * Time-travel queries and timeline operations
 */

const express = require('express');
const router = express.Router();

const {
  asyncHandler,
  NotFoundError,
  ValidationError,
  TemporalInconsistencyError,
  validateRequired,
  validateTimestamp
} = require('../error-handling');

const { standardRateLimit } = require('../middleware/rate-limit');

// ============================================================
// ROUTES
// ============================================================

/**
 * GET /api/temporal/entity/:id/states
 * Get all state changes for an entity in a time range
 */
router.get('/entity/:id/states', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { from, to, property } = req.query;

  // Validate entity exists
  const entity = db.getEntity(id, { includeMetadata: 'never' });
  if (!entity) {
    throw new NotFoundError('Entity', id);
  }

  // Default time range
  const startDate = from || '1900-01-01T00:00:00Z';
  const endDate = to || new Date().toISOString();

  validateTimestamp(startDate, 'from');
  validateTimestamp(endDate, 'to');

  let query = `
    SELECT st.*, e.name as trigger_event_name
    FROM state_timeline st
    LEFT JOIN entities e ON st.trigger_event_id = e.id
    WHERE st.entity_id = ? AND st.timestamp >= ? AND st.timestamp <= ?
  `;
  const params = [id, startDate, endDate];

  if (property) {
    query += ' AND st.property = ?';
    params.push(property);
  }

  query += ' ORDER BY st.timestamp ASC';

  const stmt = db.db.prepare(query);
  const states = stmt.all(...params).map(s => ({
    ...s,
    value: JSON.parse(s.value)
  }));

  // Group by property
  const byProperty = {};
  for (const state of states) {
    if (!byProperty[state.property]) {
      byProperty[state.property] = [];
    }
    byProperty[state.property].push({
      timestamp: state.timestamp,
      value: state.value,
      trigger_event_id: state.trigger_event_id,
      trigger_event_name: state.trigger_event_name
    });
  }

  res.json({
    data: {
      entity_id: id,
      entity_name: entity.name,
      time_range: {
        from: startDate,
        to: endDate
      },
      states_by_property: byProperty,
      total_state_changes: states.length
    }
  });
}));

/**
 * GET /api/temporal/entity/:id/at/:timestamp
 * Get entity state at a specific point in time
 */
router.get('/entity/:id/at/:timestamp', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id, timestamp } = req.params;

  validateTimestamp(timestamp, 'timestamp');

  // Validate entity exists
  const entity = db.getEntity(id, { includeMetadata: 'never' });
  if (!entity) {
    throw new NotFoundError('Entity', id);
  }

  const stateAtTime = db.getEntityStateAtTime(id, timestamp);

  res.json({
    data: {
      entity_id: id,
      entity_name: entity.name,
      timestamp: timestamp,
      state: stateAtTime,
      property_count: Object.keys(stateAtTime).length
    }
  });
}));

/**
 * GET /api/temporal/events
 * Get events in a time range
 */
router.get('/events', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { from, to, type, participant, limit = 100, offset = 0 } = req.query;

  if (!from || !to) {
    throw new ValidationError('Both from and to parameters are required');
  }

  validateTimestamp(from, 'from');
  validateTimestamp(to, 'to');

  let events;

  if (participant) {
    // Get events by participant
    events = db.getEventsWithParticipant(participant);
    events = events.filter(e => e.timestamp >= from && e.timestamp <= to);
  } else {
    // Get events in time range
    events = db.getEventsInTimeRange(from, to);
  }

  // Filter by type if specified
  if (type) {
    events = events.filter(e => e.data.type === type);
  }

  // Apply pagination
  const total = events.length;
  events = events.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  res.json({
    data: events,
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      total,
      count: events.length
    },
    time_range: {
      from,
      to
    }
  });
}));

/**
 * GET /api/temporal/timeline
 * Get a visual timeline of events and state changes
 */
router.get('/timeline', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { from, to, entity_ids, include_state_changes = 'true' } = req.query;

  if (!from || !to) {
    throw new ValidationError('Both from and to parameters are required');
  }

  validateTimestamp(from, 'from');
  validateTimestamp(to, 'to');

  const timeline = [];

  // Get all events in range
  const events = db.getEventsInTimeRange(from, to);
  for (const event of events) {
    timeline.push({
      timestamp: event.timestamp,
      type: 'event',
      id: event.id,
      name: event.name,
      summary: event.summary,
      event_type: event.data.type
    });
  }

  // Get state changes if requested
  if (include_state_changes === 'true') {
    let stateQuery = `
      SELECT st.*, e.name as entity_name
      FROM state_timeline st
      JOIN entities e ON st.entity_id = e.id
      WHERE st.timestamp >= ? AND st.timestamp <= ?
    `;
    const params = [from, to];

    // Filter to specific entities if provided
    if (entity_ids) {
      const ids = entity_ids.split(',');
      stateQuery += ` AND st.entity_id IN (${ids.map(() => '?').join(',')})`;
      params.push(...ids);
    }

    stateQuery += ' ORDER BY st.timestamp ASC';

    const stateStmt = db.db.prepare(stateQuery);
    const stateChanges = stateStmt.all(...params);

    for (const change of stateChanges) {
      timeline.push({
        timestamp: change.timestamp,
        type: 'state_change',
        entity_id: change.entity_id,
        entity_name: change.entity_name,
        property: change.property,
        value: JSON.parse(change.value),
        trigger_event_id: change.trigger_event_id
      });
    }
  }

  // Sort by timestamp
  timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  res.json({
    data: {
      time_range: { from, to },
      entries: timeline,
      total_entries: timeline.length
    }
  });
}));

/**
 * POST /api/temporal/state-change
 * Record a state change for an entity
 */
router.post('/state-change', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { entity_id, property, value, timestamp, trigger_event_id } = req.body;

  validateRequired(req.body, ['entity_id', 'property', 'value', 'timestamp']);
  validateTimestamp(timestamp, 'timestamp');

  // Validate entity exists
  const entity = db.getEntity(entity_id, { includeMetadata: 'never' });
  if (!entity) {
    throw new NotFoundError('Entity', entity_id);
  }

  // Validate trigger event if provided
  if (trigger_event_id) {
    const event = db.getEntity(trigger_event_id, { includeMetadata: 'never' });
    if (!event) {
      throw new NotFoundError('Event', trigger_event_id);
    }
  }

  // Record state change
  db.recordStateChange(entity_id, property, value, timestamp, trigger_event_id);

  res.status(201).json({
    data: {
      entity_id,
      property,
      value,
      timestamp,
      trigger_event_id
    }
  });
}));

/**
 * GET /api/temporal/causal-chain/:eventId
 * Get causal chain for an event (causes and effects)
 */
router.get('/causal-chain/:eventId', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { eventId } = req.params;
  const { depth = 2 } = req.query;

  // Validate event exists
  const event = db.getEventWithPhases(eventId);
  if (!event) {
    throw new NotFoundError('Event', eventId);
  }

  const maxDepth = Math.min(parseInt(depth), 5); // Limit depth to prevent infinite loops

  // Recursive function to get causes
  function getCauses(id, currentDepth, visited = new Set()) {
    if (currentDepth > maxDepth || visited.has(id)) return [];
    visited.add(id);

    const stmt = db.db.prepare(`
      SELECT cl.cause_event_id, e.name, e.timestamp, e.summary
      FROM causal_links cl
      JOIN entities e ON cl.cause_event_id = e.id
      WHERE cl.effect_event_id = ?
    `);

    const causes = stmt.all(id);

    return causes.map(cause => ({
      event_id: cause.cause_event_id,
      name: cause.name,
      timestamp: cause.timestamp,
      summary: cause.summary,
      causes: getCauses(cause.cause_event_id, currentDepth + 1, visited)
    }));
  }

  // Recursive function to get effects
  function getEffects(id, currentDepth, visited = new Set()) {
    if (currentDepth > maxDepth || visited.has(id)) return [];
    visited.add(id);

    const stmt = db.db.prepare(`
      SELECT cl.effect_event_id, e.name, e.timestamp, e.summary
      FROM causal_links cl
      JOIN entities e ON cl.effect_event_id = e.id
      WHERE cl.cause_event_id = ?
    `);

    const effects = stmt.all(id);

    return effects.map(effect => ({
      event_id: effect.effect_event_id,
      name: effect.name,
      timestamp: effect.timestamp,
      summary: effect.summary,
      effects: getEffects(effect.effect_event_id, currentDepth + 1, visited)
    }));
  }

  const causes = getCauses(eventId, 1);
  const effects = getEffects(eventId, 1);

  res.json({
    data: {
      event_id: eventId,
      event_name: event.name,
      event_timestamp: event.timestamp,
      depth: maxDepth,
      causes,
      effects
    }
  });
}));

/**
 * POST /api/temporal/validate-causality
 * Validate that a proposed causal link is temporally consistent
 */
router.post('/validate-causality', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { cause_event_id, effect_event_id } = req.body;

  validateRequired(req.body, ['cause_event_id', 'effect_event_id']);

  // Get both events
  const causeEvent = db.getEntity(cause_event_id, { includeMetadata: 'never' });
  const effectEvent = db.getEntity(effect_event_id, { includeMetadata: 'never' });

  if (!causeEvent) {
    throw new NotFoundError('Event', cause_event_id);
  }
  if (!effectEvent) {
    throw new NotFoundError('Event', effect_event_id);
  }

  const violations = [];

  // Check temporal ordering
  if (causeEvent.timestamp && effectEvent.timestamp) {
    if (new Date(causeEvent.timestamp) > new Date(effectEvent.timestamp)) {
      violations.push({
        type: 'TEMPORAL_ORDER',
        message: 'Cause event occurs after effect event',
        cause_timestamp: causeEvent.timestamp,
        effect_timestamp: effectEvent.timestamp
      });
    }
  }

  // Check for circular dependencies
  const existingLink = db.db.prepare(`
    SELECT * FROM causal_links
    WHERE cause_event_id = ? AND effect_event_id = ?
  `).get(effect_event_id, cause_event_id);

  if (existingLink) {
    violations.push({
      type: 'CIRCULAR_DEPENDENCY',
      message: 'Adding this link would create a circular causal dependency'
    });
  }

  const isValid = violations.length === 0;

  res.json({
    data: {
      valid: isValid,
      cause_event: {
        id: cause_event_id,
        name: causeEvent.name,
        timestamp: causeEvent.timestamp
      },
      effect_event: {
        id: effect_event_id,
        name: effectEvent.name,
        timestamp: effectEvent.timestamp
      },
      violations
    }
  });
}));

/**
 * GET /api/temporal/gaps
 * Find gaps in the timeline (periods with no events)
 */
router.get('/gaps', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { from, to, min_gap_hours = 24 } = req.query;

  if (!from || !to) {
    throw new ValidationError('Both from and to parameters are required');
  }

  validateTimestamp(from, 'from');
  validateTimestamp(to, 'to');

  const events = db.getEventsInTimeRange(from, to);

  // Sort by timestamp
  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const gaps = [];
  const minGapMs = parseInt(min_gap_hours) * 60 * 60 * 1000;

  // Check gap from start
  if (events.length > 0) {
    const firstEventTime = new Date(events[0].timestamp);
    const startTime = new Date(from);
    const initialGap = firstEventTime - startTime;
    if (initialGap > minGapMs) {
      gaps.push({
        start: from,
        end: events[0].timestamp,
        duration_hours: Math.round(initialGap / (60 * 60 * 1000))
      });
    }
  }

  // Check gaps between events
  for (let i = 0; i < events.length - 1; i++) {
    const currentTime = new Date(events[i].timestamp);
    const nextTime = new Date(events[i + 1].timestamp);
    const gap = nextTime - currentTime;

    if (gap > minGapMs) {
      gaps.push({
        start: events[i].timestamp,
        end: events[i + 1].timestamp,
        duration_hours: Math.round(gap / (60 * 60 * 1000)),
        after_event: {
          id: events[i].id,
          name: events[i].name
        },
        before_event: {
          id: events[i + 1].id,
          name: events[i + 1].name
        }
      });
    }
  }

  // Check gap to end
  if (events.length > 0) {
    const lastEventTime = new Date(events[events.length - 1].timestamp);
    const endTime = new Date(to);
    const finalGap = endTime - lastEventTime;
    if (finalGap > minGapMs) {
      gaps.push({
        start: events[events.length - 1].timestamp,
        end: to,
        duration_hours: Math.round(finalGap / (60 * 60 * 1000))
      });
    }
  }

  res.json({
    data: {
      time_range: { from, to },
      min_gap_hours: parseInt(min_gap_hours),
      gaps,
      total_gaps: gaps.length,
      total_gap_hours: gaps.reduce((sum, g) => sum + g.duration_hours, 0)
    }
  });
}));

// ============================================================
// EXPORTS
// ============================================================

module.exports = router;
