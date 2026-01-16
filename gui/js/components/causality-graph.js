/**
 * Causality Graph Component
 * D3.js force-directed graph visualization for event causal relationships
 * Supports depth control, color-coded edge types, and 50-node limit
 */

const CausalityGraph = {
  // Color mapping for relationship types
  EDGE_COLORS: {
    'direct-cause': '#e74c3c',
    'enabling-condition': '#3498db',
    'motivation': '#9b59b6',
    'psychological-trigger': '#e67e22'
  },

  // Current state
  currentEventId: null,
  currentDepth: 3,
  container: null,
  svg: null,
  simulation: null,
  truncated: false,
  nodeCount: 0,

  /**
   * Render graph in specified container
   * @param {string} containerId - DOM element ID to render into
   * @param {string} eventId - Starting event UUID for traversal
   * @param {number} depth - Traversal depth (1-10, default from state or 3)
   */
  async render(containerId, eventId, depth = null) {
    this.currentEventId = eventId;
    this.currentDepth = depth !== null ? depth : (state.get('causalityDepth') || 3);
    this.container = document.getElementById(containerId);

    if (!this.container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    // Clear container
    this.container.innerHTML = '';

    // Create controls section
    this.renderControls(containerId);

    // Create SVG container for graph
    const svgContainer = document.createElement('div');
    svgContainer.id = `${containerId}-svg`;
    svgContainer.style.width = '100%';
    svgContainer.style.height = '600px';
    svgContainer.style.border = '1px solid var(--color-border)';
    svgContainer.style.backgroundColor = 'var(--color-surface)';
    this.container.appendChild(svgContainer);

    // Fetch graph data
    try {
      const graphData = await api.getCausalityGraph(eventId, this.currentDepth);
      this.renderGraph(svgContainer, graphData);
    } catch (error) {
      console.error('Error fetching causality graph:', error);
      svgContainer.innerHTML = `<div style="padding: 20px; color: var(--color-danger);">Error loading graph: ${error.message}</div>`;
    }
  },

  /**
   * Render control panel with depth slider and info displays
   * @param {string} containerId - Container ID for controls
   */
  renderControls(containerId) {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'causality-controls';
    controlsDiv.style.display = 'flex';
    controlsDiv.style.alignItems = 'center';
    controlsDiv.style.gap = '16px';
    controlsDiv.style.padding = '12px';
    controlsDiv.style.backgroundColor = 'var(--color-surface-light)';
    controlsDiv.style.borderBottom = '1px solid var(--color-border)';

    // Depth label
    const depthLabel = document.createElement('label');
    depthLabel.textContent = 'Traversal Depth:';
    depthLabel.style.fontWeight = 'bold';
    controlsDiv.appendChild(depthLabel);

    // Depth slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '1';
    slider.max = '10';
    slider.value = this.currentDepth.toString();
    slider.style.width = '200px';
    controlsDiv.appendChild(slider);

    // Current depth display
    const depthDisplay = document.createElement('span');
    depthDisplay.id = `${containerId}-depth-display`;
    depthDisplay.textContent = `Depth: ${this.currentDepth}`;
    depthDisplay.style.fontWeight = 'bold';
    depthDisplay.style.color = 'var(--color-primary)';
    controlsDiv.appendChild(depthDisplay);

    // Node count display
    const nodeCountDisplay = document.createElement('span');
    nodeCountDisplay.id = `${containerId}-node-count`;
    nodeCountDisplay.textContent = `Nodes: 0`;
    nodeCountDisplay.style.marginLeft = 'auto';
    controlsDiv.appendChild(nodeCountDisplay);

    // Warning badge (hidden by default)
    const warningBadge = document.createElement('span');
    warningBadge.id = `${containerId}-warning`;
    warningBadge.textContent = 'Limited to 50 nodes';
    warningBadge.style.padding = '4px 8px';
    warningBadge.style.backgroundColor = '#e67e22';
    warningBadge.style.color = 'white';
    warningBadge.style.borderRadius = '4px';
    warningBadge.style.fontSize = '0.9em';
    warningBadge.style.display = 'none';
    controlsDiv.appendChild(warningBadge);

    // Slider change handler
    slider.addEventListener('input', (e) => {
      const newDepth = parseInt(e.target.value, 10);
      depthDisplay.textContent = `Depth: ${newDepth}`;
    });

    slider.addEventListener('change', (e) => {
      const newDepth = parseInt(e.target.value, 10);
      state.update({ causalityDepth: newDepth });
      this.updateDepth(newDepth);
    });

    this.container.appendChild(controlsDiv);
  },

  /**
   * Render D3 force-directed graph
   * @param {HTMLElement} svgContainer - Container element for SVG
   * @param {object} graphData - Graph data with nodes and edges
   */
  renderGraph(svgContainer, graphData) {
    // Apply 50-node limit
    let nodes = graphData.nodes || [];
    let edges = graphData.edges || [];

    this.truncated = nodes.length > 50;
    if (this.truncated) {
      // Truncate to first 50 nodes
      nodes = nodes.slice(0, 50);
      const nodeIds = new Set(nodes.map(n => n.id));
      // Filter edges to only include those connecting remaining nodes
      edges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    this.nodeCount = nodes.length;

    // Update controls
    const containerId = this.container.id;
    const nodeCountDisplay = document.getElementById(`${containerId}-node-count`);
    const warningBadge = document.getElementById(`${containerId}-warning`);

    if (nodeCountDisplay) {
      nodeCountDisplay.textContent = `Nodes: ${this.nodeCount}`;
    }

    if (warningBadge) {
      warningBadge.style.display = this.truncated ? 'block' : 'none';
    }

    // SVG dimensions
    const width = svgContainer.clientWidth || 800;
    const height = svgContainer.clientHeight || 600;

    // Clear previous SVG
    svgContainer.innerHTML = '';

    // Create SVG
    const svg = d3.select(svgContainer)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Add zoom behavior
    const g = svg.append('g');
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // Define arrow markers for each edge type
    const defs = svg.append('defs');
    Object.entries(this.EDGE_COLORS).forEach(([type, color]) => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color);
    });

    // Create force simulation
    this.simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges)
        .id(d => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Draw edges
    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', d => this.EDGE_COLORS[d.type] || '#999')
      .attr('stroke-width', d => (d.strength || 5) / 2) // 1-10 strength → 0.5-5px
      .attr('stroke-opacity', 0.8)
      .attr('marker-end', d => `url(#arrow-${d.type})`);

    // Draw nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 20)
      .attr('fill', 'var(--color-surface-light)')
      .attr('stroke', 'var(--color-border)')
      .attr('stroke-width', 2)
      .call(d3.drag()
        .on('start', (event, d) => this.dragStarted(event, d))
        .on('drag', (event, d) => this.dragged(event, d))
        .on('end', (event, d) => this.dragEnded(event, d)));

    // Add labels
    const labels = g.append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .text(d => d.label || d.id)
      .attr('font-size', '12px')
      .attr('text-anchor', 'middle')
      .attr('dy', 30)
      .attr('fill', 'var(--color-text)');

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

    this.svg = svg;
  },

  /**
   * Update graph with new traversal depth
   * @param {number} newDepth - New depth value (1-10)
   */
  async updateDepth(newDepth) {
    this.currentDepth = newDepth;

    if (!this.currentEventId || !this.container) {
      return;
    }

    // Re-fetch and re-render
    const svgContainer = document.getElementById(`${this.container.id}-svg`);
    if (!svgContainer) {
      return;
    }

    try {
      const graphData = await api.getCausalityGraph(this.currentEventId, newDepth);
      this.renderGraph(svgContainer, graphData);
    } catch (error) {
      console.error('Error updating graph depth:', error);
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
