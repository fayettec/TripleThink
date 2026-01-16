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

  return router;
};
