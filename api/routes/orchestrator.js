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

  // Batch update scene sequences (for renumbering)
  router.patch('/scenes/batch', (req, res) => {
    try {
      const { updates } = req.body;

      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ error: 'updates array required' });
      }

      const results = [];
      for (const update of updates) {
        const { sceneId, sceneNumber, chapterId } = update;
        if (!sceneId) continue;

        const updateData = {};
        if (sceneNumber !== undefined) updateData.sceneNumber = sceneNumber;
        if (chapterId !== undefined) updateData.chapterId = chapterId;

        const updated = scenes.updateScene(db, sceneId, updateData);
        if (updated) {
          results.push(updated);
        }
      }

      res.json({
        updated: results.length,
        scenes: results
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Split chapter at scene index
  router.post('/chapters/:chapterId/split', (req, res) => {
    try {
      const { chapterId } = req.params;
      const { splitIndex } = req.body;

      // Validate splitIndex
      if (!splitIndex || splitIndex < 2) {
        return res.status(400).json({ error: 'splitIndex must be >= 2' });
      }

      // Get all scenes for this chapter (from any fiction - we'll need the fiction ID)
      // We need to get scenes by chapterId, but the scenes module uses fictionId as primary filter
      // For now, we'll get all scenes and filter by chapterId
      const allScenes = db.prepare(`
        SELECT * FROM narrative_scenes WHERE chapter_id = ? ORDER BY scene_number ASC
      `).all(chapterId);

      if (allScenes.length < 2) {
        return res.status(400).json({ error: 'Chapter must have at least 2 scenes' });
      }

      if (splitIndex > allScenes.length) {
        return res.status(400).json({ error: `splitIndex ${splitIndex} exceeds scene count ${allScenes.length}` });
      }

      // Create new chapter ID
      const newChapterId = `ch-${Date.now()}`;

      // Update scenes: scenes[splitIndex-1:] move to new chapter
      const scenesToMove = allScenes.slice(splitIndex - 1);
      for (let i = 0; i < scenesToMove.length; i++) {
        const scene = scenesToMove[i];
        scenes.updateScene(db, scene.id, {
          chapterId: newChapterId,
          sceneNumber: i + 1
        });
      }

      // Renumber remaining scenes in original chapter
      const remainingScenes = allScenes.slice(0, splitIndex - 1);
      for (let i = 0; i < remainingScenes.length; i++) {
        scenes.updateScene(db, remainingScenes[i].id, { sceneNumber: i + 1 });
      }

      res.json({
        originalChapter: chapterId,
        newChapter: newChapterId,
        scenesMoved: scenesToMove.length,
        scenesRemaining: remainingScenes.length
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Merge two chapters
  router.post('/chapters/merge', (req, res) => {
    try {
      const { chapter1Id, chapter2Id } = req.body;

      if (!chapter1Id || !chapter2Id) {
        return res.status(400).json({ error: 'Both chapter1Id and chapter2Id required' });
      }

      // Get scenes for both chapters
      const chapter1Scenes = db.prepare(`
        SELECT * FROM narrative_scenes WHERE chapter_id = ? ORDER BY scene_number ASC
      `).all(chapter1Id);

      const chapter2Scenes = db.prepare(`
        SELECT * FROM narrative_scenes WHERE chapter_id = ? ORDER BY scene_number ASC
      `).all(chapter2Id);

      // Move all chapter2 scenes to chapter1
      for (let i = 0; i < chapter2Scenes.length; i++) {
        const scene = chapter2Scenes[i];
        scenes.updateScene(db, scene.id, { chapterId: chapter1Id });
      }

      // Renumber all scenes in merged chapter
      const allScenes = [...chapter1Scenes, ...chapter2Scenes];
      for (let i = 0; i < allScenes.length; i++) {
        scenes.updateScene(db, allScenes[i].id, { sceneNumber: i + 1 });
      }

      res.json({
        mergedChapter: chapter1Id,
        deletedChapter: chapter2Id,
        totalScenes: allScenes.length
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Rename a chapter (architectural limitation - chapters are ID-based)
  router.patch('/chapters/:chapterId', (req, res) => {
    try {
      const { chapterId } = req.params;
      const { title } = req.body;

      // Validate title
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'title is required and must be non-empty string' });
      }

      // Get all scenes for this chapter to verify it exists
      // Note: Using narrative_scenes (real table name), not scenes (typo in split/merge endpoints)
      const scenesInChapter = db.prepare(`
        SELECT id FROM narrative_scenes WHERE chapter_id = ?
      `).all(chapterId);

      if (scenesInChapter.length === 0) {
        return res.status(404).json({ error: `Chapter ${chapterId} not found` });
      }

      // Note: Chapters in this system are logical groupings (scenes with same chapter_id)
      // They don't have separate titles - the chapter_id IS the identifier
      // To support chapter titles would require either:
      // 1. A separate chapters table (heavyweight for current architecture)
      // 2. Storing metadata in a JSON field somewhere
      // For now, return success but note limitation
      res.json({
        chapterId,
        message: 'Chapter ID is immutable. To change chapter organization, use split/merge operations.',
        sceneCount: scenesInChapter.length,
        requestedTitle: title
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete a chapter (deletes all scenes in the chapter)
  router.delete('/chapters/:chapterId', (req, res) => {
    try {
      const { chapterId } = req.params;

      // Get all scenes for this chapter
      // Note: Using narrative_scenes (real table name), not scenes (typo in split/merge endpoints)
      const scenesInChapter = db.prepare(`
        SELECT id FROM narrative_scenes WHERE chapter_id = ?
      `).all(chapterId);

      if (scenesInChapter.length === 0) {
        return res.status(404).json({ error: `Chapter ${chapterId} not found` });
      }

      // Delete all scenes in this chapter
      let deletedCount = 0;
      for (const scene of scenesInChapter) {
        scenes.deleteScene(db, scene.id);
        deletedCount++;
      }

      res.json({
        chapterId,
        deletedScenes: deletedCount,
        message: `Chapter ${chapterId} and its ${deletedCount} scene(s) deleted`
      });
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
