// State Reconstruction Module with LRU Cache
// Efficiently reconstructs asset state at any event point in time

const { LRUCache } = require('lru-cache');
const stateSnapshots = require('./state-snapshots');
const stateDeltas = require('./state-deltas');

// Initialize LRU cache for reconstructed states
const cache = new LRUCache({
  max: 1000,
  maxSize: 50 * 1024 * 1024, // 50MB max
  sizeCalculation: (entry) => JSON.stringify(entry).length,
  ttl: 1000 * 60 * 60 // 1 hour TTL
});

function getCacheKey(assetId, eventId) {
  return `${assetId}:${eventId}`;
}

function reconstructStateAt(db, assetId, targetEventId) {
  // Check cache first
  const cacheKey = getCacheKey(assetId, targetEventId);
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // Find nearest snapshot
  const snapshot = stateSnapshots.getNearestSnapshot(db, assetId, targetEventId);

  let state;
  let snapshotTime = 0;

  if (snapshot) {
    state = { ...snapshot.state };
    snapshotTime = snapshot.createdAt;
  } else {
    // No snapshot, start from empty state
    state = {};
  }

  // Get target event creation time (treat eventId as timestamp string)
  const targetTime = parseInt(targetEventId) || Number.MAX_SAFE_INTEGER;

  // Apply all deltas created after snapshot and before target event
  const allDeltas = db.prepare(`
    SELECT id, asset_id, event_id, previous_event_id, delta_json, created_at
    FROM asset_state_deltas
    WHERE asset_id = ?
    ORDER BY created_at ASC
  `).all(assetId);

  for (const deltaRow of allDeltas) {
    if (deltaRow.created_at > snapshotTime && deltaRow.created_at <= targetTime) {
      const delta = JSON.parse(deltaRow.delta_json);
      state = stateDeltas.applyDelta(state, delta);
    }
  }

  // Cache the result
  cache.set(cacheKey, state);

  return state;
}

function invalidateCache(assetId, eventId) {
  const cacheKey = getCacheKey(assetId, eventId);
  cache.delete(cacheKey);
}

function clearCache() {
  cache.clear();
}

function getCacheStats() {
  return {
    size: cache.size,
    itemCount: cache.size
  };
}

module.exports = {
  reconstructStateAt,
  invalidateCache,
  clearCache,
  getCacheStats
};
