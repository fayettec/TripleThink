/**
 * Layer Switcher Component
 * Toggles epistemic layers: World Truth, Character View, Reader View
 */

import { state } from '../state.js';

const LayerSwitcher = {
  init(containerId) {
    // Render layer switcher in specified container
    // Called by screens that need layer switching

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`LayerSwitcher: container #${containerId} not found`);
      return;
    }

    const currentMode = state.get('viewMode');

    container.innerHTML = `
      <div class="layer-switcher">
        <button class="layer-btn ${currentMode === 'world-truth' ? 'active' : ''}"
                data-mode="world-truth">
          World Truth
        </button>
        <button class="layer-btn ${currentMode === 'character-view' ? 'active' : ''}"
                data-mode="character-view">
          Character View
        </button>
        <button class="layer-btn ${currentMode === 'reader-view' ? 'active' : ''}"
                data-mode="reader-view">
          Reader View
        </button>
      </div>
    `;

    // Wire up click handlers
    container.querySelectorAll('.layer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        LayerSwitcher.setMode(mode);
      });
    });

    // Subscribe to state changes to update active button
    state.subscribe('viewMode', (newMode) => {
      container.querySelectorAll('.layer-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === newMode);
      });
    });
  },

  setMode(mode) {
    // Validate mode
    const validModes = ['world-truth', 'character-view', 'reader-view'];
    if (!validModes.includes(mode)) {
      console.error(`Invalid viewMode: ${mode}`);
      return;
    }

    state.update({ viewMode: mode });
  },

  getMode() {
    return state.get('viewMode');
  }
};

// Export for module usage
export { LayerSwitcher };

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LayerSwitcher };
}
