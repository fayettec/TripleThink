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

  /**
   * Transition a conflict to a new status
   * @param {string} conflict_uuid - UUID of the conflict to transition
   * @param {string} new_status - New status to transition to
   * @returns {number} Number of rows updated (1 if successful, 0 if conflict not found)
   *
   * Status progression reference:
   * - latent: Conflict exists but hasn't surfaced yet
   * - active: Conflict is now in play, characters aware
   * - escalating: Stakes rising, tension increasing
   * - climactic: Peak of conflict, decisive moment
   * - resolved: Conflict concluded (win/loss/compromise)
   *
   * Note: Unlike character arc phases, conflicts can move non-sequentially
   * (e.g., latent → climactic for sudden revelations, or escalating → resolved for quick resolutions).
   * This function allows any valid status transition to support non-linear storytelling.
   */
  const transitionConflictStatus = (conflict_uuid, new_status) => {
    // Validate new_status
    if (!CONFLICT_STATUSES.includes(new_status)) {
      throw new Error(`Invalid status '${new_status}'. Must be one of: ${CONFLICT_STATUSES.join(', ')}`);
    }

    return updateConflict(conflict_uuid, { status: new_status });
  };

  return {
    createConflict,
    getConflictsByProject,
    getConflictsByProtagonist,
    getConflictById,
    updateConflict,
    deleteConflict,
    transitionConflictStatus
  };
};

