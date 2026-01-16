// Scenes Module - Narrative Scene Management
// CRUD operations for narrative scenes with orchestration fields
// Event sourcing: records are append-only

const { v4: uuid } = require('uuid');

/**
 * Create a new narrative scene
 */
function createScene(db, {
  fictionId,
  chapterId = null,
  sceneNumber,
  title = null,
  summary = null,
  povEntityId = null,
  locationId = null,
  narrativeTime,
  durationMinutes = null,
  mood = 'neutral',
  tensionLevel = 0.5,
  stakes = null,
  sceneGoal = null,
  presentEntityIds = [],
  enteringEntityIds = [],
  exitingEntityIds = [],
  activeConflictIds = [],
  activeThemeIds = [],
  forbiddenRevealIds = [],
  setupPayoffIds = [],
  notes = null,
  status = 'draft'
}) {
  const id = uuid();
  const now = Date.now();

  db.prepare(`
    INSERT INTO narrative_scenes
    (id, fiction_id, chapter_id, scene_number, title, summary, pov_entity_id,
     location_id, narrative_time, duration_minutes, mood, tension_level, stakes,
     scene_goal, present_entity_ids, entering_entity_ids, exiting_entity_ids,
     active_conflict_ids, active_theme_ids, forbidden_reveal_ids, setup_payoff_ids,
     notes, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, fictionId, chapterId, sceneNumber, title, summary, povEntityId,
    locationId, narrativeTime, durationMinutes, mood, tensionLevel, stakes,
    sceneGoal, JSON.stringify(presentEntityIds), JSON.stringify(enteringEntityIds),
    JSON.stringify(exitingEntityIds), JSON.stringify(activeConflictIds),
    JSON.stringify(activeThemeIds), JSON.stringify(forbiddenRevealIds),
    JSON.stringify(setupPayoffIds), notes, status, now, now
  );

  return {
    id,
    fictionId,
    chapterId,
    sceneNumber,
    title,
    summary,
    povEntityId,
    locationId,
    narrativeTime,
    durationMinutes,
    mood,
    tensionLevel,
    stakes,
    sceneGoal,
    presentEntityIds,
    enteringEntityIds,
    exitingEntityIds,
    activeConflictIds,
    activeThemeIds,
    forbiddenRevealIds,
    setupPayoffIds,
    notes,
    status,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Get a scene by ID
 */
function getScene(db, sceneId) {
  const row = db.prepare(`
    SELECT * FROM narrative_scenes WHERE id = ?
  `).get(sceneId);

  if (!row) return null;

  return mapRowToScene(row);
}

/**
 * Get all scenes in a fiction ordered by narrative time
 */
function getScenesInFiction(db, fictionId, options = {}) {
  const { chapterId, status, limit, offset } = options;

  let sql = 'SELECT * FROM narrative_scenes WHERE fiction_id = ?';
  const params = [fictionId];

  if (chapterId) {
    sql += ' AND chapter_id = ?';
    params.push(chapterId);
  }

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY narrative_time ASC';

  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
    if (offset) {
      sql += ' OFFSET ?';
      params.push(offset);
    }
  }

  const rows = db.prepare(sql).all(...params);
  return rows.map(mapRowToScene);
}

/**
 * Get scene at a specific narrative time
 */
function getSceneAt(db, fictionId, narrativeTime) {
  const row = db.prepare(`
    SELECT * FROM narrative_scenes
    WHERE fiction_id = ? AND narrative_time <= ?
    ORDER BY narrative_time DESC
    LIMIT 1
  `).get(fictionId, narrativeTime);

  if (!row) return null;

  return mapRowToScene(row);
}

/**
 * Get scenes by POV character
 */
function getScenesByPOV(db, povEntityId, options = {}) {
  const { fictionId } = options;

  let sql = 'SELECT * FROM narrative_scenes WHERE pov_entity_id = ?';
  const params = [povEntityId];

  if (fictionId) {
    sql += ' AND fiction_id = ?';
    params.push(fictionId);
  }

  sql += ' ORDER BY narrative_time ASC';

  const rows = db.prepare(sql).all(...params);
  return rows.map(mapRowToScene);
}

/**
 * Get scenes where an entity is present
 */
function getScenesWithEntity(db, entityId, fictionId) {
  const rows = db.prepare(`
    SELECT * FROM narrative_scenes
    WHERE fiction_id = ?
    AND (
      present_entity_ids LIKE ?
      OR entering_entity_ids LIKE ?
      OR pov_entity_id = ?
    )
    ORDER BY narrative_time ASC
  `).all(fictionId, `%"${entityId}"%`, `%"${entityId}"%`, entityId);

  return rows.map(mapRowToScene);
}

/**
 * Get all entities present in a scene (combining present, entering, minus exiting)
 */
function getAllPresentEntities(db, sceneId) {
  const scene = getScene(db, sceneId);
  if (!scene) return [];

  const present = new Set(scene.presentEntityIds);

  // Add POV if not already included
  if (scene.povEntityId) {
    present.add(scene.povEntityId);
  }

  // Add entering entities
  for (const entityId of scene.enteringEntityIds) {
    present.add(entityId);
  }

  // Remove exiting entities
  for (const entityId of scene.exitingEntityIds) {
    present.delete(entityId);
  }

  return Array.from(present);
}

/**
 * Update scene (creates new version - event sourcing style)
 */
function updateScene(db, sceneId, updates) {
  const existing = getScene(db, sceneId);
  if (!existing) return null;

  const now = Date.now();

  // Build update SQL dynamically
  const fields = [];
  const values = [];

  const updateableFields = [
    'title', 'summary', 'mood', 'tension_level', 'stakes', 'scene_goal',
    'present_entity_ids', 'entering_entity_ids', 'exiting_entity_ids',
    'active_conflict_ids', 'active_theme_ids', 'forbidden_reveal_ids',
    'setup_payoff_ids', 'notes', 'status', 'duration_minutes'
  ];

  const fieldMapping = {
    title: 'title',
    summary: 'summary',
    mood: 'mood',
    tensionLevel: 'tension_level',
    stakes: 'stakes',
    sceneGoal: 'scene_goal',
    presentEntityIds: 'present_entity_ids',
    enteringEntityIds: 'entering_entity_ids',
    exitingEntityIds: 'exiting_entity_ids',
    activeConflictIds: 'active_conflict_ids',
    activeThemeIds: 'active_theme_ids',
    forbiddenRevealIds: 'forbidden_reveal_ids',
    setupPayoffIds: 'setup_payoff_ids',
    notes: 'notes',
    status: 'status',
    durationMinutes: 'duration_minutes'
  };

  for (const [jsKey, dbKey] of Object.entries(fieldMapping)) {
    if (updates[jsKey] !== undefined) {
      fields.push(`${dbKey} = ?`);
      const value = Array.isArray(updates[jsKey])
        ? JSON.stringify(updates[jsKey])
        : updates[jsKey];
      values.push(value);
    }
  }

  if (fields.length === 0) return existing;

  fields.push('updated_at = ?');
  values.push(now);
  values.push(sceneId);

  db.prepare(`
    UPDATE narrative_scenes
    SET ${fields.join(', ')}
    WHERE id = ?
  `).run(...values);

  return getScene(db, sceneId);
}

/**
 * Delete a scene
 */
function deleteScene(db, sceneId) {
  const result = db.prepare('DELETE FROM narrative_scenes WHERE id = ?').run(sceneId);
  return result.changes > 0;
}

/**
 * Get scene count by status
 */
function getSceneStats(db, fictionId) {
  const rows = db.prepare(`
    SELECT status, COUNT(*) as count, AVG(tension_level) as avg_tension
    FROM narrative_scenes
    WHERE fiction_id = ?
    GROUP BY status
  `).all(fictionId);

  const stats = {
    total: 0,
    byStatus: {},
    avgTension: 0
  };

  let tensionSum = 0;
  for (const row of rows) {
    stats.byStatus[row.status] = row.count;
    stats.total += row.count;
    tensionSum += row.avg_tension * row.count;
  }

  stats.avgTension = stats.total > 0 ? tensionSum / stats.total : 0;

  return stats;
}

/**
 * Map database row to scene object
 */
function mapRowToScene(row) {
  return {
    id: row.id,
    fictionId: row.fiction_id,
    chapterId: row.chapter_id,
    sceneNumber: row.scene_number,
    title: row.title,
    summary: row.summary,
    povEntityId: row.pov_entity_id,
    locationId: row.location_id,
    narrativeTime: row.narrative_time,
    durationMinutes: row.duration_minutes,
    mood: row.mood,
    tensionLevel: row.tension_level,
    stakes: row.stakes,
    sceneGoal: row.scene_goal,
    presentEntityIds: JSON.parse(row.present_entity_ids || '[]'),
    enteringEntityIds: JSON.parse(row.entering_entity_ids || '[]'),
    exitingEntityIds: JSON.parse(row.exiting_entity_ids || '[]'),
    activeConflictIds: JSON.parse(row.active_conflict_ids || '[]'),
    activeThemeIds: JSON.parse(row.active_theme_ids || '[]'),
    forbiddenRevealIds: JSON.parse(row.forbidden_reveal_ids || '[]'),
    setupPayoffIds: JSON.parse(row.setup_payoff_ids || '[]'),
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = {
  createScene,
  getScene,
  getScenesInFiction,
  getSceneAt,
  getScenesByPOV,
  getScenesWithEntity,
  getAllPresentEntities,
  updateScene,
  deleteScene,
  getSceneStats
};
