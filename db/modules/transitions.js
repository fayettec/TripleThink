// Transitions Module - Scene Transition Management
// CRUD operations and continuity validation for scene transitions
// Event sourcing: records are append-only

const { v4: uuid } = require('uuid');
const scenes = require('./scenes');

/**
 * Create a new scene transition
 */
function createTransition(db, {
  fictionId,
  fromSceneId,
  toSceneId,
  transitionType,
  timeGapMinutes = null,
  locationChange = false,
  povChange = false,
  continuityNotes = null,
  carriedTensions = [],
  resolvedTensions = [],
  entityStateChanges = {}
}) {
  const id = uuid();
  const createdAt = Date.now();

  db.prepare(`
    INSERT INTO scene_transitions
    (id, fiction_id, from_scene_id, to_scene_id, transition_type, time_gap_minutes,
     location_change, pov_change, continuity_notes, carried_tensions, resolved_tensions,
     entity_state_changes, validation_status, validation_errors, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?)
  `).run(
    id, fictionId, fromSceneId, toSceneId, transitionType, timeGapMinutes,
    locationChange ? 1 : 0, povChange ? 1 : 0, continuityNotes,
    JSON.stringify(carriedTensions), JSON.stringify(resolvedTensions),
    JSON.stringify(entityStateChanges), createdAt
  );

  return {
    id,
    fictionId,
    fromSceneId,
    toSceneId,
    transitionType,
    timeGapMinutes,
    locationChange,
    povChange,
    continuityNotes,
    carriedTensions,
    resolvedTensions,
    entityStateChanges,
    validationStatus: 'pending',
    validationErrors: null,
    createdAt
  };
}

/**
 * Get a transition by ID
 */
function getTransition(db, transitionId) {
  const row = db.prepare(`
    SELECT * FROM scene_transitions WHERE id = ?
  `).get(transitionId);

  if (!row) return null;

  return mapRowToTransition(row);
}

/**
 * Get transition between two specific scenes
 */
function getTransitionBetween(db, fromSceneId, toSceneId) {
  const row = db.prepare(`
    SELECT * FROM scene_transitions
    WHERE from_scene_id = ? AND to_scene_id = ?
  `).get(fromSceneId, toSceneId);

  if (!row) return null;

  return mapRowToTransition(row);
}

/**
 * Get all transitions in a fiction
 */
function getTransitionsInFiction(db, fictionId) {
  const rows = db.prepare(`
    SELECT * FROM scene_transitions
    WHERE fiction_id = ?
    ORDER BY created_at ASC
  `).all(fictionId);

  return rows.map(mapRowToTransition);
}

/**
 * Get transitions from a scene
 */
function getTransitionsFrom(db, sceneId) {
  const rows = db.prepare(`
    SELECT * FROM scene_transitions WHERE from_scene_id = ?
  `).all(sceneId);

  return rows.map(mapRowToTransition);
}

/**
 * Get transitions to a scene
 */
function getTransitionsTo(db, sceneId) {
  const rows = db.prepare(`
    SELECT * FROM scene_transitions WHERE to_scene_id = ?
  `).all(sceneId);

  return rows.map(mapRowToTransition);
}

/**
 * Validate continuity for a transition
 * Checks for logical consistency between scenes
 */
function validateContinuity(db, transitionId) {
  const transition = getTransition(db, transitionId);
  if (!transition) {
    return { valid: false, errors: ['Transition not found'] };
  }

  const fromScene = scenes.getScene(db, transition.fromSceneId);
  const toScene = scenes.getScene(db, transition.toSceneId);

  if (!fromScene || !toScene) {
    return { valid: false, errors: ['One or both scenes not found'] };
  }

  const errors = [];

  // Check temporal consistency
  if (transition.transitionType !== 'flashback' && transition.transitionType !== 'flashforward') {
    if (toScene.narrativeTime < fromScene.narrativeTime) {
      errors.push('To-scene occurs before from-scene without flashback/flashforward type');
    }
  }

  // Check time gap consistency
  const actualGap = toScene.narrativeTime - fromScene.narrativeTime;
  if (transition.timeGapMinutes !== null) {
    const gapDiff = Math.abs(actualGap - transition.timeGapMinutes);
    if (gapDiff > 1) { // Allow 1 minute tolerance
      errors.push(`Time gap mismatch: transition says ${transition.timeGapMinutes}min, actual is ${actualGap}min`);
    }
  }

  // Check location change flag
  if (fromScene.locationId !== toScene.locationId && !transition.locationChange) {
    errors.push('Location changed but locationChange flag is false');
  }

  // Check POV change flag
  if (fromScene.povEntityId !== toScene.povEntityId && !transition.povChange) {
    errors.push('POV changed but povChange flag is false');
  }

  // Check entity continuity - entities exiting from-scene shouldn't be in to-scene
  // unless they're re-entering
  const exitingFromScene = new Set(fromScene.exitingEntityIds);
  const presentInToScene = new Set([
    ...toScene.presentEntityIds,
    ...(toScene.povEntityId ? [toScene.povEntityId] : [])
  ]);

  for (const exitingId of exitingFromScene) {
    if (presentInToScene.has(exitingId) && !toScene.enteringEntityIds.includes(exitingId)) {
      errors.push(`Entity ${exitingId} exited from-scene but is present in to-scene without re-entering`);
    }
  }

  // Update validation status
  const validationStatus = errors.length === 0 ? 'valid' : 'invalid';

  db.prepare(`
    UPDATE scene_transitions
    SET validation_status = ?, validation_errors = ?
    WHERE id = ?
  `).run(validationStatus, errors.length > 0 ? JSON.stringify(errors) : null, transitionId);

  return {
    valid: errors.length === 0,
    errors,
    fromScene: {
      id: fromScene.id,
      narrativeTime: fromScene.narrativeTime,
      locationId: fromScene.locationId,
      povEntityId: fromScene.povEntityId
    },
    toScene: {
      id: toScene.id,
      narrativeTime: toScene.narrativeTime,
      locationId: toScene.locationId,
      povEntityId: toScene.povEntityId
    }
  };
}

