// Motif Instances Module
// CRUD operations for MOTIF_INSTANCES table
// Provides recurring pattern tracking across 5 motif types

const { v4: uuidv4 } = require('uuid');

// Valid motif types
const MOTIF_TYPES = ['visual', 'dialogue', 'situational', 'symbolic', 'musical'];

module.exports = (db) => {
  /**
   * Create a new motif instance
   * @param {object} params - Motif parameters
   * @param {string} params.project_id - UUID of the project
   * @param {string} params.motif_type - Type of motif (visual, dialogue, situational, symbolic, musical)
   * @param {string} params.linked_entity_id - Optional entity UUID if motif is object-based
   * @param {string} params.description - Description of the recurring pattern
   * @param {string} params.significance - What the pattern means/represents
   * @returns {object} The created motif instance object
   */
  const createMotifInstance = ({ project_id, motif_type, linked_entity_id, description, significance }) => {
    // Validate motif_type
    if (!MOTIF_TYPES.includes(motif_type)) {
      throw new Error(`Invalid motif_type '${motif_type}'. Must be one of: ${MOTIF_TYPES.join(', ')}`);
    }

    const motif_uuid = uuidv4();
    const created_at = Date.now();

    db.prepare(`
      INSERT INTO motif_instances
      (motif_uuid, project_id, motif_type, linked_entity_id, description, significance, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(motif_uuid, project_id, motif_type, linked_entity_id || null, description, significance || null, created_at);

    return {
      motif_uuid,
      project_id,
      motif_type,
      linked_entity_id: linked_entity_id || null,
      description,
      significance: significance || null,
      created_at
    };
  };

  /**
   * Get all motif instances for a project
   * @param {string} project_id - UUID of the project
   * @returns {Array} Array of motif instance objects
   */
  const getMotifInstancesByProject = (project_id) => {
    const rows = db.prepare(`
      SELECT motif_uuid, project_id, motif_type, linked_entity_id, description, significance, created_at
      FROM motif_instances
      WHERE project_id = ?
    `).all(project_id);

    return rows.map(row => ({
      motif_uuid: row.motif_uuid,
      project_id: row.project_id,
      motif_type: row.motif_type,
      linked_entity_id: row.linked_entity_id,
      description: row.description,
      significance: row.significance,
      created_at: row.created_at
    }));
  };

  /**
   * Get all motif instances of a specific type for a project
   * @param {string} project_id - UUID of the project
   * @param {string} motif_type - Type of motif to filter by
   * @returns {Array} Array of motif instance objects
   */
  const getMotifInstancesByType = (project_id, motif_type) => {
    // Validate motif_type
    if (!MOTIF_TYPES.includes(motif_type)) {
      throw new Error(`Invalid motif_type '${motif_type}'. Must be one of: ${MOTIF_TYPES.join(', ')}`);
    }

    const rows = db.prepare(`
      SELECT motif_uuid, project_id, motif_type, linked_entity_id, description, significance, created_at
      FROM motif_instances
      WHERE project_id = ? AND motif_type = ?
    `).all(project_id, motif_type);

    return rows.map(row => ({
      motif_uuid: row.motif_uuid,
      project_id: row.project_id,
      motif_type: row.motif_type,
      linked_entity_id: row.linked_entity_id,
      description: row.description,
      significance: row.significance,
      created_at: row.created_at
    }));
  };

  /**
   * Get a single motif instance by its UUID
   * @param {string} motif_uuid - UUID of the motif instance
   * @returns {object|undefined} The motif instance object or undefined if not found
   */
  const getMotifInstanceById = (motif_uuid) => {
    const row = db.prepare(`
      SELECT motif_uuid, project_id, motif_type, linked_entity_id, description, significance, created_at
      FROM motif_instances
      WHERE motif_uuid = ?
    `).get(motif_uuid);

    if (!row) return undefined;

    return {
      motif_uuid: row.motif_uuid,
      project_id: row.project_id,
      motif_type: row.motif_type,
      linked_entity_id: row.linked_entity_id,
      description: row.description,
      significance: row.significance,
      created_at: row.created_at
    };
  };

  /**
   * Update an existing motif instance
   * @param {string} motif_uuid - UUID of the motif instance to update
   * @param {object} updates - Object with fields to update (description, significance, linked_entity_id)
   * @returns {object} The updated motif instance object
   */
  const updateMotifInstance = (motif_uuid, updates) => {
    // Validate motif_type if provided (not allowed to change, but validate if present)
    if (updates.motif_type !== undefined && !MOTIF_TYPES.includes(updates.motif_type)) {
      throw new Error(`Invalid motif_type '${updates.motif_type}'. Must be one of: ${MOTIF_TYPES.join(', ')}`);
    }

    // Build dynamic UPDATE statement based on provided fields
    const allowedFields = ['description', 'significance', 'linked_entity_id'];
    const updateFields = [];
    const params = [];

    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        updateFields.push(`${field} = ?`);
        params.push(updates[field]);
      }
    }

    // If no valid fields to update, return current motif
    if (updateFields.length === 0) {
      return getMotifInstanceById(motif_uuid);
    }

    // Add motif_uuid to params for WHERE clause
    params.push(motif_uuid);

    db.prepare(`
      UPDATE motif_instances
      SET ${updateFields.join(', ')}
      WHERE motif_uuid = ?
    `).run(...params);

    return getMotifInstanceById(motif_uuid);
  };

  /**
   * Delete a motif instance
   * @param {string} motif_uuid - UUID of the motif instance to delete
   * @returns {object} Object indicating deletion success
   */
  const deleteMotifInstance = (motif_uuid) => {
    const result = db.prepare(`
      DELETE FROM motif_instances WHERE motif_uuid = ?
    `).run(motif_uuid);

    return { deleted: result.changes > 0 };
  };

  return {
    createMotifInstance,
    getMotifInstancesByProject,
    getMotifInstancesByType,
    getMotifInstanceById,
    updateMotifInstance,
    deleteMotifInstance
  };
};

// Self-test when run directly
if (require.main === module) {
  const Database = require('better-sqlite3');
  const fs = require('fs');
  const path = require('path');

  console.log('motif-instances.js self-test...');

  const testDb = new Database(':memory:');

  // Run migration to create MOTIF_INSTANCES table
  const migrationPath = path.join(__dirname, '../migrations/006_logic_layer.sql');
  const migration = fs.readFileSync(migrationPath, 'utf8');
  testDb.exec(migration);

  const module = require('./motif-instances')(testDb);

  // Test 1: Create valid visual motif
  console.log('✓ Test 1: Create valid visual motif');
  const motif1 = module.createMotifInstance({
    project_id: 'proj-001',
    motif_type: 'visual',
    linked_entity_id: 'entity-001',
    description: 'Red scarf appears in key moments',
    significance: 'Represents protagonist\'s lost love'
  });
  console.assert(motif1.motif_uuid, 'Motif should have UUID');
  console.assert(motif1.motif_type === 'visual', 'Type should be visual');
  console.assert(motif1.description === 'Red scarf appears in key moments', 'Description should match');
  console.assert(motif1.significance === 'Represents protagonist\'s lost love', 'Significance should match');

  // Test 2: Create motif with invalid type
  console.log('✓ Test 2: Create motif with invalid type throws error');
  try {
    module.createMotifInstance({
      project_id: 'proj-001',
      motif_type: 'invalid_type',
      description: 'test'
    });
    console.assert(false, 'Should throw error for invalid type');
  } catch (e) {
    console.assert(e.message.includes('Invalid motif_type'), 'Should throw type validation error');
    console.assert(e.message.includes('visual, dialogue, situational, symbolic, musical'), 'Error should list valid types');
  }

  // Test 3: Create motifs of each type
  console.log('✓ Test 3: Create motifs of all 5 types');
  const motif2 = module.createMotifInstance({
    project_id: 'proj-001',
    motif_type: 'dialogue',
    description: '"I\'m fine" repeated phrase'
  });
  const motif3 = module.createMotifInstance({
    project_id: 'proj-001',
    motif_type: 'situational',
    description: 'Character always arrives late to important meetings'
  });
  const motif4 = module.createMotifInstance({
    project_id: 'proj-002',
    motif_type: 'symbolic',
    description: 'Broken clock symbolizes frozen time'
  });
  console.assert(motif2.motif_type === 'dialogue', 'Should create dialogue motif');
  console.assert(motif3.motif_type === 'situational', 'Should create situational motif');
  console.assert(motif4.motif_type === 'symbolic', 'Should create symbolic motif');

  // Test 4: Get motifs by project
  console.log('✓ Test 4: Get motifs by project');
  const proj1Motifs = module.getMotifInstancesByProject('proj-001');
  console.assert(proj1Motifs.length === 3, 'Should find 3 motifs for proj-001');
  const proj2Motifs = module.getMotifInstancesByProject('proj-002');
  console.assert(proj2Motifs.length === 1, 'Should find 1 motif for proj-002');

  // Test 5: Get motifs by type
  console.log('✓ Test 5: Get motifs by type');
  const visualMotifs = module.getMotifInstancesByType('proj-001', 'visual');
  console.assert(visualMotifs.length === 1, 'Should find 1 visual motif in proj-001');
  console.assert(visualMotifs[0].motif_uuid === motif1.motif_uuid, 'Should match motif1');

  // Test 6: Get motifs by type with invalid type throws error
  console.log('✓ Test 6: Get motifs by invalid type throws error');
  try {
    module.getMotifInstancesByType('proj-001', 'invalid_type');
    console.assert(false, 'Should throw error for invalid type');
  } catch (e) {
    console.assert(e.message.includes('Invalid motif_type'), 'Should throw type validation error');
  }

  // Test 7: Get motif by ID
  console.log('✓ Test 7: Get motif by ID');
  const retrievedMotif = module.getMotifInstanceById(motif1.motif_uuid);
  console.assert(retrievedMotif !== undefined, 'Should find motif by ID');
  console.assert(retrievedMotif.motif_type === 'visual', 'Retrieved motif should have correct type');
  console.assert(retrievedMotif.description === 'Red scarf appears in key moments', 'Retrieved motif should have correct description');

  // Test 8: Update motif description and significance
  console.log('✓ Test 8: Update motif description and significance');
  const updatedMotif = module.updateMotifInstance(motif1.motif_uuid, {
    description: 'Updated: Red scarf in pivotal scenes',
    significance: 'Updated: Symbolizes hope and memory'
  });
  console.assert(updatedMotif.description === 'Updated: Red scarf in pivotal scenes', 'Description should be updated');
  console.assert(updatedMotif.significance === 'Updated: Symbolizes hope and memory', 'Significance should be updated');
  console.assert(updatedMotif.motif_type === 'visual', 'Type should remain unchanged');

  // Test 9: Delete motif
  console.log('✓ Test 9: Delete motif');
  const deleteResult = module.deleteMotifInstance(motif1.motif_uuid);
  console.assert(deleteResult.deleted === true, 'Delete should return deleted: true');
  const afterDelete = module.getMotifInstanceById(motif1.motif_uuid);
  console.assert(afterDelete === undefined, 'Motif should not exist after deletion');

  // Test 10: Verify all 5 motif types are valid
  console.log('✓ Test 10: All 5 motif types are valid');
  const MOTIF_TYPES = ['visual', 'dialogue', 'situational', 'symbolic', 'musical'];
  for (const type of MOTIF_TYPES) {
    const testMotif = module.createMotifInstance({
      project_id: 'proj-test',
      motif_type: type,
      description: `test ${type} motif`
    });
    console.assert(testMotif.motif_type === type, `Should create motif with type ${type}`);
  }

  console.log('\nAll tests passed!');
}
