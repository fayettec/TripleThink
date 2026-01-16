// Epistemic API Routes
// Endpoints for knowledge tracking, relationships, and dialogue profiles

const express = require('express');
const epistemic = require('../../db/modules/epistemic');
const relationships = require('../../db/modules/relationships');
const dialogue = require('../../db/modules/dialogue');

module.exports = function createEpistemicRoutes(db) {
  const router = express.Router();

  // ==================== EPISTEMIC FACT LEDGER ====================

  // Record a new fact
  router.post('/facts', (req, res) => {
    try {
      const fact = epistemic.recordFact(db, req.body);
      res.status(201).json(fact);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get fact by ID
  router.get('/facts/:factId', (req, res) => {
    try {
      const fact = epistemic.getFact(db, req.params.factId);
      if (!fact) {
        return res.status(404).json({ error: 'Fact not found' });
      }
      res.json(fact);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Query knowledge at a specific time
  router.get('/entities/:entityId/knowledge', (req, res) => {
    try {
      const { entityId } = req.params;
      const { timestamp, factType, factKey, fictionId } = req.query;

      if (!timestamp) {
        return res.status(400).json({ error: 'timestamp query parameter required' });
      }

      const knowledge = epistemic.queryKnowledgeAt(db, entityId, parseInt(timestamp), {
        factType,
        factKey,
        fictionId
      });

      res.json({
        entityId,
        timestamp: parseInt(timestamp),
        facts: knowledge,
        count: knowledge.length
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get specific fact at time
  router.get('/entities/:entityId/knowledge/:factType/:factKey', (req, res) => {
    try {
      const { entityId, factType, factKey } = req.params;
      const { timestamp } = req.query;

      if (!timestamp) {
        return res.status(400).json({ error: 'timestamp query parameter required' });
      }

      const fact = epistemic.getFactAt(db, entityId, factType, factKey, parseInt(timestamp));

      if (!fact) {
        return res.status(404).json({
          error: 'Fact not known',
          entityId,
          factType,
          factKey,
          timestamp: parseInt(timestamp)
        });
      }

      res.json(fact);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get knowledge divergence between two entities
  router.get('/divergence/:entityAId/:entityBId', (req, res) => {
    try {
      const { entityAId, entityBId } = req.params;
      const { timestamp, fictionId } = req.query;

      if (!timestamp) {
        return res.status(400).json({ error: 'timestamp query parameter required' });
      }

      const divergence = epistemic.getDivergence(
        db, entityAId, entityBId, parseInt(timestamp), { fictionId }
      );

      res.json(divergence);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all entities who know a fact
  router.get('/knowers/:factType/:factKey', (req, res) => {
    try {
      const { factType, factKey } = req.params;
      const { timestamp, fictionId } = req.query;

      if (!timestamp) {
        return res.status(400).json({ error: 'timestamp query parameter required' });
      }

      const knowers = epistemic.getKnowers(db, factType, factKey, parseInt(timestamp), {
        fictionId
      });

      res.json({
        factType,
        factKey,
        timestamp: parseInt(timestamp),
        knowers,
        count: knowers.length
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get false beliefs (dramatic irony)
  router.get('/entities/:entityId/false-beliefs', (req, res) => {
    try {
      const { entityId } = req.params;
      const { timestamp, fictionId } = req.query;

      if (!timestamp) {
        return res.status(400).json({ error: 'timestamp query parameter required' });
      }

      const falseBeliefs = epistemic.getFalseBeliefs(db, entityId, parseInt(timestamp), {
        fictionId
      });

      res.json({
        entityId,
        timestamp: parseInt(timestamp),
        falseBeliefs,
        count: falseBeliefs.length
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== RELATIONSHIP DYNAMICS ====================

  // Record a relationship
  router.post('/relationships', (req, res) => {
    try {
      const relationship = relationships.recordRelationship(db, req.body);
      res.status(201).json(relationship);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get relationship by ID
  router.get('/relationships/:relationshipId', (req, res) => {
    try {
      const relationship = relationships.getRelationship(db, req.params.relationshipId);
      if (!relationship) {
        return res.status(404).json({ error: 'Relationship not found' });
      }
      res.json(relationship);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get relationship between two entities at time
  router.get('/relationships/between/:entityAId/:entityBId', (req, res) => {
    try {
      const { entityAId, entityBId } = req.params;
      const { timestamp, relationshipType } = req.query;

      if (!timestamp) {
        return res.status(400).json({ error: 'timestamp query parameter required' });
      }

      const relationship = relationships.getRelationshipAt(
        db, entityAId, entityBId, parseInt(timestamp), { relationshipType }
      );

      if (!relationship) {
        return res.status(404).json({
          error: 'No relationship found',
          entityAId,
          entityBId,
          timestamp: parseInt(timestamp)
        });
      }

      res.json(relationship);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all relationships for an entity
  router.get('/entities/:entityId/relationships', (req, res) => {
    try {
      const { entityId } = req.params;
      const { timestamp, fictionId, relationshipType, status } = req.query;

      if (!timestamp) {
        return res.status(400).json({ error: 'timestamp query parameter required' });
      }

      const rels = relationships.getRelationshipsFor(db, entityId, parseInt(timestamp), {
        fictionId,
        relationshipType,
        status
      });

      res.json({
        entityId,
        timestamp: parseInt(timestamp),
        relationships: rels,
        count: rels.length
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Find conflicts
  router.get('/relationships/conflicts', (req, res) => {
    try {
      const { timestamp, minConflictLevel, fictionId } = req.query;

      if (!timestamp) {
        return res.status(400).json({ error: 'timestamp query parameter required' });
      }

      const conflicts = relationships.findConflicts(
        db, parseFloat(minConflictLevel || 0.5), parseInt(timestamp), { fictionId }
      );

      res.json({
        timestamp: parseInt(timestamp),
        minConflictLevel: parseFloat(minConflictLevel || 0.5),
        conflicts,
        count: conflicts.length
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get relationship delta
  router.get('/relationships/delta/:entityAId/:entityBId', (req, res) => {
    try {
      const { entityAId, entityBId } = req.params;
      const { fromTimestamp, toTimestamp } = req.query;

      if (!fromTimestamp || !toTimestamp) {
        return res.status(400).json({ error: 'fromTimestamp and toTimestamp query parameters required' });
      }

      const delta = relationships.getRelationshipDelta(
        db, entityAId, entityBId, parseInt(fromTimestamp), parseInt(toTimestamp)
      );

      if (!delta) {
        return res.status(404).json({
          error: 'No relationship found in time range',
          entityAId,
          entityBId
        });
      }

      res.json(delta);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== DIALOGUE PROFILES ====================

  // Record a dialogue profile
  router.post('/dialogue-profiles', (req, res) => {
    try {
      const profile = dialogue.recordProfile(db, req.body);
      res.status(201).json(profile);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get profile by ID
  router.get('/dialogue-profiles/:profileId', (req, res) => {
    try {
      const profile = dialogue.getProfile(db, req.params.profileId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      res.json(profile);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get profile for entity at time
  router.get('/entities/:entityId/dialogue-profile', (req, res) => {
    try {
      const { entityId } = req.params;
      const { timestamp } = req.query;

      if (!timestamp) {
        return res.status(400).json({ error: 'timestamp query parameter required' });
      }

      const profile = dialogue.getProfileAt(db, entityId, parseInt(timestamp));

      if (!profile) {
        return res.status(404).json({
          error: 'No dialogue profile found',
          entityId,
          timestamp: parseInt(timestamp)
        });
      }

      res.json(profile);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get voice hints for dialogue generation
  router.get('/entities/:entityId/voice-hints', (req, res) => {
    try {
      const { entityId } = req.params;
      const { timestamp, targetEntityId, context } = req.query;

      if (!timestamp) {
        return res.status(400).json({ error: 'timestamp query parameter required' });
      }

      const hints = dialogue.getVoiceHints(db, entityId, parseInt(timestamp), {
        targetEntityId,
        context
      });

      res.json(hints);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Generate dialogue prompt
  router.get('/entities/:entityId/dialogue-prompt', (req, res) => {
    try {
      const { entityId } = req.params;
      const { timestamp, targetEntityId, context, mood } = req.query;

      if (!timestamp) {
        return res.status(400).json({ error: 'timestamp query parameter required' });
      }

      const prompt = dialogue.generateDialoguePrompt(db, entityId, parseInt(timestamp), {
        targetEntityId,
        context,
        mood
      });

      if (!prompt) {
        return res.status(404).json({
          error: 'No dialogue profile found for prompt generation',
          entityId,
          timestamp: parseInt(timestamp)
        });
      }

      res.json(prompt);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all profiles in fiction
  router.get('/fictions/:fictionId/dialogue-profiles', (req, res) => {
    try {
      const { fictionId } = req.params;
      const { timestamp } = req.query;

      const profiles = dialogue.getProfilesInFiction(
        db, fictionId, timestamp ? parseInt(timestamp) : null
      );

      res.json({
        fictionId,
        timestamp: timestamp ? parseInt(timestamp) : null,
        profiles,
        count: profiles.length
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
