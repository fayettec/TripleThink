/**
 * TripleThink Metadata Routes
 * CRUD operations for separated metadata
 */

const express = require('express');
const router = express.Router();

const {
  asyncHandler,
  NotFoundError,
  ValidationError,
  validateRequired
} = require('../error-handling');

const { metadataCacheMiddleware, invalidateMetadataCache } = require('../middleware/cache');
const { standardRateLimit } = require('../middleware/rate-limit');

// ============================================================
// ROUTES
// ============================================================

/**
 * GET /api/metadata
 * List metadata entries
 */
router.get('/', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { entity_type, limit = 100, offset = 0 } = req.query;

  let query = 'SELECT * FROM metadata WHERE 1=1';
  const params = [];

  if (entity_type) {
    query += ' AND entity_type = ?';
    params.push(entity_type);
  }

  query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const stmt = db.db.prepare(query);
  let entries = stmt.all(...params);

  // Parse JSON fields
  entries = entries.map(meta => {
    ['author_notes', 'ai_guidance', 'dev_status', 'version_info',
     'prose_guidance', 'consistency_rules'].forEach(field => {
      if (meta[field]) meta[field] = JSON.parse(meta[field]);
    });
    return meta;
  });

  res.json({
    data: entries,
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      count: entries.length
    }
  });
}));

/**
 * GET /api/metadata/:id
 * Get metadata by ID
 */
router.get('/:id', standardRateLimit(), metadataCacheMiddleware(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  const metadata = db.getMetadata(id);

  if (!metadata) {
    throw new NotFoundError('Metadata', id);
  }

  res.json({ data: metadata });
}));

/**
 * POST /api/metadata
 * Create new metadata entry
 */
router.post('/', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const data = req.body;

  // Validation
  validateRequired(data, ['id', 'entity_id', 'entity_type']);

  // Check for duplicate ID
  const existing = db.getMetadata(data.id);
  if (existing) {
    throw new ValidationError(
      `Metadata with ID "${data.id}" already exists`,
      { existing_id: data.id }
    );
  }

  // Check entity exists
  const entity = db.getEntity(data.entity_id, { includeMetadata: 'never' });
  if (!entity) {
    throw new ValidationError(
      `Entity "${data.entity_id}" does not exist`,
      { entity_id: data.entity_id }
    );
  }

  // Ensure version_info is present
  if (!data.version_info) {
    data.version_info = {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      changelog: []
    };
  }

  const metadata = db.saveMetadata(data);

  // Update entity to reference this metadata
  db.updateEntity(data.entity_id, { meta_id: data.id });

  res.status(201).json({ data: metadata });
}));

/**
 * PUT /api/metadata/:id
 * Update metadata entry
 */
router.put('/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const updates = req.body;

  // Check metadata exists
  const existing = db.getMetadata(id);
  if (!existing) {
    throw new NotFoundError('Metadata', id);
  }

  // Merge updates with existing
  const merged = {
    ...existing,
    ...updates,
    id: id,  // Ensure ID doesn't change
    entity_id: existing.entity_id,  // Ensure entity_id doesn't change
    entity_type: existing.entity_type,  // Ensure type doesn't change
    version_info: {
      ...existing.version_info,
      ...updates.version_info,
      modified: new Date().toISOString()
    }
  };

  // Add to changelog if significant update
  if (updates.author_notes || updates.ai_guidance || updates.prose_guidance) {
    if (!merged.version_info.changelog) {
      merged.version_info.changelog = [];
    }
    merged.version_info.changelog.push({
      timestamp: new Date().toISOString(),
      type: 'update',
      fields: Object.keys(updates).filter(k => k !== 'version_info')
    });
  }

  const metadata = db.saveMetadata(merged);

  // Invalidate cache
  invalidateMetadataCache(id, existing.entity_id);

  res.json({ data: metadata });
}));

/**
 * DELETE /api/metadata/:id
 * Delete metadata entry
 */
router.delete('/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  // Check metadata exists
  const existing = db.getMetadata(id);
  if (!existing) {
    throw new NotFoundError('Metadata', id);
  }

  // Remove metadata reference from entity
  const entity = db.getEntity(existing.entity_id, { includeMetadata: 'never' });
  if (entity && entity.meta_id === id) {
    db.updateEntity(existing.entity_id, { meta_id: null, read_metadata_mandatory: 0 });
  }

  // Delete metadata
  const stmt = db.db.prepare('DELETE FROM metadata WHERE id = ?');
  stmt.run(id);

  // Invalidate cache
  invalidateMetadataCache(id, existing.entity_id);

  res.json({
    success: true,
    message: `Metadata "${id}" deleted`
  });
}));

/**
 * GET /api/metadata/entity/:entityId
 * Get metadata for a specific entity
 */
router.get('/entity/:entityId', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { entityId } = req.params;

  // Check entity exists
  const entity = db.getEntity(entityId, { includeMetadata: 'never' });
  if (!entity) {
    throw new NotFoundError('Entity', entityId);
  }

  if (!entity.meta_id) {
    return res.json({
      data: null,
      message: 'Entity has no associated metadata'
    });
  }

  const metadata = db.getMetadata(entity.meta_id);

  res.json({ data: metadata });
}));

/**
 * PATCH /api/metadata/:id/author-notes
 * Update only author notes section
 */
router.patch('/:id/author-notes', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { author_notes } = req.body;

  if (!author_notes) {
    throw new ValidationError('author_notes field is required');
  }

  const existing = db.getMetadata(id);
  if (!existing) {
    throw new NotFoundError('Metadata', id);
  }

  const merged = {
    ...existing,
    author_notes: {
      ...existing.author_notes,
      ...author_notes
    },
    version_info: {
      ...existing.version_info,
      modified: new Date().toISOString()
    }
  };

  const metadata = db.saveMetadata(merged);
  invalidateMetadataCache(id, existing.entity_id);

  res.json({ data: metadata });
}));

/**
 * PATCH /api/metadata/:id/ai-guidance
 * Update only AI guidance section
 */
router.patch('/:id/ai-guidance', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { ai_guidance } = req.body;

  if (!ai_guidance) {
    throw new ValidationError('ai_guidance field is required');
  }

  const existing = db.getMetadata(id);
  if (!existing) {
    throw new NotFoundError('Metadata', id);
  }

  const merged = {
    ...existing,
    ai_guidance: {
      ...existing.ai_guidance,
      ...ai_guidance
    },
    version_info: {
      ...existing.version_info,
      modified: new Date().toISOString()
    }
  };

  const metadata = db.saveMetadata(merged);
  invalidateMetadataCache(id, existing.entity_id);

  res.json({ data: metadata });
}));

/**
 * PATCH /api/metadata/:id/dev-status
 * Update development status section
 */
router.patch('/:id/dev-status', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { dev_status } = req.body;

  if (!dev_status) {
    throw new ValidationError('dev_status field is required');
  }

  const existing = db.getMetadata(id);
  if (!existing) {
    throw new NotFoundError('Metadata', id);
  }

  const merged = {
    ...existing,
    dev_status: {
      ...existing.dev_status,
      ...dev_status
    },
    version_info: {
      ...existing.version_info,
      modified: new Date().toISOString()
    }
  };

  const metadata = db.saveMetadata(merged);
  invalidateMetadataCache(id, existing.entity_id);

  res.json({ data: metadata });
}));

// ============================================================
// EXPORTS
// ============================================================

module.exports = router;
