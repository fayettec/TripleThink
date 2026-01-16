// Story Conflicts Module
// CRUD operations for STORY_CONFLICTS table
// Provides conflict tracking across 5 types with status progression

const { v4: uuidv4 } = require('uuid');

// Valid conflict types
const CONFLICT_TYPES = ['internal', 'interpersonal', 'societal', 'environmental', 'supernatural'];

// Valid conflict statuses
const CONFLICT_STATUSES = ['latent', 'active', 'escalating', 'climactic', 'resolved'];

module.exports = (db) => {
  /**
   * Create a new story conflict
   * @param {object} params - Conflict parameters
   * @param {string} params.project_id - UUID of the project
   * @param {string} params.type - Type of conflict (internal, interpersonal, societal, environmental, supernatural)
   * @param {string} params.protagonist_id - UUID of the protagonist character
   * @param {string} params.antagonist_source - Character ID, system ID, or descriptive string
   * @param {string} params.stakes_success - What protagonist gains if they win
   * @param {string} params.stakes_fail - What protagonist loses if they fail
   * @param {string} params.status - Current status (defaults to 'latent')
   * @returns {object} The created conflict object
   */
  const createConflict = ({ project_id, type, protagonist_id, antagonist_source, stakes_success, stakes_fail, status = 'latent' }) => {
    // Validate type
    if (!CONFLICT_TYPES.includes(type)) {
      throw new Error(`Invalid type '${type}'. Must be one of: ${CONFLICT_TYPES.join(', ')}`);
    }

    // Validate status
    if (!CONFLICT_STATUSES.includes(status)) {
      throw new Error(`Invalid status '${status}'. Must be one of: ${CONFLICT_STATUSES.join(', ')}`);
    }

    const conflict_uuid = uuidv4();
    const created_at = Date.now();

    db.prepare(`
      INSERT INTO story_conflicts
      (conflict_uuid, project_id, type, protagonist_id, antagonist_source, stakes_success, stakes_fail, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(conflict_uuid, project_id, type, protagonist_id, antagonist_source, stakes_success, stakes_fail, status, created_at);

    return {
      conflict_uuid,
      project_id,
      type,
      protagonist_id,
      antagonist_source,
      stakes_success,
      stakes_fail,
      status,
      created_at
    };
  };

  /**
   * Get all conflicts for a project
   * @param {string} project_id - UUID of the project
   * @returns {Array} Array of conflict objects
   */
  const getConflictsByProject = (project_id) => {
    const rows = db.prepare(`
      SELECT conflict_uuid, project_id, type, protagonist_id, antagonist_source, stakes_success, stakes_fail, status, created_at
      FROM story_conflicts
      WHERE project_id = ?
    `).all(project_id);

    return rows.map(row => ({
      conflict_uuid: row.conflict_uuid,
      project_id: row.project_id,
      type: row.type,
      protagonist_id: row.protagonist_id,
      antagonist_source: row.antagonist_source,
      stakes_success: row.stakes_success,
      stakes_fail: row.stakes_fail,
      status: row.status,
      created_at: row.created_at
    }));
  };

  /**
   * Get all conflicts where the specified character is the protagonist
   * @param {string} protagonist_id - UUID of the protagonist character
   * @returns {Array} Array of conflict objects
   */
  const getConflictsByProtagonist = (protagonist_id) => {
    const rows = db.prepare(`
      SELECT conflict_uuid, project_id, type, protagonist_id, antagonist_source, stakes_success, stakes_fail, status, created_at
      FROM story_conflicts
      WHERE protagonist_id = ?
    `).all(protagonist_id);

    return rows.map(row => ({
      conflict_uuid: row.conflict_uuid,
      project_id: row.project_id,
      type: row.type,
      protagonist_id: row.protagonist_id,
      antagonist_source: row.antagonist_source,
      stakes_success: row.stakes_success,
      stakes_fail: row.stakes_fail,
      status: row.status,
      created_at: row.created_at
    }));
  };

  /**
   * Get a single conflict by its UUID
   * @param {string} conflict_uuid - UUID of the conflict
   * @returns {object|null} The conflict object or null if not found
   */
  const getConflictById = (conflict_uuid) => {
    const row = db.prepare(`
      SELECT conflict_uuid, project_id, type, protagonist_id, antagonist_source, stakes_success, stakes_fail, status, created_at
      FROM story_conflicts
      WHERE conflict_uuid = ?
    `).get(conflict_uuid);

    if (!row) return null;

    return {
      conflict_uuid: row.conflict_uuid,
      project_id: row.project_id,
      type: row.type,
      protagonist_id: row.protagonist_id,
      antagonist_source: row.antagonist_source,
      stakes_success: row.stakes_success,
      stakes_fail: row.stakes_fail,
      status: row.status,
      created_at: row.created_at
    };
  };

  /**
   * Update an existing conflict
   * @param {string} conflict_uuid - UUID of the conflict to update
   * @param {object} updates - Object with fields to update (type, antagonist_source, stakes_success, stakes_fail, status)
   * @returns {number} Number of rows updated (1 if successful, 0 if not found)
   */
  const updateConflict = (conflict_uuid, updates) => {
    // Validate type if provided
    if (updates.type !== undefined && !CONFLICT_TYPES.includes(updates.type)) {
      throw new Error(`Invalid type '${updates.type}'. Must be one of: ${CONFLICT_TYPES.join(', ')}`);
    }

    // Validate status if provided
    if (updates.status !== undefined && !CONFLICT_STATUSES.includes(updates.status)) {
      throw new Error(`Invalid status '${updates.status}'. Must be one of: ${CONFLICT_STATUSES.join(', ')}`);
    }

    // Build dynamic UPDATE statement based on provided fields
    const allowedFields = ['type', 'antagonist_source', 'stakes_success', 'stakes_fail', 'status'];
    const updateFields = [];
    const params = [];

    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        updateFields.push(`${field} = ?`);
        params.push(updates[field]);
      }
    }

    // If no valid fields to update, return 0
    if (updateFields.length === 0) {
      return 0;
    }

    // Add conflict_uuid to params for WHERE clause
    params.push(conflict_uuid);

    const result = db.prepare(`
      UPDATE story_conflicts
      SET ${updateFields.join(', ')}
      WHERE conflict_uuid = ?
    `).run(...params);

    return result.changes;
  };

  /**
   * Delete a conflict
   * @param {string} conflict_uuid - UUID of the conflict to delete
   * @returns {boolean} True if deleted, false if not found
   */
  const deleteConflict = (conflict_uuid) => {
    const result = db.prepare(`
      DELETE FROM story_conflicts WHERE conflict_uuid = ?
    `).run(conflict_uuid);

    return result.changes > 0;
  };

  return {
    createConflict,
    getConflictsByProject,
    getConflictsByProtagonist,
    getConflictById,
    updateConflict,
    deleteConflict
  };
};
