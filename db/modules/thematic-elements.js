// Thematic Elements Module
// CRUD operations for THEMATIC_ELEMENTS table
// Tracks thematic statements, questions, symbols, and manifestations throughout the story

const { v4: uuidv4 } = require('uuid');

module.exports = (db) => {
  /**
   * Create a new thematic element
   * @param {object} params - Theme parameters
   * @param {string} params.project_id - UUID of the project
   * @param {string} params.statement - Thematic statement or message (required)
   * @param {string|null} params.primary_symbol_id - Optional reference to entity used as primary symbol
   * @param {string|null} params.question - Thematic question story explores
   * @param {Array<string>} params.manifestations - Array of ways theme appears in story (default: [])
   * @returns {object} The created theme object with deserialized manifestations
   */
  const createTheme = ({ project_id, statement, primary_symbol_id = null, question = null, manifestations = [] }) => {
    if (!statement) {
      throw new Error('statement is required');
    }

    const themeUuid = uuidv4();
    const createdAt = Date.now();

    // Serialize manifestations array to JSON string for storage
    const manifestationsJson = JSON.stringify(manifestations);

    db.prepare(`
      INSERT INTO thematic_elements
      (theme_uuid, project_id, statement, primary_symbol_id, question, manifestations, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(themeUuid, project_id, statement, primary_symbol_id, question, manifestationsJson, createdAt);

    return {
      theme_uuid: themeUuid,
      project_id: project_id,
      statement: statement,
      primary_symbol_id: primary_symbol_id,
      question: question,
      manifestations: manifestations, // Return as array
      created_at: createdAt
    };
  };

  /**
   * Get all themes for a project
   * @param {string} projectId - UUID of the project
   * @returns {Array} Array of theme objects with deserialized manifestations
   */
  const getThemesByProject = (projectId) => {
    const rows = db.prepare(`
      SELECT theme_uuid, project_id, statement, primary_symbol_id, question, manifestations, created_at
      FROM thematic_elements
      WHERE project_id = ?
      ORDER BY created_at ASC
    `).all(projectId);

    return rows.map(row => ({
      theme_uuid: row.theme_uuid,
      project_id: row.project_id,
      statement: row.statement,
      primary_symbol_id: row.primary_symbol_id,
      question: row.question,
      manifestations: row.manifestations ? JSON.parse(row.manifestations) : [],
      created_at: row.created_at
    }));
  };

  /**
   * Get a single theme by its UUID
   * @param {string} themeUuid - UUID of the theme
   * @returns {object|null} The theme object with deserialized manifestations, or null if not found
   */
  const getThemeById = (themeUuid) => {
    const row = db.prepare(`
      SELECT theme_uuid, project_id, statement, primary_symbol_id, question, manifestations, created_at
      FROM thematic_elements
      WHERE theme_uuid = ?
    `).get(themeUuid);

    if (!row) return null;

    return {
      theme_uuid: row.theme_uuid,
      project_id: row.project_id,
      statement: row.statement,
      primary_symbol_id: row.primary_symbol_id,
      question: row.question,
      manifestations: row.manifestations ? JSON.parse(row.manifestations) : [],
      created_at: row.created_at
    };
  };

  /**
   * Update an existing theme
   * @param {string} themeUuid - UUID of the theme to update
   * @param {object} updates - Object with fields to update (statement, primary_symbol_id, question, manifestations)
   * @returns {number} Number of rows updated (1 if successful, 0 if not found)
   */
  const updateTheme = (themeUuid, updates) => {
    // Build dynamic UPDATE statement based on provided fields
    const allowedFields = ['statement', 'primary_symbol_id', 'question', 'manifestations'];
    const updateFields = [];
    const params = [];

    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        // Special handling for manifestations: serialize to JSON
        if (field === 'manifestations') {
          updateFields.push(`${field} = ?`);
          params.push(JSON.stringify(updates[field]));
        } else {
          updateFields.push(`${field} = ?`);
          params.push(updates[field]);
        }
      }
    }

    // If no valid fields to update, return 0
    if (updateFields.length === 0) {
      return 0;
    }

    // Add theme_uuid to params for WHERE clause
    params.push(themeUuid);

    const result = db.prepare(`
      UPDATE thematic_elements
      SET ${updateFields.join(', ')}
      WHERE theme_uuid = ?
    `).run(...params);

    return result.changes;
  };

  /**
   * Delete a theme
   * @param {string} themeUuid - UUID of the theme to delete
   * @returns {boolean} True if deleted, false if not found
   */
  const deleteTheme = (themeUuid) => {
    const result = db.prepare(`
      DELETE FROM thematic_elements WHERE theme_uuid = ?
    `).run(themeUuid);

    return result.changes > 0;
  };

  /**
   * Add a manifestation to an existing theme
   * @param {string} themeUuid - UUID of the theme
   * @param {string} manifestationText - Manifestation text to add (non-empty string)
   * @returns {number} 1 if successful, 0 if theme not found or invalid input
   */
  const addManifestation = (themeUuid, manifestationText) => {
    // Validate manifestation text
    if (!manifestationText || typeof manifestationText !== 'string' || manifestationText.trim() === '') {
      return 0;
    }

    // Get current theme
    const theme = getThemeById(themeUuid);
    if (!theme) {
      return 0;
    }

    // Append new manifestation
    const updatedManifestations = [...theme.manifestations, manifestationText];

    // Update theme with new manifestations array
    return updateTheme(themeUuid, { manifestations: updatedManifestations });
  };

  /**
   * Remove a manifestation from an existing theme
   * @param {string} themeUuid - UUID of the theme
   * @param {number} index - Index of manifestation to remove (0-based)
   * @returns {number} 1 if successful, 0 if theme not found or invalid index
   */
  const removeManifestation = (themeUuid, index) => {
    // Get current theme
    const theme = getThemeById(themeUuid);
    if (!theme) {
      return 0;
    }

    // Validate index
    if (!Number.isInteger(index) || index < 0 || index >= theme.manifestations.length) {
      return 0;
    }

    // Remove manifestation at index
    const updatedManifestations = [...theme.manifestations];
    updatedManifestations.splice(index, 1);

    // Update theme with modified manifestations array
    return updateTheme(themeUuid, { manifestations: updatedManifestations });
  };

  return {
    createTheme,
    getThemesByProject,
    getThemeById,
    updateTheme,
    deleteTheme,
    addManifestation,
    removeManifestation
  };
};

// Self-test when run directly
if (require.main === module) {
  console.log('thematic-elements.js self-test...\n');

  const Database = require('better-sqlite3');
  const fs = require('fs');
  const path = require('path');

  // Create in-memory database
  const testDb = new Database(':memory:');

  // Run migration to create THEMATIC_ELEMENTS table
  const migrationPath = path.join(__dirname, '../migrations/006_logic_layer.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  testDb.exec(migrationSQL);

  // Initialize module
  const thematicElements = require('./thematic-elements')(testDb);

  let testCount = 0;
  let passedCount = 0;

  const assert = (condition, message) => {
    testCount++;
    if (condition) {
      passedCount++;
      console.log(`✓ Test ${testCount}: ${message}`);
    } else {
      console.log(`✗ Test ${testCount} failed: ${message}`);
    }
  };

  // Test 1: createTheme - with statement only
  const theme1 = thematicElements.createTheme({
    project_id: 'proj-001',
    statement: 'Power corrupts absolutely'
  });
  assert(theme1.theme_uuid, 'Theme created with UUID');
  assert(theme1.statement === 'Power corrupts absolutely', 'Statement persisted correctly');
  assert(Array.isArray(theme1.manifestations) && theme1.manifestations.length === 0, 'Manifestations defaults to empty array');

  // Test 2: createTheme - with all fields
  const theme2 = thematicElements.createTheme({
    project_id: 'proj-001',
    statement: 'Redemption is always possible',
    question: 'Can anyone be redeemed?',
    primary_symbol_id: 'entity-symbol-01',
    manifestations: [
      'Protagonist spares enemy in climax',
      'Antagonist shows remorse in final scene'
    ]
  });
  assert(theme2.question === 'Can anyone be redeemed?', 'Question field persisted');
  assert(theme2.primary_symbol_id === 'entity-symbol-01', 'Primary symbol ID persisted');
  assert(theme2.manifestations.length === 2, 'Manifestations array has 2 items');
  assert(Array.isArray(theme2.manifestations), 'Manifestations is array, not JSON string');

  // Test 3: getThemesByProject
  const byProject = thematicElements.getThemesByProject('proj-001');
  assert(byProject.length === 2, 'Found 2 themes for project');
  assert(Array.isArray(byProject[0].manifestations), 'First theme manifestations deserialized to array');
  assert(Array.isArray(byProject[1].manifestations), 'Second theme manifestations deserialized to array');

  // Test 4: getThemeById
  const retrieved = thematicElements.getThemeById(theme2.theme_uuid);
  assert(retrieved !== null, 'Retrieved theme by UUID');
  assert(retrieved.statement === 'Redemption is always possible', 'Statement matches');
  assert(Array.isArray(retrieved.manifestations), 'Manifestations is array in retrieved object');
  assert(retrieved.manifestations.length === 2, 'Manifestations length preserved');

  // Test 5: updateTheme - update statement
  const updateResult1 = thematicElements.updateTheme(theme1.theme_uuid, {
    statement: 'Absolute power corrupts absolutely'
  });
  assert(updateResult1 === 1, 'Update returns 1 for successful update');
  const updated1 = thematicElements.getThemeById(theme1.theme_uuid);
  assert(updated1.statement === 'Absolute power corrupts absolutely', 'Statement updated');
  assert(updated1.manifestations.length === 0, 'Manifestations unchanged after statement update');

  // Test 6: updateTheme - update manifestations
  const updateResult2 = thematicElements.updateTheme(theme1.theme_uuid, {
    manifestations: ['Leader becomes tyrant', 'Character refuses power']
  });
  assert(updateResult2 === 1, 'Manifestations update returns 1');
  const updated2 = thematicElements.getThemeById(theme1.theme_uuid);
  assert(updated2.manifestations.length === 2, 'Manifestations array updated');
  assert(updated2.manifestations[0] === 'Leader becomes tyrant', 'First manifestation correct');

  // Test 7: addManifestation
  const addResult1 = thematicElements.addManifestation(theme2.theme_uuid, 'Villain sacrifices self to save hero');
  assert(addResult1 === 1, 'addManifestation returns 1 on success');
  const afterAdd = thematicElements.getThemeById(theme2.theme_uuid);
  assert(afterAdd.manifestations.length === 3, 'Manifestations array grew by 1');
  assert(afterAdd.manifestations[2] === 'Villain sacrifices self to save hero', 'New manifestation at end of array');

  // Test 8: addManifestation - theme not found
  const addResult2 = thematicElements.addManifestation('nonexistent-uuid', 'Some text');
  assert(addResult2 === 0, 'addManifestation returns 0 for nonexistent theme');

  // Test 9: removeManifestation
  const theme3 = thematicElements.createTheme({
    project_id: 'proj-002',
    statement: 'Test theme',
    manifestations: ['First', 'Second', 'Third']
  });
  const removeResult1 = thematicElements.removeManifestation(theme3.theme_uuid, 1);
  assert(removeResult1 === 1, 'removeManifestation returns 1 on success');
  const afterRemove = thematicElements.getThemeById(theme3.theme_uuid);
  assert(afterRemove.manifestations.length === 2, 'Manifestations array shrunk by 1');
  assert(afterRemove.manifestations[0] === 'First', 'First manifestation unchanged');
  assert(afterRemove.manifestations[1] === 'Third', 'Third manifestation moved to index 1');

  // Test 10: removeManifestation - invalid index
  const removeResult2 = thematicElements.removeManifestation(theme3.theme_uuid, 999);
  assert(removeResult2 === 0, 'removeManifestation returns 0 for invalid index');

  // Test 11: deleteTheme
  const deleteResult = thematicElements.deleteTheme(theme3.theme_uuid);
  assert(deleteResult === true, 'deleteTheme returns true on success');
  const afterDelete = thematicElements.getThemeById(theme3.theme_uuid);
  assert(afterDelete === null, 'Deleted theme returns null on getThemeById');

  // Test 12: Empty manifestations handling
  const theme4 = thematicElements.createTheme({
    project_id: 'proj-003',
    statement: 'Theme with no manifestations'
  });
  const retrieved4 = thematicElements.getThemeById(theme4.theme_uuid);
  assert(Array.isArray(retrieved4.manifestations), 'Null manifestations deserialized to array');
  assert(retrieved4.manifestations.length === 0, 'Null manifestations returns empty array');

  // Summary
  console.log(`\n${passedCount}/${testCount} tests passed`);
  if (passedCount === testCount) {
    console.log('All tests passed!');
  } else {
    console.log(`${testCount - passedCount} tests failed`);
    process.exit(1);
  }
}
