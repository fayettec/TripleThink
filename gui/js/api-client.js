/**
 * API Client for TripleThink REST API
 * Handles all HTTP requests with error handling
 */

const API_BASE = '/api';

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
      body: JSON.stringify({ type, ...data }),
    });
  }

  async updateEntity(id, data) {
    return this.request(`/entities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEntity(id) {
    return this.request(`/entities/${id}`, {
      method: 'DELETE',
    });
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
