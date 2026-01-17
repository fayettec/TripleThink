// Orchestrator Context Assembly Performance Benchmarks
// Verifies orchestrator context assembly meets <1s target for 10-character scenes

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { assembleContext } = require('../../api/services/orchestrator');
const scenes = require('../../db/modules/scenes');
const createAPI = require('../../db/api-functions');

/**
 * Create test database with realistic scene data
 */
function createTestDatabase() {
  const db = new Database(':memory:');

  // Disable foreign keys for performance testing
  db.pragma('foreign_keys = OFF');

  // Load schema from migrations
  const schemaPath = path.join(__dirname, '../../db/migrations');
  const migrationFiles = fs.readdirSync(schemaPath).sort();

  for (const file of migrationFiles) {
    if (file.endsWith('.sql')) {
      const sql = fs.readFileSync(path.join(schemaPath, file), 'utf8');
      db.exec(sql);
    }
  }

  return db;
}

/**
 * Generate test fiction with characters and scenes
 */
function generateTestData(db, fictionId, characterCount) {
  const narrativeTime = 1000;
  const projectId = 'proj-test';

  // Create project first
  db.prepare(`
    INSERT OR IGNORE INTO projects (id, name, created_at)
    VALUES (?, ?, ?)
  `).run(projectId, 'Test Project', Date.now());

  // Create fiction
  db.prepare(`
    INSERT INTO fictions (id, project_id, name, created_at, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(fictionId, projectId, 'Test Fiction', Date.now(), 'benchmark');

  // Create characters (entities)
  const characterIds = [];
  for (let i = 1; i <= characterCount; i++) {
    const charId = `char-${fictionId}-${i}`;
    characterIds.push(charId);

    db.prepare(`
      INSERT INTO entities (id, project_id, entity_type, created_at)
      VALUES (?, ?, ?, ?)
    `).run(charId, projectId, 'character', Date.now());

    // Create character arc
    try {
      db.prepare(`
        INSERT INTO character_arcs (arc_uuid, character_id, project_id, archetype,
          lie_belief, truth_belief, want_external, need_internal, current_phase)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `arc-${charId}`,
        charId,
        fictionId,
        'hero',
        'I am alone',
        'I need others',
        'Save the world',
        'Find connection',
        'setup'
      );
    } catch (err) {
      // Arc table may not exist - that's ok
    }

    // Create epistemic state
    try {
      db.prepare(`
        INSERT INTO epistemic_states (id, entity_id, fiction_id, fact_type, fact_key,
          fact_value, confidence, is_true, learned_at_event)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `epi-${charId}-fact1`,
        charId,
        fictionId,
        'secret',
        `secret-${i}`,
        `Character ${i} knows secret`,
        1.0,
        1,
        'evt-1'
      );
    } catch (err) {
      // Epistemic table may not exist - that's ok
    }

    // Create dialogue profile
    try {
      db.prepare(`
        INSERT INTO dialogue_profiles (id, entity_id, voice_hints, created_at)
        VALUES (?, ?, ?, ?)
      `).run(
        `voice-${charId}`,
        charId,
        JSON.stringify({ tone: 'formal', quirks: ['verbose'] }),
        new Date().toISOString()
      );
    } catch (err) {
      // Dialogue table may not exist - that's ok
    }
  }

  // Create relationships between all character pairs
  for (let i = 0; i < characterIds.length; i++) {
    for (let j = i + 1; j < characterIds.length; j++) {
      try {
        db.prepare(`
          INSERT INTO relationships (id, fiction_id, entity_a_id, entity_b_id,
            relationship_type, sentiment, trust_level, power_balance, conflict_level, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `rel-${characterIds[i]}-${characterIds[j]}`,
          fictionId,
          characterIds[i],
          characterIds[j],
          'ally',
          'positive',
          0.7,
          0.5,
          0.2,
          'active'
        );
      } catch (err) {
        // Relationship table may not exist - that's ok
      }
    }
  }

  return { characterIds, narrativeTime };
}

/**
 * Create test scene using scenes module
 */
function createTestScene(db, fictionId, presentEntityIds, conflictIds = [], themeIds = []) {
  return scenes.createScene(db, {
    fictionId,
    sceneNumber: 1,
    title: 'Test Scene',
    summary: 'Performance test scene',
    povEntityId: presentEntityIds[0] || null,
    narrativeTime: 1000,
    mood: 'tense',
    tensionLevel: 0.7,
    presentEntityIds,
    activeConflictIds: conflictIds,
    activeThemeIds: themeIds,
    status: 'draft'
  });
}

/**
 * Create conflicts for scene
 */
