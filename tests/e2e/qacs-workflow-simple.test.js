// Simplified E2E QACS Workflow Tests (Phase 13-03)
// Tests core Query-Assemble-Context-Supply workflow
// Note: Comprehensive E2E tests exist in tests/integration/orchestrator.test.js

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { assembleContext } = require('../../api/services/orchestrator');
const scenes = require('../../db/modules/scenes');

const testDbPath = path.join(__dirname, 'qacs-simple-test.db');

describe('QACS Workflow Simple E2E Tests', () => {
  let db;

  beforeAll(() => {
    // Clean up if exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Create test database
    db = new Database(testDbPath);
    db.pragma('foreign_keys = OFF'); // Simplified for testing

    // Load schema from migrations
    const schemaPath = path.join(__dirname, '../../db/migrations');
    const migrationFiles = fs.readdirSync(schemaPath).sort();

    for (const file of migrationFiles) {
      if (file.endsWith('.sql')) {
        const sql = fs.readFileSync(path.join(schemaPath, file), 'utf8');
        db.exec(sql);
      }
    }
  });

  afterAll(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('E2E: QACS workflow assembles context in <1s', async () => {
    const projectId = 'proj-qacs-simple';
    const fictionId = 'fic-qacs-simple';

    // Create minimal test data
    db.prepare(`
      INSERT INTO projects (id, name, created_at, created_by)
      VALUES (?, ?, ?, ?)
    `).run(projectId, 'QACS Test Project', Date.now(), 'test');

    db.prepare(`
      INSERT INTO fictions (id, project_id, name, created_at, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(fictionId, projectId, 'QACS Test Fiction', Date.now(), 'test');

    // Create characters
    const char1 = 'char-qacs-1';
    const char2 = 'char-qacs-2';

    db.prepare(`
      INSERT INTO entities (id, project_id, entity_type, created_at)
      VALUES (?, ?, ?, ?)
    `).run(char1, projectId, 'character', Date.now());

    db.prepare(`
      INSERT INTO entities (id, project_id, entity_type, created_at)
      VALUES (?, ?, ?, ?)
    `).run(char2, projectId, 'character', Date.now());

    // Create dialogue profiles
    try {
      db.prepare(`
        INSERT INTO dialogue_profiles (id, fiction_id, entity_id, vocabulary_level, formality_level, emotional_baseline, valid_from, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(`dlg-${char1}`, fictionId, char1, 'medium', 'casual', 'neutral', 1000, Date.now());

      db.prepare(`
        INSERT INTO dialogue_profiles (id, fiction_id, entity_id, vocabulary_level, formality_level, emotional_baseline, valid_from, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(`dlg-${char2}`, fictionId, char2, 'medium', 'casual', 'neutral', 1000, Date.now());
    } catch (err) {
      // Dialogue profiles table may not exist - ok for basic test
    }

    // Create epistemic fact
    try {
      db.prepare(`
        INSERT INTO epistemic_fact_ledger (id, fiction_id, entity_id, fact_type, fact_key, fact_value, source_type, acquired_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('fact-qacs-1', fictionId, char1, 'secret', 'test-secret', JSON.stringify({ value: 'secret data' }), 'witnessed', 5000, Date.now());
    } catch (err) {
      // Epistemic table may not exist - ok for basic test
    }

    // Create scene
    const scene = scenes.createScene(db, {
      fictionId,
      sceneNumber: 1,
      title: 'QACS Test Scene',
      summary: 'Testing QACS workflow',
      povEntityId: char1,
      locationId: 'loc-test',
      narrativeTime: 10000,
      tensionLevel: 0.5,
      presentEntityIds: [char2],
      activeConflictIds: [],
      activeThemeIds: [],
      forbiddenRevealIds: []
    });

    // === QACS WORKFLOW TEST ===
    const startTime = Date.now();
    const context = await assembleContext(db, scene.id);
    const assemblyTime = Date.now() - startTime;

    // Verify context assembled
    expect(context).toBeDefined();
    expect(context.meta).toBeDefined();
    expect(context.meta.sceneId).toBe(scene.id);
    expect(context.scene).toBeDefined();
    expect(context.scene.title).toBe('QACS Test Scene');

    // Verify POV context
    expect(context.pov).toBeDefined();
    expect(context.pov.entityId).toBe(char1);

    // Verify performance: <1s for simple scene
    console.log(`QACS assembly time: ${assemblyTime}ms`);
    expect(assemblyTime).toBeLessThan(1000);
  });

  test('E2E: QACS context includes required fields', async () => {
    const projectId = 'proj-qacs-fields';
    const fictionId = 'fic-qacs-fields';
    const povChar = 'char-pov';

    // Setup minimal data
    db.prepare(`INSERT INTO projects (id, name, created_at, created_by) VALUES (?, ?, ?, ?)`).run(projectId, 'Test', Date.now(), 'test');
    db.prepare(`INSERT INTO fictions (id, project_id, name, created_at, created_by) VALUES (?, ?, ?, ?, ?)`).run(fictionId, projectId, 'Test', Date.now(), 'test');
    db.prepare(`INSERT INTO entities (id, project_id, entity_type, created_at) VALUES (?, ?, ?, ?)`).run(povChar, projectId, 'character', Date.now());

    try {
      db.prepare(`INSERT INTO dialogue_profiles (id, fiction_id, entity_id, vocabulary_level, valid_from, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run(`dlg-${povChar}`, fictionId, povChar, 'medium', 1000, Date.now());
    } catch (err) { /* ok */ }

    const scene = scenes.createScene(db, {
      fictionId,
      sceneNumber: 1,
      title: 'Field Test',
      povEntityId: povChar,
      locationId: 'loc',
      narrativeTime: 1000,
      presentEntityIds: []
    });

    // Assemble context
    const context = await assembleContext(db, scene.id);

    // Verify ALL required fields exist
    const requiredFields = [
      'meta',
      'scene',
      'pov',
      'characters',
      'relationships',
      'conflicts',
      'themes',
      'logicLayer',
      'forbiddenReveals',
      'pacing',
      'previousScene'
    ];

    for (const field of requiredFields) {
      expect(context).toHaveProperty(field);
    }

    // Verify meta structure
    expect(context.meta.sceneId).toBe(scene.id);
    expect(context.meta.fictionId).toBe(fictionId);
    expect(context.meta.assemblyTimeMs).toBeDefined();
    expect(typeof context.meta.assemblyTimeMs).toBe('number');

    // Verify POV structure
    expect(context.pov.entityId).toBe(povChar);
    expect(context.pov.knowledge).toBeDefined();
    expect(context.pov.voice).toBeDefined();
  });
});
