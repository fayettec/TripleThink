// Integration tests for Orchestrator (Phase 4)
// Tests context assembly for multi-character scenes and performance

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');

const scenes = require('../../db/modules/scenes');
const transitions = require('../../db/modules/transitions');
const pacing = require('../../db/modules/pacing');
const epistemic = require('../../db/modules/epistemic');
const relationships = require('../../db/modules/relationships');
const dialogue = require('../../db/modules/dialogue');
const orchestrator = require('../../api/services/orchestrator');

// Test database path
const testDbPath = path.join(__dirname, 'orchestrator-test.db');

// Setup test database with all required tables
beforeAll(() => {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  const db = new Database(testDbPath);
  db.pragma('foreign_keys = ON');

  // Create all required tables from migrations
  db.exec(`
    -- Foundation tables
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      created_by TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fictions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      created_by TEXT NOT NULL
    );

    -- Context Matrix tables
    CREATE TABLE IF NOT EXISTS epistemic_fact_ledger (
      id TEXT PRIMARY KEY,
      fiction_id TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      fact_type TEXT NOT NULL,
      fact_key TEXT NOT NULL,
      fact_value TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_entity_id TEXT,
      source_event_id TEXT,
      confidence REAL DEFAULT 1.0,
      is_true INTEGER DEFAULT 1,
      acquired_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS relationship_dynamics (
      id TEXT PRIMARY KEY,
      fiction_id TEXT NOT NULL,
      entity_a_id TEXT NOT NULL,
      entity_b_id TEXT NOT NULL,
      relationship_type TEXT NOT NULL,
      sentiment REAL DEFAULT 0.0,
      trust_level REAL DEFAULT 0.5,
      power_balance REAL DEFAULT 0.0,
      intimacy_level REAL DEFAULT 0.0,
      conflict_level REAL DEFAULT 0.0,
      status TEXT DEFAULT 'active',
      dynamics_json TEXT,
      cause_event_id TEXT,
      valid_from INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dialogue_profiles (
      id TEXT PRIMARY KEY,
      fiction_id TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      vocabulary_level TEXT DEFAULT 'medium',
      formality_level TEXT DEFAULT 'casual',
      speech_patterns TEXT,
      dialect TEXT,
      quirks TEXT,
      emotional_baseline TEXT DEFAULT 'neutral',
      topics_of_interest TEXT,
      topics_to_avoid TEXT,
      relationship_modifiers TEXT,
      context_modifiers TEXT,
      voice_hints TEXT,
      valid_from INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    -- Narrative tables
    CREATE TABLE IF NOT EXISTS narrative_scenes (
      id TEXT PRIMARY KEY,
      fiction_id TEXT NOT NULL,
      chapter_id TEXT,
      scene_number INTEGER NOT NULL,
      title TEXT,
      summary TEXT,
      pov_entity_id TEXT,
      location_id TEXT,
      narrative_time INTEGER NOT NULL,
      duration_minutes INTEGER,
      mood TEXT DEFAULT 'neutral',
      tension_level REAL DEFAULT 0.5,
      stakes TEXT,
      scene_goal TEXT,
      present_entity_ids TEXT,
      entering_entity_ids TEXT,
      exiting_entity_ids TEXT,
      active_conflict_ids TEXT,
      active_theme_ids TEXT,
      forbidden_reveal_ids TEXT,
      setup_payoff_ids TEXT,
      notes TEXT,
      status TEXT DEFAULT 'draft',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scene_transitions (
      id TEXT PRIMARY KEY,
      fiction_id TEXT NOT NULL,
      from_scene_id TEXT NOT NULL,
      to_scene_id TEXT NOT NULL,
      transition_type TEXT NOT NULL,
      time_gap_minutes INTEGER,
      location_change INTEGER DEFAULT 0,
      pov_change INTEGER DEFAULT 0,
      continuity_notes TEXT,
      carried_tensions TEXT,
      resolved_tensions TEXT,
      entity_state_changes TEXT,
      validation_status TEXT DEFAULT 'pending',
      validation_errors TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pacing_checkpoints (
      id TEXT PRIMARY KEY,
      fiction_id TEXT NOT NULL,
      scene_id TEXT,
      chapter_id TEXT,
      checkpoint_type TEXT NOT NULL,
      narrative_time INTEGER NOT NULL,
      tension_target REAL NOT NULL,
      actual_tension REAL,
      emotional_beat TEXT,
      stakes_escalation TEXT,
      character_growth_notes TEXT,
      audience_knowledge TEXT,
      dramatic_irony_level REAL DEFAULT 0.0,
      notes TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vent_moments (
      id TEXT PRIMARY KEY,
      fiction_id TEXT NOT NULL,
      scene_id TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      vent_type TEXT NOT NULL,
      trigger_event TEXT,
      emotional_peak REAL NOT NULL,
      tension_before REAL NOT NULL,
      tension_after REAL NOT NULL,
      duration_beats INTEGER,
      affected_entity_ids TEXT,
      relationship_impacts TEXT,
      revealed_facts TEXT,
      narrative_time INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    -- Indexes
    CREATE INDEX idx_epistemic_entity_time ON epistemic_fact_ledger(entity_id, acquired_at);
    CREATE INDEX idx_relationships_pair ON relationship_dynamics(entity_a_id, entity_b_id, valid_from);
    CREATE INDEX idx_dialogue_entity ON dialogue_profiles(entity_id);
    CREATE INDEX idx_scenes_fiction_time ON narrative_scenes(fiction_id, narrative_time);
    CREATE INDEX idx_transitions_to ON scene_transitions(to_scene_id);
    CREATE INDEX idx_pacing_fiction ON pacing_checkpoints(fiction_id);
    CREATE INDEX idx_vent_scene ON vent_moments(scene_id);
  `);

  db.close();
});

