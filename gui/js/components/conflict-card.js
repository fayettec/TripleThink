/**
 * Conflict Card Component
 * Displays story conflict with type, status, and stakes
 */

const ConflictCard = {
  // Type colors
  TYPE_COLORS: {
    'external': '#3B82F6', // blue
    'internal': '#8B5CF6', // purple
    'interpersonal': '#10B981', // green
    'societal': '#F59E0B', // orange
    'environmental': '#14B8A6' // teal
  },

  // Status colors
  STATUS_COLORS: {
    'latent': '#6B7280', // gray
    'active': '#EAB308', // yellow
    'escalating': '#F59E0B', // orange
    'climactic': '#EF4444', // red
    'resolved': '#10B981' // green
  },

  // Human-readable labels
  TYPE_LABELS: {
    'external': 'External',
    'internal': 'Internal',
    'interpersonal': 'Interpersonal',
    'societal': 'Societal',
    'environmental': 'Environmental'
  },

  STATUS_LABELS: {
    'latent': 'Latent',
    'active': 'Active',
    'escalating': 'Escalating',
    'climactic': 'Climactic',
    'resolved': 'Resolved'
  },

  /**
   * Render conflict card HTML
   * @param {object} conflictData - Conflict data from API
   * @returns {string} HTML string
   */
  render(conflictData) {
    const {
      conflict_uuid,
      type,
      protagonist_id,
      antagonist_source,
      stakes_success,
      stakes_fail,
      status
    } = conflictData;

    const typeColor = this.TYPE_COLORS[type] || '#6B7280';
    const statusColor = this.STATUS_COLORS[status] || '#6B7280';
    const typeLabel = this.TYPE_LABELS[type] || type;
    const statusLabel = this.STATUS_LABELS[status] || status;

    return `
      <div class="card conflict-card" data-conflict-id="${conflict_uuid}">
        <div class="card-header">
          <div class="badges">
            <span class="badge badge-type" style="background-color: ${typeColor}; color: white;">
              ${typeLabel}
            </span>
            <span class="badge badge-status" style="background-color: ${statusColor}; color: white;">
              ${statusLabel}
            </span>
          </div>
        </div>

        <div class="card-body">
          <div class="conflict-participants">
            <div class="participant-row">
              <span class="label">Protagonist:</span>
              <span class="value">${protagonist_id}</span>
            </div>
            <div class="vs-divider">vs</div>
            <div class="participant-row">
              <span class="label">Antagonist:</span>
              <span class="value">${antagonist_source || '<em>Not defined</em>'}</span>
            </div>
          </div>

          ${stakes_success || stakes_fail ? `
            <div class="conflict-stakes">
              <h4>Stakes</h4>
              ${stakes_success ? `
                <div class="stakes-row success">
                  <span class="icon">✓</span>
                  <span class="label">If protagonist succeeds:</span>
                  <span class="value">${stakes_success}</span>
                </div>
              ` : ''}
              ${stakes_fail ? `
                <div class="stakes-row fail">
                  <span class="icon">✗</span>
                  <span class="label">If protagonist fails:</span>
                  <span class="value">${stakes_fail}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConflictCard };
}
