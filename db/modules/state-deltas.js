// State Deltas Module
// Manages state deltas for incremental updates

const { v4: uuid } = require('uuid');

function createDelta(db, assetId, eventId, previousEventId, deltaData, createdAt) {
  const deltaId = uuid();
  const timestamp = createdAt || Date.now();

  db.prepare(`
    INSERT INTO asset_state_deltas
    (id, asset_id, event_id, previous_event_id, delta_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(deltaId, assetId, eventId, previousEventId, JSON.stringify(deltaData), timestamp);

  return {
    id: deltaId,
    assetId,
    eventId,
    previousEventId,
    delta: deltaData,
    createdAt: timestamp
  };
}

function computeDelta(previousState, currentState) {
  // Simple delta computation: return changed fields
  const delta = {};

  for (const key in currentState) {
    if (previousState[key] !== currentState[key]) {
      delta[key] = currentState[key];
    }
  }

  return delta;
}

function applyDelta(state, delta) {
  // Apply delta to state
  return {
    ...state,
    ...delta
  };
}

function getDeltaChain(db, assetId, startEventId, endEventId) {
  // Get all deltas between two timestamps
  // startEventId and endEventId are treated as timestamps for ordering
  const deltas = db.prepare(`
    SELECT id, asset_id, event_id, previous_event_id, delta_json, created_at
    FROM asset_state_deltas
    WHERE asset_id = ?
    ORDER BY created_at ASC
  `).all(assetId);

  // Filter by created_at timestamp (treat eventId strings as timestamps)
  const startTime = parseInt(startEventId) || 0;
  const endTime = parseInt(endEventId) || Number.MAX_SAFE_INTEGER;

  return deltas
    .filter(delta => delta.created_at >= startTime && delta.created_at <= endTime)
    .map(delta => ({
      id: delta.id,
      assetId: delta.asset_id,
      eventId: delta.event_id,
      previousEventId: delta.previous_event_id,
      delta: JSON.parse(delta.delta_json),
      createdAt: delta.created_at
    }));
}

module.exports = {
  createDelta,
  computeDelta,
  applyDelta,
  getDeltaChain
};
