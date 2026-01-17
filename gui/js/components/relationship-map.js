/**
 * Relationship Map Component
 * Vis.js network visualization for character relationships
 * Color-coded edges by relationship dynamics (trust, conflict, respect, power)
 */

const RelationshipMap = {
  // Current state
  currentFictionId: null,
  container: null,
  network: null,

  /**
   * Render relationship network in specified container
   * @param {string} containerId - DOM element ID to render into
   * @param {string} fictionId - Fiction UUID for relationship filtering
   */
  async render(containerId, fictionId) {
    this.currentFictionId = fictionId;
    this.container = document.getElementById(containerId);

    if (!this.container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    // Clear container
    this.container.innerHTML = '';

    // Create info panel
    this.renderInfoPanel();

    // Create network container
    const networkContainer = document.createElement('div');
    networkContainer.id = `${containerId}-network`;
    networkContainer.style.width = '100%';
    networkContainer.style.height = '600px';
    networkContainer.style.border = '1px solid var(--color-border)';
    networkContainer.style.backgroundColor = 'var(--color-surface)';
    this.container.appendChild(networkContainer);

    // Fetch relationship data
    try {
      const relationships = await api.getRelationships(fictionId);
      this.renderNetwork(networkContainer, relationships);
    } catch (error) {
      console.error('Error fetching relationships:', error);
      networkContainer.innerHTML = `<div style="padding: 20px; color: var(--color-danger);">Error loading relationships: ${error.message}</div>`;
    }
  },

  /**
   * Render info panel explaining color codes
   */
  renderInfoPanel() {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'relationship-info-panel';
    infoDiv.style.padding = '12px';
    infoDiv.style.backgroundColor = 'var(--color-surface-light)';
    infoDiv.style.borderBottom = '1px solid var(--color-border)';
    infoDiv.style.fontSize = '0.9em';

    infoDiv.innerHTML = `
      <div style="display: flex; gap: 24px; flex-wrap: wrap;">
        <div><strong>Edge Colors:</strong></div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 20px; height: 3px; background: #2ecc71;"></div>
          <span>High Trust (&gt; 0.7)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 20px; height: 3px; background: #e74c3c;"></div>
          <span>Fear/Conflict (&gt; 0.5)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 20px; height: 3px; background: #3498db;"></div>
          <span>Respect (0.4-0.7)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 20px; height: 3px; background: #9b59b6;"></div>
          <span>Power Imbalance (&gt; 0.5)</span>
        </div>
        <div style="margin-left: auto;">
          <em>Edge width = intimacy level</em>
        </div>
      </div>
    `;

    this.container.appendChild(infoDiv);
  },

  /**
   * Render Vis.js network graph
   * @param {HTMLElement} networkContainer - Container element for network
   * @param {array} relationships - Relationship data from API
   */
  renderNetwork(networkContainer, relationships) {
    // Handle empty state
    if (!relationships || relationships.length === 0) {
      networkContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--color-text-secondary);">No relationships recorded yet. Create relationships to see the network visualization.</div>';
      return;
    }

    // Build nodes and edges for Vis.js
    const nodeMap = new Map();
    const edges = [];

    relationships.forEach(rel => {
      // Add nodes if not already present
      if (!nodeMap.has(rel.entityAId)) {
        nodeMap.set(rel.entityAId, {
          id: rel.entityAId,
          label: this.getEntityLabel(rel.entityAId),
          shape: 'dot',
          size: 20,
          font: { size: 14 },
          color: {
            background: '#ecf0f1',
            border: '#34495e',
            highlight: {
              background: '#3498db',
              border: '#2980b9'
            }
          }
        });
      }

      if (!nodeMap.has(rel.entityBId)) {
        nodeMap.set(rel.entityBId, {
          id: rel.entityBId,
          label: this.getEntityLabel(rel.entityBId),
          shape: 'dot',
          size: 20,
          font: { size: 14 },
          color: {
            background: '#ecf0f1',
            border: '#34495e',
            highlight: {
              background: '#3498db',
              border: '#2980b9'
            }
          }
        });
      }

      // Determine edge color based on dominant relationship characteristic
      const edgeColor = this.determineEdgeColor(rel);

      // Calculate edge width from intimacy level (0-1 → 1-5px)
      const edgeWidth = 1 + (rel.intimacyLevel * 4);

      // Build tooltip with all metrics
      const tooltip = this.buildTooltip(rel);

      edges.push({
        from: rel.entityAId,
        to: rel.entityBId,
        color: edgeColor,
        width: edgeWidth,
        title: tooltip,
        smooth: {
          type: 'continuous'
        }
      });
    });

    // Convert node map to array
    const nodes = Array.from(nodeMap.values());

    // Create Vis.js network
    const data = { nodes, edges };

    const options = {
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 200,
          springConstant: 0.08,
          avoidOverlap: 0.5
        },
        stabilization: {
          enabled: true,
          iterations: 100
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        navigationButtons: true,
        keyboard: true,
        zoomView: true,
        dragView: true
      },
      nodes: {
        borderWidth: 2,
        shadow: true
      },
      edges: {
        arrows: {
          to: {
            enabled: false
          }
        },
        shadow: true,
        smooth: {
          type: 'continuous'
        }
      }
    };

    // Dispose existing network if present
    if (this.network) {
      this.network.destroy();
    }

    // Create network
    this.network = new vis.Network(networkContainer, data, options);

    // Add stabilization listener
    this.network.on('stabilizationIterationsDone', () => {
      this.network.setOptions({ physics: { enabled: false } });
    });
  },

  /**
   * Determine edge color based on relationship metrics
   * Priority: trust > conflict > respect > power
   * @param {object} rel - Relationship object
   * @returns {string} Hex color code
   */
  determineEdgeColor(rel) {
    // High trust (> 0.7) - Green
    if (rel.trustLevel > 0.7) {
      return '#2ecc71';
    }

    // Fear/conflict (> 0.5) - Red
    if (rel.conflictLevel > 0.5) {
      return '#e74c3c';
    }

    // Respect (trust 0.4-0.7) - Blue
    if (rel.trustLevel >= 0.4 && rel.trustLevel <= 0.7) {
      return '#3498db';
    }

    // Power imbalance (abs > 0.5) - Purple
    if (Math.abs(rel.powerBalance) > 0.5) {
      return '#9b59b6';
    }

    // Default - Gray (neutral relationship)
    return '#95a5a6';
  },

  /**
   * Build tooltip HTML with all relationship metrics
   * @param {object} rel - Relationship object
   * @returns {string} HTML tooltip content
   */
  buildTooltip(rel) {
    const entityA = this.getEntityLabel(rel.entityAId);
    const entityB = this.getEntityLabel(rel.entityBId);

    return `
      <div style="padding: 8px;">
        <strong>${entityA} ↔ ${entityB}</strong><br>
        <em>${rel.relationshipType}</em><br>
        <br>
        <strong>Metrics:</strong><br>
        Trust: ${rel.trustLevel.toFixed(2)}<br>
        Sentiment: ${rel.sentiment.toFixed(2)}<br>
        Conflict: ${rel.conflictLevel.toFixed(2)}<br>
        Power Balance: ${rel.powerBalance.toFixed(2)}<br>
        Intimacy: ${rel.intimacyLevel.toFixed(2)}<br>
        Status: ${rel.status}
      </div>
    `;
  },

  /**
   * Get entity label from ID
   * In a full implementation, this would fetch entity name from API
   * For now, extract readable portion from ID
   * @param {string} entityId - Entity ID
   * @returns {string} Entity label
   */
  getEntityLabel(entityId) {
    // Simple extraction: if ID is like "char-alice-123", extract "alice"
    const parts = entityId.split('-');
    if (parts.length >= 2) {
      return parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    }
    // Fallback: use last 8 chars of ID
    return entityId.slice(-8);
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RelationshipMap };
}
