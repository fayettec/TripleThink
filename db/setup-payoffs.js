/**
 * TripleThink Setup/Payoffs Manager
 * Tracks Chekhov's guns, foreshadowing, and plant/payoff pairs
 */

class SetupPayoffs {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create a new setup/payoff
   * @param {object} data - { project_id, setup_event_id, payoff_event_id, setup_type, setup_description, payoff_description, status, importance }
   * @returns {object} Created setup
   */
  create(data) {
    const {
      project_id,
      setup_event_id,
      payoff_event_id,
      setup_type,
      setup_description,
      payoff_description,
      status,
      importance
    } = data;

    // Generate ID
    const id = `setup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const stmt = this.db.prepare(`
      INSERT INTO setup_payoffs (
        id, project_id, setup_event_id, payoff_event_id,
        setup_type, setup_description, payoff_description, status, importance
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      project_id,
      setup_event_id,
      payoff_event_id || null,
      setup_type || 'chekhov_gun',
      setup_description,
      payoff_description || null,
      status || 'planted',
      importance || 5
    );

    return this.get(id);
  }

  /**
   * Get setup by ID
   * @param {string} id
   * @returns {object|null}
   */
  get(id) {
    const stmt = this.db.prepare('SELECT * FROM setup_payoffs WHERE id = ?');
    return stmt.get(id) || null;
  }

  /**
   * Update a setup/payoff
   * @param {string} id
   * @param {object} updates - Fields to update
   * @returns {object|null}
   */
  update(id, updates) {
    const allowedFields = [
      'payoff_event_id',
      'setup_type',
      'setup_description',
      'payoff_description',
      'status',
      'importance'
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
      UPDATE setup_payoffs
      SET ${setClause.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    return this.get(id);
  }

  /**
   * Fire a Chekhov's gun (mark as fired with payoff event)
   * @param {string} id
   * @param {string} payoffEventId
   * @param {string} payoffDescription
   * @returns {object|null}
   */
  fire(id, payoffEventId, payoffDescription) {
    return this.update(id, {
      payoff_event_id: payoffEventId,
      payoff_description: payoffDescription,
      status: 'fired'
    });
  }

  /**
   * Mark as referenced (intermediate state)
   * @param {string} id
   * @returns {object|null}
   */
  reference(id) {
    return this.update(id, { status: 'referenced' });
  }

  /**
   * Abandon a setup
   * @param {string} id
   * @returns {object|null}
   */
  abandon(id) {
    return this.update(id, { status: 'abandoned' });
  }

  /**
   * Delete a setup
   * @param {string} id
   * @returns {boolean}
   */
  delete(id) {
    const stmt = this.db.prepare('DELETE FROM setup_payoffs WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Get all setups for a project
   * @param {string} projectId
   * @param {object} filter - { status?, setup_type?, min_importance? }
   * @returns {array}
   */
  getByProject(projectId, filter = {}) {
    let query = 'SELECT * FROM setup_payoffs WHERE project_id = ?';
    const values = [projectId];

    if (filter.status) {
      query += ' AND status = ?';
      values.push(filter.status);
    }

    if (filter.setup_type) {
      query += ' AND setup_type = ?';
      values.push(filter.setup_type);
    }

    if (filter.min_importance) {
      query += ' AND importance >= ?';
      values.push(filter.min_importance);
    }

    query += ' ORDER BY importance DESC, updated_at DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...values);
  }

  /**
   * Get unfired guns (potential issues)
   * @param {string} projectId
   * @returns {array}
   */
  getUnfiredGuns(projectId) {
    const stmt = this.db.prepare(`
      SELECT * FROM setup_payoffs
      WHERE project_id = ?
      AND status = 'planted'
      AND setup_type = 'chekhov_gun'
      ORDER BY importance DESC
    `);

    return stmt.all(projectId);
  }

  /**
   * Get all setups by event (setup or payoff)
   * @param {string} eventId
   * @returns {object} - { setups: [], payoffs: [] }
   */
  getByEvent(eventId) {
    const setupStmt = this.db.prepare(`
      SELECT * FROM setup_payoffs
      WHERE setup_event_id = ?
      ORDER BY importance DESC
    `);

    const payoffStmt = this.db.prepare(`
      SELECT * FROM setup_payoffs
      WHERE payoff_event_id = ?
      ORDER BY importance DESC
    `);

    return {
      setups: setupStmt.all(eventId),
      payoffs: payoffStmt.all(eventId)
    };
  }

  /**
   * Get all setups with event details
   * @param {string} projectId
   * @returns {array}
   */
  getAllWithDetails(projectId) {
    const stmt = this.db.prepare(`
      SELECT
        sp.*,
        e1.name as setup_event_name,
        e1.timestamp as setup_timestamp,
        e2.name as payoff_event_name,
        e2.timestamp as payoff_timestamp
      FROM setup_payoffs sp
      JOIN entities e1 ON sp.setup_event_id = e1.id
      LEFT JOIN entities e2 ON sp.payoff_event_id = e2.id
      WHERE sp.project_id = ?
      ORDER BY sp.importance DESC, e1.timestamp ASC
    `);

    return stmt.all(projectId);
  }
}

module.exports = SetupPayoffs;
