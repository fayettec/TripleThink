// Pacing Module - Tension Curve and Checkpoint Management
// CRUD operations for pacing checkpoints and tension analysis
// Event sourcing: records are append-only

const { v4: uuid } = require('uuid');
const scenes = require('./scenes');

/**
 * Create a new pacing checkpoint
 */
function createCheckpoint(db, {
  fictionId,
  sceneId = null,
  chapterId = null,
  checkpointType,
  narrativeTime,
  tensionTarget,
  actualTension = null,
  emotionalBeat = null,
  stakesEscalation = null,
  characterGrowthNotes = null,
  audienceKnowledge = null,
  dramaticIronyLevel = 0.0,
  notes = null
}) {
  const id = uuid();
  const createdAt = Date.now();

  db.prepare(`
    INSERT INTO pacing_checkpoints
    (id, fiction_id, scene_id, chapter_id, checkpoint_type, narrative_time,
     tension_target, actual_tension, emotional_beat, stakes_escalation,
     character_growth_notes, audience_knowledge, dramatic_irony_level, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, fictionId, sceneId, chapterId, checkpointType, narrativeTime,
    tensionTarget, actualTension, emotionalBeat, stakesEscalation,
    characterGrowthNotes, audienceKnowledge ? JSON.stringify(audienceKnowledge) : null,
    dramaticIronyLevel, notes, createdAt
  );

  return {
    id,
    fictionId,
    sceneId,
    chapterId,
    checkpointType,
    narrativeTime,
    tensionTarget,
    actualTension,
    emotionalBeat,
    stakesEscalation,
    characterGrowthNotes,
    audienceKnowledge,
    dramaticIronyLevel,
    notes,
    createdAt
  };
}

/**
 * Get a checkpoint by ID
 */
function getCheckpoint(db, checkpointId) {
  const row = db.prepare(`
    SELECT * FROM pacing_checkpoints WHERE id = ?
  `).get(checkpointId);

  if (!row) return null;

  return mapRowToCheckpoint(row);
}

/**
 * Get all checkpoints in a fiction
 */
function getCheckpointsInFiction(db, fictionId, options = {}) {
  const { checkpointType, chapterId } = options;

  let sql = 'SELECT * FROM pacing_checkpoints WHERE fiction_id = ?';
  const params = [fictionId];

  if (checkpointType) {
    sql += ' AND checkpoint_type = ?';
    params.push(checkpointType);
  }

  if (chapterId) {
    sql += ' AND chapter_id = ?';
    params.push(chapterId);
  }

  sql += ' ORDER BY narrative_time ASC';

  const rows = db.prepare(sql).all(...params);
  return rows.map(mapRowToCheckpoint);
}

/**
 * Get checkpoints for a scene
 */
function getCheckpointsForScene(db, sceneId) {
  const rows = db.prepare(`
    SELECT * FROM pacing_checkpoints
    WHERE scene_id = ?
    ORDER BY narrative_time ASC
  `).all(sceneId);

  return rows.map(mapRowToCheckpoint);
}

/**
 * Get the tension curve for a fiction
 * Returns tension data points over narrative time
 */
function getTensionCurve(db, fictionId, options = {}) {
  const { startTime, endTime, includeScenes = true } = options;

  // Get checkpoints
  let checkpointSql = `
    SELECT narrative_time, tension_target, actual_tension, checkpoint_type, emotional_beat
    FROM pacing_checkpoints
    WHERE fiction_id = ?
  `;
  const checkpointParams = [fictionId];

  if (startTime !== undefined) {
    checkpointSql += ' AND narrative_time >= ?';
    checkpointParams.push(startTime);
  }

  if (endTime !== undefined) {
    checkpointSql += ' AND narrative_time <= ?';
    checkpointParams.push(endTime);
  }

  checkpointSql += ' ORDER BY narrative_time ASC';

  const checkpoints = db.prepare(checkpointSql).all(...checkpointParams);

  // Get scene tension levels if requested
  let sceneTensions = [];
  if (includeScenes) {
    let sceneSql = `
      SELECT narrative_time, tension_level, mood, id as scene_id
      FROM narrative_scenes
      WHERE fiction_id = ?
    `;
    const sceneParams = [fictionId];

    if (startTime !== undefined) {
      sceneSql += ' AND narrative_time >= ?';
      sceneParams.push(startTime);
    }

    if (endTime !== undefined) {
      sceneSql += ' AND narrative_time <= ?';
      sceneParams.push(endTime);
    }

    sceneSql += ' ORDER BY narrative_time ASC';

    sceneTensions = db.prepare(sceneSql).all(...sceneParams);
  }

  // Combine and sort all data points
  const dataPoints = [];

  for (const cp of checkpoints) {
    dataPoints.push({
      time: cp.narrative_time,
      tension: cp.actual_tension !== null ? cp.actual_tension : cp.tension_target,
      tensionTarget: cp.tension_target,
      type: 'checkpoint',
      checkpointType: cp.checkpoint_type,
      emotionalBeat: cp.emotional_beat
    });
  }

  for (const scene of sceneTensions) {
    dataPoints.push({
      time: scene.narrative_time,
      tension: scene.tension_level,
      type: 'scene',
      sceneId: scene.scene_id,
      mood: scene.mood
    });
  }

  // Sort by time
  dataPoints.sort((a, b) => a.time - b.time);

  // Calculate statistics
  const tensions = dataPoints.map(p => p.tension).filter(t => t !== null);
  const stats = {
    min: tensions.length > 0 ? Math.min(...tensions) : 0,
    max: tensions.length > 0 ? Math.max(...tensions) : 0,
    avg: tensions.length > 0 ? tensions.reduce((a, b) => a + b, 0) / tensions.length : 0,
    dataPointCount: dataPoints.length
  };

  return {
    fictionId,
    dataPoints,
    stats,
    timeRange: {
      start: dataPoints.length > 0 ? dataPoints[0].time : null,
      end: dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].time : null
    }
  };
}

/**
 * Analyze pacing for potential issues
 */
function analyzePacing(db, fictionId) {
  const curve = getTensionCurve(db, fictionId);
  const issues = [];

  if (curve.dataPoints.length < 2) {
    return { issues: ['Not enough data points for analysis'], curve };
  }

  // Check for sustained high tension (reader fatigue)
  let highTensionStreak = 0;
  for (const point of curve.dataPoints) {
    if (point.tension > 0.8) {
      highTensionStreak++;
      if (highTensionStreak > 3) {
        issues.push({
          type: 'sustained_high_tension',
          message: 'Tension above 0.8 for 4+ consecutive points - risk of reader fatigue',
          time: point.time
        });
        highTensionStreak = 0; // Reset to avoid duplicate warnings
      }
    } else {
      highTensionStreak = 0;
    }
  }

  // Check for sustained low tension (boring)
  let lowTensionStreak = 0;
  for (const point of curve.dataPoints) {
    if (point.tension < 0.3) {
      lowTensionStreak++;
      if (lowTensionStreak > 5) {
        issues.push({
          type: 'sustained_low_tension',
          message: 'Tension below 0.3 for 6+ consecutive points - risk of reader disengagement',
          time: point.time
        });
        lowTensionStreak = 0;
      }
    } else {
      lowTensionStreak = 0;
    }
  }

  // Check for missing key checkpoints
  const checkpointTypes = new Set(
    curve.dataPoints
      .filter(p => p.type === 'checkpoint')
      .map(p => p.checkpointType)
  );

  const requiredCheckpoints = ['inciting_incident', 'midpoint', 'climax'];
  for (const required of requiredCheckpoints) {
    if (!checkpointTypes.has(required)) {
      issues.push({
        type: 'missing_checkpoint',
        message: `Missing ${required} checkpoint`,
        checkpointType: required
      });
    }
  }

  // Check tension target vs actual mismatches
  const checkpointsWithActual = curve.dataPoints.filter(
    p => p.type === 'checkpoint' && p.tensionTarget !== undefined
  );

  for (const cp of checkpointsWithActual) {
    if (cp.tension !== null && cp.tensionTarget !== null) {
      const diff = Math.abs(cp.tension - cp.tensionTarget);
      if (diff > 0.2) {
        issues.push({
          type: 'tension_mismatch',
          message: `Tension at ${cp.checkpointType} differs from target by ${diff.toFixed(2)}`,
          time: cp.time,
          actual: cp.tension,
          target: cp.tensionTarget
        });
      }
    }
  }

  return {
    issues,
    curve,
    summary: {
      issueCount: issues.length,
      avgTension: curve.stats.avg,
      tensionRange: curve.stats.max - curve.stats.min
    }
  };
}

/**
 * Update checkpoint with actual tension
 */
function updateActualTension(db, checkpointId, actualTension) {
  db.prepare(`
    UPDATE pacing_checkpoints
    SET actual_tension = ?
    WHERE id = ?
  `).run(actualTension, checkpointId);

  return getCheckpoint(db, checkpointId);
}

/**
 * Delete a checkpoint
 */
function deleteCheckpoint(db, checkpointId) {
  const result = db.prepare('DELETE FROM pacing_checkpoints WHERE id = ?').run(checkpointId);
  return result.changes > 0;
}

/**
 * Create a vent moment
 */
function createVentMoment(db, {
  fictionId,
  sceneId,
  entityId,
  ventType,
  triggerEvent = null,
  emotionalPeak,
  tensionBefore,
  tensionAfter,
  durationBeats = null,
  affectedEntityIds = [],
  relationshipImpacts = {},
  revealedFacts = [],
  narrativeTime
}) {
  const id = uuid();
  const createdAt = Date.now();

  db.prepare(`
    INSERT INTO vent_moments
    (id, fiction_id, scene_id, entity_id, vent_type, trigger_event, emotional_peak,
     tension_before, tension_after, duration_beats, affected_entity_ids,
     relationship_impacts, revealed_facts, narrative_time, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, fictionId, sceneId, entityId, ventType, triggerEvent, emotionalPeak,
    tensionBefore, tensionAfter, durationBeats, JSON.stringify(affectedEntityIds),
    JSON.stringify(relationshipImpacts), JSON.stringify(revealedFacts),
    narrativeTime, createdAt
  );

  return {
    id,
    fictionId,
    sceneId,
    entityId,
    ventType,
    triggerEvent,
    emotionalPeak,
    tensionBefore,
    tensionAfter,
    durationBeats,
    affectedEntityIds,
    relationshipImpacts,
    revealedFacts,
    narrativeTime,
    createdAt
  };
}

/**
 * Get vent moments in a scene
 */
function getVentMomentsInScene(db, sceneId) {
  const rows = db.prepare(`
    SELECT * FROM vent_moments
    WHERE scene_id = ?
    ORDER BY narrative_time ASC
  `).all(sceneId);

  return rows.map(mapRowToVentMoment);
}

/**
 * Get vent moments for an entity
 */
function getVentMomentsForEntity(db, entityId, fictionId) {
  const rows = db.prepare(`
    SELECT * FROM vent_moments
    WHERE entity_id = ? AND fiction_id = ?
    ORDER BY narrative_time ASC
  `).all(entityId, fictionId);

  return rows.map(mapRowToVentMoment);
}

/**
 * Map database row to checkpoint object
 */
function mapRowToCheckpoint(row) {
  return {
    id: row.id,
    fictionId: row.fiction_id,
    sceneId: row.scene_id,
    chapterId: row.chapter_id,
    checkpointType: row.checkpoint_type,
    narrativeTime: row.narrative_time,
    tensionTarget: row.tension_target,
    actualTension: row.actual_tension,
    emotionalBeat: row.emotional_beat,
    stakesEscalation: row.stakes_escalation,
    characterGrowthNotes: row.character_growth_notes,
    audienceKnowledge: row.audience_knowledge ? JSON.parse(row.audience_knowledge) : null,
    dramaticIronyLevel: row.dramatic_irony_level,
    notes: row.notes,
    createdAt: row.created_at
  };
}

/**
 * Map database row to vent moment object
 */
function mapRowToVentMoment(row) {
  return {
    id: row.id,
    fictionId: row.fiction_id,
    sceneId: row.scene_id,
    entityId: row.entity_id,
    ventType: row.vent_type,
    triggerEvent: row.trigger_event,
    emotionalPeak: row.emotional_peak,
    tensionBefore: row.tension_before,
    tensionAfter: row.tension_after,
    durationBeats: row.duration_beats,
    affectedEntityIds: JSON.parse(row.affected_entity_ids || '[]'),
    relationshipImpacts: JSON.parse(row.relationship_impacts || '{}'),
    revealedFacts: JSON.parse(row.revealed_facts || '[]'),
    narrativeTime: row.narrative_time,
    createdAt: row.created_at
  };
}

module.exports = {
  createCheckpoint,
  getCheckpoint,
  getCheckpointsInFiction,
  getCheckpointsForScene,
  getTensionCurve,
  analyzePacing,
  updateActualTension,
  deleteCheckpoint,
  createVentMoment,
  getVentMomentsInScene,
  getVentMomentsForEntity
};
