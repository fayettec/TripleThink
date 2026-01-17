// Relationships Module - Relationship Dynamics Tracking
// Manages evolving relationships between entities over time
// Event sourcing: records are append-only, state is computed from history

const { v4: uuid } = require('uuid');

/**
 * Record a relationship state between two entities
 */
function recordRelationship(db, {
  fictionId,
  entityAId,
  entityBId,
  relationshipType,
  sentiment = 0.0,
  trustLevel = 0.5,
  powerBalance = 0.0,
  intimacyLevel = 0.0,
  conflictLevel = 0.0,
  status = 'active',
  dynamics = null,
  causeEventId = null,
  validFrom
}) {
  const id = uuid();
  const createdAt = Date.now();
  const validFromTimestamp = validFrom || createdAt;

  // Normalize entity order for consistent lookup (alphabetically by ID)
  const [normalA, normalB] = entityAId < entityBId
    ? [entityAId, entityBId]
    : [entityBId, entityAId];

  db.prepare(`
    INSERT INTO relationship_dynamics
    (id, fiction_id, entity_a_id, entity_b_id, relationship_type, sentiment,
     trust_level, power_balance, intimacy_level, conflict_level, status,
     dynamics_json, cause_event_id, valid_from, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, fictionId, normalA, normalB, relationshipType, sentiment,
    trustLevel, powerBalance, intimacyLevel, conflictLevel, status,
    dynamics ? JSON.stringify(dynamics) : null, causeEventId,
    validFromTimestamp, createdAt
  );

  return {
    id,
    fictionId,
    entityAId: normalA,
    entityBId: normalB,
    relationshipType,
    sentiment,
    trustLevel,
    powerBalance,
    intimacyLevel,
    conflictLevel,
    status,
    dynamics,
    causeEventId,
    validFrom: validFromTimestamp,
    createdAt
  };
}

/**
 * Get a specific relationship entry by ID
 */
function getRelationship(db, relationshipId) {
  const row = db.prepare(`
    SELECT * FROM relationship_dynamics WHERE id = ?
  `).get(relationshipId);

  if (!row) return null;

  return mapRowToRelationship(row);
}

/**
 * Get the relationship state between two entities at a specific time
 */
function getRelationshipAt(db, entityAId, entityBId, timestamp, options = {}) {
  const { relationshipType } = options;

  // Normalize entity order
  const [normalA, normalB] = entityAId < entityBId
    ? [entityAId, entityBId]
    : [entityBId, entityAId];

  let sql = `
    SELECT * FROM relationship_dynamics
    WHERE entity_a_id = ? AND entity_b_id = ? AND valid_from <= ?
  `;
  const params = [normalA, normalB, timestamp];

  if (relationshipType) {
    sql += ' AND relationship_type = ?';
    params.push(relationshipType);
  }

  sql += ' ORDER BY valid_from DESC LIMIT 1';

  const row = db.prepare(sql).all(...params)[0];

  if (!row) return null;

  return mapRowToRelationship(row);
}

/**
 * Get all relationships for an entity at a specific time
 */
function getRelationshipsFor(db, entityId, timestamp, options = {}) {
  const { fictionId, relationshipType, status } = options;

  let sql = `
    SELECT * FROM relationship_dynamics
    WHERE (entity_a_id = ? OR entity_b_id = ?) AND valid_from <= ?
  `;
  const params = [entityId, entityId, timestamp];

  if (fictionId) {
    sql += ' AND fiction_id = ?';
    params.push(fictionId);
  }

  if (relationshipType) {
    sql += ' AND relationship_type = ?';
    params.push(relationshipType);
  }

  sql += ' ORDER BY valid_from DESC';

  const rows = db.prepare(sql).all(...params);

  // Group by relationship pair and get latest state for each
  const relationshipMap = new Map();

  for (const row of rows) {
    const pairKey = `${row.entity_a_id}:${row.entity_b_id}:${row.relationship_type}`;
    if (!relationshipMap.has(pairKey)) {
      const rel = mapRowToRelationship(row);
      if (!status || rel.status === status) {
        relationshipMap.set(pairKey, rel);
      }
    }
  }

  return Array.from(relationshipMap.values());
}

/**
 * Get the history of a relationship between two entities
 */
function getRelationshipHistory(db, entityAId, entityBId, options = {}) {
  const { relationshipType } = options;

  // Normalize entity order
  const [normalA, normalB] = entityAId < entityBId
    ? [entityAId, entityBId]
    : [entityBId, entityAId];

  let sql = `
    SELECT * FROM relationship_dynamics
    WHERE entity_a_id = ? AND entity_b_id = ?
  `;
  const params = [normalA, normalB];

  if (relationshipType) {
    sql += ' AND relationship_type = ?';
    params.push(relationshipType);
  }

  sql += ' ORDER BY valid_from ASC';

  const rows = db.prepare(sql).all(...params);

  return rows.map(mapRowToRelationship);
}

/**
 * Find relationships by sentiment threshold at a specific time
 */
function findBySentiment(db, threshold, operator, timestamp, options = {}) {
  const { fictionId } = options;
  const op = operator === 'gte' ? '>=' : operator === 'lte' ? '<=' : '=';

  let sql = `
    SELECT * FROM relationship_dynamics
    WHERE sentiment ${op} ? AND valid_from <= ?
  `;
  const params = [threshold, timestamp];

  if (fictionId) {
    sql += ' AND fiction_id = ?';
    params.push(fictionId);
  }

  sql += ' ORDER BY valid_from DESC';

  const rows = db.prepare(sql).all(...params);

  // Get latest state for each relationship pair
  const relationshipMap = new Map();

  for (const row of rows) {
    const pairKey = `${row.entity_a_id}:${row.entity_b_id}:${row.relationship_type}`;
    if (!relationshipMap.has(pairKey)) {
      relationshipMap.set(pairKey, mapRowToRelationship(row));
    }
  }

  // Filter by operator again on final states
  return Array.from(relationshipMap.values()).filter(rel => {
    switch (operator) {
      case 'gte': return rel.sentiment >= threshold;
      case 'lte': return rel.sentiment <= threshold;
      default: return rel.sentiment === threshold;
    }
  });
}

/**
 * Find relationships in conflict at a specific time
 */
function findConflicts(db, minConflictLevel, timestamp, options = {}) {
  const { fictionId } = options;

  let sql = `
    SELECT * FROM relationship_dynamics
    WHERE conflict_level >= ? AND valid_from <= ?
  `;
  const params = [minConflictLevel, timestamp];

  if (fictionId) {
    sql += ' AND fiction_id = ?';
    params.push(fictionId);
  }

  sql += ' ORDER BY valid_from DESC';

  const rows = db.prepare(sql).all(...params);

  // Get latest state for each relationship pair
  const relationshipMap = new Map();

  for (const row of rows) {
    const pairKey = `${row.entity_a_id}:${row.entity_b_id}:${row.relationship_type}`;
    if (!relationshipMap.has(pairKey)) {
      const rel = mapRowToRelationship(row);
      if (rel.conflictLevel >= minConflictLevel) {
        relationshipMap.set(pairKey, rel);
      }
    }
  }

  return Array.from(relationshipMap.values());
}

/**
 * Get relationship delta between two points in time
 */
function getRelationshipDelta(db, entityAId, entityBId, fromTimestamp, toTimestamp) {
  const before = getRelationshipAt(db, entityAId, entityBId, fromTimestamp);
  const after = getRelationshipAt(db, entityAId, entityBId, toTimestamp);

  if (!before && !after) return null;

  return {
    before,
    after,
    changes: {
      sentiment: after ? (before ? after.sentiment - before.sentiment : after.sentiment) : null,
      trustLevel: after ? (before ? after.trustLevel - before.trustLevel : after.trustLevel) : null,
      powerBalance: after ? (before ? after.powerBalance - before.powerBalance : after.powerBalance) : null,
      intimacyLevel: after ? (before ? after.intimacyLevel - before.intimacyLevel : after.intimacyLevel) : null,
      conflictLevel: after ? (before ? after.conflictLevel - before.conflictLevel : after.conflictLevel) : null,
      statusChanged: before?.status !== after?.status
    }
  };
}

/**
 * Get all relationships in a fiction at a specific time
 */
function getAllRelationships(db, fictionId, timestamp = null) {
  let sql = `
    SELECT * FROM relationship_dynamics
    WHERE fiction_id = ?
  `;
  const params = [fictionId];

  if (timestamp) {
    sql += ' AND valid_from <= ?';
    params.push(timestamp);
    sql += ' ORDER BY valid_from DESC';
  } else {
    sql += ' ORDER BY created_at DESC';
  }

  const rows = db.prepare(sql).all(...params);

  if (!timestamp) {
    // No timestamp filter - return all relationships
    return rows.map(mapRowToRelationship);
  }

  // With timestamp - get latest state for each relationship pair
  const relationshipMap = new Map();

  for (const row of rows) {
    const pairKey = `${row.entity_a_id}:${row.entity_b_id}:${row.relationship_type}`;
    if (!relationshipMap.has(pairKey)) {
      relationshipMap.set(pairKey, mapRowToRelationship(row));
    }
  }

  return Array.from(relationshipMap.values());
}

/**
 * Map database row to relationship object
 */
function mapRowToRelationship(row) {
  return {
    id: row.id,
    fictionId: row.fiction_id,
    entityAId: row.entity_a_id,
    entityBId: row.entity_b_id,
    relationshipType: row.relationship_type,
    sentiment: row.sentiment,
    trustLevel: row.trust_level,
    powerBalance: row.power_balance,
    intimacyLevel: row.intimacy_level,
    conflictLevel: row.conflict_level,
    status: row.status,
    dynamics: row.dynamics_json ? JSON.parse(row.dynamics_json) : null,
    causeEventId: row.cause_event_id,
    validFrom: row.valid_from,
    createdAt: row.created_at
  };
}

module.exports = {
  recordRelationship,
  getRelationship,
  getRelationshipAt,
  getRelationshipsFor,
  getRelationshipHistory,
  findBySentiment,
  findConflicts,
  getRelationshipDelta,
  getAllRelationships
};
