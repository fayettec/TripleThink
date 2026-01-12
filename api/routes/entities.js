/**
 * TripleThink Entity Routes
 * CRUD operations for all entity types
 */

const express = require('express');
const router = express.Router();

const {
  asyncHandler,
  NotFoundError,
  ValidationError,
  validateRequired,
  validateId,
  validateTimestamp,
  validateEntityType,
  validateMetadataMode
} = require('../error-handling');

const { entityCacheMiddleware, invalidateEntityCache } = require('../middleware/cache');
const { standardRateLimit } = require('../middleware/rate-limit');

// ============================================================
// ROUTES
// ============================================================

/**
 * GET /api/entities
 * List entities with filtering
 */
router.get('/', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const {
    type,
    date_range,
    participant,
    search,
    limit = 100,
    offset = 0,
    include_metadata = 'never'
  } = req.query;

  validateMetadataMode(include_metadata);

  let query = 'SELECT * FROM entities WHERE 1=1';
  const params = [];

  // Filter by type
  if (type) {
    validateEntityType(type);
    query += ' AND entity_type = ?';
    params.push(type);
  }

  // Filter by date range
  if (date_range) {
    const [start, end] = date_range.split(',');
    if (start && end) {
      validateTimestamp(start, 'date_range start');
      validateTimestamp(end, 'date_range end');
      query += ' AND timestamp >= ? AND timestamp <= ?';
      params.push(start, end);
    }
  }

  // Filter by participant (for events)
  if (participant) {
    query = `
      SELECT DISTINCT e.* FROM entities e
      JOIN event_participants ep ON e.id = ep.event_id
      WHERE ep.participant_id = ?
    `;
    params.length = 0;
    params.push(participant);

    if (type) {
      query += ' AND e.entity_type = ?';
      params.push(type);
    }
  }

  // Search in name and summary
  if (search) {
    query += ' AND (name LIKE ? OR summary LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }

  // Order and pagination
  query += ' ORDER BY COALESCE(timestamp, created_at) DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const stmt = db.db.prepare(query);
  let entities = stmt.all(...params);

  // Parse JSON data and optionally load metadata
  entities = entities.map(entity => {
    entity.data = JSON.parse(entity.data);

    // Load metadata if requested
    if (include_metadata === 'always' ||
        (include_metadata === 'auto' && entity.read_metadata_mandatory && entity.meta_id)) {
      entity.metadata = db.getMetadata(entity.meta_id);
    }

    return entity;
  });

  res.json({
    data: entities,
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      count: entities.length
    }
  });
}));

/**
 * GET /api/entities/:id
 * Get single entity by ID
 */
router.get('/:id', standardRateLimit(), entityCacheMiddleware(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { include_metadata = 'auto', at_timestamp } = req.query;

  validateMetadataMode(include_metadata);
  validateTimestamp(at_timestamp, 'at_timestamp');

  const entity = db.getEntity(id, { includeMetadata: include_metadata });

  if (!entity) {
    throw new NotFoundError('Entity', id);
  }

  // Time-travel query: get entity state at specific timestamp
  if (at_timestamp) {
    const stateAtTime = db.getEntityStateAtTime(id, at_timestamp);
    entity.state_at_timestamp = stateAtTime;
    entity.queried_timestamp = at_timestamp;
  }

  res.json({ data: entity });
}));

/**
 * POST /api/entities
 * Create new entity
 */
router.post('/', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  let { type, data, metadata } = req.body;

  // Validation
  validateRequired(req.body, ['type', 'data']);
  validateEntityType(type);
  validateRequired(data, ['name']); // ID no longer required!

  // AUTO-GENERATE ID if not provided
  if (!data.id) {
    data.id = db.generateEntityId(type);
  }

  // Check for duplicate ID
  const existing = db.getEntity(data.id, { includeMetadata: 'never' });
  if (existing) {
    throw new ValidationError(
      `Entity with ID "${data.id}" already exists`,
      { existing_id: data.id }
    );
  }

  // Create entity based on type
  let entity;

  if (type === 'event' && data.phases) {
    // Use specialized event creation
    entity = db.createEvent(data);
  } else if (type === 'fiction') {
    // Use specialized fiction creation
    entity = db.createFiction(data);
  } else {
    // Standard entity creation
    entity = db.createEntity(type, data);
  }

  // Create metadata if provided
  if (metadata) {
    metadata.entity_id = data.id;
    metadata.entity_type = type;
    if (!metadata.id) {
      metadata.id = `meta-${data.id}`;
    }
    if (!metadata.version_info) {
      metadata.version_info = {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        changelog: []
      };
    }
    db.saveMetadata(metadata);

    // Update entity with metadata reference
    db.updateEntity(data.id, {
      meta_id: metadata.id,
      read_metadata_mandatory: metadata.read_metadata_mandatory || false
    });

    entity = db.getEntity(data.id, { includeMetadata: 'always' });
  }

  res.status(201).json({ data: entity });
}));

/**
 * PUT /api/entities/:id
 * Update entity
 */
