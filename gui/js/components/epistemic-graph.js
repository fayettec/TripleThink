/**
 * Epistemic Graph Component
 * Vis.js network graph for visualizing character knowledge states
 */

const EpistemicGraph = {
  network: null,
  currentCharacterId: null,
  currentTimestamp: null,
  container: null,

  async render(containerId, characterId = null, timestamp = null) {
    this.container = document.getElementById(containerId);
    this.currentCharacterId = characterId;
    this.currentTimestamp = timestamp || new Date().toISOString();

    if (!this.container) return;

    // Clear previous content
    this.container.innerHTML = '';

    // Load and display graph
    await this.loadKnowledgeGraph();
  },

  async loadKnowledgeGraph() {
    try {
      let knowledgeData;

      if (this.currentCharacterId) {
        // Load specific character's knowledge
        const response = await api.request(
          `/epistemic/character/${this.currentCharacterId}/knowledge?at_timestamp=${this.currentTimestamp}`
        );
        knowledgeData = response.data;
      } else {
        // Load all characters' knowledge (simplified view)
        knowledgeData = await this.loadAllCharactersKnowledge();
      }

      this.renderGraph(knowledgeData);
    } catch (error) {
      console.error('Failed to load knowledge graph:', error);
      this.container.innerHTML = `
        <div style="text-align: center; padding: var(--space-8); color: var(--color-red-600);">
          <div style="margin-bottom: var(--space-2);">Failed to load knowledge graph</div>
          <div style="font-size: var(--font-size-sm); color: var(--color-gray-600);">
            ${error.message || 'Unknown error'}
          </div>
        </div>
      `;
    }
  },

  async loadAllCharactersKnowledge() {
    // Simplified: just load character entities
    const response = await api.request('/entities?type=character');
    return { characters: response.data || [], facts: [], beliefs: [] };
  },

  renderGraph(knowledgeData) {
    // Create nodes and edges for Vis.js
    const { nodes, edges } = this.buildGraphData(knowledgeData);

    if (nodes.length === 0) {
      this.container.innerHTML = `
        <div style="text-align: center; padding: var(--space-8); color: var(--color-gray-500);">
          <div style="font-size: var(--font-size-xl); margin-bottom: var(--space-2);">🧠</div>
          <div>No knowledge data available</div>
          <div style="font-size: var(--font-size-sm); margin-top: var(--space-2);">
            Create character knowledge states to visualize them here
          </div>
        </div>
      `;
      return;
    }

    // Create Vis.js network
    const data = {
      nodes: new vis.DataSet(nodes),
      edges: new vis.DataSet(edges)
    };

    const options = {
      nodes: {
        shape: 'dot',
        size: 20,
        font: {
          size: 14,
          color: '#374151'
        },
        borderWidth: 2,
        shadow: true
      },
      edges: {
        width: 2,
        shadow: true,
        smooth: {
          type: 'continuous'
        },
        arrows: {
          to: { enabled: true, scaleFactor: 0.5 }
        },
        font: {
          size: 12,
          align: 'middle'
        }
      },
      physics: {
        stabilization: {
          iterations: 100
        },
        barnesHut: {
          gravitationalConstant: -2000,
          springConstant: 0.001,
          springLength: 200
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200
      }
    };

    this.network = new vis.Network(this.container, data, options);

    // Add event listeners
    this.network.on('click', (params) => {
      if (params.nodes.length > 0) {
        this.handleNodeClick(params.nodes[0]);
      }
    });
  },

  buildGraphData(knowledgeData) {
    const nodes = [];
    const edges = [];

    // If we have specific character knowledge
    if (this.currentCharacterId && knowledgeData.knowledge_state) {
      // Add the character node
      nodes.push({
        id: this.currentCharacterId,
        label: knowledgeData.character_name || this.currentCharacterId,
        group: 'character',
        color: { background: '#3B82F6', border: '#2563EB' },
        size: 30
      });

      // Add fact nodes and edges
      const facts = knowledgeData.knowledge_state.facts || [];
      facts.forEach((fact, idx) => {
        const factId = `fact-${idx}`;
        const isTrue = fact.belief === 'true';

        nodes.push({
          id: factId,
          label: fact.content || fact.fact_id || 'Unknown fact',
          group: 'fact',
          color: {
            background: isTrue ? '#10B981' : '#EF4444',
            border: isTrue ? '#059669' : '#DC2626'
          },
          size: 20,
          title: `Confidence: ${fact.confidence || 'unknown'}\nSource: ${fact.source || 'unknown'}`
        });

        edges.push({
          from: this.currentCharacterId,
          to: factId,
          label: isTrue ? 'knows' : 'false belief',
          color: { color: isTrue ? '#10B981' : '#EF4444' },
          dashes: !isTrue
        });
      });
    } else if (knowledgeData.characters) {
      // All characters view - just show character nodes
      knowledgeData.characters.forEach(char => {
        nodes.push({
          id: char.id,
          label: char.name || char.id,
          group: 'character',
          color: { background: '#3B82F6', border: '#2563EB' },
          size: 25
        });
      });
    }

    return { nodes, edges };
  },

  handleNodeClick(nodeId) {
    // Show node details
    console.log('Node clicked:', nodeId);

    // If it's a character node and we're in all-characters view, switch to that character
    if (!this.currentCharacterId && nodeId.startsWith('char-')) {
      this.currentCharacterId = nodeId;
      this.loadKnowledgeGraph();
    }
  },

  destroy() {
    if (this.network) {
      this.network.destroy();
      this.network = null;
    }
  }
};

// Make globally accessible
window.EpistemicGraph = EpistemicGraph;
