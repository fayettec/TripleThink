/**
 * TripleThink Database Facade (v4.1 Logic Layer)
 *
 * Unified database interface for all logic layer modules.
 * Provides single import point for routes and orchestrator to access:
 * - Causality Chains: Cause-effect relationship tracking with graph traversal
 * - Character Arcs: Save the Cat 13-beat structure tracking for character transformation
 * - Story Conflicts: 5 conflict types with status progression (latent → resolved)
 * - Thematic Elements: Theme statements, questions, symbols, manifestations
 * - Motif Instances: Recurring pattern tracking (visual, dialogue, situational, symbolic, musical)
 * - Setup Payoffs: Chekhov's gun tracking (planted setups awaiting payoff)
 * - World Rules: Universe consistency rules across 6 categories with enforcement levels
 *
 * Usage:
 *   const createAPI = require('./db/api-functions');
 *   const db = new Database('./triplethink.db');
 *   const api = createAPI(db);
 *   api.causalityChains.createChain(...);
 *   api.characterArcs.advancePhase(...);
 *
 * @module db/api-functions
 */

// Module imports
const causalityChains = require('./modules/causality-chains');
const characterArcs = require('./modules/character-arcs');
const storyConflicts = require('./modules/story-conflicts');
const thematicElements = require('./modules/thematic-elements');
const motifInstances = require('./modules/motif-instances');
const setupPayoffs = require('./modules/setup-payoffs');
const worldRules = require('./modules/world-rules');

/**
 * Create unified API facade for TripleThink Logic Layer
 *
 * Factory function that takes a database instance and returns an object
 * containing all 7 logic layer modules initialized with that database.
 *
 * @param {Database} db - better-sqlite3 database instance
 * @returns {object} Object with 7 module namespaces:
 *   - causalityChains: Causality chain CRUD and graph traversal
 *   - characterArcs: Character arc CRUD and phase progression
 *   - storyConflicts: Conflict CRUD and status transitions
 *   - thematicElements: Theme CRUD and manifestation tracking
 *   - motifInstances: Motif CRUD and type-filtered queries
 *   - setupPayoffs: Setup/payoff CRUD and Chekhov's gun tracking
 *   - worldRules: World rule CRUD and category-filtered queries
 */
function createAPI(db) {
  return {
    causalityChains: causalityChains(db),
    characterArcs: characterArcs(db),
    storyConflicts: storyConflicts(db),
    thematicElements: thematicElements(db),
    motifInstances: motifInstances(db),
    setupPayoffs: setupPayoffs(db),
    worldRules: worldRules(db)
  };
}

module.exports = createAPI;
