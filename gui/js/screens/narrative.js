/**
 * Narrative Screen
 * Narrative structure editor with drag-and-drop chapter/scene management
 */

const NarrativeScreen = {
  async render() {
    const app = document.getElementById('app');

    // Get current project from state
    const currentProject = state.get('currentProjectId');

    if (!currentProject) {
      app.innerHTML = `
        <div class="screen narrative-screen">
          <header class="screen-header">
            <h1>📖 Narrative Structure</h1>
            <button class="btn btn-icon" onclick="PowerDrawer.toggle()" title="Open Power Drawer">
              <span>🔍</span>
            </button>
          </header>
          <div class="screen-content">
            <div class="empty-state">
              <p class="empty-icon">📚</p>
              <p class="empty-message">No project selected</p>
              <p class="empty-hint">Select a project to view narrative structure</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Render screen shell
    app.innerHTML = `
      <div class="screen narrative-screen">
        <header class="screen-header">
          <h1>📖 Narrative Structure</h1>
          <div class="header-actions">
            <button class="btn btn-primary" onclick="NarrativeScreen.createChapter()">+ New Chapter</button>
            <button class="btn btn-primary" onclick="NarrativeScreen.createScene()">+ New Scene</button>
            <button class="btn btn-icon" onclick="PowerDrawer.toggle()" title="Open Power Drawer">
              <span>🔍</span>
            </button>
          </div>
        </header>
        <div class="screen-content">
          <div class="narrative-info">
            <p class="help-text">
              <strong>Drag & Drop:</strong> Reorder scenes and chapters. Auto-numbering applies after drop.
              <br><strong>Actions:</strong> Use icons to rename ✏️, split ✂️, merge 🔗, or delete 🗑️.
            </p>
          </div>
          <div id="narrative-tree-container" class="tree-container">
            <p class="loading">Loading narrative structure...</p>
          </div>
        </div>
      </div>
    `;

    // Render tree editor
    const container = document.getElementById('narrative-tree-container');
    try {
      // Get fiction ID for current project (assuming 1:1 mapping or first fiction)
      const fictions = await api.request('/api/fictions');
      const fiction = fictions.data?.find(f => f.projectId === currentProject);

      if (!fiction) {
        container.innerHTML = `
          <div class="empty-state">
            <p class="empty-icon">📖</p>
            <p class="empty-message">No fiction found for this project</p>
            <p class="empty-hint">Create a fiction to start building narrative structure</p>
          </div>
        `;
        return;
      }

      // Render tree editor with fiction ID
      const treeHTML = await NarrativeTreeEditor.render(fiction.id);
      container.innerHTML = treeHTML;

      // Initialize drag handlers after DOM insertion
      NarrativeTreeEditor.setupDragHandlers();
    } catch (err) {
      console.error('Failed to load narrative structure:', err);
      container.innerHTML = `
        <div class="empty-state">
          <p class="empty-icon">⚠️</p>
          <p class="empty-message">Failed to load narrative structure</p>
          <p class="empty-hint">${err.message}</p>
        </div>
      `;
    }
  },

  async createChapter() {
    const title = prompt('Chapter title:');
    if (!title) return;

    try {
      // Create chapter logic (simplified - may need API endpoint)
      console.log('Create chapter:', title);
      alert('Chapter creation not fully implemented yet - add via scene creation with new chapterId');
    } catch (err) {
      alert(`Failed to create chapter: ${err.message}`);
    }
  },

  async createScene() {
    const title = prompt('Scene title:');
    if (!title) return;

    try {
      const currentProject = state.get('currentProjectId');
      const fictions = await api.request('/api/fictions');
      const fiction = fictions.data?.find(f => f.projectId === currentProject);

      if (!fiction) {
        alert('No fiction found');
        return;
      }

      // Prompt for chapter ID or create unassigned scene
      const chapterId = prompt('Chapter ID (or leave empty for unassigned):');

      await api.request('/api/orchestrator/scenes', {
        method: 'POST',
        body: {
          fictionId: fiction.id,
          chapterId: chapterId || null,
          sceneNumber: 999, // Will be renumbered
          title: title,
          status: 'draft',
          narrativeTime: Date.now()
        }
      });

      // Re-render
      this.render();
    } catch (err) {
      alert(`Failed to create scene: ${err.message}`);
    }
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NarrativeScreen };
}
