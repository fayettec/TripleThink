/**
 * TripleThink API Client
 * Communication layer for all logic layer REST endpoints
 * Provides methods for causality chains, character arcs, story conflicts,
 * thematic elements, motif instances, setup/payoffs, and world rules
 */

class APIClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
  }

  /**
   * Generic request method with error handling
   * @param {string} endpoint - API endpoint path (e.g., '/api/logic/causality')
   * @param {object} options - Fetch options (method, headers, body)
   * @returns {Promise<any>} Response data
   * @throws {Error} API error with status code and message
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add body if present
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);

      // Handle non-2xx responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      // Parse and return JSON
      const data = await response.json();
      return data;
    } catch (err) {
      // Re-throw with more context if not already an API error
      if (!err.status) {
        const error = new Error(`Network error: ${err.message}`);
        error.originalError = err;
        throw error;
      }
      throw err;
    }
  }

  // ============================================================
  // CAUSALITY CHAIN ENDPOINTS
  // ============================================================

  /**
   * Create a new causality chain
   * @param {object} data - Chain data (cause_event_id, effect_event_id, type, strength, explanation)
   * @returns {Promise<object>} Created chain
   */
  async createCausalityChain(data) {
    return this.request('/api/logic/causality', {
      method: 'POST',
      body: data
    });
  }

  /**
   * Get causality chain by ID
   * @param {string} chainId - Chain UUID
   * @returns {Promise<object>} Chain details
   */
  async getCausalityChain(chainId) {
    return this.request(`/api/logic/causality/${chainId}`);
  }

  /**
   * Traverse causal graph from event
   * @param {string} eventId - Starting event ID
   * @param {number} depth - Traversal depth (1-10, default 3)
   * @returns {Promise<object>} Graph with nodes and edges
   */
  async getCausalityGraph(eventId, depth = 3) {
    return this.request(`/api/logic/causality/chain/${eventId}?depth=${depth}`);
  }

  /**
   * Update causality chain
   * @param {string} chainId - Chain UUID
   * @param {object} updates - Fields to update (strength, explanation)
   * @returns {Promise<object>} Updated chain
   */
  async updateCausalityChain(chainId, updates) {
    return this.request(`/api/logic/causality/${chainId}`, {
      method: 'PUT',
      body: updates
    });
  }

  /**
   * Delete causality chain
   * @param {string} chainId - Chain UUID
   * @returns {Promise<null>} No content
   */
  async deleteCausalityChain(chainId) {
    return this.request(`/api/logic/causality/${chainId}`, {
      method: 'DELETE'
    });
  }

  // ============================================================
  // CHARACTER ARC ENDPOINTS
  // ============================================================

  /**
   * Create a new character arc
   * @param {object} data - Arc data (project_id, character_id, current_phase, etc.)
   * @returns {Promise<object>} Created arc
   */
  async createCharacterArc(data) {
    return this.request('/api/logic/arcs', {
      method: 'POST',
      body: data
    });
  }

  /**
   * Get all character arcs for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<array>} Array of character arcs
   */
  async getCharacterArcsByProject(projectId) {
    return this.request(`/api/logic/arcs/project/${projectId}`);
  }

  /**
   * Get character arc by character ID
   * @param {string} characterId - Character entity ID
   * @returns {Promise<object>} Character arc
   */
  async getCharacterArcByCharacter(characterId) {
    return this.request(`/api/logic/arcs/character/${characterId}`);
  }

  /**
   * Get character arc by arc ID
   * @param {string} arcId - Arc UUID
   * @returns {Promise<object>} Character arc
   */
  async getCharacterArc(arcId) {
    return this.request(`/api/logic/arcs/${arcId}`);
  }

  /**
   * Update character arc
   * @param {string} arcId - Arc UUID
   * @param {object} updates - Fields to update (current_phase, archetype, lie, truth, etc.)
   * @returns {Promise<object>} Updated arc
   */
  async updateCharacterArc(arcId, updates) {
    return this.request(`/api/logic/arcs/${arcId}`, {
      method: 'PUT',
      body: updates
    });
  }

  /**
   * Advance character arc to next phase sequentially
   * @param {string} arcId - Arc UUID
   * @returns {Promise<object>} Updated arc
   */
  async advanceArcPhase(arcId) {
    return this.request(`/api/logic/arcs/${arcId}/advance`, {
      method: 'POST'
    });
  }

  /**
   * Delete character arc
   * @param {string} arcId - Arc UUID
   * @returns {Promise<null>} No content
   */
  async deleteCharacterArc(arcId) {
    return this.request(`/api/logic/arcs/${arcId}`, {
      method: 'DELETE'
    });
  }

  // ============================================================
  // STORY CONFLICT ENDPOINTS
  // ============================================================

  /**
   * Create a new story conflict
   * @param {object} data - Conflict data (project_id, type, protagonist_id, status, etc.)
   * @returns {Promise<object>} Created conflict
   */
  async createStoryConflict(data) {
    return this.request('/api/logic/conflicts', {
      method: 'POST',
      body: data
    });
  }

  /**
   * Get story conflict by ID
   * @param {string} conflictId - Conflict UUID
   * @returns {Promise<object>} Conflict details
   */
  async getStoryConflict(conflictId) {
    return this.request(`/api/logic/conflicts/${conflictId}`);
  }

  /**
   * Get all conflicts for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<array>} Array of conflicts
   */
  async getStoryConflictsByProject(projectId) {
    return this.request(`/api/logic/conflicts/project/${projectId}`);
  }

  /**
   * Update story conflict
   * @param {string} conflictId - Conflict UUID
   * @param {object} updates - Fields to update (status, description, stakes, etc.)
   * @returns {Promise<object>} Updated conflict
   */
  async updateStoryConflict(conflictId, updates) {
    return this.request(`/api/logic/conflicts/${conflictId}`, {
      method: 'PUT',
      body: updates
    });
  }

  /**
   * Transition conflict status
   * @param {string} conflictId - Conflict UUID
   * @param {string} newStatus - New status (latent, active, climactic, resolved)
   * @returns {Promise<object>} Updated conflict
   */
  async transitionConflictStatus(conflictId, newStatus) {
    return this.request(`/api/logic/conflicts/${conflictId}/transition`, {
      method: 'POST',
      body: { new_status: newStatus }
    });
  }

  /**
   * Delete story conflict
   * @param {string} conflictId - Conflict UUID
   * @returns {Promise<null>} No content
   */
  async deleteStoryConflict(conflictId) {
    return this.request(`/api/logic/conflicts/${conflictId}`, {
      method: 'DELETE'
    });
  }

  // ============================================================
  // THEMATIC ELEMENT ENDPOINTS
  // ============================================================

  /**
   * Create a new thematic element
   * @param {object} data - Theme data (project_id, theme_name, core_question, manifestations)
   * @returns {Promise<object>} Created theme
   */
  async createThematicElement(data) {
    return this.request('/api/logic/themes', {
      method: 'POST',
      body: data
    });
  }

  /**
   * Get thematic element by ID
   * @param {string} themeId - Theme UUID
   * @returns {Promise<object>} Theme details
   */
  async getThematicElement(themeId) {
    return this.request(`/api/logic/themes/${themeId}`);
  }

  /**
   * Get all themes for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<array>} Array of themes
   */
  async getThematicElementsByProject(projectId) {
    return this.request(`/api/logic/themes/project/${projectId}`);
  }

  /**
   * Update thematic element
   * @param {string} themeId - Theme UUID
   * @param {object} updates - Fields to update (theme_name, core_question, manifestations)
   * @returns {Promise<object>} Updated theme
   */
  async updateThematicElement(themeId, updates) {
    return this.request(`/api/logic/themes/${themeId}`, {
      method: 'PUT',
      body: updates
    });
  }

  /**
   * Add manifestation to theme
   * @param {string} themeId - Theme UUID
   * @param {string} manifestation - Manifestation text to add
   * @returns {Promise<object>} Updated theme
   */
  async addManifestation(themeId, manifestation) {
    return this.request(`/api/logic/themes/${themeId}/manifestations`, {
      method: 'POST',
      body: { manifestation }
    });
  }

  /**
   * Remove manifestation from theme by index
   * @param {string} themeId - Theme UUID
   * @param {number} index - Index of manifestation to remove
   * @returns {Promise<object>} Updated theme
   */
  async removeManifestation(themeId, index) {
    return this.request(`/api/logic/themes/${themeId}/manifestations/${index}`, {
      method: 'DELETE'
    });
  }

  /**
   * Delete thematic element
   * @param {string} themeId - Theme UUID
   * @returns {Promise<null>} No content
   */
  async deleteThematicElement(themeId) {
    return this.request(`/api/logic/themes/${themeId}`, {
      method: 'DELETE'
    });
  }

  // ============================================================
  // MOTIF INSTANCE ENDPOINTS
  // ============================================================

  /**
   * Create a new motif instance
   * @param {object} data - Motif data (project_id, motif_type, first_occurrence_event_id, recurrence_pattern)
   * @returns {Promise<object>} Created motif
   */
  async createMotifInstance(data) {
    return this.request('/api/logic/motifs', {
      method: 'POST',
      body: data
    });
  }

  /**
   * Get motif instance by ID
   * @param {string} motifId - Motif UUID
   * @returns {Promise<object>} Motif details
   */
  async getMotifInstance(motifId) {
    return this.request(`/api/logic/motifs/${motifId}`);
  }

  /**
   * Get motifs by type for a project
   * @param {string} type - Motif type (visual, auditory, dialogue, object, action)
   * @param {string} projectId - Project ID
   * @returns {Promise<array>} Array of motifs
   */
  async getMotifInstancesByType(type, projectId) {
    return this.request(`/api/logic/motifs/type/${type}?project_id=${projectId}`);
  }

  /**
   * Get all motifs for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<array>} Array of motifs
   */
  async getMotifInstancesByProject(projectId) {
    return this.request(`/api/logic/motifs/project/${projectId}`);
  }

  /**
   * Update motif instance
   * @param {string} motifId - Motif UUID
   * @param {object} updates - Fields to update (recurrence_pattern, thematic_significance)
   * @returns {Promise<object>} Updated motif
   */
  async updateMotifInstance(motifId, updates) {
    return this.request(`/api/logic/motifs/${motifId}`, {
      method: 'PUT',
      body: updates
    });
  }

  /**
   * Delete motif instance
   * @param {string} motifId - Motif UUID
   * @returns {Promise<null>} No content
   */
  async deleteMotifInstance(motifId) {
    return this.request(`/api/logic/motifs/${motifId}`, {
      method: 'DELETE'
    });
  }

  // ============================================================
  // SETUP/PAYOFF ENDPOINTS
  // ============================================================

  /**
   * Create a new setup/payoff
   * @param {object} data - Setup data (project_id, setup_event_id, setup_description, status, etc.)
   * @returns {Promise<object>} Created setup
   */
  async createSetupPayoff(data) {
    return this.request('/api/logic/setup-payoffs', {
      method: 'POST',
      body: data
    });
  }

  /**
   * Get setup/payoff by ID
   * @param {string} setupId - Setup UUID
   * @returns {Promise<object>} Setup details
   */
  async getSetupPayoff(setupId) {
    return this.request(`/api/logic/setup-payoffs/${setupId}`);
  }

  /**
   * Get all setup/payoffs for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<array>} Array of setups
   */
  async getSetupPayoffsByProject(projectId) {
    return this.request(`/api/logic/setup-payoffs/project/${projectId}`);
  }

  /**
   * Get unfired setups (Chekhov's gun tracker)
   * @param {string} projectId - Project ID
   * @returns {Promise<array>} Array of unfired setups (status: planted or referenced)
   */
  async getUnfiredSetups(projectId) {
    return this.request(`/api/logic/setup-payoffs/unfired?project_id=${projectId}`);
  }

  /**
   * Fire a setup (mark as fired with payoff event)
   * @param {string} setupId - Setup UUID
   * @param {string} payoffEventId - Payoff event ID
   * @param {string} firedChapter - Chapter where setup was fired
   * @returns {Promise<object>} Updated setup
   */
  async fireSetup(setupId, payoffEventId, firedChapter) {
    return this.request(`/api/logic/setup-payoffs/${setupId}/fire`, {
      method: 'POST',
      body: { payoff_event_id: payoffEventId, fired_chapter: firedChapter }
    });
  }

  /**
   * Update setup/payoff
   * @param {string} setupId - Setup UUID
   * @param {object} updates - Fields to update (status, setup_description, etc.)
   * @returns {Promise<object>} Updated setup
   */
  async updateSetupPayoff(setupId, updates) {
    return this.request(`/api/logic/setup-payoffs/${setupId}`, {
      method: 'PUT',
      body: updates
    });
  }

  /**
   * Delete setup/payoff
   * @param {string} setupId - Setup UUID
   * @returns {Promise<null>} No content
   */
  async deleteSetupPayoff(setupId) {
    return this.request(`/api/logic/setup-payoffs/${setupId}`, {
      method: 'DELETE'
    });
  }

  // ============================================================
  // WORLD RULE ENDPOINTS
  // ============================================================

  /**
   * Create a new world rule
   * @param {object} data - Rule data (project_id, rule_category, rule_description, enforcement_level, etc.)
   * @returns {Promise<object>} Created rule
   */
  async createWorldRule(data) {
    return this.request('/api/logic/world-rules', {
      method: 'POST',
      body: data
    });
  }

  /**
   * Get world rule by ID
   * @param {string} ruleId - Rule UUID
   * @returns {Promise<object>} Rule details
   */
  async getWorldRule(ruleId) {
    return this.request(`/api/logic/world-rules/${ruleId}`);
  }

  /**
   * Get rules by category for a project
   * @param {string} category - Rule category (physics, magic, social, technology, biology, other)
   * @param {string} projectId - Project ID
   * @returns {Promise<array>} Array of rules
   */
  async getWorldRulesByCategory(category, projectId) {
    return this.request(`/api/logic/world-rules/category/${category}?project_id=${projectId}`);
  }

  /**
   * Get all world rules for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<array>} Array of rules
   */
  async getWorldRulesByProject(projectId) {
    return this.request(`/api/logic/world-rules/project/${projectId}`);
  }

  /**
   * Update world rule
   * @param {string} ruleId - Rule UUID
   * @param {object} updates - Fields to update (rule_description, enforcement_level, exceptions)
   * @returns {Promise<object>} Updated rule
   */
  async updateWorldRule(ruleId, updates) {
    return this.request(`/api/logic/world-rules/${ruleId}`, {
      method: 'PUT',
      body: updates
    });
  }

  /**
   * Delete world rule
   * @param {string} ruleId - Rule UUID
   * @returns {Promise<null>} No content
   */
  async deleteWorldRule(ruleId) {
    return this.request(`/api/logic/world-rules/${ruleId}`, {
      method: 'DELETE'
    });
  }

  // ============================================================
  // NARRATIVE STRUCTURE ENDPOINTS
  // ============================================================

  /**
   * Get all scenes for a fiction
   * @param {string} fictionId - Fiction UUID
   * @returns {Promise<object>} Object with scenes array
   */
  async getScenesByFiction(fictionId) {
    return this.request(`/api/orchestrator/fictions/${fictionId}/scenes`);
  }

  /**
   * Update scene sequence number and chapter assignment
   * @param {string} sceneId - Scene UUID
   * @param {object} data - {sceneNumber, chapterId}
   * @returns {Promise<object>} Updated scene
   */
  async updateSceneSequence(sceneId, data) {
    return this.request(`/api/orchestrator/scenes/${sceneId}`, {
      method: 'PATCH',
      body: data
    });
  }

  /**
   * Batch update scene sequences (for renumbering)
   * @param {array} updates - Array of {sceneId, sceneNumber, chapterId}
   * @returns {Promise<object>} Batch result
   */
  async batchUpdateScenes(updates) {
    // TODO: Implement batch endpoint in orchestrator.js (Plan 02)
    return this.request('/api/orchestrator/scenes/batch', {
      method: 'PATCH',
      body: { updates }
    });
  }

  /**
   * Split chapter at scene index
   * @param {string} chapterId - Chapter ID
   * @param {number} splitIndex - Scene index to split at
   * @returns {Promise<object>} New chapter and updated scenes
   */
  async splitChapter(chapterId, splitIndex) {
    // TODO: Implement chapter split endpoint in orchestrator.js (Plan 02)
    return this.request(`/api/orchestrator/chapters/${chapterId}/split`, {
      method: 'POST',
      body: { splitIndex }
    });
  }

  /**
   * Merge two chapters
   * @param {string} chapter1Id - First chapter ID
   * @param {string} chapter2Id - Second chapter ID
   * @returns {Promise<object>} Merged chapter and updated scenes
   */
  async mergeChapters(chapter1Id, chapter2Id) {
    // TODO: Implement chapter merge endpoint in orchestrator.js (Plan 02)
    return this.request(`/api/orchestrator/chapters/merge`, {
      method: 'POST',
      body: { chapter1Id, chapter2Id }
    });
  }

  /**
   * Rename chapter or scene
   * @param {string} id - Chapter or scene ID
   * @param {string} type - 'chapter' or 'scene'
   * @param {string} newTitle - New title
   * @returns {Promise<object>} Updated entity
   */
  async renameNarrativeNode(id, type, newTitle) {
    const endpoint = type === 'chapter'
      ? `/api/orchestrator/chapters/${id}`
      : `/api/orchestrator/scenes/${id}`;
    return this.request(endpoint, {
      method: 'PATCH',
      body: { title: newTitle }
    });
  }

  /**
   * Delete chapter or scene
   * @param {string} id - Chapter or scene ID
   * @param {string} type - 'chapter' or 'scene'
   * @returns {Promise<void>}
   */
  async deleteNarrativeNode(id, type) {
    const endpoint = type === 'chapter'
      ? `/api/orchestrator/chapters/${id}`
      : `/api/orchestrator/scenes/${id}`;
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  // ============================================================
  // EPISTEMIC ENDPOINTS
  // ============================================================

  /**
   * Get entity's knowledge at a specific timestamp
   * @param {string} entityId - Entity ID
   * @param {number} timestamp - Narrative timestamp
   * @param {object} filters - Optional filters (factType, factKey, fictionId)
   * @returns {Promise<object>} Knowledge state with facts array
   */
  async getEntityKnowledge(entityId, timestamp, filters = {}) {
    const params = new URLSearchParams({ timestamp: timestamp.toString(), ...filters });
    return this.request(`/api/epistemic/entities/${entityId}/knowledge?${params}`);
  }

  /**
   * Get false beliefs for dramatic irony
   * @param {string} entityId - Entity ID
   * @param {number} timestamp - Narrative timestamp
   * @param {string} fictionId - Optional fiction ID filter
   * @returns {Promise<object>} False beliefs array
   */
  async getFalseBeliefs(entityId, timestamp, fictionId = null) {
    const params = new URLSearchParams({ timestamp: timestamp.toString() });
    if (fictionId) params.append('fictionId', fictionId);
    return this.request(`/api/epistemic/entities/${entityId}/false-beliefs?${params}`);
  }

  /**
   * Get knowledge divergence between two entities
   * @param {string} entityAId - First entity ID
   * @param {string} entityBId - Second entity ID
   * @param {number} timestamp - Narrative timestamp
   * @param {string} fictionId - Optional fiction ID filter
   * @returns {Promise<object>} Divergence data
   */
  async getKnowledgeDivergence(entityAId, entityBId, timestamp, fictionId = null) {
    const params = new URLSearchParams({ timestamp: timestamp.toString() });
    if (fictionId) params.append('fictionId', fictionId);
    return this.request(`/api/epistemic/divergence/${entityAId}/${entityBId}?${params}`);
  }

  /**
   * Get all entities who know a specific fact
   * @param {string} factType - Fact type
   * @param {string} factKey - Fact key
   * @param {number} timestamp - Narrative timestamp
   * @param {string} fictionId - Optional fiction ID filter
   * @returns {Promise<object>} Knowers array
   */
  async getFactKnowers(factType, factKey, timestamp, fictionId = null) {
    const params = new URLSearchParams({ timestamp: timestamp.toString() });
    if (fictionId) params.append('fictionId', fictionId);
    return this.request(`/api/epistemic/knowers/${factType}/${factKey}?${params}`);
  }

  // ============================================================
  // RELATIONSHIP ENDPOINTS
  // ============================================================

  /**
   * Get all relationships for a fiction
   * @param {string} fictionId - Fiction UUID
   * @returns {Promise<array>} Array of relationships
   */
  async getRelationships(fictionId) {
    return this.request(`/api/relationships?fiction_id=${fictionId}`);
  }

  /**
   * Get relationships for a specific entity
   * @param {string} entityId - Entity ID
   * @param {string} fictionId - Fiction UUID
   * @param {number} timestamp - Optional narrative timestamp
   * @returns {Promise<array>} Array of relationships
   */
  async getRelationshipsFor(entityId, fictionId, timestamp = null) {
    const timestampParam = timestamp ? `&timestamp=${timestamp}` : '';
    return this.request(`/api/relationships/entity/${entityId}?fiction_id=${fictionId}${timestampParam}`);
  }

  /**
   * Get relationship between two entities
   * @param {string} entityAId - First entity ID
   * @param {string} entityBId - Second entity ID
   * @param {string} fictionId - Fiction UUID
   * @param {number} timestamp - Optional narrative timestamp
   * @returns {Promise<object>} Relationship data
   */
  async getRelationshipBetween(entityAId, entityBId, fictionId, timestamp = null) {
    const timestampParam = timestamp ? `&timestamp=${timestamp}` : '';
    return this.request(`/api/relationships/between?entity_a=${entityAId}&entity_b=${entityBId}&fiction_id=${fictionId}${timestampParam}`);
  }
}

// Export singleton instance
const api = new APIClient();
