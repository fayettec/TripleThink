/**
 * Validation Panel Component
 * Real-time validation of narrative consistency
 */

const ValidationPanel = {
  /**
   * Render validation results
   */
  async render(containerId) {
    const container = document.getElementById(containerId);

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Validation Status</h3>
          <button class="btn btn-primary" onclick="ValidationPanel.runValidation()">
            Run Validation
          </button>
        </div>

        <div id="validation-results" style="padding: var(--space-4);">
          <p class="text-gray">No validation run yet. Click "Run Validation" to check for consistency issues.</p>
        </div>
      </div>
    `;
  },

  /**
   * Run validation checks
   */
  async runValidation() {
    const resultsDiv = document.getElementById('validation-results');
    resultsDiv.innerHTML = '<p class="text-gray">Running validation...</p>';

    try {
      const results = await api.request('/validation/check');

      if (results.errors && results.errors.length > 0) {
        resultsDiv.innerHTML = `
          <div style="background-color: #FEE2E2; padding: var(--space-4); border-radius: var(--radius-lg); border: 1px solid var(--color-danger);">
            <h4 style="color: var(--color-danger); margin-top: 0;">
              Found ${results.errors.length} error(s)
            </h4>
            ${results.errors.map(err => `
              <div style="margin: var(--space-2) 0; padding: var(--space-2); background-color: rgba(255,255,255,0.5); border-radius: var(--radius-md);">
                <strong>${err.type}:</strong> ${err.message}
              </div>
            `).join('')}
          </div>
        `;
      } else {
        resultsDiv.innerHTML = `
          <div style="background-color: #D1FAE5; padding: var(--space-4); border-radius: var(--radius-lg); border: 1px solid var(--color-success);">
            <h4 style="color: var(--color-success); margin-top: 0;">
              Validation passed!
            </h4>
            <p>No consistency issues found.</p>
          </div>
        `;
      }

      if (results.warnings && results.warnings.length > 0) {
        resultsDiv.innerHTML += `
          <div style="margin-top: var(--space-4); background-color: #FEF3C7; padding: var(--space-4); border-radius: var(--radius-lg); border: 1px solid var(--color-warning);">
            <h4 style="color: #92400E; margin-top: 0;">
              ${results.warnings.length} warning(s)
            </h4>
            ${results.warnings.map(warn => `
              <div style="margin: var(--space-2) 0; font-size: var(--font-size-sm);">
                ${warn.message}
              </div>
            `).join('')}
          </div>
        `;
      }
    } catch (error) {
      console.error('Validation failed:', error);
      resultsDiv.innerHTML = '<p class="text-danger">Validation check failed: ' + error.message + '</p>';
    }
  },
};
