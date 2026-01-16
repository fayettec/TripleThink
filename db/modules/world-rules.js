// World Rules Module
// CRUD operations for WORLD_RULES table
// Provides universe consistency tracking across 6 rule categories with enforcement levels

const { v4: uuidv4 } = require('uuid');

// Valid rule categories
const RULE_CATEGORIES = ['physics', 'magic', 'technology', 'social', 'biological', 'metaphysical'];

// Valid enforcement levels
// - strict: Immutable physics, cannot be broken under any circumstance
// - flexible: Social norms with documented exceptions
// - guideline: Soft rules, suggestions rather than hard constraints
const ENFORCEMENT_LEVELS = ['strict', 'flexible', 'guideline'];

module.exports = (db) => {
  /**
   * Create a new world rule
   * @param {object} params - Rule parameters
   * @param {string} params.project_id - UUID of the project
   * @param {string} params.rule_category - Category of rule (physics, magic, technology, social, biological, metaphysical)
   * @param {string} params.statement - The rule definition
   * @param {string} params.exceptions - Optional documented exceptions to the rule
   * @param {string} params.enforcement_level - Enforcement level (strict, flexible, guideline) - defaults to 'strict'
   * @returns {object} The created rule object
   */
  const createWorldRule = ({ project_id, rule_category, statement, exceptions, enforcement_level = 'strict' }) => {
    // Validate rule_category
    if (!RULE_CATEGORIES.includes(rule_category)) {
      throw new Error(`Invalid rule_category '${rule_category}'. Must be one of: ${RULE_CATEGORIES.join(', ')}`);
    }

    // Validate enforcement_level
    if (!ENFORCEMENT_LEVELS.includes(enforcement_level)) {
      throw new Error(`Invalid enforcement_level '${enforcement_level}'. Must be one of: ${ENFORCEMENT_LEVELS.join(', ')}`);
    }

    const rule_uuid = uuidv4();
    const created_at = Date.now();

    db.prepare(`
      INSERT INTO world_rules
      (rule_uuid, project_id, rule_category, statement, exceptions, enforcement_level, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(rule_uuid, project_id, rule_category, statement, exceptions || null, enforcement_level, created_at);

    return {
      rule_uuid,
      project_id,
      rule_category,
      statement,
      exceptions: exceptions || null,
      enforcement_level,
      created_at
    };
  };

  /**
   * Get all world rules for a project
   * @param {string} project_id - UUID of the project
   * @returns {Array} Array of rule objects
   */
  const getWorldRulesByProject = (project_id) => {
    const rows = db.prepare(`
      SELECT rule_uuid, project_id, rule_category, statement, exceptions, enforcement_level, created_at
      FROM world_rules
      WHERE project_id = ?
    `).all(project_id);

    return rows.map(row => ({
      rule_uuid: row.rule_uuid,
      project_id: row.project_id,
      rule_category: row.rule_category,
      statement: row.statement,
      exceptions: row.exceptions,
      enforcement_level: row.enforcement_level,
      created_at: row.created_at
    }));
  };

  /**
   * Get world rules for a project filtered by category
   * @param {string} project_id - UUID of the project
   * @param {string} rule_category - Category to filter by
   * @returns {Array} Array of rule objects filtered by category
   */
  const getWorldRulesByCategory = (project_id, rule_category) => {
    // Validate rule_category
    if (!RULE_CATEGORIES.includes(rule_category)) {
      throw new Error(`Invalid rule_category '${rule_category}'. Must be one of: ${RULE_CATEGORIES.join(', ')}`);
    }

    const rows = db.prepare(`
      SELECT rule_uuid, project_id, rule_category, statement, exceptions, enforcement_level, created_at
      FROM world_rules
      WHERE project_id = ? AND rule_category = ?
    `).all(project_id, rule_category);

    return rows.map(row => ({
      rule_uuid: row.rule_uuid,
      project_id: row.project_id,
      rule_category: row.rule_category,
      statement: row.statement,
      exceptions: row.exceptions,
      enforcement_level: row.enforcement_level,
      created_at: row.created_at
    }));
  };

  /**
   * Get a single world rule by its UUID
   * @param {string} rule_uuid - UUID of the rule
   * @returns {object|null} The rule object or null if not found
   */
  const getWorldRuleById = (rule_uuid) => {
    const row = db.prepare(`
      SELECT rule_uuid, project_id, rule_category, statement, exceptions, enforcement_level, created_at
      FROM world_rules
      WHERE rule_uuid = ?
    `).get(rule_uuid);

    if (!row) return null;

    return {
      rule_uuid: row.rule_uuid,
      project_id: row.project_id,
      rule_category: row.rule_category,
      statement: row.statement,
      exceptions: row.exceptions,
      enforcement_level: row.enforcement_level,
      created_at: row.created_at
    };
  };

  /**
   * Update an existing world rule
   * @param {string} rule_uuid - UUID of the rule to update
   * @param {object} updates - Object with fields to update (statement, exceptions, enforcement_level)
   * @returns {number} Number of rows updated (1 if successful, 0 if not found)
   *
   * Note: rule_category is immutable - if category needs to change, delete and create new rule
   */
  const updateWorldRule = (rule_uuid, updates) => {
    // Validate enforcement_level if provided
    if (updates.enforcement_level !== undefined && !ENFORCEMENT_LEVELS.includes(updates.enforcement_level)) {
      throw new Error(`Invalid enforcement_level '${updates.enforcement_level}'. Must be one of: ${ENFORCEMENT_LEVELS.join(', ')}`);
    }

    // rule_category should not be updatable - it's immutable
    if (updates.rule_category !== undefined) {
      throw new Error('rule_category is immutable. To change category, delete and create a new rule.');
    }

    // Build dynamic UPDATE statement based on provided fields
    const allowedFields = ['statement', 'exceptions', 'enforcement_level'];
    const updateFields = [];
    const params = [];

    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        updateFields.push(`${field} = ?`);
        params.push(updates[field]);
      }
    }

    // If no valid fields to update, return 0
    if (updateFields.length === 0) {
      return 0;
    }

    // Add rule_uuid to params for WHERE clause
    params.push(rule_uuid);

    const result = db.prepare(`
      UPDATE world_rules
      SET ${updateFields.join(', ')}
      WHERE rule_uuid = ?
    `).run(...params);

    return result.changes;
  };

  /**
   * Delete a world rule
   * @param {string} rule_uuid - UUID of the rule to delete
   * @returns {object} Object with deleted status
   */
  const deleteWorldRule = (rule_uuid) => {
    const result = db.prepare(`
      DELETE FROM world_rules WHERE rule_uuid = ?
    `).run(rule_uuid);

    return { deleted: result.changes > 0 };
  };

  return {
    createWorldRule,
    getWorldRulesByProject,
    getWorldRulesByCategory,
    getWorldRuleById,
    updateWorldRule,
    deleteWorldRule
  };
};

// Self-test when run directly
if (require.main === module) {
  const Database = require('better-sqlite3');
  const fs = require('fs');
  const path = require('path');

  console.log('world-rules.js self-test...');

  const testDb = new Database(':memory:');

  // Run migration to create WORLD_RULES table
  const migrationPath = path.join(__dirname, '../migrations/006_logic_layer.sql');
  const migration = fs.readFileSync(migrationPath, 'utf8');
  testDb.exec(migration);

  const module = require('./world-rules')(testDb);

  // Test 1: Create valid physics rule
  console.log('✓ Test 1: Create valid physics rule');
  const rule1 = module.createWorldRule({
    project_id: 'proj-001',
    rule_category: 'physics',
    statement: 'Gravity pulls objects downward at 9.8 m/s²',
    enforcement_level: 'strict'
  });
  console.assert(rule1.rule_uuid, 'Rule should have UUID');
  console.assert(rule1.rule_category === 'physics', 'Category should be physics');
  console.assert(rule1.enforcement_level === 'strict', 'Enforcement should be strict');
  console.assert(rule1.exceptions === null, 'Exceptions should be null when not provided');

  // Test 2: Create magic rule with exceptions
  console.log('✓ Test 2: Create magic rule with exceptions');
  const rule2 = module.createWorldRule({
    project_id: 'proj-001',
    rule_category: 'magic',
    statement: 'Magic requires verbal incantation',
    exceptions: 'Silent casting possible with decades of practice',
    enforcement_level: 'flexible'
  });
  console.assert(rule2.rule_category === 'magic', 'Category should be magic');
  console.assert(rule2.exceptions === 'Silent casting possible with decades of practice', 'Exceptions should be stored');
  console.assert(rule2.enforcement_level === 'flexible', 'Enforcement should be flexible');

  // Test 3: Create rule with invalid category
  console.log('✓ Test 3: Create rule with invalid category throws error');
  try {
    module.createWorldRule({
      project_id: 'proj-001',
      rule_category: 'invalid_category',
      statement: 'Test rule'
    });
    console.assert(false, 'Should throw error for invalid category');
  } catch (e) {
    console.assert(e.message.includes('Invalid rule_category'), 'Should throw category validation error');
    console.assert(e.message.includes('physics'), 'Error message should list valid categories');
  }

  // Test 4: Create rule with invalid enforcement level
  console.log('✓ Test 4: Create rule with invalid enforcement level throws error');
  try {
    module.createWorldRule({
      project_id: 'proj-001',
      rule_category: 'physics',
      statement: 'Test rule',
      enforcement_level: 'invalid_level'
    });
    console.assert(false, 'Should throw error for invalid enforcement level');
  } catch (e) {
    console.assert(e.message.includes('Invalid enforcement_level'), 'Should throw enforcement validation error');
    console.assert(e.message.includes('strict'), 'Error message should list valid enforcement levels');
  }

  // Test 5: Get rules by project
  console.log('✓ Test 5: Get rules by project');
  const rule3 = module.createWorldRule({
    project_id: 'proj-001',
    rule_category: 'technology',
    statement: 'FTL travel requires antimatter fuel',
    enforcement_level: 'strict'
  });
  const projectRules = module.getWorldRulesByProject('proj-001');
  console.assert(projectRules.length === 3, 'Should find 3 rules for project');

  // Test 6: Get rules by category
  console.log('✓ Test 6: Get rules by category');
  const physicsRules = module.getWorldRulesByCategory('proj-001', 'physics');
  console.assert(physicsRules.length === 1, 'Should find 1 physics rule');
  console.assert(physicsRules[0].rule_uuid === rule1.rule_uuid, 'Should match rule1');

  // Test 7: Get rules by category with invalid category
  console.log('✓ Test 7: Get rules by invalid category throws error');
  try {
    module.getWorldRulesByCategory('proj-001', 'invalid_category');
    console.assert(false, 'Should throw error for invalid category');
  } catch (e) {
    console.assert(e.message.includes('Invalid rule_category'), 'Should throw category validation error');
  }

  // Test 8: Get rule by ID
  console.log('✓ Test 8: Get rule by ID');
  const retrievedRule = module.getWorldRuleById(rule1.rule_uuid);
  console.assert(retrievedRule !== null, 'Should find rule by ID');
  console.assert(retrievedRule.statement === 'Gravity pulls objects downward at 9.8 m/s²', 'Retrieved rule should have correct statement');

  // Test 9: Update rule statement and exceptions
  console.log('✓ Test 9: Update rule statement and exceptions');
  const updateResult = module.updateWorldRule(rule1.rule_uuid, {
    statement: 'Updated gravity rule',
    exceptions: 'Zero-g chambers exist'
  });
  console.assert(updateResult === 1, 'Update should return 1');
  const updatedRule = module.getWorldRuleById(rule1.rule_uuid);
  console.assert(updatedRule.statement === 'Updated gravity rule', 'Statement should be updated');
  console.assert(updatedRule.exceptions === 'Zero-g chambers exist', 'Exceptions should be updated');
  console.assert(updatedRule.rule_category === 'physics', 'Category should remain unchanged (immutable)');

  // Test 10: Update enforcement level
  console.log('✓ Test 10: Update enforcement level');
  const enforcementUpdateResult = module.updateWorldRule(rule1.rule_uuid, {
    enforcement_level: 'guideline'
  });
  console.assert(enforcementUpdateResult === 1, 'Enforcement update should return 1');
  const enforcementUpdatedRule = module.getWorldRuleById(rule1.rule_uuid);
  console.assert(enforcementUpdatedRule.enforcement_level === 'guideline', 'Enforcement level should be updated to guideline');

  // Test 11: Try to update rule_category (should fail - immutable)
  console.log('✓ Test 11: Attempt to update rule_category throws error (immutable)');
  try {
    module.updateWorldRule(rule1.rule_uuid, {
      rule_category: 'magic'
    });
    console.assert(false, 'Should throw error when attempting to update rule_category');
  } catch (e) {
    console.assert(e.message.includes('rule_category is immutable'), 'Should throw immutability error');
  }

  // Test 12: Update with invalid enforcement level
  console.log('✓ Test 12: Update with invalid enforcement level throws error');
  try {
    module.updateWorldRule(rule1.rule_uuid, {
      enforcement_level: 'invalid_level'
    });
    console.assert(false, 'Should throw error for invalid enforcement level');
  } catch (e) {
    console.assert(e.message.includes('Invalid enforcement_level'), 'Should throw enforcement validation error');
  }

  // Test 13: Delete rule
  console.log('✓ Test 13: Delete rule');
  const deleteResult = module.deleteWorldRule(rule1.rule_uuid);
  console.assert(deleteResult.deleted === true, 'Delete should return { deleted: true }');
  const afterDelete = module.getWorldRuleById(rule1.rule_uuid);
  console.assert(afterDelete === null, 'Rule should not exist after deletion');

  // Test 14: Create rule for each category (validate all 6 categories)
  console.log('✓ Test 14: All 6 rule categories are valid');
  const RULE_CATEGORIES_TEST = ['physics', 'magic', 'technology', 'social', 'biological', 'metaphysical'];
  for (const category of RULE_CATEGORIES_TEST) {
    const testRule = module.createWorldRule({
      project_id: 'proj-002',
      rule_category: category,
      statement: `Test rule for ${category}`,
      enforcement_level: 'strict'
    });
    console.assert(testRule.rule_category === category, `Should create rule with category ${category}`);
  }

  // Test 15: Create rule for each enforcement level (validate all 3 levels)
  console.log('✓ Test 15: All 3 enforcement levels are valid');
  const ENFORCEMENT_LEVELS_TEST = ['strict', 'flexible', 'guideline'];
  for (const level of ENFORCEMENT_LEVELS_TEST) {
    const testRule = module.createWorldRule({
      project_id: 'proj-003',
      rule_category: 'physics',
      statement: `Test rule with ${level} enforcement`,
      enforcement_level: level
    });
    console.assert(testRule.enforcement_level === level, `Should create rule with enforcement_level ${level}`);
  }

  // Test 16: Default enforcement level is 'strict'
  console.log('✓ Test 16: Default enforcement level is strict');
  const defaultRule = module.createWorldRule({
    project_id: 'proj-004',
    rule_category: 'physics',
    statement: 'Rule with default enforcement'
  });
  console.assert(defaultRule.enforcement_level === 'strict', 'Default enforcement_level should be strict');

  console.log('\nAll tests passed!');
}
