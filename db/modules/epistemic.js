// Epistemic Module - Knowledge Tracking
// Manages the epistemic fact ledger: who knows what when
// Event sourcing: records are append-only

const { v4: uuid } = require('uuid');

/**
 * Record a fact being learned by an entity
 */
function recordFact(db, {
  fictionId,
  entityId,
  factType,
  factKey,
  factValue,
  sourceType,
  sourceEntityId = null,
  sourceEventId = null,
  confidence = 1.0,
  isTrue = true,
  acquiredAt
}) {
  const id = uuid();
  const createdAt = Date.now();
  const acquiredTimestamp = acquiredAt || createdAt;

  db.prepare(`
    INSERT INTO epistemic_fact_ledger
    (id, fiction_id, entity_id, fact_type, fact_key, fact_value, source_type,
     source_entity_id, source_event_id, confidence, is_true, acquired_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, fictionId, entityId, factType, factKey,
    JSON.stringify(factValue), sourceType,
    sourceEntityId, sourceEventId, confidence,
    isTrue ? 1 : 0, acquiredTimestamp, createdAt
  );

  return {
    id,
    fictionId,
    entityId,
    factType,
    factKey,
    factValue,
    sourceType,
    sourceEntityId,
    sourceEventId,
    confidence,
    isTrue,
    acquiredAt: acquiredTimestamp,
    createdAt
  };
}

/**
 * Get a specific fact entry by ID
 */
function getFact(db, factId) {
  const row = db.prepare(`
    SELECT * FROM epistemic_fact_ledger WHERE id = ?
  `).get(factId);

  if (!row) return null;

  return mapRowToFact(row);
}

/**
 * Get all facts known by an entity at a specific narrative timestamp
 */
function queryKnowledgeAt(db, entityId, timestamp, options = {}) {
  const { factType, factKey, fictionId } = options;

  let sql = `
    SELECT * FROM epistemic_fact_ledger
    WHERE entity_id = ? AND acquired_at <= ?
  `;
  const params = [entityId, timestamp];

  if (fictionId) {
    sql += ' AND fiction_id = ?';
    params.push(fictionId);
  }

  if (factType) {
    sql += ' AND fact_type = ?';
    params.push(factType);
  }

  if (factKey) {
    sql += ' AND fact_key = ?';
    params.push(factKey);
  }

  sql += ' ORDER BY acquired_at ASC';

  const rows = db.prepare(sql).all(...params);

  // Build knowledge state by replaying facts in order
  // Later facts with same type+key override earlier ones
  const knowledgeMap = new Map();

  for (const row of rows) {
    const fact = mapRowToFact(row);
    const key = `${fact.factType}:${fact.factKey}`;
    knowledgeMap.set(key, fact);
  }

  return Array.from(knowledgeMap.values());
}

/**
 * Get what an entity knows about a specific fact at a given time
 */
function getFactAt(db, entityId, factType, factKey, timestamp) {
  const row = db.prepare(`
    SELECT * FROM epistemic_fact_ledger
    WHERE entity_id = ? AND fact_type = ? AND fact_key = ? AND acquired_at <= ?
    ORDER BY acquired_at DESC
    LIMIT 1
  `).get(entityId, factType, factKey, timestamp);

  if (!row) return null;

  return mapRowToFact(row);
}

/**
 * Get knowledge divergence between two entities at a specific time
 * Returns facts that one entity knows but the other doesn't
 */
function getDivergence(db, entityAId, entityBId, timestamp, options = {}) {
  const { fictionId } = options;

  const knowledgeA = queryKnowledgeAt(db, entityAId, timestamp, { fictionId });
  const knowledgeB = queryKnowledgeAt(db, entityBId, timestamp, { fictionId });

  // Create maps for efficient lookup
  const mapA = new Map(knowledgeA.map(f => [`${f.factType}:${f.factKey}`, f]));
  const mapB = new Map(knowledgeB.map(f => [`${f.factType}:${f.factKey}`, f]));

  const onlyA = [];  // Facts A knows that B doesn't
  const onlyB = [];  // Facts B knows that A doesn't
  const different = [];  // Facts both know but with different values
  const shared = [];  // Facts both know with same values

  // Find facts only in A or different between A and B
  for (const [key, factA] of mapA) {
    const factB = mapB.get(key);
    if (!factB) {
      onlyA.push(factA);
    } else if (JSON.stringify(factA.factValue) !== JSON.stringify(factB.factValue)) {
      different.push({ factA, factB });
    } else {
      shared.push(factA);
    }
  }

  // Find facts only in B
  for (const [key, factB] of mapB) {
    if (!mapA.has(key)) {
      onlyB.push(factB);
    }
  }

  return {
    entityA: entityAId,
    entityB: entityBId,
    timestamp,
    onlyA,
    onlyB,
    different,
    shared,
    summary: {
      totalA: knowledgeA.length,
      totalB: knowledgeB.length,
      onlyACount: onlyA.length,
      onlyBCount: onlyB.length,
      differentCount: different.length,
      sharedCount: shared.length
    }
  };
}

/**
 * Get all entities who know a specific fact at a given time
 */
function getKnowers(db, factType, factKey, timestamp, options = {}) {
  const { fictionId, valueFilter } = options;

  let sql = `
    SELECT DISTINCT entity_id, MAX(acquired_at) as latest_acquired
    FROM epistemic_fact_ledger
    WHERE fact_type = ? AND fact_key = ? AND acquired_at <= ?
  `;
  const params = [factType, factKey, timestamp];

  if (fictionId) {
    sql += ' AND fiction_id = ?';
    params.push(fictionId);
  }

  sql += ' GROUP BY entity_id';

  const entityIds = db.prepare(sql).all(...params);

  // Get the actual fact state for each knower
  const knowers = [];
  for (const { entity_id } of entityIds) {
    const fact = getFactAt(db, entity_id, factType, factKey, timestamp);
    if (fact) {
      if (!valueFilter || JSON.stringify(fact.factValue) === JSON.stringify(valueFilter)) {
        knowers.push({
          entityId: entity_id,
          fact
        });
      }
    }
  }

  return knowers;
}

/**
 * Get the history of how a fact evolved for an entity
 */
function getFactHistory(db, entityId, factType, factKey) {
  const rows = db.prepare(`
    SELECT * FROM epistemic_fact_ledger
    WHERE entity_id = ? AND fact_type = ? AND fact_key = ?
    ORDER BY acquired_at ASC
  `).all(entityId, factType, factKey);

  return rows.map(mapRowToFact);
}

/**
 * Check if an entity knows a fact (has any record of it) at a given time
 */
function knowsFact(db, entityId, factType, factKey, timestamp) {
  const fact = getFactAt(db, entityId, factType, factKey, timestamp);
  return fact !== null;
}

/**
 * Get facts that are false (for dramatic irony tracking)
 */
function getFalseBeliefs(db, entityId, timestamp, options = {}) {
  const { fictionId } = options;

  const knowledge = queryKnowledgeAt(db, entityId, timestamp, { fictionId });
  return knowledge.filter(fact => !fact.isTrue);
}

/**
 * Map database row to fact object
 */
function mapRowToFact(row) {
  return {
    id: row.id,
    fictionId: row.fiction_id,
    entityId: row.entity_id,
    factType: row.fact_type,
    factKey: row.fact_key,
    factValue: JSON.parse(row.fact_value),
    sourceType: row.source_type,
    sourceEntityId: row.source_entity_id,
    sourceEventId: row.source_event_id,
    confidence: row.confidence,
    isTrue: row.is_true === 1,
    acquiredAt: row.acquired_at,
    createdAt: row.created_at
  };
}

module.exports = {
  recordFact,
  getFact,
  queryKnowledgeAt,
  getFactAt,
  getDivergence,
  getKnowers,
  getFactHistory,
  knowsFact,
  getFalseBeliefs
};
