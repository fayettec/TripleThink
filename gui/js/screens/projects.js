/**
 * Landing Screen - Project Selection
 * Card-based interface for selecting or creating projects
 */

async function renderLanding() {
  const container = document.getElementById('screen-container');

  document.getElementById('screen-title').textContent = 'Projects';
  document.getElementById('screen-subtitle').textContent = 'Select a project to begin';

  container.innerHTML = '<div class="loading">Loading projects...</div>';

  try {
    const response = await api.listProjects();
    const projects = response.data || [];

    container.innerHTML = `
      <div class="project-cards-grid">
        ${renderNewProjectCard()}
        ${projects.map(project => renderProjectCard(project)).join('')}
      </div>
    `;

    setupProjectCardListeners();

  } catch (error) {
    console.error('Failed to load projects:', error);
    container.innerHTML = `
      <div class="error-state">
        <p>Failed to load projects</p>
        <button class="btn btn-primary" onclick="renderLanding()">Retry</button>
      </div>
    `;
  }
}

function renderNewProjectCard() {
  return `
    <div class="project-card project-card-new" data-action="new-project">
      <div class="project-card-icon">
        <span style="font-size: 48px;">+</span>
      </div>
      <div class="project-card-title">New Project</div>
      <div class="project-card-description">Create a new TripleThink project</div>
    </div>
  `;
}

function renderProjectCard(project) {
  const lastModified = formatRelativeTime(project.updated_at || project.created_at);

  return `
    <div class="project-card" data-project-id="${project.id}">
      <div class="project-card-header">
        <div class="project-card-icon">📚</div>
        <button class="btn btn-sm btn-secondary"
                onclick="event.stopPropagation(); showEditProjectModal('${project.id}')"
                style="padding: var(--space-1) var(--space-2); font-size: var(--font-size-xs);">
          Edit
        </button>
      </div>
      <div class="project-card-body">
        <h3 class="project-card-title">${escapeHtml(project.name)}</h3>
        ${project.author ? `<div class="project-card-author">by ${escapeHtml(project.author)}</div>` : ''}
        ${project.description ? `<div class="project-card-description">${escapeHtml(project.description)}</div>` : ''}
      </div>
      <div class="project-card-footer">
        <span class="text-gray">Last modified ${lastModified}</span>
      </div>
    </div>
  `;
}

function setupProjectCardListeners() {
  document.querySelector('[data-action="new-project"]')?.addEventListener('click', showNewProjectModal);

  document.querySelectorAll('.project-card[data-project-id]').forEach(card => {
    card.addEventListener('click', () => {
      selectProject(card.dataset.projectId);
    });
  });
}

function selectProject(projectId) {
  state.set('currentProjectId', projectId);
  toast.success('Project loaded');
  router.navigate('dashboard');
}

function showNewProjectModal() {
  const modal = document.getElementById('entity-modal');
  const title = document.getElementById('entity-modal-title');
  const body = document.getElementById('entity-modal-body');

  title.textContent = 'New Project';

  body.innerHTML = `
    <form id="new-project-form">
      <div class="form-group">
        <label class="form-label">Project Name</label>
        <input type="text" class="form-input" name="name" required autofocus>
      </div>

      <div class="form-group">
        <label class="form-label">Author (optional)</label>
        <input type="text" class="form-input" name="author">
      </div>

      <div class="form-group">
        <label class="form-label">Description (optional)</label>
        <textarea class="form-textarea" name="description" rows="3"></textarea>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeEntityModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Project</button>
      </div>
    </form>
  `;

  document.getElementById('new-project-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await createProject(e.target);
  });

  modal.classList.remove('hidden');
}

async function createProject(form) {
  const formData = new FormData(form);
  const data = {
    name: formData.get('name'),
    author: formData.get('author') || null,
    description: formData.get('description') || null,
  };
  // Note: NO ID - backend will auto-generate

  try {
    const response = await api.createProject(data);
    const project = response.data;

    toast.success('Project created');
    closeEntityModal();
    selectProject(project.id);

  } catch (error) {
    console.error('Failed to create project:', error);
    toast.error('Failed to create project');
  }
}

async function showEditProjectModal(projectId) {
  try {
    const response = await api.getProject(projectId);
    const project = response.data;

    const modal = document.getElementById('entity-modal');
    const title = document.getElementById('entity-modal-title');
    const body = document.getElementById('entity-modal-body');

    title.textContent = 'Edit Project';

    body.innerHTML = `
      <form id="edit-project-form">
        <div class="form-group">
          <label class="form-label">Project Name</label>
          <input type="text" class="form-input" name="name" value="${escapeHtml(project.name)}" required autofocus>
        </div>

        <div class="form-group">
          <label class="form-label">Author (optional)</label>
          <input type="text" class="form-input" name="author" value="${escapeHtml(project.author || '')}">
        </div>

        <div class="form-group">
          <label class="form-label">Description (optional)</label>
          <textarea class="form-textarea" name="description" rows="3">${escapeHtml(project.description || '')}</textarea>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-danger" onclick="deleteProject('${projectId}')">Delete Project</button>
          <button type="button" class="btn btn-secondary" onclick="closeEntityModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    document.getElementById('edit-project-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateProject(projectId, e.target);
    });

    modal.classList.remove('hidden');
  } catch (error) {
    console.error('Failed to load project:', error);
    toast.error('Failed to load project');
  }
}

async function updateProject(projectId, form) {
  const formData = new FormData(form);
  const data = {
    name: formData.get('name'),
    author: formData.get('author') || null,
    description: formData.get('description') || null,
  };

  try {
    await api.updateProject(projectId, data);
    toast.success('Project updated');
    closeEntityModal();
    renderLanding();
  } catch (error) {
    console.error('Failed to update project:', error);
    toast.error('Failed to update project');
  }
}

async function deleteProject(projectId) {
  if (!confirm('Delete this project? This cannot be undone!')) return;

  try {
    await api.deleteProject(projectId);
    toast.success('Project deleted');
    closeEntityModal();

    // If deleted current project, clear selection
    if (state.get('currentProjectId') === projectId) {
      state.set('currentProjectId', null);
    }

    renderLanding();
  } catch (error) {
    console.error('Failed to delete project:', error);
    toast.error('Failed to delete project');
  }
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'never';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Register as 'landing' route
router.register('landing', renderLanding);
router.register('projects', renderLanding); // Alias for backward compatibility