/**
 * Validate all transitions in a fiction
 */
function validateAllTransitions(db, fictionId) {
  const transitions = getTransitionsInFiction(db, fictionId);

  const results = {
    total: transitions.length,
    valid: 0,
    invalid: 0,
    errors: []
  };

  for (const transition of transitions) {
    const validation = validateContinuity(db, transition.id);
    if (validation.valid) {
      results.valid++;
    } else {
      results.invalid++;
      results.errors.push({
        transitionId: transition.id,
        fromSceneId: transition.fromSceneId,
        toSceneId: transition.toSceneId,
        errors: validation.errors
      });
    }
  }

  return results;
}

/**
 * Auto-create transitions between sequential scenes
 */
function autoCreateTransitions(db, fictionId) {
  const allScenes = scenes.getScenesInFiction(db, fictionId);

  if (allScenes.length < 2) return [];

  const created = [];

  for (let i = 0; i < allScenes.length - 1; i++) {
    const fromScene = allScenes[i];
    const toScene = allScenes[i + 1];

    // Check if transition already exists
    const existing = getTransitionBetween(db, fromScene.id, toScene.id);
    if (existing) continue;

    // Determine transition type
    let transitionType = 'cut';
    const timeGap = toScene.narrativeTime - fromScene.narrativeTime;

    if (timeGap < 0) {
      transitionType = 'flashback';
    } else if (timeGap > 60 * 24) { // More than a day
      transitionType = 'time_skip';
    } else if (fromScene.locationId !== toScene.locationId) {
      transitionType = 'cut';
    }

    const transition = createTransition(db, {
      fictionId,
      fromSceneId: fromScene.id,
      toSceneId: toScene.id,
      transitionType,
      timeGapMinutes: timeGap,
      locationChange: fromScene.locationId !== toScene.locationId,
      povChange: fromScene.povEntityId !== toScene.povEntityId
    });

    created.push(transition);
  }

  return created;
}

/**
 * Delete a transition
 */
function deleteTransition(db, transitionId) {
  const result = db.prepare('DELETE FROM scene_transitions WHERE id = ?').run(transitionId);
  return result.changes > 0;
}

/**
 * Map database row to transition object
 */
function mapRowToTransition(row) {
  return {
    id: row.id,
    fictionId: row.fiction_id,
    fromSceneId: row.from_scene_id,
    toSceneId: row.to_scene_id,
    transitionType: row.transition_type,
    timeGapMinutes: row.time_gap_minutes,
    locationChange: row.location_change === 1,
    povChange: row.pov_change === 1,
    continuityNotes: row.continuity_notes,
    carriedTensions: JSON.parse(row.carried_tensions || '[]'),
    resolvedTensions: JSON.parse(row.resolved_tensions || '[]'),
    entityStateChanges: JSON.parse(row.entity_state_changes || '{}'),
    validationStatus: row.validation_status,
    validationErrors: row.validation_errors ? JSON.parse(row.validation_errors) : null,
    createdAt: row.created_at
  };
}

module.exports = {
  createTransition,
  getTransition,
  getTransitionBetween,
  getTransitionsInFiction,
  getTransitionsFrom,
  getTransitionsTo,
  validateContinuity,
  validateAllTransitions,
  autoCreateTransitions,
  deleteTransition
};
