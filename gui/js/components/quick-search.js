/**
 * Quick Search Component
 * Cmd+K style fuzzy search
 */

const QuickSearch = {
  results: [],

  init() {
    // Listen for Ctrl+K / Cmd+K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.show();
      }
    });
  },

  show() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('quick-search-modal');

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'quick-search-modal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-backdrop" onclick="QuickSearch.hide()"></div>
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h2>Quick Search</h2>
            <div class="text-gray" style="font-size: var(--font-size-sm);">Ctrl+K</div>
          </div>
          <div class="modal-body">
            <input
              type="text"
              class="form-input"
              id="quick-search-input"
              placeholder="Search entities, characters, events..."
              autofocus
            >
            <div id="quick-search-results" style="margin-top: var(--space-3); max-height: 400px; overflow-y: auto;"></div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');

    // Focus input
    setTimeout(() => {
      document.getElementById('quick-search-input').focus();
    }, 100);

    // Setup search handler
    document.getElementById('quick-search-input').oninput = (e) => {
      this.search(e.target.value);
    };
  },

  hide() {
    const modal = document.getElementById('quick-search-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  },

  async search(query) {
    if (!query || query.length < 2) {
      document.getElementById('quick-search-results').innerHTML = '';
      return;
    }

    try {
      const response = await api.request(`/search?q=${encodeURIComponent(query)}`);
      this.results = response.data || [];
      this.renderResults();
    } catch (error) {
      console.error('Search failed:', error);
    }
  },

  renderResults() {
    const container = document.getElementById('quick-search-results');

    if (this.results.length === 0) {
      container.innerHTML = '<div class="text-gray" style="text-align: center; padding: var(--space-4);">No results found</div>';
      return;
    }

    container.innerHTML = this.results.map((result, idx) => `
      <div
        class="search-result-item"
        style="padding: var(--space-3); border-radius: var(--radius-md); cursor: pointer; transition: background-color var(--transition-fast);"
        onclick="QuickSearch.selectResult('${result.id}')"
        onmouseover="this.style.backgroundColor='var(--color-gray-100)'"
        onmouseout="this.style.backgroundColor='transparent'"
      >
        <div style="font-weight: var(--font-weight-medium);">${result.id}</div>
        <div class="text-gray" style="font-size: var(--font-size-sm);">${result.name || result.summary || 'No description'}</div>
        <div class="text-gray" style="font-size: var(--font-size-xs); margin-top: var(--space-1);">
          Type: ${result.entity_type || 'unknown'}
        </div>
      </div>
    `).join('');
  },

  selectResult(entityId) {
    this.hide();
    // Open entity editor
    if (typeof editEntity === 'function') {
      editEntity(entityId);
    }
  }
};

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  QuickSearch.init();
});

window.QuickSearch = QuickSearch;
