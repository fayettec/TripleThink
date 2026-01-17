/**
 * Characters Screen
 * Character management and arc tracking with knowledge modal
 */

const CharactersScreen = {
  characters: [],
  arcs: [],

  async render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen characters-screen">
        <header class="screen-header">
          <h1>Characters</h1>
          <button class="btn btn-icon" onclick="PowerDrawer.toggle()" title="Open Power Drawer">
            <span>🔍</span>
          </button>
        </header>
        <div class="screen-content">
          <div id="characters-content"></div>
        </div>
      </div>
    `;

    await this.loadCharacters();
  },

  async loadCharacters() {
    const container = document.getElementById('characters-content');
    const projectId = state.get('currentProjectId');

    if (!projectId) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <div class="empty-message">No project selected</div>
          <div class="empty-hint">Select a project to view characters</div>
        </div>
      `;
      return;
    }

    try {
      container.innerHTML = '<div class="loading">Loading characters...</div>';

      // Fetch character arcs for the project
      this.arcs = await api.getCharacterArcsByProject(projectId);

      if (!this.arcs || this.arcs.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🎭</div>
            <div class="empty-message">No characters yet</div>
            <div class="empty-hint">Create characters to track their arcs and knowledge</div>
          </div>
        `;
        return;
      }

      await this.renderCharacterCards();

    } catch (error) {
      console.error('Error loading characters:', error);
      container.innerHTML = `
        <div class="error">
          <div class="empty-icon">⚠️</div>
          <div class="empty-message">Error loading characters</div>
          <div class="empty-hint">${error.message}</div>
        </div>
      `;
    }
  },

  async renderCharacterCards() {
    const container = document.getElementById('characters-content');

    let html = '<div class="card-grid">';

    for (const arc of this.arcs) {
      html += this.renderCharacterCard(arc);
    }

    html += '</div>';
    container.innerHTML = html;

    // Set up event handlers for "What They Know" buttons
    this.setupKnowledgeButtonHandlers();
  },

  renderCharacterCard(arc) {
    // Render the arc card
    const arcCardHtml = ArcCard.render(arc);

    // Wrap it in a container with the "What They Know" button
    return `
      <div class="character-card-wrapper">
        ${arcCardHtml}
        <button class="btn btn-knowledge" data-character-id="${arc.character_id}">
          🧠 What They Know
        </button>
      </div>
    `;
  },

  setupKnowledgeButtonHandlers() {
    document.querySelectorAll('.btn-knowledge').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const characterId = e.target.dataset.characterId;
        this.showKnowledgeModal(characterId);
      });
    });
  },

  async showKnowledgeModal(characterId) {
    // Get current timestamp from state or use "now" (largest timestamp)
    const currentTimestamp = state.get('currentTimestamp') || Date.now();

    try {
      // Fetch character's knowledge at current timestamp
      const knowledge = await api.getEntityKnowledge(characterId, currentTimestamp);
      const falseBeliefs = await api.getFalseBeliefs(characterId, currentTimestamp);

      const facts = knowledge.facts || [];
      const beliefs = falseBeliefs.falseBeliefs || [];

      // Create modal
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content knowledge-modal">
          <div class="modal-header">
            <h2>${characterId}'s Knowledge</h2>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
          </div>
          <div class="modal-body">
            <div class="timestamp-info">
              <strong>At timestamp:</strong> ${currentTimestamp}
            </div>

            ${facts.length > 0 ? `
              <div class="knowledge-section">
                <h3>Known Facts (${facts.length})</h3>
                <ul class="knowledge-list">
                  ${facts.map(fact => `
                    <li class="knowledge-item">
                      <span class="fact-type">${fact.fact_type}</span>:
                      <span class="fact-key">${fact.fact_key}</span> =
                      <span class="fact-value">${fact.fact_value}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : '<p class="empty-hint">No facts known yet</p>'}

            ${beliefs.length > 0 ? `
              <div class="knowledge-section false-beliefs">
                <h3>False Beliefs (${beliefs.length})</h3>
                <p class="section-hint">These beliefs are incorrect (dramatic irony)</p>
                <ul class="knowledge-list">
                  ${beliefs.map(belief => `
                    <li class="knowledge-item false-belief">
                      <span class="fact-type">${belief.fact_type}</span>:
                      <span class="fact-key">${belief.fact_key}</span> =
                      <span class="fact-value false">${belief.believed_value}</span>
                      <span class="truth-indicator">(actually: ${belief.true_value})</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
            <button class="btn btn-primary" onclick="CharactersScreen.navigateToEpistemic('${characterId}')">
              View in Epistemic Graph
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Close on background click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });

    } catch (error) {
      console.error('Error loading knowledge:', error);
      alert(`Error loading knowledge: ${error.message}`);
    }
  },

  navigateToEpistemic(characterId) {
    // Close modal
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();

    // Navigate to epistemic screen with character pre-selected
    state.update({ selectedCharacter: characterId });
    window.location.hash = '#epistemic';
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CharactersScreen };
}
