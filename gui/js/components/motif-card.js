/**
 * Motif Card Component
 * Displays motif instance with type badge, description, and significance
 */

const MotifCard = {
  // Motif type color (using consistent accent color)
  MOTIF_COLOR: '#14B8A6', // teal

  /**
   * Render motif card HTML
   * @param {object} motifData - Motif data from API
   * @returns {string} HTML string
   */
  render(motifData) {
    const {
      motif_uuid,
      motif_type,
      linked_entity_id,
      description,
      significance
    } = motifData;

    return `
      <div class="card motif-card" data-motif-id="${motif_uuid}">
        <div class="card-header">
          <span class="badge motif-badge" style="background-color: ${this.MOTIF_COLOR}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.85em; font-weight: bold;">
            ${motif_type}
          </span>
        </div>

        <div class="card-body">
          <p class="motif-description" style="margin-bottom: 12px; line-height: 1.5;">
            ${description}
          </p>

          ${significance ? `
            <div class="motif-significance" style="margin-bottom: 12px; padding: 8px; background-color: var(--color-surface-light); border-radius: 4px;">
              <span style="font-weight: bold; color: var(--color-text-secondary);">Significance:</span> ${significance}
            </div>
          ` : ''}

          ${linked_entity_id ? `
            <div class="motif-entity" style="font-size: 0.9em; color: var(--color-text-secondary);">
              <span style="font-weight: bold;">Linked to:</span> ${linked_entity_id}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MotifCard };
}
