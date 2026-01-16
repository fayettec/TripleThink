// State API Routes
// Endpoints for retrieving and managing asset state

const express = require('express');
const stateReconstruction = require('../../db/modules/state-reconstruction');

module.exports = function createStateRoutes(db) {
  const router = express.Router();

  // Get asset state at a specific event
  router.get('/:assetId/at/:eventId', (req, res) => {
    try {
      const { assetId, eventId } = req.params;

      const state = stateReconstruction.reconstructStateAt(db, assetId, eventId);

      res.json({
        assetId,
        eventId,
        state,
        timestamp: Date.now()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get current state
  router.get('/:assetId', (req, res) => {
    try {
      const { assetId } = req.params;

      // Get the latest event for this asset
      const latestEvent = db.prepare(`
        SELECT event_id FROM asset_state_deltas
        WHERE asset_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `).get(assetId);

      if (!latestEvent && !db.prepare(`
        SELECT event_id FROM asset_state_snapshots
        WHERE asset_id = ?
        LIMIT 1
      `).get(assetId)) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      const eventId = latestEvent?.event_id || Date.now().toString();
      const state = stateReconstruction.reconstructStateAt(db, assetId, eventId);

      res.json({
        assetId,
        eventId,
        state,
        timestamp: Date.now()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get cache stats
  router.get('/stats/cache', (req, res) => {
    try {
      const stats = stateReconstruction.getCacheStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
