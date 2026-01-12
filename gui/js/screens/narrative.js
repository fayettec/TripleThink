/**
 * Narrative Structure Screen
 * Book/chapter/scene organization with tree view
 */

async function renderNarrative() {
  const container = document.getElementById('screen-container');

  document.getElementById('screen-title').textContent = 'Narrative Structure';
  document.getElementById('screen-subtitle').textContent = 'Organize books, chapters, and scenes';

  const activeRoute = state.get('currentRoute');

  // Create tabbed interface
  container.innerHTML = `
    <div class="tabs-container">
      <div class="tabs">
        <ul class="tab-list">
          <li><button type="button" class="tab-button ${activeRoute === 'narrative' ? 'active' : ''}" data-tab="structure" onclick="switchNarrativeTab('structure')">Structure</button></li>
          <li><button type="button" class="tab-button ${activeRoute === 'fictions' ? 'active' : ''}" data-tab="fictions" onclick="switchNarrativeTab('fictions')">Fictions</button></li>
          <li><button type="button" class="tab-button ${activeRoute === 'validation' ? 'active' : ''}" data-tab="validation" onclick="switchNarrativeTab('validation')">Validation</button></li>
        </ul>
      </div>

      <div class="tab-content ${activeRoute === 'narrative' ? 'active' : ''}" id="tab-structure">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Narrative Structure</h3>
            <div style="display: flex; gap: var(--space-2);">
              <button class="btn btn-sm btn-secondary" onclick="NarrativeTree.expandAll()">
                Expand All
              </button>
              <button class="btn btn-sm btn-secondary" onclick="NarrativeTree.collapseAll()">
                Collapse All
              </button>
              <button class="btn btn-sm btn-primary" onclick="router.navigate('projects')">
                + New Book
              </button>
            </div>
          </div>
          <div id="narrative-tree-container" style="padding: var(--space-4);"></div>
        </div>
      </div>

      <div class="tab-content ${activeRoute === 'fictions' ? 'active' : ''}" id="tab-fictions">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Fictions</h3>
          </div>
          <div id="fictions-container"></div>
        </div>
      </div>

      <div class="tab-content ${activeRoute === 'validation' ? 'active' : ''}" id="tab-validation">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Validation</h3>
          </div>
          <div id="validation-container"></div>
        </div>
      </div>
    </div>
  `;

  // Load appropriate content based on tab
  if (activeRoute === 'narrative') {
    await NarrativeTree.init('narrative-tree-container');
  } else if (activeRoute === 'fictions') {
    await FictionManager.render('fictions-container');
  } else if (activeRoute === 'validation') {
    await ValidationPanel.render('validation-container');
  } else {
    // Default to structure
    await NarrativeTree.init('narrative-tree-container');
  }
}

function switchNarrativeTab(tab) {
  // Hide all tabs
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  // Show selected tab
  document.querySelector(`.tab-button[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');

  // Load content
  if (tab === 'structure') {
    NarrativeTree.init('narrative-tree-container');
  } else if (tab === 'fictions') {
    FictionManager.render('fictions-container');
  } else if (tab === 'validation') {
    ValidationPanel.render('validation-container');
  }
}

// Register routes
router.register('narrative', renderNarrative);
router.register('fictions', renderNarrative);
router.register('validation', renderNarrative);
