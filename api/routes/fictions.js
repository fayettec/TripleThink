/**
 * TripleThink Fictions Routes
 * CRUD operations for fictions
 */

const express = require('express');
const router = express.Router();

const {
  asyncHandler,
  NotFoundError,
  ValidationError,
  validateRequired,
} = require('../error-handling');

const { standardRateLimit } = require('../middleware/rate-limit');

// ============================================================
// ROUTES
// ============================================================

/**
 * GET /api/fictions
 * List all fictions
 */
router.get('/', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const stmt = db.db.prepare(`
    SELECT e.id, e.name, e.summary, f.*
    FROM fictions f
    JOIN entities e ON f.entity_id = e.id
    ORDER BY e.created_at DESC
  `);
  const fictions = stmt.all().map(f => ({
    ...f,
    target_audience: JSON.parse(f.target_audience),
    created_by: JSON.parse(f.created_by),
    facts_contradicted: JSON.parse(f.facts_contradicted),
    constraints: f.constraints ? JSON.parse(f.constraints) : [],
    exposure_triggers: f.exposure_triggers ? JSON.parse(f.exposure_triggers) : [],
  }));
  res.json({ data: fictions });
}));

/**
 * GET /api/fictions/:id
 * Get single fiction by ID
 */
router.get('/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const stmt = db.db.prepare(`
    SELECT e.id, e.name, e.summary, f.*
    FROM fictions f
    JOIN entities e ON f.entity_id = e.id
    WHERE f.entity_id = ?
  `);
  const fiction = stmt.get(id);

  if (!fiction) {
    throw new NotFoundError('Fiction', id);
  }

  fiction.target_audience = JSON.parse(fiction.target_audience);
  fiction.created_by = JSON.parse(fiction.created_by);
  fiction.facts_contradicted = JSON.parse(fiction.facts_contradicted);
  fiction.constraints = fiction.constraints ? JSON.parse(fiction.constraints) : [];
  fiction.exposure_triggers = fiction.exposure_triggers ? JSON.parse(fiction.exposure_triggers) : [];

  res.json({ data: fiction });
}));

/**
 * POST /api/fictions
 * Create new fiction
 */
router.post('/', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id, name, summary, core_narrative, target_audience, created_by, facts_contradicted } = req.body;

  validateRequired(req.body, ['id', 'name', 'core_narrative', 'target_audience', 'created_by', 'facts_contradicted']);

  // Create the entity first
  try {
    const entityData = { id, name, summary, data: {} };
    db.createEntity('fiction', entityData);
  } catch (error) {
      throw new ValidationError(`Fiction entity with ID "${id}" may already exist.`, { existing_id: id });
  }

  // Then create the fiction
  const stmt = db.db.prepare(
    `INSERT INTO fictions (entity_id, target_audience, created_by, core_narrative, facts_contradicted)
     VALUES (?, ?, ?, ?, ?)`
  );
  stmt.run(id, JSON.stringify(target_audience), JSON.stringify(created_by), core_narrative, JSON.stringify(facts_contradicted));

  const newFiction = db.db.prepare('SELECT * FROM fictions WHERE entity_id = ?').get(id);
  res.status(201).json({ data: newFiction });
}));

/**
 * PUT /api/fictions/:id
 * Update fiction
 */
router.put('/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { name, summary, core_narrative, target_audience, created_by, facts_contradicted, status } = req.body;

  const existing = db.db.prepare('SELECT entity_id FROM fictions WHERE entity_id = ?').get(id);
  if (!existing) {
    throw new NotFoundError('Fiction', id);
  }

  // Update entity
  if (name || summary) {
      const entityData = {};
      if (name) entityData.name = name;
      if (summary) entityData.summary = summary;
      db.updateEntity(id, { data: entityData });
  }

  // Update fiction
  const stmt = db.db.prepare(
    `UPDATE fictions SET
      target_audience = ?,
      created_by = ?,
      core_narrative = ?,
      facts_contradicted = ?,
      status = ?
     WHERE entity_id = ?`
  );
  stmt.run(
    JSON.stringify(target_audience),
    JSON.stringify(created_by),
    core_narrative,
    JSON.stringify(facts_contradicted),
    status,
    id
  );

  const updatedFiction = db.db.prepare('SELECT * FROM fictions WHERE entity_id = ?').get(id);
  res.json({ data: updatedFiction });
}));

/**
 * DELETE /api/fictions/:id
 * Delete fiction
 */
router.delete('/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  const existing = db.db.prepare('SELECT entity_id FROM fictions WHERE entity_id = ?').get(id);
  if (!existing) {
    throw new NotFoundError('Fiction', id);
  }

  // Deleting the entity will cascade to the fictions table
  db.deleteEntity(id);

  res.json({ success: true, message: `Fiction "${id}" deleted` });
}));

module.exports = router;
