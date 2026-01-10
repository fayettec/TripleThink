/**
 * Entity Editor Component
 * Dynamic form based on entity type
 */

function showNewEntityModal(type = 'event') {
  state.set('selectedEntity', null);
  showEntityEditor(type, null);
}

async function editEntity(id) {
  try {
    const entity = await api.getEntity(id, { include_metadata: 'auto' });
    state.set('selectedEntity', entity);
    showEntityEditor(entity.entity_type, entity);
  } catch (error) {
    console.error('Failed to load entity:', error);
    toast.error('Failed to load entity');
  }
}

function showEntityEditor(type, entityData) {
  const modal = document.getElementById('entity-modal');
  const title = document.getElementById('entity-modal-title');
  const body = document.getElementById('entity-modal-body');

  title.textContent = entityData ? `Edit ${type}` : `New ${type}`;

  // Render form based on type
  body.innerHTML = renderEntityForm(type, entityData);

  // Show modal
  modal.classList.remove('hidden');

  // Setup form handlers
  setupEntityFormHandlers(type, entityData);
}

function renderEntityForm(type, data) {
  if (type === 'event') {
    return renderEventForm(data);
  } else if (type === 'character') {
    return renderCharacterForm(data);
  } else if (type === 'fiction') {
    return renderFictionForm(data);
  } else {
    return renderGenericForm(type, data);
  }
}

function renderEventForm(data) {
  return `
    <form id="entity-form">
      <div class="tabs">
        <ul class="tab-list">
          <li><button type="button" class="tab-button active" data-tab="basic">Basic Info</button></li>
          <li><button type="button" class="tab-button" data-tab="phases">Phases</button></li>
          <li><button type="button" class="tab-button" data-tab="facts">Facts</button></li>
          <li><button type="button" class="tab-button" data-tab="participants">Participants</button></li>
        </ul>
      </div>

      <div class="tab-content active" id="tab-basic">
        <div class="form-group">
          <label class="form-label">Event ID</label>
          <input type="text" class="form-input" name="id" value="${data?.id || 'evt-'}" required>
          <div class="form-help">Must start with 'evt-'</div>
        </div>

        <div class="form-group">
          <label class="form-label">Timestamp</label>
          <input type="datetime-local" class="form-input" name="timestamp" value="${data?.timestamp || ''}" required>
        </div>

        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-select" name="type">
            <option>information_transfer</option>
            <option>deception_event</option>
            <option>complex_multi_phase</option>
            <option>state_change</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Summary</label>
          <textarea class="form-textarea" name="summary" rows="3">${data?.summary || ''}</textarea>
        </div>
      </div>

      <div class="tab-content" id="tab-phases">
        <div id="phases-container">
          <button type="button" class="btn btn-secondary" id="add-phase-btn">+ Add Phase</button>
        </div>
      </div>

      <div class="tab-content" id="tab-facts">
        <div id="facts-container">
          <button type="button" class="btn btn-secondary" id="add-fact-btn">+ Add Fact</button>
        </div>
      </div>

      <div class="tab-content" id="tab-participants">
        <div id="participants-container">
          <button type="button" class="btn btn-secondary" id="add-participant-btn">+ Add Participant</button>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeEntityModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Event</button>
      </div>
    </form>
  `;
}

function renderCharacterForm(data) {
  return `
    <form id="entity-form">
      <div class="form-group">
        <label class="form-label">Character ID</label>
        <input type="text" class="form-input" name="id" value="${data?.id || 'char-'}" required>
      </div>

      <div class="form-group">
        <label class="form-label">Name</label>
        <input type="text" class="form-input" name="name" value="${data?.name || ''}" required>
      </div>

      <div class="form-group">
        <label class="form-label">Role</label>
        <select class="form-select" name="role">
          <option>protagonist</option>
          <option>antagonist</option>
          <option>supporting</option>
        </select>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeEntityModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Character</button>
      </div>
    </form>
  `;
}

function renderFictionForm(data) {
  return `
    <form id="entity-form">
      <div class="form-group">
        <label class="form-label">Fiction ID</label>
        <input type="text" class="form-input" name="id" value="${data?.id || 'fiction-'}" required>
      </div>

      <div class="form-group">
        <label class="form-label">Name</label>
        <input type="text" class="form-input" name="name" value="${data?.name || ''}" required>
      </div>

      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" name="description" rows="3">${data?.description || ''}</textarea>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeEntityModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Fiction</button>
      </div>
    </form>
  `;
}

function renderGenericForm(type, data) {
  return `
    <form id="entity-form">
      <div class="form-group">
        <label class="form-label">ID</label>
        <input type="text" class="form-input" name="id" value="${data?.id || ''}" required>
      </div>

      <div class="form-group">
        <label class="form-label">Name</label>
        <input type="text" class="form-input" name="name" value="${data?.name || ''}" required>
      </div>

      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" name="description" rows="3">${data?.description || ''}</textarea>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeEntityModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Entity</button>
      </div>
    </form>
  `;
}

function setupEntityFormHandlers(type, data) {
  // Tab switching
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  // Form submission
  document.getElementById('entity-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveEntity(type, e.target);
  });
}

async function saveEntity(type, form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  try {
    if (state.get('selectedEntity')) {
      await api.updateEntity(data.id, data);
      toast.success('Entity updated');
    } else {
      await api.createEntity(type, data);
      toast.success('Entity created');
    }

    closeEntityModal();
    if (window.loadEntities) {
      loadEntities();
    }
  } catch (error) {
    console.error('Save failed:', error);
    toast.error('Failed to save entity');
  }
}

function closeEntityModal() {
  document.getElementById('entity-modal').classList.add('hidden');
}

// Modal close handlers
if (document.getElementById('entity-modal-close')) {
  document.getElementById('entity-modal-close').addEventListener('click', closeEntityModal);
}
