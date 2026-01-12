/**
 * API Client for TripleThink REST API
 * Handles all HTTP requests with error handling
 */

// Determine API base URL based on how GUI is being served
const API_BASE = (function() {
  const currentPort = window.location.port;
  // If on port 8080 (GUI server), point to API on port 3000
  if (currentPort === '8080') {
    return 'http://localhost:3000/api';
  }
  // If served from same Express server (port 3000), use relative path
  return '/api';
})();

class APIClient {
  constructor(baseURL = API_BASE) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error: ${endpoint}`, error);
      throw error;
    }
  }

  // Entity operations
  async getEntity(id, options = {}) {
    const params = new URLSearchParams(options);
    return this.request(`/entities/${id}?${params}`);
  }

  async listEntities(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/entities?${params}`);
  }

  async createEntity(type, data) {
    return this.request('/entities', {
      method: 'POST',
      body: JSON.stringify({ type, data }),  // Wrap data properly
    });
  }

  async updateEntity(id, updates) {
    // If updates already has 'data' key, use as-is, otherwise wrap it
    const body = updates.data ? updates : { data: updates };
    return this.request(`/entities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async deleteEntity(id) {
    return this.request(`/entities/${id}`, {
      method: 'DELETE',
    });
  }

  async listFictions() {
    return this.request('/fictions');
  }

  // Metadata operations
  async getMetadata(id) {
    return this.request(`/metadata/${id}`);
  }

  async saveMetadata(data) {
    return this.request('/metadata', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Epistemic queries
  async getCharacterKnowledge(characterId, timestamp) {
    return this.request(
      `/epistemic/character/${characterId}/knowledge?at_timestamp=${timestamp}`
    );
  }

  async getFactBelievers(factId, timestamp) {
    return this.request(
      `/epistemic/fact/${factId}/believers?at_timestamp=${timestamp}`
    );
  }

  async validateScene(sceneData) {
    return this.request('/epistemic/validate-scene', {
      method: 'POST',
      body: JSON.stringify(sceneData),
    });
  }

  // Timeline operations
  async getEventsInRange(startDate, endDate) {
    return this.request(`/temporal/events?from=${startDate}&to=${endDate}`);
  }

  async getEntityStates(entityId, startDate, endDate) {
    return this.request(
      `/temporal/entity/${entityId}/states?from=${startDate}&to=${endDate}`
    );
  }

  // Project operations
  async listProjects() {
    return this.request('/projects');
  }

  async createProject(data) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getProject(id) {
    return this.request(`/projects/${id}`);
  }

  async updateProject(id, data) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteProject(id) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE'
    });
  }

  // Export/Import
  async exportProject(format = 'json') {
    return this.request(`/export/project?format=${format}`);
  }

  async importProject(data, format = 'json') {
    return this.request('/import/project', {
      method: 'POST',
      body: JSON.stringify({ format, data }),
    });
  }

  // Search
  async search(query, filters = {}) {
    const params = new URLSearchParams({ q: query, ...filters });
    return this.request(`/search?${params}`);
  }
}

// Global instance
const api = new APIClient();
