// Logic Layer API Routes
// REST endpoints for causality chains, character arcs, and story conflicts
// Provides access to v4.1 logic layer modules for story structure manipulation

const express = require('express');
const createAPI = require('../../db/api-functions');

module.exports = (db) => {
  const router = express.Router();
  const api = createAPI(db);

  // ============================================================
  // CAUSALITY CHAIN ENDPOINTS
  // ============================================================

  // POST /api/logic/causality - Create causal chain
  router.post('/causality', (req, res, next) => {
    try {
      const { cause_event_id, effect_event_id, type, strength, explanation } = req.body;

      // Validate required fields
      if (!cause_event_id || !effect_event_id || !type) {
        return res.status(400).json({
          error: 'Missing required fields: cause_event_id, effect_event_id, type'
        });
      }

      // Validate type enum
      const validTypes = ['direct_cause', 'enabling_condition', 'motivation', 'psychological_trigger'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      const chain = api.causalityChains.createChain(
        cause_event_id,
        effect_event_id,
        type,
        strength,
        explanation
      );
      res.status(201).json(chain);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logic/causality/:chainId - Get single chain by ID
  router.get('/causality/:chainId', (req, res, next) => {
    try {
      const { chainId } = req.params;
      const chain = api.causalityChains.getChainById(chainId);

      if (!chain) {
        return res.status(404).json({ error: 'Causality chain not found' });
      }

      res.json(chain);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logic/causality/chain/:eventId - Get full causal graph for event
  router.get('/causality/chain/:eventId', (req, res, next) => {
    try {
      const { eventId } = req.params;
      const depth = parseInt(req.query.depth) || 3;

      // Validate depth parameter
      if (depth < 1 || depth > 10) {
        return res.status(400).json({
          error: 'Depth must be between 1 and 10'
        });
      }

      const graph = api.causalityChains.traverseChain(eventId, depth);
      res.json(graph);
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/logic/causality/:chainId - Update chain
  router.put('/causality/:chainId', (req, res, next) => {
    try {
      const { chainId } = req.params;
      const updates = req.body;

      // Type is immutable per module design
      if (updates.type) {
        return res.status(400).json({
          error: 'Cannot update type field - it is immutable'
        });
      }

      const updated = api.causalityChains.updateChain(chainId, updates);

      if (!updated) {
        return res.status(404).json({ error: 'Causality chain not found' });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/logic/causality/:chainId - Delete chain
  router.delete('/causality/:chainId', (req, res, next) => {
    try {
      const { chainId } = req.params;
      const deleted = api.causalityChains.deleteChain(chainId);

      if (!deleted) {
        return res.status(404).json({ error: 'Causality chain not found' });
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // ============================================================
  // CHARACTER ARC ENDPOINTS
  // ============================================================

  // POST /api/logic/arcs - Create character arc
  router.post('/arcs', (req, res, next) => {
    try {
      const {
        character_id,
        archetype,
        lie_belief,
        truth_belief,
        want_external,
        need_internal,
        current_phase
      } = req.body;

      // Validate required fields
      if (!character_id) {
        return res.status(400).json({
          error: 'Missing required field: character_id'
        });
      }

      // Validate current_phase enum if provided
      if (current_phase) {
        const validPhases = ['setup', 'catalyst', 'debate', 'midpoint', 'all_is_lost', 'finale'];
        if (!validPhases.includes(current_phase)) {
          return res.status(400).json({
            error: `Invalid current_phase. Must be one of: ${validPhases.join(', ')}`
          });
        }
      }

      const arc = api.characterArcs.createArc(
        character_id,
        archetype,
        lie_belief,
        truth_belief,
        want_external,
        need_internal,
        current_phase
      );
      res.status(201).json(arc);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logic/arcs/character/:characterId - Get arc by character ID
  router.get('/arcs/character/:characterId', (req, res, next) => {
    try {
      const { characterId } = req.params;
      const arc = api.characterArcs.getArcByCharacter(characterId);

      if (!arc) {
        return res.status(404).json({ error: 'Character arc not found' });
      }

      res.json(arc);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logic/arcs/:arcId - Get arc by arc ID
  router.get('/arcs/:arcId', (req, res, next) => {
    try {
      const { arcId } = req.params;
      const arc = api.characterArcs.getArcById(arcId);

      if (!arc) {
        return res.status(404).json({ error: 'Character arc not found' });
      }

      res.json(arc);
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/logic/arcs/:arcId - Update arc
  router.put('/arcs/:arcId', (req, res, next) => {
    try {
      const { arcId } = req.params;
      const updates = req.body;

      // Character_id is immutable per module design
      if (updates.character_id) {
        return res.status(400).json({
          error: 'Cannot update character_id field - it is immutable'
        });
      }

      // Validate phase if being updated
      if (updates.current_phase) {
        const validPhases = ['setup', 'catalyst', 'debate', 'midpoint', 'all_is_lost', 'finale'];
        if (!validPhases.includes(updates.current_phase)) {
          return res.status(400).json({
            error: `Invalid current_phase. Must be one of: ${validPhases.join(', ')}`
          });
        }
      }

      const updated = api.characterArcs.updateArc(arcId, updates);

      if (!updated) {
        return res.status(404).json({ error: 'Character arc not found' });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/logic/arcs/:arcId/advance - Advance arc phase (helper endpoint)
  router.post('/arcs/:arcId/advance', (req, res, next) => {
    try {
      const { arcId } = req.params;
      const updated = api.characterArcs.advancePhase(arcId);

      if (!updated) {
        return res.status(404).json({ error: 'Character arc not found' });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/logic/arcs/:arcId - Delete arc
  router.delete('/arcs/:arcId', (req, res, next) => {
    try {
      const { arcId } = req.params;
      const deleted = api.characterArcs.deleteArc(arcId);

      if (!deleted) {
        return res.status(404).json({ error: 'Character arc not found' });
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // ============================================================
  // STORY CONFLICT ENDPOINTS
  // ============================================================

  // POST /api/logic/conflicts - Create story conflict
  router.post('/conflicts', (req, res, next) => {
    try {
      const {
        project_id,
        type,
        protagonist_id,
        antagonist_source,
        stakes_success,
        stakes_fail,
        status
      } = req.body;

      // Validate required fields
      if (!project_id || !type || !protagonist_id) {
        return res.status(400).json({
          error: 'Missing required fields: project_id, type, protagonist_id'
        });
      }

      // Validate type enum
      const validTypes = ['internal', 'interpersonal', 'societal', 'environmental', 'supernatural'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      // Validate status enum if provided
      if (status) {
        const validStatuses = ['latent', 'active', 'escalating', 'climactic', 'resolved'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
          });
        }
      }

      const conflict = api.storyConflicts.createConflict(
        project_id,
        type,
        protagonist_id,
        antagonist_source,
        stakes_success,
        stakes_fail,
        status
      );
      res.status(201).json(conflict);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logic/conflicts/:conflictId - Get single conflict
  router.get('/conflicts/:conflictId', (req, res, next) => {
    try {
      const { conflictId } = req.params;
      const conflict = api.storyConflicts.getConflictById(conflictId);

      if (!conflict) {
        return res.status(404).json({ error: 'Story conflict not found' });
      }

      res.json(conflict);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logic/conflicts/project/:projectId - Get all conflicts for project
  router.get('/conflicts/project/:projectId', (req, res, next) => {
    try {
      const { projectId } = req.params;
      const conflicts = api.storyConflicts.getConflictsByProject(projectId);
      res.json(conflicts);
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/logic/conflicts/:conflictId - Update conflict
  router.put('/conflicts/:conflictId', (req, res, next) => {
    try {
      const { conflictId } = req.params;
      const updates = req.body;

      // Immutable fields per module design
      if (updates.conflict_uuid || updates.project_id || updates.protagonist_id) {
        return res.status(400).json({
          error: 'Cannot update conflict_uuid, project_id, or protagonist_id - they are immutable'
        });
      }

      // Validate status if being updated
      if (updates.status) {
        const validStatuses = ['latent', 'active', 'escalating', 'climactic', 'resolved'];
        if (!validStatuses.includes(updates.status)) {
          return res.status(400).json({
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
          });
        }
      }

      const updated = api.storyConflicts.updateConflict(conflictId, updates);

      if (!updated) {
        return res.status(404).json({ error: 'Story conflict not found' });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/logic/conflicts/:conflictId/transition - Transition conflict status
  router.post('/conflicts/:conflictId/transition', (req, res, next) => {
    try {
      const { conflictId } = req.params;
      const { new_status } = req.body;

      // Validate required field
      if (!new_status) {
        return res.status(400).json({
          error: 'Missing required field: new_status'
        });
      }

      // Validate status enum
      const validStatuses = ['latent', 'active', 'escalating', 'climactic', 'resolved'];
      if (!validStatuses.includes(new_status)) {
        return res.status(400).json({
          error: `Invalid new_status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const updated = api.storyConflicts.transitionConflictStatus(conflictId, new_status);

      if (!updated) {
        return res.status(404).json({ error: 'Story conflict not found' });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/logic/conflicts/:conflictId - Delete conflict
  router.delete('/conflicts/:conflictId', (req, res, next) => {
    try {
      const { conflictId } = req.params;
      const deleted = api.storyConflicts.deleteConflict(conflictId);

      if (!deleted) {
        return res.status(404).json({ error: 'Story conflict not found' });
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // ============================================================
  // THEMATIC ELEMENTS ENDPOINTS
  // ============================================================

  // POST /api/logic/themes - Create thematic element
  router.post('/themes', (req, res, next) => {
    try {
      const { project_id, statement, primary_symbol_id, question, manifestations } = req.body;

      // Validate required fields
      if (!project_id || !statement) {
        return res.status(400).json({
          error: 'Missing required fields: project_id, statement'
        });
      }

      const theme = api.thematicElements.createTheme({
        project_id,
        statement,
        primary_symbol_id,
        question,
        manifestations
      });

      res.status(201).json(theme);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logic/themes/:themeId - Get single theme
  router.get('/themes/:themeId', (req, res, next) => {
    try {
      const { themeId } = req.params;
      const theme = api.thematicElements.getThemeById(themeId);

      if (!theme) {
        return res.status(404).json({ error: 'Theme not found' });
      }

      res.json(theme);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logic/themes/project/:projectId - Get all themes for project
  router.get('/themes/project/:projectId', (req, res, next) => {
    try {
      const { projectId } = req.params;
      const themes = api.thematicElements.getThemesByProject(projectId);
      res.json(themes);
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/logic/themes/:themeId - Update theme
  router.put('/themes/:themeId', (req, res, next) => {
    try {
      const { themeId } = req.params;
      const updates = req.body;

      const result = api.thematicElements.updateTheme(themeId, updates);

      if (result === 0) {
        return res.status(404).json({ error: 'Theme not found' });
      }

      // Fetch and return updated theme
      const updated = api.thematicElements.getThemeById(themeId);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/logic/themes/:themeId/manifestations - Add manifestation to theme
  router.post('/themes/:themeId/manifestations', (req, res, next) => {
    try {
      const { themeId } = req.params;
      const { manifestation } = req.body;

      if (!manifestation) {
        return res.status(400).json({
          error: 'Missing required field: manifestation'
        });
      }

      const result = api.thematicElements.addManifestation(themeId, manifestation);

      if (result === 0) {
        return res.status(404).json({ error: 'Theme not found' });
      }

      // Fetch and return updated theme
      const updated = api.thematicElements.getThemeById(themeId);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/logic/themes/:themeId/manifestations/:index - Remove manifestation
  router.delete('/themes/:themeId/manifestations/:index', (req, res, next) => {
    try {
      const { themeId, index } = req.params;
      const manifestationIndex = parseInt(index);

      if (isNaN(manifestationIndex)) {
        return res.status(400).json({
          error: 'Invalid manifestation index'
        });
      }

      const result = api.thematicElements.removeManifestation(themeId, manifestationIndex);

      if (result === 0) {
        return res.status(404).json({ error: 'Theme not found or invalid index' });
      }

      // Fetch and return updated theme
      const updated = api.thematicElements.getThemeById(themeId);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/logic/themes/:themeId - Delete theme
  router.delete('/themes/:themeId', (req, res, next) => {
    try {
      const { themeId } = req.params;
      const deleted = api.thematicElements.deleteTheme(themeId);

      if (!deleted) {
        return res.status(404).json({ error: 'Theme not found' });
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // ============================================================
  // MOTIF INSTANCES ENDPOINTS
  // ============================================================

  // POST /api/logic/motifs - Create motif instance
  router.post('/motifs', (req, res, next) => {
    try {
      const { project_id, motif_type, linked_entity_id, description, significance } = req.body;

      // Validate required fields
      if (!project_id || !motif_type) {
        return res.status(400).json({
          error: 'Missing required fields: project_id, motif_type'
        });
      }

      // Validate motif_type enum
      const validTypes = ['visual', 'auditory', 'symbolic', 'narrative_pattern', 'recurring_phrase'];
      if (!validTypes.includes(motif_type)) {
        return res.status(400).json({
          error: `Invalid motif_type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      const motif = api.motifInstances.createMotifInstance({
        project_id,
        motif_type,
        linked_entity_id,
        description,
        significance
      });

      res.status(201).json(motif);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logic/motifs/:motifId - Get single motif
  router.get('/motifs/:motifId', (req, res, next) => {
    try {
      const { motifId } = req.params;
      const motif = api.motifInstances.getMotifInstanceById(motifId);

      if (!motif) {
        return res.status(404).json({ error: 'Motif not found' });
      }

      res.json(motif);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logic/motifs/type/:type - Get all motifs of specific type
  router.get('/motifs/type/:type', (req, res, next) => {
    try {
      const { type } = req.params;
      const { project_id } = req.query;

      if (!project_id) {
        return res.status(400).json({
          error: 'Missing required query parameter: project_id'
        });
      }

      const motifs = api.motifInstances.getMotifInstancesByType(project_id, type);
      res.json(motifs);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logic/motifs/project/:projectId - Get all motifs for project
  router.get('/motifs/project/:projectId', (req, res, next) => {
    try {
      const { projectId } = req.params;
      const motifs = api.motifInstances.getMotifInstancesByProject(projectId);
      res.json(motifs);
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/logic/motifs/:motifId - Update motif
  router.put('/motifs/:motifId', (req, res, next) => {
    try {
      const { motifId } = req.params;
      const updates = req.body;

      const updated = api.motifInstances.updateMotifInstance(motifId, updates);

      if (!updated) {
        return res.status(404).json({ error: 'Motif not found' });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/logic/motifs/:motifId - Delete motif
  router.delete('/motifs/:motifId', (req, res, next) => {
    try {
      const { motifId } = req.params;
      const result = api.motifInstances.deleteMotifInstance(motifId);

      if (!result.deleted) {
        return res.status(404).json({ error: 'Motif not found' });
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // ============================================================
  // SETUP PAYOFFS ENDPOINTS
  // ============================================================

  // POST /api/logic/setup-payoffs - Create setup/payoff
  router.post('/setup-payoffs', (req, res, next) => {
    try {
      const { project_id, setup_event_id, payoff_event_id, description, status, planted_chapter, fired_chapter } = req.body;

      // Validate required fields
      if (!project_id || !setup_event_id || !description) {
        return res.status(400).json({
          error: 'Missing required fields: project_id, setup_event_id, description'
        });
      }

      // Validate status enum if provided
      if (status) {
        const validStatuses = ['planted', 'referenced', 'fired', 'unfired'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
          });
        }
      }

      const setup = api.setupPayoffs.createSetupPayoff({
        project_id,
        setup_event_id,
        payoff_event_id,
        description,
        status,
        planted_chapter,
        fired_chapter
      });

      res.status(201).json(setup);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logic/setup-payoffs/:setupId - Get single setup/payoff
  router.get('/setup-payoffs/:setupId', (req, res, next) => {
    try {
      const { setupId } = req.params;
      const setup = api.setupPayoffs.getSetupPayoffById(setupId);

      if (!setup) {
        return res.status(404).json({ error: 'Setup/payoff not found' });
      }

      res.json(setup);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logic/setup-payoffs/project/:projectId - Get all setups for project
  router.get('/setup-payoffs/project/:projectId', (req, res, next) => {
    try {
      const { projectId } = req.params;
      const setups = api.setupPayoffs.getSetupPayoffsByProject(projectId);
      res.json(setups);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logic/setup-payoffs/unfired - Get unfired setups (Chekhov's gun tracker)
  router.get('/setup-payoffs/unfired', (req, res, next) => {
    try {
      const { project_id } = req.query;

      if (!project_id) {
        return res.status(400).json({
          error: 'Missing required query parameter: project_id'
        });
      }

      const unfiredSetups = api.setupPayoffs.getUnfiredSetups(project_id);
      res.json(unfiredSetups);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/logic/setup-payoffs/:setupId/fire - Fire setup (helper endpoint)
  router.post('/setup-payoffs/:setupId/fire', (req, res, next) => {
    try {
      const { setupId } = req.params;
      const { payoff_event_id, fired_chapter } = req.body;

      if (!payoff_event_id || !fired_chapter) {
        return res.status(400).json({
          error: 'Missing required fields: payoff_event_id, fired_chapter'
        });
      }

      const updated = api.setupPayoffs.fireSetup(setupId, payoff_event_id, fired_chapter);

      if (!updated) {
        return res.status(404).json({ error: 'Setup/payoff not found' });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/logic/setup-payoffs/:setupId - Update setup
  router.put('/setup-payoffs/:setupId', (req, res, next) => {
    try {
      const { setupId } = req.params;
      const updates = req.body;

      const updated = api.setupPayoffs.updateSetupPayoff(setupId, updates);

      if (!updated) {
        return res.status(404).json({ error: 'Setup/payoff not found' });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/logic/setup-payoffs/:setupId - Delete setup
  router.delete('/setup-payoffs/:setupId', (req, res, next) => {
    try {
      const { setupId } = req.params;
      const result = api.setupPayoffs.deleteSetupPayoff(setupId);

      if (!result.deleted) {
        return res.status(404).json({ error: 'Setup/payoff not found' });
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // ============================================================
  // WORLD RULES ENDPOINTS
  // ============================================================

  // POST /api/logic/world-rules - Create world rule
  router.post('/world-rules', (req, res, next) => {
    try {
      const { project_id, rule_category, statement, exceptions, enforcement_level } = req.body;

      // Validate required fields
      if (!project_id || !rule_category || !statement) {
        return res.status(400).json({
          error: 'Missing required fields: project_id, rule_category, statement'
        });
      }

      // Validate rule_category enum
      const validCategories = ['physics', 'magic', 'technology', 'social', 'biological', 'metaphysical'];
      if (!validCategories.includes(rule_category)) {
        return res.status(400).json({
          error: `Invalid rule_category. Must be one of: ${validCategories.join(', ')}`
        });
      }

      // Validate enforcement_level enum if provided
      if (enforcement_level) {
        const validLevels = ['strict', 'flexible', 'guideline'];
        if (!validLevels.includes(enforcement_level)) {
          return res.status(400).json({
            error: `Invalid enforcement_level. Must be one of: ${validLevels.join(', ')}`
          });
        }
      }

      const rule = api.worldRules.createWorldRule({
        project_id,
        rule_category,
        statement,
        exceptions,
        enforcement_level
      });

      res.status(201).json(rule);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logic/world-rules/:ruleId - Get single rule
  router.get('/world-rules/:ruleId', (req, res, next) => {
    try {
      const { ruleId } = req.params;
      const rule = api.worldRules.getWorldRuleById(ruleId);

      if (!rule) {
        return res.status(404).json({ error: 'World rule not found' });
      }

      res.json(rule);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logic/world-rules/category/:category - Get all rules in category
  router.get('/world-rules/category/:category', (req, res, next) => {
    try {
      const { category } = req.params;
      const { project_id } = req.query;

      if (!project_id) {
        return res.status(400).json({
          error: 'Missing required query parameter: project_id'
        });
      }

      const rules = api.worldRules.getWorldRulesByCategory(project_id, category);
      res.json(rules);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/logic/world-rules/project/:projectId - Get all rules for project
  router.get('/world-rules/project/:projectId', (req, res, next) => {
    try {
      const { projectId } = req.params;
      const rules = api.worldRules.getWorldRulesByProject(projectId);
      res.json(rules);
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/logic/world-rules/:ruleId - Update rule
  router.put('/world-rules/:ruleId', (req, res, next) => {
    try {
      const { ruleId } = req.params;
      const updates = req.body;

      const result = api.worldRules.updateWorldRule(ruleId, updates);

      if (result === 0) {
        return res.status(404).json({ error: 'World rule not found' });
      }

      // Fetch and return updated rule
      const updated = api.worldRules.getWorldRuleById(ruleId);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/logic/world-rules/:ruleId - Delete rule
  router.delete('/world-rules/:ruleId', (req, res, next) => {
    try {
      const { ruleId } = req.params;
      const result = api.worldRules.deleteWorldRule(ruleId);

      if (!result.deleted) {
        return res.status(404).json({ error: 'World rule not found' });
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
};
