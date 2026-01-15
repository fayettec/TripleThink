/**
 * TripleThink State Deltas Manager
 * Handles incremental state changes and diff/patch logic
 */

class StateDeltas {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create a new delta
   * @param {object} data - { timeline_version_id, asset_id, event_id, previous_snapshot_id, changes, change_category }
   * @returns {object} Created delta
   */
  create(data) {
    const { timeline_version_id, asset_id, event_id, previous_snapshot_id, changes, change_category, magnitude } = data;
    
    // Generate ID
    const id = `delta-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    const stmt = this.db.prepare(`
      INSERT INTO asset_state_deltas (
        id, timeline_version_id, asset_id, event_id, 
        previous_snapshot_id, changes_json, change_category, magnitude
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      timeline_version_id,
      asset_id,
      event_id,
      previous_snapshot_id,
      JSON.stringify(changes),
      change_category || 'mixed',
      magnitude || 1
    );

    return this.get(id);
  }

  /**
   * Get delta by ID
   */
  get(id) {
    const stmt = this.db.prepare('SELECT * FROM asset_state_deltas WHERE id = ?');
    const row = stmt.get(id);
    if (!row) return null;
    
    return {
      ...row,
      changes: JSON.parse(row.changes_json)
    };
  }

  /**
   * Get chain of deltas after a snapshot up to a target event
   * @param {string} timelineVersionId
   * @param {string} assetId
   * @param {string} snapshotAnchorEventId - timestamp of snapshot
   * @param {string} targetEventId - target event
   */
  getChain(timelineVersionId, assetId, snapshotAnchorTimestamp, targetEventTimestamp) {
    // We need events strictly AFTER the snapshot and <= target
    // We join entities to filter by timestamp
    
    const stmt = this.db.prepare(`
      SELECT d.*, e.timestamp as event_timestamp
      FROM asset_state_deltas d
      JOIN entities e ON d.event_id = e.id
      WHERE d.timeline_version_id = ? 
        AND d.asset_id = ?
        AND e.timestamp > ?
        AND e.timestamp <= ?
      ORDER BY e.timestamp ASC
    `);

    return stmt.all(timelineVersionId, assetId, snapshotAnchorTimestamp, targetEventTimestamp).map(row => ({
      ...row,
      changes: JSON.parse(row.changes_json)
    }));
  }

  /**
   * Static Utility: Compute deep diff between two objects
   * Returns keys in newState that are different from oldState
   */
  static computeDiff(oldState, newState) {
    const diff = {};
    let hasChanges = false;

    // Helper for recursion
    function compare(base, target, path = []) {
      // If target is primitive
      if (typeof target !== 'object' || target === null) {
        if (base !== target) {
          // Set value at path in diff
          setPath(diff, path, target);
          hasChanges = true;
        }
        return;
      }

      // If target is array
      if (Array.isArray(target)) {
        // For arrays, if they differ, we just replace the whole array for simplicity in v1
        // (Deep array diffing is complex and prone to errors with ordering)
        if (JSON.stringify(base) !== JSON.stringify(target)) {
          setPath(diff, path, target);
          hasChanges = true;
        }
        return;
      }

      // If target is object
      const allKeys = new Set([...Object.keys(base || {}), ...Object.keys(target)]);
      
      for (const key of allKeys) {
        const newPath = [...path, key];
        if (!(key in target)) {
          // Key removed - we explicitly set to null or undefined?
          // For now, let's ignore removals or set to null if meaningful
          // Skippy's spec focuses on 'what changed', implying additions/modifications.
          // If a key is gone, maybe we track that. 
          // Let's set to null to indicate removal.
          setPath(diff, newPath, null); 
          hasChanges = true;
        } else if (!(key in base)) {
          // Key added
          setPath(diff, newPath, target[key]);
          hasChanges = true;
        } else {
          // Key exists in both, recurse
          compare(base[key], target[key], newPath);
        }
      }
    }

    // Helper to set nested property
    function setPath(obj, path, value) {
      if (path.length === 0) return;
      
      let current = obj;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!current[key]) current[key] = {};
        current = current[key];
      }
      current[path[path.length - 1]] = value;
    }

    compare(oldState || {}, newState || {});
    return hasChanges ? diff : null;
  }

  /**
   * Static Utility: Apply diffs to base state
   */
  static applyDeltas(baseState, deltas) {
    // Deep clone base state to avoid mutation
    let currentState = JSON.parse(JSON.stringify(baseState));

    for (const delta of deltas) {
      const changes = delta.changes || delta; // Handle both wrapper and raw object
      StateDeltas.deepMerge(currentState, changes);
    }

    return currentState;
  }

  static deepMerge(target, source) {
    for (const key in source) {
      if (source[key] === null) {
        // Handle deletion if we use null for removal
        delete target[key];
      } else if (
        source[key] instanceof Object && 
        key in target && 
        target[key] instanceof Object &&
        !Array.isArray(source[key]) // Don't merge arrays, replace them
      ) {
        StateDeltas.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
}

module.exports = StateDeltas;
