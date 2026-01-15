/**
 * TripleThink Logic Layer Routes
 * API endpoints for causality, arcs, conflicts, themes, motifs, setups, and world rules
 */

const express = require('express');
const router = express.Router();

const {
  asyncHandler,
  NotFoundError,
  ValidationError,
  validateRequired,
} = require('../error-handling');

const { standardRateLimit } = require('../middleware/rate-limit');

const CausalityChains = require('../../db/causality-chains');
const CharacterArcs = require('../../db/character-arcs');
const StoryConflicts = require('../../db/story-conflicts');
const ThematicElements = require('../../db/thematic-elements');
const MotifInstances = require('../../db/motif-instances');
const SetupPayoffs = require('../../db/setup-payoffs');
const WorldRules = require('../../db/world-rules');

// ============================================================
// CAUSALITY CHAINS
// ============================================================

router.get('/causality', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const causality = new CausalityChains(db.db);
  const chains = causality.getAll(req.query);
  res.json({ data: chains });
}));

router.get('/causality/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const causality = new CausalityChains(db.db);
  const chain = causality.get(req.params.id);
  if (!chain) throw new NotFoundError('Causality Chain', req.params.id);
  res.json({ data: chain });
}));

router.post('/causality', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  validateRequired(req.body, ['cause_event_id', 'effect_event_id']);
  const causality = new CausalityChains(db.db);
  const chain = causality.create(req.body);
  res.status(201).json({ data: chain });
}));

router.put('/causality/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const causality = new CausalityChains(db.db);
  const chain = causality.update(req.params.id, req.body);
  if (!chain) throw new NotFoundError('Causality Chain', req.params.id);
  res.json({ data: chain });
}));

router.delete('/causality/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const causality = new CausalityChains(db.db);
  const success = causality.delete(req.params.id);
  if (!success) throw new NotFoundError('Causality Chain', req.params.id);
  res.json({ success: true, message: 'Causality chain deleted' });
}));

router.get('/causality/causes/:eventId', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const causality = new CausalityChains(db.db);
  const chains = causality.getCauses(req.params.eventId);
  res.json({ data: chains });
}));

router.get('/causality/effects/:eventId', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const causality = new CausalityChains(db.db);
  const chains = causality.getEffects(req.params.eventId);
  res.json({ data: chains });
}));

router.get('/causality/chain/:eventId', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const causality = new CausalityChains(db.db);
  const maxDepth = parseInt(req.query.maxDepth) || 5;
  const fullChain = causality.getFullChain(req.params.eventId, maxDepth);
  res.json({ data: fullChain });
}));

// ============================================================
// CHARACTER ARCS
// ============================================================

router.get('/arcs', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const arcs = new CharacterArcs(db.db);
  const data = req.query.withCharacters
    ? arcs.getAllWithCharacters()
    : arcs.getAll(req.query);
  res.json({ data });
}));

router.get('/arcs/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const arcs = new CharacterArcs(db.db);
  const arc = req.query.withCharacter
    ? arcs.getWithCharacter(req.params.id)
    : arcs.get(req.params.id);
  if (!arc) throw new NotFoundError('Character Arc', req.params.id);
  res.json({ data: arc });
}));

router.get('/arcs/character/:characterId', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const arcs = new CharacterArcs(db.db);
  const arc = arcs.getByCharacter(req.params.characterId);
  if (!arc) throw new NotFoundError('Character Arc for character', req.params.characterId);
  res.json({ data: arc });
}));

router.post('/arcs', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  validateRequired(req.body, ['character_id']);
  const arcs = new CharacterArcs(db.db);
  const arc = arcs.create(req.body);
  res.status(201).json({ data: arc });
}));

router.put('/arcs/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const arcs = new CharacterArcs(db.db);
  const arc = arcs.update(req.params.id, req.body);
  if (!arc) throw new NotFoundError('Character Arc', req.params.id);
  res.json({ data: arc });
}));

router.post('/arcs/:id/advance', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  validateRequired(req.body, ['new_phase']);
  const arcs = new CharacterArcs(db.db);
  const arc = arcs.advancePhase(req.params.id, req.body.new_phase);
  if (!arc) throw new NotFoundError('Character Arc', req.params.id);
  res.json({ data: arc });
}));

router.delete('/arcs/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const arcs = new CharacterArcs(db.db);
  const success = arcs.delete(req.params.id);
  if (!success) throw new NotFoundError('Character Arc', req.params.id);
  res.json({ success: true, message: 'Character arc deleted' });
}));

// ============================================================
// STORY CONFLICTS
// ============================================================

router.get('/conflicts', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const conflicts = new StoryConflicts(db.db);
  const { project_id, withDetails } = req.query;

  if (!project_id) {
    throw new ValidationError('project_id query parameter is required');
  }

  const data = withDetails
    ? conflicts.getAllWithDetails(project_id)
    : conflicts.getByProject(project_id, req.query);

  res.json({ data });
}));

