/**
 * Timeline Screen
 * Visual timeline of events with D3.js visualization
 */

let currentViewMode = 'visualization'; // or 'list'

async function renderTimeline() {
  const container = document.getElementById('screen-container');

  document.getElementById('screen-title').textContent = 'Timeline';
  document.getElementById('screen-subtitle').textContent = 'Chronological view of events';

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Event Timeline</h3>
      </div>

      <div style="padding: var(--space-4); border-bottom: 1px solid var(--color-gray-200);">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-3);">
          <div class="form-group" style="margin: 0;">
            <label class="form-label">From Date</label>
            <input type="date" class="form-input" id="timeline-start" />
          </div>

          <div class="form-group" style="margin: 0;">
            <label class="form-label">To Date</label>
            <input type="date" class="form-input" id="timeline-end" />
          </div>

          <div class="form-group" style="margin: 0;">
            <label class="form-label">Event Type</label>
            <select class="form-select" id="timeline-type">
              <option value="">All Types</option>
              <option value="information_transfer">Information Transfer</option>
              <option value="deception_event">Deception Event</option>
              <option value="complex_multi_phase">Multi-Phase</option>
              <option value="state_change">State Change</option>
            </select>
          </div>

          <div class="form-group" style="margin: 0;">
            <label class="form-label">Participant</label>
            <select class="form-select" id="timeline-participant">
              <option value="">All Participants</option>
            </select>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn-primary" onclick="loadTimeline()">
              Apply Filters
            </button>
            <button class="btn btn-secondary" onclick="resetTimelineFilters()">
              Reset
            </button>
          </div>

          <div style="display: flex; gap: var(--space-2); align-items: center;">
            <span class="text-gray" style="font-size: var(--font-size-sm);">View:</span>
            <button
              class="btn btn-sm ${currentViewMode === 'visualization' ? 'btn-primary' : 'btn-secondary'}"
              onclick="switchTimelineView('visualization')"
            >
              Visualization
            </button>
            <button
              class="btn btn-sm ${currentViewMode === 'list' ? 'btn-primary' : 'btn-secondary'}"
              onclick="switchTimelineView('list')"
            >
              List
            </button>
          </div>
        </div>
      </div>

      <div id="timeline-container" style="padding: var(--space-4); min-height: 500px;">
        <!-- Timeline will be loaded here -->
      </div>
    </div>
  `;

  // Load characters for participant filter
  await loadTimelineCharacters();

  // Set default date range (past year)
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);

  document.getElementById('timeline-start').valueAsDate = startDate;
  document.getElementById('timeline-end').valueAsDate = endDate;

  // Load initial timeline
  loadTimeline();
}

async function loadTimelineCharacters() {
  try {
    const response = await api.request('/entities?type=character');
    const characters = response.data || [];

    const select = document.getElementById('timeline-participant');
    characters.forEach(char => {
      const option = document.createElement('option');
      option.value = char.id;
      option.textContent = char.name || char.id;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load characters:', error);
  }
}

async function loadTimeline() {
  const startDate = document.getElementById('timeline-start').value;
  const endDate = document.getElementById('timeline-end').value;

  if (!startDate || !endDate) {
    toast.warning('Please select both start and end dates');
    return;
  }

  const filters = {
    type: document.getElementById('timeline-type').value,
    participant: document.getElementById('timeline-participant').value
  };

  if (currentViewMode === 'visualization') {
    await TimelineViz.render('timeline-container', startDate, endDate, filters);
  } else {
    await TimelineView.render('timeline-container', startDate, endDate);
  }
}

function switchTimelineView(mode) {
  currentViewMode = mode;
  renderTimeline();
}

function resetTimelineFilters() {
  document.getElementById('timeline-type').value = '';
  document.getElementById('timeline-participant').value = '';

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);

  document.getElementById('timeline-start').valueAsDate = startDate;
  document.getElementById('timeline-end').valueAsDate = endDate;

  loadTimeline();
}

router.register('timeline', renderTimeline);
