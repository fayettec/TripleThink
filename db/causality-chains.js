/**
 * TripleThink Causality Chains Manager
 * Tracks cause-effect relationships between events
 */

class CausalityChains {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create a new causality chain
   * @param {object} data - { cause_event_id, effect_event_id, type, strength, explanation }
   * @returns {object} Created chain
   */
  create(data) {
    const { cause_event_id, effect_event_id, type, strength, explanation } = data;

    // Generate ID
    const id = `causal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const stmt = this.db.prepare(`
      INSERT INTO causality_chains (
        id, cause_event_id, effect_event_id, type, strength, explanation
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, cause_event_id, effect_event_id, type, strength || 5, explanation || null);
    return this.get(id);
  }

  /**
   * Get chain by ID
   * @param {string} id
   * @returns {object|null}
   */
  get(id) {
    const stmt = this.db.prepare('SELECT * FROM causality_chains WHERE id = ?');
    return stmt.get(id) || null;
  }

  /**
   * Update a chain
   * @param {string} id
   * @param {object} updates - Fields to update
   * @returns {object|null}
   */
  update(id, updates) {
    const allowedFields = ['type', 'strength', 'explanation'];
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
      UPDATE causality_chains
      SET ${setClause.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    return this.get(id);
  }

  /**
   * Delete a chain
   * @param {string} id
   * @returns {boolean}
   */
  delete(id) {
    const stmt = this.db.prepare('DELETE FROM causality_chains WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Get all chains causing a specific event
   * @param {string} effectEventId
   * @returns {array}
   */
  getCauses(effectEventId) {
    const stmt = this.db.prepare(`
      SELECT * FROM causality_chains
      WHERE effect_event_id = ?
      ORDER BY strength DESC
    `);
    return stmt.all(effectEventId);
  }

  /**
   * Get all chains caused by a specific event
   * @param {string} causeEventId
   * @returns {array}
   */
  getEffects(causeEventId) {
    const stmt = this.db.prepare(`
      SELECT * FROM causality_chains
      WHERE cause_event_id = ?
      ORDER BY strength DESC
    `);
    return stmt.all(causeEventId);
  }

  /**
   * Get full causal chain (recursive causes and effects)
   * @param {string} eventId
   * @param {number} maxDepth - Maximum recursion depth
   * @returns {object} - { causes: [], effects: [] }
   */
  getFullChain(eventId, maxDepth = 5) {
    const causes = this._recursiveCauses(eventId, maxDepth, new Set());
    const effects = this._recursiveEffects(eventId, maxDepth, new Set());

    return { causes, effects };
  }

  /**
   * Internal: Recursive cause traversal
   */
  _recursiveCauses(eventId, depth, visited) {
    if (depth <= 0 || visited.has(eventId)) return [];
    visited.add(eventId);

    const directCauses = this.getCauses(eventId);
    const allCauses = [...directCauses];

    for (const chain of directCauses) {
      const nestedCauses = this._recursiveCauses(chain.cause_event_id, depth - 1, visited);
      allCauses.push(...nestedCauses);
    }

    return allCauses;
  }

  /**
   * Internal: Recursive effect traversal
   */
  _recursiveEffects(eventId, depth, visited) {
    if (depth <= 0 || visited.has(eventId)) return [];
    visited.add(eventId);

    const directEffects = this.getEffects(eventId);
    const allEffects = [...directEffects];

    for (const chain of directEffects) {
      const nestedEffects = this._recursiveEffects(chain.effect_event_id, depth - 1, visited);
      allEffects.push(...nestedEffects);
    }

    return allEffects;
  }

  /**
   * Get all chains (with optional filtering)
   * @param {object} filter - { type?, min_strength?, max_strength? }
   * @returns {array}
   */
  getAll(filter = {}) {
    let query = 'SELECT * FROM causality_chains WHERE 1=1';
    const values = [];

    if (filter.type) {
      query += ' AND type = ?';
      values.push(filter.type);
    }

    if (filter.min_strength) {
      query += ' AND strength >= ?';
      values.push(filter.min_strength);
    }

    if (filter.max_strength) {
      query += ' AND strength <= ?';
      values.push(filter.max_strength);
    }

    query += ' ORDER BY strength DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...values);
  }
}

module.exports = CausalityChains;
