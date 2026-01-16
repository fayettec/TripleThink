/**
 * Epistemic Screen
 * Epistemic graph and knowledge tracking (Phase 11+)
 */

const EpistemicScreen = {
  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen epistemic-screen">
        <header class="screen-header">
          <h1>Epistemic States</h1>
          <button class="btn btn-icon" onclick="PowerDrawer.toggle()" title="Open Power Drawer">
            <span>🔍</span>
          </button>
        </header>
        <div id="layer-switcher-container"></div>
        <div class="screen-content">
          <p>Epistemic graph and knowledge tracking will be implemented in Phase 11.</p>
          <p>Current view mode: <strong id="view-mode-display">${state.get('viewMode')}</strong></p>
        </div>
      </div>
    `;

    // Initialize layer switcher
    LayerSwitcher.init('layer-switcher-container');

    // Subscribe to viewMode changes
    state.subscribe('viewMode', (mode) => {
      const display = document.getElementById('view-mode-display');
      if (display) display.textContent = mode;
    });
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EpistemicScreen };
}
