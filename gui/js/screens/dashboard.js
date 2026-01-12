/**
 * Dashboard Screen
 * Project overview with stats
 */

async function renderDashboard() {
  const container = document.getElementById('screen-container');
  const currentProjectId = state.get('currentProjectId');

  // Redirect to landing if no project selected
  if (!currentProjectId) {
    toast.info('Please select a project first');
    router.navigate('landing');
    return;
  }

  document.getElementById('screen-title').textContent = 'Dashboard';
  state.set('loading', true);

  try {
    // Fetch current project details
    const projectResponse = await api.getProject(currentProjectId);
    const project = projectResponse.data;

    // Fetch stats
    const statsResponse = await api.request('/status');
    const stats = statsResponse.stats || {};

    state.set('project', project);
    document.getElementById('screen-subtitle').textContent = project.name;

    container.innerHTML = `
      <!-- Current Project Info -->
      <div class="card" style="margin-bottom: var(--space-6); background: linear-gradient(135deg, var(--color-primary-50) 0%, white 100%);">
        <div style="padding: var(--space-4);">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <h2 style="margin: 0 0 var(--space-2) 0; font-size: var(--font-size-xl);">${project.name}</h2>
              ${project.author ? `<div class="text-gray" style="margin-bottom: var(--space-2);">by ${project.author}</div>` : ''}
              ${project.description ? `<div class="text-gray">${project.description}</div>` : ''}
            </div>
            <button class="btn btn-secondary btn-sm" onclick="router.navigate('landing')">
              Change Project
            </button>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid-3">
        <div class="card">
          <div class="card-header"><h3 class="card-title">Events</h3></div>
          <div style="font-size: 2rem; font-weight: bold; color: var(--color-primary-600);">
            ${stats.events || 0}
          </div>
          <p class="text-gray" style="margin: 0;">World events tracked</p>
        </div>

        <div class="card">
          <div class="card-header"><h3 class="card-title">Characters</h3></div>
          <div style="font-size: 2rem; font-weight: bold; color: var(--color-success);">
            ${stats.characters || 0}
          </div>
          <p class="text-gray" style="margin: 0;">Characters defined</p>
        </div>

        <div class="card">
          <div class="card-header"><h3 class="card-title">Fictions</h3></div>
          <div style="font-size: 2rem; font-weight: bold; color: var(--color-warning);">
            ${stats.fictions || 0}
          </div>
          <p class="text-gray" style="margin: 0;">Active fictions</p>
        </div>
      </div>

      <!-- Quick Actions (NO "New Project" button) -->
      <div class="card" style="margin-top: var(--space-6);">
        <div class="card-header"><h3 class="card-title">Quick Actions</h3></div>
        <div class="flex gap-4" style="padding: var(--space-4);">
          <button class="btn btn-primary" onclick="showNewEntityModal('event')">+ New Event</button>
          <button class="btn btn-primary" onclick="showNewEntityModal('character')">+ New Character</button>
          <button class="btn btn-primary" onclick="showNewEntityModal('fiction')">+ New Fiction</button>
          <button class="btn btn-secondary" onclick="router.navigate('timeline')">View Timeline</button>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card" style="margin-top: var(--space-6);">
        <div class="card-header"><h3 class="card-title">Recent Activity</h3></div>
        <div id="recent-activity" style="padding: var(--space-4);">
          <p class="text-gray">No recent changes yet. Start by creating an event or character.</p>
        </div>
      </div>
    `;

    state.set('loading', false);
  } catch (error) {
    console.error('Dashboard error:', error);
    container.innerHTML = `
      <div class="card">
        <p class="text-danger">Failed to load dashboard</p>
        <button class="btn btn-primary" onclick="router.navigate('landing')">Return to Projects</button>
      </div>
    `;
    state.set('loading', false);
  }
}

router.register('dashboard', renderDashboard);
