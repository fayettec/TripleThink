/**
 * Theme Card Component
 * Displays thematic element with statement, question, symbol, and manifestations
 */

const ThemeCard = {
  /**
   * Render theme card HTML
   * @param {object} themeData - Theme data from API
   * @returns {string} HTML string
   */
  render(themeData) {
    const {
      theme_uuid,
      statement,
      primary_symbol_id,
      question,
      manifestations
    } = themeData;

    // Ensure manifestations is an array
    const manifestationList = Array.isArray(manifestations) ? manifestations : [];

    return `
      <div class="card theme-card" data-theme-id="${theme_uuid}">
        <div class="card-header">
          <h3 class="theme-statement">${statement}</h3>
          ${question ? `<p class="theme-question" style="font-style: italic; color: var(--color-text-secondary); font-size: 0.9em; margin-top: 8px;">${question}</p>` : ''}
        </div>

        <div class="card-body">
          ${primary_symbol_id ? `
            <div class="theme-symbol" style="margin-bottom: 16px; padding: 8px; background-color: var(--color-surface-light); border-radius: 4px;">
              <span style="font-weight: bold;">Symbol:</span> ${primary_symbol_id}
            </div>
          ` : ''}

          <div class="theme-manifestations">
            <h4 style="margin-bottom: 8px; font-size: 0.95em; color: var(--color-text-secondary);">Manifestations</h4>
            ${manifestationList.length > 0 ? `
              <ul style="list-style: disc; padding-left: 24px; margin: 0;">
                ${manifestationList.map(m => `<li style="margin-bottom: 4px;">${m}</li>`).join('')}
              </ul>
            ` : `
              <p style="color: var(--color-text-muted); font-style: italic;">No manifestations recorded</p>
            `}
          </div>
        </div>
      </div>
    `;
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ThemeCard };
}
