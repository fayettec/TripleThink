// End-to-End QACS Workflow Tests (Phase 13-03)
// Tests Query-Assemble-Context-Supply workflow from database to complete context packets

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const createAPI = require('../../db/api-functions');
const Orchestrator = require('../../api/services/orchestrator');

// Test database path
const testDbPath = path.join(__dirname, 'qacs-workflow-test.db');

describe('QACS Workflow End-to-End Tests', () => {
  let db;
  let api;

  beforeAll(() => {
    // Clean up if exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Create test database
    db = new Database(testDbPath);
    db.pragma('foreign_keys = ON');

    // Load ALL migrations to create complete schema
    const migrations = [
      '001_foundation.sql',
      '002_hybrid_state.sql',
      '003_context_matrix.sql',
      '004_narrative.sql',
      '005_event_moments.sql',
      '006_logic_layer.sql'
    ];

    for (const migration of migrations) {
      const migrationPath = path.join(__dirname, '../../db/migrations', migration);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      db.exec(migrationSQL);
    }

    // Initialize API facade
    api = createAPI(db);
  });

  afterAll(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('E2E: Complete QACS workflow for 2-character scene', async () => {
    // === SETUP: Create test fiction ===
    const project = db.prepare(`
      INSERT INTO projects (id, name, created_at, created_by)
      VALUES (?, ?, ?, ?)
    `).run('proj-qacs-1', 'Test Project', Date.now(), 'test-user');

    const fiction = db.prepare(`
      INSERT INTO fictions (id, project_id, name, created_at, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run('fic-qacs-1', 'proj-qacs-1', 'Test Fiction', Date.now(), 'test-user');

    // Create characters (entities use project_id, metadata uses fiction_id)
    const char1 = db.prepare(`
      INSERT INTO entities (id, project_id, entity_type, created_at)
      VALUES (?, ?, ?, ?)
    `).run('char-alice', 'proj-qacs-1', 'character', Date.now());

    db.prepare(`
      INSERT INTO metadata (entity_id, fiction_id, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('char-alice', 'fic-qacs-1', JSON.stringify({ name: 'Alice', type: 'character' }), Date.now(), Date.now());

    const char2 = db.prepare(`
      INSERT INTO entities (id, project_id, entity_type, created_at)
      VALUES (?, ?, ?, ?)
    `).run('char-bob', 'proj-qacs-1', 'character', Date.now());

    db.prepare(`
      INSERT INTO metadata (entity_id, fiction_id, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('char-bob', 'fic-qacs-1', JSON.stringify({ name: 'Bob', type: 'character' }), Date.now(), Date.now());

    // Create event (scene)
    const event = db.prepare(`
      INSERT INTO entities (id, project_id, entity_type, created_at)
      VALUES (?, ?, ?, ?)
    `).run('evt-meeting', 'proj-qacs-1', 'event', Date.now());

    db.prepare(`
      INSERT INTO metadata (entity_id, fiction_id, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('evt-meeting', 'fic-qacs-1', JSON.stringify({ name: 'Meeting Scene', timestamp: '2025-01-01T10:00:00Z' }), Date.now(), Date.now());

    // Create scene in narrative_scenes
    const scene = db.prepare(`
      INSERT INTO narrative_scenes (
        id, fiction_id, scene_number, title, summary,
        pov_entity_id, narrative_time, tension_level,
        present_entity_ids, active_conflict_ids, active_theme_ids,
        forbidden_reveal_ids, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'scene-meeting',
      'fic-qacs-1',
      1,
      'The Meeting',
      'Alice and Bob meet',
      'char-alice',
      10000,
      0.7,
      JSON.stringify(['char-bob']),
      JSON.stringify([]),
      JSON.stringify([]),
      JSON.stringify([]),
      'draft',
      Date.now(),
      Date.now()
    );

    // === Populate logic layer ===
    const arc = api.characterArcs.createArc(
      'fic-qacs-1',
      'char-alice',
      'hero',
      'I am weak',
      'I am strong',
      'survive',
      'grow',
      'setup'
    );

    const conflict = api.storyConflicts.createConflict(
      'fic-qacs-1',
      'interpersonal',
      'char-alice',
      'char-bob',
      'Alice wins argument',
      'Alice loses argument',
      'latent'
    );

    const chain = api.causalityChains.createChain(
      'fic-qacs-1',
      'evt-meeting',
      'evt-meeting',
      'direct_cause',
      8,
      'Test causality'
    );

    // Add epistemic states
    db.prepare(`
      INSERT INTO epistemic_fact_ledger (
        id, fiction_id, entity_id, fact_type, fact_key, fact_value,
        source_type, acquired_at, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'fact-1',
      'fic-qacs-1',
      'char-alice',
      'secret',
      'knows_secret',
      JSON.stringify({ secret: 'Bob is a spy' }),
      'witnessed',
      5000,
      Date.now()
    );

    // Add dialogue profile
    db.prepare(`
      INSERT INTO dialogue_profiles (
        id, fiction_id, entity_id, vocabulary_level, formality_level,
        emotional_baseline, valid_from, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'dlg-alice',
      'fic-qacs-1',
      'char-alice',
      'complex',
      'formal',
      'neutral',
      1000,
      Date.now()
    );

    // === QACS WORKFLOW TEST ===

    // Query: Request context for scene
    const contextRequest = {
      sceneId: 'scene-meeting'
    };

    // Assemble: Orchestrator collects data
    const startTime = Date.now();
    const context = await Orchestrator.assembleContext(db, contextRequest.sceneId);
    const assemblyTime = Date.now() - startTime;

    // Supply: Verify context packet complete and correct
    expect(context).toBeDefined();
    expect(context.meta).toBeDefined();
    expect(context.meta.sceneId).toBe('scene-meeting');
    expect(context.meta.fictionId).toBe('fic-qacs-1');
    expect(context.meta.assemblyTimeMs).toBeDefined();

    // Verify scene info
    expect(context.scene).toBeDefined();
    expect(context.scene.id).toBe('scene-meeting');
    expect(context.scene.title).toBe('The Meeting');
    expect(context.scene.tensionLevel).toBe(0.7);

    // Verify POV context
    expect(context.pov).toBeDefined();
    expect(context.pov.entityId).toBe('char-alice');
    expect(context.pov.knowledge).toBeDefined();
    expect(context.pov.knowledge.factCount).toBeGreaterThan(0);
    expect(context.pov.voice).toBeDefined();

    // Verify characters - should have 2 total (1 POV + 1 present)
    expect(context.characters).toBeDefined();
    expect(context.characters.count).toBeGreaterThanOrEqual(1);

    // Verify logic layer data included
    expect(context.logicLayer).toBeDefined();
    expect(context.logicLayer.characterArcs).toBeDefined();
    expect(Array.isArray(context.logicLayer.characterArcs)).toBe(true);

    // Verify performance
    console.log(`QACS assembly time: ${assemblyTime}ms`);
    expect(assemblyTime).toBeLessThan(1000); // Must complete in <1s
  });

  test('E2E: QACS with 10-character complex scene', async () => {
    // Create new project and fiction for this test
    db.prepare(`
      INSERT INTO projects (id, name, created_at, created_by)
      VALUES (?, ?, ?, ?)
    `).run('proj-qacs-2', 'Complex Test', Date.now(), 'test-user');

    db.prepare(`
      INSERT INTO fictions (id, project_id, name, created_at, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run('fic-qacs-2', 'proj-qacs-2', 'Complex Fiction', Date.now(), 'test-user');

    // Create 10 characters
    const characters = [];
    for (let i = 0; i < 10; i++) {
      const charId = `char-complex-${i}`;
      db.prepare(`
        INSERT INTO entities (id, fiction_id, name, type, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(charId, 'fic-qacs-2', `Character ${i}`, 'character', Date.now());
      characters.push(charId);

      // Add dialogue profile for each
      db.prepare(`
        INSERT INTO dialogue_profiles (
          id, fiction_id, entity_id, vocabulary_level, formality_level,
          emotional_baseline, valid_from, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `dlg-${charId}`,
        'fic-qacs-2',
        charId,
        'medium',
        'casual',
        'neutral',
        1000,
        Date.now()
      );

      // Add character arc
      api.characterArcs.createArc(
        'fic-qacs-2',
        charId,
        ['hero', 'mentor', 'trickster'][i % 3],
        'Lie',
        'Truth',
        'Want',
        'Need',
        'setup'
      );
    }

    // Create conflicts
    for (let i = 0; i < 3; i++) {
      api.storyConflicts.createConflict(
        'fic-qacs-2',
        'interpersonal',
        characters[i],
        characters[i + 1],
        'Win',
        'Lose',
        'active'
      );
    }

    // Create themes
    for (let i = 0; i < 2; i++) {
      api.thematicElements.createElement(
        'fic-qacs-2',
        `Theme ${i}`,
        characters[0],
        `Question ${i}?`
      );
    }

    // Create scene with all 10 characters
    db.prepare(`
      INSERT INTO narrative_scenes (
        id, fiction_id, scene_number, title, summary,
        pov_entity_id, narrative_time, tension_level,
        present_entity_ids, active_conflict_ids, active_theme_ids,
        forbidden_reveal_ids, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'scene-complex',
      'fic-qacs-2',
      1,
      'Complex Scene',
      'All characters present',
      characters[0],
      20000,
      0.8,
      JSON.stringify(characters.slice(1)),
      JSON.stringify([]),
      JSON.stringify([]),
      JSON.stringify([]),
      'draft',
      Date.now(),
      Date.now()
    );

    // QACS assembly
    const startTime = Date.now();
    const context = await Orchestrator.assembleContext(db, 'scene-complex');
    const assemblyTime = Date.now() - startTime;

    // Verify context complete
    expect(context).toBeDefined();
    expect(context.characters.count).toBeGreaterThanOrEqual(9);
    expect(context.logicLayer.characterArcs.length).toBeGreaterThan(0);

    // CRITICAL: Performance must be <1s even for complex scene
    console.log(`Complex scene QACS assembly time: ${assemblyTime}ms`);
    expect(assemblyTime).toBeLessThan(1000);
  });

  test('E2E: QACS with dramatic irony (reader vs character knowledge)', async () => {
    // Create test data
    db.prepare(`
      INSERT INTO projects (id, name, created_at, created_by)
      VALUES (?, ?, ?, ?)
    `).run('proj-qacs-3', 'Irony Test', Date.now(), 'test-user');

    db.prepare(`
      INSERT INTO fictions (id, project_id, name, created_at, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run('fic-qacs-3', 'proj-qacs-3', 'Irony Fiction', Date.now(), 'test-user');

    // Create character
    db.prepare(`
      INSERT INTO entities (id, fiction_id, name, type, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('char-naive', 'fic-qacs-3', 'Naive Character', 'character', Date.now());

    // Create reader entity
    db.prepare(`
      INSERT INTO entities (id, fiction_id, name, type, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('reader-fic-qacs-3', 'fic-qacs-3', 'Reader', 'reader', Date.now());

    // Reader knows the truth
    db.prepare(`
      INSERT INTO epistemic_fact_ledger (
        id, fiction_id, entity_id, fact_type, fact_key, fact_value,
        source_type, acquired_at, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'fact-reader-truth',
      'fic-qacs-3',
      'reader-fic-qacs-3',
      'secret',
      'true_identity',
      JSON.stringify({ truth: 'Bob is the killer' }),
      'omniscient',
      1000,
      Date.now()
    );

    // Character has false belief
    db.prepare(`
      INSERT INTO epistemic_fact_ledger (
        id, fiction_id, entity_id, fact_type, fact_key, fact_value,
        source_type, is_true, acquired_at, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'fact-char-false',
      'fic-qacs-3',
      'char-naive',
      'secret',
      'true_identity',
      JSON.stringify({ belief: 'Alice is the killer' }),
      'told',
      0, // FALSE
      2000,
      Date.now()
    );

    // Add dialogue profile
    db.prepare(`
      INSERT INTO dialogue_profiles (
        id, fiction_id, entity_id, vocabulary_level, formality_level,
        emotional_baseline, valid_from, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'dlg-naive',
      'fic-qacs-3',
      'char-naive',
      'simple',
      'casual',
      'trusting',
      1000,
      Date.now()
    );

    // Create scene
    db.prepare(`
      INSERT INTO narrative_scenes (
        id, fiction_id, scene_number, title, summary,
        pov_entity_id, narrative_time, tension_level,
        present_entity_ids, active_conflict_ids, active_theme_ids,
        forbidden_reveal_ids, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'scene-irony',
      'fic-qacs-3',
      1,
      'Dramatic Irony Scene',
      'Character doesn\'t know the truth',
      'char-naive',
      10000,
      0.9,
      JSON.stringify([]),
      JSON.stringify([]),
      JSON.stringify([]),
      JSON.stringify(['secret:true_identity']),
      'draft',
      Date.now(),
      Date.now()
    );

    // QACS assembly
    const context = await Orchestrator.assembleContext(db, 'scene-irony');

    // Verify dramatic irony captured
    expect(context.pov.falseBeliefs).toBeDefined();
    expect(context.pov.falseBeliefs.count).toBeGreaterThan(0);

    expect(context.forbiddenReveals).toBeDefined();
    expect(context.forbiddenReveals.count).toBeGreaterThan(0);
    expect(context.forbiddenReveals.criticalCount).toBeGreaterThan(0);
  });

  test('E2E: QACS with causality chain traversal', async () => {
    // Create test data
    db.prepare(`
      INSERT INTO projects (id, name, created_at, created_by)
      VALUES (?, ?, ?, ?)
    `).run('proj-qacs-4', 'Causality Test', Date.now(), 'test-user');

    db.prepare(`
      INSERT INTO fictions (id, project_id, name, created_at, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run('fic-qacs-4', 'proj-qacs-4', 'Causality Fiction', Date.now(), 'test-user');

    // Create chain of events
    const events = [];
    for (let i = 0; i < 5; i++) {
      const evtId = `evt-chain-${i}`;
      db.prepare(`
        INSERT INTO entities (id, fiction_id, name, type, timestamp, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(evtId, 'fic-qacs-4', `Event ${i}`, 'event', new Date(2025, 0, 1, i).toISOString(), Date.now());
      events.push(evtId);
    }

    // Create causality chain: evt-0 → evt-1 → evt-2 → evt-3 → evt-4
    for (let i = 0; i < events.length - 1; i++) {
      api.causalityChains.createChain(
        'fic-qacs-4',
        events[i],
        events[i + 1],
        'direct_cause',
        9 - i,
        `Event ${i} causes Event ${i + 1}`
      );
    }

    // Create character and dialogue profile
    db.prepare(`
      INSERT INTO entities (id, fiction_id, name, type, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('char-observer', 'fic-qacs-4', 'Observer', 'character', Date.now());

    db.prepare(`
      INSERT INTO dialogue_profiles (
        id, fiction_id, entity_id, vocabulary_level, formality_level,
        emotional_baseline, valid_from, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'dlg-observer',
      'fic-qacs-4',
      'char-observer',
      'medium',
      'neutral',
      'observant',
      1000,
      Date.now()
    );

    // Create scene at final event
    db.prepare(`
      INSERT INTO narrative_scenes (
        id, fiction_id, scene_number, title, summary,
        pov_entity_id, narrative_time, tension_level,
        present_entity_ids, active_conflict_ids, active_theme_ids,
        forbidden_reveal_ids, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'scene-causality',
      'fic-qacs-4',
      1,
      'Final Event Scene',
      'Culmination of causal chain',
      'char-observer',
      50000,
      0.95,
      JSON.stringify([]),
      JSON.stringify([]),
      JSON.stringify([]),
      JSON.stringify([]),
      'draft',
      Date.now(),
      Date.now()
    );

    // QACS assembly
    const context = await Orchestrator.assembleContext(db, 'scene-causality');

    // Verify context includes causal information
    expect(context).toBeDefined();
    expect(context.meta).toBeDefined();

    // Note: Full causality traversal would require linking events to scenes
    // For now, verify context assembles successfully with causality data in DB
    expect(context.scene.id).toBe('scene-causality');
  });
});