router.get('/conflicts/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const conflicts = new StoryConflicts(db.db);
  const conflict = conflicts.get(req.params.id);
  if (!conflict) throw new NotFoundError('Story Conflict', req.params.id);
  res.json({ data: conflict });
}));

router.get('/conflicts/protagonist/:protagonistId', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const conflicts = new StoryConflicts(db.db);
  const data = conflicts.getByProtagonist(req.params.protagonistId);
  res.json({ data });
}));

router.post('/conflicts', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  validateRequired(req.body, ['project_id', 'protagonist_id']);
  const conflicts = new StoryConflicts(db.db);
  const conflict = conflicts.create(req.body);
  res.status(201).json({ data: conflict });
}));

router.put('/conflicts/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const conflicts = new StoryConflicts(db.db);
  const conflict = conflicts.update(req.params.id, req.body);
  if (!conflict) throw new NotFoundError('Story Conflict', req.params.id);
  res.json({ data: conflict });
}));

router.post('/conflicts/:id/escalate', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const conflicts = new StoryConflicts(db.db);
  const conflict = conflicts.escalate(req.params.id, req.body.new_intensity);
  if (!conflict) throw new NotFoundError('Story Conflict', req.params.id);
  res.json({ data: conflict });
}));

router.post('/conflicts/:id/resolve', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const conflicts = new StoryConflicts(db.db);
  const conflict = conflicts.resolve(req.params.id);
  if (!conflict) throw new NotFoundError('Story Conflict', req.params.id);
  res.json({ data: conflict });
}));

router.delete('/conflicts/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const conflicts = new StoryConflicts(db.db);
  const success = conflicts.delete(req.params.id);
  if (!success) throw new NotFoundError('Story Conflict', req.params.id);
  res.json({ success: true, message: 'Story conflict deleted' });
}));

// ============================================================
// THEMATIC ELEMENTS
// ============================================================

router.get('/themes', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const themes = new ThematicElements(db.db);
  const { project_id, withSymbols, search } = req.query;

  if (!project_id) {
    throw new ValidationError('project_id query parameter is required');
  }

  let data;
  if (search) {
    data = themes.search(project_id, search);
  } else if (withSymbols) {
    data = themes.getAllWithSymbols(project_id);
  } else {
    data = themes.getByProject(project_id);
  }

  res.json({ data });
}));

router.get('/themes/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const themes = new ThematicElements(db.db);
  const theme = req.query.withSymbol
    ? themes.getWithSymbol(req.params.id)
    : themes.get(req.params.id);
  if (!theme) throw new NotFoundError('Thematic Element', req.params.id);
  res.json({ data: theme });
}));

router.post('/themes', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  validateRequired(req.body, ['project_id', 'statement']);
  const themes = new ThematicElements(db.db);
  const theme = themes.create(req.body);
  res.status(201).json({ data: theme });
}));

router.put('/themes/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const themes = new ThematicElements(db.db);
  const theme = themes.update(req.params.id, req.body);
  if (!theme) throw new NotFoundError('Thematic Element', req.params.id);
  res.json({ data: theme });
}));

router.delete('/themes/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const themes = new ThematicElements(db.db);
  const success = themes.delete(req.params.id);
  if (!success) throw new NotFoundError('Thematic Element', req.params.id);
  res.json({ success: true, message: 'Thematic element deleted' });
}));

// ============================================================
// MOTIF INSTANCES
// ============================================================

router.get('/motifs', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const motifs = new MotifInstances(db.db);
  const { project_id, motif_name, motif_type, event_id, theme_id, withDetails, frequency } = req.query;

  if (!project_id && !event_id && !theme_id) {
    throw new ValidationError('project_id, event_id, or theme_id query parameter is required');
  }

  let data;
  if (event_id) {
    data = motifs.getByEvent(event_id);
  } else if (theme_id) {
    data = motifs.getByTheme(theme_id);
  } else if (frequency) {
    data = motifs.getMotifFrequency(project_id);
  } else if (withDetails) {
    data = motifs.getAllWithDetails(project_id);
  } else if (motif_name) {
    data = motifs.getByMotifName(project_id, motif_name);
  } else if (motif_type) {
    data = motifs.getByType(project_id, motif_type);
  } else {
    data = motifs.getAllMotifNames(project_id);
  }

  res.json({ data });
}));

router.get('/motifs/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const motifs = new MotifInstances(db.db);
  const motif = motifs.get(req.params.id);
  if (!motif) throw new NotFoundError('Motif Instance', req.params.id);
  res.json({ data: motif });
}));

router.post('/motifs', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  validateRequired(req.body, ['project_id', 'motif_name', 'event_id']);
  const motifs = new MotifInstances(db.db);
  const motif = motifs.create(req.body);
  res.status(201).json({ data: motif });
}));

