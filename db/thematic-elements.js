/**
 * TripleThink Thematic Elements Manager
 * Tracks recurring themes, big ideas, and thematic questions
 */

class ThematicElements {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create a new thematic element
   * @param {object} data - { project_id, statement, question, primary_symbol_id, description }
   * @returns {object} Created element
   */
  create(data) {
    const { project_id, statement, question, primary_symbol_id, description } = data;

    // Generate ID
    const id = `theme-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const stmt = this.db.prepare(`
      INSERT INTO thematic_elements (
        id, project_id, statement, question, primary_symbol_id, description
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      project_id,
      statement,
      question || null,
      primary_symbol_id || null,
      description || null
    );

    return this.get(id);
  }

  /**
   * Get element by ID
   * @param {string} id
   * @returns {object|null}
   */
  get(id) {
    const stmt = this.db.prepare('SELECT * FROM thematic_elements WHERE id = ?');
    return stmt.get(id) || null;
  }

  /**
   * Update an element
   * @param {string} id
   * @param {object} updates - Fields to update
   * @returns {object|null}
   */
  update(id, updates) {
    const allowedFields = ['statement', 'question', 'primary_symbol_id', 'description'];
    const setClause = [];
    const values = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClause.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }

    if (setClause.length === 0) return this.get(id);

    values.push(id);
    const stmt = this.db.prepare(`
      UPDATE thematic_elements
      SET ${setClause.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    return this.get(id);
  }

  /**
   * Delete an element
   * @param {string} id
   * @returns {boolean}
   */
  delete(id) {
    const stmt = this.db.prepare('DELETE FROM thematic_elements WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Get all elements for a project
   * @param {string} projectId
   * @returns {array}
   */
  getByProject(projectId) {
    const stmt = this.db.prepare(`
      SELECT * FROM thematic_elements
      WHERE project_id = ?
      ORDER BY created_at DESC
    `);

    return stmt.all(projectId);
  }

  /**
   * Get element with symbol details
   * @param {string} id
   * @returns {object|null}
   */
  getWithSymbol(id) {
    const stmt = this.db.prepare(`
      SELECT
        te.*,
        e.name as symbol_name,
        e.type as symbol_type
      FROM thematic_elements te
      LEFT JOIN entities e ON te.primary_symbol_id = e.id
      WHERE te.id = ?
    `);

    return stmt.get(id) || null;
  }

  /**
   * Get all elements with symbol details for a project
   * @param {string} projectId
   * @returns {array}
   */
  getAllWithSymbols(projectId) {
    const stmt = this.db.prepare(`
      SELECT
        te.*,
        e.name as symbol_name,
        e.type as symbol_type
      FROM thematic_elements te
      LEFT JOIN entities e ON te.primary_symbol_id = e.id
      WHERE te.project_id = ?
      ORDER BY te.created_at DESC
    `);

    return stmt.all(projectId);
  }

  /**
   * Search elements by statement or question
   * @param {string} projectId
   * @param {string} searchTerm
   * @returns {array}
   */
  search(projectId, searchTerm) {
    const stmt = this.db.prepare(`
      SELECT * FROM thematic_elements
      WHERE project_id = ?
      AND (statement LIKE ? OR question LIKE ? OR description LIKE ?)
      ORDER BY created_at DESC
    `);

    const pattern = `%${searchTerm}%`;
    return stmt.all(projectId, pattern, pattern, pattern);
  }
}

module.exports = ThematicElements;
