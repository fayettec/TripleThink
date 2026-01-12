/**
 * Event Mapper Component
 * Map world events to narrative scenes
 */

const EventMapper = {
  currentSceneId: null,
  availableEvents: [],
  selectedEvents: new Set(),

  async show(sceneId) {
    this.currentSceneId = sceneId;
    this.selectedEvents.clear();

    // Create a secondary modal for event selection
    this.createEventMapperModal();
    await this.loadAvailableEvents();
  },

  createEventMapperModal() {
    // Check if modal already exists
    let modal = document.getElementById('event-mapper-modal');

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'event-mapper-modal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-backdrop" onclick="EventMapper.close()"></div>
        <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
            <h2 id="event-mapper-title">Add Events to Scene</h2>
            <button class="modal-close" onclick="EventMapper.close()">×</button>
          </div>
          <div class="modal-body" id="event-mapper-body">
            <div class="loading">Loading events...</div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="EventMapper.close()">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="EventMapper.addSelectedEvents()">Add Selected Events</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');
  },

  async loadAvailableEvents() {
    const body = document.getElementById('event-mapper-body');

    try {
      const response = await api.request('/entities?type=event');
      this.availableEvents = response.data || [];

      if (this.availableEvents.length === 0) {
        body.innerHTML = `
          <div class="text-gray" style="text-align: center; padding: var(--space-8);">
            <div style="font-size: var(--font-size-xl); margin-bottom: var(--space-2);">📅</div>
            <div>No events found</div>
            <div style="font-size: var(--font-size-sm); margin-top: var(--space-2);">
              Create events in the Timeline screen first
            </div>
          </div>
        `;
        return;
      }

      body.innerHTML = this.renderEventsList();
    } catch (error) {
      console.error('Failed to load events:', error);
      body.innerHTML = `
        <div style="color: var(--color-red-600); text-align: center; padding: var(--space-4);">
          Failed to load events
        </div>
      `;
    }
  },

  renderEventsList() {
    return `
      <div style="margin-bottom: var(--space-3);">
        <input
          type="text"
          class="form-input"
          placeholder="Search events..."
          id="event-search"
          oninput="EventMapper.filterEvents(this.value)"
        >
      </div>
      <div id="events-list-container" style="max-height: 400px; overflow-y: auto;">
        ${this.renderEvents(this.availableEvents)}
      </div>
      <div style="margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--color-gray-200);">
        <div class="text-gray" style="font-size: var(--font-size-sm);">
          <span id="selected-count">0</span> events selected
        </div>
      </div>
    `;
  },

  renderEvents(events) {
    return events.map(evt => `
      <div class="event-item" data-event-id="${evt.id}">
        <label style="display: flex; align-items: start; padding: var(--space-3); cursor: pointer; border-radius: var(--radius-md); transition: background-color var(--transition-fast);">
          <input
            type="checkbox"
            value="${evt.id}"
            onchange="EventMapper.toggleEvent('${evt.id}', this.checked)"
            style="margin-top: 2px;"
          >
          <div style="flex: 1; margin-left: var(--space-2);">
            <div style="font-weight: var(--font-weight-medium); margin-bottom: var(--space-1);">
              ${evt.id}
            </div>
            <div class="text-gray" style="font-size: var(--font-size-sm);">
              ${evt.summary || 'No summary'}
            </div>
            ${evt.timestamp ? `
              <div class="text-gray" style="font-size: var(--font-size-xs); margin-top: var(--space-1);">
                ${formatters.formatDate(evt.timestamp)}
              </div>
            ` : ''}
          </div>
        </label>
      </div>
    `).join('');
  },

  filterEvents(query) {
    const filtered = this.availableEvents.filter(evt => {
      const searchStr = `${evt.id} ${evt.summary || ''} ${evt.timestamp || ''}`.toLowerCase();
      return searchStr.includes(query.toLowerCase());
    });

    document.getElementById('events-list-container').innerHTML = this.renderEvents(filtered);
  },

  toggleEvent(eventId, checked) {
    if (checked) {
      this.selectedEvents.add(eventId);
    } else {
      this.selectedEvents.delete(eventId);
    }

    // Update selected count
    document.getElementById('selected-count').textContent = this.selectedEvents.size;
  },

  async addSelectedEvents() {
    if (this.selectedEvents.size === 0) {
      toast.info('No events selected');
      return;
    }

    try {
      // Map each event to the scene
      const eventIds = Array.from(this.selectedEvents);

      await api.request(`/narrative/scene/${this.currentSceneId}/events`, {
        method: 'POST',
        body: JSON.stringify({ event_ids: eventIds })
      });

      toast.success(`Added ${eventIds.length} event(s) to scene`);
      this.close();

      // Reload scene editor if visible
      if (this.currentSceneId) {
        await SceneEditor.loadScene(this.currentSceneId);
      }
    } catch (error) {
      console.error('Failed to add events:', error);
      toast.error('Failed to add events to scene');
    }
  },

  close() {
    const modal = document.getElementById('event-mapper-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
    this.selectedEvents.clear();
  }
};

// Make it globally accessible
window.EventMapper = EventMapper;