router.put('/motifs/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const motifs = new MotifInstances(db.db);
  const motif = motifs.update(req.params.id, req.body);
  if (!motif) throw new NotFoundError('Motif Instance', req.params.id);
  res.json({ data: motif });
}));

router.delete('/motifs/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const motifs = new MotifInstances(db.db);
  const success = motifs.delete(req.params.id);
  if (!success) throw new NotFoundError('Motif Instance', req.params.id);
  res.json({ success: true, message: 'Motif instance deleted' });
}));

// ============================================================
// SETUP/PAYOFFS
// ============================================================

router.get('/setups', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const setups = new SetupPayoffs(db.db);
  const { project_id, event_id, unfired, withDetails } = req.query;

  if (!project_id && !event_id) {
    throw new ValidationError('project_id or event_id query parameter is required');
  }

  let data;
  if (event_id) {
    data = setups.getByEvent(event_id);
  } else if (unfired) {
    data = setups.getUnfiredGuns(project_id);
  } else if (withDetails) {
    data = setups.getAllWithDetails(project_id);
  } else {
    data = setups.getByProject(project_id, req.query);
  }

  res.json({ data });
}));

router.get('/setups/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const setups = new SetupPayoffs(db.db);
  const setup = setups.get(req.params.id);
  if (!setup) throw new NotFoundError('Setup/Payoff', req.params.id);
  res.json({ data: setup });
}));

router.post('/setups', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  validateRequired(req.body, ['project_id', 'setup_event_id', 'setup_description']);
  const setups = new SetupPayoffs(db.db);
  const setup = setups.create(req.body);
  res.status(201).json({ data: setup });
}));

router.put('/setups/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const setups = new SetupPayoffs(db.db);
  const setup = setups.update(req.params.id, req.body);
  if (!setup) throw new NotFoundError('Setup/Payoff', req.params.id);
  res.json({ data: setup });
}));

router.post('/setups/:id/fire', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  validateRequired(req.body, ['payoff_event_id', 'payoff_description']);
  const setups = new SetupPayoffs(db.db);
  const setup = setups.fire(req.params.id, req.body.payoff_event_id, req.body.payoff_description);
  if (!setup) throw new NotFoundError('Setup/Payoff', req.params.id);
  res.json({ data: setup });
}));

router.post('/setups/:id/reference', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const setups = new SetupPayoffs(db.db);
  const setup = setups.reference(req.params.id);
  if (!setup) throw new NotFoundError('Setup/Payoff', req.params.id);
  res.json({ data: setup });
}));

router.post('/setups/:id/abandon', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const setups = new SetupPayoffs(db.db);
  const setup = setups.abandon(req.params.id);
  if (!setup) throw new NotFoundError('Setup/Payoff', req.params.id);
  res.json({ data: setup });
}));

router.delete('/setups/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const setups = new SetupPayoffs(db.db);
  const success = setups.delete(req.params.id);
  if (!success) throw new NotFoundError('Setup/Payoff', req.params.id);
  res.json({ success: true, message: 'Setup/payoff deleted' });
}));

// ============================================================
// WORLD RULES
// ============================================================

router.get('/rules', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const rules = new WorldRules(db.db);
  const { project_id, category, is_hard_rule, withDetails, categories, search } = req.query;

  if (!project_id) {
    throw new ValidationError('project_id query parameter is required');
  }

  let data;
  if (categories) {
    data = rules.getCategories(project_id);
  } else if (search) {
    data = rules.search(project_id, search);
  } else if (withDetails) {
    data = rules.getAllWithDetails(project_id);
  } else if (category) {
    data = rules.getByCategory(project_id, category);
  } else if (is_hard_rule === 'true' || is_hard_rule === '1') {
    data = rules.getHardRules(project_id);
  } else if (is_hard_rule === 'false' || is_hard_rule === '0') {
    data = rules.getSoftRules(project_id);
  } else {
    data = rules.getByProject(project_id, req.query);
  }

  res.json({ data });
}));

router.get('/rules/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const rules = new WorldRules(db.db);
  const rule = rules.get(req.params.id);
  if (!rule) throw new NotFoundError('World Rule', req.params.id);
  res.json({ data: rule });
}));

router.post('/rules', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  validateRequired(req.body, ['project_id', 'rule_name', 'rule_statement']);
  const rules = new WorldRules(db.db);
  const rule = rules.create(req.body);
  res.status(201).json({ data: rule });
}));

router.put('/rules/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const rules = new WorldRules(db.db);
  const rule = rules.update(req.params.id, req.body);
  if (!rule) throw new NotFoundError('World Rule', req.params.id);
  res.json({ data: rule });
}));

router.delete('/rules/:id', standardRateLimit(), asyncHandler(async (req, res) => {
  const db = req.app.get('db');
  const rules = new WorldRules(db.db);
  const success = rules.delete(req.params.id);
  if (!success) throw new NotFoundError('World Rule', req.params.id);
  res.json({ success: true, message: 'World rule deleted' });
}));

module.exports = router;
