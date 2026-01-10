/**
 * Fiction Manager Component
 * Manage false narrative systems
 */

const FictionManager = {
  /**
   * Render fiction list with management UI
   */
  async render(containerId) {
    const container = document.getElementById(containerId);

    try {
      const fictions = await api.listEntities({ type: 'fiction' });

      if (fictions.length === 0) {
        container.innerHTML = `
          <div class="card">
            <p class="text-gray">No fictions defined yet</p>
            <button class="btn btn-primary" onclick="showNewEntityModal('fiction')">
              + Create Fiction
            </button>
          </div>
        `;
        return;
      }

      const html = `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Active Fictions</h3>
            <button class="btn btn-primary" onclick="showNewEntityModal('fiction')">
              + New Fiction
            </button>
          </div>

          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Target Audience</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${fictions.map(fiction => `
                  <tr>
                    <td><code>${fiction.id}</code></td>
                    <td>${fiction.name}</td>
                    <td>
                      <span class="badge badge-primary">
                        ${fiction.target_audience || 'Not specified'}
                      </span>
                    </td>
                    <td>
                      <span class="badge badge-success">Active</span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-secondary" onclick="editEntity('${fiction.id}')">
                        Edit
                      </button>
                      <button class="btn btn-sm btn-danger" onclick="deleteEntity('${fiction.id}')">
                        Delete
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Failed to load fictions:', error);
      container.innerHTML = '<p class="text-danger">Failed to load fictions</p>';
    }
  },
};
