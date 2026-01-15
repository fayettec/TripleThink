/**
 * TripleThink Story Conflicts Manager
 * Tracks active conflicts, stakes, and opposition
 */

class StoryConflicts {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create a new conflict
   * @param {object} data - { project_id, type, protagonist_id, antagonist_source, stakes_success, stakes_fail, status, intensity }
   * @returns {object} Created conflict
   */
  create(data) {
    const {
      project_id,
      type,
      protagonist_id,
      antagonist_source,
      stakes_success,
      stakes_fail,
      status,
      intensity
    } = data;

    // Generate ID
    const id = `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const stmt = this.db.prepare(`
      INSERT INTO story_conflicts (
        id, project_id, type, protagonist_id, antagonist_source,
        stakes_success, stakes_fail, status, intensity
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      project_id,
      type || null,
      protagonist_id,
      antagonist_source || null,
      stakes_success || null,
      stakes_fail || null,
      status || 'latent',
      intensity || 1
    );

    return this.get(id);
  }

  /**
   * Get conflict by ID
   * @param {string} id
   * @returns {object|null}
   */
  get(id) {
    const stmt = this.db.prepare('SELECT * FROM story_conflicts WHERE id = ?');
    return stmt.get(id) || null;
  }

  /**
   * Update a conflict
   * @param {string} id
   * @param {object} updates - Fields to update
   * @returns {object|null}
   */
  update(id, updates) {
    const allowedFields = [
      'type',
      'antagonist_source',
      'stakes_success',
      'stakes_fail',
      'status',
      'intensity'
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
      UPDATE story_conflicts
      SET ${setClause.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    return this.get(id);
  }

  /**
   * Escalate a conflict
   * @param {string} id
   * @param {number} newIntensity
   * @returns {object|null}
   */
  escalate(id, newIntensity) {
    const conflict = this.get(id);
    if (!conflict) return null;

    const intensity = newIntensity || Math.min(10, (conflict.intensity || 1) + 1);
    return this.update(id, { intensity, status: 'escalating' });
  }

  /**
   * Resolve a conflict
   * @param {string} id
   * @returns {object|null}
   */
  resolve(id) {
    return this.update(id, { status: 'resolved' });
  }

  /**
   * Delete a conflict
   * @param {string} id
   * @returns {boolean}
   */
  delete(id) {
    const stmt = this.db.prepare('DELETE FROM story_conflicts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Get conflicts by project
   * @param {string} projectId
   * @param {object} filter - { status?, type?, min_intensity? }
   * @returns {array}
   */
  getByProject(projectId, filter = {}) {
    let query = 'SELECT * FROM story_conflicts WHERE project_id = ?';
    const values = [projectId];

    if (filter.status) {
      query += ' AND status = ?';
      values.push(filter.status);
    }

    if (filter.type) {
      query += ' AND type = ?';
      values.push(filter.type);
    }

    if (filter.min_intensity) {
      query += ' AND intensity >= ?';
      values.push(filter.min_intensity);
    }

    query += ' ORDER BY intensity DESC, updated_at DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...values);
  }

  /**
   * Get active conflicts for a protagonist
   * @param {string} protagonistId
   * @returns {array}
   */
  getByProtagonist(protagonistId) {
    const stmt = this.db.prepare(`
      SELECT * FROM story_conflicts
      WHERE protagonist_id = ?
      AND status IN ('active', 'escalating', 'climactic')
      ORDER BY intensity DESC
    `);

    return stmt.all(protagonistId);
  }

  /**
   * Get all conflicts with character details
   * @param {string} projectId
   * @returns {array}
   */
  getAllWithDetails(projectId) {
    const stmt = this.db.prepare(`
      SELECT
        sc.*,
        e.name as protagonist_name
      FROM story_conflicts sc
      JOIN entities e ON sc.protagonist_id = e.id
      WHERE sc.project_id = ?
      ORDER BY sc.intensity DESC, sc.updated_at DESC
    `);

    return stmt.all(projectId);
  }
}

module.exports = StoryConflicts;
