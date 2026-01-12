/**
 * Narrative Tree Component
 * Hierarchical tree view for Books → Acts → Chapters → Scenes
 */

const NarrativeTree = {
  state: {
    expandedNodes: new Set(),
    selectedNode: null,
    books: [],
    contextMenuNode: null
  },

  icons: {
    book: '📖',
    act: '📑',
    chapter: '📄',
    scene: '🎬'
  },

  async init(containerId) {
    this.containerId = containerId;
    await this.load();
  },

  async load() {
    try {
      const response = await api.request('/narrative/books');
      this.state.books = response.data || [];

      // Load full hierarchy for each book
      for (const book of this.state.books) {
        await this.loadBookHierarchy(book);
      }

      this.render();
    } catch (error) {
      console.error('Failed to load narrative structure:', error);
      document.getElementById(this.containerId).innerHTML = `
        <div style="color: var(--color-red-600); padding: var(--space-4); text-align: center;">
          Failed to load narrative structure
        </div>
      `;
    }
  },

  async loadBookHierarchy(book) {
    try {
      const response = await api.request(`/narrative/book/${book.id}`);
      const data = response.data;
      book.acts = data.acts || [];

      // Scenes will be loaded on-demand when chapters are expanded
      // For now, initialize empty scenes arrays
      for (const act of book.acts) {
        for (const chapter of (act.chapters || [])) {
          chapter.scenes = chapter.scenes || [];
        }
      }
    } catch (error) {
      console.error(`Failed to load hierarchy for book ${book.id}:`, error);
      book.acts = [];
    }
  },

  render() {
    const container = document.getElementById(this.containerId);

    if (!this.state.books || this.state.books.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: var(--space-8); color: var(--color-gray-500);">
          <div style="font-size: var(--font-size-2xl); margin-bottom: var(--space-4);">📚</div>
          <div style="margin-bottom: var(--space-2);">No books in your series yet</div>
          <div style="font-size: var(--font-size-sm);">Go to Projects to create your first book</div>
        </div>
      `;
      return;
    }

    const html = `
      <div class="narrative-tree">
        ${this.state.books.map(book => this.renderBookNode(book)).join('')}
      </div>
    `;

    container.innerHTML = html;
    this.attachEventListeners();
  },

  renderBookNode(book) {
    const expanded = this.state.expandedNodes.has(book.id);
    const selected = this.state.selectedNode === book.id;

    return `
      <div class="tree-node-container" data-id="${book.id}" data-type="book">
        <div class="tree-node ${selected ? 'selected' : ''}" data-id="${book.id}">
          <div class="tree-node-content">
            <span class="tree-toggle" data-id="${book.id}">
              ${expanded ? '▼' : '▶'}
            </span>
            <span class="tree-icon">${this.icons.book}</span>
            <span class="tree-label" ondblclick="NarrativeTree.handleDoubleClick('${book.id}', 'book')">
              ${book.title || book.id}
            </span>
            <div class="tree-actions">
              <button class="btn-icon" onclick="NarrativeTree.addChild('${book.id}', 'act')" title="Add Act">
                + Act
              </button>
              <button class="btn-icon" onclick="NarrativeTree.showContextMenu(event, '${book.id}', 'book')" title="More actions">
                ⋮
              </button>
            </div>
          </div>
        </div>
        ${expanded ? this.renderActs(book.id, book.acts || []) : ''}
      </div>
    `;
  },

  renderActs(bookId, acts) {
    if (!acts || acts.length === 0) {
      return `
        <div class="tree-children">
          <div class="tree-empty">No acts yet</div>
        </div>
      `;
    }

    return `
      <div class="tree-children">
        ${acts.map(act => this.renderActNode(act, bookId)).join('')}
      </div>
    `;
  },

  renderActNode(act, bookId) {
    const expanded = this.state.expandedNodes.has(act.id);
    const selected = this.state.selectedNode === act.id;

    return `
      <div class="tree-node-container" data-id="${act.id}" data-type="act" data-parent="${bookId}">
        <div class="tree-node ${selected ? 'selected' : ''}" data-id="${act.id}">
          <div class="tree-node-content">
            <span class="tree-toggle" data-id="${act.id}">
              ${expanded ? '▼' : '▶'}
            </span>
            <span class="tree-icon">${this.icons.act}</span>
            <span class="tree-label" ondblclick="NarrativeTree.handleDoubleClick('${act.id}', 'act')">
              ${act.title || act.id}
            </span>
            <div class="tree-actions">
              <button class="btn-icon" onclick="NarrativeTree.addChild('${act.id}', 'chapter')" title="Add Chapter">
                + Chapter
              </button>
              <button class="btn-icon" onclick="NarrativeTree.showContextMenu(event, '${act.id}', 'act')" title="More actions">
                ⋮
              </button>
            </div>
          </div>
        </div>
        ${expanded ? this.renderChapters(act.id, act.chapters || []) : ''}
      </div>
    `;
  },

  renderChapters(actId, chapters) {
    if (!chapters || chapters.length === 0) {
      return `
        <div class="tree-children">
          <div class="tree-empty">No chapters yet</div>
        </div>
      `;
    }

    return `
      <div class="tree-children">
        ${chapters.map(chapter => this.renderChapterNode(chapter, actId)).join('')}
      </div>
    `;
  },

  renderChapterNode(chapter, actId) {
    const expanded = this.state.expandedNodes.has(chapter.id);
    const selected = this.state.selectedNode === chapter.id;

    return `
      <div class="tree-node-container" data-id="${chapter.id}" data-type="chapter" data-parent="${actId}">
        <div class="tree-node ${selected ? 'selected' : ''}" data-id="${chapter.id}">
          <div class="tree-node-content">
            <span class="tree-toggle" data-id="${chapter.id}">
              ${expanded ? '▼' : '▶'}
            </span>
            <span class="tree-icon">${this.icons.chapter}</span>
            <span class="tree-label" ondblclick="NarrativeTree.handleDoubleClick('${chapter.id}', 'chapter')">
              ${chapter.title || chapter.id}
            </span>
            <div class="tree-actions">
              <button class="btn-icon" onclick="NarrativeTree.addChild('${chapter.id}', 'scene')" title="Add Scene">
                + Scene
              </button>
              <button class="btn-icon" onclick="NarrativeTree.showContextMenu(event, '${chapter.id}', 'chapter')" title="More actions">
                ⋮
              </button>
            </div>
          </div>
        </div>
        ${expanded ? this.renderScenes(chapter.id, chapter.scenes || []) : ''}
      </div>
    `;
  },

  renderScenes(chapterId, scenes) {
    if (!scenes || scenes.length === 0) {
      return `
        <div class="tree-children">
          <div class="tree-empty">No scenes yet</div>
        </div>
      `;
    }

    return `
      <div class="tree-children">
        ${scenes.map(scene => this.renderSceneNode(scene, chapterId)).join('')}
      </div>
    `;
  },

  renderSceneNode(scene, chapterId) {
    const selected = this.state.selectedNode === scene.id;

    return `
      <div class="tree-node-container" data-id="${scene.id}" data-type="scene" data-parent="${chapterId}">
        <div class="tree-node ${selected ? 'selected' : ''}" data-id="${scene.id}">
          <div class="tree-node-content">
            <span class="tree-icon" style="margin-left: var(--space-6);">${this.icons.scene}</span>
            <span class="tree-label" ondblclick="NarrativeTree.handleDoubleClick('${scene.id}', 'scene')">
              ${scene.title || scene.id}
            </span>
            <div class="tree-actions">
              <button class="btn-icon" onclick="NarrativeTree.editScene('${scene.id}')" title="Edit scene">
                ✏️
              </button>
              <button class="btn-icon" onclick="NarrativeTree.showContextMenu(event, '${scene.id}', 'scene')" title="More actions">
                ⋮
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  attachEventListeners() {
    // Toggle expand/collapse
    document.querySelectorAll('.tree-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const nodeId = toggle.dataset.id;
        this.toggleNode(nodeId);
      });
    });

    // Node selection
    document.querySelectorAll('.tree-node').forEach(node => {
      node.addEventListener('click', (e) => {
        if (e.target.classList.contains('tree-toggle') ||
            e.target.classList.contains('btn-icon') ||
            e.target.closest('.tree-actions')) {
          return; // Don't select if clicking actions
        }
        const nodeId = node.dataset.id;
        this.selectNode(nodeId);
      });
    });
  },

  toggleNode(nodeId) {
    if (this.state.expandedNodes.has(nodeId)) {
      this.state.expandedNodes.delete(nodeId);
    } else {
      this.state.expandedNodes.add(nodeId);
    }
    this.render();
  },

  selectNode(nodeId) {
    this.state.selectedNode = nodeId;
    this.render();
  },

  handleDoubleClick(nodeId, nodeType) {
    if (nodeType === 'scene') {
      this.editScene(nodeId);
    } else {
      // For books/acts/chapters, expand/collapse on double-click
      this.toggleNode(nodeId);
    }
  },

  async addChild(parentId, childType) {
    const modal = document.getElementById('entity-modal');
    const title = document.getElementById('entity-modal-title');
    const body = document.getElementById('entity-modal-body');

    const labels = {
      act: 'Act',
      chapter: 'Chapter',
      scene: 'Scene'
    };

    title.textContent = `New ${labels[childType]}`;

    const idPrefix = childType === 'act' ? 'act-' :
                      childType === 'chapter' ? 'ch-' : 'scene-';

    body.innerHTML = `
      <form id="narrative-child-form">
        <input type="hidden" name="parent_id" value="${parentId}">
        <input type="hidden" name="type" value="${childType}">

        <div class="form-group">
          <label class="form-label">ID</label>
          <input type="text" class="form-input" name="id" value="${idPrefix}" required>
        </div>

        <div class="form-group">
          <label class="form-label">Title</label>
          <input type="text" class="form-input" name="title" required>
        </div>

        <div class="form-group">
          <label class="form-label">Sequence</label>
          <input type="number" class="form-input" name="sequence" min="1" value="1" required>
        </div>

        ${childType === 'scene' ? `
          <div class="form-group">
            <label class="form-label">Description (optional)</label>
            <textarea class="form-textarea" name="description" rows="3"></textarea>
          </div>
        ` : ''}

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeEntityModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create ${labels[childType]}</button>
        </div>
      </form>
    `;

    document.getElementById('narrative-child-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.createChild(e.target);
    });

    modal.classList.remove('hidden');
  },

  async createChild(form) {
    const formData = new FormData(form);
    const type = formData.get('type');
    const data = {
      id: formData.get('id'),
      title: formData.get('title'),
      sequence: parseInt(formData.get('sequence')),
      parent_id: formData.get('parent_id'),
      structure_type: type
    };

    if (type === 'scene') {
      data.description = formData.get('description') || '';
    }

    try {
      const endpoint = `/narrative/${type}`;
      await api.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} created successfully`);
      closeEntityModal();

      // Expand parent node and reload
      this.state.expandedNodes.add(data.parent_id);
      await this.load();
    } catch (error) {
      console.error(`Failed to create ${type}:`, error);
      toast.error(`Failed to create ${type}`);
    }
  },

  editScene(sceneId) {
    SceneEditor.show(sceneId);
  },

  showContextMenu(event, nodeId, nodeType) {
    event.preventDefault();
    event.stopPropagation();

    // Simple context menu for now - just delete
    const confirmed = confirm(`Delete this ${nodeType}? This action cannot be undone.`);
    if (confirmed) {
      this.deleteNode(nodeId, nodeType);
    }
  },

  async deleteNode(nodeId, nodeType) {
    try {
      const endpoint = nodeType === 'scene'
        ? `/narrative/scene/${nodeId}`
        : `/narrative/structure/${nodeId}`;

      await api.request(endpoint, {
        method: 'DELETE'
      });

      toast.success(`${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} deleted successfully`);
      await this.load();
    } catch (error) {
      console.error(`Failed to delete ${nodeType}:`, error);
      toast.error(`Failed to delete ${nodeType}`);
    }
  },

  expandAll() {
    // Expand all books and acts
    this.state.books.forEach(book => {
      this.state.expandedNodes.add(book.id);
      (book.acts || []).forEach(act => {
        this.state.expandedNodes.add(act.id);
        (act.chapters || []).forEach(chapter => {
          this.state.expandedNodes.add(chapter.id);
        });
      });
    });
    this.render();
  },

  collapseAll() {
    this.state.expandedNodes.clear();
    this.render();
  }
};
