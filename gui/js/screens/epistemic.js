/**
 * Epistemic Graph Screen
 * Visualize character knowledge states and beliefs
 */

let selectedCharacter = null;
let selectedTimestamp = new Date().toISOString();

async function renderEpistemic() {
  const container = document.getElementById('screen-container');

  document.getElementById('screen-title').textContent = 'Epistemic Graph';
  document.getElementById('screen-subtitle').textContent = 'Character knowledge and beliefs';

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Knowledge State Visualization</h3>
      </div>

      <div style="padding: var(--space-4); border-bottom: 1px solid var(--color-gray-200);">
        <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: var(--space-3); align-items: end;">
          <div class="form-group" style="margin: 0;">
            <label class="form-label">Character</label>
            <select class="form-select" id="epistemic-character">
              <option value="">All Characters</option>
            </select>
          </div>

          <div class="form-group" style="margin: 0;">
            <label class="form-label">At Timestamp</label>
            <input type="datetime-local" class="form-input" id="epistemic-timestamp" />
          </div>

          <button class="btn btn-primary" onclick="loadEpistemicGraph()">
            Update Graph
          </button>
        </div>

        <div style="margin-top: var(--space-3);">
          <label class="form-label">
            <input type="checkbox" id="epistemic-all-chars" onchange="toggleAllCharacters(this.checked)">
            Show all characters (simplified view)
          </label>
        </div>
      </div>

      <div style="padding: var(--space-4);">
        <div id="epistemic-graph-container" style="height: 500px; border: 1px solid var(--color-gray-200); border-radius: var(--radius-md);"></div>
      </div>

      <div id="knowledge-details" style="padding: var(--space-4); border-top: 1px solid var(--color-gray-200);">
        <h4 style="margin-bottom: var(--space-3);">Knowledge Details</h4>
        <div id="knowledge-details-content" class="text-gray">
          Select a character and timestamp to view their knowledge state
        </div>
      </div>
    </div>
  `;

  // Load characters
  await loadEpistemicCharacters();

  // Set current timestamp
  const now = new Date();
  document.getElementById('epistemic-timestamp').value = now.toISOString().slice(0, 16);

  // Load initial graph
  loadEpistemicGraph();
}

async function loadEpistemicCharacters() {
  try {
    const response = await api.request('/entities?type=character');
    const characters = response.data || [];

    const select = document.getElementById('epistemic-character');
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

async function loadEpistemicGraph() {
  const charId = document.getElementById('epistemic-character').value;
  const timestamp = document.getElementById('epistemic-timestamp').value;
  const showAll = document.getElementById('epistemic-all-chars').checked;

  selectedCharacter = showAll ? null : (charId || null);
  selectedTimestamp = timestamp || new Date().toISOString();

  await EpistemicGraph.render('epistemic-graph-container', selectedCharacter, selectedTimestamp);

  // Load knowledge details if character selected
  if (selectedCharacter) {
    await loadKnowledgeDetails(selectedCharacter, selectedTimestamp);
  } else {
    document.getElementById('knowledge-details-content').innerHTML = `
      <div class="text-gray">Select a specific character to view detailed knowledge state</div>
    `;
  }
}

async function loadKnowledgeDetails(characterId, timestamp) {
  const container = document.getElementById('knowledge-details-content');

  try {
    const response = await api.request(
      `/epistemic/character/${characterId}/knowledge?at_timestamp=${timestamp}`
    );
    const data = response.data;

    if (!data || !data.knowledge_state || !data.knowledge_state.facts) {
      container.innerHTML = `
        <div class="text-gray">No knowledge state data available for this character at this time</div>
      `;
      return;
    }

    const facts = data.knowledge_state.facts || [];

    container.innerHTML = `
      <div style="margin-bottom: var(--space-3);">
        <strong>Character:</strong> ${data.character_name || characterId}
      </div>
      <div style="margin-bottom: var(--space-3);">
        <strong>Timestamp:</strong> ${formatters.formatDate(timestamp)}
      </div>
      <div style="margin-bottom: var(--space-2);">
        <strong>Knowledge State (${facts.length} facts):</strong>
      </div>
      <div style="display: flex; flex-direction: column; gap: var(--space-2);">
        ${facts.map(fact => {
          const isTrue = fact.belief === 'true';
          return `
            <div style="padding: var(--space-3); background: ${isTrue ? '#F0FDF4' : '#FEF2F2'}; border-left: 3px solid ${isTrue ? '#10B981' : '#EF4444'}; border-radius: var(--radius-md);">
              <div style="display: flex; align-items: start; gap: var(--space-2);">
                <span style="font-size: var(--font-size-lg);">${isTrue ? '✓' : '✗'}</span>
                <div style="flex: 1;">
                  <div style="font-weight: var(--font-weight-medium); margin-bottom: var(--space-1);">
                    ${fact.content || fact.fact_id || 'Unknown fact'}
                  </div>
                  ${!isTrue && fact.believed_alternative ? `
                    <div style="color: var(--color-red-600); font-size: var(--font-size-sm); margin-bottom: var(--space-1);">
                      Believes: "${fact.believed_alternative}"
                    </div>
                  ` : ''}
                  <div style="font-size: var(--font-size-sm); color: var(--color-gray-600);">
                    <span>Confidence: ${fact.confidence || 'unknown'}</span>
                    ${fact.source ? ` | Source: ${fact.source}` : ''}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Failed to load knowledge details:', error);
    container.innerHTML = `
      <div style="color: var(--color-red-600);">Failed to load knowledge details</div>
    `;
  }
}

function toggleAllCharacters(checked) {
  if (checked) {
    document.getElementById('epistemic-character').value = '';
    document.getElementById('epistemic-character').disabled = true;
  } else {
    document.getElementById('epistemic-character').disabled = false;
  }
  loadEpistemicGraph();
}

router.register('epistemic', renderEpistemic);
