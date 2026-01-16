// State Snapshots Module
// Manages snapshot creation and retrieval for efficient state reconstruction

function createSnapshot(db, assetId, eventId, stateData, createdAtTime) {
  const snapshotId = require('uuid').v4();
  const createdAt = createdAtTime || Date.now();

  db.prepare(`
    INSERT INTO asset_state_snapshots
    (id, asset_id, event_id, state_json, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(snapshotId, assetId, eventId, JSON.stringify(stateData), createdAt);

  return {
    id: snapshotId,
    assetId,
    eventId,
    state: stateData,
    createdAt
  };
}

function getNearestSnapshot(db, assetId, eventId) {
  // Find the most recent snapshot at or before the given eventId
  const snapshot = db.prepare(`
    SELECT id, asset_id, event_id, state_json, created_at
    FROM asset_state_snapshots
    WHERE asset_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(assetId);

  if (!snapshot) {
    return null;
  }

  return {
    id: snapshot.id,
    assetId: snapshot.asset_id,
    eventId: snapshot.event_id,
    state: JSON.parse(snapshot.state_json),
    createdAt: snapshot.created_at
  };
}

function getSnapshotsForAsset(db, assetId) {
  const snapshots = db.prepare(`
    SELECT id, asset_id, event_id, state_json, created_at
    FROM asset_state_snapshots
    WHERE asset_id = ?
    ORDER BY created_at ASC
  `).all(assetId);

  return snapshots.map(snapshot => ({
    id: snapshot.id,
    assetId: snapshot.asset_id,
    eventId: snapshot.event_id,
    state: JSON.parse(snapshot.state_json),
    createdAt: snapshot.created_at
  }));
}

module.exports = {
  createSnapshot,
  getNearestSnapshot,
  getSnapshotsForAsset
};
