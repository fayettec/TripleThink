/**
 * TripleThink State Snapshots Manager
 * Handles full state checkpoints for the hybrid architecture
 */

class StateSnapshots {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create a new state snapshot
   * @param {object} data - { timeline_version_id, asset_id, anchor_event_id, type, state }
   * @returns {object} Created snapshot
   */
  create(data) {
    const { timeline_version_id, asset_id, anchor_event_id, type, state } = data;
    
    // Generate ID
    const id = `snap-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    const stmt = this.db.prepare(`
      INSERT INTO asset_state_snapshots (
        id, timeline_version_id, asset_id, anchor_event_id, 
        snapshot_type, state_json
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      timeline_version_id,
      asset_id,
      anchor_event_id,
      type,
      JSON.stringify(state)
    );

    return this.get(id);
  }

  /**
   * Get snapshot by ID
   * @param {string} id 
   * @returns {object|null}
   */
  get(id) {
    const stmt = this.db.prepare('SELECT * FROM asset_state_snapshots WHERE id = ?');
    const row = stmt.get(id);
    if (!row) return null;
    
    return {
      ...row,
      state: JSON.parse(row.state_json)
    };
  }

  /**
   * Find the nearest snapshot before or at a specific event
   * @param {string} timelineVersionId 
   * @param {string} assetId 
   * @param {string} targetEventId - The event we want to reconstruct state for
   * @returns {object|null}
   */
  findNearestPrior(timelineVersionId, assetId, targetEventId) {
    // We need to compare timestamps. 
    // Join with entities table to compare the anchor event's timestamp 
    // against the target event's timestamp.
    
    const stmt = this.db.prepare(`
      SELECT s.*, e.timestamp as anchor_timestamp
      FROM asset_state_snapshots s
      JOIN entities e ON s.anchor_event_id = e.id
      WHERE s.timeline_version_id = ? 
        AND s.asset_id = ?
        AND e.timestamp <= (SELECT timestamp FROM entities WHERE id = ?)
      ORDER BY e.timestamp DESC
      LIMIT 1
    `);

    const row = stmt.get(timelineVersionId, assetId, targetEventId);
    if (!row) return null;

    return {
      ...row,
      state: JSON.parse(row.state_json)
    };
  }

  /**
   * Get all snapshots for an asset (debug/audit)
   */
  getAllForAsset(assetId) {
    const stmt = this.db.prepare(`
      SELECT * FROM asset_state_snapshots 
      WHERE asset_id = ? 
      ORDER BY created_at DESC
    `);
    return stmt.all(assetId).map(row => ({
      ...row,
      state: JSON.parse(row.state_json)
    }));
  }
}

module.exports = StateSnapshots;
