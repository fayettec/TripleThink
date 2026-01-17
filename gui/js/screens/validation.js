/**
 * Validation Screen
 * Display validation results organized by category tabs
 */

const ValidationScreen = {
  async render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen validation-screen">
        <header class="screen-header">
          <h1>Validation</h1>
          <button class="btn btn-icon" onclick="PowerDrawer.toggle()" title="Open Power Drawer">
            <span>🔍</span>
          </button>
        </header>
        <div class="tab-navigation">
          <button class="tab-btn active" data-tab="epistemic">Epistemic</button>
          <button class="tab-btn" data-tab="causality">Causality</button>
          <button class="tab-btn" data-tab="arcs">Arcs</button>
          <button class="tab-btn" data-tab="conflicts">Conflicts</button>
          <button class="tab-btn" data-tab="setup-payoffs">Setup/Payoffs</button>
          <button class="tab-btn" data-tab="world-rules">World Rules</button>
          <button class="tab-btn" data-tab="narrative">Narrative</button>
          <button class="tab-btn" data-tab="performance">Performance</button>
        </div>
        <div class="screen-content">
          <div id="validation-content"></div>

          <div class="sql-placeholder">
            <div class="placeholder-icon">💡</div>
            <h3>SQL Query Window</h3>
            <p>Coming Soon - Power User Feature</p>
            <p class="placeholder-hint">Direct database queries for advanced analysis and custom reports.</p>
            <button class="btn btn-secondary" disabled>Launch SQL Editor</button>
          </div>
        </div>
      </div>
    `;

    // Initialize active tab from state or default to 'epistemic'
    const activeTab = state.get('activeTab') || 'epistemic';
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
    await this.renderTabContent(activeTab);
  },

  async renderTabContent(tab) {
    const container = document.getElementById('validation-content');

    if (!container) {
      console.error('Validation content container not found');
      return;
    }

    // Get current project ID from state
    const projectId = state.get('currentProjectId');

    if (!projectId) {
      container.innerHTML = '<div class="empty-state"><p>No project selected. Create or select a project to view validation results.</p></div>';
      return;
    }

    try {
      container.innerHTML = '<div class="loading">Running validation...</div>';

      // Fetch validation results
      const validationResults = await api.request('/api/validation');

      // Filter results by category
      const categoryMap = {
        'epistemic': 'epistemic',
        'causality': 'causality',
        'arcs': 'arcs',
        'conflicts': 'conflicts',
        'setup-payoffs': 'setup-payoffs',
        'world-rules': 'world-rules',
        'narrative': 'narrative',
        'performance': 'performance'
      };

      const categoryResults = validationResults.filter(result =>
        result.category === categoryMap[tab]
      );

      // Render results
      if (categoryResults.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">✓</div>
            <div class="empty-message">All checks passed</div>
            <div class="empty-hint">No validation issues found in ${this.getCategoryName(tab)}</div>
          </div>
        `;
        return;
      }

      // Render validation cards
      let html = '<div class="validation-results">';

      categoryResults.forEach(result => {
        const severityColor = this.getSeverityColor(result.severity);
        const severityBadge = `<span class="badge" style="background-color: ${severityColor}; color: white;">${result.severity.toUpperCase()}</span>`;

        html += `
          <div class="card validation-card">
            <div class="card-header">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3>${result.rule_id}</h3>
                ${severityBadge}
              </div>
            </div>
            <div class="card-body">
              <p style="color: #374151; margin-bottom: 0.5rem;">${result.message}</p>
              ${result.artifact ? `<p style="font-size: 0.85rem; color: #6b7280; font-family: monospace;">📄 ${result.artifact}</p>` : ''}
            </div>
          </div>
        `;
      });

      html += '</div>';
      container.innerHTML = html;

    } catch (err) {
      console.error('Error loading validation results:', err);

      // If validation endpoint doesn't exist yet, show placeholder
      if (err.message.includes('404') || err.message.includes('Not Found')) {
        container.innerHTML = `
          <div class="placeholder">
            <div class="empty-icon">🔧</div>
            <div class="empty-message">Validation Service Not Yet Implemented</div>
            <div class="empty-hint">The validation API will be built in Phase 13. This screen shows the UI structure.</div>
          </div>
        `;
      } else {
        container.innerHTML = `<div class="error"><p>Error loading validation results: ${err.message}</p></div>`;
      }
    }
  },

  getCategoryName(tab) {
    const names = {
      'epistemic': 'Epistemic Validation',
      'causality': 'Causality Validation',
      'arcs': 'Character Arcs Validation',
      'conflicts': 'Story Conflicts Validation',
      'setup-payoffs': 'Setup/Payoff Validation',
      'world-rules': 'World Rules Validation',
      'narrative': 'Narrative Structure Validation',
      'performance': 'Performance Benchmarks'
    };
    return names[tab] || tab;
  },

  getSeverityColor(severity) {
    const colors = {
      'error': '#dc2626',
      'warning': '#f59e0b',
      'info': '#3b82f6'
    };
    return colors[severity] || '#6b7280';
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ValidationScreen };
}
