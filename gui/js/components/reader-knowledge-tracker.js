/**
 * Reader Knowledge Tracker Component
 * Tracks facts revealed to the reader in each scene
 */

const ReaderKnowledgeTracker = {
  /**
   * Get reader entity ID for a fiction
   * Reader is treated as a special entity in the epistemic system
   * @param {string} fictionId - Fiction UUID
   * @returns {string} Reader entity ID
   */
  getReaderEntityId(fictionId) {
    return `reader-${fictionId}`;
  },

  /**
   * Get facts revealed to reader in a specific scene
   * @param {string} sceneId - Scene UUID
   * @param {string} fictionId - Fiction UUID
   * @param {number} sceneTimestamp - Scene narrative timestamp
   * @returns {Promise<array>} Array of fact objects
   */
  async getFacts(sceneId, fictionId, sceneTimestamp) {
    try {
      const readerId = this.getReaderEntityId(fictionId);

      // Query reader knowledge at this scene's timestamp
      const response = await api.request(
        `/api/epistemic/entities/${readerId}/knowledge?timestamp=${sceneTimestamp}&fictionId=${fictionId}`
      );

      return response.facts || [];
    } catch (err) {
      console.error('Failed to fetch reader knowledge:', err);
      return [];
    }
  },

  /**
   * Get cumulative reader knowledge up to and including a scene
   * @param {string} sceneId - Scene UUID
   * @param {string} fictionId - Fiction UUID
   * @param {number} sceneTimestamp - Scene narrative timestamp
   * @returns {Promise<array>} Array of all facts reader knows by this point
   */
  async getCumulativeFacts(sceneId, fictionId, sceneTimestamp) {
    // For cumulative, we use the same endpoint - epistemic module
    // returns all facts known at a given timestamp
    return this.getFacts(sceneId, fictionId, sceneTimestamp);
  },

  /**
   * Add a fact to reader knowledge at a scene
   * @param {string} sceneId - Scene UUID
   * @param {string} factId - Fact UUID
   * @param {string} fictionId - Fiction UUID
   * @param {number} sceneTimestamp - Scene narrative timestamp
   * @returns {Promise<object>} Created fact record
   */
  async addFact(sceneId, factId, fictionId, sceneTimestamp) {
    try {
      const readerId = this.getReaderEntityId(fictionId);

      // Get the fact details to create proper epistemic record
      const fact = await api.request(`/api/epistemic/facts/${factId}`);

      if (!fact) {
        throw new Error('Fact not found');
      }

      // Record that reader learned this fact at this timestamp
      const response = await api.request('/api/epistemic/facts', {
        method: 'POST',
        body: {
          entityId: readerId,
          factType: fact.factType,
          factKey: fact.factKey,
          factValue: fact.factValue,
          learnedAt: sceneTimestamp,
          sourceEvent: sceneId,
          fictionId: fictionId
        }
      });

      return response;
    } catch (err) {
      console.error('Failed to add fact to reader knowledge:', err);
      throw err;
    }
  },

  /**
   * Remove a fact from reader knowledge
   * Note: In event-sourced system, we don't actually delete - we'd record
   * that the fact was "forgotten" or mark it as invalid. For now, this is
   * a no-op placeholder as reader knowledge is typically additive.
   * @param {string} sceneId - Scene UUID
   * @param {string} factId - Fact UUID
   * @returns {Promise<void>}
   */
  async removeFact(sceneId, factId) {
    // In an event-sourced system, reader knowledge is typically additive
    // You might record a "retcon" event instead of deleting
    console.warn('removeFact not fully implemented - reader knowledge is typically additive');
    // TODO: Implement retcon/forget mechanism if needed
  },

  /**
   * Render reader knowledge tracker for a scene
   * @param {string} sceneId - Scene UUID
   * @param {string} fictionId - Fiction UUID
   * @param {number} sceneTimestamp - Scene narrative timestamp
   * @returns {Promise<string>} HTML string
   */
  async render(sceneId, fictionId, sceneTimestamp) {
    if (!sceneId || !fictionId || !sceneTimestamp) {
      return `
        <div class="reader-knowledge-tracker">
          <div class="empty-state">
            <p class="empty-message">Scene information incomplete</p>
          </div>
        </div>
      `;
    }

    try {
      const facts = await this.getFacts(sceneId, fictionId, sceneTimestamp);

      if (facts.length === 0) {
        return `
          <div class="reader-knowledge-tracker">
            <div class="tracker-header">
              <h4>Facts Revealed to Reader</h4>
              <button class="btn btn-sm" onclick="ReaderKnowledgeTracker.openFactSelector('${sceneId}', '${fictionId}', ${sceneTimestamp})">
                + Add Fact
              </button>
            </div>
            <div class="empty-state">
              <p class="empty-icon">📖</p>
              <p class="empty-message">No facts revealed to reader in this scene</p>
              <p class="empty-hint">Click "Add Fact" to track what the reader learns</p>
            </div>
          </div>
        `;
      }

      const factListHTML = facts.map(fact => `
        <div class="fact-item" data-fact-id="${fact.fact_uuid || fact.factId}">
          <div class="fact-content">
            <span class="fact-type badge">${fact.factType || fact.fact_type}</span>
            <span class="fact-key">${fact.factKey || fact.fact_key}</span>
            <span class="fact-value">${fact.factValue || fact.fact_value}</span>
          </div>
          <button class="btn-icon btn-remove"
                  onclick="ReaderKnowledgeTracker.removeFact('${sceneId}', '${fact.fact_uuid || fact.factId}')"
                  title="Remove fact">
            ✕
          </button>
        </div>
      `).join('');

      return `
        <div class="reader-knowledge-tracker">
          <div class="tracker-header">
            <h4>Facts Revealed to Reader</h4>
            <button class="btn btn-sm" onclick="ReaderKnowledgeTracker.openFactSelector('${sceneId}', '${fictionId}', ${sceneTimestamp})">
              + Add Fact
            </button>
          </div>
          <div class="fact-list">
            ${factListHTML}
          </div>
        </div>
      `;
    } catch (err) {
      console.error('Failed to render reader knowledge tracker:', err);
      return `
        <div class="reader-knowledge-tracker">
          <div class="error-state">
            <p class="error-message">Failed to load reader knowledge: ${err.message}</p>
          </div>
        </div>
      `;
    }
  },

  /**
   * Open fact selector modal
   * @param {string} sceneId - Scene UUID
   * @param {string} fictionId - Fiction UUID
   * @param {number} sceneTimestamp - Scene narrative timestamp
   */
  async openFactSelector(sceneId, fictionId, sceneTimestamp) {
    // Simple prompt-based selector for MVP
    // Could be enhanced to a modal with searchable fact list
    const factId = prompt('Enter fact ID to reveal to reader:');

    if (!factId) {
      return;
    }

    try {
      await this.addFact(sceneId, factId, fictionId, sceneTimestamp);

      // Refresh the scene editor to show updated facts
      if (typeof SceneEditor !== 'undefined' && SceneEditor.refresh) {
        await SceneEditor.refresh();
      } else {
        alert('Fact added successfully. Please refresh to see changes.');
      }
    } catch (err) {
      alert(`Failed to add fact: ${err.message}`);
    }
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ReaderKnowledgeTracker };
}
