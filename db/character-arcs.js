/**
 * TripleThink Character Arcs Manager
 * Tracks character transformation and story structure arcs
 */

class CharacterArcs {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create a new character arc
   * @param {object} data - { character_id, archetype, lie_belief, truth_belief, want_external, need_internal, current_phase }
   * @returns {object} Created arc
   */
  create(data) {
    const {
      character_id,
      archetype,
      lie_belief,
      truth_belief,
      want_external,
      need_internal,
      current_phase
    } = data;

    // Generate ID
    const id = `arc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const stmt = this.db.prepare(`
      INSERT INTO character_arcs (
        id, character_id, archetype, lie_belief, truth_belief,
        want_external, need_internal, current_phase
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      character_id,
      archetype || null,
      lie_belief || null,
      truth_belief || null,
      want_external || null,
      need_internal || null,
      current_phase || 'setup'
    );

    return this.get(id);
  }

  /**
   * Get arc by ID
   * @param {string} id
   * @returns {object|null}
   */
  get(id) {
    const stmt = this.db.prepare('SELECT * FROM character_arcs WHERE id = ?');
    return stmt.get(id) || null;
  }

  /**
   * Get arc by character ID
   * @param {string} characterId
   * @returns {object|null}
   */
  getByCharacter(characterId) {
    const stmt = this.db.prepare('SELECT * FROM character_arcs WHERE character_id = ? LIMIT 1');
    return stmt.get(characterId) || null;
  }

  /**
   * Update an arc
   * @param {string} id
   * @param {object} updates - Fields to update
   * @returns {object|null}
   */
  update(id, updates) {
    const allowedFields = [
      'archetype',
      'lie_belief',
      'truth_belief',
      'want_external',
      'need_internal',
      'current_phase'
    ];

    const setClause = ['updated_at = datetime(\'now\')'];
    const values = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClause.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }

    if (setClause.length === 1) return this.get(id); // Only updated_at, skip

    values.push(id);
    const stmt = this.db.prepare(`
      UPDATE character_arcs
      SET ${setClause.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    return this.get(id);
  }

  /**
   * Advance the arc phase
   * @param {string} id
   * @param {string} newPhase
   * @returns {object|null}
   */
  advancePhase(id, newPhase) {
    return this.update(id, { current_phase: newPhase });
  }

  /**
   * Delete an arc
   * @param {string} id
   * @returns {boolean}
   */
  delete(id) {
    const stmt = this.db.prepare('DELETE FROM character_arcs WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Get all arcs (optionally filtered by phase)
   * @param {object} filter - { current_phase?, archetype? }
   * @returns {array}
   */
  getAll(filter = {}) {
    let query = 'SELECT * FROM character_arcs WHERE 1=1';
    const values = [];

    if (filter.current_phase) {
      query += ' AND current_phase = ?';
      values.push(filter.current_phase);
    }

    if (filter.archetype) {
      query += ' AND archetype = ?';
      values.push(filter.archetype);
    }

    query += ' ORDER BY updated_at DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...values);
  }

  /**
   * Get arc summary with character details
   * @param {string} id
   * @returns {object|null}
   */
  getWithCharacter(id) {
    const stmt = this.db.prepare(`
      SELECT
        ca.*,
        e.name as character_name,
        e.type as character_type
      FROM character_arcs ca
      JOIN entities e ON ca.character_id = e.id
      WHERE ca.id = ?
    `);

    return stmt.get(id) || null;
  }

  /**
   * Get all arcs with character details
   * @returns {array}
   */
  getAllWithCharacters() {
    const stmt = this.db.prepare(`
      SELECT
        ca.*,
        e.name as character_name,
        e.type as character_type
      FROM character_arcs ca
      JOIN entities e ON ca.character_id = e.id
      ORDER BY ca.updated_at DESC
    `);

    return stmt.all();
  }
}

module.exports = CharacterArcs;
