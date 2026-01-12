/**
 * Assets List Screen (Events, Locations, Objects - NOT Characters/Fictions)
 * Searchable, filterable table with button-based filters
 */

async function renderEntities() {
  const container = document.getElementById('screen-container');

  document.getElementById('screen-title').textContent = 'Assets';
  document.getElementById('screen-subtitle').textContent = 'Events, Locations, and Objects';

  container.innerHTML = `
    <div class="card">
      <div class="card-header" style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="form-group" style="margin: 0; flex: 1; max-width: 400px;">
            <input
              type="text"
              class="form-input"
              id="entity-search"
              placeholder="Search assets..."
            />
          </div>
          <button class="btn btn-primary" onclick="showNewEntityModal()">
            + New Asset
          </button>
        </div>

        <!-- Filter Buttons -->
        <div class="filter-buttons" style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
          <button class="filter-btn active" data-filter="">All</button>
          <button class="filter-btn" data-filter="event">Events</button>
          <button class="filter-btn" data-filter="location">Locations</button>
          <button class="filter-btn" data-filter="object">Objects</button>
        </div>
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="entity-table-body">
            <tr>
              <td colspan="4" style="text-align: center;">Loading...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Load entities (exclude characters and fictions)
  loadEntities();

  // Setup search filter
  document.getElementById('entity-search').addEventListener('input', filterEntities);

  // Setup filter button clicks
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all buttons
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      // Add active to clicked button
      btn.classList.add('active');
      // Filter entities
      filterEntities();
    });
  });
}

async function loadEntities(filters = {}) {
  try {
    const response = await api.listEntities(filters);
    const entities = response.data || [];
    state.set('entities', entities);
    renderEntityTable(entities);
  } catch (error) {
    console.error('Failed to load entities:', error);
    toast.error('Failed to load entities');
    const tbody = document.getElementById('entity-table-body');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-danger">Failed to load entities</td></tr>';
    }
  }
}

function renderEntityTable(entities) {
  const tbody = document.getElementById('entity-table-body');

  if (entities.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: var(--space-8);">
          No entities found
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = entities.map(entity => `
    <tr onclick="editEntity('${entity.id}')">
      <td>${entity.name || '-'}</td>
      <td>
        <span class="badge badge-primary">${entity.entity_type}</span>
      </td>
      <td>${entity.timestamp ? formatters.timestamp(entity.timestamp) : '-'}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); editEntity('${entity.id}')">
          Edit
        </button>
        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteEntity('${entity.id}')">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

function filterEntities() {
  const search = document.getElementById('entity-search')?.value.toLowerCase() || '';
  const activeBtn = document.querySelector('.filter-btn.active');
  const type = activeBtn?.dataset.filter || '';

  const filtered = state.get('entities').filter(entity => {
    // EXCLUDE characters and fictions from Assets page
    if (entity.entity_type === 'character' || entity.entity_type === 'fiction') {
      return false;
    }

    const matchesSearch = entity.name?.toLowerCase().includes(search) ||
                         entity.id.toLowerCase().includes(search);
    const matchesType = !type || entity.entity_type === type;
    return matchesSearch && matchesType;
  });

  renderEntityTable(filtered);
}

async function deleteEntity(id) {
  if (!confirm(`Delete entity ${id}?`)) return;

  try {
    await api.deleteEntity(id);
    toast.success('Entity deleted');
    loadEntities();
  } catch (error) {
    console.error('Delete failed:', error);
    toast.error('Failed to delete entity');
  }
}

router.register('entities', renderEntities);

// Characters page - shows ONLY characters
router.register('characters', async () => {
  const container = document.getElementById('screen-container');
  document.getElementById('screen-title').textContent = 'Characters';
  document.getElementById('screen-subtitle').textContent = 'Manage your characters';

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="form-group" style="margin: 0; flex: 1; max-width: 400px;">
          <input type="text" class="form-input" id="entity-search" placeholder="Search characters..."/>
        </div>
        <button class="btn btn-primary" onclick="showNewEntityModal('character')">+ New Character</button>
      </div>
      <div class="table-container">
        <table class="table">
          <thead>
            <tr><th>Name</th><th>Type</th><th>Actions</th></tr>
          </thead>
          <tbody id="entity-table-body">
            <tr><td colspan="3" style="text-align: center;">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Load ONLY characters
  const response = await api.listEntities({ type: 'character' });
  const characters = response.data || [];
  state.set('entities', characters);

  const tbody = document.getElementById('entity-table-body');
  if (characters.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: var(--space-8);">No characters found</td></tr>';
  } else {
    tbody.innerHTML = characters.map(entity => `
      <tr onclick="editEntity('${entity.id}')">
        <td>${entity.name}</td>
        <td><span class="badge badge-primary">${entity.entity_type}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); editEntity('${entity.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteEntity('${entity.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  // Search filter
  document.getElementById('entity-search').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const filtered = characters.filter(c => c.name?.toLowerCase().includes(search) || c.id.toLowerCase().includes(search));
    tbody.innerHTML = filtered.map(entity => `
      <tr onclick="editEntity('${entity.id}')">
        <td>${entity.name}</td>
        <td><span class="badge badge-primary">${entity.entity_type}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); editEntity('${entity.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteEntity('${entity.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  });
});

// Fictions page - shows ONLY fictions
router.register('fictions', async () => {
  const container = document.getElementById('screen-container');
  document.getElementById('screen-title').textContent = 'Fictions';
  document.getElementById('screen-subtitle').textContent = 'Manage narrative fictions';

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="form-group" style="margin: 0; flex: 1; max-width: 400px;">
          <input type="text" class="form-input" id="entity-search" placeholder="Search fictions..."/>
        </div>
        <button class="btn btn-primary" onclick="showNewEntityModal('fiction')">+ New Fiction</button>
      </div>
      <div class="table-container">
        <table class="table">
          <thead>
            <tr><th>Name</th><th>Type</th><th>Actions</th></tr>
          </thead>
          <tbody id="entity-table-body">
            <tr><td colspan="3" style="text-align: center;">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Load ONLY fictions
  const response = await api.listFictions();
  const fictions = response.data || [];

  const tbody = document.getElementById('entity-table-body');
  if (fictions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: var(--space-8);">No fictions found</td></tr>';
  } else {
    tbody.innerHTML = fictions.map(entity => `
      <tr onclick="editEntity('${entity.id}')">
        <td>${entity.name}</td>
        <td><span class="badge badge-primary">${entity.entity_type}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); editEntity('${entity.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteEntity('${entity.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }
});