afterAll(() => {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

describe('Orchestrator Integration', () => {
  let db;
  const fictionId = 'fiction-test';
  const locationId = 'location-ballroom';

  beforeEach(() => {
    db = new Database(testDbPath);
    db.pragma('foreign_keys = ON');
    // Clean all tables
    db.exec('DELETE FROM narrative_scenes');
    db.exec('DELETE FROM scene_transitions');
    db.exec('DELETE FROM pacing_checkpoints');
    db.exec('DELETE FROM vent_moments');
    db.exec('DELETE FROM epistemic_fact_ledger');
    db.exec('DELETE FROM relationship_dynamics');
    db.exec('DELETE FROM dialogue_profiles');
  });

  afterEach(() => {
    db.close();
  });

  test('assembleContext returns valid context for 10-character scene', async () => {
    // Create 10 characters
    const characters = [];
    for (let i = 0; i < 10; i++) {
      characters.push(`char-${i}`);
    }

    const povCharacter = characters[0];
    const narrativeTime = 10000;

    // Create dialogue profiles for all characters
    for (const charId of characters) {
      dialogue.recordProfile(db, {
        fictionId,
        entityId: charId,
        vocabularyLevel: ['simple', 'medium', 'complex'][Math.floor(Math.random() * 3)],
        formalityLevel: ['casual', 'neutral', 'formal'][Math.floor(Math.random() * 3)],
        speechPatterns: [`pattern-${charId}`],
        emotionalBaseline: 'neutral',
        validFrom: 1000
      });
    }

    // Create knowledge for POV character
    epistemic.recordFact(db, {
      fictionId,
      entityId: povCharacter,
      factType: 'secret',
      factKey: 'hidden-agenda',
      factValue: { target: characters[5] },
      sourceType: 'witnessed',
      acquiredAt: 5000
    });

    epistemic.recordFact(db, {
      fictionId,
      entityId: povCharacter,
      factType: 'location',
      factKey: 'escape-route',
      factValue: 'through-kitchen',
      sourceType: 'told',
      isTrue: false, // False belief!
      acquiredAt: 6000
    });

    // Create relationships between some characters
    for (let i = 0; i < 5; i++) {
      relationships.recordRelationship(db, {
        fictionId,
        entityAId: characters[i],
        entityBId: characters[i + 1],
        relationshipType: i % 2 === 0 ? 'allies' : 'rivals',
        sentiment: i % 2 === 0 ? 0.7 : -0.3,
        trustLevel: i % 2 === 0 ? 0.8 : 0.2,
        conflictLevel: i % 2 === 0 ? 0.1 : 0.6,
        validFrom: 2000
      });
    }

    // Create the scene with 10 characters
    const scene = scenes.createScene(db, {
      fictionId,
      sceneNumber: 1,
      title: 'The Grand Ballroom Confrontation',
      summary: 'All major players gather for the climactic confrontation',
      povEntityId: povCharacter,
      locationId,
      narrativeTime,
      mood: 'tense',
      tensionLevel: 0.8,
      stakes: 'The fate of the kingdom',
      sceneGoal: 'Reveal the traitor',
      presentEntityIds: characters.slice(1), // All except POV (POV is separate)
      enteringEntityIds: [],
      exitingEntityIds: [],
      activeConflictIds: ['conflict-succession', 'conflict-romance'],
      activeThemeIds: ['theme-loyalty', 'theme-betrayal'],
      forbiddenRevealIds: ['secret:true-heir'],
      setupPayoffIds: []
    });

    // Create a pacing checkpoint
    pacing.createCheckpoint(db, {
      fictionId,
      sceneId: scene.id,
      checkpointType: 'climax',
      narrativeTime: narrativeTime,
      tensionTarget: 0.9,
      emotionalBeat: 'confrontation'
    });

    // Assemble context
    const context = await orchestrator.assembleContext(db, scene.id);

    // Validate context structure
    expect(context).toBeDefined();
    expect(context.meta).toBeDefined();
    expect(context.meta.sceneId).toBe(scene.id);
    expect(context.meta.assemblyTimeMs).toBeDefined();

    // Validate scene info
    expect(context.scene).toBeDefined();
    expect(context.scene.title).toBe('The Grand Ballroom Confrontation');
    expect(context.scene.tensionLevel).toBe(0.8);

    // Validate POV context
    expect(context.pov).toBeDefined();
    expect(context.pov.entityId).toBe(povCharacter);
    expect(context.pov.knowledge.factCount).toBe(2);
    expect(context.pov.falseBeliefs.count).toBe(1);
    expect(context.pov.voice).toBeDefined();

    // Validate characters - should have 10 total
    expect(context.characters).toBeDefined();
    expect(context.characters.count).toBe(10);
    expect(context.characters.present.length).toBe(10);

    // Validate relationships
    expect(context.relationships).toBeDefined();
    expect(context.relationships.pairCount).toBeGreaterThan(0);

    // Validate conflicts and themes
    expect(context.conflicts.activeIds).toContain('conflict-succession');
    expect(context.themes.activeIds).toContain('theme-loyalty');

    // Validate forbidden reveals
    expect(context.forbiddenReveals.count).toBe(1);
    expect(context.forbiddenReveals.facts[0].factKey).toBe('secret:true-heir');

    // Validate pacing
    expect(context.pacing).toBeDefined();
    expect(context.pacing.currentCheckpoint).toBeDefined();
    expect(context.pacing.currentCheckpoint.type).toBe('climax');
  });

  test('PERFORMANCE: context assembly completes in under 1 second for 10-character scene', async () => {
    // Create 10 characters with full data
    const characters = [];
    for (let i = 0; i < 10; i++) {
      characters.push(`perf-char-${i}`);
    }

    const povCharacter = characters[0];
    const narrativeTime = 10000;

    // Create comprehensive data for each character
    for (const charId of characters) {
      // Dialogue profile
      dialogue.recordProfile(db, {
        fictionId,
        entityId: charId,
        vocabularyLevel: 'medium',
        formalityLevel: 'casual',
        speechPatterns: ['pattern1', 'pattern2'],
        quirks: ['quirk1'],
        emotionalBaseline: 'neutral',
        relationshipModifiers: {},
        contextModifiers: {},
        validFrom: 1000
      });

      // Multiple facts per character
      for (let f = 0; f < 5; f++) {
        epistemic.recordFact(db, {
          fictionId,
          entityId: charId,
          factType: 'knowledge',
          factKey: `fact-${charId}-${f}`,
          factValue: { data: `value-${f}` },
          sourceType: 'learned',
          acquiredAt: 2000 + f * 100
        });
      }
    }

    // Create relationships between all character pairs (45 relationships for 10 chars)
    for (let i = 0; i < characters.length; i++) {
      for (let j = i + 1; j < characters.length; j++) {
        relationships.recordRelationship(db, {
          fictionId,
          entityAId: characters[i],
          entityBId: characters[j],
          relationshipType: 'acquaintance',
          sentiment: Math.random() * 2 - 1,
          trustLevel: Math.random(),
          validFrom: 3000
        });
      }
    }

    // Create scene
    const scene = scenes.createScene(db, {
      fictionId,
      sceneNumber: 1,
      title: 'Performance Test Scene',
      povEntityId: povCharacter,
      locationId,
      narrativeTime,
      tensionLevel: 0.5,
      presentEntityIds: characters.slice(1),
      activeConflictIds: ['c1', 'c2', 'c3'],
      activeThemeIds: ['t1', 't2'],
      forbiddenRevealIds: ['f1', 'f2', 'f3']
    });

    // Create previous scene and transition
    const prevScene = scenes.createScene(db, {
      fictionId,
      sceneNumber: 0,
      title: 'Previous Scene',
      povEntityId: povCharacter,
      locationId: 'other-location',
      narrativeTime: narrativeTime - 100,
      tensionLevel: 0.3,
      presentEntityIds: characters.slice(0, 5)
    });

    transitions.createTransition(db, {
      fictionId,
      fromSceneId: prevScene.id,
      toSceneId: scene.id,
      transitionType: 'cut',
      timeGapMinutes: 100,
      locationChange: true,
      povChange: false,
      carriedTensions: ['tension1']
    });

    // Create pacing checkpoints
    pacing.createCheckpoint(db, {
      fictionId,
      checkpointType: 'rising_action',
      narrativeTime: narrativeTime - 500,
      tensionTarget: 0.4
    });

    pacing.createCheckpoint(db, {
      fictionId,
      checkpointType: 'midpoint',
      narrativeTime: narrativeTime + 500,
      tensionTarget: 0.6
    });

    // RUN PERFORMANCE TEST - Multiple iterations for reliability
    const iterations = 5;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      const context = await orchestrator.assembleContext(db, scene.id);
      const endTime = Date.now();
      times.push(endTime - startTime);

      // Verify context is valid on first iteration
      if (i === 0) {
        expect(context.characters.count).toBe(10);
        expect(context.pov).toBeDefined();
        expect(context.relationships.pairCount).toBeGreaterThan(0);
      }
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);

    console.log(`Performance results: avg=${avgTime}ms, max=${maxTime}ms, all=${times.join(', ')}ms`);

    // CRITICAL ASSERTION: Must complete in under 1 second
    expect(maxTime).toBeLessThan(1000);
    expect(avgTime).toBeLessThan(500); // Average should be well under 1s
  });

  test('assembleContext includes all required context fields', async () => {
    const povCharacter = 'char-pov';
    const narrativeTime = 5000;

    // Setup minimal data
    dialogue.recordProfile(db, {
      fictionId,
      entityId: povCharacter,
      vocabularyLevel: 'complex',
      validFrom: 1000
    });

    const scene = scenes.createScene(db, {
      fictionId,
      sceneNumber: 1,
      title: 'Test Scene',
      povEntityId: povCharacter,
      locationId,
      narrativeTime,
      presentEntityIds: [],
      activeConflictIds: [],
      activeThemeIds: [],
      forbiddenRevealIds: []
    });

    const context = await orchestrator.assembleContext(db, scene.id);

    // Check all required top-level fields exist
    const requiredFields = [
      'meta',
      'scene',
      'pov',
      'characters',
      'relationships',
      'conflicts',
      'themes',
      'forbiddenReveals',
      'pacing',
      'previousScene'
    ];

    for (const field of requiredFields) {
      expect(context).toHaveProperty(field);
    }

    // Check meta fields
    expect(context.meta).toHaveProperty('sceneId');
    expect(context.meta).toHaveProperty('fictionId');
    expect(context.meta).toHaveProperty('narrativeTime');
    expect(context.meta).toHaveProperty('assemblyTimeMs');

    // Check POV fields
    expect(context.pov).toHaveProperty('entityId');
    expect(context.pov).toHaveProperty('knowledge');
    expect(context.pov).toHaveProperty('falseBeliefs');
    expect(context.pov).toHaveProperty('voice');
  });

  test('transitions and scenes work together correctly', async () => {
    const povCharacter = 'char-main';

    // Create two scenes
    const scene1 = scenes.createScene(db, {
      fictionId,
      sceneNumber: 1,
      title: 'Scene 1',
      povEntityId: povCharacter,
      locationId: 'loc-1',
      narrativeTime: 1000,
      presentEntityIds: ['char-a', 'char-b']
    });

    const scene2 = scenes.createScene(db, {
      fictionId,
      sceneNumber: 2,
      title: 'Scene 2',
      povEntityId: povCharacter,
      locationId: 'loc-2',
      narrativeTime: 2000,
      presentEntityIds: ['char-a', 'char-c']
    });

    // Create transition
    const transition = transitions.createTransition(db, {
      fictionId,
      fromSceneId: scene1.id,
      toSceneId: scene2.id,
      transitionType: 'cut',
      timeGapMinutes: 1000,
      locationChange: true,
      povChange: false
    });

    // Validate transition
    const validation = transitions.validateContinuity(db, transition.id);
    expect(validation.valid).toBe(true);

    // Get context for scene2 - should include previous scene info
    dialogue.recordProfile(db, {
      fictionId,
      entityId: povCharacter,
      validFrom: 500
    });

    const context = await orchestrator.assembleContext(db, scene2.id);

    expect(context.previousScene).toBeDefined();
    expect(context.previousScene.previousSceneId).toBe(scene1.id);
    expect(context.previousScene.transitionType).toBe('cut');
    expect(context.previousScene.locationChanged).toBe(true);
  });

  test('pacing checkpoints integrate with context', async () => {
    const povCharacter = 'char-hero';

    dialogue.recordProfile(db, {
      fictionId,
      entityId: povCharacter,
      validFrom: 500
    });

    const scene = scenes.createScene(db, {
      fictionId,
      sceneNumber: 5,
      title: 'Climax Scene',
      povEntityId: povCharacter,
      locationId,
      narrativeTime: 5000,
      tensionLevel: 0.9,
      presentEntityIds: []
    });

    // Create checkpoints around the scene
    pacing.createCheckpoint(db, {
      fictionId,
      checkpointType: 'rising_action',
      narrativeTime: 4000,
      tensionTarget: 0.7,
      emotionalBeat: 'anticipation'
    });

    pacing.createCheckpoint(db, {
      fictionId,
      sceneId: scene.id,
      checkpointType: 'climax',
      narrativeTime: 5000,
      tensionTarget: 0.95,
      emotionalBeat: 'confrontation'
    });

    pacing.createCheckpoint(db, {
      fictionId,
      checkpointType: 'resolution',
      narrativeTime: 6000,
      tensionTarget: 0.3,
      emotionalBeat: 'relief'
    });

    const context = await orchestrator.assembleContext(db, scene.id);

    expect(context.pacing.currentCheckpoint).toBeDefined();
    expect(context.pacing.currentCheckpoint.type).toBe('climax');
    expect(context.pacing.nextCheckpoint).toBeDefined();
    expect(context.pacing.nextCheckpoint.type).toBe('resolution');
  });
});

describe('Orchestrator Edge Cases', () => {
  let db;
  const fictionId = 'fiction-edge';

  beforeEach(() => {
    db = new Database(testDbPath);
    db.pragma('foreign_keys = ON');
    db.exec('DELETE FROM narrative_scenes');
    db.exec('DELETE FROM dialogue_profiles');
    db.exec('DELETE FROM epistemic_fact_ledger');
  });

  afterEach(() => {
    db.close();
  });

  test('handles scene with no POV character', async () => {
    const scene = scenes.createScene(db, {
      fictionId,
      sceneNumber: 1,
      title: 'Omniscient Scene',
      povEntityId: null, // No POV
      locationId: 'loc',
      narrativeTime: 1000,
      presentEntityIds: ['char-a', 'char-b']
    });

    const context = await orchestrator.assembleContext(db, scene.id);

    expect(context.pov).toBeNull();
    expect(context.characters.count).toBe(2);
  });

  test('handles scene with no present characters', async () => {
    const scene = scenes.createScene(db, {
      fictionId,
      sceneNumber: 1,
      title: 'Empty Scene',
      povEntityId: null,
      locationId: 'loc',
      narrativeTime: 1000,
      presentEntityIds: []
    });

    const context = await orchestrator.assembleContext(db, scene.id);

    expect(context.characters.count).toBe(0);
    expect(context.relationships.pairCount).toBe(0);
  });

  test('throws error for non-existent scene', async () => {
    await expect(orchestrator.assembleContext(db, 'non-existent-id'))
      .rejects.toThrow('Scene not found');
  });
});
