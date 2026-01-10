/**
 * Entity List Screen
 * Searchable, filterable table of all entities
 */

async function renderEntities() {
  const container = document.getElementById('screen-container');

  document.getElementById('screen-title').textContent = 'Entities';
  document.getElementById('screen-subtitle').textContent = 'All Events, Characters, Objects';

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="form-group" style="margin: 0; flex: 1;">
          <input
            type="text"
            class="form-input"
            id="entity-search"
            placeholder="Search entities..."
          />
        </div>
        <div class="flex gap-2">
          <select class="form-select" id="entity-type-filter">
            <option value="">All Types</option>
            <option value="event">Events</option>
            <option value="character">Characters</option>
            <option value="object">Objects</option>
            <option value="location">Locations</option>
            <option value="fiction">Fictions</option>
            <option value="system">Systems</option>
          </select>
          <button class="btn btn-primary" onclick="showNewEntityModal()">
            + New
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="entity-table-body">
            <tr>
              <td colspan="5" style="text-align: center;">Loading...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Load entities
  loadEntities();

  // Setup filters
  document.getElementById('entity-search').addEventListener('input', filterEntities);
  document.getElementById('entity-type-filter').addEventListener('change', filterEntities);
}

async function loadEntities(filters = {}) {
  try {
    const entities = await api.listEntities(filters);
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
        <td colspan="5" style="text-align: center; padding: var(--space-8);">
          No entities found
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = entities.map(entity => `
    <tr onclick="editEntity('${entity.id}')">
      <td><code>${entity.id}</code></td>
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
  const search = document.getElementById('entity-search').value.toLowerCase();
  const type = document.getElementById('entity-type-filter').value;

  const filtered = state.get('entities').filter(entity => {
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
router.register('characters', () => renderEntities());
router.register('fictions', () => renderEntities());
