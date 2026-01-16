// Moments API Routes
// REST endpoints for EVENT_MOMENTS table
// Provides granular beat tracking within events

const express = require('express');
const eventMoments = require('../../db/modules/event-moments');

module.exports = (db) => {
  const router = express.Router();
  const moments = eventMoments(db);

  // POST /api/moments - Create new moment
  router.post('/', (req, res, next) => {
    try {
      const { event_uuid, sequence_index, beat_description, timestamp_offset } = req.body;

      // Validate required fields
      if (!event_uuid || sequence_index === undefined || !beat_description) {
        return res.status(400).json({ error: 'Missing required fields: event_uuid, sequence_index, beat_description' });
      }

      const moment = moments.createMoment(event_uuid, sequence_index, beat_description, timestamp_offset);
      res.status(201).json(moment);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/moments/:eventUuid - Get all moments for an event
  router.get('/:eventUuid', (req, res, next) => {
    try {
      const { eventUuid } = req.params;
      const momentsList = moments.getMomentsByEvent(eventUuid);
      res.json(momentsList);
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/moments/:momentUuid - Update a moment
  router.put('/:momentUuid', (req, res, next) => {
    try {
      const { momentUuid } = req.params;
      const updates = req.body;

      const updated = moments.updateMoment(momentUuid, updates);
      if (!updated) {
        return res.status(404).json({ error: 'Moment not found' });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/moments/:momentUuid - Delete a moment
  router.delete('/:momentUuid', (req, res, next) => {
    try {
      const { momentUuid } = req.params;
      const deleted = moments.deleteMoment(momentUuid);

      if (!deleted) {
        return res.status(404).json({ error: 'Moment not found' });
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
};
