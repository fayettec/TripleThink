/**
 * Knowledge Editor Component
 * Timeline-based editor for character epistemic states
 */

const KnowledgeEditor = {
  currentCharacter: null,
  sliderInstance: null,

  async show(characterId) {
    this.currentCharacter = characterId;

    // Load character data
    try {
      const response = await api.getEntity(characterId);
      const character = response;

      const modal = document.getElementById('knowledge-modal');
      const title = document.getElementById('knowledge-modal-title');
      const body = document.getElementById('knowledge-modal-body');

      title.textContent = `Knowledge Timeline: ${character.name || characterId}`;

      body.innerHTML = `
        <div style="margin-bottom: var(--space-4);">
          <h4 style="margin-bottom: var(--space-3);">Timeline Navigation</h4>
          <div id="knowledge-timeline-slider"></div>
        </div>

        <div style="margin-bottom: var(--space-4);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);">
            <h4 style="margin: 0;">Knowledge at Selected Time</h4>
            <button class="btn btn-sm btn-primary" onclick="KnowledgeEditor.addKnowledgeEvent()">
              + Add Knowledge Event
            </button>
          </div>
          <div id="knowledge-at-time" class="text-gray" style="font-style: italic;">
            Select a time on the timeline above
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="KnowledgeEditor.close()">Close</button>
        </div>
      `;

      modal.classList.remove('hidden');

      // Initialize timeline slider
      await this.initializeTimeline(characterId);
    } catch (error) {
      console.error('Failed to load character:', error);
      toast.error('Failed to load character');
    }
  },

  async initializeTimeline(characterId) {
    // Load knowledge history
    let knowledgeEvents = [];
    try {
      const response = await api.request(`/epistemic/character/${characterId}/knowledge/history`);
      knowledgeEvents = response.data || [];
    } catch (error) {
      console.log('No knowledge history available');
    }

    // Determine date range
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Create timeline slider
    this.sliderInstance = TimelineSlider.create('knowledge-timeline-slider', {
      startDate,
      endDate,
      currentTime: endDate,
      events: knowledgeEvents,
      onChange: (time) => this.loadKnowledgeAtTime(time)
    });

    // Load current knowledge
    this.loadKnowledgeAtTime(endDate);
  },

  async loadKnowledgeAtTime(timestamp) {
    const container = document.getElementById('knowledge-at-time');

    try {
      const response = await api.request(
        `/epistemic/character/${this.currentCharacter}/knowledge?at_timestamp=${timestamp.toISOString()}`
      );
      const data = response.data;

      if (!data || !data.knowledge_state || !data.knowledge_state.facts || data.knowledge_state.facts.length === 0) {
        container.innerHTML = `
          <div class="text-gray" style="font-style: italic; padding: var(--space-4); text-align: center;">
            No knowledge recorded at this time
          </div>
        `;
        return;
      }

      const facts = data.knowledge_state.facts;

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: var(--space-2);">
          ${facts.map((fact, idx) => {
            const isTrue = fact.belief === 'true';
            return `
              <div style="padding: var(--space-3); background: ${isTrue ? '#F0FDF4' : '#FEF2F2'}; border-left: 3px solid ${isTrue ? '#10B981' : '#EF4444'}; border-radius: var(--radius-md);">
                <div style="display: flex; align-items: start; gap: var(--space-2);">
                  <span style="font-size: var(--font-size-lg);">${isTrue ? '✓' : '✗'}</span>
                  <div style="flex: 1;">
                    <div style="font-weight: var(--font-weight-medium); margin-bottom: var(--space-1);">
                      ${fact.content || fact.fact_id || 'Unknown fact'}
                    </div>
                    ${!isTrue && fact.believed_alternative ? `
                      <div style="color: var(--color-red-600); font-size: var(--font-size-sm); margin-bottom: var(--space-1);">
                        Believes: "${fact.believed_alternative}"
                      </div>
                    ` : ''}
                    <div style="font-size: var(--font-size-sm); color: var(--color-gray-600);">
                      <span>Confidence: ${fact.confidence || 'unknown'}</span>
                      ${fact.source ? ` | Source: ${fact.source}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (error) {
      console.error('Failed to load knowledge:', error);
      container.innerHTML = `
        <div style="color: var(--color-red-600); padding: var(--space-4); text-align: center;">
          Failed to load knowledge state
        </div>
      `;
    }
  },

  addKnowledgeEvent() {
    const currentTime = this.sliderInstance ? this.sliderInstance.currentTime : new Date();

    // Show form to add knowledge
    const modal = document.getElementById('entity-modal');
    const title = document.getElementById('entity-modal-title');
    const body = document.getElementById('entity-modal-body');

    title.textContent = 'Add Knowledge Event';

    body.innerHTML = `
      <form id="knowledge-event-form">
        <div class="form-group">
          <label class="form-label">Timestamp</label>
          <input type="datetime-local" class="form-input" name="timestamp" value="${currentTime.toISOString().slice(0, 16)}" required>
        </div>

        <div class="form-group">
          <label class="form-label">Fact Content</label>
          <textarea class="form-textarea" name="content" rows="3" placeholder="What does the character learn?" required></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Belief</label>
          <select class="form-select" name="belief" required onchange="KnowledgeEditor.toggleBelievedAlternative(this.value)">
            <option value="true">True (knows ground truth)</option>
            <option value="false">False (has false belief)</option>
          </select>
        </div>

        <div class="form-group" id="believed-alternative-group" style="display: none;">
          <label class="form-label">Believed Alternative</label>
          <textarea class="form-textarea" name="believed_alternative" rows="2" placeholder="What do they incorrectly believe?"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Confidence</label>
          <select class="form-select" name="confidence">
            <option value="absolute">Absolute</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Source</label>
          <input type="text" class="form-input" name="source" placeholder="e.g., direct_experience, told_by_character_id">
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeEntityModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Knowledge</button>
        </div>
      </form>
    `;

    document.getElementById('knowledge-event-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveKnowledgeEvent(e.target);
    });

    modal.classList.remove('hidden');
  },

  toggleBelievedAlternative(belief) {
    const group = document.getElementById('believed-alternative-group');
    if (belief === 'false') {
      group.style.display = 'block';
    } else {
      group.style.display = 'none';
    }
  },

  async saveKnowledgeEvent(form) {
    const formData = new FormData(form);
    const data = {
      character_id: this.currentCharacter,
      timestamp: formData.get('timestamp'),
      fact: {
        content: formData.get('content'),
        belief: formData.get('belief'),
        believed_alternative: formData.get('believed_alternative') || null,
        confidence: formData.get('confidence'),
        source: formData.get('source') || 'unknown'
      }
    };

    try {
      // Save to metadata (simplified - actual implementation would use epistemic API)
      await api.request(`/metadata`, {
        method: 'POST',
        body: JSON.stringify({
          entity_id: this.currentCharacter,
          entity_type: 'character',
          dev_status: {
            knowledge_events: [data]
          }
        })
      });

      toast.success('Knowledge event added');
      closeEntityModal();

      // Reload knowledge at current time
      const currentTime = this.sliderInstance ? this.sliderInstance.currentTime : new Date();
      await this.loadKnowledgeAtTime(currentTime);
    } catch (error) {
      console.error('Failed to save knowledge event:', error);
      toast.error('Failed to save knowledge event');
    }
  },

  close() {
    if (this.sliderInstance) {
      TimelineSlider.destroy('knowledge-timeline-slider');
      this.sliderInstance = null;
    }

    const modal = document.getElementById('knowledge-modal');
    modal.classList.add('hidden');
  }
};

// Legacy functions for backward compatibility
function showKnowledgeEditor(characterId) {
  KnowledgeEditor.show(characterId);
}

function closeKnowledgeModal() {
  KnowledgeEditor.close();
}

// Make globally accessible
window.KnowledgeEditor = KnowledgeEditor;
