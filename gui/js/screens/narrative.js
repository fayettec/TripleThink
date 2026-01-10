/**
 * Narrative Structure Screen
 * Book/chapter/scene organization
 */

async function renderNarrative() {
  const container = document.getElementById('screen-container');

  document.getElementById('screen-title').textContent = 'Narrative Structure';
  document.getElementById('screen-subtitle').textContent = 'Organize books, chapters, and scenes';

  const activeRoute = state.get('currentRoute');

  if (activeRoute === 'narrative') {
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Narrative Structure</h3>
        </div>

        <div style="padding: var(--space-4);">
          <div class="form-group">
            <label class="form-label">Books</label>
            <div id="books-list"></div>
            <button class="btn btn-primary" onclick="addBook()">
              + Add Book
            </button>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: var(--space-6);">
        <div class="card-header">
          <h3 class="card-title">Fictions</h3>
        </div>
        <div id="fictions-container"></div>
      </div>

      <div class="card" style="margin-top: var(--space-6);">
        <div class="card-header">
          <h3 class="card-title">Validation</h3>
        </div>
        <div id="validation-container"></div>
      </div>
    `;

    // Load content
    await FictionManager.render('fictions-container');
    await ValidationPanel.render('validation-container');
  } else {
    // For other routes, show fictions by default
    container.innerHTML = '<div id="fictions-container"></div>';
    await FictionManager.render('fictions-container');
  }
}

function addBook() {
  const name = prompt('Enter book name:');
  if (!name) return;

  toast.info('Book feature coming soon');
}

router.register('narrative', renderNarrative);
router.register('validation', renderNarrative);
