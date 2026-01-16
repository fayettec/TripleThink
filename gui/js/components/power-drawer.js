/**
 * Power Drawer Component
 * Slide-out panel for advanced inspection (Phase 11+)
 */

const PowerDrawer = {
  init() {
    // Create drawer DOM structure and append to body
    const drawer = document.createElement('div');
    drawer.id = 'power-drawer';
    drawer.className = 'power-drawer';
    drawer.innerHTML = `
      <div class="power-drawer-header">
        <h3>Advanced Inspection</h3>
        <button class="power-drawer-close" aria-label="Close">&times;</button>
      </div>
      <div class="power-drawer-content">
        <p>Power drawer content will be populated by screens in Phase 11+</p>
      </div>
    `;
    document.body.appendChild(drawer);

    // Wire up close button
    drawer.querySelector('.power-drawer-close').addEventListener('click', () => {
      PowerDrawer.close();
    });

    // Subscribe to state changes
    state.subscribe('powerDrawerOpen', (isOpen) => {
      if (isOpen) {
        drawer.classList.add('open');
      } else {
        drawer.classList.remove('open');
      }
    });
  },

  open() {
    state.update({ powerDrawerOpen: true });
  },

  close() {
    state.update({ powerDrawerOpen: false });
  },

  toggle() {
    const isOpen = state.get('powerDrawerOpen');
    state.update({ powerDrawerOpen: !isOpen });
  },

  setContent(html) {
    // Allow screens to populate drawer content
    const content = document.querySelector('.power-drawer-content');
    if (content) {
      content.innerHTML = html;
    }
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PowerDrawer };
}