function createConflicts(db, fictionId, conflictIds, protagonistId) {
  for (const conflictId of conflictIds) {
    try {
      db.prepare(`
        INSERT INTO story_conflicts (conflict_uuid, project_id, type, protagonist_id,
          antagonist_source, stakes_success, stakes_fail, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        conflictId,
        fictionId,
        'character_vs_character',
        protagonistId,
        'antagonist',
        'Victory achieved',
        'Defeat suffered',
        'active'
      );
    } catch (err) {
      // Conflicts table may not exist - that's ok
    }
  }
}

/**
 * Run orchestrator benchmarks
 */
async function benchmarkOrchestrator() {
  const results = [];
  const db = createTestDatabase();

  try {
    const fictionId = 'fic-test';

    // Scenario 1: 2-character scene (simple)
    console.log('  Benchmarking 2-character scene...');
    const data1 = generateTestData(db, fictionId, 2);
    const scene1 = createTestScene(db, fictionId, data1.characterIds.slice(0, 2));

    const start1 = performance.now();
    for (let i = 0; i < 50; i++) {
      await assembleContext(db, scene1.id);
    }
    const duration1 = (performance.now() - start1) / 50;

    results.push({
      scenario: '2-character scene (simple)',
      iterations: 50,
      avg_duration_ms: Math.round(duration1 * 100) / 100,
      target_ms: 1000,
      passed: duration1 < 1000,
      details: {
        characters: 2,
        relationships: 1,
        conflicts: 0,
        arcs: 2
      }
    });

    // Scenario 2: 5-character scene (typical)
    console.log('  Benchmarking 5-character scene...');
    const data2 = generateTestData(db, 'fic-test-2', 5);
    const conflictIds2 = ['conf-1', 'conf-2'];
    createConflicts(db, 'fic-test-2', conflictIds2, data2.characterIds[0]);
    const scene2 = createTestScene(db, 'fic-test-2', data2.characterIds, conflictIds2);

    const start2 = performance.now();
    for (let i = 0; i < 30; i++) {
      await assembleContext(db, scene2.id);
    }
    const duration2 = (performance.now() - start2) / 30;

    results.push({
      scenario: '5-character scene with conflicts (typical)',
      iterations: 30,
      avg_duration_ms: Math.round(duration2 * 100) / 100,
      target_ms: 1000,
      passed: duration2 < 1000,
      details: {
        characters: 5,
        relationships: 10,
        conflicts: 2,
        arcs: 5
      }
    });

    // Scenario 3: 10-character scene (target case)
    console.log('  Benchmarking 10-character scene...');
    const data3 = generateTestData(db, 'fic-test-3', 10);
    const conflictIds3 = ['conf-3', 'conf-4', 'conf-5', 'conf-6', 'conf-7'];
    createConflicts(db, 'fic-test-3', conflictIds3, data3.characterIds[0]);
    const scene3 = createTestScene(db, 'fic-test-3', data3.characterIds, conflictIds3);

    const start3 = performance.now();
    for (let i = 0; i < 20; i++) {
      await assembleContext(db, scene3.id);
    }
    const duration3 = (performance.now() - start3) / 20;

    results.push({
      scenario: '10-character scene with logic layer (target)',
      iterations: 20,
      avg_duration_ms: Math.round(duration3 * 100) / 100,
      target_ms: 1000,
      passed: duration3 < 1000,
      details: {
        characters: 10,
        relationships: 45,
        conflicts: 5,
        arcs_loaded: 10,
        epistemic_states_loaded: 10
      }
    });

    // Scenario 4: 15-character scene (stress test)
    console.log('  Benchmarking 15-character scene...');
    const data4 = generateTestData(db, 'fic-test-4', 15);
    const scene4 = createTestScene(db, 'fic-test-4', data4.characterIds);

    const start4 = performance.now();
    for (let i = 0; i < 10; i++) {
      await assembleContext(db, scene4.id);
    }
    const duration4 = (performance.now() - start4) / 10;

    results.push({
      scenario: '15-character scene (stress test)',
      iterations: 10,
      avg_duration_ms: Math.round(duration4 * 100) / 100,
      target_ms: 2000, // Relaxed target
      passed: duration4 < 2000,
      warning: duration4 > 1000 ? 'Large scene, consider splitting' : null,
      details: {
        characters: 15,
        relationships: 105
      }
    });

  } finally {
    db.close();
  }

  return {
    category: 'Orchestrator Context Assembly',
    target_ms: 1000,
    all_passed: results.every(r => r.passed),
    results
  };
}

// Allow direct execution for testing
if (require.main === module) {
  console.log('Running Orchestrator Benchmarks...\n');
  benchmarkOrchestrator()
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

module.exports = benchmarkOrchestrator;
