// Unit tests for Logic Layer modules (Phase 6)
// Tests all CRUD operations for 7 logic layer modules

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const createAPI = require('../../db/api-functions');

// Test database path
const testDbPath = path.join(__dirname, 'logic-layer-test.db');

describe('Logic Layer Unit Tests', () => {
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

  // ==================== CAUSALITY CHAINS ====================
  describe('Causality Chains Module', () => {
    let chainUuid;

    test('should create causality chain', () => {
      const chain = api.causalityChains.createChain(
        'proj-test',
        'evt-cause-1',
        'evt-effect-1',
        'direct_cause',
        8,
        'Action A directly causes outcome B'
      );

      expect(chain).toBeDefined();
      expect(chain.chain_uuid).toBeDefined();
      expect(chain.type).toBe('direct_cause');
      expect(chain.strength).toBe(8);
      chainUuid = chain.chain_uuid;
    });

    test('should get causality chain by UUID', () => {
      const chain = api.causalityChains.getChainById(chainUuid);
      expect(chain).toBeDefined();
      expect(chain.chain_uuid).toBe(chainUuid);
      expect(chain.type).toBe('direct_cause');
    });

    test('should get causality chains by cause', () => {
      const chains = api.causalityChains.getChainsByCause('evt-cause-1');
      expect(Array.isArray(chains)).toBe(true);
      expect(chains.length).toBeGreaterThan(0);
      expect(chains[0].cause_event_id).toBe('evt-cause-1');
    });

    test('should get causality chains by effect', () => {
      const chains = api.causalityChains.getChainsByEffect('evt-effect-1');
      expect(Array.isArray(chains)).toBe(true);
      expect(chains.length).toBeGreaterThan(0);
      expect(chains[0].effect_event_id).toBe('evt-effect-1');
    });

    test('should update causality chain', () => {
      const updated = api.causalityChains.updateChain(chainUuid, {
        strength: 9,
        explanation: 'Updated explanation'
      });

      expect(updated.strength).toBe(9);
      expect(updated.explanation).toBe('Updated explanation');
    });

    test('should traverse causality chain forward', () => {
      // Create a chain for traversal
      api.causalityChains.createChain(
        'proj-test',
        'evt-effect-1',
        'evt-final',
        'direct_cause',
        7,
        'Effect leads to final outcome'
      );

      const graph = api.causalityChains.traverseChain('evt-cause-1', 'forward', 3);
      expect(graph).toBeDefined();
      expect(graph.nodes).toBeDefined();
      expect(graph.edges).toBeDefined();
      expect(Array.isArray(graph.nodes)).toBe(true);
    });

    test('should delete causality chain', () => {
      const result = api.causalityChains.deleteChain(chainUuid);
      expect(result).toBe(true);
      const deleted = api.causalityChains.getChainById(chainUuid);
      expect(deleted).toBeNull();
    });
  });

  // ==================== CHARACTER ARCS ====================
  describe('Character Arcs Module', () => {
    let arcUuid;

    test('should create character arc', () => {
      const arc = api.characterArcs.createArc(
        'proj-test',
        'char-hero-1',
        'hero',
        'I am powerless',
        'I have inner strength',
        'Wealth',
        'Courage',
        'setup'
      );

      expect(arc).toBeDefined();
      expect(arc.arc_uuid).toBeDefined();
      expect(arc.archetype).toBe('hero');
      expect(arc.current_phase).toBe('setup');
      arcUuid = arc.arc_uuid;
    });

    test('should get character arc by UUID', () => {
      const arc = api.characterArcs.getArcById(arcUuid);
      expect(arc).toBeDefined();
      expect(arc.arc_uuid).toBe(arcUuid);
      expect(arc.character_id).toBe('char-hero-1');
    });

    test('should get character arc by character ID', () => {
      const arc = api.characterArcs.getArcByCharacter('char-hero-1');
      expect(arc).toBeDefined();
      expect(arc.character_id).toBe('char-hero-1');
    });

    test('should update character arc', () => {
      const updated = api.characterArcs.updateArc(arcUuid, {
        current_phase: 'catalyst',
        want_external: 'Power'
      });

      expect(updated.current_phase).toBe('catalyst');
      expect(updated.want_external).toBe('Power');
    });

    test('should advance character arc phase', () => {
      const advanced = api.characterArcs.advancePhase(arcUuid);
      expect(advanced.current_phase).toBe('debate');
    });

    test('should get character arcs by project', () => {
      const arcs = api.characterArcs.getArcsByProject('proj-test');
      expect(Array.isArray(arcs)).toBe(true);
      expect(arcs.length).toBeGreaterThan(0);
    });

    test('should delete character arc', () => {
      const result = api.characterArcs.deleteArc(arcUuid);
      expect(result).toBe(true);
      const deleted = api.characterArcs.getArcById(arcUuid);
      expect(deleted).toBeNull();
    });
  });

  // ==================== STORY CONFLICTS ====================
  describe('Story Conflicts Module', () => {
    let conflictUuid;

    test('should create story conflict', () => {
      const conflict = api.storyConflicts.createConflict({
        project_id: 'proj-test',
        type: 'interpersonal',
        protagonist_id: 'char-hero-2',
        antagonist_source: 'char-villain',
        stakes_success: 'Save the kingdom',
        stakes_fail: 'Kingdom falls',
        status: 'latent'
      });

      expect(conflict).toBeDefined();
      expect(conflict.conflict_uuid).toBeDefined();
      expect(conflict.type).toBe('interpersonal');
      expect(conflict.status).toBe('latent');
      conflictUuid = conflict.conflict_uuid;
    });

    test('should get story conflict by UUID', () => {
      const conflict = api.storyConflicts.getConflictById(conflictUuid);
      expect(conflict).toBeDefined();
      expect(conflict.conflict_uuid).toBe(conflictUuid);
      expect(conflict.protagonist_id).toBe('char-hero-2');
    });

    test('should get story conflicts by project', () => {
      const conflicts = api.storyConflicts.getConflictsByProject('proj-test');
      expect(Array.isArray(conflicts)).toBe(true);
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].project_id).toBe('proj-test');
    });

    test('should get story conflicts by protagonist', () => {
      const conflicts = api.storyConflicts.getConflictsByProtagonist('char-hero-2');
      expect(Array.isArray(conflicts)).toBe(true);
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].protagonist_id).toBe('char-hero-2');
    });

    test('should update story conflict', () => {
      const changesCount = api.storyConflicts.updateConflict(conflictUuid, {
        stakes_success: 'Victory and peace',
        status: 'active'
      });

      expect(changesCount).toBe(1);

      // Verify update by fetching
      const updated = api.storyConflicts.getConflictById(conflictUuid);
      expect(updated.stakes_success).toBe('Victory and peace');
      expect(updated.status).toBe('active');
    });

    test('should transition conflict status', () => {
      const changesCount = api.storyConflicts.transitionConflictStatus(conflictUuid, 'escalating');
      expect(changesCount).toBe(1);

      // Verify transition
      const transitioned = api.storyConflicts.getConflictById(conflictUuid);
      expect(transitioned.status).toBe('escalating');
    });

    test('should delete story conflict', () => {
      const result = api.storyConflicts.deleteConflict(conflictUuid);
      expect(result).toBe(true);
      const deleted = api.storyConflicts.getConflictById(conflictUuid);
      expect(deleted).toBeNull();
    });
  });

  // ==================== THEMATIC ELEMENTS ====================
  describe('Thematic Elements Module', () => {
    let themeUuid;

    test('should create thematic element', () => {
      const theme = api.thematicElements.createTheme({
        project_id: 'proj-test',
        statement: 'Power corrupts absolutely',
        question: 'Can power be wielded without corruption?',
        primary_symbol_id: 'Crown'
      });

      expect(theme).toBeDefined();
      expect(theme.theme_uuid).toBeDefined();
      expect(theme.statement).toBe('Power corrupts absolutely');
      themeUuid = theme.theme_uuid;
    });

    test('should get thematic element by UUID', () => {
      const theme = api.thematicElements.getThemeById(themeUuid);
      expect(theme).toBeDefined();
      expect(theme.theme_uuid).toBe(themeUuid);
      expect(theme.statement).toBe('Power corrupts absolutely');
    });

    test('should get thematic elements by project', () => {
      const themes = api.thematicElements.getThemesByProject('proj-test');
      expect(Array.isArray(themes)).toBe(true);
      expect(themes.length).toBeGreaterThan(0);
      expect(themes[0].project_id).toBe('proj-test');
    });

    test('should update thematic element', () => {
      const changesCount = api.thematicElements.updateTheme(themeUuid, {
        question: 'Does power always corrupt?',
        primary_symbol_id: 'Throne'
      });

      expect(changesCount).toBe(1);

      // Verify update
      const updated = api.thematicElements.getThemeById(themeUuid);
      expect(updated.question).toBe('Does power always corrupt?');
      expect(updated.primary_symbol_id).toBe('Throne');
    });

    test('should add manifestation to theme', () => {
      const changesCount = api.thematicElements.addManifestation(themeUuid, 'evt-corruption-1');
      expect(changesCount).toBe(1);

      // Verify manifestation was added
      const updated = api.thematicElements.getThemeById(themeUuid);
      expect(updated.manifestations).toBeDefined();
      expect(Array.isArray(updated.manifestations)).toBe(true);
      expect(updated.manifestations).toContain('evt-corruption-1');
    });

    test('should remove manifestation from theme', () => {
      // Remove by index (manifestation is at index 0)
      const changesCount = api.thematicElements.removeManifestation(themeUuid, 0);
      expect(changesCount).toBe(1);

      // Verify manifestation was removed
      const updated = api.thematicElements.getThemeById(themeUuid);
      expect(updated.manifestations).toBeDefined();
      expect(updated.manifestations).not.toContain('evt-corruption-1');
    });

    test('should delete thematic element', () => {
      const result = api.thematicElements.deleteTheme(themeUuid);
      expect(result).toBe(true);
      const deleted = api.thematicElements.getThemeById(themeUuid);
      expect(deleted).toBeNull();
    });
  });

  // ==================== MOTIF INSTANCES ====================
  describe('Motif Instances Module', () => {
    let motifUuid;

    test('should create motif instance', () => {
      const motif = api.motifInstances.createMotifInstance({
        project_id: 'proj-test',
        motif_type: 'visual',
        linked_entity_id: 'evt-door-1',
        description: 'Red door appears ominously',
        significance: 'Foreshadows danger and choice'
      });

      expect(motif).toBeDefined();
      expect(motif.motif_uuid).toBeDefined();
      expect(motif.motif_type).toBe('visual');
      motifUuid = motif.motif_uuid;
    });

    test('should get motif instance by UUID', () => {
      const motif = api.motifInstances.getMotifInstanceById(motifUuid);
      expect(motif).toBeDefined();
      expect(motif.motif_uuid).toBe(motifUuid);
      expect(motif.description).toBe('Red door appears ominously');
    });

    test('should get motif instances by project', () => {
      const motifs = api.motifInstances.getMotifInstancesByProject('proj-test');
      expect(Array.isArray(motifs)).toBe(true);
      expect(motifs.length).toBeGreaterThan(0);
      expect(motifs[0].project_id).toBe('proj-test');
    });

    test('should get motif instances by type', () => {
      const motifs = api.motifInstances.getMotifInstancesByType('proj-test', 'visual');
      expect(Array.isArray(motifs)).toBe(true);
      expect(motifs.length).toBeGreaterThan(0);
      expect(motifs[0].motif_type).toBe('visual');
    });

    test('should update motif instance', () => {
      const updated = api.motifInstances.updateMotifInstance(motifUuid, {
        description: 'Red door glows menacingly',
        significance: 'Point of no return'
      });

      expect(updated.description).toBe('Red door glows menacingly');
      expect(updated.significance).toBe('Point of no return');
    });

    test('should delete motif instance', () => {
      const result = api.motifInstances.deleteMotifInstance(motifUuid);
      expect(result.deleted).toBe(true);
      const deleted = api.motifInstances.getMotifInstanceById(motifUuid);
      expect(deleted).toBeUndefined();
    });
  });

  // ==================== SETUP PAYOFFS ====================
  describe('Setup Payoffs Module', () => {
    let setupUuid;

    test('should create setup payoff', () => {
      const setup = api.setupPayoffs.createSetupPayoff({
        project_id: 'proj-test',
        setup_event_id: 'evt-gun-1',
        description: 'Gun placed on mantelpiece',
        status: 'planted',
        planted_chapter: '1'
      });

      expect(setup).toBeDefined();
      expect(setup.setup_payoff_uuid).toBeDefined();
      expect(setup.status).toBe('planted');
      setupUuid = setup.setup_payoff_uuid;
    });

    test('should get setup payoff by UUID', () => {
      const setup = api.setupPayoffs.getSetupPayoffById(setupUuid);
      expect(setup).toBeDefined();
      expect(setup.setup_payoff_uuid).toBe(setupUuid);
      expect(setup.description).toBe('Gun placed on mantelpiece');
    });

    test('should get setup payoffs by project', () => {
      const setups = api.setupPayoffs.getSetupPayoffsByProject('proj-test');
      expect(Array.isArray(setups)).toBe(true);
      expect(setups.length).toBeGreaterThan(0);
      expect(setups[0].project_id).toBe('proj-test');
    });

    test('should get unfired setups', () => {
      const unfired = api.setupPayoffs.getUnfiredSetups('proj-test');
      expect(Array.isArray(unfired)).toBe(true);
      expect(unfired.length).toBeGreaterThan(0);
      expect(['planted', 'referenced'].includes(unfired[0].status)).toBe(true);
    });

    test('should update setup payoff', () => {
      const updated = api.setupPayoffs.updateSetupPayoff(setupUuid, {
        status: 'referenced',
        description: 'Gun referenced in conversation'
      });

      expect(updated.status).toBe('referenced');
      expect(updated.description).toBe('Gun referenced in conversation');
    });

    test('should fire setup', () => {
      const fired = api.setupPayoffs.fireSetup(setupUuid, 'evt-payoff-1', '5');
      expect(fired.status).toBe('fired');
      expect(fired.payoff_event_id).toBe('evt-payoff-1');
      expect(fired.fired_chapter).toBe('5');
    });

    test('should delete setup payoff', () => {
      const result = api.setupPayoffs.deleteSetupPayoff(setupUuid);
      expect(result.deleted).toBe(true);
      const deleted = api.setupPayoffs.getSetupPayoffById(setupUuid);
      expect(deleted).toBeUndefined();
    });
  });

  // ==================== WORLD RULES ====================
  describe('World Rules Module', () => {
    let ruleUuid;

    test('should create world rule', () => {
      const rule = api.worldRules.createWorldRule({
        project_id: 'proj-test',
        rule_category: 'physics',
        statement: 'Magic requires blood sacrifice',
        enforcement_level: 'strict',
        exceptions: 'Ancient artifacts bypass this requirement'
      });

      expect(rule).toBeDefined();
      expect(rule.rule_uuid).toBeDefined();
      expect(rule.rule_category).toBe('physics');
      expect(rule.enforcement_level).toBe('strict');
      ruleUuid = rule.rule_uuid;
    });

    test('should get world rule by UUID', () => {
      const rule = api.worldRules.getWorldRuleById(ruleUuid);
      expect(rule).toBeDefined();
      expect(rule.rule_uuid).toBe(ruleUuid);
      expect(rule.statement).toBe('Magic requires blood sacrifice');
    });

    test('should get world rules by project', () => {
      const rules = api.worldRules.getWorldRulesByProject('proj-test');
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].project_id).toBe('proj-test');
    });

    test('should get world rules by category', () => {
      const rules = api.worldRules.getWorldRulesByCategory('proj-test', 'physics');
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].rule_category).toBe('physics');
    });

    test('should update world rule', () => {
      const changesCount = api.worldRules.updateWorldRule(ruleUuid, {
        enforcement_level: 'flexible',
        exceptions: 'Artifacts and divine intervention bypass this'
      });

      expect(changesCount).toBe(1);

      // Verify the update by fetching the rule
      const updated = api.worldRules.getWorldRuleById(ruleUuid);
      expect(updated.enforcement_level).toBe('flexible');
      expect(updated.exceptions).toBe('Artifacts and divine intervention bypass this');
    });

    test('should delete world rule', () => {
      const result = api.worldRules.deleteWorldRule(ruleUuid);
      expect(result.deleted).toBe(true);
      const deleted = api.worldRules.getWorldRuleById(ruleUuid);
      expect(deleted).toBeNull();
    });
  });
});
