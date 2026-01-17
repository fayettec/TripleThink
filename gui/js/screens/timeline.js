/**
 * Timeline Screen
 * Timeline visualization with epistemic states and causality arrows
 */

const TimelineScreen = {
  epistemicEnabled: false,
  causalityEnabled: false,
  scenes: [],

  async render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen timeline-screen">
        <header class="screen-header">
          <h1>Timeline</h1>
          <div class="timeline-controls">
            <label class="timeline-toggle">
              <input type="checkbox" id="epistemic-toggle" />
              <span>Show Knowledge States</span>
            </label>
            <label class="timeline-toggle">
              <input type="checkbox" id="causality-toggle" />
              <span>Show Causality</span>
            </label>
          </div>
          <button class="btn btn-icon" onclick="PowerDrawer.toggle()" title="Open Power Drawer">
            <span>🔍</span>
          </button>
        </header>
        <div class="screen-content">
          <div id="timeline-content"></div>
        </div>
      </div>
    `;

    // Set up toggle handlers
    document.getElementById('epistemic-toggle').addEventListener('change', (e) => {
      this.epistemicEnabled = e.target.checked;
      this.updateTimelineDisplay();
    });

    document.getElementById('causality-toggle').addEventListener('change', (e) => {
      this.causalityEnabled = e.target.checked;
      this.updateTimelineDisplay();
    });

    // Subscribe to viewMode changes to update display
    state.subscribe('viewMode', (mode) => {
      this.updateTimelineDisplay();
    });

    // Initial render
    await this.loadTimeline();
  },

  async loadTimeline() {
    const container = document.getElementById('timeline-content');
    const projectId = state.get('currentProjectId');

    if (!projectId) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⏱️</div>
          <div class="empty-message">No project selected</div>
          <div class="empty-hint">Select a project to view timeline</div>
        </div>
      `;
      return;
    }

    try {
      container.innerHTML = '<div class="loading">Loading timeline...</div>';

      // Fetch scenes for the current fiction (we need to know which fiction)
      // For now, we'll need to extend the API to get scenes by project
      // Using the orchestrator scenes endpoint
      const fictionId = state.get('currentFictionId') || projectId; // Fallback to projectId
      const response = await api.getScenesByFiction(fictionId);
      this.scenes = response.scenes || [];

      if (this.scenes.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📅</div>
            <div class="empty-message">No events in timeline yet</div>
            <div class="empty-hint">Create events to build your story timeline</div>
          </div>
        `;
        return;
      }

      // Sort scenes by narrative_time
      this.scenes.sort((a, b) => a.narrative_time - b.narrative_time);

      await this.updateTimelineDisplay();

    } catch (error) {
      console.error('Error loading timeline:', error);
      container.innerHTML = `
        <div class="error">
          <div class="empty-icon">⚠️</div>
          <div class="empty-message">Error loading timeline</div>
          <div class="empty-hint">${error.message}</div>
        </div>
      `;
    }
  },

  async updateTimelineDisplay() {
    const container = document.getElementById('timeline-content');

    if (!container || this.scenes.length === 0) {
      return;
    }

    let html = '<div class="timeline-events">';

    // Render each scene as a timeline event
    for (const scene of this.scenes) {
      html += await this.renderTimelineEvent(scene);
    }

    html += '</div>';

    container.innerHTML = html;

    // If causality is enabled, draw arrows
    if (this.causalityEnabled) {
      await this.drawCausalityArrows();
    }

    // Set up event handlers for knowledge badge interactions
    if (this.epistemicEnabled) {
      this.setupKnowledgeBadgeHandlers();
    }
  },

  async renderTimelineEvent(scene) {
    // Determine if this is a snapshot anchor or delta
    // Snapshot every 10 events (sequence_index % 10 === 0)
    const isSnapshot = scene.sequence_index && scene.sequence_index % 10 === 0;
    const deltaDistance = scene.sequence_index ? scene.sequence_index % 10 : 0;

    // Build state reconstruction indicator
    let stateIndicator = '';
    if (isSnapshot) {
      stateIndicator = '<span class="snapshot-anchor" title="State Snapshot - Full state capture at this point">⚓ Snapshot</span>';
    } else {
      stateIndicator = `<span class="delta-symbol" title="Delta Event - ${deltaDistance} change${deltaDistance !== 1 ? 's' : ''} since last snapshot">Δ${deltaDistance}</span>`;
    }

    let html = `
      <div class="timeline-event" data-scene-id="${scene.id}" data-timestamp="${scene.narrative_time}">
        <div class="event-card">
          <div class="event-header">
            <span class="event-number">#${scene.scene_number}</span>
            <h3 class="event-title">${scene.title || 'Untitled Scene'}</h3>
            <span class="event-time">T+${scene.narrative_time}</span>
            ${stateIndicator}
          </div>
          <div class="event-body">
            <div class="event-description">${scene.summary || '<em>No summary</em>'}</div>
            ${scene.pov_entity_id ? `<div class="event-pov">POV: ${scene.pov_entity_id}</div>` : ''}
          </div>
    `;

    // If epistemic is enabled, show knowledge badges
    if (this.epistemicEnabled) {
      html += await this.renderKnowledgeBadges(scene);
    }

    html += `
        </div>
      </div>
    `;

    return html;
  },

  async renderKnowledgeBadges(scene) {
    // Get present entities (characters) from the scene
    const presentEntityIds = scene.present_entity_ids ?
      JSON.parse(scene.present_entity_ids) : [];

    if (presentEntityIds.length === 0) {
      return '<div class="knowledge-info">ℹ️ No characters present in this scene</div>';
    }

    let html = '<div class="knowledge-badges">';

    try {
      // For each character, fetch their knowledge at this timestamp
      for (const entityId of presentEntityIds) {
        const knowledge = await api.getEntityKnowledge(entityId, scene.narrative_time);
        const factCount = knowledge.facts ? knowledge.facts.length : 0;

        html += `
          <span class="knowledge-badge" data-entity-id="${entityId}" data-timestamp="${scene.narrative_time}">
            ${entityId}: ${factCount} fact${factCount !== 1 ? 's' : ''}
          </span>
        `;
      }

      // Show info banner if no knowledge data exists
      const hasKnowledge = presentEntityIds.length > 0;
      if (!hasKnowledge) {
        html += '<div class="info-banner">ℹ️ No knowledge data for these events. Track character knowledge via scene editor.</div>';
      }

    } catch (error) {
      console.error('Error fetching knowledge:', error);
      html += '<div class="info-banner">ℹ️ No knowledge data for these events. Track character knowledge via scene editor.</div>';
    }

    html += '</div>';
    return html;
  },

  setupKnowledgeBadgeHandlers() {
    document.querySelectorAll('.knowledge-badge').forEach(badge => {
      badge.addEventListener('click', async (e) => {
        const entityId = e.target.dataset.entityId;
        const timestamp = parseInt(e.target.dataset.timestamp);

        // Toggle expanded facts display
        const existingFacts = e.target.nextElementSibling;
        if (existingFacts && existingFacts.classList.contains('knowledge-facts')) {
          existingFacts.classList.toggle('expanded');
          return;
        }

        // Fetch and display facts
        try {
          const knowledge = await api.getEntityKnowledge(entityId, timestamp);
          const facts = knowledge.facts || [];

          let factsHtml = '<div class="knowledge-facts expanded"><ul>';
          facts.forEach(fact => {
            factsHtml += `<li>${fact.fact_type}: ${fact.fact_key} = ${fact.fact_value}</li>`;
          });
          factsHtml += '</ul></div>';

          e.target.insertAdjacentHTML('afterend', factsHtml);
        } catch (error) {
          console.error('Error loading facts:', error);
        }
      });
    });
  },

  async drawCausalityArrows() {
    // Check if we have any causality data
    const container = document.querySelector('.timeline-events');
    if (!container) return;

    try {
      // For each scene, fetch causality chains
      // This is simplified - in reality we'd need event UUIDs not scene IDs
      // For now, show info banner
      const existingBanner = document.querySelector('.causality-info-banner');
      if (existingBanner) existingBanner.remove();

      const banner = document.createElement('div');
      banner.className = 'info-banner causality-info-banner';
      banner.textContent = 'ℹ️ No causal relationships defined. Create causality chains in Story Logic screen.';
      container.insertBefore(banner, container.firstChild);

      // TODO: Implement actual SVG arrow rendering when we have proper event UUIDs
      // For now, this is a placeholder that shows the UI structure

    } catch (error) {
      console.error('Error drawing causality:', error);
    }
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TimelineScreen };
}
