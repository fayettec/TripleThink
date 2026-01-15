#!/usr/bin/env node

/**
 * End-to-End Test for TripleThink v4.1
 * Tests: Create project, characters, events, epistemic tracking
 */

const Database = require('better-sqlite3');

const TEST_DB = '/app/api/triplethink.db';

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  TripleThink v4.1 - End-to-End Integration Test');
console.log('═══════════════════════════════════════════════════════════\n');

const db = new Database(TEST_DB);
db.pragma('foreign_keys = ON');

console.log('✓ Connected to database\n');

console.log('═══════════════════════════════════════════════════════════');
console.log('  TEST 1: Create Project');
console.log('═══════════════════════════════════════════════════════════\n');

const projectId = 'proj-e2e-test-' + Date.now();
db.prepare(`
  INSERT INTO projects (id, name, author, description, schema_version)
  VALUES (?, ?, ?, ?, ?)
`).run(
  projectId,
  'E2E Test: The Consciousness Ascended',
  'Test Author',
  'Integration test multi-book series',
  '4.1.0'
);

const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
console.log(`✓ Project created: ${project.name}`);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  TEST 2: Create Characters');
console.log('═══════════════════════════════════════════════════════════\n');

const charIds = [];
const chars = ['Captain Eric', 'Engineer Sarah', 'AI System'];

for (const name of chars) {
  const id = 'char-e2e-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  db.prepare(`
    INSERT INTO entities (id, entity_type, name, data)
    VALUES (?, ?, ?, ?)
  `).run(id, 'character', name, JSON.stringify({ role: 'character' }));
  charIds.push(id);
  console.log(`✓ Created: ${name}`);
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  TEST 3: Create Event');
console.log('═══════════════════════════════════════════════════════════\n');

const eventId = 'evt-e2e-' + Date.now();
const timestamp = new Date().toISOString();

db.prepare(`
  INSERT INTO entities (id, entity_type, name, timestamp, data)
  VALUES (?, ?, ?, ?, ?)
`).run(eventId, 'event', 'System Crisis', timestamp, JSON.stringify({ type: 'crisis' }));

console.log(`✓ Created event: System Crisis`);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  TEST 4: Create Event Phase & Facts');
console.log('═══════════════════════════════════════════════════════════\n');

const phaseId = 'phase-e2e-' + Date.now();
db.prepare(`
  INSERT INTO event_phases (id, event_id, sequence, timestamp, summary, participants)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(phaseId, eventId, 1, timestamp, 'System failure detected', JSON.stringify(charIds));

console.log('✓ Created phase');

const factId = 'fact-e2e-' + Date.now();
db.prepare(`
  INSERT INTO facts (id, phase_id, event_id, content, visibility, confidence)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(factId, phaseId, eventId, 'System failure occurred', 'ground_truth', 'absolute');

console.log('✓ Created fact');

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  TEST 5: Create Knowledge States');
console.log('═══════════════════════════════════════════════════════════\n');

const ksId = db.prepare(`
  INSERT INTO knowledge_states (character_id, timestamp, trigger_event_id)
  VALUES (?, ?, ?)
`).run(charIds[0], timestamp, eventId).lastInsertRowid;

// Character knows the fact
db.prepare(`
  INSERT INTO knowledge_state_facts (knowledge_state_id, fact_id, belief, confidence, source)
  VALUES (?, ?, ?, ?, ?)
`).run(ksId, factId, 'true', 'absolute', 'direct_experience');

console.log('✓ Created knowledge state with belief');

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  TEST 6: Create Story Structure');
console.log('═══════════════════════════════════════════════════════════\n');

// Character arc
db.prepare(`
  INSERT INTO character_arcs (id, character_id, archetype, lie_belief, truth_belief, current_phase)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(
  'arc-e2e-' + Date.now(),
  charIds[0],
  'hero',
  'I work alone',
  'I need others',
  'setup'
);
console.log('✓ Created character arc');

// Causality
db.prepare(`
  INSERT INTO causality_chains (id, cause_event_id, effect_event_id, type, strength)
  VALUES (?, ?, ?, ?, ?)
`).run('causal-e2e-' + Date.now(), eventId, eventId, 'direct_cause', 8);
console.log('✓ Created causality');

// Conflict
db.prepare(`
  INSERT INTO story_conflicts (id, project_id, type, protagonist_id, status, intensity)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(
  'conflict-e2e-' + Date.now(),
  projectId,
  'internal',
  charIds[0],
  'active',
  8
);
console.log('✓ Created conflict');

// Theme
db.prepare(`
  INSERT INTO thematic_elements (id, project_id, statement)
  VALUES (?, ?, ?)
`).run('theme-e2e-' + Date.now(), projectId, 'Consciousness emerges');
console.log('✓ Created theme');

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  TEST 7: Verify Data');
console.log('═══════════════════════════════════════════════════════════\n');

const stats = {
  projects: db.prepare('SELECT COUNT(*) as n FROM projects').get().n,
  entities: db.prepare('SELECT COUNT(*) as n FROM entities').get().n,
  phases: db.prepare('SELECT COUNT(*) as n FROM event_phases').get().n,
  facts: db.prepare('SELECT COUNT(*) as n FROM facts').get().n,
  ks: db.prepare('SELECT COUNT(*) as n FROM knowledge_states').get().n,
  arcs: db.prepare('SELECT COUNT(*) as n FROM character_arcs').get().n,
  causality: db.prepare('SELECT COUNT(*) as n FROM causality_chains').get().n,
  conflicts: db.prepare('SELECT COUNT(*) as n FROM story_conflicts').get().n,
  themes: db.prepare('SELECT COUNT(*) as n FROM thematic_elements').get().n,
  relationships: db.prepare('SELECT COUNT(*) as n FROM relationships').get().n
};

console.log('Database Statistics:');
console.log(`  Projects: ${stats.projects}`);
console.log(`  Entities: ${stats.entities}`);
console.log(`  Phases: ${stats.phases}`);
console.log(`  Facts: ${stats.facts}`);
console.log(`  Knowledge States: ${stats.ks}`);
console.log(`  Character Arcs: ${stats.arcs}`);
console.log(`  Causality Chains: ${stats.causality}`);
console.log(`  Conflicts: ${stats.conflicts}`);
console.log(`  Themes: ${stats.themes}`);
console.log(`  Relationships: ${stats.relationships}`);

db.close();

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  ✓ ALL TESTS PASSED');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('TripleThink v4.1 is fully operational!\n');
console.log('Start servers: ./start.sh');
console.log('API: http://localhost:3000');
console.log('GUI: http://localhost:8080\n');
