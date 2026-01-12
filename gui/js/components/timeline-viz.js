/**
 * Timeline Visualization Component
 * D3.js-based interactive timeline for events
 */

const TimelineViz = {
  svg: null,
  xScale: null,
  zoom: null,
  events: [],
  width: 0,
  height: 400,
  margin: { top: 20, right: 50, bottom: 50, left: 50 },

  async render(containerId, startDate, endDate, filters = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    // Set dimensions
    this.width = container.clientWidth || 800;

    // Fetch events
    await this.loadEvents(startDate, endDate, filters);

    if (this.events.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: var(--space-8); color: var(--color-gray-500);">
          <div style="font-size: var(--font-size-xl); margin-bottom: var(--space-2);">📅</div>
          <div>No events in this time range</div>
        </div>
      `;
      return;
    }

    // Create SVG
    this.createSVG(container);

    // Setup scales
    this.setupScales(startDate, endDate);

    // Draw timeline
    this.drawTimeline();

    // Add controls
    this.addControls(container);
  },

  async loadEvents(startDate, endDate, filters) {
    try {
      let url = '/entities?type=event';

      if (startDate && endDate) {
        url = `/temporal/events?from=${startDate}&to=${endDate}`;
      }

      if (filters.type) {
        url += `&type=${filters.type}`;
      }

      if (filters.participant) {
        url += `&participant=${filters.participant}`;
      }

      const response = await api.request(url);
      this.events = response.data || [];

      // Sort by timestamp
      this.events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
      console.error('Failed to load events:', error);
      this.events = [];
    }
  },

  createSVG(container) {
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('class', 'timeline-svg');
  },

  setupScales(startDate, endDate) {
    // Determine date range from events if not provided
    if (!startDate && this.events.length > 0) {
      const dates = this.events.map(e => new Date(e.timestamp));
      startDate = d3.min(dates);
      endDate = d3.max(dates);

      // Add padding
      const timeSpan = endDate - startDate;
      startDate = new Date(startDate.getTime() - timeSpan * 0.1);
      endDate = new Date(endDate.getTime() + timeSpan * 0.1);
    }

    // X scale for time
    this.xScale = d3.scaleTime()
      .domain([new Date(startDate), new Date(endDate)])
      .range([this.margin.left, this.width - this.margin.right]);

    // Y scale (fixed position for horizontal timeline)
    this.yPosition = this.height / 2;
  },

  drawTimeline() {
    // Draw axis
    const xAxis = d3.axisBottom(this.xScale)
      .ticks(10)
      .tickFormat(d3.timeFormat('%Y-%m-%d'));

    this.svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${this.yPosition + 40})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    // Draw timeline line
    this.svg.append('line')
      .attr('x1', this.margin.left)
      .attr('y1', this.yPosition)
      .attr('x2', this.width - this.margin.right)
      .attr('y2', this.yPosition)
      .attr('stroke', '#9CA3AF')
      .attr('stroke-width', 2);

    // Create group for events (for zoom)
    const eventsGroup = this.svg.append('g')
      .attr('class', 'events-group');

    // Draw events
    const tooltip = this.createTooltip();

    eventsGroup.selectAll('circle')
      .data(this.events)
      .enter()
      .append('circle')
      .attr('class', 'event-node')
      .attr('cx', d => this.xScale(new Date(d.timestamp)))
      .attr('cy', this.yPosition)
      .attr('r', 8)
      .attr('fill', d => this.getEventColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => this.showTooltip(event, d, tooltip))
      .on('mouseout', () => this.hideTooltip(tooltip))
      .on('click', (event, d) => this.handleEventClick(d));

    // Add zoom behavior
    this.addZoomBehavior(eventsGroup);

    // Add legend
    this.drawLegend();
  },

  getEventColor(event) {
    const data = event.data ? JSON.parse(event.data) : {};
    const type = data.type || 'default';

    const colors = {
      information_transfer: '#3B82F6', // Blue
      deception_event: '#EF4444',      // Red
      complex_multi_phase: '#F59E0B',  // Amber
      state_change: '#10B981',         // Green
      default: '#6B7280'               // Gray
    };

    return colors[type] || colors.default;
  },

  createTooltip() {
    return d3.select('body')
      .append('div')
      .attr('class', 'timeline-tooltip')
      .style('position', 'absolute')
      .style('background', 'white')
      .style('border', '1px solid #D1D5DB')
      .style('border-radius', '6px')
      .style('padding', '8px 12px')
      .style('font-size', '14px')
      .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000);
  },

  showTooltip(event, d, tooltip) {
    const data = d.data ? JSON.parse(d.data) : {};

    tooltip.transition()
      .duration(200)
      .style('opacity', 1);

    tooltip.html(`
      <div style="font-weight: 600; margin-bottom: 4px;">${d.id}</div>
      <div style="color: #6B7280; font-size: 12px; margin-bottom: 4px;">
        ${formatters.formatDate(d.timestamp)}
      </div>
      ${d.summary ? `<div style="font-size: 13px;">${d.summary}</div>` : ''}
      ${data.type ? `<div style="color: #6B7280; font-size: 12px; margin-top: 4px;">Type: ${data.type}</div>` : ''}
    `)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 28) + 'px');
  },

  hideTooltip(tooltip) {
    tooltip.transition()
      .duration(200)
      .style('opacity', 0);
  },

  handleEventClick(event) {
    // Open entity editor
    if (typeof editEntity === 'function') {
      editEntity(event.id);
    }
  },

  addZoomBehavior(eventsGroup) {
    this.zoom = d3.zoom()
      .scaleExtent([0.5, 10])
      .translateExtent([[0, 0], [this.width, this.height]])
      .on('zoom', (event) => {
        // Apply zoom to events
        eventsGroup.attr('transform', event.transform);

        // Update x-axis
        const newXScale = event.transform.rescaleX(this.xScale);
        this.svg.select('.x-axis').call(d3.axisBottom(newXScale).tickFormat(d3.timeFormat('%Y-%m-%d')));
      });

    this.svg.call(this.zoom);
  },

  drawLegend() {
    const legendData = [
      { type: 'information_transfer', label: 'Info Transfer', color: '#3B82F6' },
      { type: 'deception_event', label: 'Deception', color: '#EF4444' },
      { type: 'complex_multi_phase', label: 'Multi-Phase', color: '#F59E0B' },
      { type: 'state_change', label: 'State Change', color: '#10B981' }
    ];

    const legend = this.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.margin.left}, ${this.height - 30})`);

    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(${i * 120}, 0)`);

    legendItems.append('circle')
      .attr('r', 6)
      .attr('fill', d => d.color);

    legendItems.append('text')
      .attr('x', 12)
      .attr('y', 4)
      .style('font-size', '12px')
      .text(d => d.label);
  },

  addControls(container) {
    const controls = document.createElement('div');
    controls.className = 'timeline-controls';
    controls.style.cssText = 'display: flex; justify-content: center; gap: 8px; margin-top: 12px;';

    controls.innerHTML = `
      <button class="btn btn-sm btn-secondary" onclick="TimelineViz.zoomIn()">Zoom +</button>
      <button class="btn btn-sm btn-secondary" onclick="TimelineViz.zoomOut()">Zoom −</button>
      <button class="btn btn-sm btn-secondary" onclick="TimelineViz.resetZoom()">Reset</button>
    `;

    container.appendChild(controls);
  },

  zoomIn() {
    if (this.svg && this.zoom) {
      this.svg.transition().duration(300).call(this.zoom.scaleBy, 1.5);
    }
  },

  zoomOut() {
    if (this.svg && this.zoom) {
      this.svg.transition().duration(300).call(this.zoom.scaleBy, 0.67);
    }
  },

  resetZoom() {
    if (this.svg && this.zoom) {
      this.svg.transition().duration(300).call(this.zoom.transform, d3.zoomIdentity);
    }
  },

  destroy() {
    // Clean up tooltips
    d3.selectAll('.timeline-tooltip').remove();
  }
};

// Make globally accessible
window.TimelineViz = TimelineViz;
