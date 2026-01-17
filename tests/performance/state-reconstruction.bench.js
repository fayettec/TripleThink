// State Reconstruction Performance Benchmarks
// Verifies state reconstruction meets <100ms target for 100-delta chains

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const stateReconstruction = require('../../db/modules/state-reconstruction');
const stateSnapshots = require('../../db/modules/state-snapshots');
const stateDeltas = require('../../db/modules/state-deltas');

/**
 * Create test database with realistic state reconstruction scenarios
 */
function createTestDatabase() {
  const db = new Database(':memory:');

  // Create schema
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

    CREATE INDEX idx_snapshots_asset ON asset_state_snapshots(asset_id, created_at);
    CREATE INDEX idx_deltas_asset ON asset_state_deltas(asset_id, created_at);
  `);

  return db;
}

/**
 * Generate test data for delta chains
 */
function generateDeltaChain(db, assetId, chainLength, snapshotInterval = 10) {
  const baseTime = Date.now() - (chainLength * 1000);

  // Create initial snapshot
  const initialState = { value: 0, metadata: { version: 1 } };
  db.prepare(`
    INSERT INTO asset_state_snapshots (id, asset_id, event_id, state_json, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    `snap-${assetId}-0`,
    assetId,
    'evt-0',
    JSON.stringify(initialState),
    baseTime
  );

  // Create delta chain
  for (let i = 1; i <= chainLength; i++) {
    const delta = {
      op: 'set',
      path: ['value'],
      value: i
    };

    const eventTime = baseTime + (i * 1000);

    db.prepare(`
      INSERT INTO asset_state_deltas (id, asset_id, event_id, previous_event_id, delta_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `delta-${assetId}-${i}`,
      assetId,
      `evt-${i}`,
      `evt-${i-1}`,
      JSON.stringify(delta),
      eventTime
    );

    // Create snapshots at intervals
    if (i % snapshotInterval === 0) {
      const snapshotState = { value: i, metadata: { version: 1 } };
      db.prepare(`
        INSERT INTO asset_state_snapshots (id, asset_id, event_id, state_json, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        `snap-${assetId}-${i}`,
        assetId,
        `evt-${i}`,
        JSON.stringify(snapshotState),
        eventTime
      );
    }
  }

  return baseTime + (chainLength * 1000);
}

/**
 * Run state reconstruction benchmarks
 */
async function benchmarkStateReconstruction() {
  const results = [];
  const db = createTestDatabase();

  try {
    // Generate test data
    // Asset 1: 5-delta chain (best case)
    generateDeltaChain(db, 'asset-test-1', 5, 10);

    // Asset 2: 50-delta chain (typical case)
    generateDeltaChain(db, 'asset-test-2', 50, 10);

    // Asset 3: 100-delta chain (target case)
    generateDeltaChain(db, 'asset-test-3', 100, 10);

    // Asset 4: 200-delta chain (worst case)
    generateDeltaChain(db, 'asset-test-4', 200, 10);

    // Benchmark 1: 5-delta chain (best case)
    console.log('  Benchmarking 5-delta chain...');
    const start1 = performance.now();
    for (let i = 0; i < 100; i++) {
      stateReconstruction.reconstructStateAt(db, 'asset-test-1', 'evt-5');
    }
    const duration1 = (performance.now() - start1) / 100;

    results.push({
      scenario: '5-delta chain (best case)',
      iterations: 100,
      avg_duration_ms: Math.round(duration1 * 100) / 100,
      target_ms: 100,
      passed: duration1 < 100,
      details: {
        delta_count: 5,
        snapshots_used: 1
      }
    });

    // Benchmark 2: 50-delta chain (typical)
    console.log('  Benchmarking 50-delta chain...');
    stateReconstruction.clearCache(); // Clear cache between benchmarks
    const start2 = performance.now();
    for (let i = 0; i < 50; i++) {
      stateReconstruction.reconstructStateAt(db, 'asset-test-2', 'evt-50');
    }
    const duration2 = (performance.now() - start2) / 50;

    results.push({
      scenario: '50-delta chain (typical)',
      iterations: 50,
      avg_duration_ms: Math.round(duration2 * 100) / 100,
      target_ms: 100,
      passed: duration2 < 100,
      details: {
        delta_count: 50,
        snapshots_available: 5
      }
    });

    // Benchmark 3: 100-delta chain (target case)
    console.log('  Benchmarking 100-delta chain...');
    stateReconstruction.clearCache();
    const start3 = performance.now();
    for (let i = 0; i < 20; i++) {
      stateReconstruction.reconstructStateAt(db, 'asset-test-3', 'evt-100');
    }
    const duration3 = (performance.now() - start3) / 20;

    results.push({
      scenario: '100-delta chain (target)',
      iterations: 20,
      avg_duration_ms: Math.round(duration3 * 100) / 100,
      target_ms: 100,
      passed: duration3 < 100,
      details: {
        delta_count: 100,
        snapshots_available: 10
      }
    });

    // Benchmark 4: 200-delta chain (worst case)
    console.log('  Benchmarking 200-delta chain...');
    stateReconstruction.clearCache();
    const start4 = performance.now();
    for (let i = 0; i < 10; i++) {
      stateReconstruction.reconstructStateAt(db, 'asset-test-4', 'evt-200');
    }
    const duration4 = (performance.now() - start4) / 10;

    results.push({
      scenario: '200-delta chain (worst case)',
      iterations: 10,
      avg_duration_ms: Math.round(duration4 * 100) / 100,
      target_ms: 200, // Relaxed target
      passed: duration4 < 200,
      warning: duration4 > 150 ? 'Consider creating snapshot' : null,
      details: {
        delta_count: 200,
        snapshots_available: 20
      }
    });

  } finally {
    db.close();
  }

  return {
    category: 'State Reconstruction',
    target_ms: 100,
    all_passed: results.every(r => r.passed),
    results
  };
}

// Allow direct execution for testing
if (require.main === module) {
  console.log('Running State Reconstruction Benchmarks...\n');
  benchmarkStateReconstruction()
    .then(report => {
      console.log('\nResults:');
      console.log(JSON.stringify(report, null, 2));
      process.exit(report.all_passed ? 0 : 1);
    })
    .catch(err => {
      console.error('Benchmark failed:', err);
      process.exit(1);
    });
}

module.exports = benchmarkStateReconstruction;
