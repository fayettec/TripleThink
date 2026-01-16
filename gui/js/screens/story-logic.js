/**
 * Story Logic Screen
 * Visualize character arcs, conflicts, causality, themes, motifs, and setup/payoffs
 */

const StoryLogicScreen = {
  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen story-logic-screen">
        <header class="screen-header">
          <h1>Story Logic</h1>
          <button class="btn btn-icon" onclick="PowerDrawer.toggle()" title="Open Power Drawer">
            <span>🔍</span>
          </button>
        </header>
        <div class="tab-navigation">
          <button class="tab-btn active" data-tab="arcs">Arcs</button>
          <button class="tab-btn" data-tab="conflicts">Conflicts</button>
          <button class="tab-btn" data-tab="causality">Causality</button>
          <button class="tab-btn" data-tab="themes">Themes</button>
          <button class="tab-btn" data-tab="motifs">Motifs</button>
          <button class="tab-btn" data-tab="setup-payoffs">Setup/Payoffs</button>
        </div>
        <div class="screen-content">
          <div id="story-logic-content"></div>
        </div>
      </div>
    `;

    // Initialize active tab from state or default to 'arcs'
    const activeTab = state.get('activeTab') || 'arcs';
    state.update({ activeTab });

    // Set up tab click handlers
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;

        // Update active button styling
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // Update state and render new content
        state.update({ activeTab: tab });
        this.renderTabContent(tab);
      });
    });

    // Render initial tab content
    this.renderTabContent(activeTab);
  },

  async renderTabContent(tab) {
    const container = document.getElementById('story-logic-content');

    if (!container) {
      console.error('Story logic content container not found');
      return;
    }

    // Get current project ID from state
    const projectId = state.get('currentProjectId');

    switch (tab) {
      case 'arcs':
        await this.renderArcsTab(container, projectId);
        break;
      case 'conflicts':
        await this.renderConflictsTab(container, projectId);
        break;
      case 'causality':
        container.innerHTML = '<div class="placeholder"><p>Causality graph visualization will be implemented in Plan 02.</p></div>';
        break;
      case 'themes':
        container.innerHTML = '<div class="placeholder"><p>Thematic elements will be implemented in Plan 03.</p></div>';
        break;
      case 'motifs':
        container.innerHTML = '<div class="placeholder"><p>Motif instances will be implemented in Plan 03.</p></div>';
        break;
      case 'setup-payoffs':
        container.innerHTML = '<div class="placeholder"><p>Setup/Payoff tracking will be implemented in Plan 03.</p></div>';
        break;
      default:
        container.innerHTML = '<div class="placeholder"><p>Unknown tab</p></div>';
    }
  },

  async renderArcsTab(container, projectId) {
    try {
      container.innerHTML = '<div class="loading">Loading character arcs...</div>';

      if (!projectId) {
        container.innerHTML = '<div class="empty-state"><p>No project selected. Create or select a project to view character arcs.</p></div>';
        return;
      }

      const arcs = await api.getCharacterArcsByProject(projectId);

      if (!arcs || arcs.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No character arcs yet. Create characters and define their arcs to see them here.</p></div>';
        return;
      }

      // Render arc cards
      const cardsHtml = arcs.map(arc => ArcCard.render(arc)).join('');
      container.innerHTML = `<div class="card-grid">${cardsHtml}</div>`;
    } catch (err) {
      console.error('Error loading character arcs:', err);
      container.innerHTML = `<div class="error"><p>Error loading character arcs: ${err.message}</p></div>`;
    }
  },

  async renderConflictsTab(container, projectId) {
    try {
      container.innerHTML = '<div class="loading">Loading story conflicts...</div>';

      if (!projectId) {
        container.innerHTML = '<div class="empty-state"><p>No project selected. Create or select a project to view story conflicts.</p></div>';
        return;
      }

      const conflicts = await api.getStoryConflictsByProject(projectId);

      if (!conflicts || conflicts.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No story conflicts yet. Create conflicts to see them here.</p></div>';
        return;
      }

      // Render conflict cards
      const cardsHtml = conflicts.map(conflict => ConflictCard.render(conflict)).join('');
      container.innerHTML = `<div class="card-grid">${cardsHtml}</div>`;
    } catch (err) {
      console.error('Error loading story conflicts:', err);
      container.innerHTML = `<div class="error"><p>Error loading story conflicts: ${err.message}</p></div>`;
    }
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StoryLogicScreen };
}
