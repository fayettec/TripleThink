/**
 * TripleThink Project Routes
 * CRUD operations for projects (series)
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
 * GET /api/projects
 * List all projects
 */
router.get('/', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const stmt = db.db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
  const projects = stmt.all();
  res.json({ data: projects });
}));

/**
 * GET /api/projects/:id
 * Get single project by ID
 */
router.get('/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const stmt = db.db.prepare('SELECT * FROM projects WHERE id = ?');
  const project = stmt.get(id);

  if (!project) {
    throw new NotFoundError('Project', id);
  }

  res.json({ data: project });
}));

/**
 * POST /api/projects
 * Create new project
 */
router.post('/', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  let { id, name, author, description } = req.body;

  // Only name is required now - ID is optional
  validateRequired(req.body, ['name']);

  // AUTO-GENERATE ID if not provided
  if (!id) {
    id = db.generateEntityId('project');
  }

  // Check for duplicate ID
  const existing = db.db.prepare('SELECT id FROM projects WHERE id = ?').get(id);
  if (existing) {
    throw new ValidationError(`Project with ID "${id}" already exists`, { existing_id: id });
  }

  const stmt = db.db.prepare(
    'INSERT INTO projects (id, name, author, description) VALUES (?, ?, ?, ?)'
  );
  stmt.run(id, name, author || null, description || null);

  const newProject = db.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json({ data: newProject });
}));

/**
 * PUT /api/projects/:id
 * Update project
 */
router.put('/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;
  const { name, author, description } = req.body;

  const existing = db.db.prepare('SELECT id FROM projects WHERE id = ?').get(id);
  if (!existing) {
    throw new NotFoundError('Project', id);
  }

  const stmt = db.db.prepare(
    'UPDATE projects SET name = ?, author = ?, description = ?, updated_at = datetime("now") WHERE id = ?'
  );
  stmt.run(name, author, description, id);

  const updatedProject = db.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.json({ data: updatedProject });
}));

/**
 * DELETE /api/projects/:id
 * Delete project
 */
router.delete('/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  const existing = db.db.prepare('SELECT id FROM projects WHERE id = ?').get(id);
  if (!existing) {
    throw new NotFoundError('Project', id);
  }
  
  // Note: We should consider cascading deletes to books and other related items.
  // For now, we'll just delete the project itself.

  const stmt = db.db.prepare('DELETE FROM projects WHERE id = ?');
  stmt.run(id);

  res.json({ success: true, message: `Project "${id}" deleted` });
}));

module.exports = router;
