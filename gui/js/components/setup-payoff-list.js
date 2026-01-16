/**
 * Setup/Payoff List Component
 * Chekhov's gun tracker with status grouping and unfired warnings
 */

const SetupPayoffList = {
  // Status indicators
  STATUS_INDICATORS: {
    'planted': { icon: '🟡', label: 'Planted', color: '#EAB308' },
    'referenced': { icon: '🔵', label: 'Referenced', color: '#3B82F6' },
    'fired': { icon: '✅', label: 'Fired', color: '#10B981' }
  },

  /**
   * Render setup/payoff list in container
   * @param {string} containerId - DOM element ID to render into
   */
  async render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    try {
      // Show loading state
      container.innerHTML = '<div class="loading">Loading setup/payoff tracking...</div>';

      // Get current project ID
      const projectId = state.get('currentProjectId');
      if (!projectId) {
        container.innerHTML = '<div class="empty-state"><p>No project selected. Create or select a project to track setups and payoffs.</p></div>';
        return;
      }

      // Fetch data
      const [setupPayoffs, unfiredSetups] = await Promise.all([
        api.getSetupPayoffsByProject(projectId),
        api.getUnfiredSetups(projectId)
      ]);

      // Render list
      container.innerHTML = this.renderList(setupPayoffs, unfiredSetups);
    } catch (error) {
      console.error('Error loading setup/payoffs:', error);
      container.innerHTML = `<div class="error"><p>Error loading setup/payoffs: ${error.message}</p></div>`;
    }
  },

  /**
   * Render setup/payoff list HTML
   * @param {array} setupPayoffs - All setup/payoffs
   * @param {array} unfiredSetups - Unfired setups
   * @returns {string} HTML string
   */
  renderList(setupPayoffs, unfiredSetups) {
    if (!setupPayoffs || setupPayoffs.length === 0) {
      return '<div class="empty-state"><p>No setups/payoffs recorded yet. Add setups to track narrative promises and their resolutions.</p></div>';
    }

    // Create set of unfired setup IDs for quick lookup
    const unfiredIds = new Set(unfiredSetups.map(s => s.setup_uuid));

    // Group by status
    const grouped = {
      planted: setupPayoffs.filter(s => s.status === 'planted'),
      referenced: setupPayoffs.filter(s => s.status === 'referenced'),
      fired: setupPayoffs.filter(s => s.status === 'fired')
    };

    return `
      <div class="setup-payoff-tracker">
        <header class="tracker-header" style="margin-bottom: 24px;">
          <h2 style="margin-bottom: 8px;">Setup/Payoff Tracking (Chekhov's Gun)</h2>
          ${unfiredSetups.length > 0 ? `
            <div class="warning-banner" style="padding: 12px; background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 4px; color: #92400E;">
              <strong>⚠️ ${unfiredSetups.length} setup${unfiredSetups.length === 1 ? '' : 's'} planted but not fired</strong>
            </div>
          ` : ''}
        </header>

        <div class="tracker-content">
          ${this.renderStatusGroup('planted', grouped.planted, unfiredIds)}
          ${this.renderStatusGroup('referenced', grouped.referenced, unfiredIds)}
          ${this.renderStatusGroup('fired', grouped.fired, unfiredIds)}
        </div>
      </div>
    `;
  },

  /**
   * Render a status group
   * @param {string} status - Status name
   * @param {array} items - Items in this status
   * @param {Set} unfiredIds - Set of unfired setup IDs
   * @returns {string} HTML string
   */
  renderStatusGroup(status, items, unfiredIds) {
    if (!items || items.length === 0) {
      return '';
    }

    const { icon, label, color } = this.STATUS_INDICATORS[status];

    return `
      <div class="status-group" style="margin-bottom: 32px;">
        <h3 style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px; color: ${color};">
          <span>${icon}</span>
          <span>${label} (${items.length})</span>
        </h3>
        <div class="setup-list" style="display: flex; flex-direction: column; gap: 12px;">
          ${items.map(item => this.renderSetupItem(item, unfiredIds.has(item.setup_uuid))).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Render a single setup/payoff item
   * @param {object} item - Setup/payoff data
   * @param {boolean} isUnfired - Whether this is unfired
   * @returns {string} HTML string
   */
  renderSetupItem(item, isUnfired) {
    const bgColor = isUnfired ? '#FEF3C7' : 'var(--color-surface-light)';
    const borderColor = isUnfired ? '#F59E0B' : 'var(--color-border)';

    return `
      <div class="setup-item" style="padding: 16px; background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 4px;">
        <div class="setup-description" style="font-weight: bold; margin-bottom: 8px;">
          ${item.description || item.setup_description}
        </div>
        <div class="setup-details" style="display: flex; flex-direction: column; gap: 4px; font-size: 0.9em; color: var(--color-text-secondary);">
          ${item.planted_chapter ? `
            <div>
              <strong>Planted in:</strong> ${item.planted_chapter}
            </div>
          ` : ''}
          ${item.status === 'fired' && item.fired_chapter ? `
            <div>
              <strong>Fired in:</strong> ${item.fired_chapter}
            </div>
          ` : ''}
          <div>
            <strong>Setup Event:</strong> ${item.setup_event_id}
          </div>
          ${item.payoff_event_id ? `
            <div>
              <strong>Payoff Event:</strong> ${item.payoff_event_id}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SetupPayoffList };
}
