/**
 * Timeline View Component
 * Simple timeline view (placeholder for D3.js visualization)
 */

const TimelineView = {
  /**
   * Render a simple timeline
   */
  async render(containerId, startDate, endDate) {
    const container = document.getElementById(containerId);

    try {
      const events = await api.getEventsInRange(startDate, endDate);

      if (events.length === 0) {
        container.innerHTML = '<p class="text-gray">No events in this time range</p>';
        return;
      }

      // Sort by timestamp
      events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      const html = `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Timeline Events</h3>
          </div>
          <div style="padding: var(--space-4);">
            ${events.map(event => `
              <div style="margin-bottom: var(--space-4); padding: var(--space-3); border-left: 3px solid var(--color-primary-600); padding-left: var(--space-4);">
                <div class="font-semibold">${event.name || event.id}</div>
                <div class="text-gray font-medium">${formatters.timestamp(event.timestamp)}</div>
                <div style="margin-top: var(--space-2);">${event.summary || '-'}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Failed to load timeline:', error);
      container.innerHTML = '<p class="text-danger">Failed to load timeline</p>';
    }
  },
};
