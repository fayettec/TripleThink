/**
 * Epistemic Screen
 * Epistemic graph and knowledge tracking (Phase 11+)
 */

const EpistemicScreen = {
  // State
  unsubscribers: [],
  currentPrimaryCharacter: null,
  currentSecondaryCharacter: null,
  simulation: null,
  graphData: null,
  filteredNodeType: null, // 'both', 'primary-only', 'secondary-only', 'false-beliefs', null

  render() {
    // Clean up previous subscriptions
    this.cleanup();

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen epistemic-screen">
        <header class="screen-header">
          <h1>Epistemic States</h1>
          <button class="btn btn-icon" onclick="PowerDrawer.toggle()" title="Open Power Drawer">
            <span>🔍</span>
          </button>
        </header>
        <div id="layer-switcher-container"></div>
        <div class="screen-content">
          <div id="epistemic-content"></div>
        </div>
      </div>
    `;

    // Initialize layer switcher
    LayerSwitcher.init('layer-switcher-container');

    // Subscribe to state changes
    this.setupSubscriptions();

    // Initial render
    this.renderContent();
  },

  setupSubscriptions() {
    // Subscribe to viewMode changes
    const viewModeUnsub = state.subscribe('viewMode', () => {
      this.updateGraphByViewMode();
    });
    this.unsubscribers.push(viewModeUnsub);

    // Subscribe to timestamp changes
    const timestampUnsub = state.subscribe('currentTimestamp', () => {
      this.fetchAndRenderGraph();
    });
    this.unsubscribers.push(timestampUnsub);

    // Subscribe to project changes
    const projectUnsub = state.subscribe('currentProjectId', () => {
      this.renderContent();
    });
    this.unsubscribers.push(projectUnsub);
  },

  cleanup() {
    // Unsubscribe from all state listeners
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];

    // Stop simulation if running
    if (this.simulation) {
      this.simulation.stop();
      this.simulation = null;
    }
  },

  async renderContent() {
    const container = document.getElementById('epistemic-content');
    if (!container) return;

    const projectId = state.get('currentProjectId');

    if (!projectId) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🧠</div>
          <div class="empty-message">No project selected</div>
          <div class="empty-hint">Select a project to view epistemic states</div>
        </div>
      `;
      return;
    }

    // TODO: Get characters from API
    // For now, simulate empty state
    container.innerHTML = `
      <div class="epistemic-controls">
        <div class="character-selectors">
          <div class="selector-group">
            <label for="primary-character">Primary Character:</label>
            <select id="primary-character" class="character-select">
              <option value="">-- Select Character --</option>
            </select>
          </div>
          <div class="selector-group">
            <label for="secondary-character">Compare with:</label>
            <select id="secondary-character" class="character-select">
              <option value="">-- Optional --</option>
            </select>
          </div>
        </div>
      </div>
      <div id="comparison-diff-panel" style="display: none;"></div>
      <div id="epistemic-graph-container"></div>
    `;

    // Load characters and populate selectors
    await this.loadCharacters(projectId);

    // Set up character selector change handlers
    this.setupCharacterSelectors();
  },

  async loadCharacters(projectId) {
    try {
      // TODO: Replace with actual character endpoint when available
      // For now, create a placeholder
      const primarySelect = document.getElementById('primary-character');
      const secondarySelect = document.getElementById('secondary-character');

      if (!primarySelect || !secondarySelect) return;

      // Placeholder: Add mock characters for testing
      const mockCharacters = [
        { entity_id: 'char-1', name: 'Alice' },
        { entity_id: 'char-2', name: 'Bob' },
        { entity_id: 'char-3', name: 'Charlie' }
      ];

      mockCharacters.forEach(char => {
        const option1 = document.createElement('option');
        option1.value = char.entity_id;
        option1.textContent = char.name;
        primarySelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = char.entity_id;
        option2.textContent = char.name;
        secondarySelect.appendChild(option2);
      });

      // Set first character as default primary
      if (mockCharacters.length > 0) {
        this.currentPrimaryCharacter = mockCharacters[0].entity_id;
        primarySelect.value = this.currentPrimaryCharacter;
        await this.fetchAndRenderGraph();
      }
    } catch (err) {
      console.error('Error loading characters:', err);
    }
  },

  setupCharacterSelectors() {
    const primarySelect = document.getElementById('primary-character');
    const secondarySelect = document.getElementById('secondary-character');

    if (primarySelect) {
      primarySelect.addEventListener('change', async (e) => {
        this.currentPrimaryCharacter = e.target.value;
        await this.fetchAndRenderGraph();
      });
    }

    if (secondarySelect) {
      secondarySelect.addEventListener('change', async (e) => {
        this.currentSecondaryCharacter = e.target.value || null;
        await this.fetchAndRenderGraph();
      });
    }
  },

  async fetchAndRenderGraph() {
    if (!this.currentPrimaryCharacter) {
      this.showEmptyState('no-character');
      return;
    }

    const timestamp = state.get('currentTimestamp') || Date.now();
    const graphContainer = document.getElementById('epistemic-graph-container');

    if (!graphContainer) return;

    try {
      graphContainer.innerHTML = '<div class="loading">Loading knowledge graph...</div>';

      // Fetch knowledge for primary character
      const primaryKnowledge = await api.request(
        `/api/epistemic/entities/${this.currentPrimaryCharacter}/knowledge?timestamp=${timestamp}`
      );

      // Fetch false beliefs
      const primaryFalseBeliefs = await api.request(
        `/api/epistemic/entities/${this.currentPrimaryCharacter}/false-beliefs?timestamp=${timestamp}`
      );

      let secondaryKnowledge = null;
      let divergence = null;

      if (this.currentSecondaryCharacter) {
        // Fetch secondary character knowledge
        secondaryKnowledge = await api.request(
          `/api/epistemic/entities/${this.currentSecondaryCharacter}/knowledge?timestamp=${timestamp}`
        );

        // Get divergence
        divergence = await api.request(
          `/api/epistemic/divergence/${this.currentPrimaryCharacter}/${this.currentSecondaryCharacter}?timestamp=${timestamp}`
        );
      }

      // Build graph data
      this.graphData = this.buildGraphData(
        primaryKnowledge,
        secondaryKnowledge,
        primaryFalseBeliefs,
        divergence
      );

      // Render comparison diff panel if comparing
      if (this.currentSecondaryCharacter && divergence) {
        this.renderComparisonDiff(divergence, primaryFalseBeliefs);
      } else {
        const diffPanel = document.getElementById('comparison-diff-panel');
        if (diffPanel) diffPanel.style.display = 'none';
      }

      // Render D3 graph
      this.renderKnowledgeGraph(graphContainer, this.graphData);

    } catch (err) {
      console.error('Error fetching knowledge graph:', err);
      graphContainer.innerHTML = `
        <div class="error">
          <p>Error loading knowledge graph: ${err.message}</p>
          <p class="empty-hint">This may be because epistemic data is not yet populated for this project.</p>
        </div>
      `;
    }
  },

  buildGraphData(primaryKnowledge, secondaryKnowledge, falseBeliefs, divergence) {
    const nodes = [];
    const edges = [];
    const nodeMap = new Map();

    const falseBeliefsSet = new Set(
      (falseBeliefs?.falseBeliefs || []).map(fb => fb.fact_id)
    );

    // Helper to determine node category
    const getNodeCategory = (factId) => {
      if (falseBeliefsSet.has(factId)) return 'false-belief';
      if (!secondaryKnowledge) return 'primary';

      const inPrimary = primaryKnowledge.facts.some(f => f.fact_id === factId);
      const inSecondary = secondaryKnowledge.facts.some(f => f.fact_id === factId);

      if (inPrimary && inSecondary) return 'both';
      if (inPrimary) return 'primary-only';
      if (inSecondary) return 'secondary-only';
      return 'unknown';
    };

    // Add nodes from primary knowledge
    primaryKnowledge.facts.forEach(fact => {
      if (!nodeMap.has(fact.fact_id)) {
        const category = getNodeCategory(fact.fact_id);
        nodeMap.set(fact.fact_id, {
          id: fact.fact_id,
          label: `${fact.fact_type}: ${fact.fact_key}`,
          value: fact.value,
          category,
          isFalseBelief: falseBeliefsSet.has(fact.fact_id)
        });
        nodes.push(nodeMap.get(fact.fact_id));
      }
    });

    // Add nodes from secondary knowledge if exists
    if (secondaryKnowledge) {
      secondaryKnowledge.facts.forEach(fact => {
        if (!nodeMap.has(fact.fact_id)) {
          const category = getNodeCategory(fact.fact_id);
          nodeMap.set(fact.fact_id, {
            id: fact.fact_id,
            label: `${fact.fact_type}: ${fact.fact_key}`,
            value: fact.value,
            category,
            isFalseBelief: false
          });
          nodes.push(nodeMap.get(fact.fact_id));
        }
      });
    }

    // TODO: Add edges based on fact relationships (when available in API)
    // For now, graph will show nodes without edges

    return { nodes, edges };
  },

  renderComparisonDiff(divergence, falseBeliefs) {
    const diffPanel = document.getElementById('comparison-diff-panel');
    if (!diffPanel) return;

    const primaryName = this.currentPrimaryCharacter;
    const secondaryName = this.currentSecondaryCharacter;

    const sharedCount = divergence.sharedKnowledge?.length || 0;
    const primaryOnlyCount = divergence.onlyAKnows?.length || 0;
    const secondaryOnlyCount = divergence.onlyBKnows?.length || 0;
    const falseBeliefsCount = falseBeliefs?.falseBeliefs?.length || 0;

    diffPanel.innerHTML = `
      <div class="comparison-diff">
        <div class="diff-section">
          <button class="diff-badge badge-both" data-filter="both">
            Both know: ${sharedCount}
          </button>
          <button class="diff-badge badge-primary-only" data-filter="primary-only">
            Only ${primaryName}: ${primaryOnlyCount}
          </button>
          <button class="diff-badge badge-secondary-only" data-filter="secondary-only">
            Only ${secondaryName}: ${secondaryOnlyCount}
          </button>
          <button class="diff-badge badge-false-beliefs" data-filter="false-beliefs">
            False beliefs: ${falseBeliefsCount}
          </button>
        </div>
        <div class="diff-hint">
          Click a badge to filter the graph
        </div>
      </div>
    `;

    diffPanel.style.display = 'block';

    // Set up filter handlers
    diffPanel.querySelectorAll('.diff-badge').forEach(badge => {
      badge.addEventListener('click', (e) => {
        const filter = e.target.dataset.filter;
        this.applyNodeFilter(filter);

        // Update active badge
        diffPanel.querySelectorAll('.diff-badge').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });
  },

  applyNodeFilter(filterType) {
    this.filteredNodeType = filterType;
    this.updateGraphVisibility();
  },

  updateGraphVisibility() {
    if (!this.graphData) return;

    const svg = d3.select('#epistemic-graph-container svg');
    if (svg.empty()) return;

    svg.selectAll('circle').style('opacity', d => {
      if (!this.filteredNodeType) return 1;
      if (this.filteredNodeType === 'false-beliefs') {
        return d.isFalseBelief ? 1 : 0.2;
      }
      return d.category === this.filteredNodeType ? 1 : 0.2;
    });

    svg.selectAll('text').style('opacity', d => {
      if (!this.filteredNodeType) return 1;
      if (this.filteredNodeType === 'false-beliefs') {
        return d.isFalseBelief ? 1 : 0.2;
      }
      return d.category === this.filteredNodeType ? 1 : 0.2;
    });
  },

  updateGraphByViewMode() {
    // Filter graph based on viewMode
    const viewMode = state.get('viewMode');

    // TODO: Implement view mode filtering when reader knowledge tracking is available
    // For now, just log the mode change
    console.log('View mode changed to:', viewMode);
  },

  renderKnowledgeGraph(container, graphData) {
    const { nodes, edges } = graphData;

    if (nodes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📖</div>
          <div class="empty-message">No knowledge data yet</div>
          <div class="empty-hint">Knowledge states are tracked per event. Create events and assign character knowledge.</div>
        </div>
      `;
      return;
    }

    // Clear container
    container.innerHTML = '';
    container.style.minHeight = '600px';
    container.style.border = '1px solid var(--color-border, #ddd)';
    container.style.backgroundColor = 'var(--color-bg, #fff)';

    const width = container.clientWidth || 800;
    const height = 600;

    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'epistemic-graph');

    // Add zoom behavior
    const g = svg.append('g');
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // Color mapping for node categories
    const categoryColors = {
      'both': '#10b981',           // Green - shared knowledge
      'primary-only': '#3b82f6',   // Blue - primary only
      'secondary-only': '#8b5cf6', // Purple - secondary only
      'false-belief': '#ff9800',   // Orange - false belief
      'primary': '#3b82f6'         // Blue - default for single character
    };

    // Create force simulation
    this.simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges)
        .id(d => d.id)
        .distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Draw edges (if any)
    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    // Draw nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 25)
      .attr('fill', d => categoryColors[d.category] || '#999')
      .attr('stroke', d => d.isFalseBelief ? '#ff9800' : '#fff')
      .attr('stroke-width', d => d.isFalseBelief ? 3 : 2)
      .attr('class', d => d.isFalseBelief ? 'node false-belief' : 'node')
      .call(d3.drag()
        .on('start', (event, d) => this.dragStarted(event, d))
        .on('drag', (event, d) => this.dragged(event, d))
        .on('end', (event, d) => this.dragEnded(event, d)))
      .on('click', (event, d) => this.showNodeDetails(d));

    // Add labels
    const labels = g.append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .text(d => d.label.length > 30 ? d.label.substring(0, 27) + '...' : d.label)
      .attr('font-size', '11px')
      .attr('text-anchor', 'middle')
      .attr('dy', 40)
      .attr('fill', '#374151');

    // Update positions on simulation tick
    this.simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    // Apply any active filter
    if (this.filteredNodeType) {
      this.updateGraphVisibility();
    }
  },

  showNodeDetails(node) {
    // TODO: Show node details in power drawer
    console.log('Node clicked:', node);

    // For now, just show an alert with node details
    const details = `
Fact: ${node.label}
Value: ${node.value}
Category: ${node.category}
False Belief: ${node.isFalseBelief ? 'Yes' : 'No'}
    `.trim();

    alert(details);
  },

  showEmptyState(type) {
    const container = document.getElementById('epistemic-graph-container');
    if (!container) return;

    if (type === 'no-character') {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <div class="empty-message">No character selected</div>
          <div class="empty-hint">Select a character to view their knowledge state</div>
        </div>
      `;
    }
  },

  // D3 drag handlers
  dragStarted(event, d) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  },

  dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  },

  dragEnded(event, d) {
    if (!event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EpistemicScreen };
}
