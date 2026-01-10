/**
 * Dashboard Screen
 * Project overview with stats
 */

async function renderDashboard() {
  const container = document.getElementById('screen-container');

  document.getElementById('screen-title').textContent = 'Dashboard';
  document.getElementById('screen-subtitle').textContent = 'Project Overview';

  state.set('loading', true);

  try {
    // Fetch project data
    const project = await api.request('/status');
    state.set('project', project);

    container.innerHTML = `
      <div class="grid-3">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Events</h3>
          </div>
          <div style="font-size: 2rem; font-weight: bold; color: var(--color-primary-600);">
            ${project.stats?.events || 0}
          </div>
          <p class="text-gray" style="margin: 0;">World events tracked</p>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Characters</h3>
          </div>
          <div style="font-size: 2rem; font-weight: bold; color: var(--color-success);">
            ${project.stats?.characters || 0}
          </div>
          <p class="text-gray" style="margin: 0;">Characters defined</p>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Fictions</h3>
          </div>
          <div style="font-size: 2rem; font-weight: bold; color: var(--color-warning);">
            ${project.stats?.fictions || 0}
          </div>
          <p class="text-gray" style="margin: 0;">Active narrative systems</p>
        </div>
      </div>

      <div class="card" style="margin-top: var(--space-6);">
        <div class="card-header">
          <h3 class="card-title">Quick Actions</h3>
        </div>
        <div class="flex gap-4">
          <button class="btn btn-primary" onclick="showNewEntityModal('event')">
            + New Event
          </button>
          <button class="btn btn-primary" onclick="showNewEntityModal('character')">
            + New Character
          </button>
          <button class="btn btn-primary" onclick="showNewEntityModal('fiction')">
            + New Fiction
          </button>
          <button class="btn btn-secondary" onclick="router.navigate('timeline')">
            View Timeline
          </button>
        </div>
      </div>

      <div class="card" style="margin-top: var(--space-6);">
        <div class="card-header">
          <h3 class="card-title">Recent Activity</h3>
        </div>
        <div id="recent-activity">
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
        <p class="text-gray">${error.message}</p>
      </div>
    `;
    state.set('loading', false);
  }
}

router.register('dashboard', renderDashboard);
