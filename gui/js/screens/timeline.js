/**
 * Timeline Screen
 * Visual timeline of events
 */

async function renderTimeline() {
  const container = document.getElementById('screen-container');

  document.getElementById('screen-title').textContent = 'Timeline';
  document.getElementById('screen-subtitle').textContent = 'Chronological view of events';

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Event Timeline</h3>
      </div>

      <div style="padding: var(--space-4);">
        <div class="form-group">
          <label class="form-label">From Date</label>
          <input type="date" class="form-input" id="timeline-start" />
        </div>

        <div class="form-group">
          <label class="form-label">To Date</label>
          <input type="date" class="form-input" id="timeline-end" />
        </div>

        <button class="btn btn-primary" onclick="loadTimeline()">
          Load Events
        </button>
      </div>

      <div id="timeline-container" style="padding: var(--space-4);">
        <!-- Timeline will be loaded here -->
      </div>
    </div>
  `;

  // Set default date range
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);

  document.getElementById('timeline-start').valueAsDate = startDate;
  document.getElementById('timeline-end').valueAsDate = endDate;

  // Load initial timeline
  loadTimeline();
}

async function loadTimeline() {
  const startDate = document.getElementById('timeline-start').value;
  const endDate = document.getElementById('timeline-end').value;

  if (!startDate || !endDate) {
    toast.warning('Please select both start and end dates');
    return;
  }

  await TimelineView.render('timeline-container', startDate, endDate);
}

router.register('timeline', renderTimeline);
