/**
 * Projects Screen
 * Series/project management and book overview
 */

async function renderProjects() {
  const container = document.getElementById('screen-container');

  document.getElementById('screen-title').textContent = 'Projects';
  document.getElementById('screen-subtitle').textContent = 'Manage your series and books';

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Series Information</h3>
      </div>
      <div style="padding: var(--space-4);">
        <div class="form-group">
          <label class="form-label">Project Name</label>
          <div id="project-name" style="font-size: var(--font-size-lg); font-weight: 600;">
            My TripleThink Project
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <div id="project-description" class="text-gray">
            An event-sourced narrative construction project
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: var(--space-6);">
      <div class="card-header">
        <h3 class="card-title">Books in Series</h3>
        <button class="btn btn-primary btn-sm" onclick="showNewBookModal()">
          + New Book
        </button>
      </div>
      <div id="books-list-container" style="padding: var(--space-4);">
        <div class="loading">Loading books...</div>
      </div>
    </div>

    <div class="card" style="margin-top: var(--space-6);">
      <div class="card-header">
        <h3 class="card-title">Quick Stats</h3>
      </div>
      <div id="stats-container" style="padding: var(--space-4);">
        <div class="loading">Loading statistics...</div>
      </div>
    </div>

    <div style="margin-top: var(--space-6); display: flex; gap: var(--space-3);">
      <button class="btn btn-secondary" onclick="exportProject()">
        Export Project
      </button>
      <button class="btn btn-secondary" onclick="importProject()">
        Import Project
      </button>
    </div>
  `;

  // Load books and stats
  await loadBooks();
  await loadStats();
}

async function loadBooks() {
  const container = document.getElementById('books-list-container');

  try {
    const response = await api.request('/narrative/books');
    const books = response.data || [];

    if (books.length === 0) {
      container.innerHTML = `
        <div class="text-gray" style="text-align: center; padding: var(--space-8);">
          <div style="font-size: var(--font-size-xl); margin-bottom: var(--space-2);">📚</div>
          <div>No books yet</div>
          <div style="font-size: var(--font-size-sm); margin-top: var(--space-2);">
            Click "New Book" to start your series
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = books.map(book => `
      <div class="card" style="margin-bottom: var(--space-4); padding: var(--space-4);">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
              <span style="font-size: var(--font-size-xl);">📖</span>
              <h4 style="margin: 0; font-size: var(--font-size-lg);">${book.title || book.id}</h4>
            </div>
            <div class="text-gray" style="margin-bottom: var(--space-3);">
              ${book.sequence ? `Book ${book.sequence}` : 'Unnumbered'}
            </div>
            <div style="display: flex; gap: var(--space-4); font-size: var(--font-size-sm); color: var(--color-gray-600);">
              <span>Acts: ${book.act_count || 0}</span>
              <span>Chapters: ${book.chapter_count || 0}</span>
              <span>Scenes: ${book.scene_count || 0}</span>
            </div>
          </div>
          <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn-sm btn-secondary" onclick="editBook('${book.id}')">
              Edit
            </button>
            <button class="btn btn-sm btn-secondary" onclick="viewBook('${book.id}')">
              View Structure
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteBook('${book.id}', '${book.title || book.id}')">
              Delete
            </button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load books:', error);
    container.innerHTML = `
      <div style="color: var(--color-red-600); text-align: center; padding: var(--space-4);">
        Failed to load books. Please try again.
      </div>
    `;
  }
}

async function loadStats() {
  const container = document.getElementById('stats-container');

  try {
    const response = await api.request('/status');
    const stats = response.system_stats || {};

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--space-4);">
        <div>
          <div class="text-gray" style="font-size: var(--font-size-sm); margin-bottom: var(--space-1);">Events</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 600;">${stats.total_events || 0}</div>
        </div>
        <div>
          <div class="text-gray" style="font-size: var(--font-size-sm); margin-bottom: var(--space-1);">Characters</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 600;">${stats.total_characters || 0}</div>
        </div>
        <div>
          <div class="text-gray" style="font-size: var(--font-size-sm); margin-bottom: var(--space-1);">Chapters</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 600;">${stats.total_chapters || 0}</div>
        </div>
        <div>
          <div class="text-gray" style="font-size: var(--font-size-sm); margin-bottom: var(--space-1);">Scenes</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 600;">${stats.total_scenes || 0}</div>
        </div>
        <div>
          <div class="text-gray" style="font-size: var(--font-size-sm); margin-bottom: var(--space-1);">Fictions</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 600;">${stats.total_fictions || 0}</div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Failed to load stats:', error);
    container.innerHTML = `
      <div class="text-gray">Unable to load statistics</div>
    `;
  }
}

function showNewBookModal() {
  const modal = document.getElementById('entity-modal');
  const title = document.getElementById('entity-modal-title');
  const body = document.getElementById('entity-modal-body');

  title.textContent = 'New Book';

  body.innerHTML = `
    <form id="book-form">
      <div class="form-group">
        <label class="form-label">Book ID</label>
        <input type="text" class="form-input" name="id" value="book-" required>
        <div class="form-help">Unique identifier (e.g., book-1, book-return-of-the-king)</div>
      </div>

      <div class="form-group">
        <label class="form-label">Title</label>
        <input type="text" class="form-input" name="title" required>
        <div class="form-help">The book's title</div>
      </div>

      <div class="form-group">
        <label class="form-label">Sequence</label>
        <input type="number" class="form-input" name="sequence" min="1" value="1" required>
        <div class="form-help">Book number in the series</div>
      </div>

      <div class="form-group">
        <label class="form-label">Description (optional)</label>
        <textarea class="form-textarea" name="description" rows="3"></textarea>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeEntityModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Book</button>
      </div>
    </form>
  `;

  // Setup form submission
  document.getElementById('book-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await createBook(e.target);
  });

  modal.classList.remove('hidden');
}

async function createBook(form) {
  const formData = new FormData(form);
  const data = {
    id: formData.get('id'),
    title: formData.get('title'),
    sequence: parseInt(formData.get('sequence')),
    description: formData.get('description') || '',
    structure_type: 'book',
    parent_id: null
  };

  try {
    await api.request('/narrative/book', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    toast.success('Book created successfully');
    closeEntityModal();
    await loadBooks();
  } catch (error) {
    console.error('Failed to create book:', error);
    toast.error('Failed to create book');
  }
}

function editBook(bookId) {
  // Navigate to narrative structure screen
  router.navigate('narrative');
  toast.info('Opening narrative structure view');
}

function viewBook(bookId) {
  // Navigate to narrative structure screen
  router.navigate('narrative');
}

async function deleteBook(bookId, bookTitle) {
  const confirmed = confirm(`Are you sure you want to delete "${bookTitle}"?\n\nThis will also delete all acts, chapters, and scenes in this book.`);

  if (!confirmed) return;

  try {
    await api.request(`/narrative/structure/${bookId}`, {
      method: 'DELETE'
    });

    toast.success('Book deleted successfully');
    await loadBooks();
    await loadStats();
  } catch (error) {
    console.error('Failed to delete book:', error);
    toast.error('Failed to delete book');
  }
}

async function exportProject() {
  try {
    toast.info('Exporting project...');
    const response = await api.request('/export/project');

    // Download as JSON file
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triplethink-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Project exported successfully');
  } catch (error) {
    console.error('Export failed:', error);
    toast.error('Failed to export project');
  }
}

function importProject() {
  toast.info('Import feature coming soon in Phase 11');
}

// Register route
router.register('projects', renderProjects);
