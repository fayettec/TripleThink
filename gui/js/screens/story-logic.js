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
        await this.renderCausalityTab(container, projectId);
        break;
      case 'themes':
        await this.renderThemesTab(container, projectId);
        break;
      case 'motifs':
        await this.renderMotifsTab(container, projectId);
        break;
      case 'setup-payoffs':
        await this.renderSetupPayoffsTab(container, projectId);
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
  },

  async renderCausalityTab(container, projectId) {
    try {
      container.innerHTML = '<div class="loading">Loading causality graph...</div>';

      if (!projectId) {
        container.innerHTML = '<div class="empty-state"><p>No project selected. Create or select a project to view causality relationships.</p></div>';
        return;
      }

      // Create causality graph container
      container.innerHTML = '<div id="causality-graph-container"></div>';

      // Get first event to use as starting point
      // In a full implementation, this would have an event picker
      // For now, we'll use a placeholder approach
      const events = await api.request('/api/events');

      if (!events || events.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No events yet. Create events to see their causal relationships.</p></div>';
        return;
      }

      // Use first event as default
      const selectedEventId = state.get('selectedEventId') || events[0].event_uuid;
      const depth = state.get('causalityDepth') || 3;

      // Render causality graph
      await CausalityGraph.render('causality-graph-container', selectedEventId, depth);
    } catch (err) {
      console.error('Error loading causality graph:', err);
      container.innerHTML = `<div class="error"><p>Error loading causality graph: ${err.message}</p></div>`;
    }
  },

  async renderThemesTab(container, projectId) {
    try {
      container.innerHTML = '<div class="loading">Loading themes...</div>';

      if (!projectId) {
        container.innerHTML = '<div class="empty-state"><p>No project selected. Create or select a project to view themes.</p></div>';
        return;
      }

      const themes = await api.getThematicElementsByProject(projectId);

      if (!themes || themes.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No themes defined yet. Add thematic elements to see them here.</p></div>';
        return;
      }

      // Render theme cards
      const cardsHtml = themes.map(theme => ThemeCard.render(theme)).join('');
      container.innerHTML = `<div class="card-grid">${cardsHtml}</div>`;
    } catch (err) {
      console.error('Error loading themes:', err);
      container.innerHTML = `<div class="error"><p>Error loading themes: ${err.message}</p></div>`;
    }
  },

  async renderMotifsTab(container, projectId) {
    try {
      container.innerHTML = '<div class="loading">Loading motifs...</div>';

      if (!projectId) {
        container.innerHTML = '<div class="empty-state"><p>No project selected. Create or select a project to view motifs.</p></div>';
        return;
      }

      const motifs = await api.getMotifInstancesByProject(projectId);

      if (!motifs || motifs.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No motifs recorded yet. Add motif instances to see them here.</p></div>';
        return;
      }

      // Render motif cards
      const cardsHtml = motifs.map(motif => MotifCard.render(motif)).join('');
      container.innerHTML = `<div class="card-grid">${cardsHtml}</div>`;
    } catch (err) {
      console.error('Error loading motifs:', err);
      container.innerHTML = `<div class="error"><p>Error loading motifs: ${err.message}</p></div>`;
    }
  },

  async renderSetupPayoffsTab(container, projectId) {
    try {
      // Clear container and create target div for SetupPayoffList
      container.innerHTML = '<div id="setup-payoff-container"></div>';

      // Let SetupPayoffList handle its own loading and empty states
      await SetupPayoffList.render('setup-payoff-container');
    } catch (err) {
      console.error('Error loading setup/payoffs:', err);
      container.innerHTML = `<div class="error"><p>Error loading setup/payoffs: ${err.message}</p></div>`;
    }
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StoryLogicScreen };
}
