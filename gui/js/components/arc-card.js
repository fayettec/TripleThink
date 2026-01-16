/**
 * Arc Card Component
 * Displays character arc with progress visualization
 */

const ArcCard = {
  // Phase order for Save the Cat 13-beat structure
  PHASES: [
    'setup',
    'catalyst',
    'debate',
    'break_into_two',
    'b_story',
    'fun_and_games',
    'midpoint',
    'bad_guys_close_in',
    'all_is_lost',
    'dark_night_of_soul',
    'break_into_three',
    'finale',
    'final_image'
  ],

  // Human-readable phase names
  PHASE_LABELS: {
    'setup': 'Setup',
    'catalyst': 'Catalyst',
    'debate': 'Debate',
    'break_into_two': 'Break Into Two',
    'b_story': 'B Story',
    'fun_and_games': 'Fun and Games',
    'midpoint': 'Midpoint',
    'bad_guys_close_in': 'Bad Guys Close In',
    'all_is_lost': 'All Is Lost',
    'dark_night_of_soul': 'Dark Night of Soul',
    'break_into_three': 'Break Into Three',
    'finale': 'Finale',
    'final_image': 'Final Image'
  },

  /**
   * Calculate progress percentage based on current phase
   * @param {string} currentPhase - Current phase name
   * @returns {number} Progress percentage (0-100)
   */
  calculateProgress(currentPhase) {
    const index = this.PHASES.indexOf(currentPhase);
    if (index === -1) return 0;

    // Calculate percentage: (index / 12) * 100
    // 12 is the last index (final_image), so finale = 11/12 = 91.67%
    return Math.round((index / 12) * 100);
  },

  /**
   * Render arc card HTML
   * @param {object} arcData - Arc data from API
   * @returns {string} HTML string
   */
  render(arcData) {
    const {
      arc_uuid,
      character_id,
      archetype,
      lie_belief,
      truth_belief,
      want_external,
      need_internal,
      current_phase
    } = arcData;

    const progress = this.calculateProgress(current_phase);
    const phaseLabel = this.PHASE_LABELS[current_phase] || current_phase;

    return `
      <div class="card arc-card" data-arc-id="${arc_uuid}">
        <div class="card-header">
          <h3 class="character-name">Character: ${character_id}</h3>
          ${archetype ? `<span class="badge badge-archetype">${archetype}</span>` : ''}
        </div>

        <div class="card-body">
          <div class="arc-phase">
            <div class="phase-label">
              <strong>Current Phase:</strong> ${phaseLabel}
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text">${progress}% complete</div>
          </div>

          ${lie_belief || truth_belief ? `
            <div class="arc-transformation">
              <div class="transformation-row">
                <span class="label">Lie:</span>
                <span class="value">${lie_belief || '<em>Not defined</em>'}</span>
              </div>
              <div class="transformation-arrow">↓</div>
              <div class="transformation-row">
                <span class="label">Truth:</span>
                <span class="value">${truth_belief || '<em>Not defined</em>'}</span>
              </div>
            </div>
          ` : ''}

          ${want_external || need_internal ? `
            <div class="arc-goals">
              <div class="goal-row">
                <span class="label">Want (External):</span>
                <span class="value">${want_external || '<em>Not defined</em>'}</span>
              </div>
              <div class="goal-row">
                <span class="label">Need (Internal):</span>
                <span class="value">${need_internal || '<em>Not defined</em>'}</span>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ArcCard };
}