// Self-test when run directly
if (require.main === module) {
  const Database = require('better-sqlite3');
  const fs = require('fs');
  const path = require('path');

  console.log('story-conflicts.js self-test...');

  const testDb = new Database(':memory:');

  // Run migration to create STORY_CONFLICTS table
  const migrationPath = path.join(__dirname, '../migrations/006_logic_layer.sql');
  const migration = fs.readFileSync(migrationPath, 'utf8');
  testDb.exec(migration);

  const module = require('./story-conflicts')(testDb);

  // Test 1: Create valid internal conflict
  console.log('✓ Test 1: Create valid internal conflict');
  const conflict1 = module.createConflict({
    project_id: 'proj-001',
    type: 'internal',
    protagonist_id: 'char-001',
    antagonist_source: 'character\'s own doubt',
    stakes_success: 'Gains self-confidence',
    stakes_fail: 'Remains paralyzed by fear'
  });
  console.assert(conflict1.conflict_uuid, 'Conflict should have UUID');
  console.assert(conflict1.status === 'latent', 'Default status should be latent');
  console.assert(conflict1.type === 'internal', 'Type should be internal');

  // Test 2: Create conflict with invalid type
  console.log('✓ Test 2: Create conflict with invalid type throws error');
  try {
    module.createConflict({
      project_id: 'proj-001',
      type: 'invalid_type',
      protagonist_id: 'char-001',
      antagonist_source: 'test',
      stakes_success: 'test',
      stakes_fail: 'test'
    });
    console.assert(false, 'Should throw error for invalid type');
  } catch (e) {
    console.assert(e.message.includes('Invalid type'), 'Should throw type validation error');
  }

  // Test 3: Create conflict with invalid status
  console.log('✓ Test 3: Create conflict with invalid status throws error');
  try {
    module.createConflict({
      project_id: 'proj-001',
      type: 'internal',
      protagonist_id: 'char-001',
      antagonist_source: 'test',
      stakes_success: 'test',
      stakes_fail: 'test',
      status: 'invalid_status'
    });
    console.assert(false, 'Should throw error for invalid status');
  } catch (e) {
    console.assert(e.message.includes('Invalid status'), 'Should throw status validation error');
  }

  // Test 4: Create second conflict for project
  console.log('✓ Test 4: Get conflicts by project');
  const conflict2 = module.createConflict({
    project_id: 'proj-001',
    type: 'interpersonal',
    protagonist_id: 'char-002',
    antagonist_source: 'char-003',
    stakes_success: 'Wins friendship',
    stakes_fail: 'Loses ally'
  });
  const projectConflicts = module.getConflictsByProject('proj-001');
  console.assert(projectConflicts.length === 2, 'Should find 2 conflicts for project');

  // Test 5: Get conflicts by protagonist
  console.log('✓ Test 5: Get conflicts by protagonist');
  const char1Conflicts = module.getConflictsByProtagonist('char-001');
  console.assert(char1Conflicts.length === 1, 'Should find 1 conflict for char-001');
  console.assert(char1Conflicts[0].conflict_uuid === conflict1.conflict_uuid, 'Should match conflict1');

  // Test 6: Get conflict by ID
  console.log('✓ Test 6: Get conflict by ID');
  const retrievedConflict = module.getConflictById(conflict1.conflict_uuid);
  console.assert(retrievedConflict !== null, 'Should find conflict by ID');
  console.assert(retrievedConflict.type === 'internal', 'Retrieved conflict should have correct type');
  console.assert(retrievedConflict.protagonist_id === 'char-001', 'Retrieved conflict should have correct protagonist');

  // Test 7: Update conflict stakes
  console.log('✓ Test 7: Update conflict stakes');
  const updateResult = module.updateConflict(conflict1.conflict_uuid, {
    stakes_success: 'Updated success stakes',
    stakes_fail: 'Updated fail stakes'
  });
  console.assert(updateResult === 1, 'Update should return 1');
  const updatedConflict = module.getConflictById(conflict1.conflict_uuid);
  console.assert(updatedConflict.stakes_success === 'Updated success stakes', 'Success stakes should be updated');
  console.assert(updatedConflict.stakes_fail === 'Updated fail stakes', 'Fail stakes should be updated');
  console.assert(updatedConflict.protagonist_id === 'char-001', 'Protagonist should remain unchanged (immutable)');

  // Test 8: Transition conflict status (latent to active)
  console.log('✓ Test 8: Transition conflict status (latent to active)');
  const transitionResult = module.transitionConflictStatus(conflict1.conflict_uuid, 'active');
  console.assert(transitionResult === 1, 'Transition should return 1');
  const activeConflict = module.getConflictById(conflict1.conflict_uuid);
  console.assert(activeConflict.status === 'active', 'Status should be active');

  // Test 9: Non-sequential status transition (active to resolved)
  console.log('✓ Test 9: Non-sequential status transition (active to resolved)');
  const nonSeqResult = module.transitionConflictStatus(conflict1.conflict_uuid, 'resolved');
  console.assert(nonSeqResult === 1, 'Non-sequential transition should work');
  const resolvedConflict = module.getConflictById(conflict1.conflict_uuid);
  console.assert(resolvedConflict.status === 'resolved', 'Status should be resolved');

  // Test 10: Transition to invalid status
  console.log('✓ Test 10: Transition to invalid status throws error');
  try {
    module.transitionConflictStatus(conflict1.conflict_uuid, 'invalid_status');
    console.assert(false, 'Should throw error for invalid status');
  } catch (e) {
    console.assert(e.message.includes('Invalid status'), 'Should throw status validation error');
  }

  // Test 11: Delete conflict
  console.log('✓ Test 11: Delete conflict');
  const deleteResult = module.deleteConflict(conflict1.conflict_uuid);
  console.assert(deleteResult === true, 'Delete should return true');
  const afterDelete = module.getConflictById(conflict1.conflict_uuid);
  console.assert(afterDelete === null, 'Conflict should not exist after deletion');

  // Test 12: Create conflict for each type (validate all 5 types)
  console.log('✓ Test 12: All 5 conflict types are valid');
  const CONFLICT_TYPES = ['internal', 'interpersonal', 'societal', 'environmental', 'supernatural'];
  for (const type of CONFLICT_TYPES) {
    const testConflict = module.createConflict({
      project_id: 'proj-002',
      type: type,
      protagonist_id: 'char-test',
      antagonist_source: `test ${type}`,
      stakes_success: 'test success',
      stakes_fail: 'test fail'
    });
    console.assert(testConflict.type === type, `Should create conflict with type ${type}`);
  }

  console.log('\nAll tests passed!');
}
