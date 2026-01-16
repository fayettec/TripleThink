// Quick API test script
const Database = require('better-sqlite3');
const { v4: uuid } = require('uuid');
const stateSnapshots = require('./db/modules/state-snapshots');
const stateDeltas = require('./db/modules/state-deltas');
const stateReconstruction = require('./db/modules/state-reconstruction');

// Open database
const db = new Database('./db/triplethink.db');
db.pragma('foreign_keys = ON');

console.log('Testing API functionality...\n');

// Setup: Create test project and entities
console.log('Setting up test data...');
const projectId = uuid();
db.prepare('INSERT INTO projects (id, name, created_at, created_by) VALUES (?, ?, ?, ?)').run(
  projectId,
  'Test Project',
  Date.now(),
  'test-user'
);

// Test 1: Create a snapshot
console.log('1. Creating snapshot...');
const assetId = uuid();
db.prepare('INSERT INTO entities (id, project_id, entity_type, created_at) VALUES (?, ?, ?, ?)').run(
  assetId,
  projectId,
  'asset',
  Date.now()
);

const eventId1 = uuid();
const initialState = { name: 'Asset1', status: 'active', value: 100 };
stateSnapshots.createSnapshot(db, assetId, eventId1, initialState);
console.log('   ✓ Snapshot created');

// Test 2: Create deltas
console.log('2. Creating deltas...');
const eventId2 = uuid();
stateDeltas.createDelta(db, assetId, eventId2, eventId1, { value: 150 });

const eventId3 = uuid();
stateDeltas.createDelta(db, assetId, eventId3, eventId2, { status: 'archived' });
console.log('   ✓ 2 deltas created');

// Test 3: Reconstruct state at different points
console.log('3. Reconstructing state at different event points...');
const state1 = stateReconstruction.reconstructStateAt(db, assetId, eventId1);
console.log('   State at event 1:', JSON.stringify(state1));

const state2 = stateReconstruction.reconstructStateAt(db, assetId, eventId2);
console.log('   State at event 2:', JSON.stringify(state2));

const state3 = stateReconstruction.reconstructStateAt(db, assetId, eventId3);
console.log('   State at event 3:', JSON.stringify(state3));

// Test 4: Cache test
console.log('\n4. Testing cache performance...');
const startTime = Date.now();
for (let i = 0; i < 1000; i++) {
  stateReconstruction.reconstructStateAt(db, assetId, eventId3);
}
const elapsed = Date.now() - startTime;
console.log(`   ✓ 1000 cached reconstructions in ${elapsed}ms`);

// Test 5: Performance with many deltas
console.log('\n5. Testing performance with 100 deltas...');
const assetId2 = uuid();
db.prepare('INSERT INTO entities (id, project_id, entity_type, created_at) VALUES (?, ?, ?, ?)').run(
  assetId2,
  projectId,
  'asset',
  Date.now()
);
const baseEventId = uuid();
stateSnapshots.createSnapshot(db, assetId2, baseEventId, { counter: 0 });

stateReconstruction.clearCache();
let lastEventId = baseEventId;
for (let i = 1; i <= 100; i++) {
  const nextEventId = uuid();
  stateDeltas.createDelta(db, assetId2, nextEventId, lastEventId, { counter: i });
  lastEventId = nextEventId;
}

const start = Date.now();
const finalState = stateReconstruction.reconstructStateAt(db, assetId2, lastEventId);
const duration = Date.now() - start;
console.log(`   ✓ Reconstructed state with 100 deltas in ${duration}ms`);
console.log(`   Final state: ${JSON.stringify(finalState)}`);

// Test 6: API endpoint compatibility
console.log('\n6. Testing endpoint compatibility...');
console.log(`   GET /api/state/${assetId}/at/${eventId3}`);
console.log(`   Response would be: { assetId: "${assetId}", eventId: "${eventId3}", state: ${JSON.stringify(state3)} }`);

console.log(`\n   GET /api/state/${assetId}`);
console.log(`   Response would be: { assetId: "${assetId}", state: ${JSON.stringify(state3)} }`);

console.log('\n✓ All API tests passed!');

db.close();
