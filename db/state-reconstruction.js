/**
 * TripleThink State Reconstruction Engine
 * Rebuilds entity state by replaying deltas from nearest snapshot
 */

const StateSnapshots = require('./state-snapshots');
const StateDeltas = require('./state-deltas');

class StateReconstruction {
  constructor(db) {
    this.db = db;
    this.snapshots = new StateSnapshots(db);
    this.deltas = new StateDeltas(db);
    
    // Simple LRU Cache
    this.cache = new Map();
    this.CACHE_SIZE = 1000;
  }

  /**
   * Reconstruct entity state at a specific event
   * @param {string} timelineVersionId
   * @param {string} assetId
   * @param {string} targetEventId
   */
  reconstructState(timelineVersionId, assetId, targetEventId) {
    const cacheKey = `${timelineVersionId}:${assetId}:${targetEventId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // 1. Get Target Event Timestamp
    const eventStmt = this.db.prepare('SELECT timestamp FROM entities WHERE id = ?');
    const targetEvent = eventStmt.get(targetEventId);
    
    if (!targetEvent) {
      throw new Error(`Event not found: ${targetEventId}`);
    }

    const state = this._reconstruct(timelineVersionId, assetId, targetEventId, targetEvent.timestamp);
    
    // Cache result
    this._addToCache(cacheKey, state);
    return state;
  }

  /**
   * Internal reconstruction logic
   */
  _reconstruct(timelineVersionId, assetId, targetEventId, targetTimestamp) {
    // 2. Find nearest snapshot
    const snapshot = this.snapshots.findNearestPrior(timelineVersionId, assetId, targetEventId);
    
    let baseState = {};
    let snapshotTimestamp = '0000-00-00T00:00:00Z'; // Beginning of time

    if (snapshot) {
      baseState = snapshot.state;
      snapshotTimestamp = snapshot.anchor_timestamp;
      // console.log(`Found snapshot ${snapshot.id} at ${snapshotTimestamp}`);
    } else {
      // Fallback: Get static entity data as baseline? 
      // Or assume empty state.
      // For v4.1, let's assume empty and let deltas build it up, 
      // or the first event creates the initial state.
      // console.log('No snapshot found, starting from empty state');
    }

    // 3. Get Delta Chain
    // Events > snapshotTimestamp AND <= targetTimestamp
    const deltaChain = this.deltas.getChain(
      timelineVersionId, 
      assetId, 
      snapshotTimestamp, 
      targetTimestamp
    );

    // 4. Apply Deltas
    // console.log(`Applying ${deltaChain.length} deltas`);
    const finalState = StateDeltas.applyDeltas(baseState, deltaChain);

    return finalState;
  }

  /**
   * Cache management
   */
  _addToCache(key, value) {
    if (this.cache.size >= this.CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = StateReconstruction;
