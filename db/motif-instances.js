/**
 * TripleThink Motif Instances Manager
 * Tracks recurring patterns (visual, dialogue, situational)
 */

class MotifInstances {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create a new motif instance
   * @param {object} data - { project_id, motif_name, motif_type, event_id, description, variation_notes, thematic_element_id }
   * @returns {object} Created instance
   */
  create(data) {
    const {
      project_id,
      motif_name,
      motif_type,
      event_id,
      description,
      variation_notes,
      thematic_element_id
    } = data;

    // Generate ID
    const id = `motif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const stmt = this.db.prepare(`
      INSERT INTO motif_instances (
        id, project_id, motif_name, motif_type, event_id,
        description, variation_notes, thematic_element_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      project_id,
      motif_name,
      motif_type || null,
      event_id,
      description || null,
      variation_notes || null,
      thematic_element_id || null
    );

    return this.get(id);
  }

  /**
   * Get instance by ID
   * @param {string} id
   * @returns {object|null}
   */
  get(id) {
    const stmt = this.db.prepare('SELECT * FROM motif_instances WHERE id = ?');
    return stmt.get(id) || null;
  }

  /**
   * Update an instance
   * @param {string} id
   * @param {object} updates - Fields to update
   * @returns {object|null}
   */
  update(id, updates) {
    const allowedFields = [
      'motif_name',
      'motif_type',
      'description',
      'variation_notes',
      'thematic_element_id'
    ];

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
      UPDATE motif_instances
      SET ${setClause.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    return this.get(id);
  }

  /**
   * Delete an instance
   * @param {string} id
   * @returns {boolean}
   */
  delete(id) {
    const stmt = this.db.prepare('DELETE FROM motif_instances WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Get all instances by motif name
   * @param {string} projectId
   * @param {string} motifName
   * @returns {array}
   */
  getByMotifName(projectId, motifName) {
    const stmt = this.db.prepare(`
      SELECT * FROM motif_instances
      WHERE project_id = ? AND motif_name = ?
      ORDER BY created_at ASC
    `);

    return stmt.all(projectId, motifName);
  }

  /**
   * Get all instances for an event
   * @param {string} eventId
   * @returns {array}
   */
  getByEvent(eventId) {
    const stmt = this.db.prepare(`
      SELECT * FROM motif_instances
      WHERE event_id = ?
      ORDER BY motif_name
    `);

    return stmt.all(eventId);
  }

  /**
   * Get all instances by type
   * @param {string} projectId
   * @param {string} motifType
   * @returns {array}
   */
  getByType(projectId, motifType) {
    const stmt = this.db.prepare(`
      SELECT * FROM motif_instances
      WHERE project_id = ? AND motif_type = ?
      ORDER BY created_at DESC
    `);

    return stmt.all(projectId, motifType);
  }

  /**
   * Get all motif names in a project (unique list)
   * @param {string} projectId
   * @returns {array}
   */
  getAllMotifNames(projectId) {
    const stmt = this.db.prepare(`
      SELECT DISTINCT motif_name
      FROM motif_instances
      WHERE project_id = ?
      ORDER BY motif_name
    `);

    return stmt.all(projectId).map(row => row.motif_name);
  }

  /**
   * Get motif frequency (how many times each appears)
   * @param {string} projectId
   * @returns {array}
   */
  getMotifFrequency(projectId) {
    const stmt = this.db.prepare(`
      SELECT
        motif_name,
        motif_type,
        COUNT(*) as occurrence_count
      FROM motif_instances
      WHERE project_id = ?
      GROUP BY motif_name, motif_type
      ORDER BY occurrence_count DESC
    `);

    return stmt.all(projectId);
  }

  /**
   * Get instances linked to a theme
   * @param {string} thematicElementId
   * @returns {array}
   */
  getByTheme(thematicElementId) {
    const stmt = this.db.prepare(`
      SELECT * FROM motif_instances
      WHERE thematic_element_id = ?
      ORDER BY created_at ASC
    `);

    return stmt.all(thematicElementId);
  }

  /**
   * Get all instances for a project with full details
   * @param {string} projectId
   * @returns {array}
   */
  getAllWithDetails(projectId) {
    const stmt = this.db.prepare(`
      SELECT
        mi.*,
        e.name as event_name,
        e.timestamp as event_timestamp,
        te.statement as theme_statement
      FROM motif_instances mi
      JOIN entities e ON mi.event_id = e.id
      LEFT JOIN thematic_elements te ON mi.thematic_element_id = te.id
      WHERE mi.project_id = ?
      ORDER BY e.timestamp ASC
    `);

    return stmt.all(projectId);
  }
}

module.exports = MotifInstances;
