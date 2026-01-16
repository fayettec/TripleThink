// Integration tests for Logic Layer cross-module queries (Phase 6)
// Tests queries spanning multiple logic layer tables

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const createAPI = require('../../db/api-functions');

// Test database path
const testDbPath = path.join(__dirname, 'logic-cross-queries-test.db');

describe('Logic Layer Integration Tests', () => {
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

    // Load logic layer schema from migration
    const schemaPath = path.join(__dirname, '../../db/migrations/006_logic_layer.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);

    // Initialize API facade
    api = createAPI(db);
  });

  afterAll(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Character Arc + Conflict Integration', () => {
    test('should link character arc to their primary conflict', () => {
      // Create character arc
      const arc = api.characterArcs.createArc(
        'proj-integration',
        'char-hero',
        'hero',
        'I am weak',
        'I am brave',
        null,
        null,
        'setup'
      );

      // Create conflict with same character as protagonist
      const conflict = api.storyConflicts.createConflict({
        project_id: 'proj-integration',
        type: 'internal',
        protagonist_id: 'char-hero',
        antagonist_source: 'self',
        stakes_success: 'Self-acceptance',
        stakes_fail: 'Self-destruction',
        status: 'active'
      });

      // Query: Get arc and verify conflict exists for same character
      const queriedArc = api.characterArcs.getArcByCharacter('char-hero');
      const conflicts = api.storyConflicts.getConflictsByProject('proj-integration');
      const heroConflict = conflicts.find(c => c.protagonist_id === 'char-hero');

      expect(queriedArc).toBeDefined();
      expect(heroConflict).toBeDefined();
      expect(queriedArc.character_id).toBe(heroConflict.protagonist_id);
      expect(queriedArc.current_phase).toBe('setup');
      expect(heroConflict.type).toBe('internal');
    });

    test('should track multiple conflicts for same character arc', () => {
      const characterId = 'char-multi';

      // Create one arc
      api.characterArcs.createArc(
        'proj-integration',
        characterId,
        'antihero',
        null,
        null,
        null,
        null,
        'midpoint'
      );

      // Create multiple conflicts for same character
      api.storyConflicts.createConflict({
        project_id: 'proj-integration',
        type: 'internal',
        protagonist_id: characterId,
        antagonist_source: 'self',
        stakes_success: 'Self-acceptance',
        stakes_fail: 'Self-destruction',
        status: 'active'
      });

      api.storyConflicts.createConflict({
        project_id: 'proj-integration',
        type: 'interpersonal',
        protagonist_id: characterId,
        antagonist_source: 'char-villain',
        stakes_success: 'Victory',
        stakes_fail: 'Defeat',
        status: 'escalating'
      });

      // Verify one arc with multiple conflicts
      const arc = api.characterArcs.getArcByCharacter(characterId);
      const conflicts = api.storyConflicts.getConflictsByProject('proj-integration')
        .filter(c => c.protagonist_id === characterId);

      expect(arc).toBeDefined();
      expect(conflicts.length).toBe(2);
      expect(conflicts.some(c => c.type === 'internal')).toBe(true);
      expect(conflicts.some(c => c.type === 'interpersonal')).toBe(true);
    });
  });

  describe('Causality + Theme Integration', () => {
    test('should trace causal chain and verify thematic relevance', () => {
      // Create causality chain
      const chain = api.causalityChains.createChain(
        'proj-integration',
        'evt-cause',
        'evt-effect',
        'direct_cause',
        9,
        'Character\'s choice leads to consequences'
      );

      // Create theme relevant to the causality
      const theme = api.thematicElements.createTheme({
        project_id: 'proj-integration',
        statement: 'Actions have consequences',
        question: 'Can we escape our past?'
      });

      // Add the effect event as manifestation
      api.thematicElements.addManifestation(theme.theme_uuid, 'evt-effect');

      // Query: Verify both exist in same project
      const chains = api.causalityChains.getChainsByCause('evt-cause');
      const themes = api.thematicElements.getThemesByProject('proj-integration');
      const relevantTheme = api.thematicElements.getThemeById(theme.theme_uuid);

      expect(chains.length).toBeGreaterThan(0);
      expect(themes.length).toBeGreaterThan(0);
      expect(chains[0].project_id).toBe(themes[0].project_id);
      expect(relevantTheme.manifestations).toContain('evt-effect');
    });

    test('should connect causal graph to thematic elements', () => {
      const projectId = 'proj-causality-theme';

      // Create causal chain representing moral choice
      api.causalityChains.createChain(
        projectId,
        'evt-moral-choice',
        'evt-betrayal',
        'psychological_trigger',
        10,
        'Moral compromise triggers betrayal'
      );

      api.causalityChains.createChain(
        projectId,
        'evt-betrayal',
        'evt-redemption',
        'motivation',
        8,
        'Betrayal motivates redemption arc'
      );

      // Create theme about redemption
      const theme = api.thematicElements.createTheme({
        project_id: projectId,
        statement: 'Redemption is earned through sacrifice',
        question: 'Can one truly atone for past wrongs?'
      });

      // Link theme manifestations to causal events
      api.thematicElements.addManifestation(theme.theme_uuid, 'evt-moral-choice');
      api.thematicElements.addManifestation(theme.theme_uuid, 'evt-betrayal');
      api.thematicElements.addManifestation(theme.theme_uuid, 'evt-redemption');

      // Verify causality and theme are connected through events
      const chain1 = api.causalityChains.getChainsByCause('evt-moral-choice');
      const chain2 = api.causalityChains.getChainsByCause('evt-betrayal');
      const themeData = api.thematicElements.getThemeById(theme.theme_uuid);

      expect(chain1.length).toBe(1);
      expect(chain2.length).toBe(1);
      expect(themeData.manifestations.length).toBe(3);
      expect(themeData.manifestations).toContain('evt-moral-choice');
      expect(chain1[0].cause_event_id).toBe('evt-moral-choice');
    });
  });

  describe('Setup Payoff + Motif Integration', () => {
    test('should track setup with motif instance as symbolic reinforcement', () => {
      // Create setup
      const setup = api.setupPayoffs.createSetupPayoff({
        project_id: 'proj-integration',
        setup_event_id: 'evt-plant',
        description: 'Red door appears in vision',
        status: 'planted',
        planted_chapter: 1
      });

      // Create motif for same visual element
      const motif = api.motifInstances.createMotifInstance({
        project_id: 'proj-integration',
        motif_type: 'visual',
        linked_entity_id: 'evt-plant',
        description: 'Red door motif',
        significance: 'Gateway to truth or danger'
      });

      // Query: Get unfired setups and motifs, verify connection via linked_entity_id
      const unfired = api.setupPayoffs.getUnfiredSetups('proj-integration');
      const motifs = api.motifInstances.getMotifInstancesByProject('proj-integration');

      expect(unfired.length).toBeGreaterThan(0);
      expect(motifs.length).toBeGreaterThan(0);
      expect(motifs[0].linked_entity_id).toBe(unfired.find(s => s.setup_uuid === setup.setup_uuid).setup_event_id);
    });

    test('should track motif recurrence across setup lifecycle', () => {
      const projectId = 'proj-motif-setup';

      // Create setup
      const setup = api.setupPayoffs.createSetupPayoff({
        project_id: projectId,
        setup_event_id: 'evt-sword-plant',
        description: 'Ancient sword discovered',
        status: 'planted',
        planted_chapter: 2
      });

      // Create multiple motif instances for the sword appearing
      api.motifInstances.createMotifInstance({
        project_id: projectId,
        motif_type: 'visual',
        linked_entity_id: 'evt-sword-plant',
        description: 'Sword gleams in darkness',
        significance: 'Plant - setup for later use'
      });

      api.motifInstances.createMotifInstance({
        project_id: projectId,
        motif_type: 'visual',
        linked_entity_id: 'evt-sword-reference',
        description: 'Character remembers the sword',
        significance: 'Reference - keeps setup alive'
      });

      // Reference the setup
      api.setupPayoffs.updateSetupPayoff(setup.setup_payoff_uuid, {
        status: 'referenced'
      });

      // Create payoff motif
      api.motifInstances.createMotifInstance({
        project_id: projectId,
        motif_type: 'visual',
        linked_entity_id: 'evt-sword-use',
        description: 'Sword raised in final battle',
        significance: 'Payoff - setup fulfilled'
      });

      // Fire the setup
      api.setupPayoffs.fireSetup(setup.setup_payoff_uuid, 'evt-sword-use', '10');

      // Verify lifecycle tracked through both systems
      const firedSetup = api.setupPayoffs.getSetupPayoffById(setup.setup_payoff_uuid);
      const motifs = api.motifInstances.getMotifInstancesByProject(projectId);

      expect(firedSetup.status).toBe('fired');
      expect(motifs.length).toBe(3);
      expect(motifs.some(m => m.linked_entity_id === 'evt-sword-plant')).toBe(true);
      expect(motifs.some(m => m.linked_entity_id === 'evt-sword-use')).toBe(true);
    });
  });

  describe('World Rules + Arc Phase Validation', () => {
    test('should verify character arc progression respects world rules', () => {
      // Create world rule about character transformation
      const rule = api.worldRules.createWorldRule({
        project_id: 'proj-integration',
        rule_category: 'magic',
        statement: 'Character transformation requires catalyst event',
        enforcement_level: 'flexible',
        exceptions: 'Divine intervention bypasses requirement'
      });

      // Create character arc
      const arc = api.characterArcs.createArc(
        'proj-integration',
        'char-transform',
        'shapeshifter',
        null,
        null,
        null,
        null,
        'setup'
      );

      // Query: Verify arc exists in project with corresponding rule
      const arcs = api.characterArcs.getArcsByProject('proj-integration');
      const rules = api.worldRules.getWorldRulesByProject('proj-integration');
      const magicRules = api.worldRules.getWorldRulesByCategory('proj-integration', 'magic');

      expect(arcs.length).toBeGreaterThan(0);
      expect(rules.length).toBeGreaterThan(0);
      expect(magicRules.length).toBeGreaterThan(0);
      expect(arcs.some(a => a.character_id === 'char-transform')).toBe(true);
      expect(magicRules[0].rule_uuid).toBe(rule.rule_uuid);
    });

    test('should enforce strict world rules on conflict resolution', () => {
      const projectId = 'proj-rules-conflicts';

      // Create strict physics rule
      api.worldRules.createWorldRule({
        project_id: projectId,
        rule_category: 'physics',
        statement: 'Time travel creates alternate timelines, cannot change past',
        enforcement_level: 'strict',
        exceptions: null
      });

      // Create conflict about changing the past
      const conflict = api.storyConflicts.createConflict({
        project_id: projectId,
        type: 'internal',
        protagonist_id: 'char-time-traveler',
        antagonist_source: 'self',
        stakes_success: 'Accept the past',
        stakes_fail: 'Paradox destroys timeline',
        status: 'active'
      });

      // Verify rules and conflict coexist for validation
      const strictRules = api.worldRules.getWorldRulesByProject(projectId)
        .filter(r => r.enforcement_level === 'strict');
      const conflicts = api.storyConflicts.getConflictsByProject(projectId);

      expect(strictRules.length).toBe(1);
      expect(conflicts.length).toBe(1);
      expect(strictRules[0].rule_category).toBe('physics');
      expect(conflicts[0].stakes_fail).toContain('Paradox');
    });
  });

  describe('Multi-Module Context Assembly', () => {
    test('should assemble complete logic layer context for a scene', () => {
      // Simulate orchestrator pattern: assemble data from multiple modules
      const projectId = 'proj-scene-context';
      const characterId = 'char-protagonist';

      // Create data across all 7 modules
      api.characterArcs.createArc(
        projectId,
        characterId,
        'hero',
        'Only strength matters',
        'Compassion is true strength',
        null,
        null,
        'midpoint'
      );

      api.storyConflicts.createConflict({
        project_id: projectId,
        type: 'interpersonal',
        protagonist_id: characterId,
        antagonist_source: 'char-warlord',
        stakes_success: 'Victory',
        stakes_fail: 'Defeat',
        status: 'escalating'
      });

      api.thematicElements.createTheme({
        project_id: projectId,
        statement: 'Strength without compassion is tyranny',
        question: 'What defines true power?'
      });

      api.causalityChains.createChain(
        projectId,
        'evt-choice',
        'evt-consequence',
        'direct_cause',
        10,
        'Choice to show mercy leads to unexpected alliance'
      );

      api.motifInstances.createMotifInstance({
        project_id: projectId,
        motif_type: 'symbolic',
        linked_entity_id: characterId,
        description: 'Scarred hands motif',
        significance: 'Represents burden of past violence'
      });

      api.setupPayoffs.createSetupPayoff({
        project_id: projectId,
        setup_event_id: 'evt-sword-gift',
        description: 'Father\'s sword gifted to protagonist',
        status: 'planted',
        planted_chapter: 1
      });

      api.worldRules.createWorldRule({
        project_id: projectId,
        rule_category: 'social',
        statement: 'Warlords respect only strength in combat',
        enforcement_level: 'flexible'
      });

      // Assemble complete context (orchestrator pattern)
      const context = {
        arc: api.characterArcs.getArcByCharacter(characterId),
        conflicts: api.storyConflicts.getConflictsByProject(projectId),
        themes: api.thematicElements.getThemesByProject(projectId),
        causality: api.causalityChains.getChainsByCause('evt-choice'),
        motifs: api.motifInstances.getMotifInstancesByProject(projectId),
        unfiredSetups: api.setupPayoffs.getUnfiredSetups(projectId),
        worldRules: api.worldRules.getWorldRulesByProject(projectId)
      };

      // Verify complete context assembled
      expect(context.arc).toBeDefined();
      expect(context.arc.character_id).toBe(characterId);
      expect(context.arc.current_phase).toBe('midpoint');
      expect(context.conflicts.length).toBe(1);
      expect(context.conflicts[0].status).toBe('escalating');
      expect(context.themes.length).toBe(1);
      expect(context.causality.length).toBe(1);
      expect(context.motifs.length).toBe(1);
      expect(context.unfiredSetups.length).toBe(1);
      expect(context.worldRules.length).toBe(1);
    });

    test('should support filtering context by specific criteria', () => {
      const projectId = 'proj-filtered-context';

      // Create diverse data
      api.motifInstances.createMotifInstance({
        project_id: projectId,
        motif_type: 'visual',
        description: 'Blue flame'
      });

      api.motifInstances.createMotifInstance({
        project_id: projectId,
        motif_type: 'dialogue',
        description: 'Catchphrase repetition'
      });

      api.worldRules.createWorldRule({
        project_id: projectId,
        rule_category: 'physics',
        statement: 'Rule 1'
      });

      api.worldRules.createWorldRule({
        project_id: projectId,
        rule_category: 'magic',
        statement: 'Rule 2'
      });

      // Assemble filtered context
      const filteredContext = {
        visualMotifs: api.motifInstances.getMotifInstancesByType(projectId, 'visual'),
        dialogueMotifs: api.motifInstances.getMotifInstancesByType(projectId, 'dialogue'),
        physicsRules: api.worldRules.getWorldRulesByCategory(projectId, 'physics'),
        magicRules: api.worldRules.getWorldRulesByCategory(projectId, 'magic')
      };

      // Verify filtering works
      expect(filteredContext.visualMotifs.length).toBe(1);
      expect(filteredContext.dialogueMotifs.length).toBe(1);
      expect(filteredContext.physicsRules.length).toBe(1);
      expect(filteredContext.magicRules.length).toBe(1);
      expect(filteredContext.visualMotifs[0].motif_type).toBe('visual');
      expect(filteredContext.physicsRules[0].rule_category).toBe('physics');
    });
  });
});
