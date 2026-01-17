/**
 * Dashboard Screen
 * Story health overview with v4.1 logic layer statistics
 * Tracks unfired setups, incomplete arcs, and unresolved conflicts
 */

const DashboardScreen = {
  async render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen dashboard-screen">
        <header class="screen-header">
          <h1>Dashboard</h1>
          <button class="btn btn-icon" onclick="PowerDrawer.toggle()" title="Open Power Drawer">
            <span>🔍</span>
          </button>
        </header>
        <div class="screen-content">
          <div id="dashboard-content"></div>
        </div>
      </div>
    `;

    // Load dashboard widgets
    await this.loadDashboard();
  },

  async loadDashboard() {
    const container = document.getElementById('dashboard-content');
    const projectId = state.get('currentProjectId');

    if (!projectId) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <div class="empty-message">No project selected</div>
          <div class="empty-hint">Select a project to view story health stats</div>
        </div>
      `;
      return;
    }

    try {
      container.innerHTML = '<div class="loading">Loading dashboard...</div>';

      // Fetch all stats in parallel
      const [unfiredSetups, arcs, conflicts] = await Promise.all([
        api.getUnfiredSetups(projectId).catch(() => []),
        api.getCharacterArcsByProject(projectId).catch(() => []),
        api.getStoryConflictsByProject(projectId).catch(() => [])
      ]);

      // Calculate derived stats
      const unfiredCount = unfiredSetups.length;
      const incompleteArcs = arcs.filter(arc => arc.current_phase !== 'finale');
      const incompleteArcCount = incompleteArcs.length;
      const unresolvedConflicts = conflicts.filter(c => c.status !== 'resolved');
      const unresolvedConflictCount = unresolvedConflicts.length;

      // Render widget grid
      container.innerHTML = `
        <div class="dashboard-grid">
          ${this.renderWidget({
            id: 'unfired-setups',
            icon: '🎯',
            count: unfiredCount,
            label: "Unfired Setups (Chekhov's Guns)",
            warning: unfiredCount > 0,
            route: 'story-logic',
            tab: 'setup-payoffs',
            hint: unfiredCount > 0 ? 'These setups need payoffs' : 'All setups have been fired'
          })}
          ${this.renderWidget({
            id: 'incomplete-arcs',
            icon: '📈',
            count: incompleteArcCount,
            label: 'Incomplete Character Arcs',
            warning: false,
            route: 'story-logic',
            tab: 'arcs',
            hint: incompleteArcCount > 0 ? 'Characters still transforming' : 'All arcs complete'
          })}
          ${this.renderWidget({
            id: 'unresolved-conflicts',
            icon: '⚔️',
            count: unresolvedConflictCount,
            label: 'Unresolved Conflicts',
            warning: false,
            route: 'story-logic',
            tab: 'conflicts',
            hint: unresolvedConflictCount > 0 ? 'Active story tensions' : 'All conflicts resolved'
          })}
        </div>
        <div class="dashboard-footer">
          <p style="color: var(--color-text-secondary); font-size: 0.9em;">
            Click any widget to explore details in Story Logic screen
          </p>
        </div>
      `;

      // Set up widget click handlers
      this.setupWidgetHandlers();

    } catch (error) {
      console.error('Error loading dashboard:', error);
      container.innerHTML = `
        <div class="error">
          <div class="empty-icon">⚠️</div>
          <div class="empty-message">Error loading dashboard</div>
          <div class="empty-hint">${error.message}</div>
        </div>
      `;
    }
  },

  /**
   * Render a stat widget card
   * @param {object} options - Widget configuration
   * @returns {string} Widget HTML
   */
  renderWidget({ id, icon, count, label, warning, route, tab, hint }) {
    const warningClass = warning ? 'widget-warning' : '';
    const warningBadge = warning ? '<span class="warning-badge">⚠️</span>' : '';

    return `
      <div class="stat-widget ${warningClass}" data-route="${route}" data-tab="${tab}" data-widget-id="${id}">
        <div class="widget-icon">${icon}</div>
        <div class="widget-content">
          <div class="widget-count">${count}</div>
          <div class="widget-label">${label} ${warningBadge}</div>
          <div class="widget-hint">${hint}</div>
        </div>
      </div>
    `;
  },

  /**
   * Set up click handlers for widgets to navigate to Story Logic screen
   */
  setupWidgetHandlers() {
    document.querySelectorAll('.stat-widget').forEach(widget => {
      widget.addEventListener('click', (e) => {
        const route = e.currentTarget.dataset.route;
        const tab = e.currentTarget.dataset.tab;

        // Update state with desired tab
        if (tab) {
          state.update({ activeTab: tab });
        }

        // Navigate to route
        window.location.hash = route;
      });

      // Add hover effect hint
      widget.style.cursor = 'pointer';
      widget.title = 'Click to view details';
    });
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DashboardScreen };
}
