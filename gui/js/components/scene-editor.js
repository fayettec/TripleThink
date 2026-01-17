/**
 * Scene Editor Component
 * Modal editor for scenes with reader knowledge and dramatic irony sections
 */

const SceneEditor = {
  data: {
    currentSceneId: null,
    currentScene: null,
    isOpen: false
  },

  /**
   * Initialize and open the scene editor
   * @param {string} sceneId - Scene UUID
   * @returns {Promise<void>}
   */
  async init(sceneId) {
    if (!sceneId) {
      console.error('SceneEditor: sceneId required');
      return;
    }

    this.data.currentSceneId = sceneId;
    this.data.isOpen = true;

    try {
      // Fetch scene data
      const response = await api.request(`/api/orchestrator/scenes/${sceneId}`);
      this.data.currentScene = response;

      // Render editor modal
      await this.render(sceneId);
    } catch (err) {
      console.error('Failed to initialize scene editor:', err);
      alert(`Failed to load scene: ${err.message}`);
    }
  },

  /**
   * Render the scene editor modal
   * @param {string} sceneId - Scene UUID
   * @returns {Promise<void>}
   */
  async render(sceneId) {
    const scene = this.data.currentScene;

    if (!scene) {
      console.error('SceneEditor: No scene data to render');
      return;
    }

    // Parse present entity IDs
    let presentEntityIds = [];
    try {
      presentEntityIds = scene.presentEntityIds || scene.present_entity_ids
        ? JSON.parse(scene.presentEntityIds || scene.present_entity_ids)
        : [];
    } catch (err) {
      console.warn('Failed to parse present entity IDs:', err);
    }

    // Extract character IDs from present entities (assuming format char-{name})
    const characterIds = presentEntityIds.filter(id => id.startsWith('char-'));

    // Get reader knowledge section HTML
    const readerKnowledgeHTML = await ReaderKnowledgeTracker.render(
      sceneId,
      scene.fictionId || scene.fiction_id,
      scene.narrativeTime || scene.narrative_time
    );

    // Get dramatic irony section HTML
    let dramaticIronyHTML = '';
    if (characterIds.length > 0) {
      dramaticIronyHTML = await DramaticIronyPanel.renderAggregate(
        sceneId,
        characterIds,
        scene.fictionId || scene.fiction_id,
        scene.narrativeTime || scene.narrative_time
      );
    } else {
      dramaticIronyHTML = `
        <div class="dramatic-irony-panel">
          <div class="panel-header">
            <h4>Dramatic Irony Warnings</h4>
          </div>
          <div class="empty-state">
            <p class="empty-message">No characters present in this scene</p>
            <p class="empty-hint">Add characters to present_entity_ids to enable irony detection</p>
          </div>
        </div>
      `;
    }

    // Build modal HTML
    const modalHTML = `
      <div class="modal-overlay" id="scene-editor-overlay" onclick="SceneEditor.cancel()">
        <div class="modal-content scene-editor-modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h2>Edit Scene: ${scene.title || 'Untitled Scene'}</h2>
            <button class="btn-close" onclick="SceneEditor.cancel()" title="Close">✕</button>
          </div>

          <div class="modal-body">
            <!-- Basic Scene Info -->
            <section class="editor-section">
              <h3>Basic Information</h3>
              <div class="form-group">
                <label for="scene-title">Title</label>
                <input type="text" id="scene-title" class="form-control"
                       value="${scene.title || ''}" placeholder="Scene title">
              </div>

              <div class="form-group">
                <label for="scene-summary">Summary</label>
                <textarea id="scene-summary" class="form-control" rows="3"
                          placeholder="Brief scene summary">${scene.summary || ''}</textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="scene-pov">POV Character</label>
                  <input type="text" id="scene-pov" class="form-control"
                         value="${scene.povEntityId || scene.pov_entity_id || ''}"
                         placeholder="char-name">
                </div>

                <div class="form-group">
                  <label for="scene-location">Location</label>
                  <input type="text" id="scene-location" class="form-control"
                         value="${scene.locationId || scene.location_id || ''}"
                         placeholder="location-name">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="scene-mood">Mood</label>
                  <input type="text" id="scene-mood" class="form-control"
                         value="${scene.mood || 'neutral'}" placeholder="neutral">
                </div>

                <div class="form-group">
                  <label for="scene-tension">Tension Level (0-1)</label>
                  <input type="number" id="scene-tension" class="form-control"
                         value="${scene.tensionLevel || scene.tension_level || 0.5}"
                         min="0" max="1" step="0.1">
                </div>
              </div>

              <div class="form-group">
                <label for="scene-stakes">Stakes</label>
                <textarea id="scene-stakes" class="form-control" rows="2"
                          placeholder="What's at risk in this scene?">${scene.stakes || ''}</textarea>
              </div>

              <div class="form-group">
                <label for="scene-goal">Scene Goal</label>
                <textarea id="scene-goal" class="form-control" rows="2"
                          placeholder="What this scene accomplishes narratively">${scene.sceneGoal || scene.scene_goal || ''}</textarea>
              </div>
            </section>

            <!-- Facts Revealed to Reader -->
            <section class="editor-section">
              <h3>Reader Knowledge</h3>
              <div id="reader-knowledge-section">
                ${readerKnowledgeHTML}
              </div>
            </section>

            <!-- Dramatic Irony Warnings -->
            <section class="editor-section">
              <h3>Dramatic Irony</h3>
              <div id="dramatic-irony-section">
                ${dramaticIronyHTML}
              </div>
            </section>

            <!-- Present Entities -->
            <section class="editor-section">
              <h3>Present Entities</h3>
              <div class="form-group">
                <label for="scene-entities">Entity IDs (comma-separated)</label>
                <input type="text" id="scene-entities" class="form-control"
                       value="${presentEntityIds.join(', ')}"
                       placeholder="char-alice, char-bob, loc-garden">
                <small class="form-hint">Characters, objects, and locations present in this scene</small>
              </div>
            </section>

            <!-- Timestamp Info (Read-only) -->
            <section class="editor-section">
              <h3>Timeline</h3>
              <div class="info-row">
                <strong>Narrative Time:</strong>
                <span>${scene.narrativeTime || scene.narrative_time || 0}</span>
              </div>
              <div class="info-row">
                <strong>Duration:</strong>
                <span>${scene.durationMinutes || scene.duration_minutes || 0} minutes</span>
              </div>
              <div class="info-row">
                <strong>Chapter:</strong>
                <span>${scene.chapterId || scene.chapter_id || 'Unassigned'}</span>
              </div>
              <div class="info-row">
                <strong>Scene Number:</strong>
                <span>${scene.sceneNumber || scene.scene_number || 0}</span>
              </div>
            </section>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="SceneEditor.cancel()">Cancel</button>
            <button class="btn btn-primary" onclick="SceneEditor.save()">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    // Insert modal into DOM
    let modalContainer = document.getElementById('scene-editor-container');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'scene-editor-container';
      document.body.appendChild(modalContainer);
    }
    modalContainer.innerHTML = modalHTML;
  },

  /**
   * Save scene changes
   * @returns {Promise<void>}
   */
  async save() {
    const sceneId = this.data.currentSceneId;
    if (!sceneId) {
      console.error('No scene to save');
      return;
    }

    try {
      // Collect form data
      const updates = {
        title: document.getElementById('scene-title')?.value || '',
        summary: document.getElementById('scene-summary')?.value || '',
        povEntityId: document.getElementById('scene-pov')?.value || null,
        locationId: document.getElementById('scene-location')?.value || null,
        mood: document.getElementById('scene-mood')?.value || 'neutral',
        tensionLevel: parseFloat(document.getElementById('scene-tension')?.value || 0.5),
        stakes: document.getElementById('scene-stakes')?.value || '',
        sceneGoal: document.getElementById('scene-goal')?.value || ''
      };

      // Parse entity IDs
      const entitiesInput = document.getElementById('scene-entities')?.value || '';
      const entityIds = entitiesInput
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);

      updates.presentEntityIds = JSON.stringify(entityIds);

      // Update scene via API
      await api.request(`/api/orchestrator/scenes/${sceneId}`, {
        method: 'PATCH',
        body: updates
      });

      // Close modal
      this.close();

      // Refresh parent screen if it has a refresh method
      if (typeof NarrativeScreen !== 'undefined' && NarrativeScreen.render) {
        await NarrativeScreen.render();
      }

      alert('Scene saved successfully');
    } catch (err) {
      console.error('Failed to save scene:', err);
      alert(`Failed to save scene: ${err.message}`);
    }
  },

  /**
   * Cancel editing and close modal
   */
  cancel() {
    this.close();
  },

  /**
   * Close the scene editor modal
   */
  close() {
    this.data.currentSceneId = null;
    this.data.currentScene = null;
    this.data.isOpen = false;

    const modalContainer = document.getElementById('scene-editor-container');
    if (modalContainer) {
      modalContainer.innerHTML = '';
    }
  },

  /**
   * Refresh the editor (re-render with current scene data)
   * Used when reader knowledge or irony data changes
   * @returns {Promise<void>}
   */
  async refresh() {
    if (!this.data.isOpen || !this.data.currentSceneId) {
      return;
    }

    // Reload scene data and re-render
    try {
      const response = await api.request(`/api/orchestrator/scenes/${this.data.currentSceneId}`);
      this.data.currentScene = response;
      await this.render(this.data.currentSceneId);
    } catch (err) {
      console.error('Failed to refresh scene editor:', err);
    }
  },

  /**
   * Check if editor is currently open
   * @returns {boolean}
   */
  isOpen() {
    return this.data.isOpen;
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SceneEditor };
}
