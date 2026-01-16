// Unit tests for state reconstruction module
// Tests snapshot creation, delta application, and performance

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');

const stateSnapshots = require('../../../db/modules/state-snapshots');
const stateDeltas = require('../../../db/modules/state-deltas');
const stateReconstruction = require('../../../db/modules/state-reconstruction');

// Test database path
const testDbPath = path.join(__dirname, 'test.db');

// Setup and teardown
beforeAll(() => {
  // Remove test database if it exists
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // Create test database and schema
  const db = new Database(testDbPath);
  db.pragma('foreign_keys = ON');

  // Create required tables
  db.exec(`
    CREATE TABLE asset_state_snapshots (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      state_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE asset_state_deltas (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      previous_event_id TEXT,
      delta_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX idx_snapshots_asset ON asset_state_snapshots(asset_id);
    CREATE INDEX idx_deltas_asset ON asset_state_deltas(asset_id);
  `);

  db.close();
});

afterAll(() => {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

describe('State Reconstruction', () => {
  let db;

  beforeEach(() => {
    db = new Database(testDbPath);
    db.pragma('foreign_keys = ON');
  });

  afterEach(() => {
    db.close();
    stateReconstruction.clearCache();
  });

  test('createSnapshot stores snapshot correctly', () => {
    const assetId = uuid();
    const eventId = uuid();
    const stateData = { name: 'Test', value: 42 };

    const snapshot = stateSnapshots.createSnapshot(db, assetId, eventId, stateData);

    expect(snapshot.assetId).toBe(assetId);
    expect(snapshot.eventId).toBe(eventId);
    expect(snapshot.state).toEqual(stateData);
  });

  test('getNearestSnapshot retrieves snapshot', () => {
    const assetId = uuid();
    const eventId = uuid();
    const stateData = { name: 'Test', value: 42 };

    stateSnapshots.createSnapshot(db, assetId, eventId, stateData);
    const retrieved = stateSnapshots.getNearestSnapshot(db, assetId, eventId);

    expect(retrieved).not.toBeNull();
    expect(retrieved.assetId).toBe(assetId);
    expect(retrieved.state).toEqual(stateData);
  });

  test('computeDelta calculates state differences', () => {
    const previousState = { name: 'Old', value: 10 };
    const currentState = { name: 'New', value: 10 };

    const delta = stateDeltas.computeDelta(previousState, currentState);

    expect(delta).toEqual({ name: 'New' });
  });

  test('applyDelta updates state correctly', () => {
    const state = { name: 'Old', value: 10 };
    const delta = { name: 'New' };

    const updated = stateDeltas.applyDelta(state, delta);

    expect(updated).toEqual({ name: 'New', value: 10 });
  });

  test('createDelta stores delta correctly', () => {
    const assetId = uuid();
    const eventId = uuid();
    const previousEventId = uuid();
    const deltaData = { name: 'New' };

    const delta = stateDeltas.createDelta(db, assetId, eventId, previousEventId, deltaData);

    expect(delta.assetId).toBe(assetId);
    expect(delta.delta).toEqual(deltaData);
  });

  test('reconstructStateAt returns correct state', () => {
    const assetId = uuid();

    // Create initial snapshot with controlled timestamp
    const initialState = { name: 'Initial', count: 0 };
    const snapshotEventId = 'event-1';
    const snapshotTime = 1000;
    stateSnapshots.createSnapshot(db, assetId, snapshotEventId, initialState, snapshotTime);

    // Create delta with later timestamp
    const deltaEventId = 'event-2';
    const deltaTime = 2000;
    const deltaData = { count: 5 };
    stateDeltas.createDelta(db, assetId, deltaEventId, snapshotEventId, deltaData, deltaTime);

    // Reconstruct at delta event - pass target time beyond delta
    const reconstructed = stateReconstruction.reconstructStateAt(db, assetId, '3000');

    expect(reconstructed).toEqual({ name: 'Initial', count: 5 });
  });

  test('performance: state reconstruction under 100ms for 100 deltas', () => {
    const assetId = uuid();
    const initialState = { value: 0 };
    const snapshotEventId = 'snapshot';

    // Create initial snapshot with timestamp 1000
    stateSnapshots.createSnapshot(db, assetId, snapshotEventId, initialState, 1000);

    // Create 100 deltas with incrementing timestamps
    for (let i = 1; i <= 100; i++) {
      const newEventId = `event-${i}`;
      const timestamp = 1000 + i;
      stateDeltas.createDelta(db, assetId, newEventId, snapshotEventId, { value: i }, timestamp);
    }

    // Measure reconstruction time - reconstruct at timestamp beyond all deltas
    const targetTimeStr = '2000'; // Beyond all deltas (which end at 1100)

    const startTime = Date.now();
    const state = stateReconstruction.reconstructStateAt(db, assetId, targetTimeStr);
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(state.value).toBe(100);
    expect(duration).toBeLessThan(100);
  });

  test('cache improves performance on repeated access', () => {
    const assetId = uuid();
    const initialState = { value: 0 };
    const eventId = uuid();

    stateSnapshots.createSnapshot(db, assetId, eventId, initialState);

    // First access (cache miss)
    const start1 = Date.now();
    stateReconstruction.reconstructStateAt(db, assetId, eventId);
    const time1 = Date.now() - start1;

    // Second access (cache hit)
    const start2 = Date.now();
    stateReconstruction.reconstructStateAt(db, assetId, eventId);
    const time2 = Date.now() - start2;

    // Cache hit should be faster or equal
    expect(time2).toBeLessThanOrEqual(time1);
  });
});