router.put('/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { data, metadata } = req.body;

  // Check entity exists
  const existing = db.getEntity(id, { includeMetadata: 'never' });
  if (!existing) {
    throw new NotFoundError('Entity', id);
  }

  // Update entity
  if (data) {
    db.updateEntity(id, { data });
  }

  // Update metadata if provided
  if (metadata) {
    if (existing.meta_id) {
      // Update existing metadata
      const existingMeta = db.getMetadata(existing.meta_id);
      const updatedMeta = {
        ...existingMeta,
        ...metadata,
        id: existing.meta_id,
        entity_id: id,
        entity_type: existing.entity_type,
        version_info: {
          ...existingMeta?.version_info,
          ...metadata.version_info,
          modified: new Date().toISOString()
        }
      };
      db.saveMetadata(updatedMeta);
    } else {
      // Create new metadata
      const newMetaId = `meta-${id}`;
      db.saveMetadata({
        id: newMetaId,
        entity_id: id,
        entity_type: existing.entity_type,
        ...metadata,
        version_info: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          ...metadata.version_info
        }
      });
      db.updateEntity(id, { meta_id: newMetaId });
    }
  }

  // Invalidate cache
  invalidateEntityCache(id);

  const updated = db.getEntity(id, { includeMetadata: 'always' });
  res.json({ data: updated });
}));

/**
 * DELETE /api/entities/:id
 * Delete entity
 */
router.delete('/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { cascade = 'false' } = req.query;

  // Check entity exists
  const existing = db.getEntity(id, { includeMetadata: 'never' });
  if (!existing) {
    throw new NotFoundError('Entity', id);
  }

  // Check for dependencies if not cascading
  if (cascade !== 'true') {
    // Check for event participants
    const participantCheck = db.db.prepare(`
      SELECT COUNT(*) as count FROM event_participants WHERE event_id = ?
    `).get(id);

    // Check for knowledge state references
    const knowledgeCheck = db.db.prepare(`
      SELECT COUNT(*) as count FROM knowledge_states WHERE character_id = ? OR trigger_event_id = ?
    `).get(id, id);

    // Check for causal links
    const causalCheck = db.db.prepare(`
      SELECT COUNT(*) as count FROM causal_links WHERE cause_event_id = ? OR effect_event_id = ?
    `).get(id, id);

    const totalDeps = (participantCheck?.count || 0) +
                      (knowledgeCheck?.count || 0) +
                      (causalCheck?.count || 0);

    if (totalDeps > 0) {
      throw new ValidationError(
        `Cannot delete entity "${id}": has ${totalDeps} dependent records`,
        {
          dependencies: {
            event_participants: participantCheck?.count || 0,
            knowledge_states: knowledgeCheck?.count || 0,
            causal_links: causalCheck?.count || 0
          }
        }
      );
    }
  }

  // Delete entity
  db.deleteEntity(id);

  // Invalidate cache
  invalidateEntityCache(id);

  res.json({
    success: true,
    message: `Entity "${id}" deleted`,
    cascade: cascade === 'true'
  });
}));

/**
 * GET /api/entities/:id/relationships
 * Get relationships for entity
 */
router.get('/:id/relationships', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { at_timestamp } = req.query;

  // Check entity exists
  const existing = db.getEntity(id, { includeMetadata: 'never' });
  if (!existing) {
    throw new NotFoundError('Entity', id);
  }

  let query = `
    SELECT r.*, e.name as to_entity_name, e.entity_type as to_entity_type
    FROM relationships r
    JOIN entities e ON r.to_entity_id = e.id
    WHERE r.from_entity_id = ?
  `;
  const params = [id];

  if (at_timestamp) {
    validateTimestamp(at_timestamp, 'at_timestamp');
    query += ' AND r.timestamp <= ?';
    params.push(at_timestamp);
    query += ' ORDER BY r.timestamp DESC';
  } else {
    query += ' ORDER BY r.timestamp DESC';
  }

  const stmt = db.db.prepare(query);
  const relationships = stmt.all(...params).map(rel => ({
    ...rel,
    data: rel.data ? JSON.parse(rel.data) : null
  }));

  res.json({ data: relationships });
}));

/**
 * POST /api/entities/:id/relationships
 * Add relationship to entity
 */
router.post('/:id/relationships', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { to_entity_id, relationship_type, timestamp, data } = req.body;

  validateRequired(req.body, ['to_entity_id', 'relationship_type', 'timestamp']);
  validateTimestamp(timestamp, 'timestamp');

  // Check both entities exist
  const fromEntity = db.getEntity(id, { includeMetadata: 'never' });
  if (!fromEntity) {
    throw new NotFoundError('Entity', id);
  }

  const toEntity = db.getEntity(to_entity_id, { includeMetadata: 'never' });
  if (!toEntity) {
    throw new NotFoundError('Entity', to_entity_id);
  }

  const stmt = db.db.prepare(`
    INSERT INTO relationships (from_entity_id, to_entity_id, relationship_type, timestamp, data)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(id, to_entity_id, relationship_type, timestamp, data ? JSON.stringify(data) : null);

  res.status(201).json({
    data: {
      id: result.lastInsertRowid,
      from_entity_id: id,
      to_entity_id,
      relationship_type,
      timestamp,
      data
    }
  });
}));

// ============================================================
// EXPORTS
// ============================================================

module.exports = router;
