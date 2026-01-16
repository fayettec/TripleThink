// Character Arcs Module
// CRUD operations for CHARACTER_ARCS table
// Tracks character transformation following Save the Cat beat structure

const { v4: uuidv4 } = require('uuid');

// Valid Save the Cat phases
const PHASE_ORDER = [
  'setup',
  'catalyst',
  'debate',
  'break_into_two',
  'b_story',
  'fun_and_games',
  'midpoint',
  'bad_guys_close_in',
  'all_is_lost',
  'dark_night_of_soul',
  'break_into_three',
  'finale',
  'final_image'
];

module.exports = (db) => {
  /**
   * Create a new character arc
   * @param {string} projectId - UUID of the project
   * @param {string} characterId - UUID of the character entity
   * @param {string|null} archetype - Character archetype (e.g., 'hero', 'mentor', 'shadow')
   * @param {string|null} lieBelief - False belief character holds at story start
   * @param {string|null} truthBelief - Truth character must learn
   * @param {string|null} wantExternal - External goal character pursues
   * @param {string|null} needInternal - Internal need character must fulfill
   * @param {string} currentPhase - Current Save the Cat phase (default: 'setup')
   * @returns {object} The created arc object
   */
  const createArc = (
    projectId,
    characterId,
    archetype = null,
    lieBelief = null,
    truthBelief = null,
    wantExternal = null,
    needInternal = null,
    currentPhase = 'setup'
  ) => {
    // Validate phase
    if (!PHASE_ORDER.includes(currentPhase)) {
      throw new Error(`Invalid phase: ${currentPhase}. Must be one of: ${PHASE_ORDER.join(', ')}`);
    }

    const arcUuid = uuidv4();
    const createdAt = Date.now();

    db.prepare(`
      INSERT INTO character_arcs
      (arc_uuid, project_id, character_id, archetype, lie_belief, truth_belief, want_external, need_internal, current_phase, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(arcUuid, projectId, characterId, archetype, lieBelief, truthBelief, wantExternal, needInternal, currentPhase, createdAt);

    return {
      arc_uuid: arcUuid,
      project_id: projectId,
      character_id: characterId,
      archetype,
      lie_belief: lieBelief,
      truth_belief: truthBelief,
      want_external: wantExternal,
      need_internal: needInternal,
      current_phase: currentPhase,
      created_at: createdAt
    };
  };

  /**
   * Get all character arcs for a project
   * @param {string} projectId - UUID of the project
   * @returns {Array} Array of arc objects
   */
  const getArcsByProject = (projectId) => {
    const rows = db.prepare(`
      SELECT arc_uuid, project_id, character_id, archetype, lie_belief, truth_belief, want_external, need_internal, current_phase, created_at
      FROM character_arcs
      WHERE project_id = ?
      ORDER BY created_at ASC
    `).all(projectId);

    return rows.map(row => ({
      arc_uuid: row.arc_uuid,
      project_id: row.project_id,
      character_id: row.character_id,
      archetype: row.archetype,
      lie_belief: row.lie_belief,
      truth_belief: row.truth_belief,
      want_external: row.want_external,
      need_internal: row.need_internal,
      current_phase: row.current_phase,
      created_at: row.created_at
    }));
  };

  /**
   * Get character arc by character ID
   * @param {string} characterId - UUID of the character
   * @returns {object|null} The arc object or null if not found
   */
  const getArcByCharacter = (characterId) => {
    const row = db.prepare(`
      SELECT arc_uuid, project_id, character_id, archetype, lie_belief, truth_belief, want_external, need_internal, current_phase, created_at
      FROM character_arcs
      WHERE character_id = ?
    `).get(characterId);

    if (!row) return null;

    return {
      arc_uuid: row.arc_uuid,
      project_id: row.project_id,
      character_id: row.character_id,
      archetype: row.archetype,
      lie_belief: row.lie_belief,
      truth_belief: row.truth_belief,
      want_external: row.want_external,
      need_internal: row.need_internal,
      current_phase: row.current_phase,
      created_at: row.created_at
    };
  };

  /**
   * Get a single arc by its UUID
   * @param {string} arcUuid - UUID of the arc
   * @returns {object|null} The arc object or null if not found
   */
  const getArcById = (arcUuid) => {
    const row = db.prepare(`
      SELECT arc_uuid, project_id, character_id, archetype, lie_belief, truth_belief, want_external, need_internal, current_phase, created_at
      FROM character_arcs
      WHERE arc_uuid = ?
    `).get(arcUuid);

    if (!row) return null;

    return {
      arc_uuid: row.arc_uuid,
      project_id: row.project_id,
      character_id: row.character_id,
      archetype: row.archetype,
      lie_belief: row.lie_belief,
      truth_belief: row.truth_belief,
      want_external: row.want_external,
      need_internal: row.need_internal,
      current_phase: row.current_phase,
      created_at: row.created_at
    };
  };

  /**
   * Update an existing arc
   * @param {string} arcUuid - UUID of the arc to update
   * @param {object} updates - Object with fields to update (archetype, lie_belief, truth_belief, want_external, need_internal, current_phase)
   * @returns {object|null} The updated arc object or null if not found
   */
  const updateArc = (arcUuid, updates) => {
    // Validate that arc exists
    const existing = getArcById(arcUuid);
    if (!existing) return null;

    // Validate phase if provided
    if (updates.current_phase && !PHASE_ORDER.includes(updates.current_phase)) {
      throw new Error(`Invalid phase: ${updates.current_phase}. Must be one of: ${PHASE_ORDER.join(', ')}`);
    }

    // Build dynamic UPDATE statement based on provided fields
    const allowedFields = ['archetype', 'lie_belief', 'truth_belief', 'want_external', 'need_internal', 'current_phase'];
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

    // Add arc_uuid to params for WHERE clause
    params.push(arcUuid);

    db.prepare(`
      UPDATE character_arcs
      SET ${updateFields.join(', ')}
      WHERE arc_uuid = ?
    `).run(...params);

    // Return updated arc
    return getArcById(arcUuid);
  };

  /**
   * Delete an arc
   * @param {string} arcUuid - UUID of the arc to delete
   * @returns {boolean} True if deleted, false if not found
   */
  const deleteArc = (arcUuid) => {
    const result = db.prepare(`
      DELETE FROM character_arcs WHERE arc_uuid = ?
    `).run(arcUuid);

    return result.changes > 0;
  };

  /**
   * Advance character arc to next Save the Cat phase
   * @param {string} arcUuid - UUID of the arc to advance
   * @returns {object|null} The updated arc object or null if not found
   */
  const advancePhase = (arcUuid) => {
    // Get current arc
    const arc = getArcById(arcUuid);
    if (!arc) return null;

    // Find current phase index
    const currentIndex = PHASE_ORDER.indexOf(arc.current_phase);

    // If already at final phase, return unchanged
    if (currentIndex === PHASE_ORDER.length - 1) {
      return arc;
    }

    // Advance to next phase
    const nextPhase = PHASE_ORDER[currentIndex + 1];

    // Update arc with new phase
    return updateArc(arcUuid, { current_phase: nextPhase });
  };

  return {
    createArc,
    getArcsByProject,
    getArcByCharacter,
    getArcById,
    updateArc,
    deleteArc,
    advancePhase
  };
};
