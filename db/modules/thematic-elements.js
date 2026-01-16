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

  return {
    createTheme,
    getThemesByProject,
    getThemeById,
    updateTheme,
    deleteTheme
  };
};
