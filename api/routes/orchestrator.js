// Orchestrator API Routes
// Endpoints for context assembly and narrative orchestration

const express = require('express');
const orchestrator = require('../services/orchestrator');
const scenes = require('../../db/modules/scenes');
const transitions = require('../../db/modules/transitions');
const pacing = require('../../db/modules/pacing');

module.exports = function createOrchestratorRoutes(db) {
  const router = express.Router();

  // ==================== CONTEXT ASSEMBLY ====================

  // Get complete context packet for a scene - THE PRIMARY ENDPOINT
  router.get('/:sceneId', async (req, res) => {
    try {
      const { sceneId } = req.params;
      const context = await orchestrator.assembleContext(db, sceneId);
      res.json(context);
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // Get quick/lightweight context for a scene
  router.get('/:sceneId/quick', async (req, res) => {
    try {
      const { sceneId } = req.params;
      const context = await orchestrator.assembleQuickContext(db, sceneId);
      res.json(context);
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== SCENES ====================

  // Create a new scene
  router.post('/scenes', (req, res) => {
    try {
      const scene = scenes.createScene(db, req.body);
      res.status(201).json(scene);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get scene by ID
  router.get('/scenes/:sceneId', (req, res) => {
    try {
      const scene = scenes.getScene(db, req.params.sceneId);
      if (!scene) {
        return res.status(404).json({ error: 'Scene not found' });
      }
      res.json(scene);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all scenes in a fiction
  router.get('/fictions/:fictionId/scenes', (req, res) => {
    try {
      const { fictionId } = req.params;
      const { chapterId, status, limit, offset } = req.query;

      const sceneList = scenes.getScenesInFiction(db, fictionId, {
        chapterId,
        status,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined
      });

      res.json({
        fictionId,
        scenes: sceneList,
        count: sceneList.length
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update a scene
  router.patch('/scenes/:sceneId', (req, res) => {
    try {
      const updated = scenes.updateScene(db, req.params.sceneId, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Scene not found' });
      }
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete a scene
  router.delete('/scenes/:sceneId', (req, res) => {
    try {
      const deleted = scenes.deleteScene(db, req.params.sceneId);
      if (!deleted) {
        return res.status(404).json({ error: 'Scene not found' });
      }
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get scene stats for a fiction
  router.get('/fictions/:fictionId/scenes/stats', (req, res) => {
    try {
      const stats = scenes.getSceneStats(db, req.params.fictionId);
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== TRANSITIONS ====================

  // Create a transition
  router.post('/transitions', (req, res) => {
    try {
      const transition = transitions.createTransition(db, req.body);
      res.status(201).json(transition);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get transition by ID
  router.get('/transitions/:transitionId', (req, res) => {
    try {
      const transition = transitions.getTransition(db, req.params.transitionId);
      if (!transition) {
        return res.status(404).json({ error: 'Transition not found' });
      }
      res.json(transition);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Validate a transition
  router.post('/transitions/:transitionId/validate', (req, res) => {
    try {
      const result = transitions.validateContinuity(db, req.params.transitionId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Validate all transitions in a fiction
  router.post('/fictions/:fictionId/transitions/validate', (req, res) => {
    try {
      const result = transitions.validateAllTransitions(db, req.params.fictionId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auto-create transitions for a fiction
  router.post('/fictions/:fictionId/transitions/auto-create', (req, res) => {
    try {
      const created = transitions.autoCreateTransitions(db, req.params.fictionId);
      res.status(201).json({
        created: created.length,
        transitions: created
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== PACING ====================

  // Create a pacing checkpoint
  router.post('/checkpoints', (req, res) => {
    try {
      const checkpoint = pacing.createCheckpoint(db, req.body);
      res.status(201).json(checkpoint);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get tension curve for a fiction
  router.get('/fictions/:fictionId/tension-curve', (req, res) => {
    try {
      const { startTime, endTime } = req.query;
      const curve = pacing.getTensionCurve(db, req.params.fictionId, {
        startTime: startTime ? parseInt(startTime) : undefined,
        endTime: endTime ? parseInt(endTime) : undefined
      });
      res.json(curve);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Analyze pacing for a fiction
  router.get('/fictions/:fictionId/pacing/analyze', (req, res) => {
    try {
      const analysis = pacing.analyzePacing(db, req.params.fictionId);
      res.json(analysis);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create a vent moment
  router.post('/vent-moments', (req, res) => {
    try {
      const ventMoment = pacing.createVentMoment(db, req.body);
      res.status(201).json(ventMoment);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get vent moments for a scene
  router.get('/scenes/:sceneId/vent-moments', (req, res) => {
    try {
      const ventMoments = pacing.getVentMomentsInScene(db, req.params.sceneId);
      res.json({
        sceneId: req.params.sceneId,
        ventMoments,
        count: ventMoments.length
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
