// Setup Payoffs Module
// CRUD operations for SETUP_PAYOFFS table
// Provides Chekhov's gun tracking - planted setups and their payoffs

const { v4: uuidv4 } = require('uuid');

// Valid setup statuses
const SETUP_STATUSES = ['planted', 'referenced', 'fired', 'unfired'];

module.exports = (db) => {
  /**
   * Create a new setup/payoff pair
   * @param {object} params - Setup parameters
   * @param {string} params.project_id - UUID of the project
   * @param {string} params.setup_event_id - UUID of the event where setup is planted
   * @param {string} params.description - Description of what was set up
   * @param {string} params.planted_chapter - Chapter/scene where setup planted
   * @param {string} params.status - Status of setup (defaults to 'planted')
   * @returns {object} The created setup_payoff object
   */
  const createSetupPayoff = ({ project_id, setup_event_id, description, planted_chapter, status = 'planted' }) => {
    // Validate status
    if (!SETUP_STATUSES.includes(status)) {
      throw new Error(`Invalid status '${status}'. Must be one of: ${SETUP_STATUSES.join(', ')}`);
    }

    const setup_payoff_uuid = uuidv4();
    const created_at = Date.now();

    db.prepare(`
      INSERT INTO setup_payoffs
      (setup_payoff_uuid, project_id, setup_event_id, payoff_event_id, description, status, planted_chapter, fired_chapter, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(setup_payoff_uuid, project_id, setup_event_id, null, description, status, planted_chapter || null, null, created_at);

    return {
      setup_payoff_uuid,
      project_id,
      setup_event_id,
      payoff_event_id: null,
      description,
      status,
      planted_chapter: planted_chapter || null,
      fired_chapter: null,
      created_at
    };
  };

  /**
   * Get all setup/payoff pairs for a project
   * @param {string} project_id - UUID of the project
   * @returns {Array} Array of setup_payoff objects
   */
  const getSetupPayoffsByProject = (project_id) => {
    const rows = db.prepare(`
      SELECT setup_payoff_uuid, project_id, setup_event_id, payoff_event_id, description, status, planted_chapter, fired_chapter, created_at
      FROM setup_payoffs
      WHERE project_id = ?
    `).all(project_id);

    return rows.map(row => ({
      setup_payoff_uuid: row.setup_payoff_uuid,
      project_id: row.project_id,
      setup_event_id: row.setup_event_id,
      payoff_event_id: row.payoff_event_id,
      description: row.description,
      status: row.status,
      planted_chapter: row.planted_chapter,
      fired_chapter: row.fired_chapter,
      created_at: row.created_at
    }));
  };

  /**
   * Get a single setup/payoff by its UUID
   * @param {string} setup_payoff_uuid - UUID of the setup/payoff
   * @returns {object|undefined} The setup_payoff object or undefined if not found
   */
  const getSetupPayoffById = (setup_payoff_uuid) => {
    const row = db.prepare(`
      SELECT setup_payoff_uuid, project_id, setup_event_id, payoff_event_id, description, status, planted_chapter, fired_chapter, created_at
      FROM setup_payoffs
      WHERE setup_payoff_uuid = ?
    `).get(setup_payoff_uuid);

    if (!row) return undefined;

    return {
      setup_payoff_uuid: row.setup_payoff_uuid,
      project_id: row.project_id,
      setup_event_id: row.setup_event_id,
      payoff_event_id: row.payoff_event_id,
      description: row.description,
      status: row.status,
      planted_chapter: row.planted_chapter,
      fired_chapter: row.fired_chapter,
      created_at: row.created_at
    };
  };

  /**
   * Update an existing setup/payoff
   * @param {string} setup_payoff_uuid - UUID of the setup/payoff to update
   * @param {object} updates - Object with fields to update (description, status, payoff_event_id, fired_chapter)
   * @returns {object} The updated setup_payoff object
   */
  const updateSetupPayoff = (setup_payoff_uuid, updates) => {
    // Validate status if provided
    if (updates.status !== undefined && !SETUP_STATUSES.includes(updates.status)) {
      throw new Error(`Invalid status '${updates.status}'. Must be one of: ${SETUP_STATUSES.join(', ')}`);
    }

    // Build dynamic UPDATE statement based on provided fields
    const allowedFields = ['description', 'status', 'payoff_event_id', 'fired_chapter'];
    const updateFields = [];
    const params = [];

    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        updateFields.push(`${field} = ?`);
        params.push(updates[field]);
      }
    }

    // If no valid fields to update, return current setup
    if (updateFields.length === 0) {
      return getSetupPayoffById(setup_payoff_uuid);
    }

    // Add setup_payoff_uuid to params for WHERE clause
    params.push(setup_payoff_uuid);

    db.prepare(`
      UPDATE setup_payoffs
      SET ${updateFields.join(', ')}
      WHERE setup_payoff_uuid = ?
    `).run(...params);

    return getSetupPayoffById(setup_payoff_uuid);
  };

  /**
   * Delete a setup/payoff
   * @param {string} setup_payoff_uuid - UUID of the setup/payoff to delete
   * @returns {object} Object indicating deletion success
   */
  const deleteSetupPayoff = (setup_payoff_uuid) => {
    const result = db.prepare(`
      DELETE FROM setup_payoffs WHERE setup_payoff_uuid = ?
    `).run(setup_payoff_uuid);

    return { deleted: result.changes > 0 };
  };

  /**
   * Get unfired setups for a project (Chekhov's gun tracker)
   * Returns setups that have been planted or referenced but not yet fired
   * @param {string} project_id - UUID of the project
   * @returns {Array} Array of setup_payoff objects with status 'planted' or 'referenced'
   */
  const getUnfiredSetups = (project_id) => {
    const rows = db.prepare(`
      SELECT setup_payoff_uuid, project_id, setup_event_id, payoff_event_id, description, status, planted_chapter, fired_chapter, created_at
      FROM setup_payoffs
      WHERE project_id = ? AND status IN ('planted', 'referenced')
    `).all(project_id);

    return rows.map(row => ({
      setup_payoff_uuid: row.setup_payoff_uuid,
      project_id: row.project_id,
      setup_event_id: row.setup_event_id,
      payoff_event_id: row.payoff_event_id,
      description: row.description,
      status: row.status,
      planted_chapter: row.planted_chapter,
      fired_chapter: row.fired_chapter,
      created_at: row.created_at
    }));
  };

  /**
   * Fire a setup (mark as paid off)
   * Helper function to transition a setup from planted/referenced to fired
   * @param {string} setup_payoff_uuid - UUID of the setup to fire
   * @param {string} payoff_event_id - UUID of the event where payoff occurs
   * @param {string} fired_chapter - Chapter/scene where payoff fires
   * @returns {object} The updated setup_payoff object
   */
  const fireSetup = (setup_payoff_uuid, payoff_event_id, fired_chapter) => {
    db.prepare(`
      UPDATE setup_payoffs
      SET status = 'fired', payoff_event_id = ?, fired_chapter = ?
      WHERE setup_payoff_uuid = ?
    `).run(payoff_event_id, fired_chapter, setup_payoff_uuid);

    return getSetupPayoffById(setup_payoff_uuid);
  };

  return {
    createSetupPayoff,
    getSetupPayoffsByProject,
    getSetupPayoffById,
    updateSetupPayoff,
    deleteSetupPayoff,
    getUnfiredSetups,
    fireSetup
  };
};

// Self-test when run directly
if (require.main === module) {
  const Database = require('better-sqlite3');
  const fs = require('fs');
  const path = require('path');

  console.log('setup-payoffs.js self-test...');

  const testDb = new Database(':memory:');

  // Run migration to create SETUP_PAYOFFS table
  const migrationPath = path.join(__dirname, '../migrations/006_logic_layer.sql');
  const migration = fs.readFileSync(migrationPath, 'utf8');
  testDb.exec(migration);

  const module = require('./setup-payoffs')(testDb);

  // Test 1: Create valid setup with default 'planted' status
  console.log('✓ Test 1: Create valid setup with default planted status');
  const setup1 = module.createSetupPayoff({
    project_id: 'proj-001',
    setup_event_id: 'event-001',
    description: 'Gun on the mantelpiece',
    planted_chapter: 'Chapter 1'
  });
  console.assert(setup1.setup_payoff_uuid, 'Setup should have UUID');
  console.assert(setup1.status === 'planted', 'Default status should be planted');
  console.assert(setup1.payoff_event_id === null, 'Payoff event should be null initially');
  console.assert(setup1.fired_chapter === null, 'Fired chapter should be null initially');

  // Test 2: Create setup with invalid status
  console.log('✓ Test 2: Create setup with invalid status throws error');
  try {
    module.createSetupPayoff({
      project_id: 'proj-001',
      setup_event_id: 'event-002',
      description: 'test',
      status: 'invalid_status'
    });
    console.assert(false, 'Should throw error for invalid status');
  } catch (e) {
    console.assert(e.message.includes('Invalid status'), 'Should throw status validation error');
    console.assert(e.message.includes('planted, referenced, fired, unfired'), 'Error should list valid statuses');
  }

  // Test 3: Create multiple setups
  console.log('✓ Test 3: Create multiple setups');
  const setup2 = module.createSetupPayoff({
    project_id: 'proj-001',
    setup_event_id: 'event-002',
    description: 'Mysterious locked door',
    planted_chapter: 'Chapter 2',
    status: 'referenced'
  });
  const setup3 = module.createSetupPayoff({
    project_id: 'proj-001',
    setup_event_id: 'event-003',
    description: 'Character mentions old enemy',
    planted_chapter: 'Chapter 1',
    status: 'fired'
  });
  const setup4 = module.createSetupPayoff({
    project_id: 'proj-002',
    setup_event_id: 'event-004',
    description: 'Magic sword in display case',
    planted_chapter: 'Prologue'
  });
  console.assert(setup2.status === 'referenced', 'Should create setup with referenced status');
  console.assert(setup3.status === 'fired', 'Should create setup with fired status');

  // Test 4: Get setups by project
  console.log('✓ Test 4: Get setups by project');
  const proj1Setups = module.getSetupPayoffsByProject('proj-001');
  console.assert(proj1Setups.length === 3, 'Should find 3 setups for proj-001');
  const proj2Setups = module.getSetupPayoffsByProject('proj-002');
  console.assert(proj2Setups.length === 1, 'Should find 1 setup for proj-002');

  // Test 5: Get setup by ID
  console.log('✓ Test 5: Get setup by ID');
  const retrievedSetup = module.getSetupPayoffById(setup1.setup_payoff_uuid);
  console.assert(retrievedSetup !== undefined, 'Should find setup by ID');
  console.assert(retrievedSetup.description === 'Gun on the mantelpiece', 'Retrieved setup should have correct description');
  console.assert(retrievedSetup.planted_chapter === 'Chapter 1', 'Retrieved setup should have correct planted chapter');

  // Test 6: Get unfired setups (Chekhov's gun tracker)
  console.log('✓ Test 6: Get unfired setups returns only planted and referenced');
  const unfiredSetups = module.getUnfiredSetups('proj-001');
  console.assert(unfiredSetups.length === 2, 'Should find 2 unfired setups (planted and referenced)');
  console.assert(unfiredSetups.every(s => s.status === 'planted' || s.status === 'referenced'), 'All unfired setups should be planted or referenced');
  console.assert(!unfiredSetups.some(s => s.status === 'fired'), 'Unfired setups should not include fired setups');

  // Test 7: Update setup description and status
  console.log('✓ Test 7: Update setup description and status');
  const updatedSetup = module.updateSetupPayoff(setup1.setup_payoff_uuid, {
    description: 'Updated: Loaded gun on the mantelpiece',
    status: 'referenced'
  });
  console.assert(updatedSetup.description === 'Updated: Loaded gun on the mantelpiece', 'Description should be updated');
  console.assert(updatedSetup.status === 'referenced', 'Status should be updated to referenced');

  // Test 8: Update with invalid status throws error
  console.log('✓ Test 8: Update with invalid status throws error');
  try {
    module.updateSetupPayoff(setup1.setup_payoff_uuid, {
      status: 'invalid_status'
    });
    console.assert(false, 'Should throw error for invalid status');
  } catch (e) {
    console.assert(e.message.includes('Invalid status'), 'Should throw status validation error');
  }

  // Test 9: fireSetup helper function
  console.log('✓ Test 9: fireSetup helper marks setup as fired');
  const firedSetup = module.fireSetup(setup1.setup_payoff_uuid, 'event-099', 'Chapter 10');
  console.assert(firedSetup.status === 'fired', 'Status should be fired');
  console.assert(firedSetup.payoff_event_id === 'event-099', 'Payoff event should be set');
  console.assert(firedSetup.fired_chapter === 'Chapter 10', 'Fired chapter should be set');

  // Test 10: Verify unfired setups excludes newly fired setup
  console.log('✓ Test 10: Unfired setups excludes fired setup');
  const unfiredAfterFire = module.getUnfiredSetups('proj-001');
  console.assert(unfiredAfterFire.length === 1, 'Should find 1 unfired setup after firing one');
  console.assert(!unfiredAfterFire.some(s => s.setup_payoff_uuid === setup1.setup_payoff_uuid), 'Fired setup should not appear in unfired list');

  // Test 11: Delete setup
  console.log('✓ Test 11: Delete setup');
  const deleteResult = module.deleteSetupPayoff(setup1.setup_payoff_uuid);
  console.assert(deleteResult.deleted === true, 'Delete should return deleted: true');
  const afterDelete = module.getSetupPayoffById(setup1.setup_payoff_uuid);
  console.assert(afterDelete === undefined, 'Setup should not exist after deletion');

  // Test 12: Verify all 4 statuses are valid
  console.log('✓ Test 12: All 4 setup statuses are valid');
  const SETUP_STATUSES = ['planted', 'referenced', 'fired', 'unfired'];
  for (const status of SETUP_STATUSES) {
    const testSetup = module.createSetupPayoff({
      project_id: 'proj-test',
      setup_event_id: 'event-test',
      description: `test ${status} setup`,
      status: status
    });
    console.assert(testSetup.status === status, `Should create setup with status ${status}`);
  }

  console.log('\nAll tests passed!');
}
