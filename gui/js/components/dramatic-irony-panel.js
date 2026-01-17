/**
 * Dramatic Irony Panel Component
 * Compares reader knowledge vs character knowledge to detect dramatic irony
 */

const DramaticIronyPanel = {
  /**
   * Check for dramatic irony between reader and character knowledge
   * @param {string} sceneId - Scene UUID
   * @param {string} characterId - Character entity UUID
   * @param {string} fictionId - Fiction UUID
   * @param {number} sceneTimestamp - Scene narrative timestamp
   * @returns {Promise<object>} Irony analysis with readerOnly and characterOnly facts
   */
  async checkForIrony(sceneId, characterId, fictionId, sceneTimestamp) {
    try {
      // Get reader knowledge at this scene
      const readerFacts = await ReaderKnowledgeTracker.getCumulativeFacts(
        sceneId,
        fictionId,
        sceneTimestamp
      );

      // Get character knowledge at this scene
      const characterResponse = await api.request(
        `/api/epistemic/entities/${characterId}/knowledge?timestamp=${sceneTimestamp}&fictionId=${fictionId}`
      );
      const characterFacts = characterResponse.facts || [];

      // Create lookup maps by factKey for comparison
      const readerFactMap = new Map();
      readerFacts.forEach(fact => {
        const key = `${fact.factType || fact.fact_type}:${fact.factKey || fact.fact_key}`;
        readerFactMap.set(key, fact);
      });

      const characterFactMap = new Map();
      characterFacts.forEach(fact => {
        const key = `${fact.factType || fact.fact_type}:${fact.factKey || fact.fact_key}`;
        characterFactMap.set(key, fact);
      });

      // Find facts reader knows but character doesn't (dramatic irony)
      const readerOnly = [];
      for (const [key, fact] of readerFactMap) {
        if (!characterFactMap.has(key)) {
          readerOnly.push(fact);
        }
      }

      // Find facts character knows but reader doesn't (mystery/surprise)
      const characterOnly = [];
      for (const [key, fact] of characterFactMap) {
        if (!readerFactMap.has(key)) {
          characterOnly.push(fact);
        }
      }

      return {
        readerOnly,
        characterOnly,
        hasIrony: readerOnly.length > 0 || characterOnly.length > 0,
        ironyCount: readerOnly.length + characterOnly.length
      };
    } catch (err) {
      console.error('Failed to check for dramatic irony:', err);
      return {
        readerOnly: [],
        characterOnly: [],
        hasIrony: false,
        ironyCount: 0,
        error: err.message
      };
    }
  },

  /**
   * Check for irony across all present characters in a scene
   * @param {string} sceneId - Scene UUID
   * @param {array} characterIds - Array of character entity UUIDs present in scene
   * @param {string} fictionId - Fiction UUID
   * @param {number} sceneTimestamp - Scene narrative timestamp
   * @returns {Promise<object>} Aggregated irony analysis for all characters
   */
  async checkForAllCharacters(sceneId, characterIds, fictionId, sceneTimestamp) {
    if (!characterIds || characterIds.length === 0) {
      return {
        characters: [],
        totalIronyCount: 0,
        hasAnyIrony: false
      };
    }

    try {
      const characterAnalyses = await Promise.all(
        characterIds.map(async (charId) => {
          const analysis = await this.checkForIrony(sceneId, charId, fictionId, sceneTimestamp);
          return {
            characterId: charId,
            ...analysis
          };
        })
      );

      const totalIronyCount = characterAnalyses.reduce(
        (sum, analysis) => sum + analysis.ironyCount,
        0
      );

      return {
        characters: characterAnalyses,
        totalIronyCount,
        hasAnyIrony: totalIronyCount > 0
      };
    } catch (err) {
      console.error('Failed to check irony for all characters:', err);
      return {
        characters: [],
        totalIronyCount: 0,
        hasAnyIrony: false,
        error: err.message
      };
    }
  },

  /**
   * Render dramatic irony panel for a single character
   * @param {string} sceneId - Scene UUID
   * @param {string} characterId - Character entity UUID
   * @param {string} fictionId - Fiction UUID
   * @param {number} sceneTimestamp - Scene narrative timestamp
   * @returns {Promise<string>} HTML string
   */
  async render(sceneId, characterId, fictionId, sceneTimestamp) {
    if (!sceneId || !characterId || !fictionId || !sceneTimestamp) {
      return `
        <div class="dramatic-irony-panel">
          <div class="empty-state">
            <p class="empty-message">Scene or character information incomplete</p>
          </div>
        </div>
      `;
    }

    try {
      const analysis = await this.checkForIrony(sceneId, characterId, fictionId, sceneTimestamp);

      if (analysis.error) {
        return `
          <div class="dramatic-irony-panel">
            <div class="error-state">
              <p class="error-message">Failed to analyze dramatic irony: ${analysis.error}</p>
            </div>
          </div>
        `;
      }

      if (!analysis.hasIrony) {
        return `
          <div class="dramatic-irony-panel">
            <div class="panel-header">
              <h4>Dramatic Irony Analysis</h4>
              <span class="badge badge-success">✓ No irony detected</span>
            </div>
            <div class="empty-state">
              <p class="empty-icon">🎭</p>
              <p class="empty-message">Reader and character have aligned knowledge</p>
            </div>
          </div>
        `;
      }

      // Build fact list for reader-only knowledge (classic dramatic irony)
      const readerOnlyHTML = analysis.readerOnly.length > 0 ? `
        <div class="irony-section irony-reader-knows">
          <h5>Reader Knows, Character Doesn't:</h5>
          <div class="fact-list">
            ${analysis.readerOnly.map(fact => `
              <div class="fact-item irony-fact">
                <span class="fact-type badge">${fact.factType || fact.fact_type}</span>
                <span class="fact-key">${fact.factKey || fact.fact_key}</span>
                <span class="fact-value">${fact.factValue || fact.fact_value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : '';

      // Build fact list for character-only knowledge (mystery/surprise)
      const characterOnlyHTML = analysis.characterOnly.length > 0 ? `
        <div class="irony-section irony-character-knows">
          <h5>Character Knows, Reader Doesn't:</h5>
          <div class="fact-list">
            ${analysis.characterOnly.map(fact => `
              <div class="fact-item mystery-fact">
                <span class="fact-type badge">${fact.factType || fact.fact_type}</span>
                <span class="fact-key">${fact.factKey || fact.fact_key}</span>
                <span class="fact-value">${fact.factValue || fact.fact_value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : '';

      return `
        <div class="dramatic-irony-panel">
          <div class="panel-header">
            <h4>Dramatic Irony Analysis</h4>
            <span class="badge badge-warning">⚠️ ${analysis.ironyCount} instance${analysis.ironyCount !== 1 ? 's' : ''} detected</span>
          </div>
          <div class="panel-body">
            ${readerOnlyHTML}
            ${characterOnlyHTML}
          </div>
        </div>
      `;
    } catch (err) {
      console.error('Failed to render dramatic irony panel:', err);
      return `
        <div class="dramatic-irony-panel">
          <div class="error-state">
            <p class="error-message">Failed to render irony analysis: ${err.message}</p>
          </div>
        </div>
      `;
    }
  },

  /**
   * Render aggregated dramatic irony panel for all characters in scene
   * @param {string} sceneId - Scene UUID
   * @param {array} characterIds - Array of character entity UUIDs present in scene
   * @param {string} fictionId - Fiction UUID
   * @param {number} sceneTimestamp - Scene narrative timestamp
   * @returns {Promise<string>} HTML string
   */
  async renderAggregate(sceneId, characterIds, fictionId, sceneTimestamp) {
    if (!characterIds || characterIds.length === 0) {
      return `
        <div class="dramatic-irony-panel">
          <div class="panel-header">
            <h4>Dramatic Irony Warnings</h4>
          </div>
          <div class="empty-state">
            <p class="empty-message">No characters present in scene</p>
          </div>
        </div>
      `;
    }

    try {
      const aggregateAnalysis = await this.checkForAllCharacters(
        sceneId,
        characterIds,
        fictionId,
        sceneTimestamp
      );

      if (aggregateAnalysis.error) {
        return `
          <div class="dramatic-irony-panel">
            <div class="error-state">
              <p class="error-message">Failed to analyze dramatic irony: ${aggregateAnalysis.error}</p>
            </div>
          </div>
        `;
      }

      if (!aggregateAnalysis.hasAnyIrony) {
        return `
          <div class="dramatic-irony-panel">
            <div class="panel-header">
              <h4>Dramatic Irony Warnings</h4>
              <span class="badge badge-success">✓ No irony detected</span>
            </div>
            <div class="empty-state">
              <p class="empty-icon">🎭</p>
              <p class="empty-message">All characters have knowledge aligned with reader</p>
            </div>
          </div>
        `;
      }

      // Build character-specific sections
      const characterSectionsHTML = aggregateAnalysis.characters
        .filter(char => char.hasIrony)
        .map(char => `
          <details class="character-irony-section">
            <summary>
              <strong>Character ${char.characterId}</strong>
              <span class="badge badge-warning">${char.ironyCount} instance${char.ironyCount !== 1 ? 's' : ''}</span>
            </summary>
            <div class="character-irony-details">
              ${char.readerOnly.length > 0 ? `
                <div class="irony-subsection">
                  <h6>Reader knows, character doesn't:</h6>
                  <ul>
                    ${char.readerOnly.map(fact => `
                      <li>${fact.factType || fact.fact_type}: ${fact.factKey || fact.fact_key} = ${fact.factValue || fact.fact_value}</li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
              ${char.characterOnly.length > 0 ? `
                <div class="irony-subsection">
                  <h6>Character knows, reader doesn't:</h6>
                  <ul>
                    ${char.characterOnly.map(fact => `
                      <li>${fact.factType || fact.fact_type}: ${fact.factKey || fact.fact_key} = ${fact.factValue || fact.fact_value}</li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          </details>
        `).join('');

      return `
        <div class="dramatic-irony-panel">
          <div class="panel-header">
            <h4>Dramatic Irony Warnings</h4>
            <span class="badge badge-warning">⚠️ ${aggregateAnalysis.totalIronyCount} total instance${aggregateAnalysis.totalIronyCount !== 1 ? 's' : ''}</span>
          </div>
          <div class="panel-body">
            ${characterSectionsHTML}
          </div>
        </div>
      `;
    } catch (err) {
      console.error('Failed to render aggregate dramatic irony panel:', err);
      return `
        <div class="dramatic-irony-panel">
          <div class="error-state">
            <p class="error-message">Failed to render irony analysis: ${err.message}</p>
          </div>
        </div>
      `;
    }
  },

  /**
   * Highlight scene element with irony warning
   * @param {string} elementId - DOM element ID to highlight
   */
  highlight(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`Element ${elementId} not found for irony highlighting`);
      return;
    }

    // Add warning class
    element.classList.add('irony-warning');

    // Optional: scroll into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Remove highlight after 3 seconds
    setTimeout(() => {
      element.classList.remove('irony-warning');
    }, 3000);
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DramaticIronyPanel };
}
