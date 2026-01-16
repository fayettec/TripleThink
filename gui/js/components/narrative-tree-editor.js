/**
 * Narrative Tree Editor Component
 * Drag-and-drop tree editor for chapter/scene reordering
 */

const NarrativeTreeEditor = {
  data: {
    chapters: [], // Array of {id, title, scenes: [...]}
    selectedNodeId: null,
    draggedNodeId: null,
    draggedNodeType: null, // 'chapter' or 'scene'
    currentFictionId: null
  },

  /**
   * Render the narrative tree for a fiction
   * @param {string} fictionId - Fiction UUID
   * @returns {Promise<string>} HTML string
   */
  async render(fictionId) {
    if (!fictionId) {
      return `
        <div class="narrative-tree-editor">
          <div class="empty-state">
            <p>No fiction selected</p>
            <p class="hint">Select a fiction to view its narrative structure</p>
          </div>
        </div>
      `;
    }

    this.data.currentFictionId = fictionId;

    try {
      // Fetch all scenes for this fiction
      const response = await api.getScenesByFiction(fictionId);
      const scenes = response.scenes || [];

      // Group scenes by chapter
      this.data.chapters = this.groupScenesByChapter(scenes);

      // Build tree HTML
      const treeHTML = this.buildTreeHTML();

      return `
        <div class="narrative-tree-editor">
          <div class="tree-header">
            <h3>Narrative Structure</h3>
            <span class="chapter-count">${this.data.chapters.length} chapters, ${scenes.length} scenes</span>
          </div>
          ${treeHTML}
        </div>
      `;
    } catch (error) {
      console.error('Error fetching scenes:', error);
      return `
        <div class="narrative-tree-editor">
          <div class="error-state">
            <p>Error loading narrative structure</p>
            <p class="error-message">${error.message}</p>
          </div>
        </div>
      `;
    }
  },

  /**
   * Group scenes by chapter ID
   * @param {array} scenes - Array of scene objects
   * @returns {array} Array of chapter objects with nested scenes
   */
  groupScenesByChapter(scenes) {
    const chapterMap = new Map();

    // Group scenes by chapter_id
    for (const scene of scenes) {
      const chapterId = scene.chapterId || 'unassigned';

      if (!chapterMap.has(chapterId)) {
        chapterMap.set(chapterId, {
          id: chapterId,
          title: chapterId === 'unassigned' ? 'Unassigned Scenes' : `Chapter ${chapterId}`,
          scenes: []
        });
      }

      chapterMap.get(chapterId).scenes.push(scene);
    }

    // Convert map to array and sort scenes by sceneNumber
    const chapters = Array.from(chapterMap.values());
    for (const chapter of chapters) {
      chapter.scenes.sort((a, b) => (a.sceneNumber || 0) - (b.sceneNumber || 0));
    }

    // Sort chapters by ID (unassigned last)
    chapters.sort((a, b) => {
      if (a.id === 'unassigned') return 1;
      if (b.id === 'unassigned') return -1;
      return a.id.localeCompare(b.id);
    });

    return chapters;
  },

  /**
   * Build tree HTML from chapter data
   * @returns {string} HTML string
   */
  buildTreeHTML() {
    if (this.data.chapters.length === 0) {
      return `
        <div class="empty-state">
          <p>No scenes in this fiction</p>
          <p class="hint">Create scenes to start building your narrative structure</p>
        </div>
      `;
    }

    const chaptersHTML = this.data.chapters
      .map((chapter, index) => this.renderChapter(chapter, index))
      .join('');

    return `
      <div class="narrative-tree" id="narrative-tree">
        ${chaptersHTML}
      </div>
    `;
  },

  /**
   * Render a single chapter node
   * @param {object} chapter - Chapter object with scenes array
   * @param {number} chapterIndex - Index in chapters array
   * @returns {string} HTML string
   */
  renderChapter(chapter, chapterIndex) {
    const isUnassigned = chapter.id === 'unassigned';
    const sceneCount = chapter.scenes.length;
    const isLastChapter = chapterIndex === this.data.chapters.length - 1;

    return `
      <div class="tree-chapter"
           draggable="${!isUnassigned}"
           data-chapter-id="${chapter.id}"
           data-node-type="chapter">
        <div class="chapter-header">
          <span class="drag-handle">${!isUnassigned ? '☰' : ''}</span>
          <span class="chapter-title">${chapter.title}</span>
          <span class="scene-count">(${sceneCount} scene${sceneCount !== 1 ? 's' : ''})</span>
          <div class="chapter-actions">
            ${!isUnassigned ? `
              <button class="btn-icon" data-action="rename" data-chapter-id="${chapter.id}" title="Rename Chapter">
                ✏️
              </button>
              <button class="btn-icon" data-action="split" data-chapter-id="${chapter.id}" title="Split Chapter">
                ✂️
              </button>
            ` : ''}
            ${!isUnassigned && !isLastChapter ? `
              <button class="btn-icon" data-action="merge" data-chapter-id="${chapter.id}" title="Merge with Next Chapter">
                🔗
              </button>
            ` : ''}
            ${!isUnassigned ? `
              <button class="btn-icon btn-danger" data-action="delete" data-chapter-id="${chapter.id}" title="Delete Chapter">
                🗑️
              </button>
            ` : ''}
          </div>
        </div>
        <div class="chapter-scenes">
          ${chapter.scenes.map(scene => this.renderScene(scene)).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Render a single scene node
   * @param {object} scene - Scene object
   * @returns {string} HTML string
   */
  renderScene(scene) {
    const statusClass = `status-${scene.status || 'draft'}`;
    const statusColors = {
      'draft': '#6c757d',
      'in-progress': '#ffc107',
      'review': '#17a2b8',
      'final': '#28a745'
    };
    const statusColor = statusColors[scene.status] || statusColors['draft'];

    return `
      <div class="tree-scene"
           draggable="true"
           data-scene-id="${scene.id}"
           data-chapter-id="${scene.chapterId || 'unassigned'}"
           data-scene-number="${scene.sceneNumber || 0}"
           data-node-type="scene">
        <span class="drag-handle">☰</span>
        <span class="scene-number">${scene.sceneNumber || '?'}</span>
        <span class="scene-title">${scene.title || '<em>Untitled Scene</em>'}</span>
        <span class="scene-status badge ${statusClass}" style="background-color: ${statusColor}">${scene.status || 'draft'}</span>
        <div class="scene-actions">
          <button class="btn-icon" data-action="rename" data-scene-id="${scene.id}" title="Rename Scene">
            ✏️
          </button>
          <button class="btn-icon btn-danger" data-action="delete" data-scene-id="${scene.id}" title="Delete Scene">
            🗑️
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Setup drag-and-drop event handlers
   * Must be called after render() inserts HTML into DOM
   */
  setupDragHandlers() {
    const tree = document.getElementById('narrative-tree');
    if (!tree) return;

    // Button click handlers for split, merge, rename, delete
    tree.addEventListener('click', (e) => {
      const button = e.target.closest('[data-action]');
      if (!button) return;

      const action = button.dataset.action;
      const chapterId = button.dataset.chapterId;
      const sceneId = button.dataset.sceneId;

      if (action === 'split') {
        this.showSplitDialog(chapterId);
      } else if (action === 'merge') {
        this.mergeWithNext(chapterId);
      } else if (action === 'rename') {
        if (chapterId) {
          this.showRenameDialog(chapterId, 'chapter');
        } else if (sceneId) {
          this.showRenameDialog(sceneId, 'scene');
        }
      } else if (action === 'delete') {
        if (chapterId) {
          this.showDeleteDialog(chapterId, 'chapter');
        } else if (sceneId) {
          this.showDeleteDialog(sceneId, 'scene');
        }
      }
    });

    // Dragstart - Store which node is being dragged
    tree.addEventListener('dragstart', (e) => {
      const target = e.target.closest('[data-node-type]');
      if (!target) return;

      const nodeType = target.dataset.nodeType;
      const nodeId = nodeType === 'chapter'
        ? target.dataset.chapterId
        : target.dataset.sceneId;

      this.data.draggedNodeId = nodeId;
      this.data.draggedNodeType = nodeType;

      target.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', target.innerHTML);
    });

    // Dragover - Allow drop and show visual feedback
    tree.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const target = e.target.closest('[data-node-type]');
      if (!target) return;

      // Don't highlight the dragged element itself
      const draggedElement = document.querySelector('.dragging');
      if (target === draggedElement) return;

      // Add drop-target class
      target.classList.add('drop-target');
    });

    // Dragleave - Remove visual feedback
    tree.addEventListener('dragleave', (e) => {
      const target = e.target.closest('[data-node-type]');
      if (target) {
        target.classList.remove('drop-target');
      }
    });

    // Drop - Handle the drop
    tree.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target.closest('[data-node-type]');
      if (!target) return;

      target.classList.remove('drop-target');

      const targetType = target.dataset.nodeType;
      const targetId = targetType === 'chapter'
        ? target.dataset.chapterId
        : target.dataset.sceneId;

      this.handleDrop(targetId, targetType);
    });

    // Dragend - Cleanup
    tree.addEventListener('dragend', (e) => {
      const dragged = document.querySelector('.dragging');
      if (dragged) {
        dragged.classList.remove('dragging');
      }

      // Remove all drop-target classes
      document.querySelectorAll('.drop-target').forEach(el => {
        el.classList.remove('drop-target');
      });

      this.data.draggedNodeId = null;
      this.data.draggedNodeType = null;
    });
  },

  /**
   * Handle drop event - update scene sequence
   * @param {string} targetId - Target chapter or scene ID
   * @param {string} targetType - 'chapter' or 'scene'
   */
  async handleDrop(targetId, targetType) {
    if (!this.data.draggedNodeId || !this.data.draggedNodeType) {
      console.warn('No dragged node data');
      return;
    }

    const draggedType = this.data.draggedNodeType;
    const draggedId = this.data.draggedNodeId;

    console.log(`Dropped ${draggedType} ${draggedId} onto ${targetType} ${targetId}`);

    // Only handle scene-to-scene and scene-to-chapter drops for now
    if (draggedType === 'scene') {
      try {
        if (targetType === 'scene') {
          // Dropping scene onto another scene - reorder within or across chapters
          await this.reorderSceneToScene(draggedId, targetId);
        } else if (targetType === 'chapter') {
          // Dropping scene onto chapter - move to end of chapter
          await this.moveSceneToChapter(draggedId, targetId);
        }

        // Re-render tree after successful update
        await this.refreshTree();
      } catch (error) {
        console.error('Error updating scene sequence:', error);
        alert(`Error: ${error.message}`);
      }
    } else if (draggedType === 'chapter') {
      // Chapter reordering not implemented yet
      console.log('Chapter reordering not yet implemented');
    }
  },

  /**
   * Reorder scene relative to another scene
   * @param {string} draggedSceneId - Scene being dragged
   * @param {string} targetSceneId - Scene being dropped onto
   */
  async reorderSceneToScene(draggedSceneId, targetSceneId) {
    // Find both scenes in current data
    let draggedScene = null;
    let targetScene = null;

    for (const chapter of this.data.chapters) {
      for (const scene of chapter.scenes) {
        if (scene.id === draggedSceneId) draggedScene = scene;
        if (scene.id === targetSceneId) targetScene = scene;
      }
    }

    if (!draggedScene || !targetScene) {
      throw new Error('Could not find scenes');
    }

    // Track source and destination chapters
    const sourceChapterId = draggedScene.chapterId || 'unassigned';
    const destChapterId = targetScene.chapterId || 'unassigned';

    // Calculate new scene number and chapter
    const newChapterId = targetScene.chapterId;
    const newSceneNumber = targetScene.sceneNumber;

    // Update the dragged scene
    await api.updateSceneSequence(draggedSceneId, {
      chapterId: newChapterId,
      sceneNumber: newSceneNumber
    });

    console.log(`Updated scene ${draggedSceneId} to chapter ${newChapterId}, scene number ${newSceneNumber}`);

    // Renumber affected chapters
    await this.renumberScenes(sourceChapterId);
    if (destChapterId !== sourceChapterId) {
      await this.renumberScenes(destChapterId);
    }
  },

  /**
   * Move scene to end of chapter
   * @param {string} sceneId - Scene ID
   * @param {string} chapterId - Target chapter ID
   */
  async moveSceneToChapter(sceneId, chapterId) {
    // Find source chapter
    const sourceChapterId = this.findChapterForScene(sceneId);

    // Find target chapter
    const chapter = this.data.chapters.find(ch => ch.id === chapterId);
    if (!chapter) {
      throw new Error('Target chapter not found');
    }

    // Calculate new scene number (last in chapter + 1)
    const maxSceneNumber = chapter.scenes.length > 0
      ? Math.max(...chapter.scenes.map(s => s.sceneNumber || 0))
      : 0;
    const newSceneNumber = maxSceneNumber + 1;

    // Update the scene
    await api.updateSceneSequence(sceneId, {
      chapterId: chapterId === 'unassigned' ? null : chapterId,
      sceneNumber: newSceneNumber
    });

    console.log(`Moved scene ${sceneId} to chapter ${chapterId}, scene number ${newSceneNumber}`);

    // Renumber affected chapters
    if (sourceChapterId) {
      await this.renumberScenes(sourceChapterId);
    }
    if (chapterId !== sourceChapterId) {
      await this.renumberScenes(chapterId);
    }
  },

  /**
   * Refresh tree after data changes
   */
  async refreshTree() {
    const container = document.querySelector('.narrative-tree-editor');
    if (!container || !this.data.currentFictionId) return;

    const html = await this.render(this.data.currentFictionId);
    container.outerHTML = html;

    // Re-setup handlers after DOM update
    this.setupDragHandlers();
  },

  /**
   * Renumber scenes in a chapter sequentially
   * @param {string} chapterId - Chapter ID to renumber
   */
  async renumberScenes(chapterId) {
    // Find the chapter
    const chapter = this.data.chapters.find(ch => ch.id === chapterId);
    if (!chapter || chapter.scenes.length === 0) return;

    // Build updates array: {sceneId, sceneNumber, chapterId}
    const updates = chapter.scenes.map((scene, index) => ({
      sceneId: scene.id,
      sceneNumber: index + 1,
      chapterId: chapterId === 'unassigned' ? null : chapterId
    }));

    // Batch update via API
    await api.batchUpdateScenes(updates);

    console.log(`Renumbered ${updates.length} scenes in chapter ${chapterId}`);
  },

  /**
   * Find which chapter contains a scene
   * @param {string} sceneId - Scene ID
   * @returns {string|null} Chapter ID or null
   */
  findChapterForScene(sceneId) {
    for (const chapter of this.data.chapters) {
      if (chapter.scenes.some(s => s.id === sceneId)) {
        return chapter.id;
      }
    }
    return null;
  },

  /**
   * Find scene index within its chapter
   * @param {string} sceneId - Scene ID
   * @returns {number} Scene index (0-based)
   */
  findSceneIndex(sceneId) {
    for (const chapter of this.data.chapters) {
      const index = chapter.scenes.findIndex(s => s.id === sceneId);
      if (index !== -1) return index + 1; // Return 1-based scene number
    }
    return 0;
  },

  /**
   * Show rename dialog for chapter or scene
   * @param {string} id - Node ID
   * @param {string} type - 'chapter' or 'scene'
   */
  showRenameDialog(id, type) {
    // Find current title
    let currentTitle = '';
    if (type === 'chapter') {
      const chapter = this.data.chapters.find(ch => ch.id === id);
      currentTitle = chapter?.title || '';
    } else {
      for (const chapter of this.data.chapters) {
        const scene = chapter.scenes.find(s => s.id === id);
        if (scene) {
          currentTitle = scene.title || '';
          break;
        }
      }
    }

    // Prompt for new title
    const newTitle = prompt(`Rename ${type}:`, currentTitle);
    if (newTitle === null || newTitle.trim() === '') return; // Cancelled or empty

    this.renameNode(id, type, newTitle.trim());
  },

  /**
   * Rename a chapter or scene
   * @param {string} id - Node ID
   * @param {string} type - 'chapter' or 'scene'
   * @param {string} newTitle - New title
   */
  async renameNode(id, type, newTitle) {
    try {
      // Call API to rename
      await api.renameNarrativeNode(id, type, newTitle);

      // Re-render tree
      await this.refreshTree();

      console.log(`${type} renamed to "${newTitle}"`);
    } catch (err) {
      console.error(`Rename ${type} failed:`, err);
      alert(`Failed to rename ${type}: ${err.message}`);
    }
  },

  /**
   * Show delete confirmation dialog for chapter or scene
   * @param {string} id - Node ID
   * @param {string} type - 'chapter' or 'scene'
   */
  showDeleteDialog(id, type) {
    // Find entity name for confirmation
    let name = '';
    let sceneCount = 0;

    if (type === 'chapter') {
      const chapter = this.data.chapters.find(ch => ch.id === id);
      name = chapter?.title || 'this chapter';
      sceneCount = chapter?.scenes?.length || 0;
    } else {
      for (const chapter of this.data.chapters) {
        const scene = chapter.scenes.find(s => s.id === id);
        if (scene) {
          name = scene.title || 'this scene';
          break;
        }
      }
    }

    // Confirmation message
    let message = `Delete ${type} "${name}"?`;
    if (type === 'chapter' && sceneCount > 0) {
      message += ` This will also delete ${sceneCount} scene${sceneCount !== 1 ? 's' : ''}.`;
    }
    message += '\n\nThis action cannot be undone.';

    const confirmed = confirm(message);
    if (!confirmed) return;

    this.deleteNode(id, type);
  },

  /**
   * Delete a chapter or scene
   * @param {string} id - Node ID
   * @param {string} type - 'chapter' or 'scene'
   */
  async deleteNode(id, type) {
    try {
      // Call API to delete
      await api.deleteNarrativeNode(id, type);

      // Re-render tree
      await this.refreshTree();

      console.log(`${type} deleted: ${id}`);
    } catch (err) {
      console.error(`Delete ${type} failed:`, err);
      alert(`Failed to delete ${type}: ${err.message}`);
    }
  },

  /**
   * Show split chapter dialog
   * @param {string} chapterId - Chapter ID to split
   */
  showSplitDialog(chapterId) {
    const chapter = this.data.chapters.find(ch => ch.id === chapterId);
    if (!chapter || chapter.scenes.length < 2) {
      alert('Chapter must have at least 2 scenes to split');
      return;
    }

    // Simple prompt for split index
    const splitIndex = prompt(`Split chapter "${chapter.title}" at scene number (2-${chapter.scenes.length}):`);
    const index = parseInt(splitIndex, 10);

    if (isNaN(index) || index < 2 || index > chapter.scenes.length) {
      alert('Invalid split index');
      return;
    }

    this.splitChapter(chapterId, index);
  },

  /**
   * Split a chapter at the specified scene index
   * @param {string} chapterId - Chapter ID
   * @param {number} splitIndex - Scene number to split at (1-based)
   */
  async splitChapter(chapterId, splitIndex) {
    try {
      // Call API to split chapter
      await api.splitChapter(chapterId, splitIndex);

      // Re-render tree
      await this.refreshTree();

      console.log(`Chapter split at scene ${splitIndex}`);
    } catch (err) {
      console.error('Split chapter failed:', err);
      alert(`Failed to split chapter: ${err.message}`);
    }
  },

  /**
   * Merge chapter with the next chapter
   * @param {string} chapterId - Chapter ID
   */
  async mergeWithNext(chapterId) {
    const chapterIndex = this.data.chapters.findIndex(ch => ch.id === chapterId);
    if (chapterIndex === -1 || chapterIndex === this.data.chapters.length - 1) {
      alert('Cannot merge last chapter');
      return;
    }

    const currentChapter = this.data.chapters[chapterIndex];
    const nextChapter = this.data.chapters[chapterIndex + 1];

    const confirmed = confirm(`Merge "${currentChapter.title}" with "${nextChapter.title}"? This will combine all scenes into ${currentChapter.title}.`);
    if (!confirmed) return;

    try {
      // Call API to merge chapters
      await api.mergeChapters(chapterId, nextChapter.id);

      // Re-render tree
      await this.refreshTree();

      console.log(`Chapters merged: ${chapterId} + ${nextChapter.id}`);
    } catch (err) {
      console.error('Merge chapters failed:', err);
      alert(`Failed to merge chapters: ${err.message}`);
    }
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NarrativeTreeEditor };
}
