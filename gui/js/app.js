/**
 * Main Application Entry Point
 * Initializes all components and routing
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('TripleThink GUI initialized');

  // Setup global event listeners
  setupGlobalListeners();

  // Initialize router
  router.handleRouteChange();

  // Check API connection
  checkAPIConnection();
});

function setupGlobalListeners() {
  // New entity button
  const newEntityBtn = document.getElementById('new-entity-btn');
  if (newEntityBtn) {
    newEntityBtn.addEventListener('click', () => {
      showNewEntityModal('event');
    });
  }

  // Export button
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        const data = await api.exportProject();
        downloadJSON(data, 'triplethink-export.json');
        toast.success('Project exported');
      } catch (error) {
        console.error('Export failed:', error);
        toast.error('Export failed');
      }
    });
  }

  // Modal overlays close on click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.add('hidden');
      }
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+N: New entity
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      showNewEntityModal();
    }

    // Escape: Close modals
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    }

    // /: Focus search (if on entities screen)
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      const searchInput = document.getElementById('entity-search');
      if (searchInput && !searchInput.classList.contains('hidden')) {
        e.preventDefault();
        searchInput.focus();
      }
    }
  });
}

async function checkAPIConnection() {
  try {
    const status = await api.request('/health');
    console.log('API connected:', status);
  } catch (error) {
    console.error('API connection failed:', error);
    toast.error('Cannot connect to API server. Please ensure it is running on http://localhost:3000');
  }
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
