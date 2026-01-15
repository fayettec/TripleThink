/**
 * TripleThink World Rules Manager
 * Tracks universe consistency rules (magic systems, tech limits, cultural norms)
 */

class WorldRules {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create a new world rule
   * @param {object} data - { project_id, category, rule_name, rule_statement, constraints, consequences, exceptions, established_event_id, is_hard_rule }
   * @returns {object} Created rule
   */
  create(data) {
    const {
      project_id,
      category,
      rule_name,
      rule_statement,
      constraints,
      consequences,
      exceptions,
      established_event_id,
      is_hard_rule
    } = data;

    // Generate ID
    const id = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const stmt = this.db.prepare(`
      INSERT INTO world_rules (
        id, project_id, category, rule_name, rule_statement,
        constraints, consequences, exceptions, established_event_id, is_hard_rule
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      project_id,
      category || null,
      rule_name,
      rule_statement,
      constraints || null,
      consequences || null,
      exceptions || null,
      established_event_id || null,
      is_hard_rule !== undefined ? is_hard_rule : 1
    );

    return this.get(id);
  }

  /**
   * Get rule by ID
   * @param {string} id
   * @returns {object|null}
   */
  get(id) {
    const stmt = this.db.prepare('SELECT * FROM world_rules WHERE id = ?');
    return stmt.get(id) || null;
  }

  /**
   * Update a rule
   * @param {string} id
   * @param {object} updates - Fields to update
   * @returns {object|null}
   */
  update(id, updates) {
    const allowedFields = [
      'category',
      'rule_name',
      'rule_statement',
      'constraints',
      'consequences',
      'exceptions',
      'established_event_id',
      'is_hard_rule'
    ];

    const setClause = ['updated_at = datetime(\'now\')'];
    const values = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClause.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }

    if (setClause.length === 1) return this.get(id);

    values.push(id);
    const stmt = this.db.prepare(`
      UPDATE world_rules
      SET ${setClause.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    return this.get(id);
  }

  /**
   * Delete a rule
   * @param {string} id
   * @returns {boolean}
   */
  delete(id) {
    const stmt = this.db.prepare('DELETE FROM world_rules WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Get all rules for a project
   * @param {string} projectId
   * @param {object} filter - { category?, is_hard_rule? }
   * @returns {array}
   */
  getByProject(projectId, filter = {}) {
    let query = 'SELECT * FROM world_rules WHERE project_id = ?';
    const values = [projectId];

    if (filter.category) {
      query += ' AND category = ?';
      values.push(filter.category);
    }

    if (filter.is_hard_rule !== undefined) {
      query += ' AND is_hard_rule = ?';
      values.push(filter.is_hard_rule);
    }

    query += ' ORDER BY category, rule_name';

    const stmt = this.db.prepare(query);
    return stmt.all(...values);
  }

  /**
   * Get rules by category
   * @param {string} projectId
   * @param {string} category
   * @returns {array}
   */
  getByCategory(projectId, category) {
    const stmt = this.db.prepare(`
      SELECT * FROM world_rules
      WHERE project_id = ? AND category = ?
      ORDER BY rule_name
    `);

    return stmt.all(projectId, category);
  }

  /**
   * Get hard rules only (cannot be broken)
   * @param {string} projectId
   * @returns {array}
   */
  getHardRules(projectId) {
    const stmt = this.db.prepare(`
      SELECT * FROM world_rules
      WHERE project_id = ? AND is_hard_rule = 1
      ORDER BY category, rule_name
    `);

    return stmt.all(projectId);
  }

  /**
   * Get soft rules (can be bent)
   * @param {string} projectId
   * @returns {array}
   */
  getSoftRules(projectId) {
    const stmt = this.db.prepare(`
      SELECT * FROM world_rules
      WHERE project_id = ? AND is_hard_rule = 0
      ORDER BY category, rule_name
    `);

    return stmt.all(projectId);
  }

  /**
   * Search rules
   * @param {string} projectId
   * @param {string} searchTerm
   * @returns {array}
   */
  search(projectId, searchTerm) {
    const stmt = this.db.prepare(`
      SELECT * FROM world_rules
      WHERE project_id = ?
      AND (
        rule_name LIKE ? OR
        rule_statement LIKE ? OR
        constraints LIKE ? OR
        consequences LIKE ?
      )
      ORDER BY category, rule_name
    `);

    const pattern = `%${searchTerm}%`;
    return stmt.all(projectId, pattern, pattern, pattern, pattern);
  }

  /**
   * Get rules with establishment event details
   * @param {string} projectId
   * @returns {array}
   */
  getAllWithDetails(projectId) {
    const stmt = this.db.prepare(`
      SELECT
        wr.*,
        e.name as established_event_name,
        e.timestamp as established_timestamp
      FROM world_rules wr
      LEFT JOIN entities e ON wr.established_event_id = e.id
      WHERE wr.project_id = ?
      ORDER BY wr.category, wr.rule_name
    `);

    return stmt.all(projectId);
  }

  /**
   * Get rule categories for a project
   * @param {string} projectId
   * @returns {array}
   */
  getCategories(projectId) {
    const stmt = this.db.prepare(`
      SELECT DISTINCT category, COUNT(*) as rule_count
      FROM world_rules
      WHERE project_id = ?
      GROUP BY category
      ORDER BY category
    `);

    return stmt.all(projectId);
  }
}

module.exports = WorldRules;
