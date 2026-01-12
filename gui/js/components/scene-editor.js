/**
 * Scene Editor Component
 * Comprehensive scene editing with POV, events, and epistemic constraints
 */

const SceneEditor = {
  currentScene: null,
  characters: [],
  events: [],

  async show(sceneId = null) {
    this.currentScene = sceneId;

    // Load characters for POV selector
    await this.loadCharacters();

    if (sceneId) {
      await this.loadScene(sceneId);
    } else {
      this.showNewSceneForm();
    }
  },

  async loadCharacters() {
    try {
      const response = await api.request('/entities?type=character');
      this.characters = response.data || [];
    } catch (error) {
      console.error('Failed to load characters:', error);
      this.characters = [];
    }
  },

  async loadScene(sceneId) {
    try {
      const response = await api.request(`/narrative/scene/${sceneId}`);
      const scene = response.data;
      this.showEditSceneForm(scene);
    } catch (error) {
      console.error('Failed to load scene:', error);
      toast.error('Failed to load scene');
    }
  },

  showNewSceneForm(chapterId = null) {
    const modal = document.getElementById('entity-modal');
    const title = document.getElementById('entity-modal-title');
    const body = document.getElementById('entity-modal-body');

    title.textContent = 'New Scene';

    body.innerHTML = this.renderSceneForm({
      id: 'scene-',
      title: '',
      chapter_id: chapterId,
      pov_character_id: '',
      temporal_start: '',
      temporal_end: '',
      description: '',
      events: [],
      epistemic_constraints: {}
    });

    this.attachFormHandlers();
    modal.classList.remove('hidden');
  },

  showEditSceneForm(scene) {
    const modal = document.getElementById('entity-modal');
    const title = document.getElementById('entity-modal-title');
    const body = document.getElementById('entity-modal-body');

    title.textContent = 'Edit Scene';

    body.innerHTML = this.renderSceneForm(scene);

    this.attachFormHandlers();
    modal.classList.remove('hidden');
  },

  renderSceneForm(scene) {
    return `
      <form id="scene-form">
        <div class="tabs">
          <ul class="tab-list">
            <li><button type="button" class="tab-button active" data-tab="basic">Basic Info</button></li>
            <li><button type="button" class="tab-button" data-tab="events">Events</button></li>
            <li><button type="button" class="tab-button" data-tab="knowledge">Knowledge</button></li>
            <li><button type="button" class="tab-button" data-tab="metadata">Metadata</button></li>
          </ul>
        </div>

        <!-- Basic Info Tab -->
        <div class="tab-content active" id="tab-basic">
          <div class="form-group">
            <label class="form-label">Scene ID</label>
            <input type="text" class="form-input" name="id" value="${scene.id}" ${scene.id !== 'scene-' ? 'readonly' : ''} required>
            <div class="form-help">Unique identifier (e.g., scene-1-1-1)</div>
          </div>

          <div class="form-group">
            <label class="form-label">Title</label>
            <input type="text" class="form-input" name="title" value="${scene.title || ''}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Chapter ID</label>
            <input type="text" class="form-input" name="chapter_id" value="${scene.chapter_id || ''}" required>
            <div class="form-help">The chapter this scene belongs to</div>
          </div>

          <div class="form-group">
            <label class="form-label">POV Character</label>
            <select class="form-select" name="pov_character_id">
              <option value="">None</option>
              ${this.characters.map(char => `
                <option value="${char.id}" ${scene.pov_character_id === char.id ? 'selected' : ''}>
                  ${char.name || char.id}
                </option>
              `).join('')}
            </select>
            <div class="form-help">Whose perspective is this scene from?</div>
          </div>

          <div class="form-group">
            <label class="form-label">Sequence</label>
            <input type="number" class="form-input" name="sequence" value="${scene.sequence || 1}" min="1" required>
            <div class="form-help">Scene order within the chapter</div>
          </div>

          <div class="form-group">
            <label class="form-label">Time Range</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2);">
              <div>
                <label class="form-label" style="font-size: var(--font-size-xs);">Start</label>
                <input type="datetime-local" class="form-input" name="temporal_start" value="${scene.temporal_start || ''}">
              </div>
              <div>
                <label class="form-label" style="font-size: var(--font-size-xs);">End</label>
                <input type="datetime-local" class="form-input" name="temporal_end" value="${scene.temporal_end || ''}">
              </div>
            </div>
            <div class="form-help">When does this scene take place?</div>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" name="description" rows="4">${scene.description || ''}</textarea>
            <div class="form-help">Brief summary of what happens in this scene</div>
          </div>
        </div>

        <!-- Events Tab -->
        <div class="tab-content" id="tab-events">
          <div style="margin-bottom: var(--space-4);">
            <h4 style="margin-bottom: var(--space-2);">Events in This Scene</h4>
            <div id="scene-events-list" style="margin-bottom: var(--space-3);">
              ${this.renderEventsList(scene.events || [])}
            </div>
            <button type="button" class="btn btn-secondary" onclick="EventMapper.show('${scene.id}')">
              + Add Event
            </button>
          </div>
        </div>

        <!-- Knowledge Tab -->
        <div class="tab-content" id="tab-knowledge">
          <div style="margin-bottom: var(--space-4);">
            <h4 style="margin-bottom: var(--space-2);">POV Knowledge Constraints</h4>
            ${scene.pov_character_id ? `
              <p class="text-gray" style="margin-bottom: var(--space-3);">
                What does ${this.getCharacterName(scene.pov_character_id)} know at this point?
              </p>
              <div id="epistemic-constraints-display">
                <div class="text-gray" style="font-style: italic;">
                  Knowledge validation will be shown here
                </div>
              </div>
            ` : `
              <p class="text-gray" style="font-style: italic;">
                Select a POV character in the Basic Info tab to manage knowledge constraints
              </p>
            `}
          </div>
        </div>

        <!-- Metadata Tab -->
        <div class="tab-content" id="tab-metadata">
          <div style="margin-bottom: var(--space-4);">
            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" name="read_metadata_mandatory" ${scene.read_metadata_mandatory ? 'checked' : ''}>
                Mandatory Metadata (AI must always load)
              </label>
            </div>
            <button type="button" class="btn btn-secondary" onclick="MetadataModal.show('${scene.id}', 'scene')">
              Edit Metadata
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeEntityModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Scene</button>
        </div>
      </form>
    `;
  },

  renderEventsList(events) {
    if (!events || events.length === 0) {
      return `
        <div class="text-gray" style="font-style: italic; padding: var(--space-3);">
          No events mapped to this scene yet
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-2);">
        ${events.map(evt => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-2); background: var(--color-gray-50); border-radius: var(--radius-md);">
            <div>
              <div style="font-weight: var(--font-weight-medium);">${evt.id}</div>
              <div class="text-gray" style="font-size: var(--font-size-sm);">${evt.summary || 'No summary'}</div>
            </div>
            <button type="button" class="btn btn-sm btn-danger" onclick="SceneEditor.removeEvent('${evt.id}')">
              Remove
            </button>
          </div>
        `).join('')}
      </div>
    `;
  },

  getCharacterName(characterId) {
    const char = this.characters.find(c => c.id === characterId);
    return char ? (char.name || char.id) : characterId;
  },

  attachFormHandlers() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      });
    });

    // Form submission
    document.getElementById('scene-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveScene(e.target);
    });
  },

  async saveScene(form) {
    const formData = new FormData(form);
    const data = {
      id: formData.get('id'),
      title: formData.get('title'),
      chapter_id: formData.get('chapter_id'),
      pov_character_id: formData.get('pov_character_id') || null,
      sequence: parseInt(formData.get('sequence')),
      temporal_start: formData.get('temporal_start') || null,
      temporal_end: formData.get('temporal_end') || null,
      description: formData.get('description') || '',
      read_metadata_mandatory: formData.get('read_metadata_mandatory') === 'on' ? 1 : 0
    };

    try {
      if (this.currentScene && this.currentScene !== 'scene-') {
        // Update existing scene
        await api.request(`/narrative/scene/${this.currentScene}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        toast.success('Scene updated successfully');
      } else {
        // Create new scene
        await api.request('/narrative/scene', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        toast.success('Scene created successfully');
      }

      closeEntityModal();

      // Reload narrative tree if it's visible
      if (typeof NarrativeTree !== 'undefined' && NarrativeTree.load) {
        await NarrativeTree.load();
      }
    } catch (error) {
      console.error('Failed to save scene:', error);
      toast.error('Failed to save scene');
    }
  },

  async removeEvent(eventId) {
    // This will be implemented when event mapping is added
    toast.info('Event removal will be implemented with event mapper');
  }
};

// Make it globally accessible for onclick handlers
window.SceneEditor = SceneEditor;
