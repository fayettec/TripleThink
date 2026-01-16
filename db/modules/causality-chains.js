// Causality Chains Module
// CRUD operations for CAUSALITY_CHAINS table
// Provides cause-effect relationship tracking and causal graph traversal

const { v4: uuidv4 } = require('uuid');

module.exports = (db) => {
  /**
   * Create a new causality chain
   * @param {string} projectId - UUID of the project
   * @param {string} causeEventId - UUID of the cause event
   * @param {string} effectEventId - UUID of the effect event
   * @param {string} type - Type of causal relationship ('direct_cause', 'enabling_condition', 'motivation', 'psychological_trigger')
   * @param {number} strength - Strength of causality (1-10)
   * @param {string} explanation - Explanation of how cause leads to effect
   * @returns {object} The created chain object
   */
  const createChain = (projectId, causeEventId, effectEventId, type, strength, explanation) => {
    // Validate type enum
    const validTypes = ['direct_cause', 'enabling_condition', 'motivation', 'psychological_trigger'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate strength (1-10)
    if (!Number.isInteger(strength) || strength < 1 || strength > 10) {
      throw new Error(`Invalid strength: ${strength}. Must be integer between 1 and 10`);
    }

    const chainUuid = uuidv4();
    const createdAt = Date.now();

    db.prepare(`
      INSERT INTO causality_chains
      (chain_uuid, project_id, cause_event_id, effect_event_id, type, strength, explanation, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(chainUuid, projectId, causeEventId, effectEventId, type, strength, explanation, createdAt);

    return {
      chain_uuid: chainUuid,
      project_id: projectId,
      cause_event_id: causeEventId,
      effect_event_id: effectEventId,
      type: type,
      strength: strength,
      explanation: explanation,
      created_at: createdAt
    };
  };

  /**
   * Get all chains where the specified event is the cause
   * @param {string} causeEventId - UUID of the cause event
   * @returns {Array} Array of chain objects
   */
  const getChainsByCause = (causeEventId) => {
    const rows = db.prepare(`
      SELECT chain_uuid, project_id, cause_event_id, effect_event_id, type, strength, explanation, created_at
      FROM causality_chains
      WHERE cause_event_id = ?
    `).all(causeEventId);

    return rows.map(row => ({
      chain_uuid: row.chain_uuid,
      project_id: row.project_id,
      cause_event_id: row.cause_event_id,
      effect_event_id: row.effect_event_id,
      type: row.type,
      strength: row.strength,
      explanation: row.explanation,
      created_at: row.created_at
    }));
  };

  /**
   * Get all chains where the specified event is the effect
   * @param {string} effectEventId - UUID of the effect event
   * @returns {Array} Array of chain objects
   */
  const getChainsByEffect = (effectEventId) => {
    const rows = db.prepare(`
      SELECT chain_uuid, project_id, cause_event_id, effect_event_id, type, strength, explanation, created_at
      FROM causality_chains
      WHERE effect_event_id = ?
    `).all(effectEventId);

    return rows.map(row => ({
      chain_uuid: row.chain_uuid,
      project_id: row.project_id,
      cause_event_id: row.cause_event_id,
      effect_event_id: row.effect_event_id,
      type: row.type,
      strength: row.strength,
      explanation: row.explanation,
      created_at: row.created_at
    }));
  };

  /**
   * Get a single chain by its UUID
   * @param {string} chainUuid - UUID of the chain
   * @returns {object|null} The chain object or null if not found
   */
  const getChainById = (chainUuid) => {
    const row = db.prepare(`
      SELECT chain_uuid, project_id, cause_event_id, effect_event_id, type, strength, explanation, created_at
      FROM causality_chains
      WHERE chain_uuid = ?
    `).get(chainUuid);

    if (!row) return null;

    return {
      chain_uuid: row.chain_uuid,
      project_id: row.project_id,
      cause_event_id: row.cause_event_id,
      effect_event_id: row.effect_event_id,
      type: row.type,
      strength: row.strength,
      explanation: row.explanation,
      created_at: row.created_at
    };
  };

  /**
   * Update an existing chain
   * @param {string} chainUuid - UUID of the chain to update
   * @param {object} updates - Object with fields to update (type, strength, explanation)
   * @returns {object|null} The updated chain object or null if not found
   */
  const updateChain = (chainUuid, updates) => {
    // Validate that chain exists
    const existing = getChainById(chainUuid);
    if (!existing) return null;

    // Validate type if provided
    if (updates.type !== undefined) {
      const validTypes = ['direct_cause', 'enabling_condition', 'motivation', 'psychological_trigger'];
      if (!validTypes.includes(updates.type)) {
        throw new Error(`Invalid type: ${updates.type}. Must be one of: ${validTypes.join(', ')}`);
      }
    }

    // Validate strength if provided
    if (updates.strength !== undefined) {
      if (!Number.isInteger(updates.strength) || updates.strength < 1 || updates.strength > 10) {
        throw new Error(`Invalid strength: ${updates.strength}. Must be integer between 1 and 10`);
      }
    }

    // Build dynamic UPDATE statement based on provided fields
    const allowedFields = ['type', 'strength', 'explanation'];
    const updateFields = [];
    const params = [];

    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        updateFields.push(`${field} = ?`);
        params.push(updates[field]);
      }
    }

    // If no valid fields to update, return existing
    if (updateFields.length === 0) {
      return existing;
    }

    // Add chain_uuid to params for WHERE clause
    params.push(chainUuid);

    db.prepare(`
      UPDATE causality_chains
      SET ${updateFields.join(', ')}
      WHERE chain_uuid = ?
    `).run(...params);

    // Return updated chain
    return getChainById(chainUuid);
  };

  /**
   * Delete a chain
   * @param {string} chainUuid - UUID of the chain to delete
   * @returns {boolean} True if deleted, false if not found
   */
  const deleteChain = (chainUuid) => {
    const result = db.prepare(`
      DELETE FROM causality_chains WHERE chain_uuid = ?
    `).run(chainUuid);

    return result.changes > 0;
  };

  /**
   * Traverse causal chain using breadth-first search
   * @param {string} eventId - Starting event ID
   * @param {string} direction - 'forward' (causes → effects) or 'backward' (effects → causes)
   * @param {number} depth - How many levels deep to traverse (1-10, default 3)
   * @param {number} maxDepth - Maximum allowed depth (default 10)
   * @returns {object} Graph object with nodes and edges arrays
   */
  const traverseChain = (eventId, direction = 'forward', depth = 3, maxDepth = 10) => {
    // Validate depth
    if (!Number.isInteger(depth) || depth < 1 || depth > maxDepth) {
      throw new Error(`Invalid depth: ${depth}. Must be integer between 1 and ${maxDepth}`);
    }

    if (!Number.isInteger(maxDepth) || maxDepth < 1 || maxDepth > 10) {
      throw new Error(`Invalid maxDepth: ${maxDepth}. Must be integer between 1 and 10`);
    }

    // Validate direction
    if (direction !== 'forward' && direction !== 'backward') {
      throw new Error(`Invalid direction: ${direction}. Must be 'forward' or 'backward'`);
    }

    const nodes = [];
    const edges = [];
    const visited = new Set();
    const queue = [{ event_id: eventId, level: 0 }];

    // Add starting node
    nodes.push({ event_id: eventId, level: 0 });
    visited.add(eventId);

    // Breadth-first search
    while (queue.length > 0) {
      const current = queue.shift();

      // Stop if we've reached the depth limit
      if (current.level >= depth) {
        continue;
      }

      // Get chains based on direction
      let chains;
      if (direction === 'forward') {
        // Forward: find effects of this cause
        chains = getChainsByCause(current.event_id);
      } else {
        // Backward: find causes of this effect
        chains = getChainsByEffect(current.event_id);
      }

      // Process each chain
      for (const chain of chains) {
        // Determine the next event based on direction
        const nextEventId = direction === 'forward' ? chain.effect_event_id : chain.cause_event_id;

        // Add edge
        edges.push({
          from: chain.cause_event_id,
          to: chain.effect_event_id,
          type: chain.type,
          strength: chain.strength,
          explanation: chain.explanation
        });

        // If we haven't visited this node, add it
        if (!visited.has(nextEventId)) {
          visited.add(nextEventId);
          nodes.push({ event_id: nextEventId, level: current.level + 1 });
          queue.push({ event_id: nextEventId, level: current.level + 1 });
        }
      }
    }

    return { nodes, edges };
  };

  return {
    createChain,
    getChainsByCause,
    getChainsByEffect,
    getChainById,
    updateChain,
    deleteChain,
    traverseChain
  };
};

// Self-test when run directly
if (require.main === module) {
  const Database = require('better-sqlite3');
  const testDb = new Database(':memory:');

  // Create table
  testDb.exec(`
    CREATE TABLE causality_chains (
      chain_uuid TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      cause_event_id TEXT NOT NULL,
      effect_event_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('direct_cause', 'enabling_condition', 'motivation', 'psychological_trigger')),
      strength INTEGER NOT NULL CHECK(strength >= 1 AND strength <= 10),
      explanation TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  const module = require('./causality-chains')(testDb);

  // Test 1: Create chain
  const chain = module.createChain('proj-001', 'evt-001', 'evt-002', 'direct_cause', 8, 'Event 001 directly caused event 002');
  console.assert(chain.type === 'direct_cause', 'Chain type should be direct_cause');
  console.assert(chain.strength === 8, 'Chain strength should be 8');
  console.assert(chain.cause_event_id === 'evt-001', 'Cause event should be evt-001');
  console.assert(chain.effect_event_id === 'evt-002', 'Effect event should be evt-002');

  // Test 2: Retrieve by cause
  const byCause = module.getChainsByCause('evt-001');
  console.assert(byCause.length === 1, 'Should find 1 chain by cause');
  console.assert(byCause[0].chain_uuid === chain.chain_uuid, 'Chain UUID should match');

  // Test 3: Retrieve by effect
  const byEffect = module.getChainsByEffect('evt-002');
  console.assert(byEffect.length === 1, 'Should find 1 chain by effect');
  console.assert(byEffect[0].chain_uuid === chain.chain_uuid, 'Chain UUID should match');

  // Test 4: Get by ID
  const byId = module.getChainById(chain.chain_uuid);
  console.assert(byId !== null, 'Should find chain by ID');
  console.assert(byId.type === 'direct_cause', 'Retrieved chain should have correct type');

  // Test 5: Update chain
  const updated = module.updateChain(chain.chain_uuid, { strength: 10, explanation: 'Updated explanation' });
  console.assert(updated.strength === 10, 'Chain strength should be updated to 10');
  console.assert(updated.explanation === 'Updated explanation', 'Explanation should be updated');

  // Test 6: Create chain for traversal test
  module.createChain('proj-001', 'evt-002', 'evt-003', 'enabling_condition', 7, 'Event 002 enabled event 003');

  // Test 7: Traverse forward
  const graphForward = module.traverseChain('evt-001', 'forward', 2);
  console.assert(graphForward.nodes.length >= 1, 'Forward graph should have at least starting node');
  console.assert(graphForward.edges.length >= 1, 'Forward graph should have at least one edge');
  console.assert(graphForward.nodes[0].event_id === 'evt-001', 'Starting node should be evt-001');

  // Test 8: Traverse backward
  const graphBackward = module.traverseChain('evt-002', 'backward', 2);
  console.assert(graphBackward.nodes.length >= 1, 'Backward graph should have at least starting node');
  console.assert(graphBackward.edges.length >= 1, 'Backward graph should have at least one edge');

  // Test 9: Delete chain
  const deleted = module.deleteChain(chain.chain_uuid);
  console.assert(deleted === true, 'Chain should be deleted');
  const afterDelete = module.getChainById(chain.chain_uuid);
  console.assert(afterDelete === null, 'Chain should not exist after deletion');

  // Test 10: Validate type enum
  try {
    module.createChain('proj-001', 'evt-004', 'evt-005', 'invalid_type', 5, 'Test');
    console.assert(false, 'Should throw error for invalid type');
  } catch (e) {
    console.assert(e.message.includes('Invalid type'), 'Should throw type validation error');
  }

  // Test 11: Validate strength range
  try {
    module.createChain('proj-001', 'evt-004', 'evt-005', 'direct_cause', 11, 'Test');
    console.assert(false, 'Should throw error for invalid strength');
  } catch (e) {
    console.assert(e.message.includes('Invalid strength'), 'Should throw strength validation error');
  }

  // Test 12: Validate depth range
  try {
    module.traverseChain('evt-001', 'forward', 11);
    console.assert(false, 'Should throw error for invalid depth');
  } catch (e) {
    console.assert(e.message.includes('Invalid depth'), 'Should throw depth validation error');
  }

  console.log('\u2713 All causality-chains module tests passed');
}
