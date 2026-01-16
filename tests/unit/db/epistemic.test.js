// Unit tests for epistemic module (Context Matrix Phase 3)
// Tests knowledge tracking, relationship dynamics, and dialogue profiles

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');

const epistemic = require('../../../db/modules/epistemic');
const relationships = require('../../../db/modules/relationships');
const dialogue = require('../../../db/modules/dialogue');

// Test database path
const testDbPath = path.join(__dirname, 'epistemic-test.db');

// Setup and teardown
beforeAll(() => {
  // Remove test database if it exists
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // Create test database and schema
  const db = new Database(testDbPath);
  db.pragma('foreign_keys = ON');

  // Create required tables (from migration 003_context_matrix.sql)
  db.exec(`
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

    CREATE INDEX idx_epistemic_entity_time ON epistemic_fact_ledger(entity_id, acquired_at);
    CREATE INDEX idx_relationships_pair ON relationship_dynamics(entity_a_id, entity_b_id, valid_from);
    CREATE INDEX idx_dialogue_entity ON dialogue_profiles(entity_id);
  `);

  db.close();
});

afterAll(() => {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

describe('Epistemic Fact Ledger', () => {
  let db;
  const fictionId = 'fiction-1';
  const characterA = 'char-alice';
  const characterB = 'char-bob';

  beforeEach(() => {
    db = new Database(testDbPath);
    db.pragma('foreign_keys = ON');
    // Clean tables
    db.exec('DELETE FROM epistemic_fact_ledger');
  });

  afterEach(() => {
    db.close();
  });

  test('recordFact creates a new fact entry', () => {
    const fact = epistemic.recordFact(db, {
      fictionId,
      entityId: characterA,
      factType: 'location',
      factKey: 'secret-base',
      factValue: { place: 'underground bunker', coordinates: [40.7, -74.0] },
      sourceType: 'witnessed',
      acquiredAt: 1000
    });

    expect(fact.id).toBeDefined();
    expect(fact.entityId).toBe(characterA);
    expect(fact.factType).toBe('location');
    expect(fact.factValue.place).toBe('underground bunker');
  });

  test('queryKnowledgeAt returns facts acquired before timestamp', () => {
    // Alice learns fact at time 1000
    epistemic.recordFact(db, {
      fictionId,
      entityId: characterA,
      factType: 'secret',
      factKey: 'villain-identity',
      factValue: 'Dr. Evil',
      sourceType: 'told',
      acquiredAt: 1000
    });

    // Alice learns another fact at time 2000
    epistemic.recordFact(db, {
      fictionId,
      entityId: characterA,
      factType: 'location',
      factKey: 'hideout',
      factValue: 'volcano-lair',
      sourceType: 'deduced',
      acquiredAt: 2000
    });

    // Query at time 1500 - should only see first fact
    const knowledge1500 = epistemic.queryKnowledgeAt(db, characterA, 1500);
    expect(knowledge1500.length).toBe(1);
    expect(knowledge1500[0].factKey).toBe('villain-identity');

    // Query at time 2500 - should see both facts
    const knowledge2500 = epistemic.queryKnowledgeAt(db, characterA, 2500);
    expect(knowledge2500.length).toBe(2);
  });

  test('getDivergence identifies knowledge differences between entities', () => {
    // Both know the same fact
    epistemic.recordFact(db, {
      fictionId,
      entityId: characterA,
      factType: 'event',
      factKey: 'meeting-happened',
      factValue: true,
      sourceType: 'witnessed',
      acquiredAt: 1000
    });

    epistemic.recordFact(db, {
      fictionId,
      entityId: characterB,
      factType: 'event',
      factKey: 'meeting-happened',
      factValue: true,
      sourceType: 'witnessed',
      acquiredAt: 1000
    });

    // Only Alice knows this
    epistemic.recordFact(db, {
      fictionId,
      entityId: characterA,
      factType: 'secret',
      factKey: 'password',
      factValue: '12345',
      sourceType: 'read',
      acquiredAt: 1500
    });

    // Only Bob knows this
    epistemic.recordFact(db, {
      fictionId,
      entityId: characterB,
      factType: 'location',
      factKey: 'safe-location',
      factValue: 'behind-painting',
      sourceType: 'told',
      acquiredAt: 1500
    });

    const divergence = epistemic.getDivergence(db, characterA, characterB, 2000);

    expect(divergence.summary.sharedCount).toBe(1);
    expect(divergence.summary.onlyACount).toBe(1);
    expect(divergence.summary.onlyBCount).toBe(1);
    expect(divergence.onlyA[0].factKey).toBe('password');
    expect(divergence.onlyB[0].factKey).toBe('safe-location');
  });

  test('getFalseBeliefs returns incorrect beliefs for dramatic irony', () => {
    // Alice believes something false
    epistemic.recordFact(db, {
      fictionId,
      entityId: characterA,
      factType: 'identity',
      factKey: 'bob-loyalty',
      factValue: 'trustworthy',
      sourceType: 'assumed',
      isTrue: false, // This is actually false!
      acquiredAt: 1000
    });

    // Alice believes something true
    epistemic.recordFact(db, {
      fictionId,
      entityId: characterA,
      factType: 'location',
      factKey: 'home',
      factValue: '123 Main St',
      sourceType: 'known',
      isTrue: true,
      acquiredAt: 1000
    });

    const falseBeliefs = epistemic.getFalseBeliefs(db, characterA, 2000);

    expect(falseBeliefs.length).toBe(1);
    expect(falseBeliefs[0].factKey).toBe('bob-loyalty');
    expect(falseBeliefs[0].isTrue).toBe(false);
  });

  test('queryKnowledgeAt returns accurate knowledge states at any timestamp', () => {
    // Create timeline of knowledge acquisition
    const timestamps = [1000, 2000, 3000, 4000, 5000];

    timestamps.forEach((ts, i) => {
      epistemic.recordFact(db, {
        fictionId,
        entityId: characterA,
        factType: 'clue',
        factKey: `clue-${i + 1}`,
        factValue: { number: i + 1 },
        sourceType: 'found',
        acquiredAt: ts
      });
    });

    // Test knowledge at various points
    expect(epistemic.queryKnowledgeAt(db, characterA, 500).length).toBe(0);
    expect(epistemic.queryKnowledgeAt(db, characterA, 1500).length).toBe(1);
    expect(epistemic.queryKnowledgeAt(db, characterA, 2500).length).toBe(2);
    expect(epistemic.queryKnowledgeAt(db, characterA, 3500).length).toBe(3);
    expect(epistemic.queryKnowledgeAt(db, characterA, 4500).length).toBe(4);
    expect(epistemic.queryKnowledgeAt(db, characterA, 5500).length).toBe(5);
  });
});

describe('Relationship Dynamics', () => {
  let db;
  const fictionId = 'fiction-1';
  const characterA = 'char-alice';
  const characterB = 'char-bob';

  beforeEach(() => {
    db = new Database(testDbPath);
    db.pragma('foreign_keys = ON');
    db.exec('DELETE FROM relationship_dynamics');
  });

  afterEach(() => {
    db.close();
  });

  test('recordRelationship creates relationship entry', () => {
    const rel = relationships.recordRelationship(db, {
      fictionId,
      entityAId: characterA,
      entityBId: characterB,
      relationshipType: 'friendship',
      sentiment: 0.8,
      trustLevel: 0.9,
      validFrom: 1000
    });

    expect(rel.id).toBeDefined();
    expect(rel.relationshipType).toBe('friendship');
    expect(rel.sentiment).toBe(0.8);
  });

  test('getRelationshipAt returns correct state at timestamp', () => {
    // Initial friendship
    relationships.recordRelationship(db, {
      fictionId,
      entityAId: characterA,
      entityBId: characterB,
      relationshipType: 'friendship',
      sentiment: 0.8,
      trustLevel: 0.9,
      validFrom: 1000
    });

    // Relationship deteriorates
    relationships.recordRelationship(db, {
      fictionId,
      entityAId: characterA,
      entityBId: characterB,
      relationshipType: 'friendship',
      sentiment: 0.2,
      trustLevel: 0.3,
      conflictLevel: 0.7,
      validFrom: 2000
    });

    // Check at different times
    const early = relationships.getRelationshipAt(db, characterA, characterB, 1500);
    expect(early.sentiment).toBe(0.8);

    const later = relationships.getRelationshipAt(db, characterA, characterB, 2500);
    expect(later.sentiment).toBe(0.2);
    expect(later.conflictLevel).toBe(0.7);
  });

  test('findConflicts returns relationships above conflict threshold', () => {
    relationships.recordRelationship(db, {
      fictionId,
      entityAId: characterA,
      entityBId: characterB,
      relationshipType: 'rivalry',
      conflictLevel: 0.8,
      validFrom: 1000
    });

    relationships.recordRelationship(db, {
      fictionId,
      entityAId: characterA,
      entityBId: 'char-carol',
      relationshipType: 'friendship',
      conflictLevel: 0.1,
      validFrom: 1000
    });

    const conflicts = relationships.findConflicts(db, 0.5, 2000);

    expect(conflicts.length).toBe(1);
    expect(conflicts[0].conflictLevel).toBe(0.8);
  });

  test('getRelationshipDelta tracks changes over time', () => {
    relationships.recordRelationship(db, {
      fictionId,
      entityAId: characterA,
      entityBId: characterB,
      relationshipType: 'romantic',
      sentiment: 0.5,
      intimacyLevel: 0.3,
      validFrom: 1000
    });

    relationships.recordRelationship(db, {
      fictionId,
      entityAId: characterA,
      entityBId: characterB,
      relationshipType: 'romantic',
      sentiment: 0.9,
      intimacyLevel: 0.8,
      validFrom: 2000
    });

    const delta = relationships.getRelationshipDelta(db, characterA, characterB, 1500, 2500);

    expect(delta.changes.sentiment).toBeCloseTo(0.4);
    expect(delta.changes.intimacyLevel).toBeCloseTo(0.5);
  });
});

describe('Dialogue Profiles', () => {
  let db;
  const fictionId = 'fiction-1';
  const characterA = 'char-alice';

  beforeEach(() => {
    db = new Database(testDbPath);
    db.pragma('foreign_keys = ON');
    db.exec('DELETE FROM dialogue_profiles');
  });

  afterEach(() => {
    db.close();
  });

  test('recordProfile creates dialogue profile', () => {
    const profile = dialogue.recordProfile(db, {
      fictionId,
      entityId: characterA,
      vocabularyLevel: 'complex',
      formalityLevel: 'formal',
      speechPatterns: ['uses metaphors', 'speaks in questions'],
      dialect: 'British',
      quirks: ['clears throat', 'uses "indeed"'],
      emotionalBaseline: 'reserved',
      validFrom: 1000
    });

    expect(profile.id).toBeDefined();
    expect(profile.vocabularyLevel).toBe('complex');
    expect(profile.speechPatterns).toContain('uses metaphors');
  });

  test('getVoiceHints returns hints with modifiers applied', () => {
    dialogue.recordProfile(db, {
      fictionId,
      entityId: characterA,
      vocabularyLevel: 'medium',
      formalityLevel: 'casual',
      speechPatterns: ['uses slang'],
      emotionalBaseline: 'cheerful',
      relationshipModifiers: {
        'char-boss': {
          formalityLevel: 'formal',
          emotionalBaseline: 'nervous'
        }
      },
      contextModifiers: {
        'courtroom': {
          formalityLevel: 'very_formal',
          additionalPatterns: ['speaks precisely']
        }
      },
      validFrom: 1000
    });

    // Base hints
    const baseHints = dialogue.getVoiceHints(db, characterA, 2000);
    expect(baseHints.hints.formalityLevel).toBe('casual');
    expect(baseHints.hints.emotionalBaseline).toBe('cheerful');

    // With relationship modifier
    const withRelMod = dialogue.getVoiceHints(db, characterA, 2000, {
      targetEntityId: 'char-boss'
    });
    expect(withRelMod.hints.formalityLevel).toBe('formal');
    expect(withRelMod.hints.emotionalBaseline).toBe('nervous');

    // With context modifier
    const withCtxMod = dialogue.getVoiceHints(db, characterA, 2000, {
      context: 'courtroom'
    });
    expect(withCtxMod.hints.formalityLevel).toBe('very_formal');
    expect(withCtxMod.hints.speechPatterns).toContain('speaks precisely');
  });

  test('generateDialoguePrompt creates AI prompt string', () => {
    dialogue.recordProfile(db, {
      fictionId,
      entityId: characterA,
      vocabularyLevel: 'simple',
      formalityLevel: 'very_casual',
      speechPatterns: ['uses contractions', 'drops g'],
      dialect: 'Southern US',
      quirks: ['says "y\'all"'],
      emotionalBaseline: 'friendly',
      topicsOfInterest: ['cooking', 'family'],
      validFrom: 1000
    });

    const result = dialogue.generateDialoguePrompt(db, characterA, 2000);

    expect(result.prompt).toContain('simple');
    expect(result.prompt).toContain('very_casual');
    expect(result.prompt).toContain('Southern US');
    expect(result.prompt).toContain('friendly');
  });

  test('profile evolution over time', () => {
    // Initial profile - young character
    dialogue.recordProfile(db, {
      fictionId,
      entityId: characterA,
      vocabularyLevel: 'simple',
      formalityLevel: 'casual',
      emotionalBaseline: 'excitable',
      validFrom: 1000
    });

    // Later profile - matured character
    dialogue.recordProfile(db, {
      fictionId,
      entityId: characterA,
      vocabularyLevel: 'complex',
      formalityLevel: 'neutral',
      emotionalBaseline: 'calm',
      validFrom: 2000
    });

    const early = dialogue.getProfileAt(db, characterA, 1500);
    expect(early.vocabularyLevel).toBe('simple');
    expect(early.emotionalBaseline).toBe('excitable');

    const later = dialogue.getProfileAt(db, characterA, 2500);
    expect(later.vocabularyLevel).toBe('complex');
    expect(later.emotionalBaseline).toBe('calm');
  });
});

describe('Integration: Epistemic queries return accurate knowledge states', () => {
  let db;
  const fictionId = 'fiction-1';

  beforeEach(() => {
    db = new Database(testDbPath);
    db.pragma('foreign_keys = ON');
    db.exec('DELETE FROM epistemic_fact_ledger');
    db.exec('DELETE FROM relationship_dynamics');
    db.exec('DELETE FROM dialogue_profiles');
  });

  afterEach(() => {
    db.close();
  });

  test('complex scenario: murder mystery knowledge tracking', () => {
    const detective = 'char-detective';
    const suspect = 'char-suspect';
    const witness = 'char-witness';

    // Time 1000: Detective knows victim's identity
    epistemic.recordFact(db, {
      fictionId,
      entityId: detective,
      factType: 'identity',
      factKey: 'victim',
      factValue: 'Mr. Body',
      sourceType: 'report',
      acquiredAt: 1000
    });

    // Time 2000: Witness knows but lies about seeing suspect
    epistemic.recordFact(db, {
      fictionId,
      entityId: witness,
      factType: 'alibi',
      factKey: 'suspect-location',
      factValue: 'at the library',
      sourceType: 'witnessed',
      isTrue: false, // Lying!
      acquiredAt: 2000
    });

    // Time 3000: Detective learns the lie from witness
    epistemic.recordFact(db, {
      fictionId,
      entityId: detective,
      factType: 'alibi',
      factKey: 'suspect-location',
      factValue: 'at the library',
      sourceType: 'told',
      sourceEntityId: witness,
      isTrue: false,
      acquiredAt: 3000
    });

    // Time 4000: Detective discovers the truth
    epistemic.recordFact(db, {
      fictionId,
      entityId: detective,
      factType: 'alibi',
      factKey: 'suspect-location',
      factValue: 'at the crime scene',
      sourceType: 'evidence',
      isTrue: true,
      acquiredAt: 4000
    });

    // Test knowledge states at different times
    const detectiveAt2500 = epistemic.queryKnowledgeAt(db, detective, 2500);
    expect(detectiveAt2500.length).toBe(1);
    expect(detectiveAt2500[0].factKey).toBe('victim');

    const detectiveAt3500 = epistemic.queryKnowledgeAt(db, detective, 3500);
    expect(detectiveAt3500.length).toBe(2);
    const alibiKnowledge = detectiveAt3500.find(f => f.factKey === 'suspect-location');
    expect(alibiKnowledge.factValue).toBe('at the library');
    expect(alibiKnowledge.isTrue).toBe(false);

    const detectiveAt4500 = epistemic.queryKnowledgeAt(db, detective, 4500);
    const finalAlibi = detectiveAt4500.find(f => f.factKey === 'suspect-location');
    expect(finalAlibi.factValue).toBe('at the crime scene');
    expect(finalAlibi.isTrue).toBe(true);

    // Test false beliefs
    const falseBeliefs = epistemic.getFalseBeliefs(db, detective, 3500);
    expect(falseBeliefs.length).toBe(1);

    // Test divergence
    const divergence = epistemic.getDivergence(db, detective, suspect, 4500);
    expect(divergence.summary.onlyACount).toBeGreaterThan(0);
  });

  test('combined: character relationships affect dialogue', () => {
    const hero = 'char-hero';
    const mentor = 'char-mentor';

    // Initial relationship: student-teacher
    relationships.recordRelationship(db, {
      fictionId,
      entityAId: hero,
      entityBId: mentor,
      relationshipType: 'mentorship',
      sentiment: 0.7,
      trustLevel: 0.9,
      powerBalance: -0.5, // Mentor has more power
      validFrom: 1000
    });

    // Hero's dialogue profile with relationship modifier
    dialogue.recordProfile(db, {
      fictionId,
      entityId: hero,
      vocabularyLevel: 'medium',
      formalityLevel: 'casual',
      emotionalBaseline: 'confident',
      relationshipModifiers: {
        [mentor]: {
          formalityLevel: 'formal',
          emotionalBaseline: 'respectful'
        }
      },
      validFrom: 1000
    });

    // Later: relationship evolved, hero is now equal
    relationships.recordRelationship(db, {
      fictionId,
      entityAId: hero,
      entityBId: mentor,
      relationshipType: 'peers',
      sentiment: 0.9,
      trustLevel: 1.0,
      powerBalance: 0.0, // Equal
      validFrom: 5000
    });

    // Check relationship at different times
    const earlyRel = relationships.getRelationshipAt(db, hero, mentor, 2000);
    expect(earlyRel.relationshipType).toBe('mentorship');
    expect(earlyRel.powerBalance).toBe(-0.5);

    const laterRel = relationships.getRelationshipAt(db, hero, mentor, 6000);
    expect(laterRel.relationshipType).toBe('peers');
    expect(laterRel.powerBalance).toBe(0.0);

    // Voice hints with relationship context
    const voiceWithMentor = dialogue.getVoiceHints(db, hero, 2000, {
      targetEntityId: mentor
    });
    expect(voiceWithMentor.hints.formalityLevel).toBe('formal');
    expect(voiceWithMentor.hints.emotionalBaseline).toBe('respectful');
  });
});
